// German (South German), Portrait of a Young Artist, about 1500 (Gallery 207): QUILL.
//
// What the museum says: "The youthful sitter in this portrait pauses in the midst of drawing a nude figure to shape
// his quill pen. On the shelf behind him are pots of paint, a shell probably used to mix pigment and binder, and a
// bottle of oil." It has "often been assumed" to be a self-portrait; the museum does not say it is, and gives him no
// name. So he is a man who draws with a pen, caught in the one moment a pen draughtsman of his time had to stop for:
// the pen has gone soft and must be cut again. His right hand holds a small knife, its curved steel blade upright and
// its ribbed bone handle below the fist; his left holds the long white quill, trimmed slim. On the grey table lie the
// sheet, warm white, an ochre line along its edge, rolled up tight at one end and greyer underneath; and his ink box:
// long, square in section, ochre, lying on the table with a round boss in a sunk square on the end turned to us, a
// black collar turned in ribs standing on its top, and the ink spilled round the collar and run down its sides. Its
// stopper lies beside it: three black flanges and a gold knob. At the right is his window, tall and narrow: a round
// hill fills its foot, dark on its left; a pale road climbs round the hill's left side; behind the hill a band of
// trees (a tall one, a hedge, a round one) with a house wall at their right; a bare slope; and at the top two crags,
// a pale one at the left and a dark one at the right, with water between them.
//
// What comes out, and why. The word is found in the picture: quill. Every other show that draws in this museum draws
// with a line that makes itself; only this picture is about the tool, and about the moment before the line.
//   1. His quill falls out from under the frame as a feather falls, rocking, and steadies over the floor, the pen end
//      to the left as he holds it. His ink box and its stopper are set down beside it, as they lie on his table.
//   2. His knife comes down, the blade upright as he holds it, and pares the pen: two long cuts, each lifting a curl
//      of shaving that springs away and rocks on the floor; then the blade is set on the tip, lifted, and the tip is
//      cut square with one small crisp sound. That is the moment of the show. The knife goes back up to him.
//   3. A sheet of paper lets itself down the wall under him and out along the floor, and stops as his does, in a
//      tight roll. The pen is dipped, a drop falls back into the box, and it is tried at the sheet's top corner as a
//      new pen is tried (a zigzag, a row of loops, three flicks), small and apart from what follows.
//   4. Then it draws the one thing in his room it can: the view out of his window, as he painted it and as a pen
//      draughtsman of his time and place would set it down. The window's own frame first; then the contours, in a
//      line that swells on the downstroke and thins on the turn (the hill's profile, the road and its ruts, each tree
//      where it stands and at its own size, the house wall, the slope, the two crags, the water); then the shade, in
//      short parallel strokes laid on the sides away from the light and following the form (round the hill, down the
//      crag), with a few shorter strokes across them where the picture is darkest (the hill's left flank, the dark
//      crag); the lights are left as bare paper. The ink goes down wet and dark and dries brown; the line thins as
//      the pen empties, and it goes back to the box. When all is drawn the pen is held aside, off the drawing.
// When you look away the pen goes back up under the frame, and the sheet rolls itself up the wall and is gone.
//
// How it is made. Two draw calls. One mesh holds the sheet, the quill, the knife, the box, the stopper, three shavings
// and a drop of ink, each smooth (built from rules, not facets) and painted in the shader in his manner: one light
// from the right, as from his window; a firm lit side and a firm shaded side; thin crisp lights along edges; every
// colour taken from the picture's own palette, and none laid flat (the box is mottled and worn at its edges, the
// paper cockled, flecked and toned). The sheet's roll is wound in the vertex shader from one number (how much of it
// is let down), the pen's point is narrowed by another (how far it is cut). The drawing is measured from the window
// in the picture, point by point, and is two small textures made once: how much ink lies at each point, and when
// the pen reached it; the sheet shows the ink the pen has reached. A second mesh lays the shade things throw on the
// floor and wall, and the soft dark where the sheet lies on the boards. The pen is never stood so high over the
// sheet that its feather would come between his picture and an eye on the floor: worked near the sheet's top it lies
// over along the wall. Calm mode: the feather falls without its wide rocking, nothing springs or rebounds, the
// shavings turn at half speed, every sound is quieter, and the shade is laid at under four strokes a second (the
// drawing then takes about a minute and a half, its contours first).
//
// What it does not do: it does not draw the figure on his sheet (no unclothed figure is ever made here), it gives him
// no name and does not bring him out of the picture, it sends nothing out of his window (no bird, no weather), and
// the knife's blade only ever points up, never at a picture.
import * as THREE from 'three';
import { lifeFor, ease, ramp, clamp01, lerp } from '../paintlife.js';
import { score } from './stagecraft.js';

