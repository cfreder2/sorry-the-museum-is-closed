// Paul Cezanne, Madame Cezanne in a Yellow Chair (1888–90), Gallery 248. The word: trace.
//
// One in a series of four portraits he made of his wife, Hortense Fiquet; in this one she sits, hands folded, in a
// yellow armchair covered in a leafy damask. The museum's note says two things about it. Technical examination suggests he
// did not paint it from life: he traced it, the second in the series, from the first, which he did. And the
// dark-blue outlines he used to sketch out the forms "remain visible in the final work". So this picture is a line
// that was carried from one canvas to another, with colour laid into it afterwards in his slanting touches, which do
// not quite fill it; and in it nothing stands plumb: the chair leans, and holds.
//
// She stays in her picture. What comes out is her chair, toy-sized, and his line. Look, and a small drawing in dark
// blue line comes out from under the frame, grows as it comes down, and is set on the floor to the left: a chair, all
// outline. Colour is laid into it from the floor up, patch by patch: ochre, straw and gold, the dark sprigs and
// scrolls of the damask, the cooler side turned from the light. That is the first one, and it stands. Then a second
// line, wet and bluer, runs round it over the first, quickly, from the feet up to the top of the back and round the
// arms: the tracing. It comes away from the chair, a chair of line with nothing in it, is carried across the floor,
// swinging a little as a thing carried by its top does, and is set down to the right, upright. A moment. And then it
// leans: over to the left, too far, and back, and holds, as the chair in the picture above it does. The line dries
// dark; the colour comes into it, not quite to the lines. Two chairs: the one that stands, and the one that was
// traced from it and leans. While you keep looking, now and then a line runs round one of them again and is gone,
// looking for its edge, as his contours do.
//
// When you stop, the colour goes out of them, the second first, and the two drawings are gathered up one after the
// other and go back in under the frame.
//
// No tune: a sitting is quiet. A brush on canvas while the line runs, the feet set down on the floor, and one soft
// note as each chair is finished (D, and the A above it, in the key the room's other two shows ring in). Three draw
// calls: the chairs (one mesh; his touches and the damask are painted once into a texture and laid on in the shader,
// patch by patch), the lines (one mesh of thin tubes, each drawing an instance of it), and the shadows. Nothing is
// solid; the toy drives through. Everything stands under 0.75 m (the drawing is carried a hand higher), well below
// every frame on this wall, and to the right of the floor the Bay of Marseille uses. With "Reduce motion and flashing" on, the carried drawing hardly swings and
// the lean comes on slowly, with no overshoot; nothing here flashes.
//
// What it does not do: Hortense Fiquet does not come out, in any form (no figure, no face, no hands, and no red dress
// without her in it), and nothing is made of her expression or of how long she sat, because she is a real woman with
// no say in it; nor does it make a third and a fourth chair, because the museum says only that this picture, the
// second, was traced from the first.
import * as THREE from 'three';
import { lifeFor, ease, ramp, clamp01, lerp, rng, shape } from '../paintlife.js';
import { score } from './stagecraft.js';

const TAU = Math.PI * 2;
const SC = 1.12;                                     // the size of it all (what follows is in its own metres)
const TILE = 0.5;                                    // the damask repeats every so many metres
// Where each chair stands (u along the wall, z out from it), how it is turned, how it leans (its top goes this far
// sideways for each metre of height: his chair's sides lean about eleven degrees), and its own shift of the damask.
// Both keep to the right of where the Bay of Marseille, next along the wall, deals its cards on the floor.
const SEATS = [
  { u: -0.32, z: 0.71, yaw: 0.3, lean: 0, wide: 1, tall: 1, seed: 0.11 },                 // the first: it stands
  { u: 0.375, z: 1.0, yaw: -0.12, lean: -0.2, wide: 1, tall: 1, seed: 0.47 },             // the second, traced from it: this picture's
];
const NC = SEATS.length;
const T_IN = 0.12, T_OUT = 0.4, T_DOWN = 1.05, FILL_A = [1.0, 2.15];      // the first: out of the wall, set down, coloured
const TRACE = [0, 2.1];                              // when the tracing begins
const RUN = 1.1, PEEL = [0.06, 0.38], PEEL_UP = 0.055, PEEL_OUT = 0.08, WAIT = 0.04, CARRY = [0, 0.8], LEAN = 1.0, FILL = 1.15;
const DOWN = i => TRACE[i] + RUN + PEEL[0] + PEEL[1] + WAIT + CARRY[i];
const DONE = i => (i ? DOWN(i) + LEAN + FILL : FILL_A[1]);
const T_IDLE = DONE(NC - 1) + 2.6, IDLE_EVERY = 6, IDLE_RUN = 1.7;       // afterwards: a line looks for an edge again
const NOTES = [293.66, 440];                         // D, and the A above it
const CH = 0.3, TOP = 0.64;                          // the middle of a chair above the floor, and its top
const _h = (a, b = 0) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };

