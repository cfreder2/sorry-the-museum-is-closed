// Édouard Manet, The Races at Longchamp (1866), Gallery 225. The word: thunder.
//
// A horse race seen head-on, from the middle of the track: five horses coming straight at you in a haze of dust, the
// jockeys crouched over them as flecks of colour (white, yellow, a blue cap, a green one), a pale paling and a dark
// smear of crowd on the left with parasols in it, and beside the rail the winning post, a pole with a ring on top.
// All of it slashed in: a horse is a couple of dozen strokes. Look at it and his dark turf runs out across the floor
// from under the picture, a course with a loop in it; the paling springs up along its left side stake by stake, the
// racegoers hurry out along the rail to their places, the post goes up. A drumming starts inside the wall, far off, and
// comes on: the stakes rattle, dust blows out along the foot of the wall, every head turns to it. Then the field bursts
// out of the wall and comes straight down the course at you, as it does in the picture, hooves on a drum, and Rossini's
// galop from William Tell (Paris, 1829: da-da-DUM, da-da-DUM, the hoofbeats are its rhythm) goes with them. They lean
// round the loop, the crowd turning to follow them, pass under the picture and come down the straight a second time;
// the yellow jacket gets up and takes it by a neck on the top note of the tune, at the post. The bell rings, hats and
// parasols go up, the jockeys stand in their stirrups, and the field canters on round while you keep looking.
//
// Every horse, rider and racegoer is built of his marks: broad loaded touches that always face you (dabs for the
// quarters, the barrel and the shoulder, a tapering stroke for the neck and each leg, each one bowed a little as a wrist
// bows it), in the picture's own dark colours; the dust is thin dry scumbles that drift and go. Nothing climbs the
// wall. And the toy can race them: stop looking and they stay while the toy is near, cantering; drive round the course
// and the field gallops with you, and the crowd cheers whoever passes the post. Drive off and they wheel for home, back
// into the wall under the picture.
//
// What it does not do: no horse falls, is struck or is frightened (there is no whip: the winner's raised arm is a
// wave), nobody bets, the field parts round the toy and never runs it down, the crowd is not played for laughs, and
// with "Reduce motion and flashing" on nothing rattles or bobs quickly and the drum and bell are softer, because the
// picture is about the speed and the paint of a race, not its dangers, and nobody should be startled by it.
import * as THREE from 'three';
import { lifeFor, ease, ramp, clamp01, lerp, canvasTexture } from '../paintlife.js';
import { score, Bones, turnTo, hz } from './stagecraft.js';
import { strokes as floorStrokes } from './brush.js';

const TAU = Math.PI * 2;
const SC = 1.25;                                   // the horses: 0.36 m at the withers, 0.51 to the jockey's cap
// The course, in the stage's terms (along the wall, out from it): a straight out from under the picture (U0 along), and
// a loop to the right of it: two straights (at U0 and U0 + 2R, from A to B out) and two bends of radius R. HW: half its
// width. (The picture hangs between a corner and a doorway, 1.2 m either side: the course and its crowd keep between.)
const U0 = -0.3, R = 0.62, A = 0.85, B = 1.5, HW = 0.28;
const ST = B - A, ARC = Math.PI * R, LAP = 2 * ST + 2 * ARC;
const FENCE = U0 - 0.335, F0 = 0.12, F1 = 1.82;    // the paling, along the left of the straight: where, and from and to
const POST = { u: U0 - 0.37, out: 1.45 };          // the winning post, behind the paling
// The timeline. The field comes out of the wall on the first downbeat of the tune and passes the post on its top note,
// six bars later; a stride to a beat.
const T_OUT = 2.05, T_FIN = 6.65, BAR = (T_FIN - T_OUT) / 6, BEAT = BAR / 2, EIGHTH = BAR / 4;
const V_CANTER = 0.7, F_CANTER = 1.75;             // afterwards: metres and strides a second
const CLEAR = 0.44;                                // how wide of the toy a horse passes (metres, middle to middle)
// Rossini, Guillaume Tell (1829), the overture's finale: its tune, a beat to a quaver (checked note for note against a
// score: the two semiquavers are the upbeat, the long B is five semiquavers and the run down from it three).
const TELL = 'B3:.5 B3:.5 | B3 B3:.5 B3:.5 B3 B3:.5 B3:.5 | E4 F#4 G#4 B3:.5 B3:.5 | B3 B3:.5 B3:.5 E4 G#4:.5 G#4:.5 | F#4 D#4 B3 B3:.5 B3:.5 |'
  + ' B3 B3:.5 B3:.5 B3 B3:.5 B3:.5 | E4 F#4 G#4 E4:.5 G#4:.5 | B4:2.5 A4:.5 G#4:.5 F#4:.5 | E4 G#4 E4';

// A horse's bones, and its rider's (FU, FU + 1: the two forearms; and so on).
const ROOT = 0, NECK = 1, HEAD = 2, FU = 3, FL = 5, HU = 7, HL = 9, TAIL = 11, SEAT = 12, TORSO = 13, JHEAD = 14, JARM = 15, NBH = 16;
// The marks: a loaded slash, a dab, a flick drawn out thin, a stroke that tapers.
const SLASH = 0, DAB = 1, FLICK = 2, TAPER = 3;
// The field, as it is in the picture from left to right (lane: metres from the middle of the course, to the right as
// they come at you; lead: metres ahead of the middle of the bunch). coat: [mid, dark, light].
const FIELD = [
  { id: 'white', lane: 0.07, lead: 0.11, coat: ['#3e2a1d', '#1e1510', '#6a4630'], silk: '#e2dccc', silk2: '#d6a29a', cap: '#e6cdc4', blaze: true, sock: true },
  { id: 'yellow', lane: -0.055, lead: 0.0, coat: ['#5a3823', '#2b1b12', '#875934'], silk: '#cfa63a', silk2: '#e6cc68', cap: '#d2aa3c', win: true },
  { id: 'dark', lane: -0.2, lead: 0.05, coat: ['#2c1f18', '#15100d', '#4a3426'], silk: '#26252b', silk2: '#66666c', cap: '#b9432f', sock: true },
  { id: 'blue', lane: 0.2, lead: -0.08, coat: ['#4a2f1f', '#22160f', '#744a2f'], silk: '#d9dedf', silk2: '#5a83bd', cap: '#3d6cb2', blaze: true },
  { id: 'green', lane: -0.13, lead: -0.22, coat: ['#3f2c1e', '#1b130e', '#60442c'], silk: '#b7a46c', silk2: '#d2c38e', cap: '#479650' },
];
// The racegoers: [along (they close up to fit between the paling and the corner), out, kind (m: a man in a top hat; w:
// a woman; b: a head at the back), coat or dress, hat, parasol]. The last two are the pair in the picture's
// foreground: the woman in blue, and the one in fawn under a pale parasol.
const CROWD = [
  [-0.44, 0.34, 'm', '#1c1b20', '#111013'], [-0.47, 0.5, 'w', '#b9b3a2', '#d9d2c0', '#cfc9b6'], [-0.43, 0.68, 'm', '#232029', '#111013'], [-0.48, 0.83, 'm', '#3b2d25', '#18130f'],
  [-0.44, 1.01, 'w', '#817c72', '#2a2623'], [-0.46, 1.18, 'm', '#28242a', '#121114'], [-0.45, 1.62, 'm', '#1a1a1f', '#0f0f12'], [-0.48, 1.76, 'w', '#c4bda9', '#ddd7c6', '#b9c0bf'],
  [-0.6, 0.42, 'm', '#24222a', '#121114'], [-0.64, 0.72, 'w', '#4a4650', '#c8c2b2', '#c9c3b0'], [-0.59, 1.08, 'm', '#30261f', '#15110e'], [-0.65, 1.32, 'm', '#1e1e24', '#101013'], [-0.61, 1.56, 'w', '#9a917d', '#3a302a'],
  [-0.52, 1.98, 'w', '#2f4b7c', '#1f1c20'], [-0.72, 1.88, 'w', '#a29373', '#c4b99d', '#d2cbb6'],
];

const hash = (a, b) => { const x = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return x - Math.floor(x); };

