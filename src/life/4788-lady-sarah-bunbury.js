// Sir Joshua Reynolds, Lady Sarah Bunbury Sacrificing to the Graces (1763–65), Gallery 218. The word: wreath.
//
// A marriage portrait in fancy dress, commissioned by her husband-to-be: Lady Sarah, in a pink robe, pours oil on a
// flame before a statue of the three Graces, and its smoke goes up to them. The museum's note stops at the libation.
// Look longer and the picture is an exchange, as the Graces were read of old (one gives, one receives, one gives
// back). She has hung their pedestal with a long garland of flowers (white and pink roses, blue, orange, a white
// star, in his loose curled touches), and one rose of it has dropped and lies on the floor by the tripod's foot. And
// above, one of the three holds something small and pale out towards her in both hands, which is usually read, and
// which I read, as a wreath. Flowers given; a wreath given back. Pouring is the word of the picture next door
// (Robert's fountains); this one's own is the answer to the offering.
//
// Look at it and a soft shade comes out over the floor under the picture, and on the left, below the place where the
// tripod stands, the light of its flame falls on the boards (his flame is pink and pale, not orange). Smoke comes out
// from under the frame there, a thin curl of it, and the garland comes down it, flower after flower, in one open turn
// as it winds down the pedestal in the picture. On that turn one rose shakes loose, drops into the light and lies on
// the floor, as his does. The rest sweeps out low and round into a ring, tilted up towards you, a ring of smoke going
// before it; the first flower comes round to meet the last, slower and slower, and stops one flower short. A hush.
// The rose on the floor stirs, lifts, and goes up into the gap. The ring takes its weight: it dips and steadies, a
// swell goes round it both ways from the rose, it breathes out a little smoke, a few petals let go, and the light
// comes up under it. Then it only hangs there, a wreath of his flowers, turning a little one way and back, while the
// smoke that brought it drifts on up the way it came and in under the frame, towards the three it was sent to: the
// eye follows it up, to the hands held out in the picture. When you stop looking the wreath opens where the rose
// went in and the garland runs home the way it came, the rose first.
//
// The music is an air London was singing: Handel's "Where'er you walk" from Semele (1744; Pope's words: "Where'er
// you tread, the blushing flow'rs shall rise"), its first sentence, at a singer's pace, quietly. The bar the strings
// play alone is the garland coming; the voice's "Where'er you walk" is the rose, which goes in on "walk"; "cool gales
// shall fan the glade" is the petals coming down. It plays once, to its cadence. (Set down from a modern edition for
// flute and keyboard: the voice's line, the strings' answers as that edition gives them, and the bass.)
//
// How it is made: three draw calls. The flowers are painted marks, one to a flower (about ninety with the leaves:
// each a small card that faces you, its curled touches, its shade and its loaded light worked out in the shader, lost
// at its edge into his brown ground; behind them, all along, sprays of dark leaves, as his garland has his dark
// between its blooms; his light, from high on the left, models the whole of it as a round thing). The smoke is about
// a hundred and twenty soft scumbled touches along the garland's way, a few centimetres apart, that lighten what is
// behind them more than they cover it. The shade, the flame's light, the wreath's shadow and the rose's are one flat
// mesh on the floor. Their colours are measured from the picture and set down as what must go in for the game's
// grade to bring them out the same. Nothing stands higher than about 0.7 m, and the taller part is close to the
// wall: the look camera stands back between the room's two glass cases so that the whole of this tall picture is in
// view, and from it and the checks' other eight the guard has nothing to cut. Nothing is solid, nothing stays out
// after the look, and the flowers and the smoke draw aside from the toy: within about half a metre of it they shrink
// to nothing, so nothing is driven through. With "Reduce motion and flashing" on, the garland comes at about six
// tenths of the speed, the flame's light is steady, the dip and the swell are slow and small, the smoke drifts at
// half speed, and the music and the rose's landing are quieter.
//
// What it does not do: nobody comes out of the picture, not Lady Sarah, not the girl beside her, and not the three
// Graces, who are goddesses and unclothed; the things of the rite stay in it with them (the tripod and its serpent,
// the dish, the jug, the oil and the fire itself: only its light and its smoke come out); and the wreath is not held
// out to the toy, set on it or collected, because in the picture it is the Graces' to give.
import * as THREE from 'three';
import { lifeFor, ease, ramp, clamp01, lerp } from '../paintlife.js';
import { score, noise } from './stagecraft.js';
import { hz } from './tunes.js';

const TAU = Math.PI * 2, DEG = Math.PI / 180;
// Everything below is in the scene's own metres: x along the wall from the picture's middle (to the right), y up
// from the floor, z out from the canvas plane.
// The garland comes out of the wall under the frame's left, below where it hangs in the picture, and winds down
// round an upright axis; then out over the floor and into the ring.
const AX = { x: -0.45, z: 0.25, r: 0.17, y0: 0.6, y1: 0.3, a0: 90, a1: 540 };
// The ring: its middle, its radius, how far its top leans back to the wall, and where on it the garland comes in
// (and the rose goes in at the end): low on the left.
const RING = { x: 0.2, y: 0.31, z: 0.72, R: 0.36, tilt: 60 * DEG, phiE: 215 * DEG };
const CIRC = TAU * RING.R, GAP = 0.094;                    // the rose's place: this much of the ring either side of it
const DS = 0.01;                                           // the way in, set down a point every centimetre
const NBIG = 26, NMASS = 24, NPETAL = 7;
// The story, in show seconds (stretched when motion is reduced).
const T_OUT = 0.3, T_ROUND = 5.4, T_CLOSE = 6.72;
const BPM = 56, BEAT = 60 / BPM;                           // the music: "walk" falls on T_CLOSE, six beats in
const ROSE = { lag: 0.17, a: 135, size: 0.112, h: 0.042, g: 7, v: 0.42 };      // it rides this far behind the first flower, and lets go here on the first turn
const PETAL_AT = [0.22, 0.55, 1.0, 1.65, 4.6, 8.4, 12.5];  // petals that let go, seconds after the ring closes
// Kinds of mark.
const K_ROSE = 0, K_WROSE = 1, K_STAR = 2, K_BLUE = 3, K_GOLD = 4, K_BUD = 5, K_LEAF = 6, K_PETAL = 7, K_MASS = 8;
// His colours for them (a shade, and the light loaded on it), measured from the garland in the picture, which is low
// in key and warm (his whites are cream, his pinks dusty, his blue a slate). They are set down here as what must go
// in for the game's grade to bring them out as the picture's own.
const PAINT = {
  rose: ['#7c6a64', '#a58c82'], roseD: ['#735f56', '#967d75'], white: ['#746f63', '#ada18c'], star: ['#787366', '#baac92'],
  blue: ['#475053', '#6f7a7b'], blueD: ['#424c4f', '#667174'], gold: ['#6d5632', '#8c6e42'], bud: ['#6a4439', '#86584b'],
  leaf: ['#393728', '#55533c'], leafL: ['#403d2e', '#5d5c41'], petalP: ['#826f68', '#ac9086'], petalW: ['#7c7768', '#b6a88f'], mass: ['#3b3825', '#5a583f'],
};
const smooth = (a, b, x) => { const q = clamp01((x - a) / (b - a)); return q * q * (3 - 2 * q); };

const NOISE_GLSL = /* glsl */`
float gH(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float gN(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(gH(i), gH(i + vec2(1.0, 0.0)), f.x), mix(gH(i + vec2(0.0, 1.0)), gH(i + vec2(1.0, 1.0)), f.x), f.y); }
`;

