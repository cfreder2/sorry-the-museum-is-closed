#!/usr/bin/env node
// Finds real books about the works the game hangs, on Open Library, and writes data/books.json.
// Run by hand, now and then; the game only reads the file it writes (and fetches covers live).
//
//   node tools/books.mjs            asks what it has not asked before (answers are kept in tools/.cache/)
//   node tools/books.mjs --fresh    asks everything again
//
// Who to look for comes from the game's own hang: the saved collection (data/collection.json) is sorted
// into the rooms exactly as the game does it (curate + hang), and the makers with the most works up get
// books of their own. The works still in copyright are only ever shown live, so the museum's API is
// asked once (cached) which of those are on view, and their makers are counted too. Every work also
// belongs to a period or a place (TOPICS in src/books.js), and each of those gets a few general books.
//
// Open Library is asked politely: a User-Agent naming the game, one request at a time, a pause between,
// and nothing asked twice. A book is kept only if it has a cover, an English edition, a title that is
// not a blank notebook or a colouring book, an art subject, and (for a maker) their name in its title
// or subjects; fiction is left out.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { curate } from '../src/collection.js';
import { buildPlan, hang } from '../src/plan.js';
import { TOPICS, surname, nameKey } from '../src/books.js';

const UA = 'SorryTheMuseumIsClosed-books/1.0 (a hobby browser game; build-time reading list)';
const FRESH = process.argv.includes('--fresh');
const CACHE = fileURLToPath(new URL('./.cache/books/', import.meta.url));
const OUT = fileURLToPath(new URL('../data/books.json', import.meta.url));
const CAP = 360;                    // books in all, at most
const ARTISTS = 110;                // makers looked up, most hung first
mkdirSync(CACHE, { recursive: true });

let last = 0, asked = 0, cached = 0;
async function get(url, headers = {}) {
  const file = CACHE + createHash('sha1').update(url).digest('hex').slice(0, 20) + '.json';
  if (!FRESH && existsSync(file)) { cached++; return JSON.parse(readFileSync(file, 'utf8')); }
  for (let tries = 0; ; tries++) {
    const wait = last + 1200 - Date.now(); if (wait > 0) await new Promise(r => setTimeout(r, wait));
    last = Date.now(); asked++;
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA, ...headers }, signal: AbortSignal.timeout(40000) });
      if (res.status === 429 || res.status >= 500) throw new Error('HTTP ' + res.status);
      if (!res.ok) { console.log(`  ${res.status} ${url}`); return null; }
      const json = await res.json();
      writeFileSync(file, JSON.stringify(json));
      return json;
    } catch (e) {
      if (tries >= 2) { console.log(`  gave up on ${url}: ${e.message}`); return null; }
      await new Promise(r => setTimeout(r, 5000 * (tries + 1)));
    }
  }
}

// ---------------------------------------------------------------- who the game hangs
const raw = JSON.parse(readFileSync(fileURLToPath(new URL('../data/collection.json', import.meta.url)), 'utf8'));
// The works in copyright on view now, as the game would ask for them (they are never saved with the game).
async function inCopyright() {
  const kinds = ['Painting', 'Print', 'Textile', 'Drawing and Watercolor', 'Sculpture', 'Armor', 'Vessel', 'Mask', 'Funerary Object', 'Ceramics', 'Metalwork', 'Glass', 'Arms', 'Architectural fragment', 'Decorative Arts', 'Religious/Ritual Object', 'Furniture'];
  const out = [];
  for (let n = 1; n <= 10; n++) {
    const q = { query: { bool: { must: [{ term: { is_public_domain: false } }, { term: { is_on_view: true } }, { exists: { field: 'image_id' } }] } },
      fields: ['id', 'title', 'artist_title', 'gallery_title', 'artwork_type_title', 'style_title', 'is_boosted', 'thumbnail', 'image_id'], limit: 100, page: n };
    const d = await get('https://api.artic.edu/api/v1/artworks/search?params=' + encodeURIComponent(JSON.stringify(q)), { 'AIC-User-Agent': UA });
    if (!d || !d.data) break;
    for (const w of d.data) if (kinds.includes(w.artwork_type_title) && w.thumbnail && w.thumbnail.width)
      out.push({ id: w.id, t: w.title || '', a: w.artist_title || '', ar: w.artist_title ? 1 : 0, g: w.gallery_title || '', k: w.artwork_type_title, s: w.style_title || '', b: w.is_boosted ? 1 : 0, q: 0, w: 0, h: 0, iw: w.thumbnail.width, ih: w.thumbnail.height, img: w.image_id, c: 'in copyright' });
    if (n >= (d.pagination && d.pagination.total_pages || 1)) break;
  }
  return out;
}
const live = await inCopyright();
const placed = hang(buildPlan(), curate({ works: [...raw.works, ...live] }));
const weight = new Map(), styles = new Map();
for (const p of placed) {
  const w = p.work;
  if (w.ar && w.a) weight.set(w.a, (weight.get(w.a) || 0) + 1 + (w.b ? 2 : 0));
}
// A maker the museum names, who is a person: "Ancient Egyptian", "Spanish" and the like are left to the topics.
const PEOPLE = a => !/^(Ancient |Spanish$|German$|Italian$|French$|Islamic$|Siamese$|Khmer$|Flemish$|Dutch$|English$|American$|Netherlandish$|Austrian$|Japanese$|Chinese$|Korean$)|Manufactory|Company|Workshop|Factory|Pottery|Unknown|Artist unknown|Inc\.|Ltd/i.test(a);
const makers = [...weight].filter(([a]) => PEOPLE(a)).sort((x, y) => y[1] - x[1]).slice(0, ARTISTS);
for (const p of placed) { const t = TOPICS.find(t => t.match.test(`${p.work.s || ''}|${p.work.a || ''}|${p.work.k || ''}|${p.work.g || ''}`)); if (t) styles.set(t.id, (styles.get(t.id) || 0) + 1); }
console.log(`${placed.length} works hung (${live.length} in copyright on view); ${makers.length} makers to look up; works per topic: ${[...styles].map(([k, n]) => k + ' ' + n).join(', ')}`);

