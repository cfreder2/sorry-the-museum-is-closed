// Charles François Daubigny, House of Mère Bazot (1874), Gallery 222. The word: dusk.
//
// The museum gives this picture a title, a date and a country, and nothing else: no note on the place, and not a
// word about Mère Bazot. So everything here is from looking. Half the canvas is an evening sky, scumbled grey and
// lilac, with one pale yellow break high on the left and a few touches of rose along the horizon; under it a black
// band of woods, and a field of dark greens that a brown cart track crosses. Right of the middle, against the
// darkest of the trees, is a long low house: a near-black roof, a long wall of worn pale plaster with small dark
// windows, and at its near end a gable that still holds the last of the light, with old thatch coming low down
// beside it and one pale patch under the thatch's eave. From a red brick chimney a thread of blue smoke goes straight up
// against the trees: the air is quite still, and somebody has a fire lit. And it is the hour when hens go in. A
// string of them, two white and the rest dark, is walking along the track towards that end of the house; and out in
// the grass, further from home than any of them, a cock with a pale neck and a red comb is still at it, with two
// hens beside him. Everything in the picture that moves is on its way in, and one of them has not noticed yet.
// So the word is the picture's hour, dusk: the half hour in which the light goes, the fowl go in and a lamp is
// lit. (Apollonio's Ulysses in Gallery 238 has the word home, and a ship that sails to it; nothing here travels
// further than a yard's length, and what this show is about is the light going.)
//
// Look at it and his field comes out over the floor under the picture, laid in as he laid it in, the darks first:
// the woods and the trees against the wall under the frame, the house in front of them, standing at an angle with
// its gable end towards you, and his sky on the wall above the trees, lowest and palest at the left, where the rose
// is. The gable is the last thing to come, and the lightest. Smoke starts up from the red chimney, thin and
// straight. Three hens are already on the track, heads going, a white one in front; one stops to peck and has to
// trot to catch up; and one after another they turn off the track, cross the worn earth at the end of the house
// and go in under the thatch's low eave, into the dark beside the pale patch. All this while the light is going:
// the yellow goes out of the sky and then most of the rose, the greens go down to blue. The two hens in the grass
// look up, one and then the other, and go after the rest. The cock does not. He scratches, pecks, looks about him,
// and he is alone in the field. Then one window of the long wall lights, warm, and its light lies out across the
// track. He sees it: he stands right up, as tall as he is painted; takes two high steps as if there were no hurry;
// and runs, neck out and wings half open, up the track and round to the end of the house, ducks his head under the
// eave and is in. A hen makes room, somewhere inside. And then it is the picture an hour on: the dark house, one
// warm window, the smoke going straight up into a sky with a last line of rose in it. While you keep looking that
// is all there is; the smoke rises and the lamp burns. When you stop, the night closes in from the edges of the
// field and the window is the last thing to go.
//
// How it is made: three draw calls. The floor and the wall are one mesh with one shader: his field in long level
// drags of close greens, the track and the worn yard in broken browns, its edge the ragged ends of the strokes, the
// shade under the house, the trees and each bird, the lamp's light lying on the ground; and on the wall his sky,
// scumbled, with the yellow break and the rose, going down to slate as the evening goes. The same mesh has a low
// skirt of the field's own grass standing against the foot of the house's walls, ragged at its top: the gallery
// lays a pool of light on the floor under every picture, drawn a hair in front of the floor, and it showed as a
// pale line along the bottom of anything solid standing there; the skirt is drawn after it and covers it, so at
// dusk nothing at the foot of the wall is brighter than the wall. The house is a second (one rig with the birds'
// small dark bodies): painted, not modelled, the plaster and the thatch brushed into its colours and nothing with
// a hard edge; the gable's loaded lights and the lit window are in that paint too. All its roofs are one thatch in
// different light (the low wing by the gable in the last of the day, the long slope out of it), the long roof
// hangs out over the wall with a ragged edge, and the chimneys are painted on all four sides. Everything else is
// his touch, soft marks that face you and lie along their own direction, in one instanced mesh: the masses of the
// trees and the feathered lights on them, the far woods, the garden's bushes (clumps of dabs standing out from the
// wall, so its foot and its face are broken by them) and its few red and orange flowers, the grass, a broken line
// of lighter thatch along the ridge and the eave (his own roof colours: it is what keeps the roof a roof against
// the woods when both have gone dark), the dabs on the chimneys, the smoke (long thin wisps, never a puff), and
// the birds: each a handful of touches on a moving frame, as he made each of them from three or four. (A mark
// faces you, so one laid flat against a wall or a slope is cut along a straight line where it meets it: marks on
// the house stand clear of it, at its edges.) A hen sits low and round over short legs, with a fan of a tail. No
// bird slides: a step is a fixed part of the bird's own size, a foot that is down stays where it was put while the
// body goes over it, and a bird that turns where it stands steps round. The birds are built a little smaller as
// they near the house (0.62 of their size at the eave), as things are on a stage, so that the house can stand
// small under the picture and the cock still be seen from across the room.
//
// Where it reaches. Nothing stays out after the look and nothing is solid. The field lies from 1.56 m left of the
// picture's middle (just short of the side wall) to about 1.0 m right of it, and comes about 1.7 m out from the
// wall. Nothing in it stands higher than 0.98 m: that is the sky on the wall, under this frame's rail at 1.06 m,
// and it stops 0.99 m right of the middle, 0.19 m short of the Beggar with Oysters' canvas. The trees stop at
// 0.83 m, and at about 0.6 m at the right end, where the Beggar hangs down to 0.8 m; the smoke has thinned to
// nothing before it reaches the frame. Courbet's dark and his counter (src/life/4428-mere-gregoire.js) begin
// 1.9 m to the right of this picture's middle, about 0.9 m beyond this scene's edge; Manet's cloth
// (src/life/44892-fish-still-life.js) and Breton's dawn and lark (src/life/94841-song-of-the-lark.js) are further
// along the same wall, about 5.9 m and 8.4 m away. Breton's is the day beginning, with a bird on the wing and
// bells; this is the day ending, with birds on foot, and it has no bell, no song and no light arriving: the only
// light that comes is a lamp. If Manet's lemon is lying out for the toy when this begins, the kit sends it home.
// From the look camera nothing comes in front of a canvas.
//
// The sounds are the yard's: a hen's low word as each goes in, the cock's three notes when he sees he is alone,
// his feet on the track, one soft low note as the lamp is lit, and a hen settling. No tune: it is a still evening.
// With "Reduce motion and flashing" on (read as the show runs), the lamp comes up three times as slowly and does
// not waver, the cock's run has half its bounce and his wings stay nearly shut, the smoke's sway is halved and
// every sound is quieter and eased in. Nothing here flashes at any setting.
//
// The lamp is the show's, not the picture's: in the picture it is not yet dark enough for one, and the caption
// says so. The pale patch under the thatch is in the picture; that the hens roost there is the show's guess.
//
// What it does not do: nobody comes out, in any form. No one opens a door, calls the hens, crosses the window or
// tends the fire, and the woman with the cow and the two people sitting in the far field stay in the picture,
// because any woman brought out under this title would be taken for Mère Bazot, and the museum tells us nothing
// about her but her name: she is given no face, no errand and no story, only a fire and a lamp, which any house
// has. The hens are not driven, chased or frightened (the cock runs because he is late, not because anything is
// after him), and the toy cannot scatter them.

import * as THREE from 'three';
import { lifeFor, ease, ramp, clamp01, lerp, shape } from '../paintlife.js';
import { strokes } from './brush.js';
import { score, hump } from './stagecraft.js';

const TAU = Math.PI * 2;
const sm = (x, a, b) => ease.smooth(ramp(x, a, b));
const GL = n => n.toFixed(5);
// ---------------------------------------------------------------- the place (u along the wall, h up, o out from it)
const U0 = -0.36, SA = 1.2, SB = 1.62;                 // the patch of field: its middle along the wall, its reach each way and out
const reach = (u, o) => Math.cbrt(Math.pow(Math.abs(u - U0) / SA, 3) + Math.pow(Math.max(o, 0) / SB, 3));
// the house: its own frame is x along its long front wall (to the right, and back towards the wall), y up, z out of
// that wall. G is the foot of the wall's left end. At that end a wing stands forward with its gable to the front,
// and its thatch comes down low on the left, to an eave a bird can walk under.
const HA = 22 * Math.PI / 180, CA = Math.cos(HA), SN = Math.sin(HA), G = [-0.6, 0.76];
const LEN = 1.35, DEP = 0.3, EH = 0.19, RH = 0.44;      // long, deep, eaves, ridge
const WW = 0.36, PJ = 0.1, RX = 0.18, CS = 0.06, LE = 0.105;      // the wing: wide, standing this far forward, its ridge; the thatch's low eave: how far out, how high
const hu = (x, z) => G[0] + x * CA + z * SN, ho = (x, z) => G[1] - x * SN + z * CA;
const HY = 0.016;                                       // the house stands on the painted field, which lies this far above the floor
const WX = 0.56, WY = 0.1;                              // the window that lights: along the front wall, and up
const CH = [0.64, 1.02];                                // the chimneys, along the ridge: the red one (the fire's), the pale one
const SMOKE = [hu(CH[0], -DEP / 2), RH + 0.085 + HY, ho(CH[0], -DEP / 2)];
const LAMP = [hu(WX, 0), WY + HY, ho(WX, 0)];                 // the window, in the scene
// the cart track across the field, passing the front of the house; and the worn earth at the thatched end
const TRACK = [[-1.62, 1.03], [-1.2, 1.09], [-0.95, 1.07], [-0.72, 1.03], [-0.42, 0.96], [0.02, 0.69], [0.39, 0.53], [0.72, 0.4], [1.0, 0.3]];
const YARD = [-0.78, 0.88, 0.2, 0.1];
// where the hens go in: under the thatch's low eave, at its front; and a little way inside
const IN = [hu(-CS, 0.03), ho(-CS, 0.03)], INSIDE = [hu(0.06, 0), ho(0.06, 0)], TURN = [IN[0] - 0.25 * CA, IN[1] + 0.25 * SN];
const far = o => lerp(0.62, 1, sm(o, 0.84, 1.3));       // how big a bird is built, by how far out it is
const sag = x => 0.014 * Math.sin(Math.PI * clamp01(x / LEN)) + 0.005 * Math.sin(x * 8);      // the long ridge, sagging a little
// the long roof's eave: the thatch hangs out over the wall, and its edge is ragged
const eaveZ = x => 0.046 + 0.01 * Math.sin(x * 37) + 0.007 * Math.sin(x * 83 + 1.3), eaveY = x => EH - 0.03 - 0.6 * (eaveZ(x) - 0.046);
const SKIRT = 0.05;                                     // the grass against the foot of the house's walls: this high at most
// ---------------------------------------------------------------- the clock
const T_SMOKE = 1.4, T_DUSK0 = 1.8, T_DUSK1 = 5.9, T_ALONE = 4.25, T_LAMP = 5.0, T_TALL = 5.2, T_STRUT = 5.75, T_RUN = 6.25, T_DUCK = 7.45, T_IN = 7.8, T_SETTLE = 8.35;
// the birds: where each walks (the last three points are the turn off the track, the eave, inside), and when:
// [seconds, how far along] with 1 at the eave. kind 1 is the cock.
const BIRDS = [
  { S: 0.112, pale: 1, comb: 0.5, pts: [[-1.5, 1.06], [-1.27, 1.09], [-1.05, 1.02]], keys: [[0, 0.5], [2.7, 1], [3.2, 1.14]], ph: 0.1 },
  { S: 0.109, pale: 1, comb: 1, pts: [[-1.5, 1.06], [-1.27, 1.09], [-1.05, 1.02]], keys: [[0, 0.3], [1.4, 0.5], [2.15, 0.5], [4.0, 1], [4.5, 1.14]], ph: 0.55 },
  { S: 0.114, pale: 0, comb: 0.8, pts: [[-1.5, 1.06], [-1.27, 1.09], [-1.05, 1.02]], keys: [[0, 0.06], [2.5, 0.5], [3.2, 0.5], [5.0, 1], [5.5, 1.14]], ph: 0.8 },
  { S: 0.116, pale: 0, comb: 0.8, pts: [[-0.86, 1.27], [-0.96, 1.16], [-0.99, 1.04]], keys: [[0, 0], [3.05, 0], [5.9, 1], [6.35, 1.14]], ph: 0.3, turn: 2.4 },
  { S: 0.11, pale: 0, comb: 0.6, pts: [[-0.7, 1.34], [-0.86, 1.22], [-0.96, 1.07]], keys: [[0, 0], [3.75, 0], [6.4, 1], [6.85, 1.14]], ph: 0.7, turn: -2.0 },
  { S: 0.14, pale: 0, comb: 1, kind: 1, pts: [[-1.08, 1.31], [-1.1, 1.18], [-1.04, 1.05]], keys: [[0, 0], [T_STRUT, 0], [T_RUN, 0.13], [T_DUCK, 0.93], [T_IN, 1], [T_IN + 0.35, 1.14]], ph: 0, turn: 1.4 },
];
const NB = BIRDS.length;
const SOFT = 0, DRAG = 1, PUFF = 2, DOTS = 3, LEAF = 4, TUFT = 7, MASS = 8, FEATH = 9, HALO = 10;      // (leaves: 4, 5, 6)
const NC = 400;

// soft noise, for paint laid on at the build
const h2 = (x, y) => { const q = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return q - Math.floor(q); };
const vn = (x, y) => { const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy, ax = fx * fx * (3 - 2 * fx), ay = fy * fy * (3 - 2 * fy); return lerp(lerp(h2(ix, iy), h2(ix + 1, iy), ax), lerp(h2(ix, iy + 1), h2(ix + 1, iy + 1), ax), ay); };

