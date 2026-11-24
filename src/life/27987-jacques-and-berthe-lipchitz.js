// Amedeo Modigliani, Jacques and Berthe Lipchitz (1916), Gallery 391. The word: sitting.
//
// A wedding portrait. The sculptor Jacques Lipchitz stands, one hand in his jacket pocket and the other on the
// shoulder of his wife, the poet Berthe Lipchitz, who sits below him in a dark dress with a wide white collar, her
// head a little inclined towards him. Behind them a room in flat scrubbed patches: a grey-green wall, a brown
// rectangle leaning on it, a pale upright band, an ochre panel; and across the wall, in the painter's thin capitals,
// their name. The museum's note says Lipchitz commissioned it from his friend on the occasion of the marriage, and
// that, according to Lipchitz, it took Modigliani only two days to paint, though Lipchitz persuaded him to work on it
// for another two weeks so as to pay him a larger fee. So this is a picture of two people keeping still together, and
// of how long they kept it up: a sitting, and then a longer one.
//
// They come out, because the picture is about nothing but the two of them, and what they do in the room is only
// what they do in the picture. Look, and the room is scrubbed onto the wall under the picture, the ochre panel
// first; a low wooden stool stands up in front of it. She comes in by the ochre panel and along the wall to the
// stool, glancing back at him over her shoulder; he comes a pace behind her. She turns and sits three-quarters on,
// her weight back, and folds her hands; he goes round behind, to one side, and stands at her shoulder with his weight
// on one leg; one hand goes to his pocket. The other lifts, waits a moment over her shoulder, and comes down to rest
// on it, on a low note; she inclines her head towards him, on a higher one, and the two notes ring together. That is
// the picture, and they hold it, looking out at whoever stands where the painter stood (you). While they hold it the
// name is lettered on the wall beside his head, a letter at a time, as it is in the picture. Then the brush stops.
// His hand lifts; she straightens and looks up at him, and he down at her: done? He looks back out, gives a small
// nod, and lays his hand on her shoulder again; she turns back and inclines her head as before; the two notes again.
// The sitting goes on, for as long as you keep looking: they breathe, the brush works, now and then one glances at
// the other. When you stop she gets up, they go out the way they came, and the room is rubbed off the wall behind them.
//
// How they are made: of paint, with no bare form showing. His paint is thin and flat, scrubbed over the weave, and
// everything is held in a dark, slow line. So under each form (shoulders that slope, sleeves and legs that taper, a
// skirt in long folds) is a core a little smaller and darker than the form, and what the eye sees is his scrubs
// lying over it in close tones: every one a ribbon with a brush's own print on it (bristles, a ragged dry end, gaps
// where the thin paint ran out), tilted a little about its length so that they overlap and the edge of a form is
// their ragged ends. Maroon, the grey-green jersey up to his chin, the terracotta of his flesh; her blue-black, a
// paler flesh, and her collar his clean white shape with its edge broken. Round each form goes his blue-black line,
// which swells, thins and is lost, as it is in the picture.
//
// The two heads are taken from the canvas, measured: each face in its own halves, and every mark set where he set
// it. Hers is his tilted oval, wide through the cheek and coming to a point at the chin, on the long neck he gave
// her and no longer; his is broader and heavier, full in the jaw, under a thick dark cap of hair with the ears
// standing clear of it. The flesh is laid flat in a few planes (the lit side ochre-pink, the far side greyer, the
// leaf of shade under each of his brows and down the near side of his nose; his rose on both her cheeks, the pale
// ridge of her nose), and on it his own few marks, each one touch of the brush: for her two clean brows, two large
// dark almonds set apart (the one on her left a little the higher, as he has it), the nose's line from the brow down
// and a fainter one beside it, a small closed mouth lifted at one corner; for him the brows, small close blue-grey
// eyes under their lids, the nose in one long line, a small mouth. Nothing is enlarged, lengthened or made fun of:
// these are his drawings of two people he knew, followed mark for mark.
//
// The room on the wall is flat paint, with ragged dry edges and the gallery wall showing through. One rig (the two
// of them and the stool), one flat mesh on the wall (the room and the lettering), and the soft shadows at their
// feet: three draw calls. He stands 0.87 m and she sits 0.62 m, as large as the frame of the look allows with the
// whole of this small, high-hung picture in it; the room on the wall is 1.05 m high, under every frame on this wall
// and clear of the floor Matisse's geranium uses. They and the stool are soft to the toy: it is eased round them,
// never stopped dead and never through them; nothing is pushed, and nothing stays out after the look.
//
// No tune: a sitting is quiet. Steps, the stool, a brush on canvas, and two plain notes, his and hers (E and the G
// sharp above it, in the key the geranium next door rings in). With "Reduce motion and flashing" on, nothing settles
// with a bounce, the glances are slower, and it is all quieter; nothing here flashes at any setting.
//
// What it does not do: it gives them no story but the museum's (a wedding portrait, two days, and two weeks more at
// his asking); nothing is made of where they came from, what they believed or what became of them; the painter is
// not shown, only heard, and his signature is not copied onto the wall; the stool and the lower half of both figures
// are ours (the picture stops at the waist), plain and dark so as to claim nothing; and their looks are his drawing
// of them, followed quietly, because they were real people and these are their faces.
import * as THREE from 'three';
import { lifeFor, ease, ramp, clamp01, lerp, shape, canvasTexture } from '../paintlife.js';
import { score, Bones, hump, turnTo } from './stagecraft.js';

const PI = Math.PI, TAU = PI * 2;
const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const smooth = (x, a, b) => { const q = clamp01((x - a) / (b - a)); return q * q * (3 - 2 * q); };

// ---------------------------------------------------------------- the timeline (seconds of show)
const B_IN = [0.25, 2.4], J_IN = [0.7, 2.75];           // she comes in and crosses to the stool; he follows
const SIT = [2.5, 3.3];                                 // she sits
const POCKET = [2.95, 3.5];                             // his right hand, to his pocket
const LIFT = [3.4, 3.95], T_HAND = 4.4;                 // his left lifts, waits over her shoulder, and comes down
const TILT = [4.45, 5.0];                               // she inclines her head to him
const WRITE = [4.9, 6.25];                              // the name is lettered on the wall
const EASE = [6.6, 7.3], AGAIN = [7.7, 8.15], TILT2 = [8.1, 8.65];      // done? no: again
const IDLE = 9.2;
// ---------------------------------------------------------------- how big: everything below is set out at a scale of
// one (he stands 0.61 m) and shown at SC, about the wall's foot under the middle of the picture: he stands 0.87 m and
// she sits 0.62 m, as large as they can be under the frame with the whole of this small, high-hung picture in view.
const SC = 1.42, UO = -0.15, sc2 = p => [p[0] * SC + UO, p[1] * SC, p[2]];      // (UO: the whole of it a little to the left, so the two of them sit under the picture)
// ---------------------------------------------------------------- the floor (metres: along the wall, out from it)
const J_YAW = 0.2, B_YAW = 0.28;                        // how they are turned in the end, from square to the wall: he to her, she three-quarters away
const DOOR = sc2([0.66, -0.26]);
const B_FEET = [0.16, 0.61], B_HIPS = [B_FEET[0] - 0.127 * Math.sin(B_YAW), B_FEET[1] - 0.127 * Math.cos(B_YAW)];      // (seated, her hips are a thigh's length behind her feet)
const B_STAND = sc2(B_FEET), STOOL = sc2(B_HIPS), J_STAND = sc2([B_HIPS[0] - 0.092, B_HIPS[1] - 0.082]);
// (they come in along the wall, not out at you: she first, he a pace behind)
const B_WAY = [DOOR, ...[[0.59, 0.07], [0.47, 0.34], [0.33, 0.56], [0.22, 0.62]].map(sc2), B_STAND];
const J_WAY = [DOOR, ...[[0.6, 0.05], [0.47, 0.24], [0.29, 0.34], [0.12, 0.37]].map(sc2), J_STAND];
// ---------------------------------------------------------------- the room on the wall (metres along it, and up)
const BU0 = -0.66, BU1 = 0.86, BW = BU1 - BU0, RW = 1024, RH = 544, PXM = RW / BW, BH = RH / PXM;
const NAME = { u0: 0.14, u1: 0.41, h0: 0.563, h1: 0.625 };
const GLYPH = {
  L: [0.62, [[0.12, 1], [0.1, 0.02], [0.9, 0.06]]],
  I: [0.22, [[0.5, 1], [0.5, 0]]],
  P: [0.64, [[0.14, 0], [0.16, 1]], [[0.16, 1], [0.62, 0.97], [0.86, 0.76], [0.64, 0.52], [0.16, 0.48]]],
  C: [0.7, [[0.9, 0.82], [0.62, 1], [0.28, 0.86], [0.12, 0.5], [0.28, 0.13], [0.62, 0], [0.92, 0.16]]],
  H: [0.7, [[0.12, 1], [0.14, 0]], [[0.14, 0.5], [0.86, 0.53]], [[0.88, 1], [0.86, 0]]],
  T: [0.74, [[0.04, 0.97], [0.96, 1]], [[0.5, 1], [0.52, 0]]],
  Z: [0.72, [[0.1, 0.98], [0.9, 1], [0.1, 0.02], [0.94, 0.05]]],
};
// ---------------------------------------------------------------- their bones (metres, at a scale of one: he stands 0.6, she 0.56)
const JK = { TH: 0.155, LEG: 0.3005, HIP: 0.3005, SH: [0.056, 0.178], NECK: [0.2, 0.004], AU: 0.108, AF: 0.106, STRIDE: 0.24, SWING: 0.42 };
const BK = { TH: 0.127, KNEE: 0.148, SH: [0.044, 0.142], NECK: 0.165, AU: 0.086, AF: 0.082, STRIDE: 0.19 };
const INK = '#1e2130';

// A brush's own print, for every mark: two drags (bristle by bristle, fuller in the middle, ragged at both ends, the
// second run dry), a soft round touch, and a plain patch for the cores and the line. Its colour is only the bristles'
// light and dark; its alpha is the mark's shape.
let PRINT = null;
function brushPrint() {
  if (PRINT) return PRINT;
  const W = 256, mk = () => { const c = document.createElement('canvas'); c.width = c.height = W; return c.getContext('2d', { willReadFrequently: true }); }, gl = mk(), gm = mk();
  gl.fillStyle = 'rgb(236,236,236)'; gl.fillRect(0, 0, W, W); gm.fillStyle = '#000'; gm.fillRect(0, 0, W, W);
  let s = 27987; const r = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
  const cell = (x0, y0, fn) => { for (const g of [gl, gm]) { g.save(); g.beginPath(); g.rect(x0, y0, 128, 128); g.clip(); g.translate(x0, y0); g.lineCap = 'round'; } fn(); gl.restore(); gm.restore(); };
  const hair = (v, w, xa, ya, xb, yb, bow) => { for (const [g, st] of [[gl, `rgb(${v},${v},${v})`], [gm, '#fff']]) { g.strokeStyle = st; g.lineWidth = w; g.beginPath(); g.moveTo(xa, ya); g.quadraticCurveTo((xa + xb) / 2, (ya + yb) / 2 + bow, xb, yb); g.stroke(); } };
  const drag = dry => () => {
    for (let i = 0; i < 34; i++) {
      const y = 64 + (r() - 0.5) * 88, e = Math.pow(Math.abs(y - 64) / 46, 1.5), xa = 8 + e * 26 + r() * 12, xb = 120 - e * 30 - r() * (dry ? 44 : 14);
      hair(190 + Math.floor(r() * 65), 4 + r() * 8, xa, y + (r() - 0.5) * 4, Math.max(xa + 8, xb), y + (r() - 0.5) * 6, (r() - 0.5) * 8);
    }
    gm.strokeStyle = '#000';      // where the thin paint gave out and the ground shows
    for (let i = 0; i < (dry ? 14 : 5); i++) { const y = 20 + r() * 88, xa = (dry ? 30 : 58) + r() * 40; gm.lineWidth = 1.2 + r() * 2.6; gm.beginPath(); gm.moveTo(xa, y); gm.lineTo(124, y + (r() - 0.5) * 7); gm.stroke(); }
  };
  cell(0, 0, drag(false)); cell(128, 0, drag(true));
  cell(0, 128, () => {
    for (let i = 0; i < 12; i++) { const a = r() * TAU, rr = Math.sqrt(r()) * 20, v = 206 + Math.floor(r() * 49), x = 64 + Math.cos(a) * rr * 1.3, y = 64 + Math.sin(a) * rr, rx = 15 + r() * 10, ry = 12 + r() * 8, ro = r() * 3; for (const [g, st] of [[gl, `rgb(${v},${v},${v})`], [gm, '#fff']]) { g.fillStyle = st; g.beginPath(); g.ellipse(x, y, rx, ry, ro, 0, TAU); g.fill(); } }
    for (let i = 0; i < 8; i++) { const y = 64 + (r() - 0.5) * 54; hair(212 + Math.floor(r() * 43), 4 + r() * 5, 26 + r() * 20, y, 102 - r() * 22, y + (r() - 0.5) * 8, 0); }
  });
  for (const g of [gl, gm]) { g.fillStyle = '#fff'; g.fillRect(128, 128, 128, 128); }
  const a = gl.getImageData(0, 0, W, W).data, m = gm.getImageData(0, 0, W, W).data, out = new Uint8Array(W * W * 4);
  for (let i = 0; i < W * W * 4; i += 4) { out[i] = a[i]; out[i + 1] = a[i + 1]; out[i + 2] = a[i + 2]; out[i + 3] = m[i]; }
  PRINT = new THREE.DataTexture(out, W, W, THREE.RGBAFormat);
  PRINT.generateMipmaps = true; PRINT.minFilter = THREE.LinearMipmapLinearFilter; PRINT.magFilter = THREE.LinearFilter; PRINT.anisotropy = 4; PRINT.needsUpdate = true;
  return PRINT;
}
// Where a mark's corners are in the print (k: which mark; s along it, t across), the plain patch, and his line (its v
// past the print's edge is how the shader knows it).
const UVQ = (k, s, t) => { const m = 0.05; return [((k % 2) * 128 + 128 * (m + s * (1 - 2 * m))) / 256, ((k >> 1) * 128 + 128 * (m + t * (1 - 2 * m))) / 256]; };
const UV_SOLID = [0.75, 0.75], UV_LINE = [0.75, 2.75];