// ---------------------------------------------------------------- asking Open Library
const FIELDS = 'key,title,author_name,first_publish_year,publish_year,cover_i,subject,edition_count,language';
const search = (q, { limit = 30, sort = '' } = {}) => get(`https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&fields=${FIELDS}&limit=${limit}${sort ? '&sort=' + sort : ''}`);

const JUNK = /journal|notebook|planner|diary|calendar|colou?ring|sticker|postcard|puzzle|sketch ?book|composition|password|lined|blank|wall art|poster|greeting|address book|untitled|activity|paint by|jigsaw|\bcards?\b|bookmark|fiction|novels?|poems|poetry|[|{}[\]<>]|\?\?/i;
const FICTION = /fiction|novel|poetry|drama|romance|comic/i;
// Titles in another language (an English edition exists, but the title we would show is not English).
const FOREIGN = /\b(et|les|des|der|das|und|mit|avec|mon|mondo|degli|della|delle|dei|il|gli|nel|sur|pour|une|ein|eine|im|vom|zur|zum|kunst|peinture|pittura|arte|malerei|gusto|cl[aá]sico|y)\b|\b[dl]'/i;
// A general book on a period or place says what it is about in its title.
const ABOUT_ART = /\b(art|arts|artists?|paintings?|painters|sculpture|prints?|ceramics|armou?r|arms|furniture|porcelain|decorative|architecture|rooms|crafts|floating world|masterpieces|treasures|antiquities|baroque|rococo|renaissance|impressionis\w*|realis[mt]\w*|neo-?classic\w*|modernism|interiors|scepter)\b/i;
const ARTY = /\bart|paint|artist|exhibit|catalog|print|sculpt|drawing|criticism|ukiyo|museum|illustrat|antiquit|ceramic|pottery|porcelain|armou?r|arms|decorative|architect|miniature|engrav|etching|woodcut|bronze|archaeolog|furniture|lithograph|watercolou?r|portrait/i;

// "Pollock, Griselda." -> "Griselda Pollock"; the maker themselves (catalogues name them as author) only if no one else is named.
function authorOf(doc, maker) {
  const names = (doc.author_name || []).map(n => n.replace(/\.$/, '').trim()).filter(Boolean);
  const flip = n => (/^[^,()]+, [^,()]+$/.test(n) && !/\b(inc|ltd|museum|institute|gallery|society)\b/i.test(n) ? n.split(', ').reverse().join(' ') : n).replace(/ undifferentiated$/, '');
  const own = n => maker && (nameKey(flip(n)) === nameKey(maker) || nameKey(n).includes(nameKey(surname(maker))));
  const other = names.find(n => !own(n));
  const a = other ? flip(other) : names.length ? (maker ? maker.replace(/\s*\(.*?\)/g, '') : flip(names[0])) : '';
  return (names.length > 2 && other ? a + ' and others' : a).replace(/\s+\.\s+/g, ' ');      // "Andre . Leclerc"
}
function keep(doc, { must = null, title = null } = {}) {
  const t = String(doc.title || '').trim(), subj = (doc.subject || []).join(' | ');
  if (!doc.cover_i || !doc.key || !/^\/works\/OL\d+W$/.test(doc.key)) return false;
  if (t.length < 3 || t.length > 90 || JUNK.test(t) || FOREIGN.test(t)) return false;
  if (!(doc.language || []).includes('eng')) return false;
  if (FICTION.test(subj) && !/juvenile literature|criticism/i.test(subj)) return false;
  if (!ARTY.test(subj) && !ARTY.test(t)) return false;
  if (must && !nameKey(t + ' | ' + subj).includes(nameKey(must))) return false;
  if (title && (!title.test(t) || !ABOUT_ART.test(t))) return false;
  return true;
}
const score = (doc, must) => Math.log2((doc.edition_count || 1) + 1) * 2 + (must && nameKey(doc.title).includes(nameKey(must)) ? 3 : 0)
  - (/juvenile/i.test((doc.subject || []).join(' ')) ? 2.5 : 0) + ((doc.first_publish_year || 0) > 1950 ? 0.5 : 0);