// A painted surface: fn(s, t, into) is its point for s and t in 0..1; n by m cells; paint(p, colour, s, t) the colour
// of the paint there.
function surf(fn, n, m, paint) {
  const P = [], C = [], k = new THREE.Color(), v = new THREE.Vector3(), idx = [];
  for (let j = 0; j <= m; j++) for (let i = 0; i <= n; i++) { fn(i / n, j / m, v); P.push(v.x, v.y, v.z); k.setRGB(1, 1, 1); paint(v, k, i / n, j / m); C.push(k.r, k.g, k.b); }
  for (let j = 0; j < m; j++) for (let i = 0; i < n; i++) { const a = j * (n + 1) + i, b = a + 1, c = a + n + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setIndex(idx); g.computeVertexNormals();
  const out = g.toNonIndexed(), o2 = new THREE.BufferGeometry();
  for (const name of ['position', 'normal', 'color']) o2.setAttribute(name, out.attributes[name]);
  return o2;
}
function tint(g, fn) { const p = g.attributes.position, c = g.attributes.color, k = new THREE.Color(), v = new THREE.Vector3(); for (let i = 0; i < p.count; i++) { fn(v.fromBufferAttribute(p, i), k); c.setXYZ(i, k.r, k.g, k.b); } return g; }

// ---------------------------------------------------------------- his marks: soft touches, one sheet of them
// Eleven marks, each in a cell 128 wide and 256 high; the top of a cell is the end the mark leads with. Red is how
// the paint lies (lighter where the brush was loaded, darker where it dragged thin); alpha is where the paint is,
// soft at every edge, and how soon each bit of it comes, so a mark can arrive or go a little at a time.
function blur(A, W, H, r, passes) {
  const B = new Float32Array(W * H), n = 2 * r + 1, cl = (v, m) => (v < 0 ? 0 : v > m ? m : v);
  for (let p = 0; p < passes; p++) {
    for (let y = 0; y < H; y++) { let s = 0; for (let k = -r; k <= r; k++) s += A[y * W + cl(k, W - 1)]; for (let x = 0; x < W; x++) { B[y * W + x] = s / n; s += A[y * W + cl(x + r + 1, W - 1)] - A[y * W + cl(x - r, W - 1)]; } }
    for (let x = 0; x < W; x++) { let s = 0; for (let k = -r; k <= r; k++) s += B[cl(k, H - 1) * W + x]; for (let y = 0; y < H; y++) { A[y * W + x] = s / n; s += B[cl(y + r + 1, H - 1) * W + x] - B[cl(y - r, H - 1) * W + x]; } }
  }
  return A;
}
function markAtlas(rand) {
  const W = 1024, H = 512, CW = 128, CHH = 256;
  const mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; };
  const cl = mk(), ca = mk(), gl = cl.getContext('2d', { willReadFrequently: true }), ga = ca.getContext('2d', { willReadFrequently: true });
  gl.fillStyle = 'rgb(128,128,128)'; gl.fillRect(0, 0, W, H); ga.fillStyle = '#000'; ga.fillRect(0, 0, W, H);
  ga.globalCompositeOperation = 'lighten';
  const R = (a, b) => a + (b - a) * rand();
  const cell = (i, asp, f, wide = 1) => { const x = (i % 8) * CW, y = Math.floor(i / 8) * CHH; for (const g of [gl, ga]) { g.save(); g.beginPath(); g.rect(x + 12, y + 12, CW - 24, CHH - 24); g.clip(); g.translate(x + CW / 2, y + CHH / 2); g.scale(wide, 2 / asp); } f(52 * asp); gl.restore(); ga.restore(); };
  const grey = v => { v = Math.round(Math.max(0, Math.min(255, v))); return `rgb(${v},${v},${v})`; };
  // one touch of a soft brush from a to b: round-ended, with the bristles' streaks along it
  const touch = (x0, y0, x1, y1, w, v, al = 1) => {
    for (const [g, st] of [[gl, grey(v)], [ga, grey(255 * al)]]) { g.strokeStyle = st; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); }
    const dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
    for (let k = 0; k < 4; k++) { const s = R(-0.4, 0.4) * w, a = R(0, 0.3), b = R(0.7, 1); gl.strokeStyle = grey(v + R(-38, 46)); gl.lineWidth = w * R(0.14, 0.28); gl.beginPath(); gl.moveTo(x0 + dx * a + nx * s, y0 + dy * a + ny * s); gl.lineTo(x0 + dx * b + nx * s, y0 + dy * b + ny * s); gl.stroke(); }
  };
  // a soft spot: full in the middle, nothing at its edge
  const spot = (x, y, rx, ry, v, al = 1) => {
    gl.fillStyle = grey(v); gl.beginPath(); gl.ellipse(x, y, rx * 1.1, ry * 1.1, 0, 0, TAU); gl.fill();
    ga.save(); ga.translate(x, y); ga.scale(rx, ry); const gr = ga.createRadialGradient(0, 0, 0, 0, 0, 1), a = Math.round(255 * al), b = Math.round(a * 0.7);
    gr.addColorStop(0, `rgb(${a},${a},${a})`); gr.addColorStop(0.5, `rgb(${b},${b},${b})`); gr.addColorStop(1, 'rgb(0,0,0)');
    ga.fillStyle = gr; ga.beginPath(); ga.arc(0, 0, 1, 0, TAU); ga.fill(); ga.restore();
  };
  const poly = (pts, v, al = 1) => { for (const [g, st] of [[gl, grey(v)], [ga, grey(255 * al)]]) { g.fillStyle = st; g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.fill(); } };
  // leaves, as he feathers them: small soft touches all leaning one way, in loose groups, the darks under and the
  // lights over them on the side the sky is on
  const feather = (Y, n, ang) => {
    const Gp = Array.from({ length: 4 }, () => [R(-20, 20), R(-Y * 0.42, Y * 0.42), R(0.5, 0.9)]);
    for (let i = 0; i < n; i++) {
      const f = i / (n - 1), g = Gp[i % 4], a0 = R(0, TAU), r0 = Math.sqrt(rand()) * g[2], cx = Math.max(-27, Math.min(27, g[0] + Math.cos(a0) * r0 * 24)), cy = Math.max(-Y * 0.66, Math.min(Y * 0.66, g[1] + Math.sin(a0) * r0 * Y * 0.56)), a = ang + R(-0.5, 0.5), l = R(9, 20), w = R(11, 17);
      const sky = clamp01(0.5 - cx / 64 - cy / (Y * 2.2));
      touch(cx - Math.cos(a) * l / 2, cy - Math.sin(a) * l / 2, cx + Math.cos(a) * l / 2, cy + Math.sin(a) * l / 2, w, 66 + 116 * f * (0.4 + 0.8 * sky) + R(-14, 22), R(0.8, 1));
    }
  };
  // 0: a soft dab, blunt at both ends
  cell(SOFT, 1.6, Y => { touch(0, Y * 0.5, 0, -Y * 0.5, 58, 132); touch(-12, Y * 0.36, -9, -Y * 0.46, 26, 164, 0.9); touch(15, Y * 0.45, 14, -Y * 0.2, 22, 104, 0.9); }, 1.15);
  // 1: a long drag, full where it starts and drawn out thin, the brush running dry
  cell(DRAG, 5, Y => {
    poly([[-25, Y * 0.9], [25, Y * 0.9], [21, Y * 0.3], [11, -Y * 0.5], [4, -Y * 0.92], [-4, -Y * 0.92], [-12, -Y * 0.5], [-22, Y * 0.3]], 128);
    poly([[-25, Y * 0.9], [-7, Y * 0.9], [-4, -Y * 0.5], [-4, -Y * 0.92], [-12, -Y * 0.5], [-22, Y * 0.3]], 166); poly([[25, Y * 0.9], [10, Y * 0.9], [7, -Y * 0.2], [11, -Y * 0.5], [21, Y * 0.3]], 98);
    for (let i = 0; i < 9; i++) { const x = R(-19, 19), y0 = R(-Y * 0.2, Y * 0.85), l = R(Y * 0.3, Y * 0.9), k = clamp01(1 - Math.abs(x) / 25); gl.strokeStyle = grey(128 + R(-50, 62)); gl.lineWidth = R(4, 9); gl.lineCap = 'round'; gl.beginPath(); gl.moveTo(x, y0); gl.lineTo(x * 0.5, Math.max(-Y * 0.88 * k, y0 - l)); gl.stroke(); }
    ga.globalCompositeOperation = 'source-over';
    for (let i = 0; i < 6; i++) { const y = R(-Y * 0.9, Y * 0.2), hh = R(5, 12); ga.fillStyle = 'rgba(0,0,0,0.5)'; ga.beginPath(); ga.moveTo(-40, y); ga.lineTo(40, y + R(-18, 18)); ga.lineTo(40, y + hh + R(-18, 18)); ga.lineTo(-40, y + hh); ga.fill(); }
    ga.globalCompositeOperation = 'lighten';
  }, 1.5);
  // 2: smoke, or mist: nothing but softness
  cell(PUFF, 1.5, Y => { for (let i = 0; i < 7; i++) spot(R(-11, 11), R(-Y * 0.42, Y * 0.42), R(17, 26), R(Y * 0.24, Y * 0.42), R(120, 190), R(0.5, 0.85)); }, 1.2);
  // 3: a scatter of small touches: flowers
  cell(DOTS, 1.1, Y => { for (let i = 0; i < 8; i++) { const a = R(0, TAU), r = Math.sqrt(rand()); spot(Math.cos(a) * r * 26, Math.sin(a) * r * Y * 0.62, R(9, 13), R(10, 15), R(150, 250), 1); } }, 1.2);
  // 4, 5, 6: foliage, three ways
  cell(LEAF, 1.2, Y => feather(Y, 34, -0.9), 1.2);
  cell(LEAF + 1, 1.2, Y => feather(Y, 28, -1.3), 1.2);
  cell(LEAF + 2, 1.2, Y => feather(Y, 38, -0.5), 1.2);
  // 7: a tuft of grass: blades fanning up from one root
  cell(TUFT, 1.1, Y => { for (let i = 0; i < 9; i++) { const x = R(-30, 30), top = R(-Y * 0.86, -Y * 0.1), w = R(5, 9), bx = R(-8, 8); poly([[bx - w, Y * 0.88], [bx + w, Y * 0.88], [x + 2.5, top], [x - 2.5, top]], R(70, 200)); } }, 1.2);
  // 8: the body of a mass of leaves, or of a bird: broad, soft, dragged thin
  cell(MASS, 1.2, Y => { for (let i = 0; i < 7; i++) spot(R(-10, 10), R(-Y * 0.28, Y * 0.28), R(24, 32), R(Y * 0.36, Y * 0.54), R(104, 150)); for (let i = 0; i < 7; i++) { const cx = R(-20, 20), cy = R(-Y * 0.42, Y * 0.42); touch(cx - 9, cy + 16, cx + 9, cy - 16, R(10, 16), R(84, 170), 0.9); } });
  // 9: a feather, or a neck, or a leg: full at the root, to a point
  cell(FEATH, 3, Y => { poly([[-23, Y * 0.88], [23, Y * 0.88], [18, Y * 0.2], [6, -Y * 0.9], [-6, -Y * 0.9], [-18, Y * 0.2]], 132); poly([[-23, Y * 0.88], [-7, Y * 0.88], [-3, -Y * 0.6], [-6, -Y * 0.9], [-18, Y * 0.2]], 170); poly([[23, Y * 0.88], [9, Y * 0.88], [7, -Y * 0.3], [18, Y * 0.2]], 98); for (let i = 0; i < 5; i++) { const x = R(-15, 15); gl.strokeStyle = grey(132 + R(-40, 56)); gl.lineWidth = R(4, 8); gl.beginPath(); gl.moveTo(x, Y * 0.84); gl.lineTo(x * 0.3, -Y * R(0.3, 0.84)); gl.stroke(); } }, 1.5);
  // 10: the lamp's own light
  cell(HALO, 1, Y => { gl.fillStyle = grey(255); gl.fillRect(-60, -Y - 10, 120, 2 * Y + 20); spot(0, 0, 40, Y * 0.86, 255, 1); });
  // (softened, so no mark has a hard edge; the alpha then times a soft noise, so that a rising threshold wears a
  // mark away raggedly)
  const c = gl.getImageData(0, 0, W, H).data, d = ga.getImageData(0, 0, W, H).data, out = new Uint8Array(W * H * 4);
  const A = new Float32Array(W * H), V = new Float32Array(W * H); for (let i = 0; i < W * H; i++) { A[i] = d[i * 4]; V[i] = c[i * 4]; }
  blur(A, W, H, 3, 3); blur(V, W, H, 2, 2);
  for (const i of [SOFT, DRAG, PUFF, MASS, FEATH]) {       // (the broad marks once more, each in its own cell)
    const x0 = (i % 8) * CW, y0 = Math.floor(i / 8) * CHH, T = new Float32Array(CW * CHH);
    for (let y = 0; y < CHH; y++) for (let x = 0; x < CW; x++) T[y * CW + x] = A[(y0 + y) * W + x0 + x];
    blur(T, CW, CHH, i === FEATH || i === DRAG ? 5 : 7, 3);
    for (let y = 0; y < CHH; y++) for (let x = 0; x < CW; x++) A[(y0 + y) * W + x0 + x] = T[y * CW + x];
  }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x, halo = x >= (HALO % 8) * CW && x < (HALO % 8 + 1) * CW && y >= CHH;
    const n = halo ? 1 : 0.55 + 0.45 * (0.66 * vn(x / 9, y / 9) + 0.34 * vn(x / 3.7 + 7, y / 3.7 + 3));
    out[i * 4] = out[i * 4 + 1] = out[i * 4 + 2] = Math.round(V[i]); out[i * 4 + 3] = Math.round(A[i] * n);
  }
  const t = new THREE.DataTexture(out, W, H, THREE.RGBAFormat);
  t.flipY = false; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter; t.needsUpdate = true;
  return t;
}
// A brush texture gone soft: each stroke's edge lost into the next (it still tiles; its alpha, the strokes' numbers, is kept).
function soften(t, r, passes = 2) {
  const W = t.image.width, H = t.image.height, d = t.image.data, a = new Float32Array(W * H), b = new Float32Array(W * H), n = 2 * r + 1;
  for (let ch = 0; ch < 3; ch++) {
    for (let i = 0; i < W * H; i++) a[i] = d[i * 4 + ch];
    for (let p = 0; p < passes; p++) {
      for (let y = 0; y < H; y++) { let s = 0; for (let k = -r; k <= r; k++) s += a[y * W + ((k + W) % W)]; for (let x = 0; x < W; x++) { b[y * W + x] = s / n; s += a[y * W + ((x + r + 1) % W)] - a[y * W + ((x - r + W) % W)]; } }
      for (let x = 0; x < W; x++) { let s = 0; for (let k = -r; k <= r; k++) s += b[((k + H) % H) * W + x]; for (let y = 0; y < H; y++) { a[y * W + x] = s / n; s += b[((y + r + 1) % H) * W + x] - b[((y - r + H) % H) * W + x]; } }
    }
    for (let i = 0; i < W * H; i++) d[i * 4 + ch] = a[i];
  }
  t.needsUpdate = true; return t;
}
// the top of the woods on the wall, at u along it: the far woods low on the left, the one tall tree at the picture's
// left edge, the trees behind the house, lower again towards the right
const woodTop = u => 0.37 + 0.02 * Math.sin(u * 9) + 0.34 * Math.exp(-Math.pow((u + 1.3) / 0.1, 2)) + (0.38 + 0.05 * Math.sin(u * 7 + 1) + 0.03 * Math.sin(u * 17)) * sm(u, -0.8, -0.3) * (1 - 0.52 * sm(u, 0.5, 0.98));

