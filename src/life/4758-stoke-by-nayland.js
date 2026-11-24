// John Constable, Stoke-by-Nayland (1836), Gallery 220. The word: dew.
//
// "What say you to a summer morning?" he wrote of it: "July or August, at eight or nine o'clock, after a slight shower
// during the night, to enhance the dews in the shadowed part of the picture." It is a full-size sketch, laid in as much
// with the palette knife as the brush, and the wet is the knife's doing: flecks of white dragged over everything (his
// "snow", people called it). The left half is open sky over the church and the village; the right half is the shadowed
// part, a lane going in under tall trees, and in it a black cart-horse with white feathered feet stands harnessed to
// a cart, waiting, by a puddle that holds the sky. The museum's own note points at the great tree in the middle: it
// "droops from the weight of rainwater".
//
// So what comes out is the shadowed part, and what happens in it is what a wet bough does. Look, and the dew comes
// first: flecks of white on the bare floor and in the air under the picture, in the shape of things not yet there.
// Then each fleck's place fills with paint, and it is the lane: two dark stems and the crown against the wall under
// the frame, one long golden bough reaching out over the lane, the horse and the cart under it, the hedge, an elder
// in flower, the grass, the puddle. White beads gather on the bough's hanging leaves, one after another, and swell;
// his white comes out on the leaves and the grass. The bough takes the weight. It sinks a hand's breadth, slowly; a
// first drop lets go and rings in the puddle (the horse's near ear turns to it), then another, then a third, and at
// that one the horse looks round. The bough hangs at its lowest and holds there. Then the drop at its very tip falls,
// and that is one too many: the whole bough lets go from the tip inwards, a shower of white coming down past the cart
// into the puddle, which rings all over; and the bough, with the weight gone, springs up past where it started and
// bobs there, its leaves swinging, shaken clean of white. A few drops come down on the horse. It puts its head up,
// shakes its mane, blows, and looks round at the puddle; then its head goes down and it goes back to waiting. While
// you keep looking the dew gathers again and the bough fills and lets go again, more gently (the horse shakes at
// every other one). When you stop, the morning has warmed: the dew lifts off the grass fleck by fleck, everything
// thins back to flecks of white, and those go too.
//
// The only sounds are the drops (a plink for each one in the puddle, pitched by where it hangs, a tick for each on
// the ground; no tune), the leaves as the bough comes up, and the horse. No music: it is a quiet picture.
//
// Nothing is ever in front of a picture. The tree is under 0.9 m at the wall and the bough comes lower the further out
// it reaches (0.5 m at its tip, 0.8 m out), all of it under the rail of this frame and of Turner's beside it: the look
// camera's guard has nothing to cut. Turner's sea (src/life/4796-fishing-boats-hucksters.js) comes out on the floor
// to the right of this one and its moment is the sun breaking through; this one has no sun, no wind and no sea (its
// water is a puddle and a bough-full of drops), and it keeps to the left of Turner's canvas. Nothing is solid and
// nothing stays out after the look. Three draw calls: the ground (one sheet: his earth, the grass, the puddle and its
// rings, the dew on the grass, one shader), one rig (the stems, the bough's three lengths, the horse, the cart; every
// part condenses in its shader) and his touches (leaves, hanging drags, beads, drops, mane and tail, the hedge: knife
// marks that face you, one instanced shader).
// With "Reduce motion and flashing": the bough comes up slowly with no bounce and no tremble, the horse's shake is
// half as fast and half as far, the leaves swing a third as much, nothing glints (the dew only shimmers, slowly), and
// every sound is eased in.
//
// What it does not do: the woman at the gate and the man resting by the plough stay in the picture (they are farm
// people having a rest, and nothing here makes them perform), the church is not built or moved, and the horse is
// only rained on by a few drops, as horses are: it is not startled, struck or made a joke of.

import * as THREE from 'three';
import { lifeFor, ease, ramp, clamp01, lerp, shape, canvasTexture } from '../paintlife.js';
import { strokes } from './brush.js';
import { score, Bones, hump } from './stagecraft.js';

const TAU = Math.PI * 2;
const sm = (x, a, b) => ease.smooth(ramp(x, a, b));
const GL = n => n.toFixed(5);
// ---------------------------------------------------------------- the place (u along the wall, h up, o out from it)
const U0 = -0.15, SA = 1.1, SB = 1.42;               // the patch of lane: its middle along the wall, its reach each way and out
const reach = (u, o) => Math.hypot((u - U0) / SA, Math.max(o, 0) / SB);
const BJ = [[-0.44, 0.42, 0.15], [-0.25, 0.575, 0.36], [0.0, 0.6, 0.58], [0.3, 0.5, 0.82]];      // the bough, unloaded: its joints (u, h, o)
const BW = [0.2, 0.35, 0.45];                         // how much of the sag each joint takes
const S_EQ = 0.02, S_MAX = 0.36;                      // the sag (radians at the tip): empty, and full of water
const HORSE = { u: -0.02, o: 0.56, du: -0.853, dv: 0.522 };      // where the horse stands, and the way it faces
const HS = 1.14;                                      // the horse and the cart: this many times the size they are modelled at
const WAG = 0.36 * HS;                                // the cart, this far behind the horse's middle
const PUD = [0.25, 0.86, 0.38, 0.19];               // the puddle: u, o, half length, half width
// ---------------------------------------------------------------- the clock
// The first filling: beads from T_BEAD, three single drops, the bough lets go at T_SHED. Then again every P_LOOP.
const T_BEAD = 1.6, T_SHED = 4.55, T_LOOP = 8.6, P_LOOP = 8.4, D_SHED = 5.4;
const SINGLES = [0.38, 0.62, 0.83];                  // the three single drops: how far through the filling each falls
const GRAV = 6.2;                                     // a drop's fall (a little slower than the world's, so it can be seen)
const DAB = 0, DRAG = 1, FLECK = 2, CLUMP = 4, TUFT = 7, DROP = 8, BLOSSOM = 9, BODY = 10;      // (clumps: 4, 5, 6)
const NC = 400, NRING = 8;

const inPud = (u, o) => Math.hypot((u - PUD[0]) / PUD[2], (o - PUD[1]) / PUD[3]) < 0.84;
const onHorse = (u, o) => { const a = (u - HORSE.u) * HORSE.du + (o - HORSE.o) * HORSE.dv, c = -(u - HORSE.u) * HORSE.dv + (o - HORSE.o) * HORSE.du; return a > -0.16 * HS && a < 0.15 * HS && Math.abs(c) < 0.068 * HS; };

// ---------------------------------------------------------------- geometry: smooth painted limbs for the rig
// A limb: rings [x, y, z, rx, ry] along a path, joined smoothly and closed at both ends; ref is a direction the path
// never runs along (rx lies across it, ry along it); paint(p, n, colour, ring, j) gives every point its colour.
function loft(rings, seg, ref, paint, sub = 1) {
  if (sub > 1) {      // (rings between the given ones, on a smooth curve through them)
    const src = rings.map(r => [r[0], r[1], r[2], r[3], r[4] == null ? r[3] : r[4]]), out = [], cr = (a, b, c, d, q) => 0.5 * (2 * b + (c - a) * q + (2 * a - 5 * b + 4 * c - d) * q * q + (3 * b - a - 3 * c + d) * q * q * q);
    for (let i = 0; i < src.length - 1; i++) for (let s = 0; s < sub; s++) { const A = src[Math.max(0, i - 1)], B = src[i], C = src[i + 1], D = src[Math.min(src.length - 1, i + 2)], q = s / sub; out.push([0, 1, 2, 3, 4].map(j => (j > 2 ? Math.max(Math.min(B[j], C[j]) * 0.999, cr(A[j], B[j], C[j], D[j], q)) : cr(A[j], B[j], C[j], D[j], q)))); }
    out.push(src[src.length - 1]); rings = out;
  }
  const n = rings.length, pos = [], idx = [];
  const t = new THREE.Vector3(), s = new THREE.Vector3(), u = new THREE.Vector3(), a = new THREE.Vector3(), b = new THREE.Vector3(), R = new THREE.Vector3(...ref);
  for (let i = 0; i < n; i++) {
    const [x, y, z, rx, ry = rx] = rings[i];
    a.fromArray(rings[Math.max(0, i - 1)]); b.fromArray(rings[Math.min(n - 1, i + 1)]); t.subVectors(b, a).normalize();
    s.crossVectors(t, R).normalize(); u.crossVectors(s, t).normalize();
    for (let j = 0; j < seg; j++) { const an = j / seg * TAU, c = Math.cos(an) * rx, d = Math.sin(an) * ry; pos.push(x + s.x * c + u.x * d, y + s.y * c + u.y * d, z + s.z * c + u.z * d); }
  }
  for (let i = 0; i < n - 1; i++) for (let j = 0; j < seg; j++) { const A = i * seg + j, B = i * seg + (j + 1) % seg, C = A + seg, D = B + seg; idx.push(A, C, B, B, C, D); }
  const c0 = pos.length / 3; pos.push(rings[0][0], rings[0][1], rings[0][2], rings[n - 1][0], rings[n - 1][1], rings[n - 1][2]);
  for (let j = 0; j < seg; j++) { idx.push(c0, j, (j + 1) % seg, c0 + 1, (n - 1) * seg + (j + 1) % seg, (n - 1) * seg + j); }
  let g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  const P = g.attributes.position, N = g.attributes.normal, col = new Float32Array(P.count * 3), k = new THREE.Color();
  for (let i = 0; i < P.count; i++) { k.setRGB(1, 1, 1); paint(a.fromBufferAttribute(P, i), b.fromBufferAttribute(N, i), k, Math.min(n - 1, Math.floor(i / seg)), i % seg); col[i * 3] = k.r; col[i * 3 + 1] = k.g; col[i * 3 + 2] = k.b; }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g = g.toNonIndexed(); return g;
}
// Each point of one of the kit's shapes its own colour, from where it is and how it faces.
function tint(g, fn) { const p = g.attributes.position, nn = g.attributes.normal, c = g.attributes.color, k = new THREE.Color(), v = new THREE.Vector3(), n = new THREE.Vector3(); for (let i = 0; i < p.count; i++) { fn(v.fromBufferAttribute(p, i), n.fromBufferAttribute(nn, i), k); c.setXYZ(i, k.r, k.g, k.b); } return g; }
const place = (g, m) => { g.applyMatrix4(m); return g; };

