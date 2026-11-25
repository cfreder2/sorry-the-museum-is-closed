// Berthe Morisot, Woman in a Garden (1882–83), Gallery 201. The word: fan.
//
// A woman sits on a green garden seat in a blue dress, a white fichu at her throat, a cream bonnet with a blue ribbon
// and a few flowers on it, tan gloves, and an open blue fan lying in her lap. Behind her a hedge on a diamond trellis;
// at the left a rake leant by the path. The museum's note says who she is is not known, and says how she is painted:
// "as if she were making a landscape", "without differentiating between the strokes used for the figure and setting".
// So in this picture a woman and a hedge are the same slashes of paint, and the eye finds her in the garden. The one
// thing of hers that could move is the fan, and a thing sitting still among leaves is seen when it moves. That is
// the show: she is in the garden all along, and it is her fan that gives her away.
//
// Look, and a bundle of grey-blue laths comes out of the wall under the picture and is drawn open towards the corner
// like a fan, the way an expanding trellis opens: its slits widen into her diamonds, and the hedge that was folded in
// it spreads with them, her greens in slashes, a few flowers at the near end, the rake carried along on its edge and
// left leaning. In front of the hedge the leaves bulge into a bush, where the seat would be. The garden has opened:
// there is nobody in it. Then something in the bush stirs, and a fan opens in the leaves, blue. A gloved hand lifts
// it, and it begins to beat; and with each beat the leaves about it lie down and take their colours, further out
// each time: a blue lap, a sleeve, the white at her throat, the green slats of the seat, and last a face under a
// cream bonnet. She was sitting there the whole time. She fans herself a little longer in the heat, lets the fan
// down open into her lap, and looks out at you: the picture, and the eye goes up to it. While you keep looking she
// stays, and now and then takes up the fan again. When you stop, the fan shuts, the greens ruffle back over her from
// the edges in until she is a bush again, the bush goes back into the hedge, and the trellis folds up into the wall.
//
// The tune: Claude Debussy, Première Arabesque (Deux arabesques, 1888–91; published in Paris by Durand in 1891), its
// first seven bars and the down-beat of the eighth, set down from the Mutopia Project's edition (after Durand): the
// two opening bars, which each rise and fall in one arpeggio, are the trellis opening and then the fan; the rocking
// bars that follow are the beats of the fan (one to a crotchet); the melody comes when she takes the fan up again.
// It has no words and no programme. Its title is the French word for an ornament of curving, leafy line (Debussy
// used it of Bach); the music is in E major and is not in any "Eastern" manner, and nothing here uses it to stand
// for a place or a people. It has been borrowed since for a television programme about the night sky, nothing that
// sits ill here.
//
// How she is made: of paint, with no bare form showing, on the plan of Corot's reader (81512-interrupted-reading.js).
// Under everything is a core a little smaller and darker than the form; what the eye sees is strokes lying over it,
// each a ribbon with a brush's print on it, tilted about its length so the edge of every form is ragged ends. Her
// face has no drawn features: it is planes of light and shade under the brim. She is about seven and a half heads.
// What is new here is that every stroke of her and of her seat has two states and the vertex shader goes between
// them: lying on her form in its own colour, or ruffled off it (turned about an axis of its own, lifted, larger) in
// one of the hedge's greens; and a shell of plain leaves round her shrinks away as she is found. Nothing flies in and
// nothing is brushed in: the strokes are all there from the start and are only told apart. One rig, one draw call
// (the trellis, hedge and fan are worked in the same shader), and one for the soft shadows.
//
// Where it is (all measured along the wall from the picture's middle, to the viewer's left): the shut bundle comes
// out under the picture, between its middle and 0.09 m to the right; the trellis opens leftwards from there to 1.4 m
// (1.45 m as it overshoots), towards the corner of the room, which is 2.7 m away on that side and has no picture on
// it. It stands 0.14 m out from the wall and at most 0.87 m high (shut; 0.7 m open), under the frame's foot at 0.91 m.
// She sits 0.32 m left of the middle, 0.5 m out, 0.64 m high to the top of her bonnet; her seat, the bush and the bit
// of grass reach no further than 0.16 m to the right of the middle, and nothing is more than 0.85 m from the wall.
// Beside it on the right hangs Morisot's Woman at Her Toilette, 1.13 m off: its puff lands 0.87 m to the right and
// its dusting thins to nothing about 0.4 m to the left of this picture's middle, so the last, thinnest half metre of
// that dusting is floor this show also stands on; the two are never out together (one show at a time in a room: the
// kit sends a lingering one home as another begins, and this one does not linger). Paris Street's paving, the
// acrobats' ring and the two sisters' wool and creeper are on the opposite wall, thirteen metres off, and Manet's
// table is two metres further along this one. She and her seat are soft to the toy: it is eased round them, never
// stopped dead.
// With "Reduce motion and flashing" on, the trellis opens without its overshoot, the leaves do not shiver, the
// fan beats half as far, and the clicks are quieter; nothing here flashes.
//
// What it does not do: the child in the straw hat at the back of the picture does not come out in any form, because
// she is a child (the museum thinks her likely based on the painter's daughter) and has nothing to do in a show but
// be looked at; the woman is given no name, no thoughts and no story, because the museum has none for her; and the
// folding trellis is this show's way of bringing her garden out, not something the picture says about its fence.
import * as THREE from 'three';
import { lifeFor, ease, ramp, clamp01, lerp, shape } from '../paintlife.js';
import { score, noise } from './stagecraft.js';
import { hz as nhz } from './tunes.js';

const TAU = Math.PI * 2;
const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const sstep = THREE.MathUtils.smoothstep, fall = (x, a, b) => 1 - sstep(x, a, b);      // (fall: 1 below a, 0 above b)
const hump = (t, a, b) => (t <= a || t >= b ? 0 : Math.sin(Math.PI * (t - a) / (b - a)));

// ---------------------------------------------------------------- the tune, and the show's clock
const BPM = 104, BT = 60 / BPM, TT = BT / 3, BAR = 4 * BT, T_M0 = 0.22;
const bar = k => T_M0 + k * BAR;                           // the down-beat of bar k (from 0), up to the rit. in the fifth
const B6 = bar(4) + 3 * BT + 5 * TT, B7 = B6 + BAR, B8 = B7 + BAR;      // after the rit.
const Z_IN = [0.06, 0.42], OPEN = [0.34, 1.44], GROW = [1.0, 2.2];     // the bundle out of the wall; drawn open; the bush out of the hedge
const STIR = bar(1) - 0.3, FAN_OPEN = [bar(1) + 0.02, bar(1) + 0.6];       // something moves; the fan opens (on the second arpeggio)
const W1 = { t0: bar(1) + 3 * BT, n: 5 }, W2 = { t0: B6 + BT, n: 7 };   // she fans herself: the first beat, and how many
const AGAIN = B8 + 5.2, EVERY = 9.5, LATER = 4;             // and afterwards, now and then
const FOUND = [[FAN_OPEN[0] - 0.08, 0.3, 0.45], [W1.t0 - 1.0, 0.22, 0.7], [W1.t0, 0.16, 0.5], [W1.t0 + BT, 0.16, 0.5], [W1.t0 + 2 * BT, 0.16, 0.55]];      // [when, how much more of her, over how long]
const RET = 2.2;

// ---------------------------------------------------------------- the scene (scene units: x along the wall to the right, y up, z out of the wall; SC metres each)
const SC = 1.2, U0 = -0.18;                                // its size; where its x = 0 lies along the wall from the picture's middle (m)
const TH0 = 0.07, TH1 = 0.63;                               // the trellis: shut, and open (the half angle of its diamonds)
const LS = 0.0875, LP = 24, LQ = 8, XR = 0.225, Y0 = 0.022, ZT = 0.115;      // lath spacing; nodes along and up; its right end; its foot; its plane
const leadAt = th => XR - LP * LS * Math.sin(th);           // where its opening edge is
const HIP = [-0.12, 0.41], DIR = [-0.36, 0.933];            // where she sits; the way her knees point (to the left, and out)
const WAIST = [-0.12, 0.238, 0.405];
const L1 = 0.128, L2 = 0.142;                               // upper arm; forearm to the middle of the hand
const NECK = [0, 0.158, 0.004], SH_R = [-0.062, 0.119, 0.004], SH_L = [0.062, 0.119, 0.004];
const LAP_L = [HIP[0] + DIR[0] * 0.088 + 0.012, 0.264, HIP[1] + DIR[1] * 0.088];      // her left hand, on the fan in her lap
const LAP_R = [HIP[0] - 0.062, 0.252, HIP[1] + 0.07];  // her right hand, in her lap
const UP_L = [WAIST[0] + 0.108, 0.3, WAIST[2] + 0.112];   // and lifted, to fan
const FAN_R = 0.108, FAN_N = 14, FAN_SPREAD = 2.7;
const RAKE = { x: -0.8, len: 0.64, pitch: 0.38, roll: 0.2 };
const BUSH = { c: [HIP[0] - 0.03, 0.25, HIP[1] + 0.035], r: [0.29, 0.31, 0.24] };
const SOFT = [[HIP[0] - 0.02, HIP[1] + 0.03, 0.27]];        // what the toy is eased round (x, z, reach)

// A brush's own print, for every mark (as the Corot has it): two drags (bristle lines, fuller in the middle, ragged at
// both ends, the second run dry), a soft round touch, and a plain patch for the bodies under them.
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

