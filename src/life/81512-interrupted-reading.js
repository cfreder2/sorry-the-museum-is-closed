// Jean Baptiste Camille Corot, Interrupted Reading (c. 1870), Gallery 224. The word: pause.
//
// A studio model in the Italian dress he kept for his sitters sits by a table under a red cloth, her head propped on her
// hand, a red book hanging shut from the other over her knee, and looks straight out of the picture. The museum's note
// says the image of a woman reading was a popular one, "but Corot chose to show his model pausing, looking up from this
// activity". So the title is about something the picture does not show: a moment ago she was reading. And whatever
// stopped her stands where we stand. No other picture here is about being looked at in quite this way, so that is the
// show: the reading the picture leaves out, and the look that ends it, which is yours.
//
// Look, and she is laid in under the picture as he built her, in masses, from the floor up (the museum: "the human form
// as a construction of masses that support and balance one another"): his strokes come down from under the frame,
// leaning as leaves do, and settle into the great ochre skirt with its deep folds, the red cloth of the table, the dark
// bodice, the white chemise, the arms, the head, the dark hair, and last the five touches of coral in it. She is
// reading: bent over the book where it lies open on the table, a leaf turned once. A piano plays, quietly, because
// reading has a voice only the reader hears: the opening of Chopin's Prelude in A major. Then, in the middle of its
// second phrase, the tune breaks off, on the short note before the one it was going to. She is quite still. Then her
// head comes up and round to you, her shoulders after it; her hand draws the book off the table, shut on her finger,
// down over her knee; her other hand comes up to her temple, and her head leans over and settles into it, her earrings
// still swinging: the picture, and the eye goes up to check it against the one on the wall. There she stays for as
// long as you look, in the silence, as she has since about 1870. When you stop looking she bends to the book again,
// and the tune takes up its phrase at the very note where it stopped. While the toy stays near she reads on and the
// prelude plays on to its end; drive up close and she looks up at the toy, and the music waits again; back off and she
// finds her place. Then her strokes lift off and go back in under the frame.
//
// The tune: Frédéric Chopin, Prelude in A major, Op. 28 No. 7 (Andantino; published in Paris in 1839, the French
// edition dedicated to Camille Pleyel), set down here from the Mutopia Project's edition of the score, all sixteen
// bars, the left hand thinned to its bass and two notes of each chord. It has no words and no programme; it is the
// shortest of the set, in the manner of a mazurka, and has been borrowed since for variations (Mompou; Noskowski) and
// a ballet (Les Sylphides), nothing that sits ill here. It is Paris piano music of the painter's own lifetime, chosen
// because each of its phrases ends on a held chord the ear waits for, so that a phrase cut short is heard as cut short.
//
// How she is made: of paint, with no bare form showing. Under everything is a core a little smaller and darker than
// the form (the skirt, the cloth and her body are lofted, with real folds, shaded in their hollows; her arms taper;
// her shoulders slope into her neck), and what the eye sees is his strokes lying over it: every mark a ribbon with a
// brush's own print on it (bristles, a ragged dry end, gaps where the paint ran out), tilted a little about its
// length so that the strokes overlap as feathers do and the edge of every form is their ragged ends, found and lost.
// The colour is broken and close in tone: ochre, straw and grey-green in the skirt, whites and silver greys in the
// chemise, the reds of the cloth worn pale on its top, skin in long soft touches. Her face has no drawn features: it
// is planes of light and shade, each a small touch that takes its tone from where it lies (the shade her eyes lie in,
// the cheek turned to his light, the far side lost, a mouth barely there), so it holds from the toy's eye. She is
// about seven and a half heads. One rig, one draw call, for all of it (the strokes are flown in by the vertex shader
// and the cores scumbled in under them), and one for the soft shadows on the floor. Her arms are worked out each
// frame (two bones each; her right elbow rests and slides on the table top). She and her table are soft to the toy:
// it is eased round them, never stopped dead and never through her. She sits 0.63 m high, half a metre out from the
// wall, under a picture whose foot is 1.2 m up and which has no neighbour within four metres: from none of the
// checks' cameras does anything of hers come in front of a canvas.
// With "Reduce motion and flashing" on, her strokes do not tumble as they come, she looks up and bends down again more
// slowly, her earrings barely swing, and the book and its leaf are quieter; nothing here flashes.
//
// What it does not do: it gives her no name, no thoughts and no reason for stopping (the museum gives none; the caption
// says only that she looks up for as long as you look), it puts no words on the page (a few grey touches for print) and
// no title on the book, it plays nothing Italian under the dress, because the dress is a studio costume and not a
// people, and its figure wears the chemise high on both shoulders and keeps her face to planes of light and shade,
// because she was a working model and this is her picture, not her likeness.
import * as THREE from 'three';
import { lifeFor, ease, ramp, clamp01, lerp, shape } from '../paintlife.js';
import { score, noise } from './stagecraft.js';

const TAU = Math.PI * 2;
const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const sstep = THREE.MathUtils.smoothstep, fall = (x, a, b) => 1 - sstep(x, a, b);      // (fall: 1 below a, 0 above b)

// ---------------------------------------------------------------- the tune, and where it breaks off
// Chopin, Prelude Op. 28 No. 7: eight two-bar phrases, each with its up-beat (a crotchet is 1).
const TOP = ['E4 | C#5:.75 D5:.25 B4 B4 | B4:2', 'F#5 | D#5:.75 E5:.25 A5 A5 | A5:2', 'C#5 | A#4:.75 B4:.25 D5 D5 | D5:2', 'G#4 | G#4:.75 A4:.25 C#5 C#5 | C#5:2',
  'E4 | C#5:.75 D5:.25 B4 B4 | B4:2', 'F#5 | D#5:.75 E5:.25 C#6 C#6 | C#6:2', 'C#5 | C#5:.75 D5:.25 F#5 F#5 | F#5:2', 'G#4 | B4:.75 A4:.25 A5 A5 | A5:2'].join(' ');
const MID = ['R | R G#4 G#4 | G#4:2', 'D5 | B#4:.75 C#5:.25 C#5 C#5 | C#5:2', 'E4 | C#4:.75 D4:.25 F#4 F#4 | F#4:2', 'D4 | D4:.75 C#4:.25 C#4 C#4 | C#4:2',
  'R | G#4 G#4 G#4 | G#4:2', 'D5 | B#4:.75 C#5:.25 A5 A5 | A#5:2', 'A#4 | A#4:.75 B4:.25 B4 A4 | G#4:2', 'D4 | D4:.75 C#4:.25 C#5 C#5 | C#5:2'].join(' ');
const LOW = ['R | R D4 D4 | D4:2', 'R | R:3 | R:2', 'R | R:3 | R:2', 'R | R:3 | R:2', 'R | R D4 D4 | D4:2', 'R | R:3 | E5:2', 'R | R:3 | R:2', 'R | R:3 | R:2'].join(' ');
const BASS = ['R | E2:3 | R:2', 'R | A2:3 | R:2', 'R | E2:3 | R:2', 'R | A1:3 | R:2', 'R | E2:3 | R:2', 'R | A2:3 | R:2', 'R | B1:3 | R:2', 'R | A1:3 | R:2'].join(' ');
const CH1 = ['R | R E3 E3 | E3:2', 'R | R A3 A3 | A3:2', 'R | R E3 E3 | E3:2', 'R | R E3 E3 | E3:2', 'R | R E3 E3 | E3:2', 'R | R A3 A3 | F#3:2', 'R | R F#3 F#3 | E3:2', 'R | R E3 A3 | A3:2'].join(' ');
const CH2 = ['R | R E4 E4 | E4:2', 'R | R E4 E4 | E4:2', 'R | R B3 B3 | B3:2', 'R | R A3 A3 | A3:2', 'R | R E4 E4 | E4:2', 'R | R E4 E4 | C#4:2', 'R | R D4 D4 | D4:2', 'R | R E4 E4 | E4:2'].join(' ');
const BPM = 88, BT = 60 / BPM, T_M0 = 0.1;                  // the first up-beat, in seconds of reading
const bar = k => T_M0 + BT + k * 3 * BT;                    // the downbeat of bar k (from 0)
const RB = bar(2) + 0.75 * BT + 0.08;                       // where the reading breaks off: just after the short note of the third bar
const T_END = T_M0 + 48 * BT + 2.5;                         // the prelude is over
const TURN0 = 2.55, TURN_D = 0.85, TURN_EVERY = 12 * BT;    // a leaf turned into the first held chord, and every two phrases after
const BUILT = 2.05, FLY = 0.5;                              // she is all there; one stroke's flight
const STILL = 0.28, RISE = 1.35, FALL = 1.0;                // quite still; then looking up (to the picture's pose); and bending to the book again