const PI = Math.PI, TAU = PI * 2;
// The stage's own metres: x along the wall (to the viewer's right), y up from the floor, z out from the picture's plane.
const SUN = new THREE.Vector3(0.60, 0.62, 0.50).normalize();      // the way to his light: from the right, as from his window
const KEY = 0.5;                                    // (the game's film curve lifts what the room does not light: the paint is laid that much lower)
// the sheet: its edges along the wall; its slope down the wall, its length on the floor, how much stays wound
const XS0 = -0.36, XS1 = 0.24, SW = XS1 - XS0, LS = 1.0, LF = 0.09, WOUND = 0.36, S_END = LS + LF, S_TOT = S_END + WOUND, U0 = 0.09;
const G0 = 0.15, GP = 8.0;                          // how it leans at the top, how late it bends out to the floor
const RIN = 0.011, PITCH = 0.008;                   // the roll: its innermost turn, how much each turn adds
const TW = 640, TH = 960, TMAX = 128;               // the drawing: its texture, and the longest its clock runs
const XD0 = XS0 + 0.04, DW = SW - 0.08, SD0 = 0.07, DH = DW * TH / TW;      // where on the sheet it is drawn (tall and narrow, as his window is)
const LEN = 1.0, NIBL = 0.09, QS = 0.82;            // the quill: its length as made, how much of it is cut; how large it is shown
const BLD = 0.17, KS = 1.15;                        // the knife's blade; how much larger than it is made the knife is shown
const RHO = 0.04, CW = 0.026;                       // a shaving: its curl, its width
// his ink box (larger than made, too): where it lies, its bossed end turned to the light as he has it; its stopper, by that end
const PS = 1.3, PX = -0.86, PZ = 0.38, POT_YAW = 0.9, STX = -0.70, STZ = 0.575;
const BH = 0.04, BL = 0.09, MZ = -0.05, INK_Y = 0.094;      // the box: half its section, half its length; where along it its mouth is, how high the ink stands
const MOUTH = new THREE.Vector3(PX + PS * MZ * Math.sin(POT_YAW), INK_Y * PS, PZ + PS * MZ * Math.cos(POT_YAW)), POT_AX = new THREE.Vector3(Math.sin(POT_YAW), 0, Math.cos(POT_YAW));
const CN = new THREE.Vector3(-0.58, 0.66, 0.60);    // where the pen's point is held to be cut
const D_CUT = new THREE.Vector3(Math.cos(0.05), Math.sin(0.05), 0.04).normalize(), D_POT = new THREE.Vector3(0.36, 0.86, 0.36).normalize(), D_PAPER = new THREE.Vector3(0.66, 0.52, 0.54).normalize();
const E_OUT = new THREE.Vector3(-0.03, 1.14, 0.10); // where things leave the picture: under the frame
// The show, in seconds.
const T_FALL = [0.15, 1.25], T_POT = [0.5, 1.0], T_KIN = [0.9, 1.6], T_P1 = [1.75, 2.2], T_P2 = [2.5, 2.92], T_TIP = [3.0, 3.38], T_SNICK = 3.45, T_KOUT = [3.65, 4.3], T_ROLL = [3.55, 4.7], T_PEN = 3.85;
const FIRST = [0.62, 0.38, 0.45], DIP = [0.5, 0.4, 0.5], CAP = 4.4;      // to the pot, in it, to the sheet; how far a penful goes (metres of line)
let TOLD = false;                                   // (the game says what happens once, the first time)
const K_PAPER = 0, K_QUILL = 1, K_KNIFE = 2, K_POT = 3, K_STOP = 4, K_CURL = 5, K_INK = 6, NP = 9;
const GK = 1.07;                                    // (how fast the line under which nothing crosses his picture, seen from the floor, falls with the way out from the wall)
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
// The view in his window, measured on the picture and set down as a pen draughtsman of his time and country would:
// the window's opening first, then every contour with a line that swells where the pen is drawn down and thins where
// it is pushed; then the shade, in strokes laid side by side on the sides turned from the light and following each
// form (round the hill, down the slope, up the faces of the rocks), crossed with a few shorter ones where it is
// darkest; and the lights left as bare paper. What is where: the round green hill that fills the lower right, dark on
// its left and top and lit low on its right; the pale road that comes down round its foot, with its ruts; the bush at
// the left of the road; the band of trees across the middle (a tall one at the left, a hedge, one great round tree),
// two small pale things on the ground before them and a white wall at the right edge; the slope behind; and on the
// skyline a pale crag at the left and a dark one that hangs over it at the right.
// Returns the strokes (each a line of close points on the sheet's drawing, 0..1 across and up, with when it is begun
// and ended on the drawing's clock) and what the pen does between them. In calm mode the same drawing, the shade laid
// at an unhurried four strokes a second.
const rnd = seed => () => { seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const inside = (poly, x, y) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const a = poly[i], b = poly[j]; if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; };
function plan(calm) {
  const S = [];
  // the view's place on the drawing, its size in metres, and how much of the window's foot is left off
  const VX = 0.30, VW = 0.67, VY = 0.025, VH = 0.955, WM = VW * DW, HM = VH * DH, GY0 = 0.04;
  // a point of the window (0..1 across its opening; 0..1 up it, as measured on the picture) in metres on the view, and back
  const g = ([x, y]) => [x * WM, (y - GY0) / (1 - GY0) * HM], gx = x => x / WM, gy = y => y / HM * (1 - GY0) + GY0;
  const put = (m, o) => S.push({ pts: m.map(([x, y]) => [VX + x / DW, VY + y / DH]), w: 0.0040, smooth: true, hatch: false, sp: 1.5, ...o });
  const line = (pts, o = {}) => put(pts.map(g), o);
  const raw = (pts, o = {}) => S.push({ pts, w: 0.0034, smooth: true, hatch: false, sp: 1.0, ...o });
  // a leafy edge: the measured line drawn as foliage is, in small unequal lobes (to the left of the way it runs)
  const leafy = (pts, lobes, deep, seed, o = {}) => {
    const R = rnd(seed), cv = curveOf(pts.map(g)), n = Math.ceil(cv.getLength() / 0.0025), out = [], cuts = [0]; let a = 0, k = 0;
    while (a < 1) { a += (0.35 + 1.3 * R()) / lobes; cuts.push(Math.min(1, a)); }
    const hs = cuts.map((c, i) => deep * (0.3 + 0.9 * R()) * Math.sqrt(Math.max(0.2, ((cuts[i + 1] ?? 1) - c) * lobes))), sk = cuts.map(() => 0.65 + 0.8 * R());
    for (let i = 0; i <= n; i++) {
      const q = i / n; while (k < cuts.length - 2 && q > cuts[k + 1]) k++;
      const f = clamp01((q - cuts[k]) / Math.max(1e-6, cuts[k + 1] - cuts[k])), p = cv.getPointAt(q), t = cv.getTangentAt(q), b = hs[k] * Math.pow(Math.sin(PI * Math.pow(f, sk[k])), 0.7);
      out.push([p.x - t.y * b, p.y + t.x * b]);
    }
    put(out, { smooth: false, sp: 1.0, ...o });
  };
  // Shade laid in a shape (its outline, as measured): strokes side by side, gap apart, along straight lines (at ang) or
  // along rings (round c, a point of the window); each begun at its upper end and flicked away. tone (0 bare .. 1 all)
  // says how close they lie: where it falls, first every other row stops, then three in four, and the lights are left.
  const TH4 = [0.2, 0.7, 0.45, 0.95];
  const fill = (shape, { ang = 1.05, c = null, gap = 0.009, len = [0.03, 0.05], tone = null, w = 0.0026, seed = 1, min = 0.012 }) => {
    const R = rnd(seed), poly = shape.map(g), xs = poly.map(p => p[0]), ys = poly.map(p => p[1]), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys), ST = 0.003, rows = [];
    const cs = [[x0, y0], [x1, y0], [x0, y1], [x1, y1]];
    if (c) {
      const cm = g(c), ds = cs.map(([x, y]) => Math.hypot(x - cm[0], y - cm[1]));
      for (let r = Math.max(...ds); r > gap; r -= gap) { const rr = r + gap * 0.3 * (R() - 0.5), n = Math.ceil(TAU * rr / ST), pts = []; for (let i = 0; i < n; i++) { const a = i / n * TAU; pts.push([cm[0] + rr * Math.cos(a), cm[1] + rr * Math.sin(a)]); } rows.push(pts); }
    } else {
      const dx = Math.cos(ang), dy = Math.sin(ang), ks = cs.map(([x, y]) => -x * dy + y * dx), ss = cs.map(([x, y]) => x * dx + y * dy);
      for (let k = Math.max(...ks); k > Math.min(...ks); k -= gap) { const kk = k + gap * 0.3 * (R() - 0.5), pts = []; for (let s = Math.max(...ss); s > Math.min(...ss); s -= ST) pts.push([s * dx - kk * dy, s * dy + kk * dx]); rows.push(pts); }
    }
    rows.forEach((pts, ri) => {
      const th = TH4[ri % 4]; let run = [];
      const flush = () => {
        let i = Math.floor(R() * 3);
        while (i < run.length - 1) {
          const want = lerp(len[0], len[1], R()), n = Math.min(run.length - 1 - i, Math.round(want / ST));
          if (n * ST >= min) { const a = run[i], m = run[i + (n >> 1)], b = run[i + n], pts3 = a[1] >= b[1] ? [a, m, b] : [b, m, a]; put(pts3, { hatch: true, w, smooth: true }); }
          i += n + 2 + Math.floor(R() * 3);
        }
        run = [];
      };
      for (const p of pts) { if (inside(poly, p[0], p[1]) && (!tone || tone(gx(p[0]), gy(p[1])) >= th)) run.push(p); else if (run.length) flush(); }
      if (run.length) flush();
    });
  };
  // how far a point of the window is from a measured line, in metres
  const off = (pts, x, y) => { const p = g([x, y]); let d = 1e9; for (let i = 1; i < pts.length; i++) { const a = g(pts[i - 1]), b = g(pts[i]), ex = b[0] - a[0], ey = b[1] - a[1], q = clamp01(((p[0] - a[0]) * ex + (p[1] - a[1]) * ey) / (ex * ex + ey * ey)); d = Math.min(d, Math.hypot(p[0] - a[0] - ex * q, p[1] - a[1] - ey * q)); } return d; };
  const blob = (x, y, cx, cy, rx, ry) => { const a = (x - cx) / rx, b = (y - cy) / ry; return a * a + b * b; };      // (under 1: inside a round light)

  // ---- the new pen tried at the sheet's edge, apart from the view: a zigzag, a row of loops, three flicks
  raw(Array.from({ length: 9 }, (_, i) => [0.045 + 0.016 * i, 0.925 + (i % 2 ? 0.03 : 0)]));
  raw(Array.from({ length: 34 }, (_, k) => { const t = k / 33; return [0.055 + 0.10 * t - 0.016 * Math.sin(TAU * 3.5 * t), 0.855 + 0.019 * Math.cos(TAU * 3.5 * t)]; }));
  for (let i = 0; i < 3; i++) S.push({ pts: [[0.105 + 0.033 * i, 0.795], [0.068 + 0.033 * i, 0.75]], w: 0.0026, smooth: false, hatch: true });

  // ---- what was measured on the picture
  const HILL = [[1.0, 0.632], [0.86, 0.612], [0.73, 0.588], [0.61, 0.553], [0.49, 0.512], [0.38, 0.487], [0.29, 0.465], [0.23, 0.432], [0.2, 0.385], [0.195, 0.335], [0.21, 0.29], [0.255, 0.252], [0.32, 0.213], [0.39, 0.168], [0.46, 0.123], [0.55, 0.088], [0.67, 0.058], [0.76, 0.04]];
  const TALL = [[0, 0.765], [0.03, 0.776], [0.07, 0.78], [0.105, 0.768], [0.135, 0.762], [0.16, 0.745], [0.166, 0.72], [0.155, 0.70]];
  const HEDGE = [[0.165, 0.70], [0.2, 0.715], [0.24, 0.722], [0.275, 0.74], [0.32, 0.748], [0.365, 0.742], [0.41, 0.745], [0.445, 0.728], [0.47, 0.70]];
  const ROUND = [[0.455, 0.60], [0.47, 0.63], [0.462, 0.665], [0.48, 0.70], [0.52, 0.722], [0.565, 0.738], [0.62, 0.745], [0.68, 0.742], [0.74, 0.733], [0.80, 0.72], [0.85, 0.70], [0.885, 0.672], [0.895, 0.64], [0.88, 0.618]];
  const BUSH = [[0, 0.585], [0.04, 0.592], [0.09, 0.585], [0.14, 0.572], [0.185, 0.553], [0.2, 0.53], [0.195, 0.505], [0.165, 0.492], [0.13, 0.478], [0.08, 0.468], [0.03, 0.465], [0, 0.47]];
  const PALE = [[0.03, 0.895], [0.045, 0.93], [0.09, 0.958], [0.13, 0.968], [0.18, 0.962], [0.22, 0.95], [0.27, 0.94], [0.33, 0.928], [0.40, 0.935], [0.46, 0.945], [0.50, 0.948]];
  const DARK = [[0.50, 0.948], [0.47, 0.956], [0.468, 0.975], [0.49, 0.988], [0.55, 0.995], [0.62, 0.996], [0.70, 0.988], [0.77, 0.972], [0.84, 0.955], [0.90, 0.94], [0.96, 0.915], [1.0, 0.895]];
  const FOOT_L = [[0.03, 0.895], [0.10, 0.888], [0.18, 0.872], [0.25, 0.855], [0.32, 0.838]], FOOT_R = [[0.48, 0.846], [0.58, 0.848], [0.70, 0.855], [0.85, 0.86], [1.0, 0.865]];
  const WATER = [[0.30, 0.836], [0.36, 0.843], [0.43, 0.84], [0.485, 0.832], [0.44, 0.823], [0.37, 0.82], [0.31, 0.826], [0.30, 0.836]];

  // ---- the window's opening
  line([[0, 1], [0, 0.6], [0, GY0]], { w: 0.0038, sp: 1.6 }); line([[0, 1], [0.5, 1], [1, 1]], { w: 0.0038, sp: 1.6 }); line([[1, 1], [1, 0.5], [1, GY0]], { w: 0.0038, sp: 1.6 }); line([[0, GY0], [0.5, GY0], [1, GY0]], { w: 0.0038, sp: 1.6 });
  // ---- the contours, nearest first: the hill, in one long line from the right, round its dark shoulder and down its foot
  line(HILL, { w: 0.0048 });
  // the road: its verge under the hill, its ruts where it bends at the window's left, the wheel tracks low down
  line([[0.185, 0.30], [0.225, 0.262], [0.29, 0.218], [0.36, 0.172], [0.43, 0.128]], { w: 0.0028 });
  line([[0.14, 0.455], [0.085, 0.425], [0.045, 0.385], [0.025, 0.335], [0.02, 0.28]], { w: 0.0032 }); line([[0.10, 0.395], [0.075, 0.36], [0.065, 0.32]], { w: 0.0026 });
  line([[0.02, 0.175], [0.03, 0.145], [0.06, 0.12], [0.12, 0.09], [0.2, 0.055]], { w: 0.0034 }); line([[0.12, 0.25], [0.16, 0.195], [0.24, 0.14], [0.34, 0.085]], { w: 0.0026 });
  // the bush at the road's left; the two small pale things on the ground beyond it
  leafy(BUSH.slice(0, 8), 5, 0.006, 11); line(BUSH.slice(7), { w: 0.003 });
  line([[0.275, 0.617], [0.27, 0.59]], { w: 0.003, smooth: false }); line([[0.255, 0.584], [0.30, 0.582]], { w: 0.0026, smooth: false }); line([[0.405, 0.591], [0.45, 0.588]], { w: 0.003, smooth: false });
  // the trees: the tall one, the hedge, the great round one (no two alike), and the white wall at the right edge
  leafy(TALL, 4, 0.007, 23); leafy(HEDGE, 6, 0.0055, 37); leafy(ROUND, 9, 0.0075, 51);
  line([[0.165, 0.64], [0.26, 0.628], [0.36, 0.62], [0.44, 0.612]], { w: 0.0028 });
  line([[0.925, 0.66], [0.92, 0.716], [1.0, 0.716]], { w: 0.0032, smooth: false }); line([[0.875, 0.656], [0.94, 0.648], [1.0, 0.65]], { w: 0.0026 });
  // the slope behind: where the field ends, a fold of it
  line([[0.235, 0.838], [0.31, 0.815], [0.39, 0.785], [0.47, 0.752]], { w: 0.003 }); line([[0.52, 0.80], [0.66, 0.778], [0.82, 0.77], [1.0, 0.78]], { w: 0.0026 });
  // the skyline: the pale crag, the dark one that hangs over it; their feet; the small bright water under them
  line(PALE, { smooth: false, w: 0.0042 }); line(DARK, { w: 0.0046 });
  line(FOOT_L, { w: 0.003 }); line(FOOT_R, { w: 0.0034 }); line(WATER, { w: 0.0026 });
  for (const r of [[[0.13, 0.968], [0.16, 0.93], [0.14, 0.90]], [[0.22, 0.95], [0.27, 0.91], [0.33, 0.885]], [[0.50, 0.948], [0.44, 0.92], [0.40, 0.885], [0.44, 0.86]], [[0.62, 0.996], [0.60, 0.95], [0.63, 0.925]], [[0.84, 0.955], [0.80, 0.91], [0.82, 0.875]]]) line(r, { smooth: false, w: 0.003 });
  const contours = S.length;

  // ---- the shade. The hill's: rings round its height, close on its dark left and top, thinning to bare paper low on the right
  const hillShape = [...HILL, [1.0, GY0], [1.0, 0.632]], lit = (x, y) => clamp01((x - 0.40) / 0.42) * clamp01((0.47 - y) / 0.2);
  fill(hillShape, { c: [1.12, 0.2], gap: 0.0135, len: [0.04, 0.068], seed: 3, tone: (x, y) => 1.0 - 1.05 * lit(x, y) });
  fill(hillShape, { ang: -0.6, gap: 0.014, len: [0.016, 0.026], seed: 5, tone: (x, y) => (off(HILL, x, y) < 0.032 && y > 0.24 && x < 0.62 ? 1 : 0) });
  // the bush's, the trees'
  const leaf = (x, y) => Math.min(blob(x, y, 0.60, 0.685, 0.06, 0.02), blob(x, y, 0.70, 0.65, 0.05, 0.018), blob(x, y, 0.585, 0.612, 0.045, 0.016), blob(x, y, 0.30, 0.68, 0.035, 0.016), blob(x, y, 0.13, 0.695, 0.03, 0.012));
  fill(BUSH, { ang: 1.0, gap: 0.0095, len: [0.016, 0.026], seed: 7, tone: (x, y) => 0.6 + 0.5 * clamp01((0.56 - y) / 0.06) });
  fill([...TALL, [0.17, 0.685], [0.165, 0.64], [0.06, 0.63], [0, 0.625]], { ang: 1.2, gap: 0.0095, len: [0.016, 0.026], seed: 9, tone: (x, y) => (leaf(x, y) < 1 ? 0 : 0.6 + 0.5 * clamp01((0.74 - y) / 0.06)) });
  fill([...HEDGE, [0.465, 0.66], [0.47, 0.63], [0.44, 0.612], [0.36, 0.62], [0.26, 0.628], [0.165, 0.64]], { ang: 0.95, gap: 0.0095, len: [0.014, 0.024], seed: 13, tone: (x, y) => (leaf(x, y) < 1 ? 0 : 0.55 + 0.5 * clamp01((0.72 - y) / 0.05)) });
  fill([...ROUND, [0.86, 0.612], [0.73, 0.588], [0.61, 0.553], [0.5, 0.52], [0.46, 0.56]], { ang: 1.1, gap: 0.0095, len: [0.016, 0.028], seed: 17, tone: (x, y) => (leaf(x, y) < 1 ? 0 : 0.5 + 0.5 * clamp01((0.70 - y) / 0.07) + 0.4 * clamp01((0.62 - x) / 0.12)) });
  fill([[0.42, 0.61], [0.5, 0.60], [0.53, 0.66], [0.47, 0.70], [0.43, 0.66]], { ang: -0.5, gap: 0.009, len: [0.012, 0.02], seed: 19 });
  // the slope's, down its fall; the dark crag's, up its faces, crossed under its brow; a little on the pale one's far side
  fill([[0.31, 0.83], [0.47, 0.845], [0.7, 0.855], [1.0, 0.865], [1.0, 0.725], [0.885, 0.69], [0.85, 0.705], [0.80, 0.725], [0.74, 0.738], [0.68, 0.747], [0.62, 0.75], [0.565, 0.743], [0.52, 0.727], [0.48, 0.705], [0.47, 0.752], [0.39, 0.785]], { ang: 0.85, gap: 0.016, len: [0.014, 0.024], seed: 21, tone: (x, y) => 0.3 + 0.45 * clamp01((x - 0.5) / 0.3) });
  const darkShape = [...DARK, [1.0, 0.865], [0.85, 0.86], [0.7, 0.855], [0.58, 0.848], [0.48, 0.846], [0.44, 0.86], [0.40, 0.885], [0.44, 0.92]];
  fill(darkShape, { ang: 1.25, gap: 0.0095, len: [0.022, 0.036], seed: 25, tone: (x, y) => (blob(x, y, 0.67, 0.912, 0.07, 0.008) < 1 ? 0 : 0.75 + 0.3 * clamp01((0.95 - y) / 0.05)) });
  fill(darkShape, { ang: -0.45, gap: 0.013, len: [0.014, 0.022], seed: 27, tone: (x, y) => (y < 0.89 || (x < 0.58 && y < 0.95) ? 1 : 0) });
  fill([...PALE, [0.44, 0.92], [0.40, 0.885], [0.44, 0.86], [0.48, 0.846], [0.40, 0.842], [0.32, 0.838], [0.25, 0.855], [0.18, 0.872], [0.10, 0.888]], { ang: 1.25, gap: 0.009, len: [0.016, 0.026], seed: 29, tone: (x, y) => 1.05 * clamp01((x - 0.2) / 0.22) * clamp01((0.955 - y) / 0.05) });

  // every stroke as close, evenly spaced points (a hand's small unsteadiness in the long ones), and its length in metres
  const STEP = 0.0025;
  S.forEach((s, si) => {
    const m = s.pts.map(([x, y]) => new THREE.Vector3(x * DW, y * DH, 0));
    let len = 0; for (let i = 1; i < m.length; i++) len += m[i].distanceTo(m[i - 1]);
    const n = Math.max(2, Math.ceil(len / STEP) + 1);
    let d;
    if (s.smooth && m.length > 2) d = new THREE.CatmullRomCurve3(m, false, 'centripetal').getSpacedPoints(n - 1);
    else { const path = new THREE.CurvePath(); for (let i = 1; i < m.length; i++) path.add(new THREE.LineCurve3(m[i - 1], m[i])); d = path.getSpacedPoints(n - 1); }
    s.len = 0; for (let i = 1; i < d.length; i++) s.len += d[i].distanceTo(d[i - 1]);
    s.d = new Float32Array(d.length * 2);
    d.forEach((p, i) => {
      const k = s.hatch ? 0 : Math.sin(PI * i / (d.length - 1)), jx = 0.0007 * k * Math.sin(i * 0.31 + si * 1.9), jy = 0.0007 * k * Math.sin(i * 0.23 + si * 2.7 + 1);
      s.d[i * 2] = (p.x + jx) / DW; s.d[i * 2 + 1] = (p.y + jy) / DH;
    });
  });
  // what the pen does: to the pot and the sheet; a stroke; a hop to the next; back to the pot when it runs dry
  const ev = [], dips = [FIRST[0] + FIRST[1]], end = s => [s.d[s.d.length - 2], s.d[s.d.length - 1]];
  let t = FIRST[0] + FIRST[1] + FIRST[2], used = 0, last = null;
  ev.push({ k: 'first', t0: 0, t1: t, to: [S[0].d[0], S[0].d[1]] });
  S.forEach((s, i) => {
    const p0 = [s.d[0], s.d[1]];
    if (used > CAP) { const D = DIP[0] + DIP[1] + DIP[2]; ev.push({ k: 'dip', t0: t, t1: t + D, from: last, to: p0 }); dips.push(t + DIP[0] + DIP[1]); t += D; used = 0; }
    else if (last) { const h = Math.min(0.3, (calm && s.hatch ? 0.09 : 0.02) + 0.45 * Math.hypot((p0[0] - last[0]) * DW, (p0[1] - last[1]) * DH)); ev.push({ k: 'hop', t0: t, t1: t + h, from: last, to: p0 }); t += h; }
    const dur = s.hatch ? (calm ? 0.17 : 0.03) + s.len * 0.25 : 0.05 + s.len / s.sp;
    s.t0 = t; s.t1 = t + dur; s.wear = Math.min(1, used / CAP);
    ev.push({ k: 'stroke', t0: t, t1: t + dur, s }); t += dur; used += s.len; last = end(s);
  });
  ev.push({ k: 'rest', t0: t, t1: 1e9, from: last, to: [1.035, 0.3], done: true });
  return { S, ev, dips, total: t, contours };
}
// How far along a stroke the pen is, a part q of its time in: a long line is drawn evenly, a hatching stroke flicked.
const along = (s, q) => (s.hatch ? 1 - Math.pow(1 - q, 1.5) : q);

