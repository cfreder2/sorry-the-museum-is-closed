// Ridolfo Ghirlandaio, Portrait of a Gentleman (about 1505), Gallery 205. The word: beyond.
//
// A man in a black robe lined with fur and a black capuccio looks out of a dark room. The museum does not know who
// he is and neither do we; he is given no name and no story here. But high in the corner behind his shoulder the
// wall of his room is cut by a window, and in it, no bigger than a playing card, is a whole country: a deep sky
// going down to cream, far blue mountains, a pale hill with a dark one behind it, a wood, a thatched barn with its
// timbers showing, a round stack, a man carrying something on his shoulder, two cattle (one standing, one lying), a
// herdsman with a stick, a thin tree with its leaves in level clumps, and at the bottom, in the dark grass, two
// white birds, each some three millimetres of paint. Nobody sees them from the gallery floor. The museum's words
// for it are only "building", "hills", "landscape", "sky". That window is what only this picture has, and the word
// is what a window in a dark room is for: beyond.
//
// Look at the picture and a window opens low in the gallery wall beside it, down to the left under its label,
// rising from its sill as a shutter is lifted: the same upright shape as his, cut through sixteen centimetres of
// wall. It is a hole, not a picture: its sides close in as they go back (a splayed reveal, the plain grey stone of
// his own window), the sloping sill and the right jamb take the light that comes in from the upper left as it does
// in his picture, the left jamb and the head are in their own shade, the left jamb's shadow lies across the sill,
// and a faint patch of daylight lies on the gallery floor under it. At the back of that thickness is the daylight
// opening, 38 cm wide and 69 high, and beyond it his country, at a size a small car can look into. It lies in
// sheets one behind another (sky, mountains and hill, wood, the farm's ground, the near bank, the tree), so as you
// drive past, the reveal hides one side of it and shows the other, and the tree slides across the barn and the
// barn across the hills, as things do through a real window; from straight in front it is exactly as he composed
// it. It is quietly alive: the leaves stir, the standing ox grazes and lifts its head, the one lying down turns its
// head, the herdsman shifts his stick, and now and then the man with his load goes along the front of the stack
// and in under the shed. Then the one thing that happens: down in the grass the two white birds put up their
// necks, a breath goes through the tree, and they take wing, one a wingbeat ahead of the other: necks out, feet
// laid back, the long feathers of their wings parting as they beat (white on top, grey beneath), up across the
// window growing until they are the biggest things in it, their wingbeats heard, and out behind its left jamb. A
// moment later they are seen again, small, going away over the pale hill towards the mountains, where they are
// lost: the distance was there to be flown into. Much later they come home and settle where he painted them. Stop
// looking and it stays while the toy is near; drive off and the shutter comes down and the wall is a wall.
//
// How it is made: one flat rectangle on the wall and one on the floor, two draw calls. The country is painted
// once (when first looked at) into two canvases in his colours, read off the picture: the pieces that move on one,
// the land in four long strips on the other. The wall's rectangle has no depth of its own: its shader finds, for
// each point of it, whether the eye's line meets the stone of the reveal first (and which face, how deep, in light
// or shade) or goes through to the daylight, and there where it meets each sheet beyond, and lays them over one
// another, back to front. So the birds are never in front of the stone: they pass behind it. Nothing is built in
// the room: the window reaches 0 m out from the wall and the light on the floor 0.95 m, flat, neither with any
// collision; both lie between 0.16 m and 0.62 m to the left of the picture's middle, the window from 0.26 m to
// 1.06 m above the floor (clear of the skirting, under the label, 0.6 m short of the frame of Piero di Cosimo's
// tondo on the other side of the picture and 0.38 m from the room's corner; Botticelli's Virgin and Child and
// Allori's Francesco de' Medici hang past the doorway, more than six metres along the wall). Nothing is drawn on
// or in front of any picture. In a calm museum the birds do not fly: they look up now and then, and the leaves
// move half as much. The caption says only what can be seen.
//
// What it does not do: he does not move, turn, leave his picture or get a name, a trade or a reason for the
// window, and the birds are not said to be geese or doves, nor the dark they stand in to be water, because the
// museum says none of that and the paint is too small to settle it.

import * as THREE from 'three';
import { lifeFor, ease, ramp, clamp01, lerp, rng, canvasTexture } from '../paintlife.js';
import { noise } from './stagecraft.js';
import { LOWMEM } from '../budget.js';

const PI = Math.PI, TAU = PI * 2;

// ---------------------------------------------------------------- the painted sheet: where each thing is on it
// (of 2048 by 1024; x, y, width, height), and how big it stands in the country beyond the window (metres there)
const AW = 2048, AH = 1024;
const CELL = {
  tree: [0, 0, 560, 1024], farm: [564, 0, 920, 500], fly: [564, 504, 500, 250], wing: [1068, 504, 206, 330], wingu: [1280, 504, 206, 330],
  ox1: [1492, 0, 300, 200], ox1h: [1796, 0, 140, 140], ox2: [1492, 204, 280, 180], ox2h: [1796, 144, 140, 140],
  herd: [1596, 392, 128, 300], arm: [1728, 392, 128, 220], man1: [1860, 392, 90, 220], man2: [1952, 392, 90, 220],
  bird: [1728, 616, 150, 130], neck: [1882, 616, 70, 130],
};
// the second sheet (1024 square): four strips of land, each [first row, last row, top, bottom] (the last two in the
// measure of the picture's window), with a clear gutter above each
const LAND = { far: [0, 170, 780, 1100], wood: [170, 400, 950, 1310], ground: [400, 700, 1050, 1590], bank: [700, 1024, 1280, 1760] }, GUT = 12;

