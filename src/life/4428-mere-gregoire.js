// Gustave Courbet, Mère Grégoire (1855, reworked 1857-59), Gallery 222. The word: bouquet.
//
// A dark picture: a woman in black behind a marble counter, a brown-black wall, a band of deep red. The only living
// colour in it is flowers, glowing out of that dark: on the left a glass carafe holding a bouquet (sprays of white
// may blossom, ivy climbing out of the top, a white lily, a crimson peony, a sprig of honeysuckle, long green
// leaves), and on the right one small sprig, turquoise, white and red, held up between finger and thumb. The
// museum's note says he began with the head alone and built the rest round it, piece by piece, two years later. So
// that is what happens under the picture: his dark comes out, and the still life is put together in it, piece by
// piece, a third larger than he painted it.
//
// Look, and the wall and the floor under the picture go down into his warm near-black, with his band of deep red low
// on the wall (the pictures keep their own light, and so does the label). The corner of her counter comes out of
// the foot of the wall, dark wood with the grey marble top he scraped on with the knife, the carafe standing on it,
// the water in it rocking when the counter stops. Then the flowers come, each stem out from under the frame, below
// where it is painted, head first; it swings round and upright over the carafe, hangs there a moment, leaning, and
// slides in; the glass rings, the water rocks, and the stems already there shift to make room. The ivy, the white
// may, the dark leaves, the honeysuckle; then the white lily; and the peony last, which is heavy: it weighs itself
// over the lip, drops, and the carafe leans right over on the marble, hangs, and comes back, tick, tick, quicker and
// smaller, and stands. A hush. Then, from under the frame on the right, below the hand that holds it, the little
// sprig comes down turning, as a flower turns when it is rolled between finger and thumb, crosses over the marble
// under the label and tucks itself into the heart of the bouquet, between the white lily and the red peony: blue,
// white and red together (the museum's note reads the sprig's colours as the flag's). One long note on the glass,
// and the finished bouquet simply stands there, lit, in his dark; a petal of may lets go now and then and lies on
// the marble. When you stop, the stems lift out, last in first out, and go back under the frame, the counter slides
// home, and the light comes back.
//
// Everything in the bouquet is a mark of paint (one draw call of dabs that face you, each lying along its own stalk
// or petal in space: low in key, broad, dragged a little as the knife drags, dark at its edge where the ground
// shows, the light loaded on top on the side his light comes from); the carafe is dark glass with his cold scraped
// highlight down its left side, water in it that stays level, and the stems seen through it; the counter is one
// smooth moulded block, painted; the dark, the shadows and the glass are one mesh. Three draw calls, about 200 dabs.
// It stands half a metre out from a wall hung close and low: from the look camera all of it is under the picture and
// the guard has nothing to cut; from the floor, looking up, or low from one side, the guard takes the tip of a spray
// where it would cross a canvas (the Beggar hangs to 0.8 m), which is why the ivy's crown is a little shorter here.
// Nothing is solid and nothing is left behind. The only music is the glass, a note to each stem: the picture's own
// song (Béranger's "Madame Grégoire", of the 1820s) is about her house, and the museum calls his lyrics ribald, so it
// is not played here. With "Reduce motion and flashing" on, the carafe barely rocks, the sprig turns at half speed,
// the stems settle more gently, and the dark comes and goes more slowly.
//
// What it does not do: the woman stays in her picture (no figure, no hand, no face, and nothing made of her age or
// her size), and the coins, the ledger and the bell on her counter, which are the business of her house, stay there
// with her; nor is the sprig held out to the toy or to you, because the show keeps to the flowers, the part of this
// picture that is for everyone.
import * as THREE from 'three';
import { lifeFor, ease, ramp, clamp01, canvasTexture, rng } from '../paintlife.js';
import { score, noise } from './stagecraft.js';
import { hz } from './tunes.js';

const PI = Math.PI, TAU = PI * 2;
// The picture is 843 px wide here and 0.97 m on the wall (1.15 mm to the pixel); the still life is built from it a
// third larger. Pixel (135, 864) is the middle of the carafe's foot.
const K = 0.00156, G = K / 0.00144, PX = x => (x - 135) * K, PY = y => (864 - y) * K, DZ = 0.094;
const U0 = -0.2, OUT0 = 0.52;                // where the carafe stands: along the wall from the picture's middle, out from it
const CH = 0.17, SLIDE = 0.86;                 // the counter: how high, and how far it has to come out of the wall
// its corner, in plan round the carafe's foot (along, out): against the wall at the back, its corner towards you on the left
const PLAN = [[-0.24, -0.49], [0.5, -0.49], [0.44, 0.06], [-0.22, 0.26]];
const MOUTH = 164 * K, FOOT = 0.03 * G;       // the carafe's lip above the marble; the rim of its foot, which it rocks on
const LABEL = [0, 0.8, 0.13, 0.1];           // the wall label under the picture (along, up; half sizes with its glow): kept clear, and lit
const T_DARK = [0.0, 1.5], T_SLIDE = [0.3, 1.4];
// The stems, in the order they come: when each is in, how long its flight is, where it comes out under the frame
// (metres along the wall from the picture's middle), which way its head leans as it comes ([along, out]), how far it
// turns on its own stalk on the way, the note the glass gives, and how long it hangs over the lip before it goes in.
const STEMS = [
  { name: 'ivy', in: 2.05, fly: 1.15, us: -0.2, lean: [0.2, 1], twist: -0.9, note: 'D5', tall: true },
  { name: 'may', in: 2.5, fly: 1.1, us: -0.36, lean: [-0.35, 1], twist: 0.8, note: 'F#5' },
  { name: 'leaves', in: 2.9, fly: 1.05, us: -0.34, lean: [-0.25, 1], twist: 0.7, note: 'E5' },
  { name: 'may2', in: 3.3, fly: 1.1, us: -0.22, lean: [0.4, 1], twist: -0.8, note: 'A5', tall: true },
  { name: 'leaves2', in: 3.65, fly: 1.05, us: -0.2, lean: [0.3, 1], twist: -0.7, note: 'B5' },
  { name: 'honeysuckle', in: 4.15, fly: 1.15, us: -0.26, lean: [0.35, 1], twist: 0.9, note: 'D6' },
  { name: 'lily', in: 4.85, fly: 1.25, us: -0.33, lean: [-0.3, 1], twist: -0.8, note: 'F#6', hang: 0.2 },
  { name: 'peony', in: 5.9, fly: 1.6, us: -0.23, lean: [0.3, 1], twist: 0.6, note: 'D4', hang: 0.32 },
];
const G_SPRIG = STEMS.length, T_ROCK = STEMS[7].in, T_SPRIG = [6.9, 8.6], T_LIT = [T_SPRIG[1], T_SPRIG[1] + 1.6];
const START_H = 0.8, START_OUT = -0.64, TILT0 = 1.85, TILT_A = 0.62, INSERT = 0.13;
const NFALL = 6, FALL_AT = [T_ROCK + 0.3, T_ROCK + 0.7, T_SPRIG[1] + 0.5];
// when the nth petal lets go: two as the carafe rocks, one as the sprig goes in, then one every few seconds
const fallAt = m => (m < FALL_AT.length ? FALL_AT[m] : T_SPRIG[1] + 2.8 + (m - FALL_AT.length) * 3.1);
const K_DAB = 0, K_LEAF = 1, K_MAY = 2, K_IVY = 3, K_PETAL = 4, K_CURL = 5, K_STEM = 6, K_CUP = 7;
const FACING = 0, AXIAL = 1, FLAT = 2;
// The colours, low in key as his are (a shade, and the light loaded on it): mixed a little towards the picture's own
// palette when it is built. The lily's white and the peony's pink are the top of the scale.
const PAINT = {
  ivy: ['#1b2411', '#5d6b45'], ivyD: ['#12190e', '#3f4b33'],
  leaf: ['#0f2419', '#3d6e54'], leafB: ['#11312a', '#4f876f'], leafD: ['#0b1610', '#27402f'],
  mass: ['#080d08', '#152018'], stem: ['#17180f', '#40422b'],
  may: ['#4a4838', '#c6beA5'], bud: ['#43462f', '#96957a'], lily: ['#6c6955', '#f1e8ce'],
  peonyD: ['#3a0d08', '#8a271b'], peony: ['#6a1a12', '#c4493b'], peonyL: ['#9c4034', '#e79886'], heart: ['#1c0504', '#330c08'],
  honey: ['#5a2914', '#9c6240'], honeyL: ['#75432a', '#bd8a66'],
  blue: ['#10403d', '#408c82'], white: ['#6f6b59', '#d3ccb6'], red: ['#5c1a11', '#b2513d'],
};

