// German (South German), Portrait of a Young Artist, about 1500 (Gallery 207): QUILL.
//
// What the museum says: "The youthful sitter in this portrait pauses in the midst of drawing a nude figure to shape
// his quill pen. On the shelf behind him are pots of paint, a shell probably used to mix pigment and binder, and a
// bottle of oil." It has "often been assumed" to be a self-portrait; the museum does not say it is, and gives him no
// name. So he is a man who draws with a pen, caught in the one moment a pen draughtsman of his time had to stop for:
// the pen has gone soft and must be cut again. His right hand holds a small knife, its curved steel blade upright and
// its ribbed bone handle below the fist; his left holds the long white quill, trimmed slim. On the grey table lie the
// sheet, rolled up tight at one end, and a square ochre ink pot, black at the neck, ink run down its sides, its dark
// stopper beside it. At the right is his window: a round green hill, a pale path, a band of trees, a rocky height.
//
// What comes out, and why. The word is found in the picture: quill. Every other show that draws in this museum draws
// with a line that makes itself; only this picture is about the tool, and about the moment before the line.
//   1. His quill falls out from under the frame as a feather falls, rocking, and steadies over the floor, the pen end
//      to the left as he holds it. His ink pot and its stopper are set down beside it.
//   2. His knife comes down, the blade upright as he holds it, and pares the pen: two long cuts, each lifting a curl
//      of shaving that springs away and rocks on the floor; then the blade is set on the tip, lifted, and the tip is
//      cut square with one small crisp sound. That is the moment of the show. The knife goes back up to him.
//   3. A sheet of paper lets itself down the wall under him and out along the floor, and stops as his does, in a
//      tight roll. The pen is dipped, a drop falls back into the pot, and it is tried at the sheet's edge as a new
//      pen is tried (a zigzag, a row of loops, three flicks).
//   4. Then it draws, in the pen line and slanting hatching of a South German sheet of 1500, the one thing in his
//      room it can: the view out of his window. The hill, the path, the trees, the rocks, their shade hatched on the
//      side away from the light. The ink goes down wet and dark and dries brown; the line thins as the pen empties,
//      and it goes back to the pot. When the view is done a bird is added to the sky now and then, while you stay.
// When you look away the pen goes back up under the frame, and the sheet rolls itself up the wall and is gone.
//
// How it is made. Two draw calls. One mesh holds the sheet, the quill, the knife, the pot, the stopper, three shavings
// and a drop of ink, each smooth (built from rules, not facets) and painted in the shader in his manner: one light
// from the right, as from his window; a firm lit side and a firm shaded side; thin crisp lights along edges; every
// colour taken from the picture's own palette. The sheet's roll is wound in the vertex shader from one number (how
// much of it is let down), the pen's point is narrowed by another (how far it is cut). The drawing is two small
// textures made once: how much ink lies at each point, and when the pen reached it; the sheet shows the ink the pen
// has reached. A second mesh lays the shade things throw on the floor and wall. Calm mode: the feather falls without
// its wide rocking, nothing springs or rebounds, the shavings turn at half speed, and every sound is quieter.
//
// What it does not do: it does not draw the figure on his sheet (no unclothed figure is ever made here), it gives him
// no name and does not bring him out of the picture, and the knife's blade only ever points up, never at a picture.
import * as THREE from 'three';
import { lifeFor, ease, ramp, clamp01, lerp } from '../paintlife.js';
import { score } from './stagecraft.js';

const PI = Math.PI, TAU = PI * 2;
// The stage's own metres: x along the wall (to the viewer's right), y up from the floor, z out from the picture's plane.
const SUN = new THREE.Vector3(0.60, 0.62, 0.50).normalize();      // the way to his light: from the right, as from his window
const KEY = 0.5;                                    // (the game's film curve lifts what the room does not light: the paint is laid that much lower)
// the sheet: its edges along the wall; its slope down the wall, its length on the floor, how much stays wound
const XS0 = -0.45, XS1 = 0.35, SW = XS1 - XS0, LS = 1.18, LF = 0.09, WOUND = 0.36, S_END = LS + LF, S_TOT = S_END + WOUND, U0 = 0.09;
const G0 = 0.15, GP = 8.0;                          // how it leans at the top, how late it bends out to the floor
const RIN = 0.011, PITCH = 0.008;                   // the roll: its innermost turn, how much each turn adds
const TW = 768, TH = 992, TMAX = 64;                // the drawing: its texture, and the longest its clock runs
const XD0 = XS0 + 0.04, DW = SW - 0.08, SD0 = 0.09, DH = DW * TH / TW, LW = DW / 0.6;      // where on the sheet it is drawn; how broad its lines are, to its size
const LEN = 1.0, NIBL = 0.09;                       // the quill: its length, how much of it is cut
const BLD = 0.17, KS = 1.15;                        // the knife's blade; how much larger than it is made the knife is shown
const RHO = 0.04, CW = 0.026;                       // a shaving: its curl, its width
const PS = 1.3, PX = -0.80, PZ = 0.42, POT_YAW = -PI / 4 + 0.12, STX = -1.0, STZ = 0.62;      // the ink pot (larger than made, too), cornerwise; its stopper
const CN = new THREE.Vector3(-0.58, 0.66, 0.60);    // where the pen's point is held to be cut
const D_CUT = new THREE.Vector3(Math.cos(0.05), Math.sin(0.05), 0.04).normalize(), D_POT = new THREE.Vector3(0.36, 0.86, 0.36).normalize(), D_PAPER = new THREE.Vector3(0.62, 0.40, 0.68).normalize();
const E_OUT = new THREE.Vector3(-0.03, 1.14, 0.10); // where things leave the picture: under the frame
// The show, in seconds.
const T_FALL = [0.15, 1.25], T_POT = [0.5, 1.0], T_KIN = [0.9, 1.6], T_P1 = [1.75, 2.2], T_P2 = [2.5, 2.92], T_TIP = [3.0, 3.38], T_SNICK = 3.45, T_KOUT = [3.65, 4.3], T_ROLL = [3.55, 4.7], T_PEN = 3.85;
const FIRST = [0.62, 0.38, 0.45], DIP = [0.5, 0.4, 0.5], CAP = 3.2;      // to the pot, in it, to the sheet; how far a penful goes (metres of line)
let TOLD = false;                                   // (the game says what happens once, the first time)
const K_PAPER = 0, K_QUILL = 1, K_KNIFE = 2, K_POT = 3, K_STOP = 4, K_CURL = 5, K_INK = 6, NP = 9;
const hump = (t, a, b) => (t <= a || t >= b ? 0 : Math.sin(PI * (t - a) / (b - a)));

// ---------------------------------------------------------------- geometry
// A smooth surface from a rule: f(u, v, o) sets o.p (a point), and may set o.c (numbers for the shader) and o.t (where
// on its part it lies; u, v if it does not), for u, v in 0..1. Its normals are taken from the rule. Every vertex says
// what it is (aK: kind, which moving part, which piece of it).
const _o = { p: new THREE.Vector3(), c: new THREE.Color(), t: new THREE.Vector2(), w: 0 }, _q = [0, 1, 2, 3].map(() => new THREE.Vector3()), _n = new THREE.Vector3();
function surf(nu, nv, f, kind = 0, part = 0, sub = 0) {
  const W = nv + 1, n = (nu + 1) * W, P = new Float32Array(n * 3), N = new Float32Array(n * 3), C = new Float32Array(n * 3), T = new Float32Array(n * 2), e = 2e-3;
  const at = (u, v, into) => { f(u, v, _o); return into.copy(_o.p); };
  for (let i = 0; i <= nu; i++) for (let j = 0; j <= nv; j++) {
    const u = i / nu, v = j / nv, k = i * W + j;
    _o.t.set(u, v); _o.c.setRGB(0, 0, 0); f(u, v, _o);
    P[k * 3] = _o.p.x; P[k * 3 + 1] = _o.p.y; P[k * 3 + 2] = _o.p.z; C[k * 3] = _o.c.r; C[k * 3 + 1] = _o.c.g; C[k * 3 + 2] = _o.c.b; T[k * 2] = _o.t.x; T[k * 2 + 1] = _o.t.y;
    const uu = Math.min(1 - e, Math.max(e, u)), vv = Math.min(1 - e, Math.max(e, v));
    at(uu + e, vv, _q[0]).sub(at(uu - e, vv, _q[1])); at(uu, vv + e, _q[2]).sub(at(uu, vv - e, _q[3]));
    _n.crossVectors(_q[0], _q[2]); if (_n.lengthSq() < 1e-24) _n.set(0, 1, 0); else _n.normalize();
    N[k * 3] = _n.x; N[k * 3 + 1] = _n.y; N[k * 3 + 2] = _n.z;
  }
  const m = nu * nv * 6, pos = new Float32Array(m * 3), nor = new Float32Array(m * 3), col = new Float32Array(m * 3), uv = new Float32Array(m * 2), ak = new Float32Array(m * 3); let w = 0;
  const put = k => { for (let c = 0; c < 3; c++) { pos[w * 3 + c] = P[k * 3 + c]; nor[w * 3 + c] = N[k * 3 + c]; col[w * 3 + c] = C[k * 3 + c]; } uv[w * 2] = T[k * 2]; uv[w * 2 + 1] = T[k * 2 + 1]; ak[w * 3] = kind; ak[w * 3 + 1] = part; ak[w * 3 + 2] = sub; w++; };
  for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) { const a = i * W + j, b = (i + 1) * W + j, c = (i + 1) * W + j + 1, d = i * W + j + 1; put(a); put(b); put(d); put(b); put(c); put(d); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.setAttribute('aUv', new THREE.BufferAttribute(uv, 2)); g.setAttribute('aK', new THREE.BufferAttribute(ak, 3));
  return g;
}
function merge(list) {
  let n = 0; for (const g of list) n += g.attributes.position.count;
  const out = new THREE.BufferGeometry();
  for (const [name, k] of [['position', 3], ['normal', 3], ['color', 3], ['aUv', 2], ['aK', 3]]) { const a = new Float32Array(n * k); let o = 0; for (const g of list) { a.set(g.attributes[name].array, o); o += g.attributes[name].array.length; } out.setAttribute(name, new THREE.BufferAttribute(a, k)); }
  return out;
}
// A profile turned or lofted: points [r, y, ...] made a smooth line.
const curveOf = pts => new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(p[0], p[1], p[2] || 0)), false, 'centripetal');