// <paint>
// Everything beyond the window that has an edge, painted once: g is a 2D canvas of 2048 K by 1024 K; col(hex) gives a
// colour as [r, g, b] (0..255), a little of the picture's own palette in it; R is a seeded random number.
// His manner here is a miniaturist's: smooth, close-toned forms with the light from the upper left, and over them
// small exact touches (a leaf, a straw, a horn), never a loaded brush.
function paintView(gA, K, col, R, CELL, gB, LAND, GUT) {
  let g = gA;
  const TAU = Math.PI * 2, PI_ = Math.PI;
  const jit = s => (R() - 0.5) * s, pick = l => l[Math.floor(R() * l.length) % l.length];
  const css = (c, a = 1) => `rgba(${Math.round(Math.max(0, Math.min(255, c[0])))},${Math.round(Math.max(0, Math.min(255, c[1])))},${Math.round(Math.max(0, Math.min(255, c[2])))},${a})`;
  const mix = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
  const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
  const cell = (name, fn) => { const [x, y, w, h] = CELL[name]; g.save(); g.setTransform(K, 0, 0, K, x * K, y * K); g.beginPath(); g.rect(0, 0, w, h); g.clip(); g.lineCap = 'round'; g.lineJoin = 'round'; fn(w, h); g.restore(); };
  // a smooth closed shape through points
  const shape = pts => {
    const n = pts.length, P = i => pts[(i + n) % n], m = i => [(P(i)[0] + P(i + 1)[0]) / 2, (P(i)[1] + P(i + 1)[1]) / 2];
    g.beginPath(); const m0 = m(-1); g.moveTo(m0[0], m0[1]);
    for (let i = 0; i < n; i++) { const q = m(i); g.quadraticCurveTo(P(i)[0], P(i)[1], q[0], q[1]); }
    g.closePath();
  };
  const poly = pts => { g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath(); };
  const fill = (pts, c, a = 1, smooth = true) => { (smooth ? shape : poly)(pts); g.globalAlpha = a; g.fillStyle = css(c); g.fill(); g.globalAlpha = 1; };
  const within = (pts, fn, smooth = true) => { g.save(); (smooth ? shape : poly)(pts); g.clip(); fn(); g.restore(); };
  const soft = (x, y, r, c, a, sx = 1, sy = 1) => { g.save(); g.translate(x, y); g.scale(sx, sy); const gr = g.createRadialGradient(0, 0, 0, 0, 0, r); gr.addColorStop(0, css(c, a)); gr.addColorStop(0.5, css(c, a * 0.55)); gr.addColorStop(1, css(c, 0)); g.fillStyle = gr; g.fillRect(-r, -r, 2 * r, 2 * r); g.restore(); };
  const lin = (x0, y0, x1, y1, stops) => { const gr = g.createLinearGradient(x0, y0, x1, y1); for (const [k, c, a = 1] of stops) gr.addColorStop(k, css(c, a)); return gr; };
  const stroke = (pts, w, c, a = 1) => { g.globalAlpha = a; g.strokeStyle = css(c); g.lineWidth = w; g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.stroke(); g.globalAlpha = 1; };
  const curve = (p0, c, p1, w, col_, a = 1) => { g.globalAlpha = a; g.strokeStyle = css(col_); g.lineWidth = w; g.beginPath(); g.moveTo(p0[0], p0[1]); g.quadraticCurveTo(c[0], c[1], p1[0], p1[1]); g.stroke(); g.globalAlpha = 1; };
  const oval = (x, y, rx, ry, rot, c, a = 1) => { g.globalAlpha = a; g.fillStyle = css(c); g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, TAU); g.fill(); g.globalAlpha = 1; };
  // a point on a smooth line through points, at s (0..1), and the way it heads
  const along = (pts, s) => {
    const n = pts.length - 1, f = Math.min(n - 1e-6, Math.max(0, s * n)), i = Math.floor(f), k = f - i;
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(n, i + 2)];
    const h = (a, b, c, d) => 0.5 * (2 * b + (c - a) * k + (2 * a - 5 * b + 4 * c - d) * k * k + (3 * b - a - 3 * c + d) * k * k * k);
    const dh = (a, b, c, d) => 0.5 * ((c - a) + 2 * (2 * a - 5 * b + 4 * c - d) * k + 3 * (3 * b - a - 3 * c + d) * k * k);
    return [h(p0[0], p1[0], p2[0], p3[0]), h(p0[1], p1[1], p2[1], p3[1]), dh(p0[0], p1[0], p2[0], p3[0]), dh(p0[1], p1[1], p2[1], p3[1])];
  };
  // a stem: a line that tapers, dark, with its light down the left side
  const stem = (pts, w0, w1, dark, light, steps = 60) => {
    for (const [c, off, wk, a] of [[dark, 0, 1, 1], [light, -0.3, 0.42, 0.75]]) {
      for (let i = 0; i < steps; i++) {
        const a0 = along(pts, i / steps), a1 = along(pts, (i + 1) / steps), w = lerp_(w0, w1, i / steps);
        stroke([[a0[0] + off * w, a0[1]], [a1[0] + off * w, a1[1]]], Math.max(0.6, w * wk), c, a);
      }
    }
  };
  const lerp_ = (a, b, k) => a + (b - a) * k;

  // ---- his colours (read off the picture; the palette is mixed into them a little)
  const C = h => col(h);
  const LEAF_D = C('#1a2010'), LEAF_M = C('#2e3a1a'), LEAF_L = C('#6f7234'), LEAF_G = C('#a39a48'), BARK = C('#2e2414'), BARK_L = C('#6e5e3a');
  const THATCH = C('#57472a'), THATCH_L = C('#7c6a3a'), THATCH_D = C('#3a301a'), DAUB = C('#4e3f26'), DAUB_L = C('#6e5a32'), DAUB_D = C('#2e2618'), TIMBER = C('#241a0e'), HOLE = C('#120c07');
  const STACK = C('#7d5d26'), STACK_L = C('#a07c38'), STACK_D = C('#3e3018');
  const OX = C('#533a24'), OX_L = C('#7a5a38'), OX_D = C('#2a1c14'), HORN = C('#b3a784'), HOOF = C('#1e150e');
  const WHITE = C('#e6e2d4'), WHITE_S = C('#8d978c'), BILL = C('#b89a5a');
  const SKIN = C('#b08660'), SKIN_D = C('#6a4630'), TUNIC = C('#5a4522'), TUNIC_L = C('#8a6a34'), TUNIC_D = C('#2e2210'), HOSE = C('#8f8468'), HOSE_D = C('#4e4634'), HAT = C('#221a12'), JERKIN = C('#4a4a2a'), JERKIN_L = C('#6e6c3c'), JERKIN_D = C('#24260f'), STRAW = C('#a8934e');
  const GRASS_D = C('#1e2414'), GRASS_M = C('#3a3a1e'), GRASS_L = C('#6a6a2c'), GRASS_G = C('#8f8238');
  const WOOD_D = C('#182014'), WOOD_M = C('#253220'), WOOD_L = C('#3d5230'), WOOD_G = C('#5f7040');
  const MT_L = C('#a6c4c0'), MT = C('#86b0ae'), FOOT = C('#3f716b'), FOOT_D = C('#2f4f42'), HILL_L = C('#93a384'), HILL = C('#7d8f70'), HILL_D = C('#586a48'), CAP = C('#2a3020'), CAP_L = C('#414b2e');
  const FIELD = C('#434d2e'), FIELD_L = C('#57633a'), YARD = C('#765f27'), YARD_L = C('#93782f'), YARD_S = C('#382f1d'), PATH = C('#8a8050'), POOL = C('#1b1d15'), GROVE_D = C('#1c2218');

  g.clearRect(0, 0, 2048 * K, 1024 * K);

  // ------------------------------------------------------------ the tall thin tree: two stems, bare a long way up, then
  // long twigs with their leaves in small level sprays, each leaf one touch: dark ones under, gold-green ones on top
  cell('tree', (w, h) => {
    const S1 = [[402, 1024], [398, 880], [403, 730], [398, 590], [389, 450], [376, 320], [361, 200], [348, 100], [340, 30]];
    const S2 = [[427, 1024], [424, 900], [429, 760], [435, 620], [434, 490], [441, 360], [452, 240], [462, 140], [468, 60]];
    // (where its clumps of leaves hang, read off the picture: across, down, half its width, half its height)
    const CL = [[790, 62, 128, 50], [700, 150, 92, 40], [845, 172, 66, 40], [660, 282, 92, 40], [802, 292, 80, 44], [588, 268, 30, 15], [560, 440, 92, 40], [722, 382, 80, 40], [832, 424, 58, 40], [762, 502, 60, 30], [640, 590, 50, 22], [722, 642, 40, 20], [852, 622, 48, 25], [792, 762, 40, 24], [884, 560, 28, 20]]
      .map(([x, y, a, b]) => [(x - 391) / 1.15, (y - 10) / 1.15, a / 1.15, b / 1.15]);
    const leaf = (x, y, a, len, wid, c, al) => { g.save(); g.translate(x, y); g.rotate(a); g.globalAlpha = al; g.fillStyle = css(c); g.beginPath(); g.moveTo(-len / 2, 0); g.quadraticCurveTo(0, -wid, len / 2, 0); g.quadraticCurveTo(0, wid, -len / 2, 0); g.fill(); g.restore(); g.globalAlpha = 1; };
    const leaves = [];
    CL.forEach(([cx, cy, a, b], i) => {
      // the bough that carries it leaves the stem lower down and comes up under it
      const S = i % 3 === 1 ? S2 : S1, top = S === S1 ? 994 : 964, sy = Math.min(1000, cy + 46 + a * 0.85), p0 = along(S, clamp_((1024 - sy) / top)), sg = cx < p0[0] ? -1 : 1;
      curve([p0[0], p0[1]], [lerp_(p0[0], cx, 0.45), cy + b * 0.5 + (p0[1] - cy) * 0.2], [cx + sg * a * 0.55, cy + b * 0.1], 2.2, mix(BARK, LEAF_D, 0.4), 0.95);
      for (let j = 0; j < 3; j++) { const x = cx + jit(a), y = cy + b * 0.3; curve([x, y], [x + sg * a * 0.2, y - b * 0.5], [x + sg * a * (0.3 + 0.3 * R()), y - b * (0.5 + 0.5 * R())], 1.1, mix(BARK, LEAF_D, 0.5), 0.9); }
      // a clump is several ragged sprays, each leaning its own way, their leaves slanting like the barbs of a feather
      const m = 3 + Math.round(a / 22);
      for (let q = 0; q < m; q++) {
        const sx = cx + jit(1.5) * a, sy2 = cy + jit(1.3) * b, ra = a * 0.5 * (0.6 + 0.7 * R()), rb = b * 0.42 * (0.6 + 0.7 * R()), tilt = jit(0.7), ct = Math.cos(tilt), st = Math.sin(tilt), n = Math.round(ra * rb / 7);
        for (let j = 0; j < n; j++) {
          const an = R() * TAU, rr = Math.pow(R(), 0.6), co = Math.cos(an), si = Math.sin(an), lx = co * rr * ra, ly = si * rr * rb;
          leaves.push({ x: sx + lx * ct - ly * st, y: sy2 + lx * st + ly * ct, a: tilt + (lx > 0 ? 0.55 : -0.55) + jit(0.5), len: 15 + R() * 12, wid: 3.2 + R() * 2.4, lit: clamp_(0.5 - (co * 0.45 + si * 0.8) * rr * 0.6 + jit(0.5)) });
        }
      }
    });
    for (const l of leaves) leaf(l.x, l.y + 1.5, l.a, l.len, l.wid, mix(LEAF_D, LEAF_M, 0.6 * R()), 0.97);
    for (const l of leaves) if (l.lit > 0.52) leaf(l.x - 1.6, l.y - 1.8, l.a + jit(0.2), l.len * 0.78, l.wid * 0.6, mix(LEAF_L, LEAF_G, clamp_((l.lit - 0.52) * 2.4 + jit(0.3))), 0.9);
    // the two stems over their own twigs
    stem(S2, 6.5, 1.6, mix(BARK, HOLE, 0.2), BARK_L);
    stem(S1, 8.5, 1.8, BARK, mix(BARK_L, LEAF_G, 0.25));
  });
  function clamp_(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }

  // ------------------------------------------------------------ the farm: the round stack, the open shed, and the barn
  // with its timbers and its great thatched roof (the ground line is at 480)
  cell('farm', (w, h) => {
    const base = 480;
    const straws = (pts, n, ang, len, cols, lw = 1.1, a = 0.7) => within(pts, () => { for (let i = 0; i < n; i++) { const x = R() * w, y = R() * h, an = (typeof ang === 'function' ? ang(x, y) : ang) + jit(0.22), l = len * (0.5 + R()); stroke([[x, y], [x + Math.cos(an) * l, y + Math.sin(an) * l]], lw * (0.7 + 0.6 * R()), pick(cols), a * (0.5 + 0.5 * R())); } }, false);
    // the stack: a beehive of straw, lit on its left
    {
      g.save(); g.translate(0, base); g.scale(1, 0.9); g.translate(0, -base);
      const S = [[36, base], [30, 380], [44, 290], [84, 215], [128, 168], [150, 150], [172, 168], [216, 215], [256, 290], [270, 380], [264, base]];
      shape(S); g.fillStyle = lin(30, 0, 270, 0, [[0, STACK_L], [0.3, STACK], [0.62, mix(STACK, STACK_D, 0.6)], [1, STACK_D]]); g.fill();
      within(S, () => {
        soft(96, 300, 150, STACK_L, 0.5, 0.7, 1.4); soft(240, 400, 130, HOLE, 0.45, 0.8, 1.5);
        for (let i = 0; i < 900; i++) { const x = 30 + R() * 240, y = 150 + R() * 330, k = (x - 30) / 240, an = PI_ / 2 + (x - 150) / 240 * 0.5 + jit(0.2), l = 7 + R() * 12; stroke([[x, y], [x + Math.cos(an) * l, y + Math.sin(an) * l]], 0.9 + 0.5 * R(), k < 0.45 ? pick([STACK_L, STACK, THATCH_L]) : pick([STACK, STACK_D, THATCH_D]), 0.45); }
        // (its thatch is laid in rings)
        for (let j = 0; j < 5; j++) { const y = 230 + j * 52; curve([20, y - 6], [150, y + 16], [280, y - 6], 1.6, STACK_D, 0.35); curve([20, y - 9], [150, y + 13], [280, y - 9], 1.1, STACK_L, 0.3); }
      });
      stroke([[150, 152], [151, 128]], 2.4, TIMBER); stroke([[150, 150], [150.6, 130]], 1, BARK_L, 0.6);
      g.restore();
    }
    // the barn's far side: the long roof going back to the right, and the wall under it in shade
    {
      const ROOF = [[545, 88], [650, 104], [838, 306], [712, 312]];
      poly(ROOF); g.fillStyle = lin(545, 90, 800, 320, [[0, mix(THATCH, THATCH_L, 0.5)], [0.5, THATCH], [1, mix(THATCH, THATCH_D, 0.55)]]); g.fill();
      straws(ROOF, 1500, (x, y) => 0.95, 16, [THATCH_L, THATCH, THATCH_D, mix(THATCH, GRASS_L, 0.3)], 1.1, 0.5);
      within(ROOF, () => { for (let j = 1; j < 6; j++) { const k = j / 6, x0 = lerp_(545, 712, k), y0 = lerp_(88, 312, k), x1 = lerp_(650, 838, k), y1 = lerp_(104, 306, k); stroke([[x0, y0], [x1, y1]], 1.5, THATCH_D, 0.35); stroke([[x0, y0 - 2.5], [x1, y1 - 2.5]], 1, THATCH_L, 0.3); } soft(820, 300, 120, HOLE, 0.3); }, false);
      const SIDE = [[704, 310], [832, 304], [830, 468], [704, base]];
      poly(SIDE); g.fillStyle = lin(704, 0, 832, 0, [[0, mix(DAUB_D, HOLE, 0.25)], [1, mix(DAUB_D, HOLE, 0.5)]]); g.fill();
      within(SIDE, () => { for (const x of [704, 746, 790, 830]) stroke([[x, 300], [x, base]], 3, mix(TIMBER, HOLE, 0.4), 0.9); stroke([[704, 392], [832, 384]], 2.5, mix(TIMBER, HOLE, 0.4), 0.9); for (let i = 0; i < 160; i++) oval(704 + R() * 128, 310 + R() * 170, 1 + R() * 2, 1 + R(), 0, pick([DAUB_D, DAUB, HOLE]), 0.25); fill([[704, 304], [836, 300], [836, 324], [704, 336]], HOLE, 0.45, false); }, false);
    }
    // its gable end, facing us, in the light: plaster the colour of the yard between dark timbers
    {
      const FRONT = [[400, base], [400, 302], [545, 92], [704, 308], [704, base]];
      poly(FRONT); g.fillStyle = lin(400, 0, 704, 0, [[0, DAUB_L], [0.55, DAUB], [1, mix(DAUB, DAUB_D, 0.5)]]); g.fill();
      within(FRONT, () => {
        soft(470, 330, 150, DAUB_L, 0.35); soft(690, 460, 120, DAUB_D, 0.45);
        for (let i = 0; i < 1400; i++) { const x = 400 + R() * 304, y = 92 + R() * 390; oval(x, y, 0.8 + R() * 2.2, 0.6 + R() * 1.2, jit(1), pick([DAUB_L, DAUB, DAUB_D, THATCH, mix(DAUB, TUNIC, 0.25)]), 0.22); }
        // the timbers: posts, rails, and the braces of the gable
        const T = (a, b, wd = 4.5) => { stroke([a, b], wd, TIMBER, 0.95); stroke([[a[0] - 1, a[1] - 1], [b[0] - 1, b[1] - 1]], 1, BARK_L, 0.28); };
        for (const x of [402, 470, 545, 618, 702]) T([x, base], [x, x === 545 ? 96 : 300]);
        T([400, 302], [704, 308], 5.5); T([400, 392], [704, 394]); T([470, 216], [628, 220], 4);
        T([470, 300], [545, 220], 3.5); T([618, 302], [545, 220], 3.5); T([402, 392], [470, 302], 3); T([702, 394], [640, 308], 3);
        // the door, the row of small lights beside it, the loft
        fill([[588, 372], [644, 372], [644, base], [588, base]], HOLE, 1, false); fill([[588, 372], [600, 372], [600, base], [588, base]], mix(HOLE, DAUB_D, 0.5), 0.8, false);
        for (const x of [480, 508, 554]) fill([[x, 350], [x + 20, 350], [x + 20, 378], [x, 378]], HOLE, 0.95, false);
        fill([[514, 150], [548, 150], [548, 212], [514, 212]], HOLE, 0.92, false); fill([[572, 232], [600, 232], [600, 290], [572, 290]], mix(HOLE, DAUB_D, 0.3), 0.85, false);
        fill([[414, 232], [450, 232], [450, 292], [414, 292]], mix(HOLE, DAUB_D, 0.35), 0.0, false);
      }, false);
      // the roof's near edge: the thatch seen end on, thick, down both slopes of the gable
      const EDGE_L = [[545, 76], [556, 92], [398, 322], [378, 316]], EDGE_R = [[545, 76], [652, 92], [660, 108], [560, 96]];
      poly(EDGE_L); g.fillStyle = lin(380, 320, 550, 80, [[0, THATCH], [1, THATCH_L]]); g.fill(); straws(EDGE_L, 260, 2.2, 9, [THATCH_L, THATCH, THATCH_D], 1, 0.6);
      const EDGE_F = [[545, 78], [556, 92], [718, 318], [700, 322]];
      poly(EDGE_F); g.fillStyle = css(mix(THATCH, THATCH_D, 0.45)); g.fill(); straws(EDGE_F, 260, 0.95, 9, [THATCH, THATCH_D, THATCH_L], 1, 0.55);
      stroke([[545, 78], [652, 94]], 3, THATCH_L, 0.8);
    }
    // the open shed against the barn, in front of the stack: a thatched pent roof on posts, dark under it
    {
      fill([[250, 318], [404, 318], [404, base], [250, base]], mix(HOLE, DAUB_D, 0.25), 0.97, false);
      within([[250, 318], [404, 318], [404, base], [250, base]], () => { soft(330, 470, 90, DAUB_D, 0.5, 1.4, 0.5); for (const x of [300, 350]) stroke([[x, 330], [x, base]], 2, HOLE, 0.5); }, false);
      const PENT = [[228, 316], [258, 256], [410, 262], [410, 326]];
      poly(PENT); g.fillStyle = lin(230, 320, 410, 260, [[0, THATCH_L], [1, THATCH]]); g.fill(); straws(PENT, 520, PI_ / 2 - 0.15, 12, [THATCH_L, THATCH, STACK_L, THATCH_D], 1, 0.55);
      stroke([[228, 317], [410, 327]], 4, THATCH_D, 0.9); stroke([[228, 314], [410, 324]], 1.2, THATCH_L, 0.6);
      for (const x of [254, 398]) { stroke([[x, 322], [x, base]], 5, TIMBER); stroke([[x - 1.5, 322], [x - 1.5, base]], 1.2, BARK_L, 0.35); }
    }
    // where it all meets the ground: a soft dark line, and a few weeds
    for (let i = 0; i < 90; i++) { const x = 30 + R() * 810; stroke([[x, base + 2], [x + jit(4), base - 3 - R() * 7]], 1, pick([GRASS_M, GRASS_D, GRASS_L]), 0.7); }
  });

  // ------------------------------------------------------------ a white bird on the wing, heading right: its body
  // (which turns about (250, 130)); and its wing, upright, which beats about its root at (110, 322), twice over: once
  // as it is seen from above, in the light, and once from beneath, in its own shade. White is never white: cream
  // where the light falls, a cool grey under the neck, the belly and the wing, and each long feather told by the
  // grey line of the one that lies on it.
  for (let i = 0; i < 9; i++) R();                           // (the land after this keeps the touches it had)
  let sb = 9157; const Rb = () => (sb = (sb * 16807) % 2147483647) / 2147483647, jb = s => (Rb() - 0.5) * s;
  const WHITE_H = [250, 247, 236], WHITE_D = mix(WHITE_S, HOLE, 0.4);
  const taper = (pts, w0, w1, c, a = 1) => { for (let i = 0; i < 24; i++) { const a0 = along(pts, i / 24), a1 = along(pts, (i + 1) / 24); stroke([[a0[0], a0[1]], [a1[0], a1[1]]], lerp_(w0, w1, i / 24), c, a); } };
  // one feather from its root to its blunt tip, wd its half width
  const blade = (x0, y0, x1, y1, wd, c, a = 1) => {
    const dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy) || 1, nx = -dy / l * wd, ny = dx / l * wd;
    g.globalAlpha = a; g.fillStyle = css(c); g.beginPath(); g.moveTo(x0, y0);
    g.bezierCurveTo(x0 + dx * 0.3 + nx, y0 + dy * 0.3 + ny, x0 + dx * 0.97 + nx, y0 + dy * 0.97 + ny, x1, y1);
    g.bezierCurveTo(x0 + dx * 0.97 - nx, y0 + dy * 0.97 - ny, x0 + dx * 0.3 - nx, y0 + dy * 0.3 - ny, x0, y0); g.fill(); g.globalAlpha = 1;
  };
  // a feather lying on the next: its own grey shade first, then the feather, then its shaft
  const quill = (x0, y0, x1, y1, wd, c, sh, shaft, sa = 0.7) => {
    blade(x0 + 2, y0 + 3.5, x1 + 2, y1 + 4.5, wd + 1.5, sh, sa); blade(x0, y0, x1, y1, wd, c);
    stroke([[x0, y0], [lerp_(x0, x1, 0.94), lerp_(y0, y1, 0.94)]], 0.9, shaft, 0.4);
  };
  const b2 = (p0, p1, p2, k) => [(1 - k) * (1 - k) * p0[0] + 2 * k * (1 - k) * p1[0] + k * k * p2[0], (1 - k) * (1 - k) * p0[1] + 2 * k * (1 - k) * p1[1] + k * k * p2[1]];
  const wingArt = under => (w, h) => {
    const top = () => mix(WHITE, WHITE_H, Rb()), low = () => mix(WHITE_S, WHITE, 0.2 + 0.2 * Rb());
    const fc = under ? low : top, sh = under ? mix(WHITE_D, HOLE, 0.25) : mix(WHITE_S, HOLE, 0.25), shaft = under ? WHITE_D : WHITE_S;
    // the ten long feathers of the hand, the outermost first: they part at their tips
    for (let i = 0; i < 8; i++) {
      const k = i / 7, tip = b2([100, 8], [34, 40], [24, 160], k), root = [lerp_(160, 152, k), lerp_(140, 200, k)];
      quill(root[0], root[1], tip[0] + jb(4), tip[1] + jb(4), 9.5 + 1.5 * k, fc(), sh, shaft, 0.9);
    }
    // the feathers of the arm, from the wrist in to the body, each lying on the last
    for (let i = 0; i < 12; i++) {
      const k = i / 11, root = [lerp_(154, 136, k), lerp_(186, 312, k)], tip = [lerp_(26, 62, k * k) + jb(3), lerp_(176, 326, k) + jb(3)];
      quill(root[0], root[1], tip[0], tip[1], 11.5, fc(), sh, shaft, 0.9);
    }
    // two rows of the small feathers that cover their roots
    for (const [len, wd, n, x0, x1] of [[52, 9.5, 14, 160, 142], [28, 7.5, 16, 164, 146]]) for (let i = 0; i < n; i++) {
      const k = i / (n - 1), rx0 = lerp_(x0, x1, k) + (k < 0.3 ? -6 * (0.3 - k) / 0.3 : 0), ry0 = lerp_(120, 316, k), a = lerp_(2.25, 2.95, k) + jb(0.08);
      quill(rx0, ry0, rx0 + Math.cos(a) * len, ry0 + Math.sin(a) * len * 0.75 + len * 0.3, wd, fc(), sh, shaft, 0.55);
    }
    // the arm itself, along the front of the wing: round, and (from above) the brightest thing on it
    const ARM = [[142, 324], [158, 262], [168, 196], [160, 138], [140, 84], [116, 40], [100, 12]];
    taper(ARM, 21, 5, under ? mix(WHITE_S, WHITE_D, 0.45) : WHITE);
    taper(ARM.map(([x, y]) => [x + 3.5, y - 1]), 8, 2, under ? mix(WHITE_S, WHITE, 0.25) : WHITE_H, 0.9);
    taper(ARM.map(([x, y]) => [x - 6, y + 2]), 5, 1.5, under ? WHITE_D : WHITE_S, under ? 0.5 : 0.4);
    for (let i = 0; i < 26; i++) { const p = along(ARM, 0.04 + 0.8 * Rb()); curve([p[0] - 2, p[1] + jb(4)], [p[0] - 9, p[1] + 5], [p[0] - 15 - 5 * Rb(), p[1] + 9 + jb(3)], 1, under ? WHITE_D : WHITE_S, 0.3); }
    // the light on it, over all: only where there is wing
    g.globalCompositeOperation = 'source-atop';
    if (under) {
      // (seen from beneath, the sky comes through the thin ends of the feathers, and the root is in the body's shade)
      g.fillStyle = lin(20, 0, 120, 0, [[0, WHITE_H, 0.34], [0.45, WHITE, 0.12], [1, WHITE, 0]]); g.fillRect(0, 0, w, h);
      soft(122, 330, 80, WHITE_D, 0.6, 1, 0.9); soft(150, 220, 46, WHITE_D, 0.3, 0.5, 2.2);
    } else {
      g.fillStyle = lin(170, 0, 30, 0, [[0, WHITE_S, 0], [0.5, WHITE_S, 0.1], [1, WHITE_S, 0.36]]); g.fillRect(0, 0, w, h);
      soft(108, 334, 62, WHITE_S, 0.7, 1.1, 0.8); soft(60, 60, 60, WHITE_S, 0.25);
    }
    g.globalCompositeOperation = 'source-over';
  };
  cell('wing', wingArt(false));
  cell('wingu', wingArt(true));
  cell('fly', (w, h) => {
    // the tail, a short fan in the body's shade; and the feet, laid back under it
    for (let i = 0; i < 7; i++) { const k = i / 6; quill(180, lerp_(124, 140, k), 92 + 14 * Math.abs(k - 0.4), lerp_(110, 150, k), 8, mix(WHITE, WHITE_S, 0.25 + 0.5 * k), mix(WHITE_S, HOLE, 0.2), WHITE_S, 0.6); }
    stroke([[226, 156], [176, 160], [146, 158]], 4.2, mix(BILL, HOLE, 0.45), 0.95); fill([[152, 154], [118, 153], [112, 160], [150, 163]], mix(BILL, HOLE, 0.38), 1, false);
    stroke([[150, 157], [118, 156]], 0.9, mix(BILL, HOLE, 0.7), 0.6);
    // the neck, held out straight: lit along its top, grey beneath
    const NK = [[318, 128], [352, 118], [388, 109], [424, 102]];
    taper(NK, 40, 19, mix(WHITE, WHITE_S, 0.3));
    taper(NK.map(([x, y]) => [x - 1, y - 5]), 20, 9, WHITE_H, 0.9);
    taper(NK.map(([x, y], i) => [x + 2, y + 9 - 2 * i]), 15, 7.5, WHITE_S, 0.9); taper(NK.map(([x, y], i) => [x + 2, y + 14.5 - 3 * i]), 5, 3, WHITE_D, 0.7);
    // the body: a full breast, the back in the light, the belly in a cool shade with the light of the grass thrown up into it
    const B = [[150, 128], [176, 111], [222, 102], [272, 100], [314, 105], [340, 118], [342, 136], [322, 152], [280, 162], [228, 162], [186, 152], [160, 141]];
    shape(B); g.fillStyle = lin(0, 100, 0, 163, [[0, WHITE_H], [0.2, WHITE], [0.4, mix(WHITE, WHITE_S, 0.7)], [0.6, WHITE_S], [0.88, mix(WHITE_S, WHITE_D, 0.75)], [1, mix(WHITE_D, GRASS_L, 0.3)]]); g.fill();
    within(B, () => {
      soft(250, 104, 60, [255, 253, 244], 0.6, 1.8, 0.3); soft(236, 168, 70, WHITE_D, 0.6, 1.9, 0.36); soft(338, 142, 26, WHITE_S, 0.4); soft(160, 134, 30, WHITE_S, 0.5);
      // the small feathers of the flank and breast, in rows
      for (let j = 0; j < 4; j++) for (let i = 0; i < 12; i++) { const x = 176 + i * 14 + (j % 2) * 7 + jb(3), y = 122 + j * 9 + jb(2); curve([x, y], [x + 7, y + 5.5], [x + 14, y], 1, j < 2 ? WHITE_S : WHITE_D, 0.24 + 0.05 * j); }
      // where the wing springs from the shoulder, and its shade on the flank
      soft(290, 120, 30, WHITE_S, 0.5, 1.3, 0.7); curve([252, 112], [286, 128], [316, 112], 1.6, WHITE_S, 0.5);
      curve([168, 147], [250, 170], [334, 146], 2.4, WHITE_D, 0.55);
    });
    // the head: small, round, a dark eye, the bill a little open as it calls
    oval(436, 98, 19, 13.5, -0.1, WHITE); oval(432, 93, 12, 6, -0.1, WHITE_H, 0.9); oval(439, 105.5, 15, 6.5, -0.1, WHITE_S, 0.85); curve([424, 109], [438, 113], [452, 106], 1.4, WHITE_D, 0.6);
    fill([[451, 89], [488, 98], [452, 100]], BILL, 1, false); fill([[452, 101], [482, 103], [451, 108]], mix(BILL, HOLE, 0.3), 1, false);
    stroke([[454, 90.5], [484, 97.5]], 1, mix(BILL, WHITE, 0.5), 0.7); stroke([[462, 95], [468, 96]], 1.2, mix(BILL, HOLE, 0.6), 0.8);
    oval(442, 94, 2.5, 2.5, 0, HOLE); oval(441.3, 93.2, 0.8, 0.8, 0, WHITE_H, 0.9);
  });

  // ------------------------------------------------------------ the two cattle. A beast is a smooth close-toned form:
  // the back in the light, the belly and the far legs in the dark, the bones of hip and shoulder only just told.
  const hide = (pts, x0, y0, x1, y1, fn) => { shape(pts); g.fillStyle = lin(x0, y0, x1, y1, [[0, OX_L], [0.38, OX], [1, OX_D]]); g.fill(); if (fn) within(pts, fn); };
  const leg = (pts, w0, w1, c) => { for (let i = 0; i < 24; i++) { const a0 = along(pts, i / 24), a1 = along(pts, (i + 1) / 24); stroke([[a0[0], a0[1]], [a1[0], a1[1]]], lerp_(w0, w1, i / 24), c); } const e = pts[pts.length - 1]; fill([[e[0] - w1 * 0.7, e[1] - 5], [e[0] + w1 * 0.8, e[1] - 5], [e[0] + w1 * 0.9, e[1] + 1], [e[0] - w1 * 0.7, e[1] + 1]], HOOF, 1, false); };
  cell('ox1', (w, h) => {              // standing, its head (another piece) to the right; feet at 192
    oval(150, 192, 110, 5, 0, HOLE, 0.25);
    leg([[84, 110], [80, 150], [88, 176], [86, 190]], 15, 7.5, mix(OX_D, HOLE, 0.25)); leg([[204, 112], [202, 152], [204, 178], [203, 190]], 13, 7, mix(OX_D, HOLE, 0.25));
    const B = [[44, 62], [70, 50], [120, 50], [176, 46], [214, 44], [240, 52], [250, 80], [244, 112], [226, 130], [180, 134], [128, 130], [86, 124], [56, 118], [38, 96]];
    hide(B, 100, 40, 150, 140, () => { soft(70, 66, 30, OX_L, 0.5); soft(214, 62, 34, OX_L, 0.45); soft(140, 60, 60, OX_L, 0.3, 1.6, 0.5); soft(150, 132, 70, HOLE, 0.5, 1.6, 0.4); soft(40, 100, 30, OX_D, 0.5); curve([196, 60], [188, 96], [200, 126], 2, OX_D, 0.3); curve([92, 62], [84, 92], [96, 120], 2, OX_D, 0.25); });
    leg([[62, 104], [50, 148], [60, 176], [57, 190]], 17, 8, OX); leg([[226, 112], [228, 154], [226, 178], [226, 190]], 14, 7.5, mix(OX, OX_L, 0.2));
    for (const [x0, y0, x1, y1] of [[58, 110, 50, 150], [224, 116, 225, 156]]) curve([x0 - 4, y0], [x1 - 6, (y0 + y1) / 2], [x1 - 4, y1], 2, OX_L, 0.4);
    curve([42, 66], [26, 96], [30, 142], 3.2, OX_D); oval(30, 148, 4, 9, 0.1, HOLE, 0.9);
  });
  cell('ox1h', (w, h) => {             // its neck and head, held level; the shoulder it turns about is at (24, 60)
    const N = [[6, 34], [40, 28], [78, 28], [96, 34], [98, 62], [74, 78], [40, 92], [8, 96]];
    hide(N, 40, 26, 50, 96, () => { soft(50, 36, 34, OX_L, 0.4, 1.5, 0.6); soft(44, 90, 34, HOLE, 0.45, 1.5, 0.5); });
    // the far horn and ear, behind the head
    curve([92, 28], [82, 12], [88, 2], 3.2, mix(HORN, OX_D, 0.35));
    const H = [[84, 30], [100, 24], [116, 34], [130, 54], [137, 68], [132, 78], [120, 78], [104, 70], [90, 64], [82, 48]];
    hide(H, 100, 24, 112, 80, () => { soft(104, 36, 16, OX_L, 0.5); soft(108, 72, 20, HOLE, 0.35); });
    oval(131, 70, 6, 7, 0.3, mix(OX_D, HOLE, 0.5), 0.9); oval(133, 67, 1.3, 1.6, 0, HOLE);
    oval(108, 44, 2.6, 2.1, 0.3, HOLE); oval(107.4, 43.4, 0.8, 0.8, 0, HORN, 0.8);
    fill([[90, 36], [78, 30], [70, 34], [80, 42]], OX_D); fill([[88, 37], [79, 33], [75, 35], [81, 40]], mix(OX, SKIN, 0.4), 0.8);
    curve([100, 26], [104, 8], [116, 0], 4, HORN); curve([100, 26], [103, 10], [113, 3], 1.4, WHITE, 0.7); stroke([[114, 2], [116, 0]], 2, OX_D, 0.6);
  });
  cell('ox2', (w, h) => {              // lying down, turned towards us; its head (another piece) at the right
    oval(140, 168, 120, 7, 0, HOLE, 0.3);
    const B = [[28, 150], [30, 112], [56, 84], [104, 68], [160, 66], [208, 78], [240, 104], [252, 140], [240, 164], [150, 168], [56, 166]];
    hide(B, 100, 60, 150, 172, () => { soft(84, 84, 46, OX_L, 0.5); soft(170, 78, 50, OX_L, 0.4); soft(140, 164, 110, HOLE, 0.5, 1.5, 0.35); soft(40, 140, 40, OX_D, 0.5); curve([120, 72], [108, 110], [124, 160], 2.2, OX_D, 0.28); });
    // the legs folded under it: one knee forward, a hind hoof showing
    fill([[176, 140], [226, 134], [246, 152], [236, 166], [186, 166]], mix(OX, OX_L, 0.3)); fill([[226, 150], [250, 150], [252, 164], [228, 166]], OX_D); fill([[244, 158], [258, 158], [258, 167], [244, 167]], HOOF, 1, false);
    fill([[60, 150], [96, 146], [104, 162], [66, 166]], OX_D, 0.9); fill([[52, 158], [66, 158], [66, 167], [52, 167]], HOOF, 1, false);
    curve([30, 116], [16, 140], [26, 160], 3, OX_D); oval(28, 162, 6, 3.5, 0, HOLE, 0.9);
  });
  cell('ox2h', (w, h) => {             // its head, facing us; the neck it turns about is at (70, 120)
    fill([[40, 132], [46, 92], [70, 80], [96, 92], [102, 132], [70, 140]], OX_D);
    const horn = s => { curve([70 + s * 22, 50], [70 + s * 50, 44], [70 + s * 56, 14], 5, HORN); curve([70 + s * 24, 48], [70 + s * 47, 42], [70 + s * 54, 18], 1.6, WHITE, 0.7); stroke([[70 + s * 56, 16], [70 + s * 56, 13]], 2.4, OX_D, 0.6); };
    horn(-1); horn(1);
    for (const s of [-1, 1]) { fill([[70 + s * 24, 60], [70 + s * 46, 58], [70 + s * 52, 66], [70 + s * 30, 72]], s < 0 ? OX : OX_D); fill([[70 + s * 28, 63], [70 + s * 44, 62], [70 + s * 47, 66], [70 + s * 31, 69]], mix(OX, SKIN, 0.4), 0.7); }
    const F = [[44, 54], [58, 44], [82, 44], [96, 54], [94, 78], [88, 100], [80, 112], [60, 112], [52, 100], [46, 78]];
    shape(F); g.fillStyle = lin(44, 0, 98, 0, [[0, OX_L], [0.45, OX], [1, OX_D]]); g.fill();
    within(F, () => { soft(60, 56, 22, OX_L, 0.5); soft(70, 112, 22, HOLE, 0.4); });
    oval(70, 104, 13, 8, 0, mix(OX_D, HOLE, 0.45), 0.95); oval(64, 104, 1.8, 2.4, 0, HOLE); oval(76, 104, 1.8, 2.4, 0, HOLE); oval(66, 99, 5, 2, 0, mix(OX, SKIN, 0.5), 0.5);
    for (const s of [-1, 1]) { oval(70 + s * 15, 70, 3, 2.4, 0, HOLE); oval(70 + s * 15 - 0.8, 69.2, 0.9, 0.9, 0, HORN, 0.8); }
  });

  // ------------------------------------------------------------ the herdsman, standing with his stick (feet at 292);
  // the arm that holds it is another piece. A face this size is its lit side and its shade, no more.
  const person = (o) => {
    const { x, foot, hgt, lean = 0, tunic, tunicL, tunicD, stride = 0 } = o, u = hgt / 280, X = d => x + d * u, Y = d => foot - d * u;
    oval(x, foot, 30 * u, 4 * u, 0, HOLE, 0.3);
    // the legs, in pale hose; shoes
    const legp = (hip, sway, c) => { leg([[X(hip), Y(120)], [X(hip + sway * 0.5), Y(66)], [X(hip + sway), Y(8)], [X(hip + sway), Y(2)]], 15 * u, 8 * u, c); fill([[X(hip + sway - 8), Y(7)], [X(hip + sway + 12 * (o.face || -1)), Y(6)], [X(hip + sway + 14 * (o.face || -1)), Y(0)], [X(hip + sway - 8), Y(0)]], HAT, 1, false); };
    legp(8, stride * -16, HOSE_D); legp(-8, stride * 16, HOSE);
    // the tunic, belted, to the middle of the thigh
    const T = [[X(-26 + lean), Y(218)], [X(0 + lean), Y(226)], [X(26 + lean), Y(218)], [X(30), Y(160)], [X(27), Y(128)], [X(32), Y(98)], [X(0), Y(92)], [X(-32), Y(98)], [X(-27), Y(128)], [X(-30), Y(160)]];
    shape(T); g.fillStyle = lin(X(-32), 0, X(32), 0, [[0, tunicL], [0.45, tunic], [1, tunicD]]); g.fill();
    within(T, () => { soft(X(-14), Y(196), 30 * u, tunicL, 0.4); for (const d of [-14, 2, 16]) curve([X(d), Y(126)], [X(d + 2), Y(110)], [X(d - 2), Y(96)], 1.6 * u, tunicD, 0.5); stroke([[X(-30), Y(130)], [X(30), Y(130)]], 4.5 * u, mix(tunicD, HOLE, 0.4), 0.9); });
    // the near arm, hanging
    if (!o.noArm) { leg([[X(-25 + lean), Y(212)], [X(-31), Y(172)], [X(-28), Y(134)], [X(-28), Y(130)]], 12 * u, 8.5 * u, mix(tunic, tunicL, 0.4)); oval(X(-28), Y(124), 6 * u, 7 * u, 0, SKIN); }
    // neck, head, hat
    fill([[X(-7 + lean), Y(232)], [X(7 + lean), Y(232)], [X(8 + lean), Y(218)], [X(-8 + lean), Y(218)]], SKIN_D, 1, false);
    const hx = X(lean * 1.4), hy = Y(250);
    oval(hx, hy, 15 * u, 18 * u, 0, SKIN); within([[hx - 16 * u, hy - 19 * u], [hx + 16 * u, hy - 19 * u], [hx + 16 * u, hy + 19 * u], [hx - 16 * u, hy + 19 * u]], () => { soft(hx + 9 * u, hy + 4 * u, 17 * u, SKIN_D, 0.75); soft(hx - 6 * u, hy - 2 * u, 9 * u, mix(SKIN, WHITE, 0.4), 0.5); oval(hx + (o.face || -1) * 4 * u, hy - 3 * u, 5 * u, 1.6 * u, 0, SKIN_D, 0.6); }, false);
    fill([[hx - 22 * u, hy - 9 * u], [hx - 12 * u, hy - 24 * u], [hx + 10 * u, hy - 26 * u], [hx + 22 * u, hy - 10 * u], [hx, hy - 13 * u]], o.hat || HAT);
    curve([hx - 21 * u, hy - 9 * u], [hx, hy - 15 * u], [hx + 21 * u, hy - 10 * u], 2.2 * u, mix(o.hat || HAT, SKIN, 0.3), 0.6);
  };
  cell('herd', (w, h) => person({ x: 66, foot: 292, hgt: 280, tunic: TUNIC, tunicL: TUNIC_L, tunicD: TUNIC_D, noArm: false, face: -1 }));
  cell('arm', (w, h) => {              // his other arm, out to the side, and the long stick it holds upright; the shoulder is at (64, 150)
    stroke([[26, 216], [34, 6]], 3.2, BARK); stroke([[25, 216], [33, 6]], 1, BARK_L, 0.6);
    leg([[64, 150], [48, 142], [34, 124], [32, 120]], 12, 8.5, TUNIC); curve([62, 146], [48, 138], [36, 122], 2, TUNIC_L, 0.6);
    oval(31, 116, 6.5, 7.5, 0, SKIN); oval(33, 118, 4, 5, 0, SKIN_D, 0.5);
  });
  // the man with a load on his shoulder, walking (two steps of his walk; feet at 214)
  for (const [name, stride] of [['man1', 1], ['man2', -0.25]]) cell(name, (w, h) => {
    person({ x: 46, foot: 214, hgt: 200, lean: 3, tunic: JERKIN, tunicL: JERKIN_L, tunicD: JERKIN_D, stride, noArm: true, face: 1, hat: mix(HAT, TUNIC, 0.4) });
    const u = 200 / 280, X = d => 46 + d * u, Y = d => 214 - d * u;
    // the load: a long bundle of straw across the shoulder, a hand up to steady it
    g.save(); g.translate(X(-4), Y(240)); g.rotate(-0.3);
    shape([[-52, -4], [-30, -13], [20, -14], [50, -7], [54, 4], [24, 12], [-28, 13], [-54, 6]].map(([a, b]) => [a * u * 1.15, b * u * 1.15])); g.fillStyle = lin(0, -12, 0, 12, [[0, STRAW], [1, mix(STRAW, STACK_D, 0.6)]]); g.fill();
    for (let i = 0; i < 46; i++) { const y = jit(18) * u, x = jit(90) * u; stroke([[x, y], [x + (10 + R() * 14) * u, y + jit(2)]], 0.8, pick([STRAW, STACK_L, STACK_D, THATCH]), 0.6); }
    for (const x of [-20, 22]) stroke([[x * u, -13 * u], [x * u, 13 * u]], 1.6, THATCH_D, 0.8);
    g.restore();
    leg([[X(20), Y(212)], [X(30), Y(232)], [X(18), Y(250)], [X(16), Y(252)]], 11 * u, 8 * u, JERKIN); oval(X(15), Y(254), 5.5 * u, 6 * u, 0, SKIN);
  });

  // ------------------------------------------------------------ a white bird of the yard (body; and its neck and head,
  // another piece, which turns about (22, 112)). White is never white here: a cool grey underneath, cream above.
  cell('bird', (w, h) => {
    oval(72, 122, 44, 4, 0, HOLE, 0.3);
    for (const [x, c] of [[80, mix(BILL, HOLE, 0.45)], [64, mix(BILL, HOLE, 0.2)]]) { stroke([[x, 86], [x - 1, 116]], 3.2, c); fill([[x - 6, 121], [x - 1, 113], [x + 12, 121]], c, 1, false); }
    const B = [[8, 38], [22, 44], [44, 36], [78, 34], [108, 42], [124, 58], [120, 78], [98, 92], [64, 94], [36, 84], [20, 64]];
    shape(B); g.fillStyle = lin(0, 34, 0, 96, [[0, WHITE], [0.5, mix(WHITE, WHITE_S, 0.35)], [1, WHITE_S]]); g.fill();
    within(B, () => { soft(70, 44, 44, [255, 253, 244], 0.6, 1.4, 0.5); soft(80, 96, 50, mix(WHITE_S, HOLE, 0.3), 0.5, 1.4, 0.4); });
    curve([30, 56], [64, 76], [104, 58], 1.6, WHITE_S, 0.8); curve([34, 52], [62, 66], [96, 52], 1.1, WHITE_S, 0.5); curve([10, 40], [20, 50], [36, 52], 1.4, WHITE_S, 0.7);
  });
  cell('neck', (w, h) => {
    const N = [[14, 118], [12, 96], [20, 70], [30, 48], [34, 30], [46, 28], [44, 52], [36, 76], [34, 100], [36, 118]];
    shape(N); g.fillStyle = lin(10, 0, 46, 0, [[0, WHITE], [1, WHITE_S]]); g.fill();
    oval(41, 24, 10.5, 8.5, -0.2, WHITE); oval(43, 27, 8, 5, -0.2, mix(WHITE, WHITE_S, 0.6), 0.6);
    fill([[49, 20], [66, 25], [50, 30]], BILL, 1, false); stroke([[51, 25.4], [64, 25.4]], 0.8, mix(BILL, HOLE, 0.5), 0.8);
    oval(44, 21.5, 1.7, 1.7, 0, HOLE);
  });

  // ============================================================ the land, in four long strips (the second sheet), each
  // painted in the picture's own measure (a point of its window: 960 across, 1760 down) and meeting its own mirror
  // image at either end, so that there is always more of it past the window's edge
  g = gB; g.clearRect(0, 0, 1024 * K, 1024 * K);
  const WX0 = -140, WXN = 1198, XS = 1024 / WXN;
  const strip = (name, fn) => { const [r0, r1, y0, y1] = LAND[name], ys = (r1 - r0 - GUT) / (y1 - y0); g.save(); g.setTransform(K * XS, 0, 0, K * ys, -WX0 * XS * K, (r0 + GUT - y0 * ys) * K); g.beginPath(); g.rect(WX0 - 4, y0, WXN + 8, y1 - y0); g.clip(); g.lineCap = 'round'; g.lineJoin = 'round'; fn(y0, y1); g.restore(); };
  const pl = pts => { const f = x => { let i = 0; while (i < pts.length - 2 && x > pts[i + 1][0]) i++; const a = pts[i], b = pts[i + 1]; return a[1] + (b[1] - a[1]) * clamp_((x - a[0]) / (b[0] - a[0])); }; return x => (f(x - 14) + 2 * f(x) + f(x + 14)) / 4; };
  const prof = (f, yb) => { const p = [[WX0 - 4, yb]]; for (let x = WX0 - 4; x <= WX0 + WXN + 4; x += 6) p.push([x, f(x)]); p.push([WX0 + WXN + 4, yb]); return p; };
  const rx = () => WX0 + R() * WXN;
  // a round head of leaves, lit from the upper left in small touches
  const head = (x, y, r, dk, md, lt, gd, n = 14 + r) => { oval(x, y, r, r * 0.8, 0, mix(dk, md, 0.25 + 0.5 * R())); for (let j = 0; j < n; j++) { const a = R() * TAU, rr = Math.sqrt(R()) * r * 0.95, lit = clamp_(0.5 - (Math.cos(a) * 0.5 + Math.sin(a) * 0.8) * rr / r); oval(x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.8, 1.6 + R() * 2.4, 1.1 + R() * 1.3, jit(1), lit > 0.64 ? mix(lt, gd, R() * (lit - 0.5) * 1.8) : mix(dk, md, R()), 0.6); } };

  // ---- the far country: the blue mountains, their foothills, and the pale hill with the dark wood on its top
  strip('far', (y0, y1) => {
    const mt = x => 948 - 24 * Math.exp(-(((x - 690) / 40) ** 2)) - 20 * Math.exp(-(((x - 470) / 85) ** 2)) - 9 * Math.exp(-(((x - 840) / 70) ** 2)) - 14 * Math.exp(-(((x + 30) / 120) ** 2)) + 4 * Math.sin(x / 41) + 2.5 * Math.sin(x / 17 + 1);
    const M = prof(mt, y1); poly(M); g.fillStyle = lin(0, 922, 0, 1010, [[0, MT_L], [0.3, MT], [0.62, FOOT], [1, FOOT_D]]); g.fill();
    within(M, () => { for (let i = 0; i < 220; i++) { const x = rx(), y = mt(x) + 1 + R() * 26; oval(x - 2, y, 5 + R() * 12, 1.4 + R() * 2.6, 0.25 + jit(0.3), R() < 0.6 ? mix(MT_L, [236, 240, 228], R() * 0.5) : mix(MT, FOOT, R()), 0.22); } }, false);
    const ft = x => 974 + 7 * Math.sin(x / 63 + 2) + 4 * Math.sin(x / 23) - 10 * Math.exp(-(((x - 760) / 90) ** 2));
    const F = prof(ft, y1); poly(F); g.fillStyle = lin(0, 966, 0, 1050, [[0, mix(FOOT, MT, 0.15)], [0.4, FOOT], [1, FOOT_D]]); g.fill();
    within(F, () => { for (let i = 0; i < 500; i++) { const x = rx(), y = ft(x) + R() * 110; oval(x, y, 3 + R() * 6, 1.5 + R() * 2.5, jit(0.5), R() < 0.4 ? mix(FOOT, MT, 0.3 * R()) : mix(FOOT, FOOT_D, R()), 0.3); } }, false);
    const hl = pl([[-160, 872], [-60, 862], [0, 853], [50, 846], [100, 829], [150, 818], [200, 828], [250, 858], [290, 893], [330, 905], [370, 916], [420, 941], [480, 985], [560, 1040], [640, 1078], [700, 1099], [760, 1112], [1080, 1112]]);
    const H = prof(hl, y1); poly(H); g.fillStyle = lin(0, 840, 0, 1080, [[0, HILL_L], [0.45, HILL], [1, HILL_D]]); g.fill();
    within(H, () => {
      soft(60, 900, 120, HILL_L, 0.5, 1.6, 0.5); soft(330, 1010, 160, HILL_D, 0.45, 1.4, 0.6);
      for (let i = 0; i < 700; i++) { const x = rx(), y = hl(x) + R() * 220; oval(x, y, 4 + R() * 12, 1.2 + R() * 2, jit(0.25) + 0.12, R() < 0.5 ? mix(HILL_L, [200, 206, 170], R() * 0.35) : mix(HILL, HILL_D, R()), 0.2); }
    }, false);
    const capLow = pl([[10, 852], [100, 848], [150, 850], [220, 868], [310, 897]]);
    const capP = []; for (let x = 34; x <= 294; x += 6) capP.push([x, hl(x) - 1]); for (let x = 294; x >= 34; x -= 6) capP.push([x, Math.max(hl(x), capLow(x))]);
    poly(capP); g.fillStyle = css(CAP); g.fill();
    for (let i = 0; i < 46; i++) { const x = 40 + R() * 250, y = lerp_(hl(x) + 2, Math.max(hl(x) + 2, capLow(x)), R()); head(x, y, 5 + R() * 6, CAP, mix(CAP, CAP_L, 0.4), CAP_L, mix(CAP_L, HILL_L, 0.5), 9); }
    // the one pale tree on its shoulder
    const T0 = mix(FOOT, HILL, 0.5), T1 = mix(HILL, MT, 0.5), T2 = mix(MT_L, HILL_L, 0.5);
    head(346, 900, 14, T0, T1, T2, MT_L, 24); head(394, 901, 15, T0, T1, T2, MT_L, 24); head(370, 893, 26, T0, T1, T2, MT_L, 60);
  });

  // ---- the wood behind the farm, and the grove at its right: round heads, one behind another
  strip('wood', (y0, y1) => {
    const wd = x => 998 + 6 * Math.sin(x / 53) + 4 * Math.sin(x / 19 + 2) - 14 * Math.exp(-(((x - 640) / 60) ** 2)) - 8 * Math.exp(-(((x - 860) / 70) ** 2));
    poly(prof(x => wd(x) + 8, y1)); g.fillStyle = lin(0, 990, 0, 1310, [[0, WOOD_M], [0.2, WOOD_D], [1, GROVE_D]]); g.fill();
    const hs = []; for (let i = 0; i < 230; i++) { const x = rx(), d = R(); hs.push([x, wd(x) + 10 + d * d * (x > 520 ? 300 : 80), 11 + R() * 15]); }
    hs.sort((a, b) => a[1] - b[1]);
    for (const [x, y, r] of hs) head(x, y, r, WOOD_D, WOOD_M, WOOD_L, WOOD_G, 12 + r * 0.8);
    g.fillStyle = lin(0, 1120, 0, 1310, [[0, GROVE_D, 0], [1, GROVE_D, 0.55]]); g.fillRect(WX0 - 4, 1120, WXN + 8, 190);
    // the pale track that goes up into the trees
    for (let i = 0; i < 20; i++) { const k = i / 19; oval(lerp_(796, 752, k) + 10 * Math.sin(k * 5), lerp_(1312, 1244, k), lerp_(11, 3, k), lerp_(5, 2, k), -0.3, mix(PATH, GROVE_D, 0.15 + 0.3 * k), 0.8); }
  });

  // ---- the ground the farm stands on: the field behind, the bare yard in the light, the grass where the cattle are
  strip('ground', (y0, y1) => {
    const gr = pl([[-160, 1064], [300, 1062], [340, 1080], [400, 1150], [470, 1290], [560, 1332], [700, 1338], [1080, 1342]]);
    const G = prof(gr, y1); g.filter = `blur(${3 * K}px)`; poly(prof(x => gr(x) + 5, y1)); g.fillStyle = css(FIELD); g.fill(); g.filter = 'none'; poly(prof(x => gr(x) + 5, y1)); g.fillStyle = lin(0, 1060, 0, 1590, [[0, FIELD_L], [0.2, FIELD], [0.55, mix(FIELD, YARD_S, 0.5)], [0.75, mix(GRASS_M, YARD_S, 0.4)], [1, GRASS_D]]); g.fill();
    within(G, () => {
      for (let i = 0; i < 700; i++) { const x = WX0 + R() * 560, y = 1064 + R() * 250; oval(x, y, 5 + R() * 12, 1.2 + R() * 1.8, jit(0.2), R() < 0.5 ? mix(FIELD_L, GRASS_G, R() * 0.4) : mix(FIELD, GRASS_M, R()), 0.22); }
      // the dark hedge at the left, and the lit slope under it
      for (let i = 0; i < 40; i++) { const x = -150 + R() * 230, y = 1196 + R() * 90; head(x, y, 12 + R() * 14, WOOD_D, WOOD_M, WOOD_L, WOOD_G); }
      soft(-10, 1350, 110, mix(GRASS_L, FIELD_L, 0.4), 0.8, 1.3, 0.55); soft(10, 1340, 70, GRASS_G, 0.3, 1.5, 0.6);
      // the yard: bare earth, gold where the light falls across it
      g.filter = `blur(${7 * K}px)`; fill([[40, 1418], [130, 1384], [400, 1376], [690, 1380], [820, 1392], [830, 1424], [700, 1462], [420, 1476], [150, 1466]], YARD); g.filter = 'none';
      soft(330, 1412, 40, YARD_L, 0.9, 6, 0.55); soft(620, 1414, 34, YARD_L, 0.6, 4.5, 0.5); soft(760, 1400, 60, YARD_S, 0.6, 1.2, 0.6);
      for (let i = 0; i < 520; i++) { const x = 60 + R() * 770, y = 1378 + R() * 78; oval(x, y, 3 + R() * 9, 0.9 + R() * 1.4, jit(0.15), pick([YARD, YARD_L, YARD_L, YARD_S, mix(YARD, GRASS_L, 0.5)]), 0.3); }
      // the grass below it, where the cattle are
      soft(400, 1486, 60, mix(GRASS_L, YARD, 0.5), 0.7, 6, 0.7); soft(230, 1470, 50, GRASS_G, 0.3, 4, 0.6);
      for (let i = 0; i < 1100; i++) { const x = rx(), y = 1442 + R() * 150, l = 4 + R() * 7; stroke([[x, y + 2], [x + jit(4), y - l]], 0.9 + 0.5 * R(), pick([GRASS_M, GRASS_D, mix(GRASS_M, GRASS_L, 0.5), GRASS_L]), 0.5); }
      // the track coming down out of the trees, and the dark under them
      for (let i = 0; i < 14; i++) { const k = i / 13; oval(lerp_(798, 770, k) + 6 * Math.sin(k * 4), lerp_(1336, 1392, k), lerp_(12, 22, k), lerp_(5, 7, k), 0, mix(PATH, YARD, 0.3 + 0.4 * k), 0.75); }
      soft(960, 1420, 150, GROVE_D, 0.8, 1, 0.8); soft(-150, 1500, 120, GRASS_D, 0.5);
    }, false);
  });

  // ---- the near bank under the window: the lit rise at the left with its small flowers, the dark hollow and its
  // reeds, and the tall dark bush at the tree's foot
  strip('bank', (y0, y1) => {
    const bk = pl([[-160, 1418], [0, 1446], [150, 1486], [300, 1520], [380, 1535], [560, 1546], [700, 1542], [1080, 1540]]);
    const B = prof(bk, y1); poly(B); g.fillStyle = lin(0, 1440, 0, 1760, [[0, GRASS_M], [0.35, mix(GRASS_M, GRASS_D, 0.6)], [1, GRASS_D]]); g.fill();
    within(B, () => {
      soft(130, 1560, 70, GRASS_L, 0.75, 3.2, 0.8); soft(90, 1540, 40, GRASS_G, 0.4, 3, 0.6);
      const Pl = [[388, 1574], [460, 1556], [600, 1554], [720, 1562], [762, 1592], [706, 1630], [560, 1644], [440, 1632], [384, 1604]];
      g.filter = `blur(${9 * K}px)`; fill(Pl, POOL, 0.9); g.filter = 'none'; within(Pl, () => { for (let i = 0; i < 26; i++) { const x = 400 + R() * 350, y = 1560 + R() * 80; stroke([[x, y], [x + 16 + R() * 40, y + jit(1.5)]], 1 + R(), pick([[58, 78, 72], [44, 56, 46], GRASS_M]), 0.3); } soft(560, 1556, 100, HOLE, 0.5, 2, 0.14); });
    }, false);
    // the grass, blade by blade: gold on the lit rise
    for (let i = 0; i < 2400; i++) { const x = rx(), y = bk(x) - 2 + R() * R() * 230, l = 6 + R() * 12, lit = Math.exp(-(((x - 110) / 190) ** 2)) * Math.exp(-(((y - 1545) / 70) ** 2)); if (x > 380 && x < 770 && y > 1556 && y < 1640 && R() < 0.93) continue; stroke([[x, y + 2], [x + jit(5), y - l]], 1 + 0.6 * R(), lit > 0.25 && R() < 0.75 ? mix(GRASS_L, GRASS_G, R() * lit * 1.3) : pick([GRASS_M, GRASS_D, GRASS_M, mix(GRASS_M, GRASS_L, 0.4)]), 0.75); }
    for (let i = 0; i < 38; i++) { const x = 612 + R() * 96, y = 1562 + jit(8), tp = 26 + R() * 44; curve([x, y], [x + jit(4), y - tp * 0.6], [x + jit(16), y - tp], 1.1 + 0.5 * R(), pick([GRASS_L, GRASS_G, GRASS_M, LEAF_L]), 0.85); }
    for (let i = 0; i < 46; i++) { const x = -20 + R() * 330, y = 1560 + R() * 150; stroke([[x, y + 12], [x + jit(4), y]], 1, GRASS_L, 0.8); oval(x + jit(2), y - 1, 2, 2, 0, mix(WHITE, GRASS_G, 0.45), 0.8); if (R() < 0.5) oval(x + 5 + jit(2), y + 3, 1.6, 1.6, 0, mix(WHITE, GRASS_G, 0.55), 0.7); }
    // the bush, leaf by leaf, its upper left side lit
    g.filter = `blur(${8 * K}px)`; fill([[752, 1580], [760, 1440], [790, 1340], [846, 1300], [900, 1306], [962, 1332], [1070, 1338], [1070, 1764], [752, 1764]], mix(LEAF_D, HOLE, 0.3)); g.filter = 'none';
    const bush = (cx, cy, r, n) => { for (let i = 0; i < n; i++) { const a = R() * TAU, rr = Math.sqrt(R()) * r, x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr * 0.9, lit = clamp_(0.45 - (Math.cos(a) * 0.5 + Math.sin(a) * 0.8) * rr / r); oval(x, y, 3.4 + R() * 3.4, 1.8 + R() * 1.6, jit(1.6), lit > 0.62 ? mix(LEAF_M, LEAF_L, (lit - 0.5) * 1.5 * R()) : mix(LEAF_D, LEAF_M, R() * 0.7), 0.9); } };
    for (const [cx, cy, r, n] of [[1010, 1420, 90, 380], [930, 1380, 70, 340], [820, 1350, 66, 400], [900, 1500, 80, 380], [800, 1460, 70, 460], [960, 1620, 100, 380], [850, 1570, 80, 480], [790, 1660, 70, 380]]) bush(cx, cy, r, n);
    // a pale bent stem in front of it
    curve([737, 1482], [752, 1690], [806, 1688], 2.6, mix(PATH, LEAF_L, 0.4), 0.55); curve([806, 1688], [856, 1680], [880, 1562], 2.2, mix(PATH, LEAF_L, 0.4), 0.45);
    g.fillStyle = lin(0, 1650, 0, 1760, [[0, HOLE, 0], [1, HOLE, 0.6]]); g.fillRect(WX0 - 4, 1650, WXN + 8, 110);
  });

  // ------------------------------------------------------------ the tooth of old paint, over all of it
  for (const [c, w, h, n] of [[gA, 2048, 1024, 30000], [gB, 1024, 1024, 18000]]) {
    c.save(); c.setTransform(K, 0, 0, K, 0, 0); c.globalCompositeOperation = 'source-atop';
    if (c === gA) { g = c; const [fx, fy, fw, fh] = CELL.farm; for (let i = 0; i < 900; i++) { const d = R(); soft(fx + R() * fw, fy + R() * fh, 4 + R() * 10, d < 0.55 ? [38, 24, 10] : [206, 164, 92], 0.14 + 0.12 * R(), 1 + R(), 0.7 + 0.5 * R()); } }
    g = c; for (let i = 0; i < n / 16; i++) { const d = R(); soft(R() * w, R() * h, 7 + R() * R() * 34, d < 0.5 ? [16, 12, 6] : d < 0.8 ? [214, 186, 110] : [120, 150, 120], 0.1 + 0.08 * R(), 1 + R(), 0.6 + 0.6 * R()); }
    for (let i = 0; i < n; i++) { const d = R(); c.globalAlpha = d < 0.5 ? 0.1 : 0.075; c.fillStyle = d < 0.5 ? '#0c0a06' : '#f0e2b4'; c.beginPath(); c.ellipse(R() * w, R() * h, 0.8 + R() * 2.2, 0.6 + R() * 1.2, R() * 3, 0, TAU); c.fill(); }
    c.restore();
  }
}
// </paint>

