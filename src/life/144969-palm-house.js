// Carl Blechen, The Interior of the Palm House on the Pfaueninsel Near Potsdam (1834), Gallery 221. The word: dapple.
//
// Schinkel's glasshouse for the King of Prussia's palms, on an island in the Havel. A third of the picture is one great
// fan palm seen from beneath with the sun behind it, each pleated segment either alight or dark; its wings are foliage
// (ferns arching into the light and a red flower at the right, long blue-green blades and a fern mound at the left,
// broad dark leaves climbing behind); and nearly half of it is a pale paved floor in the shade of all that, with the
// sun lying on it in spots. Blechen came back from Italy a painter of light, and that floor is what he is looking at:
// sunlight that has come down through palm leaves. So what comes out of the picture is its light, and the leaves it
// comes through.
//
// Look, and sunlight runs out over the gallery floor from under the frame. Where it reaches, the Palm House comes up,
// toy-sized and laid out as he laid it out: wings of ferns and blades to left and right in front, the floor open
// between them, the palms behind under the picture. Ferns unroll from their croziers, blades and broad leaves rise,
// and the palms put up their new leaves as palms do, as closed spears on long stalks. Then the fans open, one to a
// note, left to right up a rising run, each spear drawing back and trembling first; and on the run's top note the
// great fan, as wide as the picture and right under its painted twin, snaps open over the floor. Every fan's shadow
// opens on the floor with it, finger by finger (the sun is behind the wall, as his is behind the palms, so the
// shadows reach out into the room), and with those three notes the softer shadows of the palms still up in the
// picture open across the whole floor from three sides. Where the fingers cross and the leaves are thick the sun
// comes through in round spots, each one the sun's own picture: the floor is dappled, as his is. The air the great
// fan moved goes through the ferns. A red flower opens at the right, where he put one, and then a breath of air goes
// through the house: the fans rock on their stalks, their tips flutter, and the light on the floor rocks with them.
// It breathes like that for as long as you look, and stays out while the toy is near: the toy can drive in under the
// palms, the leaves lean out of its way, and it throws its own shadow in the sun. When you stop, the fans fold,
// everything draws back into the floor and the light goes home under the frame.
//
// The shadow of each fan in the room is worked out from where that fan is at that moment, so leaf and light move as
// one. Everything is under 0.87 m: lower than this picture and both its neighbours begin, so from the look camera the
// guard has nothing to cut. Nothing is solid. Two draw calls: the plants (cards that the shader bends into leaves)
// and the light on the floor.
//
// Music, quietly: the first sentence of Mendelssohn's "Auf Fluegeln des Gesanges", Op. 34 No. 2, written in 1834, the
// year of the picture, by a Berliner (published 1837): one bar of its rocking accompaniment, then "On wings of song,
// my love, I carry you away". The tune is as it stands in Thalberg's piano transcription (Paris, Au Menestrel); the
// accompaniment is thinned to its bass and one broken chord to the half bar. Heine's poem ends "there we will sink
// down under the palm tree": it is the same German daydream of a far-off garden that built this glasshouse. It is
// played straight, once, on a plain soft voice, and nothing in it imitates any other people's music. With "Reduce
// motion and flashing" on, nothing overshoots or trembles, the leaves rock half as far and half as fast, and the fans
// open more slowly; nothing in it flashes at any setting.
//
// What it does not do: the four women in the picture do not come out, in any form, nor their carpet, instruments or
// dress, nor the building's "Indian" ornament, because the museum itself calls them a colonialist fantasy of
// non-European women painted as part of the decor, and nobody is decor here; only the plants and the light come out.
import * as THREE from 'three';
import { lifeFor, ease, ramp, clamp01, lerp } from '../paintlife.js';
import { score, hump } from './stagecraft.js';
import { hz } from './tunes.js';

const PI = Math.PI, TAU = PI * 2, RAD = PI / 180;
const NX = 12, NY = 12;                                           // a card's grid: across a leaf, and along it
const TOP = 0.86;                                                 // nothing stands higher than this (m): under every picture on the wall
const CURL = 10.5;                                                // how tightly a fern's crozier is rolled (radians a frond)
// The way to the sun, in the stage's terms (along the wall, up, out from it): fifty degrees up, and behind the wall, as
// his is behind the palms. So shadows fall out into the room and a little to the left.
const SUN = new THREE.Vector3(0.16, 0.766, -0.62).normalize();
// Mendelssohn, Auf Fluegeln des Gesanges, Op. 34 No. 2 (1834), in A flat, 6/8. E8: a quaver. The tune enters on the
// second bar. [quavers from that bar's first beat, note, length in quavers]
const E8 = 0.36, T_IN = 0.25, T_A = T_IN + 6 * E8;
const TUNE = [[-1, 'Eb4', 1], [0, 'C5', 2], [2, 'C5', 1], [3, 'C5', 1], [4, 'Db5', 1], [5, 'Eb5', 1],
  [6, 'Eb5', 3], [9, 'Bb4', 2.4],
  [12, 'Bb4', 2], [14, 'Bb4', 1], [15, 'Bb4', 1], [16, 'C5', 1], [17, 'Db5', 1],
  [18, 'C5', 5]];
// Its harmony, a half bar at a time from the first (the bar before the tune): the bass, and the broken chord over it.
const TONIC = ['C4', 'Eb4', 'Ab4', 'C5'], DOM = ['Db4', 'Eb4', 'G4', 'Bb4'];
const HARM = [['Ab2', TONIC], ['Ab2', ['C4', 'Ab4', 0, 'C4']], ['Ab2', TONIC], ['Ab2', TONIC], ['G2', DOM], ['G2', DOM], ['G2', DOM], ['G2', DOM], ['Ab2', TONIC], ['Ab2', ['C4', 'Eb4', 'Ab4', 'Eb4']]];
const T_GREAT = T_A + 6 * E8, T_FLOWER = T_A + 12 * E8, T_AIR = T_A + 12 * E8;      // the top of the run; the next bar: the flower, and a breath of air

