// Claude Monet, Houses of Parliament, London (1900–1), Gallery 243. The word: toll.
//
// He painted Parliament from St Thomas' Hospital, across the Thames, late in the afternoon, canvas after canvas,
// waiting for the fog. In this one the building is a blue silhouette going soft in it, the sun a small orange flame
// between the spires on the right, the river pale lilac with the great tower's reflection lying on it in blue dashes,
// and one small boat with a red-brown sail. It is all air. So the show is air: look at it and his fog wells out at the
// foot of the wall under the picture and rolls out low across the floor, lilac and rose, a bank against the wall
// thinning to wisps, nowhere deeper than a hand's width. Under it the river is laid on the floorboards the way he laid
// it, one level dash at a time from the bank towards you, the floor showing between, all of it still grey-blue,
// waiting for the light. A clock somewhere in the fog chimes the last phrase before the hour (the Westminster
// Quarters, written in 1793 for Great St Mary's in Cambridge and rung at Westminster since 1859, at the pace a clock
// rings them), and with each of its four notes a part of the skyline is brushed in over the fog, each column one
// upright stroke drawn from the water up: the low bank on the left, the spires on the right, the turrets between, and
// on the last, held note the Victoria Tower, up to its four pinnacles. The sun comes up small and orange behind the
// spires, with his rose streaks beside it. The boat slides in from the right. Everything goes still.
//
// Then the hour: one deep bell (the great bell's E), far off, and the tower shivers, and from its foot a single slow
// swell goes out through the fog and across the water. Every dash heaves and catches the low sun as the swell passes
// and comes down in its own colour, so the ring carries the sunset out over the river (the tower's reflection in
// blue, rose low on the left, peach by the boat, turquoise here and there, as they lie in the picture); the
// reflection breaks up and comes together again, the boat pitches and rides it, the fog stands up in a pale crest and
// settles behind it. It strikes five (he worked at about that hour, for the sun), a ring to each, and then there is
// only the river shimmering, the fog rolling and the boat going slowly across; the quarters ring if you stay a long
// while, and at last six. When you stop looking it all stays while the toy is near (the clock goes on), and the fog
// parts round the toy as it drives through; then the skyline goes from the pinnacles down, the dashes lift off from
// the near edge back to the bank, and the fog draws back in under the picture.
//
// Nothing here is ever in front of a picture. The fog is five level sheets, the highest 17 cm above the floor, so no
// eye above that can see any of it against a canvas; it is narrow at the wall (the doorway is to the left there) and
// nothing in it is solid. The skyline stands 90 cm at its pinnacles, close under the picture and below its rail (the
// guard does the rest). Neither mesh is drawn into the floor's reflection.
// Two draw calls: the marks (river, skyline, sun, boat: one instanced mesh of brush strokes) and the fog.
// With "Reduce motion and flashing": the shimmer goes at half speed and half strength, the chime's small rings, the
// tower's shiver and the bell's knock are left out, the hour's ring is lower and comes up over most of a second, the
// sun swells less, and the first bell is eased in over half a second, quieter.
//
// What it leaves out: there are no gulls and no second barge, because this canvas has none (others of the series
// do); the bell is heard and not built, because the tower he painted is the Victoria Tower and the clock tower is out
// of the picture; and the chime is rung straight and slowly, as a clock rings it, never as a jingle.
import * as THREE from 'three';
import { lifeFor, ease, ramp, clamp01, canvasTexture, rng } from '../paintlife.js';

const SC = 1.9, SW = 0.92 * SC, SH = 0.81 * SC;      // the skyline's scale: his 92 cm stands 1.75 m wide on the floor
const WATER = 0.70;                           // the waterline, down the picture (0 its top, 1 its foot)
const U = x => (x - 0.5) * SW, HT = y => (WATER - y) * SH;      // the picture -> metres along the wall, and up from the floor
const O0 = 0.45, O1 = 2.1, HW0 = 0.98, FAN = 0.46;      // the river: from the bank out to here (m); half its width at the bank; how it fans
const fan = o => 1 + FAN * clamp01((o - O0) / (O1 - O0));
const NRIV = 276;                             // the river's dashes
const NR = 5, RC = 0.58, RW = 0.2, RK = 9;    // rings at once; their speed (m/s), width (m) and wave number
const NL = 5, FOG0 = 0.03, FOGD = 0.035;      // the fog: sheets, the lowest (m above the floor), and the step between
const FOGU = 2.0, FOGO = 2.7, FX = 28, FZ = 20;      // its sheets: half width, depth, and their grid
const FOOT = [U(0.4625), O0 + 0.02];          // the foot of the Victoria Tower: where the hour's rings start
// The clock. The Westminster Quarters: five changes on four bells (G#4 F#4 E4 B3); the hour is changes 2 to 5.
const BELLS = { g: 415.30, f: 369.99, e: 329.63, b: 246.94 }, BEN = 164.81;
const CHANGE = ['gfeb', 'egfb', 'efge', 'gefb', 'bfge'];
const T_CHIME = 0.4, STEP = 0.9, T_TOLL = 4.9, GAP = 3.4, HOUR = 5;
// The skyline's parts, in the order the chime's notes bring them: when, how long each takes to be brushed in, its
// height, and where along the wall its foot is (a small ring starts there).
const PARTS = [{ t: T_CHIME, d: 0.6, h: 0.46, x: 0.27 }, { t: T_CHIME + STEP, d: 0.75, h: 0.7, x: 0.84 }, { t: T_CHIME + 2 * STEP, d: 0.6, h: 0.48, x: 0.6 }, { t: T_CHIME + 3 * STEP, d: 1.25, h: 0.9, x: 0.4625 }];
// Everything the clock does, by show-time: { t, f (Hz), big (the hour bell), part (the opening chime's notes) }.
const EVENTS = (() => {
  const ev = [], change = (t, i, part) => { [...CHANGE[i]].forEach((n, j) => ev.push({ t: t + j * STEP, f: BELLS[n], last: j === 3, part: part ? j : -1 })); return t + 4 * STEP + 0.9; };
  const strikes = (t, n) => { for (let i = 0; i < n; i++) ev.push({ t: t + i * GAP, f: BEN, big: true }); return t + n * GAP; };
  change(T_CHIME, 4, true);
  let t = strikes(T_TOLL, HOUR) + 14;         // five o'clock; then the quarters, if you stay
  t = change(t, 0) + 20;                      // a quarter past
  t = change(change(t, 1), 2) + 20;           // half past
  t = change(change(change(t, 3), 4), 0) + 20;      // a quarter to
  t = change(change(change(change(t, 1), 2), 3), 4) + 1.6; strikes(t, HOUR + 1);      // six
  return ev.sort((a, b) => a.t - b.t);
})();
// A church bell's partials: [of the note, how loud, how long it rings (of the decay)]. Hum, prime, the minor third
// that makes it a bell, fifth, octave, and a little of the clang.
const PARTIALS = [[0.5, 0.55, 1], [1, 1, 0.8], [1.19, 0.48, 0.62], [1.5, 0.2, 0.45], [2, 0.5, 0.42], [2.52, 0.14, 0.24], [3.01, 0.09, 0.18]];

