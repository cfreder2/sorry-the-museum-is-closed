// Attributed to Alessandro Allori, Francesco de' Medici (about 1560), Gallery 205. The word: cameo.
//
// The Duke of Florence's eldest son, a young man in a red doublet worked all over with gold thread, stands at the
// corner of a table. One hand lies on a small book bound in green, tied shut with green silk; the other holds up,
// between two fingers, an oval of gold no bigger than a walnut. The museum's note: he "is shown here displaying a
// cameo of an unidentified female figure, highlighting his interest in collecting", and he came to rule "only
// grudgingly, preferring a life of scholarship to statecraft". So the picture is of a showing: he has taken a small
// carved thing out to let us see it. But look closely and he is holding it on its side. The carved head lies towards
// his knuckles and the bust towards his fingertips; from across a gallery it is a gold coin. Nobody in front of this
// picture has ever quite been shown what he is showing. So the show finishes the gesture: it turns the cameo the
// right way up.
//
// Look at it and the dark of his curtain gathers low on the wall under the picture, and the corner of his table
// comes out of it, set at the slant he painted it at, with the green book on it and its ribbon lying loose in front,
// one fold standing up; the fold quivers when the table stops. On the book's cover lies the cameo, on its back: from
// here only an oval of dull gold. A thread of light goes once round its rim. Then it is lifted, as if by the two
// fingers in the picture: its far edge leaves the book, it tips up towards you and hangs, still on its side, exactly
// as he holds it up there. A beat. Then it is turned: a slow quarter turn in its own plane as it comes forward, the
// head rising to the top, until it stands upright in front of you in his light, which comes from high on the left
// and rakes across it; and the gold is a woman, in profile: her brow, nose and lips, her bound hair gathered at the
// nape, the long folds of the cloth over her shoulder, each edge with its light and its small shadow on the ground
// beside it. One soft chord. A little of the gold's light lies on the green cover under it. While you keep looking
// it stays; now and then it is turned a little to the light and back, as a hand turns a carved thing to see it, and
// the shadows in the hair and under the jaw slide. When you stop looking it stays out while the toy is near, and
// the toy is the candle: the light on the carving comes from wherever the toy is, so driving round the table turns
// the shadows across her face. Drive off, or leave it a while, and it turns back onto its side, is laid on the book,
// the table goes home and the dark lifts.
//
// The carving is ours, in the manner of the one he holds (the picture gives it some forty brushmarks: a head facing
// right, hair, a draped bust cut in a long curve): a height drawn once into a small canvas, its slopes kept as a
// texture, so that the light on it is worked out and not drawn. Nothing here takes the room's light: his light is in
// the paint (one smooth mesh, one shader). Gold is painted as he painted the buttons and the thread: brown in the
// shade, ochre, then lemon, then one pale touch. The table's top is his dull olive grey; its side is a brown he
// brushed downwards, read here as a cover hanging in a few soft folds; the covers are a green that is nearly black,
// with a thread of light along the lit edges; the leaves of the book are stained red; the ribbon is silk, dark with
// one long light on it where it turns. The book is about four times the size he painted it and the cameo nearly six
// (in the picture it is the size of a thumbnail, and here it has to carry the look across a room).
//
// No tune: the table, the ribbon's whisper, a tick as the cameo leaves the cover, and one chord when it stands
// upright (G, the D over it, the G above and a faint B, plucked: not a quotation). Two draw calls (the table with
// all that is on it; the dark and the shade on the floor). Nothing stands higher than 0.61 m, under a picture whose
// frame begins at 1.05 m. Botticelli's Virgin and Child with an Angel hangs a hand's width to the left: the table
// keeps to this picture's own stretch of wall and the clear wall on its right, none of it under the Botticelli, and
// the dark is a low pool that leans the same way and stops under the frames (the pictures and their labels keep
// their light). From the look camera, the toy's eye and the floor the guard has nothing to cut. Nothing is solid to
// the toy. With "Reduce motion and flashing" on: no light runs round the rim, the fold does not quiver, the later
// turns to the light are half as far, the dark comes more slowly, the toy's light comes round more slowly, and
// everything is quieter; nothing flashes at any setting.
//
// What it does not do: he stays in his picture, and nothing of him is made (no figure, no hand: he was a real
// person, and young, and the lifting is done from the wall, as his fingers do it). The woman on the cameo is given
// no name, no story and no likeness to anybody: the museum calls her unidentified, and so she stays; she is a
// carving, in profile, and she does not move, look out or follow the toy (only the light does). The book stays shut
// and tied (the museum does not say what it is). His sword stays in the picture, and so do the chair behind him and
// the gold of his doublet.

import * as THREE from 'three';
import { lifeFor, ease, ramp, clamp01, lerp } from '../paintlife.js';
import { score } from './stagecraft.js';

const PI = Math.PI, TAU = PI * 2;
// The stage's own metres: x along the wall (to the viewer's right), y up from the floor, z out from the picture's
// plane into the room.
const TH = 0.22;                                   // his table: how high it stands
const TA = 0.14, TX = 0.115, TZ = 0.96;            // set at a slant: its front edge runs back to the right (the angle; a point on that edge)
const XL = 0.52, XR = 0.72, DEEP = 1.5;            // along the front edge, left and right of that point; how far back it is made (into the wall)
const BX = -0.03, BZ = -0.5, BYAW = -0.06, BS = 1.5;      // the book, on the table (in the table's own frame: x along its front edge, z out across it), and how much larger than it is set down below
const CS = 1.6;                                    // and the cameo, likewise
const BL = 0.25, BD = 0.165, BH = 0.08, COVER = 0.008, INSET = 0.007;      // its half length and depth, its height, a cover's thickness, how far the covers stand proud of the leaves
const TIE = -0.125;                                // where the tie goes round it (along the book)
const CA = 0.105, CB = 0.084, CT = 0.012, RELIEF = 0.0105;      // the cameo: half height, half width, thickness, how high the carving stands
const REST = [0.105, 0.004];                       // where it lies on the cover (in the book's frame)
const SUN = new THREE.Vector3(-0.62, 0.62, 0.48).normalize();      // the way to his light: upper left, in front
// The show, in seconds.
const T_OUT = [0, 1.2], T_LIGHT = [0.05, 1.5], T_RIM = [1.55, 2.2], T_LIFT = [2.2, 3.35], T_TURN = [3.85, 5.45], T_SHOW = 5.45, PERIOD = 6.4, ROCK = [2.3, 5.1];
const KEY = 0.5;                                   // (the game's film curve lifts what the room does not light: the paint is laid that much lower)
let TOLD = false;                                  // (the game says what happens once, the first time)
const sstep = (a, b, x) => { const q = clamp01((x - a) / (b - a)); return q * q * (3 - 2 * q); };
const K_TABLE = 0, K_BOOK = 1, K_PAGES = 2, K_RIBBON = 3, K_CAMEO = 4;
const M_STILL = 0, M_CAMEO = 1, M_FOLD = 2;
const P_DARK = 0, P_FLOOR = 1;