// The three palms: where each stands (u along the wall from the middle of the picture, out from it), and its leaves: the
// stalk (which way it leans: degrees round from the viewer's right, 90 is out into the room; how steeply it starts;
// how far it bows, radians; its length), the fan (its radius; how steeply its middle rib stands and which way it
// faces once open, degrees; how far round it opens, degrees; how much its tips droop; a turn in its own plane), and
// when it opens. The great fan is the third leaf of the middle palm.
const PALMS = [
  { u: -1.0, out: 0.22, fans: [
    { yaw: 160, e0: 70, bend: 0.5, len: 0.42, R: 0.3, ea: 58, face: 116, spread: 240, droop: 0.2, turn: -0.15, t: T_A },
    { yaw: 95, e0: 84, bend: 0.3, len: 0.5, R: 0.3, ea: 66, face: 86, spread: 246, droop: 0.16, turn: 0.1, t: T_A + 2 * E8 },
    { yaw: 35, e0: 68, bend: 0.55, len: 0.46, R: 0.32, ea: 55, face: 70, spread: 240, droop: 0.2, turn: 0.18, t: T_A + 3 * E8 },
    { yaw: 80, e0: 50, bend: 0.6, len: 0.34, R: 0.22, ea: 40, face: 96, spread: 228, droop: 0.26, turn: 0.1, t: T_A + 9 * E8 },
  ] },
  { u: 0.42, out: 0.17, fans: [
    { yaw: 52, e0: 80, bend: 0.4, len: 0.54, R: 0.3, ea: 64, face: 72, spread: 240, droop: 0.2, turn: -0.14, t: T_A + 4 * E8 },
    { yaw: 12, e0: 68, bend: 0.5, len: 0.56, R: 0.3, ea: 56, face: 58, spread: 244, droop: 0.18, turn: -0.2, t: T_A + 5 * E8 },
    { yaw: 128, e0: 68, bend: 0.45, len: 0.47, R: 0.62, ea: 47, face: 96, spread: 268, droop: 0.14, turn: 0.04, t: T_GREAT, great: true },
    { yaw: 165, e0: 58, bend: 0.6, len: 0.36, R: 0.21, ea: 44, face: 128, spread: 226, droop: 0.26, turn: 0.2, t: T_A + 10 * E8 },
  ] },
  { u: 1.56, out: 0.26, fans: [
    { yaw: 112, e0: 76, bend: 0.4, len: 0.4, R: 0.26, ea: 60, face: 102, spread: 236, droop: 0.2, turn: 0.1, t: T_A + 9 * E8 },
    { yaw: 40, e0: 66, bend: 0.5, len: 0.36, R: 0.22, ea: 52, face: 70, spread: 230, droop: 0.24, turn: -0.2, t: T_A + 11 * E8 },
  ] },
];
const NF = 10;
// The palms that are still in the picture, overhead: the shadows of three of their leaves on the floor (soft, because
// they are high). [where the middle of the shadow lies: u, out; its radius; which way its middle rib points (degrees);
// how far round it opens (degrees); when it opens]
const CANOPY = [[-1.15, 0.5, 1.25, 28, 250, T_A], [1.3, 0.42, 1.3, 150, 256, T_A + 4 * E8], [0.2, 2.35, 1.3, 264, 240, T_GREAT]];
const HIGH = 2.4, NSH = NF + CANOPY.length;
// The ferns, in tufts: the middle of each, how many fronds, how long and how wide (m), how lit (0 the dark mound at
// the left, 1 the ones arching into the sun at the right), and which way the tuft leans (degrees, and how much).
const TUFTS = [
  { u: 1.14, out: 1.08, n: 10, len: [0.3, 0.5], wid: 0.13, tone: 1, lean: 150, k: 0.5 },
  { u: -1.04, out: 1.2, n: 9, len: [0.26, 0.42], wid: 0.12, tone: 0, lean: 40, k: 0.35 },
  { u: 1.52, out: 0.78, n: 6, len: [0.28, 0.4], wid: 0.115, tone: 0.6, lean: 110, k: 0.3 },
  { u: -1.5, out: 0.62, n: 5, len: [0.24, 0.36], wid: 0.11, tone: 0.2, lean: 70, k: 0.3 },
  { u: -0.34, out: 0.14, n: 5, len: [0.16, 0.25], wid: 0.08, tone: 0.4, lean: 90, k: 0.5 },
  { u: 0.18, out: 0.12, n: 4, len: [0.15, 0.22], wid: 0.075, tone: 0.7, lean: 90, k: 0.5 },
  { u: 1.08, out: 0.14, n: 5, len: [0.16, 0.26], wid: 0.085, tone: 0.6, lean: 90, k: 0.5 },
  { u: -1.3, out: 0.15, n: 4, len: [0.16, 0.26], wid: 0.085, tone: 0.2, lean: 90, k: 0.5 },
  { u: -0.84, out: 0.4, n: 5, len: [0.18, 0.28], wid: 0.09, tone: 0.3, lean: 80, k: 0.4 },
  { u: 0.74, out: 0.42, n: 5, len: [0.18, 0.3], wid: 0.09, tone: 0.8, lean: 100, k: 0.4 },
];
// The long blades at the left (blue-green), and the red-leaved plant behind them: [u, out, how many, length, width, red]
const BLADES = [[-1.4, 0.98, 10, [0.42, 0.78], 0.062, 0], [-0.62, 0.14, 7, [0.26, 0.44], 0.045, 1]];
// The broad dark leaves that climb the right of the picture, in clumps: [u, out, which way the clump faces (degrees),
// how many leaves, the longest stalk-and-leaf, a leaf's width]
const BROAD = [[1.62, 0.98, 125, 5, 0.56, 0.2], [1.3, 0.3, 95, 5, 0.6, 0.2], [-1.6, 0.3, 75, 4, 0.5, 0.18], [0.94, 0.12, 100, 3, 0.36, 0.15], [-0.52, 0.1, 80, 3, 0.32, 0.14]];
// The flowers: [u, out, the stalk's heading and length, petals, a petal's length, red (1) or pink (0), when it opens]
const FLOWERS = [[0.82, 1.3, 130, 0.24, 6, 0.09, 1, T_FLOWER], [1.34, 1.36, 60, 0.15, 5, 0.06, 0, T_FLOWER + 2 * E8]];
// Where the leaves are thick, the floor in their lee is in shade, with the sun coming through in spots: [u, out, radius]
const SHADE = [[-1.0, 0.42, 0.5], [0.7, 0.4, 0.5], [1.1, 1.3, 0.42], [-1.08, 1.38, 0.4], [-1.42, 1.2, 0.44], [1.56, 0.9, 0.5], [-0.3, 0.2, 0.3], [0.2, 0.18, 0.26]];
const K_STALK = 0, K_FAN = 1, K_FERN = 2, K_BLADE = 3, K_BROAD = 4, K_PETAL = 5;

// What the two shaders share: a fan-palm leaf in its own terms. x across it (-0.5 to 0.5), y from the hub (0) to the tips
// (1): how far outside the leaf that is, in parts of one segment's width (negative: inside), and which segment, and
// where across it. The segments are joined for the first third and more, and then each runs out to its own point.
const LEAF_GLSL = /* glsl */`
float pH(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float pN(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(pH(i), pH(i + vec2(1.0, 0.0)), f.x), mix(pH(i + vec2(0.0, 1.0)), pH(i + vec2(1.0, 1.0)), f.x), f.y); }
float pSegs(float sd) { return 17.0 + floor(pH(vec2(sd, 3.3)) * 6.0); }
float pFan(float x, float y, float sd, float jn, out float si, out float f) {
  float fx = (x + 0.5) * pSegs(sd); si = floor(fx); f = fract(fx) - 0.5;
  float tip = (0.84 + 0.16 * pH(vec2(si + 1.0, sd * 17.0))) * (1.0 - 0.2 * pow(abs(x) * 2.0, 3.0)), join = (0.36 + 0.12 * pH(vec2(si + 5.0, sd * 3.1))) * jn;
  if (y < join) return -1.0;
  return abs(f) - 0.5 * pow(clamp(1.0 - (y - join) / (tip - join), 0.0, 1.0), 0.72);
}
`;

