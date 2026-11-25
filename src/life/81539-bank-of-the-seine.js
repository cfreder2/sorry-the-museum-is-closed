// Claude Monet, On the Bank of the Seine, Bennecourt (1868), Gallery 201. The word: twice.
//
// A woman sits on the grass under a tree, her back to us, her hat off beside her and a green boat pulled in at the
// bank, and looks across the river at a village. The museum's note names her (Camille Doncieux, later his wife), says
// where she is (an island in the Seine, looking toward the hamlet of Gloton, from which the two of them "have
// presumably rowed"), and files the picture under "reflections". That is its famous fact: the far bank is in it
// twice, once the right way up, half hidden behind the leaves, and once upside down in the water, where it is the
// clearer of the two, laid in blocks of flat colour as plain and as solid as the houses themselves: white bars, a
// brown bar, an olive mass, patches of blue. He was twenty-seven and painted the image in the water with exactly the
// weight of the thing. No other picture alive here has a world that is upside down and in pieces. So the word is
// twice, and the show is what a reflection is: the far bank, folded down along its own shore.
//
// Look, and his river is laid over the floor from the foot of the wall towards you in broad level touches, pale
// under the wall and blue nearer; and in it, as it is laid, there is a village: upside down, olive and white and
// rose, in flat blocks. Above it, on the far side, there is nothing at all. The near bank is brushed in along the
// river's edge, dark grass with yellow and white flowers; the green boat, its bow on the grass; and she is laid in,
// sitting on the bank with her back to you: the grey skirt, then the stripes of her jacket one after another down
// her back, her dark hair, and the straw hat with its blue ribbon on the grass beside her. She looks down at the
// village in the water. Then the water over there shivers, and the hill comes up out of it: its top breaks the
// surface first, out in the river, and the whole sheet of it swings up dripping about the far shore and stands, the
// striped fields and the ridge, with its image still lying in the water where it lay. The houses follow, from the
// left: the long cream house, the rose roofs and the bush, and last, after a moment in which only the water moves,
// the white gable. Each stands up out of its own reflection with one soft note, and her head comes up with them.
// Then one long ripple goes out from the far shore to the near one, the image breaks into its pieces as it passes
// and closes again, the boat rocks when it arrives, and there it is as he painted it: the far bank twice, and a
// woman looking across at it. The eye goes up to the picture to find her doing the same. While you keep looking the
// water moves a little, the boat rides, she breathes. When you stop, the village lies down again into its image,
// white gable first, she and the bank are unpainted, and the river draws back under the picture.
//
// While the toy is near it all stays: drive into the river and the image goes to pieces round the toy and closes
// behind it; the standing village does not stir, which is how to tell which of the two is the reflection.
//
// How it is made: three draw calls. The floor is one sheet and one shader over three small paintings made once: his
// water (rows of broad level touches, square and ragged at their ends, each wholly one flat colour: pale and warm
// under the far bank, lilac and cloud in the middle, the sky's blue towards us), laid a row at a time, one row from
// the left and the next from the right; his grass (short broad dark touches in the tree's shade, sunlit low on the
// left, yellow and white dabs for the flowers), brushed outwards from the water's edge; and the far bank's own
// painting, which the shader lays in the water upside down, a little greener and duller as he has it, cut by level
// slits of the water's colour that slide when it is stirred. The image is not a mirror's (the harp in Böcklin's sea,
// Glackens's looking-glass, Ruisdael's pool and the Water Lilies' pond are worked out from the eye, and they answer
// whatever stands over them): it is paint lying on the water, the same from everywhere, which is how he painted it,
// and it is there before the village is. It lies half as long again as the thing stands (his reflections are drawn
// out down the canvas, and a floor is seen at a slant, so a true length would read as a sliver). The village is four
// flat painted sheets (the hill; three lengths of houses and shore) from that same painting, hinged along the far
// shore just under the water, so each begins lying exactly on its own image, drawn out as long, and comes to its own
// height as it stands over it: the reflection and the thing are one piece of painting, seen twice. (Cézanne's cards
// in Gallery 248 are dealt and stood up one by one to build a place out of a pack; here nothing is dealt or built:
// an image that is already whole gets up and leaves itself behind.) Everything on the near bank is a third call,
// built as Corot's reader is (81512-interrupted-reading.js): under each form a core a little smaller and darker, and
// over it strokes with a brush's own print on them, tilted so that they overlap and every edge is their ragged ends.
// They are his touches of 1868, broad and flat and loaded, not the later feathery ones; each is drawn in from the
// end where the brush was set down. She sits as he has her, turned three-quarters away with her head towards the
// right, about half life size (0.43 m to the top of her hair): the grey skirt spread on the grass in broad touches,
// the loose jacket a sack of stripes, white and blue and grey, the dark hair drawn back into a knot. Her face is in
// the shade and turned from us (it can be seen from the toy's eye out in the river): planes of tone, one dry band of
// shade across the eyes, a light down the nose, a cheek, a touch of rose, the far side lost, and no drawn feature.
// Her head turns to follow what is coming up, down at each image first and up with it; nothing else of her moves
// but her breathing.
//
// Where it is (along the wall from the picture's middle, positive to the viewer's right; out from the wall): the
// village stands 0.08 to 0.15 m out, 0.78 m to either side, the hill 0.57 m at its highest (the right) and the white
// gable 0.39 m, under a frame whose foot is 1.13 m up. Its image lies in front of it to 0.96 m out at the hill's
// highest and 0.75 m under the white gable, and a sheet on its way up sweeps no further than that. The water runs
// from the wall to the bank, 1.3 m out on the left and 1.5 m on the right, and from 1.0 m left to 0.9 m right, its
// two ends ragged by a touch's length. The grass lies beyond it to 2.0 m out (1.9 m on the right), 1.0 m left to
// 0.86 m right. She sits 0.44 m left of the middle and 1.62 m out, her skirt spread as far as 0.35 m round her; her
// hat is on the grass 0.07 m left and 1.8 m out; the boat lies to the right, 0.84 m long, stern in the water 1.0 m
// out and 0.16 m right, bow on the grass 1.72 m out and 0.6 m right. On the right the doorway to the stair hall
// begins 1.23 m from the middle: the water stops 0.33 m short of it, nothing solid or soft is within 0.5 m of it,
// and the way through is clear. On the left hangs Manet's Woman Reading, 1.0 m off (its canvas from 0.75 m, foot at
// 1.32 m): its table comes out under it, 0.8 to 1.2 m to the left and within 0.6 m of the wall, where this show has
// the last ragged touches of its water and the low left end of its hill (0.2 m high there); Morisot's powder,
// beyond, can dust the floor as far as 0.6 m left of this picture. The two are never out with this one (one show at
// a time in a room; the kit sends a lingering one home when another begins). Paris Street, the acrobats and the two
// sisters are on the opposite wall, thirteen metres away. Nothing here stands higher than 0.6 m, so from none of
// the checks' cameras does anything come in front of a canvas. She and the boat are soft to the toy (it is eased
// round them, never stopped dead); nothing else is solid. A small work: the kit keeps the whole of it in view, so
// from where you look the show is the lower middle of the frame, seen over her shoulder from behind and a little to
// her right, as he stood.
//
// No tune. The two that fit were read first and put back: Offenbach's Barcarolle (written in 1864 for another opera)
// is, in the words everyone knows, a song to a night of love, and "Bateau sur l'eau" is a lap game for a baby, with a
// fall into the water at the end; either would tell a story about her that the museum does not. The sounds are the
// river's, and a note as each sheet stands (D, F sharp, A, D: a chord, gathered).
// With "Reduce motion and flashing" on, everything goes at seven tenths of the speed, the sheets stand without
// rocking, the ripples are half as strong and the notes begin softly; nothing here flashes.
//
// What it does not do: the museum's note says that traces under the paint suggest she first held a bonneted child,
// presumably the couple's baby, whom he painted out. The show leaves the child where he left it: no child, no
// bundle, no empty place for one and nothing in her lap but her hands, because a child is not ours to bring back
// into a picture its painter took it out of. She is given no name in the caption beyond what she does, no story and
// nobody to wait for; the two small figures and the animal on the far shore stay in the picture (they are smaller
// than a touch, and may be children); nobody rows, and the boat stays where they left it.
import * as THREE from 'three';
import { lifeFor, ease, ramp, clamp01, lerp, shape, canvasTexture } from '../paintlife.js';
import { noise } from './stagecraft.js';

const TAU = Math.PI * 2;
const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const sstep = THREE.MathUtils.smoothstep, fall = (x, a, b) => 1 - sstep(x, a, b);      // (fall: 1 below a, 0 above b)

// ---------------------------------------------------------------- the place (metres: u along the wall to the viewer's right, o out from the picture)
const HALF = 0.78;                                          // the far bank reaches this far to either side
const PXM = 1024 / (2 * HALF);                              // its painting: pixels to the metre
const REG = { hill: [0, 0, 1024, 384], vil: [0, 400, 1024, 288] };      // where each sheet is painted on the canvas (x, y, w, h)
const O_HILL = 0.08, O_VIL = 0.14, AX = 0.02;               // the shore each sheet is hinged along; how far under the water the hinge is
const H_HILL = 384 / PXM, H_VIL = 288 / PXM;
const STR = 1.5;                                            // the image lies half as long again as the thing stands (a floor is seen at a slant)
const WU0 = -1.06, WU1 = 0.98, WO = 1.6, WROW = 44;         // the water's own painting: what it covers, and the height of a row of touches (pixels of 1024)
// the sheets, back to front (a sheet never swings through one that already stands): when each starts up, how long it takes
const PIECES = [
  { reg: 'hill', s0: 0, s1: 1, o: O_HILL, h: H_HILL, t0: 3.2, d: 1.4, hz: 146.83 },
  { reg: 'vil', s0: 0, s1: 0.338, o: O_VIL, h: H_VIL, t0: 4.55, d: 0.85, hz: 369.99 },
  { reg: 'vil', s0: 0.338, s1: 0.712, o: O_VIL + 0.003, h: H_VIL, t0: 5.2, d: 0.85, hz: 440 },
  { reg: 'vil', s0: 0.712, s1: 1, o: O_VIL + 0.006, h: H_VIL, t0: 6.15, d: 1.1, hz: 587.33 },
];
const NP = PIECES.length, NSH = 6;
const T_ALL = PIECES[NP - 1].t0 + PIECES[NP - 1].d;         // the far bank is all up
const RIP_V = 0.9;                                          // a ripple's speed over the water (m/s)
const T_WATER = 1.3, T_BANK = [1.0, 1.7], T_BUILT = 2.75;  // the river is laid; the bank; she is all there
const LAY_D = 0.2, BODY_D = 0.34;                           // one stroke drawn in; a body scumbled in under them
const bankLine = u => 1.30 + 0.20 * sstep(u, -0.6, 0.7) + 0.02 * Math.sin(u * 7);
// her, in her own frame (x to her left, y up, z the way she faces), SC to the metre
const SC = 1.15, SIT = [-0.44, 1.62], FACE = Math.PI - 0.4;
const DIRK = [-0.55, 0.835];                                // the way her knees lie under the skirt: to her right, and forward
const WAIST = [0, 0.112, 0.0], NECK = [0, 0.152, 0.004];
const SH_R = [-0.052, 0.108, 0.004], SH_L = [0.052, 0.108, 0.004], L1 = 0.128, L2 = 0.14;
// the boat: stern in the water, bow on the grass
const BOAT = { stern: [0.16, 1.0], bow: [0.6, 1.72], beam: 0.3, depth: 0.125, rake: 0.03 };
const HAT = [-0.07, 1.8];
const SOFT = [[SIT[0] + 0.03, SIT[1] - 0.04, 0.3], [0.3, 1.24, 0.17], [0.5, 1.56, 0.17]];      // what the toy is eased round (u, o, reach)

