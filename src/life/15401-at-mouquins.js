// William James Glackens, At Mouquin's (1905), Gallery 272. The word: mirror.
//
// Two people sit at a table in a New York restaurant, and they are the only people in the picture who are really
// there. Everyone else (a woman in a yellow straw hat seen from behind, a man in profile, grey heads, a rosy face
// under flowers) is in the mirror on the wall behind them: the room is on our side of the table, where we stand, and
// the picture shows it only as a looking-glass does. The museum's note says so too: the others of his circle "are
// reflected in the mirror behind them". No other picture here keeps its crowd in a glass, so that is the show: the
// mirror, and what a mirror at Mouquin's would hold of whoever stands in front of it.
//
// Look, and a piece of that wall is laid in under the picture in his paint: the dark red banquette, and over it the
// cream woodwork with its gilt fluted strips, shut, like a cupboard with two doors. In front of it the table comes
// down in his whites (lilac and blue in the folds), with the pink rose in its tumbler and the leaf it has dropped on
// the cloth. Nothing else: the two places are empty, because the two who sit there are in the picture above. A line
// of lamplight shows down the join of the doors, and there is a murmur behind them, as of a full room heard through
// a wall. Then the doors come open, the left and then the right, and they are looking-glass inside: as each swings
// round, the room it faces swings through it (the lamps, the far wall, then the tables and the crowd sliding
// across), its light goes round the gallery floor like a hand, and the murmur opens out into the talk of a restaurant
// at night. Each door meets the wall with a soft knock; the rose nods; the three panes are one mirror, and
// Mouquin's is in it: his crowd in his touch, leaning to each other, the yellow hat among them, the tablecloths
// white, the lamps warm. And the table with the rose is in it, from behind, as a glass has it.
//
// And so is the toy. A mirror at Mouquin's shows who is on our side of the table, and tonight that is you: wherever
// the toy is in front of the glass, it is in the room in the glass, a few touches of its own colour among the
// diners. Stop looking and the mirror stays open while the toy is near; drive up and down and watch yourself go by
// the tables. Drive off and the doors fold shut on the room (it swings away, the murmur goes behind the wood again),
// and the paint lifts off and goes back in under the frame. (The panes come down to the cushions, lower than any
// such mirror hung, so that a toy on the floor is in them from wherever its driver sees it.)
//
// There is no tune. The two I would have reached for were read first and put back: "The Sidewalks of New York"
// (1894), the New York waltz of those years, has a slur for Italians in its original first verse, and a love waltz
// under these two sitters would tell a story about them that the museum does not; and Bellows's skaters, four metres
// along this wall, already have a waltz. The room's own sound is the music here: voices (made of short soft bands of
// noise, no words in them) and now and then a fork on a plate.
//
// How it is made: the looking-glass is one mesh and one shader. Each pixel of glass takes the ray from the eye,
// turns it as a mirror does, and follows it into a room that stands where the gallery is: a far wall with its lamps,
// side walls, a floor, and three painted sheets of diners standing across it at three depths, each swaying a little
// (heads more than shoulders), so the room has depth from wherever you look and moves rightly when a door swings.
// They are not all alike: the man beside the yellow hat leans in to say something and sits back, the woman under the
// flowers turns her head a little, one at a middle table nods, and a waiter's back crosses behind the middle tables
// once the room is open (and again every quarter of a minute).
// The diners are painted once, in dabs, on a canvas, as his mirror has them: backs, profiles, heads turned
// three-quarters to a neighbour, never a face square to the glass. A face is the plane turned to the talk, its far
// side lost, a dark touch for the eyes under the brow or a hat's brim, a warm cheek: tone, never drawn. The toy
// and the table are put into the same room where a mirror would put them. The light on the gallery floor is part of
// the same mesh. The woodwork, the banquette, the table and the rose are his strokes over bodies a shade darker
// than themselves (one rig, one draw call; the strokes are let down from under the frame and the bodies scumbled in
// under them), with soft shadows as a third. The banquette and the table are soft to the toy; the doors pass through it. Everything stands under
// 0.85 m against a wall whose picture begins at 1.01 m; the doors swing 0.45 m out, and from the look camera nothing
// comes near the canvas. Bellows's pond, along the wall to the left, ends two metres short of this.
// With "Reduce motion and flashing" on, the doors open at six tenths of the speed, the glancing light on the glass
// and the sweep of light on the floor are taken down, the crowd sways half as far, the rose barely nods and the
// knocks are softer; nothing here flashes.
//
// What it does not do: it brings neither sitter out of the picture and gives them no story (the museum names them and
// says only that her gaze gives the scene "tension and mystery": the show leaves both where he put them, and the
// caption names no one); it pours nothing, raises nothing and shows no bottle or wine glass, in the room or in the
// mirror, because the game is played by children and the drink is not what the picture is about; nobody in the glass
// faces the player or follows the toy (they go on with their evening); the doors and the waiter are the show's, not
// the picture's, and the caption does not say otherwise; and the mirror shows the gallery nothing of itself but the
// toy, because it is his room that it holds.
import * as THREE from 'three';
import { lifeFor, ease, ramp, clamp01, lerp, shape, canvasTexture, rng } from '../paintlife.js';
import { noise } from './stagecraft.js';
import { strokes as strokeTex } from './brush.js';
import { LOWMEM } from '../budget.js';

const TAU = Math.PI * 2, PI = Math.PI;
const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const sstep = THREE.MathUtils.smoothstep, fall = (x, a, b) => 1 - sstep(x, a, b);

// ---------------------------------------------------------------- the scene (metres: x along the wall to the right, y up
// from the floor, z out of the canvas plane; the wall is a little behind z = 0)
const WG = 0.45;                               // a door's width; the middle glass is two of them
const Y0 = 0.15, Y1 = 0.8;                    // the doors, foot to top
const HZ = 0.022;                              // the hinges' line, out from the canvas plane (the middle of a door's thickness)
const GC = { x: 0.43, y0: 0.163, y1: 0.785, z: 0.01 };            // the middle glass
const GD = { x0: 0.498, x1: 0.88, y0: 0.171, y1: 0.777, z: 0.028 }; // a door's glass, as it lies open (the right one)
const TABLE = { x: 0.37, z: 0.49, rx: 0.215, rz: 0.15, y: 0.262, hem: 0.105 };
const ROSE = { x: TABLE.x + 0.1, y: TABLE.y + 0.05, z: TABLE.z - 0.03 };              // the mouth of the tumbler: the rose nods about it
const SOFT = [[TABLE.x, TABLE.z, 0.24], [-0.66, 0.1, 0.2], [-0.22, 0.1, 0.2], [0.22, 0.1, 0.2], [0.66, 0.1, 0.2]];   // what the toy is eased round (x, z, reach)
// the room in the glass: where its walls are, and its three sheets of diners
const UW = 2.6, D0 = 3.4, HC = 2.0, DL = [2.6, 1.8, 1.05];
const ROWS = [[0, 788, HC], [800, 1210, 1.04], [1218, 1628, 1.04], [1636, 2046, 1.04]];      // the painted sheet: each row's top and foot (of 2048), and the height it holds
// ---------------------------------------------------------------- the timeline (seconds of show)
const FLY = 0.5, BUILT = 1.75;                 // one stroke's flight; it is all there
const T_SEAM = 1.5, T_L = 2.1, T_R = 2.36, D_OPEN = 1.2, D_SHUT = 1.1;

// A brush's own print, for every mark: two drags (bristle lines, fuller in the middle, ragged at both ends, the second
// run dry), a soft round touch, and a plain patch for the bodies under them (as the Corot's reader has them).
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
    gm.strokeStyle = '#000';
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