// ---------------------------------------------------------------- geometry
// A smooth surface from a rule: f(u, v, o) sets o.p (a point), and may set o.c (what the shader is to know of it),
// o.t (where on its part it lies; u, v if it does not) and o.w, for u, v in 0..1. Its normals are taken from the rule.
// Every vertex says what it is (aK: kind, what moves it, which part) and carries aC (a number, in w).
const _o = { p: new THREE.Vector3(), c: new THREE.Color(), t: new THREE.Vector2(), w: 0 }, _q = [0, 1, 2, 3].map(() => new THREE.Vector3()), _n = new THREE.Vector3();
function surf(nu, nv, f, kind = 0, move = 0, sub = 0) {
  const W = nv + 1, n = (nu + 1) * W, P = new Float32Array(n * 3), N = new Float32Array(n * 3), C = new Float32Array(n * 3), T = new Float32Array(n * 2), Wt = new Float32Array(n), e = 2e-3;
  const at = (u, v, into) => { f(u, v, _o); return into.copy(_o.p); };
  for (let i = 0; i <= nu; i++) for (let j = 0; j <= nv; j++) {
    const u = i / nu, v = j / nv, k = i * W + j;
    _o.t.set(u, v); _o.w = 0; _o.c.setRGB(1, 1, 1); f(u, v, _o);
    P[k * 3] = _o.p.x; P[k * 3 + 1] = _o.p.y; P[k * 3 + 2] = _o.p.z; C[k * 3] = _o.c.r; C[k * 3 + 1] = _o.c.g; C[k * 3 + 2] = _o.c.b; T[k * 2] = _o.t.x; T[k * 2 + 1] = _o.t.y; Wt[k] = _o.w;
    const uu = Math.min(1 - e, Math.max(e, u)), vv = Math.min(1 - e, Math.max(e, v));
    at(uu + e, vv, _q[0]).sub(at(uu - e, vv, _q[1])); at(uu, vv + e, _q[2]).sub(at(uu, vv - e, _q[3]));
    _n.crossVectors(_q[0], _q[2]); if (_n.lengthSq() < 1e-24) _n.set(0, 1, 0); else _n.normalize();
    N[k * 3] = _n.x; N[k * 3 + 1] = _n.y; N[k * 3 + 2] = _n.z;
  }
  const m = nu * nv * 6, pos = new Float32Array(m * 3), nor = new Float32Array(m * 3), col = new Float32Array(m * 3), uv = new Float32Array(m * 2), ak = new Float32Array(m * 3), ac = new Float32Array(m * 4); let w = 0;
  const put = k => { for (let c = 0; c < 3; c++) { pos[w * 3 + c] = P[k * 3 + c]; nor[w * 3 + c] = N[k * 3 + c]; col[w * 3 + c] = C[k * 3 + c]; } uv[w * 2] = T[k * 2]; uv[w * 2 + 1] = T[k * 2 + 1]; ak[w * 3] = kind; ak[w * 3 + 1] = move; ak[w * 3 + 2] = sub; ac[w * 4 + 3] = Wt[k]; w++; };
  for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) { const a = i * W + j, b = (i + 1) * W + j, c = (i + 1) * W + j + 1, d = i * W + j + 1; put(a); put(b); put(d); put(b); put(c); put(d); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.setAttribute('aUv', new THREE.BufferAttribute(uv, 2)); g.setAttribute('aK', new THREE.BufferAttribute(ak, 3)); g.setAttribute('aC', new THREE.BufferAttribute(ac, 4));
  return g;
}
function merge(list) {
  let n = 0; for (const g of list) n += g.attributes.position.count;
  const out = new THREE.BufferGeometry();
  for (const [name, k] of [['position', 3], ['normal', 3], ['color', 3], ['aUv', 2], ['aK', 3], ['aC', 4]]) { const a = new Float32Array(n * k); let o = 0; for (const g of list) { a.set(g.attributes[name].array, o); o += g.attributes[name].array.length; } out.setAttribute(name, new THREE.BufferAttribute(a, k)); }
  return out;
}
// A flat face: from p0, W along eu and H along ev. The shader is told where on it a point lies, in metres (aUv), and
// how big the face is (color: W, H, and one number more).
function face(p0, eu, ev, W, H, kind, sub, extra = 0) {
  return surf(1, 1, (u, v, o) => { o.p.set(p0[0] + eu[0] * u * W + ev[0] * v * H, p0[1] + eu[1] * u * W + ev[1] * v * H, p0[2] + eu[2] * u * W + ev[2] * v * H); o.t.set(u * W, v * H); o.c.setRGB(W, H, extra); }, kind, M_STILL, sub);
}
// A ribbon along a path: hw wide each way, th thick, lying as side0 says at its start and carried along from there
// without twisting, but for twist(v) (radians). aUv: across it (-1..1), along it (0..1); color.r: its upper face.
function ribbon(pts, hw, th, nv, side0, twist, sub, weight = null) {
  const curve = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(p[0], p[1], p[2])), false, 'centripetal'), K = 96, T = [], S = [];
  let s = new THREE.Vector3(side0[0], side0[1], side0[2]);
  for (let i = 0; i <= K; i++) { const t = curve.getTangent(i / K, new THREE.Vector3()); s = s.clone().addScaledVector(t, -s.dot(t)).normalize(); T.push(t); S.push(s); }
  const c = new THREE.Vector3(), t = new THREE.Vector3(), sd = new THREE.Vector3(), nn = new THREE.Vector3();
  return surf(8, nv, (u, v, o) => {
    curve.getPoint(v, c); const f = v * K, i = Math.min(K - 1, Math.floor(f)), k = f - i;
    t.copy(T[i]).lerp(T[i + 1], k).normalize(); sd.copy(S[i]).lerp(S[i + 1], k); sd.addScaledVector(t, -sd.dot(t)).normalize();
    if (twist) sd.applyAxisAngle(t, twist(v));
    nn.crossVectors(t, sd);
    const a = u * TAU; o.p.copy(c).addScaledVector(sd, hw * Math.cos(a)).addScaledVector(nn, th * Math.sin(a));
    o.t.set(Math.cos(a), v); o.c.setRGB(Math.sin(a) >= 0 ? 1 : 0, 0, 0); o.w = weight ? weight(v) : 0;
  }, K_RIBBON, weight ? M_FOLD : M_STILL, sub);
}

const NOISE = /* glsl */`
float mH(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float mN(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mH(i), mH(i + vec2(1.0, 0.0)), f.x), mix(mH(i + vec2(0.0, 1.0)), mH(i + vec2(1.0, 1.0)), f.x), f.y); }
float sq(float x) { return x * x; }
float seg(vec2 p, vec2 a, vec2 b) { vec2 pa = p - a, ba = b - a; return length(pa - ba * clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0)); }
float boxd(vec2 p, vec2 h) { vec2 e = abs(p) - h; return length(max(e, 0.0)) + min(max(e.x, e.y), 0.0); }`;
const f3 = x => x.toFixed(4), v2 = (x, y) => `vec2(${x.toFixed(4)}, ${y.toFixed(4)})`, v3g = v => `vec3(${v.x.toFixed(4)}, ${v.y.toFixed(4)}, ${v.z.toFixed(4)})`;

