// Raphaelle Peale, Still Life - Strawberries, Nuts, &c. (1822), Gallery 161. The word: ring.
//
// A dessert set out on a plain shelf against the dark: a glass urn of strawberries under its glass lid; a two-handled
// cup of Chinese porcelain on three saucers; a porcelain bowl heaped with filberts and almonds, an orange and its
// leaves on top; a cream jug; and a dry branch of raisins that has slipped over the bowl's rim and down onto the
// shelf. He signed it along the shelf's front edge. The museum's note says he "meticulously rendered the various
// surfaces and forms of fruits, nuts, and tableware", and that the porcelain was a luxury, made in China for the
// American market. It is a picture of what things are made of, told by how each of them takes the light. And the
// most extraordinary passage in it is the lid of the urn, which is hardly painted at all: a few hairs of grey on the
// black, and two touches of white, which are his window. You know that glass is there only because the light says so.
//
// A dining room has another way of knowing what a thing is made of: it listens. True porcelain rings when it is
// touched, and so does good glass, each piece with a voice of its own. So the show is the picture's surfaces, heard.
//
// Look at it and his dark comes down over the wall and the floor under the picture (the pictures and their labels
// keep their light), and his shelf slides out of it with the table on it as he set it, a little more than twice the
// size he painted it, which was the size of life; his light comes up on it from the left. Nothing moves. Then the lid
// lifts off the urn: the two white touches rise together, which is nearly all that can be seen of it going. It tips
// its top towards you, and hangs. It comes down, and the glass rings: one clear, long note. A hair of light leaves
// the urn's rim and widens over the table, and as the note reaches each thing it answers in its own voice and its own
// way. The red of the strawberries comes up in the glass. The bowl hums, low, and the nuts shift and chatter in it;
// the orange's leaves shiver; the cup turns a hair on its saucers, which tick; the jug gives its own note; and the
// raisins, which have none, swing on their dry stalk. Each rim that sounds lets go a ring of its own. The notes are
// one chord, and it dies away, the glass last. Then it is his picture again, and still. While you keep looking the
// lid lifts and rings again every so often, more quietly.
//
// When you stop looking it stays out while the toy is near, and the table is the toy's to ring: drive past and the
// china chatters, as a dresser does when someone runs through the room; drive up against the shelf and the lid jumps
// and comes down, and it all rings. Drive off, or leave it half a minute, and his light goes down, the shelf slides
// home and the dark lifts.
//
// Nothing here has the room's light on it: his light, from the upper left, is in the paint (one smooth mesh, painted
// in its shader). The porcelain is a white made of greys: warm where the light is, a grey-olive shade turning from
// it, darkest just past the turn, the shelf's light coming back up into the shadow, and one wet touch for the glaze;
// the cup has its gold band, its green line, its row of dots and its small round picture, the two upper saucers
// their dark blue-green border, the jug its turned threads, its fluted foot and the gold inside its lip. The filberts
// are dark and glossy with a pale scar, the almonds pitted and dull, the raisins creased, with no shine at all; the
// orange is his lemon-yellow going to brown in the shade. The strawberries are not modelled one by one: the heap is,
// and they are painted on it, each with its own light, its seeds, here and there its green cap, and the dark
// between. The glass is drawn as he drew it: almost nothing where you look straight through it, a hair of light
// where it turns away, and the window given back wherever the glass is turned to show it to you (so the touches of
// white slide over the lid as it tips, and as you drive round it). The name on the shelf's edge is not written by
// us: it is the picture's own strokes, read from the picture as it hangs (and left out until the picture itself, not
// its small stand-in, has loaded). His shadows lie on the shelf to the right of each thing.
//
// The sounds are the things themselves and there is no tune: the glass an E with two rough partials above it, two
// strings of it a hair apart so that it shimmers; the bowl the E two octaves down, the jug and the cup the third and
// the fifth between, the saucers a tick and a high third: one chord of E, each note a sine that dies as the thing
// would. With "Reduce motion and flashing": the red comes up in the glass slowly and less, the rings are fainter,
// the glass does not shimmer, the nuts, the cup and the raisins move half as far, his dark comes and goes more
// slowly, and everything is quieter; nothing flashes at any setting.
//
// Where it stands. The shelf is 1.48 m wide and comes 0.9 m out from the wall; nothing on it stands higher than
// 0.88 m (the lid, lifted, 1.0 m), under a picture whose frame begins at 1.35 m, between the Cotopaxi
// (src/life/76571-view-of-cotopaxi.js, 1.75 m to the left, its frame from 1.23 m) and Hannah Skeele's Fruit Piece
// (1.58 m to the right, no show yet). In the kit's check (nine cameras, eight moments) the guard has nothing to cut.
// His dark is paint on the wall behind the pictures, on the skirting and on the floor, fading out within four
// metres; it reaches the wall under the Cotopaxi and the Fruit Piece, and nothing else of this show does. The
// Cotopaxi's lake can come to within a metre of the shelf's left end, but neither show stays out once another
// begins. Two draw calls: the table, and one soft mesh (the dark, the shade on the floor, the glass, the rings).
// Nothing is solid to the toy.
//
// The other picture of strawberries in this room is Joshua Johnson's (src/life/150054-mrs-beatty-and-susan.js),
// where one falls, takes root and ripens. Here they do none of that: they stay in the urn as he put them, under glass.
//
// What it leaves out, and why: no hand lifts the lid and nobody sits down to this dessert; nothing is taken from
// the table, cracked, peeled, poured or eaten, because the picture is of a table that has not been touched. The
// small round picture on the cup (a woman standing by an anchor, ships, a dog, two birds) is copied as the
// enameller's few flat touches and does not move; the museum does not say who she is, and neither does this. No ship
// sails out of it: the porcelain's voyage is the museum's point, but the sea on this wall is Homer's. And nothing is
// made of the painter's own life.

import * as THREE from 'three';
import { lifeFor, ease, ramp, clamp01, lerp, rng, canvasTexture } from '../paintlife.js';
import { score, noise } from './stagecraft.js';

const PI = Math.PI, TAU = PI * 2;
// The table's own metres: x along the wall (to the viewer's right), y up from the floor, z out from the picture's
// plane into the room. Everything is about 2.3 times the size he painted it (which was the size of life).
const TH = 0.12;                                   // his shelf: how high it stands
const SX = 0.74, Z1 = 0.9;                         // its half width; its front edge
const URN = [-0.213, 0.24], CUP = [-0.465, 0.4], BOWL = [-0.02, 0.55], JUG = [0.275, 0.23], ORANGE = [0.0, 0.52];
const RIM = 0.622;                                 // the urn's rim, above the shelf (the lid sits on it)
const CUP_Y = 0.095, BOWL_RIM = 0.166, ORANGE_Y = 0.315, ORANGE_R = 0.1;
const SUN = new THREE.Vector3(-0.72, 0.64, 0.26).normalize();      // the way to his light: upper left, in front
const WIN = new THREE.Vector3(-0.5, 0.8, 0.2).normalize();         // and to his window, as the glass gives it back
// The show, in seconds.
const T_OUT = [0, 1.25], T_LIGHT = [0.4, 1.9], T_CLINK = 3.75, PERIOD = 7.5;
const FIRST = { up: 0.75, hang: 0.6, down: 0.3, h: 0.12 }, LATER = { up: 0.7, hang: 0.45, down: 0.28, h: 0.065 };
const AFTER = { bowl: 0.26, leaf: 0.3, cup: 0.38, sauc: 0.46, jug: 0.6, raisin: 0.66 };      // the ring reaches each of them this long after the glass
const HOP = 0.24;                                  // (struck by the toy, the lid jumps and is this long coming down)
const SIG = [0.2, 0.46, 0.036];                     // his name on the shelf's front edge: from x, this wide, this far below the top
const KEY = 0.5;                                   // (the game's film curve lifts what the room does not light: the paint is laid that much lower)
let TOLD = false;                                  // (the game says what happens once, the first time)
const sstep = (a, b, x) => { const q = clamp01((x - a) / (b - a)); return q * q * (3 - 2 * q); };
const K_SLAB = 0, K_PORC = 1, K_BERRY = 2, K_HAZEL = 3, K_ALMOND = 4, K_ORANGE = 5, K_LEAF = 6, K_RAISIN = 7, K_STEM = 8, K_HEAP = 9;
const M_STILL = 0, M_NUT = 1, M_CUP = 2, M_SAUC = 3, M_HANG = 4, M_LEAF = 5;
const P_GLASS = 0, P_LID = 1, P_DARK = 2, P_FLOOR = 3, P_RING = 4;      // the soft mesh's parts (rings: 4 the urn, 5 the bowl, 6 the cup, 7 the jug)

// ---------------------------------------------------------------- geometry
// A smooth surface from a rule: f(u, v, o) sets o.p (a point), and may set o.c (what the shader is to know of it),
// o.t (where on its part it lies; u, v if it does not) and o.w, for u, v in 0..1. Its normals are taken from the rule.
// Every vertex says what it is (aK: kind, what moves it, which part) and carries aC (a middle to move about; a number).
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
// Set down: moved by m; its middle (and, if given, its number) written into every vertex.
const _c = new THREE.Vector3();
function place(g, m, w = null) {
  g.applyMatrix4(m); _c.setFromMatrixPosition(m);
  const a = g.attributes.aC;
  for (let i = 0; i < a.count; i++) { a.setXYZ(i, _c.x, _c.y, _c.z); if (w != null) a.setW(i, w); }
  return g;
}
const at = (x, y, z) => new THREE.Matrix4().makeTranslation(x, y, z);
// Turned on a wheel, or blown and spun: a profile [[r, y], ...] round the y axis, eased through its points.
// aUv: how far round (0 at the front, towards you), how far along the profile. paint(v, ph, o) may set o.c, o.w.
function turned(pts, seg, rings, kind, move, sub, paint = null, wave = null) {
  const curve = new THREE.CatmullRomCurve3(pts.map(([r, y]) => new THREE.Vector3(r, y, 0)), false, 'centripetal'), q = new THREE.Vector3();
  return surf(seg, rings, (u, v, o) => { curve.getPoint(v, q); const ph = u * TAU, r = Math.max(1e-4, q.x) * (wave ? wave(ph, v) : 1); o.p.set(r * Math.sin(ph), q.y, r * Math.cos(ph)); if (paint) paint(v, ph, o); }, kind, move, sub);
}
// A rod along a path, [rx, ry] thick (a strap if they differ), tapering if r is a rule of v.
function rod(pts, r, nu, nv, kind, move, sub, paint = null) {
  const curve = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(p[0], p[1], p[2])), false, 'centripetal');
  const T = new THREE.Vector3(), n1 = new THREE.Vector3(), n2 = new THREE.Vector3(), c = new THREE.Vector3(), Z = new THREE.Vector3(0, 0, 1);
  return surf(nu, nv, (u, v, o) => {
    curve.getPoint(v, c); curve.getTangent(v, T); n1.crossVectors(Z, T); if (n1.lengthSq() < 1e-8) n1.set(1, 0, 0); n1.normalize(); n2.crossVectors(T, n1);
    const a = u * TAU, rr = typeof r === 'function' ? r(v) : r;
    o.p.copy(c).addScaledVector(n1, rr[0] * Math.cos(a)).addScaledVector(n2, rr[1] * Math.sin(a)); if (paint) paint(v, a, o);
  }, kind, move, sub);
}
// How high the nuts lie in the bowl, r from its middle (above the shelf).
const moundY = r => 0.148 + 0.115 * (1 - sstep(0.04, 0.3, r));

