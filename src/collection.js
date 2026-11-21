// Tonight's hang, from the Art Institute of Chicago's public API.
//
// Everything asked for is on view right now. Works go into the room that
// carries their real gallery number. The same module runs in the
// browser (live) and in node (tools/fetch_collection.mjs, which saves the copy
// the game falls back to when the API cannot be reached).

import LAYOUT from './layout.js';

// Works still in copyright (most of the Modern Wing). The museum's terms allow its data to be used
// "for noncommercial educational and personal use and for fair use", keeping every copyright notice
// and citing author and source. So these are shown only live from the museum's own server, at the
// modest size it serves, each with its notice on its label; they are never saved with the game.
// Set this to false and none of them is asked for or shown.
export const SHOW_IN_COPYRIGHT = true;

const API = 'https://api.artic.edu/api/v1/artworks/search';
export const IIIF = 'https://www.artic.edu/iiif/2';
const FIELDS = ['id', 'title', 'artist_title', 'artist_display', 'date_display', 'medium_display', 'image_id',
  'gallery_title', 'dimensions_detail', 'thumbnail', 'artwork_type_title', 'style_title', 'is_boosted',
  'has_not_been_viewed_much', 'is_public_domain', 'copyright_notice'];

// Images come straight from the museum unless an offline copy has been saved
// beside the game (tools/fetch_collection.mjs --images), which is then used.
const local = { sizes: [], ids: new Set(), base: '' };
export function useLocalImages(index, base) {
  local.sizes = (index.sizes || []).slice().sort((a, b) => a - b);
  local.ids = new Set(index.ids || []);
  local.base = base;
}
export const remoteUrl = (work, width) => `${IIIF}/${work.img}/full/${work.c ? Math.min(width, 843) : width},/0/default.jpg`;      // a work in copyright is never asked for larger than the museum's standard size
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
export const AGENT = 'Sorry, the Museum is Closed (hobby browser game' + (CONTACT ? '; ' + CONTACT : '') + ')';

// A GET with the query in `params`. No referrer: artic.edu refuses requests
// that name a page it does not know. Seven requests open the building, and the
// answer is kept for twelve hours, well inside the 60-a-minute anonymous limit.
// In a browser the AIC-User-Agent header costs a CORS preflight per request (artic.edu sends max-age 0), and the
// museum counts those against the same 60-a-minute limit: 35 pages and 35 preflights was more than a minute's
// worth, and a reload or two meant every request was refused. So it goes on the first page of each question only.
async function page(must, n, signal) {
  const q = { query: { bool: { must } }, fields: FIELDS, limit: 100, page: n };
  const res = await fetch(API + '?params=' + encodeURIComponent(JSON.stringify(q)), {
    signal, referrerPolicy: 'no-referrer', headers: NODE ? { 'User-Agent': AGENT, 'AIC-User-Agent': AGENT } : n === 1 ? { 'AIC-User-Agent': AGENT } : {},
  });
  if (!res.ok) throw new Error(res.status === 429 ? 'too many requests (429)' : 'artic.edu answered ' + res.status);
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
    // 1 when the museum names a maker; 0 when all it gives is where the thing came from.
    ar: d.artist_title ? 1 : 0,
    // The copyright notice, for a work that is not in the public domain. Empty for one that is.
    c: d.is_public_domain === false ? (d.copyright_notice || 'Not in the public domain') : '',
  };
}

// What hangs on a wall, and what stands in a glass case.
const WALL = ['Painting', 'Print', 'Textile', 'Drawing and Watercolor'];
const CASE = ['Sculpture', 'Armor', 'Vessel', 'Mask', 'Funerary Object', 'Ceramics', 'Metalwork', 'Glass', 'Arms', 'Architectural fragment', 'Decorative Arts', 'Religious/Ritual Object', 'Furniture'];

