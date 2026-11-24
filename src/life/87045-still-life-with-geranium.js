// Henri Matisse, Still Life with Geranium (1906), Gallery 391. The word: bloom.
//
// A Fauve still life: a geranium in a pink clay pot on a green table, a blue-and-white jug beside it, a row of red
// fruit at its foot, and behind it a wall brushed in loose strokes of blue, turquoise, violet and pink with the bare
// canvas showing between them. Colour is the subject, laid flat and unmixed, each stroke left as it fell. So the
// picture is painted again under itself, stroke by stroke, a little over the size he painted it.
//
// The red fruit tumble out from under the frame and roll off in curves over the floor, and each paints as it rolls: a
// ribbon three strokes wide, green (red's complement, and the green of his table), with the pink and lilac of the
// cloth to the right of the jug and a band of turquoise at the front, so that the four ribbons together are the table
// top; then the pink and orange corner. The fruit come to rest in a row. The pot drops onto its saucer, the jug lands
// beside it, lifts, tips and pours four blue strokes into the pot. The pot shivers, the stake shoots up, and then the
// geranium grows to the opening of Debussy's first Arabesque (1891), one leaf to a note: the two bars rise and fall,
// and so do the leaves, up the left side, over the top (where the first pink flower opens on the highest note) and
// down the right, twice. Behind every leaf a stroke of his wall is brushed into the air. The plant swells once and
// settles, the other flowers open in turn on the tune's slow notes, and for as long as you keep looking the piece
// goes on into its falling theme, a petal letting go on each beat of it. When you stop, it closes up from the top
// down: flowers, leaves, the strokes un-brushed, and everything hops back under the frame.
//
// "Arabesque" was Matisse's own word for the curling line of leaves he spent his life drawing, which is why this tune.
// Everything is a flat patch of paint with a loaded brush's edge (one draw call of cards, no solid models); the
// leaves, petals and strokes face you as paint does, the pot, jug and stake stand up as cut cards. With motion
// reduced nothing overshoots or shivers and the fruit turn at half speed; nothing in it flashes, and no sound is sudden.
//
// It leaves out the two small plaster figures in the picture entirely (they are his own studies of the nude, and no
// unclothed figure is modelled here), and the dish and the small red object that sit with them.
import * as THREE from 'three';
import { lifeFor, ease, ramp, clamp01 } from '../paintlife.js';
import { score, hump } from './stagecraft.js';
import { hz } from './tunes.js';

const TAU = Math.PI * 2, PI = Math.PI;
// The picture is 843 px wide here and 0.81 m on the wall; the plant below is built from it at a little over its own
// size. PX0, PY0: the foot of the pot in the picture.
const S = 0.0013, Z = S / 0.0011, PX0 = 322, PY0 = 850;
const U0 = (PX0 - 421.5) * S, OUT0 = 0.4;                      // where the pot stands: along the wall, out from it
const pu = x => U0 + (x - PX0) * S, ph = y => (PY0 - y) * S;
const STAKE_X = 383, STAKE = [0.19 * Z, ph(228)];
const POT = { w: 0.23 * Z, h: 0.225 * Z, t0: 0.5, t1: 1.0 }, H_DROP = 0.9;
const JUG = { u: pu(470), out: 0.3, w: 0.2 * Z, h: 0.245 * Z, t0: 0.75, t1: 1.2, lift: [1.25, 1.5], down: [1.95, 2.3] };
const POUR = { t0: 1.5, gap: 0.1, fly: 0.26, n: 4 };
const T_STAKE = [2.08, 2.42];
// Debussy, Deux arabesques, No. 1 (published 1891), Andantino con moto, in E. A triplet quaver is TRI.
const BEAT = 0.6, TRI = BEAT / 3, T_M = 2.4;
const BAR1 = ['C#4', 'E4', 'A4', 'C#5', 'E5', 'F#5', 'G#5', 'D#5', 'B4', 'G#4', 'D#4', 'B3'];
const BAR2 = ['A3', 'C#4', 'F#4', 'A4', 'C#5', 'D#5', 'E5', 'B4', 'G#4', 'E4', 'B3', 'G#3'];
const B3 = T_M + 8 * BEAT, B4 = B3 + 4 * BEAT, B5 = B4 + 4 * BEAT;
const RUN5 = ['B2', 'F#3', 'A3', 'C#4', 'D#4', 'F#4', 'A4', 'C#5', 'D#5', 'C#5', 'B4', 'A4'];
const RUN5_AT = k => (k < 10 ? k * TRI : k === 10 ? 9 * TRI + 0.24 : 9 * TRI + 0.52);      // (it slows at the end: rit.)
const B6 = B5 + 9 * TRI + 0.88, B7 = B6 + 4 * BEAT, B8 = B7 + 4 * BEAT;
// The leaves, from the picture: [x, y, radius (px), tone, star-shaped]. Tones: 0 dark emerald, 1 mid green, 2 yellow-
// green, 3 pale, 4 blue-green.
const LEAVES = [
  [375, 20, 28, 1], [435, 30, 32, 2], [400, 72, 30, 0], [440, 140, 28, 2], [488, 192, 40, 2], [375, 190, 44, 1],
  [285, 190, 44, 0], [190, 265, 40, 0], [137, 238, 28, 4], [105, 320, 32, 0], [170, 335, 40, 1], [245, 300, 40, 1],
  [320, 270, 44, 0], [425, 255, 42, 0], [525, 272, 36, 1], [588, 300, 42, 2, 1], [755, 252, 26, 1], [752, 322, 28, 0],
  [660, 300, 20, 2], [395, 345, 38, 2], [215, 400, 44, 0], [300, 425, 38, 1], [470, 395, 48, 1], [560, 380, 38, 4],
  [590, 450, 44, 1], [690, 415, 26, 0], [645, 432, 22, 2], [135, 495, 38, 3], [230, 520, 40, 0], [385, 505, 34, 2],
  [520, 482, 26, 1], [605, 515, 46, 2], [265, 590, 34, 1], [300, 645, 22, 1], [190, 552, 30, 1], [440, 497, 26, 3],
];
const TONES = [['#17633a', '#2a8a48'], ['#2f8f48', '#1a6a3a'], ['#7cb848', '#4a9c44'], ['#98cc84', '#5cac5c'], ['#257a64', '#185644']];
const HTOP = ph(20);                                             // how high the plant stands
// The flowers: [x, y, petals, ring (px), petal (px), colour, its light, when, [[dx, dy, size, colour] the dabs at its heart]]
const FLOWERS = [
  [385, 105, 5, 21, 16, '#ee8ea8', '#f8c8ce', T_M + 6 * TRI, [[0, 0, 11, '#5a3f9a'], [20, -2, 10, '#d83a2e']]],   // the top one, on the highest note
  [280, 370, 4, 25, 19, '#f08fa0', '#f9c4c6', T_M + 18 * TRI, [[0, 0, 10, '#e8607a']]],
  [255, 157, 3, 15, 13, '#f3a6b8', '#fbe4e2', B3 + BEAT, [[0, 0, 8, '#f7ead8']]],
  [690, 415, 2, 9, 12, '#d83a2e', '#ea6a5a', B3 + 2 * BEAT, []],
  [330, 265, 2, 9, 9, '#e6d24a', '#f1e58a', B3 + 3 * BEAT, []],
  [650, 300, 2, 9, 9, '#e6d24a', '#f1e58a', B4 + BEAT, []],
];
// More of the wall than the leaves bring with them: [x, y] (its pink and lilac to the right, pale turquoise above)
const WALL_MORE = [[705, 520], [735, 440], [770, 575], [690, 610], [600, 120], [685, 175], [560, 85], [520, 45], [62, 205], [70, 400], [200, 120]];
// The fruit: where each drops out (along the wall), its way over the floor [u, out], ending where it rests.
const FRUIT = [
  { us: -0.45, col: '#d9342c', way: [[-0.48, 0.2], [-0.57, 0.42], [-0.48, 0.62], [pu(170), OUT0 + 0.2 * Z]] },
  { us: -0.8, col: '#e2484c', way: [[-0.84, 0.22], [-0.98, 0.5], [-0.86, 0.84], [-0.52, 0.96], [-0.28, 0.86], [pu(258), OUT0 + 0.25 * Z]] },
  { us: 0.38, col: '#d02a26', way: [[0.4, 0.2], [0.5, 0.42], [0.4, 0.66], [0.14, 0.78], [pu(335), OUT0 + 0.26 * Z]] },
  { us: 0.72, col: '#e03e3a', way: [[0.76, 0.22], [0.96, 0.5], [0.9, 0.86], [0.56, 1.0], [0.24, 0.9], [pu(425), OUT0 + 0.225 * Z]] },
];
const GREENS = ['#14532f', '#1d6a3c', '#237a4a', '#1b5c48', '#2a8a52'];      // his table
const CLOTH = ['#dc9cb4', '#c494cc', '#e8aeb0', '#b888c0', '#7c443c'], FRONT = ['#2f9c8c', '#48b4a0', '#237a4a'];
const R_FRUIT = 0.05 * Z, T_FRUIT = 0.1, FRUIT_GAP = 0.12, FALL = 0.42, ROLL = 2.9, SLOW = 2.4, NT = 8;
const NTABLE = 10, NCORNER = 6, NWATER = POUR.n, NFALL = 8;
const K_DAB = 0, K_LEAF = 1, K_PETAL = 2, K_POT = 3, K_SAUCER = 4, K_JUG = 5, K_FRUIT = 6, K_STAKE = 7;
const FACING = 0, FLOOR = 1, UPRIGHT = 2;                          // how a card lies: facing you, flat on the floor, standing
const _h = (a, b = 0) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };
// a thing dropped from 1 that lands at 0 with one small hop
const drop = k => (k < 0.7 ? 1 - (k / 0.7) * (k / 0.7) : 0.05 * Math.sin(PI * (k - 0.7) / 0.3));

