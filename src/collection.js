// Tonight's hang, from the Art Institute of Chicago's public API.
//
// Everything asked for is public domain and on view right now. Works go into
// the room that carries their real gallery number. The same module runs in the
// browser (live) and in node (tools/fetch_collection.mjs, which saves the copy
// the game falls back to when the API cannot be reached).

import LAYOUT from './layout.js';

const API = 'https://api.artic.edu/api/v1/artworks/search';
export const IIIF = 'https://www.artic.edu/iiif/2';
const FIELDS = ['id', 'title', 'artist_title', 'artist_display', 'date_display', 'medium_display', 'image_id',
  'gallery_title', 'dimensions_detail', 'thumbnail', 'artwork_type_title', 'style_title', 'is_boosted',
  'has_not_been_viewed_much'];

// Images come straight from the museum unless an offline copy has been saved
// beside the game (tools/fetch_collection.mjs --images), which is then used.
const local = { sizes: [], ids: new Set(), base: '' };
export function useLocalImages(index, base) {
  local.sizes = (index.sizes || []).slice().sort((a, b) => a - b);
  local.ids = new Set(index.ids || []);
  local.base = base;
}
export const remoteUrl = (work, width) => `${IIIF}/${work.img}/full/${width},/0/default.jpg`;
export function imageUrl(work, width) {
  if (local.ids.has(work.img)) {
    const fit = local.sizes.find(s => s >= width) || local.sizes[local.sizes.length - 1];
    if (fit && (fit >= width || width <= 843)) return `${local.base}${work.img}-${fit}.jpg`;
  }
  return remoteUrl(work, width);
}
export const pageUrl = work => `https://www.artic.edu/artworks/${work.id}`;

const NODE = typeof window === 'undefined';
// The museum asks every app to name itself, with a contact address, in an
// AIC-User-Agent header, so they can get in touch rather than just block it.
const CONTACT = 'cfreder2@nd.edu';
export const AGENT = 'after-hours (hobby browser game' + (CONTACT ? '; ' + CONTACT : '') + ')';

// A GET with the query in `params`. No referrer: artic.edu refuses requests
// that name a page it does not know. Seven requests open the building, and the
// answer is kept for twelve hours, well inside the 60-a-minute anonymous limit.
async function page(must, n, signal) {
  const q = { query: { bool: { must } }, fields: FIELDS, limit: 100, page: n };
  const res = await fetch(API + '?params=' + encodeURIComponent(JSON.stringify(q)), {
    signal, referrerPolicy: 'no-referrer', headers: NODE ? { 'User-Agent': AGENT, 'AIC-User-Agent': AGENT } : { 'AIC-User-Agent': AGENT },
  });
  if (!res.ok) throw new Error('artic.edu answered ' + res.status);
  return res.json();
}

async function all(must, signal, maxPages = 8) {
  const first = await page(must, 1, signal);
  const pages = Math.min(maxPages, first.pagination.total_pages || 1);
  const rest = await Promise.all(Array.from({ length: pages - 1 }, (_, i) => page(must, i + 2, signal)));
  return [first, ...rest].flatMap(p => p.data);
}

function slim(d) {
  const dim = (d.dimensions_detail || []).find(x => x && x.height) || {};
  const th = d.thumbnail || {};
  const artist = d.artist_title || (d.artist_display || '').split('\n')[0] || '';
  return {
    id: d.id, t: d.title || 'Untitled', a: artist, d: d.date_display || '', m: d.medium_display || '',
    img: d.image_id, g: d.gallery_title || '', w: dim.width || 0, h: dim.height || 0,
    iw: th.width || 0, ih: th.height || 0, lq: th.lqip || '', s: d.style_title || '',
    k: d.artwork_type_title || '', b: d.is_boosted ? 1 : 0, q: d.has_not_been_viewed_much ? 1 : 0,
    // The museum's written description, where it says more than what the thing is made of.
    alt: th.alt_text && !/^A work made of/i.test(th.alt_text) ? th.alt_text : '',
  };
}

// What hangs on a wall, and what stands in a glass case.
const WALL = ['Painting', 'Print', 'Textile', 'Drawing and Watercolor'];
const CASE = ['Sculpture', 'Armor', 'Vessel', 'Mask', 'Funerary Object'];

export async function fetchLive(signal) {
  const base = [{ term: { is_public_domain: true } }, { term: { is_on_view: true } }, { exists: { field: 'image_id' } }];
  const of = types => all([...base, { terms: { 'artwork_type_title.keyword': types } }], signal);
  const groups = await Promise.all([of(['Painting']), of(['Sculpture', 'Armor']), of(['Vessel', 'Mask', 'Funerary Object', 'Print', 'Textile', 'Drawing and Watercolor', 'Miniature room'])]);
  const works = groups.flat().filter(d => d.image_id && d.thumbnail && d.thumbnail.width).map(slim);
  return { fetched: new Date().toISOString(), works };
}

