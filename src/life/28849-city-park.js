// William Merritt Chase, A City Park (c. 1887), Gallery 161. The word: far.
//
// A small canvas, painted out of doors, and half of it is nothing: a wide sunlit path of raked sand with a few scraps
// lying on it. The path's border with the lawn runs from the bottom left corner straight to a point far off, where
// there are trees, a brick block and people the size of a brush's tip; along that border stand the park's benches,
// each smaller than the last, and on the nearest of them a woman in a black jacket and a pink flounced skirt sits
// sideways to us, a straw hat with pink on it, her shut parasol stood on the path like a cane with its white lace
// bunched at the foot. On the lawn behind her are two great spiked plants and a bed of flowers. The museum says that
// Chase "experimented with dramatic spatial effects", that "half the canvas is filled by the wide, empty walkway", and
// that "its strong diagonal borders carry the eye into the scene". So the picture is about how far it is from here to
// there, and the one person in it is the measure of that: she is big because she is near. No other picture alive in
// this building has distance for its subject. That is the word, and the show is the distance, crossed.
//
// Look, and the far end of the park stands at the foot of the wall under the picture: a few dark trees, a hand high.
// The path comes out from under them across the gallery floor towards you, widening as it comes, the lawn beside it,
// the border between them dead straight; the benches come up the border from the far end one after another, each
// growing as it comes, the nearest growing most; the spiked plants open on the lawn. Then it is as he painted it but
// for one thing: the bench is empty. The floor you stand on is the near end of his path, and the picture hangs over
// its far end. And at the far end, by the trees, there is someone: a woman an inch or two high under a white parasol,
// walking this way. She takes the whole length of the empty path, at a walker's pace for her size (so she grows as
// she comes, slowly and then quickly, as people do), her steps on the sand heard nearer and nearer, past the far
// benches, up to the near one. She stops, brings the parasol forward off her shoulder and shuts it, turns, lets it
// down to the path and sits, a hand on its handle, the other in her lap, her head turned to you and bent: the
// picture, and the eye goes up to it and then down the path in it, to see how far she has come. While you keep
// looking she breathes, the parasol turns a little under her hand, and now and then she looks back along the path.
// When you stop, the whole place draws back into the distance it came from, she and her bench with it, and the sand
// after them. While the toy is near, it all stays: the path is still half empty and the toy may be the one thing on
// it. Its wheels leave their print in the sand, she turns her head to see it pass, as anyone on a bench would, and a
// toy driven up the path towards the wall comes among the far benches like a giant.
//
// How it is made: everything is set out as he set it out, on rays from one vanishing point (in the wall, under the
// picture), and a thing's size is its distance from that point: a bench twice as far is half as big, and she is life
// size (0.62 m standing, 0.52 m seated) only when she reaches hers. The look camera stands where he stood, on the
// path a little to the left, its eye level with the top of her hat when she sits, as his was. Nothing here has a bare
// smooth surface. The ground is flat touches of paint with a brush's own print on them (broad soft ones under, long
// drags across the way you look over them, broad near you and fine far off; shorter greens for the lawn; a dark broken
// line for the cut edge of the turf), and its outer edge is their ragged ends. The benches are slats and iron, a
// stroke to each face. She is built as the Corot's reader is (src/life/81512-interrupted-reading.js): under
// everything a core a little smaller and darker than the form, and what the eye sees is strokes lying over it, each
// a ribbon tilted about its length so that they overlap as feathers do and the edge of every form is their ends,
// found and lost. Her skirt is two masses, above the knee and below, so that it lies along her lap when she sits and
// its flounces stand where they stood; her knees stay over her feet as she goes down. Her head has a profile (brow,
// nose, mouth, chin, the jaw narrowed) but no drawn feature: the brim's shade over her brow and eyes, her eyes the
// deepest of it and lowered, her cheek and chin out in the light, the far side lost, what turns down in shade. She
// is about seven and a half heads. Her arms are worked out each frame (two bones each). The parasol is painted
// inside as well as out, because walking towards you she carries it open behind her head and you look up into it;
// shut, it is a loose spindle of the same white with its lace bunched at the open end. One rig, one draw call, for
// all of it; one more for the soft shadows.
//
// The neighbours. Cole's Niagara (src/life/90048-distant-view-of-niagara.js) hangs 1.55 m to the right and its banks
// come to within about 0.1 m of this picture's middle, out to 1.15 m from the wall. So this show is laid out to the
// left: within 1.15 m of the wall nothing of it lies further right than 0.06 m from the picture's middle; beyond that
// the sand widens to the right, to 0.77 m at two metres out; it reaches 2.3 m to the left (the far corner of the
// lawn, 1.6 m short of the door) and 2.72 m out from the wall. Nothing of it stands higher than her parasol as she
// lifts it to shut it (0.83 m, a metre and a half out from the wall), and within 0.3 m of the wall nothing is higher
// than 0.22 m (she and her parasol, when she is first seen), so from none of the checks' cameras does anything come
// in front of a canvas: the guard has nothing to cut. (Measured in the game, part by part, over the show.) Only one
// show plays in a room at a time; if this one is lying out for the toy when another begins, the kit sends it home.
// She and her bench are soft to the toy (it is eased round them, never stopped dead and never through her); nothing
// else is solid, and nothing is pushed, collected or scored.
//
// The sounds are the place's: paint laid; her steps on the sand, faint and quick while she is far and small, slower
// and nearer as she comes; the parasol shut; the bench taking her weight; the parasol's tip set down; and, under the
// toy, the sand. No tune: it is a hazy forenoon in a park, and the quiet is part of how far away everything is.
// With "Reduce motion and flashing" on, the benches and plants arrive without their spring, the parasol does not
// turn so far under her hand, and everything is quieter; nothing here flashes or pulses at any setting.
//
// What it does not do: the children and the nursemaids at play in the distance are not built, in any form (they are
// children, and smaller than a touch of the brush), so she comes out of the distance alone; the brick block is left
// in the picture; she is given no name, no errand and no one to wait for, and the caption does not name the park,
// because the museum says only that it is probably Tompkins Park in Brooklyn and does not say who she is.
import * as THREE from 'three';
import { lifeFor, ease, ramp, clamp01, lerp, shape } from '../paintlife.js';
import { noise, turnTo } from './stagecraft.js';

const TAU = Math.PI * 2, RAD = Math.PI / 180;
const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const sstep = THREE.MathUtils.smoothstep, fall = (x, a, b) => 1 - sstep(x, a, b);      // (fall: 1 below a, 0 above b)
const hump = (x, a, b) => (x <= a || x >= b ? 0 : Math.sin(Math.PI * (x - a) / (b - a)));

// ---------------------------------------------------------------- the place (metres: x along the wall to the right,
// y up, z out of the picture's plane). Everything is set out as he set it out: on rays from one point, and a thing's
// size is its distance from that point, so the floor in front of the picture is the near end of his path.
const VX = -0.02, VZ = -0.14;                    // the vanishing point: in the wall, under the picture
const TH_EDGE = 30 * RAD;                        // the path's border with the lawn: a ray from it, this far round to the left
const R0 = 1.75;                                 // how far out things are their full size: her bench
const BENCH_R = [R0, 0.757, 0.483, 0.354];         // the benches along the border (evenly spaced, as he saw them: their distances run 1/r)
const YAW_B = Math.PI / 2 - TH_EDGE;             // the way the benches face: across the path
const SAND_R = 2.9, LAWN_R = 2.5, LAWN_TH = 35 * RAD;      // how far the sand comes out; the lawn; and how far round the lawn goes
const sandRight = z => 0.04 + 0.7 * sstep(z, 1.15, 2.0);      // the sand's right-hand edge: it keeps to its own side of the wall near the next picture
const AGAVE = [-1.31, 1.135, 1.0], AGAVE2 = [-0.75, 0.47, 0.55];      // the two great spiked plants on the lawn (x, z, size)

// ---------------------------------------------------------------- her (her own metres, standing 0.6 m: x to her left, y up, z the way she faces)
const HIP_Y = 0.32, THIGH = 0.15, SHIN = 0.17, PEL_SIT = [0.203, -0.13];      // her hips standing; her skirt above and below the knee; her hips on the bench (y, z)
const WAIST = 0.055, NECK = [0, 0.139, 0.004], SH_R = [-0.062, 0.114, 0], SH_L = [0.062, 0.114, 0];
const L1 = 0.105, L2 = 0.11;                     // upper arm; forearm to the middle of the hand
const STICK = 0.33, CAN_Y = 0.305, CAN_R = 0.15, CAN_H = 0.05;      // her parasol: the stick; where the canopy's top is on it; the canopy open
const SHUT = [0.22, 2.2];                        // the canopy shut: how much narrower, how much longer
const TIP = [-0.155, 0.004, 0.09];               // where its tip rests on the path when she sits
const STEP = 0.27, S0 = 0.2, WALK_IN = 14 * RAD;      // a step; how small she is when she is first seen; how far out in the path she starts

// ---------------------------------------------------------------- the show, in seconds
const FLY = 0.45, BUILT = 2.0;                   // one stroke's coming; the ground is all there
const T_BENCH = [0.7, 0.55, 0.42, 0.3], T_PLANT = 0.6;
const T_SEEN = 1.7, T_W0 = 1.8, T_W1 = 5.75;      // she is seen; she walks; she is at her bench
const T_OFF = [T_W1 - 0.3, T_W1 + 0.3], T_SHUT = [T_W1 + 0.12, T_W1 + 0.6], T_DOWN = [T_W1 + 0.45, T_W1 + 1.4];      // the parasol off her shoulder; shut; let down to the path
const T_TURN = [T_W1 + 0.02, T_W1 + 0.8], T_SIT = [T_W1 + 0.7, T_W1 + 1.55], T_POSE = [T_W1 + 1.3, T_W1 + 2.15];
const walkE = q => { const a = 0.12; q = clamp01(q); return q < a ? q * q / (2 * a * (1 - a)) : q > 1 - a ? 1 - (1 - q) * (1 - q) / (2 * a * (1 - a)) : (q - a / 2) / (1 - a); };

// A brush's own print, for every mark: two drags (bristle lines, fuller in the middle, ragged at both ends, the second
// run dry), a soft round touch, and a plain patch for the bodies under them. Its colour is only the bristles' light and
// dark; its alpha is the mark's shape. (As the Corot's: src/life/81512-interrupted-reading.js.)
let PRINT = null;
function brushPrint() {
  if (PRINT) return PRINT;
  const W = 256, mk = () => { const c = document.createElement('canvas'); c.width = c.height = W; return c.getContext('2d', { willReadFrequently: true }); }, gl = mk(), gm = mk();
  gl.fillStyle = 'rgb(232,232,232)'; gl.fillRect(0, 0, W, W); gm.fillStyle = '#000'; gm.fillRect(0, 0, W, W);
  const cell = (x0, y0, seed, fn) => { let s = seed; const r = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646; for (const g of [gl, gm]) { g.save(); g.beginPath(); g.rect(x0, y0, 128, 128); g.clip(); g.translate(x0, y0); g.lineCap = 'round'; } fn(r); gl.restore(); gm.restore(); };
  const line = (v, w, x0, y0, cx, cy, x1, y1) => { for (const [g, st] of [[gl, `rgb(${v},${v},${v})`], [gm, '#fff']]) { g.strokeStyle = st; g.lineWidth = w; g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(cx, cy, x1, y1); g.stroke(); } };
  const drag = dry => r => {
    for (let i = 0; i < 30; i++) {
      const y = 64 + (r() - 0.5) * 86, e = Math.pow(Math.abs(y - 64) / 46, 1.4), xa = 9 + e * 30 + r() * 12, xb = 119 - e * 34 - r() * (dry ? 40 : 14);
      line(196 + Math.floor(r() * 59), 5 + r() * 8, xa, y + (r() - 0.5) * 4, 64, y + (r() - 0.5) * 7, Math.max(xa + 8, xb), y + (r() - 0.5) * 6);
    }
    gm.strokeStyle = '#000';      // the gaps, where the paint ran out
    for (let i = 0; i < (dry ? 12 : 4); i++) { const y = 22 + r() * 84, xa = (dry ? 34 : 62) + r() * 40; gm.lineWidth = 1.4 + r() * 2.4; gm.beginPath(); gm.moveTo(xa, y); gm.lineTo(124, y + (r() - 0.5) * 6); gm.stroke(); }
  };
  cell(0, 0, 11, drag(false)); cell(128, 0, 29, drag(true));
  cell(0, 128, 47, r => {
    for (let i = 0; i < 12; i++) { const a = r() * TAU, rr = Math.sqrt(r()) * 20, v = 205 + Math.floor(r() * 50), x = 64 + Math.cos(a) * rr * 1.25, y = 64 + Math.sin(a) * rr, rx = 15 + r() * 10, ry = 12 + r() * 8, ro = r() * 3; for (const [g, st] of [[gl, `rgb(${v},${v},${v})`], [gm, '#fff']]) { g.fillStyle = st; g.beginPath(); g.ellipse(x, y, rx, ry, ro, 0, TAU); g.fill(); } }
    for (let i = 0; i < 9; i++) { const y = 64 + (r() - 0.5) * 56; line(210 + Math.floor(r() * 45), 4 + r() * 5, 26 + r() * 20, y, 64, y, 102 - r() * 22, y + (r() - 0.5) * 8); }
  });
  for (const g of [gl, gm]) { g.fillStyle = '#fff'; g.fillRect(128, 128, 128, 128); }
  const a = gl.getImageData(0, 0, W, W).data, m = gm.getImageData(0, 0, W, W).data, out = new Uint8Array(W * W * 4);
  for (let i = 0; i < W * W * 4; i += 4) { out[i] = a[i]; out[i + 1] = a[i + 1]; out[i + 2] = a[i + 2]; out[i + 3] = m[i]; }
  PRINT = new THREE.DataTexture(out, W, W, THREE.RGBAFormat);
  PRINT.generateMipmaps = true; PRINT.minFilter = THREE.LinearMipmapLinearFilter; PRINT.magFilter = THREE.LinearFilter; PRINT.anisotropy = 4; PRINT.needsUpdate = true;
  return PRINT;
}
const UVQ = (k, s, t) => { const m = 0.05; return [((k % 2) * 128 + 128 * (m + s * (1 - 2 * m))) / 256, ((k >> 1) * 128 + 128 * (m + t * (1 - 2 * m))) / 256]; };
const UV_SOLID = [0.75, 0.75];

