// George Wesley Bellows, Love of Winter (1914), Gallery 272. The word: skate.
//
// In the picture a crowd skates on a pond in the snow under dark blue hills, slashed in with quick loaded strokes: a
// woman in a yellow coat is pulled by the hand by a child in red, a woman in a red coat stands by, a man in a white
// sweater and others crouch on the bank to put on their skates, and the crowd beyond is dark coats with flashes of red,
// green and white; the ice and the snow are white, the shadows blue. Look at it and the pond freezes out of the wall:
// ice spreads across the gallery floor from under the frame with a crackle, laid in his long white and blue strokes,
// and a bank of his snow (white, blue in its shadows, the odd fleck of orange earth) heaps up round it. The skaters glide
// out from under the bottom rail, his people in his marks: every one of them built of broad, loaded, square-ended
// strokes in the picture's own colours (the yellow coat, the red ones, the white sweater, a violet coat under an orange
// hat, a green one, a man in a bowler with a red scarf), each with a slash of blue shadow on the ice. A man kneels on
// the bank to do up his skate. The crowd circles the pond to the Skaters' Waltz (Waldteufel, Les Patineurs, 1882), and
// their blades carve the ice as they go. The child in red pulls the woman in yellow out to the middle, as she does in the
// picture; they take both hands, wind up, and spin: faster and faster on the rising phrase, till the child is swung
// off her feet, and on the top note of the tune they skid to a stop in a spray of ice. The crowd waves. While you keep
// looking they skate on, the two hand in hand; the kneeling man gets up and joins in.
//
// And the toy can skate with them. Stop looking and they stay while the toy is near: the crowd circles round the toy
// wherever it goes on the ice (they swerve softly out of its way, never solid), and its wheels carve the ice too.
// Drive off and it all goes home: the skaters glide back in under the frame, the bank sinks and the ice thaws back
// into the wall.
import * as THREE from 'three';
import { lifeFor, ease, ramp, clamp01, lerp, canvasTexture } from '../paintlife.js';
import { score, Bones, hump, turnTo, noise, hz } from './stagecraft.js';
import { strokes as floorStrokes } from './brush.js';
import { parse } from '../carols.js';

// ---------------------------------------------------------------- the skaters' bones (metres, a grown-up 0.5 m tall)
const NB = 11, PEL = 0, TOR = 1, HEAD = 2, UAR = 3, FAR = 4, UAL = 5, FAL = 6, THR = 7, SHR = 8, THL = 9, SHL = 10;
const SC = 1.18;                     // everyone a little larger than life-size for the toy: a grown-up 0.59 m
const THIGH = 0.112, SHIN = 0.108, BOOT = 0.02, TORSO = 0.15, UARM = 0.076, FARM = 0.07;
// ---------------------------------------------------------------- the pond, in the stage's terms (along, out)
const POND = { c: 0.86, U: 1.22, O: 1.02, p: 2.6 };
const RING = { u: 0.02, out: 1.0 };            // the crowd circles round this
const SPIN = { u: 0.05, out: 0.97 };          // where the two spin
const KN = { u: -0.78, out: 1.36 };           // where the man kneels to do up his skate
const TB = { u0: -1.35, o0: -0.32, w: 2.7, h: 2.4 }, TW = 160, TH = 142;     // the carved ice: where its map lies
// ---------------------------------------------------------------- the waltz and the timeline
// Waldteufel, Les Patineurs (The Skaters), 1882: the main waltz theme, in A.
const THEME = 'C#5:3 | E5:2 F#5 | F#5:6 | D5:3 | F#5:2 G#5 | G#5:6 | B5:3 | A5:2 C#5 | E5:3 | D5:2 C#5 | C#5:3 | B4:3 | A4:3';
const CHORDS = ['A', 'A', 'D', 'D', 'E7', 'E7', 'E7', 'E7', 'E7', 'A', 'A', 'D', 'A', 'E7', 'A'];
const CH = { A: [45, 61, 64], D: [50, 62, 66], E7: [40, 62, 68] };            // the bass, and the two notes on the off-beats
const BPM = 220, BT = 60 / BPM, BAR = 3 * BT, T0 = 1.5;
const T_SPIN = T0 + 4 * BAR, T_PEAK = T0 + 6 * BAR, T_STOP = T0 + 8 * BAR;     // the D, the held G#, the top B
const T_FACE = 3.75, T_HOLD = 4.3, T_IDLE = 8.6, T_RISE = 8.75, T_JOIN = 9.2, T_END = T0 + 15 * BAR;

// The cast: his people, from the picture. coat: [colour, shade, light]; skirt: how far the coat comes down (m).
const CAST = [
  { id: 'kneel', role: 'kneel', te: 1.15, ue: -0.36, coat: ['#5c3f2d', '#38261b', '#7c5b40'], skirt: 0.085, hat: ['cap', '#34343a'], legs: '#2c2c32', scarf: '#c9b48a', arms: 'back', ring: [0.86, 0.62, 1.0, 0] },
  { id: 'red', role: 'ring', te: 1.35, ue: -0.3, coat: ['#b8412f', '#86292a', '#de6a4a'], skirt: 0.19, hat: ['cloche', '#a33529'], legs: '#2a2224', scarf: '#ddc4a8', arms: 'muff', ring: [0.84, 0.6, 1.0, 0.3] },
  { id: 'white', role: 'ring', te: 1.55, ue: 0.24, coat: ['#e9e7de', '#a6b3cc', '#ffffff'], skirt: 0.04, hat: ['cap', '#eeeee6'], legs: '#33343e', trousers: '#3a3b46', arms: 'back', ring: [0.72, 0.57, 1.0, 1.55] },
  { id: 'violet', role: 'ring', te: 1.75, ue: -0.06, coat: ['#4d3558', '#2f2239', '#6e4c7c'], skirt: 0.2, hat: ['wide', '#d0602c'], legs: '#221c24', muff: '#ece8e0', arms: 'muff', ring: [0.92, 0.63, 1.0, 2.8] },
  { id: 'yellow', role: 'pairL', te: 2.0, ue: -0.1, coat: ['#b5a23c', '#867625', '#d9ca6c'], skirt: 0.205, hat: ['wide', '#3a3242'], legs: '#2a2420', scarf: '#efe9dc', hands: '#efe9dc', arms: 'muff' },
  { id: 'child', role: 'pairC', te: 2.0, ue: 0.08, sc: 0.66, coat: ['#cf4630', '#962c22', '#ec744c'], skirt: 0.07, hat: ['cloche', '#b8382a'], hair: '#3a2a22', legs: '#eeeae2', arms: 'swing' },
  { id: 'green', role: 'ring', te: 2.4, ue: 0.3, coat: ['#3f8a4d', '#295e36', '#66ac6c'], skirt: 0.17, hat: ['cloche', '#2a2a30'], legs: '#24242a', arms: 'swing', ring: [0.66, 0.58, 1.0, 4.05] },
  { id: 'bowler', role: 'ring', te: 2.65, ue: -0.26, coat: ['#2b2f40', '#1b1d29', '#4a536c'], skirt: 0.1, hat: ['bowler', '#1d1d23'], legs: '#2a2a30', scarf: '#c8402c', arms: 'back', ring: [0.8, 0.6, 1.0, 5.25] },
];

