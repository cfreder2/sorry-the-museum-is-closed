// Édouard Manet, Fish (Still Life) (1864), Gallery 222. The word: gleam.
//
// A kitchen table under a white cloth: a carp, a red gurnard, oysters, an eel; behind them a copper pot with its lid
// left askew, and at the right-hand corner a sprig of parsley, a lemon and a knife. The museum's note says the
// produce "seems fresh and the handling of the paint vigorous", and what tells you so, all over the picture, is the
// gleam: wet scales, the pearl of the shells, the edge of the blade, the lemon's skin, and, largest and hottest, one
// blaze of orange on the dark flank of the copper. That blaze stands right over the lemon: the two brightest warm
// things in the picture, side by side. So the show is the corner of his table that is not fish, and the gleam.
//
// Look at it and his cloth is brushed out over the floor from the foot of the wall, a stroke one way and a stroke
// back, and is a cloth: white broken with warm grey and blue-grey, rucked where it was pushed, its hem rippling, one
// corner turned back with its shadow under it. The pot is brushed in on it, dark, band over band, the lid askew on
// top; the knife and the parsley are touched in beside it. Then the lemon drops out from under the frame, below
// where it is painted. A lemon is not a ball: it lands on its end on the boards, kicks sideways, and rolls off behind
// the pot. For a moment there is only a dark pot. Then it comes out round the left of it, onto the cloth, and the
// copper finds it: a soft tall light wakes on the flank of the pot and travels across it as the lemon rolls round
// the front, over a crease, slower and slower, in the curve a lemon rolls in; and the two give to each other as they
// go, the lemon's yellow low in the copper, the copper's warmth on the cloth at its foot. The lemon turns in towards
// the pot, stops short, rocks once, and lies where he put it, its nipple to the left. Then the light, which has
// followed it all the way, stands where he put that too, and comes up into his blaze: a touch of pale salmon, a
// touch of red-orange, a touch of pale, wet into one another.
//
// While you keep looking it stays, breathing a little. When you stop it stays out while the toy is near, and the
// lemon is yours to push: wherever it goes the gleam goes with it round the pot, it dies when the lemon is behind,
// and the blaze only comes back when the lemon is back in his place. Roll it into the pot and the copper rings and
// the lid shivers. Drive off, and the lemon rolls home under the wall, and the pot and the cloth are unpainted,
// last stroke first.
//
// The pot is about a third larger than he painted it and the lemon about twice (the picture is nearly life-size; the
// lemon has to carry the look from across a room). The cloth is one soft sheet with real relief, a metre and a
// quarter across, no bigger than the lemon's road round the pot, with no straight edge; it, the pot, the lemon, the
// knife and the parsley are one smooth mesh, painted in a shader (no room light on them: his light, from the upper
// left, is in the paint, and the gleam is worked out from where you stand, so it moves on the copper as you drive
// round it too). The brushing-in is only the first second, the setting of the table; the show is the lemon and the
// copper. Two draw calls (that mesh; the shadows it throws on the boards), and one soft shadow more if the toy takes
// the lemon right away. Nothing stands higher than 45 cm, under a picture hung at 1.25 m and between two that hang to
// a metre, so from the checks' cameras the guard has nothing to cut. No music: brush on the floor, the lemon's
// knocks, and one long soft note from the copper as the blaze comes up. It keeps to its own stretch of wall:
// Courbet's dark and counter (src/life/4428-mere-gregoire.js) are two metres to the left of the cloth's hem, and
// Breton's dawn (src/life/94841-song-of-the-lark.js) begins a little beyond it on the right; neither stays out
// after its look, and this one goes home when either begins. With "Reduce motion and flashing" on, the lemon tumbles
// and rocks half as much, the blaze comes up twice as slowly and does not breathe, the lid barely stirs and
// everything is quieter.
//
// What it does not do: the carp, the gurnard, the eel and the oysters stay in the picture. They are a fishmonger's
// catch, dead on a cloth; they are not modelled, moved, cooked or brought back to swim here, because a dead animal is
// not a toy and waking them would change what he painted. The pot stays cold and the knife lies still.
import * as THREE from 'three';
import { lifeFor, ease, ramp, clamp01, lerp, rng } from '../paintlife.js';
import { score, noise } from './stagecraft.js';

const PI = Math.PI, TAU = PI * 2;
// The pot's own metres: x along the wall (to the viewer's right), y up from the boards, z out into the room, from
// the middle of its foot.
const U0 = -0.1, OUT0 = 0.62, LIFT = 0.013;      // where the pot stands (from the picture's middle; from the wall); clear of the floor
const R = 0.315, H = 0.29;                       // the pot: its radius and height
const RL = 0.3, LID_TILT = 0.166, LID_LOW = 25 * PI / 180;      // the lid: its radius, how far it tips, and to which side it has slipped in
const EARS = [15 * PI / 180, 195 * PI / 180];    // the two ear handles, round the pot
const LR = 0.078, LLEN = 0.225;                  // the lemon: the radius it rolls on, its length
const HOME = [0.18, 0.5];                        // where he put it
const KNIFE = [[-0.34, 0.69], [0.08, 0.72]];     // the knife: the end of its handle, its point
const SPRIG = [-0.05, 0.375];                    // the parsley
const SUN = [-0.5, 0.78, 0.42];                  // the way to his light: upper left, in front
const SHADOWS = [2.6, 2.2];                      // the boards that take their shadows: this wide, from the wall this far out
// The show, in seconds.
const T_WHITE = [0.05, 1.0], T_POT = [0.35, 1.15], T_SMALL = [0.95, 1.4];
const T_POP = 1.1, POP = 0.14, G = 9.8;
const DROP_X = 0.42;                             // under the frame, below where the lemon is painted
const LAND = [DROP_X, -0.5], B1 = { to: [0.16, -0.47], d: 0.36 }, B2 = { to: [-0.02, -0.44], d: 0.2 };      // it lands on its end and kicks left; a second, small bounce
const ROAD = [B2.to, [-0.25, -0.42], [-0.43, -0.25], [-0.475, 0.02], [-0.42, 0.3], [-0.24, 0.47], [-0.02, 0.555], [0.15, 0.6], [0.228, 0.572], HOME];      // behind the pot, round its left, across the front, and in
const V_END = 0.14, T_ROLL = 3.9, ROCK = { w: TAU / 0.7, k: 4.5 };          // it comes in still moving a little, rocks once, and is still
const T_BLAZE = [0.6, 1.5];                      // after it stops, the blaze comes up
const KEY = 0.52, KEY_W = 0.6;                   // (the game's film curve lifts what is not lit by the room: the paint is laid that much lower)
const sstep = (a, b, x) => { const q = clamp01((x - a) / (b - a)); return q * q * (3 - 2 * q); };

