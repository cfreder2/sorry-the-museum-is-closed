// Gustave Courbet, Mère Grégoire (1855, reworked 1857-59), Gallery 222. The word: bouquet.
//
// A dark picture: a woman in black behind a marble counter, a brown wall, a band of deep red. The only living colour
// in it is flowers: on the left a glass carafe holding a bouquet (sprays of white may blossom, ivy climbing out of
// the top, a white lily, a crimson peony, a sprig of honeysuckle, long green leaves), and on the right one small
// sprig, turquoise, white and red, held up between finger and thumb. The museum's note says he began with the head
// alone and built the rest round it, piece by piece, two years later. So that is what happens under the picture:
// the still life is put together, piece by piece, a little larger than he painted it.
//
// A corner of the grey marble slides out from the foot of the wall (his marble: dark, with pale paint dragged over
// it by the knife), the carafe riding on it, the water in it rocking when the slab stops. Then the flowers come, each
// stem out from under the frame, straight below where it is painted, head first; it swings upright over the
// carafe and slides in, the glass rings, and the stems already there shift to make room: the ivy, two sprays of
// may, the leaves, the honeysuckle, the lily. The peony comes last and is heavy: the carafe rocks on the marble,
// tick, tick, quicker and smaller, and stands. A hush. Then, from under the frame on the right, below the hand that
// holds it, the little sprig comes down turning, as a flower turns when it is rolled between finger and thumb,
// crosses under the label and tucks itself into the heart of the bouquet, between the white lily and the red peony:
// blue, white and red together, which the museum reads as his quiet tricolour. One long note on the glass; a petal
// of may lets go. While you keep looking the bouquet stirs a little and a petal falls now and then onto the marble.
// When you stop, the stems lift out, last in first out, and go back under the frame, and the marble slides home.
//
// Everything in the bouquet is a mark of paint (one draw call of brush dabs that face you, each lying along its own
// stalk or petal in space, lit from the upper left as he lit them, darker towards the back and at its own edge, as
// paint laid on a dark ground is); the carafe is glass with his scraped highlight down its left side, and water in it
// that stays level; the marble is a slab with a painted top; the shadows (on the floor, on the marble, on the wall
// behind) are in the glass's draw call. Three draw calls. Nothing is solid and nothing is left behind. The only music
// is the glass: the picture's own song (Béranger's "Madame Grégoire", of the 1820s) is a drinking song with ribald
// verses, and is not played here. With "Reduce motion and flashing" on, the carafe barely rocks, the sprig turns at
// half speed, nothing overshoots, and nothing brightens quickly.
//
// What it does not do: the woman stays in her picture (no figure, no hand, no face, and nothing made of her age or
// her size, which her first critics mocked), and the coins, the ledger and the bell on her counter, which are the
// business of her house, stay there with her; nor is the sprig held out to the toy or to you. The show keeps to the
// flowers because they are the part of this picture that is for everyone.
import * as THREE from 'three';
import { lifeFor, ease, ramp, clamp01, canvasTexture, rng } from '../paintlife.js';
import { score, noise } from './stagecraft.js';
import { hz } from './tunes.js';

const PI = Math.PI, TAU = PI * 2;
// The picture is 843 px wide here and 0.97 m on the wall (1.15 mm to the pixel); the still life is built from it at
// not quite half as large again. Pixel (135, 864) is the middle of the carafe's foot.
const K = 0.00165, G = K / 0.00144, PX = x => (x - 135) * K, PY = y => (864 - y) * K, DZ = 0.1;
const U0 = -0.25, OUT0 = 0.2;                // where the carafe stands: along the wall from the picture's middle, out from it
const SLAB_H = 0.04, SLIDE = 0.72;           // the marble: how thick, and how far it has to come out of the wall
const SLAB = [[-0.34, -0.17], [0.4, -0.17], [0.37, 0.17], [-0.27, 0.23]];      // its corners (along, out) round the carafe's foot
const MOUTH = 164 * K, FOOT = 0.03 * G;       // the carafe's lip above the marble; the rim of its foot, which it rocks on
const LABEL = [0, 0.8, 0.16, 0.13];           // the wall label under the picture (along, up; half sizes with its glow): kept clear
const T_SLAB = [0.15, 1.05];
// The stems, in the order they come: when each is in, how long its flight is, where it comes out under the frame
// (metres along the wall from the picture's middle), which way its head leans as it comes ([along, out]), how far it
// turns on its own stalk on the way, and the note the glass gives.
const STEMS = [
  { name: 'ivy', in: 1.85, fly: 1.0, us: -0.3, lean: [0.2, 1], twist: -0.9, note: 'D5', tall: true },
  { name: 'may', in: 2.3, fly: 0.95, us: -0.4, lean: [-0.35, 1], twist: 0.8, note: 'F#5' },
  { name: 'may2', in: 2.7, fly: 0.95, us: -0.26, lean: [0.4, 1], twist: -0.8, note: 'A5', tall: true },
  { name: 'leaves', in: 3.1, fly: 0.9, us: -0.4, lean: [-0.25, 1], twist: 0.7, note: 'E5' },
  { name: 'leaves2', in: 3.45, fly: 0.9, us: -0.25, lean: [0.3, 1], twist: -0.7, note: 'B5' },
  { name: 'honeysuckle', in: 3.95, fly: 1.0, us: -0.3, lean: [0.35, 1], twist: 0.9, note: 'D6' },
  { name: 'lily', in: 4.55, fly: 1.05, us: -0.38, lean: [-0.3, 1], twist: -0.8, note: 'E6' },
  { name: 'peony', in: 5.35, fly: 1.15, us: -0.28, lean: [0.3, 1], twist: 0.6, note: 'D4' },
];
const G_SPRIG = STEMS.length, T_ROCK = STEMS[7].in, T_SPRIG = [6.0, 7.8];
const START_H = 0.7, START_OUT = -0.64, TILT0 = 1.85, TILT_A = 0.62, S_A = 0.7, INSERT = 0.13;
const NFALL = 6, FALL_AT = [T_ROCK + 0.18, T_ROCK + 0.5, T_SPRIG[1] + 0.25];
// when the nth petal lets go: two as the carafe rocks, one as the sprig goes in, then one every few seconds
const fallAt = m => (m < FALL_AT.length ? FALL_AT[m] : T_SPRIG[1] + 2.6 + (m - FALL_AT.length) * 3.1);
const K_DAB = 0, K_LEAF = 1, K_MAY = 2, K_IVY = 3, K_PETAL = 4, K_CURL = 5, K_STEM = 6, K_CUP = 7;
const FACING = 0, AXIAL = 1, FLAT = 2;
// The colours, as the eye takes them in the picture (a shade, and its light): mixed a little towards the picture's
// own palette when it is built.
const PAINT = {
  ivy: ['#2e3c26', '#748459'], ivyD: ['#212d1c', '#506045'],
  leaf: ['#163828', '#4c7d60'], leafB: ['#17483a', '#5a947a'], leafD: ['#112319', '#2e4b37'],
  mass: ['#101a12', '#2a3d2b'], stem: ['#22241a', '#55553a'],
  may: ['#7c795f', '#e3dbc1'], bud: ['#6f7450', '#c9c8a2'], lily: ['#8c896f', '#ede4cb'],
  peonyD: ['#3e0f0a', '#772118'], peony: ['#6e1d15', '#b25345'], peonyL: ['#9a5246', '#d99e8c'], heart: ['#230806', '#3f100b'],
  honey: ['#823e1e', '#c98458'], honeyL: ['#a8633e', '#e1af89'],
  blue: ['#195c58', '#5db1a7'], white: ['#9e9981', '#ebe4ce'], red: ['#7d2518', '#c9654d'],
};

