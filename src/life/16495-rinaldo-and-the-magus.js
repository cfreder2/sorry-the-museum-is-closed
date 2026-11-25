// Giovanni Battista Tiepolo, Rinaldo and the Magus of Ascalon (c. 1742-45), Griffin Court. The word: behold.
//
// The last of the four canvases he painted from Tasso's poem for a room in a Venetian palace, and the one with the
// moral in it. The boat has put the young man ashore; an old man in a great gold mantle holds a shield up by its top
// edge, lays a thin wand on it and leans in to him, and the young man looks where the wand is. (The museum: the
// magician "uses Rinaldo's shield to conjure the heroic deeds of his ancestors, urging him to live up to their
// legacy".) Every line in the picture runs to the tip of that wand; and Tiepolo has turned the shield so that all we
// are given of it is its straps. The three canvases before this one are about being enchanted. This one is about
// being shown something, and looking: which is all a museum asks. So the show is the showing.
//
// Look, and his strokes come down from under the frame and lay a corner of his shore in on the floor: pale dragged
// sand, the white rock, the old trunk leaning out of the picture with ivy at its foot, and what waits at the trunk's
// foot up there, a blue mantle thrown down and a gilt helmet with white plumes. The old man is laid in on the rock,
// from his lap up: the mantle over his thighs and knees, one stockinged shin and a shoe, his body, the fall of silk from his
// lifted arm, the hood, the beard; and last the shield in his right hand, its hollow side to us, brown leather, two
// straps and a fringe, and the wand across his knee. He is looking at the shield. Then, without hurry, he brings the
// wand up and over and sets its tip down on the leather, slowly at the last. A small clear note. Where the tip is,
// the shield lights, and the light goes out over it from there one touch at a time until the hollow of it holds the
// far shore of his own picture: its sky, the gold and rose along its horizon, a thin line of land with something tall
// on it, the sea, and in a moment three small birds crossing, as they do up there. The light falls back on his beard
// and his sleeve and out across the sand to the helmet and the blue, and the plumes lift a little. Then he turns,
// from the shield to the place beside him where the young man stands in the picture, and looks up, as he does there.
// That place is empty: the young man is still on the wall, and the eye goes up to find him. While you keep looking he
// breathes, the wand's tip goes slowly along the horizon, the birds cross. When you stop, the light goes in, and the
// strokes lift off and go back up under the frame the way they came.
//
// The music begins at the touch: Antonio Vivaldi, L'estro armonico, Op. 3 (Amsterdam, Estienne Roger, 1711), the
// Largo of Concerto No. 5 in A major (RV 519), all twelve bars: a solo violin "Solo e Cantabile" over the violins
// and violas alone, "Piano e Spiccato", the basses silent. It was chosen because it is Venice's own music from the
// generation before the picture, because it has no words, no title but its tempo and no programme, and because with
// no bass under it it is all air and light, like his skies. Its note is A, and so is the note the wand strikes.
//
// Who comes out, and why (Care, rule 1). The people of the picture are a knight, an old magician, two soldiers and
// the woman at the boat's oar, all out of an Italian poem, painted by a Venetian for Venetians. The old man is the
// one who comes out: a clothed, grown man of great dignity doing in the room exactly the ordinary thing he does on
// the wall (he holds something up and points to it, as a teacher does). He is the scene's authority, not its comic
// and not its servant; he is not hurried, bent or made to totter, and nothing is made of his age (rule 7): his
// hand is sure and he takes his time. The poem makes him a wise man of Ascalon; Tiepolo paints him as he painted
// his prophets and philosophers, and that is how he is built: a mantle, a hood, a beard, two hands. Nothing on him
// says East or West. His hood is the mantle itself, loose and open (the dark cap the picture shows at his brow is
// left out: on a figure this small it read as a band wound round his head); the patterned sash and the pendant are
// left out; the wand is a plain rod, and all it does is point. The young man stays in the picture.
//
// How he is made (after the Corot reader, src/life/81512-interrupted-reading.js): of paint, with no bare form
// showing. Under everything are cores a little smaller and darker than the forms (lofted, with creased folds in
// them; the hood and the two falls of the mantle are open sheets with an inside); what the eye sees is strokes lying
// over them, each a ribbon with a brush's print on it, tilted about its length so they overlap as feathers do and a
// form's edge is their ragged ends. His light is from the upper left, as in the picture: what faces us and to the
// right is in half shade until the shield lights it. His face has no drawn features: the shade under the hood, the
// dark of the eyes, a lit nose and cheekbone, grey brows and the beard, each a touch. One rig, one draw call, for all
// of it (strokes flown in by the vertex shader; the shield's light is part of the same mesh, opened touch by touch
// on its own clock, and what it throws on everything else is worked out in the same shader from where each stroke
// is); and one flat mesh for the sand, its shade and the light on it. Nothing is solid. He sits 0.75 m high under a
// picture whose foot is 1.5 m up, with no neighbour on this wall: nothing of his comes in front of a canvas.
// With "Reduce motion and flashing" on, the strokes do not tumble as they come, the light opens more slowly and
// does not breathe, the note is eased in, the plumes barely stir and the birds glide without beating.
//
// What it does not do: nothing is made of the poem's war or of its two faiths (no costume, emblem, scale or tune
// says either), and the shield shows no ancestor and no battle: what the museum says it conjures is left where
// Tiepolo left it, out of sight, and the light put in its place is the picture's own far shore, which the caption
// says is the show's doing and not the picture's. No weapon is built (the sword in its red scabbard beside the blue
// mantle is left out; the shield is held, as it is up there, and never moves), and nobody else comes out: not the
// knight, who is being called back to a war and put right by an old man, neither of which is a thing to act out or
// to laugh at; not the two soldiers; not the woman in the boat.
import * as THREE from 'three';
import { lifeFor, ease, ramp, clamp01, lerp, shape } from '../paintlife.js';
import { score } from './stagecraft.js';
import { strokes as dragged } from './brush.js';

const TAU = Math.PI * 2;
const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const sstep = THREE.MathUtils.smoothstep, fall = (x, a, b) => 1 - sstep(x, a, b);      // (fall: 1 below a, 0 above b)

// ---------------------------------------------------------------- the timeline (seconds of show)
const BUILT = 2.1, FLY = 0.6;                               // it is all there; one stroke's flight
const T_LIFT = 2.45, T_HOVER = 3.7, T_TOUCH = 4.05;         // the wand leaves his knee; it is over the shield; it touches
const T_TURN = 5.15, TURN_D = 1.45;                         // he turns to the young man
const T_TUNE = T_TOUCH + 0.4;                               // the strings begin
const SPREAD = 0.2;                                         // how fast the light goes over the shield (scene units a second)

// ---------------------------------------------------------------- the scene (x along the wall to the right, y up, z out of the wall; SC metres to one)
const SC = 1.3, U0 = -0.18;
const DIR = [-0.419, 0.908];                                // the way his knees point: out, and to the left
const HIP = [-0.10, 0.40], SEAT = 0.165;
const WAIST = [-0.10, 0.268, 0.395];
const ROCK = { x: -0.24, z: 0.35, rx: 0.3, rz: 0.16 };
const L1 = 0.14, L2 = 0.16;                                 // upper arm; forearm to the middle of the hand
const NECK = [0, 0.168, 0.006], SH_R = [-0.088, 0.128, 0.004], SH_L = [0.088, 0.128, 0.004];
const TORSO = { yaw: 0.05, pitch: 0.2, roll: -0.08 };       // he leans forward, and over to the young man's side
const HA = { yaw: -0.85, pitch: 0.26, roll: 0.1 }, HB = { yaw: 0.5, pitch: -0.22, roll: -0.06 };      // his head: to the shield; to the young man
const SHIELD = { c: [-0.41, 0.325, 0.5], n: [0.42, 0.12, 0.9], hw: 0.12, hl: 0.2, dp: 0.024 };
const TOUCH = [0.02, 0.03];                                 // where the wand touches it (the shield's own measure)
const WL = 0.27;                                            // the wand
const HAND0 = [-0.09, 0.29, 0.575], TIP0 = [-0.3, 0.262, 0.7], HANDN = [-0.13, 0.325, 0.6];
const TRUNK = { base: [0.66, 0, 0.42], lean: -0.5, back: -0.1 };
const CLOAK = { x: 0.4, z: 0.66 }, HELM = [0.5, 0.1, 0.585];
const tri = x => Math.asin(Math.sin(x)) * (2 / Math.PI);    // a fold with a crease in it, not a wave

// Antonio Vivaldi, L'estro armonico, Op. 3 (Amsterdam, 1711), Concerto No. 5 in A major (RV 519), the Largo: all
// twelve bars, from the Mutopia Project's edition of the parts, turned into this notation by a script and its bars
// counted (eight quavers in every bar of every part). One beat here is a quaver. The parts: the solo violin ("Solo e
// Cantabile"); the violins and the violas ("Piano e Spiccato"); the basses are silent throughout, so nothing in it
// is lower than the D below middle C. Its trills are left plain, and its one grace note is played short.
const LARGO = [
  ['R:2 R C#5:0.5 D5:0.5 E5:0.5 F#5:0.5 E5:0.5 A5:0.5 E5:0.5 F#5:0.5 E5:0.5 A5:0.5 | D5:0.5 E5:0.5 D5:0.5 B5:0.5 D5:0.5 G#5:0.5 B5:0.5 D5:0.5 C#5:0.5 B4:0.5 A4 R A5:0.5 A4:0.5 | B4:0.25 C#5:0.25 B4:0.25 E5:0.25 G#4:0.25 A4:0.25 G#4:0.25 B4:0.25 E4:0.25 F#4:0.25 E4:0.25 G#4:0.25 B4:0.25 D5:0.25 E5:0.25 B4:0.25 C#5:0.25 B4:0.25 A4:0.25 E5:0.25 C#5:0.25 B4:0.25 A4:0.25 A5:0.25 C#5:0.25 B4:0.25 A4:0.25 E5:0.25 A5:0.25 F#5:0.25 G#5:0.25 E5:0.25 | D#5:2.5 B4:0.5 D#5:0.5 F#5:0.5 A5:2.5 B4:0.5 D#5:0.5 F#5:0.5 | G#5 F#5:0.5 E5:0.5 D#5:1.5 E5:0.5 E5:2 R:0.5 G#5:0.5 F#5:0.5 E5:0.5 | A5:0.25 C#5:0.25 B4:0.25 C#5:0.25 A5:0.25 C#5:0.25 B4:0.25 C#5:0.25 A5:0.25 E5:0.25 D5:0.25 C#5:0.25 A5:0.25 E5:0.25 D5:0.25 C#5:0.25 A5:0.25 D5:0.25 C#5:0.25 D5:0.25 A5:0.25 D5:0.25 C#5:0.25 D5:0.25 A5:0.25 D5:0.25 C#5:0.25 D5:0.25 A5:0.25 F#5:0.25 E5:0.25 D5:0.25 | B5:0.25 D#5:0.25 C#5:0.25 D#5:0.25 B5:0.25 D#5:0.25 C#5:0.25 D#5:0.25 B5:0.25 D#5:0.25 C#5:0.25 D#5:0.25 B5:0.25 A5:0.25 G#5:0.25 F#5:0.25 G#5:0.3333 F#5:0.3333 E5:0.3333 A5:0.5 C#5:0.5 B4:1.5 A4:0.5 | A4:2 R:0.5 E5:0.5 C5:0.5 B4:0.25 A4:0.25 F5:0.25 D5:0.25 C#5:0.25 D5:0.25 F5:0.25 D5:0.25 C#5:0.25 D5:0.25 G#5:0.25 D5:0.25 C#5:0.25 D5:0.25 G#5:0.25 D5:0.25 C#5:0.25 D5:0.25 | B5:0.25 D5:0.25 C#5:0.25 D5:0.25 B5:0.25 D5:0.25 C#5:0.25 D5:0.25 F5:0.25 D5:0.25 C#5:0.25 D5:0.25 E5:0.25 D5:0.25 C5:0.25 B4:0.25 C5:0.25 A4:0.25 G#4:0.25 A4:0.25 C5:0.25 A4:0.25 G#4:0.25 A4:0.25 D5:0.25 A4:0.25 G#4:0.25 A4:0.25 D5:0.25 A4:0.25 G#4:0.25 A4:0.25 | D5:0.25 C#5:0.25 D5:0.25 D5:0.25 D5:0.25 C#5:0.25 D5:0.25 F5:0.25 D5:0.25 C#5:0.25 D5:0.25 F5:0.25 D5:0.25 C#5:0.25 D5:0.25 E5:0.25 D5:0.25 C#5:0.75 B4:0.5 A4:0.5 D#5:1.5 E5:0.5 | E5:2 R D5 C#5 B4:0.5 A4:0.5 G#4:1.5 A4:0.5 | A4:8', 0.024, 'triangle', 0.94],
  ['C#5 C#5 C#5 C#5 C#5 C#5 C#5 C#5 | B4 B4 B4 B4 C#5 C#4 C#4 C#4 | B3 B3 B3 B3 C#4 C#4 C#4 C#5 | F#4 F#4 F#4 F#4 F#4 F#4 F#4 B4 | B4 C#5 F#4 F#4 G#4 G#4 G#4 G#4 | E4 E4 E4 E4 F#4 F#4 F#4 F#4 | F#4 F#4 F#4 B4 B4 A4 A4 G#4 | A4 C5 C5 C5 B4 B4 B4 B4 | B4 B4 B4 B4 E4 E4 F4 F4 | F4 F4 F4 F4 E4 E4 F#4 F#5 | B4:2 R B4 E4 F#4 B3 B3 | C#4:8', 0.0075, 'triangle', 0.5],
  ['A4 A4 A4 A4 A4 A4 A4 A4 | A4 A4 G#4 G#4 A4 A3 A3 A3 | G#3 G#3 G#3 G#3 A3 A3 A3 A3 | B3 B3 B3 B3 B3 B3 B3 B3 | E4 A3 B3 B3 E4 E4 D4 D4 | C#4 C#4 C#4 C#4 D4 D4 D4 D4 | D4 D4 D4 D4 E4 C#4:0.5 D4:0.5 E4 E4 | A4 A4 A4 A4 G#4 G#4 G#4 G#4 | G#4 G#4 G#4 G#3 A3 A3 A3 A3 | G#3 G#3 G#3 G#3 A3 A3 A3 A4 | G#4:2 R G#3 A3 D3 E3 E3 | A3:8', 0.0075, 'sine', 0.52],
];
const E8 = 0.62, ROUND = (12 * 8 + 12) * E8;                // a quaver ("Largo"); the movement, and a silence, before it comes again

// A brush's own print, for every mark: two drags (bristle lines, fuller in the middle, ragged at both ends, the second
// run dry), a soft round touch, and a plain patch for the bodies under them. Its colour is only the bristles' light and
// dark; its alpha is the mark's shape. (As the Corot's reader is made: src/life/81512-interrupted-reading.js.)
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

