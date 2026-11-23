// The welcome party on the roof terrace of the Modern Wing's west pavilion (src/terrace.js lays the tables and the bar).
// Somebody on the staff has been expecting visitors from the stars, and got the roof ready for them as a small town gets
// its square ready for a national holiday: a big hand-painted WELCOME TO EARTH! across the pergola, smaller signs and
// banners round the terrace (all made up for the game: no film's words or designs), star-and-planet bunting under the
// beams, balloons in the craft's five colours (src/motif.js) tied to the tables and the flowers, a few that got away bumping
// the sunshade, confetti and streamers on the paving, a cake on the bar with a little saucer hovering over it, a guest book
// on a stand by the lift (one signature is in no alphabet at all), and, propped against the cake, a note from the Director.
// Reading it is a page of the Green Cheese file (src/story.js): the fireworks (src/fireworks.js) are the welcome.
//
// Everything stands at real size beside a toy half a metre long; what the toy could touch is solid as drawn, and nothing
// stands in the lift's doorway, the ways round the tables or by the fireworks. The bunting, balloons and confetti are
// instanced (phones). Nothing is done per frame unless the toy is up here.
import * as THREE from 'three';
import { feature } from './features.js';
import { fitText, twoFaced, SANS, rng } from './textures.js';
import { MOTIF_COLOURS } from './motif.js';
import { story } from './story.js';

const HAND = '"Marker Felt", "Chalkboard SE", "Bradley Hand", "Segoe Print", "Comic Sans MS", cursive';
const PEN = '"Bradley Hand", "Segoe Print", "Marker Felt", "Comic Sans MS", cursive';
const CHALK = '"Chalkboard SE", "Marker Felt", "Segoe Print", "Comic Sans MS", cursive';
const COLS = MOTIF_COLOURS;                                  // ice blue, green, yellow, orange, violet
const GREEN = '#6dff9e', INK = '#1a2340';
const PARTY = [...COLS, '#58f07a', '#ffffff'];               // bunting, balloons and confetti: the call's colours, alien green, white

const canvas = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); return c; };
const tex = c => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
// A painted board or cloth: lit a little from within, as everything on the terrace is, so it reads at night.
const board = (c, o = {}) => { const t = tex(c); return new THREE.MeshStandardMaterial({ map: t, roughness: 0.85, emissiveMap: t, emissive: new THREE.Color(0.78, 0.78, 0.78), emissiveIntensity: 0.62, alphaTest: o.alpha ? 0.5 : 0, side: o.side || THREE.FrontSide }); };

// Lettering painted a letter at a time in turn through `cols`, with a dark outline, set by fitText (so never cut off: the
// box is shrunk by the outline's width, and by a little more for the letters measured one by one).
function painted(g, text, { x, y, w, h, px, family = HAND, weight = '700', cols = [INK], line = INK, lw = 0.07, lines = 1 }) {
  let ci = 0;
  return fitText(g, text, { x, y, w: (w - 2 * px * lw) * 0.96, h: h - 2 * px * lw, px, weight, family, lines, paint: (l, cx, cy) => {
    const s = parseFloat((g.font.match(/(\d+(?:\.\d+)?)px/) || [0, px])[1]), chars = [...l], xs = [];
    let xx = cx - g.measureText(l).width / 2;
    g.textAlign = 'left'; for (const ch of chars) { xs.push(xx); xx += g.measureText(ch).width; }
    if (line) { g.lineJoin = 'round'; g.lineWidth = s * lw * 2; g.strokeStyle = line; chars.forEach((ch, i) => g.strokeText(ch, xs[i], cy)); }
    chars.forEach((ch, i) => { g.fillStyle = cols[ci % cols.length]; if (ch !== ' ') ci++; g.fillText(ch, xs[i], cy); });
    g.textAlign = 'center';
  } });
}
// Cloth: a cream sheet with a faint weave and the odd brush drip.
function cloth(g, x, y, w, h, base = '#f3eedf', seed = 1) {
  const r = rng(seed); g.fillStyle = base; g.fillRect(x, y, w, h);
  g.fillStyle = 'rgba(120,100,70,0.06)'; for (let i = 0; i < w * h / 900; i++) g.fillRect(x + r() * w, y + r() * h, 1 + r() * 30, 1);
  g.fillStyle = 'rgba(255,255,255,0.18)'; for (let i = 0; i < w * h / 1600; i++) g.fillRect(x + r() * w, y + r() * h, 1, 1 + r() * 12);
}
const star = (g, x, y, R, fill, k = 0.45) => { g.fillStyle = fill; g.beginPath(); for (let j = 0; j < 10; j++) { const a = -Math.PI / 2 + j * Math.PI / 5, rr = j % 2 ? R * k : R; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); g.fill(); };
// A little saucer, painted: a dome, a rim, three lights.
function saucer(g, x, y, s, rim = '#c9d2dc', dome = GREEN) {
  g.fillStyle = dome; g.beginPath(); g.ellipse(x, y - s * 0.18, s * 0.42, s * 0.36, 0, Math.PI, 0); g.fill();
  g.fillStyle = rim; g.beginPath(); g.ellipse(x, y, s, s * 0.26, 0, 0, Math.PI * 2); g.fill();
  g.strokeStyle = INK; g.lineWidth = Math.max(2, s * 0.06); g.beginPath(); g.ellipse(x, y, s, s * 0.26, 0, 0, Math.PI * 2); g.stroke();
  for (let i = 0; i < 3; i++) { g.fillStyle = COLS[(i * 2) % 5]; g.beginPath(); g.arc(x + (i - 1) * s * 0.5, y + s * 0.05, s * 0.08, 0, 7); g.fill(); }
}
// The Earth, painted by somebody who was in a hurry: blue, three green blobs, a white highlight.
function earth(g, x, y, R) {
  g.fillStyle = '#3d8be0'; g.beginPath(); g.arc(x, y, R, 0, 7); g.fill();
  g.save(); g.beginPath(); g.arc(x, y, R, 0, 7); g.clip(); g.fillStyle = '#5fcf6a';
  for (const [dx, dy, a, b] of [[-0.35, -0.3, 0.42, 0.3], [0.3, 0.15, 0.35, 0.5], [-0.2, 0.55, 0.3, 0.2]]) { g.beginPath(); g.ellipse(x + dx * R, y + dy * R, a * R, b * R, 0.4, 0, 7); g.fill(); }
  g.restore(); g.strokeStyle = INK; g.lineWidth = Math.max(2, R * 0.08); g.beginPath(); g.arc(x, y, R, 0, 7); g.stroke();
  g.fillStyle = 'rgba(255,255,255,0.7)'; g.beginPath(); g.ellipse(x - R * 0.4, y - R * 0.45, R * 0.18, R * 0.1, -0.6, 0, 7); g.fill();
}

// ---------------------------------------------------------------- the signs (each a canvas)