lifeFor(4428, {
  title: /^Mère Grégoire/,
  word: 'bouquet',
  stage: { out: 1.3, half: 1.1, cam: { dist: 2.75, side: 0.05, height: 0.9, fov: 56, lookU: -0.04, lookOut: 0.5, lookH: 0.99 } },
  wake: 2, ret: 2.4,

  build(L) {
    const P = L.pal, col = (h, a = 0.1) => P.near(h, a), rnd = L.rand;
    this.X = new THREE.Vector3(L.tx, 0, L.tz); this.Zo = new THREE.Vector3(L.nx, 0, L.nz);
    this.base = new THREE.Vector3(); this.v = new THREE.Vector3(); this.a = new THREE.Vector3();
    const gi = n => STEMS.findIndex(s => s.name === n);

    // ---------------------------------------------------------- the bouquet, dab by dab, from the picture
    // (x, y in the picture's pixels; z: how far to the front, -1..1; sizes in pixels; angles in the picture's plane)
    const D = [];
    const dab = (g, kind, x, y, z, len, wid, ang, pair, o = {}) => {
      const t = o.tilt == null ? z * 0.45 : o.tilt, a = ang * PI / 180;
      D.push({ g, kind, pair, mode: o.mode == null ? (kind === K_LEAF || kind === K_STEM || kind === K_PETAL || kind === K_CURL ? AXIAL : FACING) : o.mode,
        x: PX(x), y: PY(y), z: z * DZ, len: len * K, wid: wid * K, ax: Math.cos(a) * Math.cos(t), ay: Math.sin(a) * Math.cos(t), az: Math.sin(t), seed: 0.37 + D.length * 1.713 });
    };
    const stalk = (g, pts, z, pair = 'stem', wid = 3.6) => { for (let i = 1; i < pts.length; i++) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i]; dab(g, K_STEM, (x0 + x1) / 2, (y0 + y1) / 2, z, Math.hypot(x1 - x0, y1 - y0) * 1.1, wid, Math.atan2(y0 - y1, x1 - x0) * 180 / PI, pair, { tilt: 0 }); } };
    // may: a few thick touches of white round a dark heart, no two blossoms the same size or turned the same way; a bud here and there
    const may = (g, list, z0) => list.forEach(([x, y, s = 1], i) => {
      const z = z0 + 0.35 * Math.sin(i * 2.4), len = 26 * s * (0.85 + 0.35 * rnd());
      dab(g, K_MAY, x, y, z, len, len * (0.66 + 0.34 * rnd()), rnd() * 360, 'may');
      if (i % 3 === 1) { const a = rnd() * TAU; dab(g, K_DAB, x + 14 * Math.cos(a), y + 14 * Math.sin(a), z - 0.05, 9, 8, rnd() * 360, 'bud'); }
    });
    // the dark of the bouquet: broad touches of near-black green, and a dark leaf across each
    const dark = (g, list) => list.forEach(([x, y, r, z], i) => {
      dab(g, K_DAB, x, y, z, r * 2.5, r * 1.7, rnd() * 180, 'mass');
      dab(g, K_LEAF, x + (rnd() - 0.5) * 16, y + (rnd() - 0.5) * 16, z + 0.08, r * 1.9, r * 0.8, rnd() * 360, i % 2 ? 'leafD' : 'ivyD');
    });
    // each stem's cut end, down in the water
    STEMS.forEach((s, g) => { const a = g * 2.4, r = 9 + 5 * Math.sin(g * 1.7); stalk(g, [[135 + 5 * Math.cos(a), 702], [135 + r * Math.cos(a), 838 - 6 * (g % 3)]], 0.12 * Math.sin(a), 'stem', 3.4); });
    // the ivy: a spray climbing out of the top, and a shoot of it trailing off to the left
    // (its crown a little shorter than he has it, so that the bouquet stands clear under the frame)
    let g = gi('ivy'); const iy = y => (y < 520 ? 520 - (520 - y) * 0.8 : y);
    stalk(g, [[136, 704], [140, 640], [146, 570], [152, 500], [160, iy(442)], [165, iy(404)]], -0.25);
    stalk(g, [[146, 562], [112, 522], [72, 497], [40, 486]], -0.45, 'stem', 3);
    [[165, 400, 18, 80], [150, 426, 27, 120], [173, 451, 24, 30], [146, 469, 28, 150], [167, 491, 26, 10], [138, 513, 28, 160], [111, 424, 22, 100], [121, 456, 23, 200],
      [96, 506, 26, 140], [67, 491, 26, 100], [42, 482, 22, 160], [30, 503, 19, 220], [56, 516, 22, 250]]
      .forEach(([x, y, s, ang], i) => dab(g, K_IVY, x, iy(y), -0.3 + 0.3 * Math.sin(i * 1.9), s * 1.5, s * (1.15 + 0.3 * rnd()), ang + (rnd() - 0.5) * 30, i % 3 ? 'ivy' : 'ivyD'));
    // the long leaves on the left, and the dark of the bouquet behind them
    g = gi('leaves');
    stalk(g, [[132, 704], [112, 660], [90, 612]], 0.2);
    dark(g, [[70, 600, 30, 0.0], [100, 598, 34, -0.2], [60, 640, 28, 0.1], [95, 668, 30, 0.2], [120, 640, 30, -0.1], [45, 560, 24, -0.3], [85, 522, 26, -0.4], [110, 718, 20, 0.3], [80, 580, 34, -0.8], [112, 630, 36, -0.9]]);
    dab(g, K_LEAF, 67, 565, 0.5, 56, 29, 138, 'leafB'); dab(g, K_LEAF, 72, 692, 0.6, 96, 31, -112, 'leaf');
    dab(g, K_LEAF, 47, 640, -0.2, 52, 25, -122, 'leafD'); dab(g, K_LEAF, 107, 701, 0.75, 50, 22, -110, 'leaf');
    // the leaves on the right
    g = gi('leaves2');
    stalk(g, [[138, 704], [165, 665], [200, 640]], 0.2);
    dark(g, [[170, 560, 30, -0.1], [200, 600, 32, 0.0], [215, 660, 30, 0.1], [170, 640, 34, 0.0], [150, 600, 34, -0.2], [185, 700, 26, 0.3], [140, 680, 26, 0.2], [230, 610, 22, -0.2], [190, 610, 36, -0.85], [160, 668, 34, -0.9]]);
    dab(g, K_LEAF, 224, 703, 0.4, 52, 29, -34, 'leaf'); dab(g, K_LEAF, 155, 719, 0.8, 44, 21, -75, 'leaf'); dab(g, K_LEAF, 232, 565, 0.2, 58, 26, 49, 'leafB');
    dab(g, K_LEAF, 194, 727, 0.5, 44, 23, -51, 'leafD'); dab(g, K_LEAF, 243, 645, -0.2, 34, 21, -20, 'leafD');
    // a spray of may, to the left
    g = gi('may');
    stalk(g, [[133, 703], [110, 640], [85, 590], [60, 560], [40, 546]], 0.1, 'stem', 3);
    may(g, [[63, 537], [77, 537, 1.1], [70, 549], [43, 583, 1.1], [24, 590], [34, 598], [100, 550, 1.1], [110, 553], [105, 563], [123, 573], [117, 581, 1.1], [52, 572, 0.9], [88, 578, 0.9]], 0.35);
    [[52, 560, 200], [88, 566, 20], [30, 577, 160], [112, 566, -30]].forEach(([x, y, ang]) => dab(g, K_LEAF, x, y, 0.1, 26, 12, ang, 'leaf'));
    // another, to the right and up through the middle
    g = gi('may2');
    stalk(g, [[137, 703], [150, 640], [160, 590], [162, 540], [158, 516]], 0.0, 'stem', 3);
    stalk(g, [[160, 590], [190, 560], [205, 531]], 0.15, 'stem', 2.6); stalk(g, [[150, 562], [120, 502], [96, 476]], -0.1, 'stem', 2.6);
    may(g, [[157, 513, 1.1], [163, 524], [152, 550], [147, 561, 1.1], [203, 523], [207, 537, 1.1], [200, 560], [90, 468, 1.1], [100, 480], [96, 491], [208, 620], [181, 628, 0.9], [147, 650], [154, 658, 0.9], [133, 664], [217, 657, 0.9]], 0.4);
    [[185, 546, 40], [175, 531, 110], [120, 491, 150], [215, 601, -10]].forEach(([x, y, ang]) => dab(g, K_LEAF, x, y, 0.15, 26, 12, ang, 'leaf'));
    // the honeysuckle: straps of orange-pink curling back from the middle
    g = gi('honeysuckle');
    stalk(g, [[138, 703], [160, 650], [172, 598]], 0.45, 'stem', 3);
    [150, 108, 68, 28, -12, 196, -140].forEach((ang, i) => { const a = ang * PI / 180; dab(g, K_CURL, 172 + 15 * Math.cos(a), 590 - 15 * Math.sin(a), 0.6 + 0.08 * i, 34, 12, ang, i % 2 ? 'honeyL' : 'honey', { tilt: 0.35 }); });
    dab(g, K_DAB, 172, 590, 0.7, 10, 9, 0, 'peonyD'); dab(g, K_LEAF, 192, 602, 0.5, 28, 15, 20, 'leafB'); dab(g, K_LEAF, 158, 606, 0.5, 24, 14, 200, 'leaf');
    // the lily: pointed white petals, grey-green at the throat, and the bright leaf under it
    g = gi('lily');
    stalk(g, [[134, 703], [118, 666], [100, 646]], 0.7, 'stem', 3.4);
    [135, 84, 6, -96, 200].forEach((ang, i) => { const a = ang * PI / 180; dab(g, K_PETAL, 97 + 17 * Math.cos(a), 637 - 17 * Math.sin(a), 0.85 + 0.03 * i, 39, 23, ang, 'lily', { tilt: 0.3 }); });
    dab(g, K_DAB, 97, 637, 0.97, 10, 9, 0, 'bud'); dab(g, K_DAB, 100, 634, 1.0, 5, 5, 0, 'honeyL'); dab(g, K_LEAF, 131, 619, 0.95, 46, 21, -20, 'leafB');
    // the peony: a dark crimson ball of cupped petals, redder within, touched with pink where the light is
    g = gi('peony');
    stalk(g, [[139, 703], [165, 690], [178, 681]], 0.7, 'stem', 4);
    dab(g, K_DAB, 180, 676, 0.66, 58, 54, 20, 'peonyD');
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + 0.4; dab(g, K_CUP, 180 + 18 * Math.cos(a), 675 - 17 * Math.sin(a), 0.74 + 0.01 * i, 34, 26, a * 180 / PI + 90, i < 4 ? 'peony' : 'peonyD'); }
    for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + 1.2; dab(g, K_CUP, 180 + 8 * Math.cos(a), 675 - 8 * Math.sin(a), 0.84 + 0.01 * i, 23, 18, a * 180 / PI + 90, i < 2 ? 'peonyL' : 'peony'); }
    dab(g, K_DAB, 181, 677, 0.92, 9, 8, 0, 'heart'); dab(g, K_DAB, 171, 662, 0.93, 14, 8, 35, 'peonyL');
    dab(g, K_LEAF, 204, 690, 0.6, 28, 16, -30, 'leafD'); dab(g, K_LEAF, 160, 694, 0.65, 26, 15, 215, 'leafD');
    this.peonyAt = D.length - 4;
    const NB = D.length;
    // the sprig: in metres round the middle of its head (it is made larger than the rest, to be seen crossing the dark)
    const sp = (kind, x, y, z, len, wid, ang, pair, tilt = 0) => { const a = ang * PI / 180; D.push({ g: G_SPRIG, kind, pair, mode: kind === K_DAB ? FACING : AXIAL, x, y, z, len, wid, ax: Math.cos(a) * Math.cos(tilt), ay: Math.sin(a) * Math.cos(tilt), az: Math.sin(tilt), seed: 0.61 + D.length * 1.713 }); };
    sp(K_STEM, 0.004, -0.045, 0, 0.075, 0.006, 82, 'stem'); sp(K_STEM, 0.004, -0.108, 0, 0.062, 0.0055, 96, 'stem');
    sp(K_LEAF, 0.02, -0.062, 0.006, 0.036, 0.015, 25, 'leafB'); sp(K_LEAF, -0.013, -0.085, -0.006, 0.032, 0.014, 160, 'leaf');
    [[-0.024, 0.006, 0.012, 170], [-0.007, 0.022, -0.012, 100], [0.013, 0.005, 0.016, 10], [-0.013, -0.013, -0.006, 230], [0.004, -0.004, 0.02, 300], [0.002, 0.012, -0.02, 60]]
      .forEach(([x, y, z, ang]) => sp(K_DAB, x, y, z, 0.031, 0.025, ang, 'blue'));
    sp(K_DAB, 0.026, 0.021, 0.004, 0.026, 0.021, 40, 'white'); sp(K_DAB, 0.031, -0.008, -0.01, 0.025, 0.02, -20, 'red'); sp(K_DAB, -0.02, 0.033, 0.006, 0.02, 0.016, 120, 'red');
    const NS = D.length - NB;
    // petals that let go
    for (let j = 0; j < NFALL; j++) D.push({ g: -1, kind: K_DAB, pair: j === 1 ? 'peonyL' : 'may', mode: FACING, x: 0, y: 0, z: 0, len: 0.021, wid: 0.016, ax: 1, ay: 0, az: 0, seed: 3.3 + j * 2.9 });
    const N = this.N = D.length; this.D = D; this.NB = NB; this.NS = NS;
    this.mays = D.map((d, i) => (d.kind === K_MAY ? i : -1)).filter(i => i >= 0);
    // where each dab is from the carafe's lip (the stems are held there as they fly), how far along its stem (so that
    // a spray whips a little as it turns), and the light on it: from the upper left and the front, as in the picture;
    // the lily and the peony a little above the rest
    const top = [gi('lily'), gi('peony')];
    for (const d of D) {
      if (d.g === G_SPRIG || d.g < 0) { d.lit = 1.04; d.far = 0; continue; }
      d.ry = d.y - MOUTH; d.far = Math.min(1, Math.hypot(d.x, d.ry, d.z) / 0.42);
      d.lit = Math.max(0.46, Math.min(1.06, 0.76 - d.x / 0.3 * 0.24 + (d.y - 0.36) / 0.3 * 0.14 + d.z / DZ * 0.24)) * (0.9 + 0.2 * rnd()) * (top.includes(d.g) && d.kind !== K_LEAF ? 1.12 : 1);
      if (d.kind === K_STEM && d.y < MOUTH) d.lit = 0.85;
    }
    // where the sprig comes to rest: in the heart of the bouquet, at the front
    this.sprigHome = new THREE.Vector3(PX(147), PY(628), 1.2 * DZ);
    const sx = 0.3 - U0;                                            // (under the frame's right end, below the hand)
    this.sprigWay = new THREE.CatmullRomCurve3([
      new THREE.Vector3(sx, 0.56, -OUT0 - 0.14), new THREE.Vector3(sx, 0.54, -OUT0 + 0.17), new THREE.Vector3(sx - 0.04, 0.44, -0.14),
      new THREE.Vector3(sx - 0.24, 0.33, 0.04), new THREE.Vector3(sx - 0.46, 0.36, 0.1), new THREE.Vector3(this.sprigHome.x + 0.015, this.sprigHome.y + 0.07, this.sprigHome.z + 0.08), this.sprigHome.clone()], false, 'centripetal');
    this.sprigWay.arcLengthDivisions = 300; this.sprigWay.updateArcLengths();
    this.sprigAt = new THREE.Vector3();
    // the flights: from in the wall under the frame, out and over, to a point above the lip, and in
    this.fl = STEMS.map(s => {
      // (its head comes out of the wall pointing into the room, and swings round to lean along the wall as it stands up,
      // so that nothing leans far out towards you over the foot of the picture; the tall sprays a little to the left,
      // short of the Beggar's corner and clear of the label)
      const l = Math.hypot(s.lean[0], s.lean[1]), dx = s.lean[0] / l, dz = s.lean[1] / l, ex = s.tall ? -0.55 : Math.sign(s.lean[0]) * 0.9, ez = s.tall ? 0.835 : 0.436;
      const S = new THREE.Vector3(s.us - U0, START_H - CH, START_OUT - OUT0), M = new THREE.Vector3(0, MOUTH, 0);
      const A = new THREE.Vector3(Math.sin(TILT_A) * ex, Math.cos(TILT_A), Math.sin(TILT_A) * ez).multiplyScalar(INSERT).add(M);
      const C = new THREE.Vector3(S.x + (A.x - S.x) * 0.6, S.y + 0.03, 0.2), hang = s.hang || 0.12;
      return { ...s, dx, dz, ex, ez, S, C, A, M, sA: 0.86 - hang - 0.14, sH: 0.86 - 0.14 + 0.02, lx: dx, lz: dz };
    });
    this.s = new Float32Array(STEMS.length + 1);

    // ---------------------------------------------------------- one mesh of dabs
    const plane = new THREE.PlaneGeometry(1, 1), geo = new THREE.InstancedBufferGeometry();
    geo.index = plane.index; geo.setAttribute('position', plane.attributes.position); geo.instanceCount = N;
    const dyn = k => { const a = new THREE.InstancedBufferAttribute(new Float32Array(N * k), k); a.setUsage(THREE.DynamicDrawUsage); return a; };
    this.aPos = dyn(3); this.aAx = dyn(3); this.aSize = dyn(3); this.aFx = dyn(2);
    const aKind = new THREE.InstancedBufferAttribute(new Float32Array(N * 2), 2), aCol = new THREE.InstancedBufferAttribute(new Float32Array(N * 3), 3), aCol2 = new THREE.InstancedBufferAttribute(new Float32Array(N * 3), 3);
    const pairs = {}; for (const k of Object.keys(PAINT)) pairs[k] = PAINT[k].map(h => col(h));
    D.forEach((d, i) => { const [c, c2] = pairs[d.pair]; aKind.setXY(i, d.kind, d.seed); aCol.setXYZ(i, c.r, c.g, c.b); aCol2.setXYZ(i, c2.r, c2.g, c2.b); });
    for (const [k, a] of [['aPos', this.aPos], ['aAx', this.aAx], ['aSize', this.aSize], ['aFx', this.aFx], ['aKind', aKind], ['aCol', aCol], ['aCol2', aCol2]]) geo.setAttribute(k, a);
    const v3 = h => { const c = col(h); return new THREE.Vector3(c.r, c.g, c.b); };
    // (soft at the edge without sorting: each dab's edge is given to the multisampling as coverage)
    const dm = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, fog: false, alphaToCoverage: true });
    dm.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, { uHeart: { value: v3('#4b5030') }, uThroat: { value: v3('#5c6546') }, uGround: { value: v3('#0e0a05') } });
      sh.vertexShader = sh.vertexShader.replace('#include <common>', `#include <common>
attribute vec3 aPos, aAx, aSize, aCol, aCol2; attribute vec2 aKind, aFx;
varying vec2 vQ, vK, vFx, vLt; varying vec3 vCol, vCol2;`)
        .replace('#include <project_vertex>', `vec4 mvPosition;
  { vec2 p = position.xy * aSize.xy; vec3 Xv, Yv;
    if (aSize.z < 0.5) {                                              // facing you, turned to lie along its own line
      vec3 av = mat3(viewMatrix) * aAx; float l = length(av.xy); vec2 dd = l > 1.0e-4 ? av.xy / l : vec2(1.0, 0.0);
      Xv = vec3(dd, 0.0); Yv = vec3(-dd.y, dd.x, 0.0);
      mvPosition = viewMatrix * vec4(aPos, 1.0); mvPosition.xyz += Xv * p.x + Yv * p.y;
    } else {                                                          // along its line in space; turned to you about it, or lying flat
      vec3 sd = aSize.z < 1.5 ? cross(normalize(cameraPosition - aPos), aAx) : cross(vec3(0.0, 1.0, 0.0), aAx);
      float l = length(sd); sd = l > 1.0e-3 ? sd / l : vec3(0.0, 1.0, 0.0);
      Xv = mat3(viewMatrix) * aAx; Yv = mat3(viewMatrix) * sd;
      mvPosition = viewMatrix * vec4(aPos + aAx * p.x + sd * p.y, 1.0);
    }
    vec3 Lv = normalize(vec3(-0.56, 0.62, 0.55)); vLt = vec2(dot(Lv, Xv), dot(Lv, Yv)); }
  gl_Position = projectionMatrix * mvPosition;
  vQ = position.xy * 2.0; vK = aKind; vFx = aFx; vCol = aCol; vCol2 = aCol2;`);
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
varying vec2 vQ, vK, vFx, vLt; varying vec3 vCol, vCol2; uniform vec3 uHeart, uThroat, uGround;
float cH(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float cN(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(cH(i), cH(i + vec2(1.0, 0.0)), f.x), mix(cH(i + vec2(0.0, 1.0)), cH(i + vec2(1.0, 1.0)), f.x), f.y); }`)
        .replace('#include <color_fragment>', `#include <color_fragment>
  {
    // Every mark: a shape (d < 0 inside), and how far towards its light each part of it is (tone). The paint is laid
    // dark and the light loaded on top of it, thick; the knife drags it into streaks along the mark, and it thins and
    // breaks towards the end of the drag, where the dark ground shows through.
    vec2 q = vQ; int T = int(vK.x + 0.5); float sd = vK.y, d = 1.0, tone = 0.0, mixTo = -1.0, drag = 1.0;
    float n1 = cN(q * 2.6 + sd * 7.0), n2 = cN(q * 7.0 + sd * 3.0), br = cN(vec2(q.x * 0.8 + sd * 3.0, q.y * 11.0 + sd)), lt = dot(q, vLt);
    if (T == 0) {
      // a touch of the loaded knife: broad, soft, its light side to the light
      vec2 s = vec2(q.x, q.y - 0.1 * sin(q.x * 2.0 + sd * 5.0));
      d = length(s) - 0.88 + 0.3 * (n1 - 0.5) + 0.14 * (br - 0.5) * abs(q.x);
      tone = lt * 0.8 + 0.9 * (br - 0.5) + 0.3 * (n1 - 0.5) - 0.08;
    } else if (T == 1) {
      // a long leaf from its stalk (x = -1) to its point: dark, with one loaded stroke along the side turned to the light
      float x = q.x * 0.5 + 0.5, w = 0.92 * pow(max(sin(3.14159 * pow(x, 0.78)), 0.0), 0.7), y = q.y - 0.16 * sin(q.x * 1.6 + sd * 4.0);
      d = abs(y) - w + 0.1 * (n1 - 0.5);
      float s = y * sign(vLt.y + 1.0e-3) / max(w, 0.25);
      tone = -0.42 + 1.15 * smoothstep(0.02, 0.3, s) * (1.0 - smoothstep(0.55, 0.95, s)) * smoothstep(0.06, 0.3, x) * (1.0 - smoothstep(0.66, 1.0, x)) + 0.7 * (br - 0.5) + 0.25 * lt;
      tone = max(tone, -0.12 * smoothstep(0.02, 0.09, abs(y)) + 0.02 * step(0.12, x));
    } else if (T == 2) {
      // a may blossom: five thick touches of unequal size round a dark heart, two or three of them in the light
      float dm = 9.0, tn = 0.0;
      for (int i = 0; i < 5; i++) {
        float fi = float(i), a = fi * 1.2566 + sd, h1 = cH(vec2(fi, sd)), h2 = cH(vec2(fi + 7.0, sd * 1.3));
        vec2 c = vec2(cos(a), sin(a)) * (0.42 + 0.1 * h1); float di = length(q - c) - (0.33 + 0.18 * h1);
        if (di < dm) { dm = di; tn = dot(c, vLt) * 1.1 + 0.9 * (h2 - 0.5); }
      }
      d = dm + 0.07 * (n1 - 0.5); tone = tn + 0.3 * (br - 0.5) + 0.12;
      if (length(q - vec2(0.03, -0.03)) < 0.2 + 0.06 * n1) { mixTo = 1.0; d = min(d, -0.05); }
    } else if (T == 3) {
      // an ivy leaf: three soft points, the middle one longest, a pale vein to each
      vec2 p = q + vec2(0.3, 0.0); float a = atan(p.y, p.x), r = length(p);
      float lob = max(pow(max(cos(a), 0.0), 2.0), pow(max(cos(abs(a) - 1.25), 0.0), 3.0) * 0.8);
      d = r - (0.42 + 0.72 * lob) + 0.14 * (n1 - 0.5);
      float vn = min(abs(sin(a)), abs(sin(abs(a) - 1.25))) * r;
      tone = lt * 0.85 + 0.7 * (br - 0.5) - 0.3 + 0.3 * (1.0 - smoothstep(0.012, 0.05, vn));
    } else if (T == 4) {
      // a lily's petal, from the throat (x = -1) to its point, creased down the middle
      float x = q.x * 0.5 + 0.5, w = 0.9 * pow(max(sin(3.14159 * pow(x, 0.62)), 0.0), 0.6);
      d = abs(q.y) - w + 0.06 * (n1 - 0.5);
      tone = lt * 0.85 + 0.5 * (br - 0.5) + 0.12 - 0.5 * (1.0 - smoothstep(0.0, 0.16, abs(q.y))) * (1.0 - x);
      mixTo = 2.0 + smoothstep(0.02, 0.42, x); drag = 0.5;
    } else if (T == 5) {
      // a strap of honeysuckle, curling back at its tip
      float yc = 0.5 * q.x * q.x - 0.28, w = 0.38 * (1.0 - 0.45 * smoothstep(0.2, 1.0, q.x));
      d = abs(q.y - yc) - w + 0.06 * (n1 - 0.5); if (abs(q.x) > 0.95) d = 1.0;
      tone = q.x * 0.6 + 0.5 * (br - 0.5) + 0.2 * lt - 0.1; drag = 0.4;
    } else if (T == 6) {
      // a stalk
      float y = q.y - 0.22 * sin(q.x * 2.2 + sd * 6.0);
      d = abs(y) - 0.66;
      tone = y * sign(vLt.y + 1.0e-3) * 0.8 + 0.4 * (br - 0.5) - 0.1; drag = 0.0;
    } else {
      // a cupped petal (the peony's): a crescent, its rim catching the light
      float o = length(q) - 0.93;
      d = max(o, 0.7 - length(q - vec2(0.0, 0.52))) + 0.1 * (n1 - 0.5);
      tone = -0.45 + 0.9 * smoothstep(-0.34, -0.06, o) * (0.55 + 0.45 * lt) + 0.6 * (br - 0.5) + 0.3 * lt; drag = 0.5;
    }
    // the dark laid first; the light on top of it, with an edge (it is thick); brighter still along its crest
    float load = smoothstep(0.0, 0.16, tone);
    vec3 c = mix(vCol * (0.72 + 0.4 * smoothstep(-0.6, 0.0, tone)), vCol2, load);
    c += vCol2 * 0.16 * smoothstep(0.42, 0.75, tone);
    if (mixTo > 1.5) c = mix(uThroat, c, mixTo - 2.0); else if (mixTo > 0.5) c = uHeart * (0.7 + 0.5 * n2);
    c *= 0.84 + 0.32 * br;
    c = mix(c, uGround, 0.7 * smoothstep(-0.36, 0.0, d));              // (the dark ground it is laid on shows at its edge)
    c *= vFx.x;
    // (dragged: it breaks into the weave towards the end of the stroke)
    d += drag * 0.7 * smoothstep(-0.2, 1.0, q.x) * smoothstep(0.5, 0.8, br + 0.25 * (n2 - 0.5));
    d += vFx.y * (0.2 + 1.5 * n1) + 0.1 * (n2 - 0.5);                 // (going: it breaks up)
    float fw = max(fwidth(d) * 1.2, 0.06), al = 1.0 - smoothstep(-fw, fw, d);
    if (al < 0.06) discard;
    diffuseColor.rgb = c; diffuseColor.a = al;
  }`);
    };
    dm.customProgramCacheKey = () => 'courbet-bouquet';
    this.dabs = L.add(new THREE.Mesh(geo, dm)); this.dabs.name = 'dabs';

    // ---------------------------------------------------------- the corner of her counter: dark wood, a marble top
    // One painted picture for both: his marble above (dark, with pale paint dragged over it by the knife, and its veins),
    // the wood of the counter's front below (red-brown, brushed downwards).
    const paint = canvasTexture(512, 512, (g, w, H) => {
      const r = rng(4428), hex = c => '#' + col(c).getHexString(), h = Math.round(H * 0.62);
      g.fillStyle = hex('#2c2a23'); g.fillRect(0, 0, w, h + 6);
      for (let i = 0; i < 130; i++) {
        g.globalAlpha = 0.07 + 0.13 * r(); g.fillStyle = hex(['#59564a', '#20211b', '#46453c', '#54452f', '#191a15', '#68655a'][Math.floor(r() * 6)]);
        g.beginPath(); g.ellipse(r() * w, r() * h, 20 + 70 * r(), 8 + 26 * r(), -0.3 + (r() - 0.5) * 0.5, 0, TAU); g.fill();
      }
      // the knife: pale paint dragged thin across it, breaking over the weave; heaviest towards the front edge and the corner
      for (let i = 0; i < 300; i++) {
        const y = h * Math.pow(r(), 0.5), x = w * Math.pow(r(), 1.25), len = 30 + 130 * r(), wd = 2 + 10 * r(), a = -0.28 + (r() - 0.5) * 0.5, k = (0.3 + 0.7 * y / h) * (1.1 - 0.5 * x / w);
        g.strokeStyle = hex(['#c4bda9', '#aea896', '#d3ccb8', '#98937f'][Math.floor(r() * 4)]); g.lineWidth = 1;
        for (let j = 0; j < wd; j++) {
          if (r() < 0.3) continue;
          g.globalAlpha = (0.04 + 0.24 * r()) * k; const o = j - wd / 2, s0 = r() * 0.3, s1 = 0.7 + r() * 0.3;
          g.beginPath(); g.moveTo(x + Math.cos(a) * len * (s0 - 0.5) - Math.sin(a) * o, y + Math.sin(a) * len * (s0 - 0.5) + Math.cos(a) * o); g.lineTo(x + Math.cos(a) * len * (s1 - 0.5) - Math.sin(a) * o, y + Math.sin(a) * len * (s1 - 0.5) + Math.cos(a) * o); g.stroke();
        }
      }
      for (let i = 0; i < 12; i++) {
        let x = r() * w * 1.1 - w * 0.2, y = -5 + r() * h * 0.5, a = 0.55 + (r() - 0.5) * 0.5; const dk = i > 7;
        g.strokeStyle = hex(dk ? '#13140e' : '#d2ccba'); g.globalAlpha = dk ? 0.6 : 0.2 + 0.28 * r(); g.lineWidth = dk ? 1.6 : 0.7 + 0.9 * r();
        g.beginPath(); g.moveTo(x, y);
        for (let j = 0; j < 30; j++) { a += (r() - 0.5) * 0.5; a = Math.max(0.15, Math.min(1.1, a)); x += Math.cos(a) * 14; y += Math.sin(a) * 14; if (y > h - 2) break; g.lineTo(x, y); }
        g.stroke();
      }
      // the wood
      const y0 = h + 6; g.globalAlpha = 1; g.fillStyle = hex('#2c1408'); g.fillRect(0, y0, w, H - y0);
      for (let i = 0; i < 520; i++) {
        const x = r() * w, y = y0 + r() * (H - y0), len = 24 + 120 * r(), a = PI / 2 + (r() - 0.5) * 0.16;
        g.strokeStyle = hex(['#4a220c', '#3a1909', '#1f0e05', '#5b2e13', '#2a1307', '#6a3a1a'][Math.floor(r() * 5.3)]); g.globalAlpha = 0.1 + 0.3 * r(); g.lineWidth = 1 + 5 * r(); g.lineCap = 'round';
        g.beginPath(); g.moveTo(x, Math.max(y0 + 2, y - len / 2)); g.lineTo(x + Math.cos(a) * len, Math.min(H, y + len / 2)); g.stroke();
      }
      const sh = g.createLinearGradient(0, y0, 0, H); sh.addColorStop(0, 'rgba(0,0,0,0.25)'); sh.addColorStop(0.2, 'rgba(0,0,0,0)'); sh.addColorStop(0.7, 'rgba(0,0,0,0.08)'); sh.addColorStop(1, 'rgba(0,0,0,0.5)');
      g.globalAlpha = 1; g.fillStyle = sh; g.fillRect(0, y0, w, H - y0);
    });
    paint.anisotropy = 4; paint.wrapS = THREE.RepeatWrapping;
    {
      // Its outline in plan, the corners rounded; then its section, from the floor up, carried round the outline: a
      // plinth, the front, a cove, the marble's overhang and its rounded nose, and the top.
      const n = PLAN.length, cx = PLAN.reduce((a, p) => a + p[0], 0) / n, cz = PLAN.reduce((a, p) => a + p[1], 0) / n, RAD = 0.016, ring = [];
      const en = PLAN.map((p, i) => { const q = PLAN[(i + 1) % n], l = Math.hypot(q[0] - p[0], q[1] - p[1]); let nx = (q[1] - p[1]) / l, nz = -(q[0] - p[0]) / l; if (nx * (p[0] - cx) + nz * (p[1] - cz) < 0) { nx = -nx; nz = -nz; } return [nx, nz, nx * p[0] + nz * p[1]]; });
      this.edges = en.map(e => new THREE.Vector3(e[0], e[1], e[2]));
      for (let i = 0; i < n; i++) {
        const a = en[(i + n - 1) % n], b = en[i], ca = a[2] - RAD, cb = b[2] - RAD, det = a[0] * b[1] - a[1] * b[0], ox = (ca * b[1] - cb * a[1]) / det, oz = (a[0] * cb - b[0] * ca) / det;
        let a0 = Math.atan2(a[1], a[0]), a1 = Math.atan2(b[1], b[0]); let da = a1 - a0; while (da > PI) da -= TAU; while (da < -PI) da += TAU;
        for (let k = 0; k <= 5; k++) { const t = a0 + da * k / 5; ring.push({ x: ox + RAD * Math.cos(t), z: oz + RAD * Math.sin(t), nx: Math.cos(t), nz: Math.sin(t) }); }
      }
      let per = 0; ring.forEach((p, i) => { const q = ring[(i + ring.length - 1) % ring.length]; if (i) per += Math.hypot(p.x - q.x, p.z - q.z); p.s = per; }); per += Math.hypot(ring[0].x - ring[ring.length - 1].x, ring[0].z - ring[ring.length - 1].z);
      // [out from the outline, height, how it takes the light, marble?]
      const SEC = [[0.002, 0, 0.5, 0], [0.002, 0.024, 0.8, 0], [-0.004, 0.031, 1.05, 0], [-0.009, 0.034, 0.9, 0], [-0.009, CH - 0.052, 1, 0], [-0.006, CH - 0.046, 0.6, 0], [0.004, CH - 0.04, 0.3, 0],
        [0.012, CH - 0.036, 0.75, 1], [0.0155, CH - 0.03, 1.15, 1], [0.0165, CH - 0.016, 1.3, 1], [0.014, CH - 0.006, 1.6, 1], [0.008, CH - 0.001, 1.5, 1], [0.002, CH, 1.1, 1]];
      const pos = [], uv = [], cl = [], lx = -0.55, lz = 0.835;
      const UVm = (x, z) => [(x + 0.26) / 0.78, 1 - 0.61 * (z + 0.5) / 0.78];
      const vert = (p, j) => { const [o, y, k, m] = SEC[j], x = p.x + p.nx * o, z = p.z + p.nz * o, f = k * (0.55 + 0.5 * Math.max(0, p.nx * lx + p.nz * lz) + (m ? 0.12 : 0));
        pos.push(x, y, z); if (m) uv.push(p.s / 0.78, 0.4 + 0.25 * (y - (CH - 0.036)) / 0.036); else uv.push(p.s / 0.62, 0.005 + 0.35 * y / (CH - 0.04)); cl.push(f, f, f); };
      for (let j = 0; j + 1 < SEC.length; j++) for (let i = 0; i < ring.length; i++) {
        const p = ring[i], q0 = ring[(i + 1) % ring.length], q = i + 1 < ring.length ? q0 : { ...q0, s: per };
        vert(p, j); vert(q, j); vert(q, j + 1); vert(p, j); vert(q, j + 1); vert(p, j + 1);
      }
      for (let i = 0; i < ring.length; i++) {       // the top
        const p = ring[i], q = ring[(i + 1) % ring.length], o = SEC[SEC.length - 1][0];
        for (const [x, z] of [[cx, cz], [p.x + p.nx * o, p.z + p.nz * o], [q.x + q.nx * o, q.z + q.nz * o]]) { pos.push(x, CH, z); uv.push(...UVm(x, z)); cl.push(0.86, 0.86, 0.86); }
      }
      const gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); gg.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); gg.setAttribute('color', new THREE.Float32BufferAttribute(cl, 3));
      this.slab = new THREE.Mesh(gg, new THREE.MeshBasicMaterial({ map: paint, vertexColors: true, side: THREE.DoubleSide, fog: false }));
      this.slab.name = 'counter'; this.slab.rotation.y = L.yawOut; L.add(this.slab);
    }

    // ---------------------------------------------------------- his dark, the shadows, the glass and the water in it: one mesh
    {
      const pos = [], nor = [], part = [];
      const tri = (pts, k, nrm) => { for (const p of pts) { pos.push(p[0], p[1], p[2]); nor.push(nrm[0], nrm[1], nrm[2]); part.push(k); } };
      const quad = (a, b, c, e, k, nrm) => tri([a, b, c, a, c, e], k, nrm);
      // (drawn in this order: the dark first, over the floor, the skirting and the wall behind the pictures and the label)
      const back = -(OUT0 + L.wall), R = L.room; let left = 3.8, right = 3.8, deep = 4.2;
      if (R) { const a = Math.abs(L.tx) > 0.5 ? [(R.x0 - L.cx) * L.tx, (R.x1 - L.cx) * L.tx] : [(R.z0 - L.cz) * L.tz, (R.z1 - L.cz) * L.tz]; left = Math.min(left, -Math.min(a[0], a[1]) - 0.006); right = Math.min(right, Math.max(a[0], a[1]) - 0.006);
        deep = Math.min(deep, (Math.abs(L.nx) > 0.5 ? Math.max((R.x0 - L.cx) * L.nx, (R.x1 - L.cx) * L.nx) : Math.max((R.z0 - L.cz) * L.nz, (R.z1 - L.cz) * L.nz)) - 0.05); }
      const x0 = -left - U0, x1 = right - U0, up = Math.min(4.6, ((R && (R.ceil || R.h)) || 4) - 0.05);
      quad([x0, 0.012, deep - OUT0], [x1, 0.012, deep - OUT0], [x1, 0.012, back + 0.004], [x0, 0.012, back + 0.004], 4, [0, 1, 0]);
      quad([x0, 0.012, -OUT0 - 0.004], [x1, 0.012, -OUT0 - 0.004], [x1, 0.62, -OUT0 - 0.004], [x0, 0.62, -OUT0 - 0.004], 5, [0, 0, 1]);
      quad([x0, 0.012, back + 0.007], [x1, 0.012, back + 0.007], [x1, up, back + 0.007], [x0, up, back + 0.007], 6, [0, 0, 1]);
      // (then the shadow the counter stands in, and what lies on its marble)
      const grown = PLAN.map(([x, z]) => [x + Math.sign(x - 0.1) * 0.2, 0.014, z > 0 ? z + 0.2 : z]), topq = PLAN.map(([x, z]) => [x, CH + 0.0015, z]);
      quad(grown[0], grown[3], grown[2], grown[1], 1, [0, 1, 0]); quad(topq[0], topq[3], topq[2], topq[1], 2, [0, 1, 0]);
      // (and the glass last)
      const prof = [[0.0005, 0.005], [0.03, 0.0008], [0.05, 0.004], [0.068, 0.022], [0.078, 0.05], [0.079, 0.07], [0.073, 0.095], [0.058, 0.118], [0.04, 0.136], [0.027, 0.152], [0.0215, 0.17], [0.02, 0.2], [0.021, 0.222], [0.026, 0.233], [0.0275, 0.236]];
      const lathe = new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r * G, y * G)), 36).toNonIndexed(), lp = lathe.attributes.position, ln = lathe.attributes.normal;
      for (let i = 0; i < lp.count; i++) { pos.push(lp.getX(i), lp.getY(i) + CH, lp.getZ(i)); nor.push(ln.getX(i), ln.getY(i), ln.getZ(i)); part.push(0); }
      const gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); gg.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); gg.setAttribute('aPart', new THREE.Float32BufferAttribute(part, 1));
      const u = this.gu = { uRock: { value: 0 }, uWater: { value: 0.1 }, uSlosh: { value: 0 }, uBq: { value: 0 }, uDk: { value: 0 }, uLit: { value: 0 }, uUnslide: { value: 0 }, uBase: { value: new THREE.Vector3() }, uTan: { value: this.X.clone() }, uEdge: { value: this.edges },
        uLabel: { value: new THREE.Vector4(LABEL[0] - U0, LABEL[1], LABEL[2], LABEL[3]) },
        uRim: { value: v3('#7c8a80') }, uGlassIn: { value: v3('#1d1b12') }, uWaterC: { value: v3('#23261a') }, uHi: { value: v3('#dfe9e8') }, uShade: { value: v3('#090704') }, uWarm: { value: v3('#cfc2a2') },
        uDuskC: { value: v3('#17110a') }, uRedC: { value: v3('#32100a') } };
      const gm = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor });
      gm.onBeforeCompile = sh => {
        Object.assign(sh.uniforms, u);
        sh.vertexShader = sh.vertexShader.replace('#include <common>', `#include <common>