const NOISE = /* glsl */`
float mH(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float mN(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mH(i), mH(i + vec2(1.0, 0.0)), f.x), mix(mH(i + vec2(0.0, 1.0)), mH(i + vec2(1.0, 1.0)), f.x), f.y); }`;
const f3 = x => x.toFixed(4), v3g = v => `vec3(${v.x.toFixed(4)}, ${v.y.toFixed(4)}, ${v.z.toFixed(4)})`;

// ---------------------------------------------------------------- the drawing
// The view from his window, as a pen of his time would set it down: contours first, then the shade in slanting
// strokes, all struck the same way (from the upper right, flicked to the lower left). Ours, in that manner; the
// motif is the picture's own. Returns the strokes (each a line of close points on the sheet's drawing, 0..1 across
// and up, with when it is begun and ended on the drawing's clock) and what the pen does between them.
function plan() {
  const S = [], VX = 0.16, VW = 0.82, VY = 0.02, VH = 0.96, UX = VW * DW / LW, UY = VH * DH / LW;      // (the view's place on the drawing; a unit of it, in the metres its strokes are given in)
  const view = ([x, y]) => [VX + VW * x, VY + VH * y];
  const line = (pts, o = {}) => S.push({ pts: pts.map(view), w: 0.0046, smooth: true, hatch: false, sp: 1.8, ...o });
  const raw = (pts, o = {}) => S.push({ pts, w: 0.0042, smooth: true, hatch: false, sp: 1.3, ...o });
  const hat = (x, y, len, cross = false) => S.push({ pts: [view([x, y]), view([x + (cross ? 0.5 : -0.5) * len / UX, y - 0.866 * len / UY])], w: 0.0031, smooth: false, hatch: true });
  // a row of such strokes kept inside an edge (its inside to the right of the way it runs): n of them, from q0 to q1 of its length, set in from it
  const row = (pts, q0, q1, n, len, inset, cross = false) => {
    const cv = curveOf(pts.map(([x, y]) => [x * UX, y * UY])), dx = cross ? 0.5 : -0.5;
    for (let i = 0; i < n; i++) {
      const q = clamp01(lerp(q0, q1, (i + 0.22 * Math.sin(i * 2.4)) / Math.max(1, n - 1))), e = cv.getPointAt(q), tg = cv.getTangentAt(q), nx = tg.y, ny = -tg.x;
      const ln = (typeof len === 'function' ? len(q) : len) * (1 + 0.14 * Math.sin(i * 1.7)), back = dx * nx - 0.866 * ny < 0 ? ln : 0;
      hat((e.x + nx * inset - dx * back) / UX, (e.y + ny * inset + 0.866 * back) / UY, ln, cross);
    }
  };

  // the new pen tried at the sheet's edge: a zigzag, a row of loops, three flicks
  raw(Array.from({ length: 9 }, (_, i) => [0.022 + 0.0125 * i, 0.905 + (i % 2 ? 0.034 : 0)]));
  raw(Array.from({ length: 34 }, (_, k) => { const t = k / 33; return [0.03 + 0.075 * t - 0.012 * Math.sin(TAU * 3.5 * t), 0.80 + 0.021 * Math.cos(TAU * 3.5 * t)]; }), { sp: 1.3 });
  for (let i = 0; i < 3; i++) S.push({ pts: [[0.064 + 0.024 * i, 0.725], [0.036 + 0.024 * i, 0.675]], w: 0.0031, smooth: false, hatch: true });

  // his window is tall, and so is the view: the green mound that fills its lower corner
  const MOUND = [[0.30, 0.02], [0.33, 0.14], [0.42, 0.27], [0.56, 0.37], [0.74, 0.43], [0.90, 0.455], [1.0, 0.46]];
  line(MOUND, { w: 0.0052 });
  // the pale path that winds up round its foot, narrower as it goes; its ruts
  line([[0.0, 0.10], [0.10, 0.20], [0.22, 0.30], [0.36, 0.385], [0.50, 0.44], [0.62, 0.478]]);
  line([[0.20, 0.02], [0.24, 0.12], [0.31, 0.22], [0.40, 0.31], [0.50, 0.385], [0.60, 0.44]]);
  line([[0.10, 0.07], [0.15, 0.13], [0.21, 0.19]], { w: 0.0036 }); line([[0.27, 0.25], [0.33, 0.30], [0.40, 0.345]], { w: 0.0036 });
  // the band of round trees across the middle: each a dome of scallops, the next begun behind the last
  const TREES = [[0.09, 0.50, 0.085], [0.235, 0.515, 0.07], [0.37, 0.525, 0.075], [0.51, 0.53, 0.06], [0.645, 0.52, 0.075], [0.80, 0.515, 0.08], [0.94, 0.51, 0.06]];
  TREES.forEach(([cx, by, r], i) => {
    const ry = 1.2 * r * UX / UY, a0 = i ? 138 : 180;
    line(Array.from({ length: 17 }, (_, k) => { const a = (a0 - a0 * k / 16) * PI / 180, rad = 1 + 0.13 * Math.abs(Math.sin(2.6 * a + cx * 40)); return [cx + r * rad * Math.cos(a), by + ry * rad * Math.sin(a)]; }), { sp: 1.7 });
  });
  // the fields that slope up behind them
  line([[0.0, 0.68], [0.22, 0.70], [0.45, 0.725], [0.72, 0.74], [1.0, 0.725]], { w: 0.004 });
  line([[0.04, 0.645], [0.19, 0.66], [0.33, 0.667]], { w: 0.0034 }); line([[0.50, 0.672], [0.66, 0.688], [0.80, 0.683]], { w: 0.0034 });
  // the rocky height at the top, struck in angles, the pen lifted at each peak; the rock that hangs over at its end
  const ROCK = [[0.28, 0.705], [0.40, 0.775], [0.48, 0.755], [0.58, 0.835], [0.66, 0.815], [0.75, 0.895], [0.87, 0.90], [0.955, 0.865], [0.925, 0.825], [1.0, 0.795]];
  line(ROCK.slice(0, 4), { smooth: false }); line(ROCK.slice(3, 7), { smooth: false }); line(ROCK.slice(6), { smooth: false });
  for (const r of [[[0.58, 0.835], [0.60, 0.78], [0.585, 0.745]], [[0.75, 0.895], [0.775, 0.83], [0.76, 0.78]], [[0.87, 0.90], [0.885, 0.85]], [[0.40, 0.775], [0.415, 0.74]], [[0.925, 0.825], [0.90, 0.79], [0.92, 0.755]]]) line(r, { smooth: false, w: 0.004 });

  // the shade, all of it on the side away from his window. The mound's: close strokes inside its left edge, a thinner
  // row within them and a thinner one again, crossed at its foot; on its lit side the grass, and two lines of its round
  row(MOUND, 0.03, 0.62, 24, q => 0.05 + 0.028 * Math.sin(PI * (0.1 + 0.8 * q)), 0.010);
  row(MOUND, 0.05, 0.52, 14, 0.04, 0.05);
  row(MOUND, 0.08, 0.40, 8, 0.03, 0.088);
  row(MOUND, 0.02, 0.20, 7, 0.03, 0.014, true);
  line([[0.62, 0.345], [0.76, 0.385], [0.90, 0.40]], { w: 0.0034 }); line([[0.70, 0.27], [0.83, 0.31], [0.95, 0.325]], { w: 0.0034 });
  for (const [x, y] of [[0.62, 0.22], [0.70, 0.19], [0.78, 0.25], [0.86, 0.33], [0.92, 0.12], [0.66, 0.10], [0.95, 0.24], [0.55, 0.15], [0.74, 0.06], [0.88, 0.20], [0.27, 0.08], [0.31, 0.17], [0.375, 0.255], [0.05, 0.30], [0.12, 0.36], [0.21, 0.40], [0.06, 0.42], [0.32, 0.445]]) hat(x, y, 0.012);
  // the trees', low on the left of each, and what each throws on the ground
  for (const [cx, by, r] of TREES) {
    const ry = 1.2 * r * UX / UY;
    for (let j = 0; j < 4; j++) hat(cx - r * (0.15 + 0.17 * j), by + ry * (0.70 - 0.11 * j), 0.014);
    for (let j = 0; j < 3; j++) hat(cx + r * (0.25 - 0.2 * j), by + ry * (0.42 - 0.03 * j), 0.012);
    line([[cx - r * 0.8, by - 0.006], [cx + r * 0.5, by - 0.008]], { w: 0.0034, smooth: false });
    hat(cx - r * 0.9, by - 0.004, 0.012);
  }
  // the rocks': every face that looks away from the light, and the hollow under the one that hangs over
  for (const [a, b, n] of [[ROCK[0], ROCK[1], 5], [ROCK[2], ROCK[3], 5], [ROCK[4], ROCK[5], 5]]) row([a, b], 0.12, 0.92, n, 0.03, 0.008);
  for (let i = 0; i < 3; i++) hat(0.975 - 0.02 * i, 0.80 - 0.012 * i, 0.016);
  // two clouds
  for (const [x, y, w] of [[0.22, 0.925, 0.10], [0.62, 0.955, 0.07]]) line([[x - w, y], [x - w * 0.6, y + 0.024], [x - w * 0.2, y + 0.009], [x + 0.15 * w, y + 0.034], [x + 0.55 * w, y + 0.01], [x + w, y + 0.021], [x + w * 1.1, y - 0.003]], { w: 0.0036 });
  // and, while you stay, birds
  [[0.30, 0.83], [0.37, 0.805], [0.16, 0.86], [0.46, 0.875], [0.24, 0.775], [0.42, 0.955]].forEach(([x, y], i) => line([[x - 0.015, y + 0.011], [x - 0.005, y + 0.0095], [x, y], [x + 0.007, y + 0.0105], [x + 0.019, y + 0.013]], { w: 0.0036, rest: i ? 3.0 : 1.6 }));

  // every stroke as close, evenly spaced points (a hand's small unsteadiness in the long ones), and its length in metres
  const STEP = 0.003;
  S.forEach((s, si) => {
    s.w *= LW;
    const m = s.pts.map(([x, y]) => new THREE.Vector3(x * DW, y * DH, 0));
    let len = 0; for (let i = 1; i < m.length; i++) len += m[i].distanceTo(m[i - 1]);
    const n = Math.max(2, Math.ceil(len / STEP) + 1);
    let d;
    if (s.smooth && m.length > 2) d = new THREE.CatmullRomCurve3(m, false, 'centripetal').getSpacedPoints(n - 1);
    else { const path = new THREE.CurvePath(); for (let i = 1; i < m.length; i++) path.add(new THREE.LineCurve3(m[i - 1], m[i])); d = path.getSpacedPoints(n - 1); }
    s.len = 0; for (let i = 1; i < d.length; i++) s.len += d[i].distanceTo(d[i - 1]);
    s.d = new Float32Array(d.length * 2);
    d.forEach((p, i) => {
      const k = s.hatch ? 0 : Math.sin(PI * i / (d.length - 1)), jx = 0.0011 * LW * k * Math.sin(i * 0.37 + si * 1.9), jy = 0.0011 * LW * k * Math.sin(i * 0.29 + si * 2.7 + 1);
      s.d[i * 2] = (p.x + jx) / DW; s.d[i * 2 + 1] = (p.y + jy) / DH;
    });
  });
  // what the pen does: to the pot and the sheet; a stroke; a hop to the next; back to the pot when it runs dry
  const ev = [], dips = [FIRST[0] + FIRST[1]], end = s => [s.d[s.d.length - 2], s.d[s.d.length - 1]];
  let t = FIRST[0] + FIRST[1] + FIRST[2], used = 0, last = null;
  ev.push({ k: 'first', t0: 0, t1: t, to: [S[0].d[0], S[0].d[1]] });
  S.forEach((s, i) => {
    const p0 = [s.d[0], s.d[1]];
    if (s.rest) { ev.push({ k: 'rest', t0: t, t1: t + s.rest, from: last, to: p0 }); t += s.rest; }
    else if (used > CAP) { const D = DIP[0] + DIP[1] + DIP[2]; ev.push({ k: 'dip', t0: t, t1: t + D, from: last, to: p0 }); dips.push(t + DIP[0] + DIP[1]); t += D; used = 0; }
    else if (last) { const h = Math.min(0.3, 0.035 + 0.3 * Math.hypot((p0[0] - last[0]) * DW, (p0[1] - last[1]) * DH)); ev.push({ k: 'hop', t0: t, t1: t + h, from: last, to: p0 }); t += h; }
    const dur = s.hatch ? 0.04 + s.len * 0.3 : 0.05 + s.len / s.sp;
    s.t0 = t; s.t1 = t + dur; s.wear = Math.min(1, used / CAP);
    ev.push({ k: 'stroke', t0: t, t1: t + dur, s }); t += dur; used += s.len; last = end(s);
  });
  ev.push({ k: 'rest', t0: t, t1: 1e9, from: last, to: last, done: true });
  return { S, ev, dips, total: t };
}
// How far along a stroke the pen is, a part q of its time in: a long line is drawn evenly, a hatching stroke flicked.
const along = (s, q) => (s.hatch ? 1 - Math.pow(1 - q, 1.5) : q);

