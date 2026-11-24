// Jacques Louis David, Madame de Pastoret and Her Son (1791–92), Gallery 218. The word: thread.
//
// She sits by the cradle in a white dress, sewing: the work, a long strip of white, hangs from her left hand, and her
// right is lifted with finger and thumb pinched, at the top of a stitch, drawing the thread through. But there is no
// thread, and no needle. The Revolution parted the painter and his sitter before the picture was done, and the museum's
// note says of it: "He did not even get far enough to place a needle and thread in Madame de Pastoret's hand." Her
// fingers have been closed on nothing ever since. So what comes out of this picture is the one thing it was never
// given.
//
// Look at it and the work slides out from the foot of the wall under the picture, below the hand that holds it: a
// strip of white muslin that runs out over the floor in a slow curve and lies there in soft folds, in a little of
// her room's daylight. Then, under the frame below the lifted hand, a needle noses out and hangs on its thread (the
// thread is the grey-blue of her sash, the one cool colour he gave her), ticks against the wall, is let down, swings
// out over the work and sews: five running stitches along the edge nearest the wall, long, long, short-short, long,
// each going in on a note, a tuck of the cloth riding up on the needle, the thread following through and lying in
// dashes behind it. On the fifth it stays in, pinned through the cloth, as a needle is left in the work. A beat.
// Then the thread is drawn from the picture's side, as her hand is drawing it: it comes taut up to the foot of the
// frame under her fingers, and at each tug the stitched edge runs up along it, the far end coming round, flute after
// flute of muslin standing, until the strip is a gathered frill, curled like a fan, as the frill of the pillow in the
// cradle goes round its corner. After that the taut thread only rocks it a little, slowly, and is still: a thread
// from the frill on the floor to the foot of the frame under her hand, where the picture has none. When you stop
// looking the thread goes slack, the needle is drawn back out through its stitches and up to her hand, and the work
// slides home.
//
// The tune is what the stitches go in on: "Dodo, l'enfant do", the old French lullaby (the air is older than the
// picture; the words are in Weckerlin's collections of 1855 and 1870), its four bars once through, hummed on a sine at
// a cradle's pace, quietly, because a child is asleep in the picture. The five stitches are "Do, do, l'enfant do";
// the eight quick notes of "l'enfant dormira bien vite" are the gathering; the second half is the rocking. (Set down
// from the score on the French Wikipedia page for the song; here a fourth higher, in F.)
//
// How it is made: three draw calls. The muslin is one mesh of about thirteen hundred points, moved along its way,
// tucked over the needle, gathered and curled on the processor, and painted as he painted her whites (ivory lights,
// cool grey half tones, shadows thin and warm, stippled where his ground would show through; an open weave when you
// are near). The thread, the needle and its glint are one mesh (the thread a ribbon that faces you; under the cloth it
// is hidden by the cloth itself, which is why it shows as stitches). The shadows, and the little daylight, are one
// flat mesh on the floor. His scrubbed ground stays in the picture: laid on a floor seen from so low it read as a
// rug. Everything is below the frame (nothing above 0.84 m, and that at the wall) and under this picture and the
// near end of the next (never under the Deposition on the left), so from the look camera and the checks' others the
// guard has nothing to cut. Nothing is solid, nothing stays out after the look. With "Reduce motion and flashing"
// on, the needle swings less and does not tick, its glint comes and goes slowly, the thread does not quiver when it
// comes taut, the tugs and the rocking are smaller and softer, and it is all quieter.
//
// What it does not do: nobody comes out of the picture and nothing is made of them (no figure, no hand to hold the
// needle or pull the thread: the pull comes from the wall), and the cradle with the sleeping child in it stays where
// he painted it and does not rock, because he is a child asleep and she is a mother at home, and that is theirs.
import * as THREE from 'three';
import { lifeFor, ease, ramp, clamp01, lerp } from '../paintlife.js';
import { score, noise } from './stagecraft.js';
import { hz } from './tunes.js';

const TAU = Math.PI * 2;
// Everything below is in the scene's own metres: x along the wall from the picture's middle (to the right), y up
// from the floor, z out from the canvas plane.
const HAND = { x: -0.26, y: 0.835 };                  // under her lifted fingers: where the thread comes from
const SLOT = { x: -0.17 };                            // under the hand that holds the work: where the work comes out, at the wall's foot
const IN = 0.45;                                      // how much of its way is inside the wall
const LC = 1.05, WC = 0.3, FLOOR = 0.009;            // the strip of muslin: its length, its width; how high it lies
const NX = 144, NY = 8;                               // its grid: along, across
const VS = WC / 2 - 0.04;                             // the stitch line: this far from the middle, towards the wall
const LN = 0.26;                                      // the needle, eye to point
// The stitches, in metres along the strip: where the needle goes in, and where it comes up again.
const PIN = [0.1, 0.33, 0.56, 0.675, 0.79], POUT = [0.2, 0.43, 0.612, 0.727, 0.885];
const XK = PIN[0], XE = POUT[4], TIP_STOP = XE + 0.075;
const K_ST = 0.5, K_FREE = 0.44;                      // gathered: how much shorter the stitched edge, and the free one
const CURL = 1 / 0.31;                                // and it curls round, the stitching inside: one over the radius
const NF = 6, PH = 0.9;                               // flutes at the free edge (and twice as many small pleats along the stitching)
// The story, in show seconds.
const BPM = 90, BEAT = 60 / BPM, T0 = 2.5, bt = b => T0 + b * BEAT;      // the lullaby: its first note is the first stitch
const T_C = [0.05, 1.5];                                // the work comes out and slides to its place
const TN0 = 0.85, TN1 = 1.2, TN3 = 1.8;                 // the needle: noses out; hangs and is let down; swings out
const T_ST = [bt(0), bt(1), bt(2), bt(2.5), bt(3)];     // the five stitches
const T_PIN = T_ST[4] + 0.36;                           // it stays in
const T_TAUT = bt(4);                                   // the thread comes taut; then seven tugs, one to a note
const TUG = [0.12, 0.13, 0.14, 0.14, 0.14, 0.2, 0.13];
const T_ROCK = [bt(8), bt(15)];
// Dodo, l'enfant do, in F: [beat, note, beats].
const TUNE = [[0, 'A4', 1], [1, 'F4', 1], [2, 'A4', 0.5], [2.5, 'A4', 0.5], [3, 'F4', 1],
  [4, 'G4', 0.5], [4.5, 'A4', 0.5], [5, 'Bb4', 0.5], [5.5, 'A4', 0.5], [6, 'G4', 0.5], [6.5, 'C5', 0.5], [7, 'A4', 0.5], [7.5, 'F4', 0.5],
  [8, 'A4', 1], [9, 'F4', 1], [10, 'A4', 0.5], [10.5, 'A4', 0.5], [11, 'F4', 1],
  [12, 'G4', 0.5], [12.5, 'A4', 0.5], [13, 'Bb4', 0.5], [13.5, 'A4', 0.5], [14, 'G4', 0.5], [14.5, 'C5', 0.5], [15, 'F4', 2]];