// ---------------------------------------------------------------- the room in the glass, painted once
// One sheet (2048 square; half that where memory is short): the far wall with its lamps along the top, and under it
// three rows of diners, each row a sheet that stands across the room at its own depth. Every form is a soft mass
// first and then a few loaded touches over it, as he laid them: a touch is a ragged-ended patch of paint with the
// bristles' lights and darks dragged through it. A face is its light side, its shade side, the shade the eyes lie in
// and perhaps a mouth: tone, not drawing.
function paintRoom(size, pal) {
  const K = size / 2048, PX = size / (2 * UW);
  const hex = h => { const c = pal(h); return [c.r, c.g, c.b].map(v => Math.round(255 * Math.pow(Math.max(0, Math.min(1, v)), 1 / 2.2))); };
  const css = (c, k = 1) => `rgb(${Math.round(Math.min(255, c[0] * k))},${Math.round(Math.min(255, c[1] * k))},${Math.round(Math.min(255, c[2] * k))})`;
  const mix = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
  const R = rng(15401);
  const tex = canvasTexture(size, size, g => {
    g.clearRect(0, 0, size, size); g.lineCap = 'round'; g.lineJoin = 'round';
    let row = ROWS[0];
    const X = x => (x + UW) * PX, Y = h => (row[0] + (1 - h / row[2]) * (row[1] - row[0])) * K, M = m => m * PX;
    const pick = l => l[Math.floor(R() * l.length) % l.length], jit = s => (R() - 0.5) * s;
    // a touch: at (x, h) metres, len by wid metres, turned ang (0 lies across), in colour c
    const dab = (x, h, len, wid, ang, c, a = 0.92) => {
      const L2 = Math.max(1, M(len) / 2), W2 = Math.max(0.8, M(wid) / 2), n = 11;
      g.save(); g.translate(X(x), Y(h)); g.rotate(-ang); g.globalAlpha = a; g.fillStyle = css(c, 1 + jit(0.12));
      g.beginPath();
      for (let i = 0; i < n; i++) { const t = i / n * TAU, cs = Math.cos(t), sn = Math.sin(t), px = Math.sign(cs) * Math.pow(Math.abs(cs), 0.6) * L2 * (1 + jit(0.34)), py = Math.sign(sn) * Math.pow(Math.abs(sn), 0.7) * W2 * (1 + jit(0.3)); if (i) g.lineTo(px, py); else g.moveTo(px, py); }
      g.closePath(); g.fill();
      if (W2 > 1.6) { g.lineWidth = Math.max(0.7, W2 * 0.36); for (const [k, al] of [[1.15, 0.3], [0.86, 0.26]]) { g.strokeStyle = css(c, k); g.globalAlpha = a * al; const o = jit(W2 * 1.1); g.beginPath(); g.moveTo(-L2 * 0.7, o); g.quadraticCurveTo(0, o + jit(W2 * 0.5), L2 * 0.75, o + jit(W2 * 0.4)); g.stroke(); } }
      g.restore(); g.globalAlpha = 1;
    };
    // a mass under the touches: a soft closed shape through the points ([x, h] metres)
    const mass = (pts, c, a = 1) => {
      g.globalAlpha = a; g.fillStyle = css(c); g.beginPath();
      const n = pts.length, P = i => pts[(i + n) % n], mx = i => [(X(P(i)[0]) + X(P(i + 1)[0])) / 2, (Y(P(i)[1]) + Y(P(i + 1)[1])) / 2];
      const m0 = mx(-1); g.moveTo(m0[0], m0[1]);
      for (let i = 0; i < n; i++) { const m = mx(i); g.quadraticCurveTo(X(P(i)[0]), Y(P(i)[1]), m[0], m[1]); }
      g.closePath(); g.fill(); g.globalAlpha = 1;
    };
    const oval = (x, h, rx, ry, c, a = 1) => { g.globalAlpha = a; g.fillStyle = css(c); g.beginPath(); g.ellipse(X(x), Y(h), M(rx), M(ry), 0, 0, TAU); g.fill(); g.globalAlpha = 1; };
    const glow = (x, h, r, c, a) => { const gr = g.createRadialGradient(X(x), Y(h), 0, X(x), Y(h), M(r)); gr.addColorStop(0, `rgba(${c[0]},${c[1]},${c[2]},${a})`); gr.addColorStop(0.35, `rgba(${c[0]},${c[1]},${c[2]},${a * 0.42})`); gr.addColorStop(1, `rgba(${c[0]},${c[1]},${c[2]},0)`); g.fillStyle = gr; g.fillRect(X(x - r), Y(h + r), M(2 * r), M(2 * r)); };

    // ---- his colours
    const VIOLET = hex('#807a86'), OLIVE = hex('#7a694e'), UMBER = hex('#33261f'), DADO = hex('#46372f'), CREAM = hex('#e6dfcb'), GILT = hex('#b8964f'), GILT_D = hex('#7c5f2c'), LAMP = [255, 226, 164], STREAK = hex('#b9b56a');
    const WHITE = hex('#eef0ea'), LILAC = hex('#c3bfd0'), BLUEW = hex('#c3ccdc'), SHADW = hex('#9da2b4'), PINK = hex('#ef9c96'), LEAF = hex('#3f7a55');
    const FLESH = [hex('#ecc4a4'), hex('#e6b697'), hex('#f0ccb0')], RUDDY = [hex('#c98a70'), hex('#b97862'), hex('#c4826c')], SOCKET = hex('#7a5244'), LIPS = hex('#c8584c'), ROSY = hex('#e69a8c');
    const COATS = [hex('#1e1d22'), hex('#26252c'), hex('#2e2a28'), hex('#33303a'), hex('#2a2320'), hex('#3a3430')], HAIRS = [hex('#3a2a20'), hex('#56402e'), hex('#8a8580'), hex('#2a211c'), hex('#6e4a30'), hex('#a09a94')];
    const STRAW = hex('#dcb85e'), STRAW_D = hex('#b08a3c'), CORAL = hex('#e8665a'), AUBURN = hex('#7a4a2c'), AUBURN_D = hex('#56301c'), BLUE = hex('#4f9cc6'), BLUE_D = hex('#2f6a9c'), REDTIE = hex('#cf3a30'), CHAIR = hex('#4a2018');

    // ---- the far wall (and, turned, the side walls): violet grey going olive to the right, scumbled; a dark dado; his
    // white streak of a column; two far glasses in their cream frames; wall lamps, and hanging ones
    row = ROWS[0];
    { const gr = g.createLinearGradient(0, 0, size, 0); gr.addColorStop(0, css(VIOLET, 0.78)); gr.addColorStop(0.55, css(mix(VIOLET, OLIVE, 0.5), 0.76)); gr.addColorStop(1, css(OLIVE, 0.76)); g.fillStyle = gr; g.fillRect(0, 0, size, Y(0) + 2); }
    for (let i = 0; i < 260; i++) { const x = -UW + R() * 2 * UW, h = 0.3 + R() * 1.3, k = (x + UW) / (2 * UW), c = mix(mix(VIOLET, OLIVE, clamp01(k + jit(0.4))), R() < 0.5 ? UMBER : CREAM, 0.06 + 0.16 * R()); dab(x, h, 0.3 + 0.3 * R(), 0.1 + 0.08 * R(), 0.3 + jit(1.0), c, 0.26); }
    { const gr = g.createLinearGradient(0, Y(HC), 0, Y(1.55)); gr.addColorStop(0, css(UMBER, 0.8)); gr.addColorStop(1, css(mix(UMBER, OLIVE, 0.25))); g.fillStyle = gr; g.fillRect(0, 0, size, Y(1.6)); }                      // the ceiling's shade
    for (let i = 0; i < 40; i++) dab(-UW + R() * 2 * UW, 1.64 + R() * 0.32, 0.4, 0.07, jit(0.1), mix(UMBER, OLIVE, 0.4 * R()), 0.3);
    for (let i = 0; i < 30; i++) dab(-UW + (i + 0.5) * 2 * UW / 30, 1.6 + jit(0.006), 0.2, 0.02, jit(0.03), mix(CREAM, VIOLET, 0.3 + 0.2 * R()), 0.92);            // the cornice
    g.fillStyle = css(DADO); g.fillRect(0, Y(0.34), size, Y(0) - Y(0.34) + 2);                                                                     // the dado
    for (let i = 0; i < 60; i++) dab(-UW + R() * 2 * UW, R() * 0.32, 0.3, 0.07, jit(0.2), mix(DADO, R() < 0.5 ? UMBER : OLIVE, 0.5 * R()), 0.4);
    for (let i = 0; i < 26; i++) dab(-UW + (i + 0.5) * 2 * UW / 26, 0.345 + jit(0.004), 0.22, 0.014, jit(0.03), mix(CREAM, VIOLET, 0.5), 0.7);
    for (const [x0, x1] of [[-2.25, -1.3], [1.5, 2.3]]) {         // two far glasses
      g.fillStyle = css(mix(VIOLET, CREAM, 0.3)); g.fillRect(X(x0), Y(1.38), M(x1 - x0), Y(0.48) - Y(1.38));
      for (let i = 0; i < 26; i++) dab(lerp(x0 + 0.08, x1 - 0.08, R()), 0.56 + R() * 0.74, 0.16, 0.07, 0.4 + jit(1.2), mix(mix(VIOLET, CREAM, 0.2 + 0.3 * R()), pick([STREAK, CORAL, BLUE, UMBER, WHITE, LAMP]), 0.2 * R()), 0.4);
      for (let i = 0; i < 6; i++) for (const xx of [x0, x1]) dab(xx + jit(0.004), 0.55 + i * 0.152, 0.17, 0.03, PI / 2 + jit(0.03), mix(CREAM, VIOLET, 0.15 * R()), 0.95);
      for (let i = 0; i < 6; i++) dab(x0 - 0.045, 0.55 + i * 0.152, 0.17, 0.02, PI / 2 + jit(0.03), i % 2 ? GILT : GILT_D, 0.95);
      for (let i = 0; i < 5; i++) { dab(lerp(x0, x1, (i + 0.5) / 5), 1.385 + jit(0.004), 0.22, 0.03, jit(0.03), CREAM, 0.95); dab(lerp(x0, x1, (i + 0.5) / 5), 0.472 + jit(0.004), 0.22, 0.016, jit(0.03), GILT, 0.95); }
    }
    for (let i = 0; i < 5; i++) dab(-1.72 + jit(0.1), 1.05 + R() * 0.24, 0.12, 0.035, PI / 2 + jit(0.3), STREAK, 0.6);                             // the yellow-green light in the glass, upper left
    g.fillStyle = css(mix(WHITE, VIOLET, 0.22)); g.fillRect(X(0.9), Y(1.6), M(0.17), Y(0.34) - Y(1.6));                                            // the white column
    for (let i = 0; i < 16; i++) dab(0.985 + jit(0.12), 0.4 + R() * 1.15, 0.26, 0.035, PI / 2 + jit(0.05), mix(WHITE, pick([CREAM, LILAC, VIOLET]), 0.15 + 0.45 * R()), 0.7);
    const lamp = (x, h, r) => { glow(x, h, r * 13, LAMP, 0.42); glow(x, h, r * 4, LAMP, 0.9); oval(x, h, r * 1.05, r * 1.05, [255, 244, 208]); dab(x - r * 0.25, h + r * 0.25, r * 0.9, r * 0.7, 0.5, [255, 255, 244], 1); };
    for (const x of [-2.45, -1.05, -0.2, 0.52, 1.28, 2.44]) { dab(x, 0.83, 0.08, 0.018, PI / 2, GILT_D, 0.95); dab(x, 0.875, 0.06, 0.016, 0.1, GILT, 0.95); lamp(x, 0.94, 0.034); }
    for (const x of [-1.6, -0.55, 0.3, 1.85]) { dab(x, 1.5, 0.22, 0.008, PI / 2, UMBER, 0.9); lamp(x, 1.36, 0.042); }

    // ---- the diners
    const table = (x, w, far) => {       // a tablecloth: its top a pale band, its fall in lilac shade with the folds' lights; something small on it
      const top = 0.32, c0 = mix(WHITE, VIOLET, far * 0.3), sh = mix(mix(SHADW, LILAC, 0.4), VIOLET, far * 0.25), hem = 0.065 + jit(0.02);
      oval(x, 0.014, w * 1.25, 0.014, UMBER, 0.4);
      mass([[x - w, top - 0.004], [x + w, top - 0.004], [x + w * 0.98, top - 0.1], [x + w * 0.93, hem + jit(0.02)], [x + w * 0.4, hem + 0.02], [x, hem - 0.01], [x - w * 0.5, hem + 0.015], [x - w * 0.94, hem + jit(0.02)], [x - w * 0.98, top - 0.1]], sh);
      for (let i = 0; i < 7; i++) { const fx = x + (i / 6 - 0.5) * 1.75 * w + jit(0.02); dab(fx, lerp(hem + 0.03, top - 0.03, 0.5 + jit(0.2)), 0.17 + 0.05 * R(), 0.03 + 0.016 * R(), PI / 2 + jit(0.12), i % 2 ? mix(c0, sh, 0.25) : mix(sh, pick([BLUEW, SHADW]), 0.5), 0.85); }
      mass([[x - w * 1.03, top + 0.012], [x + w * 1.03, top + 0.012], [x + w * 1.04, top - 0.012], [x - w * 1.04, top - 0.012]], c0);
      for (let i = 0; i < 4; i++) dab(x + (i / 3 - 0.5) * 1.5 * w + jit(0.03), top + 0.003 + jit(0.006), 0.16, 0.014, jit(0.05), mix(c0, pick([LILAC, BLUEW, CREAM, WHITE]), 0.5 * R()), 0.9);
      if (R() < 0.8) { const fx = x + jit(w * 0.6); dab(fx, top + 0.034, 0.036, 0.024, PI / 2 + jit(0.4), mix(LEAF, UMBER, far * 0.3), 0.95); dab(fx + jit(0.01), top + 0.064, 0.036, 0.032, jit(1), mix(pick([PINK, CORAL, WHITE]), VIOLET, far * 0.3), 0.97); }
      for (let i = 0; i < 2; i++) dab(x + jit(w * 1.4), top + 0.016, 0.05, 0.01, jit(0.1), mix(WHITE, LILAC, 0.3 * R()), 0.95);                    // a plate's edge
      for (let i = 0; i < 2; i++) dab(x - w * (0.75 - 0.9 * i) + jit(0.03), top + 0.004, 0.1, 0.012, jit(0.04), [255, 255, 250], 0.95 - 0.35 * far);      // the lamps on its top, loaded on
      dab(x - w * 0.86 + jit(0.01), lerp(hem, top, 0.55), 0.16, 0.02, PI / 2 + jit(0.06), mix(c0, [255, 255, 250], 0.5), 0.9 - 0.3 * far);                // and down its lit edge
      for (let i = 0; i < 5; i++) dab(x + (i / 4 - 0.5) * 1.8 * w + jit(0.03), hem + jit(0.014), 0.05, 0.022, PI / 2 + jit(0.5), i % 2 ? sh : mix(sh, SHADW, 0.5), 0.95);      // (its hem broken)
    };
    // one of his diners. o: x; kind 'front' (sitting square to us, the head turned three-quarters to a neighbour) | 'side' |
    // 'back'; dir (the way they turn or lean, +1 to the right); who 'man' | 'woman'; stand (true: on their feet); far (0 near .. 1: greyer, softer); and their colours
    const person = o => {
      const { x, kind, dir = 1, who = 'man', far = 0 } = o, up = o.stand ? 0.27 : 0, lean = (o.lean || 0) * dir * 0.045;
      const hz = c => mix(c, VIOLET, far * 0.28), coat = hz(o.coat || pick(COATS)), hair = hz(o.hair || pick(HAIRS)), skin = hz(pick(FLESH)), shade = hz(pick(RUDDY));
      const sh = 0.5 + up, hc = 0.605 + up, hx = x + lean + (kind === 'side' ? dir * 0.014 : 0), hw = 0.084, hh = 0.108, bw = kind === 'side' ? 0.088 : 0.135, foot = o.stand ? 0.03 : kind === 'back' ? 0.2 : 0.25;
      const cloth = o.blouse ? hz(o.blouse) : coat, lit = o.blouse ? mix(cloth, WHITE, 0.4) : mix(coat, VIOLET, 0.34), dark = o.blouse ? mix(cloth, SHADW, 0.55) : mix(coat, UMBER, 0.4);
      const bx = k => x + lean * k;           // the body leans from the seat up
      // what is under the table: a chair's seat and legs; trousers, or a skirt to the floor
      if (!o.stand) {
        const trs = mix(coat, UMBER, 0.45), skirt = o.skirt || (o.blouse ? mix(mix(o.blouse, VIOLET, 0.5), COATS[3], 0.35) : coat);
        oval(x, 0.014, 0.17, 0.014, UMBER, 0.4);
        for (const s of [-1, 1]) dab(x + s * 0.085 - (kind === 'side' ? dir * 0.03 : 0), 0.1, 0.2, 0.014, PI / 2 + s * 0.05, hz(CHAIR), 0.97);
        dab(x - (kind === 'side' ? dir * 0.02 : 0), 0.205, 0.2, 0.022, 0, hz(CHAIR), 0.97);
        if (who === 'woman') mass(kind === 'side' ? [[x - dir * 0.1, 0.3], [x + dir * 0.14, 0.3], [x + dir * 0.2, 0.03], [x - dir * 0.13, 0.03]] : [[x - bw, 0.3], [x + bw, 0.3], [x + bw * 1.45, 0.03], [x - bw * 1.45, 0.03]], hz(skirt));
        else if (kind === 'side') { dab(x + dir * 0.07, 0.235, 0.17, 0.06, 0, trs, 0.98); dab(x + dir * 0.145, 0.125, 0.2, 0.05, PI / 2 - dir * 0.08, trs, 0.98); dab(x + dir * 0.165, 0.022, 0.07, 0.026, 0, hz(COATS[0]), 0.98); }
        else for (const s of [-1, 1]) { dab(x + s * 0.055, 0.13, 0.22, 0.055, PI / 2 + s * 0.06, trs, 0.98); dab(x + s * 0.06, 0.022, 0.06, 0.026, 0, hz(COATS[0]), 0.98); }
      } else oval(x, 0.014, 0.12, 0.012, UMBER, 0.4);
      // the body: one soft dark mass, sloping shoulders; then a few broad touches falling from them, light on the left
      if (o.stand) { for (const s of [-1, 1]) { dab(x + s * bw * 0.36, 0.3, 0.2, 0.052, PI / 2 + s * 0.04, mix(coat, UMBER, 0.4), 0.97); dab(x + s * bw * 0.34, 0.13, 0.2, 0.046, PI / 2, mix(coat, UMBER, 0.5), 0.97); } mass([[bx(1) - bw, sh - 0.035], [bx(1) - bw * 0.5, sh + 0.012], [bx(1) + bw * 0.5, sh + 0.012], [bx(1) + bw, sh - 0.035], [x + bw * 1.02, 0.55], [x + bw * 0.9, 0.4], [x - bw * 0.9, 0.4], [x - bw * 1.02, 0.55]], cloth); }
      else mass([[bx(1) - bw, sh - 0.035], [bx(1) - bw * 0.5, sh + 0.012], [bx(1) + bw * 0.5, sh + 0.012], [bx(1) + bw, sh - 0.035], [bx(0.3) + bw * 1.12, foot + 0.08], [x + bw * 0.95, foot], [x - bw * 0.95, foot], [bx(0.3) - bw * 1.12, foot + 0.08]], cloth);
      const low = o.stand ? 0.42 : foot;
      for (let i = 0; i < 9; i++) { const s = (i / 8 - 0.5) * 2 + jit(0.15), k = 0.2 + 0.7 * R(), yy = lerp(low + 0.03, sh - 0.03, k); dab(bx(k) + s * bw * 0.86, yy, 0.1 + 0.07 * R(), 0.034 + 0.022 * R(), PI / 2 - s * 0.25 + jit(0.3), s < -0.15 ? mix(cloth, lit, 0.35 + 0.65 * R()) : mix(cloth, dark, 0.2 + 0.8 * R()), 0.88); }
      for (let i = 0; i < 6; i++) { const s = i % 2 ? 1 : -1, k = R(); dab(bx(k) + s * bw * (1.02 + 0.1 * R()), lerp(low + 0.02, sh - 0.06, k), 0.07, 0.028, PI / 2 - s * (0.1 + 0.4 * R()), s < 0 ? mix(cloth, lit, 0.5 * R()) : mix(cloth, dark, 0.6 * R()), 0.95); }      // (its edge broken, as a brush leaves it)
      if (kind === 'front' && !o.stand) for (const s of [-1, 1]) { dab(x + s * bw * 0.72, 0.385, 0.15, 0.042, PI / 2 + s * 0.6, s < 0 ? mix(cloth, lit, 0.5) : mix(cloth, dark, 0.4), 0.97); dab(x + s * 0.045, 0.34, 0.036, 0.024, 0, mix(skin, shade, s < 0 ? 0.1 : 0.5), 0.97); }       // the arms come in to the table
      dab(bx(1) - bw * 0.62, sh - 0.02, 0.1, 0.03, 0.5, lit, 0.75); dab(bx(1) + bw * 0.64, sh - 0.022, 0.1, 0.03, -0.5, dark, 0.8);                   // the slope of the shoulders
      if (kind === 'front' && who === 'man') { mass([[hx - 0.03, sh + 0.004], [hx + 0.03, sh + 0.004], [hx + 0.012, sh - 0.105], [hx - 0.012, sh - 0.105]], hz(WHITE)); dab(hx + 0.012, sh - 0.05, 0.07, 0.014, PI / 2 + 0.1, hz(LILAC), 0.6); dab(hx - 0.01, sh - 0.045, 0.055, 0.014, PI / 2 - 0.08, [255, 255, 250], 0.9 - 0.3 * far); dab(hx, sh - 0.012, 0.034, 0.02, 0.05, hz(o.tie || pick([COATS[0], REDTIE, COATS[2]])), 0.97); }
      if (o.blouse) for (let i = 0; i < 3; i++) dab(bx(0.8) - bw * (0.2 + 0.5 * R()), sh - 0.03 - 0.1 * R(), 0.06, 0.016, PI / 2 + 0.3 + jit(0.4), mix(hz(o.blouse), [255, 255, 250], 0.7), 0.85);
      if (kind === 'side') { dab(hx + dir * 0.028, sh + 0.002, 0.034, 0.02, 0.5 * dir, hz(WHITE), 0.97); if (!o.stand) { dab(x + dir * 0.105, 0.385, 0.15, 0.045, dir * 0.42, mix(cloth, lit, 0.25), 0.97); dab(x + dir * 0.18, 0.345, 0.04, 0.028, 0, skin, 0.97); } }      // a collar; an arm to the table, a hand
      if (kind === 'back' && who === 'man') dab(hx, sh + 0.012, 0.075, 0.014, 0, hz(WHITE), 0.95);
      if (o.touches) for (let i = 0; i < 7; i++) dab(x + jit(bw * 1.3), lerp(0.3, sh - 0.04, R()), 0.026, 0.016, jit(2), hz(o.touches), 0.9);
      // the neck, the head
      dab(hx - lean * 0.2, sh + 0.024, 0.05, 0.042, PI / 2, kind === 'back' ? shade : mix(skin, shade, 0.55), 0.97);
      if (kind === 'back') {
        oval(hx, hc, hw * 0.52, hh * 0.52, mix(hair, UMBER, 0.2));
        for (let i = 0; i < 5; i++) dab(hx + jit(hw * 0.5), hc + jit(hh * 0.5), 0.06, 0.03, PI / 2 + jit(1.0), mix(hair, R() < 0.4 ? WHITE : UMBER, 0.16 * R()), 0.85);
        for (const s of [-1, 1]) dab(hx + s * hw * 0.52, hc - 0.014, 0.024, 0.015, PI / 2, shade, 0.95);                            // an ear each side
        dab(hx, hc - hh * 0.5, 0.05, 0.018, 0, shade, 0.9);                                                                         // the nape
        dab(hx - 0.016 + jit(0.01), hc + hh * 0.3, 0.036, 0.012, 0.4 + jit(0.5), mix(hair, WHITE, 0.3), 0.7);                       // a light on the crown
        for (let i = 0; i < 3; i++) dab(hx + (i - 1) * hw * 0.5 + jit(0.01), hc + hh * (0.3 + 0.2 * R()), 0.028, 0.011, PI / 2 + jit(1.2), mix(hair, UMBER, 0.2), 0.9);      // (its edge broken)
      } else {
        // a face, turned: in profile (kind 'side'), or three-quarters to a neighbour (kind 'front': nobody in the glass
        // faces straight out of it). The hair is a mass behind; the face is the plane turned to the talk, its far side
        // lost; a dark touch where the eyes are, under the brow or a hat's brim; a warm cheek; a nose and a mouth barely.
        const f = dir, q = kind === 'side' ? 1 : 0.55, brim = o.hat ? 1 : 0, litSide = f < 0 ? 1 : 0;      // (his light is from the left)
        oval(hx, hc - 0.004, hw * 0.47, hh * 0.5, mix(hair, UMBER, 0.2));
        dab(hx + f * 0.014 * q, hc - 0.008, 0.09, 0.052 - 0.006 * q, PI / 2 + f * 0.06, mix(skin, shade, litSide ? 0.12 : 0.4), 0.97);
        dab(hx + f * (0.03 * q + 0.008), hc - 0.01, 0.07, 0.016, PI / 2 + f * 0.05, mix(shade, SOCKET, litSide ? 0.05 : 0.3), 0.8);          // the far side of the face, lost
        dab(hx + f * 0.004 * q - 0.006, hc - 0.02, 0.034, 0.024, 0.3, mix(ROSY, skin, 0.35), 0.6);                                           // a warm cheek
        dab(hx + f * 0.046 * q, hc - 0.008, 0.02, 0.013, -f * 0.9, mix(skin, WHITE, 0.12), 0.95 * q + 0.2);                                  // the nose
        dab(hx + f * 0.016 * q, hc + 0.015, 0.058 - 0.014 * q, 0.016 + 0.008 * brim, -f * 0.1, mix(shade, SOCKET, 0.55 + 0.25 * brim), 0.62 + 0.2 * brim);      // the shade the eyes lie in
        dab(hx + f * 0.024 * q + f * 0.004, hc + 0.012, 0.02, 0.011, 0, mix(SOCKET, UMBER, 0.35), 0.8);                                      // a dark touch for the eye
        if (kind === 'front') dab(hx - f * 0.012, hc + 0.012, 0.016, 0.01, 0, mix(SOCKET, UMBER, 0.2), 0.6);
        dab(hx + f * 0.03 * q, hc - 0.031, 0.016, 0.008, 0, who === 'woman' ? mix(LIPS, shade, 0.3) : mix(SOCKET, shade, 0.4), 0.55);
        if (o.moustache) dab(hx + f * 0.03 * q, hc - 0.022, 0.03, 0.011, f * 0.3, mix(hair, UMBER, 0.2), 0.97);
        dab(hx - f * (0.006 + 0.022 * (1 - q)), hc - 0.006, 0.022, 0.014, PI / 2, shade, 0.9);                                               // an ear
        for (let i = 0; i < 6; i++) { const a = PI * (0.12 + 0.95 * i / 5); dab(hx - f * Math.cos(a) * hw * 0.48 - f * 0.012 * q, hc + 0.01 + Math.sin(a) * hh * 0.44 - (i > 3 ? 0.018 * q : 0), 0.05, 0.028, a + PI / 2 + jit(0.4), mix(hair, UMBER, 0.3 * R()), 0.97); }
        if (who === 'woman') dab(hx - f * hw * 0.5, hc + 0.004, 0.06, 0.036, PI / 2 - f * 0.2, hair, 0.97);
        dab(hx - f * 0.02 + jit(0.02), hc + hh * 0.36, 0.03, 0.012, 0.3 + jit(0.6), mix(hair, WHITE, 0.25), 0.7);                            // a light in the hair
        for (let i = 0; i < 2; i++) dab(hx - f * (hw * 0.5 + 0.006) + jit(0.01), hc + jit(0.05), 0.026, 0.01, PI / 2 + jit(0.8), mix(hair, UMBER, 0.2), 0.9);      // (its edge broken)
      }
      // a hat
      const hy = hc + hh * 0.42;
      if (o.hat === 'bowler') { oval(hx, hy + 0.026, 0.046, 0.034, hz(COATS[0])); dab(hx, hy + 0.002, 0.14, 0.016, 0.04 * dir, hz(COATS[1]), 0.98); dab(hx - 0.016, hy + 0.042, 0.04, 0.011, 0.25, mix(hz(VIOLET), WHITE, 0.35), 0.8); }
      if (o.hat === 'boater') { mass([[hx - 0.044, hy + 0.034], [hx + 0.044, hy + 0.034], [hx + 0.046, hy], [hx - 0.046, hy]], hz(STRAW)); dab(hx, hy, 0.16, 0.014, 0.03 * dir, hz(mix(STRAW, WHITE, 0.3)), 0.98); dab(hx, hy + 0.012, 0.09, 0.011, 0, hz(COATS[0]), 0.95); }
      if (o.hat === 'wide') {         // a woman's hat: a great dark shape, with flowers or a plume on it
        const hcI = hz(o.hatCol || COATS[0]);
        mass([[hx - 0.13, hy + 0.008], [hx - 0.07, hy + 0.06], [hx + 0.03, hy + 0.074], [hx + 0.12, hy + 0.04], [hx + 0.13, hy], [hx, hy - 0.012]], hcI);
        for (let i = 0; i < 5; i++) dab(hx + jit(0.16), hy + 0.026 + jit(0.03), 0.1, 0.032, jit(0.5), mix(hcI, R() < 0.5 ? UMBER : VIOLET, 0.3 * R()), 0.8);
        for (let i = 0; i < 6; i++) dab(hx + jit(0.13), hy + 0.05 + jit(0.02), 0.04, 0.024, jit(2), hz(pick(o.trim || [BLUE, BLUE_D, PINK])), 0.95);
        dab(hx - 0.06 + jit(0.02), hy + 0.05, 0.06, 0.012, 0.5, mix(hcI, WHITE, 0.4), 0.75); for (let i = 0; i < 3; i++) dab(hx + (i - 1) * 0.12 + jit(0.02), hy + 0.006 + jit(0.012), 0.05, 0.014, jit(0.5), mix(hcI, UMBER, 0.3), 0.95);      // a light along its crown; its brim's edge broken
      }
      if (o.hat === 'straw') {        // the yellow straw hat, its coral ribbon and green leaves (the picture's own)
        mass([[hx - 0.135, hy + 0.012], [hx - 0.08, hy + 0.066], [hx + 0.04, hy + 0.082], [hx + 0.13, hy + 0.046], [hx + 0.125, hy + 0.004], [hx, hy - 0.008]], hz(STRAW));
        for (let i = 0; i < 6; i++) dab(hx + jit(0.16), hy + 0.04 + jit(0.03), 0.11, 0.028, 0.25 + jit(0.3), mix(hz(STRAW), R() < 0.5 ? hz(STRAW_D) : WHITE, R() * 0.5), 0.85);
        for (let i = 0; i < 8; i++) dab(hx - 0.02 + jit(0.13), hy + 0.01 + jit(0.014), 0.044, 0.022, jit(2.4), hz(CORAL), 0.97);
        for (let i = 0; i < 4; i++) dab(hx + 0.056 + jit(0.03), hy - 0.012 + jit(0.012), 0.03, 0.014, jit(2.4), hz(LEAF), 0.97);
        for (let i = 0; i < 3; i++) dab(hx - 0.05 + jit(0.08), hy + 0.068 + jit(0.008), 0.05, 0.012, 0.3 + jit(0.2), [255, 240, 190], 0.9);      // the lamps on the straw
      }
    };
    const chairBack = (x, far) => { for (let i = 0; i < 6; i++) { const a = PI * (i + 0.5) / 6; dab(x + Math.cos(a) * 0.105, 0.33 + Math.sin(a) * 0.14, 0.085, 0.014, a + PI / 2, mix(CHAIR, VIOLET, far * 0.3), 0.95); } for (const s of [-1, 1]) dab(x + s * 0.105, 0.27, 0.13, 0.014, PI / 2, mix(CHAIR, VIOLET, far * 0.3), 0.95); };
    // a sheet of them: those who face us or sit side on, then the tables, then those with their backs to the glass (and their chairs' backs)
    const sheet = (r, people, tables, far, lean) => { row = ROWS[r]; const all = people.map(o => ({ ...o, far, lean })); for (const o of all) if (o.kind !== 'back') person(o); for (const x of tables) table(x, 0.165, far); for (const o of all) if (o.kind === 'back') { person(o); if (!o.stand) chairBack(o.x, far); } };

    // the far sheet: grey heads and dark coats, two on their feet
    sheet(1, [
      { x: -2.3, kind: 'side', dir: 1, hat: 'bowler' }, { x: -1.6, kind: 'front', dir: -1, moustache: true }, { x: -1.14, kind: 'side', dir: 1, who: 'woman', hat: 'wide', blouse: LILAC, trim: [PINK, WHITE] },
      { x: -0.4, kind: 'front', dir: -1, hair: HAIRS[2] }, { x: 0.06, kind: 'back', stand: true, hat: 'bowler' }, { x: 0.3, kind: 'side', dir: 1 }, { x: 0.95, kind: 'front', dir: -1, who: 'woman', hat: 'wide', blouse: BLUE, trim: [CORAL, PINK] },
      { x: 1.42, kind: 'side', dir: 1, hair: HAIRS[5], moustache: true }, { x: 2.14, kind: 'side', dir: -1 }, { x: 2.45, kind: 'side', dir: -1, stand: true, hair: HAIRS[2] },
    ], [-1.95, -0.75, 0.6, 1.8], 1, 0.4);
    // the middle sheet
    sheet(2, [
      { x: -2.02, kind: 'side', dir: 1, who: 'woman', hat: 'wide', blouse: BLUEW, trim: [BLUE, PINK, WHITE] }, { x: -1.62, kind: 'back', hair: HAIRS[3] }, { x: -0.96, kind: 'front', dir: -1, moustache: true, hair: HAIRS[2], tie: COATS[0] },
      { x: -0.28, kind: 'back', hair: HAIRS[4], coat: COATS[5] }, { x: 0.2, kind: 'side', dir: -1, hat: 'boater' }, { x: 0.78, kind: 'front', dir: 1, hair: HAIRS[0], tie: REDTIE },
      { x: 1.12, kind: 'back', who: 'woman', hat: 'wide', hatCol: hex('#3a2f44'), trim: [PINK, WHITE], blouse: LILAC }, { x: 1.68, kind: 'side', dir: -1, hair: HAIRS[5] }, { x: 2.3, kind: 'back', hair: HAIRS[1] },
    ], [-1.3, 0.5, 1.4], 0.5, 0.5);
    // the near sheet: the woman in the yellow straw hat with her back to the glass, the man in profile beside her, the
    // rosy face under flowers at the left
    sheet(3, [
      { x: -2.24, kind: 'side', dir: 1, hair: HAIRS[2], moustache: true }, { x: -1.5, kind: 'front', dir: -1, who: 'woman', hat: 'wide', hatCol: hex('#2e3a58'), trim: [BLUE, PINK, WHITE, PINK], blouse: hex('#dfe3ea'), skirt: hex('#5a5870'), hair: AUBURN_D },
      { x: -0.62, kind: 'back', hair: HAIRS[0] }, { x: -0.08, kind: 'side', dir: -1, hair: HAIRS[2], moustache: true },
      { x: 0.42, kind: 'back', who: 'woman', hat: 'straw', hair: AUBURN, blouse: WHITE, skirt: hex('#cfd2da'), touches: CORAL }, { x: 1.0, kind: 'side', dir: -1, hair: HAIRS[1] },
      { x: 1.5, kind: 'front', dir: 1, hair: HAIRS[5], tie: COATS[0] }, { x: 2.02, kind: 'back', hair: HAIRS[3], coat: COATS[4] }, { x: 2.44, kind: 'side', dir: -1, hat: 'bowler' },
    ], [-1.88, -0.36, 0.72, 1.78], 0, 0.6);
  });
  tex.premultiplyAlpha = true; tex.generateMipmaps = true; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.magFilter = THREE.LinearFilter; tex.anisotropy = 4; tex.needsUpdate = true;
  return tex;
}