lifeFor(4428, {
  title: /^Mère Grégoire/,
  word: 'bouquet',
  stage: { out: 0.9, half: 0.8, cam: { dist: 2.45, side: 0.1, height: 0.76, fov: 60, lookU: -0.03, lookOut: 0.3, lookH: 0.97 } },
  wake: 2, ret: 2.2,

  build(L) {
    const P = L.pal, col = (h, a = 0.1) => P.near(h, a), rnd = L.rand;
    this.X = new THREE.Vector3(L.tx, 0, L.tz); this.Zo = new THREE.Vector3(L.nx, 0, L.nz);
    this.base = new THREE.Vector3(); this.v = new THREE.Vector3(); this.a = new THREE.Vector3();

    // ---------------------------------------------------------- the bouquet, dab by dab, from the picture
    // (x, y in the picture's pixels; z: how far to the front, -1..1; sizes in pixels; angles in the picture's plane)
    const D = [];
    const dab = (g, kind, x, y, z, len, wid, ang, pair, o = {}) => {
      const t = o.tilt == null ? z * 0.45 : o.tilt, a = ang * PI / 180;
      D.push({ g, kind, pair, mode: o.mode == null ? (kind === K_LEAF || kind === K_STEM || kind === K_PETAL || kind === K_CURL ? AXIAL : FACING) : o.mode,
        x: PX(x), y: PY(y), z: z * DZ, len: len * K, wid: wid * K, ax: Math.cos(a) * Math.cos(t), ay: Math.sin(a) * Math.cos(t), az: Math.sin(t), seed: 0.37 + D.length * 1.713 });
    };
    const stalk = (g, pts, z, pair = 'stem', wid = 3.4) => { for (let i = 1; i < pts.length; i++) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i]; dab(g, K_STEM, (x0 + x1) / 2, (y0 + y1) / 2, z, Math.hypot(x1 - x0, y1 - y0) * 1.1, wid, Math.atan2(y0 - y1, x1 - x0) * 180 / PI, pair, { tilt: 0 }); } };
    // may: small five-petalled blossoms, no two the same size or turned the same way, some seen edge on; a bud here and there
    const may = (g, list, z0) => list.forEach(([x, y, s = 1], i) => {
      const z = z0 + 0.35 * Math.sin(i * 2.4), len = 18 * s * (0.85 + 0.35 * rnd());
      dab(g, K_MAY, x, y, z, len, len * (0.6 + 0.4 * rnd()), rnd() * 360, 'may');
      if (i % 3 === 1) { const a = rnd() * TAU; dab(g, K_DAB, x + 13 * Math.cos(a), y + 13 * Math.sin(a), z - 0.05, 7, 6, rnd() * 360, 'bud'); }
    });
    // the dark of the bouquet: broad touches of near-black green, and a dark leaf across each
    const dark = (g, list) => list.forEach(([x, y, r, z], i) => {
      dab(g, K_DAB, x, y, z, r * 2.3, r * 1.6, rnd() * 180, 'mass');
      dab(g, K_LEAF, x + (rnd() - 0.5) * 16, y + (rnd() - 0.5) * 16, z + 0.08, r * 1.7, r * 0.62, rnd() * 360, i % 2 ? 'leafD' : 'ivyD');
    });
    // each stem's cut end, down in the water
    STEMS.forEach((s, g) => { const a = g * 2.4, r = 9 + 5 * Math.sin(g * 1.7); stalk(g, [[135 + 5 * Math.cos(a), 702], [135 + r * Math.cos(a), 838 - 6 * (g % 3)]], 0.12 * Math.sin(a), 'stem', 3.2); });
    // 0  the ivy: a spray climbing out of the top, and a shoot of it trailing off to the left
    stalk(0, [[136, 704], [140, 640], [146, 570], [152, 500], [160, 442], [165, 404]], -0.25);
    stalk(0, [[146, 562], [112, 522], [72, 497], [36, 482]], -0.45, 'stem', 2.8);
    [[165, 400, 17, 80], [150, 426, 26, 120], [173, 451, 23, 30], [146, 469, 27, 150], [167, 491, 25, 10], [138, 513, 27, 160], [111, 424, 21, 100], [121, 456, 22, 200],
      [96, 506, 25, 140], [67, 489, 25, 100], [40, 477, 22, 160], [25, 501, 19, 220], [56, 516, 21, 250]]
      .forEach(([x, y, s, ang], i) => dab(0, K_IVY, x, y, -0.3 + 0.3 * Math.sin(i * 1.9), s * 1.4, s * (1.05 + 0.3 * rnd()), ang + (rnd() - 0.5) * 30, i % 3 ? 'ivy' : 'ivyD'));
    // 1  a spray of may, to the left
    stalk(1, [[133, 703], [110, 640], [85, 590], [60, 560], [40, 546]], 0.1, 'stem', 2.8);
    may(1, [[63, 537], [77, 537, 1.1], [70, 549], [43, 583, 1.1], [21, 590], [33, 597], [100, 550, 1.1], [110, 553], [105, 563], [123, 573], [117, 581, 1.1], [52, 572, 0.9], [88, 578, 0.9]], 0.35);
    [[52, 560, 200], [88, 566, 20], [30, 577, 160], [112, 566, -30]].forEach(([x, y, ang]) => dab(1, K_LEAF, x, y, 0.1, 24, 10, ang, 'leaf'));
    // 2  another, to the right and up through the middle
    stalk(2, [[137, 703], [150, 640], [160, 590], [162, 540], [158, 516]], 0.0, 'stem', 2.8);
    stalk(2, [[160, 590], [190, 560], [205, 531]], 0.15, 'stem', 2.4); stalk(2, [[150, 562], [120, 502], [96, 476]], -0.1, 'stem', 2.4);
    may(2, [[157, 513, 1.1], [163, 524], [152, 550], [147, 561, 1.1], [203, 523], [207, 537, 1.1], [200, 560], [90, 468, 1.1], [100, 480], [96, 491], [208, 620], [181, 628, 0.9], [147, 650], [154, 658, 0.9], [133, 664], [217, 657, 0.9]], 0.4);
    [[185, 546, 40], [175, 531, 110], [120, 491, 150], [215, 601, -10]].forEach(([x, y, ang]) => dab(2, K_LEAF, x, y, 0.15, 24, 10, ang, 'leaf'));
    // 3  the long leaves on the left, and the dark of the bouquet behind them
    stalk(3, [[132, 704], [112, 660], [90, 612]], 0.2);
    dark(3, [[70, 600, 30, 0.0], [100, 598, 34, -0.2], [60, 640, 28, 0.1], [95, 668, 30, 0.2], [120, 640, 30, -0.1], [45, 560, 24, -0.3], [85, 522, 26, -0.4], [110, 718, 20, 0.3], [80, 580, 34, -0.8], [112, 630, 36, -0.9]]);
    dab(3, K_LEAF, 67, 565, 0.5, 54, 21, 138, 'leafB'); dab(3, K_LEAF, 72, 692, 0.6, 94, 23, -112, 'leaf');
    dab(3, K_LEAF, 47, 640, -0.2, 50, 19, -122, 'leafD'); dab(3, K_LEAF, 107, 701, 0.75, 48, 16, -110, 'leaf');
    // 4  the leaves on the right
    stalk(4, [[138, 704], [165, 665], [200, 640]], 0.2);
    dark(4, [[170, 560, 30, -0.1], [200, 600, 32, 0.0], [215, 660, 30, 0.1], [170, 640, 34, 0.0], [150, 600, 34, -0.2], [185, 700, 26, 0.3], [140, 680, 26, 0.2], [230, 610, 22, -0.2], [190, 610, 36, -0.85], [160, 668, 34, -0.9]]);
    dab(4, K_LEAF, 224, 703, 0.4, 50, 21, -34, 'leaf'); dab(4, K_LEAF, 155, 719, 0.8, 42, 15, -75, 'leaf'); dab(4, K_LEAF, 232, 565, 0.2, 56, 19, 49, 'leafB');
    dab(4, K_LEAF, 194, 727, 0.5, 42, 17, -51, 'leafD'); dab(4, K_LEAF, 243, 645, -0.2, 32, 15, -20, 'leafD');
    // 5  the honeysuckle: straps of orange-pink curling back from the middle
    stalk(5, [[138, 703], [160, 650], [172, 598]], 0.45, 'stem', 2.8);
    [150, 108, 68, 28, -12, 196, -140].forEach((ang, i) => { const a = ang * PI / 180; dab(5, K_CURL, 172 + 15 * Math.cos(a), 590 - 15 * Math.sin(a), 0.6 + 0.08 * i, 32, 10, ang, i % 2 ? 'honeyL' : 'honey', { tilt: 0.35 }); });
    dab(5, K_DAB, 172, 590, 0.7, 9, 8, 0, 'peonyD'); dab(5, K_LEAF, 192, 602, 0.5, 26, 11, 20, 'leafB'); dab(5, K_LEAF, 158, 606, 0.5, 22, 10, 200, 'leaf');
    // 6  the lily: pointed white petals, grey-green at the throat, and the bright leaf under it
    stalk(6, [[134, 703], [118, 666], [100, 646]], 0.7, 'stem', 3.2);
    [135, 84, 6, -96, 200].forEach((ang, i) => { const a = ang * PI / 180; dab(6, K_PETAL, 97 + 16 * Math.cos(a), 637 - 16 * Math.sin(a), 0.85 + 0.03 * i, 36, 20, ang, 'lily', { tilt: 0.3 }); });
    dab(6, K_DAB, 97, 637, 0.97, 9, 8, 0, 'bud'); dab(6, K_DAB, 100, 634, 1.0, 4, 4, 0, 'honeyL'); dab(6, K_LEAF, 131, 619, 0.95, 44, 15, -20, 'leafB');
    // 7  the peony: a dark crimson ball of cupped petals, redder within, touched with pink where the light is
    stalk(7, [[139, 703], [165, 690], [178, 681]], 0.7, 'stem', 3.8);
    dab(7, K_DAB, 180, 676, 0.66, 54, 50, 20, 'peonyD');
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + 0.4; dab(7, K_CUP, 180 + 17 * Math.cos(a), 675 - 16 * Math.sin(a), 0.74 + 0.01 * i, 31, 23, a * 180 / PI + 90, i === 1 || i === 2 ? 'peony' : 'peonyD'); }
    for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + 1.2; dab(7, K_CUP, 180 + 8 * Math.cos(a), 675 - 8 * Math.sin(a), 0.84 + 0.01 * i, 21, 16, a * 180 / PI + 90, i < 2 ? 'peonyL' : 'peony'); }
    dab(7, K_DAB, 181, 677, 0.92, 8, 7, 0, 'heart'); dab(7, K_DAB, 172, 663, 0.93, 12, 7, 35, 'peonyL');
    dab(7, K_LEAF, 204, 690, 0.6, 26, 12, -30, 'leafD'); dab(7, K_LEAF, 160, 694, 0.65, 24, 11, 215, 'leafD');
    const NB = D.length;
    // 8  the sprig: in metres round the middle of its head (it is made larger than the rest, to be seen crossing the wall)
    const sp = (kind, x, y, z, len, wid, ang, pair, tilt = 0) => { const a = ang * PI / 180; D.push({ g: G_SPRIG, kind, pair, mode: kind === K_DAB ? FACING : AXIAL, x, y, z, len, wid, ax: Math.cos(a) * Math.cos(tilt), ay: Math.sin(a) * Math.cos(tilt), az: Math.sin(tilt), seed: 0.61 + D.length * 1.713 }); };
    sp(K_STEM, 0.004, -0.045, 0, 0.075, 0.0055, 82, 'stem'); sp(K_STEM, 0.004, -0.108, 0, 0.062, 0.005, 96, 'stem');
    sp(K_LEAF, 0.02, -0.062, 0.006, 0.036, 0.013, 25, 'leafB'); sp(K_LEAF, -0.013, -0.085, -0.006, 0.032, 0.012, 160, 'leaf');
    [[-0.024, 0.006, 0.012, 170], [-0.007, 0.022, -0.012, 100], [0.013, 0.005, 0.016, 10], [-0.013, -0.013, -0.006, 230], [0.004, -0.004, 0.02, 300], [0.002, 0.012, -0.02, 60]]
      .forEach(([x, y, z, ang]) => sp(K_DAB, x, y, z, 0.03, 0.023, ang, 'blue'));
    sp(K_DAB, 0.026, 0.021, 0.004, 0.025, 0.02, 40, 'white'); sp(K_DAB, 0.031, -0.008, -0.01, 0.024, 0.019, -20, 'red'); sp(K_DAB, -0.02, 0.033, 0.006, 0.019, 0.015, 120, 'red');
    const NS = D.length - NB;
    // petals that let go
    for (let j = 0; j < NFALL; j++) D.push({ g: -1, kind: K_DAB, pair: j === 1 ? 'peonyL' : 'may', mode: FACING, x: 0, y: 0, z: 0, len: 0.019, wid: 0.014, ax: 1, ay: 0, az: 0, seed: 3.3 + j * 2.9 });
    const N = this.N = D.length; this.D = D; this.NB = NB; this.NS = NS;
    this.mays = D.map((d, i) => (d.kind === K_MAY ? i : -1)).filter(i => i >= 0);
    // where each dab is from the carafe's lip (the stems are held there as they fly), how far along its stem (so that
    // a spray whips a little as it turns), and the light on it: from the upper left and the front, as in the picture
    for (const d of D) {
      if (d.g === G_SPRIG || d.g < 0) { d.lit = 1.02; d.far = 0; continue; }
      d.ry = d.y - MOUTH; d.far = Math.min(1, Math.hypot(d.x, d.ry, d.z) / 0.48);
      d.lit = Math.max(0.5, Math.min(1.1, 0.8 - d.x / 0.34 * 0.24 + (d.y - 0.42) / 0.34 * 0.14 + d.z / DZ * 0.22)) * (0.9 + 0.2 * rnd());
      if (d.kind === K_STEM && d.y < MOUTH) d.lit = 0.8;
    }
    // where the sprig comes to rest: in the heart of the bouquet, at the front
    this.sprigHome = new THREE.Vector3(PX(147), PY(628), 1.2 * DZ);
    const sx = 0.32 - U0;                                           // (under the frame's right end, below the hand)
    this.sprigWay = new THREE.CatmullRomCurve3([
      new THREE.Vector3(sx, 0.74, -OUT0 - 0.14), new THREE.Vector3(sx, 0.72, -OUT0 + 0.13), new THREE.Vector3(sx - 0.02, 0.56, 0.1),
      new THREE.Vector3(sx - 0.2, 0.42, 0.22), new THREE.Vector3(sx - 0.42, 0.45, 0.22), new THREE.Vector3(this.sprigHome.x + 0.015, this.sprigHome.y + 0.08, this.sprigHome.z + 0.08), this.sprigHome.clone()], false, 'centripetal');
    this.sprigWay.arcLengthDivisions = 300; this.sprigWay.updateArcLengths();
    this.sprigAt = new THREE.Vector3();
    // the flights: from in the wall under the frame, out and over, to a point above the lip, and in
    this.fl = STEMS.map(s => {
      // (its head comes out of the wall pointing into the room, and swings round to lean along the wall as it stands up,
      // so that nothing tall ever leans out towards you over the foot of the picture)
      const l = Math.hypot(s.lean[0], s.lean[1]), dx = s.lean[0] / l, dz = s.lean[1] / l, ex = (s.tall ? -1 : Math.sign(s.lean[0])) * 0.9, ez = 0.436;      // (the tall sprays to the left, clear of the label)
      const S = new THREE.Vector3(s.us - U0, START_H - SLAB_H, START_OUT - OUT0), M = new THREE.Vector3(0, MOUTH, 0);
      const A = new THREE.Vector3(Math.sin(TILT_A) * ex, Math.cos(TILT_A), Math.sin(TILT_A) * ez).multiplyScalar(INSERT).add(M);
      const C = new THREE.Vector3(S.x + (A.x - S.x) * 0.6, S.y + 0.03, 0.36);
      return { ...s, dx, dz, ex, ez, S, C, A, M };
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
      Object.assign(sh.uniforms, { uHeart: { value: v3('#6f7440') }, uThroat: { value: v3('#6c7552') }, uGround: { value: v3('#150f08') } });
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
    // Every mark: a shape (d < 0 inside), and how far towards its light each part of it is (tone), which the brush
    // breaks into streaks along the mark.
    vec2 q = vQ; int T = int(vK.x + 0.5); float sd = vK.y, d = 1.0, tone = 0.0, mixTo = -1.0;
    float n1 = cN(q * 2.6 + sd * 7.0), n2 = cN(q * 7.0 + sd * 3.0), br = cN(vec2(q.x * 1.3 + sd * 3.0, q.y * 9.0 + sd)), lt = dot(q, vLt);
    if (T == 0) {
      // a touch of a loaded brush: round, soft, its light side to the light
      vec2 s = vec2(q.x, q.y - 0.1 * sin(q.x * 2.0 + sd * 5.0));
      d = length(s) - 0.88 + 0.3 * (n1 - 0.5) + 0.12 * (br - 0.5) * abs(q.x);
      tone = lt * 0.75 + 0.6 * (br - 0.5) + 0.3 * (n1 - 0.5);
    } else if (T == 1) {
      // a long leaf from its stalk (x = -1) to its point: dark, with one pale stroke along the side turned to the light
      float x = q.x * 0.5 + 0.5, w = 0.92 * pow(max(sin(3.14159 * pow(x, 0.78)), 0.0), 0.7), y = q.y - 0.16 * sin(q.x * 1.6 + sd * 4.0);
      d = abs(y) - w + 0.1 * (n1 - 0.5);
      float s = y * sign(vLt.y + 1.0e-3) / max(w, 0.25);
      tone = -0.3 + 1.05 * smoothstep(0.0, 0.35, s) * (1.0 - smoothstep(0.6, 1.0, s)) * smoothstep(0.06, 0.3, x) * (1.0 - smoothstep(0.7, 1.0, x)) + 0.6 * (br - 0.5) + 0.25 * lt;
      tone = max(tone, 0.12 * (1.0 - smoothstep(0.02, 0.09, abs(y))) * step(0.12, x));
    } else if (T == 2) {
      // a may blossom: five round petals of unequal size, a dark green heart
      float a = atan(q.y, q.x), r = length(q), ph = 2.5 * a + sd, pet = abs(cos(ph)), kk = mod(floor(ph / 3.14159 + 0.5), 5.0);
      float hk = cH(vec2(kk, sd)), hk2 = cH(vec2(kk + 7.0, sd * 1.3));
      d = r - (0.4 + 0.5 * pow(pet, 0.65) * (0.62 + 0.45 * hk)) + 0.08 * (n1 - 0.5);
      tone = lt * 0.7 + 0.6 * (hk2 - 0.5) + 0.3 * (n1 - 0.5) + 0.12 - 0.25 * (1.0 - smoothstep(0.0, 0.5, pet));
      if (length(q - vec2(0.05, -0.04)) < 0.17 + 0.06 * n1) mixTo = 1.0;
    } else if (T == 3) {
      // an ivy leaf: three soft points, the middle one longest, a pale vein to each
      vec2 p = q + vec2(0.3, 0.0); float a = atan(p.y, p.x), r = length(p);
      float lob = max(pow(max(cos(a), 0.0), 2.0), pow(max(cos(abs(a) - 1.25), 0.0), 3.0) * 0.8);
      d = r - (0.42 + 0.72 * lob) + 0.14 * (n1 - 0.5);
      float vn = min(abs(sin(a)), abs(sin(abs(a) - 1.25))) * r;
      tone = lt * 0.8 + 0.6 * (br - 0.5) - 0.15 + 0.35 * (1.0 - smoothstep(0.012, 0.05, vn));
    } else if (T == 4) {
      // a lily's petal, from the throat (x = -1) to its point, creased down the middle
      float x = q.x * 0.5 + 0.5, w = 0.9 * pow(max(sin(3.14159 * pow(x, 0.62)), 0.0), 0.6);
      d = abs(q.y) - w + 0.06 * (n1 - 0.5);
      tone = lt * 0.8 + 0.4 * (br - 0.5) + 0.15 - 0.5 * (1.0 - smoothstep(0.0, 0.16, abs(q.y))) * (1.0 - x);
      mixTo = 2.0 + smoothstep(0.02, 0.42, x);
    } else if (T == 5) {
      // a strap of honeysuckle, curling back at its tip
      float yc = 0.5 * q.x * q.x - 0.28, w = 0.36 * (1.0 - 0.45 * smoothstep(0.2, 1.0, q.x));
      d = abs(q.y - yc) - w + 0.06 * (n1 - 0.5); if (abs(q.x) > 0.95) d = 1.0;
      tone = q.x * 0.6 + 0.5 * (br - 0.5) + 0.2 * lt;
    } else if (T == 6) {
      // a stalk
      float y = q.y - 0.22 * sin(q.x * 2.2 + sd * 6.0);
      d = abs(y) - 0.66;
      tone = y * sign(vLt.y + 1.0e-3) * 0.8 + 0.4 * (br - 0.5);
    } else {
      // a cupped petal (the peony's): a crescent, its rim catching the light
      float o = length(q) - 0.93;
      d = max(o, 0.7 - length(q - vec2(0.0, 0.52))) + 0.1 * (n1 - 0.5);
      tone = -0.35 + 0.85 * smoothstep(-0.34, -0.06, o) * (0.55 + 0.45 * lt) + 0.5 * (br - 0.5) + 0.3 * lt;
    }
    vec3 c = mix(vCol, vCol2, smoothstep(-0.35, 0.45, tone));
    if (mixTo > 1.5) c = mix(uThroat, c, mixTo - 2.0); else if (mixTo > 0.5) c = uHeart * (0.75 + 0.5 * n2);
    c *= 0.86 + 0.28 * br;
    c = mix(c, uGround, 0.42 * smoothstep(-0.24, 0.0, d));           // (the dark ground it is laid on shows at its edge)
    c *= vFx.x;
    d += vFx.y * (0.2 + 1.5 * n1) + 0.1 * (n2 - 0.5);                 // (going: it breaks up)
    float fw = max(fwidth(d) * 1.2, 0.035), al = 1.0 - smoothstep(-fw, fw, d);
    if (al < 0.06) discard;
    diffuseColor.rgb = c; diffuseColor.a = al;
  }`);
    };
    dm.customProgramCacheKey = () => 'courbet-bouquet';
    this.dabs = L.add(new THREE.Mesh(geo, dm)); this.dabs.name = 'dabs';

    // ---------------------------------------------------------- the marble: a slab with a painted top
    const marble = canvasTexture(512, 320, (g, w, h) => {
      const r = rng(4428), hex = c => '#' + col(c).getHexString();
      g.fillStyle = hex('#38362c'); g.fillRect(0, 0, w, h);
      // dark and half-dark patches, scumbled one into another
      for (let i = 0; i < 110; i++) {
        g.globalAlpha = 0.07 + 0.13 * r(); g.fillStyle = hex(['#5f5b4e', '#23241d', '#4b4a40', '#5a4a34', '#1b1c17', '#6e6a5c'][Math.floor(r() * 6)]);
        g.beginPath(); g.ellipse(r() * w, r() * h, 20 + 70 * r(), 8 + 26 * r(), -0.3 + (r() - 0.5) * 0.5, 0, TAU); g.fill();
      }
      // the knife: pale paint dragged thin across it, breaking over the weave; heaviest towards the front edge
      for (let i = 0; i < 300; i++) {
        const y = h * Math.pow(r(), 0.55), x = r() * w, len = 26 + 120 * r(), wd = 2 + 9 * r(), a = -0.28 + (r() - 0.5) * 0.5, k = 0.35 + 0.65 * y / h;
        g.strokeStyle = hex(['#c9c2ae', '#b3ad9a', '#d8d1bd', '#9d9887'][Math.floor(r() * 4)]); g.lineWidth = 1;
        for (let j = 0; j < wd; j++) {
          if (r() < 0.3) continue;
          g.globalAlpha = (0.06 + 0.3 * r()) * k; const o = j - wd / 2, s0 = r() * 0.3, s1 = 0.7 + r() * 0.3;
          g.beginPath(); g.moveTo(x + Math.cos(a) * len * (s0 - 0.5) - Math.sin(a) * o, y + Math.sin(a) * len * (s0 - 0.5) + Math.cos(a) * o); g.lineTo(x + Math.cos(a) * len * (s1 - 0.5) - Math.sin(a) * o, y + Math.sin(a) * len * (s1 - 0.5) + Math.cos(a) * o); g.stroke();
        }
      }
      // veins: fine, pale, running down across it; and a few dark ones
      for (let i = 0; i < 11; i++) {
        let x = r() * w * 1.1 - w * 0.2, y = -5 + r() * h * 0.5, a = 0.55 + (r() - 0.5) * 0.5; const dk = i > 6;
        g.strokeStyle = hex(dk ? '#15160f' : '#d6d0be'); g.globalAlpha = dk ? 0.6 : 0.22 + 0.3 * r(); g.lineWidth = dk ? 1.6 : 0.7 + 0.9 * r();
        g.beginPath(); g.moveTo(x, y);
        for (let j = 0; j < 26; j++) { a += (r() - 0.5) * 0.5; a = Math.max(0.15, Math.min(1.1, a)); x += Math.cos(a) * 14; y += Math.sin(a) * 14; g.lineTo(x, y); }
        g.stroke();
      }
      g.globalAlpha = 1;
    });
    marble.anisotropy = 4;
    {
      const pos = [], uv = [], cl = [], H = SLAB_H;
      const UV = (x, z) => [(x + 0.36) / 0.78, 1 - (z + 0.21) / 0.46];
      const put = (x, y, z, u, v, k) => { pos.push(x, y, z); uv.push(u, v); cl.push(k, k, k); };
      const quad = (a, b, c, e) => { for (const p of [a, b, c, a, c, e]) put(...p); };
      const T = SLAB.map(([x, z]) => [x, H, z, ...UV(x, z), 1]);
      quad(T[0], T[3], T[2], T[1]);
      // a chamfer that catches the light, and the sides below it (front, left, right)
      for (const [i, j, k] of [[3, 2, 0.5], [0, 3, 0.4], [2, 1, 0.34]]) {
        const [x0, z0] = SLAB[i], [x1, z1] = SLAB[j], l = Math.hypot(x1 - x0, z1 - z0), nx = (z1 - z0) / l, nz = -(x1 - x0) / l, o = 0.005;
        const sg = Math.sign((x0 + x1) / 2 * nx + (z0 + z1) / 2 * nz) || 1, px = nx * o * sg, pz = nz * o * sg, u0 = UV(x0, z0), u1 = UV(x1, z1);
        const a = [x0, H, z0, ...u0, 1.5], b = [x1, H, z1, ...u1, 1.5], c = [x1 + px, H - 0.007, z1 + pz, ...u1, 1.3], e = [x0 + px, H - 0.007, z0 + pz, ...u0, 1.3];
        quad(a, b, c, e);
        quad([e[0], e[1], e[2], u0[0], 0.2, k], [c[0], c[1], c[2], u1[0], 0.2, k], [x1 + px, 0, z1 + pz, u1[0], 0.08, k * 0.8], [x0 + px, 0, z0 + pz, u0[0], 0.08, k * 0.8]);
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('color', new THREE.Float32BufferAttribute(cl, 3));
      this.slab = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ map: marble, vertexColors: true, side: THREE.DoubleSide, fog: false }));
      this.slab.name = 'marble'; this.slab.rotation.y = L.yawOut; L.add(this.slab);
    }

    // ---------------------------------------------------------- the glass, the water in it, and the shadows it stands in
    {
      const prof = [[0.0005, 0.005], [0.03, 0.0008], [0.05, 0.004], [0.068, 0.022], [0.078, 0.05], [0.079, 0.07], [0.073, 0.095], [0.058, 0.118], [0.04, 0.136], [0.027, 0.152], [0.0215, 0.17], [0.02, 0.2], [0.021, 0.222], [0.026, 0.233], [0.0275, 0.236]];
      const lathe = new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r * G, y * G)), 36).toNonIndexed();
      const pos = Array.from(lathe.attributes.position.array), nor = Array.from(lathe.attributes.normal.array), part = new Array(pos.length / 3).fill(0);
      for (let i = 1; i < pos.length; i += 3) pos[i] += SLAB_H;
      const quad = (pts, y, k) => { for (const i of [0, 3, 2, 0, 2, 1]) { pos.push(pts[i][0], y, pts[i][1]); nor.push(0, 1, 0); part.push(k); } };
      quad(SLAB.map(([x, z]) => [x + Math.sign(x) * 0.18, z > 0 ? z + 0.18 : z]), 0.013, 1); quad(SLAB, SLAB_H + 0.0015, 2);
      // (the wall behind: a quad standing on it, under the frame)
      { const z = -(OUT0 + L.wall) + 0.007, x0 = -0.34, x1 = 0.6, y0 = 0.02, y1 = L.rail - L.y - 0.01; for (const [x, y] of [[x0, y0], [x1, y0], [x1, y1], [x0, y0], [x1, y1], [x0, y1]]) { pos.push(x, y, z); nor.push(0, 0, 1); part.push(3); } }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('aPart', new THREE.Float32BufferAttribute(part, 1));
      const edges = SLAB.map((p, i) => { const q = SLAB[(i + 1) % 4], l = Math.hypot(q[0] - p[0], q[1] - p[1]); let nx = (q[1] - p[1]) / l, nz = -(q[0] - p[0]) / l; if (nx * p[0] + nz * p[1] < 0) { nx = -nx; nz = -nz; } return new THREE.Vector3(nx, nz, nx * p[0] + nz * p[1]); });
      const u = this.gu = { uRock: { value: 0 }, uWater: { value: 0.1 }, uSlosh: { value: 0 }, uBq: { value: 0 }, uIn: { value: 0 }, uUnslide: { value: 0 }, uBase: { value: new THREE.Vector3() }, uTan: { value: this.X.clone() }, uEdge: { value: edges },
        uLabel: { value: new THREE.Vector4(LABEL[0] - U0, LABEL[1], LABEL[2], LABEL[3]) },
        uRim: { value: v3('#69735f') }, uGlassIn: { value: v3('#4c4833') }, uWaterC: { value: v3('#3b3b27') }, uHi: { value: v3('#e3e9e4') }, uShade: { value: v3('#0e0b07') }, uWallShade: { value: v3('#2a1c10') }, uWarm: { value: v3('#d9c9a0') } };
      const gm = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor });
      gm.onBeforeCompile = sh => {
        Object.assign(sh.uniforms, u);
        sh.vertexShader = sh.vertexShader.replace('#include <common>', `#include <common>
attribute float aPart; uniform float uRock, uUnslide; varying float vPart; varying vec3 vGN, vGV, vGL;`)
          .replace('#include <begin_vertex>', `vec3 transformed = position; vec3 gn = normal;
  if (aPart < 0.5) {                                                  // the carafe rocks on the rim of its foot
    float px = uRock > 0.0 ? ${FOOT.toFixed(4)} : -${FOOT.toFixed(4)}, c = cos(uRock), s = sin(uRock), x = position.x - px, y = position.y - ${SLAB_H.toFixed(3)};
    transformed.x = px + x * c + y * s; transformed.y = ${SLAB_H.toFixed(3)} - x * s + y * c; gn = vec3(normal.x * c + normal.y * s, -normal.x * s + normal.y * c, normal.z);
  } else if (aPart > 2.5) transformed.z += uUnslide;                  // (the wall's shadow stays on the wall while the slab slides)`)
          .replace('#include <project_vertex>', `#include <project_vertex>
  vPart = aPart; vGL = position; vGV = mvPosition.xyz; vGN = normalize(mat3(modelViewMatrix) * gn);`);
        sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
varying float vPart; varying vec3 vGN, vGV, vGL;
uniform float uWater, uSlosh, uBq, uIn; uniform vec3 uBase, uTan, uRim, uGlassIn, uWaterC, uHi, uShade, uWallShade, uWarm; uniform vec3 uEdge[4]; uniform vec4 uLabel;
float gH(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float gN(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(gH(i), gH(i + vec2(1.0, 0.0)), f.x), mix(gH(i + vec2(0.0, 1.0)), gH(i + vec2(1.0, 1.0)), f.x), f.y); }
vec3 gCol; float gA;`)
          .replace('#include <map_fragment>', `#include <map_fragment>
  if (vPart < 0.5) {
    // glass: clear where you look straight through it, thick and grey-green at its edges
    vec3 n = normalize(vGN), v = normalize(-vGV); bool front = gl_FrontFacing; if (!front) n = -n;
    float rim = pow(1.0 - abs(dot(n, v)), 2.3);
    gA = 0.06 + 0.6 * rim; gCol = mix(uGlassIn, uRim, rim);
    // the water, level whatever the glass does
    float wy = lifeP.y - uBase.y, lvl = uWater + uSlosh * dot(lifeP - uBase, uTan), under = 1.0 - smoothstep(-0.002, 0.002, wy - lvl);
    gA += 0.12 * under; gCol = mix(gCol, uWaterC, 0.55 * under);
    float men = 1.0 - smoothstep(0.0015, 0.0045, abs(wy - lvl));
    gCol = mix(gCol, uHi * 0.8, 0.55 * men); gA = max(gA, 0.5 * men);
    if (front) {
      // his highlight: a pale blue-white scrape of the knife down the left of the belly; a small one answering it
      vec3 h1 = normalize(normalize(vec3(-0.62, 0.42, 0.66)) + v), nn = normalize(vec3(n.x, n.y * 0.4, n.z));
      float sp = pow(max(dot(nn, normalize(vec3(h1.x, h1.y * 0.4, h1.z))), 0.0), 70.0), br = gN(vec2(vGL.y * 380.0, vGL.x * 50.0 + vGL.z * 34.0));
      float hi = smoothstep(0.3, 0.62, sp * (0.55 + 0.9 * br));
      vec3 h2 = normalize(normalize(vec3(0.6, 0.15, 0.78)) + v); float hi2 = 0.35 * smoothstep(0.5, 0.9, pow(max(dot(n, h2), 0.0), 90.0));
      hi = max(hi, hi2); gCol = mix(gCol, uHi, hi); gA = max(gA, 0.9 * hi);
    } else gA *= 0.5;
  } else if (vPart < 2.5) {
    vec2 p = vGL.xz; float e = -1.0e3;
    if (vPart < 1.5) {
      // on the floor round the slab, a little to the right and the front, away from the light
      p -= vec2(0.025, 0.015); for (int i = 0; i < 4; i++) e = max(e, dot(uEdge[i].xy, p) - uEdge[i].z);
      gA = 0.62 * (1.0 - smoothstep(-0.03, 0.13, e)); gCol = uShade;
    } else {
      // on the marble: the carafe's foot, the bouquet's shadow (it grows as the stems come), and the light the water gathers
      float shc = 0.5 * (1.0 - smoothstep(0.15, 1.0, length((p - vec2(0.12, -0.03)) / (vec2(0.21, 0.1) * (0.5 + 0.5 * uBq)))));
      float foot = 0.6 * (1.0 - smoothstep(0.03, 0.07, length(p)));
      gA = max(shc, foot); gCol = uShade;
      vec2 q = (p - vec2(0.085, -0.02)) / vec2(0.04, 0.02); float ca = exp(-dot(q, q)) * 0.45;
      gCol = (gCol * gA + uWarm * ca) / max(gA, 1.0e-3);
    }
  } else {
    // on the wall behind: the bouquet's shadow, thrown down and to the right, soft; never on the label
    vec2 p = vGL.xy; float nz = gN(p * 9.0) - 0.5;
    float body = 1.0 - smoothstep(0.3, 1.0, length((p - vec2(0.115, 0.42)) / (vec2(0.23, 0.3) * (0.35 + 0.65 * uBq))) + 0.16 * nz);
    float jar = 0.45 * (1.0 - smoothstep(0.3, 1.0, length((p - vec2(0.09, 0.14)) / vec2(0.13, 0.15))));
    vec2 lb = abs(p - uLabel.xy) - uLabel.zw; float clear = smoothstep(0.0, 0.07, length(max(lb, 0.0)) + min(max(lb.x, lb.y), 0.0));
    gA = 0.3 * max(body * uBq, jar) * uIn * clear; gCol = uWallShade;
  }`)
          .replace('#include <opaque_fragment>', '  outgoingLight = gCol * gA; diffuseColor.a = gA;\n#include <opaque_fragment>');
      };
      gm.customProgramCacheKey = () => 'courbet-glass';
      this.soft = new THREE.Mesh(g, gm); this.soft.name = 'glass'; this.soft.rotation.y = L.yawOut; this.soft.renderOrder = 6; L.add(this.soft);
    }

    // ---------------------------------------------------------- the sound, on the show's clock: stone, glass, water
    const sc = this.score = score(L);
    sc.hit(T_SLAB[0], { d: T_SLAB[1] - T_SLAB[0], vol: 0.016, lp: 420, hp: 80, attack: 0.22 });                    // the marble drawn over the boards
    sc.note(T_SLAB[1] - 0.02, 84, 0.16, { vol: 0.022, type: 'sine', to: 62, attack: 0.012 });
    sc.note(T_SLAB[1] + 0.03, hz('A6'), 0.7, { vol: 0.005, type: 'sine', attack: 0.01 });                             // the glass answers
    const ring = (t, n, vol = 0.017, len = 1.3) => { const f = hz(n); sc.note(t, f, len, { vol, type: 'sine', attack: 0.006 }); sc.note(t, f * 2.76, len * 0.3, { vol: vol * 0.22, type: 'sine', attack: 0.004 }); };
    STEMS.forEach((s, g) => {
      if (g < 7) { ring(s.in - 0.04, s.note); sc.note(s.in - 0.06, 520 + 40 * g, 0.07, { vol: 0.007, type: 'sine', to: 980 + 60 * g, attack: 0.005 }); }      // a ring, and the water taking the stem
      else { ring(s.in - 0.04, 'D5', 0.02, 1.6); ring(s.in - 0.04, 'A4', 0.016, 1.6); sc.note(s.in - 0.04, hz(s.note), 0.3, { vol: 0.02, type: 'sine', to: 120, attack: 0.01 }); }
    });
    // the sprig is in: one long chord on the glass
    [['D5', 0.014], ['A5', 0.014], ['F#6', 0.016], ['D4', 0.008]].forEach(([n, v], i) => sc.note(T_SPRIG[1] - 0.03 + i * 0.05, hz(n), 3.2, { vol: v, type: 'sine', attack: 0.09 }));
    sc.done();
    // the carafe rocking after the peony: where it passes upright (a tick of glass on marble each time)
    this.ticks = []; for (let n = 1; n < 12; n++) { const tau = (-1.9 + Math.sqrt(1.9 * 1.9 + 4 * 0.9 * n / 2)) / (2 * 0.9); if (tau < 1.5) this.ticks.push(tau); }
    this.hide();
  },

  hide() { this.aSize.array.fill(0); this.aSize.needsUpdate = true; },
  start(L) { this.T = L.t; this.score.from(L.t); this.tick = 0; while (this.tick < this.ticks.length && T_ROCK + this.ticks[this.tick] < L.t) this.tick++; },
  back(L) { this.bT = this.T || 0; },
  end(L) { this.hide(); },
  reset(L) { this.hide(); this.T = 0; },

  // Going back: how far a thing has gone between these two moments of the Return (0 while the show is on).
  gone(a, b) { return this.R < 0 ? 0 : ease.inOut(ramp(this.R, a, b)); },
  // The carafe's lean after the peony lands (radians, towards the right): it rocks quicker as it rocks smaller.
  rock(T, calm) {
    const tau = (T - T_ROCK) * (calm ? 0.5 : 1); if (tau <= 0 || tau > 3) return 0;
    return (calm ? 0.03 : 0.105) * Math.exp(-2.3 * tau) * Math.sin(TAU * (1.9 * tau + 0.9 * tau * tau));
  },
  // Stage point (b: along, up from the marble, out, in the carafe's own terms) into the world, rocked with the carafe.
  place(b, rk, out) {
    let x = b.x, y = b.y; const B = this.base, X = this.X, Z = this.Zo;
    if (rk) { const px = rk > 0 ? FOOT : -FOOT, c = Math.cos(rk), s = Math.sin(rk), dx = x - px; x = px + dx * c + y * s; y = -dx * s + y * c; }
    return out.set(B.x + X.x * x + Z.x * b.z, B.y + SLAB_H + y, B.z + X.z * x + Z.z * b.z);
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

    // ---- the marble and the carafe come out of the foot of the wall, and go back last of all
    const kS = (calm ? ease.inOut : ease.out)(ramp(T, T_SLAB[0], T_SLAB[1])) * (1 - this.gone(0.74, 1));
    L.floor(U0, OUT0 - SLIDE * (1 - kS), this.base);
    this.slab.position.copy(this.base); this.soft.position.copy(this.base);
    const rk = this.rock(T, calm) * (1 - this.gone(0, 0.2));
    // (glass on marble, each time it passes upright)
    if (!back && !calm && !L.quiet && voice.ctx) while (this.tick < this.ticks.length && T >= T_ROCK + this.ticks[this.tick]) { const k = this.tick++; if (T - T_ROCK - this.ticks[k] < 0.1) { noise(voice, 0, { d: 0.035, vol: 0.02 * Math.exp(-1.6 * this.ticks[k]), hp: 2400, attack: 0.001 }); voice.note(1900 + 60 * k, 0.12, { vol: 0.006 * Math.exp(-1.6 * this.ticks[k]), type: 'sine', attack: 0.002 }); } }

    // ---- how far each stem has come (0: in the wall, 1: in the carafe); going back, last in is first out
    const NG = STEMS.length, s = this.s; let landed = 0;
    for (let g = 0; g < NG; g++) {
      const f = this.fl[g], a0 = 0.1 + 0.07 * (NG - 1 - g);
      s[g] = clamp01((T - (f.in - f.fly)) / f.fly) * (1 - this.gone(a0, a0 + 0.3));
      landed += ease.smooth(ramp(T, f.in - 0.1, f.in + 0.3)) * (1 - this.gone(a0, a0 + 0.1));
    }
    const sprigP = ramp(T, T_SPRIG[0], T_SPRIG[1]) * (1 - this.gone(0, 0.26));
    const gu = this.gu;
    gu.uRock.value = rk; gu.uBq.value = landed / NG; gu.uIn.value = kS; gu.uUnslide.value = SLIDE * (1 - kS); gu.uBase.value.copy(this.base).y += SLAB_H;
    gu.uWater.value = (0.082 + 0.0035 * landed) * G;
    { // the water: set rocking when the slab stops, by each stem, and by the carafe itself
      let sl = 0; const t0 = T - T_SLAB[1]; if (t0 > 0) sl += (calm ? 0.05 : 0.14) * Math.exp(-2.6 * t0) * Math.sin(t0 * (calm ? 5 : 9));
      for (const f of this.fl) { const t1 = T - f.in; if (t1 > 0 && t1 < 2.5) sl += 0.045 * Math.exp(-3.4 * t1) * Math.sin(t1 * (calm ? 6 : 12)); }
      gu.uSlosh.value = (sl - 0.6 * this.rock(T - 0.07, calm)) * (1 - this.gone(0, 0.5));
    }

    // ---- the bouquet
    for (let g = 0; g < NG; g++) { const f = this.fl[g], k = ease.inOut(ramp(s[g], 0.2, 0.68)), x = f.dx + (f.ex - f.dx) * k, z = f.dz + (f.ez - f.dz) * k, l = Math.hypot(x, z); f.lx = x / l; f.lz = z / l; }
    for (let i = 0; i < this.NB; i++) {
      const d = D[i], g = d.g, f = this.fl[g], sg = s[g], j3 = i * 3;
      if (sg <= 0.001) { AS[j3] = AS[j3 + 1] = 0; continue; }
      // the turn and the tilt, a little late towards the tip of a spray
      const sr = clamp01(sg * (1 + 0.14 * d.far) - 0.14 * d.far), q = sr / S_A;
      const tilt = sr < S_A ? TILT0 + (TILT_A - TILT0) * ease.inOut(ramp(q, 0.22, 1)) : TILT_A * (1 - ease.smooth((sr - S_A) / (1 - S_A)));
      const twist = f.twist * (1 - ease.inOut(ramp(sr, 0.1, 0.86)));
      // where the stem is held (at the height of the lip, when it is home)
      if (sg < S_A) { const k = ease.smooth(sg / S_A), m = 1 - k; v.set(m * m * f.S.x + 2 * m * k * f.C.x + k * k * f.A.x, m * m * f.S.y + 2 * m * k * f.C.y + k * k * f.A.y, m * m * f.S.z + 2 * m * k * f.C.z + k * k * f.A.z); }
      else { const k = (sg - S_A) / (1 - S_A), e = calm ? ease.inOut(k) : k * k; v.lerpVectors(f.A, f.M, e); }
      // it settles when it lands, and is nudged by each one after it; then it only stirs
      let wx = 0, wz = 0;
      if (sg >= 1 && !back) {
        for (let h = g; h < NG; h++) { const t1 = T - this.fl[h].in; if (t1 <= 0 || t1 > 2.2) continue; const am = (h === g ? 0.07 : h === 7 ? 0.035 : 0.022) * (calm ? 0.4 : 1) * Math.exp(-4.2 * t1) * Math.sin(t1 * (calm ? 7 : 13)), an = g * 2.4 + h * 1.3; wx += am * (h === g ? f.ex : Math.cos(an)); wz += am * (h === g ? f.ez : Math.sin(an)); }
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
      AS[j3] = d.len; AS[j3 + 1] = d.wid; AS[j3 + 2] = d.mode; AF[i * 2] = d.lit; AF[i * 2 + 1] = 0;
    }

    // ---- the sprig: down from under the frame on the right, turning; across under the label; and into the heart of it
    {
      const p = sprigP, on = p > 0.001;
      if (on) {
        const e = p < 0.86 ? 0.9 * (0.45 * (p / 0.86) + 0.55 * ease.smooth(p / 0.86)) : 0.9 + 0.1 * ease.out((p - 0.86) / 0.14);
        this.sprigWay.getPointAt(clamp01(e), this.sprigAt);
      }
      const spin = (calm ? 1.1 : 2.3) * TAU * (1 - ease.out(ramp(p, 0.04, 0.97))), sway = 0.3 * Math.sin(p * 11) * (1 - ramp(p, 0.72, 0.95)) * ramp(p, 0.12, 0.3);
      const lie = TILT0 * (1 - ease.inOut(ramp(p, 0.02, 0.24))) + 0.3 * ease.smooth(ramp(p, 0.84, 1)), size = 1.7 - 0.42 * ease.smooth(ramp(p, 0.78, 1));
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
        AS[j3] = d.len * size; AS[j3 + 1] = d.wid * size; AS[j3 + 2] = d.mode; AF[i * 2] = d.lit; AF[i * 2 + 1] = 0;
      }
    }

    // ---- a petal lets go: two when the carafe rocks, one as the sprig goes in, then one now and then; they lie on the marble
    for (let j = 0; j < NFALL; j++) {
      const i = this.NB + this.NS + j, j3 = i * 3; let n = j;
      while (fallAt(n + NFALL) <= T) n += NFALL;
      const age = T - fallAt(n), src = n === 1 ? D[this.NB - 5] : D[this.mays[(n * 7 + 3) % this.mays.length]], h0 = src.y, fall = 0.75 + h0 * 1.5, fade = this.gone(0.05, 0.4);
      if (age <= 0 || age > fall + 9 || fade >= 1) { AS[j3] = AS[j3 + 1] = 0; continue; }
      const q = Math.min(1, age / fall), side = n % 2 ? 1 : -1, tx = Math.max(-0.2, Math.min(0.3, src.x + side * (0.03 + 0.012 * (n % 3)) + 0.02)), tz = Math.min(0.14, src.z + 0.07 + 0.02 * (n % 4));
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