// The carving on the cameo: a height for every point of the oval (0: the ground; up to 1), drawn once with a 2D canvas.
// It is ours, in the manner of the one he holds: a woman's head and draped bust in profile, facing right, the hair
// bound and gathered at the nape, the bust cut off in a long curve. u runs 0..1 across, v 0..1 down; the field is the
// ellipse about (0.5, 0.5) with radii 0.43.
function carve(W, H) {
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d', { willReadFrequently: true });
  const n = W * H, tmp = new Float32Array(n);
  const sst = (a, b, x) => { const q = Math.min(1, Math.max(0, (x - a) / (b - a))); return q * q * (3 - 2 * q); };
  const box = (m, r) => {
    for (let pass = 0; pass < 2; pass++) {
      const horiz = pass === 0, len = horiz ? W : H, lines = horiz ? H : W, step = horiz ? 1 : W, k = 1 / (2 * r + 1);
      for (let l = 0; l < lines; l++) {
        const o = horiz ? l * W : l; let s = 0;
        for (let i = -r; i <= r; i++) s += m[o + Math.min(len - 1, Math.max(0, i)) * step];
        for (let i = 0; i < len; i++) { tmp[o + i * step] = s * k; s += m[o + Math.min(len - 1, i + r + 1) * step] - m[o + Math.max(0, i - r) * step]; }
      }
      m.set(tmp);
    }
  };
  const tap = m => {
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = y * W + x; tmp[i] = 0.25 * m[y * W + Math.max(0, x - 1)] + 0.5 * m[i] + 0.25 * m[y * W + Math.min(W - 1, x + 1)]; }
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = y * W + x; m[i] = 0.25 * tmp[Math.max(0, y - 1) * W + x] + 0.5 * tmp[i] + 0.25 * tmp[Math.min(H - 1, y + 1) * W + x]; }
  };
  // (sigma in thousandths of the width, so the carving is the same at any size)
  const blur = (m, sig) => { const s = sig * W / 1000; if (s < 0.45) return m; if (s < 1.3) { tap(m); if (s > 0.9) tap(m); return m; } const r = Math.max(1, Math.round((Math.sqrt(4 * s * s + 1) - 1) / 2)); box(m, r); box(m, r); box(m, r); return m; };
  const mask = (fn, sig = 0) => {
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#fff'; g.strokeStyle = '#fff'; g.lineCap = 'round'; g.lineJoin = 'round'; fn(g);
    const d = g.getImageData(0, 0, W, H).data, m = new Float32Array(n); for (let i = 0; i < n; i++) m[i] = d[i * 4] / 255;
    return blur(m, sig);
  };
  // (set down a little differently from how it was first drawn: the head larger and lower, the bust larger, the neck shorter)
  const wk = v => sst(0.565, 0.67, v), ks = v => 1.13 + (1.06 - 1.13) * wk(v);
  const warp = ([u, v]) => { const k = wk(v), hu = 0.50 + (u - 0.50) * 1.13, hv = 0.36 + (v - 0.36) * 1.13 + 0.038, bu = 0.48 + (u - 0.48) * 1.06, bv = 0.80 + (v - 0.80) * 1.06 - 0.004; return [hu + (bu - hu) * k, hv + (bv - hv) * k]; };
  // a smooth line through points (Catmull-Rom), closed or open
  const path = (pts, closed) => {
    const P = pts.map(warp).map(([u, v]) => [u * W, v * H]), N = P.length, at = i => (closed ? P[(i + N) % N] : P[Math.max(0, Math.min(N - 1, i))]);
    g.beginPath(); g.moveTo(P[0][0], P[0][1]);
    for (let i = 0; i < (closed ? N : N - 1); i++) {
      const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2), t = 1 / 6;
      g.bezierCurveTo(p1[0] + (p2[0] - p0[0]) * t, p1[1] + (p2[1] - p0[1]) * t, p2[0] - (p3[0] - p1[0]) * t, p2[1] - (p3[1] - p1[1]) * t, p2[0], p2[1]);
    }
    if (closed) g.closePath();
  };
  const fill = (pts) => () => { path(pts, true); g.fill(); };
  const line = (pts, w) => () => { g.lineWidth = w * W * ks(pts[0][1]); path(pts, false); g.stroke(); };
  const oval = (u, v, ru, rv, rot = 0) => () => { const [cu, cv] = warp([u, v]), k = ks(v); g.beginPath(); g.ellipse(cu * W, cv * H, ru * k * W, rv * k * H, rot, 0, Math.PI * 2); g.fill(); };
  const many = (...fs) => () => { for (const f of fs) f(); };

  // ---- her outline: brow, nose, lips and chin down the right; the bust; the nape; the hair over the crown
  const FACE = [[0.612, 0.212], [0.640, 0.240], [0.659, 0.268], [0.665, 0.298], [0.659, 0.320], [0.667, 0.346], [0.679, 0.376], [0.689, 0.396], [0.685, 0.407], [0.671, 0.414],
    [0.668, 0.426], [0.676, 0.439], [0.676, 0.449], [0.665, 0.456], [0.671, 0.466], [0.669, 0.477], [0.655, 0.489], [0.653, 0.503], [0.655, 0.518], [0.644, 0.535], [0.624, 0.547],
    [0.590, 0.553], [0.565, 0.565], [0.553, 0.594], [0.553, 0.640], [0.567, 0.690]];
  const BUST = [[0.612, 0.735], [0.668, 0.775], [0.706, 0.815], [0.700, 0.842], [0.640, 0.872], [0.540, 0.898], [0.430, 0.892], [0.330, 0.858], [0.262, 0.800], [0.244, 0.752], [0.262, 0.722], [0.312, 0.700], [0.366, 0.676], [0.400, 0.640], [0.410, 0.596], [0.402, 0.556]];
  const BACK = [[0.384, 0.522], [0.346, 0.470], [0.318, 0.400], [0.314, 0.320], [0.338, 0.242], [0.392, 0.182], [0.468, 0.150], [0.545, 0.158]];
  const ALL = [...FACE, ...BUST, ...BACK];
  // the hair: from the brow back over the crown, down behind the ear to the nape; and the knot it is gathered into
  const HAIR = [[0.612, 0.212], [0.602, 0.250], [0.580, 0.290], [0.548, 0.322], [0.514, 0.340], [0.482, 0.352], [0.462, 0.384], [0.452, 0.430], [0.440, 0.490], [0.420, 0.540], [0.402, 0.556],
    ...BACK];
  const KNOT = oval(0.352, 0.486, 0.062, 0.082, 0.35);
  // the neck and bust, below the jaw
  const NECK = [[0.640, 0.560], [0.596, 0.566], [0.566, 0.574], [0.540, 0.556], [0.514, 0.530], [0.497, 0.500], [0.488, 0.462], [0.470, 0.430], [0.38, 0.40], [0.25, 0.45], [0.2, 0.75], [0.2, 0.95], [0.75, 0.95], [0.75, 0.75], [0.60, 0.66]];
  // the cloth over the shoulder: its edge runs from the nape round the base of the neck to the breast
  const CLOTH = [[0.398, 0.628], [0.440, 0.672], [0.500, 0.704], [0.560, 0.722], [0.612, 0.735], [0.75, 0.80], [0.75, 0.95], [0.2, 0.95], [0.2, 0.70], [0.34, 0.655]];

  const S = mask(many(fill(ALL), KNOT), 1.6);                       // what is carved at all
  const round = mask(many(fill(ALL), KNOT), 30);                    // (and how far in from its edge: the forms are full, not flat)
  const hair = mask(many(fill(HAIR), KNOT), 2.2), neck = mask(fill(NECK), 5.0), cloth = mask(fill(CLOTH), 2.6);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = S[i] * (0.30 + 0.34 * sst(0.25, 0.95, round[i]));
  const add = (m, k, within = null) => { for (let i = 0; i < n; i++) out[i] += k * m[i] * (within ? within[i] : 1); };
  for (let i = 0; i < n; i++) neck[i] *= 1 - hair[i];
  add(neck, -0.075, S); add(hair, 0.13, S); add(cloth, 0.10, S);
  // the face: the cheek full, the brow's ridge, the eye in its hollow under it, the wing of the nose, the lips, the chin
  add(mask(oval(0.585, 0.432, 0.058, 0.064), 16), 0.10, S);
  add(mask(oval(0.647, 0.517, 0.020, 0.024), 6), 0.05, S);
  add(mask(line([[0.664, 0.300], [0.640, 0.297], [0.606, 0.306]], 0.012), 4), 0.07, S);
  add(mask(oval(0.633, 0.330, 0.024, 0.012, 0.1), 3.5), -0.085, S);
  add(mask(oval(0.628, 0.336, 0.0145, 0.0065, 0.1), 1.6), 0.06, S);
  add(mask(line([[0.648, 0.328], [0.630, 0.325], [0.611, 0.333]], 0.0045), 1.2), 0.03, S);
  add(mask(oval(0.670, 0.400, 0.013, 0.010), 3), 0.055, S);
  add(mask(oval(0.676, 0.409, 0.005, 0.0033), 1.5), -0.035, S);
  add(mask(line([[0.667, 0.456], [0.653, 0.4555], [0.645, 0.458]], 0.004), 1.6), -0.055, S);
  add(mask(oval(0.663, 0.443, 0.013, 0.008), 2.5), 0.04, S); add(mask(oval(0.660, 0.469, 0.012, 0.008), 2.5), 0.04, S);
  add(mask(line([[0.644, 0.420], [0.634, 0.438], [0.634, 0.452]], 0.005), 5), -0.014, S);                                   // (the soft line from the nose's wing past the mouth)
  // the ear, and the hollow in it
  add(mask(oval(0.490, 0.396, 0.019, 0.036, -0.18), 1.6), 0.09, S); add(mask(oval(0.493, 0.392, 0.008, 0.019, -0.18), 2), -0.075, S);
  add(mask(oval(0.486, 0.428, 0.008, 0.010), 1.5), 0.02, S);
  // the hair: bound with a band, combed back in waves from the brow to the knot, the knot wound round
  for (const [gain, wd, list] of [[0.10, 0.011, [0.02, 0.36, 0.7]], [0.07, 0.008, [0.19, 0.53, 0.86]], [0.05, 0.006, [0.11, 0.44, 0.62, 0.95]]]) {
    add(mask(many(...list.map((a, j) => {                           // a: from the crown's edge (0) down to the temple (1)
      const w = 0.006 * Math.sin(a * 23 + j);
      return line([[0.600 - 0.03 * a, 0.222 + 0.075 * a], [0.540 - 0.045 * a, 0.184 + 0.125 * a + w], [0.455 - 0.035 * a, 0.198 + 0.150 * a - w], [0.382 + 0.01 * a, 0.278 + 0.125 * a + w], [0.348 + 0.02 * a, 0.380 + 0.07 * a]], wd);
    })), 2.2), gain, hair);
  }
  const band = [[0.607, 0.232], [0.540, 0.238], [0.470, 0.262], [0.410, 0.304], [0.368, 0.356]];
  add(mask(line(band, 0.02), 1.6), -0.07, hair); add(mask(line(band, 0.0085), 1.3), 0.10, hair);
  const coil = [];
  for (let k = 0; k < 4; k++) { const r = 0.016 + 0.014 * k, pts = []; for (let j = 0; j <= 10; j++) { const t = -2.4 + j * 0.36 + k * 0.5; pts.push([0.352 + r * 0.82 * Math.cos(t + 0.35), 0.486 + r * 1.15 * Math.sin(t)]); } coil.push(line(pts, 0.0075)); }
  add(mask(many(...coil), 1.8), 0.075, hair);
  add(mask(line([[0.452, 0.372], [0.445, 0.420], [0.432, 0.470], [0.416, 0.520]], 0.008), 1.8), 0.05, hair);
  add(mask(line([[0.470, 0.352], [0.462, 0.400], [0.448, 0.455], [0.430, 0.510]], 0.006), 1.8), -0.04, hair);
  // the cloth: long folds falling from the shoulder across to the breast, and its rolled edge at the neck
  const folds = [
    [[0.300, 0.712], [0.380, 0.726], [0.470, 0.752], [0.560, 0.790], [0.640, 0.836]],
    [[0.272, 0.752], [0.350, 0.770], [0.440, 0.800], [0.530, 0.838], [0.590, 0.870]],
    [[0.280, 0.806], [0.350, 0.826], [0.430, 0.852], [0.500, 0.880]],
    [[0.400, 0.672], [0.470, 0.708], [0.550, 0.738], [0.630, 0.775], [0.690, 0.818]],
  ];
  add(mask(many(...folds.map(f => line(f, 0.021))), 5.5), 0.16, cloth);
  add(mask(many(...folds.map(f => line(f.map(([u, v]) => [u - 0.012, v + 0.027]), 0.012))), 4.5), -0.10, cloth);
  add(mask(line([[0.400, 0.634], [0.440, 0.674], [0.500, 0.708], [0.560, 0.727], [0.615, 0.741]], 0.017), 2.6), 0.085, S);
  add(mask(oval(0.335, 0.760, 0.085, 0.07, 0.4), 16), 0.09, cloth);                                                        // (the shoulder, full under it)
  for (let i = 0; i < n; i++) out[i] = Math.min(1, Math.max(0, out[i])) * sst(0.02, 0.55, S[i]);
  blur(out, 1.1);
  return { h: out, figure: S, hair };
}