// ---------------------------------------------------------------- his marks: the knife's touches, one sheet of them
// Ten marks, each in a cell 128 wide and 256 high; the top of a cell is the end the mark leads with. Red is how
// thickly the paint lies (light where the knife left a ridge, dark where it scraped thin); blue is his white, the
// flecks dragged over the top (shown only where the dew has come); alpha is where the paint is, and how soon each
// bit of it comes, so a mark can arrive, or go, a fleck at a time.
function markAtlas(rand) {
  const W = 1024, H = 512, CW = 128, CH = 256;
  const mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; };
  const cl = mk(), ca = mk(), gl = cl.getContext('2d', { willReadFrequently: true }), ga = ca.getContext('2d', { willReadFrequently: true });
  gl.fillStyle = 'rgb(150,150,0)'; gl.fillRect(0, 0, W, H); ga.fillStyle = '#000'; ga.fillRect(0, 0, W, H);
  ga.globalCompositeOperation = 'lighten';
  const R = (a, b) => a + (b - a) * rand();
  // (drawn in the card's own shape: asp is how many times longer than wide the mark will be shown)
  const cell = (i, asp, f) => { const x = (i % 8) * CW, y = Math.floor(i / 8) * CH; for (const g of [gl, ga]) { g.save(); g.beginPath(); g.rect(x + 8, y + 8, CW - 16, CH - 16); g.clip(); g.translate(x + CW / 2, y + CH / 2); g.scale(1, 2 / asp); } f(50 * asp); gl.restore(); ga.restore(); };
  const fill = (path, v, al = 1, white = false) => { v = Math.round(Math.max(0, Math.min(255, v))); gl.fillStyle = `rgb(${v},${v},${white ? 255 : 0})`; gl.beginPath(); path(gl); gl.fill(); const w = Math.round(255 * al); ga.fillStyle = `rgb(${w},${w},${w})`; ga.beginPath(); path(ga); ga.fill(); };
  const poly = pts => g => { pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); };
  // one touch of the knife from a to b: flat, its ends torn, a ridge of thick paint down its left edge and a thin dark
  // one down its right
  const touch = (x0, y0, x1, y1, w, v, al = 1) => {
    const dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy) || 1, ux = dx / l, uy = dy / l, nx = -uy, ny = ux, rag = Math.min(l * 0.3, w * 0.7), pts = [];
    for (let k = 0; k <= 4; k++) { const s = -w / 2 + w * k / 4, e = -rag * rand(); pts.push([x0 + nx * s + ux * e, y0 + ny * s + uy * e]); }
    for (let k = 4; k >= 0; k--) { const s = -w / 2 + w * k / 4, e = rag * rand(); pts.push([x1 + nx * s + ux * e, y1 + ny * s + uy * e]); }
    fill(poly(pts), v, al);
    const edge = (s0, s1, vv) => { vv = Math.round(Math.max(0, Math.min(255, vv))); gl.fillStyle = `rgb(${vv},${vv},0)`; gl.beginPath(); poly([[x0 + nx * s0, y0 + ny * s0], [x0 + nx * s1, y0 + ny * s1], [x1 + nx * s1, y1 + ny * s1], [x1 + nx * s0, y1 + ny * s0]])(gl); gl.fill(); };
    edge(-w / 2, -w / 2 + w * 0.24, v + 62); edge(w / 2 - w * 0.2, w / 2, v - 50);
  };
  const dot = (x, y, rx, ry, v, al = 1, white = false) => fill(g => g.ellipse(x, y, rx, ry, 0, 0, TAU), v, al, white);
  // leaves, as he lays them: touches all slanting one way, in a few loose groups, the dark ones under and the light
  // ones over them on the side the sky is on, gaps between; and his white flecked over it
  const hatch = (Y, n, wx, l0, l1, w0, w1, ang, flecks) => {
    const G = Array.from({ length: 4 }, () => [R(-wx * 0.6, wx * 0.6), R(-Y * 0.5, Y * 0.5), R(0.3, 0.7)]);
    for (let i = 0; i < n; i++) {
      const f = i / (n - 1), g = G[i % 4], a0 = R(0, TAU), r0 = Math.sqrt(rand()) * g[2], cx = Math.max(-wx, Math.min(wx, g[0] + Math.cos(a0) * r0 * wx)), cy = Math.max(-Y * 0.74, Math.min(Y * 0.74, g[1] + Math.sin(a0) * r0 * Y * 0.8)), a = ang + R(-0.32, 0.32), l = R(l0, l1), w = R(w0, w1);
      const lightSide = clamp01(0.5 - cx / (wx * 2) - cy / (Y * 2.4));
      touch(cx - Math.cos(a) * l / 2, cy - Math.sin(a) * l / 2, cx + Math.cos(a) * l / 2, cy + Math.sin(a) * l / 2, w, 34 + 124 * f * (0.45 + 0.75 * lightSide) + R(-16, 30));
    }
    for (let i = 0; i < flecks; i++) { const g = G[i % 4]; dot(g[0] + R(-16, 16), g[1] + R(-Y * 0.25, Y * 0.25), R(2.2, 3.6), R(2.8, 5), 255, 1, true); }
  };
  // 0: a dab: one loaded touch and a thinner one dragged beside it
  cell(DAB, 1.6, Y => { touch(2, Y * 0.9, -2, -Y * 0.9, 78, 142); touch(-20, Y * 0.6, -14, -Y * 0.95, 34, 176); touch(22, Y * 0.92, 26, -Y * 0.3, 30, 104); });
  // 1: a drag: a long hanging streak, broad where it starts and drawn out to nothing, the knife skipping as it goes
  cell(DRAG, 5, Y => {
    fill(poly([[-34, Y], [34, Y], [26, Y * 0.3], [11, -Y * 0.4], [3, -Y], [-3, -Y], [-12, -Y * 0.4], [-27, Y * 0.3]]), 132);
    fill(poly([[-34, Y], [-17, Y], [-9, -Y * 0.2], [-3, -Y * 0.9], [-12, -Y * 0.4], [-27, Y * 0.3]]), 208);
    fill(poly([[34, Y], [20, Y], [12, Y * 0.2], [7, -Y * 0.5], [11, -Y * 0.4], [26, Y * 0.3]]), 74);
    for (let i = 0; i < 7; i++) { const y = R(-Y * 0.5, Y * 0.9), x = R(-30, 30), a = R(-0.5, 0.5), l = R(26, 60); touch(x - Math.sin(a) * l, y + Math.cos(a) * l * 2.2, x + Math.sin(a) * l, y - Math.cos(a) * l * 2.2, R(10, 18), R(60, 200)); }
    ga.globalCompositeOperation = 'source-over';
    for (let i = 0; i < 8; i++) { const y = R(-Y * 0.9, Y * 0.7), h = R(5, 14); ga.fillStyle = '#000'; ga.beginPath(); poly([[-50, y], [50, y + R(-24, 24)], [50, y + h + R(-24, 24)], [-50, y + h]])(ga); ga.fill(); }
    ga.globalCompositeOperation = 'lighten';
    for (let i = 0; i < 2; i++) dot(R(-18, 18), R(-Y * 0.6, Y * 0.8), 3, 8, 255, 1, true);
  });
  // 2: a fleck of thick white, as it comes off the knife's edge
  cell(FLECK, 1.2, Y => { for (let i = 0; i < 4; i++) dot(R(-12, 12), R(-Y * 0.26, Y * 0.26), R(22, 34), R(24, Y * 0.56), 206); dot(-6, -Y * 0.12, 19, Y * 0.32, 250); dot(8, Y * 0.4, 17, Y * 0.15, 150); });
  // 4, 5, 6: a clump of leaves, three ways
  cell(CLUMP, 1.2, Y => hatch(Y, 30, 40, 22, 44, 10, 18, -0.95, 4));
  cell(CLUMP + 1, 1.2, Y => hatch(Y, 26, 40, 26, 50, 11, 20, -1.25, 3));
  cell(CLUMP + 2, 1.2, Y => hatch(Y, 34, 40, 18, 36, 9, 16, -0.6, 4));
  // a tuft of grass: blades fanning up from one root
  cell(TUFT, 1.1, Y => { for (let i = 0; i < 13; i++) { const x = R(-44, 44), top = R(-Y * 0.95, -Y * 0.05), w = R(4, 8), bx = R(-10, 10); fill(poly([[bx - w, Y * 0.92], [bx + w, Y * 0.92], [x + 1.5, top], [x - 1.5, top]]), R(50, 205)); } for (let i = 0; i < 4; i++) dot(R(-36, 36), R(-Y * 0.8, 0), 3, 4.5, 255, 1, true); });
  // a drop falling: a bright head, a short tail
  cell(DROP, 4, Y => { fill(poly([[-15, -Y * 0.5], [15, -Y * 0.5], [0, Y * 0.92]]), 205, 0.55); dot(0, -Y * 0.62, 30, Y * 0.3, 255); });
  // the dark body of a mass of leaves: a broad soft shape, scraped thin
  cell(BODY, 1.2, Y => { for (let i = 0; i < 7; i++) dot(R(-16, 16), R(-Y * 0.34, Y * 0.34), R(24, 36), R(Y * 0.36, Y * 0.56), R(96, 150)); for (let i = 0; i < 8; i++) { const cx = R(-28, 28), cy = R(-Y * 0.5, Y * 0.5); touch(cx - 12, cy + 20, cx + 12, cy - 20, R(10, 18), R(70, 170)); } });
  // blossom, or a scatter of his white: small flecks
  cell(BLOSSOM, 1.1, Y => { for (let i = 0; i < 18; i++) { const a = R(0, TAU), r = Math.sqrt(rand()); dot(Math.cos(a) * r * 40, Math.sin(a) * r * Y * 0.78, R(4, 8), R(5, 10), R(190, 255)); } });
  // (the alpha softened a little, so an edge stays an edge close to; then times a soft noise, so that a rising threshold
  // wears a mark away raggedly and its last bits are flecks)
  const c = gl.getImageData(0, 0, W, H).data, d = ga.getImageData(0, 0, W, H).data, out = new Uint8Array(W * H * 4);
  let A = new Float32Array(W * H), B = new Float32Array(W * H); for (let i = 0; i < W * H; i++) A[i] = d[i * 4];
  for (let pass = 0; pass < 2; pass++) {
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = y * W + x; B[i] = (A[i - (x > 0 ? 1 : 0)] + 2 * A[i] + A[i + (x < W - 1 ? 1 : 0)]) / 4; }
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = y * W + x; A[i] = (B[i - (y > 0 ? W : 0)] + 2 * B[i] + B[i + (y < H - 1 ? W : 0)]) / 4; }
  }
  const hh = (x, y) => { const q = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return q - Math.floor(q); };
  const vn = (x, y) => { const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy, ax = fx * fx * (3 - 2 * fx), ay = fy * fy * (3 - 2 * fy); return lerp(lerp(hh(ix, iy), hh(ix + 1, iy), ax), lerp(hh(ix, iy + 1), hh(ix + 1, iy + 1), ax), ay); };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x;
    const n = 0.44 + 0.56 * (0.68 * vn(x / 10, y / 10) + 0.32 * vn(x / 4.3 + 7, y / 4.3 + 3));
    out[i * 4] = c[i * 4]; out[i * 4 + 1] = c[i * 4 + 1]; out[i * 4 + 2] = c[i * 4 + 2]; out[i * 4 + 3] = Math.round(A[i] * n);
  }
  const t = new THREE.DataTexture(out, W, H, THREE.RGBAFormat);
  t.flipY = false; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter; t.needsUpdate = true;
  return t;
}

