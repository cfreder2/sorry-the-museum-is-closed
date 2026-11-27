// Real books about the works on view, from Open Library (openlibrary.org).
//
// tools/books.mjs asks Open Library, once, by hand, for books on the artists the game hangs and on the
// periods and places their works come from, and saves the good matches in data/books.json. Nothing is
// fetched from Open Library while the game runs except a book's cover, and only when that book is in
// front of you (the reading room's display) or its card is open. data/books.json itself is only asked
// for once something wants it.
//
// The same module runs in node (the tool reads TOPICS and the name rules from here) and in the browser.

// A period, a place or a kind of thing a work belongs to. `q` (and `q2` if that finds too few) is what Open Library is asked; a book is
// kept only if its title matches `title`; a work is about the topic if `match` finds its style, maker,
// type or gallery ("style|maker|type|gallery"). The first topic that matches a work is the one used.
export const TOPICS = [
  { id: 'thorne', name: 'The Thorne Miniature Rooms', q: 'Thorne miniature rooms', title: /thorne|miniature rooms/i, match: /Miniature room|Narcissa Thorne/i },
  { id: 'ukiyoe', name: 'Japanese prints', q: 'subject:"Ukiyoe"', title: /ukiyo|floating world|japanese (colou?r |woodblock )?prints|woodblock/i, match: /Japan[^|]*\|[^|]*\|Print/i },
  { id: 'egypt', name: 'Ancient Egyptian art', q: 'subject:"Art, Egyptian"', title: /egypt/i, match: /egypt|\bkingdom\b|ptolemaic|dynasty|predynastic|intermediate period|coptic/i },
  { id: 'etruscan', name: 'Etruscan art', q: 'subject:"Art, Etruscan"', q2: 'title:etruscan subject:"Art"', title: /etrusc/i, match: /etrusc/i },
  { id: 'greek', name: 'Ancient Greek art', q: 'subject:"Art, Greek"', title: /greek|greece/i, match: /Ancient Greek|\bgreek\b|high classical|late classical|archaic|hellenistic|attic|red-figure|corinthian|geometric|cycladic|cypriote|gnathian|orientalizing|south italian|campanian/i },
  { id: 'roman', name: 'Ancient Roman art', q: 'subject:"Art, Roman"', title: /\broman\b|\brome\b/i, match: /Ancient Roman|\broman\b|imperial|antonine|hadrianic/i },
  { id: 'chinese', name: 'Chinese art', q: 'subject:"Art, Chinese"', title: /chin/i, match: /chinese|china/i },
  { id: 'japanese', name: 'Japanese art', q: 'subject:"Art, Japanese"', title: /japan/i, match: /japan/i },
  { id: 'korean', name: 'Korean art', q: 'subject:"Art, Korean"', q2: 'title:"Korean art"', title: /korea/i, match: /korea/i },
  { id: 'himalayan', name: 'Himalayan art', q: 'subject:"Art, Tibetan"', title: /tibet|himalaya/i, match: /himalaya|nepal|tibet|mongolia/i },
  { id: 'india', name: 'The art of India', q: 'subject:"Art, Indic"', title: /india/i, match: /south asian|india|pakistan/i },
  { id: 'seasia', name: 'Art of Southeast Asia', q: 'subject:"Art, Southeast Asian"', title: /southeast asia|khmer|angkor|thai|cambodia/i, match: /southeast asian|khmer|siamese|angkor|thailand|burma|indonesia/i },
  { id: 'islamic', name: 'Islamic art', q: 'subject:"Islamic art"', title: /islam/i, match: /islamic|turkish|iznik|rhodian|türkiye|bukhara|uzbekistan|syria|sultanabad|fostat|morocco|algeria/i },
  { id: 'african', name: 'African art', q: 'subject:"Art, African"', title: /africa/i, match: /yoruba|bankoni|\bvili\b|bamileke|dogon|tellem|luluwa|nguni|zulu|\bkuba\b|\bfang\b/i },
  { id: 'americas', name: 'Art of the ancient Americas', q: 'subject:"Indian art" pre-Columbian', title: /pre-?columbian|ancient americas|maya|aztec|mesoamerica|andes|andean/i, match: /maya|mexica|aztec|jalisco|teotihuac|moche|south american|Aj Maxam/i },
  { id: 'medieval', name: 'Medieval art', q: 'subject:"Art, Medieval"', title: /medieval|middle ages|gothic/i, match: /12th century|13th century|14th century|medieval|byzantine|twelfth|thirteenth|fourteenth/i },
  { id: 'renaissance', name: 'Renaissance art', q: 'subject:"Art, Renaissance"', title: /renaissance/i, match: /renaissance|mannerism|15th century|16th century|fifteenth|sixteenth/i },
  { id: 'baroque', name: 'Baroque art', q: 'subject:"Art, Baroque"', title: /baroque/i, match: /17th century|seventeenth|\bbaroque|flemish|dutch/i },
  { id: 'rococo', name: 'Eighteenth-century art', q: 'subject:"Art, Rococo"', title: /rococo|eighteenth[- ]century|18th[- ]century/i, match: /18th century|eighteenth|rococo|chinoiserie/i },
  { id: 'neoclassicism', name: 'Neoclassicism', q: 'subject:"Neoclassicism (Art)"', title: /neo-?classic/i, match: /neoclassic|empire/i },
  { id: 'realism', name: 'Realism', q: 'subject:"Realism in art" subject:"Painting"', q2: 'subject:"Barbizon school"', title: /realis|barbizon/i, match: /realism|barbizon/i },
  { id: 'postimpressionism', name: 'Post-Impressionism', q: 'subject:"Post-impressionism (Art)"', title: /post-?impressionis/i, match: /post-impressionism|pointillism/i },
  { id: 'impressionism', name: 'Impressionism', q: 'subject:"Impressionism (Art)"', title: /impressionis/i, match: /impressionism/i },
  { id: 'c19', name: 'Nineteenth-century art', q: 'subject:"Art, Modern" nineteenth century', title: /nineteenth[- ]century|19th[- ]century/i, match: /19th century|nineteenth|aestheticism|pre-raphaelite|gothic revival|romanticism|hudson river/i },
  { id: 'modern', name: 'Modern art', q: 'subject:"Modern Art"', q2: 'title:"modern art" subject:"Art, Modern"', title: /modern art|modernism|twentieth[- ]century art|20th[- ]century art/i, match: /modernism|20th century|21st century|cubism|surrealism|expressionism|abstract|contemporary/i },
  { id: 'armor', name: 'Arms and armour', q: 'subject:"Armor"', title: /armou?r/i, match: /\|(Armor|Arms)\|/i },
  { id: 'decorative', name: 'European decorative arts', q: 'subject:"Decorative arts" subject:"History"', q2: 'subject:"Porcelain, European"', title: /decorative arts|porcelain|furniture|silver|interiors/i, match: /\|(Decorative Arts|Ceramics|Furniture|Metalwork|Glass)\|/i },
  // Not about any one work: for the reading room's display.
  { id: 'aic', name: 'The Art Institute of Chicago', q: 'subject:"Art Institute of Chicago"', title: /art institute/i, match: /$^/ },
];