// Marks drawn as one instanced mesh: each a quad that faces the camera and lies along its own direction as the camera
// sees it (aKind.x 0), or lies on the floor (1), or lies level across the screen (2: a parasol's canopy). aSide bows a
// facing stroke (metres, at its middle); aKind.y is its place in the texture; aKind.z the alpha below which its paint
// is not there (or, for the soft kind, how thick it lies).
function markMesh(n, tex, slots, soft) {
  const geo = new THREE.PlaneGeometry(1, 1, 1, soft ? 1 : 6), at = {};
  for (const [name, k] of [['aPos', 3], ['aDir', 3], ['aSide', 3], ['aKind', 3], ['aSize', 2]]) { at[name] = new THREE.InstancedBufferAttribute(new Float32Array(n * k), k).setUsage(THREE.DynamicDrawUsage); geo.setAttribute(name, at[name]); }
  const mat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide, fog: false, transparent: !!soft, depthWrite: !soft });
  mat.onBeforeCompile = sh => {
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec3 aPos; attribute vec3 aDir; attribute vec3 aSide; attribute vec3 aKind; attribute vec2 aSize; varying float vCut;')
      .replace('#include <uv_vertex>', `#include <uv_vertex>\n  vMapUv.x = (vMapUv.x + aKind.y) / ${slots.toFixed(1)}; vCut = aKind.z;`)
      .replace('#include <project_vertex>', `
  vec4 mvPosition;
  if (aKind.x > 0.5 && aKind.x < 1.5) {        // lying on the turf (a shadow)
    mvPosition = viewMatrix * vec4(aPos + aDir * position.y * aSize.x + aSide * position.x * aSize.y, 1.0);
  } else {                    // a stroke: facing you, along its bone as you see it; end on, it is no longer than it is wide
    mvPosition = viewMatrix * vec4(aPos, 1.0);
    vec3 dv = (viewMatrix * vec4(aDir, 0.0)).xyz; float al = length(dv.xy), sinT = clamp(al / max(length(dv), 1e-4), 0.0, 1.0);
    vec2 ax = al > 1e-4 ? dv.xy / al : vec2(0.0, 1.0);
    float len = mix(min(aSize.x, aSize.y * 1.1), aSize.x, sinT);
    if (aKind.x > 1.5) { ax = vec2(1.0, 0.0); len = aSize.x; }
    mvPosition.xy += ax * position.y * len + vec2(-ax.y, ax.x) * position.x * aSize.y + (viewMatrix * vec4(aSide, 0.0)).xy * (1.0 - 4.0 * position.y * position.y) * sinT;
  }
  gl_Position = projectionMatrix * mvPosition;`);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vCut;')
      .replace('#include <map_fragment>', '#include <map_fragment>\n' + (soft ? '  diffuseColor.a *= vCut;' : '  if (diffuseColor.a < vCut) discard; diffuseColor.a = 1.0;'));
  };
  mat.customProgramCacheKey = () => 'manet-marks' + (soft ? '-soft' : '');
  const im = new THREE.InstancedMesh(geo, mat, n);
  im.setColorAt(0, new THREE.Color(1, 1, 1)); im.instanceColor.setUsage(THREE.DynamicDrawUsage); im.count = 0;
  const P = at.aPos.array, D = at.aDir.array, S = at.aSide.array, K = at.aKind.array, Z = at.aSize.array, C = im.instanceColor.array;
  const M = {
    mesh: im, n: 0, max: n,
    // a stroke at (x, y, z) along (dx, dy, dz); c its colour, k its light; (bx, by, bz) bows it
    put(x, y, z, dx, dy, dz, len, wid, slot, cut, c, k, bx = 0, by = 0, bz = 0, kind = 0) {
      const i = M.n; if (i >= n) return; M.n = i + 1; const a = i * 3;
      P[a] = x; P[a + 1] = y; P[a + 2] = z; D[a] = dx; D[a + 1] = dy; D[a + 2] = dz; S[a] = bx; S[a + 1] = by; S[a + 2] = bz;
      K[a] = kind; K[a + 1] = slot; K[a + 2] = cut; Z[i * 2] = len; Z[i * 2 + 1] = wid; C[a] = c.r * k; C[a + 1] = c.g * k; C[a + 2] = c.b * k;
    },
    // a stroke lying on the floor, along (dx, dz)
    lie(x, y, z, dx, dz, len, wid, slot, cut, c, k) { const l = Math.hypot(dx, dz) || 1; M.put(x, y, z, dx / l, 0, dz / l, len, wid, slot, cut, c, k, -dz / l, 0, dx / l, 1); },
    flush() { im.count = M.n; im.visible = M.n > 0; if (M.n) { for (const k in at) at[k].needsUpdate = true; im.instanceColor.needsUpdate = true; } },
  };
  return M;
}