// The ink of the drawing, and when each point of it is reached: two textures, made once.
function inkOf(S) {
  const n = TW * TH, ink = new Uint8Array(n), when = new Uint16Array(n).fill(65535), halo = new Float32Array(n).fill(1e9), PXM = TW / DW, HALO = 4;
  for (const s of S) {
    const N = s.d.length / 2, steps = Math.max(2, Math.ceil(s.len * PXM / 0.55)), body = s.w * PXM / 2 * (1 - 0.22 * s.wear), dark = 1 - 0.3 * s.wear * s.wear;
    for (let k = 0; k <= steps; k++) {
      const q = k / steps, f = q * (N - 1), i = Math.min(N - 2, Math.floor(f)), fr = f - i;
      const x = lerp(s.d[i * 2], s.d[i * 2 + 2], fr) * TW, y = lerp(s.d[i * 2 + 1], s.d[i * 2 + 3], fr) * TH;
      // (a line swells with the hand's pressure and lifts off fine; a hatching stroke is set down firm and flicked away)
      const r = body * (s.hatch ? 1.1 - 0.7 * q : 0.62 + 0.46 * Math.pow(Math.sin(PI * (0.06 + 0.9 * q)), 0.6));
      // (when: the inverse of how the pen runs along it)
      const tq = s.hatch ? 1 - Math.pow(1 - q, 1 / 1.5) : q, t16 = Math.min(65534, Math.round((s.t0 + (s.t1 - s.t0) * tq) / TMAX * 65535));
      const R = r + HALO, x0 = Math.max(0, Math.floor(x - R)), x1 = Math.min(TW - 1, Math.ceil(x + R)), y0 = Math.max(0, Math.floor(y - R)), y1 = Math.min(TH - 1, Math.ceil(y + R));
      for (let py = y0; py <= y1; py++) for (let px = x0; px <= x1; px++) {
        const d = Math.hypot(px + 0.5 - x, py + 0.5 - y), j = py * TW + px, v = Math.round(255 * dark * clamp01(r + 0.5 - d));
        if (v > 0) { if (v > ink[j]) { if (ink[j] < 110) when[j] = t16; ink[j] = v; } halo[j] = -1; }
        else if (d < R && halo[j] > d) { halo[j] = d; when[j] = t16; }
      }
    }
  }
  const tw = new Uint8Array(n * 2); for (let i = 0; i < n; i++) { tw[i * 2] = when[i] >> 8; tw[i * 2 + 1] = when[i] & 255; }
  const a = new THREE.DataTexture(ink, TW, TH, THREE.RedFormat); a.minFilter = THREE.LinearMipmapLinearFilter; a.magFilter = THREE.LinearFilter; a.generateMipmaps = true; a.anisotropy = 4; a.needsUpdate = true;
  const b = new THREE.DataTexture(tw, TW, TH, THREE.RGFormat); b.minFilter = THREE.NearestFilter; b.magFilter = THREE.NearestFilter; b.generateMipmaps = false; b.needsUpdate = true;
  return [a, b];
}