// The year it first came out. Open Library's first_publish_year is sometimes a stray (1649 for a book of 1951),
// so years before 1850 are not believed, nor 1900 (a common stand-in for "not known"); then the earliest edition after that, or no year at all.
const yearOf = d => { const ys = [d.first_publish_year, ...(d.publish_year || [])].filter(y => y >= 1850 && y !== 1900 && y <= new Date().getFullYear()); return ys.length ? Math.min(...ys) : 0; };
const titleKey = t => nameKey(t).replace(/^(the|a|an) /, '').replace(/[^a-z0-9]+/g, ' ').trim();
const books = {}, artists = {}, topics = {};
const count = () => Object.keys(books).length;
function take(docs, n, maker, must) {
  const out = [], titles = new Set();
  for (const d of docs) {
    const tk = titleKey(d.title);
    if (titles.has(tk)) continue;
    const k = d.key.slice('/works/'.length);
    if (!books[k] && count() >= CAP) break;
    titles.add(tk); out.push(k);
    books[k] = books[k] || [String(d.title).trim().replace(/\s+/g, ' '), authorOf(d, maker), yearOf(d), d.cover_i];
    if (out.length >= n) break;
  }
  return out;
}

for (const t of TOPICS) {
  let good = (((await search(t.q, { limit: 100, sort: 'editions' })) || {}).docs || []).filter(d => keep(d, { title: t.title }));
  if (good.length < 3 && t.q2) good = good.concat((((await search(t.q2, { limit: 100, sort: 'editions' })) || {}).docs || []).filter(d => keep(d, { title: t.title }) && !good.some(g => g.key === d.key)));
  const ks = take(good, 4, null, null);
  if (ks.length) topics[t.id] = ks;
  console.log(`  ${t.name}: ${ks.length}`);
}
for (const [i, [maker]] of makers.entries()) {
  if (count() >= CAP) break;
  const must = surname(maker), want = i < 40 ? 3 : 2;
  const plain = maker.replace(/\s*\(.*?\)\s*/g, ' ').trim();          // "Man Ray (Emmanuel Radnitzky)" is asked for as Man Ray
  let docs = ((await search(`person:"${plain}"`)) || {}).docs || [];
  let good = docs.filter(d => keep(d, { must }));
  if (good.length < want) {
    docs = ((await search(plain)) || {}).docs || [];
    good = good.concat(docs.filter(d => keep(d, { must }) && !good.some(g => g.key === d.key)));
  }
  // books with the maker's name in the title first (a book called "Correspondence" says little on a card)
  const named = d => nameKey(d.title).includes(nameKey(must));
  good.sort((a, b) => (named(b) - named(a)) || (score(b, must) - score(a, must)));
  const ks = take(good, want, maker, must);
  if (ks.length) artists[maker] = ks;
  if (i % 10 === 9) console.log(`  ${i + 1} makers looked up, ${count()} books so far`);
}

const out = {
  about: 'Books about the works on view, from Open Library (openlibrary.org). Written by tools/books.mjs. books: work key -> [title, author, first published, cover id].',
  made: new Date().toISOString().slice(0, 10),
  books, artists, topics,
};
writeFileSync(OUT, JSON.stringify(out));
const none = makers.filter(([m]) => !artists[m]).map(([m]) => m);
console.log(`${count()} books: ${Object.keys(artists).length} makers, ${Object.keys(topics).length} topics; ${asked} requests made, ${cached} answered from the cache`);
console.log(`  no book found for ${none.length}: ${none.slice(0, 30).join('; ')}${none.length > 30 ? '…' : ''}`);
