// John Singer Sargent, The Fountain, Villa Torlonia, Frascati, Italy (1907), Gallery 273. The word: splash.
//
// A painting about painting. His friends the painters Jane and Wilfrid de Glehn sit on the white stone of a fountain
// in dazzling sun: she in white, perched on the pedestal of the balustrade, at work at her easel with a long brush, her
// palette in her lap; he lounging beside her in white, watching; behind them the jet stands up against dark trees.
// All of it is laid in fat, fast, loaded strokes of white, cream and lilac shadow.
//
// Look at it and the picture pours itself out: his strokes spill from under the bottom rail like water, splash across
// the floor and stand up where they land, stroke by stroke, into the basin and its balustrade, the pedestal, the
// easel with a small blank canvas, and the two painters, as they sit in the picture; his dark trees come up at the foot
// of the wall behind them and the basin fills. Then she paints, and the fountain does as it is painted. Three dabs on
// her canvas to the three repeated notes that open Vivaldi's "Spring" (La primavera, 1725, whose own sonnet has the
// springs running "with a sweet murmur"), and on the long high note the water answers with a first short spout; she
// looks up at it. Three more dabs, the balustrade and the pool, and on the next long note she draws one white stroke up
// her canvas and the jet goes up with it, the whole plume, breaking at the top into spray that catches the sun, the
// wind taking a handful of drops off to the right. The tune's run down is the spray coming down, a dab to a note,
// until the little picture of the fountain is done, the two of them in it. While you keep looking the jet rises and
// falls, she looks from the fountain to her canvas and he watches. When you stop, the jet drops, and the strokes lift
// off and pour back in under the frame.
//
// The water is kept low, near the wall and under the middle of the picture, and what it throws goes to the right and
// low: from none of the check's cameras, at any moment, does any of it come in front of a canvas (the guard cuts
// nothing of it). The whole scene is kept under 0.6 m (the plume 0.92) so that from the toy's eye the painters are
// not cut off by the tall portraits either side. Three draw calls: the floor (his ground, the trees, the pool, one
// shader), the water (soft drags and drops, one instanced shader) and one rig (every solid thing; every stroke on it is
// flown in by the vertex shader, so nothing is worked out per stroke per frame).
//
// What it leaves out: the two painters do only what they do in the picture (she paints, he rests and watches; nobody
// is splashed, startled or made to clown), their faces are left as he left them, a few touches, and nothing here is
// given to the toy to push, because the picture is about looking.
import * as THREE from 'three';
import { lifeFor, ease, ramp, clamp01, lerp, shape, canvasTexture } from '../paintlife.js';
import { strokes as strokeTex } from './brush.js';
import { score } from './stagecraft.js';

const TAU = Math.PI * 2;
const BPM = 126, BT = 60 / BPM, T0 = 1.7;                 // "Spring": the first bar's downbeat
const bar = k => T0 + k * 4 * BT;
const T_SPURT = T0 + 2 * BT, T_PLUME = bar(1) + 2 * BT, T_RUN = bar(2), T_DONE = bar(3);
const BUILT = 1.75, FLY = 0.42;                           // all the strokes have landed; one stroke's flight
// The scene's size (at 1 her hat is 0.6 m from the floor and the plume 0.92: any larger and, from the toy's eye at the
// side, the painters' heads come in front of the tall portraits next door and the guard takes them off), its middle
// along the wall, and how far its z = 0 lies inside the wall (so the whole of it stands 4 cm nearer the wall).
const SC = 1, U0 = 0, ZS = 0.04;
// Everything below is in the scene's own metres: x along the wall (to the right), y up, z out of the wall.
// (the jet stands under the middle of the picture: the tallest thing here, clear of every canvas from either side)
const JET = { x: 0.02, z: 0.33, y: 0.078, H: 0.84, g: 6.4 };
const V0 = Math.sqrt(2 * JET.g * JET.H), TF = 2 * V0 / JET.g;
const N_JET = 100, N_SPARK = 18, N_DROP = 9, N_FOAM = 6, NC = N_JET + N_SPARK + N_DROP + N_FOAM;
const POOL = { x0: -0.66, x1: 0.66, z0: 0.19, z1: 0.5, y: 0.078 };
const EASEL = { c: [-0.07, 0.375, 0.73], yaw: 0.7, tilt: -0.17, hw: 0.095, hh: 0.12 };
const JANE = { hip: [0.37, 0.3, 0.58], yaw: 0.6435, neck: [-0.03, 0.185, 0], sh: [-0.035, 0.15, -0.07] };
const WIL = { neck: [0.166, 0.352, 0.55], yaw: 0.615 };
const L1 = 0.11, L2 = 0.29;                               // her painting arm: the upper arm; the forearm, hand and long brush
const REST = [0.06, 0.4, 0.66], LAP = [0.16, 0.3, 0.7];   // the brush held back from the canvas; and lowered, done
const SHADOWS = [[0.5, 0.76, 0.26, 0.11], [-0.04, 0.72, 0.24, 0.09], [0.06, 0.86, 0.2, 0.06], [0.2, 0.88, 0.09, 0.04], [-0.2, 0.64, 0.56, 0.05], [0.68, 0.64, 0.16, 0.05]];
// Antonio Vivaldi, La primavera (Le quattro stagioni, Op. 8 No. 1; Amsterdam, 1725), the opening of the first Allegro:
// the tune and the bass, once out and once as its echo.
const SPRING = 'E5:.5 | G#5:.5 G#5:.5 G#5:.5 F#5:.25 E5:.25 B5:1.5 B5:.25 A5:.25 | G#5:.5 G#5:.5 G#5:.5 F#5:.25 E5:.25 B5:1.5 B5:.25 A5:.25 | G#5:.5 A5:.25 B5:.25 A5:.5 G#5:.5 F#5:.5 D#5:.5 B4:.5';      // (its next note is the up-beat of the echo)
const SPRING_BASS = 'E3 E3 E3 E3 | E3 E3 E3 E3 | E3 E3 B2 B2';
// What she paints, in order: [when, how long, from, to (on the canvas, -1..1 across and up), width (m), colour].
const DAB = 0.15;
const PICTURE = [
  [T0, DAB, [-0.9, 0.74], [0.9, 0.8], 0.086, '#26361f'],                         // the trees, dark: three bands, one under another
  [T0 + 0.5 * BT, DAB, [0.9, 0.5], [-0.9, 0.44], 0.086, '#2a3c24'],
  [T0 + BT, DAB, [-0.9, 0.2], [0.9, 0.14], 0.074, '#3c5230'],
  [T0 + 1.5 * BT, 0.1, [0.34, 0.88], [0.88, 0.62], 0.046, '#77843c'],            // sun on them
  [T0 + 3.5 * BT, 0.12, [-0.9, -0.36], [0.82, -0.3], 0.062, '#35504a'],        // the pool
  [bar(1), DAB, [-0.9, -0.08], [0.9, -0.11], 0.04, '#ece2c6'],                // the balustrade
  [bar(1) + 0.5 * BT, DAB, [-0.9, -0.82], [0.7, -0.76], 0.07, '#b08a58'],      // the ground
  [bar(1) + BT, DAB, [0.5, -0.74], [0.54, -0.16], 0.07, '#e4d8bc'],            // the pedestal
  [bar(1) + 1.5 * BT, 0.1, [-0.86, -0.56], [0.3, -0.53], 0.04, '#a59fb6'],     // its lilac shadow
  [T_PLUME, 0.42, [-0.2, -0.28], [-0.12, 0.9], 0.06, '#fbf7ea'],               // the jet, in one stroke
  [T_RUN, 0.11, [-0.05, 0.8], [0.14, 0.6], 0.042, '#cfdcdc'],                  // the spray coming down
  [T_RUN + 0.5 * BT, 0.11, [-0.3, 0.72], [-0.37, 0.46], 0.03, '#fbf7ea'],
  [T_RUN + BT, 0.11, [0.16, 0.56], [0.23, 0.24], 0.036, '#cfdcdc'],
  [T_RUN + 1.5 * BT, 0.11, [-0.02, 0.5], [0.03, 0.14], 0.03, '#f4f0e4'],
  [T_RUN + 2 * BT, 0.11, [0.5, -0.1], [0.56, 0.24], 0.06, '#fbf7ea'],          // a figure in white on the pedestal
  [T_RUN + 2.5 * BT, 0.09, [0.5, 0.31], [0.6, 0.36], 0.042, '#ecd9a6'],        // her hat
  [T_RUN + 3 * BT, 0.11, [0.14, -0.3], [0.3, -0.2], 0.046, '#f1ecdc'],         // and one beside her
  [T_RUN + 3.5 * BT, 0.09, [-0.62, 0.02], [-0.44, 0.1], 0.03, '#fbf7ea'],
];
const _h = (a, b = 0) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };
const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