const area = w => (w.w && w.h ? w.w * w.h : 4000);
const rank = (a, b) => (b.b - a.b) || (a.q - b.q) || (area(b) - area(a));

// Sort the raw list into the rooms of the real floor plan, by gallery.
export function curate(raw) {
  const byGallery = new Map();
  for (const w of raw.works) {
    if (!w.g) continue;
    if (!byGallery.has(w.g)) byGallery.set(w.g, []);
    byGallery.get(w.g).push(w);
  }
  const rooms = {}, used = new Set();
  for (const r of LAYOUT.rooms) {
    if (r.kind === 'hall') continue;
    const list = byGallery.get(r.gallery) || [];
    if (r.kind === 'corridor') {
      rooms[r.id] = { gallery: r.gallery, names: ['The Thorne Miniature Rooms'], wall: list.filter(w => w.k === 'Miniature room').sort((a, b) => a.t.localeCompare(b.t, undefined, { numeric: true })), objects: [] };
      continue;
    }
    // Paintings first, then anything else flat; and whatever stands up goes in cases.
    const wall = [...list.filter(w => w.k === 'Painting').sort(rank), ...list.filter(w => w.k !== 'Painting' && WALL.includes(w.k)).sort(rank)].slice(0, 24);
    const objects = list.filter(w => CASE.includes(w.k) && w.iw && w.ih).sort(rank).slice(0, 12);
    for (const w of [...wall, ...objects]) used.add(w.id);
    // Name the room after the people in it.
    const names = [];
    for (const w of [...wall, ...objects]) {
      const last = lastName(w.a);
      if (last && !names.includes(last)) names.push(last);
      if (names.length === 3) break;
    }
    rooms[r.id] = { gallery: r.gallery, names, wall, objects };
  }
  // Griffin Court takes the biggest canvases that did not find a wall.
  const spare = raw.works.filter(w => w.k === 'Painting' && !used.has(w.id) && w.w && w.h && w.h >= 120 && w.h <= 600 && w.w <= 900)
    .sort((a, b) => (b.b - a.b) * 2e4 + (area(b) - area(a))).slice(0, 26);
  rooms.hall = { gallery: 'Griffin Court', names: [], wall: spare, objects: [] };
  return { fetched: raw.fetched, live: !!raw.live, rooms };
}

function lastName(artist) {
  if (!artist) return '';
  const called = artist.match(/called\s+(.+)$/);     // "Domenico Theotokópoulos, called El Greco"
  if (called) return called[1].trim();
  if (/^Rembrandt/.test(artist)) return 'Rembrandt';
  const clean = artist.replace(/\(.*?\)/g, '').replace(/,.*$/, '').trim();
  if (/^(workshop|circle|follower|attributed|after|master|unknown)/i.test(clean)) return '';
  const parts = clean.split(/\s+/);
  const particles = new Set(['van', 'de', 'di', 'da', 'del', 'della', 'der', 'den', 'le', 'la', 'von', 'el']);
  let i = parts.length - 1;
  while (i > 0 && particles.has(parts[i - 1].toLowerCase())) i--;
  return parts.slice(i).join(' ');
}

// Keep only what the rooms can hold, so the saved copy stays small.
export function trim(raw) {
  const c = curate(raw);
  const keep = new Map();
  for (const r of Object.values(c.rooms)) for (const w of [...r.wall, ...r.objects]) keep.set(w.id, w);
  return { fetched: raw.fetched, works: [...keep.values()] };
}

const CACHE = 'after-hours.hang.v3';

// Live if the API answers quickly, the cached answer if it did so today, and
// the saved copy otherwise.
export async function loadCollection({ timeout = 7000 } = {}) {
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE) || 'null');
    if (cached && Date.now() - Date.parse(cached.fetched) < 12 * 3600e3) return curate({ ...cached, live: true });
  } catch { /* no storage, or a bad entry */ }
  try {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), timeout);
    const raw = trim(await fetchLive(ctl.signal));
    clearTimeout(timer);
    if (raw.works.length < 100) throw new Error('too few works came back');
    try { localStorage.setItem(CACHE, JSON.stringify(raw)); } catch { /* full or blocked */ }
    return curate({ ...raw, live: true });
  } catch (err) {
    console.warn('Live collection unavailable, using the saved copy:', err.message);
    const res = await fetch(new URL('../data/collection.json', import.meta.url));
    return curate({ ...(await res.json()), live: false });
  }
}

export async function loadLocalImages() {
  try {
    const base = new URL('../data/img/', import.meta.url);
    const res = await fetch(new URL('index.json', base));
    if (res.ok) useLocalImages(await res.json(), base.href);
  } catch { /* no offline copy: use the museum's server */ }
}