lifeFor(4788, {
  title: /^Lady Sarah Bunbury/,
  word: 'wreath',
  // (the look camera stands back between the room's two glass cases, so the whole of this tall picture is in view)
  stage: { out: 1.3, half: 1.2, cam: { dist: 3.25, side: -0.75, height: 0.9, fov: 62, lookU: -0.35, lookOut: 0.4, lookH: 1.21 } },
  wake: 2, ret: 2.6,

  build(L) {
    const P = L.pal, col = (h, a = 0) => P.near(h, a), rnd = L.rand;
    const v3 = h => { const c = col(h); return new THREE.Vector3(c.r, c.g, c.b); };
    this.p = new THREE.Vector3(); this.n = new THREE.Vector3(); this.tn = new THREE.Vector3(); this.b = new THREE.Vector3(); this.w = new THREE.Vector3();
    this.right = new THREE.Vector3(); this.up = new THREE.Vector3();

    // ---------------------------------------------------------- the garland's way
    const U = new THREE.Vector3(1, 0, 0), V = new THREE.Vector3(0, Math.cos(RING.tilt), -Math.sin(RING.tilt)), C = new THREE.Vector3(RING.x, RING.y, RING.z);
    this.U = U; this.V = V; this.C = C;
    const ringAt = (phi, o) => o.copy(C).addScaledVector(U, RING.R * Math.cos(phi)).addScaledVector(V, RING.R * Math.sin(phi));
    const E = ringAt(RING.phiE, new THREE.Vector3()), TE = U.clone().multiplyScalar(-Math.sin(RING.phiE)).addScaledVector(V, Math.cos(RING.phiE));
    const helix = a => { const q = (a - AX.a0) / (AX.a1 - AX.a0); return new THREE.Vector3(AX.x - AX.r * Math.sin(a * DEG), lerp(AX.y0, AX.y1, q), AX.z - AX.r * Math.cos(a * DEG)); };
    const pts = [new THREE.Vector3(AX.x - AX.r, AX.y0 + 0.004, -(L.wall + 0.1)), new THREE.Vector3(AX.x - AX.r, AX.y0 + 0.002, AX.z * 0.4 - 0.03)];
    for (let a = AX.a0; a <= AX.a1 + 1; a += 45) pts.push(helix(a));
    {
      // from the foot of the spiral (going along the wall) round and out to the ring, coming into it along its own line
      const h = helix(AX.a1), e = E.clone().addScaledVector(TE, -0.17), c1 = h.clone().add(new THREE.Vector3(0.17, -0.004, 0.02)), c2 = e.clone().addScaledVector(TE, -0.2);
      for (const k of [0.25, 0.5, 0.75]) { const m = 1 - k; pts.push(new THREE.Vector3().addScaledVector(h, m * m * m).addScaledVector(c1, 3 * m * m * k).addScaledVector(c2, 3 * m * k * k).addScaledVector(e, k * k * k)); }
      pts.push(e, E.clone());
    }
    const iE = pts.length - 1; pts.push(E.clone().addScaledVector(TE, 0.17));
    {
      const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal'), M = 1400, raw = [], len = [0], tE = iE / (pts.length - 1);
      for (let i = 0; i <= M; i++) { raw.push(curve.getPoint(tE * i / M)); if (i) len.push(len[i - 1] + raw[i].distanceTo(raw[i - 1])); }
      const Lent = this.Lent = len[M], n = this.nEnt = Math.floor(Lent / DS) + 1, tab = this.ent = new Float32Array((n + 1) * 3), nor = this.entN = new Float32Array((n + 1) * 3);
      let j = 0; const q = new THREE.Vector3();
      for (let i = 0; i <= n; i++) { const s = Math.min(Lent, i * DS); while (j < M - 1 && len[j + 1] < s) j++; q.lerpVectors(raw[j], raw[j + 1], clamp01((s - len[j]) / Math.max(1e-6, len[j + 1] - len[j]))); tab[i * 3] = q.x; tab[i * 3 + 1] = q.y; tab[i * 3 + 2] = q.z; }
      // a frame carried back along it from the ring's own (outwards from the ring's middle), without twisting
      const N = U.clone().multiplyScalar(Math.cos(RING.phiE)).addScaledVector(V, Math.sin(RING.phiE)), T = new THREE.Vector3();
      for (let i = n; i >= 0; i--) {
        const a = Math.max(0, i - 1), b = Math.min(n, i + 1); T.set(tab[b * 3] - tab[a * 3], tab[b * 3 + 1] - tab[a * 3 + 1], tab[b * 3 + 2] - tab[a * 3 + 2]).normalize();
        N.addScaledVector(T, -N.dot(T)).normalize(); nor[i * 3] = N.x; nor[i * 3 + 1] = N.y; nor[i * 3 + 2] = N.z;
      }
      // where on it the rose lets go: the nearest point to that place on the first turn
      const hEnd = helix(AX.a1); let hd = 1e9; this.sHel = 0;
      for (let i = 0; i <= n; i++) { const d = Math.hypot(tab[i * 3] - hEnd.x, tab[i * 3 + 1] - hEnd.y, tab[i * 3 + 2] - hEnd.z); if (d < hd) { hd = d; this.sHel = i * DS; } }
      const drop = helix(ROSE.a); let bd = 1e9; this.sDrop = 0;
      for (let i = 0; i <= n && i * DS < 0.9; i++) { const d = Math.hypot(tab[i * 3] - drop.x, tab[i * 3 + 1] - drop.y, tab[i * 3 + 2] - drop.z); if (d < bd) { bd = d; this.sDrop = i * DS; } }
    }
    this.aHead = CIRC - GAP; this.Send = this.Lent + this.aHead;
    // how the first flower's journey is paced: it gets going, runs, and comes round to the last one slower and slower
    {
      const n = 200, lut = this.lut = new Float32Array(n + 1); let acc = 0;
      const vel = q => smooth(0, 0.1, q) * (0.05 + 0.95 * Math.pow(1 - smooth(0.6, 1, q), 1.2));
      for (let i = 1; i <= n; i++) { acc += (vel((i - 1) / n) + vel(i / n)) / 2; lut[i] = acc; }
      for (let i = 0; i <= n; i++) lut[i] /= acc;
      const want = (this.sDrop + ROSE.lag) / this.Send; let i = 0; while (i < n && lut[i + 1] < want) i++;
      this.qDrop = (i + (want - lut[i]) / Math.max(1e-6, lut[i + 1] - lut[i])) / n;
    }
    // the rose's fall: let go, it carries on the way it was going, lands, hops once and rolls to rest
    {
      const A = this.dropA = new THREE.Vector3(), N = new THREE.Vector3(), T = new THREE.Vector3(); this.pathAt(this.sDrop, A, N, T);
      const hl = Math.hypot(T.x, T.z) || 1, dx = T.x / hl, dz = T.z / hl, vy = 0.25;
      this.fallT = (vy + Math.sqrt(vy * vy + 2 * ROSE.g * (A.y - ROSE.h))) / ROSE.g; this.fallV = [dx * ROSE.v, vy, dz * ROSE.v];
      this.landB = new THREE.Vector3(A.x + dx * ROSE.v * this.fallT, ROSE.h, A.z + dz * ROSE.v * this.fallT);
      this.rest0 = new THREE.Vector3(this.landB.x + dx * 0.1, ROSE.h, this.landB.z + dz * 0.1);
      this.rest = new THREE.Vector3(this.rest0.x + dx * 0.05, ROSE.h, this.rest0.z + dz * 0.05);
      this.riseC = new THREE.Vector3(lerp(this.rest.x, E.x, 0.2), E.y + 0.1, lerp(this.rest.z, E.z, 0.55));
      this.E = E;
    }

    // ---------------------------------------------------------- the flowers, in the order they hang
    // Each: where it comes to rest on the ring (metres round from the rose's place), what it is, how big, how far it
    // sits from the garland's middle (outwards, and towards you), how it is turned.
    const D = this.D = [];
    const add = (a, kind, pair, sx, sy, on, ob, o = {}) => D.push({ a, kind, pair, sx, sy, on, ob, rot: rnd() * TAU, spin: (rnd() - 0.5) * 1.6, seed: 0.37 + D.length * 1.713, lit: 0.93 + 0.12 * rnd(), ...o });
    const ORDER = [K_WROSE, K_ROSE, K_BLUE, K_WROSE, K_ROSE, K_STAR, K_WROSE, K_GOLD, K_ROSE, K_WROSE, K_BLUE, K_ROSE, K_WROSE, K_STAR, K_ROSE, K_BLUE, K_WROSE, K_ROSE, K_GOLD, K_WROSE, K_ROSE, K_STAR, K_WROSE, K_BLUE, K_ROSE, K_WROSE];
    const step = (CIRC - 2 * GAP) / (NBIG - 1);
    for (let k = 0; k < NBIG; k++) {
      const a = GAP + k * step, kind = ORDER[k % ORDER.length], big = 0.88 + 0.24 * rnd(), turn = 0.8 + 0.2 * rnd();      // (some are turned a little away)
      if (kind === K_ROSE) add(a, K_ROSE, k % 3 ? 'rose' : 'roseD', 0.108 * big, 0.108 * big * turn, (rnd() - 0.5) * 0.024, -0.012);
      else if (kind === K_WROSE) add(a, K_WROSE, 'white', 0.104 * big, 0.104 * big * turn, (rnd() - 0.5) * 0.024, -0.01);
      else if (kind === K_STAR) add(a, K_STAR, 'star', 0.1 * big, 0.1 * big * turn, (rnd() - 0.5) * 0.026, -0.014);
      else if (kind === K_BLUE) add(a, K_BLUE, k % 2 ? 'blue' : 'blueD', 0.08 * big, 0.08 * big * turn, (rnd() - 0.5) * 0.03, -0.016);
      else add(a, K_GOLD, 'gold', 0.082 * big, 0.082 * big * turn, (rnd() - 0.5) * 0.026, -0.012);
      if (k === NBIG - 1) break;
      // between two of them, a small thing tucked in: a red bud, a blue one, a white blossom; and now and then a leaf
      // behind, pointing out of the garland
      const m = a + step * (0.42 + 0.16 * rnd()), side = k % 2 ? 1 : -1;
      if (k % 3 === 0) add(m, K_BUD, 'bud', 0.04, 0.05, side * (0.036 + 0.012 * rnd()), -0.02);
      else if (k % 6 === 1) add(m, K_BLUE, 'blueD', 0.048, 0.048, side * (0.04 + 0.012 * rnd()), -0.02);
      else if (k % 6 === 4) add(m, K_GOLD, 'gold', 0.044, 0.044, side * (0.04 + 0.012 * rnd()), -0.02);
      else add(m, K_STAR, 'star', 0.05, 0.05, -side * (0.036 + 0.012 * rnd()), -0.018);
      if (k % 3 === 1) { const ls = k % 2 ? -1 : 1; add(m + (rnd() - 0.5) * 0.02, K_LEAF, k % 2 ? 'leafL' : 'leaf', 0.082 + 0.02 * rnd(), 0.034 + 0.008 * rnd(), ls * (0.044 + 0.01 * rnd()), 0.016, { leaf: ls, rot: (rnd() - 0.5) * 0.9 }); }
    }
    // the dark of it: leaves in shadow all along, behind the flowers, as his garland has his dark ground between its blooms
    for (let k = 0; k < NMASS; k++) add(GAP + 0.01 + k * (CIRC - 2 * GAP - 0.02) / (NMASS - 1), K_MASS, 'mass', 0.104 + 0.02 * rnd(), 0.07 + 0.014 * rnd(), (rnd() - 0.5) * 0.016, 0.024, { along: 1, rot: (rnd() - 0.5) * 0.5, lit: 1 });
    const NCH = this.NCH = D.length;
    for (const d of D) d.lag = this.aHead - d.a;
    // the rose that falls, and the petals that let go
    D.push({ kind: K_ROSE, pair: 'rose', sx: ROSE.size, sy: ROSE.size, rot: 0.6, seed: 9.31, lit: 1.04 });
    for (let j = 0; j < NPETAL; j++) D.push({ kind: K_PETAL, pair: j % 3 === 1 ? 'petalW' : 'petalP', sx: 0.046, sy: 0.034, rot: rnd() * TAU, seed: 3.3 + j * 2.9, lit: 1.02, phi: (25 + 115 * ((j * 0.618 + 0.2) % 1)) * DEG, dx: (rnd() - 0.5) * 0.14, dz: 0.07 + 0.1 * rnd() });
    const N = this.N = D.length;

    // ---------------------------------------------------------- one mesh of marks
    const plane = new THREE.PlaneGeometry(1, 1), geo = new THREE.InstancedBufferGeometry();
    geo.index = plane.index; geo.setAttribute('position', plane.attributes.position); geo.instanceCount = N;
    const dyn = k => { const a = new THREE.InstancedBufferAttribute(new Float32Array(N * k), k); a.setUsage(THREE.DynamicDrawUsage); return a; };
    this.aPos = dyn(3); this.aTf = dyn(4); this.aFx = dyn(2);
    const aKind = new THREE.InstancedBufferAttribute(new Float32Array(N * 2), 2), aCol = new THREE.InstancedBufferAttribute(new Float32Array(N * 3), 3), aCol2 = new THREE.InstancedBufferAttribute(new Float32Array(N * 3), 3);
    const pairs = {}; for (const k of Object.keys(PAINT)) pairs[k] = PAINT[k].map(h => col(h));
    D.forEach((d, i) => { const [c, c2] = pairs[d.pair]; aKind.setXY(i, d.kind, d.seed); aCol.setXYZ(i, c.r, c.g, c.b); aCol2.setXYZ(i, c2.r, c2.g, c2.b); });
    for (const [k, a] of [['aPos', this.aPos], ['aTf', this.aTf], ['aFx', this.aFx], ['aKind', aKind], ['aCol', aCol], ['aCol2', aCol2]]) geo.setAttribute(k, a);
    // his light: from high on the left, and a little from the front
    const light = this.light = new THREE.Vector3(L.tx * -0.56 + L.nx * 0.42, 0.72, L.tz * -0.56 + L.nz * 0.42).normalize();
    // (soft at the edge without sorting: each mark's edge is given to the multisampling as coverage)
    const dm = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, fog: false, alphaToCoverage: true });
    dm.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, { uLightW: { value: light }, uGround: { value: v3('#392e20') }, uHeartP: { value: v3('#6a4d44') }, uHeartW: { value: v3('#7f6e60') }, uHeartS: { value: v3('#78673f') }, uEye: { value: v3('#373f40') } });
      sh.vertexShader = sh.vertexShader.replace('#include <common>', `#include <common>
attribute vec3 aPos, aCol, aCol2; attribute vec4 aTf; attribute vec2 aKind, aFx; uniform vec3 uLightW;
varying vec2 vQ, vK, vFx, vLt; varying vec3 vCol, vCol2;`)
        .replace('#include <project_vertex>', `vec4 mvPosition;
  { float c = cos(aTf.x), s = sin(aTf.x); vec3 Xv, Yv;
    if (aTf.w < 0.5) {                                                 // facing you, turned in its own plane
      vec2 p = position.xy * aTf.yz; p = vec2(p.x * c - p.y * s, p.x * s + p.y * c);
      mvPosition = viewMatrix * vec4(aPos, 1.0); mvPosition.xy += p; Xv = vec3(c, s, 0.0); Yv = vec3(-s, c, 0.0);
    } else {                                                           // lying on the floor
      vec3 wx = vec3(c, 0.0, s), wy = vec3(-s, 0.0, c);
      mvPosition = viewMatrix * vec4(aPos + wx * position.x * aTf.y + wy * position.y * aTf.z, 1.0); Xv = mat3(viewMatrix) * wx; Yv = mat3(viewMatrix) * wy;
    }
    vec3 Lv = mat3(viewMatrix) * uLightW; vLt = vec2(dot(Lv, Xv), dot(Lv, Yv)); }
  gl_Position = projectionMatrix * mvPosition;
  vQ = position.xy * 2.0; vK = aKind; vFx = aFx; vCol = aCol; vCol2 = aCol2;`);
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
varying vec2 vQ, vK, vFx, vLt; varying vec3 vCol, vCol2; uniform vec3 uGround, uHeartP, uHeartW, uHeartS, uEye;
${NOISE_GLSL}`)
        .replace('#include <color_fragment>', `#include <color_fragment>
  {
    // Every mark is one flower (or a leaf, a bud, a petal): its shape (d < 0 inside) and how far towards the light
    // each part of it is (tone). The shade is laid first and the light loaded on it in curled touches.
    vec2 q = vQ; int T = int(vK.x + 0.5); float sd = vK.y, d = 1.0, tone = 0.0, heart = 0.0; vec3 hc = uGround;
    float n1 = gN(q * 2.4 + sd * 7.0), n2 = gN(q * 6.0 + sd * 3.0), br = gN(vec2(q.x * 1.1 + sd * 3.0, q.y * 9.0 + sd)), lt = dot(q, vLt), r = length(q), an = atan(q.y, q.x) + sd * 6.0;
    if (T < 2) {
      // a rose: five curled touches round four round three, each lit along its outer lip, the later lying on the earlier
      float dmn = 9.0, tn = -0.3;
      for (int i = 0; i < 12; i++) {
        float fi = float(i), ring = i < 5 ? 0.0 : (i < 9 ? 1.0 : 2.0), n = 5.0 - ring, k = fi - (i < 5 ? 0.0 : (i < 9 ? 5.0 : 9.0));
        float h1 = gH(vec2(fi, sd)), h2 = gH(vec2(fi + 7.0, sd * 1.3));
        float a = (k + 0.5 * ring) / n * 6.2832 + sd * 6.0 + 0.5 * (h1 - 0.5);
        float rad = ring < 0.5 ? 0.54 : (ring < 1.5 ? 0.3 : 0.12), pr = (ring < 0.5 ? 0.41 : (ring < 1.5 ? 0.3 : 0.19)) * (0.9 + 0.25 * h2);
        vec2 dir = vec2(cos(a), sin(a)), e = (q - dir * rad) / pr; float le = length(e), di = (le - 1.0) * pr;
        if (di < 0.0) {
          float lip = smoothstep(0.42, 0.95, le), outw = 0.5 + 0.5 * dot(e / max(le, 1.0e-3), dir);
          tn = -0.3 + 0.8 * lip * outw + 0.36 * dot(e, vLt) - 0.05 * ring;
        }
        dmn = min(dmn, di);
      }
      d = dmn + 0.1 * (n1 - 0.5); tone = tn + 0.5 * (br - 0.5) + 0.3 * lt;
      heart = 0.75 * (1.0 - smoothstep(0.0, 0.3, r)); hc = T == 0 ? uHeartP : uHeartW;
    } else if (T == 2) {
      // a white star: six pointed petals, creased, a yellow heart
      float t6 = an * 6.0 / 6.2832, pa = abs(fract(t6) - 0.5) * 2.0;
      float R = 0.96 * (1.0 - 0.74 * pow(1.0 - pa, 1.15)) * (0.86 + 0.2 * gH(vec2(floor(t6 + 0.5), sd)));
      d = r - R + 0.05 * (n1 - 0.5);
      tone = -0.4 + 0.75 * pa + 0.5 * lt + 0.4 * (br - 0.5) - 0.3 * (1.0 - smoothstep(0.1, 0.42, r));
      heart = 0.85 * (1.0 - smoothstep(0.05, 0.22, r)); hc = uHeartS;
    } else if (T == 3) {
      // a blue flower: five round petals, paler towards their edges, a dark eye
      float t5 = an * 5.0 / 6.2832, pa = abs(fract(t5) - 0.5) * 2.0;
      float R = 0.93 * (0.5 + 0.5 * sqrt(max(1.0 - (1.0 - pa) * (1.0 - pa), 0.0)));
      d = r - R + 0.06 * (n1 - 0.5);
      tone = -0.3 + 0.8 * smoothstep(0.25, 0.9, r / R) * (0.5 + 0.5 * pa) + 0.5 * lt + 0.4 * (br - 0.5);
      heart = 0.8 * (1.0 - smoothstep(0.06, 0.26, r)); hc = uEye;
    } else if (T == 4) {
      // an orange one: a crowd of small touches
      d = r - (0.86 + 0.1 * sin(an * 11.0)) + 0.14 * (n1 - 0.5);
      tone = 1.2 * (gN(q * 4.6 + sd * 5.0) - 0.5) + 0.45 * lt + 0.04 - 0.4 * (1.0 - smoothstep(0.0, 0.32, r));
    } else if (T == 5) {
      // a bud: one loaded touch
      d = length(q / vec2(0.62, 0.92)) - 1.0 + 0.1 * (n1 - 0.5);
      tone = 0.6 * lt + 0.3 * q.y + 0.4 * (br - 0.5) + 0.04;
    } else if (T == 6) {
      // a leaf from its stalk (x = -1) to its point: dark, one stroke of light along the side turned to it
      float x = q.x * 0.5 + 0.5, w = 0.9 * pow(max(sin(3.14159 * pow(x, 0.8)), 0.0), 0.7), y = q.y - 0.14 * sin(q.x * 1.6 + sd * 4.0);
      d = abs(y) - w + 0.08 * (n1 - 0.5);
      float sl = y * sign(vLt.y + 1.0e-3) / max(w, 0.25);
      tone = -0.4 + 1.0 * smoothstep(0.0, 0.3, sl) * (1.0 - smoothstep(0.6, 0.98, sl)) + 0.5 * (br - 0.5) + 0.2 * lt;
    } else if (T == 7) {
      // a petal
      d = length(q / vec2(0.95, 0.7)) - 1.0 + 0.12 * (n1 - 0.5) + 0.25 * q.x * q.y;
      tone = 0.6 * lt + 0.5 * (br - 0.5) + 0.2;
    } else {
      // the dark of the garland: a spray of five leaves in shadow, each with a little light along one side
      float dmn = 9.0, tn = -0.6;
      for (int i = 0; i < 5; i++) {
        float fi = float(i), a = fi * 1.2566 + sd * 5.0 + 0.7 * (gH(vec2(fi, sd)) - 0.5), len = 0.62 + 0.3 * gH(vec2(fi + 3.0, sd));
        vec2 dv = vec2(cos(a), sin(a)), pq = vec2(dot(q, dv), dot(q, vec2(-dv.y, dv.x)));
        float x = pq.x / len, w = 0.36 * pow(max(sin(3.14159 * pow(clamp(x, 0.0, 1.0), 0.75)), 0.0), 0.8), di = x < 0.0 || x > 1.0 ? 1.0 : abs(pq.y) - w;
        if (di < dmn) { dmn = di; float sl = pq.y * sign(dot(vLt, vec2(-dv.y, dv.x)) + 1.0e-3) / max(w, 0.1); tn = -0.5 + 0.8 * smoothstep(0.1, 0.5, sl) * (1.0 - smoothstep(0.7, 1.0, sl)) + 0.25 * dot(dv, vLt); }
      }
      d = dmn + 0.06 * (n1 - 0.5); tone = tn + 0.45 * (br - 0.5);
    }
    float load = smoothstep(-0.34, 0.4, tone);
    vec3 c = mix(vCol * (0.84 + 0.2 * smoothstep(-0.7, -0.2, tone)), vCol2, load);
    c += vCol2 * 0.16 * smoothstep(0.42, 0.8, tone);                     // (the loaded touches, where the paint stands up)
    c = mix(c, hc * (0.8 + 0.4 * n2), heart);
    c *= 0.9 + 0.2 * br;
    c = mix(c, uGround, 0.34 * smoothstep(-0.42, 0.0, d));               // (it is lost into his brown ground at its edge)
    c *= vFx.x;
    d += 0.1 * (n2 - 0.5) + vFx.y * (0.25 + 1.5 * n1);                   // (a dragged edge; and, going, it breaks up)
    float fw = max(fwidth(d) * 1.2, 0.05), al = 1.0 - smoothstep(-fw, fw, d);
    if (al < 0.06) discard;
    diffuseColor.rgb = c; diffuseColor.a = al;
  }`);
    };
    dm.customProgramCacheKey = () => 'reynolds-garland';
    this.dabs = L.add(new THREE.Mesh(geo, dm)); this.dabs.name = 'flowers';

    // ---------------------------------------------------------- the smoke: soft touches all along the garland's way
    // (each a round scumble that faces you, a few centimetres from the next, so that together they are one thin veil
    // with no edge to it; it lightens what is behind it more than it covers it)
    {
      const total = this.Lent + CIRC, n = Math.ceil(total / 0.04), cen = new Float32Array(n * 3), ss = new Float32Array(n * 2), p = this.p, nn = this.n, t = this.tn, w = this.w;
      for (let i = 0; i < n; i++) { const s = total * (i + 0.5) / n; this.pathAt(s, p, nn, t); this.world(L, p, w); cen[i * 3] = w.x; cen[i * 3 + 1] = w.y; cen[i * 3 + 2] = w.z; ss[i * 2] = s; ss[i * 2 + 1] = rnd(); }
      const plane = new THREE.PlaneGeometry(1, 1), g = new THREE.InstancedBufferGeometry();
      g.index = plane.index; g.setAttribute('position', plane.attributes.position); g.instanceCount = n; this.NS = n;
      g.setAttribute('aC', new THREE.InstancedBufferAttribute(cen, 3)); g.setAttribute('aSS', new THREE.InstancedBufferAttribute(ss, 2));
      const u = this.su = { uT: { value: 0 }, uSm: { value: new THREE.Vector4(0, 1, 0, 0) }, uLent: { value: this.Lent }, uHel: { value: this.sHel }, uToy: { value: new THREE.Vector3(0, 0, 0) }, uLo: { value: v3('#a79b86') }, uHi: { value: v3('#cdbfa6') }, uPink: { value: v3('#ac8b81') } };
      const sm = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor });
      sm.onBeforeCompile = sh => {
        Object.assign(sh.uniforms, u);
        sh.vertexShader = sh.vertexShader.replace('#include <common>', `#include <common>