// The table as the glass has it (from behind: the cloth, the rose's dark side, the tumbler), and the toy as he might
// have touched it in: both small sheets, stood in the room in the glass where a mirror would put them.
function paintTable(pal) {
  const R = rng(4107), W = 384, H = 192;
  const css = h => '#' + pal(h).getHexString();
  const t = canvasTexture(W, H, g => {
    g.clearRect(0, 0, W, H); g.lineCap = 'round';
    const dab = (x, y, l, w, a, c, al = 0.95) => { g.save(); g.translate(x, y); g.rotate(a); g.fillStyle = c; g.globalAlpha = al; g.beginPath(); for (let i = 0; i < 11; i++) { const t = i / 11 * 6.2832, cs = Math.cos(t), sn = Math.sin(t), px = Math.sign(cs) * Math.pow(Math.abs(cs), 0.6) * l / 2 * (1 + (R() - 0.5) * 0.34), py = Math.sign(sn) * Math.pow(Math.abs(sn), 0.7) * w / 2 * (1 + (R() - 0.5) * 0.3); if (i) g.lineTo(px, py); else g.moveTo(px, py); } g.closePath(); g.fill(); g.restore(); g.globalAlpha = 1; };
    // (the sheet holds 0.68 m across the table's middle and 0.51 m up from the floor)
    const X = x => 128 + x / 0.68 * 256, Y = h => 192 * (1 - h / 0.51), M = m => m / 0.68 * 256;
    const WH = ['#e4e8e6', '#d5dbe0', '#dcd8e2', '#e9e4d6'].map(css), SH = ['#9ea4b6', '#a9a6ba', '#8f95a8', '#b3b4c4'].map(css), w = TABLE.rx;
    for (const sx of [-1, 1]) dab(X(sx * (w - 0.05)), Y(0.055), M(0.11), M(0.022), Math.PI / 2, css('#3a1c16'));                                    // its legs
    g.fillStyle = SH[0]; g.beginPath(); g.moveTo(X(-w), Y(TABLE.y)); g.lineTo(X(w), Y(TABLE.y)); g.lineTo(X(w * 1.03), Y(TABLE.hem + 0.012)); g.quadraticCurveTo(X(w * 0.5), Y(TABLE.hem - 0.012), X(0), Y(TABLE.hem + 0.008)); g.quadraticCurveTo(X(-w * 0.5), Y(TABLE.hem + 0.02), X(-w * 1.03), Y(TABLE.hem)); g.closePath(); g.fill();       // its fall, in shade (their lamps are behind it)
    for (let i = 0; i < 9; i++) dab(X((i / 8 - 0.5) * 1.8 * w + (R() - 0.5) * 0.02), Y(lerp(TABLE.hem + 0.04, TABLE.y - 0.04, 0.3 + 0.4 * R())), M(0.12), M(0.034), Math.PI / 2 + (R() - 0.5) * 0.14, i % 2 ? SH[3] : SH[2], 0.85);
    g.fillStyle = WH[0]; g.beginPath(); g.ellipse(X(0), Y(TABLE.y + 0.004), M(w * 1.04), M(0.014), 0, 0, 7); g.fill();                              // its top, catching their light
    for (let i = 0; i < 5; i++) dab(X((i / 4 - 0.5) * 1.5 * w), Y(TABLE.y + 0.004 + (R() - 0.5) * 0.008), M(0.13), M(0.012), (R() - 0.5) * 0.06, WH[1 + Math.floor(R() * 3)], 0.9);
    // the tumbler and the rose, from behind
    const rx = ROSE.x - TABLE.x;
    dab(X(rx), Y(TABLE.y + 0.04), M(0.034), M(0.042), 0, css('#6d7a74'), 0.9); dab(X(rx - 0.008), Y(TABLE.y + 0.05), M(0.014), M(0.008), 0.3, css('#eef4f0'), 0.95);
    for (let i = 0; i < 6; i++) dab(X(rx + (R() - 0.5) * 0.06), Y(ROSE.y + 0.012 + (R() - 0.5) * 0.02), M(0.036), M(0.016), (R() - 0.5) * 3, css(i % 2 ? '#2f5e45' : '#3f7a55'));
    for (let i = 0; i < 9; i++) dab(X(rx + 0.008 + (R() - 0.5) * 0.034), Y(ROSE.y + 0.046 + (R() - 0.5) * 0.03), M(0.026), M(0.02), R() * 3, css(i < 6 ? '#d5807c' : '#f0a39c'));
    for (let i = 0; i < 3; i++) dab(X(rx - 0.03 + (R() - 0.5) * 0.016), Y(ROSE.y + 0.03 + (R() - 0.5) * 0.016), M(0.018), M(0.014), R() * 3, css('#d9d0b4'));
    // a waiter, from behind, on his way across the room (the right-hand third of the sheet: 0.64 m by 0.96 m): a
    // short black jacket, the long white apron tied at his back, a napkin over his arm
    const wx = x => 320 + x * 200, wy = h => 192 * (1 - h / 0.96), wm = m => m * 200, J = s => (R() - 0.5) * s;
    const wd = (x, h, l, w, a, c, al = 0.96) => dab(wx(x), wy(h), wm(l), wm(w), -a, c, al);
    const BLK = css('#1f1e23'), BLK2 = css('#34323a'), APR = css('#e6e8e4'), APS = css('#b4b8c6'), SKN = css('#c98a70'), HAIR = css('#3a2a20');
    g.globalAlpha = 0.4; g.fillStyle = css('#33261f'); g.beginPath(); g.ellipse(wx(0), wy(0.014), wm(0.15), wm(0.014), 0, 0, 7); g.fill(); g.globalAlpha = 1;
    for (const sx of [-1, 1]) { wd(sx * 0.05, 0.19, 0.3, 0.052, Math.PI / 2 + sx * 0.05, BLK); wd(sx * 0.06 + 0.01, 0.024, 0.07, 0.028, 0, BLK); }
    for (const sx of [-1, 1]) { wd(sx * 0.085, 0.3, 0.3, 0.07, Math.PI / 2 - sx * 0.04, sx < 0 ? APR : APS); wd(sx * 0.1, 0.2, 0.12, 0.03, Math.PI / 2 + J(0.2), sx < 0 ? css('#f6f6f0') : css('#c6c9d4'), 0.9); }
    for (let i = 0; i < 4; i++) wd(J(0.2), 0.15 + J(0.02), 0.05, 0.022, Math.PI / 2 + J(0.5), i % 2 ? APS : APR);
    for (let i = 0; i < 7; i++) wd((i / 6 - 0.5) * 0.23 + J(0.02), 0.62 + J(0.12), 0.2, 0.05, Math.PI / 2 + J(0.2), i < 3 ? BLK2 : BLK);
    for (const sx of [-1, 1]) { wd(sx * 0.09, 0.745, 0.1, 0.04, -sx * 0.55, sx < 0 ? BLK2 : BLK); wd(sx * 0.145, 0.6, 0.2, 0.046, Math.PI / 2 + sx * 0.1, sx < 0 ? BLK2 : BLK); }
    wd(0, 0.47, 0.2, 0.02, 0, APR); wd(-0.012, 0.455, 0.05, 0.02, 0.6, APR); wd(0.014, 0.452, 0.05, 0.02, -0.6, APS);                              // the apron's band, and its bow
    wd(-0.16, 0.47, 0.13, 0.036, Math.PI / 2 + 0.06, css('#f2f3ee')); wd(-0.168, 0.5, 0.05, 0.014, Math.PI / 2, css('#ffffff'), 0.9);               // the napkin over his arm
    wd(0, 0.82, 0.07, 0.05, Math.PI / 2, SKN); wd(0, 0.788, 0.044, 0.008, 0, css('#b4b7bc'), 0.8);                                                   // his neck, a line of collar
    g.fillStyle = HAIR; g.beginPath(); g.ellipse(wx(0), wy(0.888), wm(0.043), wm(0.048), 0, 0, 7); g.fill();                                     // the back of his head: hair, the nape under it, an ear each side
    for (let i = 0; i < 4; i++) wd(J(0.04), 0.892 + J(0.04), 0.05, 0.026, Math.PI / 2 + J(1), i % 2 ? HAIR : css('#2a1e18'), 0.9);
    wd(0, 0.842, 0.06, 0.02, 0, SKN); for (const sx of [-1, 1]) wd(sx * 0.045, 0.868, 0.026, 0.014, Math.PI / 2, SKN);
  });
  t.premultiplyAlpha = true; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; t.needsUpdate = true;
  return t;
}
// (the toy: red is how much of its own colour, with its shading; green a light or dark touch laid over that, blue how
// strongly; alpha where it is at all)
function paintToy() {
  const R = rng(771), W = 128, H = 64;
  const t = canvasTexture(W, H, g => {
    g.clearRect(0, 0, W, H); g.lineCap = 'round';
    const dab = (x, y, l, w, a, c, al = 1) => { g.save(); g.translate(x, y); g.rotate(a); const n = Math.max(2, Math.round(w / 2.5)); for (let i = 0; i < n; i++) { g.strokeStyle = c; g.globalAlpha = al * (0.75 + 0.25 * R()); g.lineWidth = w / n * 1.5; const o = (i / (n - 1) - 0.5) * w * 0.8, ll = l * (0.78 + 0.22 * R()); g.beginPath(); g.moveTo(-ll / 2, o); g.lineTo(ll / 2, o + (R() - 0.5) * w * 0.2); g.stroke(); } g.restore(); g.globalAlpha = 1; };
    const body = v => `rgb(${v},0,0)`, over = (v, k) => `rgb(0,${v},${k})`;
    for (let i = 0; i < 6; i++) dab(30 + i * 13.5, 60, 26, 5, 0, over(18, 150), 0.5);             // its shadow on their floor
    for (let i = 0; i < 9; i++) dab(24 + i * 10, 42 + (R() - 0.5) * 3, 24, 11, (R() - 0.5) * 0.2, body(150 + Math.floor(R() * 50)));      // the body, low and long
    for (let i = 0; i < 5; i++) dab(44 + i * 9, 28 + (R() - 0.5) * 2, 20, 9, (R() - 0.5) * 0.2, body(190 + Math.floor(R() * 50)));        // the cab
    dab(62, 22, 34, 4, -0.03, over(250, 150)); dab(40, 36, 22, 3, 0, over(240, 110));                                                   // the light along its top
    dab(60, 30, 20, 6, 0, over(40, 150)); dab(72, 30, 8, 5, 0, over(200, 120));                                                         // its window, and the glint in it
    for (const x of [34, 92]) { dab(x, 52, 13, 12, 0, over(14, 255)); dab(x, 52, 5, 4, 0, over(120, 200)); }                             // wheels
    for (const x of [16, 111]) dab(x, 42, 5, 5, 0, over(255, 255));                                                                     // its lamps
  }, false);
  t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; t.needsUpdate = true;
  return t;
}

