// Piet Mondrian, Lozenge Composition with Yellow, Black, Blue, Red, and Gray (1921), Gallery 393. The word: balance.
//
// A square canvas, sixty centimetres a side, hung on its point. The museum says three things about it. He "rotated a
// square canvas" so that its edges, and only its edges, are diagonals, while every line he painted stays level or
// upright ("the straight line tells the truth"). His pictures are "the result of continual tinkering to achieve
// absolute balance and harmony". And he was asking what a picture's contents have to do with what contains them: the
// black lines are squared off and stop at the edge or a few millimetres short of it, all but the long one, which runs
// out through it on the right; and the yellow, the blue and the little red are planes the edge has cut.
//
// So this is the turn, the edge and the balance. Look, and a blank square canvas in a strip frame like his comes
// down the wall from behind the picture, the ordinary way up; it moves out into the room and is set on the floor. It
// rocks back once onto its other corner, to get a swing, and is heaved up onto its point, where it stands a little
// unsteady: the one slanting move in the show, and the one he made. The picture comes into it from
// beyond its edges, every piece moving level or plumb, never slantwise: the long line from the right, where it will
// still be running out when it stops, and the pale grey under it; the two uprights, one down, one up; the short bar
// at the top and the one near the bottom. Then the planes: yellow comes down from the upper edge and the canvas
// leans towards it; black slides in under the long line and it leans further, as far as it can go; the blue comes in
// from the far corner and swings it back, a little past upright; and the red, the smallest thing in the picture, comes
// up from the lower edge, and it is still. One clear note, a tuning fork's A. It stands on its point under the
// picture, and is the picture. While you keep looking, now and then the right-hand upright is moved a centimetre, it
// leans, the line is put back, and it is true again.
//
// When you stop it stays while the toy is near: push it and it rocks and rights itself, and cannot be knocked over.
// Then the planes and the lines go out over the edges they came in by, the canvas is let down onto its side, and it
// goes back up the wall behind the picture.
//
// Flat, exact and matte, as he is: the canvas is one mesh and the picture on it is worked out in the shader from the
// measurements below, so its edges are clean at any distance. The positions, the lines' widths (the right upright is
// the thinnest, the lower bar the thickest; they differ by a millimetre and a half) and the colours are measured from
// the museum's photograph: the yellow, the blue, the vermilion red, two whites and a grey, the ivory of the strip
// frame. The canvas that comes out is the real one's size, 60 cm a side (the photograph hangs here 60 cm across its
// grey margins, so the picture on the wall is the smaller of the two). Two draw calls: the canvas, and its shadow
// on the floor. Nothing is solid; the toy drives through.
// With "Reduce motion and flashing" on, the canvas comes up onto its point and leans without any rocking, the
// tinkering is halved, and the sounds are softer; nothing here flashes.
//
// What it does not do: it does not weigh the colours (the leaning is staged, and makes no claim about how heavy a
// yellow is), it shows nothing beyond the edge that he did not paint (the pieces are seen only once they are inside),
// it never lets a line of his stand at a slant except while the whole canvas leans, it plays no jazz (his, but too
// late for this game's music), and it does not fall over, because a picture this carefully balanced should not be
// the butt of a pratfall.
import * as THREE from 'three';
import { lifeFor, ease, ramp, clamp01, lerp } from '../paintlife.js';
import { noise, hump } from './stagecraft.js';

// ---- the canvas (metres): 60 cm a side, as the real one; a narrow strip frame set back from its face, as he framed them
const S = 0.6, HC = S / 2, STRIP = 0.009, H = HC + STRIP, ZC = 0.011, ZS = 0.005, ZB = -0.011;
const OUT = 0.92, LIFT = 0.4;                         // where it stands, out from the picture's plane; how high it is carried
const RAD = Math.PI / 180;

