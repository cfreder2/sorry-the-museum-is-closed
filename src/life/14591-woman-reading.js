// Édouard Manet, Woman Reading (1880–82), Gallery 201. The word: leaf.
//
// Nearly half of this small picture is a paper: an illustrated journal clamped in the wooden stick a Paris café
// kept its papers on, its leaves a fan of long grey and blue-white drags of the brush, its print and its engraving
// nothing but a few dark dabs, a band of blue and a squiggle for the caption. Beside it, on the marble, a glass with
// a blue-white handle, the one warm thing at the table. Behind, a garden in flicks of green and red, which the
// museum's note says is one of his own canvases stood up in the studio: the café is staged, the leaves are painted,
// and the heavy coat and the gloves say the air out there is cool. So: a leaf of paper, and the leaves of a garden,
// both of them his brushmarks; and what happens under the picture is that the garden's air gets at the paper.
//
// Look, and the little round marble table slides out from the foot of the wall with the glass on it, and rocks
// twice on its iron feet, as café tables do. The journal comes out from under the frame, shut, edge on; drops,
// opens like a pair of wings, beats once and alights on its stick on the marble, turned towards you: you are the
// one reading now. A leaf turns, with the curl a turned page has. The next lifts at its corner, thinks better of it,
// and then turns too. Then a breath of the garden comes from under the frame on the right, where the garden is in
// the picture: a few of his green dabs and red petals, blown across. The leaves flutter; the top one strains at the
// stick, streams out, and is gone: it sails away over the floor, turns over once, swings back low and out again as
// a loose sheet does, comes round, and slides in over the marble; the glass tips to let it under and sits down on
// it with a clink. One red petal comes down on the open page. While you keep looking, the held leaf lifts in each
// new breath and the glass ticks, and the journal leafs back and forth. When you stop, the glass lets the leaf go,
// it slips back into its place, the journal shuts on the petal and goes up under the frame, and the table goes home.
//
// Everything solid is one mesh and one painted sheet of marks (the pages bend in the shader: a turning leaf is an
// arc that keeps its length); the garden's dabs are a second, the soft shadows a third. Nothing is solid to the
// toy, and nothing is left behind. No tune: reading is quiet, so the sounds are the paper, the iron feet, the wood
// on the marble, the air and the glass. All of it stays below a metre, under every picture from where you stand.
// With "Reduce motion and flashing" on, the loose leaf does not turn over, the fluttering is slow and small, the
// dabs tumble at half speed, and the knocks and the clink are softer.
//
// What it does not do: the reader does not come out (no figure, no face, no gloved hands on the stick), because
// the show turns her paper to you instead of putting her on show; nobody drinks from the glass, which only stands
// there and holds a page down; and the pages carry only what he painted on them, dabs that stand for print, so the
// paper is given no words and no name that the museum does not give it.
import * as THREE from 'three';
import { lifeFor, ease, ramp, clamp01, lerp, rng } from '../paintlife.js';
import { score, hump } from './stagecraft.js';

const PI = Math.PI, TAU = PI * 2;
const U0 = -0.02, OUT0 = 0.44;                 // the table's middle: along the wall from the picture's, and out from it (m)
const TH = 0.33, TR = 0.27;                    // the marble: how high, its radius
const PW = 0.4, PH = 0.54;                    // a leaf of the journal
const STICK = 0.67, BIND = 0.06;               // the stick, and how far up it the leaves begin
const FOOT = [0.035, -0.06];                   // where the stick stands on the marble (x, z from the table's middle)
const BOCK = [-0.13, 0.11], BR = 0.056;         // the glass, and its foot's radius
const LEAN = 0.2;                              // the stick leans back this far (rad)
const TH_R = 0.36, TH_L = PI - 0.36, FAN = 0.034, K_REST = 0.85, K_TURN = 2.5;      // how the leaves lie, and curl as they turn
const NSHEET = 5, LEAF = 3;                    // the leaves: 0 lies left, 1 and 2 turn, 3 gets away, 4 lies right

// The clock (seconds of show).
const T_TABLE = [0.12, 0.95];                  // the table slides out
const T_PEEP = 0.7, T_OUT = 1.15, T_ALIGHT = 1.95;      // the journal: out from under the rail; lets go; on the marble
const T_TURN1 = [2.3, 3.15], T_FALSE = [3.2, 3.58], T_TURN2 = [3.62, 4.45];
const T_GUST = 4.4, T_TEAR = 5.0;              // the air comes; the leaf goes
const FLY = [0, 0.45, 0.85, 1.25, 1.68, 2.05, 2.38, 2.6, 2.82];      // its flight: when it is at each point of its way
const T_TOUCH = T_TEAR + FLY[7], T_LIE = T_TEAR + FLY[8], T_CLINK = T_LIE + 0.06;
const T_PETAL = 8.25;                          // the red petal is down on the page
const T_IDLE = 9.6, IDLE = 9;
// how wide the journal is open as it comes down (1: as it stands): shut; flung wide; one beat forward; settled
const SPREAD = [[T_OUT + 0.05, 0], [T_OUT + 0.42, 1.24], [T_OUT + 0.64, 0.66], [T_ALIGHT + 0.1, 1.05], [T_ALIGHT + 0.4, 1]];                  // afterwards: a breath, and a leaf back and forth, every so often

// The colours, from the picture (mixed a little towards its own palette when it is built).
const PAPER = [['#8a8b7c', 6], ['#7c7d6f', 5], ['#919284', 6], ['#a4a69a', 5], ['#b5bdb3', 3.5], ['#6b6a62', 2], ['#9b9a86', 2]];
const PALE = [['#c3ccc4', 4], ['#b5bdb3', 3], ['#d0d6cc', 2], ['#a9b8bd', 1.5], ['#c9c39a', 1]];
const INK = [['#2b312f', 4], ['#363231', 4], ['#484440', 3], ['#585550', 1.5], ['#5f5038', 1]];
const GARDEN = ['#2a4e41', '#486552', '#62785c', '#3e7a50', '#7f9a5e', '#86886d', '#b8453a', '#c9574a', '#8a3a30', '#c8a782', '#2f5a48', '#557a55'];

const weighted = (set, rand) => { let tot = 0; for (const s of set) tot += s[1]; let r = rand() * tot; for (const s of set) if ((r -= s[1]) <= 0) return s[0]; return set[0][0]; };
// A value through keys [[t, v], ...], smoothly.
const keyed = (K, t) => { if (t <= K[0][0]) return K[0][1]; for (let i = 1; i < K.length; i++) if (t < K[i][0]) return lerp(K[i - 1][1], K[i][1], ease.smooth((t - K[i - 1][0]) / (K[i][0] - K[i - 1][0]))); return K[K.length - 1][1]; };

// ------------------------------------------------------------------ the painted sheet --
// One sheet of everything: the journal's nine faces (5 across, 2 down), the marble, and a square of plain dragged
// paint that the turned and cast things (iron, wood, glass) take their brushmarks from.
const AW = 1024, CW = 200, CH = 282, PX = 204, PY = 288;
const cellOf = i => [2 + (i % 5) * PX, 2 + Math.floor(i / 5) * PY];
const MARBLE = [4, 604, 300], PLAIN = [320, 604, 256], GLASS = [592, 604, 256];
// which face of the sheet each leaf shows: lying right (towards you), and lying left (its back)
const FACE = [[8, 1], [0, 2], [3, 4], [5, 6], [7, 8]];

