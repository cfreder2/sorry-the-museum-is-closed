// Édouard Manet, Fish (Still Life) (1864), Gallery 222. The word: gleam.
//
// A kitchen table under a white cloth: a carp, a red gurnard, oysters, an eel; behind them a copper pot with its lid
// left askew, and at the right-hand corner a sprig of parsley, a lemon and a knife. The museum's note says the
// produce "seems fresh and the handling of the paint vigorous", and what tells you so, all over the picture, is the
// gleam: wet scales, the pearl of the shells, the edge of the blade, the lemon's skin, and, largest and hottest, one
// blaze of orange on the dark flank of the copper. That blaze stands right over the lemon: the two brightest warm
// things in the picture, side by side. So the show is the corner of his table that is not fish, and the gleam.
//
// Look at it and his white is brushed out over the floor from the foot of the wall, broad and wet, a stroke one way
// and a stroke back, as he laid the cloth; the pot is brushed in on it, dark, band over band, the lid askew on top;
// the knife and the parsley are touched in beside it. Then the lemon drops out from under the frame, below where it
// is painted. A lemon is not a ball: it lands on its end, kicks sideways, and rolls off behind the pot. For a moment
// there is only a dark pot. Then it comes out round the left of it, and the copper finds it: a streak of orange wakes
// on the flank of the pot and travels across it as the lemon rolls round the front, slower and slower, in the curve a
// lemon rolls in; it turns in towards the pot, stops short, rocks, and lies where he put it, its nipple to the left.
// And the gleam, which has followed it all the way, stands where he put that too, and comes up into his blaze: two
// touches of pale salmon either side of a streak of red, the copper warm in the white cloth next to it.
//
// While you keep looking it stays, breathing a little. When you stop it stays out while the toy is near, and the
// lemon is yours to push: wherever it goes the gleam goes with it round the pot, it dies when the lemon is behind,
// and the blaze only comes back when the lemon is back in his place. Roll it into the pot and the copper rings and
// the lid shivers. Drive off, and the lemon rolls home under the wall, the pot and the cloth are unpainted, last
// stroke first.
//
// Everything is at about his own size and a fifth over (the picture is nearly life-size). The white is one flat
// painted ground with broken ends, in his cloth's colours, no bigger than the lemon's road; the pot, the lemon, the
// knife and the parsley are one smooth mesh, painted in a shader (no room light on them: his light, from the upper
// left, is in the paint). Two draw calls, and one soft shadow for the lemon when the toy has it out on the bare
// boards. Nothing stands higher than 40 cm, under a picture hung at 1.25 m, so from the checks' cameras the guard has
// next to nothing to cut. No music: brush on the floor, the lemon's knocks, and one long soft note from the copper.
// It keeps to its own two metres of wall: Courbet's dark (src/life/4428-mere-gregoire.js) is three metres to the
// left, and Breton's dawn (src/life/94841-song-of-the-lark.js) begins a metre to the right of the cloth's end.
// With "Reduce motion and flashing" on, the lemon tumbles and rocks half as much, the blaze comes up twice as slowly
// and does not breathe, the lid barely stirs and everything is quieter.
//
// What it does not do: the carp, the gurnard, the eel and the oysters stay in the picture. They are a fishmonger's
// catch, dead on a cloth; they are not modelled, moved, cooked or brought back to swim here, because a dead animal is
// not a toy and waking them would change what he painted. The pot stays cold and the knife lies still.
import * as THREE from 'three';
import { lifeFor, ease, ramp, clamp01, lerp, canvasTexture, rng } from '../paintlife.js';
import { score, noise } from './stagecraft.js';

const PI = Math.PI, TAU = PI * 2;
// The pot's own metres: x along the wall (to the viewer's right), y up from the cloth, z out into the room, from the
// middle of its foot.
const U0 = -0.1, OUT0 = 0.62, LIFT = 0.013;      // where the pot stands (from the picture's middle; from the wall); the cloth's paint under it
const SPAN = 2.0;                                // the painted ground: a square this wide, from the wall out
const R = 0.315, H = 0.29;                      // the pot: its radius and height
const RL = 0.3, LID_TILT = 0.166, LID_LOW = 25 * PI / 180;      // the lid: its radius, how far it tips, and to which side it has slipped in
const EARS = [15 * PI / 180, 195 * PI / 180];    // the two ear handles, round the pot
const LR = 0.056, LLEN = 0.16;                   // the lemon: the radius it rolls on, its length
const HOME = [0.23, 0.6];                        // where he put it
const KNIFE = [[0.02, 0.95], [0.58, 0.77]];        // the knife: the end of its handle, its point
const SPRIG = [0.17, 0.4];                     // the parsley
const SUN = [-0.5, 0.78, 0.42];                  // the way to his light: upper left, in front
// The show, in seconds.
const T_WHITE = [0.05, 1.1], T_POT = [0.35, 1.15], T_SMALL = [0.95, 1.4];
const T_POP = 1.1, POP = 0.14, G = 9.8;
const DROP_X = 0.42;                              // under the frame, below where the lemon is painted
const B1 = { to: [0.14, -0.485], d: 0.36 }, B2 = { to: [-0.01, -0.47], d: 0.2 };      // it lands on its end and kicks left; a second, small bounce
const LAND = [DROP_X, -0.52];
const ROAD = [B2.to, [-0.22, -0.46], [-0.47, -0.3], [-0.56, 0.0], [-0.5, 0.33], [-0.28, 0.6], [0.0, 0.74], [0.19, 0.775], [0.275, 0.71], HOME];      // behind the pot, round its left, across the front, and in
const V_END = 0.1, T_ROLL = 4.3, ROCK = { w: TAU / 0.62, k: 2.3 };          // it comes in still moving a little, and rocks to rest
const KEY = 0.52, KEY_W = 0.6;                 // (the game's film curve lifts what is not lit by the room: the paint is laid that much lower)
const sstep = (a, b, x) => { const q = clamp01((x - a) / (b - a)); return q * q * (3 - 2 * q); };