lifeFor(153798, {
  title: /^Woman in a Garden/,
  word: 'fan',
  // (the whole of the work in view, with the garden under it and to its left)
  stage: { out: 1.3, half: 1.5, cam: { dist: 2.7, side: -0.4, height: 0.95, fov: 60, lookU: -0.46, lookOut: 0.4, lookH: 0.98 } },
  wake: 2, ret: RET,

  build(L) {
    const P = L.pal, col = (h, a = 0.12) => P.near(h, a), C = (list, a) => list.map(h => col(h, a));
    this.O = L.floor(U0, -L.wall);
    this.B = new THREE.Matrix4().makeBasis(V3(L.tx * SC, 0, L.tz * SC), V3(0, SC, 0), V3(L.nx * SC, 0, L.nz * SC)).setPosition(this.O);
    this.V = { m: new THREE.Matrix4(), l: new THREE.Matrix4(), g: new THREE.Matrix4(), q: new THREE.Quaternion(), q2: new THREE.Quaternion(), e: new THREE.Euler(0, 0, 0, 'YXZ'), one: V3(1, 1, 1), up: V3(0, 1, 0),
      a: V3(), b: V3(), c: V3(), d: V3(), p1: V3(), p2: V3(), el: V3(), s: V3(), t: V3(), pos: V3(), w: V3(), x: V3(), y: V3(), z: V3() };
    this.M = {}; for (const n of ['torso', 'head', 'ru', 'rf', 'lu', 'lf', 'fan']) this.M[n] = new THREE.Matrix4();
    // the fan: lying open in her lap (its middle rib to the left, over her knee), and held up to beat
    const frame = (y, z) => { const yy = V3(...y).normalize(), zz = V3(...z); zz.addScaledVector(yy, -zz.dot(yy)).normalize(); return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(V3().crossVectors(yy, zz), yy, zz)); };
    this.QA = frame([-0.9, -0.2, 0.38], [-0.12, 0.82, 0.55]); this.QB = frame([-0.06, 0.99, -0.04], [-0.5, 0.0, 0.87]);
    this.IDLE = { breath: 0, gazeY: 0, gazeP: 0, psi: 0, sway: 0 };
    this.pose(0, this.IDLE);

    const R = () => L.rand();
    const KEY = V3(-0.45, 0.78, 0.44).normalize();          // the sun: from the upper left, a little in front
    const pick = (list, r) => list[Math.min(list.length - 1, Math.floor(r * list.length))];
    const set = (hi, mid, lo, deep, a) => ({ hi: C(hi, a), mid: C(mid, a), lo: C(lo, a), deep: C(deep, a) });
    const BL = set(['#5a6c9e', '#6676a6', '#526496'], ['#343f70', '#2e3968', '#3a477a'], ['#232a52', '#1f264a', '#272f5a'], ['#161a36', '#13172e']);       // her dress
    const WH = set(['#f2efe3', '#ede9db'], ['#dddecf', '#d6d8ca'], ['#bcc4b6', '#b4bdaf'], ['#98a598', '#909d90']);                                      // the fichu: white, going green-grey in its shade
    const CR = set(['#f4ead0', '#f1e5c6'], ['#e6d6ae', '#e0cfa6'], ['#cdb688', '#c6ae80'], ['#a8905e']);                                                 // the bonnet
    const FL = set(['#f3e8d6', '#f0e4d0'], ['#e8d9c0', '#e2d3ba'], ['#cbb99e', '#c4b298'], ['#a39178', '#9b8970']);                                      // her skin
    const GV = set(['#deba76', '#d8b26c'], ['#c69c56', '#be944e'], ['#a47c3e', '#9c7438'], ['#7e5c2c']);                                                 // her gloves
    const BG = set(['#62a088', '#58947e'], ['#2f6c57', '#2a6251'], ['#1d4a3c', '#1a4337'], ['#102c23']);                                                 // the seat
    const HD = set(['#4a7058', '#44694a'], ['#2e4f3a', '#2a4a36'], ['#1e3a2c', '#1a3328'], ['#12261c']);                                                 // the hedge, in its depths
    const BLH = C(['#3e5088', '#7388b4', '#27325e', '#343c6c', '#56648e', '#1e2246', '#8e9ec4', '#3a4460', '#4a5078', '#2c4058', '#6a7aa0', '#454a7e'], 0.1);       // the broken colour of each mass
    const WHH = C(['#f6f3e8', '#e4e6da', '#cdd5c8', '#eee6d0', '#b9c6ba', '#dfe4e2', '#f3efe2'], 0.06);
    const CRH = C(['#f6eed6', '#eadcb6', '#f2e4c0', '#dcc698', '#f8f2e0'], 0.08), FLH = C(['#f4ead8', '#e9dcc4', '#eedfce', '#dfd4ba', '#efe2cc'], 0.08);
    const GVH = C(['#d9b56d', '#c9a159', '#e1c181', '#b98d49'], 0.1), BGH = C(['#3a7a64', '#2a5c4c', '#6aa48c', '#1f4a3e', '#4c8a78', '#7fb09a'], 0.1);
    const G_DEEP = C(['#1f3d31', '#254536', '#1c382f', '#2b4c3a'], 0.12), G_MID = C(['#3c6248', '#466c4e', '#375a4c', '#4d745a', '#42705a'], 0.12);
    const G_ACID = C(['#86a056', '#98ac62', '#76924e', '#a8b870', '#8aa04c'], 0.1), G_PALE = C(['#93aba2', '#a6b9ae', '#809e98', '#bccab8'], 0.1);
    const LATH = C(['#8aa2b0', '#9db2bd', '#7892a4', '#a9bcc4', '#6f8a9e'], 0.1), PATH = C(['#7f9092', '#8b9a98', '#74868c', '#869498', '#94a096'], 0.14), GRASS = C(['#4f7a4c', '#5f8a50', '#3f6a48', '#7a9a58'], 0.12);
    const HAIR = C(['#c98f4e', '#bd8344', '#d49c5a', '#b0763c'], 0.1), FLOWER = C(['#c8584e', '#d67a70', '#e8c8bc', '#f0ead8', '#b8a0c8', '#e0a0a0', '#f4f0e4'], 0.08);
    const RIB = C(['#a3b2d6', '#8fa0cc', '#b9c5e0', '#7f92c2'], 0.08), RK_D = C(['#2a4650', '#223a44', '#345862'], 0.1), RK_H = C(['#b89a5c', '#a88a50', '#c8aa6c'], 0.1), IVORY = C(['#e8dcc0', '#d8cab0'], 0.08);
    const SOCK = col('#96806a', 0.08), EYE = col('#43362c', 0.06), BROW = col('#8e6c42', 0.08), ROSE = col('#bd6a60', 0.06), CHEEK = col('#e6ac98', 0.05), BRIM_SH = col('#d8be98', 0.08);
    // one of the hedge's greens, for a stroke that lies where n faces (the leaves in the sun are the acid ones)
    const green = (n, r) => { const k = n.dot(KEY), q = (r * 5.3) % 1, list = r < 0.26 - 0.16 * k ? G_DEEP : r < 0.66 - 0.12 * k ? G_MID : r < 0.89 ? G_ACID : G_PALE; return pick(list, q).clone().multiplyScalar(0.9 + 0.24 * Math.max(0, k)); };
    // The tone of a form where it faces the light; and a stroke on it: that tone, leaning to one of the mass's own colours.
    const under = S => { const c = new THREE.Color(); return n => { const k = n.dot(KEY); return c.copy(S.deep[0]).lerp(S.lo[0], sstep(k, -0.75, -0.3)).lerp(S.mid[0], sstep(k, -0.25, 0.2)).lerp(S.hi[1 % S.hi.length], sstep(k, 0.25, 0.75)).multiplyScalar(0.98); }; };
    const mixer = (S, hues, amt = 0.4, v = 0.14) => {
      const u = under(S), ref = S.mid[0], c = new THREE.Color();
      return (n, r) => { const h = pick(hues, (r * 7.31) % 1), a = amt * (0.4 + 1.2 * ((r * 3.17) % 1)), k = 1 + (r - 0.5) * v, f = (x, y) => lerp(1, Math.max(0.55, Math.min(1.6, x / Math.max(0.02, y))), a) * k; c.copy(u(n)); return new THREE.Color(c.r * f(h.r, ref.r), c.g * f(h.g, ref.g), c.b * f(h.b, ref.b)); };
    };

    // ---------------------------------------------------------- parts: bodies and the strokes on them
    // A part is one piece of the rig (it moves as one). Every vertex carries where its stroke's middle is (aCen), what
    // it is and when it is found (aA: kind, threshold, luck, a spare) and its other self (aB: the green it wears while
    // she is hidden; for the trellis, its node). Kinds: 0 a body; 1 a stroke on her or her seat; 2 a lath; 3 a leaf of
    // the hedge; 4 a stroke on the ground; 5 a leaf of the bush round her; 6 a leaf of the fan.
    const FANC = V3(LAP_L[0] - 0.045, LAP_L[1] - 0.02, LAP_L[2] + 0.02);
    const part = (rest, hid = true) => { rest = rest ? rest.clone() : new THREE.Matrix4(); return { pos: [], nor: [], col: [], uv: [], cen: [], a: [], b: [], rest, inv: rest.clone().invert(), n: 0, hid }; };
    const side = V3(), d2 = V3(), cl = V3(), wp = V3(), nW = V3(), ca = new THREE.Color(), cb = new THREE.Color();
    const vert = (Pt, p, n, c, uv, cen, A, Bv) => { Pt.pos.push(p.x, p.y, p.z); Pt.nor.push(n.x, n.y, n.z); Pt.col.push(c.r, c.g, c.b); Pt.uv.push(uv[0], uv[1]); Pt.cen.push(cen.x, cen.y, cen.z); Pt.a.push(A[0], A[1], A[2], A[3]); Pt.b.push(Bv[0], Bv[1], Bv[2]); Pt.n++; };
    const world = (Pt, n) => nW.copy(n).transformDirection(Pt.rest);      // (a part's normal as it rests: the sun is the room's)
    const thrOf = (w, luck = 0.1) => Math.min(0.86, 0.74 * clamp01(w.distanceTo(FANC) / 0.43) + luck * R());
    // A body: paint(normal in the room, where, its own normal) for each vertex. Hidden, it is the dark of the hedge.
    const solid = (Pt, g, paint) => {
      const p = g.attributes.position, n = g.attributes.normal, v = V3(), nn = V3(), cc = new THREE.Color(), dk = new THREE.Color();
      for (let i = 0; i < p.count; i++) {
        v.fromBufferAttribute(p, i); nn.fromBufferAttribute(n, i); cc.copy(paint(world(Pt, nn), v, nn));
        dk.copy(HD.lo[0]).lerp(HD.mid[0], sstep(nW.dot(KEY), -0.2, 0.7)).multiplyScalar(0.8);
        vert(Pt, v, nn, cc, UV_SOLID, v, [0, Pt.hid ? thrOf(wp.copy(v).applyMatrix4(Pt.rest), 0) : -1, 0, 0], [dk.r, dk.g, dk.b]);
      }
    };
    // A ribbon of paint through six points lying on a form (Ps, with the form's normal at each, Ns), w wide, with the
    // brush's print on it (cell: 0 a drag, 1 a dry one, 2 a round touch): close on the form where the brush set down,
    // its dry end lifted a little and one long edge too, so the strokes overlap as feathers do and the edge of a form
    // is their ragged ends, found and lost, never the outline of the body under them.
    const ribbon = (Pt, Ps, Ns, w, c, { lift = 0.0018, tip = 0.004, ridge = 0.07, cell = -1, tilt = 0.36, kind = 1, bv = null, thr = null, thrFn = null, aw = 0 } = {}) => {
      const k = cell < 0 ? (R() < 0.5 ? 0 : 1) : cell, flip = R() < 0.5, A = [], Bq = [], ua = [], ub = [], mid = Ps[2].clone().add(Ps[3]).multiplyScalar(0.5);
      const ta = tilt * (0.5 + R()) * (R() < 0.5 ? -1 : 1), cw = Math.cos(ta) * w / 2, sw = Math.sin(ta) * w / 2;      // (tilted about its length: one long edge lifted)
      for (let i = 0; i < 6; i++) {
        d2.copy(Ps[Math.min(5, i + 1)]).sub(Ps[Math.max(0, i - 1)]); side.crossVectors(Ns[i], d2); if (side.lengthSq() < 1e-14) return; side.normalize();
        const s = flip ? 1 - i / 5 : i / 5;
        cl.copy(Ps[i]).addScaledVector(Ns[i], lift + tip * s * s);
        A.push(cl.clone().addScaledVector(side, -cw).addScaledVector(Ns[i], -sw)); Bq.push(cl.clone().addScaledVector(side, cw).addScaledVector(Ns[i], sw)); ua.push(UVQ(k, s, 0)); ub.push(UVQ(k, s, 1));
      }
      ca.copy(c).multiplyScalar(1 + ridge); cb.copy(c).multiplyScalar(1 - ridge * 0.7);
      wp.copy(mid).applyMatrix4(Pt.rest);
      const seed = R(), t = thr != null ? thr : thrFn ? thrFn(wp) : kind === 1 || kind === 5 ? (Pt.hid ? thrOf(wp) : -1) : 0;
      let Bv = bv; if (!Bv) { const g = green(world(Pt, Ns[2]), R()); Bv = [g.r, g.g, g.b]; }
      const a4 = [kind, t, seed, aw];
      for (let i = 0; i < 5; i++) { vert(Pt, A[i], Ns[i], cb, ua[i], mid, a4, Bv); vert(Pt, Bq[i + 1], Ns[i + 1], ca, ub[i + 1], mid, a4, Bv); vert(Pt, Bq[i], Ns[i], ca, ub[i], mid, a4, Bv); vert(Pt, A[i], Ns[i], cb, ua[i], mid, a4, Bv); vert(Pt, A[i + 1], Ns[i + 1], cb, ua[i + 1], mid, a4, Bv); vert(Pt, Bq[i + 1], Ns[i + 1], ca, ub[i + 1], mid, a4, Bv); }
    };
    // One stroke on something flat (or a touch too small to need bending): at p (normal n), along dir, l long and w wide.
    const stroke = (Pt, p, n, dir, l, w, c, { bend = 0, ...o } = {}) => {
      side.crossVectors(n, dir); if (side.lengthSq() < 1e-8) return; side.normalize(); const dd = V3().crossVectors(side, n).normalize(), sd = side.clone(), Ps = [], Ns = [];
      for (let i = 0; i < 6; i++) { const s = i / 5 - 0.5; Ps.push(p.clone().addScaledVector(dd, s * l).addScaledVector(sd, bend * l * (1 - 4 * s * s))); Ns.push(n); }
      ribbon(Pt, Ps, Ns, w, c, o);
    };
    // The way a stroke runs on a surface: `flow` laid into the surface, turned a little.
    const q_ = new THREE.Quaternion();
    const along = (n, flow, jit) => { const d = flow.clone().addScaledVector(n, -flow.dot(n)); if (d.lengthSq() < 1e-4) d.set(n.y, -n.x, 0); if (d.lengthSq() < 1e-6) d.set(1, 0, 0); return d.normalize().applyQuaternion(q_.setFromAxisAngle(n, (R() - 0.5) * jit)); };
    const DOWN = V3(0, -1, 0), ACROSS = V3(1, 0, 0), SLASH = V3(0.55, -0.83, 0);
    // A rounded body (an ellipsoid: centre, radii, turned), painted smoothly; keep(normal) leaves part of it out.
    const dk = new THREE.Color();
    const ball = (Pt, Cn, Rd, paint, { rot = [0, 0, 0], detail = 3, shrink = 0.94, dark = 0.8, keep = null } = {}) => {
      let g = shape.ball(1, 0xffffff, detail);
      if (keep) { const p = g.attributes.position, out = [], v = V3(); for (let f = 0; f < p.count; f += 3) { v.set(p.getX(f) + p.getX(f + 1) + p.getX(f + 2), p.getY(f) + p.getY(f + 1) + p.getY(f + 2), p.getZ(f) + p.getZ(f + 1) + p.getZ(f + 2)).normalize(); if (keep(v)) for (let j = 0; j < 3; j++) out.push(p.getX(f + j), p.getY(f + j), p.getZ(f + j)); } g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(out, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(out, 3)); }
      solid(Pt, shape.move(g, Cn[0], Cn[1], Cn[2], rot[0], rot[1], rot[2], Rd[0] * shrink, Rd[1] * shrink, Rd[2] * shrink), (nw, v, nn) => dk.copy(paint(nw, v, nn)).multiplyScalar(dark));
    };
    // A coat of n strokes over an ellipsoid, each an arc on it (so it lies on it from end to end); tn(normal in the room, luck, its own normal) its colour.
    const coat = (Pt, Cn, Rd, n, tn, { rot = [0, 0, 0], l = [0.03, 0.05], w = [0.014, 0.022], flow = DOWN, jit = 0.6, keep = null, grow = 1.0, ...o } = {}) => {
      const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(rot[0], rot[1], rot[2], 'YXZ')), qi = q.clone().invert(), c = V3(...Cn), Rm = (Rd[0] + Rd[1] + Rd[2]) / 3;
      for (let i = 0; i < n; i++) {
        const yy = 1 - 2 * R(), ph = R() * TAU, s = Math.sqrt(Math.max(0, 1 - yy * yy)), u0 = V3(s * Math.cos(ph), yy, s * Math.sin(ph));
        const p = V3(u0.x * Rd[0] * grow, u0.y * Rd[1] * grow, u0.z * Rd[2] * grow).applyQuaternion(q).add(c), nn = V3(u0.x / Rd[0], u0.y / Rd[1], u0.z / Rd[2]).normalize().applyQuaternion(q);
        const r1 = R(), r2 = R(), r3 = R();
        if (keep && !keep(p, nn, u0)) continue;
        const d = along(u0, flow.clone().applyQuaternion(qi), jit), len = lerp(l[0], l[1], r1), Ps = [], Ns = [];
        for (let k = 0; k < 6; k++) { const al = (k / 5 - 0.5) * len / Rm, u = u0.clone().multiplyScalar(Math.cos(al)).addScaledVector(d, Math.sin(al)); Ps.push(V3(u.x * Rd[0] * grow, u.y * Rd[1] * grow, u.z * Rd[2] * grow).applyQuaternion(q).add(c)); Ns.push(V3(u.x / Rd[0], u.y / Rd[1], u.z / Rd[2]).normalize().applyQuaternion(q)); }
        ribbon(Pt, Ps, Ns, lerp(w[0], w[1], r2), tn(world(Pt, nn).clone(), r3, nn, p), o);
      }
    };
    // A limb along the part's own +y: prof = [[radius, y], ...] from its root, rounded off at both ends; soft strokes
    // down it. Sy(y) is the colour set at that height (a sleeve, then a glove), tn(normal, luck, y) a stroke's colour.
    const tube = (Pt, prof, Sy, n, tn, { w = [0.012, 0.018], l = [0.03, 0.05], shrink = 0.86, dark = 0.84, ...o } = {}) => {
      const us = new Map(), u = (nn, y) => { const S = Sy(y); if (!us.has(S)) us.set(S, under(S)); return dk.copy(us.get(S)(nn)).multiplyScalar(dark); };
      const y0 = prof[0][1], y1 = prof[prof.length - 1][1], rAt = y => { for (let i = 1; i < prof.length; i++) if (y <= prof[i][1]) return lerp(prof[i - 1][0], prof[i][0], (y - prof[i - 1][1]) / (prof[i][1] - prof[i - 1][1])); return prof[prof.length - 1][0]; };
      const fine = []; for (let i = 0; i <= 14; i++) { const y = lerp(y0, y1, i / 14); fine.push([rAt(y) * shrink, y]); }
      solid(Pt, shape.lathe(fine, 18, 0xffffff), (nn, v) => u(nn, v.y));
      for (const [r, y] of [prof[0], prof[prof.length - 1]]) solid(Pt, shape.move(shape.ball(r * shrink, 0xffffff, 2), 0, y, 0), nn => u(nn, y));
      for (let i = 0; i < n; i++) {
        const len = lerp(l[0], l[1], R()), yc = lerp(y0 + len / 2, y1 - len / 2, R()), ph = R() * TAU, nn = V3(Math.cos(ph), 0, Math.sin(ph)), Ps = [], Ns = [], tw = (R() - 0.5) * 0.5;
        for (let k = 0; k < 6; k++) { const y = yc + (k / 5 - 0.5) * len, r = rAt(y), a = ph + tw * (k / 5 - 0.5), m = V3(Math.cos(a), 0, Math.sin(a)); Ps.push(V3(m.x * r, y, m.z * r)); Ns.push(m); }
        ribbon(Pt, Ps, Ns, lerp(w[0], w[1], R()), tn(world(Pt, nn).clone(), R(), yc), o);
      }
    };
    // A lofted form: rings from its foot up ({ y, c: [x, z], r1, r2 }), r1 along `ax` and r2 across it, round (pow 2)
    // or square-shouldered, fluted if asked (real folds); smooth all over, painted paint(normal in the room, how far
    // up, how far round, where, its own normal). Returns how to find a point and its normal on it, and how to lay a stroke on it.
    const loft = (Pt, rings, paint, { ax = [1, 0], pow = 2, flute = null, seg = 32, rows = 12, cap = false, shrink = 0.95, dark = 0.76 } = {}) => {
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
      const cols = new Map(), key = v => `${v.x.toFixed(5)},${v.y.toFixed(5)},${v.z.toFixed(5)}`;
      { const n = g.attributes.normal, k = pos.length / 3; for (let i = 0; i < k; i++) { pa.fromBufferAttribute(g.attributes.position, i); pb.fromBufferAttribute(n, i); const j = Math.min(rows, Math.floor(i / seg)); cols.set(key(pa), paint(world(Pt, pb), i < N * seg ? j / rows : 1, (i % seg) / seg * TAU, pa, pb).clone().multiplyScalar(dark)); } }
      g = g.toNonIndexed();
      solid(Pt, g, (nw, v) => cols.get(key(v)) || HD.lo[0]);
      // a stroke lying on it: from (v + dv / 2) down to (v - dv / 2), drifting dth round it
      const lay = (v, th, dv, dth, w, c, o) => { const Ps = [], Ns = []; for (let k = 0; k < 6; k++) { const s = k / 5 - 0.5; Ps.push(at(v - s * dv, th + s * dth)); Ns.push(normal(v - s * dv, th + s * dth)); } ribbon(Pt, Ps, Ns, w, c, o); };
      return { at, normal, lay };
    };
    const M = this.M;

    // ---------------------------------------------------------- the trellis and its hedge: laths in two leans, pinned
    // where they cross, so the whole of it draws out and folds up (the vertex shader keeps every pin and every leaf in
    // its place on it); her greens over it in slashes, thick behind where she sits, thin at the top and the far end,
    // where the diamonds show
    const hedge = part(null, false);
    {
      const zero = V3(), nz = V3(0, 0, 1), cL = new THREE.Color();
      const lath = (p0, q0, p1, q1, fam) => {
        const c0 = pick(LATH, R()), n = Math.abs(p1 - p0), hw = 0.0058 + 0.0012 * R(), z = ZT + (fam > 0 ? 0.003 : 0), seed = R();
        for (let i = 0; i < n; i++) {
          const pa = p0 + i, pb = pa + 1, qa = q0 + (q1 > q0 ? i : -i), qb = qa + (q1 > q0 ? 1 : -1), k = R() < 0.5 ? 0 : 1;
          cL.copy(c0).multiplyScalar(0.9 + 0.2 * R());
          const v = (p, q, sw, s, t) => vert(hedge, V3(0, 0, z), nz, cL, UVQ(k, s, t), zero, [2, 0, seed, sw * hw], [p, q, fam]);
          v(pa, qa, -1, 0, 0); v(pb, qb, 1, 1, 1); v(pa, qa, 1, 0, 1); v(pa, qa, -1, 0, 0); v(pb, qb, -1, 1, 0); v(pb, qb, 1, 1, 1);
        }
      };
      for (let c = -LQ; c <= LP; c += 2) { const p0 = Math.max(0, c), p1 = Math.min(LP, c + LQ); if (p1 > p0) lath(p0, p0 - c, p1, p1 - c, 1); }
      for (let c = 0; c <= LP + LQ; c += 2) { const p0 = Math.max(0, c - LQ), p1 = Math.min(LP, c); if (p1 > p0) lath(p0, c - p0, p1, c - p1, -1); }
      const S1 = Math.sin(TH1), C1 = Math.cos(TH1), n = V3(), dir = V3();
      for (let p = 0; p <= LP; p++) for (let q = p % 2; q <= LQ; q += 2) {
        const x = XR - p * LS * S1, y = Y0 + q * LS * C1, bv = [p, q, 0];
        const dens = sstep(x, -1.08, -0.68) * (1 - 0.72 * sstep(y, 0.33, 0.5)) * (1 - 0.4 * sstep(x, 0.06, 0.2)), o = { kind: 3, bv, tilt: 0.2, tip: 0.006 };
        if (dens > 0.3) stroke(hedge, V3(x + (R() - 0.5) * 0.04, y + (R() - 0.5) * 0.04, ZT - 0.007), nz, along(nz, SLASH, 2.6), 0.21, 0.12, pick(G_DEEP, R()).clone().multiplyScalar(0.84 + 0.2 * R()), { ...o, cell: 2, tilt: 0.05, tip: 0, lift: 0 });      // the dark of it, behind the laths
        const k = Math.floor(dens * 7.5 + R());
        for (let i = 0; i < k; i++) {
          n.set((R() - 0.5) * 0.5, (R() - 0.4) * 0.4, 1).normalize();
          const r = R(), a = r < 0.46 ? -0.95 + (R() - 0.5) * 0.7 : r < 0.8 ? 0.6 + (R() - 0.5) * 0.8 : (R() - 0.5) * 0.5; dir.set(Math.cos(a), Math.sin(a), 0);
          const yy = Math.min(Y0 + LQ * LS * C1 + 0.02, y + (R() - 0.5) * 0.11), top = sstep(yy, 0.3, 0.56);
          stroke(hedge, V3(x + (R() - 0.5) * 0.12, yy, ZT + 0.008 + R() * 0.04), n.clone(), along(n, dir, 0.2), lerp(0.07, 0.12, R()), lerp(0.03, 0.055, R()), green(V3(n.x, n.y + top * 0.6, n.z).normalize(), R()), o);
        }
        // a few flowers at the near end, where her flower bed is
        if (x > -0.02 && y < 0.34 && R() < 0.75) for (let i = 0; i < 2; i++) { n.set((R() - 0.5) * 0.6, 0.2, 1).normalize(); stroke(hedge, V3(x + (R() - 0.5) * 0.1, y + (R() - 0.5) * 0.1, ZT + 0.05 + R() * 0.02), n.clone(), along(n, ACROSS, 6), 0.03 + 0.016 * R(), 0.026 + 0.012 * R(), pick(FLOWER, R()), { ...o, cell: 2, tilt: 0.2 }); }
      }
    }

    // ---------------------------------------------------------- the ground: the pale path at the left, grass under the
    // seat; separate drags with gaps between, no edge
    const ground = part(null, false);
    {
      const up = V3(0, 1, 0);
      for (let i = 0; i < 30; i++) {
        const path = i < 12, x = path ? RAKE.x + lerp(-0.2, 0.22, R()) : lerp(-0.45, 0.28, R()), z = path ? ZT + 0.1 + R() * 0.34 : ZT + 0.04 + Math.pow(R(), 1.3) * 0.5;
        stroke(ground, V3(x, 0.004 + R() * 0.004, z), up, along(up, path ? ACROSS : V3(0.8, 0, 0.5), path ? 0.5 : 1.6), lerp(0.08, 0.15, R()), lerp(0.028, 0.045, R()), path ? pick(PATH, R()) : pick(GRASS, R()).clone().multiplyScalar(0.95), { kind: 4, tilt: 0.04, tip: 0.001, lift: 0, cell: R() < 0.5 ? 0 : 1 });
      }
    }

    // ---------------------------------------------------------- the rake: a pole and a head of teeth (it stands on its
    // head; its own +y runs up the pole)
    const rake = part(null, false);
    {
      const HN = { hi: RK_H, mid: RK_H, lo: [RK_H[1]], deep: [RK_D[0]] }, TL = { hi: [RK_D[2]], mid: RK_D, lo: [RK_D[1]], deep: [RK_D[1]] }, len = RAKE.len;
      tube(rake, [[0.0062, 0.02], [0.006, len * 0.5], [0.0052, len]], y => (y > len * 0.36 ? HN : TL), 22, (nw, r, y) => pick(y > len * 0.36 ? RK_H : RK_D, r), { w: [0.007, 0.01], l: [0.06, 0.11], shrink: 0.8, tip: 0.001, lift: 0.001, tilt: 0.2 });
      const uT = under(TL), c = new THREE.Color();
      solid(rake, shape.move(shape.box(0.13, 0.011, 0.011, 0xffffff), 0, 0.03, 0), nw => c.copy(uT(nw)));
      for (let i = 0; i < 7; i++) solid(rake, shape.move(shape.box(0.005, 0.03, 0.005, 0xffffff), (i - 3) * 0.02, 0.015, 0.004, 0.25), nw => c.copy(uT(nw)));
      for (let i = 0; i < 4; i++) stroke(rake, V3((i - 1.5) * 0.03, 0.036, 0.003), V3(0, 0.6, 0.8).normalize(), ACROSS, 0.05, 0.012, pick(RK_D, R()).clone().multiplyScalar(1.25), { tip: 0.001, tilt: 0.1 });
    }

    // ---------------------------------------------------------- the seat: green slats, an arm at each end
    const bench = part();
    {
      const uB = under(BG), tb = mixer(BG, BGH, 0.5, 0.26), c = new THREE.Color();
      const plank = (cx, cy, cz, sx, sy, sz, n) => {
        solid(bench, shape.move(shape.box(sx * 0.94, sy * 0.94, sz * 0.94, 0xffffff), cx, cy, cz), nw => c.copy(uB(nw)).multiplyScalar(0.78));
        const ax = sx >= sy && sx >= sz ? 0 : sy >= sz ? 1 : 2, len = [sx, sy, sz][ax], dir = V3(ax === 0 ? 1 : 0, ax === 1 ? 1 : 0, ax === 2 ? 1 : 0);
        for (const nn of [V3(0, 1, 0), V3(0, 0, 1), V3(-1, 0, 0), V3(1, 0, 0), V3(0, 0, -1)]) {
          if (Math.abs(nn.dot(dir)) > 0.5) continue;
          const wd = nn.x ? (ax === 1 ? sz : sy) : nn.y ? (ax === 0 ? sz : sx) : (ax === 0 ? sy : sx), off = nn.x ? sx / 2 : nn.y ? sy / 2 : sz / 2, m = Math.max(1, Math.round(n * (nn.z < 0 ? 0.4 : 1)));
          for (let i = 0; i < m; i++) { const l = Math.min(len, lerp(0.07, 0.13, R())), s = (R() - 0.5) * (len - l); stroke(bench, V3(cx, cy, cz).addScaledVector(dir, s).addScaledVector(nn, off), nn, along(nn, dir, 0.16), l, wd * lerp(0.8, 1.15, R()), tb(nn.clone(), R()), { tip: 0.0015, lift: 0.001, tilt: 0.14, ridge: 0.1 }); }
        }
      };
      const BX = -0.06, BZ = 0.36, W = 0.46, zb = 0.275;
      for (let i = 0; i < 4; i++) plank(BX, 0.178, 0.29 + i * 0.05, W, 0.012, 0.038, 4);                         // the seat
      for (let i = 0; i < 3; i++) plank(BX, 0.25 + i * 0.062, zb - i * 0.006, W, 0.036, 0.011, 4);               // its back
      for (const sx of [-1, 1]) {
        const x = BX + sx * (W / 2 + 0.008);
        plank(x, 0.2, zb - 0.008, 0.018, 0.4, 0.018, 3); plank(x, 0.135, 0.45, 0.018, 0.27, 0.018, 2);           // a post behind, a post in front
        plank(x, 0.274, 0.365, 0.024, 0.014, 0.2, 3);                                                             // the arm
      }
    }

    // ---------------------------------------------------------- the bush she is hidden in: plain leaves round her,
    // which draw off as she is found
    const bush = part();
    {
      // (the ones between the fan and whoever is looking go first, so the fan is seen to open)
      const VIEW = V3(0.04, 0.22, 1).normalize(), dq = V3(), thrFn = w => { dq.copy(w).sub(FANC); const along_ = dq.dot(VIEW); if (along_ > -0.04) dq.addScaledVector(VIEW, -along_); return Math.min(0.8, 0.62 * clamp01(dq.length() / 0.36) + 0.06 * R()); };
      const lobes = [[BUSH.c, BUSH.r, 230], [[BUSH.c[0] + DIR[0] * 0.13 - 0.03, 0.13, BUSH.c[2] + DIR[1] * 0.1], [0.2, 0.16, 0.2], 90], [[BUSH.c[0] + 0.2, 0.2, BUSH.c[2] - 0.05], [0.15, 0.22, 0.16], 80], [[BUSH.c[0] - 0.02, 0.28, BUSH.c[2] - 0.02], [0.2, 0.22, 0.17], 110]];
      for (const [cc, rr, n] of lobes) coat(bush, cc, rr, n, (nw, r) => green(nw, r), { l: [0.08, 0.14], w: [0.04, 0.065], flow: SLASH, jit: 3, tilt: 0.34, tip: 0.01, lift: 0.004, kind: 5, thrFn, keep: p => p.y > 0.012 && p.z > ZT + 0.03 });
    }

    // ---------------------------------------------------------- her skirt: one blue mass from her waist over her knees
    // to the ground, in long slashes, lighter along the folds
    const skirt = part();
    {
      const ring = (y, s, r1, r2) => ({ y, c: [HIP[0] + DIR[0] * s, HIP[1] + DIR[1] * s], r1, r2 });
      const F = (v, th) => { const t = th + 0.2 * Math.sin(2.3 * v + 1); return 0.5 * Math.sin(t * 5 + 1.1) + 0.32 * Math.sin(t * 8 + 4.0) + 0.18 * Math.sin(t * 13 + 2.2); };
      const amp = v => (0.015 + 0.075 * Math.pow(1 - v, 1.25)) * fall(v, 0.8, 0.97);
      const fl = (v, th) => 1 + amp(v) * F(v, th);
      const uS = under(BL), c = new THREE.Color(), HOLLOW = BL.deep[1];
      const paint = (nw, v, th) => c.copy(uS(nw)).lerp(HOLLOW, 0.6 * fall(F(v, th), -0.75, 0.05) * sstep(amp(v), 0.01, 0.05)).multiplyScalar((1 + 0.08 * sstep(F(v, th), 0.3, 0.9)) * (0.76 + 0.24 * sstep(v, 0.01, 0.1)));
      const S = loft(skirt, [ring(0, 0.112, 0.138, 0.152), ring(0.014, 0.112, 0.13, 0.144), ring(0.06, 0.102, 0.126, 0.136), ring(0.13, 0.086, 0.132, 0.13), ring(0.19, 0.068, 0.138, 0.126), ring(0.222, 0.05, 0.116, 0.104), ring(0.24, 0.012, 0.07, 0.068), ring(0.252, -0.004, 0.054, 0.054)], paint, { ax: DIR, flute: fl, seg: 64, rows: 16, shrink: 0.965, dark: 0.84 });
      const tn = mixer(BL, BLH, 0.62, 0.36), n = V3();
      for (let i = 0; i < 250; i++) {
        const dv = lerp(0.18, 0.4, R()), v = lerp(0.05 + dv / 2, 0.84 - dv / 2, Math.pow(R(), 1.1)), th = R() * TAU, f = F(v, th); S.normal(v, th, n);
        const c2 = tn(n, R()); if (f < -0.3) c2.lerp(HOLLOW, 0.4); else if (f > 0.45) c2.multiplyScalar(1.12);
        if (R() < 0.12) c2.lerp(pick(RIB, R()), 0.55);                    // a light slash, here and there
        const diag = R() < 0.4;
        S.lay(v, th, diag ? dv * 0.6 : dv, diag ? (R() < 0.5 ? -1 : 1) * (0.5 + 0.6 * R()) : (R() - 0.5) * 0.44, lerp(0.022, 0.044, R()) * (1 - 0.3 * v), c2, { ridge: 0.14, tilt: 0.46, tip: 0.008 });
      }
      for (let i = 0; i < 70; i++) { const v = 0.8 + 0.12 * R(), th = R() * TAU; S.normal(v, th, n); S.lay(v, th, 0.13, (R() - 0.5) * 0.5, lerp(0.016, 0.028, R()), tn(n, R()), { ridge: 0.08, tip: 0.003 }); }      // over her lap
      for (let i = 0; i < 44; i++) { const th = R() * TAU; S.normal(0.05, th, n); S.lay(0.05, th, 0.1 + 0.05 * R(), (R() - 0.5) * 0.3, 0.024 + 0.014 * R(), tn(n, R()).multiplyScalar(0.8), { cell: 1, tip: 0.012, tilt: 0.5 }); }                  // its hem, on the ground
    }

    // ---------------------------------------------------------- her body, from the waist: the blue bodice, the white
    // fichu falling from her throat, her shoulders sloping into her neck (all one form)
    const torso = part(M.torso);
    {
      const TR = [[-0.014, 0.054, 0.046, 0], [0.02, 0.055, 0.047, 0], [0.058, 0.063, 0.053, 0.002], [0.094, 0.068, 0.055, 0.003], [0.12, 0.067, 0.048, 0.001], [0.136, 0.054, 0.04, 0], [0.148, 0.034, 0.03, 0.002], [0.16, 0.021, 0.021, 0.004], [0.174, 0.017, 0.017, 0.004]];
      const uD = under(BL), uW = under(WH), c = new THREE.Color(), c2 = new THREE.Color();
      const white = (p, nl) => Math.max(sstep(p.y, 0.128, 0.138), nl.z > 0.2 ? fall(Math.abs(p.x), 0.012 + 0.2 * Math.max(0, p.y - 0.035), 0.02 + 0.24 * Math.max(0, p.y - 0.035)) * sstep(p.y, 0.035, 0.05) : 0);
      const paint = (nw, v, th, p, nl) => c.copy(uD(nw)).lerp(c2.copy(uW(nw)), white(p, nl));
      const S = loft(torso, TR.map(([y, r1, r2, z]) => ({ y, c: [0, z], r1, r2 })), paint, { seg: 36, rows: 26, shrink: 0.93, dark: 0.8 });
      const tw = mixer(WH, WHH, 0.5, 0.14), td = mixer(BL, BLH, 0.62, 0.36), n = V3();
      for (let i = 0; i < 150; i++) {      // the bodice: blue slashes, down and across
        const v = 0.04 + 0.66 * R(), th = R() * TAU, dn = R() < 0.6; S.normal(v, th, n);
        S.lay(v, th, dn ? lerp(0.1, 0.2, R()) : 0.03 * (R() - 0.5), dn ? (R() - 0.5) * 0.3 : 0.4 + 0.3 * R(), lerp(0.013, 0.021, R()), td(world(torso, n).clone(), R()), { ridge: 0.09, tip: 0.002 });
      }
      for (let i = 0; i < 3; i++) { const th = Math.PI / 2 + (i - 1) * 0.22; S.normal(0.1, th, n); S.lay(0.1, th, 0.004, 0.16, 0.008, pick(WHH, R()), { cell: 2, lift: 0.003, tip: 0 }); }      // white at her waist
      for (let i = 0; i < 90; i++) {       // the fichu: broken whites, falling from her throat, lifted off her
        const v = 0.3 + 0.62 * Math.pow(R(), 0.8), wd = 0.14 + 1.5 * sstep(v, 0.3, 0.86) + (v > 0.8 ? 3 : 0), th = Math.PI / 2 + (R() - 0.5) * wd; S.normal(v, th, n);
        S.lay(v, th, lerp(0.09, 0.18, R()), (R() - 0.5) * 0.3, lerp(0.011, 0.02, R()), tw(world(torso, n).clone(), R()), { ridge: 0.1, tip: 0.007, lift: 0.002 + 0.006 * R(), tilt: 0.5 });
      }
      for (let i = 0; i < 26; i++) { const v = 0.8 + 0.14 * R(), th = R() * TAU; S.normal(v, th, n); S.lay(v, th, 0.016 * (R() - 0.5), 0.5 + 0.4 * R(), lerp(0.011, 0.016, R()), tw(world(torso, n).clone(), R()), { ridge: 0.08, tip: 0.003, lift: 0.003 }); }      // round her neck, and the bonnet's ties
      for (let i = 0; i < 12; i++) { const v = 0.2 + 0.14 * R(), th = Math.PI / 2 + (R() - 0.5) * 0.3; S.normal(v, th, n); S.lay(v, th, lerp(0.08, 0.12, R()), (R() - 0.5) * 0.2, 0.012, tw(world(torso, n).clone(), R()), { ridge: 0.1, tip: 0.006, lift: 0.004 }); }      // its tail
    }

    // ---------------------------------------------------------- her head: no drawn features (the shade her eyes lie in
    // under the brim, a lit cheek, a mouth barely there, all in the form); a fringe; the bonnet, its ribbon and flowers
    const head = part(M.head);
    { const NK = { hi: WH.mid, mid: WH.mid, lo: WH.lo, deep: WH.deep }; tube(head, [[0.0168, -0.018], [0.016, 0.0], [0.0155, 0.024]], () => NK, 12, mixer(NK, WHH, 0.3, 0.08), { l: [0.02, 0.03], w: [0.01, 0.014], cell: 2, tip: 0.001, tilt: 0.2, ridge: 0.03, dark: 0.95 }); }
    {
      const uF = under(FL), uC = under(CR), c = new THREE.Color(), c3 = new THREE.Color();
      const SKc = [0, 0.058, 0.004], SKr = [0.0335, 0.041, 0.036], BNc = [0, 0.064, -0.007], BNr = [0.043, 0.0445, 0.046];
      const WAX = V3(0, -0.41, 0.912), YAX = V3(0, 0.912, 0.41), open = n => n.dot(WAX);      // how far a point looks out of the bonnet's opening
      const hairy = n => sstep(n.y - 0.1 * n.z, 0.38, 0.5) * (n.z > 0 ? 1 : 0);
      const gz = (n, x, y, z, rx, ry = rx) => { const k = 1 / Math.hypot(x, y, z), dx = (n.x - x * k) / rx, dy = (n.y - y * k) / ry, dz = (n.z - z * k) / rx; return Math.exp(-(dx * dx + dy * dy + dz * dz)); };
      const face = (nw, v, nn) => {
        if (open(nn) < 0.02) return c.copy(uC(nw)).multiplyScalar(0.8);
        c.copy(uF(nw)).lerp(SOCK, 0.34 * sstep(Math.abs(nn.x), 0.5, 0.92) + 0.1 * sstep(nn.x, 0.1, 0.8));      // her temples and jaw, in the bonnet's shade; the far side a little more
        c.lerp(BRIM_SH, 0.36 * sstep(nn.y, 0.14, 0.42));                                                     // the warm shade of the brim, over her brow
        for (const sx of [-1, 1]) c.lerp(BROW, 0.5 * gz(nn, sx * 0.42, 0.25, 0.88, 0.22, 0.045)).lerp(SOCK, 0.55 * gz(nn, sx * 0.4, 0.1, 0.9, 0.24, 0.15)).lerp(EYE, 0.92 * gz(nn, sx * 0.4, 0.08, 0.9, 0.125, 0.07)).lerp(CHEEK, 0.5 * gz(nn, sx * 0.56, -0.26, 0.8, 0.22));
        c.lerp(SOCK, 0.42 * gz(nn, 0.19, -0.1, 0.96, 0.085)).lerp(SOCK, 0.5 * gz(nn, 0.02, -0.31, 0.95, 0.11, 0.05));      // beside her nose, and under it
        c.lerp(ROSE, 0.8 * gz(nn, 0, -0.52, 0.86, 0.15, 0.055)).lerp(EYE, 0.3 * gz(nn, 0, -0.525, 0.86, 0.13, 0.014)).lerp(SOCK, 0.36 * gz(nn, 0, -0.72, 0.7, 0.16, 0.07));      // her mouth; under her lip
        return c.lerp(c3.copy(HAIR[0]).multiplyScalar(0.92), hairy(nn));                                  // into her fringe
      };
      ball(head, SKc, SKr, face, { detail: 6, shrink: 0.95, dark: 0.95 });
      ball(head, [0, 0.0478, 0.0352], [0.0036, 0.0072, 0.0042], nw => c.copy(uF(nw)), { detail: 2, shrink: 1, dark: 0.94 });      // her nose
      const visage = (nw, r, nn) => face(nw, null, nn).clone().multiplyScalar(1 + (r - 0.5) * 0.07);
      coat(head, SKc, SKr, 420, visage, { l: [0.009, 0.015], w: [0.008, 0.012], keep: (p, n, u) => open(u) > 0.1 && u.z > -0.1 && hairy(u) < 0.5, flow: V3(0.2, -1, 0), jit: 1.4, cell: 2, tip: 0.0008, lift: 0.0012, ridge: 0.02, tilt: 0.14 });
      { const n = V3(-0.12, -0.08, 1).normalize(); stroke(head, V3(-0.0006, 0.049, 0.0405), n, V3(0.05, 1, 0).normalize(), 0.014, 0.0052, FL.hi[0], { cell: 2, lift: 0.0006, tip: 0, tilt: 0.05, ridge: 0.03 }); }      // the light down her nose
      coat(head, SKc, SKr, 70, (nw, r) => pick(HAIR, r).clone().multiplyScalar(0.86 + 0.2 * Math.max(0, nw.dot(KEY))), { l: [0.014, 0.022], w: [0.006, 0.01], grow: 1.03, keep: (p, n, u) => hairy(u) > 0.3 && open(u) > 0.12, flow: V3(0.25, -1, 0), jit: 0.7, cell: 1, tip: 0.002 });      // her fringe
      // the bonnet: a cream hood over the back and top of her head, open in front; its brim standing out round her face
      const tc = mixer(CR, CRH, 0.4, 0.12);
      ball(head, BNc, BNr, nw => c.copy(uC(nw)), { detail: 4, keep: n => open(n) < 0.24, dark: 0.86 });
      coat(head, BNc, BNr, 150, tc, { l: [0.02, 0.034], w: [0.011, 0.017], grow: 1.02, keep: (p, n, u) => open(u) < 0.2, flow: V3(0.2, -0.3, 1), jit: 1.0, tip: 0.003 });
      const rim = a => { const rad = V3(Math.cos(a), 0, 0).addScaledVector(YAX, Math.sin(a)), e = V3().copy(WAX).multiplyScalar(0.2).addScaledVector(rad, 0.98).normalize();
        return { p: V3(BNc[0] + e.x * BNr[0], BNc[1] + e.y * BNr[1], BNc[2] + e.z * BNr[2]), d: V3().copy(WAX).multiplyScalar(0.93).addScaledVector(rad, 0.36).normalize(), nb: V3().copy(rad).multiplyScalar(0.93).addScaledVector(WAX, -0.36).normalize(), len: 0.03 - 0.013 * fall(Math.sin(a), -0.7, 0.2) }; };
      { const segs = 30, pos = [], nor = [], A0 = -1.0, A1 = Math.PI + 1.0, ring = []; for (let i = 0; i <= segs; i++) { const q = rim(lerp(A0, A1, i / segs)); ring.push([q.p.clone().addScaledVector(q.d, -0.005), q.p.clone().addScaledVector(q.d, q.len * 0.94), q.nb]); }
        for (let i = 0; i < segs; i++) for (const [P_, N_] of [[ring[i][0], ring[i][2]], [ring[i][1], ring[i][2]], [ring[i + 1][1], ring[i + 1][2]], [ring[i][0], ring[i][2]], [ring[i + 1][1], ring[i + 1][2]], [ring[i + 1][0], ring[i + 1][2]]]) { pos.push(P_.x, P_.y, P_.z); nor.push(N_.x, N_.y, N_.z); }
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
        solid(head, g, nw => c.copy(CR.mid[0]).lerp(CR.hi[0], 0.5 + 0.5 * nw.dot(KEY)).multiplyScalar(0.9)); }
      for (let row = 0; row < 3; row++) for (let i = 0; i < 40; i++) {
        const q = rim(lerp(-0.98, Math.PI + 0.98, (i + 0.33 * row) / 39.7)), l = q.len * (0.62 - 0.1 * row) + 0.004 * R(), at = 0.3 + 0.3 * row;
        stroke(head, q.p.clone().addScaledVector(q.d, q.len * at).addScaledVector(q.nb, row === 1 ? -0.0012 : 0.0012), row === 1 ? q.nb.clone().negate() : q.nb, q.d, l, 0.013 + 0.004 * R(), pick(R() < 0.6 ? CR.hi : CRH, R()).clone().multiplyScalar(0.92 + 0.12 * R() - 0.06 * row), { tip: 0.0006, lift: 0.0004, tilt: 0.08, ridge: 0.05, cell: R() < 0.6 ? 2 : 0 });
      }
      // on top: the blue ribbon in a bow, and a few flowers
      const TPc = [0.004, 0.113, -0.002], TPr = [0.042, 0.026, 0.034];
      ball(head, TPc, TPr, nw => c.copy(RIB[3]).multiplyScalar(0.8 + 0.3 * Math.max(0, nw.dot(KEY))), { detail: 2, shrink: 0.8 });
      coat(head, TPc, TPr, 34, (nw, r) => pick(RIB, r).clone().multiplyScalar(0.84 + 0.24 * Math.max(0, nw.dot(KEY))), { l: [0.02, 0.034], w: [0.008, 0.013], grow: 1.05, flow: ACROSS, jit: 1.6, tip: 0.005, keep: (p, n, u) => u.y > -0.3 });
      coat(head, TPc, [0.036, 0.026, 0.03], 34, (nw, r) => (r < 0.72 ? pick(FLOWER, r / 0.72) : pick(G_ACID, R())).clone(), { l: [0.011, 0.016], w: [0.011, 0.016], grow: 1.12, cell: 2, tip: 0, lift: 0.002, ridge: 0.1, tilt: 0.2, keep: (p, n, u) => u.y > -0.1 && u.z > -0.2 });
      for (let i = 0; i < 5; i++) stroke(head, V3(0.036 + 0.006 * i, 0.128 - 0.012 * i, -0.012 + 0.004 * i), V3(0.5, 0.3, 0.8).normalize(), V3(0.5 - 0.2 * i, 0.9 - 0.4 * i, 0).normalize(), 0.042, 0.014, pick(RIB, R()), { tip: 0.004, lift: 0.002, bend: 0.2 });      // the loops of the bow, on her left
      for (let i = 0; i < 4; i++) stroke(head, V3(0.046, 0.094 - 0.016 * i, 0.0), V3(0.9, 0.1, 0.4).normalize(), V3(0.1, -1, 0.1).normalize(), 0.032, 0.011, pick(RIB, R()), { tip: 0.003, lift: 0.002 });                                                              // and an end of it hanging
    }

    // ---------------------------------------------------------- her arms (each bone runs along its own +y): a blue
    // sleeve, a long tan glove, a closed hand
    const tsl = mixer(BL, BLH, 0.62, 0.34), tgv = mixer(GV, GVH, 0.4, 0.14), uB2 = under(BL), uG2 = under(GV), cA = new THREE.Color(), K = 0.98, CUFF = 0.05;
    const ARM = { cell: 0, tip: 0.0014, ridge: 0.06, tilt: 0.26, dark: 0.9 };
    const upper = rest => {
      const Pt = part(rest);
      tube(Pt, [[0.0215 * K, 0], [0.0225 * K, 0.03], [0.021 * K, 0.07], [0.0188 * K, 0.105], [0.0178 * K, L1]], () => BL, 46, (nw, r) => tsl(nw, r), { ...ARM, l: [0.04, 0.07], w: [0.015, 0.023] });
      ball(Pt, [0, 0.012, 0], [0.0235, 0.026, 0.0235], nw => cA.copy(uB2(nw)), { detail: 3 });
      coat(Pt, [0, 0.012, 0], [0.0235, 0.026, 0.0235], 26, tsl, { l: [0.02, 0.036], w: [0.012, 0.019], ridge: 0.1, tip: 0.004 });
      return Pt;
    };
    const fore = rest => {
      const Pt = part(rest);
      tube(Pt, [[0.0171 * K, 0], [0.0198 * K, 0.03], [0.0186 * K, 0.06], [0.0146 * K, 0.1], [0.012 * K, 0.124]], y => (y > CUFF ? GV : BL), 50, (nw, r, y) => (y > CUFF ? tgv(nw, r) : tsl(nw, r)), { ...ARM, l: [0.035, 0.06], w: [0.014, 0.021] });
      ball(Pt, [0, L2 - 0.001, 0.001], [0.0125 * K, 0.021, 0.0098 * K], nw => cA.copy(uG2(nw)), { detail: 3, dark: 0.95 });      // her hand, closed
      coat(Pt, [0, L2 - 0.001, 0.001], [0.0125 * K, 0.021, 0.0098 * K], 22, tgv, { l: [0.012, 0.02], w: [0.008, 0.012], cell: 2, tip: 0.0008, ridge: 0.04, tilt: 0.16 });
      return Pt;
    };
    const ru = upper(M.ru), rf = fore(M.rf), lu = upper(M.lu), lf = fore(M.lf);

    // ---------------------------------------------------------- the fan: fourteen blue leaves on ivory sticks, pleated,
    // all lying along its middle rib until the shader spreads them (its plane is its own xy; its middle rib +y)
    const fan = part(M.fan, false);
    {
      const zero = V3(), step = FAN_SPREAD / (FAN_N - 1), cf = new THREE.Color(), ce = new THREE.Color(), n1 = V3();
      for (let i = 0; i < FAN_N; i++) {
        const ang = (i / (FAN_N - 1) - 0.5) * FAN_SPREAD, sg = i % 2 ? 1 : -1, a4 = [6, -1, R(), -ang], bv = [0, 0, 0], k = i % 3 === 0 ? 1 : 0;
        cf.copy(pick(i % 2 ? BL.mid : BL.hi, R())).lerp(pick(BLH, R()), 0.35).multiplyScalar(1.12); ce.copy(cf).lerp(WH.hi[0], 0.42);
        const hw = r => r * Math.tan(step / 2) * 1.22, zz = (r, s) => sg * s * 0.0032 * (r / FAN_R), pt = (r, s) => V3(s * hw(r), r, zz(r, s) + 0.0004 * i);
        n1.set(-sg * 0.3, 0, 1).normalize();
        const rs = [0.03, 0.05, 0.07, 0.09, FAN_R + 0.004 * R()];
        for (let j = 0; j < 4; j++) {
          const r0 = rs[j], r1 = rs[j + 1], s0 = j / 4, s1 = (j + 1) / 4, c0 = j === 3 ? ce : cf, c1 = j === 3 ? ce : cf;
          const A0 = pt(r0, -1), B0 = pt(r0, 1), A1 = pt(r1, -1), B1 = pt(r1, 1), q = (p, s, t, cc) => vert(fan, p, n1, cc, UVQ(k, 0.2 + 0.56 * s, 0.24 + 0.52 * t), zero, a4, bv);
          q(A0, s0, 0, cf); q(B1, s1, 1, c1); q(B0, s0, 1, cf); q(A0, s0, 0, cf); q(A1, s1, 0, c0); q(B1, s1, 1, c1);
        }
        // its stick
        const st = [pt(0, 0), pt(FAN_R * 0.5, 0)], w = 0.0022, cs = pick(IVORY, R());
        for (const [p, s] of [[V3(-w, 0, 0.001), 0], [V3(w, st[1].y, 0.001), 1], [V3(w, 0, 0.001), 0], [V3(-w, 0, 0.001), 0], [V3(-w, st[1].y, 0.001), 1], [V3(w, st[1].y, 0.001), 1]]) vert(fan, p, n1, cs, [UV_SOLID[0], UV_SOLID[1]], zero, a4, bv), void s;
      }
    }

    // ---------------------------------------------------------- the rig: every solid thing, one draw call
    const parts = { hedge, ground, rake, bench, bush, skirt, torso, head, ru, rf, lu, lf, fan };
    let total = 0; for (const p of Object.values(parts)) total += p.n;
    const U = this.U = { uTh: { value: TH0 }, uLeaf: { value: 0 }, uFound: { value: 0 }, uFan: { value: 0 }, uLead: { value: 1 }, uShake: { value: 0 }, uClock: { value: 0 } };
    const rm = new THREE.MeshStandardMaterial({ vertexColors: true, color: 0xa4a4a4, map: brushPrint(), alphaTest: 0.4, roughness: 0.92, metalness: 0, emissive: 0xffffff, emissiveIntensity: 0.46, side: THREE.DoubleSide });
    const f = x => x.toFixed(5);
    rm.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, U);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', `#include <common>