lifeFor(81507, {
  title: /^House of M.re Bazot/,
  word: 'dusk',
  stage: { out: 1.7, half: 1.4, cam: { dist: 2.7, height: 0.86, side: -0.42, fov: 60, lookU: -0.34, lookOut: 0.55, lookH: 0.8, floorOut: 1.56 } },
  wake: 2, ret: 2.6,

  build(L) {
    const P = L.pal, col = (h, a = 0.2) => P.near(h, a);
    this.T3 = new THREE.Vector3(L.tx, 0, L.tz); this.N3 = new THREE.Vector3(L.nx, 0, L.nz); this.UP = new THREE.Vector3(0, 1, 0);
    this.O = L.floor(0, 0); this.M0 = new THREE.Matrix4().makeBasis(this.T3, this.UP, this.N3).setPosition(this.O);
    this.v = new THREE.Vector3(); this.kc = new THREE.Color(); this.grow = 0; this.shut = 0; this.calm = false; this.bT = 0; this.g0 = 1; this.d0 = 0; this.l0 = 0;
    this.buildGround(L, col); this.buildRig(L, col); this.buildCards(L, col); this.buildBirds(L, col);
    this.bands = [this.makeScore(L, false), this.makeScore(L, true)]; this.band = this.bands[0];
    this.hideAll();
  },

  // ---------------------------------------------------------------- the floor and the wall: his field, the track, his woods and sky
  buildGround(L, col) {
    const pos = [], uo = [], v = new THREE.Vector3(), idx = [];
    // (the wall's sheet hangs just behind the canvas's plane: in front of the skirting, and of the lamps' wash on the wall)
    const quad = (pts, wall) => { const b = pos.length / 3; for (const [a, c] of pts) { if (wall) L.at(a, c - (L.cy - L.y), -0.004, v); else { L.floor(a, c, v); v.y += 0.012; } pos.push(v.x, v.y, v.z); uo.push(a, c, wall ? 1 : 0); } idx.push(b, b + 2, b + 1, b + 2, b + 3, b + 1); };
    quad([[-1.6, -0.004], [1.12, -0.004], [-1.6, 1.74], [1.12, 1.74]], false);
    quad([[-1.6, 0.0], [1.12, 0.0], [-1.6, 1.0], [1.12, 1.0]], true);
    // A skirt of the field's own paint against the foot of every wall of the house, a few centimetres high and
    // ragged at its top: grass grown up the wall. (It is drawn with the field, so after the gallery's own pool of
    // light on the floor under the picture. That pool is laid on with a depth offset, which lets it land on the
    // lowest row of anything opaque standing on the floor: without this, a pale line along the foot of the walls.)
    { const e = 0.003, ring = [[-CS - e, PJ + e], [WW + e, PJ + e], [WW + e, e], [LEN + e, e], [LEN + e, -DEP - e], [-CS - e, -DEP - e]];
      ring.forEach((a, i) => {
        const c = ring[(i + 1) % ring.length], b = pos.length / 3;
        for (const [q, t] of [[a, 0], [c, 0], [a, 1], [c, 1]]) { const uu = hu(q[0], q[1]), oo = ho(q[0], q[1]); L.floor(uu, oo, v); v.y += 0.012 + t * SKIRT; pos.push(v.x, v.y, v.z); uo.push(uu, oo, 2 + t); }
        idx.push(b, b + 2, b + 1, b + 2, b + 3, b + 1);
      }); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aUO', new THREE.Float32BufferAttribute(uo, 3)); g.setIndex(idx);
    const css = (h, a = 0.2) => col(h, a).getStyle();
    // the field: long level drags, close in value, dark greens with a cold green dragged through them
    const field = soften(strokes({
      size: 512, seed: 81507, n: 1300, len: [60, 190], width: [10, 28], bend: 0.12, lift: 0, base: css('#0f2017'),
      colors: [['#0a140e', 3], ['#102418', 4], ['#153522', 3.2], ['#1a472c', 1.7], ['#215c39', 0.55], ['#253318', 1.3], ['#18130c', 0.8], ['#34431f', 0.3]].map(([c, w]) => [css(c), w]),
      angle: (x, y, r) => 0.07 * Math.sin(y * TAU * 2 + x * 3) + (r() - 0.5) * 0.2,
    }), 3);
    // the track: broken browns, dragged the way it runs
    const earth = soften(strokes({
      size: 256, seed: 81508, n: 460, len: [18, 60], width: [7, 17], bend: 0.3, lift: 0, base: css('#241a11'),
      colors: [['#17110b', 3], ['#2b2015', 4], ['#3a2b1b', 3], ['#4b3823', 1.5], ['#5c4830', 0.5], ['#252614', 1.2]].map(([c, w]) => [css(c), w]),
      angle: (x, y, r) => -0.2 + (r() - 0.5) * 0.9,
    }), 2);
    // the sky: scumbled, greys and lilacs so close that only the brush shows
    const sky = soften(strokes({
      size: 512, seed: 81509, n: 1600, len: [24, 76], width: [10, 26], bend: 0.5, lift: 0.03, base: css('#a39a90', 0.12),
      colors: [['#9c9890', 3], ['#a59b89', 3.2], ['#aea596', 2.6], ['#b7ae9e', 1.2], ['#9a9a9e', 1.3], ['#a69a98', 1.3], ['#bdb193', 0.5]].map(([c, w]) => [css(c, 0.12), w]),
      angle: (x, y, r) => 0.5 + 0.5 * Math.sin(x * TAU + y * 4) + (r() - 0.5) * 1.5,
    }), 3);
    // the woods: short feathered touches, all but black, a dark green and a little olive among them
    const leafT = soften(strokes({
      size: 256, seed: 81510, n: 1100, len: [9, 24], width: [7, 15], bend: 0.4, lift: 0.03, base: css('#0a0d08', 0.1),
      colors: [['#060806', 4], ['#0d120a', 4], ['#151c0e', 2.6], ['#202a14', 1.3], ['#33351a', 0.5]].map(([c, w]) => [css(c, 0.12), w]),
      angle: (x, y, r) => -0.9 + (r() - 0.5) * 1.3,
    }), 2);
    const u = this.gu = {
      uGrow: { value: 0 }, uShut: { value: 0 }, uDusk: { value: 0 }, uLamp: { value: 0 }, tField: { value: field }, tEarth: { value: earth }, tSky: { value: sky }, tLeaf: { value: leafT },
      uBird: { value: Array.from({ length: NB }, () => new THREE.Vector4(0, 0, 0.05, 0)) },
      cLamp: { value: new THREE.Color('#ffa850') }, cYel: { value: col('#d6cb9a', 0.1) }, cRose: { value: col('#c98f7c', 0.1) }, cBlue: { value: col('#93969c', 0.15) },
      cSlate: { value: col('#3b4250', 0.1) }, cPale: { value: col('#8e8c88', 0.1) }, cNear: { value: col('#333f1d', 0.15) }, cLit: { value: col('#6f6630', 0.15) },
    };
    const m = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide });
    const segs = TRACK.slice(0, -1).map((a, i) => `d = min(d, seg(p, vec2(${GL(a[0])}, ${GL(a[1])}), vec2(${GL(TRACK[i + 1][0])}, ${GL(TRACK[i + 1][1])})));`).join(' ');
    m.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, u);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec3 aUO; varying vec3 vUO;').replace('#include <begin_vertex>', '#include <begin_vertex>\n  vUO = aUO;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
uniform float uGrow, uShut, uDusk, uLamp; uniform sampler2D tField, tEarth, tSky, tLeaf; uniform vec4 uBird[${NB}]; uniform vec3 cLamp, cYel, cRose, cBlue, cSlate, cPale, cNear, cLit;
varying vec3 vUO; vec3 hCol; float hA;
float seg(vec2 p, vec2 a, vec2 b) { vec2 pa = p - a, ba = b - a; return length(pa - ba * clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0)); }
float blot(vec2 p, vec2 c, vec2 d, vec2 r) { vec2 q = p - c; return exp(-pow(dot(q, d) / r.x, 2.0) - pow(dot(q, vec2(-d.y, d.x)) / r.y, 2.0)); }`)
        .replace('#include <map_fragment>', `#include <map_fragment>