const NOISE = /* glsl */`
float mH(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float mN(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mH(i), mH(i + vec2(1.0, 0.0)), f.x), mix(mH(i + vec2(0.0, 1.0)), mH(i + vec2(1.0, 1.0)), f.x), f.y); }
float sq(float x) { return x * x; }
float seg(vec2 p, vec2 a, vec2 b) { vec2 pa = p - a, ba = b - a; return length(pa - ba * clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0)); }`;
const f3 = x => x.toFixed(3), v2 = (x, y) => `vec2(${x.toFixed(4)}, ${y.toFixed(4)})`, v3g = v => `vec3(${v.x.toFixed(4)}, ${v.y.toFixed(4)}, ${v.z.toFixed(4)})`;

// The round picture on his cup, in the enameller's few colours: a far shore, two ships at anchor, a near bank, an
// anchor, a woman standing by it, a small dog, two birds overhead. Loose touches; it is two finger-widths across.
function medallion(g, s) {
  const dab = (x, y, w, h, c, rot = 0) => { g.fillStyle = c; g.beginPath(); g.ellipse(x * s, y * s, w * s, h * s, rot, 0, TAU); g.fill(); };
  const line = (pts, c, w) => { g.strokeStyle = c; g.lineWidth = w * s; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0] * s, p[1] * s) : g.moveTo(p[0] * s, p[1] * s))); g.stroke(); };
  g.fillStyle = '#dcd8ca'; g.fillRect(0, 0, s, s);
  g.save(); g.beginPath(); g.arc(s / 2, s / 2, s * 0.47, 0, TAU); g.clip();
  const sky = g.createLinearGradient(0, 0, 0, s); sky.addColorStop(0, '#aeab9c'); sky.addColorStop(0.3, '#dedacb'); sky.addColorStop(0.6, '#ebe6d6'); sky.addColorStop(1, '#e6e0cf'); g.fillStyle = sky; g.fillRect(0, 0, s, s);
  // the far shore
  dab(0.16, 0.45, 0.17, 0.035, '#c98a34'); dab(0.14, 0.415, 0.12, 0.014, '#688c3c'); dab(0.2, 0.5, 0.2, 0.02, '#d39a45');
  dab(0.78, 0.485, 0.24, 0.028, '#c98a34'); dab(0.74, 0.455, 0.16, 0.012, '#688c3c'); dab(0.6, 0.52, 0.14, 0.012, '#d9a857');
  // two ships
  for (const [x, y, k] of [[0.63, 0.585, 1], [0.83, 0.575, 0.85]]) {
    dab(x, y, 0.062 * k, 0.012 * k, '#6e6046'); line([[x - 0.07 * k, y - 0.004], [x + 0.075 * k, y - 0.012 * k]], '#6e6046', 0.006);
    for (const dx of [-0.035, 0.0, 0.035]) { line([[x + dx * k, y], [x + dx * k, y - 0.1 * k]], '#7a6c50', 0.005); line([[x + dx * k - 0.016 * k, y - 0.06 * k], [x + dx * k + 0.016 * k, y - 0.06 * k]], '#8a7c60', 0.004); }
  }
  // the near bank
  dab(0.7, 0.73, 0.3, 0.03, '#6f9440'); dab(0.12, 0.72, 0.1, 0.03, '#6f9440'); dab(0.5, 0.88, 0.5, 0.13, '#cf9038'); dab(0.62, 0.84, 0.22, 0.03, '#e3bb78'); dab(0.3, 0.93, 0.2, 0.025, '#b87628');
  // the anchor
  line([[0.425, 0.63], [0.445, 0.85]], '#2c2519', 0.016); g.strokeStyle = '#2c2519'; g.lineWidth = 0.012 * s; g.beginPath(); g.ellipse(0.43 * s, 0.63 * s, 0.06 * s, 0.014 * s, 0, 0, TAU); g.stroke();
  line([[0.33, 0.83], [0.39, 0.88], [0.45, 0.865], [0.52, 0.875], [0.56, 0.84]], '#2c2519', 0.02);
  // the woman beside it: a pink skirt, a blue-green jacket, fair hair, a hand held out
  g.fillStyle = '#e9b9a6'; g.beginPath(); g.moveTo(0.255 * s, 0.56 * s); g.lineTo(0.335 * s, 0.56 * s); g.lineTo(0.38 * s, 0.86 * s); g.lineTo(0.2 * s, 0.86 * s); g.closePath(); g.fill();
  line([[0.27, 0.62], [0.25, 0.84]], '#d99a8a', 0.008); line([[0.31, 0.62], [0.33, 0.84]], '#f3d2c2', 0.008);
  dab(0.29, 0.5, 0.045, 0.07, '#2f7c77'); dab(0.275, 0.5, 0.02, 0.06, '#235e5c'); line([[0.32, 0.48], [0.4, 0.5], [0.43, 0.56]], '#e3b29c', 0.014);
  dab(0.3, 0.405, 0.03, 0.034, '#e2b98f'); dab(0.288, 0.395, 0.03, 0.03, '#cf9a52');
  // the two birds, and the threads up to them
  line([[0.41, 0.5], [0.46, 0.4], [0.5, 0.33], [0.49, 0.27]], '#8d8979', 0.004); line([[0.41, 0.5], [0.5, 0.42], [0.58, 0.34], [0.6, 0.28]], '#8d8979', 0.004);
  line([[0.43, 0.25], [0.48, 0.265], [0.535, 0.235]], '#5c584a', 0.011); line([[0.55, 0.275], [0.6, 0.285], [0.655, 0.25]], '#5c584a', 0.011);
  // the dog
  dab(0.64, 0.85, 0.035, 0.045, '#ece6d6'); dab(0.66, 0.79, 0.022, 0.022, '#ece6d6');
  g.strokeStyle = '#3a3226'; g.lineWidth = 0.007 * s; g.beginPath(); g.ellipse(0.64 * s, 0.85 * s, 0.035 * s, 0.045 * s, 0, 0, TAU); g.stroke(); g.beginPath(); g.arc(0.66 * s, 0.79 * s, 0.022 * s, 0, TAU); g.stroke();
  dab(0.672, 0.775, 0.012, 0.014, '#6a4a2a');
  g.restore();
  g.strokeStyle = '#26332c'; g.lineWidth = 0.014 * s; g.beginPath(); g.arc(s / 2, s / 2, s * 0.47, 0, TAU); g.stroke();
}

