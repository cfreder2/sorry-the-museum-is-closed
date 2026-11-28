// The books in the shop: the Museum Shop's south room (furnish.js's shop recipe), stocked the way a museum's bookshop is.
//   * Spines in rows on the bookshelves, packed shelf end to shelf end: monographs on the painters whose work hangs here,
//     books on the periods and places the collection comes from (books.js TOPICS), exhibition catalogues of its best-known
//     pictures, and children's picture books. Now and then the last one in a row leans over on its neighbour.
//   * On the other shelves, between the mugs: a book stood face out, or a pile of them lying down, spines to the front.
//   * On the tables: piles of the big art books, the top one's cover up, and a book stood up on each side of the riser.
//   * The revolving racks (furnish.js's cardSpinner): four faces of pockets, a book face out in each. Drive up to one and
//     give it a spin (E); it slows to a stop, ticking round, and says which book it has left facing you.
// furnish.js stands the furniture and leaves a note of every place a book goes (and still throws every die it threw when
// it drew blocks there, so the room furnishes as it did). Every spine and cover is painted once, at start-up, on one shared
// canvas; the books on all the fixed furniture of a room are one mesh, and each rack is one more (it turns, so it is its own).

import * as THREE from 'three';
import { feature } from './features.js';
import { fitText } from './textures.js';
import { once } from './budget.js';      // (a canvas painted once: on a phone it is let go once it is on the graphics card)
import { TOPICS } from './books.js';

const S = 1024;                                                         // the canvas, square
const SERIF = 'Georgia, "Times New Roman", serif', SANS = '"Helvetica Neue", Helvetica, Arial, sans-serif', ROUND = '"Avenir Next", "Trebuchet MS", "Helvetica Neue", Arial, sans-serif';
const rng = s => () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
const seedOf = (x, z) => 1 + ((Math.imul(Math.round(x * 100), 73856093) ^ Math.imul(Math.round(z * 100), 19349663)) >>> 0) % 2147483640;
const pickOf = (r, a) => a[Math.floor(r() * a.length) % a.length];

// ---------------------------------------------------------------- what is on the shelves
// Painters with work in the collection (data/collection.json), for the monographs: surname, and a line under it.
const MONO = [['MONET', 'Claude'], ['CASSATT', 'Mary'], ['UTAMARO', 'Kitagawa'], ['GOYA', 'Prints'], ['GAUGUIN', 'Paul'], ['RENOIR', 'Pierre-Auguste'], ['DEGAS', 'Edgar'],
  ['MANET', 'Édouard'], ['VAN GOGH', 'Vincent'], ['CÉZANNE', 'Paul'], ['COROT', 'Landscapes'], ['MILLET', 'Jean-François'], ['RODIN', 'Auguste'], ['TIEPOLO', 'Giovanni Battista'],
  ['TOULOUSE-LAUTREC', 'Henri de'], ['SARGENT', 'John Singer'], ['KANDINSKY', 'Vasily'], ['COURBET', 'Gustave'], ['PISSARRO', 'Camille'], ['SEURAT', 'Georges'], ['CAILLEBOTTE', 'Gustave'],
  ['EL GRECO', 'Paintings'], ['TURNER', 'J. M. W.'], ['REMBRANDT', 'Etchings'], ['MATISSE', 'Henri'], ['WHISTLER', 'Nocturnes'], ['MORISOT', 'Berthe'], ['SISLEY', 'Alfred'],
  ['RUBENS', 'Peter Paul'], ['MODIGLIANI', 'Amedeo'], ['REDON', 'Odilon'], ['VELÁZQUEZ', 'Diego'], ['BOTTICELLI', 'Sandro'], ['DELACROIX', 'Eugène'], ['DAUMIER', 'Honoré'], ['HOMER', 'Winslow']];
// Catalogues of pictures that hang here: [title, painter]
const CATS = [['A Sunday on La Grande Jatte', 'Seurat'], ['Paris Street; Rainy Day', 'Caillebotte'], ['Water Lilies', 'Monet'], ['The Bedroom', 'Van Gogh'], ['Stacks of Wheat', 'Monet'],
  ['At the Moulin Rouge', 'Toulouse-Lautrec'], ['The Child’s Bath', 'Cassatt'], ['Two Sisters (On the Terrace)', 'Renoir'], ['The Assumption of the Virgin', 'El Greco']];
const KIDS = ['The Lions on the Steps', 'Goodnight, Museum', 'A Mouse in the Miniature Rooms', 'My First Book of Colours', 'Shapes in Art', 'Draw the Museum', 'One, Two, Three'];
// Colours a pale spine is tinted (its vertices carry it): so one painted spine is many books.
const TINTS = [0x9a2a22, 0x2a4a7a, 0x3c6a3a, 0xc9a24a, 0x6a3a6a, 0xc8641a, 0x2a6a6a, 0x7a7a80, 0xd8c8a0, 0x5a2a1a, 0x8aa0b8, 0xb85a6a].map(h => new THREE.Color(h));
const RICH = ['#7a1f1c', '#1d3557', '#2f4f3a', '#3b2a4a', '#1a1a1e', '#6a4a1a', '#0f4c5c', '#8a3a12', '#4a1c2c', '#20303a'];
const KIDBG = ['#f2c230', '#e8553a', '#3aa0d8', '#6ab04c', '#f08aa8', '#8a5ad0', '#f4f0e6'];

// ---------------------------------------------------------------- the canvas: where everything is on it
const SPINE_H = 196, SPINE_ROWS = [2, 204];                             // two rows of spines along the top
const COVER_W = 110, COVER_H = 140, COVER_ROWS = [408, 550, 692, 834], COVER_COLS = 9;      // then four rows of covers
const WHITE = [8, 984, 24, 1000], PAGES = [40, 980, 120, 1018], HEADER = [128, 978, 248, 1022];  // and along the foot: white (for faces coloured by their vertices), page edges, the racks' sign
const inset = q => [q[0] + 0.6, q[1] + 0.6, q[2] - 0.6, q[3] - 0.6];

// A line of lettering, fitted in its box (textures.js fitText), in a colour.
function txt(c, t, x, y, w, h, px, { weight = '700', family = SERIF, color = '#111', lines = 1 } = {}) { c.fillStyle = color; fitText(c, t, { x, y, w, h, px, weight, family, lines }); }