lifeFor(87045, {
  title: /^Still Life with Geranium/,
  word: 'bloom',
  stage: { out: 1.25, half: 1.2, cam: { dist: 2.7, side: 0.3, height: 0.8, fov: 60, lookU: 0, lookOut: 0.4, lookH: 1.3, floorOut: 1.15 } },
  wake: 2.4, ret: 2.2,

  build(L) {
    const P = L.pal, col = (h, a = 0.12) => P.near(h, a), rnd = L.rand;
    this.cH = L.cy - L.y; this.railH = L.rail - L.y;
    this.v = new THREE.Vector3(); this.w = new THREE.Vector3(); this.tg = new THREE.Vector3();
    const N = [], inst = (kind, seed, c, c2 = c) => { N.push({ kind, seed, c: col(c), c2: col(c2) }); return N.length - 1; };

    // ---------------------------------------------------------- what there is (one card each), back to front
    this.iSaucer = inst(K_SAUCER, 3.1, '#f0e4be', '#8e6aa0');
    this.iJugSh = inst(K_DAB, 5.3, '#6f5aa6', '#8f78c0');
    this.table = Array.from({ length: NTABLE }, (_, k) => {
      const a = (k + 0.3 * rnd()) / NTABLE * TAU, r = (0.2 + 0.13 * rnd()) * Z;
      return { I: inst(K_DAB, 10 + k * 3.7, GREENS[k % 5], GREENS[(k + 2) % 5]), u: U0 + 0.07 + Math.cos(a) * r * 1.25, out: OUT0 - 0.03 + Math.sin(a) * r * 0.8, roll: a + PI / 2 + (rnd() - 0.5) * 0.7, len: (0.15 + 0.07 * rnd()) * Z, t: 0.9 + 0.05 * k };
    });
    // the corner of the table, bottom right in the picture: a dark edge, a pink band, the orange beyond
    const cx = 0.6, cy = 1.14, dx = 0.48, dy = -0.52, dl = Math.hypot(dx, dy), nx = -dy / dl, ny = dx / dl, croll = Math.atan2(dy, dx);
    this.corner = [['#173f42', 0.27, -0.045, 0.3, 0.022], ['#173f42', 0.74, -0.042, 0.28, 0.02], ['#ee9a8c', 0.25, 0.0, 0.3, 0.05], ['#f0a898', 0.73, 0.004, 0.3, 0.05], ['#e0602f', 0.3, 0.07, 0.32, 0.07], ['#e8703c', 0.72, 0.075, 0.28, 0.07]]
      .map(([c, s, off, len, wd], k) => ({ I: inst(K_DAB, 40 + k * 2.9, c, c), u: cx + dx * s + nx * off * Z, out: cy + dy * s + ny * off * Z, roll: croll + (rnd() - 0.5) * 0.06, len: len * Z, wd: wd * Z, t: 3.0 + 0.1 * k }));
    // the fruit's trails, then the fruit
    this.fruit = FRUIT.map((F, i) => {
      const curve = new THREE.CatmullRomCurve3(F.way.map(p => new THREE.Vector3(p[0], 0, p[1])), false, 'centripetal');
      curve.arcLengthDivisions = 200; curve.updateArcLengths();
      const td = T_FRUIT + i * FRUIT_GAP, len = curve.getLength(), trail = [];
      // (a ribbon three strokes wide, as a broad brush leaves: together the four ribbons are the table top)
      for (let j = 0; j < NT; j++) {
        const s = (j + 0.6) / NT * 0.95, p = curve.getPointAt(s), tn = curve.getTangentAt(s), tj = td + FALL + ROLL * (1 - Math.pow(1 - s, 1 / SLOW));
        for (let w = -1; w <= 1; w++) {
          const side = w * 0.085 * Z + (rnd() - 0.5) * 0.04, along = (rnd() - 0.5) * 0.06, u = p.x - tn.z * side + tn.x * along, out = Math.max(0.1, p.z + tn.x * side + tn.z * along);
          // (green, but for the pink and lilac cloth to the right of the jug, and a band of turquoise at the front left)
          const set = u > 0.26 && u < 0.78 && out > 0.5 && out < 0.98 && rnd() < 0.75 ? CLOTH : u < -0.5 && out > 0.66 && rnd() < 0.6 ? FRONT : GREENS;
          trail.push({ I: inst(K_DAB, 60 + i * 31 + j * 3.3 + w * 0.7, set[Math.floor(rnd() * set.length * 0.999)], set[Math.floor(rnd() * set.length * 0.999)]), u, out,
            roll: Math.atan2(tn.z, tn.x) + (rnd() - 0.5) * 0.4, len: Math.min(0.26, len / NT * (0.85 + 0.25 * rnd())), wd: (0.07 + 0.03 * rnd()) * Z, s, t: tj + Math.abs(w) * 0.05 });
        }
      }
      return { ...F, i, curve, len, td, trail };
    });
    for (const F of this.fruit) F.I = inst(K_FRUIT, 7 + F.i * 5.1, F.col, '#ee7f84');
    // the wall behind the plant, a stroke for each leaf and a few more (made with the leaves, below)
    const wallCol = (x, y, r) => {
      if (x < 260 && y > 430) return [['#2c6f55', '#3f8f6f'], ['#1f5a4a', '#2c7f68'], ['#3f8f6f', '#5aa686']][Math.floor(r * 3)];
      if (x > 560 && y > 230) return [['#a88ad0', '#c79ad0'], ['#d892c0', '#e8aac4'], ['#e69ab4', '#f0bcc0'], ['#8a78c8', '#a88ad0']][Math.floor(r * 4)];
      if (x > 430 && y < 240) return [['#5cc0b8', '#8ad2c8'], ['#7accc4', '#b8dcc8'], ['#56a8c8', '#7cc4d0'], ['#e8c8a8', '#f0b8a8']][Math.floor(r * 4)];
      if (x > 430) return [['#3f7fbf', '#5b9ad0'], ['#3f9f9f', '#6fb6b0'], ['#4a78c8', '#7f9fdc']][Math.floor(r * 3)];
      return [['#5b8fd0', '#86aee0'], ['#3f6fc4', '#5b8fd0'], ['#86aee0', '#a8c4e6'], ['#4f7fcf', '#7a8fd6']][Math.floor(r * 4)];
    };
    const wallAt = (x, y, t, hn, k) => {
      const c = wallCol(x, y, rnd() * 0.999), vx = x - 400, vy = -(y - 330);
      return { I: inst(K_DAB, 200 + k * 1.9, c[0], c[1]), u: pu(x), h: Math.min(HTOP, Math.max(0.1, ph(y))), out: OUT0 - 0.15 * hn - 0.1 - 0.08 * rnd(), roll: Math.atan2(vx, -vy) + (rnd() - 0.5) * 0.9, len: (0.16 + 0.08 * rnd()) * Z, wd: (0.055 + 0.024 * rnd()) * Z, t, hn };
    };
    this.wall = [];
    // the leaves, each opening on its note: the left side climbs with the rising notes, the right falls with the falling
    const LV = LEAVES.map(([x, y, r, tone, star], i) => ({ x, y, r, tone, star: !!star, i }));
    const left = LV.filter(l => l.x < STAKE_X).sort((a, b) => b.y - a.y), right = LV.filter(l => l.x >= STAKE_X).sort((a, b) => a.y - b.y);
    const G = [[], [], [], []]; left.forEach((l, i) => G[i % 2 ? 2 : 0].push(l)); right.forEach((l, i) => G[i % 2 ? 3 : 1].push(l));
    const first = [0, 7, 12, 19], count = [7, 5, 7, 5];
    G.forEach((g, gi) => { const seen = {}; g.forEach((l, j) => { const n = Math.floor(j * count[gi] / g.length); l.t = T_M + (first[gi] + n) * TRI + (seen[n] || 0) * 0.085; seen[n] = (seen[n] || 0) + 1; }); });
    for (const l of LV) {
      const hn = clamp01(ph(l.y) / HTOP), ay = Math.max(228, Math.min(690, l.y + 60)), ox = l.x - 400, oy = l.y - 330, ol = Math.hypot(ox, oy) || 1, push = 34 + 30 * rnd();
      this.wall.push(wallAt(l.x + ox / ol * push + (rnd() - 0.5) * 50, l.y + oy / ol * push + (rnd() - 0.5) * 50, l.t - 0.1, hn, l.i));
      l.hn = hn; l.roll = Math.atan2(ay - l.y, l.x - STAKE_X);
    }
    WALL_MORE.forEach(([x, y], k) => this.wall.push(wallAt(x, y, B3 + k * 0.4, clamp01(ph(y) / HTOP), 50 + k)));
    // (cards later in the list are nearer: the stems and the stake, the pot and the jug, then the leaves and flowers)
    this.stems = [[345, 392, '#3a2a5a', 1.25, 0.1], [300, 468, '#6b4638', 0.9, 0.085], [262, 446, '#8a4a3a', 2.0, 0.07]].map(([x, y, c, roll, len], k) => ({ I: inst(K_DAB, 90 + k * 4.3, c, c), u: pu(x), h: ph(y), roll, len: len * Z, t: T_M + 0.5 + k * 0.45 }));
    this.iStake = inst(K_STAKE, 4.7, '#4a2238', '#8a78b8');
    this.iPot = inst(K_POT, 2.3, '#da7c70', '#f0a69a');
    this.iJug = inst(K_JUG, 6.1, '#e8edf0', '#1f3f8f');
    this.water = Array.from({ length: NWATER }, (_, k) => inst(K_DAB, 120 + k * 3.3, ['#3f6fc4', '#5b8fd0', '#3f7fbf', '#86aee0'][k], '#a8c4e6'));
    this.leaves = LV.map(l => ({ ...l, I: inst(K_LEAF, (l.star ? 60 : 1) + _h(l.i, 3) * 40, TONES[l.tone][0], TONES[l.tone][1]),
      u: pu(l.x), h: ph(l.y), out: OUT0 - 0.15 * l.hn + (_h(l.i, 7) - 0.5) * 0.2 * (1 - 0.8 * l.hn), rad: l.r * S * 1.6, ph: _h(l.i, 11) * TAU }));
    this.flowers = FLOWERS.map(([x, y, n, ring, pr, c, c2, t, heart], f) => ({ u: pu(x), h: ph(y), out: OUT0 - 0.15 * clamp01(ph(y) / HTOP) + 0.05 + 0.1 * (1 - clamp01(ph(y) / HTOP)), t, ring: ring * S * 1.7, pr: pr * S * 1.7, a0: _h(f, 5) * TAU, col: c,
      petals: Array.from({ length: n }, (_, j) => inst(K_PETAL, 140 + f * 9 + j * 2.1, c, c2)),
      heart: heart.map(([dx2, dy2, sz, hc], j) => ({ I: inst(K_PETAL, 170 + f * 5 + j, hc, hc), du: dx2 * S * 1.7, dh: -dy2 * S * 1.7, sz: sz * S * 1.7 })) }));
    this.falls = Array.from({ length: NFALL }, (_, j) => inst(K_PETAL, 180 + j * 3.7, ['#ee8ea8', '#f08fa0', '#f3a6b8'][j % 3], '#f9cfd2'));
    const NS = this.NS = N.length;

    // ---------------------------------------------------------- one mesh of cards
    const base = new THREE.PlaneGeometry(1, 1), geo = new THREE.InstancedBufferGeometry();
    geo.index = base.index; geo.setAttribute('position', base.attributes.position); geo.instanceCount = NS;
    const dyn = k => { const a = new THREE.InstancedBufferAttribute(new Float32Array(NS * k), k); a.setUsage(THREE.DynamicDrawUsage); return a; };
    this.aPos = dyn(4); this.aSize = dyn(4); this.aFx = dyn(2);
    const aKind = new THREE.InstancedBufferAttribute(new Float32Array(NS * 2), 2), aCol = new THREE.InstancedBufferAttribute(new Float32Array(NS * 3), 3), aCol2 = new THREE.InstancedBufferAttribute(new Float32Array(NS * 3), 3);
    N.forEach((o, i) => { aKind.setXY(i, o.kind, o.seed); aCol.setXYZ(i, o.c.r * 0.95, o.c.g * 0.95, o.c.b * 0.95); aCol2.setXYZ(i, o.c2.r * 0.95, o.c2.g * 0.95, o.c2.b * 0.95); });
    for (const [k, a] of [['aPos', this.aPos], ['aSize', this.aSize], ['aFx', this.aFx], ['aKind', aKind], ['aCol', aCol], ['aCol2', aCol2]]) geo.setAttribute(k, a);
    const v3 = h => { const c = col(h); return new THREE.Vector3(c.r, c.g, c.b).multiplyScalar(0.95); };
    const U = { uTan: { value: new THREE.Vector3(L.tx, 0, L.tz) }, uOut: { value: new THREE.Vector3(L.nx, 0, L.nz) },
      uCream: { value: v3('#f0dc9c') }, uLilac: { value: v3('#a584c0') }, uDark: { value: v3('#22332c') }, uGreen: { value: v3('#3f8a4a') }, uBrown: { value: v3('#7a4630') },
      uOrange: { value: v3('#e0764a') }, uSky: { value: v3('#4f86c8') }, uTeal: { value: v3('#8fc4bc') }, uCrimson: { value: v3('#9c2438') }, uInk: { value: v3('#1d4a4e') } };
    const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, fog: false });
    mat.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, U);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', `#include <common>