lifeFor(120154, {
  title: /^Still Life.{1,3}Strawberries, Nuts/,
  word: 'ring',
  // (a small work hung high: the kit keeps the whole of it in view, in the upper part, with his shelf below it)
  stage: { out: 1.6, half: 1.05, cam: { dist: 2.25, side: 0.14, height: 0.62, fov: 56, lookU: 0, lookOut: 0.5, lookH: 0.95, floorOut: 0.96 } },
  wake: 2, ret: 2.2,
  linger: { near: 3.5, max: 30 },

  build(L) {
    const P = L.pal, col = (h, a = 0.06) => P.near(h, a), C = (h, a) => { const c = col(h, a); return `vec3(${c.r.toFixed(4)}, ${c.g.toFixed(4)}, ${c.b.toFixed(4)})`; };
    const rnd = rng(120154);
    const V = this.V = { a: new THREE.Matrix4(), b: new THREE.Matrix4(), c: new THREE.Matrix4(), v: new THREE.Vector3(), q: new THREE.Quaternion(), e: new THREE.Euler(), one: new THREE.Vector3(1, 1, 1) };
    this.B = new THREE.Matrix4().makeBasis(new THREE.Vector3(L.tx, 0, L.tz), new THREE.Vector3(0, 1, 0), new THREE.Vector3(L.nx, 0, L.nz)).setPosition(L.floor(0, 0));
    this.Binv = this.B.clone().invert();
    const wall = this.wall = L.wall, Z0 = -wall + 0.004;
    const turn = (yaw, pitch, roll, x, y, z) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(pitch, yaw, roll, 'YXZ')), V.one);
    const parts = [];

    // ------------------------------------------------------------ his shelf: its top, its front edge, its two ends
    parts.push(surf(1, 1, (u, v, o) => o.p.set(lerp(-SX, SX, u), TH, lerp(Z1, Z0, v)), K_SLAB, M_STILL, 0));
    parts.push(surf(1, 1, (u, v, o) => o.p.set(lerp(-SX, SX, u), lerp(-0.004, TH, v), Z1), K_SLAB, M_STILL, 1));
    parts.push(surf(1, 1, (u, v, o) => o.p.set(SX, lerp(-0.004, TH, v), lerp(Z1, Z0, u)), K_SLAB, M_STILL, 2));
    parts.push(surf(1, 1, (u, v, o) => o.p.set(-SX, lerp(-0.004, TH, v), lerp(Z0, Z1, u)), K_SLAB, M_STILL, 2));

    // ------------------------------------------------------------ the bowl of nuts: porcelain, its rim gently waved
    {
      const [bx, bz] = BOWL, m = at(bx, TH, bz), scallop = (ph, v) => 1 + 0.011 * Math.cos(ph * 12) * sstep(0.55, 1, v);
      parts.push(place(turned([[0.128, 0.0], [0.141, 0.003], [0.146, 0.016], [0.16, 0.04], [0.205, 0.082], [0.262, 0.13], [0.3, 0.156], [0.312, BOWL_RIM]], 72, 14, K_PORC, M_STILL, 0, null, scallop), m));
      parts.push(place(turned([[0.312, BOWL_RIM], [0.309, BOWL_RIM + 0.004], [0.302, BOWL_RIM - 0.002], [0.29, 0.152], [0.255, 0.125], [0.2, 0.09], [0.12, 0.06], [0.001, 0.05]], 72, 10, K_PORC, M_STILL, 1, null, (ph, v) => 1 + 0.011 * Math.cos(ph * 12) * sstep(0.45, 0, v)), m));
      // (what the nuts lie on, so that the gaps between them are dark)
      parts.push(place(turned([[0.298, 0.152], [0.28, 0.142], [0.22, 0.168], [0.14, 0.212], [0.06, 0.244], [0.001, 0.25]], 36, 6, K_HEAP, M_STILL, 0), m));
      // the nuts: filberts on the left of the heap, almonds in their shells on the right, the orange's place left empty
      const nuts = [], RB = 0.273;
      for (let tries = 0; tries < 14000 && nuts.length < 128; tries++) {
        const a = rnd() * TAU, r = RB * Math.sqrt(rnd()), x = r * Math.cos(a), z = r * Math.sin(a);
        const hazel = x < 0.015 + 0.05 * Math.sin(z * 14), need = hazel ? 0.041 : 0.056;
        if (Math.hypot(x - (ORANGE[0] - bx), z - (ORANGE[1] - bz)) < 0.09 + (hazel ? 0 : 0.012)) continue;
        if (x > 0.1 && Math.abs(z - 0.02) < 0.055) continue;                                   // (the raisins lie here)
        if (nuts.some(n => Math.hypot(n.x - x, n.z - z) < (need + n.need) / 2)) continue;
        nuts.push({ x, z, r, hazel, need });
      }
      nuts.forEach((n, i) => {
        const seed = 0.137 + i * 0.6180339, vr = rnd(), y = TH + moundY(n.r);
        if (n.hazel) {
          // a filbert: round, a little pointed, the pale flat scar at its base; lying any way up
          const R = 0.0225 + 0.004 * rnd(), h = 0.046 + 0.006 * rnd();
          const g = surf(9, 6, (u, v, o) => { const t = 0.002 + 0.996 * v, ph = u * TAU, rr = R * Math.pow(Math.sin(PI * t), 0.56) * (1.1 - 0.22 * t); o.p.set(rr * Math.sin(ph), (Math.pow(t, 1.12) - 0.47) * h, rr * Math.cos(ph)); o.c.setRGB(vr, 0, 0); }, K_HAZEL, M_NUT);
          parts.push(place(g, turn(rnd() * TAU, rnd() < 0.2 ? 1.5 + 0.6 * rnd() : 0.15 + 1.3 * rnd(), 0, bx + n.x, y + R * 0.7, bz + n.z), seed));
        } else {
          // an almond in its shell: long, flattened, pointed at one end, a seam along its edge
          const LL = 0.082 + 0.016 * rnd(), wd = 0.027 + 0.004 * rnd(), th = 0.0175 + 0.003 * rnd();
          const g = surf(9, 6, (u, v, o) => { const t = 0.002 + 0.996 * v, ph = -u * TAU, w = Math.pow(Math.sin(PI * t), 0.62) * (1.12 - 0.42 * t); o.p.set((t - 0.5) * LL, w * th * Math.sin(ph), w * wd * Math.cos(ph)); o.c.setRGB(vr, 0, 0); }, K_ALMOND, M_NUT);
          parts.push(place(g, turn(rnd() * TAU, (rnd() - 0.5) * 0.5, (rnd() - 0.5) * 1.3, bx + n.x, y + th * 0.9, bz + n.z), seed));
        }
      });
    }

    // ------------------------------------------------------------ the orange on the nuts, its stalk and two leaves
    {
      const [ox, oz] = ORANGE, oy = TH + ORANGE_Y, R = ORANGE_R;
      parts.push(place(surf(32, 20, (u, v, o) => {
        const ph = u * TAU, th = (v - 0.5) * PI, lump = 1 + 0.014 * Math.sin(3 * ph + 1) * Math.cos(th) + 0.01 * Math.sin(2 * ph - 0.6);
        const dimple = 1 - 0.07 * Math.exp(-Math.pow((PI / 2 - th) / 0.2, 2)) - 0.03 * Math.exp(-Math.pow((PI / 2 + th) / 0.16, 2));
        const rr = R * lump * dimple; o.p.set(rr * Math.cos(th) * Math.sin(ph), rr * Math.sin(th) * 0.95, rr * Math.cos(th) * Math.cos(ph));
      }, K_ORANGE), turn(0.4, 0.14, -0.2, ox, oy, oz), 0));
      // where the stalk leaves it (the orange is tipped a little towards you and the light)
      const top = new THREE.Vector3(0, R * 0.9, 0).applyMatrix4(turn(0.4, 0.14, -0.2, 0, 0, 0)).add(new THREE.Vector3(ox, oy, oz));
      parts.push(rod([[top.x, top.y - 0.006, top.z], [top.x - 0.006, top.y + 0.02, top.z + 0.004], [top.x - 0.02, top.y + 0.036, top.z + 0.012]], [0.0045, 0.0045], 6, 4, K_STEM));
      // a leaf: from its stalk along `dir`, `side` across it; folded a little along its rib, its tip curling
      const leaf = (base, dir, side, len, wd, curl, shade, seed) => {
        const d = new THREE.Vector3(...dir).normalize(), sd = new THREE.Vector3(...side); sd.addScaledVector(d, -sd.dot(d)).normalize(); const up = new THREE.Vector3().crossVectors(sd, d);
        return surf(9, 14, (u, v, o) => {
          const ac = u * 2 - 1, w = wd * Math.pow(Math.sin(PI * (0.03 + 0.94 * v)), 0.75) * (1 - 0.25 * v);
          o.p.copy(base).addScaledVector(d, v * len).addScaledVector(sd, ac * w).addScaledVector(up, -Math.abs(ac) * w * 0.3 + curl * v * v * len + 0.004 * Math.sin(v * 9 + ac * 3));
          o.t.set(ac, v); o.c.setRGB(shade, 0, 0); o.w = seed;
        }, K_LEAF, M_LEAF);
      };
      const b0 = new THREE.Vector3(top.x - 0.02, top.y + 0.036, top.z + 0.012);
      parts.push(leaf(b0, [-0.9, 0.2, 0.4], [0.25, 0.9, -0.15], 0.16, 0.047, -0.14, 1, 0.3));          // the bright one, towards the light
      parts.push(leaf(b0, [-0.05, 0.9, -0.25], [0.9, 0.05, 0.4], 0.125, 0.04, 0.4, 0.2, 1.9));       // the darker one behind it, curling over
    }

    // ------------------------------------------------------------ the strawberries, heaped in the urn (which is glass, below)
    {
      const m = at(URN[0], TH, URN[1]);
      parts.push(place(turned([[0.045, 0.262], [0.1, 0.277], [0.142, 0.318], [0.172, 0.378], [0.188, 0.44], [0.194, 0.5], [0.195, 0.548]], 48, 12, K_BERRY, M_STILL, 0), m));
      parts.push(place(turned([[0.195, 0.548], [0.186, 0.566], [0.155, 0.584], [0.095, 0.6], [0.001, 0.607]], 40, 6, K_BERRY, M_STILL, 1), m));
    }

    // ------------------------------------------------------------ the saucers, and the two-handled cup on them
    {
      const [cx, cz] = CUP, m = at(cx, TH, cz);
      parts.push(place(turned([[0.07, 0.0], [0.086, 0.004], [0.092, 0.014], [0.128, 0.05], [0.158, 0.084], [0.166, 0.095]], 48, 8, K_PORC, M_SAUC, 3), m, 0));
      parts.push(place(turned([[0.166, 0.095], [0.162, 0.097], [0.155, 0.088], [0.12, 0.052], [0.08, 0.03], [0.001, 0.026]], 48, 6, K_PORC, M_SAUC, 3), m, 0));
      for (const [i, y0, r0] of [[1, 0.064, 0.161], [2, 0.084, 0.157]]) {
        const k = r0 / 0.163, mm = at(cx, TH + y0, cz);
        parts.push(place(turned([[0.06 * k, 0.0], [0.07 * k, 0.004], [0.12 * k, 0.03], [0.156 * k, 0.049], [0.163 * k, 0.054]], 48, 6, K_PORC, M_SAUC, 3), mm, i));
        parts.push(place(turned([[0.163 * k, 0.054], [0.158 * k, 0.057], [0.15 * k, 0.051], [0.12 * k, 0.034], [0.06 * k, 0.014], [0.001, 0.012]], 48, 8, K_PORC, M_SAUC, 2), mm, i));
      }
      const mc = at(cx, TH + CUP_Y, cz), H = 0.236;
      parts.push(place(turned([[0.046, 0.0], [0.051, 0.006], [0.062, 0.02], [0.086, 0.052], [0.101, 0.09], [0.105, 0.122], [0.101, 0.158], [0.094, 0.19], [0.092, 0.208], [0.097, 0.224], [0.103, H]], 56, 22, K_PORC, M_CUP, 4), mc));
      parts.push(place(turned([[0.103, H], [0.1, H + 0.003], [0.095, H - 0.002], [0.088, 0.2], [0.09, 0.13], [0.07, 0.05], [0.001, 0.04]], 40, 8, K_PORC, M_CUP, 5), mc));
      for (const s of [-1, 1]) parts.push(place(rod([[s * 0.094, 0.186, 0], [s * 0.125, 0.2, 0], [s * 0.153, 0.185, 0], [s * 0.158, 0.14, 0], [s * 0.14, 0.092, 0], [s * 0.1, 0.07, 0]], [0.0075, 0.011], 6, 14, K_PORC, M_CUP, 8), mc));
    }

    // ------------------------------------------------------------ the cream jug: a helmet on a fluted foot, its lip to the left
    {
      const [jx, jz] = JUG, m = at(jx, TH, jz);
      const prof = new THREE.CatmullRomCurve3([[0.061, 0.0], [0.064, 0.008], [0.05, 0.022], [0.041, 0.04], [0.05, 0.062], [0.071, 0.095], [0.087, 0.15], [0.098, 0.21], [0.108, 0.27], [0.116, 0.335]].map(([r, y]) => new THREE.Vector3(r, y, 0)), false, 'centripetal'), q = new THREE.Vector3();
      // the rim rides up to the lip and up again to the handle, and dips between; the lip is drawn out to the left
      const jug = (inset, v0, v1) => (u, v, o) => {
        const ph = u * TAU, t = lerp(v0, v1, v); prof.getPoint(t, q);
        const sx = Math.sin(ph), lipk = Math.pow(Math.max(0, -sx), 2.6), high = sstep(0.62, 1, t);
        const rise = (0.026 * Math.cos(2 * ph + PI) + 0.014 * Math.max(0, sx) + 0.006) * high, r = (q.x - inset) * (1 + 0.62 * lipk * sstep(0.7, 1, t));
        o.p.set(r * sx, q.y + rise, r * Math.cos(ph) * (1 - 0.22 * lipk * high)); o.t.set(u, t);
      };
      parts.push(place(surf(56, 26, jug(0, 0, 1), K_PORC, M_STILL, 6), m));
      parts.push(place(surf(56, 8, jug(0.005, 1, 0.42), K_PORC, M_STILL, 7), m));
      parts.push(place(rod([[0.108, 0.352, 0], [0.126, 0.385, 0], [0.146, 0.386, 0], [0.152, 0.34, 0], [0.148, 0.24, 0], [0.136, 0.168, 0], [0.11, 0.136, 0], [0.086, 0.146, 0], [0.09, 0.162, 0]], [0.008, 0.0115], 6, 20, K_PORC, M_STILL, 8), m));
    }

    // ------------------------------------------------------------ the raisins: a dry branch of them out of the bowl, over its rim, down onto the shelf
    const lying = [];
    {
      const path = [[0.1, 0.272, 0.56], [0.18, 0.252, 0.595], [0.262, 0.208, 0.635], [0.31, 0.15, 0.665], [0.345, 0.08, 0.68], [0.39, 0.026, 0.675], [0.48, 0.018, 0.65], [0.585, 0.022, 0.622]].map(([x, y, z]) => [x, y + TH, z]);
      const curve = new THREE.CatmullRomCurve3(path.map(p => new THREE.Vector3(...p)), false, 'centripetal'), HANG = [0.36, 0.7];      // (between the rim and the shelf it hangs free)
      const hangW = s => (s > HANG[0] && s < HANG[1] ? Math.sin(PI * (s - HANG[0]) / (HANG[1] - HANG[0])) : 0);
      parts.push(rod(path, [0.0036, 0.0036], 5, 40, K_STEM, M_HANG, 0, (v, a, o) => { o.w = hangW(v); }));
      const p = new THREE.Vector3(), tn = new THREE.Vector3(), side = new THREE.Vector3(), upv = new THREE.Vector3(), set = [];
      // (in bunches, as they dried: on the nuts, at the rim, hanging, and the last of them lying out on the shelf)
      const bunches = [[0.03, 2], [0.12, 3], [0.22, 2], [0.33, 2], [0.42, 2], [0.5, 3], [0.57, 3], [0.64, 2], [0.75, 2], [0.86, 3], [0.93, 3], [0.99, 2]];
      bunches.forEach(([s, n], bi) => {
        curve.getPoint(s, p); curve.getTangent(s, tn); side.set(-tn.z, 0, tn.x).normalize(); upv.crossVectors(side, tn).normalize();
        for (let j = 0; j < n; j++) {
          const LL = 0.05 + 0.016 * rnd(), R = 0.019 + 0.006 * rnd(), a = (j / n) * TAU + rnd() * 1.6 + bi, off = 0.016 + 0.02 * rnd(), vr = rnd(), ds = (rnd() - 0.5) * 0.05;
          let x = p.x + side.x * off * Math.cos(a) + tn.x * ds, z = p.z + side.z * off * Math.cos(a) + tn.z * ds, y = Math.max(TH + R * 0.9, p.y + upv.y * off * Math.sin(a) * 0.8 + (s < 0.36 ? 0.01 : -0.006));
          // (no two in the same place)
          for (const q of set) { const d = Math.hypot(x - q[0], y - q[1], z - q[2]); if (d < 0.034) { x += (x - q[0] + 0.004) * (0.034 - d) / Math.max(d, 0.004); z += (z - q[2] + 0.004) * (0.034 - d) / Math.max(d, 0.004); } }
          set.push([x, y, z]);
          const k1 = bi * 3 + j;
          const g = surf(8, 6, (u, v, o) => {
            const t = 0.002 + 0.996 * v, ph = -u * TAU, w = Math.pow(Math.sin(PI * t), 0.7) * (1 + 0.17 * Math.sin(ph * 3 + k1) * Math.sin(PI * t) + 0.11 * Math.sin(ph * 5 + t * 9 + k1 * 2));
            o.p.set((t - 0.5) * LL, w * R * 0.8 * Math.sin(ph), w * R * Math.cos(ph)); o.c.setRGB(vr, 0, 0);
          }, K_RAISIN, M_HANG);
          parts.push(place(g, turn(rnd() * TAU, (rnd() - 0.5) * 0.9, rnd() * TAU, x, y, z), hangW(s)));
          parts.push(rod([[p.x, p.y, p.z], [(p.x + x) / 2, (p.y + y) / 2 + 0.005, (p.z + z) / 2], [x, y, z]], [0.0022, 0.0022], 4, 3, K_STEM, M_HANG, 0, (v, aa, o) => { o.w = hangW(s); }));
          if (y < TH + 0.05) lying.push([x, z]);
        }
      });
    }
    this.lying = lying;

    // ------------------------------------------------------------ his paint on them: one material, one draw call
    const med = this.med = canvasTexture(256, 256, medallion); med.anisotropy = 4;
    const u = this.u = {
      uInv: { value: this.Binv }, uMed: { value: med }, uArt: { value: med }, uSig: { value: 0 }, uT: { value: 0 }, uSlide: { value: 0 }, uLight: { value: 0 }, uPulse: { value: 0 },
      uNut: { value: 0 }, uCup: { value: new THREE.Vector2() }, uSauc: { value: 0 }, uSway: { value: 0 }, uLeaf: { value: 0 }, uWall: { value: wall },
    };
    const sd = new THREE.Vector2(-SUN.x, -SUN.z).normalize();      // the way the shadows fall along the shelf
    const SHADE = /* glsl */`
float shelfShade(vec2 q) {
  vec2 sd = ${v2(sd.x, sd.y)}; float s = 0.0;
  s = max(s, 0.9 * smoothstep(0.2, 0.13, length(q - ${v2(...BOWL)})));
  s = max(s, 0.6 * smoothstep(0.37, 0.2, length(q - ${v2(...BOWL)} - sd * 0.16)));
  s = max(s, 0.88 * smoothstep(0.125, 0.075, length(q - ${v2(...CUP)})));
  s = max(s, 0.52 * smoothstep(0.2, 0.09, seg(q, ${v2(...CUP)} + sd * 0.07, ${v2(...CUP)} + sd * 0.3)));
  s = max(s, 0.5 * smoothstep(0.13, 0.085, length(q - ${v2(...URN)})));
  s = max(s, 0.22 * smoothstep(0.24, 0.1, seg(q, ${v2(...URN)} + sd * 0.25, ${v2(...URN)} + sd * 0.6)));
  s = max(s, 0.85 * smoothstep(0.09, 0.055, length(q - ${v2(...JUG)})));
  s = max(s, 0.55 * smoothstep(0.135, 0.05, seg(q, ${v2(...JUG)}, ${v2(...JUG)} + sd * 0.42)));
${lying.map(([x, z]) => `  s = max(s, 0.62 * smoothstep(0.042, 0.012, length(q - ${v2(x, z)} - sd * 0.02)));`).join('\n')}
  return s;
}`;
    const tm = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, fog: false });
    tm.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, u);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', `#include <common>