lifeFor(4758, {
  title: /^Stoke-by-Nayland/,
  word: 'dew',
  stage: { out: 1.5, half: 1.3, cam: { dist: 2.7, height: 0.8, side: 0.28, fov: 61, lookU: -0.02, lookOut: 0.5, lookH: 0.835 } },
  wake: 2, ret: 2.3,

  build(L) {
    const P = L.pal, col = (h, a = 0.22) => P.near(h, a);
    this.T3 = new THREE.Vector3(L.tx, 0, L.tz); this.N3 = new THREE.Vector3(L.nx, 0, L.nz); this.UP = new THREE.Vector3(0, 1, 0);
    this.O = L.floor(0, 0); this.M0 = new THREE.Matrix4().makeBasis(this.T3, this.UP, this.N3).setPosition(this.O);
    this.v = new THREE.Vector3(); this.v2 = new THREE.Vector3(); this.m4 = new THREE.Matrix4(); this.rx = new THREE.Matrix4(); this.kc = new THREE.Color();
    this.poseNow = this.newPose(); this.poseTmp = this.newPose(); this.cy = { k: 0, S: 0, H: 0 }; this.cyNow = { k: 0, S: 0, H: 0 };
    this.calm = false; this.bT = 0; this.g0 = 1;
    this.buildGround(L, col); this.buildRig(L, col); this.buildCards(L, col);
    // the three single drops: big early beads, out towards the tip, that hang over the puddle when the bough is low
    this.singles = this.beads.filter(b => { if (b.tipmost || b.kind) return false; this.beadAt(b, T_SHED - 0.6, false, this.poseTmp, this.v); return inPud(this.v.x, this.v.z) && Math.hypot((this.v.x - PUD[0]) / PUD[2], (this.v.z - PUD[1]) / PUD[3]) < 0.6; }).sort((a, b) => b.along - a.along).slice(1, 6).filter((b, i) => i % 2 === 0);
    this.singles.forEach((b, i) => { b.single = i; b.ap = [0.0, 0.12, 0.3][i]; b.sz = 0.022; });
    this.bands = [this.makeScore(L, false), this.makeScore(L, true)]; this.band = this.bands[0];
    this.hideAll();
  },

  // ---------------------------------------------------------------- the ground: his lane, the grass, the puddle, the dew
  buildGround(L, col) {
    const u0 = -1.42, u1 = 1.06, o0 = -L.wall - 0.02, o1 = 1.56, pos = [], uo = [], v = new THREE.Vector3();
    for (const [u, o] of [[u0, o0], [u1, o0], [u0, o1], [u1, o1]]) { L.floor(u, o, v); pos.push(v.x, v.y + 0.012, v.z); uo.push(u, o); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aUO', new THREE.Float32BufferAttribute(uo, 2)); g.setIndex([0, 2, 1, 2, 3, 1]);
    const css = (h, a = 0.22) => col(h, a).getStyle();
    // the lane: wet earth dragged along the way it runs, umber with a little ochre and red, a touch of grey where it shines
    const earth = strokes({
      size: 512, seed: 4758, n: 1000, len: [34, 120], width: [11, 32], bend: 0.3, lift: 0.07, base: css('#261d14'),
      colors: [['#1c150e', 3], ['#2c2117', 4], ['#3a2c1c', 3.4], ['#463522', 1.6], ['#584428', 0.5], ['#6b5433', 0.14], ['#432c1f', 1.3], ['#4b4a43', 0.25], ['#6c7673', 0.07]].map(([c, w]) => [css(c), w]),
      angle: (x, y, r) => 0.45 * Math.sin(x * TAU + y * 5) + (r() - 0.5) * 1.0,
    });
    // the grass: short upward drags, dark olive, a little ochre, dark between
    const grass = strokes({
      size: 512, seed: 4759, n: 2300, len: [12, 42], width: [4, 11], bend: 0.3, lift: 0.1, base: css('#1e1d0e'),
      colors: [['#15140a', 2.4], ['#282713', 4], ['#363519', 3.2], ['#46421e', 2], ['#5c5225', 0.9], ['#766732', 0.3], ['#3f472b', 0.6]].map(([c, w]) => [css(c), w]),
      angle: (x, y, r) => Math.PI / 2 + 0.35 * Math.sin(x * TAU * 2 + y * 3) + (r() - 0.5) * 1.1,
    });
    // his white: flecks off the knife's edge, each with its own turn to come
    const fleck = canvasTexture(256, 256, (c, W, H) => {
      c.clearRect(0, 0, W, H); c.lineCap = 'butt';
      const R = () => L.rand();
      for (let i = 0; i < 300; i++) {
        const x = R() * W, y = R() * H, a = R() * Math.PI, l = 2 + R() * R() * 9, w = 1.6 + R() * 2.8; c.strokeStyle = `rgba(255,255,255,${0.4 + 0.6 * R()})`; c.lineWidth = w;
        for (const ox of [-W, 0, W]) for (const oy of [-H, 0, H]) { if (x + ox < -12 || x + ox > W + 12 || y + oy < -12 || y + oy > H + 12) continue; c.beginPath(); c.moveTo(x + ox - Math.cos(a) * l / 2, y + oy - Math.sin(a) * l / 2); c.lineTo(x + ox + Math.cos(a) * l / 2, y + oy + Math.sin(a) * l / 2); c.stroke(); }
      }
    }, false);
    fleck.wrapS = fleck.wrapT = THREE.RepeatWrapping; fleck.anisotropy = 4;
    const hd = HORSE, wu = hd.u - hd.du * WAG, wo = hd.o - hd.dv * WAG;
    const u = this.gu = {
      uT: { value: 0 }, uGrow: { value: 0 }, uGrow1: { value: 0 }, uWake: { value: 1 }, uDew: { value: 0 }, uTw: { value: 1 }, tEarth: { value: earth }, tGrass: { value: grass }, tFleck: { value: fleck },
      uRing: { value: Array.from({ length: NRING }, () => new THREE.Vector4(0, 0, 9, 0)) },
      cDeep: { value: col('#15120c', 0.15) }, cSky: { value: col('#aebdc4', 0.12) }, cDew: { value: col('#eef0ea', 0.05).multiplyScalar(1.2) }, cWarm: { value: col('#8f7a44', 0.15) },
    };
    const m = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide });
    m.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, u);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec2 aUO; varying vec2 vUO;').replace('#include <begin_vertex>', '#include <begin_vertex>\n  vUO = aUO;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
uniform float uT, uGrow, uGrow1, uWake, uDew, uTw; uniform sampler2D tEarth, tGrass, tFleck; uniform vec4 uRing[${NRING}]; uniform vec3 cDeep, cSky, cDew, cWarm;
uniform sampler2D tRefl; uniform mat4 reflMatrix; uniform float reflOn; uniform float reflY;
varying vec2 vUO; vec3 hCol; float hA;
float blot(vec2 p, vec2 c, vec2 d, vec2 r) { vec2 q = p - c; return exp(-pow(dot(q, d) / r.x, 2.0) - pow(dot(q, vec2(-d.y, d.x)) / r.y, 2.0)); }`)
        .replace('#include <map_fragment>', `#include <map_fragment>
{
  vec2 p = vUO;
  vec4 te = texture2D(tEarth, p / 0.8 + vec2(0.13, 0.07)), tg = texture2D(tGrass, p / 0.64 + vec2(0.4, 0.2));
  // how far the morning has come out from under the picture, and the patch's own ragged edge
  vec2 e = vec2((p.x - ${GL(U0)}) / ${GL(SA)} + 1.0e-5, max(p.y, 0.0) / ${GL(SB)}); float th = atan(e.y, e.x);
  float r = length(e), rw = r / (1.0 + 0.09 * sin(3.0 * th + 0.6) + 0.06 * sin(5.0 * th + 2.3) + 0.035 * sin(9.0 * th + 1.1));
  float front = uGrow * 1.7 - 0.3 - r, m = min(front, 1.0 - rw);
  hA = smoothstep(0.0, 0.1, m + (te.a - 0.66) * 0.14 + (tg.a - 0.6) * 0.1);
  // (ahead of it the dew: flecks of white on the bare floor, where the lane is about to be)
  float f1 = texture2D(tFleck, p / 0.6).a, f2 = texture2D(tFleck, p / 0.33 + vec2(0.37, 0.11)).a;
  float pre = smoothstep(0.0, 0.08, min(uGrow1 * 1.7 - 0.3 - r, 1.0 - rw - 0.04)) * max(smoothstep(0.5, 0.62, f1), 0.7 * smoothstep(0.72, 0.8, f2)) * (1.0 - hA);
  if (hA + pre < 0.02) discard;
  // the lane, coming out of the trees at the right and opening towards you; grass either side
  float lx = p.x - (0.36 - 0.22 * p.y), lw = 0.3 + 0.26 * p.y;
  float lane = 1.0 - smoothstep(0.72, 1.12, abs(lx) / lw + (tg.a - 0.6) * 0.6);
  vec3 c = mix(tg.rgb, te.rgb, lane);
  // the shadowed part: dark under the tree and at the wall, lighter and warmer out in front on the left
  float shade = mix(0.55, 1.0, smoothstep(0.02, 0.9, p.y)) * mix(0.8, 1.0, smoothstep(-1.0, -0.3, p.x));
  float open = smoothstep(0.45, 1.15, p.y) * (1.0 - smoothstep(-0.55, 0.3, p.x));
  c = c * shade * (1.0 + 0.5 * open) + cWarm * 0.09 * open * (0.4 + tg.a);
  // what stands on it darkens it
  float sh = 0.6 * blot(p, vec2(${GL(HORSE.u)}, ${GL(HORSE.o)}), vec2(${GL(HORSE.du)}, ${GL(HORSE.dv)}), vec2(${GL(0.2 * HS)}, ${GL(0.085 * HS)}))
    + 0.55 * blot(p, vec2(${GL(wu + HORSE.du * 0.07 * HS)}, ${GL(wo + HORSE.dv * 0.07 * HS)}), vec2(${GL(HORSE.du)}, ${GL(HORSE.dv)}), vec2(${GL(0.17 * HS)}, ${GL(0.13 * HS)}))
    + 0.5 * blot(p, vec2(-0.54, 0.13), vec2(1.0, 0.0), vec2(0.16, 0.11));
  c *= 1.0 - min(sh, 0.66);
  // the puddle: dark, holding the room, with his pale sky lying in it in a few touches
  float wob = 0.1 * sin(p.x * 13.0 + p.y * 7.0) + 0.07 * sin(p.y * 29.0 - p.x * 6.0) + (te.a - 0.66) * 0.2;
  float d1 = length((p - vec2(${GL(PUD[0])}, ${GL(PUD[1])})) / vec2(${GL(PUD[2])}, ${GL(PUD[3])})) + wob;
  float pud = 1.0 - smoothstep(0.84, 0.99, d1), rim = (1.0 - smoothstep(1.0, 1.45, d1)) * (1.0 - pud);
  c *= 1.0 - 0.4 * rim;
  float ring = 0.0; vec2 bend = vec2(0.0);
  for (int i = 0; i < ${NRING}; i++) {
    vec4 R = uRing[i]; if (R.w <= 0.0) continue;
    vec2 dv = p - R.xy; float d = length(dv), rad = 0.012 + R.z * 0.21, wid = 0.0035 + 0.003 * R.z, fade = R.w * (1.0 - smoothstep(0.2, 1.3, R.z));
    float k = (exp(-pow((d - rad) / wid, 2.0)) + 0.35 * exp(-pow((d - rad * 0.55) / wid, 2.0))) * fade;
    ring += k; bend += dv / max(d, 1.0e-3) * k;
  }
  vec4 rp = reflMatrix * vec4(lifeP, 1.0); vec2 ruv = rp.xy / rp.w + bend * 0.014;
  vec3 refl = min(texture2D(tRefl, ruv).rgb, vec3(2.5)) * reflOn * (1.0 - step(0.08, abs(lifeP.y - reflY)));
  vec4 ts = texture2D(tEarth, vec2(p.x / 0.9, p.y / 0.3) + vec2(0.61, 0.33));
  float skyT = smoothstep(0.7, 0.86, ts.a) * smoothstep(0.3, 0.7, 1.0 - d1);
  vec3 water = cDeep + refl * 0.6 + cSky * (0.03 + 0.3 * skyT) + cSky * min(ring, 1.0) * 0.3;
  c = mix(c, water, pud);
  // the dew: his white, a fleck at a time, thick on the grass and thin on the lane
  float thr = 1.03 - 0.6 * uDew, tw = 1.0 - uTw * 0.3 * (0.5 + 0.5 * sin(uT * 1.6 + p.x * 37.0 + p.y * 23.0));
  float fl = max(smoothstep(thr, thr + 0.07, f1), 0.8 * smoothstep(thr + 0.12, thr + 0.2, f2)) * (0.3 + 0.7 * (1.0 - lane)) * (1.0 - pud) * tw * step(0.001, uDew);
  c = mix(c, cDew, fl * 0.9);
  // and each touch of the ground comes pale, as the things on it do
  c = mix(c, cDew * 0.85, uWake * 0.8 * (1.0 - smoothstep(0.0, 0.16, front + (te.a - 0.66) * 0.2)) * max(smoothstep(0.35, 0.6, f1), smoothstep(0.82, 0.9, tg.a)));
  hCol = mix(cDew * 0.9, c, hA / max(hA + pre, 1.0e-3)); hA = max(hA, pre);
}`)
        .replace('#include <opaque_fragment>', '  outgoingLight = hCol; diffuseColor.a = hA;\n#include <opaque_fragment>');
    };
    m.customProgramCacheKey = () => 'stoke-ground';
    this.ground = new THREE.Mesh(g, m); this.ground.renderOrder = 5;
    L.add(this.ground);
    Object.assign(u, L.mirrored(this.ground));        // (the puddle holds the room, and the horse)
  },

  // ---------------------------------------------------------------- the rig: the tree, the bough, the horse, the cart
  buildRig(L, col) {
    const ru = this.ru = { uGrow: { value: 0 }, uGrow1: this.gu.uGrow1, uDewR: { value: 0 }, uC: { value: new THREE.Vector2(this.O.x, this.O.z) }, uTN: { value: new THREE.Vector4(L.tx, L.tz, L.nx, L.nz) }, uFloor: { value: L.y }, cDew: this.gu.cDew };
    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, metalness: 0, emissive: 0xffffff, emissiveIntensity: 0.42 });
    mat.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, ru);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWp; varying vec3 vLp;')
        .replace('#include <project_vertex>', `#include <project_vertex>
  vLp = position;
  #ifdef USE_BATCHING
  vWp = (modelMatrix * (batchingMatrix * vec4(transformed, 1.0))).xyz;
  #else
  vWp = (modelMatrix * vec4(transformed, 1.0)).xyz;
  #endif`);
      // Everything condenses: a part is not there until the morning has reached it, and then it comes as flecks of
      // white that fill in and take their colour. Its paint is laid with the knife (dragged, thick and thin; worked
      // out where each part is its own, so it stays put when the part moves), and afterwards the dew lies on whatever
      // faces the sky (not on the horse).
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
uniform float uGrow, uGrow1, uDewR, uFloor; uniform vec4 uTN; uniform vec2 uC; uniform vec3 cDew; varying vec3 vWp; varying vec3 vLp;
float h31(vec3 p) { p = fract(p * 0.1031); p += dot(p, p.yzx + 33.33); return fract((p.x + p.y) * p.z); }
float vn3(vec3 p) { vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(h31(i), h31(i + vec3(1.0, 0.0, 0.0)), f.x), mix(h31(i + vec3(0.0, 1.0, 0.0)), h31(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
             mix(mix(h31(i + vec3(0.0, 0.0, 1.0)), h31(i + vec3(1.0, 0.0, 1.0)), f.x), mix(h31(i + vec3(0.0, 1.0, 1.0)), h31(i + vec3(1.0, 1.0, 1.0)), f.x), f.y), f.z); }`)
        .replace('#include <color_fragment>', `#include <color_fragment>
  { vec2 d = vWp.xz - uC; vec2 uo = vec2(dot(d, uTN.xy), dot(d, uTN.zw)); float hh = vWp.y - uFloor;
    float n1 = vn3(vLp * 96.0), far = length(vec2((uo.x - ${GL(U0)}) / ${GL(SA)}, max(uo.y, 0.0) / ${GL(SB)})) + 0.1 * hh;
    float g = uGrow * 1.7 - 0.3 - far - 0.16 * n1 - 0.1 * vn3(vLp * 31.0);
    // (before a part has come, the dew that will lie on it: flecks of white in the air, in its shape)
    if (g < 0.0 && (uGrow1 * 1.7 - 0.3 - far < 0.12 || n1 < 0.69)) discard;
    vec2 hq = uo - vec2(${GL(HORSE.u)}, ${GL(HORSE.o)}); float ha = dot(hq, vec2(${GL(HORSE.du)}, ${GL(HORSE.dv)})), hc = dot(hq, vec2(${GL(-HORSE.dv)}, ${GL(HORSE.du)}));
    float notHorse = 1.0 - (1.0 - smoothstep(${GL(0.26 * HS)}, ${GL(0.3 * HS)}, abs(ha))) * (1.0 - smoothstep(${GL(0.1 * HS)}, ${GL(0.13 * HS)}, abs(hc)));
    float k1 = vn3(vLp * vec3(46.0, 17.0, 46.0) + 3.1), k2 = vn3(vLp * vec3(150.0, 60.0, 150.0)), kk = mix(0.4, 1.0, notHorse);
    diffuseColor.rgb *= 1.0 + kk * (0.62 * k1 - 0.38 + 0.3 * (k2 - 0.5));
    diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * 1.5 + vec3(0.02, 0.018, 0.012), smoothstep(0.66, 0.8, k1) * smoothstep(0.4, 0.6, k2) * kk);
    diffuseColor.rgb = mix(cDew * 0.92, diffuseColor.rgb, smoothstep(0.0, 0.035, g));
    float up = dot(normalize(vNormal), normalize((viewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz));
    float fk = smoothstep(0.3, 0.8, up) * smoothstep(0.86 - 0.14 * uDewR, 0.9 - 0.14 * uDewR, vn3(vLp * 82.0 + 9.0)) * step(0.001, uDewR) * notHorse;
    diffuseColor.rgb = mix(diffuseColor.rgb, cDew, fk * 0.9); }`)
        .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n  totalEmissiveRadiance *= diffuseColor.rgb;');
    };
    mat.customProgramCacheKey = () => 'stoke-rig';
    const rig = this.rig = L.rig(12, 60000, mat), k2 = new THREE.Color();
    const LS = new THREE.Vector3(-0.45, 0.8, 0.42).normalize();      // his light: from the open sky on the left, and from us
    const lit = (n, l = LS) => 0.56 + 0.6 * Math.max(0, n.dot(l)) + 0.08 * n.y;

    // ---- the tree: two stems and their limbs, dark and wet, an olive-grey light down the side the sky is on
    const bark = col('#231a12'), barkL = col('#756c50', 0.18), barkW = col('#3a281a');
    const barkPaint = seed => (p, n, c, i, j) => { const s = Math.sin(j * 2.4 + seed + i * 0.45) * Math.sin(j * 5.1 + seed * 1.7); c.copy(bark).lerp(barkW, 0.5 + 0.5 * s).lerp(barkL, clamp01((n.dot(LS) - 0.3) * 1.3) * (0.5 + 0.5 * Math.sin(i * 0.7 + j * 0.8 + seed))).multiplyScalar(lit(n) * (0.92 + 0.16 * s)); };
    const Z = [0, 0, 1], Y = [0, 1, 0];
    const tree = [
      loft([[-0.535, -0.014, 0.13, 0.004], [-0.535, -0.01, 0.13, 0.074, 0.062], [-0.53, 0.03, 0.13, 0.05, 0.047], [-0.527, 0.1, 0.132, 0.041], [-0.5, 0.2, 0.136, 0.038], [-0.492, 0.3, 0.139, 0.035], [-0.458, 0.38, 0.144, 0.034], [-0.44, 0.44, 0.15, 0.03], [-0.43, 0.47, 0.153, 0.012]], 14, Z, barkPaint(0.3), 3),
      loft([[-0.63, -0.012, 0.11, 0.004], [-0.63, -0.008, 0.11, 0.045, 0.04], [-0.632, 0.05, 0.11, 0.031], [-0.645, 0.2, 0.105, 0.027], [-0.64, 0.36, 0.1, 0.024], [-0.67, 0.5, 0.095, 0.019], [-0.7, 0.6, 0.09, 0.008]], 10, Z, barkPaint(2.2), 3),
      loft([[-0.455, 0.39, 0.14, 0.026], [-0.5, 0.47, 0.13, 0.024], [-0.55, 0.57, 0.115, 0.018], [-0.58, 0.66, 0.1, 0.008]], 9, Z, barkPaint(1.9), 2),
      loft([[-0.445, 0.42, 0.14, 0.028], [-0.425, 0.52, 0.125, 0.024], [-0.385, 0.62, 0.105, 0.018], [-0.35, 0.7, 0.09, 0.008]], 9, Z, barkPaint(3.1), 2),
      loft([[-0.44, 0.4, 0.14, 0.027], [-0.33, 0.5, 0.115, 0.023], [-0.2, 0.585, 0.095, 0.018], [-0.02, 0.64, 0.08, 0.012], [0.1, 0.65, 0.08, 0.004]], 9, Y, barkPaint(4.4), 2),
    ];
    // ---- the cart: a tumbril, weathered boards with a pale top rail, red-brown wheels, shafts to the horse
    const hd = HORSE, yawH = Math.atan2(-hd.dv, hd.du), bones = this.bones = new Bones();
    this.yawH = yawH;
    {
      const wood = col('#54463a'), woodL = col('#a59880', 0.15), woodD = col('#2a2018'), red = col('#6d3a26', 0.18), redL = col('#a87a52', 0.15);
      const Mw = new THREE.Matrix4(); bones.set(Mw, hd.u - hd.du * WAG, 0, hd.o - hd.dv * WAG, yawH, 0, 0, HS);
      const LW = LS.clone().transformDirection(new THREE.Matrix4().copy(Mw).invert());
      const board = (w, h, d, x, y, z, rx = 0, rz = 0) => tint(shape.move(shape.box(w, h, d), x, y, z, rx, 0, rz), (p, n, c) => { const s = Math.sin(p.x * 150 + p.y * 40) * Math.sin(p.x * 61 + 1.3); c.copy(woodD).lerp(wood, clamp01(0.35 + (p.y - 0.13) * 9 + 0.25 * s)).lerp(woodL, clamp01((n.dot(LW) - 0.35) * 1.2) * (0.5 + 0.3 * s)).multiplyScalar(lit(n, LW)); });
      const rail = (x, y, z, len) => tint(shape.move(shape.box(len, 0.01, 0.014), x, y, z), (p, n, c) => c.copy(wood).lerp(woodL, clamp01(0.3 + n.y)).multiplyScalar(lit(n, LW) * 1.08));
      const wheel = z => {
        const sq = [[0.092, -0.009], [0.11, -0.009], [0.112, 0], [0.11, 0.009], [0.092, 0.009], [0.09, 0], [0.092, -0.009]];
        const parts = [shape.lathe(sq, 30), shape.lathe([[0.0001, -0.022], [0.016, -0.022], [0.021, -0.008], [0.021, 0.008], [0.016, 0.022], [0.0001, 0.022]], 14)];
        for (let i = 0; i < 12; i++) { const s = shape.cyl(0.0046, 0.0036, 0.076, 7); s.rotateZ(Math.PI / 2); s.translate(0.056, 0, 0); s.rotateY(i / 12 * TAU + 0.13); parts.push(s); }
        const g = shape.merge(parts); g.rotateX(Math.PI / 2); g.translate(-0.08, 0.112, z);
        return tint(g, (p, n, c) => { const rr = Math.hypot(p.x + 0.08, p.y - 0.112), a = Math.atan2(p.y - 0.112, p.x + 0.08); c.copy(red).lerp(woodD, 0.55 * (1 - sm(rr, 0.02, 0.09))).lerp(redL, clamp01((n.dot(LW) - 0.3) * 1.1) * (0.55 + 0.45 * Math.sin(a * 5 + z * 40))).multiplyScalar(lit(n, LW) * (0.9 + 0.14 * Math.sin(a * 9 + rr * 80))); });
      };
      const shaft = z => loft([[0.05, 0.142, z * 0.8, 0.003], [0.06, 0.142, z * 0.8, 0.009], [0.2, 0.158, z * 0.98, 0.008], [0.34, 0.186, z, 0.0075], [0.47, 0.2, z, 0.006], [0.48, 0.2, z, 0.002]], 7, Y, (p, n, c) => c.copy(wood).lerp(woodL, clamp01((n.dot(LW) - 0.2) * 1.1)).multiplyScalar(lit(n, LW)));
      const cart = shape.merge([
        board(0.27, 0.012, 0.15, -0.07, 0.136, 0), board(0.27, 0.078, 0.008, -0.07, 0.178, 0.084, 0.24), board(0.27, 0.078, 0.008, -0.07, 0.178, -0.084, -0.24),
        board(0.008, 0.07, 0.165, 0.068, 0.174, 0, 0, -0.2), board(0.008, 0.066, 0.165, -0.207, 0.172, 0, 0, 0.16),
        rail(-0.07, 0.219, 0.094, 0.3), rail(-0.07, 0.219, -0.094, 0.3),
        tint(shape.move(shape.cyl(0.008, 0.008, 0.2, 8), -0.08, 0.112, 0, Math.PI / 2), (p, n, c) => c.copy(woodD)),
        wheel(0.102), wheel(-0.102), shaft(0.09), shaft(-0.09),
      ]);
      tree.push(place(cart, Mw));
    }
    this.gSet = rig.geo(shape.merge(tree)); this.iSet = rig.add(this.gSet);

    // ---- the bough: three lengths of it, each turning on the one before as the weight comes on
    const bj = BJ.map(p => new THREE.Vector3(...p));
    this.BS = [0, 1, 2].map(i => { const d = bj[i + 1].clone().sub(bj[i]), hl = Math.hypot(d.x, d.z); return { len: d.length(), hx: d.x / hl, hz: d.z / hl, e: Math.atan2(d.y, hl) }; });
    const br = [0.028, 0.022, 0.016, 0.006];
    this.iBough = this.BS.map((s, i) => rig.add(rig.geo(loft([[-0.02, 0, 0, br[i] * 0.4], [-0.012, 0, 0, br[i]], [s.len * 0.35, 0.007, 0, lerp(br[i], br[i + 1], 0.35)], [s.len * 0.7, 0.007, 0, lerp(br[i], br[i + 1], 0.7)], [s.len + 0.008, 0, 0, br[i + 1]], [s.len + 0.016, 0, 0, br[i + 1] * 0.3]], 9, Y, barkPaint(6 + i * 1.7), 2))));

    // ---- the horse: black, heavy, white to the fetlock, a red collar. Its own frame: x the way it faces, y up, z to
    // its right (the wall's side; its near side is -z)
    {
      const coat = col('#17120d'), coatL = col('#5a4633', 0.16), coatW = col('#2b1f17'), white = col('#dcd5c2', 0.1), muzzle = col('#6a5648'), red = col('#8a2c20', 0.2), brass = col('#b08a4a', 0.2);
      const LH = LS.clone().applyAxisAngle(this.UP, -yawH);
      const hide = (p, n, c) => { c.copy(coat).lerp(coatW, 0.5 + 0.5 * Math.sin(p.x * 70 + p.y * 40)).lerp(coatL, clamp01((n.dot(LH) - 0.4) * 1.5)).multiplyScalar(lit(n, LH)); };
      // (white feather from the fetlock down, ragged at its top)
      const leg = (p, n, c) => { hide(p, n, c); const f = 1 - sm(p.y + 0.012 * Math.sin(p.x * 300 + p.z * 240), 0.04, 0.072); c.lerp(k2.copy(white).multiplyScalar(lit(n, LH) * 0.96), f); };
      const body = loft([[-0.176, 0.224, 0, 0.004], [-0.168, 0.224, 0, 0.04, 0.045], [-0.146, 0.222, 0, 0.064, 0.064], [-0.112, 0.219, 0, 0.074, 0.073], [-0.065, 0.213, 0, 0.076, 0.07], [-0.015, 0.207, 0, 0.078, 0.069], [0.035, 0.208, 0, 0.076, 0.071], [0.078, 0.215, 0, 0.069, 0.076], [0.112, 0.219, 0, 0.058, 0.069], [0.137, 0.216, 0, 0.042, 0.052], [0.15, 0.213, 0, 0.004]], 18, Y, hide, 2);
      const fore = z => loft([[0.104, 0.2, z, 0.004], [0.105, 0.19, z, 0.031], [0.106, 0.135, z, 0.025], [0.109, 0.09, z, 0.021], [0.107, 0.055, z, 0.015], [0.109, 0.028, z, 0.022], [0.114, 0.007, z, 0.031], [0.114, 0, z, 0.022]], 10, Z, leg, 2);
      const hindR = loft([[-0.105, 0.215, 0.045, 0.004], [-0.11, 0.2, 0.045, 0.047, 0.04], [-0.125, 0.15, 0.045, 0.035, 0.03], [-0.146, 0.1, 0.045, 0.022], [-0.136, 0.055, 0.045, 0.015], [-0.13, 0.028, 0.045, 0.023], [-0.125, 0.007, 0.045, 0.032], [-0.125, 0, 0.045, 0.022]], 10, Z, leg, 2);
      // the near hind leg at rest: the hock dropped, the hoof tipped on to its toe
      const hindL = loft([[-0.105, 0.212, -0.045, 0.004], [-0.108, 0.198, -0.045, 0.047, 0.04], [-0.117, 0.148, -0.045, 0.035, 0.03], [-0.13, 0.104, -0.046, 0.022], [-0.108, 0.058, -0.047, 0.015], [-0.1, 0.032, -0.047, 0.023], [-0.09, 0.011, -0.047, 0.028], [-0.086, 0.002, -0.047, 0.017]], 10, Z, leg, 2);
      // the collar: a red ring round the root of the neck, a brass tip to each hame
      const ring = Array.from({ length: 9 }, (_, i) => [0.06 + 0.013 * Math.cos(i / 8 * TAU), 0.013 * Math.sin(i / 8 * TAU)]);
      const collar = tint(shape.move(shape.lathe(ring, 18), 0.114, 0.23, 0, 0, 0, -0.9, 1, 1, 0.84), (p, n, c) => c.copy(red).lerp(brass, sm(p.y, 0.278, 0.292)).multiplyScalar(lit(n, LH)));
      this.gBody = rig.geo(shape.merge([body, fore(0.04), fore(-0.04), hindR, hindL, collar]));
      this.gNeck = rig.geo(loft([[-0.04, -0.016, 0, 0.004], [-0.03, -0.014, 0, 0.055, 0.08], [0.015, -0.002, 0, 0.049, 0.072], [0.058, 0.008, 0, 0.04, 0.06], [0.1, 0.011, 0, 0.033, 0.048], [0.128, 0.006, 0, 0.028, 0.037], [0.14, 0.002, 0, 0.004]], 14, Y, hide, 2));
      // the head: a white blaze down the face, a grey muzzle
      this.gHead = rig.geo(loft([[-0.016, 0.002, 0, 0.004], [-0.008, 0.002, 0, 0.029, 0.034], [0.022, -0.001, 0, 0.032, 0.04], [0.054, -0.005, 0, 0.026, 0.033], [0.09, -0.009, 0, 0.02, 0.024], [0.114, -0.01, 0, 0.021, 0.022], [0.126, -0.01, 0, 0.004]], 14, Y, (p, n, c) => {
        hide(p, n, c); c.lerp(k2.copy(muzzle).multiplyScalar(lit(n, LH)), sm(p.x, 0.092, 0.116));
        c.lerp(k2.copy(white).multiplyScalar(lit(n, LH)), sm(n.y, 0.45, 0.75) * sm(p.x, 0.004, 0.02) * (1 - sm(p.x, 0.096, 0.112)) * (1 - sm(Math.abs(p.z), 0.007, 0.014)));
      }, 2));
      this.gEar = rig.geo(loft([[0, -0.004, 0, 0.004], [0, 0, 0, 0.011, 0.007], [0, 0.015, 0, 0.009, 0.005], [0, 0.032, 0, 0.003, 0.002], [0, 0.037, 0, 0.001]], 8, [1, 0, 0], hide));
      this.iBody = rig.add(this.gBody); this.iNeck = rig.add(this.gNeck); this.iHead = rig.add(this.gHead); this.iEar = [rig.add(this.gEar), rig.add(this.gEar)];
      this.mBody = new THREE.Matrix4(); this.mNeck = new THREE.Matrix4(); this.mHead = new THREE.Matrix4(); this.mEar = new THREE.Matrix4();
    }
    this.parts = [this.iSet, ...this.iBough, this.iBody, this.iNeck, this.iHead, ...this.iEar];
  },

  // ---------------------------------------------------------------- his touches
  buildCards(L, col) {
    const R = () => L.rand(), RR = (a, b) => a + (b - a) * R();
    const geo = new THREE.PlaneGeometry(1, 1), at = this.at = {};
    for (const [name, k] of [['aPos', 3], ['aDir', 3], ['aSize', 2], ['aKind', 4], ['aCol', 3]]) { at[name] = new THREE.InstancedBufferAttribute(new Float32Array(NC * k), k).setUsage(THREE.DynamicDrawUsage); geo.setAttribute(name, at[name]); }
    const cu = { tAtlas: { value: markAtlas(R) }, cDewC: { value: col('#f1f3ee', 0.04).multiplyScalar(1.0) } };
    const m = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide });
    m.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, cu);
      // each mark faces you and lies along its own direction as you see it (end on, it is no longer than it is wide)
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec3 aPos; attribute vec3 aDir; attribute vec2 aSize; attribute vec4 aKind; attribute vec3 aCol; varying vec4 vK; varying vec3 vCol; varying vec2 vQ;')
        .replace('#include <project_vertex>', `vec4 mvPosition = viewMatrix * vec4(aPos, 1.0);
  vQ = position.xy + 0.5; vK = aKind; vCol = aCol;
  { vec3 dv = (viewMatrix * vec4(aDir, 0.0)).xyz; float al = length(dv.xy), sinT = clamp(al / max(length(dv), 1.0e-4), 0.0, 1.0);
    vec2 ax = al > 1.0e-4 ? dv.xy / al : vec2(0.0, 1.0);
    float len = mix(min(aSize.x, aSize.y), aSize.x, sinT);
    mvPosition.xy += ax * position.y * len + vec2(ax.y, -ax.x) * position.x * aSize.y; }
  gl_Position = projectionMatrix * mvPosition;`);
      // thick where the knife left a ridge and thin where it scraped; his white over it where the dew has come
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform sampler2D tAtlas; uniform vec3 cDewC; varying vec4 vK; varying vec3 vCol; varying vec2 vQ;')
        .replace('#include <map_fragment>', `{
  float cx = mod(vK.x, 8.0), cyy = floor(vK.x / 8.0 + 0.01); vec2 q = clamp(vQ, 0.05, 0.95);
  vec4 tx = texture2D(tAtlas, vec2((cx + q.x) * 0.125, (cyy + 1.0 - q.y) * 0.5));
  float a = smoothstep(vK.y, vK.y + 0.16, tx.a) * vK.z;
  if (a < 0.012) discard;
  float wh = smoothstep(0.35, 0.7, tx.b) * vK.w * 0.85, rr = mix(tx.r, 0.5, smoothstep(0.35, 0.7, tx.b) * (1.0 - vK.w));
  diffuseColor = vec4(mix(vCol * (0.3 + 1.42 * rr), cDewC, wh), a);
}`);
    };
    m.customProgramCacheKey = () => 'stoke-marks';
    const mesh = this.cards = new THREE.InstancedMesh(geo, m, NC); mesh.count = 0; mesh.renderOrder = 6; this.n = 0;
    L.add(mesh);

    // his colours: the leaves from near black through olive to the ochre-gold of the outer boughs, a grey-green light
    const leaf = [col('#15130a'), col('#2a2813'), col('#45411f'), col('#695c2a'), col('#94803c', 0.18)], leafG = col('#767a56', 0.2);
    const tone = (t, into) => { const x = clamp01(t) * 3.999, i = Math.floor(x); return into.copy(leaf[i]).lerp(leaf[i + 1], x - i); };
    this.cDew = col('#f1f3ee', 0.04).multiplyScalar(1.02); 
    const cBank = col('#5c3626', 0.2), cStraw = col('#7d6c3a', 0.18);
    // ---- the crown: masses of leaves against the wall under the frame, dark, a little light on the side the sky is
    // on; and long drags hanging from them at the right, where it droops
    const MASS = [[-0.92, 0.57, 0.085, 0.15, 0.1, 0.34], [-0.7, 0.71, 0.08, 0.17, 0.1, 0.4], [-0.45, 0.78, 0.07, 0.17, 0.085, 0.36], [-0.19, 0.78, 0.07, 0.17, 0.085, 0.4], [0.08, 0.74, 0.07, 0.17, 0.09, 0.44], [0.33, 0.68, 0.07, 0.16, 0.09, 0.5],
      [0.56, 0.58, 0.07, 0.15, 0.1, 0.56], [0.73, 0.45, 0.07, 0.11, 0.1, 0.5], [-0.66, 0.54, 0.115, 0.14, 0.08, 0.14], [-0.28, 0.61, 0.105, 0.16, 0.08, 0.16], [0.14, 0.57, 0.1, 0.16, 0.07, 0.2], [0.46, 0.46, 0.08, 0.12, 0.07, 0.24], [-0.53, 0.55, 0.2, 0.15, 0.07, 0.2]];
    const C = this.crown = [];
    MASS.forEach(([u, h, o, ru, rh, tn], mi) => {
      // (its dark body first, then the touches over it, lighter up and to the left where the sky is)
      for (let i = 0; i < 2; i++) C.push({ u: u + (i - 0.5) * ru * 0.8, h: Math.min(0.75, h + RR(-0.3, 0.2) * rh), o: o - 0.018, s: ru * RR(1.0, 1.2), slot: BODY, len: RR(0.66, 0.84), a: RR(-0.5, 0.5), c: tone(tn - 0.3, new THREE.Color()), k: 0.8, ph: R() * TAU, r: R() * 0.5, under: true });
      for (let i = 0; i < 7; i++) { const a = R() * TAU, r = Math.sqrt(R()), c = tone(tn + RR(-0.2, 0.16) - 0.16 * Math.cos(a) * r + 0.12 * Math.sin(a) * r, new THREE.Color()); if (R() < 0.1) c.lerp(leafG, 0.5); C.push({ u: u + Math.cos(a) * r * ru, h: Math.min(0.79, h + Math.sin(a) * r * rh), o: o + RR(-0.012, 0.02), s: RR(0.12, 0.18), slot: CLUMP + Math.floor(R() * 3), len: 1.2, a: RR(-0.7, 0.5), c, k: RR(0.85, 1.12), ph: R() * TAU, r: R() }); }
      if (mi >= 5 && mi <= 7) for (let i = 0; i < 3; i++) C.push({ u: u + RR(-ru, ru) * 0.8, h: h - rh * RR(0.2, 0.8), o: o + 0.025, s: RR(0.03, 0.042), slot: DRAG, len: RR(4.5, 7), a: RR(-0.12, 0.22), c: tone(tn + RR(-0.3, 0.0), new THREE.Color()), k: RR(0.9, 1.1), ph: R() * TAU, r: R(), hang: true });
    });
    C.sort((a, b) => a.o - b.o);
    // ---- the hedge at the foot of the wall: dark under the tree, olive and straw behind the horse, the red bank at the right
    const HG = this.hedge = [];
    for (let i = 0; i < 30; i++) {
      const u = -1.14 + 2.04 * (i + R() * 0.8) / 30, c = new THREE.Color(), right = sm(u, 0.45, 0.9), under = 1 - sm(Math.abs(u + 0.55), 0.1, 0.45);
      tone(lerp(0.5, 0.12, under) + RR(-0.15, 0.2), c); if (R() < right * 0.75) c.lerp(cBank, 0.55); else if (R() < 0.3 * (1 - under)) c.lerp(cStraw, 0.6);
      HG.push({ u, h: RR(0.035, 0.15) * (1 - 0.35 * under) * (1 - 0.45 * right), o: RR(0.035, 0.085), s: RR(0.1, 0.15), slot: CLUMP + i % 3, len: 1.2, a: RR(-0.8, 0.4), c, k: RR(0.8, 1.05), ph: R() * TAU, r: R() });
    }
    for (let i = 0; i < 9; i++) { const u = -1.08 + 1.95 * (i + R() * 0.6) / 9; HG.unshift({ u, h: RR(0.03, 0.07), o: 0.03, s: RR(0.24, 0.3), slot: BODY, len: RR(0.42, 0.55), a: Math.PI / 2 + RR(-0.2, 0.2), c: tone(RR(0.02, 0.2), new THREE.Color()), k: 0.8, ph: 0, r: R() * 0.5, under: true }); }
    // an elder in flower beside the trunk, as he has one
    for (let i = 0; i < 4; i++) HG.push({ u: -0.86 + RR(-0.09, 0.09), h: 0.19 + RR(-0.05, 0.08), o: 0.1 + RR(0, 0.03), s: RR(0.11, 0.14), slot: CLUMP + i % 3, len: 1.2, a: RR(-0.8, 0.4), c: tone(RR(0.2, 0.45), new THREE.Color()), k: 0.95, ph: R() * TAU, r: R() });
    for (let i = 0; i < 4; i++) HG.push({ u: -0.86 + RR(-0.09, 0.09), h: 0.2 + RR(-0.05, 0.08), o: 0.13 + RR(0, 0.02), s: RR(0.034, 0.048), slot: BLOSSOM, len: 1.1, a: RR(-0.5, 0.5), c: col('#d9d4c2', 0.1), k: 0.95, ph: R() * TAU, r: R() });
    // ---- grass, in tufts round the edges of the lane
    this.tufts = [[-0.95, 0.42], [-0.76, 0.74], [-0.56, 0.98], [-0.3, 0.86], [-0.1, 1.17], [0.62, 0.64], [0.74, 0.9], [0.56, 1.16], [0.8, 0.36], [-1.05, 0.16], [-0.34, 0.26]]
      .map(([u, o]) => ({ u: u + RR(-0.03, 0.03), o, s: RR(0.06, 0.095), c: tone(RR(0.3, 0.7), new THREE.Color()), k: RR(0.85, 1.1), lean: RR(-0.25, 0.25), r: R() })).sort((a, b) => a.o - b.o);
    // ---- the bough's leaves: the lit, golden ones, in clusters along it (which length, how far along, to the side,
    // up), each three clumps, a lit dab, and drags hanging under it; more and longer towards the tip
    const CL = this.clusters = [[0, 0.45, -0.03, 0.03, 2], [0, 0.85, 0.04, 0.035, 2], [1, 0.2, -0.05, 0.03, 2], [1, 0.5, 0.045, 0.03, 3], [1, 0.8, -0.035, 0.035, 3], [2, 0.1, 0.05, 0.03, 3], [2, 0.32, -0.045, 0.03, 3], [2, 0.54, 0.04, 0.028, 3], [2, 0.74, -0.03, 0.025, 4], [2, 0.9, 0.03, 0.02, 4], [2, 1.03, 0, 0.015, 5]]
      .map(([seg, f, side, up, nd], ci, all) => {
        const along = (seg + Math.min(f, 1)) / 3, tn = lerp(0.56, 0.94, along), last = ci === all.length - 1;
        return {
          seg, f, side, up, along, last, under: { s: RR(0.13, 0.16), a: RR(-0.4, 0.4), c: tone(tn - 0.42, new THREE.Color()), r: R() * 0.5 },
          clumps: Array.from({ length: 3 }, (_, i) => ({ slot: CLUMP + (ci + i) % 3, du: RR(-0.05, 0.05), dh: RR(-0.02, 0.035) - 0.012 * i, dv: RR(-0.04, 0.04), s: RR(0.11, 0.15), a: RR(-0.9, 0.1), c: tone(tn + RR(-0.22, 0.06) - 0.16 * (2 - i), new THREE.Color()), k: RR(0.9, 1.12), r: R() })),
          dab: { slot: CLUMP + (ci + 1) % 3, du: RR(-0.03, 0.03), dh: RR(0.015, 0.04), dv: RR(0, 0.03), s: RR(0.07, 0.09), a: RR(-0.7, 0.3), c: tone(tn + 0.1, new THREE.Color()).lerp(leafG, R() * 0.3), k: 1.08, r: R() },
          drags: Array.from({ length: nd }, (_, i) => ({ du: RR(-0.055, 0.055), dh: RR(-0.04, -0.01), dv: RR(-0.05, 0.05), len: RR(0.08, 0.125) + 0.085 * along * R() + (last && i === 0 ? 0.05 : 0), w: RR(0.022, 0.032), c: tone(tn + RR(-0.34, 0.08), new THREE.Color()), k: RR(0.9, 1.12), ph: R() * TAU, r: R() })),
        };
      });
    // ---- the dew: beads on the drags' tips and under the clumps, and some up in the crown that stay
    const B = this.beads = [];
    CL.forEach((c, ci) => {
      c.drags.forEach((d, di) => B.push({ kind: 0, c, d, along: c.along, tipmost: c.last && di === 0 }));
      for (let i = 0; i < (ci > 4 ? 3 : 2); i++) B.push({ kind: 1, c, du: RR(-0.06, 0.06), dh: RR(-0.06, -0.03), dv: RR(-0.05, 0.05), along: c.along });
    });
    for (const b of B) {
      b.ap = b.tipmost ? 0.3 : R() * 0.92; b.sz = b.tipmost ? 0.026 : RR(0.011, 0.018) * (0.85 + 0.3 * b.along); b.jit = R(); b.ph = R() * TAU; b.single = -1;
      b.rel = new THREE.Vector3(); b.relK = -1; b.F = 0; b.land = 0; b.y1 = 0; b.where = 0;
      b.late = b.tipmost ? 0 : 0.03 + 0.92 * Math.pow(1 - b.along, 0.85) + 0.1 * b.jit;       // the bough lets go from the tip inwards
    }
    this.still = Array.from({ length: 14 }, () => { const m = MASS[Math.floor(R() * 8)]; return { u: m[0] + RR(-1, 1) * m[3], h: m[1] + RR(-1, 0.6) * m[4], o: m[2] + 0.03, sz: RR(0.009, 0.014), ap: R(), ph: R() * TAU }; });
    this.mist = Array.from({ length: 30 }, (_, i) => ({ u: -1.05 + 1.8 * (i + R()) / 30, o: RR(0.2, 1.2), s: RR(0.008, 0.015), ph: R() * TAU, r: R() }));
    // ---- the horse's touches: mane, forelock, tail, the light along its back
    this.cCoatL = col('#4c3c2e', 0.18); this.cHair = col('#120e0a'); this.cHairL = col('#2b2019');
    this.mane = [0.0, 0.028, 0.056, 0.084, 0.11].map(x => ({ x, len: RR(0.06, 0.085) * HS, w: RR(0.024, 0.03) * HS, r: R(), ph: R() * TAU }));
    this.tail = Array.from({ length: 4 }, (_, i) => ({ len: RR(0.16, 0.2) * HS, w: RR(0.026, 0.034) * HS, z: (i - 1.5) * 0.012, r: R(), ph: R() * TAU }));
    this.spray = Array.from({ length: 12 }, (_, i) => ({ burst: i % 3, a: R() * TAU, up: RR(0.25, 0.7), sp: RR(0.25, 0.5), r: R() }));
    this.rings = Array.from({ length: NRING }, () => ({ u: 0, o: 0, age: 9, amp: 0 }));
  },

  // ---------------------------------------------------------------- the clock: which filling this is (o.S: its beads
  // begin; o.H: the bough lets go)
  cyc(t, o) {
    if (t < T_LOOP) { o.k = 0; o.S = T_BEAD; o.H = T_SHED; }
    else { const k = Math.floor((t - T_LOOP) / P_LOOP); o.k = k + 1; o.S = T_LOOP + k * P_LOOP + 0.3; o.H = T_LOOP + k * P_LOOP + D_SHED; }
    return o;
  },
  // the bough with the weight gone, tt seconds after: up past its rest and bobbing down to it (calm: up to it, once)
  spring(tt, calm) {
    if (tt < 0) return S_EQ;
    if (calm) return S_EQ + (S_MAX - S_EQ) * Math.exp(-tt * 1.5) * (1 + 1.5 * tt);
    return S_EQ + (S_MAX - S_EQ) * Math.exp(-1.75 * tt) * Math.cos(TAU * 1.28 * tt);
  },
  sagAt(t, calm) {
    const c = this.cyc(t, this.cy);
    if (t >= c.H) return this.spring(t - c.H, calm);
    if (t < c.S) return c.k === 0 ? S_EQ : this.spring(t - (c.k === 1 ? T_SHED : c.H - P_LOOP), calm);
    const q = (t - c.S) / (c.H - c.S); let s = S_EQ + (S_MAX - S_EQ) * Math.pow(ease.smooth(q), 1.1) * (c.k ? 0.8 : 1);
    if (c.k) s = Math.max(s, this.spring(t - (c.k === 1 ? T_SHED : c.H - P_LOOP), calm));
    // each single drop that lets go lightens it for a moment
    for (const f of SINGLES) { const x = t - (c.S + f * (c.H - c.S)); if (x > 0 && x < 0.6) s -= 0.014 * Math.exp(-x * 7) * Math.sin(x * 22) * (calm ? 0 : 1) + 0.006 * Math.exp(-x * 5); }
    // and at its lowest it trembles
    if (!calm) s += 0.0035 * Math.sin(t * 41) * sm(t, c.H - 0.5, c.H - 0.1);
    return s;
  },
  newPose() { return { t: -1, calm: null, P: [0, 1, 2, 3].map(() => new THREE.Vector3()), D: [0, 1, 2].map(() => new THREE.Vector3()), U: [0, 1, 2].map(() => new THREE.Vector3()), Z: [0, 1, 2].map(() => new THREE.Vector3()), fl: 0 }; },
  // the bough at time t (in the scene's own frame: x along the wall, y up, z out)
  pose(t, calm, o) {
    if (o.t === t && o.calm === calm) return o;
    o.t = t; o.calm = calm;
    const s = this.sagAt(t, calm), yaw = 0.018 * Math.sin(t * 0.8) * (calm ? 0.5 : 1); let cum = 0;
    o.P[0].set(BJ[0][0], BJ[0][1], BJ[0][2]);
    for (let i = 0; i < 3; i++) {
      const b = this.BS[i]; cum += s * BW[i]; const e = b.e - cum, cy = Math.cos(yaw * (i + 1)), sy = Math.sin(yaw * (i + 1)), hx = b.hx * cy - b.hz * sy, hz = b.hx * sy + b.hz * cy;
      o.D[i].set(hx * Math.cos(e), Math.sin(e), hz * Math.cos(e)); o.U[i].set(-hx * Math.sin(e), Math.cos(e), -hz * Math.sin(e)); o.Z[i].crossVectors(o.D[i], o.U[i]);
      o.P[i + 1].copy(o.P[i]).addScaledVector(o.D[i], b.len);
    }
    // how the leaves swing after it lets go
    const c = this.cyc(t, this.cy), tt = t - c.H, t0 = c.k === 0 ? -1 : t - (c.k === 1 ? T_SHED : c.H - P_LOOP), x = tt >= 0 ? tt : t0;
    o.fl = x >= 0 ? Math.exp(-1.5 * x) * (calm ? 0.35 : 1) : 0; o.flT = x;
    return o;
  },
  clusterAt(c, o, into) { const i = c.seg; return into.copy(o.P[i]).addScaledVector(o.D[i], c.f * this.BS[i].len).addScaledVector(o.U[i], c.up).addScaledVector(o.Z[i], c.side); },
  // a drag's hanging direction: down, swinging after the bough has let go
  dragDir(d, o, t, into) {
    const sw = o.fl * 0.42 * Math.sin(TAU * 1.5 * o.flT - d.ph) + 0.03 * Math.sin(t * 1.1 + d.ph);
    return into.set(sw * 0.8 + 0.05 * (d.r - 0.5), -1, sw * 0.6 + 0.08).normalize();
  },
  // where bead b hangs at time t
  beadAt(b, t, calm, o, into) {
    this.pose(t, calm, o); const c = b.c;
    this.clusterAt(c, o, into);
    if (b.kind === 0) { const d = b.d; into.x += d.du; into.y += d.dh; into.z += d.dv; this.dragDir(d, o, t, this.v2); into.addScaledVector(this.v2, d.len * 0.98); }
    else { into.x += b.du; into.y += b.dh; into.z += b.dv; }
    return into;
  },
  // when bead b lets go in a filling, and where it lands
  fallOf(b, c, calm) {
    if (b.relK === c.k && b.relCalm === calm) return;
    b.relK = c.k; b.relCalm = calm;
    b.A = c.S + b.ap * (c.H - c.S - 0.75);
    b.F = b.single >= 0 ? c.S + SINGLES[b.single] * (c.H - c.S) : c.H + b.late;
    this.beadAt(b, b.F, calm, this.poseTmp, b.rel);
    b.where = onHorse(b.rel.x, b.rel.z) ? 2 : inPud(b.rel.x, b.rel.z) ? 1 : 0;
    b.y1 = b.where === 2 ? 0.278 * HS : 0.014;
    b.land = b.F + Math.sqrt(2 * Math.max(0.01, b.rel.y - b.y1) / GRAV);
  },

  // ---------------------------------------------------------------- sound: drops, leaves, a horse
  makeScore(L, calm) {
    const s = score(L), v = calm ? 0.6 : 1, att = calm ? 0.02 : 0.004, c = { k: 0, S: 0, H: 0 };
    const pent = [587.3, 659.3, 740, 880, 987.8, 1174.7, 1318.5, 1480];
    const drop = (list, t, b, i) => {
      if (b.where === 1) { const f = pent[(i * 5 + Math.floor(b.jit * 3)) % pent.length] * (b.sz > 0.025 ? 0.5 : 1); list.push({ t, f, d: 0.13, type: 'sine', vol: 0.02 * v * (b.sz > 0.025 ? 1.5 : 1), attack: att, to: f * 1.9 }, { t: t + 0.004, noise: true, d: 0.03, vol: 0.006 * v, hp: 2600, attack: att }); }
      else if (b.where === 2) list.push({ t, noise: true, d: 0.05, vol: 0.006 * v, lp: 900, attack: att + 0.004 });
      else list.push({ t, noise: true, d: 0.035, vol: 0.005 * v, hp: 1800, lp: 5200, attack: att });
    };
    const fill = (k, t0, list) => {
      this.cyc(k ? T_LOOP + (k - 1) * P_LOOP + 1 : 0, c);
      this.beads.forEach((b, i) => { this.fallOf(b, c, calm); drop(list, b.land - t0, b, i); });
      const H = c.H - t0;
      list.push({ t: H + 0.03, noise: true, d: 0.75, vol: 0.013 * v, hp: 1500, lp: 6500, attack: calm ? 0.2 : 0.07 });                          // the leaves, as it comes up
      list.push({ t: H + 0.05, f: 92, d: 0.3, type: 'sine', vol: 0.012 * v, to: 128, attack: calm ? 0.12 : 0.05 });                               // and the wood
      // the horse: its mane (k 0 and every other filling), and then it blows
      if (k === 0 || k === 1) {
        const sp = calm ? 2 : 1;
        for (let i = 0; i < 4; i++) list.push({ t: H + 0.82 + i * 0.2 * sp, noise: true, d: 0.08, vol: 0.008 * v, lp: 1300, attack: 0.012 }, { t: H + 0.84 + i * 0.2 * sp, f: [3136, 3520, 2794, 3322][i], d: 0.07, type: 'sine', vol: 0.0035 * v, attack: 0.006 });
        for (let i = 0; i < 4; i++) list.push({ t: H + 2.0 + i * 0.075, noise: true, d: 0.1, vol: 0.015 * v * (1 - i * 0.2), bp: 430, q: 0.9, attack: calm ? 0.03 : 0.012 });
        list.push({ t: H + 2.0, f: 104, d: 0.34, type: 'sine', vol: 0.006 * v, to: 82, attack: 0.04 });
      }
      this.beads.forEach(b => { b.relK = -1; });
    };
    const first = []; fill(0, 0, first); for (const e of first) { if (e.noise) s.hit(e.t, e); else s.note(e.t, e.f, e.d, e); }
    s.hit(0.1, { d: 1.7, vol: 0.008 * v, lp: 900, hp: 200, attack: 0.7 });                    // the morning coming out over the floor
    // (and again while you look: at every other filling the horse only turns an ear, and at the ones between it shakes)
    const again = []; fill(1, T_LOOP, again); const quiet = again.filter(e => !(e.bp || (e.f && e.f > 2500) || e.lp === 1300 || e.f === 104));
    s.loop(T_LOOP, P_LOOP * 2, [...quiet, ...again.map(e => ({ ...e, t: e.t + P_LOOP }))]);
    return s.done();
  },

  hideAll() {
    this.cards.count = 0; this.cards.visible = false; this.ground.material.visible = false;
    for (const i of this.parts) this.rig.show(i, false);
    this.rig.mesh.visible = false;
  },
  start(L, resumed) { if (!resumed) this.hideAll(); for (const b of this.beads) b.relK = -1; this.band.from(L.t); },
  back(L) { this.bT = L.t; this.g0 = this.grow; },
  end() { this.hideAll(); },
  reset() { this.hideAll(); },

  // ---------------------------------------------------------------- a mark at (x, y, z) in the scene's frame, lying
  // along (dx, dy, dz): len long, wid wide; cut is how much of its paint has not come yet
  put(x, y, z, dx, dy, dz, len, wid, slot, cut, al, c, k = 1, dew = 0) {
    if (al <= 0.004 || cut >= 0.99 || this.n >= NC) return;
    const n = this.n++, a = n * 3, T = this.T3, N = this.N3, O = this.O, at = this.at;
    const P = at.aPos.array, D = at.aDir.array, Z = at.aSize.array, K = at.aKind.array, C = at.aCol.array;
    P[a] = O.x + T.x * x + N.x * z; P[a + 1] = O.y + y; P[a + 2] = O.z + T.z * x + N.z * z;
    D[a] = T.x * dx + N.x * dz; D[a + 1] = dy; D[a + 2] = T.z * dx + N.z * dz;
    Z[n * 2] = len; Z[n * 2 + 1] = wid; K[n * 4] = slot; K[n * 4 + 1] = cut; K[n * 4 + 2] = al; K[n * 4 + 3] = dew; C[a] = c.r * k; C[a + 1] = c.g * k; C[a + 2] = c.b * k;
  },
  // how much of a mark at (u, h, o) has come (r: its own lateness), and the same as a colour: white first
  came(u, h, o, r, g = this.grow) { return sm(g * 1.7 - 0.3 - reach(u, o) - 0.1 * h - 0.2 * r, 0, 0.22); },
  // a mark that arrives as dew does: a fleck of white that spreads into its own colour
  mark(u, h, o, dx, dy, dz, len, wid, slot, c, k, r, dew = 0, al = 1) {
    const a = this.came(u, h, o, r), a1 = a > 0 ? 1 : this.came(u, h, o, r, this.grow1); if (a1 <= 0) return;
    const w = sm(a, 0.04, 0.4), kc = this.kc.copy(this.cDew).lerp(c, w);
    this.put(u, h, o, dx, dy, dz, len, wid, slot, lerp(lerp(1, 0.84, a1), 0.2, ease.inOut(a)), al, kc, lerp(0.85, k, w), dew);
  },

  update(L, dt) {
    const calm = L.calm; if (calm !== this.calm) { this.calm = calm; this.band = this.bands[calm ? 1 : 0]; this.band.from(L.t); for (const b of this.beads) b.relK = -1; }
    const ret = L.phase === 'return', Rr = ret ? L.ret : 0, t = ret ? this.bT + L.r : L.t;
    const grow = this.grow = ret ? this.g0 * (1 - sm(Rr, 0.22, 1)) : 0.16 + 0.84 * Math.pow(ramp(t, 0.05, 2.0), 0.9);
    const grow1 = this.grow1 = grow + (ret ? 0.3 * (1 - sm(Rr, 0.55, 1)) : 0.34 * sm(t, 0, 0.3));      // the dew goes ahead of everything, and is the last to go
    const lift = ret ? sm(Rr, 0, 0.5) : 0;                                   // the dew going up off everything
    const gu = this.gu, ru = this.ru;
    this.ground.material.visible = true; this.rig.mesh.visible = true; this.cards.visible = true;
    gu.uT.value = t; gu.uGrow.value = grow; gu.uGrow1.value = grow1; gu.uWake.value = ret ? 0 : 1 - sm(t, 1.7, 2.4); gu.uTw.value = calm ? 0.35 : 1;
    gu.uDew.value = sm(t, 1.3, 3.8) * (1 - lift); ru.uGrow.value = grow; ru.uDewR.value = sm(t, 1.5, 4) * (1 - lift);
    const c = this.cyc(t, this.cyNow), k = c.k, S = c.S, H = c.H, o = this.pose(t, calm, this.poseNow), v = this.v, v2 = this.v2, rig = this.rig, m4 = this.m4;
    this.n = 0;

    // ---- the set (tree and cart), and the bough
    for (const i of this.parts) rig.show(i, true);
    rig.mat(this.iSet, this.M0);
    for (let i = 0; i < 3; i++) { m4.makeBasis(o.D[i], o.U[i], o.Z[i]).setPosition(o.P[i]).premultiply(this.M0); rig.mat(this.iBough[i], m4); }

    // ---- the horse. sinceH: seconds since the bough last let go (it shakes its mane after the first, and then after
    // every other one)
    const lastH = t >= H ? H : k === 0 ? -99 : k === 1 ? T_SHED : H - P_LOOP, sinceH = t - lastH, kk = t >= H ? k : k - 1, shaker = kk >= 0 && kk % 2 === 0;
    const sp = calm ? 0.5 : 1, x0 = sinceH - 0.75, shE = shaker ? Math.pow(hump(x0, 0, 1.0 / sp), 0.7) : 0, shA = (calm ? 0.2 : 0.42) * shE, shake = shA * Math.sin(TAU * 4.6 * sp * x0), shakeV = shA * Math.cos(TAU * 4.6 * sp * x0);
    // (it hears each single drop: the near ear turns, and at the third it looks round)
    let ear = 0, look = 0;
    for (let i = 0; i < 3; i++) { const b = this.singles[i], x = t - (b && b.relK === k ? b.land : S + SINGLES[i] * (H - S) + 0.3); ear = Math.max(ear, hump(x, 0.02, 0.5)); if (i === 2) look = hump(x, 0.05, 1.2); }
    const up = shaker ? sm(sinceH, 0.42, 0.75) * (1 - sm(sinceH, 2.3, 3.5)) : 0.35 * sm(sinceH, 0.5, 0.9) * (1 - sm(sinceH, 1.6, 2.6));
    const after = sm(sinceH, 1.9, 2.3) * (1 - sm(sinceH, 2.9, 3.6)) * (shaker ? 1 : 0.6);       // it looks round at the puddle
    const breathe = Math.sin(t * 1.3);
    const neckUp = 0.46 + 0.5 * up + 0.1 * look + 0.012 * breathe - 0.08 * after, neckYaw = 0.42 * look + 0.2 * up + 0.5 * after, headRel = -1.12 - 0.16 * up + 0.1 * look + 0.14 * after;
    const B = this.bones, hd = HORSE;
    B.set(this.mBody, hd.u, 0, hd.o, this.yawH, shake * 0.12, 0, HS); this.mBody.premultiply(this.M0);
    B.child(this.mNeck, this.mBody, 0.108, 0.248, 0, neckYaw, 0, neckUp); this.mNeck.multiply(this.rx.makeRotationX(shake));
    B.child(this.mHead, this.mNeck, 0.126, 0.004, 0, neckYaw * 0.6, 0, headRel); this.mHead.multiply(this.rx.makeRotationX(shakeV * 0.5));
    rig.mat(this.iBody, this.mBody); rig.mat(this.iNeck, this.mNeck); rig.mat(this.iHead, this.mHead);
    // the ears: laid back a little at rest; the near one (its left) turning to a drop; both pricked when its head is up
    const idle = hump((t * 0.37 + 0.3) % 1, 0.0, 0.16);
    for (let i = 0; i < 2; i++) { const sd = i ? 1 : -1, near = i === 0 ? 1 : 0.25, pr = Math.max(up, after); B.child(this.mEar, this.mHead, 0.0, 0.024, sd * 0.015, sd * (0.5 - 0.9 * ear * near - 0.3 * idle * near), sd * (0.42 - 0.2 * pr), 0.95 - 0.5 * pr - 0.25 * ear * near + 0.35 * shE); rig.mat(this.iEar[i], this.mEar); }

    // ---- the marks, from the wall outwards
    const put = this.put.bind(this), breath = calm ? 0.5 : 1;
    // (his white on the leaves: it comes with the dew; and the bough's goes when the bough lets go)
    const dew = sm(t, 1.5, 4) * (1 - lift), wet = this.wet = (t >= H ? 1 - sm(t, H, H + 1.0) : t < S ? 0 : sm(t, S, H - 0.3)) * (1 - lift);
    for (const q of this.hedge) this.mark(q.u, q.h, q.o, Math.sin(q.a), Math.cos(q.a), 0, q.s * q.len, q.s, q.slot, q.c, q.k, q.r, q.under ? 0 : dew);
    for (const q of this.crown) {
      const du = 0.004 * breath * Math.sin(t * 0.7 + q.ph), dh = 0.003 * breath * Math.sin(t * 0.9 + q.ph * 1.7);
      if (q.hang) { const sw = 0.05 * breath * Math.sin(t * 0.8 + q.ph); this.mark(q.u + du + sw * q.s * q.len * 0.5, q.h - q.s * q.len * 0.5, q.o, q.a + sw, -1, 0.05, q.s * q.len, q.s, DRAG, q.c, q.k, q.r, dew); }
      else this.mark(q.u + du, q.h + dh, q.o, Math.sin(q.a), Math.cos(q.a), 0, q.s * q.len, q.s, q.slot, q.c, q.k, q.r, q.under ? 0 : dew);
    }
    // the dew that stays up in the crown
    const dewAl = 1 - lift;
    for (const q of this.still) { const g = sm(t, 1.8 + q.ap * 2.2, 2.9 + q.ap * 2.2) * this.came(q.u, q.h, q.o, 0); if (g > 0) put(q.u, q.h + lift * 0.1, q.o, 0, -1, 0, q.sz * 1.2 * g, q.sz * g, FLECK, 0.2, dewAl, this.cDew, this.glint(t, q.ph, calm)); }
    // the clusters on the first length of the bough stand behind the horse
    this.leaves(0, 2, o, t);
    this.horseMarks(t, calm, sinceH, shaker, shakeV, x0, sp);
    this.leaves(2, this.clusters.length, o, t);

    // ---- the beads, the drops, the rings in the puddle
    const rings = this.rings; for (const r of rings) { r.age = 9; r.amp = 0; }
    for (const b of this.beads) {
      this.fallOf(b, c, calm);
      const g = clamp01((t - b.A) / 1.3);
      if (t < b.A) continue;
      if (t < b.F) {
        // gathering: it swells, and hangs lower as it does
        const sz = b.sz * ease.out(g) * (0.6 + 0.4 * sm(t, b.F - 0.5, b.F));
        this.beadAt(b, t, calm, o, v);
        if (this.came(v.x, v.y, v.z, 0) < 0.9) continue;
        if (lift > 0) put(v.x, v.y + lift * 0.16, v.z, 0, 1, 0, sz * 1.2 * (1 - 0.4 * lift), sz * (1 - 0.4 * lift), FLECK, 0.2, 1 - lift, this.cDew, 0.95);
        else put(v.x, v.y - sz * 0.45, v.z, 0, -1, 0, sz * 1.25, sz, FLECK, 0.2, 1, this.cDew, this.glint(t, b.ph, calm));
      } else if (t < b.land) {
        const x = t - b.F, y = b.rel.y - 0.5 * GRAV * x * x, sp2 = GRAV * x;
        put(b.rel.x, y, b.rel.z, 0, -1, 0, 0.03 + 0.022 * sp2, 0.014 + b.sz * 0.25, DROP, 0.2, dewAl, this.cDew, 1.15);
      } else {
        const x = t - b.land;
        // it lands: a small crown of spray, and in the puddle a ring
        if (x < 0.22) { const q = x / 0.22, s = b.sz * (1.2 + 1.8 * q); put(b.rel.x, b.y1 + 0.006 + 0.03 * q * (1 - 0.6 * q), b.rel.z, 1, 0, 0, s * 1.5, s * 0.7, b.where === 1 ? BLOSSOM : FLECK, 0.2 + 0.6 * q, (1 - q) * dewAl, this.cDew, 1.1); }
        if (b.where === 1 && x < 1.5) { let slot = -1, old = -1; for (let i = 0; i < NRING; i++) if (rings[i].age > old) { old = rings[i].age; slot = i; } if (x < old) { const r = rings[slot]; r.u = b.rel.x; r.o = b.rel.z; r.age = x; r.amp = (0.45 + 18 * b.sz) * dewAl; } }
      }
    }
    const UR = gu.uRing.value; for (let i = 0; i < NRING; i++) UR[i].set(rings[i].u, rings[i].o, rings[i].age, rings[i].amp);

    // ---- grass, nearest last
    for (const q of this.tufts) this.mark(q.u, q.s * 0.5, q.o, q.lean + 0.03 * breath * Math.sin(t * 0.9 + q.r * 6), 1, 0, q.s * 1.1, q.s, TUFT, q.c, q.k, q.r, dew);
    // ---- going: the dew lifts off the grass as the morning warms, fleck by fleck, and thins away
    if (ret) for (const q of this.mist) { const x = clamp01((Rr - 0.25 * q.r) / (0.55 + 0.2 * q.r)), a = hump(x, 0, 1); if (a > 0) put(q.u + 0.02 * Math.sin(x * 5 + q.ph), 0.02 + (0.14 + 0.36 * q.r) * ease.out(x), q.o, 0, 1, 0, q.s * 1.2, q.s, FLECK, 0.2, a * 0.9, this.cDew, 0.95); }

    const at = this.at; this.cards.count = this.n; this.cards.visible = this.n > 0;
    for (const key in at) at[key].needsUpdate = true;
    L.voice().place();
    if (!ret && L.phase !== 'after') this.band.play(L.t);
  },

  // a bead's light: steady, with a slow shimmer; and (not when calm) now and then a glint
  glint(t, ph, calm) { return 0.9 + 0.1 * Math.sin(t * 1.7 + ph) + (calm ? 0 : 0.4 * Math.pow(Math.max(0, Math.sin(t * 2.9 + ph * 3)), 12)); },

  // the bough's clusters from a to b: clumps, a lit dab, and the drags hanging under them
  leaves(a, b, o, t) {
    const v = this.v, d = this.v2, w = this.wet;
    for (let i = a; i < b; i++) {
      const c = this.clusters[i]; this.clusterAt(c, o, v); const x = v.x, y = v.y, z = v.z;
      this.mark(x, y - 0.012, z - 0.012, Math.sin(c.under.a), Math.cos(c.under.a), 0, c.under.s * 0.76, c.under.s, BODY, c.under.c, 0.8, c.under.r);
      for (const q of c.drags) { this.dragDir(q, o, t, d); this.mark(x + q.du + d.x * q.len * 0.5, y + q.dh + d.y * q.len * 0.5, z + q.dv + d.z * q.len * 0.5, d.x, d.y, d.z, q.len, q.w, DRAG, q.c, q.k, q.r, w); }
      for (const q of c.clumps) this.mark(x + q.du, y + q.dh, z + q.dv, Math.sin(q.a), Math.cos(q.a), 0, q.s * 1.2, q.s, q.slot, q.c, q.k, q.r, w);
      const q = c.dab; this.mark(x + q.du, y + q.dh, z + q.dv, Math.sin(q.a), Math.cos(q.a), 0, q.s * 1.2, q.s, q.slot, q.c, q.k, q.r, w);
    }
  },

  // the horse's touches, on its bones
  horseMarks(t, calm, sinceH, shaker, shakeV, x0, sp) {
    const v = this.v, d = this.v2, hd = HORSE;
    const a = this.came(hd.u, 0.2, hd.o, 0.8); if (a <= 0) return;
    const cut = lerp(0.93, 0.2, a), w2s = this.w2s || (this.w2s = new THREE.Matrix4().copy(this.M0).invert());
    // (a point and a direction on a bone, into the scene's frame)
    const at = (m, x, y, z) => v.set(x, y, z).applyMatrix4(m).applyMatrix4(w2s), dir = (m, x, y, z) => d.set(x, y, z).transformDirection(m).transformDirection(w2s);
    // the light along its back
    for (const [x, y, z, l] of [[-0.105, 0.29, -0.028, 0.075], [-0.01, 0.276, -0.036, 0.085], [0.075, 0.289, -0.028, 0.06]]) { at(this.mBody, x, y, z); const px = v.x, py = v.y, pz = v.z; dir(this.mBody, 1, 0.05, 0); this.put(px, py, pz, d.x, d.y, d.z, l * HS, 0.022 * HS, DAB, cut, 0.5, this.cCoatL, 1); }
    // the tail: long dark drags from the dock, swinging once when it has shaken
    const swish = hump(sinceH, 2.2, 3.1) * Math.sin((sinceH - 2.2) * 9) * (calm ? 0.3 : 0.7) + 0.06 * Math.sin(t * 0.9);
    for (const q of this.tail) { at(this.mBody, -0.168, 0.25, q.z); const px = v.x, py = v.y, pz = v.z; dir(this.mBody, -0.22 - 0.1 * q.r, -1, q.z * 4 - swish * (0.6 + q.r)); this.put(px + d.x * q.len * 0.5, py + d.y * q.len * 0.5, pz + d.z * q.len * 0.5, d.x, d.y, d.z, q.len, q.w, DRAG, cut, 1, q.r > 0.5 ? this.cHair : this.cHairL, 1); }
    // the mane, lying on its near side; it flies when the neck shakes
    for (const q of this.mane) {
      at(this.mNeck, q.x, 0.045 - q.x * 0.1, -0.026); const px = v.x, py = v.y, pz = v.z;
      dir(this.mNeck, -0.3, -1, -0.5 - 2.2 * shakeV * (0.6 + 0.8 * q.r)); d.y -= 0.6; d.normalize();
      this.put(px + d.x * q.len * 0.5, py + d.y * q.len * 0.5, pz + d.z * q.len * 0.5, d.x, d.y, d.z, q.len, q.w, DRAG, cut, 1, q.r > 0.4 ? this.cHair : this.cHairL, 1);
    }
    at(this.mHead, 0.012, 0.03, -0.006); { const px = v.x, py = v.y, pz = v.z; dir(this.mHead, 1, 0.1, -0.2); this.put(px + d.x * 0.02, py + d.y * 0.02, pz + d.z * 0.02, d.x, d.y, d.z, 0.045 * HS, 0.02 * HS, DRAG, cut, 1, this.cHair, 1); }
    // and the drops it throws off
    if (shaker && x0 > 0 && x0 < 1.3 / sp) {
      at(this.mNeck, 0.07, 0.03, 0); const px = v.x, py = v.y, pz = v.z;
      for (const q of this.spray) { const x = (x0 * sp - 0.12 - q.burst * 0.22) / 0.4; if (x <= 0 || x >= 1) continue; const r = q.sp * 0.4 * x; this.put(px + Math.cos(q.a) * r, py + q.up * 0.4 * x * 0.5 - 0.3 * x * x * 0.4 + 0.02, pz + Math.sin(q.a) * r * 0.7 + 0.03, Math.cos(q.a), 0.3, Math.sin(q.a), 0.016, 0.011, FLECK, 0.2, 1 - x, this.cDew, 1.1); }
    }
  },
});