const BASS = [[0, 'F3', 2], [2, 'F3', 2], [4, 'C3', 3], [7, 'F3', 1], [8, 'F3', 2], [10, 'F3', 2], [12, 'C3', 3], [15, 'F3', 3]];
const NT1 = 44, NT2 = 84, NT = NT1 + NT2;               // the thread: points in the air, points along the stitching
// Soft folds in the muslin as it lies: [where along it, how it slants across, how wide, how high, how it varies across].
const FOLDS = [[0.2, 0.55, 0.034, 0.012, 12], [0.47, -0.85, 0.045, 0.017, 8], [0.74, 0.7, 0.04, 0.014, 10], [0.95, -0.4, 0.028, 0.009, 13]];
const smooth = (a, b, x) => { const q = clamp01((x - a) / (b - a)); return q * q * (3 - 2 * q); };

const NOISE_GLSL = /* glsl */`
float gH(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float gN(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(gH(i), gH(i + vec2(1.0, 0.0)), f.x), mix(gH(i + vec2(0.0, 1.0)), gH(i + vec2(1.0, 1.0)), f.x), f.y); }
`;
const PREMULT = { transparent: true, depthWrite: false, fog: false, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor };

lifeFor(27307, {
  title: /^Madame de Pastoret/,
  word: 'thread',
  // (the whole of the picture in view, and the floor under it out to the work; it cannot stand nearer and keep both)
  stage: { out: 1.15, half: 1.2, cam: { dist: 2.85, side: 0.14, height: 0.95, fov: 57, lookU: 0.08, lookOut: 0.4, lookH: 0.93 } },
  wake: 2, ret: 2.6,

  build(L) {
    const P = L.pal, col = (h, a = 0.1) => P.near(h, a), v3 = (h, a) => { const c = col(h, a); return new THREE.Vector3(c.r, c.g, c.b); };
    const W0 = this.W0 = -L.wall;                                        // the wall's face
    const V = () => new THREE.Vector3();
    this.p = V(); this.t = V(); this.b = V(); this.n = V(); this.w = V(); this.w2 = V(); this.q = V(); this.q2 = V(); this.e = V(); this.d = V(); this.c = V(); this.kp = V(); this.K0 = V();
    this.A = new THREE.Vector3(HAND.x, HAND.y, W0 + 0.012);
    // his light: from high on the left and a little from the front
    const ls = new THREE.Vector3(-0.55, 0.72, 0.42).normalize();
    const light = new THREE.Vector3(L.tx * ls.x + L.nx * ls.z, ls.y, L.tz * ls.x + L.nz * ls.z);
    const wall = new THREE.Vector4(L.nx, L.nz, L.cx * L.nx + L.cz * L.nz + W0 + 0.002, 0);      // (what is behind the wall's face is not drawn)

    // ---------------------------------------------------------- the work's way: out of the foot of the wall and over the floor
    {
      const S = SLOT, F = FLOOR, pts = [[S.x, F, W0 - IN], [S.x, F, W0 - 0.2], [S.x, F, W0 + 0.06], [S.x - 0.012, F, W0 + 0.2], [-0.165, F, 0.31], [-0.1, F, 0.45], [0.02, F, 0.555], [0.2, F, 0.63], [0.42, F, 0.665], [0.66, F, 0.635], [0.87, F, 0.54]].map(a => new THREE.Vector3(...a));
      const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal'), M = 1800, raw = [], len = [0];
      for (let i = 0; i <= M; i++) { raw.push(curve.getPoint(i / M)); if (i) len.push(len[i - 1] + raw[i].distanceTo(raw[i - 1])); }
      const DS = this.DS = 0.01, total = len[M], n = this.rn = Math.floor(total / DS), rp = this.rp = new Float32Array((n + 1) * 3), rb = this.rb = new Float32Array((n + 1) * 3);
      let j = 0; const q = V();
      for (let i = 0; i <= n; i++) { const s = i * DS; while (j < M - 1 && len[j + 1] < s) j++; q.lerpVectors(raw[j], raw[j + 1], clamp01((s - len[j]) / Math.max(1e-6, len[j + 1] - len[j]))); rp[i * 3] = q.x; rp[i * 3 + 1] = q.y; rp[i * 3 + 2] = q.z; }
      // its width, carried along the way without twisting (in the wall it lies along the wall)
      const B = new THREE.Vector3(1, 0, 0), T = V();
      for (let i = 0; i <= n; i++) {
        const a = Math.max(0, i - 1), b = Math.min(n, i + 1); T.set(rp[b * 3] - rp[a * 3], rp[b * 3 + 1] - rp[a * 3 + 1], rp[b * 3 + 2] - rp[a * 3 + 2]).normalize();
        B.addScaledVector(T, -B.dot(T)).normalize(); rb[i * 3] = B.x; rb[i * 3 + 1] = B.y; rb[i * 3 + 2] = B.z;
      }
      this.Send = n * DS; this.sRest = this.Send - LC; this.Dc = this.Send - (IN - 0.04);
    }

    // ---------------------------------------------------------- the muslin
    {
      const nv = (NX + 1) * (NY + 1), pos = this.CP = new Float32Array(nv * 3), uv = new Float32Array(nv * 2), ao = this.CO = new Float32Array(nv), idx = [];
      for (let i = 0; i <= NX; i++) for (let j = 0; j <= NY; j++) { const k = i * (NY + 1) + j; uv[k * 2] = i / NX; uv[k * 2 + 1] = j / NY; }
      for (let i = 0; i < NX; i++) for (let j = 0; j < NY; j++) { const a = i * (NY + 1) + j, b = (i + 1) * (NY + 1) + j; idx.push(a, b, b + 1, a, b + 1, a + 1); }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
      g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(nv * 3), 3).setUsage(THREE.DynamicDrawUsage));
      g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setAttribute('aO', new THREE.BufferAttribute(ao, 1).setUsage(THREE.DynamicDrawUsage)); g.setIndex(idx);
      // (for the cloth his light is lowered, so that it rakes across what lies on the floor and the folds show)
      const lr = new THREE.Vector3(-0.72, 0.5, 0.36).normalize(), rake = new THREE.Vector3(L.tx * lr.x + L.nx * lr.z, lr.y, L.tz * lr.x + L.nz * lr.z);
      const u = this.cu = { uRake: { value: rake }, uWall: { value: wall }, uLt: { value: v3('#cbc8b4') }, uHalf: { value: v3('#96938a') }, uSh: { value: v3('#6c6357') }, uGr: { value: v3('#85765f') }, uLen: { value: new THREE.Vector2(LC, WC) },
        uNd: { value: new THREE.Vector4(0, 0, 0, 0) }, uNdK: { value: 0 } };
      const m = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, fog: false, alphaToCoverage: true });
      m.onBeforeCompile = sh => {
        Object.assign(sh.uniforms, u);
        sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float aO; varying vec3 vN; varying vec2 vQ; varying float vO;')
          .replace('#include <begin_vertex>', '#include <begin_vertex>\n  vN = normal; vQ = uv; vO = aO;');
        sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
varying vec3 vN; varying vec2 vQ; varying float vO; uniform vec3 uRake, uLt, uHalf, uSh, uGr; uniform vec4 uWall, uNd; uniform vec2 uLen; uniform float uNdK;
${NOISE_GLSL}`)
          .replace('#include <color_fragment>', `#include <color_fragment>
  {
    if (dot(lifeP.xz, uWall.xy) < uWall.z) discard;
    vec3 N = normalize(vN); if (!gl_FrontFacing) N = -N;
    N = normalize(vec3(N.x, N.y * 0.5, N.z));                           // (low relief, lit as if it stood higher)
    vec2 m = vQ * uLen;                                                  // metres along and across the cloth
    // how far towards his light this part of it is turned; the hollows between folds are closed in
    float tone = 1.05 * dot(N, uRake) + 0.06;
    tone = tone * (0.5 + 0.5 * vO) - 0.55 * (1.0 - vO);
    if (!gl_FrontFacing) tone = tone * 0.7 - 0.1;
    // his whites: the shadow laid thin and warm, the half tone cool and grey, the light loaded on in long soft strokes
    float br = gN(vec2(m.x * 30.0, m.y * 140.0)), br2 = gN(vec2(m.x * 8.0 + 3.0, m.y * 22.0));
    tone += 0.12 * (br - 0.5) + 0.1 * (br2 - 0.5);
    float t1 = smoothstep(-0.25, 0.34, tone), t2 = smoothstep(0.3, 0.78, tone);
    vec3 c = mix(uSh, uHalf, t1); c = mix(c, uLt, t2);
    c = mix(c, uGr, (1.0 - t1) * 0.4 * gN(m * vec2(230.0, 170.0)));      // (in the shadows the ground shows through, stippled)
    c *= 0.96 + 0.08 * br;
    // muslin: a fine open weave, and a little of the floor's warmth comes through a single thickness of it
    c *= 0.975 + 0.05 * sin(m.x * 1500.0) * sin(m.y * 1500.0) * (1.0 - smoothstep(0.004, 0.012, fwidth(m.x)));
    c = mix(c, c * vec3(1.0, 0.93, 0.82), 0.3 * (1.0 - t2));
    // the needle's shadow on it
    { vec2 a = uNd.xy, b = uNd.zw, pa = lifeP.xz - a, ba = b - a; float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1.0e-6), 0.0, 1.0);
      c *= 1.0 - 0.42 * uNdK * (1.0 - smoothstep(0.004, 0.02, length(pa - ba * h))); }
    // the hems: a narrow doubled edge, a little lighter, a hair of shadow inside it; the corners are a little rounded
    vec2 hb = 0.5 * uLen - 0.02, hq = abs(m - 0.5 * uLen) - hb; float hem = 0.02 - (length(max(hq, 0.0)) + min(max(hq.x, hq.y), 0.0));
    c *= 1.0 + 0.06 * (1.0 - smoothstep(0.007, 0.01, hem)) - 0.1 * (1.0 - smoothstep(0.0, 0.003, abs(hem - 0.0115)));
    diffuseColor.rgb = c;
    float fw = max(fwidth(hem), 1.0e-5); diffuseColor.a = smoothstep(-fw, fw * 0.5, hem);
    if (diffuseColor.a < 0.05) discard;
  }`);
      };
      m.customProgramCacheKey = () => 'david-muslin';
      this.cloth = L.add(new THREE.Mesh(g, m)); this.cloth.name = 'muslin';
      this.gl = new Float32Array(NX + 1); this.Gc = new Float32Array(NX + 1);
      // (what never changes, worked out once: each row's terms, and how each point lies)
      this.C1 = {}; this.R1 = {}; this.CC = {}; this.RR = []; this.LY = new Float32Array(nv); this.was = '';
      for (let j = 0; j <= NY; j++) this.RR.push(this.rowAt(-WC / 2 + WC * j / NY, {}));
      for (let i = 0; i <= NX; i++) for (let j = 0; j <= NY; j++) this.LY[i * (NY + 1) + j] = this.lying(LC * i / NX, -WC / 2 + WC * j / NY);
    }

    // ---------------------------------------------------------- the thread, the needle and its glint: one mesh
    {
      const pos = [], tan = [], kk = [], idx = [];
      for (let i = 0; i < NT; i++) for (const s of [-1, 1]) { pos.push(0, 0, 0); tan.push(1, 0, 0, 0); kk.push(s, 0); }
      for (let i = 0; i < NT - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 3, a, a + 3, a + 2); }
      // the needle: along x from its eye (0) to its point (LN), a little flattened at the eye
      const prof = [[0, 0.0016], [0.005, 0.0068], [0.017, 0.0088], [0.04, 0.0078], [0.14, 0.007], [0.215, 0.0048], [0.25, 0.002], [LN, 0.0003]], SEG = 8, base = pos.length / 3;
      for (let r = 0; r < prof.length; r++) for (let s = 0; s < SEG; s++) {
        const a = s / SEG * TAU, [x, rad] = prof[r], dr = r === 0 ? 1 : r === prof.length - 1 ? -1 : (prof[Math.min(prof.length - 1, r + 1)][1] - prof[Math.max(0, r - 1)][1]) / (prof[Math.min(prof.length - 1, r + 1)][0] - prof[Math.max(0, r - 1)][0]);
        const nl = Math.hypot(1, dr); pos.push(x, Math.cos(a) * rad, Math.sin(a) * rad * (x < 0.045 ? 0.7 : 1)); tan.push(-dr / nl, Math.cos(a) / nl, Math.sin(a) / nl, 0); kk.push(0, 1);
      }
      for (let r = 0; r < prof.length - 1; r++) for (let s = 0; s < SEG; s++) { const a = base + r * SEG + s, b = base + r * SEG + (s + 1) % SEG, c = a + SEG, d = b + SEG; idx.push(a, c, d, a, d, b); }
      const gb = pos.length / 3;
      for (const [x, y] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { pos.push(x, y, 0); tan.push(0, 0, 1, 0); kk.push(0, 2); }
      idx.push(gb, gb + 1, gb + 2, gb, gb + 2, gb + 3);
      const g = new THREE.BufferGeometry();
      this.TP = new Float32Array(pos); this.TT = new Float32Array(tan);
      g.setAttribute('position', new THREE.BufferAttribute(this.TP, 3).setUsage(THREE.DynamicDrawUsage));
      g.setAttribute('aTan', new THREE.BufferAttribute(this.TT, 4).setUsage(THREE.DynamicDrawUsage));
      g.setAttribute('aK', new THREE.BufferAttribute(new Float32Array(kk), 2)); g.setIndex(idx);
      const u = this.su = { uNeedle: { value: new THREE.Matrix4() }, uGlint: { value: new THREE.Vector4() }, uGlintK: { value: 0 }, uLightW: { value: light }, uWall: { value: wall },
        uTh0: { value: v3('#3f4354', 0.05) }, uTh1: { value: v3('#7b8198', 0.05) }, uSt0: { value: v3('#1d1f24', 0) }, uSt1: { value: v3('#5b6068', 0) } };
      const m = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, ...PREMULT });
      m.onBeforeCompile = sh => {
        Object.assign(sh.uniforms, u);
        sh.vertexShader = sh.vertexShader.replace('#include <common>', `#include <common>