lifeFor(24684, {
  title: /^Francesco de.? ?Medici/,
  word: 'cameo',
  // (a work under 1.2 m high: the kit keeps the whole of it in view, in the upper part, with his table below it)
  stage: { out: 2.0, half: 1.1, cam: { dist: 2.2, side: 0.3, height: 0.8, fov: 54, lookU: 0, lookOut: 0.5, lookH: 0.95, floorOut: 0.96 } },
  wake: 2, ret: 2.3,
  linger: { near: 3.5, max: 30 },

  build(L) {
    const P = L.pal, col = (h, a = 0.06) => P.near(h, a), C = (h, a) => { const c = col(h, a); return `vec3(${c.r.toFixed(4)}, ${c.g.toFixed(4)}, ${c.b.toFixed(4)})`; };
    const V = this.V = { a: new THREE.Matrix4(), q: new THREE.Quaternion(), q2: new THREE.Quaternion(), e: new THREE.Euler(), v: new THREE.Vector3(), w: new THREE.Vector3(), one: new THREE.Vector3(1, 1, 1) };
    this.B = new THREE.Matrix4().makeBasis(new THREE.Vector3(L.tx, 0, L.tz), new THREE.Vector3(0, 1, 0), new THREE.Vector3(L.nx, 0, L.nz)).setPosition(L.floor(0, 0));
    this.Binv = this.B.clone().invert();
    const wall = this.wall = L.wall;
    // the table's frame, and the book's on it
    const TM = new THREE.Matrix4().makeRotationY(TA).setPosition(TX, 0, TZ);
    const inT = new THREE.Matrix4().makeRotationY(BYAW).scale(new THREE.Vector3(BS, BS, BS)).setPosition(BX, TH, BZ), BM = TM.clone().multiply(inT);
    const parts = [], on = (g, m) => { g.applyMatrix4(m); return g; };

    // ------------------------------------------------------------ his table: its top, its front, its two ends
    parts.push(on(surf(1, 1, (u, v, o) => { const x = lerp(-XL, XR, u), z = lerp(0, -DEEP, v); o.p.set(x, TH, z); o.t.set(x, z); }, K_TABLE, M_STILL, 0), TM));
    const hang = (x, v) => (0.008 * Math.sin(x * 13 + 0.6) + 0.004 * Math.sin(x * 37 + 2.1) + 0.006 * Math.sin(x * 6.3)) * Math.pow(1 - v, 1.3);      // (its cover hangs in a few soft folds, fuller towards the floor)
    parts.push(on(surf(72, 5, (u, v, o) => { const x = lerp(-XL, XR, u); o.p.set(x, lerp(-0.004, TH, v), hang(x, v)); o.t.set(x + XL, v * (TH + 0.004)); }, K_TABLE, M_STILL, 1), TM));
    parts.push(on(face([XR, -0.004, 0], [0, 0, -1], [0, 1, 0], DEEP, TH + 0.004, K_TABLE, 2), TM));
    parts.push(on(face([-XL, -0.004, -DEEP], [0, 0, 1], [0, 1, 0], DEEP, TH + 0.004, K_TABLE, 3), TM));
    parts.push(on(face([-XL, 0.002, -DEEP], [1, 0, 0], [0, 0, 1], XL + XR, DEEP, K_TABLE, 4), TM));      // (its underside: the polished floor shows what is under things)

    // ------------------------------------------------------------ the book: two green covers, the red leaves between, tied
    {
      const cover = y0 => {
        parts.push(on(face([-BL, y0, BD], [1, 0, 0], [0, 1, 0], 2 * BL, COVER, K_BOOK, 1, 0), BM));                    // its edges: towards you,
        parts.push(on(face([BL, y0, BD], [0, 0, -1], [0, 1, 0], 2 * BD, COVER, K_BOOK, 1, 1), BM));                    // to the right,
        parts.push(on(face([-BL, y0, -BD], [0, 0, 1], [0, 1, 0], 2 * BD, COVER, K_BOOK, 1, 2), BM));                   // to the left
      };
      cover(0); cover(BH - COVER);
      parts.push(on(face([-BL, BH, BD], [1, 0, 0], [0, 0, -1], 2 * BL, 2 * BD, K_BOOK, 0), BM));                         // the upper cover's face
      parts.push(on(face([-BL, BH - COVER, BD], [1, 0, 0], [0, 0, -1], 2 * BL, 2 * BD, K_BOOK, 3), BM));                 // (and under its overhang)
      parts.push(on(face([-BL, COVER, BD], [1, 0, 0], [0, 0, -1], 2 * BL, 2 * BD, K_BOOK, 4), BM));                      // (the lower cover's ledge, round the leaves)
      parts.push(on(face([BL, 0, -BD], [-1, 0, 0], [0, 1, 0], 2 * BL, BH, K_BOOK, 2), BM));                              // the spine, away from you
      const bl = BL - INSET, bd = BD - INSET;
      parts.push(on(face([-bl, COVER, bd], [1, 0, 0], [0, 1, 0], 2 * bl, BH - 2 * COVER, K_PAGES, 0), BM));             // the leaves: their fore-edge,
      parts.push(on(face([bl, COVER, bd], [0, 0, -1], [0, 1, 0], bd + BD, BH - 2 * COVER, K_PAGES, 1), BM));            // the foot,
      parts.push(on(face([-bl, COVER, -BD], [0, 0, 1], [0, 1, 0], bd + BD, BH - 2 * COVER, K_PAGES, 2), BM));           // the head
      // the tie round it: up the fore-edge, slack over the cover, down behind
      const g = 0.003;
      parts.push(on(ribbon([[TIE, 0.006, BD + 0.012], [TIE, 0.026, BD + g + 0.001], [TIE, 0.058, BD + g], [TIE, BH - 0.004, BD + g], [TIE, BH + g + 0.002, BD - 0.008], [TIE + 0.002, BH + 0.016, BD - 0.06], [TIE + 0.003, BH + 0.011, BD - 0.14],
        [TIE + 0.002, BH + g, BD - 0.22], [TIE, BH + g, -BD + 0.01], [TIE, BH - 0.004, -BD - g], [TIE, 0.03, -BD - g], [TIE, 0.004, -BD - 0.006]], 0.0165, 0.0022, 56, [-1, 0, 0], null, 0), BM));
      // its knot, at the foot of the fore-edge
      parts.push(on(surf(12, 8, (u, v, o) => { const ph = u * TAU, th = (v - 0.5) * PI, k = 1 + 0.18 * Math.sin(ph * 2 + 0.6) * Math.cos(th); o.p.set(TIE + 0.021 * k * Math.cos(th) * Math.cos(ph), 0.012 + 0.0115 * Math.sin(th), BD + 0.017 + 0.014 * k * Math.cos(th) * Math.sin(ph)); o.t.set(0.2 * Math.cos(ph), v); o.c.setRGB(1, 0, 0); }, K_RIBBON, M_STILL, 1), BM));
      // and its two loose ends on the table: the long one runs along in front of the book, stands up in a fold, and comes back
      const fold = v => Math.exp(-Math.pow((v - 0.56) / 0.13, 2));
      parts.push(on(ribbon(this.endA = [[TIE + 0.008, 0.011, BD + 0.026], [TIE + 0.045, 0.004, BD + 0.045], [-0.02, 0.0032, BD + 0.058], [0.07, 0.006, BD + 0.058], [0.125, 0.024, BD + 0.064], [0.152, 0.04, BD + 0.088], [0.134, 0.027, BD + 0.116],
        [0.075, 0.007, BD + 0.128], [0.012, 0.0032, BD + 0.138], [-0.03, 0.0045, BD + 0.156]], 0.0165, 0.002, 84, [0, 0, -1], v => -1.15 * fold(v), 0, v => fold(v)), BM));
      parts.push(on(ribbon(this.endB = [[TIE - 0.008, 0.011, BD + 0.026], [TIE - 0.04, 0.005, BD + 0.04], [TIE - 0.068, 0.0032, BD + 0.072], [TIE - 0.066, 0.0032, BD + 0.112], [TIE - 0.045, 0.006, BD + 0.14]], 0.0165, 0.002, 44, [0, 0, 1], v => 0.5 * v * v, 0), BM));
    }

    // ------------------------------------------------------------ the cameo: the carved field, its gold rim, its back
    const W = 384, H = 480, cut = carve(W, H), hmap = cut.h;
    const hAt = (u, v) => {
      const x = clamp01(u) * (W - 1), y = clamp01(v) * (H - 1), x0 = Math.floor(x), y0 = Math.floor(y), x1 = Math.min(W - 1, x0 + 1), y1 = Math.min(H - 1, y0 + 1), fx = x - x0, fy = y - y0;
      return lerp(lerp(hmap[y0 * W + x0], hmap[y0 * W + x1], fx), lerp(hmap[y1 * W + x0], hmap[y1 * W + x1], fx), fy);
    };
    {
      parts.push(surf(72, 24, (u, v, o) => { const ph = u * TAU, r = 0.88 * (0.004 + 0.996 * v), X = r * Math.cos(ph), Y = r * Math.sin(ph), tu = 0.5 + 0.5 * X, tv = 0.5 - 0.5 * Y; o.p.set(CB * X, CA * Y, RELIEF * hAt(tu, tv)); o.t.set(tu, tv); }, K_CAMEO, M_CAMEO, 0));
      const prof = new THREE.CatmullRomCurve3([[0.88, 0], [0.884, 0.0022], [0.892, 0.0048], [0.9, 0.0052], [0.906, 0.004], [0.912, 0.0046], [0.924, 0.0078], [0.94, 0.0088], [0.966, 0.0086], [0.984, 0.0068], [0.996, 0.003], [1.0, -0.002], [0.998, -0.008], [0.985, -CT]].map(([r, z]) => new THREE.Vector3(r, z, 0)), false, 'centripetal'), q = new THREE.Vector3();
      parts.push(surf(72, 22, (u, v, o) => { prof.getPoint(v, q); const ph = u * TAU; o.p.set(CB * q.x * Math.cos(ph), CA * q.x * Math.sin(ph), q.y); o.t.set(u, v); }, K_CAMEO, M_CAMEO, 1));
      parts.push(surf(48, 1, (u, v, o) => { const ph = -u * TAU, r = 0.985 * (1 - 0.998 * v); o.p.set(CB * r * Math.cos(ph), CA * r * Math.sin(ph), -CT); o.t.set(u, v); }, K_CAMEO, M_CAMEO, 2));
    }
    // (the slopes of the carving, for the light: x and y in red and green; how much of it is figure in blue; its height in alpha)
    const px = new Uint8Array(W * H * 4), kx = RELIEF * 1.55 / (2 * CB / W), ky = RELIEF * 1.55 / (2 * CA / H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x, dx = (hmap[y * W + Math.min(W - 1, x + 1)] - hmap[y * W + Math.max(0, x - 1)]) / 2 * kx, dy = (hmap[Math.min(H - 1, y + 1) * W + x] - hmap[Math.max(0, y - 1) * W + x]) / 2 * ky;
      const l = Math.hypot(dx, dy, 1);
      px[i * 4] = Math.round(255 * (0.5 - 0.5 * dx / l)); px[i * 4 + 1] = Math.round(255 * (0.5 + 0.5 * dy / l)); px[i * 4 + 2] = Math.round(255 * cut.figure[i]); px[i * 4 + 3] = Math.round(255 * hmap[i]);
    }
    const relief = this.relief = new THREE.DataTexture(px, W, H, THREE.RGBAFormat); relief.minFilter = THREE.LinearMipmapLinearFilter; relief.magFilter = THREE.LinearFilter; relief.generateMipmaps = true; relief.anisotropy = 4; relief.needsUpdate = true;

    // where the cameo lies, how he holds it, and how it is shown (in the stage's frame)
    {
      const rest = new THREE.Vector3(REST[0], BH + CT * CS / BS + 0.001, REST[1]).applyMatrix4(BM);
      const head = new THREE.Vector3(-1, 0, 0).transformDirection(BM), up = new THREE.Vector3(0, 1, 0), xl = new THREE.Vector3().crossVectors(head, up);      // (lying: its head to the left along the book, its face up)
      const q0 = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(xl, head, up));
      const q1 = new THREE.Quaternion().setFromAxisAngle(head, -0.92).multiply(q0);      // (held: tipped up towards you, still on its side)
      const q2 = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.17, -0.06, 0, 'YXZ'));      // (shown: upright, leaning back a little into his light)
      this.pose = { p0: rest, p1: rest.clone().add(new THREE.Vector3(0.0, 0.2, 0.1)), p2: new THREE.Vector3(0.21, 0.435, 0.86), q0, q1, q2, p: rest.clone(), q: q0.clone() };
    }

    // ------------------------------------------------------------ his paint on them: one material, one draw call
    const u = this.u = {
      uInv: { value: this.Binv }, uRelief: { value: relief }, uT: { value: 0 }, uSlide: { value: 0 }, uLight: { value: 0 }, uWall: { value: wall },
      uCam: { value: new THREE.Matrix4() }, uCamP: { value: new THREE.Vector3() }, uSun: { value: SUN.clone() }, uGlow: { value: 0 }, uRim: { value: new THREE.Vector2(0, 0) }, uFold: { value: 0 },
    };
    // (the book and the ribbon's ends, as the table's top knows them, for their shadows: in the table's own frame)
    const ptT = p => { const q = new THREE.Vector3(p[0], p[1], p[2]).applyMatrix4(inT); return [q.x, q.z, q.y - TH]; };
    const segs = []; for (const path of [this.endA, this.endB]) for (let i = 0; i + 1 < path.length; i++) { const a = ptT(path[i]), b = ptT(path[i + 1]); segs.push([a, b, (a[2] + b[2]) / 2]); }
    const sdM = new THREE.Vector2(-SUN.x, -SUN.z).normalize(), sdT = new THREE.Vector2(sdM.x * Math.cos(TA) - sdM.y * Math.sin(TA), sdM.x * Math.sin(TA) + sdM.y * Math.cos(TA));      // the way shadows fall: on the floor, and in the table's frame
    const tm = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, fog: false });
    tm.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, u);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', `#include <common>