lifeFor(144969, {
  title: /^The Interior of the Palm House/,
  word: 'dapple',
  stage: { out: 1.5, half: 1.7, cam: { dist: 3.0, height: 0.66, side: 0.3, fov: 60, lookU: 0.02, lookOut: 0.4, lookH: 0.75, whole: false } },
  wake: 2.4, ret: 2.2,
  linger: { near: 4, max: 30 },

  build(L) {
    const P = L.pal, col = (h, a = 0.22) => P.near(h, a), rnd = L.rand, r2 = (a, b) => a + (b - a) * rnd();
    const N = [];
    const inst = o => { o.i = N.length; o.seed = o.seed == null ? rnd() * 9 + 0.1 : o.seed; N.push(o); return o; };
    const born = (u, out) => 0.25 + 0.72 * Math.hypot(u, out - 0.1);      // when the light reaches a root

    // ---------------------------------------------------------- what there is
    // the palms: a stalk and a fan to each leaf
    this.fans = [];
    PALMS.forEach(p => p.fans.forEach((f, k) => {
      const t0 = born(p.u, p.out) + 0.12 * k;
      const stalk = inst({ kind: K_STALK, u: p.u + 0.03 * Math.cos(f.yaw * RAD), out: p.out + 0.03 * Math.sin(f.yaw * RAD), yaw: f.yaw * RAD, e0: f.e0 * RAD, bend: f.bend, len: f.len, wid: 0.016 + 0.012 * f.R, roll: 0, cup: 0.3, t0, dur: 1.15, c: col('#4c5220'), c2: col('#a39a54') });
      const fan = inst({ kind: K_FAN, R: f.R, ea: f.ea * RAD, face: f.face * RAD, spread: f.spread * RAD, droop: f.droop, turn: f.turn, t: f.t, great: !!f.great, stalk, t0: t0 + 0.35, dur: 1.0,
        c: col(f.great ? '#252b0c' : '#2a3010'), c2: col(f.great ? '#7d8c30' : '#6f7e2a', 0.12), k: this.fans.length, u: p.u });
      this.fans.push(fan);
    }));
    // the ferns
    this.ribs = [];
    TUFTS.forEach(t => {
      for (let j = 0; j < t.n; j++) {
        const a = (j + 0.5 * rnd()) / t.n * TAU, la = t.lean * RAD;
        // (a shuttlecock, leaning: its fronds fan out all round, more of them and longer towards where it leans)
        const dx = Math.cos(a) + t.k * 1.6 * Math.cos(la), dy = Math.sin(a) + t.k * 1.6 * Math.sin(la), yaw = Math.atan2(dy, dx), fwd = 0.5 + 0.5 * Math.cos(a - la);
        const len = lerp(t.len[0], t.len[1], 0.35 * rnd() + 0.65 * fwd), u = t.u + 0.03 * Math.cos(a), out = Math.max(0.05, t.out + 0.03 * Math.sin(a));
        const tone = clamp01(t.tone + (rnd() - 0.5) * 0.4);
        this.ribs.push(inst({ kind: K_FERN, u, out, yaw, e0: r2(58, 78) * RAD, bend: r2(1.25, 1.9), len, wid: t.wid * (0.85 + 0.3 * rnd()) * (0.75 + 0.5 * len / t.len[1]), roll: -0.55 * Math.cos(yaw), cup: 0.1,
          t0: born(u, out) + 0.5 * rnd(), dur: 1.5, c: col(tone > 0.5 ? '#36481a' : '#24361a'), c2: col(tone > 0.5 ? '#9ea444' : '#62793a') }));
      }
    });
    // the long blades, and the red-leaved plant
    BLADES.forEach(([bu, bo, n, len, wid, red]) => {
      for (let j = 0; j < n; j++) {
        const yaw = (red ? r2(15, 165) : 12 + (j + rnd() * 0.7) / n * 190) * RAD, l = r2(len[0], len[1]);
        this.ribs.push(inst({ kind: K_BLADE, u: bu + 0.025 * Math.cos(yaw), out: Math.max(0.04, bo + 0.025 * Math.sin(yaw)), yaw, e0: r2(red ? 52 : 60, red ? 80 : 85) * RAD, bend: r2(0.5, red ? 1.0 : 1.25), len: l, wid: wid * (0.85 + 0.3 * rnd()), roll: -0.5 * Math.cos(yaw), cup: 0.28,
          t0: born(bu, bo) + 0.5 * rnd(), dur: 1.2, c: col(red ? '#4a1d15' : '#223a31'), c2: col(red ? '#a04a2c' : '#5f8874') }));
      }
    });
    // the broad leaves, each on its own stalk, hanging its face to the room
    BROAD.forEach(([bu, bo, face, n, len, wid]) => {
      for (let j = 0; j < n; j++) {
        // (the tallest in the middle and furthest back, the others lower and out to the sides: one over another)
        const f = n > 1 ? j / (n - 1) : 0.5, y = (face + (f - 0.5) * 150 + r2(-10, 10)) * RAD, mid = 1 - Math.abs(f - 0.5) * 2, l = len * (0.5 + 0.5 * mid) * r2(0.9, 1.05);
        this.ribs.push(inst({ kind: K_BROAD, u: bu + 0.03 * Math.cos(y), out: Math.max(0.04, bo + 0.03 * Math.sin(y)), yaw: y, e0: lerp(52, 84, mid) * RAD, bend: 0.3, kink: r2(1.7, 2.2), len: l, wid: wid * (0.75 + 0.25 * mid) * r2(0.9, 1.1), roll: -0.3 * Math.cos(y) + r2(-0.15, 0.15), cup: 0.1,
          t0: born(bu, bo) + 0.2 + 0.5 * rnd(), dur: 1.3, c: col('#14271a'), c2: col('#41683a') }));
      }
    });
    // the flowers: a stalk, a few small blades at its foot, and the petals
    this.flowers = FLOWERS.map(([u, out, yaw, len, n, pl, red, t]) => {
      const t0 = born(u, out) + 0.5;
      const stalk = inst({ kind: K_STALK, u, out, yaw: yaw * RAD, e0: 84 * RAD, bend: 0.32, len, wid: 0.011, roll: 0, cup: 0.3, t0, dur: 1.0, c: col('#3d4a1c'), c2: col('#8a9448') });
      for (let j = 0; j < 4; j++) { const y = (30 + j * 100 + r2(-20, 20)) * RAD; this.ribs.push(inst({ kind: K_BLADE, u: u + 0.012 * Math.cos(y), out: out + 0.012 * Math.sin(y), yaw: y, e0: r2(50, 72) * RAD, bend: r2(0.9, 1.4), len: len * r2(0.6, 0.95), wid: 0.03, roll: -0.4 * Math.cos(y), cup: 0.25, t0: t0 - 0.2 + 0.1 * j, dur: 1.0, c: col('#33501f'), c2: col('#87a04a') })); }
      const petals = Array.from({ length: n }, (_, j) => inst({ kind: K_PETAL, yaw: (j + 0.3 * rnd()) / n * TAU, eo: r2(4, 30) * RAD, len: pl * (0.9 + 0.2 * rnd()), wid: pl * 0.46, roll: 0, cup: 0.22,
        c: col(red ? '#7c1d16' : '#b05a5c', 0.12), c2: col(red ? '#cf4630' : '#e7a59c', 0.12) }));
      return { stalk, petals, t, t0 };
    });
    this.stalks = N.filter(o => o.kind === K_STALK); this.N = N;
    const NS = N.length;

    // ---------------------------------------------------------- one mesh of cards, bent into leaves by the shader
    const base = new THREE.PlaneGeometry(1, 1, NX, NY), geo = new THREE.InstancedBufferGeometry();
    geo.index = base.index; geo.setAttribute('position', base.attributes.position); geo.instanceCount = NS;
    const dyn = k => { const a = new THREE.InstancedBufferAttribute(new Float32Array(NS * k), k); a.setUsage(THREE.DynamicDrawUsage); return a; };
    this.aBase = dyn(3); this.aA = dyn(4); this.aS = dyn(4); this.aAnim = dyn(3);
    const aK = new THREE.InstancedBufferAttribute(new Float32Array(NS * 2), 2), aCol = new THREE.InstancedBufferAttribute(new Float32Array(NS * 3), 3), aCol2 = new THREE.InstancedBufferAttribute(new Float32Array(NS * 3), 3);
    N.forEach((o, i) => { aK.setXY(i, o.kind, o.seed); aCol.setXYZ(i, o.c.r, o.c.g, o.c.b); aCol2.setXYZ(i, o.c2.r, o.c2.g, o.c2.b); });
    for (const [k, a] of [['aBase', this.aBase], ['aA', this.aA], ['aS', this.aS], ['aAnim', this.aAnim], ['aK', aK], ['aCol', aCol], ['aCol2', aCol2]]) geo.setAttribute(k, a);
    const v3 = (h, a) => { const c = col(h, a); return new THREE.Vector3(c.r, c.g, c.b); };
    const pu = this.pu = {
      uWind: { value: new THREE.Vector4(0, 0, 0, 0) },            // time, how much the tips flutter, -, -
      uSun: { value: new THREE.Vector4(0, 0, 0, L.y) },           // how much sun, where its flecks have slid to (2), the floor
      uToy: { value: new THREE.Vector3(0, 0, 0) },                // the toy (world x, z), and whether it is there
      uHi: { value: v3('#d5c98a', 0.15) }, uRib: { value: v3('#6b5a2c', 0.2) },
    };
    const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, fog: false });
    mat.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, pu);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', `#include <common>