if (vUO.z < 0.5 || vUO.z > 1.5) {
  vec2 p = vUO.xy;
  vec4 tf = texture2D(tField, vec2(p.x / 1.3, p.y / 0.66) + vec2(0.13, 0.07)), tg = texture2D(tField, vec2(p.x / 0.74 + 0.4, p.y / 0.4 + 0.3)), te = texture2D(tEarth, p / 0.5 + vec2(0.4, 0.2));
  // (the skirt at the foot of the house: blades of the field's paint, each its own height)
  float sk = vUO.z - 2.0, blade = 0.0;
  if (sk > -0.5) { float sa = p.x * 0.9 + p.y * 0.44; blade = 0.62 * texture2D(tField, vec2(0.37 + sk * 0.07, sa / 0.3)).a + 0.38 * texture2D(tField, vec2(0.81 + sk * 0.05, sa / 0.09)).a; }
  // how far the evening has come out from under the picture, and the field's own edge: the ends of its strokes
  vec2 e = vec2((p.x - ${GL(U0)}) / ${GL(SA)} + 1.0e-5, max(p.y, 0.0) / ${GL(SB)}); float th = atan(e.y, e.x);
  float r = pow(pow(abs(e.x), 3.0) + pow(e.y, 3.0), 1.0 / 3.0) + 0.3 * smoothstep(0.15, 1.0, e.x) * smoothstep(0.35, 1.0, e.y), rw = r / (1.0 + 0.07 * sin(3.0 * th + 0.6) + 0.05 * sin(5.0 * th + 2.3) + 0.03 * sin(9.0 * th + 1.1));
  float m = min(uGrow * 1.6 - 0.25 - r, 1.0 - rw);
  m = min(m, 1.0 - uShut * 1.08 - 0.5 * distance(p, vec2(${GL(LAMP[0])}, ${GL(LAMP[2])})));      // (and the night, closing in round the window)
  hA = smoothstep(0.0, 0.05, m + (tf.a - 0.66) * 0.34 + (tg.a - 0.66) * 0.14);
  if (sk > -0.5) hA *= 1.0 - smoothstep(-0.14, 0.14, sk - 0.2 - 0.8 * blade);
  if (hA < 0.01) discard;
  // the field: level bands of dark and of cold green, more olive towards you
  float band = 0.5 + 0.5 * sin(p.y * 13.0 + p.x * 1.7 + 1.6 * sin(p.x * 1.7 + 0.4));
  vec3 c = mix(tf.rgb, tg.rgb, 0.45) * (0.72 + 0.6 * band * band);
  c = mix(c, c * 0.72 + cNear * 0.5 * (0.5 + tf.a), 0.6 * smoothstep(1.05, 1.7, p.y));
  // the track, and the worn earth at the end of the house
  float d = 9.0; ${segs}
  float tw = mix(0.095, 0.055, smoothstep(-1.2, 0.7, p.x));
  float track = 1.0 - smoothstep(0.5, 1.35, d / tw + (te.a - 0.6) * 0.9);
  float yard = blot(p, vec2(${GL(YARD[0])}, ${GL(YARD[1])}), vec2(${GL(CA)}, ${GL(-SN)}), vec2(${GL(YARD[2])}, ${GL(YARD[3])}));
  track = max(track, smoothstep(0.3, 0.7, yard + (te.a - 0.6) * 0.4));
  c = mix(c, te.rgb * (0.85 + 0.3 * tf.a), track * 0.9);
  // darker under the trees at the wall, under the house, and under each bird
  c *= mix(0.4, 1.0, smoothstep(0.0, 0.6, p.y));
  vec2 hc = vec2(${GL(hu(LEN * 0.48, -DEP * 0.25))}, ${GL(ho(LEN * 0.48, -DEP * 0.25))});
  c *= 1.0 - 0.72 * blot(p, hc, vec2(${GL(CA)}, ${GL(-SN)}), vec2(${GL(LEN * 0.62)}, ${GL(DEP * 0.95)}));
  c *= 1.0 - 0.6 * blot(p, vec2(${GL(hu(WW * 0.4, PJ * 0.4))}, ${GL(ho(WW * 0.4, PJ * 0.4))}), vec2(${GL(CA)}, ${GL(-SN)}), vec2(${GL(WW * 0.75)}, ${GL(PJ * 1.5)}));
  for (int i = 0; i < ${NB}; i++) { vec4 b = uBird[i]; vec2 q = p - b.xy; c *= 1.0 - b.w * exp(-dot(q, q) / (b.z * b.z)); }
  // the evening going: everything down towards blue
  c = mix(c, c * vec3(0.38, 0.5, 0.7) + vec3(0.0, 0.004, 0.011), uDusk);
  // the lamp: its light out of the window, across the garden and the track
  vec2 lq = p - vec2(${GL(hu(WX, 0))}, ${GL(ho(WX, 0))}); float al = dot(lq, vec2(${GL(SN)}, ${GL(CA)})), ac = dot(lq, vec2(${GL(CA)}, ${GL(-SN)}));
  float pool = exp(-pow(ac / (0.04 + 0.32 * max(al, 0.0)), 2.0)) * smoothstep(0.0, 0.05, al) * exp(-max(al, 0.0) / 0.24);
  c += cLamp * pool * uLamp * (0.1 + 0.2 * tf.a + 0.22 * track) * 1.25;
  if (sk > -0.5) c *= 0.8 + 0.5 * sk;
  hCol = c;
} else {
  vec2 p = vUO.xy;
  vec4 ts = texture2D(tSky, vec2(p.x / 0.95, p.y / 0.62)), t2 = texture2D(tSky, vec2(p.x / 0.5 + 0.31, p.y / 0.36 + 0.17)), tl = texture2D(tLeaf, p / 0.4 + vec2(0.2, 0.6));
  float ex = smoothstep(-1.58, -1.32, p.x) * (1.0 - smoothstep(0.62, 0.99, p.x)), ey = 1.0 - smoothstep(0.8, 0.985, p.y);
  // the woods' top: the far woods low on the left, the one tall tree at the picture's edge, the trees behind the house
  float top = 0.37 + 0.02 * sin(p.x * 9.0) + 0.34 * exp(-pow((p.x + 1.3) / 0.1, 2.0))
    + (0.38 + 0.05 * sin(p.x * 7.0 + 1.0) + 0.03 * sin(p.x * 17.0)) * smoothstep(-0.8, -0.3, p.x) * (1.0 - 0.52 * smoothstep(0.5, 0.98, p.x));
  float wood = 1.0 - smoothstep(-0.04, 0.035, p.y - top - (tl.a - 0.62) * 0.15);
  float skyA = smoothstep(0.1, 0.6, ex * ey + (ts.a - 0.66) * 0.5 * (1.0 - ex * ey));
  float woodA = smoothstep(0.1, 0.5, ex + (tl.a - 0.62) * 0.4 * (1.0 - ex));
  float come = smoothstep(0.0, 0.3, uGrow * 1.6 - 0.3 - 0.55 * abs(p.x - ${GL(U0)}) / ${GL(SA)} - mix(0.5, 0.25, wood) * p.y);
  come *= smoothstep(0.0, 0.14, 1.0 - uShut * 1.08 - 0.5 * length(vec3(p.x - ${GL(LAMP[0])}, p.y - ${GL(LAMP[1])}, ${GL(LAMP[2])})) + (tl.a - 0.62) * 0.1);
  hA = mix(skyA, woodA, wood) * come * 0.97;
  if (hA < 0.01) discard;
  vec3 c = ts.rgb * 0.9;
  c = mix(c, cBlue * (0.75 + 0.4 * ts.r), 0.4 * smoothstep(-0.3, 1.0, p.x) * smoothstep(0.45, 0.95, p.y));
  // the pale yellow break, high on the left; and the rose along the horizon
  float yel = blot(p, vec2(-0.86, 0.84), vec2(0.98, 0.17), vec2(0.3, 0.05)) * smoothstep(0.5, 0.8, t2.a);
  c = mix(c, cYel, 0.85 * yel * (1.0 - smoothstep(0.1, 0.55, uDusk)));
  float low = exp(-pow((p.y - 0.5 - 0.03 * sin(p.x * 4.0)) / 0.075, 2.0)) * (1.0 - smoothstep(-0.55, 0.05, p.x));
  float rose = low * smoothstep(0.5, 0.78, t2.a);
  c = mix(c, cRose, 0.8 * rose * (1.0 - 0.45 * uDusk));
  // the evening going: slate above, a pale band left low, a line of the rose kept in it
  vec3 night = mix(cPale, cSlate, smoothstep(0.42, 0.92, p.y)) * (0.8 + 0.4 * ts.r);
  night = mix(night, cRose * 0.8, 0.55 * low * smoothstep(0.55, 0.8, t2.a) * (1.0 - smoothstep(-0.9, -0.1, p.x) * 0.6));
  c = mix(c, night, uDusk * 0.9);
  // the woods: all but black, feathered; the one tree to the right of the chimneys still lit, and the tall one's top
  float lit = clamp(blot(p, vec2(0.42, 0.62), vec2(1.0, 0.0), vec2(0.25, 0.13)) + 0.8 * blot(p, vec2(-1.3, 0.61), vec2(1.0, 0.0), vec2(0.07, 0.09)), 0.0, 1.0);
  vec3 w = tl.rgb * mix(0.6, 1.05, smoothstep(0.05, 0.55, p.y));
  w = mix(w, cLit * (0.45 + 0.95 * tl.a), lit * smoothstep(0.45, 0.8, tl.a) * 0.9);
  w = mix(w, w * vec3(0.4, 0.5, 0.7), uDusk);
  hCol = mix(c, w, wood);
}`)
        .replace('#include <opaque_fragment>', '  outgoingLight = hCol; diffuseColor.a = hA;\n#include <opaque_fragment>');
    };
    m.customProgramCacheKey = () => 'bazot-ground';
    this.ground = new THREE.Mesh(g, m); this.ground.renderOrder = 5;
    L.add(this.ground);
  },

  // ---------------------------------------------------------------- the house, and the birds' bodies
  buildRig(L, col) {
    const ru = this.ru = { uGrow: { value: 0 }, uShut: this.gu.uShut, uLamp: { value: 0 }, uTint: { value: new THREE.Color(1, 1, 1) }, uC: { value: new THREE.Vector2(this.O.x, this.O.z) }, uTN: { value: new THREE.Vector4(L.tx, L.tz, L.nx, L.nz) }, uFloor: { value: L.y }, cLamp: { value: new THREE.Color('#ffbe6c') } };
    const mat = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, fog: false });
    mat.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, ru);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWp; varying vec3 vLp;')
        .replace('#include <project_vertex>', `#include <project_vertex>
  vLp = position;
  #ifdef USE_BATCHING
  vWp = (modelMatrix * (batchingMatrix * vec4(transformed, 1.0))).xyz;
  #else
  vWp = (modelMatrix * vec4(transformed, 1.0)).xyz;
  #endif`);
      // The paint: scumbled in the shader, where each part is its own (so it stays put when a bird moves). A part is
      // not there until the evening has reached it, and comes in raggedly. The window that lights is here too.
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
uniform float uGrow, uShut, uLamp, uFloor; uniform vec4 uTN; uniform vec2 uC; uniform vec3 uTint, cLamp; varying vec3 vWp; varying vec3 vLp;
float h31(vec3 p) { p = fract(p * 0.1031); p += dot(p, p.yzx + 33.33); return fract((p.x + p.y) * p.z); }
float vn3(vec3 p) { vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(h31(i), h31(i + vec3(1.0, 0.0, 0.0)), f.x), mix(h31(i + vec3(0.0, 1.0, 0.0)), h31(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
             mix(mix(h31(i + vec3(0.0, 0.0, 1.0)), h31(i + vec3(1.0, 0.0, 1.0)), f.x), mix(h31(i + vec3(0.0, 1.0, 1.0)), h31(i + vec3(1.0, 1.0, 1.0)), f.x), f.y), f.z); }`)
        .replace('#include <color_fragment>', `#include <color_fragment>
  { vec2 d = vWp.xz - uC; vec2 uo = vec2(dot(d, uTN.xy), dot(d, uTN.zw)); float hh = vWp.y - uFloor;
    float n1 = vn3(vLp * 31.0), k1 = vn3(vLp * vec3(30.0, 56.0, 30.0) + 3.1), k2 = vn3(vLp * vec3(130.0, 90.0, 130.0));
    float wdx = abs(vLp.x - ${GL(WX)}), wdy = abs(vLp.y - ${GL(WY)});
    float win = (1.0 - smoothstep(0.016, 0.025, wdx)) * (1.0 - smoothstep(0.023, 0.032, wdy)) * step(abs(vLp.z), 0.004);
    vec2 e = vec2(abs(uo.x - ${GL(U0)}) / ${GL(SA)}, max(uo.y, 0.0) / ${GL(SB)});
    float g = uGrow * 1.6 - 0.25 - pow(e.x * e.x * e.x + e.y * e.y * e.y, 1.0 / 3.0) - 0.1 * hh - 0.2 * n1 - 0.08 * vn3(vLp * 11.0) - 0.3 * dot(diffuseColor.rgb, vec3(0.3, 0.6, 0.1));
    g = min(g, 1.0 - uShut * 1.08 - 0.5 * length(vec3(uo.x - ${GL(LAMP[0])}, hh - ${GL(LAMP[1])}, uo.y - ${GL(LAMP[2])})) + 0.1 * (n1 - 0.5));
    if (g < 0.0 && win * uLamp < 0.05) discard;
    diffuseColor.rgb *= 1.0 + 0.4 * k1 - 0.24 + 0.2 * (k2 - 0.5);
    diffuseColor.rgb *= uTint;
    float bar = 0.55 + 0.45 * smoothstep(0.0015, 0.0045, wdx) * smoothstep(0.0015, 0.0045, abs(vLp.y - ${GL(WY + 0.005)}));
    diffuseColor.rgb = mix(diffuseColor.rgb, cLamp * bar * (0.8 + 0.3 * k2), win * uLamp); }`);
    };
    mat.customProgramCacheKey = () => 'bazot-rig';
    const rig = this.rig = L.rig(2 + NB, 100000, mat);

    // ---- the house, in its own frame
    const wallL = col('#646156'), wallP = col('#827f71', 0.15), wallD = col('#3a3730'), wallG = col('#2e3226'), dark = col('#110f0b', 0.1), shut = col('#2c241a'), lint = col('#5b574d');
    const gabL = col('#918e7b', 0.15), gabM = col('#74725f'), gabD = col('#3a3829');
    const roofD = col('#15110c', 0.1), roofB = col('#34281b'), roofM = col('#1d2216'), thD = col('#32281a'), thM = col('#54432c'), thL = col('#6f5c3e');
    const brick = col('#9b4a31', 0.12), brickD = col('#55291c'), brickL = col('#c06a48', 0.12), chalk = col('#a19f94'), chalkD = col('#5e5d55'), board = col('#2a2118'), glim = col('#c9c59d', 0.1);
    const fbm = (x, y) => 0.5 * vn(x, y) + 0.3 * vn(x * 2.3 + 5.1, y * 2.1 + 1.7) + 0.2 * vn(x * 5.3 + 2.2, y * 4.7 + 8.3);
    // the long front wall: worn plaster, lighter and darker by turns, damp and green at the foot, small dark
    // windows with their shutters, one door
    const WIN = [[WX - 0.024, 0.048, WY - 0.03, WY + 0.03], [0.74, 0.044, 0.074, 0.132], [1.0, 0.036, 0.08, 0.13], [1.19, 0.04, 0.077, 0.127]], DOOR = [0.86, 0.055, 0, 0.146];
    const hole = (p, c, x0, w, y0, y1, shutter) => {
      const k = (1 - sm(Math.abs(p.x - x0 - w / 2), w / 2 - 0.005, w / 2 + 0.007)) * (1 - sm(p.y, y1 - 0.005, y1 + 0.007)) * sm(p.y, y0 - 0.007, y0 + 0.005);
      c.lerp(dark, k * 0.95);
      if (shutter) c.lerp(shut, 0.8 * (1 - sm(Math.abs(p.x - x0 - w - 0.016), 0.009, 0.018)) * (1 - sm(p.y, y1 - 0.005, y1 + 0.005)) * sm(p.y, y0 - 0.005, y0 + 0.005));
      c.lerp(lint, 0.5 * (1 - sm(Math.abs(p.y - y1 - 0.01), 0.004, 0.01)) * (1 - sm(Math.abs(p.x - x0 - w / 2), w / 2, w / 2 + 0.014)));
    };
    const front = surf((s, t, v) => v.set(lerp(WW, LEN, s), t * (EH + 0.014), 0), 150, 28, (p, c) => {
      const n = fbm(p.x * 7, p.y * 15), n2 = fbm(p.x * 19 + 3, p.y * 26 + 1);
      c.copy(wallD).lerp(wallL, sm(n, 0.2, 0.62)).lerp(wallP, sm(n * 0.6 + n2 * 0.4, 0.5, 0.72) * 0.9);
      c.lerp(wallG, (1 - sm(p.y, 0.006, 0.05 + 0.04 * n2)) * 0.8).lerp(wallD, sm(p.y, EH - 0.035, EH) * 0.75);      // damp at the foot; the eave's shade
      c.multiplyScalar(lerp(1.06, 0.66, sm(p.x, 0.5, LEN)));                                                    // it goes back into the trees' dark
      for (const [x0, w, y0, y1] of WIN) hole(p, c, x0, w, y0, y1, true);
      hole(p, c, ...DOOR, false);
    });
    // the wing's gable: the lightest thing in the picture, a pale grey with a little green in it, darker towards
    // its foot where the bush stands; and under the thatch's low side, dark boards
    const rake = x => (x >= RX ? RH - (x - RX) * (RH - EH) / (WW - RX) : RH - (RX - x) * (RH - EH) / RX);
    const gable = surf((s, t, v) => { const x = lerp(-CS, WW, s); v.set(x, t * Math.max(0.02, rake(x)), PJ); }, 46, 44, (p, c) => {
      const n = fbm(p.x * 11 + 5, p.y * 11), top = rake(p.x);
      c.copy(gabM).lerp(gabL, sm(n, 0.25, 0.7) * sm(p.y, 0.05, 0.2)).lerp(gabD, (1 - sm(p.y, 0.02, 0.13 + 0.07 * n)) * 0.8);
      c.lerp(gabL, 0.55 * Math.exp(-Math.pow((p.x - RX + 0.01) / 0.085, 2) - Math.pow((p.y - 0.27) / 0.085, 2)) + 0.35 * Math.exp(-Math.pow((p.x - RX - 0.07) / 0.075, 2) - Math.pow((p.y - 0.19) / 0.07, 2)));      // the loaded lights
      c.lerp(gabD, 0.45 * sm(p.y, top - 0.03, top)).lerp(gabD, 0.5 * sm(p.x, WW - 0.035, WW));
      c.lerp(board, 0.92 * (1 - sm(p.x, -0.012, 0.012)));
    });
    // the wing's sides: on the right, a narrow wall back to the long one; on the left, the low opening under the
    // thatch, dark towards the track, with the pale patch he put there further back
    const wingR = surf((s, t, v) => v.set(WW, t * EH, lerp(PJ, 0, s)), 6, 12, (p, c) => { const n = fbm(p.z * 20, p.y * 14); c.copy(wallD).lerp(wallL, 0.35 * n).lerp(dark, 0.5 * sm(p.y, EH - 0.04, EH)); });
    const wingL = surf((s, t, v) => v.set(-CS, t * LE, lerp(PJ, -DEP, s)), 34, 10, (p, c, s, t) => {
      c.copy(dark).lerp(board, 0.3 * sm(s, 0.82, 1));
      const g = Math.exp(-Math.pow((s - 0.56) / 0.17, 2) - Math.pow((t - 0.42) / 0.36, 2)); c.lerp(glim, 0.7 * clamp01(g * 1.25) * (0.75 + 0.25 * vn(s * 20, t * 9)));      // (as light as the gable's lights and no lighter, as he has it: lighter, it glowed at the wall's foot when the rest had gone dark)
    });
    const endR = surf((s, t, v) => { const y = t * RH, w = y <= EH ? 1 : 1 - (y - EH) / (RH - EH); v.set(LEN, y, -DEP / 2 + (s - 0.5) * DEP * w); }, 6, 8, (p, c) => c.copy(dark).lerp(wallD, 0.3));
    const back = surf((s, t, v) => v.set(lerp(-CS, LEN, s), t * EH * (s < 0.1 ? 0.6 : 1), -DEP), 8, 3, (p, c) => c.copy(dark).lerp(wallD, 0.2));
    // The roofs: one old thatch. The wing's left slope has the last of the sky on it; the long roof, and the wing's
    // right slope, are the same thatch out of the light: the same courses, most of the way down to black, with a
    // little moss. (a: along the eave; d: down the slope; lit: how much light is on it; up: 0 at the eave, 1 at the ridge)
    const weave = (a, d, c, lit, up) => {
      const n = fbm(a * 14, d * 26), n2 = fbm(a * 21 + 9, d * 44 + 3);
      c.copy(thD).lerp(thM, sm(n, 0.15, 0.7) * lerp(0.42, 1, lit)).lerp(thL, sm(n, 0.5, 0.8) * (0.3 + 0.7 * up) * lerp(0.1, 1, lit));
      c.lerp(roofD, 0.55 * (1 - lit) * sm(n2, 0.3, 0.7)).lerp(roofM, 0.3 * (1 - lit) * sm(n2, 0.62, 0.8));
    };
    // (a faintly lighter line along its eave and along its ridge, as he has it; darker as it goes back into the trees)
    const roofPaint = (p, c, up) => { weave(p.x, p.z + p.y * 0.54, c, lerp(0.14, 0.04, sm(p.x, 0.3, LEN)), up); c.lerp(thM, 0.32 * (1 - sm(up, 0.0, 0.16)) + 0.24 * sm(up, 0.84, 1)).multiplyScalar(lerp(0.9, 0.62, sm(p.x, 0.2, LEN))); };
    const roofF = surf((s, t, v) => { const x = lerp(RX, LEN + 0.03, s); v.set(x, lerp(eaveY(x), RH - sag(x), t), lerp(eaveZ(x), -DEP / 2, t)); }, 70, 16, (p, c, s, t) => roofPaint(p, c, t));
    const roofB2 = surf((s, t, v) => { const x = lerp(RX, LEN + 0.03, s); v.set(x, lerp(EH - 0.014, RH - sag(x), t), lerp(-DEP - 0.024, -DEP / 2, t)); }, 16, 6, (p, c, s, t) => roofPaint(p, c, t));
    // the wing's roof: on the left, lighter along its top, coming right down to the low eave (ragged there); and its
    // right side, dark, going into the long roof
    const thatch = (p, c) => { weave(p.z, p.x + p.y * 0.54, c, 0.86, sm(p.y, LE, RH)); c.lerp(thD, 0.5 * (1 - sm(p.y, LE - 0.01, LE + 0.05))); };
    const wingT = surf((s, t, v) => { const x = lerp(RX, -CS - 0.022, t); v.set(x, lerp(RH, LE - 0.012, t) + (0.006 * Math.sin(s * 9) + 0.004 * Math.sin(s * 31 + 2)) * t, lerp(PJ + 0.022, -DEP - 0.02, s)); }, 30, 24, thatch);
    const wingD = surf((s, t, v) => { const x = lerp(RX, WW + 0.02, t); v.set(x, lerp(RH, EH - 0.014, t), lerp(PJ + 0.022, -DEP / 2, s)); }, 14, 12, (p, c, s, t) => { weave(p.z, p.x - p.y * 0.54, c, 0.14, 1 - t); c.multiplyScalar(0.9); });
    // the chimneys: red brick, lit on the side the sky is on; and a pale one further along. Each is four painted
    // sides, a little narrower up to a course standing out under its top, mottled as brick is
    const stack = (x, w, hgt, a, b, lit) => {
      const y0 = RH - sag(x) - 0.02, d = w * 0.85, ring = [[-w / 2, d / 2], [w / 2, d / 2], [w / 2, -d / 2], [-w / 2, -d / 2], [-w / 2, d / 2]];
      return surf((s, t, v) => {
        const q = Math.min(3.999, s * 4), i = Math.floor(q), f = q - i, k = t > 0.99 ? 0 : 1 - 0.1 * t + (t > 0.7 ? 0.13 : 0);
        v.set(x + lerp(ring[i][0], ring[i + 1][0], f) * k, y0 + Math.min(t, 6 / 7) * (7 / 6) * hgt, -DEP / 2 + lerp(ring[i][1], ring[i + 1][1], f) * k);
      }, 8, 7, (p, c, s, t) => {
        const shade = s < 0.2 ? 0.3 : s < 0.45 ? 0.9 : s < 0.7 ? 1 : s < 0.95 ? 0 : 0.3, n = vn(s * 9 + x * 31, t * 6 + 2.7);
        c.copy(a).lerp(b, shade * 0.85).lerp(lit, sm(n, 0.45, 0.8) * (1 - shade) * 0.85).lerp(b, sm(1 - n, 0.6, 0.9) * 0.5);
        c.lerp(dark, 0.6 * sm(t, 0.74, 0.9)).lerp(dark, 0.35 * (1 - sm(t, 0.0, 0.3)));
      });
    };
    const house = shape.merge([front, gable, wingR, wingL, endR, back, roofF, roofB2, wingT, wingD, stack(CH[0], 0.044, 0.105, brick, brickD, brickL), stack(CH[1], 0.036, 0.09, chalk, chalkD, chalk)]);
    this.Mh = new THREE.Matrix4().makeBasis(new THREE.Vector3(CA, 0, -SN), this.UP, new THREE.Vector3(SN, 0, CA)).setPosition(G[0], HY, G[1]);
    this.iHouse = rig.add(rig.geo(house));
    this.mHouse = new THREE.Matrix4().multiplyMatrices(this.M0, this.Mh);

    // ---- a bird's body, under its paint: dark, and smaller than the touches laid over it
    const body = (a, b) => tint(shape.move(shape.ball(1, 0xffffff, 2), 0, 0, 0, 0, 0, 0, 0.15, 0.17, 0.26), (p, c) => c.copy(a).lerp(b, sm(p.y, -0.1, 0.2)));
    this.gBody = [rig.geo(body(col('#0d0a07', 0.1), col('#2a1d13'))), rig.geo(body(col('#5d5a50'), col('#a9a595', 0.15)))];
    this.iBody = BIRDS.map(b => rig.add(this.gBody[b.pale ? 1 : 0]));
    this.parts = [this.iHouse, ...this.iBody];
  },

  // ---------------------------------------------------------------- his touches: trees, garden, the house's lights, smoke
  buildCards(L, col) {
    const R = () => L.rand(), RR = (a, b) => a + (b - a) * R();
    const geo = new THREE.PlaneGeometry(1, 1), at = this.at = {};
    for (const [name, k] of [['aPos', 3], ['aDir', 3], ['aSize', 2], ['aKind', 4], ['aCol', 3]]) { at[name] = new THREE.InstancedBufferAttribute(new Float32Array(NC * k), k).setUsage(THREE.DynamicDrawUsage); geo.setAttribute(name, at[name]); }
    const cu = this.cu = { tAtlas: { value: markAtlas(R) }, uTint: this.ru.uTint };
    const m = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide });
    m.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, cu);
      // each mark faces you and lies along its own direction as you see it (end on, it is no longer than it is wide)
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec3 aPos; attribute vec3 aDir; attribute vec2 aSize; attribute vec4 aKind; attribute vec3 aCol; varying vec4 vK; varying vec3 vCol; varying vec2 vQ;')
        .replace('#include <project_vertex>', `vec4 mvPosition = viewMatrix * vec4(aPos, 1.0);
  vQ = position.xy + 0.5; vK = aKind; vCol = aCol;
  { vec3 dv = (viewMatrix * vec4(aDir, 0.0)).xyz; float al = length(dv.xy), sinT = clamp(al / max(length(dv), 1.0e-4), 0.0, 1.0);
    vec2 ax = al > 1.0e-4 ? dv.xy / al : vec2(0.0, 1.0);
    float len = mix(min(aSize.x, aSize.y), aSize.x, sinT);
    mvPosition.xy += ax * position.y * len + vec2(ax.y, -ax.x) * position.x * aSize.y; }
  gl_Position = projectionMatrix * mvPosition;`);
      // loaded where the brush was full and thin where it dragged; the evening's colour over all of it but the lamp
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform sampler2D tAtlas; uniform vec3 uTint; varying vec4 vK; varying vec3 vCol; varying vec2 vQ;')
        .replace('#include <map_fragment>', `{
  float cx = mod(vK.x, 8.0), cyy = floor(vK.x / 8.0 + 0.01); vec2 q = clamp(vQ, 0.1, 0.9);
  vec4 tx = texture2D(tAtlas, vec2((cx + q.x) * 0.125, (cyy + 1.0 - q.y) * 0.5));
  float a = smoothstep(vK.y, vK.y + 0.56, tx.a) * vK.z;
  if (a < 0.012) discard;
  diffuseColor = vec4(vCol * (0.42 + 1.16 * tx.r) * mix(uTint, vec3(1.0), vK.w), a);
}`);
    };
    m.customProgramCacheKey = () => 'bazot-marks';
    const mesh = this.cards = new THREE.InstancedMesh(geo, m, NC); mesh.count = 0; mesh.renderOrder = 6; this.n = 0;
    L.add(mesh);

    // every fixed mark: where it is (u, h, o), the way it lies, how long and wide, which mark, its colour, how late
    // it comes (darks first), how much it keeps its own light as the evening goes, how much it stirs
    const S = this.fixed = [];
    const add = (u, h, o, dx, dy, dz, len, wid, slot, c, { r = 0.3, own = 0, k = 1, al = 1, sway = 0 } = {}) => S.push({ u, h, o, dx, dy, dz, len, wid, slot, c, r, own, k, al, sway, ph: R() * TAU });
    const late = c => clamp01(0.1 + 2.6 * (0.3 * c.r + 0.59 * c.g + 0.11 * c.b));
    // his greens: from the black of the woods through a cold dark green and olive to the ochre-gold of the lit tree
    const leaf = [col('#080a06', 0.1), col('#141a0f'), col('#27301a'), col('#4a4720'), col('#766a2f', 0.15)], tone = (t, into) => { const x = clamp01(t) * 3.999, i = Math.floor(x); return into.copy(leaf[i]).lerp(leaf[i + 1], x - i); };
    const cCold = col('#1c3526'), cBlueD = col('#101714', 0.1), T = () => new THREE.Color();
    // ---- the woods' edge against the sky: feathered clusters all along their top, standing a little off the wall,
    // so the outline is his (soft, broken, a spray standing clear here and there)
    for (let u = -1.38; u < 0.74; u += RR(0.07, 0.12)) {
      const top = woodTop(u), lit = Math.exp(-Math.pow((u - 0.42) / 0.25, 2)) + 0.8 * Math.exp(-Math.pow((u + 1.3) / 0.07, 2)), far = 1 - sm(u, -0.8, -0.4), s = RR(0.075, 0.115) * (1 - 0.3 * far);
      const c = tone(RR(0.04, 0.26) + 0.45 * lit * RR(0.5, 1), T()); if (far > 0.5 && lit < 0.2) c.lerp(cBlueD, 0.6);
      add(u, Math.min(0.9, top + RR(-0.04, 0.02)), 0.004 + 0.01 * R(), RR(-0.5, 0.3), 1, 0, s * 1.2, s, LEAF + Math.floor(R() * 3), c, { r: late(c) + 0.1 * R(), k: RR(0.85, 1.05), sway: 1, own: 0.1 * lit, al: 0.85 });
    }
    // the lit tree to the right of the chimneys, and the tall one's top: olive and old gold, loaded
    for (let i = 0; i < 9; i++) { const a = R() * TAU, rr = Math.sqrt(R()), c = tone(0.62 + RR(-0.12, 0.3) - 0.16 * Math.cos(a) * rr + 0.14 * Math.sin(a) * rr, T()); add(0.42 + Math.cos(a) * rr * 0.24, 0.6 + Math.sin(a) * rr * 0.12, 0.012 + 0.012 * R(), RR(-0.5, 0.3), 1, 0, RR(0.15, 0.2), RR(0.13, 0.17), LEAF + i % 3, c, { r: late(c), k: RR(0.9, 1.1), sway: 1, own: 0.14 }); }
    for (let i = 0; i < 3; i++) { const c = tone(RR(0.55, 0.85), T()); add(-1.3 + RR(-0.05, 0.05), 0.56 + 0.055 * i, 0.014, RR(-0.4, 0.3), 1, 0, 0.15, 0.12, LEAF + i, c, { r: late(c), sway: 1, own: 0.14 }); }
    // the nearer trees, bulking out of the woods behind the house, darker than anything
    for (const [u, h, s] of [[-0.62, 0.38, 0.2], [-0.36, 0.46, 0.24], [-0.1, 0.5, 0.25], [0.16, 0.46, 0.24], [0.5, 0.34, 0.2]]) {
      add(u, h, 0.03, RR(-0.3, 0.3), 1, 0, s * 1.5, s * 1.5, MASS, tone(RR(0.0, 0.06), T()), { r: 0.06, k: 0.9 });
      for (let i = 0; i < 2; i++) add(u + RR(-0.6, 0.6) * s, h + RR(0.1, 0.6) * s, 0.04, RR(-0.5, 0.3), 1, 0, s * 0.85, s * 0.75, LEAF + i, tone(RR(0.08, 0.3), T()), { r: 0.2 + 0.2 * R(), sway: 1 });
    }
    // two round orchard trees out in the field, left of the house
    for (const [u, o, s] of [[-1.2, 0.4, 0.12], [-1.0, 0.52, 0.1]]) {
      add(u, 0.04, o, 0.06, 1, 0, 0.09, 0.02, FEATH, leaf[0], { r: 0.1 });
      add(u, s * 0.95, o, 0.2, 1, 0, s * 1.7, s * 1.6, MASS, tone(0.08, T()), { r: 0.12, k: 0.9 });
      for (let i = 0; i < 3; i++) add(u + RR(-0.5, 0.5) * s, s * RR(0.8, 1.3), o + 0.012, RR(-0.5, 0.3), 1, 0, s * 1.3, s * 1.1, LEAF + i, tone(RR(0.2, 0.42), T()), { r: 0.3 + 0.2 * R(), sway: 1 });
    }
    // ---- the house in his paint (in the house's own frame, turned into the scene's): the broken lines of lighter
    // thatch that are the roof's edges, the thatch hanging ragged at its eaves, the dabs on the chimneys. (A mark
    // faces you, so one laid against a wall or a slope is cut where it meets it: these all stand clear, at edges.)
    const hp = (x, y, z, dx, dy, dz, len, wid, slot, c, o) => add(hu(x, z), y + HY, ho(x, z), dx * CA + dz * SN, dy, -dx * SN + dz * CA, len, wid, slot, c, o);
    const cRoof = col('#0f0d09', 0.1), cRoofB = col('#2c2117'), cTh = col('#5a4930'), cThL = col('#77633f', 0.15), cThD = col('#2b2217'), cBrick = col('#b0563a', 0.1), cBrickL = col('#cf8562', 0.1), cBrickD = col('#5a2a1c'), cChalk = col('#b4b2a4', 0.12), cChalkD = col('#5e5d55');
    // the roof's own edges, which are what make it a roof against the woods: a broken line of his lighter thatch
    // along the ridge and along the eave (these keep a little of their own light as the evening goes), and the
    // thatch hanging ragged over the wall
    for (let i = 0; i < 8; i++) { const x = lerp(RX + 0.14, LEN, (i + RR(0.25, 0.75)) / 8); hp(x, RH - sag(x) + 0.01, -DEP / 2 + 0.016, i % 2 ? 1 : -1, RR(-0.05, 0.05), 0, RR(0.16, 0.24), RR(0.026, 0.036), DRAG, i % 3 === 1 ? cThL : cTh, { r: 0.5 + 0.2 * R(), own: 0.3, k: lerp(0.86, 0.6, x / LEN), al: 0.85 }); }
    for (let i = 0; i < 8; i++) { const x = lerp(WW + 0.06, LEN, (i + RR(0.25, 0.75)) / 8); hp(x, eaveY(x) + 0.007, eaveZ(x) + 0.004, i % 2 ? 1 : -1, RR(-0.04, 0.04), 0, RR(0.15, 0.22), RR(0.024, 0.032), DRAG, i % 3 === 2 ? cThL : cTh, { r: 0.45 + 0.2 * R(), own: 0.26, k: lerp(0.8, 0.52, x / LEN), al: 0.85 }); }
    for (let i = 0; i < 9; i++) { const x = lerp(WW + 0.03, LEN + 0.02, (i + RR(0.2, 0.8)) / 9); hp(x, eaveY(x) - 0.012, eaveZ(x) + 0.006, RR(-0.4, 0.4), -1, 0, RR(0.03, 0.05), RR(0.04, 0.055), SOFT, i % 3 ? cThD : cRoofB, { r: 0.2 + 0.2 * R(), al: 0.85, k: lerp(1, 0.7, x / LEN) }); }
    // the thatch: drags down its slope, the lights on its upper part; and ragged at its eave
    for (let i = 0; i < 7; i++) { const t = RR(0.12, 0.82), z = lerp(PJ - 0.01, -DEP + 0.03, (i + RR(0.2, 0.8)) / 7); hp(lerp(RX, -CS, t) - 0.008, lerp(RH, LE, t) + 0.01, z, -(RX + CS), -(RH - LE), 0, RR(0.14, 0.2), RR(0.06, 0.08), i % 2 ? SOFT : DRAG, i % 3 === 1 ? cThL : cTh, { r: 0.55 + 0.2 * R(), own: 0.05, k: lerp(1.0, 0.82, t), al: 0.45 }); }
    for (let i = 0; i < 6; i++) { const z = lerp(PJ + 0.01, -DEP, (i + RR(0.2, 0.8)) / 6); hp(-CS - 0.018, LE - 0.004, z, -0.5, -1, 0, RR(0.03, 0.045), 0.05, SOFT, i % 2 ? cThD : cTh, { r: 0.4, al: 0.8 }); }
    hp(RX, RH + 0.004, lerp(PJ, -DEP / 2, 0.4), 0, 0, -1, 0.26, 0.05, DRAG, cThD, { r: 0.3, k: 0.9 });                                                            // its ridge
    // the chimneys in his dabs: on the red one a light, loaded touch on the side the sky is on, the brick under it,
    // its dark side and the soot at its top; on the pale one two touches of chalk
    { const x = CH[0], y = RH - sag(x), z = -DEP / 2 + 0.024;
      hp(x + 0.004, y + 0.03, z, 0.1, 1, 0, 0.085, 0.04, SOFT, cBrick, { r: 0.85, own: 0.3, k: 0.95 });
      hp(x + 0.014, y + 0.036, z, 0, 1, 0, 0.07, 0.02, SOFT, cBrickD, { r: 0.6, own: 0.1, al: 0.8 });
      hp(x - 0.01, y + 0.046, z + 0.002, -0.1, 1, 0, 0.055, 0.02, SOFT, cBrickL, { r: 0.95, own: 0.4, k: 1.05 });
      hp(x, y + 0.08, z, 1, 0.05, 0, 0.06, 0.018, SOFT, cRoof, { r: 0.4, al: 0.85 }); }
    { const x = CH[1], y = RH - sag(x), z = -DEP / 2 + 0.02;
      hp(x - 0.004, y + 0.035, z, 0.15, 1, 0, 0.07, 0.03, SOFT, cChalk, { r: 0.9, own: 0.32, k: 0.95 });
      hp(x + 0.01, y + 0.02, z, -0.2, 1, 0, 0.05, 0.02, SOFT, cChalkD, { r: 0.6, own: 0.1, al: 0.8 });
      hp(x, y + 0.068, z, 1, -0.05, 0, 0.048, 0.016, SOFT, cRoof, { r: 0.4, al: 0.8 }); }
    // ---- the garden in front of the long wall: bushes, each a dark mass standing clear of the wall with a few
    // feathered lights over it and a low spray in front (so the wall's foot is lost behind them, as his is); a few
    // orange flowers by the gable, the red ones at the far end
    const cOr = col('#b5642c', 0.1), cRed = col('#c03d28', 0.08);
    for (const [x, z, sz] of [[0.445, 0.075, 0.07], [0.69, 0.11, 0.088], [0.79, 0.065, 0.066], [1.0, 0.12, 0.105], [1.12, 0.075, 0.09], [1.25, 0.135, 0.115]]) {
      hp(x, sz * 0.52, z, RR(-0.2, 0.2), 1, 0, sz * 1.3, sz * 1.55, MASS, tone(RR(0.03, 0.12), T()), { r: 0.14 + 0.1 * R(), k: 0.95 });
      for (let i = 0; i < 3; i++) hp(x + RR(-0.55, 0.45) * sz, sz * RR(0.62, 1.1), z + 0.018 + 0.014 * i, RR(-0.6, 0.2), 1, 0, sz * RR(0.85, 1.05), sz * RR(0.8, 1.0), LEAF + (i + Math.floor(x * 9)) % 3, tone(RR(0.3, 0.58), T()), { r: 0.3 + 0.2 * R(), sway: 1, k: 0.95 });
      hp(x + RR(-0.7, 0.7) * sz, sz * 0.3, z + 0.06, RR(-0.5, 0.5), 1, 0, sz * 0.7, sz * 0.95, LEAF + Math.floor(R() * 3), tone(RR(0.12, 0.26), T()), { r: 0.25 + 0.2 * R(), sway: 1, k: 0.9 });
    }
    hp(WW * 0.5, 0.058, PJ + 0.05, 1, 0.1, 0, 0.27, 0.15, MASS, tone(0.14, T()), { r: 0.15, al: 0.92 }); hp(WW * 0.34, 0.095, PJ + 0.065, -0.3, 1, 0, 0.13, 0.13, LEAF, tone(0.32, T()), { r: 0.3, sway: 1 }); hp(WW * 0.62, 0.085, PJ + 0.075, 0.2, 1, 0, 0.12, 0.12, LEAF + 2, tone(0.26, T()), { r: 0.3, sway: 1 }); hp(WW * 0.88, 0.07, PJ + 0.06, 0.3, 1, 0, 0.11, 0.12, LEAF + 1, tone(0.2, T()), { r: 0.3, sway: 1 }); hp(WW * 0.14, 0.035, PJ + 0.09, 0.4, 1, 0, 0.07, 0.09, LEAF + 1, tone(0.18, T()), { r: 0.3, sway: 1 });
    hp(WW + 0.06, 0.07, 0.1, 0, 1, 0, 0.04, 0.045, DOTS, cOr, { r: 0.9, own: 0.15, k: 0.7, al: 0.85 }); hp(WW + 0.22, 0.06, 0.12, 0, 1, 0, 0.035, 0.04, DOTS, cOr, { r: 0.92, own: 0.15, k: 0.7, al: 0.85 });
    hp(LEN - 0.1, 0.09, 0.1, 0.2, 1, 0, 0.2, 0.26, MASS, tone(0.16, T()), { r: 0.15, k: 0.9 });
    for (let i = 0; i < 3; i++) hp(LEN - 0.19 + 0.08 * i, 0.11 + RR(-0.02, 0.05), 0.12 + 0.01 * i, RR(-0.5, 0.3), 1, 0, 0.15, 0.14, LEAF + i, tone(RR(0.15, 0.4), T()), { r: 0.35, sway: 1 });
    for (let i = 0; i < 3; i++) hp(LEN - 0.19 + 0.08 * i + RR(-0.02, 0.02), 0.12 + RR(-0.03, 0.05), 0.15, RR(-0.5, 0.5), 1, 0, 0.05, 0.055, DOTS, cRed, { r: 0.95, own: 0.15, k: 0.7, al: 0.85 });
    // ---- grass in tufts out in the field, and his small yellow flowers in front
    const cYel = col('#c9b545', 0.1);
    for (const [u, o, f] of [[-1.3, 0.7, 0], [-0.45, 1.22, 0], [0.0, 1.02, 0], [0.38, 0.78, 0], [-0.55, 1.42, 1], [-0.2, 1.34, 1], [0.14, 1.14, 0], [-0.95, 1.46, 1]]) {
      const s = RR(0.045, 0.065), c = tone(RR(0.25, 0.45), T()).lerp(cCold, 0.6);
      add(u, s * 0.5, o, RR(-0.25, 0.25), 1, 0, s * 1.1, s, TUFT, c, { r: 0.4 + 0.2 * R(), sway: 1 });
      if (f) add(u + RR(-0.01, 0.01), s * 0.85, o + 0.008, 0, 1, 0, 0.026, 0.03, DOTS, cYel, { r: 0.95, own: 0.12, k: 0.7, al: 0.9 });
    }
    for (const q of S) if (q.o < 0.1) q.r += 0.45;
    S.sort((a, b) => a.o - b.o);
    // ---- the smoke: long thin wisps, one after another up the same thread
    this.cSmoke = col('#7a80a6', 0.12); this.cSmokeL = col('#a3a7c2', 0.1);
    this.wisps = Array.from({ length: 9 }, (_, i) => ({ ph: i / 9, r: R(), w: RR(0.8, 1.2), s: R() * TAU }));
    this.cHalo = new THREE.Color('#ffae5c');
  },

  // ---------------------------------------------------------------- the birds: each a few touches on a moving frame
  buildBirds(L, col) {
    const R = () => L.rand(), V = (x, y) => new THREE.Vector3(x, 0, y);
    const C = { dk: col('#120e0a', 0.1), dk2: col('#33241a'), rus: col('#5f3a22'), or: col('#9a5a26'), wh: col('#cfcab9', 0.12), wh2: col('#8f8c80'), leg: col('#6e5a34'), red: col('#b3382a', 0.06), beak: col('#b99a52', 0.1), hack: col('#bfae80', 0.1), hack2: col('#8a733f'), sad: col('#7c3f20'), sad2: col('#4a2a18'), tail: col('#0c110d', 0.08), sheen: col('#23382d') };
    this.BC = C;
    this.birds = BIRDS.map((b, i) => {
      const pts = [...b.pts, TURN, IN, INSIDE].map(p => V(p[0], p[1])), curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
      curve.arcLengthDivisions = 300; curve.updateArcLengths();
      // how far along (0..1 by length) the eave is
      const v = new THREE.Vector3(); let qe = 0.8, bd = 9;
      for (let k = 0; k <= 400; k++) { curve.getPointAt(k / 400, v); const d = Math.hypot(v.x - IN[0], v.z - IN[1]); if (d < bd) { bd = d; qe = k / 400; } }
      // its steps: how many it has taken by each point of its road. A step is a fixed part of the bird's own size
      // where it is, so a foot that is down stays where it was put while the body goes over it
      const stride = b.kind ? 0.4 : 0.28, tab = new Float32Array(201); let acc = 0, px = 0, pz = 0;
      for (let k = 0; k <= 200; k++) { curve.getPointAt(k / 200, v); if (k) acc += Math.hypot(v.x - px, v.z - pz) / (stride * b.S * far(v.z)); tab[k] = acc; px = v.x; pz = v.z; }
      return { ...b, i, tab, A: stride / 2, curve, len: curve.getLength(), qe, kind: b.kind || 0, u: 0, o: 0, sc: 1, th: 0, vis: 0, turn: b.turn || 0, r1: R(), r2: R(), p: new THREE.Vector3(), d: new THREE.Vector3() };
    });
    this.order = this.birds.slice();
  },
  // how far along bird b is at time t (0 at its start, 1 at the eave, 1.14 inside), its corners rounded
  along(b, t) {
    const lin = x => { const K = b.keys; if (x <= K[0][0]) return K[0][1]; for (let i = 1; i < K.length; i++) if (x < K[i][0]) return lerp(K[i - 1][1], K[i][1], (x - K[i - 1][0]) / (K[i][0] - K[i - 1][0])); return K[K.length - 1][1]; };
    return (lin(t - 0.16) + 2 * lin(t) + lin(t + 0.16)) / 4;
  },

  // ---------------------------------------------------------------- sound: the yard at evening
  makeScore(L, calm) {
    const s = score(L), v = calm ? 0.6 : 1, att = calm ? 0.03 : 0.008;
    s.hit(0.1, { d: 1.7, vol: 0.007 * v, lp: 800, hp: 180, attack: 0.7 });                                      // the evening coming out over the floor
    // a hen's low word as she goes in under the eave
    BIRDS.forEach((b, i) => {
      if (b.kind) return; const K = b.keys, t = K[K.length - 2][0] + 0.12, f = [470, 520, 410, 440, 495][i % 5];
      s.note(t, f, 0.075, { type: 'triangle', vol: 0.011 * v, to: f * 0.72, attack: att }); s.note(t + 0.13, f * 0.94, 0.09, { type: 'triangle', vol: 0.009 * v, to: f * 0.66, attack: att });
    });
    // the cock sees he is alone: three notes, the last one a question
    [[0, 372, 0.8], [0.17, 372, 0.8], [0.42, 400, 1.12]].forEach(([dt, f, to]) => s.note(T_ALONE + 0.25 + dt, f, 0.085, { type: 'triangle', vol: 0.012 * v, to: f * to, attack: att }));
    // the lamp: one soft low note, and the fifth over it
    s.note(T_LAMP, 196, 2.8, { type: 'sine', vol: 0.014 * v, attack: calm ? 1.2 : 0.5 }); s.note(T_LAMP + 0.12, 293.7, 2.4, { type: 'sine', vol: 0.006 * v, attack: calm ? 1.3 : 0.6 });
    // his feet: two slow steps, then the run
    for (const t of [T_STRUT + 0.12, T_STRUT + 0.36]) s.hit(t, { d: 0.03, vol: 0.005 * v, hp: 900, lp: 3600, attack: att });
    for (let t = T_RUN + 0.08; t < T_DUCK + 0.2; t += 0.092) s.hit(t, { d: 0.022, vol: 0.0045 * v, hp: 1200, lp: 4600, attack: att * 0.6 });
    // and a hen settling, inside
    [[0, 330], [0.2, 318], [0.42, 300], [0.7, 286]].forEach(([dt, f]) => s.note(T_SETTLE + dt, f, 0.16, { type: 'sine', vol: 0.007 * v, to: f * 0.9, attack: 0.04 }));
    return s.done();
  },

  hideAll() {
    this.cards.count = 0; this.cards.visible = false; this.ground.material.visible = false;
    for (const i of this.parts) this.rig.show(i, false);
    this.rig.mesh.visible = false;
  },
  start(L, resumed) { if (!resumed) this.hideAll(); this.band.from(L.t); },
  back(L) { this.bT = L.t; this.g0 = this.grow; this.d0 = this.dusk; this.l0 = this.lamp; },
  end() { this.hideAll(); },
  reset() { this.hideAll(); this.told = this.told2 = false; },

  // a mark at (x, y, z) in the scene's frame, lying along (dx, dy, dz): len long, wid wide; cut is how much of its
  // paint has not come yet; own is how much of its own light it keeps as the evening goes
  put(x, y, z, dx, dy, dz, len, wid, slot, cut, al, c, k = 1, own = 0) {
    if (al <= 0.004 || cut >= 0.99 || this.n >= NC) return;
    const n = this.n++, a = n * 3, T = this.T3, N = this.N3, O = this.O, at = this.at;
    const P = at.aPos.array, D = at.aDir.array, Z = at.aSize.array, K = at.aKind.array, C = at.aCol.array;
    P[a] = O.x + T.x * x + N.x * z; P[a + 1] = O.y + y; P[a + 2] = O.z + T.z * x + N.z * z;
    D[a] = T.x * dx + N.x * dz; D[a + 1] = dy; D[a + 2] = T.z * dx + N.z * dz;
    Z[n * 2] = len; Z[n * 2 + 1] = wid; K[n * 4] = slot; K[n * 4 + 1] = cut; K[n * 4 + 2] = al; K[n * 4 + 3] = own; C[a] = c.r * k; C[a + 1] = c.g * k; C[a + 2] = c.b * k;
  },
  // how much of a mark at (u, h, o) has come (r: its own lateness)
  came(u, h, o, r) { return sm(this.grow * 1.6 - 0.25 - reach(u, o) - 0.08 * h - 0.22 * r, 0, 0.24) * (this.shut > 0 ? sm(1 - this.shut * 1.08 - 0.5 * Math.hypot(u - LAMP[0], h - LAMP[1], o - LAMP[2]), 0, 0.14) : 1); },

  update(L, dt) {
    const calm = L.calm; if (calm !== this.calm) { this.calm = calm; this.band = this.bands[calm ? 1 : 0]; this.band.from(L.t); }
    const ret = L.phase === 'return', Rr = ret ? L.ret : 0, t = ret ? this.bT + L.r : L.t;
    // the evening comes out from under the picture; when the look ends, night closes in from the field's edges
    const grow = this.grow = ret ? this.g0 : 0.14 + 0.86 * Math.pow(ramp(t, 0.05, 2.0), 0.9), shut = this.shut = ret ? sm(Rr, 0.04, 0.86) : 0;
    const dusk = this.dusk = ret ? lerp(this.d0, 1, sm(Rr, 0, 0.5)) : sm(t, T_DUSK0, T_DUSK1) * 0.92;
    const lampUp = calm ? 2.7 : 0.9;
    const lamp = this.lamp = ret ? this.l0 * (1 - sm(Rr, 0.84, 1)) : sm(t, T_LAMP, T_LAMP + lampUp) * (calm ? 1 : 0.94 + 0.06 * Math.sin(t * 2.3) * Math.sin(t * 0.7));
    const gu = this.gu, ru = this.ru, rig = this.rig;
    this.ground.material.visible = true; rig.mesh.visible = true; this.cards.visible = true;
    gu.uGrow.value = grow; gu.uShut.value = shut; gu.uDusk.value = dusk; gu.uLamp.value = lamp * (ret ? 1 - sm(Rr, 0.3, 0.75) : 1);
    ru.uGrow.value = grow; ru.uLamp.value = lamp; ru.uTint.value.setRGB(lerp(1, 0.3, dusk), lerp(1, 0.4, dusk), lerp(1, 0.58, dusk));
    for (const i of this.parts) rig.show(i, true);
    rig.mat(this.iHouse, this.mHouse);
    this.n = 0;

    // ---- where each bird is
    const birds = this.birds, sway = calm ? 0.5 : 1, UB = gu.uBird.value;
    for (const b of birds) this.pose(b, t, calm);
    this.order.sort((a, b) => a.o - b.o);

    // ---- the marks, from the wall outwards, each bird in its place among them
    let bi = 0; const ord = this.order;
    for (const q of this.fixed) {
      while (bi < NB && ord[bi].o < q.o) this.bird(L, ord[bi++], t, calm);
      const a = this.came(q.u, q.h, q.o, q.r); if (a <= 0) continue;
      const sw = q.sway ? 0.012 * sway * Math.sin(t * 0.6 + q.ph) : 0;
      this.put(q.u + sw * q.len * 0.3, q.h, q.o, q.dx + sw, q.dy, q.dz, q.len, q.wid, q.slot, lerp(0.9, 0.08, ease.inOut(a)), q.al, q.c, q.k, q.own);
    }
    while (bi < NB) this.bird(L, ord[bi++], t, calm);
    for (const b of birds) UB[b.i].set(b.u, b.o, 0.05 * b.sc * (b.kind ? 1.3 : 1), 0.5 * b.vis);

    // ---- the smoke: a thread, straight up in the still air, swaying a little where it thins
    const smk = (ret ? 1 - sm(Rr, 0.1, 0.6) : sm(t, T_SMOKE, T_SMOKE + 1.2)) * this.came(SMOKE[0], SMOKE[1], SMOKE[2], 0.6), kc = this.kc;
    if (smk > 0.01) for (const w of this.wisps) {
      const x = (t * 0.115 + w.ph) % 1, h = SMOKE[1] + 0.01 + 0.36 * x, amp = 0.028 * x * x * sway, sx = amp * Math.sin(h * 19 - t * 0.9 + w.s * 0.25) + 0.035 * x * x, sx2 = amp * Math.sin((h + 0.05) * 19 - t * 0.9 + w.s * 0.25) + 0.035 * (x + 0.12) * (x + 0.12);
      const a = smk * hump(x, 0, 1) * (0.5 + 0.35 * (1 - x)), len = 0.1 + 0.07 * x;
      kc.copy(this.cSmoke).lerp(this.cSmokeL, 0.6 * (1 - x) + 0.4 * dusk);
      this.put(SMOKE[0] + sx, h, SMOKE[2], sx2 - sx, 0.05, 0, len, (0.014 + 0.036 * x) * w.w, x < 0.3 ? DRAG : PUFF, 0.12 + 0.5 * x * x, a, kc, 1, 0.55);
    }
    // ---- the lamp's own light, in front of its window
    if (lamp > 0.01) { const x = hu(WX, 0.012), z = ho(WX, 0.012); this.put(x, WY + HY, z, 0, 1, 0, 0.13, 0.13, HALO, 0.02, 0.2 * lamp, this.cHalo, 1, 1); }

    const at = this.at; this.cards.count = this.n; this.cards.visible = this.n > 0;
    for (const key in at) at[key].needsUpdate = true;
    L.voice().place();
    if (!ret && L.phase !== 'after') {
      this.band.play(L.t);
      if (!L.quiet && !this.told && t > 2.3) { this.told = true; L.k.say('Evening. The hens Daubigny put on the track are going home. The cock has not noticed yet.', 5); }
      if (!L.quiet && !this.told2 && t > T_LAMP + 1.1) { this.told2 = true; L.k.say('A lamp is lit. (That is ours: in the picture it is not dark enough yet.)', 4.5); }
    }
  },

  // where bird b is at time t, and how it holds itself
  pose(b, t, calm) {
    const q = this.along(b, t), q1 = this.along(b, t + 0.05), q0 = this.along(b, t - 0.05), c = b.curve, v = this.v;
    const s = q <= 1 ? q * b.qe : b.qe + (q - 1) / 0.14 * (1 - b.qe);
    c.getPointAt(clamp01(s), v); b.u = v.x; b.o = v.z;
    c.getTangentAt(clamp01(Math.max(s, 0.002)), v);
    b.sc = b.S * far(b.o);
    b.speed = (q1 - q0) / 0.1 * b.qe * b.len;                         // metres a second, over the floor
    b.walk = sm(b.speed, 0.015, 0.07); b.run = b.kind ? sm(b.speed, 0.3, 0.46) : 0;
    // standing, it faces its own way; it steps round into its road where it stands, and then sets off
    b.tw = b.turn ? sm(t, b.keys[1][0] - (b.kind ? 0.4 : 0.5), b.keys[1][0] + 0.12) : 1;
    b.th = Math.atan2(v.z, v.x) + b.turn * (1 - b.tw);
    { const g = clamp01(s) * 200, gi = Math.min(199, Math.floor(g)); b.gait = lerp(b.tab[gi], b.tab[gi + 1], g - gi); }      // steps taken
    b.inn = sm(q, 0.985, 1.12);                                      // under the eave, into the dark
    b.duck = sm(q, 0.86, 0.99);
    b.vis = (1 - b.inn) * this.came(b.u, 0.05, b.o, 0.5);
    b.q = q;
  },

  // bird b's touches, and its body under them. Its own frame: x the way it faces, y up, z to its side, in its own
  // size (1: about the height of a hen with her head up).
  bird(L, b, t, calm) {
    const a = b.vis, rig = this.rig, id = this.iBody[b.i], C = this.BC, v = this.v;
    if (a <= 0.01) { rig.show(id, false); return; }
    const S = b.sc, cock = b.kind === 1, fx = Math.cos(b.th), fz = Math.sin(b.th), rx = -fz, rz = fx;
    const cut = lerp(0.9, 0.06, ease.inOut(clamp01(a * 1.4))), al = clamp01(a * 2), kd = 1 - 0.8 * b.inn;
    // ---- what it is doing
    let peck = 0, alert = 0, look = 0, tall = 0;
    if (cock) {
      const busy = 1 - sm(t, T_ALONE - 0.25, T_ALONE);
      peck = busy * Math.pow(hump((t * 0.62 + 0.2) % 1, 0.05, 0.7), 0.7);
      alert = sm(t, T_ALONE - 0.1, T_ALONE + 0.15);
      look = alert * (1 - sm(t, T_LAMP + 0.05, T_TALL)) * Math.sin((t - T_ALONE) * 4.4) + sm(t, T_LAMP + 0.1, T_TALL + 0.1) * (1 - sm(t, T_STRUT + 0.2, T_RUN)) * -0.9;
      tall = sm(t, T_TALL - 0.05, T_TALL + 0.22) * (1 - sm(t, T_STRUT + 0.35, T_RUN + 0.1));
    } else {
      const still = 1 - b.walk, K = b.keys, leave = K.length > 3 && K[1][1] === 0 ? K[1][0] : -9;
      peck = still * Math.pow(hump((t * (0.55 + 0.25 * b.r1) + b.ph) % 1, 0.05, 0.62), 0.7) * (leave > 0 ? 1 - sm(t, leave - 0.75, leave - 0.5) : 1);
      alert = leave > 0 ? sm(t, leave - 0.6, leave - 0.4) * (1 - sm(t, leave + 0.3, leave + 0.8)) : 0;
    }
    const run = b.run, step = b.gait * Math.PI, bounce = (calm ? 0.5 : 1) * run * Math.abs(Math.sin(step)) * 0.08;
    const pitch = (cock ? 0.36 : 0.08) + 0.2 * tall - 0.42 * run - 0.26 * peck - 0.22 * b.duck;      // the body: breast up
    const cp = Math.cos(pitch), sp = Math.sin(pitch), by = (cock ? 0.44 : 0.3) + bounce + 0.04 * tall - (cock ? 0.05 : 0.03) * b.duck;      // (a hen's body sits low over her legs)
    const P = (x, y, z, into) => into.set(b.u + (fx * x + rx * z) * S, y * S, b.o + (fz * x + rz * z) * S);
    const bp = (x, y) => [x * cp - y * sp, by + x * sp + y * cp];      // a point of the body, tipped with it
    const mark = (x, y, z, dx, dy, dz, len, wid, slot, c, k = 1, own = 0) => { P(x, y, z, v); this.put(v.x, v.y, v.z, fx * dx + rx * dz, dy, fz * dx + rz * dz, len * S, wid * S, slot, cut, al, c, k * kd, own); };
    // ---- the body under the paint
    rig.show(id, true);
    { P(0, by, 0, v); const wx = this.O.x + this.T3.x * v.x + this.N3.x * v.z, wz = this.O.z + this.T3.z * v.x + this.N3.z * v.z; rig.put(id, wx, this.O.y + v.y, wz, L.yawOf(fx, fz), -pitch, 0, S * (cock ? 0.9 : 1.1) * sm(a, 0.25, 0.8)); }
    const dk = b.pale ? C.wh2 : C.dk, md = b.pale ? C.wh : C.dk2, hi = b.pale ? C.wh : C.rus;
    // ---- the tail: a hen's, a short fan held up; the cock's, dark plumes that go up and arch over
    const [tx, ty] = bp(-0.27, 0.09);
    if (cock) {
      const str = 0.8 * run;
      for (let i = 0; i < 3; i++) {
        let an = 1.62 + 0.2 * i + 0.5 * pitch - str + 0.04 * Math.sin(t * 1.7 + i), x = tx, y = ty; const c = i === 1 ? C.sheen : C.tail, z = (i - 1) * 0.03;
        for (const [l, w, bend, slot] of [[0.46 - 0.04 * i, 0.3, 0.62, FEATH], [0.38, 0.25, 0.7, DRAG], [0.3, 0.2, 0, DRAG]]) {
          mark(x + Math.cos(an) * l * 0.36, y + Math.sin(an) * l * 0.36, z, Math.cos(an), Math.sin(an), 0, l, w, slot, c, 1);
          x += Math.cos(an) * l * 0.56; y += Math.sin(an) * l * 0.56; an += bend * (1 - 0.5 * str);
        }
      }
    } else for (let i = 0; i < 3; i++) { const an = 1.86 + 0.3 * i + 0.6 * pitch; mark(tx + Math.cos(an) * 0.16, ty + Math.sin(an) * 0.16, (i - 1) * 0.045, Math.cos(an), Math.sin(an), 0, 0.42 - 0.04 * i, 0.3, FEATH, i === 1 ? md : dk, 1); }
    // ---- the legs: under the body. A foot that is down stays where it is on the ground while the body passes over
    // it (it goes back, in the bird's frame, exactly as fast as the bird goes forward); then it is lifted and swung
    // through to the front. Standing, both are down wherever they were.
    for (let i = 0; i < 2; i++) {
      const sd = i ? 1 : -1, f = (b.gait * 0.5 + i * 0.5 + 0.25) % 1, A = b.A, hy = by - (cock ? 0.12 : 0.1); let x, lift = 0;
      if (f < 0.5) x = A * (1 - 4 * f); else { const w = (f - 0.5) * 2; x = A * (2 * ease.inOut(w) - 1); lift = b.walk * Math.sin(Math.PI * w) * (cock ? 0.07 + 0.08 * run + 0.1 * tall : 0.05); }
      if (x < 0 && b.walk < 1) { lift += 0.04 * Math.sin(Math.PI * b.walk); x *= lerp(0.25, 1, b.walk); }      // (stopping, it brings up the foot left behind)
      // turning where it stands, it steps round in four: each foot in turn is lifted and put down further round, and
      // a foot that is down keeps its place on the ground (it is held at the heading it was put down at)
      let zf = sd * 0.07;
      if (b.tw > 0 && b.tw < 1) {
        const seg = Math.min(3, Math.floor(b.tw * 4)), w = b.tw * 4 - seg, e = ease.inOut(w), x0 = x;
        const st = i ? (seg === 0 ? 0 : seg === 1 ? 0.625 * e : seg === 2 ? 0.625 : 0.625 + 0.375 * e) : (seg === 0 ? 0.375 * e : seg === 1 ? 0.375 : seg === 2 ? 0.375 + 0.625 * e : 1);
        const d = b.turn * (b.tw - st), cd = Math.cos(d), sn = Math.sin(d);
        if ((seg & 1) === i) lift += 0.05 * Math.sin(Math.PI * w);
        x = x0 * cd - zf * sn; zf = x0 * sn + zf * cd;
      }
      const dz = zf - sd * 0.07, l = Math.hypot(x, hy - lift, dz);
      mark(x / 2, (hy + lift) / 2, (zf + sd * 0.07) / 2, x / l, (lift - hy) / l, dz / l, l + 0.06, cock ? 0.11 : 0.085, FEATH, C.leg, cock ? 0.9 : 0.66);
    }
    // ---- the body: the back, the breast, the saddle, the wing laid over them
    { const [x, y] = bp(-0.02, 0.0); mark(x, y, 0, cp, sp, 0, cock ? 0.92 : 1.0, cock ? 0.7 : 0.8, MASS, dk, 1); }
    { const [x, y] = bp(0.19, -0.03); mark(x, y, 0, Math.cos(pitch + 1.15), Math.sin(pitch + 1.15), 0, 0.5, 0.42, SOFT, cock ? C.tail : md, 1); }
    if (cock) { const [x, y] = bp(-0.15, 0.13); mark(x, y, 0, -cp, -sp + 0.2, 0, 0.4, 0.32, SOFT, C.sad, 1, 0.06); }
    else { const [x, y] = bp(-0.01, -0.14), [x2, y2] = bp(-0.17, 0.11); mark(x, y, 0, cp, sp, 0, 0.5, 0.26, SOFT, dk, 1); mark(x2, y2, 0, -cp, -sp + 0.15, 0, 0.36, 0.3, SOFT, md, 0.95); }      // a hen: the fluff over the tops of her legs, and her rump
    { const open = cock ? run * (calm ? 0.25 : 1) * (0.6 + 0.4 * Math.sin(step * 2)) : 0, [x, y] = bp(-0.03, 0.05 + 0.1 * open), wa = pitch - 0.2 + 0.5 * open; for (const sd of open > 0.1 ? [-1, 1] : [1]) mark(x, y, sd * (0.1 + 0.2 * open), -Math.cos(wa), -Math.sin(wa), sd * open * 0.9, 0.52, 0.34, FEATH, cock ? C.sad2 : hi, 1); }
    // ---- the neck and the head: up to look, down to peck, out in front to run
    const [nx, ny] = bp(0.2, 0.1), up = 1 - peck;
    const hX = nx + lerp(0.24, cock ? 0.1 : 0.13, up) + 0.24 * run + 0.1 * b.duck - 0.04 * tall + b.walk * (1 - run) * 0.05 * Math.sin(step * 2);
    const hY = Math.max(0.07, lerp(0.08, ny + (cock ? 0.36 : 0.3) + 0.07 * alert + 0.1 * tall, up) * (1 - 0.42 * run * up) - 0.3 * b.duck * up), hZ = 0.07 * look;
    { const dx = hX - nx, dy = hY - ny, l = Math.hypot(dx, dy) || 1; mark(nx + dx * 0.36, ny + dy * 0.36, hZ * 0.5, dx / l, dy / l, 0, l + 0.3, cock ? 0.52 : 0.36, FEATH, cock ? C.hack2 : md, 1); if (cock) mark(nx + dx * 0.62 - 0.035, ny + dy * 0.62, hZ * 0.6, dx / l, dy / l, 0, l * 0.62 + 0.08, 0.26, FEATH, C.hack, 1, 0.06); else if (!b.pale) mark(nx + dx * 0.6 - 0.02, ny + dy * 0.6, hZ * 0.6, dx / l, dy / l, 0, l * 0.5 + 0.08, 0.2, FEATH, C.or, 0.85, 0.05); }
    const face = Math.atan2(look, 1), bx = Math.cos(face), bz = Math.sin(face);
    mark(hX, hY, hZ, bx, 0.1 - 0.5 * peck, bz, 0.22, 0.2, SOFT, b.pale ? C.wh : cock ? C.hack2 : C.dk2, 1);
    mark(hX + 0.12 * bx, hY - 0.02 - 0.06 * peck, hZ + 0.12 * bz, bx, -0.25 - 0.6 * peck, bz, 0.13, 0.1, FEATH, C.beak, 1, 0.1);
    if (b.comb > 0) { const cs = cock ? 0.17 : 0.1 + 0.05 * b.comb; mark(hX + 0.02 * bx, hY + 0.06 + cs * 0.3, hZ, bx, 0.3, bz, cs, cs * 0.8, SOFT, C.red, 0.85, 0.15); if (cock) mark(hX + 0.08 * bx, hY - 0.09, hZ + 0.08 * bz, 0, -1, 0, 0.13, 0.11, SOFT, C.red, 0.8, 0.12); else if (b.comb > 0.7) mark(hX + 0.07 * bx, hY - 0.07, hZ + 0.07 * bz, 0, -1, 0, 0.08, 0.07, SOFT, C.red, 0.8, 0.12); }
  },
});