attribute vec4 aTan; attribute vec2 aK; uniform mat4 uNeedle; uniform vec4 uGlint; varying vec3 vA, vNw; varying vec2 vKk;`)
          .replace('#include <project_vertex>', `vec4 mvPosition; vNw = vec3(0.0, 1.0, 0.0);
  if (aK.y < 0.5) {                                                    // the thread: a ribbon that faces you
    mvPosition = viewMatrix * vec4(position, 1.0); vec3 tv = mat3(viewMatrix) * aTan.xyz; vec2 sd = normalize(vec2(-tv.y, tv.x) + vec2(1.0e-5, 0.0));
    mvPosition.xy += sd * aK.x * aTan.w; vA = vec3(aK.x, sd.y, aTan.w);
  } else if (aK.y < 1.5) {                                             // the needle
    mvPosition = viewMatrix * (uNeedle * vec4(position, 1.0)); vNw = mat3(uNeedle) * aTan.xyz; vA = position;
  } else { mvPosition = viewMatrix * vec4(uGlint.xyz, 1.0); mvPosition.xy += position.xy * uGlint.w; vA = position; }
  gl_Position = projectionMatrix * mvPosition; vKk = aK;`);
        sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
varying vec3 vA, vNw; varying vec2 vKk; uniform vec3 uLightW, uTh0, uTh1, uSt0, uSt1; uniform vec4 uWall; uniform float uGlintK;
vec3 swC; float swA;`)
          .replace('#include <map_fragment>', `#include <map_fragment>
  {
    if (vKk.y < 0.5) {
      // a twisted thread, round: lighter along the side turned up to the light
      if (vA.z < 1.0e-5 || dot(lifeP.xz, uWall.xy) < uWall.z) discard;
      float u = vA.x, a = 1.0 - smoothstep(0.5, 1.0, abs(u));
      swC = mix(uTh0, uTh1, clamp(0.55 + 0.5 * u * sign(vA.y + 1.0e-4), 0.0, 1.0)) * a; swA = a;
    } else if (vKk.y < 1.5) {
      if (dot(lifeP.xz, uWall.xy) < uWall.z) discard;
      vec3 N = normalize(vNw), V = normalize(cameraPosition - lifeP), H = normalize(uLightW + V);
      float df = max(dot(N, uLightW), 0.0), sp = pow(max(dot(N, H), 0.0), 34.0), fr = pow(1.0 - max(dot(N, V), 0.0), 3.0);
      vec3 c = mix(uSt0, uSt1, 0.2 + 0.8 * df) + vec3(1.0, 0.98, 0.94) * (1.5 * sp + 0.16 * fr);
      if (vA.x > 0.01 && vA.x < 0.031 && abs(vA.y) < 0.003) c = uSt0 * 0.4;        // its eye
      swC = c; swA = 1.0;
    } else {
      // a glint: a small four-pointed star, added
      vec2 q = abs(vA.xy);
      float s = exp(-q.x * 15.0) * exp(-q.y * 2.4) + exp(-q.y * 15.0) * exp(-q.x * 2.4) + 0.9 * exp(-dot(q, q) * 22.0);
      s *= 1.0 - smoothstep(0.6, 1.0, max(q.x, q.y));
      swC = vec3(1.0, 0.97, 0.9) * s * uGlintK; swA = 0.0;
    }
  }`)
          .replace('#include <opaque_fragment>', '  outgoingLight = swC; diffuseColor.a = swA;\n#include <opaque_fragment>');
      };
      m.customProgramCacheKey = () => 'david-thread';
      this.sew = L.add(new THREE.Mesh(g, m)); this.sew.name = 'thread'; this.sew.renderOrder = 7;
      this.nm = new THREE.Matrix4(); this.X = V(); this.Y = V(); this.Z = V();
    }

    // ---------------------------------------------------------- what lies on the floor throws a soft shadow on it
    {
      const u = this.gu = { uO: { value: L.floor(0, 0) }, uAx: { value: new THREE.Vector4(L.tx, L.tz, L.nx, L.nz) }, uSh: { value: Array.from({ length: 10 }, () => new THREE.Vector4(0, 0, 0.1, 0)) }, uShade: { value: v3('#2e251c', 0) }, uDay: { value: v3('#d9d2bf', 0) }, uK: { value: 0 } };
      const m = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, ...PREMULT });
      m.onBeforeCompile = sh => {
        Object.assign(sh.uniforms, u);
        sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
uniform vec3 uO, uShade, uDay; uniform vec4 uAx; uniform vec4 uSh[10]; uniform float uK;
vec3 grC; float grA;`)
          .replace('#include <map_fragment>', `#include <map_fragment>
  {
    vec2 lq = lifeP.xz - uO.xz, q = vec2(dot(lq, uAx.xy), dot(lq, uAx.zw));
    float sh = 0.0;
    for (int i = 0; i < 10; i++) { vec2 e = (q - uSh[i].xy) / uSh[i].z; float k = 1.0 - smoothstep(0.25, 1.0, length(e)); sh = max(sh, uSh[i].w * k * k); }
    // the light of her room, a little of it, where the work lies; and the work's shadow in it
    vec2 f = (q - vec2(0.26, 0.6)) / vec2(0.82, 0.48); float day = exp(-dot(f, f) * 1.7) * uK;
    float A = 0.7 * sh;
    grC = uShade * A + uDay * day * 0.13 * (1.0 - 0.8 * sh); grA = A;
  }`)
          .replace('#include <opaque_fragment>', '  outgoingLight = grC; diffuseColor.a = grA;\n#include <opaque_fragment>');
      };
      m.customProgramCacheKey = () => 'david-shadow';
      const pos = [], Pw = (x, z) => this.world(L, this.p.set(x, 0.004, z), V());
      const a = Pw(-0.9, 1.3), b = Pw(1.5, 1.3), c = Pw(1.5, W0 + 0.004), d = Pw(-0.9, W0 + 0.004);
      for (const v of [a, b, c, a, c, d]) pos.push(v.x, v.y, v.z);
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals();
      this.ground = L.add(new THREE.Mesh(g, m)); this.ground.name = 'shadow'; this.ground.renderOrder = 5;
    }

    // ---------------------------------------------------------- the lullaby and the small sounds, on the show's clock
    const sc = this.score = score(L);
    for (const [b, n, d] of TUNE) {
      const soft = b >= 8;
      sc.note(bt(b), hz(n), Math.max(0.42, d * BEAT * 1.7), { vol: soft ? 0.02 : 0.028, type: 'sine', attack: 0.045, over: 2, overVol: 0.1 });
      if (b < 4) sc.hit(bt(b), { d: 0.03, vol: 0.007, hp: 2600, attack: 0.001 });                 // the needle goes in
      else if (b > 4 && b < 8) sc.hit(bt(b), { d: 0.16, vol: 0.011, bp: 1300, q: 0.7, attack: 0.02 });     // the muslin runs up
    }
    for (const [b, n, d] of BASS) sc.note(bt(b), hz(n), d * BEAT * 1.25, { vol: b >= 8 ? 0.008 : 0.011, type: 'sine', attack: 0.09 });
    sc.hit(T_C[0] + 0.1, { d: 1.0, vol: 0.013, lp: 1700, hp: 260, attack: 0.25 });                // the work slips out
    sc.hit(T_C[1] - 0.12, { d: 0.3, vol: 0.011, lp: 480, attack: 0.03 });                         // and settles
    sc.note(T_TAUT + 0.02, hz('C3'), 0.2, { vol: 0.009, type: 'triangle', attack: 0.004 });      // the thread comes taut
    sc.done();
    this.hide();
  },

  // The scene's metres into the world.
  world(L, p, o) { return o.set(L.cx + L.tx * p.x + L.nx * p.z, L.y + p.y, L.cz + L.tz * p.x + L.nz * p.z); },
  // A point of the work's way, s metres along it (behind its start it runs straight back into the wall, and past its
  // end straight on); with the way it is heading there, and the way the cloth's width lies.
  routeAt(s, p, t, b) {
    const rp = this.rp, rb = this.rb, n = this.rn, DS = this.DS;
    const f = Math.max(0, Math.min(n - 1e-4, s / DS)), i = Math.floor(f), k = f - i, j = i * 3;
    t.set(rp[j + 3] - rp[j], rp[j + 4] - rp[j + 1], rp[j + 5] - rp[j + 2]).normalize();
    p.set(rp[j] + (rp[j + 3] - rp[j]) * k, rp[j + 1] + (rp[j + 4] - rp[j + 1]) * k, rp[j + 2] + (rp[j + 5] - rp[j + 2]) * k);
    b.set(rb[j] + (rb[j + 3] - rb[j]) * k, rb[j + 1] + (rb[j + 4] - rb[j + 1]) * k, rb[j + 2] + (rb[j + 5] - rb[j + 2]) * k).normalize();
    if (s < 0) p.addScaledVector(t, s); else if (s > n * DS) p.addScaledVector(t, s - n * DS);
    return p;
  },

  // The muslin, worked out in three parts so that the grid costs little: what depends only on how far along the strip
  // a point is (colAt), what depends only on how far across (rowAt), and how it lies when nothing is done to it (lying).
  // Along: xi metres from the end the thread holds.
  colAt(xi, C) {
    const S = this.S, f = clamp01(xi / LC) * NX, i = Math.min(NX - 1, Math.floor(f)), k = f - i;
    C.xi = xi; C.me = 0.007 * Math.sin(xi * 6.1 + 0.8) + 0.004 * Math.sin(xi * 15.3 + 2.4);       // (its edges are never quite straight)
    C.gl = S.g > 0 ? this.gl[i] + (this.gl[i + 1] - this.gl[i]) * k : 0; C.Gc = S.g > 0 ? this.Gc[i] + (this.Gc[i + 1] - this.Gc[i]) * k : 0;
    // (the end beyond the first stitch is not drawn up, but it flutes a little too)
    C.gp = xi < XK && S.g > 0 ? this.gl[Math.ceil(XK / LC * NX) + 1] * (0.35 + 0.65 * smooth(XK - 0.1, XK, xi)) : C.gl;
    if (C.gp > 0.001) {
      const xh = (xi - XK) / (XE - XK), fph = TAU * NF * xh + PH + 0.5 * Math.sin(xh * 4.3 + 1.1);
      C.cf = 0.5 - 0.5 * Math.cos(fph); C.cs = 0.5 - 0.5 * Math.cos(2 * fph); C.sf = Math.sin(fph); C.vary = 0.75 + 0.4 * Math.sin(xh * 7.1 + 1.7);
      C.rk = S.rock * 0.3 * Math.sin(TAU * 1.5 * xh - S.rockPh);                                 // (the frill breathes with the thread that holds it)
    }
    // moving, ripples run back along it
    C.rip = S.ripple > 0.001 ? S.ripple * 0.006 * Math.sin(xi * 17 - S.T * 14) : 0;
    // a tuck of it rides up on the needle, where the needle has gone under; where the thread runs under, a pucker stays
    let tk = 0;
    for (let s = 0; s < 5; s++) { const c = S.cover[s]; if (c > 0.001 && xi > PIN[s] - 0.02 && xi < POUT[s] + 0.02) tk += c * smooth(PIN[s] - 0.014, PIN[s] + 0.02, xi) * (1 - smooth(POUT[s] - 0.02, POUT[s] + 0.014, xi)); }
    C.tk = tk; C.kw = S.lift > 0.0005 ? S.lift * Math.exp(-Math.abs(xi - XK) / 0.13) : 0;
    return C;
  },
  // Across: v metres from its middle (towards the wall is positive; the stitching is at VS).
  rowAt(v, R) {
    const sv = R.sv = smooth(-WC / 2, VS, v);                            // 0 at the free edge, 1 at the stitching
    R.v = v; R.kap = lerp(K_FREE, K_ST, sv); R.sd = Math.exp(-Math.pow((v - VS) / 0.021, 2));
    R.as = 0.0085 * Math.exp(-Math.pow((v - VS) / 0.06, 2)); R.af = 0.034 * Math.pow(1 - sv, 1.1); R.a7 = Math.pow(1 - sv, 0.7); R.kl = 0.4 + 0.6 * sv;
    return R;
  },
  // Lying there it is never quite flat: broad low swells, a few soft folds slanting across it, its edges a little lifted.
  lying(xi, v) {
    let w = 0.0035 * (1 + Math.sin(xi * 5.3 + v * 9 + 0.7)) + 0.0018 * (1 + Math.sin(xi * 12.7 - v * 19 + 2.1));
    for (const fo of FOLDS) { const dd = (xi - fo[0] - fo[1] * v) / fo[2]; if (dd > -2.5 && dd < 2.5) w += fo[3] * Math.exp(-dd * dd) * (0.55 + 0.45 * Math.sin(v * fo[4] + fo[0] * 9)); }
    return w + 0.0035 * Math.pow(Math.abs(v) / (WC / 2), 3) * (1 + Math.sin(xi * 8.3 + (v > 0 ? 1.9 : 0)));
  },
  // The point of it at that place along (C) and across (R), lying as w says: where it is now, into o. Leaves this.ch
  // (how high a tuck stands there) and this.cao (how closed in it is). bare: without the tucks and the small pleats
  // (what the needle rides on).
  place(C, R, w, o, bare) {
    const S = this.S, rp = this.rp, rb = this.rb;
    let sig = this.sRest + C.xi - R.kap * C.Gc - S.shift;
    if (sig < IN - 0.03) sig = IN - 0.03 + (sig - IN + 0.03) * 0.02;                    // (what is still in the wall waits just inside its face)
    // where its way is there, the way it runs, and the way its width lies (flat on the floor all the way)
    const end = this.rn * this.DS, fr = Math.max(0, Math.min(this.rn - 1e-4, sig / this.DS)), ri = Math.floor(fr), rk = fr - ri, j = ri * 3;
    let tx = rp[j + 3] - rp[j], tz = rp[j + 5] - rp[j + 2]; const tl = 1 / (Math.hypot(tx, tz) || 1); tx *= tl; tz *= tl;
    let px = rp[j] + (rp[j + 3] - rp[j]) * rk, pz = rp[j + 2] + (rp[j + 5] - rp[j + 2]) * rk, bx = rb[j] + (rb[j + 3] - rb[j]) * rk, bz = rb[j + 2] + (rb[j + 5] - rb[j + 2]) * rk;
    if (sig < 0) { px += tx * sig; pz += tz * sig; } else if (sig > end) { px += tx * (sig - end); pz += tz * (sig - end); }
    let h = w * (1 - 0.8 * C.gl) + C.rip, lean = 0, ao = 1, tuck = 0;
    if (!bare && C.tk > 0) { tuck = C.tk * R.sd; h += tuck; ao -= 0.22 * Math.min(1, tuck / 0.02) * (1 - R.sd * 0.7); }
    // gathered: small pleats along the stitching, running out into flutes that stand at the free edge
    if (C.gp > 0.001) {
      const Af = R.af * C.vary;
      h += C.gp * (Af * C.cf + R.as * (bare ? 0.6 : C.cs) + Af * C.rk);
      lean = C.gp * Af * 0.5 * C.sf;
      ao -= C.gp * (0.26 * (1 - C.cf) * R.a7 + 0.2 * (1 - C.cs) * R.as / 0.0085);
    }
    // gathered, it curls round towards the wall with the stitching on the inside of the turn, as a frill does
    const sk = sig - S.sigK;
    if (S.curl > 0 && sk > 0) {
      const hf = sk * S.curl / 2, K0 = this.K0, c1 = Math.cos(hf), s1 = Math.sin(hf), kc = hf > 1e-4 ? s1 / hf : 1, c2 = c1 * c1 - s1 * s1, s2 = 2 * s1 * c1;
      const dx = (px - K0.x) * kc, dz = (pz - K0.z) * kc; px = K0.x + dx * c1 + dz * s1; pz = K0.z - dx * s1 + dz * c1;
      let x = bx, z = bz; bx = x * c2 + z * s2; bz = -x * s2 + z * c2; x = tx; z = tz; tx = x * c2 + z * s2; tz = -x * s2 + z * c2;
    }
    const off = R.v + C.me;
    o.set(px + bx * off + tx * lean, FLOOR + h, pz + bz * off + tz * lean);
    // the taut thread lifts the end it holds, and draws it a little towards the wall
    if (C.kw > 0) { const k = C.kw * R.kl; o.y += k; o.z -= 0.7 * k; o.x -= 0.35 * k; }
    if (o.y < FLOOR) o.y = FLOOR;
    this.ch = tuck; this.cao = Math.max(0.05, ao);
    return o;
  },
  // The same for any one point: xi along it, v across.
  clothAt(xi, v, o, bare = false) { return this.place(this.colAt(xi, this.C1), this.rowAt(v, this.R1), this.lying(xi, v), o, bare); },

  // How far out the work has come (0 in the wall, 1 lying in its place), at show-time t.
  cprog(t) { const q = ramp(t, T_C[0], T_C[1]); return 1 - Math.pow(1 - Math.pow(q, 1.7), 2); },
  // How far it is gathered, at show-time t: nothing until the thread is taut, then a tug to each note.
  gather(t, calm) {
    let g = 0;
    for (let j = 0; j < 7; j++) { const q = ramp(t, T_TAUT + (j + 1) * 0.5 * BEAT - 0.03, T_TAUT + (j + 1) * 0.5 * BEAT + (calm ? 0.3 : 0.24)); g += TUG[j] * (calm ? ease.smooth(q) : ease.outBack(q) * 0.85 + ease.out(q) * 0.15); }
    return Math.min(1.03, g);
  },
  // Where the needle's point is along the stitching, at needle-time t.
  tipAt(t) {
    if (t <= T_ST[0]) return PIN[0] - 0.34 * (T_ST[0] - t);
    for (let i = 0; i < 4; i++) if (t < T_ST[i + 1]) { const s = (t - T_ST[i]) / (T_ST[i + 1] - T_ST[i]); return PIN[i] + (PIN[i + 1] - PIN[i]) * (1 - Math.pow(1 - s, 1.7)); }
    return PIN[4] + (TIP_STOP - PIN[4]) * (1 - Math.pow(1 - clamp01((t - T_ST[4]) / (T_PIN - T_ST[4])), 2.2));
  },

  // The needle at needle-time t: its eye and the way it points (scene metres), into this.e and this.d. Returns how far
  // it has gone over from hanging on its thread (0) to sewing (1); this.xe is then where its eye is along the stitching.
  needle(L, t, calm) {
    const A = this.A, e = this.e, d = this.d, W0 = this.W0;
    // hanging: it noses out of the wall, point first, swings down on its thread, ticks against the wall, is let down
    if (t < TN1) {
      const s = lerp(-0.02, LN + 0.045, ease.inOut(ramp(t, TN0, TN1)));
      d.set(0, -0.45, 0.893); e.copy(A).addScaledVector(d, s - LN);
    } else {
      const tt = t - TN1, k = calm ? 5 : 3.1, phi = 1.1 * Math.exp(-k * tt) * Math.abs(Math.cos(7.4 * tt));
      const len = lerp(0.045, 0.6, ease.inOut(ramp(t, TN1 + 0.08, TN3)));
      d.set(0.1 * Math.sin(4.6 * tt) * Math.exp(-2.4 * tt), -Math.cos(phi), Math.sin(phi)).normalize();
      e.copy(A).addScaledVector(d, len); e.x += (calm ? 0.004 : 0.012) * Math.sin(4.6 * tt) * Math.exp(-2 * tt);
    }
    const w = ease.inOut(ramp(t, TN3, T0 - 0.06));
    this.xe = -1;
    if (w > 0) {
      // sewing: it lies along the stitching, a little above it; it rises before each stitch and nods as it goes in
      const tip = this.tipAt(t), xc = tip - LN / 2, c = this.c, q = this.q, q2 = this.q2, n = this.n;
      // (between two stitches: it slides in under the tuck, nose down; comes up out of it; lifts, and tips over for the next)
      let ph = 0.3, big = 1;
      if (t < T_ST[0]) ph = 1 - 0.5 * clamp01((T_ST[0] - t) / 0.45);
      else if (t < T_ST[4]) { for (let i = 0; i < 4; i++) if (t < T_ST[i + 1]) { const iv = T_ST[i + 1] - T_ST[i]; ph = (t - T_ST[i]) / iv; big = iv > 0.5 ? 1 : 0.62; break; } }
      else ph = 0.25 * ease.out(ramp(t, T_ST[4], T_PIN));
      const s2 = Math.pow(Math.sin(TAU * ph), 2), pitch = (-0.27 * Math.cos(TAU * ph) + 0.02) * (ph < 0.5 ? 1 : big), yc = 0.04 + (ph < 0.5 ? -0.033 : 0.038 * big) * s2;
      this.clothAt(xc, VS, c, true); this.clothAt(xc + 0.05, VS, q, true); this.clothAt(xc - 0.05, VS, q2, true);
      q.sub(q2).normalize(); n.set(0, 1, 0).addScaledVector(q, -q.y).normalize();
      q2.copy(q).multiplyScalar(Math.cos(pitch)).addScaledVector(n, Math.sin(pitch));      // the way it points
      c.addScaledVector(n, yc).addScaledVector(q2, -LN / 2);                               // its eye
      if (w >= 1) { e.copy(c); d.copy(q2); } else { e.lerp(c, w); d.lerp(q2, w).normalize(); e.y += 0.05 * Math.sin(Math.PI * w); }
      this.xe = tip - LN;
    }
    return w;
  },

  hide() { this.cloth.visible = false; this.sew.visible = false; this.ground.visible = false; this.was = ''; },
  start(L) { this.T = L.t; this.pT = L.t; this.score.from(L.t); },
  back(L) { this.bT = this.T || 0; },
  end() { this.hide(); },
  reset() { this.hide(); this.T = 0; },

  update(L, dt) {
    const ph = L.phase, back = ph === 'return', showing = ph === 'wake' || ph === 'play';
    if (!showing && !back) { this.hide(); return; }
    const calm = L.calm, T = back ? this.bT : (this.T = L.t), R = back ? L.ret : 0, voice = L.voice();
    const gone = (a, b) => (back ? ease.inOut(ramp(R, a, b)) : 0);
    if (showing) this.score.play(L.t);
    // (it ticks against the wall as it swings on its thread)
    if (showing && !calm && !L.quiet && voice.ctx) for (const [tk, vol] of [[TN1 + 0.212, 0.008], [TN1 + 0.637, 0.004]]) if (T >= tk && this.pT < tk) noise(voice, 0, { d: 0.022, vol, hp: 3200, attack: 0.001 });
    this.pT = T;
    if (showing && !this.told && !L.quiet && T > TN1) { this.told = true; L.k.say('The needle and thread David never painted come down to her sewing.', 4); }
    const S = this.S || (this.S = { cover: [0, 0, 0, 0, 0] }), p = this.p, w = this.w, w2 = this.w2;

    // ---- the story's clocks: going back, the thread slackens, the needle is drawn home along its stitches, the work follows
    const tn = back ? lerp(Math.min(T, T_PIN), TN0 - 0.05, gone(0.1, 0.68)) : T;
    const cp = this.cprog(T) * (1 - gone(0.46, 1));
    const g = this.gather(T, calm) * (1 - gone(0, 0.32));
    const taut = ease.out(ramp(T, T_TAUT, T_TAUT + 0.2)) * (1 - gone(0, 0.2));
    const spd = back ? 0.4 * Math.sin(Math.PI * ramp(R, 0.46, 1)) : Math.min(1, (this.cprog(T + 0.02) - this.cprog(T - 0.02)) / 0.04 * this.Dc / 2.6) + (T > T_C[1] ? 0.5 * Math.exp(-(T - T_C[1]) * 5) : 0);
    // each tug lifts the end the thread holds, and lets it down; afterwards the thread only rocks it
    let tug = 0; for (let j = 0; j < 7; j++) { const tt = T - (T_TAUT + (j + 1) * 0.5 * BEAT); if (tt > -0.05) tug += TUG[j] * 5 * Math.exp(-Math.pow((tt - 0.06) / 0.11, 2)); }
    const rockEnv = ease.smooth(ramp(T, T_ROCK[0] - 0.2, T_ROCK[0] + 0.6)) * (1 - ease.smooth(ramp(T, T_ROCK[1] - 0.4, T_ROCK[1] + 1.6)));
    const rockPh = Math.PI * (T - T_ROCK[0]) / BEAT, rock = rockEnv * Math.sin(rockPh) * (calm ? 0.5 : 1);
    S.T = T * (calm ? 0.5 : 1); S.shift = this.Dc * (1 - cp); S.g = g; S.ripple = spd * (calm ? 0.6 : 1); S.rock = rock * (1 - gone(0, 0.2)); S.rockPh = rockPh;
    S.lift = taut * (0.03 + (calm ? 0.012 : 0.03) * tug + 0.02 * rock) * (1 - gone(0, 0.2));
    S.sigK = this.sRest + XK - S.shift; S.curl = CURL * ease.smooth(g) * (1 + 0.11 * S.rock); this.routeAt(S.sigK, this.K0, this.t, this.b);
    // the gathers arrive from the far end, where the needle holds the thread, and run up towards her hand
    if (g > 0) {
      const gl = this.gl, Gc = this.Gc, dx = LC / NX; Gc[0] = 0;
      for (let i = 0; i <= NX; i++) { const xh = (i * dx - XK) / (XE - XK); gl[i] = xh < 0 ? 0 : smooth(0, 0.3, g * 1.3 - (1 - Math.min(1, xh))) * (1 - smooth(1.02, 1.22, xh)); if (i) Gc[i] = Gc[i - 1] + 0.5 * (gl[i] + gl[i - 1]) * dx; }
    }

    // ---- the needle
    const out = tn > TN0, sewn = out ? this.needle(L, tn, calm) : 0, xe = this.xe, tip = xe + LN;
    for (let s = 0; s < 5; s++) S.cover[s] = sewn < 1 ? 0 : (0.024 * smooth(PIN[s] - 0.012, PIN[s] + 0.03, tip) * (1 - smooth(POUT[s] - 0.03, POUT[s] + 0.012, xe)) + 0.0045 * smooth(PIN[s], PIN[s] + 0.03, xe + 0.02));
    const E = this.e, D = this.d;

    // ---- the muslin (worked out again only when something about it has changed)
    this.cloth.visible = cp > 0.002;
    const now = this.cloth.visible ? [S.shift, S.g, S.lift, S.ripple > 0.001 ? S.T : 0, S.rock, S.curl, S.cover.join()].join() : '';
    if (this.cloth.visible && now !== this.was) {
      const CP = this.CP, CO = this.CO, LY = this.LY, C = this.CC, RR = this.RR, q = this.q, NR = NY + 1; let k = 0;
      for (let i = 0; i <= NX; i++) {
        this.colAt(LC * i / NX, C);
        for (let j = 0; j <= NY; j++, k++) { this.place(C, RR[j], LY[k], q, false); this.world(L, q, w); CP[k * 3] = w.x; CP[k * 3 + 1] = w.y; CP[k * 3 + 2] = w.z; CO[k] = this.cao; }
      }
      // its normals, from the grid itself (along it crossed with across it: the side that lies upwards)
      const NA = this.cloth.geometry.attributes.normal.array;
      for (let i = 0; i <= NX; i++) for (let j = 0; j <= NY; j++) {
        const a = (Math.min(NX, i + 1) * NR + j) * 3, b = (Math.max(0, i - 1) * NR + j) * 3, c = (i * NR + Math.min(NY, j + 1)) * 3, d = (i * NR + Math.max(0, j - 1)) * 3, o = (i * NR + j) * 3;
        const ax = CP[a] - CP[b], ay = CP[a + 1] - CP[b + 1], az = CP[a + 2] - CP[b + 2], bx = CP[c] - CP[d], by = CP[c + 1] - CP[d + 1], bz = CP[c + 2] - CP[d + 2];
        const nx = ay * bz - az * by, ny = az * bx - ax * bz, nz = ax * by - ay * bx, nl = 1 / (Math.hypot(nx, ny, nz) || 1);
        NA[o] = nx * nl; NA[o + 1] = ny * nl; NA[o + 2] = nz * nl;
      }
      const geo = this.cloth.geometry; geo.attributes.position.needsUpdate = true; geo.attributes.aO.needsUpdate = true; geo.attributes.normal.needsUpdate = true;
    }
    this.was = now;

    // ---- the thread: from under her fingers down through the air, and then along the stitching to the needle's eye
    this.sew.visible = out; if (!out) this.cu.uNdK.value = 0;
    if (out) {
      const TP = this.TP, TT = this.TT, A = this.A, onCloth = sewn >= 1 && xe > XK, Q = this.kp, c = this.c, HW = 0.0058;
      if (onCloth) { this.clothAt(XK, VS, Q, true); Q.y += 0.006; } else Q.copy(E);
      // (slack once the needle is at work: it hangs in a soft curve; taut, it is a straight line, and quivers once)
      const slack = ease.smooth(ramp(tn, T0 - 0.15, T0 + 1.0)) * (1 - taut), sag = 0.3 * slack + 0.012 * Math.sin(T * 1.3) * slack;
      const tw = !calm && !back && T > T_TAUT ? 0.012 * Math.exp(-(T - T_TAUT) * 7) * Math.sin((T - T_TAUT) * 46) : 0;
      c.copy(A).add(Q).multiplyScalar(0.5); c.y -= sag; c.z += 0.4 * sag;
      const put = (i, v) => { this.world(L, v, w); const j = i * 6; TP[j] = TP[j + 3] = w.x; TP[j + 1] = TP[j + 4] = w.y; TP[j + 2] = TP[j + 5] = w.z; };
      for (let i = 0; i < NT1; i++) {
        const a = i / (NT1 - 1), m = 1 - a; p.set(m * m * A.x + 2 * m * a * c.x + a * a * Q.x + tw * Math.sin(Math.PI * a), m * m * A.y + 2 * m * a * c.y + a * a * Q.y, m * m * A.z + 2 * m * a * c.z + a * a * Q.z);
        put(i, p);
      }
      let last = NT1 - 1;
      if (onCloth) {
        for (let i = 0; i < NT2; i++) {
          const xi = XK + (xe - XK) * i / (NT2 - 1); let under = 0;
          for (let s = 0; s < 5; s++) under = Math.max(under, smooth(PIN[s] - 0.002, PIN[s] + 0.008, xi) * (1 - smooth(POUT[s] - 0.008, POUT[s] + 0.002, xi)));
          this.clothAt(xi, VS, this.q); this.q.y += lerp(0.008, -this.ch - 0.004, under);
          const up = smooth(xe - 0.045, xe, xi); if (up > 0) this.q.lerp(E, up);
          put(NT1 + i, this.q);
        }
        last = NT - 1;
      }
      // each point's own heading, and its width (what is not in use is folded up at the end, with none)
      for (let i = 0; i < NT; i++) {
        const j = i * 8, on = i <= last, a = Math.min(last, Math.max(0, i - 1)) * 6, b = Math.min(last, i + 1) * 6;
        if (!on) { const l = last * 6, o = i * 6; TP[o] = TP[o + 3] = TP[l]; TP[o + 1] = TP[o + 4] = TP[l + 1]; TP[o + 2] = TP[o + 5] = TP[l + 2]; }
        let tx = TP[b] - TP[a], ty = TP[b + 1] - TP[a + 1], tz = TP[b + 2] - TP[a + 2]; const l = Math.hypot(tx, ty, tz) || 1; tx /= l; ty /= l; tz /= l;
        TT[j] = TT[j + 4] = tx; TT[j + 1] = TT[j + 5] = ty; TT[j + 2] = TT[j + 6] = tz; TT[j + 3] = TT[j + 7] = on ? HW : 0;
      }
      const geo = this.sew.geometry; geo.attributes.position.needsUpdate = true; geo.attributes.aTan.needsUpdate = true;
      // the needle itself
      const X = this.world(L, p.copy(D), this.X).sub(this.world(L, p.set(0, 0, 0), w2)).normalize(), Y = this.Y, Z = this.Z;
      Z.set(0, 1, 0); if (Math.abs(X.y) > 0.92) Z.set(L.nx, 0, L.nz);
      Z.cross(X).normalize().negate(); Y.crossVectors(Z, X);
      this.world(L, E, w); this.su.uNeedle.value.makeBasis(X, Y, Z).setPosition(w);
      // its glint: as it first hangs in the light, as it stays in the cloth, at the last note, and now and then after
      const bell = (t0, wd) => Math.exp(-Math.pow((T - t0) / wd, 2)), wd = calm ? 0.75 : 0.3;
      let gk = bell(TN1 + 0.16, wd) + 0.7 * bell(T_PIN + 0.2, wd) + 0.8 * bell(bt(15) + 0.2, wd * 1.4);
      if (T > bt(15) + 3) { const c5 = (T - bt(15) - 3) % 5.5; gk += 0.6 * Math.exp(-Math.pow((c5 - 2.7) / (calm ? 1.0 : 0.6), 2)); }
      if (!calm) for (let i = 0; i < 4; i++) gk += 0.4 * bell(T_ST[i] + 0.64 * (T_ST[i + 1] - T_ST[i]), 0.1);       // (and as it turns over between two stitches)
      gk *= (calm ? 0.55 : 1) * (1 - gone(0, 0.15));
      p.copy(E).addScaledVector(D, LN * 0.36); p.y += 0.004; this.world(L, p, w);
      this.su.uGlint.value.set(w.x, w.y, w.z, 0.04 + 0.04 * Math.min(1, gk)); this.su.uGlintK.value = gk;
      // (and its shadow on the cloth: a little down and to the right of it, further the higher it is)
      { const off = 0.012 + 0.35 * E.y; p.copy(E); p.x += off; p.z += 0.7 * off; this.world(L, p, w); p.copy(E).addScaledVector(D, LN); p.x += off; p.z += 0.7 * off; this.world(L, p, w2);
        this.cu.uNd.value.set(w.x, w.z, w2.x, w2.z); this.cu.uNdK.value = 1 - smooth(0.05, 0.3, E.y + 0.5 * D.y * LN); }
    }

    // ---- what lies on the floor throws its shadow, a little down and to the right
    const SH = this.gu.uSh.value, sk = 1 - gone(0.8, 1);
    this.gu.uK.value = ease.smooth(ramp(T, 0, 1.4)) * (1 - gone(0.5, 1)); this.ground.visible = this.gu.uK.value > 0.002;
    for (let i = 0; i < 8; i++) {
      if (!this.cloth.visible) { SH[i].w = 0; continue; }
      this.clothAt(LC * (i + 0.5) / 8, 0, this.q, true); p.copy(this.q);
      SH[i].set(p.x + 0.018 + 0.3 * p.y, p.z + 0.02 + 0.25 * p.y, 0.19 + 0.3 * p.y, p.z < this.W0 + 0.05 ? 0 : sk * smooth(this.W0 + 0.05, this.W0 + 0.2, p.z));
    }
    if (out) { p.copy(E).addScaledVector(D, LN * 0.5); SH[8].set(p.x + 0.015 + 0.4 * p.y, p.z + 0.012 + 0.3 * p.y, 0.07 + 0.25 * p.y, p.z < this.W0 + 0.03 ? 0 : sk * (1 - smooth(0.02, 0.4, p.y)) * 0.8); } else SH[8].w = 0;
    SH[9].w = 0;

    voice.level = calm ? 0.65 : 1; voice.place();
  },
});