// Spines, painted upright (the lettering runs down them, top to bottom, as on an English-language book).
function spineDesigns() {
  const list = [], src = [], n = Math.max(MONO.length, TOPICS.length);
  for (let i = 0; i < n; i++) {
    if (i < MONO.length) src.push({ kind: 'mono', t: MONO[i][0], sub: MONO[i][1], i });
    if (i < TOPICS.length) src.push({ kind: 'topic', t: TOPICS[i].name, i });
    if (i % 4 === 1 && CATS[i >> 2]) src.push({ kind: 'cat', t: CATS[i >> 2][0], sub: CATS[i >> 2][1], i });
    if (i % 5 === 3 && KIDS[(i / 5) | 0]) src.push({ kind: 'kids', t: KIDS[(i / 5) | 0], i });
  }
  const r = rng(4242); let row = 0, x = 2;
  for (const d of src) {
    const w = d.kind === 'cat' ? 34 + Math.floor(r() * 8) : d.kind === 'kids' ? 28 + Math.floor(r() * 8) : 24 + Math.floor(r() * 14);
    if (x + w > S - 2) { row++; x = 2; if (row >= SPINE_ROWS.length) break; }
    list.push({ ...d, x, y: SPINE_ROWS[row], w, h: SPINE_H, cell: [x, SPINE_ROWS[row], x + w, SPINE_ROWS[row] + SPINE_H], tint: d.kind === 'topic' || (d.kind === 'mono' && d.i % 3 === 2), style: d.kind === 'mono' && d.i % 5 === 4 ? 'cloth' : d.kind, r: r() });
    x += w + 3;
  }
  return list;
}
function paintSpine(c, d) {
  const { x, y, w, h } = d; c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip(); c.translate(x, y);
  let bg, fg, ac, family = SERIF, weight = '700', caps = true;
  if (d.tint) { bg = '#efece6'; fg = '#1c1a18'; ac = '#8c8c8c'; }
  else if (d.style === 'cloth') { bg = RICH[d.i % RICH.length]; fg = '#e3c77a'; ac = '#c9a24a'; }
  else if (d.kind === 'mono') { bg = RICH[(d.i * 3) % RICH.length]; fg = '#f2ead6'; ac = ['#c9a24a', '#d86a4a', '#9ac0d8', '#e8dcc0'][d.i % 4]; }
  else if (d.kind === 'cat') { bg = '#f1ebdd'; fg = '#24201c'; ac = RICH[d.i % RICH.length]; family = SERIF; weight = 'italic 400'; caps = false; }
  else { bg = KIDBG[d.i % KIDBG.length]; fg = bg === '#f4f0e6' || bg === '#f2c230' ? '#2a2420' : '#ffffff'; ac = '#ffffff'; family = ROUND; weight = '800'; caps = false; }
  d.bg = bg;
  c.fillStyle = bg; c.fillRect(0, 0, w, h);
  // the bands and marks at the head and foot
  if (d.style === 'cloth') { c.fillStyle = ac; for (const yy of [8, 13, h - 16, h - 11]) c.fillRect(0, yy, w, 2); }
  else if (d.tint) { c.fillStyle = ac; c.fillRect(0, 0, w, 24); c.fillRect(0, h - 10, w, 3); }
  else if (d.kind === 'mono') { c.fillStyle = ac; c.fillRect(0, 0, w, 5); c.fillRect(0, h - 26, w, 2); c.beginPath(); c.arc(w / 2, h - 13, Math.min(5, w * 0.18), 0, 7); c.fill(); }
  else if (d.kind === 'cat') { c.fillStyle = ac; c.fillRect(0, 0, w, 16); c.fillRect(0, h - 30, w, 30); }
  else { c.fillStyle = 'rgba(255,255,255,0.85)'; c.beginPath(); c.arc(w / 2, 15, w * 0.3, 0, 7); c.fill(); c.fillStyle = bg; c.beginPath(); c.arc(w / 2, 15, w * 0.16, 0, 7); c.fill(); }
  // the lettering, turned to run down the spine
  c.translate(w / 2, 0); c.rotate(Math.PI / 2);
  const t = caps ? d.t.toUpperCase() : d.t;
  if (d.kind === 'mono' || d.style === 'cloth') {
    const top = d.style === 'cloth' ? 20 : 10, foot = d.style === 'cloth' ? 22 : 30;
    if (d.sub && w >= 30) { txt(c, d.t, top + (h - top - foot) * 0.6, 0, (h - top - foot) * 0.72, w * 0.6, w * 0.56, { color: fg, family, weight }); txt(c, d.sub, top + (h - top - foot) * 0.13, 0, (h - top - foot) * 0.24, w * 0.4, w * 0.3, { color: ac, family, weight: 'italic 400' }); }
    else txt(c, d.t, top + (h - top - foot) / 2, 0, h - top - foot - 6, w * 0.6, w * 0.56, { color: fg, family, weight });
  } else if (d.kind === 'cat') {
    txt(c, t, 16 + (h - 46) / 2, 0, h - 54, w * 0.62, w * 0.5, { color: fg, family, weight });
    txt(c, d.sub.toUpperCase(), h - 15, 0, 26, w * 0.5, w * 0.36, { color: '#f1ebdd', family: SANS, weight: '700' });
  } else if (d.tint) {
    txt(c, d.t, 24 + (h - 34) / 2, 0, h - 42, w * 0.62, w * 0.5, { color: fg, family, weight: '700' });
  } else txt(c, t, 30 + (h - 36) / 2, 0, h - 42, w * 0.62, w * 0.52, { color: fg, family, weight });
  c.restore();
}