// A way over the floor, by arc length: w.at(s 0..1, o) fills o.u, o.out and the heading o.du, o.dout; w.steps is how
// many steps it takes (a whole number, so a walk along it ends with the feet together).
function way(pts, stride) {
  const c = new THREE.CatmullRomCurve3(pts.map(p => V3(p[0], 0, p[1])), false, 'centripetal'); c.arcLengthDivisions = 200; c.updateArcLengths();
  const len = c.getLength(), v = V3(), d = V3();
  return { len, steps: Math.max(1, Math.round(len / stride)), at(s, o) { s = clamp01(s); c.getPointAt(s, v); c.getTangentAt(s, d); o.u = v.x; o.out = v.z; o.du = d.x; o.dout = d.z; return o; } };
}
// Setting off and stopping: the distance gone (0..1) at time x (0..1), a sixth of the time to get going and to stop.
const prof = x => { x = clamp01(x); const a = 0.17; return x < a ? (x * x) / (2 * a) / (1 - a) : x > 1 - a ? 1 - ((1 - x) * (1 - x)) / (2 * a) / (1 - a) : (x - a / 2) / (1 - a); };
const invProf = s => { let a = 0, b = 1; for (let i = 0; i < 24; i++) { const m = (a + b) / 2; if (prof(m) < s) a = m; else b = m; } return (a + b) / 2; };