// The ink of the drawing, and when each point of it is reached: two textures, made once.
function inkOf(S) {
  const n = TW * TH, ink = new Uint8Array(n), when = new Uint16Array(n).fill(65535), halo = new Float32Array(n).fill(1e9), PXM = TW / DW, HALO = 4;
  for (const s of S) {
    const N = s.d.length / 2, steps = Math.max(2, Math.ceil(s.len * PXM / 0.55)), body = s.w * PXM / 2 * (1 - 0.2 * s.wear), dark = 1 - 0.3 * s.wear * s.wear;
    for (let k = 0; k <= steps; k++) {
      const q = k / steps, f = q * (N - 1), i = Math.min(N - 2, Math.floor(f)), fr = f - i;
      const x = lerp(s.d[i * 2], s.d[i * 2 + 2], fr) * TW, y = lerp(s.d[i * 2 + 1], s.d[i * 2 + 3], fr) * TH;
      // (a quill's line swells where it is drawn down, the nib spread, and thins where it is pushed up or across; it is
      // set down and lifted off fine. A hatching stroke is set down firm and flicked away to nothing)
      const i0 = Math.max(0, i - 3), i1 = Math.min(N - 1, i + 4), ex = (s.d[i1 * 2] - s.d[i0 * 2]) * DW, ey = (s.d[i1 * 2 + 1] - s.d[i0 * 2 + 1]) * DH, down = 0.5 - 0.5 * ey / Math.max(1e-6, Math.hypot(ex, ey));
      const r = body * (s.hatch ? 1.12 - 0.72 * q : (0.5 + 0.72 * Math.pow(down, 1.3)) * (0.45 + 0.55 * Math.pow(Math.min(1, q / 0.06, (1 - q) / 0.1), 0.6)));
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

    // ------------------------------------------------------------ his ink box (part 3), as he painted it: long, square in section, lying on
    // the boards; a round black collar, turned in ribs, stands at one end of its top with the ink in it; a round boss on the end turned to us
    { const zs = [[-BL, 0], [-BL, 0.93], [-BL + 0.004, 1], [BL - 0.004, 1], [BL, 0.93], [BL, 0]], vs = [0, 0.2, 0.3, 0.7, 0.8, 1];
      parts.push(surf(32, 10, (u, v, o) => {
        let i = 0; while (i < 4 && v > vs[i + 1]) i++;
        const f = (v - vs[i]) / (vs[i + 1] - vs[i]), z = lerp(zs[i][0], zs[i + 1][0], f), k = lerp(zs[i][1], zs[i + 1][1], f), a = u * TAU, c = Math.cos(a), sn = Math.sin(a), r = BH * k * Math.pow(Math.pow(Math.abs(c), 10) + Math.pow(Math.abs(sn), 10), -0.1);
        o.p.set(r * c, BH + r * sn, z); o.c.setRGB(o.p.x / 0.2 + 0.5, o.p.y / 0.2, o.p.z / 0.2 + 0.5);      // (where on the box, for its paint)
      }, K_POT, 3, 0));
      const cc = curveOf([[0.030, 0.079], [0.0305, 0.084], [0.027, 0.0865], [0.0295, 0.0895], [0.0265, 0.092], [0.029, 0.095], [0.026, 0.0975], [0.0275, 0.1005], [0.022, 0.1025], [0.0175, 0.1], [0.0165, 0.092]]), q = new THREE.Vector3();
      parts.push(surf(24, 30, (u, v, o) => { cc.getPoint(v, q); const a = u * TAU; o.p.set(q.x * Math.cos(a), q.y, MZ + q.x * Math.sin(a)); o.t.set(u, q.y); o.c.setRGB(q.x, 0, 0); }, K_POT, 3, 2));
      parts.push(surf(16, 1, (u, v, o) => { const a = -u * TAU, r = 0.0168 * v; o.p.set(r * Math.cos(a), INK_Y, MZ + r * Math.sin(a)); o.t.set(u, v); }, K_INK, 3, 1)); }

    // ------------------------------------------------------------ its stopper (part 4), lying by it as he has it: a plug turned in three black
    // flanges, and the gold knob it is drawn by
    { const sc = curveOf([[0.001, 0], [0.0135, 0.0005], [0.015, 0.004], [0.015, 0.010], [0.0265, 0.0115], [0.028, 0.0145], [0.0265, 0.0175], [0.018, 0.019], [0.018, 0.0225], [0.0265, 0.024], [0.028, 0.027], [0.0265, 0.030], [0.018, 0.0315], [0.018, 0.035], [0.025, 0.0365], [0.0265, 0.0395], [0.025, 0.0425], [0.012, 0.0445], [0.009, 0.0475], [0.015, 0.053], [0.0195, 0.063], [0.0185, 0.073], [0.0125, 0.083], [0.0085, 0.088], [0.011, 0.093], [0.009, 0.099], [0.001, 0.1015]]), q = new THREE.Vector3();
      parts.push(surf(18, 84, (u, v, o) => { sc.getPoint(v, q); const a = u * TAU; o.p.set(q.x * Math.cos(a), q.y, q.x * Math.sin(a)); o.t.set(u, q.y); o.c.setRGB(q.x, 0, 0); }, K_STOP, 4, 0)); }

    // ------------------------------------------------------------ three shavings (parts 5, 6, 7: wound in the shader) and a drop of ink (part 8)
    for (let i = 0; i < 3; i++) parts.push(surf(2, 40, (u, v, o) => { o.p.set(0, v * 0.01, (u - 0.5) * CW); o.t.set(u, v); }, K_CURL, 5 + i, 0));
    parts.push(surf(10, 6, (u, v, o) => { const a = u * TAU, b = (v - 0.5) * PI; o.p.set(0.008 * Math.cos(b) * Math.cos(a), 0.0095 * Math.sin(b), 0.008 * Math.cos(b) * Math.sin(a)); o.t.set(u, v); }, K_INK, 8, 0));

    // ------------------------------------------------------------ the drawing
    this.Lk = L; this.modes = [null, null]; this.snd = null; const md = this.cur = this.mode(L.calm);
    this.yb = L.bottom - L.y;      // (the foot of his picture, over the boards)

    // ------------------------------------------------------------ his paint on them: one material, one draw call
    const M = this.M = Array.from({ length: NP }, () => new THREE.Matrix4()), F = this.F = new Float32Array(NP), G = this.G = [0, 0, 0];
    const u = this.u = {
      uInv: { value: this.Binv }, uM: { value: M }, uF: { value: F }, uG: { value: G }, uU: { value: U0 }, uPU: { value: new THREE.Vector3() }, uCut: { value: 0 }, uNib: { value: 0 },
      uDraw: { value: -1 }, uInk: { value: md.ink }, uWhen: { value: md.when },
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
  if (kind != ${K_POT}) s = max(s, uSh.z * 0.8 * cap(p, vec3(${f3(PX - POT_AX.x * 0.068 * PS)}, ${f3(0.045 * PS)}, ${f3(PZ - POT_AX.z * 0.068 * PS)}), vec3(${f3(PX + POT_AX.x * 0.068 * PS)}, ${f3(0.045 * PS)}, ${f3(PZ + POT_AX.z * 0.068 * PS)}), ${f3(0.047 * PS)}));
  if (kind != ${K_STOP}) s = max(s, uSh.z * 0.65 * cap(p, vec3(${f3(STX - 0.045)}, 0.034, ${f3(STZ - 0.022)}), vec3(${f3(STX + 0.05)}, 0.034, ${f3(STZ + 0.024)}), 0.032));
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
      ln = nn * cos(a) - tt * sin(a); vRoll = 1.0 + a / 6.2832;
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
    // paper: the warm white of the sheet under his hand, grey where it turns from his light; uneven, as a sheet that has been handled
    // and rolled is, with the tooth of the mould it was made on; its underside duller, and darker into the roll; the drawing on its face
    vec2 pm = vec2(vUv2.x * ${f3(SW)}, vUv2.y);
    float cock = mN(pm * vec2(7.0, 5.0)) - 0.5, lam = smoothstep(-0.3, 0.85, nl + 0.24 * cock), fib = mN(pm * vec2(520.0, 150.0)), fl = mN(pm * 46.0), chain = smoothstep(0.93, 1.0, cos(pm.x * 251.0));
    c = mix(${C('#766b55')}, ${C('#ded4ba')}, lam);
    c *= 0.925 + 0.07 * fib + 0.09 * (fl - 0.5) - 0.025 * chain;
    c *= mix(vec3(1.0), vec3(1.0, 0.955, 0.86), 0.6 * smoothstep(0.35, 0.9, mN(pm * 11.0 + 3.0)));
    if (!front) c *= vec3(0.80, 0.765, 0.69) * (1.0 - 0.09 * min(vRoll, 3.0));
    else if (vRoll < 0.5 && dq.x > 0.0 && dq.x < 1.0 && dq.y > 0.0 && dq.y < 1.0) {
      float when = (wq.r * 65280.0 + wq.g * 255.0) / 65535.0 * ${f3(TMAX)}, on = step(when, uDraw), wet = 1.0 - smoothstep(0.0, 0.9, uDraw - when);
      vec3 ic = mix(${C('#2e2014')}, ${C('#0d0a08')}, wet) * (0.6 + 0.4 * lam);
      c = mix(c, ic, 0.95 * inkv * on); c += vec3(0.5) * wet * inkv * on * pow(spec, 26.0);
    }
    // (the ochre line he gives its edges)
    float ex = min(min(vUv2.x, 1.0 - vUv2.x) * ${f3(SW)}, vUv2.y); c = mix(c, ${C('#8f7646')} * (0.45 + 0.55 * lam), 0.6 * smoothstep(0.0045, 0.0015, ex));
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
    if (sub == 0) {
      // his ink box: ochre, lightest on its top and on the end turned to the light, orange-brown on the side turned from it; mottled, and
      // worn lighter along its edges; a round boss in a sunk square on its end; black round the collar, and run down its sides from there
      vec3 q = (vColor - vec3(0.5, 0.0, 0.5)) * 0.2; vec2 b = vec2(q.x, q.y - ${f3(BH)});
      float top = smoothstep(0.070, 0.078, q.y), endf = smoothstep(0.080, 0.088, q.z), side = (1.0 - top) * (1.0 - endf);
      float mo = 0.6 * mN(vec2(q.x + q.y, q.z + 0.3 * q.y) * 55.0) + 0.4 * mN(vec2(q.x - q.y, q.z) * 190.0);
      float tone = smoothstep(-0.4, 0.85, nl + 0.22 * (mo - 0.5));
      c = mix(${C('#5f4120')}, ${C('#8e6a32')}, smoothstep(0.0, 0.5, tone)); c = mix(c, ${C('#b08f55')}, smoothstep(0.5, 1.0, tone));
      c *= (0.86 + 0.26 * mo) * (0.95 + 0.09 * mN(vec2(q.z * 30.0, (q.x + q.y) * 420.0)));
      float ex = smoothstep(0.033, 0.039, abs(q.x)), ey = smoothstep(0.033, 0.039, abs(b.y)), ez = smoothstep(0.082, 0.089, abs(q.z));
      float arris = max(ex * ey, max(ex * ez, ey * ez));
      c = mix(c, ${C('#e8cf8a')}, 0.55 * arris * (0.25 + 0.75 * tone) * (0.5 + 0.9 * mN(q.zx * 140.0 + q.y * 90.0)));
      float bd = length(b), sq = max(abs(b.x), abs(b.y));
      c *= 1.0 - endf * 0.3 * smoothstep(0.0025, 0.0, abs(sq - 0.032));
      c *= 1.0 - endf * 0.5 * smoothstep(0.003, 0.0005, abs(bd - 0.0255));
      c *= 1.0 + endf * 0.3 * smoothstep(0.024, 0.019, bd) * (0.35 + (b.x * 0.5 + b.y * 0.85) / 0.024);
      vec2 m = vec2(q.x, q.z - ${f3(MZ)}); float md = length(m) + 0.007 * (mN(m * 110.0) - 0.5);
      float lane = q.z / 0.012 + 0.7 * mN(vec2(q.y * 45.0, q.x * 20.0)), dn = mH(vec2(floor(lane), 3.0 + step(0.0, q.x))), dxm = abs(fract(lane) - 0.5) * 0.012;
      float nearc = smoothstep(0.042, 0.026, abs(q.z - ${f3(MZ)})) * step(0.4, dn);
      float reach = 0.08 - (0.012 + 0.055 * dn * dn), rw = 0.0018 + 0.0026 * dn;
      float dd = length(vec2(dxm, max(reach - q.y, 0.0))) - rw * (1.0 + 0.6 * smoothstep(reach + 0.012, reach, q.y));
      float drip = nearc * (1.0 - smoothstep(-0.0008, 0.0008, dd)) * (1.0 - endf);
      float blk = max(top * (1.0 - smoothstep(0.033, 0.037, md)), drip * max(side, top));
      c = mix(c, ${C('#0f0b08')} * (0.6 + 1.3 * tone), blk);
      c += vec3(0.6, 0.55, 0.42) * 0.25 * smoothstep(0.3, 0.95, pow(spec, 26.0)) * blk;
      c *= 1.0 - 0.4 * smoothstep(0.012, 0.0, q.y);
    } else {
      // its collar: black, turned in ribs, a dull light on each
      float tone = smoothstep(-0.4, 0.85, nl), crest = smoothstep(0.0265, 0.0295, vColor.r);
      c = mix(${C('#0c0907')}, ${C('#3b3026')}, tone * (0.45 + 0.55 * crest));
      c += vec3(0.42, 0.4, 0.36) * smoothstep(0.35, 0.95, pow(spec, 18.0)) * (0.3 + 0.7 * crest);
    }
  } else if (kind == ${K_STOP}) {
    // the stopper: its flanges black, a dull light on the rim of each, the turnings between them dark; its knob gold
    float y = vUv2.y, tone = smoothstep(-0.4, 0.85, nl);
    if (y < 0.0455) {
      float crest = smoothstep(0.021, 0.0275, vColor.r);
      c = mix(${C('#0c0907')}, ${C('#40342a')}, tone * (0.35 + 0.65 * crest)) * (0.9 + 0.2 * mN(vec2(vUv2.x * 40.0, y * 300.0)));
      c += vec3(0.4, 0.38, 0.33) * smoothstep(0.35, 0.95, pow(spec, 18.0)) * (0.25 + 0.75 * crest);
    } else { c = mix(${C('#54400f')}, ${C('#a98a3c')}, tone) * (0.9 + 0.2 * mN(vec2(vUv2.x * 25.0, y * 200.0))); c = mix(c, ${C('#ecd9a0', 0.03)}, 0.55 * smoothstep(0.3, 0.9, pow(spec, 20.0))); }
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
  // (and the soft dark where the sheet lies on the boards and hangs against the wall)
  float sx = max(max(${f3(XS0)} - vOP.x, vOP.x - ${f3(XS1)}), 0.0), low = uRl.x - uRl.z, lie;
  if (vOP.y < 0.009) lie = 0.5 * (1.0 - smoothstep(0.0, 0.15, low)) * (1.0 - smoothstep(0.0, 0.085, length(vec2(sx, max(vOP.z - uRl.y - uRl.z, 0.0)))));
  else lie = 0.3 * (1.0 - smoothstep(0.0, 0.05, length(vec2(sx, max(max(vOP.y - ${f3(HT)}, low - vOP.y), 0.0)))));
  gA = max(0.8 * shadeAll(vOP, -1), uSh.w * lie);`)
        .replace('#include <opaque_fragment>', `  outgoingLight = ${C('#0a0705', 0)}; diffuseColor.a = gA;\n#include <opaque_fragment>`);
    };
    gm.customProgramCacheKey = () => 'south-german-quill-shade-' + wall.toFixed(4);
    this.soft = new THREE.Mesh(merge(soft), gm); this.soft.name = 'shade';
    this.soft.frustumCulled = false; this.soft.matrixAutoUpdate = false; this.soft.matrix.copy(this.B); this.soft.matrixWorldNeedsUpdate = true; this.soft.renderOrder = 9;
    L.add(this.soft);

    this.pen = { X: 0, Y: 0, lift: 0, pot: 0, cut: 0, dip: 0, arc: 0, rest: 0 };
    this.Q = { p: new THREE.Vector3(), d: new THREE.Vector3(), sc: 1 }; this.K = { p: new THREE.Vector3(), rz: 0, sc: 1 };
    this.cutMid = CN.clone().addScaledVector(D_CUT, LEN * QS / 2); this.eMid = E_OUT.clone();
    this.lin = 0; this.at = 0; this.U = U0; this.arr = 0; this.hide();
  },

  // The drawing, its ink and the show's sounds: as it is drawn, or (in calm mode) the same drawing with its shade laid
  // slowly, four strokes a second at most. The second is made when it is first wanted.
  mode(calm) {
    const i = calm ? 1 : 0; if (this.modes[i]) return this.modes[i];
    const pl = plan(calm), [ink, when] = inkOf(pl.S), s = score(this.Lk);      // (the sounds, on the show's clock: the tools', and no music)
    s.hit(T_FALL[0] + 0.05, { d: 1.0, vol: 0.006, bp: 900, q: 0.7, attack: 0.4 });                                   // the feather, falling
    s.note(T_POT[1] - 0.02, 104, 0.16, { type: 'sine', vol: 0.03, to: 70, attack: 0.005 });                           // the ink box set down, and its stopper
    s.hit(T_POT[1] + 0.13, { d: 0.035, vol: 0.008, hp: 2600 });
    s.hit(T_P1[0], { d: T_P1[1] - T_P1[0] + 0.04, vol: 0.02, bp: 3000, q: 1.6, attack: 0.3 });                        // the knife through the quill, twice
    s.hit(T_P2[0], { d: T_P2[1] - T_P2[0] + 0.04, vol: 0.02, bp: 3500, q: 1.6, attack: 0.28 });
    s.hit(T_P1[1] + 0.45, { d: 0.03, vol: 0.005, hp: 4200 }); s.hit(T_P2[1] + 0.45, { d: 0.03, vol: 0.005, hp: 4600 });   // a shaving on the boards
    s.hit(T_SNICK, { d: 0.05, vol: 0.04, hp: 3600, attack: 0.001 });                                                  // the tip, cut
    s.note(T_SNICK, 1850, 0.07, { type: 'triangle', vol: 0.012, to: 1250, attack: 0.002 });
    s.hit(T_ROLL[0] + 0.1, { d: 1.0, vol: 0.02, lp: 520, attack: 0.35 });                                             // the sheet, let down
    s.hit(T_ROLL[1] - 0.04, { d: 0.14, vol: 0.014, bp: 700, q: 0.8 });
    for (const d of pl.dips) { s.note(T_PEN + d - 0.16, 1480, 0.05, { type: 'sine', vol: 0.008, attack: 0.002 }); s.note(T_PEN + d + 0.22, 880, 0.07, { type: 'sine', vol: 0.006, to: 1320, attack: 0.004 }); }      // the quill on the collar's lip; the drop
    let k = 0;
    for (const e of pl.ev) if (e.k === 'stroke') { const d = e.t1 - e.t0; k++; s.hit(T_PEN + e.t0, { d: Math.max(0.05, d), vol: e.s.hatch ? 0.006 : 0.009, bp: 2500 + 1300 * ((k * 0.618) % 1), q: 2.4, attack: Math.min(0.05, d * 0.3) }); }      // the pen on the paper
    s.done();
    return this.modes[i] = { pl, ink, when, sc: s };
  },

  // ---------------------------------------------------------------- the pen, by the drawing's clock
  // At td seconds: where on the drawing it is (X, Y), how far off the sheet, how far it has gone to the pot or is still
  // where it was cut.
  penAt(td, o) {
    const ev = this.cur.pl.ev;
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
      // (when all is drawn it is drawn aside, to the sheet's right edge and low, and what it has made is left clear)
      const up = ease.smooth(clamp01(x / 0.5)), k = e.done ? ease.inOut(clamp01((x - 0.2) / 1.1)) : ease.inOut(clamp01((x - (e.t1 - e.t0) + 0.6) / 0.6));
      o.X = lerp(e.from[0], e.to[0], k); o.Y = lerp(e.from[1], e.to[1], k); o.lift = 0.035 * up * (e.done ? 1 : 1 - k * 0.8); o.rest = up * (e.done ? 1 : 1 - k);
    }
    return o;
  },
  // The pen's point and the way the shaft stands, in the stage's frame, at td.
  nibAt(td, p, d) {
    const o = this.penAt(td, this.pen), V = this.V;
    this.paperPoint(o.X, o.Y, o.lift + 0.0015, p);
    if (o.pot > 0) p.lerp(V.c.set(MOUTH.x, MOUTH.y + lerp(0.065, -0.028, o.dip), MOUTH.z), o.pot);
    p.y += o.arc;
    if (o.cut > 0) p.lerp(CN, o.cut);
    d.copy(D_PAPER).lerp(D_POT, o.pot).lerp(D_CUT, o.cut * (2 - o.cut)).normalize();      // (it is stood up only as it nears the box)
    return o;
  },

  // ---------------------------------------------------------------- everything, by the show's clock
  pose(t, calm) {
    const V = this.V, Q = this.Q, K = this.K, F = this.F, M = this.M, G = this.G, u = this.u, k = calm ? 0.5 : 1, td = t - T_PEN;
    F.fill(0);
    const md = this.mode(calm); if (md !== this.cur) { this.cur = md; u.uInk.value = md.ink; u.uWhen.value = md.when; }
    // ---- the quill
    if (td <= 0) {
      const q = ramp(t, T_FALL[0], T_FALL[1]), e = ease.inOut(q), ph = q * TAU * 1.25, left = 1 - q, settle = 1 - ramp(t, T_PEN - 0.3, T_PEN);
      Q.sc = lerp(0.3, QS, ease.out(q));
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
      Q.d.normalize(); Q.sc = QS; F[1] = 1;
      // (it never stands so high over the sheet that its feather would come before his picture for an eye on the floor: worked near the
      // sheet's top it lies over along the wall, and stands the freer the lower it goes)
      const sum = Q.d.y + GK * Q.d.z, room = (this.yb - 0.10 - Q.p.y - GK * Q.p.z) / (LEN * QS * 1.03), lim = lerp(Math.max(room, 0.04), sum, ease.smooth(ramp(o.pot, 0.5, 0.92)));
      if (sum > lim) { const kk = lim / sum; Q.d.y *= kk; Q.d.z *= kk; Q.d.x = Math.sqrt(Math.max(0, 1 - Q.d.y * Q.d.y - Q.d.z * Q.d.z)); }
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
        cx += (i ? 0.08 : -0.02) * run - RHO * rock; cz += (i ? 0.13 : 0.07) * run; th = (i ? -1 : 1) * 2.6 * k * f + rock + 0.5 * ease.out(clamp01(x * 12)) * (i ? -1 : 1); yaw = (i ? -0.45 : 0.4) * run;
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
      M[4].makeRotationFromEuler(V.e.set(rock, -0.45, -PI / 2 - 0.05, 'YXZ')).scale(V.a.setScalar(PS)).setPosition(STX - 0.045 * PS, 0.0285 * PS + 0.12 * (1 - b), STZ - 0.022 * PS);
    }
    // ---- the sheet, let down the wall and out along the floor
    {
      const q = ramp(t, T_ROLL[0] + 0.38, T_ROLL[1]), e = 1 - Math.pow(1 - Math.pow(q, 1.5), 1.6), x = t - T_ROLL[1];
      this.U = U0 + (S_END - U0) * e - (x > 0 && !calm ? 0.022 * Math.exp(-7 * x) * Math.abs(Math.sin(11 * x)) : 0);
      F[0] = ramp(t, T_ROLL[0], T_ROLL[0] + 0.2); this.arr = ease.inOut(ramp(t, T_ROLL[0], T_ROLL[0] + 0.45));
    }
    // ---- the drop that falls back into the pot after the pen is filled
    {
      let last = -1; for (const d of this.cur.pl.dips) if (d <= td) last = d;
      const x = last < 0 ? -1 : td - last - 0.12; F[8] = x > 0 && x < 0.19 ? 1 : 0;
      M[8].makeTranslation(MOUTH.x + 0.003, MOUTH.y + 0.06 - 2.0 * Math.max(0, x) * Math.max(0, x), MOUTH.z + 0.003);
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
  start(L, resumed) { this.lin = resumed ? this.at - L.t : 0; this.snd = null; },
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
    if (showing) { const md = this.mode(calm); if (md !== this.snd) { this.snd = md; md.sc.from(t < 0.1 ? 0 : t); } md.sc.play(t); }
    if (showing && !TOLD && !L.quiet && t > T_SNICK + 0.5) { TOLD = true; L.k.say('He has stopped drawing to cut his quill pen. Here it is cut, dipped and tried, and it draws the hill outside his window.', 6); }
    this.pose(t, calm);
    if (back) this.goBack(L.ret);
    this.commit();
    if (back && L.ret >= 1) this.hide();
  },
});