lifeFor(15401, {
  title: /^At Mouquin/,
  word: 'mirror',
  // (a tall picture: the look stands back far enough to keep all of it, with the looking-glass and the table under it)
  stage: { out: 1.25, half: 1.15, cam: { dist: 2.25, height: 0.6, side: 0.24, fov: 60, lookU: 0.02, lookOut: 0.0, lookH: 0.885 } },
  wake: 2, ret: 2.6,
  linger: { near: 4, max: 40 },

  build(L) {
    const P = L.pal, col = (h, a = 0.14) => P.near(h, a), C = (list, a) => list.map(h => col(h, a));
    const WALL = L.wall, RAIL = L.rail - L.y;
    this.O = L.floor(0, 0);
    this.B = new THREE.Matrix4().makeBasis(V3(L.tx, 0, L.tz), V3(0, 1, 0), V3(L.nx, 0, L.nz)).setPosition(this.O);
    this.Binv = this.B.clone().invert();
    this.V = { m: new THREE.Matrix4(), l: new THREE.Matrix4(), e: new THREE.Euler(0, 0, 0, 'YXZ') };
    const door = (sx, a) => new THREE.Matrix4().makeTranslation(sx * WG, 0, HZ).multiply(new THREE.Matrix4().makeRotationY(-sx * a)).multiply(new THREE.Matrix4().makeTranslation(-sx * WG, 0, -HZ));
    this.door = door;
    const R = () => L.rand();
    const KEY = V3(-0.45, 0.76, 0.47).normalize();          // his light: from the upper left, in front
    const pick = (list, r) => list[Math.min(list.length - 1, Math.floor(r * list.length))];
    const set = (hi, mid, lo, deep, a) => ({ hi: C(hi, a), mid: C(mid, a), lo: C(lo, a), deep: C(deep, a) });
    const CR = set(['#efe8d6', '#ebe3cf'], ['#e0d8c3', '#dad2bd'], ['#c6bda8', '#beb5a2'], ['#a2988a']);                     // the cream woodwork
    const GL = set(['#dcbe74', '#d2b266'], ['#b9964f', '#b08c46'], ['#8a6c34', '#806230'], ['#5c4722']);                     // its gilt
    const MR = set(['#7c3d34', '#743630'], ['#55231f', '#4e201c'], ['#3a1614', '#341312'], ['#240d0c']);                     // the banquette
    const CL = set(['#f3f4ef', '#eef0ea', '#f6f5ee'], ['#d6dde2', '#d0d6de', '#dcdcda'], ['#aab2c6', '#a6aabf', '#b4b0c6'], ['#868ca6', '#82849c']);       // the cloth
    const LG = set(['#6a3324'], ['#4a2018'], ['#2c120e'], ['#1c0b09']);                                                    // the table's legs
    const TG = set(['#aab4ac'], ['#7c8880'], ['#5d6a62'], ['#44504a']);                                                    // the tumbler
    const CRH = C(['#f0eada', '#e8e1ce', '#e1d9c5', '#ded8ca', '#ebe3cc', '#e4dccb'], 0.08), GLH = C(['#dcbe74', '#c4a258', '#a8843e', '#8a6c34', '#e6cc8a'], 0.1);
    const MRH = C(['#7c3d34', '#5e2a24', '#8a4a3c', '#451a18', '#6a2f2a', '#3a1614'], 0.1), CLH = C(['#f6f6f2', '#e9e2d2', '#cdd3e2', '#d6cfdd', '#e4e9ea', '#c6ccdc', '#efe9dc'], 0.06);
    const ROSEC = C(['#f2a09a', '#f7b8ae', '#e98482', '#fbd0c6', '#ee9690'], 0.06), ROSE_D = col('#c96e6c', 0.08), LEAVES = C(['#3f7a55', '#2f5e45', '#6ea77c', '#24483a', '#4c8a5e'], 0.1), BUD = C(['#e9dfc4', '#d6ccac', '#f2ecd8'], 0.08);
    const BROKEN = C(['#f8f3e6', '#fbf8ee', '#d2cab9', '#cbc6c0', '#ecdcb4', '#f3ecd6'], 0.06);
    const MOULD = C(['#aaa39e', '#9f9894', '#b3aca4'], 0.1);
    const under = S => { const c = new THREE.Color(); return n => { const k = n.dot(KEY); return c.copy(S.deep[0]).lerp(S.lo[0], sstep(k, -0.75, -0.3)).lerp(S.mid[0], sstep(k, -0.25, 0.2)).lerp(S.hi[1 % S.hi.length], sstep(k, 0.25, 0.75)).multiplyScalar(0.98); }; };
    const mixer = (S, hues, amt = 0.4, v = 0.14) => {
      const u = under(S), ref = S.mid[0], c = new THREE.Color();
      return (n, r) => { const h = pick(hues, (r * 7.31) % 1), a = amt * (0.4 + 1.2 * ((r * 3.17) % 1)), k = 1 + (r - 0.5) * v, f = (x, y) => lerp(1, Math.max(0.6, Math.min(1.5, x / Math.max(0.02, y))), a) * k; c.copy(u(n)); return new THREE.Color(c.r * f(h.r, ref.r), c.g * f(h.g, ref.g), c.b * f(h.b, ref.b)); };
    };

    // ---------------------------------------------------------- parts: bodies and the strokes on them (one piece of
    // the rig each). Every vertex carries where its stroke's middle is (aCen) and how the stroke comes (aFly: from
    // where, relative to its place, and when), so the vertex shader can let it down from under the rail.
    const part = rest => { rest = rest ? rest.clone() : new THREE.Matrix4(); return { pos: [], nor: [], col: [], uv: [], cen: [], fly: [], rest, inv: rest.clone().invert(), n: 0 }; };
    const side = V3(), d2 = V3(), cl = V3(), src = V3(), wp = V3(), nW = V3(), ca = new THREE.Color(), cb = new THREE.Color();
    const vert = (Pt, p, n, c, uv, cen, f) => { Pt.pos.push(p.x, p.y, p.z); Pt.nor.push(n.x, n.y, n.z); Pt.col.push(c.r, c.g, c.b); Pt.uv.push(uv[0], uv[1]); Pt.cen.push(cen.x, cen.y, cen.z); Pt.fly.push(f[0], f[1], f[2], f[3]); Pt.n++; };
    const world = (Pt, n) => nW.copy(n).transformDirection(Pt.rest);
    const solid = (Pt, g, base, t, paint = null) => {
      const p = g.attributes.position, n = g.attributes.normal, c = g.attributes.color, v = V3(), nn = V3(), cc = new THREE.Color(), f = [0, 0, 0, t];
      for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); nn.fromBufferAttribute(n, i); if (paint) cc.copy(paint(world(Pt, nn), v, nn)); else cc.fromBufferAttribute(c, i); vert(Pt, v, nn, cc, UV_SOLID, base, f); }
    };
    const when = (t0, span, y) => t0 + Math.min(span, 0.3) * (0.62 * clamp01(y / 0.8) + 0.38 * R());
    const ribbon = (Pt, Ps, Ns, w, c, t, { lift = 0.0018, tip = 0.004, ridge = 0.06, cell = -1, tilt = 0.34 } = {}) => {
      const k = cell < 0 ? (R() < 0.55 ? 0 : 1) : cell, flip = R() < 0.5, A = [], Bq = [], ua = [], ub = [], mid = Ps[2].clone().add(Ps[3]).multiplyScalar(0.5);
      const ta = tilt * (0.5 + R()) * (R() < 0.5 ? -1 : 1), cw = Math.cos(ta) * w / 2, sw = Math.sin(ta) * w / 2;
      for (let i = 0; i < 6; i++) {
        d2.copy(Ps[Math.min(5, i + 1)]).sub(Ps[Math.max(0, i - 1)]); side.crossVectors(Ns[i], d2); if (side.lengthSq() < 1e-14) return; side.normalize();
        const s = flip ? 1 - i / 5 : i / 5;
        cl.copy(Ps[i]).addScaledVector(Ns[i], lift + tip * s * s);
        A.push(cl.clone().addScaledVector(side, -cw).addScaledVector(Ns[i], -sw)); Bq.push(cl.clone().addScaledVector(side, cw).addScaledVector(Ns[i], sw)); ua.push(UVQ(k, s, 0)); ub.push(UVQ(k, s, 1));
      }
      ca.copy(c).multiplyScalar(1 + ridge); cb.copy(c).multiplyScalar(1 - ridge * 0.7);
      wp.copy(mid).applyMatrix4(Pt.rest);
      src.set(Math.max(-0.26, Math.min(0.26, wp.x * 0.4)) + (R() - 0.5) * 0.08, RAIL - 0.03 - R() * 0.04, -WALL + 0.012 + R() * 0.02).applyMatrix4(Pt.inv);
      const f = [src.x - mid.x, src.y - mid.y, src.z - mid.z, t == null ? when(0.3, 0.4, wp.y) : t];
      for (let i = 0; i < 5; i++) { vert(Pt, A[i], Ns[i], cb, ua[i], mid, f); vert(Pt, Bq[i + 1], Ns[i + 1], ca, ub[i + 1], mid, f); vert(Pt, Bq[i], Ns[i], ca, ub[i], mid, f); vert(Pt, A[i], Ns[i], cb, ua[i], mid, f); vert(Pt, A[i + 1], Ns[i + 1], cb, ua[i + 1], mid, f); vert(Pt, Bq[i + 1], Ns[i + 1], ca, ub[i + 1], mid, f); }
    };
    const stroke = (Pt, p, n, dir, l, w, c, t, { bend = 0, ...o } = {}) => {
      side.crossVectors(n, dir); if (side.lengthSq() < 1e-8) return; side.normalize(); const dd = V3().crossVectors(side, n).normalize(), sd = side.clone(), Ps = [], Ns = [];
      for (let i = 0; i < 6; i++) { const s = i / 5 - 0.5; Ps.push(p.clone().addScaledVector(dd, s * l).addScaledVector(sd, bend * l * (1 - 4 * s * s))); Ns.push(n); }
      ribbon(Pt, Ps, Ns, w, c, t, o);
    };
    const q_ = new THREE.Quaternion();
    const along = (n, flow, jit) => { const d = flow.clone().addScaledVector(n, -flow.dot(n)); if (d.lengthSq() < 1e-4) d.set(n.y, -n.x, 0); if (d.lengthSq() < 1e-6) d.set(1, 0, 0); return d.normalize().applyQuaternion(q_.setFromAxisAngle(n, (R() - 0.5) * jit)); };
    const DOWN = V3(0, -1, 0), ACROSS = V3(1, 0, 0), UP = V3(0, 1, 0), OUT = V3(0, 0, 1);
    const yOf = (Pt, p) => wp.copy(p).applyMatrix4(Pt.rest).y;
    const dk = new THREE.Color();
    const ball = (Pt, Cn, Rd, paint, t0, { detail = 3, shrink = 0.94, dark = 0.8 } = {}) => solid(Pt, shape.move(shape.ball(1, 0xffffff, detail), Cn[0], Cn[1], Cn[2], 0, 0, 0, Rd[0] * shrink, Rd[1] * shrink, Rd[2] * shrink), V3(Cn[0], Cn[1] - Rd[1], Cn[2]), t0 + 0.1, (nw, v, nn) => dk.copy(paint(nw, v, nn)).multiplyScalar(dark));
    const coat = (Pt, Cn, Rd, n, tn, t0, { l = [0.03, 0.05], w = [0.014, 0.022], flow = DOWN, jit = 0.6, keep = null, span = 0.2, grow = 1.0, ...o } = {}) => {
      const c = V3(...Cn), Rm = (Rd[0] + Rd[1] + Rd[2]) / 3;
      for (let i = 0; i < n; i++) {
        const yy = 1 - 2 * R(), ph = R() * TAU, s = Math.sqrt(Math.max(0, 1 - yy * yy)), u0 = V3(s * Math.cos(ph), yy, s * Math.sin(ph));
        const p = V3(u0.x * Rd[0] * grow, u0.y * Rd[1] * grow, u0.z * Rd[2] * grow).add(c), nn = V3(u0.x / Rd[0], u0.y / Rd[1], u0.z / Rd[2]).normalize();
        const r1 = R(), r2 = R(), r3 = R();
        if (keep && !keep(p, nn)) continue;
        const d = along(u0, flow, jit), len = lerp(l[0], l[1], r1), Ps = [], Ns = [];
        for (let k = 0; k < 6; k++) { const al = (k / 5 - 0.5) * len / Rm, u = u0.clone().multiplyScalar(Math.cos(al)).addScaledVector(d, Math.sin(al)); Ps.push(V3(u.x * Rd[0] * grow, u.y * Rd[1] * grow, u.z * Rd[2] * grow).add(c)); Ns.push(V3(u.x / Rd[0], u.y / Rd[1], u.z / Rd[2]).normalize()); }
        ribbon(Pt, Ps, Ns, lerp(w[0], w[1], r2), tn(world(Pt, nn).clone(), r3, nn), when(t0, span, yOf(Pt, p)), o);
      }
    };
    // a box, as a body: its faces a flat tone each
    const slab = (Pt, x0, x1, y0, y1, z0, z1, S, t, dark = 0.8) => { const u = under(S), g = shape.box(x1 - x0, y1 - y0, z1 - z0, 0xffffff); g.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); solid(Pt, g, V3((x0 + x1) / 2, y0, (z0 + z1) / 2), t, nw => dk.copy(u(nw)).multiplyScalar(dark)); };
    // strokes laid on a flat face: n of them over the rectangle (a to b across, c to d up) at depth z, facing nrm
    const face = (Pt, n, x0, x1, y0, y1, z, nrm, dirv, pickc, t0, { l = [0.1, 0.16], w = [0.022, 0.034], jit = 0.12, grid = false, ...o } = {}) => {
      for (let i = 0; i < n; i++) {
        const kx = grid ? (i + 0.5 + (R() - 0.5) * 0.5) / n : R(), ky = R();
        const p = nrm.z !== 0 ? V3(lerp(x0, x1, kx), lerp(y0, y1, ky), z) : nrm.y !== 0 ? V3(lerp(x0, x1, kx), z, lerp(y0, y1, ky)) : V3(z, lerp(y0, y1, ky), lerp(x0, x1, kx));
        stroke(Pt, p, nrm, along(nrm, dirv, jit), lerp(l[0], l[1], R()), lerp(w[0], w[1], R()), pickc(R()), when(t0, 0.25, yOf(Pt, p)), o);
      }
    };
    // a lofted form (rings from its foot up), smooth, with real folds if asked: as the Corot's skirt and table
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
      const lay = (v, th, dv, dth, w, c, t, o) => { const Ps = [], Ns = []; for (let k = 0; k < 6; k++) { const s = k / 5 - 0.5; Ps.push(at(v - s * dv, th + s * dth)); Ns.push(normal(v - s * dv, th + s * dth)); } ribbon(Pt, Ps, Ns, w, c, t == null ? when(t0, 0.3, yOf(Pt, Ps[2])) : t, o); };
      return { at, normal, lay };
    };
    const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));
    const flat = (list, v = 0.1) => r => pick(list, r).clone().multiplyScalar(1 + (((r * 13.7) % 1) - 0.5) * v);

    // ---------------------------------------------------------- the wall of Mouquin's: the banquette, and the cream
    // woodwork over it (what does not move)
    const base = part();
    {
      const TB = 0.08, tm = mixer(MR, MRH, 0.5, 0.26), uM = under(MR), c = new THREE.Color();
      slab(base, -0.98, 0.98, 0, 0.085, -WALL, 0.25, MR, TB, 0.62);
      face(base, 26, -0.97, 0.97, 0.012, 0.075, 0.25, OUT, ACROSS, r => pick(MR.lo, r).clone().lerp(MR.deep[0], 0.4 * ((r * 5.3) % 1)), TB, { l: [0.12, 0.2], w: [0.03, 0.045], tip: 0.002 });
      for (const sx of [-1, 1]) face(base, 3, 0.04, 0.2, 0.025, 0.06, sx * 0.98, V3(sx, 0, 0), OUT, flat(MR.lo), TB, { l: [0.1, 0.14], w: [0.03, 0.04], tip: 0.002, jit: 0.05 });
      for (let i = 0; i < 7; i++) {      // its cushions: rounded, dark red, a light along their tops
        const cx = -0.84 + i * 0.28, Cn = [cx, 0.094, 0.125], Rd = [0.152, 0.044, 0.135];
        ball(base, Cn, Rd, nw => c.copy(uM(nw)), TB + 0.05, { dark: 0.74 });
        coat(base, Cn, Rd, 34, tm, TB + 0.1, { l: [0.07, 0.12], w: [0.026, 0.04], flow: ACROSS, jit: 0.7, keep: (p, n) => n.y > -0.1, tip: 0.003 });
        stroke(base, V3(cx - 0.03 + 0.04 * R(), 0.138, 0.13), V3(-0.1, 0.99, 0.1).normalize(), ACROSS, 0.12, 0.016, MRH[2], TB + 0.34, { cell: 1, lift: 0.003 });
        stroke(base, V3(cx + 0.02 * R(), 0.128, 0.19), V3(-0.1, 0.9, 0.42).normalize(), ACROSS, 0.1, 0.012, MRH[2].clone().multiplyScalar(1.1), TB + 0.36, { cell: 1, lift: 0.003 });
      }
      // the woodwork: a board behind everything, a rail under the glasses with its gilt bead, a cornice, a fluted
      // gilt pilaster at each end, and plain cream panelling where the doors lie when they are open
      const TW = 0.36, cr = flat(CRH, 0.08), gl = flat(GLH, 0.12), FOOT = 0.115;
      slab(base, -0.905, 0.905, FOOT, Y1, -WALL, 0.006, CR, TW, 0.9);
      for (const sx of [-1, 1]) for (let j = 0; j < 4; j++) face(base, 9, sx * 0.46, sx * 0.9, 0.22 + j * 0.16, 0.26 + j * 0.16, 0.006, OUT, UP, cr, TW, { l: [0.2, 0.26], w: [0.06, 0.075], grid: true, jit: 0.06, tip: 0.001, tilt: 0.08, lift: 0.0012, cell: 0 });
      slab(base, -0.905, 0.905, FOOT, Y0 - 0.002, -WALL, 0.036, CR, TW, 0.9);
      face(base, 18, -0.9, 0.9, 0.134, 0.138, 0.036, OUT, ACROSS, cr, TW, { l: [0.14, 0.2], w: [0.022, 0.026], grid: true, jit: 0.03, tip: 0.001, tilt: 0.08, cell: 0 });
      face(base, 14, -0.9, 0.9, 0.1455, 0.1465, 0.036, OUT, ACROSS, gl, TW + 0.2, { l: [0.1, 0.15], w: [0.006, 0.008], grid: true, jit: 0.02, tip: 0.0005, lift: 0.003, tilt: 0.1, cell: 0 });
      slab(base, -0.99, 0.99, Y1 + 0.002, 0.846, -WALL, 0.056, CR, TW + 0.1, 0.9);
      face(base, 20, -0.98, 0.98, 0.822, 0.83, 0.056, OUT, ACROSS, cr, TW + 0.1, { l: [0.14, 0.2], w: [0.034, 0.04], grid: true, jit: 0.03, tip: 0.001, tilt: 0.08, cell: 0 });
      face(base, 12, -0.97, 0.97, 0.816, 0.836, 0.056, OUT, ACROSS, r => pick(BROKEN, r), TW + 0.2, { l: [0.06, 0.11], w: [0.012, 0.018], jit: 0.2, tip: 0.001, tilt: 0.12, lift: 0.0028, cell: 1 });
      face(base, 14, -0.98, 0.98, 0.806, 0.808, 0.056, OUT, ACROSS, gl, TW + 0.3, { l: [0.12, 0.16], w: [0.006, 0.008], grid: true, jit: 0.02, tip: 0.0005, lift: 0.003, tilt: 0.1, cell: 0 });
      face(base, 18, -0.98, 0.98, -WALL + 0.02, 0.036, 0.846, UP, ACROSS, cr, TW + 0.1, { l: [0.16, 0.2], w: [0.07, 0.08], grid: true, jit: 0.03, tip: 0.001, tilt: 0.08, cell: 0 });
      for (const sx of [-1, 1]) {
        slab(base, sx < 0 ? -0.978 : 0.905, sx < 0 ? -0.905 : 0.978, FOOT, Y1 + 0.002, -WALL, 0.048, CR, TW, 0.9);
        for (const dx of [0.912, 0.971]) for (let j = 0; j < 4; j++) stroke(base, V3(sx * dx, 0.22 + j * 0.165 + 0.03 * R(), 0.048), OUT, UP, 0.2, 0.014, cr(R()), when(TW, 0.25, 0.5), { tip: 0.001, tilt: 0.1 });
        for (let k = 0; k < 4; k++) for (let j = 0; j < 4; j++) stroke(base, V3(sx * (0.924 + k * 0.0115), 0.225 + j * 0.165 + 0.03 * R(), 0.048), OUT, UP, 0.2, 0.0085, pick(k % 2 ? GL.lo : GL.hi, R()).clone().multiplyScalar(1 + 0.1 * (R() - 0.5)), when(TW + 0.15, 0.25, 0.5), { cell: 0, tip: 0.0006, tilt: 0.12, lift: 0.0026, ridge: 0.12 });
        for (const yy of [0.138, 0.782]) stroke(base, V3(sx * 0.9415, yy, 0.048), OUT, ACROSS, 0.07, 0.018, pick(GL.mid, R()), TW + 0.3, { cell: 2, lift: 0.004, tip: 0 });
        face(base, 4, -WALL + 0.01, 0.046, 0.16, 0.78, sx * 0.978, V3(sx, 0, 0), UP, cr, TW, { l: [0.16, 0.2], w: [0.03, 0.04], grid: false, tip: 0.001 });
      }
      // round the middle glass: a cream edge above and below it, and his thin line of gold along its foot
      for (const [yy, w] of [[0.1565, 0.012], [0.7915, 0.014]]) face(base, 8, -0.44, 0.44, yy - 0.001, yy + 0.001, 0.006, OUT, ACROSS, cr, TW + 0.1, { l: [0.12, 0.16], w: [w, w + 0.002], grid: true, jit: 0.02, tip: 0.0005, lift: 0.0052, tilt: 0.05 });
      face(base, 8, -0.43, 0.43, 0.1645, 0.1655, 0.006, OUT, ACROSS, gl, TW + 0.3, { l: [0.11, 0.14], w: [0.005, 0.006], grid: true, jit: 0.02, tip: 0.0003, lift: 0.0062, tilt: 0.05, cell: 0 });
    }

    // ---------------------------------------------------------- the doors: cream outside, with a moulding and a strip
    // of gilt down the edge where they meet; looking-glass inside, in a cream frame, gilt down the hinge
    const doorPart = sx => {
      const Pt = part(door(sx, PI)), TD = 0.6, cr = flat(CRH, 0.08), gl = flat(GLH, 0.12), X = x => sx * x, IN = V3(0, 0, -1), rows = [0.235, 0.395, 0.555, 0.715];
      slab(Pt, Math.min(X(WG), X(2 * WG)), Math.max(X(WG), X(2 * WG)), Y0, Y1 - 0.001, HZ - 0.004, HZ + 0.004, CR, TD, 0.9);
      // outside (it faces the wall when the door lies open): the panel
      for (let i = 0; i < 9; i++) for (const y of rows) stroke(Pt, V3(X(0.478 + i * 0.047 + 0.012 * (R() - 0.5)), y + 0.04 * (R() - 0.5), HZ - 0.004), IN, along(IN, UP, 0.06), 0.2 + 0.05 * R(), 0.07, cr(R()), when(TD, 0.2, 0.5), { tip: 0.001, tilt: 0.08, lift: 0.0014, cell: 0 });
      for (const [x0, x1, y0, y1] of [[0.52, 0.52, 0.22, 0.73], [0.82, 0.82, 0.22, 0.73], [0.52, 0.82, 0.22, 0.22], [0.52, 0.82, 0.73, 0.73]]) {
        const vert_ = x0 === x1, n = vert_ ? 4 : 2;
        for (let k = 0; k < n; k++) { const t = (k + 0.5) / n; stroke(Pt, V3(X(lerp(x0, x1, t)), lerp(y0, y1, t), HZ - 0.004), IN, vert_ ? UP : ACROSS, (vert_ ? 0.51 : 0.3) / n * 1.15, 0.008, pick(MOULD, R()), TD + 0.3, { cell: 0, tip: 0.0004, tilt: 0.06, lift: 0.0032 }); }
      }
      for (let k = 0; k < 3; k++) for (const y of rows) stroke(Pt, V3(X(0.864 + k * 0.0125), y + 0.03 * (R() - 0.5), HZ - 0.004), IN, UP, 0.19, 0.009, pick(k % 2 ? GL.lo : GL.hi, R()).clone().multiplyScalar(1 + 0.1 * (R() - 0.5)), when(TD + 0.2, 0.2, 0.5), { cell: 0, tip: 0.0005, tilt: 0.12, lift: 0.0034, ridge: 0.12 });
      for (let i = 0; i < 16; i++) stroke(Pt, V3(X(0.475 + 0.4 * R()), 0.19 + 0.57 * R(), HZ - 0.004), IN, along(IN, UP, 0.6), 0.06 + 0.07 * R(), 0.02 + 0.016 * R(), pick(BROKEN, R()), when(TD + 0.15, 0.2, 0.5), { cell: 1, tip: 0.0012, tilt: 0.14, lift: 0.0027 });      // broken lights and greys over it
      for (const [x0, x1, y0, y1] of [[0.534, 0.534, 0.234, 0.716], [0.806, 0.806, 0.234, 0.716], [0.534, 0.806, 0.234, 0.234], [0.534, 0.806, 0.716, 0.716]]) {      // a line of gilt inside the moulding
        const vert_ = x0 === x1, n = vert_ ? 4 : 2;
        for (let k = 0; k < n; k++) { const t = (k + 0.5) / n; stroke(Pt, V3(X(lerp(x0, x1, t)), lerp(y0, y1, t), HZ - 0.004), IN, vert_ ? UP : ACROSS, (vert_ ? 0.482 : 0.272) / n * 1.1, 0.0052, pick(k % 2 ? GL.mid : GL.hi, R()), TD + 0.36, { cell: 0, tip: 0.0003, tilt: 0.05, lift: 0.0038, ridge: 0.1 }); }
      }
      // its edges
      for (const y of rows) stroke(Pt, V3(X(2 * WG), y, HZ), V3(sx, 0, 0), UP, 0.19, 0.008, cr(R()), TD + 0.2, { cell: 0, tip: 0, tilt: 0, lift: 0.0006 });
      for (let j = 0; j < 3; j++) stroke(Pt, V3(X(0.525 + j * 0.15), Y1 - 0.001, HZ), UP, ACROSS, 0.16, 0.008, cr(R()), TD + 0.2, { cell: 0, tip: 0, tilt: 0, lift: 0.0006 });
      // inside (it faces the room when the door lies open): the frame round its glass
      for (let k = 0; k < 4; k++) for (const y of rows) stroke(Pt, V3(X(0.4555 + k * 0.012), y + 0.03 * (R() - 0.5), HZ + 0.004), OUT, UP, 0.19, 0.0088, pick(k % 2 ? GL.lo : GL.hi, R()).clone().multiplyScalar(1 + 0.1 * (R() - 0.5)), TD + 0.3, { cell: 0, tip: 0.0005, tilt: 0.08, lift: 0.0034, ridge: 0.12 });
      for (const y of rows) stroke(Pt, V3(X(0.891), y + 0.03 * (R() - 0.5), HZ + 0.004), OUT, UP, 0.19, 0.017, cr(R()), TD + 0.3, { cell: 0, tip: 0.0005, tilt: 0.06, lift: 0.0034 });
      for (const yy of [0.1605, 0.7885]) for (let j = 0; j < 3; j++) stroke(Pt, V3(X(0.56 + j * 0.13), yy, HZ + 0.004), OUT, ACROSS, 0.15, 0.02, cr(R()), TD + 0.3, { cell: 0, tip: 0.0005, tilt: 0.06, lift: 0.0034 });
      for (let j = 0; j < 3; j++) stroke(Pt, V3(X(0.56 + j * 0.13), 0.1725, HZ + 0.004), OUT, ACROSS, 0.14, 0.0055, gl(R()), TD + 0.34, { cell: 0, tip: 0.0003, tilt: 0.05, lift: 0.0042 });
      return Pt;
    };
    const doorL = doorPart(-1), doorR = doorPart(1);

    // ---------------------------------------------------------- the table: his white cloth, lilac and blue in its
    // folds, falling in pleats at the corners; four dark legs under it; the tumbler, and the leaf the rose has dropped
    const table = part(), TT = 0.7;
    {
      const T = TABLE, ring = (y, k) => ({ y, c: [T.x, T.z], r1: T.rx * k, r2: T.rz * k }), span = T.y - T.hem;
      const pleat = th => { let s = 0; for (let k = 0; k < 4; k++) { const d = wrap(th - (PI / 4 + k * PI / 2)); s += Math.exp(-(d / 0.34) * (d / 0.34)) * Math.cos(7 * d + k * 1.3); } return s; };
      const fl = (v, th) => 1 + (0.004 + 0.14 * Math.pow(1 - v, 1.3)) * fall(v, 0.6, 0.82) * pleat(th) + (0.012 * Math.sin(th * 9 + 1.2) + 0.03 * Math.pow(1 - v, 1.2) * Math.sin(th * 4 + 0.7) * Math.sin(th * 2.5 + 2.0)) * fall(v, 0.5, 0.8);
      const uC = under(CL), c = new THREE.Color();
      const paint = (nw, v, th, p, nl) => { c.copy(uC(nw)); if (nl.y > 0.6) return c.lerp(CL.hi[0], 0.6); c.lerp(CL.lo[0], 0.5); return c.multiplyScalar((1 - 0.2 * fall(pleat(th), -0.8, 0.1) * fall(v, 0.3, 0.75)) * (0.86 + 0.14 * sstep(v, 0, 0.2))); };
      const S = loft(table, [ring(T.hem, 1.05), ring(T.hem + 0.012, 1.045), ring(T.hem + span * 0.3, 1.03), ring(T.hem + span * 0.6, 1.012), ring(T.y - 0.022, 1.0), ring(T.y - 0.005, 0.992), ring(T.y, 0.97), ring(T.y, 0.9), ring(T.y, 0.78)], TT, paint, { pow: 3.6, flute: fl, seg: 72, rows: 16, cap: true, shrink: 0.975, dark: 0.82 });
      const tn = mixer(CL, CLH, 0.5, 0.12), n = V3(), p = V3();
      for (let i = 0; i < 150; i++) { const dv = lerp(0.3, 0.5, R()), v = lerp(0.04 + dv / 2, 0.66 - dv / 2, R()), th = R() * TAU; S.normal(v, th, n); S.lay(v, th, dv, (R() - 0.5) * 0.03, lerp(0.03, 0.05, R()), tn(n, R()).lerp(pick(CL.lo, R()), 0.15 + 0.55 * R()), null, { ridge: 0.05, tip: 0.002, tilt: 0.2 }); }       // the cloth hanging: in the shade of its own top, lilac and blue
      for (let i = 0; i < 40; i++) { const th = R() * TAU; S.normal(0.03, th, n); S.lay(0.035, th, 0.02, 0.1 + 0.08 * R(), 0.02, tn(n, R()).multiplyScalar(0.9), null, { cell: 1, tip: 0.001 }); }                                             // its hem
      for (let i = 0; i < 130; i++) {     // its top: long loaded drags of white, a little blue and lilac dragged through
        p.set(T.x + (R() - 0.5) * 1.6 * T.rx, T.y, T.z + (R() - 0.5) * 1.74 * T.rz);
        stroke(table, p.clone(), UP, along(UP, V3(1, 0, 0.12 * (R() - 0.5)), 0.3), lerp(0.08, 0.12, R()), lerp(0.024, 0.04, R()), pick(CLH, R()).clone().lerp(CL.hi[0], 0.45 + 0.4 * R()).multiplyScalar(1.02), when(TT + 0.12, 0.2, p.y), { cell: R() < 0.65 ? 0 : 1, tip: 0.001, tilt: 0.1, ridge: 0.05 });
      }
      for (let i = 0; i < 3; i++) stroke(table, V3(T.x + (i - 1) * 0.125, T.y, T.z + 0.006 * (R() - 0.5)), UP, ACROSS, 0.13, 0.006, CL.lo[1].clone().lerp(CL.hi[0], 0.3), TT + 0.34, { cell: 0, tip: 0, lift: 0.0026, tilt: 0.04, ridge: 0.02 });      // where it lay folded: a crease along it
      for (let i = 0; i < 2; i++) stroke(table, V3(T.x - 0.03 + 0.006 * (R() - 0.5), T.y, T.z + (i - 0.5) * 0.13), UP, OUT, 0.12, 0.006, CL.lo[0].clone().lerp(CL.hi[0], 0.3), TT + 0.36, { cell: 0, tip: 0, lift: 0.0026, tilt: 0.04, ridge: 0.02 });      // and one across
      // the legs
      const uL = under(LG);
      for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
        const lx = T.x + sx * (T.rx - 0.05), lz = T.z + sz * (T.rz - 0.04), g = shape.lathe([[0.008, 0], [0.011, 0.07], [0.013, 0.13]], 10, 0xffffff); g.translate(lx, 0, lz);
        solid(table, g, V3(lx, 0, lz), TT - 0.1, nw => dk.copy(uL(nw)));
        stroke(table, V3(lx - 0.006, 0.055, lz + 0.01), V3(-0.5, 0, 0.86).normalize(), UP, 0.1, 0.008, LG.hi[0], TT, { cell: 0, tip: 0, lift: 0.002, tilt: 0.1 });
      }
      // the tumbler: glass, so only its lights and its darks
      const uT = under(TG), gx = ROSE.x, gz = ROSE.z, g = shape.lathe([[0.0165, 0], [0.019, 0.025], [0.0205, 0.05]], 14, 0xffffff); g.translate(gx, T.y, gz);
      solid(table, g, V3(gx, T.y, gz), TT + 0.5, nw => dk.copy(uT(nw)).multiplyScalar(0.9));
      for (const [a, yy, l, w, cc] of [[-0.7, 0.03, 0.03, 0.007, '#eef4f0'], [-0.5, 0.012, 0.012, 0.007, '#f6faf6'], [0.9, 0.028, 0.034, 0.008, '#3f4c46'], [0.2, 0.02, 0.026, 0.012, '#93a098'], [-1.3, 0.024, 0.03, 0.008, '#59665e']]) {
        const nn = V3(Math.sin(a), 0, Math.cos(a)); stroke(table, V3(gx + nn.x * 0.02, T.y + yy, gz + nn.z * 0.02), nn, UP, l, w, col(cc, 0.06), TT + 0.6, { cell: 2, tip: 0, lift: 0.0012, tilt: 0.1, ridge: 0.02 });
      }
      for (let i = 0; i < 6; i++) { const a = i / 6 * TAU, nn = V3(Math.sin(a), 0.3, Math.cos(a)).normalize(); stroke(table, V3(gx + Math.sin(a) * 0.0205, T.y + 0.05, gz + Math.cos(a) * 0.0205), nn, V3(Math.cos(a), 0, -Math.sin(a)), 0.02, 0.0045, col(i % 2 ? '#dfe7e2' : '#aab4ac', 0.06), TT + 0.62, { cell: 0, tip: 0, lift: 0.001, tilt: 0.1 }); }
      stroke(table, V3(gx + 0.075, T.y, gz + 0.085), UP, V3(0.8, 0, 0.6).normalize(), 0.036, 0.016, LEAVES[0], TT + 0.9, { cell: 2, tip: 0.0005, lift: 0.0026, tilt: 0.1 });                                 // the leaf on the cloth
      stroke(table, V3(gx + 0.02, T.y, gz + 0.05), UP, V3(1, 0, 0.3).normalize(), 0.07, 0.03, CL.lo[0].clone().lerp(CL.deep[0], 0.3), TT + 0.6, { cell: 2, tip: 0.0005, lift: 0.0018, tilt: 0.05 });      // the tumbler's shade on it
    }
    // ---------------------------------------------------------- the rose (it nods on its stem): pink, in round soft
    // touches; the small cream flower beside it; dark leaves
    const TRo = 1.25, rose = part(new THREE.Matrix4().makeTranslation(ROSE.x, ROSE.y, ROSE.z));
    {
      const c = new THREE.Color(), HEAD = [0.008, 0.045, 0.002], HR = [0.031, 0.027, 0.029];
      const tone = (nw, r) => pick(ROSEC, r).clone().lerp(ROSE_D, 0.55 * fall(nw.dot(KEY), -0.2, 0.5)).multiplyScalar(1 + 0.06 * (r - 0.5));
      for (let i = 0; i < 7; i++) {       // the leaves, round the tumbler's mouth
        const a = -0.4 + i * 0.95 + 0.3 * R(), d = V3(Math.sin(a), 0.25 - 0.5 * R(), Math.cos(a)).normalize(), n = V3(-d.x * 0.3, 1, -d.z * 0.3).normalize();
        stroke(rose, d.clone().multiplyScalar(0.026).add(V3(0, 0.008, 0)), n, d, 0.05, 0.02, pick(LEAVES, R()), TRo + 0.04 * i, { cell: 2, tip: 0.003, lift: 0.001, tilt: 0.5, bend: 0.1 });
      }
      for (let i = 0; i < 2; i++) stroke(rose, V3(0.003 * i, 0.012, 0), OUT, UP, 0.03, 0.006, LEAVES[3], TRo, { cell: 0, tip: 0, lift: 0.001 });
      ball(rose, HEAD, HR, nw => c.copy(ROSE_D).lerp(ROSEC[2], sstep(nw.dot(KEY), -0.2, 0.6)), TRo + 0.2, { detail: 3, shrink: 0.9, dark: 0.95 });
      coat(rose, HEAD, HR, 60, (nw, r) => tone(nw, r), TRo + 0.25, { l: [0.018, 0.028], w: [0.014, 0.02], flow: ACROSS, jit: 3, cell: 2, tip: 0.002, lift: 0.001, ridge: 0.04, tilt: 0.3, span: 0.3 });
      for (let i = 0; i < 5; i++) { const n = V3(0.5 * (R() - 0.5) - 0.2, 0.7, 0.5 + 0.3 * R()).normalize(); stroke(rose, V3(HEAD[0] + n.x * HR[0], HEAD[1] + n.y * HR[1], HEAD[2] + n.z * HR[2]), n, along(n, ACROSS, 2), 0.016, 0.012, ROSEC[3], TRo + 0.5, { cell: 2, tip: 0.001, lift: 0.0025, ridge: 0.02 }); }       // its lights
      const B2 = [-0.03, 0.03, 0.006], BR = [0.017, 0.015, 0.016];
      ball(rose, B2, BR, () => c.copy(BUD[1]).multiplyScalar(0.8), TRo + 0.15, { detail: 2, shrink: 0.88, dark: 0.95 });
      coat(rose, B2, BR, 22, (nw, r) => pick(BUD, r).clone().multiplyScalar(0.84 + 0.2 * sstep(nw.dot(KEY), -0.3, 0.6)), TRo + 0.2, { l: [0.012, 0.018], w: [0.01, 0.014], flow: ACROSS, jit: 3, cell: 2, tip: 0.0015, lift: 0.001, ridge: 0.03 });
    }

    // ---------------------------------------------------------- the rig: every solid thing, one draw call
    const parts = { base, doorL, doorR, table, rose };
    let total = 0; for (const p of Object.values(parts)) total += p.n;
    const ru = this.ru = { uT: { value: 0 }, uTumble: { value: 1 } };
    const rm = new THREE.MeshStandardMaterial({ vertexColors: true, color: 0xa4a4a4, map: brushPrint(), alphaTest: 0.4, roughness: 0.92, metalness: 0, emissive: 0xffffff, emissiveIntensity: 0.44, side: THREE.DoubleSide });
    rm.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, ru);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec3 aCen; attribute vec4 aFly; uniform float uT, uTumble; varying float vBody;')
        .replace('#include <begin_vertex>', `#include <begin_vertex>
  {
    // a stroke: let down from under the rail to its place, turning as it comes and growing as it lands; a body (no
    // flight) stays where it is and is scumbled in, thin at first (vBody, for the fragments)
    vec3 rel = transformed - aCen;
    float k = clamp((uT - aFly.w) / ${FLY.toFixed(2)}, 0.0, 1.0), fl = step(1.0e-6, dot(aFly.xyz, aFly.xyz));
    float eh = k * k * (3.0 - 2.0 * k), ev = 1.0 - (1.0 - k) * (1.0 - k);
    float s = fl > 0.5 ? (k <= 0.0 ? 0.0 : 0.3 + 0.7 * k * k) : 1.0;
    vBody = fl > 0.5 ? 1.0 : k;
    float sg = fract(aFly.w * 37.7) > 0.5 ? 1.0 : -1.0;
    float a = (1.0 - k) * (1.0 - k) * 2.6 * uTumble * fl * sg, cs = cos(a), sn = sin(a);
    rel = vec3(cs * rel.x - sn * rel.z, rel.y, sn * rel.x + cs * rel.z);
    float b = (1.0 - k) * (0.8 + 1.3 * uTumble) * fl * sg * (0.5 + fract(aFly.w * 91.3)), cb = cos(b), sb = sin(b);
    rel = vec3(cb * rel.x - sb * rel.y, sb * rel.x + cb * rel.y, rel.z);
    transformed = aCen + rel * s + aFly.xyz * vec3(1.0 - eh, 1.0 - ev, 1.0 - eh) + vec3(0.03 * sg * sin(3.1416 * k) * fl * uTumble, 0.0, 0.0);
  }`);
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vBody;')
        .replace('#include <map_fragment>', '#include <map_fragment>\n  if (vBody < 0.999) { vec2 bq = mod(floor(gl_FragCoord.xy), 4.0); float bt = (mod(bq.x + bq.y * 2.0, 4.0) * 4.0 + mod(bq.x * 3.0 + bq.y, 4.0) + 0.5) / 16.0; if (vBody < bt) discard; }')
        .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n  totalEmissiveRadiance *= vColor.rgb;\n#ifdef USE_MAP\n  totalEmissiveRadiance *= sampledDiffuseColor.rgb;\n#endif');
    };
    rm.customProgramCacheKey = () => 'mouquins-wood';
    const rig = this.rig = L.rig(6, total + 64, rm);
    this.I = {}; this.rest = {};
    for (const [name, p] of Object.entries(parts)) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(p.pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(p.nor, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(p.col, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(p.uv, 2)); g.setAttribute('aCen', new THREE.Float32BufferAttribute(p.cen, 3)); g.setAttribute('aFly', new THREE.Float32BufferAttribute(p.fly, 4));
      this.I[name] = rig.add(rig.geo(g)); this.rest[name] = p.rest; rig.mat(this.I[name], this.V.m.multiplyMatrices(this.B, p.rest));
      p.pos = p.nor = p.col = p.uv = p.cen = p.fly = null;
    }

    // ---------------------------------------------------------- the looking-glass (three panes), the light it throws
    // on the gallery floor, and the line of light down the join of the doors: one mesh, one shader
    {
      const pos = [], uv = [], pan = [], idx = [];
      const quad = (a, b, c, d, k) => { const i = pos.length / 3; for (const [p, t] of [[a, [0, 0]], [b, [1, 0]], [c, [1, 1]], [d, [0, 1]]]) { pos.push(...p); uv.push(...t); pan.push(k); } idx.push(i, i + 1, i + 2, i, i + 2, i + 3); };
      quad([-2.0, 0.013, 2.4], [2.0, 0.013, 2.4], [2.0, 0.013, 0.02], [-2.0, 0.013, 0.02], 3);
      quad([-GC.x, GC.y0, GC.z], [GC.x, GC.y0, GC.z], [GC.x, GC.y1, GC.z], [-GC.x, GC.y1, GC.z], 0);
      quad([-GD.x1, GD.y0, GD.z], [-GD.x0, GD.y0, GD.z], [-GD.x0, GD.y1, GD.z], [-GD.x1, GD.y1, GD.z], 1);
      quad([GD.x0, GD.y0, GD.z], [GD.x1, GD.y0, GD.z], [GD.x1, GD.y1, GD.z], [GD.x0, GD.y1, GD.z], 2);
      quad([-0.03, Y0 + 0.006, 0.034], [0.03, Y0 + 0.006, 0.034], [0.03, Y1 - 0.006, 0.034], [-0.03, Y1 - 0.006, 0.034], 4);
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('aPanel', new THREE.Float32BufferAttribute(pan, 1)); g.setIndex(idx);
      const size = LOWMEM ? 1024 : 2048;
      this.roomTex = paintRoom(size, h => col(h, 0.1));
      const floorTex = strokeTex({ size: 256, base: '#3c2e27', n: 700, colors: [['#44352c', 3], ['#382a23', 3], ['#4c3c31', 2], ['#54443a', 1], ['#32251f', 2]], len: [30, 70], width: [10, 18], angle: (x, y, r) => (r() - 0.5) * 0.25, bend: 0.1, seed: 272, lift: 0.04 });
      const u = this.mu = {
        uA: { value: new THREE.Vector2(PI, PI) }, uInv: { value: new THREE.Matrix4() }, uT: { value: 0 }, uSway: { value: 1 }, uGlint: { value: 1 }, uOpen: { value: 0 }, uGlow: { value: 0 }, uSeam: { value: 0 },
        uFloor: { value: floorTex }, uBits: { value: paintTable(h => col(h, 0.1)) }, uToyTex: { value: paintToy() },
        uToy: { value: new THREE.Vector4(0, 0, 1, 0) }, uToyCol: { value: new THREE.Color(0xd2261c) }, uToyW: { value: new THREE.Vector2(0.25, 0.125) }, uWaiter: { value: new THREE.Vector3(-9, 0, 0) },
      };
      const rowU = ROWS.map(r => `vec3(${(r[0] / 2048).toFixed(5)}, ${(r[1] / 2048).toFixed(5)}, ${r[2].toFixed(3)})`);
      const m = new THREE.MeshBasicMaterial({ map: this.roomTex, transparent: true, depthWrite: false, fog: false, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor });
      m.onBeforeCompile = sh => {
        Object.assign(sh.uniforms, u);
        sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float aPanel; uniform vec2 uA; uniform mat4 uInv; varying vec3 vLoc; varying vec3 vNrm; varying vec3 vEye; varying float vPanel; varying vec2 vPuv;')
          .replace('#include <begin_vertex>', `#include <begin_vertex>
  {
    vec3 nl = vec3(0.0, 0.0, 1.0);
    if (aPanel > 0.5 && aPanel < 2.5) {        // a door's glass goes round with its door
      float left = step(aPanel, 1.5), a = left > 0.5 ? uA.x : -uA.y, cs = cos(a), sn = sin(a), hx = left > 0.5 ? -${WG.toFixed(3)} : ${WG.toFixed(3)};
      vec3 d = transformed - vec3(hx, 0.0, ${HZ.toFixed(4)});
      transformed = vec3(hx + d.x * cs + d.z * sn, transformed.y, ${HZ.toFixed(4)} - d.x * sn + d.z * cs);
      nl = vec3(sn, 0.0, cs);
    }
    vLoc = transformed; vNrm = nl; vPanel = aPanel; vPuv = uv;
    vEye = (uInv * vec4(cameraPosition, 1.0)).xyz;
  }`);
        sh.fragmentShader = sh.fragmentShader.replace('#include <map_pars_fragment>', `#include <map_pars_fragment>
uniform vec2 uA; uniform float uT, uSway, uGlint, uOpen, uGlow, uSeam; uniform sampler2D uFloor, uBits, uToyTex; uniform vec4 uToy; uniform vec3 uToyCol; uniform vec2 uToyW; uniform vec3 uWaiter;
varying vec3 vLoc; varying vec3 vNrm; varying vec3 vEye; varying float vPanel; varying vec2 vPuv;
const float UW = ${UW.toFixed(2)}, D0 = ${D0.toFixed(2)}, HC = ${HC.toFixed(2)};
// one of the three sheets of diners, where the ray meets it: they sway a little, their heads more than their shoulders
vec4 mqRow(vec3 P, vec3 r, float tm, float d, vec3 yy, float ph, int id) {
  float t = clamp((d - P.z) / max(r.z, 1.0e-4), 0.0, 60.0);
  vec3 H = P + r * t;
  float k = smoothstep(0.36, 0.62, H.y) * uSway;
  H.x += 0.013 * k * sin(H.x * 9.0 + uT * 0.9 + ph) * sin(H.x * 3.7 - uT * 0.53 + ph * 2.0);
  H.y += 0.007 * k * sin(H.x * 11.0 - uT * 1.1 + ph * 3.0);
  if (id == 3) {
    // the man beside the yellow hat leans in to say something, and sits back; the woman under the flowers turns her head a little, and back
    float g = exp(-pow((H.x - 0.98) / 0.17, 2.0)) * smoothstep(0.3, 0.62, H.y) * smoothstep(0.1, 0.9, sin(uT * 0.42 + 0.5)) * uSway;
    H.x += 0.036 * g; H.y += 0.008 * g;
    vec2 c = vec2(-1.527, 0.6), dd = (H.xy - c) / vec2(0.1, 0.075);
    float g2 = exp(-dot(dd, dd)) * smoothstep(0.2, 0.95, sin(uT * 0.31 + 2.0)) * uSway;
    H.x = mix(H.x, c.x + (H.x - c.x) * 1.3 - 0.012, g2);
  } else if (id == 2) {
    // one of the middle table nods at what he is told
    float g = exp(-pow((H.x + 0.98) / 0.1, 2.0)) * smoothstep(0.5, 0.6, H.y) * smoothstep(0.55, 1.0, sin(uT * 0.8 + 1.0)) * uSway;
    H.y += 0.014 * g;
  }
  float s = (H.x + UW) / (2.0 * UW), v = 1.0 - H.y / yy.z;
  float m = step(1.0e-3, r.z) * step(t, tm) * step(0.0, s) * step(s, 1.0) * step(0.0, v) * step(v, 1.0);
  return texture2D(map, vec2(clamp(s, 0.002, 0.998), 1.0 - mix(yy.x, yy.y, clamp(v, 0.012, 0.988)))) * m;
}
vec3 mqOver(vec3 c, vec4 s) { return s.rgb + c * (1.0 - s.a); }
vec4 mqToy(vec3 P, vec3 r, float tm) {
  float t = clamp((uToy.z - P.z) / max(r.z, 1.0e-4), 0.0, 60.0);
  vec3 H = P + r * t;
  vec2 q = (H.xy - uToy.xy) / uToyW * 0.5 + 0.5;
  float m = uToy.w * step(1.0e-3, r.z) * step(t, tm) * step(0.0, q.x) * step(q.x, 1.0) * step(0.0, q.y) * step(q.y, 1.0);
  vec4 x = texture2D(uToyTex, clamp(q, 0.01, 0.99));
  vec3 c = mix(uToyCol * (0.3 + 1.1 * x.r), vec3(x.g), x.b);
  float a = x.a * m;
  return vec4(c * a, a);
}
vec4 mqTable(vec3 P, vec3 r, float tm) {
  float t = clamp((${TABLE.z.toFixed(3)} - P.z) / max(r.z, 1.0e-4), 0.0, 60.0);
  vec3 H = P + r * t;
  vec2 q = vec2((H.x - ${(TABLE.x - 0.34).toFixed(3)}) / 0.68, H.y / 0.51);
  float m = step(1.0e-3, r.z) * step(t, tm) * step(0.0, q.x) * step(q.x, 1.0) * step(0.0, q.y) * step(q.y, 1.0);
  return texture2D(uBits, vec2(clamp(q.x, 0.01, 0.99) * 256.0 / 384.0, clamp(q.y, 0.01, 0.99))) * m;
}
// a waiter, crossing behind the middle tables
vec4 mqWaiter(vec3 P, vec3 r, float tm) {
  float t = clamp((2.2 - P.z) / max(r.z, 1.0e-4), 0.0, 60.0);
  vec3 H = P + r * t;
  vec2 q = vec2((H.x - uWaiter.x) / 0.64 + 0.5, (H.y - uWaiter.y) / 0.96);
  float m = uWaiter.z * step(1.0e-3, r.z) * step(t, tm) * step(0.0, q.x) * step(q.x, 1.0) * step(0.0, q.y) * step(q.y, 1.0);
  return texture2D(uBits, vec2((256.0 + clamp(q.x, 0.02, 0.98) * 128.0) / 384.0, clamp(q.y, 0.01, 0.99))) * m;
}`).replace('#include <map_fragment>', `
  if (vPanel > 3.5) {                                    // the line of light down the join of the shut doors
    float e = 1.0 - abs(vPuv.x - 0.5) * 2.0, v = smoothstep(0.0, 0.08, vPuv.y) * smoothstep(1.0, 0.92, vPuv.y);
    diffuseColor = vec4(vec3(1.0, 0.76, 0.44) * (0.25 * e * e + 1.1 * pow(e, 6.0)) * v * uSeam, 0.0);
  } else if (vPanel > 2.5) {                             // the light of the room in the glass, on the gallery floor
    vec2 q = vLoc.xz;
    float c = uOpen * exp(-pow(q.x / 0.6, 2.0) - pow((q.y - 0.3) / 0.8, 2.0));
    for (int i = 0; i < 2; i++) {                        // each door throws its own, and it goes round as the door does
      float sx = i == 0 ? -1.0 : 1.0, a = i == 0 ? uA.x : uA.y, seen = smoothstep(1.85, 1.15, a);
      vec2 h = vec2(sx * ${WG.toFixed(3)}, ${HZ.toFixed(4)}), d = vec2(sx * cos(a), sin(a)), n = vec2(-sx * sin(a), cos(a)), pc = h + d * 0.22 + n * 0.78, e = q - pc;
      c += 0.62 * seen * mix(0.45, 1.0, uGlint) * exp(-dot(e, e) / 0.21);
    }
    c *= smoothstep(0.0, 0.2, q.y);
    c += 0.5 * uSeam * exp(-pow(q.x / 0.1, 2.0) - pow((q.y - 0.32) / 0.3, 2.0)) * smoothstep(0.24, 0.3, q.y);       // (and through the join, before they open)
    diffuseColor = vec4(vec3(1.0, 0.7, 0.4) * c * 0.2 * uGlow, 0.0);
  } else {                                               // the glass: what a mirror would show of his room from here
    vec3 P = vLoc, n = normalize(vNrm), v = normalize(P - vEye), r = reflect(v, n);
    float tb = r.z > 1.0e-4 ? (D0 - P.z) / r.z : 1.0e9, tw = r.z < -1.0e-4 ? (-0.03 - P.z) / r.z : 1.0e9;
    float ts = abs(r.x) > 1.0e-4 ? ((r.x > 0.0 ? UW : -UW) - P.x) / r.x : 1.0e9;
    float tf = r.y < -1.0e-4 ? -P.y / r.y : 1.0e9, tc = r.y > 1.0e-4 ? (HC - P.y) / r.y : 1.0e9;
    float tm = min(min(tb, max(tw, 0.0)), min(ts, min(tf, tc)));
    vec3 H = P + r * tm;
    float onSide = step(ts, tm + 1.0e-5), onFloor = step(tf, tm + 1.0e-5), onNear = step(tw, tm + 1.0e-5);
    float ux = mix(H.x, sign(H.x) * (UW - (D0 - H.z) * 0.8), onSide), hy = H.y;
    // (a ray turned back at the wall the glass hangs on meets the middle glass there, and goes on to the far wall: a
    // mirror seen in a mirror, dimmer)
    vec3 H2 = H + vec3(r.x, r.y, -r.z) * (D0 / max(-r.z, 0.05));
    ux = mix(ux, clamp(H2.x, -UW, UW) * (1.0 - 0.3 * smoothstep(UW * 0.8, UW * 3.0, abs(H2.x))), onNear); hy = mix(hy, clamp(H2.y, 0.03, HC - 0.03), onNear);
    vec3 yw = ${rowU[0]};
    vec3 wall = texture2D(map, vec2(clamp((ux + UW) / (2.0 * UW), 0.002, 0.998), 1.0 - mix(yw.x, yw.y, clamp(1.0 - hy / yw.z, 0.004, 0.992)))).rgb;
    wall *= 1.0 - 0.14 * onSide - 0.3 * onNear;
    vec3 flr = texture2D(uFloor, H.xz * vec2(0.9, 1.3)).rgb * (0.62 + 0.75 * exp(-pow(H.z - 1.6, 2.0) / 3.0));
    vec3 col = mix(wall, flr, onFloor * (1.0 - onNear));
    vec3 haze = vec3(0.3, 0.27, 0.3);
    vec4 toy = mqToy(P, r, tm), s;
    if (uToy.z > ${DL[0].toFixed(2)}) col = mqOver(col, toy);
    s = mqRow(P, r, tm, ${DL[0].toFixed(2)}, ${rowU[1]}, 0.7, 1); s.rgb = mix(s.rgb, haze * s.a, 0.22) * 0.9; col = mqOver(col, s);
    s = mqWaiter(P, r, tm); s.rgb = mix(s.rgb, haze * s.a, 0.16) * 0.93; col = mqOver(col, s);
    if (uToy.z <= ${DL[0].toFixed(2)} && uToy.z > ${DL[1].toFixed(2)}) col = mqOver(col, toy);
    s = mqRow(P, r, tm, ${DL[1].toFixed(2)}, ${rowU[2]}, 2.9, 2); s.rgb = mix(s.rgb, haze * s.a, 0.1) * 0.96; col = mqOver(col, s);
    if (uToy.z <= ${DL[1].toFixed(2)} && uToy.z > ${DL[2].toFixed(2)}) col = mqOver(col, toy);
    col = mqOver(col, mqRow(P, r, tm, ${DL[2].toFixed(2)}, ${rowU[3]}, 5.3, 3));
    if (uToy.z <= ${DL[2].toFixed(2)} && uToy.z > ${TABLE.z.toFixed(3)}) col = mqOver(col, toy);
    col = mqOver(col, mqTable(P, r, tm));
    if (uToy.z <= ${TABLE.z.toFixed(3)}) col = mqOver(col, toy);
    // the glass itself: a little cool and dim at its edges, bright where the light glances along it
    vec2 e = min(vPuv, 1.0 - vPuv);
    col *= 0.86 + 0.14 * smoothstep(0.0, 0.06, min(e.x * (vPanel > 0.5 ? 1.0 : 1.7), e.y));
    float gz = pow(1.0 - abs(dot(v, n)), 5.0);
    col = col * vec3(1.0, 0.95, 0.88) * (0.93 + 0.025 * sin(uT * 0.7)) + vec3(0.34, 0.31, 0.27) * gz * uGlint;
    diffuseColor = vec4(col, 1.0);
  }
  diffuseColor *= lifeK;
`);
      };
      m.customProgramCacheKey = () => 'mouquins-glass';
      m.floorTex = floorTex; m.bitsTex = u.uBits.value; m.toyTex = u.uToyTex.value;      // (so the kit lets them go with the rest)
      this.glass = new THREE.Mesh(g, m); this.glass.matrixAutoUpdate = false; this.glass.matrix.copy(this.B); this.glass.matrixWorldNeedsUpdate = true; this.glass.renderOrder = 6; this.glass.visible = false;
      L.add(this.glass);
    }

    this.shade = L.blobs(7, { fade: true });
    this.sr = rng(915401);
    this.reset(L);
  },

  // The room's voice: many short soft bands of noise, as a crowd's talk is at a distance (no words in it); shut behind
  // the doors it is low and dull, and it opens out as they do. Now and then a fork on a plate.
  murmur(L, dt, open, level) {
    const v = L.voice(); if (L.quiet || !v.ctx || level <= 0.01) return;
    const R = this.sr;
    this.hT -= dt;
    for (let guard = 0; this.hT <= 0 && guard < 8; guard++) {
      this.hT += 0.045 + 0.06 * R();
      const f = lerp(210 + 130 * R(), 380 + 1100 * R() * R(), open);
      noise(v, R() * 0.04, { d: 0.16 + 0.22 * R(), vol: level * (0.008 + 0.012 * R()) * lerp(0.4, 1, open), bp: f, q: lerp(1.1, 2.4, open), attack: 0.035 + 0.03 * R() });
    }
    if (open > 0.85 && (this.cT -= dt) <= 0) { this.cT = 0.7 + 1.9 * R(); const f = 2300 + 1800 * R(); v.note(f, 0.07, { vol: 0.0032 * level, type: 'sine', attack: 0.002 }); if (R() < 0.4) v.note(f * 1.19, 0.06, { at: 0.07 + 0.05 * R(), vol: 0.0022 * level, type: 'sine', attack: 0.002 }); }
  },

  // The banquette and the table are soft to the toy: it is eased out round them (never stopped dead).
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

  hide() { if (!this.rig) return; this.rig.mesh.visible = false; this.glass.visible = false; this.shade.visible = false; },
  start(L, resumed) {
    if (resumed) { this.pL = this.pR = 1; this.c = BUILT + 1; return; }
    this.clear();
  },
  clear() { this.c = 0; this.pL = this.pR = 0; this.clock = 0; this.knockL = this.knockR = -1; this.hT = 0; this.cT = 1.5; this.cBack = BUILT; this.pL0 = this.pR0 = 0; this.seen = 0; this.wT = 0; this.toyT = 0; },
  back(L) { this.cBack = Math.min(this.c, BUILT); this.pL0 = this.pL; this.pR0 = this.pR; },
  end() { this.hide(); },
  reset() { this.hide(); this.clear(); },

  update(L, dt) {
    const ph = L.phase, showing = ph === 'wake' || ph === 'play', linger = ph === 'linger', back = ph === 'return';
    if (!showing && !linger && !back) { this.hide(); return; }
    const calm = L.calm, V = this.V, G = L.k.G, voice = L.voice(), sp = calm ? 0.6 : 1;
    this.clock += dt;
    // ---- is it built; and how far open are the doors (0 shut, 1 open)
    if (!back) this.c = Math.min(BUILT + 1, this.c + dt);
    const shutBy = Math.min(D_SHUT / sp, L.retDur - 1.25), c = back ? this.cBack * (1 - ease.inOut(ramp(L.r, shutBy, L.retDur))) : this.c;
    const wasL = this.pL, wasR = this.pR;
    if (showing) {
      if (L.t >= T_L) this.pL = Math.min(1, this.pL + dt * sp / D_OPEN);
      if (L.t >= T_R) this.pR = Math.min(1, this.pR + dt * sp / D_OPEN);
    } else if (linger) { this.pL = Math.min(1, this.pL + dt * sp / D_OPEN); this.pR = Math.min(1, this.pR + dt * sp / D_OPEN); }
    else { const k = ramp(L.r, 0, shutBy); this.pL = this.pL0 * (1 - k); this.pR = this.pR0 * (1 - Math.min(1, k * 1.12)); }
    if (wasL < 1 && this.pL >= 1) this.knock(L, 'L', calm); if (wasR < 1 && this.pR >= 1) this.knock(L, 'R', calm);
    if (back && ((wasL > 0 && this.pL <= 0) || (wasR > 0 && this.pR <= 0)) && !L.quiet && voice.ctx) noise(voice, 0, { d: 0.1, vol: calm ? 0.006 : 0.012, lp: 380, attack: 0.004 });
    // (a door swings as a door does: slow away, quick through the middle, and it settles against the wall with a small give)
    const ang = (p, since) => { const a = PI * (1 - ease.inOut(p)); return since >= 0 ? Math.abs(0.045 * (calm ? 0.4 : 1) * Math.exp(-since * 7) * Math.sin(since * 21)) : a; };
    const aL = ang(this.pL, this.pL >= 1 && this.knockL >= 0 ? this.clock - this.knockL : -1), aR = ang(this.pR, this.pR >= 1 && this.knockR >= 0 ? this.clock - this.knockR : -1);
    const open = 1 - (aL + aR) / TAU;
    // ---- into the rig
    const rig = this.rig, I = this.I, B = this.B;
    rig.mesh.visible = c > 0.03; this.ru.uT.value = c; this.ru.uTumble.value = calm ? 0 : 1;
    rig.mat(I.doorL, V.m.multiplyMatrices(B, this.door(-1, aL))); rig.mat(I.doorR, V.m.multiplyMatrices(B, this.door(1, aR)));
    // the rose nods when the right-hand door comes home
    const since = this.knockR >= 0 ? this.clock - this.knockR : 99, nod = (calm ? 0.035 : 0.1) * Math.exp(-since * 2.6) * Math.sin(since * 10.5);
    V.l.makeRotationFromEuler(V.e.set(nod * 0.5, 0, nod, 'YXZ')); V.l.setPosition(ROSE.x, ROSE.y, ROSE.z);
    rig.mat(I.rose, V.m.multiplyMatrices(B, V.l));
    // ---- the glass
    const u = this.mu, built = ease.smooth(ramp(c, BUILT - 0.35, BUILT - 0.05));
    this.glass.visible = built > 0.01;
    u.uA.value.set(aL, aR); u.uInv.value.copy(this.Binv); u.uT.value = this.clock; u.uSway.value = calm ? 0.5 : 1; u.uGlint.value = calm ? 0.3 : 1;
    u.uGlow.value = built; u.uOpen.value = ease.smooth(open);
    // a waiter crosses behind the middle tables once the room is open, and again every quarter of a minute
    if (!back && this.pL >= 1 && this.pR >= 1) this.wT += dt * (calm ? 0.7 : 1);
    { const wp = this.wT % 15, wx = -2.75 + wp * 0.7, st = wp * PI * 1.9; u.uWaiter.value.set(wx + 0.005 * Math.sin(st), 0.007 * Math.abs(Math.sin(st)), this.wT > 0 && wx < 2.9 ? 1 : 0); }
    u.uSeam.value = built * fall(open, 0.02, 0.2) * (showing ? ease.smooth(ramp(L.t, T_SEAM, T_SEAM + 0.45)) : 1) * (calm ? 0.85 : 0.92 + 0.08 * Math.sin(this.clock * 2.1));
    // ---- the toy, where a mirror would put it
    const v = G.vehicle, q = v ? L.local(v.pos.x, v.pos.z) : null;
    const on = !!v && v.group.visible && q.out > 0.12 && q.out < 4.2 && Math.abs(q.u) < 3.2 && v.pos.y - L.y > -0.2 && v.pos.y - L.y < 1.6;
    this.seen += ((on ? 1 : 0) - this.seen) * Math.min(1, dt * 6 + (dt > 0 ? 0 : 1));
    if (v && q) {
      const drone = v.kind === 'drone', yaw = (v.yaw || 0) - Math.atan2(L.tx, L.tz), along = Math.abs(Math.cos(yaw));       // (how much of its length the glass sees)
      u.uToy.value.set(q.u, v.pos.y - L.y + (drone ? 0.0 : 0.075), q.out, this.seen);
      u.uToyW.value.set((drone ? 0.2 : 0.13) + (drone ? 0.02 : 0.1) * along, drone ? 0.07 : 0.105);
      if ((this.toyT -= dt) <= 0 || dt <= 0) { this.toyT = 1.5; let pm = null; v.group.traverse(o => { if (!pm && o.isMesh && o.material && o.material.name === 'paint') pm = o.material; }); if (pm) u.uToyCol.value.copy(pm.color); }
    }
    // ---- shadows on the floor, under the banquette and the table
    const O = this.O, sh = this.shade, k = ease.smooth(ramp(c, 0.2, 1.2));
    sh.visible = k > 0.01; sh.count = 7;
    const put = (i, x, z, r, kk) => sh.set(i, O.x + L.tx * x + L.nx * z, O.z + L.tz * x + L.nz * z, r, kk);
    put(0, -0.66, 0.17, 0.36, 0.8 * k); put(1, -0.22, 0.17, 0.36, 0.8 * k); put(2, 0.22, 0.17, 0.36, 0.8 * k); put(3, 0.66, 0.17, 0.36, 0.8 * k);
    put(4, TABLE.x, TABLE.z, 0.3, 0.75 * k); put(5, TABLE.x - 0.08, TABLE.z + 0.12, 0.4, 0.4 * k * (1 - 0.5 * u.uOpen.value)); put(6, TABLE.x + 0.1, TABLE.z + 0.05, 0.22, 0.5 * k);
    if (c > 1) this.soften(L, dt);
    // ---- the sound of the room
    this.murmur(L, dt, ease.smooth(open), built * (showing ? ease.smooth(ramp(L.t, T_SEAM - 0.2, T_SEAM + 0.8)) : 1) * (calm ? 0.75 : 1));
    voice.level = calm ? 0.8 : 1; voice.place();
    if (showing && !this.told && !L.quiet && this.pR >= 1) { this.told = true; L.k.say('The looking-glass opens, and it has kept the whole room: the lamps, the talk, the crowd. Go up to it, and you are in the room too.', 5); }
    if (back && L.ret >= 1) this.hide();
  },

  knock(L, which, calm) {
    this['knock' + which] = this.clock;
    const v = L.voice(); if (L.quiet || !v.ctx) return;
    noise(v, 0, { d: 0.11, vol: calm ? 0.008 : 0.018, lp: 420, attack: 0.003 }); noise(v, 0.004, { d: 0.035, vol: calm ? 0.003 : 0.007, bp: 1500, q: 1.2, attack: 0.002 });
  },
});