attribute float aPart; uniform float uRock, uUnslide; varying float vPart; varying vec3 vGN, vGV, vGL;`)
          .replace('#include <begin_vertex>', `vec3 transformed = position; vec3 gn = normal;
  if (aPart < 0.5) {                                                  // the carafe rocks on the rim of its foot
    float px = uRock > 0.0 ? ${FOOT.toFixed(4)} : -${FOOT.toFixed(4)}, c = cos(uRock), s = sin(uRock), x = position.x - px, y = position.y - ${CH.toFixed(3)};
    transformed.x = px + x * c + y * s; transformed.y = ${CH.toFixed(3)} - x * s + y * c; gn = vec3(normal.x * c + normal.y * s, -normal.x * s + normal.y * c, normal.z);
  } else if (aPart > 3.5) transformed.z += uUnslide;                  // (the dark stays where it is while the counter slides)`)
          .replace('#include <project_vertex>', `#include <project_vertex>
  vPart = aPart; vGL = position; vGV = mvPosition.xyz; vGN = normalize(mat3(modelViewMatrix) * gn);`);
        sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
varying float vPart; varying vec3 vGN, vGV, vGL;
uniform float uWater, uSlosh, uBq, uDk, uLit; uniform vec3 uBase, uTan, uRim, uGlassIn, uWaterC, uHi, uShade, uWarm, uDuskC, uRedC; uniform vec3 uEdge[4]; uniform vec4 uLabel;
float gH(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float gN(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(gH(i), gH(i + vec2(1.0, 0.0)), f.x), mix(gH(i + vec2(0.0, 1.0)), gH(i + vec2(1.0, 1.0)), f.x), f.y); }
vec3 gCol, gAdd; float gA;`)
          .replace('#include <map_fragment>', `#include <map_fragment>
  gAdd = vec3(0.0);
  if (vPart < 0.5) {
    // glass, dark: clear where you look straight through it (the stems show), thick and grey-green at its edges
    vec3 n = normalize(vGN), v = normalize(-vGV); bool front = gl_FrontFacing; if (!front) n = -n;
    float rim = pow(1.0 - abs(dot(n, v)), 2.2);
    gA = 0.1 + 0.55 * rim; gCol = mix(uGlassIn, uRim * 0.8, rim);
    // the water, level whatever the glass does
    float wy = lifeP.y - uBase.y, lvl = uWater + uSlosh * dot(lifeP - uBase, uTan), under = 1.0 - smoothstep(-0.002, 0.002, wy - lvl);
    gA += 0.14 * under; gCol = mix(gCol, uWaterC, 0.5 * under);
    float men = 1.0 - smoothstep(0.0015, 0.0045, abs(wy - lvl));
    gCol = mix(gCol, uHi * 0.75, 0.55 * men); gA = max(gA, 0.5 * men);
    if (front) {
      // his cold lights on it: a broad faint one from the upper left; over it the pale blue-white scrape of the knife
      // down the left of the belly; a small one answering it on the right
      vec3 l1 = normalize(vec3(-0.62, 0.42, 0.66)), h1 = normalize(l1 + v), nn = normalize(vec3(n.x, n.y * 0.4, n.z));
      float cold = 0.16 * smoothstep(0.35, 0.95, dot(n, l1));
      float sp = pow(max(dot(nn, normalize(vec3(h1.x, h1.y * 0.4, h1.z))), 0.0), 60.0), br = gN(vec2(vGL.y * 380.0, vGL.x * 50.0 + vGL.z * 34.0));
      float hi = smoothstep(0.3, 0.62, sp * (0.55 + 0.9 * br));
      vec3 h2 = normalize(normalize(vec3(0.6, 0.15, 0.78)) + v); float hi2 = 0.4 * smoothstep(0.5, 0.9, pow(max(dot(n, h2), 0.0), 90.0));
      hi = max(hi, hi2); gCol = mix(gCol, uHi, max(hi, cold)); gA = max(gA, max(0.92 * hi, cold));
    } else gA *= 0.5;
  } else if (vPart < 2.5) {
    vec2 p = vGL.xz; float e = -1.0e3;
    if (vPart < 1.5) {
      // on the floor round the counter, a little to the right and the front, away from the light
      p -= vec2(0.03, 0.02); for (int i = 0; i < 4; i++) e = max(e, dot(uEdge[i].xy, p) - uEdge[i].z);
      gA = 0.7 * (1.0 - smoothstep(-0.03, 0.17, e)); gCol = uShade;
    } else {
      // on the marble: the carafe's foot, the bouquet's shadow (it grows as the stems come), the cold light the water
      // gathers, and, when the bouquet is whole, a little of its light on the stone round it
      float shc = 0.55 * (1.0 - smoothstep(0.15, 1.0, length((p - vec2(0.12, -0.035)) / (vec2(0.2, 0.1) * (0.5 + 0.5 * uBq)))));
      float foot = 0.65 * (1.0 - smoothstep(0.03, 0.07, length(p)));
      gA = max(shc, foot); gCol = uShade;
      vec2 q = (p - vec2(0.083, -0.022)) / vec2(0.04, 0.02), w = (p - vec2(-0.02, 0.03)) / vec2(0.3, 0.2);
      gAdd = uHi * exp(-dot(q, q)) * 0.34 + uWarm * exp(-dot(w, w)) * 0.1 * uLit * (1.0 - gA);
    }
  } else {
    // his dark: warm, near black, a depth of shade laid over the floor and the foot of the wall under the picture and
    // on the wall round it, broken at its edge; and low on the wall his band of deep red
    float uu = vGL.x + ${U0.toFixed(3)}, oo = max(vGL.z + ${OUT0.toFixed(3)}, 0.0), hh = vGL.y, wallp = step(4.5, vPart);
    float nz = gN(vec2(uu, mix(oo, hh, wallp)) * 1.6) - 0.5, n2 = gN(vec2(uu * 17.0, mix(oo, hh, wallp) * 9.0));
    vec3 C = uDuskC * (0.8 + 0.45 * n2);
    if (vPart < 5.5) {
      float rr = length((vec2(uu, oo * (1.0 - wallp)) - vec2(-0.1, 0.6)) / vec2(3.5, 3.4));
      float foot = 1.0 - smoothstep(0.2, 1.0, rr + 0.16 * nz);
      foot *= 1.0 - wallp * smoothstep(0.3, 0.6, hh + 0.03 * nz);
      gA = 1.0 - exp(-mix(6.0, 12.0, wallp) * foot * uDk);
      C = mix(C, uRedC * (0.8 + 0.45 * n2), 0.8 * wallp);
    } else {
      float d3 = length(vec2((uu + 0.1) / 3.7, (hh - 0.7) / (hh > 0.7 ? 4.6 : 1.9)));
      // (deep, as a depth of shade: the wall under the picture lamps is many times brighter than white, and a veil of
      // nine tenths hardly shows on it; and the label keeps a little of that light round it)
      float halo = mix(0.1, 1.0, smoothstep(0.8, 1.6, length((vec2(vGL.x, hh) - uLabel.xy) / uLabel.zw) + 0.3 * nz));
      gA = 1.0 - exp(-18.0 * uDk * halo * pow(1.0 - smoothstep(0.08, 1.0, d3 + 0.04 * nz), 1.3));
      C = mix(C, uRedC * (0.8 + 0.45 * n2), 0.85 * (1.0 - smoothstep(0.78, 0.9, hh + 0.05 * nz)));
    }
    gCol = C;
  }`)
          .replace('#include <opaque_fragment>', '  outgoingLight = gCol * gA + gAdd; diffuseColor.a = gA;\n#include <opaque_fragment>');
      };
      gm.customProgramCacheKey = () => 'courbet-glass';
      this.soft = new THREE.Mesh(gg, gm); this.soft.name = 'dark-and-glass'; this.soft.rotation.y = L.yawOut; this.soft.renderOrder = 9; L.add(this.soft);      // (after everything of the room's own that lights the wall and the floor)
    }

    // ---------------------------------------------------------- the sound, on the show's clock: wood, glass, water
    const sc = this.score = score(L);
    sc.hit(T_SLIDE[0], { d: T_SLIDE[1] - T_SLIDE[0], vol: 0.018, lp: 380, hp: 70, attack: 0.3 });                   // the counter drawn over the boards
    sc.note(T_SLIDE[1] - 0.03, 78, 0.2, { vol: 0.024, type: 'sine', to: 55, attack: 0.014 });
    sc.note(T_SLIDE[1] + 0.03, hz('A6'), 0.7, { vol: 0.005, type: 'sine', attack: 0.01 });                            // the glass answers
    const ring = (t, n, vol = 0.017, len = 1.3) => { const f = hz(n); sc.note(t, f, len, { vol, type: 'sine', attack: 0.006 }); sc.note(t, f * 2.76, len * 0.3, { vol: vol * 0.22, type: 'sine', attack: 0.004 }); };
    STEMS.forEach((s, i) => {
      if (s.name !== 'peony') { ring(s.in - 0.04, s.note, s.name === 'lily' ? 0.02 : 0.016); sc.note(s.in - 0.06, 520 + 40 * i, 0.07, { vol: 0.007, type: 'sine', to: 980 + 60 * i, attack: 0.005 }); }      // a ring, and the water taking the stem
      else { ring(s.in - 0.04, 'D5', 0.02, 1.6); ring(s.in - 0.04, 'A4', 0.016, 1.6); sc.note(s.in - 0.04, hz(s.note), 0.3, { vol: 0.02, type: 'sine', to: 120, attack: 0.01 }); }
    });
    // the sprig is in: one long chord on the glass
    [['D5', 0.014], ['A5', 0.014], ['F#6', 0.016], ['D4', 0.008]].forEach(([n, v], i) => sc.note(T_SPRIG[1] - 0.03 + i * 0.05, hz(n), 3.6, { vol: v, type: 'sine', attack: 0.09 }));
    sc.done();
    // the carafe rocking after the peony: when it passes upright (a tick of glass on marble each time)
    this.ticks = []; for (let n = 1; n < 12; n++) { const tau = (-0.8 + Math.sqrt(0.64 + 4 * 1.5 * n / 2)) / 3; if (tau < 1.7) this.ticks.push(tau); }
    this.hide();
  },

  hide() { this.aSize.array.fill(0); this.aSize.needsUpdate = true; },
  start(L) { this.T = L.t; this.score.from(L.t); this.tick = 0; while (this.tick < this.ticks.length && T_ROCK + this.ticks[this.tick] < L.t) this.tick++; },
  back(L) { this.bT = this.T || 0; },
  end(L) { this.hide(); },
  reset(L) { this.hide(); this.T = 0; },

  // Going back: how far a thing has gone between these two moments of the Return (0 while the show is on).
  gone(a, b) { return this.R < 0 ? 0 : ease.inOut(ramp(this.R, a, b)); },
  // The carafe's lean after the peony lands (radians, towards the right): right over, slowly, at first; then back, and
  // quicker as it rocks smaller.
  rock(T, calm) {
    const tau = (T - T_ROCK) * (calm ? 0.5 : 1); if (tau <= 0 || tau > 3.2) return 0;
    return (calm ? 0.03 : 0.125) * Math.exp(-2.1 * tau) * Math.sin(TAU * (0.8 * tau + 1.5 * tau * tau));
  },
  // Stage point (b: along, up from the marble, out, in the carafe's own terms) into the world, rocked with the carafe.
  place(b, rk, out) {
    let x = b.x, y = b.y; const B = this.base, X = this.X, Z = this.Zo;
    if (rk) { const px = rk > 0 ? FOOT : -FOOT, c = Math.cos(rk), s = Math.sin(rk), dx = x - px; x = px + dx * c + y * s; y = -dx * s + y * c; }
    return out.set(B.x + X.x * x + Z.x * b.z, B.y + CH + y, B.z + X.z * x + Z.z * b.z);
  },
  dir(x, y, z, rk, o, i) {
    if (rk) { const c = Math.cos(rk), s = Math.sin(rk), x2 = x * c + y * s; y = -x * s + y * c; x = x2; }
    const X = this.X, Z = this.Zo; o[i] = X.x * x + Z.x * z; o[i + 1] = y; o[i + 2] = X.z * x + Z.z * z;
  },

  update(L, dt) {
    const back = L.phase === 'return', T = back ? this.bT : (this.T = L.t), R = back ? L.ret : 0, calm = L.calm, voice = L.voice();
    if (!back) this.score.play(T);
    this.R = back ? R : -1;
    const v = this.v, a = this.a, D = this.D, AP = this.aPos.array, AA = this.aAx.array, AS = this.aSize.array, AF = this.aFx.array;

    // ---- his dark gathers; the counter and the carafe come out of the foot of the wall, and go back last of all
    const kS = (calm ? ease.inOut : ease.out)(ramp(T, T_SLIDE[0], T_SLIDE[1])) * (1 - this.gone(0.62, 0.94));
    L.floor(U0, OUT0 - SLIDE * (1 - kS), this.base);
    this.slab.position.copy(this.base); this.soft.position.copy(this.base);
    const rk = this.rock(T, calm) * (1 - this.gone(0, 0.2));
    // (glass on marble, each time it passes upright)
    if (!back && !calm && !L.quiet && voice.ctx) while (this.tick < this.ticks.length && T >= T_ROCK + this.ticks[this.tick]) { const k = this.tick++; if (T - T_ROCK - this.ticks[k] < 0.1) { noise(voice, 0, { d: 0.035, vol: 0.02 * Math.exp(-1.4 * this.ticks[k]), hp: 2400, attack: 0.001 }); voice.note(1900 + 60 * k, 0.12, { vol: 0.006 * Math.exp(-1.4 * this.ticks[k]), type: 'sine', attack: 0.002 }); } }

    // ---- how far each stem has come (0: in the wall, 1: in the carafe); going back, last in is first out
    const NG = STEMS.length, s = this.s; let landed = 0;
    for (let g = 0; g < NG; g++) {
      const f = this.fl[g], a0 = 0.08 + 0.055 * (NG - 1 - g);
      s[g] = clamp01((T - (f.in - f.fly)) / f.fly) * (1 - this.gone(a0, a0 + 0.26));
      landed += ease.smooth(ramp(T, f.in - 0.1, f.in + 0.3)) * (1 - this.gone(a0, a0 + 0.1));
      // (its lean comes round from out of the wall to along it as it stands up)
      const k = ease.inOut(ramp(s[g], 0.2, f.sA)), x = f.dx + (f.ex - f.dx) * k, z = f.dz + (f.ez - f.dz) * k, l = Math.hypot(x, z); f.lx = x / l; f.lz = z / l;
    }
    const sprigP = ramp(T, T_SPRIG[0], T_SPRIG[1]) * (1 - this.gone(0, 0.24));
    const lit = back ? 0 : ease.smooth(ramp(T, T_LIT[0], T_LIT[1]));          // (whole: it stands a little brighter, slowly)
    const gu = this.gu;
    gu.uRock.value = rk; gu.uBq.value = landed / NG; gu.uUnslide.value = SLIDE * (1 - kS); gu.uBase.value.copy(this.base).y += CH;
    gu.uDk.value = ease.smooth(ramp(T, T_DARK[0], calm ? 2.6 : T_DARK[1])) * (1 - this.gone(calm ? 0.3 : 0.55, 1)); gu.uLit.value = lit * (1 - this.gone(0, 0.3));
    gu.uWater.value = (0.082 + 0.0035 * landed) * G;
    { // the water: set rocking when the counter stops, by each stem, and by the carafe itself
      let sl = 0; const t0 = T - T_SLIDE[1]; if (t0 > 0) sl += (calm ? 0.05 : 0.16) * Math.exp(-2.4 * t0) * Math.sin(t0 * (calm ? 5 : 9));
      for (const f of this.fl) { const t1 = T - f.in; if (t1 > 0 && t1 < 2.5) sl += 0.06 * Math.exp(-3.2 * t1) * Math.sin(t1 * (calm ? 6 : 12)); }
      gu.uSlosh.value = (sl - 0.6 * this.rock(T - 0.07, calm)) * (1 - this.gone(0, 0.5));
    }

    // ---- the bouquet
    for (let i = 0; i < this.NB; i++) {
      const d = D[i], g = d.g, f = this.fl[g], sg = s[g], j3 = i * 3;
      if (sg <= 0.001) { AS[j3] = AS[j3 + 1] = 0; continue; }
      // the turn and the tilt, a little late towards the tip of a spray; over the lip it hangs, leaning a little more
      const sr = clamp01(sg * (1 + 0.14 * d.far) - 0.14 * d.far), sA = f.sA, sH = f.sH;
      const tilt = sr < sA ? TILT0 + (TILT_A - TILT0) * ease.inOut(ramp(sr / sA, 0.22, 1)) : sr < sH ? TILT_A + (calm ? 0.03 : 0.09) * Math.sin(PI * (sr - sA) / (sH - sA)) : TILT_A * (1 - ease.smooth((sr - sH) / (1 - sH)));
      const twist = f.twist * (1 - ease.inOut(ramp(sr, 0.1, sA + 0.1)));
      // where the stem is held (at the height of the lip, when it is home)
      if (sg < sA) { const k = ease.smooth(sg / sA), m = 1 - k; v.set(m * m * f.S.x + 2 * m * k * f.C.x + k * k * f.A.x, m * m * f.S.y + 2 * m * k * f.C.y + k * k * f.A.y, m * m * f.S.z + 2 * m * k * f.C.z + k * k * f.A.z); }
      else if (sg < sH) { v.copy(f.A); v.y += (calm ? 0.006 : 0.018) * Math.sin(PI * (sg - sA) / (sH - sA)); }
      else { const k = (sg - sH) / (1 - sH), e = calm ? ease.inOut(k) : k * k; v.lerpVectors(f.A, f.M, e); }
      // it settles when it lands, and is nudged by each one after it; then it only stirs
      let wx = 0, wz = 0;
      if (sg >= 1 && !back) {
        for (let h = g; h < NG; h++) { const t1 = T - this.fl[h].in; if (t1 <= 0 || t1 > 2.2) continue; const am = (h === g ? 0.08 : h === NG - 1 ? 0.04 : 0.024) * (calm ? 0.4 : 1) * Math.exp(-4.0 * t1) * Math.sin(t1 * (calm ? 7 : 13)), an = g * 2.4 + h * 1.3; wx += am * (h === g ? f.ex : Math.cos(an)); wz += am * (h === g ? f.ez : Math.sin(an)); }
        const t2 = T - T_SPRIG[1]; if (t2 > 0 && t2 < 3) { const am = 0.03 * (calm ? 0.5 : 1) * Math.exp(-1.6 * t2) * Math.sin(t2 * 4.2); wx += am * Math.cos(g * 0.8); wz += am * Math.sin(g * 0.8); }      // (the bouquet breathes out as the sprig goes in)
        wx += 0.011 * Math.sin(T * 0.9 + g * 1.7); wz += 0.008 * Math.sin(T * 0.7 + g * 2.9);
      }
      // the dab itself: turned on the stalk, tilted the way the stem leans, swayed
      const ct = Math.cos(twist), st = Math.sin(twist), cq = Math.cos(tilt), sq = Math.sin(tilt), Ax = f.lz, Az = -f.lx;
      let x = d.x * ct + d.z * st, y = d.ry, z = -d.x * st + d.z * ct, ex = d.ax * ct + d.az * st, ey = d.ay, ez = -d.ax * st + d.az * ct;
      if (tilt > 1e-4) {
        // (Rodrigues, about the level axis across the lean)
        let kd = Ax * x + Az * z, cx = -Az * y, cy = Az * x - Ax * z, cz = Ax * y;
        const x1 = x * cq + cx * sq + Ax * kd * (1 - cq), y1 = y * cq + cy * sq, z1 = z * cq + cz * sq + Az * kd * (1 - cq);
        x = x1; y = y1; z = z1;
        kd = Ax * ex + Az * ez; cx = -Az * ey; cy = Az * ex - Ax * ez; cz = Ax * ey;
        const e1 = ex * cq + cx * sq + Ax * kd * (1 - cq), e2 = ey * cq + cy * sq, e3 = ez * cq + cz * sq + Az * kd * (1 - cq);
        ex = e1; ey = e2; ez = e3;
      }
      if (wx || wz) { const k = y > 0 ? 1 : 0.25, yy = y; y -= (x * wx + z * wz) * k; x += yy * wx * k; z += yy * wz * k; }
      a.set(v.x + x, v.y + y, v.z + z); this.place(a, rk, v);
      AP[j3] = v.x; AP[j3 + 1] = v.y; AP[j3 + 2] = v.z; this.dir(ex, ey, ez, rk, AA, j3);
      AS[j3] = d.len; AS[j3 + 1] = d.wid; AS[j3 + 2] = d.mode; AF[i * 2] = d.lit * (1 + 0.1 * lit); AF[i * 2 + 1] = 0;
    }

    // ---- the sprig: down from under the frame on the right, turning; across over the marble; and into the heart of it
    {
      const p = sprigP, on = p > 0.001;
      if (on) {
        const e = p < 0.86 ? 0.9 * (0.45 * (p / 0.86) + 0.55 * ease.smooth(p / 0.86)) : 0.9 + 0.1 * ease.out((p - 0.86) / 0.14);
        this.sprigWay.getPointAt(clamp01(e), this.sprigAt);
      }
      const spin = (calm ? 1.1 : 2.3) * TAU * (1 - ease.out(ramp(p, 0.04, 0.97))), sway = 0.3 * Math.sin(p * 11) * (1 - ramp(p, 0.72, 0.95)) * ramp(p, 0.12, 0.3);
      const lie = TILT0 * (1 - ease.inOut(ramp(p, 0.02, 0.24))) + 0.3 * ease.smooth(ramp(p, 0.84, 1)), size = 1.8 - 0.5 * ease.smooth(ramp(p, 0.78, 1));
      const cs = Math.cos(spin), sn = Math.sin(spin), cl = Math.cos(lie), sl = Math.sin(lie), cw = Math.cos(sway), sw = Math.sin(sway);
      const bq = p >= 1 && !back ? 0.011 * Math.sin(T * 0.9 + 2.1) : 0;
      for (let i = this.NB; i < this.NB + this.NS; i++) {
        const d = D[i], j3 = i * 3;
        if (!on) { AS[j3] = AS[j3 + 1] = 0; continue; }
        // turned on its stalk; leaning out of the wall as it comes, and forward a little when it is home; swinging as it crosses
        let x = (d.x * cs + d.z * sn) * size, y = d.y * size, z = (-d.x * sn + d.z * cs) * size, ex = d.ax * cs + d.az * sn, ey = d.ay, ez = -d.ax * sn + d.az * cs;
        let y1 = y * cl - z * sl, z1 = y * sl + z * cl; y = y1; z = z1; y1 = ey * cl - ez * sl; z1 = ey * sl + ez * cl; ey = y1; ez = z1;
        let x1 = x * cw + y * sw; y1 = -x * sw + y * cw; x = x1; y = y1; x1 = ex * cw + ey * sw; y1 = -ex * sw + ey * cw; ex = x1; ey = y1;
        a.set(this.sprigAt.x + x + bq * y * 4, this.sprigAt.y + y, this.sprigAt.z + z); this.place(a, p >= 1 ? rk : 0, v);
        AP[j3] = v.x; AP[j3 + 1] = v.y; AP[j3 + 2] = v.z; this.dir(ex, ey, ez, 0, AA, j3);
        AS[j3] = d.len * size; AS[j3 + 1] = d.wid * size; AS[j3 + 2] = d.mode; AF[i * 2] = d.lit * (1 + 0.1 * lit); AF[i * 2 + 1] = 0;
      }
    }

    // ---- a petal lets go: two when the carafe rocks, one as the sprig goes in, then one now and then; they lie on the marble
    for (let j = 0; j < NFALL; j++) {
      const i = this.NB + this.NS + j, j3 = i * 3; let n = j;
      while (fallAt(n + NFALL) <= T) n += NFALL;
      const age = T - fallAt(n), src = n === 1 ? D[this.peonyAt] : D[this.mays[(n * 7 + 3) % this.mays.length]], h0 = src.y, fall = 0.75 + h0 * 1.5, fade = this.gone(0.05, 0.4);
      if (age <= 0 || age > fall + 9 || fade >= 1) { AS[j3] = AS[j3 + 1] = 0; continue; }
      const q = Math.min(1, age / fall), side = n % 2 ? 1 : -1, tx = Math.max(-0.16, Math.min(0.34, src.x + side * (0.03 + 0.012 * (n % 3)) + 0.02)), tz = Math.min(0.2 - 0.3 * (tx + 0.22), src.z + 0.07 + 0.02 * (n % 4));
      if (q < 1) {
        const fl = age * (calm ? 2.2 : 4.5) + n;
        a.set(src.x + (tx - src.x) * q + 0.028 * Math.sin(fl) * (1 - q), 0.006 + h0 * (1 - Math.pow(q, 1.5)), src.z + (tz - src.z) * q); this.place(a, 0, v);
        this.dir(Math.cos(fl * 0.7), Math.sin(fl * 0.7), 0, 0, AA, j3); AS[j3 + 2] = FACING;
      } else { a.set(tx, 0.0035 + 0.0004 * j, tz); this.place(a, 0, v); this.dir(Math.cos(n * 1.9), 0, Math.sin(n * 1.9), 0, AA, j3); AS[j3 + 2] = FLAT; }
      AP[j3] = v.x; AP[j3 + 1] = v.y; AP[j3 + 2] = v.z; AS[j3] = D[i].len; AS[j3 + 1] = D[i].wid;
      AF[i * 2] = 1.02; AF[i * 2 + 1] = Math.max(fade * 1.2, ease.in(ramp(age, fall + 7.5, fall + 9)) * 1.2);
    }
    this.aPos.needsUpdate = true; this.aAx.needsUpdate = true; this.aSize.needsUpdate = true; this.aFx.needsUpdate = true;
    voice.level = calm ? 0.7 : 1; voice.place();
  },
});