// ---------------------------------------------------------------- the window in the gallery wall
const X0 = -0.616, X1 = -0.16, Y0 = 0.26;                 // the opening in the face of the wall: metres along it from the picture's middle, and its foot above the floor
const THICK = 0.16;                                       // the wall's thickness, as the window shows it
const GL = 0.04, GR = 0.04, GT = 0.045, GB = 0.065;       // how far each side of the opening closes in through that thickness (a splayed reveal, and a sloping sill)
const AX0 = X0 + GL, AX1 = X1 - GR;                       // the daylight opening, at the back of the wall
const WH = 1697, WXL = -14, WXR = 907, S = (AX1 - AX0) / (WXR - WXL);   // the picture's window in its own measure (sill to top; its jambs); metres to one point of it
const AY0 = Y0 + GB, AY1 = AY0 + WH * S, Y1 = AY1 + GT;   // the sill and head of the daylight opening, and the top of the opening in the wall's face
const SUN = [0.55, 0.8];                                  // the light comes in from the upper left, as in his picture: how far across and down it goes for each metre it comes in
const EYE0 = [(X0 + X1) / 2, 0.8, 2.0];                   // where you stand to see the country exactly as he composed it
const DEEP = { sky: 0.9, far: 0.62, wood: 0.44, land: 0.3, bank: 0.11, tree: 0.05 };    // how far behind the wall each sheet lies (it is a shallow box, not a mile)
const POOL = 0.2;                                         // how strong the daylight on the floor is
const KEY = 0.68;                                         // how bright the country is in the gallery's light
const TREE_AT = [391, 10], TREE_K = 1.15;                // where the thin tree's sheet sits in the window, and its size
const NS = 14;                                            // the pieces that move: farm, man, two cattle and their heads, herdsman and his arm; then the two birds, three pieces each
const TAKE = 4.0, LOOP = 32;                              // the birds take wing at 4 s, and again every 32 s
// their flight, as [seconds after taking wing, across, down, size, depth]: up from the grass and across the window,
// out past its left side; then small and far, over the hill to the mountains; and much later home again
const OUT = [[0, 590, 1570, 0.2, 0.11], [0.35, 548, 1480, 0.4, 0.1], [0.7, 462, 1280, 0.9, 0.085], [1.0, 360, 1020, 1.5, 0.07], [1.35, 205, 740, 1.8, 0.07], [1.75, -60, 470, 1.75, 0.07], [2.15, -520, 280, 1.7, 0.07]];
const AWAY = [[2.2, -330, 610, 0.56, 0.4], [3.0, 40, 665, 0.52, 0.4], [4.0, 330, 745, 0.42, 0.45], [5.2, 540, 835, 0.28, 0.5], [6.6, 662, 893, 0.15, 0.58], [8.2, 715, 922, 0.06, 0.62]];
const HOME = [[17, 1010, 850, 0.06, 0.6], [18.2, 830, 950, 0.11, 0.5], [19.4, 700, 1230, 0.17, 0.3], [20.4, 615, 1490, 0.2, 0.15], [21, 590, 1570, 0.2, 0.11]];
const BIRDS = [{ lag: 0, dx: 0, dy: 0, ax: 0, ay: 0, ph: 0, fx: 1 }, { lag: 0.36, dx: 35, dy: 28, ax: -44, ay: 20, ph: 1.9, fx: -1 }];       // (one leads, the other a wingbeat behind)
const KF = 0.7;                                           // the flying bird's sheet is drawn larger than it is shown
const curveAt = (K, t, into) => {
  let i = 0; while (i < K.length - 2 && t > K[i + 1][0]) i++;
  const a = K[Math.max(0, i - 1)], b = K[i], c = K[i + 1], d = K[Math.min(K.length - 1, i + 2)], k = clamp01((t - b[0]) / (c[0] - b[0]));
  for (let j = 1; j < 5; j++) into[j - 1] = 0.5 * (2 * b[j] + (c[j] - a[j]) * k + (2 * a[j] - 5 * b[j] + 4 * c[j] - d[j]) * k * k + (3 * b[j] - a[j] - 3 * c[j] + d[j]) * k * k * k);
  return into;
};