// ---- the picture, measured from the museum's photograph (taken square to the lines). Units: half the canvas's
// diagonal, from its middle, x to the right and y up, as it hangs. A line is [from, to] across its width and along it.
const C = {
  H1: { y0: 0.0412, y1: 0.0663, x0: -0.924 },                         // the long line: 1.06 cm; stops 0.8 cm short on the left, runs out on the right
  H0: { y0: 0.8264, y1: 0.852, x0: -0.146, x1: 0.141 },               // the short bar at the top: 1.08 cm; its upper corners all but touch the edges
  H2: { y0: -0.6797, y1: -0.6527, x0: -0.3333, x1: 0.31 },            // the lower bar: 1.14 cm, the thickest; the edge cuts its lower left corner, and it stops 0.4 cm short on the right
  V1: { x0: -0.2476, x1: -0.2224, y0: -0.749, y1: 0.7532 },           // the left upright: 1.07 cm
  V2: { x0: 0.566, x1: 0.5894, y0: -0.408, y1: 0.4013 },              // the right upright: 0.99 cm, the thinnest
  V0: { x0: -0.6075, x1: -0.5813, y0: -0.3859 },                      // the black plane's own left line: 1.1 cm, and it runs on below the plane
  K: { y0: -0.3589 },                                                 // the black plane's lower edge (no line under it)
};
// The colours: as the museum photographed them (sRGB), and what the canvas is given so that it comes out the same on
// the screen as the picture hung above it does (linear; the game grades everything in a room but its pictures, so each
// was found by measuring the canvas against the picture in the look camera's frame until they agreed to within 1 in
// 255). Two whites (above the long line; the cooler one right of the right upright), the white under the black, the
// grey (below the long line), yellow, blue, the vermilion red, black; the ivory strip frame, the canvas's edge, its back.
const INK = [
  ['#dee2e5', [0.5119, 0.5259, 0.5354]], ['#dbe0e4', [0.4956, 0.5193, 0.5386]], ['#dadedf', [0.4937, 0.5106, 0.5172]], ['#d4d8dc', [0.4668, 0.4816, 0.5001]],
  ['#e0c958', [0.4837, 0.4157, 0.115]], ['#03217b', [0.0009, 0.0154, 0.1296]], ['#cd451e', [0.4092, 0.0555, 0.0221]], ['#070606', [0.002, 0.0016, 0.0005]],
  ['#cfd0c2', [0.437, 0.442, 0.378]], ['#d6d6cc', [0.468, 0.468, 0.42]], ['#a8977a', [0.27, 0.213, 0.134]], ['#b9996b', [0.335, 0.22, 0.101]],
];

// ---- the show (seconds)
const T = {
  down: [0.08, 0.66], out: [0.66, 1.08], set: [1.08, 1.34],          // down the wall from behind the picture; out into the room; onto the floor
  rock: [1.42, 0.5, 3.5], tip: 1.72,                                  // it rocks back onto its other corner (when, for how long, degrees), and is swung up onto its point
  // each piece: when it starts in, and how long it takes. The lines: long, left upright, right upright, top bar, lower bar
  piece: [[2.9, 0.5], [3.15, 0.44], [3.4, 0.44], [3.63, 0.4], [3.85, 0.44], [4.42, 0.6], [5.02, 0.5], [6.08, 0.42], [7.3, 0.24]],      // ... yellow, black, blue, red
  still: 7.92,                                                        // balanced: the note
  tink: 11, every: 7,                                                 // afterwards: a line is moved, and put back
};
const N = T.piece.length, YELLOW = 5, BLACK = 6, BLUE = 7, RED = 8;
// How it leans (degrees, to the right positive) as each plane arrives: [when, how far, how quick, how damped]. They sum to nothing.
const LEAN = [[4.62, -3.6, 5.0, 0.5], [5.2, -4.6, 5.0, 0.45], [5.5, -1.0, 3.0, 1], [6.2, 11.4, 6.5, 0.7], [7.4, -2.2, 6.5, 0.85]];
// A line coming to rest nudges it: [when, how far]
const KICK = [[3.4, -0.7], [3.59, -0.45], [3.84, -0.45], [4.03, 0.55], [4.29, 0.4]];
// Going back (fractions of the Return): each piece's start out, in the order it leaves; the canvas down off its point; home
const LEAVE = [0.24, 0.21, 0.18, 0.15, 0.12, 0.09, 0.06, 0.03, 0], LEAVE_LEN = 0.17, R_TIP = [0.42, 0.6], R_HOME = [0.63, 1];