attribute vec3 aCen; attribute vec4 aA; attribute vec3 aB;
uniform float uTh, uLeaf, uFound, uFan, uLead, uShake, uClock;
float gK = 1.0;
vec2 lifeLat(vec2 pq, float th) { return vec2(${f(XR)} - pq.x * ${f(LS)} * sin(th), ${f(Y0)} + pq.y * ${f(LS)} * cos(th)); }
vec3 lifeTurn(vec3 v, vec3 ax, float a) { float c = cos(a), s = sin(a); return v * c + cross(ax, v) * s + ax * dot(ax, v) * (1.0 - c); }`)
        .replace('#include <color_vertex>', `#include <color_vertex>
  // found, or still part of the garden: her own colour, or one of the hedge's greens
  if (aA.x < 1.5 || (aA.x > 4.5 && aA.x < 5.5)) gK = aA.y < 0.0 ? 1.0 : smoothstep(aA.y, aA.y + 0.14, uFound);
  if (aA.x < 1.5) vColor.rgb = mix(aB, vColor.rgb, gK);`)
        .replace('#include <begin_vertex>', `#include <begin_vertex>
  {
    float kind = aA.x, seed = aA.z; vec3 rel = transformed - aCen;
    if (kind > 0.5 && kind < 1.5) {
      // a stroke of her: lying on her form; or ruffled off it, as a leaf stands off a bush
      float h = 1.0 - gK;
      if (h > 0.001) {
        vec3 ax = normalize(vec3(sin(seed * 91.7), cos(seed * 53.3), sin(seed * 27.1 + 1.0)));
        float a = h * (0.7 + 1.2 * fract(seed * 7.13)) * (fract(seed * 3.7) > 0.5 ? 1.0 : -1.0) + h * uShake * 0.5 * sin(uClock * 13.0 + seed * 40.0);
        transformed = aCen + lifeTurn(rel, ax, a) * (1.0 + 0.5 * h) + objectNormal * (0.014 * h);
      }
    } else if (kind > 1.5 && kind < 2.5) {
      // a lath: between two pins of the trellis, wherever they are now
      transformed = vec3(lifeLat(aB.xy, uTh) + vec2(aB.z * cos(uTh), sin(uTh)) * aA.w, position.z);
    } else if (kind > 2.5 && kind < 3.5) {
      // a leaf of the hedge: it keeps its place by its pin, and spreads as the diamonds open
      vec2 n0 = lifeLat(aB.xy, ${f(TH1)}), n1 = lifeLat(aB.xy, uTh);
      rel = lifeTurn(rel, vec3(0.0, 0.0, 1.0), uShake * 0.4 * sin(uClock * 12.0 + seed * 50.0));
      transformed = vec3(n1 + (aCen.xy - n0) * uLeaf, mix(${f(ZT)}, aCen.z, 0.3 + 0.7 * uLeaf)) + rel * (0.16 + 0.84 * uLeaf);
    } else if (kind > 3.5 && kind < 4.5) {
      // the ground, laid as the trellis passes over it
      transformed = aCen + rel * smoothstep(0.0, 0.14, aCen.x - uLead);
    } else if (kind > 4.5 && kind < 5.5) {
      // a leaf of the bush round her: drawn off as she is found
      transformed = aCen + objectNormal * (0.05 * gK) + lifeTurn(rel, objectNormal, uShake * 0.5 * sin(uClock * 13.0 + seed * 40.0)) * (1.0 - gK);
    } else if (kind > 5.5) {
      // a leaf of the fan, spread from its rivet
      transformed = lifeTurn(transformed, vec3(0.0, 0.0, 1.0), aA.w * uFan);
    }
  }`);
      // (the paint glows a little in its own colour, bristle by bristle)
      sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n  totalEmissiveRadiance *= vColor.rgb;\n#ifdef USE_MAP\n  totalEmissiveRadiance *= sampledDiffuseColor.rgb;\n#endif');
    };
    rm.customProgramCacheKey = () => 'morisot-garden';
    const rig = this.rig = L.rig(Object.keys(parts).length + 1, total + 64, rm);
    this.I = {}; this.REST = {};
    for (const [name, p] of Object.entries(parts)) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(p.pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(p.nor, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(p.col, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(p.uv, 2)); g.setAttribute('aCen', new THREE.Float32BufferAttribute(p.cen, 3)); g.setAttribute('aA', new THREE.Float32BufferAttribute(p.a, 4)); g.setAttribute('aB', new THREE.Float32BufferAttribute(p.b, 3));
      this.I[name] = rig.add(rig.geo(g)); this.REST[name] = p.rest.clone(); rig.mat(this.I[name], this.V.m.multiplyMatrices(this.B, p.rest));
      p.pos = p.nor = p.col = p.uv = p.cen = p.a = p.b = null;
    }

    this.shade = L.blobs(8, { fade: true });
    this.band = this.makeScore(L);
    this.reset(L);
  },

  // ---------------------------------------------------------------- the music, and the sounds that keep its time
  makeScore(L) {
    const s = score(L), arp = { type: 'triangle', vol: 0.02, attack: 0.008, over: 2, overVol: 0.14 }, lead = { type: 'triangle', vol: 0.03, attack: 0.008, over: 2, overVol: 0.18 }, low = { type: 'sine', vol: 0.016, attack: 0.012 };
    const run = (t0, names, step, o, hold = 2.6) => names.forEach((n, i) => { if (n) s.note(t0 + i * step, nhz(n), step * hold, o); });
    // bars 1 and 2: one arpeggio up and down the keyboard each, in triplets, from hand to hand
    run(bar(0), ['C#4', 'E4', 'A4', 'C#5', 'E5', 'F#5', 'G#5', 'D#5', 'B4', 'G#4', 'D#4', 'B3'], TT, arp);
    run(bar(1), ['A3', 'C#4', 'F#4', 'A4', 'C#5', 'D#5', 'E5', 'B4', 'G#4', 'E4', 'B3', 'G#3'], TT, arp);
    // bars 3 and 4: the rocking figure, a crotchet to each swing; the upper voice climbing C sharp, F sharp, A
    for (const [k, bass, up] of [[2, [['F#3', 'A3', 'C#4'], ['E3', 'A3', 'C#4']], [null, 'C#5', 'F#5', 'C#5']], [3, [['D#3', 'A3', 'C#4'], ['C#3', 'A3', 'E4']], [null, 'C#5', 'F#5', 'A5']]]) {
      const t = bar(k);
      bass.forEach((b, h) => b.forEach((n, i) => s.note(t + h * 2 * BT + i * TT, nhz(n), i === 2 ? BT * 1.6 : TT * 2.4, low)));
      up.forEach((n, i) => { if (n) s.note(t + i * BT, nhz(n), BT * (k === 3 && i === 3 ? 2.6 : 1.5), lead); });
      for (const b of [1, 3]) run(t + b * BT, k === 3 && b === 3 ? ['A5', 'A4', 'C#5'] : ['C#5', 'F#4', 'A4'], TT, arp, 3);
    }
    // bar 5: the high A held over a rising left hand, and let down, slowing
    { const t = bar(4); s.note(t + BT, nhz('A5'), BT * 2.2, lead); run(t, ['B2', 'F#3', 'A3', 'C#4', 'D#4', 'F#4', 'A4', 'C#5', 'D#5', 'C#5', 'B4', 'A4'], TT, low, 2.4);
      s.note(t + 3 * BT + 1.3 * TT, nhz('G#5'), TT * 2.2, lead); s.note(t + 3 * BT + 2.9 * TT, nhz('F#5'), TT * 3, lead); }
    // bars 6 and 7: the melody, falling in triplets over a left hand in quavers; and the down-beat of bar 8, where it comes to rest
    for (const [t, lh] of [[B6, ['E2', 'B2', 'E3', 'G#3', 'B3', 'G#3', 'E3', 'B2']], [B7, ['E2', 'C#3', 'E3', 'G#3', 'C#4', 'G#3', 'E3', 'B2']]]) run(t, lh, BT / 2, low, 2.2);
    run(B6 + BT, ['E5', 'F#5', 'C#5', 'E5', 'B4', 'C#5', 'G#4', 'B4', 'F#4'], TT, lead, 1.6);
    run(B7, ['G#4', 'E4', 'G#4'], TT, lead, 1.6); s.note(B7 + BT, nhz('D#4'), BT * 2.1, lead); s.note(B7 + 3 * BT, nhz('C#4'), BT * 1.2, lead);
    s.note(B8, nhz('B3'), BT * 3, lead); ['E2', 'B2', 'E3', 'G#3', 'B3'].forEach((n, i) => s.note(B8 + i * BT * 0.56, nhz(n), BT * 3, low));
    // the laths, running out; the fan's sticks; each beat of the fan, a breath
    for (let i = 0; i < 13; i++) { const q = i / 12, t = OPEN[0] + 0.05 + (OPEN[1] - OPEN[0] - 0.1) * (1 - Math.pow(1 - q, 1.6)); s.hit(t, { d: 0.035, vol: 0.011, bp: 1900 + 500 * ((i * 7) % 5) / 4, q: 3 }); }
    s.hit(STIR - 0.02, { d: 0.5, vol: 0.006, bp: 3200, q: 0.7, attack: 0.16 });
    for (let i = 0; i < 9; i++) s.hit(FAN_OPEN[0] + 0.06 + i * 0.036, { d: 0.022, vol: 0.008, bp: 2600 + 160 * i, q: 4 });
    for (const w of [W1, W2]) for (let i = 0; i < w.n; i++) s.hit(w.t0 + i * BT - 0.04, { d: 0.34, vol: 0.008, lp: 900, hp: 160, attack: 0.12 });
    return s.done();
  },

  // ---------------------------------------------------------------- her pose
  // A two-bone arm from shoulder S to hand T (scene units), the elbow towards `pole`. Fills the two bones' matrices.
  arm(S, T, pole, M1, M2) {
    const V = this.V, d = V.d.copy(T).sub(S), len = d.length(), dist = Math.max(L2 - L1 + 0.01, Math.min(L1 + L2 - 0.003, len)); d.multiplyScalar(1 / Math.max(1e-5, len));
    const a = (L1 * L1 - L2 * L2 + dist * dist) / (2 * dist), h = Math.sqrt(Math.max(0, L1 * L1 - a * a));
    const p1 = V.p1.copy(pole).addScaledVector(d, -pole.dot(d)).normalize();
    const E = V.el.copy(S).addScaledVector(d, a).addScaledVector(p1, h), tip = V.t.copy(S).addScaledVector(d, dist);
    M1.compose(S, V.q.setFromUnitVectors(V.up, V.p2.copy(E).sub(S).normalize()), V.one);
    M2.compose(E, V.q.setFromUnitVectors(V.up, V.p2.copy(tip).sub(E).normalize()), V.one);
  },
  // Everything of hers that moves, for u (0: the picture's pose, the fan in her lap; 1: the fan held up) and the small
  // things in o (her breath, where she looks, the fan's swing): into this.M.
  pose(u, o) {
    const V = this.V, M = this.M, k = ease.inOut(u);
    const eul = (m, x, y, z, yaw, pitch, roll) => m.compose(V.pos.set(x, y, z), V.q.setFromEuler(V.e.set(pitch, yaw, roll, 'YXZ')), V.one);
    // her body, from the waist: turned a little the way her knees go; leaning back a little when she fans
    eul(M.torso, WAIST[0], WAIST[1], WAIST[2], -0.2 + 0.05 * k, 0.03 - 0.07 * k + 0.012 * o.breath, 0.02 + 0.03 * k + 0.004 * o.sway);
    // her head: to you; or tipped back and a little towards the fan
    eul(V.l, NECK[0], NECK[1], NECK[2], lerp(0.2 + o.gazeY, 0.38, 0.55 * k), lerp(o.gazeP, -0.13, 0.7 * k), 0.03 + 0.07 * k + 0.012 * o.sway);
    M.head.multiplyMatrices(M.torso, V.l);
    // her left hand, and the fan in it: in her lap; or up before her, beating
    const hl = V.a.set(lerp(LAP_L[0], UP_L[0], k), lerp(LAP_L[1], UP_L[1], k) + 0.03 * Math.sin(Math.PI * k), lerp(LAP_L[2], UP_L[2], k) + 0.02 * Math.sin(Math.PI * k));
    hl.x -= 0.012 * o.psi * k; hl.y += 0.004 * o.breath * (1 - k);
    V.q2.copy(this.QA).slerp(this.QB, k);
    if (k > 0.001) V.q2.multiply(V.q.setFromAxisAngle(V.up, 0.62 * o.psi * k)).multiply(V.q.setFromAxisAngle(V.x.set(1, 0, 0), 0.16 * o.psi * k));
    M.fan.compose(hl, V.q2, V.one);
    this.arm(V.s.set(...SH_L).applyMatrix4(M.torso), hl, V.w.set(0.8, -0.42, 0.2), M.lu, M.lf);
    const hr = V.b.set(LAP_R[0], LAP_R[1] + 0.003 * o.breath, LAP_R[2]);
    this.arm(V.s.set(...SH_R).applyMatrix4(M.torso), hr, V.w.set(-0.6, -0.5, -0.6), M.ru, M.rf);
  },

  // She and her seat are soft to the toy: it is eased out round them (never stopped dead, never through her).
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

  // When she fans herself: how far the fan is up (0..1), its swing (-1..1), and which beat this is (or -1), at show-time t.
  fanning(t) {
    let up = 0, psi = 0, beat = -1;
    const one = (t0, n, id) => {
      const end = t0 + n * BT, a = ramp(t, t0 - 1.05, t0 - 0.42) * (1 - ramp(t, end + 0.04, end + 0.86));
      if (a > up) up = a;
      if (t >= t0 - 0.2 && t < end) { const x = (t - t0) / BT; psi = -Math.cos(TAU * x) * ramp(t, t0 - 0.2, t0 + 0.1) * (1 - ramp(t, end - 0.25, end)); beat = id * 100 + Math.floor(Math.max(0, x)); }
    };
    one(W1.t0, W1.n, 0); one(W2.t0, W2.n, 1);
    if (t > AGAIN - 2) { const k = Math.max(0, Math.floor((t - AGAIN + 1.5) / EVERY)); one(AGAIN + k * EVERY, LATER, 2 + k); }
    return { up, psi, beat };
  },

  hide() { if (!this.rig) return; this.rig.mesh.visible = false; this.shade.visible = false; },
  start(L) { this.clear(); this.band.from(0); },
  clear() { this.clock = 0; this.gy = 0; this.gp = 0; this.gazed = false; this.lastBeat = -1; this.folded = false; this.S = { zin: 0, open: 0, grow: 0, found: 0, fan: 0, up: 0, psi: 0, shake: 0 }; this.S0 = null; },
  back() { this.S0 = { ...this.S }; this.folded = false; },
  end() { this.hide(); },
  reset() { this.hide(); this.clear(); this.told = false; },

  update(L, dt) {
    const ph = L.phase, showing = ph === 'wake' || ph === 'play', back = ph === 'return';
    if (!showing && !back) { this.hide(); return; }
    const calm = L.calm, V = this.V, G = L.k.G, voice = L.voice(), S = this.S, t = L.t;
    this.clock += dt;
    // ---- where everything has got to
    if (showing) {
      const q = ramp(t, OPEN[0], OPEN[1]), fz = this.fanning(t);
      S.zin = ease.out(ramp(t, Z_IN[0], Z_IN[1]));
      S.open = calm ? ease.inOut(q) : q < 0.8 ? 1.035 * ease.smooth(q / 0.8) : 1.035 - 0.035 * ease.smooth((q - 0.8) / 0.2);      // (drawn out a little too far, and let back)
      S.grow = ease.out(ramp(t, GROW[0], GROW[1]));
      S.fan = calm ? ease.inOut(ramp(t, FAN_OPEN[0], FAN_OPEN[1])) : ease.outBack(ramp(t, FAN_OPEN[0], FAN_OPEN[1]));
      let fd = 0; for (const [t0, more, over] of FOUND) fd += more * ease.inOut(ramp(t, t0, t0 + over)); S.found = Math.min(1, fd);
      S.up = ease.inOut(fz.up); S.psi = fz.psi * (calm ? 0.5 : 1);
      S.shake = calm ? 0 : Math.max(0.9 * Math.exp(-Math.max(0, t - OPEN[1]) * 3.4) * (t > OPEN[1] - 0.15 ? 1 : 0), hump(t, STIR - 0.05, STIR + 0.55), 0.22 * Math.abs(fz.psi) * S.up);
      // a later beat of the fan, after the tune: a breath
      if (fz.beat >= 200 && fz.beat !== this.lastBeat && !L.quiet && voice.ctx) noise(voice, 0, { d: 0.34, vol: 0.007, lp: 900, hp: 160, attack: 0.12 });
      this.lastBeat = fz.beat;
      this.band.play(t);
    } else {
      const r = L.r, s0 = this.S0 || S;
      S.found = s0.found * (1 - ease.inOut(ramp(r, 0, 0.75))); S.up = s0.up * (1 - ease.inOut(ramp(r, 0, 0.5))); S.psi = s0.psi * (1 - ramp(r, 0, 0.3));
      S.fan = s0.fan * (1 - ease.inOut(ramp(r, 0.4, 0.78))); S.grow = s0.grow * (1 - ease.in(ramp(r, 0.72, 1.22)));
      S.open = s0.open * (1 - ease.inOut(ramp(r, 1.0, 1.82))); S.zin = s0.zin * (1 - ease.in(ramp(r, 1.76, RET - 0.04))); S.shake = calm ? 0 : 0.5 * hump(r, 0, 0.8);
      if (!this.folded && r > 1.0 && s0.open > 0.5) { this.folded = true; if (!L.quiet && voice.ctx) for (let i = 0; i < 9; i++) noise(voice, 0.05 + i * 0.08, { d: 0.035, vol: calm ? 0.005 : 0.009, bp: 2300 - 90 * i, q: 3 }); }
    }
    const th = TH0 + (TH1 - TH0) * S.open, lead = leadAt(th), U = this.U;
    U.uTh.value = th; U.uLeaf.value = ease.smooth(ramp(S.open, 0.12, 1)); U.uFound.value = S.found; U.uFan.value = S.fan; U.uShake.value = S.shake; U.uClock.value = this.clock;
    U.uLead.value = lerp(0.9, lead, S.zin);
    // ---- whoever she looks at (you)
    {
      const who = G.camera.position, q = L.local(who.x, who.z), dx = (q.u - U0) / SC - WAIST[0], dz = (q.out + L.wall) / SC - WAIST[2], wy = Math.max(-0.6, Math.min(0.6, Math.atan2(dx, dz) + 0.2)) - 0.2, wp = Math.max(-0.22, Math.min(0.12, -Math.atan2((who.y - L.y) / SC - 0.45, Math.hypot(dx, dz)) * 0.6));
      const k = !this.gazed ? 1 : 1 - Math.exp(-dt * 3); this.gy += (wy - this.gy) * k; this.gp += (wp - this.gp) * k; this.gazed = true;
    }
    const o = this.IDLE; o.breath = Math.sin(this.clock * 1.7); o.sway = Math.sin(this.clock * 0.43) * Math.sin(this.clock * 0.19 + 1); o.gazeY = this.gy; o.gazeP = this.gp; o.psi = S.psi;
    this.pose(S.up, o);
    // ---- into the rig
    const rig = this.rig, I = this.I, B = this.B, M = this.M, zoff = -0.3 * (1 - S.zin);
    rig.mesh.visible = S.zin > 0.004;
    rig.mat(I.hedge, V.m.multiplyMatrices(B, V.l.makeTranslation(0, 0, zoff)));
    // the rake: carried along on the opening edge, upright against it; then left behind, and it leans
    { const x = Math.max(RAKE.x, lead - 0.012), lean = ease.outBack(ramp(RAKE.x - lead, 0.0, 0.2)) * (calm ? 1 : 1), p = RAKE.pitch * lean;
      V.l.compose(V.pos.set(x - RAKE.len * Math.sin(RAKE.roll * lean) * 0, 0, ZT + 0.022 + RAKE.len * Math.sin(p) + zoff), V.q.setFromEuler(V.e.set(-p, 0, RAKE.roll * lean, 'YXZ')), V.one);
      rig.mat(I.rake, V.m.multiplyMatrices(B, V.l)); }
    // the bush and all that is in it: out of the hedge, about its foot there
    const g = S.grow, shown = g > 0.02;
    V.g.makeTranslation(HIP[0], 0, ZT).scale(V.c.set(0.3 + 0.7 * g, g, g)).multiply(V.l.makeTranslation(-HIP[0], 0, -ZT)); V.g.premultiply(B);
    for (const n of ['bench', 'bush', 'skirt']) { rig.show(I[n], shown); if (shown) rig.mat(I[n], V.g); }
    for (const n of ['torso', 'head', 'ru', 'rf', 'lu', 'lf', 'fan']) { rig.show(I[n], shown); if (shown) rig.mat(I[n], V.m.multiplyMatrices(V.g, M[n])); }
    // ---- shadows on the floor: under the hedge, under her and her seat, under the rake's head
    const O = this.O, sh = this.shade, kz = S.zin * ease.smooth(ramp(S.open, 0.1, 0.9));
    sh.visible = S.zin > 0.02; sh.count = 8;
    const put = (i, x, z, r, kk) => sh.set(i, O.x + (L.tx * x + L.nx * z) * SC, O.z + (L.tz * x + L.nz * z) * SC, r * SC, kk);
    for (let i = 0; i < 4; i++) { const x = lerp(XR - 0.1, lead + 0.1, i / 3); put(i, x, ZT + 0.03, 0.2, 0.5 * kz); }
    put(4, HIP[0] - 0.02, HIP[1] + 0.02, 0.3, 0.95 * g); put(5, HIP[0] + 0.02, HIP[1] + 0.06, 0.44, 0.5 * g); put(6, HIP[0] + DIR[0] * 0.1, HIP[1] + DIR[1] * 0.12, 0.2, 0.5 * g);
    put(7, Math.max(RAKE.x, lead), ZT + 0.2, 0.1, 0.5 * kz);
    if (showing && g > 0.9) this.soften(L, dt);
    voice.level = calm ? 0.65 : 1; voice.place();
    if (showing && !this.told && !L.quiet && S.found > 0.55) { this.told = true; L.k.say('A fan moves, and there she is. Morisot painted the woman and the hedge with the same strokes.', 5); }
    if (back && L.ret >= 1) this.hide();
  },
});