// ---------------------------------------------------------------- the cloth
// Its hem: how far out it lies from its own middle, each way round (a square with soft corners, turned a little,
// rippled, so that no edge of it is straight). The same rule is written again in the shadow's shader.
const CL = { x: -0.02, z: 0.2, a: 0.58, b: 0.63, rot: -0.09, n: 5, pinch: 0.05, w: [[2, 0.6, 0.025], [3, 2.1, 0.025], [5, 0.3, 0.025], [7, 1.2, 0.02], [11, 0.4, 0.012]] };
function clothEdge(th) {
  const c = Math.abs(Math.cos(th - CL.rot)) / CL.a, s = Math.abs(Math.sin(th - CL.rot)) / CL.b;
  let k = 1 - CL.pinch * Math.cos(4 * (th - CL.rot)); for (const [n, p, a] of CL.w) k += a * Math.sin(n * th + p);      // (its sides drawn in a little between its corners)
  return Math.pow(Math.pow(c, CL.n) + Math.pow(s, CL.n), -1 / CL.n) * k;
}
// Where it is creased and rucked: [from x, z, to x, z, how high, how wide]. A crease by its left hem; one from the
// pot's foot out to the front left (the lemon rides over it); the big ruck to the right of the pot, where it was
// pushed, and a smaller one off it; one by the front hem, and one behind.
const RUCKS = [[-0.6, -0.16, -0.5, 0.4, 0.026, 0.045], [-0.3, 0.31, -0.5, 0.64, 0.012, 0.04], [0.36, -0.2, 0.52, 0.22, 0.04, 0.05], [0.3, 0.14, 0.5, 0.4, 0.022, 0.035], [-0.3, 0.76, 0.16, 0.79, 0.014, 0.03], [-0.36, -0.36, -0.1, -0.4, 0.016, 0.035]];
// The corner turned back: the line it is folded on (a point of it, and the way out across it), and the roll of the fold.
const FOLD = { x: CL.x + 0.66 * Math.cos(0.7), z: CL.z + 0.66 * Math.sin(0.7), dx: Math.cos(0.7), dz: Math.sin(0.7), w: 0.036 };
const foldT = (x, z) => (x - FOLD.x) * FOLD.dx + (z - FOLD.z) * FOLD.dz;      // how far beyond the fold line
// How high the cloth lies at (x, z), laid out flat (0 beyond its hem).
function clothH(x, z) {
  const dx = x - CL.x, dz = z - CL.z, th = Math.atan2(dz, dx), q = Math.hypot(dx, dz) / clothEdge(th);
  if (q >= 1) return 0;
  let h = 0;
  for (const [x0, z0, x1, z1, hh, wd] of RUCKS) {
    const ex = x1 - x0, ez = z1 - z0, k = clamp01(((x - x0) * ex + (z - z0) * ez) / (ex * ex + ez * ez)), d = Math.hypot(x - x0 - ex * k, z - z0 - ez * k);
    h += hh * Math.exp(-(d / wd) * (d / wd)) * Math.pow(Math.sin(PI * (0.06 + 0.88 * k)), 0.6);
  }
  h += 0.005 * (Math.sin(x * 7 + z * 3 + 1) * Math.sin(z * 8 - x * 3) + 1) + 0.002 * Math.sin(x * 23 - z * 17);                    // it never lies quite flat
  h *= sstep(R - 0.03, R + 0.09, Math.hypot(x, z));                                             // (pressed flat under the pot)
  h += 0.013 * sstep(0.72, 0.95, q) * Math.pow(0.5 + 0.5 * Math.sin(th * 5 + 1.3 + 1.5 * Math.sin(th * 2)), 4);      // its hem lifts here and there
  return 0.003 + (0.002 + h) * sstep(1, 0.9, q);
}
// The top of what the lemon rolls on there: the cloth, the turned corner lying on it, or the boards.
function clothTop(x, z) {
  const t = foldT(x, z);
  if (t > 0) return 0;
  const s = Math.abs((x - FOLD.x) * -FOLD.dz + (z - FOLD.z) * FOLD.dx);
  return clothH(x, z) + (-t < 0.076 && s < 0.13 * (1 + t / 0.076) ? 0.024 : 0);
}