lifeFor(16151, {
  title: /^Portrait of a Gentleman/,
  word: 'beyond',
  // (a work under 1.2 m high: the kit keeps the whole of it in view; the window is low on the wall, beside and under it)
  stage: { out: 0.6, half: 0.75, cam: { dist: 1.9, side: -0.41, height: 0.8, fov: 60, lookU: -0.3, lookOut: 0, lookH: 1.0, floorOut: 0.05 } },
  wake: 2.4, ret: 2.4,
  linger: { near: 3.5, max: 30 },

  build(L) {
    const P = L.pal;
    const lin = h => { const c = new THREE.Color(h); return `vec3(${c.r.toFixed(4)}, ${c.g.toFixed(4)}, ${c.b.toFixed(4)})`; };
    // (L.pal.near gives a colour in three.js's working space; the canvas wants it as it is written)
    const hexCol = h => { const c = P.near(h, 0.06); return [Math.round(255 * Math.pow(c.r, 1 / 2.2)), Math.round(255 * Math.pow(c.g, 1 / 2.2)), Math.round(255 * Math.pow(c.b, 1 / 2.2))]; };
    this.B = new THREE.Matrix4().makeBasis(new THREE.Vector3(L.tx, 0, L.tz), new THREE.Vector3(0, 1, 0), new THREE.Vector3(L.nx, 0, L.nz)).setPosition(L.floor(0, 0));
    this.Binv = this.B.clone().invert();
    const K = LOWMEM ? 0.5 : 1, R = rng(16151);
    let land = null;
    const atlas = canvasTexture(AW * K, AH * K, g => { land = canvasTexture(1024 * K, 1024 * K, g2 => paintView(g, K, hexCol, R, CELL, g2, LAND, GUT)); });
    for (const t of [atlas, land]) { t.premultiplyAlpha = true; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter; t.anisotropy = 4; t.needsUpdate = true; }
    const zq = -L.wall + 0.004, geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute([X0, Y0, zq, X1, Y0, zq, X1, Y1, zq, X0, Y1, zq], 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2)); geo.setIndex([0, 1, 2, 0, 2, 3]);
    const u = this.u = {
      uInv: { value: new THREE.Matrix4() }, uT: { value: 0 }, uTop: { value: Y0 }, uKey: { value: KEY }, uSway: { value: 1 }, uLand: { value: land },
      uSA: { value: new Float32Array(NS * 4) }, uSM: { value: new Float32Array(NS * 4) }, uSC: { value: new Float32Array(NS * 4) }, uSP: { value: new Float32Array(NS * 2) },
    };
    const f = (x, n = 1) => x.toFixed(n), g4 = x => x.toFixed(4), row = n => { const [r0, r1, y0, y1] = LAND[n]; return `vec4(${f(r0 + GUT)}, ${f(r1)}, ${f(y0)}, ${f(y1)})`; };
    const STONE = '#938b7a', SHADE = '#908d89';                                // the stone of his window's surround, as daylight would show it (in his dark room it is #403927)
    const SKY = [[20, '#2b4d43'], [150, '#306665'], [300, '#4c8486'], [450, '#6da4a4'], [600, '#8db7b1'], [700, '#a2c4ba'], [780, '#afc8b9'], [880, '#cdd3b8'], [945, '#e3dcb7']];
    const m = new THREE.MeshBasicMaterial({ map: atlas, transparent: true, depthWrite: false, fog: false, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor });
    m.landTex = land;
    m.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, u);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform mat4 uInv; varying vec3 vLoc; varying vec3 vEye;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\n  vLoc = transformed; vEye = (uInv * vec4(cameraPosition, 1.0)).xyz;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <map_pars_fragment>', `#include <map_pars_fragment>
uniform float uT, uTop, uKey, uSway; uniform sampler2D uLand;
uniform vec4 uSA[${NS}]; uniform vec4 uSM[${NS}]; uniform vec4 uSC[${NS}]; uniform vec2 uSP[${NS}];
varying vec3 vLoc; varying vec3 vEye;
vec3 gvOver(vec3 c, vec4 s) { return s.rgb + c * (1.0 - s.a); }
float gvHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float gvNoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(gvHash(i), gvHash(i + vec2(1.0, 0.0)), f.x), mix(gvHash(i + vec2(0.0, 1.0)), gvHash(i + vec2(1.0, 1.0)), f.x), f.y); }
// his sky, from the deep blue-green at the top of the window down to the cream along the hills
vec3 gvSky(vec2 q) {
  vec3 c = ${lin(SKY[0][1])};
${SKY.slice(1).map((s, i) => `  c = mix(c, ${lin(s[1])}, clamp((q.y - ${f(SKY[i][0])}) / ${f(s[0] - SKY[i][0])}, 0.0, 1.0));`).join('\n')}
  return c * (0.86 + 0.13 * gvNoise(q / 95.0 + 3.0) + 0.1 * gvNoise(vec2(q.x / 38.0, q.y / 17.0)) + 0.07 * gvNoise(q / 6.0) + 0.05 * gvHash(floor(q / 2.5)));
}
// a strip of the land, where the eye's line meets its sheet: it goes on, mirrored, past either end
vec4 gvStrip(vec2 q, vec4 r) {
  float tx = (q.x + 140.0) / 1198.0; tx = 1.0 - abs(mod(tx, 2.0) - 1.0);
  float ty = (q.y - r.z) / (r.w - r.z);
  float v = clamp(mix(r.x, r.y, ty), r.x + 0.5, r.y - 2.0) / 1024.0;
  return texture2D(uLand, vec2(clamp(tx, 0.001, 0.999), 1.0 - v)) * step(0.0, ty);
}
// one of the pieces that move
vec4 gvPiece(int i, vec2 Pw, vec2 D) {
  vec4 a = uSA[i], mm = uSM[i], c = uSC[i];
  vec2 d = Pw + D * a.z - a.xy, l = vec2(dot(mm.xy, d), dot(mm.zw, d)) + uSP[i];
  float k = a.w * step(0.5, l.x) * step(l.x, c.z - 0.5) * step(0.5, l.y) * step(l.y, c.w - 0.5);
  if (k <= 0.0) return vec4(0.0);                                 // (most points of the opening have no piece over them: do not read the sheet for nothing)
  vec2 uv = (c.xy + clamp(l, vec2(0.5), c.zw - 0.5)) / vec2(${f(AW)}, ${f(AH)});
  return texture2D(map, vec2(uv.x, 1.0 - uv.y)) * k;
}`).replace('#include <map_fragment>', `
  {
    vec2 P = vLoc.xy;
    float ez = max(vEye.z - vLoc.z, 0.05);
    vec2 sl = (P - vEye.xy) / ez;                                   // the slope of the eye's line as it goes into the wall
    // the wall's thickness: four faces that close in towards the daylight; how deep the eye's line goes before it meets each
    float zl = (P.x - ${g4(X0)}) / max(${g4(GL / THICK)} - sl.x, 1.0e-4), zr = (${g4(X1)} - P.x) / max(${g4(GR / THICK)} + sl.x, 1.0e-4);
    float zb = (P.y - ${g4(Y0)}) / max(${g4(GB / THICK)} - sl.y, 1.0e-4), zt = (uTop - P.y) / max(${g4(GT / THICK)} + sl.y, 1.0e-4);
    float zj = min(zl, zr), zv = min(zb, zt), zm = min(zj, zv), e = min(zm / ${g4(THICK)}, 4.0);
    float through = smoothstep(1.0 - clamp(fwidth(e) * 1.5, 0.0, 0.3), 1.0, e);
    vec3 c = vec3(0.0);
    if (through > 0.0) {
    vec2 Q = P + sl * ${g4(THICK)};                                 // where the line comes out into the daylight
    vec2 dm = sl - (Q - vec2(${f(EYE0[0], 3)}, ${f(EYE0[1], 3)})) / ${f(EYE0[2] + THICK, 3)};
    dm /= sqrt(1.0 + dot(dm, dm) / 0.36);                           // (from far to one side the country slides only so far)
    vec2 D = vec2(dm.x, -dm.y * 0.3) / ${S.toFixed(7)};             // how far a sheet slides, in the picture's measure, for each metre it lies beyond the wall
    vec2 Pw = vec2((Q.x - ${g4(AX1)}) / ${S.toFixed(7)} + ${f(WXR)}, (${g4(AY1)} - Q.y) / ${S.toFixed(7)});
    c = gvSky(Pw + D * ${f(DEEP.sky, 2)});
    c = gvOver(c, gvStrip(Pw + D * ${f(DEEP.far, 2)}, ${row('far')}));
    c = gvOver(c, gvStrip(Pw + D * ${f(DEEP.wood, 2)}, ${row('wood')}));
    c = gvOver(c, gvStrip(Pw + D * ${f(DEEP.land, 2)}, ${row('ground')}));
    for (int i = 0; i < 8; i++) c = gvOver(c, gvPiece(i, Pw, D));
    c = gvOver(c, gvStrip(Pw + D * ${f(DEEP.bank, 2)}, ${row('bank')}));
    for (int i = 8; i < ${NS}; i++) c = gvOver(c, gvPiece(i, Pw, D));
    {                                                               // the thin tree, nearest of all: its leaves stir, the top most
      vec2 l = (Pw + D * ${f(DEEP.tree, 2)} - vec2(${f(TREE_AT[0])}, ${f(TREE_AT[1])})) / ${f(TREE_K, 3)};
      float hk = smoothstep(1000.0, 80.0, l.y) * uSway;
      l.x += hk * (4.5 * sin(uT * 1.1 + l.y * 0.004) + 2.2 * sin(uT * 2.7 + l.x * 0.021 + l.y * 0.013));
      l.y += hk * 1.6 * sin(uT * 2.1 + l.x * 0.03);
      float k = step(0.5, l.x) * step(l.x, ${f(CELL.tree[2] - 0.5)}) * step(0.5, l.y);
      vec2 uv = clamp(l, vec2(0.5), vec2(${f(CELL.tree[2] - 0.5)}, ${f(CELL.tree[3] - 2)})) / vec2(${f(AW)}, ${f(AH)});
      c = gvOver(c, texture2D(map, vec2(uv.x, 1.0 - uv.y)) * k);
    }
    c *= uKey;
    }
    if (through < 1.0) {
      // the wall's own thickness round the opening, in the plain grey stone of his window: the sill and the right jamb
      // take the light that comes in, the left jamb and the head are in their own shade, and the left jamb's shadow
      // lies across the sill and the head's down the right jamb
      float T = ${g4(THICK)}, top = uTop - ${g4(GT)};
      float zjc = min(zj, T), zvc = min(zv, T), dj = zjc / T, dv = zvc / T;      // (a face the line never meets is met nowhere: keep the sums finite)
      float yj = P.y + sl.y * zjc, xv = P.x + sl.x * zvc;
      float litR = smoothstep(-0.007, 0.007, top - ${g4(SUN[1])} * (T - zjc) - yj);
      float litS = smoothstep(-0.007, 0.007, xv - ${g4(AX0)} - ${g4(SUN[0])} * (T - zvc));
      float tj = zl < zr ? mix(0.3, 0.4, dj) + 0.1 * exp(-max(yj - ${g4(Y0)}, 0.0) / 0.12) : mix(0.5, 1.0, litR) * mix(0.8, 0.94, dj);
      float tv = zb < zt ? mix(0.47, 1.0, litS) * mix(0.9, 1.06, dv) : mix(0.24, 0.33, dv);
      // (each face is a little darker in its corners, where it meets the next)
      float cj = min(yj - ${g4(Y0)} - ${g4(GB / THICK)} * zjc, uTop - ${g4(GT / THICK)} * zjc - yj);
      float cv = min(xv - ${g4(X0)} - ${g4(GL / THICK)} * zvc, ${g4(X1)} - ${g4(GR / THICK)} * zvc - xv);
      tj *= 1.0 - 0.3 * exp(-max(cj, 0.0) / 0.016); tv *= 1.0 - 0.3 * exp(-max(cv, 0.0) / 0.016);
      float zd = clamp(zv, 0.0, 4.0) - clamp(zj, 0.0, 4.0), tone = mix(tv, tj, smoothstep(-1.0, 1.0, zd / max(fwidth(zd), 1.0e-5)));
      vec2 hp = vec2(zj < zv ? yj : xv, min(zm, T)) * 150.0;
      tone *= 0.9 + 0.13 * gvNoise(hp) + 0.07 * gvNoise(hp * 0.23 + 7.0);
      tone *= 1.0 + 0.1 * exp(-max(zm, 0.0) / 0.004);                         // (the arris, where the stone meets the plaster)
      c = mix(mix(${lin(SHADE)}, ${lin(STONE)}, smoothstep(0.25, 0.8, tone)) * tone, c, through);    // (what is in shade has the sky's light, not the sun's)
    }
    float a = 1.0 - smoothstep(uTop - fwidth(P.y) * 1.5, uTop, P.y);
    diffuseColor = vec4(c * a, a);
  }
  diffuseColor *= lifeK;`);
    };
    m.customProgramCacheKey = () => 'ghirlandaio-window-9';
    const mesh = this.mesh = new THREE.Mesh(geo, m);
    mesh.matrixAutoUpdate = false; mesh.matrix.copy(this.B); mesh.matrixWorldNeedsUpdate = true; mesh.renderOrder = 6; mesh.visible = false; mesh.frustumCulled = false;
    L.add(mesh);
    // the daylight it lets fall on the gallery floor, under the sill: what a patch of sky that size would throw there,
    // made to end before the window's own sides do
    const FW = X1 - X0, FD = 0.95, fn = 64, fm = 96;
    const pool = canvasTexture(fn, fm, g => {
      const im = g.createImageData(fn, fm), ss = t => { t = clamp01(t); return t * t * (3 - 2 * t); };
      const E = (x, o) => { let s = 0; for (let i = 0; i < 8; i++) for (let j = 0; j < 12; j++) { const xq = lerp(AX0, AX1, (i + 0.5) / 8) - (X0 + X1) / 2, yq = lerp(AY0, AY1, (j + 0.5) / 12), r2 = (x - xq) * (x - xq) + yq * yq + o * o; s += yq * o / (r2 * r2); } return s; };
      let top = 0; const v = new Float32Array(fn * fm);
      for (let j = 0; j < fm; j++) for (let i = 0; i < fn; i++) { const x = ((i + 0.5) / fn - 0.5) * FW, o = (j + 0.5) / fm * FD; v[j * fn + i] = E(x, o + 0.02) * ss((0.5 - Math.abs(x) / FW) * 2 / 0.55) * ss((FD - o) / (FD * 0.6)); top = Math.max(top, v[j * fn + i]); }
      for (let k = 0; k < fn * fm; k++) { const a = v[k] / top; im.data[k * 4] = 232 * a; im.data[k * 4 + 1] = 236 * a; im.data[k * 4 + 2] = 214 * a; im.data[k * 4 + 3] = 255; }
      g.putImageData(im, 0, 0);
    });
    this.pool = L.decal({ w: FW, d: FD, u: (X0 + X1) / 2, out: -L.wall + FD / 2, map: pool, additive: true, opacity: 0 });
    this.pool.visible = false;
    this.tmp = [0, 0, 0, 0]; this.tmp2 = [0, 0, 0, 0];
    this.clear();
  },

  hide() { if (this.mesh) this.mesh.visible = false; if (this.pool) this.pool.visible = false; },
  clear() { this.open = 0; this.open0 = 0; this.wasBack = false; this.T = 0; this.told = false; this.beat = [0, 0]; this.gust = 0; },
  start(L, resumed) {
    if (resumed) return;
    this.clear();
    const v = L.voice(); if (!L.quiet && v.ctx) noise(v, 0, { d: 2.2, vol: L.calm ? 0.004 : 0.008, lp: 300, attack: 0.6 });      // the air of outdoors, coming in
  },
  back() {},
  end() { this.hide(); },
  reset() { this.hide(); this.clear(); },

  // put piece i: a cell of the sheet with its point (px, py) at (x, y) of the window, k of the window's points to one
  // of its own (ky up and down), turned by th about that point, mirrored if fx is -1
  put(i, name, x, y, deep, a, k, th = 0, px = 0, py = 0, fx = 1, ky = k) {
    const c = Math.cos(th), s = Math.sin(th);
    this.set(i, name, x, y, deep, a, fx * c / k, fx * s / k, -s / ky, c / ky, px, py);
  },
  set(i, name, x, y, deep, a, m00, m01, m10, m11, px, py) {
    const u = this.u, C = CELL[name], j = i * 4;
    u.uSA.value.set([x, y, deep, a], j); u.uSM.value.set([m00, m01, m10, m11], j); u.uSC.value.set(C, j); u.uSP.value[i * 2] = px; u.uSP.value[i * 2 + 1] = py;
  },

  update(L, dt) {
    const ph = L.phase, showing = ph === 'wake' || ph === 'play', linger = ph === 'linger', back = ph === 'return';
    if (!showing && !linger && !back) { this.hide(); return; }
    const calm = L.calm, u = this.u, sp = calm ? 0.6 : 1, voice = L.voice(), loud = !L.quiet && voice.ctx;
    // ---- the opening rises from the sill (and comes down again, from wherever it is)
    if (back) { if (!this.wasBack) this.open0 = this.open; this.open = this.open0 * (1 - clamp01(L.ret / 0.9)); } else this.open = Math.min(1, this.open + dt * sp / 2.15);
    this.wasBack = back;
    u.uTop.value = lerp(Y0, Y1, ease.inOut(this.open));
    this.T += dt * sp;
    const T = this.T; u.uT.value = T; u.uInv.value.copy(this.Binv);
    this.mesh.visible = this.open > 0.002;
    this.pool.visible = this.mesh.visible; this.pool.material.opacity = POOL * ease.inOut(clamp01((this.open - 0.12) / 0.88));

    // ---- the farm, and the small life of the yard
    const DL = DEEP.land;
    this.put(0, 'farm', 40, 1388, DL, 1, 0.743, 0, 30, 480, 1, 0.948);
    { // the man with the straw on his shoulder goes along the front of the stack and in under the shed
      const p = ((T - 1.5 + 45) % 45) / 15, x = lerp(58, 236, clamp01(p)), y = lerp(1402, 1393, clamp01(p));
      this.put(1, Math.floor(T * 3.1) % 2 ? 'man1' : 'man2', x, y, DL, ramp(p, 0, 0.06) * (1 - ramp(p, 0.86, 1)), 0.3, 0, 46, 214);
    }
    { // the standing ox grazes, and lifts its head now and then; the one lying down turns its head
      const up = ease.inOut(ramp(Math.sin(T * 0.55 + 0.6), 0.72, 0.96)), k = 0.6, x = 178, y = 1502;
      this.put(2, 'ox1', x, y, DL, 1, k, 0, 38, 192);
      this.put(3, 'ox1h', x + (236 - 38) * k, y + (70 - 192) * k, DL, 1, k, 0.78 - 0.5 * up + 0.025 * Math.sin(T * 5.2) * (1 - up), 24, 60);
      const k2 = 0.55, x2 = 345, y2 = 1508;
      this.put(4, 'ox2', x2, y2, DL, 1, k2, 0, 28, 168);
      this.put(5, 'ox2h', x2 + (150 - 28) * k2, y2 + (98 - 168) * k2, DL, 1, k2, 0.1 * Math.sin(T * 0.43) + 0.05 * Math.sin(T * 1.3), 70, 120);
    }
    { // the herdsman shifts his stick
      const k = 0.41, x = 562, y = 1525;
      this.put(6, 'herd', x, y, DL, 1, k, 0, 66, 292);
      this.put(7, 'arm', x + (40 - 66) * k, y + (78 - 292) * k, DL, 1, k, -0.26 + 0.07 * Math.sin(T * 0.6), 64, 150);
    }

    // ---- the two white birds in the dark grass
    const tau = T < TAKE || calm ? -1 : (T - TAKE) % LOOP, a4 = this.tmp, b4 = this.tmp2;
    // (before they go, their necks come up: something has stirred; in a calm museum they only look up now and then)
    const alert = calm ? ease.inOut(ramp(Math.sin(T * 0.5), 0.6, 0.95)) : T < TAKE ? ease.inOut(ramp(T, TAKE - 0.75, TAKE - 0.3)) : 0;
    let near = 0;
    const k8 = t => 1.5 - ramp(t, 3, 8.2);            // (the two draw together as they go)
    BIRDS.forEach((b, n) => {
      const i = 8 + n * 3, t = tau - b.lag;
      let K = null, al = 1, ox = b.dx, oy = b.dy;
      if (tau >= 0 && t >= 0 && t < 21) {
        if (t < 2.15) { K = OUT; al = 1 - ramp(t, 1.9, 2.15); }
        else if (t >= 2.2 && t < 8.2) { K = AWAY; al = ramp(t, 2.2, 2.5) * (1 - ramp(t, 7.3, 8.2)); ox = b.ax * k8(t); oy = b.ay * k8(t); }
        else if (t >= 17) { K = HOME; al = ramp(t, 17, 17.6); }
        else al = 0;
      }
      if (!K) {
        if (al <= 0) { for (let j = 0; j < 3; j++) u.uSA.value[(i + j) * 4 + 3] = 0; return; }
        // standing: the body, and the neck that comes up
        const x = 590 + b.dx, y = 1588 + b.dy, k = 0.2, lift = n ? ease.inOut(ramp(alert, 0.25, 1)) : ease.inOut(ramp(alert, 0, 0.75));
        const peck = (1 - lift) * (0.75 + 0.3 * Math.max(0, Math.sin(T * 2.3 + n * 2.4)) * Math.max(0, Math.sin(T * 0.37 + n)));
        this.put(i, 'bird', x, y, DEEP.bank, 1, k, 0, 72, 121, b.fx);
        this.put(i + 1, 'neck', x + b.fx * (108 - 72) * k, y + (48 - 121) * k, DEEP.bank, 1, k, b.fx * peck, 22, 112, b.fx);
        u.uSA.value[(i + 2) * 4 + 3] = 0;
        return;
      }
      curveAt(K, t, a4); curveAt(K, t + 0.04, b4);
      const x = a4[0] + ox, y = a4[1] + oy, k = Math.max(0.03, a4[2]), deep = a4[3];
      let vx = b4[0] - a4[0], vy = (b4[1] - a4[1]) * 0.45; const vl = Math.hypot(vx, vy) || 1; vx /= vl; vy /= vl;
      const fl = vx >= 0 ? 1 : -1, yx = -vy * fl, yy = vx * fl;
      // the wings beat: up, and a longer way down; the body rides a little against them
      const w = TAU * 3.4 * t + b.ph, lim = v => (v < 0 ? -1 : 1) * Math.max(0.22, Math.abs(v)), beat = p => lim(0.14 + 0.86 * Math.sin(p + 0.3 * Math.sin(p)));
      const f1 = beat(w), f2 = beat(w - 0.35), kk = k * KF, bob = -3.5 * Math.sin(w - 0.5), bx = x + yx * bob * kk, by = y + yy * bob * kk;
      // the far wing, the body, the near wing: a wing that is up shows its underside if it is the near one, its lit top
      // if it is the far one, and the other way about when it is down
      // (the far wing is set a little forward of the near one, so the two are seen as two)
      const wing = (j, name, ox, oy, sc, f, tilt) => {
        const c = Math.cos(tilt * fl), s = Math.sin(tilt * fl), ax = vx * c - vy * s, ay = vx * s + vy * c, cx = yx * c - yy * s, cy = yx * s + yy * c, q = kk * sc;
        this.set(j, name, bx + (vx * ox + yx * oy) * kk, by + (vy * ox + yy * oy) * kk, deep, al, ax / q, ay / q, cx / (q * f), cy / (q * f), 110, 322);
      };
      wing(i, f2 > 0 ? 'wing' : 'wingu', 52, -20, 0.93, f2, 0.3);
      this.set(i + 1, 'fly', bx, by, deep, al, vx / kk, vy / kk, yx / kk, yy / kk, 250, 130);
      wing(i + 2, f1 > 0 ? 'wingu' : 'wing', 40, -13, 1, f1, -0.1);
      // each downstroke is heard, the louder the nearer they are
      const was = this.beat[n]; this.beat[n] = Math.sin(w);
      const nk = clamp01(k / 1.3) * al; if (K !== AWAY) near = Math.max(near, nk);
      if (loud && was > 0 && this.beat[n] <= 0 && nk > 0.1 && K !== AWAY) noise(voice, 0, { d: 0.085, vol: 0.022 * nk, bp: 640 + 260 * n, q: 0.9, attack: 0.014 });
    });
    // ---- the air they move goes through the tree
    this.gust += (Math.max(near * 1.6, calm ? 0 : ease.smooth(ramp(T, TAKE - 0.9, TAKE)) * (1 - ramp(T, TAKE + 1.5, TAKE + 4)) * 1.1) - this.gust) * Math.min(1, dt * 3);
    u.uSway.value = (calm ? 0.5 : 1) + this.gust;

    if (loud) { voice.level = calm ? 0.8 : 1; voice.place(L.cx + L.tx * EYE0[0], L.cz + L.tz * EYE0[0]); }
    if (showing && !this.told && !L.quiet && this.open >= 1) { this.told = true; L.k.say('Behind his shoulder there is a window, and a country in it: hills, a thatched barn, two cattle and, down in the dark grass, two white birds, each a few millimetres of paint.', 6); }
    if (back && L.ret >= 1) this.hide();
  },
});