lifeFor(69780, {
  title: /^The Fountain, Villa Torlonia/,
  word: 'splash',
  // (a small work high on the wall: the kit keeps all of it in view, over the fountain at the foot of the wall)
  stage: { out: 1.2, half: 1.1, cam: { dist: 2.3, height: 0.85, side: 0.07, fov: 58, lookU: 0.04, lookOut: 0.4, lookH: 0.85, floorOut: 0.93 } },
  wake: 1.7, ret: 2.4,

  build(L) {
    const P = L.pal, col = (h, a = 0.16) => P.near(h, a), C = (list, a) => list.map(h => col(h, a));
    const WALL = L.wall, RAIL = (L.rail - L.y) / SC, XS = -U0 / SC;      // (XS: under the middle of the frame)
    // The scene's frame, at the foot of the wall under the work.
    this.O = L.floor(U0, -WALL - ZS);
    this.B = new THREE.Matrix4().makeBasis(V3(L.tx * SC, 0, L.tz * SC), V3(0, SC, 0), V3(L.nx * SC, 0, L.nz * SC)).setPosition(this.O);
    this.V = { m: new THREE.Matrix4(), a: new THREE.Matrix4(), b: new THREE.Matrix4(), q: new THREE.Quaternion(), e: new THREE.Euler(0, 0, 0, 'YXZ'), v: V3(), w: V3(), s: V3(1, 1, 1), up: V3(0, 1, 0), d: V3(), p: V3(), el: V3(), tip: V3(), sh: V3() };
    const mat = (x, y, z, yaw = 0, pitch = 0, roll = 0) => new THREE.Matrix4().compose(V3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(pitch, yaw, roll, 'YXZ')), V3(1, 1, 1));
    const R = () => L.rand();
    const KEY = V3(-0.5, 0.82, 0.16).normalize();            // his sun: high, from the left, a little in front
    const pick = (list, r) => list[Math.min(list.length - 1, Math.floor(r * list.length))];
    const set = (hi, mid, lo, deep, a) => ({ hi: C(hi, a), mid: C(mid, a), lo: C(lo, a), deep: C(deep, a) });
    const WH = set(['#f6f1e2', '#efe7d0', '#eadfc4', '#f9f6ea'], ['#cfcbb8', '#c2c6b0', '#d2c8b0', '#c6bfae'], ['#9a97ac', '#8a8fa6', '#a59a8a', '#928ca0'], ['#6f6c84', '#7c6b58', '#5f6278']);
    const WB = set(['#f0eee4', '#e8e4d4', '#eee8d8'], ['#c4c8c4', '#b8bfc0', '#c9c5b6'], ['#868ea4', '#7c849c', '#928e88'], ['#5e647e', '#545a72', '#675e52']);                   // (his suit: cooler in its shadows)
    const ST = set(['#e6dcc2', '#dccdae', '#ece3cc'], ['#b5a284', '#a69478', '#9d9a92', '#bda886'], ['#7d6652', '#876046', '#6d666c', '#8c7458'], ['#4c3b31', '#5b4034', '#45404a']);
    const WD = set(['#c08a50', '#a8763e'], ['#8a5a34', '#7a4c2a'], ['#5c3a20', '#6a4024'], ['#3a2416']);
    const SK = set(['#e6b48c', '#dca67c'], ['#cf9a70', '#c48e66'], ['#a8744e', '#9c6c4c'], ['#7a5038']);
    const RD = set(['#b85a40', '#a84c36'], ['#8e3b2a', '#963f2c'], ['#6a2a20', '#5a241c'], ['#3e1a16']);
    const HAT = set(['#f6ecc8', '#f2e2b0'], ['#e4cf9a', '#dcc08a'], ['#d39a56', '#c88c4c'], ['#a8703c']);
    const DK = set(['#4a3a30', '#54433a'], ['#342822', '#3a2e28'], ['#241b17', '#2a211c'], ['#18120f']);
    // A stroke's colour from the way the form faces his sun (the lights, the half tones, the shade, the dark), a little
    // of the luck of the brush in it; and the solid under the strokes, the same four tones run smoothly into each other,
    // so a form is modelled softly and the strokes sit on it as touches, not as spots.
    const tone = (S, jit = 0.22) => (n, r) => { const k = n.dot(KEY) + (r - 0.5) * jit; return pick(k > 0.42 ? S.hi : k > 0.04 ? S.mid : k > -0.4 ? S.lo : S.deep, (r * 7.31) % 1); };
    const under = S => { const c = new THREE.Color(), sm = THREE.MathUtils.smoothstep; return n => { const k = n.dot(KEY); return c.copy(S.deep[0]).lerp(S.lo[0], sm(k, -0.75, -0.3)).lerp(S.mid[0], sm(k, -0.25, 0.2)).lerp(S.hi[1 % S.hi.length], sm(k, 0.25, 0.75)).multiplyScalar(0.97); }; };

    // ---------------------------------------------------------- parts: solids and the strokes on them
    // A part is one piece of the rig (it moves as one). Every vertex carries where its stroke's middle is (aCen) and
    // how the stroke flies in (aFly: from where, relative to its place, and when), so the vertex shader can pour them
    // out from under the rail; a solid grows up from its foot instead (no flight).
    const part = (rest = new THREE.Matrix4()) => ({ pos: [], nor: [], col: [], cen: [], fly: [], rest, inv: rest.clone().invert(), n: 0 });
    const a_ = V3(), b_ = V3(), side = V3(), d2 = V3(), cl = V3(), src = V3(), wp = V3(), ca = new THREE.Color(), cb = new THREE.Color();
    const vert = (Pt, p, n, c, cen, f) => { Pt.pos.push(p.x, p.y, p.z); Pt.nor.push(n.x, n.y, n.z); Pt.col.push(c.r, c.g, c.b); Pt.cen.push(cen.x, cen.y, cen.z); Pt.fly.push(f[0], f[1], f[2], f[3]); Pt.n++; };
    const solid = (Pt, g, base, t, paint = null) => {
      const p = g.attributes.position, n = g.attributes.normal, c = g.attributes.color, v = V3(), nn = V3(), cc = new THREE.Color(), f = [0, 0, 0, t];
      for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); nn.fromBufferAttribute(n, i); if (paint) cc.copy(paint(nn, v)); else cc.fromBufferAttribute(c, i); vert(Pt, v, nn, cc, base, f); }
    };
    // When a stroke at height y (in the scene) is laid: the low ones first, so things build from the ground up.
    const when = (t0, span, y) => t0 + Math.min(span, 0.26) * (0.62 * clamp01(y / 0.58) + 0.38 * R());
    // One loaded stroke: a tapered ribbon of paint lying on the form at p (normal n), along dir, l long and w wide,
    // lifted a little, a lighter ridge down one edge. play: [when, how long] for a stroke she paints (it grows from
    // its start, to the show's clock, with no flight).
    const stroke = (Pt, p, n, dir, l, w, c, t, { bend = 0, lift = 0.0035, ridge = 0.1, play = null } = {}) => {
      side.crossVectors(n, dir); if (side.lengthSq() < 1e-8) return; side.normalize(); d2.crossVectors(side, n).normalize();
      const prof = [0.5, 0.86, 1, 0.97, 0.8, 0.42], A = [], Bq = [];
      for (let i = 0; i < 6; i++) {
        const s = i / 5 - 0.5;
        cl.copy(p).addScaledVector(d2, s * l).addScaledVector(side, bend * l * (1 - 4 * s * s)).addScaledVector(n, lift * (1 + 0.5 * i / 5));
        A.push(cl.clone().addScaledVector(side, -w / 2 * prof[i])); Bq.push(cl.clone().addScaledVector(side, w / 2 * prof[i]));
      }
      ca.copy(c).multiplyScalar(1 + ridge); cb.copy(c).multiplyScalar(1 - ridge * 0.7);
      let cen = p, f;
      if (play) { cen = A[0].clone().add(Bq[0]).multiplyScalar(0.5); f = [play[1], 0, 0, 100 + play[0]]; }
      else {
        wp.copy(p).applyMatrix4(Pt.rest);
        src.set(XS + Math.max(-0.24, Math.min(0.24, (wp.x - XS) * 0.4)) + (R() - 0.5) * 0.1, RAIL - 0.03 - R() * 0.04, ZS + 0.012 + R() * 0.02).applyMatrix4(Pt.inv);
        f = [src.x - p.x, src.y - p.y, src.z - p.z, t == null ? when(0.3, 0.4, wp.y) : t];
      }
      for (let i = 0; i < 5; i++) { vert(Pt, A[i], n, cb, cen, f); vert(Pt, Bq[i + 1], n, ca, cen, f); vert(Pt, Bq[i], n, ca, cen, f); vert(Pt, A[i], n, cb, cen, f); vert(Pt, A[i + 1], n, cb, cen, f); vert(Pt, Bq[i + 1], n, ca, cen, f); }
    };
    // The way a stroke runs on a surface: `flow` laid into the surface, turned a little.
    const q_ = new THREE.Quaternion();
    const along = (n, flow, jit) => { const d = flow.clone().addScaledVector(n, -flow.dot(n)); if (d.lengthSq() < 1e-4) d.set(n.y, -n.x, 0).addScaledVector(n, -(n.y * n.x - n.x * n.y)); if (d.lengthSq() < 1e-6) d.set(1, 0, 0); return d.normalize().applyQuaternion(q_.setFromAxisAngle(n, (R() - 0.5) * jit)); };
    const DOWN = V3(0, -1, 0), ACROSS = V3(1, 0, 0);
    // An ellipsoid (centre, radii, turned by Euler rx, ry, rz) as a soft solid in the shade's colours, and a coat of
    // n strokes over it in the lights and darks.
    const ell = (Pt, Cn, Rd, S, t0, n, { rot = [0, 0, 0], l = [0.04, 0.07], w = [0.016, 0.026], flow = DOWN, jit = 0.6, keep = null, span = 0.3, tn = null, detail = 2, bare = false, grow = 1.0 } = {}) => {
      const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(rot[0], rot[1], rot[2], 'YXZ')), c = V3(...Cn), tf = tn || tone(S);
      if (!bare) { const u = under(S); solid(Pt, shape.move(shape.ball(1, 0xffffff, detail), c.x, c.y, c.z, rot[0], rot[1], rot[2], Rd[0], Rd[1], Rd[2]), V3(c.x, c.y - Rd[1], c.z), t0 + 0.12, nn => u(nn)); }
      for (let i = 0; i < n; i++) {
        const yy = 1 - 2 * R(), ph = R() * TAU, s = Math.sqrt(Math.max(0, 1 - yy * yy)), ux = s * Math.cos(ph), uz = s * Math.sin(ph);
        const p = V3(ux * Rd[0] * grow, yy * Rd[1] * grow, uz * Rd[2] * grow).applyQuaternion(q).add(c), nn = V3(ux / Rd[0], yy / Rd[1], uz / Rd[2]).normalize().applyQuaternion(q);
        if (keep && !keep(p, nn)) continue;
        wp.copy(p).applyMatrix4(Pt.rest);
        stroke(Pt, p, nn, along(nn, flow, jit), lerp(l[0], l[1], R()), lerp(w[0], w[1], R()), tf(nn, R()), when(t0, span, wp.y), { bend: (R() - 0.5) * 0.16 });
      }
    };
    // A soft limb from a to b (a sleeve, a trouser leg), and strokes along it.
    const limb = (Pt, a, b, r0, r1, S, t0, n, { l = [0.035, 0.06], w = [0.012, 0.02], span = 0.25, bare = false } = {}) => {
      const A = V3(...a), Bv = V3(...b), ax = Bv.clone().sub(A), len = ax.length(); ax.normalize();
      const e1 = V3().crossVectors(ax, Math.abs(ax.y) < 0.9 ? V3(0, 1, 0) : V3(1, 0, 0)).normalize(), e2 = V3().crossVectors(ax, e1), tf = tone(S), u = under(S);
      if (!bare) { const g = shape.cyl(r0, r1, len, 10, 0xffffff); g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V3(0, 1, 0), ax)); const m = A.clone().add(Bv).multiplyScalar(0.5); g.translate(m.x, m.y, m.z); solid(Pt, g, A.y < Bv.y ? A : Bv, t0 + 0.12, nn => u(nn)); for (const [e, r] of [[A, r0], [Bv, r1]]) solid(Pt, shape.move(shape.ball(r, 0xffffff, 1), e.x, e.y, e.z), e, t0 + 0.12, nn => u(nn)); }
      for (let i = 0; i < n; i++) {
        const t = 0.08 + 0.84 * R(), ph = R() * TAU, nn = e1.clone().multiplyScalar(Math.cos(ph)).addScaledVector(e2, Math.sin(ph)), r = lerp(r0, r1, t);
        const p = A.clone().addScaledVector(ax, t * len).addScaledVector(nn, r); wp.copy(p).applyMatrix4(Pt.rest);
        stroke(Pt, p, nn, along(nn, ax, 0.5), Math.min(len * 0.8, lerp(l[0], l[1], R())), lerp(w[0], w[1], R()), tf(nn, R()), when(t0, span, wp.y), { bend: (R() - 0.5) * 0.12 });
      }
    };
    // A block of his stone: a box, and broad drags of paint on its faces (upright or level), warm and violet touches in its shade.
    const ACCENT = C(['#94623f', '#7a5038', '#77727c', '#a8805a', '#5e5658']);
    const block = (Pt, x0, x1, y0, y1, z0, z1, t0, dens = 1, { S = ST, span = 0.3, faces = 'xXYzZ' } = {}) => {
      const u = under(S), tf = tone(S), g = shape.box(x1 - x0, y1 - y0, z1 - z0, 0xffffff); g.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
      solid(Pt, g, V3((x0 + x1) / 2, y0, (z0 + z1) / 2), t0 + 0.12, nn => u(nn));
      const F = { x: [V3(-1, 0, 0), 'z', 'y'], X: [V3(1, 0, 0), 'z', 'y'], Y: [V3(0, 1, 0), 'x', 'z'], z: [V3(0, 0, -1), 'x', 'y'], Z: [V3(0, 0, 1), 'x', 'y'] }, lo = { x: x0, y: y0, z: z0 }, hi = { x: x1, y: y1, z: z1 };
      for (const f of faces) {
        const [nn, ua, va] = F[f], su = hi[ua] - lo[ua], sv = hi[va] - lo[va], n = Math.max(2, Math.round(su * sv * 330 * dens)), shade = nn.dot(KEY) < 0.3;
        for (let i = 0; i < n; i++) {
          const p = V3(); p[ua] = lo[ua] + su * (0.05 + 0.9 * R()); p[va] = lo[va] + sv * (0.1 + 0.8 * R());
          const ax = f === 'x' || f === 'X' ? 'x' : f === 'Y' ? 'y' : 'z'; p[ax] = f === 'x' || f === 'z' ? lo[ax] : hi[ax];
          const lev = f === 'Y' ? su > sv : (R() < 0.6 ? su > sv * 0.8 : false), dir = V3(); dir[lev ? ua : va] = 1;
          const room = (lev ? su : sv), len = Math.min(room * 0.95, 0.06 + 0.09 * R()), wd = Math.min((lev ? sv : su) * 0.85, 0.024 + 0.022 * R());
          wp.copy(p).applyMatrix4(Pt.rest);
          stroke(Pt, p, nn, along(nn, dir, 0.25), len, wd, shade && R() < 0.08 ? pick(ACCENT, R()) : tf(nn, R()), when(t0, span, wp.y), { bend: (R() - 0.5) * 0.1 });
        }
      }
    };
    // A baluster: a little turned vase, a light down its sunny side and a dark down the other.
    const BAL = [[0.011, 0], [0.015, 0.006], [0.01, 0.018], [0.02, 0.04], [0.018, 0.052], [0.009, 0.07], [0.013, 0.08], [0.011, 0.088]];
    const baluster = (Pt, x, y, z, t0) => {
      const u = under(ST), tf = tone(ST);
      solid(Pt, shape.move(shape.lathe(BAL, 10, 0xffffff), x, y, z), V3(x, y, z), t0 + 0.12, nn => u(nn));
      for (const [ph, r] of [[2.3 + R() * 0.5, 0.02], [5.4 + R() * 0.6, 0.019]]) { const nn = V3(Math.cos(ph), 0, Math.sin(ph)); stroke(Pt, V3(x + nn.x * r, y + 0.044, z + nn.z * r), nn, V3(0, 1, 0), 0.05 + 0.02 * R(), 0.013, tf(nn, R()), when(t0, 0.3, y), {}); }
    };
    // A run of balustrade from (xa, za) to (xb, zb): a low wall, balusters, a rail.
    const balustrade = (Pt, xa, za, xb, zb, n, t0) => {
      const alongX = Math.abs(xb - xa) > Math.abs(zb - za), hw = 0.035;
      const bx = (y0, y1, grow, dens) => (alongX ? block(Pt, Math.min(xa, xb), Math.max(xa, xb), y0, y1, za - hw - grow, za + hw + grow, t0, dens) : block(Pt, xa - hw - grow, xa + hw + grow, y0, y1, Math.min(za, zb), Math.max(za, zb), t0, dens));
      bx(0, 0.085, 0, 0.7);
      for (let i = 0; i < n; i++) { const k = (i + 0.5) / n; baluster(Pt, lerp(xa, xb, k), 0.085, lerp(za, zb, k), t0 + 0.05); }
      bx(0.173, 0.2, 0.004, 1.3);
    };

    // ---------------------------------------------------------- the stone: basin, balustrade, pedestal
    const stone = part();
    balustrade(stone, -0.74, 0.16, 0.74, 0.16, 13, 0.14);                 // the far side, under the trees
    balustrade(stone, 0.7, 0.19, 0.7, 0.5, 3, 0.2);                     // the right
    balustrade(stone, 0.5, 0.55, 0.74, 0.55, 2, 0.24);                    // and round to the pedestal
    block(stone, -0.74, -0.66, 0, 0.1, 0.19, 0.5, 0.2, 0.8);            // the plain coping on the left
    block(stone, -0.74, 0.24, 0, 0.088, 0.505, 0.595, 0.24, 0.9);         // the coping in front, where he sits
    block(stone, -0.745, 0.24, 0.088, 0.104, 0.495, 0.605, 0.28, 1.2, { faces: 'xYZ' });
    block(stone, 0.225, 0.515, 0, 0.04, 0.425, 0.695, 0.3, 1.0);        // the pedestal: its foot,
    block(stone, 0.24, 0.5, 0.04, 0.212, 0.44, 0.68, 0.34, 1.25);         // its die,
    block(stone, 0.222, 0.518, 0.212, 0.25, 0.422, 0.698, 0.4, 1.5);    // its cap
    // (the die's moulded panel on the two faces you see, a few darker and warmer touches, as he gives it)
    for (let i = 0; i < 9; i++) { const f = i % 2, nn = f ? V3(-1, 0, 0) : V3(0, 0, 1), p = f ? V3(0.24, 0.07 + R() * 0.11, 0.47 + R() * 0.18) : V3(0.27 + R() * 0.2, 0.07 + R() * 0.11, 0.68); stroke(stone, p, nn, along(nn, R() < 0.5 ? DOWN : ACROSS, 0.4), 0.04 + 0.04 * R(), 0.016, pick([...ST.lo, ...ST.deep, col('#9a5f3c')], R()), when(0.42, 0.25, p.y), { lift: 0.006 }); }

    // ---------------------------------------------------------- the easel, its small canvas, and what she paints on it
    const easelM = mat(EASEL.c[0], EASEL.c[1], EASEL.c[2], EASEL.yaw, EASEL.tilt, 0);
    const easel = part(easelM), eInv = easel.inv, foot = (x, y, z) => V3(x, y, z).applyMatrix4(eInv).toArray();
    const TE = 0.52, ex = Math.cos(EASEL.yaw), ez = -Math.sin(EASEL.yaw), nx_ = Math.sin(EASEL.yaw), nz_ = Math.cos(EASEL.yaw), top = [0, 0.16, -0.022];
    limb(easel, foot(EASEL.c[0] - ex * 0.13 + nx_ * 0.075, 0, EASEL.c[2] - ez * 0.13 + nz_ * 0.075), top, 0.0075, 0.0075, WD, TE, 5);
    limb(easel, foot(EASEL.c[0] + ex * 0.13 + nx_ * 0.075, 0, EASEL.c[2] + ez * 0.13 + nz_ * 0.075), top, 0.0075, 0.0075, WD, TE, 5);
    limb(easel, foot(EASEL.c[0] - nx_ * 0.2, 0.104, EASEL.c[2] - nz_ * 0.2), top, 0.007, 0.007, WD, TE, 4);
    limb(easel, [0, -0.3, -0.018], [0, 0.185, -0.018], 0.007, 0.007, WD, TE, 4);                      // the mast
    limb(easel, [-0.12, -0.132, 0.004], [0.12, -0.132, 0.004], 0.008, 0.008, WD, TE + 0.04, 4);      // the ledge the canvas stands on
    {
      const g = shape.box(EASEL.hw * 2, EASEL.hh * 2, 0.01, 0xffffff); g.translate(0, 0, -0.005);
      const ground = col('#d9c7a2', 0.1), edge = col('#b89a6c', 0.1), back = col('#8a6a44');
      solid(easel, g, V3(0, -EASEL.hh, 0), TE + 0.06, (nn, v) => (nn.z > 0.5 ? ground : nn.z < -0.5 ? back : edge));
      PICTURE.forEach(([t, d, a, b, w, c], i) => {
        const A = V3(a[0] * EASEL.hw, a[1] * EASEL.hh, 0), Bv = V3(b[0] * EASEL.hw, b[1] * EASEL.hh, 0), dir = Bv.clone().sub(A), len = dir.length(); dir.normalize();
        stroke(easel, A.clone().add(Bv).multiplyScalar(0.5), V3(0, 0, 1), dir, len, w * 0.5, col(c, 0.08), 0, { lift: 0.0015 + i * 0.0005, play: [t, d], bend: (_h(i, 3) - 0.5) * 0.1, ridge: 0.14 });
      });
      this.canvasBorn = TE + 0.06;
    }
    // (her paint bag at its foot)
    const props = part();
    ell(props, [0.13, 0.036, 0.87], [0.06, 0.036, 0.042], RD, 0.62, 16, { l: [0.03, 0.05], flow: ACROSS, rot: [0, 0.5, 0] });
    limb(props, [0.09, 0.07, 0.86], [0.17, 0.066, 0.88], 0.006, 0.006, DK, 0.64, 2);

    // ---------------------------------------------------------- Wilfrid: lounging on the coping, leaning back, in white
    const BIG = { l: [0.05, 0.085], w: [0.018, 0.03] }, MED = { l: [0.035, 0.06], w: [0.014, 0.022] }, SML = { l: [0.016, 0.026], w: [0.009, 0.014] };
    const wil = part(), TW = 0.68;
    ell(wil, [0.04, 0.152, 0.55], [0.07, 0.05, 0.068], WB, TW, 16, { flow: ACROSS, ...MED });                 // his seat
    limb(wil, [0.045, 0.16, 0.55], [0.15, 0.315, 0.55], 0.056, 0.047, WB, TW + 0.03, 26, BIG);                  // his back, leaning on the pedestal
    ell(wil, [0.152, 0.318, 0.55], [0.042, 0.034, 0.08], WB, TW + 0.05, 14, { flow: V3(0.3, -0.5, 1), ...MED });      // his shoulders
    stroke(wil, V3(0.073, 0.262, 0.596), V3(-0.55, 0.45, 0.7).normalize(), V3(0.5, 0.86, 0), 0.07, 0.012, col('#5d6a86'), TW + 0.4, { lift: 0.008 });      // his tie, a blue touch
    limb(wil, [0.15, 0.31, 0.622], [0.1, 0.205, 0.655], 0.024, 0.02, WB, TW + 0.05, 8, MED);                   // the near arm, the hand on his knee
    limb(wil, [0.1, 0.205, 0.655], [0.0, 0.184, 0.628], 0.02, 0.016, WB, TW + 0.05, 7, MED);
    ell(wil, [-0.014, 0.186, 0.626], [0.016, 0.012, 0.014], SK, TW + 0.08, 3, { ...SML, detail: 1 });
    limb(wil, [0.03, 0.15, 0.595], [-0.11, 0.172, 0.655], 0.036, 0.03, WB, TW, 13, BIG);                       // the near leg, out to the left
    limb(wil, [-0.11, 0.172, 0.655], [-0.21, 0.036, 0.7], 0.028, 0.02, WB, TW, 11, BIG);
    limb(wil, [0.03, 0.142, 0.52], [-0.12, 0.142, 0.552], 0.034, 0.028, WB, TW, 8, BIG);                       // the far one along the coping
    limb(wil, [-0.12, 0.142, 0.552], [-0.27, 0.128, 0.558], 0.026, 0.02, WB, TW, 8, BIG);
    ell(wil, [-0.236, 0.022, 0.708], [0.036, 0.017, 0.019], WB, TW, 3, { flow: ACROSS, ...SML, detail: 1, rot: [0, 0.2, 0] });
    ell(wil, [-0.296, 0.134, 0.56], [0.03, 0.02, 0.017], WB, TW, 3, { flow: ACROSS, ...SML, detail: 1 });
    // his head (it turns): the face a few warm touches, dark hair, the moustache one dark dab
    const wHead = part(mat(...WIL.neck, WIL.yaw));
    limb(wHead, [0, -0.014, 0], [0, 0.012, 0], 0.014, 0.013, SK, TW + 0.1, 0);
    ell(wHead, [0, -0.008, 0], [0.024, 0.011, 0.024], WB, TW + 0.1, 4, { ...SML, flow: ACROSS, detail: 1 });      // his collar
    ell(wHead, [0, 0.036, 0], [0.03, 0.036, 0.029], SK, TW + 0.12, 12, { ...SML, keep: (p, n) => n.x < 0.2 && n.y < 0.45 });
    ell(wHead, [0.007, 0.047, 0], [0.031, 0.03, 0.031], DK, TW + 0.12, 30, { l: [0.018, 0.03], w: [0.01, 0.016], keep: (p, n) => n.x > -0.15 && n.y > -0.3 || n.y > 0.3 && n.x > -0.75, bare: true, grow: 1.05, flow: V3(1, -0.4, 0), jit: 0.5 });
    stroke(wHead, V3(-0.0295, 0.024, 0), V3(-1, 0, 0), V3(0, 0, 1), 0.03, 0.009, DK.mid[0], TW + 0.4, { lift: 0.003 });
    for (const sz of [-1, 1]) stroke(wHead, V3(-0.026, 0.043, sz * 0.012), V3(-0.9, 0.1, sz * 0.4).normalize(), V3(0, 0, 1), 0.013, 0.006, SK.deep[0], TW + 0.4, { lift: 0.002 });      // the shade under his brows

    // ---------------------------------------------------------- Jane: on the pedestal, in white, at work
    const TJ = 0.8, jRest = mat(...JANE.hip, JANE.yaw);
    const jLow = part(jRest);                                           // (her own frame: she faces -x)
    ell(jLow, [0.012, 0, 0], [0.074, 0.054, 0.086], WH, TJ, 16, { flow: ACROSS, ...MED });
    ell(jLow, [0.078, -0.03, 0], [0.062, 0.026, 0.092], WH, TJ, 12, { flow: V3(1, -0.3, 0), ...MED });      // her coat spread on the stone
    limb(jLow, [0.0, 0.006, 0], [-0.14, 0.012, 0], 0.06, 0.056, WH, TJ, 24, BIG);                           // her lap
    limb(jLow, [-0.14, 0.004, 0], [-0.19, -0.238, 0.004], 0.056, 0.102, WH, TJ - 0.03, 52, { l: [0.07, 0.13], w: [0.02, 0.036] });      // the skirt, falling from her knees in long folds
    ell(jLow, [-0.24, -0.246, 0.03], [0.03, 0.013, 0.016], DK, TJ, 2, { detail: 1, ...SML, flow: ACROSS });      // a shoe
    const jTor = part(jRest);
    limb(jTor, [0.0, 0.03, 0], [-0.03, 0.158, 0], 0.056, 0.044, WH, TJ + 0.08, 30, BIG);                    // her back, in the long white coat
    ell(jTor, [-0.03, 0.158, 0], [0.038, 0.03, 0.078], WH, TJ + 0.1, 14, { flow: V3(0, -0.4, 1), ...MED });  // her shoulders
    limb(jTor, [-0.032, 0.156, 0.07], [-0.046, 0.05, 0.098], 0.024, 0.02, WH, TJ + 0.1, 9, MED);            // the near arm, to the palette in her lap
    limb(jTor, [-0.046, 0.05, 0.098], [-0.112, 0.024, 0.072], 0.02, 0.016, WH, TJ + 0.1, 7, MED);
    ell(jTor, [-0.124, 0.027, 0.066], [0.014, 0.011, 0.013], SK, TJ + 0.14, 2, { ...SML, detail: 1 });
    // her palette: a dark oval tipped up to her, a few bright touches of paint along its edge, and the spare brushes
    ell(jTor, [-0.158, 0.046, 0.06], [0.056, 0.005, 0.04], WD, TJ + 0.16, 8, { rot: [-0.55, 0.3, 0.1], l: [0.03, 0.05], w: [0.012, 0.018], flow: ACROSS, tn: (n, r) => pick([...WD.lo, ...WD.deep, WD.mid[0]], r) });
    for (const [dx, dz, c] of [[-0.03, -0.012, '#fbf7ea'], [-0.005, -0.02, '#ecd9a6'], [0.02, -0.018, '#3c5230'], [0.035, -0.006, '#8e3b2a'], [-0.04, 0.012, '#a59fb6']]) stroke(jTor, V3(-0.158 + dx, 0.057 - dz * 0.55, 0.06 + dz), V3(0, 0.85, 0.52).normalize(), V3(1, 0, 0), 0.016, 0.011, col(c, 0.05), TJ + 0.5, { lift: 0.004 });
    for (let i = 0; i < 3; i++) limb(jTor, [-0.165, 0.045, 0.07], [-0.275 + i * 0.012, 0.05 + i * 0.016, 0.105 - i * 0.02], 0.003, 0.003, WD, TJ + 0.2, 1, { l: [0.05, 0.07], w: [0.005, 0.006] });
    const jHead = part(jRest.clone().multiply(mat(...JANE.neck, -0.6)));
    limb(jHead, [0.002, -0.016, 0], [0, 0.012, 0], 0.013, 0.012, SK, TJ + 0.16, 0);
    // (her face is in the shade of her hat, as he has it: a warm half tone, one lighter touch on the cheek)
    const FACE = set(['#d6ac8c'], ['#c0957a', '#b98e74'], ['#a0765c', '#96705a'], ['#785444']);
    ell(jHead, [-0.005, 0.036, 0], [0.029, 0.034, 0.028], FACE, TJ + 0.2, 8, { ...SML, keep: (p, n) => n.x < -0.25 && n.y < 0.35, tn: (n, r) => pick(n.y < -0.2 && r > 0.5 ? FACE.hi : FACE.mid, r) });
    ell(jHead, [0.004, 0.044, 0], [0.029, 0.029, 0.03], set(['#9a6238'], ['#7a4a2a'], ['#5c3620'], ['#40261a']), TJ + 0.2, 8, { bare: true, grow: 1.04, ...SML, keep: (p, n) => n.x > -0.55 && n.x < 0.2 && n.y > -0.1 });
    ell(jHead, [0.014, 0.026, 0], [0.034, 0.05, 0.039], WH, TJ + 0.2, 22, { ...MED, keep: (p, n) => n.x > -0.3 || n.y < -0.45 });
    stroke(jHead, V3(-0.031, 0.047, 0), V3(-1, 0.1, 0).normalize(), V3(0, 0, 1), 0.04, 0.012, FACE.deep[0], TJ + 0.5, { lift: 0.003 });      // the hat's shadow over her eyes                                               // the white scarf, round her hair and neck
    ell(jHead, [-0.012, 0.073, 0], [0.076, 0.009, 0.068], HAT, TJ + 0.26, 20, { rot: [0, 0, 0.2], flow: ACROSS, ...MED });                                       // her hat: the brim,
    ell(jHead, [0.004, 0.09, 0], [0.042, 0.024, 0.042], WH, TJ + 0.28, 14, { rot: [0, 0, 0.2], flow: ACROSS, ...MED });                                          // the crown, wrapped in the scarf
    const jArmU = part(), jArmF = part();                              // (rest poses set below, from the arm's own bones)
    {
      // where the arm is while the strokes land: reaching to the brush's place of rest
      const sh = V3(...JANE.sh).applyMatrix4(jRest), Ms = this.reach(sh, V3(...REST), new THREE.Matrix4(), new THREE.Matrix4());
      jArmU.rest.copy(Ms[0]); jArmU.inv.copy(Ms[0]).invert(); jArmF.rest.copy(Ms[1]); jArmF.inv.copy(Ms[1]).invert();
      limb(jArmU, [0, -0.004, 0], [0, L1 + 0.004, 0], 0.024, 0.021, WH, TJ + 0.16, 9, MED);
      limb(jArmF, [0, 0, 0], [0, 0.1, 0], 0.021, 0.015, WH, TJ + 0.18, 8, MED);
      ell(jArmF, [0, 0.112, 0], [0.012, 0.015, 0.012], SK, TJ + 0.2, 2, { ...SML, detail: 1 });
      limb(jArmF, [0, 0.115, 0], [0, L2 - 0.022, 0], 0.0034, 0.003, WD, TJ + 0.22, 2, { l: [0.05, 0.08], w: [0.005, 0.006] });       // the long brush
      limb(jArmF, [0, L2 - 0.024, 0], [0, L2, 0], 0.005, 0.0025, set(['#fffdf4'], ['#f2ecd8'], ['#d8d2c0'], ['#b8b2a6']), TJ + 0.24, 0);
    }

    // ---------------------------------------------------------- the rig: every solid thing, one draw call
    const parts = this.parts = { stone, easel, props, wil, wHead, jLow, jTor, jHead, jArmU, jArmF };
    let total = 0; for (const p of Object.values(parts)) total += p.n;
    const ru = this.ru = { uT: { value: 0 }, uPlay: { value: 0 }, uCanvas: { value: 0 }, uTumble: { value: 1 } };
    const rm = new THREE.MeshStandardMaterial({ vertexColors: true, color: 0xa0a0a0, roughness: 0.9, metalness: 0, emissive: 0xffffff, emissiveIntensity: 0.46, side: THREE.DoubleSide });
    rm.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, ru);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec3 aCen; attribute vec4 aFly; uniform float uT, uPlay, uCanvas, uTumble;')
        .replace('#include <begin_vertex>', `#include <begin_vertex>
  {
    vec3 rel = transformed - aCen;
    if (aFly.w >= 100.0) {
      // a stroke she paints: it grows from where the brush set down, to the show's own clock
      float k = clamp((uPlay - (aFly.w - 100.0)) / max(aFly.x, 0.01), 0.0, 1.0) * uCanvas;
      transformed = aCen + rel * (k < 1.0 ? k * (1.06 - 0.06 * k) : 1.0);
    } else {
      // a stroke of the picture: poured out from under the rail, down the wall and out over the floor to its place,
      // turning as it comes; a solid (no flight) grows up from its foot
      float k = clamp((uT - aFly.w) / ${FLY.toFixed(2)}, 0.0, 1.0), fl = step(1.0e-6, dot(aFly.xyz, aFly.xyz));
      float eh = k * k * (3.0 - 2.0 * k), ev = 1.0 - (1.0 - k) * (1.0 - k) * (1.0 - k);
      float s = k <= 0.0 ? 0.0 : mix(1.0 - (1.0 - k) * (1.0 - k), 0.45 + 0.55 * k, fl);
      float a = (1.0 - k) * (1.0 - k) * 4.2 * uTumble * fl * (fract(aFly.w * 37.7) > 0.5 ? 1.0 : -1.0), cs = cos(a), sn = sin(a);
      rel = vec3(cs * rel.x - sn * rel.z, rel.y, sn * rel.x + cs * rel.z);
      transformed = aCen + rel * s + aFly.xyz * vec3(1.0 - eh, 1.0 - ev, 1.0 - eh);
    }
  }`);
      sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n  totalEmissiveRadiance *= vColor.rgb;');
    };
    rm.customProgramCacheKey = () => 'sargent-strokes';
    const rig = this.rig = L.rig(12, total + 64, rm);
    this.I = {};
    for (const [name, p] of Object.entries(parts)) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(p.pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(p.nor, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(p.col, 3));
      g.setAttribute('aCen', new THREE.Float32BufferAttribute(p.cen, 3)); g.setAttribute('aFly', new THREE.Float32BufferAttribute(p.fly, 4));
      this.I[name] = rig.add(rig.geo(g)); rig.mat(this.I[name], this.V.m.multiplyMatrices(this.B, p.rest));
      p.pos = p.nor = p.col = p.cen = p.fly = null;
    }
    this.jRest = jRest; this.easelM = easelM;
    // where each of her strokes starts and ends, in the scene (the brush follows them)
    this.dabs = PICTURE.map(([t, d, a, b]) => ({ t, d, a: V3(a[0] * EASEL.hw, a[1] * EASEL.hh, 0.012).applyMatrix4(easelM), b: V3(b[0] * EASEL.hw, b[1] * EASEL.hh, 0.012).applyMatrix4(easelM) }));
    this.offCanvas = V3(0, 0, 1).transformDirection(easelM);

    this.buildFloor(L, col);
    this.buildWater(L, col);
    this.band = this.makeScore(L);
    this.hiss = L.voice().loop({ lp: 3400, hp: 650 });
    this.hold = Infinity; this.hide();
  },

  // Her painting arm: the upper arm from the shoulder S and the forearm, hand and brush to the tip T (scene metres),
  // the elbow dropped. Fills the two parts' matrices (each part runs along its own +y).
  reach(S, T, M1, M2) {
    const V = this.V;
    const d = V.d.copy(T).sub(S), len = d.length(), dist = Math.max(L2 - L1 + 0.012, Math.min(L1 + L2 - 0.004, len)); d.multiplyScalar(1 / Math.max(1e-5, len));
    const a = (L1 * L1 - L2 * L2 + dist * dist) / (2 * dist), h = Math.sqrt(Math.max(0, L1 * L1 - a * a));
    V.p.set(0.25, -1, -0.2).addScaledVector(d, -(0.25 * d.x - d.y - 0.2 * d.z)).normalize();
    V.el.copy(S).addScaledVector(d, a).addScaledVector(V.p, h); V.tip.copy(S).addScaledVector(d, dist);
    M1.compose(S, V.q.setFromUnitVectors(V.up, V.p.copy(V.el).sub(S).normalize()), V.s);
    M2.compose(V.el, V.q.setFromUnitVectors(V.up, V.p.copy(V.tip).sub(V.el).normalize()), V.s);
    return [M1, M2];
  },

  // ---------------------------------------------------------------- the floor: his ground, the trees, the pool
  buildFloor(L, col) {
    const pos = [], kind = [], sw = [], O = this.O;
    const S = (x, y, z) => V3(O.x + (L.tx * x + L.nx * z) * SC, O.y + y * SC, O.z + (L.tz * x + L.nz * z) * SC);
    const quad = (a, b, c, d, k, s = 0) => { for (const p of [a, b, c, a, c, d]) { pos.push(p.x, p.y, p.z); kind.push(k); sw.push(s, 0); } };
    quad(S(-1.08, 0.014, ZS), S(1.06, 0.014, ZS), S(1.06, 0.014, 1.26), S(-1.08, 0.014, 1.26), 0);
    [0.07, 0.095, 0.12].forEach((z, i) => quad(S(-0.87, 0, z), S(0.81, 0, z), S(0.81, 1.1, z), S(-0.87, 1.1, z), 1, i));
    quad(S(POOL.x0, POOL.y, POOL.z0), S(POOL.x1, POOL.y, POOL.z0), S(POOL.x1, POOL.y, POOL.z1), S(POOL.x0, POOL.y, POOL.z1), 2);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aKind', new THREE.Float32BufferAttribute(kind, 1)); g.setAttribute('aSW', new THREE.Float32BufferAttribute(sw, 2));
    const st = c => col(c, 0.22).getStyle();
    // his ground: warm earth dragged in broad level strokes, close in tone, a little green in it
    const ground = strokeTex({ size: 512, seed: 69780, n: 1000, len: [30, 84], width: [14, 30], bend: 0.25, lift: 0.07, base: st('#5d4a38'),
      colors: [['#66513c', 4], ['#574433', 3], ['#6f5a42', 3], ['#4f4a36', 1.2], ['#7a6248', 1.5], ['#64504a', 1]].map(([c, w]) => [st(c), w]), angle: (x, y, r) => (r() - 0.5) * 0.6 });
    // his trees: fat dabs of dark green, any way up
    const leaf = strokeTex({ size: 256, seed: 69781, n: 1500, len: [10, 26], width: [7, 13], bend: 0.5, lift: 0.02, base: st('#1f2a1c'),
      colors: [['#1f2a1c', 4], ['#26341f', 4], ['#2c3e25', 3], ['#22302a', 2], ['#36482a', 1.2], ['#4a5a2e', 0.35], ['#2e2c20', 0.8]].map(([c, w]) => [st(c), w]), angle: (x, y, r) => r() * Math.PI });
    const u = this.fu = {
      uO: { value: O.clone() }, uAx: { value: new THREE.Vector4(L.tx / SC, L.tz / SC, L.nx / SC, L.nz / SC) }, uC: { value: 0 }, uTime: { value: 0 }, uJ: { value: 0 }, uFill: { value: 0 },
      uJet: { value: new THREE.Vector2(JET.x, JET.z) }, tGround: { value: ground }, tLeaf: { value: leaf },
      uSh: { value: SHADOWS.map(s => new THREE.Vector4(...s)) }, uWet: { value: Array.from({ length: N_DROP }, () => new THREE.Vector4(0, 0, 0.03, 0)) },
      cDeep: { value: col('#22332a', 0.2) }, cMid: { value: col('#3f5f54', 0.2) }, cSky: { value: col('#9fbcb0', 0.15) }, cFoam: { value: col('#f6f3e8', 0.08) }, cStone: { value: col('#d9cdb4', 0.15) },
      cEarth: { value: col('#5e4d3d', 0.22) }, cSun: { value: new THREE.Color(1.95, 1.8, 1.5) }, cShade: { value: new THREE.Color(0.8, 0.74, 0.84) },
    };
    const m = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide });
    m.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, u);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float aKind; attribute vec2 aSW; varying float vKind; varying vec2 vSW;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\n  vKind = aKind; vSW = aSW;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