// ---------------------------------------------------------------- geometry
// A smooth surface from a rule: f(u, v, o) sets o.p (a point) and o.c (its colour) for u, v in 0..1; its normals are
// taken from the rule. Every vertex says what it is (aK: kind, what moves it, when it is painted in) and where on its
// part it lies (aUv).
const K_COPPER = 0, K_INSIDE = 1, K_LID = 2, K_IRON = 3, K_LEMON = 4, K_HAFT = 5, K_BLADE = 6, K_LEAF = 7, K_UNDER = 8;
const M_STILL = 0, M_LID = 1, M_LEMON = 2;
const _o = { p: new THREE.Vector3(), c: new THREE.Color() }, _q = [0, 1, 2, 3].map(() => new THREE.Vector3()), _n = new THREE.Vector3();
function surf(nu, nv, f, kind, move = M_STILL, when = 0) {
  const W = nv + 1, n = (nu + 1) * W, P = new Float32Array(n * 3), N = new Float32Array(n * 3), C = new Float32Array(n * 3), e = 2e-3;
  const at = (u, v, into) => { f(u, v, _o); return into.copy(_o.p); };
  for (let i = 0; i <= nu; i++) for (let j = 0; j <= nv; j++) {
    const u = i / nu, v = j / nv, k = (i * W + j) * 3;
    f(u, v, _o); P[k] = _o.p.x; P[k + 1] = _o.p.y; P[k + 2] = _o.p.z; C[k] = _o.c.r; C[k + 1] = _o.c.g; C[k + 2] = _o.c.b;
    const uu = Math.min(1 - e, Math.max(e, u)), vv = Math.min(1 - e, Math.max(e, v));
    at(uu + e, vv, _q[0]).sub(at(uu - e, vv, _q[1])); at(uu, vv + e, _q[2]).sub(at(uu, vv - e, _q[3]));
    _n.crossVectors(_q[0], _q[2]); if (_n.lengthSq() < 1e-24) _n.set(0, 1, 0); else _n.normalize();
    N[k] = _n.x; N[k + 1] = _n.y; N[k + 2] = _n.z;
  }
  const m = nu * nv * 6, pos = new Float32Array(m * 3), nor = new Float32Array(m * 3), col = new Float32Array(m * 3), uv = new Float32Array(m * 2), ak = new Float32Array(m * 3); let w = 0;
  const put = k => { for (let c = 0; c < 3; c++) { pos[w * 3 + c] = P[k * 3 + c]; nor[w * 3 + c] = N[k * 3 + c]; col[w * 3 + c] = C[k * 3 + c]; } uv[w * 2] = Math.floor(k / W) / nu; uv[w * 2 + 1] = (k % W) / nv; ak[w * 3] = kind; ak[w * 3 + 1] = move; ak[w * 3 + 2] = when; w++; };
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

// ---------------------------------------------------------------- the white: his cloth, as paint on the floor
// Painted once, in plan (the wall along the top): broad strokes of white, one way and back, out from the wall, each a
// loaded brush that tapers and runs dry at its end; then, wet into wet, the greys of the cloth's folds and the lights
// on them. Two pictures: the paint, and when each part of it is laid (so that it comes on stroke by stroke, each
// along its own length).
function paintCloth(col) {
  const N = 1024, M = N / SPAN, r = rng(44892);
  const rgb = h => { const x = col(h).getHex(); return `${x >> 16},${(x >> 8) & 255},${x & 255}`; };
  const whites = ['#d9d0bc', '#cbc1ab', '#dfd7c5', '#c3b9a3', '#d3cab6', '#bdb49f', '#d6ceba'].map(rgb), greys = ['#a0967f', '#91876f', '#a9a18b', '#9a9a8d'].map(rgb), lights = ['#ece6d8', '#e4ddcc'].map(rgb);
  const S = [];
  const add = (x0, y0, x1, y1, bend, w, t0, t1, o = {}) => { const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy); S.push({ x0, y0, dx, dy, len, nx: -dy / len, ny: dx / len, bend, w, t0, t1, i: S.length, ...o }); };
  // out from the wall, there and back, a flat brush: each row two strokes that meet and overlap
  const rows = [
    [0.22, 0.16, 1.06, 0.1, 0.28], [0.84, 0.13, 1.64, 0.12, 0.26], [1.76, 0.32, 0.9, 0.4, 0.32], [1.1, 0.42, 0.24, 0.43, 0.3],
    [0.14, 0.76, 1.02, 0.66, 0.34], [0.82, 0.64, 1.72, 0.63, 0.32], [1.84, 0.86, 0.92, 0.96, 0.32], [1.14, 0.98, 0.22, 1.03, 0.32],
    [0.18, 1.32, 1.08, 1.22, 0.34], [0.86, 1.2, 1.78, 1.15, 0.32], [1.8, 1.38, 0.96, 1.48, 0.32], [1.16, 1.5, 0.4, 1.55, 0.3], [0.72, 1.7, 1.66, 1.6, 0.22]];
  rows.forEach(([x0, y0, x1, y1, w], i) => { const t = Math.floor(i / 2) * 0.105 + (i % 2) * 0.07; add(x0, y0, x1, y1, (i % 4 < 2 ? 1 : -1) * (0.02 + 0.03 * r()), w, t, t + 0.12); });
  // and across them, slanting, as his cloth is brushed
  [[0.34, 0.4, 0.82, 0.96, 0.24], [1.2, 0.86, 1.7, 1.3, 0.22], [1.0, 1.18, 0.6, 1.66, 0.22], [1.28, 0.2, 1.72, 0.56, 0.2], [0.3, 1.0, 0.56, 1.42, 0.2]]
    .forEach(([x0, y0, x1, y1, w], i) => add(x0, y0, x1, y1, 0.06 * (r() - 0.5), w, 0.5 + i * 0.05, 0.64 + i * 0.05));
  const NB = S.length;
  // the greys of its folds, and the lights loaded on top: soft, into the wet white
  [[0.44, 0.3, 0.92, 0.2, 0.2], [1.34, 0.42, 1.72, 0.7, 0.18], [0.26, 0.88, 0.66, 1.2, 0.22], [1.2, 1.44, 1.72, 1.24, 0.18], [0.66, 1.48, 1.06, 1.7, 0.16], [1.44, 0.84, 1.76, 1.06, 0.16], [0.2, 0.5, 0.42, 0.72, 0.16], [0.9, 1.0, 1.3, 1.16, 0.14]]
    .forEach(([x0, y0, x1, y1, w]) => add(x0, y0, x1, y1, 0.1 * (r() - 0.5), w, 0, 0, { tone: greys, alpha: 0.2 }));
  [[0.3, 0.64, 0.8, 0.5, 0.12], [0.96, 1.3, 1.56, 1.04, 0.13], [0.44, 1.42, 0.86, 1.3, 0.1], [1.12, 1.62, 1.58, 1.5, 0.1], [0.32, 0.22, 0.7, 0.14, 0.09], [1.34, 0.2, 1.64, 0.3, 0.09], [0.5, 0.86, 0.9, 0.8, 0.1]]
    .forEach(([x0, y0, x1, y1, w]) => add(x0, y0, x1, y1, 0.1 * (r() - 0.5), w, 0, 0, { tone: lights, alpha: 0.17 }));
  const pt = (s, q, off = 0) => { const k = 4 * s.bend * s.len * q * (1 - q) + off; return [(s.x0 + s.dx * q + s.nx * k) * M, (s.y0 + s.dy * q + s.ny * k) * M]; };
  const poly = (g, s, a, b, off, lw, style, alpha) => {
    g.globalAlpha = alpha; g.strokeStyle = style; g.lineWidth = lw; g.beginPath();
    for (let i = 0; i <= 10; i++) { const [x, y] = pt(s, lerp(a, b, i / 10), off); if (i) g.lineTo(x, y); else g.moveTo(x, y); }
    g.stroke();
  };
  // the brush itself: a round head set down again and again along the stroke; narrower where it lands and where it lifts
  const brush = (g, s, a, b, c, alpha, hard) => {
    const wpx = s.w * M, n = Math.ceil((b - a) * s.len * M / (wpx * 0.1));
    g.globalAlpha = 1;
    for (let i = 0; i <= n; i++) {
      const q = lerp(a, b, i / n), tp = Math.min(1, (q - a + 0.05) / 0.09, (b - q + 0.1) / 0.3), rad = wpx * 0.5 * (0.62 + 0.38 * Math.sqrt(Math.max(0, tp))) * (0.95 + 0.1 * r()), [x, y] = pt(s, q);
      const gr = g.createRadialGradient(x, y, rad * hard, x, y, rad); gr.addColorStop(0, `rgba(${c},${alpha})`); gr.addColorStop(1, `rgba(${c},0)`);
      g.fillStyle = gr; g.beginPath(); g.arc(x, y, rad, 0, TAU); g.fill();
    }
  };
  const paint = canvasTexture(N, N, g => {
    g.clearRect(0, 0, N, N); g.lineCap = 'round';
    for (let i = 0; i < NB; i++) {
      const s = S[i], wpx = s.w * M, main = whites[(i * 3) % whites.length], nb = Math.ceil(wpx / 4);
      // set down blunt, drawn along, and lifted: every bristle leaves off somewhere else, near its neighbours
      g.lineCap = 'butt'; poly(g, s, 0.02, 0.8, 0, wpx, `rgb(${main})`, 1);
      g.lineCap = 'round';
      const nt = Math.ceil(wpx / 2.6), f1 = 5 + 9 * r(), f2 = 17 + 14 * r(), p1 = r() * 9, p2 = r() * 9;
      for (let j = 0; j < nt; j++) {
        const q = j / (nt - 1), e = 1 - Math.abs(q * 2 - 1), off = (q - 0.5) * s.w * (1 - 1.2 / nt);
        const end = 0.82 + (0.05 + 0.04 * Math.sin(q * f1 + p1) + 0.025 * Math.sin(q * f2 + p2) + 0.03 * r()) * (0.55 + 0.45 * e);
        poly(g, s, 0.012 * r(), end, off, wpx / nt + 1.4, `rgb(${main})`, 1);
        if (r() < 0.22) { const q0 = end + 0.008 + 0.012 * r(); poly(g, s, q0, q0 + 0.008 + 0.02 * r(), off, wpx / nt + 0.6, `rgb(${main})`, 0.75); }
      }
      // the bristles showing in it
      g.lineCap = 'round';
      for (let j = 0; j < nb / 2; j++) {
        const off = (r() - 0.5) * s.w * 0.86, k = r(), c = k < 0.16 ? greys[Math.floor(r() * 4)] : k < 0.4 ? lights[0] : whites[Math.floor(r() * whites.length)];
        const a = 0.03 + 0.5 * r(); poly(g, s, a, Math.min(0.8, a + 0.2 + 0.4 * r()), off, 2 + 3.5 * r(), `rgb(${c})`, 0.12 + 0.22 * r());
      }
    }
    // (only where there is white to take it)
    g.globalCompositeOperation = 'source-atop';
    for (let i = NB; i < S.length; i++) brush(g, S[i], 0, 1, S[i].tone[i % S[i].tone.length], S[i].alpha, 0);
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
  });
  paint.anisotropy = 4;
  const laid = canvasTexture(N, N, g => {
    g.fillStyle = '#fff'; g.fillRect(0, 0, N, N); g.lineCap = 'butt';
    for (let i = NB - 1; i >= 0; i--) {      // (the earliest on top: each part is laid by the first stroke to reach it)
      const s = S[i], [ax, ay] = pt(s, 0), [bx, by] = pt(s, 1), gr = g.createLinearGradient(ax, ay, bx, by), v = t => Math.round(255 * t);
      gr.addColorStop(0, `rgb(${v(s.t0)},${v(s.t0)},${v(s.t0)})`); gr.addColorStop(1, `rgb(${v(s.t1)},${v(s.t1)},${v(s.t1)})`);
      poly(g, s, -0.04, 1.08, 0, s.w * M + 14, gr, 1);
    }
    g.globalAlpha = 1;
  }, false);
  laid.generateMipmaps = false; laid.minFilter = laid.magFilter = THREE.LinearFilter;
  return { paint, laid };
}