// ---------------------------------------------------------------- the scene (metres: x along the wall to the right, y up, z out of the wall)
const SC = 1.25, U0 = 0.1, ZS = 0.04;                       // its size; its middle along the wall; how far its z = 0 lies inside the wall
const DIR = [-0.5, 0.866];                                  // the way her knees point: to the left, and out
const HIP = [0.06, 0.4];                                    // where she sits (x, z)
const WAIST = [0.055, 0.238, 0.405];
const BW = 0.062, BH = 0.092, BTH = 0.0105;                 // the book: a leaf's width, its height, half its thickness
const TABLE = { x: -0.29, z: 0.43, rx: 0.16, rz: 0.16, y: 0.272 };
const SOFT = [[0.04, 0.47, 0.24], [TABLE.x, TABLE.z, 0.19]];           // what the toy is eased round: her skirt, her table (x, z, reach)
const L1 = 0.128, L2 = 0.142;                               // upper arm; forearm to the middle of the hand
const NECK = [0, 0.158, 0.004], SH_R = [-0.078, 0.124, 0.004], SH_L = [0.078, 0.124, 0.004];
const TEMPLE = [-0.046, 0.05, 0.026];                       // where her hand meets her head (the head's own frame)
const EAR = [0.0345, 0.04, -0.002], HEAD_S = 1.0;
// reading (A) and the picture's pose (B): her body from the waist (yaw, pitch forward, roll to her right), her head on her neck
const TA = { yaw: -0.6, pitch: 0.24, roll: 0.26 }, TB = { yaw: -0.2, pitch: 0.09, roll: 0.4 };
const HA = { yaw: -0.4, pitch: 0.5, roll: 0.04 }, HB = { yaw: 0.22, pitch: -0.1, roll: 0.13 };
// the book: its spine's middle, and the way it lies (x across the leaves to her right, y up the page, z out of the open page)
const BOOK_A = { p: [-0.158, TABLE.y + BTH + 0.001, 0.5], x: [-0.42, 0, -0.9], y: [-0.9, 0, 0.42] };
const BOOK_B = { p: [-0.02, 0.2, 0.59], x: [-0.1, 0.3, 0.95], y: [0.826, 0.504, -0.252] };
const OPEN_A = 2.9, OPEN_B = 0.2;                           // the angle between its boards
const HAND_L_A = [-0.05, -0.03, 0.01], HAND_L_B = [0.0, BH / 2 + 0.006, 0.03];       // her left hand on the book (the book's frame)
const HAND_R_A = [0.036, 0.012, 0.012], HAND_R_TURN = [0.008, 0.012, 0.042];          // her right, at its edge; and turning a leaf

// A brush's own print, for every mark: two drags (bristle lines, fuller in the middle, ragged at both ends, the second
// run dry), a soft round touch, and a plain patch for the bodies under them. Its colour is only the bristles' light and
// dark (never black, so a mark's edge does not go dark); its alpha is the mark's shape.
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