// ---------------------------------------------------------------- geometry
// A smooth surface from a rule: f(u, v, o) sets o.p (a point) and o.c (its colour, or what the shader is to know of
// it) for u, v in 0..1, and may set o.t; its normals are taken from the rule. Every vertex says what it is (aK: kind,
// what moves it, when it is painted in) and where on its part it lies (aUv: u, v, or o.t).
const K_COPPER = 0, K_INSIDE = 1, K_LID = 2, K_IRON = 3, K_LEMON = 4, K_HAFT = 5, K_BLADE = 6, K_LEAF = 7, K_UNDER = 8, K_CLOTH = 9;
const M_STILL = 0, M_LID = 1, M_LEMON = 2;
const _o = { p: new THREE.Vector3(), c: new THREE.Color(), t: new THREE.Vector2() }, _q = [0, 1, 2, 3].map(() => new THREE.Vector3()), _n = new THREE.Vector3();
function surf(nu, nv, f, kind, move = M_STILL, when = 0) {
  const W = nv + 1, n = (nu + 1) * W, P = new Float32Array(n * 3), N = new Float32Array(n * 3), C = new Float32Array(n * 3), T = new Float32Array(n * 2), e = 2e-3;
  const at = (u, v, into) => { f(u, v, _o); return into.copy(_o.p); };
  for (let i = 0; i <= nu; i++) for (let j = 0; j <= nv; j++) {
    const u = i / nu, v = j / nv, k = (i * W + j) * 3;
    _o.t.set(u, v); f(u, v, _o); P[k] = _o.p.x; P[k + 1] = _o.p.y; P[k + 2] = _o.p.z; C[k] = _o.c.r; C[k + 1] = _o.c.g; C[k + 2] = _o.c.b; T[(i * W + j) * 2] = _o.t.x; T[(i * W + j) * 2 + 1] = _o.t.y;
    const uu = Math.min(1 - e, Math.max(e, u)), vv = Math.min(1 - e, Math.max(e, v));
    at(uu + e, vv, _q[0]).sub(at(uu - e, vv, _q[1])); at(uu, vv + e, _q[2]).sub(at(uu, vv - e, _q[3]));
    _n.crossVectors(_q[0], _q[2]); if (_n.lengthSq() < 1e-24) _n.set(0, 1, 0); else _n.normalize();
    N[k] = _n.x; N[k + 1] = _n.y; N[k + 2] = _n.z;
  }
  const m = nu * nv * 6, pos = new Float32Array(m * 3), nor = new Float32Array(m * 3), col = new Float32Array(m * 3), uv = new Float32Array(m * 2), ak = new Float32Array(m * 3); let w = 0;
  const put = k => { for (let c = 0; c < 3; c++) { pos[w * 3 + c] = P[k * 3 + c]; nor[w * 3 + c] = N[k * 3 + c]; col[w * 3 + c] = C[k * 3 + c]; } uv[w * 2] = T[k * 2]; uv[w * 2 + 1] = T[k * 2 + 1]; ak[w * 3] = kind; ak[w * 3 + 1] = move; ak[w * 3 + 2] = when; w++; };
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
const placed = (g, m) => { g.applyMatrix4(m); return g; };
// Turned on a wheel: a profile [[r, y], ...] round the y axis, eased through its points.
function turned(pts, seg, rings, c, kind, move, when) {
  const curve = new THREE.CatmullRomCurve3(pts.map(([r, y]) => new THREE.Vector3(r, y, 0)), false, 'centripetal'), q = new THREE.Vector3();
  return surf(seg, rings, (u, v, o) => { curve.getPoint(v, q); const ph = u * TAU; o.p.set(q.x * Math.sin(ph), q.y, q.x * Math.cos(ph)); o.c.copy(c); }, kind, move, when);
}
// A ring of rod (a handle): radius RR in its own x-y plane, the rod r thick; from angle a0 to a1.
const ring = (RR, r, a0, a1, c, kind, move, when) => surf(18, 8, (u, v, o) => { const a = lerp(a0, a1, u), b = v * TAU, q = RR + r * Math.cos(b); o.p.set(q * Math.cos(a), q * Math.sin(a), r * Math.sin(b)); o.c.copy(c); }, kind, move, when);
// A profile through points [[t, r], ...], eased between them.
function profile(pts, t) {
  for (let i = 1; i < pts.length; i++) if (t <= pts[i][0]) { const a = pts[i - 1], b = pts[i]; return lerp(a[1], b[1], sstep(a[0], b[0], t) * 0.6 + 0.4 * clamp01((t - a[0]) / (b[0] - a[0]))); }
  return pts[pts.length - 1][1];
}
// The cloth as it lies: out from its middle to its hem, over its rucks, the one corner rolled over on its fold line
// and laid back on the rest. What the shader is told of each point (in its colour): how deep in shadow the fold
// leaves it, whether it is the cloth's other side, and how near the hem.
function clothSheet() {
  const Rf = FOLD.w / PI;
  return surf(150, 46, (u, v, o) => {
    const th = u * TAU, q = 1 - Math.pow(1 - v, 1.5), rr = q * clothEdge(th);
    const x = CL.x + rr * Math.cos(th), z = CL.z + rr * Math.sin(th), t = foldT(x, z);
    o.t.set(x, z);
    const s = Math.abs((x - FOLD.x) * -FOLD.dz + (z - FOLD.z) * FOLD.dx);
    if (t <= 0) {
      o.p.set(x, clothH(x, z), z);
      o.c.setRGB(1 - 0.58 * sstep(-0.12, -0.015, t) * sstep(0.2, 0.07, s), 0, q);
    } else {
      // over the roll of the fold, and back the way it came, lying on the cloth
      const bx = x - t * FOLD.dx, bz = z - t * FOLD.dz, ph = PI * Math.min(1, t / FOLD.w), back = Rf * Math.sin(ph) - Math.max(0, t - FOLD.w) * 0.97;
      const px = bx + FOLD.dx * back, pz = bz + FOLD.dz * back, on = t <= FOLD.w;
      o.p.set(px, clothH(on ? bx : px, on ? bz : pz) + Rf * (1 - Math.cos(ph)) + 0.003 * sstep(FOLD.w, FOLD.w + 0.04, t) + 0.004 * sstep(0.9, 1, q) * (1 + Math.sin(th * 23)), pz);
      o.c.setRGB(1, sstep(0.3 * FOLD.w, 0.7 * FOLD.w, t), q);
    }
  }, K_CLOTH);
}

const NOISE = /* glsl */`
float mH(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float mN(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mH(i), mH(i + vec2(1.0, 0.0)), f.x), mix(mH(i + vec2(0.0, 1.0)), mH(i + vec2(1.0, 1.0)), f.x), f.y); }
float sq(float x) { return x * x; }
float seg(vec2 p, vec2 a, vec2 b) { vec2 pa = p - a, ba = b - a; return length(pa - ba * clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0)); }`;
const f3 = x => x.toFixed(3), v2 = (x, y) => `vec2(${x.toFixed(4)}, ${y.toFixed(4)})`;

lifeFor(44892, {
  title: /^Fish \(Still Life\)/,
  word: 'gleam',
  // (a small work: the kit keeps the whole of it in view, in the upper part, with the cloth and the pot below)
  stage: { out: 1.55, half: 1.0, cam: { dist: 2.5, side: 0.12, height: 0.98, fov: 58, lookU: -0.02, lookOut: 0.6, lookH: 0.8, floorOut: 1.5 } },
  wake: 2, ret: 2.4,
  linger: { near: 4, max: 30 },

  build(L) {
    const P = L.pal, col = (h, a = 0.08) => P.near(h, a), glsl = (h, a) => { const c = col(h, a); return `vec3(${c.r.toFixed(4)}, ${c.g.toFixed(4)}, ${c.b.toFixed(4)})`; };
    const V = this.V = { a: new THREE.Matrix4(), b: new THREE.Matrix4(), v: new THREE.Vector3(), w: new THREE.Vector3(), q: new THREE.Quaternion(), q2: new THREE.Quaternion(), one: new THREE.Vector3(1, 1, 1), ax: new THREE.Vector3(), X: new THREE.Vector3(1, 0, 0), Y: new THREE.Vector3(0, 1, 0) };
    // the pot's own space, in the room
    this.B = new THREE.Matrix4().makeBasis(new THREE.Vector3(L.tx, 0, L.tz), new THREE.Vector3(0, 1, 0), new THREE.Vector3(L.nx, 0, L.nz)).setPosition(L.floor(U0, OUT0).setY(L.y + LIFT));
    this.Binv = this.B.clone().invert();
    this.wallZ = -OUT0; this.railY = L.rail - L.y - LIFT;

    const parts = [clothSheet()];
    // ------------------------------------------------------------ the pot: copper, turned; two ears; the lid
    const cop = col('#5a2c14');
    parts.push(turned([[0.001, 0], [R * 0.8, 0], [R * 0.93, 0.004], [R * 0.975, 0.02], [R * 0.986, 0.05], [R * 0.992, 0.12], [R, H - 0.03], [R + 0.003, H - 0.012], [R + 0.0065, H - 0.004], [R + 0.005, H + 0.003], [R - 0.002, H + 0.005], [R - 0.009, H]], 72, 30, cop, K_COPPER));
    parts.push(turned([[R - 0.009, H], [R - 0.011, H - 0.02], [R - 0.012, H - 0.1], [R - 0.013, H - 0.178], [R - 0.03, H - 0.18], [0.001, H - 0.18]], 48, 8, col('#140c08'), K_INSIDE));
    const iron = col('#1a1410');
    for (const th of EARS) {
      // an ear: a loop of rod riveted on under the rim, standing a little out from the pot
      const m = new THREE.Matrix4().makeRotationY(PI / 2 - th).multiply(V.a.makeTranslation(0, H - 0.02, R + 0.004)).multiply(V.b.makeRotationX(0.3));
      parts.push(placed(ring(0.048, 0.012, 0, TAU, iron, K_IRON, M_STILL, 0.74), m));
      parts.push(placed(surf(10, 6, (u, v, o) => { const a = u * TAU, rr = 0.034 * Math.sqrt(v); o.p.set(rr * Math.cos(a) * 1.5, rr * Math.sin(a) - 0.034, 0.007 - 0.005 * v); o.c.copy(iron); }, K_IRON, M_STILL, 0.74), m.clone().multiply(V.b.makeRotationX(-0.3))));
    }
    // the lid, lying flat round its own middle (the shader tips it into the pot)
    const lidC = col('#2a2622');
    parts.push(turned([[0.001, 0.015], [RL * 0.35, 0.014], [RL * 0.7, 0.009], [RL * 0.92, 0.003], [RL - 0.006, 0.0005], [RL, -0.003]], 56, 12, lidC, K_LID, M_LID));
    parts.push(turned([[RL, -0.003], [RL - 0.006, -0.0065], [RL * 0.75, -0.005], [0.001, -0.004]], 40, 5, col('#17110c'), K_UNDER, M_LID));
    parts.push(placed(ring(0.041, 0.0085, 0.12, PI - 0.12, iron, K_IRON, M_LID, 0.97), new THREE.Matrix4().makeTranslation(0, 0.008, 0).multiply(V.b.makeRotationY(0.5))));

    // ------------------------------------------------------------ the lemon: smooth, a nipple at each end (the one at -x the bigger), a little fuller on one side
    const PR = [[0, 0.0005], [0.014, 0.009], [0.045, 0.017], [0.085, 0.025], [0.15, 0.045], [0.28, 0.068], [0.5, 0.078], [0.7, 0.072], [0.84, 0.054], [0.92, 0.033], [0.96, 0.02], [0.988, 0.011], [1, 0.0005]];
    const pc = new THREE.CatmullRomCurve3(PR.map(([t, r]) => new THREE.Vector3(t, r, 0)), false, 'centripetal'), pq = new THREE.Vector3();
    parts.push(surf(44, 48, (u, v, o) => {
      pc.getPoint(v, pq);
      const ph = u * TAU, rr = pq.y * (LR / 0.078) * (1 + 0.035 * Math.cos(ph - 0.6) * Math.sin(PI * pq.x));
      o.p.set((pq.x - 0.5) * LLEN, rr * Math.cos(ph) + 0.005 * Math.sin(PI * pq.x), rr * Math.sin(ph));
      o.c.setRGB(1, 1, 1);
    }, K_LEMON, M_LEMON));

    // ------------------------------------------------------------ the knife: a dark haft, a worn blade; lying on the cloth
    {
      const [a, b] = KNIFE, len = Math.hypot(b[0] - a[0], b[1] - a[1]), yaw = Math.atan2(-(b[1] - a[1]), b[0] - a[0]), hl = len * 0.47;
      const m = new THREE.Matrix4().makeTranslation(a[0], clothH((a[0] + b[0]) / 2, (a[1] + b[1]) / 2), a[1]).multiply(V.b.makeRotationY(yaw));
      const haft = col('#16130f'), steel = col('#6d695f');
      parts.push(placed(surf(10, 12, (u, v, o) => {
        const ph = u * TAU, k = Math.pow(Math.sin(PI * (0.04 + 0.92 * v)), 0.3) * (0.9 + 0.1 * Math.sin(v * 5));
        o.p.set(v * hl, 0.0085 + 0.0078 * k * Math.cos(ph), 0.012 * k * Math.sin(ph)); o.c.copy(haft);
      }, K_HAFT, M_STILL, 0), m.clone()));
      parts.push(placed(surf(1, 10, (u, v, o) => {
        const wd = 0.013 * (1 - Math.pow(v, 2.2)) + 0.0006;      // its back straight, its edge curving up to the point
        o.p.set(hl - 0.006 + v * (len - hl + 0.006), 0.0045 + 0.002 * (1 - u), (u * 2 - 1) * wd - 0.013 * Math.pow(v, 2.2) * 0.9); o.c.copy(steel);
      }, K_BLADE, M_STILL, 0.3), m.clone()));
    }

    // ------------------------------------------------------------ the parsley: a few curled leaves on two stalks
    {
      const rnd = rng(8), greens = [col('#3c5a27'), col('#547638'), col('#2a4120'), col('#688a45')], y0 = clothH(SPRIG[0] + 0.04, SPRIG[1] + 0.04);
      const LEAVES = [[0, 0, 0.2], [0.03, 0.012, 1.4], [-0.012, 0.03, 2.6], [0.045, 0.04, 0.7], [0.012, 0.052, 3.4], [0.07, 0.022, 5.2], [0.085, 0.052, 4.1], [-0.03, 0.062, 2.0], [0.05, 0.075, 1.0], [0.1, 0.08, 5.8]];
      LEAVES.forEach(([x, z, yaw], i) => {
        const size = 0.026 + 0.014 * rnd(), cup = 0.5 + 0.8 * rnd(), c = greens[i % greens.length], c2 = greens[(i + 1) % greens.length], lift = y0 + 0.004 + 0.018 * rnd();
        const m = new THREE.Matrix4().makeTranslation(SPRIG[0] + x, lift, SPRIG[1] + z).multiply(V.a.makeRotationY(yaw)).multiply(V.b.makeRotationZ(0.25 + 0.5 * rnd()));
        // three lobes, frilled, cupped
        parts.push(placed(surf(12, 3, (u, v, o) => {
          const a = (u - 0.5) * 2.5, lobe = 0.62 + 0.38 * Math.pow(Math.abs(Math.cos(a * 1.9)), 0.7), rr = v * size * lobe;
          o.p.set(rr * Math.cos(a), cup * rr * rr / size + 0.0025 * Math.sin(a * 9 + i) * v, rr * Math.sin(a)); o.c.copy(c).lerp(c2, v);
        }, K_LEAF, M_STILL, 0.5 + 0.035 * i), m));
      });
      const stalkC = col('#557038');
      for (const [x0, z0, x1, z1] of [[-0.035, -0.02, 0.07, 0.05], [0.0, 0.07, 0.05, 0.02]]) {
        parts.push(surf(5, 4, (u, v, o) => { const ph = u * TAU, rr = 0.0016; o.p.set(SPRIG[0] + lerp(x0, x1, v) + rr * Math.cos(ph), y0 + 0.004 + 0.008 * Math.sin(PI * v) + rr * Math.sin(ph), SPRIG[1] + lerp(z0, z1, v)); o.c.copy(stalkC); }, K_LEAF, M_STILL, 0.48));
      }
    }

    // ------------------------------------------------------------ his paint on them: one material, one draw call
    const u = this.u = {
      uInv: { value: this.Binv }, uLid: { value: new THREE.Matrix4() }, uLem: { value: new THREE.Matrix4() }, uLemP: { value: new THREE.Vector3(0, -9, 0) },
      uGleam: { value: 0 }, uFlare: { value: 0 }, uPot: { value: 0 }, uSmall: { value: 0 }, uCloth: { value: 0 }, uLemS: { value: 0 },
    };
    const sun = new THREE.Vector3(...SUN).normalize(), shDir = new THREE.Vector2(-sun.x, -sun.z).normalize(), reach = Math.hypot(sun.x, sun.z) / sun.y;
    // The shadows thrown away from his light at q (the pot's own metres, on the flat): the pot's, close round its
    // foot and long behind it; the lemon's; the knife's; the parsley's. Written once, for the cloth and for the boards.
    const SHADE = /* glsl */`
  vec2 sd = ${v2(shDir.x, shDir.y)};
  float dp = length(q) - ${f3(R)};
  float sp = max(0.75 * smoothstep(0.08, -0.03, dp), 0.6 * smoothstep(0.08, -0.05, seg(q, vec2(0.0), sd * ${f3(H * reach)}) - ${f3(R)})) * smoothstep(0.1, 0.9, uPot);
  vec2 lq = q - uLemP.xz - sd * (0.02 + max(uLemP.y - ${f3(LR)}, 0.0) * ${f3(reach)});
  float sl = 0.68 * smoothstep(0.125, 0.02, length(lq * vec2(0.9, 1.2))) * clamp(1.0 - (uLemP.y - ${f3(LR)}) / 0.6, 0.0, 1.0) * uLemS;`;
    const tm = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, fog: false });
    tm.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, u);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', `#include <common>
attribute vec3 aK; attribute vec2 aUv; uniform mat4 uLid, uLem;
varying vec3 vK, vOP, vLP, vN; varying vec2 vUv2;`)
        .replace('#include <begin_vertex>', `vec3 transformed = vec3(position); vec3 ln = normal;
  if (aK.y > 1.5) { transformed = (uLem * vec4(position, 1.0)).xyz; ln = mat3(uLem) * normal; }
  else if (aK.y > 0.5) { transformed = (uLid * vec4(position, 1.0)).xyz; ln = mat3(uLid) * normal; }
  vK = aK; vUv2 = aUv; vOP = position; vLP = transformed; vN = ln;`);
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
uniform mat4 uInv; uniform vec3 uLemP; uniform float uGleam, uFlare, uPot, uSmall, uCloth, uLemS;
varying vec3 vK, vOP, vLP, vN; varying vec2 vUv2;${NOISE}`)
        .replace('#include <opaque_fragment>', `{
  int kind = int(vK.x + 0.5);
  vec3 N = normalize(vN); if (!gl_FrontFacing) N = -N;
  vec3 eye = (uInv * vec4(cameraPosition, 1.0)).xyz, Vd = normalize(eye - vLP);
  vec3 Lk = vec3(${sun.x.toFixed(4)}, ${sun.y.toFixed(4)}, ${sun.z.toFixed(4)});
  float nl = dot(N, Lk), key = ${KEY.toFixed(2)};
  vec3 c = diffuseColor.rgb;
  // where the lemon shows in the copper, seen from here: round the pot, half way between you and it
  vec2 vh = normalize(eye.xz), lh = normalize(uLemP.xz + vec2(1.0e-4, 0.0)), hh = normalize(vh + lh + vec2(0.0, 1.0e-4));
  float seen = smoothstep(-0.55, 0.3, dot(vh, lh)), g = uGleam * seen, fl = uFlare * seen;
  if (kind == ${K_CLOTH}) {
    vec2 cu = vUv2;                                                   // where on the cloth, laid out flat
    // brushed out from the wall: a stroke one way and a stroke back, each with its ragged end
    float row = (cu.y + 0.46) / 0.19 + 0.6 * (mN(vec2(cu.x * 3.0, 1.0)) - 0.5), ri = floor(row), sw = (cu.x + 0.68) / 1.36;
    if (mod(ri, 2.0) > 0.5) sw = 1.0 - sw;
    float arr = (ri + sw) / 7.6 + 0.07 * (mN(vec2(cu.x * 7.0, cu.y * 110.0)) - 0.5);
    if (uCloth < 1.05 && uCloth < arr + 0.04) discard;
    float fold = c.r, wrong = c.g, hem = c.b;
    // his white: light where it lies open, warm grey where it turns from the light, a colder grey in the hollows;
    // laid in broad wet strokes, so that light and shade break into one another along the brush
    vec2 d1 = vec2(0.96, -0.28), d2 = vec2(0.28, 0.96), e1 = vec2(0.62, 0.78), e2 = vec2(-0.78, 0.62);
    float s1 = mN(vec2(dot(cu, d1) * 2.4, dot(cu, d2) * 11.0)), s2 = mN(vec2(dot(cu, e1) * 2.8 + 5.0, dot(cu, e2) * 10.0)), bris = mN(vec2(dot(cu, d1) * 8.0, dot(cu, d2) * 130.0)), bris2 = mN(vec2(dot(cu, e1) * 7.0, dot(cu, e2) * 90.0));
    float tone = smoothstep(0.38, 0.8, nl + 0.16 * (s1 - 0.5) + 0.1 * (bris - 0.5));
    vec3 col = mix(${glsl('#787674', 0.04)}, ${glsl('#a39985')}, smoothstep(0.0, 0.45, tone));
    col = mix(col, ${glsl('#d6cdb8')}, smoothstep(0.35, 0.95, tone));
    col = mix(col, ${glsl('#e6e0d1')}, 0.3 * smoothstep(0.86, 1.0, nl + 0.1 * (s2 - 0.5)));
    col = mix(col, ${glsl('#b5aa92')}, 0.6 * smoothstep(0.52, 0.7, s1) * (0.4 + 0.6 * tone));
    col = mix(col, ${glsl('#959a9a', 0.04)}, 0.52 * smoothstep(0.56, 0.74, s2));
    col = mix(col, ${glsl('#e6dfcf')}, 0.4 * smoothstep(0.62, 0.8, mN(vec2(dot(cu, e1) * 3.4 + 9.0, dot(cu, e2) * 13.0))) * tone);
    col *= 0.9 + 0.13 * bris + 0.07 * bris2;
    col *= mix(0.42, 1.0, fold) * (1.0 - 0.1 * wrong) * (1.0 - 0.07 * smoothstep(0.95, 1.0, hem));
    vec2 q = vLP.xz;${SHADE}
    float sk = 0.42 * smoothstep(0.024, 0.005, seg(q - sd * 0.008, ${v2(...KNIFE[0])}, ${v2(...KNIFE[1])})) * smoothstep(0.3, 1.0, uSmall);
    float ss = 0.3 * smoothstep(0.085, 0.02, length(q - ${v2(SPRIG[0] + 0.035, SPRIG[1] + 0.035)} - sd * 0.008)) * smoothstep(0.5, 1.0, uSmall);
    float shade = 1.0 - (1.0 - sp) * (1.0 - sl) * (1.0 - sk) * (1.0 - ss);
    // the exchange: the copper's warmth on the cloth at its foot, where its light is; the lemon's yellow under the lemon
    float bloom = g * (0.4 + 0.6 * uFlare) * exp(-sq(length(q - hh * ${f3(R + 0.09)}) / 0.19)) * smoothstep(-0.02, 0.06, dp);
    col = mix(col, col * ${glsl('#ffb588', 0)} * 1.08, 0.85 * bloom);
    col = mix(col, col * ${glsl('#fff0a2', 0)}, 0.4 * smoothstep(0.24, 0.06, length(q - uLemP.xz)) * uLemS);
    col = mix(col, col * ${glsl('#5c5a66', 0)}, shade);
    c = col; key = ${KEY_W.toFixed(2)};
  } else if (kind == ${K_COPPER}) {
    if (!gl_FrontFacing) discard;
    float ph = atan(vOP.x, vOP.z), y = vOP.y / ${f3(H)};
    // brushed in band over band, each swept round from the left, or back
    float bf = y * 4.6 + 0.7 * (mN(vec2(ph * 1.4, 3.7)) - 0.5), bi = floor(bf), sw = ph / 6.2832 + 0.5;
    if (mod(bi, 2.0) > 0.5) sw = 1.0 - sw;
    float ord = (bi + sw) / 7.2 + 0.035 * (mN(vec2(ph * 26.0, y * 70.0)) - 0.5);
    if (uPot < 0.999 && uPot * 1.08 < ord + 0.03) discard;
    // his copper: dark, in strokes that go round it; a darker band here, a browner one there, a few dragged down it
    float slow = mN(vec2(ph * 1.1 + 4.0, y * 2.6)), bandA = mN(vec2(ph * 2.1 + 2.0, y * 4.6)), bandB = mN(vec2(ph * 2.7 + 8.0, y * 6.5 + 3.0)), down = mN(vec2(ph * 6.5 + 1.0, y * 1.7)), fine = mN(vec2(ph * 5.0, y * 34.0));
    c = mix(${glsl('#27150c')}, ${glsl('#57301a')}, clamp(0.15 + 0.7 * slow, 0.0, 1.0));
    c = mix(c, ${glsl('#180d08')}, 0.55 * smoothstep(0.5, 0.7, bandA));
    c = mix(c, ${glsl('#6a3b1d')}, 0.5 * smoothstep(0.54, 0.74, bandB));
    c = mix(c, ${glsl('#1d120c')}, 0.5 * smoothstep(0.6, 0.72, down) * smoothstep(0.1, 0.4, y));
    c *= 0.86 + 0.28 * fine;
    // the cloth in it: paler and pinker low on the flank; and the dull light he left on its left side
    float low = smoothstep(0.36, 0.02, y);
    c = mix(c, ${glsl('#8f5c40')}, low * (0.15 + 0.4 * bandB) * clamp(uCloth, 0.0, 1.0));
    c = mix(c, ${glsl('#8a4420')}, 0.5 * exp(-sq((ph + 0.95) / 0.42)) * smoothstep(0.12, 0.26, y) * smoothstep(0.52, 0.34, y) * (0.4 + 0.6 * fine));
    // under the rolled rim it is dark; the rim itself is dull, worn brighter only where the light is
    c *= 1.0 - 0.5 * smoothstep(0.84, 0.94, y) * (1.0 - smoothstep(0.945, 0.965, y));
    if (y > 0.955) c = mix(${glsl('#33190c')}, ${glsl('#7d4a28')}, clamp(0.1 + 0.5 * nl + 0.6 * (fine - 0.5), 0.0, 1.0));
    // the gleam: the lemon's light in a turned copper wall. Tall, soft, round with the curve; fullest at its
    // middle, drawn in towards the rim and the foot; feathered at its edge, brightest in its core
    vec2 nh = normalize(N.xz + vec2(0.0, 1.0e-4));
    float a = atan(nh.x * hh.y - nh.y * hh.x, dot(nh, hh)), aa = a + 0.05 * (y - 0.5);
    float tall = max(sin(3.1416 * clamp((y - 0.03) / 0.9, 0.0, 1.0)), 0.0), wd = 0.09 + 0.24 * pow(tall, 0.8);
    float wet = 0.86 + 0.28 * (mN(vec2(aa * 11.0, y * 2.4)) - 0.5), drag = 0.8 + 0.4 * (mN(vec2(aa * 44.0, y * 2.0)) - 0.5);
    float soft = exp(-sq(aa / wd)) * smoothstep(0.02, 0.2, y) * (1.0 - smoothstep(0.8, 0.94, y));
    float core = exp(-sq(aa / (wd * 0.4))) * pow(tall, 1.6);
    c = mix(c, ${glsl('#74300f')}, 0.8 * g * soft);
    c = mix(c, ${glsl('#bd5a26', 0.03)}, 0.92 * g * soft * soft * wet);
    c = mix(c, ${glsl('#d27f44', 0.03)}, 0.55 * g * core * wet * (1.0 - 0.6 * uFlare));
    // the lemon itself, low in it, yellow gone to gold in the copper
    c = mix(c, ${glsl('#cf9a34', 0.03)}, 0.6 * g * exp(-sq(aa / 0.1) - sq((y - 0.15) / 0.06)));
    // his blaze: a touch of pale salmon, a touch of red-orange, a touch of pale; tall wet strokes, one into the next,
    // each a little broader or narrower as the brush went down, soft where it left off
    float wb = 0.035 * (mN(vec2(y * 3.0, 3.0)) - 0.5), fat = 0.75 + 0.5 * mN(vec2(y * 3.6, 8.0)), fat2 = 0.75 + 0.5 * mN(vec2(y * 3.1 + 4.0, 5.0));
    float t1 = (1.0 - smoothstep(0.03 * fat, 0.03 * fat + 0.035, abs(aa + 0.105 + wb))) * smoothstep(0.24, 0.42, y) * (1.0 - smoothstep(0.76, 0.9, y));
    float t2 = (1.0 - smoothstep(0.022, 0.07, abs(aa - 0.004 - wb))) * smoothstep(0.1, 0.3, y) * (1.0 - smoothstep(0.66, 0.86, y));
    float t3 = (1.0 - smoothstep(0.036 * fat2, 0.036 * fat2 + 0.04, abs(aa - 0.12 + wb))) * smoothstep(0.12, 0.3, y) * (1.0 - smoothstep(0.58, 0.76, y));
    c = mix(c, ${glsl('#b83a17', 0.03)}, 0.85 * fl * t2 * wet);
    c = mix(c, ${glsl('#e3a67e', 0.03)}, 0.9 * fl * max(t1, t3) * drag);
  } else if (kind == ${K_INSIDE}) {
    vec3 inw = vOP.y > ${f3(H - 0.176)} ? normalize(vec3(-vOP.x, 0.0, -vOP.z)) : vec3(0.0, 1.0, 0.0);
    if (dot(inw, Vd) < 0.0 || uPot < 0.72) discard;
    c *= 0.8 + 0.5 * mN(vOP.xz * 30.0) + 1.2 * smoothstep(${f3(H - 0.03)}, ${f3(H)}, vOP.y);
  } else if (kind == ${K_LID} || kind == ${K_UNDER}) {
    float rr = length(vOP.xz) / ${f3(RL)};
    if (uPot < 0.999 && uPot < 0.8 + 0.19 * (vOP.x / ${f3(RL)} * 0.5 + 0.5) + 0.02 * (mN(vOP.xz * 80.0) - 0.5)) discard;
    if (kind == ${K_LID}) {
      // dull pewter-black, and one soft light on it, on the side his light comes from
      float bro = mN(vOP.xz * 6.0 + 3.0);
      c = mix(${glsl('#181513')}, ${glsl('#35312c')}, 0.2 + 0.6 * bro);
      float one = exp(-sq((vOP.x + 0.05) / 0.2) - sq((vOP.z - 0.06) / 0.11));
      c = mix(c, ${glsl('#a09c92')}, 0.82 * one * (0.8 + 0.2 * mN(vec2(vOP.x * 5.0, vOP.z * 40.0))));
      c = mix(c, ${glsl('#5e5850')}, 0.5 * smoothstep(0.955, 0.99, rr));
      // (the copper's gleam catches the edge nearest the lemon)
      vec2 ld = normalize(vOP.xz + vec2(0.0, 1.0e-4)); float nr = max(dot(ld, hh), 0.0);
      c = mix(c, ${glsl('#b0683a')}, 0.45 * g * pow(nr, 6.0) * smoothstep(0.9, 0.98, rr));
    } else c *= 0.8 + 0.4 * mN(vOP.xz * 20.0);
  } else if (kind == ${K_IRON}) {
    if (uPot < vK.z) discard;
    c = c * (0.7 + 0.6 * mN(vOP.xy * 90.0)) + ${glsl('#6f6558')} * 0.4 * pow(max(dot(N, normalize(Lk + Vd)), 0.0), 9.0);
  } else if (kind == ${K_LEMON}) {
    // a smooth skin in his broken yellows (they go round with it as it rolls), greener at its two ends; a cool
    // greenish shade on the side away from the light, and one white touch where the light is
    vec3 on = abs(normalize(vec3(vOP.x * 0.35, vOP.y, vOP.z))); on /= on.x + on.y + on.z;
    float pa = on.x * mN(vOP.yz * 17.0 + 3.0) + on.y * mN(vOP.xz * 17.0 + 1.0) + on.z * mN(vOP.xy * 17.0 + 5.0);
    float pb = on.x * mN(vOP.yz * 31.0 + 7.0) + on.y * mN(vOP.xz * 31.0 + 9.0) + on.z * mN(vOP.xy * 31.0 + 2.0);
    float ends = smoothstep(${f3(LLEN * 0.3)}, ${f3(LLEN * 0.5)}, abs(vOP.x));
    vec3 skin = mix(${glsl('#dcb326', 0.03)}, ${glsl('#ecca3c', 0.03)}, smoothstep(0.34, 0.66, pa));
    skin = mix(skin, ${glsl('#cfa01c', 0.03)}, 0.55 * smoothstep(0.52, 0.72, pb));
    skin = mix(skin, ${glsl('#a9a437', 0.04)}, 0.7 * ends);
    float lit = smoothstep(-0.45, 0.55, nl + 0.12 * (pb - 0.5));
    c = mix(${glsl('#6f7a34', 0.04)}, skin, lit);
    c = mix(c, ${glsl('#f5e78c', 0.02)}, 0.6 * smoothstep(0.55, 0.95, nl + 0.1 * (pa - 0.5)));
    float hl = pow(max(dot(N, normalize(Lk + Vd)), 0.0), 26.0);
    c = mix(c, ${glsl('#fdf8e2', 0)}, 0.9 * smoothstep(0.35, 0.8, hl));
    c += ${glsl('#6a5a40')} * 0.4 * max(-N.y, 0.0) * clamp(uCloth, 0.0, 1.0);          // (the white cloth, from under it)
    c = mix(c, ${glsl('#b8602c')}, 0.22 * g * smoothstep(0.0, 0.7, dot(N.xz, -lh)));   // (and the copper, from beside it)
    key *= 0.92;
  } else if (kind == ${K_HAFT}) {
    if (uSmall * 1.3 < vK.z + 0.3 * vUv2.y) discard;
    c = c * (0.8 + 0.5 * mN(vOP.xz * 160.0)) + ${glsl('#8f8a80')} * 0.5 * smoothstep(0.82, 0.98, N.y) * smoothstep(0.35, 0.65, mN(vec2(vUv2.y * 7.0, 2.0)));
  } else if (kind == ${K_BLADE}) {
    if (uSmall * 1.3 < vK.z + 0.6 * vUv2.y) discard;
    c = mix(${glsl('#4a4740')}, ${glsl('#a7a294')}, clamp(0.2 + 0.9 * mN(vec2(vUv2.y * 5.0, vUv2.x * 2.0 + 7.0)) * (0.4 + 0.6 * vUv2.x), 0.0, 1.0));
  } else {
    if (uSmall * 1.3 < vK.z + 0.1 * vUv2.y) discard;
    c *= 0.62 + 0.55 * clamp(nl, 0.0, 1.0) + 0.3 * mN(vOP.xz * 300.0);
  }
  outgoingLight = c * key;
}
#include <opaque_fragment>`);
    };
    tm.customProgramCacheKey = () => 'manet-fish-things';
    this.things = new THREE.Mesh(merge(parts), tm); this.things.name = 'cloth-pot-lemon-knife-parsley';
    this.things.matrixAutoUpdate = false; this.things.matrix.copy(this.B); this.things.matrixWorldNeedsUpdate = true;
    L.add(this.things);

    // ------------------------------------------------------------ what they throw on the boards: the cloth's own
    // shadow under its hem and its turned corner, the pot's where it falls beyond the cloth, the lemon's when it is off it
    const gu = this.gu = { uLemP: u.uLemP, uPot: u.uPot, uCloth: u.uCloth, uLemS: u.uLemS };
    const gm = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, depthWrite: false, fog: false });
    gm.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, gu);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec2 vFl;').replace('#include <begin_vertex>', '#include <begin_vertex>\n  vFl = uv;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