attribute vec3 aK; attribute vec2 aUv; attribute vec4 aC; uniform float uT, uSlide, uFold; uniform mat4 uCam;
varying vec3 vK, vOP, vLP, vN; varying vec2 vUv2; varying vec4 vC;`)
        .replace('#include <begin_vertex>', `vec3 transformed = vec3(position); vec3 ln = normal;
  int mv = int(aK.y + 0.5);
  if (mv == ${M_CAMEO}) { transformed = (uCam * vec4(position, 1.0)).xyz; ln = mat3(uCam) * normal; }
  else if (mv == ${M_FOLD}) { transformed.y += uFold * 0.011 * aC.w * sin(uT * 23.0); transformed.x += uFold * 0.006 * aC.w * sin(uT * 17.0 + 1.0); }
  transformed.z += uSlide;
  vK = aK; vUv2 = aUv; vOP = position; vLP = transformed; vN = ln; vC = aC;`);
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
uniform mat4 uInv, uCam; uniform sampler2D uRelief; uniform float uLight, uWall, uGlow, uSlide, uT; uniform vec3 uCamP, uSun; uniform vec2 uRim;
varying vec3 vK, vOP, vLP, vN; varying vec2 vUv2; varying vec4 vC;${NOISE}
// gold, as he paints it: brown in the shade, ochre, lemon, and one pale touch (pale: how far it is the carved figure's paler gold)
vec3 gold(float tone, float pale) {
  vec3 c = mix(${C('#2c1605')}, ${C('#63400e')}, smoothstep(-0.45, 0.1, tone));
  c = mix(c, mix(${C('#8a5f17')}, ${C('#a8822e')}, pale), smoothstep(0.05, 0.45, tone));
  c = mix(c, mix(${C('#b98a22')}, ${C('#dcbc58')}, pale), smoothstep(0.42, 0.8, tone));
  return mix(c, mix(${C('#e2be4c', 0.03)}, ${C('#f6e59a', 0.03)}, pale), 0.62 * smoothstep(0.82, 1.15, tone));
}
// the shade the book and the ribbon's ends throw on the table's top (q: in the table's frame)
float tableShade(vec2 q) {
  vec2 sd = ${v2(sdT.x, sdT.y)}; float s = 0.0;
  vec2 b = q - ${v2(BX, BZ)}; b = vec2(${f3(Math.cos(BYAW))} * b.x - ${f3(Math.sin(BYAW))} * b.y, ${f3(Math.sin(BYAW))} * b.x + ${f3(Math.cos(BYAW))} * b.y);
  vec2 bs = b - sd * 0.04;
  s = max(s, 0.82 * smoothstep(0.012, -0.004, boxd(b, ${v2(BL * BS, BD * BS)})));
  s = max(s, 0.62 * smoothstep(0.06, -0.014, boxd(bs, ${v2(BL * BS, BD * BS)})));
${segs.map(([a, b, h]) => `  s = max(s, ${f3(0.66 / (1 + 22 * h))} * smoothstep(${f3(0.026 + 0.5 * h)}, ${f3(0.009 + 0.12 * h)}, seg(q - sd * ${f3(0.006 + 0.7 * h)}, ${v2(a[0], a[1])}, ${v2(b[0], b[1])})));`).join('\n')}
  return s;
}`)
        .replace('#include <opaque_fragment>', `{
  if (vLP.z < -uWall) discard;
  int kind = int(vK.x + 0.5), sub = int(vK.z + 0.5);
  vec3 N = normalize(vN); if (!gl_FrontFacing) N = -N;
  vec3 eye = (uInv * vec4(cameraPosition, 1.0)).xyz, Vd = normalize(eye - vLP);
  vec3 Lk = normalize(uSun), Hh = normalize(Lk + Vd);
  float nl = dot(N, Lk), key = ${KEY.toFixed(2)};
  vec3 fc = diffuseColor.rgb, c = vec3(0.5);
  // the shade the cameo throws on what is under it, and the little light its gold gives back
  vec3 toC = uCamP - vLP; float up = max(toC.y, 0.0);
  vec2 sc = toC.xz + ${v2(sdM.x, sdM.y)} * up * 0.8; float rad = ${f3(CA * CS)} + 0.22 * up;
  float camShade = (kind == ${K_CAMEO}) ? 0.0 : 0.8 * smoothstep(rad, rad * 0.45, length(sc)) / (1.0 + 9.0 * up);
  vec3 give = (kind == ${K_CAMEO}) ? vec3(0.0) : ${C('#e2b23c', 0)} * uGlow * 0.5 * max(dot(N, normalize(toC)), 0.0) * smoothstep(0.02, 0.12, up) / (1.0 + 30.0 * dot(toC, toC));
  if (kind == ${K_TABLE}) {
    if (sub == 0) {
      // the top: his dull olive grey, smooth, lighter towards its front edge, a thread of light along the edge itself
      vec2 q = vUv2; float cloud = mN(q * 3.1 + 2.0), fine = mN(q * vec2(90.0, 140.0)), wash = mN(vec2(q.x * 1.3 + 9.0, q.y * 7.0));
      c = mix(${C('#55492f')}, ${C('#8a8062')}, 0.25 + 0.75 * cloud);
      c = mix(c, ${C('#9a9074')}, 0.3 * smoothstep(0.45, 0.85, wash));
      c *= 0.96 + 0.08 * fine;
      c *= mix(0.34, 1.0, smoothstep(-0.78, -0.06, q.y)) * mix(0.82, 1.06, smoothstep(${f3(-XL)}, ${f3(XR)}, q.x));
      c = mix(c, c * ${C('#30200f', 0)} * 1.4, tableShade(q));
      c = mix(c, ${C('#a79d80')}, 0.55 * smoothstep(-0.011, -0.002, q.y));
    } else if (sub == 1) {
      // its front: a brown brushed downwards, warmest under the top's edge
      float h = (${f3(TH)} - (vUv2.y - 0.004)) / ${f3(TH)}, st = mN(vec2(vUv2.x * 17.0 + 2.0 * mN(vUv2 * 6.0), vUv2.y * 4.0)), st2 = mN(vec2(vUv2.x * 90.0, vUv2.y * 14.0)), cl = mN(vUv2 * vec2(3.0, 9.0) + 4.0);
      c = mix(${C('#553a1b')}, ${C('#2a1a0c')}, 0.8 * smoothstep(0.0, 1.0, h) + 0.2 * cl);
      c = mix(c, ${C('#5a4020')}, 0.3 * smoothstep(0.35, 0.85, st) * (1.0 - 0.6 * h)); c *= 0.94 + 0.12 * st2;
      c *= mix(0.8, 1.12, smoothstep(0.0, ${f3(XL + XR)}, vUv2.x));
      c *= mix(0.7, 2.1, smoothstep(0.1, 0.66, nl));
      c = mix(c, ${C('#a79d80')}, 0.5 * smoothstep(0.035, 0.0, h)); c *= 1.0 - 0.45 * smoothstep(0.06, 0.02, h) * smoothstep(0.02, 0.045, h);
    } else if (sub == 2) c = ${C('#150d06')} * (0.8 + 0.4 * mN(vUv2 * vec2(8.0, 30.0)));
    else if (sub == 3) c = mix(${C('#35230f')}, ${C('#1c1208')}, smoothstep(${f3(TH)}, 0.0, vUv2.y)) * (0.85 + 0.3 * mN(vec2(vUv2.x * 40.0, vUv2.y * 5.0)));
    else c = ${C('#090704')};
    if (sub == 0) c *= 1.0 - camShade;
  } else if (kind == ${K_BOOK}) {
    // the covers: a green that is nearly black; what tells you it is green is the light along its edges
    float ed = min(min(vUv2.x, fc.r - vUv2.x), min(vUv2.y, fc.g - vUv2.y));
    float bl = mN(vUv2 * 26.0 + 3.0), grain = mN(vUv2 * vec2(210.0, 190.0));
    float tone = nl + 0.12 * (bl - 0.5);
    c = mix(${C('#0a0d06')}, ${C('#1c2610')}, smoothstep(-0.2, 0.5, tone)); c = mix(c, ${C('#33431f')}, 0.8 * smoothstep(0.45, 1.0, tone));
    c *= 0.93 + 0.14 * grain;
    if (sub == 0) {
      // the upper face: a soft sheen where it turns the light to you, its edges worn lighter, the tie's shade beside the tie
      float sp = pow(max(dot(N, Hh), 0.0), 26.0);
      c = mix(c, ${C('#5d7040')}, 0.5 * sp * (0.6 + 0.8 * bl));
      c = mix(c, ${C('#536535')}, 0.55 * smoothstep(0.011, 0.002, ed) * (0.6 + 0.6 * bl));
      float tx = vUv2.x - ${f3(TIE + BL)};
      c *= 1.0 - 0.6 * smoothstep(0.0, 0.019, tx) * smoothstep(0.05, 0.022, tx);
      c *= 1.0 - camShade;
    } else if (sub == 1) {
      // an edge of a cover: lit towards you and to the left, a hair of light along its upper corner
      float lit = fc.b < 0.5 ? 1.0 : (fc.b < 1.5 ? 0.35 : 0.8);
      c = mix(${C('#0b0f07')}, ${C('#344420')}, lit * (0.5 + 0.5 * bl));
      c = mix(c, ${C('#6c7f48')}, 0.55 * lit * smoothstep(${f3(COVER * 0.62)}, ${f3(COVER)}, vUv2.y));
    } else if (sub == 2) c = ${C('#0c1008')} * (0.7 + 0.6 * bl);
    else if (sub == 4) c = mix(c * 0.7, ${C('#536535')}, 0.4 * smoothstep(0.006, 0.001, ed));
    else c = ${C('#050604')};
  } else if (kind == ${K_PAGES}) {
    // the leaves: their edges stained red, hundreds of them, in the shade of the covers above and below
    float y = vUv2.y / fc.g, leaf = mN(vec2(vUv2.x * 7.0, vUv2.y * 1500.0)), band = mN(vec2(vUv2.x * 2.0 + 5.0, vUv2.y * 190.0)), bl = mN(vUv2 * vec2(9.0, 30.0));
    c = mix(${C('#2b0d06')}, ${C('#6b2412')}, 0.3 + 0.5 * band + 0.2 * bl); c = mix(c, ${C('#8f3a1c')}, 0.3 * smoothstep(0.55, 0.9, leaf));
    c *= 0.86 + 0.28 * leaf;
    c *= mix(0.3, 1.0, smoothstep(1.0, 0.72, y)) * mix(0.55, 1.0, smoothstep(0.0, 0.2, y));
    if (sub == 0) { float tx = vUv2.x - ${f3(TIE + BL - INSET)}; c *= 1.0 - 0.55 * smoothstep(0.0, 0.018, tx) * smoothstep(0.045, 0.02, tx); c *= mix(0.85, 1.1, smoothstep(0.0, fc.r, vUv2.x)); }
    else if (sub == 1) c *= 0.4; else c *= 0.85;
  } else if (kind == ${K_RIBBON}) {
    // silk ribbon: dark, with one long light on it wherever it turns to the light, and a duller underside
    float ac = vUv2.x, al = vUv2.y, topf = fc.r;
    float rib = mN(vec2(ac * 3.0, al * 420.0)), bl = mN(vec2(al * 31.0, ac * 2.0 + 3.0));
    float tone = nl + 0.1 * (bl - 0.5);
    c = mix(${C('#0b1206')}, ${C('#25361a')}, smoothstep(-0.3, 0.45, tone)); c = mix(c, ${C('#4d6a30')}, smoothstep(0.4, 0.95, tone));
    float sp = pow(max(dot(N, Hh), 0.0), 9.0), sp2 = pow(max(dot(N, Hh), 0.0), 60.0);
    c = mix(c, ${C('#86a058')}, 0.6 * smoothstep(0.25, 0.9, sp) * (0.75 + 0.5 * rib)); c = mix(c, ${C('#c5d59a', 0.03)}, 0.5 * smoothstep(0.4, 1.0, sp2));
    c *= 0.94 + 0.12 * rib;
    c *= mix(0.62, 1.0, topf) * (1.0 - 0.3 * smoothstep(0.8, 1.0, abs(ac)));
    if (sub == 1) c *= 0.8;
    c *= 1.0 - 0.6 * camShade;
  } else {
    mat3 R = mat3(uCam);                                               // (how the cameo is turned: its columns are as long as it is large)
    if (sub == 0) {
      // the carved field. Its slopes are kept, so the light on it is worked out: a lit side and a shaded side to every
      // form, and the small shadow each throws on the ground beside it, longer the lower the light
      vec4 tx = texture2D(uRelief, vUv2); vec2 s = tx.rg * 2.0 - 1.0;
      vec3 nloc = normalize(vec3(s, sqrt(max(1.0 - dot(s, s), 0.05))));
      N = normalize(R * nloc);
      vec3 Ll = normalize(Lk * R);                                           // (his light, in the cameo's own frame)
      vec2 ld = Ll.xy / max(length(Ll.xy), 1.0e-3); float rake = clamp(1.0 - Ll.z, 0.0, 1.0), facing = smoothstep(-0.05, 0.25, Ll.z);
      vec2 du = vec2(ld.x, -ld.y);
      float h0 = tx.a, thrown = max(texture2D(uRelief, vUv2 + du * 0.012).a - h0 - 0.02, 0.0) + 0.7 * max(texture2D(uRelief, vUv2 + du * 0.03).a - h0 - 0.07, 0.0);
      float shade = smoothstep(0.0, 0.22, thrown) * (0.25 + 0.75 * rake);
      float base = dot(R[2], Lk) / ${f3(CS)}, pale = tx.b * (0.82 + 0.18 * smoothstep(0.2, 0.6, h0));
      float tone = 0.5 + 0.3 * (base - 0.5) + 1.5 * (dot(N, Lk) - base) - 0.3 * shade - 0.12 * (1.0 - tx.b) + 0.05 * (mN(vUv2 * 9.0) - 0.5);
      // (turned from the light it is not black: the room gives it a little back, from in front, and the carving is still there)
      float room = 0.13 + 0.9 * (dot(N, normalize(vec3(0.1, 0.35, 1.0))) - dot(normalize(R[2]), normalize(vec3(0.1, 0.35, 1.0)))) - 0.05 * (1.0 - tx.b);
      c = gold(mix(room, tone, facing), pale);
      // the ground a little deeper than the figure, and tooled: a faint stipple, as struck gold has
      c *= mix(0.86 + 0.06 * mN(vUv2 * vec2(150.0, 190.0)), 1.0, tx.b);
      float sp = pow(max(dot(N, Hh), 0.0), 46.0);
      c = mix(c, ${C('#fbf1b8', 0)}, 0.4 * smoothstep(0.3, 0.95, sp) * facing * (0.35 + 0.65 * tx.b));
      // (where the field meets the rim: the rim's own shade)
      c *= 1.0 - 0.3 * smoothstep(0.82, 0.88, length(vUv2 - 0.5) * 2.0) * (0.4 + 0.6 * rake);
    } else if (sub == 1) {
      // the rim: a band of plain gold, a bright bevel on the side the light is, and once a thread of light going round it
      float tone = 0.4 + 1.25 * (dot(N, Lk) - 0.45) + 0.06 * (mN(vec2(vUv2.x * 60.0, vUv2.y * 6.0)) - 0.5);
      c = gold(tone, 0.15);
      float sp = pow(max(dot(N, Hh), 0.0), 70.0); c = mix(c, ${C('#fbf1b8', 0)}, 0.55 * smoothstep(0.3, 0.95, sp));
      float da = abs(fract(vUv2.x - uRim.x + 0.5) - 0.5);
      c += ${C('#fff6c8', 0)} * uRim.y * exp(-sq(da / 0.06)) * smoothstep(0.05, 0.3, vUv2.y) * smoothstep(0.95, 0.6, vUv2.y);
    } else c = gold(dot(N, Lk) * 0.8 - 0.1, 0.0) * 0.7;
  }
  c += give;
  outgoingLight = c * key * mix(0.1, 1.0, uLight);
}
#include <opaque_fragment>`);
    };
    tm.customProgramCacheKey = () => 'allori-cameo-table';
    this.things = new THREE.Mesh(merge(parts), tm); this.things.name = 'table-book-ribbon-cameo';
    this.tris = this.things.geometry.attributes.position.count / 3;
    this.things.matrixAutoUpdate = false; this.things.matrix.copy(this.B); this.things.matrixWorldNeedsUpdate = true;
    L.add(this.things);

    // ------------------------------------------------------------ the dark of his curtain, low on the wall, and the shade on the boards
    const soft = [];
    const R = L.room; let left = 1.9, right = 2.3, deep = 3.2;
    if (R) {
      const a = Math.abs(L.tx) > 0.5 ? [(R.x0 - L.cx) * L.tx, (R.x1 - L.cx) * L.tx] : [(R.z0 - L.cz) * L.tz, (R.z1 - L.cz) * L.tz];
      left = Math.min(left, -Math.min(a[0], a[1]) - 0.08); right = Math.min(right, Math.max(a[0], a[1]) - 0.08);
      deep = Math.min(deep, (Math.abs(L.nx) > 0.5 ? Math.max((R.x0 - L.cx) * L.nx, (R.x1 - L.cx) * L.nx) : Math.max((R.z0 - L.cz) * L.nz, (R.z1 - L.cz) * L.nz)) - 0.05);
    }
    const top = Math.max(0.5, L.rail - L.y - 0.05);                  // (the dark stops under the frames)
    soft.push(surf(1, 1, (uu, vv, o) => o.p.set(lerp(-left, right, uu), 0.022, lerp(deep, -wall + 0.01, vv)), P_FLOOR));
    soft.push(surf(1, 1, (uu, vv, o) => o.p.set(lerp(-left, right, uu), lerp(0.012, top, vv), -wall + 0.006), P_DARK));
    soft.push(surf(1, 1, (uu, vv, o) => o.p.set(lerp(-left, right, uu), lerp(0.012, 0.44, vv), 0.04), P_DARK));      // (the skirting stands out from the wall: it is shaded too)
    // (the wall labels keep their light, and a little of the wall's round them)
    const labels = [];
    try {
      const cards = L.k.museum.cards, M = new THREE.Matrix4(), Pp = new THREE.Vector3(), Qq = new THREE.Quaternion(), Sc = new THREE.Vector3();
      for (const a of L.k.museum.arts) {
        if (a.room !== L.art.room || a.i == null || labels.length >= 6) continue;
        cards.getMatrixAt(a.i, M); M.decompose(Pp, Qq, Sc); if (Sc.x < 0.01) continue;
        const q = L.local(Pp.x, Pp.z); if (Math.abs(q.out) > 0.3 || q.u < -left - 0.3 || q.u > right + 0.3) continue;
        labels.push(new THREE.Vector4(q.u, Pp.y - L.y, Sc.x / 2 + 0.045, Sc.y / 2 + 0.045));
      }
    } catch (e) { /* (no labels to keep) */ }
    while (labels.length < 6) labels.push(new THREE.Vector4(99, 99, 1, 1));
    const gu = this.gu = { uSlide: u.uSlide, uLight: u.uLight, uCamP: u.uCamP, uDk: { value: 0 }, uOut: { value: 0 }, uTop: { value: top }, uLabel: { value: labels } };
    const gm = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide, forceSinglePass: true });
    gm.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, gu);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', `#include <common>