lifeFor(28849, {
  title: /^A City Park/,
  word: 'far',
  // (the look stands on the path, a little to the left, as he stood: the border runs away from the left foot of the
  // view to the foot of the wall under the picture, and the picture hangs over the far end of it)
  stage: { out: 2.6, half: 1.7, cam: { dist: 3.3, height: 0.54, side: -0.6, fov: 56, lookU: -0.3, lookOut: 0.6, lookH: 0.4, floorOut: 2.1 } },
  wake: 2, ret: 2.4,
  linger: { near: 4.6, max: 36 },

  build(L) {
    const P = L.pal, col = (h, a = 0.14) => P.near(h, a), C = (list, a) => list.map(h => col(h, a));
    this.B = new THREE.Matrix4().makeBasis(V3(L.tx, 0, L.tz), V3(0, 1, 0), V3(L.nx, 0, L.nz)).setPosition(L.floor(0, 0));
    this.V = { m: new THREE.Matrix4(), l: new THREE.Matrix4(), f: new THREE.Matrix4(), q: new THREE.Quaternion(), q2: new THREE.Quaternion(), e: new THREE.Euler(0, 0, 0, 'YXZ'), one: V3(1, 1, 1), up: V3(0, 1, 0),
      a: V3(), b: V3(), c: V3(), d: V3(), p1: V3(), p2: V3(), el: V3(), s: V3(), t: V3(), pos: V3(), w: V3(), sc: V3(), at: V3(), at2: V3() };
    this.M = {}; for (const n of ['pelvis', 'thigh', 'shin', 'torso', 'head', 'ru', 'rf', 'lu', 'lf', 'stick', 'canopy', 'furl']) this.M[n] = new THREE.Matrix4();
    // her bench, and where she stands to sit on it
    const pX = Math.sin(YAW_B), pZ = Math.cos(YAW_B), bX = Math.cos(YAW_B), bZ = -Math.sin(YAW_B);      // the way a bench faces; and along it (towards the far end)
    this.benchAt = (r, o = V3()) => o.set(VX - r * Math.sin(TH_EDGE) + pX * 0.07 * r / R0, 0, VZ + r * Math.cos(TH_EDGE) + pZ * 0.07 * r / R0);
    const cb = this.benchAt(R0);
    this.S = V3(cb.x + bX * 0.06 + pX * (-PEL_SIT[1]), 0, cb.z + bZ * 0.06 + pZ * (-PEL_SIT[1]));
    this.R1 = Math.hypot(this.S.x - VX, this.S.z - VZ); this.thS = Math.atan2(-(this.S.x - VX), this.S.z - VZ);
    // her walk: how big she is (the log of it) and how many steps she has taken, against the time of the walk (0..1).
    // She keeps a walker's pace for her size all the way (a little quicker while she is far off and small).
    { const N = 80, H = 0.6, P0 = 2.0, P1 = 0.9, dl = -Math.log(S0) / N, ts = [0], ls = [Math.log(S0)], st = [0]; let t = 0;
      for (let i = 1; i <= N; i++) { const sz = Math.exp(ls[i - 1] + dl / 2), pace = P1 + (P0 - P1) * Math.pow(1 - sz, 1.5), dt = dl / (pace * H / this.R1); t += dt; ts.push(t); ls.push(ls[i - 1] + dl); st.push(st[i - 1] + pace * H / STEP * dt); }
      this.walk = { ts: ts.map(x => x / t), ls, st, n: N }; }
    this.WK = { s: S0, ph: 0 };
    this.IDLE = { sit: 0, ph: 0, going: 0, off: 0, down: 0, shut: 0, pose: 0, breath: 0, glance: 0, gy: 0, gp: 0, twirl: 0, calm: false };
    this.pose(this.IDLE);

    const R = () => L.rand();
    const KEY = V3(-0.5, 0.8, 0.25).normalize();           // his light, as it falls on her on the bench: from over the path, high
    const pick = (list, r) => list[Math.min(list.length - 1, Math.floor(r * list.length))];
    const set = (hi, mid, lo, deep, a) => ({ hi: C(hi, a), mid: C(mid, a), lo: C(lo, a), deep: C(deep, a) });
    const PK = set(['#f8d6ca', '#f4cabc', '#fadfd4'], ['#eeb6a8', '#eaac9e', '#f0bcae'], ['#d98f86', '#d2867e', '#dc978c'], ['#b66f6a', '#aa6460']);      // her skirt
    const BK = set(['#4c463f', '#443e38'], ['#2e2a26', '#292521'], ['#1d1a18', '#191614'], ['#110f0e']);                                                  // her jacket
    const WH = set(['#f6f3ec', '#f0ece2', '#faf8f2'], ['#e0dcd2', '#d8d4ca', '#e4e0d6'], ['#c2c0b8', '#b8b6ae'], ['#a09e98', '#989690']);                  // lace; the parasol
    const SW = set(['#f1e6c8', '#ebdebc'], ['#dccca6', '#d5c49c'], ['#bca880', '#b4a078'], ['#978560']);                                                  // her straw hat
    const FL = set(['#edceb2', '#e9c8aa'], ['#ddb898', '#d9b292', '#dbb595'], ['#c9a182', '#c39b7c'], ['#b18b6d', '#a98365']);                             // her skin
    const HR = set(['#5c4836', '#503e2e'], ['#3b2b1f', '#34251b'], ['#271b13'], ['#19100b']);                                                             // her hair
    const GL = set(['#dcb078', '#d4a66c'], ['#c09058', '#b88850'], ['#987040'], ['#74542c']);                                                             // her gloves; the parasol's stick
    const WD = set(['#b8bca8', '#aeb29e'], ['#989e8a', '#909682'], ['#787e6c', '#707664'], ['#5a6050']);                                                  // the benches' slats
    const IR = set(['#666a5c', '#5e6254'], ['#474a40', '#41443a'], ['#30322b'], ['#22241f']);                                                             // their iron ends
    const AG = set(['#c0d6c8', '#b4ccbe'], ['#92b4a6', '#88ac9e'], ['#688f84', '#60877c'], ['#476d62']);                                                  // the spiked plants
    const PKH = C(['#f6cfc2', '#eeb2a4', '#f3c0ae', '#e59e94', '#f8dccc', '#dc9a9a', '#f0b89c', '#e8a8a8'], 0.1);       // pinks: salmon, rose, a peach, a cooler one
    const BKH = C(['#2a2622', '#1f1c1a', '#34302b', '#22242a', '#2c2420', '#3a3530'], 0.1), WHH = C(['#f6f2e8', '#e4e4de', '#d0d4d2', '#efe4d0', '#f8f4ee', '#dcd6ca'], 0.06);
    const SWH = C(['#eadbb4', '#dcc89c', '#f0e4c4', '#cfbc90', '#e4d2a8'], 0.1), FLH = C(['#e6c4a4', '#dcb896', '#eccdb0', '#d4aa8a', '#e0bc9e'], 0.1), HRH = C(['#2e2119', '#3c2c21', '#261b14', '#483629'], 0.1);
    const GLH = C(['#c89a60', '#bc8c54', '#d4a870', '#b08048'], 0.1), WDH = C(['#a2a894', '#8e9682', '#b2b6a2', '#9aa08e', '#848c7c', '#aaa690'], 0.1), IRH = C(['#44473d', '#3a3d34', '#52554a', '#34382f'], 0.1);
    const AGH = C(['#9ebcae', '#86a89c', '#b2cabc', '#74988c', '#a8c2aa', '#90b0aa'], 0.1);
    const ROSE = C(['#ee8f86', '#f3a294', '#e8807c', '#f6b4a4'], 0.08), PLUME = C(['#f4f0e6', '#e2ded2', '#d2cec4'], 0.06);
    const SOCK = col('#96705a', 0.12), LOST = col('#9a745c', 0.12), EYE = col('#5a4236', 0.12), CHEEK = col('#dc9c86', 0.08), LIP = col('#b46a60', 0.1), BRIM = col('#a88468', 0.12);
    // The tone of a form where it faces his light (lights, half tones, shade, dark, run smoothly into each other); and
    // a stroke on it: that tone, leaning to one of the mass's own colours, with a little of the luck of the brush.
    const under = S => { const c = new THREE.Color(); return n => { const k = n.dot(KEY); return c.copy(S.deep[0]).lerp(S.lo[0], sstep(k, -0.75, -0.3)).lerp(S.mid[0], sstep(k, -0.25, 0.2)).lerp(S.hi[1 % S.hi.length], sstep(k, 0.25, 0.75)).multiplyScalar(0.98); }; };
    const mixer = (S, hues, amt = 0.4, v = 0.14) => {
      const u = under(S), ref = S.mid[0], c = new THREE.Color();
      return (n, r) => { const h = pick(hues, (r * 7.31) % 1), a = amt * (0.4 + 1.2 * ((r * 3.17) % 1)), k = 1 + (r - 0.5) * v, f = (x, y) => lerp(1, Math.max(0.6, Math.min(1.5, x / Math.max(0.02, y))), a) * k; c.copy(u(n)); return new THREE.Color(c.r * f(h.r, ref.r), c.g * f(h.g, ref.g), c.b * f(h.b, ref.b)); };
    };

    // ---------------------------------------------------------- parts: bodies and the strokes on them
    // A part is one piece of the rig (it moves as one). Every vertex carries where its stroke's middle is (aCen) and how
    // the stroke comes (aFly: from where, relative to its place, and when). Only the ground's strokes fly: they come
    // out along the path from its far end, small, and grow into their places; the rest is whole from the start.
    const part = rest => { rest = rest ? rest.clone() : new THREE.Matrix4(); return { pos: [], nor: [], col: [], uv: [], cen: [], fly: [], rest, inv: rest.clone().invert(), n: 0 }; };
    const side = V3(), d2 = V3(), cl = V3(), nW = V3(), ca = new THREE.Color(), cb2 = new THREE.Color(), FIX = [0, 0, 0, -1];
    const vert = (Pt, p, n, c, uv, cen, f) => { Pt.pos.push(p.x, p.y, p.z); Pt.nor.push(n.x, n.y, n.z); Pt.col.push(c.r, c.g, c.b); Pt.uv.push(uv[0], uv[1]); Pt.cen.push(cen.x, cen.y, cen.z); Pt.fly.push(f[0], f[1], f[2], f[3]); Pt.n++; };
    const world = (Pt, n) => nW.copy(n).transformDirection(Pt.rest);      // (a part's normal as it stands when she is on the bench: his light is the place's)
    const solid = (Pt, g, base, paint = null) => {
      const p = g.attributes.position, n = g.attributes.normal, c = g.attributes.color, v = V3(), nn = V3(), cc = new THREE.Color();
      for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); nn.fromBufferAttribute(n, i); if (paint) cc.copy(paint(world(Pt, nn), v, nn)); else cc.fromBufferAttribute(c, i); vert(Pt, v, nn, cc, UV_SOLID, base, FIX); }
    };
    // A ribbon of paint through six points lying on a form (Ps, with the form's normal at each, Ns), w wide, with the
    // brush's print on it (cell: 0 a drag, 1 a dry one, 2 a round touch): close on the form where the brush set down,
    // its dry end lifted a little and one long edge too, so the strokes overlap as feathers do and the edge of a form
    // is their ragged ends, found and lost, never the outline of the body under them.
    const ribbon = (Pt, Ps, Ns, w, c, { lift = 0.0018, tip = 0.004, ridge = 0.06, cell = -1, tilt = 0.34 } = {}) => {
      const k = cell < 0 ? (R() < 0.55 ? 0 : 1) : cell, flip = R() < 0.5, A = [], Bq = [], ua = [], ub = [], mid = Ps[2].clone().add(Ps[3]).multiplyScalar(0.5);
      const ta = tilt * (0.5 + R()) * (R() < 0.5 ? -1 : 1), cw = Math.cos(ta) * w / 2, sw = Math.sin(ta) * w / 2;      // (tilted about its length: one long edge lifted)
      for (let i = 0; i < 6; i++) {
        d2.copy(Ps[Math.min(5, i + 1)]).sub(Ps[Math.max(0, i - 1)]); side.crossVectors(Ns[i], d2); if (side.lengthSq() < 1e-14) return; side.normalize();
        const s = flip ? 1 - i / 5 : i / 5;
        cl.copy(Ps[i]).addScaledVector(Ns[i], lift + tip * s * s);
        A.push(cl.clone().addScaledVector(side, -cw).addScaledVector(Ns[i], -sw)); Bq.push(cl.clone().addScaledVector(side, cw).addScaledVector(Ns[i], sw)); ua.push(UVQ(k, s, 0)); ub.push(UVQ(k, s, 1));
      }
      ca.copy(c).multiplyScalar(1 + ridge); cb2.copy(c).multiplyScalar(1 - ridge * 0.7);
      for (let i = 0; i < 5; i++) { vert(Pt, A[i], Ns[i], cb2, ua[i], mid, FIX); vert(Pt, Bq[i + 1], Ns[i + 1], ca, ub[i + 1], mid, FIX); vert(Pt, Bq[i], Ns[i], ca, ub[i], mid, FIX); vert(Pt, A[i], Ns[i], cb2, ua[i], mid, FIX); vert(Pt, A[i + 1], Ns[i + 1], cb2, ua[i + 1], mid, FIX); vert(Pt, Bq[i + 1], Ns[i + 1], ca, ub[i + 1], mid, FIX); }
    };
    // One stroke on something flat (or a touch too small to need bending): at p (normal n), along dir, l long and w wide.
    const stroke = (Pt, p, n, dir, l, w, c, { bend = 0, ...o } = {}) => {
      side.crossVectors(n, dir); if (side.lengthSq() < 1e-8) return; side.normalize(); const dd = V3().crossVectors(side, n).normalize(), sd = side.clone(), Ps = [], Ns = [];
      for (let i = 0; i < 6; i++) { const s = i / 5 - 0.5; Ps.push(p.clone().addScaledVector(dd, s * l).addScaledVector(sd, bend * l * (1 - 4 * s * s))); Ns.push(n); }
      ribbon(Pt, Ps, Ns, w, c, o);
    };
    const q_ = new THREE.Quaternion();
    const along = (n, flow, jit) => { const d = flow.clone().addScaledVector(n, -flow.dot(n)); if (d.lengthSq() < 1e-4) d.set(n.y, -n.x, 0); if (d.lengthSq() < 1e-6) d.set(1, 0, 0); return d.normalize().applyQuaternion(q_.setFromAxisAngle(n, (R() - 0.5) * jit)); };
    const DOWN = V3(0, -1, 0), ACROSS = V3(1, 0, 0), UP = V3(0, 1, 0);
    // A rounded body (an ellipsoid: centre, radii, turned), painted smoothly, a little smaller and darker than the form.
    const dk = new THREE.Color();
    const ball = (Pt, Cn, Rd, paint, { rot = [0, 0, 0], detail = 3, shrink = 0.94, dark = 0.8 } = {}) => solid(Pt, shape.move(shape.ball(1, 0xffffff, detail), Cn[0], Cn[1], Cn[2], rot[0], rot[1], rot[2], Rd[0] * shrink, Rd[1] * shrink, Rd[2] * shrink), V3(Cn[0], Cn[1] - Rd[1], Cn[2]), (nw, v, nn) => dk.copy(paint(nw, v, nn)).multiplyScalar(dark));
    // A coat of n strokes over an ellipsoid, each an arc on it (so it lies on it from end to end); tn(normal in the place, luck, its own normal) its colour.
    const coat = (Pt, Cn, Rd, n, tn, { rot = [0, 0, 0], l = [0.03, 0.05], w = [0.014, 0.022], flow = DOWN, jit = 0.6, keep = null, grow = 1.0, ...o } = {}) => {
      const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(rot[0], rot[1], rot[2], 'YXZ')), qi = q.clone().invert(), c = V3(...Cn), Rm = (Rd[0] + Rd[1] + Rd[2]) / 3;
      for (let i = 0; i < n; i++) {
        const yy = 1 - 2 * R(), ph = R() * TAU, s = Math.sqrt(Math.max(0, 1 - yy * yy)), u0 = V3(s * Math.cos(ph), yy, s * Math.sin(ph));
        const p = V3(u0.x * Rd[0] * grow, u0.y * Rd[1] * grow, u0.z * Rd[2] * grow).applyQuaternion(q).add(c), nn = V3(u0.x / Rd[0], u0.y / Rd[1], u0.z / Rd[2]).normalize().applyQuaternion(q);
        const r1 = R(), r2 = R(), r3 = R();
        if (keep && !keep(p, nn)) continue;
        const d = along(u0, flow.clone().applyQuaternion(qi), jit), len = lerp(l[0], l[1], r1), Ps = [], Ns = [];
        for (let k = 0; k < 6; k++) { const al = (k / 5 - 0.5) * len / Rm, u = u0.clone().multiplyScalar(Math.cos(al)).addScaledVector(d, Math.sin(al)); Ps.push(V3(u.x * Rd[0] * grow, u.y * Rd[1] * grow, u.z * Rd[2] * grow).applyQuaternion(q).add(c)); Ns.push(V3(u.x / Rd[0], u.y / Rd[1], u.z / Rd[2]).normalize().applyQuaternion(q)); }
        ribbon(Pt, Ps, Ns, lerp(w[0], w[1], r2), tn(world(Pt, nn).clone(), r3, nn), o);
      }
    };
    // A limb along the part's own +y: prof = [[radius, y], ...] from its root, rounded off at both ends; a few soft strokes down it.
    const tube = (Pt, prof, S, n, tn, { w = [0.012, 0.018], l = [0.03, 0.05], shrink = 0.86, dark = 0.84, ends = true, ...o } = {}) => {
      const u0 = under(S), u = nn => dk.copy(u0(nn)).multiplyScalar(dark), y0 = prof[0][1], y1 = prof[prof.length - 1][1], rAt = y => { for (let i = 1; i < prof.length; i++) if (y <= prof[i][1]) return lerp(prof[i - 1][0], prof[i][0], (y - prof[i - 1][1]) / (prof[i][1] - prof[i - 1][1])); return prof[prof.length - 1][0]; };
      const fine = []; for (let i = 0; i <= 14; i++) { const y = lerp(y0, y1, i / 14); fine.push([rAt(y) * shrink, y]); }
      solid(Pt, shape.lathe(fine, 14, 0xffffff), V3(0, y0, 0), nn => u(nn));
      if (ends) for (const [r, y] of [prof[0], prof[prof.length - 1]]) solid(Pt, shape.move(shape.ball(r * shrink, 0xffffff, 2), 0, y, 0), V3(0, y0, 0), nn => u(nn));
      for (let i = 0; i < n; i++) {
        const len = lerp(l[0], l[1], R()), yc = lerp(y0 + len / 2, y1 - len / 2, R()), ph = R() * TAU, nn = V3(Math.cos(ph), 0, Math.sin(ph)), Ps = [], Ns = [];
        for (let k = 0; k < 6; k++) { const y = yc + (k / 5 - 0.5) * len, r = rAt(y); Ps.push(V3(nn.x * r, y, nn.z * r)); Ns.push(nn); }
        ribbon(Pt, Ps, Ns, lerp(w[0], w[1], R()), tn(world(Pt, nn).clone(), R()), o);
      }
    };
    // A lofted form: rings from its foot up ({ y, c: [x, z], r1, r2 }), r1 across her and r2 fore and aft, fluted if
    // asked (real folds); smooth all over, painted paint(normal in the place, how far up, how far round, where, its own
    // normal). Returns how to find a point and its normal on it, and how to lay a stroke on it.
    const loft = (Pt, rings, paint, { pow = 2, flute = null, seg = 32, rows = 12, cap = false, foot = false, shrink = 0.95, dark = 0.76 } = {}) => {
      const m = rings.length - 1;
      const cr = (get, v) => { const x = clamp01(v) * m, i = Math.min(m - 1, Math.floor(x)), f = x - i, g = j => get(rings[Math.max(0, Math.min(m, j))]), p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2); return 0.5 * (2 * p1 + (-p0 + p2) * f + (2 * p0 - 5 * p1 + 4 * p2 - p3) * f * f + (-p0 + 3 * p1 - 3 * p2 + p3) * f * f * f); };
      const at = (v, th, out = V3(), sk = 1) => {
        const cs = Math.cos(th), sn = Math.sin(th), e = 2 / pow, k = (flute ? flute(v, th) : 1) * sk;
        const a = Math.sign(cs) * Math.pow(Math.abs(cs), e) * cr(r => r.r1, v) * k, b = Math.sign(sn) * Math.pow(Math.abs(sn), e) * cr(r => r.r2, v) * k;
        return out.set(cr(r => r.c[0], v) + a, cr(r => r.y, v), cr(r => r.c[1], v) + b);
      };
      const pa = V3(), pb = V3(), pc = V3(), pd = V3();
      const normal = (v, th, out = V3()) => { at(v, th + 0.02, pa); at(v, th - 0.02, pb); at(Math.min(1, v + 0.02), th, pc); at(Math.max(0, v - 0.02), th, pd); out.crossVectors(pa.sub(pb), pc.sub(pd)).normalize(); at(v, th, pa); pb.set(cr(r => r.c[0], v), pa.y, cr(r => r.c[1], v)); if (out.dot(pa.sub(pb)) < 0) out.negate(); return out; };
      const pos = [], idx = [], N = rows + 1;
      for (let j = 0; j < N; j++) for (let i = 0; i < seg; i++) { at(j / rows, i / seg * TAU, pa, shrink); pos.push(pa.x, pa.y, pa.z); }
      for (let j = 0; j < rows; j++) for (let i = 0; i < seg; i++) { const a = j * seg + i, b = j * seg + (i + 1) % seg, c = a + seg, d = b + seg; idx.push(a, c, b, b, c, d); }
      const flat = (row, yy, c, rev) => { const k = pos.length / 3; pos.push(c[0], yy, c[1]); for (let i = 0; i < seg; i++) { const a = row * seg + i, b = row * seg + (i + 1) % seg; if (rev) idx.push(b, k, a); else idx.push(a, k, b); } };
      if (cap) flat(rows, rings[m].y, rings[m].c, false);
      if (foot) flat(0, rings[0].y, rings[0].c, true);         // (closed underneath too: nothing to see into from the floor)
      let g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
      { const n = g.attributes.normal; pa.fromBufferAttribute(g.attributes.position, seg * 2); pb.set(cr(r => r.c[0], 2 / rows), pa.y, cr(r => r.c[1], 2 / rows)); if (pc.fromBufferAttribute(n, seg * 2).dot(pa.sub(pb)) < 0) { g.setIndex(idx.map((_, i) => idx[i - i % 3 + [0, 2, 1][i % 3]])); g.computeVertexNormals(); } }
      { const n = g.attributes.normal, cols = new Float32Array(pos.length), k = pos.length / 3;
        for (let i = 0; i < k; i++) { pa.fromBufferAttribute(g.attributes.position, i); pb.fromBufferAttribute(n, i); const j = Math.min(rows, Math.floor(i / seg)), c = paint(world(Pt, pb), i < N * seg ? j / rows : (i === N * seg && cap ? 1 : 0), (i % seg) / seg * TAU, pa, pb); cols[i * 3] = c.r * dark; cols[i * 3 + 1] = c.g * dark; cols[i * 3 + 2] = c.b * dark; }
        g.setAttribute('color', new THREE.BufferAttribute(cols, 3)); }
      g = g.toNonIndexed();
      solid(Pt, g, V3(rings[0].c[0], rings[0].y, rings[0].c[1]));
      // a stroke lying on it: from (v + dv / 2) down to (v - dv / 2), drifting dth round it
      const lay = (v, th, dv, dth, w, c, o) => { const Ps = [], Ns = []; for (let k = 0; k < 6; k++) { const s = k / 5 - 0.5; Ps.push(at(v - s * dv, th + s * dth)); Ns.push(normal(v - s * dv, th + s * dth)); } ribbon(Pt, Ps, Ns, w, c, o); };
      return { at, normal, lay };
    };
    // A bar from a to b (a slat, a leg): tu thick along `up`, ts the other way; a dark core, and a stroke down each face.
    const bar = (Pt, a, b, up, tu, ts, S, tn, { top = 2, edge = 1 } = {}) => {
      const d = b.clone().sub(a), len = d.length(); d.normalize();
      const u = up.clone().addScaledVector(d, -up.dot(d)).normalize(), sd = V3().crossVectors(d, u), mid = a.clone().add(b).multiplyScalar(0.5), un = under(S);
      const g = shape.box(len, tu * 0.82, ts * 0.82, 0xffffff); g.applyMatrix4(new THREE.Matrix4().makeBasis(d, u, sd).setPosition(mid));
      solid(Pt, g, mid, nw => dk.copy(un(nw)).multiplyScalar(0.8));
      for (const [n, half, wd, cnt] of [[u, tu / 2, ts, top], [u.clone().negate(), tu / 2, ts, 1], [sd, ts / 2, tu, edge], [sd.clone().negate(), ts / 2, tu, edge]])
        for (let i = 0; i < cnt; i++) stroke(Pt, mid.clone().addScaledVector(n, half).addScaledVector(d, (R() - 0.5) * len * 0.06), n, d.clone().multiplyScalar(R() < 0.5 ? 1 : -1), len * (0.97 + 0.1 * R()), wd * (1.2 + 0.25 * R()), tn(world(Pt, n).clone(), R()), { lift: 0.0012, tip: 0.0012, tilt: 0.1, cell: R() < 0.6 ? 0 : 1, ridge: 0.08 });
    };
    const M = this.M;

    // ---------------------------------------------------------- the ground: his path, the lawn beside it, the border
    // between, and the trees at the far end. Flat touches of paint, each coming out along the path from the far end.
    const ground = part(), gc = new THREE.Color();
    {
      // a touch lying on the ground (or standing, for the far trees): mid, along ax (l long), across ay (w wide); when
      const card = (mid, ax, ay, l, w, c, t, cell, fly = 0.62) => {
        const k = cell < 0 ? (R() < 0.55 ? 0 : 1) : cell, n = V3().crossVectors(ax, ay).normalize(), f = [(VX - mid.x) * fly, ay.y ? -mid.y * 0.9 : 0, (VZ + 0.16 - mid.z) * fly, t];
        const cn = (a, b) => mid.clone().addScaledVector(ax, a * l / 2).addScaledVector(ay, b * w / 2), fl = R() < 0.5 ? 1 : 0;
        const q = [[-1, -1], [1, -1], [1, 1], [-1, -1], [1, 1], [-1, 1]];
        for (const [a, b] of q) vert(ground, cn(a, b), n, c, UVQ(k, fl ? (1 - a) / 2 : (a + 1) / 2, (b + 1) / 2), mid, f);
      };
      const dab = (x, z, y, ang, l, w, c, t, cell = -1) => card(V3(x, y, z), V3(Math.cos(ang), 0, Math.sin(ang)), V3(Math.sin(ang), 0, -Math.cos(ang)), l, w, c, t, cell);
      const polar = (x, z) => [Math.hypot(x - VX, z - VZ), Math.atan2(-(x - VX), z - VZ)];
      const whenR = r => 0.1 + 1.05 * Math.pow(clamp01((r - 0.12) / (SAND_R - 0.12)), 0.72);
      const SAND = C(['#c9ab78', '#c1a270', '#cfb382', '#b99968', '#c6a87a', '#d3b98a', '#bd9f72'], 0.14), SAND_FAR = C(['#d6c0a0', '#d0ba9c', '#dcc8a8'], 0.14), SAND_COOL = C(['#b8a590', '#af9c88', '#bcab9a'], 0.14), SAND_HI = C(['#dcc698', '#e0cca0'], 0.14);
      const LAWN = C(['#7ea648', '#729c40', '#8aae4e', '#66903c', '#94b456'], 0.3), LAWN_DK = C(['#4c7e3c', '#44743a', '#548440', '#3c6c3e'], 0.3), LAWN_HI = C(['#a6c060', '#9cb858'], 0.26);
      const EDGE = C(['#6e5e3a', '#7c6a42', '#5e5032', '#857248'], 0.14), EDGE_G = C(['#3f6c30', '#356029', '#4a7a36'], 0.14), TREE = C(['#2f5a34', '#3d6b3c', '#27502e', '#4a7a44', '#356338'], 0.14);
      // --- under everything, each ground's middle tone, laid in broad soft touches that overlap (set out evenly, so
      // no floor shows through the middle; there is no flat sheet, and the edge of the ground is paint too)
      const inSand = (x, z, r, th, s) => Math.min((sandRight(z) - x) / (0.16 * s), (SAND_R * (0.92 + 0.08 * Math.sin(th * 9)) - r) / 0.4, (TH_EDGE - th) * r / (0.02 * s) + 0.6);
      const inLawn = (z, r, th, da) => Math.min((LAWN_TH - da) / (9 * RAD), (LAWN_R * (0.92 + 0.08 * Math.sin(th * 13)) - r) / 0.4, (z - 0.05) / 0.08);
      const under_ = (th0, th1, r0, r1, keep, colAt, y, room = null) => {
        const dT = 0.1, dL = 0.06, NT = Math.ceil(Math.abs(th1 - th0) / dT), NR = Math.ceil(Math.log(r1 / r0) / dL);
        for (let i = 0; i <= NR; i++) for (let j = 0; j <= NT; j++) {
          const r = r0 * Math.exp((i + (R() - 0.5) * 0.8) * dL), th = th0 + (th1 - th0) * (j + (R() - 0.5) * 0.8) / NT, x = VX - r * Math.sin(th), z = VZ + r * Math.cos(th), s = r / R0, r2 = R(), r3 = R();
          const lim = room ? room(x, z) : 9;
          if (z < 0.06 || lim < 0.05 || !keep(x, z, r, th, s)) continue;
          dab(x, z, y + 0.004 * R(), -0.1 + (R() - 0.5) * 0.4, Math.min((0.46 + 0.14 * r2) * s, 1.9 * lim), (0.3 + 0.08 * r3) * s, colAt(r).clone().multiplyScalar(0.92 + 0.06 * r3), whenR(r) + 0.1 * R(), 2);
        }
      };
      under_(-20 * RAD, TH_EDGE, 0.16, SAND_R, (x, z, r, th, s) => inSand(x, z, r, th, s) > 0.55 && th < TH_EDGE - 0.1 * s / r, r => gc.copy(SAND[3]).lerp(SAND_FAR[1], 0.75 * fall(r, 0.25, 1.3)), 0.006, (x, z) => sandRight(z) - x);
      under_(TH_EDGE, TH_EDGE + LAWN_TH, 0.3, LAWN_R, (x, z, r, th, s) => inLawn(z, r, th, th - TH_EDGE) > 0.55 && th > TH_EDGE + 0.1 * s / r, r => gc.copy(LAWN[3]).lerp(LAWN_DK[0], 0.4), 0.006);
      // --- the sand: long drags laid across the way you look, broad near you and fine far off; warm, a few cool and a few light
      for (let i = 0; i < 1500; i++) {
        const r = 0.13 * Math.pow(SAND_R / 0.13, R()), th = lerp(-20 * RAD, TH_EDGE, R()), x = VX - r * Math.sin(th), z = VZ + r * Math.cos(th), s = r / R0, r1 = R(), r2 = R(), r3 = R(), r4 = R(), r5 = R();
        if (z < 0.035) continue;
        const k = inSand(x, z, r, th, s);
        const lim = sandRight(z) - x;
        if (k < r1 || lim < 0.025) continue;
        const c = (r2 < 0.1 ? pick(SAND_COOL, r3) : r2 < 0.17 ? pick(SAND_HI, r3) : pick(SAND, r3)).clone().lerp(pick(SAND_FAR, r4), 0.75 * fall(r, 0.25, 1.3)).multiplyScalar(0.95 + 0.1 * r5);
        dab(x, z, 0.012 + 0.012 * R(), -0.1 + (R() - 0.5) * 0.34, Math.min((0.12 + 0.11 * r4) * s, 1.9 * lim), (0.036 + 0.03 * r5) * s, c, whenR(r) + 0.14 * R());
      }
      // --- the lawn: shorter touches, yellow-green where the sun is on it by the path, deeper further in
      for (let i = 0; i < 1150; i++) {
        const r = 0.24 * Math.pow(LAWN_R / 0.24, R()), da = LAWN_TH * R(), th = TH_EDGE + da, x = VX - r * Math.sin(th), z = VZ + r * Math.cos(th), s = r / R0, r1 = R(), r2 = R(), r3 = R(), r4 = R();
        if (z < 0.06) continue;
        const k = inLawn(z, r, th, da);
        if (k < r1) continue;
        const deep = sstep(da, 6 * RAD, 30 * RAD), c = (r2 < 0.14 ? pick(LAWN_HI, r3) : r2 < 0.2 + 0.5 * deep ? pick(LAWN_DK, r3) : pick(LAWN, r3)).clone().multiplyScalar(0.94 + 0.12 * r4);
        dab(x, z, 0.012 + 0.012 * R(), -0.12 + (R() - 0.5) * 0.4, (0.11 + 0.1 * r4) * s, (0.027 + 0.02 * r3) * s, c, whenR(r) + 0.1 + 0.14 * R());
      }
      // --- the border: the cut edge of the turf, a dark broken line straight to the far end
      for (let i = 0; i < 96; i++) {
        const r = 0.2 * Math.pow((LAWN_R - 0.2) / 0.2, (i + R()) / 96), s = r / R0, g = R() < 0.4, off = (g ? -0.012 : 0.006) * s + (R() - 0.5) * 0.008 * s, th = TH_EDGE + off / r;
        dab(VX - r * Math.sin(th), VZ + r * Math.cos(th), 0.026 + 0.004 * R(), Math.PI / 2 + TH_EDGE + (R() - 0.5) * 0.12, (0.07 + 0.05 * R()) * s, (0.016 + 0.01 * R()) * s, pick(g ? EDGE_G : EDGE, R()), whenR(r) + 0.05 + 0.1 * R(), R() < 0.5 ? 0 : 1);
      }
      // --- scraps on the path, as he has them: a leaf, a bit of paper
      for (let i = 0; i < 16; i++) {
        const r = 0.5 + 2.2 * R(), th = lerp(-4 * RAD, TH_EDGE - 5 * RAD, R()), x = VX - r * Math.sin(th), z = VZ + r * Math.cos(th), s = r / R0;
        if (x > sandRight(z) - 0.15) continue;
        dab(x, z, 0.028, R() * 3, 0.022 * s, 0.012 * s, col(pick(['#f2efe6', '#7c8a4a', '#a8743c', '#8a9a58', '#c8c4b4'], R()), 0.1), whenR(r) + 0.3, 2);
      }
      // --- his bed of flowers at the near corner of the lawn: reds, pinks and whites, small
      for (let i = 0; i < 26; i++) {
        const r = 1.75 + 0.5 * R(), th = TH_EDGE + (19 + 9 * R()) * RAD, s = r / R0;
        dab(VX - r * Math.sin(th), VZ + r * Math.cos(th), 0.03 + 0.006 * R(), R() * 3, (0.03 + 0.02 * R()) * s, (0.022 + 0.012 * R()) * s, col(pick(['#c8402c', '#d85040', '#e88aa0', '#f0a8b4', '#f4efe6', '#e8e2d4', '#b83828'], R()), 0.08), whenR(r) + 0.3 + 0.1 * R(), 2);
      }
      // --- the far end: the dark trees, standing small at the foot of the wall
      const X1 = V3(1, 0, 0);
      for (let i = 0; i < 46; i++) {
        const x = lerp(-0.74, 0.0, R()), h = 0.045 + 0.1 * R() * (0.5 + 0.5 * Math.cos((x + 0.3) * 3)), zz = 0.03 + 0.05 * R();
        card(V3(x, h * 0.55 + 0.012, zz), X1, UP, 0.06 + 0.05 * R(), h, pick(TREE, R()).clone().multiplyScalar(0.9 + 0.25 * R()), 0.1 + 0.25 * R(), 2, 0.3);
      }
    }

    // ---------------------------------------------------------- what the toy leaves on the sand: the print of two wheels (its own metres: z the way it goes)
    const rut = part();
    {
      const cR = C(['#a98a5c', '#a08254', '#b09264'], 0.12);
      for (const sx of [-1, 1]) for (let j = 0; j < 2; j++) {
        const mid = V3(sx * 0.085 + (R() - 0.5) * 0.01, 0.001 * j, (j - 0.5) * 0.045), ax = V3(0, 0, 1), ay = V3(1, 0, 0), l = 0.075 + 0.02 * R(), w = 0.034 + 0.008 * R(), n = V3(0, 1, 0), fl = R() < 0.5 ? 1 : 0, c = pick(cR, R());
        for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, -1], [1, 1], [-1, 1]]) vert(rut, mid.clone().addScaledVector(ax, a * l / 2).addScaledVector(ay, b * w / 2), n, c, UVQ(1, fl ? (1 - a) / 2 : (a + 1) / 2, (b + 1) / 2), mid, FIX);
      }
    }
    this.onSand = (x, z) => { const r = Math.hypot(x - VX, z - VZ), th = Math.atan2(-(x - VX), z - VZ); return z > 0.25 && r < SAND_R * 0.85 && th < TH_EDGE - 0.04 && x < sandRight(z) - 0.14; };

    // ---------------------------------------------------------- a bench: slats weathered grey-green, on two iron ends
    // (its own metres: x along it, z the way it faces)
    const bench = part();
    {
      const tw = mixer(WD, WDH, 0.45, 0.16), ti = mixer(IR, IRH, 0.4, 0.2), HL = 0.265;
      for (const z of [-0.06, -0.02, 0.02, 0.06]) bar(bench, V3(-HL, 0.153, z), V3(HL, 0.153, z), UP, 0.009, 0.031, WD, tw);
      for (const [y, z] of [[0.25, -0.094], [0.305, -0.106]]) bar(bench, V3(-HL, y, z), V3(HL, y, z), V3(0, 0.2, 1), 0.009, 0.034, WD, tw);
      for (const x of [-0.235, 0.235]) {
        const X = V3(x < 0 ? -1 : 1, 0, 0);
        bar(bench, V3(x, 0, -0.07), V3(x, 0.335, -0.112), X, 0.012, 0.013, IR, ti, { top: 1 });      // the back leg, up to the top of the back
        bar(bench, V3(x, 0, 0.078), V3(x, 0.15, 0.07), X, 0.012, 0.013, IR, ti, { top: 1 });         // the front leg
        bar(bench, V3(x, 0.143, -0.09), V3(x, 0.143, 0.082), X, 0.012, 0.012, IR, ti, { top: 1 });    // under the seat
        bar(bench, V3(x, 0.05, -0.074), V3(x, 0.115, 0.07), X, 0.01, 0.01, IR, ti, { top: 1 });       // the stay between the legs
      }
    }

    // ---------------------------------------------------------- one of the great spiked plants: blades, each one loaded stroke
    const plant = part();
    {
      const un = under(AG), ta = mixer(AG, AGH, 0.45, 0.2), c = new THREE.Color();
      ball(plant, [0, 0.045, 0], [0.05, 0.05, 0.05], nw => c.copy(un(nw)).multiplyScalar(0.7), { detail: 2 });
      for (let i = 0; i < 30; i++) {
        const az = i * 2.39996 + R() * 0.4, tier = i / 30, el = lerp(1.25, 0.25, Math.pow(tier, 0.8)) + (R() - 0.5) * 0.15, len = lerp(0.17, 0.27, R()) * (0.75 + 0.35 * tier), droop = lerp(0.02, 0.16, tier) * (0.7 + 0.6 * R());
        const h = V3(Math.cos(az), 0, Math.sin(az)), Ps = [], Ns = [];
        for (let k = 0; k < 6; k++) { const t = k / 5; Ps.push(V3(0, 0.03, 0).addScaledVector(h, 0.012 + t * len * Math.cos(el)).addScaledVector(UP, t * len * Math.sin(el) - droop * t * t)); }
        for (let k = 0; k < 6; k++) { const tg = Ps[Math.min(5, k + 1)].clone().sub(Ps[Math.max(0, k - 1)]).normalize(); Ns.push(UP.clone().addScaledVector(tg, -tg.y).normalize()); }
        ribbon(plant, Ps, Ns, lerp(0.026, 0.04, R()) * (0.8 + 0.3 * tier), ta(world(plant, Ns[2]).clone().lerp(UP, 0.3), R()), { cell: 0, lift: 0.001, tip: 0.002, tilt: 0.5, ridge: 0.12 });
      }
    }

    // ---------------------------------------------------------- her skirt below the knee: a bell of flounces, pink,
    // fuller behind, its folds deepening to the hem (its own frame hangs from her knees)
    const shin = part();
    {
      const ring = (y, zc, r1, r2) => ({ y, c: [0, zc], r1, r2 });
      const F = (v, th) => { const t = th + 0.2 * Math.sin(2.3 * v + 1); return 0.5 * Math.sin(t * 6 + 1.1) + 0.32 * Math.sin(t * 9 + 4.0) + 0.18 * Math.sin(t * 14 + 2.2); };
      const amp = v => (0.012 + 0.07 * Math.pow(1 - v, 1.25)) * fall(v, 0.8, 0.98);
      const fl = (v, th) => 1 + amp(v) * F(v, th);
      const uS = under(PK), c = new THREE.Color(), HOLLOW = col('#b8706c', 0.1);
      const tier = v => 0.5 + 0.5 * Math.cos(v * TAU * 3.0 + 0.6);      // three flounces: light on the top of each, shade under its edge
      const paint = (nw, v, th) => c.copy(uS(nw)).lerp(HOLLOW, 0.55 * fall(F(v, th), -0.75, 0.05) * sstep(amp(v), 0.01, 0.05) + 0.22 * (1 - tier(v))).multiplyScalar(0.78 + 0.22 * sstep(v, 0.01, 0.12));
      const S = loft(shin, [ring(-SHIN + 0.004, -0.02, 0.118, 0.124), ring(-SHIN + 0.016, -0.02, 0.113, 0.118), ring(-0.108, -0.013, 0.102, 0.103), ring(-0.052, -0.006, 0.089, 0.083), ring(-0.005, 0, 0.076, 0.06), ring(0.012, 0, 0.054, 0.038)], paint, { flute: fl, seg: 56, rows: 14, cap: true, foot: true, shrink: 0.965, dark: 0.84 });
      const tn = mixer(PK, PKH, 0.42, 0.16), n = V3();
      for (let i = 0; i < 150; i++) {      // long soft drags down the folds
        const dv = lerp(0.22, 0.4, R()), v = lerp(0.04 + dv / 2, 0.9 - dv / 2, Math.pow(R(), 1.1)), th = R() * TAU, f = F(v, th); S.normal(v, th, n);
        const c2 = tn(n, R()); if (f < -0.3) c2.lerp(HOLLOW, 0.3); else if (f > 0.45) c2.multiplyScalar(1.05);
        S.lay(v, th, dv, (R() - 0.5) * 0.06, lerp(0.026, 0.042, R()) * (1 - 0.3 * v), c2, { ridge: 0.08, tilt: 0.22, tip: 0.003 });
      }
      for (let t = 0; t < 3; t++) for (let i = 0; i < 34; i++) {      // the flounces: a row of short loaded touches to each, lighter at its top
        const v = 0.1 + t * 0.31 + 0.06 * R(), th = (i + R()) / 34 * TAU; S.normal(v, th, n);
        S.lay(v, th, lerp(0.14, 0.2, R()), (R() - 0.5) * 0.1, lerp(0.022, 0.034, R()) * (1 - 0.25 * v), tn(n, R()).multiplyScalar(1.07), { ridge: 0.1, tip: 0.006, lift: 0.004, tilt: 0.3, cell: 0 });
      }
      for (let i = 0; i < 30; i++) { const th = R() * TAU; S.normal(0.03, th, n); S.lay(0.035, th, 0.014, 0.14 + 0.12 * R(), 0.02, tn(n, R()).multiplyScalar(0.78), { cell: 1, tip: 0.001 }); }      // the hem, in shade, close on the path
    }
    // ---------------------------------------------------------- her skirt above the knee (hung from her hips: it lies along her lap when she sits)
    const thigh = part(new THREE.Matrix4().makeRotationX(-1.33));      // (his light is laid on it as it lies when she sits)
    {
      const ring = (y, r1, r2) => ({ y, c: [0, 0.004], r1, r2 });
      const uS = under(PK), c = new THREE.Color();
      const S = loft(thigh, [ring(-THIGH - 0.034, 0.016, 0.012), ring(-THIGH - 0.026, 0.044, 0.03), ring(-THIGH - 0.008, 0.07, 0.045), ring(-0.09, 0.074, 0.048), ring(-0.035, 0.07, 0.048), ring(0.012, 0.058, 0.042)], nw => c.copy(uS(nw)), { seg: 30, rows: 14, cap: true, foot: true, shrink: 0.95, dark: 0.86 });
      const tn = mixer(PK, PKH, 0.42, 0.16), n = V3();
      for (let i = 0; i < 90; i++) { const dv = lerp(0.3, 0.5, R()), v = lerp(0.22 + dv / 2, 0.94 - dv / 2, R()), th = R() * TAU; S.normal(v, th, n); S.lay(v, th, dv, (R() - 0.5) * 0.1, lerp(0.024, 0.038, R()), tn(world(thigh, n).clone(), R()), { ridge: 0.08, tilt: 0.24, tip: 0.003 }); }
      for (let i = 0; i < 70; i++) { const v = 0.03 + 0.3 * R(), th = R() * TAU; S.normal(v, th, n); S.lay(v, th, lerp(0.14, 0.24, R()), (R() - 0.5) * 0.5, lerp(0.022, 0.034, R()), tn(world(thigh, n).clone(), R()), { ridge: 0.08, tilt: 0.3, tip: 0.004, lift: 0.0025 }); }      // over her knees
    }
    // ---------------------------------------------------------- her hips: the skirt gathered behind, as it was worn that year, and the foot of her jacket over it
    const pelvis = part();
    {
      const uS = under(PK), uB = under(BK), c = new THREE.Color(), tn = mixer(PK, PKH, 0.42, 0.16), tb = mixer(BK, BKH, 0.5, 0.3);
      ball(pelvis, [0, -0.012, 0.0], [0.068, 0.05, 0.052], nw => c.copy(uS(nw)), { detail: 3, dark: 0.84 });
      coat(pelvis, [0, -0.012, 0.0], [0.068, 0.05, 0.052], 36, tn, { l: [0.04, 0.06], w: [0.022, 0.03], flow: DOWN, jit: 0.8, tip: 0.003 });
      ball(pelvis, [0, -0.04, -0.043], [0.058, 0.074, 0.046], nw => c.copy(uS(nw)), { detail: 3, dark: 0.84 });
      coat(pelvis, [0, -0.04, -0.043], [0.058, 0.074, 0.046], 50, tn, { l: [0.04, 0.065], w: [0.022, 0.032], flow: V3(0.3, -1, -0.2), jit: 1.2, tip: 0.005, keep: (p, n) => n.z < 0.4 });
      const S = loft(pelvis, [{ y: -0.02, c: [0, -0.01], r1: 0.069, r2: 0.06 }, { y: 0.012, c: [0, -0.006], r1: 0.061, r2: 0.052 }, { y: 0.04, c: [0, -0.002], r1: 0.05, r2: 0.043 }, { y: WAIST + 0.01, c: [0, 0], r1: 0.045, r2: 0.038 }], nw => c.copy(uB(nw)), { seg: 28, rows: 6, shrink: 0.96, dark: 0.82 });
      const n = V3();
      for (let i = 0; i < 40; i++) { const v = 0.15 + 0.7 * R(), th = R() * TAU; S.normal(v, th, n); S.lay(v, th, 0.7, (R() - 0.5) * 0.2, lerp(0.016, 0.026, R()), tb(n, R()), { tip: 0.004, ridge: 0.08 }); }
    }
    // ---------------------------------------------------------- her body: a fitted black jacket, a fall of white lace at the throat
    const torso = part(M.torso);
    {
      const TR = [[-0.012, 0.047, 0.04, 0], [0.01, 0.045, 0.038, 0], [0.04, 0.053, 0.044, 0.002], [0.075, 0.061, 0.05, 0.004], [0.1, 0.064, 0.045, 0.002], [0.118, 0.056, 0.037, 0], [0.131, 0.034, 0.028, 0.002], [0.141, 0.021, 0.02, 0.004], [0.153, 0.0168, 0.0168, 0.004]];
      const uB = under(BK), c = new THREE.Color(), tb = mixer(BK, BKH, 0.5, 0.3), tw = mixer(WH, WHH, 0.5, 0.12), n = V3();
      const S = loft(torso, TR.map(([y, r1, r2, z]) => ({ y, c: [0, z], r1, r2 })), nw => c.copy(uB(nw)), { seg: 32, rows: 24, shrink: 0.94, dark: 0.82 });
      for (let i = 0; i < 90; i++) { const dv = lerp(0.12, 0.22, R()), v = lerp(0.04 + dv / 2, 0.84 - dv / 2, R()), th = R() * TAU; S.normal(v, th, n); S.lay(v, th, dv, (R() - 0.5) * 0.3, lerp(0.014, 0.024, R()), tb(world(torso, n).clone(), R()), { ridge: 0.1, tip: 0.003 }); }
      for (let i = 0; i < 22; i++) { const v = 0.56 + 0.3 * R(), th = R() * TAU; S.normal(v, th, n); if (world(torso, n).dot(KEY) < 0.3) continue; S.lay(v, th, 0.02 * (R() - 0.5), 0.3 + 0.3 * R(), lerp(0.01, 0.016, R()), pick(BK.hi, R()).clone().multiplyScalar(1.15), { cell: 1, lift: 0.003 }); }      // the light along her shoulder and sleeve head
      for (let i = 0; i < 16; i++) { const th = R() * TAU; S.normal(0.93, th, n); S.lay(0.92 + 0.05 * R(), th, 0.02, 0.6, 0.012, tw(world(torso, n).clone(), R()), { cell: 2, lift: 0.0025, tip: 0.001 }); }      // a white collar, high
      for (let i = 0; i < 16; i++) { const v = 0.86 - 0.022 * i + 0.02 * R(), th = Math.PI / 2 + (R() - 0.5) * (0.42 - 0.015 * i); S.normal(v, th, n); S.lay(v, th, 0.07, (R() - 0.5) * 0.2, lerp(0.014, 0.021, R()), tw(world(torso, n).clone(), R()), { cell: 2, lift: 0.004, tip: 0.003, ridge: 0.1 }); }      // the lace, down her front
    }

    // ---------------------------------------------------------- her head: no drawn features (the shade of the hat's
    // brim over her eyes, the cheek turned to the light, the far side lost, a mouth barely there); dark hair put up
    // behind; and her hat, pale straw, pink on top
    const head = part(M.head);
    { const NK = { hi: FL.mid, mid: FL.mid, lo: FL.lo, deep: FL.deep }; tube(head, [[0.016, -0.02], [0.0152, 0.0], [0.0148, 0.024]], NK, 12, mixer(NK, FLH, 0.25, 0.06), { l: [0.02, 0.03], w: [0.01, 0.014], cell: 2, tip: 0.001, tilt: 0.2, ridge: 0.03, dark: 0.95 }); }
    {
      const uF = under(FL), uH = under(HR), c = new THREE.Color(), c3 = new THREE.Color();
      const HC = V3(0, 0.056, 0.004), HRd = [0.0315, 0.039, 0.034], HRc = [0, 0.066, -0.009], HRr = [0.035, 0.034, 0.037];
      const gs = (x, w) => Math.exp(-(x / w) * (x / w));
      // the point of her head in the direction u from its middle: an egg, the jaw narrowed, the brow, the nose, the
      // mouth and the chin drawn forward and the eyes set back under the brow (so she has a profile)
      const skull = (u, o = V3()) => {
        const th = Math.atan2(u.x, u.z), ph = Math.asin(Math.max(-1, Math.min(1, u.y))), front = Math.max(0, Math.cos(th)) * Math.max(0, Math.cos(ph)), low = sstep(-ph, -0.1, 1.3);
        let f = HRd[2] * u.z; const sd = HRd[0] * u.x * (1 - 0.3 * low), y = HRd[1] * u.y;
        f += 0.0078 * gs(th, 0.25) * gs(ph + 0.2, 0.15) + 0.0026 * gs(th, 0.18) * gs(ph - 0.0, 0.2);      // her nose, and its bridge
        f += 0.003 * gs(th, 0.32) * gs(ph + 0.58, 0.11);                                                    // her mouth
        f += 0.0058 * front * front * gs(ph + 0.98, 0.26) - 0.007 * front * low;                           // her chin; the jaw falls back under it
        f += 0.0026 * front * gs(ph - 0.3, 0.14) - 0.0026 * gs(Math.abs(th) - 0.4, 0.2) * gs(ph - 0.08, 0.12);      // her brow; her eyes set in under it
        return o.set(HC.x + sd, HC.y + y, HC.z + f);
      };
      const e1 = V3(), e2 = V3(), qa = V3(), qb = V3(), qc = V3(), qd = V3();
      const skullN = (u, o = V3()) => { e1.set(u.z, 0, -u.x); if (e1.lengthSq() < 1e-6) e1.set(1, 0, 0); e1.normalize(); e2.crossVectors(u, e1).normalize(); const h = 0.03; skull(qc.copy(u).addScaledVector(e1, h).normalize(), qa); skull(qc.copy(u).addScaledVector(e1, -h).normalize(), qb); qa.sub(qb); skull(qc.copy(u).addScaledVector(e2, h).normalize(), qb); skull(qc.copy(u).addScaledVector(e2, -h).normalize(), qd); qb.sub(qd); o.crossVectors(qa, qb).normalize(); if (o.dot(u) < 0) o.negate(); return o; };
      const dirOf = (p, o = V3()) => o.set((p.x - HC.x) / HRd[0], (p.y - HC.y) / HRd[1], (p.z - HC.z) / HRd[2]).normalize();
      const hairy = u => u.y > 0.62 - 0.25 * u.z || u.z < -0.05 || (Math.abs(u.x) > 0.82 && u.y > -0.25 && u.z < 0.35);
      // (a soft patch of the face round the direction (x, y, z), wider across than up and down)
      const gz = (n, x, y, z, rx, ry = rx) => { const k = 1 / Math.hypot(x, y, z), dx = (n.x - x * k) / rx, dy = (n.y - y * k) / ry, dz = (n.z - z * k) / rx; return Math.exp(-(dx * dx + dy * dy + dz * dz)); };
      // her face: no feature is drawn. The brim's shade lies over her brow and eyes, her eyes are the deepest of it,
      // her cheek and chin come out into the light, the far side is lost, her mouth is barely there, and what turns
      // down (under the nose, the lip, the jaw) is in shade.
      const face = (nw, u, nl) => {
        if (hairy(u) && u.z < 0.3) return c.copy(uH(nw));
        c.copy(uF(nw)).lerp(LOST, 0.42 * sstep(u.x, 0.15, 0.9));
        c.lerp(BRIM, 0.55 * sstep(u.y, -0.2, 0.3));
        c.lerp(SOCK, 0.4 * gz(u, 0, 0.16, 0.95, 0.6, 0.11));
        for (const sx of [-1, 1]) c.lerp(SOCK, 0.5 * gz(u, sx * 0.4, 0.08, 0.9, 0.27, 0.15)).lerp(EYE, 0.5 * gz(u, sx * 0.4, 0.045, 0.9, 0.2, 0.05)).lerp(CHEEK, 0.26 * gz(u, sx * 0.56, -0.32, 0.8, 0.2));
        c.lerp(SOCK, 0.34 * gz(u, 0.2, -0.12, 0.96, 0.09)).lerp(SOCK, 0.4 * gz(u, 0.02, -0.36, 0.95, 0.11, 0.05));      // beside her nose, and under it
        c.lerp(LIP, 0.55 * gz(u, 0, -0.58, 0.82, 0.15, 0.055)).lerp(SOCK, 0.32 * gz(u, 0, -0.6, 0.82, 0.13, 0.016)).lerp(SOCK, 0.36 * gz(u, 0, -0.75, 0.68, 0.14, 0.07));
        c.lerp(SOCK, 0.5 * sstep(-nl.y, 0.45, 0.9));                                                    // under her jaw
        return c.lerp(c3.copy(uH(nw)), sstep(u.y - (0.62 - 0.25 * u.z), -0.07, 0.05));
      };
      { const g = shape.ball(1, 0xffffff, 7), p = g.attributes.position, nr = g.attributes.normal, u = V3(), q = V3(), n = V3();      // the form under the paint
        for (let i = 0; i < p.count; i++) { u.fromBufferAttribute(p, i).normalize(); skull(u, q); skullN(u, n); p.setXYZ(i, HC.x + (q.x - HC.x) * 0.955, HC.y + (q.y - HC.y) * 0.955, HC.z + (q.z - HC.z) * 0.955); nr.setXYZ(i, n.x, n.y, n.z); }
        solid(head, g, V3(0, 0.017, 0), (nw, v, nn) => dk.copy(face(nw, dirOf(v, u), nn)).multiplyScalar(0.95)); }
      for (let i = 0; i < 420; i++) {      // and the paint: small soft touches, each taking its tone from where it lies
        const yy = 1 - 2 * R(), a = R() * TAU, sq = Math.sqrt(Math.max(0, 1 - yy * yy)), u0 = V3(sq * Math.sin(a), yy, sq * Math.cos(a)), r1 = R(), r2 = R(), r3 = R();
        if (hairy(u0) || u0.z < -0.15 || u0.y - (0.62 - 0.25 * u0.z) > 0.02) continue;
        const d = along(u0, V3(0.2, -1, 0), 1.4), len = lerp(0.009, 0.015, r1) / 0.035, Ps = [], Ns = [];
        for (let k = 0; k < 6; k++) { const al = (k / 5 - 0.5) * len, u = u0.clone().multiplyScalar(Math.cos(al)).addScaledVector(d, Math.sin(al)).normalize(); Ps.push(skull(u)); Ns.push(skullN(u)); }
        const n0 = skullN(u0);
        ribbon(head, Ps, Ns, lerp(0.0075, 0.0115, r2), face(world(head, n0).clone(), u0, n0).clone().multiplyScalar(1 + (r3 - 0.5) * 0.07), { cell: 2, tip: 0.0008, lift: 0.0011, ridge: 0.02, tilt: 0.14 });
      }
      { const u = V3(-0.02, -0.12, 1).normalize(), n = skullN(u); stroke(head, skull(u), n, V3(0.04, 1, 0).normalize(), 0.014, 0.0048, FL.hi[0], { cell: 2, lift: 0.0007, tip: 0, tilt: 0.05, ridge: 0.03 }); }      // the light down her nose
      { const u = V3(-0.5, -0.36, 0.78).normalize(), n = skullN(u); stroke(head, skull(u), n, V3(0.3, 1, 0).normalize(), 0.013, 0.009, FL.hi[1], { cell: 2, lift: 0.0007, tip: 0, tilt: 0.05, ridge: 0.02 }); }       // and on the cheek she turns to you
      // her hair, put up behind and low on her neck
      const th = mixer(HR, HRH, 0.5, 0.3), HK = (p, n) => p.z < 0.006 || p.y > 0.09;
      ball(head, HRc, HRr, nw => c.copy(uH(nw)), { detail: 3 });
      ball(head, [0, 0.045, -0.034], [0.021, 0.02, 0.018], nw => c.copy(uH(nw)), { detail: 2 });
      coat(head, HRc, HRr, 70, th, { l: [0.018, 0.03], w: [0.011, 0.017], grow: 1.02, keep: HK, flow: V3(0.2, -0.2, -1), jit: 1.2, tip: 0.004 });
      coat(head, [0, 0.045, -0.034], [0.021, 0.02, 0.018], 18, th, { l: [0.014, 0.022], w: [0.009, 0.013], flow: ACROSS, jit: 1.6, tip: 0.004 });
      // her hat: a brim tipped a little down in front, a low crown, pink ribbon and flowers heaped on it, something white behind
      const uS = under(SW), ts = mixer(SW, SWH, 0.4, 0.14), BRc = [0, 0.091, 0.004], BRr = [0.06, 0.006, 0.064], rot = [0.07, 0, 0.05], CRc = [0, 0.103, -0.002], CRr = [0.036, 0.021, 0.038];
      const shade = (nw, v, nn) => (nn.y < -0.2 ? c.copy(SW.deep[0]).multiplyScalar(0.8) : c.copy(uS(nw)));
      ball(head, BRc, BRr, shade, { rot, detail: 4, shrink: 0.97, dark: 0.86 });
      coat(head, BRc, BRr, 80, (nw, r, nn) => (nn.y < -0.2 ? pick(SW.lo, r).clone().multiplyScalar(0.78 + 0.1 * r) : ts(nw, r)), { rot, l: [0.03, 0.05], w: [0.014, 0.02], flow: ACROSS, jit: 3, tip: 0.002, lift: 0.001, tilt: 0.2 });
      ball(head, CRc, CRr, nw => c.copy(uS(nw)), { detail: 3, dark: 0.86 });
      coat(head, CRc, CRr, 30, ts, { l: [0.025, 0.04], w: [0.012, 0.018], flow: ACROSS, jit: 0.8, tip: 0.002, keep: (p, n) => n.y > -0.2 });
      coat(head, [0.004, 0.12, 0.012], [0.03, 0.016, 0.026], 44, (nw, r) => pick(ROSE, r).clone().multiplyScalar(0.8 + 0.3 * Math.max(0, nw.dot(KEY))), { l: [0.014, 0.022], w: [0.011, 0.016], jit: 3, cell: 2, tip: 0.004, lift: 0.003, ridge: 0.12, keep: (p, n) => n.y > -0.3 });
      ball(head, [0.004, 0.117, 0.012], [0.022, 0.011, 0.019], () => c.copy(ROSE[2]), { detail: 2, dark: 0.8 });
      coat(head, [-0.006, 0.118, -0.026], [0.022, 0.018, 0.018], 12, (nw, r) => pick(PLUME, r).clone(), { l: [0.02, 0.03], w: [0.009, 0.013], flow: V3(0, 0.3, -1), jit: 1.5, cell: 1, tip: 0.006, lift: 0.002, keep: (p, n) => n.y > -0.2 });
    }

    // ---------------------------------------------------------- her arms (each bone along its own +y): black sleeves, a little full at the shoulder; tan gloves
    const tb2 = mixer(BK, BKH, 0.5, 0.3), tg = mixer(GL, GLH, 0.4, 0.14), uB2 = under(BK), uG = under(GL), cA = new THREE.Color();
    const SLV = { l: [0.04, 0.07], w: [0.014, 0.021], tip: 0.0018, ridge: 0.08, tilt: 0.26, dark: 0.82 };
    const upper = rest => {
      const Pt = part(rest);
      tube(Pt, [[0.0195, 0], [0.02, 0.03], [0.018, 0.07], [0.0162, L1]], BK, 34, tb2, SLV);
      ball(Pt, [0, 0.014, 0], [0.0225, 0.026, 0.0225], nw => cA.copy(uB2(nw)), { detail: 3, dark: 0.82 });
      coat(Pt, [0, 0.014, 0], [0.0225, 0.026, 0.0225], 22, tb2, { l: [0.02, 0.034], w: [0.012, 0.018], ridge: 0.1, tip: 0.003 });
      return Pt;
    };
    const fore = rest => {
      const Pt = part(rest);
      tube(Pt, [[0.016, 0], [0.0164, 0.03], [0.014, 0.065], [0.012, 0.09]], BK, 30, tb2, SLV);
      for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + R(), n = V3(Math.cos(a), 0, Math.sin(a)); stroke(Pt, V3(n.x * 0.0125, 0.089, n.z * 0.0125), n, V3(-n.z, 0, n.x), 0.016, 0.007, pick(WH.mid, R()), { cell: 2, lift: 0.0012, tip: 0.0005 }); }      // a cuff
      ball(Pt, [0, L2 - 0.001, 0.001], [0.0118, 0.02, 0.0092], nw => cA.copy(uG(nw)), { detail: 3, dark: 0.92 });      // her gloved hand, closed
      coat(Pt, [0, L2 - 0.001, 0.001], [0.0118, 0.02, 0.0092], 20, tg, { l: [0.012, 0.02], w: [0.008, 0.012], cell: 2, tip: 0.0008, ridge: 0.04, tilt: 0.16 });
      return Pt;
    };
    const ru = upper(M.ru), rf = fore(M.rf), lu = upper(M.lu), lf = fore(M.lf);

    // ---------------------------------------------------------- her parasol: the stick (along its own +y, from the handle), and the canopy
    const stick = part(M.stick);
    {
      tube(stick, [[0.003, -0.006], [0.003, STICK]], GL, 8, tg, { l: [0.06, 0.1], w: [0.005, 0.0065], tip: 0.0006, lift: 0.0006, ridge: 0.06, tilt: 0.1, dark: 0.9 });
      ball(stick, [0, -0.01, 0], [0.0052, 0.007, 0.0052], nw => cA.copy(uG(nw)).multiplyScalar(0.8), { detail: 2, dark: 0.95 });
      coat(stick, [0, -0.01, 0], [0.0052, 0.007, 0.0052], 6, (nw, r) => tg(nw, r).multiplyScalar(0.8), { l: [0.008, 0.012], w: [0.006, 0.008], cell: 2, tip: 0.0005, lift: 0.0006 });
    }
    // (the canopy's own frame: its top at the origin, its rim CAN_H below, towards the handle; white, in eight gores,
    // a frill of lace at its edge; painted inside as well as out, since from the front you look up into it)
    const canopy = part(M.canopy);
    {
      const uW = under(WH), c = new THREE.Color(), tw = mixer(WH, WHH, 0.5, 0.12), INSIDE = C(['#dcd6c8', '#d2ccbe', '#e4decf', '#c8c4b8'], 0.08);
      const at = (t, a, o = V3()) => { const r = CAN_R * Math.pow(Math.sin(t * Math.PI / 2), 0.9) * (1 - 0.035 * Math.pow(t, 3) * (0.5 + 0.5 * Math.cos(a * 8))), y = -CAN_H * (1 - Math.cos(t * Math.PI / 2)); return o.set(Math.cos(a) * r, y, Math.sin(a) * r); };
      const nrm = (t, a) => { const e = 0.02, p0 = at(Math.max(0.02, t - e), a), p1 = at(Math.min(1, t + e), a), tg2 = p1.sub(p0).normalize(), rad = V3(Math.cos(a), 0, Math.sin(a)), n = rad.clone().multiplyScalar(-tg2.y).addScaledVector(UP, tg2.dot(rad)); return n.lengthSq() < 1e-8 ? V3(0, 1, 0) : n.normalize(); };
      // its body: a thin dome, a little smaller, lighter in each gore's middle
      { const NT = 9, NA = 32, pos = [], idx = [];
        for (let i = 0; i <= NT; i++) for (let j = 0; j < NA; j++) { const p = at(0.03 + 0.95 * i / NT, j / NA * TAU); pos.push(p.x * 0.97, p.y - 0.0015, p.z * 0.97); }
        for (let i = 0; i < NT; i++) for (let j = 0; j < NA; j++) { const a = i * NA + j, b = i * NA + (j + 1) % NA, cc = a + NA, d = b + NA; idx.push(a, b, cc, b, d, cc); }
        let g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
        if (g.attributes.normal.getY(NA * 2) < 0) { g.setIndex(idx.map((_, i) => idx[i - i % 3 + [0, 2, 1][i % 3]])); g.computeVertexNormals(); }
        g = g.toNonIndexed(); const cols = new Float32Array(g.attributes.position.count * 3), p = V3(), n = V3();
        for (let i = 0; i < g.attributes.position.count; i++) { p.fromBufferAttribute(g.attributes.position, i); n.fromBufferAttribute(g.attributes.normal, i); const a = Math.atan2(p.z, p.x), k = 0.84 * (0.88 + 0.12 * Math.abs(Math.cos(a * 4))); c.copy(uW(world(canopy, n))); cols[i * 3] = c.r * k; cols[i * 3 + 1] = c.g * k; cols[i * 3 + 2] = c.b * k; }
        g.setAttribute('color', new THREE.BufferAttribute(cols, 3)); solid(canopy, g, V3(0, -CAN_H, 0)); }
      const gore = (a, t0, t1, w, cc, off, o) => { const Ps = [], Ns = []; for (let k = 0; k < 6; k++) { const t = lerp(t0, t1, k / 5), n = nrm(t, a); Ps.push(at(t, a).addScaledVector(n, off)); Ns.push(off < 0 ? n.negate() : n); } ribbon(canopy, Ps, Ns, w, cc, o); };
      for (let i = 0; i < 76; i++) { const a = R() * TAU, t0 = 0.04 + 0.4 * R(), t1 = Math.min(1.02, t0 + 0.45 + 0.3 * R()); gore(a, t0, t1, lerp(0.034, 0.056, R()) * (0.5 + 0.5 * t1), tw(world(canopy, nrm((t0 + t1) / 2, a)).clone(), R()), 0.001, { cell: 0, tip: 0.003, ridge: 0.08, tilt: 0.2 }); }
      for (let i = 0; i < 30; i++) { const a = R() * TAU, t0 = 0.08 + 0.4 * R(), t1 = Math.min(0.99, t0 + 0.45 + 0.3 * R()); gore(a, t0, t1, lerp(0.03, 0.05, R()) * (0.5 + 0.5 * t1), pick(INSIDE, R()).clone().multiplyScalar(0.86 + 0.2 * R()), -0.004, { cell: 0, tip: 0.002, ridge: 0.05, tilt: 0.2 }); }      // inside
      for (let i = 0; i < 8; i++) gore(i / 8 * TAU + 0.39, 0.05, 0.98, 0.006, col('#b4ac9c', 0.1), -0.0065, { cell: 1, tip: 0, tilt: 0.05, ridge: 0 });      // its ribs, inside
      for (let i = 0; i < 36; i++) { const a = (i + R() * 0.6) / 36 * TAU, p = at(1, a), rad = V3(Math.cos(a), 0, Math.sin(a)); stroke(canopy, p.addScaledVector(rad, 0.004).add(V3(0, -0.008, 0)), rad, V3(-Math.sin(a) * 0.3, -1, Math.cos(a) * 0.3).normalize(), 0.013 + 0.005 * R(), 0.022 + 0.006 * R(), pick(WH.hi, R()).clone().multiplyScalar(0.96 + 0.1 * R()), { cell: 2, lift: 0.001, tip: 0.004, ridge: 0.1, tilt: 0.4 }); }      // the lace
    }

    // (and the canopy shut: a loose spindle of the same white round the stick, its lace bunched at the open end, as he has it)
    const furl = part(M.canopy);
    {
      const uW = under(WH), c = new THREE.Color(), tw = mixer(WH, WHH, 0.5, 0.12), n = V3(), FL_ = 0.125;
      const fl = (v, th) => 1 + 0.16 * Math.sin(th * 5 + v * 4) * fall(v, 0.6, 1) + 0.08 * Math.sin(th * 9 + 1.3);
      const S = loft(furl, [{ y: -FL_ - 0.008, c: [0, 0], r1: 0.012, r2: 0.012 }, { y: -FL_, c: [0, 0], r1: 0.031, r2: 0.03 }, { y: -FL_ * 0.72, c: [0, 0], r1: 0.028, r2: 0.027 }, { y: -FL_ * 0.4, c: [0, 0], r1: 0.019, r2: 0.019 }, { y: -FL_ * 0.12, c: [0, 0], r1: 0.009, r2: 0.009 }, { y: 0, c: [0, 0], r1: 0.0045, r2: 0.0045 }], (nw, v, th) => c.copy(uW(nw)).multiplyScalar(0.92 - 0.14 * fall(Math.sin(th * 5 + v * 4), -0.6, 0.2)), { flute: fl, seg: 30, rows: 12, cap: true, foot: true, shrink: 0.93, dark: 0.84 });
      for (let i = 0; i < 46; i++) { const dv = lerp(0.3, 0.55, R()), v = lerp(0.12 + dv / 2, 0.97 - dv / 2, R()), th = R() * TAU; S.normal(v, th, n); S.lay(v, th, dv, (R() - 0.5) * 0.5, lerp(0.012, 0.02, R()) * (1.15 - 0.6 * v), tw(world(furl, n).clone(), R()), { ridge: 0.1, tilt: 0.3, tip: 0.003 }); }
      for (let i = 0; i < 34; i++) { const v = 0.04 + 0.2 * R(), th = R() * TAU; S.normal(v, th, n); S.lay(v, th, 0.1 + 0.06 * R(), (R() - 0.5) * 0.9, lerp(0.014, 0.02, R()), pick(WH.hi, R()).clone().multiplyScalar(0.96 + 0.1 * R()), { cell: 2, lift: 0.004, tip: 0.007, ridge: 0.12, tilt: 0.5 }); }      // the lace, bunched
    }

    // ---------------------------------------------------------- the rig: every solid thing, one draw call
    const parts = { ground, rut, bench, plant, shin, thigh, pelvis, torso, head, ru, rf, lu, lf, stick, canopy, furl };
    let total = 0; for (const p of Object.values(parts)) total += p.n;
    const ru_ = this.ru = { uT: { value: 0 } };
    const rm = new THREE.MeshStandardMaterial({ vertexColors: true, color: 0xa8a8a8, map: brushPrint(), alphaTest: 0.4, roughness: 0.92, metalness: 0, emissive: 0xffffff, emissiveIntensity: 0.5, side: THREE.DoubleSide });
    rm.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, ru_);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec3 aCen; attribute vec4 aFly; uniform float uT; varying float vBody;')
        .replace('#include <begin_vertex>', `#include <begin_vertex>
  {
    // a stroke of the ground: it comes out along the path from the far end, small, and grows into its place;
    // a body (no flight) stays where it is and is scumbled in, thin at first (vBody, for the fragments)
    vec3 rel = transformed - aCen;
    float k = clamp((uT - aFly.w) / ${FLY.toFixed(2)}, 0.0, 1.0), fl = step(1.0e-6, dot(aFly.xyz, aFly.xyz));
    float e = 1.0 - (1.0 - k) * (1.0 - k);
    float s = fl > 0.5 ? (k <= 0.0 ? 0.0 : 0.2 + 0.8 * e) : 1.0;
    vBody = fl > 0.5 ? 1.0 : k;
    transformed = aCen + rel * s + aFly.xyz * (1.0 - e);
  }`);
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vBody;')
        .replace('#include <map_fragment>', '#include <map_fragment>\n  if (vBody < 0.999) { vec2 bq = mod(floor(gl_FragCoord.xy), 4.0); float bt = (mod(bq.x + bq.y * 2.0, 4.0) * 4.0 + mod(bq.x * 3.0 + bq.y, 4.0) + 0.5) / 16.0; if (vBody < bt) discard; }')
        .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n  totalEmissiveRadiance *= vColor.rgb;\n#ifdef USE_MAP\n  totalEmissiveRadiance *= sampledDiffuseColor.rgb;\n#endif');
    };
    rm.customProgramCacheKey = () => 'chase-park';
    const NRUT = 72, rig = this.rig = L.rig(28 + NRUT, total + 64, rm);
    this.I = {}; const gid = {};
    for (const [name, p] of Object.entries(parts)) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(p.pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(p.nor, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(p.col, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(p.uv, 2)); g.setAttribute('aCen', new THREE.Float32BufferAttribute(p.cen, 3)); g.setAttribute('aFly', new THREE.Float32BufferAttribute(p.fly, 4));
      gid[name] = rig.geo(g); this.I[name] = rig.add(gid[name]); rig.mat(this.I[name], this.B);
      p.pos = p.nor = p.col = p.uv = p.cen = p.fly = null;
    }
    this.I.benches = [this.I.bench, rig.add(gid.bench), rig.add(gid.bench), rig.add(gid.bench)];
    this.I.plants = [this.I.plant, rig.add(gid.plant)];
    this.I.ruts = [this.I.rut]; for (let i = 1; i < NRUT; i++) this.I.ruts.push(rig.add(gid.rut));
    this.ruts = this.I.ruts.map(() => ({ x: 0, z: 0, yaw: 0, on: false }));
    this.HER = ['shin', 'thigh', 'pelvis', 'torso', 'head', 'ru', 'rf', 'lu', 'lf', 'stick'];

    this.shade = L.blobs(9, { fade: true, y: L.y + 0.034 });
    this.reset(L);
  },

  // ---------------------------------------------------------------- her pose
  // A two-bone arm from shoulder S to hand T: the elbow towards `pole`. Fills the two bones' matrices (each along its own +y).
  arm(S, T, pole, M1, M2) {
    const V = this.V, d = V.d.copy(T).sub(S), len = d.length(), dist = Math.max(L2 - L1 + 0.012, Math.min(L1 + L2 - 0.003, len)); d.multiplyScalar(1 / Math.max(1e-5, len));
    const a = (L1 * L1 - L2 * L2 + dist * dist) / (2 * dist), h = Math.sqrt(Math.max(0, L1 * L1 - a * a));
    const p1 = V.p1.copy(pole).addScaledVector(d, -pole.dot(d)).normalize();
    const E = V.el.copy(S).addScaledVector(d, a).addScaledVector(p1, h), tip = V.t.copy(S).addScaledVector(d, dist);
    M1.compose(S, V.q.setFromUnitVectors(V.up, V.p1.copy(E).sub(S).normalize()), V.one);
    M2.compose(E, V.q.setFromUnitVectors(V.up, V.p1.copy(tip).sub(E).normalize()), V.one);
  },

  // Everything of hers, in her own frame (the ground under where she stands to sit; z the way she faces), from o:
  // sit (0 standing, 1 on the bench), ph (steps walked) and going (0..1), off (the parasol off her shoulder), shut,
  // down (let down to the path), pose (settled into the picture), and the small things. Into this.M.
  pose(o) {
    const V = this.V, M = this.M;
    const eul = (m, x, y, z, yaw, pitch, roll) => m.compose(V.pos.set(x, y, z), V.q.setFromEuler(V.e.set(pitch, yaw, roll, 'YXZ')), V.one);
    const sit = ease.inOut(o.sit), going = o.going, sw = Math.sin(Math.PI * o.ph), st = 0.5 - 0.5 * Math.cos(TAU * o.ph), pz = ease.inOut(clamp01(o.sit * 1.12));
    // her hips: up and over each step; back and down onto the bench
    const py = lerp(HIP_Y, PEL_SIT[0], sit) + going * 0.005 * st - 0.003 * o.pose, pzz = lerp(0, PEL_SIT[1], pz);
    eul(M.pelvis, going * 0.004 * sw, py, pzz, going * 0.05 * sw, 0.1 * hump(o.sit, 0, 1), going * 0.025 * sw);
    // her skirt: her knees stay over her feet as she sits, so the upper skirt comes forward into a lap and the bell stands where it stood
    const hinge = Math.acos(Math.max(-1, Math.min(1, (py - SHIN) / THIGH)));
    eul(M.thigh, going * 0.004 * sw, py, pzz, 0, -hinge - going * 0.05 * st, 0);
    const kz = pzz + THIGH * Math.sin(hinge), lag = Math.sin(Math.PI * o.ph - 0.9);
    eul(M.shin, 0, Math.max(SHIN - 0.002, py - THIGH * Math.cos(hinge)), kz, 0, -going * (0.03 + 0.06 * st), going * 0.045 * lag);
    // her body: forward as she goes down, then upright, turned a little to the arm that holds the parasol
    eul(V.l, 0, WAIST, 0, lerp(going * -0.06 * sw, -0.3, o.pose), 0.03 + 0.34 * hump(o.sit, 0.02, 1) + 0.05 * o.pose + 0.012 * o.breath, going * -0.02 * sw + 0.03 * o.pose);
    M.torso.multiplyMatrices(M.pelvis, V.l);
    // her head: up as she walks; then turned to you and bent, as he has her; now and then along the path, the way she came
    eul(V.l, NECK[0], NECK[1], NECK[2], lerp(0.04 * going * sw, lerp(-0.5, 0.9, o.glance) + o.gy, o.pose), lerp(0.04, lerp(0.17, 0.0, o.glance) + o.gp, o.pose) - 0.2 * hump(o.sit, 0, 0.9), lerp(0, lerp(-0.07, 0.04, o.glance), o.pose));
    M.head.multiplyMatrices(M.torso, V.l);
    // her parasol: on her shoulder, open; brought upright in front and shut; swung forward and down to stand on the path
    const offE = ease.inOut(o.off), dnE = ease.inOut(o.down);
    const hA = V.a.set(-0.058, 0.072, 0.066).applyMatrix4(M.torso), hB = V.b.set(-0.058, 0.09, 0.115).applyMatrix4(M.torso);
    V.q.setFromUnitVectors(V.up, V.c.set(-0.03 + 0.03 * going * sw, 0.76, -0.65).normalize()); V.q2.setFromUnitVectors(V.up, V.d.set(-0.05, 0.98, 0.18).normalize()); V.q.slerp(V.q2, offE);
    const dC = V.c.set(-0.03, -0.97, 0.22).normalize(); V.q2.setFromUnitVectors(V.up, dC); V.q.slerp(V.q2, dnE);
    const hC = V.w.set(TIP[0], TIP[1], TIP[2]).addScaledVector(dC, -STICK);
    const hand = V.at.lerpVectors(hA, hB, offE).lerp(hC, dnE); hand.z += 0.05 * Math.sin(Math.PI * dnE); hand.y += 0.02 * Math.sin(Math.PI * dnE);
    V.q2.setFromAxisAngle(V.up, o.twirl); V.q.multiply(V.q2);
    M.stick.compose(hand, V.q, V.one);
    const sh = ease.inOut(o.shut);
    M.canopy.multiplyMatrices(M.stick, V.l.compose(V.pos.set(0, CAN_Y, 0), V.q2.identity(), V.sc.set(lerp(1, SHUT[0], sh), lerp(1, SHUT[1], sh), lerp(1, SHUT[0], sh))));
    M.furl.multiplyMatrices(M.stick, V.l.makeTranslation(0, CAN_Y, 0));
    // her arms: the right on the parasol's handle; the left by her side as she walks, in her lap when she sits
    this.arm(V.s.set(...SH_R).applyMatrix4(M.torso), V.at2.copy(hand), V.w.set(-0.55, -0.75, -0.3 + 0.2 * dnE), M.ru, M.rf);
    const hl = V.a.set(0.092 + 0.006 * sw * going, py - 0.06, pzz + 0.03 - going * 0.035 * sw).lerp(V.b.set(0.012, py + 0.062, pzz + 0.075), ease.inOut(clamp01(o.sit * 1.2 - 0.1)));
    this.arm(V.s.set(...SH_L).applyMatrix4(M.torso), hl, V.w.set(0.5 + 0.4 * sit, -0.3, -0.9), M.lu, M.lf);
  },

  walkAt(q, o) { const W = this.walk; let i = 1; while (i < W.n && W.ts[i] < q) i++; const f = clamp01((q - W.ts[i - 1]) / Math.max(1e-6, W.ts[i] - W.ts[i - 1])); o.s = Math.exp(lerp(W.ls[i - 1], W.ls[i], f)); o.ph = lerp(W.st[i - 1], W.st[i], f); return o; },
  // Where she is on her way up the path, for her size s (1 at the bench): into o.
  herAt(s, o) { const r = this.R1 * s, th = this.thS - WALK_IN * Math.pow(1 - s, 1.4); return o.set(VX - r * Math.sin(th), 0, VZ + r * Math.cos(th)); },

  // She and her bench are soft to the toy: it is eased out round them (never stopped dead, never through her).
  soften(L, dt) {
    const G = L.k.G, v = G.vehicle;
    if (L.quiet || dt <= 0 || G.state !== 'play' || !v || !v.group.visible || Math.abs(v.pos.y - L.y) > 0.45) return;
    const cb = this.benchAt(R0, this.V.a), wx = L.cx + L.tx * cb.x + L.nx * cb.z, wz = L.cz + L.tz * cb.x + L.nz * cb.z;
    const dx = v.pos.x - wx, dz = v.pos.z - wz, d = Math.hypot(dx, dz), reach = 0.3 + (v.radius || 0.19);
    if (d >= reach || d < 1e-4) return;
    const nx = dx / d, nz = dz / d, k = Math.min(1, dt * 10), into = v.vel.x * nx + v.vel.z * nz;
    v.pos.x += nx * (reach - d) * k; v.pos.z += nz * (reach - d) * k;
    if (into < 0) { v.vel.x -= nx * into * k; v.vel.z -= nz * into * k; }
  },

  hide() { if (!this.rig) return; this.rig.mesh.visible = false; this.shade.visible = false; },
  start(L, resumed) { if (!resumed) this.clear(); },
  clear() { this.c = 0; this.step = -1; this.did = {}; this.gy = 0; this.gp = 0; this.rutN = 0; this.rutAt = null; if (this.ruts) for (const r of this.ruts) r.on = false; },
  end() { this.hide(); },
  reset() { this.hide(); this.clear(); },

  update(L, dt) {
    const ph = L.phase, showing = ph === 'wake' || ph === 'play', linger = ph === 'linger', back = ph === 'return';
    if (!showing && !linger && !back) { this.hide(); return; }
    const calm = L.calm, V = this.V, M = this.M, voice = L.voice(), rig = this.rig, I = this.I, B = this.B;
    if (!back) this.c += dt;
    const c = this.c;
    // going home: the whole place draws back into the distance it came out of (g), the nearest ground first
    const g = back ? 1 - ease.inOut(ramp(L.ret, 0, 0.82)) : 1;
    rig.mesh.visible = true;
    this.ru.uT.value = back ? Math.min(c, BUILT) * (1 - ease.inOut(ramp(L.ret, 0.1, 1))) : Math.min(c, BUILT);
    rig.mat(I.ground, B);
    const sh = this.shade; let nb = 0;
    const blob = (x, z, r, k) => { if (k > 0.01 && r > 0.004) sh.set(nb++, L.cx + L.tx * x + L.nx * z, L.cz + L.tz * x + L.nz * z, r, k); };
    // a thing standing at (x, z), its size sc, turned yaw: into the rig (drawn back towards the far end by g)
    const stand = (x, z, sc, yaw) => { x = VX + (x - VX) * g; z = VZ + (z - VZ) * g; sc *= g; return V.f.compose(V.pos.set(x, 0.02 * sc, z), V.q.setFromAxisAngle(V.up, yaw), V.sc.setScalar(Math.max(1e-4, sc))).premultiply(B); };
    // ---- the benches, the furthest first: each comes up the border from the far end, growing as it comes
    BENCH_R.forEach((r, i) => {
      const k = (calm ? ease.out : ease.outBack)(ramp(c, T_BENCH[i], T_BENCH[i] + 0.75)), p = this.benchAt(r * Math.max(0.02, k), V.a), sc = r / R0 * k;
      rig.show(I.benches[i], k > 0.01); rig.mat(I.benches[i], stand(p.x, p.z, sc, YAW_B));
      blob(VX + (p.x - VX) * g, VZ + (p.z - VZ) * g, 0.3 * sc * g, 0.5 * k); blob(VX + (p.x - VX) * g, VZ + (p.z - VZ) * g, 0.17 * sc * g, 0.5 * k);
    });
    [AGAVE, AGAVE2].forEach(([x, z, size], i) => {
      const k = (calm ? ease.out : ease.outBack)(ramp(c, T_PLANT + 0.2 * (1 - i), T_PLANT + 0.2 * (1 - i) + 0.8));
      rig.show(I.plants[i], k > 0.01); rig.mat(I.plants[i], stand(VX + (x - VX) * (0.4 + 0.6 * k), VZ + (z - VZ) * (0.4 + 0.6 * k), size * k, 0.7 + i));
      blob(VX + (x - VX) * g, VZ + (z - VZ) * g, 0.2 * size * k * g, 0.5 * k);
    });
    // ---- her: first seen small at the far end; up the long path, growing; to her bench
    const q = walkE(ramp(c, T_W0, T_W1)), wk = this.walkAt(q, this.WK), s = wk.s, seen = ease.out(ramp(c, T_SEEN, T_SEEN + 0.4)), o = this.IDLE;
    const at0 = this.herAt(s, V.at), ax = at0.x, az = at0.z, a2 = this.herAt(Math.min(1, s + 0.01), V.a), a1 = this.herAt(s - 0.01, V.b);
    const yawWalk = Math.atan2(a2.x - a1.x, a2.z - a1.z);
    const yaw = turnTo(yawWalk, YAW_B, ease.inOut(ramp(c, T_TURN[0], T_TURN[1])));
    o.ph = wk.ph; o.going = q <= 0 || q >= 1 ? 0 : clamp01(Math.min(q, 1 - q) / 0.06);
    o.sit = ramp(c, T_SIT[0], T_SIT[1]); o.off = ramp(c, T_OFF[0], T_OFF[1]); o.shut = ramp(c, T_SHUT[0], T_SHUT[1]); o.down = ramp(c, T_DOWN[0], T_DOWN[1]);
    o.pose = ease.inOut(ramp(c, T_POSE[0], T_POSE[1]));
    o.breath = Math.sin(c * 1.7);
    // (settled, she looks up along the path now and then, the way she came, and back down; her parasol turns a little under her hand)
    const since = c - T_POSE[1], gl = since > 0 ? ease.inOut(hump((since + 4.2) % 9.5, 6.2, 9.3) * 1.25) : 0;
    o.glance = gl; o.twirl = since > 0 ? 0.5 * Math.sin(since * 0.7) * (calm ? 0.5 : 1) : 0;
    // (and while the toy is out on the path beside her she turns her head to it, slowly, as anyone on a bench would)
    let wy = 0, wp = 0;
    if (linger && since > 0) {
      const v = L.k.G.vehicle, lq = L.local(v.pos.x, v.pos.z), dx = lq.u - this.S.x, dz = lq.out - this.S.z, d = Math.hypot(dx, dz);
      if (v.group.visible && Math.abs(v.pos.y - L.y) < 0.5 && d < 1.7 && d > 0.3) { const a = turnTo(0, Math.atan2(dx, dz) - YAW_B, 1); if (Math.abs(a) < 2.1) { wy = Math.max(-1.1, Math.min(1.1, a)) + 0.8; wp = -0.06; o.glance = 0; } }
    }
    const kk = 1 - Math.exp(-dt * 2.4); this.gy += (wy - this.gy) * kk; this.gp += (wp - this.gp) * kk; o.gy = this.gy; o.gp = this.gp;
    this.pose(o);
    const sc = s * seen, F = stand(ax, az, sc, yaw);
    const vis = seen > 0.01 && g > 0.02, shut = o.shut >= 0.97;
    for (const n of this.HER) { rig.show(I[n], vis); rig.mat(I[n], V.m.multiplyMatrices(F, M[n])); }
    rig.show(I.canopy, vis && !shut); rig.mat(I.canopy, V.m.multiplyMatrices(F, M.canopy)); rig.show(I.furl, vis && shut); rig.mat(I.furl, V.m.multiplyMatrices(F, M.furl));
    const hx = VX + (ax - VX) * g, hz = VZ + (az - VZ) * g;
    blob(hx, hz, 0.2 * sc * g, 0.7 * seen); blob(hx + 0.03 * sc, hz + 0.03 * sc, 0.34 * sc * g, 0.4 * seen);
    sh.count = nb; sh.visible = nb > 0;
    // ---- the sounds: paint laid; her steps on the path, nearer and nearer; the parasol shut; the bench taking her
    if (!L.quiet && voice.ctx && !back) {
      const once = (key, t, fn) => { if (c >= t && !this.did[key]) { this.did[key] = true; if (c < t + 0.3) fn(); } };
      once('lay', 0.05, () => noise(voice, 0, { d: 1.5, vol: calm ? 0.005 : 0.008, lp: 1700, hp: 300, attack: 0.5 }));
      const stp = Math.floor(o.ph + 0.5);
      if (o.going > 0 && stp !== this.step) { this.step = stp; const near = Math.pow(s, 1.5); noise(voice, 0, { d: 0.055 + 0.04 * near, vol: (0.0025 + 0.017 * near) * (calm ? 0.6 : 1), bp: 2100 + 500 * ((stp * 7) % 3), q: 0.7, attack: 0.004 }); noise(voice, 0.01, { d: 0.05, vol: 0.006 * near, lp: 420, attack: 0.004 }); }
      once('shut', T_SHUT[0] + 0.3, () => { noise(voice, 0, { d: 0.16, vol: calm ? 0.007 : 0.013, bp: 1500, q: 0.6, attack: 0.02 }); noise(voice, 0.12, { d: 0.05, vol: calm ? 0.004 : 0.008, lp: 700, attack: 0.003 }); });
      once('sit', T_SIT[0] + 0.62, () => { noise(voice, 0, { d: 0.3, vol: calm ? 0.005 : 0.009, bp: 2800, q: 0.6, attack: 0.08 }); voice.note(196, 0.16, { at: 0.08, vol: calm ? 0.004 : 0.007, type: 'triangle', to: 172, attack: 0.03 }); });
      once('tip', T_DOWN[1] - 0.05, () => noise(voice, 0, { d: 0.04, vol: 0.006, bp: 2600, q: 1.2, attack: 0.002 }));
    }
    // ---- the path is empty, and the toy may be the one thing on it: its wheels leave their print in the sand
    const toy = L.k.G.vehicle;
    if (!back && !L.quiet && c > BUILT && dt > 0 && toy && toy.group.visible && Math.abs(toy.pos.y - L.y) < 0.4) {
      const lq = L.local(toy.pos.x, toy.pos.z), la = this.rutAt;
      if (!this.onSand(lq.u, lq.out)) this.rutAt = null;
      else if (!la) this.rutAt = { x: lq.u, z: lq.out };
      else if (Math.hypot(lq.u - la.x, lq.out - la.z) > 0.085) {
        const r = this.ruts[this.rutN++ % this.ruts.length]; r.x = (lq.u + la.x) / 2; r.z = (lq.out + la.z) / 2; r.yaw = Math.atan2(lq.u - la.x, lq.out - la.z); r.on = true; la.x = lq.u; la.z = lq.out;
        if (voice.ctx && this.rutN % 2 === 0) noise(voice, 0, { d: 0.05, vol: calm ? 0.002 : 0.0035, bp: 1700, q: 0.6, attack: 0.006 });
      }
    }
    this.ruts.forEach((r, i) => { rig.show(I.ruts[i], r.on && g > 0.02); if (r.on) rig.mat(I.ruts[i], V.f.compose(V.pos.set(VX + (r.x - VX) * g, 0.03, VZ + (r.z - VZ) * g), V.q.setFromAxisAngle(V.up, r.yaw), V.sc.setScalar(Math.max(1e-4, g))).premultiply(B)); });
    if (c > T_SIT[1] && !back) this.soften(L, dt);
    voice.level = calm ? 0.8 : 1; voice.place();
    if (showing && !this.told && !L.quiet && c > T_SIT[1]) { this.told = true; L.k.say('She comes in from far down the empty path, shuts her parasol and takes her bench, as he painted her.', 5); }
    if (back && L.ret >= 1) this.hide();
  },
});