// A weight on a spring let go: 0 to 1 with an overshoot (z < 1) or none (z = 1); and the same struck once.
const step = (tau, w, z) => {
  if (tau <= 0) return 0;
  if (z >= 0.999) return 1 - Math.exp(-w * tau) * (1 + w * tau);
  const wd = w * Math.sqrt(1 - z * z); return 1 - Math.exp(-z * w * tau) * (Math.cos(wd * tau) + (z * w / wd) * Math.sin(wd * tau));
};
const kick = (tau, w, z) => (tau <= 0 ? 0 : Math.exp(-z * w * tau) * Math.sin(w * Math.sqrt(1 - z * z) * tau));

const glf = v => (Number.isInteger(v) ? v.toFixed(1) : String(+v.toFixed(5)));

// The canvas: its face, the rim where it stands proud of its frame, the strip frame (mitred), and its back.
// aQ: on the face, where a point is in the picture (the units above); on the back, -1..1 across it. aFs: which part, and its shade.
function canvasGeo() {
  const pos = [], q = [], fs = [];
  const quad = (a, b, c, d, face, shade, qf) => { for (const p of [a, b, c, a, c, d]) { pos.push(p[0], p[1], p[2]); const Q = qf ? qf(p) : [0, 0]; q.push(Q[0], Q[1]); fs.push(face, shade); } };
  const turn = (p, n) => { let x = p[0], y = p[1]; for (let i = 0; i < n; i++) [x, y] = [-y, x]; return [x, y, p[2]]; };
  // (as it stands on its point the canvas's own right-hand and top sides are the two upper edges: x - y runs level, x + y plumb)
  quad([-HC, -HC, ZC], [HC, -HC, ZC], [HC, HC, ZC], [-HC, HC, ZC], 0, 1, p => [(p[0] - p[1]) / S, (p[0] + p[1]) / S]);
  const SH = [0.94, 0.94, 0.76, 0.76];
  for (let n = 0; n < 4; n++) {
    const R = p => turn(p, n);
    quad(R([HC, -HC, ZS]), R([HC, HC, ZS]), R([HC, HC, ZC]), R([HC, -HC, ZC]), 2, SH[n]);
    quad(R([HC, -HC, ZS]), R([H, -H, ZS]), R([H, H, ZS]), R([HC, HC, ZS]), 1, 1);
    quad(R([H, -H, ZB]), R([H, H, ZB]), R([H, H, ZS]), R([H, -H, ZS]), 1, SH[n] * 0.93);
  }
  quad([H, -H, ZB], [-H, -H, ZB], [-H, H, ZB], [H, H, ZB], 3, 1, p => [p[0] / H, p[1] / H]);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aQ', new THREE.Float32BufferAttribute(q, 2)); g.setAttribute('aFs', new THREE.Float32BufferAttribute(fs, 2));
  return g;
}