// WELCOME TO EARTH! — the big one, across the pergola: a cream sheet, each letter in the next of the call's colours, the
// Earth at one end and a saucer at the other, and a fringe of little pennants along the bottom.
function welcomeBanner() {
  return canvas(2048, 184, (g, w, h) => {
    const ch = 146; cloth(g, 0, 0, w, ch, '#f4efe1', 11);
    g.fillStyle = '#2b9b55'; g.fillRect(0, 0, w, 10); g.fillRect(0, ch - 8, w, 8);
    for (let x = 0; x < w; x += 46) { g.fillStyle = COLS[(x / 46) % 5 | 0]; g.beginPath(); g.moveTo(x + 4, ch); g.lineTo(x + 42, ch); g.lineTo(x + 23, h - 2); g.closePath(); g.fill(); }
    earth(g, 92, ch / 2 + 2, 52); saucer(g, w - 98, ch / 2 + 8, 66);
    for (const [x, y, R] of [[190, 36, 13], [176, 112, 9], [w - 200, 30, 12], [w - 190, 116, 10]]) star(g, x, y, R, '#ffd23c');
    painted(g, 'WELCOME TO EARTH!', { x: w / 2, y: ch / 2 + 6, w: w - 440, h: ch - 26, px: 132, cols: COLS, lw: 0.075 });
  });
}
// HAPPY ARRIVAL DAY — pinned along the front of the bar, scalloped along the bottom.
function arrivalBanner() {
  return canvas(1024, 176, (g, w, h) => {
    const ch = 140; g.save(); g.beginPath(); g.moveTo(0, 0); g.lineTo(w, 0); g.lineTo(w, ch);
    for (let x = w; x > 0; x -= 64) g.arc(x - 32, ch, 32, 0, Math.PI, false);
    g.closePath(); g.clip(); cloth(g, 0, 0, w, h, '#1f6d47', 23); g.restore();
    g.fillStyle = '#ffe35c'; for (let x = 0; x < w; x += 64) { g.beginPath(); g.arc(x + 32, ch + 14, 5, 0, 7); g.fill(); }
    for (const [x, y] of [[40, 40], [64, 104], [w - 44, 44], [w - 70, 108]]) star(g, x, y, 14, '#ffe35c');
    painted(g, 'HAPPY ARRIVAL DAY', { x: w / 2, y: ch / 2 + 4, w: w - 190, h: ch - 30, px: 96, cols: ['#ffffff', '#ffe35c'], line: '#0b2a1a' });
  });
}
// HELLO — five blobs of card on a string, one letter each, in the call's colours (cut out: the rest is see-through).
function helloCards() {
  return canvas(1024, 224, (g, w, h) => {
    g.strokeStyle = '#efe7d0'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, 14); g.quadraticCurveTo(w / 2, 40, w, 14); g.stroke();
    const r = rng(5);
    'HELLO'.split('').forEach((L, i) => {
      const x = 104 + i * 204, y = 124, R = 84;
      g.strokeStyle = '#efe7d0'; g.lineWidth = 3; g.beginPath(); g.moveTo(x, 14 + 26 * Math.sin(Math.PI * x / w)); g.lineTo(x, y - R + 6); g.stroke();
      g.fillStyle = COLS[i]; g.beginPath();
      for (let j = 0; j <= 24; j++) { const a = j / 24 * Math.PI * 2, rr = R * (0.88 + 0.12 * Math.sin(a * 3 + i * 1.7) + (r() - 0.5) * 0.04); g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.92); }
      g.closePath(); g.fill(); g.strokeStyle = INK; g.lineWidth = 5; g.stroke();
      painted(g, L, { x, y: y + 4, w: R * 1.3, h: R * 1.3, px: 120, cols: ['#ffffff'], line: INK, lw: 0.08, weight: '900', family: HAND });
    });
  });
}
// TAKE ME TO YOUR LEADER → LIFT — a plywood board strapped to the pergola post, pointing at the lift.
function leaderSign() {
  return canvas(512, 256, (g, w, h) => {
    const r = rng(3); g.fillStyle = '#f2ead6'; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(150,110,60,0.18)'; for (let i = 0; i < 18; i++) { g.lineWidth = 1 + r() * 3; g.beginPath(); const y = r() * h; g.moveTo(0, y); g.bezierCurveTo(w * 0.3, y + 8 * (r() - 0.5), w * 0.6, y + 8 * (r() - 0.5), w, y + 6 * (r() - 0.5)); g.stroke(); }
    g.strokeStyle = '#2b9b55'; g.lineWidth = 10; g.strokeRect(8, 8, w - 16, h - 16);
    painted(g, 'TAKE ME TO', { x: w / 2, y: 50, w: w - 80, h: 50, px: 46, cols: [INK], line: null });
    painted(g, 'YOUR LEADER', { x: w / 2, y: 108, w: w - 60, h: 66, px: 66, cols: ['#2b9b55'], line: null, weight: '800' });
    // the arrow, with LIFT painted in it
    g.fillStyle = '#ff8a4c'; g.beginPath(); g.moveTo(70, 160); g.lineTo(350, 160); g.lineTo(350, 140); g.lineTo(450, 188); g.lineTo(350, 236); g.lineTo(350, 216); g.lineTo(70, 216); g.closePath(); g.fill();
    g.strokeStyle = INK; g.lineWidth = 4; g.stroke();
    painted(g, 'LIFT', { x: 210, y: 190, w: 250, h: 50, px: 48, cols: ['#ffffff'], line: INK, weight: '900' });
  });
}
// WE COME IN PEACE (DO YOU?) — a long paper banner taped to the inside of the pink glass.
function peaceBanner() {
  return canvas(1024, 152, (g, w, h) => {
    cloth(g, 0, 0, w, h, '#fbf7ec', 37);
    g.fillStyle = '#4fc8ff'; for (let x = 6; x < w; x += 28) g.fillRect(x, 6, 14, 6), g.fillRect(x, h - 12, 14, 6);
    painted(g, 'WE COME IN PEACE', { x: w * 0.36, y: h / 2 + 2, w: w * 0.66, h: h - 40, px: 92, cols: ['#2b9b55', '#3d8be0'], weight: '800' });
    painted(g, '(DO YOU?)', { x: w * 0.85, y: h / 2 + 6, w: w * 0.26, h: h - 60, px: 64, cols: ['#ff8a4c'], weight: '700' });
  });
}
// GREETINGS, VISITORS! — along the south rail, so it greets you from across the terrace as the lift opens.
function greetingsBanner() {
  return canvas(1024, 164, (g, w, h) => {
    cloth(g, 0, 0, w, h, '#2a2d6e', 41);
    const r = rng(9); for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(255,255,255,${0.3 + r() * 0.5})`; g.beginPath(); g.arc(r() * w, r() * h, 1 + r() * 2.2, 0, 7); g.fill(); }
    star(g, 46, h / 2, 26, '#ffe35c'); star(g, w - 46, h / 2, 26, '#ffe35c');
    painted(g, 'GREETINGS, VISITORS!', { x: w / 2, y: h / 2 + 4, w: w - 150, h: h - 34, px: 96, cols: ['#ffe35c', '#ffffff'], line: '#0d0e2a' });
  });
}
// PARKING FOR SAUCERS ONLY — hand-lettered in marker on a small board, by the mirror dome (which does look parked).
function parkingSign() {
  return canvas(256, 192, (g, w, h) => {
    g.fillStyle = '#fbfbf6'; g.fillRect(0, 0, w, h); g.strokeStyle = '#c4161c'; g.lineWidth = 8; g.strokeRect(5, 5, w - 10, h - 10);
    painted(g, 'PARKING', { x: w / 2, y: 40, w: w - 40, h: 46, px: 44, cols: ['#1d3fa0'], line: null, family: PEN, weight: '700' });
    painted(g, 'FOR SAUCERS', { x: w / 2, y: 84, w: w - 36, h: 38, px: 34, cols: ['#1d3fa0'], line: null, family: PEN, weight: '700' });
    painted(g, 'ONLY', { x: w / 2 - 34, y: 132, w: 110, h: 40, px: 40, cols: ['#c4161c'], line: null, family: PEN, weight: '800' });
    g.strokeStyle = '#c4161c'; g.lineWidth = 3; g.beginPath(); g.moveTo(40, 156); g.quadraticCurveTo(90, 162, 130, 154); g.stroke();
    saucer(g, 190, 140, 34, '#c9d2dc', '#6dff9e');
  });
}
// The chalkboard by the bar.
function chalkboard() {
  return canvas(256, 352, (g, w, h) => {
    const r = rng(17); g.fillStyle = '#1d2621'; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(255,255,255,0.05)'; for (let i = 0; i < 120; i++) g.fillRect(r() * w, r() * h, 2 + r() * 40, 1 + r() * 2);
    g.globalAlpha = 0.92;
    painted(g, 'TONIGHT', { x: w / 2, y: 44, w: w - 50, h: 40, px: 36, cols: ['#f4f1e8'], line: null, family: CHALK });
    painted(g, 'GREEN PUNCH', { x: w / 2, y: 112, w: w - 30, h: 80, px: 52, cols: [GREEN], line: null, family: CHALK, weight: '800', lines: 2 });
    painted(g, 'free for all species', { x: w / 2, y: 196, w: w - 36, h: 66, px: 34, cols: ['#f4f1e8'], line: null, family: CHALK, lines: 2 });
    // a little alien face in chalk
    g.strokeStyle = GREEN; g.lineWidth = 4; g.beginPath(); g.ellipse(w / 2, 284, 34, 40, 0, 0, 7); g.stroke();
    g.fillStyle = '#f4f1e8'; for (const s of [-1, 1]) { g.beginPath(); g.ellipse(w / 2 + s * 14, 278, 9, 14, s * 0.5, 0, 7); g.fill(); }
    g.beginPath(); g.arc(w / 2, 298, 9, 0.2, Math.PI - 0.2); g.strokeStyle = '#f4f1e8'; g.lineWidth = 3; g.stroke();
    g.globalAlpha = 1;
  });
}
// The cake's side: WELCOME piped in green three times round, with dots between.
function cakeSide() {
  return canvas(1024, 128, (g, w, h) => {
    g.fillStyle = '#fbf8f1'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 3; i++) {
      const cx = (i + 0.5) * w / 3;
      painted(g, 'WELCOME', { x: cx, y: h / 2 + 4, w: w / 3 - 60, h: h - 30, px: 74, cols: ['#2fbf62'], line: null, family: HAND, weight: '700' });
      for (let j = 0; j < 5; j++) { g.fillStyle = COLS[j]; g.beginPath(); g.arc(i * w / 3 + 6, 22 + j * 21, 5, 0, 7); g.fill(); }
    }
  });
}
// The tent card against the cake, as it looks from the floor.
function tentCard() {
  return canvas(128, 96, (g, w, h) => {
    g.fillStyle = '#efe7d2'; g.fillRect(0, 0, w, h); g.strokeStyle = '#2b9b55'; g.lineWidth = 4; g.strokeRect(4, 4, w - 8, h - 8);
    painted(g, 'Please read', { x: w / 2, y: 34, w: w - 24, h: 30, px: 22, cols: ['#1f2b55'], line: null, family: PEN });
    painted(g, '— D.', { x: w / 2 + 14, y: 70, w: 60, h: 30, px: 26, cols: ['#1f2b55'], line: null, family: PEN });
  });
}
// The guest book's pages, as they lie open on the stand (seen from a little way off: lines of writing and the green one).
function bookPages() {
  return canvas(256, 160, (g, w, h) => {
    g.fillStyle = '#f6f0de'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(w / 2 - 2, 0, 4, h);
    const r = rng(29);
    for (let side = 0; side < 2; side++) for (let i = 0; i < 6; i++) {
      const x0 = side * w / 2 + 14, y = 22 + i * 22, glyph = side === 1 && i === 4;
      g.strokeStyle = glyph ? '#2fd46a' : ['#1f2b55', '#3a3a3a', '#7a1f2a'][i % 3]; g.lineWidth = glyph ? 2.5 : 1.6;
      g.beginPath(); g.moveTo(x0, y); for (let x = x0; x < x0 + w / 2 - 30; x += 4) g.lineTo(x, y + Math.sin(x * 0.7 + i) * 2.5 + (r() - 0.5) * 2); g.stroke();
      if (glyph) for (let k = 0; k < 5; k++) { g.beginPath(); g.arc(x0 + 10 + k * 20, y - 4, 4, 0, 7); g.stroke(); }
    }
  });
}
// The five-colour dashes of a painted parking bay round the dome, with a P.
function bayDecal() {
  return canvas(512, 512, (g, w, h) => {
    g.clearRect(0, 0, w, h); const c = w / 2, R = w * 0.44;
    g.lineWidth = 9; for (let i = 0; i < 30; i++) { const a = i / 30 * Math.PI * 2; g.strokeStyle = i % 2 ? 'rgba(255,255,255,0.75)' : 'rgba(255,227,92,0.8)'; g.beginPath(); g.arc(c, c, R, a, a + Math.PI / 30 * 0.7); g.stroke(); }
    g.save(); g.translate(c + R * 0.71 + 24, c - R * 0.71 - 24); g.rotate(Math.PI); g.fillStyle = 'rgba(255,255,255,0.8)';
    fitText(g, 'P', { x: 0, y: 0, w: 40, h: 44, px: 44, weight: '900', family: SANS }); g.restore();
  });
}

// ---------------------------------------------------------------- the cards you READ (on screen)
const NOTE = ['They’re coming back tonight.', 'Keep the fireworks ready.', 'The signal is the five notes.', 'Then light up the sky', 'and make them welcome.'];
function noteCard() {
  return canvas(520, 560, (g, W, H) => {
    g.fillStyle = '#efe7d2'; g.fillRect(16, 16, W - 32, H - 32);
    g.fillStyle = 'rgba(120,96,60,.07)'; for (let i = 0; i < 50; i++) g.fillRect(16 + (i * 97) % (W - 40), 16 + (i * 61) % (H - 40), 3 + (i * 13) % 40, 1);
    g.strokeStyle = 'rgba(60,90,140,.18)'; g.lineWidth = 1.5; for (let y = 112; y < H - 40; y += 56) { g.beginPath(); g.moveTo(40, y); g.lineTo(W - 40, y); g.stroke(); }
    g.fillStyle = '#1f2b55';
    NOTE.forEach((l, i) => fitText(g, l, { x: W / 2, y: 86 + i * 56, w: W - 96, h: 46, px: 36, weight: '400', family: PEN }));
    for (let i = 0; i < 5; i++) { g.fillStyle = COLS[i]; g.beginPath(); g.arc(80 + i * 34, H - 96, 11, 0, 7); g.fill(); }
    g.fillStyle = '#1f2b55'; fitText(g, '— D.', { x: W - 120, y: H - 92, w: 150, h: 54, px: 44, weight: 'italic 400', family: PEN });
  });
}
const BOOK = [
  ['Welcome to Earth! So glad you could make it.', 'Rosa, Visitor Services', '#1f2b55', PEN],
  ['Please try the punch. I made it green.', 'Dev, Catering', '#7a1f2a', HAND],
  ['Wipe your feet. All of them.', 'Facilities', '#2a2a2a', SANS],
  ['Hello from the night shift!!', 'Marcus, Security', '#1d5fa0', PEN],
];
function bookCard() {
  return canvas(520, 640, (g, W, H) => {
    g.fillStyle = '#f6f0de'; g.fillRect(16, 16, W - 32, H - 32);
    g.fillStyle = '#2b9b55'; fitText(g, 'GUEST BOOK', { x: W / 2, y: 62, w: W - 120, h: 40, px: 34, weight: '700', family: SANS });
    g.fillStyle = '#6a6458'; fitText(g, 'please sign', { x: W / 2, y: 98, w: W - 160, h: 26, px: 22, weight: 'italic 400', family: PEN });
    BOOK.forEach(([msg, who, col, fam], i) => {
      const y = 158 + i * 96; g.fillStyle = col;
      fitText(g, msg, { x: W / 2, y, w: W - 90, h: 52, px: 30, weight: '400', family: fam, lines: 2 });
      fitText(g, '— ' + who, { x: W / 2 + 70, y: y + 40, w: W - 230, h: 26, px: 22, weight: 'italic 400', family: fam });
    });
    // and the last: none of it is any alphabet. Green, and still a little wet.
    const y = H - 78, r = rng(61); g.strokeStyle = '#26c15c'; g.fillStyle = '#26c15c'; g.lineWidth = 4; g.lineCap = 'round'; g.shadowColor = '#6dff9e'; g.shadowBlur = 8;
    for (let k = 0; k < 7; k++) {
      const x = 92 + k * 52;
      g.beginPath(); g.arc(x, y, 12 + r() * 6, r() * 2, r() * 2 + 3.5 + r() * 2); g.stroke();
      if (r() < 0.6) { g.beginPath(); g.moveTo(x - 10, y + 18); g.lineTo(x + 12, y + 14 - r() * 20); g.stroke(); }
      for (let d = 0; d < 1 + (k % 3); d++) { g.beginPath(); g.arc(x - 8 + d * 9, y - 22, 3, 0, 7); g.fill(); }
    }
    g.shadowBlur = 0;
  });
}

// ---------------------------------------------------------------- the feature
const M4 = (x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, s = 1) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(s, s, s));

feature({
  id: 'welcome',
  init(k) {
    const T = k.museum.mw && k.museum.mw.terrace; if (!T || !T.party) return;
    this.k = k; this.T = T; this.t = 0; this.cardAt = null;
    story.enable('party');
    const py = T.y, X = u => T.x0 + u, Z = w => T.z0 + w, O = k.plan.obstacles;
    const g = this.group = new THREE.Group(); g.name = 'welcome'; k.group.add(g);
    const keep = m => { m.traverse(o => { o.matrixAutoUpdate = false; o.updateMatrix(); }); g.add(m); return m; };
    const solid = (x0, x1, z0, z1, y0, y1) => O.push({ x0, x1, z0, z1, y0: py + y0, y1: py + y1 });
    const P = k.parts();
    const wood = new THREE.MeshStandardMaterial({ color: 0x9a7048, roughness: 0.8, emissive: 0x3a2412, emissiveIntensity: 0.6 });
    const white = new THREE.MeshStandardMaterial({ color: 0xf2f0ea, roughness: 0.6, emissive: 0x9a9890, emissiveIntensity: 0.55 });
    const strap = new THREE.MeshStandardMaterial({ color: 0x202226, roughness: 0.7, emissive: 0x0c0c0e, emissiveIntensity: 0.6 });
    const cord = [];                                                 // [x, y, z, x, y, z] line pieces: cords and balloon strings

    // ---- WELCOME TO EARTH!, across the middle, from the pergola posts on either side. It hangs from 2.82 m to under 2 m,
    // high over everything; it bellies a little; it reads from both sides; the lights turn at the posts it hangs from.
    {
      const W = 10, H = W * 184 / 2048, zc = Z(9.75), xc = X(7.6), top = py + 2.82, geo = new THREE.PlaneGeometry(W, H, 24, 1);
      const pos = geo.attributes.position; for (let i = 0; i < pos.count; i++) { const x = pos.getX(i); pos.setY(i, pos.getY(i) - 0.06 * (1 - (2 * x / W) ** 2)); }
      geo.computeVertexNormals();
      const b = twoFaced(geo, board(welcomeBanner(), { alpha: true }), 0.006); b.position.set(xc, top - H / 2, zc); keep(b);
      for (const [px, bx] of [[X(0.3), xc - W / 2], [X(14.9), xc + W / 2]]) cord.push(px, py + 2.97, zc, bx, top, zc);
      cord.push(xc - W / 2, top, zc, xc + W / 2, top, zc);
      solid(xc - W / 2, xc + W / 2, zc - 0.02, zc + 0.02, 2.82 - H - 0.07, 2.83);
      this.banner = { x: xc, y: top - H / 2, z: zc };
    }
    // ---- HAPPY ARRIVAL DAY, pinned along the front of the bar, above its foot rail
    const bar = T.party.bar;
    {
      const L = Math.min(2.9, bar.z1 - bar.z0 - 0.5), H = L * 176 / 1024, m = new THREE.Mesh(new THREE.PlaneGeometry(L, H).rotateY(-Math.PI / 2), board(arrivalBanner(), { alpha: true }));
      m.position.set(bar.x0 - 0.018, py + 0.86 - H / 2, (bar.z0 + bar.z1) / 2); keep(m);
    }
    // ---- HELLO, five cards on a string along the east rail, north of the bar
    {
      const L = 2.8, H = L * 224 / 1024, b = twoFaced(new THREE.PlaneGeometry(L, H), board(helloCards(), { alpha: true }), 0.004);
      b.rotation.y = -Math.PI / 2; b.position.set(T.x1 - 0.025, py + 1.12 - H / 2, Z(3.3)); keep(b);
      solid(T.x1 - 0.035, T.x1, Z(3.3) - L / 2, Z(3.3) + L / 2, 1.12 - H, 1.12);
    }
    // ---- TAKE ME TO YOUR LEADER → LIFT, strapped to the pergola post west of the lift, facing the terrace
    {
      const x0 = X(9.08), x1 = X(10.12), zf = Z(0.25) + 0.062, y0 = 0.94, y1 = 1.46, mat = board(leaderSign());
      const m = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, 0.018), [wood, wood, wood, wood, mat, wood]); m.position.set((x0 + x1) / 2, py + (y0 + y1) / 2, zf + 0.009); keep(m);
      for (const y of [y0 + 0.1, y1 - 0.1]) P.add(new THREE.BoxGeometry(0.13, 0.03, 0.13), strap, X(10.05), py + y, Z(0.25) + 0.012);
      solid(x0, x1, zf, zf + 0.02, y0, y1);
    }
    // ---- WE COME IN PEACE (DO YOU?), taped inside the pink glass on the street side, between two posts
    {
      const L = 3.9, H = L * 152 / 1024, b = twoFaced(new THREE.PlaneGeometry(L, H), board(peaceBanner()), 0.004);
      b.rotation.y = Math.PI / 2; b.position.set(T.x0 + 0.018, py + 1.25, Z(7.38)); keep(b);
      solid(T.x0, T.x0 + 0.025, Z(7.38) - L / 2, Z(7.38) + L / 2, 1.25 - H / 2, 1.25 + H / 2);
    }
    // ---- GREETINGS, VISITORS!, along the south rail, facing the lift across the terrace
    {
      const L = 3.35, H = L * 164 / 1024, b = twoFaced(new THREE.PlaneGeometry(L, H), board(greetingsBanner()), 0.004);
      b.rotation.y = Math.PI; b.position.set(X(3.15), py + 0.74, T.z1 - 0.022); keep(b);
      solid(X(3.15) - L / 2, X(3.15) + L / 2, T.z1 - 0.035, T.z1, 0.74 - H / 2, 0.74 + H / 2);
    }
    // ---- PARKING FOR SAUCERS ONLY, on a stake by the mirror dome, and a painted bay round the dome
    {
      const sx = X(13.7), sz = Z(14.95), ry = Math.atan2(-0.55, -1), mat = board(parkingSign()), bw = 0.44, bh = 0.33, by = 0.68;
      const m = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, 0.014), [wood, wood, wood, wood, mat, wood]); m.position.set(sx, py + by, sz); m.rotation.y = ry; keep(m);
      P.add(new THREE.BoxGeometry(0.032, by + bh / 2 - 0.02, 0.032), wood, sx - Math.sin(ry) * 0.023, py + (by + bh / 2 - 0.02) / 2, sz - Math.cos(ry) * 0.023, 0, ry, 0);
      solid(sx - 0.03, sx + 0.03, sz - 0.03, sz + 0.03, 0, by + bh / 2);
      for (let i = -1; i <= 1; i++) { const cx = sx + Math.cos(ry) * i * bw / 3, cz = sz - Math.sin(ry) * i * bw / 3; solid(cx - 0.08, cx + 0.08, cz - 0.08, cz + 0.08, by - bh / 2, by + bh / 2); }
      const d = new THREE.Mesh(new THREE.PlaneGeometry(3.9, 3.9).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: tex(bayDecal()), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -5, polygonOffsetUnits: -5 }));
      d.position.set(X(11.9), py + 0.012, Z(16.6)); d.renderOrder = 1; keep(d);
    }
    // ---- a chalkboard on an A-frame by the north end of the bar: the punch, free to all species
    {
      const ax = X(13.2), az = Z(5.25), mat = board(chalkboard()), pw = 0.42, ph = 0.6, lean = 0.26;
      for (const s of [-1, 1]) {
        const grp = new THREE.Group(), frame = new THREE.Mesh(new THREE.BoxGeometry(pw + 0.04, ph + 0.04, 0.018), wood), face = new THREE.Mesh(new THREE.PlaneGeometry(pw, ph), mat);
        face.position.z = 0.0095; grp.add(frame, face);
        grp.rotation.set(-lean, s > 0 ? 0 : Math.PI, 0, 'YXZ'); grp.position.set(ax, py + Math.cos(lean) * (ph + 0.04) / 2, az + s * Math.sin(lean) * (ph + 0.04) / 2); keep(grp);
      }
      for (const [y0, y1, d] of [[0, 0.2, 0.17], [0.2, 0.42, 0.11], [0.42, 0.6, 0.05]]) solid(ax - pw / 2 - 0.02, ax + pw / 2 + 0.02, az - d, az + d, y0, y1);
    }

    // ---- the cake, on the bar: a glass stand, two tiers in white icing piped with green, WELCOME round the side, five
    // candles in the call's colours, and a little saucer hovering over the top on a wire, its beam on the icing
    {
      const c = T.party.cake, x = c.x, z = c.z, y = bar.top;
      const glass = new THREE.MeshStandardMaterial({ color: 0xdfeeff, roughness: 0.05, transparent: true, opacity: 0.4, emissive: 0x6a7c90, emissiveIntensity: 0.5, depthWrite: false });
      const icing = new THREE.MeshStandardMaterial({ color: 0xfbf8f1, roughness: 0.75, emissive: 0xc8c4bc, emissiveIntensity: 0.6 });
      const sideT = tex(cakeSide()), side = new THREE.MeshStandardMaterial({ map: sideT, roughness: 0.75, emissiveMap: sideT, emissive: new THREE.Color(0.78, 0.78, 0.78), emissiveIntensity: 0.6 });
      const pipe = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.3, 0.85, 0.42) });
      P.add(new THREE.LatheGeometry([[0.001, 0], [0.07, 0], [0.074, 0.008], [0.02, 0.02], [0.016, 0.065], [0.17, 0.07], [0.172, 0.078], [0.001, 0.078]].map(([a, b]) => new THREE.Vector2(a, b)), 28), glass, x, y, z);
      const t1 = y + 0.078, t2 = t1 + 0.11;
      // (the side's three WELCOMEs turned so one faces the floor in front of the bar, to the west)
      const sideG = new THREE.CylinderGeometry(0.14, 0.14, 0.11, 40, 1, true).rotateY(-Math.PI / 6), topG = new THREE.CircleGeometry(0.14, 40).rotateX(-Math.PI / 2);
      P.add(sideG, side, x, t1 + 0.055, z); P.add(topG, icing, x, t2, z);
      P.add(new THREE.CylinderGeometry(0.09, 0.09, 0.08, 32), icing, x, t2 + 0.04, z);
      for (const [r, yy] of [[0.14, t1 + 0.006], [0.14, t2], [0.09, t2 + 0.006], [0.09, t2 + 0.08]]) P.add(new THREE.TorusGeometry(r, 0.0075, 6, 40).rotateX(Math.PI / 2), pipe, x, yy, z);
      this.cakeFlame = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 1.0, 0.45) });
      for (let i = 0; i < 5; i++) { const a = Math.PI + (i - 2) * 0.5, cx = x + Math.cos(a) * 0.115, cz = z + Math.sin(a) * 0.115; P.add(new THREE.CylinderGeometry(0.0045, 0.0045, 0.05, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(COLS[i]) }), cx, t2 + 0.025, cz); P.add(new THREE.SphereGeometry(0.005, 6, 5).scale(1, 2, 1), this.cakeFlame, cx, t2 + 0.058, cz); }
      const sy = t2 + 0.08 + 0.075, chrome = new THREE.MeshStandardMaterial({ color: 0xc9ced6, metalness: 0.8, roughness: 0.3, emissive: 0x4a5058, emissiveIntensity: 0.8 });
      P.add(new THREE.CylinderGeometry(0.0012, 0.0012, 0.075, 4), chrome, x, t2 + 0.08 + 0.0375, z);
      P.add(new THREE.SphereGeometry(0.05, 20, 8).scale(1, 0.24, 1), chrome, x, sy, z, 0.12, 0, 0.08);
      P.add(new THREE.SphereGeometry(0.02, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.45, 1.5, 0.65) }), x, sy + 0.008, z, 0.12, 0, 0.08);
      for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; P.add(new THREE.SphereGeometry(0.004, 6, 4), new THREE.MeshBasicMaterial({ color: new THREE.Color(COLS[i]).multiplyScalar(1.4) }), x + Math.cos(a) * 0.046, sy - 0.002, z + Math.sin(a) * 0.046); }
      const beam = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.07, 20, 1, true).translate(0, -0.035, 0), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.25, 0.8, 0.4), transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
      beam.position.set(x, sy - 0.006, z); beam.renderOrder = 4; keep(beam);
      O.push({ x0: x - 0.18, x1: x + 0.18, z0: z - 0.18, z1: z + 0.18, y0: y, y1: sy + 0.02 });
      this.cake = { x, y: t2, z };
    }
    // ---- the Director's note: a folded card propped against the cake, facing the room
    {
      const n = T.party.note, y = bar.top, mat = board(tentCard()), back = new THREE.MeshStandardMaterial({ color: 0xefe7d2, roughness: 0.8, emissive: 0x8a8270, emissiveIntensity: 0.5 });
      const W = 0.13, H = 0.095, lean = 0.3;
      const f = new THREE.Mesh(new THREE.PlaneGeometry(W, H).rotateY(-Math.PI / 2), mat); f.position.set(n.x + Math.sin(lean) * H / 2 - 0.02, y + Math.cos(lean) * H / 2 + 0.001, n.z); f.rotation.z = -lean; keep(f);
      const b = new THREE.Mesh(new THREE.PlaneGeometry(W, H).rotateY(Math.PI / 2), back); b.position.set(n.x + Math.sin(lean) * H / 2 + 0.008, y + Math.cos(lean) * H / 2 + 0.001, n.z); b.rotation.z = lean; keep(b);
      O.push({ x0: n.x - 0.04, x1: n.x + 0.06, z0: n.z - 0.07, z1: n.z + 0.07, y0: y, y1: y + 0.1 });
      this.noteAt = { x: bar.x0 - 0.45, y: py, z: n.z, top: { x: n.x, y, z: n.z } };
    }
    // ---- the guest book, open on a walnut stand west of the lift, a pen on a chain, two balloons tied to it
    const bookX = X(8.3), bookZ = Z(0.85);
    {
      const walnut = new THREE.MeshStandardMaterial({ color: 0x4a2c18, roughness: 0.5, emissive: 0x1c0f06, emissiveIntensity: 0.6 }), pages = board(bookPages()), tilt = 0.42, ty = 1.0;
      P.add(new THREE.CylinderGeometry(0.17, 0.19, 0.03, 24), walnut, bookX, py + 0.015, bookZ);
      P.add(new THREE.CylinderGeometry(0.024, 0.03, ty - 0.03, 12), walnut, bookX, py + 0.03 + (ty - 0.03) / 2, bookZ);
      P.add(new THREE.BoxGeometry(0.44, 0.022, 0.32), walnut, bookX, py + ty, bookZ, tilt, 0, 0);
      P.add(new THREE.BoxGeometry(0.44, 0.03, 0.02), walnut, bookX, py + ty - 0.06, bookZ + 0.155, tilt, 0, 0);       // the ledge the book rests on
      const pg = new THREE.Mesh(new THREE.PlaneGeometry(0.38, 0.24).rotateX(-Math.PI / 2), pages); pg.position.set(bookX, py + ty + 0.02, bookZ); pg.rotation.x = tilt; keep(pg);
      P.add(new THREE.BoxGeometry(0.39, 0.012, 0.25), new THREE.MeshStandardMaterial({ color: 0x1d4a2c, roughness: 0.6, emissive: 0x0a1a10, emissiveIntensity: 0.6 }), bookX, py + ty + 0.011, bookZ, tilt, 0, 0);
      P.add(new THREE.CylinderGeometry(0.004, 0.004, 0.13, 6), strap, bookX + 0.17, py + ty + 0.03, bookZ + 0.02, Math.PI / 2 + tilt, 0.4, 0);
      solid(bookX - 0.19, bookX + 0.19, bookZ - 0.19, bookZ + 0.19, 0, 0.035);
      solid(bookX - 0.035, bookX + 0.035, bookZ - 0.035, bookZ + 0.035, 0, ty - 0.08);
      solid(bookX - 0.23, bookX + 0.23, bookZ - 0.17, bookZ + 0.17, ty - 0.1, ty + 0.1);
      this.bookAt = { x: bookX, y: py, z: bookZ + 0.62 };
    }

    // ---- bunting under the pergola's beams, post to post all round: pennants, stars and ringed planets, alternating
    {
      const hang = py + 2.93, sag = 0.26, sp = 0.31, flags = [[], [], []], cols = [[], [], []];
      const us = [0.25, 5.15, 10.05, 14.95], ws = [0.25, 5.0, 9.75, 14.5, 19.25], runs = [];
      for (const w of [ws[0], ws[4]]) for (let i = 0; i + 1 < us.length; i++) runs.push([X(us[i]), Z(w), X(us[i + 1]), Z(w)]);
      for (const u of [us[0], us[3]]) for (let i = 0; i + 1 < ws.length; i++) runs.push([X(u), Z(ws[i]), X(u), Z(ws[i + 1])]);
      let n = 0;
      for (const [ax, az, bx, bz] of runs) {
        const len = Math.hypot(bx - ax, bz - az), m = Math.max(2, Math.round(len / sp)), ry = Math.atan2(bx - ax, bz - az) + Math.PI / 2;
        let prev = null;
        for (let j = 0; j <= m; j++) {
          const t = j / m, x = ax + (bx - ax) * t, z = az + (bz - az) * t, y = hang - sag * 4 * t * (1 - t);
          if (prev) cord.push(...prev, x, y, z); prev = [x, y, z];
          if (j === 0 || j === m) continue;
          const kind = n % 3; flags[kind].push(M4(x, y, z, 0, ry, 0)); cols[kind].push(PARTY[(n * 2 + (n / 7 | 0)) % PARTY.length]); n++;
        }
      }
      const pen = new THREE.ShapeGeometry(new THREE.Shape([new THREE.Vector2(-0.085, 0), new THREE.Vector2(0.085, 0), new THREE.Vector2(0, -0.2)]));
      const stS = new THREE.Shape(); for (let j = 0; j < 10; j++) { const a = Math.PI / 2 + j * Math.PI / 5, rr = j % 2 ? 0.04 : 0.095; (j ? stS.lineTo : stS.moveTo).call(stS, Math.cos(a) * rr, -0.1 + Math.sin(a) * rr); }
      const planet = (() => {
        const ball = new THREE.CircleGeometry(0.06, 20).translate(0, -0.1, 0);
        const ring = new THREE.Shape(); ring.absellipse(0, 0, 0.115, 0.032, 0, Math.PI * 2, false); const hole = new THREE.Path(); hole.absellipse(0, 0, 0.085, 0.019, 0, Math.PI * 2, true); ring.holes.push(hole);
        const rg = new THREE.ShapeGeometry(ring, 24).rotateZ(-0.35).translate(0, -0.1, 0.002);
        const tab = new THREE.PlaneGeometry(0.012, 0.04).translate(0, -0.02, 0);
        const parts = [ball, rg, tab].map(q => q.index ? q.toNonIndexed() : q);
        const out = new THREE.BufferGeometry(); for (const nm of ['position', 'normal', 'uv']) { const arrs = parts.map(q => q.attributes[nm].array), L = arrs.reduce((s, a) => s + a.length, 0), a = new Float32Array(L); let o = 0; for (const x of arrs) { a.set(x, o); o += x.length; } out.setAttribute(nm, new THREE.BufferAttribute(a, parts[0].attributes[nm].itemSize)); }
        return out;
      })();
      const flagM = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
      [pen, new THREE.ShapeGeometry(stS), planet].forEach((geo, kind) => {
        const im = new THREE.InstancedMesh(geo, flagM, flags[kind].length);
        flags[kind].forEach((q, i) => { im.setMatrixAt(i, q); im.setColorAt(i, new THREE.Color(cols[kind][i]).multiplyScalar(0.8)); });
        im.instanceMatrix.needsUpdate = true; im.instanceColor.needsUpdate = true; im.computeBoundingSphere(); keep(im);
      });
    }
    // ---- balloons: bunches tied to the tables, the flowers by the lift, the bar and the guest book; and three that got
    // away and are bumping along under the sunshade. Each is solid where it floats (well clear of the toy, not of a drone).
    {
      const balls = [], bcol = [], r = rng(707), tabs = T.party.tables;
      const bunch = (tx, ty, tz, n, h0, spread, c0) => {
        for (let i = 0; i < n; i++) {
          const a = c0 + i * 2.4 + r() * 0.6, d = spread * (0.5 + r() * 0.5), x = tx + Math.cos(a) * d, z = tz + Math.sin(a) * d, y = py + h0 + r() * 0.3, s = 0.92 + r() * 0.16;
          balls.push(M4(x, y, z, (r() - 0.5) * 0.3, r() * 6, (r() - 0.5) * 0.3, s)); bcol.push(PARTY[(c0 * 3 + i) % 6 | 0]);
          const kx = x, ky = y - 0.17 * s, kz = z, mx = (kx + tx) / 2 + (r() - 0.5) * 0.08, my = (ky + ty) / 2, mz = (kz + tz) / 2 + (r() - 0.5) * 0.08;
          cord.push(kx, ky, kz, mx, my, mz, mx, my, mz, tx, ty, tz);
          solid(x - 0.15, x + 0.15, z - 0.15, z + 0.15, y - py - 0.17, y - py + 0.17);
        }
      };
      // (the bunches between the lift and the big banner float low, so that from the lift they sit under it, not over the words)
      for (const [i, c0, h] of [[0, 0, 1.32], [3, 2, 1.62], [4, 4, 1.62]]) { const t = tabs[i]; if (t) bunch(t.x + 0.25, py + 1.11, t.z + 0.1, 3, h, 0.22, c0); }
      bunch(X(10.6), py + 1.2, Z(1.0), 3, 1.95, 0.22, 1); bunch(X(14.35), py + 1.2, Z(1.0), 3, 1.95, 0.22, 3);
      bunch(bar.x0 + 0.05, bar.top + 0.02, bar.z0 + 0.06, 3, 1.85, 0.2, 5);
      bunch(bookX + 0.2, py + 1.0, bookZ - 0.1, 2, 1.72, 0.18, 2);
      // the ones that got away: up against the slats over the street side, their strings hanging
      for (const [u, w, c] of [[1.4, 6.4, 1], [2.5, 15.8, 4], [0.9, 17.1, 0]]) {
        const x = X(u), z = Z(w), y = py + 2.83;
        balls.push(M4(x, y, z, 0.2, u, 0.1)); bcol.push(PARTY[c]);
        cord.push(x, y - 0.17, z, x + 0.05, y - 0.8, z + 0.03, x + 0.05, y - 0.8, z + 0.03, x - 0.02, y - 1.25, z + 0.06);
        solid(x - 0.15, x + 0.15, z - 0.15, z + 0.15, 2.66, 3.0);
      }
      const mc = tex(canvas(128, 128, (q, w, h) => { const rg = q.createRadialGradient(w * 0.36, h * 0.32, 2, w / 2, h / 2, w / 2); rg.addColorStop(0, '#ffffff'); rg.addColorStop(0.12, '#f4f4f4'); rg.addColorStop(0.45, '#c8c8c8'); rg.addColorStop(0.85, '#8a8a8a'); rg.addColorStop(1, '#5a5a5a'); q.fillStyle = rg; q.fillRect(0, 0, w, h); }));
      const bg = new THREE.SphereGeometry(0.14, 18, 14).scale(1, 1.18, 1), knot = new THREE.ConeGeometry(0.018, 0.03, 8).translate(0, -0.172, 0);
      const geo = (() => { const a = bg.toNonIndexed(), b = knot.toNonIndexed(), out = new THREE.BufferGeometry(); for (const nm of ['position', 'normal', 'uv']) { const x = a.attributes[nm].array, y = b.attributes[nm].array, z = new Float32Array(x.length + y.length); z.set(x); z.set(y, x.length); out.setAttribute(nm, new THREE.BufferAttribute(z, a.attributes[nm].itemSize)); } return out; })();
      const im = new THREE.InstancedMesh(geo, new THREE.MeshMatcapMaterial({ matcap: mc }), balls.length);
      balls.forEach((q, i) => { im.setMatrixAt(i, q); im.setColorAt(i, new THREE.Color(bcol[i]).multiplyScalar(1.05)); });
      im.instanceMatrix.needsUpdate = true; im.instanceColor.needsUpdate = true; im.computeBoundingSphere(); keep(im);
    }
    // ---- cords, bunting strings and balloon strings, all one set of lines
    { const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(cord, 3)); keep(new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: 0xd8d2c4 }))); }
    // ---- confetti and streamers on the paving, thickest round the tables and the bar (not on the sculptures)
    {
      const r = rng(4242), conf = [], ccol = [], tabs = T.party.tables;
      const clear = (u, w) => !(Math.hypot(u - 11.9, w - 16.6) < 1.7 || (u > 7.9 && u < 10.2 && w > 12.8 && w < 16.6) || (u > 13.6 && w > 5.8 && w < 9.8) || u < 0.15 || u > 15.05 || w < 0.15 || w > 19.35 || (u < 2.4 && w < 2.1));
      for (let i = 0; i < 520; i++) {
        let u, w;
        if (i < 300) { const t = tabs[i % tabs.length], a = r() * 6.283, d = Math.sqrt(r()) * 1.3; u = t.x - T.x0 + Math.cos(a) * d; w = t.z - T.z0 + Math.sin(a) * d; }
        else if (i < 380) { u = 12.6 + r() * 1.2; w = 5.5 + r() * 4.5; }
        else { u = 0.3 + r() * 14.6; w = 0.3 + r() * 19; }
        if (!clear(u, w)) continue;
        conf.push(M4(X(u), py + 0.013 + r() * 0.002, Z(w), 0, r() * 6.283, 0)); ccol.push(PARTY[i % PARTY.length]);
      }
      const im = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.022, 0.014).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ polygonOffset: true, polygonOffsetFactor: -6, polygonOffsetUnits: -6 }), conf.length);
      conf.forEach((q, i) => { im.setMatrixAt(i, q); im.setColorAt(i, new THREE.Color(ccol[i]).multiplyScalar(0.75)); });
      im.instanceMatrix.needsUpdate = true; im.instanceColor.needsUpdate = true; im.computeBoundingSphere(); im.renderOrder = 1; keep(im);
      // streamers: curling paper ribbons lying where they fell
      const pos = [], col = [], idx = [];
      for (let s = 0; s < 11; s++) {
        let u, w; do { const t = tabs[s % tabs.length]; u = t.x - T.x0 + (r() - 0.5) * 2.4; w = t.z - T.z0 + (r() - 0.5) * 2.4; } while (!clear(u, w));
        let a = r() * 6.283; const c = new THREE.Color(PARTY[s % 6]).multiplyScalar(0.8), n = 40, hw = 0.011, base = pos.length / 3, y = py + 0.016 + s * 0.0004;
        for (let i = 0; i <= n; i++) {
          a += 0.25 * Math.sin(i * 0.5 + s) + (r() - 0.5) * 0.3; u += Math.cos(a) * 0.035; w += Math.sin(a) * 0.035;
          const nx = -Math.sin(a) * hw, nz = Math.cos(a) * hw;
          pos.push(X(u) + nx, y, Z(w) + nz, X(u) - nx, y, Z(w) - nz); col.push(c.r, c.g, c.b, c.r, c.g, c.b);
          if (i) { const p = base + (i - 1) * 2; idx.push(p, p + 1, p + 2, p + 1, p + 3, p + 2); }
        }
      }
      const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); sg.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); sg.setIndex(idx);
      const sm = new THREE.Mesh(sg, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -6, polygonOffsetUnits: -6 })); sm.renderOrder = 1; keep(sm);
    }
    P.done(g).forEach(m => { m.matrixAutoUpdate = false; m.updateMatrix(); });

    // the card on screen (the note, the guest book)
    const el = this.cardEl = document.createElement('div'); el.id = 'partyCard';
    el.style.cssText = 'position:fixed;left:50%;top:44%;transform:translate(-50%,-50%) rotate(1.2deg);width:min(70vmin,340px);pointer-events:none;opacity:0;transition:opacity .25s;z-index:30;filter:drop-shadow(0 10px 24px rgba(0,0,0,.55))';
    document.body.appendChild(el);
  },

  _card(which) {
    const el = this.cardEl; if (!el) return;
    el.innerHTML = ''; this.showing = which || null;
    if (which) { const cv = which === 'note' ? noteCard() : bookCard(); cv.style.cssText = 'width:100%;height:auto;display:block'; el.appendChild(cv); this.cardAt = { x: this.k.pos.x, z: this.k.pos.z, t: this.t }; }
    else this.cardAt = null;
    el.style.opacity = which ? '1' : '0';
  },
  _readNote(k) {
    if (this.showing === 'note') { this._card(null); return; }
    this._card('note');
    if (story.add('party')) k.say('A party for guests from the stars. And the fireworks are the welcome.', 0.8, 6);
  },
  _readBook(k) {
    if (this.showing === 'book') { this._card(null); return; }
    this._card('book');
    if (!this.bookRead) { this.bookRead = true; k.say('The last signature is in no alphabet at all. The ink is green, and still wet.', 0.8, 6); }
  },

  near(v, k) {
    if (!this.noteAt || k.G.mode === 'race') return null;
    const p = k.pos, N = this.noteAt, B = this.bookAt;
    const onFloor = Math.abs(p.y - N.y) < 0.8, atNote = (onFloor && Math.hypot(p.x - N.x, p.z - N.z) < 0.85) || (Math.abs(p.y - N.top.y) < 0.5 && Math.hypot(p.x - N.top.x, p.z - N.top.z) < 0.5);
    if (atNote) return { verb: 'READ', hint: story.has('party') ? null : 'A note on the bar, signed D. E to read it.', act: () => this._readNote(k) };
    if (onFloor && Math.hypot(p.x - B.x, p.z - B.z) < 0.8) return { verb: 'READ', hint: this.bookRead ? null : 'The guest book. E to read it.', act: () => this._readBook(k) };
    return null;
  },
  active(k) { const p = k.pos, T = this.T; return !!this.noteAt && (!!this.showing || (p.x > T.x0 - 1 && p.x < T.x1 + 1 && p.z > T.z0 - 1 && p.z < T.z1 + 1 && Math.abs(p.y - T.y) < 4)); },
  update(dt, k) {
    this.t += dt;
    if (this.cakeFlame) { const f = 0.85 + 0.15 * Math.sin(this.t * 11) * Math.sin(this.t * 6.1 + 2); this.cakeFlame.color.setRGB(1.6 * f, 1.0 * f, 0.45 * f); }
    const p = k.pos, N = this.noteAt;
    if (!story.has('party') && Math.abs(p.y - N.y) < 0.8 && Math.hypot(p.x - N.x, p.z - N.z) < 3) k.once('party-note', 'A welcome party. And a note propped against the cake.', 4);
    if (this.cardAt && (Math.hypot(p.x - this.cardAt.x, p.z - this.cardAt.z) > 1.2 || this.t - this.cardAt.t > 16)) this._card(null);
  },
  spots() {
    if (!this.noteAt) return [];
    return [{ kind: 'todo', id: 'party-note', name: 'The Director’s note at the welcome party', ...this.noteAt, top: undefined }, { kind: 'todo', id: 'party-book', name: 'The guest book on the roof', ...this.bookAt }];
  },
  reset() { if (this.cardEl) this._card(null); },
});