// Covers. Each is a picture of our own (a few shapes, no reproduction of the work itself) and the book's title.
const band = (c, w, y, h, bg) => { c.fillStyle = bg; c.fillRect(0, y, w, h); };
const dots = (c, w, h, n, cols, r0, r1, seed) => { const r = rng(seed); for (let i = 0; i < n; i++) { c.fillStyle = cols[Math.floor(r() * cols.length)]; c.beginPath(); c.arc(r() * w, r() * h, r0 + r() * (r1 - r0), 0, 7); c.fill(); } };
const titled = (c, w, h, big, small, { y = h - 30, bg = '#f2ead6', fg = '#1a1612', sub = '#6a5a48', family = SERIF } = {}) => { band(c, w, y, h - y, bg); txt(c, big, w / 2, y + (h - y) * 0.36, w - 12, (h - y) * 0.46, 17, { color: fg, family }); if (small) txt(c, small, w / 2, y + (h - y) * 0.76, w - 12, (h - y) * 0.3, 10, { color: sub, family, weight: 'italic 400' }); };
function lionShape(c, x, y, s, col) { c.fillStyle = col; c.beginPath(); c.ellipse(x - s * 0.15, y + s * 0.2, s * 0.75, s * 0.35, 0, 0, 7); c.fill(); c.beginPath(); c.arc(x + s * 0.55, y - s * 0.15, s * 0.42, 0, 7); c.fill(); c.fillRect(x - s * 0.8, y + s * 0.3, s * 0.2, s * 0.45); c.fillRect(x + s * 0.35, y + s * 0.3, s * 0.2, s * 0.45); }
function facade(c, w, y, col) { c.fillStyle = col; c.fillRect(w * 0.12, y, w * 0.76, 6); c.beginPath(); c.moveTo(w * 0.1, y); c.lineTo(w * 0.5, y - 16); c.lineTo(w * 0.9, y); c.fill(); for (let i = 0; i < 6; i++) c.fillRect(w * 0.16 + i * w * 0.13, y + 8, 4, 30); c.fillRect(w * 0.1, y + 38, w * 0.8, 4); for (let i = 0; i < 3; i++) c.fillRect(w * (0.06 - i * 0.02), y + 44 + i * 5, w * (0.88 + i * 0.04), 3); }
const COVERS = [
  { t: 'Seurat and the Making of La Grande Jatte', by: 'an exhibition catalogue', draw(c, w, h) { band(c, w, 0, h * 0.35, '#6f93b4'); band(c, w, h * 0.35, h, '#6f8c3c'); dots(c, w, h - 30, 260, ['#e8d870', '#9ab850', '#4a6a2a', '#c8d8e8', '#e89a5a'], 0.8, 1.8, 11);
    c.fillStyle = '#25242c'; for (const [x, s] of [[34, 1], [74, 0.8]]) { c.beginPath(); c.ellipse(x, 84, 7 * s, 20 * s, 0, 0, 7); c.fill(); c.beginPath(); c.arc(x, 60 - 4 * s, 4.5 * s, 0, 7); c.fill(); c.beginPath(); c.arc(x + 4, 52 - 3 * s, 12 * s, Math.PI, 0); c.fill(); } titled(c, w, h, 'SEURAT', 'La Grande Jatte'); } },
  { t: 'Monet: Water Lilies', by: 'a catalogue', draw(c, w, h) { band(c, w, 0, h, '#36646e'); dots(c, w, h, 60, ['#4a7a86', '#2a5260', '#6a9aa0'], 3, 7, 12); const r = rng(13); for (let i = 0; i < 9; i++) { const x = r() * w, y = 40 + r() * (h - 50); c.fillStyle = '#5c8a46'; c.beginPath(); c.ellipse(x, y, 11, 5, 0, 0.3, 6.0); c.lineTo(x, y); c.fill(); c.fillStyle = '#eaa0b4'; c.beginPath(); c.arc(x + 3, y - 2, 2.6, 0, 7); c.fill(); }
    txt(c, 'MONET', w / 2, 16, w - 14, 20, 20, { color: '#f4f0e6' }); txt(c, 'Water Lilies', w / 2, 33, w - 14, 12, 11, { color: '#d8e8e0', weight: 'italic 400' }); } },
  { t: 'Van Gogh: The Bedroom', by: 'a catalogue', draw(c, w, h) { band(c, w, 0, h, '#6f8fc4'); c.fillStyle = '#b8753e'; c.beginPath(); c.moveTo(0, h); c.lineTo(w * 0.22, h * 0.56); c.lineTo(w * 0.8, h * 0.56); c.lineTo(w, h); c.fill(); c.fillStyle = '#7aa878'; c.fillRect(w * 0.42, h * 0.3, w * 0.2, h * 0.2);
    c.fillStyle = '#e2b03a'; c.beginPath(); c.moveTo(w * 0.55, h * 0.62); c.lineTo(w * 0.95, h * 0.62); c.lineTo(w, h * 0.95); c.lineTo(w * 0.6, h * 0.95); c.fill(); c.fillStyle = '#c4402e'; c.fillRect(w * 0.62, h * 0.74, w * 0.36, h * 0.14); titled(c, w, h, 'VAN GOGH', 'The Bedroom', { y: 0, bg: 'rgba(0,0,0,0)', fg: '#f6e27a', sub: '#f4f0e6' }); } },
  { t: 'Monet: Stacks of Wheat', by: 'a catalogue', draw(c, w, h) { const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#f2c070'); g.addColorStop(0.55, '#e08a50'); g.addColorStop(0.56, '#c89a50'); g.addColorStop(1, '#a8803a'); c.fillStyle = g; c.fillRect(0, 0, w, h);
    for (const [x, s] of [[36, 1], [82, 0.7]]) { c.fillStyle = '#b06a2a'; c.beginPath(); c.moveTo(x - 24 * s, 100); c.quadraticCurveTo(x - 22 * s, 70 - 20 * s, x, 56 + (1 - s) * 20); c.quadraticCurveTo(x + 22 * s, 70 - 20 * s, x + 24 * s, 100); c.fill(); c.fillStyle = '#6a6a9a'; c.fillRect(x - 24 * s, 98, 48 * s, 5); } titled(c, w, h, 'MONET', 'Stacks of Wheat'); } },
  { t: 'Caillebotte: Paris Street; Rainy Day', by: 'a catalogue', draw(c, w, h) { band(c, w, 0, h * 0.45, '#cbbd9e'); band(c, w, h * 0.45, h, '#8e8c86'); c.strokeStyle = '#7a7872'; c.lineWidth = 1; for (let y = 70; y < h - 30; y += 7) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
    c.fillStyle = '#26262a'; for (const [x, y, s] of [[30, 70, 1], [78, 62, 0.8], [56, 52, 0.5]]) { c.beginPath(); c.arc(x, y, 18 * s, Math.PI, 0); c.fill(); c.fillRect(x - 4 * s, y, 8 * s, 34 * s); } titled(c, w, h, 'CAILLEBOTTE', 'Paris Street; Rainy Day'); } },
  { t: 'Toulouse-Lautrec: At the Moulin Rouge', by: 'a catalogue', draw(c, w, h) { band(c, w, 0, h, '#2c4a3a'); c.fillStyle = '#6a3a22'; c.beginPath(); c.moveTo(0, h * 0.62); c.lineTo(w, h * 0.42); c.lineTo(w, h * 0.55); c.lineTo(0, h * 0.78); c.fill(); c.fillStyle = '#e07a30'; c.beginPath(); c.arc(w * 0.68, h * 0.3, 13, 0, 7); c.fill(); c.fillStyle = '#c8d8a0'; c.beginPath(); c.arc(w * 0.3, h * 0.42, 9, 0, 7); c.fill(); c.beginPath(); c.arc(w * 0.85, h * 0.62, 14, 0, 7); c.fill();
    titled(c, w, h, 'TOULOUSE-LAUTREC', 'At the Moulin Rouge', { bg: '#e8d8b0' }); } },
  { t: 'Cassatt: The Child’s Bath', by: 'a catalogue', draw(c, w, h) { band(c, w, 0, h, '#e8dccb'); c.save(); c.translate(w / 2, h / 2); c.rotate(-0.5); for (let i = -10; i < 10; i++) { c.fillStyle = i % 2 ? '#3a6a4a' : '#f4ece0'; c.fillRect(i * 8, -90, 8, 180); } c.restore(); c.fillStyle = '#e8b49a'; c.beginPath(); c.ellipse(w * 0.45, h * 0.4, 16, 20, 0.3, 0, 7); c.fill(); c.fillStyle = '#d8c8a8'; c.beginPath(); c.ellipse(w * 0.5, h * 0.72, 30, 10, 0, 0, 7); c.fill();
    titled(c, w, h, 'CASSATT', 'The Child’s Bath'); } },
  { t: 'Renoir: Two Sisters', by: 'a catalogue', draw(c, w, h) { band(c, w, 0, h, '#5e8a7a'); dots(c, w, h - 30, 50, ['#7aa890', '#3e6a5a', '#a8c8a0', '#e8e0c8'], 3, 8, 14); c.fillStyle = '#c0302a'; c.beginPath(); c.ellipse(w * 0.5, h * 0.3, 22, 9, 0, 0, 7); c.fill(); c.fillStyle = '#f0d0b8'; c.beginPath(); c.arc(w * 0.5, h * 0.4, 11, 0, 7); c.fill(); c.fillStyle = '#2a3a5a'; c.fillRect(w * 0.32, h * 0.48, w * 0.36, h * 0.3);
    titled(c, w, h, 'RENOIR', 'Two Sisters (On the Terrace)'); } },
  { t: 'El Greco: The Assumption of the Virgin', by: 'a catalogue', draw(c, w, h) { band(c, w, 0, h, '#1e1a22'); for (const [x, col, k] of [[0.3, '#b8302a', 1], [0.6, '#2a4a9a', 0.9], [0.45, '#e0b040', 0.6]]) { c.fillStyle = col; c.beginPath(); c.moveTo(w * x - 18 * k, h - 30); c.quadraticCurveTo(w * x - 26 * k, h * 0.4, w * x, 10 + (1 - k) * 40); c.quadraticCurveTo(w * x + 26 * k, h * 0.4, w * x + 18 * k, h - 30); c.fill(); }
    titled(c, w, h, 'EL GRECO', 'The Assumption of the Virgin', { bg: '#1e1a22', fg: '#e0c070', sub: '#c8b8a0' }); } },
  { t: 'The Thorne Miniature Rooms', by: 'a guide to the rooms', draw(c, w, h) { band(c, w, 0, h, '#2a2228'); const L = 18, T = 18, R = w - 18, B = h - 44, l = 36, t = 36, r = w - 36, b = B - 22; c.fillStyle = '#6a4a2a'; c.beginPath(); c.moveTo(L, B); c.lineTo(R, B); c.lineTo(r, b); c.lineTo(l, b); c.fill(); c.fillStyle = '#7a5a8a'; c.fillRect(l, t, r - l, b - t); c.fillStyle = '#5a4270'; c.beginPath(); c.moveTo(L, T); c.lineTo(l, t); c.lineTo(l, b); c.lineTo(L, B); c.fill(); c.beginPath(); c.moveTo(R, T); c.lineTo(r, t); c.lineTo(r, b); c.lineTo(R, B); c.fill();
    c.fillStyle = '#ffe0a0'; c.fillRect(w / 2 - 8, t + 8, 16, 20); c.fillStyle = '#e8e0d0'; c.fillRect(w / 2 - 12, b - 18, 24, 18); c.fillStyle = '#ff8a2a'; c.fillRect(w / 2 - 5, b - 9, 10, 6); titled(c, w, h, 'THE THORNE ROOMS', 'Miniature rooms', { bg: '#2a2228', fg: '#f2dca0', sub: '#c8b8c8' }); } },
  { t: 'Japanese Prints', by: 'a catalogue', draw(c, w, h) { band(c, w, 0, h, '#efe6d0'); c.fillStyle = '#2a4a7a'; c.beginPath(); c.moveTo(0, 104); c.quadraticCurveTo(20, 40, 70, 34); c.quadraticCurveTo(46, 50, 50, 70); c.quadraticCurveTo(70, 90, 110, 80); c.lineTo(110, 110); c.lineTo(0, 110); c.fill(); dots(c, 80, 60, 24, ['#ffffff'], 1.4, 3, 15); c.fillStyle = '#c0302a'; c.fillRect(w - 22, 10, 12, 16);
    txt(c, 'JAPANESE PRINTS', w / 2, h - 18, w - 12, 16, 15, { color: '#2a2420' }); } },
  { t: 'Ancient Egyptian Art', by: 'a catalogue', draw(c, w, h) { band(c, w, 0, h, '#d8b878'); for (let i = 0; i < 6; i++) band(c, w, 8 + i * 6, 3, i % 2 ? '#2a4a8a' : '#c9a24a'); c.strokeStyle = '#1e2a5a'; c.fillStyle = '#1e2a5a'; c.lineWidth = 4; c.beginPath(); c.ellipse(w / 2, 70, 28, 12, 0, 0, 7); c.stroke(); c.beginPath(); c.arc(w / 2, 70, 7, 0, 7); c.fill(); c.beginPath(); c.moveTo(w / 2 - 6, 82); c.lineTo(w / 2 - 12, 100); c.quadraticCurveTo(w / 2 - 22, 104, w / 2 - 24, 96); c.stroke();
    titled(c, w, h, 'ANCIENT EGYPT', 'Art of the Nile', { bg: '#1e2a5a', fg: '#e8c870', sub: '#c8d0e8' }); } },
  { t: 'Arms and Armour', by: 'a catalogue', draw(c, w, h) { band(c, w, 0, h, '#24262c'); const g = c.createLinearGradient(30, 0, 80, 0); g.addColorStop(0, '#8a9098'); g.addColorStop(0.5, '#e4e8ec'); g.addColorStop(1, '#7a8088'); c.fillStyle = g; c.beginPath(); c.moveTo(30, 96); c.lineTo(30, 54); c.quadraticCurveTo(30, 22, 55, 22); c.quadraticCurveTo(80, 22, 80, 54); c.lineTo(80, 96); c.fill(); c.fillStyle = '#24262c'; for (const y of [56, 64]) c.fillRect(38, y, 34, 3);
    titled(c, w, h, 'ARMS AND ARMOUR', null, { bg: '#24262c', fg: '#e4e8ec' }); } },
  { t: 'The Lions on the Steps', by: 'a picture book', draw(c, w, h) { band(c, w, 0, h, '#1d3a6a'); dots(c, w, 60, 14, ['#fff8d0'], 0.8, 1.6, 16); for (let i = 0; i < 5; i++) band(c, w, 92 + i * 9, 9, i % 2 ? '#9aa0a8' : '#b8bec6'); lionShape(c, 52, 74, 22, '#d8a842');
    txt(c, 'The Lions on the Steps', w / 2, 22, w - 12, 30, 17, { color: '#ffe8a0', family: ROUND, weight: '800', lines: 2 }); } },
  { t: 'Goodnight, Museum', by: 'a picture book', draw(c, w, h) { band(c, w, 0, h, '#16204a'); dots(c, w, 70, 20, ['#fff8d0', '#c8d8ff'], 0.7, 1.5, 17); c.fillStyle = '#f6e8a8'; c.beginPath(); c.arc(84, 26, 12, 0, 7); c.fill(); c.fillStyle = '#16204a'; c.beginPath(); c.arc(90, 22, 11, 0, 7); c.fill(); facade(c, w, 72, '#d8dce8');
    txt(c, 'Goodnight, Museum', w / 2, h - 16, w - 10, 18, 15, { color: '#ffffff', family: ROUND, weight: '800' }); } },
  { t: 'A Mouse in the Miniature Rooms', by: 'a picture book', draw(c, w, h) { band(c, w, 0, h, '#f0d8a8'); c.fillStyle = '#c87a4a'; c.fillRect(0, 96, w, 44); c.fillStyle = '#8a8a90'; c.beginPath(); c.ellipse(52, 86, 20, 12, 0, 0, 7); c.fill(); c.beginPath(); c.arc(70, 76, 8, 0, 7); c.fill(); c.fillStyle = '#e8a0a8'; c.beginPath(); c.arc(68, 68, 4, 0, 7); c.fill(); c.strokeStyle = '#8a8a90'; c.lineWidth = 2; c.beginPath(); c.moveTo(32, 88); c.quadraticCurveTo(14, 96, 20, 78); c.stroke();
    txt(c, 'A Mouse in the Miniature Rooms', w / 2, 26, w - 10, 40, 16, { color: '#5a2a1a', family: ROUND, weight: '800', lines: 3 }); } },
  { t: 'My First Book of Colours', by: 'a picture book', draw(c, w, h) { band(c, w, 0, h, '#fbf8f0'); ['#e8443a', '#f2a830', '#f2d830', '#4ab04a', '#3a8ad8', '#8a5ad0'].forEach((col, i) => { c.fillStyle = col; c.beginPath(); c.arc(26 + (i % 3) * 29, 64 + Math.floor(i / 3) * 30, 12, 0, 7); c.fill(); });
    txt(c, 'My First Book of Colours', w / 2, 24, w - 10, 34, 16, { color: '#2a2420', family: ROUND, weight: '800', lines: 2 }); } },
  { t: 'Shapes in Art', by: 'a picture book', draw(c, w, h) { band(c, w, 0, h, '#f4cc30'); c.fillStyle = '#d8302a'; c.beginPath(); c.arc(36, 66, 20, 0, 7); c.fill(); c.fillStyle = '#2a4a9a'; c.fillRect(58, 48, 34, 34); c.fillStyle = '#1a1a1a'; c.beginPath(); c.moveTo(30, 118); c.lineTo(56, 88); c.lineTo(82, 118); c.fill();
    txt(c, 'Shapes in Art', w / 2, 20, w - 10, 22, 19, { color: '#1a1a1a', family: ROUND, weight: '800' }); } },
  { t: 'One, Two, Three at the Museum', by: 'a picture book', draw(c, w, h) { band(c, w, 0, h, '#3aa0d8'); [['1', '#f4cc30'], ['2', '#e8553a'], ['3', '#ffffff']].forEach(([n, col], i) => txt(c, n, 22 + i * 33, 74, 30, 46, 46, { color: col, family: ROUND, weight: '900' }));
    txt(c, 'One, Two, Three at the Museum', w / 2, 24, w - 10, 34, 16, { color: '#ffffff', family: ROUND, weight: '800', lines: 2 }); facade(c, w, 112, 'rgba(255,255,255,0.35)'); } },
  { t: 'Modern Art', by: 'a survey', draw(c, w, h) { band(c, w, 0, h, '#f4f0e6'); c.fillStyle = '#d8302a'; c.fillRect(8, 8, 56, 52); c.fillStyle = '#2a4a9a'; c.fillRect(70, 66, 32, 40); c.fillStyle = '#f4cc30'; c.fillRect(8, 86, 26, 20); c.fillStyle = '#1a1a1a'; for (const x of [66, 36]) c.fillRect(x, 0, 4, 110); for (const y of [62, 82]) c.fillRect(0, y, w, 4);
    titled(c, w, h, 'MODERN ART', null, { bg: '#1a1a1a', fg: '#f4f0e6' }); } },
  { t: 'Ancient Greek Art', by: 'a catalogue', draw(c, w, h) { band(c, w, 0, h, '#c8682e'); c.fillStyle = '#1a1412'; c.beginPath(); c.moveTo(46, 14); c.lineTo(64, 14); c.lineTo(62, 26); c.quadraticCurveTo(90, 44, 76, 84); c.quadraticCurveTo(70, 98, 62, 102); c.lineTo(48, 102); c.quadraticCurveTo(40, 98, 34, 84); c.quadraticCurveTo(20, 44, 48, 26); c.fill(); c.strokeStyle = '#1a1412'; c.lineWidth = 3; for (const s of [-1, 1]) { c.beginPath(); c.arc(55 + s * 18, 32, 8, 0, 7); c.stroke(); }
    c.fillStyle = '#c8682e'; c.fillRect(30, 56, 50, 3); titled(c, w, h, 'ANCIENT GREECE', 'Vases and bronzes', { bg: '#1a1412', fg: '#e8a060', sub: '#c8a890' }); } },
  { t: 'Chinese Art', by: 'a catalogue', draw(c, w, h) { band(c, w, 0, h, '#f6f4ee'); c.fillStyle = '#ffffff'; c.strokeStyle = '#1e3a8a'; c.lineWidth = 3; c.beginPath(); c.moveTo(44, 12); c.lineTo(66, 12); c.quadraticCurveTo(64, 26, 80, 46); c.quadraticCurveTo(92, 76, 70, 102); c.lineTo(40, 102); c.quadraticCurveTo(18, 76, 30, 46); c.quadraticCurveTo(46, 26, 44, 12); c.fill(); c.stroke();
    c.lineWidth = 2; for (const y of [50, 60, 86]) { c.beginPath(); c.moveTo(30, y); c.quadraticCurveTo(55, y + 6, 80, y); c.stroke(); } c.fillStyle = '#1e3a8a'; c.beginPath(); c.arc(55, 72, 6, 0, 7); c.fill(); titled(c, w, h, 'CHINESE ART', 'Bronze, jade, porcelain', { bg: '#1e3a8a', fg: '#f6f4ee', sub: '#c8d4f0' }); } },
  { t: 'Impressionism', by: 'a survey', draw(c, w, h) { band(c, w, 0, h, '#a8c0d8'); dots(c, w, h, 140, ['#f2e0a0', '#e8a0a0', '#a0c8a0', '#ffffff', '#8aa0d8', '#e8c070'], 2, 5, 18); titled(c, w, h, 'IMPRESSIONISM', 'Paris, 1874–1886'); } },
  { t: 'Highlights of the Collection', by: 'a guide', draw(c, w, h) { band(c, w, 0, h, '#2a3a4a'); facade(c, w, 38, '#e8e4dc'); lionShape(c, 14, 98, 6, '#9aa0a0'); lionShape(c, 92, 98, 6, '#9aa0a0'); titled(c, w, h, 'HIGHLIGHTS', 'of the Collection', { bg: '#7a1f1c', fg: '#f2ead6', sub: '#e8c8a8' }); } },
];
// And the monographs, typeset: the painter's name, large, over a few shapes in colours of their own.
for (const [name, line, bg, fg, motif] of [['DEGAS', 'Dancers', '#e8d8d0', '#3a2a2a', 'tutu'], ['GAUGUIN', 'Paul', '#d8701a', '#f4f0e6', 'blocks'], ['CÉZANNE', 'Still lifes', '#2a3a2a', '#f2e8d0', 'apples'], ['MANET', 'Édouard', '#f4f2ec', '#1a1a1a', 'blocks'],
  ['GOYA', 'Prints', '#1a1a1e', '#e8c860', 'glow'], ['UTAMARO', 'Kitagawa', '#efe4cc', '#1a1412', 'apples'], ['REMBRANDT', 'Etchings', '#2a1e14', '#e8c070', 'glow'], ['MATISSE', 'Henri', '#f4f0e6', '#1e3a9a', 'leaves'],
  ['HOMER', 'Winslow', '#1e4a6a', '#f4f0e6', 'waves'], ['MORISOT', 'Berthe', '#d8e4ec', '#3a3a5a', 'apples'], ['KANDINSKY', 'Vasily', '#f2ecd8', '#1a1a1a', 'circles'], ['SARGENT', 'John Singer', '#14141a', '#e8e0d0', 'glow']]) {
  COVERS.push({ t: name.charAt(0) + name.slice(1).toLowerCase(), by: 'a monograph', draw(c, w, h) {
    band(c, w, 0, h, bg); const r = rng(name.length * 97 + name.charCodeAt(0));
    if (motif === 'glow') { const g = c.createRadialGradient(w / 2, 44, 4, w / 2, 44, 50); g.addColorStop(0, fg); g.addColorStop(1, bg); c.fillStyle = g; c.fillRect(0, 0, w, 96); }
    else if (motif === 'waves') { c.strokeStyle = '#8ac0d8'; c.lineWidth = 3; for (let y = 20; y < 96; y += 12) { c.beginPath(); for (let x = 0; x <= w; x += 4) c.lineTo(x, y + Math.sin(x * 0.12 + y) * 4); c.stroke(); } }
    else if (motif === 'leaves') { for (let i = 0; i < 5; i++) { c.fillStyle = ['#1e3a9a', '#e8553a', '#2a8a4a'][i % 3]; c.beginPath(); const x = 14 + r() * 80, y = 14 + r() * 70; c.ellipse(x, y, 7, 18, r() * 3, 0, 7); c.fill(); } }
    else if (motif === 'circles') { for (let i = 0; i < 6; i++) { c.strokeStyle = c.fillStyle = ['#d8302a', '#2a4a9a', '#f4cc30', '#1a1a1a'][i % 4]; c.lineWidth = 2; c.beginPath(); c.arc(14 + r() * 82, 14 + r() * 70, 4 + r() * 16, 0, 7); i % 2 ? c.stroke() : c.fill(); } c.beginPath(); c.moveTo(10, 90); c.lineTo(100, 20); c.stroke(); }
    else if (motif === 'tutu') { c.fillStyle = '#f0b8c0'; c.beginPath(); c.ellipse(w / 2, 62, 34, 10, 0, 0, 7); c.fill(); c.fillStyle = '#e8c8b0'; c.fillRect(w / 2 - 4, 30, 8, 30); c.beginPath(); c.arc(w / 2, 24, 7, 0, 7); c.fill(); c.fillRect(w / 2 - 6, 70, 3, 24); c.fillRect(w / 2 + 3, 70, 3, 24); }
    else if (motif === 'apples') { for (let i = 0; i < 5; i++) { c.fillStyle = ['#c0302a', '#e08a30', '#6a9a3a', '#d8b040'][i % 4]; c.beginPath(); c.arc(22 + i * 17, 70 - (i % 2) * 10, 11, 0, 7); c.fill(); } c.fillStyle = fg; c.globalAlpha = 0.2; c.fillRect(8, 82, w - 16, 4); c.globalAlpha = 1; }
    else { c.fillStyle = fg; c.fillRect(12, 14, 40, 56); c.fillStyle = '#c0302a'; c.fillRect(58, 34, 40, 36); c.fillStyle = fg; c.globalAlpha = 0.4; c.fillRect(12, 76, 86, 10); c.globalAlpha = 1; }
    txt(c, name, w / 2, 108, w - 12, 22, 22, { color: fg }); txt(c, line, w / 2, 127, w - 16, 12, 11, { color: fg, weight: 'italic 400' });
  } });
}