// The picture, in the shader. uP[i]: how far in piece i is (0 beyond the edge, 1 in its place); uTk: the right upright
// moved this far to the right. Every edge is a smoothstep a pixel wide, so the lines are as clean as his at any distance.
const PAD = 0.004;       // (a plane runs this far in under the line that bounds it, so no hair of white shows between)
const GLSL = /* glsl */`
uniform float uP[${N}]; uniform float uTk; uniform vec3 uInk[12];
varying vec2 vQ; varying vec2 vFs;
float lzS(float a, float w) { return smoothstep(-w, w, a); }
float lzBox(vec2 P, float w, float x0, float x1, float y0, float y1) { return lzS(P.x - x0, w) * lzS(x1 - P.x, w) * lzS(P.y - y0, w) * lzS(y1 - P.y, w); }
vec3 lozenge(vec2 P) {
  float w = 0.7 * max(fwidth(P.x), fwidth(P.y)) + 1.0e-5;
  vec3 c = uInk[0];
  // the long line comes in from the right, and the grey under it comes in behind its head
  float head = mix(1.03, ${glf(C.H1.x0)}, uP[0]);
  c = mix(c, uInk[3], lzS(${glf(C.H1.y1 - PAD)} - P.y, w) * lzS(P.x - mix(1.03, -1.06, uP[0]), w));
  // the right upright comes up from below, and the cooler white to its right with it
  float v2 = -(1.0 - uP[2]) * 0.86, x2 = ${glf(C.V2.x1)} + uTk;
  c = mix(c, uInk[1], lzS(P.x - (x2 - ${glf(PAD)}), w) * lzS(P.y - ${glf(C.H1.y1 - PAD)}, w) * lzS(${glf(C.V2.y1 + 0.03)} + v2 - P.y, w) * step(0.0005, uP[2]));
  // yellow, down from the upper left edge; blue, in from the right corner; red, up from the lower left edge
  c = mix(c, uInk[4], lzS(${glf(C.V1.x0 + PAD)} - P.x, w) * lzS(P.y - mix(0.8, ${glf(C.H1.y1 - PAD)}, uP[${YELLOW}]), w));
  c = mix(c, uInk[5], lzS(P.x - mix(1.03, x2 - ${glf(PAD)}, uP[${BLUE}]), w) * lzS(${glf(C.H1.y0 + PAD)} - P.y, w));
  c = mix(c, uInk[6], lzS(${glf(C.V1.x0 + PAD)} - P.x, w) * lzS(mix(-0.8, ${glf(C.H2.y0 + PAD)}, uP[${RED}]) - P.y, w));
  // black, in from the left under the long line as one piece: its own left line, the plane, and the white below it
  float dk = -(1.0 - uP[${BLACK}]) * 0.8, x1 = ${glf(C.V1.x0)} + dk + step(0.999, uP[${BLACK}]) * ${glf(PAD)};
  c = mix(c, uInk[2], lzBox(P, w, ${glf(C.V0.x0)} + dk, x1, ${glf(C.H2.y1 - PAD)}, ${glf(C.K.y0)}));
  float k = lzBox(P, w, ${glf(C.V0.x0)} + dk, x1, ${glf(C.K.y0)}, ${glf(C.H1.y0 + PAD)});
  k = max(k, lzBox(P, w, ${glf(C.V0.x0)} + dk, ${glf(C.V0.x1)} + dk, ${glf(C.V0.y0)}, ${glf(C.H1.y0 + PAD)}));
  // the lines: the long one, the left upright down from above, the right one, the top bar and the lower bar from the left
  k = max(k, lzS(P.x - head, w) * lzS(P.y - ${glf(C.H1.y0)}, w) * lzS(${glf(C.H1.y1)} - P.y, w));
  float d1 = (1.0 - uP[1]) * 1.56; k = max(k, lzBox(P, w, ${glf(C.V1.x0)}, ${glf(C.V1.x1)}, ${glf(C.V1.y0)} + d1, ${glf(C.V1.y1)} + d1));
  k = max(k, lzBox(P, w, ${glf(C.V2.x0)} + uTk, x2, ${glf(C.V2.y0)} + v2, ${glf(C.V2.y1)} + v2));
  float d3 = -(1.0 - uP[3]) * 0.32; k = max(k, lzBox(P, w, ${glf(C.H0.x0)} + d3, ${glf(C.H0.x1)} + d3, ${glf(C.H0.y0)}, ${glf(C.H0.y1)}));
  float d4 = -(1.0 - uP[4]) * 0.7; k = max(k, lzBox(P, w, ${glf(C.H2.x0)} + d4, ${glf(C.H2.x1)} + d4, ${glf(C.H2.y0)}, ${glf(C.H2.y1)}));
  return mix(c, uInk[7], k);
}
// its back: linen on a stretcher with a cross
vec3 lozengeBack(vec2 P) {
  float w = 0.7 * max(fwidth(P.x), fwidth(P.y)) + 1.0e-5; vec2 a = abs(P);
  float bar = max(lzS(max(a.x, a.y) - 0.85, w), lzS(0.07 - min(a.x, a.y), w));
  return mix(uInk[10], uInk[11], bar);
}
`;