lifeFor(81533, {
  title: /^The Races at Longchamp/,
  word: 'thunder',
  // (a small work hung high: the kit keeps all of it in view; the camera stands low on the line of the straight, so the
  // field comes at it as it comes at you in the picture, and on a phone held upright the straight is what it sees)
  stage: { out: 2.2, half: 1.3, cam: { dist: 3.25, height: 0.44, side: -0.1, fov: 56, lookU: -0.1, lookOut: 0.9, lookH: 0.55, floorOut: 2.15 } },
  wake: 2, ret: 2.4,
  linger: { near: 5, max: 45 },

  build(L) {
    const P = L.pal, col = (h, a = 0.2) => P.near(h, a);
    const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z), M4 = () => new THREE.Matrix4();
    this.L = L; this.C = new THREE.Color(); this.B = new Bones(); this.V = V3(); this.N = V3(); this.W = V3(); this.o = {}; this.o2 = {};
    this.O0 = -L.wall - 0.75; this.Lc = A - this.O0;       // the straight starts this far inside the wall
    // his light: from above, in front and a little to the left
    this.LW = V3(L.tx, 0, L.tz).multiplyScalar(-0.4).add(V3(L.nx, 0, L.nz).multiplyScalar(0.55)).add(V3(0, 0.75, 0)).normalize();
    // how far along the wall the room lets us go (the corner is close on one side here)
    const Rm = L.room; let uLo = -1.3, uHi = 1.85;
    if (Rm) { const a = Math.abs(L.tx) > 0.5 ? [(Rm.x0 - L.cx) / L.tx, (Rm.x1 - L.cx) / L.tx] : [(Rm.z0 - L.cz) / L.tz, (Rm.z1 - L.cz) / L.tz]; uLo = Math.max(uLo, Math.min(a[0], a[1]) + 0.03); uHi = Math.min(uHi, Math.max(a[0], a[1]) - 0.03); }
    const deep = Math.max(0.18, FENCE - 0.1 - uLo - 0.1), cu = u => FENCE - 0.1 + (u + 0.44) * Math.min(1, deep / 0.54);       // (the crowd closes up to fit)

    // ---------------------------------------------------------- his marks
    const tex = canvasTexture(256, 128, (g, W, H) => {
      const img = g.createImageData(W, H), d = img.data, rnd = L.rand;
      const col64 = () => Array.from({ length: 64 }, () => rnd());
      const tail = col64().map(v => 0.78 + v * 0.18), head = col64().map(v => 0.03 + v * 0.04), groove = col64().map(v => 0.82 + v * 0.18);
      const px = (slot, x, y, a, lum) => { const i = (y * W + x + slot * 64) * 4; d[i] = d[i + 1] = d[i + 2] = Math.max(0, Math.min(255, lum * 255)); d[i + 3] = Math.max(0, Math.min(255, a * 255)); };
      for (let y = 0; y < H; y++) for (let x = 0; x < 64; x++) {
        const a = (H - 0.5 - y) / H, xn = ((x + 0.5) / 64 - 0.5) * 2, yn = a * 2 - 1, gr = groove[x], nz = (rnd() - 0.5);
        // the slash: fluid, a round loaded start, fullest in the middle, the bristles running dry one by one
        { const wob = 0.05 * Math.sin(a * 5.2 + 0.7) + 0.025 * Math.sin(a * 13), side = 0.7 + 0.14 * Math.sin(Math.PI * Math.min(1, a * 1.2)) - Math.abs(xn + wob), start = (a - head[x] - 0.22 * xn * xn) / 0.05, dry = (tail[x] - 0.14 * xn * xn - a) / 0.06;
          const ridge = Math.exp(-(((xn - 0.42) / 0.16) ** 2)), pile = Math.exp(-(((a - 0.14) / 0.09) ** 2));
          px(SLASH, x, y, Math.min(side * 8, start, dry) + 0.5 + nz * 0.22, gr * (0.84 + 0.12 * ridge + 0.07 * pile) - 0.05 * Math.max(0, a - 0.6)); }
        // the dab: a short full touch, rounded
        { const r = Math.pow(Math.abs(xn) ** 2.3 + Math.abs(yn) ** 2.3, 1 / 2.3);
          px(DAB, x, y, (0.86 - r + nz * 0.1 + 0.04 * Math.sin(xn * 15 + yn * 3)) * 8 + 0.5, gr * (0.86 + 0.12 * Math.exp(-(((xn - 0.35) / 0.22) ** 2)))); }
        // the flick: full where the brush comes down, drawn out thin, a little curved
        { const hw = 0.2 + 0.62 * Math.pow(1 - a, 0.7), off = 0.12 * Math.sin(a * 2.6) - 0.04;
          px(FLICK, x, y, Math.min((hw - Math.abs(xn - off)) * 7, (a - 0.03 - 0.2 * xn * xn) / 0.04, (0.965 - a) / 0.05) + 0.5 + nz * 0.15, gr * 0.95); }
        // the taper: a full stroke that narrows by half, round at both ends
        { const hw = 0.84 - 0.4 * Math.pow(a, 0.85) + 0.03 * Math.sin(a * 9), xr = xn / hw;
          px(TAPER, x, y, Math.min((hw - Math.abs(xn)) * 7, (a - 0.03 - 0.16 * xr * xr) / 0.045, (0.97 - 0.1 * xr * xr - a) / 0.045) + 0.5 + nz * 0.16, gr * (0.86 + 0.1 * Math.exp(-(((xr - 0.4) / 0.3) ** 2)))); }
      }
      g.putImageData(img, 0, 0);
    }, false);
    // the dust's own: thin paint dragged dry, soft at its edge, more gaps than paint
    const dustTex = canvasTexture(64, 64, (g, W, H) => {
      const img = g.createImageData(W, H), d = img.data, rnd = L.rand, row = Array.from({ length: H }, () => 0.45 + rnd() * 0.55);
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const xn = (x + 0.5) / W * 2 - 1, yn = (y + 0.5) / H * 2 - 1, r = Math.hypot(xn, yn * 1.08) + 0.1 * Math.sin(xn * 5 + yn * 7), body = clamp01(1.1 - r * 1.15);
        const drag = row[y] * (0.6 + 0.4 * Math.sin(x * 0.5 + y * 1.7) * Math.sin(x * 0.21 + y * 0.6)), i = (y * W + x) * 4;
        d[i] = d[i + 1] = d[i + 2] = 215 + 40 * row[y]; d[i + 3] = 255 * clamp01(body * body * (0.3 + 0.7 * drag) * 1.5 + (rnd() - 0.5) * 0.06);
      }
      g.putImageData(img, 0, 0);
    }, false);

    // ---------------------------------------------------------- the field: strokes on bones
    // p: where (on its bone), d: the way it runs, n: the way it faces (for the light), b: how it bows.
    const stroke = (list, bone, p, d, n, len, wid, c, slot = SLASH, o = null) => { const s = { bone, p: V3(...p), d: V3(...d).normalize(), n: V3(...n).normalize(), len, wid, c: c.clone(), slot, b: null, bm: 0, ...o }; if (s.bow) { s.b = V3(...s.bow); s.bm = s.b.length(); s.b.normalize(); } list.push(s); };
    const skin = col('#d2a080', 0.12), blk = col('#17120f', 0.1), white = col('#dedac9', 0.1), boot = col('#1c1714', 0.1), breech = col('#d9d4c2', 0.12);
    this.field = FIELD.map((f, i) => {
      const H = { ...f, i, M: Array.from({ length: NBH }, M4), S: [], seed: 1.7 + i * 2.39, ax: 0, sg: 0, u: 0, out: 0, hu: 0, ho: 1, s: 0, v: 0, lane0: f.lane, vis: false, from: null };
      const [cm, cd, cl] = f.coat.map(h => col(h, 0.16)), ch = cm.clone().lerp(cl, 0.6), silk = col(f.silk, 0.14), silk2 = col(f.silk2, 0.14), cap = col(f.cap, 0.14), S = H.S;
      // the quarters, the barrel and the shoulder, a full round touch each, on either side; the light laid along the
      // back and the dark under the belly; a dab for the chest and one behind; a flick of light on shoulder and quarter
      for (const s of [1, -1]) {
        stroke(S, ROOT, [s * 0.03, 0.006, -0.088], [0, 0.25, 1], [s, 0.3, -0.2], 0.142, 0.124, cm, DAB);
        stroke(S, ROOT, [s * 0.036, -0.006, 0.004], [0, 0.04, 1], [s, 0.15, 0], 0.19, 0.106, cm.clone().lerp(cd, 0.25), DAB);
        stroke(S, ROOT, [s * 0.032, 0.0, 0.086], [0, 1, 0.4], [s, 0.3, 0.3], 0.128, 0.104, cm, DAB);
        stroke(S, ROOT, [s * 0.05, 0.026, 0.072], [0, 1, 0.6], [s, 0.6, 0.2], 0.058, 0.018, ch, FLICK, { bow: [0, 0, 0.006] });
        stroke(S, ROOT, [s * 0.046, 0.032, -0.092], [0, 0.5, -1], [s, 0.6, -0.2], 0.062, 0.019, ch, FLICK, { bow: [0, 0.006, 0] });
      }
      stroke(S, ROOT, [0, 0.046, -0.012], [0, 0, 1], [0, 1, 0], 0.22, 0.046, ch, SLASH, { bow: [0, -0.008, 0] });
      stroke(S, ROOT, [0, -0.04, 0.0], [0, 0, 1], [0, -1, 0], 0.19, 0.056, cd, SLASH, { bow: [0, -0.012, 0] });
      stroke(S, ROOT, [0, -0.008, 0.12], [0, 1, 0], [0, 0.25, 1], 0.128, 0.106, cm, DAB);
      stroke(S, ROOT, [0, 0.012, -0.138], [0, 1, 0], [0, 0.3, -1], 0.118, 0.104, cm.clone().lerp(cd, 0.3), DAB);
      // the neck, full at the shoulder, its crest bowed, and the dark mane along it; the long head, two ears
      stroke(S, NECK, [0, 0.052, 0.002], [0, 1, 0], [0, 0.2, 1], 0.15, 0.084, cm, TAPER, { bow: [0, 0, -0.01] });
      stroke(S, NECK, [0, 0.06, -0.027], [0, 1, 0], [0, 0.3, -1], 0.112, 0.022, blk, FLICK, { bow: [0, 0, -0.01] });
      stroke(S, HEAD, [0, 0, 0.04], [0, 0, 1], [0, 1, 0.3], 0.102, 0.048, cd.clone().lerp(cm, 0.55), TAPER);
      for (const s of [1, -1]) stroke(S, HEAD, [s * 0.012, 0.022, 0.002], [s * 0.25, 1, -0.15], [0, 0.3, 1], 0.03, 0.011, cd, FLICK);
      if (f.blaze) stroke(S, HEAD, [0, 0.017, 0.05], [0, 0, 1], [0, 1, 0.3], 0.052, 0.012, white, FLICK);
      // the legs: a tapering stroke for the forearm or the thigh, a thinner one below, dark; a white sock on some
      for (const i2 of [0, 1]) {
        const s = i2 ? -1 : 1;
        stroke(S, FU + i2, [0, -0.05, 0], [0, -1, 0], [s, 0, 0.4], 0.122, 0.046, cm, TAPER); stroke(S, FL + i2, [0, -0.054, 0], [0, -1, 0], [s, 0, 0.4], 0.116, 0.032, cd, TAPER, { bow: [0, 0, 0.004] });
        stroke(S, HU + i2, [0, -0.052, 0], [0, -1, 0], [s, 0, -0.3], 0.136, 0.06, cm, TAPER, { bow: [0, 0, -0.006] }); stroke(S, HL + i2, [0, -0.056, 0], [0, -1, 0], [s, 0, -0.3], 0.122, 0.033, cd, TAPER, { bow: [0, 0, 0.004] });
      }
      if (f.sock) { stroke(S, FL, [0, -0.094, 0], [0, -1, 0], [1, 0, 0.4], 0.034, 0.022, white, DAB); stroke(S, HL + 1, [0, -0.098, 0], [0, -1, 0], [-1, 0, -0.3], 0.034, 0.022, white, DAB); }
      stroke(S, TAIL, [0, 0, -0.07], [0, -0.22, -1], [0, 1, 0], 0.155, 0.032, blk, FLICK, { bow: [0, 0.008, 0] });
      // the jockey: white breeches and a dark boot down each flank, his back in his silks with a second touch across
      // it, his arms forward to the reins, a face, a cap
      for (const s of [1, -1]) {
        stroke(S, SEAT, [s * 0.048, -0.012, 0.016], [0, -0.8, 0.6], [s, 0.2, 0], 0.074, 0.03, breech, TAPER); stroke(S, SEAT, [s * 0.054, -0.058, 0.022], [0, -1, -0.25], [s, 0, 0], 0.05, 0.02, boot, TAPER);
        stroke(S, JARM, [s * 0.03, 0, 0.036], [0, 0, 1], [s, 0.5, 0], 0.076, 0.026, silk, TAPER);
      }
      stroke(S, TORSO, [0, 0.05, 0], [0, 1, 0], [0, 0.2, -1], 0.108, 0.074, silk, DAB);
      stroke(S, TORSO, [0, 0.062, -0.018], [0.55, 1, 0], [0, 0.3, -1], 0.06, 0.026, silk2, SLASH);
      stroke(S, JHEAD, [0, 0.014, 0.014], [0, 1, 0], [0, 0, 1], 0.03, 0.028, skin, DAB);
      stroke(S, JHEAD, [0, 0.031, 0.004], [0, 0, 1], [0, 1, 0], 0.054, 0.037, cap, DAB);
      return H;
    });

    // ---------------------------------------------------------- the racegoers
    const rr = L.rand;
    const flesh = () => col(rr() < 0.5 ? '#cfa080' : '#c09274', 0.12), grey = () => col(rr() < 0.5 ? '#4c4e52' : '#383637', 0.15);
    const person = (u, out, kind, c0, c1, par) => {
      const f = { u: cu(u), out, kind, M: [M4(), M4(), M4(), M4()], S: [], seed: rr() * TAU, lag: rr() * 0.3, sc: (kind === 'b' ? 1.06 : 1.12) + rr() * 0.12, ax: 0, ao: 0, g: 0, side: rr() < 0.5 ? 1 : -1, points: rr() < 0.4, par: !!par, neck: kind === 'm' ? 0.215 : kind === 'w' ? 0.2 : 0.19 };
      f.eu = lerp(FENCE - 0.1, f.u, 0.4) + (rr() - 0.5) * 0.06; f.te = 0.2 + rr() * 0.35 + (out > 1.3 ? 0 : 0.25); f.ta = f.te + 0.5 + out * 0.56; f.r0 = 0.02 + rr() * 0.12 + 0.12 * (1 - out / 2);
      f.chat = rr() * TAU;                      // (who they are turned to, before the drumming starts)
      const S = f.S, C0 = col(c0, 0.15), C1 = col(c1, 0.15);
      if (kind === 'm') {
        stroke(S, 0, [0, 0.056, 0], [0, 1, 0], [0, 0, 1], 0.118, 0.052, grey(), SLASH);
        stroke(S, 0, [0, 0.15, 0], [0.06 * f.side, -1, 0], [0, 0.2, 1], 0.14, 0.082, C0, TAPER, { bow: [0.004 * f.side, 0, 0] });
        stroke(S, 1, [0, 0.02, 0.013], [0, 1, 0], [0, 0, 1], 0.032, 0.03, flesh(), DAB);
        stroke(S, 1, [0, 0.022, -0.008], [0, 1, 0], [0, 0, -1], 0.037, 0.034, col('#2a201a', 0.1), DAB);
        stroke(S, 1, [0, 0.06, 0], [0, 1, 0], [0, 0.4, 1], 0.058, 0.043, C1, SLASH, { hat: true });
        stroke(S, 2, [0, -0.046, 0], [0, -1, 0], [f.side, 0, 0.3], 0.096, 0.03, C0, TAPER);
      } else if (kind === 'w') {
        stroke(S, 0, [0, 0.074, 0], [0, 1, 0], [0, 0.2, 1], 0.165, 0.176, C0, TAPER);
        stroke(S, 0, [0, 0.176, 0], [0, -1, 0], [0, 0.2, 1], 0.088, 0.06, C0.clone().multiplyScalar(0.84), TAPER);
        stroke(S, 1, [0, 0.02, 0.013], [0, 1, 0], [0, 0, 1], 0.03, 0.028, flesh(), DAB);
        stroke(S, 1, [0, 0.03, -0.006], [0, 1, 0], [0, 0.5, -0.6], 0.052, 0.048, C1, DAB);
        stroke(S, 2, [0, -0.04, 0], [0, -1, 0], [f.side, 0, 0.3], 0.08, 0.024, C0.clone().multiplyScalar(0.9), TAPER);
        if (par) { const pc = col(par, 0.14); stroke(S, 3, [0, 0.128, 0], [1, 0, 0], [0, 1, 0.2], 0.165, 0.05, pc, DAB, { level: true, bow: [0, 0.014, 0] }); stroke(S, 3, [0, 0.062, 0], [0, 1, 0], [0, 0, 1], 0.125, 0.01, col('#3a2f26', 0.1), FLICK); }
      } else {
        stroke(S, 0, [0, 0.115, 0], [0.08 * f.side, -1, 0], [0, 0.2, 1], 0.2, 0.082, C0, TAPER);
        stroke(S, 1, [0, 0.022, 0], [0, 1, 0], [0, 0.3, 1], 0.046, 0.04, C1, DAB);
      }
      return f;
    };
    this.folk = CROWD.map(c => person(...c));
    // the smear behind them: dark coats, a pale face or a hat
    for (let i = 0; i < 10; i++) {
      const dark = ['#1b1a1e', '#25222a', '#2e2620', '#1f2226'][i % 4], top = rr() < 0.45 ? '#c8ad92' : rr() < 0.5 ? '#121114' : '#bdb7a6';
      this.folk.push(person(-0.76 - rr() * 0.2, 0.3 + i * 0.16 + (rr() - 0.5) * 0.07, 'b', dark, top));
    }

    // ---------------------------------------------------------- the paling and the post
    this.pales = [];
    for (let i = 0, o = F0; o < F1; i++, o += 0.052 + rr() * 0.014) {
      const post = i % 5 === 0;
      this.pales.push({ u: FENCE + (rr() - 0.5) * 0.012, out: o, h: post ? 0.2 : 0.14 + rr() * 0.035, wid: post ? 0.027 : 0.013 + rr() * 0.005, lu: (rr() - 0.5) * 0.16, lo: (rr() - 0.5) * 0.16, seed: rr() * TAU,
        c: col(['#a9aa98', '#9aa090', '#b9b8a4', '#8f9484'][Math.floor(rr() * 4)], 0.2).multiplyScalar(post ? 0.85 : 1), bend: 0 });
    }
    const mid = (F0 + F1) / 2;
    this.rails = [[F0, mid + 0.02, 0.112], [mid - 0.02, F1, 0.118], [F0, mid + 0.03, 0.05], [mid - 0.03, F1, 0.046]].map(([a, b, y]) => ({ a, b, y, c: col('#9fa392', 0.2) }));
    this.postC = [col('#3d4038', 0.2), col('#5c5f52', 0.2), col('#a3a493', 0.18)];

    const NS = this.field.reduce((n, H) => n + H.S.length + 1, 0) + this.folk.reduce((n, f) => n + f.S.length, 0) + this.pales.length + this.rails.length + 11;
    this.marks = markMesh(NS, tex, 4, false); L.add(this.marks.mesh);
    this.ND = 34; this.haze = markMesh(this.ND, dustTex, 1, true); this.haze.mesh.renderOrder = 6; L.add(this.haze.mesh);
    this.dustA = col('#a39676', 0.2); this.dustB = col('#7d7a62', 0.25); this.shade = col('#19281e', 0.2);

    // ---------------------------------------------------------- the turf: one mesh, one shader
    // The picture's own dark, dull greens, long strokes swept across as he swept them, a little dust lying along the
    // middle of the course; a browner trodden ground under the crowd; the grass inside the loop a shade yellower. Its
    // edge wanders and breaks up stroke by stroke, and it spreads from under the picture.
    const turf = floorStrokes({ size: 512, seed: 81533, n: 2300, len: [26, 64], width: [6, 13], bend: 0.22, lift: 0.07, base: col('#2a3c2e', 0.3).getStyle(),
      colors: [['#2b3e2e', 3], ['#283d30', 3], ['#33402e', 2.2], ['#22352a', 2.4], ['#30483a', 1.6], ['#1d2e25', 1.6], ['#3c4a34', 1], ['#45563e', 0.5]].map(([c, w]) => [col(c, 0.3).getStyle(), w]),
      angle: (x, y, r) => (r() - 0.5) * 0.5 - 0.1 });
    const grass = floorStrokes({ size: 256, seed: 1866, n: 1100, len: [12, 30], width: [5, 10], bend: 0.3, lift: 0.08, base: col('#35442f', 0.3).getStyle(),
      colors: [['#384a30', 3], ['#3f4f32', 2.6], ['#4a5838', 1.6], ['#2f4230', 2], ['#53613b', 0.8], ['#2a3a2c', 1.2], ['#454e30', 1.2]].map(([c, w]) => [col(c, 0.3).getStyle(), w]),
      angle: (x, y, r) => (r() - 0.5) * 0.7 + 0.15 });
    {
      const F = (u, o) => L.floor(u, o, V3()).toArray(), pos = [], o1 = B + R + HW + 0.2;
      const u1 = Math.min(uHi, U0 + 2 * R + HW + 0.14), a = F(uLo, -L.wall), b = F(u1, -L.wall), c = F(u1, o1), d = F(uLo, o1);
      pos.push(...a, ...b, ...c, ...a, ...c, ...d);
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      const u = this.u = { uSpread: { value: 0 }, uDim: { value: 0.9 }, tTurf: { value: turf }, tGrass: { value: grass }, uO: { value: L.floor(U0, 0) }, uAx: { value: new THREE.Vector4(L.tx, L.tz, L.nx, L.nz) },
        uLoop: { value: new THREE.Vector4(R, A, B, HW) }, uCrowd: { value: new THREE.Vector4((FENCE + 0.06 + uLo) / 2 - U0, 1.04, (FENCE + 0.06 - uLo) / 2 + 0.05, 1.22) }, uDust: { value: col('#6f6a50', 0.25) } };
      const m = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide });
      m.onBeforeCompile = sh => {
        Object.assign(sh.uniforms, u);
        sh.fragmentShader = sh.fragmentShader
          .replace('#include <common>', '#include <common>\nuniform float uSpread, uDim; uniform vec3 uO, uDust; uniform vec4 uAx, uLoop, uCrowd; uniform sampler2D tTurf, tGrass; vec3 fCol; float fA;')
          .replace('#include <map_fragment>', `#include <map_fragment>
{
  vec2 lq = lifeP.xz - uO.xz, p = vec2(dot(lq, uAx.xy), dot(lq, uAx.zw));
  vec4 s1 = texture2D(tTurf, p / 0.95), s2 = texture2D(tTurf, p / 2.1 + 0.37), g1 = texture2D(tGrass, p / 0.75 + 0.21);
  // the course: the straight from the wall, and the loop; its field is all one piece, the loop filled in
  float dCh = length(vec2(p.x, p.y - clamp(p.y, -1.0, uLoop.y)));
  vec2 q = vec2(p.x - uLoop.x, p.y - clamp(p.y, uLoop.y, uLoop.z)); float ring = length(q) - uLoop.x, mid = min(dCh, abs(ring));
  // the trodden ground the crowd stands on
  float dCr = (length((p - uCrowd.xy) / uCrowd.zw) - 1.0) * uCrowd.z;
  float jit = (s1.a - 0.55) * 0.24 + (s2.a - 0.55) * 0.2 + 0.07 * sin(p.x * 4.3 + 1.0) * sin(p.y * 3.7 + 0.5);
  float a = 1.0 - smoothstep(-0.012, 0.012, min(min(dCh, ring) - uLoop.w, dCr) + jit);
  float track = 1.0 - smoothstep(-0.04, 0.04, mid - uLoop.w + (g1.a - 0.55) * 0.2);
  float inside = (1.0 - track) * step(ring, 0.0) * step(uLoop.w, dCh);
  vec3 turf = mix(s1.rgb, s2.rgb, 0.35);
  turf = mix(turf, uDust, exp(-mid * mid / 0.028) * (0.04 + 0.34 * s2.a) * 0.8);        // the dust lying along the middle of it
  vec3 c = mix(mix(s1.rgb * vec3(0.95, 0.84, 0.74), g1.rgb, inside), turf, track);
  float grow = length(p - vec2(0.0, -0.05)) + (s1.a - 0.55) * 0.35;
  fA = a * smoothstep(0.0, 0.05, uSpread * 3.5 - grow) * 0.97;
  fCol = c * uDim * mix(0.8, 1.0, smoothstep(0.0, 0.55, p.y));
}`)
          .replace('#include <opaque_fragment>', '  outgoingLight = fCol; diffuseColor.a = fA;\n#include <opaque_fragment>');
      };
      m.customProgramCacheKey = () => 'manet-turf';
      this.turf = new THREE.Mesh(g, m); this.turf.position.y = 0.012; this.turf.renderOrder = 4; L.add(this.turf);
    }

    // ---------------------------------------------------------- the pace
    // The field's middle is `s` metres along the course; the winner's nose is on the line at T_FIN.
    this.sFin = this.Lc + LAP + (POST.out - A) - 0.2 - 0.3 * SC;
    this.V0 = (this.sFin - 0.3) / (T_FIN - T_OUT);
    this.band = this.makeScore(L);
    this.rumble = L.k.loop({ lp: 150, hp: 30 }); this.roar = L.k.loop({ lp: 1700, hp: 450 });
    this.tc = 0; this.tOff = 0; this.sExtra = 0; this.phExtra = 0; this.vx = 0; this.cheerT = -99; this.spread0 = 0; this.toyWas = null; this.pop0 = 1;
    this.hideAll();
  },

  // ---------------------------------------------------------- hooves on a drum, and Rossini over them
  makeScore(L) {
    const s = score(L);
    const thump = (t, k, f) => { if (t < 0.2) return; s.note(t, f, 0.17, { type: 'sine', vol: 0.085 * k, to: f * 0.52, attack: 0.004 }); s.note(t, f * 2, 0.06, { type: 'triangle', vol: 0.028 * k, to: f, attack: 0.002 }); s.hit(t, { d: 0.06, vol: 0.026 * k, lp: 420 }); };
    // far off in the wall and coming on, then full: da-da-DUM to every beat until the post
    for (let n = -5; n <= 12; n++) {
      const t = T_OUT + n * BEAT, k = n < 0 ? 0.1 + 0.6 * Math.pow((n + 5) / 5, 1.6) : 1;
      thump(t - EIGHTH, 0.5 * k, 104); thump(t - EIGHTH / 2, 0.6 * k, 96); thump(t, k, 82);
    }
    const bpm = 60 / EIGHTH, t0 = T_OUT - EIGHTH;
    s.tune(TELL, t0, bpm, { type: 'square', vol: 0.011, legato: 0.62, oct: 1 });
    s.tune(TELL, t0, bpm, { type: 'triangle', vol: 0.026, legato: 0.7, oct: 1 });
    for (let b = 0; b < 8; b++) { const [r, f] = b === 3 ? [47, 54] : [52, 47]; s.note(T_OUT + b * BAR, hz(r), BEAT * 0.8, { type: 'triangle', vol: 0.03, attack: 0.004 }); s.note(T_OUT + b * BAR + BEAT, hz(f), BEAT * 0.7, { type: 'triangle', vol: 0.022, attack: 0.004 }); }
    return s.done();
  },

  hideAll() { for (const m of [this.marks, this.haze]) { m.n = 0; m.flush(); } this.turf.visible = false; this.u.uSpread.value = 0; },
  hush() { this.rumble.set(0); this.roar.set(0); },

  start(L, resumed) {
    if (!resumed) { this.hideAll(); this.tOff = 0; this.sExtra = 0; this.phExtra = 0; this.vx = 0; this.cheerT = -99; for (const H of this.field) H.ax = 0; for (const f of this.folk) f.ax = f.ao = 0; for (const p of this.pales) p.bend = 0; }
    else this.tOff = Math.max(T_FIN + 2.5, this.tc || 0) - L.t;
    this.band.from(L.t + this.tOff); this.lastT = -1; this.lastPh = null; this.toyWas = null;
    if (!this.told && !L.quiet) { this.told = true; L.k.say('Longchamp, 1866. Stand back from the rail: here they come.', 4); }
  },
  back(L) {
    // where everyone is, and their ways home: the field wheels and goes back up the straight into the wall
    const C = pts => { const c = new THREE.CatmullRomCurve3(pts.map(([u, o]) => new THREE.Vector3(u, 0, o)), false, 'centripetal'); c.arcLengthDivisions = 120; c.updateArcLengths(); return c; };
    for (const H of this.field) {
      if (!H.vis) { H.from = null; continue; }
      const hl = Math.hypot(H.hu, H.ho) || 1, hu = H.hu / hl, ho = H.ho / hl, pts = [[H.u, H.out], [H.u + hu * 0.22, H.out + ho * 0.22]];
      // (going away from the wall, it turns about first, to the inside)
      if (ho > 0.2) pts.push([H.u + hu * 0.36 + ho * 0.3, H.out + ho * 0.36 - hu * 0.3]);
      const hx = U0 + H.lane0 * 0.7, mo = Math.max(0.45, Math.min(0.75, H.out * 0.5));
      if (H.out > 0.55 || Math.abs(H.u - hx) > 0.3) pts.push([(pts[pts.length - 1][0] + hx) / 2, mo]);
      pts.push([hx, 0.12], [hx, this.O0]);
      H.from = { c: C(pts), ph: H.ph || 0, len: 0 }; H.from.len = H.from.c.getLength();
    }
    for (const f of this.folk) f.g0 = f.g;
    this.spread0 = this.u.uSpread.value; this.pop0 = this.pop == null ? 1 : this.pop;
  },
  end(L) { this.hideAll(); this.hush(); },
  reset(L) { this.hideAll(); this.hush(); this.told = false; this.won = false; this.tc = 0; },

  // ---------------------------------------------------------- the course, and the pace
  // s metres along it from its start inside the wall, d metres to the inside of the loop: where, and which way.
  course(s, d, o) {
    if (s < this.Lc) { o.u = U0 + d; o.out = this.O0 + s; o.hu = 0; o.ho = 1; return o; }
    const l = (s - this.Lc) % LAP, r = R - d;
    if (l < ST) { o.u = U0 + d; o.out = A + l; o.hu = 0; o.ho = 1; }
    else if (l < ST + ARC) { const a = (l - ST) / R, c = Math.cos(a), sn = Math.sin(a); o.u = U0 + R - r * c; o.out = B + r * sn; o.hu = sn; o.ho = c; }
    else if (l < 2 * ST + ARC) { o.u = U0 + 2 * R - d; o.out = B - (l - ST - ARC); o.hu = 0; o.ho = -1; }
    else { const a = (l - 2 * ST - ARC) / R, c = Math.cos(a), sn = Math.sin(a); o.u = U0 + R + r * c; o.out = A - r * sn; o.hu = -sn; o.ho = -c; }
    return o;
  },
  // How far from the middle of the course a point is.
  offCourse(u, out) {
    u -= U0; const dCh = Math.hypot(u, out - Math.max(-1, Math.min(A, out))), qo = out - Math.max(A, Math.min(B, out));
    return Math.min(dCh, Math.abs(Math.hypot(u - R, qo) - R));
  },
  // Where on the loop a point is: l metres round it from the start of the straight, d to the inside (null: nowhere near).
  onCourse(u, out, o) {
    u -= U0;
    if (out > B) { o.l = ST + R * Math.atan2(out - B, R - u); o.d = R - Math.hypot(u - R, out - B); }
    else if (out < A) { o.l = 2 * ST + ARC + R * Math.atan2(A - out, u - R); o.d = R - Math.hypot(u - R, A - out); }
    else if (u < R) { o.l = out - A; o.d = u; }
    else { o.l = ST + ARC + (B - out); o.d = 2 * R - u; }
    return Math.abs(o.d) < HW + CLEAR ? o : null;
  },
  fieldS(t) { if (t <= T_FIN) return this.sFin - this.V0 * (T_FIN - t); const x = t - T_FIN; return this.sFin + V_CANTER * x + (this.V0 - V_CANTER) * 0.9 * (1 - Math.exp(-x / 0.9)); },
  fieldV(t) { return (t <= T_FIN ? this.V0 : V_CANTER + (this.V0 - V_CANTER) * Math.exp(-(t - T_FIN) / 0.9)) + this.vx; },
  // strides gone (a stride to a beat while they race)
  fieldPh(t) { if (t <= T_FIN) return (t - T_OUT) / BEAT; const x = t - T_FIN; return (T_FIN - T_OUT) / BEAT + F_CANTER * x + (1 / BEAT - F_CANTER) * 0.9 * (1 - Math.exp(-x / 0.9)); },
  cheerAt(t) { const a = ease.out(ramp(t, T_FIN, T_FIN + 0.14)) * (1 - ease.smooth(ramp(t, T_FIN + 1.25, T_FIN + 2.3))), x = t - this.cheerT, b = x > 0 ? ease.out(ramp(x, 0, 0.14)) * (1 - ease.smooth(ramp(x, 1.1, 2.1))) : 0; return Math.max(a, b); },
  horseAt(H, t, o) {
    const relax = ease.smooth(ramp(t, T_FIN + 0.3, T_FIN + 2.6));
    let lead = H.lead * (1 + 0.6 * relax) + 0.05 * Math.sin(0.9 * t + H.seed);
    if (H.win) lead += 0.21 * ease.smooth(ramp(t, T_FIN - 1.7, T_FIN - 0.15));
    const lane = H.lane * (1 + 0.1 * relax) + 0.018 * Math.sin(0.6 * t + H.seed * 2) + H.ax;
    o.s = this.fieldS(t) + this.sExtra + lead; o.lane = Math.max(-0.6, Math.min(0.75, lane));
    return this.course(o.s, o.lane, o);
  },

  // ---------------------------------------------------------- every frame
  update(L, dt) {
    const ph = L.phase, showing = ph === 'wake' || ph === 'play', ret = ph === 'return', U = this.u, o = this.o, o2 = this.o2, mk = this.marks;
    if (showing) this.tc = L.t + this.tOff; else if (ph === 'linger') this.tc += dt;
    const t = this.tc, G = L.k.G, calm = !!(L.k.museum && L.k.museum.calm);       // (calm: "Reduce motion and flashing" is on)
    this.turf.visible = true; mk.n = 0; this.haze.n = 0;
    U.uSpread.value = ret ? this.spread0 * (1 - ease.inOut(ramp(L.ret, 0.55, 1))) : ease.out(ramp(t, 0.05, 1.75));
    // the toy, on the course or by it (it plays while the look is over)
    const toy = G.vehicle, tl = toy && ph === 'linger' && Math.abs(toy.pos.y - L.y) < 0.5 ? L.local(toy.pos.x, toy.pos.z) : null;
    const tsp = tl ? Math.hypot(toy.vel.x, toy.vel.z) : 0, racing = tl && tsp > 0.6 && this.offCourse(tl.u, tl.out) < HW + 0.12;
    if (ph === 'linger' && dt > 0) {
      // the field goes with the toy
      const want = racing ? Math.max(0, Math.min(1.9, tsp * 0.94) - V_CANTER) : 0;
      this.vx += (want - this.vx) * Math.min(1, dt * 1.6); this.sExtra += this.vx * dt; this.phExtra += this.vx * dt / 0.5;
      // and whoever passes the post is cheered
      if (tl && this.toyWas != null && this.toyWas < POST.out && tl.out >= POST.out && Math.abs(tl.u - U0) < HW + 0.1 && tsp > 0.5) {
        this.cheerT = t;
        if (!L.quiet) { L.voice().bell(1318.5, 0, calm ? 0.025 : 0.05, 2.2); if (!this.won) { this.won = true; L.k.say('Past the post! The whole of Longchamp is cheering you.', 3.5); } }
      }
      this.toyWas = tl ? tl.out : null;
    }
    const toyAt = tl ? this.onCourse(tl.u, tl.out, this.o3 || (this.o3 = {})) : null;
    const cheer = ret ? 0 : this.cheerAt(t), v = ret ? this.V0 * 0.9 : this.fieldV(t);
    const speedK = clamp01((v - V_CANTER) / (this.V0 - V_CANTER)), amp = lerp(0.6, 1, speedK), up = ret ? 0 : ease.smooth(ramp(t, T_FIN + 0.25, T_FIN + 1.2)) * (1 - speedK);
    const phase = this.fieldPh(t) + this.phExtra;

    // ---- the field
    let fu = 0, fo = 0, fn = 0;
    for (const H of this.field) {
      let lean = 0, hph;
      if (ret) {
        const fr = H.from; if (!fr) { H.vis = false; continue; }
        const k = ease.inOut(ramp(L.ret, 0.02 + H.i * 0.015, 0.84)), c = fr.c;
        c.getPointAt(k, this.V); c.getTangentAt(Math.min(k, 0.995), this.N);
        const k2 = Math.min(1, k + 0.08); c.getTangentAt(Math.min(k2, 0.995), this.W);
        lean = Math.max(-1, Math.min(1, (this.N.z * this.W.x - this.N.x * this.W.z) * 2.2));
        H.u = this.V.x; H.out = this.V.z; H.hu = this.N.x; H.ho = this.N.z; H.s = 0; H.v = this.V0 * 0.9;
        hph = fr.ph + k * fr.len / 0.48; H.vis = H.out > this.O0 + 0.1;
      } else {
        // out of the toy's way, softly (they never stop it)
        // the field parts round the toy: each sees it coming, well ahead, and takes the side with room (never over it)
        let want = 0;
        if (toyAt && H.s > this.Lc) {
          let ahead = (((toyAt.l - (H.s - this.Lc)) % LAP) + LAP) % LAP; if (ahead > LAP - 0.7) ahead -= LAP;
          const q = toyAt.d - ((H.lane1 || H.lane) - H.ax);                    // the toy's lane, from this horse's own
          if (ahead > -0.55 && ahead < 1.3 && Math.abs(q) < CLEAR) {
            // (which side: away from it, unless the paling is that way; chosen once, and kept until it is past)
            if (!H.sg) { const lo = toyAt.l < ST + 0.3 || toyAt.l > LAP - 0.6 ? -0.24 : -0.6, tgt = toyAt.d - (q >= 0 ? 1 : -1) * CLEAR; H.sg = (tgt < lo || tgt > 0.75) === (q >= 0) ? -1 : 1; }
            want = (q - H.sg * CLEAR) * clamp01((1.3 - ahead) / 0.35) * clamp01((ahead + 0.55) / 0.15);
          } else H.sg = 0;
        } else H.sg = 0;
        H.ax += (want - H.ax) * Math.min(1, dt * (Math.abs(want) > Math.abs(H.ax) ? 7 : 1.5));
        this.horseAt(H, t, o);
        H.u = o.u; H.out = o.out; H.hu = o.hu; H.ho = o.ho; H.s = o.s; H.lane1 = o.lane; H.v = v;
        this.course(o.s - 0.2, o.lane, o2); const ahu = o2.hu, aho = o2.ho; this.course(o.s + 0.2, o.lane, o2);
        lean = Math.max(-1, Math.min(1, (aho * o2.hu - ahu * o2.ho) / 0.6));
        hph = phase + 0.11 * Math.sin(H.seed * 3.1) + (H.win ? 0 : 0.04 * H.i); H.vis = t >= T_OUT - 0.4 && H.out > this.O0 + 0.1;
      }
      H.ph = hph;
      if (!H.vis) continue;
      fu += H.u; fo += H.out; fn++;
      this.poseHorse(L, H, hph, amp, lean * (ret ? 0.8 : speedK), H.win ? up : up * 0.8, H.win && !ret ? ease.smooth(ramp(t, T_FIN + 0.35, T_FIN + 0.8)) * (1 - ease.smooth(ramp(t, T_FIN + 2.2, T_FIN + 2.9))) : 0, t, calm);
      // its shadow on the turf, then its strokes
      mk.lie(H.u * L.tx + H.out * L.nx + L.cx, L.y + 0.024, H.u * L.tz + H.out * L.nz + L.cz, H.hu * L.tx + H.ho * L.nx, H.hu * L.tz + H.ho * L.nz, 0.4 * SC, 0.14 * SC, DAB, H.out < -L.wall + 0.06 ? 2 : 0.5, this.shade, 1);
      this.strokesOn(L, H.S, H.M, SC);
    }
    if (fn) { this.fu = fu / fn; this.fo = fo / fn; } else if (!ret) { this.course(this.fieldS(t) + this.sExtra, 0, o); this.fu = o.u; this.fo = Math.max(0, o.out); }
    this.dust(L, t, ret, showing, v);

    // ---- the paling and the post
    const pop = this.pop = ret ? this.pop0 * (1 - ease.inOut(ramp(L.ret, 0.3, 0.8))) : 1;
    // (the drumming in the wall rattles it; so does the field going by)
    const coming = showing ? ease.in(ramp(t, 0.5, T_OUT)) * (1 - ramp(t, T_OUT + 0.5, T_OUT + 1.4)) : 0;
    const tx = L.tx, tz = L.tz, nx = L.nx, nz = L.nz, P0 = this.V;
    for (const p of this.pales) {
      const k = pop * (ret ? clamp01(1 - (L.ret - 0.3) * 2 + p.out * 0.3) : ease.outBack(ramp(t, 0.4 + p.out * 0.62, 0.62 + p.out * 0.62))); if (k <= 0.01) continue;
      // the toy bends it over, and it springs back
      if (tl) { const dd = Math.hypot(p.u - tl.u, p.out - tl.out); p.bend += ((dd < 0.24 ? 1.2 * (tl.u > p.u ? -1 : 1) : 0) - p.bend) * Math.min(1, dt * 9); } else if (p.bend) p.bend *= Math.exp(-dt * 6);
      const near = Math.exp(-((this.fu - p.u) ** 2 + (this.fo - p.out) ** 2) / 0.2) * (fn ? 1 : 0), shake = calm ? 0 : (coming * 0.1 + near * 0.12) * Math.sin(t * 43 + p.seed);
      const lu = p.lu + shake + p.bend, lo = p.lo + shake * 0.6, h = p.h * k;
      L.floor(p.u, p.out, P0);
      const dx = tx * lu + nx * lo, dz = tz * lu + nz * lo, il = 1 / Math.hypot(dx, 1, dz);
      mk.put(P0.x + dx * il * h * 0.5, L.y + il * h * 0.5, P0.z + dz * il * h * 0.5, dx, 1, dz, h * 1.06, p.wid, TAPER, 0.5, p.c, 0.94 + 0.1 * Math.sin(p.seed * 5));
    }
    for (const r of this.rails) {
      const k = pop * (ret ? 1 : ease.out(ramp(t, 0.5 + r.a * 0.62, 0.75 + r.b * 0.62))); if (k <= 0.01) continue;
      L.floor(FENCE + 0.006, r.a + (r.b - r.a) * 0.5 * k, P0);
      mk.put(P0.x, L.y + r.y * pop, P0.z, nx, 0.008, nz, (r.b - r.a) * k, 0.02, SLASH, 0.5, r.c, 0.95);
    }
    {
      const k = pop * (ret ? 1 : ease.outBack(ramp(t, 1.15, 1.75)));
      if (k > 0.01) {
        const [dk, md, lt] = this.postC, sway = calm ? 0 : (coming * 0.012 + cheer * 0.01) * Math.sin(t * 31);
        L.floor(POST.u, POST.out, P0);
        for (let j = 0; j < 2; j++) mk.put(P0.x + tx * sway * (j + 0.5), L.y + (0.155 + j * 0.3) * k, P0.z + tz * sway * (j + 0.5), tx * sway, 1, tz * sway, 0.33 * k, 0.03 - 0.005 * j, SLASH, 0.5, j ? md : dk, 1);
        // the ring on top of it, eight touches of the brush
        for (let j = 0; j < 8; j++) { const a = j / 8 * TAU + 0.2, c = Math.cos(a), sn = Math.sin(a), rr = 0.045; mk.put(P0.x + tx * (c * rr + sway * 2.2), L.y + (0.66 + sn * rr) * k, P0.z + tz * (c * rr + sway * 2.2), -sn * tx, c, -sn * tz, 0.042 * k, 0.017, DAB, 0.5, j % 3 ? dk : md, 1.05); }
        L.floor(POST.u - 0.045, POST.out + 0.075, P0);
        mk.put(P0.x, L.y + 0.2 * k, P0.z, 0.02 * tx, 1, 0.02 * tz, 0.4 * k, 0.022, SLASH, 0.5, lt, 0.9);
      }
    }

    // ---- the racegoers
    const wu = this.fu || 0, wo = this.fo || 0;
    for (const f of this.folk) this.drawFolk(L, f, t, dt, ret, cheer, coming, tl, wu, wo, fn > 0, calm);
    mk.flush(); this.haze.flush();

    // ---- the sound of it
    const cam = G.camera.position, nearCam = Math.max(0, 1 - Math.hypot(cam.x - L.cx, cam.z - L.cz) / 11);
    L.voice().level = calm ? 0.55 : 1;
    if (L.quiet) this.hush();
    else {
      this.rumble.set(ret ? 0 : nearCam * (calm ? 0.5 : 1) * (0.05 * coming + 0.03 * speedK * (fn ? 1 : 0)), 0.15);
      this.roar.set(ret ? 0 : nearCam * (calm ? 0.5 : 1) * (0.02 * cheer + 0.004 * (showing ? ramp(t, 0.8, 1.8) : 1)), calm ? 0.4 : 0.12);
      if (showing && this.lastT >= 0 && this.lastT < T_FIN && t >= T_FIN) L.voice().bell(1318.5, 0, calm ? 0.028 : 0.055, 2.4);
      // after the post the hooves are their own drum: a canter's three beats, and the gallop again when the toy races
      if ((t > T_FIN + 0.05 || ret) && fn && dt > 0 && this.lastPh != null) {
        const lead = this.field[0].ph, a = Math.floor(this.lastPh * 4), b = Math.floor(lead * 4);
        if (b > a && b % 4 !== 3) { const beat = b % 4, k = (0.35 + 0.65 * speedK) * (beat === 2 ? 1 : 0.6) * (ret ? 1 - L.ret : 1), f = [100, 94, 80][beat], vo = L.voice(); vo.note(f, 0.15, { type: 'sine', vol: 0.06 * k, to: f * 0.52, attack: 0.004 }); vo.note(f * 2, 0.05, { type: 'triangle', vol: 0.02 * k, to: f, attack: 0.002 }); }
      }
      this.lastPh = this.field[0].ph;
    }
    if (showing) this.band.play(t);
    L.voice().place(L.cx + nx * 0.9, L.cz + nz * 0.9);
    this.lastT = t;
  },

  // The strokes of one thing (a horse, a racegoer) on its bones, lit from his light.
  strokesOn(L, S, M, sc, wave = null) {
    const V = this.V, N = this.N, LW = this.LW, wall = -L.wall - 0.07, mk = this.marks;
    for (let i = 0; i < S.length; i++) {
      const s = S[i], Mx = M[s.bone];
      V.copy(s.p).applyMatrix4(Mx);
      if (s.hat && wave) V.lerp(wave, wave.k);
      if ((V.x - L.cx) * L.nx + (V.z - L.cz) * L.nz < wall) continue;                 // still in the wall
      const x = V.x, y = V.y, z = V.z;
      N.copy(s.n).transformDirection(Mx);
      const k = 0.68 + 0.46 * Math.max(0, N.x * LW.x + N.y * LW.y + N.z * LW.z) + 0.08 * Math.max(0, N.y);
      let bx = 0, by = 0, bz = 0;
      if (s.b) { N.copy(s.b).transformDirection(Mx); const m = s.bm * sc; bx = N.x * m; by = N.y * m; bz = N.z * m; }
      N.copy(s.d).transformDirection(Mx);
      mk.put(x, y, z, N.x, N.y, N.z, s.len * sc, s.wid * sc, s.slot, 0.5, s.c, k, bx, by, bz, s.level ? 2 : 0);
    }
  },

  // ---------------------------------------------------------- a horse at the gallop
  // ph: strides gone (0: stretched out, fore and aft, as the painters of his day drew a gallop; a half: gathered under
  // it); amp: how hard it goes (0.6 a canter); lean: into the bend; up: the jockey standing in his stirrups; salute:
  // his arm in the air.
  poseHorse(L, H, ph, amp, lean, up, salute, t, calm) {
    const B = this.B, M = H.M, a = TAU * ph, c = Math.cos(a), yaw = L.yawOf(H.hu, H.ho);
    L.floor(H.u, H.out, this.V);
    const bob = (0.006 + 0.016 * amp) * c - 0.004, pitch = 0.075 * amp * Math.cos(a - 0.3);
    B.set(M[ROOT], this.V.x, L.y + (0.228 + bob) * SC, this.V.z, yaw, pitch, -0.24 * lean, SC);
    const neckP = lerp(0.6, 1.12, amp) + 0.13 * amp * Math.cos(a + 0.5);
    B.child(M[NECK], M[ROOT], 0, 0.03, 0.1, 0, neckP, 0);
    B.child(M[HEAD], M[NECK], 0, 0.118, 0.004, 0.1 * Math.sin(t * 1.7 + H.seed) * (1 - amp * 0.7), -0.42 + 0.1 * Math.sin(a + 1.2), 0);
    for (let i = 0; i < 2; i++) {
      const sx = i ? -0.032 : 0.032;
      const pf = a + (i ? 0.09 : 0) * TAU, thf = -0.12 - 0.72 * amp * Math.cos(pf), ff = 0.08 + 1.5 * amp * Math.max(0, -Math.sin(pf));
      B.child(M[FU + i], M[ROOT], sx, -0.018, 0.092, 0, thf, 0); B.child(M[FL + i], M[FU + i], 0, -0.105, 0, 0, ff, 0);
      const pb = a + (i ? -0.07 : 0.04) * TAU, thh = 0.22 + 0.76 * amp * Math.cos(pb), fh = -(0.2 + 1.15 * amp * Math.max(0, Math.sin(pb)));
      B.child(M[HU + i], M[ROOT], sx, -0.005, -0.1, 0, thh, 0); B.child(M[HL + i], M[HU + i], 0, -0.115, 0, 0, fh, 0);
    }
    B.child(M[TAIL], M[ROOT], 0, 0.032, -0.14, 0.22 * Math.sin(a * 0.5 + H.seed), -0.62 + 0.5 * amp + 0.1 * Math.sin(a + 2), 0);
    // the jockey: crouched over its neck, riding the stride; up in his stirrups when it is over
    B.child(M[SEAT], M[ROOT], 0, 0.062 + 0.014 * up + 0.007 * Math.sin(a + 2), -0.012, 0, -pitch * 0.6, 0);
    B.child(M[TORSO], M[SEAT], 0, 0.012, 0, 0, lerp(1.05, 0.28, up) + 0.07 * amp * Math.sin(a + 1.2), 0.05 * Math.sin(a * 0.5 + H.seed));
    B.child(M[JHEAD], M[TORSO], 0, 0.1, 0, 0, -lerp(0.75, 0.15, up), 0);
    B.child(M[JARM], M[TORSO], 0, 0.085, 0.01, 0, -0.5 + 0.5 * up - 2.2 * salute, 0.3 * salute * Math.sin(t * (calm ? 3 : 10)));
  },

  // ---------------------------------------------------------- the dust
  // Each drift of it is kicked up where a horse was a moment ago, rises, spreads and thins away; before the field is
  // out it blows from the foot of the wall.
  dust(L, t, ret, showing, v) {
    const DP = 0.95, o = this.o2, tx = L.tx, tz = L.tz, nx = L.nx, nz = L.nz, lo = -L.wall - this.O0 + 0.03, C = this.C, hz = this.haze;
    const on = ret ? 1 - ramp(L.ret, 0.5, 0.9) : showing ? ramp(t, 1.1, 1.7) : 1, speedK = clamp01(v / this.V0);
    if (on <= 0) return;
    for (let i = 0; i < this.ND; i++) {
      const H = this.field[i % 5], off = (((i / 5) | 0) / Math.ceil(this.ND / 5) + 0.13 * (i % 5)) * DP, nb = Math.floor((t - off) / DP), age = t - off - nb * DP, k = age / DP;
      const r1 = hash(i, nb), r2 = hash(i + 17.3, nb), r3 = hash(i + 31.7, nb);
      let u, out, hu, ho;
      if (ret || !H.s) { if (!H.vis) continue; u = H.u - H.hu * H.v * age; out = H.out - H.ho * H.v * age; hu = H.hu; ho = H.ho; if (out < -L.wall + 0.02) continue; }
      else { this.course(Math.max(lo, H.s - v * age - 0.12), (H.lane1 || 0) + (r1 - 0.5) * 0.14, o); u = o.u; out = o.out; hu = o.hu; ho = o.ho; }
      const w = (0.16 + 0.3 * Math.pow(k, 0.7)) * (0.75 + 0.5 * r1) * (0.6 + 0.4 * speedK);
      const back = 0.06 * k, side = (r3 - 0.5) * 0.16 * k, x = L.cx + (u - hu * back + ho * side) * tx + (out - ho * back - hu * side) * nx, z = L.cz + (u - hu * back + ho * side) * tz + (out - ho * back - hu * side) * nz;
      const y = L.y + 0.035 + (0.03 + 0.1 * r2) * Math.pow(k, 0.7) * (0.6 + 0.4 * speedK) + w * 0.12;
      C.copy(this.dustA).lerp(this.dustB, 0.2 + 0.6 * k);
      // (thin as it rises out of the hooves, thickest a moment later, then thinning away)
      hz.put(x, y, z, tx, 0.25 * (r3 - 0.5), tz, w, w * (0.42 + 0.2 * r2), 0, on * (0.3 + 0.4 * speedK) * Math.min(1, k * 7) * Math.pow(1 - k, 1.3), C, 0.95 + 0.15 * r2, 0, 0, 0, 2);
    }
  },

  // ---------------------------------------------------------- a racegoer
  drawFolk(L, f, t, dt, ret, cheer, coming, tl, wu, wo, fieldOut, calm) {
    const B = this.B, M = f.M;
    // out along the rail from the wall to their place; and back
    const g = f.g = ret ? (f.g0 || 0) * (1 - ease.inOut(ramp(L.ret, f.r0, f.r0 + 0.62))) : ease.inOut(ramp(t, f.te, f.ta));
    const eo = -L.wall - 0.14; let u = lerp(f.eu, f.u, g), out = lerp(eo, f.out, g);
    if (out < -L.wall - 0.02) return;
    const walking = g > 0.001 && g < 0.999;
    // out of the toy's way
    if (tl && dt > 0) { const du = u + f.ax - tl.u, dout = out + f.ao - tl.out, dd = Math.hypot(du, dout); if (dd < 0.3 && dd > 1e-4) { const k = Math.min(1, dt * 7); f.ax += du / dd * (0.3 - dd) * k; f.ao += dout / dd * (0.3 - dd) * k; } }
    if (dt > 0) { f.ax *= Math.exp(-dt * 1.4); f.ao *= Math.exp(-dt * 1.4); }
    u += f.ax; out += f.ao;
    // what they watch: each other, then the wall the drumming comes from, then the field, all the way round
    let yaw;
    const toWall = L.yawOf(U0 + 0.05 - u, -0.1 - out), near = fieldOut ? Math.exp(-((wu - u) ** 2 + (wo - out) ** 2) / 0.5) : 0;
    if (walking) yaw = ret ? L.yawOf(f.eu - f.u, eo - f.out) : L.yawOf(f.u - f.eu, f.out - eo);
    else {
      const chat = L.yawOf(Math.cos(f.chat), Math.sin(f.chat) * 0.6 + 0.5);
      yaw = turnTo(chat, toWall, ease.smooth(ramp(t, 1.15 + f.lag, 1.6 + f.lag)));
      if (fieldOut) yaw = turnTo(yaw, L.yawOf(wu - u, wo - out) + 0.2 * Math.sin(f.seed * 3), ease.smooth(ramp(t, T_OUT + f.lag * 0.5, T_OUT + 0.35 + f.lag)));
    }
    const excite = Math.max(cheer, near * 0.7, coming * 0.5), bounce = calm ? 0.5 + 0.5 * Math.sin(t * 2.6 + f.seed) : Math.abs(Math.sin(t * (6.5 + (f.seed % 1) * 2) + f.seed)), step = calm ? 0 : Math.sin(t * 13 + f.seed);
    const hopY = walking ? 0.012 * Math.abs(step) : (0.006 + (calm ? 0.012 : 0.03) * cheer) * bounce * excite;
    const lean = walking ? 0.22 : 0.05 + 0.2 * Math.max(near, coming * 0.8) - 0.12 * cheer + 0.03 * Math.sin(t * 1.3 + f.seed);
    L.floor(u, out, this.V);
    B.set(M[0], this.V.x, L.y + hopY, this.V.z, yaw, lean, 0.05 * Math.sin(t * 1.1 + f.seed * 2) + (walking ? 0.08 * step : 0), f.sc);
    B.child(M[1], M[0], 0, f.neck, 0, 0.25 * Math.sin(t * 0.9 + f.seed) * (1 - excite), -0.12 * excite - lean * 0.5, 0);
    // an arm: hanging, pointing at them as they come, thrown up at the post (a man's with his hat in it)
    const wave = cheer * (0.75 + 0.25 * Math.sin(t * (calm ? 3 : 11) + f.seed)), point = f.points && !walking ? Math.max(near, coming) * (1 - cheer) : 0;
    B.child(M[2], M[0], f.side * 0.044, f.neck - 0.022, 0, 0, -0.15 - 1.35 * point - 2.75 * wave + (walking ? 0.5 * step : 0), f.side * (0.12 + 0.35 * wave));
    let hat = null;
    if (f.kind === 'm' && cheer > 0.02) { hat = this.W.set(0, -0.125, 0).applyMatrix4(M[2]); hat.k = ease.smooth(ramp(cheer, 0.1, 0.5)); }
    if (f.par) B.child(M[3], M[0], -f.side * 0.03, f.neck - 0.045 + 0.035 * cheer * bounce, 0.03, 0, 0.2 + 0.1 * Math.sin(t * 1.4 + f.seed) - 0.3 * cheer, f.side * (0.16 + 0.12 * Math.sin(t * 1.1 + f.seed * 2)));
    this.strokesOn(L, f.S, M, f.sc, hat);
  },
});