lifeFor(16495, {
  title: /^Rinaldo and the Magus/,
  word: 'behold',
  stage: { out: 1.3, half: 1.3, cam: { dist: 2.9, height: 0.5, side: 0.1, fov: 66, lookU: 0, lookOut: 0.5, lookH: 1.1, whole: false } },
  wake: 2, ret: 2.4,

  build(L) {
    const P = L.pal, col = (h, a = 0.1) => P.near(h, a), C = (list, a) => list.map(h => col(h, a));
    const RAIL = (L.rail - L.y) / SC, XS = -U0 / SC;      // (XS: under the middle of the frame)
    this.O = L.floor(U0, -L.wall);
    this.B = new THREE.Matrix4().makeBasis(V3(L.tx * SC, 0, L.tz * SC), V3(0, SC, 0), V3(L.nx * SC, 0, L.nz * SC)).setPosition(this.O);
    this.V = { m: new THREE.Matrix4(), l: new THREE.Matrix4(), q: new THREE.Quaternion(), e: new THREE.Euler(0, 0, 0, 'YXZ'), one: V3(1, 1, 1), up: V3(0, 1, 0),
      a: V3(), b: V3(), c: V3(), d: V3(), p1: V3(), p2: V3(), el: V3(), s: V3(), t: V3(), pos: V3(), w: V3(), h: V3(), tip: V3() };
    this.M = {}; for (const n of ['torso', 'head', 'ru', 'rf', 'lu', 'lf', 'wand', 'pl0', 'pl1', 'pl2', 'b0', 'b1', 'b2']) this.M[n] = new THREE.Matrix4();
    this.S0 = { t: 0 }; this.clock = 0;
    // the shield: where it stands, and its own measure (x across it, y up its length, z out of its hollow side)
    { const N = V3(...SHIELD.n).normalize(), Y = V3(-0.15, 0.99, 0); Y.addScaledVector(N, -Y.dot(N)).normalize(); const X = V3().crossVectors(Y, N);
      this.SHM = new THREE.Matrix4().makeBasis(X, Y, N).setPosition(V3(...SHIELD.c)); this.SHN = N; }
    const HW = SHIELD.hw, HL = SHIELD.hl, DP = SHIELD.dp, dz = (x, y) => -DP * (1 - (x / HW) ** 2 - (y / HL) ** 2);
    this.GRIP = V3(0, HL + 0.004, 0.006).applyMatrix4(this.SHM);
    this.TOUCH = V3(TOUCH[0], TOUCH[1], dz(TOUCH[0], TOUCH[1]) + 0.005).applyMatrix4(this.SHM);
    this.TRACE = V3(1, -0.16, 0).normalize().transformDirection(this.SHM);      // (level across the shield: the line he goes along)
    // the plumes: where each is made fast to the helmet, and the way it stands
    this.PL = [[0.03, 0.036, -0.006, 0.1, 0.0, -0.25, 0.95], [0.04, 0.026, -0.02, 0.95, 0.1, -0.6, 0.8], [0.036, 0.022, 0.016, -0.8, 0.1, -0.75, 0.72]].map(([x, y, z, yaw, pitch, roll, s]) =>
      ({ m: new THREE.Matrix4().compose(V3(HELM[0] + x, HELM[1] + y, HELM[2] + z), new THREE.Quaternion().setFromEuler(new THREE.Euler(pitch, yaw, roll, 'YXZ')), V3(s, s, s)), yaw, pitch, roll, s, p: V3(HELM[0] + x, HELM[1] + y, HELM[2] + z) }));
    this.IDLE = { kW: 1, kT: 1, kH: 1, breath: 0, trace: 0, lift: 0, sway: [0, 0, 0], sky: 0, birds: [0.5, 0.5, 0.5], flap: [0, 0, 0] };
    // (his strokes are let down while he is still looking at the shield, the wand across his knee: where each part is then)
    this.pose({ ...this.IDLE, kW: 0, kT: 0, kH: 0 }); const EM = {}; for (const n of ['head', 'lu', 'lf', 'wand']) EM[n] = this.M[n].clone().invert();
    this.pose(this.IDLE);      // (as the picture has him: every part is painted where it stands then)

    const R = () => L.rand();
    const KEY = V3(-0.5, 0.74, 0.45).normalize();           // his light: from the upper left, a little in front
    const pick = (list, r) => list[Math.min(list.length - 1, Math.floor(r * list.length))];
    const set = (hi, mid, lo, deep, a) => ({ hi: C(hi, a), mid: C(mid, a), lo: C(lo, a), deep: C(deep, a) });
    const OC = set(['#e2cd9c', '#d9c28a', '#e8d7ac'], ['#b48e52', '#aa844a', '#ba965a'], ['#7c5e34', '#72542e', '#84663a'], ['#48341c', '#3e2c18']);      // his mantle
    const UN = set(['#84704a', '#786640'], ['#584828', '#504024'], ['#382a18', '#312416'], ['#20180c']);                                                  // the robe under it
    const WH = set(['#ece8dc', '#e4decf', '#f0ece2'], ['#cbc5b6', '#c2bbab', '#d0cab9'], ['#a09a8a', '#979181', '#a69e8e'], ['#777161', '#6d675a']);     // beard, stocking, plumes
    const FL = set(['#dcaa84', '#d6a27c'], ['#c08660', '#b9805a', '#c38c68'], ['#986648', '#905e42'], ['#6e452d', '#643e28']);                           // his skin
    const RK = set(['#e4dcc8', '#dcd2ba', '#e9e2d2'], ['#c4b898', '#bbae8d', '#c9bea0'], ['#958a69', '#8c8160', '#9c9172'], ['#686141', '#5d573b']);     // the pale rock
    const LE = set(['#a25e3a', '#965434'], ['#783f26', '#6e3922', '#7e452e'], ['#522617', '#4a2214'], ['#32150c', '#2a110a']);                           // the shield's hollow side
    const ST = set(['#98a9ad', '#8ea0a6'], ['#687b82', '#60737a'], ['#435358'], ['#293538']);                                                             // its face
    const BL = set(['#a4c6e4', '#98bcde'], ['#5f8ec0', '#5582b4', '#6696c6'], ['#365c8c', '#305482'], ['#20385a', '#1b3050']);                           // the blue mantle
    const GD = set(['#ecd386', '#e2c470'], ['#bc9340', '#b08838'], ['#7d5b22', '#72521f'], ['#4a3414']);                                                  // the helmet
    const TR = set(['#d9bd80', '#cfb072'], ['#a8844c', '#9c7943'], ['#6a4d27', '#5f4422'], ['#382813', '#2e200e']);                                       // the old trunk
    const GR = set(['#84925a', '#7a8852'], ['#55653a', '#4c5c32'], ['#303d27'], ['#1f291a']);                                                             // ivy, grass
    const SH = set(['#bd9060', '#b48658'], ['#9c7046', '#926640'], ['#6c4a2a'], ['#46301c']);                                                             // his shoe
    const WD = set(['#d9c191'], ['#8a6a44'], ['#5c4228'], ['#38281a']);                                                                                   // the wand
    // the broken colour of each mass: what a stroke may lean to, away from the tone of the form it lies on
    const OCH = C(['#d2b882', '#bea066', '#aa8850', '#a08652', '#dccea4', '#b0945e', '#967646', '#c2ae80', '#8e8254', '#b88a4e'], 0.08);       // gold, straw, a grey-green
    const WHH = C(['#eeeadf', '#d8d9d5', '#c0c4c5', '#e2d8c3', '#b3b8bc', '#e4d2c2', '#eae6da'], 0.05);
    const RKH = C(['#e6decc', '#d1c6aa', '#bcb698', '#dad0b6', '#ada98a', '#c6bfa6', '#e3dac3'], 0.06);
    const LEH = C(['#8b4f37', '#75372a', '#975743', '#652d24', '#814f3c', '#592720'], 0.08), STH = C(['#788b91', '#61757d', '#8c9ea1', '#51656d'], 0.08);
    const BLH = C(['#6c9cd0', '#5584b8', '#84b0dc', '#44709e', '#6090c2', '#96bce2', '#4c7aac', '#7aa0c0'], 0.06), GDH = C(['#cca64e', '#b68e3c', '#dcbc66', '#9c7630'], 0.08);
    const TRH = C(['#c8a468', '#b08c54', '#d8bc84', '#94703e', '#a8905c', '#806238'], 0.08), GRH = C(['#647642', '#4c5c34', '#7a8a50', '#3c4a2c', '#586a3a'], 0.08);
    const UNH = C(['#5e4c2c', '#4a3a22', '#6e5a36', '#40321e'], 0.08), FLH = C(['#deb08a', '#d2a07a', '#e4b894', '#c69270', '#d8a882'], 0.08), SHH = C(['#b48a58', '#a47a4c', '#c09a68'], 0.08);
    const HOLLOW = col('#6f5b2d', 0.1), SOCK = col('#7a5038', 0.1), EYE = col('#3e2a1e', 0.1), CHEEK = col('#cf8266', 0.08), CAP = C(['#4d6075', '#3b4b5d', '#586c82'], 0.08), STRAP = C(['#3d2717', '#33200f', '#48301c'], 0.08), BUCKLE = col('#cab37b', 0.08);
    // the light in the shield: the picture's own far shore (its sky, the gold and rose along the horizon, the sea)
    const SKY = C(['#9cc0de', '#8ab2d6', '#b2cee4', '#a4c4dc'], 0.04), GOLD = C(['#f0d48c', '#ecc878', '#f6e0a8'], 0.03), ROSE = C(['#eeb090', '#e8a284', '#f2c0a4'], 0.03), SHORE = C(['#6f8ea4', '#607f96'], 0.04), SEA = C(['#84b4b8', '#76a6ae', '#96c2c0', '#6a9ca8'], 0.04), GLINT = col('#fff6e2', 0.02);
    // The tone of a form where it faces his light (lights, half tones, shade, dark, run smoothly into each other); and a
    // stroke on it: that tone, leaning to one of the mass's own colours, a little of the luck of the brush.
    const under = S => { const c = new THREE.Color(); return n => { const k = n.dot(KEY); return c.copy(S.deep[0]).lerp(S.lo[0], sstep(k, -0.65, -0.15)).lerp(S.mid[0], sstep(k, -0.1, 0.38)).lerp(S.hi[1 % S.hi.length], sstep(k, 0.42, 0.86)).multiplyScalar(0.98); }; };
    const mixer = (S, hues, amt = 0.4, v = 0.14) => {
      const u = under(S), ref = S.mid[0], c = new THREE.Color();
      return (n, r) => { const h = pick(hues, (r * 7.31) % 1), a = amt * (0.4 + 1.2 * ((r * 3.17) % 1)), k = 1 + (r - 0.5) * v, f = (x, y) => lerp(1, Math.max(0.6, Math.min(1.5, x / Math.max(0.02, y))), a) * k; c.copy(u(n)); return new THREE.Color(c.r * f(h.r, ref.r), c.g * f(h.g, ref.g), c.b * f(h.b, ref.b)); };
    };

    // ---------------------------------------------------------- parts: bodies and the strokes on them
    // A part is one piece of the rig (it moves as one). Every vertex carries where its stroke's middle is (aCen) and how
    // the stroke comes (aFly: from where, relative to its place, and when), so the vertex shader can bring them down
    // from under the rail; a body grows up from its foot instead. aKind 1: the light in the shield, which is not laid
    // with the rest but kindled, later, from the wand's tip outwards (its own clock).
    const part = (rest, from = null) => { rest = rest ? rest.clone() : new THREE.Matrix4(); const inv = rest.clone().invert(); return { pos: [], nor: [], col: [], uv: [], cen: [], fly: [], kind: [], rest, inv, from: from || inv, n: 0 }; };
    let KIND = 0;
    const side = V3(), d2 = V3(), cl = V3(), src = V3(), wp = V3(), nW = V3(), ca = new THREE.Color(), cb = new THREE.Color();
    const vert = (Pt, p, n, c, uv, cen, f) => { Pt.pos.push(p.x, p.y, p.z); Pt.nor.push(n.x, n.y, n.z); Pt.col.push(c.r, c.g, c.b); Pt.uv.push(uv[0], uv[1]); Pt.cen.push(cen.x, cen.y, cen.z); Pt.fly.push(f[0], f[1], f[2], f[3]); Pt.kind.push(KIND); Pt.n++; };
    const world = (Pt, n) => nW.copy(n).transformDirection(Pt.rest);      // (a part's normal as it stands in the picture's pose: his light is the room's)
    // A body: g's own colours, or paint(normal in the room, where, its own normal) for each vertex.
    const solid = (Pt, g, base, t, paint = null) => {
      const p = g.attributes.position, n = g.attributes.normal, c = g.attributes.color, v = V3(), nn = V3(), cc = new THREE.Color(), f = [0, 0, 0, t];
      for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); nn.fromBufferAttribute(n, i); if (paint) cc.copy(paint(world(Pt, nn), v, nn)); else cc.fromBufferAttribute(c, i); vert(Pt, v, nn, cc, UV_SOLID, base, f); }
    };
    // When a stroke at height y (in the scene) is laid: the low ones first, so each mass builds from its foot.
    const when = (t0, span, y) => t0 + Math.min(span, 0.26) * (0.62 * clamp01(y / 0.5) + 0.38 * R());
    // A ribbon of paint through six points lying on a form (Ps, with the form's normal at each, Ns), w wide, with the
    // brush's print on it (cell: 0 a drag, 1 a dry one, 2 a round touch): close on the form where the brush set down,
    // its dry end lifted a little and one long edge too, so the strokes overlap as feathers do and the edge of a form
    // is their ragged ends, found and lost, never the outline of the body under them.
    const ribbon = (Pt, Ps, Ns, w, c, t, { lift = 0.0018, tip = 0.004, ridge = 0.06, cell = -1, tilt = 0.34, stay = false } = {}) => {
      const k = cell < 0 ? (R() < 0.55 ? 0 : 1) : cell, flip = R() < 0.5, A = [], Bq = [], ua = [], ub = [], mid = Ps[2].clone().add(Ps[3]).multiplyScalar(0.5);
      const ta = tilt * (0.5 + R()) * (R() < 0.5 ? -1 : 1), cw = Math.cos(ta) * w / 2, sw = Math.sin(ta) * w / 2;      // (tilted about its length: one long edge lifted)
      for (let i = 0; i < 6; i++) {
        d2.copy(Ps[Math.min(5, i + 1)]).sub(Ps[Math.max(0, i - 1)]); side.crossVectors(Ns[i], d2); if (side.lengthSq() < 1e-14) return; side.normalize();
        const s = flip ? 1 - i / 5 : i / 5;
        cl.copy(Ps[i]).addScaledVector(Ns[i], lift + tip * s * s);
        A.push(cl.clone().addScaledVector(side, -cw).addScaledVector(Ns[i], -sw)); Bq.push(cl.clone().addScaledVector(side, cw).addScaledVector(Ns[i], sw)); ua.push(UVQ(k, s, 0)); ub.push(UVQ(k, s, 1));
      }
      ca.copy(c).multiplyScalar(1 + ridge); cb.copy(c).multiplyScalar(1 - ridge * 0.7);
      wp.copy(mid).applyMatrix4(Pt.rest);
      src.set(XS + Math.max(-0.6, Math.min(0.6, (wp.x - XS) * 0.62)) + (R() - 0.5) * 0.08, RAIL - 0.09 - R() * 0.05, 0.014 + R() * 0.02).applyMatrix4(Pt.from);
      const tt = t == null ? when(0.3, 0.4, wp.y) : t, f = stay ? [0, 0, 0, tt] : [src.x - mid.x, src.y - mid.y, src.z - mid.z, tt];
      for (let i = 0; i < 5; i++) { vert(Pt, A[i], Ns[i], cb, ua[i], mid, f); vert(Pt, Bq[i + 1], Ns[i + 1], ca, ub[i + 1], mid, f); vert(Pt, Bq[i], Ns[i], ca, ub[i], mid, f); vert(Pt, A[i], Ns[i], cb, ua[i], mid, f); vert(Pt, A[i + 1], Ns[i + 1], cb, ua[i + 1], mid, f); vert(Pt, Bq[i + 1], Ns[i + 1], ca, ub[i + 1], mid, f); }
    };
    // One stroke on something flat (or a touch too small to need bending): at p (normal n), along dir, l long and w wide.
    const stroke = (Pt, p, n, dir, l, w, c, t, { bend = 0, ...o } = {}) => {
      side.crossVectors(n, dir); if (side.lengthSq() < 1e-8) return; side.normalize(); const dd = V3().crossVectors(side, n).normalize(), sd = side.clone(), Ps = [], Ns = [];
      for (let i = 0; i < 6; i++) { const s = i / 5 - 0.5; Ps.push(p.clone().addScaledVector(dd, s * l).addScaledVector(sd, bend * l * (1 - 4 * s * s))); Ns.push(n); }
      ribbon(Pt, Ps, Ns, w, c, t, o);
    };
    // The way a stroke runs on a surface: `flow` laid into the surface, turned a little.
    const q_ = new THREE.Quaternion();
    const along = (n, flow, jit) => { const d = flow.clone().addScaledVector(n, -flow.dot(n)); if (d.lengthSq() < 1e-4) d.set(n.y, -n.x, 0); if (d.lengthSq() < 1e-6) d.set(1, 0, 0); return d.normalize().applyQuaternion(q_.setFromAxisAngle(n, (R() - 0.5) * jit)); };
    const DOWN = V3(0, -1, 0), ACROSS = V3(1, 0, 0);
    const yOf = (Pt, p) => wp.copy(p).applyMatrix4(Pt.rest).y;
    // A rounded body (an ellipsoid: centre, radii, turned), painted smoothly.
    const dk = new THREE.Color();
    const ball = (Pt, Cn, Rd, paint, t0, { rot = [0, 0, 0], detail = 3, shrink = 0.94, dark = 0.8 } = {}) => solid(Pt, shape.move(shape.ball(1, 0xffffff, detail), Cn[0], Cn[1], Cn[2], rot[0], rot[1], rot[2], Rd[0] * shrink, Rd[1] * shrink, Rd[2] * shrink), V3(Cn[0], Cn[1] - Rd[1], Cn[2]), t0 + 0.1, (nw, v, nn) => dk.copy(paint(nw, v, nn)).multiplyScalar(dark));
    // A coat of n strokes over an ellipsoid, each an arc on it (so it lies on it from end to end); tn(normal in the room, luck) its colour.
    const coat = (Pt, Cn, Rd, n, tn, t0, { rot = [0, 0, 0], l = [0.03, 0.05], w = [0.014, 0.022], flow = DOWN, jit = 0.6, keep = null, span = 0.2, grow = 1.0, ...o } = {}) => {
      const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(rot[0], rot[1], rot[2], 'YXZ')), qi = q.clone().invert(), c = V3(...Cn), Rm = (Rd[0] + Rd[1] + Rd[2]) / 3;
      for (let i = 0; i < n; i++) {
        const yy = 1 - 2 * R(), ph = R() * TAU, s = Math.sqrt(Math.max(0, 1 - yy * yy)), u0 = V3(s * Math.cos(ph), yy, s * Math.sin(ph));
        const p = V3(u0.x * Rd[0] * grow, u0.y * Rd[1] * grow, u0.z * Rd[2] * grow).applyQuaternion(q).add(c), nn = V3(u0.x / Rd[0], u0.y / Rd[1], u0.z / Rd[2]).normalize().applyQuaternion(q);
        const r1 = R(), r2 = R(), r3 = R();
        if (keep && !keep(p, nn, u0)) continue;
        const d = along(u0, flow.clone().applyQuaternion(qi), jit), len = lerp(l[0], l[1], r1), Ps = [], Ns = [];
        for (let k = 0; k < 6; k++) { const al = (k / 5 - 0.5) * len / Rm, u = u0.clone().multiplyScalar(Math.cos(al)).addScaledVector(d, Math.sin(al)); Ps.push(V3(u.x * Rd[0] * grow, u.y * Rd[1] * grow, u.z * Rd[2] * grow).applyQuaternion(q).add(c)); Ns.push(V3(u.x / Rd[0], u.y / Rd[1], u.z / Rd[2]).normalize().applyQuaternion(q)); }
        ribbon(Pt, Ps, Ns, lerp(w[0], w[1], r2), tn(world(Pt, nn).clone(), r3, nn, u0), when(t0, span, yOf(Pt, p)), o);
      }
    };
    // A limb along the part's own +y: prof = [[radius, y], ...] from its root, rounded off at both ends; soft strokes down it.
    const tube = (Pt, prof, S, t0, n, tn, { w = [0.012, 0.018], l = [0.03, 0.05], shrink = 0.86, dark = 0.84, ends = true, ...o } = {}) => {
      const u0 = under(S), u = nn => dk.copy(u0(nn)).multiplyScalar(dark), y0 = prof[0][1], y1 = prof[prof.length - 1][1], rAt = y => { for (let i = 1; i < prof.length; i++) if (y <= prof[i][1]) return lerp(prof[i - 1][0], prof[i][0], (y - prof[i - 1][1]) / (prof[i][1] - prof[i - 1][1])); return prof[prof.length - 1][0]; };
      const fine = []; for (let i = 0; i <= 14; i++) { const y = lerp(y0, y1, i / 14); fine.push([rAt(y) * shrink, y]); }
      solid(Pt, shape.lathe(fine, 18, 0xffffff), V3(0, y0, 0), t0 + 0.1, nn => u(nn));
      if (ends) for (const [r, y] of [prof[0], prof[prof.length - 1]]) solid(Pt, shape.move(shape.ball(r * shrink, 0xffffff, 2), 0, y, 0), V3(0, y0, 0), t0 + 0.1, nn => u(nn));
      for (let i = 0; i < n; i++) {
        const len = lerp(l[0], l[1], R()), yc = lerp(y0 + len / 2, y1 - len / 2, R()), ph = R() * TAU, nn = V3(Math.cos(ph), 0, Math.sin(ph)), Ps = [], Ns = [];
        for (let k = 0; k < 6; k++) { const y = yc + (k / 5 - 0.5) * len, r = rAt(y); Ps.push(V3(nn.x * r, y, nn.z * r)); Ns.push(nn); }
        ribbon(Pt, Ps, Ns, lerp(w[0], w[1], R()), tn(world(Pt, nn).clone(), R()), when(t0, 0.2, yOf(Pt, Ps[2])), o);
      }
    };
    // A lofted form: rings from its foot up ({ y, c: [x, z], r1, r2 }), r1 along `ax` and r2 across it, round (pow 2)
    // or square-shouldered, fluted if asked (real folds); smooth all over, painted paint(normal in the room, how far
    // up, how far round, where, its own normal). Returns how to find a point and its normal on it, and how to lay a stroke on it.
    const loft = (Pt, rings, t0, paint, { ax = [1, 0], pow = 2, flute = null, seg = 32, rows = 12, cap = false, shrink = 0.95, dark = 0.76 } = {}) => {
      const m = rings.length - 1;
      const cr = (get, v) => { const x = clamp01(v) * m, i = Math.min(m - 1, Math.floor(x)), f = x - i, g = j => get(rings[Math.max(0, Math.min(m, j))]), p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2); return 0.5 * (2 * p1 + (-p0 + p2) * f + (2 * p0 - 5 * p1 + 4 * p2 - p3) * f * f + (-p0 + 3 * p1 - 3 * p2 + p3) * f * f * f); };
      const at = (v, th, out = V3(), sk = 1) => {
        const cs = Math.cos(th), sn = Math.sin(th), e = 2 / pow, k = (flute ? flute(v, th) : 1) * sk;
        const a = Math.sign(cs) * Math.pow(Math.abs(cs), e) * cr(r => r.r1, v) * k, b = Math.sign(sn) * Math.pow(Math.abs(sn), e) * cr(r => r.r2, v) * k;
        return out.set(cr(r => r.c[0], v) + ax[0] * a - ax[1] * b, cr(r => r.y, v), cr(r => r.c[1], v) + ax[1] * a + ax[0] * b);
      };
      const pa = V3(), pb = V3(), pc = V3(), pd = V3();
      const normal = (v, th, out = V3()) => { at(v, th + 0.02, pa); at(v, th - 0.02, pb); at(Math.min(1, v + 0.02), th, pc); at(Math.max(0, v - 0.02), th, pd); out.crossVectors(pa.sub(pb), pc.sub(pd)).normalize(); at(v, th, pa); pb.set(cr(r => r.c[0], v), pa.y, cr(r => r.c[1], v)); if (out.dot(pa.sub(pb)) < 0) out.negate(); return out; };
      const pos = [], idx = [], N = rows + 1;
      for (let j = 0; j < N; j++) for (let i = 0; i < seg; i++) { at(j / rows, i / seg * TAU, pa, shrink); pos.push(pa.x, pa.y, pa.z); }
      for (let j = 0; j < rows; j++) for (let i = 0; i < seg; i++) { const a = j * seg + i, b = j * seg + (i + 1) % seg, c = a + seg, d = b + seg; idx.push(a, c, b, b, c, d); }
      if (cap) { const top = rings[m], k = pos.length / 3; pos.push(top.c[0], top.y, top.c[1]); for (let i = 0; i < seg; i++) idx.push(rows * seg + i, k, rows * seg + (i + 1) % seg); }
      let g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
      { const n = g.attributes.normal; pa.fromBufferAttribute(g.attributes.position, 0); pb.set(rings[0].c[0], pa.y, rings[0].c[1]); if (pc.fromBufferAttribute(n, 0).dot(pa.sub(pb)) < 0) { g.setIndex(idx.map((_, i) => idx[i - i % 3 + [0, 2, 1][i % 3]])); g.computeVertexNormals(); } }
      { const n = g.attributes.normal, cols = new Float32Array(pos.length), k = pos.length / 3;
        for (let i = 0; i < k; i++) { pa.fromBufferAttribute(g.attributes.position, i); pb.fromBufferAttribute(n, i); const j = Math.min(rows, Math.floor(i / seg)), c = paint(world(Pt, pb), i < N * seg ? j / rows : 1, (i % seg) / seg * TAU, pa, pb); cols[i * 3] = c.r * dark; cols[i * 3 + 1] = c.g * dark; cols[i * 3 + 2] = c.b * dark; }
        g.setAttribute('color', new THREE.BufferAttribute(cols, 3)); }
      g = g.toNonIndexed();
      solid(Pt, g, V3(rings[0].c[0], rings[0].y, rings[0].c[1]), t0 + 0.06);
      // a stroke lying on it: from (v + dv / 2) down to (v - dv / 2), drifting dth round it
      const lay = (v, th, dv, dth, w, c, t, o) => { const Ps = [], Ns = []; for (let k = 0; k < 6; k++) { const s = k / 5 - 0.5; Ps.push(at(v - s * dv, th + s * dth)); Ns.push(normal(v - s * dv, th + s * dth)); } ribbon(Pt, Ps, Ns, w, c, t == null ? when(t0, 0.3, yOf(Pt, Ps[2])) : t, o); };
      return { at, normal, lay };
    };
    // A sheet: F(a, b, out) for a, b in 0..1. A body with two sides, painted paint(normal in the room, a, b, where);
    // and how to lay a stroke on either side of it.
    const sheet = (Pt, F, na, nb, t0, paint, { dark = 0.8, flip = 1 } = {}) => {
      const e = 0.01, qa = V3(), qb = V3(), qc = V3(), qd = V3(), p = V3(), n = V3();
      const normal = (a, b, out = V3()) => { F(Math.min(1, a + e), b, qa); F(Math.max(0, a - e), b, qb); F(a, Math.min(1, b + e), qc); F(a, Math.max(0, b - e), qd); out.crossVectors(qa.sub(qb), qc.sub(qd)); return out.lengthSq() < 1e-16 ? out.set(0, 0, 1) : out.normalize().multiplyScalar(flip); };
      const pos = [], idx = [], cols = [];
      for (let j = 0; j <= nb; j++) for (let i = 0; i <= na; i++) { F(i / na, j / nb, p); normal(i / na, j / nb, n); pos.push(p.x, p.y, p.z); const c = paint(world(Pt, n), i / na, j / nb, p); cols.push(c.r * dark, c.g * dark, c.b * dark); }
      for (let j = 0; j < nb; j++) for (let i = 0; i < na; i++) { const a = j * (na + 1) + i, b = a + 1, c = a + na + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
      let g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3)); g.setIndex(idx); g.computeVertexNormals(); g = g.toNonIndexed();
      F(0.5, 1, p); solid(Pt, g, p.clone(), t0 + 0.06);
      const lay = (a, b, da, db, w, c, t, o = {}, sd = 1) => { const Ps = [], Ns = []; for (let k = 0; k < 6; k++) { const s = k / 5 - 0.5, aa = clamp01(a + s * da), bb = clamp01(b + s * db); Ps.push(F(aa, bb, V3())); Ns.push(normal(aa, bb).multiplyScalar(sd)); } ribbon(Pt, Ps, Ns, w, c, t == null ? when(t0, 0.3, yOf(Pt, Ps[2])) : t, o); };
      return { at: F, normal, lay };
    };
    const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));
    const M = this.M, c0 = new THREE.Color(), c1 = new THREE.Color();

    // ---------------------------------------------------------- the pale rock he sits on: creamy white on top, the
    // paint dragged down its sides, grey-green where it turns from his light; and its apron spilling to the left
    const T_ROCK = 0.04, rock = part();
    {
      const ring = (y, k, dx = 0, dz = 0) => ({ y, c: [ROCK.x + dx, ROCK.z + dz], r1: ROCK.rx * k, r2: ROCK.rz * k });
      const lump = th => 0.6 * Math.sin(3 * th + 0.7) * Math.sin(2 * th + 0.2) + 0.4 * Math.sin(5 * th + 2.1);
      const fl = (v, th) => 1 + 0.07 * lump(th) * (0.5 + 0.5 * v) + 0.03 * Math.sin(th * 9 + v * 5);
      const uR = under(RK), paint = (nw, v, th, p, nl) => c0.copy(uR(nw)).multiplyScalar((0.82 + 0.18 * sstep(v, 0, 0.3)) * (nl.y > 0.6 ? 1.04 : 1));
      const S = loft(rock, [ring(0, 1.04), ring(0.02, 1.02), ring(0.07, 0.98, 0.01), ring(0.12, 0.93, 0.02), ring(0.152, 0.84, 0.03), ring(SEAT, 0.66, 0.04), ring(SEAT, 0.4, 0.04)], T_ROCK, paint, { pow: 3.2, flute: fl, seg: 48, rows: 16, cap: true, shrink: 0.97, dark: 0.82 });
      const tn = mixer(RK, RKH, 0.4, 0.14), n = V3();
      for (let i = 0; i < 150; i++) {     // its sides: the white dragged down
        const dv = lerp(0.2, 0.42, R()), v = lerp(0.04 + dv / 2, 0.74 - dv / 2, R()), th = R() * TAU; S.normal(v, th, n);
        if (n.z < -0.5) continue;
        S.lay(v, th, dv, (R() - 0.5) * 0.08, lerp(0.03, 0.055, R()), tn(n, R()), null, { ridge: 0.07, tip: 0.002, tilt: 0.24 });
      }
      for (let i = 0; i < 70; i++) {      // its top, level
        const a = R() * TAU, d = Math.sqrt(R()) * 0.74, p = V3(ROCK.x + 0.04 + Math.cos(a) * d * ROCK.rx * 0.8, SEAT, ROCK.z + Math.sin(a) * d * ROCK.rz * 0.8);
        stroke(rock, p, V3(0, 1, 0), along(V3(0, 1, 0), ACROSS, 0.9), lerp(0.05, 0.085, R()), lerp(0.022, 0.036, R()), pick(RK.hi, R()).clone().lerp(pick(RKH, R()), 0.3), when(T_ROCK + 0.1, 0.2, p.y), { cell: R() < 0.6 ? 0 : 1, tip: 0.001, tilt: 0.12 });
      }
      // the apron: a lower shelf of the same stone, running out to the left and forward (his foot is on it)
      const A = { x: -0.43, z: 0.61 }, ar = (y, k) => ({ y, c: [A.x, A.z], r1: 0.2 * k, r2: 0.13 * k });
      const S2 = loft(rock, [ar(0, 1.08), ar(0.01, 1.02), ar(0.026, 0.94), ar(0.036, 0.8), ar(0.04, 0.55), ar(0.04, 0.3)], T_ROCK + 0.05, paint, { ax: [0.86, -0.5], pow: 3.4, flute: (v, th) => 1 + 0.2 * lump(th + 1.3) + 0.08 * Math.sin(th * 7 + 1), seg: 40, rows: 10, cap: true, shrink: 0.97, dark: 0.78 });
      for (let i = 0; i < 46; i++) { const v = 0.1 + 0.5 * R(), th = R() * TAU; S2.normal(v, th, n); S2.lay(v, th, 0.3, (R() - 0.5) * 0.1, lerp(0.028, 0.045, R()), tn(n, R()), null, { ridge: 0.07, tip: 0.002 }); }
      for (let i = 0; i < 26; i++) { const a = R() * TAU, d = Math.sqrt(R()) * 0.6, p = V3(A.x + Math.cos(a) * d * 0.15, 0.04, A.z + Math.sin(a) * d * 0.09); stroke(rock, p, V3(0, 1, 0), along(V3(0, 1, 0), V3(0.86, 0, -0.5), 0.8), lerp(0.045, 0.07, R()), lerp(0.02, 0.032, R()), pick(RK.mid, R()).clone().lerp(pick(RKH, R()), 0.5), when(T_ROCK + 0.12, 0.2, p.y), { cell: R() < 0.5 ? 0 : 1, tip: 0.001, tilt: 0.12 }); }
    }

    // ---------------------------------------------------------- his mantle over his knees: one great mass of gold
    // silk falling from his lap in deep folds, the light on the top of his thigh; under it one white stocking and a shoe
    const T_LAP = 0.32, lap = part();
    {
      const ring = (y, s, r1, r2) => ({ y, c: [HIP[0] + DIR[0] * s, HIP[1] + DIR[1] * s], r1, r2 });
      // (folds with creases in them, a few big ones, slanting a little as they fall; and his two knees under the cloth)
      const F = (v, th) => { const t = th + 0.3 * Math.sin(2.3 * v + 1) + 0.5 * (1 - v); return 0.56 * tri(t * 4 + 0.6) + 0.3 * tri(t * 7 + 4.0) + 0.14 * Math.sin(t * 13 + 2.2); };
      const amp = v => (0.025 + 0.12 * Math.pow(1 - v, 1.2)) * fall(v, 0.42, 0.6);
      const bell = (x, w) => Math.exp(-(x / w) * (x / w));
      const knees = (v, th) => 0.05 * bell(v - 0.5, 0.2) * (bell(wrap(th - 0.75), 0.3) + bell(wrap(th + 0.75), 0.3)) - 0.1 * bell(wrap(th), 0.34) * fall(v, 0.5, 0.72);
      const fl = (v, th) => 1 + amp(v) * F(v, th) + knees(v, th);
      const uS = under(OC);
      const paint = (nw, v, th) => c0.copy(uS(nw)).lerp(HOLLOW, 0.6 * fall(F(v, th), -0.75, 0.05) * sstep(amp(v), 0.01, 0.06)).multiplyScalar((1 + 0.07 * sstep(F(v, th), 0.3, 0.9)) * (0.76 + 0.24 * sstep(v, 0.01, 0.12)));
      const S = loft(lap, [ring(0.04, 0.17, 0.086, 0.128), ring(0.085, 0.166, 0.082, 0.124), ring(0.155, 0.158, 0.086, 0.122), ring(0.212, 0.138, 0.1, 0.122), ring(0.248, 0.085, 0.124, 0.112), ring(0.268, 0.04, 0.1, 0.094), ring(0.292, 0.01, 0.082, 0.08), ring(0.33, -0.008, 0.072, 0.068)], T_LAP, paint, { ax: DIR, pow: 3.1, flute: fl, seg: 72, rows: 22, shrink: 0.965, dark: 0.84 });
      const tn = mixer(OC, OCH, 0.42, 0.2), n = V3();
      for (let i = 0; i < 210; i++) {      // long soft drags of gold, straw and grey-green, running down the folds
        const dv = lerp(0.14, 0.3, R()), v = lerp(0.03 + dv / 2, 0.5 - dv / 2, Math.pow(R(), 1.1)), th = R() * TAU, f = F(v, th); S.normal(v, th, n);
        const c2 = tn(n, R()); if (f < -0.3) c2.lerp(HOLLOW, 0.3); else if (f > 0.45) c2.multiplyScalar(1.06);
        S.lay(v, th, dv, (R() - 0.5) * 0.06, lerp(0.03, 0.05, R()), c2, null, { ridge: 0.08, tilt: 0.22, tip: 0.003 });
      }
      for (let i = 0; i < 90; i++) {       // over his thighs: broad, running out along them
        const v = 0.48 + 0.34 * R(), th = R() * TAU; S.normal(v, th, n); if (n.y < -0.1) continue;
        S.lay(v, th, 0.02 * (R() - 0.5), 0.3 + 0.3 * R(), lerp(0.026, 0.042, R()), tn(n, R()), null, { ridge: 0.07, tip: 0.002, tilt: 0.2 });
      }
      for (let i = 0; i < 40; i++) {       // the light loaded on where it faces him
        const v = 0.26 + 0.52 * R(), th = R() * TAU; S.normal(v, th, n); if (n.dot(KEY) < 0.5) continue;
        S.lay(v, th, v < 0.48 ? 0.14 : 0.03 * (R() - 0.5), v < 0.48 ? 0.03 : 0.28, lerp(0.018, 0.03, R()), pick(OC.hi, R()).clone().multiplyScalar(1.03), T_LAP + 0.36, { ridge: 0.12, lift: 0.003, cell: 0 });
      }
      for (let i = 0; i < 30; i++) { const th = R() * TAU; S.normal(0.03, th, n); S.lay(0.03, th, 0.012, 0.16 + 0.14 * R(), 0.02, tn(n, R()).multiplyScalar(0.72), null, { cell: 1, tip: 0.001 }); }      // its hem
      // his two thighs under it, running out to his knees, the cloth sagging between them: so his lap is a lap
      { const yaw = Math.atan2(-DIR[1], DIR[0]), rot = [0, yaw, -0.2], Rr = [0.125, 0.044, 0.056];
        for (const sd of [-1, 1]) {
          const Cc = [HIP[0] + DIR[0] * 0.1 - DIR[1] * 0.056 * sd, 0.246, HIP[1] + DIR[1] * 0.1 + DIR[0] * 0.056 * sd];
          ball(lap, Cc, Rr, nw => c0.copy(uS(nw)), T_LAP + 0.2, { rot, detail: 3, dark: 0.84 });
          coat(lap, Cc, Rr, 70, tn, T_LAP + 0.22, { rot, l: [0.06, 0.1], w: [0.022, 0.034], flow: V3(DIR[0], -0.25, DIR[1]), jit: 0.4, tip: 0.003, ridge: 0.08, tilt: 0.22, keep: (p, nn) => nn.y > -0.2 });
        } }
    }
    // his leg, out from under it to the left: a white stocking; a tan shoe on the stone
    const KNEE = V3(-0.3, 0.175, 0.615), ANKLE = V3(-0.365, 0.08, 0.69), T_LEG = 0.45;
    const leg = part(new THREE.Matrix4().compose(KNEE, new THREE.Quaternion().setFromUnitVectors(V3(0, 1, 0), ANKLE.clone().sub(KNEE).normalize()), V3(1, 1, 1)));
    {
      const len = ANKLE.distanceTo(KNEE);
      tube(leg, [[0.028, 0], [0.027, 0.03], [0.022, len - 0.03], [0.019, len]], WH, T_LEG, 30, mixer(WH, WHH, 0.4, 0.12), { l: [0.04, 0.07], w: [0.016, 0.024], tip: 0.0015, ridge: 0.05, tilt: 0.24, dark: 0.92 });
      const uS = under(SH), SHc = [ANKLE.x - 0.026, 0.06, ANKLE.z + 0.026], SHr = [0.047, 0.02, 0.025], rot = [0, 0.75, 0];
      ball(lap, SHc, SHr, nw => c0.copy(uS(nw)), T_LEG + 0.1, { rot, detail: 3, dark: 0.9 });
      coat(lap, SHc, SHr, 26, mixer(SH, SHH, 0.4, 0.14), T_LEG + 0.12, { rot, l: [0.03, 0.045], w: [0.012, 0.018], flow: ACROSS, jit: 0.5, tip: 0.001, keep: (p, nn) => nn.y > -0.4 });
    }

    // ---------------------------------------------------------- his body, from the waist: wrapped in the mantle, the
    // dark robe showing down his front
    const T_BODY = 0.62, torso = part(M.torso);
    {
      // (a bell of cloth from his shoulders down: his upper arms are inside it)
      const TRr = [[-0.02, 0.092, 0.074, 0.004], [0.03, 0.106, 0.08, 0.006], [0.07, 0.122, 0.084, 0.006], [0.105, 0.128, 0.08, 0.004], [0.13, 0.114, 0.068, 0.002], [0.146, 0.082, 0.052, 0], [0.156, 0.045, 0.036, 0.002], [0.165, 0.028, 0.027, 0.004], [0.178, 0.022, 0.022, 0.004]];
      const FT = (v, th) => 0.6 * tri(th * 5 + 0.4 + 1.5 * v) + 0.4 * tri(th * 8 + 2.0), flT = (v, th) => 1 + 0.07 * fall(v, 0.3, 0.62) * FT(v, th);
      const uO = under(OC), uU = under(UN);
      const front = (p, nl) => sstep(nl.z, 0.3, 0.7) * fall(Math.abs(p.x - 0.006), 0.026, 0.046) * fall(p.y, 0.105, 0.135);
      const paint = (nw, v, th, p, nl) => c0.copy(uO(nw)).lerp(HOLLOW, 0.5 * fall(FT(v, th), -0.7, 0) * fall(v, 0.3, 0.62)).lerp(c1.copy(uU(nw)), front(p, nl));
      const S = loft(torso, TRr.map(([y, r1, r2, z]) => ({ y, c: [0, z], r1, r2 })), T_BODY, paint, { flute: flT, seg: 56, rows: 26, shrink: 0.94, dark: 0.82 });
      const to = mixer(OC, OCH, 0.42, 0.18), tu = mixer(UN, UNH, 0.5, 0.3), n = V3();
      for (let i = 0; i < 200; i++) {      // the mantle: long drags falling from his shoulders
        const dv = lerp(0.14, 0.3, R()), v = lerp(0.04 + dv / 2, 0.72 - dv / 2, R()), th = R() * TAU, p = S.at(v, th); S.normal(v, th, n);
        if (front(p, n) > 0.5) continue;
        S.lay(v, th, dv, (R() - 0.5) * 0.1, lerp(0.022, 0.036, R()), FT(v, th) < -0.4 && v < 0.5 ? to(world(torso, n).clone(), R()).lerp(HOLLOW, 0.35) : to(world(torso, n).clone(), R()), null, { ridge: 0.08, tip: 0.003, tilt: 0.24 });
      }
      for (let i = 0; i < 44; i++) { const v = 0.52 + 0.24 * R(), th = R() * TAU; S.normal(v, th, n); S.lay(v, th, 0.02 * (R() - 0.5), 0.4 + 0.4 * R(), lerp(0.02, 0.03, R()), to(world(torso, n).clone(), R()), null, { ridge: 0.08, tip: 0.003 }); }      // over his shoulders
      for (let i = 0; i < 36; i++) {       // the robe under it, dark
        const v = 0.06 + 0.5 * R(), th = Math.PI / 2 + (R() - 0.5) * 0.9, p = S.at(v, th); S.normal(v, th, n); if (front(p, n) < 0.4) continue;
        S.lay(v, th, lerp(0.1, 0.2, R()), (R() - 0.5) * 0.06, lerp(0.014, 0.022, R()), tu(world(torso, n).clone(), R()), null, { tip: 0.001 });
      }
      // the mantle lying in a deep collar round his neck and out over his shoulders (his head turns in it)
      { const Cc = [0, 0.158, -0.012], Rr = [0.088, 0.04, 0.056];
        ball(torso, Cc, Rr, nw => c0.copy(uO(nw)), T_BODY + 0.3, { detail: 3, dark: 0.82 });
        coat(torso, Cc, Rr, 110, to, T_BODY + 0.32, { l: [0.04, 0.07], w: [0.018, 0.028], flow: V3(0, -0.5, 0).add(V3(0, 0, -0.2)), jit: 1.2, tip: 0.005, ridge: 0.09, keep: (p, nn) => nn.z < 0.55 || Math.abs(nn.x) > 0.5 }); }
      for (let i = 0; i < 26; i++) {       // and the lights, where his light falls on shoulder and back
        const v = 0.3 + 0.44 * R(), th = R() * TAU, p = S.at(v, th); S.normal(v, th, n);
        if (front(p, n) > 0.3 || world(torso, n).dot(KEY) < 0.45) continue;
        S.lay(v, th, lerp(0.1, 0.18, R()), (R() - 0.5) * 0.14, lerp(0.014, 0.024, R()), pick(OC.hi, R()).clone().multiplyScalar(1.03), T_BODY + 0.36, { ridge: 0.12, lift: 0.003, cell: 0 });
      }
    }

    // ---------------------------------------------------------- his head: the mantle drawn up over it, a dark cap at
    // his brow, his eyes in the shade of it, his nose and cheek in the light, and the long white beard. No drawn features.
    const T_HEAD = 1.0, head = part(M.head, EM.head);
    {
      const uW = under(WH), uO = under(OC);
      const SKc = [0, 0.058, 0.004], SKr = [0.035, 0.043, 0.038];
      const gz = (n, x, y, z, rx, ry = rx) => { const k = 1 / Math.hypot(x, y, z), dx = (n.x - x * k) / rx, dy = (n.y - y * k) / ry, dz2 = (n.z - z * k) / rx; return Math.exp(-(dx * dx + dy * dy + dz2 * dz2)); };
      // (his face takes its light from in front of him and a little to his right, whichever way he turns: the far
      // cheek goes into shade, the brow shades the eyes)
      const KF = V3(-0.5, 0.5, 0.7).normalize(), cf = new THREE.Color();
      const uF = n => { const k = n.dot(KF); return cf.copy(FL.deep[0]).lerp(FL.lo[0], sstep(k, -0.5, -0.05)).lerp(FL.mid[0], sstep(k, 0.0, 0.42)).lerp(FL.hi[0], sstep(k, 0.5, 0.9)); };
      const face = (nw, v, nn) => {
        c0.copy(uF(nn));
        c0.lerp(SOCK, 0.6 * gz(nn, 0, 0.21, 0.95, 0.6, 0.085));                                          // the shade under his brow, right across
        for (const sx of [-1, 1]) c0.lerp(SOCK, 0.8 * gz(nn, sx * 0.4, 0.1, 0.9, 0.25, 0.15)).lerp(EYE, 0.92 * gz(nn, sx * 0.4, 0.07, 0.9, 0.15, 0.08)).lerp(CHEEK, 0.5 * gz(nn, sx * 0.6, -0.16, 0.8, 0.2, 0.14));
        c0.lerp(SOCK, 0.4 * gz(nn, 0.2, -0.08, 0.96, 0.09, 0.16)).lerp(FL.hi[0], 0.3 * gz(nn, -0.5, -0.12, 0.85, 0.16, 0.1)).lerp(FL.hi[0], 0.4 * gz(nn, -0.1, 0.42, 0.9, 0.3, 0.12));      // beside his nose; the light on his cheekbone and his forehead
        return c0.lerp(c1.copy(uW(nw)), sstep(-nn.y, 0.3, 0.44));                                        // and below, his beard
      };
      ball(head, SKc, SKr, face, T_HEAD + 0.04, { detail: 6, shrink: 0.95, dark: 0.97 });
      ball(head, [0, 0.05, 0.043], [0.0056, 0.0125, 0.0074], (nw, v, nn) => c0.copy(uF(nn)), T_HEAD + 0.1, { detail: 2, shrink: 1, dark: 0.97 });      // his nose
      const visage = (nw, r, nn) => face(nw, null, nn).clone().multiplyScalar(1 + (r - 0.5) * 0.06);
      coat(head, SKc, SKr, 360, visage, T_HEAD + 0.2, { l: [0.008, 0.013], w: [0.007, 0.01], keep: (p, n) => n.z > 0.05 && n.y < 0.7 && n.y > -0.5, flow: V3(0.2, -1, 0), jit: 1.4, cell: 2, tip: 0.0006, lift: 0.001, ridge: 0.02, tilt: 0.1 });
      const on = (nx, ny, nz, g = 1.02) => { const n = V3(nx, ny, nz).normalize(); return [V3(SKc[0] + n.x * SKr[0] * g, SKc[1] + n.y * SKr[1] * g, SKc[2] + n.z * SKr[2] * g), n]; };
      { const n = V3(-0.14, -0.06, 1).normalize(); stroke(head, V3(-0.0008, 0.052, 0.0506), n, V3(0.04, 1, 0).normalize(), 0.022, 0.0058, FL.hi[1], T_HEAD + 0.4, { cell: 2, lift: 0.0005, tip: 0, tilt: 0.05, ridge: 0.03 }); }      // the light down his nose
      for (const sx of [-1, 1]) {      // his brows: grey, heavy, each one soft touch over the dark of the eye
        const [p, n] = on(sx * 0.4, 0.2, 0.9, 1.05); stroke(head, p, n, V3(sx, -0.22, -0.1 * sx).normalize(), 0.019, 0.0062, pick(sx < 0 ? WH.mid : WH.lo, R()), T_HEAD + 0.42, { cell: 0, lift: 0.0006, tip: 0.0006, tilt: 0.1, ridge: 0.04 });
      }
      for (const sx of [-1, 1]) { const [p, n] = on(sx * 0.4, 0.085, 0.9, 1.03); stroke(head, p, n, V3(sx, -0.1, 0).normalize(), 0.013, 0.0055, EYE, T_HEAD + 0.4, { cell: 2, lift: 0.0004, tip: 0, tilt: 0.05, ridge: 0 }); }      // the dark his eyes are in
      // the mantle drawn up over his head as a deep, loose hood: an open shell that closes over his brow and shades
      // it, stands wide of his cheeks and runs down into the collar on his shoulders (nothing is wound round his head)
      const th = mixer(OC, OCH, 0.42, 0.2), yT = 0.124, yB = -0.012;
      const HF = (a, b, out) => {
        const y = lerp(yT, yB, b), e = clamp01(1 - ((y - 0.05) / 0.076) ** 2), rh = Math.max(0.057 * Math.sqrt(e), y < 0.04 ? 0.05 + 0.5 * (0.04 - y) : 0), open = 0.66 * sstep(b, 0.2, 0.42) * (1 - 0.25 * sstep(b, 0.7, 1));
        const ph = lerp(-(Math.PI - open), Math.PI - open, a), fl = 1 + 0.035 * tri(ph * 3 + 0.5) * b;
        return out.set(Math.sin(ph) * rh * fl * 0.94, y, -0.004 + 0.007 * (1 - b) - Math.cos(ph) * rh * fl);
      };
      const hflip = (() => { const p1 = HF(0.51, 0.5, V3()).sub(HF(0.49, 0.5, V3())), p2 = HF(0.5, 0.51, V3()).sub(HF(0.5, 0.49, V3())); return p1.cross(p2).z > 0 ? -1 : 1; })();      // (outwards: at the back of his head, towards the wall)
      const HS = sheet(head, HF, 34, 14, T_HEAD + 0.1, (nw, a, b) => c0.copy(uO(nw)), { dark: 0.84, flip: hflip });
      { const n = V3();
        for (let i = 0; i < 190; i++) { const a = R(), b = lerp(0.1, 0.9, R()); HS.normal(a, b, n); HS.lay(a, b, (R() - 0.5) * 0.06, lerp(0.22, 0.4, R()), lerp(0.016, 0.026, R()), th(world(head, n).clone(), R()), null, { ridge: 0.09, tip: 0.004, tilt: 0.24 }); }      // falling from his crown
        for (let i = 0; i < 26; i++) { const a = R(), b = 0.04 + 0.1 * R(); HS.normal(a, b, n); HS.lay(a, b, 0.3, 0.02, lerp(0.014, 0.022, R()), th(world(head, n).clone(), R()), null, { ridge: 0.09, tip: 0.003 }); }                                           // round his crown
        for (const a of [0.012, 0.988]) for (let i = 0; i < 9; i++) { const b = 0.36 + i * 0.068; HS.normal(a, b, n); HS.lay(a, b, 0, 0.1, 0.012, th(world(head, n).clone(), R()).multiplyScalar(1.05), T_HEAD + 0.34, { ridge: 0.1, tip: 0.001, lift: 0.0026, cell: 0 }); }      // its edge either side of his face
        for (let i = 0; i < 40; i++) { const a = R() < 0.5 ? 0.02 + 0.14 * R() : 0.98 - 0.14 * R(), b = lerp(0.3, 0.92, R()); HS.lay(a, b, 0.01, 0.2, 0.02, pick(R() < 0.5 ? OC.deep : UN.lo, R()), T_HEAD + 0.2, { tip: 0.0005, lift: 0.0012, cell: 0 }, -1); }      // its inside, in the dark
      }
      // his beard: long, white and grey, in soft falling strokes; it parts a little at the bottom
      const BDc = [0, -0.012, 0.03], BDr = [0.031, 0.058, 0.022], bw = mixer(WH, WHH, 0.5, 0.14);
      ball(head, BDc, BDr, nw => c0.copy(uW(nw)), T_HEAD + 0.16, { detail: 3, dark: 0.88 });
      coat(head, BDc, BDr, 150, bw, T_HEAD + 0.18, { l: [0.03, 0.055], w: [0.009, 0.015], grow: 1.02, keep: (p, n) => n.z > -0.35, flow: V3(0.06, -1, 0.1), jit: 0.5, tip: 0.004, ridge: 0.1, tilt: 0.3 });
      coat(head, [0, -0.05, 0.03], [0.024, 0.03, 0.017], 40, bw, T_HEAD + 0.24, { l: [0.03, 0.045], w: [0.008, 0.012], keep: (p, n) => n.y < 0.3, flow: V3(0.1, -1, 0.1), jit: 0.7, tip: 0.006, ridge: 0.1 });
      for (const sx of [-1, 1]) {      // the moustache; and the beard up his cheek to the hood
        stroke(head, V3(sx * 0.011, 0.0405, 0.041), V3(sx * 0.3, 0.1, 1).normalize(), V3(sx * 0.8, -0.6, 0).normalize(), 0.022, 0.009, WH.hi[0], T_HEAD + 0.42, { lift: 0.002, tip: 0.002, cell: 0, bend: -0.12 * sx });
        for (let i = 0; i < 4; i++) stroke(head, V3(sx * (0.026 + 0.002 * i), 0.047 - 0.008 * i, 0.027 - 0.002 * i), V3(sx * 0.8, 0, 0.6).normalize(), V3(0.15 * sx, -1, 0.1).normalize(), 0.02, 0.009, pick(WH.mid, R()), T_HEAD + 0.36, { lift: 0.0015, tip: 0.002, cell: 1 });
      }
    }

    // ---------------------------------------------------------- his arms (each bone along its own +y): sleeves of the
    // same gold, a hand
    const T_ARM = 0.9, to2 = mixer(OC, OCH, 0.42, 0.18), tf2 = mixer(FL, FLH, 0.3, 0.07), uF2 = under(FL);
    const SLEEVE = { l: [0.05, 0.085], w: [0.02, 0.03], tip: 0.003, ridge: 0.08, tilt: 0.26, dark: 0.86 };
    const upper = (rest, from) => { const Pt = part(rest, from); tube(Pt, [[0.04, -0.01], [0.042, 0.03], [0.037, 0.08], [0.031, L1]], OC, T_ARM, 60, to2, SLEEVE); return Pt; };
    const uO2 = under(OC);
    const tu2 = mixer(UN, UNH, 0.5, 0.3);
    const fore = (rest, hang, from) => {
      const Pt = part(rest, from);
      if (hang) {      // (his wand arm: the narrow sleeve of the dark robe)
        tube(Pt, [[0.022, 0], [0.021, 0.05], [0.018, 0.1], [0.016, 0.134]], UN, T_ARM + 0.05, 30, tu2, { l: [0.04, 0.07], w: [0.012, 0.018], tip: 0.002, dark: 0.9 });
        const Hc = [0, L2 - 0.002, 0.001], Hr = [0.0145, 0.022, 0.0115];
        ball(Pt, Hc, Hr, nw => c0.copy(uF2(nw)), T_ARM + 0.08, { detail: 3, dark: 0.95 });
        coat(Pt, Hc, Hr, 26, tf2, T_ARM + 0.1, { l: [0.012, 0.02], w: [0.008, 0.012], cell: 2, tip: 0.0008, ridge: 0.03, tilt: 0.16 });
        return Pt;
      }
      tube(Pt, [[0.03, 0], [0.031, 0.04], [0.033, 0.09], [0.035, 0.126]], OC, T_ARM + 0.05, 56, to2, { ...SLEEVE, ends: false });
      solid(Pt, shape.move(shape.ball(0.03, 0xffffff, 2), 0, 0, 0), V3(0, 0, 0), T_ARM + 0.15, nn => c0.copy(uO2(nn)).multiplyScalar(0.84));
      solid(Pt, shape.move(shape.cyl(0.03, 0.03, 0.004, 14, 0xffffff), 0, 0.118, 0), V3(0, 0, 0), T_ARM + 0.15, () => UN.deep[0]);      // (the dark inside the cuff)
      const Hc = [0, L2 - 0.002, 0.001], Hr = [0.0145, 0.022, 0.0115];
      ball(Pt, Hc, Hr, nw => c0.copy(uF2(nw)), T_ARM + 0.08, { detail: 3, dark: 0.95 });
      coat(Pt, Hc, Hr, 26, tf2, T_ARM + 0.1, { l: [0.012, 0.02], w: [0.008, 0.012], cell: 2, tip: 0.0008, ridge: 0.03, tilt: 0.16 });
      return Pt;
    };
    const ru = upper(M.ru), rf = fore(M.rf, false), lu = upper(M.lu, EM.lu), lf = fore(M.lf, true, EM.lf);
    // the mantle falling from his left shoulder over that arm, down to his lap, in three or four creased folds:
    // only his wrist and hand come out from under it
    {
      const Sl = V3(...SH_L), El = V3(0, 0, 0).applyMatrix4(M.lf).applyMatrix4(torso.inv), d = El.clone().sub(Sl), len = d.length(); d.normalize();
      const u = V3(0.35, 0, 1); u.addScaledVector(d, -u.dot(d)).normalize(); const w = V3().crossVectors(d, u), A0 = Sl.clone().addScaledVector(d, -0.03).add(V3(-0.012, 0.012, -0.006)), ff = (a, b) => tri(a * 10.5 + 0.7 + 1.1 * b), q = V3();
      const dnL = V3(0, -1, 0).transformDirection(torso.inv);
      const F = (a, b, out) => { const ph = lerp(-2.0, 1.9, a), r = (0.038 + 0.026 * Math.pow(b, 0.8)) * (1 + 0.18 * ff(a, b) * b) * (1 - 0.25 * Math.pow(Math.abs(a - 0.5) * 2, 3)); return out.copy(A0).addScaledVector(d, b * (len + 0.1 - 0.02 * Math.cos(ph))).addScaledVector(dnL, 0.4 * Math.max(0, b - 0.45) ** 2).addScaledVector(u, r * Math.cos(ph)).addScaledVector(w, r * Math.sin(ph)); };
      const W = sheet(torso, F, 26, 12, T_ARM + 0.1, (nw, a, b) => c0.copy(uO2(nw)).lerp(HOLLOW, 0.45 * fall(ff(a, b), -0.7, 0.1) * b), { dark: 0.84 }), n = V3();
      for (let i = 0; i < 120; i++) {
        const a = 0.04 + 0.92 * R(), b = lerp(0.24, 0.76, R()), db = lerp(0.36, 0.5, R()); W.normal(a, b, n);
        const c2 = to2(world(torso, n).clone(), R()); if (ff(a, b) < -0.4) c2.lerp(HOLLOW, 0.32);
        W.lay(a, b, (R() - 0.5) * 0.04, db, lerp(0.02, 0.032, R()), c2, null, { ridge: 0.08, tip: 0.003, tilt: 0.22 });
      }
      for (let i = 0; i < 26; i++) { const a = R(), b = lerp(0.3, 0.7, R()); W.normal(a, b, n); if (world(torso, n).dot(KEY) < 0.3 || ff(a, b) < 0.2) continue; W.lay(a, b, 0.01, 0.4, lerp(0.011, 0.018, R()), pick(OC.hi, R()).clone().multiplyScalar(1.04), T_ARM + 0.44, { ridge: 0.12, lift: 0.003, cell: 0 }); }
    }
    // the great fall of the mantle from his lifted arm down to his lap: a sail of silk in a few big folds
    const T_WING = 0.82;
    {
      const S = V3(...SH_R).applyMatrix4(M.torso), E = V3(0, 0, 0).applyMatrix4(M.rf), H = this.GRIP.clone();
      const top = (a, out) => (a < 0.5 ? out.lerpVectors(S, E, a * 2) : out.lerpVectors(E, H, (a - 0.5) * 2)), B0 = V3(-0.16, 0.278, 0.5), B1 = V3(-0.3, 0.22, 0.405), ta = V3(), tb = V3();
      const fw = (a, b) => tri(a * 9 + 0.6 + 1.4 * b);
      const F = (a, b, out) => {
        // (it lies over his arm, which is inside it, comes forward off it and falls)
        top(0.86 * a, ta); ta.y += 0.03 - 0.012 * a; ta.z -= 0.012; tb.lerpVectors(B0, B1, a); tb.y -= 0.045 * Math.sin(Math.PI * a);
        const fold = 0.02 * fw(a, b) * Math.pow(b, 0.7) + 0.006 * Math.sin(a * 23 + 2 * b) * b, over = Math.sin(Math.PI * Math.pow(b, 0.55));
        return out.lerpVectors(ta, tb, b).add(V3(0.015 * over * (1 - a), -0.015 * Math.sin(Math.PI * b), (0.05 - 0.02 * a) * over + fold));
      };
      const uO = under(OC), W = sheet(lap, F, 26, 16, T_WING, (nw, a, b) => c0.copy(uO(nw.z < 0 ? nw.clone().negate() : nw)).lerp(HOLLOW, 0.4 * fall(fw(a, b), -0.7, 0.1) * b), { dark: 0.84 });
      const n = V3();
      for (let i = 0; i < 190; i++) {
        const a = R(), b = lerp(0.16, 0.8, R()), db = lerp(0.26, 0.5, R()), sd = R() < 0.8 ? 1 : -1; W.normal(a, b, n).multiplyScalar(sd);
        const c2 = to2(n.clone(), R()); if (fw(a, b) < -0.4) c2.lerp(HOLLOW, 0.3);
        W.lay(a, b, (R() - 0.5) * 0.05, -db, lerp(0.022, 0.036, R()), c2, null, { ridge: 0.08, tip: 0.003, tilt: 0.22 }, sd);
      }
      for (let i = 0; i < 30; i++) { const a = R(), b = lerp(0.25, 0.7, R()); W.normal(a, b, n); if (n.dot(KEY) < 0.3) continue; W.lay(a, b, 0.02, -0.4, lerp(0.012, 0.02, R()), pick(OC.hi, R()).clone().multiplyScalar(1.04), T_WING + 0.34, { ridge: 0.12, lift: 0.003, cell: 0 }); }
    }

    // ---------------------------------------------------------- the shield, as he holds it in the picture: its hollow
    // side to us (leather, two straps, a fringed edge), its steel face away; and, not yet, the light
    const T_SH = 1.1, shield = part(this.SHM);
    {
      const uL = under(LE), uS = under(ST);
      const F = (a, b, out) => { const th = b * TAU, x = a * Math.cos(th) * HW, y = a * Math.sin(th) * HL; return out.set(x, y, dz(x, y)); };
      sheet(shield, F, 10, 40, T_SH, (nw, a) => c0.copy(uL(nw)).multiplyScalar(0.74 + 0.3 * a), { dark: 0.86 });
      const dn = (x, y, sd) => V3(-2 * DP * x / (HW * HW), -2 * DP * y / (HL * HL), 1).normalize().multiplyScalar(sd);
      const ds = (x0, y0, dx, dy, len, w, c, t, o = {}, sd = 1) => { const Ps = [], Ns = [], k = 1 / Math.hypot(dx, dy); for (let i = 0; i < 6; i++) { const s = (i / 5 - 0.5) * len, x = x0 + dx * k * s, y = y0 + dy * k * s; Ps.push(V3(x, y, dz(x, y))); Ns.push(dn(x, y, sd)); } ribbon(shield, Ps, Ns, w, c, t == null ? when(T_SH, 0.2, yOf(shield, Ps[2])) : t, o); };
      const inside = (rmax = 0.82) => { for (;;) { const x = (R() * 2 - 1), y = (R() * 2 - 1); if (x * x + y * y < rmax * rmax) return [x * HW, y * HL]; } };
      const tl = mixer(LE, LEH, 0.45, 0.2), ts = mixer(ST, STH, 0.4, 0.16);
      for (let i = 0; i < 90; i++) { const [x, y] = inside(0.8), r = Math.hypot(x / HW, y / HL); ds(x, y, (R() - 0.5) * 0.3, 1, lerp(0.06, 0.1, R()) * (1 - 0.4 * r), lerp(0.02, 0.032, R()), tl(world(shield, dn(x, y, 1)).clone(), R()).multiplyScalar(0.8 + 0.3 * r), null, { tip: 0.002, ridge: 0.07 }); }      // the leather, brushed down its length
      for (let i = 0; i < 46; i++) { const a = i / 46 * TAU + R() * 0.1, x = Math.cos(a) * HW * 0.93, y = Math.sin(a) * HL * 0.93; ds(x, y, -Math.sin(a) * HW, Math.cos(a) * HL, 0.05, 0.016, pick(i % 3 ? LE.lo : LE.mid, R()), null, { tip: 0.001, lift: 0.003, cell: 0 }); }      // its rim
      for (let i = 0; i < 64; i++) { const a = i / 64 * TAU + R() * 0.08, x = Math.cos(a) * HW * 1.04, y = Math.sin(a) * HL * 1.03; ds(x, y, Math.cos(a) + (R() - 0.5) * 0.5, Math.sin(a) + (R() - 0.5) * 0.5, lerp(0.022, 0.034, R()), 0.009, pick(R() < 0.3 ? LE.hi : LE.lo, R()), null, { tip: 0.004, lift: 0.002, cell: 1 }); }      // its fringe
      for (const [yy, sl] of [[0.075, 0.25], [-0.07, -0.2]]) {      // two straps across it, each with a buckle
        for (let i = 0; i < 5; i++) { const x = (i - 2) * 0.03; ds(x, yy + sl * x, 1, sl, 0.04, 0.014, pick(STRAP, R()), T_SH + 0.3, { lift: 0.0045, tip: 0.0005, cell: 0, ridge: 0.1 }); }
        ds(0.02, yy + sl * 0.02, 0.2, 1, 0.014, 0.011, BUCKLE, T_SH + 0.36, { lift: 0.0062, tip: 0, cell: 2, ridge: 0.12 });
      }
      for (let i = 0; i < 80; i++) { const [x, y] = inside(0.9); ds(x, y, (R() - 0.5) * 0.4, 1, lerp(0.06, 0.1, R()), lerp(0.022, 0.034, R()), ts(world(shield, dn(x, y, -1)).clone(), R()), null, { tip: 0.002, ridge: 0.08, lift: 0.003 }, -1); }      // its face, steel
      // the light: laid level across the shield as the far shore lies in the picture (sky, gold and rose, a line of
      // far land, the sea), each touch kindled in its turn from the wand's tip outwards
      KIND = 1;
      const upx = this.SHM.elements[1], upy = this.SHM.elements[5], hx = upy, hy = -upx, hk = Math.hypot(upx, upy);      // (the room's "up", laid in the shield's own plane; and level)
      const lit = (x, y, len, w, c, o = {}) => ds(x, y, hx, hy, len, w, c, Math.hypot(x - TOUCH[0], y - TOUCH[1]) / SPREAD + 0.12 * R(), { stay: true, lift: 0.0085, tip: 0.0008, ridge: 0.05, tilt: 0.12, cell: 0, ...o });
      const stops = [[-0.2, SEA[3]], [-0.07, SEA[1]], [-0.02, SEA[2]], [-0.005, GOLD[1]], [0.012, ROSE[0]], [0.04, GOLD[0]], [0.07, GOLD[2]], [0.105, SKY[2]], [0.14, SKY[0]], [0.22, SKY[1]]];
      const glow = (h, into) => { let i = 1; while (i < stops.length - 1 && h > stops[i][0]) i++; return into.copy(stops[i - 1][1]).lerp(stops[i][1], clamp01((h - stops[i - 1][0]) / (stops[i][0] - stops[i - 1][0]))); };
      KIND = 2;
      { const g = 0.017, q = V3(), cc = new THREE.Color();      // (under the touches, the same light laid thin over the hollow itself, scumbled in a little after them)
        for (let gx = -8; gx <= 8; gx++) for (let gy = -13; gy <= 13; gy++) {
          const x = gx * g, y = gy * g; if (Math.hypot(x / HW, y / HL) > 0.95) continue;
          const cen = V3(x, y, dz(x, y) + 0.0068), f = [0, 0, 0, Math.hypot(x - TOUCH[0], y - TOUCH[1]) / SPREAD + 0.16 + 0.2 * R()], P4 = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([i, j]) => { const xx = x + i * g * 0.52, yy = y + j * g * 0.52; return [V3(xx, yy, dz(xx, yy) + 0.0068), dn(xx, yy, 1), glow((xx * upx + yy * upy) / hk, cc).clone().multiplyScalar(0.94 + 0.1 * R())]; });
          for (const k of [0, 1, 2, 0, 2, 3]) vert(shield, P4[k][0], P4[k][1], P4[k][2], UV_SOLID, cen, f);
        } }
      KIND = 1;
      for (let i = 0; i < 250; i++) {
        const [x, y] = inside(0.94), h = (x * upx + y * upy) / hk, r = Math.hypot(x / HW, y / HL), len = lerp(0.05, 0.09, R()) * (1 - 0.5 * r * r);
        const c = glow(h + 0.012 * (R() - 0.5), new THREE.Color()).lerp(h > 0.075 ? pick(SKY, R()) : h > 0.03 ? pick(GOLD, R()) : h > -0.01 ? pick(R() < 0.6 ? ROSE : GOLD, R()) : pick(SEA, R()), 0.5);
        lit(x, y, len, lerp(0.018, 0.03, R()), c);
      }
      for (let i = 0; i < 9; i++) lit((i - 4 + (R() - 0.5)) * 0.019, (-0.004 - (i - 4) * 0.019 * upx) / upy + (R() - 0.5) * 0.004, 0.028, 0.0075, pick(SHORE, R()), { lift: 0.0098, cell: 1 });      // the far land, a thin line
      lit(0.03, (0.004 - 0.03 * upx) / upy, 0.008, 0.013, SHORE[1], { lift: 0.0104, cell: 2 });                                                                                                    // and something tall on it
      for (let i = 0; i < 12; i++) { const [x, y] = inside(0.7), h = (x * upx + y * upy) / hk; if (h > -0.02) continue; lit(x, y, 0.03, 0.006, GLINT, { lift: 0.01, cell: 1 }); }                   // lights on the water
      KIND = 0;
      this.BIRD = { z: y => dz(0, y) + 0.016, slope: -upx / upy };
    }
    // three birds, far off, for the shield's sky (they are in the picture, small and dark, over the sea): two touches each
    const BIRDC = col('#4c5661', 0.08), birds = [0, 1, 2].map(() => { const Pt = part(); for (const sx of [-1, 1]) stroke(Pt, V3(sx * 0.0058, 0.0016, 0), V3(0, 0, 1), V3(sx, 0.34, 0).normalize(), 0.0125, 0.0036, BIRDC, 0, { stay: true, lift: 0, tip: 0, cell: 0, tilt: 0, ridge: 0 }); return Pt; });
    // his wand: a thin rod, dark, a light down one side
    const T_WAND = 1.3, wand = part(M.wand, EM.wand);
    {
      const uW2 = under(WD);
      tube(wand, [[0.0048, -0.02], [0.0044, 0.08], [0.0036, 0.2], [0.0026, WL]], WD, T_WAND, 0, null, { shrink: 1, dark: 1 });
      for (let i = 0; i < 7; i++) { const y = -0.01 + i * 0.04, n = V3(-0.5, 0.6, 0.6).normalize(); stroke(wand, V3(n.x * 0.004, y + 0.02, n.z * 0.004), V3(n.x, 0, n.z).normalize(), V3(0, 1, 0), 0.05, 0.006, i % 2 ? WD.hi[0] : c0.copy(uW2(KEY)).clone(), T_WAND + 0.1, { lift: 0.0006, tip: 0.0004, cell: 0, tilt: 0.1 }); }
    }

    // ---------------------------------------------------------- the old trunk on the right, leaning out of the
    // picture as it does there: tan where the light is, split pale, ivy dark at its foot
    const T_TR = 0.14, trunk = part(new THREE.Matrix4().compose(V3(...TRUNK.base), new THREE.Quaternion().setFromEuler(new THREE.Euler(TRUNK.back, 0, TRUNK.lean, 'YXZ')), V3(1, 1, 1)));
    {
      const H = 0.52, tt = mixer(TR, TRH, 0.45, 0.22), uT2 = under(TR), tg = mixer(GR, GRH, 0.5, 0.3), uG = under(GR);
      tube(trunk, [[0.078, -0.03], [0.064, 0.04], [0.055, 0.16], [0.05, 0.32], [0.046, 0.44], [0.036, H]], TR, T_TR, 150, tt, { l: [0.08, 0.16], w: [0.02, 0.034], tip: 0.004, ridge: 0.1, tilt: 0.3, dark: 0.8, shrink: 0.9 });
      for (let i = 0; i < 16; i++) { const ph = R() * TAU, nn = V3(Math.cos(ph), 0, Math.sin(ph)), y = lerp(0.1, 0.44, R()); if (world(trunk, nn).dot(KEY) < 0.1) continue; stroke(trunk, V3(nn.x * 0.053, y, nn.z * 0.053), nn, V3(0, 1, 0), lerp(0.08, 0.14, R()), 0.011, pick(TR.hi, R()).clone().multiplyScalar(1.06), T_TR + 0.3, { lift: 0.003, tip: 0.002, cell: 1, ridge: 0.14 }); }      // where it has split, pale
      for (let i = 0; i < 12; i++) { const ph = i / 12 * TAU, nn = V3(Math.cos(ph), 0, Math.sin(ph)); stroke(trunk, V3(nn.x * 0.036, H + 0.012 * R(), nn.z * 0.036), nn, V3(nn.x * 0.2, 1, nn.z * 0.2).normalize(), lerp(0.04, 0.075, R()), 0.016, pick(R() < 0.5 ? TR.lo : TR.mid, R()), T_TR + 0.32, { tip: 0.006, cell: 1 }); }      // its broken top
      // ivy at its foot and up its far side (the scene's own measure)
      for (const [Cc, Rr, n] of [[[0.72, 0.035, 0.49], [0.11, 0.05, 0.08], 90], [[0.8, 0.2, 0.41], [0.045, 0.14, 0.045], 60], [[0.55, 0.02, 0.5], [0.07, 0.03, 0.05], 36]]) {
        coat(rock, Cc, Rr, n, tg, T_TR + 0.24, { l: [0.02, 0.036], w: [0.016, 0.026], cell: 2, jit: 3, tip: 0.008, lift: 0.002, tilt: 0.6, grow: 0.9, keep: (p, nn) => nn.y > -0.3 });
        coat(rock, Cc, Rr, n >> 1, tg, T_TR + 0.3, { l: [0.018, 0.03], w: [0.014, 0.022], cell: 2, jit: 3, tip: 0.01, lift: 0.004, tilt: 0.7, grow: 1.08, keep: (p, nn) => nn.y > -0.1 });
      }
    }

    // ---------------------------------------------------------- what waits at the trunk's foot: a blue mantle thrown
    // down on the sand, and on it a gilt helmet with white plumes
    const T_ARMS = 0.34, arms = part();
    {
      const ax = [0.88, -0.47], ring = (y, r1, r2, s = 0) => ({ y, c: [CLOAK.x + ax[0] * s, CLOAK.z + ax[1] * s], r1, r2 });
      // (thrown down, not folded: a low heap with creased ridges running through it, a corner dragged out towards us)
      const F = (v, th) => 0.55 * tri(th * 4 + 0.9 + 2.5 * v) + 0.3 * tri(th * 7 + 3.1 - 2 * v) + 0.15 * Math.sin(th * 13 + 1.2 + 4 * v);
      const fl = (v, th) => 1 + (0.26 - 0.1 * v) * F(v, th) + 0.34 * Math.exp(-Math.pow(wrap(th - 2.5) / 0.4, 2)) * (1 - v);
      const uB = under(BL), paint = (nw, v, th) => c0.copy(uB(nw)).multiplyScalar(1 - 0.45 * fall(F(v, th), -0.7, 0.1));
      const S = loft(arms, [ring(0, 0.23, 0.14), ring(0.01, 0.22, 0.132), ring(0.03, 0.185, 0.11, 0.015), ring(0.05, 0.135, 0.082, 0.035), ring(0.062, 0.075, 0.048, 0.05), ring(0.066, 0.02, 0.015, 0.05)], T_ARMS, paint, { ax, pow: 2.5, flute: fl, seg: 64, rows: 12, cap: true, shrink: 0.97, dark: 0.86 });
      const tb = mixer(BL, BLH, 0.45, 0.18), n = V3();
      for (let i = 0; i < 190; i++) {
        const v = 0.04 + 0.88 * R(), th = R() * TAU, f = F(v, th); S.normal(v, th, n);
        const c2 = tb(n, R()); if (f < -0.25) c2.lerp(BL.deep[0], 0.6); else if (f > 0.4) c2.lerp(BL.hi[0], 0.4);
        if (R() < 0.5) S.lay(v, th, lerp(0.16, 0.3, R()), (R() - 0.5) * 0.1, lerp(0.02, 0.032, R()), c2, null, { ridge: 0.08, tip: 0.003 });
        else S.lay(v, th, 0.03 * (R() - 0.5), 0.16 + 0.2 * R(), lerp(0.018, 0.028, R()), c2, null, { ridge: 0.08, tip: 0.003 });
      }
      for (let i = 0; i < 26; i++) { const v = 0.2 + 0.7 * R(), th = R() * TAU; S.normal(v, th, n); if (F(v, th) < 0.35 || n.dot(KEY) < 0.3) continue; S.lay(v, th, 0.2, 0.04, lerp(0.01, 0.016, R()), pick(BL.hi, R()).clone().multiplyScalar(1.05), T_ARMS + 0.3, { ridge: 0.12, lift: 0.003, cell: 0 }); }      // the light along its ridges
      // the helmet, lying on it on its side: a gilt bowl, a comb along its crown, a light along the rim of its opening
      // and the dark inside it
      const uG = under(GD), Hr = [0.05, 0.054, 0.058], rot = [0.15, 0.4, -0.9], tg = mixer(GD, GDH, 0.45, 0.2), q = new THREE.Quaternion().setFromEuler(new THREE.Euler(rot[0], rot[1], rot[2], 'YXZ'));
      const hp = (x, y, z) => V3(x, y, z).applyQuaternion(q).add(V3(...HELM));      // (a point in the helmet's own measure: y out through its crown)
      const open = u0 => u0.y < -0.38;                                               // (its opening: the end away from the crown)
      ball(arms, HELM, Hr, (nw, v, nn) => (open(V3(nn.x, nn.y, nn.z).applyQuaternion(q.clone().invert())) ? c0.copy(GD.deep[0]).multiplyScalar(0.6) : c0.copy(uG(nw))), T_ARMS + 0.24, { rot, detail: 4, dark: 0.86 });
      coat(arms, HELM, Hr, 110, tg, T_ARMS + 0.26, { rot, l: [0.03, 0.05], w: [0.012, 0.02], flow: V3(0.3, -0.4, 1), jit: 0.8, tip: 0.002, ridge: 0.12, keep: (p, nn, u0) => !open(u0) });
      coat(arms, HELM, Hr, 22, (nn, r) => pick(GD.hi, r).clone().multiplyScalar(1.08), T_ARMS + 0.4, { rot, l: [0.02, 0.03], w: [0.006, 0.009], grow: 1.03, keep: (p, nn, u0) => !open(u0) && world(arms, nn).dot(KEY) > 0.45, cell: 1, tip: 0.001 });
      coat(arms, HELM, Hr, 26, () => c0.copy(GD.deep[0]).multiplyScalar(0.55).clone(), T_ARMS + 0.3, { rot, l: [0.016, 0.026], w: [0.014, 0.02], grow: 0.99, cell: 2, tip: 0, lift: 0.0006, keep: (p, nn, u0) => u0.y < -0.5 });
      for (let i = 0; i < 16; i++) { const a = i / 16 * TAU, cy = -0.4, rr = Math.sqrt(1 - cy * cy), u0 = V3(Math.cos(a) * rr, cy, Math.sin(a) * rr), nn = V3(u0.x / Hr[0], u0.y / Hr[1], u0.z / Hr[2]).normalize().applyQuaternion(q); stroke(arms, hp(u0.x * Hr[0], u0.y * Hr[1], u0.z * Hr[2]), nn, V3(-Math.sin(a), 0, Math.cos(a)).applyQuaternion(q), 0.022, 0.008, pick(i % 3 ? GD.hi : GD.mid, R()), T_ARMS + 0.36, { lift: 0.002, tip: 0.0006, cell: 0, ridge: 0.14 }); }      // the rim
      for (let i = 0; i < 9; i++) { const a = (i - 4) * 0.2, nn = V3(1, 0, 0).applyQuaternion(q); stroke(arms, hp(0, Math.cos(a) * 0.058, Math.sin(a) * 0.062), nn, V3(0, -Math.sin(a), Math.cos(a)).applyQuaternion(q), 0.022, 0.014, pick(i % 2 ? GD.hi : GD.mid, R()), T_ARMS + 0.38, { lift: 0.001, tip: 0.001, cell: 0, ridge: 0.14, tilt: 1.3 }); }      // its comb
    }
    // the plumes: three ostrich feathers, each a soft quill of white touches that stands, bends over and curls at its tip
    const T_PL = 0.66, plumes = this.PL.map((pl, k) => {
      const Pt = part(pl.m), uW = under(WH), spine = (s, out) => out.set(0.105 * Math.pow(s, 1.4) - 0.02 * s * s * s, 0.13 * Math.sin(2.55 * s), 0.012 * Math.sin(3 * s + k)), a = V3(), b = V3(), tg = V3();
      // (white, and soft: its shade is a silver grey, never dark)
      const tw = (nn, r) => c1.copy(pick(WH.mid, r)).lerp(pick(WHH, (r * 5.3) % 1), 0.4).lerp(WH.hi[2], sstep(nn.dot(KEY), -0.5, 0.6)).clone();
      for (let i = 0; i < 8; i++) { const s = 0.04 + i * 0.13; spine(s, a); ball(Pt, [a.x, a.y, a.z], [0.012 - 0.0008 * i, 0.016 - 0.001 * i, 0.011 - 0.0008 * i], nw => c0.copy(uW(nw)).lerp(WH.mid[0], 0.6), T_PL + 0.05 * i, { detail: 2, dark: 0.96, shrink: 0.9 }); }
      for (let i = 0; i < 70; i++) {
        const s = 0.05 + 0.95 * Math.pow(R(), 0.8), tipk = sstep(s, 0.72, 0.95); spine(s, a); spine(Math.min(1, s + 0.03), b); tg.copy(b).sub(spine(Math.max(0, s - 0.03), b)).normalize();
        const ph = R() * TAU, u = V3(0, 0, 1).applyAxisAngle(tg, ph); if (Math.abs(u.dot(tg)) > 0.9) continue;
        const w2 = V3().crossVectors(tg, u).normalize(), round = R() < 0.25 + 0.6 * tipk, dir = u.clone().multiplyScalar(round ? 0.7 : 0.42).addScaledVector(tg, 0.8).normalize(), off = (round ? 0.01 : 0.007) + 0.012 * R();
        if (round) stroke(Pt, a.clone().addScaledVector(u, off), w2, dir, lerp(0.026, 0.036, R()), lerp(0.02, 0.028, R()), tw(world(Pt, u).clone(), R()), T_PL + 0.1 + 0.2 * s + 0.1 * R(), { tip: 0.005, ridge: 0.05, tilt: 0.5, cell: 2 });
        else stroke(Pt, a.clone().addScaledVector(u, off), w2, dir, lerp(0.04, 0.062, R()) * (1 - 0.3 * s), lerp(0.011, 0.017, R()), tw(world(Pt, u).clone(), R()), T_PL + 0.1 + 0.2 * s + 0.1 * R(), { tip: 0.007, ridge: 0.08, tilt: 0.5, bend: 0.28 * (R() < 0.5 ? 1 : -1), cell: 0 });
      }
      return Pt;
    });

    // ---------------------------------------------------------- the rig: every solid thing, one draw call
    const parts = { rock, lap, leg, torso, head, ru, rf, lu, lf, shield, wand, trunk, arms, pl0: plumes[0], pl1: plumes[1], pl2: plumes[2], b0: birds[0], b1: birds[1], b2: birds[2] };
    let total = 0; for (const p of Object.values(parts)) total += p.n;
    const LS = V3(...SHIELD.c).addScaledVector(this.SHN, 0.03).applyMatrix4(this.B), LD = this.SHN.clone().transformDirection(this.B);
    const u = this.ru = { uT: { value: 0 }, uTumble: { value: 1 }, uC: { value: -1 }, uLight: { value: 0 }, uGlow: { value: 1 }, uLS: { value: LS }, uLD: { value: LD }, uLightCol: { value: new THREE.Color(1.12, 0.98, 0.76) } };
    const rm = new THREE.MeshStandardMaterial({ vertexColors: true, color: 0x848484, map: brushPrint(), alphaTest: 0.4, roughness: 0.92, metalness: 0, emissive: 0xffffff, emissiveIntensity: 0.34, side: THREE.DoubleSide });
    rm.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, u);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec3 aCen; attribute vec4 aFly; attribute float aKind; uniform float uT, uTumble, uC, uLight; uniform vec3 uLS, uLD; varying float vBody; varying float vLit; varying float vConj;')
        .replace('#include <begin_vertex>', `#include <begin_vertex>
  {
    // a stroke: let down from under the rail to its place, slowly at the last, turning as it comes and growing as it
    // lands; a body (no flight) stays where it is and is scumbled in, thin at first (vBody, for the fragments)
    vec3 rel = transformed - aCen;
    float k = clamp((uT - aFly.w) / ${FLY.toFixed(2)}, 0.0, 1.0), fl = step(1.0e-6, dot(aFly.xyz, aFly.xyz));
    float eh = k * k * (3.0 - 2.0 * k), ev = 1.0 - (1.0 - k) * (1.0 - k);
    float s = fl > 0.5 ? (k <= 0.0 ? 0.0 : 0.3 + 0.7 * k * k) : 1.0;
    vBody = fl > 0.5 ? 1.0 : k; vConj = 0.0;
    float sg = fract(aFly.w * 37.7) > 0.5 ? 1.0 : -1.0;
    float a = (1.0 - k) * (1.0 - k) * 2.6 * uTumble * fl * sg, cs = cos(a), sn = sin(a);
    vec3 rr = vec3(cs * rel.x - sn * rel.z, rel.y, sn * rel.x + cs * rel.z);
    float b = (1.0 - k) * (0.8 + 1.3 * uTumble) * fl * sg * (0.5 + fract(aFly.w * 91.3)), cb = cos(b), sb = sin(b);
    rr = vec3(cb * rr.x - sb * rr.y, sb * rr.x + cb * rr.y, rr.z);
    transformed = aCen + rr * s + aFly.xyz * vec3(1.0 - eh, 1.0 - ev, 1.0 - eh) + vec3(0.03 * sg * sin(3.1416 * k) * fl * uTumble, 0.0, 0.0);
    if (aKind > 1.5) {
      // the light in the shield, its ground: scumbled in where it lies
      float k2 = clamp((uC - aFly.w) / 0.5, 0.0, 1.0);
      transformed = aCen + rel * step(1.0e-4, k2); vBody = k2; vConj = k2;
    } else if (aKind > 0.5) {
      // and its touches: each opens where it lies, when the light has come that far from the wand's tip
      float k2 = clamp((uC - aFly.w) / 0.7, 0.0, 1.0);
      transformed = aCen + rel * (k2 <= 0.0 ? 0.0 : 0.5 + 0.5 * (1.0 - (1.0 - k2) * (1.0 - k2)));
      vBody = 1.0; vConj = k2;
    }
    // what falls on everything else from the shield's hollow side, once it is alight
    vec3 lw = transformed, ln = objectNormal;
#ifdef USE_BATCHING
    lw = (batchingMatrix * vec4(lw, 1.0)).xyz; ln = mat3(batchingMatrix) * ln;
#endif
    lw = (modelMatrix * vec4(lw, 1.0)).xyz; ln = normalize(mat3(modelMatrix) * ln);
    vec3 lv = lw - uLS; float ld = length(lv); lv /= max(ld, 1.0e-4);
    vLit = uLight * smoothstep(-0.25, 0.5, dot(lv, uLD)) * (0.22 + 0.78 * max(0.0, -dot(ln, lv))) / (1.0 + ld * ld * 0.75);
  }`);
      // (the paint glows a little in its own colour, bristle by bristle; the light in the shield more)
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vBody; varying float vLit; varying float vConj; uniform vec3 uLightCol; uniform float uGlow;')
        .replace('#include <map_fragment>', '#include <map_fragment>\n  if (vBody < 0.999) { vec2 bq = mod(floor(gl_FragCoord.xy), 4.0); float bt = (mod(bq.x + bq.y * 2.0, 4.0) * 4.0 + mod(bq.x * 3.0 + bq.y, 4.0) + 0.5) / 16.0; if (vBody < bt) discard; }')
        .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n  totalEmissiveRadiance *= vColor.rgb;\n#ifdef USE_MAP\n  totalEmissiveRadiance *= sampledDiffuseColor.rgb;\n  totalEmissiveRadiance *= 1.0 + 0.7 * vConj * uGlow;\n  totalEmissiveRadiance += vColor.rgb * sampledDiffuseColor.rgb * uLightCol * vLit * (1.0 - vConj);\n#endif');
    };
    rm.customProgramCacheKey = () => 'tiepolo-magus';
    const rig = this.rig = L.rig(20, total + 64, rm);
    this.I = {};
    for (const [name, p] of Object.entries(parts)) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(p.pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(p.nor, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(p.col, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(p.uv, 2)); g.setAttribute('aCen', new THREE.Float32BufferAttribute(p.cen, 3)); g.setAttribute('aFly', new THREE.Float32BufferAttribute(p.fly, 4)); g.setAttribute('aKind', new THREE.Float32BufferAttribute(p.kind, 1));
      this.I[name] = rig.add(rig.geo(g)); rig.mat(this.I[name], this.V.m.multiplyMatrices(this.B, p.rest));
      p.pos = p.nor = p.col = p.uv = p.cen = p.fly = p.kind = null;
    }
    this.verts = total;

    this.buildGround(L, col);
    this.wasCalm = L.calm; this.band = this.makeScore(L);
    this.reset(L);
  },

  // ---------------------------------------------------------------- his sand, on the floor: pale and warm, dragged
  // level, a little grass at the trunk's foot; the shade under what stands on it; and the light from the shield
  buildGround(L, col) {
    const hex = k => '#' + k.getHexString();
    const sand = dragged({ size: 256, seed: 16495, n: 1300, len: [26, 84], width: [6, 16], bend: 0.12, lift: 0.08, base: hex(col('#a08c62', 0.15)),
      colors: [['#ad9a70', 4], ['#9a8458', 3], ['#bcaa82', 2.4], ['#8a7650', 2], ['#c8b890', 1.2], ['#84805a', 1.4]].map(([k, w]) => [hex(col(k, 0.15)), w]), angle: (x, y, r) => (r() - 0.5) * 0.3 });
    const u = this.gu = {
      uO: { value: this.O.clone() }, uAx: { value: new THREE.Vector4(L.tx, L.tz, L.nx, L.nz) },
      uShow: { value: new THREE.Vector4(0, 0, 0, 0) },            // how far it has run out; how much of the shade is there; the shield's light
      tSand: { value: sand }, cSand: { value: col('#a8946a', 0.15) }, cSandD: { value: col('#7c6c48', 0.15) }, cGrass: { value: col('#5c6a3e', 0.15) }, cWarm: { value: new THREE.Color(1.0, 0.84, 0.58) },
      uSh: { value: [[-0.22, 0.37, 0.4, 0.5], [0.02, 0.48, 0.26, 0.36], [0.7, 0.44, 0.2, 0.44], [0.41, 0.66, 0.26, 0.4], [-0.44, 0.64, 0.24, 0.34], [-0.18, 0.62, 0.19, 0.4]].map(a => new THREE.Vector4(a[0] * SC, a[1] * SC, a[2] * SC, a[3])) },
      uPool: { value: new THREE.Vector4(0.06 * SC, 0.62 * SC, 0, 0) },
    };
    const m = this.groundM = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false, fog: false });
    m.onBeforeCompile = s => {
      Object.assign(s.uniforms, u);
      s.fragmentShader = s.fragmentShader
        .replace('#include <common>', `#include <common>
uniform vec3 uO, cSand, cSandD, cGrass, cWarm; uniform vec4 uAx, uShow, uSh[6], uPool; uniform sampler2D tSand;
float bH(vec2 p) { p = fract(p * vec2(127.1, 311.7)); p += dot(p, p + 19.19); return fract(p.x * p.y); }
float bN(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(bH(i), bH(i + vec2(1.0, 0.0)), f.x), mix(bH(i + vec2(0.0, 1.0)), bH(i + vec2(1.0, 1.0)), f.x), f.y); }
vec3 fCol; float fA;`)
        .replace('#include <map_fragment>', `#include <map_fragment>
{
  vec2 lq = lifeP.xz - uO.xz, st = vec2(dot(lq, uAx.xy), dot(lq, uAx.zw)); float su = st.x, so = st.y;
  float n1 = bN(st * 2.3 + 1.7), n2 = bN(st * 7.0 + 4.7), n3 = bN(st * 21.0 + 2.0);
  vec4 sd = texture2D(tSand, st * vec2(0.85, 1.4));
  // it runs out from the foot of the wall, a drag of paint at a time; no brim: it thins to the bare floor
  float rev = uShow.x * 2.3 - so - (n1 - 0.5) * 0.4 - (n2 - 0.5) * 0.12 - 0.1;
  if (rev < 0.0) discard;
  vec2 e = (st - vec2(0.11, 0.5)) / vec2(1.26, 0.78); float ea = atan(e.y, e.x);
  float wd = 1.0 - length(e) * (1.0 + 0.09 * sin(3.0 * ea + 0.6) + 0.05 * sin(7.0 * ea + 2.0)) - (n1 - 0.5) * 0.34 - (n2 - 0.5) * 0.14 - (n3 - 0.5) * 0.05;
  // (its edge is the ends of the strokes it is dragged in: each stops where its own luck says)
  float sand = smoothstep(0.0, 0.2, wd + (sd.a - 0.6) * 0.3);
  vec3 c = mix(cSandD, cSand, 0.3 + 0.7 * n1); c = mix(c, sd.rgb, 0.6) * (0.44 + 0.2 * n2);
  // grass, thin and grey-green, at the trunk's foot and under the rock's edge
  float gr = smoothstep(0.42, 0.78, bN(st * 3.1 + 7.0) * 0.7 + 0.3 * n2) * max(smoothstep(0.3, 0.8, su) * smoothstep(1.1, 0.5, so), 0.6 * smoothstep(-0.2, -0.7, su) * smoothstep(0.9, 0.5, so));
  c = mix(c, cGrass * (0.6 + 0.7 * sd.g), 0.6 * gr);
  // the shade of what stands on it
  float shd = 0.0; for (int i = 0; i < 6; i++) { vec2 q = (st - uSh[i].xy) / uSh[i].z; shd = max(shd, uSh[i].w * exp(-dot(q, q) * 1.6)); }
  c *= 1.0 - shd * uShow.y;
  // and the light the shield gives, across it to the right
  vec2 lp = (st - uPool.xy) / vec2(0.78, 0.5); float pool = uShow.z * exp(-dot(lp, lp)) * smoothstep(-0.5, 0.1, su - uPool.x + 0.4);
  c += cWarm * pool * 0.2 * (0.6 + 0.6 * sd.g);
  fCol = c; fA = sand * 0.97 * smoothstep(0.0, 0.16, rev);
  if (fA < 0.004) discard;
}`)
        .replace('#include <opaque_fragment>', '  outgoingLight = fCol; diffuseColor.a = fA;\n#include <opaque_fragment>');
    };
    m.customProgramCacheKey = () => 'tiepolo-magus-ground';
    m.sandTex = sand;                                 // (so it is let go with the material)
    const g = new THREE.PlaneGeometry(3.3, 2.0); g.rotateX(-Math.PI / 2);
    const mesh = this.ground = new THREE.Mesh(g, m); L.floor(U0 + 0.1, 0.92, mesh.position); mesh.position.y += 0.012; mesh.rotation.y = L.yawOut; mesh.renderOrder = 5;
    L.add(mesh);
  },

  // ---------------------------------------------------------------- the sound
  makeScore(L) {
    const s = score(L), calm = L.calm;
    s.hit(0.05, { d: 1.7, vol: 0.008, lp: 1700, hp: 300, attack: 0.5 });      // the brush, laying it all in
    // the wand touches the shield: a small clear note, and a breath as the light opens
    s.hit(T_TOUCH - 0.01, { d: 0.05, vol: calm ? 0.004 : 0.008, hp: 1800, lp: 6000, attack: 0.002 });
    s.note(T_TOUCH, 880, 2.4, { type: 'sine', vol: calm ? 0.012 : 0.02, attack: calm ? 0.06 : 0.008, over: 2, overVol: 0.22 });
    s.note(T_TOUCH + 0.02, 1318.5, 1.8, { type: 'sine', vol: 0.006, attack: 0.05 });
    s.hit(T_TOUCH + 0.05, { d: 1.8, vol: 0.006, lp: 1100, hp: 240, attack: 0.9 });
    // the Largo: the upper strings' soft pulse first, the solo violin over it; again after a silence, for as long as you look
    const n0 = s.ev.length;
    LARGO.forEach(([mel, vol, type, legato], i) => s.tune(mel, 0, 60 / E8, { vol: vol * (calm ? 0.85 : 1), type, legato, attack: i ? 0.03 : calm ? 0.07 : 0.03, ...(i ? {} : { over: 2, overVol: 0.1 }) }));
    s.loop(T_TUNE, ROUND, s.ev.splice(n0));
    return s.done();
  },

  // ---------------------------------------------------------------- his pose
  // A two-bone arm from shoulder S to hand T (scene measure): the elbow towards `pole`. Fills the two bones' matrices
  // (each runs along its own +y).
  arm(S, T, pole, M1, M2) {
    const V = this.V, d = V.d.copy(T).sub(S), len = d.length(), dist = Math.max(L2 - L1 + 0.01, Math.min(L1 + L2 - 0.003, len)); d.multiplyScalar(1 / Math.max(1e-5, len));
    const a = (L1 * L1 - L2 * L2 + dist * dist) / (2 * dist), h = Math.sqrt(Math.max(0, L1 * L1 - a * a));
    const p1 = V.p1.copy(pole).addScaledVector(d, -pole.dot(d)).normalize();
    const E = V.el.copy(S).addScaledVector(d, a).addScaledVector(p1, h), tip = V.t.copy(S).addScaledVector(d, dist);
    M1.compose(S, V.q.setFromUnitVectors(V.up, V.p2.copy(E).sub(S).normalize()), V.one);
    M2.compose(E, V.q.setFromUnitVectors(V.up, V.p2.copy(tip).sub(E).normalize()), V.one);
  },
  // Everything of his that moves, into this.M. o: kW (the wand, from his knee to over the shield), kT (the last of the
  // way down onto it), kH (his head, from the shield round to the young man), breath, trace (the tip going along the
  // light), lift and sway (the plumes).
  pose(o) {
    const V = this.V, M = this.M;
    const eul = (m, x, y, z, yaw, pitch, roll) => m.compose(V.pos.set(x, y, z), V.q.setFromEuler(V.e.set(pitch, yaw, roll, 'YXZ')), V.one);
    const kH = o.kH;
    const lean = o.kW * (1 - kH);      // (he bends a little to the shield as the wand comes over it)
    eul(M.torso, WAIST[0], WAIST[1], WAIST[2], TORSO.yaw + 0.05 * (kH - 1) - 0.05 * lean, TORSO.pitch + 0.012 * o.breath + 0.03 * lean, TORSO.roll - 0.03 * (kH - 1));
    eul(V.l, NECK[0], NECK[1], NECK[2], lerp(HA.yaw, HB.yaw, kH), lerp(HA.pitch, HB.pitch, kH) - 0.05 * Math.sin(Math.PI * kH), lerp(HA.roll, HB.roll, kH));
    M.head.multiplyMatrices(M.torso, V.l).scale(V.b.setScalar(1.1));
    // his right hand on the top of the shield
    this.arm(V.s.set(...SH_R).applyMatrix4(M.torso), this.GRIP, V.w.set(-0.2, -0.8, -0.5), M.ru, M.rf);
    // the wand: from across his knee, up and over, and down onto the shield, slowly at the last
    const arc = Math.sin(Math.PI * o.kW);
    const tip = V.tip.set(...TIP0).lerp(V.a.copy(this.TOUCH).addScaledVector(this.SHN, 0.035).add(V.b.set(0, 0.022, 0)), o.kW); tip.y += 0.07 * arc; tip.z += 0.03 * arc;
    tip.lerp(V.a.copy(this.TOUCH).addScaledVector(this.TRACE, o.trace), o.kT);
    const hand = V.h.set(...HAND0).lerp(V.a.set(...HANDN), o.kW); hand.y += 0.035 * arc + 0.002 * o.breath; hand.addScaledVector(this.TRACE, 0.5 * o.trace * o.kT);
    const D = V.c.copy(tip).sub(hand).normalize(); hand.copy(tip).addScaledVector(D, -WL);
    M.wand.compose(hand, V.q.setFromUnitVectors(V.up, D), V.one);
    this.arm(V.s.set(...SH_L).applyMatrix4(M.torso), hand, V.w.set(0.7, -0.6, 0.15), M.lu, M.lf);
    // the plumes
    // the birds in the shield's sky: each crosses it slowly, level, beating its wings a little (o.birds: how far over each is, 0 to 1; shown or not)
    if (this.BIRD) for (let i = 0; i < 3; i++) {
      const q = o.birds[i], k = o.sky * Math.pow(Math.sin(Math.PI * q), 0.4) * (1 - 0.14 * i), x = lerp(-0.088, 0.088, q) * (i === 1 ? -1 : 1), y = 0.1 + 0.022 * i - 0.012 * i * i + 0.008 * Math.sin(q * 9 + i * 2) + this.BIRD.slope * x;
      M['b' + i].copy(this.SHM).multiply(V.l.compose(V.pos.set(x, y, this.BIRD.z(y)), V.q.setFromAxisAngle(V.a.set(0, 0, 1), 0.2 * Math.sin(q * 11 + i)), V.b.set(k * (i === 1 ? -1 : 1), k * (0.75 + 0.5 * o.flap[i]), k)));
    }
    for (let i = 0; i < 3; i++) { const pl = this.PL[i]; M['pl' + i].compose(pl.p, V.q.setFromEuler(V.e.set(pl.pitch + 0.05 * o.sway[i], pl.yaw, pl.roll + 0.26 * o.lift * (1 - 0.2 * i) + 0.06 * o.sway[i], 'YXZ')), V.b.setScalar(pl.s)); }
  },

  hide() { if (!this.rig) return; this.rig.mesh.visible = false; this.groundM.visible = false; },
  start(L, resumed) {
    if (this.wasCalm !== L.calm) { this.wasCalm = L.calm; this.band = this.makeScore(L); }      // (the setting may have changed since it was built)
    this.band.from(L.t);
  },
  back(L) { this.S0.t = L.t; },
  end() { this.hide(); },
  reset() { this.hide(); this.told = false; },

  update(L, dt) {
    const ph = L.phase, showing = ph === 'wake' || ph === 'play', back = ph === 'return';
    if (!showing && !back) { this.hide(); return; }
    const calm = L.calm, V = this.V, r = back ? L.ret : 0, t = showing ? L.t : this.S0.t, time = showing ? L.t : this.S0.t + r * L.retDur;
    // ---- how much of it is laid in (going back, the strokes lift off again the way they came)
    const c = showing ? Math.min(t, BUILT + 1) : Math.min(t, BUILT) * (1 - ease.inOut(ramp(r, 0.28, 1)));
    // ---- the light: kindled at the touch, going over the shield from the wand's tip, and out across the sand
    const slow = calm ? 0.6 : 1, out = 1 - ease.smooth(ramp(r, 0, 0.3));
    const uC = Math.min((t - T_TOUCH) * slow, 2.4) * out - 0.3 * (1 - out);
    const light = ease.smooth(ramp(t, T_TOUCH + 0.1, T_TOUCH + (calm ? 2.8 : 1.8))) * out * (1 + (calm ? 0 : 0.05 * Math.sin(time * 0.9)));
    // ---- his pose
    const o = this.IDLE;
    o.kW = ease.inOut(ramp(t, T_LIFT, T_HOVER)); o.kT = ease.smooth(ramp(t, T_HOVER + 0.04, T_TOUCH));
    o.kH = ease.inOut(ramp(t, T_TURN, T_TURN + TURN_D));
    o.breath = Math.sin(time * 1.5);
    o.trace = 0.03 * Math.sin((t - T_TOUCH - 2.6) * 0.5) * ease.smooth(ramp(t, T_TOUCH + 2.6, T_TOUCH + 4.2)) * (calm ? 0.5 : 1);
    o.lift = ease.inOut(ramp(t, T_TOUCH + 0.8, T_TOUCH + 2.0)) * out;
    for (let i = 0; i < 3; i++) o.sway[i] = (calm ? 0.25 : 1) * Math.sin(time * (1.1 + 0.23 * i) + i * 1.9) * (0.3 + 0.7 * o.lift);
    o.sky = ease.smooth(ramp(uC, 1.5, 2.3));
    for (let i = 0; i < 3; i++) { const tb = Math.max(0, t - T_TOUCH - 1.4) * (calm ? 0.5 : 1); o.birds[i] = (0.3 + 0.27 * i + tb / (15 + 4 * i)) % 1; o.flap[i] = calm ? 0 : Math.sin(tb * (5.2 + 0.7 * i) + i * 2); }
    this.pose(o);
    // ---- into the rig
    const rig = this.rig, I = this.I, B = this.B, M = this.M, U = this.ru;
    rig.mesh.visible = c > 0.03; U.uT.value = c; U.uTumble.value = calm ? 0 : 1; U.uC.value = uC; U.uLight.value = light; U.uGlow.value = 0.55 + 0.45 * light;
    for (const n of ['torso', 'head', 'ru', 'rf', 'lu', 'lf', 'wand', 'pl0', 'pl1', 'pl2', 'b0', 'b1', 'b2']) rig.mat(I[n], V.m.multiplyMatrices(B, M[n]));
    // ---- the ground
    const G = this.gu, spread = ease.out(ramp(t, 0, 1.3)) * (1 - ease.inOut(ramp(r, 0.6, 1)));
    G.uShow.value.set(spread, ease.smooth(ramp(c, 0.3, 1.7)), light, 0); this.groundM.visible = spread > 0.002;
    if (showing) this.band.play(L.t);
    L.voice().level = calm ? 0.8 : 1; L.voice().place();
    if (showing && !this.told && !L.quiet && t > T_TOUCH + 0.3) { this.told = true; L.k.say('The magician lays his wand on the shield, as he does in the picture. Here the shield fills with the light of the far shore, and he turns to where the young man stands.', 5.5); }
    if (back && L.ret >= 1) this.hide();
  },
});