/** The word a book about this maker must have in its title or subjects (a surname, or what they were called). */
export function surname(name) {
  const called = /called (.+)$/i.exec(name); if (called) return called[1].trim();
  const n = name.replace(/\s*\(.*?\)\s*/g, ' ').replace(/^(Sir|Saint|St\.) /i, '').trim();
  const special = { 'Francisco José de Goya y Lucientes': 'Goya', 'Hilaire Germain Edgar Degas': 'Degas', 'Rembrandt van Rijn': 'Rembrandt', 'Kitagawa Utamaro': 'Utamaro', 'Katsushika Hokusai': 'Hokusai', 'Utagawa Hiroshige': 'Hiroshige' };
  if (special[n]) return special[n];
  // the last word, which is what a title uses (Gogh in Van Gogh, Toulouse-Lautrec), past any "the Elder"
  const w = n.split(/\s+/).filter(x => !/^(the|Elder|Younger|Jr\.?|II|III)$/i.test(x));
  return w[w.length - 1] || n;
}
const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
export const nameKey = norm;

// ---------------------------------------------------------------- in the browser
export const coverUrl = (b, size = 'M') => (b && b.c ? `https://covers.openlibrary.org/b/id/${b.c}-${size}.jpg?default=false` : '');
export const bookUrl = b => `https://openlibrary.org/works/${b.k}`;

let data = null, asked = null;
/** data/books.json, fetched the first time anything asks for it (and only then). Resolves to null if it cannot be had. */
export function loadBooks() {
  if (!asked) asked = fetch(new URL('../data/books.json', import.meta.url)).then(r => (r.ok ? r.json() : null)).then(d => {
    if (!d || !d.books) return null;
    const book = k => { const b = d.books[k]; return b ? { k, t: b[0], a: b[1], y: b[2], c: b[3] } : null; };
    const list = ks => (ks || []).map(book).filter(Boolean);
    const artists = new Map(Object.entries(d.artists || {}).map(([n, ks]) => [norm(n), list(ks)]));
    const topics = new Map(Object.entries(d.topics || {}).map(([id, ks]) => [id, list(ks)]));
    data = { artists, topics, all: Object.keys(d.books).map(book) };
    return data;
  }).catch(() => null);
  return asked;
}

/** The topic a work belongs to, or null. */
export function topicOf(w) {
  const s = `${w.s || ''}|${w.a || ''}|${w.k || ''}|${w.g || ''}`;
  return TOPICS.find(t => t.match.test(s)) || null;
}
/** Up to n books about a work: on its maker first, then on its period or place. Needs loadBooks() to have finished. */
export function booksFor(w, n = 2) {
  if (!data || !w) return [];
  const out = [], seen = new Set(), add = b => { if (b && !seen.has(b.k) && out.length < n) { seen.add(b.k); out.push(b); } };
  for (const b of data.artists.get(norm(w.a)) || []) add(b);
  const t = topicOf(w);
  if (out.length < n && t) for (const b of data.topics.get(t.id) || []) add(b);
  return out;
}