attribute vec3 aC; attribute vec2 aSS; uniform float uT, uLent, uHel; uniform vec4 uSm; varying vec2 vQ, vSS; varying vec3 vSW;`)
          .replace('#include <project_vertex>', `vec4 mvPosition;
  { float s = aSS.x; vec3 c = aC;
    // it wavers, more the further it is from where it comes out; and rides with the ring
    c += smoothstep(0.0, 0.4, s) * 0.022 * vec3(sin(s * 5.1 + uT * 0.55), sin(s * 4.3 - uT * 0.47 + 1.3), cos(s * 4.7 + uT * 0.4));
    c.y += uSm.w * smoothstep(uLent - 0.5, uLent, s);
    float rad = mix(0.088, 0.135, smoothstep(uHel - 0.15, uHel + 0.5, s)) * (0.85 + 0.3 * aSS.y);
    vSW = c; mvPosition = viewMatrix * vec4(c, 1.0); mvPosition.xy += position.xy * 2.0 * rad; }
  gl_Position = projectionMatrix * mvPosition; vSS = aSS; vQ = position.xy * 2.0;`);
        sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
varying vec2 vQ, vSS; varying vec3 vSW; uniform float uT, uLent; uniform vec4 uSm; uniform vec3 uLo, uHi, uPink, uToy;
${NOISE_GLSL}
vec3 smC; float smA;`)
          .replace('#include <map_fragment>', `#include <map_fragment>
  {
    // thin, scumbled: wisps drifting up the way, towards the picture
    float s = vSS.x, r2 = dot(vQ, vQ), body = max(1.0 - r2, 0.0); body *= body;
    vec2 nq = vQ * 0.8 + vec2(s * 2.4 + uT * 0.3, s * 1.7 + vSS.y * 2.0 - uT * 0.11);
    float n = gN(nq + 1.4 * gN(nq * 0.5 + 7.0)), n2 = gN(nq * 2.3 + 3.0 + n * 1.6);
    float a = body * (0.16 + 0.84 * smoothstep(0.25, 0.8, 0.6 * n + 0.4 * n2));
    a *= smoothstep(0.03, 0.2, s) * (1.0 - smoothstep(uSm.x - 0.8, uSm.x, s));          // from the wall to its head, which thins away
    a *= mix(1.0, uSm.y, smoothstep(uLent - 0.12, uLent + 0.12, s));                    // (round the ring, less of it once the flowers are there)
    a *= uSm.z * (uToy.z > 0.5 ? smoothstep(0.3, 0.75, distance(vSW.xz, uToy.xy)) : 1.0);
    smC = mix(mix(uLo, uHi, n2), uPink, 0.5 * exp(-s * 2.2)) * a * 0.17; smA = a * 0.078;
  }`)
          .replace('#include <opaque_fragment>', '  outgoingLight = smC; diffuseColor.a = smA;\n#include <opaque_fragment>');
      };
      sm.customProgramCacheKey = () => 'reynolds-smoke';
      this.smoke = L.add(new THREE.Mesh(g, sm)); this.smoke.name = 'smoke'; this.smoke.renderOrder = 7;
    }

    // ---------------------------------------------------------- his shade, the flame's light, and the shadows
    {
      const u = this.gu = {
        uO: { value: L.floor(0, 0) }, uAx: { value: new THREE.Vector4(L.tx, L.tz, L.nx, L.nz) },
        uDk: { value: 0 }, uFire: { value: new THREE.Vector2(0, 0) },
        uRing: { value: new THREE.Vector4(RING.x, RING.z, RING.R, 0) }, uRingS: { value: Math.sin(RING.tilt) },
        uRose: { value: new THREE.Vector4(0, 0, 0, 0) }, uFlame: { value: new THREE.Vector2(AX.x + 0.02, 0.3) },
        uDuskC: { value: v3('#2a1d10') }, uShadeC: { value: v3('#120b06') }, uFireC: { value: v3('#e6b596') }, uPaleC: { value: v3('#e6cfc0') },
      };
      const fm = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor });
      fm.onBeforeCompile = sh => {
        Object.assign(sh.uniforms, u);
        sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
uniform vec3 uO, uDuskC, uShadeC, uFireC, uPaleC; uniform vec4 uAx, uRing, uRose; uniform vec2 uFire, uFlame; uniform float uDk, uRingS;
${NOISE_GLSL}
vec3 shC; float shA;`)
          .replace('#include <map_fragment>', `#include <map_fragment>
  {
    vec2 lq = lifeP.xz - uO.xz, q = vec2(dot(lq, uAx.xy), dot(lq, uAx.zw));
    float nz = gN(q * 1.7) - 0.5, n2 = gN(vec2(q.x * 15.0, q.y * 8.0));
    // his shade: out from under the picture over the floor, soft, broken at its edge
    float rr = length((vec2(q.x, max(q.y, 0.0)) - vec2(-0.05, 0.2)) / vec2(1.4, 1.15));
    float foot = 1.0 - smoothstep(0.22, 1.0, rr + 0.2 * nz);
    float A = 1.0 - exp(-1.5 * foot * uDk); vec3 C = uDuskC * (0.85 + 0.35 * n2), add = vec3(0.0);
    // the wreath's shadow under it, and the rose's
    float ann = abs(length((q - uRing.xy) / vec2(1.0, uRingS)) - uRing.z), shd = (1.0 - smoothstep(0.02, 0.13, ann + 0.02 * nz)) * uRing.w;
    float rs = (1.0 - smoothstep(0.02, 0.09, length(q - uRose.xy))) * uRose.z, dk = max(0.55 * shd, 0.6 * rs);
    C = mix(C, uShadeC, dk); A = A + (1.0 - A) * dk;
    // the flame's light, falling from the picture's foot on the left; and, when the ring is whole, the light under it
    vec2 f1 = (q - uFlame) / vec2(0.42, 0.5), f2 = (q - uRing.xy - vec2(0.0, 0.05)) / vec2(0.6, 0.46), f3 = (q - uRose.xy) / 0.15;
    float g1 = exp(-dot(f1, f1) * 1.5);
    add = uFireC * (g1 * (0.3 + 0.5 * g1) * uFire.x * 0.5 + exp(-dot(f2, f2) * 1.4) * uFire.y * 0.34) * (1.0 - 0.7 * dk) * (0.92 + 0.16 * n2)
      + uPaleC * exp(-dot(f3, f3)) * uRose.w * 0.16;
    shC = C * A + add; shA = A;
  }`)
          .replace('#include <opaque_fragment>', '  outgoingLight = shC; diffuseColor.a = shA;\n#include <opaque_fragment>');
      };
      fm.customProgramCacheKey = () => 'reynolds-shade';
      const pos = [], Pw = (x, y, z) => this.world(L, this.p.set(x, y, z), new THREE.Vector3());
      const quad = (a, b, c, d) => { for (const v of [a, b, c, a, c, d]) pos.push(v.x, v.y, v.z); };
      const HALF = 2.0, OUTM = 2.1, back = -L.wall + 0.004;
      quad(Pw(-HALF, 0.012, OUTM), Pw(HALF, 0.012, OUTM), Pw(HALF, 0.012, back), Pw(-HALF, 0.012, back));
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals();
      this.ground = L.add(new THREE.Mesh(g, fm)); this.ground.name = 'shade'; this.ground.renderOrder = 5;
    }

    // ---------------------------------------------------------- Handel, on the show's clock
    // "Where'er you walk" (Semele, 1744), in B flat: the opening bar the strings play alone, then the first sentence
    // of the voice with the strings' answers and the bass, to its cadence in F. Beats from the top: [beat, note, beats].
    const sc = this.score = score(L), T0 = T_CLOSE - 6 * BEAT, at = b => T0 + b * BEAT;
    const STR = [[0, 'Bb4', 1], [1, 'C5', 0.75], [1.75, 'D5', 0.125], [1.875, 'Eb5', 0.125], [2, 'D5', 0.25], [2.25, 'Bb4', 0.25], [2.5, 'Bb4', 0.25], [2.75, 'D5', 0.25], [3, 'D5', 0.25], [3.25, 'F5', 0.25], [3.5, 'F5', 0.5],
      [6, 'Bb4', 0.25], [6.25, 'D5', 0.25], [6.5, 'D5', 0.25], [6.75, 'F5', 0.25], [7, 'F5', 0.25], [7.25, 'Bb5', 0.25], [7.5, 'Bb5', 0.5],
      [10, 'A4', 0.25], [10.25, 'C5', 0.25], [10.5, 'C5', 0.25], [10.75, 'F5', 0.25], [11, 'F5', 0.25], [11.25, 'A5', 0.25], [11.5, 'A5', 0.5]];
    const VOX = [[4, 'Bb4', 1], [5, 'C5', 0.75], [5.75, 'D5', 0.125], [5.875, 'Eb5', 0.125], [6, 'D5', 1],
      [7.5, 'F5', 0.5], [8, 'Eb5', 0.5], [8.5, 'D5', 0.5], [9, 'C5', 0.5], [9.5, 'Bb4', 0.5], [10, 'A4', 1],
      [12, 'C5', 1], [13, 'D5', 0.5], [13.5, 'C5', 0.25], [13.75, 'Bb4', 0.25], [14, 'C5', 1],
      [15.5, 'F5', 0.5], [16, 'D5', 0.5], [16.5, 'C5', 0.5], [17, 'Bb4', 0.5], [17.5, 'A4', 0.5], [18, 'G4', 1],
      [20, 'Bb4', 1], [21, 'Bb4', 0.5], [21.5, 'A4', 0.25], [21.75, 'G4', 0.25], [22, 'A4', 0.5], [22.5, 'D5', 0.5], [23, 'C5', 0.5], [23.5, 'F5', 0.5], [24, 'A4', 1], [25, 'G4', 0.75], [25.75, 'F4', 0.25], [26, 'F4', 2]];
    const BASS = ['Bb3', 'D3', 'Eb3', 'F3', 'Bb2', 0, 0, 0, 'Bb3', 'G3', 'Eb3', 'F3', 'Bb2', 'Bb2', 'Bb2', 'D3', 'G3', 'F3', 'Eb3', 'G3', 'F3', 'F3', 'F3', 'F3',
      'F3', 'F3', 'F3', 'F3', 'F3', 'G3', 'A3', 'F3', 'Bb2', 'Bb2', 'Bb2', 'Bb2', 'C3', 'C3', 'C3', 'C3', 'G2', 'G2', 'E3', 'E3', 'F3', 'Bb2', 'A2', 'D3', 'C3', 'C3', 'C3', 'C3', 'F3', 0, 0, 0];
    for (const [b, n, d] of STR) sc.note(at(b), hz(n), Math.max(0.3, d * BEAT * 1.7), { vol: b < 4 ? 0.02 : 0.011, type: 'triangle', attack: b === 0 ? 0.12 : 0.03 });
    for (const [b, n, d] of VOX) sc.note(at(b), hz(n), Math.max(0.34, d * BEAT * 1.9), { vol: 0.03, type: 'sine', attack: d < 0.2 ? 0.02 : 0.06, over: 2, overVol: 0.16 });
    BASS.forEach((n, i) => { if (n) sc.note(at(i * 0.5), hz(n), BEAT * 0.9, { vol: 0.016, type: 'triangle', attack: 0.04 }); });
    sc.done();
    this.rustle = L.voice().loop({ lp: 2600, hp: 700 });
    this.hide();
  },

  // A point of the garland's way, s metres along it (the way in, then round the ring), in the scene's metres; with the
  // way it is heading there and "outwards" (from the ring's middle, carried back along the way in).
  pathAt(s, p, n, t) {
    const Le = this.Lent;
    if (s >= Le) {
      const phi = RING.phiE + (s - Le) / RING.R, c = Math.cos(phi), sn = Math.sin(phi), U = this.U, V = this.V, C = this.C;
      n.set(U.x * c + V.x * sn, U.y * c + V.y * sn, U.z * c + V.z * sn); t.set(-U.x * sn + V.x * c, -U.y * sn + V.y * c, -U.z * sn + V.z * c);
      p.set(C.x + n.x * RING.R, C.y + n.y * RING.R, C.z + n.z * RING.R); return p;
    }
    const f = Math.max(0, s) / DS, i = Math.min(this.nEnt - 1, Math.floor(f)), k = Math.min(1, f - i), a = this.ent, b = this.entN, j = i * 3;
    p.set(a[j] + (a[j + 3] - a[j]) * k, a[j + 1] + (a[j + 4] - a[j + 1]) * k, a[j + 2] + (a[j + 5] - a[j + 2]) * k);
    t.set(a[j + 3] - a[j], a[j + 4] - a[j + 1], a[j + 5] - a[j + 2]).normalize();
    n.set(b[j] + (b[j + 3] - b[j]) * k, b[j + 1] + (b[j + 4] - b[j + 1]) * k, b[j + 2] + (b[j + 5] - b[j + 2]) * k).normalize();
    return p;
  },
  // The scene's metres into the world.
  world(L, p, o) { return o.set(L.cx + L.tx * p.x + L.nx * p.z, L.y + p.y, L.cz + L.tz * p.x + L.nz * p.z); },
  prof(q) { const n = this.lut.length - 1, f = clamp01(q) * n, i = Math.min(n - 1, Math.floor(f)); return this.lut[i] + (this.lut[i + 1] - this.lut[i]) * (f - i); },

  hide() { this.aTf.array.fill(0); this.aTf.needsUpdate = true; if (this.rustle) this.rustle.set(0); },
  start(L) { const K = L.calm ? 1.6 : 1; this.T = L.t; this.score.from(L.t - T_CLOSE * (K - 1)); this.thud = false; this.lastS = null; },
  back(L) { this.bT = this.T || 0; },
  end(L) { this.hide(); },
  reset(L) { this.hide(); this.T = 0; },
  // Going back: how far a thing has gone between these two moments of the Return (0 while the show is on).
  gone(a, b) { return this.R < 0 ? 0 : ease.inOut(ramp(this.R, a, b)); },

  update(L, dt) {
    const back = L.phase === 'return', T = back ? this.bT : (this.T = L.t), calm = L.calm, K = calm ? 1.6 : 1, voice = L.voice();
    this.R = back ? L.ret : -1;
    const tOut = T_OUT * K, tRound = T_ROUND * K, tClose = T_CLOSE * K, tc = T - tClose, closed = tc >= 0;
    if (!back) this.score.play(T - T_CLOSE * (K - 1));
    const p = this.p, n = this.n, t = this.tn, b = this.b, w = this.w, D = this.D, AP = this.aPos.array, AT = this.aTf.array, AF = this.aFx.array, Le = this.Lent;
    const cam = L.k.G.camera; this.right.setFromMatrixColumn(cam.matrixWorld, 0); this.up.setFromMatrixColumn(cam.matrixWorld, 1);
    // the toy: whatever is near it draws aside
    const G = L.k.G, veh = G.vehicle, toy = G.state === 'play' && veh && veh.group && veh.group.visible && Math.abs(veh.pos.y - L.y) < 0.5;
    const tx = toy ? veh.pos.x : 0, tz = toy ? veh.pos.z : 0, clear = (x, z) => (toy ? smooth(0.32, 0.72, Math.hypot(x - tx, z - tz)) : 1);

    // ---- how far the first flower has come; once the ring is whole it turns a little one way and back
    const home = this.gone(0, 0.86), Sraw = this.Send * this.prof(ramp(T, tOut, tRound));
    const sway = closed ? 0.1 * Math.sin(tc * (calm ? 0.21 : 0.42)) : 0, S = (Sraw + sway) * (1 - home);
    const speed = this.lastS == null || dt <= 0 ? 0 : Math.abs(S - this.lastS) / dt; this.lastS = S;
    // the ring takes the rose's weight: it dips and steadies; then it only rides a little
    const dy = closed ? -(calm ? 0.016 : 0.05) * Math.exp(-2.6 * tc / K) * Math.sin(5.4 * tc / K) + 0.007 * Math.sin(0.8 * tc / K) * ramp(tc, 0.8, 2.6) : 0;
    const front = closed && tc < 1.6 * K ? tc * (CIRC / 2) / (0.95 * K) : -9;           // (the swell that goes round from the rose)
    const fire = ease.smooth(ramp(T, 0.2 * K, 1.8 * K)) * (1 - this.gone(0.45, 1)) * (calm ? 1 : 0.93 + 0.045 * Math.sin(T * 2.3) + 0.025 * Math.sin(T * 3.7 + 1));
    const whole = closed ? ease.smooth(ramp(tc, 0, calm ? 1.8 : 0.9)) : 0;
    const litK = 0.84 + 0.1 * fire + 0.12 * whole;

    for (let i = 0; i < this.NCH; i++) {
      const d = D[i], j3 = i * 3, j4 = i * 4, s = S - d.lag;
      if (s <= 0.015) { AT[j4 + 1] = AT[j4 + 2] = 0; continue; }
      this.pathAt(s, p, n, t); b.crossVectors(t, n);
      const ring = smooth(Le - 0.5, Le, s), a = s - Le, da = Math.min(Math.abs(a), Math.abs(CIRC - a));
      const bump = front > -1 && a > -0.05 ? Math.exp(-Math.pow((da - front) / 0.15, 2)) * (1 - ramp(tc, 1.1 * K, 1.6 * K)) : 0;
      p.addScaledVector(n, d.on * (1 + 0.5 * bump)).addScaledVector(b, d.ob);
      p.y += dy * ring + 0.004 * Math.sin(T * 1.1 + d.seed);
      this.world(L, p, w);
      const sc = smooth(0.015, 0.16, s) * (1 + (calm ? 0.16 : 0.3) * bump) * clear(w.x, w.z);
      AP[j3] = w.x; AP[j3 + 1] = w.y; AP[j3 + 2] = w.z;
      if (d.leaf || d.along) {
        // a leaf points out of the garland, and the dark of it lies along it: that line, as you see it
        const sg = d.leaf || 1, o = d.leaf ? n : t, nx = (L.tx * o.x + L.nx * o.z) * sg, ny = o.y * sg, nz = (L.tz * o.x + L.nz * o.z) * sg;
        AT[j4] = Math.atan2(nx * this.up.x + ny * this.up.y + nz * this.up.z, nx * this.right.x + ny * this.right.y + nz * this.right.z) + d.rot;
      } else AT[j4] = d.rot + d.spin * s;
      AT[j4 + 1] = d.sx * sc; AT[j4 + 2] = d.sy * sc; AT[j4 + 3] = 0;
      const lit = (L.tx * n.x + L.nx * n.z) * this.light.x + n.y * this.light.y + (L.tz * n.x + L.nz * n.z) * this.light.z;
      AF[i * 2] = d.lit * litK * (1 + 0.16 * bump) * (0.96 + 0.1 * lit); AF[i * 2 + 1] = 0;
    }

    // ---- the rose: with the garland; let go on the first turn; on the floor; up into the gap; and home first
    const gu = this.gu;
    {
      const i = this.NCH, d = D[i], j3 = i * 3, j4 = i * 4, tDrop = tOut + this.qDrop * (tRound - tOut), tf = T - tDrop;
      const tStir = tClose - 1.25 * K, tRise = tClose - 0.78 * K;
      let rot = d.rot, size = 1, onFloor = 0, glint = 0;
      if (tf < 0) { const s = Sraw - ROSE.lag; this.pathAt(s, p, n, t); p.addScaledVector(n, 0.03); size = smooth(0.015, 0.16, s); rot += 1.2 * s; }
      else if (tf < this.fallT) { const v = this.fallV; this.pathAt(this.sDrop, p, n, t); p.addScaledVector(n, 0.03 * (1 - ramp(tf, 0, 0.1))); p.x += v[0] * tf; p.z += v[2] * tf; p.y += v[1] * tf - 0.5 * ROSE.g * tf * tf; p.y = Math.max(p.y, ROSE.h); rot += 1.2 * this.sDrop + 3.4 * tf; onFloor = ramp(p.y, 0.3, ROSE.h); }
      else if (T < tStir) {
        const tb = tf - this.fallT, hop = ramp(tb, 0, 0.26), roll = ease.out(ramp(tb, 0.26, 0.85));
        p.lerpVectors(this.landB, this.rest0, hop).lerp(this.rest, roll); p.y = ROSE.h + 0.032 * 4 * hop * (1 - hop);
        rot += 1.2 * this.sDrop + 3.4 * this.fallT + 1.5 * hop + 0.9 * roll; onFloor = 1;
      } else if (!closed) {
        // the light finds it; it stirs, lifts a little, and then goes up into the gap, turning
        const stir = ease.smooth(ramp(T, tStir, tRise)), up = ease.inOut(ramp(T, tRise, tClose)), m = 1 - up, r0 = this.rest, c = this.riseC, e = this.E;
        p.set(m * m * r0.x + 2 * m * up * c.x + up * up * e.x, m * m * (r0.y + 0.035 * stir) + 2 * m * up * c.y + up * up * e.y, m * m * r0.z + 2 * m * up * c.z + up * up * e.z);
        rot += 1.2 * this.sDrop + 3.4 * this.fallT + 2.4 + (calm ? 0.12 : 0.22) * Math.sin((T - tStir) * 5 / K) * stir * m + (calm ? 1.6 : 3.1) * up;
        onFloor = 1 - ramp(p.y, 0.06, 0.2); glint = stir * (1 - up);
      } else {
        this.pathAt(Le + sway, p, n, t); p.y += dy; rot += 1.2 * this.sDrop + 3.4 * this.fallT + 2.4 + (calm ? 1.6 : 3.1) + 0.9 * sway;
        size = 1 + (calm ? 0.16 : 0.3) * Math.exp(-Math.pow(front / 0.15, 2)) * (1 - ramp(tc, 1.1 * K, 1.6 * K));
      }
      if (back) {
        // going home: from wherever it is, it joins the garland's end and is the first in
        const s = S - this.aHead; this.pathAt(Math.max(0, s), n, t, b); if (closed) { p.copy(n); p.y += dy * smooth(Le - 0.5, Le, s); } else p.lerp(n, this.gone(0, 0.3));
        size *= s > 0.16 || !closed ? 1 - (closed ? 0 : this.gone(0.2, 0.45)) : smooth(0.015, 0.16, s); onFloor *= 1 - this.gone(0, 0.2); glint = 0;
      }
      this.world(L, p, w); size *= clear(w.x, w.z);
      AP[j3] = w.x; AP[j3 + 1] = w.y; AP[j3 + 2] = w.z; AT[j4] = rot; AT[j4 + 1] = d.sx * size; AT[j4 + 2] = d.sy * size; AT[j4 + 3] = 0;
      AF[i * 2] = d.lit * (litK + 0.1 * glint); AF[i * 2 + 1] = 0;
      gu.uRose.value.set(p.x, p.z, onFloor * (size > 0.2 ? 1 : 0), glint * (1 - home));
      // (it lands: a soft pat on the boards)
      if (!back && !L.quiet && !this.thud && tf >= this.fallT && tf < this.fallT + 0.25 && voice.ctx) { this.thud = true; noise(voice, 0, { d: 0.09, vol: calm ? 0.012 : 0.022, lp: 520, hp: 90, attack: 0.004 }); voice.note(92, 0.14, { vol: calm ? 0.008 : 0.014, type: 'sine', to: 60, attack: 0.008 }); }
    }

    // ---- petals let go when the ring closes, and one now and then; they rock down and lie on the floor
    for (let j = 0; j < NPETAL; j++) {
      const i = this.NCH + 1 + j, d = D[i], j3 = i * 3, j4 = i * 4, age = tc - PETAL_AT[j] * K, fall = calm ? 2.3 : 1.55, fade = this.gone(0.02, 0.4);
      if (age <= 0 || fade >= 1) { AT[j4 + 1] = AT[j4 + 2] = 0; continue; }
      const c = Math.cos(d.phi), sn = Math.sin(d.phi), x0 = RING.x + RING.R * (this.U.x * c + this.V.x * sn), y0 = RING.y + RING.R * (this.U.y * c + this.V.y * sn) - 0.03, z0 = RING.z + RING.R * (this.U.z * c + this.V.z * sn);
      const q = Math.min(1, age / fall), fl = age * (calm ? 2.1 : 4.2) + j * 1.7;
      if (q < 1) { p.set(x0 + d.dx * q + 0.03 * Math.sin(fl) * (1 - q), 0.007 + (y0 - 0.007) * (1 - Math.pow(q, 1.5)), z0 + d.dz * q + 0.012 * Math.cos(fl * 0.8) * (1 - q)); AT[j4] = d.rot + 0.5 * Math.sin(fl * 0.7); AT[j4 + 3] = 0; }
      else { p.set(x0 + d.dx, 0.0165 + 0.0006 * j, z0 + d.dz); AT[j4] = d.rot; AT[j4 + 3] = 1; }
      this.world(L, p, w); const k = smooth(0, 0.18, age) * clear(w.x, w.z);
      AP[j3] = w.x; AP[j3 + 1] = w.y; AP[j3 + 2] = w.z; AT[j4 + 1] = d.sx * k; AT[j4 + 2] = d.sy * k;
      AF[i * 2] = d.lit * litK; AF[i * 2 + 1] = fade * 1.3;
    }
    this.aPos.needsUpdate = true; this.aTf.needsUpdate = true; this.aFx.needsUpdate = true;

    // ---- the smoke: it comes first, a little ahead of the flowers, and is the last to go
    {
      const su = this.su, lead = Math.min(Le + CIRC + 0.6, Sraw + 0.5 * ease.smooth(ramp(T, 0.15 * K, 1.1 * K)));
      su.uT.value = T * (calm ? 0.5 : 1);
      su.uSm.value.set(back ? S + 0.3 * (1 - home) : lead, (1 - 0.72 * ease.smooth(ramp(T, tRound - 0.6 * K, tClose + 1.5 * K)) + (closed && tc < 2.2 * K ? 0.7 * Math.sin(Math.PI * tc / (2.2 * K)) : 0)) * (1 - this.gone(0, 0.3)), ease.smooth(ramp(T, 0.25 * K, 1.3 * K)) * (1 - this.gone(0.7, 1)), dy);
      su.uToy.value.set(tx, tz, toy ? 1 : 0);
    }
    // ---- the shade and the light
    gu.uDk.value = ease.smooth(ramp(T, 0, 1.5 * K)) * (1 - this.gone(0.5, 1));
    gu.uFire.value.set(fire, (0.3 * ramp(Sraw, Le, this.Send) + 0.7 * whole) * (1 - this.gone(0, 0.6)));
    gu.uRing.value.w = ramp(Sraw, Le + 0.3, this.Send) * (1 - this.gone(0, 0.5));

    if (!L.quiet) this.rustle.set(Math.min(0.02, speed * 0.016) * (calm ? 0.6 : 1));      // the flowers, going by
    voice.level = calm ? 0.7 : 1; voice.place();
  },
});