attribute vec3 aK; attribute vec2 aUv; attribute vec4 aC; uniform float uT, uSlide, uNut, uSauc, uSway, uLeaf; uniform vec2 uCup;
varying vec3 vK, vOP, vLP, vN; varying vec2 vUv2; varying vec4 vC;`)
        .replace('#include <begin_vertex>', `vec3 transformed = vec3(position); vec3 ln = normal;
  int mv = int(aK.y + 0.5);
  if (mv == ${M_NUT}) {                                 // a nut: it hops and turns a hair where it lies
    float s1 = fract(aC.w * 7.31), s2 = fract(aC.w * 3.17);
    float hopv = max(0.0, sin(uT * (31.0 + 11.0 * s1) + aC.w * 40.0));
    vec3 d = transformed - aC.xyz; float a = uNut * 0.4 * sin(uT * (23.0 + 9.0 * s2) + aC.w * 17.0), ca = cos(a), sa = sin(a);
    d.xz = vec2(ca * d.x - sa * d.z, sa * d.x + ca * d.z); ln.xz = vec2(ca * ln.x - sa * ln.z, sa * ln.x + ca * ln.z);
    transformed = aC.xyz + d; transformed.y += uNut * 0.026 * hopv * (0.35 + 0.65 * s2);
  } else if (mv == ${M_CUP}) {                          // the cup: it turns a hair on its saucer, and chatters
    vec2 d = transformed.xz - ${v2(...CUP)}; float ca = cos(uCup.x), sa = sin(uCup.x);
    transformed.xz = ${v2(...CUP)} + vec2(ca * d.x - sa * d.y, sa * d.x + ca * d.y); ln.xz = vec2(ca * ln.x - sa * ln.z, sa * ln.x + ca * ln.z);
    transformed.y += uCup.y;
  } else if (mv == ${M_SAUC}) transformed.y += uSauc * 0.004 * sin(uT * 51.0 + aC.w * 2.3) * aC.w;
  else if (mv == ${M_HANG}) transformed.xz += vec2(0.3, 1.0) * (uSway * aC.w);
  else if (mv == ${M_LEAF}) transformed.y += uLeaf * 0.022 * aUv.y * aUv.y * sin(uT * 29.0 + aC.w);
  transformed.z += uSlide;
  vK = aK; vUv2 = aUv; vOP = position; vLP = transformed; vN = ln; vC = aC;`);
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
uniform mat4 uInv; uniform sampler2D uMed, uArt; uniform float uLight, uPulse, uWall, uSig;
varying vec3 vK, vOP, vLP, vN; varying vec2 vUv2; varying vec4 vC;${NOISE}${SHADE}
// The nearest thing in a heap to p (in widths of them): where p lies on it (xy), how far the next is (z), which it is (w).
vec4 berry(vec2 p) {
  vec2 g = floor(p), f = fract(p), o1 = vec2(0.0); float d1 = 9.0, d2 = 9.0, id = 0.0;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 c = vec2(float(i), float(j)), o = c + 0.14 + 0.72 * vec2(mH(g + c), mH(g + c + 17.3)) - f; float d = dot(o, o);
    if (d < d1) { d2 = d1; d1 = d; o1 = o; id = mH(g + c + 5.1); } else if (d < d2) d2 = d;
  }
  return vec4(-o1, sqrt(d2) - sqrt(d1), id);
}
// One strawberry of the heap at p: its colour, and how much of it is there (a). Tn, Bt, N: the heap's own directions.
vec4 strawberry(vec2 p, vec3 Tn, vec3 Bt, vec3 N, vec3 Lk, vec3 Hh, float nl) {
  vec4 b = berry(p); float id2 = fract(b.w * 7.7), id3 = fract(b.w * 13.3), rad = 0.41 + 0.1 * id3;
  vec2 dv = b.xy / rad; dv.y *= 0.9; float rr = length(dv), zz = sqrt(max(1.0 - min(rr * rr, 1.0), 0.0));
  vec3 Nb = normalize(Tn * dv.x + Bt * dv.y + N * (zz + 0.1));
  float nlb = 0.85 * dot(Nb, Lk) + 0.3 * nl, litb = smoothstep(-0.3, 0.8, nlb);
  vec3 body = mix(${C('#9a1f12', 0.03)}, ${C('#c9361c', 0.03)}, b.w), lightc = mix(${C('#d8401e', 0.03)}, ${C('#ef6c36', 0.03)}, id3);
  vec3 c = mix(${C('#3d0a07')}, body, smoothstep(-0.6, 0.2, nlb)); c = mix(c, lightc, smoothstep(0.15, 0.9, nlb));
  vec2 sf = fract(dv * 2.6 + b.w * 7.0) - 0.5; float pip = smoothstep(0.2, 0.08, length(sf)) * smoothstep(0.92, 0.6, rr);
  c = mix(c, mix(${C('#6d190d')}, ${C('#f2cc80')}, litb), 0.6 * pip);
  if (id2 > 0.6) { vec2 q = dv - vec2(0.6 * (id2 - 0.8), 0.52); float a = atan(q.y, q.x), star = 0.46 * (0.5 + 0.5 * cos(a * 5.0 + b.w * 9.0)); c = mix(c, mix(${C('#182a10')}, ${C('#4d7230')}, litb), smoothstep(star, star - 0.14, length(q))); }
  c += ${C('#ffe0c8', 0)} * 0.3 * smoothstep(0.5, 0.95, pow(max(dot(Nb, Hh), 0.0), 24.0));
  c *= 0.55 + 0.45 * smoothstep(1.0, 0.55, rr);
  return vec4(c, 1.0 - smoothstep(0.88, 1.0, rr));
}`)
        .replace('#include <opaque_fragment>', `{
  if (vLP.z < -uWall) discard;
  int kind = int(vK.x + 0.5), sub = int(vK.z + 0.5);
  vec3 N = normalize(vN); if (!gl_FrontFacing) N = -N;
  vec3 eye = (uInv * vec4(cameraPosition, 1.0)).xyz, Vd = normalize(eye - vLP);
  vec3 Lk = ${v3g(SUN)}, Hh = normalize(Lk + Vd);
  float nl = dot(N, Lk), key = ${KEY.toFixed(2)}, var = diffuseColor.r;
  vec3 c = vec3(0.5);
  if (kind == ${K_SLAB}) {
    vec2 q = vOP.xz;
    float cloud = mN(q * 2.6 + 3.0), streak = mN(vec2(q.x * 1.7, q.y * 38.0)), fine = mN(vec2(q.x * 40.0, q.y * 170.0));
    if (sub == 0) {
      // the top: a plain grey-olive shelf, laid in along its length, lighter where the light lands
      c = mix(${C('#5c563e')}, ${C('#7a7358')}, 0.2 + 0.8 * cloud);
      c = mix(c, ${C('#898165')}, 0.2 * smoothstep(0.5, 0.85, streak));
      c *= 0.95 + 0.1 * fine;
      c *= mix(0.4, 1.0, smoothstep(-0.05, 0.5, q.y)) * mix(1.1, 0.8, smoothstep(-0.7, 0.7, q.x));
      c = mix(c, c * ${C('#3a3428', 0)}, shelfShade(q));
      c = mix(c, ${C('#958d70')}, 0.5 * smoothstep(${f3(Z1 - 0.012)}, ${f3(Z1 - 0.002)}, q.y));          // (a thread of light along its front edge)
    } else if (sub == 1) {
      float h = (${f3(TH)} - vOP.y) / ${f3(TH)};
      c = mix(${C('#3f3a29')}, ${C('#26231a')}, 0.75 * smoothstep(0.0, 1.0, h) + 0.25 * cloud);
      c *= 0.92 + 0.16 * mN(vec2(vOP.x * 2.4, vOP.y * 60.0));
      c = mix(c, ${C('#958d70')}, 0.5 * smoothstep(0.06, 0.0, h));
      // his name, where he wrote it, on the front edge at the right: the picture's own strokes, read from the picture
      vec2 sg = vec2((vOP.x - ${f3(SIG[0])}) / ${f3(SIG[1])}, (${f3(TH - SIG[2])} - vOP.y) / ${f3(SIG[1] / 10.6)});
      if (uSig > 0.0 && sg.x > 0.0 && sg.x < 1.0 && sg.y > 0.0 && sg.y < 1.0) {
        float lum = dot(texture2D(uArt, vec2(mix(0.628, 0.965, sg.x), 1.0 - mix(0.9455, 0.99, sg.y))).rgb, vec3(0.3, 0.6, 0.1));
        c = mix(c, c * 0.08, 0.92 * uSig * smoothstep(0.03, 0.009, lum) * smoothstep(0.0, 0.04, sg.x) * smoothstep(1.0, 0.96, sg.x));
      }
    } else c = ${C('#2b281d')} * (0.75 + 0.4 * cloud) * (N.x < 0.0 ? 1.3 : 0.75);
  } else if (kind == ${K_PORC}) {
    // porcelain: a white that is all greys. Warm where the light is, a grey-olive shade turning away from it, darkest
    // just past the turn, and the shelf's light coming back up into the shadow; then the glaze's one wet light
    float ph = vUv2.x * 6.2832, tv = vUv2.y;
    float brush = mN(vec2(ph * 6.0, vOP.y * 64.0)), mott = mN(vec2(ph * 2.3 + 4.0, vOP.y * 11.0 + vOP.x * 5.0)), blot = mN(vec2(ph * 0.9 + 1.0, vOP.y * 3.0));
    float tone = nl + 0.2 * (mott - 0.5) + 0.07 * (brush - 0.5);
    c = mix(${C('#3f3c2e')}, ${C('#8f8b79')}, smoothstep(-0.3, 0.3, tone)); c = mix(c, ${C('#d5d0bd')}, smoothstep(0.25, 0.9, tone));
    c *= 1.0 - 0.22 * smoothstep(0.2, -0.05, tone) * smoothstep(-0.5, -0.15, tone);
    c = mix(c, ${C('#6c6649')}, 0.5 * smoothstep(-0.3, -0.85, nl) + 0.3 * max(-N.y, 0.0) * smoothstep(0.3, -0.2, tone));
    c *= 0.93 + 0.14 * blot;
    float glaze = 1.0, lit = smoothstep(-0.3, 0.8, tone);
    if (sub == 0) {
      c = mix(c, ${C('#5f4226')} * (0.45 + 0.7 * lit), 0.75 * smoothstep(0.972, 0.99, tv));                // the bowl: a brown thread round its rim
      c *= mix(0.55, 1.0, smoothstep(0.0, 0.35, tv)) * mix(0.82, 1.0, smoothstep(0.5, 1.0, tv));
    } else if (sub == 1) {
      c = mix(c, ${C('#5f4226')} * (0.45 + 0.7 * lit), 0.75 * smoothstep(0.035, 0.01, tv));
      c *= mix(1.0, 0.45, smoothstep(0.05, 0.6, tv));
    } else if (sub == 2) {
      // a saucer's face: the dark blue-green border he gave the top two, a pale thread inside it
      float band = smoothstep(0.03, 0.06, tv) * smoothstep(0.36, 0.31, tv);
      c = mix(c, ${C('#172e38')} * (0.4 + 0.8 * lit), 0.92 * band);
      c = mix(c, ${C('#74908f')} * (0.5 + 0.6 * lit), 0.6 * smoothstep(0.012, 0.0, abs(tv - 0.2)) + 0.5 * smoothstep(0.01, 0.0, abs(tv - 0.41)));
      c *= mix(1.0, 0.45, smoothstep(0.4, 0.75, tv));
    } else if (sub == 3) {
      c *= mix(0.55, 1.0, smoothstep(0.0, 0.5, tv));
    } else if (sub == 4) {
      // the cup: a gold-orange band under its lip, a green line, a row of dots; and the round picture on its front
      float y = vOP.y - ${f3(TH + CUP_Y)};
      float band = smoothstep(0.207, 0.211, y) * smoothstep(0.231, 0.227, y);
      c = mix(c, mix(${C('#6e4614')}, ${C('#c08a32')}, lit), 0.9 * band);
      c = mix(c, ${C('#46703a')} * (0.45 + 0.7 * lit), 0.9 * smoothstep(0.0032, 0.0014, abs(y - 0.2025)));
      c = mix(c, ${C('#3e301c')}, 0.7 * smoothstep(0.34, 0.16, length(vec2(fract(ph * 9.5) - 0.5, (y - 0.192) * 160.0))));
      float uu = vUv2.x > 0.5 ? vUv2.x - 1.0 : vUv2.x; vec2 m = vec2(uu * 6.2832 * 0.104, y - 0.112) / 0.064;
      float rr = length(m);
      if (rr < 1.0) { vec3 mc = texture2D(uMed, m * 0.47 + 0.5).rgb; c = mix(c, mc * (0.26 + 0.6 * lit), 0.94); }
      c *= mix(0.65, 1.0, smoothstep(0.0, 0.07, y));
    } else if (sub == 5) {
      c *= mix(1.0, 0.4, smoothstep(0.05, 0.5, tv)); glaze = 0.4;
    } else if (sub == 6) {
      // the jug: two turned threads round its body, and its foot fluted
      float y = vOP.y - ${f3(TH)};
      c *= 1.0 - 0.24 * smoothstep(0.005, 0.0015, abs(y - 0.212)) - 0.22 * smoothstep(0.005, 0.0015, abs(y - 0.262));
      c *= 1.0 + 0.1 * smoothstep(0.006, 0.002, abs(y - 0.219)) + 0.1 * smoothstep(0.006, 0.002, abs(y - 0.269));
      c *= 1.0 - 0.2 * smoothstep(0.1, 0.07, y) * (0.5 + 0.5 * cos(ph * 22.0));
      c = mix(c, mix(${C('#6e4614')}, ${C('#c08a32')}, lit), 0.85 * smoothstep(0.985, 0.995, tv));
      c *= mix(0.6, 1.0, smoothstep(0.0, 0.06, y));
    } else if (sub == 7) {
      // inside its lip: the gold band, the green line under it, the dots; below that it is in its own shade
      float d = 1.0 - tv;
      c *= mix(1.0, 0.45, smoothstep(0.05, 0.45, d));
      c = mix(c, mix(${C('#6a4212')}, ${C('#c9912f')}, lit), 0.92 * smoothstep(0.004, 0.01, d) * smoothstep(0.058, 0.052, d));
      c = mix(c, ${C('#46703a')} * (0.45 + 0.7 * lit), 0.9 * smoothstep(0.005, 0.0025, abs(d - 0.068)));
      c = mix(c, ${C('#3e301c')}, 0.7 * smoothstep(0.34, 0.16, length(vec2(fract(ph * 13.0) - 0.5, (d - 0.088) * 70.0))));
      glaze = 0.5;
    }
    if (sub == 4 || sub == 8) c = mix(c, ${C('#8a3a22')}, 0.2 * max(dot(N, vec3(0.82, 0.25, -0.5)), 0.0) * smoothstep(0.5, -0.1, tone));
    if (sub == 6) c = mix(c, ${C('#7a5a30')}, 0.22 * max(dot(N, vec3(-0.6, -0.2, 0.77)), 0.0) * smoothstep(${f3(TH + 0.26)}, ${f3(TH + 0.08)}, vOP.y));
    float sp = pow(max(dot(N, Hh), 0.0), 80.0);
    c = mix(c, ${C('#fbf7ea', 0)}, glaze * 0.85 * smoothstep(0.3, 0.9, sp * (0.7 + 0.6 * brush)));
    c *= 0.95 + 0.1 * brush;
  } else if (kind == ${K_BERRY}) {
    // the strawberries: no one of them is modelled; the heap is, and they are painted on it one by one, each with
    // its own light, its seeds, here and there its green cap, and the dark between them
    vec3 ax = vOP - vec3(${f3(URN[0])}, 0.0, ${f3(URN[1])}); float ph = atan(ax.x, ax.z);
    vec3 Tn = sub == 0 ? vec3(cos(ph), 0.0, -sin(ph)) : vec3(1.0, 0.0, 0.0), Bt = sub == 0 ? vec3(0.0, 1.0, 0.0) : vec3(0.0, 0.0, -1.0);
    vec2 pp = sub == 0 ? vec2(ph * 0.19, ax.y) / 0.031 : ax.xz / 0.031;
    vec4 s1 = strawberry(pp, Tn, Bt, N, Lk, Hh, nl), s0 = strawberry(pp * 1.07 + 13.7, Tn, Bt, N, Lk, Hh, nl);
    c = mix(${C('#1c0504')}, s0.rgb * 0.34, s0.a); c = mix(c, s1.rgb, s1.a);
    // the heap as a whole turns from the light, and is dimmer low in the glass
    c *= mix(0.3, 1.0, smoothstep(-0.6, 0.45, nl)) * mix(0.55, 1.0, smoothstep(${f3(TH + 0.27)}, ${f3(TH + 0.5)}, vOP.y));
    c *= 1.0 + 0.55 * uPulse; key *= 1.08;
  } else if (kind == ${K_HAZEL}) {
    float st = mN(vec2(vUv2.x * 26.0 + var * 9.0, vUv2.y * 3.0)), bl = mN(vUv2 * vec2(5.0, 4.0) + var * 20.0);
    vec3 base = mix(${C('#4a1f0c')}, ${C('#733a16')}, var); base = mix(base, ${C('#34150a')}, 0.5 * smoothstep(0.5, 0.75, st));
    float tone = nl + 0.2 * (bl - 0.5);
    c = mix(${C('#140703')}, base, smoothstep(-0.55, 0.2, tone)); c = mix(c, mix(${C('#96541f')}, ${C('#b97a34')}, var), 0.8 * smoothstep(0.25, 0.95, tone));
    float scar = smoothstep(0.2, 0.13, vUv2.y + 0.06 * (mN(vec2(vUv2.x * 9.0, var * 5.0)) - 0.5));
    c = mix(c, mix(${C('#2b2317')}, ${C('#8d7954')}, smoothstep(-0.3, 0.8, tone)) * (0.85 + 0.3 * mN(vUv2 * 40.0)), scar);
    float sp = pow(max(dot(N, Hh), 0.0), 150.0); c = mix(c, ${C('#e6c08a', 0)}, (0.25 + 0.5 * var) * smoothstep(0.3, 0.9, sp * (0.6 + 0.8 * bl)) * (1.0 - scar));
    c = mix(c, ${C('#b97a34')}, 0.25 * pow(max(dot(N, Hh), 0.0), 12.0) * (1.0 - scar));
    c += ${C('#4a2a10')} * 0.16 * max(-N.y, 0.0);
  } else if (kind == ${K_ALMOND}) {
    float pit = mN(vUv2 * vec2(44.0, 30.0) + var * 7.0), grain = mN(vec2(vUv2.x * 6.0, vUv2.y * 46.0)), bl = mN(vUv2 * vec2(4.0, 3.0) + var * 20.0);
    vec3 base = mix(${C('#8f6226')}, ${C('#b3843a')}, var); base = mix(base, ${C('#63431a')}, 0.55 * smoothstep(0.58, 0.8, pit)); base *= 0.9 + 0.2 * grain;
    float tone = nl + 0.2 * (bl - 0.5) + 0.1 * (grain - 0.5);
    c = mix(${C('#281707')}, base, smoothstep(-0.5, 0.3, tone)); c = mix(c, ${C('#d9b560')}, 0.6 * smoothstep(0.35, 1.0, tone));
    c = mix(c, ${C('#3a250b')}, 0.65 * smoothstep(0.03, 0.008, abs(fract(vUv2.x + 0.25) - 0.5)));
    c += ${C('#4a2a10')} * 0.2 * max(-N.y, 0.0);
  } else if (kind == ${K_ORANGE}) {
    float pore = mN(vUv2 * vec2(150.0, 95.0)), blot = mN(vUv2 * vec2(7.0, 5.0) + 2.0), bl2 = mN(vUv2 * vec2(19.0, 13.0) + 7.0);
    float tone = nl + 0.18 * (blot - 0.5) + 0.09 * (bl2 - 0.5);
    vec3 skin = mix(${C('#d5a222', 0.03)}, ${C('#e9c23a', 0.03)}, 0.25 + 0.75 * blot);
    c = mix(${C('#33200a')}, ${C('#855a13')}, smoothstep(-0.7, -0.12, tone)); c = mix(c, ${C('#c08c1c', 0.03)}, smoothstep(-0.2, 0.2, tone)); c = mix(c, skin, smoothstep(0.1, 0.6, tone)); c = mix(c, ${C('#f3d85e', 0.03)}, 0.6 * smoothstep(0.55, 1.0, tone));
    float sp = pow(max(dot(N, Hh), 0.0), 18.0); c = mix(c, ${C('#fdf3c0', 0)}, 0.5 * smoothstep(0.4, 0.95, sp * (0.5 + 1.0 * pore)));
    c = mix(c, ${C('#7a4a18')}, 0.35 * max(-N.y, 0.0) * smoothstep(0.2, -0.4, tone));
    c *= 1.0 - 0.14 * smoothstep(0.6, 0.82, pore);
    c = mix(c, ${C('#3c3a16')}, 0.8 * smoothstep(0.984, 0.996, vUv2.y));       // (where the stalk leaves it)
  } else if (kind == ${K_LEAF}) {
    float ac = vUv2.x, al = vUv2.y; bool top = gl_FrontFacing;
    float rib = smoothstep(0.08, 0.02, abs(ac)), vein = smoothstep(0.3, 0.05, abs(fract(al * 7.0 - abs(ac) * 2.2) - 0.5)) * smoothstep(0.08, 0.3, abs(ac));
    float tone = nl + 0.15 * (mN(vUv2 * vec2(3.0, 9.0)) - 0.5);
    vec3 g0 = mix(${C('#0f1f0a')}, mix(${C('#24451a')}, ${C('#3f6f28')}, var), smoothstep(-0.4, 0.3, tone)); g0 = mix(g0, mix(${C('#3a6226')}, ${C('#7ea23e')}, var), smoothstep(0.3, 0.95, tone));
    if (!top) g0 = mix(${C('#1c2a15')}, ${C('#5f7d42')}, smoothstep(-0.3, 0.8, tone));
    g0 *= mix(0.7, 1.0, smoothstep(1.0, 0.55, abs(ac))) * mix(0.75, 1.0, smoothstep(0.0, 0.3, al)) * (0.9 + 0.2 * mN(vUv2 * vec2(6.0, 22.0)));
    g0 = mix(g0, g0 * ${C('#b9a760', 0)} * 2.2, 0.3 * smoothstep(0.45, 0.8, mN(vUv2 * vec2(2.5, 5.0) + 4.0)));
    c = mix(g0, mix(g0, ${C('#a9c26c')}, 0.5), 0.75 * rib * (top ? 1.0 : 0.6)); c = mix(c, c * 1.3, 0.22 * vein);
    if (top) c = mix(c, ${C('#d5e2a8', 0)}, 0.3 * smoothstep(0.45, 0.95, pow(max(dot(N, Hh), 0.0), 14.0)) * (0.6 + 0.8 * mN(vUv2 * vec2(4.0, 30.0))));
  } else if (kind == ${K_RAISIN}) {
    float wr = abs(mN(vUv2 * vec2(9.0, 5.0) + var * 11.0) * 2.0 - 1.0), wr2 = abs(mN(vUv2 * vec2(21.0, 13.0) + 3.0) * 2.0 - 1.0);
    float crease = 0.7 * smoothstep(0.22, 0.02, wr) + 0.35 * smoothstep(0.15, 0.0, wr2);
    float tone = nl + 0.3 * (wr - 0.4);
    vec3 base = mix(${C('#30120c')}, ${C('#582418')}, var);
    c = mix(${C('#120504')}, base, smoothstep(-0.5, 0.3, tone)); c = mix(c, mix(${C('#7d4636')}, ${C('#9c6452')}, var), 0.5 * smoothstep(0.35, 1.0, tone) * (1.0 - crease));
    c *= 1.0 - 0.55 * crease;
    c += ${C('#3a1810')} * 0.18 * max(-N.y, 0.0);
  } else if (kind == ${K_STEM}) {
    c = mix(${C('#2a1c0d')}, ${C('#8f7444')}, smoothstep(-0.3, 0.8, nl));
  } else {
    // (what the nuts lie on is more nuts, in the dark between them)
    vec4 b = berry(vOP.xz / 0.046 + 3.1); float rr = length(b.xy) / 0.46;
    vec3 nut = mix(${C('#4a2410')}, ${C('#7a5524')}, step(${f3(BOWL[0] + 0.02)}, vOP.x));
    c = mix(${C('#120904')}, nut * (0.45 + 0.75 * smoothstep(0.3, -0.5, b.x + b.y)), (1.0 - smoothstep(0.75, 1.0, rr)) * 0.75);
    c *= 0.55 + 0.6 * smoothstep(-0.3, 0.6, nl);
  }
  // when the glass rings, the red in it comes up, and reaches whatever stands near
  if (kind != ${K_BERRY}) {
    vec3 to = vec3(${f3(URN[0])}, ${f3(TH + 0.42)}, ${f3(URN[1])}) - vOP; float dd = dot(to, to);
    c += ${C('#d8451e', 0)} * (0.3 + c.g) * uPulse * 0.22 * max(dot(N, normalize(to)), 0.0) / (1.0 + 9.0 * dd);
  }
  outgoingLight = c * key * mix(0.035, 1.0, uLight);
}
#include <opaque_fragment>`);
    };
    tm.customProgramCacheKey = () => 'peale-table';
    this.things = new THREE.Mesh(merge(parts), tm); this.things.name = 'shelf-china-fruit-nuts';
    this.tris = this.things.geometry.attributes.position.count / 3;
    this.things.matrixAutoUpdate = false; this.things.matrix.copy(this.B); this.things.matrixWorldNeedsUpdate = true;
    L.add(this.things);

    // ------------------------------------------------------------ his dark behind it, the shade on the boards, the glass, and the rings
    const soft = [];
    // (his dark is laid over the floor, the skirting and the wall, as far as the room goes, and no further)
    const R = L.room; let left = 3.9, right = 3.9, deep = 4.0, up = 4.4;
    if (R) {
      const a = Math.abs(L.tx) > 0.5 ? [(R.x0 - L.cx) * L.tx, (R.x1 - L.cx) * L.tx] : [(R.z0 - L.cz) * L.tz, (R.z1 - L.cz) * L.tz];
      left = Math.min(left, -Math.min(a[0], a[1]) - 0.08); right = Math.min(right, Math.max(a[0], a[1]) - 0.08);
      deep = Math.min(deep, (Math.abs(L.nx) > 0.5 ? Math.max((R.x0 - L.cx) * L.nx, (R.x1 - L.cx) * L.nx) : Math.max((R.z0 - L.cz) * L.nz, (R.z1 - L.cz) * L.nz)) - 0.05);
      up = Math.min(up, (R.ceil || R.h || 4) - 0.25);
    }
    soft.push(surf(1, 1, (uu, vv, o) => o.p.set(lerp(-left, right, uu), 0.013, lerp(deep, -wall + 0.01, vv)), P_FLOOR));
    soft.push(surf(1, 1, (uu, vv, o) => o.p.set(lerp(-left, right, uu), lerp(0.012, up, vv), -wall + 0.006), P_DARK));
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
    {
      const m = at(URN[0], TH, URN[1]);
      // the urn: a foot, a stem drawn up out of it, the great bowl, a thread of a rim (color: how much of the window
      // it may give back, how much it is the berries' glass, how solid it is)
      const body = (v, ph, o) => { o.c.setRGB(0.35, sstep(0.3, 0.42, v), 1 - sstep(0.22, 0.34, v)); };
      soft.push(place(turned([[0.001, 0.007], [0.06, 0.007], [0.09, 0.004], [0.099, 0.0], [0.1, 0.007], [0.075, 0.016], [0.04, 0.03], [0.026, 0.06], [0.023, 0.105], [0.027, 0.155], [0.042, 0.205], [0.072, 0.238], [0.112, 0.268], [0.15, 0.312], [0.18, 0.372], [0.196, 0.44], [0.202, 0.52], [0.203, 0.6], [0.2075, 0.615], [0.2045, RIM]], 56, 44, P_GLASS, 0, 0, body), m));
      // its lid: a flat flange, a quick shoulder, a low dome; and the clear ball it is lifted by
      soft.push(place(turned([[0.2, 0.0], [0.214, 0.001], [0.217, 0.005], [0.212, 0.009], [0.196, 0.0095], [0.186, 0.012], [0.178, 0.026], [0.162, 0.041], [0.13, 0.054], [0.085, 0.063], [0.04, 0.068], [0.016, 0.074], [0.011, 0.082]], 56, 24, P_LID, 0, 0, (v, ph, o) => o.c.setRGB(1, 0.5, 0)), at(URN[0], TH + RIM, URN[1])));
      soft.push(place(turned([[0.011, 0.082], [0.021, 0.086], [0.031, 0.1], [0.034, 0.116], [0.03, 0.133], [0.018, 0.146], [0.001, 0.15]], 28, 14, P_LID, 0, 1, (v, ph, o) => o.c.setRGB(1, 0, 0.6)), at(URN[0], TH + RIM, URN[1])));
    }
    // (where each of them rings: a level sheet at its rim, the rings drawn on it)
    const sheet = (x, z, y, h, part) => surf(1, 1, (uu, vv, o) => { o.p.set(x + (uu * 2 - 1) * h, y, z + (1 - vv * 2) * h); o.t.set((uu * 2 - 1) * h, (1 - vv * 2) * h); }, part);
    soft.push(sheet(URN[0], URN[1], TH + RIM + 0.012, 0.62, P_RING));
    soft.push(sheet(BOWL[0], BOWL[1], TH + BOWL_RIM + 0.004, 0.56, P_RING + 1));
    soft.push(sheet(CUP[0], CUP[1], TH + CUP_Y + 0.24, 0.3, P_RING + 2));
    soft.push(sheet(JUG[0], JUG[1], TH + 0.365, 0.32, P_RING + 3));
    const gu = this.gu = {
      uInv: u.uInv, uSlide: u.uSlide, uLight: u.uLight, uWall: u.uWall, uT: u.uT, uLid: { value: new THREE.Matrix4() }, uDk: { value: 0 }, uShim: { value: 0 }, uOut: { value: 0 },
      uRing: { value: [0, 1, 2, 3].map(() => new THREE.Vector4(-1, 0, 0, 0)) }, uLabel: { value: labels },
    };
    const gm = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide, forceSinglePass: true,
      blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor });
    gm.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, gu);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', `#include <common>