// The one canvas, painted once.
function paintAtlas(spines) {
  const cv = document.createElement('canvas'); cv.width = cv.height = S; const c = cv.getContext('2d');
  c.fillStyle = '#7a7268'; c.fillRect(0, 0, S, S);
  for (const d of spines) paintSpine(c, d);
  COVERS.forEach((cv0, i) => {
    const x = 2 + (i % COVER_COLS) * (COVER_W + 3), y = COVER_ROWS[Math.floor(i / COVER_COLS)]; cv0.cell = [x, y, x + COVER_W, y + COVER_H];
    c.save(); c.beginPath(); c.rect(x, y, COVER_W, COVER_H); c.clip(); c.translate(x, y); cv0.draw(c, COVER_W, COVER_H); c.restore();
  });
  c.fillStyle = '#ffffff'; c.fillRect(WHITE[0] - 6, WHITE[1] - 6, WHITE[2] - WHITE[0] + 12, WHITE[3] - WHITE[1] + 12);
  c.fillStyle = '#ebe3cd'; c.fillRect(PAGES[0], PAGES[1], PAGES[2] - PAGES[0], PAGES[3] - PAGES[1]);
  c.fillStyle = 'rgba(120,100,70,0.28)'; for (let y = PAGES[1] + 1; y < PAGES[3]; y += 3) c.fillRect(PAGES[0], y, PAGES[2] - PAGES[0], 1);
  c.fillStyle = '#6e6458'; c.fillRect(PAGES[0], PAGES[1], PAGES[2] - PAGES[0], 4); c.fillRect(PAGES[0], PAGES[3] - 4, PAGES[2] - PAGES[0], 4);      // the boards either side of the pages
  c.fillStyle = '#16231d'; c.fillRect(HEADER[0], HEADER[1], HEADER[2] - HEADER[0], HEADER[3] - HEADER[1]);
  c.fillStyle = '#c9a24a'; c.fillRect(HEADER[0] + 3, HEADER[1] + 3, HEADER[2] - HEADER[0] - 6, 2); c.fillRect(HEADER[0] + 3, HEADER[3] - 5, HEADER[2] - HEADER[0] - 6, 2);
  txt(c, 'BOOKS', (HEADER[0] + HEADER[2]) / 2, (HEADER[1] + HEADER[3]) / 2 + 1, HEADER[2] - HEADER[0] - 16, 30, 30, { color: '#f2dca0' });
  return cv;
}