lifeFor(109819, {
  title: /^Lozenge Composition with Yellow/,
  word: 'balance',
  // (a small work hung high: the whole of it and its lamp in view, and the floor out to where the canvas stands. The
  // camera stands square in front of the canvas, so that level looks level; an upright phone still sees both)
  stage: { out: 1.4, half: 1.3, cam: { dist: 3.05, height: 0.9, side: -0.27, fov: 54, lookU: -0.29, lookOut: 0.5, lookH: 0.81, floorOut: 1.15 } },
  wake: 2, ret: 2.2,
  linger: { near: 3.5, max: 25 },

  build(L) {
    const u = this.u = { uP: { value: new Array(N).fill(0) }, uTk: { value: 0 }, uInk: { value: INK.map(([, c]) => new THREE.Color().setRGB(c[0], c[1], c[2])) } };
    const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, fog: false });
    mat.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, u);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec2 aQ; attribute vec2 aFs; varying vec2 vQ; varying vec2 vFs;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\n  vQ = aQ; vFs = aFs;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\n' + GLSL)
        .replace('#include <color_fragment>', `#include <color_fragment>
  { vec3 lzF = lozenge(vQ), lzB = lozengeBack(vQ);
    vec3 lz = vFs.x < 0.5 ? lzF : vFs.x < 1.5 ? uInk[8] : vFs.x < 2.5 ? uInk[9] : lzB;
    diffuseColor.rgb = lz * vFs.y; }`);
    };
    mat.customProgramCacheKey = () => 'lozenge109819';
    const mesh = this.mesh = new THREE.Mesh(canvasGeo(), mat); mesh.matrixAutoUpdate = false;
    L.add(mesh);
    this.blobs = L.blobs(2, { fade: true });
    this.m = new THREE.Matrix4(); this.m2 = new THREE.Matrix4(); this.v = new THREE.Vector3(); this.q = new THREE.Quaternion(); this.e = new THREE.Euler(); this.sc = new THREE.Vector3(); this.col = new THREE.Color();
    this.cur = { s: 0, gam: 0, lean: 0, tk: 0 }; this.from = { s: 0, gam: 0, lean: 0, tk: 0, P: new Array(N).fill(0) };
    this.T = 0; this.skip = 0; this.last = 0; this.push = { a: 0, va: 0, p: 0, vp: 0 };
    this.pose(L, 0, 0, 0);
  },

  // Stand the canvas: s how far along its way from behind the picture (0) down the wall (1), out (2) and onto the floor
  // (3); gam (degrees) how far it has been turned up over its lower left corner (below nothing: rocked back that far
  // over its lower right one); pitch how far its top leans to the room.
  pose(L, s, gam, pitch) {
    const bottom = s <= 1 ? lerp(L.cy - H - L.y, LIFT, s) : s <= 2 ? LIFT : LIFT * (3 - s);
    const slot = -L.wall * 0.5, out = s <= 1 ? slot : s <= 2 ? lerp(slot, OUT, s - 1) : OUT, side = gam < 0 ? 1 : -1;
    L.floor(side * H, out, this.v); this.v.y = L.y + 0.002 + bottom;
    this.q.setFromEuler(this.e.set(pitch * RAD, L.yawOut, gam * RAD, 'YXZ'));
    this.mesh.matrix.compose(this.v, this.q, this.sc.set(1, 1, 1)).multiply(this.m2.makeTranslation(-side * H, H, 0));
    this.mesh.matrixWorldNeedsUpdate = true;
    // its shadow on the floor: a soft line under it as wide as it stands, and a darker spot where its point rests
    const g = gam * RAD, cu = side * H * (1 - Math.cos(g)) - H * Math.sin(g), half = H * (Math.abs(Math.cos(g)) + Math.abs(Math.sin(g)));
    const near = clamp01(1 - bottom / 0.5) * ramp(out, 0.12, 0.5), up = clamp01(Math.sin(2 * Math.abs(g))), B = this.blobs;
    L.floor(cu, out, this.v); this.v.y = L.y + 0.011; this.q.setFromEuler(this.e.set(0, L.yawOut, 0, 'YXZ'));
    B.setMatrixAt(0, this.m.compose(this.v, this.q, this.sc.set(half * 2.3, 1, 0.26))); B.setColorAt(0, this.col.setScalar(near * lerp(0.75, 0.4, up)));
    L.floor(side * H, out, this.v); this.v.y = L.y + 0.0115;
    B.setMatrixAt(1, this.m.compose(this.v, this.q, this.sc.set(0.2, 1, 0.14))); B.setColorAt(1, this.col.setScalar(near * 0.85 * up));
    B.count = 2; B.instanceMatrix.needsUpdate = true; if (B.instanceColor) B.instanceColor.needsUpdate = true;
  },

  // How far it leans at show-time t (degrees), and how far the right upright has been moved (the tinkering).
  leanAt(t, calm) {
    let a = 0;
    for (const [t0, m, w, z] of LEAN) a += m * step(t - t0, w, calm ? 1 : z);
    if (!calm) for (const [t0, j] of KICK) a += j * kick(t - t0, 8, 0.3);
    let tk = 0;
    if (t > T.tink) {
      const x = (t - T.tink) % T.every, k = calm ? 0.5 : 1;
      tk = 0.03 * k * (ease.inOut(x / 0.6) - ease.inOut((x - 2.2) / 0.6));
      a += 1.6 * k * (step(x - 0.15, 6, calm ? 1 : 0.6) - step(x - 2.35, 6, calm ? 1 : 0.6));
    }
    return [a, tk];
  },

  start(L, resumed) {
    // (still out, lingering: the show carries on from where it had got to)
    this.skip = resumed ? this.T - L.t : 0;
    this.T = L.t + this.skip; this.last = this.T;
    if (!resumed) { this.push.a = this.push.va = this.push.p = this.push.vp = 0; this.u.uP.value.fill(0); this.u.uTk.value = 0; }
  },
  back() { const f = this.from, c = this.cur; f.s = c.s; f.gam = c.gam; f.lean = c.lean; f.tk = c.tk; for (let i = 0; i < N; i++) f.P[i] = this.u.uP.value[i]; this.knocked = false; },
  end() { this.u.uP.value.fill(0); this.T = 0; },
  reset(L) { this.u.uP.value.fill(0); this.u.uTk.value = 0; this.T = 0; this.skip = 0; this.last = 0; this.push.a = this.push.va = this.push.p = this.push.vp = 0; this.pose(L, 0, 0, 0); },

  update(L, dt) {
    const ph = L.phase, calm = L.calm, P = this.u.uP.value, c = this.cur, v = L.voice(), vol = calm ? 0.6 : 1;
    const showing = ph === 'wake' || ph === 'play';
    if (showing) this.T = L.t + this.skip; else if (ph === 'linger') this.T += dt;
    const t = this.T, t0 = this.last, hit = at => !L.quiet && t0 < at && t >= at;
    if (ph !== 'return') {
      c.s = ease.inOut(ramp(t, T.down[0], T.down[1])) + ease.inOut(ramp(t, T.out[0], T.out[1])) + ease.inOut(ramp(t, T.set[0], T.set[1]));
      c.gam = 45 * step(t - T.tip, calm ? 3.6 : 4.8, calm ? 1 : 0.7) - (calm ? 0 : T.rock[2] * hump(t, T.rock[0], T.rock[0] + T.rock[1]));
      for (let i = 0; i < N; i++) { const [a, d] = T.piece[i]; P[i] = i < YELLOW ? ease.out((t - a) / d) : ease.inOut((t - a) / d); }
      const [a, tk] = this.leanAt(t, calm); c.lean = a; c.tk = tk;
      // ---- what you hear: it is set down; it comes onto its point; each line comes to rest; each plane; and it is still
      if (hit(T.set[1])) this.knock(L, 0.9 * vol);
      if (!calm && hit(T.rock[0] + T.rock[1] - 0.04)) this.knock(L, 0.4);
      for (let i = 0; i < YELLOW; i++) if (hit(T.piece[i][0] + T.piece[i][1] - 0.03)) noise(v, 0, { d: 0.035, vol: 0.022 * vol, bp: i === 0 || i > 2 ? 2500 : 1750, q: 2.5 });
      if (hit(T.piece[YELLOW][0] + 0.45)) this.thump(L, 0.7 * vol, 160);
      if (hit(T.piece[BLACK][0] + 0.42)) this.thump(L, vol, 120);
      if (hit(T.piece[BLUE][0] + 0.34)) this.thump(L, 0.8 * vol, 175);
      if (hit(T.piece[RED][0] + 0.2)) noise(v, 0, { d: 0.03, vol: 0.016 * vol, bp: 3200, q: 3 });
      if (hit(T.still)) { v.note(440, 3.2, { vol: 0.034 * vol, type: 'sine', attack: calm ? 0.06 : 0.012 }); v.note(2756, 0.22, { vol: 0.004 * vol, type: 'sine', attack: 0.004 }); }
      if (!this.told && hit(T.tip + 0.5)) { this.told = true; L.k.say('Mondrian turned a square canvas onto its point, and kept adjusting his lines and colours until they were in balance.', 5); }
    } else {
      // Going back: the planes and the lines out over the edges they came in by, last in first out; then it is let
      // down onto its side, and goes back the way it came.
      const R = L.ret, f = this.from;
      for (let i = 0; i < N; i++) P[i] = f.P[i] * (1 - ease.inOut(ramp(R, LEAVE[i], LEAVE[i] + LEAVE_LEN)));
      c.lean = f.lean * (1 - ease.smooth(R / 0.12)); c.tk = f.tk * (1 - ease.smooth(R / 0.12));
      c.gam = f.gam * (1 - ease.in(ramp(R, R_TIP[0], R_TIP[1])));
      c.s = f.s * (1 - ease.inOut(ramp(R, R_HOME[0], R_HOME[1])));
      if (!this.knocked && R >= R_TIP[1] && f.gam > 8 && f.s > 2.9) { this.knocked = true; if (!L.quiet) this.knock(L, 0.7 * vol); }
    }
    // ---- the toy: push the canvas as it stands on its point, and it rocks, and rights itself
    const p = this.push, G = L.k.G, toy = G.vehicle, up = c.gam > 38 && c.s > 2.99;
    if (dt > 0) {
      let fa = 0, fp = 0;
      if (up && toy && G.state === 'play' && Math.abs(toy.pos.y - L.y) < 0.4) {
        const o = L.local(toy.pos.x, toy.pos.z), du = o.u + H, dout = o.out - OUT, reach = (toy.radius || 0.16) + 0.05;
        if (Math.abs(dout) < reach && Math.abs(du) < 0.4) {
          const vu = toy.vel.x * L.tx + toy.vel.z * L.tz, vo = toy.vel.x * L.nx + toy.vel.z * L.nz;
          fa = vu * 260; fp = vo * 240;
          if (!L.quiet && !this.bumped && Math.hypot(vu, vo) > 0.5) { this.bumped = true; this.knock(L, 0.45 * vol); }
        } else this.bumped = false;
      }
      // (two springs, stepped in small pieces so a slow frame cannot throw it over)
      const w = 6.5, z = calm ? 0.8 : 0.24;
      for (let n = Math.max(1, Math.min(12, Math.ceil(dt / 0.01))), h = Math.min(dt, 0.12) / n, i = 0; i < n; i++) {
        p.va += (fa - w * w * p.a - 2 * z * w * p.va) * h; p.a += p.va * h;
        p.vp += (fp - w * w * p.p - 2 * z * w * p.vp) * h; p.p += p.vp * h;
      }
      p.a = Math.max(-14, Math.min(14, p.a)); p.p = Math.max(-12, Math.min(12, p.p));
      if (!up) { p.a *= 0.8; p.p *= 0.8; }
    }
    this.u.uTk.value = c.tk;
    this.pose(L, c.s, c.gam - c.lean - p.a, p.p);      // (it leans to the right the other way round from the way it was turned up)
    this.last = t;
    v.place();
  },

  // A plane comes to rest against its lines: a soft thump, no note in it.
  thump(L, k, f) {
    const v = L.voice();
    noise(v, 0, { d: 0.1, vol: 0.02 * k, lp: f * 3.2, attack: 0.008 });
    v.note(f, 0.2, { vol: 0.034 * k, type: 'sine', to: f * 0.66, attack: 0.012 });
  },
  // Wood set down on a wooden floor: soft, low, short.
  knock(L, k) {
    const v = L.voice();
    noise(v, 0, { d: 0.06, vol: 0.03 * k, lp: 650, attack: 0.003 });
    v.note(132, 0.16, { vol: 0.03 * k, type: 'sine', to: 84, attack: 0.004 });
  },
});