attribute vec4 aPos, aSize; attribute vec2 aKind, aFx; attribute vec3 aCol, aCol2; uniform vec3 uTan, uOut;
varying vec2 vQ, vK, vFx; varying vec3 vCol, vCol2; varying float vAsp;`)
        .replace('#include <project_vertex>', `vec4 mvPosition;
  { float c = cos(aPos.w), s = sin(aPos.w); vec2 p = position.xy * aSize.xy; p = vec2(c * p.x - s * p.y, s * p.x + c * p.y);
    if (aSize.z < 0.5) { mvPosition = modelViewMatrix * vec4(aPos.xyz, 1.0); mvPosition.xy += p; }                         // facing you
    else if (aSize.z < 1.5) mvPosition = modelViewMatrix * vec4(aPos.xyz + uTan * p.x + uOut * p.y, 1.0);                  // flat on the floor
    else { vec2 tc = normalize(cameraPosition.xz - aPos.xz + vec2(1.0e-5)); mvPosition = modelViewMatrix * vec4(aPos.xyz + vec3(tc.y, 0.0, -tc.x) * p.x + vec3(0.0, p.y, 0.0), 1.0); } }      // standing, turned to you
  gl_Position = projectionMatrix * mvPosition;
  vQ = position.xy * 2.0; vK = aKind; vFx = aFx; vCol = aCol; vCol2 = aCol2; vAsp = aSize.x / max(aSize.y, 1.0e-4);`);
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
varying vec2 vQ, vK, vFx; varying vec3 vCol, vCol2; varying float vAsp;
uniform vec3 uCream, uLilac, uDark, uGreen, uBrown, uOrange, uSky, uTeal, uCrimson, uInk;
float mH(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float mN(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mH(i), mH(i + vec2(1.0, 0.0)), f.x), mix(mH(i + vec2(0.0, 1.0)), mH(i + vec2(1.0, 1.0)), f.x), f.y); }
vec2 mR(vec2 v, float a) { float c = cos(a), s = sin(a); return vec2(c * v.x - s * v.y, s * v.x + c * v.y); }`)
        .replace('#include <color_fragment>', `#include <color_fragment>
  {
    vec2 q = vQ; int T = int(vK.x + 0.5); float sd = vK.y, asp = vAsp;
    float r = length(q), a = atan(q.y, q.x), d = 1.0; vec3 c = vCol;
    if (T == 0) {
      // one stroke of a loaded brush, lying along x: full where it starts, running dry and ragged where it ends
      vec2 s = vec2(q.x * asp, q.y - 0.2 * sin(q.x * asp * 0.9 + sd * 5.0));
      float cap = max(asp - 0.72, 0.0), br = mN(vec2(s.x * 1.1 + sd * 3.0, s.y * 7.0 + sd));
      d = length(vec2(max(abs(s.x) - cap, 0.0), s.y)) - 0.72;
      d += 0.34 * (br - 0.5) * smoothstep(cap - 0.7, cap + 0.5, abs(s.x)) + 0.09 * (mN(s * 5.0 + sd) - 0.5);
      // (the dry gaps close up where they would be finer than a pixel, far off or seen along the floor)
      if (br > 0.87 - 0.27 * smoothstep(-0.2, 1.0, q.x) + 2.0 * smoothstep(0.25, 0.9, fwidth(s.y) * 7.0)) d = 1.0;
      c = mix(vCol, vCol2, smoothstep(0.5, 0.6, mN(vec2(s.x * 0.8 + sd, s.y * 3.2 + sd * 2.0)))) * (0.88 + 0.24 * br);
      if (q.x > vFx.x * 2.3 - 1.15 + 0.14 * (br - 0.5)) d = 1.0;                       // (being laid, from its start)
    } else if (T == 1) {
      // a geranium leaf: round and scalloped (or a five-pointed one), notched where its stalk comes in, in two greens
      bool star = sd > 50.0; float n = star ? 5.0 : 6.0, amp = star ? 0.15 : 0.035;
      float lump = mN(vec2(cos(a), sin(a)) * 1.5 + sd * 3.0);                           // (no two alike)
      float rad = 0.62 + 0.3 * lump - amp * (1.0 - cos(n * a + sd)) - 0.3 * exp(-pow((3.14159 - abs(a)) * 2.6, 2.0));
      d = r - rad + 0.09 * (mN(q * 5.0 + sd) - 0.5);
      vec2 sq = mR(q, sd * 2.3); float br = mN(vec2(sq.x * 1.6 + sd, sq.y * 12.0));
      c = mix(vCol, vCol2, smoothstep(0.5, 0.56, mN(vec2(sq.x * 0.9, sq.y * 2.8) + sd * 7.0))) * (0.88 + 0.24 * br);
      if (br > 0.885 + 2.0 * smoothstep(0.25, 0.9, fwidth(sq.y) * 12.0)) d = 1.0;       // (the bare canvas between the strokes)
    } else if (T == 2) {
      d = length(q * vec2(1.0, 1.18)) - (0.8 + 0.08 * sin(3.0 * a + sd)) + 0.1 * (mN(q * 4.0 + sd) - 0.5);
      c = (length(q - vec2(0.12, 0.1)) < 0.3 + 0.24 * mN(q * 3.0 + sd) ? vCol2 : vCol) * (0.92 + 0.16 * mN(mR(q, sd) * vec2(2.0, 9.0) + sd));
    } else if (T == 3) {
      // the clay pot, seen a little from above: the earth, the rim, the body in upright strokes (lilac in the shade)
      float y = q.y, hw = mix(0.58, 0.84, (y + 1.0) * 0.5) + 0.035 * (mN(vec2(y * 3.0, sd)) - 0.5);
      float yb = -0.9 - 0.08 * sqrt(max(0.0, 1.0 - pow(q.x / 0.6, 2.0)));
      vec2 e1 = (q - vec2(0.0, 0.82)) / vec2(0.95, 0.16), e0 = (q - vec2(0.0, 0.6)) / vec2(0.95, 0.16), es = (q - vec2(0.0, 0.83)) / vec2(0.8, 0.105);
      bool body = y > yb && y <= 0.6 && abs(q.x) < hw, rim = dot(e1, e1) < 1.0 || dot(e0, e0) < 1.0 || (y > 0.6 && y < 0.82 && abs(q.x) < 0.95), soil = dot(es, es) < 1.0;
      d = (body || rim) ? -1.0 : 1.0;
      float xn = q.x / hw, w1 = mN(vec2(y * 2.5 + sd, 1.0)), w2 = mN(vec2(y * 2.1 + sd, 7.0));
      c = xn < -0.42 + 0.3 * (w1 - 0.5) ? vCol2 : xn > 0.38 + 0.3 * (w2 - 0.5) ? mix(vCol, uOrange, 0.5) : vCol;
      if (y < -0.45 + 0.5 * (mN(vec2(q.x * 2.2 + sd, 3.0)) - 0.5)) c = uLilac;         // (lilac towards its foot)
      if (abs(xn + 0.12) < 0.1 && y > -0.3 && mN(vec2(q.x * 3.0, y * 1.6 + sd)) > 0.5) c = mix(vCol2, uCream, 0.4);
      if (body && q.x < -hw + 0.08 && mN(vec2(y * 3.5, sd + 9.0)) > 0.42) c = uInk;
      if (rim) c = q.x < -0.5 + 0.2 * (w1 - 0.5) ? mix(uCream, uLilac, 0.6) : mix(uCream, vCol2, 0.35 * step(0.55, w2));
      if (soil) c = mix(uDark, uGreen * 0.55, step(0.62, mN(q * vec2(4.0, 14.0) + sd)));
      c *= 0.9 + 0.2 * mN(vec2(q.x * 11.0, y * 1.3) + sd);
    } else if (T == 4) {
      d = r - (0.9 + 0.05 * (mN(vec2(a * 3.0, sd)) - 0.5));
      c = r < 0.6 ? mix(vCol, uLilac, 0.55) : vCol;
      if (q.y > 0.4 && r > 0.7) c = vCol2;                                             // (its shadow, to the front)
      c *= 0.9 + 0.2 * mN(vec2(a * 5.0, r * 6.0) + sd);
    } else if (T == 5) {
      // the jug: white, dabbed with two blues, a blue band at the neck, its lip to the left and its handle to the right
      vec2 b = (q - vec2(-0.12, -0.3)) / vec2(0.66, 0.62), mo = (q - vec2(-0.14, 0.78)) / vec2(0.56, 0.13), sp = (q - vec2(-0.6, 0.84)) / vec2(0.22, 0.1), hd = (q - vec2(0.5, 0.1)) / vec2(0.42, 0.52), ft = (q - vec2(-0.12, -0.88)) / vec2(0.42, 0.1);
      float hl = length(hd);
      bool body = dot(b, b) < 1.0, neck = q.y > -0.1 && q.y < 0.78 && abs(q.x + 0.12) < 0.4 + 0.11 * (q.y + 0.1), mouth = dot(mo, mo) < 1.0 || dot(sp, sp) < 1.0;
      bool handle = hl < 1.0 && hl > 0.6 && q.x > 0.36, foot = dot(ft, ft) < 1.0 || (q.y < -0.8 && q.y > -0.88 && abs(q.x + 0.12) < 0.42);
      d = (body || neck || mouth || handle || foot) ? -1.0 : 1.0;
      float n1 = mN(q * vec2(4.5, 5.5) + sd), n2 = mN(q * vec2(6.0, 4.0) + sd + 7.0);
      c = vCol;
      if (body && q.y < 0.02) { if (n1 > 0.56) c = vCol2; else if (n2 > 0.62) c = uSky; else if (n2 < 0.24) c = uTeal; }
      if (body && b.x < -0.55 + 0.25 * (n2 - 0.5)) c = mix(c, uLilac, 0.55);
      if (neck && !body && q.y > 0.12 && q.y < 0.44 && n1 > 0.3) c = vCol2;
      if (handle && !body && !neck) c = hl > 0.86 ? uSky : vCol;
      if (mouth) c = q.x < -0.42 ? vCol2 : mix(vCol, uLilac, 0.4 * step(0.0, mo.y));
      if (foot && !body) c = q.y < -0.9 ? uSky : vCol;
      c *= 0.9 + 0.2 * mN(mR(q, 0.5) * vec2(2.0, 10.0) + sd);
    } else if (T == 6) {
      // a red fruit with its green top: a crescent of crimson in the shade, a dab of pink in the light
      d = length(q * vec2(1.0, 1.1)) - 0.8 + 0.07 * (mN(q * 4.0 + sd) - 0.5);
      vec2 cx = (q - vec2(0.04, 0.74)) / vec2(0.36, 0.2), li = mR(q - vec2(0.12, 0.16), 0.5) / vec2(0.6, 0.26);
      if (length(q - vec2(0.3, 0.34)) > 0.9 + 0.1 * (mN(q * 3.0 + sd) - 0.5)) c = uCrimson;
      if (dot(li, li) < 1.0 + 0.7 * (mN(q * 4.0 + sd) - 0.5)) c = vCol2;
      c *= 0.9 + 0.2 * mN(mR(q, sd) * vec2(2.0, 10.0) + sd);
      if (dot(cx, cx) < 1.0) { c = uGreen; d = -1.0; }
    } else {
      // the stake: a thin upright line, brown at the foot, dark in the middle, lilac at the top, broken here and there
      d = abs(q.x - 0.3 * sin(q.y * 2.5 + sd)) - (0.5 + 0.3 * (mN(vec2(q.y * 18.0, sd)) - 0.5));
      if (q.y > vFx.x * 2.0 - 1.0 || mN(vec2(q.y * 5.0 + sd, 1.0)) > 0.86) d = 1.0;
      c = q.y < -0.3 + 0.1 * mN(vec2(q.x * 3.0, sd)) ? uBrown : q.y < 0.28 ? vCol : vCol2;
    }
    d += vFx.y * (0.15 + 1.4 * mN(q * 4.0 + sd * 2.0));                               // (going: it breaks up in patches)
    if (d > 0.0) discard;
    diffuseColor.rgb = c;
  }`);
    };
    mat.customProgramCacheKey = () => 'matisse-geranium';
    this.cards = L.add(new THREE.Mesh(geo, mat)); this.cards.name = 'cards';
    this.floorY = L.y + 0.012;

    // ---------------------------------------------------------- the sound, on the show's clock
    const sc = this.score = score(L);
    const piano = (t, n, d, vol = 0.03) => sc.note(t, hz(n), d, { vol, type: 'triangle', attack: 0.012, over: 2, overVol: 0.2 });
    const trip = (t, a, vol = 0.018) => a.forEach((n, k) => n && piano(t + k * TRI, n, k === 2 ? 0.9 : 0.45, vol));
    for (const F of this.fruit) sc.note(F.td + FALL, 150 - 9 * F.i, 0.12, { vol: 0.028, type: 'sine', to: 92, attack: 0.004 });
    sc.hit(0.85, { d: 0.16, vol: 0.028, lp: 320, attack: 0.012 }).note(0.85, 98, 0.2, { vol: 0.03, type: 'sine', to: 70, attack: 0.01 });      // the pot lands
    sc.note(1.065, 1318, 0.25, { vol: 0.011, type: 'sine', attack: 0.003 }).note(1.065, 1975, 0.18, { vol: 0.006, type: 'sine', attack: 0.003 });      // the jug
    sc.hit(POUR.t0, { d: 0.65, vol: 0.006, bp: 2500, q: 0.8, attack: 0.12 });
    for (let k = 0; k < POUR.n; k++) sc.note(POUR.t0 + k * POUR.gap + POUR.fly, 700 + 90 * k, 0.09, { vol: 0.016, type: 'sine', to: 1300 + 120 * k, attack: 0.004 });
    sc.note(T_STAKE[0], 196, 0.34, { vol: 0.014, type: 'sine', to: 392, attack: 0.04 });
    // bars 1 and 2: the two arcs, a leaf to a note
    [...BAR1, ...BAR2].forEach((n, k) => piano(T_M + k * TRI, n, 0.9, 0.03));
    // bars 3 and 4: the slow tune over rocking triplets; a flower to each of its notes
    trip(B3, ['F#3', 'A3', 'C#4']); trip(B3 + BEAT, [0, 'F#4', 'A4']); trip(B3 + 2 * BEAT, ['E3', 'A3', 'C#4']); trip(B3 + 3 * BEAT, [0, 'F#4', 'A4']);
    trip(B4, ['D#3', 'A3', 'C#4']); trip(B4 + BEAT, [0, 'F#4', 'A4']); trip(B4 + 2 * BEAT, ['C#3', 'A3', 'E4']); trip(B4 + 3 * BEAT, [0, 'A4', 'C#5']);
    [[B3 + BEAT, 'C#5', 1], [B3 + 2 * BEAT, 'F#5', 1], [B3 + 3 * BEAT, 'C#5', 2], [B4 + BEAT, 'C#5', 1], [B4 + 2 * BEAT, 'F#5', 1], [B4 + 3 * BEAT, 'A5', 2], [B5 + BEAT, 'A5', 2.4]].forEach(([t, n, b]) => piano(t, n, b * BEAT * 1.1, 0.036));
    // bar 5: the long run up, slowing; then the falling theme (bars 6 and 7) over its bass, and the close
    RUN5.forEach((n, k) => piano(B5 + RUN5_AT(k), n, 0.7, 0.02));
    piano(B5 + RUN5_AT(10), 'G#5', 0.4, 0.03); piano(B5 + RUN5_AT(11), 'F#5', 0.5, 0.03);
    ['E2', 'B2', 'E3', 'G#3', 'B3', 'G#3', 'E3', 'B2'].forEach((n, k) => piano(B6 + k * BEAT / 2, n, 0.8, 0.016));
    ['E5', 'F#5', 'C#5', 'E5', 'B4', 'C#5', 'G#4', 'B4', 'F#4'].forEach((n, k) => piano(B6 + BEAT + k * TRI, n, 0.7, 0.032));
    ['E2', 'C#3', 'E3', 'G#3', 'C#4', 'G#3', 'E3', 'B2'].forEach((n, k) => piano(B7 + k * BEAT / 2, n, 0.8, 0.016));
    ['G#4', 'E4', 'G#4'].forEach((n, k) => piano(B7 + k * TRI, n, 0.6, 0.032));
    piano(B7 + BEAT, 'D#4', 2 * BEAT, 0.032); piano(B7 + 3 * BEAT, 'C#4', BEAT, 0.03);
    piano(B8, 'B3', 2.4, 0.03); ['E2', 'B2', 'E3', 'G#3'].forEach((n, k) => piano(B8 + k * BEAT / 2, n, 2.2, 0.016));
    sc.done();
    // a petal lets go: after the last flower, then one to each beat of the falling theme, then now and then
    this.fallAt = [B4 + 2 * BEAT, B4 + 3 * BEAT, B6 + BEAT, B6 + 2 * BEAT, B6 + 3 * BEAT, B7, B7 + BEAT];
    this.hide();
  },
  fallTime(n) { const F = this.fallAt, m = F.length - 1; return n <= m ? F[n] : F[m] + 4.2 + (n - m - 1) * 3.4; },

  hide() { this.aSize.array.fill(0); this.aSize.needsUpdate = true; },
  start(L, resumed) { this.T = L.t; this.score.from(L.t); },
  back(L) {
    this.bT = this.T || 0;
    if (!L.quiet && L.voice().ctx) ['G#5', 'D#5', 'B4', 'G#4'].forEach((n, i) => L.voice().note(hz(n), 0.5, { at: 0.1 + i * 0.16, vol: 0.016, type: 'triangle', attack: 0.012 }));
  },
  end(L) { this.hide(); },
  reset(L) { this.hide(); this.T = 0; },

  // a card: where (a world point), turned, its size, how it lies, how much of it is laid (strokes, the stake), how far gone
  put(i, p, roll, sx, sy, mode, grow = 1, erode = 0) {
    const A = this.aPos.array, Z = this.aSize.array, F = this.aFx.array;
    A[i * 4] = p.x; A[i * 4 + 1] = p.y; A[i * 4 + 2] = p.z; A[i * 4 + 3] = roll; Z[i * 4] = sx; Z[i * 4 + 1] = sy; Z[i * 4 + 2] = mode; F[i * 2] = grow; F[i * 2 + 1] = erode;
  },
  none(i) { this.aSize.array[i * 4] = this.aSize.array[i * 4 + 1] = 0; },
  at(L, u, h, out, into = this.v) { return L.at(u, h - this.cH, out, into); },
  // going back: how far a thing has gone, between these two moments of the Return (0: not going, or not yet)
  gone(a, b) { return this.R < 0 ? 0 : ease.inOut(ramp(this.R, a, b)); },
  // a stroke on the floor
  lay(L, o, wd, grow) {
    if (grow <= 0.001) return this.none(o.I);
    L.floor(o.u, o.out, this.v); this.v.y = this.floorY + (o.I % 7) * 0.0004;
    this.put(o.I, this.v, o.roll, o.len, wd, FLOOR, grow);
  },
  // the jug at show-time T (and going back): where its middle is, how far it has tipped, its size
  jug(L, T, g, o) {
    const k = ramp(T, JUG.t0, JUG.t1), pour = ease.inOut(ramp(T, JUG.lift[0], JUG.lift[1])) * (1 - ease.inOut(ramp(T, JUG.down[0], JUG.down[1])));
    o.s = T < JUG.t0 ? 0 : ease.out(Math.min(1, k * 2)) * (1 - ease.in(g));
    o.u = JUG.u - 0.005 * pour; o.out = 0.03 + (JUG.out - 0.03) * ease.out(Math.min(1, k / 0.7)) + (OUT0 + 0.015 - JUG.out) * pour;
    o.h = H_DROP * drop(k) + 0.2 * Z * pour; o.roll = 0.85 * pour + 0.3 * (1 - Math.min(1, k / 0.7));
    if (g > 0) { o.h += (H_DROP - o.h) * g + 0.22 * Math.sin(PI * g); o.out += (0.03 - o.out) * g; o.roll += 0.5 * g; }
    return o;
  },

  update(L, dt) {
    const back = L.phase === 'return', T = back ? this.bT : (this.T = L.t), R = back ? L.ret : 0, calm = L.calm;
    if (!back) this.score.play(T);
    this.R = back ? R : -1;
    const v = this.v, pop = calm ? ease.out : ease.outBack;

    // ---- the saucer slides out, and the pot drops onto it
    {
      const k = ramp(T, 0.35, 0.8), g = this.gone(0.62, 0.92), s = (T < 0.35 ? 0 : pop(k)) * (1 - ease.in(g));
      if (s <= 0.01) this.none(this.iSaucer);
      else { L.floor(U0, 0.04 + (OUT0 - 0.04) * ease.out(k) * (1 - g), v); v.y = this.floorY + 0.004; this.put(this.iSaucer, v, 0, 0.3 * Z * s, 0.2 * Z * s, FLOOR); }
      const kp = ramp(T, POT.t0, POT.t1), gp = this.gone(0.58, 0.95);
      let sp = T < POT.t0 ? 0 : ease.out(Math.min(1, kp * 2)) * (1 - ease.in(gp));
      if (sp <= 0.01) this.none(this.iPot);
      else {
        // it shivers as the water goes in, and stretches as the stake comes up
        const wob = calm ? 0 : 0.055 * Math.sin((T - 1.76) * 21) * hump(T, 1.76, 2.2) + 0.07 * hump(T, 2.05, 2.5) * Math.sin((T - 2.05) * 14);
        let h = H_DROP * drop(kp), out = 0.03 + (OUT0 - 0.03) * ease.out(Math.min(1, kp / 0.7));
        if (gp > 0) { h += (H_DROP - h) * gp + 0.2 * Math.sin(PI * gp); out += (0.03 - out) * gp; }
        const sy = POT.h * sp * (1 + wob), sx = POT.w * sp * (1 - wob * 0.6);
        this.put(this.iPot, this.at(L, U0, h + sy / 2, out), 0.3 * (1 - Math.min(1, kp / 0.7)) - 0.4 * gp, sx, sy, UPRIGHT);
      }
    }
    // ---- the jug lands, lifts, tips and pours; the water is four blue strokes
    {
      const o = this.jug(L, T, this.gone(0.5, 0.88), this.jo || (this.jo = {}));
      if (o.s <= 0.01) { this.none(this.iJug); this.none(this.iJugSh); }
      else {
        this.put(this.iJug, this.at(L, o.u, o.h + JUG.h * o.s / 2, o.out), o.roll, JUG.w * o.s, JUG.h * o.s, UPRIGHT);
        const sh = ramp(T, JUG.t1 - 0.1, JUG.t1 + 0.15) * (1 - this.gone(0.45, 0.6));
        if (sh <= 0.01) this.none(this.iJugSh); else { L.floor(JUG.u + 0.03, JUG.out + 0.03, v); v.y = this.floorY + 0.003; this.put(this.iJugSh, v, 0.15, 0.24 * Z, 0.085 * Z, FLOOR, sh); }
      }
      for (let k = 0; k < NWATER; k++) {
        const age = T - (POUR.t0 + k * POUR.gap), I = this.water[k];
        if (back || age <= 0 || age >= POUR.fly) { this.none(I); continue; }
        // from the lip (the jug's top left corner, tipped) down into the earth of the pot
        const q = age / POUR.fly, c = Math.cos(o.roll), s = Math.sin(o.roll), lx = -0.074 * Z, ly = 0.103 * Z;
        const u0 = o.u + lx * c - ly * s, h0 = o.h + JUG.h / 2 + lx * s + ly * c, u1 = U0 + 0.014 * (k - 1.5), h1 = POT.h * 0.93;
        this.put(I, this.at(L, u0 + (u1 - u0) * q, h0 + (h1 - h0) * q * q + 0.02 * Math.sin(PI * q), OUT0 + 0.012), -PI / 2 + 0.5 * (1 - q) * (u1 < u0 ? -1 : 1), 0.08 * Z, 0.03 * Z, FACING);
      }
    }
    // ---- the table: green strokes round the pot, and the corner in pink and orange
    for (const o of this.table) this.lay(L, o, 0.085 * Z, ramp(T, o.t, o.t + 0.25) * (1 - this.gone(0.4, 0.62)));
    for (const o of this.corner) this.lay(L, o, o.wd, ramp(T, o.t, o.t + 0.25) * (1 - this.gone(0.3, 0.55)));
    // ---- the fruit: out from under the frame, a bounce, a long curl over the floor, and to rest; each paints as it rolls
    for (const F of this.fruit) {
      const a = T - F.td, g = this.gone(0.42 + F.i * 0.04, 0.8 + F.i * 0.04);
      for (const o of F.trail) this.lay(L, o, o.wd, ramp(T, o.t - 0.06, o.t + 0.2) * (1 - this.gone(0.05 + 0.3 * (1 - o.s), 0.3 + 0.3 * (1 - o.s))));
      if (a <= 0) { this.none(F.I); continue; }
      let u, out, h, s = 1, roll;
      if (a < FALL) {
        const k = a / FALL; u = F.us + (F.way[0][0] - F.us) * k; out = 0.03 + (F.way[0][1] - 0.03) * k; h = R_FRUIT + (this.railH - 0.12 - R_FRUIT) * (1 - k * k); s = Math.min(1, k * 2.5); roll = -k * 2;
      } else {
        const b = a - FALL, q = clamp01(b / ROLL), sl = 1 - Math.pow(1 - q, SLOW);
        F.curve.getPointAt(sl, this.w); u = this.w.x; out = this.w.z;
        h = R_FRUIT + 0.11 * Math.abs(Math.sin(b * 8.5)) * Math.exp(-b * 3.2);
        roll = -2 - ((u - F.way[0][0]) / R_FRUIT + sl * F.len / R_FRUIT * 0.3) * (calm ? 0.5 : 1);
      }
      if (g > 0) { const e = ease.inOut(g); u += (F.us * 0.6 - u) * e; out += (0.03 - out) * e; h += (this.railH - 0.14 - h) * e + 0.25 * Math.sin(PI * e); s *= 1 - ease.in(g); roll += 3 * e; }
      if (s <= 0.01) this.none(F.I); else this.put(F.I, this.at(L, u, h, out), roll, 2.3 * R_FRUIT * s, 2.3 * R_FRUIT * s, FACING);
    }
    // ---- the stake comes up out of the pot, and the dark stalks
    {
      const g = ease.out(ramp(T, T_STAKE[0], T_STAKE[1])) * (1 - this.gone(0.5, 0.72));
      if (g <= 0.005) this.none(this.iStake); else this.put(this.iStake, this.at(L, pu(STAKE_X), (STAKE[0] + STAKE[1]) / 2, OUT0 + 0.004), 0, 0.02 * Z, STAKE[1] - STAKE[0], UPRIGHT, g);
      for (const o of this.stems) { const k = ramp(T, o.t, o.t + 0.25) * (1 - this.gone(0.3, 0.5)); if (k <= 0.005) this.none(o.I); else this.put(o.I, this.at(L, o.u, o.h, OUT0 - 0.08), o.roll, o.len, 0.036 * Z, FACING, k); }
    }
    // ---- the wall: a stroke brushed into the air behind each leaf as it opens
    for (const o of this.wall) {
      const g0 = 0.08 + 0.42 * (1 - o.hn), k = ramp(T, o.t, o.t + 0.24) * (1 - this.gone(g0, g0 + 0.3));
      if (k <= 0.005) this.none(o.I); else this.put(o.I, this.at(L, o.u, o.h, o.out), o.roll, o.len, o.wd, FACING, k);
    }
    // ---- the leaves: each opens from its stalk on its note, and they stir a little; going, they close from the top down
    // (when the two arcs are done the whole plant swells once and settles, and again on the tune's long high note)
    const breath = 1 + 1.6 * hump(T, B4 + 3 * BEAT, B4 + 3 * BEAT + 2.2) + 1.2 * hump(T, B3, B3 + 1.8), swell = 1 + 0.07 * hump(T, B3 - 0.15, B3 + 0.9);
    for (const l of this.leaves) {
      const k = (T - l.t) / 0.34, g0 = 0.04 + 0.42 * (1 - l.hn);
      const s = k <= 0 ? 0 : pop(k) * (1 - ease.in(this.gone(g0, g0 + 0.26)));
      if (s <= 0.01) { this.none(l.I); continue; }
      const sw = Math.min(1, Math.max(0, k - 0.6)) * breath, roll = l.roll + 0.9 * (1 - Math.min(1, s)) + 0.06 * Math.sin(T * 0.8 + l.ph) * sw, back0 = l.rad * 0.9 * (1 - Math.min(1, s));
      const u = l.u - Math.cos(l.roll) * back0 + 0.006 * Math.sin(T * 1.1 + l.ph) * sw, h = l.h - Math.sin(l.roll) * back0 + 0.004 * Math.sin(T * 0.9 + l.ph * 2) * sw;
      this.put(l.I, this.at(L, u, h, l.out), roll, 2 * l.rad * s * swell, 2 * l.rad * s * swell, FACING);
    }
    // ---- the flowers: the petals open outwards from the heart, one after another
    for (const f of this.flowers) {
      const fold = 1 - this.gone(0, 0.22);
      for (let j = 0; j < f.petals.length; j++) {
        const I = f.petals[j], k = (T - f.t - j * 0.06) / 0.34, s = k <= 0 ? 0 : pop(k) * fold;
        if (s <= 0.01) { this.none(I); continue; }
        const a = f.a0 + j / f.petals.length * TAU + 0.05 * Math.sin(T * 0.7 + j), rr = f.ring * Math.min(1.1, s);
        this.put(I, this.at(L, f.u + Math.cos(a) * rr, f.h + Math.sin(a) * rr, f.out), a, 2 * f.pr * s, 2 * f.pr * s * 0.9, FACING);
      }
      for (const o of f.heart) {
        const k = (T - f.t + 0.05) / 0.3, s = k <= 0 ? 0 : pop(k) * fold;
        if (s <= 0.01) this.none(o.I); else this.put(o.I, this.at(L, f.u + o.du, f.h + o.dh, f.out + 0.01), 0.4, 2 * o.sz * s, 2 * o.sz * s, FACING);
      }
    }
    // ---- a petal lets go now and then, and lies on the floor a while
    for (let j = 0; j < NFALL; j++) {
      const I = this.falls[j]; let n = j; while (this.fallTime(n + NFALL) <= T) n += NFALL;
      const age = T - this.fallTime(n), f = this.flowers[n % 3], D = 0.9 + f.h * 1.2;
      if (age <= 0 || age > D + 5.2) { this.none(I); continue; }
      const q = Math.min(1, age / D), u = f.u + 0.07 * Math.sin(Math.min(age, D) * 3.3 + n) + 0.05 * q * (n % 2 ? 1 : -1), out = f.out + 0.16 * q, fold = 1 - this.gone(0, 0.3);
      if (fold <= 0.01) this.none(I);
      else if (q < 1) this.put(I, this.at(L, u, f.h * (1 - Math.pow(q, 1.4)) + 0.015, out), 0.9 * Math.sin(age * 4 + n), 0.05 * fold, 0.042 * fold, FACING);
      else { L.floor(u, out, v); v.y = this.floorY + 0.006; this.put(I, v, n * 1.7, 0.052 * fold, 0.044 * fold, FLOOR, 1, ease.in(ramp(age, D + 4, D + 5.2)) * 1.1); }
    }
    this.aPos.needsUpdate = true; this.aSize.needsUpdate = true; this.aFx.needsUpdate = true;
    L.voice().place();
  },
});