uniform vec3 uLemP; uniform float uPot, uCloth, uLemS; varying vec2 vFl;${NOISE}
float clothEdge(float th) {
  float c = abs(cos(th - ${f3(CL.rot)})) / ${f3(CL.a)}, s = abs(sin(th - ${f3(CL.rot)})) / ${f3(CL.b)};
  return pow(pow(c, ${f3(CL.n)}) + pow(s, ${f3(CL.n)}), ${f3(-1 / CL.n)}) * (1.0 - ${f3(CL.pinch)} * cos(4.0 * (th - ${f3(CL.rot)}))${CL.w.map(([n, p, a]) => ` + ${f3(a)} * sin(${n.toFixed(1)} * th + ${f3(p)})`).join('')});
}`)
        .replace('#include <opaque_fragment>', `{
  vec2 q = vec2((vFl.x - 0.5) * ${f3(SHADOWS[0])}, (1.0 - vFl.y) * ${f3(SHADOWS[1])} - ${f3(OUT0)});      // in the pot's own metres${SHADE}
  vec2 cq = q - sd * 0.02 - ${v2(CL.x, CL.z)};
  float past = length(cq) - clothEdge(atan(cq.y, cq.x)), turned = dot(q - sd * 0.03 - ${v2(FOLD.x, FOLD.z)}, ${v2(FOLD.dx, FOLD.dz)});
  float under = 0.5 * (1.0 - smoothstep(-0.01, 0.045, max(past, turned))) * smoothstep(0.0, 0.25, uCloth * 1.1 - (q.y + 0.46) / 1.45);
  diffuseColor.a = 1.0 - (1.0 - under) * (1.0 - 0.75 * sp) * (1.0 - sl);
  outgoingLight = vec3(0.012, 0.009, 0.008);
}
#include <opaque_fragment>`);
    };
    gm.customProgramCacheKey = () => 'manet-fish-shadows';
    this.shade = L.decal({ w: SHADOWS[0], d: SHADOWS[1], u: U0, out: SHADOWS[1] / 2, material: gm }); this.shade.name = 'shadows'; this.shade.renderOrder = 5;
    this.blob = L.blobs(1, { fade: true });      // (the lemon's shadow, when the toy has taken it right away)

    // ------------------------------------------------------------ the lemon's road
    const road = this.road = new THREE.CatmullRomCurve3(ROAD.map(([x, z]) => new THREE.Vector3(x, 0, z)), false, 'centripetal');
    road.arcLengthDivisions = 400; road.updateArcLengths();
    this.len = road.getLength(); this.v0 = 2 * this.len / T_ROLL - V_END; this.dec = (this.v0 - V_END) / T_ROLL;
    this.dropY = this.railY - LR - 0.012; this.fall = Math.sqrt(2 * (this.dropY - LR) / G);
    this.T_LAND = T_POP + POP + this.fall; this.T_GO = this.T_LAND + B1.d + B2.d; this.T_HOME = this.T_GO + T_ROLL;
    this.lp = new THREE.Vector3(0, -9, 0); this.lq = new THREE.Quaternion(); this.yaw = 0; this.roll = 0; this.speed = 0;
    this.endP = new THREE.Vector3(); this.endDir = new THREE.Vector3(); road.getPointAt(1, this.endP); road.getTangentAt(1, this.endDir);
    this.rollers = L.rollers(1, { r: LR, bounce: 0.3, roll: 0.42, ground: (x, z) => { const q = L.local(x, z); return LIFT + clothTop(q.u - U0, q.out - OUT0); }, onBounce: (b, sp) => this.thud(L, Math.min(1, sp * 0.5)) });
    this.b = this.rollers.items[0];
    this.from = new THREE.Vector3(); this.via = new THREE.Vector3(); this.to = new THREE.Vector3();

    // ------------------------------------------------------------ the sounds: the brush, the lemon's knocks, the copper
    const s = this.sc = score(L);
    for (let i = 0; i < 7; i++) s.hit(T_WHITE[0] + i * 0.13 * (T_WHITE[1] - T_WHITE[0]), { d: 0.32, vol: 0.016, bp: 1500 + 260 * (i % 3), q: 0.7, attack: 0.07 });      // the cloth, a stroke at a time
    for (let i = 0; i < 5; i++) s.hit(T_POT[0] + i * 0.14, { d: 0.26, vol: 0.011, bp: 620 + 80 * (i % 2), q: 0.8, attack: 0.06 });                                    // the pot, band over band
    const knock = (t, k) => { s.note(t, 132, 0.18, { type: 'sine', vol: 0.055 * k, to: 74, attack: 0.004 }); s.hit(t, { d: 0.08, vol: 0.024 * k, lp: 620 }); };       // (on the boards)
    knock(this.T_LAND, 1); knock(this.T_LAND + B1.d, 0.55); knock(this.T_GO, 0.3);
    // as it rolls: a soft bump each time its heavy side comes round, further apart as it slows
    for (let k = 1; k < 40; k++) {
      const d = k * TAU * LR, disc = this.v0 * this.v0 - 2 * this.dec * d; if (d > this.len - 0.02 || disc < 0) break;
      const tau = (this.v0 - Math.sqrt(disc)) / this.dec, sp = this.v0 - this.dec * tau;
      s.hit(this.T_GO + tau, { d: 0.07, vol: 0.004 + 0.011 * sp, lp: 360 });
    }
    s.hit(this.T_HOME + 0.18, { d: 0.06, vol: 0.006, lp: 320 });                                         // it rocks, once
    // the copper: one long soft note as the blaze comes up (no stroke to it: it swells), and its fifth, fainter
    const T = this.T_HOME + T_BLAZE[0];
    s.note(T, 220, 3.4, { type: 'sine', vol: 0.03, attack: 0.7 }); s.note(T + 0.1, 330, 3.0, { type: 'sine', vol: 0.014, attack: 0.9 }); s.note(T + 0.25, 554.4, 2.4, { type: 'sine', vol: 0.006, attack: 1.0 });
    s.done();

    this.lin = 0; this.at = 0; this.free = false; this.flare = 0; this.shiver = 9; this.hide();
  },

  hide() { this.things.visible = false; this.shade.visible = false; this.blob.count = 0; this.blob.visible = false; },

  // ---------------------------------------------------------------- the lemon, by the show's clock
  // Where it is and how it lies at show-time t (into this.lp, this.lq); false while it is still in the picture.
  lemonAt(L, t, calm) {
    const V = this.V, p = this.lp, soft = calm ? 0.5 : 1;
    const tp = t - T_POP;
    if (tp < 0) { p.set(DROP_X, -9, 0); this.speed = 0; return false; }
    const tumble = (calm ? 3 : 6) * Math.max(0, tp - POP);
    if (t < this.T_LAND) {
      // out from under the frame, and down
      const k = ease.out(tp / POP), f = Math.max(0, tp - POP);
      p.set(DROP_X, this.dropY - 0.5 * G * f * f, lerp(this.wallZ - L.wall - LR, this.wallZ + LR + 0.02, k) + (LAND[1] - this.wallZ - LR - 0.02) * clamp01(f / this.fall));
      this.lq.setFromAxisAngle(V.ax.set(0.5, 0.2, 0.84).normalize(), 0.5 + tumble); this.speed = 0; return true;
    }
    if (t < this.T_GO) {
      // on its end: it kicks to the left; and once more, smaller
      const first = t < this.T_LAND + B1.d, a = first ? LAND : B1.to, b = first ? B1.to : B2.to, d = first ? B1.d : B2.d, q = (t - (first ? this.T_LAND : this.T_LAND + B1.d)) / d;
      p.set(lerp(a[0], b[0], q), LR + 0.5 * G * d * d * q * (1 - q), lerp(a[1], b[1], q));
      this.lq.setFromAxisAngle(V.ax.set(0.5, 0.2, 0.84).normalize(), 0.5 + tumble);
      if (!first) { this.road.getTangentAt(0, V.w); this.rollPose(0, 0); this.lq.slerp(this.pose(), ease.smooth(q)); }
      this.speed = 0.7; return true;
    }
    // rolling: slower and slower along its curve; then it rocks, once, where it stops
    const tau = t - this.T_GO; let s, x = 0;
    if (tau < T_ROLL) { s = this.v0 * tau - 0.5 * this.dec * tau * tau; this.speed = this.v0 - this.dec * tau; }
    else { x = tau - T_ROLL; s = this.len + V_END / ROCK.w * Math.exp(-ROCK.k * x) * Math.sin(ROCK.w * x) * soft; this.speed = 0; }
    if (s <= this.len) { this.road.getPointAt(clamp01(s / this.len), p); this.road.getTangentAt(clamp01(s / this.len), V.w); } else { V.w.copy(this.endDir); p.copy(this.endP).addScaledVector(V.w, s - this.len); }
    p.y = clothTop(p.x, p.z) + LR * (1 + 0.03 * Math.cos(2 * s / LR));
    this.rollPose(s, tau >= T_ROLL ? 0.13 * soft * Math.exp(-3.2 * x) * Math.sin(TAU * x / 0.9) : 0.06 * soft * Math.sin(s / LR) * clamp01(this.speed));
    this.lq.copy(this.pose());
    return true;
  },
  // Rolling the way V.w points, having come s metres: its long axis lies across the way it goes; `sway` turns it a little.
  rollPose(s, sway) { const w = this.V.w; this.yaw = Math.atan2(-w.x, -w.z) + sway; this.roll = -(s - this.len) / LR + 0.9; return this; },
  pose() { const V = this.V; V.q.setFromAxisAngle(V.Y, this.yaw).multiply(V.q2.setFromAxisAngle(V.X, this.roll)); return V.q; },

  // ---------------------------------------------------------------- sounds the toy makes with it
  thud(L, k) { if (L.quiet || k < 0.08) return; const v = L.voice(); v.note(132, 0.16, { type: 'sine', vol: 0.045 * k, to: 76, attack: 0.004 }); noise(v, 0, { d: 0.07, vol: 0.02 * k, lp: 620 }); },
  ring(L, k) {
    this.shiver = 0; this.shiverK = k; if (L.quiet) return;
    const v = L.voice(), f = 233; v.note(f, 1.6, { type: 'sine', vol: 0.05 * k, attack: 0.004 }); v.note(f * 2.76, 0.7, { type: 'sine', vol: 0.016 * k, attack: 0.003 }); v.note(f * 5.4, 0.25, { type: 'sine', vol: 0.006 * k, attack: 0.002 });
    noise(v, 0, { d: 0.05, vol: 0.02 * k, lp: 1800 });
  },

  start(L, resumed) {
    // (a look that finds it still out carries on from where it is: the lemon stays where the toy left it)
    this.lin = resumed ? this.at - L.t : 0; this.sc.from(resumed ? 1e6 : 0);
    if (!resumed) { this.free = false; this.b.on = false; this.flare = 0; this.shiver = 9; }
  },
  back(L) {
    // the lemon goes home under the wall, round whichever side of the pot it is on
    const p = this.lp, side = p.x < 0 ? -1 : 1;
    this.from.copy(p); this.to.set(side * 0.5, LR, this.wallZ - LR - 0.06);
    this.via.set(side * Math.max(0.55, Math.abs(p.x) * 0.5 + 0.32), LR, Math.min(p.z, 0) * 0.5 - 0.1);
    this.wasOut = p.y > -1; this.b.on = false;
    this.hold = { cloth: this.u.uCloth.value, pot: this.u.uPot.value, small: this.u.uSmall.value, flare: this.flare };
    if (!L.quiet) noise(L.voice(), 0.9, { d: 0.9, vol: 0.012, bp: 1300, q: 0.6, attack: 0.3 });
  },
  end() { this.hide(); this.free = false; this.b.on = false; },
  reset() { this.hide(); this.lin = this.at = 0; this.free = false; this.b.on = false; this.flare = 0; this.shiver = 9; },

  update(L, dt) {
    const ph = L.phase, showing = ph === 'wake' || ph === 'play', linger = ph === 'linger', back = ph === 'return';
    if (!showing && !linger && !back) { this.hide(); return; }
    const calm = L.calm, V = this.V, u = this.u, p = this.lp;
    if (linger) this.lin += dt;
    const t = this.at = L.t + this.lin;
    if (showing && !this.free) this.sc.play(t);
    const voice = L.voice(); voice.level = calm ? 0.55 : 1; voice.place();
    this.things.visible = true; this.shade.visible = true;

    let out = true, flare;
    if (!back) {
      // ---- the cloth is brushed out; the pot is brushed in on it; the knife and the parsley are touched in
      u.uCloth.value = 1.1 * ramp(t, T_WHITE[0], T_WHITE[1]);
      u.uPot.value = ramp(t, T_POT[0], T_POT[1]); u.uSmall.value = ramp(t, T_SMALL[0], T_SMALL[1]);
      if (linger && !this.free) {
        // ---- the toy's turn: the lemon is let go where it lies
        this.free = true; const b = this.b, w = V.v.copy(p).applyMatrix4(this.B);
        if (p.y < -1) { this.lemonAt(L, this.T_HOME + 9, calm); w.copy(p).applyMatrix4(this.B); }
        b.x = w.x; b.y = w.y; b.z = w.z; b.vx = b.vy = b.vz = 0; b.on = true; this.flare = u.uFlare.value;
        if (t > this.T_GO && this.speed > 0) { b.vx = (L.tx * V.w.x + L.nx * V.w.z) * this.speed; b.vz = (L.tz * V.w.x + L.nz * V.w.z) * this.speed; }      // (still rolling: it rolls on)
      }
      if (this.free) flare = this.push(L, dt, calm);
      else {
        out = this.lemonAt(L, t, calm);
        flare = ease.smooth(ramp(t, this.T_HOME + T_BLAZE[0], this.T_HOME + (calm ? 2.6 : T_BLAZE[1])));
      }
    } else {
      // ---- going back: the lemon rolls home under the wall; then it is all unpainted, last stroke first
      const R_ = L.ret, k = ease.inOut(ramp(R_, 0, 0.62)), h = this.hold;
      if (this.wasOut) {
        const a = 1 - k, x0 = p.x, z0 = p.z;
        p.set(a * a * this.from.x + 2 * a * k * this.via.x + k * k * this.to.x, 0, a * a * this.from.z + 2 * a * k * this.via.z + k * k * this.to.z);
        p.y = lerp(Math.max(LR, this.from.y), LR + clothTop(p.x, p.z), clamp01(k * 5));
        const d = Math.hypot(p.x - x0, p.z - z0);
        if (d > 1e-5) { V.w.set((p.x - x0) / d, 0, (p.z - z0) / d); const want = Math.atan2(-V.w.x, -V.w.z); let dy = want - this.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); if (Math.abs(dy) > PI / 2) { dy -= Math.sign(dy) * PI; this.roll += d / LR; } else this.roll -= d / LR; this.yaw += dy * Math.min(1, d * 14); }
        this.lq.copy(this.pose()); out = k < 0.995;
      } else out = false;
      flare = h.flare * (1 - ease.smooth(ramp(R_, 0, 0.25)));
      u.uSmall.value = h.small * (1 - ramp(R_, 0.22, 0.5)); u.uPot.value = h.pot * (1 - ramp(R_, 0.36, 0.8)); u.uCloth.value = h.cloth * (1 - ease.inOut(ramp(R_, 0.52, 1)));
    }

    // ---- the gleam: stronger the nearer the lemon is to the pot; his blaze only when the lemon is in his place
    const dist = Math.hypot(p.x, p.z) - R, near = out ? 0.3 + 0.7 * sstep(1.3, 0.25, dist) : 0, high = out ? clamp01(1 - (p.y - 0.16) / 0.5) : 0;
    const breathe = calm ? 1 : 1 + 0.045 * Math.sin(t * 2.1) * flare;
    u.uGleam.value = near * high * u.uPot.value * breathe; u.uFlare.value = flare * breathe; this.flare = flare;
    u.uLemP.value.copy(p); u.uLemS.value = out ? 1 : 0;
    u.uLem.value.compose(out ? p : V.v.set(0, -9, 0), this.lq, V.one);
    // ---- the lid: tipped into the pot on one side, as he has it; it shivers when the copper is struck
    this.shiver += dt;
    const sh = this.shiver < 2 ? (calm ? 0.3 : 1) * 0.022 * (this.shiverK || 1) * Math.exp(-this.shiver * 4.2) * Math.sin(this.shiver * 52) : 0;
    V.ax.set(-Math.sin(LID_LOW), 0, Math.cos(LID_LOW));
    u.uLid.value.makeTranslation(0.004 * Math.cos(LID_LOW), H - 0.017 + RL * Math.sin(LID_TILT), 0.004 * Math.sin(LID_LOW)).multiply(V.a.makeRotationAxis(V.ax, -(LID_TILT + sh)));
    // ---- the lemon's shadow, when it has been taken off the boards that carry the others
    if (out && this.free && (Math.abs(p.x) > SHADOWS[0] / 2 - 0.15 || p.z > SHADOWS[1] - OUT0 - 0.15)) { const w = V.v.copy(p).applyMatrix4(this.B); this.blob.visible = true; this.blob.count = 1; this.blob.set(0, w.x, w.z, LR * 1.3, 0.7 * clamp01(1 - (p.y - LR) / 0.3)); } else { this.blob.count = 0; this.blob.visible = false; }
    if (back && L.ret >= 1) this.hide();
  },

  // The toy's turn: the lemon rolls where it is pushed, as a lemon does; it knocks on the pot; back in his place, the
  // blaze comes back. Returns how much of the blaze there is.
  push(L, dt, calm) {
    const b = this.b, V = this.V, p = this.lp, h = Math.min(dt, 0.05);
    if (h > 0) {
      this.rollers.step(h);
      // the pot is in its way
      const q = V.v.set(b.x, b.y, b.z).applyMatrix4(this.Binv), d = Math.hypot(q.x, q.z), min = R + LR * 0.92;
      if (d < min && d > 1e-4 && q.y < H + 0.05) {
        const nx = q.x / d, nz = q.z / d, wx = L.tx * nx + L.nx * nz, wz = L.tz * nx + L.nz * nz, into = -(b.vx * wx + b.vz * wz);
        b.x += wx * (min - d); b.z += wz * (min - d);
        if (into > 0) { b.vx += wx * into * 1.4; b.vz += wz * into * 1.4; if (into > 0.12 && this.shiver > 0.25) this.ring(L, Math.min(1, into * 1.2)); }
      }
      const sp = Math.hypot(b.vx, b.vz);
      if (sp > 0.02 && !b.air) {
        // its long axis turns to lie across the way it goes, and it rolls on it
        const lu = (b.vx * L.tx + b.vz * L.tz) / sp, lo = (b.vx * L.nx + b.vz * L.nz) / sp, want = Math.atan2(-lu, -lo);
        let dy = want - this.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); let dir = -1;
        if (Math.abs(dy) > PI / 2) { dy -= Math.sign(dy) * PI; dir = 1; }
        this.yaw += dy * Math.min(1, sp * h * 9); this.roll += dir * sp * h / LR;
      } else if (b.air) this.roll += h * (calm ? 3 : 6);
      this.speed = sp;
    }
    p.set(b.x, b.y, b.z).applyMatrix4(this.Binv); this.lq.copy(this.pose());
    const there = sstep(0.3, 0.12, Math.hypot(p.x - HOME[0], p.z - HOME[1])) * sstep(0.3, 0.05, this.speed);
    return this.flare + (there - this.flare) * Math.min(1, dt * (calm ? 0.8 : 1.8));
  },
});