const NOISE = /* glsl */`
float mH(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float mN(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mH(i), mH(i + vec2(1.0, 0.0)), f.x), mix(mH(i + vec2(0.0, 1.0)), mH(i + vec2(1.0, 1.0)), f.x), f.y); }`;

lifeFor(44892, {
  title: /^Fish \(Still Life\)/,
  word: 'gleam',
  // (a small work: the kit keeps the whole of it in view, in the upper part, with the cloth and the pot below)
  stage: { out: 1.7, half: 1.0, cam: { dist: 2.5, side: 0.3, height: 0.98, fov: 58, lookU: -0.05, lookOut: 0.6, lookH: 0.8, floorOut: 1.7 } },
  wake: 2, ret: 2.4,
  linger: { near: 4, max: 30 },

  build(L) {
    const P = L.pal, col = (h, a = 0.08) => P.near(h, a), glsl = (h, a) => { const c = col(h, a); return `vec3(${c.r.toFixed(4)}, ${c.g.toFixed(4)}, ${c.b.toFixed(4)})`; };
    const V = this.V = { a: new THREE.Matrix4(), b: new THREE.Matrix4(), v: new THREE.Vector3(), w: new THREE.Vector3(), q: new THREE.Quaternion(), q2: new THREE.Quaternion(), one: new THREE.Vector3(1, 1, 1), ax: new THREE.Vector3(), X: new THREE.Vector3(1, 0, 0), Y: new THREE.Vector3(0, 1, 0) };
    // the pot's own space, in the room
    this.B = new THREE.Matrix4().makeBasis(new THREE.Vector3(L.tx, 0, L.tz), new THREE.Vector3(0, 1, 0), new THREE.Vector3(L.nx, 0, L.nz)).setPosition(L.floor(U0, OUT0).setY(L.y + LIFT));
    this.Binv = this.B.clone().invert();
    this.wallZ = -OUT0; this.railY = L.rail - L.y - LIFT;

    // ------------------------------------------------------------ the pot: copper, turned; two ears; the lid
    const cop = col('#5a2c14'), parts = [];
    parts.push(turned([[0.001, 0], [R * 0.8, 0], [R * 0.93, 0.004], [R * 0.975, 0.02], [R * 0.986, 0.05], [R * 0.992, 0.12], [R, H - 0.03], [R + 0.003, H - 0.012], [R + 0.0065, H - 0.004], [R + 0.005, H + 0.003], [R - 0.002, H + 0.005], [R - 0.009, H]], 72, 30, cop, K_COPPER));
    parts.push(turned([[R - 0.009, H], [R - 0.011, H - 0.02], [R - 0.012, H - 0.1], [R - 0.013, H - 0.178], [R - 0.03, H - 0.18], [0.001, H - 0.18]], 48, 8, col('#140c08'), K_INSIDE));
    const iron = col('#1e1712');
    for (const th of EARS) {
      // an ear: a loop of rod riveted on under the rim, standing a little out from the pot
      const m = new THREE.Matrix4().makeRotationY(PI / 2 - th).multiply(V.a.makeTranslation(0, H - 0.02, R + 0.004)).multiply(V.b.makeRotationX(0.3));
      parts.push(placed(ring(0.048, 0.012, 0, TAU, iron, K_IRON, M_STILL, 0.74), m));
      parts.push(placed(surf(10, 6, (u, v, o) => { const a = u * TAU, rr = 0.034 * Math.sqrt(v); o.p.set(rr * Math.cos(a) * 1.5, rr * Math.sin(a) - 0.034, 0.007 - 0.005 * v); o.c.copy(iron); }, K_IRON, M_STILL, 0.74), m.clone().multiply(V.b.makeRotationX(-0.3))));
    }
    // the lid, lying flat round its own middle (the shader tips it into the pot)
    const lidC = col('#3a322a');
    parts.push(turned([[0.001, 0.015], [RL * 0.35, 0.014], [RL * 0.7, 0.009], [RL * 0.92, 0.003], [RL - 0.006, 0.0005], [RL, -0.003]], 56, 12, lidC, K_LID, M_LID));
    parts.push(turned([[RL, -0.003], [RL - 0.006, -0.0065], [RL * 0.75, -0.005], [0.001, -0.004]], 40, 5, col('#17110c'), K_UNDER, M_LID));
    parts.push(placed(ring(0.041, 0.0085, 0.12, PI - 0.12, iron, K_IRON, M_LID, 0.97), new THREE.Matrix4().makeTranslation(0, 0.008, 0).multiply(V.b.makeRotationY(0.5))));

    // ------------------------------------------------------------ the lemon: long, a nipple at one end, a little crooked
    const PR = [[0, 0], [0.03, 0.0095], [0.075, 0.0135], [0.12, 0.02], [0.22, 0.037], [0.4, 0.048], [0.56, 0.05], [0.74, 0.044], [0.88, 0.03], [0.96, 0.014], [1, 0]];
    const ly = col('#e2bf2a', 0.04), lg = col('#b7ab3a', 0.06);
    parts.push(surf(30, 24, (u, v, o) => {
      const ph = u * TAU, rr = profile(PR, v) * (LR / 0.049) * (1 + 0.05 * Math.cos(ph - 0.6) + 0.02 * Math.cos(3 * ph + v * 4));
      o.p.set((v - 0.5) * LLEN, rr * Math.cos(ph) + 0.004 * Math.sin(PI * v), rr * Math.sin(ph));
      o.c.copy(ly).lerp(lg, clamp01(0.75 * sstep(0.2, 0.0, v) + 0.6 * sstep(0.86, 1, v)));
    }, K_LEMON, M_LEMON));

    // ------------------------------------------------------------ the knife: a dark haft, a worn blade; lying flat
    {
      const [a, b] = KNIFE, len = Math.hypot(b[0] - a[0], b[1] - a[1]), yaw = Math.atan2(-(b[1] - a[1]), b[0] - a[0]), hl = len * 0.47;
      const m = new THREE.Matrix4().makeTranslation(a[0], 0, a[1]).multiply(V.b.makeRotationY(yaw));
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
      const rnd = rng(8), greens = [col('#3c5a27'), col('#547638'), col('#2a4120'), col('#688a45')];
      const LEAVES = [[0, 0, 0.2], [0.03, 0.012, 1.4], [-0.012, 0.03, 2.6], [0.045, 0.04, 0.7], [0.012, 0.052, 3.4], [0.07, 0.022, 5.2], [0.085, 0.052, 4.1], [-0.03, 0.062, 2.0], [0.05, 0.075, 1.0], [0.1, 0.08, 5.8]];
      LEAVES.forEach(([x, z, yaw], i) => {
        const size = 0.024 + 0.013 * rnd(), cup = 0.5 + 0.8 * rnd(), c = greens[i % greens.length], c2 = greens[(i + 1) % greens.length], lift = 0.004 + 0.018 * rnd();
        const m = new THREE.Matrix4().makeTranslation(SPRIG[0] + x, lift, SPRIG[1] + z).multiply(V.a.makeRotationY(yaw)).multiply(V.b.makeRotationZ(0.25 + 0.5 * rnd()));
        // three lobes, frilled, cupped
        parts.push(placed(surf(12, 3, (u, v, o) => {
          const a = (u - 0.5) * 2.5, lobe = 0.62 + 0.38 * Math.pow(Math.abs(Math.cos(a * 1.9)), 0.7), rr = v * size * lobe;
          o.p.set(rr * Math.cos(a), cup * rr * rr / size + 0.0025 * Math.sin(a * 9 + i) * v, rr * Math.sin(a)); o.c.copy(c).lerp(c2, v);
        }, K_LEAF, M_STILL, 0.5 + 0.035 * i), m));
      });
      const stalkC = col('#557038');
      for (const [x0, z0, x1, z1] of [[-0.035, -0.02, 0.07, 0.05], [0.0, 0.07, 0.05, 0.02]]) {
        parts.push(surf(5, 4, (u, v, o) => { const ph = u * TAU, rr = 0.0016; o.p.set(SPRIG[0] + lerp(x0, x1, v) + rr * Math.cos(ph), 0.004 + 0.008 * Math.sin(PI * v) + rr * Math.sin(ph), SPRIG[1] + lerp(z0, z1, v)); o.c.copy(stalkC); }, K_LEAF, M_STILL, 0.48));
      }
    }

    // ------------------------------------------------------------ his paint on them: one material, one draw call
    const u = this.u = {
      uInv: { value: this.Binv }, uLid: { value: new THREE.Matrix4() }, uLem: { value: new THREE.Matrix4() }, uLemP: { value: new THREE.Vector3(0, -9, 0) },
      uGleam: { value: 0 }, uFlare: { value: 0 }, uPot: { value: 0 }, uSmall: { value: 0 }, uWhite: { value: 0 },
    };
    const sun = new THREE.Vector3(...SUN).normalize();
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
uniform mat4 uInv; uniform vec3 uLemP; uniform float uGleam, uFlare, uPot, uSmall, uWhite;
varying vec3 vK, vOP, vLP, vN; varying vec2 vUv2;${NOISE}`)
        .replace('#include <opaque_fragment>', `{
  int kind = int(vK.x + 0.5);
  vec3 N = normalize(vN); if (!gl_FrontFacing) N = -N;
  vec3 eye = (uInv * vec4(cameraPosition, 1.0)).xyz, Vd = normalize(eye - vLP);
  vec3 Lk = vec3(${sun.x.toFixed(4)}, ${sun.y.toFixed(4)}, ${sun.z.toFixed(4)});
  float nl = dot(N, Lk);
  vec3 c = diffuseColor.rgb;
  // where the lemon shows in the copper, seen from here: round the pot, half way between you and it
  vec2 vh = normalize(eye.xz), lh = normalize(uLemP.xz + vec2(1.0e-4, 0.0)), hh = normalize(vh + lh + vec2(0.0, 1.0e-4));
  float seen = smoothstep(-0.55, 0.3, dot(vh, lh)), g = uGleam * seen;
  if (kind == ${K_COPPER}) {
    if (!gl_FrontFacing) discard;
    float ph = atan(vOP.x, vOP.z), y = vOP.y / ${H.toFixed(3)};
    // brushed in band over band, each swept round from the left, or back
    float bf = y * 4.6 + 0.7 * (mN(vec2(ph * 1.4, 3.7)) - 0.5), bi = floor(bf), sw = ph / 6.2832 + 0.5;
    if (mod(bi, 2.0) > 0.5) sw = 1.0 - sw;
    float ord = (bi + sw) / 7.2 + 0.035 * (mN(vec2(ph * 26.0, y * 70.0)) - 0.5);
    if (uPot < 0.999 && uPot * 1.08 < ord + 0.03) discard;
    float br = mN(vec2(ph * 2.3, y * 7.0)), fine = mN(vec2(ph * 5.0, y * 21.0)), slow = mN(vec2(ph * 1.1 + 4.0, y * 2.6));
    float drag = mN(vec2(ph * 1.7 + 9.0, y * 16.0)), p1 = smoothstep(0.5, 0.62, mN(vec2(ph * 2.6 + 7.0, y * 4.2))), p2 = smoothstep(0.52, 0.66, mN(vec2(ph * 3.4 + 1.0, y * 3.1 + 5.0)));
    c = mix(${glsl('#22130b')}, ${glsl('#5b3018')}, clamp(0.16 + 0.6 * slow + 0.45 * (br - 0.5), 0.0, 1.0));
    c = mix(c, ${glsl('#6c3519')}, 0.4 * p1); c = mix(c, ${glsl('#2b1d15')}, 0.45 * p2);
    c *= 0.78 + 0.26 * fine + 0.22 * drag;
    // the cloth in it: paler and pinker low on the flank; and the dull light he left on its left side
    float low = smoothstep(0.36, 0.02, y);
    c = mix(c, ${glsl('#8f5c40')}, low * (0.15 + 0.4 * br) * uWhite);
    c = mix(c, ${glsl('#8a4420')}, 0.5 * exp(-pow((ph + 0.95) / 0.42, 2.0)) * smoothstep(0.12, 0.26, y) * smoothstep(0.52, 0.34, y) * (0.4 + 0.6 * fine));
    // under the rolled rim it is dark; the rim itself is worn bright
    c *= 1.0 - 0.5 * smoothstep(0.84, 0.94, y) * (1.0 - smoothstep(0.945, 0.965, y));
    if (y > 0.955) c = mix(${glsl('#4a2410')}, ${glsl('#ad622f')}, clamp(0.1 + 0.55 * nl + 0.5 * (fine - 0.5), 0.0, 1.0));
    // the gleam: a brushful of orange down the flank, blunt where the brush was set down and where it came off
    vec2 nh = normalize(N.xz + vec2(0.0, 1.0e-4));
    float a = atan(nh.x * hh.y - nh.y * hh.x, dot(nh, hh));
    float aa = a + 0.05 * (y - 0.5) + 0.03 * (mN(vec2(y * 3.0, 9.0)) - 0.5);            // (his strokes lean a little)
    float rag = mN(vec2(aa * 9.0, 2.0)), rag2 = mN(vec2(aa * 14.0 + 5.0, 6.0)), streak = mN(vec2(aa * 60.0, y * 2.5));
    float foot = smoothstep(0.1, 0.24, y + 0.1 * (rag - 0.5)), head = 1.0 - smoothstep(0.72, 0.9, y + 0.12 * (rag2 - 0.5));
    float halo = exp(-aa * aa / 0.1), body = (1.0 - smoothstep(0.06, 0.26, abs(aa))) * foot * head;
    c = mix(c, ${glsl('#6e2e12')}, 0.55 * g * halo * (0.4 + 0.6 * head));
    c = mix(c, ${glsl('#b9562a', 0.03)}, g * body * (0.75 + 0.25 * streak) * (0.7 + 0.3 * uFlare));
    // his blaze: two blunt touches of pale salmon either side of a streak of red
    float fl = uFlare * seen;
    float red = (1.0 - smoothstep(0.02, 0.05, abs(aa - 0.005))) * smoothstep(0.14, 0.2, y + 0.06 * (rag - 0.5)) * (1.0 - smoothstep(0.7, 0.78, y + 0.08 * (rag2 - 0.5)));
    float wl = 0.05 * (0.55 + 0.7 * mN(vec2(y * 4.0, 1.0))), wr = 0.058 * (0.55 + 0.7 * mN(vec2(y * 4.0 + 3.0, 2.0)));
    float pl = (1.0 - smoothstep(wl, wl + 0.014, abs(aa + 0.105))) * smoothstep(0.36, 0.4, y + 0.08 * (rag - 0.5)) * (1.0 - smoothstep(0.78, 0.83, y + 0.1 * (rag2 - 0.5)));
    float pr = (1.0 - smoothstep(wr, wr + 0.016, abs(aa - 0.125))) * smoothstep(0.2, 0.24, y + 0.08 * (rag2 - 0.5)) * (1.0 - smoothstep(0.62, 0.67, y + 0.1 * (rag - 0.5)));
    c = mix(c, ${glsl('#a83016', 0.03)}, fl * red * (0.7 + 0.3 * streak));
    c = mix(c, ${glsl('#e6a67c', 0.03)}, fl * max(pl, pr) * (0.72 + 0.28 * streak));
    // (and a touch or two of orange let fall under it)
    c = mix(c, ${glsl('#b9562a', 0.03)}, 0.8 * fl * smoothstep(0.6, 0.72, mN(vec2(aa * 26.0 + 2.0, y * 34.0))) * (1.0 - smoothstep(0.02, 0.2, abs(aa))) * smoothstep(0.04, 0.08, y) * (1.0 - smoothstep(0.14, 0.2, y)));
  } else if (kind == ${K_INSIDE}) {
    vec3 inw = vOP.y > ${(H - 0.176).toFixed(3)} ? normalize(vec3(-vOP.x, 0.0, -vOP.z)) : vec3(0.0, 1.0, 0.0);
    if (dot(inw, Vd) < 0.0 || uPot < 0.72) discard;
    c *= 0.8 + 0.5 * mN(vOP.xz * 30.0) + 1.2 * smoothstep(${(H - 0.03).toFixed(3)}, ${H.toFixed(3)}, vOP.y);
  } else if (kind == ${K_LID} || kind == ${K_UNDER}) {
    float rr = length(vOP.xz) / ${RL.toFixed(3)}, la = atan(vOP.x, vOP.z);
    if (uPot < 0.999 && uPot < 0.8 + 0.19 * (vOP.x / ${RL.toFixed(3)} * 0.5 + 0.5) + 0.02 * (mN(vOP.xz * 80.0) - 0.5)) discard;
    if (kind == ${K_LID}) {
      // dark, worn metal: pale light dragged across it on the side his light comes from, and along its edge
      float bro = mN(vOP.xz * 7.0 + 3.0), drag = mN(vec2(vOP.x * 4.0 + 2.0, vOP.z * 34.0)), fineL = mN(vec2(vOP.x * 13.0, vOP.z * 120.0));
      float where = smoothstep(0.55, -0.5, vOP.x / ${RL.toFixed(3)} + 0.8 * (bro - 0.5)) * smoothstep(1.0, 0.72, rr);
      c = mix(${glsl('#261e17')}, ${glsl('#4a3f33')}, 0.25 + 0.6 * bro) * (0.85 + 0.3 * fineL);
      c = mix(c, ${glsl('#9d917b')}, 0.9 * where * smoothstep(0.36, 0.7, drag) * (0.55 + 0.45 * fineL));
      c = mix(c, ${glsl('#7d705a')}, 0.5 * smoothstep(0.95, 0.99, rr) * (0.3 + 0.7 * smoothstep(-0.4, 0.6, -sin(la))));
      // (the copper's gleam catches the edge nearest the lemon)
      vec2 ld = normalize(vOP.xz + vec2(0.0, 1.0e-4)); float nr = max(dot(ld, hh), 0.0);
      c = mix(c, ${glsl('#c8743a')}, 0.5 * g * pow(nr, 6.0) * smoothstep(0.9, 0.98, rr));
    } else c *= 0.8 + 0.4 * mN(vOP.xz * 20.0);
  } else if (kind == ${K_IRON}) {
    if (uPot < vK.z) discard;
    c = c * (0.7 + 0.6 * mN(vOP.xy * 90.0)) + ${glsl('#8a7a66')} * 0.5 * pow(max(dot(N, normalize(Lk + Vd)), 0.0), 9.0);
  } else if (kind == ${K_LEMON}) {
    // his yellow: pale hatched touches where the light is, a green-ochre shade underneath; its own marks go round with it
    float la = atan(vOP.y, vOP.z), mark = mN(vec2(vOP.x * 70.0 + 3.0, la * 2.2)), pore = mN(vec2(vOP.x * 260.0, la * 26.0));
    float hatch = mN(vec2(dot(vLP.xy, vec2(0.7, 0.7)) * 420.0, dot(vLP.xy, vec2(-0.7, 0.7)) * 60.0));
    float lit = smoothstep(-0.35, 0.7, nl + 0.22 * (mark - 0.5));
    c = mix(${glsl('#8d7a22', 0.04)}, c, lit);
    c = mix(c, ${glsl('#f6e98a', 0.02)}, 0.85 * smoothstep(0.55, 0.92, nl + 0.34 * (hatch - 0.5)));
    c = mix(c, ${glsl('#b9a630', 0.04)}, 0.4 * smoothstep(0.6, 0.82, mark));
    c *= 0.93 + 0.14 * pore;
    c += ${glsl('#6a5a40')} * 0.35 * max(-N.y, 0.0) * uWhite;                        // (the white cloth, from under it)
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
  outgoingLight = c * ${KEY.toFixed(2)};
}
#include <opaque_fragment>`);
    };
    tm.customProgramCacheKey = () => 'manet-fish-things';
    this.things = new THREE.Mesh(merge(parts), tm); this.things.name = 'pot-lemon-knife-parsley';
    this.things.matrixAutoUpdate = false; this.things.matrix.copy(this.B); this.things.matrixWorldNeedsUpdate = true;
    L.add(this.things);

    // ------------------------------------------------------------ the white, and the shadows on it
    const tex = paintCloth(col);
    const gu = this.gu = { uLaid: { value: tex.laid }, uPaint: { value: 0 }, uLemP: u.uLemP, uPot: u.uPot, uSmall: u.uSmall, uGleam: u.uGleam, uFlare: u.uFlare, uLemS: { value: 1 } };
    const shDir = new THREE.Vector2(-sun.x, -sun.z).normalize(), reach = Math.hypot(sun.x, sun.z) / sun.y;
    const gm = new THREE.MeshBasicMaterial({ map: tex.paint, transparent: true, depthWrite: false, fog: false });
    gm.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, gu);
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
uniform sampler2D uLaid; uniform vec3 uLemP; uniform float uPaint, uPot, uSmall, uGleam, uFlare, uLemS;
float seg(vec2 p, vec2 a, vec2 b) { vec2 pa = p - a, ba = b - a; return length(pa - ba * clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0)); }`)
        .replace('#include <map_fragment>', `{
  vec4 pc = texture2D(map, vMapUv); float at = texture2D(uLaid, vMapUv).r;
  float on = pc.a * smoothstep(0.0, 0.03, uPaint - at);
  vec2 q = vec2((vMapUv.x - 0.5) * ${SPAN.toFixed(3)}, (1.0 - vMapUv.y) * ${SPAN.toFixed(3)} - ${OUT0.toFixed(3)});      // in the pot's own metres
  vec2 sd = vec2(${shDir.x.toFixed(4)}, ${shDir.y.toFixed(4)});
  // shadows, thrown away from his light: the pot's, close round its foot and long behind it; the lemon's; the knife's; the parsley's
  float dp = length(q) - ${R.toFixed(3)};
  float sp = max(0.75 * smoothstep(0.08, -0.03, dp), 0.6 * smoothstep(0.08, -0.05, seg(q, vec2(0.0), sd * ${(H * reach).toFixed(3)}) - ${R.toFixed(3)})) * smoothstep(0.1, 0.9, uPot);
  vec2 lq = q - uLemP.xz - sd * (0.012 + uLemP.y * ${reach.toFixed(3)});
  float sl = 0.7 * smoothstep(0.085, 0.012, length(lq * vec2(0.9, 1.25))) * clamp(1.0 - (uLemP.y - 0.05) / 0.5, 0.0, 1.0) * uLemS;
  float sk = 0.4 * smoothstep(0.02, 0.004, seg(q - sd * 0.007, vec2(${KNIFE[0][0].toFixed(3)}, ${KNIFE[0][1].toFixed(3)}), vec2(${KNIFE[1][0].toFixed(3)}, ${KNIFE[1][1].toFixed(3)}))) * smoothstep(0.3, 1.0, uSmall);
  float ss = 0.3 * smoothstep(0.075, 0.02, length(q - vec2(${(SPRIG[0] + 0.035).toFixed(3)}, ${(SPRIG[1] + 0.035).toFixed(3)}) - sd * 0.008)) * smoothstep(0.5, 1.0, uSmall);
  float shade = 1.0 - (1.0 - sp) * (1.0 - sl) * (1.0 - sk) * (1.0 - ss);
  vec3 c = pc.rgb;
  // the copper, warm in the white next to it, on the side its gleam is; the lemon, yellow in the white under it
  vec2 lh = normalize(uLemP.xz + vec2(1.0e-4, 0.0));
  float warm = uGleam * (0.3 + 0.7 * uFlare) * exp(-max(dp, 0.0) / 0.13) * smoothstep(-0.2, 0.9, dot(normalize(q + vec2(0.0, 1.0e-4)), lh));
  c = mix(c, c * ${glsl('#ffd2b8', 0)}, 0.55 * warm);
  c = mix(c, c * ${glsl('#fff2a0', 0)}, 0.35 * smoothstep(0.17, 0.04, length(q - uLemP.xz)) * uLemS);
  c = mix(c, c * ${glsl('#6f6a70', 0)}, shade);
  float a = max(on, 0.4 * shade * smoothstep(0.0, 0.4, uPaint));
  diffuseColor = vec4(mix(${glsl('#17110c', 0)}, c, on / max(a, 1.0e-3)) * ${KEY_W.toFixed(2)}, a);
}`);
    };
    gm.customProgramCacheKey = () => 'manet-fish-cloth';
    this.cloth = L.decal({ w: SPAN, d: SPAN, u: U0, out: SPAN / 2, material: gm }); this.cloth.name = 'cloth'; this.cloth.renderOrder = 5;
    this.blob = L.blobs(1, { fade: true });      // (the lemon's shadow, out on the bare boards)

    // ------------------------------------------------------------ the lemon's road
    const road = this.road = new THREE.CatmullRomCurve3(ROAD.map(([x, z]) => new THREE.Vector3(x, 0, z)), false, 'centripetal');
    road.arcLengthDivisions = 400; road.updateArcLengths();
    this.len = road.getLength(); this.v0 = 2 * this.len / T_ROLL - V_END; this.dec = (this.v0 - V_END) / T_ROLL;
    this.dropY = this.railY - LR - 0.012; this.fall = Math.sqrt(2 * (this.dropY - LR) / G);
    this.T_LAND = T_POP + POP + this.fall; this.T_GO = this.T_LAND + B1.d + B2.d; this.T_HOME = this.T_GO + T_ROLL;
    this.lp = new THREE.Vector3(0, -9, 0); this.lq = new THREE.Quaternion(); this.yaw = 0; this.roll = 0; this.speed = 0;
    this.endP = new THREE.Vector3(); this.endDir = new THREE.Vector3(); road.getPointAt(1, this.endP); road.getTangentAt(1, this.endDir);
    this.rollers = L.rollers(1, { r: LR, bounce: 0.3, roll: 0.42, ground: () => LIFT, onBounce: (b, sp) => this.thud(L, Math.min(1, sp * 0.5)) });
    this.b = this.rollers.items[0];
    this.from = new THREE.Vector3(); this.via = new THREE.Vector3(); this.to = new THREE.Vector3();

    // ------------------------------------------------------------ the sounds: the brush, the lemon's knocks, the copper
    const s = this.sc = score(L);
    for (let i = 0; i < 7; i++) s.hit(T_WHITE[0] + i * 0.105 * (T_WHITE[1] - T_WHITE[0]) * 1.1, { d: 0.34, vol: 0.016, bp: 1500 + 260 * (i % 3), q: 0.7, attack: 0.07 });      // the white, a stroke at a time
    for (let i = 0; i < 5; i++) s.hit(T_POT[0] + i * 0.14, { d: 0.26, vol: 0.011, bp: 620 + 80 * (i % 2), q: 0.8, attack: 0.06 });                                       // the pot, band over band
    const knock = (t, k) => { s.note(t, 150, 0.16, { type: 'sine', vol: 0.05 * k, to: 82, attack: 0.004 }); s.hit(t, { d: 0.07, vol: 0.022 * k, lp: 700 }); };
    knock(this.T_LAND, 1); knock(this.T_LAND + B1.d, 0.55); knock(this.T_GO, 0.3);
    // as it rolls: a soft bump each time its heavy side comes round, further apart as it slows
    for (let k = 1; k < 40; k++) {
      const d = k * TAU * LR, disc = this.v0 * this.v0 - 2 * this.dec * d; if (d > this.len - 0.02 || disc < 0) break;
      const tau = (this.v0 - Math.sqrt(disc)) / this.dec, sp = this.v0 - this.dec * tau;
      s.hit(this.T_GO + tau, { d: 0.06, vol: 0.004 + 0.01 * sp, lp: 420 });
    }
    // the copper: one long soft note as the blaze comes up (no stroke to it: it swells), and its fifth, fainter
    const T = this.T_HOME + 0.15;
    s.note(T, 220, 3.4, { type: 'sine', vol: 0.03, attack: 0.7 }); s.note(T + 0.1, 330, 3.0, { type: 'sine', vol: 0.014, attack: 0.9 }); s.note(T + 0.25, 554.4, 2.4, { type: 'sine', vol: 0.006, attack: 1.0 });
    s.done();

    this.lin = 0; this.at = 0; this.free = false; this.flare = 0; this.shiver = 9; this.rung = 0; this.hide();
  },

  hide() { this.things.visible = false; this.cloth.visible = false; this.blob.count = 0; this.blob.visible = false; },

  // ---------------------------------------------------------------- the lemon, by the show's clock
  // Where it is and how it lies at show-time t (into this.lp, this.lq); false while it is still in the picture.
  lemonAt(L, t, calm) {
    const V = this.V, p = this.lp, soft = calm ? 0.5 : 1;
    const tp = t - T_POP;
    if (tp < 0) { p.set(DROP_X, -9, 0); this.speed = 0; return false; }
    const tumble = (calm ? 3.5 : 7) * Math.max(0, tp - POP);
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
    // rolling: slower and slower along its curve; then it rocks where it stops
    const tau = t - this.T_GO; let s, rock = 0;
    if (tau < T_ROLL) { s = this.v0 * tau - 0.5 * this.dec * tau * tau; this.speed = this.v0 - this.dec * tau; }
    else { const x = tau - T_ROLL; rock = Math.exp(-ROCK.k * x) * Math.sin(ROCK.w * x); s = this.len + V_END / ROCK.w * rock * soft; this.speed = 0; }
    if (s <= this.len) { this.road.getPointAt(clamp01(s / this.len), p); this.road.getTangentAt(clamp01(s / this.len), V.w); } else { V.w.copy(this.endDir); p.copy(this.endP).addScaledVector(V.w, s - this.len); }
    p.y = LR * (1 + 0.035 * Math.cos(2 * s / LR));
    this.rollPose(s, tau >= T_ROLL ? 0.2 * soft * Math.exp(-1.9 * (tau - T_ROLL)) * Math.sin(TAU * (tau - T_ROLL) / 0.84) : 0.07 * soft * Math.sin(s / LR) * clamp01(this.speed));
    this.lq.copy(this.pose());
    return true;
  },
  // Rolling the way V.w points, having come s metres: its long axis lies across the way it goes; `sway` turns it a little.
  rollPose(s, sway) { const w = this.V.w; this.yaw = Math.atan2(-w.x, -w.z) + sway; this.roll = -(s - this.len) / LR + 0.9; return this; },
  pose() { const V = this.V; V.q.setFromAxisAngle(V.Y, this.yaw).multiply(V.q2.setFromAxisAngle(V.X, this.roll)); return V.q; },

  // ---------------------------------------------------------------- sounds the toy makes with it
  thud(L, k) { if (L.quiet || k < 0.08) return; const v = L.voice(); v.note(150, 0.14, { type: 'sine', vol: 0.04 * k, to: 85, attack: 0.004 }); noise(v, 0, { d: 0.06, vol: 0.018 * k, lp: 700 }); },
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
    this.from.copy(p); this.to.set(side * 0.47, LR, this.wallZ - LR - 0.06);
    this.via.set(side * Math.max(0.5, Math.abs(p.x) * 0.5 + 0.3), LR, Math.min(p.z, 0) * 0.5 - 0.1);
    this.rollFrom = this.roll; this.yawFrom = this.yaw; this.wasOut = p.y > -1; this.b.on = false;
    this.hold = { paint: this.gu.uPaint.value, pot: this.u.uPot.value, small: this.u.uSmall.value, flare: this.flare };
    if (!L.quiet) noise(L.voice(), 0.9, { d: 0.9, vol: 0.012, bp: 1300, q: 0.6, attack: 0.3 });
  },
  end() { this.hide(); this.free = false; this.b.on = false; },
  reset() { this.hide(); this.lin = this.at = 0; this.free = false; this.b.on = false; this.flare = 0; this.shiver = 9; },

  update(L, dt) {
    const ph = L.phase, showing = ph === 'wake' || ph === 'play', linger = ph === 'linger', back = ph === 'return';
    if (!showing && !linger && !back) { this.hide(); return; }
    const calm = L.calm, V = this.V, u = this.u, gu = this.gu, p = this.lp;
    if (linger) this.lin += dt;
    const t = this.at = L.t + this.lin;
    if (showing && !this.free) this.sc.play(t);
    const voice = L.voice(); voice.level = calm ? 0.55 : 1; voice.place();
    this.things.visible = true; this.cloth.visible = true;

    let out = true, flare;
    if (!back) {
      // ---- the white is brushed out; the pot is brushed in on it; the knife and the parsley are touched in
      gu.uPaint.value = 1.1 * ramp(t, T_WHITE[0], T_WHITE[1]);
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
        flare = ease.smooth(ramp(t, this.T_HOME - 0.25, this.T_HOME + (calm ? 1.9 : 0.9)));
      }
    } else {
      // ---- going back: the lemon rolls home under the wall; then it is all unpainted, last stroke first
      const R_ = L.ret, k = ease.inOut(ramp(R_, 0, 0.62)), h = this.hold;
      if (this.wasOut) {
        const a = 1 - k, x0 = p.x, z0 = p.z;
        p.set(a * a * this.from.x + 2 * a * k * this.via.x + k * k * this.to.x, lerp(Math.max(LR, this.from.y), LR, clamp01(k * 4)), a * a * this.from.z + 2 * a * k * this.via.z + k * k * this.to.z);
        const d = Math.hypot(p.x - x0, p.z - z0);
        if (d > 1e-5) { V.w.set((p.x - x0) / d, 0, (p.z - z0) / d); const want = Math.atan2(-V.w.x, -V.w.z); let dy = want - this.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); if (Math.abs(dy) > PI / 2) { dy -= Math.sign(dy) * PI; this.roll += d / LR; } else this.roll -= d / LR; this.yaw += dy * Math.min(1, d * 14); }
        this.lq.copy(this.pose()); out = k < 0.995;
      } else out = false;
      flare = h.flare * (1 - ease.smooth(ramp(R_, 0, 0.25)));
      u.uSmall.value = h.small * (1 - ramp(R_, 0.22, 0.5)); u.uPot.value = h.pot * (1 - ramp(R_, 0.36, 0.8)); gu.uPaint.value = h.paint * (1 - ease.inOut(ramp(R_, 0.52, 1)));
    }

    // ---- the gleam: stronger the nearer the lemon is to the pot; his blaze only when the lemon is in his place
    const dist = Math.hypot(p.x, p.z) - R, near = out ? 0.25 + 0.75 * sstep(1.3, 0.2, dist) : 0, high = out ? clamp01(1 - (p.y - 0.12) / 0.5) : 0;
    const breathe = calm ? 1 : 1 + 0.045 * Math.sin(t * 2.1) * flare;
    u.uGleam.value = near * high * u.uPot.value * breathe; u.uFlare.value = flare * breathe; this.flare = flare;
    u.uWhite.value = clamp01(gu.uPaint.value * 1.4);
    u.uLemP.value.copy(p); gu.uLemS.value = out ? 1 : 0;
    u.uLem.value.compose(out ? p : V.v.set(0, -9, 0), this.lq, V.one);
    // ---- the lid: tipped into the pot on one side, as he has it; it shivers when the copper is struck
    this.shiver += dt;
    const sh = this.shiver < 2 ? (calm ? 0.3 : 1) * 0.022 * (this.shiverK || 1) * Math.exp(-this.shiver * 4.2) * Math.sin(this.shiver * 52) : 0;
    V.ax.set(-Math.sin(LID_LOW), 0, Math.cos(LID_LOW));
    u.uLid.value.makeTranslation(0.004 * Math.cos(LID_LOW), H - 0.017 + RL * Math.sin(LID_TILT), 0.004 * Math.sin(LID_LOW)).multiply(V.a.makeRotationAxis(V.ax, -(LID_TILT + sh)));
    // ---- the lemon's shadow, where there is no cloth under it
    if (out && this.free) { const w = V.v.copy(p).applyMatrix4(this.B); this.blob.visible = true; this.blob.count = 1; this.blob.set(0, w.x, w.z, LR * 1.3, 0.7 * clamp01(1 - (p.y - LR) / 0.3)); } else { this.blob.count = 0; this.blob.visible = false; }
    if (back && L.ret >= 1) this.hide();
  },

  // The toy's turn: the lemon rolls where it is pushed, as a lemon does; it knocks on the pot; back in his place, the
  // blaze comes back. Returns how much of the blaze there is.
  push(L, dt, calm) {
    const b = this.b, V = this.V, p = this.lp, h = Math.min(dt, 0.05);
    if (h > 0) {
      this.rollers.step(h);
      // the pot is in its way
      const q = V.v.set(b.x, b.y, b.z).applyMatrix4(this.Binv), d = Math.hypot(q.x, q.z), min = R + LR + 0.004;
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