lifeFor(109780, {
  title: /^Love of Winter/,
  word: 'skate',
  stage: { out: 1.95, half: 1.35, cam: { dist: 2.7, height: 0.62, side: 0.32, fov: 56, lookU: 0.0, lookOut: 0.95, lookH: 0.55, floorOut: 1.7 } },
  wake: 2, ret: 2.2,
  linger: { near: 4.5, max: 45 },

  build(L) {
    const P = L.pal, col = (h, a = 0.22) => P.near(h, a);
    this.B = new Bones(); this.T = new THREE.Vector3(); this.V = new THREE.Vector3(); this.N = new THREE.Vector3(); this.S2 = new THREE.Vector3();
    this.R = new THREE.Matrix4(); this.C = new THREE.Color();
    this.o = {}; this.o2 = {};
    // the light: from the front, up and to the left, as on his figures; the shadows go blue
    { const T = new THREE.Vector3(L.tx, 0, L.tz), N = new THREE.Vector3(L.nx, 0, L.nz); this.LW = T.clone().multiplyScalar(-0.45).add(N.clone().multiplyScalar(0.5)).add(new THREE.Vector3(0, 0.75, 0)).normalize(); this.SH = T.clone().multiplyScalar(-0.55).add(N.clone().multiplyScalar(0.84)).normalize(); this.SHs = new THREE.Vector3(-this.SH.z, 0, this.SH.x); }
    this.blue = col('#4f62a8', 0.25);

    // ---------------------------------------------------------- his marks: a loaded flat brush, and a shorter dab
    const tex = canvasTexture(128, 128, (g, W, H) => {
      const img = g.createImageData(W, H), d = img.data;
      const tail = Array.from({ length: 64 }, () => 0.6 + L.rand() * 0.38), groove = Array.from({ length: 64 }, () => 0.78 + L.rand() * 0.22);
      const wob = Array.from({ length: H }, (_, y) => 0.05 * Math.sin(y * 0.09 + 0.7) + 0.03 * Math.sin(y * 0.23));
      const head = Array.from({ length: 64 }, () => 0.03 + L.rand() * 0.05);
      for (let y = 0; y < H; y++) for (let x = 0; x < 64; x++) {
        // the slash: straight sides (a flat brush), a square, loaded start, and the bristles running dry one by one
        const v = (y + 0.5) / H, xn = ((x + 0.5) / 64 - 0.5) * 2 + wob[y];
        const side = 0.86 - Math.abs(xn), start = (v - head[x]) / 0.04, dry = (tail[x] - v) / 0.05;
        const a = Math.min(side * 9, start, dry) + (L.rand() - 0.5) * 0.25;
        const ridge = Math.exp(-(((xn - 0.5) / 0.14) ** 2)), pile = Math.exp(-(((v - 0.1) / 0.08) ** 2));
        const lum = groove[x] * (0.82 + 0.13 * ridge + 0.08 * pile) - 0.06 * Math.max(0, v - 0.6);
        const i = (y * W + x) * 4; d[i] = d[i + 1] = d[i + 2] = Math.min(255, lum * 255); d[i + 3] = Math.max(0, Math.min(255, (a + 0.5) * 255));
      }
      for (let y = 0; y < H; y++) for (let x = 0; x < 64; x++) {
        // the dab: a short square-ish blob, thick, its bristle marks in it
        const xn = ((x + 0.5) / 64 - 0.5) * 2, yn = ((y + 0.5) / H - 0.5) * 2, r = Math.pow(Math.abs(xn) ** 3 + Math.abs(yn) ** 3, 1 / 3);
        const a = (0.88 - r + (L.rand() - 0.5) * 0.12 + 0.05 * Math.sin(xn * 17 + yn * 3)) * 9;
        const ridge = Math.exp(-(((xn - 0.35) / 0.2) ** 2));
        const i = (y * W + x + 64) * 4, lum = groove[x] * (0.84 + 0.14 * ridge);
        d[i] = d[i + 1] = d[i + 2] = Math.min(255, lum * 255); d[i + 3] = Math.max(0, Math.min(255, (a + 0.5) * 255));
      }
      g.putImageData(img, 0, 0);
    }, false);

    // ---------------------------------------------------------- the skaters, as strokes on their bones
    this.figs = CAST.map((c, who) => ({ ...c, who, sc: (c.sc || 1) * SC, P: newPose(), mats: Array.from({ length: NB }, () => new THREE.Matrix4()), ax: 0, ao: 0, prev: null, seed: L.rand() * 6.28 }));
    this.strokes = [];
    const jit = s => (L.rand() - 0.5) * s;
    for (const f of this.figs) {
      const C3 = f.coat.map(h => col(h)), skin = col('#d89c78', 0.15), hair = col(f.hair || '#5a3a26', 0.2), legs = col(f.legs, 0.2), boot = col('#262228', 0.15), blade = col('#c9d2de', 0.1);
      const pick = () => C3[L.rand() < 0.55 ? 0 : L.rand() < 0.6 ? 1 : 2];
      const add = (bone, p, dir, n, len, wid, c, slot = 0, o = {}) => this.strokes.push({ who: f.who, bone, p: new THREE.Vector3(...p), d: new THREE.Vector3(...dir).normalize(), n: new THREE.Vector3(...n).normalize(), len, wid, c: new THREE.Color(c), slot, ...o });
      // the coat, above the waist: slashes all round, a few laid across, the shoulders
      for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2 + jit(0.3), sa = Math.sin(a), ca = Math.cos(a); add(TOR, [sa * 0.037, 0.072 + jit(0.02), ca * 0.027], [jit(0.5), 1, 0], [sa, 0, ca], 0.15, 0.052, pick()); }
      for (const s of [-1, 1]) add(TOR, [s * 0.03, 0.135, 0], [1, s * 0.3, 0], [s * 0.6, 0.6, 0.2], 0.07, 0.034, pick());
      add(TOR, [jit(0.01), 0.08, 0.03], [0.6 + jit(0.4), 1, 0], [0, 0.2, 1], 0.11, 0.03, C3[2]);           // a slash of light across the front
      if (f.scarf) add(TOR, [0, 0.142, 0.016], [1, 0.25, 0], [0, 0.3, 1], 0.05, 0.026, col(f.scarf, 0.15));
      // the coat below the waist, to the knee or to the ankle (it flares as they spin)
      const nsk = f.skirt > 0.12 ? 9 : 7;
      for (let k = 0; k < nsk; k++) { const a = (k / nsk) * Math.PI * 2 + jit(0.3), sa = Math.sin(a), ca = Math.cos(a); add(PEL, [sa * 0.046, -f.skirt * 0.48 + 0.01, ca * 0.034], [sa * 0.22, -1, ca * 0.16], [sa, 0, ca], f.skirt + 0.02, 0.058, pick(), 0, { skirt: 1 }); }
      // the head: face, hair, the hat
      add(HEAD, [0, 0.038, 0.012], [0, 1, 0.1], [0, 0.1, 1], 0.05, 0.042, skin, 1);
      add(HEAD, [0, 0.044, -0.012], [0, 1, 0], [0, 0.2, -1], 0.05, 0.047, hair, 1);
      const [hk, hc0] = f.hat, hc = col(hc0, 0.15), hl = hc.clone().lerp(new THREE.Color(1, 1, 1), 0.18);
      if (hk === 'wide') { add(HEAD, [0, 0.077, -0.004], [1, 0, 0], [0, 1, 0], 0.04, 0.05, hc, 1); add(HEAD, [0, 0.064, 0.003], [1, 0, 0.12], [0, 1, 0.3], 0.105, 0.017, hl); }
      else if (hk === 'cloche') { add(HEAD, [0, 0.068, -0.005], [1, 0, 0], [0, 1, 0], 0.052, 0.056, hc, 1); add(HEAD, [0, 0.056, 0.004], [1, 0, 0], [0, 0.5, 1], 0.07, 0.015, hl); }
      else if (hk === 'cap') { add(HEAD, [0, 0.07, -0.006], [1, 0, 0], [0, 1, 0], 0.046, 0.042, hc, 1); add(HEAD, [0, 0.064, 0.024], [1, 0, 0], [0, 0.5, 1], 0.036, 0.012, hl); }
      else { add(HEAD, [0, 0.076, 0], [1, 0, 0], [0, 1, 0], 0.042, 0.046, hc, 1); add(HEAD, [0, 0.061, 0], [1, 0, 0], [0, 1, 0.3], 0.078, 0.012, hl); }
      // arms: two strokes of sleeve and a hand
      const hand = col(f.hands || (f.arms === 'back' ? '#2a2628' : '#d89c78'), 0.15);
      for (const [ua, fa] of [[UAR, FAR], [UAL, FAL]]) {
        add(ua, [0, -UARM * 0.5, 0], [jit(0.2), -1, 0], [0, 0, 1], UARM * 1.35, 0.034, pick());
        add(fa, [0, -FARM * 0.5, 0], [jit(0.2), -1, 0], [0, 0, 1], FARM * 1.3, 0.029, pick());
        add(fa, [0, -FARM - 0.008, 0], [0, -1, 0], [0, 0, 1], 0.026, 0.022, hand, 1);
      }
      if (f.muff) add(FAR, [0.02, -FARM - 0.006, 0.01], [1, 0, 0], [0, 0.3, 1], 0.06, 0.045, col(f.muff, 0.12), 1);
      // legs: trousers or stockings, the boot, the blade
      for (const [th, sh] of [[THR, SHR], [THL, SHL]]) {
        add(th, [0, -THIGH * 0.5, 0], [0, -1, 0], [0, 0, 1], THIGH * 1.25, 0.04, f.trousers ? col(f.trousers, 0.15) : legs);
        add(sh, [0, -SHIN * 0.45, 0], [0, -1, 0], [0, 0, 1], SHIN * 1.1, 0.03, legs);
        add(sh, [0, -SHIN - 0.003, 0.012], [0, 0.25, 1], [0, 0.4, 1], 0.05, 0.026, boot, 1);
        add(sh, [0, -SHIN - BOOT + 0.003, 0.012], [0, 0, 1], [0, 1, 0], 0.075, 0.008, blade);
      }
      f.shadow = this.strokes.length; this.strokes.push({ who: f.who, shadow: true, len: 0.24, wid: 0.075, c: this.blue.clone(), slot: 0 });
    }
    // the spray of ice when the two skid to a stop
    this.spray = [];
    for (let i = 0; i < 18; i++) {
      const a = (L.rand() - 0.5) * 1.6, sp = 0.55 + L.rand() * 0.75;
      this.spray.push({ i: this.strokes.length, a, sp, up: 0.45 + L.rand() * 0.7, from: i % 3 === 0 ? 0 : 1, life: 0.9 + L.rand() * 0.5 });
      this.strokes.push({ who: -1, spray: true, len: 0.03 + L.rand() * 0.03, wid: 0.012 + L.rand() * 0.01, c: col(L.rand() < 0.6 ? '#f4f6f8' : '#c4d2ea', 0.1), slot: L.rand() < 0.5 ? 0 : 1 });
    }
    const NS = this.strokes.length, geo = new THREE.PlaneGeometry(1, 1);
    this.aPos = new THREE.InstancedBufferAttribute(new Float32Array(NS * 3), 3).setUsage(THREE.DynamicDrawUsage);
    this.aDir = new THREE.InstancedBufferAttribute(new Float32Array(NS * 3), 3).setUsage(THREE.DynamicDrawUsage);
    this.aSide = new THREE.InstancedBufferAttribute(new Float32Array(NS * 3), 3).setUsage(THREE.DynamicDrawUsage);
    this.aKind = new THREE.InstancedBufferAttribute(new Float32Array(NS * 2), 2).setUsage(THREE.DynamicDrawUsage);
    this.aSize = new THREE.InstancedBufferAttribute(new Float32Array(NS * 2), 2).setUsage(THREE.DynamicDrawUsage);
    for (const [n, a] of [['aPos', this.aPos], ['aDir', this.aDir], ['aSide', this.aSide], ['aKind', this.aKind], ['aSize', this.aSize]]) geo.setAttribute(n, a);
    const mat = new THREE.MeshBasicMaterial({ map: tex, alphaTest: 0.5, side: THREE.DoubleSide, fog: false });
    mat.onBeforeCompile = sh => {
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec3 aPos; attribute vec3 aDir; attribute vec2 aSize; attribute vec3 aSide; attribute vec2 aKind;')
        .replace('#include <uv_vertex>', '#include <uv_vertex>\n  vMapUv.x = vMapUv.x * 0.5 + aKind.y * 0.5;')
        .replace('#include <project_vertex>', `
  vec4 mvPosition;
  if (aKind.x > 0.5) {        // lying in the world (a shadow on the ice)
    mvPosition = viewMatrix * vec4(aPos + aDir * position.y * aSize.x + aSide * position.x * aSize.y, 1.0);
  } else {                    // a stroke: facing the camera, along its bone as the camera sees it
    mvPosition = viewMatrix * vec4(aPos, 1.0);
    vec3 dv = (viewMatrix * vec4(aDir, 0.0)).xyz; vec2 ax = dv.xy; float al = length(ax);
    ax = al > 1e-4 ? ax / al : vec2(0.0, 1.0);
    float fore = mix(0.62, 1.0, clamp(al / max(length(dv), 1e-4), 0.0, 1.0));
    mvPosition.xy += ax * position.y * aSize.x * fore + vec2(-ax.y, ax.x) * position.x * aSize.y;
  }
  gl_Position = projectionMatrix * mvPosition;`);
    };
    mat.customProgramCacheKey = () => 'bellows-skaters';
    const im = this.marks = new THREE.InstancedMesh(geo, mat, NS);
    for (let i = 0; i < NS; i++) im.setColorAt(i, this.strokes[i].c);
    im.instanceColor.setUsage(THREE.DynamicDrawUsage); im.count = 0;
    L.add(im);

    // ---------------------------------------------------------- the pond and its bank of snow: one mesh, one shader
    const iceTex = floorStrokes({ size: 512, base: col('#a9bad2', 0.2).getStyle(), n: 1500, seed: 1914, len: [26, 70], width: [5, 11], bend: 0.18, lift: 0.22,
      colors: [[col('#eef2f6', 0.12).getStyle(), 4], [col('#cfdcec', 0.15).getStyle(), 3], [col('#8ea4cc', 0.2).getStyle(), 3], [col('#a69ccc', 0.2).getStyle(), 1.5], [col('#86b4c0', 0.2).getStyle(), 1], [col('#ffffff', 0.05).getStyle(), 2], [col('#6f86bc', 0.2).getStyle(), 1]],
      angle: (x, y, r) => (r() - 0.5) * 0.35 });
    const snowTex = floorStrokes({ size: 256, base: col('#e6eaee', 0.15).getStyle(), n: 900, seed: 1882, len: [10, 24], width: [4, 8], bend: 0.3, lift: 0.3,
      colors: [[col('#f6f6f2', 0.1).getStyle(), 6], [col('#d6deea', 0.15).getStyle(), 3], [col('#8fa2d0', 0.2).getStyle(), 2], [col('#7486c0', 0.2).getStyle(), 1], [col('#d08a4c', 0.2).getStyle(), 0.5], [col('#efe2c4', 0.15).getStyle(), 1]],
      angle: (x, y, r) => -0.6 + (r() - 0.5) * 1.2 });
    const trail = this.trailData = new Uint8Array(TW * TH);
    this.trail = new THREE.DataTexture(trail, TW, TH, THREE.RedFormat, THREE.UnsignedByteType);
    this.trail.magFilter = this.trail.minFilter = THREE.LinearFilter; this.trail.needsUpdate = true;
    this.u = { uIce: { value: iceTex }, uSnow: { value: snowTex }, uTrail: { value: this.trail }, uR: { value: 0 }, uRMax: { value: 2.5 }, uBank: { value: 0 }, uY: { value: L.y },
      uC: { value: new THREE.Vector2(L.cx, L.cz) }, uT: { value: new THREE.Vector2(L.tx, L.tz) }, uN: { value: new THREE.Vector2(L.nx, L.nz) }, uO0: { value: -L.wall },
      uTB: { value: new THREE.Vector4(TB.u0, TB.o0, 1 / TB.w, 1 / TB.h) }, uBase: { value: col('#a3b5ce', 0.2) }, uShade: { value: col('#7484c0', 0.25) } };
    const pos = [], bank = [], idx = [];
    const rim = (a, f = 1) => { const c = Math.cos(a), s = Math.sin(a), e = 2 / POND.p, w = f * (1 + 0.035 * Math.sin(3 * a + 1) + 0.025 * Math.sin(5 * a)); return [POND.U * w * Math.sign(c) * Math.abs(c) ** e, POND.c + POND.O * w * Math.sign(s) * Math.abs(s) ** e]; };
    const P3 = new THREE.Vector3(), put = (u, out, h, b) => { L.floor(u, Math.max(out, -L.wall + 0.004), P3); pos.push(P3.x, L.y + h, P3.z); bank.push(b); return pos.length / 3 - 1; };
    const NR = 12, NA = 60;
    for (let j = 0; j <= NR; j++) for (let i = 0; i < NA; i++) { const [u, o] = rim((i / NA) * Math.PI * 2, j / NR); put(u, o, 0.01, 0); }
    for (let j = 0; j < NR; j++) for (let i = 0; i < NA; i++) { const a = j * NA + i, b = j * NA + (i + 1) % NA, c = (j + 1) * NA + (i + 1) % NA, d = (j + 1) * NA + i; idx.push(a, b, c, a, c, d); }
    // the bank: round the sides and the front, tapering away into the wall at the back
    const NBA = 84, NBX = 7, a0 = -0.68, a1 = Math.PI + 0.68, base0 = pos.length / 3, hts = [];
    for (let i = 0; i <= NBA; i++) {
      const a = a0 + (a1 - a0) * (i / NBA), taper = Math.min(1, (i / NBA) / 0.1, (1 - i / NBA) / 0.1);
      const H = 0.074 * (0.78 + 0.2 * Math.sin(7 * a) + 0.12 * Math.sin(13 * a + 2) + 0.08 * Math.sin(29 * a)) * taper;
      for (let j = 0; j <= NBX; j++) { const s = j / NBX, [u, o] = rim(a, 0.985 + 0.2 * s); const h = 0.01 + H * Math.pow(Math.sin(Math.PI * Math.min(1, s * 1.15)), 0.75); hts.push(h); put(u, o, h, 1); }
    }
    for (let i = 0; i < NBA; i++) for (let j = 0; j < NBX; j++) { const a = base0 + i * (NBX + 1) + j, b = a + NBX + 1; idx.push(a, b, b + 1, a, b + 1, a + 1); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    // (the bank's light and blue shade, worked out once from its slopes)
    const nrm = g.attributes.normal; for (let i = base0; i < pos.length / 3; i++) { const k = nrm.getX(i) * this.LW.x + nrm.getY(i) * this.LW.y + nrm.getZ(i) * this.LW.z; bank[i] = 1 + clamp01(0.15 + k * 0.95); }
    g.setAttribute('aBank', new THREE.Float32BufferAttribute(bank, 1));
    const im2 = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, fog: false });
    im2.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, this.u);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float aBank; varying float vBank; uniform float uBank, uY;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\n  vBank = aBank;\n  if (aBank > 0.5) transformed.y = uY + 0.01 + (transformed.y - uY - 0.01) * uBank;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