uniform vec3 uO, cDeep, cMid, cSky, cFoam, cStone, cSun, cShade, cEarth; uniform vec4 uAx; uniform vec2 uJet; uniform float uC, uTime, uJ, uFill;
uniform sampler2D tGround, tLeaf; uniform vec4 uSh[${SHADOWS.length}]; uniform vec4 uWet[${N_DROP}];
varying float vKind; varying vec2 vSW; vec3 fCol; float fA;`)
        .replace('#include <map_fragment>', `#include <map_fragment>
{
  vec2 lq = lifeP.xz - uO.xz; vec2 q = vec2(dot(lq, uAx.xy), dot(lq, uAx.zw)); float hy = (lifeP.y - uO.y) / ${SC.toFixed(3)};
  if (vKind > 1.5) {
    // the pool: dark green, his level touches of the sky in it, the balustrade's pale band along the far side, the
    // jet's own white lying down the middle towards you, rings going out from its foot
    vec4 ws = texture2D(tGround, vec2(q.x / 1.1 + 0.3, q.y / 0.34));
    float d = length(q - uJet);
    vec3 c = mix(cDeep, cMid, smoothstep(0.45, 0.8, ws.a) * 0.75);
    c = mix(c, cSky, smoothstep(0.86, 0.98, ws.a) * 0.5);
    c = mix(c, cStone, (1.0 - smoothstep(0.0, 0.07, q.y - ${POOL.z0.toFixed(2)} + (ws.a - 0.5) * 0.04)) * 0.6);
    float rings = sin((d - uTime * 0.22) * 95.0) * exp(-d * 5.5) * min(1.0, uJ * 2.0);
    c += cFoam * rings * 0.1;
    float wob = (ws.a - 0.5) * 0.03 + 0.008 * sin(q.y * 60.0 - uTime * 3.0);
    float column = exp(-pow((q.x - uJet.x + wob) / 0.034, 2.0)) * smoothstep(uJet.y - 0.01, uJet.y + 0.03, q.y) * (1.0 - smoothstep(uJet.y + 0.02, uJet.y + 0.03 + 0.26 * uJ, q.y));
    c = mix(c, cFoam, column * 0.6 * min(1.0, uJ * 1.5));
    c = mix(c, cFoam, exp(-pow(d / (0.03 + 0.035 * uJ), 2.0)) * min(1.0, uJ * 4.0) * 0.9);
    float fill = smoothstep(0.0, 0.06, uFill * 1.1 - d + (ws.a - 0.5) * 0.12);
    fCol = c; fA = fill * 0.97;
  } else if (vKind > 0.5) {
    // the trees: three flats of dabs, one behind another, coming up from the floor; their tops broken dab by dab
    float l = vSW.x; vec4 ts = texture2D(tLeaf, vec2(q.x, hy) / 0.5 + l * 0.37);
    float top = l < 0.5 ? 0.66 + 0.2 * sin(q.x * 2.6 + 1.9) + 0.07 * sin(q.x * 7.0 + 0.5) + 0.03 * sin(q.x * 17.0 + 2.0)
      : l < 1.5 ? 0.5 + 0.14 * sin(q.x * 3.4 + 4.0) + 0.05 * sin(q.x * 9.0 + 1.0) : 0.33 + 0.1 * sin(q.x * 4.1 + 0.7) + 0.04 * sin(q.x * 12.0 + 3.0);
    float sd = smoothstep(0.5, 0.84, abs(q.x + 0.03));
    top = min(top * 1.14, 1.04) * (1.0 - sd * sd) * smoothstep(0.1 + 0.12 * l, 0.75 + 0.12 * l, uC);
    float a = step(hy + (ts.a - 0.55) * 0.2, top);
    // (his broad masses of light and dark in them, the sun in the tops and on the right)
    float mass = sin(q.x * 4.3 + l * 2.1 + 0.6 * sin(hy * 7.0)) * sin(hy * 6.1 + q.x * 2.0 + l);
    vec3 c = ts.rgb * (0.85 + 0.3 * l) * (1.0 + 0.5 * mass);
    c *= mix(vec3(0.8, 0.92, 1.08), vec3(1.7, 1.6, 0.9), smoothstep(-0.5, 0.8, q.x) * 0.45 * (0.5 + 0.5 * mass) + 0.5 * smoothstep(top - 0.2, top, hy));
    fCol = c; fA = a;
  } else {
    // the ground: laid from the wall outwards, broken at its edge stroke by stroke; his sun on it, lilac in the shade
    vec4 gs = texture2D(tGround, q / 0.85); float ang = atan(q.y - 0.34, q.x + 0.02);
    float r = length((q - vec2(-0.02, 0.34)) / vec2(0.96, 0.7)) / (1.0 + 0.1 * sin(ang * 3.0 + 1.0) + 0.07 * sin(ang * 5.0 + 2.3)) + (gs.a - 0.6) * 0.42;
    float laid = smoothstep(0.0, 0.05, uC * 1.5 - 0.08 - q.y - (gs.a - 0.5) * 0.3);
    float sunny = 0.42 + 0.16 * sin(q.x * 4.1 + 1.3) * sin(q.y * 5.3 + 0.4) + 0.12 * sin(q.x * 2.3 - q.y * 3.1) + (q.y - 0.8) * 1.0 + q.x * 0.2 + (gs.a - 0.5) * 0.12;
    vec3 gc = mix(cEarth, gs.rgb, 0.6);
    vec3 c = gc * mix(cShade, cSun, smoothstep(0.3, 0.62, sunny));
    float shd = 0.0;
    for (int i = 0; i < ${SHADOWS.length}; i++) { vec2 e = (q - uSh[i].xy) / uSh[i].zw; shd = max(shd, smoothstep(1.0, 0.35, length(e))); }
    c = mix(c, gc * cShade * 0.62, shd * smoothstep(0.5, 1.3, uC));
    for (int i = 0; i < ${N_DROP}; i++) { float dw = length(q - uWet[i].xy); c *= 1.0 - 0.42 * uWet[i].w * smoothstep(uWet[i].z, uWet[i].z * 0.45, dw + (gs.a - 0.5) * 0.012); }
    fCol = c; fA = step(r, 1.0) * laid;
  }
}`)
        .replace('#include <opaque_fragment>', '  outgoingLight = fCol; diffuseColor.a = fA;\n#include <opaque_fragment>');
    };
    m.customProgramCacheKey = () => 'sargent-floor';
    this.floor = new THREE.Mesh(g, m); this.floor.renderOrder = 5;       // (after the gallery's own pools of lamplight, which would wash it out)
    L.add(this.floor);
  },

  // ---------------------------------------------------------------- the water: the jet, its spray, the drops it throws
  buildWater(L, col) {
    const atlas = canvasTexture(256, 256, (g, w, h) => {
      g.clearRect(0, 0, w, h); let s = 11; const r = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
      // 0: a drag of white paint, upright: bristle lines in a soft body, ragged at both ends
      g.lineCap = 'round';
      for (let i = 0; i < 20; i++) { const x = 64 + (r() - 0.5) * 50, k = 1 - Math.abs(x - 64) / 34, y0 = 12 + r() * 20 + (1 - k) * 22, y1 = 116 - r() * 20 - (1 - k) * 22, v = 150 + Math.floor(r() * 105); g.strokeStyle = `rgba(${v},${v},${v},${0.3 + 0.4 * r()})`; g.lineWidth = 3 + r() * 6; g.beginPath(); g.moveTo(x + (r() - 0.5) * 4, y0); g.quadraticCurveTo(x + (r() - 0.5) * 8, 64, x + (r() - 0.5) * 5, y1); g.stroke(); }
      const gr = g.createRadialGradient(64, 64, 0, 64, 64, 46); gr.addColorStop(0, 'rgba(235,235,235,0.5)'); gr.addColorStop(1, 'rgba(235,235,235,0)'); g.save(); g.translate(64, 64); g.scale(0.62, 1.2); g.translate(-64, -64); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); g.restore();
      // 1: spray: a soft cloud of small touches
      for (let i = 0; i < 60; i++) { const a = r() * TAU, rr = Math.sqrt(r()) * 44, x = 192 + Math.cos(a) * rr, y = 64 + Math.sin(a) * rr, v = 170 + Math.floor(r() * 85); const q = g.createRadialGradient(x, y, 0, x, y, 5 + r() * 9); q.addColorStop(0, `rgba(${v},${v},${v},${0.35 + 0.3 * r()})`); q.addColorStop(1, `rgba(${v},${v},${v},0)`); g.fillStyle = q; g.fillRect(x - 16, y - 16, 32, 32); }
      // 2: one drop
      const dq = g.createRadialGradient(64, 192, 0, 64, 192, 40); dq.addColorStop(0, 'rgba(255,255,255,1)'); dq.addColorStop(0.45, 'rgba(255,255,255,0.9)'); dq.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = dq; g.fillRect(0, 128, 128, 128);
    }, false);
    const geo = new THREE.PlaneGeometry(1, 1);
    this.aVel = new THREE.InstancedBufferAttribute(new Float32Array(NC * 3), 3).setUsage(THREE.DynamicDrawUsage);
    this.aInfo = new THREE.InstancedBufferAttribute(new Float32Array(NC * 4), 4).setUsage(THREE.DynamicDrawUsage);
    this.aCol = new THREE.InstancedBufferAttribute(new Float32Array(NC * 3), 3).setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('aVel', this.aVel); geo.setAttribute('aInfo', this.aInfo); geo.setAttribute('aCol', this.aCol);
    const m = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide });
    const cu = this.cu = { tAtlas: { value: atlas } };
    m.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, cu);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec3 aVel; attribute vec4 aInfo; attribute vec3 aCol; varying vec4 vInfo; varying vec3 vCol; varying vec2 vQ;')
        .replace('#include <project_vertex>', `vec4 mvPosition = modelViewMatrix * vec4(instanceMatrix[3].xyz, 1.0);
  { vec3 vv = (modelViewMatrix * vec4(aVel, 0.0)).xyz; vec2 upv = dot(vv.xy, vv.xy) > 1.0e-8 ? normalize(vv.xy) : vec2(0.0, 1.0);
    mvPosition.xy += vec2(upv.y, -upv.x) * position.x * instanceMatrix[0][0] + upv * position.y * instanceMatrix[1][1]; }
  vQ = position.xy + 0.5; vInfo = aInfo; vCol = aCol;
  gl_Position = projectionMatrix * mvPosition;`);
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform sampler2D tAtlas; varying vec4 vInfo; varying vec3 vCol; varying vec2 vQ;')
        .replace('#include <map_fragment>', `{
  float kd = vInfo.x; vec2 cell = kd < 0.5 ? vec2(0.0, 1.0) : kd < 1.5 ? vec2(1.0, 1.0) : vec2(0.0, 0.0);
  vec4 tx = texture2D(tAtlas, (clamp(vQ, 0.02, 0.98) + cell) * 0.5);
  float a = tx.a * vInfo.y; if (a < 0.012) discard;
  diffuseColor = vec4(vCol * (0.72 + 0.4 * tx.r) * vInfo.z, a);
}`);
    };
    m.customProgramCacheKey = () => 'sargent-water';
    const mesh = this.cards = new THREE.InstancedMesh(geo, m, NC);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); mesh.renderOrder = 6;
    const im = mesh.instanceMatrix.array; for (let i = 0; i < NC; i++) { im[i * 16 + 10] = 1; im[i * 16 + 15] = 1; }
    L.add(mesh);
    const R = () => L.rand();
    this.PJ = Array.from({ length: N_JET }, (_, i) => ({ ph: (i * 0.618034 + 0.3 * R()) % 1, a: R(), b: R(), c: R(), d: R(), e: R(), veil: i % 5 >= 3 }));
    this.PS = Array.from({ length: N_SPARK }, () => ({ ph: R(), a: R(), b: R(), c: R(), d: R() }));
    // the handful of drops the plume throws out, the way the wind is taking the spray: low arcs to the right, behind
    // the two of them, some back into the pool, the rest onto his ground beyond the balustrade (a dark spot each)
    const LAND = [[0.84, 0.56], [0.9, 0.64], [0.82, 0.44], [0.88, 0.34], [0.8, 0.26], [0.4, 0.3], [0.52, 0.42], [0.3, 0.42], [0.58, 0.25]];
    this.PD = LAND.map(([x, z], i) => { const pool = x < POOL.x1, tf = 0.46 + 0.16 * R(), y0 = JET.y + JET.H * 0.93, y1 = pool ? POOL.y : 0.014; return { x, z, pool, t0: T_PLUME + 0.42 + 0.3 * R(), tf, y0, vy: (y1 - y0 + 0.5 * JET.g * tf * tf) / tf, r: 0.014 + 0.014 * R() }; });
    this.cWhite = col('#fbf8ee', 0.06); this.cBlue = col('#c3ced2', 0.12); this.cWarm = col('#fff3d6', 0.04); this.cVeil = col('#e4eae8', 0.1);
  },

  // ---------------------------------------------------------------- the music, and the sounds of the thing
  makeScore(L) {
    const s = score(L), calm = L.calm;
    const lead = { type: 'triangle', vol: 0.034, over: 2, overVol: 0.2, attack: 0.005, legato: 0.72 }, bass = { type: 'triangle', vol: 0.02, attack: 0.008, legato: 0.6 };
    s.tune(SPRING, T0 - 0.5 * BT, BPM, lead); s.tune(SPRING_BASS, T0, BPM, bass);
    // the echo, as he wrote it, coming to rest on the note the tune goes on from; and now and then again, far off, while you stay
    s.tune(SPRING + ' E5:1.5', T_DONE - 0.5 * BT, BPM, { ...lead, vol: 0.02 }); s.tune(SPRING_BASS + ' | E3:1.5', T_DONE, BPM, { ...bass, vol: 0.012 });
    for (let k = 0; k < 4; k++) { const t = bar(10 + k * 8); s.tune(SPRING + ' E5:1.5', t - 0.5 * BT, BPM, { ...lead, vol: 0.014 }); s.tune(SPRING_BASS + ' | E3:1.5', t, BPM, { ...bass, vol: 0.008 }); }
    s.hit(0.1, { d: 1.5, vol: 0.02, lp: 1500, attack: 0.5 });                                  // the paint pouring out
    for (const [t, d] of PICTURE) s.hit(t, { d: 0.05 + d * 0.5, vol: 0.011, bp: 2300 + 900 * _h(t), q: 0.9, attack: 0.012 });      // the brush on the canvas
    s.hit(T_SPURT, { d: 0.5, vol: 0.022, hp: 900, attack: 0.08 });
    s.hit(T_PLUME, { d: 1.0, vol: calm ? 0.026 : 0.045, hp: 700, attack: calm ? 0.3 : 0.12 });   // the plume going up
    this.PD.forEach((p, i) => s.hit(p.t0 + p.tf, { d: 0.035, vol: 0.012, bp: 3000 + 1500 * _h(i, 2), q: 2, attack: 0.002 }));      // its drops on the floor
    return s.done();
  },

  hide() { if (!this.rig) return; this.rig.mesh.visible = false; this.cards.visible = false; this.floor.visible = false; },
  start(L) { this.band.from(0); this.hold = Infinity; },
  back(L) { this.hold = L.t; if (!L.quiet) L.k.synth.noise(0.7, { vol: 0.014, lp: 1300 }); },
  end() { this.hide(); this.hiss.set(0); },
  reset() { this.hide(); this.hold = Infinity; if (this.hiss) this.hiss.set(0); },

  // The jet's strength at time t (0: still water, 1: the whole plume): a low bubbling as the basin fills, the first
  // short spout, then the plume, which rises and falls a little for as long as it plays; and it drops when the look ends.
  jet(t) {
    const h = this.hold, tt = Math.min(t, h);
    let j = 0.07 * ramp(tt, 0.95, 1.4);
    const s = tt - T_SPURT; if (s > 0) j = Math.max(j, 0.07 + 0.66 * (s < 0.14 ? ease.out(s / 0.14) : s < 0.42 ? 1 : 1 - ease.inOut((s - 0.42) / 0.5)));
    const p = tt - T_PLUME; if (p > 0) j = Math.max(j, ease.out(p / 0.2) * (0.955 + 0.045 * Math.sin(p * 2.3 + 1.2)));
    if (t > h) j *= 1 - ease.smooth((t - h) / 0.45);
    return j;
  },

  // Where the tip of her brush is at show-time t, into `out`; returns how far she is at rest (0: on the canvas, 1: brush held back).
  brush(t, out) {
    const D = this.dabs, n = D.length;
    let i = -1; while (i + 1 < n && D[i + 1].t <= t) i++;
    const cur = i >= 0 ? D[i] : null, nxt = i + 1 < n ? D[i + 1] : null;
    let rest = 1;
    if (cur && t < cur.t + cur.d) { out.lerpVectors(cur.a, cur.b, ease.smooth((t - cur.t) / cur.d)); rest = 0; }
    else {
      const since = cur ? t - cur.t - cur.d : 1e3, until = nxt ? nxt.t - t : 1e3, gap = nxt && cur ? nxt.t - cur.t - cur.d : 1;
      rest = ease.smooth(ramp(Math.min(since, until), 0.1, 0.42));
      if (cur && nxt) out.lerpVectors(cur.b, nxt.a, ease.inOut(since / gap)); else out.copy(cur ? cur.b : nxt.a);
      out.addScaledVector(this.offCanvas, 0.035 * Math.sin(Math.PI * clamp01(nxt && cur ? since / gap : Math.min(since, until) / 0.3)));
    }
    return rest;
  },

  update(L, dt) {
    const ph = L.phase, showing = ph === 'wake' || ph === 'play';
    if (!showing && ph !== 'return') { this.hide(); return; }
    // tp: the show's clock (held on the way back); c: the building (it rewinds); tw: the water's clock (it runs on)
    const tp = showing ? L.t : this.hold, c = showing ? L.t : Math.min(this.hold, BUILT + 0.35) * (1 - ease.inOut(L.ret)), tw = showing ? L.t : this.hold + L.r;
    if (showing) this.band.play(L.t);
    const V = this.V, rig = this.rig, I = this.I, B = this.B, calm = L.calm;
    rig.mesh.visible = c > 0.15; this.floor.visible = c > 0.03;
    this.ru.uT.value = c; this.ru.uPlay.value = tp; this.ru.uCanvas.value = ease.smooth(ramp(c, this.canvasBorn + FLY, this.canvasBorn + FLY + 0.2)); this.ru.uTumble.value = calm ? 0.5 : 1;
    const J = this.jet(tw);
    const fu = this.fu; fu.uC.value = c; fu.uTime.value = tw; fu.uJ.value = J; fu.uFill.value = ramp(c, 0.5, 1.15);

    // ---- Jane: she looks at the fountain, turns to her canvas and dabs, and leans in to it as she works
    const tip = V.tip, restK = this.brush(tp, tip), done = ease.smooth(ramp(tp, T_DONE + 0.3, T_DONE + 1.3));
    V.v.set(...REST); if (done > 0) V.v.lerp(V.w.set(...LAP), done * 0.8);
    V.v.y += 0.006 * Math.sin(tp * 1.7);
    tip.lerp(V.v, restK);
    const lean = 0.05 + 0.17 * (1 - restK) + 0.012 * Math.sin(tp * 1.3);
    // (during the two long notes she looks up at the water; otherwise at her work when the brush is near it)
    const up1 = ease.smooth(ramp(tp, T_SPURT - 0.1, T_SPURT + 0.2)) * (1 - ease.smooth(ramp(tp, T_SPURT + 0.75, T_SPURT + 1.1)));
    const watch = Math.max(up1, restK * (0.75 + 0.25 * Math.sin(tp * 0.45)), 0.55 * ease.smooth(ramp(tp, T_PLUME + 0.3, T_PLUME + 0.6)) * (1 - ease.smooth(ramp(tp, T_RUN - 0.15, T_RUN + 0.05))));
    const headYaw = lerp(-0.2, -1.05, clamp01(watch)), headPitch = -0.16 * clamp01(watch) * (0.4 + 0.6 * J);
    V.a.multiplyMatrices(this.jRest, V.m.makeRotationZ(lean));                         // her body, leaning from the hips
    rig.mat(I.jTor, V.m.multiplyMatrices(B, V.a));
    V.b.compose(V.v.set(...JANE.neck), V.q.setFromEuler(V.e.set(0, headYaw, headPitch - lean * 0.6, 'YXZ')), V.s);
    rig.mat(I.jHead, V.m.multiplyMatrices(B, V.b.premultiply(V.a)));
    V.sh.set(...JANE.sh).applyMatrix4(V.a);
    this.reach(V.sh, tip, V.a, V.b);
    rig.mat(I.jArmU, V.m.multiplyMatrices(B, V.a)); rig.mat(I.jArmF, V.m.multiplyMatrices(B, V.b));
    // ---- Wilfrid: he watches her canvas; his head goes back to look up at the plume; a nod at the last touch
    const wUp = ease.smooth(ramp(tp, T_PLUME + 0.15, T_PLUME + 0.6)) * (1 - ease.smooth(ramp(tp, T_RUN + 0.4, T_RUN + 1.0))), wUp1 = 0.5 * ease.smooth(ramp(tp, T_SPURT + 0.05, T_SPURT + 0.3)) * (1 - ease.smooth(ramp(tp, T_SPURT + 0.7, T_SPURT + 1.0)));
    const nod = Math.sin(Math.PI * ramp(tp, T_DONE + 0.1, T_DONE + 0.8)) * 0.16, wu = Math.max(wUp, wUp1);
    V.a.compose(V.v.set(...WIL.neck), V.q.setFromEuler(V.e.set(0, lerp(WIL.yaw, -0.35, wu) + 0.04 * Math.sin(tp * 0.6), -0.3 * wu + nod + 0.012 * Math.sin(tp * 1.1), 'YXZ')), V.s);
    rig.mat(I.wHead, V.m.multiplyMatrices(B, V.a));

    this.water(L, tw, tp, J, c, calm);
    const near = Math.max(0, 1 - Math.hypot(L.k.G.camera.position.x - L.cx, L.k.G.camera.position.z - L.cz) / 11);
    this.hiss.set(L.quiet ? 0 : (0.004 + 0.022 * J) * near * (showing ? 1 : 1 - L.ret));
    L.voice().place();
    if (!showing && L.ret >= 1) this.hide();
  },

  // The water for this moment: every streak on its own arc, worked out from the clock.
  water(L, tw, tp, J, c, calm) {
    const O = this.O, tx = L.tx, tz = L.tz, nx = L.nx, nz = L.nz, im = this.cards.instanceMatrix.array, vel = this.aVel.array, info = this.aInfo.array, colr = this.aCol.array, g = JET.g;
    const put = (i, x, y, z, w, h, vx, vy, vz, kind, a, br, cc) => {
      const k = i * 16; im[k] = w * SC; im[k + 5] = h * SC; im[k + 12] = O.x + (tx * x + nx * z) * SC; im[k + 13] = O.y + y * SC; im[k + 14] = O.z + (tz * x + nz * z) * SC;
      vel[i * 3] = tx * vx + nx * vz; vel[i * 3 + 1] = vy; vel[i * 3 + 2] = tz * vx + nz * vz;
      info[i * 4] = kind; info[i * 4 + 1] = a; info[i * 4 + 2] = br; colr[i * 3] = cc.r; colr[i * 3 + 1] = cc.g; colr[i * 3 + 2] = cc.b;
    };
    const off = i => { info[i * 4 + 1] = 0; im[i * 16] = 0; im[i * 16 + 5] = 0; };
    let n = 0, any = false;
    // the jet: up the middle in long white drags, over at the top, and down to the right as a thinner veil
    for (const p of this.PJ) {
      const i = n++, T = TF * (0.94 + 0.12 * p.a), age = ((tw / T + p.ph) % 1) * T, je = this.jet(tw - age);
      if (je < 0.03) { off(i); continue; }
      const v = V0 * Math.sqrt(je) * (0.86 + 0.16 * p.b), tf = 2 * v / g;
      if (age > tf) { off(i); continue; }
      const sp = p.veil ? 1 : 0.5, vx = (p.c - 0.5) * 0.2 * sp + 0.02, vz = (p.d - 0.5) * 0.07 * sp - 0.012, wind = p.veil ? 0.16 : 0.05;
      const x = JET.x + vx * age + 0.5 * wind * age * age, y = JET.y + v * age - 0.5 * g * age * age, z = JET.z + vz * age, vy = v - g * age, q = age / tf;
      const speed = Math.abs(vy), fall = vy < 0 ? 1 : 0, w = (0.05 + 0.045 * p.e) * (0.65 + 0.8 * q) * (p.veil ? 1.4 : 1), h = w * (1.3 + 0.9 * Math.min(1.6, speed));
      const a = Math.min(1, age / 0.06) * Math.min(1, (tf - age) / 0.1) * (p.veil ? 0.46 : 0.9) * (fall ? 0.7 : 1) * Math.min(1, je * 6);
      put(i, x, y, z, w, h, vx + wind * age, vy, vz, speed < 0.55 ? 1 : 0, a, 1 + 0.25 * (1 - Math.min(1, speed)), p.veil || fall ? (p.e > 0.5 ? this.cVeil : this.cBlue) : (p.e > 0.3 ? this.cWhite : this.cBlue));
      any = true;
    }
    // the spray at the top, catching the sun: small bright drops hanging about the crown of it
    // (as the plume first breaks they fly a little wider: the splash)
    const burst = this.hold > T_PLUME ? 1 + 0.7 * Math.sin(Math.PI * ramp(tw, T_PLUME + 0.3, T_PLUME + 1.1)) : 1;
    for (const p of this.PS) {
      const i = n++, life = 0.9 + 0.5 * p.a, age = ((tw / life + p.ph) % 1) * life, je = this.jet(tw - age), q = age / life;
      if (je < 0.45) { off(i); continue; }
      const x = JET.x + (p.b - 0.5) * 0.2 * (0.4 + q) * burst + 0.1 * q * q, y = JET.y + JET.H * je * (0.9 + 0.1 * p.c) + 0.05 * q - 0.3 * q * q * burst, z = JET.z + (p.d - 0.5) * 0.09 - 0.02;
      const tw_ = calm ? 1 : 0.72 + 0.28 * Math.sin(tw * 5 + p.ph * 40);
      put(i, x, y, z, (0.016 + 0.014 * p.c) * (0.6 + 0.4 * burst), (0.016 + 0.014 * p.c) * (0.6 + 0.4 * burst), 0, 1, 0, 2, Math.sin(Math.PI * q) * 0.95, 1.35 * tw_, this.cWarm);
      any = true;
    }
    // the handful of drops thrown out when the plume breaks: over their heads, down onto his ground, a dark spot each
    const wet = this.fu.uWet.value;
    this.PD.forEach((p, k) => {
      const i = n++, age = this.hold > p.t0 ? tw - p.t0 : -1, wv = wet[k];      // (thrown only if the plume went up; and they fall on, whatever the look does)
      if (age > 0 && age < p.tf) { const s = age / p.tf, x = lerp(JET.x, p.x, s), z = lerp(JET.z, p.z, s), y = p.y0 + p.vy * age - 0.5 * g * age * age; put(i, x, y, z, p.r, p.r * 1.7, (p.x - JET.x) / p.tf, p.vy - g * age, (p.z - JET.z) / p.tf, 2, Math.min(1, age / 0.08), 1.25, this.cWhite); any = true; }
      else off(i);
      const dry = age - p.tf; wv.set(p.x, p.z, p.r * 1.9, dry > 0 && !p.pool ? Math.min(1, dry / 0.05) * (1 - ease.smooth(ramp(dry, 5, 12))) * ease.smooth(ramp(c, 0.4, 1.2)) : 0);
    });
    // the boil at its foot
    for (let k = 0; k < N_FOAM; k++) {
      const i = n++, a = k / N_FOAM * TAU + tw * (calm ? 0.6 : 1.3), r = 0.02 + 0.03 * J;
      if (J < 0.02) { off(i); continue; }
      put(i, JET.x + Math.cos(a) * r, JET.y + 0.012 + 0.01 * J, JET.z + Math.sin(a) * r * 0.7, 0.05 + 0.05 * J, 0.03 + 0.03 * J, 1, 0, 0, 1, Math.min(1, J * 5) * 0.7, 1.05, this.cWhite); any = true;
    }
    this.cards.visible = any; this.cards.count = NC;
    this.cards.instanceMatrix.needsUpdate = true; this.aVel.needsUpdate = true; this.aInfo.needsUpdate = true; this.aCol.needsUpdate = true;
  },
});