lifeFor(59891, {
  title: /^Portrait of a Young Artist/,
  word: 'quill',
  // (a small work hung high: the kit keeps the whole of it in view, with the floor below it out to where the shavings fall)
  stage: { out: 1.7, half: 1.25, cam: { dist: 2.5, side: 0.25, height: 1.2, fov: 54, lookU: -0.15, lookOut: 0.3, lookH: 0.9, floorOut: 0.85 } },
  wake: 2, ret: 2.4,
  linger: { near: 3.5, max: 45 },

  build(L) {
    const P = L.pal, C = (h, a = 0.06) => { const c = P.near(h, a); return `vec3(${c.r.toFixed(4)}, ${c.g.toFixed(4)}, ${c.b.toFixed(4)})`; };
    const V = this.V = { a: new THREE.Vector3(), b: new THREE.Vector3(), c: new THREE.Vector3(), x: new THREE.Vector3(), z: new THREE.Vector3(), m: new THREE.Matrix4(), m2: new THREE.Matrix4(), q: new THREE.Quaternion(), e: new THREE.Euler(), one: new THREE.Vector3(1, 1, 1) };
    this.B = new THREE.Matrix4().makeBasis(new THREE.Vector3(L.tx, 0, L.tz), new THREE.Vector3(0, 1, 0), new THREE.Vector3(L.nx, 0, L.nz)).setPosition(L.floor(0, 0));
    this.Binv = this.B.clone().invert();
    const wall = this.wall = L.wall;

    // ------------------------------------------------------------ how the sheet hangs: down the wall, out along the floor
    // (g: which way it runs at s metres from its top edge; 0 straight down, a quarter turn along the floor)
    const NPR = 513, PY = new Float32Array(NPR), PZt = new Float32Array(NPR), PG = new Float32Array(NPR);
    const heading = s => (s >= LS ? PI / 2 : G0 + (PI / 2 - G0) * Math.pow(s / LS, GP)) - 0.3 * Math.pow(Math.max(0, 1 - s / 0.05), 2);
    { let y = 0, z = 0, zmin = 0; const ds = S_END / (NPR - 1);
      for (let i = 0; i < NPR; i++) { PG[i] = heading(i * ds); PY[i] = y; PZt[i] = z; zmin = Math.min(zmin, z); const g = heading((i + 0.5) * ds); y -= Math.cos(g) * ds; z += Math.sin(g) * ds; }
      // (it keeps in front of the gallery's own wall wash, 25 mm behind the picture's plane, and above its lamp pool, 14 mm off the boards:
      // both are added light, and whatever of an opaque thing lies behind them is bleached to a hard edge)
      const dy = 0.019 - PY[NPR - 1], dz = Math.max(-wall + 0.008, -0.017) - zmin; for (let i = 0; i < NPR; i++) { PY[i] += dy; PZt[i] += dz; } }
    const prof = this.prof = (s, o) => { const f = clamp01(s / S_END) * (NPR - 1), i = Math.min(NPR - 2, Math.floor(f)), k = f - i; o.y = lerp(PY[i], PY[i + 1], k); o.z = lerp(PZt[i], PZt[i + 1], k); o.g = lerp(PG[i], PG[i + 1], k); return o; };
    const rollR = this.rollR = U => Math.sqrt(RIN * RIN + (S_TOT - U) * PITCH / PI);
    const pr = this.pr = { y: 0, z: 0, g: 0 };
    // a point of the sheet, s metres from its top edge, when U metres of it are let down (the rest is wound)
    const sheetPoint = (x, s, U, out) => {
      if (s <= U) { prof(s, pr); return out.set(x, pr.y, pr.z); }
      prof(U, pr); const Ro = rollR(U), R = Math.sqrt(Math.max(Ro * Ro - (s - U) * PITCH / PI, RIN * RIN * 0.6)), a = (Ro - R) * TAU / PITCH, c = Math.cos(pr.g), sn = Math.sin(pr.g);
      // (along it: 0, -c, sn; out of its face: 0, sn, c)
      return out.set(x, pr.y + sn * Ro + R * (-c * Math.sin(a) - sn * Math.cos(a)), pr.z + c * Ro + R * (sn * Math.sin(a) - c * Math.cos(a)));
    };
    // where the pen's point is on the sheet, for a point of the drawing (and how far it is lifted off it)
    this.paperPoint = (X, Y, lift, out) => { prof(SD0 + DH * (1 - Y), pr); return out.set(XD0 + X * DW, pr.y + Math.sin(pr.g) * lift, pr.z + Math.cos(pr.g) * lift); };
    const top = prof(0.09, { y: 0, z: 0, g: 0 }), foot = prof(LS, { y: 0, z: 0, g: 0 }), HT = top.y, ZW = top.z, ZF = foot.z;

    const parts = [];
    // ------------------------------------------------------------ the sheet (part 0)
    { const NA = 112, NB = 76, sOf = v => (v < 0.6 ? S_END * v / 0.6 : S_END + WOUND * (v - 0.6) / 0.4);
      parts.push(surf(6, NA + NB, (u, v, o) => { const s = sOf(v); sheetPoint(lerp(XS1, XS0, u), s, S_END, o.p); o.t.set(1 - u, s); }, K_PAPER, 0, 0)); }

    // ------------------------------------------------------------ the quill (part 1): its point at the origin, the shaft up y, the vane's wide side to +x
    const bend = y => -0.05 * LEN * Math.pow(y / LEN, 2.2);
    parts.push(surf(10, 44, (u, v, o) => {
      const y = LEN * Math.pow(v, 1.7), cap = y < 0.007 ? Math.sqrt(Math.max(1e-4, 1 - Math.pow(1 - y / 0.007, 2))) : 1, r = (0.0105 - 0.0076 * Math.pow(y / LEN, 0.8)) * cap, a = u * TAU, rx = r * Math.cos(a), rz = r * Math.sin(a);
      o.p.set(bend(y) + rx, y, rz); o.t.set(u, y); o.c.setRGB(rx, rz, Math.max(0, 1 - y / NIBL));
    }, K_QUILL, 1, 0));
    parts.push(surf(8, 40, (u, v, o) => {
      const ax = lerp(-1, 1, u), shape = Math.pow(Math.sin(PI * Math.pow(v, 0.5)), 0.7), across = ax * (ax > 0 ? 0.047 : 0.017) * shape, y0 = LEN * (0.30 + 0.68 * v);
      o.p.set(bend(y0) + across, y0 + Math.abs(across) * 0.8, -0.22 * Math.abs(across) + 0.003 * Math.sin(v * 31) * Math.abs(ax)); o.t.set(ax, v);
    }, K_QUILL, 1, 1));

    // ------------------------------------------------------------ the knife (part 2): the blade up y from the origin, its edge to -x, the handle below
    parts.push(surf(12, 22, (u, v, o) => {
      const a = u < 0.5 ? u * 2 : 2 - u * 2, hwid = 0.0165 * Math.pow(Math.max(0, 1 - Math.pow(v, 3.5)), 0.55), cx = 0.002 - 0.006 * Math.sin(PI * v * 0.8) + 0.010 * v * v;
      const th = 0.0022 * Math.pow(1 - a, 0.6) * Math.min(1, a / 0.05) * (1 - 0.6 * v);
      o.p.set(cx + hwid * (1 - 2 * a), BLD * v, (u < 0.5 ? 1 : -1) * th); o.t.set(a, v);
    }, K_KNIFE, 2, 0));
    parts.push(surf(12, 3, (u, v, o) => { const a = u * TAU, k = 1 + 0.12 * Math.sin(PI * v); o.p.set(0.0128 * k * Math.cos(a), lerp(-0.016, 0.005, v), 0.0085 * k * Math.sin(a)); o.t.set(u, v); }, K_KNIFE, 2, 2));
    parts.push(surf(14, 22, (u, v, o) => {
      const a = u * TAU, cap = v < 0.05 ? Math.sqrt(Math.max(1e-4, 1 - Math.pow(1 - v / 0.05, 2))) : 1, r = 0.0132 * (1 + 0.28 * Math.exp(-Math.pow((v - 0.07) / 0.08, 2)) - 0.08 * v) * cap;
      o.p.set(r * Math.cos(a), -0.016 - 0.192 * (1 - v), 0.72 * r * Math.sin(a)); o.t.set(u, 0.192 * v);
    }, K_KNIFE, 2, 1));

    // ------------------------------------------------------------ the ink pot (part 3): square, its shoulders drawn in to a round neck; the ink in it
    { const pc = curveOf([[0.050, 0, 1], [0.060, 0.004, 1], [0.062, 0.02, 1], [0.062, 0.128, 1], [0.060, 0.146, 1], [0.050, 0.159, 0.6], [0.039, 0.167, 0.2], [0.034, 0.176, 0], [0.033, 0.198, 0], [0.037, 0.206, 0], [0.039, 0.211, 0], [0.034, 0.2125, 0], [0.029, 0.205, 0]]), q = new THREE.Vector3();
      parts.push(surf(36, 30, (u, v, o) => {
        pc.getPoint(v, q); const a = u * TAU, c = Math.cos(a), s = Math.sin(a), k = Math.pow(Math.pow(Math.abs(c), 8) + Math.pow(Math.abs(s), 8), -1 / 8), r = q.x * lerp(1, k, clamp01(q.z));
        o.p.set(r * c, q.y, r * s); o.t.set(u, q.y);
      }, K_POT, 3, 0));
      parts.push(surf(16, 1, (u, v, o) => { const a = -u * TAU, r = 0.031 * v; o.p.set(r * Math.cos(a), 0.2045, r * Math.sin(a)); o.t.set(u, v); }, K_INK, 3, 1)); }

    // ------------------------------------------------------------ its stopper (part 4), lying by it: a dark plug, and the gold ring it is drawn by
    { const sc = curveOf([[0.001, 0], [0.020, 0.0], [0.023, 0.004], [0.029, 0.05], [0.036, 0.052], [0.038, 0.062], [0.034, 0.072], [0.001, 0.076]]), q = new THREE.Vector3();
      parts.push(surf(16, 18, (u, v, o) => { sc.getPoint(v, q); const a = u * TAU; o.p.set(q.x * Math.cos(a), q.y, q.x * Math.sin(a)); o.t.set(u, v); }, K_STOP, 4, 0));
      parts.push(surf(16, 6, (u, v, o) => { const a = u * TAU, b = v * TAU, R = 0.015 + 0.0034 * Math.cos(b); o.p.set(R * Math.cos(a), 0.088 + R * Math.sin(a), 0.0034 * Math.sin(b)); o.t.set(u, v); }, K_STOP, 4, 1)); }

    // ------------------------------------------------------------ three shavings (parts 5, 6, 7: wound in the shader) and a drop of ink (part 8)
    for (let i = 0; i < 3; i++) parts.push(surf(2, 40, (u, v, o) => { o.p.set(0, v * 0.01, (u - 0.5) * CW); o.t.set(u, v); }, K_CURL, 5 + i, 0));
    parts.push(surf(10, 6, (u, v, o) => { const a = u * TAU, b = (v - 0.5) * PI; o.p.set(0.008 * Math.cos(b) * Math.cos(a), 0.0095 * Math.sin(b), 0.008 * Math.cos(b) * Math.sin(a)); o.t.set(u, v); }, K_INK, 8, 0));

    // ------------------------------------------------------------ the drawing
    const pl = this.plan = plan(); [this.inkTex, this.whenTex] = inkOf(pl.S);

    // ------------------------------------------------------------ his paint on them: one material, one draw call
    const M = this.M = Array.from({ length: NP }, () => new THREE.Matrix4()), F = this.F = new Float32Array(NP), G = this.G = [0, 0, 0];
    const u = this.u = {
      uInv: { value: this.Binv }, uM: { value: M }, uF: { value: F }, uG: { value: G }, uU: { value: U0 }, uPU: { value: new THREE.Vector3() }, uCut: { value: 0 }, uNib: { value: 0 },
      uDraw: { value: -1 }, uInk: { value: this.inkTex }, uWhen: { value: this.whenTex },
      uQa: { value: new THREE.Vector3() }, uQb: { value: new THREE.Vector3() }, uQv0: { value: new THREE.Vector3() }, uQv1: { value: new THREE.Vector3() }, uKa: { value: new THREE.Vector3() }, uKb: { value: new THREE.Vector3() },
      uSh: { value: new THREE.Vector4() }, uCs: { value: [new THREE.Vector4(), new THREE.Vector4(), new THREE.Vector4()] }, uRl: { value: new THREE.Vector4() },
    };
    const SHARED = /* glsl */`
uniform vec3 uQa, uQb, uQv0, uQv1, uKa, uKb; uniform vec4 uSh, uRl; uniform vec4 uCs[3];
const vec3 Lk = ${v3g(SUN)};${NOISE}
// the shade a rod (a to b, r thick) throws at p: soft, softer the farther it falls
float cap(vec3 p, vec3 a, vec3 b, float r) {
  vec3 pa = a - p, pb = b - p; float ta = dot(pa, Lk), tb = dot(pb, Lk);
  vec3 a2 = pa - Lk * ta, d = (pb - Lk * tb) - a2;
  float h = clamp(-dot(a2, d) / max(dot(d, d), 1.0e-7), 0.0, 1.0), t = mix(ta, tb, h), dist = length(a2 + d * h), pen = 0.004 + 0.15 * max(t, 0.0);
  return (1.0 - smoothstep(r - pen * 0.3, r + pen, dist)) * smoothstep(0.0, 0.02, t) / (1.0 + 1.1 * max(t, 0.0));
}
// the shade of the sheet's slope (taken as flat, from its foot to its top), as far as it is let down
float sheetShade(vec3 p) {
  float k = ${f3((ZF - ZW) / HT)}, g = p.z - (${f3(ZF)} - k * p.y), t = -g / (Lk.z + k * Lk.y);
  if (t <= 0.0) return 0.0;
  vec3 h = p + Lk * t; float pen = 0.01 + 0.18 * t;
  return smoothstep(${f3(XS0)} - pen, ${f3(XS0)} + pen * 0.3, h.x) * (1.0 - smoothstep(${f3(XS1)} - pen * 0.3, ${f3(XS1)} + pen, h.x))
    * smoothstep(uRl.w - pen, uRl.w + pen * 0.3, h.y) * (1.0 - smoothstep(${f3(HT)} - pen * 0.3, ${f3(HT)} + pen, h.y)) / (1.0 + 1.2 * t);
}
float shadeAll(vec3 p, int kind) {
  float s = 0.0;
  if (kind != ${K_QUILL}) { s = max(s, uSh.x * 0.78 * cap(p, uQa, uQb, 0.006)); s = max(s, uSh.x * 0.6 * cap(p, uQv0, uQv1, 0.026)); }
  if (kind != ${K_KNIFE}) s = max(s, uSh.y * 0.7 * cap(p, uKa, uKb, 0.012));
  if (kind != ${K_POT}) s = max(s, uSh.z * 0.8 * cap(p, vec3(${f3(PX)}, 0.0, ${f3(PZ)}), vec3(${f3(PX)}, ${f3(0.16 * PS)}, ${f3(PZ)}), ${f3(0.07 * PS)}));
  if (kind != ${K_STOP}) s = max(s, uSh.z * 0.65 * cap(p, vec3(${f3(STX - 0.05)}, 0.04, ${f3(STZ)}), vec3(${f3(STX + 0.05)}, 0.04, ${f3(STZ)}), 0.04));
  if (kind != ${K_CURL}) for (int i = 0; i < 3; i++) s = max(s, uCs[i].w * 0.6 * cap(p, uCs[i].xyz - vec3(0.0, 0.0, 0.01), uCs[i].xyz + vec3(0.0, 0.0, 0.01), 0.024));
  s = max(s, uSh.w * 0.45 * cap(p, vec3(${f3(XS0)}, uRl.x, uRl.y), vec3(${f3(XS1)}, uRl.x, uRl.y), uRl.z));
  if (kind != ${K_PAPER}) s = max(s, uSh.w * 0.75 * sheetShade(p));
  return s;
}`;
    const tm = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, fog: false });
    tm.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, u);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', `#include <common>