uniform sampler2D uIce, uSnow, uTrail; uniform float uR, uRMax, uO0, uBank; uniform vec2 uC, uT, uN; uniform vec4 uTB; uniform vec3 uBase, uShade; varying float vBank;`)
        .replace('#include <map_fragment>', `{
  vec2 rel = lifeP.xz - uC, loc = vec2(dot(rel, uT), dot(rel, uN)), tuv = loc / 0.66;
  if (vBank < 0.5) {
    // the ice: it spreads from under the frame, his strokes laid one by one as it comes, a rim of frost at its edge
    vec4 s = texture2D(uIce, tuv);
    float d = length(loc - vec2(0.0, uO0)), edge = uR + (texture2D(uIce, tuv * 0.31 + 0.27).a - 0.62) * 0.22;
    if (d > edge) discard;
    float k = clamp((edge - d) / 0.5, 0.0, 1.0), id = (s.a - 0.3) / 0.7;
    vec3 c = id < k * 1.15 ? s.rgb : uBase;
    c = mix(c, vec3(0.97, 0.99, 1.0), smoothstep(0.08, 0.0, edge - d) * step(uR, uRMax - 0.02));
    float tr = texture2D(uTrail, (loc - uTB.xy) * uTB.zw).r;
    c = mix(c, c * vec3(0.6, 0.68, 0.9), clamp(tr * 1.25, 0.0, 0.85));         // the blades' grooves, blue in the white
    c = mix(c, uShade, 0.22 * smoothstep(0.45, -0.1, loc.y));         // (bluer in the frame's shadow, by the wall)
    diffuseColor.rgb = c * 0.92;
  } else {
    if (uBank < 0.02 || length(loc - vec2(0.0, uO0)) > uR + 0.25) discard;
    vec3 s = texture2D(uSnow, tuv * 1.4).rgb; float sh = clamp(vBank - 1.0, 0.0, 1.0);
    diffuseColor.rgb = mix(s * uShade * 1.25, s * 1.04, sh);
  }
}`);
    };
    im2.customProgramCacheKey = () => 'bellows-pond';
    this.pond = L.add(new THREE.Mesh(g, im2)); this.pond.renderOrder = 1;

    this.band = this.makeScore(L);
    this.hiss = L.voice().loop({ hp: 2600, lp: 7500 });
    this.prepPlan(L);
    this.hideAll();
  },

  // ---------------------------------------------------------- the music: the waltz on a music box over an oom-pah-pah
  makeScore(L) {
    const s = score(L);
    // the ice forming: tinks and a creak
    for (let i = 0; i < 14; i++) { const t = 0.12 + i * 0.09 + L.rand() * 0.06; s.note(t, 2200 + L.rand() * 2400, 0.12 + L.rand() * 0.2, { type: 'sine', vol: 0.012 + L.rand() * 0.01, attack: 0.002 }); }
    s.hit(0.3, { d: 0.8, vol: 0.012, lp: 500, hp: 120 }); s.hit(0.95, { d: 0.5, vol: 0.008, lp: 420, hp: 100 });
    s.hit(0.05, { d: 1.4, vol: 0.006, hp: 4000 });
    const theme = (t0, vol) => {
      s.tune(THEME, t0, BPM, { type: 'triangle', vol: 0.028 * vol, legato: 0.92 });
      s.tune(THEME, t0, BPM, { type: 'sine', vol: 0.011 * vol, oct: 1, legato: 0.35 });
      CHORDS.forEach((c, b) => { const [r, x, y] = CH[c], t = t0 + b * BAR; s.note(t, hz(r), BT * 0.9, { type: 'sine', vol: 0.03 * vol, attack: 0.004 }); for (const k of [1, 2]) { s.note(t + k * BT, hz(x), BT * 0.5, { type: 'triangle', vol: 0.009 * vol, attack: 0.004 }); s.note(t + k * BT, hz(y), BT * 0.5, { type: 'triangle', vol: 0.008 * vol, attack: 0.004 }); } });
    };
    theme(T0, 1);
    // the skid: a hiss of ice, and a shimmer
    s.hit(T_STOP, { d: 0.45, vol: 0.03, hp: 2200, lp: 9000 });
    [88, 93, 97, 100].forEach((m, i) => s.note(T_STOP + 0.05 + i * 0.05, hz(m), 0.6, { type: 'sine', vol: 0.008, attack: 0.002 }));
    // and the waltz again, softer, while you keep looking
    const { notes } = parse(THEME), ev = [];
    for (const n of notes) if (n.m) ev.push({ t: n.t * BT, f: hz(n.m), d: n.d * BT * 0.9, type: 'triangle', vol: 0.016 }, { t: n.t * BT, f: hz(n.m + 12), d: n.d * BT * 0.35, type: 'sine', vol: 0.006 });
    CHORDS.forEach((c, b) => { const [r, x, y] = CH[c]; ev.push({ t: b * BAR, f: hz(r), d: BT * 0.9, type: 'sine', vol: 0.018 }); for (const k of [1, 2]) ev.push({ t: b * BAR + k * BT, f: hz(x), d: BT * 0.5, type: 'triangle', vol: 0.005 }, { t: b * BAR + k * BT, f: hz(y), d: BT * 0.5, type: 'triangle', vol: 0.005 }); });
    s.loop(T_END + BAR, 16 * BAR, ev);
    return s.done();
  },

  hideAll() {
    this.marks.count = 0; this.marks.visible = false; this.pond.visible = false;
    this.u.uR.value = 0; this.u.uBank.value = 0;
  },
  clearTrail() { this.trailData.fill(0); this.trail.needsUpdate = true; this.decayT = 0; },
  start(L, resumed) {
    if (!resumed) { this.hideAll(); this.clearTrail(); this.tOff = 0; for (const f of this.figs) { f.ax = f.ao = 0; f.prev = null; } this.cu = 0; this.co = 0; }
    else this.tOff = Math.max(T_END, this.tc || 0) - L.t;
    for (const sp of this.spray) sp.set = false;
    this.band.from(L.t + this.tOff);
    if (!this.told && !L.quiet) { this.told = true; L.k.say('The pond has frozen. Everyone has brought their skates.', 4); }
  },
  back(L) {
    this.from = this.figs.map(f => ({ u: f.P.u, out: f.P.out, yaw: f.P.yaw, vis: f.P.vis }));
    this.rFrom = this.u.uR.value;
  },
  end() { this.hideAll(); this.hiss.set(0); },
  reset() { this.hideAll(); this.told = false; this.tc = 0; this.hiss.set(0); },

  // ---------------------------------------------------------- every frame
  update(L, dt) {
    const ph = L.phase, showing = ph === 'wake' || ph === 'play', U = this.u;
    if (showing) this.tc = L.t + this.tOff;
    else if (ph === 'linger') this.tc += dt;
    const t = this.tc;
    this.pond.visible = true;
    // the toy, on the ice or not (it plays only while the look is over)
    const toy = L.k.G.vehicle, tl = toy && ph === 'linger' ? L.local(toy.pos.x, toy.pos.z) : null, onIce = tl && this.inPond(tl.u, tl.out, 0.92);
    if (ph === 'return') {
      const R = L.ret;
      U.uBank.value = 1 - ease.in(ramp(R, 0, 0.4));
      U.uR.value = this.rFrom * (1 - ease.inOut(ramp(R, 0.3, 1)));
      for (const f of this.figs) this.home(L, f, R);
    } else {
      U.uR.value = 2.5 * ease.out(ramp(t, 0.08, 1.55)); U.uBank.value = ease.outBack(ramp(t, 0.75, 1.6));
      // in the toy's time on the ice, the crowd circles round wherever the toy is
      const k = Math.min(1, dt * 1.2), wu = onIce ? Math.max(-0.4, Math.min(0.4, tl.u - RING.u)) : 0, wo = onIce ? Math.max(-0.3, Math.min(0.3, tl.out - RING.out)) : 0;
      this.cu += (wu - this.cu) * k; this.co += (wo - this.co) * k;
      for (const f of this.figs) this.place(L, f, t, dt, tl);
    }
    // the blades carve the ice (and the toy's wheels)
    if (dt > 0) {
      let dirty = false;
      for (const f of this.figs) { const p = f.P; if (!p.vis || p.kneel > 0.2 || p.out < 0 || !this.inPond(p.u, p.out, 1)) { f.prev = null; continue; } const lu = p.u + p.su * 0.018, lo = p.out + p.so * 0.018; if (f.prev) dirty = this.carve(f.prev[0], f.prev[1], lu, lo, f.sc < 1 ? 150 : 200) || dirty; f.prev = [lu, lo]; }
      if (onIce && Math.hypot(toy.vel.x, toy.vel.z) > 0.05) { const r = this.rightOf(toy.vel.x * L.tx + toy.vel.z * L.tz, toy.vel.x * L.nx + toy.vel.z * L.nz); for (const s of [-1, 1]) { const u = tl.u + r[0] * s * 0.09, o = tl.out + r[1] * s * 0.09, pv = this['toy' + s]; if (pv) dirty = this.carve(pv[0], pv[1], u, o, 255) || dirty; this['toy' + s] = [u, o]; } }
      else this['toy-1'] = this['toy1'] = null;
      this.decayT += dt;
      if (this.decayT > 0.5) { this.decayT = 0; const d = this.trailData; for (let i = 0; i < d.length; i++) if (d[i]) { d[i] = (d[i] * 0.985) | 0; } dirty = true; }
      if (dirty) this.trail.needsUpdate = true;
    }
    this.draw(L, t);
    if (showing) this.band.play(t);
    const cam = L.k.G.camera.position, near = Math.max(0, 1 - Math.hypot(cam.x - L.cx, cam.z - L.cz) / 10);
    let moving = 0; for (const f of this.figs) if (f.P.vis) moving += f.P.amp;
    this.hiss.set(ph === 'return' ? 0 : 0.0035 * Math.min(4, moving) * near * (0.75 + 0.25 * Math.sin(t * 6)));
    L.voice().place(L.cx + L.nx, L.cz + L.nz);
  },

  inPond(u, out, f) { const du = Math.abs(u) / (POND.U * f), dout = Math.abs(out - POND.c) / (POND.O * f); return du ** POND.p + dout ** POND.p < 1 && out > -this.L.wall; },
  rightOf(hu, ho) {           // the figure's right, in the stage's terms, for a heading (along, out)
    const L = this.L, Fx = L.tx * hu + L.nx * ho, Fz = L.tz * hu + L.nz * ho, l = Math.hypot(Fx, Fz) || 1, rx = -Fz / l, rz = Fx / l;
    return [rx * L.tx + rz * L.tz, rx * L.nx + rz * L.nz];
  },
  // A line cut into the ice, from one point to the next.
  carve(u0, o0, u1, o1, v) {
    const d = this.trailData, x0 = (u0 - TB.u0) / TB.w * TW, y0 = (o0 - TB.o0) / TB.h * TH, x1 = (u1 - TB.u0) / TB.w * TW, y1 = (o1 - TB.o0) / TB.h * TH;
    const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2); if (n < 1 || n > 80) return false;
    for (let i = 0; i <= n; i++) { const x = Math.round(x0 + (x1 - x0) * i / n), y = Math.round(y0 + (y1 - y0) * i / n); if (x < 0 || y < 0 || x >= TW || y >= TH) continue; const k = y * TW + x; if (d[k] < v) d[k] = v; }
    return true;
  },

  // ---------------------------------------------------------- the choreography: where each one is at show-time t
  prepPlan(L) {
    this.L = L; const W = -L.wall - 0.16; this.W = W; this.cu = this.co = 0;
    // the ring: each starts round it from where it came out of the wall
    for (const f of this.figs) if (f.ring) {
      const [ru, ro, w] = f.ring;
      // (each swoops to its own place round the ring, so they are spread all round it, and keeps it: one speed for all)
      if (f.role === 'ring') { f.ph0 = -Math.PI / 2 + f.ring[3] - w * 1.6; f.t0 = f.te; }
      else { f.ph0 = Math.atan2((KN.out - RING.out) / ro, (KN.u - RING.u) / ru) - w * 0.9; f.t0 = T_JOIN; }
    }
    // while the two spin, the crowd stops round the back of the pond to watch (in the order they come, so no one
    // crosses), and leaves the front open to you
    const ring = this.figs.filter(f => f.role === 'ring'), at = f => { const o = {}; this.ringAt(f, T_SPIN + 0.6, o); return Math.atan2((o.out - RING.out) / f.ring[1], (o.u - RING.u) / f.ring[0]); };
    ring.map(f => [f, (((at(f) - Math.PI / 2) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)]).sort((a, b) => a[1] - b[1]).forEach(([f], i) => { f.watch = -Math.PI + 0.5 + i * (Math.PI - 1.0) / (ring.length - 1); });
    // the spin: its angle at every moment, from how fast it goes (worked out once, so any moment can be posed)
    const dtA = 0.01, n = Math.ceil((T_IDLE - T_HOLD) / dtA) + 2, A = this.spinA = new Float32Array(n), Wv = this.spinW = new Float32Array(n);
    let a = 0;
    for (let i = 0; i < n; i++) {
      const t = T_HOLD + i * dtA;
      let w;
      if (t < T_SPIN) w = -0.9 * Math.sin(Math.PI * (t - T_HOLD) / (T_SPIN - T_HOLD));                         // the wind-up, the other way
      else if (t < T_PEAK) w = 1.4 + 9.8 * ease.in(ramp(t, T_SPIN, T_PEAK) * 0.85 + 0.15);
      else if (t < T_PEAK + 0.65) w = 11.2;
      else if (t < T_STOP) w = 11.2 - 8.4 * ease.inOut(ramp(t, T_PEAK + 0.65, T_STOP));
      else w = 2.8 * Math.max(0, 1 - (t - T_STOP) / 0.16);                                                          // the skid
      Wv[i] = w; A[i] = a; a += w * dtA;
    }
    // where they arrive from the wall, and the angle they start the spin from
    const o = {}; this.pairPath(this.figs.find(f => f.role === 'pairL'), T_FACE, o, 0); const lu = o.u, lo = o.out;
    this.pairPath(this.figs.find(f => f.role === 'pairC'), T_FACE, o, 1);
    this.A0 = Math.atan2(lo - o.out, lu - o.u);
    this.rl = 0.055; this.rc = 0.15;
  },
  spinAt(t) { const x = (Math.max(T_HOLD, Math.min(T_IDLE, t)) - T_HOLD) / 0.01, i = Math.min(this.spinA.length - 2, Math.floor(x)), k = x - i; return [this.spinA[i] + (this.spinA[i + 1] - this.spinA[i]) * k, this.spinW[i] + (this.spinW[i + 1] - this.spinW[i]) * k]; },
  // the two coming out from the wall: she glides out, the child ahead of her and to her right, pulling her by the hand
  pairPath(f, t, o, child) {
    const W = this.W, s = ease.inOut(ramp(t, 2.0, T_FACE)) + (child ? 0.12 : 0);
    const p0u = -0.1, p0o = W, p1u = -0.62, p1o = 0.62, p2u = SPIN.u - 0.02, p2o = SPIN.out + 0.02, a = 1 - s;
    o.u = a * a * p0u + 2 * a * s * p1u + s * s * p2u; o.out = a * a * p0o + 2 * a * s * p1o + s * s * p2o;
    if (child) { const hu = 2 * a * (p1u - p0u) + 2 * s * (p2u - p1u), ho = 2 * a * (p1o - p0o) + 2 * s * (p2o - p1o), l = Math.hypot(hu, ho) || 1, r = this.rightOf(hu / l, ho / l); o.u += r[0] * 0.06; o.out += r[1] * 0.06; }
  },
  ringAt(f, t, o) {
    const [ru, ro, w] = f.ring, th = f.ph0 + w * (t - f.t0) + 0.04 * Math.sin(t * 0.7 + f.seed);
    o.u = RING.u + this.cu + ru * Math.cos(th); o.out = RING.out + this.co + ro * Math.sin(th);
  },
  // Everything about one skater at t: o.u, o.out, o.vis, o.mode, and o.yaw when it is not simply the way they go.
  plan(L, f, t, o) {
    o.vis = t >= f.te; o.face = 0; o.mode = 'skate'; o.yaw = null; o.cheer = 0; o.kneel = 0; o.lift = 0; o.crouch = 0; o.spinW = 0; o.hold = 0; o.joy = 0;
    const W = this.W;
    if (f.role === 'ring') {
      this.ringAt(f, t, o);
      const k = ease.smooth(ramp(t, f.te + 0.15, f.te + 1.6)), so = W + Math.min(t - f.te, 1.6) * 0.5;
      o.u = lerp(f.ue, o.u, k); o.out = lerp(so, o.out, k);
      o.cheer = hump(t, T_STOP + 0.05, T_STOP + 1.4);
      const wg = ease.inOut(ramp(t, T_SPIN - 0.5, T_SPIN + 0.7)) * (1 - ease.inOut(ramp(t, T_IDLE + 0.4, T_IDLE + 1.8)));
      if (wg > 0) { const [ru, ro] = f.ring, wu = RING.u + this.cu + ru * 1.02 * Math.cos(f.watch), wo = RING.out + this.co + ro * 1.02 * Math.sin(f.watch); o.u = lerp(o.u, wu, wg); o.out = lerp(o.out, wo, wg); o.face = ease.smooth(ramp(wg, 0.55, 0.95)); }
    } else if (f.role === 'kneel') {
      if (t >= T_JOIN) { this.ringAt(f, t, o); const k = ease.smooth(ramp(t, T_JOIN, T_JOIN + 1.1)); o.u = lerp(KN.u, o.u, k); o.out = lerp(KN.out, o.out, k); }
      else {
        const s = ease.inOut(ramp(t, f.te, f.te + 1.15)), a = 1 - s, p1u = KN.u - 0.55, p1o = KN.out - 0.1;
        o.u = a * a * f.ue + 2 * a * s * p1u + s * s * KN.u; o.out = a * a * W + 2 * a * s * p1o + s * s * KN.out;
        if (s >= 1) { o.yaw = L.yawOf(1, 0); o.mode = 'kneel'; }
        o.kneel = ease.smooth(ramp(t, f.te + 1.2, f.te + 1.6)) * (1 - ease.smooth(ramp(t, T_RISE, T_RISE + 0.4)));
      }
    } else {
      const child = f.role === 'pairC', sign = child ? -1 : 1;
      const spinPos = (A, r) => { o.u = SPIN.u + this.cu * 0.6 + sign * r * Math.cos(A); o.out = SPIN.out + this.co * 0.6 + sign * r * Math.sin(A); };
      const face = A => L.yawOf(-sign * Math.cos(A), -sign * Math.sin(A));
      if (t < T_FACE) { this.pairPath(f, t, o, child); o.mode = 'hold'; o.hold = 1; }
      else if (t < T_IDLE) {
        const [A, w] = this.spinAt(t), lift = child ? ease.smooth(ramp(w, 7.5, 11)) : 0, r = child ? this.rc + 0.06 * lift : this.rl;
        spinPos(this.A0 + A, r);
        if (t < T_HOLD) { const pu = o.u, po = o.out; this.pairPath(f, T_FACE, this.o2, child); const k = ease.inOut(ramp(t, T_FACE, T_HOLD)); o.u = lerp(this.o2.u, pu, k); o.out = lerp(this.o2.out, po, k); }
        o.mode = 'spin'; o.yaw = face(this.A0 + A); o.spinW = w; o.lift = lift; o.crouch = child ? 0.1 : 0.3 + 0.15 * ramp(w, 2, 10);
        o.joy = ease.smooth(ramp(t, T_STOP, T_STOP + 0.2)) * (1 - ease.smooth(ramp(t, T_IDLE - 0.15, T_IDLE + 0.3)));
      } else {
        // hand in hand round the middle, the child a little ahead, pulling
        const [Ae] = this.spinAt(T_IDLE), A1 = this.A0 + Ae, th = A1 + 0.95 * (t - T_IDLE) + (child ? 0.42 : 0), r = child ? 0.31 : 0.27;
        const ou = SPIN.u + this.cu * 0.6 + r * Math.cos(th), oo = SPIN.out + this.co * 0.6 + r * Math.sin(th);
        spinPos(A1, child ? this.rc : this.rl);
        const k = ease.inOut(ramp(t, T_IDLE, T_IDLE + 1.1)); o.u = lerp(o.u, ou, k); o.out = lerp(o.out, oo, k);
        o.mode = 'hold'; o.hold = k;
        if (k < 1) { const fy = face(A1), vy = L.yawOf(-Math.sin(th), Math.cos(th)); o.yaw = turnTo(fy, vy, ease.smooth(ramp(k, 0.1, 0.7))); }
      }
    }
  },

  // ---------------------------------------------------------- the pose from the plan
  place(L, f, t, dt, tl) {
    const o = this.o, P = f.P;
    this.plan(L, f, t - 0.05, o); const pu = o.u, po = o.out;
    this.plan(L, f, t, o);
    let du = o.u - pu, dout = o.out - po; const sp = Math.hypot(du, dout) / 0.05;
    // out of the toy's way, softly (they never stop it)
    if (tl) { const eu = o.u + f.ax - tl.u, eo = o.out + f.ao - tl.out, d = Math.hypot(eu, eo), R = 0.3; const k = Math.min(1, dt * 6); if (d < R && d > 1e-4) { f.ax += (eu / d * (R - d) * 1.2) * k; f.ao += (eo / d * (R - d) * 1.2) * k; } }
    f.ax *= Math.exp(-dt * 1.5); f.ao *= Math.exp(-dt * 1.5);
    stand(P, o.u + f.ax, o.out + f.ao);
    P.vis = o.vis;
    if (sp > 0.03) P.yaw = L.yawOf(du, dout); else if (P.yaw == null) P.yaw = L.yawOut;
    if (o.yaw != null) P.yaw = o.yaw;
    if (o.face > 0) P.yaw = turnTo(P.yaw, L.yawOf(SPIN.u + this.cu * 0.6 - o.u, SPIN.out + this.co * 0.6 - o.out), o.face);
    const l = Math.hypot(du, dout) || 1, r = this.rightOf(du / l, dout / l);
    const amp = o.mode === 'spin' || o.mode === 'kneel' ? 0 : clamp01(sp / 0.45), str = t * 2 * Math.PI * 0.95 + f.seed;
    P.amp = amp * (o.vis ? 1 : 0);
    skate(P, str, amp, f.arms);
    P.su = r[0] * Math.sin(str) * amp; P.so = r[1] * Math.sin(str) * amp;           // (the blade swings side to side: the tracks curl)
    if (o.mode === 'hold') holdHands(P, f.role === 'pairC', o.hold);
    if (o.mode === 'spin') {
      const child = f.role === 'pairC', w = o.spinW, k = clamp01(Math.abs(w) / 11);
      for (const a of P.arms) { a[0] = -1.3; a[2] = 0.12; } P.arms[0][1] = 0.16; P.arms[1][1] = -0.16;
      crouch(P, o.crouch);
      // (the child swung off her feet: her body out along the pull, her feet flying, her arms still to the hands)
      if (child) { P.lean = -0.18 * (1 - o.lift) - 0.1 * k; P.pitch = 1.1 * o.lift; P.hover = o.lift; P.legs[0][0] = 0.25 * o.lift; P.legs[1][0] = 0.5 * o.lift; P.legs[1][2] = 0.4 * o.lift; P.arms[0][0] = P.arms[1][0] = -1.3 - P.pitch - P.lean; }
      else { P.lean = -0.12 - 0.12 * k; }
      P.flare = 0.9 * k;
      if (o.joy > 0) {
        const j = o.joy;
        if (child) { P.arms[0][0] = lerp(-1.3, -2.7, j); P.arms[1][0] = lerp(-1.3, -2.7, j); P.arms[0][1] = -0.35 * j; P.arms[1][1] = 0.35 * j; P.dy += 0.03 * hump(t, T_STOP + 0.1, T_STOP + 0.45); }
        else { P.arms[0][0] = lerp(-1.3, -0.5, j); P.arms[1][0] = lerp(-1.3, -0.5, j); P.arms[0][1] = lerp(0.16, -1.05, j); P.arms[1][1] = lerp(-0.16, 1.05, j); P.lean = lerp(P.lean, 0.08, j); }
      }
    }
    if (o.kneel > 0) kneel(P, o.kneel, t);
    if (o.cheer > 0) { const c = o.cheer; P.arms[0][0] = lerp(P.arms[0][0], -2.75, c); P.arms[0][1] = lerp(P.arms[0][1], -0.3 + 0.25 * Math.sin(t * 13), c); P.arms[0][2] = lerp(P.arms[0][2], 0.25, c); }
  },
  // Back into the wall, under the frame.
  home(L, f, R) {
    const fr = this.from && this.from[f.who], P = f.P; if (!fr || !fr.vis) { P.vis = false; return; }
    const tu = Math.max(-0.38, Math.min(0.38, fr.u)) * 0.6, to = this.W, s = ease.inOut(clamp01((R - 0.04 * (f.who % 4)) / 0.8));
    stand(P, lerp(fr.u, tu, s), lerp(fr.out, to, s));
    P.yaw = turnTo(fr.yaw, L.yawOf(tu - fr.u, to - fr.out), ease.smooth(ramp(s, 0, 0.25)));
    skate(P, R * 14 + f.seed, 1, f.arms); P.amp = 1; P.su = P.so = 0;
    P.vis = P.out > this.W + 0.03;
  },

  // ---------------------------------------------------------- bones, then the strokes on them
  draw(L, t) {
    const B = this.B, S = this.strokes, aP = this.aPos.array, aD = this.aDir.array, aS = this.aSide.array, aK = this.aKind.array, aZ = this.aSize.array, V = this.V, N = this.N, col = this.marks.instanceColor, C = this.C, LW = this.LW, blue = this.blue;
    const P0 = this.T;
    for (const f of this.figs) {
      const P = f.P, Mx = f.mats; if (!P.vis) continue;
      L.floor(P.u, P.out, P0);
      // the legs first, from the pelvis, to find how high it must stand for the lowest blade (or knee) to touch the ice
      const legs = root => {
        for (const [s, th, sh] of [[0, THR, SHR], [1, THL, SHL]]) {
          const g = P.legs[s]; B.child(Mx[th], root, s ? 0.022 : -0.022, 0, 0, 0, g[0], g[1]); B.child(Mx[sh], Mx[th], 0, -THIGH, 0, 0, g[2], 0);
        }
      };
      B.set(this.R, 0, 0, 0, 0, P.pitch, P.roll); legs(this.R);
      let low = Infinity;
      for (const sh of [SHR, SHL]) { V.set(0, -SHIN - BOOT, 0).applyMatrix4(Mx[sh]); low = Math.min(low, V.y); V.set(0, -0.006, 0).applyMatrix4(Mx[sh]); low = Math.min(low, V.y); }
      // (swung off her feet, the child flies at the height of the hands holding her)
      const py = L.y + 0.009 + (P.dy - low) * f.sc;
      B.set(Mx[PEL], P0.x, P.hover > 0 ? lerp(py, L.y + 0.24, P.hover) : py, P0.z, P.yaw, P.pitch, P.roll, f.sc);
      legs(Mx[PEL]);
      B.child(Mx[TOR], Mx[PEL], 0, 0.012, 0, P.twist, P.lean, P.tilt);
      B.child(Mx[HEAD], Mx[TOR], 0, TORSO, 0.004, 0, P.head, 0);
      for (const [s, ua, fa] of [[0, UAR, FAR], [1, UAL, FAL]]) { const a = P.arms[s]; B.child(Mx[ua], Mx[TOR], s ? 0.044 : -0.044, TORSO - 0.016, 0, 0, a[0], a[1]); B.child(Mx[fa], Mx[ua], 0, -UARM, 0, 0, -a[2], 0); }
    }
    let n = 0;
    const tSpray = t - T_STOP, ph = this.L.phase, spraying = (ph === 'wake' || ph === 'play' || ph === 'linger') && tSpray > 0 && tSpray < 1.6;
    for (let i = 0; i < S.length; i++) {
      const s = S[i];
      if (s.spray) {
        if (!spraying) continue;
        const sp = this.spray[i - this.spray[0].i], f = this.figs.find(q => q.role === (sp.from ? 'pairC' : 'pairL')); if (!f.P.vis) continue;
        const tt = tSpray, life = clamp01(1 - (tt - sp.life * 0.7) / (sp.life * 0.3)); if (life <= 0) continue;
        // thrown out sideways from the blades, the way they were turning, and settling on the ice
        if (!sp.p) sp.p = new THREE.Vector3();
        if (tt < 0.05 || !sp.set) { L.floor(f.P.u, f.P.out, sp.p); const ang = f.P.yaw + Math.PI / 2 + sp.a; sp.vx = Math.sin(ang) * sp.sp; sp.vz = Math.cos(ang) * sp.sp; sp.set = true; }
        const fl = Math.min(tt, sp.up / 4.9), y = Math.max(0, sp.up * fl - 4.9 * fl * fl) * 0.35;
        V.set(sp.p.x + sp.vx * fl * 0.55, L.y + 0.02 + y, sp.p.z + sp.vz * fl * 0.55);
        aP[n * 3] = V.x; aP[n * 3 + 1] = V.y; aP[n * 3 + 2] = V.z; aD[n * 3] = sp.vx; aD[n * 3 + 1] = 0.3; aD[n * 3 + 2] = sp.vz;
        aS[n * 3] = aS[n * 3 + 1] = aS[n * 3 + 2] = 0; aK[n * 2] = 0; aK[n * 2 + 1] = s.slot;
        aZ[n * 2] = s.len * life; aZ[n * 2 + 1] = s.wid * life; col.setXYZ(n, s.c.r * 1.1, s.c.g * 1.1, s.c.b * 1.1); n++; continue;
      }
      const f = this.figs[s.who], P = f.P; if (!P.vis) continue;
      if (s.shadow) {
        // a slash of blue shadow on the ice, from the feet
        const L0 = this.T; L.floor(P.u, P.out, L0); const lift = clamp01(1 - P.dy * 8), len = s.len * f.sc * (1 + 0.4 * P.kneel);
        aP[n * 3] = L0.x + this.SH.x * len * 0.45; aP[n * 3 + 1] = L.y + 0.016; aP[n * 3 + 2] = L0.z + this.SH.z * len * 0.45;
        aD[n * 3] = this.SH.x; aD[n * 3 + 1] = 0; aD[n * 3 + 2] = this.SH.z; aS[n * 3] = this.SHs.x; aS[n * 3 + 1] = 0; aS[n * 3 + 2] = this.SHs.z;
        aK[n * 2] = 1; aK[n * 2 + 1] = 0; aZ[n * 2] = len; aZ[n * 2 + 1] = s.wid * f.sc * lift;
        col.setXYZ(n, s.c.r, s.c.g, s.c.b); n++; continue;
      }
      const Mx = f.mats[s.bone];
      V.copy(s.p); N.copy(s.d);
      if (s.skirt && P.flare) { const fl = P.flare, rr = Math.hypot(V.x, V.z) || 1; V.x += (V.x / rr) * fl * 0.03; V.z += (V.z / rr) * fl * 0.03; V.y += fl * 0.025; N.x += (V.x / rr) * fl * 0.9; N.z += (V.z / rr) * fl * 0.9; }
      V.applyMatrix4(Mx); N.transformDirection(Mx);
      aP[n * 3] = V.x; aP[n * 3 + 1] = V.y; aP[n * 3 + 2] = V.z; aD[n * 3] = N.x; aD[n * 3 + 1] = N.y; aD[n * 3 + 2] = N.z;
      aS[n * 3] = aS[n * 3 + 1] = aS[n * 3 + 2] = 0; aK[n * 2] = 0; aK[n * 2 + 1] = s.slot;
      aZ[n * 2] = s.len * f.sc; aZ[n * 2 + 1] = s.wid * f.sc;
      // lit from the front and above; the side away from it goes blue, as his shadows do
      N.copy(s.n).transformDirection(Mx);
      const k = 0.6 + 0.55 * Math.max(0, N.x * LW.x + N.y * LW.y + N.z * LW.z) + 0.1 * Math.max(0, N.y), sh = Math.max(0, 1 - k) * 0.55;
      col.setXYZ(n, s.c.r * k * 1.12 + blue.r * sh, s.c.g * k * 1.12 + blue.g * sh, s.c.b * k * 1.12 + blue.b * sh);
      n++;
    }
    this.marks.count = n; this.marks.visible = n > 0;
    if (n) { this.aPos.needsUpdate = true; this.aDir.needsUpdate = true; this.aSide.needsUpdate = true; this.aKind.needsUpdate = true; this.aSize.needsUpdate = true; col.needsUpdate = true; }
  },
});

// ------------------------------------------------------------------ poses
// arms: [pitch (forward, negative), roll (out to the side), elbow]; legs: [pitch (forward, negative), roll (+x: the figure's left), knee]
function newPose() { return { u: 0, out: 0, yaw: null, dy: 0, pitch: 0, roll: 0, lean: 0, tilt: 0, twist: 0, head: 0, flare: 0, kneel: 0, amp: 0, su: 0, so: 0, vis: false, legs: [[0, 0, 0], [0, 0, 0]], arms: [[0, 0, 0], [0, 0, 0]] }; }
function stand(P, u, out) {
  P.u = u; P.out = out; P.dy = 0; P.hover = 0; P.pitch = 0; P.roll = 0; P.lean = 0; P.tilt = 0; P.twist = 0; P.head = 0; P.flare = 0; P.kneel = 0;
  P.legs[0][0] = 0; P.legs[0][1] = -0.05; P.legs[0][2] = 0.1; P.legs[1][0] = 0; P.legs[1][1] = 0.05; P.legs[1][2] = 0.1;
  P.arms[0][0] = -0.1; P.arms[0][1] = -0.15; P.arms[0][2] = 0.3; P.arms[1][0] = -0.1; P.arms[1][1] = 0.15; P.arms[1][2] = 0.3;
}
// The skater's stroke: one leg pushes out to the side and back while the other glides, knee bent, and the body leans
// forward and rocks over the gliding leg. amp 0..1 (how fast they go). Arms behind the back, in a muff, or swinging.
function skate(P, ph, amp, arms) {
  const s = Math.sin(ph), R = Math.max(0, s) * amp, Lf = Math.max(0, -s) * amp;
  P.lean = 0.06 + 0.3 * amp; P.roll = 0.09 * s * amp; P.twist = 0.08 * s * amp; P.head = -0.15 * amp;
  P.legs[0][0] = 0.3 * R - 0.18 * Lf; P.legs[0][1] = -0.05 - 0.5 * R; P.legs[0][2] = 0.12 + 0.05 * R + 0.5 * Lf;
  P.legs[1][0] = 0.3 * Lf - 0.18 * R; P.legs[1][1] = 0.05 + 0.5 * Lf; P.legs[1][2] = 0.12 + 0.05 * Lf + 0.5 * R;
  if (arms === 'back') { for (const [i, sg] of [[0, -1], [1, 1]]) { P.arms[i][0] = 0.5; P.arms[i][1] = sg * 0.12; P.arms[i][2] = 1.5; } }
  else if (arms === 'muff') { for (const [i, sg] of [[0, 1], [1, -1]]) { P.arms[i][0] = -0.4; P.arms[i][1] = sg * 0.3; P.arms[i][2] = 1.35; } }
  else { P.arms[0][0] = -0.55 * s * amp - 0.1; P.arms[1][0] = 0.55 * s * amp - 0.1; P.arms[0][1] = -0.35; P.arms[1][1] = 0.35; P.arms[0][2] = P.arms[1][2] = 0.45; }
}
// Hand in hand: she reaches her right hand forward to the child; the child, ahead and to her right, reaches back.
function holdHands(P, child, k) {
  if (child) { P.arms[1][0] = lerp(P.arms[1][0], 0.85, k); P.arms[1][1] = lerp(P.arms[1][1], 0.35, k); P.arms[1][2] = lerp(P.arms[1][2], 0.1, k); P.twist += 0.25 * k; P.head = lerp(P.head, 0.1, k); }
  else { P.arms[0][0] = lerp(P.arms[0][0], -0.75, k); P.arms[0][1] = lerp(P.arms[0][1], -0.5, k); P.arms[0][2] = lerp(P.arms[0][2], 0.15, k); P.lean = lerp(P.lean, -0.04, k * 0.6); }
}
function crouch(P, c) { for (const g of P.legs) { g[0] -= 0.4 * c; g[2] += 0.8 * c; } }
// Down on one knee on the ice, doing up a skate: bent over the front boot, the hands tugging at the laces.
function kneel(P, k, t) {
  const tug = Math.sin(t * 9) * 0.5 + 0.5;
  P.legs[0][0] = lerp(P.legs[0][0], -1.45, k); P.legs[0][1] = lerp(P.legs[0][1], -0.08, k); P.legs[0][2] = lerp(P.legs[0][2], 1.45, k);
  P.legs[1][0] = lerp(P.legs[1][0], 0.0, k); P.legs[1][1] = lerp(P.legs[1][1], 0.06, k); P.legs[1][2] = lerp(P.legs[1][2], 1.6, k);
  P.lean = lerp(P.lean, 0.95, k); P.head = lerp(P.head, 0.35, k); P.roll = lerp(P.roll, 0, k); P.twist = lerp(P.twist, -0.15, k);
  for (const [i, sg] of [[0, 1], [1, -1]]) { P.arms[i][0] = lerp(P.arms[i][0], -1.0 - 0.12 * tug, k); P.arms[i][1] = lerp(P.arms[i][1], sg * 0.22, k); P.arms[i][2] = lerp(P.arms[i][2], 0.45 + 0.2 * tug, k); }
  P.kneel = k;
}