// ---------------------------------------------------------------- books into one mesh
// Boxes whose seen faces each show a piece of the canvas: [cell, turn, colour]. A cell is in canvas pixels; turn (0 to 3)
// turns what is shown on the face a quarter at a time; the colour (linear) multiplies it (white shows the canvas as painted).
const FACES = {
  pz: (x0, x1, y0, y1, z0, z1) => [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [0, 0, 1]],
  nz: (x0, x1, y0, y1, z0, z1) => [[x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [0, 0, -1]],
  px: (x0, x1, y0, y1, z0, z1) => [[x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [1, 0, 0]],
  nx: (x0, x1, y0, y1, z0, z1) => [[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [-1, 0, 0]],
  py: (x0, x1, y0, y1, z0, z1) => [[x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], [0, 1, 0]],
};
class Pile {
  constructor() { this.p = []; this.n = []; this.t = []; this.c = []; this.i = []; this.M = new THREE.Matrix4(); this.N = new THREE.Matrix3(); this.v = new THREE.Vector3(); }
  at(M) { this.M.copy(M); this.N.getNormalMatrix(M); return this; }
  box(x0, x1, y0, y1, z0, z1, F) { for (const k in F) if (F[k]) this.face(FACES[k](x0, x1, y0, y1, z0, z1), F[k]); }
  face(q, [cell, turn, col]) {
    const k = this.p.length / 3, e = inset(cell), uv = [[e[0], e[3]], [e[2], e[3]], [e[2], e[1]], [e[0], e[1]]];
    for (let j = 0; j < 4; j++) { this.v.set(q[j][0], q[j][1], q[j][2]).applyMatrix4(this.M); this.p.push(this.v.x, this.v.y, this.v.z); const t = uv[(j + turn) % 4]; this.t.push(t[0] / S, 1 - t[1] / S); this.c.push(col.r, col.g, col.b); }
    this.v.set(q[4][0], q[4][1], q[4][2]).applyMatrix3(this.N).normalize(); for (let j = 0; j < 4; j++) this.n.push(this.v.x, this.v.y, this.v.z);
    this.i.push(k, k + 1, k + 2, k, k + 2, k + 3);
  }
  get count() { return this.p.length / 3; }
  mesh(mat) {
    if (!this.i.length) return null;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.t, 2)); g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
    g.setIndex(this.count > 65535 ? new THREE.Uint32BufferAttribute(this.i, 1) : new THREE.Uint16BufferAttribute(this.i, 1));
    g.computeBoundingBox(); g.computeBoundingSphere();
    this.p = this.n = this.t = this.c = this.i = null;
    return new THREE.Mesh(g, mat);
  }
}
const WHITE_C = new THREE.Color(1, 1, 1), PAGE_C = new THREE.Color(1, 1, 1), _m = new THREE.Matrix4(), _r = new THREE.Matrix4(), _e = new THREE.Euler();
// The frame furnish.js gave an item (u across, y up, d out from its back), as a matrix into the world.
const frameOf = m => new THREE.Matrix4().makeBasis(new THREE.Vector3(m.fz, 0, -m.fx), new THREE.Vector3(0, 1, 0), new THREE.Vector3(m.fx, 0, m.fz)).setPosition(m.x, m.y, m.z);
// base * translate(x, y, z) * turn (about y, then tilted about x)
const place = (base, x, y, z, ry = 0, rx = 0) => _m.copy(base).multiply(_r.makeTranslation(x, y, z)).multiply(_r.makeRotationFromEuler(_e.set(rx, ry, 0, 'YXZ')));

feature({
  id: 'bookshop',
  init(k) {
    const marks = (k.plan.marks || []).filter(m => m.kind === 'books' || m.kind === 'bookRack');
    this.racks = []; this.rooms = new Set(); this.spinning = 0;
    if (!marks.length) return;
    const spines = this.spines = spineDesigns();
    const tex = new THREE.CanvasTexture(once(paintAtlas(spines))); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
    // Lit as furnish.js lights everything in the building (src/museum.js): a little glow of its own colour, here the canvas's.
    const mat = this.mat = new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, vertexColors: true, roughness: 0.8, metalness: 0, emissive: 0xffffff, emissiveIntensity: 0.26 });
    mat.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n\ttotalEmissiveRadiance *= vColor.rgb;'); };
    mat.customProgramCacheKey = () => 'bookshop';
    for (const d of spines) d.side = new THREE.Color(d.bg);
    const g = this.group = new THREE.Group(); g.name = 'bookshop'; k.group.add(g);
    const piles = new Map(), pileOf = room => { let p = piles.get(room); if (!p) piles.set(room, p = new Pile()); return p; };
    for (const m of marks) {
      this.rooms.add(m.room);
      if (m.kind === 'bookRack') { this._rack(m, g); continue; }
      const P = pileOf(m.room), base = frameOf(m), r = rng(seedOf(m.x, m.z));
      if (m.table) this._table(P, base, m, r);
      else if (m.stock === 'books') for (const y of [...new Set(m.slots.map(q => q[2]))]) this._row(P, base, -m.w / 2 + 0.006, m.w / 2 - 0.006, y, m.back, r);      // (every shelf furnish.js put books on, end to end)
      else for (const y of [...new Set(m.slots.map(q => q[2]))]) {
        // a 'merch' shelf: a book face out or a pile where furnish.js would have stood a box, the mugs left where they are,
        // and the room between them filled with books standing
        const here = m.slots.filter(q => q[2] === y).sort((p, q) => p[0] - q[0]); let u = -m.w / 2 + 0.006;
        for (const q of here) { if (q[0] - u > 0.07) this._row(P, base, u + 0.004, q[0] - 0.012, y, m.back, r); if (!q[5]) this._mixed(P, base, q, m.back, r); u = Math.max(u, q[1]); }
        if (m.w / 2 - 0.006 - u > 0.07) this._row(P, base, u + 0.004, m.w / 2 - 0.006, y, m.back, r);
      }
    }
    for (const P of piles.values()) { const mesh = P.mesh(mat); if (mesh) { mesh.matrixAutoUpdate = false; g.add(mesh); } }
  },

  // A spine, and the colours of the book it is on: [spine face, the boards seen at the sides].
  _spine(r) { const d = pickOf(r, this.spines), tint = d.tint ? pickOf(r, TINTS) : null; return { d, face: [d, 0, tint || WHITE_C], side: [WHITE, 0, tint ? tint.clone().multiplyScalar(0.9) : d.side] }; },
  _cover(r) { return COVERS[Math.floor(r() * COVERS.length) % COVERS.length]; },

  // A shelf of books standing, spines out, flush with its front edge and packed end to end; now and then a gap near one
  // end, and a book leaning over into it on its neighbour. (How tall a book is goes by what it is: a catalogue is tallest.)
  _row(P, base, u0, u1, y, back, r) {
    const lean = r() < 0.45, left = lean && r() < 0.5, room = lean ? 0.08 + r() * 0.07 : 0;
    const a0 = left ? u0 + room : u0, a1 = left ? u1 : u1 - room, TALL = { cat: [0.29, 0.335], mono: [0.24, 0.31], topic: [0.22, 0.3], kids: [0.2, 0.27] };
    P.at(base); let u = a0, first = null, last = null;
    while (u < a1 - 0.014) {
      const b = this._spine(r), [h0, h1] = TALL[b.d.kind]; let t = b.d.w * 0.00105 * (0.9 + r() * 0.2); if (u + t > a1) { t = a1 - u; if (t < 0.014) break; }
      const bh = h0 + r() * (h1 - h0), dep = 0.19 + r() * 0.07;
      P.box(u, u + t, y, y + bh, back - dep, back, { pz: [b.d.cell, 0, b.face[2]], py: [PAGES, 1, PAGE_C], nx: b.side, px: b.side });
      if (!first) first = { u, bh }; last = { u: u + t, bh }; u += t + (r() < 0.04 ? 0.005 : 0.0008);
    }
    if (!lean || !last) return;
    // the one leaning over into the gap: tipped on the corner of its foot until it rests on the top of the end book
    const b = this._spine(r), t = Math.min(0.035, b.d.w * 0.00105), a = 0.24 + r() * 0.14, end = left ? first : last, bh = Math.min(0.32, end.bh * (1.02 + r() * 0.08));
    const foot = left ? end.u - end.bh * Math.tan(a) * 0.98 : end.u + end.bh * Math.tan(a) * 0.98;
    if (left ? foot - t * Math.cos(a) < u0 + 0.004 : foot + t * Math.cos(a) > u1 - 0.004) return;
    P.at(place(base, foot, y, 0, 0, 0).multiply(_r.makeRotationZ(left ? -a : a)));
    P.box(left ? -t : 0, left ? 0 : t, 0, bh, back - 0.21, back, { pz: [b.d.cell, 0, b.face[2]], py: [PAGES, 1, PAGE_C], nx: b.side, px: b.side });
    P.at(base);
  },
  // A book lying down, spine to the front (+z), its cover up: x across (the book's height), y up, z in from the spine.
  _lying(P, M, w, t, dep, r) {
    const b = this._spine(r);
    P.at(M); P.box(-w / 2, w / 2, 0, t, -dep, 0, { pz: [b.d.cell, 3, b.face[2]], py: b.side, px: [PAGES, 0, PAGE_C], nx: [PAGES, 0, PAGE_C] });
  },
  // A book lying down with its cover up the right way for whoever stands at +z: the spine on its left (-x), pages to the front.
  _flat(P, M, w, t, dep, cover, r) {
    const b = this._spine(r);
    P.at(M); P.box(-w / 2, w / 2, 0, t, -dep / 2, dep / 2, { py: cover ? [cover.cell, 0, WHITE_C] : b.side, nx: [b.d.cell, 3, b.face[2]], pz: [PAGES, 0, PAGE_C], px: [PAGES, 0, PAGE_C], nz: b.side });
  },
  // A book stood up face out, leaning back a little: its foot's front edge at the origin of M, x across, the cover facing +z.
  _faceOut(P, M, w, h, t, cover, r) {
    const b = this._spine(r);
    P.at(M); P.box(-w / 2, w / 2, 0, h, -t, 0, { pz: [cover.cell, 0, WHITE_C], py: [PAGES, 1, PAGE_C], px: [PAGES, 1, PAGE_C], nx: b.side });
  },
  // Between the mugs on a 'merch' shelf: a book stood face out where there is the height for it, otherwise a pile.
  _mixed(P, base, [u0, u1, y, h, dd], back, r) {
    const w = u1 - u0, uc = (u0 + u1) / 2;
    if (h > 0.16 && w >= 0.13 && r() < 0.6) {
      const bw = Math.min(w - 0.01, 0.15 + r() * 0.08), bh = Math.min(0.33, bw * (1.08 + r() * 0.24)), t = 0.01 + r() * 0.015;
      this._faceOut(P, place(base, uc, y, back - 0.05, (r() - 0.5) * 0.12, -0.13), bw, bh, t, this._cover(r), r);
    } else {
      const n = Math.max(1, Math.round(h / 0.034)); let yy = y;
      for (let i = 0; i < n && yy < y + h + 0.02; i++) { const t = 0.022 + r() * 0.02, bw = Math.max(0.12, Math.min(0.3, w * (0.82 + r() * 0.18))); this._lying(P, place(base, uc + (r() - 0.5) * 0.02, yy, back - 0.01 - r() * 0.02, (r() - 0.5) * 0.12), bw, t, 0.16 + r() * 0.08, r); yy += t; }
    }
  },
  // A shop table: piles of art books, the top one's cover up, and a book stood up on each side of the riser.
  _table(P, base, m, r) {
    for (const [u, d, bw, n] of m.piles) {
      const face = d < 0.6 ? Math.PI : 0;      // (read from the side of the table it is nearer)
      let yy = 0.84;
      for (let i = 0; i < n; i++) { const t = 0.026 + r() * 0.016; this._flat(P, place(base, u + (r() - 0.5) * 0.02, yy, d + (r() - 0.5) * 0.02, face + (r() - 0.5) * 0.14), Math.min(0.36, bw * (0.82 + r() * 0.14)), t, 0.24 + r() * 0.05, i === n - 1 ? this._cover(r) : null, r); yy += t; }
    }
    for (const [d, ry] of [[0.7, 0], [0.5, Math.PI]]) {
      const t = 0.022, h = 0.3, a = 0.07, M = place(base, 0, 0.84, d + (ry ? -1 : 1) * (t + h * Math.sin(a) + 0.006), ry, -a);
      this._faceOut(P, M, 0.24, h, t, this._cover(r), r);
    }
  },

  // ---------------------------------------------------------------- the revolving racks
  // Four faces of five pockets round a square post, on furnish.js's pole; a book face out in each pocket and a sign on top.
  _rack(m, parent) {
    const grp = new THREE.Group(); grp.position.set(m.x, m.y, m.z); grp.rotation.y = Math.atan2(m.fx, m.fz); parent.add(grp);
    const P = new Pile(), r = rng(seedOf(m.x, m.z) + 7), I = new THREE.Matrix4(), wire = new THREE.Color(0xb8bec6), post = new THREE.Color(0x2e3238), A = 0.072, TIERS = [0.42, 0.692, 0.964, 1.236, 1.508];
    P.at(I).box(-A, A, 0.4, 1.8, -A, A, { pz: [WHITE, 0, post], nz: [WHITE, 0, post], px: [WHITE, 0, post], nx: [WHITE, 0, post] });
    const books = [[], [], [], []], start = Math.floor(r() * COVERS.length);
    for (let f = 0; f < 4; f++) {
      const F = new THREE.Matrix4().makeRotationY(f * Math.PI / 2);
      P.at(F);
      for (const ty of TIERS) {
        P.box(-0.132, 0.132, ty, ty + 0.006, A, 0.122, { py: [WHITE, 0, wire], pz: [WHITE, 0, wire] });      // the shelf of the pocket
        P.box(-0.132, 0.132, ty + 0.03, ty + 0.042, 0.119, 0.123, { pz: [WHITE, 0, wire], nz: [WHITE, 0, wire], py: [WHITE, 0, wire] });      // the wire across its front
      }
      for (const sx of [-1, 1]) P.box(sx * 0.132 - 0.003, sx * 0.132 + 0.003, 0.4, 1.78, 0.115, 0.123, { pz: [WHITE, 0, wire], px: [WHITE, 0, wire], nx: [WHITE, 0, wire] });
      TIERS.forEach((ty, i) => {
        const cover = COVERS[(start + f * 5 + i * 2 + (f * i) % 3) % COVERS.length], bw = 0.17 + r() * 0.045, bh = Math.min(0.245, bw * (1.1 + r() * 0.22)), t = 0.008 + r() * 0.01;
        const a = Math.asin(Math.min(0.5, (0.116 - t - A - 0.004) / bh));
        this._faceOut(P, F.clone().multiply(place(I, (r() - 0.5) * 0.01, ty + 0.006, 0.116, 0, -a)), bw, bh, t, cover, r);
        books[f][i] = cover;
      });
      P.at(F).box(-0.136, 0.136, 1.8, 1.9, -0.136, 0.136, { pz: [HEADER, 0, WHITE_C] });      // the sign over each face
    }
    P.at(I).box(-0.136, 0.136, 1.8, 1.9, -0.136, 0.136, { py: [WHITE, 0, post] });
    const mesh = P.mesh(this.mat); grp.add(mesh);
    this.racks.push({ m, grp, room: m.room, at: { x: m.x, y: m.y, z: m.z }, books, w: 0, turned: 0, told: true, base: grp.rotation.y });
  },

  // The book facing you, on the face of the rack turned most nearly your way, at the height of your eye.
  _facing(rk, k) {
    const cam = k.G.camera ? k.G.camera.position : k.pos, a = Math.atan2(cam.x - rk.at.x, cam.z - rk.at.z) - rk.grp.rotation.y;
    const f = ((Math.round(a / (Math.PI / 2)) % 4) + 4) % 4, y = cam.y - rk.at.y, tiers = [0.54, 0.81, 1.08, 1.35, 1.62];
    let i = 0; for (let j = 1; j < 5; j++) if (Math.abs(tiers[j] - y) < Math.abs(tiers[i] - y)) i = j;
    return rk.books[f][i];
  },

  near(v, k) {
    if (!this.racks.length || !k.room || !this.rooms.has(k.room.id)) return null;
    let best = null, bd = 0.95 * 0.95;
    for (const rk of this.racks) { if (rk.room !== k.room.id || !k.close(rk.at, 0.95, 1.2)) continue; const d = (k.pos.x - rk.at.x) ** 2 + (k.pos.z - rk.at.z) ** 2; if (d < bd) { bd = d; best = rk; } }
    if (!best) return null;
    const line = Math.abs(best.w) > 0.05 ? 'Round it goes.' : `Facing you: ${this._facing(best, k).t}`;
    return { verb: 'SPIN', hint: 'A revolving rack of books. E to spin it.', card: ['Revolving book rack', line, 'spin the rack'], act: () => this.spin(best, k) };
  },
  // A push: it turns faster, up to a point, and creaks as it goes. (Reduce motion: a gentle push, soon over.)
  spin(rk, k) {
    const calm = !!(k.G.set && k.G.set.reduce), was = Math.abs(rk.w);
    rk.w = Math.min(calm ? 3 : 9, rk.w + (calm ? 2.2 : 4.5)); rk.told = false;
    if (was < 0.05) this.spinning++;
    k.synth.noise(0.32, { vol: 0.03, lp: 700 }); k.synth.note(150 + Math.random() * 30, 0.22, { type: 'sawtooth', vol: 0.006 });
  },
  active() { return this.spinning > 0; },
  update(dt, k) {
    const calm = !!(k.G.set && k.G.set.reduce);
    for (const rk of this.racks) {
      if (!rk.w) continue;
      // slowed by friction: a little always, and more the faster it goes (calmer still with Reduce motion)
      const slow = (calm ? 0.9 : 0.45) + (calm ? 0.5 : 0.32) * rk.w;
      rk.w = Math.max(0, rk.w - slow * dt);
      const before = Math.floor(rk.turned / (Math.PI / 2)); rk.turned += rk.w * dt; rk.grp.rotation.y = rk.base + rk.turned;
      if (Math.floor(rk.turned / (Math.PI / 2)) !== before && k.close(rk.at, 8, 3)) k.synth.note(2300 + Math.random() * 200, 0.035, { type: 'square', vol: 0.004 + Math.min(0.008, rk.w * 0.0012) });      // a tick as each face goes by
      if (rk.w < 0.02) {
        rk.w = 0; this.spinning = Math.max(0, this.spinning - 1);
        if (!rk.told && k.close(rk.at, 2.5, 1.5)) { rk.told = true; const b = this._facing(rk, k); k.say(`Facing you: ${b.t}${b.by ? ', ' + b.by : ''}.`, 0, 3.5, true); }
      }
    }
  },
  reset() { for (const rk of this.racks || []) if (rk.w) { rk.w = 0; this.spinning = 0; } },
});