// ---------------------------------------------------------------- a brush's own print, for every mark on the near bank
// (four cells: a loaded flat touch, square-ended; the same run dry; a round dab; a plain patch for the bodies under them.
// Its colour is only the bristles' light and dark; its alpha is the mark's shape.)
let PRINT = null;
function brushPrint() {
  if (PRINT) return PRINT;
  const W = 256, mk = () => { const c = document.createElement('canvas'); c.width = c.height = W; return c.getContext('2d', { willReadFrequently: true }); }, gl = mk(), gm = mk();
  gl.fillStyle = 'rgb(232,232,232)'; gl.fillRect(0, 0, W, W); gm.fillStyle = '#000'; gm.fillRect(0, 0, W, W);
  const cell = (x0, y0, seed, fn) => { let s = seed; const r = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646; for (const g of [gl, gm]) { g.save(); g.beginPath(); g.rect(x0, y0, 128, 128); g.clip(); g.translate(x0, y0); g.lineCap = 'round'; } fn(r); gl.restore(); gm.restore(); };
  const line = (v, w, x0, y0, cx, cy, x1, y1) => { for (const [g, st] of [[gl, `rgb(${v},${v},${v})`], [gm, '#fff']]) { g.strokeStyle = st; g.lineWidth = w; g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(cx, cy, x1, y1); g.stroke(); } };
  const drag = dry => r => {
    for (let i = 0; i < 34; i++) {
      const y = 64 + (r() - 0.5) * 92, e = Math.pow(Math.abs(y - 64) / 48, 2.2), xa = 9 + e * 14 + r() * 9, xb = 119 - e * 16 - r() * (dry ? 38 : 9);
      line(204 + Math.floor(r() * 51), 6 + r() * 8, xa, y + (r() - 0.5) * 3, 64, y + (r() - 0.5) * 4, Math.max(xa + 8, xb), y + (r() - 0.5) * 4);
    }
    gm.strokeStyle = '#000';      // the gaps, where the paint ran out
    for (let i = 0; i < (dry ? 11 : 2); i++) { const y = 22 + r() * 84, xa = (dry ? 40 : 84) + r() * 34; gm.lineWidth = 1.4 + r() * 2.2; gm.beginPath(); gm.moveTo(xa, y); gm.lineTo(124, y + (r() - 0.5) * 5); gm.stroke(); }
  };
  cell(0, 0, 11, drag(false)); cell(128, 0, 29, drag(true));
  cell(0, 128, 47, r => {
    for (let i = 0; i < 12; i++) { const a = r() * TAU, rr = Math.sqrt(r()) * 20, v = 208 + Math.floor(r() * 47), x = 64 + Math.cos(a) * rr * 1.25, y = 64 + Math.sin(a) * rr, rx = 15 + r() * 10, ry = 12 + r() * 8, ro = r() * 3; for (const [g, st] of [[gl, `rgb(${v},${v},${v})`], [gm, '#fff']]) { g.fillStyle = st; g.beginPath(); g.ellipse(x, y, rx, ry, ro, 0, TAU); g.fill(); } }
    for (let i = 0; i < 9; i++) { const y = 64 + (r() - 0.5) * 56; line(212 + Math.floor(r() * 43), 4 + r() * 5, 26 + r() * 20, y, 64, y, 102 - r() * 22, y + (r() - 0.5) * 8); }
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

// One flat touch of 1868 on a canvas: a loaded brush set down and dragged, square and ragged at both ends, one colour.
function flatTouch(g, r, x, y, len, wid, ang, fill, rag = 0.3) {
  g.save(); g.translate(x, y); g.rotate(-ang);
  const hl = len / 2, hw = wid / 2, e = () => rag * wid * r();
  g.fillStyle = fill; g.beginPath();
  g.moveTo(-hl + e(), -hw + r() * 2); g.lineTo(-hl * 0.3, -hw - r() * 1.5); g.lineTo(hl * 0.4, -hw + r() * 1.5); g.lineTo(hl - e(), -hw + r() * 2);
  g.lineTo(hl - e(), -hw * 0.35); g.lineTo(hl - e(), hw * 0.3); g.lineTo(hl - e(), hw - r() * 2);
  g.lineTo(hl * 0.3, hw + r() * 1.5); g.lineTo(-hl * 0.4, hw - r() * 1.5); g.lineTo(-hl + e(), hw - r() * 2);
  g.lineTo(-hl + e(), hw * 0.35); g.lineTo(-hl + e(), -hw * 0.3);
  g.closePath(); g.fill();
  g.lineCap = 'butt';      // the bristles' light and dark, faint: it is a flat touch
  for (let i = 0; i < Math.max(2, wid / 6); i++) { const yy = (r() - 0.5) * wid * 0.78; g.globalAlpha = 0.04 + 0.07 * r(); g.strokeStyle = r() < 0.55 ? '#fff' : '#000'; g.lineWidth = 1 + r() * 2.4; g.beginPath(); g.moveTo(-hl * (0.55 + 0.3 * r()), yy); g.lineTo(hl * (0.55 + 0.3 * r()), yy + (r() - 0.5) * 2); g.stroke(); }
  g.restore();
}

// ---------------------------------------------------------------- his river, painted once: rows of broad level touches
// Pale and warm under the far bank, lilac and cloud in the middle, blue towards us (the sky, upside down); each touch
// wholly one colour, and the river's two ends only the ends of its touches. Laid a row at a time in the shader.
function paintWater(css) {
  const tex = canvasTexture(1024, 1024, g => {
    g.clearRect(0, 0, 1024, 1024);
    let sd = 815391; const r = () => ((sd = (sd * 16807) % 2147483647) - 1) / 2147483646, pick = list => list[Math.min(list.length - 1, Math.floor(r() * list.length))];
    const X = u => (u - WU0) / (WU1 - WU0) * 1024, rows = Math.ceil(1024 / WROW);
    const FAR = ['#cfcbd0', '#d8d3d2', '#c6c5d0', '#dcd8d4', '#cdc8c8'], MID = ['#bcc0d2', '#b0b8d0', '#c6c6d4', '#a8b3cf', '#b8bbcf'], PALE = ['#cdced8', '#d6d5d8', '#c2c7d6'], NEAR = ['#86a2cf', '#7b9aca', '#90aad2', '#7393c6', '#9ab0d4'];
    for (let pass = 0; pass < 2; pass++) for (let j = 0; j < rows; j++) {
      const y = (j + 0.5) * WROW, o = y / 1024 * WO;
      // (the river is a little longer on the right, where it runs on towards the door; its ends are ragged, a row at a time)
      const xa = X(-1.0 + 0.1 * r() + (j % 3 === 1 ? 0.1 : 0)), xb = X(0.9 - 0.1 * r() - (j % 3 === 2 ? 0.09 : 0));
      for (let x = xa + (pass ? 60 : 0); x < xb; ) {
        const len = Math.min(120 + 170 * r(), xb - x + 20), oo = o + (r() - 0.5) * 0.16 - 0.1 * (x / 1024 - 0.5);
        const cols = oo < 0.42 ? FAR : oo < 0.86 ? (r() < 0.2 ? PALE : MID) : oo < 1.0 ? (r() < 0.55 ? PALE : MID) : (r() < 0.1 ? MID : NEAR);
        if (!pass || r() < 0.45) flatTouch(g, r, x + len / 2, y + (r() - 0.5) * 6, len, WROW * (1.12 + 0.14 * r()), (r() - 0.5) * 0.02, css(pick(cols)), 0.34);
        x += len * (pass ? 1.6 : 0.86);
      }
    }
  });
  tex.generateMipmaps = false; tex.minFilter = THREE.LinearFilter; tex.magFilter = THREE.LinearFilter; tex.needsUpdate = true;
  return tex;
}

// ---------------------------------------------------------------- his grass, painted once: the near bank in the tree's shade
// Short broad touches of dark green, a few lighter, sunlit low on the left where the light gets under the tree; yellow
// and white dabs for the flowers. Its edges are the ends of its touches.
const GO0 = 1.12, GPX = 1024 / (WU1 - WU0);
function paintGrass(css) {
  const tex = canvasTexture(1024, 1024, g => {
    g.clearRect(0, 0, 1024, 1024);
    let sd = 815392; const r = () => ((sd = (sd * 16807) % 2147483647) - 1) / 2147483646, pick = list => list[Math.min(list.length - 1, Math.floor(r() * list.length))];
    const DK = ['#27351f', '#2f4024', '#1f2b1a', '#384a28', '#2b3a22', '#33442a'], MD = ['#40552c', '#4a6030', '#374b29', '#455a33'], LT = ['#5d7434', '#6d853a', '#58703a'], SUN = ['#8aa24a', '#9bb055', '#7c963f', '#a6b85e'];
    const inside = (u, o) => Math.min((o - bankLine(u)) / 0.05, (2.0 - 0.1 * sstep(u, 0, 0.8) + 0.03 * Math.sin(u * 5 + 1) - o) / 0.1, (u + 1.0) / 0.1, (0.86 - u) / 0.1);
    for (let pass = 0; pass < 3; pass++) for (let i = 0, n = [1100, 900, 420][pass]; i < n; i++) {
      const u = lerp(-1.04, 0.9, r()), o = lerp(1.2, 2.06, r()), k = inside(u, o), sun = fall(u, -0.95, -0.25) * sstep(o, 1.62, 1.92), r1 = r(), r2 = r(), r3 = r(), r4 = r();
      if (k < (pass ? 0.35 : -0.25) + 0.7 * r1) continue;
      const cols = r2 < sun * 0.8 ? (pass ? SUN : LT) : pass === 0 ? DK : pass === 1 ? (r2 < 0.3 ? MD : DK) : (r2 < 0.4 ? LT : MD);
      const big = [1, 0.72, 0.55][pass];
      flatTouch(g, r, (u - WU0) * GPX, (o - GO0) * GPX, (44 + 34 * r3) * big, (22 + 9 * r4) * big, (r() - 0.5) * 1.5 + 0.55, css(pick(cols)), 0.4);
    }
    for (let i = 0; i < 70; i++) { const u = lerp(-0.94, 0.8, r()), o = lerp(1.3, 1.95, r()), y = r() < 0.72; if (inside(u, o) < 0.5) continue; flatTouch(g, r, (u - WU0) * GPX, (o - GO0) * GPX, 9 + 4 * r(), 8 + 3 * r(), r() * 3, css(y ? pick(['#e6cf4a', '#efd95a', '#dcc23c']) : pick(['#eef0e6', '#e2e8dc'])), 0.3); }
  });
  tex.needsUpdate = true;
  return tex;
}

// ---------------------------------------------------------------- the far bank, painted once: two sheets on one canvas
// Broad flat touches with ragged ends, as he laid them in 1868; a sheet's outline is only the ends of its touches.
// css(hex) leans a colour a little towards the picture's own palette.
function paintBank(css) {
  const tex = canvasTexture(1024, 1024, g => {
    g.clearRect(0, 0, 1024, 1024);
    let sd = 81539; const r = () => ((sd = (sd * 16807) % 2147483647) - 1) / 2147483646, pick = list => list[Math.min(list.length - 1, Math.floor(r() * list.length))];
    let Y0 = 0, HH = 0;
    // one touch: its middle (x, and y up from the sheet's foot), its length and width, the way it lies, its colour
    const touch = (x, y, len, wid, ang, colr, rag = 0.3) => flatTouch(g, r, x, Y0 + HH - y, len, wid, ang, css(colr), rag);
    // a pitched end wall: one clean shape (its two slopes), filled with level touches
    const gable = (x0, x1, yb, ye, yt, cols, o) => { g.save(); g.beginPath(); const Yc = y => Y0 + HH - y; g.moveTo(x0, Yc(yb)); g.lineTo(x0 + 2 * r(), Yc(ye)); g.lineTo((x0 + x1) / 2 + 3 * (r() - 0.5), Yc(yt)); g.lineTo(x1 - 2 * r(), Yc(ye)); g.lineTo(x1, Yc(yb)); g.closePath(); g.clip(); block(x0 - 8, x1 + 8, yb, yt + 6, cols, o); g.restore(); };
    const sheet = ([x0, y0, w, h], fn) => { g.save(); g.beginPath(); g.rect(x0, y0, w, h); g.clip(); Y0 = y0; HH = h; fn(); g.restore(); };
    // a block: rows of level touches filling x0..x1, y0..y1
    const block = (x0, x1, y0, y1, cols, { wid = 34, len = 78, ang = 0, jit = 0.05 } = {}) => {
      const rows = Math.max(1, Math.round((y1 - y0) / (wid * 0.8))), n = Math.max(1, Math.round((x1 - x0) / (len * 0.72)));
      for (let j = 0; j < rows; j++) for (let i = 0; i < n; i++) {
        const y = y0 + (y1 - y0) * (rows === 1 ? 0.5 : (j + 0.5) / rows), x = x0 + (x1 - x0) * (n === 1 ? 0.5 : (i + 0.5) / n) + (j % 2 ? 0.2 : -0.2) * len * (n > 1 ? 1 : 0);
        touch(Math.max(x0 + len * 0.35, Math.min(x1 - len * 0.35, x)), y, Math.min(len, (x1 - x0) * 1.02) * (0.9 + 0.2 * r()), (y1 - y0) / rows * (1.12 + 0.1 * r()), ang + (r() - 0.5) * jit, pick(cols));
      }
    };

    // ---- the hill: olive slopes on the left, the dark bushes, the striped fields rising to the right, the pale ridge
    sheet(REG.hill, () => {
      const ridge = x => { const t = x / 1024; return 150 + 195 * Math.pow(sstep(t, 0.2, 1.0), 1.1) + 13 * Math.sin(t * 9); };
      for (let y = 14; y < 360; y += 25) for (let x = -20 + (Math.round(y / 25) % 2) * 34; x < 1050; x += 66) {
        const top = ridge(x) - 20; if (y > top) continue;
        const t = x / 1024, bush = Math.exp(-Math.pow((t - 0.47) / 0.11, 2)) * sstep(y, 60, 150);
        const cols = r() < bush ? ['#4f6a3a', '#5a7340', '#445c34', '#536e3c'] : t < 0.3 ? ['#8f8c50', '#858848', '#9c965a', '#a9a468', '#7b8244'] : ['#8a8a4c', '#7c8444', '#989254', '#707c40', '#a09a5a'];
        touch(x + (r() - 0.5) * 16, Math.min(y, top), 74 + 24 * r(), 30 + 6 * r(), (r() - 0.5) * 0.16 + 0.1 * sstep(t, 0.3, 0.9), pick(cols));
      }
      { const f = ['#9db86a', '#6f9a52', '#4d7a48', '#b5c688', '#7aa458', '#b99d5c', '#5f8c4e', '#a9c07a', '#467244', '#8fb060']; let k = 0;      // the fields: strips, leaning a little
        for (let x = 610; x < 1040; x += 30 + 12 * r()) { const top = ridge(x) - 24, lo = 96 + 20 * r(); if (top - lo < 40) continue; const wd = 30 + 14 * r(); for (let y = lo; y < top; y += 60) touch(x + (y - lo) * 0.1, Math.min(y + 30, top - 14), 78, wd, Math.PI / 2 - 0.1 + (r() - 0.5) * 0.05, f[k % f.length], 0.22); k++; } }
      for (let x = 20; x < 1040; x += 58) { const y = ridge(x) - 9, sl = Math.atan2(ridge(x + 30) - ridge(x - 30), 60); touch(x, y, 84, 19 + 4 * r(), sl, x < 430 ? pick(['#a8a064', '#9c965a', '#b4aa6e']) : pick(['#c9a26a', '#d2ae78', '#bf9860', '#d8b888'])); }      // the ridge, sandy against the sky
      for (let x = 470; x < 1020; x += 26 + 30 * r()) touch(x, ridge(x) + 3, 9 + 5 * r(), 7, Math.PI / 2 + (r() - 0.5) * 0.2, pick(['#d8c49a', '#cdb88a', '#e0cfa8']), 0.2);       // the pale line of things along it
    });

    // ---- the village on its shore
    sheet(REG.vil, () => {
      const SAND = ['#d9c9a0', '#cdbb8e', '#e2d5b2', '#c4b184', '#d4c296'];
      for (const [y, wd] of [[13, 28], [36, 26], [54, 18]]) for (let x = 10 + (y % 3) * 20; x < 1040; x += 78) touch(x + (r() - 0.5) * 20, y + (r() - 0.5) * 4, 92 + 20 * r(), wd, (r() - 0.5) * 0.05, x < 330 && r() < 0.45 ? pick(['#b9b07c', '#c4b98a', '#a9a870']) : pick(SAND));
      for (let x = 400; x < 1040; x += 86) touch(x, 40 + (x - 400) * 0.012, 100, 9, 0.012, '#ece2c8', 0.5);                    // the path, pale
      for (let i = 0; i < 16; i++) touch(40 + r() * 950, 22 + r() * 30, 22 + 10 * r(), 8, (r() - 0.5) * 0.3, pick(['#7e9a56', '#6a8a4a', '#8ea662']), 0.4);
      touch(640, 9, 150, 10, 0.01, '#4c4841', 0.4); touch(632, 15, 118, 4, 0.01, '#8c8676', 0.4);                               // two boats drawn up over there
      touch(925, 10, 165, 11, -0.008, '#413e3a', 0.4); touch(915, 16, 125, 4, -0.008, '#7e796c', 0.4);
      const CREAM = ['#e6dfcb', '#dcd4bd', '#ece6d6', '#e2dac4'], OCHRE = ['#cdb681', '#d6c292', '#c2aa74', '#d0bb88'], ROSE = ['#b58d86', '#a98079', '#c09a90', '#b08a86'], SLATE = ['#8f8791', '#9a8f93', '#857d8b'];
      const WHITE = ['#f0ebdc', '#e8e1cf', '#f5f1e6', '#ece6d6'], BUSH = ['#6f9c48', '#5f8c3e', '#83ac56', '#7aa44e', '#55803a'], DARK = ['#4a4036', '#544a3e', '#3f362e'];
      // on the left: the long cream house under its slate roof, a low ochre shed, a dark bush
      block(22, 78, 56, 104, OCHRE, { wid: 30, len: 60 }); block(18, 84, 100, 124, ROSE, { wid: 24, len: 70 });
      block(70, 306, 58, 136, CREAM, { wid: 40, len: 74 }); block(58, 318, 132, 170, SLATE, { wid: 36, len: 92 });
      for (const x of [104, 156, 210, 262]) touch(x, 100, 21, 12, Math.PI / 2, pick(DARK), 0.2);
      touch(188, 70, 24, 14, Math.PI / 2, DARK[0], 0.2);
      for (let i = 0; i < 5; i++) touch(300 + 30 * r(), 64 + 46 * r(), 42, 26, (r() - 0.5) * 0.8, pick(['#4f6f3c', '#5d7f44', '#456636']));
      // in the middle: ochre walls, the long rose roofs one behind another, a gable; the big bush in front of them
      block(378, 566, 58, 124, OCHRE, { wid: 34, len: 70 }); block(366, 580, 120, 168, ROSE, { wid: 38, len: 88 }); block(446, 606, 166, 202, ['#a57f7f', '#b08a86', '#9c7878'], { wid: 32, len: 84 });
      gable(580, 694, 56, 148, 212, OCHRE, { wid: 40, len: 84 });
      touch(618, 104, 24, 15, Math.PI / 2, DARK[0], 0.2); touch(660, 110, 14, 11, Math.PI / 2, DARK[1], 0.2); touch(637, 164, 11, 10, 0, DARK[2], 0.2);
      block(692, 716, 58, 122, ['#b7a274', '#a8946a'], { wid: 34, len: 30 });
      for (let i = 0; i < 16; i++) { const x = 430 + r() * 190, y = 58 + r() * 62; touch(x, y, 58 + 20 * r(), 34 + 8 * r(), (r() - 0.5) * 0.9, pick(BUSH)); }
      // on the right: a low blue-white wall under a rose roof, and the white gable with its dark door
      block(742, 826, 58, 116, ['#c9d2d6', '#d5dcdc', '#bfcad0'], { wid: 32, len: 62 }); block(736, 834, 112, 148, ROSE, { wid: 30, len: 76 });
      gable(836, 1000, 56, 186, 268, WHITE, { wid: 46, len: 118 });
      block(826, 848, 58, 180, ['#bdb6ae', '#b2aaa4'], { wid: 44, len: 24 });
      touch(904, 108, 56, 17, Math.PI / 2, '#3a332c', 0.16); touch(960, 160, 20, 12, Math.PI / 2, DARK[0], 0.2); touch(918, 218, 11, 10, 0, DARK[1], 0.2);
      for (let i = 0; i < 4; i++) touch(998 + 16 * r(), 66 + 36 * r(), 34, 24, (r() - 0.5) * 0.8, pick(BUSH));
    });
  });
  tex.generateMipmaps = false; tex.minFilter = THREE.LinearFilter; tex.magFilter = THREE.LinearFilter; tex.needsUpdate = true;
  return tex;
}

// A sheet of nu by nv quads, not indexed, with normals: fn(i, j, p) fills p; ref is the way its middle faces.
function grid(nu, nv, fn, ref) {
  const pos = [], idx = [], p = V3(), W = nv + 1;
  for (let i = 0; i <= nu; i++) for (let j = 0; j <= nv; j++) { fn(i, j, p); pos.push(p.x, p.y, p.z); }
  for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) { const a = i * W + j, b = a + 1, c = a + W, d = c + 1; idx.push(a, c, b, b, c, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  const m = Math.floor(nu / 2) * W + Math.floor(nv / 2), n = g.attributes.normal;
  if (n.getX(m) * ref.x + n.getY(m) * ref.y + n.getZ(m) * ref.z < 0) { for (let i = 0; i < idx.length; i += 3) { const t = idx[i + 1]; idx[i + 1] = idx[i + 2]; idx[i + 2] = t; } g.setIndex(idx); g.computeVertexNormals(); }
  return g.toNonIndexed();
}

lifeFor(81539, {
  title: /^On the Bank of the Seine/,
  word: 'twice',
  // (the camera stands behind her and a little to her right, as he did, and looks over her shoulder across the water;
  // a small work: the kit keeps the whole of it in view above the far bank)
  stage: { out: 2.05, half: 1.1, cam: { dist: 3.3, height: 1.5, side: 0.3, fov: 58, lookU: -0.02, lookOut: 0.8, lookH: 0.5, floorOut: 2.05 } },
  wake: 2, ret: 2.6,
  linger: { near: 4, max: 30 },

  build(L) {
    const P = L.pal, col = (h, a = 0.12) => P.near(h, a), C = (list, a) => list.map(h => col(h, a)), css = (h, a = 0.1) => '#' + col(h, a).getHexString();
    const T = V3(L.tx, 0, L.tz), N = V3(L.nx, 0, L.nz), UP = V3(0, 1, 0);
    this.O = L.floor(0, 0);
    this.B = new THREE.Matrix4().makeBasis(T, UP, N).setPosition(this.O);
    this.V = { m: new THREE.Matrix4(), l: new THREE.Matrix4(), q: new THREE.Quaternion(), e: new THREE.Euler(0, 0, 0, 'YXZ'), one: V3(1, 1, 1), pos: V3() };
    const y0 = L.y + 0.013;

    // ---------------------------------------------------------- the floor: the river, the far bank's image in it, the grass
    const tBank = paintBank(css);
    const tWater = paintWater(css);
    // his grass, in the tree's shade: dark greens in short broad touches, a few lighter, yellow and white for the flowers
    const tGrass = paintGrass(css);
    const gp = [], U_LO = -1.12, U_HI = 1.02, O_IN = -L.wall + 0.004, O_OUT = 2.12;
    for (const [u, o] of [[U_LO, O_IN], [U_HI, O_IN], [U_LO, O_OUT], [U_HI, O_OUT]]) { const p = L.floor(u, o); gp.push(p.x, y0, p.z); }
    const gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.Float32BufferAttribute(gp, 3)); gg.setIndex([0, 2, 1, 1, 2, 3]);
    const gu = this.gu = {
      tWater: { value: tWater }, tGrass: { value: tGrass }, tBank: { value: tBank }, uAx: { value: new THREE.Vector4(L.tx, L.tz, L.nx, L.nz) }, uO: { value: L.floor(0, 0) },
      uT: { value: 0 }, uFront: { value: -1 }, uBankK: { value: 0 }, uGain: { value: 0.5 },
      uRip: { value: new THREE.Vector4() }, uPc: { value: PIECES.map(() => new THREE.Vector4()) }, uToy: { value: new THREE.Vector4(0, 9, 0, 0) }, uSh: { value: Array.from({ length: NSH }, () => new THREE.Vector4()) },
          };
    const F3 = x => x.toFixed(4), reg = a => `vec4(${a.map(v => v.toFixed(1)).join(', ')})`;
    const gm = this.gmat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false });
    gm.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, gu);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vW;').replace('#include <begin_vertex>', '#include <begin_vertex>\n  vW = (modelMatrix * vec4(position, 1.0)).xyz;');
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', `#include <common>
uniform sampler2D tWater, tGrass, tBank; uniform vec4 uAx, uRip, uToy; uniform vec3 uO; uniform float uT, uFront, uBankK, uGain;
uniform vec4 uPc[${NP}]; uniform vec4 uSh[${NSH}];
varying vec3 vW; vec3 gCol; float gA;
// one of the far bank's sheets, s across it and v up it from its foot
vec4 lay(float s, float v, vec4 rg) { if (s < 0.002 || s > 0.998 || v < 0.006 || v > 0.994) return vec4(0.0); return texture2D(tBank, vec2((rg.x + s * rg.z) / 1024.0, 1.0 - (rg.y + rg.w * (1.0 - v)) / 1024.0)); }`)
        .replace('#include <map_fragment>', `#include <map_fragment>
{
  vec2 r = vW.xz - uO.xz, q = vec2(dot(r, uAx.xy), dot(r, uAx.zw));
  float ob = 1.30 + 0.20 * smoothstep(-0.6, 0.7, q.x) + 0.02 * sin(q.x * 7.0);
  // his water: rows of broad level touches, each wholly one colour
  vec2 wuv = vec2((q.x - ${F3(WU0)}) / ${F3(WU1 - WU0)}, q.y / ${F3(WO)});
  vec4 ws = texture2D(tWater, vec2(wuv.x, 1.0 - wuv.y));
  // what stirs it: the level bands of the image slide a little to and fro (more where a ripple is passing, where a
  // sheet is leaving the water, and round the toy)
  float band = floor(q.y * 24.0 + 0.6 * sin(q.x * 2.3 + 1.0)), hb = fract(sin(band * 12.9898 + 4.1) * 43758.5453);
  float amp = uRip.x + uRip.z * exp(-pow((q.y - uRip.y) / 0.2, 2.0));
  for (int i = 0; i < ${NP}; i++) { vec4 pc = uPc[i]; amp += pc.w * smoothstep(pc.x - 0.12, pc.x + 0.04, q.x) * (1.0 - smoothstep(pc.y - 0.04, pc.y + 0.12, q.x)) * exp(-pow((q.y - pc.z) / 0.2, 2.0)); }
  vec2 td = q - uToy.xy; amp += uToy.z * exp(-dot(td, td) / 0.07);
  float du = (hb - 0.5) * 2.0 * amp * sin(uT * (1.5 + 1.7 * hb) + hb * 31.0), dv = 0.3 * amp * sin(uT * 2.7 + q.x * 13.0 + hb * 9.0);
  // the far bank in the water: its sheets lying where they would fold down along their shore, drawn out longer
  float s = (q.x + du + ${F3(HALF)}) / ${F3(2 * HALF)};
  vec4 ch = lay(s, (q.y + dv - ${F3(O_HILL)}) / ${F3(H_HILL * STR)}, ${reg(REG.hill)}), cv = lay(s, (q.y + dv - ${F3(O_VIL)}) / ${F3(H_VIL * STR)}, ${reg(REG.vil)});
  float av = step(0.5, cv.a), ra = max(av, step(0.5, ch.a));
  vec3 refl = mix(ch.rgb, cv.rgb, av);
  refl = mix(refl, refl * vec3(0.84, 0.9, 0.74) + vec3(0.02, 0.03, 0.01), 0.55);          // (greener and a little duller than the thing, as he has it)
  // level slits of the sky's colour across it: an image in pieces (more of them where the water is stirred)
  float brk = step(0.9 - 6.0 * amp, hb) * step(0.42, fract(q.x * 1.7 + hb * 7.0 + 0.3 * sin(uT * 0.4 + hb * 20.0)));
  vec3 water = mix(ws.rgb, refl, ra * (1.0 - brk));
  // it is laid a row at a time from the far side, each row drawn across (one from the left, the next from the right)
  float row = floor(wuv.y * ${(1024 / WROW).toFixed(4)}), rowO = row * ${F3(WROW / 1024 * WO)}, odd = mod(row, 2.0);
  float sweep = clamp((uFront - rowO) / 0.3, 0.0, 1.0) * 1.25 - mix(wuv.x, 1.0 - wuv.x, odd) - 0.06 * hb;
  float wm = step(0.5, ws.a) * step(0.006, q.y) * step(0.0, sweep) * step(q.y, ob + 0.03);
  // the near bank: his grass, laid from the water's edge outwards, ragged all round
  vec4 gs = texture2D(tGrass, vec2(wuv.x, 1.0 - (q.y - ${F3(GO0)}) * ${F3(GPX / 1024)}));
  float gfront = uBankK * 1.5 - clamp((q.y - ob) / 0.75, 0.0, 1.0) - 0.22 * (0.5 + 0.5 * sin(q.x * 9.0 + 1.3) * sin(q.y * 13.0 + q.x * 4.0));
  float gk = step(0.5, gs.a) * step(${F3(GO0 + 0.004)}, q.y) * step(0.0, gfront);
  vec3 grass = gs.rgb;
  float shade = 1.0;
  for (int i = 0; i < ${NSH}; i++) { vec4 S = uSh[i]; if (S.w <= 0.0) continue; vec2 e = (q - S.xy) / S.z; shade *= 1.0 - S.w * exp(-dot(e, e) * 1.6); }
  vec3 c = mix(water * mix(1.0, shade, 0.45), grass * shade, gk);
  gCol = c * uGain; gA = max(wm * 0.97 * (1.0 - gk), gk);
  if (gA < 0.004) discard;
}`)
        .replace('#include <opaque_fragment>', '  outgoingLight = gCol; diffuseColor.a = gA;\n#include <opaque_fragment>');
    };
    gm.customProgramCacheKey = () => 'bennecourt-ground';
    const ground = this.ground = new THREE.Mesh(gg, gm); ground.renderOrder = 5;
    L.add(ground);
    // (it lies on the floor: not drawn into the polished floor's reflection; shown and hidden by its material)
    { const fl = L.k.museum.floors; if (fl && !fl.includes(ground)) fl.push(ground); }

    // ---------------------------------------------------------- the far bank's sheets: each hinged along its shore, just under the water
    {
      const pos = [], uv = [], pc = [], idx = [];
      PIECES.forEach((p, i) => {
        const [x0, yy0, w, h] = REG[p.reg], k = pos.length / 3;
        for (const [s, v] of [[p.s0, 0], [p.s1, 0], [p.s0, 1], [p.s1, 1]]) { pos.push(-HALF + 2 * HALF * s, v * p.h, p.o); uv.push((x0 + s * w) / 1024, 1 - (yy0 + h * (1 - v)) / 1024); pc.push(i); }
        idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2);
      });
      const fg = new THREE.BufferGeometry(); fg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); fg.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); fg.setAttribute('aPc', new THREE.Float32BufferAttribute(pc, 1)); fg.setIndex(idx);
      const fu = this.fu = { uAng: { value: new Float32Array(NP) }, uGainF: { value: 0.56 } };
      const fm = this.fmat = new THREE.MeshBasicMaterial({ map: tBank, alphaTest: 0.5, side: THREE.DoubleSide, fog: false });
      fm.onBeforeCompile = sh => {
        Object.assign(sh.uniforms, fu);
        sh.vertexShader = sh.vertexShader.replace('#include <common>', `#include <common>\nattribute float aPc; uniform float uAng[${NP}]; varying float vUp;`)
          .replace('#include <begin_vertex>', `float lfTh = uAng[int(aPc + 0.5)], lfSn = sin(lfTh);
  float lfLen = position.y * mix(${F3(STR)}, 1.0, smoothstep(0.0, 0.9, lfSn));      // (drawn out long while it lies, as its image is; its own height by the time it stands)
  vec3 transformed = vec3(position.x, lfLen * lfSn - ${F3(AX)}, position.z + lfLen * cos(lfTh));
  vUp = lfSn;`);
        sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uGainF; varying float vUp;')
          // (wet, and the image's own colour, as it leaves the water; its own colour by the time it stands)
          .replace('#include <map_fragment>', `#include <map_fragment>
  { vec3 wet = diffuseColor.rgb * vec3(0.84, 0.9, 0.74) + vec3(0.02, 0.03, 0.01); diffuseColor.rgb = mix(mix(diffuseColor.rgb, wet, 0.55), diffuseColor.rgb, smoothstep(0.12, 0.92, vUp)) * uGainF; }`);
      };
      fm.customProgramCacheKey = () => 'bennecourt-sheets';
      const flats = this.flats = new THREE.Mesh(fg, fm); flats.matrixAutoUpdate = false; flats.matrix.copy(this.B); flats.matrixWorldNeedsUpdate = true;
      L.add(flats);
    }

    // ---------------------------------------------------------- the near bank: everything on it is paint
    const R = () => L.rand();
    const KEY = V3(-0.42, 0.72, 0.55).normalize();           // the light on her back: from our side, above, a little from the left
    const pick = (list, r) => list[Math.min(list.length - 1, Math.floor(r * list.length))];
    const set = (hi, mid, lo, deep, a) => ({ hi: C(hi, a), mid: C(mid, a), lo: C(lo, a), deep: C(deep, a) });
    const GY = set(['#bcbbbf', '#b5b3ba', '#c2c0c5'], ['#a09ea6', '#9997a0', '#a6a4ab'], ['#807e88', '#797781'], ['#63616b', '#5c5a64']);                       // the skirt
    const JK = set(['#e9eaea', '#e2e5e8'], ['#c3ccd6', '#bcc6d2'], ['#94a3b8', '#8c9bb0'], ['#66758e', '#5e6d86']);                                           // the jacket, under its stripes
    const FL = set(['#d6ac86', '#d0a47e'], ['#b98e6c', '#b38866', '#bc9170'], ['#936b52', '#8d654c'], ['#6f4d3b', '#684736']);                               // her skin, in the shade
    const HR = set(['#4a3528', '#433024'], ['#30221a', '#2b1e17'], ['#211712', '#1d1410'], ['#150e0a']);                                                     // her hair
    const GN = set(['#7fb596', '#74ab8c'], ['#4f8f6c', '#488764', '#559572'], ['#2f6b4f', '#2a6348'], ['#1f4a38', '#1b4232']);                               // the boat's green
    const CRM = set(['#e0d6b4', '#d9cfac'], ['#c9bd98', '#c2b690'], ['#a69a78', '#9e9270'], ['#7c7258']);                                                    // its boards
    const STW = set(['#efe6a4', '#eadf98'], ['#dccd7c', '#d6c674'], ['#b9a85e', '#b0a058'], ['#8c7e46']);                                                    // the straw of the hat
    const GYH = C(['#c9c7ca', '#b3a9bb', '#a8a6ac', '#c2bac6', '#9a98a2', '#d2d0d2', '#8e8c96', '#bdb4c2'], 0.08);       // greys and lilacs
    const STRIPE = { w: C(['#eef0ef', '#e6eaec', '#f3f3f0'], 0.05), p: C(['#c5d3e2', '#b9cade', '#cdd8e4'], 0.08), b: C(['#8fa9cc', '#7f9bc2', '#9fb7d6'], 0.08), g: C(['#a9adb0', '#9ea3a8'], 0.08), d: C(['#4a5364', '#3f4858', '#566070'], 0.08) };
    const HRH = C(['#2c2019', '#3a2a20', '#241a14', '#46342a'], 0.1), FLH = C(['#c2987a', '#b98e6c', '#cca284', '#ad8262', '#be9472'], 0.1), HAIR_LIT = C(['#6a4e38', '#5c4432'], 0.1);
    const GNH = C(['#4f8f6c', '#3f7f5e', '#63a07e', '#2f6b4f', '#74ab8c', '#3a765a'], 0.1), CRH = C(['#d9cfac', '#c9bd98', '#e4dbbc', '#b8ac88', '#d0c5a0'], 0.1), STH = C(['#efe6a4', '#e2d488', '#f3ecb6', '#d6c674', '#e9dd92'], 0.08);
    const SOCK = col('#7c5642', 0.1), LOST = col('#7a5440', 0.1), EYE = col('#4c3428', 0.1), CHEEK = col('#d2a482', 0.08), ROSE = col('#9c5a4a', 0.1), BLUE_R = C(['#2f5fb5', '#3a6cc0', '#2852a2'], 0.06);
    const GRASS = C(['#2c3d22', '#35492a', '#445a2e', '#222e1c', '#566b32'], 0.1), YEL = C(['#e6cf4a', '#efd95a', '#dcc23c'], 0.06), WHT = C(['#eef0e6', '#e2e8dc'], 0.06);
    // The tone of a form where it faces the light (run smoothly into each other, and kept close: his forms are flat);
    // and a stroke on it: that tone, leaning to one of the mass's own colours, a little of the luck of the brush.
    const under = S => { const c = new THREE.Color(); return n => { const k = n.dot(KEY); return c.copy(S.deep[0]).lerp(S.lo[0], sstep(k, -0.85, -0.35)).lerp(S.mid[0], sstep(k, -0.4, 0.1)).lerp(S.hi[1 % S.hi.length], sstep(k, 0.15, 0.7)).multiplyScalar(0.98); }; };
    const mixer = (S, hues, amt = 0.4, v = 0.14) => {
      const u = under(S), ref = S.mid[0], c = new THREE.Color();
      return (n, r) => { const h = pick(hues, (r * 7.31) % 1), a = amt * (0.4 + 1.2 * ((r * 3.17) % 1)), k = 1 + (r - 0.5) * v, f = (x, y) => lerp(1, Math.max(0.6, Math.min(1.5, x / Math.max(0.02, y))), a) * k; c.copy(u(n)); return new THREE.Color(c.r * f(h.r, ref.r), c.g * f(h.g, ref.g), c.b * f(h.b, ref.b)); };
    };

    // ---------------------------------------------------------- parts: bodies and the strokes on them
    // A part is one piece of the rig (it moves as one). Every vertex carries when its mark is laid (aLay.x) and whether
    // it is a stroke, drawn in from the end where the brush was set down, or a body, scumbled in under the strokes.
    const part = rest => { rest = rest ? rest.clone() : new THREE.Matrix4(); return { pos: [], nor: [], col: [], uv: [], lay: [], rest, inv: rest.clone().invert(), n: 0 }; };
    const side = V3(), d2 = V3(), cl = V3(), wp = V3(), nW = V3(), ca = new THREE.Color(), cb = new THREE.Color();
    const vert = (Pt, p, n, c, uv, t, body) => { Pt.pos.push(p.x, p.y, p.z); Pt.nor.push(n.x, n.y, n.z); Pt.col.push(c.r, c.g, c.b); Pt.uv.push(uv[0], uv[1]); Pt.lay.push(t, body); Pt.n++; };
    const world = (Pt, n) => nW.copy(n).transformDirection(Pt.rest);      // (a part's normal as it stands at rest, in the place's own frame)
    const solid = (Pt, g, t, paint = null) => {
      const p = g.attributes.position, n = g.attributes.normal, c = g.attributes.color, v = V3(), nn = V3(), cc = new THREE.Color();
      for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); nn.fromBufferAttribute(n, i); if (paint) cc.copy(paint(world(Pt, nn), v, nn)); else cc.fromBufferAttribute(c, i); vert(Pt, v, nn, cc, UV_SOLID, t + 0.2, 1); }
    };
    // A ribbon of paint through six points lying on a form (Ps, with the form's normal at each, Ns), w wide, with the
    // brush's print on it (cell: 0 a loaded touch, 1 a dry one, 2 a round dab): close on the form where the brush set
    // down, its far end lifted a little and one long edge too, so the strokes overlap and the edge of a form is their
    // ragged ends, never the outline of the body under them.
    const ribbon = (Pt, Ps, Ns, w, c, t, { lift = 0.0018, tip = 0.003, ridge = 0.05, cell = -1, tilt = 0.3, flip = null } = {}) => {
      const k = cell < 0 ? (R() < 0.68 ? 0 : 1) : cell, fl = flip == null ? R() < 0.5 : flip, A = [], Bq = [], ua = [], ub = [];
      const ta = tilt * (0.5 + R()) * (R() < 0.5 ? -1 : 1), cw = Math.cos(ta) * w / 2, sw = Math.sin(ta) * w / 2;      // (tilted about its length: one long edge lifted)
      for (let i = 0; i < 6; i++) {
        d2.copy(Ps[Math.min(5, i + 1)]).sub(Ps[Math.max(0, i - 1)]); side.crossVectors(Ns[i], d2); if (side.lengthSq() < 1e-14) return; side.normalize();
        const s = fl ? 1 - i / 5 : i / 5;
        cl.copy(Ps[i]).addScaledVector(Ns[i], lift + tip * s * s);
        A.push(cl.clone().addScaledVector(side, -cw).addScaledVector(Ns[i], -sw)); Bq.push(cl.clone().addScaledVector(side, cw).addScaledVector(Ns[i], sw)); ua.push(UVQ(k, s, 0)); ub.push(UVQ(k, s, 1));
      }
      ca.copy(c).multiplyScalar(1 + ridge); cb.copy(c).multiplyScalar(1 - ridge * 0.7);
      for (let i = 0; i < 5; i++) { vert(Pt, A[i], Ns[i], cb, ua[i], t, 0); vert(Pt, Bq[i + 1], Ns[i + 1], ca, ub[i + 1], t, 0); vert(Pt, Bq[i], Ns[i], ca, ub[i], t, 0); vert(Pt, A[i], Ns[i], cb, ua[i], t, 0); vert(Pt, A[i + 1], Ns[i + 1], cb, ua[i + 1], t, 0); vert(Pt, Bq[i + 1], Ns[i + 1], ca, ub[i + 1], t, 0); }
    };
    // One stroke on something flat (or a touch too small to need bending): at p (normal n), along dir, l long and w wide.
    const stroke = (Pt, p, n, dir, l, w, c, t, { bend = 0, ...o } = {}) => {
      side.crossVectors(n, dir); if (side.lengthSq() < 1e-8) return; side.normalize(); const dd = V3().crossVectors(side, n).normalize(), sd = side.clone(), Ps = [], Ns = [];
      for (let i = 0; i < 6; i++) { const s = i / 5 - 0.5; Ps.push(p.clone().addScaledVector(dd, s * l).addScaledVector(sd, bend * l * (1 - 4 * s * s))); Ns.push(n); }
      ribbon(Pt, Ps, Ns, w, c, t, o);
    };
    const q_ = new THREE.Quaternion();
    const along = (n, flow, jit) => { const d = flow.clone().addScaledVector(n, -flow.dot(n)); if (d.lengthSq() < 1e-4) d.set(n.y, -n.x, 0); if (d.lengthSq() < 1e-6) d.set(1, 0, 0); return d.normalize().applyQuaternion(q_.setFromAxisAngle(n, (R() - 0.5) * jit)); };
    const DOWN = V3(0, -1, 0), ACROSS = V3(1, 0, 0);
    const yOf = (Pt, p) => wp.copy(p).applyMatrix4(Pt.rest).y;
    // when a stroke at height y (in the place) is laid, within a mass that starts at t0: the low ones first
    const when = (t0, span, y, top = 0.45) => t0 + span * (0.7 * clamp01(y / top) + 0.3 * R());
    const dk = new THREE.Color();
    // A rounded body (an ellipsoid: centre, radii, turned), painted smoothly.
    const ball = (Pt, Cn, Rd, paint, t0, { rot = [0, 0, 0], detail = 3, shrink = 0.94, dark = 0.8 } = {}) => solid(Pt, shape.move(shape.ball(1, 0xffffff, detail), Cn[0], Cn[1], Cn[2], rot[0], rot[1], rot[2], Rd[0] * shrink, Rd[1] * shrink, Rd[2] * shrink), t0, (nw, v, nn) => dk.copy(paint(nw, v, nn)).multiplyScalar(dark));
    // A coat of n strokes over an ellipsoid, each an arc on it; tn(normal in the place, luck, its own normal) its colour.
    const coat = (Pt, Cn, Rd, n, tn, t0, { rot = [0, 0, 0], l = [0.03, 0.05], w = [0.014, 0.022], flow = DOWN, jit = 0.6, keep = null, span = 0.2, grow = 1.0, top = 0.45, ...o } = {}) => {
      const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(rot[0], rot[1], rot[2], 'YXZ')), qi = q.clone().invert(), c = V3(...Cn), Rm = (Rd[0] + Rd[1] + Rd[2]) / 3;
      for (let i = 0; i < n; i++) {
        const yy = 1 - 2 * R(), ph = R() * TAU, s = Math.sqrt(Math.max(0, 1 - yy * yy)), u0 = V3(s * Math.cos(ph), yy, s * Math.sin(ph));
        const p = V3(u0.x * Rd[0] * grow, u0.y * Rd[1] * grow, u0.z * Rd[2] * grow).applyQuaternion(q).add(c), nn = V3(u0.x / Rd[0], u0.y / Rd[1], u0.z / Rd[2]).normalize().applyQuaternion(q);
        const r1 = R(), r2 = R(), r3 = R();
        if (keep && !keep(p, nn)) continue;
        const d = along(u0, flow.clone().applyQuaternion(qi), jit), len = lerp(l[0], l[1], r1), Ps = [], Ns = [];
        for (let k = 0; k < 6; k++) { const al = (k / 5 - 0.5) * len / Rm, u = u0.clone().multiplyScalar(Math.cos(al)).addScaledVector(d, Math.sin(al)); Ps.push(V3(u.x * Rd[0] * grow, u.y * Rd[1] * grow, u.z * Rd[2] * grow).applyQuaternion(q).add(c)); Ns.push(V3(u.x / Rd[0], u.y / Rd[1], u.z / Rd[2]).normalize().applyQuaternion(q)); }
        ribbon(Pt, Ps, Ns, lerp(w[0], w[1], r2), tn(world(Pt, nn).clone(), r3, nn), when(t0, span, yOf(Pt, p), top), o);
      }
    };
    // A limb along the part's own +y: prof = [[radius, y], ...] from its root, rounded off at both ends; strokes down it.
    const tube = (Pt, prof, S, t0, n, tn, { w = [0.012, 0.018], l = [0.03, 0.05], shrink = 0.86, dark = 0.84, ...o } = {}) => {
      const u0 = under(S), u = nn => dk.copy(u0(nn)).multiplyScalar(dark), ya = prof[0][1], yb = prof[prof.length - 1][1], rAt = y => { for (let i = 1; i < prof.length; i++) if (y <= prof[i][1]) return lerp(prof[i - 1][0], prof[i][0], (y - prof[i - 1][1]) / (prof[i][1] - prof[i - 1][1])); return prof[prof.length - 1][0]; };
      const fine = []; for (let i = 0; i <= 14; i++) { const y = lerp(ya, yb, i / 14); fine.push([rAt(y) * shrink, y]); }
      solid(Pt, shape.lathe(fine, 18, 0xffffff), t0, nn => u(nn));
      for (const [r, y] of [prof[0], prof[prof.length - 1]]) solid(Pt, shape.move(shape.ball(r * shrink, 0xffffff, 2), 0, y, 0), t0, nn => u(nn));
      for (let i = 0; i < n; i++) {
        const len = lerp(l[0], l[1], R()), yc = lerp(ya + len / 2, yb - len / 2, R()), ph = R() * TAU, nn = V3(Math.cos(ph), 0, Math.sin(ph)), Ps = [], Ns = [];
        for (let k = 0; k < 6; k++) { const y = yc + (k / 5 - 0.5) * len, r = rAt(y); Ps.push(V3(nn.x * r, y, nn.z * r)); Ns.push(nn); }
        ribbon(Pt, Ps, Ns, lerp(w[0], w[1], R()), tn(world(Pt, nn).clone(), R(), ph), t0 + 0.06 + 0.2 * R(), o);
      }
    };
    // A lofted form: rings from its foot up ({ y, c: [x, z], r1, r2 }), r1 along `ax` and r2 across it, fluted if asked;
    // smooth all over, painted paint(normal in the place, how far up, how far round, where, its own normal). Returns how
    // to find a point and its normal on it, and how to lay a stroke on it.
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
      const pos = [], idx = [], NN = rows + 1;
      for (let j = 0; j < NN; j++) for (let i = 0; i < seg; i++) { at(j / rows, i / seg * TAU, pa, shrink); pos.push(pa.x, pa.y, pa.z); }
      for (let j = 0; j < rows; j++) for (let i = 0; i < seg; i++) { const a = j * seg + i, b = j * seg + (i + 1) % seg, c = a + seg, d = b + seg; idx.push(a, c, b, b, c, d); }
      if (cap) { const top = rings[m], k = pos.length / 3; pos.push(top.c[0], top.y, top.c[1]); for (let i = 0; i < seg; i++) idx.push(rows * seg + i, k, rows * seg + (i + 1) % seg); }
      let g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
      { const n = g.attributes.normal; pa.fromBufferAttribute(g.attributes.position, 0); pb.set(rings[0].c[0], pa.y, rings[0].c[1]); if (pc.fromBufferAttribute(n, 0).dot(pa.sub(pb)) < 0) { g.setIndex(idx.map((_, i) => idx[i - i % 3 + [0, 2, 1][i % 3]])); g.computeVertexNormals(); } }
      { const n = g.attributes.normal, cols = new Float32Array(pos.length), k = pos.length / 3;
        for (let i = 0; i < k; i++) { pa.fromBufferAttribute(g.attributes.position, i); pb.fromBufferAttribute(n, i); const j = Math.min(rows, Math.floor(i / seg)), c = paint(world(Pt, pb), i < NN * seg ? j / rows : 1, (i % seg) / seg * TAU, pa, pb); cols[i * 3] = c.r * dark; cols[i * 3 + 1] = c.g * dark; cols[i * 3 + 2] = c.b * dark; }
        g.setAttribute('color', new THREE.BufferAttribute(cols, 3)); }
      g = g.toNonIndexed();
      solid(Pt, g, t0);
      // a stroke lying on it: from (v + dv / 2) down to (v - dv / 2), drifting dth round it
      const lay = (v, th, dv, dth, w, c, t, o) => { const Ps = [], Ns = []; for (let k = 0; k < 6; k++) { const s = k / 5 - 0.5; Ps.push(at(v - s * dv, th + s * dth)); Ns.push(normal(v - s * dv, th + s * dth)); } ribbon(Pt, Ps, Ns, w, c, t == null ? when(t0, 0.3, yOf(Pt, Ps[2])) : t, o); };
      return { at, normal, lay };
    };
    const eul = (m, x, y, z, yaw = 0, pitch = 0, roll = 0, sc = 1) => m.compose(V3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(pitch, yaw, roll, 'YXZ')), V3(sc, sc, sc));
    const M = this.M = { torso: new THREE.Matrix4(), head: new THREE.Matrix4(), boat: new THREE.Matrix4() };
    const FIG = this.FIG = eul(new THREE.Matrix4(), SIT[0], 0.004, SIT[1], FACE, 0, 0, SC);
    this.pose(0, 0, 0, 0);

    // ---------------------------------------------------------- the bank's own small things: grass standing at the
    // water's edge and round whatever sits on it, the flowers, and her hat
    const TG = T_BANK[0] + 0.25, bank = part();
    {
      const tuft = (u, o, t) => { const h = lerp(0.024, 0.046, R()), a = R() * TAU, n = V3(Math.sin(a) * 0.5, 0.25, Math.cos(a) * 0.5 + 0.7).normalize(); stroke(bank, V3(u, h * 0.42, o), n, V3((R() - 0.5) * 0.6, 1, (R() - 0.5) * 0.3).normalize(), h, lerp(0.016, 0.026, R()), pick(GRASS, R()), t, { cell: R() < 0.5 ? 0 : 1, lift: 0, tip: 0.004, tilt: 0.5, flip: false }); };
      for (let i = 0; i < 26; i++) { const u = lerp(-0.92, 0.78, R()); tuft(u, bankLine(u) + 0.01 + 0.07 * R() * R(), TG + 0.5 * R()); }                   // along the water
      for (let i = 0; i < 22; i++) { const a = R() * TAU, rr = 0.29 + 0.08 * R(), u = SIT[0] + 0.03 + Math.sin(a) * rr * 1.1, o = SIT[1] - 0.04 + Math.cos(a) * rr; if (o > bankLine(u) + 0.01) tuft(u, o, TG + 0.3 + 0.5 * R()); }      // round her skirt
      for (let i = 0; i < 12; i++) { const k = R(), u = lerp(0.36, 0.68, k) + (R() < 0.5 ? -1 : 1) * (0.1 + 0.05 * R()), o = lerp(1.5, 1.8, k) + 0.06 * (R() - 0.5); if (o > bankLine(u) + 0.01) tuft(u, o, TG + 0.4 + 0.4 * R()); }       // round the boat's bow
      for (let i = 0; i < 22; i++) {       // the flowers: yellow, a few white, a dab each
        const u = lerp(-0.9, 0.74, R()), o = lerp(bankLine(u) + 0.04, 1.93, R()); if (Math.hypot(u - SIT[0] - 0.03, (o - SIT[1]) * 1.1) < 0.36 || Math.hypot(u - HAT[0], o - HAT[1]) < 0.11) continue;
        const h = 0.012 + 0.03 * R(), s = lerp(0.016, 0.026, R());
        stroke(bank, V3(u, h, o), V3((R() - 0.5) * 0.5, 0.8, 0.5).normalize(), ACROSS, s, s * 0.95, pick(R() < 0.72 ? YEL : WHT, R()), TG + 0.5 + 0.5 * R(), { cell: 2, lift: 0, tip: 0, tilt: 0.2, ridge: 0.08 });
      }
      // her hat, off, on the grass beside her: pale straw, a blue ribbon round the crown and its end over the brim
      const hx = HAT[0], hz = HAT[1], TH = 2.42, uS = under(STW), c = new THREE.Color(), ts = mixer(STW, STH, 0.4, 0.12);
      const brim = shape.lathe([[0.098, 0.004], [0.082, 0.01], [0.05, 0.015], [0.004, 0.013]], 28, 0xffffff); shape.move(brim, hx, 0.012, hz, 0.12, 0.4, 0.06);
      solid(bank, brim, TH, nw => c.copy(uS(nw)).multiplyScalar(0.82));
      ball(bank, [hx - 0.004, 0.032, hz - 0.004], [0.05, 0.03, 0.05], nw => c.copy(uS(nw)), TH, { rot: [0.12, 0.4, 0.06], detail: 3, shrink: 0.96 });
      for (let i = 0; i < 26; i++) { const a = R() * TAU, rr = lerp(0.056, 0.086, R()), p = V3(hx + Math.cos(a) * rr, 0.027 - 0.006 * (rr - 0.05) / 0.04 + 0.012 * Math.cos(a - 0.4) * rr / 0.09, hz + Math.sin(a) * rr); stroke(bank, p, V3(0, 1, 0), V3(-Math.sin(a), 0, Math.cos(a)), lerp(0.04, 0.06, R()), lerp(0.02, 0.028, R()), ts(V3(0.1 * Math.cos(a), 1, 0.1 * Math.sin(a)).normalize(), R()), TH + 0.05 + 0.15 * R(), { tilt: 0.16, tip: 0.002, bend: 0.12 }); }
      coat(bank, [hx - 0.004, 0.032, hz - 0.004], [0.05, 0.03, 0.05], 26, ts, TH + 0.1, { l: [0.03, 0.045], w: [0.016, 0.024], keep: (p, n) => n.y > -0.1, flow: ACROSS, jit: 1.2, tip: 0.002, span: 0.1 });
      for (let i = 0; i < 9; i++) { const a = -2.4 + i * 0.6, p = V3(hx - 0.004 + Math.cos(a) * 0.05, 0.03, hz - 0.004 + Math.sin(a) * 0.05), n = V3(Math.cos(a), 0.25, Math.sin(a)).normalize(); stroke(bank, p, n, V3(-Math.sin(a), 0, Math.cos(a)), 0.034, 0.014, pick(BLUE_R, R()), TH + 0.22 + 0.01 * i, { cell: 0, lift: 0.003, tip: 0.001, tilt: 0.1, bend: -0.16 }); }
      stroke(bank, V3(hx + 0.058, 0.03, hz + 0.05), V3(0.1, 1, 0.1).normalize(), V3(0.75, 0, 0.66).normalize(), 0.075, 0.017, BLUE_R[0], TH + 0.32, { cell: 0, lift: 0.003, tip: 0.004, bend: 0.14, flip: false });
    }

    // ---------------------------------------------------------- the boat: lofted (bow at +x, keel's lowest point at the
    // origin), green outside and along the rail, pale boards and dark hollows inside, two thwarts, an oar shipped
    const TBT = 1.25, boat = part(M.boat);
    {
      const len = Math.hypot(BOAT.bow[0] - BOAT.stern[0], BOAT.bow[1] - BOAT.stern[1]), o = { len, ...BOAT };
      const bs = s => o.beam / 2 * (s >= 0 ? Math.pow(Math.max(0, 1 - Math.pow(s, 2.3)), 0.7) : Math.pow(Math.max(0, 1 - Math.pow(-s, 3.0)), 0.6));
      const yk = s => o.depth * (s >= 0 ? 0.8 * Math.pow(s, 3.4) : 0.55 * Math.pow(-s, 4)), ys = s => o.depth * (1 + 0.14 * s * s + 0.12 * Math.max(0, s) ** 2);
      const pt = (s, g, sd, inset = 0, out = V3()) => {
        const f = g * Math.PI / 2, k = yk(s), top = ys(s);
        let y = k + (top - k) * (1 - Math.pow(Math.cos(f), 1.4)), z = sd * bs(s) * Math.pow(Math.sin(f), 0.6);
        if (inset) { z *= 1 - inset; y = g > 0.99 ? top : Math.min(top, Math.max(y + 0.004, k + 0.26 * (top - k))); }
        return out.set(s * o.len / 2 + o.rake * s * Math.abs(s) * g * (s > 0 ? 1 : 0.5), y, z);
      };
      const NS = 24, NG = 7, uO = under(GN), uI = under(CRM), c = new THREE.Color(), DARKIN = col('#23221c', 0.1);
      const shell = inset => grid(NS, 2 * NG, (i, j, p) => { pt(-1 + 2 * i / NS, Math.abs(j - NG) / NG, j < NG ? -1 : 1, inset, p); }, V3(0, inset ? 1 : -1, 0));
      solid(boat, shell(0), TBT, nw => c.copy(uO(nw)).multiplyScalar(0.74));
      solid(boat, shell(0.11), TBT, (nw, v) => c.copy(uI(nw)).lerp(DARKIN, 0.55 * fall(v.y, 0.03, 0.07) + 0.2).multiplyScalar(0.8));
      for (const sd of [-1, 1]) solid(boat, grid(NS, 1, (i, j, p) => { pt(-1 + 2 * i / NS, 1, sd, j ? 0.11 : 0, p); if (!j) { p.z *= 1.03; p.z += sd * 0.002; } p.y += 0.003; }, V3(0, 1, 0)), TBT, nw => c.copy(GN.hi[0]).multiplyScalar(0.8));
      const nrm = (s, g, sd, inset, out) => { const a = pt(s + 0.02, g, sd, inset), b = pt(s - 0.02, g, sd, inset), cc = pt(s, Math.min(1, g + 0.03), sd, inset), d = pt(s, Math.max(0, g - 0.03), sd, inset); out.crossVectors(a.sub(b), cc.sub(d)).normalize(); const p = pt(s, g, sd, inset); if ((inset ? -1 : 1) * (out.x * 0 + out.y * (p.y - o.depth * 0.6) + out.z * p.z) < 0) out.negate(); return out; };
      const plank = (s0, ds, g, sd, inset, w, colr, t, op) => { const Ps = [], Ns = []; for (let k = 0; k < 6; k++) { const s = s0 + ds * k / 5; Ps.push(pt(s, g, sd, inset)); Ns.push(nrm(s, g, sd, inset, V3())); } ribbon(boat, Ps, Ns, w, colr, t, op); };
      const tg = mixer(GN, GNH, 0.45, 0.16), tcm = mixer(CRM, CRH, 0.4, 0.12), n = V3();
      for (const sd of [-1, 1]) for (const g of [0.34, 0.6, 0.86]) for (let s = -0.98; s < 0.9; s += 0.27) {      // the planking, outside: long green drags
        const s0 = s + 0.06 * (R() - 0.5), ds = Math.min(0.36, 0.97 - s0); nrm(s0 + ds / 2, g, sd, 0, n);
        plank(s0, ds, g + 0.04 * (R() - 0.5), sd, 0, lerp(0.034, 0.046, R()), tg(world(boat, n).clone(), R()), TBT + 0.08 + 0.3 * (s + 1) / 2 + 0.05 * R(), { tilt: 0.2, tip: 0.002, flip: false });
      }
      for (const sd of [-1, 1]) for (let s = -0.98; s < 0.9; s += 0.3) plank(s, Math.min(0.36, 0.98 - s), 1, sd, 0.05, 0.02, pick(GN.hi, R()).clone().multiplyScalar(1.06), TBT + 0.3 + 0.2 * (s + 1) / 2, { tilt: 0.1, lift: 0.004, tip: 0.001, cell: 0, flip: false });      // the rail, lighter
      for (const sd of [-1, 1]) for (const g of [0.12, 0.3]) for (let s = -0.86; s < 0.74; s += 0.3) {             // the bottom boards, pale
        nrm(s + 0.15, g, sd, 0.11, n); plank(s + 0.05 * (R() - 0.5), 0.34, g, sd, 0.11, lerp(0.03, 0.04, R()), tcm(V3(0, 1, 0), R()), TBT + 0.2 + 0.25 * (s + 1) / 2, { tilt: 0.14, tip: 0.001, flip: false });
      }
      for (const sd of [-1, 1]) for (let s = -0.9; s < 0.8; s += 0.3) {                                             // inside the sides: green in shadow, dark in the turn of the bilge
        plank(s, 0.34, 0.78, sd, 0.11, 0.03, pick(GN.lo, R()).clone().lerp(GN.mid[0], 0.3 * R()), TBT + 0.24 + 0.2 * (s + 1) / 2, { tilt: 0.14, tip: 0.001 });
        plank(s + 0.03, 0.3, 0.52, sd, 0.11, 0.022, DARKIN.clone().lerp(GN.deep[0], 0.3 + 0.3 * R()), TBT + 0.22 + 0.2 * (s + 1) / 2, { tilt: 0.14, tip: 0.001, cell: 1 });
      }
      for (const s of [-0.34, 0.26]) {     // two thwarts
        const hw = bs(s) * 0.86, y = ys(s) * 0.74, bx = shape.box(0.05, 0.008, hw * 2, 0xffffff); bx.translate(s * o.len / 2, y, 0); solid(boat, bx, TBT + 0.3, nw => c.copy(GN.mid[1]).multiplyScalar(0.72));
        stroke(boat, V3(s * o.len / 2, y + 0.004, 0), V3(0, 1, 0), V3(0, 0, 1), hw * 2.05, 0.05, pick(GN.hi, R()).clone().lerp(CRM.mid[0], 0.25), TBT + 0.42, { tilt: 0.06, lift: 0.001, tip: 0.001, cell: 0 });
      }
      { const a = V3(-0.3 * o.len, 0.05, 0.035), b = V3(0.3 * o.len, 0.085, -0.03), d = b.clone().sub(a), l = d.length(); d.normalize();      // an oar, shipped: a brown drag and its pale blade
        stroke(boat, a.clone().lerp(b, 0.5), V3(0, 1, 0), d, l, 0.014, col('#6a4a30', 0.1), TBT + 0.5, { tilt: 0.1, lift: 0.002, tip: 0.001, cell: 0, flip: false });
        stroke(boat, b.clone().addScaledVector(d, 0.045), V3(0, 1, 0), d, 0.1, 0.028, col('#b99a6a', 0.1), TBT + 0.58, { tilt: 0.1, lift: 0.002, tip: 0.001, cell: 0, flip: false }); }
      this.boatLen = len;
    }

    // ---------------------------------------------------------- her skirt: one grey mass spread on the grass, a few broad
    // folds, laid in broad flat touches of grey and lilac
    const TS = 1.3, skirt = part(FIG);
    {
      const ring = (y, s, r1, r2) => ({ y, c: [DIRK[0] * s, DIRK[1] * s], r1, r2 });
      const Fd = (v, th) => { const t = th + 0.25 * Math.sin(2.1 * v + 1); return 0.55 * Math.sin(t * 4 + 0.7) + 0.3 * Math.sin(t * 7 + 3.6) + 0.15 * Math.sin(t * 11 + 2.2); };
      const amp = v => (0.015 + 0.075 * Math.pow(1 - v, 1.2)) * fall(v, 0.8, 0.98), fl = (v, th) => 1 + amp(v) * Fd(v, th);
      const uS = under(GY), c = new THREE.Color(), HOLLOW = col('#5a5862', 0.1);
      const paint = (nw, v, th) => c.copy(uS(nw)).lerp(HOLLOW, 0.5 * fall(Fd(v, th), -0.7, 0.05) * sstep(amp(v), 0.01, 0.05)).multiplyScalar(0.76 + 0.24 * sstep(v, 0.01, 0.12));
      const S = loft(skirt, [ring(0, 0.125, 0.3, 0.226), ring(0.01, 0.125, 0.29, 0.216), ring(0.034, 0.115, 0.262, 0.19), ring(0.06, 0.098, 0.22, 0.158), ring(0.083, 0.066, 0.168, 0.122), ring(0.099, 0.03, 0.114, 0.092), ring(0.11, 0.006, 0.082, 0.068), ring(0.118, 0, 0.068, 0.056)], TS, paint, { ax: DIRK, flute: fl, seg: 64, rows: 16, shrink: 0.965, dark: 0.84 });
      const tn = mixer(GY, GYH, 0.95, 0.3), n = V3();
      for (let i = 0; i < 120; i++) {      // broad flat touches down and across the mass
        const dv = lerp(0.2, 0.36, R()), v = lerp(0.04 + dv / 2, 0.86 - dv / 2, Math.pow(R(), 1.1)), th = R() * TAU, f = Fd(v, th); S.normal(v, th, n);
        const c2 = tn(world(skirt, n).clone(), R()); if (f < -0.35) c2.lerp(HOLLOW, 0.3);
        S.lay(v, th, dv * (R() < 0.75 ? 1 : 0.12), (R() - 0.5) * 0.1 + (R() < 0.25 ? 0.5 : 0), lerp(0.05, 0.082, R()) * (1 - 0.3 * v), c2, when(TS + 0.05, 0.4, yOf(skirt, S.at(v, th)), 0.14), { ridge: 0.07, tilt: 0.24, tip: 0.004 });
      }
      for (let i = 0; i < 11; i++) {       // the folds: long dark drags from her waist out to the hem, and a pale one beside some
        const th = i / 11 * TAU + 0.3 * (R() - 0.5), v = lerp(0.36, 0.5, R());
        S.lay(v, th, 0.5 + 0.2 * R(), 0.12 * (R() - 0.5), lerp(0.02, 0.034, R()), pick(GY.lo, R()).clone().lerp(GY.deep[0], 0.6 * R()), TS + 0.42 + 0.1 * R(), { cell: R() < 0.5 ? 0 : 1, ridge: 0.03, tilt: 0.2, tip: 0.003, lift: 0.003 });
        if (R() < 0.6) S.lay(v + 0.04, th + 0.11, 0.4 + 0.2 * R(), 0.1 * (R() - 0.5), lerp(0.024, 0.036, R()), pick(GY.hi, R()).clone().multiplyScalar(1.04), TS + 0.5 + 0.1 * R(), { cell: 0, ridge: 0.05, tilt: 0.2, tip: 0.003, lift: 0.003 });
      }
      for (let i = 0; i < 34; i++) { const th = R() * TAU; S.normal(0.04, th, n); S.lay(0.035, th, 0.014, 0.2 + 0.16 * R(), 0.034, tn(world(skirt, n).clone(), R()).multiplyScalar(0.8), TS + 0.05 + 0.2 * R(), { cell: 1, tip: 0.001 }); }      // its hem, on the grass
    }

    // ---------------------------------------------------------- her body, from the waist: the loose striped jacket (its
    // hem over the skirt), her shoulders sloping into her neck (all one form), and its stripes laid one by one
    const TJ = 1.72, torso = part(M.torso), NST = 30;
    {
      const TR = [[-0.042, 0.097, 0.078, 0.012], [-0.022, 0.093, 0.073, 0.01], [0.012, 0.087, 0.066, 0.006], [0.05, 0.083, 0.061, 0.003], [0.082, 0.078, 0.056, 0.002], [0.104, 0.072, 0.05, 0.001], [0.122, 0.06, 0.043, 0], [0.137, 0.04, 0.034, 0.002], [0.149, 0.026, 0.025, 0.004], [0.158, 0.0195, 0.0195, 0.004], [0.172, 0.0185, 0.0185, 0.004]];
      const uJ = under(JK), uF = under(FL), c = new THREE.Color(), c2 = new THREE.Color();
      const paint = (nw, v, th, p) => c.copy(uJ(nw)).lerp(c2.copy(uF(nw)), sstep(p.y, 0.146, 0.152));
      const S = loft(torso, TR.map(([y, r1, r2, z]) => ({ y, c: [0, z], r1, r2 })), TJ - 0.12, paint, { seg: 40, rows: 26, shrink: 0.93, dark: 0.82 });
      // the stripes: each a broad band or a narrow line from the shoulder down to the hem, in three overlapping lengths
      // that do not quite agree, closer together at the waist as the cloth is; never two alike side by side
      const kinds = []; let last = '';
      for (let i = 0; i < NST; i++) { let k; do { const r = R(); k = r < 0.4 ? 'w' : r < 0.6 ? 'p' : r < 0.77 ? 'b' : r < 0.88 ? 'g' : 'd'; } while (k === last || (k === 'd' && last !== 'w' && i % 2)); kinds.push(k); last = k; }
      const lit = new THREE.Color(), n = V3();
      for (let i = 0; i < NST; i++) {
        // (laid from her right shoulder across her back to her left, then round the front)
        const th0 = Math.PI - (i + 0.5) / NST * TAU + (R() - 0.5) * 0.05, k = kinds[i], w0 = k === 'w' ? lerp(0.017, 0.023, R()) : k === 'd' ? lerp(0.005, 0.0075, R()) : lerp(0.011, 0.016, R());
        const t = TJ + 0.55 * (i / NST);
        for (const [v, dv] of [[0.6, 0.27], [0.38, 0.27], [0.15, 0.27]]) {
          S.normal(v, th0, n); const tone = 0.8 + 0.2 * sstep(world(torso, n).dot(KEY), -0.5, 0.5);
          lit.copy(pick(STRIPE[k], R())).multiplyScalar(tone * (1 + (R() - 0.5) * 0.08));
          S.lay(v + (R() - 0.5) * 0.03, th0 + (R() - 0.5) * 0.03, dv, (R() - 0.5) * 0.05, w0 * (0.86 + 0.28 * R()) * (0.8 + 0.3 * sstep(v, 0.1, 0.5)), lit.clone(), t + 0.07 * (0.6 - v) / 0.45 + 0.02 * R(), { ridge: k === 'w' ? 0.05 : 0.03, tilt: 0.22, tip: 0.0025, lift: k === 'd' ? 0.0032 : 0.002, cell: k === 'd' ? 1 : R() < 0.7 ? 0 : 1, flip: false });
        }
      }
      for (let i = 0; i < 16; i++) { const th = R() * TAU, v = 0.685 + 0.04 * R(); S.normal(v, th, n); S.lay(v, th, 0.02, 0.5 + 0.3 * R(), lerp(0.012, 0.017, R()), pick(STRIPE[R() < 0.6 ? 'w' : 'p'], R()).clone().multiplyScalar(0.82 + 0.18 * sstep(world(torso, n).dot(KEY), -0.5, 0.5)), TJ + 0.5 + 0.1 * R(), { tip: 0.002 }); }      // over the top of her shoulders
      for (let i = 0; i < 9; i++) { const th = i / 9 * TAU + 0.2; S.lay(0.795, th, 0.004, 0.8, 0.0085, pick(STRIPE.w, R()), TJ + 0.62 + 0.01 * i, { cell: 0, lift: 0.003, tip: 0.001, tilt: 0.1 }); }      // a white collar
      const tf = mixer(FL, FLH, 0.3, 0.07);
      for (let i = 0; i < 26; i++) { const v = 0.84 + 0.15 * R(), th = R() * TAU; S.normal(v, th, n); S.lay(v, th, 0.05 * (R() - 0.5), 0.4 + 0.3 * R(), lerp(0.011, 0.016, R()), tf(world(torso, n).clone(), R()), TJ + 0.66 + 0.06 * R(), { cell: R() < 0.6 ? 2 : 0, tip: 0.001, ridge: 0.03, tilt: 0.2 }); }      // her neck
      for (let i = 0; i < 18; i++) { const th = R() * TAU; S.normal(0.03, th, n); S.lay(0.035, th, 0.012, 0.3 + 0.2 * R(), 0.016, pick(STRIPE[pick(['w', 'p', 'g', 'b'], R())], R()).clone().multiplyScalar(0.84), TJ + 0.5 + 0.1 * R(), { cell: 1, tip: 0.003 }); }      // the hem, loose over the skirt
    }

    // ---------------------------------------------------------- her arms: striped sleeves, her hands together in her lap
    const TA = 2.2, stripeTn = (nw, r, ph) => { const ks = ['w', 'p', 'w', 'b', 'w', 'g', 'p', 'w', 'b', 'g'], k = ks[Math.floor(((ph / TAU + 1) % 1) * ks.length) % ks.length]; return pick(STRIPE[k], r).clone().multiplyScalar(0.8 + 0.2 * sstep(nw.dot(KEY), -0.5, 0.5)); };
    const bone = (S, dir) => new THREE.Matrix4().compose(V3(...S), new THREE.Quaternion().setFromUnitVectors(V3(0, 1, 0), dir.clone().normalize()), V3(1, 1, 1));
    const AR = this.AR = {};
    const arm = (key, S, d1, d2) => {
      const el = V3(...S).addScaledVector(d1.clone().normalize(), L1);
      AR[key + 'u'] = bone(S, d1); AR[key + 'f'] = bone([el.x, el.y, el.z], d2);
      const up = part(new THREE.Matrix4().multiplyMatrices(M.torso, AR[key + 'u'])), fo = part(new THREE.Matrix4().multiplyMatrices(M.torso, AR[key + 'f']));
      tube(up, [[0.016, 0.004], [0.024, 0.034], [0.0255, 0.075], [0.024, 0.11], [0.0225, L1]], JK, TA, 30, stripeTn, { l: [0.07, 0.11], w: [0.013, 0.02], tilt: 0.22, tip: 0.002, flip: false });
      tube(fo, [[0.0225, 0], [0.0235, 0.03], [0.0215, 0.07], [0.0185, 0.105], [0.0165, 0.116]], JK, TA + 0.08, 30, stripeTn, { l: [0.06, 0.1], w: [0.012, 0.018], tilt: 0.22, tip: 0.002, flip: false });
      const uF = under(FL), c = new THREE.Color(), tf = mixer(FL, FLH, 0.3, 0.07);
      ball(fo, [0, L2 - 0.004, 0.001], [0.0135, 0.021, 0.0105], nw => c.copy(uF(nw)), TA + 0.2, { detail: 3, dark: 0.95 });      // her hand
      coat(fo, [0, L2 - 0.004, 0.001], [0.0135, 0.021, 0.0105], 20, tf, TA + 0.22, { l: [0.012, 0.02], w: [0.008, 0.012], cell: 2, tip: 0.0008, ridge: 0.03, tilt: 0.16, span: 0.06 });
      return [up, fo];
    };
    const [ru, rf] = arm('r', SH_R, V3(-0.26, -0.86, 0.44), V3(0.44, -0.26, 0.86)), [lu, lf] = arm('l', SH_L, V3(0.27, -0.86, 0.43), V3(-0.42, -0.28, 0.86));

    // ---------------------------------------------------------- her head: no drawn feature (the shade her eyes lie in, a
    // cheek, the far side lost); her hair dark, drawn back and up into a knot
    const TH_ = 2.36, head = part(M.head);
    { const NK = { hi: FL.mid, mid: FL.mid, lo: FL.lo, deep: FL.deep }; tube(head, [[0.0195, -0.018], [0.0185, 0.0], [0.0175, 0.024]], NK, TH_, 14, mixer(NK, FLH, 0.25, 0.06), { l: [0.02, 0.03], w: [0.01, 0.014], cell: 2, tip: 0.001, tilt: 0.2, ridge: 0.03, dark: 0.95 }); }
    {
      const uF = under(FL), uH = under(HR), c = new THREE.Color(), c3 = new THREE.Color();
      const SKc = [0, 0.058, 0.004], SKr = [0.0335, 0.041, 0.036], HRc = [0, 0.073, -0.011], HRr = [0.0385, 0.037, 0.041], KNc = [0, 0.092, -0.036], KNr = [0.025, 0.022, 0.025];
      const hairy = n => n.y > 0.68 - 0.25 * n.z || n.z < -0.02 || (Math.abs(n.x) > 0.8 && n.y > -0.3 && n.z < 0.4);
      const gz = (n, x, y, z, rx, ry = rx) => { const k = 1 / Math.hypot(x, y, z), dx = (n.x - x * k) / rx, dy = (n.y - y * k) / ry, dz = (n.z - z * k) / rx; return Math.exp(-(dx * dx + dy * dy + dz * dz)); };
      // her face is turned from the light: a flat warm tone, the shade her eyes lie in, a cheek, the far side lost
      const face = (nw, v, nn) => {
        if (hairy(nn) && nn.z < 0.3) return c.copy(uH(nw));
        c.copy(FL.mid[0]).lerp(FL.hi[0], 0.6 * sstep(nw.dot(KEY), -0.3, 0.5)).lerp(LOST, 0.5 * sstep(nn.x, 0.05, 0.85));      // (her left side, the far one, lost)
        c.lerp(SOCK, 0.6 * gz(nn, 0, 0.14, 0.95, 0.6, 0.12));                                           // the shade under her brow, right across
        for (const sx of [-1, 1]) c.lerp(SOCK, 0.8 * gz(nn, sx * 0.4, 0.08, 0.9, 0.26, 0.18)).lerp(EYE, 0.4 * gz(nn, sx * 0.4, 0.07, 0.9, 0.24, 0.09)).lerp(CHEEK, 0.5 * gz(nn, sx * 0.56, -0.3, 0.8, 0.22));
        c.lerp(CHEEK, 0.35 * gz(nn, 0, 0.42, 0.9, 0.3, 0.14));                                          // her forehead, under the hair
        c.lerp(SOCK, 0.45 * gz(nn, 0.2, -0.1, 0.96, 0.1)).lerp(SOCK, 0.4 * gz(nn, 0.02, -0.36, 0.93, 0.11, 0.055));    // beside her nose, and under it
        c.lerp(ROSE, 0.6 * gz(nn, 0, -0.54, 0.84, 0.16, 0.06)).lerp(SOCK, 0.4 * gz(nn, 0, -0.7, 0.72, 0.14, 0.07));     // her mouth, barely; the shade under her lip
        return c.lerp(c3.copy(uH(nw)), sstep(nn.y - (0.68 - 0.25 * nn.z), -0.07, 0.05));
      };
      ball(head, SKc, SKr, face, TH_ + 0.02, { detail: 6, shrink: 0.95, dark: 0.95 });
      ball(head, [0, 0.0478, 0.0352], [0.0038, 0.0078, 0.0046], nw => c.copy(FL.mid[0]), TH_ + 0.06, { detail: 2, shrink: 1, dark: 0.94 });      // her nose
      const visage = (nw, r, nn) => face(nw, null, nn).clone().multiplyScalar(1 + (r - 0.5) * 0.05);
      coat(head, SKc, SKr, 190, visage, TH_ + 0.1, { l: [0.011, 0.018], w: [0.01, 0.014], keep: (p, n) => !hairy(n) && n.z > -0.15 && n.y - (0.68 - 0.25 * n.z) < 0.02, flow: V3(0.2, -1, 0), jit: 1.4, cell: 2, tip: 0.0008, lift: 0.0012, ridge: 0.02, tilt: 0.14, span: 0.1 });
      // and over that its planes, a flat touch each (none of them a feature drawn): the shade across her eyes, her
      // cheeks, the light down her nose and the dark under it, her mouth, her chin
      const onSkull = (x, y, z) => { const k = 1 / Math.hypot(x, y, z), u = V3(x * k, y * k, z * k); return [V3(SKc[0] + u.x * SKr[0], SKc[1] + u.y * SKr[1], SKc[2] + u.z * SKr[2]), V3(u.x / SKr[0], u.y / SKr[1], u.z / SKr[2]).normalize()]; };
      const plane = (x, y, z, dir, l, w, colr, dt, o = {}) => { const [p, n] = onSkull(x, y, z), lit = 0.9 + 0.16 * sstep(world(head, n).dot(KEY), -0.6, 0.3); stroke(head, p, n, dir, l, w, colr.clone().multiplyScalar(lit), TH_ + 0.22 + dt, { cell: 2, lift: 0.0018, tip: 0.0005, ridge: 0.02, tilt: 0.08, flip: false, ...o }); };
      for (const sx of [-1, 1]) {
        plane(sx * 0.2, 0.4, 0.9, ACROSS, 0.02, 0.012, FL.hi[0], 0);
        plane(sx * 0.6, -0.3, 0.75, V3(sx * 0.3, -1, 0), 0.019, 0.0135, CHEEK, 0.05);
      }
      { const Ps = [], Ns = []; for (let k = 0; k < 6; k++) { const [p, n] = onSkull(lerp(-0.54, 0.54, k / 5), 0.09, 0.9); Ps.push(p); Ns.push(n); } ribbon(head, Ps, Ns, 0.0115, SOCK.clone().lerp(FL.lo[0], 0.35), TH_ + 0.25, { cell: 1, lift: 0.0018, tip: 0.0004, ridge: 0.02, tilt: 0.06, flip: false }); }
      stroke(head, V3(0, 0.0492, 0.0402), V3(0, 0.15, 1).normalize(), DOWN, 0.015, 0.0058, FL.hi[1], TH_ + 0.3, { cell: 0, lift: 0.0006, tip: 0.0004, ridge: 0.02, tilt: 0.06, flip: false });
      plane(0, -0.55, 0.84, ACROSS, 0.011, 0.0046, ROSE.clone().lerp(FL.mid[0], 0.25), 0.12, { cell: 0 });
      plane(0, -0.86, 0.52, ACROSS, 0.013, 0.008, CHEEK, 0.14);
      // her hair: a dark mass close to her head, and the knot behind and above; a few warmer touches where the light is
      ball(head, HRc, HRr, nw => c.copy(uH(nw)), TH_ + 0.04, { detail: 3 });
      ball(head, KNc, KNr, nw => c.copy(uH(nw)), TH_ + 0.1, { detail: 3 });
      const th = mixer(HR, HRH, 0.5, 0.3), HK = (p, n) => p.z < 0.0 || p.y > 0.103;
      coat(head, HRc, HRr, 84, th, TH_ + 0.08, { l: [0.024, 0.038], w: [0.014, 0.021], grow: 1.02, keep: HK, flow: V3(0.1, 0.5, -1), jit: 0.9, tip: 0.003, span: 0.1 });
      coat(head, KNc, KNr, 30, th, TH_ + 0.16, { l: [0.02, 0.03], w: [0.012, 0.017], flow: ACROSS, jit: 1.6, tip: 0.004, span: 0.08 });
      coat(head, HRc, HRr, 18, (n, r) => pick(HAIR_LIT, r).clone(), TH_ + 0.22, { l: [0.016, 0.026], w: [0.006, 0.009], grow: 1.04, keep: (p, n) => HK(p, n) && world(head, n).dot(KEY) > 0.4, flow: V3(0.2, 0.5, -0.8), jit: 0.8, cell: 1, tip: 0.003, span: 0.06 });
    }

    // ---------------------------------------------------------- the rig: everything on the near bank, one draw call
    const parts = { bank, boat, skirt, torso, head, ru, rf, lu, lf };
    let total = 0; for (const p of Object.values(parts)) total += p.n;
    const ru_ = this.ru = { uT: { value: 0 } };
    const rm = new THREE.MeshStandardMaterial({ vertexColors: true, color: 0xa4a4a4, map: brushPrint(), alphaTest: 0.4, roughness: 0.92, metalness: 0, emissive: 0xffffff, emissiveIntensity: 0.44, side: THREE.DoubleSide });
    rm.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, ru_);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec2 aLay; varying vec2 vLay;').replace('#include <begin_vertex>', '#include <begin_vertex>\n  vLay = aLay;');
      // (a stroke is drawn in from the end where the brush was set down; a body is scumbled in under the strokes; the
      // paint glows a little in its own colour, bristle by bristle)
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uT; varying vec2 vLay;')
        .replace('#include <map_fragment>', `#include <map_fragment>
  {
    float lk = (uT - vLay.x) / (vLay.y > 0.5 ? ${BODY_D.toFixed(2)} : ${LAY_D.toFixed(2)});
    if (lk <= 0.0) discard;
    if (lk < 1.0) {
      if (vLay.y > 0.5) { vec2 bq = mod(floor(gl_FragCoord.xy), 4.0); float bt = (mod(bq.x + bq.y * 2.0, 4.0) * 4.0 + mod(bq.x * 3.0 + bq.y, 4.0) + 0.5) / 16.0; if (lk < bt) discard; }
      else { float ls = (fract(vMapUv.x * 2.0) - 0.05) / 0.9; if (ls > lk * 1.2 - 0.2 * sampledDiffuseColor.r) discard; }
    }
  }`)
        .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n  totalEmissiveRadiance *= vColor.rgb;\n#ifdef USE_MAP\n  totalEmissiveRadiance *= sampledDiffuseColor.rgb;\n#endif');
    };
    rm.customProgramCacheKey = () => 'bennecourt-bank';
    const rig = this.rig = L.rig(10, total + 64, rm);
    this.I = {}; this.rest = {};
    for (const [name, p] of Object.entries(parts)) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(p.pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(p.nor, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(p.col, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(p.uv, 2)); g.setAttribute('aLay', new THREE.Float32BufferAttribute(p.lay, 2));
      this.I[name] = rig.add(rig.geo(g)); this.rest[name] = p.rest.clone(); rig.mat(this.I[name], this.V.m.multiplyMatrices(this.B, p.rest));
      p.pos = p.nor = p.col = p.uv = p.lay = null;
    }

    this.lap = L.voice().loop({ lp: 700, hp: 160 });
    this.reset(L);
  },

  // ---------------------------------------------------------------- her pose, and the boat's: into this.M (the place's own frame)
  // yaw, pitch: her head on her neck (yaw to her left; pitch forward); breath; the boat's roll
  pose(yaw, pitch, breath, roll) {
    const V = this.V, M = this.M;
    const eul = (m, x, y, z, yw, pt, rl) => m.compose(V.pos.set(x, y, z), V.q.setFromEuler(V.e.set(pt, yw, rl, 'YXZ')), V.one);
    eul(V.l, WAIST[0], WAIST[1], WAIST[2], 0.06, 0.15 + 0.012 * breath, -0.03); M.torso.multiplyMatrices(this.FIG, V.l);
    eul(V.l, NECK[0], NECK[1], NECK[2], yaw, pitch, 0.03); M.head.multiplyMatrices(M.torso, V.l);
    // the boat: its keel along stern to bow, afloat at the stern, its bow up on the grass
    const s = BOAT.stern, b = BOAT.bow, mx = (s[0] + b[0]) / 2, mz = (s[1] + b[1]) / 2, yw = Math.atan2(-(b[1] - s[1]), b[0] - s[0]);
    eul(M.boat, mx, -0.014, mz, yw, roll, 0.03);
  },

  // She and the boat are soft to the toy: it is eased out round them (never stopped dead, never through her).
  soften(L, dt) {
    const G = L.k.G, v = G.vehicle;
    if (L.quiet || dt <= 0 || G.state !== 'play' || !v || !v.group.visible || Math.abs(v.pos.y - L.y) > 0.45) return;
    const O = this.O;
    for (const [x, z, r] of SOFT) {
      const dx = v.pos.x - (O.x + L.tx * x + L.nx * z), dz = v.pos.z - (O.z + L.tz * x + L.nz * z), d = Math.hypot(dx, dz), reach = r + (v.radius || 0.19);
      if (d >= reach || d < 1e-4) continue;
      const nx = dx / d, nz = dz / d, k = Math.min(1, dt * 10), into = v.vel.x * nx + v.vel.z * nz;
      v.pos.x += nx * (reach - d) * k; v.pos.z += nz * (reach - d) * k;
      if (into < 0) { v.vel.x -= nx * into * k; v.vel.z -= nz * into * k; }
    }
  },

  hide() { if (!this.rig) return; this.rig.mesh.visible = false; this.flats.visible = false; this.gmat.visible = false; if (this.lap) this.lap.set(0); },
  clear() { this.c = 0; this.tw = 0; this.cue = 0; this.gy = 0.05; this.gp = 0.2; this.cBack = 0; this.roll = 0; this.rollV = 0; this.knocked = false; this.told = false; this.toyK = 0; },
  start(L, resumed) { if (!resumed) this.clear(); },
  back(L) { this.cBack = this.c; },
  end() { this.hide(); },
  reset() { this.hide(); this.clear(); },

  // the sounds, by the show's own clock: the river laid, the bank, and each sheet's wet rush and its note as it stands
  sound(L, c0, c1, calm) {
    if (L.quiet) return; const v = L.voice(); if (!v.ctx) return;
    const at = t => c0 < t && c1 >= t, soft = calm ? 0.09 : 0.012;
    if (at(0.05)) noise(v, 0, { d: 1.7, vol: 0.012, lp: 1500, hp: 260, attack: 0.5 });
    if (at(T_BANK[0])) noise(v, 0, { d: 1.2, vol: 0.007, lp: 2400, hp: 500, attack: 0.4 });
    PIECES.forEach((p, i) => {
      if (at(p.t0)) noise(v, 0, { d: p.d * 1.1, vol: i ? 0.014 : 0.02, bp: i ? 1500 : 900, q: 0.6, attack: p.d * 0.5 });
      if (at(p.t0 + p.d * 0.92)) {
        v.note(p.hz, i ? 1.5 : 2.2, { vol: i ? 0.026 : 0.03, type: 'sine', attack: soft }); v.note(p.hz * 2, 0.9, { vol: 0.007, type: 'triangle', attack: soft });
        if (!i) v.note(p.hz * 1.5, 2.0, { vol: 0.016, type: 'sine', attack: soft });
        if (!calm) for (let j = 0; j < 3; j++) v.note(1700 + 500 * j + 300 * i, 0.07, { at: 0.12 + 0.11 * j + 0.05 * i, vol: 0.005, type: 'sine', to: 900 });      // drips
      }
    });
  },

  update(L, dt) {
    const ph = L.phase, showing = ph === 'wake' || ph === 'play', linger = ph === 'linger', back = ph === 'return';
    if (!showing && !linger && !back) { this.hide(); return; }
    const calm = L.calm, G = L.k.G, gu = this.gu, V = this.V, slow = calm ? 0.7 : 1, Rr = L.ret;
    const c0 = this.c;
    if (!back) this.c += dt * slow;
    this.tw += dt * (calm ? 0.6 : 1);
    const c = this.c, tw = this.tw;
    if (showing) this.sound(L, c0, c, calm);

    // ---- the river is laid; the bank; she is painted (and all of it unpainted again, going back)
    const un = back ? 1 - ease.inOut(ramp(Rr, 0.22, 0.62)) : 1;                      // the near bank's paint (all gone before the river draws back past it)
    const front = back ? lerp(1.95, -0.2, ease.inOut(ramp(Rr, 0.5, 1.0))) : lerp(-0.1, 1.95, ramp(c, 0, T_WATER));
    gu.uFront.value = front; gu.uT.value = tw;
    gu.uBankK.value = back ? un : ease.smooth(ramp(c, T_BANK[0], T_BANK[1]));
    this.ru.uT.value = back ? Math.min(this.cBack, T_BUILT + 0.2) * un : c;

    // ---- the far bank: each sheet up out of its image, back to front; and down again, front to back
    const ang = this.fu.uAng.value, pcs = gu.uPc.value;
    let lastUp = 0, gazeU = 0.0, gazeP = 0.2;
    for (let i = 0; i < NP; i++) {
      const p = PIECES[i], k = ramp(c, p.t0, p.t0 + p.d), after = c - (p.t0 + p.d);
      // (slow to leave the water, quicker as it clears, gathered in at the top; then it rocks once and is still)
      let th = Math.PI / 2 * (k < 1 ? ease.inOut(Math.pow(k, 1.25)) : 1);
      if (after > 0 && !calm) th += 0.075 * Math.exp(-4.5 * after) * Math.sin(11 * after);
      let down = 0;
      if (back) { const j = NP - 1 - i; down = ease.inOut(ramp(Rr, 0.04 + 0.07 * j, 0.42 + 0.07 * j)); th *= 1 - down; }
      ang[i] = th;
      // what it does to the water: a shiver over its image before it lifts and while it does; then, as it stands, a
      // ripple going out from its shore
      const u0 = -HALF + 2 * HALF * p.s0, u1 = -HALF + 2 * HALF * p.s1, pre = ramp(c, p.t0 - 0.45, p.t0);
      let oL = p.o + p.h * STR * 0.5, a = 0;
      if (back) { a = 0.02 * Math.sin(Math.PI * down); oL = p.o + p.h * STR * 0.5; }
      else if (k < 1) { a = 0.022 * pre * (1 - 0.6 * k); oL = p.o + p.h * STR * (0.55 - 0.3 * k); }
      else { oL = p.o + 0.1 + RIP_V * after; a = 0.03 * Math.exp(-after * 1.5) * fall(oL, 1.0, 1.45); }
      pcs[i].set(u0, u1, oL, a * (calm ? 0.5 : 1));
      if (k > 0) lastUp = i;
      // she looks at each as it comes: down at its image first, and up with it
      const mid = (u0 + u1) / 2 * 0.8, see = ease.inOut(ramp(c, p.t0 - 0.5, p.t0 + 0.1));
      gazeU = lerp(gazeU, i === NP - 1 ? 0.62 : mid, see); gazeP = lerp(gazeP, lerp(0.2, -0.05, ease.inOut(k)), see);
    }
    this.flats.visible = ang.some(a => a > 0.002);

    // ---- the long ripple, once it all stands; and one now and then after that
    let ripO = 0, ripA = 0;
    { const since = c - (T_ALL + 0.25), every = 6.5, n = since < 0 ? -1 : Math.floor(since / every), t = since - n * every;
      if (n >= 0 && !back) { ripO = 0.15 + RIP_V * t; ripA = (n === 0 ? 0.05 : 0.022) * fall(ripO, 1.25, 1.6) * sstep(t, 0, 0.25); }
      // the boat feels it arrive
      const arrive = (bankLine(0.3) - 0.35 - 0.15) / RIP_V, kick = n >= 0 && t > arrive && t < arrive + 0.12 && !back;
      if (kick && !this.knocked) { this.knocked = true; this.rollV += (n === 0 ? 0.9 : 0.4) * (calm ? 0.4 : 1); if (n === 0 && !L.quiet) { const v = L.voice(); if (v.ctx) { noise(v, 0.25, { d: 0.09, vol: calm ? 0.008 : 0.016, lp: 380, attack: calm ? 0.05 : 0.004 }); v.note(104, 0.2, { at: 0.25, vol: calm ? 0.01 : 0.02, type: 'sine', to: 78, attack: calm ? 0.05 : 0.005 }); } } }
      if (!kick && t > arrive + 0.5) this.knocked = false;
    }
    gu.uRip.value.set((calm ? 0.0035 : 0.006) * (back ? un : 1), ripO, ripA * (calm ? 0.5 : 1), 0);

    // ---- the toy in the river: the image goes to pieces round it
    const veh = G.vehicle, toy = !L.quiet && G.state === 'play' && veh && veh.group.visible && Math.abs(veh.pos.y - L.y) < 0.4 ? veh : null;
    let tk = 0;
    if (toy) { const q = L.local(toy.pos.x, toy.pos.z); if (q.out < bankLine(q.u) && q.out > 0 && Math.abs(q.u) < 1) { tk = Math.min(1, 0.25 + Math.hypot(toy.vel.x, toy.vel.z) * 0.6); gu.uToy.value.x = q.u; gu.uToy.value.y = q.out; } }
    this.toyK += (tk - this.toyK) * Math.min(1, dt * 3); gu.uToy.value.z = 0.045 * this.toyK * (calm ? 0.5 : 1);

    // ---- her head follows what is coming up; her breath; the boat rides (a pendulum, set going by the ripples)
    const settle = ease.inOut(ramp(c, T_ALL + 0.2, T_ALL + 1.3));      // (and then the picture's pose: her head to the right)
    const wantU = lerp(gazeU, 0.62, settle), wantP = lerp(gazeP, -0.04, settle);
    const dxu = wantU - SIT[0], dzo = SIT[1] - 0.14, yawWant = -(Math.atan2(dxu, dzo) - Math.atan2(Math.sin(FACE), -Math.cos(FACE))) - 0.06 - 0.22 * settle;
    const kf = 1 - Math.exp(-dt * (calm ? 2.2 : 3.4)); this.gy += (Math.max(-0.75, Math.min(0.4, yawWant)) - this.gy) * kf; this.gp += (wantP - this.gp) * kf;
    if (dt > 0) { const n = Math.min(4, Math.ceil(dt / 0.012)), h = dt / n; for (let i = 0; i < n; i++) { this.rollV += (-34 * this.roll - 1.5 * this.rollV) * h; this.roll += this.rollV * h; } }
    const idle = 0.012 * Math.sin(tw * 1.9) + 0.008 * Math.sin(tw * 2.9 + 1);
    this.pose(this.gy, this.gp, Math.sin(tw * 1.75), Math.max(-0.16, Math.min(0.16, this.roll)) + idle);

    // ---- into the rig
    const rig = this.rig, I = this.I, B = this.B, M = this.M;
    const shown = this.ru.uT.value > T_BANK[0];
    rig.mesh.visible = shown; this.gmat.visible = front > -0.05;
    rig.mat(I.torso, V.m.multiplyMatrices(B, M.torso)); rig.mat(I.head, V.m.multiplyMatrices(B, M.head)); rig.mat(I.boat, V.m.multiplyMatrices(B, M.boat));
    for (const k of ['ru', 'rf', 'lu', 'lf']) rig.mat(I[k], V.m.multiplyMatrices(B, V.l.multiplyMatrices(M.torso, this.AR[k[0] + k[1]])));

    // ---- shadows on the grass and the water
    const S = gu.uSh.value, t = this.ru.uT.value, kb = ease.smooth(ramp(t, 1.2, 1.8)), ks = ease.smooth(ramp(t, 1.35, 2.2)), kh = ease.smooth(ramp(t, 2.45, 2.7));
    S[0].set(SIT[0] + 0.02, SIT[1] - 0.03, 0.27, 0.62 * ks); S[1].set(SIT[0] + 0.06, SIT[1] - 0.02, 0.42, 0.34 * ks);
    S[2].set(HAT[0], HAT[1] + 0.01, 0.11, 0.5 * kh);
    for (let i = 0; i < 3; i++) { const f = 0.2 + 0.3 * i; S[3 + i].set(lerp(BOAT.stern[0], BOAT.bow[0], f), lerp(BOAT.stern[1], BOAT.bow[1], f) - 0.02, 0.17, 0.5 * kb); }

    if (t > 1.6 && !back) this.soften(L, dt);
    // ---- the river's sound
    const near = Math.max(0, 1 - Math.hypot(G.camera.position.x - L.cx, G.camera.position.z - L.cz) / 12);
    this.lap.set(L.quiet ? 0 : near * (back ? 1 - ramp(Rr, 0.6, 1) : ease.smooth(ramp(c, 0, 1))) * (0.008 + 0.005 * Math.sin(tw * 1.3) ** 2 + 0.01 * this.toyK), 0.3);
    L.voice().level = calm ? 0.8 : 1; L.voice().place();
    if (showing && !this.told && !L.quiet && c > T_ALL + 0.3) { this.told = true; L.k.say('A woman sits on the bank and looks across the river. The village over there stands up out of its own reflection: now it is there twice, as he painted it.', 6); }
    if (back && Rr >= 1) this.hide();
  },
});