lifeFor(16584, {
  title: /^Houses of Parliament, London/,
  word: 'toll',
  // (a small work, hung high: the kit keeps all of it in view; the camera stands low and near, so the skyline looms
  // under the picture and the river runs towards you)
  stage: { out: O1, half: 1.45, cam: { dist: 2.6, height: 0.62, side: -0.3, fov: 62, lookU: 0.02, lookOut: 0.5, lookH: 0.75, floorOut: 1.35 } },
  wake: 2, ret: 2.8,
  linger: { near: 4, max: 30 },

  build(L) {
    const P = L.pal, col = (h, a = 0.3) => P.near(h, a), pick = list => list[Math.floor(L.rand() * list.length)];
    const C = (list, a) => list.map(h => col(h, a));
    this.v = new THREE.Vector3();
    this.rings = Array.from({ length: NR }, () => ({ x: 0, z: 0, age: 0, amp: 0 })); this.ri = 0;
    const ax = new THREE.Vector4(L.tx, L.tz, L.nx, L.nz), origin = L.floor(0, 0);
    const uRing = { value: Array.from({ length: NR }, () => new THREE.Vector4()) }, uRise = { value: 0.3 };
    const foot = L.floor(FOOT[0], FOOT[1]); this.foot = [foot.x, foot.z];

    // ---------------------------------------------------------- the marks: one mesh of his brush strokes
    // Each is a quad the shader lays down: flat on the floor (the river), or upright (the skyline, the sun, the boat).
    const A = [], B = [], D = [], F = [], cols = [];
    // kind: 0 a dash of the river, 1 the skyline, 2 the sun's flame, 3 its glow, 4 the boat (upright), 5 the boat's reflection
    // (colours: the renderer's film curve lifts and greys what it is given, so each kind is laid in deeper and purer)
    const GAIN = [0.78, 0.62, 1.6, 1.0, 0.64, 0.6], SAT = [1.5, 1.12, 1.15, 1.15, 1.15, 1.2];
    const mark = (kind, x, y, z, len, wid, ang, yaw, t0, fade, sprite, alpha, c) => {
      const l = 0.3 * c.r + 0.55 * c.g + 0.15 * c.b, g = GAIN[kind], q = SAT[kind];
      A.push(x, y, z, kind); B.push(len, wid, ang, yaw); D.push(t0, L.rand(), sprite, alpha); F.push(fade);
      cols.push(new THREE.Color(Math.max(0, l + (c.r - l) * q) * g, Math.max(0, l + (c.g - l) * q) * g, Math.max(0, l + (c.b - l) * q) * g));
    };
    const jit = a => (L.rand() - 0.5) * 2 * a;

    // the river, as it lies in the picture's lower third: pale lilac, the tower's reflection in blue dashes straight
    // out from its foot, the banks' teal just under them, rose low on the left, peach by the boat, a warm path under the sun
    const lilac = C(['#a99dd2', '#9c9cd6', '#b4a4d8', '#a2a8de', '#ae9acc'], 0.18), blue = C(['#5c88be', '#5282b4', '#6a94c4', '#5c94b2', '#5a80bc'], 0.2), teal = C(['#5f9db4', '#6fa2c0', '#56a0aa', '#78b0c0'], 0.2);
    const rose = C(['#d898be', '#e0a2b4', '#d08cbc', '#e4aac2'], 0.18), peach = C(['#e6a894', '#dc9aa8', '#ecb498'], 0.18), fire = C(['#f09860', '#e88274', '#f4ac78'], 0.15), turq = col('#7ccac4', 0.18), pale = C(['#cfcaee', '#dcd4f0', '#c4c8f0'], 0.18);
    const riverCol = (x, y) => {
      const q = L.rand();
      if (Math.abs(x - 0.465) < 0.052 + 0.022 * y && y < 0.86 && q < 0.92 - 0.45 * y) return pick(L.rand() < 0.22 ? teal : blue);
      if (y < 0.1 && q < 0.75) return pick(L.rand() < 0.5 ? teal : blue);
      if (x > 0.13 && x < 0.41 && y < 0.3 && q < 0.7 - y) return pick(teal);
      if (x > 0.72 && y < 0.36 && q < 0.62 - y) return pick(blue);
      if (Math.abs(x - 0.845) < 0.05 + 0.03 * y && q < 0.55 * (1 - y * 0.8)) return pick(fire);
      if (x < 0.36 && y > 0.48 && q < 0.5) return pick(rose);
      if (x > 0.5 && x < 0.82 && y > 0.22 && y < 0.8 && q < 0.42) return pick(L.rand() < 0.5 ? peach : rose);
      if (q > 0.93) return turq;
      if (q > 0.84) return pick(pale);
      return pick(lilac);
    };
    for (let i = 0; i < NRIV; i++) {
      const y01 = Math.pow((i + L.rand()) / NRIV, 1.3), o = O0 + (O1 - O0) * y01, half = HW0 * fan(o);
      // (a broken edge: fewer towards the sides and the near end, a few strays beyond)
      let u = jit(half * 1.05); const e = Math.abs(u) / half;
      if (e > 0.8 && L.rand() < (e - 0.8) / 0.3) u *= 0.3 + 0.5 * L.rand();
      if (y01 > 0.9 && L.rand() < (y01 - 0.9) / 0.14) continue;
      const big = 0.8 + 0.34 * y01, p = L.floor(u, o), x = 0.5 + u / (2 * half);
      mark(0, p.x, L.y + 0.014, p.z, (0.16 + 0.15 * L.rand()) * big, (0.042 + 0.026 * L.rand()) * big, jit(0.13), 0, 0.5 + 2.2 * y01 + L.rand() * 0.35, 0.3, L.rand() < 0.4 ? 3 : 0, 0.9 + 0.1 * L.rand(), riverCol(x, y01));
    }
    // the boat's reflection (dark red dashes on the water, going with it)
    for (const [bx, bo, len, wid, c] of [[0, 0.08, 0.24, 0.05, '#8a5868'], [0.014, 0.155, 0.18, 0.042, '#9a6070'], [-0.012, 0.225, 0.13, 0.036, '#a87078']]) mark(5, bx, 0.015, bo, len, wid, jit(0.08), 0, 0, 0, 3, 0.85, col(c, 0.2));
    // the sun: a soft warm glow close to the wall, and the flame itself, behind the spires; rose streaks beside it
    { const p = L.floor(U(0.845), 0.07);
      mark(3, p.x, L.y + HT(0.41), p.z, 0.95, 0.85, 0, 0, 1.7, 2.4, 1, 0.5, col('#f08a58', 0.12));
      mark(3, p.x + L.nx * 0.03, L.y + HT(0.415), p.z + L.nz * 0.03, 0.36, 0.36, 0, 0, 2.3, 1.8, 1, 0.75, col('#f8b470', 0.12));
      for (const [x, y0, y1, wid, c] of [[0.842, 0.375, 0.46, 0.038, '#f39a52'], [0.855, 0.395, 0.465, 0.03, '#f6b868'], [0.833, 0.405, 0.455, 0.028, '#ee8460'], [0.848, 0.36, 0.4, 0.025, '#f8c88a']]) {
        const q = L.floor(U(x), 0.13); mark(2, q.x, L.y + HT((y0 + y1) / 2), q.z, (y1 - y0) * SH * 1.25, wid, Math.PI / 2 + jit(0.15), jit(0.2), 2.5 + L.rand() * 0.7, 0.9, 0, 0.95, col(c, 0.15));
      }
      for (const [x, y, ang, c] of [[0.655, 0.4, 0.38, '#e8a2ac'], [0.63, 0.44, 0.27, '#e6aaa0'], [0.675, 0.362, 0.5, '#eeb4b0'], [0.7, 0.425, 0.3, '#f0b89c']]) {
        const q = L.floor(U(x), 0.15); mark(2, q.x, L.y + HT(y), q.z, 0.14, 0.028, ang, jit(0.2), 2.9 + L.rand() * 0.7, 0.9, 0, 0.8, col(c, 0.2));
      }
    }
    // the skyline: his silhouette is one soft mass. Each column is one loaded upright stroke from the water to its top,
    // wider than the gap to the next, ragged at the top and going to nothing at the foot, where the fog has it; spires
    // and pinnacles are single pointed strokes; a few shorter strokes of his other blues lie over the mass.
    const tower = C(['#4674a8', '#407c9e', '#4c70ac', '#3c7696', '#4e80aa'], 0.25), bank = C(['#5288a2', '#5a8caa', '#54849e', '#6292a8', '#5a84b0'], 0.25), haze = col('#7ea8be', 0.25);
    const block = (x, yTop, part, o, wid, tones, alpha = 0.96) => {
      const h = HT(yTop) + 0.02, p = L.floor(U(x), o + jit(0.012)), PT = PARTS[part];
      mark(1, p.x, L.y + h / 2 - 0.02, p.z, h, wid, Math.PI / 2 + jit(0.03), jit(0.25), PT.t + L.rand() * 0.15, PT.d * (0.75 + 0.5 * clamp01(h / PT.h)), 2, alpha, pick(tones));
    };
    const point = (x, yTop, yBase, part, o, wid, tones) => {
      const h0 = HT(yBase), h1 = HT(yTop), p = L.floor(U(x), o), PT = PARTS[part];
      mark(1, p.x, L.y + (h0 + h1) / 2, p.z, (h1 - h0) * 1.12, wid, Math.PI / 2 + jit(0.05), jit(0.3), PT.t + PT.d * clamp01(h0 / PT.h) + L.rand() * 0.1, 0.45, 0, 0.95, pick(tones));
    };
    const dabs = (x0, x1, y0, y1, n, part, o, tones, len = 0.13, wid = 0.05) => {
      for (let i = 0; i < n; i++) {
        const x = x0 + (x1 - x0) * L.rand(), hc = HT(y0 + (y1 - y0) * L.rand()), p = L.floor(U(x), o + jit(0.01)), PT = PARTS[part], k = ease.smooth(hc / 0.3);
        mark(1, p.x, L.y + hc, p.z, len * (0.8 + 0.5 * L.rand()), wid * (0.8 + 0.4 * L.rand()), Math.PI / 2 + jit(0.14), jit(0.4), PT.t + PT.d * clamp01(hc / PT.h) + L.rand() * 0.15, 0.4, 0, 0.75 * k, pick(tones).clone().lerp(haze, 0.35));
      }
    };
    // (from the wall outwards, so nearer strokes are drawn over farther ones)
    for (let x = 0.105; x < 0.415; x += 0.036) block(x + jit(0.005), 0.475 + 0.012 * Math.sin(x * 60) + Math.max(0, 0.2 - x) * 1.3, 0, 0.24, 0.115, bank, 0.3 + 0.66 * ease.smooth(ramp(x, 0.1, 0.22)));
    for (let x = 0.525; x < 0.72; x += 0.036) block(x + jit(0.005), 0.47 + 0.01 * Math.sin(x * 50), 2, 0.24, 0.115, bank);
    for (let x = 0.725; x < 1.03; x += 0.036) block(x + jit(0.005), (x > 0.925 ? 0.385 : 0.43 + 0.012 * Math.sin(x * 70)) + Math.max(0, x - 0.97) * 1.6, 1, 0.25, 0.115, bank, 0.3 + 0.66 * ease.smooth(ramp(x, 1.03, 0.94)));
    for (const [x, y] of [[0.2, 0.43], [0.262, 0.42], [0.315, 0.445], [0.375, 0.4]]) point(x, y, 0.5, 0, 0.27, 0.034, bank);
    for (const [x, y] of [[0.535, 0.4], [0.575, 0.395], [0.606, 0.42]]) point(x, y, 0.52, 2, 0.28, 0.05, tower);
    for (const [x, y, w] of [[0.75, 0.268, 0.058], [0.8, 0.274, 0.058], [0.885, 0.258, 0.074], [0.86, 0.34, 0.046], [0.912, 0.335, 0.046], [0.955, 0.372, 0.05]]) point(x, y, 0.5, 1, 0.29, w, tower);
    for (const [x, y, part, o, w, tones] of [[0.2, 0.47, 0, 0.26, 0.1, bank], [0.3, 0.47, 0, 0.25, 0.1, bank], [0.385, 0.45, 0, 0.26, 0.1, bank], [0.56, 0.45, 2, 0.26, 0.1, bank], [0.66, 0.47, 2, 0.25, 0.1, bank],
      [0.75, 0.4, 1, 0.27, 0.1, bank], [0.8, 0.4, 1, 0.27, 0.1, bank], [0.885, 0.36, 1, 0.27, 0.12, bank], [0.96, 0.39, 1, 0.26, 0.1, bank], [0.445, 0.175, 3, 0.32, 0.15, tower], [0.485, 0.175, 3, 0.32, 0.15, tower]]) {
      const h = HT(y) + 0.02, p = L.floor(U(x), o), PT = PARTS[part];
      mark(1, p.x, L.y + h / 2 - 0.02, p.z, h, w, Math.PI / 2, Math.PI / 2 + jit(0.2), PT.t + L.rand() * 0.15, PT.d, 2, 0.96, pick(tones));
    }
    dabs(0.15, 0.4, 0.5, 0.62, 7, 0, 0.27, tower); dabs(0.53, 0.71, 0.5, 0.62, 5, 2, 0.27, tower); dabs(0.73, 0.98, 0.45, 0.62, 7, 1, 0.28, tower);
    for (const x of [0.427, 0.451, 0.475, 0.499]) block(x + jit(0.003), 0.175 + jit(0.004), 3, 0.32, 0.078, tower, 1);
    dabs(0.425, 0.5, 0.2, 0.6, 9, 3, 0.335, bank, 0.15, 0.036);
    for (const [x, y] of [[0.42, 0.13], [0.447, 0.122], [0.478, 0.124], [0.506, 0.134]]) point(x, y, 0.2, 3, 0.325, 0.028, tower);
    // the boat: a low dark hull and a red-brown sail, a few dabs each way so it has a side from anywhere
    for (const yaw of [0.5, -0.62]) {
      const hull = C(['#4c3e60', '#603c52'], 0.15), sail = C(['#b8563e', '#aa4c4a', '#c66644', '#98484e'], 0.15), s = yaw > 0 ? 0 : 0.004, k = 1.6;
      mark(4, 0, 0.022 * k, s, 0.25 * k, 0.042 * k, 0, yaw, 0, 0, 0, 0.95, hull[0]); mark(4, 0.005 * k, 0.042 * k, s, 0.2 * k, 0.03 * k, 0, yaw, 0, 0, 0, 0.9, hull[1]);
      mark(4, 0.014 * k, 0.135 * k, s - 0.003, 0.25 * k, 0.011 * k, Math.PI / 2, yaw, 0, 0, 0, 0.9, col('#4a3c58', 0.2));
      mark(4, -0.036 * k, 0.112 * k, s, 0.13 * k, 0.04 * k, Math.PI / 2 - 0.27, yaw, 0, 0, 0, 0.92, sail[0]); mark(4, -0.002 * k, 0.128 * k, s + 0.003, 0.17 * k, 0.043 * k, Math.PI / 2 - 0.07, yaw, 0, 0, 0, 0.95, sail[1]);
      mark(4, 0.03 * k, 0.1 * k, s, 0.12 * k, 0.036 * k, Math.PI / 2 + 0.2, yaw, 0, 0, 0, 0.92, sail[2]); mark(4, -0.006 * k, 0.068 * k, s + 0.005, 0.105 * k, 0.034 * k, 0.1, yaw, 0, 0, 0, 0.9, sail[3]);
    }
    const n = A.length / 4;
    // four marks in one texture (each along its length): 0 a loaded dab, ragged at both ends; 1 a soft spot (the sun's
    // glow); 2 an upright stroke for the skyline's mass (ragged where the brush leaves it, fading out where it starts,
    // in the fog); 3 a dry dab, its bristles showing
    const atlas = canvasTexture(256, 256, (g, w, h) => {
      g.clearRect(0, 0, w, h); g.lineCap = 'round'; const r = rng(16584);
      const cell = (cx, cy, draw) => { g.save(); g.beginPath(); g.rect(cx * 128, (1 - cy) * 128, 128, 128); g.clip(); g.translate(cx * 128, (1 - cy) * 128); draw(); g.restore(); };
      cell(0, 0, () => {
        for (let i = 0; i < 34; i++) {
          const y = 64 + (r() - 0.5) * 62, k = 1 - Math.abs(y - 64) / 34, x0 = 10 + r() * 16 + (1 - k) * 22, x1 = 118 - r() * 16 - (1 - k) * 22;
          g.strokeStyle = `rgba(255,255,255,${0.22 + 0.34 * r()})`; g.lineWidth = 4 + r() * 8;
          g.beginPath(); g.moveTo(x0, y + (r() - 0.5) * 5); g.quadraticCurveTo(64, y - 3 + (r() - 0.5) * 8, x1, y + (r() - 0.5) * 6); g.stroke();
        }
        g.fillStyle = 'rgba(255,255,255,0.42)'; g.beginPath(); g.ellipse(64, 64, 34, 17, 0, 0, Math.PI * 2); g.fill();
      });
      cell(1, 0, () => {
        const gr = g.createRadialGradient(64, 64, 0, 64, 64, 60); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.3, 'rgba(255,255,255,0.6)'); gr.addColorStop(0.65, 'rgba(255,255,255,0.18)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = gr; g.fillRect(2, 2, 124, 124);
      });
      cell(0, 1, () => {
        for (let i = 0; i < 46; i++) {
          const y = 64 + (r() - 0.5) * 100, k = 1 - Math.abs(y - 64) / 54, x1 = 111 + r() * 9;
          g.strokeStyle = `rgba(255,255,255,${(0.3 + 0.4 * r()) * (0.45 + 0.55 * k)})`; g.lineWidth = 5 + r() * 9;
          g.beginPath(); g.moveTo(-6, y + (r() - 0.5) * 4); g.lineTo(x1, y + (r() - 0.5) * 5); g.stroke();
        }
        g.fillStyle = 'rgba(255,255,255,0.55)'; g.fillRect(0, 22, 106, 84);
        // (its foot goes to nothing)
        g.globalCompositeOperation = 'destination-in'; const gr = g.createLinearGradient(0, 0, 128, 0); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.07, 'rgba(0,0,0,0)'); gr.addColorStop(0.22, 'rgba(0,0,0,0.3)'); gr.addColorStop(0.5, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,1)');
        g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
      });
      cell(1, 1, () => {
        for (let i = 0; i < 13; i++) {
          const y = 64 + (r() - 0.5) * 58, k = 1 - Math.abs(y - 64) / 32, x0 = 8 + r() * 34 + (1 - k) * 20, x1 = 120 - r() * 34 - (1 - k) * 20;
          g.strokeStyle = `rgba(255,255,255,${0.5 + 0.45 * r()})`; g.lineWidth = 3 + r() * 6;
          g.beginPath(); g.moveTo(x0, y + (r() - 0.5) * 4); g.quadraticCurveTo(64, y - 2 + (r() - 0.5) * 6, x1, y + (r() - 0.5) * 5); g.stroke();
        }
      });
    }, false);
    const geo = new THREE.PlaneGeometry(1, 1);
    geo.setAttribute('aA', new THREE.InstancedBufferAttribute(new Float32Array(A), 4)); geo.setAttribute('aB', new THREE.InstancedBufferAttribute(new Float32Array(B), 4));
    geo.setAttribute('aD', new THREE.InstancedBufferAttribute(new Float32Array(D), 4)); geo.setAttribute('aF', new THREE.InstancedBufferAttribute(new Float32Array(F), 1));
    const u = this.u = {
      uAx: { value: ax }, uO: { value: origin }, uFoot: { value: new THREE.Vector2(foot.x, foot.z) }, uRing, uRise,
      uShow: { value: 0 }, uGone: { value: 0 }, uShim: { value: 0 }, uHush: { value: 1 }, uLit: { value: 0 }, uShake: { value: 0 }, uSun: { value: 1 }, uBoat: { value: new THREE.Vector4() }, uBoatA: { value: 0 },
    };
    const sm = this.smat = new THREE.MeshBasicMaterial({ map: atlas, color: 0xffffff, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false });
    sm.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, u);
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', `#include <common>
attribute vec4 aA, aB, aD; attribute float aF;
uniform vec4 uAx; uniform vec3 uO; uniform vec2 uFoot; uniform vec4 uRing[${NR}]; uniform vec4 uBoat;
uniform float uShow, uGone, uShim, uHush, uLit, uShake, uSun, uBoatA, uRise;
varying vec2 vSUv; varying float vSpr, vAl, vBr;`)
        .replace('#include <project_vertex>', `
  float kind = aA.w, turn = aB.z, len = aB.x, wid = aB.y, al = aD.w, br = 1.0, ph = aD.y;
  vec3 ax = vec3(uAx.x, 0.0, uAx.y), an = vec3(uAx.z, 0.0, uAx.w), up = vec3(0.0, 1.0, 0.0), ctr = aA.xyz, off = vec3(0.0), bx, by;
  if (kind > 3.5) {
    // the boat's own marks: about its middle, pitching with it
    vec2 q = aA.xy;
    if (kind < 4.5) { float cr = cos(uBoat.z), sr = sin(uBoat.z); q = vec2(cr * q.x - sr * q.y, sr * q.x + cr * q.y); turn += uBoat.z; }
    ctr = vec3(uBoat.x, uO.y + (kind < 4.5 ? uBoat.w : 0.0), uBoat.y) + ax * q.x + up * q.y + an * aA.z;
  }
  // the rings passing under it
  float prof = 0.0, crest = 0.0;
  for (int i = 0; i < ${NR}; i++) {
    vec4 R = uRing[i]; if (R.w <= 0.0) continue;
    float x = length(ctr.xz - R.xy) - ${RC.toFixed(3)} * R.z, env = exp(-x * x / ${(RW * RW).toFixed(5)}), dec = R.w * exp(-R.z * 0.22) * smoothstep(0.0, uRise, R.z);
    prof += dec * env * cos(x * ${RK.toFixed(1)}); crest += dec * env;
  }
  if (kind < 0.5 || kind > 4.5) {
    bx = ax; by = an;
    float k = uBoatA;
    if (kind < 0.5) {
      // laid from the bank outwards; lifted off from the near edge back; in its colour once the hour's first ring has passed
      float so = dot(ctr.xz - uO.xz, uAx.zw), y01 = clamp((so - ${O0.toFixed(3)}) / ${(O1 - O0).toFixed(3)}, 0.0, 1.0), g0 = 0.08 + 0.5 * (1.0 - y01);
      k = smoothstep(aD.x, aD.x + aF, uShow) * (1.0 - smoothstep(g0, g0 + 0.14, uGone));
      float lit = 1.0 - smoothstep(uLit - 0.4, uLit, length(ctr.xz - uFoot)), lum = dot(vColor, vec3(0.3, 0.55, 0.15));
      vColor = mix(mix(vec3(lum) * vec3(0.7, 0.78, 1.06), vColor, 0.25), vColor, lit);
      br *= mix(0.82, 1.0, lit);
    }
    len *= mix(0.3, 1.0, k); al *= k;
    float w = 0.7 + 1.3 * fract(ph * 7.31);
    br += 0.17 * sin(uShim * w + ph * 6.283) * uHush + 1.2 * crest;
    vColor = mix(vColor, vec3(1.0, 0.8, 0.66), clamp(crest * 0.45, 0.0, 0.55));      // (the low sun on the crest)
    al *= 0.85 + 0.15 * sin(uShim * w * 1.37 + ph * 17.0) * uHush;
    off += ax * (0.012 * sin(uShim * 0.8 * w + ph * 11.0) * uHush + 0.15 * prof * (fract(ph * 3.7) - 0.5)) + up * (0.045 * max(prof, 0.0) + 0.008 * min(prof, 0.0));
    len *= 1.0 + 0.35 * crest; wid *= 1.0 + 0.35 * crest;
  } else {
    float yaw = aB.w; bx = ax * cos(yaw) + an * sin(yaw); by = up;
    if (kind < 1.5) {
      // the skyline: each stroke flicked upwards into place; it goes from the top down
      float top = ctr.y + (aD.z > 1.5 ? len * 0.5 : 0.0) - uO.y, hn = clamp(top / 0.9, 0.0, 1.0), g0 = 0.04 + 0.36 * (1.0 - hn);
      float k = smoothstep(aD.x, aD.x + aF, uShow) * (1.0 - smoothstep(g0, g0 + 0.22, uGone));
      if (aD.z > 1.5) { off -= up * (len * 0.5 * (1.0 - k)); len *= k; al *= smoothstep(0.0, 0.12, k); }      // a column: drawn up from the water
      else { off -= up * (1.0 - k) * 0.06; al *= k; }                                                          // a stroke: flicked up into place
      al *= 0.93 + 0.07 * sin(uShim * 0.6 + ph * 6.283);
      off += ax * (sin(uShim * 31.0 + ph * 40.0) * 0.009 * uShake * hn * hn);
    } else if (kind < 3.5) {
      al *= smoothstep(aD.x, aD.x + aF, uShow) * (1.0 - smoothstep(0.08, 0.5, uGone)) * uSun * (kind < 2.5 ? 0.9 + 0.1 * sin(uShim * 1.1 + ph * 6.283) : 1.0);
      if (kind > 2.5) { len *= 0.7 + 0.3 * uSun; wid *= 0.7 + 0.3 * uSun; }
    } else al *= uBoatA;
  }
  float cs = cos(turn), sn = sin(turn); vec2 q2 = vec2(position.x * len, position.y * wid); q2 = vec2(cs * q2.x - sn * q2.y, sn * q2.x + cs * q2.y);
  vec4 mvPosition = modelViewMatrix * vec4(ctr + bx * q2.x + by * q2.y + off, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  vSUv = uv; vSpr = aD.z; vAl = al; vBr = br;`);
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying vec2 vSUv; varying float vSpr, vAl, vBr;')
        .replace('#include <map_fragment>', '{ vec4 st = texture2D(map, (vSUv + vec2(mod(vSpr, 2.0), floor(vSpr * 0.5))) * 0.5); diffuseColor.a *= st.a * min(vAl, 1.0); }')
        .replace('#include <color_fragment>', '#include <color_fragment>\n  diffuseColor.rgb *= vBr;');
    };
    sm.customProgramCacheKey = () => 'parliament-marks';
    const marks = this.marks = new THREE.InstancedMesh(geo, sm, n);
    cols.forEach((c, i) => marks.setColorAt(i, c)); marks.renderOrder = 5;
    L.add(marks);

    // ---------------------------------------------------------- the fog: level sheets of drifting haze, the top one 17 cm up
    const N = 128, nd = new Uint8Array(N * N * 4), r = rng(165841);
    const lattice = G => { const a = new Float32Array(G * G); for (let i = 0; i < a.length; i++) a[i] = r(); return (x, y) => { const fx = x * G, fy = y * G, x0 = Math.floor(fx), y0 = Math.floor(fy), sx = fx - x0, sy = fy - y0, kx = sx * sx * (3 - 2 * sx), ky = sy * sy * (3 - 2 * sy), at = (i, j) => a[((j + y0) % G) * G + ((i + x0) % G)]; return (at(0, 0) * (1 - kx) + at(1, 0) * kx) * (1 - ky) + (at(0, 1) * (1 - kx) + at(1, 1) * kx) * ky; }; };
    for (let c = 0; c < 2; c++) { const l4 = lattice(4), l8 = lattice(8), l16 = lattice(16); for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const v = l4(x / N, y / N) * 0.5 + l8(x / N, y / N) * 0.33 + l16(x / N, y / N) * 0.17; nd[(y * N + x) * 4 + c] = Math.round(255 * clamp01((v - 0.5) * 1.9 + 0.5)); } }
    const noise = new THREE.DataTexture(nd, N, N, THREE.RGBAFormat); noise.wrapS = noise.wrapT = THREE.RepeatWrapping; noise.magFilter = THREE.LinearFilter; noise.minFilter = THREE.LinearMipmapLinearFilter; noise.generateMipmaps = true; noise.needsUpdate = true;
    const pos = [], lay = [], pq = [], idx = [];
    for (let l = 0; l < NL; l++) {
      const base = pos.length / 3;
      for (let j = 0; j <= FZ; j++) for (let i = 0; i <= FX; i++) { const uu = -FOGU + 2 * FOGU * i / FX, o = -L.wall + 0.006 + (FOGO + L.wall) * j / FZ, p = L.floor(uu, o); pos.push(p.x, L.y + FOG0 + l * FOGD, p.z); lay.push(l / (NL - 1)); pq.push(uu, o); }
      for (let j = 0; j < FZ; j++) for (let i = 0; i < FX; i++) { const a = base + j * (FX + 1) + i, b = a + 1, c = a + FX + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
    }
    const fg = new THREE.BufferGeometry(); fg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); fg.setAttribute('aLay', new THREE.Float32BufferAttribute(lay, 1)); fg.setAttribute('aPq', new THREE.Float32BufferAttribute(pq, 2)); fg.setIndex(idx);
    const fu = this.fu = {
      uRing, uRise, tNoise: { value: noise }, uFog: { value: new THREE.Vector4(0, 0, 0, 1) }, uHole: { value: [new THREE.Vector4(), new THREE.Vector4()] }, uSunU: { value: U(0.845) },
      cViolet: { value: col('#7a7ec4', 0.15).multiplyScalar(0.62) }, cRose: { value: col('#d088b0', 0.15).multiplyScalar(0.72) }, cPale: { value: col('#a8a8e2', 0.15).multiplyScalar(0.76) },
    };
    const fm = this.fmat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false });
    fm.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, fu);
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', `#include <common>\nattribute float aLay; attribute vec2 aPq; uniform vec4 uRing[${NR}]; uniform float uRise; varying float vLay, vCrest; varying vec2 vPq; varying vec3 vW;`)
        .replace('#include <begin_vertex>', `#include <begin_vertex>
  vLay = aLay; vPq = aPq; vW = position; vCrest = 0.0;
  for (int i = 0; i < ${NR}; i++) { vec4 R = uRing[i]; if (R.w <= 0.0) continue; float x = length(position.xz - R.xy) - ${RC.toFixed(3)} * R.z; vCrest += R.w * exp(-R.z * 0.22) * smoothstep(0.0, uRise, R.z) * exp(-x * x / (x < 0.0 ? ${(RW * RW * 6).toFixed(5)} : ${(RW * RW * 1.6).toFixed(5)})); }`);      // (the fog settles slowly behind the crest)
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', `#include <common>
uniform sampler2D tNoise; uniform vec4 uFog; uniform vec4 uHole[2]; uniform float uSunU; uniform vec3 cViolet, cRose, cPale;
varying float vLay, vCrest; varying vec2 vPq; varying vec3 vW; vec3 fCol; float fA;`)
        .replace('#include <map_fragment>', `#include <map_fragment>
{
  float su = vPq.x, so = vPq.y;
  float n1 = texture2D(tNoise, vPq * 0.31 + vec2(vLay * 0.17 + uFog.x * 0.006, vLay * 0.11 - uFog.x * 0.03)).r;
  float n2 = texture2D(tNoise, vPq * 0.83 + vec2(0.4 - uFog.x * 0.011, -uFog.x * 0.055 - vLay * 0.23)).g;
  float n = n1 * 0.6 + n2 * 0.4;
  // how far it has rolled out, its front ragged; narrower at the wall (the doorway is to the left there)
  float reach = 1.0 - smoothstep(uFog.y - 0.7, uFog.y, so + (n1 - 0.5) * 1.3);
  float hwd = 1.25 + 0.16 * so, side = 1.0 - smoothstep(hwd - 0.6, hwd, abs(su) + (n1 - 0.5) * 0.9);
  // thin and broken over the river; the upper sheets only where it billows, by the wall, and on a ring's crest
  float th = 0.25 + 0.3 * vLay - vCrest * 0.32 - 0.14 * (1.0 - smoothstep(0.0, 0.55, so)) + 0.2 * smoothstep(0.5, 2.1, so);
  float d = smoothstep(th - 0.2, th + 0.16, n) * reach * side;
  for (int i = 0; i < 2; i++) { vec4 H = uHole[i]; d *= mix(1.0, smoothstep(H.z * 0.3, H.z, length(vW.xz - H.xy)), H.w); }
  float warm = clamp(exp(-pow((su - uSunU) / (0.45 + 0.3 * so), 2.0)) * (0.95 - 0.22 * so) + (n2 - 0.5) * 0.5, 0.0, 1.0) * uFog.w;
  fCol = mix(mix(cViolet, cRose, warm), cPale, clamp(vLay * 0.75 + vCrest * 0.6 + (n2 - 0.5) * 0.5, 0.0, 1.0));
  fCol = mix(fCol, vec3(0.9, 0.68, 0.74), clamp(vCrest * 0.5, 0.0, 0.55));      // (the crest, lit rose by the low sun)
  fA = d * uFog.z * (0.105 + 0.08 * vLay) * (1.0 + vCrest * 0.95);
}`)
        .replace('#include <opaque_fragment>', '  outgoingLight = fCol; diffuseColor.a = fA;\n#include <opaque_fragment>');
    };
    fm.customProgramCacheKey = () => 'parliament-fog';
    const fog = this.fog = new THREE.Mesh(fg, fm); fog.renderOrder = 6;
    L.add(fog);
    // (neither is drawn into the polished floor's reflection: they lie on it, and the river is its own reflection.
    // The mirror shows and hides what it is given, so these are shown and hidden by their materials.)
    { const fl = L.k.museum.floors; if (fl) for (const m of [marks, fog]) if (!fl.includes(m)) fl.push(m); }
    this.lap = L.voice().loop({ lp: 420, hp: 90 });
    this.hide();
  },

  hide() { this.smat.visible = false; this.fmat.visible = false; },

  // ---------------------------------------------------------------- rings: the same sum on the CPU, for the boat
  ring(x, z, amp) { const r = this.rings[this.ri = (this.ri + 1) % NR]; r.x = x; r.z = z; r.age = 0; r.amp = amp; },
  // (h: how high the water stands at (x, z), of a ring's full height; s: how it slopes there, for the boat's pitch)
  wave(x, z, o) {
    let h = 0, s = 0;
    for (const r of this.rings) {
      if (r.amp <= 0) continue;
      const d = Math.hypot(x - r.x, z - r.z) - RC * r.age, env = Math.exp(-d * d / (RW * RW)), dec = r.amp * Math.exp(-r.age * 0.22) * ease.smooth(r.age / this.u.uRise.value);
      h += dec * env * Math.cos(d * RK); s -= dec * env * Math.sin(d * RK);
    }
    o.h = h; o.s = s; return o;
  },

  // ---------------------------------------------------------------- the bells
  // One struck bell on the work's voice: f its note, vol, how long it rings; soft: eased in (no clapper's knock).
  bell(L, f, vol, decay, soft) {
    const v = L.voice();
    for (const [m, g, d] of PARTIALS) v.note(f * m, decay * d, { vol: vol * g, type: 'sine', attack: soft ? (m < 1 ? 0.7 : 0.5) : (m < 1 ? 0.03 : 0.012) });
  },
  strike(L, e) {
    const calm = L.calm;
    if (e.big) {
      // the hour: the great bell, far off in the fog
      this.ring(this.foot[0], this.foot[1], calm ? 0.65 : 1); this.lastToll = e.t; this.tolls++;
      if (L.quiet) return;
      const first = this.tolls === 1;
      this.bell(L, e.f, calm ? (first ? 0.024 : 0.03) : 0.042, 6.5, calm && first);
      if (!calm) L.voice().note(70, 0.5, { vol: 0.03, type: 'sine', to: 44, attack: 0.006 });
    } else {
      if (e.part >= 0 && !calm) { const p = L.floor(U(PARTS[e.part].x), O0, this.v); this.ring(p.x, p.z, 0.26); }
      if (L.quiet) return;
      // the quarter bells: small, a long way off; the opening notes come up out of the quiet
      const up = e.part >= 0 ? 0.55 + 0.15 * e.part : 1;
      this.bell(L, e.f, 0.014 * up * (calm ? 0.8 : 1), e.last ? 3.6 : 2.4, calm);
    }
  },

  start(L, resumed) {
    this.smat.visible = true; this.fmat.visible = true;
    if (resumed) return;
    this.ts = 0; this.shim = 0; this.fogT = 0; this.ei = 0; this.lastToll = -99; this.tolls = 0; this.lit = 0; this.front = 0; this.wakeAt = 0;
    for (const r of this.rings) { r.amp = 0; r.age = 0; }
    this.u.uGone.value = 0;
  },
  back(L) { this.front0 = this.front; this.boat0 = this.u.uBoatA.value; },
  end(L) { this.hide(); this.lap.set(0); },
  reset(L) { if (this.smat) this.end(L); },

  update(L, dt) {
    const ph = L.phase, out = ph === 'wake' || ph === 'play' || ph === 'linger', ret = ph === 'return', calm = L.calm, u = this.u, fu = this.fu, G = L.k.G;
    if (out) this.ts += dt;
    const ts = this.ts;
    // ---- the clock
    if (out) while (this.ei < EVENTS.length && EVENTS[this.ei].t <= ts) this.strike(L, EVENTS[this.ei++]);
    // a held breath before the hour, and everything let go again on the stroke
    const hush = ts < T_TOLL ? 1 - 0.85 * ease.smooth(ramp(ts, T_TOLL - 1.2, T_TOLL - 0.35)) : 0.15 + 0.85 * ease.smooth(ramp(ts, T_TOLL, T_TOLL + 0.7));
    this.shim += dt * (calm ? 0.5 : 1) * (0.35 + 0.65 * hush);
    this.fogT += dt * (0.7 + 2.6 * (1 - ease.smooth(ramp(ts, 0.4, 3.8)))) * (0.3 + 0.7 * hush);
    for (const r of this.rings) r.age += dt;
    // ---- the fog rolls out, and draws back in under the picture
    if (out) this.front = Math.max(this.front, 2.75 * ease.out(ramp(ts, 0, 3.6)));
    else if (ret) this.front = (this.front0 || 0) * (1 - ease.inOut(ramp(L.ret, 0.22, 1)));
    fu.uFog.value.set(this.fogT, this.front, (out ? ease.smooth(ramp(ts, 0, 0.9)) : 1) * (ret ? 1 - ramp(L.ret, 0.88, 1) : 1), 0.35 + 0.65 * ease.smooth(ramp(ts, 1.7, 4.2)));
    // ---- the marks
    const since = ts - this.lastToll; u.uRise.value = calm ? 0.9 : 0.3;
    if (ts > T_TOLL && out) this.lit = Math.min(4, RC * (ts - T_TOLL) + 0.12);
    u.uShow.value = ts; u.uGone.value = ret ? L.ret : 0; u.uShim.value = this.shim; u.uHush.value = hush * (calm ? 0.5 : 1); u.uLit.value = this.lit;
    u.uShake.value = calm || since < 0 || since > 1.8 ? 0 : Math.exp(-since * 2.4);
    // (the sun swells once, slowly, on each stroke: 3.4 s apart)
    u.uSun.value = 1 + (calm ? 0.25 : 0.7) * (since > 0 && since < 2.2 ? Math.sin(Math.PI * since / 2.2) : 0);
    // ---- the boat: in from the right to where it lies in the picture, then slowly on across, and round again
    const BT0 = 1.9, BV = 0.035, BO = 1.12, edge = HW0 * fan(BO) + 0.12;
    let bu = 0.5 + (edge - 0.47) * (1 - clamp01((ts - BT0) / 3.2)) ** 2 - BV * (ts - BT0);
    if (bu < -edge) bu = edge - ((-edge - bu) % (2 * edge));
    let ba = ts < BT0 ? 0 : ease.smooth(ramp(edge - Math.abs(bu), 0, 0.22));
    if (ret) ba = (this.boat0 || 0) * (1 - ramp(L.ret, 0, 0.35)); else if (!out) ba = 0;
    const bp = L.floor(bu, BO, this.v), w = this.wave(bp.x, bp.z, this.wo || (this.wo = {}));
    const idle = calm ? 0 : 1;
    u.uBoat.value.set(bp.x, bp.z, 0.5 * w.s + 0.035 * Math.sin(this.shim * 1.3) * idle, 0.03 * w.h + 0.004 * Math.sin(this.shim * 1.7) * idle);
    u.uBoatA.value = ba;
    fu.uHole.value[0].set(bp.x - L.nx * 0.08, bp.z - L.nz * 0.08, 0.46, 0.9 * ba);
    // ---- the toy: the fog parts round it, and the water heaves a little under its wheels (it is never in its way)
    const veh = G.vehicle, toy = out && G.state === 'play' && veh && veh.group.visible && Math.abs(veh.pos.y - L.y) < 0.4;
    if (toy) {
      const q = L.local(veh.pos.x, veh.pos.z), on = q.out > O0 && q.out < O1 && Math.abs(q.u) < HW0 * fan(q.out), sp = Math.hypot(veh.vel.x, veh.vel.z);
      fu.uHole.value[1].set(veh.pos.x, veh.pos.z, 0.55, 0.92);
      if (on && sp > 0.3 && ts > this.wakeAt) { this.wakeAt = ts + (calm ? 1.1 : 0.45); this.ring(veh.pos.x, veh.pos.z, 0.22); }
    } else fu.uHole.value[1].w = 0;
    for (let i = 0; i < NR; i++) { const r = this.rings[i]; u.uRing.value[i].set(r.x, r.z, r.age, r.amp); }
    // ---- sound: the river, very quietly, under the bells
    const near = Math.max(0, 1 - Math.hypot(G.camera.position.x - L.cx, G.camera.position.z - L.cz) / 12);
    this.lap.set(L.quiet ? 0 : 0.016 * (out ? ease.smooth(ramp(ts, 0.3, 3)) : ret ? 1 - L.ret : 0) * near * (0.8 + 0.2 * Math.sin(this.shim * 0.9)), 0.4);
    L.voice().place();
  },
});