function paintSheet(P) {
  const cv = document.createElement('canvas'); cv.width = cv.height = AW;
  const g = cv.getContext('2d', { willReadFrequently: true }), R = rng(14591); g.lineCap = 'round'; g.lineJoin = 'round';
  const C = new THREE.Color(), hsl = {};
  const tone = (hex, j = 0.05, a = 1) => { C.set(hex); P.near(C, 0.1, C); C.convertLinearToSRGB().getHSL(hsl); C.setHSL(hsl.h, hsl.s, clamp01(hsl.l + (R() - 0.5) * 2 * j)); return `rgba(${Math.round(C.r * 255)},${Math.round(C.g * 255)},${Math.round(C.b * 255)},${a.toFixed(2)})`; };
  // a drag of a loaded brush: a few bristle lines side by side, each breaking off where it likes
  const drag = (x0, y0, x1, y1, wid, hex, { n = 5, a = 0.8, j = 0.05, bend = 0.12, dry = 0.25 } = {}) => {
    const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len, b = (R() - 0.5) * bend * len;
    for (let k = 0; k < n; k++) {
      const o = ((k + 0.5) / n - 0.5) * wid + (R() - 0.5) * wid / n * 0.8, t0 = R() * dry, t1 = 1 - R() * dry;
      g.strokeStyle = tone(hex, j, a * (0.6 + 0.4 * R())); g.lineWidth = wid / n * (1.0 + R() * 0.9);
      g.beginPath();
      for (let s = 0; s <= 5; s++) { const t = lerp(t0, t1, s / 5), bb = b * 4 * t * (1 - t), x = x0 + dx * t + nx * (o + bb), y = y0 + dy * t + ny * (o + bb); if (s) g.lineTo(x, y); else g.moveTo(x, y); }
      g.stroke();
    }
  };
  // a dab: short, fat, hooked a little
  const dab = (x, y, len, wid, ang, hex, o = {}) => drag(x - Math.cos(ang) * len / 2, y - Math.sin(ang) * len / 2, x + Math.cos(ang) * len / 2, y + Math.sin(ang) * len / 2, wid, hex, { n: 4, a: 0.92, bend: 0.5, dry: 0.12, ...o });

  // ---- a face of the journal. a: 0 at the spine, 1 at the outer edge; b: 0 at the foot, 1 at the head.
  const face = (cell, kind, spineRight) => {
    const [x0, y0] = cellOf(cell), w = CW, h = CH;
    g.save(); g.translate(x0, y0);
    // (its edge a little uneven, as a cut sheet in paint is)
    g.beginPath();
    const edge = []; for (let x = 3; x < w - 3; x += 13) edge.push([x, 2.5 + R() * 2]); for (let y = 3; y < h - 3; y += 13) edge.push([w - 2.5 - R() * 2, y]); for (let x = w - 3; x > 3; x -= 13) edge.push([x, h - 2.5 - R() * 2]); for (let y = h - 3; y > 3; y -= 13) edge.push([2.5 + R() * 2, y]);
    edge.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.clip();
    const X = a => (spineRight ? 1 - a : a) * w, Y = b => (1 - b) * h, shade = kind === 'left' || kind === 'outer', sg = spineRight ? -1 : 1;
    g.fillStyle = tone(shade ? '#6b6a62' : '#82837a', 0.01); g.fillRect(0, 0, w, h);
    // the ground, as he laid it: broad drags down the length of the page, leaning; then narrower ones over them,
    // greyer towards the spine and cold and pale towards the outer edge, where the light is
    for (let i = 0; i < 22; i++) {
      const a = R(), b0 = 0.25 + R() * 0.9, len = (0.45 + 0.6 * R()) * h, lean = sg * (0.04 + 0.1 * R()) * len;
      drag(X(a), Y(b0), X(a) + lean, Y(b0) + len, 18 + R() * 16, weighted(PAPER, R), { n: 7, a: 0.85, j: 0.05, bend: 0.05, dry: 0.15 });
    }
    for (let i = 0; i < 40; i++) {
      const a = R(), b0 = 0.1 + R() * 1.0, len = (0.2 + 0.45 * R()) * h, lean = sg * (0.03 + 0.12 * R()) * len;
      const hex = a > 0.55 && R() < 0.5 ? weighted(PALE, R) : a < 0.3 && R() < 0.5 ? '#63635b' : weighted(PAPER, R);
      drag(X(a), Y(b0), X(a) + lean, Y(b0) + len, 8 + R() * 9, hex, { n: 5, a: shade ? 0.5 : 0.72, j: 0.045, bend: 0.07, dry: 0.3 });
    }
    if (shade) { g.fillStyle = 'rgba(50,48,46,0.34)'; g.fillRect(0, 0, w, h); }
    // towards the spine it falls into shadow; along the outer edge and the head, the pale edges of the leaves under it
    for (let i = 0; i < 4; i++) drag(X(0.02 + 0.03 * i), Y(1.02), X(0.03 + 0.035 * i), Y(-0.02), 9, i < 2 ? '#4f4e48' : '#63625b', { n: 4, a: 0.55 - 0.09 * i, bend: 0.03 });
    if (!shade) {
      for (let i = 0; i < 4; i++) drag(X(0.895 + 0.028 * i), Y(0.98 - 0.03 * R()), X(0.895 + 0.028 * i) + sg * 3, Y(0.03 * R()), 5 + R() * 3, weighted(PALE, R), { n: 3, a: 0.9, bend: 0.04, dry: 0.1 });
      drag(X(0.862), Y(0.95), X(0.872), Y(0.3), 3, '#b9a868', { n: 2, a: 0.65, bend: 0.03 }); drag(X(0.875), Y(0.6), X(0.88), Y(0.1), 2.5, '#5e7f8e', { n: 2, a: 0.5, bend: 0.03 });
      drag(X(0.12), Y(0.957), X(0.9), Y(0.967), 7, weighted(PALE, R), { n: 4, a: 0.75, bend: 0.03 });
    }
    // what is printed there: type is a few soft grey smears, a line at a time...
    const rows = (a0, a1, b0, b1, step = 0.046) => { for (let b = b0; b > b1; b -= step * (0.85 + 0.3 * R())) { let a = a0 + R() * 0.03; while (a < a1 - 0.05) { const e = Math.min(a1, a + 0.08 + 0.2 * R()); drag(X(a), Y(b), X(e), Y(b) + (R() - 0.5) * 3, 4.6, '#4b4a44', { n: 3, a: 0.26 + 0.1 * R(), j: 0.03, bend: 0.04, dry: 0.3 }); a = e + 0.02 + 0.03 * R(); } } };
    // ...a heading or a caption a quick dark scrawl...
    const scrawl = (a0, a1, b, lw = 2.2) => {
      g.strokeStyle = tone('#2f2d2b', 0.02, 0.88); g.lineWidth = lw; g.beginPath(); const xa = X(a0), xb = X(a1), n = Math.max(5, Math.round(Math.abs(xb - xa) / 4.5)); let y = Y(b), pen = false;
      for (let s = 0; s <= n; s++) { const x = lerp(xa, xb, s / n); y += (R() - 0.5) * 3.4 + (Y(b) - y) * 0.5; if (R() < 0.13) { pen = false; continue; } if (pen) g.lineTo(x, y); else g.moveTo(x, y); pen = true; }
      g.stroke();
    };
    // ...and the engraving his dark hooked dabs, over a thin dark rub that holds them together
    const cluster = (list, k = 1) => {
      for (const [a, b, len] of list) if (R() < 0.7) dab(X(a + (R() - 0.5) * 0.05), Y(b + (R() - 0.5) * 0.03), len * w * k * 1.5, 15 * k, R() * PI, '#5a5850', { n: 5, a: 0.3, bend: 0.3, dry: 0.3 });
      list.forEach(([a, b, len, ang, wd = 10]) => dab(X(a), Y(b), len * w * k * 1.12, wd * k, (spineRight ? PI - ang : ang) + (R() - 0.5) * 0.3, weighted(INK, R)));
    };
    const bird = (a, b, s = 1) => { g.strokeStyle = tone('#34312d', 0.02, 0.95); g.lineWidth = 2.6 * s; g.beginPath(); g.moveTo(X(a) - 8 * s, Y(b) - 3 * s); g.quadraticCurveTo(X(a) - 3 * s, Y(b) - 6 * s, X(a), Y(b)); g.quadraticCurveTo(X(a) + 4 * s, Y(b) - 7 * s, X(a) + 10 * s, Y(b) - 5 * s); g.stroke(); };
    const band = (a0, a1, b, wd = 9) => { drag(X(a0), Y(b), X(a1), Y(b) - 2, wd, '#5e7f8e', { n: 4, a: 0.92, bend: 0.03, dry: 0.08 }); drag(X(lerp(a0, a1, 0.25)), Y(b) - 2, X(a1), Y(b) - 3, wd * 0.45, '#86abbd', { n: 2, a: 0.85, bend: 0.03 }); };
    if (kind === 'plate') {
      // the page as he painted it: a dark touch at the head, a mark like a bird, a leaning mass of hooked dabs with
      // a stem under it, the band of blue, and the scrawl of a caption
      dab(X(0.3), Y(0.85), 0.13 * w, 13, 0.5, '#484440'); dab(X(0.37), Y(0.82), 0.08 * w, 8, -0.3, '#585550', { a: 0.7 }); bird(0.46, 0.745);
      cluster([[0.4, 0.68, 0.13, -0.9], [0.52, 0.65, 0.13, -0.5], [0.45, 0.59, 0.16, -1.0, 12], [0.58, 0.55, 0.14, -0.7, 12], [0.48, 0.49, 0.17, -0.5, 13], [0.62, 0.46, 0.13, -1.1, 11], [0.53, 0.4, 0.16, -0.6, 12], [0.65, 0.36, 0.12, -0.9], [0.5, 0.33, 0.12, -0.3], [0.38, 0.52, 0.1, -1.2], [0.7, 0.52, 0.09, -0.2, 8]]);
      dab(X(0.5), Y(0.52), 0.08 * w, 6, -0.6, '#6b5a3a'); dab(X(0.6), Y(0.42), 0.07 * w, 5, -0.8, '#7a6540'); dab(X(0.44), Y(0.62), 0.05 * w, 4, -0.4, '#7a6540');
      drag(X(0.6), Y(0.33), X(0.64), Y(0.17), 5, '#363231', { n: 3, a: 0.9, bend: 0.2 }); drag(X(0.54), Y(0.27), X(0.5), Y(0.17), 4, '#484440', { n: 2, a: 0.85, bend: 0.3 });
      band(0.48, 0.93, 0.155, 10); drag(X(0.46), Y(0.118), X(0.92), Y(0.112), 6, '#a9b8bd', { n: 3, a: 0.6, bend: 0.02 });
      scrawl(0.28, 0.52, 0.082, 2.6);
    } else if (kind === 'left') {
      // the page in shadow beside it: a column of dark curved strokes, and a lattice of lines low down
      [[0.5, 0.76], [0.56, 0.64], [0.52, 0.52], [0.6, 0.42]].forEach(([a, b], i) => dab(X(a), Y(b), 0.17 * w, 9, (spineRight ? PI - 1.2 : 1.2) + 0.2 * i, '#2b2927', { bend: 0.9 }));
      for (const [a0, b0, a1, b1] of [[0.2, 0.3, 0.5, 0.09], [0.22, 0.11, 0.48, 0.28], [0.16, 0.33, 0.2, 0.06], [0.3, 0.32, 0.56, 0.2]]) drag(X(a0), Y(b0), X(a1), Y(b1), 3.4, '#2f2d2b', { n: 2, a: 0.7, bend: 0.08, dry: 0.2 });
      rows(0.14, 0.42, 0.84, 0.42, 0.055);
    } else if (kind === 'text') {
      scrawl(0.2, 0.8, 0.9, 3); rows(0.12, 0.47, 0.82, 0.12); rows(0.55, 0.88, 0.48, 0.12);
      cluster([[0.6, 0.76, 0.12, 0.3], [0.72, 0.72, 0.13, -0.4], [0.65, 0.65, 0.14, 0.1, 11], [0.79, 0.64, 0.1, -0.9], [0.59, 0.6, 0.09, 0.8], [0.72, 0.58, 0.1, 0.5]]);
      scrawl(0.58, 0.84, 0.53);
    } else if (kind === 'oval') {
      for (let i = 0; i < 15; i++) { const t = i / 15 * TAU, rr = 0.5 + 0.5 * R(); cluster([[0.5 + 0.28 * Math.cos(t) * rr, 0.61 + 0.18 * Math.sin(t) * rr, 0.1 + 0.05 * R(), t + PI / 2 + 0.4, 9 + 4 * R()]]); }
      bird(0.64, 0.83, 0.8); band(0.3, 0.72, 0.47, 7);
      scrawl(0.34, 0.66, 0.36); rows(0.14, 0.86, 0.28, 0.1);
    } else if (kind === 'two') {
      cluster([[0.3, 0.79, 0.13, -0.7], [0.41, 0.75, 0.11, -0.3], [0.33, 0.69, 0.14, -1.0, 11], [0.24, 0.71, 0.09, 0.4], [0.42, 0.67, 0.09, 0.2]]); scrawl(0.2, 0.48, 0.6);
      cluster([[0.66, 0.37, 0.13, 0.6], [0.75, 0.31, 0.12, 0.2, 11], [0.62, 0.29, 0.11, 1.0], [0.72, 0.41, 0.09, -0.4], [0.8, 0.38, 0.08, 0.9]]); scrawl(0.56, 0.86, 0.2);
      rows(0.55, 0.88, 0.84, 0.5); rows(0.12, 0.46, 0.5, 0.12);
    } else if (kind === 'leafA') {
      // the leaf that gets away: the boldest plate, so that it reads as it flies
      band(0.14, 0.86, 0.71, 12); bird(0.36, 0.84); bird(0.56, 0.87, 0.8);
      cluster([[0.3, 0.56, 0.16, -0.4, 13], [0.44, 0.5, 0.17, -0.8, 13], [0.36, 0.42, 0.18, -0.2, 14], [0.54, 0.4, 0.15, -1.0, 12], [0.48, 0.32, 0.17, -0.5, 13], [0.64, 0.5, 0.12, 0.3, 11], [0.7, 0.36, 0.13, -0.7, 11], [0.6, 0.27, 0.12, -0.2], [0.26, 0.34, 0.12, 0.5, 11]]);
      dab(X(0.42), Y(0.46), 0.09 * w, 6, -0.5, '#7a6540'); drag(X(0.2), Y(0.21), X(0.82), Y(0.2), 5, '#484440', { n: 3, a: 0.8, bend: 0.03 });
      scrawl(0.32, 0.7, 0.12, 2.6);
    } else if (kind === 'leafB') {
      scrawl(0.25, 0.75, 0.9, 3); rows(0.12, 0.46, 0.82, 0.14); rows(0.54, 0.88, 0.82, 0.32);
      cluster([[0.64, 0.22, 0.1, 0.2, 9], [0.74, 0.18, 0.1, -0.5, 9], [0.7, 0.26, 0.08, 0.8, 8]]);
    } else if (kind === 'last') {
      // the page left open at the end: mostly paper, for the petal to lie on
      scrawl(0.2, 0.72, 0.9, 3); rows(0.12, 0.88, 0.83, 0.73, 0.045);
      cluster([[0.28, 0.31, 0.13, -0.6], [0.39, 0.27, 0.12, -0.2, 11], [0.3, 0.21, 0.13, -0.9], [0.45, 0.2, 0.09, 0.3], [0.22, 0.25, 0.08, 0.6]]); band(0.52, 0.88, 0.2, 7); scrawl(0.22, 0.5, 0.1);
    } else {
      // the outside of the paper: its heading, scrawled, and little else
      scrawl(0.18, 0.84, 0.86, 4.2); scrawl(0.3, 0.7, 0.78); rows(0.16, 0.84, 0.66, 0.2, 0.08);
    }
    g.restore();
  };
  ['plate', 'left', 'text', 'oval', 'two', 'leafA', 'leafB', 'last', 'outer'].forEach((k, i) => face(i, k, [1, 2, 4, 6].includes(i) || i === 8));

  // ---- the marble: scraped sideways, cold whites over a warm grey, and the glass's amber lying in it
  {
    const [x0, y0, s] = MARBLE; g.save(); g.translate(x0, y0); g.beginPath(); g.rect(-3, -3, s + 6, s + 6); g.clip();
    g.fillStyle = tone('#9a9c8b', 0.01); g.fillRect(-3, -3, s + 6, s + 6);
    const M = [['#a3a996', 5], ['#b3b9aa', 4], ['#c3c9bb', 2], ['#9aa28d', 5], ['#9b8f76', 3], ['#858a78', 3]];
    for (let i = 0; i < 80; i++) { const x = R() * s, y = R() * s, len = 40 + R() * 90; drag(x - len / 2, y, x + len / 2, y + (R() - 0.5) * 10, 8 + R() * 10, weighted(M, R), { n: 5, a: 0.75, j: 0.03, bend: 0.08 }); }
    for (let i = 0; i < 14; i++) { const x = R() * s, y = s * (0.02 + 0.3 * R()), len = 50 + R() * 80; drag(x - len / 2, y, x + len / 2, y, 10, '#625441', { n: 4, a: 0.3, bend: 0.05 }); }      // darker at the back, under the paper
    const mx = v => s / 2 + v / TR * s / 2, bx = mx(BOCK[0]), by = mx(BOCK[1]);
    // (the glass's reflection, pulled down towards you, as he has it; and where it and the stick stand, a touch of dark)
    for (let i = 0; i < 7; i++) drag(bx + (R() - 0.5) * 34, by + 8, bx + (R() - 0.5) * 30, by + 50 + R() * 34, 6 + R() * 4, ['#a8642e', '#86613c', '#b07a3e', '#8c4a20'][i % 4], { n: 3, a: 0.62, bend: 0.1 });
    drag(bx - 10, by + 30, bx - 8, by + 62, 3, '#d9d6c0', { n: 2, a: 0.6 });
    const sh = (x, y, r, a) => { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(30,24,20,${a})`); gr.addColorStop(1, 'rgba(30,24,20,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r); };
    sh(bx + 4, by - 2, BR / TR * s / 2 * 1.5, 0.5); sh(mx(FOOT[0]) + 2, mx(FOOT[1]), 16, 0.5);
    g.restore();
  }
  // ---- plain dragged paint, light, for things that carry their own colour
  {
    const [x0, y0, s] = PLAIN; g.save(); g.translate(x0, y0); g.beginPath(); g.rect(-3, -3, s + 6, s + 6); g.clip();
    g.fillStyle = '#e4e4e4'; g.fillRect(-3, -3, s + 6, s + 6);
    for (let i = 0; i < 70; i++) { const x = R() * s, y = R() * s, len = 50 + R() * 110, v = 196 + Math.floor(R() * 59); g.globalAlpha = 0.7; drag(x, y - len / 2, x + (R() - 0.5) * 8, y + len / 2, 7 + R() * 9, `rgb(${v},${v},${v})`, { n: 5, a: 1, j: 0, bend: 0.06 }); }
    g.globalAlpha = 1; g.restore();
  }
  // ---- the glass, unrolled (round it, left to right; its foot at the bottom): amber in upright drags, darker at
  // its edges, a pale head, a cold thick foot, and his one light down its left side
  {
    const [x0, y0, s] = GLASS; g.save(); g.translate(x0, y0); g.beginPath(); g.rect(-3, -3, s + 6, s + 6); g.clip();
    g.fillStyle = tone('#6a4e2c', 0.01); g.fillRect(-3, -3, s + 6, s + 6);
    for (let i = 0; i < 70; i++) { const x = R() * s, y = s * (0.2 + 0.7 * R()), len = 40 + R() * 90; drag(x, y - len / 2, x + (R() - 0.5) * 6, y + len / 2, 7 + R() * 9, ['#86613c', '#6a4a2a', '#9c7743', '#b98a4a', '#7a5a34', '#a8642e', '#8a6a3a', '#5b4326'][i % 8], { n: 4, a: 0.8, j: 0.04, bend: 0.06 }); }
    for (let i = 0; i < 30; i++) { const x = R() * s, y = s * (0.01 + 0.17 * R()); drag(x - 24, y, x + 24, y + (R() - 0.5) * 6, 10 + R() * 8, ['#b0a27b', '#8e846a', '#a39570', '#c2b48c'][i % 4], { n: 4, a: 0.85, j: 0.03, bend: 0.1 }); }      // its head
    for (let i = 0; i < 10; i++) { const x = R() * s; drag(x - 24, s * 0.955, x + 24, s * 0.955, 9, ['#8fa3aa', '#6f838c', '#b9c7c8'][i % 3], { n: 3, a: 0.8, bend: 0.05 }); }                                              // its foot
    // (the light: where the turned thing faces up and to the left)
    const lx = s * (0.5 - 0.64 / TAU * 1) ; drag(lx, s * 0.24, lx + 2, s * 0.8, 6, '#d9c79a', { n: 3, a: 0.75, bend: 0.04, dry: 0.15 }); drag(lx + 9, s * 0.3, lx + 10, s * 0.6, 3, '#e6dcc0', { n: 2, a: 0.7, bend: 0.04 });
    g.restore();
  }
  const img = g.getImageData(0, 0, AW, AW), d = img.data;
  C.set('#8a8b7c'); P.near(C, 0.1, C).convertLinearToSRGB();
  for (let i = 0; i < d.length; i += 4) if (d[i + 3] < 255) { if (d[i + 3] === 0) { d[i] = C.r * 255; d[i + 1] = C.g * 255; d[i + 2] = C.b * 255; } d[i + 3] = d[i + 3] > 127 ? 255 : 0; }
  const t = new THREE.DataTexture(new Uint8Array(d), AW, AW, THREE.RGBAFormat);
  t.colorSpace = THREE.SRGBColorSpace; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter; t.anisotropy = 4; t.needsUpdate = true;
  return t;
}

// One dab of the garden: a loaded touch, fuller in the middle, streaked along its length, darker at its edge.
function dabTexture() {
  const S = 64, cv = document.createElement('canvas'); cv.width = cv.height = S;
  const g = cv.getContext('2d'), img = g.createImageData(S, S), d = img.data, r = rng(77);
  const streak = Array.from({ length: S }, () => 0.82 + 0.18 * r());
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const u = (x + 0.5) / S * 2 - 1, v = (y + 0.5) / S * 2 - 1, w = 0.62 * Math.pow(Math.max(0, 1 - u * u), 0.6) * (1 - 0.18 * u), e = Math.abs(v + 0.08 * Math.sin(u * 3)) / Math.max(0.02, w), i = (y * S + x) * 4;
    const lum = (0.78 + 0.22 * (1 - e)) * streak[y] * (v < -0.1 * w ? 1.06 : 0.94);
    d[i] = d[i + 1] = d[i + 2] = Math.min(255, 255 * lum); d[i + 3] = e < 1 - 0.25 * r() * Math.abs(u) ? 255 : 0;
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}

lifeFor(14591, {
  title: /^Woman Reading/,
  word: 'leaf',
  // (a small work, hung high: the camera stands just over a metre, so everything of the show, which keeps below
  // that, is under every picture from there)
  stage: { out: 1.5, half: 1.2, cam: { dist: 2.4, height: 1.06, side: 0.22, fov: 60, lookU: -0.06, lookOut: 0.5, lookH: 0.84, floorOut: 0.85 } },
  wake: 2, ret: 2.4,

  build(L) {
    const P = L.pal, col = (h, a = 0.1) => P.near(h, a), R = L.rand, V3 = THREE.Vector3;
    const root = this.root = new THREE.Group(); L.floor(U0, OUT0, root.position); root.rotation.y = L.yawOut; L.group.add(root);
    this.railY = L.rail - L.y;
    this.zWall = -OUT0;                                        // (the table's own z of the canvas plane)
    this.zIn = this.zWall - L.wall - PW - 0.12;                // the journal, shut, wholly in the wall
    this.tableIn = this.zWall - L.wall - TR - 0.1;             // the table, in the wall

    // ---------------------------------------------------------- one mesh: table, glass, stick and leaves
    const pos = [], nor = [], uv = [], uvB = [], colr = [], part = [];
    const vert = (p, n, t, c, pt, sh = -1, tb = t) => { pos.push(p.x, p.y, p.z); nor.push(n.x, n.y, n.z); uv.push(t[0] / AW, t[1] / AW); uvB.push(tb[0] / AW, tb[1] / AW); colr.push(c.r, c.g, c.b); part.push(pt, sh); };
    const plain = (a, b) => [PLAIN[0] + 4 + (((a % 1) + 1) % 1) * (PLAIN[2] - 8), PLAIN[1] + 4 + clamp01(b) * (PLAIN[2] - 8)];
    // a turned thing: prof [[r, y], ...] from the foot up; colour by where and which way it faces
    const lathe = (pt, prof, seg, colFn, { at = [0, 0, 0], uvFn = null } = {}) => {
      const n = prof.length, nr = k => { const a = prof[Math.max(0, k - 1)], b = prof[Math.min(n - 1, k + 1)], dr = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dr, dy) || 1; return [dy / l, -dr / l]; };
      const P3 = (k, j) => { const ph = j / seg * TAU; return new V3(at[0] + prof[k][0] * Math.sin(ph), at[1] + prof[k][1], at[2] + prof[k][0] * Math.cos(ph)); };
      const N3 = (k, j) => { const ph = j / seg * TAU, [a, b] = nr(k); return new V3(a * Math.sin(ph), b, a * Math.cos(ph)); };
      const T2 = (k, j) => (uvFn ? uvFn(prof[k][0], prof[k][1], j / seg * TAU) : plain(j / seg, k / (n - 1)));
      for (let k = 0; k < n - 1; k++) for (let j = 0; j < seg; j++) {
        const q = [[k, j], [k, j + 1], [k + 1, j + 1], [k, j], [k + 1, j + 1], [k + 1, j]];
        for (const [a, b] of q) { const nn = N3(a, b); vert(P3(a, b), nn, T2(a, b), colFn(prof[a][0], prof[a][1], nn, b / seg * TAU), pt); }
      }
    };
    // a bent rod: along pts, radius r(t); colour by which way it faces
    const tube = (pt, pts, rad, colFn, seg = 8, steps = 14) => {
      const cu = new THREE.CatmullRomCurve3(pts, false, 'centripetal'), fr = cu.computeFrenetFrames(steps, false), c = new V3();
      const P3 = (i, j, nOnly) => { const a = j / seg * TAU, n = fr.normals[i].clone().multiplyScalar(Math.cos(a)).addScaledVector(fr.binormals[i], Math.sin(a)); if (nOnly) return n; cu.getPointAt(i / steps, c); return c.clone().addScaledVector(n, rad(i / steps)); };
      for (let i = 0; i < steps; i++) for (let j = 0; j < seg; j++) for (const [a, b] of [[i, j], [i, j + 1], [i + 1, j + 1], [i, j], [i + 1, j + 1], [i + 1, j]]) { const n = P3(a, b, true); vert(P3(a, b), n, plain(b / seg, a / steps), colFn(n, a / steps), pt); }
    };
    // (the light is from the upper left and in front, as in the picture: a turned thing is painted with it)
    const LIGHT = new V3(-0.5, 0.55, 0.67).normalize();
    const lit = (shadeHex, midHex, lightHex) => { const a = col(shadeHex), b = col(midHex), c = col(lightHex); return n => { const k = n.dot(LIGHT); return k > 0.55 ? c : k > -0.1 ? b.clone().lerp(c, clamp01(k / 0.55) * 0.5) : a.clone().lerp(b, clamp01((k + 1) / 0.9)); }; };

    // the table: a round of marble on a cast-iron stem and three feet
    const marble = lit('#6f716b', '#b3b7aa', '#d0d4c8'), under = col('#55554e'), white = new THREE.Color(1, 1, 1), paper = new THREE.Color(0.9, 0.9, 0.885), iron = lit('#141613', '#262a25', '#5b6258');
    lathe(0, [[0.0, TH - 0.03], [TR - 0.02, TH - 0.03], [TR - 0.004, TH - 0.024], [TR, TH - 0.012], [TR - 0.003, TH - 0.003], [TR - 0.012, TH], [0.0, TH]], 40,
      (r, y, n) => (n.y > 0.9 ? white : n.y < -0.5 ? under : marble(n)),
      { uvFn: (r, y, ph) => (y >= TH - 0.004 ? [MARBLE[0] + MARBLE[2] / 2 + r * Math.sin(ph) / TR * MARBLE[2] / 2 * 0.98, MARBLE[1] + MARBLE[2] / 2 + r * Math.cos(ph) / TR * MARBLE[2] / 2 * 0.98] : plain(ph / TAU * 3, y * 9)) });
    lathe(0, [[0.0, 0.08], [0.052, 0.085], [0.044, 0.105], [0.021, 0.125], [0.017, 0.16], [0.026, 0.185], [0.029, 0.21], [0.018, 0.245], [0.016, 0.27], [0.032, 0.288], [0.075, 0.296], [0.08, TH - 0.03]], 14, (r, y, n) => iron(n));
    for (let i = 0; i < 3; i++) {
      const a = i / 3 * TAU + 0.5, dx = Math.sin(a), dz = Math.cos(a);
      tube(0, [new V3(dx * 0.03, 0.11, dz * 0.03), new V3(dx * 0.11, 0.12, dz * 0.11), new V3(dx * 0.185, 0.068, dz * 0.185), new V3(dx * 0.225, 0.02, dz * 0.225), new V3(dx * 0.245, 0.012, dz * 0.245)], t => 0.015 - 0.004 * t + 0.006 * Math.pow(t, 6), n => iron(n), 8, 12);
    }
    // the glass: amber, paler at the head, a cold thick foot, and its handle in blue-white
    const form = lit('#6e6e6e', '#c4c4c4', '#ffffff'), handle = lit('#54768e', '#a9c3cd', '#e2e9e6');
    lathe(1, [[0.0, 0.0], [BR, 0.0], [BR + 0.002, 0.01], [BR - 0.005, 0.024], [BR - 0.004, 0.06], [BR + 0.001, 0.12], [BR + 0.005, 0.156], [BR + 0.006, 0.18], [BR + 0.001, 0.186], [0.0, 0.181]], 24,
      (r, y, n) => form(n), { uvFn: (r, y, ph) => [GLASS[0] + 4 + ((ph / TAU + 0.5) % 1) * (GLASS[2] - 8), GLASS[1] + 4 + (1 - clamp01(y / 0.186)) * (GLASS[2] - 8)] });
    tube(1, [new V3(BR - 0.004, 0.142, 0), new V3(BR + 0.038, 0.146, 0), new V3(BR + 0.055, 0.1, 0), new V3(BR + 0.04, 0.05, 0), new V3(BR - 0.004, 0.044, 0)].map(p => p.applyAxisAngle(new V3(0, 1, 0), -0.5)), () => 0.0095, n => handle(n), 8, 14);
    // the stick: turned wood, a knob at its top, a brass ring above the grip (its foot is BIND below the leaves)
    const wood = lit('#1c140d', '#3a2b1b', '#6a5236'), knob = lit('#1c1610', '#3a3022', '#66573a'), brass = lit('#4d3b17', '#806428', '#b3964a');
    lathe(2, [[0.0, -BIND], [0.014, -BIND + 0.002], [0.016, -BIND + 0.03], [0.014, -0.02], [0.017, -0.017], [0.017, -0.006], [0.0125, -0.003], [0.0125, 0.02], [0.011, PH + 0.012], [0.015, PH + 0.02], [0.027, PH + 0.038], [0.028, PH + 0.054], [0.017, PH + 0.07], [0.0, PH + 0.074]], 12,
      (r, y, n) => (y > PH + 0.014 ? knob(n) : y > -0.018 && y < -0.005 ? brass(n) : wood(n)), { at: [0, 0, -0.014] });
    // the leaves: grids that the shader bends
    const NS = 12, NV = 5, up = new V3(0, 0, 1);
    for (let i = 0; i < NSHEET; i++) {
      const [fa, fb] = FACE[i].map(cellOf);
      const A = (s, v) => [fa[0] + 1 + s * (CW - 2), fa[1] + 1 + (1 - v) * (CH - 2)], B = (s, v) => [fb[0] + 1 + (1 - s) * (CW - 2), fb[1] + 1 + (1 - v) * (CH - 2)];
      for (let a = 0; a < NS; a++) for (let b = 0; b < NV; b++) for (const [da, db] of [[0, 0], [1, 0], [1, 1], [0, 0], [1, 1], [0, 1]]) { const s = (a + da) / NS, v = (b + db) / NV; vert(new V3(s * PW, v * PH, 0), up, A(s, v), paper, i === LEAF ? 3 : 2, i, B(s, v)); }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.setAttribute('uvB', new THREE.Float32BufferAttribute(uvB, 2)); geo.setAttribute('color', new THREE.Float32BufferAttribute(colr, 3)); geo.setAttribute('aPart', new THREE.Float32BufferAttribute(part, 2));
    const U = this.U = { uM: { value: [0, 1, 2, 3].map(() => new THREE.Matrix4()) }, uS: { value: Array.from({ length: NSHEET }, () => new THREE.Vector4()) }, uLight: { value: LIGHT } };
    const mat = new THREE.MeshBasicMaterial({ map: paintSheet(P), vertexColors: true, side: THREE.DoubleSide, alphaTest: 0.5, fog: false });
    mat.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, U);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', `#include <common>
attribute vec2 aPart, uvB; uniform mat4 uM[4]; uniform vec4 uS[${NSHEET}];
varying vec3 vN; varying vec2 vUvB; varying float vSheet;`).replace('#include <begin_vertex>', /* glsl */`
  vec3 transformed = position, lfN = normal;
  if (aPart.y > -0.5) {
    // a leaf: held along its spine, lying off at an angle (S.x) and curling (S.y; more at the head by S.z) from S.w
    // out along it; an arc keeps its length, so the paper never stretches
    vec4 S = uS[int(aPart.y + 0.5)];
    float s = max(position.x - S.w, 0.0), s0 = min(position.x, S.w), kap = S.y + S.z * (position.y / ${PH.toFixed(3)} - 0.5), ph = S.x + kap * s;
    vec2 xz = s0 * vec2(cos(S.x), sin(S.x)) + (abs(kap) < 1.0e-3 ? s * vec2(cos(S.x), sin(S.x)) : vec2(sin(ph) - sin(S.x), cos(S.x) - cos(ph)) / kap);
    transformed = vec3(xz.x, position.y, xz.y); lfN = vec3(-sin(ph), 0.0, cos(ph));
  }
  { mat4 lfM = uM[int(aPart.x + 0.5)]; transformed = (lfM * vec4(transformed, 1.0)).xyz; vN = mat3(lfM) * lfN; }
  vUvB = uvB; vSheet = step(-0.5, aPart.y);`);
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vN; varying vec2 vUvB; varying float vSheet; uniform vec3 uLight;')
        .replace('#include <map_fragment>', /* glsl */`
  {
    bool lfBack = vSheet > 0.5 && !gl_FrontFacing;
    vec4 lfT = texture2D(map, lfBack ? vUvB : vMapUv);
    vec3 lfN = normalize(vN) * (lfBack ? -1.0 : 1.0);
    // (painted with the light that is in the picture; what turns from it goes down into his greys)
    float lfL = dot(lfN, uLight);
    diffuseColor *= vec4(lfT.rgb * mix(0.5, 1.0, smoothstep(-0.7, 0.9, lfL)), lfT.a);
  }`);
    };
    mat.customProgramCacheKey = () => 'manet-leaf';
    this.mesh = new THREE.Mesh(geo, mat); L.add(this.mesh, root);

    // ---------------------------------------------------------- the garden's dabs: leaves and petals on the air
    const ND = this.ND = 26, D = this.D = [];
    const mouth = () => new V3(0.15 + 0.12 * R() - U0, this.railY - 0.035, this.zWall + 0.03);
    for (let i = 0; i < ND; i++) {
      const red = i === 0 || i % 5 === 3, pink = i % 9 === 5, hex = red ? GARDEN[6 + (i % 3)] : pink ? GARDEN[9] : [GARDEN[0], GARDEN[1], GARDEN[2], GARDEN[3], GARDEN[4], GARDEN[5], GARDEN[10], GARDEN[11]][i % 8];
      const d = { i, red, t0: T_GUST - 0.1 + (i === 0 ? 0.55 : 0.95 * R()), m: mouth(), a0: R() * TAU, w: -(2.6 + 2.2 * R()), h: (R() - 0.5) * 0.34, seed: R(), len: red ? 0.066 + 0.014 * R() : 0.08 + 0.04 * R(), asp: red ? 0.78 : 0.4 + 0.16 * R(), c: col(hex, 0.12).multiplyScalar(1.12), spin: new V3(3 + 5 * R(), 2 + 5 * R(), 3 + 4 * R()), yaw: R() * TAU };
      // where it comes down: the floor, mostly downwind (two on the marble; the first, a red one, on the open page)
      d.fly = 2.9 + 1.0 * R();
      if (i === 0) { d.fly = T_PETAL - d.t0; d.page = true; d.land = new V3(); }
      else if (i === 4 || i === 11) d.land = new V3(i === 4 ? 0.15 : 0.07, TH + 0.005, i === 4 ? 0.09 : 0.2);
      else { let x, z; do { x = -1.0 + 1.45 * R(); z = -0.28 + 1.05 * R(); } while (Math.hypot(x, z) < 0.33 && R() < 0.8); d.land = new V3(x, 0.007 + 0.0004 * i, z); }
      D.push(d);
    }
    const dg = new THREE.PlaneGeometry(1, 1);
    const dm = new THREE.MeshBasicMaterial({ map: dabTexture(), alphaTest: 0.5, side: THREE.DoubleSide, fog: false });
    this.dabs = new THREE.InstancedMesh(dg, dm, ND); this.dabs.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    D.forEach((d, i) => this.dabs.setColorAt(i, d.c)); L.add(this.dabs, root);

    // ---------------------------------------------------------- soft shadows on the floor: the table's, the flying leaf's
    this.blobs = L.blobs(2, { fade: true }); this.blobs.count = 2;

    // ---------------------------------------------------------- the leaf's way through the air
    // (the table's own x, y, z: along the wall, up, out). Away downwind and up; a low swing back across in front of
    // you; up at the right; back, lower; a last small rise, and in over the marble from the front left.
    const dX = this.dX = new V3(-0.5, 0, 0.866), dY = this.dY = new V3(0.866, 0, 0.5);       // as it lies: its width runs out over the rim, its length along it
    const lie = this.lie = new V3(BOCK[0], TH + 0.004, BOCK[1]).addScaledVector(dX, PW / 2 - 0.05).addScaledVector(dY, PH / 2 - 0.22);      // its middle, lying (one edge under the glass)
    this.qLie = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(dX, dY, new V3(0, 1, 0)));
    this.tmp = { a: new V3(), b: new V3(), c: new V3(), v: new V3(), x: new V3(), y: new V3(), z: new V3(), m: new THREE.Matrix4(), m2: new THREE.Matrix4(), q: new THREE.Quaternion(), q2: new THREE.Quaternion(), e: new THREE.Euler(0, 0, 0, 'YXZ'), s: new V3(1, 1, 1) };
    this.qT = new THREE.Quaternion();
    this.J = { foot: new V3(), lean: 0, yaw: 0, roll: 0, show: false, spread: 1, m: new THREE.Matrix4() };
    this.sheet = { th: 0, kap: 0, tw: 0, p: 0, dir: 0 };
    this.free = { c: new V3(), q: new THREE.Quaternion(), kap: 0, s0: 0 };
    // where it lets go: from the journal as it stands at that moment
    this.jPose(L, T_TEAR, 0); this.sheetPose(LEAF, T_TEAR, 0, false);
    this.q0 = new THREE.Quaternion().setFromRotationMatrix(this.J.m).multiply(new THREE.Quaternion().setFromAxisAngle(new V3(0, 1, 0), -this.sheet.th));
    this.c0 = new V3(PW / 2, PH / 2, 0).applyQuaternion(this.q0).add(new V3().setFromMatrixPosition(this.J.m));
    this.k0 = this.sheet.kap;
    const way = [this.c0.clone(), new V3(-0.52, 0.88, 0.4), new V3(-0.88, 0.62, 0.72), new V3(-0.2, 0.4, 0.84), new V3(0.5, 0.62, 0.74), new V3(-0.05, 0.47, 0.8), new V3(-0.58, 0.56, 0.74), lie.clone().addScaledVector(dX, 0.22).setY(TH + 0.016), lie.clone()];
    this.way = new THREE.CatmullRomCurve3(way, false, 'centripetal');
    this.hide();
  },

  hide() { this.mesh.visible = false; this.dabs.visible = false; this.blobs.visible = false; },

  // ---- the journal's stand at clock T (Rt: how far home it is), into this.J: its foot, its lean, how wide it is open
  jPose(L, T, Rt) {
    const J = this.J, t = this.tmp, calm = L.calm;
    const yE = this.railY - 0.03 - (STICK + 0.015), xE = 0.19 - U0, zE = this.zWall + 0.05;      // (out from under the rail to the right of the label, clear of it)
    J.show = T >= T_PEEP; J.roll = 0; J.yaw = 0;
    if (T < T_OUT) { J.foot.set(xE, yE, lerp(this.zIn, zE, ease.inOut(ramp(T, T_PEEP, T_OUT)))); J.lean = 0; J.spread = 0; }
    else if (T < T_ALIGHT) {
      // down off the wall and out, opening; one beat of its leaves to slow it; onto the marble
      const k = ramp(T, T_OUT, T_ALIGHT), e = ease.inOut(k) * 0.82 + 0.18 * k, s1 = 1 - e;
      J.foot.set(s1 * s1 * xE + 2 * s1 * e * (FOOT[0] + 0.2) + e * e * FOOT[0], s1 * s1 * yE + 2 * s1 * e * (TH + 0.25) + e * e * TH, s1 * s1 * zE + 2 * s1 * e * (FOOT[1] + 0.2) + e * e * FOOT[1]);
      J.lean = LEAN * (ease.smooth(k) + 0.9 * Math.sin(PI * k)); J.roll = 0.1 * Math.sin(TAU * k) * (1 - k);
      J.spread = keyed(SPREAD, T);
    } else {
      const x = T - T_ALIGHT, g = this.gust(T, calm);
      J.foot.set(FOOT[0], TH, FOOT[1]);
      J.lean = LEAN + 0.07 * Math.exp(-5 * x) * Math.cos(11 * x) + 0.012 * Math.sin(0.9 * T) + 0.04 * g;
      J.roll = 0.075 * g + (calm ? 0 : 0.01 * g * Math.sin(31 * T)); J.yaw = 0.025 * Math.sin(0.6 * T + 1) - 0.05 * g;
      J.spread = keyed(SPREAD, T);
    }
    if (Rt > 0) {
      // home: it shuts, lifts off the marble and up to the rail, and slides in under the frame
      const kc = ease.inOut(ramp(Rt, 0.3, 0.5)), kl = ease.inOut(ramp(Rt, 0.46, 0.82)), ki = ease.in(ramp(Rt, 0.8, 0.98));
      J.spread *= 1 - kc; J.lean *= 1 - kl; J.roll *= 1 - kl; J.yaw *= 1 - kl;
      J.foot.set(lerp(J.foot.x, xE, kl), lerp(J.foot.y, yE, kl) + 0.07 * Math.sin(PI * kl), lerp(lerp(J.foot.z, zE, kl), this.zIn, ki));
      if (Rt >= 0.98) J.show = false;
    }
    // (the frame the leaves are in: its origin where they are bound, BIND up the stick)
    t.e.set(-J.lean, J.yaw, J.roll, 'YXZ'); t.q.setFromEuler(t.e);
    J.m.compose(J.foot, t.q, t.s); J.m.multiply(t.m2.makeTranslation(0, BIND, 0.014));
    return J;
  },
  // The garden's air at clock T, 0..1: the gust that takes the leaf, and afterwards a breath every so often.
  gust(T, calm) {
    let g = ease.smooth(ramp(T, T_GUST, T_GUST + 0.5)) * (1 - 0.8 * ease.smooth(ramp(T, T_TEAR + 0.1, T_TEAR + 1.3))) * (1 - ease.smooth(ramp(T, T_LIE - 0.4, T_LIE + 0.6)));
    if (T > T_IDLE) g = Math.max(g, 0.55 * hump(((T - T_IDLE) % IDLE), 0, 2.2));
    return g * (calm ? 0.5 : 1);
  },
  // How far over a leaf is at clock T: 0 lying right, 1 lying left; and which way it is going (for its curl).
  turned(i, T) {
    const o = this.sheet; o.p = 0; o.dir = 0;
    if (i === 0) o.p = 1;
    else if (i === 1) { o.p = ease.inOut(ramp(T, T_TURN1[0], T_TURN1[1])); o.dir = 1; }
    else if (i === 2) {
      if (T < T_TURN2[0]) { o.p = 0.17 * hump(T, T_FALSE[0], T_FALSE[1]); o.dir = T < (T_FALSE[0] + T_FALSE[1]) / 2 ? 1 : -1; }
      else if (T < T_IDLE + 1) { o.p = ease.inOut(ramp(T, T_TURN2[0], T_TURN2[1])); o.dir = 1; }
      else { const c = (T - T_IDLE) % IDLE; if (c < 4.5) { o.p = 1 - ease.inOut(ramp(c, 1.1, 2.0)); o.dir = -1; } else { o.p = ease.inOut(ramp(c, 5.4, 6.3)); o.dir = 1; } }      // afterwards it leafs back, and forward again
    }
    return o;
  },
  // A bound leaf at clock T, into this.sheet: the angle it lies at, its curl, and how much more at its head.
  sheetPose(i, T, Rt, calm, back = 0) {
    const o = this.turned(i, T), p = o.p, dir = o.dir, g = this.gust(T, calm), J = this.J, f = calm ? 0.5 : 1;
    const gone = i < LEAF ? ease.smooth(ramp(T, T_TEAR, T_TEAR + 0.5)) * (1 - back) : 0;       // (the leaf that left: those above it settle down a little)
    const restR = TH_R + FAN * (NSHEET - 1 - i - gone), restL = TH_L - FAN * i;
    o.th = lerp(restR, restL, p); o.kap = lerp(K_REST, -K_REST, p) - K_TURN * Math.sin(PI * p) * dir; o.tw = 2.2 * hump(p, 0, 0.5) * dir;
    if (g > 0) {
      // in the air from the garden: the leaves on the right lift and shiver; those on the left are pressed down, their edges trembling
      const right = p < 0.5 ? 1 : -1, w = i === LEAF ? 0 : 1;
      o.th += right * w * g * (0.1 + 0.05 * Math.sin(f * 27 * T + i * 2.1)); o.kap += w * g * (right * -0.5 + 0.9 * Math.sin(f * 19 * T + i * 1.7)); o.tw += w * g * 0.8 * Math.sin(f * 13 * T + i);
    }
    if (i === LEAF && back < 1) {
      // the one that goes: it lifts, strains at the stick, and streams out downwind
      const s = ramp(T, T_GUST + 0.12, T_TEAR), e = s * s * (3 - 2 * s);
      o.th = lerp(o.th, 2.02, e * (0.86 + 0.14 * Math.sin(f * 24 * T)) * (1 - back)); o.kap += (-2.3 * Math.sin(PI * Math.min(1, s * 1.15)) + 1.3 * e * Math.sin(f * 21 * T + 1)) * (1 - back); o.tw += 2.4 * hump(s, 0, 0.7) * (1 - back);
    }
    // shut, all of them lie together along the stick's own way out; open, where they belong
    const sp = J.spread;
    o.th = PI / 2 + (i - 2) * 0.012 + (o.th - PI / 2 - (i - 2) * 0.012) * sp; o.kap *= Math.min(1, sp); o.tw *= Math.min(1, sp);
    return o;
  },
  // The loose leaf in the air at clock T (tau seconds after it let go), into this.free: its middle, how it lies, its curl.
  wayAt(tau, out) {
    // (when it is at each point of its way: slow at the top of each swing, quick through the bottom)
    const n = FLY.length; let i = 0; while (i < n - 2 && tau > FLY[i + 1]) i++;
    const m = k => (k <= 0 ? 1 / (FLY[1] - FLY[0]) : k >= n - 1 ? 0 : 2 / (FLY[k + 1] - FLY[k - 1])), h = FLY[i + 1] - FLY[i], x = clamp01((tau - FLY[i]) / h), x2 = x * x, x3 = x2 * x;
    const u = (2 * x3 - 3 * x2 + 1) * i + (x3 - 2 * x2 + x) * h * m(i) + (-2 * x3 + 3 * x2) * (i + 1) + (x3 - x2) * h * m(i + 1);
    return this.way.getPoint(clamp01(u / (n - 1)), out);
  },
  flight(L, T) {
    const F = this.free, t = this.tmp, calm = L.calm, end = FLY[FLY.length - 1], tau = Math.min(T - T_TEAR, end), h = 0.07;
    this.wayAt(tau, F.c);
    // it lies on the air: its face to the sum of its weight and its swing; its bound edge leading
    this.wayAt(Math.max(0, tau - h), t.a); this.wayAt(Math.min(end, tau + h), t.b);
    t.v.copy(t.a).add(t.b).addScaledVector(F.c, -2).multiplyScalar(1 / (h * h)); t.v.y = Math.max(-5, t.v.y);
    t.z.set(0, 9.8, 0).addScaledVector(t.v, calm ? 0.45 : 0.9).normalize();
    this.wayAt(Math.max(0, tau - 0.14), t.a); this.wayAt(Math.min(end, tau + 0.14), t.b); t.x.copy(t.a).sub(t.b); t.x.y *= 0.5;
    if (t.x.lengthSq() < 1e-8) t.x.copy(this.dX); t.x.normalize();
    t.y.crossVectors(t.z, t.x).normalize(); t.x.crossVectors(t.y, t.z);
    F.q.setFromRotationMatrix(t.m.makeBasis(t.x, t.y, t.z));
    if (!calm) F.q.multiply(t.q.setFromAxisAngle(t.a.set(0, 1, 0), TAU * ease.inOut(ramp(tau, 0.14, 0.78))));      // over, once, as it climbs
    F.q.multiply(t.q.setFromAxisAngle(t.a.set(1, 0, 0), 0.16 * Math.sin((calm ? 4 : 9) * tau) * (1 - ramp(tau, 2.2, 2.6))));
    const kIn = ease.smooth(ramp(tau, 0, 0.3)), kDown = ease.smooth(ramp(tau, FLY[6] + 0.02, FLY[7] + 0.02));
    t.q2.copy(this.q0).slerp(F.q, kIn); F.q.copy(t.q2).slerp(this.qLie, kDown);
    // its curl: what it had, then the air's; lying, it droops over the rim of the marble, and lifts in each breath
    const x = T - T_LIE, air = this.gust(T, calm), lift = Math.max(0.5 * Math.exp(-3 * Math.max(0, x)) * Math.cos(9 * x), air * (0.75 + 0.25 * Math.sin((calm ? 3 : 7) * T)));
    const fly = lerp(this.k0, 1.1 * Math.sin((calm ? 4 : 8) * tau + 1) + 0.5, kIn) * (1 - kDown);
    const lying = ease.smooth(ramp(tau, FLY[7], end + 0.25));
    F.s0 = 0.16 * lying; F.kap = fly + lying * (-4.4 + 3.4 * Math.max(0, lift));
    return F;
  },
  // The glass, tipping to let the leaf under (radians), at clock T.
  tip(T, calm) {
    let a = ease.smooth(ramp(T, T_TOUCH - 0.2, T_TOUCH - 0.02)) * (1 - ease.in(ramp(T, T_LIE - 0.05, T_CLINK))) * 0.24;
    const x = T - T_CLINK; if (x > 0 && x < 0.6) a += 0.035 * Math.exp(-9 * x) * Math.abs(Math.sin(21 * x));
    if (T > T_IDLE) { const c = (T - T_IDLE) % IDLE; a += 0.05 * hump(c, 0.7, 1.25) + (c > 1.25 ? 0.02 * Math.exp(-9 * (c - 1.25)) * Math.abs(Math.sin(21 * (c - 1.25))) : 0); }
    return calm ? a * 0.6 : a;
  },
  // A point on a bound leaf (s along it from the spine, v up it), as the shader bends it: into out (the table's own space).
  onLeaf(th, kap, s, v, out) {
    const ph = th + kap * s;
    if (Math.abs(kap) < 1e-3) out.set(s * Math.cos(th), v, s * Math.sin(th)); else out.set((Math.sin(ph) - Math.sin(th)) / kap, v, (Math.cos(th) - Math.cos(ph)) / kap);
    return out.applyMatrix4(this.J.m);
  },

  band(L) {
    const s = score(L), calm = L.calm, k = calm ? 0.55 : 1, soft = calm ? 0.03 : 0.003;
    const rustle = (t, vol = 0.012, d = 0.3) => { s.hit(t, { d, vol, bp: 3400, q: 0.7, attack: d * 0.35 }); s.hit(t + d * 0.55, { d: 0.09, vol: vol * 0.7, hp: 5200, attack: 0.01 }); };
    const knock = (t, vol, f = 190) => { s.hit(t, { d: 0.07, vol: vol * k, lp: 420, attack: soft }); s.note(t, f, 0.09, { vol: vol * 0.5 * k, type: 'sine', attack: soft }); };
    const clink = (t, vol) => { for (const [f, v, d] of [[2090, 1, 0.7], [3340, 0.5, 0.45], [5120, 0.25, 0.25]]) s.note(t, f, d, { vol: vol * v * k, type: 'sine', attack: calm ? 0.02 : 0.002 }); };
    s.hit(T_TABLE[0], { d: 0.85, vol: 0.011, lp: 260, attack: 0.25 });                                    // the table, sliding out
    knock(T_TABLE[1] + 0.02, 0.03); knock(T_TABLE[1] + 0.26, 0.02, 170); knock(T_TABLE[1] + 0.5, 0.01);  // rocking on its feet
    rustle(T_PEEP + 0.05, 0.008, 0.4);
    s.hit(T_OUT + 0.3, { d: 0.5, vol: 0.012, bp: 900, q: 0.6, attack: 0.2 }); s.hit(T_OUT + 0.55, { d: 0.22, vol: 0.014, bp: 1500, q: 0.6, attack: 0.05 });     // its leaves open; one beat
    knock(T_ALIGHT, 0.028, 620); s.note(T_ALIGHT, 1240, 0.05, { vol: 0.006 * k, type: 'triangle', attack: soft });                                            // wood on marble
    rustle(T_TURN1[0] + 0.1, 0.012, 0.5); s.hit(T_TURN1[1] - 0.04, { d: 0.06, vol: 0.01, lp: 1800, attack: 0.004 });
    rustle(T_FALSE[0] + 0.03, 0.006, 0.2);
    rustle(T_TURN2[0] + 0.1, 0.012, 0.5); s.hit(T_TURN2[1] - 0.04, { d: 0.06, vol: 0.01, lp: 1800, attack: 0.004 });
    s.hit(T_GUST - 0.1, { d: 2.4, vol: 0.016, bp: 520, q: 0.5, attack: 0.9 });                                                                                 // the garden's air
    s.hit(T_GUST + 0.2, { d: 1.6, vol: 0.006, hp: 3800, attack: 0.5 });                                                                                      // and its leaves
    for (let i = 0; i < 5; i++) rustle(T_GUST + 0.2 + i * 0.13, 0.007 + 0.002 * i, 0.12);
    s.hit(T_TEAR - 0.02, { d: 0.16, vol: 0.022 * k, hp: 3000, attack: calm ? 0.03 : 0.004 });                                                                // it is away
    for (const [t, v] of [[0.3, 0.007], [1.1, 0.009], [1.9, 0.007]]) s.hit(T_TEAR + t, { d: 0.5, vol: v, bp: 700, q: 0.7, attack: 0.22 });                 // its swings
    s.hit(T_TOUCH, { d: 0.26, vol: 0.011, bp: 2600, q: 0.6, attack: 0.03 });                                                                                 // sliding in over the marble
    clink(T_CLINK, 0.02); clink(T_CLINK + 0.15, 0.007);
    s.note(T_PETAL, 1568, 0.5, { vol: 0.006, type: 'sine', attack: 0.03 });                                                                                  // the petal, on the page
    // afterwards, every so often: a breath, the held leaf lifting, the glass ticking; a leaf back, and forward again
    s.loop(T_IDLE, IDLE, [{ t: 0, noise: true, d: 2.0, vol: 0.008, bp: 520, q: 0.5, attack: 0.8 }, { t: 0.5, noise: true, d: 0.3, vol: 0.006, bp: 3400, q: 0.7, attack: 0.1 },
      { t: 1.27, f: 2090, d: 0.4, vol: 0.006 * k, type: 'sine', attack: 0.004 }, { t: 1.2, noise: true, d: 0.45, vol: 0.009, bp: 3400, q: 0.7, attack: 0.15 }, { t: 5.5, noise: true, d: 0.45, vol: 0.009, bp: 3400, q: 0.7, attack: 0.15 }]);
    return s.done();
  },

  start(L) {
    this.sc = this.band(L); this.sc.from(0); this.T = 0;
    if (!this.told && !L.quiet) { this.told = true; L.k.say('A leaf of the paper gets loose.', 4); }
  },
  back() {},
  end() { this.hide(); },
  reset() { this.told = false; this.hide(); },

  update(L, dt) {
    const back = L.phase === 'return', calm = L.calm, t = this.tmp, U = this.U, M = U.uM.value, S = U.uS.value;
    if (!back) this.T = L.t;                                                // (going home, the clock stands still and it is all drawn back)
    const T = this.T, Rt = back ? L.ret : 0;
    this.mesh.visible = true; this.blobs.visible = true;

    // ---- the table, and the glass on it
    const kT = ease.out(ramp(T, T_TABLE[0], T_TABLE[1])) * (1 - ease.inOut(ramp(Rt, 0.5, 0.96)));
    const xr = (T - T_TABLE[1]) * (calm ? 0.6 : 1), rock = xr > 0 ? (calm ? 0.012 : 0.034) * Math.exp(-4.2 * xr) * Math.cos(13 * xr) : 0;
    const tz = lerp(this.tableIn, 0, kT);
    t.e.set(rock, 0, rock * 0.5, 'YXZ'); M[0].compose(t.a.set(0, 0, tz), t.q.setFromEuler(t.e), t.s);
    // (it tips up on the far edge of its foot, towards where the leaf comes from)
    const tip = Math.max(this.tip(T, calm) * (1 - ease.smooth(ramp(Rt, 0.2, 0.3))), 0.2 * hump(Rt, 0.0, 0.3));
    const under = T > T_TOUCH ? 0.005 * (1 - ease.smooth(ramp(Rt, 0.1, 0.3))) : 0;
    M[1].copy(M[0]).multiply(t.m.makeTranslation(BOCK[0] - this.dX.x * BR, TH + under, BOCK[1] - this.dX.z * BR)).multiply(t.m.makeRotationAxis(this.dY, -tip)).multiply(t.m.makeTranslation(this.dX.x * BR, 0, this.dX.z * BR));

    // ---- the journal: its stick, its bound leaves
    const J = this.jPose(L, T, Rt);
    if (J.show) M[2].copy(J.m); else M[2].makeScale(0, 0, 0);
    const torn = T >= T_TEAR, kHome = torn ? ease.inOut(ramp(Rt, 0.04, 0.36)) : 0;
    for (let i = 0; i < NSHEET; i++) { const o = this.sheetPose(i, T, Rt, calm, kHome); S[i].set(o.th, o.kap, o.tw, 0); }
    // ---- the leaf that gets away
    let leafY = -1, leafX = 0, leafZ = 0;
    if (!torn || kHome >= 1) M[3].copy(M[2]);
    else {
      const F = this.flight(L, T);
      if (kHome > 0) {
        // home: out from under the glass, up, and back into its place in the journal
        const o = this.sheetPose(LEAF, T, Rt, calm, 1);
        t.q2.setFromRotationMatrix(J.m).multiply(t.q.setFromAxisAngle(t.a.set(0, 1, 0), -o.th));
        t.c.set(PW / 2, PH / 2, 0).applyQuaternion(t.q2).add(t.a.setFromMatrixPosition(J.m));
        F.c.lerp(t.c, kHome); F.c.y += 0.1 * Math.sin(PI * kHome); F.q.slerp(t.q2, kHome); F.kap = lerp(F.kap, o.kap, kHome); F.s0 *= 1 - kHome;
      }
      M[3].compose(F.c, F.q, t.s).multiply(t.m.makeTranslation(-PW / 2, -PH / 2, 0)); S[LEAF].set(0, F.kap, 0, F.s0);
      leafY = F.c.y; leafX = F.c.x; leafZ = F.c.z;
    }

    // ---- the garden's dabs: out from under the frame on the right, across, round the journal, and down
    const dm = this.dabs; let any = false;
    for (const d of this.D) {
      const tau = T - d.t0;
      if (tau <= 0) { dm.setMatrixAt(d.i, t.m.makeScale(0, 0, 0)); continue; }
      any = true;
      if (d.page) this.onLeaf(S[4].x, S[4].y, 0.23, PH * 0.56, d.land);
      const q = ramp(tau, 0.8, 2.4), al = d.a0 + d.w * (calm ? 0.6 : 1) * Math.max(0, tau - 0.5), rr = 0.26 + 0.24 * q;
      t.a.copy(d.m).lerp(t.b.set(0.24, 0.74 + d.h * 0.5, 0.14), ease.out(tau / 0.85)); t.a.y -= 0.06 * Math.sin(PI * clamp01(tau / 0.85));
      t.b.set(0.03 - 0.3 * q + rr * Math.cos(al), 0.68 + d.h + 0.07 * Math.sin(tau * 2.3 + d.seed * 9), -0.03 + 0.2 * q + rr * 0.8 * Math.sin(al)); t.b.z = Math.max(t.b.z, this.zWall + 0.05);
      t.a.lerp(t.b, ease.smooth(ramp(tau, 0.5, 1.05)));
      // down: swinging a little from side to side, as a leaf comes down
      const kl = ramp(tau, d.fly - 1.25, d.fly), e = ease.inOut(kl), sway = (1 - e) * Math.min(1, kl * 4) * 0.07;
      t.a.x = lerp(t.a.x, d.land.x, e) + sway * Math.sin(tau * 5 + d.seed * 20); t.a.z = lerp(t.a.z, d.land.z, e) + sway * Math.cos(tau * 4.3 + d.seed * 11); t.a.y = lerp(t.a.y, d.land.y, Math.pow(kl, 1.5));
      // turning over and over in the air; flat where it lies (on the page, with the page)
      const sp = (calm ? 0.5 : 1) * tau; t.e.set(d.spin.x * sp, d.spin.y * sp + d.yaw, d.spin.z * sp, 'YXZ'); t.q.setFromEuler(t.e);
      if (d.page) { const ph = S[4].x + S[4].y * 0.23; t.q2.setFromRotationMatrix(J.m).multiply(this.qT.setFromAxisAngle(t.x.set(0, 1, 0), -ph)); t.a.addScaledVector(t.x.set(-Math.sin(ph), 0, Math.cos(ph)).transformDirection(J.m), 0.004 * e); }
      else { t.e.set(-PI / 2, d.yaw, 0, 'YXZ'); t.q2.setFromEuler(t.e); }
      t.q.slerp(t.q2, ease.smooth(ramp(kl, 0.55, 1)));
      let sc = Math.min(1, tau / 0.25);
      if (Rt > 0) {
        // home: up off wherever it lies, and in under the frame where it came out
        const k = ease.inOut(clamp01((Rt - 0.05 - 0.3 * d.seed) / 0.5));
        if (d.page) sc *= 1 - ramp(Rt, 0.3, 0.42);                                   // (the journal shuts on the petal)
        else { t.b.copy(t.a).lerp(d.m, 0.5); t.b.y = Math.max(t.a.y, 0.5) + 0.2; t.b.z = Math.max(t.b.z, 0.1); const s1 = 1 - k; t.a.set(s1 * s1 * t.a.x + 2 * s1 * k * t.b.x + k * k * d.m.x, s1 * s1 * t.a.y + 2 * s1 * k * t.b.y + k * k * d.m.y, s1 * s1 * t.a.z + 2 * s1 * k * t.b.z + k * k * d.m.z); t.e.set(d.spin.x * k, d.spin.y * k, 0, 'YXZ'); t.q.multiply(t.q2.setFromEuler(t.e)); sc *= 1 - ramp(k, 0.85, 1); }
      }
      dm.setMatrixAt(d.i, t.m.compose(t.a, t.q, t.v.set(d.len * sc, d.len * d.asp * sc, 1)));
    }
    dm.visible = any; dm.instanceMatrix.needsUpdate = true;

    // ---- the soft shadows: under the table; under the leaf while it is over the floor
    const o = L.floor(U0, OUT0 + tz, t.c), gone = 1 - ease.smooth(ramp(Rt, 0.5, 0.95));
    this.blobs.set(0, o.x, o.z, 0.38, 0.62 * kT * gone);
    if (leafY > 0) { const p = L.floor(U0 + leafX, OUT0 + leafZ, t.c), over = Math.hypot(leafX, leafZ) < TR * 0.9 ? 0 : 1; this.blobs.set(1, p.x, p.z, 0.2 + 0.25 * leafY, 0.42 * over * clamp01(1.25 - leafY) * ramp(T, T_TEAR, T_TEAR + 0.3) * (1 - ramp(Rt, 0, 0.3))); }
    else this.blobs.set(1, o.x, o.z, 0.1, 0);

    if (!back && this.sc) this.sc.play(L.t);
    L.voice().place();
  },
});