attribute vec3 aK; attribute vec2 aUv; uniform mat4 uM[${NP}]; uniform float uG[3]; uniform float uU, uCut; uniform vec3 uPU;
varying vec3 vK, vLP, vN; varying vec2 vUv2; varying float vRoll;`)
        .replace('#include <begin_vertex>', `vec3 transformed = vec3(position); vec3 ln = normal; vRoll = 0.0;
  int kd = int(aK.x + 0.5), prt = int(aK.y + 0.5);
  if (kd == ${K_PAPER}) {
    // what is not yet let down is wound in the roll, which sits on the sheet where the sheet ends
    float s = aUv.y;
    if (s > uU) {
      float Ro = sqrt(${(RIN * RIN).toFixed(7)} + (${f3(S_TOT)} - uU) * ${(PITCH / PI).toFixed(6)}), R = sqrt(max(Ro * Ro - (s - uU) * ${(PITCH / PI).toFixed(6)}, ${(RIN * RIN * 0.6).toFixed(7)})), a = (Ro - R) * ${(TAU / PITCH).toFixed(3)};
      vec3 tt = vec3(0.0, -cos(uPU.z), sin(uPU.z)), nn = vec3(0.0, sin(uPU.z), cos(uPU.z));
      transformed = vec3(position.x, uPU.x, uPU.y) + nn * Ro + R * (tt * sin(a) - nn * cos(a));
      ln = nn * cos(a) - tt * sin(a); vRoll = 1.0;
    }
  } else if (kd == ${K_QUILL}) {
    // the pen's point, as far as it is cut: drawn in to a point, flatter on one side
    float w = color.b;
    if (w > 0.0) { float kk = 0.5 * clamp(uCut, 0.0, 2.0), sc = mix(1.0, mix(0.13, 1.0, pow(1.0 - w, 1.7)), kk); transformed.x = color.r * sc; transformed.z = color.g * sc * mix(1.0, 0.6, kk * w); }
  } else if (kd == ${K_CURL}) {
    // a shaving: as much of it as is cut, curling in on itself from the blade
    float a = max(uG[prt - 5] - aUv.y, 0.0) * 13.0, r = ${f3(RHO)} * exp(-0.09 * a);
    transformed = vec3(-r * sin(a), ${f3(RHO)} - r * cos(a), (aUv.x - 0.5) * ${f3(CW)} + 0.0021 * a);
    ln = vec3(-sin(a), -cos(a), 0.0);
  }
  mat4 Mp = uM[prt];
  transformed = (Mp * vec4(transformed, 1.0)).xyz; ln = normalize(mat3(Mp) * ln);
  vK = aK; vUv2 = aUv; vLP = transformed; vN = ln;`);
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
uniform mat4 uInv; uniform sampler2D uInk, uWhen; uniform float uF[${NP}]; uniform float uDraw, uCut, uNib;
varying vec3 vK, vLP, vN; varying vec2 vUv2; varying float vRoll;${SHARED}`)
        .replace('#include <opaque_fragment>', `{
  int kind = int(vK.x + 0.5), prt = int(vK.y + 0.5), sub = int(vK.z + 0.5);
  float fade = uF[prt];
  if (fade < 0.999 && mH(gl_FragCoord.xy * 0.37 + 0.11) >= fade) discard;
  if (vLP.z < ${f3(-wall)}) discard;
  vec3 eye = (uInv * vec4(cameraPosition, 1.0)).xyz, Vd = normalize(eye - vLP);
  vec3 N0 = normalize(vN); bool front = dot(N0, Vd) >= 0.0; vec3 N = front ? N0 : -N0;
  vec3 Hh = normalize(Lk + Vd); float nl = dot(N, Lk), spec = max(dot(N, Hh), 0.0);
  vec3 c = vec3(0.5);
  // (the sheet's drawing is looked up here, outside any branch, so its smaller copies are chosen rightly)
  vec2 dq = vec2((${f3(XS0 - XD0)} + vUv2.x * ${f3(SW)}) / ${f3(DW)}, 1.0 - (vUv2.y - ${f3(SD0)}) / ${f3(DH)});
  float inkv = texture2D(uInk, dq).r; vec2 wq = texture2D(uWhen, dq).rg;
  if (kind == ${K_PAPER}) {
    // paper: a cool white in his light, a warm grey turned from it; laid lines; the drawing on its face
    float lam = smoothstep(-0.3, 0.85, nl), fib = mN(vec2(vUv2.x * ${f3(SW)}, vUv2.y) * 300.0), cl = mN(vec2(vUv2.x * 5.0, vUv2.y * 3.3));
    c = mix(${C('#7d7663')}, ${C('#ece8dc')}, lam); c *= 0.97 + 0.03 * fib + 0.05 * (cl - 0.5);
    if (!front) c *= vec3(0.93, 0.915, 0.87);
    else if (vRoll < 0.5 && dq.x > 0.0 && dq.x < 1.0 && dq.y > 0.0 && dq.y < 1.0) {
      float when = (wq.r * 65280.0 + wq.g * 255.0) / 65535.0 * ${f3(TMAX)}, on = step(when, uDraw), wet = 1.0 - smoothstep(0.0, 0.9, uDraw - when);
      vec3 ic = mix(${C('#2e2014')}, ${C('#0d0a08')}, wet) * (0.6 + 0.4 * lam);
      c = mix(c, ic, 0.95 * inkv * on); c += vec3(0.5) * wet * inkv * on * pow(spec, 26.0);
    }
    float ex = min(vUv2.x, 1.0 - vUv2.x) * ${f3(SW)}; c *= 1.0 - 0.16 * smoothstep(0.004, 0.0, ex);
  } else if (kind == ${K_QUILL}) {
    if (sub == 0) {
      // the shaft: horn-white, a thread of light down it; the cut point darker, and black once it has been in the ink
      float y = vUv2.y, tone = smoothstep(-0.55, 0.8, nl);
      c = mix(${C('#857c62')}, ${C('#e6e2d0')}, tone); c = mix(c, vec3(1.0), 0.55 * smoothstep(0.55, 0.95, pow(spec, 30.0)));
      c *= 1.0 - 0.3 * clamp(uCut * 0.5, 0.0, 1.0) * smoothstep(${f3(NIBL)}, 0.0, y);
      c = mix(c, ${C('#0f0b08')}, 0.92 * uNib * smoothstep(0.05, 0.02, y));
    } else {
      // the vane: white, trimmed slim, its barbs fine lines slanting to the tip, split in two or three places, looser at its foot
      float ax = vUv2.x, al = vUv2.y, ab = abs(ax), side = ax > 0.0 ? 1.0 : 0.0, run = al - 0.07 * ab;
      if (side > 0.5 && ((ab > 0.35 && abs(run - 0.30) < 0.011 * (ab - 0.35) / 0.65) || (ab > 0.5 && abs(run - 0.61) < 0.009 * (ab - 0.5) / 0.5))) discard;
      if (side < 0.5 && ab > 0.4 && abs(run - 0.47) < 0.010 * (ab - 0.4) / 0.6) discard;
      if (al < 0.07 && mN(vec2(al * 420.0 + ab * 30.0, side + 2.0)) > 0.42 + 8.0 * al) discard;
      float barb = mN(vec2(run * 560.0, side * 3.0 + 0.5)), tone = 0.45 + 0.55 * smoothstep(-0.3, 0.7, nl);
      c = mix(${C('#8b877a')}, ${C('#f0eee4')}, tone); c *= 0.83 + 0.21 * barb;
      c *= 1.0 - 0.3 * smoothstep(0.16, 0.0, ab) * (0.5 + 0.5 * side);
      c *= 1.0 - 0.16 * smoothstep(0.5, 1.0, ab);
    }
  } else if (kind == ${K_KNIFE}) {
    if (sub == 0) {
      // the blade: grey steel, ground to its edge; a thread of light along the edge, a soft one down its face
      float a = vUv2.x, v = vUv2.y, tone = smoothstep(-0.2, 0.9, nl + 0.25 * (mN(vec2(a * 3.0, v * 14.0)) - 0.5));
      c = mix(${C('#3d4042')}, ${C('#8c9092')}, tone); c = mix(c, ${C('#d9dcda', 0.03)}, 0.7 * smoothstep(0.2, 0.9, pow(spec, 22.0)));
      c *= 1.0 - 0.28 * smoothstep(0.6, 0.68, a) * smoothstep(0.8, 0.72, a);
      c = mix(c, ${C('#e4e6e2', 0.03)}, 0.8 * smoothstep(0.84, 0.97, a));
    } else if (sub == 1) {
      // the handle: bone, turned in ribs
      float rib = sin(vUv2.y * 310.0), tone = smoothstep(-0.45, 0.85, nl) * (0.74 + 0.26 * smoothstep(-0.7, 0.7, rib));
      c = mix(${C('#7d7050')}, ${C('#e9e2c6')}, tone); c *= 1.0 - 0.4 * smoothstep(-0.72, -1.0, rib);
      c = mix(c, vec3(1.0, 0.98, 0.92), 0.4 * smoothstep(0.4, 0.95, pow(spec, 26.0)) * smoothstep(-0.2, 0.6, rib));
    } else { float tone = smoothstep(-0.4, 0.85, nl); c = mix(${C('#2c2e30')}, ${C('#9a9d9c')}, tone); c = mix(c, vec3(0.9), 0.5 * smoothstep(0.4, 0.95, pow(spec, 30.0))); }
  } else if (kind == ${K_POT}) {
    // the ink pot: glazed ochre, a round boss low on the face to the light, the neck black, and the ink run down from it
    float y = vUv2.y, uu = vUv2.x, tone = smoothstep(-0.4, 0.85, nl + 0.14 * (mN(vUv2 * vec2(38.0, 60.0)) - 0.5));
    c = mix(${C('#3a2d16')}, ${C('#86693a')}, smoothstep(0.0, 0.55, tone)); c = mix(c, ${C('#a98f5c')}, smoothstep(0.55, 1.0, tone));
    float fu = fract(uu + 0.125), u4 = fract(fu * 4.0) - 0.5, face = floor(fu * 4.0);
    vec2 bq = vec2(u4 * 0.124, y - 0.05); float bd = length(bq);
    if (face < 0.5) { c *= 1.0 + 0.35 * smoothstep(0.024, 0.016, bd) * (0.3 + (bq.x * 0.4 + bq.y) / 0.024); c *= 1.0 - 0.45 * smoothstep(0.0035, 0.0, abs(bd - 0.0235)); }
    float lane = uu * 15.0 + 0.5 * mN(vec2(y * 26.0, 1.0)), dn = mH(vec2(floor(lane), 3.0)), dxm = abs(fract(lane) - 0.5) * 0.033;
    float reach = 0.152 - 0.07 * dn * dn * dn, rw = (0.0035 + 0.0055 * dn) * (1.0 + 0.5 * smoothstep(reach + 0.022, reach, y));
    float dd = length(vec2(dxm, max(reach - y, 0.0))) - rw, drip = (1.0 - smoothstep(-0.0012, 0.0012, dd)) * step(0.42, dn);
    float blk = max(smoothstep(0.146 + 0.008 * mN(vec2(uu * 40.0, 2.0)), 0.158, y), drip);
    c = mix(c, ${C('#0f0b08')} * (0.6 + 1.2 * tone), blk);
    c += vec3(0.62, 0.56, 0.4) * 0.3 * smoothstep(0.3, 0.95, pow(spec, 28.0)) * (0.5 + 0.5 * blk);
    c *= 1.0 - 0.35 * smoothstep(0.02, 0.0, y);
  } else if (kind == ${K_STOP}) {
    float tone = smoothstep(-0.4, 0.85, nl);
    if (sub == 0) { c = mix(${C('#0e0a08')}, ${C('#3f3024')}, tone); c += vec3(0.3) * smoothstep(0.4, 0.95, pow(spec, 24.0)); }
    else { c = mix(${C('#5d4310')}, ${C('#c9a03a')}, tone); c = mix(c, ${C('#f4e29a', 0.03)}, 0.7 * smoothstep(0.3, 0.9, pow(spec, 20.0))); }
  } else if (kind == ${K_CURL}) {
    // a shaving: thin horn, the light through it
    float tone = max(smoothstep(-0.4, 0.8, nl), 0.45); c = mix(${C('#978b6c')}, ${C('#efe9d2')}, tone);
    c *= 1.0 - 0.2 * smoothstep(0.35, 0.5, abs(vUv2.x - 0.5));
  } else {
    // ink: black, with the window in it
    c = ${C('#0f0b08')} * (0.5 + 0.7 * smoothstep(-0.2, 0.8, nl)) + vec3(0.55) * smoothstep(0.5, 0.95, pow(spec, 40.0));
  }
  float shd = shadeAll(vLP, kind);
  c = mix(c, c * ${C('#3a2c1e', 0)} * 1.3, shd);
  outgoingLight = c * ${KEY.toFixed(2)};
}
#include <opaque_fragment>`);
    };
    tm.customProgramCacheKey = () => 'south-german-quill-' + wall.toFixed(4);
    this.things = new THREE.Mesh(merge(parts), tm); this.things.name = 'sheet-quill-knife-pot';
    this.things.frustumCulled = false; this.things.matrixAutoUpdate = false; this.things.matrix.copy(this.B); this.things.matrixWorldNeedsUpdate = true;
    L.add(this.things);

    // ------------------------------------------------------------ the shade they throw on the boards and the wall
    const R = L.room; let left = 1.2, right = 0.95, deep = 1.35;      // (no wider than it must be: every pixel of it is checked against every picture in the room)
    if (R) {
      const a = Math.abs(L.tx) > 0.5 ? [(R.x0 - L.cx) * L.tx, (R.x1 - L.cx) * L.tx] : [(R.z0 - L.cz) * L.tz, (R.z1 - L.cz) * L.tz];
      left = Math.min(left, -Math.min(a[0], a[1]) - 0.08); right = Math.min(right, Math.max(a[0], a[1]) - 0.08);
      deep = Math.min(deep, (Math.abs(L.nx) > 0.5 ? Math.max((R.x0 - L.cx) * L.nx, (R.x1 - L.cx) * L.nx) : Math.max((R.z0 - L.cz) * L.nz, (R.z1 - L.cz) * L.nz)) - 0.05);
    }
    const soft = [surf(1, 1, (uu, vv, o) => o.p.set(lerp(-left, right, uu), 0.006, lerp(deep, -wall + 0.01, vv)), 1), surf(1, 1, (uu, vv, o) => o.p.set(lerp(-left, right, uu), lerp(0.012, 1.2, vv), -wall + 0.005), 0)];
    const gm = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide, forceSinglePass: true });
    gm.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, u);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', `#include <common>