lifeFor(81512, {
  title: /^Interrupted Reading/,
  word: 'pause',
  // (a small work hung high: the kit keeps all of it in view, over the reader at the foot of the wall)
  stage: { out: 1.2, half: 0.9, cam: { dist: 2.3, height: 0.8, side: 0.2, fov: 58, lookU: 0.02, lookOut: 0.4, lookH: 0.9, floorOut: 0.85 } },
  wake: 2, ret: 2.4,
  linger: { near: 4, max: 34 },

  build(L) {
    const P = L.pal, col = (h, a = 0.14) => P.near(h, a), C = (list, a) => list.map(h => col(h, a));
    const WALL = L.wall, RAIL = (L.rail - L.y) / SC, XS = -U0 / SC;      // (XS: under the middle of the frame)
    this.O = L.floor(U0, -WALL - ZS);
    this.B = new THREE.Matrix4().makeBasis(V3(L.tx * SC, 0, L.tz * SC), V3(0, SC, 0), V3(L.nx * SC, 0, L.nz * SC)).setPosition(this.O);
    this.V = { m: new THREE.Matrix4(), l: new THREE.Matrix4(), q: new THREE.Quaternion(), e: new THREE.Euler(0, 0, 0, 'YXZ'), one: V3(1, 1, 1), up: V3(0, 1, 0),
      a: V3(), b: V3(), c: V3(), d: V3(), p1: V3(), p2: V3(), el: V3(), s: V3(), t: V3(), pos: V3(), w: V3(), z: V3(0, 0, 1) };
    this.M = {}; for (const n of ['torso', 'head', 'ru', 'rf', 'lu', 'lf', 'book', 'bkR', 'bkL', 'leaf', 'earR', 'earL']) this.M[n] = new THREE.Matrix4();
    const frame = (o, q) => { const x = V3(...o.x).normalize(), y = V3(...o.y); y.addScaledVector(x, -y.dot(x)).normalize(); return q.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, V3().crossVectors(x, y))); };
    this.QA = frame(BOOK_A, new THREE.Quaternion()); this.QB = frame(BOOK_B, new THREE.Quaternion());
    this.PA = V3(...BOOK_A.p); this.PB = V3(...BOOK_B.p);
    this.IDLE = { scan: 0, nod: 0, turn: -1, gazeY: 0, gazeP: 0, breath: 0, sway: 0, earR: 0, earL: 0 };
    this.pose(0, this.IDLE);

    const R = () => L.rand();
    const KEY = V3(-0.5, 0.74, 0.45).normalize();           // his light: from the upper left, a little in front
    const pick = (list, r) => list[Math.min(list.length - 1, Math.floor(r * list.length))];
    const set = (hi, mid, lo, deep, a) => ({ hi: C(hi, a), mid: C(mid, a), lo: C(lo, a), deep: C(deep, a) });
    const SK = set(['#c8b486', '#c1ab7c', '#ccb98e'], ['#ae9b70', '#a69368', '#b2a076'], ['#8a7954', '#82714e', '#8e7e5c'], ['#655638', '#5c4e34']);       // the skirt
    const RD = set(['#93503c', '#8c4936'], ['#763a2c', '#703428', '#7a3c2d'], ['#54251a', '#4c2017'], ['#34160f', '#2e130d']);                             // the cloth, the book's boards
    const DK = set(['#52423a', '#4a3a33'], ['#392b25', '#33261f'], ['#261b16', '#221813'], ['#17100d']);                                                   // the bodice
    const WH = set(['#e8e2d4', '#e1dacb', '#ece7dc'], ['#d2cabb', '#cac2b3', '#d5cdbd'], ['#beb6a9', '#b6aea1', '#c1b8a8'], ['#aaa296', '#a29a8e']);       // the chemise
    const FL = set(['#e2c2a2', '#dfbc9a'], ['#d4ae8c', '#cfa886', '#d2ac8a'], ['#c49c7c', '#be9676'], ['#b08a6c', '#a88264']);                             // her skin
    const HR = set(['#54402f', '#4a3729'], ['#36271d', '#30221a'], ['#231812', '#1f1510'], ['#150e0a']);                                                   // her hair
    const PG = set(['#efe6d0', '#e9dfc6'], ['#d9cdae', '#d2c5a6'], ['#b0a284', '#a89a7c'], ['#857860']);                                                   // the leaves
    const GD = set(['#e6c878', '#dcb860'], ['#c49a48', '#b88c3e'], ['#8e6a2e'], ['#644a22']);
    // the broken colour of each mass: what a stroke may lean to, away from the tone of the form it lies on
    const SKH = C(['#cdbb8a', '#b7a878', '#9d9a74', '#8c8c6a', '#c2b084', '#a69a70', '#d6c79c', '#94906a'], 0.1);       // ochre, straw, grey-green
    const WHH = C(['#f4f0e6', '#dedfdb', '#c6cacb', '#e8dec9', '#b9bec2', '#ead8c8', '#f0ece0'], 0.06);                // whites, silver greys, a warm one
    const RDH = C(['#904a36', '#7a3a2c', '#9c5c46', '#6a3026', '#86523f', '#5e2a22'], 0.1);
    const DKH = C(['#3a2c26', '#2c211c', '#4a3a32', '#2c2624'], 0.1), HRH = C(['#2c2019', '#3a2a20', '#241a14', '#46342a'], 0.1), FLH = C(['#e2c0a0', '#d8b494', '#e8caac', '#d0a686', '#dcb89a'], 0.1);
    const WORN = C(['#9c604a', '#a66a52', '#8e523e', '#aa7258'], 0.1), HOLLOW = col('#66603f', 0.1), HAIR_LIT = C(['#6a4e38', '#7a5c44', '#5c4432'], 0.1);
    const CORAL = C(['#dc4c30', '#d04328', '#e25a3a'], 0.08), CORAL_HI = col('#f08a68', 0.05);
    const BEAD = C(['#eeeae2', '#dcdcd6', '#f4f2ec'], 0.06), PINK = C(['#cc7068', '#b85c56'], 0.1), ROSE = col('#b46a60', 0.1), SOCK = col('#96705a', 0.12), LOST = col('#9a745c', 0.12), EYE = col('#5a4236', 0.12), CHEEK = col('#dc9c86', 0.08);
    // The tone of a form where it faces his light (lights, half tones, shade, dark, run smoothly into each other: his
    // forms are soft); and a stroke on it: that tone, leaning to one of the mass's own colours, a little of the luck of the brush.
    const under = S => { const c = new THREE.Color(); return n => { const k = n.dot(KEY); return c.copy(S.deep[0]).lerp(S.lo[0], sstep(k, -0.75, -0.3)).lerp(S.mid[0], sstep(k, -0.25, 0.2)).lerp(S.hi[1 % S.hi.length], sstep(k, 0.25, 0.75)).multiplyScalar(0.98); }; };
    const mixer = (S, hues, amt = 0.4, v = 0.14) => {
      const u = under(S), ref = S.mid[0], c = new THREE.Color();
      return (n, r) => { const h = pick(hues, (r * 7.31) % 1), a = amt * (0.4 + 1.2 * ((r * 3.17) % 1)), k = 1 + (r - 0.5) * v, f = (x, y) => lerp(1, Math.max(0.6, Math.min(1.5, x / Math.max(0.02, y))), a) * k; c.copy(u(n)); return new THREE.Color(c.r * f(h.r, ref.r), c.g * f(h.g, ref.g), c.b * f(h.b, ref.b)); };
    };

    // ---------------------------------------------------------- parts: bodies and the strokes on them
    // A part is one piece of the rig (it moves as one). Every vertex carries where its stroke's middle is (aCen) and how
    // the stroke comes (aFly: from where, relative to its place, and when), so the vertex shader can bring them down
    // from under the rail; a body grows up from its foot instead.
    const part = rest => { rest = rest ? rest.clone() : new THREE.Matrix4(); return { pos: [], nor: [], col: [], uv: [], cen: [], fly: [], rest, inv: rest.clone().invert(), n: 0 }; };
    const side = V3(), d2 = V3(), cl = V3(), src = V3(), wp = V3(), nW = V3(), ca = new THREE.Color(), cb = new THREE.Color();
    const vert = (Pt, p, n, c, uv, cen, f) => { Pt.pos.push(p.x, p.y, p.z); Pt.nor.push(n.x, n.y, n.z); Pt.col.push(c.r, c.g, c.b); Pt.uv.push(uv[0], uv[1]); Pt.cen.push(cen.x, cen.y, cen.z); Pt.fly.push(f[0], f[1], f[2], f[3]); Pt.n++; };
    const world = (Pt, n) => nW.copy(n).transformDirection(Pt.rest);      // (a part's normal as it stands while she reads: his light is the room's)
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
    const ribbon = (Pt, Ps, Ns, w, c, t, { lift = 0.0018, tip = 0.004, ridge = 0.06, cell = -1, tilt = 0.34 } = {}) => {
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
      src.set(XS + Math.max(-0.2, Math.min(0.2, (wp.x - XS) * 0.45)) + (R() - 0.5) * 0.08, RAIL - 0.03 - R() * 0.04, ZS + 0.012 + R() * 0.02).applyMatrix4(Pt.inv);
      const f = [src.x - mid.x, src.y - mid.y, src.z - mid.z, t == null ? when(0.3, 0.4, wp.y) : t];
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
        if (keep && !keep(p, nn)) continue;
        const d = along(u0, flow.clone().applyQuaternion(qi), jit), len = lerp(l[0], l[1], r1), Ps = [], Ns = [];
        for (let k = 0; k < 6; k++) { const al = (k / 5 - 0.5) * len / Rm, u = u0.clone().multiplyScalar(Math.cos(al)).addScaledVector(d, Math.sin(al)); Ps.push(V3(u.x * Rd[0] * grow, u.y * Rd[1] * grow, u.z * Rd[2] * grow).applyQuaternion(q).add(c)); Ns.push(V3(u.x / Rd[0], u.y / Rd[1], u.z / Rd[2]).normalize().applyQuaternion(q)); }
        ribbon(Pt, Ps, Ns, lerp(w[0], w[1], r2), tn(world(Pt, nn).clone(), r3, nn), when(t0, span, yOf(Pt, p)), o);
      }
    };
    // A limb along the part's own +y: prof = [[radius, y], ...] from its root, rounded off at both ends; a few soft strokes down it.
    const tube = (Pt, prof, S, t0, n, tn, { w = [0.012, 0.018], l = [0.03, 0.05], shrink = 0.86, dark = 0.84, ...o } = {}) => {
      const u0 = under(S), u = nn => dk.copy(u0(nn)).multiplyScalar(dark), y0 = prof[0][1], y1 = prof[prof.length - 1][1], rAt = y => { for (let i = 1; i < prof.length; i++) if (y <= prof[i][1]) return lerp(prof[i - 1][0], prof[i][0], (y - prof[i - 1][1]) / (prof[i][1] - prof[i - 1][1])); return prof[prof.length - 1][0]; };
      const fine = []; for (let i = 0; i <= 14; i++) { const y = lerp(y0, y1, i / 14); fine.push([rAt(y) * shrink, y]); }
      solid(Pt, shape.lathe(fine, 18, 0xffffff), V3(0, y0, 0), t0 + 0.1, nn => u(nn));
      for (const [r, y] of [prof[0], prof[prof.length - 1]]) solid(Pt, shape.move(shape.ball(r * shrink, 0xffffff, 2), 0, y, 0), V3(0, y0, 0), t0 + 0.1, nn => u(nn));
      for (let i = 0; i < n; i++) {
        const len = lerp(l[0], l[1], R()), yc = lerp(y0 + len / 2, y1 - len / 2, R()), ph = R() * TAU, nn = V3(Math.cos(ph), 0, Math.sin(ph)), Ps = [], Ns = [];
        for (let k = 0; k < 6; k++) { const y = yc + (k / 5 - 0.5) * len, r = rAt(y); Ps.push(V3(nn.x * r, y, nn.z * r)); Ns.push(nn); }
        ribbon(Pt, Ps, Ns, lerp(w[0], w[1], R()), tn(world(Pt, nn).clone(), R()), when(t0, 0.2, yOf(Pt, Ps[2])), o);
      }
    };
    // A lofted form: rings from its foot up ({ y, c: [x, z], r1, r2 }), r1 along `ax` and r2 across it, round (pow 2)
    // or square-shouldered (pow 5), fluted if asked (real folds); smooth all over, painted paint(normal in the room, how
    // far up, how far round, where, its own normal). Returns how to find a point and its normal on it, and how to lay a stroke on it.
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
    const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));
    const M = this.M;

    // ---------------------------------------------------------- the table, under its red cloth: pleats falling at the
    // corners, its top worn pale, the side away from his light in the dark, the hem lying uneven on the floor
    const TT = 0.1, table = part();
    {
      const T = TABLE, ring = (y, k) => ({ y, c: [T.x, T.z], r1: T.rx * k, r2: T.rz * k });
      const pleat = th => { let s = 0; for (let k = 0; k < 4; k++) { const d = wrap(th - (Math.PI / 4 + k * Math.PI / 2)); s += Math.exp(-(d / 0.42) * (d / 0.42)) * Math.cos(6.2 * d + k * 1.3); } return s; };
      const fl = (v, th) => 1 + (0.006 + 0.15 * Math.pow(1 - v, 1.4)) * fall(v, 0.62, 0.8) * pleat(th) + 0.03 * fall(v, 0, 0.09) * Math.sin(th * 3 + 1.2) * Math.sin(th * 5 + 0.4);
      const uR = under(RD), c = new THREE.Color();
      const paint = (nw, v, th, p, nl) => {
        c.copy(uR(nw));
        if (nl.y > 0.6) return c.lerp(WORN[0], 0.5 + 0.1 * Math.sin(p.x * 9 + p.z * 7));
        return c.multiplyScalar((1 - 0.4 * fall(pleat(th), -0.8, 0.1) * fall(v, 0.3, 0.75)) * (0.8 + 0.2 * sstep(v, 0, 0.1)));
      };
      const S = loft(table, [ring(0, 1.07), ring(0.012, 1.05), ring(0.05, 1.03), ring(0.12, 1.015), ring(0.2, 1.004), ring(T.y - 0.03, 1.0), ring(T.y - 0.006, 0.99), ring(T.y, 0.965), ring(T.y, 0.9), ring(T.y, 0.8)], TT, paint, { pow: 6, flute: fl, seg: 56, rows: 18, cap: true, shrink: 0.97, dark: 0.72 });
      const tn = mixer(RD, RDH, 0.45, 0.2), n = V3(), p = V3();
      for (let i = 0; i < 150; i++) {     // the cloth hanging: long soft drags down its sides
        const dv = lerp(0.2, 0.34, R()), v = lerp(0.05 + dv / 2, 0.6 - dv / 2, R()), th = R() * TAU; S.normal(v, th, n);
        S.lay(v, th, dv, (R() - 0.5) * 0.04, lerp(0.028, 0.05, R()), tn(n, R()), null, { ridge: 0.08, tip: 0.002 });
      }
            for (let i = 0; i < 120; i++) {     // its top, level: the red worn pale, dragged thin
        p.set(T.x + (R() - 0.5) * 1.62 * T.rx, T.y, T.z + (R() - 0.5) * 1.62 * T.rz);
        stroke(table, p.clone(), V3(0, 1, 0), along(V3(0, 1, 0), ACROSS, 0.7), lerp(0.045, 0.075, R()), lerp(0.02, 0.032, R()), pick(WORN, R()).clone().lerp(RD.hi[0], 0.3 + 0.3 * R()), when(TT + 0.1, 0.2, p.y), { cell: R() < 0.6 ? 0 : 1, tip: 0.001, tilt: 0.12 });
      }
    }

    // ---------------------------------------------------------- the skirt: one great mass, its folds falling from the
    // gathers at her waist over her knees and pooling a little on the floor; shade in every hollow, no drawn lines
    const TS = 0.06, skirt = part();
    {
      const ring = (y, s, r1, r2) => ({ y, c: [HIP[0] + DIR[0] * s, HIP[1] + DIR[1] * s], r1, r2 });
      const F = (v, th) => { const t = th + 0.2 * Math.sin(2.3 * v + 1); return 0.5 * Math.sin(t * 5 + 1.1) + 0.32 * Math.sin(t * 8 + 4.0) + 0.18 * Math.sin(t * 13 + 2.2); };
      const amp = v => (0.02 + 0.095 * Math.pow(1 - v, 1.25)) * fall(v, 0.84, 0.99);
      const fl = (v, th) => 1 + amp(v) * F(v, th);
      const uS = under(SK), c = new THREE.Color();
      const paint = (nw, v, th) => c.copy(uS(nw)).lerp(HOLLOW, 0.62 * fall(F(v, th), -0.75, 0.05) * sstep(amp(v), 0.01, 0.06)).multiplyScalar((1 + 0.07 * sstep(F(v, th), 0.3, 0.9)) * (0.74 + 0.26 * sstep(v, 0.01, 0.1)));
      const S = loft(skirt, [ring(0, 0.05, 0.232, 0.246), ring(0.014, 0.05, 0.216, 0.23), ring(0.06, 0.052, 0.196, 0.204), ring(0.13, 0.056, 0.18, 0.18), ring(0.19, 0.06, 0.16, 0.15), ring(0.222, 0.05, 0.126, 0.112), ring(0.24, 0.01, 0.074, 0.072), ring(0.252, -0.004, 0.058, 0.058)], TS, paint, { ax: DIR, flute: fl, seg: 72, rows: 16, shrink: 0.965, dark: 0.84 });
      const tn = mixer(SK, SKH, 0.42, 0.2), n = V3();
      for (let i = 0; i < 250; i++) {      // long soft drags of ochre, straw and grey-green, running down the folds
        const dv = lerp(0.2, 0.4, R()), v = lerp(0.05 + dv / 2, 0.84 - dv / 2, Math.pow(R(), 1.1)), th = R() * TAU, f = F(v, th); S.normal(v, th, n);
        const c2 = tn(n, R()); if (f < -0.3) c2.lerp(HOLLOW, 0.3); else if (f > 0.45) c2.multiplyScalar(1.06);
        S.lay(v, th, dv, (R() - 0.5) * 0.06, lerp(0.032, 0.056, R()) * (1 - 0.3 * v), c2, null, { ridge: 0.08, tilt: 0.22, tip: 0.003 });
      }
      for (let i = 0; i < 64; i++) {       // over her lap, short, from the gathers at her waist
        const v = 0.82 + 0.1 * R(), th = R() * TAU; S.normal(v, th, n);
        S.lay(v, th, 0.13, (R() - 0.5) * 0.2, lerp(0.016, 0.026, R()), tn(n, R()), null, { ridge: 0.06, tip: 0.002 });
      }
      for (let i = 0; i < 36; i++) { const th = R() * TAU; S.normal(0.03, th, n); S.lay(0.03, th, 0.012, 0.16 + 0.14 * R(), 0.022, tn(n, R()).multiplyScalar(0.74), null, { cell: 1, tip: 0.001 }); }      // where it pools, on the floor
    }

    // ---------------------------------------------------------- her body, from the waist: the dark bodice, the chemise,
    // her shoulders sloping into her neck (all one form)
    const TB_ = 0.5, torso = part(M.torso);
    {
      const TR = [[-0.014, 0.06, 0.049, 0], [0.02, 0.061, 0.049, 0], [0.058, 0.068, 0.054, 0.002], [0.094, 0.074, 0.057, 0.003], [0.12, 0.08, 0.05, 0.001], [0.136, 0.064, 0.041, 0], [0.148, 0.036, 0.03, 0.002], [0.16, 0.021, 0.021, 0.004], [0.174, 0.017, 0.017, 0.004]];
      const uD = under(DK), uW = under(WH), uF = under(FL), c = new THREE.Color();
      // (how far a point is into her skin: above the neck of the chemise, which dips a little in front)
      const bare = (p, nl) => Math.max(p.y - 0.143, sstep(nl.z, 0.0, 0.5) > 0.5 ? p.y - (0.125 + 0.5 * Math.abs(p.x)) : -1), skin = (p, nl) => bare(p, nl) > 0;
      const c2 = new THREE.Color();
      const paint = (nw, v, th, p, nl) => c.copy(uD(nw)).lerp(c2.copy(uW(nw)), sstep(p.y, 0.05, 0.064)).lerp(c2.copy(uF(nw)), sstep(bare(p, nl), -0.004, 0.004));
      const S = loft(torso, TR.map(([y, r1, r2, z]) => ({ y, c: [0, z], r1, r2 })), TB_, paint, { seg: 36, rows: 26, shrink: 0.93, dark: 0.8 });
      const tw = mixer(WH, WHH, 0.5, 0.14), td = mixer(DK, DKH, 0.5, 0.3), tf = mixer(FL, FLH, 0.3, 0.07), n = V3();
      for (let i = 0; i < 46; i++) { const v = 0.05 + 0.16 * R(), th = R() * TAU; S.normal(v, th, n); S.lay(v, th, 0.02 * (R() - 0.5), 0.5 + 0.4 * R(), lerp(0.014, 0.022, R()), td(world(torso, n).clone(), R()), null, {}); }      // the bodice, dark
      for (let i = 0; i < 5; i++) { const th = -0.5 + i * 0.3; S.normal(0.14, th, n); S.lay(0.13 + 0.02 * R(), th, 0.01, 0.3, 0.013, pick(RD.mid, R()), TB_ + 0.25, { cell: 0, lift: 0.003 }); }      // the red tied at her waist
      S.normal(0.1, 0.35, n); S.lay(0.09, 0.35, 0.12, 0.05, 0.012, RD.lo[0], TB_ + 0.28, { cell: 1, lift: 0.004 });
      for (let i = 0; i < 120; i++) {      // the chemise: broken whites and silver greys, falling from her shoulders
        const down = R() < 0.8, v = (down ? 0.3 : 0.26) + 0.28 * R(), th = R() * TAU, p = S.at(v, th); S.normal(v, th, n);
        if (skin(p, n)) continue;
        S.lay(v, th, down ? lerp(0.1, 0.17, R()) : 0.015 * (R() - 0.5), down ? (R() - 0.5) * 0.12 : 0.3 + 0.25 * R(), lerp(0.012, 0.02, R()), tw(world(torso, n).clone(), R()), null, { ridge: 0.08, tip: 0.002 });
      }
      for (let i = 0; i < 26; i++) { const v = 0.25 + 0.06 * R(), th = R() * TAU; S.normal(v, th, n); S.lay(v, th, 0.012 * (R() - 0.5), 0.3 + 0.25 * R(), lerp(0.012, 0.018, R()), tw(world(torso, n).clone(), R()), null, { ridge: 0.08, tip: 0.002 }); }      // where it is gathered into the bodice
      for (let i = 0; i < 60; i++) {       // her throat and the top of her breast: skin, in soft close touches
        const v = 0.56 + 0.42 * R(), th = R() * TAU, p = S.at(v, th); S.normal(v, th, n);
        if (!skin(p, n)) continue;
        S.lay(v, th, 0.05 * (R() - 0.5), 0.3 + 0.3 * R(), lerp(0.011, 0.017, R()), tf(world(torso, n).clone(), R()), TB_ + 0.3, { cell: R() < 0.6 ? 2 : 0, tip: 0.001, ridge: 0.03, tilt: 0.2 });
      }
      for (let i = 0; i < 30; i++) {       // and the lights loaded on, where his light falls
        const v = 0.32 + 0.24 * R(), th = R() * TAU, p = S.at(v, th); S.normal(v, th, n);
        if (skin(p, n) || world(torso, n).dot(KEY) < 0.42) continue;
        S.lay(v, th, lerp(0.08, 0.13, R()), (R() - 0.5) * 0.14, lerp(0.012, 0.018, R()), pick(WHH, R() * 0.3).clone().multiplyScalar(1.02), TB_ + 0.36, { ridge: 0.12, lift: 0.003, cell: 0 });
      }
      for (let row = 0; row < 2; row++) for (let i = 0; i < 9; i++) {      // the necklace: coral and glass, two strands, small touches
        const th = Math.PI / 2 + (i - 4) * 0.34 + row * 0.17, v = 0.7 - 0.03 * row - 0.035 * Math.sin(th) * Math.sin(th); S.normal(v, th, n);
        S.lay(v, th, 0.003, 0.2, 0.0075, (i + row) % 2 ? pick(CORAL, R()) : pick(BEAD, R()), 1.12 + 0.02 * i + 0.1 * row, { cell: 2, lift: 0.0035, tip: 0, ridge: 0.14 });
      }
      for (let i = 0; i < 2; i++) { S.normal(0.58, -0.45 - 0.2 * i, n); S.lay(0.56 - 0.03 * i, -0.45 - 0.2 * i, 0.09, 0.08, 0.011, PINK[i], 1.15, { lift: 0.004 }); }      // the ribbon on her shoulder
    }

    // ---------------------------------------------------------- her head: no drawn features (the shade her eyes lie in,
    // the cheek turned to his light, a mouth barely there, all in the form); her hair a soft dark mass, the ribbon, the coral
    const TH_ = 0.88, head = part(M.head);
    { const NK = { hi: FL.mid, mid: FL.mid, lo: FL.lo, deep: FL.deep }; tube(head, [[0.0168, -0.018], [0.016, 0.0], [0.0155, 0.024]], NK, TH_, 16, mixer(NK, FLH, 0.25, 0.06), { l: [0.02, 0.03], w: [0.01, 0.014], cell: 2, tip: 0.001, tilt: 0.2, ridge: 0.03, dark: 0.95 }); }
    {
      const uF = under(FL), uH = under(HR), c = new THREE.Color(), c3 = new THREE.Color();
      const SKc = [0, 0.058, 0.004], SKr = [0.0335, 0.041, 0.036], HRc = [0, 0.073, -0.008], HRr = [0.039, 0.038, 0.041];
      const hairy = n => n.y > 0.6 - 0.25 * n.z || n.z < -0.05 || (Math.abs(n.x) > 0.82 && n.y > -0.25 && n.z < 0.35);
      // (a soft patch round a point of the face: how far n is from (x, y, z), wider across than up and down)
      const gz = (n, x, y, z, rx, ry = rx) => { const k = 1 / Math.hypot(x, y, z), dx = (n.x - x * k) / rx, dy = (n.y - y * k) / ry, dz = (n.z - z * k) / rx; return Math.exp(-(dx * dx + dy * dy + dz * dz)); };
      const face = (nw, v, nn) => {
        if (hairy(nn) && nn.z < 0.3) return c.copy(uH(nw));
        c.copy(uF(nw)).lerp(LOST, 0.46 * sstep(nn.x, 0.1, 0.85));                                      // the far side of her face lost in shade
        c.lerp(SOCK, 0.5 * gz(nn, 0, 0.16, 0.95, 0.55, 0.1));                                           // the shade under her brow, right across
        for (const sx of [-1, 1]) c.lerp(SOCK, 0.72 * gz(nn, sx * 0.4, 0.08, 0.9, 0.24, 0.17)).lerp(EYE, 0.8 * gz(nn, sx * 0.4, 0.05, 0.9, 0.13, 0.075)).lerp(CHEEK, 0.2 * gz(nn, sx * 0.56, -0.3, 0.8, 0.2));
        c.lerp(SOCK, 0.32 * gz(nn, 0.2, -0.1, 0.96, 0.09)).lerp(SOCK, 0.36 * gz(nn, 0.02, -0.31, 0.95, 0.1, 0.05));      // beside her nose, and under it
        c.lerp(ROSE, 0.52 * gz(nn, 0, -0.52, 0.86, 0.15, 0.055)).lerp(SOCK, 0.3 * gz(nn, 0, -0.53, 0.86, 0.13, 0.016)).lerp(SOCK, 0.28 * gz(nn, 0, -0.7, 0.72, 0.13, 0.08));
        return c.lerp(c3.copy(uH(nw)), sstep(nn.y - (0.6 - 0.25 * nn.z), -0.07, 0.05));      // into her hair, softly      // her mouth, barely; the shade under her lip
      };
      ball(head, SKc, SKr, face, TH_ + 0.04, { detail: 6, shrink: 0.95, dark: 0.95 });
      ball(head, [0, 0.0478, 0.0352], [0.0036, 0.0072, 0.0042], nw => c.copy(uF(nw)), TH_ + 0.1, { detail: 2, shrink: 1, dark: 0.92 });      // her nose
      // her face: planes of light and shade, each a soft touch that takes its tone from where it lies (the brow's shade,
      // the lit cheek, the far side lost, the mouth barely there); no feature is drawn
      const visage = (nw, r, nn) => face(nw, null, nn).clone().multiplyScalar(1 + (r - 0.5) * 0.07);
      coat(head, SKc, SKr, 360, visage, TH_ + 0.2, { l: [0.009, 0.015], w: [0.008, 0.012], keep: (p, n) => !hairy(n) && n.z > -0.15 && n.y - (0.6 - 0.25 * n.z) < 0.02, flow: V3(0.2, -1, 0), jit: 1.4, cell: 2, tip: 0.0008, lift: 0.0012, ridge: 0.02, tilt: 0.14 });
      { const n = V3(-0.12, -0.08, 1).normalize(); stroke(head, V3(-0.0006, 0.049, 0.0405), n, V3(0.05, 1, 0).normalize(), 0.014, 0.0052, FL.hi[0], TH_ + 0.4, { cell: 2, lift: 0.0006, tip: 0, tilt: 0.05, ridge: 0.03 }); }      // the light down her nose
      // her hair: a soft dark mass, piled up behind, feathered at its edge, a few lighter touches where the light catches it
      ball(head, HRc, HRr, nw => c.copy(uH(nw)), TH_ + 0.1, { detail: 3 });
      ball(head, [0, 0.102, -0.024], [0.027, 0.02, 0.025], nw => c.copy(uH(nw)), TH_ + 0.16, { detail: 2 });
      const th = mixer(HR, HRH, 0.5, 0.3), HK = (p, n) => p.z < 0.004 || p.y > 0.1;
      coat(head, HRc, HRr, 90, th, TH_ + 0.1, { l: [0.018, 0.03], w: [0.011, 0.017], grow: 1.02, keep: HK, flow: V3(0.2, -0.2, -1), jit: 1.2, tip: 0.004 });
      coat(head, [0, 0.102, -0.024], [0.027, 0.02, 0.025], 20, th, TH_ + 0.16, { l: [0.016, 0.026], w: [0.01, 0.014], flow: ACROSS, jit: 1.6, tip: 0.005 });
      coat(head, HRc, HRr, 26, (n, r) => pick(HAIR_LIT, r).clone(), TH_ + 0.3, { l: [0.014, 0.024], w: [0.005, 0.008], grow: 1.04, keep: (p, n) => HK(p, n) && world(head, n).dot(KEY) > 0.45, flow: V3(0.4, -0.5, -0.6), jit: 0.9, cell: 1, tip: 0.003 });
      const on = (nx, ny, nz) => { const n = V3(nx, ny, nz).normalize(); return [V3(SKc[0] + n.x * SKr[0], SKc[1] + n.y * SKr[1], SKc[2] + n.z * SKr[2]), n]; };
      for (const sx of [-1, 1]) { const [p, n] = on(sx * 0.62, 0.5, 0.6); stroke(head, p, n, V3(0.5 * sx, -1, 0).normalize(), 0.014, 0.007, pick(HR.mid, R()), TH_ + 0.3, { lift: 0.002, tip: 0.001, bend: 0.2 * sx, cell: 1 }); }      // a loose curl at each temple
      const onHair = (n, g) => V3(HRc[0] + n.x * HRr[0] * g, HRc[1] + n.y * HRr[1] * g, HRc[2] + n.z * HRr[2] * g);
      for (let i = 0; i < 8; i++) {        // the ribbon over her hair, gold
        const a = (i - 3.5) * 0.3, n = V3(Math.sin(a), Math.cos(a) * 0.86, 0.5 * Math.cos(a) + 0.08).normalize();
        stroke(head, onHair(n, 1.05), n, V3(Math.cos(a), -Math.sin(a) * 0.86, -0.5 * Math.sin(a)).normalize(), 0.017, 0.007, pick(n.dot(KEY) > 0.3 ? GD.hi : GD.mid, R()), 1.12 + 0.015 * i, { lift: 0.002, tip: 0.001, ridge: 0.16, cell: 0 });
      }
      for (let i = 0; i < 5; i++) {        // five touches of coral, her right side, laid in last, one at a time
        const a = 0.1 + i * 0.2, n = V3(-Math.sin(a) * 0.95, Math.cos(a), 0.5 - 0.03 * i).normalize(), p = onHair(n, 1.06), t = 1.2 + 0.085 * i, tg = V3(-Math.cos(a), -Math.sin(a), 0).normalize();
        stroke(head, p, n, tg, 0.012, 0.0115, pick(CORAL, R()), t, { cell: 2, lift: 0.003, tip: 0, ridge: 0.1 });
        stroke(head, p.clone().addScaledVector(V3(-0.3, 0.8, 0.3).normalize(), 0.0022), n, tg, 0.0048, 0.0046, CORAL_HI, t + 0.05, { cell: 2, lift: 0.0045, tip: 0, ridge: 0 });
      }
    }
    // her earrings: a drop of gold each, on a wire
    const drop = sx => { const Pt = part(sx < 0 ? M.earR : M.earL), u = under(GD), c = new THREE.Color(); tube(Pt, [[0.0011, -0.011], [0.0011, 0]], GD, 1.2, 0, null); ball(Pt, [0, -0.0165, 0], [0.0034, 0.007, 0.0034], nw => c.copy(u(nw)), 1.2, { detail: 2 }); return Pt; };
    const earR = drop(-1), earL = drop(1);

    // ---------------------------------------------------------- her arms (each bone runs along its own +y): flesh that
    // tapers, a short full sleeve, a hand
    const TA_ = 0.72, tf2 = mixer(FL, FLH, 0.3, 0.07), SKIN = { l: [0.04, 0.07], w: [0.016, 0.024], cell: 0, tip: 0.0012, ridge: 0.03, tilt: 0.24, dark: 0.95 }, tw2 = mixer(WH, WHH, 0.5, 0.14), uW2 = under(WH), uF2 = under(FL), cA = new THREE.Color(), K = 1.1;
    const upper = rest => {
      const Pt = part(rest);
      tube(Pt, [[0.0215 * K, 0], [0.0225 * K, 0.03], [0.021 * K, 0.07], [0.0188 * K, 0.105], [0.0178 * K, L1]], FL, TA_, 46, tf2, SKIN);
      ball(Pt, [0, 0.018, 0], [0.03, 0.034, 0.03], nw => cA.copy(uW2(nw)), TA_, { detail: 3 });
      coat(Pt, [0, 0.018, 0], [0.03, 0.034, 0.03], 34, tw2, TA_ + 0.05, { l: [0.02, 0.036], w: [0.012, 0.019], ridge: 0.1, tip: 0.004 });
      return Pt;
    };
    const fore = rest => {
      const Pt = part(rest);
      tube(Pt, [[0.0171 * K, 0], [0.0198 * K, 0.03], [0.0186 * K, 0.06], [0.0146 * K, 0.1], [0.012 * K, 0.124]], FL, TA_ + 0.05, 46, tf2, SKIN);
      coat(Pt, [0, L2 - 0.001, 0.001], [0.0125 * K, 0.021, 0.0098 * K], 22, tf2, TA_ + 0.1, { l: [0.012, 0.02], w: [0.008, 0.012], cell: 2, tip: 0.0008, ridge: 0.03, tilt: 0.16 });
      ball(Pt, [0, L2 - 0.001, 0.001], [0.0125 * K, 0.021, 0.0098 * K], nw => cA.copy(uF2(nw)), TA_ + 0.08, { detail: 3, dark: 0.95 });      // her hand, closed
      return Pt;
    };
    const ru = upper(M.ru), rf = fore(M.rf), lu = upper(M.lu), lf = fore(M.lf);

    // ---------------------------------------------------------- the book: two boards hinged at the spine, the leaves between; one leaf to turn
    const TK = 0.8;
    const board = (rest, sx) => {
      const Pt = part(rest), uR = under(RD), uP = under(PG), c = new THREE.Color();
      const b = shape.box(BW, BH, 0.003, 0xffffff); b.translate(sx * BW / 2, 0, -BTH + 0.0015); solid(Pt, b, V3(0, -BH / 2, -BTH), TK, nw => c.copy(RD.mid[0]).lerp(uR(nw), 0.35));
      const g = shape.box(BW - 0.005, BH - 0.007, BTH - 0.003, 0xffffff); g.translate(sx * (BW - 0.005) / 2, 0, -(BTH - 0.003) / 2); solid(Pt, g, V3(0, -BH / 2, -BTH), TK + 0.04, nw => c.copy(uP(nw)));
      for (let i = 0; i < 3; i++) stroke(Pt, V3(sx * BW * (0.24 + 0.26 * i), (R() - 0.5) * 0.02, -BTH), V3(0, 0, -1), V3(0.12 * (R() - 0.5), 1, 0).normalize(), 0.08, 0.024, pick(i === 1 ? RD.hi : RD.mid, R()).clone().lerp(RD.mid[0], 0.5), TK + 0.08 + 0.03 * i, { lift: 0.0012, tip: 0.0004, ridge: 0.06, cell: 0 });
      for (let i = 0; i < 2; i++) stroke(Pt, V3(sx * BW * (0.3 + 0.36 * i), (R() - 0.5) * 0.016, 0), V3(0, 0, 1), V3(0.1 * (R() - 0.5), 1, 0).normalize(), 0.08, 0.03, pick(PG.hi, R()), TK + 0.12, { lift: 0.001, tip: 0.0003, ridge: 0.04, cell: 0 });
      for (let j = 0; j < 5; j++) stroke(Pt, V3(sx * BW * 0.5, (j - 2) * 0.015 + 0.002, 0), V3(0, 0, 1), V3(1, 0.04 * (R() - 0.5), 0).normalize(), 0.042 + 0.006 * R(), 0.0052, PG.lo[j % 2], TK + 0.2, { lift: 0.0018, tip: 0, ridge: 0, cell: 1 });      // print: grey touches, no words
      return Pt;
    };
    const bkR = board(M.bkR, 1), bkL = board(M.bkL, -1), leaf = part(M.leaf);
    { const g = shape.box(BW - 0.007, BH - 0.009, 0.0009, 0xffffff); g.translate((BW - 0.007) / 2, 0, 0.0012); const uP = under(PG), c = new THREE.Color(); solid(leaf, g, V3(0, 0, 0), TK + 0.1, nw => c.copy(uP(nw)).multiplyScalar(1.04)); }

    // ---------------------------------------------------------- the rig: every solid thing, one draw call
    const parts = { table, skirt, torso, head, earR, earL, ru, rf, lu, lf, bkR, bkL, leaf };
    let total = 0; for (const p of Object.values(parts)) total += p.n;
    const ru_ = this.ru = { uT: { value: 0 }, uTumble: { value: 1 } };
    const rm = new THREE.MeshStandardMaterial({ vertexColors: true, color: 0xa4a4a4, map: brushPrint(), alphaTest: 0.4, roughness: 0.92, metalness: 0, emissive: 0xffffff, emissiveIntensity: 0.44, side: THREE.DoubleSide });
    rm.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, ru_);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec3 aCen; attribute vec4 aFly; uniform float uT, uTumble; varying float vBody;')
        .replace('#include <begin_vertex>', `#include <begin_vertex>
  {
    // a stroke: let down from under the rail to its place, slowly at the last, turning as it comes and growing as it
    // lands; a body (no flight) stays where it is and is scumbled in, thin at first (vBody, for the fragments)
    vec3 rel = transformed - aCen;
    float k = clamp((uT - aFly.w) / ${FLY.toFixed(2)}, 0.0, 1.0), fl = step(1.0e-6, dot(aFly.xyz, aFly.xyz));
    float eh = k * k * (3.0 - 2.0 * k), ev = 1.0 - (1.0 - k) * (1.0 - k);
    float s = fl > 0.5 ? (k <= 0.0 ? 0.0 : 0.3 + 0.7 * k * k) : 1.0;
    vBody = fl > 0.5 ? 1.0 : k;
    float sg = fract(aFly.w * 37.7) > 0.5 ? 1.0 : -1.0;
    float a = (1.0 - k) * (1.0 - k) * 2.6 * uTumble * fl * sg, cs = cos(a), sn = sin(a);
    rel = vec3(cs * rel.x - sn * rel.z, rel.y, sn * rel.x + cs * rel.z);
    // (and it comes down leaning, as a leaf does, and rights itself as it lands)
    float b = (1.0 - k) * (0.8 + 1.3 * uTumble) * fl * sg * (0.5 + fract(aFly.w * 91.3)), cb = cos(b), sb = sin(b);
    rel = vec3(cb * rel.x - sb * rel.y, sb * rel.x + cb * rel.y, rel.z);
    transformed = aCen + rel * s + aFly.xyz * vec3(1.0 - eh, 1.0 - ev, 1.0 - eh) + vec3(0.03 * sg * sin(3.1416 * k) * fl * uTumble, 0.0, 0.0);
  }`);
      // (the paint glows a little in its own colour, bristle by bristle)
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vBody;')
        .replace('#include <map_fragment>', '#include <map_fragment>\n  if (vBody < 0.999) { vec2 bq = mod(floor(gl_FragCoord.xy), 4.0); float bt = (mod(bq.x + bq.y * 2.0, 4.0) * 4.0 + mod(bq.x * 3.0 + bq.y, 4.0) + 0.5) / 16.0; if (vBody < bt) discard; }')
        .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n  totalEmissiveRadiance *= vColor.rgb;\n#ifdef USE_MAP\n  totalEmissiveRadiance *= sampledDiffuseColor.rgb;\n#endif');
    };
    rm.customProgramCacheKey = () => 'corot-reader';
    const rig = this.rig = L.rig(14, total + 64, rm);
    this.I = {};
    for (const [name, p] of Object.entries(parts)) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(p.pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(p.nor, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(p.col, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(p.uv, 2)); g.setAttribute('aCen', new THREE.Float32BufferAttribute(p.cen, 3)); g.setAttribute('aFly', new THREE.Float32BufferAttribute(p.fly, 4));
      this.I[name] = rig.add(rig.geo(g)); rig.mat(this.I[name], this.V.m.multiplyMatrices(this.B, p.rest));
      p.pos = p.nor = p.col = p.uv = p.cen = p.fly = null;
    }

    this.shade = L.blobs(5, { fade: true });
    this.band = this.makeScore(L);
    this.reset(L);
  },

  // ---------------------------------------------------------------- the music
  makeScore(L) {
    const s = score(L);
    const lead = { type: 'triangle', vol: 0.03, over: 2, overVol: 0.16, attack: 0.006, legato: 1.7 }, inner = { type: 'triangle', vol: 0.012, attack: 0.008, legato: 1.6 };
    const low = { type: 'triangle', vol: 0.02, attack: 0.012, legato: 1.0, over: 2, overVol: 0.3 }, ch = { type: 'sine', vol: 0.012, attack: 0.01, legato: 1.5 };
    s.tune(TOP, T_M0, BPM, lead); s.tune(MID, T_M0, BPM, inner); s.tune(LOW, T_M0, BPM, inner);
    s.tune(BASS, T_M0, BPM, low); s.tune(CH1, T_M0, BPM, ch); s.tune(CH2, T_M0, BPM, ch);
    s.hit(0.05, { d: 1.6, vol: 0.008, lp: 1700, hp: 300, attack: 0.5 });      // the brush, laying her in
    return s.done();
  },

  // ---------------------------------------------------------------- her pose
  // A two-bone arm from shoulder S to hand T (scene metres): the elbow towards `pole`, or, if yE is given, at that
  // height (resting on the table), on the pole's side. Fills the two bones' matrices (each runs along its own +y).
  arm(S, T, pole, yE, M1, M2) {
    const V = this.V, d = V.d.copy(T).sub(S), len = d.length(), dist = Math.max(L2 - L1 + 0.01, Math.min(L1 + L2 - 0.003, len)); d.multiplyScalar(1 / Math.max(1e-5, len));
    const a = (L1 * L1 - L2 * L2 + dist * dist) / (2 * dist), h = Math.sqrt(Math.max(0, L1 * L1 - a * a));
    const p1 = V.p1.copy(pole).addScaledVector(d, -pole.dot(d)).normalize(), p2 = V.p2.crossVectors(d, p1);
    let phi = 0;
    if (yE != null && h > 1e-4) {
      const cy = S.y + d.y * a, A = p1.y, B = p2.y, r = Math.hypot(A, B);
      if (r > 1e-5) { const q = Math.acos(Math.max(-1, Math.min(1, (yE - cy) / (h * r)))), base = Math.atan2(B, A), w = x => Math.abs(Math.atan2(Math.sin(x), Math.cos(x))); phi = w(base + q) < w(base - q) ? base + q : base - q; }
    }
    const E = V.el.copy(S).addScaledVector(d, a).addScaledVector(p1, h * Math.cos(phi)).addScaledVector(p2, h * Math.sin(phi)), tip = V.t.copy(S).addScaledVector(d, dist);
    M1.compose(S, V.q.setFromUnitVectors(V.up, V.p1.copy(E).sub(S).normalize()), V.one);
    M2.compose(E, V.q.setFromUnitVectors(V.up, V.p1.copy(tip).sub(E).normalize()), V.one);
  },

  // Everything of hers that moves, for u (0: reading; 1: the picture's pose) and the small things in o: into this.M.
  // The look up, in its order: her head first, up and round; her shoulders after it; the book drawn down off the table;
  // her hand up to her temple; and last her head leaning over and her weight settling into that hand.
  pose(u, o) {
    const V = this.V, M = this.M;
    const kHead = ease.inOut(ramp(u, 0, 0.48)), kLean = ease.inOut(ramp(u, 0.16, 0.8)), kBook = ease.inOut(ramp(u, 0.14, 0.72)), kHand = ease.inOut(ramp(u, 0.3, 0.84)), kSet = ease.inOut(ramp(u, 0.78, 1));
    const eul = (m, x, y, z, yaw, pitch, roll) => m.compose(V.pos.set(x, y, z), V.q.setFromEuler(V.e.set(pitch, yaw, roll, 'YXZ')), V.one);
    // her body, from the waist: over the book; and leaning on her arm
    eul(M.torso, WAIST[0], WAIST[1] - 0.004 * kSet, WAIST[2], lerp(TA.yaw, TB.yaw, kLean), lerp(TA.pitch, TB.pitch, kLean) + 0.012 * o.breath, lerp(TA.roll, TB.roll - 0.06, kLean) + 0.06 * kSet + 0.006 * o.sway);
    // her head: bent to the page, going along the lines; or up, and leant on her hand, turned to whoever it is
    eul(V.l, NECK[0], NECK[1], NECK[2], lerp(HA.yaw + o.scan, HB.yaw + o.gazeY, kHead), lerp(HA.pitch + o.nod, HB.pitch - 0.07 + o.gazeP, kHead) + 0.07 * kSet, lerp(HA.roll, HB.roll - 0.15, kHead) + 0.15 * kSet + 0.02 * o.sway * kSet);
    M.head.multiplyMatrices(M.torso, V.l).scale(V.c.setScalar(HEAD_S));
    // the book: open on the table; or shut, hanging over her knee
    const arc = Math.sin(Math.PI * kBook);
    V.pos.lerpVectors(this.PA, this.PB, kBook); V.pos.y += 0.05 * arc + 0.002 * o.sway * kBook; V.pos.z += 0.035 * arc;
    M.book.compose(V.pos, V.q.copy(this.QA).slerp(this.QB, kBook), V.one);
    const open = lerp(OPEN_A, OPEN_B, ease.inOut(ramp(u, 0.14, 0.46))), phi = (Math.PI - open) / 2;
    M.bkR.multiplyMatrices(M.book, V.l.makeRotationY(-phi)); M.bkL.multiplyMatrices(M.book, V.l.makeRotationY(phi));
    const tk = o.turn < 0 ? 0 : ease.inOut(o.turn);
    M.leaf.multiplyMatrices(M.book, V.l.makeRotationY(-lerp(phi + 0.03, Math.PI - phi - 0.03, tk)));
    // her left hand on the book (on its end, when it is shut); her right at its edge, turning a leaf, or up at her temple
    const hl = V.a.set(lerp(HAND_L_A[0], HAND_L_B[0], kBook), lerp(HAND_L_A[1], HAND_L_B[1], kBook), lerp(HAND_L_A[2], HAND_L_B[2], kBook)).applyMatrix4(M.book);
    this.arm(V.s.set(...SH_L).applyMatrix4(M.torso), hl, V.w.set(0.6, -0.72, -0.34), null, M.lu, M.lf);
    const reach = o.turn < 0 ? 0 : Math.sin(Math.PI * clamp01(o.turn * 1.15));
    const hr = V.a.set(lerp(HAND_R_A[0], HAND_R_TURN[0], reach), lerp(HAND_R_A[1], HAND_R_TURN[1], reach), lerp(HAND_R_A[2], HAND_R_TURN[2], reach)).applyMatrix4(M.book);
    const temple = V.b.set(...TEMPLE).applyMatrix4(M.head), lift = Math.sin(Math.PI * kHand);
    hr.lerp(temple, kHand); hr.x -= 0.03 * lift; hr.z += 0.03 * lift;
    this.arm(V.s.set(...SH_R).applyMatrix4(M.torso), hr, V.w.set(-0.8, -0.5, 0.25), TABLE.y + 0.024, M.ru, M.rf);
    // her earrings hang plumb, and swing
    V.pos.set(-EAR[0], EAR[1], EAR[2]).applyMatrix4(M.head); M.earR.compose(V.pos, V.q.setFromAxisAngle(V.z, o.earR), V.one);
    V.pos.set(EAR[0], EAR[1], EAR[2]).applyMatrix4(M.head); M.earL.compose(V.pos, V.q.setFromAxisAngle(V.z, o.earL), V.one);
  },

  // She and her table are soft to the toy: it is eased out round them (never stopped dead, never through her).
  soften(L, dt) {
    const G = L.k.G, v = G.vehicle;
    if (L.quiet || dt <= 0 || G.state !== 'play' || !v || !v.group.visible || Math.abs(v.pos.y - L.y) > 0.45) return;
    const O = this.O;
    for (const [x, z, r] of SOFT) {
      const dx = v.pos.x - (O.x + (L.tx * x + L.nx * z) * SC), dz = v.pos.z - (O.z + (L.tz * x + L.nz * z) * SC), d = Math.hypot(dx, dz), reach = r * SC + (v.radius || 0.19);
      if (d >= reach || d < 1e-4) continue;
      const nx = dx / d, nz = dz / d, k = Math.min(1, dt * 10), into = v.vel.x * nx + v.vel.z * nz;
      v.pos.x += nx * (reach - d) * k; v.pos.z += nz * (reach - d) * k;
      if (into < 0) { v.vel.x -= nx * into * k; v.vel.z -= nz * into * k; }
    }
  },

  hide() { if (!this.rig) return; this.rig.mesh.visible = false; this.shade.visible = false; },
  start(L, resumed) {
    if (resumed) { this.fresh = false; this.t1 = L.t + 1.2; return; }
    this.clear(); this.band.from(0);
  },
  clear() { this.fresh = true; this.broke = false; this.rt = 0; this.hush = 0; this.u = 0; this.c = 0; this.clock = 0; this.near = false; this.gy = 0; this.gp = 0; this.lastTurn = -1; this.shut = false; this.er = this.el = this.erv = this.elv = 0; this.gazed = false; this.uPrev = null; this.cBack = BUILT; this.u0 = 0; },
  back(L) { this.cBack = Math.min(this.c, BUILT); this.u0 = this.u; },
  end() { this.hide(); },
  reset() { this.hide(); this.clear(); },

  update(L, dt) {
    const ph = L.phase, showing = ph === 'wake' || ph === 'play', linger = ph === 'linger', back = ph === 'return';
    if (!showing && !linger && !back) { this.hide(); return; }
    const calm = L.calm, V = this.V, G = L.k.G, voice = L.voice();
    this.clock += dt;
    // ---- is she built; and is she looking up?
    const dwell = this.u0 > 0.04 ? Math.min(1.5, FALL / (calm ? 0.65 : 1)) : 0.45;
    if (!back) this.c = Math.min(BUILT + 1, this.c + dt);
    const c = back ? this.cBack * (1 - ease.inOut(ramp(L.r, dwell, L.retDur))) : this.c;
    // (the tune has broken off: she is quite still for a moment, and then she looks up)
    const stopped = showing && this.fresh && this.rt >= RB - 1e-4;
    if (stopped) this.hush += dt;
    let target = 0, who = null;
    if (showing) { target = this.fresh ? (stopped && this.hush >= STILL ? 1 : 0) : (L.t >= this.t1 ? 1 : 0); who = G.camera.position; }
    else if (linger) {
      const v = G.vehicle, q = L.local(v.pos.x, v.pos.z), d = Math.hypot((q.u - U0) / SC - 0.02, (q.out + L.wall + ZS) / SC - 0.45);
      this.near = v.group.visible && Math.abs(v.pos.y - L.y) < 0.5 && d < (this.near ? 1.35 : 1.05); target = this.near ? 1 : 0; who = v.pos;
    }
    if (target || stopped) this.broke = true;
    const step = dt / (target > this.u ? RISE : FALL) * (calm ? 0.65 : 1);
    this.u = target > this.u ? Math.min(target, this.u + step) : Math.max(target, this.u - step);
    const u = this.u;
    // ---- the reading goes on (and the tune with it) while her eyes are on the page
    const reading = !target && !stopped && u < 0.3 && (!back || c > 0.06);
    if (reading) {
      const first = showing && this.fresh && !this.broke;
      this.rt += dt; if (first) this.rt = Math.min(this.rt, RB);
      if (this.rt < T_END) this.band.play(this.rt, first ? Math.max(0, Math.min(0.25, RB - this.rt)) : back ? 0.26 : 0.16);
    }
    const rt = this.rt;
    // ---- a leaf turned now and then
    const tn = rt < TURN0 ? -1 : Math.floor((rt - TURN0) / TURN_EVERY), tq = tn < 0 ? -1 : (rt - TURN0 - tn * TURN_EVERY) / TURN_D, turning = tq >= 0 && tq <= 1;
    if (turning && tn !== this.lastTurn && tq > 0.2 && reading) { this.lastTurn = tn; if (!L.quiet && voice.ctx) noise(voice, 0, { d: 0.26, vol: calm ? 0.006 : 0.011, bp: 2700, q: 0.7, attack: 0.05 }); }
    // ---- whoever she looks up at (you; the toy)
    if (who) {
      const q = L.local(who.x, who.z), dx = (q.u - U0) / SC + 0.03, dz = (q.out + L.wall + ZS) / SC - 0.42, wy = Math.max(-0.75, Math.min(0.75, Math.atan2(dx, dz))), wp = Math.max(-0.3, Math.min(0.16, -Math.atan2((who.y - L.y) / SC - 0.43, Math.hypot(dx, dz)) * 0.7));
      const k = !this.gazed ? 1 : 1 - Math.exp(-dt * 3.2); this.gy += (wy - this.gy) * k; this.gp += (wp - this.gp) * k; this.gazed = true;
    }
    // ---- the small things: her breath, the lines she reads along, her earrings (two small pendulums, set going by her head)
    const o = this.IDLE;
    o.breath = Math.sin(this.clock * 1.75); o.sway = u > 0.9 ? Math.sin(this.clock * 0.43) * Math.sin(this.clock * 0.19 + 1) : 0;
    o.scan = 0.045 * Math.sin(rt * 3.1) * (turning ? 0.3 : 1); o.nod = tn < 0 ? 0.02 * Math.sin(rt * 0.7) : 0.07 * (clamp01((rt - TURN0 - tn * TURN_EVERY - TURN_D) / (TURN_EVERY - TURN_D)) - 0.5) - (turning ? 0.05 * Math.sin(Math.PI * tq) : 0);
    o.turn = turning ? tq : -1; o.gazeY = this.gy; o.gazeP = this.gp;
    const kick = (this.uPrev == null ? 0 : (u - this.uPrev)) / Math.max(dt, 1e-3); this.uPrev = u;
    if (dt > 0) for (const s of ['r', 'l']) {
      const a = 'e' + s, v = a + 'v', n = Math.min(4, Math.ceil(dt / 0.012)), h = dt / n;
      for (let i = 0; i < n; i++) { this[v] += (-150 * this[a] - 2.6 * this[v] + (calm ? 9 : 34) * kick * (s === 'r' ? 1 : 0.8)) * h; this[a] += this[v] * h; }
      this[a] = Math.max(-0.7, Math.min(0.7, this[a]));
    }
    o.earR = this.er; o.earL = this.el;
    this.pose(u, o);
    // ---- into the rig
    const rig = this.rig, I = this.I, B = this.B, M = this.M;
    rig.mesh.visible = c > 0.03; this.ru.uT.value = c; this.ru.uTumble.value = calm ? 0 : 1;
    for (const n of ['torso', 'head', 'ru', 'rf', 'lu', 'lf', 'bkR', 'bkL', 'earR', 'earL']) rig.mat(I[n], V.m.multiplyMatrices(B, M[n]));
    rig.mat(I.leaf, V.m.multiplyMatrices(B, M.leaf)); rig.show(I.leaf, turning && c > BUILT);
    // ---- the book shuts, softly
    const shut = u > 0.42; if (shut !== this.shut) { this.shut = shut; if (shut && !L.quiet && voice.ctx) noise(voice, 0, { d: 0.09, vol: calm ? 0.008 : 0.016, lp: 520, attack: 0.004 }); }
    // ---- her shadow on the floor, and the table's: dark and close under them, soft and wide beyond, away from his light
    const O = this.O, sh = this.shade, k = ease.smooth(ramp(c, 0.15, 1.1)), kt = ease.smooth(ramp(c, 0.2, 1.2));
    sh.visible = k > 0.01; sh.count = 5;
    const put = (i, x, z, r, kk) => sh.set(i, O.x + (L.tx * x + L.nx * z) * SC, O.z + (L.tz * x + L.nz * z) * SC, r * SC, kk);
    put(0, 0.05, 0.47, 0.29, k); put(1, 0.1, 0.5, 0.44, 0.6 * k); put(2, TABLE.x, TABLE.z, 0.24, 0.95 * kt); put(3, TABLE.x + 0.05, TABLE.z + 0.03, 0.34, 0.5 * kt); put(4, 0.0, 0.62, 0.2, 0.45 * k);
    if (c > 1) this.soften(L, dt);
    voice.level = calm ? 0.8 : 1; voice.place();
    if (showing && !this.told && !L.quiet && u > 0.5) { this.told = true; L.k.say('She looks up from her book for as long as you look at her. Look away, and she reads on.', 5); }
    if (back && L.ret >= 1) this.hide();
  },
});