attribute vec3 aK; varying vec3 vOP; varying float vPart;`)
        .replace('#include <begin_vertex>', `vec3 transformed = vec3(position); vPart = aK.x; vOP = position;`);
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
uniform float uLight, uDk, uOut, uSlide, uTop; uniform vec3 uCamP; uniform vec4 uLabel[6];
varying vec3 vOP; varying float vPart;${NOISE}
vec3 gCol; float gA;`)
        .replace('#include <color_fragment>', `#include <color_fragment>
  gCol = vec3(0.0); gA = 0.0;
  if (vPart < 0.5) {
    // his curtain's dark: nearly black, a deep red-brown where the light gets into it; a low pool under the frames,
    // broken at its edge, deepest behind the table
    float x = vOP.x, y = vOP.y, n1 = mN(vec2(x, y) * 2.1) - 0.5, n2 = mN(vec2(x * 15.0, y * 3.0));
    float d = length(vec2((x - 0.2) / (x > 0.2 ? 1.75 : 0.95), (y - 0.1) / 1.2)), sh = 1.0 - smoothstep(0.1, 1.0, d + 0.05 * n1);
    sh *= smoothstep(uTop, uTop - 0.5, y + 0.04 * n1);
    float halo = 1.0;
    for (int i = 0; i < 6; i++) { vec2 lq = abs(vec2(x, y) - uLabel[i].xy) - uLabel[i].zw; halo *= mix(0.1, 1.0, smoothstep(0.0, 0.05, max(lq.x, lq.y))); }
    gA = 1.0 - exp(-3.4 * uDk * halo * sh * sh * (vOP.z > 0.0 ? 1.0 - smoothstep(0.14, 0.44, y) : 1.0));
    float fold = smoothstep(0.2, 0.9, mN(vec2(x * 5.0, y * 0.8 + 3.0))) * smoothstep(1.3, 0.2, abs(x - 0.2));
    gCol = mix(${C('#0c0705')}, ${C('#200c08')}, 0.6 * fold * uLight);
  } else {
    // the floor goes down into the same dark, deepest at the wall's foot; and in it the shade the table stands in
    float n1 = mN(vOP.xz * 2.3 + 5.0) - 0.5;
    float foot = 1.0 - smoothstep(0.1, 1.0, length(vec2((vOP.x - 0.2) / (vOP.x > 0.2 ? 1.75 : 1.0), max(vOP.z, 0.0) / 2.3)) + 0.12 * n1);
    float dusk = 1.0 - exp(-3.2 * uDk * foot * foot);
    vec2 q = vOP.xz - vec2(${f3(TX)}, ${f3(TZ)} + uSlide) - ${v2(sdM.x, sdM.y)} * 0.05; q = vec2(${f3(Math.cos(TA))} * q.x - ${f3(Math.sin(TA))} * q.y, ${f3(Math.sin(TA))} * q.x + ${f3(Math.cos(TA))} * q.y);
    float dist = boxd(q - vec2(${f3((XR - XL) / 2)}, ${f3(-DEEP / 2)}), vec2(${f3((XR + XL) / 2)}, ${f3(DEEP / 2)}));
    float shade = 0.72 * (1.0 - smoothstep(-0.02, 0.24, dist)) * uOut;
    vec2 cs = vOP.xz - uCamP.xz - ${v2(sdM.x, sdM.y)} * uCamP.y * 0.5; shade = max(shade, 0.34 * uOut * smoothstep(0.3, 0.06, length(cs)) * step(0.0, dist));
    gA = 1.0 - (1.0 - dusk) * (1.0 - shade); gCol = ${C('#080604')};
  }`)
        .replace('#include <opaque_fragment>', '  outgoingLight = gCol; diffuseColor.a = gA;\n#include <opaque_fragment>');
    };
    gm.customProgramCacheKey = () => 'allori-cameo-dark';
    this.soft = new THREE.Mesh(merge(soft), gm); this.soft.name = 'dark-and-shade';
    this.tris += this.soft.geometry.attributes.position.count / 3;
    this.soft.matrixAutoUpdate = false; this.soft.matrix.copy(this.B); this.soft.matrixWorldNeedsUpdate = true; this.soft.renderOrder = 9;
    L.add(this.soft);

    // ------------------------------------------------------------ the sounds, on the show's clock
    const s = this.sc = score(L);
    s.hit(T_OUT[0] + 0.05, { d: T_OUT[1] - T_OUT[0], vol: 0.015, lp: 250, attack: 0.35 });                          // the table, coming out
    s.note(T_OUT[1] - 0.04, 84, 0.22, { type: 'sine', vol: 0.03, to: 54, attack: 0.006 });
    s.hit(T_OUT[1] + 0.03, { d: 0.3, vol: 0.005, hp: 5200, attack: 0.06 });                                        // the ribbon's fold
    s.hit(T_LIFT[0], { d: 0.022, vol: 0.008, hp: 4200 });                                                          // the cameo leaves the cover
    s.note(T_LIFT[0] + 0.02, 2349, 0.9, { type: 'sine', vol: 0.0035, attack: 0.3 });
    s.hit(T_TURN[0] + 0.1, { d: T_TURN[1] - T_TURN[0] - 0.3, vol: 0.0035, bp: 1900, q: 0.8, attack: 0.5 });        // the turn: hardly a breath
    for (const e of this.chord(1)) s.note(T_SHOW + e.t, e.f, e.d, e);
    s.loop(T_SHOW + PERIOD, PERIOD, this.chord(0.5).slice(0, 4));
    s.done();

    this.lin = 0; this.at = 0; this.hold = null; this.toy = new THREE.Vector3().copy(SUN); this.hide();
  },

  // One chord, plucked from the bottom up, when the cameo stands upright: G, D, G and a faint B. k: how loud.
  chord(k) {
    const ev = [];
    [[196, 0, 1], [293.66, 0.07, 0.85], [392, 0.14, 0.9], [493.88, 0.22, 0.45]].forEach(([f, t, v]) => {
      ev.push({ t, f, d: 2.6, vol: 0.03 * k * v, type: 'triangle', attack: 0.004 }); ev.push({ t, f: f * 2, d: 1.1, vol: 0.008 * k * v, type: 'sine', attack: 0.003 });
    });
    return ev;
  },

  // ---------------------------------------------------------------- the cameo, by the show's clock
  // At clock t: where it is and how it is turned (into pose.p, pose.q); how far it is shown (0..1).
  cameoAt(t, calm) {
    const ps = this.pose, V = this.V;
    const lift = ease.inOut(ramp(t, T_LIFT[0], T_LIFT[1])), turn = ease.inOut(ramp(t, T_TURN[0], T_TURN[1]));
    // (its far edge leaves the book first: it tips before it rises)
    const tip = ease.inOut(ramp(t, T_LIFT[0], T_LIFT[1] - 0.15)), rise = ease.inOut(ramp(t, T_LIFT[0] + 0.2, T_LIFT[1]));
    ps.p.lerpVectors(ps.p0, ps.p1, rise); ps.q.slerpQuaternions(ps.q0, ps.q1, tip);
    if (lift > 0 && turn <= 0) { const b = t - T_LIFT[1]; if (b > 0) ps.p.y += 0.004 * Math.sin(b * 2.6) * Math.min(1, b * 2); }      // (held: it is not quite still)
    if (turn > 0) {
      ps.p.lerpVectors(ps.p1, ps.p2, turn); ps.p.y += 0.035 * Math.sin(PI * turn);
      ps.q.slerpQuaternions(ps.q1, ps.q2, turn);
      // shown: it breathes; and now and then it is turned a little to the light and back
      const a = t - T_SHOW;
      if (a > 0) {
        const n = Math.floor(a / PERIOD), b = a - n * PERIOD, k = calm ? 0.5 : 1;
        const rock = Math.sin(PI * ramp(b, ROCK[0], ROCK[1])), sway = ease.smooth(rock);
        V.q.setFromEuler(V.e.set(0.02 * Math.sin(a * 1.1) - 0.1 * k * sway, 0.025 * Math.sin(a * 0.8) - 0.42 * k * sway, 0.012 * Math.sin(a * 0.67), 'YXZ'));
        ps.q.multiply(V.q); ps.p.y += 0.005 * Math.sin(a * 1.3);
      }
    }
    return turn;
  },

  hide() { this.things.visible = false; this.soft.visible = false; },
  start(L, resumed) { this.lin = resumed ? this.at - L.t : 0; this.sc.from(resumed ? this.at : 0); if (!resumed) this.toy.copy(SUN); },
  back(L) { const u = this.u, ps = this.pose; this.hold = { light: u.uLight.value, slide: u.uSlide.value, dk: this.gu.uDk.value, out: this.gu.uOut.value, glow: u.uGlow.value, p: ps.p.clone(), q: ps.q.clone(), sun: u.uSun.value.clone() }; },
  end() { this.hide(); },
  reset() { this.hide(); this.lin = this.at = 0; this.toy.copy(SUN); },

  update(L, dt) {
    const ph = L.phase, showing = ph === 'wake' || ph === 'play', linger = ph === 'linger', back = ph === 'return';
    if (!showing && !linger && !back) { this.hide(); return; }
    const calm = L.calm, V = this.V, u = this.u, gu = this.gu, ps = this.pose;
    if (linger) this.lin += dt;
    const t = this.at = L.t + this.lin;
    const voice = L.voice(); voice.level = calm ? 0.55 : 1; voice.place();
    this.things.visible = true; this.soft.visible = true;
    const far = -(TZ + XL * Math.sin(TA) + this.wall + 0.08);
    u.uT.value = t;
    if (showing) this.sc.play(t);
    if (showing && !TOLD && !L.quiet && t > T_SHOW + 0.3) { TOLD = true; L.k.say('The cameo he holds on its side is turned upright, to be looked at: a woman in profile. The museum does not say who she is.', 5); }

    let slide, light, dk, out, glow, shown;
    if (!back) {
      slide = far * (1 - ease.inOut(ramp(t, T_OUT[0], T_OUT[1]))); light = ease.smooth(ramp(t, T_LIGHT[0], T_LIGHT[1])); dk = ease.smooth(ramp(t, 0, calm ? 2.2 : 1.1)); out = ramp(t, T_OUT[0], T_OUT[1]);
      shown = this.cameoAt(t, calm); glow = shown;
      // the ribbon's fold, when the table stops; a thread of light round the cameo's rim before it is lifted
      const since = t - T_OUT[1]; u.uFold.value = calm || since < 0 ? 0 : Math.exp(-since * 3.4) * Math.min(1, since * 30);
      const rr = ramp(t, T_RIM[0], T_RIM[1]); u.uRim.value.set(0.62 - 0.9 * ease.inOut(rr), calm ? 0 : 2.4 * Math.sin(PI * rr));
      // his light; and, once the look is over and the toy is near, the toy's: from wherever it is, a little above it
      if (linger) {
        const G = L.k.G, v = G.vehicle, q = L.local(v.pos.x, v.pos.z);
        V.v.set(q.u - ps.p.x, 0, q.out - ps.p.z); const d = V.v.length();
        if (d > 0.05) { V.v.multiplyScalar(1 / d); V.v.y = 0.55; V.v.normalize(); this.toy.lerp(V.v, Math.min(1, dt * (calm ? 1.2 : 3.2))).normalize(); }
      } else this.toy.lerp(SUN, Math.min(1, dt * 2.5)).normalize();
      u.uSun.value.copy(this.toy);
    } else {
      const h = this.hold || { light: 1, slide: 0, dk: 1, out: 1, glow: 0, p: ps.p0, q: ps.q0, sun: SUN }, R_ = L.ret;
      const home = ease.inOut(ramp(R_, 0, 0.42));
      ps.p.lerpVectors(h.p, ps.p0, home); ps.p.y += 0.03 * Math.sin(PI * home) * clamp01((h.p.y - ps.p0.y) * 6); ps.q.slerpQuaternions(h.q, ps.q0, home);
      glow = h.glow * (1 - home);
      light = h.light * (1 - 0.8 * ease.smooth(ramp(R_, 0.35, 0.92))); slide = lerp(h.slide, far, ease.inOut(ramp(R_, 0.45, 0.97))); dk = h.dk * (1 - ease.smooth(ramp(R_, 0.6, 1))); out = h.out * (1 - ramp(R_, 0.45, 0.97));
      u.uFold.value = 0; u.uRim.value.set(0, 0); u.uSun.value.copy(h.sun).lerp(SUN, home).normalize();
    }
    u.uSlide.value = slide; u.uLight.value = light; u.uGlow.value = glow * light; gu.uDk.value = dk; gu.uOut.value = out;
    u.uCam.value.compose(ps.p, ps.q, V.w.setScalar(CS)); u.uCamP.value.copy(ps.p); u.uCamP.value.z += slide;
    if (back && L.ret >= 1) this.hide();
  },
});