varying vec3 vOP;`).replace('#include <begin_vertex>', `vec3 transformed = vec3(position); vOP = position;`);
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
varying vec3 vOP;${SHARED}
float gA;`)
        .replace('#include <color_fragment>', `#include <color_fragment>
  gA = 0.8 * shadeAll(vOP, -1);`)
        .replace('#include <opaque_fragment>', `  outgoingLight = ${C('#0a0705', 0)}; diffuseColor.a = gA;\n#include <opaque_fragment>`);
    };
    gm.customProgramCacheKey = () => 'south-german-quill-shade-' + wall.toFixed(4);
    this.soft = new THREE.Mesh(merge(soft), gm); this.soft.name = 'shade';
    this.soft.frustumCulled = false; this.soft.matrixAutoUpdate = false; this.soft.matrix.copy(this.B); this.soft.matrixWorldNeedsUpdate = true; this.soft.renderOrder = 9;
    L.add(this.soft);

    // ------------------------------------------------------------ the sounds, on the show's clock: the tools', and no music
    const s = this.sc = score(L);
    s.hit(T_FALL[0] + 0.05, { d: 1.0, vol: 0.006, bp: 900, q: 0.7, attack: 0.4 });                                   // the feather, falling
    s.note(T_POT[1] - 0.02, 104, 0.16, { type: 'sine', vol: 0.03, to: 70, attack: 0.005 });                           // the pot set down, and its stopper
    s.hit(T_POT[1] + 0.13, { d: 0.035, vol: 0.008, hp: 2600 });
    s.hit(T_P1[0], { d: T_P1[1] - T_P1[0] + 0.04, vol: 0.02, bp: 3000, q: 1.6, attack: 0.3 });                        // the knife through the quill, twice
    s.hit(T_P2[0], { d: T_P2[1] - T_P2[0] + 0.04, vol: 0.02, bp: 3500, q: 1.6, attack: 0.28 });
    s.hit(T_P1[1] + 0.45, { d: 0.03, vol: 0.005, hp: 4200 }); s.hit(T_P2[1] + 0.45, { d: 0.03, vol: 0.005, hp: 4600 });   // a shaving on the boards
    s.hit(T_SNICK, { d: 0.05, vol: 0.04, hp: 3600, attack: 0.001 });                                                  // the tip, cut
    s.note(T_SNICK, 1850, 0.07, { type: 'triangle', vol: 0.012, to: 1250, attack: 0.002 });
    s.hit(T_ROLL[0] + 0.1, { d: 1.0, vol: 0.02, lp: 520, attack: 0.35 });                                             // the sheet, let down
    s.hit(T_ROLL[1] - 0.04, { d: 0.14, vol: 0.014, bp: 700, q: 0.8 });
    for (const d of pl.dips) { s.note(T_PEN + d - 0.16, 1480, 0.05, { type: 'sine', vol: 0.008, attack: 0.002 }); s.note(T_PEN + d + 0.22, 880, 0.07, { type: 'sine', vol: 0.006, to: 1320, attack: 0.004 }); }      // the quill on the pot's lip; the drop
    let k = 0;
    for (const e of pl.ev) if (e.k === 'stroke') { const d = e.t1 - e.t0; k++; s.hit(T_PEN + e.t0, { d: Math.max(0.05, d), vol: e.s.hatch ? 0.006 : 0.009, bp: 2500 + 1300 * ((k * 0.618) % 1), q: 2.4, attack: Math.min(0.05, d * 0.3) }); }      // the pen on the paper
    s.done();

    this.pen = { X: 0, Y: 0, lift: 0, pot: 0, cut: 0, dip: 0, arc: 0, rest: 0 };
    this.Q = { p: new THREE.Vector3(), d: new THREE.Vector3(), sc: 1 }; this.K = { p: new THREE.Vector3(), rz: 0, sc: 1 };
    this.cutMid = CN.clone().addScaledVector(D_CUT, LEN / 2); this.eMid = E_OUT.clone();
    this.lin = 0; this.at = 0; this.U = U0; this.arr = 0; this.hide();
  },

  // ---------------------------------------------------------------- the pen, by the drawing's clock
  // At td seconds: where on the drawing it is (X, Y), how far off the sheet, how far it has gone to the pot or is still
  // where it was cut.
  penAt(td, o) {
    const ev = this.plan.ev;
    o.lift = 0; o.pot = 0; o.cut = 0; o.dip = 0; o.arc = 0; o.rest = 0;
    if (td <= 0) { o.cut = 1; o.pot = 1; o.X = ev[0].to[0]; o.Y = ev[0].to[1]; return o; }
    let a = 0, b = ev.length - 1; while (a < b) { const m = (a + b + 1) >> 1; if (ev[m].t0 <= td) a = m; else b = m - 1; }
    const e = ev[a], q = clamp01((td - e.t0) / (e.t1 - e.t0)), x = td - e.t0;
    if (e.k === 'first') {
      const [A, Bq, Cq] = FIRST, k1 = ease.inOut(clamp01(x / A)), k3 = ease.inOut(clamp01((x - A - Bq) / Cq));
      o.cut = 1 - k1; o.pot = 1 - k3; o.dip = hump(x, A, A + Bq); o.arc = 0.07 * Math.sin(PI * k1) + 0.05 * Math.sin(PI * k3); o.X = e.to[0]; o.Y = e.to[1]; o.lift = 0.02 * (1 - k3);
    } else if (e.k === 'stroke') {
      const s = e.s, N = s.d.length / 2, f = along(s, q) * (N - 1), i = Math.min(N - 2, Math.floor(f)), fr = f - i;
      o.X = lerp(s.d[i * 2], s.d[i * 2 + 2], fr); o.Y = lerp(s.d[i * 2 + 1], s.d[i * 2 + 3], fr);
    } else if (e.k === 'hop') {
      const k = ease.inOut(q); o.X = lerp(e.from[0], e.to[0], k); o.Y = lerp(e.from[1], e.to[1], k); o.lift = 0.006 + 0.012 * Math.sin(PI * q);
    } else if (e.k === 'dip') {
      const [A, Bq, Cq] = DIP, k1 = ease.inOut(clamp01(x / A)), k3 = ease.inOut(clamp01((x - A - Bq) / Cq)), there = x < A + Bq;
      o.pot = there ? k1 : 1 - k3; o.dip = hump(x, A, A + Bq); o.arc = 0.05 * Math.sin(PI * (there ? k1 : k3)); o.X = (there ? e.from : e.to)[0]; o.Y = (there ? e.from : e.to)[1]; o.lift = 0.02 * o.pot;
    } else {
      // at rest: held a little off the sheet (and brought over to where the next thing goes, at the end)
      const up = ease.smooth(clamp01(x / 0.5)), k = e.done ? 0 : ease.inOut(clamp01((x - (e.t1 - e.t0) + 0.6) / 0.6));
      o.X = lerp(e.from[0], e.to[0], k); o.Y = lerp(e.from[1], e.to[1], k); o.lift = 0.035 * up * (e.done ? 1 : 1 - k * 0.8); o.rest = up * (1 - k);
    }
    return o;
  },
  // The pen's point and the way the shaft stands, in the stage's frame, at td.
  nibAt(td, p, d) {
    const o = this.penAt(td, this.pen), V = this.V;
    this.paperPoint(o.X, o.Y, o.lift + 0.0015, p);
    if (o.pot > 0) p.lerp(V.c.set(PX, lerp(0.262, 0.178, o.dip) * PS, PZ), o.pot);
    p.y += o.arc;
    if (o.cut > 0) p.lerp(CN, o.cut);
    d.copy(D_PAPER).lerp(D_POT, o.pot).lerp(D_CUT, o.cut).normalize();
    return o;
  },

  // ---------------------------------------------------------------- everything, by the show's clock
  pose(t, calm) {
    const V = this.V, Q = this.Q, K = this.K, F = this.F, M = this.M, G = this.G, u = this.u, k = calm ? 0.5 : 1, td = t - T_PEN;
    F.fill(0);
    // ---- the quill
    if (td <= 0) {
      const q = ramp(t, T_FALL[0], T_FALL[1]), e = ease.inOut(q), ph = q * TAU * 1.25, left = 1 - q, settle = 1 - ramp(t, T_PEN - 0.3, T_PEN);
      Q.sc = lerp(0.3, 1, ease.out(q));
      V.a.lerpVectors(this.eMid, this.cutMid, e); V.a.x += 0.2 * k * Math.sin(ph) * left; V.a.y += 0.03 * k * Math.cos(2 * ph) * left * Math.min(1, q * 4);
      let th = 0.05 + 0.5 * k * Math.cos(ph) * left * Math.min(1, q * 5);
      if (t > T_FALL[1]) V.a.y += 0.004 * settle * Math.sin(1.9 * (t - T_FALL[1]));
      const push = hump(t, T_P1[0], T_P1[1] + 0.1) + hump(t, T_P2[0], T_P2[1] + 0.1); V.a.x -= 0.009 * push; th -= 0.02 * push;
      const sn = t - T_SNICK; if (sn > 0 && !calm) th += 0.06 * settle * Math.exp(-5 * sn) * Math.sin(24 * sn);
      Q.d.set(Math.cos(th), Math.sin(th), 0.04).normalize(); Q.p.copy(V.a).addScaledVector(Q.d, -LEN * Q.sc / 2);
      F[1] = ramp(t, T_FALL[0], T_FALL[0] + 0.25);
    } else {
      const o = this.nibAt(td - 0.07, V.b, V.x); this.nibAt(td, Q.p, Q.d);
      // (the feather comes after the point: it leans back from the way the point is going, and sways when the pen rests)
      V.b.sub(Q.p).multiplyScalar(1 / 0.07); const sp = V.b.length(); if (sp > 1.2) V.b.multiplyScalar(1.2 / sp);
      Q.d.addScaledVector(V.b, calm ? 0.1 : 0.22);
      const r = this.pen.rest; Q.d.x += 0.035 * r * Math.sin(1.3 * td); Q.d.z += 0.025 * r * Math.sin(0.9 * td + 1);
      Q.d.normalize(); Q.sc = 1; F[1] = 1; void o;
    }
    u.uCut.value = ease.smooth(ramp(t, T_P1[0], T_P1[1])) + ease.smooth(ramp(t, T_P2[0], T_P2[1])) + ramp(t, T_SNICK, T_SNICK + 0.05);
    u.uNib.value = ramp(td, FIRST[0] + 0.1, FIRST[0] + 0.3);
    u.uDraw.value = td;

    // ---- the knife: down from the picture, two long cuts, the tip, and back
    {
      const kin = ease.inOut(ramp(t, T_KIN[0], T_KIN[1])), kout = ease.inOut(ramp(t, T_KOUT[0], T_KOUT[1]));
      const back = ease.inOut(ramp(t, T_P1[1] + 0.03, T_P2[0] - 0.03)), tip = ease.inOut(ramp(t, T_P2[1] + 0.03, T_TIP[1])), sn = ease.out(ramp(t, T_SNICK - 0.012, T_SNICK + 0.05));
      let off = lerp(0.21, 0.04, Math.pow(ramp(t, T_P1[0], T_P1[1]), 1.8)); off = lerp(off, 0.20, back); off = lerp(off, 0.032, Math.pow(ramp(t, T_P2[0], T_P2[1]), 1.8)); off = lerp(off, 0.015, tip);
      K.p.set(CN.x + off, CN.y - 0.085 + 0.008 * back + 0.032 * tip + 0.008 * ramp(t, T_TIP[1], T_SNICK - 0.02) - 0.06 * sn, CN.z + 0.014 + 0.02 * Math.sin(PI * back));
      K.rz = lerp(0.22, 0.06, tip); K.sc = KS;
      if (kin < 1) { K.p.lerpVectors(E_OUT, V.a.copy(K.p), kin); K.sc = lerp(0.35, KS, kin); K.rz = lerp(-0.5, K.rz, kin); }
      if (kout > 0) { K.p.lerp(E_OUT, kout); K.sc = lerp(KS, 0.35, kout); K.rz = lerp(K.rz, -0.3, kout); }
      F[2] = ramp(t, T_KIN[0], T_KIN[0] + 0.22) * (1 - ramp(t, T_KOUT[1] - 0.22, T_KOUT[1]));
    }
    // ---- the shavings: each grows at the blade, springs away, falls, and rocks on the boards; the tip's chip flies
    const C = this.u.uCs.value;
    for (let i = 0; i < 2; i++) {
      const T = i ? T_P2 : T_P1, g = ramp(t, T[0], T[1]), x = t - T[1];
      const off = lerp(i ? 0.20 : 0.21, i ? 0.032 : 0.04, Math.pow(g, 1.8)), ax = CN.x + off - 0.02, ay = CN.y - 0.008 + (i ? 0.006 : 0), az = CN.z + 0.004;
      G[i] = ease.out(g) * (i ? 0.9 : 1); F[5 + i] = t >= T[0] ? 1 : 0;
      let cx = ax, cy = ay - RHO, cz = az, th = 0, yaw = 0;
      if (x > 0) {
        const fall = Math.sqrt(2 * (cy - RHO - 0.002) / 4), land = Math.max(0, x - fall), f = Math.min(x, fall);
        cy = Math.max(RHO + 0.002, cy - 2 * f * f) + (land > 0 ? 0.022 * Math.abs(Math.sin(PI * land / 0.2)) * Math.exp(-land * 8) : 0);
        const run = 1 - Math.exp(-x * 2.2), rock = land > 0 ? 0.6 * k * Math.exp(-land * 2.6) * Math.sin(8 * land) : 0;
        cx += (i ? 0.05 : -0.06) * run - RHO * rock; cz += (i ? 0.13 : 0.07) * run; th = (i ? -1 : 1) * 2.6 * k * f + rock + 0.5 * ease.out(clamp01(x * 12)) * (i ? -1 : 1); yaw = (i ? -0.45 : 0.4) * run;
      }
      V.m.makeTranslation(cx, cy, cz).multiply(V.m2.makeRotationFromEuler(V.e.set(PI, yaw, th, 'YZX'))).multiply(V.m2.makeTranslation(0, -RHO, 0)); M[5 + i].copy(V.m);
      C[i].set(cx, cy, cz, G[i]);
    }
    {
      const x = t - T_SNICK; G[2] = 0.17; F[7] = x >= 0 ? 1 : 0;
      const land = (0.58 + Math.sqrt(0.58 * 0.58 + 8 * (CN.y - 0.012))) / 4, f = Math.min(Math.max(x, 0), land), cy = Math.max(0.012, CN.y + 0.58 * f - 2 * f * f), cx = CN.x - 0.36 * f - 0.02 * (1 - Math.exp(-Math.max(0, x - land) * 5)), cz = CN.z + 0.2 * f;
      V.m.makeTranslation(cx, cy, cz).multiply(V.m2.makeRotationFromEuler(V.e.set(1.2 + 9 * k * f, 0.4, 5 * k * f, 'YZX'))).multiply(V.m2.makeTranslation(0, -0.006, 0)); M[7].copy(V.m);
      C[2].set(cx, cy, cz, 0.35 * F[7]);
    }
    // ---- the ink pot and its stopper, set down
    {
      const a = ease.in(ramp(t, T_POT[0], T_POT[1])), b = ease.in(ramp(t, T_POT[0] + 0.13, T_POT[1] + 0.13)), since = t - T_POT[1] - 0.13;
      F[3] = ramp(t, T_POT[0], T_POT[0] + 0.25); F[4] = ramp(t, T_POT[0] + 0.13, T_POT[0] + 0.38);
      M[3].makeRotationY(POT_YAW).scale(V.a.setScalar(PS)).setPosition(PX, 0.14 * (1 - a), PZ);
      const rock = since > 0 && !calm ? 0.16 * Math.exp(-since * 4) * Math.sin(since * 11) : 0;
      M[4].makeRotationFromEuler(V.e.set(rock, 0.5, PI / 2 + 0.07, 'YXZ')).scale(V.a.setScalar(PS)).setPosition(STX + 0.036 * PS, 0.037 * PS + 0.12 * (1 - b), STZ);
    }
    // ---- the sheet, let down the wall and out along the floor
    {
      const q = ramp(t, T_ROLL[0] + 0.38, T_ROLL[1]), e = 1 - Math.pow(1 - Math.pow(q, 1.5), 1.6), x = t - T_ROLL[1];
      this.U = U0 + (S_END - U0) * e - (x > 0 && !calm ? 0.022 * Math.exp(-7 * x) * Math.abs(Math.sin(11 * x)) : 0);
      F[0] = ramp(t, T_ROLL[0], T_ROLL[0] + 0.2); this.arr = ease.inOut(ramp(t, T_ROLL[0], T_ROLL[0] + 0.45));
    }
    // ---- the drop that falls back into the pot after the pen is filled
    {
      let last = -1; for (const d of this.plan.dips) if (d <= td) last = d;
      const x = last < 0 ? -1 : td - last - 0.12; F[8] = x > 0 && x < 0.19 ? 1 : 0;
      M[8].makeTranslation(PX + 0.004, 0.255 * PS - 2.0 * Math.max(0, x) * Math.max(0, x), PZ + 0.004);
    }
  },
  // The way back, R of the way through it: the pen up under the frame, the rest let go, the sheet rolled up the wall.
  goBack(R) {
    // (the pen is laid flat to the wall first and only then goes up it, so that from the floor it never crosses the picture)
    const Q = this.Q, F = this.F, V = this.V, k = ease.inOut(ramp(R, 0, 0.6)), kw = ease.out(ramp(R, 0, 0.3)), go = 1 - ramp(R, 0.04, 0.36), e = this.eMid;
    V.a.copy(Q.p).addScaledVector(Q.d, LEN * Q.sc / 2); V.a.set(lerp(V.a.x, e.x, k), lerp(V.a.y, e.y - 0.05, k) + 0.04 * Math.sin(PI * k), lerp(V.a.z, e.z, kw));
    Q.sc = lerp(Q.sc, 0.3, ease.inOut(ramp(R, 0, 0.42))); Q.d.lerp(V.b.set(0.99, 0.12, 0.04), kw).normalize(); Q.p.copy(V.a).addScaledVector(Q.d, -LEN * Q.sc / 2);
    F[1] *= 1 - ramp(R, 0.46, 0.6);
    for (const i of [2, 3, 4, 5, 6, 7, 8]) F[i] *= go;
    for (const c of this.u.uCs.value) c.w *= go;
    this.U = lerp(this.U, U0, ease.inOut(ramp(R, 0.12, 0.74))); F[0] *= 1 - ramp(R, 0.9, 0.99); this.arr = 1 - ease.inOut(ramp(R, 0.72, 0.99));
  },
  // Set down what pose (and goBack) worked out: where each part is, and the shade each throws.
  commit() {
    const V = this.V, Q = this.Q, K = this.K, M = this.M, F = this.F, u = this.u, pr = this.pr;
    // the quill: its shaft along d, its vane turned to face the room
    V.z.set(0, 0.25, 1).addScaledVector(Q.d, -(0.25 * Q.d.y + Q.d.z)).normalize(); V.x.crossVectors(Q.d, V.z);
    M[1].makeBasis(V.x, Q.d, V.z).scale(V.a.setScalar(Q.sc)).setPosition(Q.p);
    u.uQa.value.copy(Q.p); u.uQb.value.copy(Q.p).addScaledVector(Q.d, LEN * Q.sc);
    u.uQv0.value.copy(Q.p).addScaledVector(Q.d, 0.42 * LEN * Q.sc).addScaledVector(V.x, 0.02 * Q.sc); u.uQv1.value.copy(Q.p).addScaledVector(Q.d, 0.92 * LEN * Q.sc).addScaledVector(V.x, 0.012 * Q.sc);
    M[2].makeRotationZ(K.rz).scale(V.a.setScalar(K.sc)).setPosition(K.p);
    u.uKa.value.set(0, -0.2, 0).applyMatrix4(M[2]); u.uKb.value.set(0, BLD * 0.95, 0).applyMatrix4(M[2]);
    this.prof(this.U, pr); u.uU.value = this.U; u.uPU.value.set(pr.y, pr.z, pr.g);
    const Ro = this.rollR(this.U), ry = pr.y + Math.sin(pr.g) * Ro, rz = pr.z + Math.cos(pr.g) * Ro, arr = this.arr;
    u.uRl.value.set(ry, rz, Ro, this.U < LS ? pr.y : -0.1);
    // (the roll comes from under the frame as the rest did, small, to the top of the wall it will run down)
    V.b.set((XS0 + XS1) / 2, ry, rz); V.c.lerpVectors(E_OUT, V.b, arr);
    M[0].makeScale(1, 1, 1).scale(V.a.setScalar(lerp(0.2, 1, arr))).setPosition(V.c).multiply(V.m.makeTranslation(-V.b.x, -V.b.y, -V.b.z));
    u.uSh.value.set(F[1] * clamp01((Q.sc - 0.4) * 3), F[2] * clamp01((K.sc - 0.5) * 3), F[3], F[0] * arr * arr * arr);
  },

  hide() { this.things.visible = false; this.soft.visible = false; },
  start(L, resumed) { this.lin = resumed ? this.at - L.t : 0; this.sc.from(resumed ? this.at : 0); },
  end() { this.hide(); },
  reset() { this.hide(); this.lin = this.at = 0; },

  update(L, dt) {
    const ph = L.phase, showing = ph === 'wake' || ph === 'play', linger = ph === 'linger', back = ph === 'return';
    if (!showing && !linger && !back) { this.hide(); return; }
    const calm = L.calm;
    if (linger) this.lin += dt;
    const t = this.at = L.t + this.lin;
    const voice = L.voice(); voice.level = calm ? 0.55 : 1; voice.place();
    this.things.visible = true; this.soft.visible = true;
    if (showing) this.sc.play(t);
    if (showing && !TOLD && !L.quiet && t > T_SNICK + 0.5) { TOLD = true; L.k.say('He has stopped drawing to cut his quill pen. Here it is cut, dipped and tried, and it draws the hill outside his window.', 6); }
    this.pose(t, calm);
    if (back) this.goBack(L.ret);
    this.commit();
    if (back && L.ret >= 1) this.hide();
  },
});