// ------------------------------------------------------------------ the damask, painted once --
// A square of the chair's stuff that repeats: his slanting touches of ochre, straw and gold, laid patch by patch, and
// over them the damask's sprigs (a dark blue-green scroll, an olive sprig of leaves, mauve-grey flourishes), loosely,
// thin enough for the ground to show. The alpha holds each patch's own number, so the shader can lay them one by one.
function damask(pal) {
  const W = 512, rand = rng(62371 * 3 + 1);
  const cv = document.createElement('canvas'); cv.width = cv.height = W; const g = cv.getContext('2d', { willReadFrequently: true });
  const sty = (h, a = 0.12, k = 1) => '#' + pal.near(h, a).multiplyScalar(k).getHexString();
  const golds = ['#a88748', '#b5944f', '#9c7c42', '#c4a257', '#b08e4c', '#a48446', '#967642', '#bc9a52', '#cdae62', '#967a42', '#aa8a48', '#c09e54', '#a08a4c', '#d2b76e', '#b39a5c', '#b7994f'];
  const seeds = Array.from({ length: 30 }, () => { const c = golds[Math.floor(rand() * golds.length)]; return { x: rand() * W, y: rand() * W, c: [sty(c), sty(c, 0.12, 1.1), sty(c, 0.12, 0.9)], id: 0.3 + 0.7 * rand() }; });
  const near = (x, y) => { let b = seeds[0], bd = 1e9; for (const s of seeds) { let dx = Math.abs(x - s.x), dy = Math.abs(y - s.y); if (dx > W / 2) dx = W - dx; if (dy > W / 2) dy = W - dy; const d = dx * dx + dy * dy; if (d < bd) { bd = d; b = s; } } return b; };
  const warp = (x, y) => near(((x + 16 * Math.sin(y * 0.047) + W) % W), ((y + 16 * Math.sin(x * 0.041 + 2) + W) % W));
  g.fillStyle = sty('#a88748'); g.fillRect(0, 0, W, W);
  g.lineCap = 'round';
  // (everything is drawn again across each edge it crosses, so the square repeats without a seam)
  const wrapped = (x, y, reach, draw) => { for (const ox of [-W, 0, W]) for (const oy of [-W, 0, W]) { if (x + ox < -reach || x + ox > W + reach || y + oy < -reach || y + oy > W + reach) continue; g.save(); g.translate(ox, oy); draw(); g.restore(); } };
  for (let i = 0; i < 1150; i++) {
    const x = rand() * W, y = rand() * W, s = warp(x, y), a = -0.95 + (rand() - 0.5) * 0.5, l = 20 + rand() * 26, w = 7 + rand() * 6;
    const dx = Math.cos(a) * l / 2, dy = Math.sin(a) * l / 2, c = s.c[Math.floor(rand() * 3)], bend = (rand() - 0.5) * 5;
    wrapped(x, y, l, () => {
      g.globalAlpha = 0.9; g.strokeStyle = c; g.lineWidth = w;
      g.beginPath(); g.moveTo(x - dx, y - dy); g.quadraticCurveTo(x - dy * 0.1 * bend, y + dx * 0.1 * bend, x + dx, y + dy); g.stroke();
      g.globalAlpha = 0.16; g.strokeStyle = '#e8d29a'; g.lineWidth = w * 0.28;
      g.beginPath(); g.moveTo(x - dx - dy * 0.22, y - dy + dx * 0.22); g.lineTo(x + dx - dy * 0.22, y + dy + dx * 0.22); g.stroke();
    });
  }
  // The sprigs. A loaded brush drawn along a few points, twice, the second pass a little off the first.
  const brush = (pts, w, style, alpha = 0.8) => {
    for (let pass = 0; pass < 2; pass++) {
      g.globalAlpha = alpha * (pass ? 0.6 : 1); g.strokeStyle = style; g.lineWidth = w * (pass ? 0.6 : 1);
      const q = pts.map(([x, y]) => [x + (pass ? (rand() - 0.5) * 3 : 0), y + (pass ? (rand() - 0.5) * 3 : 0)]);
      g.beginPath(); g.moveTo(q[0][0], q[0][1]);
      for (let i = 1; i < q.length - 1; i++) g.quadraticCurveTo(q[i][0], q[i][1], (q[i][0] + q[i + 1][0]) / 2, (q[i][1] + q[i + 1][1]) / 2);
      g.lineTo(q[q.length - 1][0], q[q.length - 1][1]); g.stroke();
    }
  };
  const motif = (cx, cy, rot, sc, draw) => wrapped(cx, cy, 90 * sc, () => { g.save(); g.translate(cx, cy); g.rotate(rot); g.scale(sc, sc); draw(); g.restore(); });
  const teal = [sty('#34504c', 0.2), sty('#2c4048', 0.2), sty('#4a6456', 0.2)], olive = [sty('#4b4936', 0.2), sty('#5c5a3c', 0.2), sty('#454a3a', 0.2)], mauve = [sty('#6a5a58', 0.2), sty('#7a6a68', 0.2), sty('#5a4a4c', 0.2)], grey = sty('#5a6a66', 0.2);
  const scroll = () => {
    const P = t => { const r = 46 - 6.5 * t; return [Math.cos(t) * r, Math.sin(t) * r]; };
    brush([P(-0.6), P(0), P(0.6), P(1.2), P(1.8)], 11, teal[0]); brush([P(1.6), P(2.3), P(3.0), P(3.7)], 8.5, teal[1]); brush([P(3.5), P(4.2), P(4.9)], 6, teal[0]);
    for (const [t, k] of [[0.1, 0], [1.1, 2], [2.1, 1]]) { const p = P(t), d = [Math.cos(t + 0.9), Math.sin(t + 0.9)]; brush([p, [p[0] + d[0] * 15, p[1] + d[1] * 15], [p[0] + d[0] * 27 - d[1] * 5, p[1] + d[1] * 27 + d[0] * 5]], 9, teal[k], 0.75); }
    brush([P(0.2), P(0.7), P(1.2)], 3.5, teal[2], 0.5);
  };
  const sprig = () => {
    const S = t => [8 * Math.sin(t * 5), 62 - 124 * t];
    brush([S(0), S(0.25), S(0.5), S(0.75), S(1)], 4.5, olive[0], 0.85);
    for (let i = 0; i < 7; i++) {
      const t = 0.12 + i * 0.125, p = S(t), side = i % 2 ? 1 : -1, a = -Math.PI / 2 + side * 0.85, d = [Math.cos(a), Math.sin(a)];
      brush([p, [p[0] + d[0] * 13, p[1] + d[1] * 13 + 2], [p[0] + d[0] * 25, p[1] + d[1] * 25]], 8.5 - i * 0.5, olive[i % 3], 0.8);
    }
  };
  const flourish = () => {
    for (const s of [-1, 1]) brush([[s * 3, 14], [s * 22, 6], [s * 26, -16], [s * 10, -30], [s * 2, -12]], 8, mauve[s < 0 ? 0 : 1], 0.75);
    brush([[-4, -2], [0, 4], [4, -2]], 6, mauve[2], 0.7);
  };
  const curl = () => brush([[-18, -14], [0, -25], [13, -9], [-3, 6], [-14, 22], [6, 29]], 6, grey, 0.75);
  motif(118, 116, 0.5, 1.25, scroll); motif(374, 150, 0.35, 1.2, sprig); motif(134, 372, -0.3, 1.3, flourish); motif(402, 404, 0.8, 1.2, curl); motif(262, 290, 2.3, 0.9, sprig);
  motif(306, 478, 3.6, 0.95, scroll); motif(486, 268, 1.2, 1, flourish);
  g.globalAlpha = 1;
  const c = g.getImageData(0, 0, W, W).data, out = new Uint8Array(W * W * 4);
  for (let y = 0, i = 0; y < W; y++) for (let x = 0; x < W; x++, i += 4) { out[i] = c[i]; out[i + 1] = c[i + 1]; out[i + 2] = c[i + 2]; out[i + 3] = Math.round(255 * warp(x, y).id); }
  const t = new THREE.DataTexture(out, W, W, THREE.RGBAFormat);
  t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.flipY = false;
  t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter; t.anisotropy = 4;
  t.needsUpdate = true;
  return t;
}