attribute vec3 aK; attribute vec2 aUv; uniform mat4 uLid; uniform float uSlide;
varying vec3 vOP, vLP, vN; varying vec2 vUv2; varying float vPart;`)
        .replace('#include <begin_vertex>', `vec3 transformed = vec3(position); vec3 ln = normal;
  if (aK.x > 0.5 && aK.x < 1.5) { transformed = (uLid * vec4(position, 1.0)).xyz; ln = mat3(uLid) * normal; }
  if (aK.x < 1.5 || aK.x > 3.5) transformed.z += uSlide;
  vPart = aK.x; vUv2 = aUv; vOP = position; vLP = transformed; vN = ln;`);
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
uniform mat4 uInv; uniform float uLight, uWall, uT, uDk, uShim, uOut, uSlide; uniform vec4 uRing[4]; uniform vec4 uLabel[6];
varying vec3 vOP, vLP, vN; varying vec2 vUv2; varying float vPart;${NOISE}
vec3 gCol, gAdd; float gA;`)
        .replace('#include <color_fragment>', `#include <color_fragment>
  gAdd = vec3(0.0); gCol = vec3(0.0); gA = 0.0;
  int part = int(vPart + 0.5);
  if (part <= ${P_LID}) {
    // glass. He painted it as almost nothing: a hair of light where it turns away from you, a breath of dark through
    // its thickness, and two touches of white, which are his window
    if (vLP.z < -uWall) discard;
    vec3 eye = (uInv * vec4(cameraPosition, 1.0)).xyz, Vd = normalize(eye - vLP), N = normalize(vN); if (dot(N, Vd) < 0.0) N = -N;
    float nv = dot(N, Vd), rim = pow(1.0 - nv, 2.2), solid = diffuseColor.b, red = diffuseColor.g, win = diffuseColor.r;
    float shim = 1.0 + uShim * 0.6 * sin(uT * 61.0 + vOP.y * 140.0);
    gA = 0.03 + 0.3 * rim + 0.22 * solid * (0.4 + 0.6 * rim); gCol = ${C('#0d0c0a')};
    vec3 hair = mix(${C('#b9bdb6')}, ${C('#8a4a34')}, 0.5 * red);
    gAdd = hair * (0.3 * smoothstep(0.55, 0.97, rim) * shim * (part == ${P_LID} ? 0.55 : 1.0) + 0.06 * solid);
    // (the stem is solid: it holds a long grey light down its left, and the shelf's below; the bowl a breath of one)
    vec3 Lh = normalize(vec3(${f3(SUN.x)}, 0.0, ${f3(SUN.z)})); float side = pow(max(dot(N, normalize(Lh + vec3(Vd.x, 0.0, Vd.z))), 0.0), 26.0);
    gAdd += ${C('#aeb2aa')} * (solid * (0.5 * side + 0.1 * max(-N.y, 0.0)) + 0.07 * (1.0 - solid) * side * (0.6 + 0.8 * mN(vec2(vOP.y * 30.0, 2.0))));
    // his window, given back: wherever the glass is turned so as to show it to you
    vec3 r = reflect(-Vd, N), W = ${v3g(WIN)}, Wu = normalize(cross(vec3(0.0, 1.0, 0.0), W)), Wv = cross(W, Wu); float rw = dot(r, W);
    if (rw > 0.0) {
      vec2 ab = vec2(dot(r, Wu), dot(r, Wv)) / rw + 0.022 * (vec2(mN(vOP.xy * 260.0 + vOP.z * 170.0), mN(vOP.zy * 260.0 + 9.0)) - 0.5);
      float fleck = (1.0 - smoothstep(0.15, 0.175, abs(ab.x))) * (1.0 - smoothstep(0.22, 0.25, abs(ab.y)));
      gAdd += ${C('#fffdf3', 0)} * 1.6 * fleck * win * shim; gA = max(gA, 0.95 * fleck * win);
    }
    gAdd *= uLight * (0.06 + 0.94 * uLight); gA *= uLight;
  } else if (part == ${P_DARK}) {
    // his ground: near black at the left, and on the right the dull olive light he let in behind the jug; it is a
    // depth of shade laid on the wall under the picture, broken at its edge, and it stops well below the frame
    float x = vOP.x, y = vOP.y, n1 = mN(vec2(x, y) * 1.7) - 0.5, n2 = mN(vec2(x * 13.0, y * 8.0));
    float d = length(vec2(x / 3.5, (y - 0.6) / (y > 0.6 ? 3.6 : 1.6))), sh = 1.0 - smoothstep(0.25, 1.0, d + 0.05 * n1);
    float halo = 1.0;
    for (int i = 0; i < 6; i++) { vec2 lq = abs(vec2(x, y) - uLabel[i].xy) - uLabel[i].zw; halo *= mix(0.12, 1.0, smoothstep(0.0, 0.05, max(lq.x, lq.y))); }
    gA = 1.0 - exp(-7.0 * uDk * halo * sh * sh * sh * sh * (vOP.z > 0.0 ? 1.0 - smoothstep(0.14, 0.44, y) : 1.0));
    // (the dull olive light he let in behind the jug, on the right)
    float warm = smoothstep(-0.2, 0.7, x + 0.4 * (y - 0.5) + 0.2 * n1) * smoothstep(1.7, 0.7, x) * smoothstep(1.5, 0.7, y);
    gCol = mix(${C('#0d0b08')}, ${C('#342d1a')}, 0.85 * warm * uLight) * (0.8 + 0.4 * n2);
  } else if (part == ${P_FLOOR}) {
    // the floor goes down into the same dark, deepest at the wall's foot; and in it the shade the shelf stands in:
    // close round it, longer to the right, away from the light
    float n1 = mN(vOP.xz * 1.9 + 5.0) - 0.5;
    float foot = 1.0 - smoothstep(0.2, 1.0, length(vec2(vOP.x / 3.3, max(vOP.z, 0.0) / 3.1)) + 0.14 * n1);
    float dusk = 1.0 - exp(-5.0 * uDk * foot * foot * foot);
    vec2 q = vec2(vOP.x - 0.07, vOP.z);
    vec2 e = abs(q - vec2(0.0, ${f3((Z1 - wall) / 2)} + uSlide)) - vec2(${f3(SX)}, ${f3((Z1 + wall) / 2)});      // (it comes out with the shelf)
    float dist = length(max(e, 0.0)) + min(max(e.x, e.y), 0.0);
    float shade = 0.7 * (1.0 - smoothstep(-0.02, 0.26, dist)) * uOut;
    gA = 1.0 - (1.0 - dusk) * (1.0 - shade); gCol = ${C('#0b0a07')};
  } else {
    // a ring: what a struck rim does to the air, drawn as a hair of light that widens and is gone
    if (vLP.z < -uWall) discard;
    vec4 R = uRing[part - ${P_RING}]; float age = R.x; if (age < 0.0 || R.y < 0.002) discard;
    float rr = length(vUv2), grow = 1.0 - exp(-age * 1.15);
    float w = 0.0035 + 0.012 * grow;
    float line = exp(-sq((rr - R.z - R.w * grow) / w));
    float age2 = age - 0.22, g2 = 1.0 - exp(-max(age2, 0.0) * 1.15); line += 0.55 * step(0.0, age2) * exp(-sq((rr - R.z - R.w * g2) / w));
    gAdd = mix(${C('#e9efe6', 0)}, ${C('#f1dcc0', 0)}, step(${P_RING + 0.5}, vPart)) * line * R.y * exp(-age * 1.45) * uLight;
  }`)
        .replace('#include <opaque_fragment>', '  outgoingLight = gCol * gA + gAdd; diffuseColor.a = gA;\n#include <opaque_fragment>');
    };
    gm.customProgramCacheKey = () => 'peale-glass';
    this.soft = new THREE.Mesh(merge(soft), gm); this.soft.name = 'dark-shade-glass-rings';
    this.tris += this.soft.geometry.attributes.position.count / 3;
    this.soft.matrixAutoUpdate = false; this.soft.matrix.copy(this.B); this.soft.matrixWorldNeedsUpdate = true; this.soft.renderOrder = 9;
    L.add(this.soft);

    // ------------------------------------------------------------ the sounds, on the show's clock
    const s = this.sc = score(L);
    s.hit(T_OUT[0] + 0.05, { d: T_OUT[1] - T_OUT[0], vol: 0.016, lp: 260, attack: 0.35 });                         // the shelf, coming out
    s.note(T_OUT[1] - 0.04, 92, 0.2, { type: 'sine', vol: 0.035, to: 58, attack: 0.006 });
    for (const e of this.lift(T_CLINK - FIRST.down - FIRST.hang - FIRST.up)) this.sched(s, e);
    for (const e of this.chime(1)) this.sched(s, { ...e, t: T_CLINK + e.t });
    s.loop(T_CLINK + PERIOD - 1.6, PERIOD, [...this.lift(1.6 - LATER.down - LATER.hang - LATER.up), ...this.chime(0.6).map(e => ({ ...e, t: e.t + 1.6 }))]);
    s.done();

    this.lin = 0; this.at = 0; this.cap = Infinity; this.toyT = -99; this.toyK = 0; this.rattle = 0; this.tick = 0; this.hold = null; this.hide();
  },

  // ---------------------------------------------------------------- what it sounds like
  // The lid leaving the rim: a tick, and the faintest high note.
  lift(t) { return [{ t, noise: true, d: 0.02, vol: 0.007, hp: 5200 }, { t: t + 0.02, f: 2637, d: 0.8, vol: 0.004, type: 'sine', attack: 0.25 }]; },
  // The lid coming down, and the table's answer: the glass (clear, long, a little rough at first, two notes a hair
  // apart so that it shimmers), then the bowl's hum and the nuts shifting in it, the cup, the three saucers, the jug.
  // Each has its own note, and together they are one chord (E). k: how hard.
  chime(k) {
    const ev = [
      { t: 0, noise: true, d: 0.03, vol: 0.022 * k, hp: 3400 }, { t: 0.092, noise: true, d: 0.02, vol: 0.008 * k, hp: 4200 },
      { t: 0, f: 1318.5, d: 3.6, vol: 0.045 * k, type: 'sine', attack: 0.005 }, { t: 0, f: 1322.6, d: 3.1, vol: 0.026 * k, type: 'sine', attack: 0.005 },
      { t: 0, f: 3058, d: 1.0, vol: 0.013 * k, type: 'sine', attack: 0.004 }, { t: 0, f: 5603, d: 0.3, vol: 0.005 * k, type: 'sine', attack: 0.003 },
      { t: AFTER.bowl, f: 329.6, d: 2.6, vol: 0.036 * k, type: 'sine', attack: 0.05 }, { t: AFTER.bowl, f: 892, d: 0.8, vol: 0.007 * k, type: 'sine', attack: 0.02 },
      { t: AFTER.cup, f: 987.8, d: 1.4, vol: 0.026 * k, type: 'sine', attack: 0.005 }, { t: AFTER.cup, f: 2667, d: 0.4, vol: 0.006 * k, type: 'sine', attack: 0.004 },
      { t: AFTER.sauc, f: 1661.2, d: 0.5, vol: 0.01 * k, type: 'sine', attack: 0.004 },
      { t: AFTER.jug, f: 830.6, d: 1.8, vol: 0.027 * k, type: 'sine', attack: 0.007 }, { t: AFTER.jug, f: 2242, d: 0.5, vol: 0.005 * k, type: 'sine', attack: 0.005 },
    ];
    for (const [dt, v] of [[0, 1], [0.07, 0.7], [0.16, 0.45]]) ev.push({ t: AFTER.sauc + dt, noise: true, d: 0.03, vol: 0.011 * k * v, hp: 4200 });
    for (const [dt, v] of [[0.02, 1], [0.1, 0.8], [0.17, 0.9], [0.27, 0.6], [0.4, 0.5], [0.56, 0.35], [0.78, 0.22]]) ev.push({ t: AFTER.bowl + dt, noise: true, d: 0.035, vol: 0.009 * k * v, bp: 2100 + 500 * v, q: 2.2 });
    return ev;
  },
  sched(s, e) { if (e.noise) s.hit(e.t, e); else s.note(e.t, e.f, e.d, e); },
  // (the same, struck by the toy: now, not on the clock)
  strike(L, k) {
    if (L.quiet) return; const v = L.voice();
    for (const e of this.chime(k)) { if (e.noise) noise(v, e.t + HOP, e); else v.note(e.f, e.d, { at: e.t + HOP, vol: e.vol, type: e.type, attack: e.attack }); }
  },

  // ---------------------------------------------------------------- the lid, by the show's clock
  // At clock t: how high it is held over the rim (o.y), and when it last came down, and how hard (o.last, o.k).
  lidAt(t, o) {
    const n = t < T_CLINK ? 0 : Math.floor((t - T_CLINK) / PERIOD) + 1, Tn = T_CLINK + n * PERIOD, c = n ? LATER : FIRST, t0 = Tn - c.down - c.hang - c.up;
    let y = 0;
    if (t >= t0) {
      if (t < t0 + c.up) y = c.h * ease.inOut((t - t0) / c.up);
      else if (t < Tn - c.down) y = c.h * (1 + 0.035 * Math.sin((t - t0 - c.up) * 5.2));
      else { const q = (t - (Tn - c.down)) / c.down; y = c.h * (1 - q * q); }
    }
    const since = n ? t - (Tn - PERIOD) : 9;
    if (since < 0.3) y += 0.007 * Math.exp(-since * 16) * Math.abs(Math.sin(since * 34));      // (it touches twice)
    o.y = y; o.last = n ? Tn - PERIOD : -99; o.k = n > 1 ? 0.6 : 1;
    return o;
  },

  hide() { this.things.visible = false; this.soft.visible = false; },
  start(L, resumed) {
    this.lin = resumed ? this.at - L.t : 0; this.cap = Infinity; this.sc.from(resumed ? this.at : 0);
    if (!resumed) { this.toyT = -99; this.rattle = 0; this.tick = 0; }
  },
  back(L) { const u = this.u; this.hold = { light: u.uLight.value, lid: this.lidY || 0, slide: u.uSlide.value, dk: this.gu.uDk.value, out: this.gu.uOut.value }; },
  end() { this.hide(); },
  reset() { this.hide(); this.lin = this.at = 0; this.cap = Infinity; this.toyT = -99; this.rattle = 0; },

  update(L, dt) {
    const ph = L.phase, showing = ph === 'wake' || ph === 'play', linger = ph === 'linger', back = ph === 'return';
    if (!showing && !linger && !back) { this.hide(); return; }
    const calm = L.calm, V = this.V, u = this.u, gu = this.gu, soft = calm ? 0.5 : 1;
    if (linger) this.lin += dt;
    const t = this.at = L.t + this.lin;
    const voice = L.voice(); voice.level = calm ? 0.55 : 1; voice.place();
    this.things.visible = true; this.soft.visible = true;
    const far = -(Z1 + this.wall + 0.06), lo = this.lo || (this.lo = {});
    u.uT.value = t;
    // (his name is read from the picture as it hangs: only when the picture itself, not its small stand-in, is there)
    { const tex = L.art.tex, ok = !!(tex && tex.image && tex.image.width >= 700); u.uArt.value = ok ? tex : this.med; u.uSig.value = ok ? 1 : 0; }

    // ---- the lid on the clock (while the toy has the table, the clock's own lifts stop once the one under way is done)
    if (linger && this.cap === Infinity) { this.lidAt(t, lo); this.cap = lo.y > 0 ? T_CLINK + Math.ceil((t - T_CLINK) / PERIOD) * PERIOD + 0.01 : t; }
    const tc = Math.min(t, this.cap);
    if (!back) this.sc.play(tc);
    if (showing && !TOLD && !L.quiet && t > T_CLINK + 0.25) { TOLD = true; L.k.say('The glass lid comes down on its urn, and everything on the shelf rings.', 4); }
    this.lidAt(tc, lo);
    let lidY = lo.y, last = lo.last, hard = lo.k;

    // ---- the toy's turn: it rattles the table going by, and rings it by driving into the shelf
    if (linger) {
      const G = L.k.G, v = G.vehicle, q = L.local(v.pos.x, v.pos.z), sp = Math.hypot(v.vel.x, v.vel.z);
      const dx = Math.max(0, Math.abs(q.u) - SX), dz = Math.max(0, q.out - Z1), d = Math.hypot(dx, dz);
      const want = clamp01(sp * 0.45) * sstep(1.3, 0.15, d);
      this.rattle += (want - this.rattle) * Math.min(1, dt * 6);
      if (d < 0.2 && sp > 0.25 && t - this.toyT > 1.5 && t - last > 1.5) { this.toyT = t; this.toyK = clamp01(0.45 + sp * 0.3); this.strike(L, this.toyK * (calm ? 0.7 : 1)); }
      // (going by: a tick of china now and then)
      this.tick -= dt * (1 + 9 * this.rattle);
      if (this.tick < 0 && this.rattle > 0.06) { this.tick = 0.5 + L.rand(); if (!L.quiet) noise(voice, 0, { d: 0.025, vol: 0.006 + 0.012 * this.rattle, hp: 3800 }); }
    } else this.rattle = 0;
    if (t - this.toyT < HOP) lidY = Math.max(lidY, 0.03 * this.toyK * Math.sin(PI * (t - this.toyT) / HOP));
    if (this.toyT + HOP > last && t >= this.toyT + HOP) { last = this.toyT + HOP; hard = this.toyK; }

    // ---- his dark gathers; the shelf comes out of it with everything on it; his light comes up on it
    let slide, light, dk, out;
    if (!back) {
      slide = far * (1 - ease.inOut(ramp(t, T_OUT[0], T_OUT[1]))); light = ease.smooth(ramp(t, T_LIGHT[0], T_LIGHT[1])); dk = ease.smooth(ramp(t, 0, calm ? 2.2 : 1.1)); out = ramp(t, T_OUT[0], T_OUT[1]);
    } else {
      const h = this.hold || { light: 1, lid: 0, slide: 0, dk: 1, out: 1 }, R_ = L.ret;
      lidY = h.lid * (1 - ease.inOut(ramp(R_, 0, 0.22)));
      light = h.light * (1 - ease.smooth(ramp(R_, 0.08, 0.6))); slide = lerp(h.slide, far, ease.inOut(ramp(R_, 0.3, 0.95))); dk = h.dk * (1 - ease.smooth(ramp(R_, 0.55, 1))); out = h.out * (1 - ramp(R_, 0.3, 0.95));
    }
    this.lidY = lidY;
    u.uSlide.value = slide; u.uLight.value = light; gu.uDk.value = dk; gu.uOut.value = out;

    // ---- the ring: how long since the glass was struck, and what it has reached
    const age = t - last, env = (a, k) => (a < 0 ? 0 : Math.exp(-k * a)), k = hard * soft, rt = this.rattle;
    const bloom = age < 0 ? 0 : (calm ? (1 - Math.exp(-age * 2.2)) * Math.exp(-age * 0.55) * 0.6 : (1 - Math.exp(-age * 9)) * Math.exp(-age * 0.85));
    u.uPulse.value = bloom * hard * (back ? 1 - ramp(L.ret, 0, 0.3) : 1);
    u.uNut.value = k * env(age - AFTER.bowl, 1.7) + 0.3 * rt;
    const ca = age - AFTER.cup;
    u.uCup.value.set(0.085 * k * env(ca, 2.1) * Math.sin(ca * 40) + 0.014 * rt * Math.sin(t * 39), 0.006 * k * env(ca, 2.8) * Math.abs(Math.sin(ca * 40)) + 0.0012 * rt * Math.abs(Math.sin(t * 47)));
    u.uSauc.value = k * env(age - AFTER.sauc, 3) + 0.7 * rt;
    const ra = age - AFTER.raisin;
    u.uSway.value = 0.026 * k * env(ra, 0.8) * Math.sin(ra * 5.4) + 0.003 * rt * Math.sin(t * 6.1);
    u.uLeaf.value = k * env(age - AFTER.leaf, 2.4) + 0.3 * rt;
    gu.uShim.value = calm ? 0 : hard * env(age, 1.3);
    const rings = gu.uRing.value, bright = hard * (calm ? 0.6 : 1);
    rings[0].set(age, bright, 0.206, 0.36); rings[1].set(age - AFTER.bowl, 0.6 * bright, 0.312, 0.2); rings[2].set(age - AFTER.cup, 0.7 * bright, 0.103, 0.17); rings[3].set(age - AFTER.jug, 0.65 * bright, 0.12, 0.17);

    // ---- the lid: lifted by its ball, tipped a little to the light while it hangs
    const tip = sstep(0, 0.11, lidY), bx = URN[0], by = TH + RIM, bz = URN[1];
    V.q.setFromEuler(V.e.set(0.22 * tip, 0, 0.07 * tip, 'YXZ'));
    V.a.makeTranslation(-bx, -by, -bz); V.b.compose(V.v.set(bx, by + lidY, bz), V.q, V.one); gu.uLid.value.multiplyMatrices(V.b, V.a);
    if (back && L.ret >= 1) this.hide();
  },
});