attribute vec3 aBase, aAnim, aCol, aCol2; attribute vec4 aA, aS; attribute vec2 aK; uniform vec4 uWind; uniform vec3 uToy;
varying vec2 vQ; varying vec4 vK; varying vec3 vCol, vCol2, vPl;
// a leaf's rib: how steeply it runs at s along it (it bows over under its own weight; a fern's is still rolled up past unr)
// (a broad leaf hangs from the end of its stalk: kink)
float pElev(float s, float e0, float bend, float unr, float kink) { return e0 - bend * pow(s, 1.5) * (0.3 + 0.7 * min(unr, 1.0)) + ${CURL.toFixed(1)} * max(0.0, s - unr) - kink * smoothstep(0.2, 0.44, s); }`)
        .replace('#include <project_vertex>', `vec4 mvPosition;
  {
    float x = position.x, y = position.y + 0.5, open = aAnim.x, grow = aAnim.y, sd = aK.y; vec3 pw;
    if (aK.x > 0.5 && aK.x < 1.5) {
      // a fan: the card is wrapped round its hub, as far as the leaf has opened; a shallow cone, its tips drooping
      vec3 A = aA.xyz, S = aS.xyz, N = cross(A, S); float R = aA.w * grow, th = x * aS.w * max(open, 0.03);
      float fl = uWind.y * sin(uWind.x * (2.3 + sd * 0.7) + sd * 40.0 + x * 11.0);
      // (the card is cut a little over size, so its straight edge clears the longest tips)
      float yy = y * 1.03; vPl = vec3(yy * cos(th), yy * sin(th), aS.w * max(open, 0.03));
      pw = aBase + R * yy * (cos(th) * A + sin(th) * S);
      pw += N * R * yy * yy * (0.24 * (1.0 - cos(th)) * open + 0.035 * fl);
      pw.y -= aAnim.z * R * yy * yy * yy * open;
    } else {
      vPl = vec3(0.0);
      // anything else: the card runs along a rib that rises from the root and bows over
      vec3 A = aA.xyz; float e0 = asin(clamp(A.y, -1.0, 1.0)); vec2 hd = normalize(A.xz + vec2(1.0e-5, 0.0));
      vec3 H = vec3(hd.x, 0.0, hd.y), Sp = vec3(-hd.y, 0.0, hd.x), up = vec3(0.0, 1.0, 0.0), p = aBase;
      float seg = aA.w * grow / ${NY.toFixed(1)}, n = y * ${NY.toFixed(1)};
      for (int i = 0; i < ${NY}; i++) { float fi = float(i); if (fi > n - 0.5) break; float e = pElev((fi + 0.5) / ${NY.toFixed(1)}, e0, aAnim.z, open, aS.z); p += (H * cos(e) + up * sin(e)) * seg; }
      float ey = pElev(y, e0, aAnim.z, open, aS.z), cr = cos(aS.x), sr = sin(aS.x); vec3 Nn = up * cos(ey) - H * sin(ey), side = Sp * cr + Nn * sr, nn = Nn * cr - Sp * sr;
      float w = aS.w * (1.0 - 0.6 * smoothstep(open - 0.04, open + 0.1, y)) * (0.35 + 0.65 * min(1.0, grow * 1.6));
      float fl = uWind.y * sin(uWind.x * (1.9 + sd * 0.5) + sd * 30.0 + y * 3.0);
      pw = p + side * (x * w) + nn * (w * aS.y * (4.0 * x * x - 0.35) + 0.014 * fl * y * y);
    }
    // the toy comes through: leaves lean out of its way
    vec2 td = pw.xz - uToy.xy; float tl = length(td), push = uToy.z * (1.0 - smoothstep(0.16, 0.46, tl)) * y;
    pw.xz += td / max(tl, 0.02) * push * 0.13; pw.y -= push * 0.03;
    mvPosition = modelViewMatrix * vec4(pw, 1.0);
  }
  gl_Position = projectionMatrix * mvPosition;
  vQ = vec2(position.x, position.y + 0.5); vK = vec4(aK, aAnim.xy); vCol = aCol; vCol2 = aCol2;`);
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
varying vec2 vQ; varying vec4 vK; varying vec3 vCol, vCol2, vPl; uniform vec4 uSun; uniform vec3 uHi, uRib;
${LEAF_GLSL}`)
        .replace('#include <color_fragment>', `#include <color_fragment>
  {
    float x = vQ.x, y = vQ.y, ax = abs(x), sd = vK.y, d = -1.0; int T = int(vK.x + 0.5); vec3 c = vCol;
    // the sun on it: in flecks, which slide as the leaves stir; less of it low down in the thick of them
    float fleck = smoothstep(0.32, 0.6, pN(vec2(lifeP.x + lifeP.z * 0.6, lifeP.y * 1.4 - lifeP.z * 0.5) * 3.6 + uSun.yz));
    float lit = uSun.x * (0.22 + 0.78 * fleck) * (0.4 + 0.6 * smoothstep(0.02, 0.4, lifeP.y - uSun.w));
    if (T == ${K_FAN}) {
      // a fan seen with the sun behind it: whole segments alight, others dark, each a fold with its ridge
      // (where it is on the leaf, worked out here from its place in the leaf's own plane, so every rib runs straight)
      x = atan(vPl.y, vPl.x) / vPl.z; y = length(vPl.xy);
      float si, f; d = abs(x) > 0.5 ? 1.0 : pFan(x, y, sd, 1.0, si, f); float w = min(fwidth(y) * pSegs(sd) / max(y * vPl.z, 0.02), 2.0);
      d -= 0.45 * w;                                                                   // (never finer than a pixel)
      float streak = smoothstep(0.42, 0.6, pN(vec2(si * 0.55 + sd * 9.0, y * 1.5 + uSun.y * 2.0)));
      float l = uSun.x * (0.1 + 0.9 * streak) * (0.55 + 0.45 * fleck), face = smoothstep(-0.1, 0.1, f) * (1.0 - smoothstep(0.5, 1.2, w));
      c = mix(vCol * (0.78 + 0.3 * face), vCol2 * (0.84 + 0.22 * face), l);
      c = mix(c, uHi, 0.34 * l * (1.0 - smoothstep(0.0, 0.09 + w, abs(f))) * step(0.12, y));          // the ridge of the fold
      c *= 1.0 - 0.3 * (1.0 - smoothstep(0.0, 0.07 + w, 0.5 - abs(f))) * (1.0 - smoothstep(0.4, 1.0, w));      // the crease between two
      c *= 0.58 + 0.42 * smoothstep(0.0, 0.4, y);                                      // dark towards the hub
      c = mix(c, uHi * 0.9, 0.5 * (1.0 - smoothstep(0.0, 0.05, y)));                   // the hub itself
    } else if (T == ${K_FERN}) {
      // a fern frond: leaflets either side of the rib, leaning towards its tip, longest a third of the way up
      float unr = vK.z, a2 = ax * 2.0;
      float env = (0.2 + 0.8 * smoothstep(0.08, 0.32, y)) * pow(clamp(1.0 - (y - 0.3) / 0.72, 0.0, 1.0), 0.8);
      float pv = y * 16.0 - a2 * 1.5, pf = fract(pv) - 0.5, pi = floor(pv), pw2 = fwidth(pv);
      float leaf = abs(pf) - 0.42 * (1.0 - pow(clamp(a2 / max(env, 0.001), 0.0, 1.0), 1.7)) - 0.4 * pw2;
      bool rib = a2 < 0.05 + 0.03 * (1.0 - y);
      d = (rib || (a2 < env && leaf < 0.0 && y > 0.1)) && y < 0.985 ? -1.0 : 1.0;
      float pl = pH(vec2(pi, sd)), l = lit * (0.55 + 0.45 * pl) * (x > 0.0 ? 1.0 : 0.78);
      c = mix(vCol, vCol2, l) * (0.84 + 0.3 * (pf + 0.5) * (1.0 - smoothstep(0.5, 1.2, pw2)));
      c = mix(c, uHi, 0.3 * l * smoothstep(0.55, 1.0, y));                             // paler, yellower at the tip
      if (rib) c = mix(uRib, vCol2, 0.3 + 0.4 * l);
      c = mix(c, uRib, 0.6 * smoothstep(unr - 0.03, unr + 0.12, y));                   // still rolled: the brown of the crozier
    } else if (T == ${K_BLADE}) {
      float hw = 0.5 * (0.42 + 0.58 * smoothstep(0.0, 0.22, y)) * pow(max(1.0 - pow(y, 2.4), 0.0), 0.8);
      d = ax - hw;
      c = mix(vCol, vCol2, lit * (0.55 + 0.45 * smoothstep(-0.3, 0.3, x)));
      c = mix(c, vCol2 * 1.12, 0.45 * (1.0 - smoothstep(0.0, 0.06, ax)));              // the pale rib down the middle
      c *= (0.95 + 0.05 * sin(x * 64.0)) * (0.7 + 0.3 * smoothstep(0.0, 0.3, y));
    } else if (T == ${K_BROAD}) {
      float v = (y - 0.3) / 0.7;
      if (v < 0.0) { d = ax - 0.045; c = mix(vCol, vCol2, 0.35 + 0.5 * lit); }
      else {
        // heart-shaped, drawn out to a point; pale veins from the rib
        d = ax - 0.5 * pow(sin(3.14159 * pow(v, 0.5)), 0.72) * (1.0 - 0.12 * v);
        float vn = abs(fract(v * 6.0 - ax * 2.4) - 0.5), vein = max((1.0 - smoothstep(0.0, 0.07, vn)) * step(0.02, ax) * (1.0 - smoothstep(0.3, 0.9, fwidth(v * 6.0))), 1.0 - smoothstep(0.0, 0.035, ax));
        c = mix(vCol, vCol2, lit * (0.6 + 0.4 * smoothstep(-0.4, 0.4, x)));
        c = mix(c, mix(vCol2, uHi, 0.3), 0.26 * vein);
        c += 0.1 * lit * (1.0 - smoothstep(0.0, 0.16, abs(x - 0.17))) * vCol2;        // its gloss
      }
    } else if (T == ${K_PETAL}) {
      d = ax - 0.5 * pow(sin(3.14159 * pow(y, 0.8)), 0.85);
      c = mix(vCol, vCol2, 0.3 + 0.7 * lit) * (0.82 + 0.18 * smoothstep(0.0, 0.2, ax)) * (0.55 + 0.45 * smoothstep(0.0, 0.35, y));
    } else {
      d = ax - 0.5 * (1.0 - 0.4 * y);
      c = mix(vCol, vCol2, 0.2 + 0.6 * lit + 0.2 * smoothstep(-0.5, 0.5, x));
    }
    if (d > 0.0) discard;
    diffuseColor.rgb = c * (0.62 + 0.38 * smoothstep(0.0, 0.32, lifeP.y - uSun.w));
  }`);
    };
    mat.customProgramCacheKey = () => 'blechen-palms';
    this.plants = L.add(new THREE.Mesh(geo, mat)); this.plants.name = 'plants';

    // ---------------------------------------------------------- the light on the floor
    const O = L.floor(0, 0);
    const V4 = n => Array.from({ length: n }, () => new THREE.Vector4());
    const fu = this.fu = {
      uO: { value: O.clone() }, uAx: { value: new THREE.Vector4(L.tx, L.tz, L.nx, L.nz) },
      uLight: { value: new THREE.Vector4(0, 0, 0, 0) },           // how much sun, how far it has run out, time, the air's sway
      uFH: { value: V4(NSH) }, uFA: { value: V4(NSH) }, uFS: { value: V4(NSH) },      // each fan: hub and radius; middle rib and half its opening; side and seed
      uBlob: { value: SHADE.map(([u, out, r]) => new THREE.Vector4(u, out, r, 0)) },
      uToyF: { value: new THREE.Vector3(9, 9, 0) },
      uSunC: { value: v3('#ffd890', 0.12).multiplyScalar(0.2) }, uShadeC: { value: v3('#262a12', 0.2) },
    };
    const fm = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false, fog: false, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor });
    fm.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, fu);
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
uniform vec3 uO, uToyF, uSunC, uShadeC; uniform vec4 uAx, uLight; uniform vec4 uFH[${NSH}], uFA[${NSH}], uFS[${NSH}], uBlob[${SHADE.length}];
${LEAF_GLSL}
const vec3 SUN = vec3(${SUN.x.toFixed(4)}, ${SUN.y.toFixed(4)}, ${SUN.z.toFixed(4)});
// One fan's shadow at a floor point: back up the sun's ray to the plane the fan lies in, and ask the leaf itself.
float pShade(vec3 P0, vec4 Hh, vec4 Aa, vec4 Ss, float jn, float px) {
  if (Hh.w < 0.004) return 0.0;
  vec3 A = Aa.xyz, S = Ss.xyz, N = cross(A, S); float dn = dot(SUN, N);
  if (abs(dn) < 0.04) return 0.0;
  float t = dot(Hh.xyz - P0, N) / dn; if (t <= 0.0) return 0.0;
  vec3 v = P0 + SUN * t - Hh.xyz; float a = dot(v, A), b = dot(v, S), r = length(vec2(a, b)) / Hh.w;
  float hf = max(Aa.w, 0.02), th = atan(b, a);
  if (r >= 1.0 || abs(th) >= hf) return 0.0;
  float si, f, d = pFan(th / (2.0 * hf), r, Ss.w, jn, si, f), pen = max(0.004 + 0.02 * t, px);      // (the higher the leaf, the softer its shadow; never finer than a pixel)
  float segw = max(r * Hh.w * 2.0 * hf / pSegs(Ss.w), 0.002);
  float sh = d < -0.9 ? 1.0 : 1.0 - smoothstep(-pen, pen, d * segw);
  // (a leaf still folded, or far off: its segments are finer than the shadow's own softness, and run together)
  sh = mix(1.0 - smoothstep(0.38 * jn, 0.95, r), sh, smoothstep(0.5, 1.6, segw / pen));
  return sh * smoothstep(0.0, pen, (hf - abs(th)) * max(r * Hh.w, 0.01));
}
vec3 palmC; float palmA;`)
        .replace('#include <map_fragment>', `#include <map_fragment>
{
  vec2 lq = lifeP.xz - uO.xz, q = vec2(dot(lq, uAx.xy), dot(lq, uAx.zw)); vec3 P0 = vec3(q.x, 0.0, q.y);
  // the sun's reach: out from under the picture, its edge soft and never a line
  float rr = length((q - vec2(0.0, 0.45)) / (vec2(2.5, 2.35) * max(uLight.y, 0.02))) + (pN(q * 1.7 + 3.0) - 0.5) * 0.3;
  float sun = uLight.x * (1.0 - smoothstep(0.4, 1.0, rr)) * smoothstep(-0.02, 0.12, q.y);
  if (sun < 0.003) discard;
  float through = 1.0, px = 0.8 * length(fwidth(q));
  for (int i = 0; i < ${NSH}; i++) through *= 1.0 - (i < ${NF} ? 0.95 * pShade(P0, uFH[i], uFA[i], uFS[i], 1.0, px) : 0.8 * pShade(P0, uFH[i], uFA[i], uFS[i], 0.4, px));
  // under the thick of the leaves: shade
  for (int i = 0; i < ${SHADE.length}; i++) { vec4 b = uBlob[i]; through *= 1.0 - b.w * (1.0 - smoothstep(0.45, 1.0, length((q - b.xy) / b.z) + (pN(q * 6.0 + float(i) * 3.0) - 0.5) * 0.45)); }
  // and wherever there is shade the sun comes through the gaps between the leaves: in round spots, each the sun's own
  // picture, which wink as the leaves stir; and in larger ragged patches, which slide
  float spot = 0.0;
  for (int k = 0; k < 2; k++) {
    vec2 cs = k == 0 ? vec2(0.27, 0.31) : vec2(0.12, 0.14), g = q / cs + float(k) * 7.3; g.y += 0.37 * floor(g.x);
    vec2 gi = floor(g), gf = fract(g) - 0.5; float hs = pH(gi + 0.5);
    vec2 off = (vec2(pH(gi + 3.1), pH(gi + 7.7)) - 0.5) * 0.24 + uLight.w * vec2(0.05, 0.03);
    float rad = (0.13 + 0.17 * pH(gi + 1.7)) * (0.8 + 0.2 * sin(uLight.z * (0.5 + 0.6 * hs) + hs * 30.0));
    spot = max(spot, step(k == 0 ? 0.5 : 0.7, hs) * (1.0 - smoothstep(rad - 0.07, rad, length((gf - off) * vec2(0.9 + 0.3 * pH(gi + 5.5), 1.12)))));
  }
  float gap = smoothstep(0.6, 0.74, pN(q * 2.6 + vec2(uLight.w * 0.12, uLight.z * 0.02) + 9.0));
  through += (1.0 - through) * max(spot * 0.86, gap * 0.8);
  // the toy in the sun: its shadow
  vec2 dl = -SUN.xz / SUN.y * 0.3, pa = q - uToyF.xy; float hh = clamp(dot(pa, dl) / dot(dl, dl), 0.0, 1.0);
  through *= 1.0 - 0.9 * uToyF.z * (1.0 - smoothstep(0.11, 0.2, length(pa - dl * hh) + hh * 0.03));
  palmA = sun * (1.0 - through) * 0.6;
  palmC = uShadeC * palmA * 0.4 + uSunC * sun * through;
}`)
        .replace('#include <opaque_fragment>', '  outgoingLight = palmC; diffuseColor.a = palmA;\n#include <opaque_fragment>');
    };
    fm.customProgramCacheKey = () => 'blechen-palm-floor';
    {
      const g = new THREE.PlaneGeometry(6.4, 3.9); g.rotateX(-PI / 2);
      this.ground = new THREE.Mesh(g, fm); L.floor(0, 1.95, this.ground.position); this.ground.position.y = L.y + 0.012; this.ground.rotation.y = L.yawOut;
      this.ground.renderOrder = 5; L.add(this.ground);
    }

    // ---------------------------------------------------------- scratch
    this.a = new THREE.Vector3(); this.s = new THREE.Vector3(); this.n = new THREE.Vector3(); this.e = { u: 0, h: 0, out: 0, el: 0 };
    this.T = 0; this.off = 0; this.calm = false;
    this.hide();
  },

  // The quiet band, on the show's clock: the song, each fan's rustle as it opens, the breath of air.
  band(L, calm) {
    const s = score(L), piano = (t, n, d, vol) => s.note(t, hz(n), d, { vol, type: 'triangle', attack: 0.014, over: 2, overVol: 0.2 });
    HARM.forEach(([bass, ch], k) => {
      const t = T_IN + k * 3 * E8;
      s.note(t, hz(bass), 3 * E8 * 1.3, { vol: 0.02, type: 'sine', attack: 0.03, over: 2, overVol: 0.25 });
      ch.forEach((n, j) => n && piano(t + (1 + j * 0.5) * E8, n, 0.6, 0.011));
    });
    for (const [k, n, d] of TUNE) piano(T_A + k * E8, n, Math.max(0.5, d * E8 * 1.25), 0.03);
    for (const f of this.fans) {
      const t = f.t;
      if (f.great) { s.hit(t - 0.02, { d: 0.6, vol: 0.02, bp: 2300, q: 0.7, attack: calm ? 0.12 : 0.04 }); s.hit(t + 0.05, { d: 0.35, vol: 0.008, bp: 5200, q: 0.9, attack: 0.05 }); }
      else s.hit(t - 0.02, { d: 0.3, vol: 0.011, bp: 3000 + 260 * f.k, q: 0.8, attack: calm ? 0.08 : 0.03 });
    }
    s.hit(T_AIR - 0.3, { d: 3.2, vol: 0.011, bp: 820, q: 0.5, attack: 1.2 });           // the air through the house
    return s.done();
  },

  hide() {
    this.aAnim.array.fill(0); this.aAnim.needsUpdate = true; this.aS.array.fill(0); this.aS.needsUpdate = true;
    this.ground.visible = false; this.plants.visible = false; this.fu.uLight.value.set(0, 0, 0, 0); this.fu.uToyF.value.z = 0; this.pu.uToy.value.z = 0;
  },
  start(L, resumed) {
    if (resumed) { this.off = this.T - L.t; if (this.sc) this.sc.from(1e9); return; }      // (still out: carry on from where it is, without the song)
    this.T = 0; this.off = 0; this.calm = L.calm;
    this.sc = this.band(L, this.calm); this.sc.from(0);
    if (!this.told && !L.quiet) { this.told = true; L.k.say('The sun comes down through the palm leaves and lies on the floor in spots.', 4); }
  },
  end() { this.hide(); },
  reset() { this.told = false; this.T = 0; this.hide(); },

  // A stalk's far end, in the stage's terms (as the shader bends it): into o = { u, h, out, el (how steeply it ends) }
  tip(u, out, yaw, e0, bend, len, o) {
    let h = 0; const cy = Math.cos(yaw), sy = Math.sin(yaw), seg = len / NY;
    for (let i = 0; i < NY; i++) { const e = e0 - bend * Math.pow((i + 0.5) / NY, 1.5), c = Math.cos(e); u += c * cy * seg; out += c * sy * seg; h += Math.sin(e) * seg; }
    o.u = u; o.h = h; o.out = out; o.el = e0 - bend; return o;
  },
  // The air in the house at time t, where a plant stands: a slow rocking always, and now and then a breath that
  // travels along the wall.
  air(t, u) {
    const sp = this.calm ? 0.5 : 1;
    let gust = hump(t, T_AIR - 0.4, T_AIR + 3.4);
    if (t > T_AIR + 6) { const n = Math.floor((t - T_AIR - 6) / 7.5), t0 = T_AIR + 6 + n * 7.5; gust += (0.55 + 0.35 * ((n * 3) % 4) / 3) * hump(t, t0, t0 + 3.6); }
    // (and the air the great fan moves as it opens, going out from it both ways)
    const dt = t - T_GREAT - 0.12 - 0.22 * Math.abs(u - 0.2), puff = dt > 0 ? Math.exp(-dt * 1.9) * Math.sin(dt * 8.5 * sp) * Math.min(1, dt * 12) : 0;
    return (this.calm ? 0.5 : 1) * ((0.3 + 1.1 * gust) * Math.sin(t * 1.9 * sp - u * 1.5) + 0.22 * Math.sin(t * 0.83 * sp + u * 2.3 + 1) + 0.9 * puff);
  },

  update(L, dt) {
    const ph = L.phase, showing = ph === 'wake' || ph === 'play', back = ph === 'return', calm = this.calm;
    if (showing) this.T = L.t + this.off; else this.T += dt;
    const T = this.T, R = back ? L.ret : 0, gone = (a, b) => (back ? ease.inOut(ramp(R, a, b)) : 0);
    if (showing && this.sc) this.sc.play(L.t);
    const A = this.aA.array, S = this.aS.array, B = this.aBase.array, M = this.aAnim.array, a = this.a, s = this.s, n = this.n, e = this.e;
    const tx = L.tx, tz = L.tz, nx = L.nx, nz = L.nz;
    // a direction in the stage's terms (along the wall, up, out), into the world
    const world = (i4, arr, x, y, z, w) => { arr[i4] = tx * x + nx * z; arr[i4 + 1] = y; arr[i4 + 2] = tz * x + nz * z; arr[i4 + 3] = w; };
    const root = (o, u, h, out) => { const j = o.i * 3; B[j] = L.cx + tx * u + nx * out; B[j + 1] = L.y + h; B[j + 2] = L.cz + tz * u + nz * out; };
    const rib = (o, yaw, el, len, grow, open, bend) => {
      const c = Math.cos(el), i = o.i;
      world(i * 4, A, c * Math.cos(yaw), Math.sin(el), c * Math.sin(yaw), len);
      S[i * 4] = o.roll; S[i * 4 + 1] = o.cup; S[i * 4 + 2] = (o.kink || 0) * Math.min(1, grow * 1.3); S[i * 4 + 3] = o.wid; M[i * 3] = open; M[i * 3 + 1] = grow; M[i * 3 + 2] = bend;
    };

    // ---- ferns, blades and broad leaves: each comes up when the light reaches it; a fern unrolls as it comes
    for (const o of this.ribs) {
      const w = this.air(T, o.u), fern = o.kind === K_FERN, away = gone(0.34 + 0.1 * o.seed / 9, 0.82 + 0.1 * o.seed / 9);
      const grow = ease.out(ramp(T, o.t0, o.t0 + o.dur * (fern ? 0.8 : 1))) * (1 - away);
      const open = fern ? ease.inOut(ramp(T, o.t0 + 0.15, o.t0 + o.dur)) * (1 - gone(0.08, 0.6)) : 1.5;
      root(o, o.u, 0.004, o.out);
      rib(o, o.yaw + 0.05 * w, o.e0 + 0.035 * w * Math.cos(o.yaw), o.len * (fern ? 0.3 + 0.7 * grow : 1), fern ? Math.min(1, grow * 3) * (1 - away) : grow, open, o.bend * (1 + 0.07 * w));
    }
    // ---- the palms: the stalk rises with its leaf a closed spear; the spear opens into a fan on its note
    const FH = this.fu.uFH.value, FA = this.fu.uFA.value, FS = this.fu.uFS.value;
    for (const f of this.fans) {
      const o = f.stalk, w = this.air(T, f.u + 0.4 * Math.cos(o.yaw)), k = f.k;
      const away = gone(0.36, 0.86), grow = ease.out(ramp(T, o.t0, o.t0 + o.dur)) * (1 - away);
      const to = f.t, dur = calm ? 0.95 : f.great ? 0.7 : 0.5, q = (T - to) / dur;
      // (before it opens the spear draws back a little and trembles; then it opens, and overshoots, and settles)
      const ant = calm ? 0 : hump(T, to - 0.42, to + 0.04), shake = ant * Math.sin((T - to) * 46) * 0.02;
      let open = q <= 0 ? 0 : (calm ? ease.out(q) : ease.outBack(q));
      open *= 1 - gone(0.02 + 0.025 * (NF - 1 - k), 0.3 + 0.025 * (NF - 1 - k));
      const yaw = o.yaw + 0.045 * w + shake, el = o.e0 + 0.04 * w + 0.07 * ant, bend = o.bend * (1 + 0.1 * w);
      root(o, o.u, 0.004, o.out); rib(o, yaw, el, o.len, grow, 1.5, bend);
      // its hub is the end of the stalk; its middle rib runs on from it, lower as the leaf opens and takes the air
      this.tip(o.u, o.out, yaw, el, bend, o.len * grow, e);
      // (a spear runs on from its stalk; as it opens the leaf comes round to face the room, and it nods in the air)
      const fgrow = ease.out(ramp(T, f.t0, f.t0 + f.dur)) * (1 - gone(0.3, 0.8)), o1 = ease.smooth(Math.min(1, open));
      const ea = lerp(e.el, f.ea, o1) + 0.05 * w, fy = lerp(yaw, f.face, o1) + 0.04 * w, ca = Math.cos(ea), rock = f.turn * o1 + 0.07 * w + shake * 2;
      a.set(ca * Math.cos(fy), Math.sin(ea), ca * Math.sin(fy)); s.set(-Math.sin(fy), 0, Math.cos(fy)); n.crossVectors(a, s);
      s.applyAxisAngle(n, rock); a.applyAxisAngle(n, rock);                           // (it rocks in its own plane)
      // never higher than TOP: a fan too tall for its stalk is a little smaller
      const rise = Math.hypot(a.y, s.y) + 0.24 * Math.max(0, n.y) + 0.02, Rr = Math.min(f.R, (TOP - e.h) / Math.max(0.2, rise)) * fgrow, i = f.i;
      root(f, e.u, e.h + 0.004, e.out);
      world(i * 4, A, a.x, a.y, a.z, Rr); world(i * 4, S, s.x, s.y, s.z, f.spread);
      M[i * 3] = open; M[i * 3 + 1] = 1; M[i * 3 + 2] = f.droop;
      FH[k].set(e.u, e.h, e.out, Rr); FA[k].set(a.x, a.y, a.z, 0.5 * f.spread * Math.max(open, 0.03)); FS[k].set(s.x, s.y, s.z, f.seed);
    }
    // ---- the palms overhead, in the picture: their shadows open on the floor with the notes, and rock with the air
    CANOPY.forEach(([cu, co, R, dir, spread, to], j) => {
      const k = NF + j, w = this.air(T, cu), q = (T - to) / (calm ? 1.5 : 1.1), open = (q <= 0 ? 0 : ease.out(q)) * (1 - gone(0.05, 0.45));
      const d = dir * RAD + 0.05 * w, lift = HIGH / SUN.y;
      FH[k].set(cu + 0.04 * w + SUN.x * lift, HIGH, co + SUN.z * lift, open > 0.001 ? R : 0); FA[k].set(Math.cos(d), 0, Math.sin(d), 0.5 * spread * RAD * open); FS[k].set(-Math.sin(d), 0, Math.cos(d), 3.3 + j * 2.1);
    });
    // ---- the flowers: a bud of petals held together, which opens and hangs
    for (const fl of this.flowers) {
      const o = fl.stalk, w = this.air(T, o.u), away = gone(0.4, 0.85), grow = ease.out(ramp(T, o.t0, o.t0 + o.dur)) * (1 - away);
      const yaw = o.yaw + 0.06 * w, el = o.e0 + 0.03 * w, q = (T - fl.t) / (calm ? 1.1 : 0.75);
      const open = (q <= 0 ? 0 : calm ? ease.out(q) : ease.outBack(q)) * (1 - gone(0.02, 0.3));
      root(o, o.u, 0.004, o.out); rib(o, yaw, el, o.len, grow, 1.5, o.bend);
      this.tip(o.u, o.out, yaw, el, o.bend, o.len * grow, e);
      const bud = ease.out(ramp(T, o.t0 + 0.5, o.t0 + 1.3)) * (1 - gone(0.3, 0.7));
      for (const p of fl.petals) { root(p, e.u, e.h + 0.004, e.out); rib(p, p.yaw + 0.5 * (1 - open), lerp(84 * RAD, p.eo, open) + 0.03 * w, p.len * (0.55 + 0.45 * Math.min(1, open)), bud, 1.5, lerp(0.15, 1.15, open)); }
    }
    this.aBase.needsUpdate = true; this.aA.needsUpdate = true; this.aS.needsUpdate = true; this.aAnim.needsUpdate = true;

    // ---- the light: it runs out from under the frame, and goes home last
    const amount = ease.smooth(ramp(T, 0.05, 1.1)) * (1 - gone(0.55, 1)), reach = (0.06 + 0.94 * ease.out(ramp(T, 0.1, 2.3))) * (1 - 0.75 * gone(0.4, 1));
    const sway = this.air(T, 0), fu = this.fu, pu = this.pu;
    fu.uLight.value.set(amount, reach, T * (calm ? 0.5 : 1), sway);
    const thick = ease.smooth(ramp(T, 0.7, 2.6)) * (1 - gone(0.3, 0.8));
    for (let i = 0; i < SHADE.length; i++) fu.uBlob.value[i].w = 0.9 * thick;
    pu.uSun.value.set(amount, 0.05 * sway + T * 0.012, 0.03 * sway, L.y);
    pu.uWind.value.set(T * (calm ? 0.5 : 1), (calm ? 0.25 : 0.6) * (0.5 + Math.abs(sway)), 0, 0);
    // ---- the toy among the leaves
    const toy = L.k.G.vehicle, on = !!(toy && toy.group && toy.group.visible && Math.abs(toy.pos.y - L.y) < 0.4);
    if (on) { const dx = toy.pos.x - L.cx, dz = toy.pos.z - L.cz; fu.uToyF.value.set(dx * tx + dz * tz, dx * nx + dz * nz, 1); pu.uToy.value.set(toy.pos.x, toy.pos.z, 1); }
    else { fu.uToyF.value.z = 0; pu.uToy.value.z = 0; }
    this.ground.visible = amount > 0.004; this.plants.visible = true;
    L.voice().place();
  },
});