lifeFor(27987, {
  title: /^Jacques and Berthe Lipchitz/,
  word: 'sitting',
  // (a small work hung high: the kit keeps the whole of it in view over the two of them at the foot of the wall)
  stage: { out: 1.5, half: 1.4, cam: { dist: 2.3, side: 0.08, height: 0.85, fov: 58, lookU: 0.05, lookOut: 0.4, lookH: 0.9, floorOut: 1.12 } },
  wake: 2, ret: 2.6,

  build(L) {
    const P = L.pal, col = (h, a = 0.14) => P.near(h, a), rand = L.rand;
    // ---------------------------------------------------------- his colours, each mass in three close tones
    const C = (list, a = 0.12) => list.map(h => col(h, a));
    const set = (hi, mid, lo) => ({ hi: C(hi), mid: C(mid), lo: C(lo) });
    const MAROON = set(['#77392f', '#6f352d', '#7d4034'], ['#5f2c28', '#652f29', '#582926'], ['#45201f', '#3d1c1c']);
    const SLATE = set(['#638080', '#5c7878'], ['#4f6968', '#4a6363', '#546e6b'], ['#3d5356', '#374b4f']);
    const TROU = set(['#40343a', '#3a3034'], ['#2e2629', '#2a2226', '#32292b'], ['#201a1e', '#1b161a']);
    const FLJ = set(['#d68c62', '#d28659'], ['#c67b56', '#c17550', '#c98059'], ['#ab6346', '#a25c42']);
    const HRJ = set(['#5c2c2a', '#643230'], ['#482324', '#422021', '#4e2727'], ['#331a1c', '#2c1618']);
    const DRESS = set(['#30343f', '#2b303c'], ['#22252d', '#1f2129', '#262a33'], ['#17181e', '#131419']);
    const FLB = set(['#eaae84', '#e6a67c'], ['#dc986f', '#d8926a', '#df9d75'], ['#c47f5e', '#bb7757']);
    const HRB = set(['#2f2728', '#342a2c'], ['#1e191a', '#1a1516', '#231c1e'], ['#131011', '#0f0d0e']);
    const WHITE = set(['#e2e6e3', '#dadfdc', '#e8ebe7'], ['#c7cecc', '#bfc7c6', '#ccd2ce'], ['#a5afb1', '#9aa5a8']);
    const WOOD = set(['#aa7a3a', '#a27234'], ['#8d6030', '#86592b', '#936633'], ['#6c441e', '#603b1a']);
    const SHOE = set(['#2b2526'], ['#1c1819', '#211c1d'], ['#121011']);
    const INKC = col(INK, 0.05);
    this.V = { v: V3(), w: V3(), d: V3(), p: V3(), el: V3(), tip: V3(), a: V3(), b: V3(), pole: V3(), q: new THREE.Quaternion(), sc: V3(SC, SC, SC), down: V3(0, -1, 0), m: new THREE.Matrix4(), s: V3() };
    this.B = new Bones();

    // ---------------------------------------------------------- his marks. Nothing bare shows: under each form is a
    // core a little smaller and darker than the form; over it, his scrubs, each a ribbon with a brush's own print
    // (bristles, a ragged dry end, gaps where the thin paint ran out), tilted a little about its length so that they
    // overlap as feathers do and a form's edge is their ragged ends; and round the form his blue-black line, which
    // swells, thins and is lost, as it is in the picture.
    const pick = (list, r) => list[Math.min(list.length - 1, Math.floor(r * list.length))];
    const h3 = (x, y, z) => { const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return s - Math.floor(s); };
    const vn = (x, y, z) => {
      const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z); let fx = x - xi, fy = y - yi, fz = z - zi;
      fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy); fz = fz * fz * (3 - 2 * fz);
      const a = lerp(lerp(h3(xi, yi, zi), h3(xi + 1, yi, zi), fx), lerp(h3(xi, yi + 1, zi), h3(xi + 1, yi + 1, zi), fx), fy);
      const b = lerp(lerp(h3(xi, yi, zi + 1), h3(xi + 1, yi, zi + 1), fx), lerp(h3(xi, yi + 1, zi + 1), h3(xi + 1, yi + 1, zi + 1), fx), fy);
      return lerp(a, b, fz);
    };
    const KEY = V3(-0.42, 0.74, 0.52).normalize();           // what light he gives a form: a little, from the upper left
    const tcol = new THREE.Color();
    // The tone of a mass where it faces that light (his modelling is slight: a form is nearly one flat tone).
    const under = S => n => { const k = n.dot(KEY); return tcol.copy(S.mid[0]).lerp(S.hi[0], 0.7 * smooth(k, 0.15, 0.9)).lerp(S.lo[0], 0.7 * smooth(-k, 0.0, 0.85)); };
    // A scrub's colour on it: that tone, leaning to one of the mass's own, with a little of the luck of the brush.
    const mixer = (S, amt = 0.45, v = 0.1) => { const u = under(S), all = [...S.hi, ...S.mid, ...S.mid, ...S.lo]; return (n, r) => new THREE.Color().copy(u(n)).lerp(pick(all, (r * 7.31) % 1), amt * (0.5 + ((r * 3.17) % 1))).multiplyScalar(1 + (r - 0.5) * v); };
    const part = () => ({ pos: [], nor: [], col: [], uv: [] });
    const vert = (Pt, p, n, c, uv) => { Pt.pos.push(p.x, p.y, p.z); Pt.nor.push(n.x, n.y, n.z); Pt.col.push(c.r, c.g, c.b); Pt.uv.push(uv[0], uv[1]); };
    const sv = V3(), sn = V3(), sc = new THREE.Color();
    // A core: g, painted paint(normal, where) and darkened.
    const core = (Pt, g, paint, dark) => { const p = g.attributes.position, n = g.attributes.normal; for (let i = 0; i < p.count; i++) { sv.fromBufferAttribute(p, i); sn.fromBufferAttribute(n, i); sc.copy(paint(sn, sv)).multiplyScalar(dark); vert(Pt, sv, sn, sc, UV_SOLID); } };
    // His line round a form: the form's own surface turned inside out and pushed out d where the line is found (and not
    // at all where it is lost), in his blue-black; only its far side is drawn, so it shows round the form's edge.
    let lineSeed = 0;
    const contour = (Pt, g, d) => {
      const p = g.attributes.position, n = g.attributes.normal, sd = (lineSeed += 5.3), q = V3(), nn = V3();
      for (let f = 0; f < p.count; f += 3) for (const j of [0, 2, 1]) {
        q.fromBufferAttribute(p, f + j); nn.fromBufferAttribute(n, f + j);
        const k = smooth(vn(q.x * 36 + sd, q.y * 30 + sd * 0.7, q.z * 36), 0.36, 0.62);
        q.addScaledVector(nn, d * (0.12 + 0.88 * k)); vert(Pt, q, nn.negate(), INKC, UV_LINE);
      }
    };
    // A rounded form (an ellipsoid). Returns what the scrubs need to lie on it.
    const ell = (Pt, c, r, paint, { detail = 2, shrink = 0.93, dark = 0.8, line = 0.003, rot = null } = {}) => {
      const mk = (k, dt = detail) => shape.move(shape.ball(1, 0xffffff, dt), c[0], c[1], c[2], rot ? rot[0] : 0, rot ? rot[1] : 0, rot ? rot[2] : 0, r[0] * k, r[1] * k, r[2] * k);
      core(Pt, mk(shrink), paint, dark); if (line) contour(Pt, mk(1, Math.min(detail, 3)), line);
      const q = rot ? new THREE.Quaternion().setFromEuler(new THREE.Euler(rot[0], rot[1], rot[2], 'YXZ')) : null;
      return { c: V3(...c), r: V3(...r), q, qi: q ? q.clone().invert() : null };
    };
    // Where on an upright ellipsoid a point of it is, as a direction from its middle (the unit ball it was made from).
    const dirOn = (s, p, out = V3()) => out.set((p.x - s.c.x) / s.r.x, (p.y - s.c.y) / s.r.y, (p.z - s.c.z) / s.r.z).normalize();
    const onEll = (s, u, grow, oP, oN) => { if (s.at) return s.at(u, grow, oP, oN); oP.set(u.x * s.r.x * grow, u.y * s.r.y * grow, u.z * s.r.z * grow); oN.set(u.x / s.r.x, u.y / s.r.y, u.z / s.r.z).normalize(); if (s.q) { oP.applyQuaternion(s.q); oN.applyQuaternion(s.q); } oP.add(s.c); };
    // A form that is not a plain ellipsoid (a head): the ball's own directions, each pushed in or out by warp(u) ->
    // [x, y, z factors]; paint(normal, where, direction); keep(u) leaves some of it out (a cap of hair over a head).
    const shaped = (Pt, c, r, warp, paint, { detail = 5, shrink = 0.95, dark = 0.9, line = 0.0024, keep = null, edge = 0 } = {}) => {
      const C = V3(...c), t1 = V3(), t2 = V3(), q0 = V3(), q1 = V3(), q2 = V3(), uu = V3();
      const pt = (u, k, out) => { const w = warp(u); return out.set(u.x * r[0] * w[0] * k, u.y * r[1] * w[1] * k, u.z * r[2] * w[2] * k); };
      const at = (u, grow, oP, oN) => {
        t1.crossVectors(u, Math.abs(u.y) < 0.9 ? V3(0, 1, 0) : V3(1, 0, 0)).normalize(); t2.crossVectors(u, t1);
        pt(u, 1, q0); pt(uu.copy(u).addScaledVector(t1, 0.04).normalize(), 1, q1); pt(uu.copy(u).addScaledVector(t2, 0.04).normalize(), 1, q2);
        oN.crossVectors(q1.sub(q0), q2.sub(q0)).normalize(); if (oN.dot(q0) < 0) oN.negate();
        pt(u, grow, oP).add(C);
      };
      const mesh = (k, dt, fn) => {
        const g = shape.ball(1, 0xffffff, dt), P = g.attributes.position, u = [V3(), V3(), V3()], cen = V3(), p = V3(), n = V3();
        for (let f = 0; f < P.count; f += 3) {
          for (let j = 0; j < 3; j++) u[j].fromBufferAttribute(P, f + j).normalize();
          if (keep) {
            // (a face that crosses the edge is drawn in to the edge, corner by corner, so the edge is a line and not teeth)
            const ins = [keep(u[0]), keep(u[1]), keep(u[2])], i0 = ins.indexOf(true); if (i0 < 0) continue;
            for (let j = 0; j < 3; j++) if (!ins[j]) { let a = 0, b = 1; for (let it = 0; it < 9; it++) { const m = (a + b) / 2; if (keep(cen.copy(u[i0]).lerp(u[j], m).normalize())) a = m; else b = m; } u[j].copy(cen.copy(u[i0]).lerp(u[j], a).normalize()); }
          }
          fn(u, p, n, k);
        }
      };
      mesh(shrink, detail, (u, p, n, k) => { for (let j = 0; j < 3; j++) { at(u[j], k, p, n); sc.copy(paint(n, p, u[j])).multiplyScalar(dark); vert(Pt, p, n, sc, UV_SOLID); } });
      if (line) { const sd = (lineSeed += 5.3); mesh(1, keep ? detail : Math.min(detail, 3), (u, p, n) => { for (const j of [0, 2, 1]) { at(u[j], 1, p, n); const f = smooth(vn(p.x * 36 + sd, p.y * 30 + sd * 0.7, p.z * 36), 0.36, 0.62); p.addScaledVector(n, line * (0.12 + 0.88 * f)); vert(Pt, p, n.negate(), INKC, UV_LINE); } }); }
      return { c: C, r: V3(...r), q: null, qi: null, at };
    };
    // A flat patch of paint lying on a form: fn(a, b) -> a direction on its ball, a and b 0..1; cf(a, b) its colour.
    const patch = (Pt, s, fn, na, nb, cf, lift) => {
      const G = [], N = [], C = [];
      for (let j = 0; j <= nb; j++) for (let i = 0; i <= na; i++) { const p = V3(), n = V3(); onEll(s, fn(i / na, j / nb).normalize(), 1, p, n); p.addScaledVector(n, lift); G.push(p); N.push(n); C.push(cf(i / na, j / nb)); }
      const id = (i, j) => j * (na + 1) + i, tri = (a, b, c) => { for (const k of [a, b, c]) vert(Pt, G[k], N[k], C[k], UV_SOLID); };
      for (let j = 0; j < nb; j++) for (let i = 0; i < na; i++) { tri(id(i, j), id(i + 1, j), id(i + 1, j + 1)); tri(id(i, j), id(i + 1, j + 1), id(i, j + 1)); }
    };
    // A form hanging down a part's own -y from y0 (a sleeve, a leg, a skirt): rad(t, ph) its radius, t 0..1 down its
    // length, ph round it; xf sets it somewhere else (the stool's legs).
    const loft = (Pt, len, rad, paint, { seg = 12, rows = 4, shrink = 0.9, dark = 0.8, line = 0.003, y0 = 0, xf = null, caps = true } = {}) => {
      const at = (t, ph, out = V3(), k = 1) => { const r = rad(clamp01(t), ph) * k; out.set(Math.cos(ph) * r, y0 - t * len, Math.sin(ph) * r); return xf ? out.applyMatrix4(xf) : out; };
      const pa = V3(), pb = V3(), pc = V3(), pd = V3(), ax = V3();
      const normal = (t, ph, out = V3()) => { at(t, ph + 0.03, pa); at(t, ph - 0.03, pb); at(t + 0.02, ph, pc); at(t - 0.02, ph, pd); out.crossVectors(pa.sub(pb), pc.sub(pd)).normalize(); at(t, ph, pa); ax.set(0, y0 - t * len, 0); if (xf) ax.applyMatrix4(xf); if (out.dot(pa.sub(ax)) < 0) out.negate(); return out; };
      const mesh = k => {
        const P = [], N = [], g = new THREE.BufferGeometry(), a = V3(), b = V3(), c = V3(), d = V3(), na = V3(), nb = V3(), nc = V3(), nd = V3();
        const push = (p, n) => { P.push(p.x, p.y, p.z); N.push(n.x, n.y, n.z); };
        for (let j = 0; j < rows; j++) for (let i = 0; i < seg; i++) {
          const t0 = j / rows, t1 = (j + 1) / rows, p0 = i / seg * TAU, p1 = (i + 1) / seg * TAU;
          at(t0, p0, a, k); at(t0, p1, b, k); at(t1, p1, c, k); at(t1, p0, d, k); normal(t0, p0, na); normal(t0, p1, nb); normal(t1, p1, nc); normal(t1, p0, nd);
          // (wound so that its front is its outside)
          e1.copy(b).sub(a); e2.copy(d).sub(a); e3.crossVectors(e1, e2);
          if (e3.dot(na) >= 0) { push(a, na); push(b, nb); push(c, nc); push(a, na); push(c, nc); push(d, nd); } else { push(a, na); push(c, nc); push(b, nb); push(a, na); push(d, nd); push(c, nc); }
        }
        if (caps) for (const [t, s] of [[0, 1], [1, -1]]) {
          ax.set(0, y0 - t * len, 0); if (xf) ax.applyMatrix4(xf); const nn = V3(0, s, 0); if (xf) nn.transformDirection(xf);
          for (let i = 0; i < seg; i++) { at(t, i / seg * TAU, a, k); at(t, (i + 1) / seg * TAU, b, k); e1.copy(a).sub(ax); e2.copy(b).sub(ax); e3.crossVectors(e1, e2); if (e3.dot(nn) >= 0) { push(ax, nn); push(a, nn); push(b, nn); } else { push(ax, nn); push(b, nn); push(a, nn); } }
        }
        g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); return g;
      };
      core(Pt, mesh(shrink), paint, dark); if (line) contour(Pt, mesh(1), line);
      return { at, normal, len };
    };
    const e1 = V3(), e2 = V3(), e3 = V3(), side = V3(), d2 = V3(), cl = V3(), ca = new THREE.Color(), cb = new THREE.Color();
    // A ribbon of paint through six points lying on a form (Ps, the form's normal at each, Ns), w wide, with the brush's
    // print on it (cell: 0 a drag, 1 a dry one, 2 a soft round touch): close on the form where the brush set down, its
    // dry end lifted a little and one long edge too.
    const ribbon = (Pt, Ps, Ns, w, c, { lift = 0.0016, tip = 0.0032, ridge = 0.05, cell = -1, tilt = 0.3, prof = null } = {}) => {
      const k = cell < 0 ? (rand() < 0.5 ? 0 : 1) : cell, flip = rand() < 0.5, A = [], Bq = [], ua = [], ub = [], m = Ps.length - 1;
      const ta = tilt * (0.5 + rand()) * (rand() < 0.5 ? -1 : 1), cw = Math.cos(ta) * w / 2, sw = Math.sin(ta) * w / 2;
      for (let i = 0; i <= m; i++) {
        d2.copy(Ps[Math.min(m, i + 1)]).sub(Ps[Math.max(0, i - 1)]); side.crossVectors(Ns[i], d2); if (side.lengthSq() < 1e-16) return; side.normalize();
        const s = flip ? 1 - i / m : i / m;
        cl.copy(Ps[i]).addScaledVector(Ns[i], lift + tip * s * s); const pf = prof ? prof(i / m) : 1;      // (prof: a mark that swells and thins along its length)
        A.push(cl.clone().addScaledVector(side, -cw * pf).addScaledVector(Ns[i], -sw * pf)); Bq.push(cl.clone().addScaledVector(side, cw * pf).addScaledVector(Ns[i], sw * pf)); ua.push(UVQ(k, s, 0)); ub.push(UVQ(k, s, 1));
      }
      ca.copy(c).multiplyScalar(1 + ridge); cb.copy(c).multiplyScalar(1 - ridge * 0.7);
      for (let i = 0; i < m; i++) { vert(Pt, A[i], Ns[i], cb, ua[i]); vert(Pt, Bq[i + 1], Ns[i + 1], ca, ub[i + 1]); vert(Pt, Bq[i], Ns[i], ca, ub[i]); vert(Pt, A[i], Ns[i], cb, ua[i]); vert(Pt, A[i + 1], Ns[i + 1], cb, ua[i + 1]); vert(Pt, Bq[i + 1], Ns[i + 1], ca, ub[i + 1]); }
    };
    const tq = new THREE.Quaternion();
    const along = (n, flow, jit) => { const d = flow.clone().addScaledVector(n, -flow.dot(n)); if (d.lengthSq() < 1e-4) d.set(n.y, -n.x, 0); if (d.lengthSq() < 1e-6) d.set(1, 0, 0); return d.normalize().applyQuaternion(tq.setFromAxisAngle(n, (rand() - 0.5) * jit)); };
    // A scrub lying on an ellipsoid as an arc of it, through the direction u0, running d (a direction on the unit ball), len long.
    const arc = (Pt, s, u0, d, len, w, c, o = {}) => {
      const Rm = (s.r.x + s.r.y + s.r.z) / 3, g = o.grow || 1, Ps = [], Ns = [], m = len < 0.017 ? 2 : len < 0.03 ? 3 : 5;      // (a short mark bends little: fewer points)
      for (let k = 0; k <= m; k++) { const al = (k / m - 0.5) * len / Rm, u = u0.clone().multiplyScalar(Math.cos(al)).addScaledVector(d, Math.sin(al)).normalize(), p = V3(), n = V3(); onEll(s, u, g, p, n); Ps.push(p); Ns.push(n); }
      ribbon(Pt, Ps, Ns, w, c, o);
    };
    // A coat of n scrubs over an ellipsoid; tn(normal, luck, direction on the ball) the colour of each; keep(u, p) to leave some out.
    const coat = (Pt, s, n, tn, { l = [0.03, 0.05], w = [0.014, 0.022], flow = V3(0, -1, 0), jit = 0.6, keep = null, ...o } = {}) => {
      const p = V3(), nn = V3();
      for (let i = 0, tries = 0; i < n && tries < n * 12; tries++) {
        const yy = 1 - 2 * rand(), ph = rand() * TAU, r = Math.sqrt(Math.max(0, 1 - yy * yy)), u0 = V3(r * Math.cos(ph), yy, r * Math.sin(ph));
        onEll(s, u0, 1, p, nn); const r1 = rand(), r2 = rand(), r3 = rand();
        if (keep && !keep(u0, p)) continue;
        arc(Pt, s, u0, along(u0, typeof flow === 'function' ? flow(u0) : flow, jit), lerp(l[0], l[1], r1), lerp(w[0], w[1], r2), tn(nn, r3, u0), o); i++;
      }
    };
    // A scrub on a loft: from t - dt / 2 to t + dt / 2 down it, drifting dph round it.
    const lay = (Pt, s, t, ph, dt, dph, w, c, o) => { const Ps = [], Ns = [], m = dt * s.len < 0.03 ? 2 : 4; for (let k = 0; k <= m; k++) { const q = k / m - 0.5; Ps.push(s.at(t + q * dt, ph + q * dph)); Ns.push(s.normal(clamp01(t + q * dt), ph + q * dph)); } ribbon(Pt, Ps, Ns, w, c, o); };
    // A coat of n scrubs down a loft; tn(normal, luck, t, ph).
    const drape = (Pt, s, n, tn, { l = [0.04, 0.07], w = [0.014, 0.022], drift = 0.5, t0 = 0, t1 = 1, keep = null, ...o } = {}) => {
      for (let i = 0, tries = 0; i < n && tries < n * 12; tries++) {
        const len = lerp(l[0], l[1], rand()), dt = Math.min(0.9, len / s.len), t = lerp(t0 + dt / 2, t1 - dt / 2, rand()), ph = rand() * TAU, r2 = rand(), r3 = rand(), dph = (rand() - 0.5) * drift;
        if (keep && !keep(t, ph)) continue;
        lay(Pt, s, t, ph, dt, dph, lerp(w[0], w[1], r2), tn(s.normal(t, ph), r3, t, ph), o); i++;
      }
    };
    // One mark of the brush on an ellipsoid, through points given as directions on its ball (his line, where it is a line).
    const mark = (Pt, s, us, w, c, o = {}) => {
      const cv = new THREE.CatmullRomCurve3(us, false, 'centripetal').getPoints(o.prof ? 8 : 5), Ps = [], Ns = [];
      for (const u of cv) { const p = V3(), n = V3(); onEll(s, u.normalize(), o.grow || 1, p, n); Ps.push(p); Ns.push(n); }
      ribbon(Pt, Ps, Ns, w, c, { tilt: 0.06, tip: 0.0004, lift: 0.0032, ridge: 0, ...o });
    };
    const DOWNISH = V3(0.25, -1, 0).normalize(), ACROSS = V3(1, 0.1, 0).normalize(), DOWN = V3(0, -1, 0);
    const DRAG = { tip: 0.0022, tilt: 0.22 }, CLOSE = { tip: 0.0012, tilt: 0.16, lift: 0.0012, ridge: 0.03 };
    const lin = (a, b) => t => lerp(a, b, t);

    // ---------------------------------------------------------- Jacques: the jacket, the slate jersey up to his chin
    const jTor = part();
    {
      // (the jersey shows in the V of the jacket, from the roll at his chin down to the top button)
      const VB = 0.074, vw = y => lerp(0.003, 0.029, Math.pow(clamp01((y - VB) / 0.125), 0.8));
      const inV = (p, m = 0) => p.z > 0 && p.y > VB && Math.abs(p.x) < vw(p.y) + m, chest = p => p.z > 0.012 && p.y > 0.05 && Math.abs(p.x) < 0.052;
      const uM = under(MAROON), uS = under(SLATE), tM = mixer(MAROON), tS = mixer(SLATE, 0.22, 0.06);
      const t = ell(jTor, [0, 0.085, 0], [0.068, 0.128, 0.048], (n, p) => (inV(p) ? uS(n) : uM(n)), { detail: 4, line: 0.0036 });
      coat(jTor, t, 140, tM, { l: [0.04, 0.075], w: [0.016, 0.027], flow: DOWNISH, jit: 0.9, keep: (u, p) => !chest(p), ...DRAG });
      // (the jacket's fronts, laid close and straight down beside the opening, so its edge is clean)
      coat(jTor, t, 60, tM, { l: [0.022, 0.034], w: [0.012, 0.017], flow: DOWN, jit: 0.3, keep: (u, p) => chest(p) && !inV(p, 0.007), ...CLOSE, lift: 0.002 });
      // (the jersey: short touches laid across, close in tone: knitted stuff, flat)
      coat(jTor, t, 46, tS, { l: [0.012, 0.02], w: [0.009, 0.013], flow: V3(1, 0, 0), jit: 0.3, keep: (u, p) => p.z > 0.01 && p.y > VB + 0.008 && p.y < 0.205 && Math.abs(p.x) < vw(p.y) - 0.005, cell: 2, ...CLOSE, tip: 0.0004, lift: 0.0024 });
      // (the lapels: his line, in three marks a side; the front edge below the button; the button; the pocket his hand goes to)
      const fr = (x, y) => dirOn(t, V3(x, y, t.c.z + t.r.z * Math.sqrt(Math.max(0.02, 1 - Math.pow(x / t.r.x, 2) - Math.pow((y - t.c.y) / t.r.y, 2)))));
      for (const sd of [-1, 1]) for (const [ya, yb] of [[0.2, 0.158], [0.156, 0.114], [0.112, VB - 0.002]]) mark(jTor, t, [0, 0.5, 1].map(q => { const y = lerp(ya, yb, q); return fr(sd * (vw(y) + 0.0015), y); }), 0.0056, INKC, { cell: 0, lift: 0.0046 });
      mark(jTor, t, [fr(0.002, VB - 0.004), fr(0.005, 0.03), fr(0.011, -0.025)], 0.0042, INKC, { cell: 1, lift: 0.0042 });
      mark(jTor, t, [fr(0.0015, VB - 0.012), fr(0.0055, VB - 0.012), fr(0.0095, VB - 0.012)], 0.0075, INKC, { cell: 2, lift: 0.0046 });
      mark(jTor, t, [fr(-0.056, 0.024), fr(-0.044, 0.013), fr(-0.032, 0.009)], 0.0032, INKC, { cell: 1, lift: 0.0042 });
      // the roll of the jersey, thick and turned over, up to his chin
      const roll = ell(jTor, [0, 0.2, 0.005], [0.0325, 0.021, 0.0325], uS, { detail: 3, line: 0.003 });
      coat(jTor, roll, 44, tS, { l: [0.02, 0.034], w: [0.008, 0.012], flow: V3(1, 0, 0), jit: 0.16, ...CLOSE, tip: 0.0005 });
      for (const [y, w] of [[0.16, 0.003], [-0.42, 0.0026]]) for (const sd of [-1, 1]) mark(jTor, roll, [V3(sd * 0.05, y, 1), V3(sd * 0.6, y - 0.04, 0.8), V3(sd * 0.98, y - 0.02, 0.15)], w, INKC, { cell: 1, lift: 0.003 });      // its folds
    }
    // ---------------------------------------------------------- the two heads, each from the canvas: the oval he gave
    // it, its flesh in a few flat planes, and his own marks set where he set them. A face is measured in its own
    // halves: fx across (to the sitter's left), fy up, 0 at its middle, 1 at the hairline, -1 at the chin.
    const TAPER = s => 0.3 + 0.7 * Math.sin(PI * s), ALMOND = s => Math.pow(Math.sin(PI * Math.min(0.97, Math.max(0.03, s))), 0.7);
    const LINE = { cell: 0, prof: TAPER, tilt: 0, tip: 0, lift: 0.0034 }, FLAT = { cell: 3, prof: ALMOND, tilt: 0, tip: 0, lift: 0.003 };
    const headKit = (Y0, KY) => ({
      fd: (fx, fy) => { const y = Y0 + fy * KY; return V3(fx, y, Math.sqrt(Math.max(0.02, 1 - fx * fx - y * y))); },
      g: (u, fx, fy, sx, sy) => (u.z < -0.05 ? 0 : Math.exp(-Math.pow((u.x - fx) / sx, 2) - Math.pow(((u.y - Y0) / KY - fy) / sy, 2))),
    });
    const jHead = part();
    {
      // Jacques: broad and heavy, full through the jaw; thick dark hair; the eyes small and close, the nose one long
      // line from the brow, the mouth small. The lit side (his left) ochre-pink, the other greyer.
      const uF = under(FLJ), uH = under(HRJ), tH = mixer(HRJ, 0.5, 0.16), c = new THREE.Color();
      const GREY = col('#a8705a', 0.1), SHADE = col('#8c5a48', 0.1), LIP = col('#b4553f', 0.1), EYE = col('#52707c', 0.1), INKF = col('#2a1c20', 0.04);
      const HW = 0.0355, HH = 0.0418, Y0 = -0.149, KY = 0.851, K = headKit(Y0, KY), fd = K.fd, g = K.g;
      const HC = [0, 0.0605, 0.006], HR = [HW * 1.03, HH * 1.175, 0.04];
      const warp = u => { const j = smooth(-u.y, 0.4, 1); return [1 - 0.13 * j, 1, u.z > 0 ? 1 - 0.1 * j : 1]; };
      const hairy = u => u.y > lerp(Y0 + KY * (1.0 - 0.5 * u.x * u.x), -0.42, smooth(-u.z, -0.3, 0.4));
      loft(jHead, 0.04, lin(0.0175, 0.0185), n => uF(n), { y0: 0.026, line: 0, seg: 12, rows: 2, caps: false, shrink: 1, dark: 0.88 });
      const facep = u => {
        c.copy(FLJ.mid[0]).lerp(FLJ.hi[0], 0.55 * smooth(u.x, -0.15, 0.6)).lerp(GREY, 0.5 * smooth(-u.x, 0.1, 0.85)).lerp(FLJ.lo[0], 0.4 * smooth(-u.y, 0.72, 1));
        for (const sd of [-1, 1]) c.lerp(SHADE, 0.34 * g(u, sd * 0.37, 0.17, 0.25, 0.085));                       // the leaf of shade between each brow and its eye
        c.lerp(SHADE, 0.55 * g(u, 0.0, -0.08, 0.1, 0.3)).lerp(SHADE, 0.3 * g(u, 0.03, -0.47, 0.17, 0.035));      // the shade down the near side of his nose; his lip
        return c.lerp(LIP, 0.6 * g(u, 0.03, -0.585, 0.17, 0.05));
      };
      const hd = shaped(jHead, HC, HR, warp, (n, p, u) => facep(u), { detail: 6, shrink: 0.97, dark: 0.97, line: 0.0026 });
      const nose = ell(jHead, [-0.0005, HC[1] + (Y0 - 0.06 * KY) * HR[1], HC[2] + HR[2] * 0.93], [0.0046, 0.0145, 0.0068], n => c.copy(uF(n)).lerp(FLJ.hi[0], 0.25), { detail: 2, shrink: 1, dark: 0.98, line: 0 });
      const feature = u => Math.max(g(u, 0.38, 0.14, 0.36, 0.2), g(u, -0.38, 0.14, 0.36, 0.2), g(u, 0.03, -0.58, 0.26, 0.09), g(u, 0.14, -0.1, 0.09, 0.3));
      coat(jHead, hd, 90, (n, r, u) => facep(u).clone().multiplyScalar(0.985 + 0.03 * r), { l: [0.009, 0.015], w: [0.008, 0.012], jit: 2.4, keep: u => u.z > 0.1 && !hairy(u) && feature(u) < 0.3, cell: 2, tip: 0.0005, lift: 0.0008, ridge: 0.015, tilt: 0.1 });
      for (const sd of [-1, 1]) {
        mark(jHead, hd, [fd(sd * 0.74, 0.1), fd(sd * 0.44, 0.3), fd(sd * 0.1, 0.2)], 0.0023, INKF, LINE);                                      // the brow
        mark(jHead, hd, [fd(sd * 0.15, 0.03), fd(sd * 0.33, 0.05), fd(sd * 0.51, 0.035)], 0.0042, EYE, FLAT);                                  // the eye: small, blue-grey
        mark(jHead, hd, [fd(sd * 0.13, 0.04), fd(sd * 0.33, 0.1), fd(sd * 0.53, 0.045)], 0.0015, INKF, { ...LINE, lift: 0.0038 });            // and its lid
        mark(jHead, hd, [fd(sd * 0.17, 0.015), fd(sd * 0.33, -0.005), fd(sd * 0.49, 0.02)], 0.001, INKF, { ...LINE, lift: 0.0038 });
      }
      mark(jHead, hd, [fd(0.12, 0.21), fd(0.11, -0.04), fd(0.15, -0.24), fd(0.21, -0.34)], 0.0027, INKF, LINE);                               // the nose: one long line from the brow
      mark(jHead, hd, [fd(-0.11, -0.4), fd(0.04, -0.435), fd(0.19, -0.37)], 0.0019, INKF, LINE);
      mark(jHead, hd, [fd(-0.15, -0.585), fd(0.03, -0.6), fd(0.21, -0.57)], 0.0044, LIP, { ...FLAT, lift: 0.0026 });                          // the mouth, small and closed
      mark(jHead, hd, [fd(-0.15, -0.58), fd(0.03, -0.598), fd(0.21, -0.565)], 0.0014, INKF, { ...LINE, lift: 0.0038 });
      // his hair: thick, dark, a cap over the brow and down before the ears
      const hair = shaped(jHead, HC, HR, u => { const w = warp(u), k = 1.085 + 0.05 * Math.abs(u.x) * smooth(u.y, -0.1, 0.5); return [w[0] * k, w[1] * 1.07, w[2] * 1.08]; }, n => uH(n), { detail: 5, shrink: 0.985, dark: 0.82, line: 0.003, keep: hairy });
      coat(jHead, hair, 96, tH, { l: [0.016, 0.028], w: [0.009, 0.014], flow: u => V3(u.x * 0.9, -0.55, -0.7), jit: 0.6, keep: u => hairy(u) && u.y > lerp(Y0 + KY * (1.12 - 0.5 * u.x * u.x), -0.3, smooth(-u.z, -0.3, 0.4)), grow: 1.012, tip: 0.0012 });
      coat(jHead, hair, 30, tH, { l: [0.009, 0.014], w: [0.006, 0.009], flow: u => V3(1, -u.x * 0.85, -0.25 * u.x), jit: 0.3, cell: 2, keep: u => u.z > 0 && hairy(u) && u.y < Y0 + KY * (1.14 - 0.5 * u.x * u.x), grow: 1.012, tip: 0.0006, tilt: 0.12 });      // (along the hairline, not down over the brow)
      for (const sd of [-1, 1]) {
        const ear = ell(jHead, [sd * (HR[0] + 0.0035), HC[1] + (Y0 + 0.24 * KY) * HR[1], 0.001], [0.006, 0.0135, 0.0078], n => c.copy(uF(n)).lerp(sd < 0 ? GREY : FLJ.mid[1], 0.5), { detail: 2, shrink: 1, dark: 0.97, line: 0.002 });
        arc(jHead, ear, V3(sd, 0.1, 0.3).normalize(), V3(0, 1, 0), 0.016, 0.008, sd < 0 ? GREY : FLJ.mid[1], { cell: 2, lift: 0.0006, tip: 0, tilt: 0.05 });
      }
    }
    const tT = mixer(TROU, 0.5, 0.14), uT = under(TROU), tSh = mixer(SHOE, 0.4), uSh = under(SHOE);
    const jArmU = part(), jArmF = part(), jThigh = part(), jShin = part();
    {
      const uM = under(MAROON), tM = mixer(MAROON), uF = under(FLJ), tF = mixer(FLJ, 0.3, 0.06);
      const sh = ell(jArmU, [0, -0.003, 0], [0.026, 0.027, 0.026], uM, { detail: 2 });
      coat(jArmU, sh, 26, tM, { l: [0.022, 0.036], w: [0.012, 0.018], keep: u => u.y > -0.2, ...DRAG });
      const u = loft(jArmU, JK.AU, lin(0.0245, 0.0205), uM);
      drape(jArmU, u, 34, tM, { l: [0.04, 0.065], w: [0.013, 0.02], ...DRAG });
      const el = ell(jArmF, [0, 0, 0], [0.0205, 0.0205, 0.0205], uM, { detail: 2, line: 0 });
      coat(jArmF, el, 12, tM, { l: [0.018, 0.028], w: [0.01, 0.015], ...DRAG });
      const f = loft(jArmF, 0.092, lin(0.0205, 0.0165), uM);
      drape(jArmF, f, 30, tM, { l: [0.035, 0.058], w: [0.012, 0.018], ...DRAG });
      const hand = ell(jArmF, [0, -JK.AF, 0.001], [0.0115, 0.017, 0.009], uF, { detail: 2, shrink: 0.95, dark: 0.92, line: 0.0018 });
      coat(jArmF, hand, 22, tF, { l: [0.008, 0.013], w: [0.006, 0.009], cell: 2, ...CLOSE });
      const hip = ell(jThigh, [0, 0, 0], [0.034, 0.034, 0.034], uT, { detail: 2, line: 0 });
      coat(jThigh, hip, 10, tT, { l: [0.02, 0.03], w: [0.012, 0.018], ...DRAG });
      const th = loft(jThigh, JK.TH, lin(0.034, 0.0275), uT);
      drape(jThigh, th, 34, tT, { l: [0.05, 0.085], w: [0.015, 0.023], drift: 0.35, ...DRAG });
      const kn = ell(jShin, [0, 0, 0], [0.0275, 0.0275, 0.0275], uT, { detail: 2, line: 0 });
      coat(jShin, kn, 8, tT, { l: [0.018, 0.028], w: [0.011, 0.016], ...DRAG });
      const shin = loft(jShin, 0.128, t => lerp(0.0275, 0.022, Math.min(1, t * 1.2)) + 0.003 * smooth(t, 0.75, 1), uT, { rows: 5 });
      drape(jShin, shin, 30, tT, { l: [0.045, 0.075], w: [0.014, 0.021], drift: 0.35, ...DRAG });
      const shoe = ell(jShin, [0, -0.133, 0.014], [0.019, 0.0125, 0.035], uSh, { detail: 2, line: 0.002 });
      coat(jShin, shoe, 16, tSh, { l: [0.016, 0.028], w: [0.009, 0.014], flow: V3(0, 0, 1), jit: 0.5, keep: u => u.y > -0.2, ...CLOSE });
    }

    // ---------------------------------------------------------- Berthe: the dark dress, the wide white collar
    const bTor = part();
    {
      const uD = under(DRESS), uW = under(WHITE), uF = under(FLB), tD = mixer(DRESS, 0.5, 0.16), tW = mixer(WHITE, 0.45, 0.08), tF = mixer(FLB, 0.3, 0.05);
      // (round the top of the ball: th down from its crown, ph round from the front; the collar's scalloped edge, and
      // the V it opens in at her throat)
      const TH0 = 0.24, edge = ph => 0.9 + 0.075 * Math.abs(Math.sin(ph * 3.5)) + 0.07 * Math.cos(ph), gapAt = th => lerp(0.8, 0.16, Math.pow(clamp01((th - TH0) / (0.95 - TH0)), 0.8));
      const zone = u => { const th = Math.acos(Math.max(-1, Math.min(1, u.y))), ph = Math.atan2(u.x, u.z); return th > edge(ph) + 0.02 ? 0 : Math.abs(ph) < gapAt(th) ? 2 : 1; };      // dress, collar, throat
      const TC = [0, 0.078, 0], TR = [0.05, 0.095, 0.038], tb = { c: V3(...TC), r: V3(TR[0] * 0.93, TR[1] * 0.93, TR[2] * 0.93) };
      const t = ell(bTor, TC, TR, (n, p) => { const z = zone(dirOn(tb, p)); return z === 1 ? uW(n) : z === 2 ? uF(n) : uD(n); }, { detail: 4, line: 0.0034 });
      const hipb = ell(bTor, [0, 0.004, 0], [0.05, 0.044, 0.046], uD, { detail: 2, line: 0 });
      coat(bTor, t, 84, tD, { l: [0.035, 0.06], w: [0.015, 0.024], flow: DOWNISH, jit: 0.9, keep: u => zone(u) === 0 && u.y < 0.42, ...DRAG });
      coat(bTor, t, 30, tD, { l: [0.016, 0.026], w: [0.012, 0.018], flow: DOWN, jit: 0.4, keep: u => zone(u) === 0 && u.y >= 0.42 && u.y < 0.72, ...CLOSE });      // (short ones under the collar, so none runs up into her throat)
      coat(bTor, hipb, 22, tD, { l: [0.03, 0.05], w: [0.015, 0.022], flow: ACROSS, jit: 0.8, keep: u => u.y < 0.3, ...DRAG });
      // the collar: his clean white shape (scalloped, open in a V at her throat), then its edge broken by a few dry
      // drags of the same white and his line found and lost under it
      const cth = (a, b) => lerp(TH0, edge(lerp(0.12, TAU - 0.12, a)), b), cdir = (th, ph) => V3(Math.sin(th) * Math.sin(ph), Math.cos(th), Math.sin(th) * Math.cos(ph));
      patch(bTor, t, (a, b) => { const th = cth(a, b), g0 = gapAt(th) + 0.015; return cdir(th, Math.max(g0, Math.min(TAU - g0, lerp(0.12, TAU - 0.12, a)))); }, 56, 4,
        (a, b) => WHITE.hi[0].clone().lerp(WHITE.mid[0], 0.55 * smooth(b, 0.35, 1) + 0.3 * vn(a * 23, b * 5, 3.3)).lerp(WHITE.hi[2], 0.5 * vn(a * 41, b * 7, 9.1)), 0.0034);
      for (let i = 0; i < 20; i++) { if (rand() < 0.3) continue; const ph = lerp(0.5, TAU - 0.5, (i + rand() * 0.6) / 20), th = edge(ph) - 0.03 - 0.03 * rand(); arc(bTor, t, cdir(th, ph), V3(Math.cos(ph), 0, -Math.sin(ph)), 0.014 + 0.012 * rand(), 0.006 + 0.004 * rand(), tW(cdir(th, ph), rand()), { cell: 1, lift: 0.0042, tip: 0.0004, tilt: 0.08, ridge: 0.02 }); }
      for (const [pa, pb] of [[0.5, 0.95], [1.4, 1.95], [2.5, 3.0], [3.5, 4.1], [4.6, 5.0], [5.3, 5.75]]) mark(bTor, t, [0, 0.5, 1].map(q => { const ph = lerp(pa, pb, q); return cdir(edge(ph) + 0.012, ph); }), 0.0022, INKC, { cell: 1, lift: 0.0026 });
      coat(bTor, t, 44, tF, { l: [0.009, 0.015], w: [0.007, 0.011], jit: 1.2, keep: u => zone(u) === 2 && Math.acos(u.y) > 0.2, cell: 2, ...CLOSE, lift: 0.0036 });
      for (const sd of [-1, 1]) mark(bTor, t, [0.3, 0.6, 0.98].map(th => V3(Math.sin(th) * Math.sin(sd * gapAt(th)), Math.cos(th), Math.sin(th) * Math.cos(gapAt(th)))), 0.003, INKC, { cell: 0, lift: 0.0042 });      // where it opens at her throat
    }
    const bHead = part();
    {
      // Berthe: a tilted oval, wide through the cheek and coming to a point at the chin; large dark almond eyes set
      // apart (the one on her left a little the higher, as he has it); his rose on both cheeks; a small closed mouth;
      // dark hair parted and close to the head; a long neck.
      const uF = under(FLB), uH = under(HRB), tH = mixer(HRB, 0.5, 0.2), c = new THREE.Color();
      const ROSE = col('#de6f5c', 0.08), GREY = col('#c08a6c', 0.1), SHADE = col('#b0714f', 0.1), LIP = col('#b23c2e', 0.08), LIPD = col('#7c2c24', 0.06), EYE = col('#1d181b', 0.03), INKF = col('#241a1e', 0.04);
      const HW = 0.03, HH = 0.0385, Y0 = -0.13, KY = 0.87, K = headKit(Y0, KY), fd = K.fd, g = K.g, ft = (fx, fy) => fd(fx, fy + 0.11 * fx);
      const HC = [0, 0.0655, 0.004], HR = [HW * 1.03, HH * 1.15, 0.0335];
      const warp = u => { const j = smooth(-u.y, 0.12, 1), ck = Math.exp(-Math.pow((u.y + 0.2) / 0.3, 2)); return [(1 - 0.34 * j) * (1 + 0.04 * ck), 1, u.z > 0 ? 1 - 0.2 * j : 1]; };
      const hairy = u => { const ax = Math.abs(u.x); return u.y > lerp(Y0 + KY * (1.0 - 0.55 * Math.pow(ax, 2.2) - 1.3 * smooth(ax, 0.84, 1)), -0.6, smooth(-u.z, -0.3, 0.35)); };
      const nk = loft(bHead, 0.056, lin(0.0132, 0.0146), n => c.copy(uF(n)).lerp(GREY, 0.25), { y0: 0.04, line: 0.002, seg: 12, rows: 3, caps: false, shrink: 0.97, dark: 0.95 });
      drape(bHead, nk, 22, (n, r) => c.copy(uF(n)).lerp(GREY, 0.2).clone().multiplyScalar(0.985 + 0.03 * r), { l: [0.016, 0.026], w: [0.008, 0.012], cell: 2, t0: 0.3, ...CLOSE });
      const facep = u => {
        c.copy(FLB.mid[0]).lerp(FLB.hi[0], 0.5 * smooth(u.x, -0.3, 0.5)).lerp(GREY, 0.42 * smooth(-u.x, 0.35, 0.95)).lerp(FLB.lo[0], 0.4 * smooth(-u.y, 0.7, 1));
        c.lerp(FLB.hi[1], 0.4 * g(u, 0.0, 0.1, 0.075, 0.36));                                                       // the pale ridge of her nose
        c.lerp(ROSE, 0.7 * g(u, 0.58, -0.08, 0.27, 0.24)).lerp(ROSE, 0.7 * g(u, -0.5, -0.24, 0.27, 0.22));       // his rose on her cheeks
        for (const sd of [-1, 1]) c.lerp(SHADE, 0.22 * g(u, sd * 0.45, 0.4 + 0.05 * sd, 0.3, 0.09));
        return c.lerp(LIPD, 0.5 * g(u, 0.06, -0.47, 0.2, 0.035)).lerp(LIP, 0.8 * g(u, 0.06, -0.535, 0.18, 0.04));
      };
      const hd = shaped(bHead, HC, HR, warp, (n, p, u) => facep(u), { detail: 6, shrink: 0.97, dark: 0.97, line: 0.0024 });
      const nose = ell(bHead, [0.0002, HC[1] + (Y0 + 0.06 * KY) * HR[1], HC[2] + HR[2] * 0.94], [0.0036, 0.0125, 0.0052], n => c.copy(uF(n)).lerp(FLB.hi[1], 0.4), { detail: 2, shrink: 1, dark: 0.98, line: 0 });
      const feature = u => Math.max(g(u, 0.45, 0.36, 0.4, 0.22), g(u, -0.45, 0.28, 0.4, 0.22), g(u, 0.06, -0.5, 0.3, 0.1), g(u, 0.15, 0.1, 0.09, 0.4));
      coat(bHead, hd, 90, (n, r, u) => facep(u).clone().multiplyScalar(0.985 + 0.03 * r), { l: [0.008, 0.013], w: [0.007, 0.011], jit: 2.4, keep: u => u.z > 0.1 && !hairy(u) && feature(u) < 0.3, cell: 2, tip: 0.0005, lift: 0.0008, ridge: 0.015, tilt: 0.1 });
      for (const sd of [-1, 1]) {
        mark(bHead, hd, [ft(sd * 0.84, 0.3), ft(sd * 0.44, 0.545), ft(sd * 0.15, 0.48)], 0.002, INKF, LINE);                                   // the brow: one clean arc
        mark(bHead, hd, [ft(sd * 0.2, 0.25), ft(sd * 0.45, 0.275), ft(sd * 0.7, 0.225)], 0.0058, EYE, FLAT);                                   // the eye: a dark almond
        mark(bHead, hd, [ft(sd * 0.18, 0.3), ft(sd * 0.45, 0.375), ft(sd * 0.73, 0.275)], 0.0012, INKF, { ...LINE, lift: 0.0038 });            // and the fold of its lid
      }
      mark(bHead, hd, [fd(0.15, 0.5), fd(0.11, 0.2), fd(0.14, -0.05), fd(0.25, -0.21)], 0.0023, INKF, LINE);                                   // the nose: his line from her left brow down to its tip
      mark(bHead, hd, [fd(-0.14, 0.38), fd(-0.11, 0.08), fd(-0.05, -0.24)], 0.0012, INKF.clone().lerp(FLB.lo[0], 0.45), LINE);                 // and the fainter one down its other side
      mark(bHead, hd, [fd(-0.07, -0.29), fd(0.08, -0.315), fd(0.25, -0.235)], 0.0017, INKF, LINE);
      mark(bHead, hd, [fd(-0.18, -0.5), fd(0.06, -0.52), fd(0.31, -0.465)], 0.0058, LIP, { ...FLAT, lift: 0.0026 });                           // the mouth: small, closed, a little up at one corner
      mark(bHead, hd, [fd(-0.19, -0.492), fd(0.06, -0.505), fd(0.32, -0.458)], 0.0014, LIPD, { ...LINE, lift: 0.0038 });
      // her hair: close to the head, parted in the middle and drawn down over her ears; knotted behind
      const hair = shaped(bHead, HC, HR, u => { const w = warp(u); return [Math.max(w[0], 0.8) * 1.07, w[1] * 1.045, w[2] * 1.06]; }, n => uH(n), { detail: 5, shrink: 0.985, dark: 0.82, line: 0.0026, keep: hairy });
      const inset = u => { const ax = Math.abs(u.x); return u.y > lerp(Y0 + KY * (1.13 - 0.55 * Math.pow(ax, 2.2) - 1.3 * smooth(ax, 0.84, 1)), -0.45, smooth(-u.z, -0.3, 0.35)); };
      coat(bHead, hair, 96, tH, { l: [0.015, 0.026], w: [0.008, 0.013], flow: u => V3(Math.sign(u.x || 1) * 0.9, -1, -0.3), jit: 0.5, keep: u => hairy(u) && inset(u), grow: 1.012, tip: 0.0012 });
      coat(bHead, hair, 34, tH, { l: [0.008, 0.013], w: [0.005, 0.008], flow: u => V3(Math.sign(u.x || 1), -1.2 * Math.abs(u.x) - 0.15, -0.2), jit: 0.3, cell: 2, keep: u => u.z > 0 && hairy(u) && !inset(u), grow: 1.012, tip: 0.0006, tilt: 0.12 });      // (from her parting out along the hairline)
      const bun = ell(bHead, [0, HC[1] - 0.012, HC[2] - 0.039], [0.0155, 0.015, 0.0125], uH, { detail: 2, line: 0.002 });
      coat(bHead, bun, 20, tH, { l: [0.012, 0.02], w: [0.007, 0.011], flow: ACROSS, jit: 1.2, grow: 1.03, tip: 0.0016 });
    }
    const bArmU = part(), bArmF = part(), bSkU = part(), bSkL = part(), bShoe = part();
    {
      const uD = under(DRESS), tD = mixer(DRESS, 0.5, 0.16), uF = under(FLB), tF = mixer(FLB, 0.3, 0.05), cF = new THREE.Color();
      const sh = ell(bArmU, [0, -0.002, 0], [0.0195, 0.0205, 0.0195], uD, { detail: 2 });
      coat(bArmU, sh, 22, tD, { l: [0.018, 0.03], w: [0.01, 0.015], keep: u => u.y > -0.2, ...DRAG });
      const u = loft(bArmU, BK.AU, lin(0.0182, 0.0152), uD);
      drape(bArmU, u, 26, tD, { l: [0.03, 0.05], w: [0.011, 0.017], ...DRAG });
      const el = ell(bArmF, [0, 0, 0], [0.0152, 0.0152, 0.0152], uD, { detail: 2, line: 0 });
      coat(bArmF, el, 8, tD, { l: [0.014, 0.022], w: [0.009, 0.013], ...DRAG });
      const f = loft(bArmF, 0.071, lin(0.0152, 0.0118), uD);
      drape(bArmF, f, 24, tD, { l: [0.028, 0.045], w: [0.01, 0.015], ...DRAG });
      const hand = ell(bArmF, [0, -BK.AF, 0.001], [0.0085, 0.0125, 0.007], uF, { detail: 2, shrink: 0.95, dark: 0.92, line: 0.0016 });
      coat(bArmF, hand, 18, tF, { l: [0.007, 0.011], w: [0.005, 0.008], cell: 2, ...CLOSE });
      // the skirt: long folds that deepen to the hem, lighter along their tops and dark in the hollows
      const fold = ph => Math.cos(7 * ph + 0.7 * Math.sin(3 * ph + 1));
      const foldTone = (S, amt) => { const m = mixer(S, 0.5, 0.16); return (n, r, t, ph) => m(n, r).lerp(fold(ph) > 0 ? S.hi[0] : S.lo[0], amt * Math.abs(fold(ph)) * (0.3 + 0.7 * t)); };
      const hipj = ell(bSkU, [0, 0, 0], [0.046, 0.046, 0.046], uD, { detail: 2, line: 0 });
      coat(bSkU, hipj, 20, tD, { l: [0.025, 0.04], w: [0.014, 0.02], ...DRAG });
      const a = loft(bSkU, BK.TH, (t, ph) => lerp(0.046, 0.052, t) * (1 + 0.025 * t * fold(ph)), (n, p) => uD(n), { seg: 24, rows: 4 });
      drape(bSkU, a, 60, foldTone(DRESS, 0.3), { l: [0.05, 0.085], w: [0.016, 0.026], drift: 0.25, ...DRAG });
      const kn = ell(bSkL, [0, 0, 0], [0.052, 0.05, 0.052], uD, { detail: 2, line: 0 });
      coat(bSkL, kn, 22, tD, { l: [0.025, 0.04], w: [0.014, 0.02], keep: u => u.y > 0.1, ...CLOSE });
      const SK = (t, ph) => lerp(0.052, 0.071, Math.pow(t, 0.8)) * (1 + (0.02 + 0.085 * t) * fold(ph));
      const b = loft(bSkL, 0.108, SK, (n, p) => { const ph = Math.atan2(p.z, p.x), t = clamp01(-p.y / 0.108); return cF.copy(uD(n)).lerp(fold(ph) > 0 ? DRESS.hi[0] : DRESS.lo[1], 0.5 * Math.abs(fold(ph)) * (0.3 + 0.7 * t)); }, { seg: 35, rows: 5, line: 0.0034 });
      drape(bSkL, b, 116, foldTone(DRESS, 0.55), { l: [0.045, 0.085], w: [0.012, 0.02], drift: 0.12, ...DRAG });
      loft(bShoe, 0.036, lin(0.0085, 0.0075), n => uSh(n), { y0: 0.05, line: 0, seg: 8, rows: 2, shrink: 1 });
      const shoe = ell(bShoe, [0, 0.0115, 0.01], [0.0125, 0.0115, 0.026], uSh, { detail: 2, line: 0.0018 });
      coat(bShoe, shoe, 12, tSh, { l: [0.012, 0.02], w: [0.007, 0.011], flow: V3(0, 0, 1), jit: 0.5, keep: u => u.y > -0.2, ...CLOSE });
    }
    // ---------------------------------------------------------- the stool (ours: the picture stops above it), in the
    // ochre of his panel, dragged along the grain
    const stool = part();
    {
      const uW = under(WOOD), tW = mixer(WOOD, 0.5, 0.14);
      const seat = ell(stool, [0, 0.097, 0], [0.06, 0.0095, 0.06], uW, { detail: 3, line: 0.0026, shrink: 0.95 });
      coat(stool, seat, 34, tW, { l: [0.03, 0.055], w: [0.011, 0.017], flow: V3(1, 0, 0.2), jit: 0.35, keep: u => u.y > 0.25, ...CLOSE, lift: 0.0018 });
      coat(stool, seat, 18, tW, { l: [0.02, 0.034], w: [0.007, 0.01], flow: ACROSS, jit: 0.3, keep: u => Math.abs(u.y) < 0.25, ...CLOSE });
      for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
        const top = V3(sx * 0.036, 0.094, sz * 0.036), foot = V3(sx * 0.05, 0.0, sz * 0.05), ax = foot.clone().sub(top), len = ax.length();
        const xf = new THREE.Matrix4().compose(top, new THREE.Quaternion().setFromUnitVectors(V3(0, -1, 0), ax.normalize()), V3(1, 1, 1));
        const lg = loft(stool, len, lin(0.0078, 0.0062), n => uW(n), { xf, seg: 8, rows: 3, line: 0.0018, shrink: 0.92 });
        drape(stool, lg, 7, tW, { l: [0.03, 0.05], w: [0.006, 0.009], drift: 0.2, ...CLOSE });
      }
    }

    // ---------------------------------------------------------- the rig: the two of them and the stool, one draw call
    const parts = { stool, jTor, jHead, jArmU, jArmF, jThigh, jShin, bTor, bHead, bArmU, bArmF, bSkU, bSkL, bShoe };
    let total = 0; for (const p of Object.values(parts)) total += p.pos.length / 3;
    // (flat, as his paint is: mostly its own colour, a little of the room's light; the brush's print is its bristles
    // and its edge. His line is only ever seen from inside: its far side, round the form.)
    const pm = new THREE.MeshStandardMaterial({ vertexColors: true, color: 0x9c9c9c, map: brushPrint(), alphaTest: 0.34, roughness: 0.95, metalness: 0, emissive: 0xffffff, emissiveIntensity: 0.5, side: THREE.DoubleSide });
    pm.onBeforeCompile = sh => {
      sh.fragmentShader = sh.fragmentShader.replace('#include <map_fragment>', '#include <map_fragment>\n  if (vMapUv.y > 1.5 && !gl_FrontFacing) discard;')
        .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n  totalEmissiveRadiance *= vColor.rgb;\n#ifdef USE_MAP\n  totalEmissiveRadiance *= sampledDiffuseColor.rgb;\n#endif');
    };
    pm.customProgramCacheKey = () => 'modigliani-sitters';
    const rig = this.rig = L.rig(24, total + 64, pm), gid = {};
    for (const [k, p] of Object.entries(parts)) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(p.pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(p.nor, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(p.col, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(p.uv, 2));
      gid[k] = rig.geo(g); p.pos = p.nor = p.col = p.uv = null;
    }
    const I = this.I = { stool: rig.add(gid.stool), jTor: rig.add(gid.jTor), jHead: rig.add(gid.jHead), jAU: [rig.add(gid.jArmU), rig.add(gid.jArmU)], jAF: [rig.add(gid.jArmF), rig.add(gid.jArmF)],
      jTh: [rig.add(gid.jThigh), rig.add(gid.jThigh)], jSh: [rig.add(gid.jShin), rig.add(gid.jShin)],
      bTor: rig.add(gid.bTor), bHead: rig.add(gid.bHead), bAU: [rig.add(gid.bArmU), rig.add(gid.bArmU)], bAF: [rig.add(gid.bArmF), rig.add(gid.bArmF)], bSkU: rig.add(gid.bSkU), bSkL: rig.add(gid.bSkL), bSh: [rig.add(gid.bShoe), rig.add(gid.bShoe)] };
    this.jParts = [I.jTor, I.jHead, ...I.jAU, ...I.jAF, ...I.jTh, ...I.jSh]; this.bParts = [I.bTor, I.bHead, ...I.bAU, ...I.bAF, I.bSkU, I.bSkL, ...I.bSh];
    const M4 = () => new THREE.Matrix4();
    this.M = { jRoot: M4(), jTor: M4(), jHead: M4(), jAU: [M4(), M4()], jAF: [M4(), M4()], jTh: [M4(), M4()], jSh: [M4(), M4()], bRoot: M4(), bTor: M4(), bHead: M4(), bAU: [M4(), M4()], bAF: [M4(), M4()], bSkU: M4(), bSkL: M4(), bSh: [M4(), M4()], stool: M4() };
    this.shoulder = V3(); this.sh = V3(); this.tg = V3(); this.hang = V3();

    // ---------------------------------------------------------- the room on the wall, and the name
    this.buildRoom(L, col);
    this.blobs = L.blobs(3, { y: L.y + 0.012, fade: true }); this.blobs.renderOrder = 6;

    // ---------------------------------------------------------- their ways in, and the sound
    this.bWay = way(B_WAY, BK.STRIDE * SC); this.jWay = way(J_WAY, JK.STRIDE * SC);
    this.J = this.newState(); this.Bs = this.newState(); this.J0 = this.newState(); this.B0 = this.newState(); this.o = {};
    this.band = this.makeScore(L);
    this.hideAll(); this.T = 0;
  },

  newState() { return { vis: false, u: 0, out: 0, yaw: 0, ph: 0, amp: 0, lean: 0, sway: 0, twist: 0, hy: 0, hp: 0, hr: 0, pocket: 0, reach: 0, hov: 0, sit: 0, lap: 0, rest: 0, breath: 0 }; },

  // ---------------------------------------------------------------- the room: flat scrubbed paint on the wall
  buildRoom(L, col) {
    const rand = L.rand, X = u => (u - BU0) * PXM, Y = h => RH - h * PXM, hex = (h, a) => '#' + col(h, a).getHexString();
    const cv = document.createElement('canvas'); cv.width = RW; cv.height = RH; const g = cv.getContext('2d', { willReadFrequently: true });
    const iv = document.createElement('canvas'); iv.width = RW; iv.height = RH; const gi = iv.getContext('2d', { willReadFrequently: true });
    g.fillStyle = hex('#8a9b96'); g.fillRect(0, 0, RW, RH); gi.fillStyle = '#fff'; gi.fillRect(0, 0, RW, RH);      // (when each stroke is laid: white is never)
    g.lineCap = gi.lineCap = 'round';
    const dab = (x, y, a, l, w, style, id, bend = 0, alpha = 0.55) => {
      const dx = Math.cos(a) * l / 2, dy = Math.sin(a) * l / 2, mx = -Math.sin(a) * bend * l, my = Math.cos(a) * bend * l, v = Math.max(6, Math.min(244, Math.round(id * 255)));
      g.globalAlpha = alpha;
      for (const [c, s] of [[g, style], [gi, `rgb(${v},${v},${v})`]]) { c.strokeStyle = s; c.lineWidth = w; c.beginPath(); c.moveTo(x - dx, y - dy); c.quadraticCurveTo(x + mx, y + my, x + dx, y + dy); c.stroke(); }
      g.globalAlpha = 1;
    };
    const pick = list => list[Math.floor(rand() * list.length * 0.999)];
    // A zone filled with scrubs: its own ground first (it shows only where a stroke has gone), then a jittered grid of
    // long thin strokes laid half through one another, as thin paint scrubbed over a weave is; each is kept inside the
    // zone by its own length, so the edge is the ragged ends of strokes, not a ruled line. idOf(u, h) is when each is
    // laid, 0..1.
    const fill = (u0, u1, h0, h1, cols, ang, jit, idOf, { len = [46, 110], wid = [10, 20], step = 11, rag = 5, skip = 0.02, xf = null, ground = true } = {}) => {
      const x0 = X(u0), x1 = X(u1), y0 = Y(h1), y1 = Y(h0);
      if (ground && !xf) { g.fillStyle = cols[0]; g.fillRect(x0 - 3, y0 - 3, x1 - x0 + 6, y1 - y0 + 6); }
      for (let y = y0; y <= y1 + step; y += step) for (let x = x0; x <= x1 + step; x += step) {
        if (rand() < skip) continue;
        const a = (typeof ang === 'function' ? ang() : ang) + (rand() - 0.5) * jit, l = lerp(len[0], len[1], rand()), w = lerp(wid[0], wid[1], rand());
        const ex = Math.abs(Math.cos(a)) * l / 2 + w / 2, ey = Math.abs(Math.sin(a)) * l / 2 + w / 2, rg = (rand() - 0.3) * rag;
        let px = x + (rand() - 0.5) * step * 1.4, py = y + (rand() - 0.5) * step * 1.4;
        px = x1 - x0 > 2 * ex ? Math.max(x0 + ex - rg, Math.min(x1 - ex + rg, px)) : (x0 + x1) / 2; py = y1 - y0 > 2 * ey ? Math.max(y0 + ey - rg, Math.min(y1 - ey + rg, py)) : (y0 + y1) / 2;
        const id = idOf(BU0 + px / PXM, (RH - py) / PXM);
        if (xf) { const q = xf(px, py, a); dab(q[0], q[1], q[2], l, w, pick(cols), id, (rand() - 0.5) * 0.2, 0.8); } else dab(px, py, a, l, w, pick(cols), id, (rand() - 0.5) * 0.2);
      }
    };
    const OCHRE = ['#875a25', '#93652b', '#7a5021', '#9f6f2f', '#6e471e', '#8d6029'].map(h => hex(h)), SLATES = ['#54667a', '#4b5c70', '#5d6f82', '#47586a'].map(h => hex(h));
    const PALE = ['#9cacb5', '#a8b6bc', '#92a4af', '#b0bcc0'].map(h => hex(h)), GREY = ['#7c8d88', '#73857e', '#869690', '#6c7e7c', '#8c9a92', '#788986'].map(h => hex(h));
    const BROWN = ['#57382b', '#634032', '#4c3025', '#6b4634'].map(h => hex(h));
    // (the wall first on the canvas, so the other zones' grounds lie over its edge; but it is the last to be scrubbed in)
    for (let k = 0; k < 13; k++) {
      const ua = lerp(-0.62, 0.418, k / 13) - 0.03, ub = lerp(-0.62, 0.418, (k + 1) / 13) + 0.03, top = 0.71 + 0.022 * Math.sin(k * 1.3 + 0.6) + 0.014 * rand(), base = [-0.95, 1.25, -0.6, 0.5][k % 4];
      fill(Math.max(-0.62, ua), Math.min(0.418, ub), 0, top, GREY, () => base + (rand() < 0.25 ? 1.2 : 0), 0.8, (u, h) => 0.36 + 0.44 * ((0.418 - u) / 1.04) + 0.07 * rand());
    }
    // (the ochre panel: they come in by it, so it is the first thing there)
    fill(0.5, 0.84, 0, 0.6, OCHRE, PI / 2, 0.3, (u, h) => 0.05 + 0.2 * (h / 0.6) + 0.04 * rand(), { len: [54, 120], wid: [9, 18] });
    fill(0.5, 0.84, 0.615, 0.745, SLATES, 0, 0.4, () => 0.27 + 0.06 * rand(), { len: [40, 80], wid: [9, 16] });
    fill(0.418, 0.498, 0, 0.755, PALE, PI / 2, 0.14, (u, h) => 0.2 + 0.14 * (h / 0.755) + 0.03 * rand(), { len: [50, 110], wid: [8, 14], step: 9 });
    for (const [u, c] of [[0.424, '#56668a'], [0.462, '#7f92aa'], [0.494, '#506186']]) for (let h = 0.02; h < 0.735; h += 0.05 + 0.05 * rand()) if (rand() < 0.8) dab(X(u + (rand() - 0.5) * 0.004), Y(h), PI / 2 + (rand() - 0.5) * 0.06, 26 + 30 * rand(), 2 + 1.4 * rand(), hex(c), 0.36 + 0.04 * rand(), 0, 0.8);
    // (the brown rectangle that leans behind his head: brown, a darker middle, and his line down two sides)
    { const cx = X(-0.16), cy = Y(0.5), ro = 0.2, cs = Math.cos(ro), sn = Math.sin(ro), HW = 80, HH = 58, xf = (px, py, a) => [cx + (px - 400) * cs - (py - 300) * sn, cy + (px - 400) * sn + (py - 300) * cs, a + ro];
      const fx = (u0, u1, h0, h1, cols, id, o) => { const x0 = 400 - HW + u0 * 2 * HW, x1 = 400 - HW + u1 * 2 * HW, y0 = 300 - HH + h0 * 2 * HH, y1 = 300 - HH + h1 * 2 * HH; fill(BU0 + x0 / PXM, BU0 + x1 / PXM, (RH - y1) / PXM, (RH - y0) / PXM, cols, 0, 0.4, () => id + 0.04 * rand(), { xf, len: [36, 70], wid: [10, 17], step: 9, ...o }); };
      fx(0, 1, 0, 1, BROWN, 0.86); fx(0.14, 0.6, 0.3, 0.84, ['#3d2c2b', '#453233', '#372828'].map(h => hex(h)), 0.9, { len: [22, 40], wid: [9, 14] });
      for (const [a, b] of [[[0, 0], [0, 1]], [[0, 1], [1, 1]]]) { const up = a[0] === b[0], p = xf(400 - HW + (a[0] + b[0]) * HW, 300 - HH + (a[1] + b[1]) * HH, up ? PI / 2 : 0); dab(p[0], p[1], p[2], up ? 2 * HH - 12 : 2 * HW - 14, 2.6, hex(INK), 0.95, 0.03, 0.85); } }
    // (bristle: thin dry streaks, a little lighter or darker, along the way each part was scrubbed; and the weave)
    for (let i = 0; i < 2600; i++) { const x = rand() * RW, y = rand() * RH, u = BU0 + x / PXM, a = u > 0.418 ? PI / 2 + (rand() - 0.5) * 0.3 : [-0.95, 1.25, -0.6, 0.5][Math.floor(clamp01((u + 0.62) / 1.04) * 12.99) % 4] + (rand() - 0.5) * 0.7, l = 18 + 50 * rand(), dx = Math.cos(a) * l / 2, dy = Math.sin(a) * l / 2;
      g.globalAlpha = 0.05 + 0.09 * rand(); g.strokeStyle = rand() < 0.5 ? '#efe9d8' : '#1c2028'; g.lineWidth = 1 + 2.2 * rand(); g.beginPath(); g.moveTo(x - dx, y - dy); g.lineTo(x + dx, y + dy); g.stroke(); }
    g.globalAlpha = 0.035; g.fillStyle = '#141414'; for (let y = 0; y < RH; y += 3) g.fillRect(0, y, RW, 1); for (let x = 0; x < RW; x += 3) g.fillRect(x, 0, 1, RH);
    g.globalAlpha = 1;
    const c = g.getImageData(0, 0, RW, RH).data, d = gi.getImageData(0, 0, RW, RH).data, out = new Uint8Array(RW * RH * 4);
    for (let i = 0; i < RW * RH * 4; i += 4) { out[i] = c[i]; out[i + 1] = c[i + 1]; out[i + 2] = c[i + 2]; out[i + 3] = d[i]; }
    const tex = new THREE.DataTexture(out, RW, RH, THREE.RGBAFormat); tex.colorSpace = THREE.SRGBColorSpace; tex.flipY = false; tex.generateMipmaps = true; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.magFilter = THREE.LinearFilter; tex.anisotropy = 4; tex.needsUpdate = true;
    // The name, in his thin capitals: each letter is written from its first stroke to its last (the red channel says when).
    const NW = 512, NH = 118;
    const name = canvasTexture(NW, NH, (n, w, h) => {
      n.fillStyle = '#fff'; n.fillRect(0, 0, w, h); n.lineCap = 'round'; n.lineJoin = 'round';
      const word = 'LIPCHITZ', gapW = 0.26, widths = [...word].map(ch => GLYPH[ch][0]), totalW = widths.reduce((a, b) => a + b, 0) + gapW * (word.length - 1), sc = (w - 28) / totalW, lh = h - 34;
      let x = 14;
      [...word].forEach((ch, k) => {
        const [wd, ...strokes] = GLYPH[ch], y0 = h - 14 - (k % 3 === 1 ? 3 : 0) + (k > 5 ? 4 : 0), lean = (rand() - 0.5) * 0.08;
        const pt = p => [x + (p[0] * wd + lean * p[1]) * sc * 1.0, y0 - p[1] * lh * (0.94 + 0.06 * ((k * 7) % 3) / 2)];
        let total = 0; const segs = [];
        for (const st of strokes) { const cvp = new THREE.CatmullRomCurve3(st.map(p => { const q = pt(p); return V3(q[0], q[1], 0); }), false, 'catmullrom', st.length > 4 ? 0.5 : 0.08).getPoints(st.length > 4 ? 26 : st.length > 2 ? 16 : 8); segs.push(cvp); total += cvp.length - 1; }
        let done = 0;
        for (const cvp of segs) for (let i = 0; i < cvp.length - 1; i++, done++) {
          const v = Math.round(255 * (0.04 + 0.9 * (k + 0.9 * (done + 1) / total) / word.length));
          n.strokeStyle = `rgb(${v},${v},${v})`; n.lineWidth = 6; n.beginPath(); n.moveTo(cvp[i].x, cvp[i].y); n.lineTo(cvp[i + 1].x, cvp[i + 1].y); n.stroke();
        }
        x += (wd + gapW) * sc;
      });
    }, false);
    name.generateMipmaps = true; name.minFilter = THREE.LinearMipmapLinearFilter; name.needsUpdate = true;
    const u = this.ru = { uShow: { value: 0 }, uWrite: { value: 0 }, tName: { value: name }, uInk: { value: col('#22232e', 0.05) },
      uName: { value: new THREE.Vector4((NAME.u0 - BU0) / BW, NAME.h0 / BH, (NAME.u1 - BU0) / BW, NAME.h1 / BH) } };
    const mat = new THREE.MeshBasicMaterial({ map: tex, color: new THREE.Color(0.78, 0.78, 0.78), fog: false });
    mat.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, u);
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uShow, uWrite; uniform sampler2D tName; uniform vec3 uInk; uniform vec4 uName;')
        .replace('#include <map_fragment>', `{
    vec4 tx = texture2D(map, vec2(vMapUv.x, 1.0 - vMapUv.y));
    if (tx.a > min(uShow, 0.97)) discard;                                       // (not painted here, or not yet)
    vec3 c = tx.rgb;
    vec2 nq = (vMapUv - uName.xy) / (uName.zw - uName.xy);
    if (nq.x > 0.0 && nq.x < 1.0 && nq.y > 0.0 && nq.y < 1.0) { float nid = texture2D(tName, vec2(nq.x, nq.y)).r; if (nid < min(uWrite, 0.96)) c = mix(c, uInk, 0.9); }
    diffuseColor.rgb *= c;
  }`);
    };
    mat.customProgramCacheKey = () => 'modigliani-room';
    const m = this.room = new THREE.Mesh(new THREE.PlaneGeometry(BW, BH), mat); m.name = 'room';
    // (a flat standing just clear of the skirting, which is 3.5 cm proud of the wall, and in front of the lamp's wash)
    L.at((BU0 + BU1) / 2 * SC + UO, L.y + BH * SC / 2 - L.cy, -L.wall + 0.046, m.position); m.rotation.y = L.yawOut; m.scale.set(SC, SC, 1); m.renderOrder = 5;
    L.add(m);
  },

  // ---------------------------------------------------------------- the sound, on the show's clock
  makeScore(L) {
    const s = score(L), E3 = 164.81, GS4 = 415.3;
    const brush = (t, vol = 0.011) => s.hit(t, { d: 0.26, vol, bp: 1500 + 700 * ((t * 7.3) % 1), q: 0.9, attack: 0.07 });
    for (const t of [0.04, 0.3, 0.52, 0.8, 1.02, 1.3]) brush(t);
    // their steps: hers light, his a little lower
    for (const [w, win, lp, vol] of [[this.bWay, B_IN, 900, 0.01], [this.jWay, J_IN, 520, 0.013]]) for (let k = 1; k <= w.steps; k++) { const t = win[0] + invProf(k / w.steps) * (win[1] - win[0]); s.hit(t, { d: 0.05, vol, lp, attack: 0.004 }).note(t, lp * 0.16, 0.05, { vol: vol * 0.9, type: 'sine', attack: 0.004 }); }
    s.note(0.42, 150, 0.09, { vol: 0.014, type: 'sine', to: 110, attack: 0.005 });                         // the stool stands
    s.note(SIT[1] - 0.12, 118, 0.16, { vol: 0.016, type: 'sine', to: 92, attack: 0.01 }).hit(SIT[1] - 0.12, { d: 0.12, vol: 0.008, lp: 700, attack: 0.02 });      // she sits
    const two = (t, v = 1) => {
      s.note(t, E3, 2.6, { vol: 0.034 * v, type: 'triangle', attack: 0.03, over: 2, overVol: 0.18 });      // his hand comes to rest
      return t;
    };
    const hers = (t, v = 1) => s.note(t, GS4, 2.4, { vol: 0.026 * v, type: 'triangle', attack: 0.04, over: 2, overVol: 0.14 });
    two(T_HAND); hers(TILT[0] + 0.2);
    // the name: a tick of the brush to each letter
    for (let k = 0; k < 8; k++) { const t = WRITE[0] + (k + 0.3) / 8 * (WRITE[1] - WRITE[0]); s.hit(t, { d: 0.09, vol: 0.007, bp: 2600, q: 1.2, attack: 0.02 }); }
    brush(6.32, 0.008);                                                                                    // one more touch, and the brush stops
    two(AGAIN[1], 0.9); hers(TILT2[0] + 0.22, 0.9);
    // and on it goes: the brush, now and then
    s.loop(IDLE, 3.1, [{ t: 0, noise: true, d: 0.28, vol: 0.008, bp: 1700, q: 0.9, attack: 0.08 }, { t: 0.42, noise: true, d: 0.24, vol: 0.007, bp: 2000, q: 0.9, attack: 0.07 }, { t: 1.7, noise: true, d: 0.3, vol: 0.007, bp: 1500, q: 0.9, attack: 0.09 }]);
    return s.done();
  },

  hideAll() { for (const i of [this.I.stool, ...this.jParts, ...this.bParts]) this.rig.show(i, false); this.blobs.count = 0; this.ru.uShow.value = 0; this.ru.uWrite.value = 0; this.room.visible = false; },
  start(L, resumed) { this.T = L.t; this.band.from(L.t); },
  end(L) { this.hideAll(); },
  reset(L) { this.hideAll(); this.T = 0; this.told = this.told2 = false; },

  // The look has ended: where each of them is, and the way back to the ochre panel from there.
  back(L) {
    this.bT = this.T || 0;
    Object.assign(this.J0, this.J); Object.assign(this.B0, this.Bs);
    const home = (s, via, stride) => (s.vis ? way(s.u < 0.5 * SC + UO && s.out > 0.12 * SC ? [[s.u, s.out], ...via.map(sc2), sc2([0.66, 0.1]), DOOR] : [[s.u, s.out], [lerp(s.u, DOOR[0], 0.6), lerp(s.out, DOOR[1], 0.5)], DOOR], stride * SC) : null);
    this.jHome = home(this.J0, [[0.36, 0.3]], JK.STRIDE); this.bHome = home(this.B0, [[0.4, 0.58]], BK.STRIDE);
    this.show0 = this.ru.uShow.value; this.write0 = this.ru.uWrite.value;
    if (!L.quiet && L.voice().ctx) { const v = L.voice(); v.note(415.3, 0.9, { at: 0.15, vol: 0.014, type: 'triangle', attack: 0.03 }); v.note(164.81, 1.2, { at: 0.55, vol: 0.018, type: 'triangle', attack: 0.03 }); }
  },

  // ---------------------------------------------------------------- where they are and what they are doing at show-time T
  showState(L, T, J, B, calm) {
    const o = this.o, out0 = L.yawOut;
    // ---- Berthe: in by the ochre panel, across to the stool, round, and down
    {
      const k = clamp01((T - B_IN[0]) / (B_IN[1] - B_IN[0])), s = prof(k); this.bWay.at(s, o);
      B.vis = T > B_IN[0]; B.u = o.u; B.out = o.out; B.ph = PI * this.bWay.steps * s; B.amp = 1;
      B.yaw = turnTo(L.yawOf(o.du, o.dout), out0 + B_YAW, ease.inOut(ramp(T, B_IN[1] - 0.5, B_IN[1] + 0.12)));
      const sit = ease.inOut(ramp(T, SIT[0], SIT[1])), seat = smooth(T, SIT[0] + 0.2, SIT[1] + 0.35);
      B.sit = sit + (calm ? 0 : 0.035 * hump(T, SIT[1], SIT[1] + 0.3));
      // (she bends to sit, and then sits with her weight back)
      B.lean = 0.34 * hump(T, SIT[0] - 0.05, SIT[1] + 0.05) - 0.07 * seat + 0.015 * smooth(T, TILT[0], TILT[1]);
      B.lap = Math.max(0.16 * (1 - sit), ease.inOut(ramp(T, SIT[0] + 0.35, SIT[1] + 0.4)));
      // her head: half way across she glances back at him over her shoulder; a look down for the stool; then, seated
      // three-quarters away, she turns it back to the painter. When his hand comes to rest she inclines it to him.
      // When the brush stops she straightens and looks up at him; and then back, as before.
      const back = hump(T, 0.95, calm ? 2.25 : 2.0);
      const up = ease.inOut(ramp(T, EASE[0] + 0.1, EASE[1])) * (1 - ease.inOut(ramp(T, AGAIN[0] + 0.25, TILT2[0] + 0.25)));
      const tilt = ease.inOut(ramp(T, TILT[0], TILT[1])) * (1 - up);
      const glance = T > IDLE ? this.glance(T, 0, calm) : 0, lookUp = Math.max(up, glance * 0.8);
      B.twist = 0.32 * back - 0.06 * seat;
      B.hy = 0.85 * back - 0.3 * seat - 0.62 * lookUp + 0.2 * hump(T, B_IN[1] - 0.6, SIT[0] + 0.2);
      B.hp = 0.3 * hump(T, SIT[0] - 0.35, SIT[0] + 0.45) + 0.02 - 0.28 * lookUp;
      B.hr = (0.06 * seat + 0.2 * tilt) * (1 - glance * 0.7) + 0.012 * Math.sin(T * 0.7 + 1);
      B.sway = 0.04 * tilt; B.breath = T;
    }
    // ---- Jacques: in after her, round behind the stool, to her shoulder
    {
      const k = clamp01((T - J_IN[0]) / (J_IN[1] - J_IN[0])), s = prof(k); this.jWay.at(s, o);
      J.vis = T > J_IN[0]; J.u = o.u; J.out = o.out; J.ph = PI * this.jWay.steps * s; J.amp = 1;
      J.yaw = turnTo(L.yawOf(o.du, o.dout), out0 + J_YAW, ease.inOut(ramp(k, 0.7, 1)));
      J.pocket = ease.inOut(ramp(T, POCKET[0], POCKET[1]));
      const down = ease.inOut(ramp(T, T_HAND - 0.27, T_HAND)), off = ease.inOut(ramp(T, EASE[0], EASE[1] - 0.15)) * (1 - ease.inOut(ramp(T, AGAIN[0], AGAIN[1])));
      J.reach = ease.inOut(ramp(T, LIFT[0], LIFT[1]));
      J.hov = 0.048 * (1 - down) + 0.042 * off - (calm ? 0 : 0.004 * hump(T, T_HAND, T_HAND + 0.22) + 0.004 * hump(T, AGAIN[1], AGAIN[1] + 0.22));
      // his head: he watches his hand down onto her shoulder, then looks out, chin up, as he does in the picture; when
      // the brush stops he looks down at her; then out again, with a small nod: go on.
      const toHer = Math.max(hump(T, LIFT[0] + 0.1, T_HAND + 0.45), ease.inOut(ramp(T, EASE[0] + 0.15, EASE[1] + 0.05)) * (1 - ease.inOut(ramp(T, AGAIN[0] - 0.25, AGAIN[0] + 0.15))), T > IDLE ? this.glance(T, 0.5, calm) * 0.8 : 0);
      // (settled, his weight is on the leg away from her and his head is turned a little down towards her)
      const posed = smooth(T, J_IN[1] - 0.2, J_IN[1] + 0.5), walking = J.vis ? 1 - smooth(k, 0.75, 1) : 0;
      J.rest = smooth(T, J_IN[1] - 0.05, J_IN[1] + 0.7);
      J.hy = lerp(0.2 * posed + 0.22 * walking, 0.55, toHer); J.hp = lerp(0.09 * posed, 0.36, toHer) + 0.13 * hump(T, AGAIN[0] - 0.1, AGAIN[0] + 0.35);
      J.hr = lerp(0.07 * posed, 0, toHer) + 0.01 * Math.sin(T * 0.6);
      J.lean = 0.018 * J.reach * (1 - J.hov / 0.05); J.sway = -0.02 * J.reach + 0.008 * posed * Math.sin(T * 0.45); J.breath = T;
    }
  },
  // While the sitting goes on: now and then one of them glances at the other (0..1), she first, he half a beat after.
  glance(T, lag, calm) { const P = 8.4, x = ((T - IDLE - 2.6 - lag) % P + P) % P, d = calm ? 2.6 : 1.9; return x < d ? Math.sin(PI * smooth(x, 0, d)) : 0; },

  // ---------------------------------------------------------------- going home: up, round, and out by the ochre panel
  retState(L, r, J, B) {
    const o = this.o, J0 = this.J0, B0 = this.B0;
    Object.assign(J, J0); Object.assign(B, B0);
    if (J0.vis) {
      const k = ease.inOut(ramp(r, 0, 0.2)), w = prof(ramp(r, 0.1, 0.78)); this.jHome.at(w, o);
      J.rest = J0.rest * (1 - k); J.reach = J0.reach * (1 - k); J.hov = lerp(J0.hov, 0.05, k); J.pocket = J0.pocket * (1 - k); J.hy = J0.hy * (1 - k); J.hp = J0.hp * (1 - k); J.hr = J0.hr * (1 - k); J.lean = J0.lean * (1 - k); J.sway = J0.sway * (1 - k);
      J.u = o.u; J.out = o.out; J.yaw = turnTo(J0.yaw, L.yawOf(o.du, o.dout), ease.inOut(ramp(r, 0.06, 0.3))); J.ph = J0.ph + PI * this.jHome.steps * w; J.amp = 1;
    }
    if (B0.vis) {
      const k = ease.inOut(ramp(r, 0, 0.25)), w = prof(ramp(r, 0.24, 0.92)); this.bHome.at(w, o);
      B.twist = B0.twist * (1 - k); B.sit = B0.sit * (1 - k); B.lap = lerp(B0.lap, 0.16, ease.inOut(ramp(r, 0, 0.16))); B.lean = 0.3 * B0.sit * hump(r, 0, 0.27); B.hy = B0.hy * (1 - k); B.hp = B0.hp * (1 - k); B.hr = B0.hr * (1 - k); B.sway = B0.sway * (1 - k);
      B.u = o.u; B.out = o.out; B.yaw = turnTo(B0.yaw, L.yawOf(o.du, o.dout), ease.inOut(ramp(r, 0.2, 0.42))); B.ph = B0.ph + PI * this.bHome.steps * w; B.amp = 1;
    }
  },

  // An arm from the shoulder S to the hand at T (world), the elbow towards `pole`: fills the two parts' matrices
  // (each part hangs along its own -y).
  arm(S, T, pole, a, b, M1, M2) {
    const V = this.V; V.d.copy(T).sub(S); const len = V.d.length() || 1e-5, dist = Math.max(Math.abs(a - b) + 0.004, Math.min(a + b - 0.0015, len)); V.d.multiplyScalar(1 / len);
    const x = (a * a - b * b + dist * dist) / (2 * dist), h = Math.sqrt(Math.max(0, a * a - x * x));
    V.p.copy(pole).addScaledVector(V.d, -pole.dot(V.d)); if (V.p.lengthSq() < 1e-8) V.p.set(1, 0, 0); V.p.normalize();
    V.el.copy(S).addScaledVector(V.d, x).addScaledVector(V.p, h); V.tip.copy(S).addScaledVector(V.d, dist);
    M1.compose(S, V.q.setFromUnitVectors(V.down, V.w.copy(V.el).sub(S).normalize()), V.sc);
    M2.compose(V.el, V.q.setFromUnitVectors(V.down, V.w.copy(V.tip).sub(V.el).normalize()), V.sc);
  },

  poseB(L, s) {
    const { B, M, V, rig, I } = this;
    for (const i of this.bParts) rig.show(i, s.vis);
    if (!s.vis) return;
    const th = 1.5 * s.sit, sn = Math.sin(s.ph), walk = s.amp * (1 - clamp01(s.sit * 3)), bob = -0.005 * Math.abs(sn) * walk, br = 0.0012 * Math.sin(s.breath * 1.9);
    L.floor(s.u, s.out, V.v); B.set(M.bRoot, V.v.x, V.v.y, V.v.z, s.yaw, 0, 0, SC);
    const hy = BK.KNEE + BK.TH * Math.cos(th) + bob, hz = -BK.TH * Math.sin(th);
    B.child(M.bTor, M.bRoot, 0, hy + br, hz, s.twist, s.lean, s.sway + 0.03 * sn * walk);
    B.child(M.bHead, M.bTor, 0, BK.NECK, 0, s.hy, s.hp, s.hr);
    B.child(M.bSkU, M.bRoot, 0, hy, hz, 0, -th, 0);
    B.child(M.bSkL, M.bRoot, 0, BK.KNEE + bob, 0, 0, 0.05 * sn * walk, 0);
    for (let k = 0; k < 2; k++) {
      const side = k ? 1 : -1;
      B.child(M.bSh[k], M.bRoot, side * 0.021, 0, 0.012 + side * sn * 0.045 * walk + 0.012 * s.sit, side * 0.12, 0, 0);
      // her arms: at her sides as she walks; her hands together in her lap when she sits
      V.a.set(side * BK.SH[0], BK.SH[1], 0).applyMatrix4(M.bTor);
      this.hang.set(side * 0.06, hy - 0.018, 0.016 - side * sn * 0.045 * walk).applyMatrix4(M.bRoot);
      this.tg.set(side * 0.011, 0.058, 0.078).applyMatrix4(M.bTor); this.tg.lerpVectors(this.hang, this.tg, s.lap);
      V.pole.set(side * 1, -0.25, -0.7).transformDirection(M.bRoot);
      this.arm(V.a, this.tg, V.pole, BK.AU * SC, BK.AF * SC, M.bAU[k], M.bAF[k]);
      rig.mat(I.bAU[k], M.bAU[k]); rig.mat(I.bAF[k], M.bAF[k]); rig.mat(I.bSh[k], M.bSh[k]);
    }
    rig.mat(I.bTor, M.bTor); rig.mat(I.bHead, M.bHead); rig.mat(I.bSkU, M.bSkU); rig.mat(I.bSkL, M.bSkL);
    this.shoulder.set(BK.SH[0] - 0.004, BK.SH[1] + 0.028, 0.006).applyMatrix4(M.bTor);      // where his hand will lie
  },

  poseJ(L, s) {
    const { B, M, V, rig, I } = this;
    for (const i of this.jParts) rig.show(i, s.vis);
    if (!s.vis) return;
    const A = JK.SWING * s.amp, sn = Math.sin(s.ph), cs = Math.cos(s.ph), dy = JK.LEG * (Math.cos(A * Math.abs(sn)) - 1), br = 0.0014 * Math.sin(s.breath * 1.6 + 1);
    L.floor(s.u, s.out, V.v); B.set(M.jRoot, V.v.x, V.v.y, V.v.z, s.yaw, 0, 0, SC);
    // (at rest his weight goes onto his right leg: the hips shift over it, the left knee eases forward)
    const e = s.rest, hipX = -0.013 * e;
    B.child(M.jTor, M.jRoot, hipX, JK.HIP + dy + br - 0.002 * e, 0, 0.08 * sn * s.amp, s.lean + 0.04 * Math.abs(sn) * s.amp, s.sway + 0.035 * e);
    B.child(M.jHead, M.jTor, 0, JK.NECK[0], JK.NECK[1], s.hy, s.hp, s.hr - 0.03 * e);
    for (let k = 0; k < 2; k++) {
      const side = k ? 1 : -1, p = side * sn, sw = Math.max(0, side * cs), free = k ? e : 0;
      B.child(M.jTh[k], M.jRoot, side * 0.033 + hipX, JK.HIP + dy - 0.002 * e, 0, 0.12 * free, -A * p - 0.25 * A * sw * sw - 0.2 * free, 0.043 * e + 0.05 * free);
      B.child(M.jSh[k], M.jTh[k], 0, -JK.TH, 0, 0, 1.25 * A * Math.pow(sw, 1.5) + 0.36 * free, 0);
      rig.mat(I.jTh[k], M.jTh[k]); rig.mat(I.jSh[k], M.jSh[k]);
      // his arms: swinging as he walks; then the right to his pocket, and the left to her shoulder
      V.a.set(side * JK.SH[0], JK.SH[1], 0).applyMatrix4(M.jTor);
      this.hang.set(side * 0.078, JK.HIP + dy - 0.02, 0.022 - side * sn * 0.075 * s.amp).applyMatrix4(M.jRoot);
      if (k === 0) { this.tg.set(-0.058, 0.004, 0.03).applyMatrix4(M.jTor); this.tg.lerpVectors(this.hang, this.tg, s.pocket); V.pole.set(-1, -0.1, -0.9); }
      else {
        const r = s.reach; this.tg.copy(this.shoulder); this.tg.y += s.hov * SC; this.sh.set(-0.3, 0, -0.5).transformDirection(M.jRoot); this.tg.addScaledVector(this.sh, s.hov * 0.5 * SC);
        this.tg.lerpVectors(this.hang, this.tg, r); this.tg.y += 0.035 * SC * Math.sin(PI * r); V.pole.set(0.7, -0.35, -0.7);
      }
      V.pole.transformDirection(M.jRoot);
      this.arm(V.a, this.tg, V.pole, JK.AU * SC, JK.AF * SC, M.jAU[k], M.jAF[k]);
      rig.mat(I.jAU[k], M.jAU[k]); rig.mat(I.jAF[k], M.jAF[k]);
    }
    rig.mat(I.jTor, M.jTor); rig.mat(I.jHead, M.jHead);
  },

  update(L, dt) {
    const back = L.phase === 'return', T = back ? this.bT : (this.T = L.t), r = back ? L.ret : 0, calm = L.calm, J = this.J, Bs = this.Bs, V = this.V, ru = this.ru;
    if (!back) {
      this.band.play(T);
      if (!this.told && !L.quiet && T > 0.5) { this.told = true; L.k.say('A wedding portrait: Berthe Lipchitz sits, and Jacques stands with a hand on her shoulder.', 4.5); }
      if (!this.told2 && !L.quiet && T > EASE[0] + 0.3) { this.told2 = true; L.k.say('According to Lipchitz, Modigliani painted this in two days. Lipchitz had him work on for two more weeks, to pay him more.', 6); }
      this.showState(L, T, J, Bs, calm);
    } else this.retState(L, r, J, Bs);
    this.poseB(L, Bs); this.poseJ(L, J);
    // the stool stands up out of the floor, and goes back into it last
    const sk = (calm ? ease.out : ease.outBack)(ramp(T, 0.12, 0.5)) * (back ? 1 - ease.in(ramp(r, 0.5, 0.74)) : 1);
    this.rig.show(this.I.stool, sk > 0.01);
    L.floor(STOOL[0], STOOL[1], V.v); this.B.set(this.M.stool, V.v.x, V.v.y, V.v.z, L.yawOut + 0.5, 0, 0, V.s.set((0.6 + 0.4 * sk) * SC, sk * SC, (0.6 + 0.4 * sk) * SC)); this.rig.mat(this.I.stool, this.M.stool);
    // the room on the wall: scrubbed on, the ochre panel first; rubbed off again the other way. The name is written
    // while they hold still.
    this.room.visible = true;
    if (!back) { ru.uShow.value = ramp(T, 0, 1.55); ru.uWrite.value = ramp(T, WRITE[0], WRITE[1]) * 1.02; }
    else { ru.uShow.value = this.show0 * (1 - ease.inOut(ramp(r, 0.5, 1))); ru.uWrite.value = this.write0 * (1 - ramp(r, 0, 0.3)); }
    // soft shadows at their feet
    let n = 0; const bl = this.blobs;
    if (sk > 0.01) { L.floor(STOOL[0], STOOL[1], V.v); bl.set(n++, V.v.x, V.v.z, 0.085 * SC * sk, 0.4 * sk); }
    if (Bs.vis && Bs.out > 0.02) { V.v.set(0, 0, -0.05 * Bs.sit).applyMatrix4(this.M.bRoot); bl.set(n++, V.v.x, V.v.z, 0.1 * SC, 0.5 * smooth(Bs.out, 0.02, 0.2)); }
    if (J.vis && J.out > 0.02) { V.v.set(0, 0, 0.005).applyMatrix4(this.M.jRoot); bl.set(n++, V.v.x, V.v.z, 0.085 * SC, 0.5 * smooth(J.out, 0.02, 0.2)); }
    bl.count = n;
    const voice = L.voice(); voice.level = calm ? 0.6 : 1; voice.place();
    this.soften(L, dt, sk);
  },

  // They and the stool are soft to the toy: it is eased out round them (never stopped dead, never through them).
  soften(L, dt, stool) {
    const G = L.k.G, v = G.vehicle, V = this.V;
    if (L.quiet || dt <= 0 || G.state !== 'play' || !v || !v.group.visible || Math.abs(v.pos.y - L.y) > 0.45) return;
    for (let i = 0; i < 3; i++) {
      const s = i === 0 ? this.J : this.Bs, r = (i === 0 ? 0.085 : i === 1 ? 0.1 : 0.075) * SC;
      if (i === 2) { if (stool < 0.5) continue; L.floor(STOOL[0], STOOL[1], V.v); } else { if (!s.vis || s.out < 0.1) continue; L.floor(s.u, s.out, V.v); }
      const dx = v.pos.x - V.v.x, dz = v.pos.z - V.v.z, d = Math.hypot(dx, dz), reach = r + (v.radius || 0.19);
      if (d >= reach || d < 1e-4) continue;
      const nx = dx / d, nz = dz / d, k = Math.min(1, dt * 10), into = v.vel.x * nx + v.vel.z * nz;
      v.pos.x += nx * (reach - d) * k; v.pos.z += nz * (reach - d) * k;
      if (into < 0) { v.vel.x -= nx * into * k; v.vel.z -= nz * into * k; }
    }
  },
});