export async function fetchLive(signal, { inCopyright = SHOW_IN_COPYRIGHT } = {}) {
  const base = [{ term: { is_public_domain: true } }, { term: { is_on_view: true } }, { exists: { field: 'image_id' } }];
  const of = types => all([...base, { terms: { 'artwork_type_title.keyword': types } }], signal);
  const groups = await Promise.all([of(['Painting']), of(['Sculpture', 'Armor']), of(['Vessel', 'Mask', 'Funerary Object', 'Print', 'Textile', 'Drawing and Watercolor', 'Miniature room']),
    of(['Ceramics', 'Metalwork', 'Glass']), of(['Arms', 'Architectural fragment', 'Decorative Arts', 'Religious/Ritual Object', 'Furniture'])]);
  // And what is on view but still in copyright. If that question fails the building opens without them.
  if (inCopyright) {
    const kinds = [...WALL, ...CASE];
    const more = await all([{ term: { is_public_domain: false } }, { term: { is_on_view: true } }, { exists: { field: 'image_id' } }], signal, 10).catch(() => []);
    groups.push(more.filter(d => kinds.includes(d.artwork_type_title)));
  }
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
    // Sculpture first, then the rest, so a room of pots still leads with its figures.
    const objects = list.filter(w => CASE.includes(w.k) && w.iw && w.ih).sort((a, b) => ((b.k === 'Sculpture') - (a.k === 'Sculpture')) || rank(a, b)).slice(0, 14);
    for (const w of [...wall, ...objects]) used.add(w.id);
    // Name the room after the people in it.
    const names = [];
    for (const w of [...wall, ...objects]) {
      // A named maker gives a surname; otherwise the place or people it came from, as the museum words it.
      const last = w.ar === 0 ? (w.a || '').split(/[,;(]/)[0].trim().slice(0, 22) : lastName(w.a);
      if (last && !names.includes(last)) names.push(last);
      if (names.length === 3) break;
    }
    rooms[r.id] = { gallery: r.gallery, names, wall, objects };
  }
  // A gallery the museum lists nothing for is not left bare: it borrows what its nearest neighbours
  // have more of than they can hang. Every borrowed work keeps its own gallery on its label.
  {
    const at = Object.fromEntries(LAYOUT.rooms.map(r => [r.gallery, r]));
    const spare = raw.works.filter(w => !used.has(w.id) && at[w.g] && w.iw && w.ih && (WALL.includes(w.k) || CASE.includes(w.k)));
    const far = (a, b) => Math.hypot((a.x0 + a.x1 - b.x0 - b.x1) / 2, (a.z0 + a.z1 - b.z0 - b.z1) / 2) + Math.abs(a.y - b.y) * 6;
    const bare = LAYOUT.rooms.filter(r => r.kind === 'gallery' && !r.passage && r.id !== 'G200' && rooms[r.id] && !rooms[r.id].wall.length && !rooms[r.id].objects.length);
    // The emptiest neighbourhoods are served in turn, one work at a time, so no room takes everything near it.
    const want = r => ({ wall: Math.max(4, Math.min(16, Math.round(((r.x1 - r.x0) + (r.z1 - r.z0)) * 0.5))), objects: Math.min(6, Math.floor((r.x1 - r.x0) * (r.z1 - r.z0) / 40)) });
    for (let round = 0; round < 16; round++) for (const r of bare) {
      const set = rooms[r.id], n = want(r);
      for (const [list, kinds, cap] of [[set.wall, WALL, n.wall], [set.objects, CASE, n.objects]]) {
        if (list.length >= cap || list.length > round) continue;
        let best = null, bd = Infinity;
        for (const w of spare) { if (used.has(w.id) || !kinds.includes(w.k)) continue; const d = far(r, at[w.g]) - w.b * 5; if (d < bd) { bd = d; best = w; } }
        if (best) { used.add(best.id); list.push({ ...best, lent: 1 }); }
      }
    }
    for (const r of bare) { const set = rooms[r.id]; set.lent = set.wall.length + set.objects.length > 0; }
  }
  // Griffin Court takes the biggest canvases that did not find a wall.
  const spare = raw.works.filter(w => w.k === 'Painting' && !used.has(w.id) && w.w && w.h && w.h >= 120 && w.h <= 600 && w.w <= 900)
    .sort((a, b) => (b.b - a.b) * 2e4 + (area(b) - area(a))).slice(0, 26);
  rooms.hall = { gallery: 'Griffin Court', names: [], wall: spare, objects: [] };
  return { fetched: raw.fetched, live: !!raw.live, stale: !!raw.stale, why: raw.why || '', rooms };
}

function lastName(artist) {
  if (!artist) return '';
  const called = artist.match(/called\s+(.+)$/);     // "Domenico Theotokópoulos, called El Greco"
  if (called) return called[1].trim();
  if (/^Rembrandt/.test(artist)) return 'Rembrandt';
  const clean = artist.replace(/\(.*?\)/g, '').replace(/,.*$/, '').replace(/\s+(the\s+)?(Younger|Elder|I+)$/i, '').trim();
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

const CACHE = 'after-hours.hang.v4.c';

// Live if the API answers, the cached answer if it did so in the last twelve hours, an older cached answer if the
// API cannot be reached now, and the saved copy only when this browser has never had a live answer. `why` says what
// went wrong when it was not live, for the About screen.
export async function loadCollection({ timeout = 12000 } = {}) {
  let cached = null;
  try {
    cached = JSON.parse(localStorage.getItem(CACHE) || 'null');
    if (cached && Date.now() - Date.parse(cached.fetched) < 12 * 3600e3) return curate({ ...cached, live: true });
  } catch { cached = null; /* no storage, or a bad entry */ }
  try {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), timeout);
    const raw = trim(await fetchLive(ctl.signal));
    clearTimeout(timer);
    if (raw.works.length < 100) throw new Error('too few works came back');
    try { localStorage.setItem(CACHE, JSON.stringify(raw)); } catch { /* full or blocked */ }
    return curate({ ...raw, live: true });
  } catch (err) {
    const why = err.name === 'AbortError' ? 'it did not answer in time' : /Failed to fetch|NetworkError|Load failed/i.test(err.message) ? 'it could not be reached' : err.message;
    if (cached && Array.isArray(cached.works) && cached.works.length >= 100) { console.warn('Live collection unavailable (' + why + '), using the last live answer'); return curate({ ...cached, live: true, stale: true, why }); }
    console.warn('Live collection unavailable, using the saved copy:', why);
    const res = await fetch(new URL('../data/collection.json', import.meta.url));
    return curate({ ...(await res.json()), live: false, why });
  }
}

export async function loadLocalImages() {
  try {
    const base = new URL('../data/img/', import.meta.url);
    const res = await fetch(new URL('index.json', base));
    if (res.ok) useLocalImages(await res.json(), base.href);
  } catch { /* no offline copy: use the museum's server */ }
}