// ------------------------------------------------------------------ the chair's paint --
// The damask laid on from three sides (so it needs no seams), modelled as he modelled: warm where the form turns to
// the light, cool grey-green where it turns away, patch by patch and not smoothly; and laid in from the floor up as
// its instance's fill says. Each instance carries (fill, its own shift of the pattern).
function chairPaint(u) {
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.88, metalness: 0, emissive: 0xffffff, emissiveIntensity: 0.4 });
  m.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, u);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec3 aChair; varying vec3 vOP; varying vec3 vON; varying vec3 vWN; varying vec3 vCh;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
  vOP = position; vON = normal; vCh = aChair;
  vWN = normalize(mat3(modelMatrix) * (mat3(instanceMatrix) * normal));`);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
uniform sampler2D uTex; uniform vec3 uLight; uniform vec3 uWood;
varying vec3 vOP; varying vec3 vON; varying vec3 vWN; varying vec3 vCh;`)
      .replace('#include <color_fragment>', `{
  vec3 an = pow(abs(normalize(vON)), vec3(5.0)); an /= (an.x + an.y + an.z);
  vec3 q = vOP / ${TILE.toFixed(3)} + vec3(vCh.y * 3.7, vCh.y * 1.9, vCh.y * 5.3);
  vec4 tx = texture2D(uTex, q.zy), ty = texture2D(uTex, q.xz), tz = texture2D(uTex, q.xy);
  vec4 t = tx * an.x + ty * an.y + tz * an.z;
  float id = an.x > an.y ? (an.x > an.z ? tx.a : tz.a) : (an.y > an.z ? ty.a : tz.a);
  float order = clamp(vOP.y / ${TOP.toFixed(2)}, 0.0, 1.0) * 0.62 + id * 0.38;
  if (order > vCh.x * 1.03 - 0.015) discard;
  float lit = smoothstep(-0.35, 0.65, dot(normalize(vWN), uLight) + (id - 0.62) * 0.22);
  vec3 c = t.rgb * mix(vec3(0.7, 0.71, 0.64), vec3(1.14, 1.11, 1.0), lit);
  c = mix(c, vec3(0.2, 0.27, 0.27), (1.0 - lit) * smoothstep(0.55, 0.8, id) * 0.3);      // (a cool grey-green in some of the shadow, as he has it)
  float wood = 1.0 - vColor.r;
  c = mix(c, uWood * (0.6 + 1.3 * dot(t.rgb, vec3(0.333))) * mix(0.7, 1.2, lit), wood);
  diffuseColor.rgb = c;
}`)
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n  totalEmissiveRadiance *= diffuseColor.rgb;');
  };
  m.customProgramCacheKey = () => 'yellow-chair';
  return m;
}
// His line: flat dark blue, each instance showing only the part of its drawing between its tail and its head.
function linePaint(u) {
  const m = new THREE.MeshBasicMaterial({ vertexColors: true, fog: false });
  m.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, u);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float aS; attribute vec3 aRun; varying float vS; varying vec3 vRun;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n  vS = aS; vRun = aRun;');
    // (aRun: tail, head, and how wet the line still is: a fresh line is a lighter blue, lightest at the brush's tip)
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec3 uFresh; varying float vS; varying vec3 vRun;')
      .replace('#include <color_fragment>', `#include <color_fragment>
  if (vS > vRun.y || vS < vRun.x) discard;
  diffuseColor.rgb = mix(diffuseColor.rgb, uFresh, vRun.z * (0.6 + 0.4 * smoothstep(vRun.y - 0.06, vRun.y, vS) * step(vRun.y, 0.999)));`);
  };
  m.customProgramCacheKey = () => 'yellow-chair-line';
  return m;
}

// ------------------------------------------------------------------ the chair --
// A box with every edge rounded (r), finely enough to shade smoothly; warp(v) bends it afterwards.
function rbox(x0, x1, y0, y1, z0, z1, r, warp = null, n = 3, mid = 3) {
  const N = 2 * n + mid, g = new THREE.BoxGeometry(1, 1, 1, N, N, N).toNonIndexed(), p = g.attributes.position;
  const h = [(x1 - x0) / 2, (y1 - y0) / 2, (z1 - z0) / 2], c = [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2], v = [0, 0, 0], inn = [0, 0, 0], V = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    const q = [p.getX(i), p.getY(i), p.getZ(i)]; let d2 = 0;
    for (let a = 0; a < 3; a++) {
      const k = Math.round((q[a] + 0.5) * N), rr = Math.min(r, h[a]);
      v[a] = k <= n ? -h[a] + rr * k / n : k >= N - n ? h[a] - rr * (N - k) / n : -h[a] + rr + (2 * h[a] - 2 * rr) * (k - n) / mid;
      inn[a] = Math.max(-h[a] + rr, Math.min(h[a] - rr, v[a])); d2 += (v[a] - inn[a]) ** 2;
    }
    const s = d2 > 0 ? r / Math.sqrt(d2) : 1;
    V.set(inn[0] + (v[0] - inn[0]) * s + c[0], inn[1] + (v[1] - inn[1]) * s + c[1], inn[2] + (v[2] - inn[2]) * s + c[2]);
    if (warp) warp(V);
    p.setXYZ(i, V.x, V.y, V.z);
  }
  g.deleteAttribute('uv');
  const col = new Float32Array(p.count * 3).fill(1); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return smooth(g);
}
// Normals shared wherever corners meet, so the form turns without a crease.
function smooth(g) {
  const p = g.attributes.position, n = p.count, acc = new Map(), keys = new Array(n);
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), fn = new THREE.Vector3();
  for (let i = 0; i < n; i++) keys[i] = `${Math.round(p.getX(i) * 2e4)},${Math.round(p.getY(i) * 2e4)},${Math.round(p.getZ(i) * 2e4)}`;
  for (let f = 0; f < n; f += 3) {
    a.fromBufferAttribute(p, f); b.fromBufferAttribute(p, f + 1); c.fromBufferAttribute(p, f + 2); fn.crossVectors(b.sub(a), c.sub(a));
    for (let j = 0; j < 3; j++) { let s = acc.get(keys[f + j]); if (!s) acc.set(keys[f + j], s = new THREE.Vector3()); s.add(fn); }
  }
  const nor = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { const s = acc.get(keys[i]); fn.copy(s).normalize(); nor[i * 3] = fn.x; nor[i * 3 + 1] = fn.y; nor[i * 3 + 2] = fn.z; }
  g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  return g;
}
// The armchair, about half a metre high, facing +z: a tall upholstered back that flares a little and leans back, low
// padded arms, a fat cushion on a deep seat, four short dark legs. Its measures, shared with the line that goes round it:
const BK = { x: 0.18, y0: 0.15, y1: 0.62, z0: -0.2, z1: -0.125, r: 0.035, flare: 0.15, rake: 0.15, arch: 0.012 };
const hwB = y => BK.x * (1 + BK.flare * clamp01((y - BK.y0) / (BK.y1 - BK.y0)));
const zF = y => BK.z1 - (y - BK.y0) * BK.rake, zR = y => BK.z0 - (y - BK.y0) * BK.rake;
const topB = x => BK.y1 + BK.arch * Math.cos(Math.PI * x / 0.46);
const LEGS = [[-0.16, 0.14], [0.16, 0.14], [-0.16, -0.14], [0.16, -0.14]];
function chairGeometry() {
  const parts = [];
  parts.push(rbox(-BK.x, BK.x, BK.y0, BK.y1, BK.z0, BK.z1, BK.r, v => {
    const f = clamp01((v.y - BK.y0) / (BK.y1 - BK.y0));
    v.x *= 1 + BK.flare * f; v.y += BK.arch * Math.cos(Math.PI * v.x / 0.46) * ease.smooth(ramp(f, 0.7, 1)); v.z -= (v.y - BK.y0) * BK.rake;
  }, 3, 5));
  parts.push(rbox(-0.2, 0.2, 0.08, 0.185, -0.17, 0.18, 0.03));                                                                   // the seat's deep frame
  parts.push(rbox(-0.146, 0.146, 0.17, 0.255, -0.11, 0.186, 0.036, v => { if (v.y > 0.21) v.y += 0.014 * (1 - (v.x / 0.146) ** 2) * (1 - ((v.z - 0.04) / 0.15) ** 2); }));      // the cushion
  for (const s of [-1, 1]) parts.push(rbox(s < 0 ? -0.216 : 0.14, s < 0 ? -0.14 : 0.216, 0.16, 0.3, -0.15, 0.172, 0.034, v => { v.y -= 0.012 * ease.smooth(ramp(v.z, 0.02, 0.17)); }));      // the arms
  for (const [x, z] of LEGS) {
    const g = shape.move(shape.lathe([[0.012, 0], [0.015, 0.035], [0.022, 0.085]], 8, 0x000000), x, 0, z, z < 0 ? 0.1 : -0.04, 0, x < 0 ? -0.04 : 0.04);
    parts.push(g);
  }
  return shape.merge(parts);
}
// The drawing: the lines that go round that chair, in the order the hand takes them (from the feet up to the top of the
// back, then the inner lines, then the far side), as thin tubes whose weight comes and goes like a brush's; some gone
// over twice. Each vertex knows how far along the whole drawing it is (0 to 1).
function drawing(rand, pal) {
  const e = 0.0103, S = [];
  const add = (pts, w = 1, r = 1, twice = false) => { S.push({ pts, w, r }); if (twice) S.push({ pts: pts.map(p => [p[0] + (rand() - 0.5) * 0.011, p[1] + (rand() - 0.5) * 0.011, p[2] + (rand() - 0.5) * 0.008]), w: w * 0.45, r: r * 0.62, light: true }); };
  const YS = [0.31, 0.39, 0.47, 0.54, BK.y1 - 0.045], YC = BK.y1 - 0.012;
  const side = (s, ys) => ys.map(y => [s * (hwB(y) - e), y, zF(y) - e]);
  const top = xs => xs.map(x => [x, topB(x) - e * 0.6, zF(BK.y1) - e]);
  const corner = s => [s * (hwB(YC) - 0.021), YC - 0.005 + BK.arch * 0.2, zF(YC) - e];
  const leg = (i, dx, dz) => { const [x, z] = LEGS[i]; return [[x + dx * 0.021, 0.088, z + dz * 0.021], [x + dx * 0.017, 0.045, z + dz * 0.017], [x + dx * 0.013, 0.004, z + dz * 0.013]].reverse(); };
  const arm = (s, x) => [[s * x, 0.3, -0.13], [s * x, 0.301, 0.0], [s * x, 0.292, 0.1], [s * x, 0.272, 0.158], [s * x, 0.235, 0.173], [s * x, 0.19, 0.173]];
  // the front: left foot, the seat's lower edge, right foot
  add(leg(0, -1, 0)); add(leg(0, 0, 1), 0.7, 0.8);
  add([[-0.19, 0.084, 0.181], [-0.07, 0.08, 0.184], [0.07, 0.08, 0.184], [0.19, 0.084, 0.181]], 1, 1.1, true);
  add(leg(1, 0, 1), 0.7, 0.8); add(leg(1, 1, 0));
  // up the right arm from the seat and back along it; up the right side of the back, across the top, down the left;
  // forward along the left arm and down to the seat
  add(arm(1, 0.206).reverse().concat([[0.208, 0.3, -0.16]]), 1, 1.1, true);
  add(side(1, YS).concat([corner(1)], top([0.15, 0.06, -0.04])), 1, 1.25, true);
  add(top([0.03, -0.07, -0.15]).concat([corner(-1)], side(-1, YS.slice().reverse())), 1, 1.25, true);
  add([[-0.208, 0.3, -0.16]].concat(arm(-1, 0.206)), 1, 1.1, true);
  // the inner lines: the arms' inner edges, the cushion
  add(arm(-1, 0.152), 0.8, 0.9); add(arm(1, 0.152), 0.8, 0.9);
  add([[-0.136, 0.25, 0.18], [-0.07, 0.262, 0.187], [0.07, 0.262, 0.187], [0.136, 0.25, 0.18]], 1, 1, true);
  add([[-0.14, 0.186, 0.187], [0, 0.183, 0.19], [0.14, 0.186, 0.187]], 0.8, 0.8);
  add([[-0.13, 0.268, -0.1], [0, 0.272, -0.105], [0.13, 0.268, -0.1]], 0.8, 0.8);
  // the sides and the far side, quickly
  for (const s of [-1, 1]) add([[s * 0.203, 0.084, 0.165], [s * 0.205, 0.08, 0], [s * 0.203, 0.084, -0.16]], 0.5, 0.9);
  add(leg(2, -1, 0), 0.5, 0.9); add(leg(3, 1, 0), 0.5, 0.9);
  for (const s of [-1, 1]) add([[s * 0.2, 0.1, -0.172]].concat([0.2, 0.3, 0.4, 0.5, BK.y1 - 0.045].map(y => [s * (hwB(y) - e), y, zR(y) + e]), [[s * (hwB(YC) - 0.021), YC - 0.005, zR(YC) + e]]), 0.5, 1);
  add([-0.15, -0.05, 0.05, 0.15].map(x => [x, topB(x) - e * 0.6, zR(BK.y1) + e]), 0.5, 1);
  add([[-0.19, 0.084, -0.172], [0, 0.08, -0.174], [0.19, 0.084, -0.172]], 0.4, 0.9);

  const blues = ['#22243a', '#1b1f33', '#2a3350', '#232a3c'].map(h => pal.near(h, 0.15)), pale = pal.near('#34406a', 0.15);
  const R0 = 0.0056, SIDES = 4, pos = [], col = [], as = [], idx = [];
  const V = new THREE.Vector3(), T = new THREE.Vector3(), N = new THREE.Vector3(), B = new THREE.Vector3(), up = new THREE.Vector3();
  // (a hair outside the form all round, as a contour stands off what it goes round; and no point quite where it was meant)
  const OUT = 1.03, jit = () => (rand() - 0.5) * 0.004;
  let total = 0; const curves = S.map(s => { const c = new THREE.CatmullRomCurve3(s.pts.map(p => new THREE.Vector3(p[0] * OUT + jit(), CH + (p[1] - CH) * OUT + jit(), p[2] * OUT + jit())), false, 'centripetal'); const len = c.getLength(); total += len * s.w; return { c, len }; });
  let at = 0;
  S.forEach((s, k) => {
    const { c, len } = curves[k], n = Math.max(4, Math.ceil(len / 0.013)), a0 = at / total, a1 = (at + len * s.w) / total, base = pos.length / 3;
    const tone = s.light ? pale : blues[Math.floor(rand() * blues.length)], ph = rand() * TAU, lift = 0.92 + rand() * 0.16;
    for (let j = 0; j <= n; j++) {
      const q = j / n; c.getPointAt(q, V); c.getTangentAt(q, T);
      up.set(0, 1, 0); if (Math.abs(T.y) > 0.9) up.set(1, 0, 0);
      N.crossVectors(T, up).normalize(); B.crossVectors(T, N);
      const r = R0 * s.r * (0.72 + 0.28 * Math.sin(q * 6.5 + ph)) * (0.3 + 0.7 * ease.smooth(q / 0.1)) * (0.35 + 0.65 * ease.smooth((1 - q) / 0.22));
      for (let i = 0; i < SIDES; i++) { const a = Math.PI / 4 + i * TAU / SIDES; pos.push(V.x + (N.x * Math.cos(a) + B.x * Math.sin(a)) * r, V.y + (N.y * Math.cos(a) + B.y * Math.sin(a)) * r, V.z + (N.z * Math.cos(a) + B.z * Math.sin(a)) * r); col.push(tone.r * lift, tone.g * lift, tone.b * lift); as.push(a0 + (a1 - a0) * q); }
      if (j < n) for (let i = 0; i < SIDES; i++) { const A = base + j * SIDES + i, C = base + j * SIDES + (i + 1) % SIDES; idx.push(A, C, A + SIDES, C, C + SIDES, A + SIDES); }
    }
    at += len * s.w;
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setAttribute('aS', new THREE.Float32BufferAttribute(as, 1));
  g.setIndex(idx);
  return g;
}

lifeFor(62371, {
  title: /^Madame Cezanne in a Yellow Chair/,
  word: 'trace',
  // (a small work: the kit keeps the whole of it in view. The camera stands low, at the height of a chair's arm, and
  // nearly square to the wall, so the chair that leans is seen face on, right under the chair that leans in the picture)
  stage: { out: 1.9, half: 1.3, cam: { dist: 3.0, height: 0.3, side: 0.15, fov: 50, lookU: 0.08, lookOut: 0.5, lookH: 0.95, floorOut: 1.55 } },
  wake: 2, ret: 2.4,

  build(L) {
    const V3 = THREE.Vector3, M4 = THREE.Matrix4, rand = L.rand;
    this.T = { m: new M4(), a: new M4(), b: new M4(), v: new V3(), s: new V3(), zero: new M4().makeScale(0, 0, 0), o: {}, p: {}, q: {} };
    // The stage: x along the wall (to the viewer's right), y up, z out from the picture's plane, on the floor below it.
    const stage = this.stage = new THREE.Group(); stage.matrixAutoUpdate = false;
    stage.matrix.makeBasis(new V3(L.tx * SC, 0, L.tz * SC), new V3(0, SC, 0), new V3(L.nx * SC, 0, L.nz * SC)).setPosition(L.floor(0, 0));
    L.group.add(stage);
    // (where the drawings come out, and go back: in the wall, under the frame)
    this.mouth = { x: -0.06, y: (L.rail - L.y - 0.26) / SC, z: -(L.wall + 0.1) / SC, z1: 0.07, sc: 0.3, flat: 0.05 };

    // ---- the chairs: one mesh
    const cg = chairGeometry(), chair = new Float32Array(NC * 3);
    cg.setAttribute('aChair', new THREE.InstancedBufferAttribute(chair, 3).setUsage(THREE.DynamicDrawUsage));
    const lu = -0.5, ly = 0.78, lo = 0.42, ll = Math.hypot(lu, ly, lo);
    const u = { uTex: { value: damask(L.pal) }, uLight: { value: new V3((L.tx * lu + L.nx * lo) / ll, ly / ll, (L.tz * lu + L.nz * lo) / ll) }, uWood: { value: L.pal.near('#3a2a2c', 0.2) } };
    const body = this.body = new THREE.InstancedMesh(cg, chairPaint(u), NC);
    body.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    for (let i = 0; i < NC; i++) body.setMatrixAt(i, this.T.zero);
    L.add(body, stage);

    // ---- the lines: one drawing for each chair, and one more that goes round again afterwards
    const lg = drawing(rand, L.pal), run = new Float32Array((NC + 1) * 3);
    lg.setAttribute('aRun', new THREE.InstancedBufferAttribute(run, 3).setUsage(THREE.DynamicDrawUsage));
    const line = this.line = new THREE.InstancedMesh(lg, linePaint({ uFresh: { value: L.pal.near('#36559e', 0.1) } }), NC + 1);
    line.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    for (let i = 0; i <= NC; i++) line.setMatrixAt(i, this.T.zero);
    L.add(line, stage);
    // (a traced line never lies quite where the colour does: each tracing's own small slip)
    this.slip = SEATS.map((s, i) => (i ? { x: (i % 2 ? 0.007 : -0.006) + (rand() - 0.5) * 0.006, z: 0.004 + (rand() - 0.5) * 0.006, yaw: (i % 2 ? 0.03 : -0.025) + (rand() - 0.5) * 0.02 } : { x: 0, z: 0, yaw: 0 }));

    // ---- the shadows
    this.blobs = L.blobs(NC, { fade: true });
    this.spot = SEATS.map(s => L.floor(s.u * SC, s.z * SC));

    // ---- the sounds, on the show's own clock
    const s = this.sc = score(L);
    const tick = t => { s.hit(t, { d: 0.03, vol: 0.022, bp: 1300, q: 1.4 }); s.note(t, 118, 0.16, { type: 'sine', vol: 0.03, to: 84, attack: 0.004 }); };
    const dabs = (t0, t1, n, vol) => { for (let k = 0; k < n; k++) s.hit(t0 + (t1 - t0) * (k + 0.5 * _h(k, t0)) / n, { d: 0.07, vol: vol * (0.7 + 0.6 * _h(k, 3.3 + t0)), lp: 700 + 500 * _h(k, 7.1), attack: 0.012 }); };
    const done = (i, t) => s.note(t, NOTES[i], 1.5, { type: 'sine', vol: 0.03, attack: 0.03, over: 2, overVol: 0.14 });
    s.hit(T_IN, { d: 0.55, vol: 0.011, hp: 2400, attack: 0.18 }); tick(T_DOWN);
    dabs(FILL_A[0], FILL_A[1], 9, 0.011); done(0, FILL_A[1]);
    for (let i = 1; i < NC; i++) {
      const t0 = TRACE[i], td = DOWN(i);
      for (let k = 0; k < 15; k++) s.hit(t0 + RUN * (k + 0.4 * _h(k, i)) / 15, { d: 0.055, vol: 0.008 + 0.005 * _h(k, i + 9), bp: 2000 + 1100 * _h(k, i + 4), q: 1.1, attack: 0.008 });      // the brush, running
      s.hit(t0, { d: RUN, vol: 0.005, hp: 3200, attack: 0.25 });
      s.hit(td - CARRY[i], { d: CARRY[i], vol: 0.009, lp: 1700, attack: 0.3 });                                         // carried
      tick(td); s.note(td + 0.06, 172, 0.5, { type: 'triangle', vol: 0.011, to: 126, attack: 0.1 });                   // set down; it leans
      dabs(td + LEAN, td + LEAN + FILL, 9, 0.011); done(i, td + LEAN + FILL);
    }
    s.loop(T_IDLE, IDLE_EVERY, Array.from({ length: 12 }, (_, k) => ({ t: IDLE_RUN * 0.7 * k / 12, noise: true, d: 0.05, vol: 0.006, bp: 2300 + 700 * _h(k, 2), q: 1.1 })));
    s.done();
    this.hold = 0; this.hide();
  },

  hide() { this.body.visible = false; this.line.visible = false; this.blobs.count = 0; this.blobs.visible = false; },

  // A chair standing in its place.
  seat(i, o) { const S = SEATS[i]; o.x = S.u; o.y = 0; o.z = S.z; o.yaw = S.yaw; o.lean = S.lean; o.sx = S.wide; o.sy = S.tall; o.sz = S.wide; o.swing = 0; return o; },
  // Carried from a to b (s: 0 to 1), rising `arc` on the way and swinging from its top.
  fly(a, b, s, o, arc, swing) {
    const e = ease.inOut(s);
    o.x = lerp(a.x, b.x, e); o.y = lerp(a.y, b.y, e) + arc * Math.sin(Math.PI * s); o.z = lerp(a.z, b.z, e); o.yaw = lerp(a.yaw, b.yaw, e); o.lean = lerp(a.lean, b.lean, e);
    o.sx = lerp(a.sx, b.sx, e); o.sy = lerp(a.sy, b.sy, e); o.sz = lerp(a.sz, b.sz, e);
    o.swing = swing * Math.sin(Math.PI * s) * Math.sin(s * 8.5);
    return o;
  },
  inWall(o, k) { const M = this.mouth; o.x = M.x; o.y = M.y; o.z = lerp(M.z, M.z1, k); o.yaw = 0; o.lean = 0; o.sx = o.sy = M.sc; o.sz = M.flat; o.swing = 0; return o; },

  // Drawing i at show-time c: where its line is, how much of the line is drawn (tail, head), how far its colour is laid
  // (fill), and whether it is out at all.
  pose(i, c, calm, o) {
    const T = this.T, S = SEATS[i];
    o.on = false; o.tail = 0; o.head = 1; o.fill = 0; o.wet = 0;
    if (i === 0) {
      if (c < T_IN) return o;
      o.on = true;
      if (c < T_OUT) return this.inWall(o, ease.out(ramp(c, T_IN, T_OUT)));
      if (c < T_DOWN) return this.fly(this.inWall(T.p, 1), this.seat(0, T.q), ramp(c, T_OUT, T_DOWN), o, 0, calm ? 0.04 : 0.1);
      this.seat(0, o);
      const tau = c - T_DOWN; if (!calm && tau < 1) o.lean = 0.035 * Math.exp(-tau * 6) * Math.sin(tau * 15);       // (set down: it rocks once and stands)
      o.fill = ramp(c, FILL_A[0], FILL_A[1]);
      return o;
    }
    const t0 = TRACE[i]; if (c < t0) return o;
    o.on = true;
    const t1 = t0 + RUN + PEEL[0], t2 = t1 + PEEL[1] + WAIT, td = DOWN(i);
    if (c < t2) {
      // the tracing: a line running round the chair before; then it comes away from it, up and towards you
      this.seat(i - 1, o); o.head = ramp(c, t0, t0 + RUN); o.wet = 1;
      const k = ease.inOut(ramp(c, t1, t1 + PEEL[1])); o.y += PEEL_UP * k; o.z += PEEL_OUT * k; o.yaw += (calm ? 0 : 0.02) * Math.sin((c - t1) * 30) * (c > t1 ? Math.exp(-(c - t1) * 9) : 0);
      return o;
    }
    if (c < td) {
      this.seat(i - 1, T.p); T.p.y += PEEL_UP; T.p.z += PEEL_OUT;
      this.seat(i, T.q); T.q.lean = 0;
      this.fly(T.p, T.q, ramp(c, t2, td), o, 0.03, calm ? 0.035 : 0.09); o.wet = 1;
      return o;
    }
    // set down, upright; a moment; and then it leans: over, too far, and back, and holds (and the line dries)
    this.seat(i, o);
    const tau = Math.max(0, c - td - 0.12);
    o.lean = S.lean * (calm ? ease.smooth(tau / 1.3) : 1 - Math.exp(-tau * 2.4) * Math.cos(tau * 5.0));
    o.wet = 1 - ease.smooth((c - td) / 2.2);
    o.fill = ramp(c, td + LEAN, td + LEAN + FILL);
    return o;
  },

  // The matrix for a pose (in the stage's own space): placed, leaning (a shear along the wall), swung from its top,
  // turned, and sized.
  place(o, m, slip) {
    const T = this.T;
    m.makeRotationY(o.yaw + (slip ? slip.yaw : 0)); m.scale(T.v.set(o.sx, o.sy, o.sz));
    if (o.swing) { T.a.makeTranslation(0, TOP, 0); T.b.makeRotationZ(o.swing); T.a.multiply(T.b); T.b.makeTranslation(0, -TOP, 0); T.a.multiply(T.b); m.premultiply(T.a); }
    T.a.identity(); T.a.elements[4] = o.lean; m.premultiply(T.a);
    T.a.makeTranslation(o.x + (slip ? slip.x : 0), o.y, o.z + (slip ? slip.z : 0)); m.premultiply(T.a);
    return m;
  },

  start(L) {
    this.sc.from(0); this.hold = 0;
    if (!this.told && !L.quiet) { this.told = true; L.k.say('The museum thinks this portrait was traced from an earlier one. The dark blue outlines still show.', 5); }
  },
  back(L) { this.hold = L.t; if (!L.quiet) L.k.synth.noise(0.6, { vol: 0.012, lp: 2000 }); },
  end() { this.hide(); },
  reset() { this.hide(); this.hold = 0; },

  update(L, dt) {
    const ph = L.phase, showing = ph === 'wake' || ph === 'play';
    if (!showing && ph !== 'return') { this.hide(); return; }
    const T = this.T, calm = L.calm, o = T.o, body = this.body, line = this.line, B = this.blobs;
    const c = showing ? L.t : this.hold, R = showing ? 0 : L.ret;
    if (showing) this.sc.play(L.t);
    body.visible = line.visible = B.visible = true;
    const chair = body.geometry.attributes.aChair, run = line.geometry.attributes.aRun;
    let last = 0; for (let i = 0; i < NC; i++) if (c >= TRACE[i]) last = i;
    for (let i = 0; i < NC; i++) {
      this.pose(i, c, calm, o);
      let shade = o.on ? (0.14 + 0.52 * o.fill) * clamp01(1 - o.y / 0.4) * clamp01((o.sz - 0.3) / 0.5) : 0;
      if (o.on && R > 0) {
        // going back: the colour goes out of it, and then the drawing is gathered up and goes in under the frame
        const rank = last - i;
        o.fill *= 1 - ease.smooth(ramp(R, 0.04 * rank, 0.32 + 0.04 * rank));
        const k = ramp(R, 0.28 + 0.07 * rank, 0.8 + 0.06 * rank);
        if (k > 0) {
          Object.assign(T.p, o);
          if (k < 0.8) this.fly(T.p, this.inWall(T.q, 1), k / 0.8, o, 0.06, calm ? 0.03 : 0.07); else this.inWall(o, 1 - (k - 0.8) / 0.2);
          shade *= 1 - ramp(k, 0, 0.2);
          if (k >= 1) o.on = false;
        }
      }
      if (!o.on) { body.setMatrixAt(i, T.zero); line.setMatrixAt(i, T.zero); B.set(i, this.spot[i].x, this.spot[i].z, 0.01, 0); continue; }
      line.setMatrixAt(i, this.place(o, T.m, this.slip[i])); run.setXYZ(i, o.tail, o.head, o.wet);
      if (o.fill > 0.001) { body.setMatrixAt(i, this.place(o, T.m, null)); chair.setXYZ(i, o.fill, SEATS[i].seed, 0); } else body.setMatrixAt(i, T.zero);
      L.floor(o.x * SC, o.z * SC, T.v); B.set(i, T.v.x, T.v.z, 0.27 * SC * o.sx, shade);
    }
    // afterwards, now and then: a line goes round one of them again, and is gone
    const ti = c - T_IDLE; let idle = false;
    if (showing && ti > 0) {
      const n = Math.floor(ti / IDLE_EVERY), k = (ti - n * IDLE_EVERY) / (calm ? IDLE_RUN * 1.5 : IDLE_RUN);
      if (k < 1) {
        const i = (n + 1) % NC; this.seat(i, o); o.sx *= 1.012; o.sy *= 1.012; o.sz *= 1.012;
        T.p.x = 0.004; T.p.z = 0.003; T.p.yaw = 0.02 * (n % 2 ? 1 : -1);
        line.setMatrixAt(NC, this.place(o, T.m, T.p)); run.setXYZ(NC, Math.max(0, k * 1.3 - 0.3), Math.min(1, k * 1.3), 1); idle = true;
      }
    }
    // (only the instances in use are drawn: the second chair's once it is being traced, the third line only as it runs)
    line.count = idle ? NC + 1 : last + 1; body.count = last + 1;
    B.count = NC;
    body.instanceMatrix.needsUpdate = line.instanceMatrix.needsUpdate = true; chair.needsUpdate = run.needsUpdate = true;
    if (!showing && L.ret >= 1) this.hide();
    L.voice().place();
  },
});
