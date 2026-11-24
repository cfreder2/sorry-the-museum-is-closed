// Meindert Hobbema, The Watermill with the Great Red Roof (c. 1665), Gallery 213. The word: turn.
//
// He was Ruisdael's pupil (whose ruin hangs beside this one) and took the watermill from him; the museum counts more
// than thirty of them in his pictures, and says a mill like this was understood two ways at once: as Dutch
// industriousness, and as human transience, the water always arriving and always gone. What he shows is a mill at
// rest. A long wooden flume on a crowd of crooked posts carries the stream in from the bank on the left, past two
// wheels, to a low boarded mill under one great roof of orange-red tiles; and the water is not on either wheel. The
// spill gate is up, and the whole stream goes over the side of the flume between the wheels in white strands, into a
// brown pond that holds its reflection, with three ducks on it. Big oaks stand over the bank, a pale tree leans in
// front of the roof and a tall thin one stands in the yard. Everything in the picture is waiting for one thing.
//
// Look at it and his pond comes out over the floor under the right of the picture, where his mill is; and the mill
// is built, the way a millwright would: the bank comes up, the posts stand up one after another along the water, the
// bearers and the boards of the flume drop onto them, the walls plank up, and the red roof is tiled course by course
// from the eaves to the ridge. His trees feather in behind. Then the stream arrives: it runs down the flume from the
// bank, finds the open spill and goes over, and for a moment it is the picture: the white fall, its rings going out
// over the brown water, the ducks paddling clear of it. Then the gate drops. The fall is cut off and thins to a few
// threads; the water runs on down the flume, over its end and onto the near wheel. The wheel takes the weight,
// lurches, groans, sags back; and then it goes, slowly, and faster, the water coming off its floats in a bright
// broken sheet and the wash rolling out across the pond so that the ducks ride over it one after another; and from
// inside the mill the clack starts, slow, and quickens with the wheel until it is steady. While you keep looking the
// wheel turns, the far wheel in the shade under the flume takes its share and joins it, and now and then a duck
// goes bottom up. When you stop, the water is shut off, the wheels run down, and the mill is taken apart in the
// order it was built and goes back under the picture with its pond.
//
// How it is made: three draw calls. The floor is one mesh with one shader: the pond (what it reflects is worked out
// for each pixel from where you stand: the boarded wall, the red roof, the flume, the white of the fall, his woods
// and his sky, bent by the rings from the fall and the wheel's wash), the froth where the water lands, and its weedy
// edge. Everything solid is a second mesh with its own light (his: from the left, the far wheel in the flume's
// shadow): the banks, every post and board (weathered timber painted once in a texture, grey and silvered, green
// where it stands in the water), the roof (his pantiles painted once in a texture, course by course in close
// orange-reds, sooted and mossed, the ridge sagging), the trees' stems, the grass, the gate, the two wheels and the
// three ducks; each piece is stood up, dropped in or tiled by the vertex shader at its own moment, and the wheels,
// the gate and the ducks are moved by seven matrices. His foliage (masses and loose sprays of feathered touches at
// several depths), the falling water (soft strands with the dark between them, as he painted it), the drops off the
// wheel, the froth and the blossom on the bank are soft cards in a third. Nothing is solid and nothing stays out
// after the look. The roof's ridge stands 0.71 m over the floor and the tallest tree about a metre, close to the wall
// and under the picture: from the look camera nothing comes in front of a canvas, and the kit's guard does the rest
// (from one of the checks' nine cameras, low in the far corner, it trims a few pixels of the oaks' tops).
//
// Ruisdael's ruin (src/life/60755-ruins-of-egmond.js) reaches to about 0.37 m left of this picture's middle; this
// scene's ground starts about there and its middle is 0.46 m to the right, under the mill's own side of the picture
// (what matters in it, the fall and the near wheel, is within 0.6 m of the picture's middle), and it has no weather: no cloud on the
// wall, no storm, no rain, no light crossing, no birds on the wing. His is a ruin the weather passes over; this is a
// working thing that starts. Neither stays out after its look, and the kit sends one home when the other begins.
// With "Reduce motion and flashing" on, the wheels turn at half the speed (and the clack with them), the water's
// strands and the froth move at half speed, nothing glitters, and the gate and the knocks land more quietly.
//
// There is no tune: the mill has its own, the clack, which keeps the wheel's time exactly.
//
// What it does not do: nobody comes out of the picture (not the man in the red coat on the path, the two walkers
// beyond him or the figure in the mill's doorway: the miller's work is shown by his mill, and a working man is not a
// prop), the ducks are not chased, splashed or startled (they are clear of the fall before it lands, and ride the
// wash), and the mill's taking apart at the end is a rewind, not a ruin: nothing breaks or falls.
import * as THREE from 'three';
import { lifeFor, ease, ramp, clamp01, lerp, shape, canvasTexture } from '../paintlife.js';
import { strokes } from './brush.js';
import { score, hump } from './stagecraft.js';

const TAU = Math.PI * 2, sm = ease.smooth;
const X0 = 0.46, Z = 1.12;                       // the scene's middle, along the wall from the picture's (his mill is on the right); and its own units: this many metres to one
// the timeline (seconds of show)
const T_WATER = 1.9, T_SPILL = 2.38, T_LAND = 2.62, T_GATE = 3.72, T_SHUT = 3.9, T_HIT = 4.35, T_GO = 5.05, SPIN = 1.5, T_FAR = 11;
const BUILT = 2.2;                               // by this much of the build clock every piece is in place
// the mill, in the scene's own terms: along the wall (from X0), up from the floor, out from the wall (metres)
const WH = [0.10, 0.145, 0.50], WH2 = [-0.36, 0.138, 0.50], WR = 0.135;
const FL = { x0: -0.56, x1: 0.135, z0: 0.455, z1: 0.545, bot: 0.3, top: 0.35 };
const SPILL = [-0.19, -0.07], LIP = 0.312;
const MILL = { x0: 0, x1: 0.5, z0: 0.10, z1: 0.43, eave: 0.31, ridge: 0.635, zr: 0.265 }, EXT = { x0: 0.5, x1: 0.68, z0: 0.12, z1: 0.41, eave: 0.24, ridge: 0.455 };
const FOOT = [-0.13, 0.6], WASH = [0.215, 0.515];          // where the fall lands, and where the wheel's water does
const N_CARD = 240, N_DROP = 16, N_PART = 8;
// what the pond reflects: [lo (along, up, out), hi, kind (0 boards, 1 roof, 2 flume, 3 the fall)]
const BOXES = [
  [[0, 0, 0.10], [0.5, 0.31, 0.43], 0], [[0.5, 0, 0.12], [0.68, 0.24, 0.41], 0],
  [[-0.02, 0.31, 0.13], [0.5, 0.42, 0.455], 1], [[0.08, 0.42, 0.19], [0.5, 0.53, 0.36], 1], [[0.18, 0.53, 0.24], [0.5, 0.62, 0.3], 1], [[0.5, 0.24, 0.14], [0.69, 0.43, 0.42], 1],
  [[-0.56, 0.285, 0.45], [0.135, 0.355, 0.55], 2], [[-0.185, 0, 0.555], [-0.075, 0.312, 0.6], 3],
];
const shore = x => 0.4 + 0.34 * sm(ramp(-x, 0.42, 0.56)) + 0.035 * sm(ramp(x, -0.06, 0.02)) + 0.17 * sm(ramp(x, 0.26, 0.42)) + 0.06 * sm(ramp(x, 0.52, 0.74)) + 0.012 * Math.sin(7.3 * x + 2.1);
const ground = (x, z) => {
  const side = (1 - sm(ramp(x, 0.68, 0.8))) * (1 - sm(ramp(-x, 0.56, 0.78)));
  const hill = 0.13 * Math.exp(-(((x + 0.54) / 0.24) ** 2)) * (1 - 0.5 * sm(ramp(z, 0.25, 0.7)));
  const h = 0.05 + hill + 0.03 * (1 - sm(ramp(z, 0, 0.4))) + 0.006 * Math.sin(x * 9 + z * 7);
  return h * (1 - sm(ramp(z, shore(x) - 0.2, shore(x) + 0.02))) * side - 0.012;
};
const hash = (a, b) => { const x = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return x - Math.floor(x); };
// a wheel's angle: at rest until t0, then up to w radians a second over D seconds, and steady
const spun = (t, w, t0, D) => { if (t <= t0) return 0; const x = Math.min(1, (t - t0) / D); return w * D * (x * x * x - x * x * x * x / 2) + w * Math.max(0, t - t0 - D); };

// What every shader here knows: where the stage is, how far the mill is built, and his light.
const LIGHT = /* glsl */`
uniform vec3 uO; uniform vec4 uAx; uniform float uTime, uBuild, uZ; uniform vec3 cAmb, cSun;
uniform sampler2D tNoise;
const vec3 SUN = vec3(-0.72, 0.6, 0.35);             // towards his sun: from the left, high, a little from the room (along, up, out)
// under the flume it is dark, most on the left, where his far wheel is
float under(vec3 P) { return (1.0 - smoothstep(0.26, 0.31, P.y)) * smoothstep(0.37, 0.44, P.z) * (1.0 - smoothstep(0.56, 0.64, P.z)) * (1.0 - smoothstep(-0.22, -0.03, P.x)) * smoothstep(-0.66, -0.56, P.x); }
vec3 lightOn(vec3 alb, vec3 n, vec3 P) {
  float lam = clamp(dot(n, SUN) * 0.75 + 0.25, 0.0, 1.0), sh = 1.0 - 0.74 * under(P);
  // (and the near wheel's own shadow on the boards behind it, and the flume's end's)
  sh *= 1.0 - 0.5 * step(P.z, 0.445) * step(0.38, P.z) * (1.0 - smoothstep(0.1, 0.17, length(P.xy - vec2(0.135, 0.125)))) * step(P.x, 0.5);
  return alb * (cAmb * (0.7 + 0.3 * n.y) * (0.5 + 0.5 * sh) + cSun * lam * lam * sh);
}
`;

lifeFor(869, {
  title: /^The Watermill with the Great Red Roof/,
  word: 'turn',
  stage: { out: 1.3, half: 1.3, cam: { dist: 2.5, height: 0.66, side: 0.12, fov: 54, lookU: 0.32, lookOut: 0.45, floorOut: 1.3 } },
  wake: 2, ret: 2.2,

  build(L) {
    const P = L.pal, col = (h, a = 0.25) => P.near(h, a);
    const base = L.cy - L.y;
    // a point of the scene: along the wall from its middle, up from the floor, out from the canvas plane
    this.W = (x, y, z, v = new THREE.Vector3()) => L.at(x * Z + X0, y * Z - base, z * Z, v);
    this.v = new THREE.Vector3(); this.fl = {};
    this.lu = {
      uO: { value: L.floor(X0, 0) }, uAx: { value: new THREE.Vector4(L.tx, L.tz, L.nx, L.nz) }, uTime: { value: 0 }, uBuild: { value: 0 }, uZ: { value: Z },
      cAmb: { value: new THREE.Color(0.44, 0.46, 0.5) }, cSun: { value: new THREE.Color(1.0, 0.9, 0.74) }, tNoise: { value: this.noiseTex(L) },
    };
    this.buildFloor(L, col);
    this.buildLand(L, col);
    this.buildCards(L, col);
    this.bands = [this.makeScore(L, false), this.makeScore(L, true)]; this.band = this.bands[0];
    this.rush = L.voice().loop({ lp: 5200, hp: 900 }); this.churn = L.voice().loop({ lp: 520, hp: 80 }); this.run = L.voice().loop({ lp: 1900, hp: 400 });
    this.hideAll();
  },

  // Soft noise, four different fields in one texture, tiling.
  noiseTex(L) {
    const N = 128, d = new Uint8Array(N * N * 4), f = new Float32Array(N * N), g = new Float32Array(N * N);
    for (let c = 0; c < 4; c++) {
      for (let i = 0; i < N * N; i++) f[i] = L.rand();
      for (let pass = 0; pass < 3; pass++) {
        for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { let s = 0; for (let k = -3; k <= 3; k++) s += f[y * N + ((x + k + N) % N)]; g[y * N + x] = s / 7; }
        for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { let s = 0; for (let k = -3; k <= 3; k++) s += g[((y + k + N) % N) * N + x]; f[y * N + x] = s / 7; }
      }
      let lo = 1, hi = 0; for (let i = 0; i < N * N; i++) { lo = Math.min(lo, f[i]); hi = Math.max(hi, f[i]); }
      for (let i = 0; i < N * N; i++) d[i * 4 + c] = Math.round(255 * (f[i] - lo) / (hi - lo));
    }
    const t = new THREE.DataTexture(d, N, N, THREE.RGBAFormat);
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; t.needsUpdate = true;
    return t;
  },

  // ---------------------------------------------------------------- the floor: the pond, the froth, its edge
  buildFloor(L, col) {
    const pos = [];
    const F = (x, z) => L.floor(x * Z + X0, z, new THREE.Vector3()).setY(L.y + 0.013);
    for (const p of [F(-1.15, -L.wall), F(1.0, -L.wall), F(1.0, 1.6 * Z), F(-1.15, -L.wall), F(1.0, 1.6 * Z), F(-1.15, 1.6 * Z)]) pos.push(p.x, p.y, p.z);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    // the banks: dark wet earth and weed, in small dabs
    const bank = this.tBank = strokes({
      size: 256, seed: 869, n: 2800, len: [4, 10], width: [2, 4], bend: 0.4, lift: 0.14, base: col('#33301f', 0.3).getStyle(),
      colors: [['#3b4022', 4], ['#484a26', 3], ['#575229', 2.2], ['#6a5e30', 1.4], ['#857446', 0.5], ['#42361f', 1.8], ['#272519', 1.6]].map(([c, w]) => [col(c, 0.25).getStyle(), w]),
      angle: (x, y, r) => r() * Math.PI,
    });
    const V3 = a => new THREE.Vector3(a[0], a[1], a[2]);
    const u = this.fu = {
      ...this.lu, tBank: { value: bank },
      uSpread: { value: 0 }, uBuilt: { value: 0 }, uFall: { value: new THREE.Vector3() }, uWash: { value: new THREE.Vector3() }, uCalm: { value: 0 },
      uFoot: { value: new THREE.Vector4(FOOT[0], FOOT[1], WASH[0], WASH[1]) },
      uBoxLo: { value: BOXES.map(b => V3(b[0])) }, uBoxHi: { value: BOXES.map(b => V3(b[1])) }, uBoxK: { value: BOXES.map(b => b[2]) },
      cDeep: { value: col('#2c1c10', 0.3) }, cTile: { value: col('#b4552d', 0.25) }, cBoard: { value: col('#5d584b', 0.3) }, cTimber: { value: col('#7d7663', 0.3) }, cGreen: { value: col('#333a1f', 0.3) },
      cSky: { value: col('#7d8a8f', 0.3) }, cCloud: { value: col('#c9c0a8', 0.25) }, cFoam: { value: col('#e4dcc6', 0.15) },
    };
    const m = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide });
    m.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, u);
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', `#include <common>
${LIGHT}
#define NB ${BOXES.length}
uniform sampler2D tBank; uniform float uSpread, uBuilt, uCalm; uniform vec3 uFall, uWash; uniform vec4 uFoot; uniform vec3 uBoxLo[NB], uBoxHi[NB]; uniform float uBoxK[NB];
uniform vec3 cDeep, cTile, cBoard, cTimber, cGreen, cSky, cCloud, cFoam;
vec3 fCol; float fA;
float boxHit(vec3 P, vec3 D, vec3 lo, vec3 hi, out vec3 n) {
  vec3 inv = 1.0 / D, t0 = (lo - P) * inv, t1 = (hi - P) * inv, tn = min(t0, t1), tf = max(t0, t1);
  float a = max(max(tn.x, tn.y), tn.z), b = min(min(tf.x, tf.y), tf.z);
  n = a == tn.x ? vec3(-sign(D.x), 0.0, 0.0) : a == tn.y ? vec3(0.0, -sign(D.y), 0.0) : vec3(0.0, 0.0, -sign(D.z));
  return (a > b || a < 0.0) ? -1.0 : a;
}
// The mill along one ray from the water: its colour, and whether the ray meets it (only as much as is built).
vec4 mill(vec3 P, vec3 D) {
  float best = 1.0e3, bk = -1.0; vec3 bn = vec3(0.0, 0.0, 1.0);
  for (int i = 0; i < NB; i++) {
    vec3 n; float t = boxHit(P, D, uBoxLo[i], uBoxHi[i], n); if (t <= 0.0 || t >= best) continue;
    if (uBoxK[i] > 2.5 && uFall.x < 0.02) continue;
    best = t; bn = n; bk = uBoxK[i];
  }
  if (bk < -0.5) return vec4(0.0);
  vec3 H = P + D * best; float mot = 0.8 + 0.4 * texture2D(tNoise, vec2(H.x + H.z, H.y * 0.4) * 5.0).r;
  if (bk > 2.5) return vec4(cFoam * (0.7 + 0.3 * mot), uFall.x * (0.45 + 0.4 * texture2D(tNoise, vec2(H.x * 6.0, H.y * 1.5 + uTime * 0.6)).g));
  vec3 alb = bk < 0.5 ? cBoard * mix(0.55, 1.0, smoothstep(0.0, 0.12, H.y)) : bk < 1.5 ? mix(cTile, cDeep, 0.4) : cTimber;
  if (bk > 0.5 && bk < 1.5) bn = normalize(vec3(0.0, 0.5, 0.87));
  float lam = clamp(dot(bn, SUN) * 0.75 + 0.25, 0.0, 1.0);
  return vec4(alb * mot * (cAmb * 0.8 + cSun * lam * lam), uBuilt);
}
// What the water shows along a ray from it: his woods and his sky, and the mill lying in them.
vec3 scene(vec3 P, vec3 D) {
  float t = D.z < -1.0e-3 ? (0.1 - P.z) / D.z : 40.0;
  vec2 q = vec2(P.x + D.x * t, D.y * t); float nq = texture2D(tNoise, q * 1.6).g;
  float trees = 0.34 + 0.4 * exp(-pow((q.x + 0.56) / 0.2, 2.0)) + 0.36 * exp(-pow((q.x - 0.64) / 0.07, 2.0)) + 0.05 * sin(q.x * 9.0 + 1.0) + (nq - 0.5) * 0.14;
  float tk = D.z < -1.0e-3 ? (1.0 - smoothstep(trees - 0.05, trees + 0.05, q.y)) * uBuilt : 0.0;
  vec3 wood = cGreen * (0.5 + 0.8 * nq) * (cAmb * 0.7 + cSun * 0.2);
  float cl = texture2D(tNoise, q * vec2(0.11, 0.16) + vec2(uTime * 0.004, 0.0)).r * 0.6 + texture2D(tNoise, q * vec2(0.31, 0.4)).b * 0.4;
  vec3 sky = mix(cSky, cCloud, smoothstep(0.25, 0.8, cl)) * 0.2;
  vec3 bg = mix(sky, wood, tk);
  vec4 acc = vec4(0.0);
  float fine = texture2D(tNoise, vec2(P.x * 0.9, P.z * 13.0 + uTime * 0.03)).b - 0.5, fine2 = texture2D(tNoise, vec2(P.x * 3.1, P.z * 21.0 - uTime * 0.04)).r - 0.5;
  for (int k = 0; k < 2; k++) { vec3 Dk = D; Dk.x += (float(k) - 0.5) * 0.06 + fine * 0.12 + fine2 * 0.05; Dk.y *= 1.0 + fine2 * 0.2; vec4 h = mill(P, Dk); acc += vec4(h.rgb * h.a, h.a); }
  float cov = acc.a * 0.5; if (cov < 0.01) return bg;
  // (as his water holds it: darker than the thing itself, and fading towards the near bank)
  return mix(bg, acc.rgb / acc.a * 0.46, cov * mix(1.0, 0.35, smoothstep(0.7, 1.15, P.z)));
}
// rings going out from a point where water lands: the slope they give the surface there, and their height (w)
vec3 rings(vec2 st, vec2 c, vec3 k, float kk, float sp) {
  vec2 d = st - c; float l = length(d);
  float w = k.x * sin(kk * l - uTime * sp + 5.0 * texture2D(tNoise, st * 1.3).r) * exp(-l / k.z) * (1.0 - smoothstep(k.y - 0.14, k.y, l)) * smoothstep(0.0, 0.05, l) * (0.45 + 1.1 * texture2D(tNoise, st * 2.6 + 0.3).b);
  return vec3(d / max(l, 1.0e-3) * w, w);
}`)
        .replace('#include <map_fragment>', `#include <map_fragment>
vec2 lq = lifeP.xz - uO.xz; vec2 st = vec2(dot(lq, uAx.xy), dot(lq, uAx.zw)) / uZ;
vec4 bk = texture2D(tBank, st / 0.42); float nz = texture2D(tNoise, st * 0.8).a;
vec2 e = vec2((st.x - 0.02) / 0.76, (st.y - 0.66) / 0.5); float ang = atan(e.y, e.x);
float r = length(e) / (1.0 + 0.08 * sin(3.0 * ang + 1.3) + 0.06 * sin(5.0 * ang + 0.4) + 0.035 * sin(8.0 * ang + 2.0) + (nz - 0.5) * 0.16);
float dF = length(st - uFoot.xy), reach = uSpread * 1.75;
float grow = step(0.001, uSpread) * (1.0 - smoothstep(reach - 0.1, reach + 0.02, dF + (bk.a - 0.5) * 0.12));
if (r > 2.1 || grow < 0.001) discard;                      // (most of the floor: nothing there, nothing to work out)
float pond = (1.0 - smoothstep(0.97, 1.0, r + (bk.a - 0.6) * 0.04)) * grow;
float edge = (1.0 - smoothstep(1.01, 1.08, r + (bk.a - 0.55) * 0.1)) * grow * step(0.4, bk.a);
float gloom = 0.2 * (1.0 - smoothstep(0.95, 1.9, r + (nz - 0.5) * 0.5)) * grow;
vec3 c = cDeep;
if (pond > 0.002) {
  // the water: what it reflects from where you stand, bent by its own slow ripples and by the rings
  vec3 V = normalize(lifeP - cameraPosition), Vs = vec3(dot(V.xz, uAx.xy), V.y, dot(V.xz, uAx.zw));
  vec2 slope = ((texture2D(tNoise, st * 1.5 + uTime * vec2(0.02, 0.012)).rg - 0.5) + (texture2D(tNoise, st * 4.1 - uTime * vec2(0.045, 0.02)).ba - 0.5) * 0.6) * 0.03;
  vec3 r1 = rings(st, uFoot.xy, uFall, 86.0, 9.5), r2 = rings(st, uFoot.zw, uWash, 72.0, 8.5);
  slope += (r1.xy + r2.xy) * 0.05;
  vec3 D = reflect(Vs, normalize(vec3(-slope.x, 1.0, -slope.y * 2.2))); D.y = abs(D.y) + 1.0e-4; D.xz += 1.0e-5;
  vec3 refl = scene(vec3(st.x, 0.0, st.y), D);
  c = mix(cDeep, refl * vec3(1.0, 0.88, 0.74), mix(0.84, 0.5, clamp(-Vs.y, 0.0, 1.0)));
  c += cCloud * (max(r1.z, 0.0) + max(r2.z, 0.0)) * 0.07;
  // froth where the water lands, drawn out and breaking up as it drifts off
  vec2 d1 = (st - uFoot.xy) * vec2(0.8, 1.5), d2 = (st - uFoot.zw) * vec2(0.9, 1.5); float l1 = length(d1), l2 = length(d2), tf = uTime * 0.32;
  float f1 = uFall.x * step(0.01, uFall.y) * (1.0 - smoothstep(0.02, 0.15, l1)), f2 = uWash.x * step(0.01, uWash.y) * (1.0 - smoothstep(0.02, 0.17, l2));
  float fn = texture2D(tNoise, st * 6.5 + normalize(d1 + 1.0e-4) * -tf).g * 0.6 + texture2D(tNoise, st * 15.0 + vec2(tf, -tf * 0.6)).r * 0.4;
  float fm = max(f1, f2); c = mix(c, cFoam, smoothstep(0.46, 0.78, fn + fm * 0.3 - 0.1) * smoothstep(0.0, 0.3, fm) * 0.8);
  c = mix(c, bk.rgb * 0.5, smoothstep(0.86, 1.0, r) * 0.55);                 // shallow and weedy at the edge
}
vec3 mud = bk.rgb * 0.62 * (cAmb + cSun * 0.45);
float aw = pond * 0.97, ae = edge * 0.95 * (1.0 - aw);
fA = 1.0 - (1.0 - gloom) * (1.0 - ae) * (1.0 - aw);
fCol = (mud * ae + c * aw) / max(fA, 1.0e-3);`)
        .replace('#include <opaque_fragment>', '  outgoingLight = fCol; diffuseColor.a = fA;\n#include <opaque_fragment>');
    };
    m.customProgramCacheKey = () => 'watermill-floor';
    this.floor = new THREE.Mesh(g, m); this.floor.renderOrder = 5;
    L.add(this.floor);
    // (it lies on the floor: kept out of the floor's own reflection, which shows and hides by material)
    const fl = L.k.museum.floors; if (fl && !fl.includes(this.floor)) fl.push(this.floor);
  },

  // ---------------------------------------------------------------- everything solid: banks, timber, the roof, stems, grass, wheels, gate, ducks
  buildLand(L, col) {
    const pos = [], nor = [], cl = [], uv = [], inf = [], grw = [], tmp = new THREE.Vector3(), R = () => L.rand();
    let part = 0, grow = [0, 0, 0, 1];
    // grow: [when (build clock), how (0 always there, 1 stood up from its foot, 2 dropped into place, 3 tiled), its foot (m over the floor), how long]
    const vert = (p, n, c, t, tex, sway = 0, lever = 0) => {
      if (part) pos.push((L.tx * p[0] + L.nx * p[2]) * Z, p[1] * Z, (L.tz * p[0] + L.nz * p[2]) * Z);
      else { this.W(p[0], p[1], p[2], tmp); pos.push(tmp.x, tmp.y, tmp.z); }
      nor.push(L.tx * n[0] + L.nx * n[2], n[1], L.tz * n[0] + L.nz * n[2]);
      cl.push(c.r, c.g, c.b); uv.push(t[0], t[1]); inf.push(tex, sway, part, lever);
      grw.push(grow[0], grow[1], grow[1] === 3 ? t[2] || 0 : L.y + grow[2] * Z, grow[3]);
    };
    const quad = (a, b, c, d, n, k, tex, ta, tb, tc, td) => { vert(a, n, k, ta, tex); vert(b, n, k, tb, tex); vert(c, n, k, tc, tex); vert(a, n, k, ta, tex); vert(c, n, k, tc, tex); vert(d, n, k, td, tex); };
    const C = (r, g, b) => new THREE.Color(r, g, b);
    const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
    const norm = a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }, neg = a => [-a[0], -a[1], -a[2]], mix3 = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
    const WOOD = C(1, 1, 1), SHADE = C(0.62, 0.6, 0.58), PALE = C(1.3, 1.24, 1.08), WET = C(0.5, 0.5, 0.44);
    const TS = 0.2, TR = 0.215;                             // metres to one repeat of the timber, and of the tiles
    const rgbOf = (hex, a = 0.2) => { const k = col(hex, a).clone().convertLinearToSRGB(); return [k.r, k.g, k.b].map(v => Math.round(255 * clamp01(v))).join(','); };
    const patch = (g, w, h, x, y, rx, ry, rgb, a) => {
      const rot = (R() - 0.5) * 0.5;
      for (const ox of [-w, 0, w]) for (const oy of [-h, 0, h]) {
        const X = x + ox, Y = y + oy; if (X < -rx || X > w + rx || Y < -ry || Y > h + ry) continue;
        g.save(); g.translate(X, Y); g.rotate(rot); g.scale(rx, ry);
        const gr = g.createRadialGradient(0, 0, 0, 0, 0, 1); gr.addColorStop(0, `rgba(${rgb},${a})`); gr.addColorStop(0.6, `rgba(${rgb},${a * 0.55})`); gr.addColorStop(1, `rgba(${rgb},0)`);
        g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 1, 0, TAU); g.fill(); g.restore();
      }
    };
    // His timber, painted once (it tiles): boards of uneven width, each its own weathered grey, the grain running
    // along them in long thin streaks, the seams between them dark and not ruled; then, soft over it all, places
    // silvered by the weather, and dark and green ones where the wet stays.
    this.tWood = canvasTexture(512, 512, (g, w, h) => {
      const tones = ['#6f6a5c', '#7b7566', '#5d5a50', '#857c68', '#676052', '#8c8674', '#59544a', '#74684f', '#7f7a6c'].map(c => col(c, 0.2).getStyle());
      const pale = rgbOf('#b3ab94'), dark = rgbOf('#2e2a22'), brown = rgbOf('#5b4a34'), green = rgbOf('#4b5230');
      g.fillStyle = col('#6a6456', 0.2).getStyle(); g.fillRect(0, 0, w, h);
      for (let y = 0; y < h;) {
        const bh = Math.min(h - y, 40 + Math.floor(R() * 44));
        g.globalAlpha = 0.5 + 0.45 * R(); g.fillStyle = tones[Math.floor(R() * tones.length)]; g.fillRect(0, y, w, bh);
        for (let i = 0; i < 40; i++) {
          const x0 = R() * w, len = 50 + R() * 260, yy = y + 1 + R() * (bh - 2), b1 = (R() - 0.5) * 3, b2 = (R() - 0.5) * 2, k = R();
          g.globalAlpha = 0.1 + 0.26 * R(); g.strokeStyle = `rgb(${k < 0.42 ? pale : k < 0.84 ? dark : brown})`; g.lineWidth = 0.6 + R() * 1.7;
          for (const ox of [-w, 0]) { g.beginPath(); g.moveTo(x0 + ox, yy); g.quadraticCurveTo(x0 + ox + len / 2, yy + b1, x0 + ox + len, yy + b2); g.stroke(); }
        }
        if (R() < 0.6) { const kx = R() * w, ky = y + 6 + R() * (bh - 12); g.globalAlpha = 0.5; g.fillStyle = `rgb(${dark})`; g.beginPath(); g.ellipse(kx, ky, 3 + R() * 3, 1.6 + R() * 1.4, 0, 0, TAU); g.fill(); }
        // the seam: a dark line that wanders, and the worn pale edge of the board under it
        const yb = y + bh;
        g.globalAlpha = 0.62; g.strokeStyle = `rgb(${dark})`; g.lineWidth = 1.5; g.beginPath(); g.moveTo(0, yb - 0.8);
        const w1 = (R() - 0.5) * 2, w2 = (R() - 0.5) * 2; g.bezierCurveTo(w * 0.3, yb - 0.8 + w1, w * 0.7, yb - 0.8 + w2, w, yb - 0.8); g.stroke();
        g.globalAlpha = 0.2; g.strokeStyle = `rgb(${pale})`; g.lineWidth = 1; g.beginPath(); g.moveTo(0, y + 1.6); g.lineTo(w, y + 1.6); g.stroke();
        y += bh;
      }
      g.globalAlpha = 1;
      for (let i = 0; i < 16; i++) patch(g, w, h, R() * w, R() * h, 30 + R() * 60, 8 + R() * 16, pale, 0.14 + 0.2 * R());
      for (let i = 0; i < 14; i++) patch(g, w, h, R() * w, R() * h, 24 + R() * 50, 10 + R() * 22, dark, 0.14 + 0.2 * R());
      for (let i = 0; i < 9; i++) patch(g, w, h, R() * w, R() * h, 18 + R() * 40, 8 + R() * 18, green, 0.12 + 0.16 * R());
    });
    this.tWood.wrapS = this.tWood.wrapT = THREE.RepeatWrapping; this.tWood.anisotropy = 4;
    // His great roof, painted once (it tiles along the eaves): pantiles in courses, twenty to a repeat, each tile its
    // own orange-red with its roll lit on the left and its channel dark on the right, the lip of each course catching
    // the light over the shadow it throws on the one below; then soot, lichen and a few new tiles, soft over it all.
    this.tTile = canvasTexture(512, 512, (g, w, h) => {
      const tones = ['#a04a2a', '#ab552c', '#934327', '#b46033', '#853a23', '#a35030', '#9a472b', '#ad5a33', '#8e442a', '#7c3a26'].map(c => col(c, 0.22).getStyle());
      const lit = rgbOf('#d99263', 0.15), dark = rgbOf('#3a1d18'), soot = rgbOf('#43342c'), lichen = rgbOf('#8f8463'), fresh = col('#c96d38', 0.15).getStyle();
      const cw = w / 20, rh = h / 16;
      g.fillStyle = col('#a84e2b', 0.2).getStyle(); g.fillRect(0, 0, w, h);
      for (let r = 0; r < 16; r++) for (let c = 0; c < 20; c++) {
        const x = c * cw, y = r * rh, jy = (R() - 0.5) * 1.6, k = R();
        g.globalAlpha = 0.6 + 0.4 * R(); g.fillStyle = k < 0.03 ? fresh : tones[Math.floor(R() * tones.length)]; g.fillRect(x + 0.4, y + jy, cw - 0.5, rh);
        g.globalAlpha = 0.14 + 0.14 * R(); g.fillStyle = `rgb(${lit})`; g.fillRect(x + cw * 0.18, y + jy, cw * 0.3, rh);
        g.globalAlpha = 0.3 + 0.2 * R(); g.fillStyle = `rgb(${dark})`; g.fillRect(x + cw * 0.8, y + jy, cw * 0.2, rh);
        g.globalAlpha = 0.24; g.fillStyle = `rgb(${lit})`; g.fillRect(x, y + jy + rh - 5, cw, 2);
        g.globalAlpha = 0.5 + 0.2 * R(); g.fillStyle = `rgb(${dark})`; g.fillRect(x, y + jy + rh - 2.4, cw, 2.4);
      }
      g.globalAlpha = 1;
      for (let i = 0; i < 22; i++) patch(g, w, h, R() * w, R() * h, 26 + R() * 70, 30 + R() * 80, soot, 0.2 + 0.26 * R());
      for (let i = 0; i < 14; i++) patch(g, w, h, R() * w, R() * h, 16 + R() * 40, 12 + R() * 30, lichen, 0.12 + 0.16 * R());
      for (let i = 0; i < 9; i++) patch(g, w, h, R() * w, R() * h, 34 + R() * 70, 24 + R() * 50, rgbOf('#c0623a', 0.15), 0.14 + 0.16 * R());
    });
    this.tTile.wrapS = this.tTile.wrapT = THREE.RepeatWrapping; this.tTile.anisotropy = 4;

    // A length of timber from p0 to p1, w across and d deep (towards `ref`: up, or out of the wall for an upright), the
    // grain running along it.
    const beam = (p0, p1, w, d, tint = WOOD, ref = null, tex = 0) => {
      const a = sub(p1, p0), len = Math.hypot(a[0], a[1], a[2]), ax = norm(a), rf = ref || (Math.abs(ax[1]) > 0.8 ? [0, 0, 1] : [0, 1, 0]);
      const s = norm(cross(ax, rf)), t = norm(cross(s, ax)), u0 = R() * 3, v0 = R() * 3, endc = tint.clone().multiplyScalar(0.72);
      const pt = (e, i, j) => { const q = e ? p1 : p0; return [q[0] + s[0] * i * w / 2 + t[0] * j * d / 2, q[1] + s[1] * i * w / 2 + t[1] * j * d / 2, q[2] + s[2] * i * w / 2 + t[2] * j * d / 2]; };
      for (const [nv, i0, j0, i1, j1, wd] of [[t, -1, 1, 1, 1, w], [neg(t), 1, -1, -1, -1, w], [s, 1, 1, 1, -1, d], [neg(s), -1, -1, -1, 1, d]]) {
        const vv = v0 + R() * 2;
        quad(pt(0, i0, j0), pt(1, i0, j0), pt(1, i1, j1), pt(0, i1, j1), nv, tint, tex, [u0, vv], [u0 + len / TS, vv], [u0 + len / TS, vv + wd / TS], [u0, vv + wd / TS]);
      }
      quad(pt(0, -1, -1), pt(0, 1, -1), pt(0, 1, 1), pt(0, -1, 1), neg(ax), endc, tex, [u0, v0], [u0 + w / TS, v0], [u0 + w / TS, v0 + d / TS], [u0, v0 + d / TS]);
      quad(pt(1, -1, -1), pt(1, 1, -1), pt(1, 1, 1), pt(1, -1, 1), ax, endc, tex, [u0, v0], [u0 + w / TS, v0], [u0 + w / TS, v0 + d / TS], [u0, v0 + d / TS]);
    };
    const tintOf = (k = 0.16) => { const v = 1 + (R() - 0.5) * 2 * k; return C(v, v * (0.98 + 0.04 * R()), v * (0.94 + 0.06 * R())); };

    // ---- the banks: the high one on the left that the flume comes off, the low ground behind, the mill's yard in the sun
    grow = [0.05, 1, -0.012, 1.0];
    {
      const NU = 46, NO = 18, x0 = -0.8, x1 = 0.81, z0 = -0.035, z1 = 0.8, cA = C(0.66, 0.7, 0.54), cYard = C(1.55, 1.4, 1.08), cWet = C(0.5, 0.46, 0.38), cc = new THREE.Color();
      const Pt = (i, j) => { const x = x0 + (x1 - x0) * i / NU, z = z0 + (z1 - z0) * j / NO; return [x, ground(x, z), z]; };
      const Nn = (x, z) => { const e = 0.02, dx = (ground(x + e, z) - ground(x - e, z)) / (2 * e), dz = (ground(x, z + e) - ground(x, z - e)) / (2 * e), l = Math.hypot(dx, 1, dz); return [-dx / l, 1 / l, -dz / l]; };
      const vv = p => {
        const yard = sm(ramp(p[0], 0.3, 0.5)) * sm(ramp(p[2], 0.3, 0.46)) * (0.75 + 0.25 * Math.sin(p[0] * 31 + p[2] * 17)), meadow = 0.5 * sm(ramp(p[1], 0.1, 0.17));
        cc.copy(cA).lerp(cYard, Math.max(yard, meadow * 0.5)).lerp(cWet, sm(ramp(p[2], shore(p[0]) - 0.15, shore(p[0]) + 0.02)) * 0.8);
        vert(p, Nn(p[0], p[2]), cc, [(p[0] + p[1] * 0.8) / 0.4, (p[2] + p[1] * 0.6) / 0.4], 1);
      };
      for (let i = 0; i < NU; i++) for (let j = 0; j < NO; j++) { const a = Pt(i, j), b = Pt(i + 1, j), c = Pt(i + 1, j + 1), d = Pt(i, j + 1); vv(a); vv(b); vv(c); vv(a); vv(c); vv(d); }
    }
    // ---- the trestle: a crowd of posts, none quite upright, the two at the spill standing tall with a bar across
    const knocks = this.knocks = [];
    const post = (x, z, top, born, w = 0.013, tint = null) => {
      const g0 = Math.max(0, ground(x, z)) - 0.012, lx = (R() - 0.5) * 0.016, lz = (R() - 0.5) * 0.008;
      grow = [born, 1, g0, 0.3]; beam([x - lx, g0, z - lz], [x + lx, top, z + lz], w + 0.003 * R(), w, tint || tintOf(0.2)); knocks.push(born + 0.24);
    };
    const FX = [-0.545, -0.47, -0.385, -0.3], BX = [-0.545, -0.47, -0.385, -0.3, 0.03], zf = 0.553, zb = 0.447;
    FX.forEach((x, i) => post(x, zf, 0.358 + 0.014 * R(), 0.34 + i * 0.09));
    BX.forEach((x, i) => post(x, zb, 0.358 + 0.014 * R(), 0.38 + i * 0.09, 0.013, C(0.74, 0.72, 0.7)));
    post(-0.199, zf, 0.49, 0.62, 0.015); post(-0.061, zf, 0.497, 0.7, 0.015); post(-0.199, zb, 0.375, 0.66, 0.013, SHADE); post(-0.061, zb, 0.37, 0.74, 0.013, SHADE);
    // the bearers under the trough (the last one let into the mill's wall), and a strut or two
    [-0.545, -0.47, -0.385, -0.3, -0.199, -0.061, 0.03].forEach((x, i) => { grow = [0.72 + i * 0.05, 2, 0, 0.26]; beam([x + 0.004, 0.283, 0.436], [x - 0.004, 0.283, 0.566], 0.014, 0.013, tintOf(0.18)); });
    grow = [1.0, 2, 0, 0.26]; beam([0.128, 0.297, 0.428], [0.128, 0.297, 0.462], 0.016, 0.014, SHADE);
    grow = [0.9, 2, 0, 0.26]; beam([-0.46, 0.02, 0.561], [-0.392, 0.276, 0.561], 0.011, 0.011, tintOf(0.2)); beam([-0.29, 0.03, 0.44], [-0.21, 0.274, 0.44], 0.011, 0.011, SHADE);
    grow = [1.2, 2, 0, 0.26]; beam([-0.21, 0.482, zf], [-0.05, 0.487, zf], 0.013, 0.014, PALE, [0, 0, 1]); knocks.push(1.44);
    // ---- the flume: a floor and two sides, in lengths, laid from the bank to the mill; the near side is cut down at the spill
    {
      const J = [-0.56, -0.47, -0.385, -0.3, SPILL[0], SPILL[1], 0.03, FL.x1];
      for (let i = 0; i < J.length - 1; i++) {
        const a = J[i] - 0.003, b = J[i + 1] + 0.003, dy = (R() - 0.5) * 0.004, born = 0.84 + i * 0.075, spill = i === 4;
        grow = [born, 2, 0, 0.26]; knocks.push(born + 0.22);
        beam([a, 0.294 + dy, 0.5], [b, 0.294 - dy, 0.5], 0.098, 0.011, C(0.82, 0.8, 0.76));
        beam([a, 0.321 + dy, 0.4585], [b, 0.321 - dy, 0.4585], 0.008, 0.058, tintOf(0.14));
        if (spill) beam([a, 0.301, 0.5415], [b, 0.301, 0.5415], 0.008, 0.02, WET);
        else beam([a, 0.321 + dy, 0.5415], [b, 0.321 - dy, 0.5415], 0.008, 0.058, tintOf(0.14));
      }
      // the water in it: a strip under the brim, shown as far as the stream has come (the shader)
      grow = [0, 0, 0, 1];
      quad([FL.x0, 0.337, 0.463], [FL.x1, 0.337, 0.463], [FL.x1, 0.337, 0.537], [FL.x0, 0.337, 0.537], [0, 1, 0], WOOD, 7, [FL.x0, 0], [FL.x1, 0], [FL.x1, 1], [FL.x0, 1]);
    }
    // ---- the mill: a stone foot at the water, boarded walls, a door and a small window, and the roof
    const wallQuad = (a, b, y0, y1, n, tint, born) => {      // a, b: [x, z] at the wall's two ends; boards upright
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]), u0 = R() * 3, v0 = R() * 3;
      grow = [born, 1, -0.012, 0.42];
      const ym = y1 - 0.055, dim = tint.clone().multiplyScalar(0.5);      // (the eaves' shadow along the top of the wall)
      quad([a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], ym, b[1]], [a[0], ym, a[1]], n, tint, 0, [u0 + y0 / TS, v0], [u0 + y0 / TS, v0 + len / TS], [u0 + ym / TS, v0 + len / TS], [u0 + ym / TS, v0]);
      for (const [p, k, t] of [[[a[0], ym, a[1]], tint, [u0 + ym / TS, v0]], [[b[0], ym, b[1]], tint, [u0 + ym / TS, v0 + len / TS]], [[b[0], y1, b[1]], dim, [u0 + y1 / TS, v0 + len / TS]], [[a[0], ym, a[1]], tint, [u0 + ym / TS, v0]], [[b[0], y1, b[1]], dim, [u0 + y1 / TS, v0 + len / TS]], [[a[0], y1, a[1]], dim, [u0 + y1 / TS, v0]]]) vert(p, n, k, t, 0);
    };
    const STONE = col('#4a4438', 0.3), DARK = col('#1c1712', 0.2), wallTint = C(0.86, 0.84, 0.8), wallDim = C(0.6, 0.6, 0.6);
    {
      const M = MILL, E = EXT;
      for (const [a, b, n, tint, eave, born] of [
        [[M.x0, M.z1], [M.x1, M.z1], [0, 0, 1], wallTint, M.eave, 0.5], [[M.x0, M.z0], [M.x0, M.z1], [-1, 0, 0], wallTint, M.eave, 0.56], [[M.x1, M.z0], [M.x1, M.z1], [1, 0, 0], wallDim, M.eave, 0.62], [[M.x0, M.z0], [M.x1, M.z0], [0, 0, -1], wallDim, M.eave, 0.6],
        [[E.x0, E.z1], [E.x1, E.z1], [0, 0, 1], wallTint, E.eave, 0.68], [[E.x1, E.z0], [E.x1, E.z1], [1, 0, 0], wallDim, E.eave, 0.74], [[E.x0, E.z0], [E.x1, E.z0], [0, 0, -1], wallDim, E.eave, 0.72]]) {
        wallQuad(a, b, 0.07, eave, n, tint, born);
        grow = [born - 0.1, 1, -0.012, 0.3];
        const o = 0.004; quad([a[0] + n[0] * o, -0.012, a[1] + n[2] * o], [b[0] + n[0] * o, -0.012, b[1] + n[2] * o], [b[0] + n[0] * o, 0.074, b[1] + n[2] * o], [a[0] + n[0] * o, 0.074, a[1] + n[2] * o], n, STONE, 2, [a[0] * 9, 0], [b[0] * 9 + b[1] * 9, 0], [b[0] * 9 + b[1] * 9, 1], [a[0] * 9, 1]);
      }
      // the gables: boards up to the ridge at the mill's right end (over the lower roof) and at the far end of that
      const gable = (x, z0, z1, e, r, n, tint, born) => { grow = [born, 1, -0.012, 0.42]; const zr = (z0 + z1) / 2, u0 = R() * 3; for (const p of [[x, e, z0], [x, e, z1], [x, r, zr]]) vert(p, n, tint, [u0 + p[1] / TS, p[2] / TS], 0); };
      gable(M.x1, M.z0, M.z1, M.eave, M.ridge - 0.05, [1, 0, 0], wallDim, 0.66); gable(E.x1, E.z0, E.z1, E.eave - 0.012, E.ridge - 0.02, [1, 0, 0], wallDim, 0.78);
      // openings: soft-edged darks (the door stands open, as he has it, and nobody is in it)
      const mark = (x, y, w, h, z, born) => { grow = [born, 1, -0.012, 0.42]; quad([x - w / 2, y, z], [x + w / 2, y, z], [x + w / 2, y + h, z], [x - w / 2, y + h, z], [0, 0, 1], DARK, 5, [0, 0], [1, 0], [1, 1], [0, 1]); };
      mark(0.6, 0.05, 0.05, 0.13, E.z1 + 0.0025, 0.68); mark(0.36, 0.16, 0.034, 0.04, M.z1 + 0.0025, 0.5); mark(0.45, 0.2, 0.02, 0.026, M.z1 + 0.0025, 0.5);
      // the roof: the great slope to the front, hipped at the left, the same behind; the lower roof on the right
      const roof = (e0, e1, r1, r0, ns, nt, born, dur, tint = WOOD) => {
        let n = norm(cross(sub(e1, e0), sub(mix3(r0, r1, 0.5), e0))); if (n[1] < 0) n = neg(n);
        const ed = norm(sub(e1, e0)), off = R() * 3;
        const Pt = (s, t) => {
          const a = mix3(e0, e1, s), b = mix3(r0, r1, s), p = mix3(a, b, t), sl = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
          p[1] -= 0.011 * Math.sin(Math.PI * s) * Math.sin(Math.PI * Math.min(1, t * 0.95 + 0.1)) + 0.003 * Math.sin(s * 11 + t * 4);
          const along = (p[0] - e0[0]) * ed[0] + (p[1] - e0[1]) * ed[1] + (p[2] - e0[2]) * ed[2];
          return { p, t: [off + along / TR, t * sl / TR, t] };
        };
        grow = [born, 3, 0, dur];
        for (let i = 0; i < ns; i++) for (let j = 0; j < nt; j++) { const a = Pt(i / ns, j / nt), b = Pt((i + 1) / ns, j / nt), c = Pt((i + 1) / ns, (j + 1) / nt), d = Pt(i / ns, (j + 1) / nt); for (const q of [a, b, c, a, c, d]) vert(q.p, n, tint, q.t, 6); }
      };
      // (the ridge runs down to the right, as his does; the hip at the left end is the face his sun is on)
      const ov = 0.024, rl = 0.2, ry = M.ridge, rr = ry - 0.05, DIMR = C(0.62, 0.6, 0.62), HIP = C(1.12, 1.08, 1.0), LOW = C(0.74, 0.68, 0.66);
      roof([M.x0 - ov, M.eave - 0.022, M.z1 + ov], [M.x1 + 0.012, M.eave, M.z1 + ov], [M.x1 + 0.012, rr, M.zr], [rl, ry, M.zr], 10, 6, 1.02, 0.86);
      roof([M.x0 - ov, M.eave - 0.016, M.z0 - ov], [M.x0 - ov, M.eave - 0.022, M.z1 + ov], [rl, ry, M.zr], [rl, ry, M.zr], 5, 6, 1.08, 0.8, HIP);
      roof([M.x1 + 0.012, M.eave, M.z0 - ov], [M.x0 - ov, M.eave - 0.016, M.z0 - ov], [rl, ry, M.zr], [M.x1 + 0.012, rr, M.zr], 6, 4, 1.1, 0.8, DIMR);
      const er = (E.z0 + E.z1) / 2;
      roof([E.x0, E.eave, E.z1 + ov], [E.x1 + ov, E.eave - 0.012, E.z1 + ov], [E.x1 + ov, E.ridge - 0.02, er], [E.x0, E.ridge, er], 5, 5, 1.3, 0.62, LOW);
      roof([E.x1 + ov, E.eave - 0.012, E.z0 - ov], [E.x0, E.eave, E.z0 - ov], [E.x0, E.ridge, er], [E.x1 + ov, E.ridge - 0.02, er], 3, 3, 1.34, 0.6, DIMR);
      // his two dark vents in the great slope
      {
        const at = (s, t) => { const e = mix3([M.x0 - ov, M.eave - 0.022, M.z1 + ov], [M.x1, M.eave, M.z1 + ov], s), r = mix3([rl, ry, M.zr], [M.x1, rr, M.zr], s); return mix3(e, r, t); };
        for (const [s, t] of [[0.42, 0.56], [0.47, 0.3]]) { grow = [1.8, 1, -0.012, 0.3]; const a = at(s - 0.03, t - 0.035), b = at(s + 0.03, t - 0.035), c = at(s + 0.03, t + 0.035), d = at(s - 0.03, t + 0.035); for (const q of [a, b, c, d]) { q[1] += 0.003; q[2] += 0.004; } quad(a, b, c, d, [0, 0.5, 0.87], DARK, 5, [0, 0], [1, 0], [1, 1], [0, 1]); }
      }
      // ridge tiles, and the chimney
      const RIDGE = col('#7d3d27', 0.25);
      grow = [1.86, 2, 0, 0.24]; beam([rl - 0.004, ry + 0.001, M.zr], [M.x1 + 0.014, rr + 0.001, M.zr], 0.02, 0.011, RIDGE, null, 2); beam([E.x0, E.ridge + 0.002, er], [E.x1 + ov, E.ridge - 0.018, er], 0.018, 0.01, RIDGE, null, 2);
      grow = [1.92, 2, 0, 0.24]; beam([0.585, E.ridge - 0.03, er], [0.586, E.ridge + 0.062, er], 0.03, 0.026, col('#7a4a36', 0.25), null, 2); knocks.push(2.1);
    }
    // ---- the landing by the near wheel, and the boards lying at the far one's foot
    {
      for (const [x, z, born] of [[0.27, 0.575, 1.4], [0.27, 0.625, 1.42], [0.4, 0.578, 1.46], [0.4, 0.628, 1.48]]) { grow = [born, 1, -0.012, 0.26]; beam([x, -0.012, z], [x + (R() - 0.5) * 0.01, 0.07, z], 0.011, 0.011, tintOf(0.2)); }
      grow = [1.56, 2, 0, 0.26]; beam([0.245, 0.078, 0.586], [0.5, 0.07, 0.59], 0.03, 0.008, PALE); beam([0.25, 0.076, 0.618], [0.53, 0.066, 0.622], 0.03, 0.008, tintOf(0.1)); knocks.push(1.78);
      grow = [1.62, 2, 0, 0.26]; beam([-0.47, 0.05, 0.6], [-0.27, 0.022, 0.612], 0.028, 0.008, tintOf(0.14)); beam([-0.5, 0.075, 0.585], [-0.33, 0.062, 0.588], 0.022, 0.008, SHADE);
    }
    // ---- his trees' stems: grey, twisted, lit on the left (the crowns are soft cards, made later)
    {
      const bark = col('#2e281d', 0.3), barkLit = col('#6b624c', 0.3), cc = new THREE.Color();
      const limb = (pts, r0, r1, born) => {
        const NS = 7, n = pts.length - 1, ring = [];
        grow = [born, 1, pts[0][1], 0.7];
        for (let i = 0; i <= n; i++) { const t = i / n, rr = r0 + (r1 - r0) * t; ring.push(Array.from({ length: NS + 1 }, (_, j) => { const ph = j / NS * TAU; return { p: [pts[i][0] + Math.cos(ph) * rr, pts[i][1], pts[i][2] + Math.sin(ph) * rr], n: [Math.cos(ph), 0.1, Math.sin(ph)] }; })); }
        for (let i = 0; i < n; i++) for (let j = 0; j < NS; j++) for (const v of [ring[i][j], ring[i][j + 1], ring[i + 1][j + 1], ring[i][j], ring[i + 1][j + 1], ring[i + 1][j]]) { cc.copy(bark).lerp(barkLit, clamp01(-v.n[0] * 0.55 + v.n[2] * 0.25 + 0.3)); vert(v.p, v.n, cc, [j, i], 2); }
      };
      const gy = (x, z) => ground(x, z) - 0.01;
      limb([[-0.6, gy(-0.6, 0.22), 0.22], [-0.588, 0.4, 0.22], [-0.61, 0.5, 0.215], [-0.635, 0.62, 0.21], [-0.63, 0.72, 0.2]], 0.025, 0.007, 0.6);
      limb([[-0.53, gy(-0.53, 0.25), 0.25], [-0.512, 0.36, 0.245], [-0.48, 0.47, 0.24], [-0.455, 0.58, 0.23], [-0.45, 0.66, 0.22]], 0.018, 0.006, 0.66);
      limb([[-0.592, 0.41, 0.22], [-0.65, 0.5, 0.21], [-0.7, 0.57, 0.2]], 0.009, 0.004, 0.9); limb([[-0.5, 0.42, 0.243], [-0.53, 0.52, 0.23], [-0.55, 0.6, 0.22]], 0.007, 0.003, 0.95);
      limb([[-0.3, gy(-0.3, 0.12), 0.12], [-0.29, 0.22, 0.12], [-0.31, 0.36, 0.115]], 0.008, 0.004, 0.8); limb([[-0.12, gy(-0.12, 0.1), 0.1], [-0.13, 0.2, 0.1], [-0.11, 0.35, 0.1]], 0.008, 0.004, 0.85);
      limb([[0.36, gy(0.36, 0.5), 0.5], [0.348, 0.19, 0.5], [0.368, 0.31, 0.495], [0.4, 0.41, 0.49], [0.41, 0.48, 0.49]], 0.0095, 0.0035, 1.1);
      limb([[0.63, gy(0.63, 0.5), 0.5], [0.644, 0.24, 0.5], [0.632, 0.43, 0.5], [0.648, 0.62, 0.5], [0.64, 0.8, 0.5]], 0.0115, 0.003, 1.0);
      limb([[0.642, 0.5, 0.5], [0.68, 0.58, 0.5], [0.7, 0.64, 0.5]], 0.005, 0.002, 1.3);
    }
    // ---- grass and weeds along the water: thin blades, three joints each, stirring a little (the shader)
    {
      const dk = col('#262a1a', 0.3), md = col('#43461f', 0.3), tip = col('#6f6a3c', 0.3), cc = new THREE.Color(), up = [-0.3, 0.8, 0.5];
      const blade = (bx, bz, hgt, yaw, lean) => {
        const w = 0.003 + 0.002 * R(), cx = Math.cos(yaw), sx = Math.sin(yaw), J = 3, by = Math.max(0, ground(bx, bz)) - 0.004;
        const at = (k, side) => { const t = k / J, off = lean * t * t * hgt, ww = w * (1 - 0.75 * t) * side; return [bx + cx * off + sx * ww, by + hgt * t * (1 - 0.18 * lean * t), bz + sx * off - cx * ww]; };
        for (let k = 0; k < J; k++) for (const [kk, sd] of [[k, -1], [k, 1], [k + 1, 1], [k, -1], [k + 1, 1], [k + 1, -1]]) { const t = kk / J; cc.copy(dk).lerp(md, clamp01(t * 2)).lerp(tip, clamp01(t * 2 - 1)); vert(at(kk, sd), up, cc, [0, 0], 3, t, hgt); }
      };
      const clump = (cx, cz, n, spread, h0, h1) => { grow = [0.7 + 0.5 * R(), 1, Math.max(0, ground(cx, cz)) - 0.004, 0.5]; for (let i = 0; i < n; i++) { const a = R() * TAU, rr = Math.sqrt(R()) * spread; blade(cx + Math.cos(a) * rr * 1.6, cz + Math.sin(a) * rr, h0 + (h1 - h0) * R(), R() * TAU, 0.4 + 0.9 * R()); } };
      clump(-0.6, 0.88, 10, 0.05, 0.04, 0.1); clump(-0.47, 1.0, 8, 0.05, 0.03, 0.09); clump(-0.2, 1.1, 7, 0.05, 0.03, 0.08); clump(0.2, 1.12, 8, 0.05, 0.03, 0.08);
      clump(0.56, 0.98, 10, 0.05, 0.04, 0.1); clump(0.7, 0.8, 8, 0.04, 0.04, 0.09); clump(-0.52, 0.7, 7, 0.03, 0.03, 0.08); clump(0.47, 0.64, 6, 0.03, 0.03, 0.07);
    }

    // ---- the parts that move, each about its own origin: 1 the near wheel, 2 the far wheel, 3 the gate, 4 to 6 the ducks
    grow = [0, 0, 0, 1];
    {
      // A wheel as he draws them: two rims of short felloes, two crossed arms a side, the floats between the rims
      // (one of them new wood, paler: it shows the turning), on a square shaft that goes back into the mill.
      const wheel = (id, tint) => {
        part = id;
        const N = 16, NF = 14, rc = WR - 0.009;
        for (const dz of [-0.029, 0.029]) {
          for (let i = 0; i < N; i++) { const a0 = i / N * TAU, a1 = (i + 1) / N * TAU; beam([Math.sin(a0) * rc, Math.cos(a0) * rc, dz], [Math.sin(a1) * rc, Math.cos(a1) * rc, dz], 0.017, 0.011, tint.clone().multiplyScalar(0.86 + 0.28 * R()), [0, 0, 1]); }
          for (const a of [0.3, 0.3 + Math.PI / 2]) beam([Math.sin(a) * (rc - 0.004), Math.cos(a) * (rc - 0.004), dz * 0.8], [-Math.sin(a) * (rc - 0.004), -Math.cos(a) * (rc - 0.004), dz * 0.8], 0.01, 0.012, tint.clone().multiplyScalar(0.95 + 0.2 * R()), [0, 0, 1]);
        }
        for (let i = 0; i < NF; i++) { const a = (i + 0.5) / NF * TAU, s = Math.sin(a), c = Math.cos(a); beam([s * (WR - 0.034), c * (WR - 0.034), 0], [s * (WR + 0.01), c * (WR + 0.01), 0], 0.072, 0.0045, i === 3 ? tint.clone().multiplyScalar(1.7) : tint.clone().multiplyScalar(0.62 + 0.3 * R()), [c, -s, 0]); }
        beam([0, 0, -0.075], [0, 0, 0.048], 0.024, 0.024, tint.clone().multiplyScalar(0.8), [0.5, 0.86, 0]);
      };
      wheel(1, C(0.98, 0.96, 0.9)); wheel(2, C(0.8, 0.8, 0.8));
      // the spill gate: one board with a cleat, in its frame
      part = 3; beam([-0.059, 0, 0], [0.059, 0, 0], 0.008, 0.052, C(1.22, 1.16, 1.0)); beam([-0.004, -0.02, 0.006], [0.004, 0.05, 0.006], 0.012, 0.006, C(0.9, 0.88, 0.82), [0, 0, 1]);
      // the ducks: small, dark, with a pale touch, as he puts them in; one a drake
      const duck = (id, body, flank, head, bill) => {
        part = id;
        const g = shape.lathe([[0.001, 0], [0.008, 0.004], [0.0165, 0.016], [0.0205, 0.032], [0.02, 0.047], [0.0165, 0.06], [0.0105, 0.07], [0.004, 0.076], [0.001, 0.079]], 12, body), p = g.attributes.position, pn = g.attributes.normal;
        // (the lathe's axis becomes its length, tail to breast; flattened under, the tail lifted; its own smooth normals kept)
        for (let i = 0; i < p.count; i++) {
          const lx = p.getX(i), ly = p.getY(i), lz = p.getZ(i), ks = lz > 0 ? 0.92 : 0.45, nx = pn.getY(i), ny = pn.getZ(i) / ks, nz = pn.getX(i), nl = Math.hypot(nx, ny, nz) || 1;
          p.setXYZ(i, ly - 0.04, lz * ks + 0.009 + 0.014 * sm(ramp(ly, 0.02, 0)), lx); pn.setXYZ(i, nx / nl, ny / nl, nz / nl);
        }
        shape.paint(g, (c, n) => (c.x < -0.027 ? head : Math.abs(n.z) > 0.6 && c.y < 0.02 ? flank : body));
        const neck = shape.move(shape.cyl(0.0075, 0.006, 0.02, 7, head), 0.028, 0.028, 0, 0, 0, -0.35);
        const hd = shape.move(shape.ball(0.0098, head, 1), 0.033, 0.041, 0), bl = shape.move(shape.box(0.014, 0.0038, 0.008, bill), 0.046, 0.038, 0);
        const all = shape.merge([g, neck, hd, bl]), q = all.attributes.position, nn = all.attributes.normal, kc = all.attributes.color;
        for (let i = 0; i < q.count; i++) {
          pos.push((L.tx * q.getX(i) + L.nx * q.getZ(i)) * Z, q.getY(i) * Z, (L.tz * q.getX(i) + L.nz * q.getZ(i)) * Z); nor.push(L.tx * nn.getX(i) + L.nx * nn.getZ(i), nn.getY(i), L.tz * nn.getX(i) + L.nz * nn.getZ(i));
          cl.push(kc.getX(i), kc.getY(i), kc.getZ(i)); uv.push(0, 0); inf.push(4, 0, part, 0); grw.push(0, 0, 0, 1);
        }
      };
      duck(4, col('#6f6a5c', 0.2), col('#a9a48f', 0.2), col('#1f2a22', 0.15), col('#b79a4c', 0.15));
      duck(5, col('#4f3f2b', 0.2), col('#7c6846', 0.2), col('#3b2e20', 0.2), col('#8a6a3a', 0.15));
      duck(6, col('#58462f', 0.2), col('#86714c', 0.2), col('#3e3122', 0.2), col('#8a6a3a', 0.15));
      part = 0;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(cl, 3)); g.setAttribute('aUv', new THREE.Float32BufferAttribute(uv, 2));
    g.setAttribute('aInfo', new THREE.Float32BufferAttribute(inf, 4)); g.setAttribute('aGrow', new THREE.Float32BufferAttribute(grw, 4));
    this.parts = Array.from({ length: N_PART }, () => new THREE.Matrix4().makeScale(0, 0, 0));
    const u = this.su = { ...this.lu, tWood: { value: this.tWood }, tTile: { value: this.tTile }, tBank: { value: this.tBank }, uPart: { value: this.parts }, uFront: { value: -9 }, uWet: { value: 0 }, cWater: { value: col('#8d8672', 0.25) }, cFoam: { value: col('#e4dcc6', 0.15) } };
    const m = new THREE.MeshBasicMaterial({ color: 0xffffff, vertexColors: true, fog: false, side: THREE.DoubleSide });
    m.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, u);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', `#include <common>
attribute vec4 aInfo, aGrow; attribute vec2 aUv; uniform mat4 uPart[${N_PART}]; uniform float uTime, uBuild;
varying vec3 vN; varying vec4 vInfo, vGrow; varying vec2 vUv2; varying float vK;`)
        .replace('#include <begin_vertex>', `#include <begin_vertex>
  vec3 nn = normal; float gk = 1.0;
  if (aInfo.z > 0.5) { mat4 pm = uPart[int(aInfo.z + 0.5) - 1]; transformed = (pm * vec4(position, 1.0)).xyz; nn = mat3(pm) * normal; }
  else if (aGrow.y > 0.5 && aGrow.y < 2.5) {
    float k = clamp((uBuild - aGrow.x) / aGrow.w, 0.0, 1.0); gk = k;
    if (aGrow.y < 1.5) { float q = k - 1.0, e = 1.0 + 2.2 * q * q * q + 1.2 * q * q; transformed.y = aGrow.z + (position.y - aGrow.z) * e; }      // stood up from its foot, a little past and back
    else { float q = 1.0 - k; transformed.y += q * q * 0.11; }                                                                                  // dropped into place
    if (aInfo.y > 0.0) { float ph = position.x * 31.0 + position.z * 17.0; transformed.xz += vec2(0.7, 0.3) * (0.05 * sin(uTime * 1.3 + ph * 0.3) + 0.02 * sin(uTime * 3.1 + ph)) * aInfo.w * aInfo.y * aInfo.y; }
  }
  vN = nn; vInfo = aInfo; vGrow = aGrow; vUv2 = aUv; vK = gk;`);
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', `#include <common>
${LIGHT}
uniform sampler2D tWood, tTile, tBank; uniform float uFront, uWet; uniform vec3 cWater, cFoam;
varying vec3 vN; varying vec4 vInfo, vGrow; varying vec2 vUv2; varying float vK; vec3 fCol;`)
        .replace('#include <map_fragment>', `#include <map_fragment>
{
  if (vK <= 0.003) discard;
  vec2 lq = lifeP.xz - uO.xz; vec3 Ps = vec3(dot(lq, uAx.xy), lifeP.y - uO.y, dot(lq, uAx.zw)) / uZ;
  vec3 n = normalize(vN); if (dot(n, cameraPosition - lifeP) < 0.0) n = -n;
  vec3 ns = vec3(dot(n.xz, uAx.xy), n.y, dot(n.xz, uAx.zw));
  vec3 alb = vColor; float kd = vInfo.x;
  if (kd < 0.5) {
    // timber: his weathered boards, streaked, and dark and green where they stand in the water (that line is ragged)
    float strk = texture2D(tNoise, vUv2 * vec2(0.25, 1.3)).r;
    alb *= texture2D(tWood, vUv2).rgb * (0.78 + 0.44 * strk);
    alb = mix(alb, alb * vec3(0.5, 0.6, 0.4), (1.0 - smoothstep(0.0, 0.07, Ps.y - 0.004 + (strk - 0.5) * 0.06)) * 0.72);
    alb *= 1.0 - 0.3 * uWet * step(0.5, vInfo.z) * step(vInfo.z, 1.5);
  } else if (kd < 1.5) alb *= texture2D(tBank, vUv2).rgb * 0.95;
  else if (kd < 4.5) alb *= kd < 2.5 ? 0.8 + 0.4 * texture2D(tNoise, vUv2 * 0.6 + Ps.xy * 3.0).g : 1.0;
  else if (kd < 5.5) {
    // an opening: the boards' own shadow round its edge, going down into the dark
    vec2 e = min(vUv2, 1.0 - vUv2); float inn = smoothstep(0.0, 0.3, min(e.x, e.y * 0.8));
    alb = mix(vColor * 5.0 + vec3(0.04, 0.035, 0.03), vColor * mix(1.6, 0.6, vUv2.y), inn);
  } else if (kd < 6.5) {
    // the roof, tiled: course by course from the eaves, each course running along from the left, tile by tile
    vec2 tile = floor(vUv2 * vec2(20.0, 16.0));
    float course = vGrow.z - fract(vUv2.y * 16.0) * 0.05, prog = (uBuild - vGrow.x) / vGrow.w;
    float thr = course * 0.72 + 0.2 * clamp((Ps.x + 0.05) / 0.8, 0.0, 1.0) + 0.05 * fract(sin(dot(tile, vec2(12.9898, 78.233))) * 43758.5453);
    if (prog < thr) discard;
    float strk = texture2D(tNoise, vUv2 * vec2(1.2, 0.2)).r, wth = texture2D(tNoise, vUv2 * vec2(0.3, 0.2) + 0.4).g;
    alb *= texture2D(tTile, vUv2).rgb * (0.7 + 0.4 * strk);
    alb = mix(alb, vec3(dot(alb, vec3(0.4))) * vec3(1.0, 0.94, 0.86), smoothstep(0.55, 0.85, wth) * 0.4);
    alb = mix(alb, alb * vec3(0.6, 0.78, 0.42), (1.0 - smoothstep(0.0, 0.3, vGrow.z + (strk - 0.5) * 0.3)) * 0.42);      // moss along the eaves
  } else {
    // the stream in the flume, as far as it has come: grey-brown, streaked along its run, white at its front
    if (Ps.x > uFront) discard;
    float s = texture2D(tNoise, vec2(Ps.x * 1.4 - uTime * 0.5, vUv2.y * 0.7)).r, s2 = texture2D(tNoise, vec2(Ps.x * 4.0 - uTime * 1.1, vUv2.y * 2.0)).b;
    fCol = mix(cWater * (0.5 + 0.5 * s), cFoam, clamp(smoothstep(0.55, 0.75, s * 0.6 + s2 * 0.5) * 0.7 + smoothstep(0.06, 0.0, uFront - Ps.x), 0.0, 1.0)) * (cAmb + cSun * 0.5);
  }
  if (kd < 6.5) fCol = lightOn(alb, ns, Ps);
}`)
        .replace('#include <opaque_fragment>', '  outgoingLight = fCol;\n#include <opaque_fragment>');
    };
    m.customProgramCacheKey = () => 'watermill-land';
    this.land = new THREE.Mesh(g, m); this.land.renderOrder = 1;
    L.add(this.land);
  },

  // ---------------------------------------------------------------- soft cards: his foliage, the falling water, drops, froth, blossom
  buildCards(L, col) {
    const atlas = canvasTexture(512, 512, (g, w, h) => {
      g.clearRect(0, 0, w, h); g.scale(2, 2);
      const R = () => L.rand(), clip = (x, y, f) => { g.save(); g.beginPath(); g.rect(x, y, 128, 128); g.clip(); f(x + 64, y + 64); g.restore(); };
      // Every touch is soft: a spot of paint that feathers out to nothing (no edge anywhere in the atlas, so no card
      // can show a hard or stepped edge at any distance). v: light to dark.
      const touch = (x, y, rx, ry, rot, v, a) => {
        g.save(); g.translate(x, y); g.rotate(rot); g.scale(rx, ry);
        const gr = g.createRadialGradient(0, 0, 0, 0, 0, 1); gr.addColorStop(0, `rgba(${v},${v},${v},${a})`); gr.addColorStop(0.5, `rgba(${v},${v},${v},${a * 0.72})`); gr.addColorStop(1, `rgba(${v},${v},${v},0)`);
        g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 1, 0, TAU); g.fill(); g.restore();
      };
      // His foliage: a dark body in a few lobes (thin or none for a loose spray), and over and round it very many
      // small touches, the ones on the upper left lighter, the outer ones standing clear with the sky between.
      const leaves = (cx, cy, body, n, loose) => {
        const sub = Array.from({ length: 5 }, () => [cx + (R() - 0.5) * 46, cy + (R() - 0.5) * 32, 15 + R() * 11]); sub.push([cx, cy + 3, 25]);
        if (body > 0) for (const q of sub) touch(q[0], q[1], q[2] * 1.18, q[2] * 1.02, 0, 32, body);
        for (let i = 0; i < n; i++) {
          const s = sub[Math.floor(R() * sub.length)], a = R() * TAU, out = R() < loose, rr = (out ? 0.8 + 0.55 * R() : Math.sqrt(R()) * 0.92) * s[2], x = s[0] + Math.cos(a) * rr * 1.1, y = s[1] + Math.sin(a) * rr * 0.9;
          if (Math.abs(x - cx) > 56 || Math.abs(y - cy) > 56) continue;
          const lit = clamp01(0.2 - (x - s[0]) / (s[2] * 2.4) - (y - s[1]) / (s[2] * 1.9) + (R() - 0.5) * 0.55), v = Math.floor(30 + 50 * R() + (lit > 0.4 ? 185 * (lit - 0.4) / 0.6 : 0));
          touch(x, y, 2.1 + R() * 2.4, 1.4 + R() * 1.5, R() * Math.PI, v, out ? 0.82 : 0.64);
        }
      };
      clip(0, 0, (cx, cy) => leaves(cx, cy, 0.96, 640, 0.3));                       // 0: a mass
      clip(128, 0, (cx, cy) => {                                                    // 1: a soft drop, or a breath of mist
        touch(cx, cy, 50, 50, 0, 190, 0.5); touch(cx - 4, cy - 5, 30, 30, 0, 255, 0.75);
      });
      clip(0, 128, (cx, cy) => {                                                    // 2: flecks: froth thrown up, blossom
        for (let i = 0; i < 90; i++) { const a = R() * TAU, rr = Math.sqrt(R()) * 44; touch(cx + Math.cos(a) * rr * 1.15, cy + Math.sin(a) * rr * 0.8, 1.6 + R() * 2.4, 1.4 + R() * 2, R() * 3, Math.floor(200 + 55 * R()), 0.9); }
      });
      clip(128, 128, (cx, cy) => leaves(cx, cy, 0.3, 420, 0.5));                    // 3: a loose spray, the sky through it
    }, false);
    const n = N_CARD, geo = new THREE.PlaneGeometry(1, 1);
    this.aInfo = new THREE.InstancedBufferAttribute(new Float32Array(n * 4), 4).setUsage(THREE.DynamicDrawUsage);
    this.aCol = new THREE.InstancedBufferAttribute(new Float32Array(n * 3), 3).setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('aInfo', this.aInfo); geo.setAttribute('aCol', this.aCol);
    const cu = this.cu = { ...this.lu, tAtlas: { value: atlas } };
    const m = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide });
    m.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, cu);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', `#include <common>
${LIGHT}
attribute vec4 aInfo; attribute vec3 aCol; varying vec4 vInfo; varying vec3 vCol; varying vec2 vQ; varying float vSun, vWy;`)
        .replace('#include <project_vertex>', `vec3 ic = instanceMatrix[3].xyz; vec4 mvPosition = modelViewMatrix * vec4(ic, 1.0);
  float cs = cos(aInfo.z), sn = sin(aInfo.z);
  mvPosition.xy += vec2(position.x * instanceMatrix[0][0], position.y * instanceMatrix[1][1]) * mat2(cs, sn, -sn, cs);
  vQ = position.xy + 0.5; vInfo = aInfo; vCol = aCol; vWy = (ic.y - uO.y + position.y * instanceMatrix[1][1]) / uZ;
  { vec2 lq = ic.xz - uO.xz; vec3 Ps = vec3(dot(lq, uAx.xy), ic.y - uO.y, dot(lq, uAx.zw)) / uZ; vSun = 1.0 - 0.7 * under(Ps); }
  gl_Position = projectionMatrix * mvPosition;`);
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', `#include <common>
uniform sampler2D tAtlas, tNoise; uniform vec3 cAmb, cSun; uniform float uTime; varying vec4 vInfo; varying vec3 vCol; varying vec2 vQ; varying float vSun, vWy;`)
        .replace('#include <map_fragment>', `{
  float kd = vInfo.x, a; vec3 c;
  if (kd > 3.5) {
    // falling water: his white strands, soft, with the dark between them, running down (vInfo.w: this sheet's own grain)
    float n1 = texture2D(tNoise, vec2(vQ.x * 0.5 + vInfo.w, vWy * 0.45 + uTime * 0.5)).r, n2 = texture2D(tNoise, vec2(vQ.x * 1.5 + vInfo.w * 3.0, vWy * 1.2 + uTime * 1.3)).g;
    float strand = smoothstep(0.47, 0.7, n1 * 0.62 + n2 * 0.5);
    a = vInfo.y * smoothstep(0.0, 0.3, vQ.x) * smoothstep(1.0, 0.7, vQ.x) * smoothstep(0.0, 0.1, vQ.y) * smoothstep(1.0, 0.94, vQ.y) * (0.07 + 0.93 * strand);
    c = vCol * (0.7 + 0.42 * n2) * (cAmb * 0.9 + cSun * 0.42);
  } else {
    vec2 cell = kd < 0.5 ? vec2(0.0, 1.0) : kd < 1.5 ? vec2(1.0, 1.0) : kd < 2.5 ? vec2(0.0, 0.0) : vec2(1.0, 0.0);
    vec4 tx = texture2D(tAtlas, (clamp(vQ, 0.02, 0.98) + cell) * 0.5);
    a = min(1.0, tx.a * 1.12) * vInfo.y;
    if (kd < 0.5 || kd > 2.5) {
      // (his leaves: the body dark; the small touches lighter, a little warmer, taking the sun)
      float tone = smoothstep(0.14, 0.8, tx.r);
      c = vCol * (0.55 + 0.9 * tone) * mix(vec3(1.0), vec3(1.12, 1.02, 0.78), tone) * (cAmb + cSun * vSun * vInfo.w * (0.12 + 1.0 * tone));
    } else c = vCol * (0.6 + 0.5 * tx.r) * (cAmb * 0.9 + cSun * 0.42 * vSun);
  }
  if (a < 0.01) discard;
  diffuseColor = vec4(c, a);
}`);
    };
    m.customProgramCacheKey = () => 'watermill-cards';
    const mesh = this.cards = new THREE.InstancedMesh(geo, m, n);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); mesh.count = 0; mesh.renderOrder = 6;
    L.add(mesh);
    // ---- where the standing ones are: kind, place, size (s high, s * q wide), colour, how much sun, when it comes
    const R = () => L.rand(), F = this.F = [], G = () => (R() + R() + R() - 1.5) / 1.5, pick = a => a[Math.floor(R() * a.length)];
    const deep = ['#242d1a', '#2c361f', '#333d22', '#202718', '#394325'].map(c => col(c, 0.3)), mid = ['#3c4623', '#474f27', '#51592b', '#363f1f'].map(c => col(c, 0.3));
    const olive = ['#5a5a30', '#66613a', '#4f5430', '#706840'].map(c => col(c, 0.3)), pale = ['#7c8260', '#8a8c68', '#6b7350', '#96946c'].map(c => col(c, 0.3)), blue = ['#2a3528', '#33402f', '#253026', '#3b4832'].map(c => col(c, 0.3));
    // (a mass is many cards at several depths, each turned and flipped its own way: thick and large in the middle,
    // where they close into one dark body, smaller and thinner towards its edge, where the wall comes through)
    const mass = (xc, zc, w, y0, y1, n, s0, s1, cols, born, { sun = 0.75, depth = 0.12, kind = 0, edge = 0.3 } = {}) => {
      for (let i = 0; i < n; i++) {
        const gx = G(), gy = G(), far = Math.min(1, Math.hypot(gx, gy) * 1.5), x = xc + gx * w * 0.5, z = Math.max(0.03, zc + (R() - 0.5) * depth), y = (y0 + y1) / 2 + gy * (y1 - y0) * 0.55;
        F.push({ k: kind === 0 && far > 1 - edge && R() < 0.6 ? 3 : kind, x, z, y, s: s1 + (s0 - s1) * far, q: (R() < 0.5 ? -1 : 1) * (1.1 + 0.4 * R()), c: pick(cols), sun: sun * (0.55 + 0.45 * clamp01((y - y0) / Math.max(0.01, y1 - y0))), sway: 0.006 + 0.008 * R(), ph: R() * TAU, spin: (R() - 0.5) * 1.1, born: born + 0.5 * R() + 0.4 * clamp01((y - y0) / Math.max(0.01, y1 - y0)) });
      }
    };
    mass(-0.55, 0.21, 0.32, 0.4, 0.78, 20, 0.17, 0.3, deep, 0.7, { edge: 0.45 }); mass(-0.38, 0.24, 0.22, 0.42, 0.7, 10, 0.15, 0.25, deep, 0.8, { edge: 0.45 });      // the oaks on the bank, reaching out over the flume
    mass(-0.58, 0.19, 0.26, 0.58, 0.82, 10, 0.13, 0.22, mid, 0.9, { sun: 1 }); mass(-0.4, 0.25, 0.16, 0.56, 0.72, 5, 0.12, 0.18, olive, 0.95, { sun: 1 });      // their lit heads
    mass(-0.6, 0.5, 0.14, 0.2, 0.36, 5, 0.13, 0.2, deep, 0.85, { depth: 0.1 });                                                         // the thicket the flume comes out of
    mass(-0.3, 0.1, 0.26, 0.24, 0.5, 9, 0.15, 0.24, blue, 0.8, { sun: 0.5, depth: 0.08 }); mass(-0.1, 0.08, 0.24, 0.26, 0.56, 9, 0.15, 0.24, olive, 0.85, { sun: 0.9, depth: 0.06 });      // the wood behind the flume
    mass(-0.2, 0.07, 0.2, 0.42, 0.6, 5, 0.13, 0.2, mid, 0.9, { sun: 0.8, depth: 0.04 });
    mass(0.4, 0.49, 0.18, 0.36, 0.6, 9, 0.1, 0.17, pale, 1.2, { sun: 1, depth: 0.05, kind: 3 });                                       // the pale tree in front of the roof
    mass(0.65, 0.5, 0.15, 0.68, 0.9, 10, 0.11, 0.2, blue, 1.1, { sun: 0.85, depth: 0.06, edge: 0.55 }); mass(0.66, 0.5, 0.12, 0.76, 0.9, 4, 0.09, 0.13, mid, 1.2, { sun: 1, kind: 3 });
    mass(0.612, 0.5, 0.07, 0.52, 0.64, 4, 0.09, 0.13, blue, 1.15, { sun: 0.7, depth: 0.04, kind: 3 }); mass(0.7, 0.5, 0.06, 0.58, 0.68, 3, 0.08, 0.11, mid, 1.3, { kind: 3 });      // the tall thin one in the yard
    mass(0.74, 0.07, 0.1, 0.2, 0.42, 5, 0.12, 0.18, blue, 0.9, { sun: 0.5, depth: 0.04 });                                              // far trees beyond the mill
    // bushes on the bank and at the yard's edge, two of them in blossom; grass along the water
    const bush = (x, z, y, s, cols, born, flower) => {
      for (let i = 0; i < 3; i++) F.push({ k: 0, x: x + (R() - 0.5) * s * 0.7, z: z + (R() - 0.5) * 0.03, y: y + (R() - 0.5) * s * 0.3, s: s * (0.7 + 0.3 * R()), q: (R() < 0.5 ? -1 : 1) * 1.25, c: pick(cols), sun: 0.9, sway: 0.004, ph: R() * TAU, spin: (R() - 0.5) * 0.6, born: born + 0.2 * R() });
      if (flower) F.push({ k: 2, x, z: z + 0.02, y: y + s * 0.12, s: s * 0.62, q: 1.3, c: this.cBlossom || (this.cBlossom = col('#bdb89c', 0.25)), sun: 1, sway: 0.004, ph: R() * TAU, spin: (R() - 0.5) * 0.4, born: born + 0.5 });
    };
    bush(-0.52, 0.62, ground(-0.52, 0.62) + 0.06, 0.13, mid, 0.9, true); bush(-0.66, 0.6, ground(-0.66, 0.6) + 0.07, 0.15, deep, 0.85, false); bush(-0.62, 0.52, 0.3, 0.16, mid, 0.95, true); bush(-0.4, 0.38, 0.13, 0.11, mid, 0.9, false);
    bush(-0.2, 0.3, 0.1, 0.1, deep, 0.9, false); bush(0.73, 0.62, 0.09, 0.1, mid, 1.0, false); bush(0.55, 0.47, 0.085, 0.06, olive, 1.1, false);
    for (let i = 0; i < 12; i++) { const x = -0.7 + 1.45 * (i + R()) / 12, z = Math.min(0.72, shore(x) - 0.04 - 0.07 * R()), gy = ground(x, z); if (gy < 0.01 || (x > -0.02 && x < 0.52 && z < 0.45)) continue; F.push({ k: 0, x, z, y: gy + 0.022, s: 0.06 + 0.035 * R(), q: 1.3, c: pick(mid), sun: 0.9, sway: 0.004, ph: R() * TAU, spin: (R() - 0.5) * 0.6, born: 0.5 + 0.4 * R() }); }
    this.cFoam = col('#ece5d0', 0.12); this.cDrop = col('#d8d4c4', 0.15);
    // scratch: one row per card, then drawn far to near
    this.px = new Float32Array(n); this.py = new Float32Array(n); this.pz = new Float32Array(n); this.ps = new Float32Array(n); this.pq = new Float32Array(n);
    this.pk = new Float32Array(n); this.pw = new Float32Array(n); this.pa = new Float32Array(n); this.pr = new Float32Array(n); this.pc = new Float32Array(n * 3); this.dep = new Float32Array(n);
    this.order = Array.from({ length: n }, (_, i) => i); this.byDepth = (a, b) => this.dep[b] - this.dep[a];
    this.M = new THREE.Matrix4(); this.Q = new THREE.Quaternion(); this.Q2 = new THREE.Quaternion(); this.S = new THREE.Vector3(); this.axis = new THREE.Vector3(L.nx, 0, L.nz); this.up = new THREE.Vector3(0, 1, 0);
    this.dk = [{}, {}, {}];
  },

  // The sounds, on the show's own clock: the building (quiet knocks of wood on wood, the tiles going on), the gate,
  // the wheel taking the weight, and the clack, which is worked out from the wheel's own angle so it keeps its time.
  makeScore(L, calm) {
    const s = score(L), q = calm ? 0.6 : 1, w = this.speed(calm);
    const knock = (t, v = 1, f = 300) => { s.note(t, f, 0.05, { type: 'triangle', vol: 0.008 * v * q, to: f * 0.8, attack: calm ? 0.012 : 0.004 }); s.hit(t, { d: 0.045, vol: 0.008 * v * q, bp: 1100, q: 4, attack: 0.003 }); };
    [...this.knocks].sort((a, b) => a - b).forEach((t, i) => knock(t, 0.7 + 0.3 * hash(i, 2), 240 + 140 * hash(i, 5)));
    for (let i = 0; i < 15; i++) s.hit(1.08 + i * 0.052 + 0.02 * hash(i, 9), { d: 0.03, vol: 0.0045 * q, bp: 2600 + 900 * hash(i, 3), q: 5, attack: 0.002 });      // tiles
    // the stream arriving, and landing
    s.hit(T_LAND - 0.02, { d: 0.6, vol: 0.016 * q, lp: 3200, hp: 500, attack: calm ? 0.2 : 0.06 });
    // the gate: wood on wood, low
    s.note(T_SHUT, 104, 0.14, { type: 'sine', vol: 0.03 * q, to: 66, attack: calm ? 0.03 : 0.006 }); s.hit(T_SHUT, { d: 0.08, vol: 0.016 * q, lp: 1700, hp: 260, attack: 0.004 }); knock(T_SHUT + 0.13, 0.6, 210);
    // the water on the wheel; the wheel taking the weight: a long groan, twice, the second rising as it goes
    s.hit(T_HIT, { d: 0.5, vol: 0.014 * q, lp: 2400, hp: 300, attack: 0.08 });
    s.note(T_HIT + 0.1, 74, 0.42, { type: 'sawtooth', vol: 0.007 * q, to: 92, attack: 0.12 }); s.hit(T_HIT + 0.1, { d: 0.4, vol: 0.006 * q, bp: 420, q: 6, attack: 0.1 });
    s.note(T_GO - 0.08, 62, 0.9, { type: 'sawtooth', vol: 0.008 * q, to: 118, attack: 0.25 }); s.hit(T_GO - 0.05, { d: 0.8, vol: 0.006 * q, bp: 520, q: 5, attack: 0.2 });
    // the clack: a knock for each eighth of a turn, low and high by turns, slow at first
    const tok = (t, hi) => { s.note(t, hi ? 392 : 294, 0.05, { type: 'triangle', vol: 0.011, to: hi ? 330 : 250, attack: 0.004 }); s.hit(t, { d: 0.04, vol: 0.009, bp: hi ? 1500 : 1000, q: 5, attack: 0.003 }); };
    const step = Math.PI / 4, tEnd = T_GO + SPIN + 0.5; let n = 1;
    for (let t = T_GO; t < tEnd; t += 1 / 480) if (spun(t, w, T_GO, SPIN) >= n * step) { tok(t, n % 2 === 0); n++; }
    // (and steady from there on, for as long as you look)
    const t1 = T_GO + SPIN + (n * step - w * SPIN / 2) / w, per = step / w, ev = [];
    for (const [dt, hi] of [[0, n % 2 === 0], [per, n % 2 !== 0]]) { ev.push({ t: dt, f: hi ? 392 : 294, d: 0.05, type: 'triangle', vol: 0.011, to: hi ? 330 : 250, attack: 0.004 }, { t: dt, noise: true, d: 0.04, vol: 0.009, bp: hi ? 1500 : 1000, q: 5, attack: 0.003 }); }
    s.loop(t1, per * 2, ev);
    return s.done();
  },
  speed(calm) { return calm ? 1 : 2; },                     // the wheel's steady speed, radians a second

  hideAll() {
    this.cards.count = 0; this.cards.visible = false; this.land.visible = false; this.floor.material.visible = false;
    for (const m of this.parts) m.makeScale(0, 0, 0);
    this.fu.uSpread.value = 0; this.fu.uBuilt.value = 0; this.lu.uBuild.value = 0; this.su.uFront.value = -9;
  },
  quiet() { this.rush.set(0); this.churn.set(0); this.run.set(0); },
  start(L, resumed) { if (!resumed) this.hideAll(); this.band = this.bands[L.calm ? 1 : 0]; this.band.from(L.t); this.floor.material.visible = true; this.land.visible = true; },
  back(L) { this.bT = L.t; },
  end(L) { this.hideAll(); this.quiet(); },
  reset(L) { this.hideAll(); this.quiet(); },

  // ---------------------------------------------------------------- the water at show-time t: where it has got to, and how hard it runs
  flow(t, o = this.fl) {
    // the stream's front along the flume: down from the bank to the spill; and, when the gate is shut, on to the end
    o.front = t < T_WATER ? -9 : t < T_SHUT ? lerp(FL.x0, SPILL[1] + 0.01, ease.out(ramp(t, T_WATER, T_SPILL + 0.1))) : lerp(SPILL[1] + 0.01, FL.x1 + 0.01, sm(ramp(t, T_SHUT, T_HIT)));
    // the fall: its head coming down, then full; cut off at the gate, its last water falling away, a few threads left
    o.fall = sm(ramp(t, T_SPILL, T_SPILL + 0.3)) * (1 - sm(ramp(t, T_SHUT + 0.08, T_SHUT + 0.28)));
    o.head = LIP * (1 - Math.min(1, ((t - T_SPILL) / (T_LAND - T_SPILL)) ** 2));
    o.tail = t < T_SHUT ? LIP : LIP * (1 - Math.min(1, ((t - T_SHUT) / 0.26) ** 2));
    o.leak = 0.34 * sm(ramp(t, T_SHUT + 0.15, T_SHUT + 0.6));
    o.landed = t < T_LAND ? 0 : t < T_SHUT + 0.26 ? sm(ramp(t, T_LAND, T_LAND + 0.25)) : lerp(1, 0.24, sm(ramp(t, T_SHUT + 0.26, T_SHUT + 0.9)));
    o.ring = Math.max(0, t - T_LAND) * 0.2;
    // onto the wheel
    o.feed = sm(ramp(t, T_HIT - 0.05, T_HIT + 0.2));
    return o;
  },

  update(L, dt) {
    const ph = L.phase, showing = ph === 'wake' || ph === 'play', back = ph === 'return', calm = L.calm;
    if (!showing && !back) return;
    const ret = back ? L.ret : 0, cam = L.k.G.camera, lu = this.lu, fu = this.fu, w = this.speed(calm);
    // Going back: the water is shut off at once, the wheels run down, and the mill is taken apart in the order it was built.
    const t = showing ? L.t : this.bT, K = back ? 1 - sm(ramp(ret, 0, 0.3)) : 1, runDown = back ? 1.1 * (1 - (1 - ramp(L.r, 0, 1.1)) ** 2) / 2 : 0;
    const build = showing ? t : Math.min(this.bT, BUILT) * (1 - ease.inOut(ramp(ret, 0.2, 1)));
    const f = this.flow(t);
    lu.uTime.value = (calm ? 0.5 : 1) * (t + (back ? L.r : 0)); lu.uBuild.value = build;
    fu.uSpread.value = showing ? ease.out(ramp(t, 0.05, 1.6)) : ease.out(ramp(Math.min(this.bT, 1.6), 0.05, 1.6)) * (1 - ease.inOut(ramp(ret, 0.45, 1)));
    fu.uBuilt.value = sm(ramp(build, 0.9, 1.9));
    const spinA = sm(ramp(t, T_GO, T_GO + SPIN)), wash = (0.3 * f.feed + 0.7 * spinA) * f.feed * K;
    fu.uFall.value.set((f.landed * (f.fall + f.leak * 0.6)) * K, f.ring, 0.34); fu.uWash.value.set(wash, Math.max(0, t - T_HIT - 0.1) * 0.2, 0.42);
    this.su.uFront.value = back ? lerp(f.front, -9, ramp(ret, 0.02, 0.25)) : f.front; this.su.uWet.value = f.feed;

    // ---- the wheels, the gate
    const P = this.parts, M = this.M, v = this.v, kA = ease.outBack(ramp(build, 1.3, 1.7)), kB = ease.outBack(ramp(build, 1.2, 1.6));
    const lurch = 0.11 * sm(ramp(t, T_HIT + 0.1, T_HIT + 0.3)) - 0.05 * sm(ramp(t, T_HIT + 0.3, T_HIT + 0.62));
    const thA = lurch + spun(t, w, T_GO, SPIN) + w * spinA * runDown, thB = spun(t, w * 0.8, T_FAR, 2.4) + w * 0.8 * sm(ramp(t, T_FAR, T_FAR + 2.4)) * runDown;
    this.thA = thA;
    const place = (i, c, th, k) => { this.W(c[0], c[1], c[2], v); this.Q.setFromAxisAngle(this.axis, -th); M.compose(v, this.Q, this.S.set(k, k, k)); P[i].copy(M); };
    place(0, WH, thA - 0.4 * (1 - kA), Math.max(0, kA)); place(1, WH2, 0.5 + thB - 0.4 * (1 - kB), Math.max(0, kB));
    {
      // the gate: held up in its frame; a hitch, then it drops and lands with a small bounce
      const kG = ease.out(ramp(build, 1.3, 1.55)), hitch = 0.012 * hump(t, T_GATE - 0.22, T_GATE + 0.04), drop = Math.min(1, ((t - T_GATE) / (T_SHUT - T_GATE)) ** 2) * (t > T_GATE ? 1 : 0);
      const bounce = t > T_SHUT ? 0.012 * Math.exp(-(t - T_SHUT) * 9) * Math.abs(Math.sin((t - T_SHUT) * 16)) : 0;
      this.W((SPILL[0] + SPILL[1]) / 2, 0.333 + 0.105 * (1 - drop) + hitch + (calm ? 0 : bounce), 0.5475, v); M.compose(v, this.Q.identity(), this.S.set(kG, kG, kG)); P[2].copy(M);
    }
    // ---- the ducks: out from under the flume, clear of where the fall will land, then round and round; they ride the rings
    for (let i = 0; i < 3; i++) {
      const d = this.duckAt(i, t, f, wash, calm, this.dk[i]), kD = sm(ramp(build, 1.3 + i * 0.25, 1.7 + i * 0.25));
      this.W(d.x, 0.004 + d.y, d.z, v); this.Q.setFromAxisAngle(this.up, -d.yaw).multiply(this.Q2.setFromAxisAngle(this.axis, d.pitch)); M.compose(v, this.Q, this.S.set(kD, kD, kD)); P[3 + i].copy(M);
    }

    // ---- the cards
    let n = 0;
    const put = (x, y, z, s, sq, kind, a, spin, sun, c) => {
      if (a <= 0.004 || s <= 0.001 || n >= N_CARD) return;
      this.W(x, y, z, v);
      this.px[n] = v.x; this.py[n] = v.y; this.pz[n] = v.z; this.ps[n] = s * Z; this.pq[n] = sq; this.pk[n] = kind; this.pa[n] = a; this.pr[n] = spin; this.pw[n] = sun;
      this.pc[n * 3] = c.r; this.pc[n * 3 + 1] = c.g; this.pc[n * 3 + 2] = c.b; n++;
    };
    const tw = lu.uTime.value;
    for (const c of this.F) {
      const k = sm(clamp01((build - c.born) / 0.55)); if (k <= 0.01) continue;
      const sw = c.sway * (0.6 * Math.sin(tw * 1.1 + c.ph) + 0.3 * Math.sin(tw * 2.3 + c.ph * 1.7));
      put(c.x + sw, c.y - 0.05 * (1 - k), c.z, c.s * (0.6 + 0.4 * k), c.q || 1, c.k, c.k === 2 ? k * 0.55 : k, c.spin + sw * 2.5, c.sun, c.c);
    }
    // the fall: a few sheets side by side from the lip to the pond (or as far as its head has come, or from where its
    // tail has got to), and the threads that still get past the gate; a breath of mist and thrown froth at its foot
    {
      const main = f.fall * K, x0 = SPILL[0] + 0.012, x1 = SPILL[1] - 0.012, top = f.tail, bot = f.head, hgt = top - bot;
      if (main > 0.01 && hgt > 0.01) for (let i = 0; i < 5; i++) { const x = lerp(x0, x1, i / 4), wd = 0.05 + 0.012 * hash(i, 1), zz = 0.556 + 0.04 * (1 - (top + bot) / 2 / LIP); put(x, (top + bot) / 2, zz + i * 0.002, hgt + 0.012, wd / (hgt + 0.012), 4, main * (0.74 + 0.2 * hash(i, 4)), 0, 0.13 + i * 0.21, this.cFoam); }
      const leak = f.leak * K;
      if (leak > 0.01) for (const [x, ph] of [[SPILL[0] + 0.03, 0.61], [SPILL[1] - 0.034, 0.27]]) put(x, LIP / 2, 0.572, LIP + 0.01, 0.046 / LIP, 4, leak * 1.25, 0, ph, this.cFoam);
      const land = f.landed * (f.fall + f.leak * 0.5) * K;
      if (land > 0.01) {
        put(FOOT[0], 0.04, FOOT[1] + 0.02, 0.14, 1.7, 1, land * 0.2, 0, 0, this.cFoam);
        for (let i = 0; i < 3; i++) { const cyc = Math.floor(tw * 5 + i * 0.37), kk = tw * 5 + i * 0.37 - cyc; put(FOOT[0] + (hash(i, cyc) - 0.5) * 0.09, 0.016 + 0.03 * kk, FOOT[1] + 0.01 + (hash(cyc, i) - 0.5) * 0.03, 0.07 + 0.05 * kk, 1.5, 2, land * (calm ? 0.5 : 0.85 * (1 - kk)), hash(i + 3, cyc) * 3, 0, this.cFoam); }
      }
    }
    // the water on the wheel: off the flume's end onto its floats, off them again in drops down its near side, and its wash
    {
      const feed = f.feed * K;
      if (feed > 0.01) {
        put(FL.x1 + 0.022, 0.306, 0.5, 0.078, 0.8, 4, feed, 0, 0.47, this.cFoam);
        // riding the wheel: a short sheet hanging off each float on its way down the near side (it goes round with them)
        for (let i = 0; i < 14; i++) {
          let a = ((i + 0.5) / 14 * TAU + thA) % TAU; if (a < 0) a += TAU;
          if (a < 0.12 || a > 2.8) continue;
          const r0 = WR + 0.004, len = (0.04 + 0.085 * sm(ramp(a, 0.2, 1.5))) * (0.65 + 0.35 * hash(i, 3)), k = sm(ramp(a, 0.12, 0.45)) * (1 - sm(ramp(a, 1.9, 2.8)));
          put(WH[0] + Math.sin(a) * r0 + 0.004, Math.max(0.012 + len / 2, WH[1] + Math.cos(a) * r0 - len / 2 + 0.008), 0.545, len, 0.044 / len, 4, feed * k * 0.8, 0, 0.11 + i * 0.173, this.cFoam);
        }
        const g = 4.2, wNow = w * spinA;
        for (let i = 0; i < N_DROP; i++) {
          // each drop leaves a float somewhere down the near side, with the rim's own speed, and falls
          const per = 0.42 + 0.12 * hash(i, 1), x = (t - T_HIT) / per + i * 0.618, cyc = Math.floor(x), age = (x - cyc) * per; if (x < 0.2) continue;
          const a0 = 0.35 + 1.5 * hash(i, cyc), r0 = WR + 0.004, sx = Math.sin(a0), cx = Math.cos(a0);
          const px = WH[0] + sx * r0 + cx * r0 * wNow * age * 0.8, py = WH[1] + cx * r0 - sx * r0 * wNow * age * 0.8 - g * age * age / 2;
          if (py < 0.012) continue;
          put(px, py, 0.55 + (hash(cyc, i) - 0.5) * 0.03, 0.02 + 0.016 * hash(i, 7), 0.7, 1, feed * (0.45 + 0.5 * spinA) * sm(ramp(age, 0, 0.05)), 0, 0, this.cDrop);
        }
        const churn = wash;
        put(WASH[0] + 0.02, 0.03, WASH[1] + 0.03, 0.1, 1.7, 1, churn * 0.14, 0, 0, this.cFoam);
        for (let i = 0; i < 5; i++) { const cyc = Math.floor(tw * 4.4 + i * 0.41), kk = tw * 4.4 + i * 0.41 - cyc; put(WASH[0] + (hash(i + 5, cyc) - 0.5) * 0.13, 0.016 + 0.045 * kk, WASH[1] + 0.035 + (hash(cyc, i + 5) - 0.5) * 0.04, 0.07 + 0.06 * kk, 1.5, 2, churn * (calm ? 0.45 : 0.85 * (1 - kk)), hash(i + 8, cyc) * 3, 0, this.cFoam); }
      }
      // the stream's white front, running down the flume
      if (showing && t > T_WATER && t < T_HIT + 0.1 && !(t > T_SPILL + 0.15 && t < T_SHUT)) put(f.front - 0.012, FL.top + 0.004, 0.5, 0.036, 1.6, 2, 0.8, 0, 0, this.cFoam);
    }
    this.flushCards(n, cam);

    // ---- sound
    if (showing) this.band.play(t);
    const near = L.quiet ? 0 : Math.max(0, 1 - Math.hypot(cam.position.x - L.cx, cam.position.z - L.cz) / 12) * K;
    this.rush.set(near * (0.024 * f.fall * f.landed + 0.008 * f.leak + 0.008 * f.feed));
    this.run.set(near * 0.007 * sm(ramp(t, T_WATER, T_WATER + 0.5)));
    this.churn.set(near * (0.012 * f.feed + 0.028 * spinA));
  },

  // Duck i at show-time t: where it is on the pond, which way it heads, how the water lifts and tips it.
  duckAt(i, t, f, wash, calm, o) {
    const C = [[-0.24, 0.87, 0.12, 0.055, 0.34, 0.6], [-0.03, 0.95, 0.1, 0.05, -0.3, 2.4], [-0.36, 0.97, 0.075, 0.04, 0.4, 4.1]][i], S = [[-0.3, 0.55], [-0.26, 0.5], [-0.34, 0.52]][i];
    const at = (tt, out) => {
      const a = C[4] * tt + C[5], k = ease.inOut(ramp(tt, 1.3 + i * 0.3, 3.5 + i * 0.3));
      out[0] = lerp(S[0], C[0] + C[2] * Math.cos(a), k); out[1] = lerp(S[1], C[1] + C[3] * Math.sin(a), k); return out;
    };
    const p = at(t, this.p0 || (this.p0 = [0, 0])), q = at(t + 0.08, this.p1 || (this.p1 = [0, 0]));
    o.x = p[0]; o.z = p[1]; o.yaw = Math.atan2(q[1] - p[1], q[0] - p[0]);
    // the rings under it: from the fall, and the wheel's wash (the same waves the pond's shader draws)
    const wave = (c, k, kk, sp, reach, len) => { const l = Math.hypot(o.x - c[0], o.z - c[1]); return l > reach ? 0 : k * Math.sin(kk * l - (calm ? 0.5 : 1) * t * sp) * Math.exp(-l / len) * sm(ramp(reach - l, 0, 0.14)); };
    const h = wave(FOOT, f.landed * (f.fall + f.leak * 0.6), 64, 8.5, f.ring, 0.34) + wave(WASH, wash, 52, 7.5, Math.max(0, t - T_HIT - 0.1) * 0.2, 0.42);
    o.y = 0.0045 * h + 0.0012 * Math.sin(t * 2.1 + i * 2); o.pitch = 0.2 * h + 0.03 * Math.sin(t * 1.7 + i);
    // now and then, while you keep looking, one goes bottom up
    const dab = i === 1 ? hump((t + 3) % 13, 11, 12.8) : i === 2 ? hump((t + 8) % 17, 15, 16.8) : 0;
    if (dab > 0 && t > 9) { const e = sm(Math.min(1, dab * 1.6)); o.pitch -= 1.25 * e; o.y -= 0.012 * e; }
    return o;
  },

  flushCards(n, cam) {
    const fx = -cam.matrixWorld.elements[8], fy = -cam.matrixWorld.elements[9], fz = -cam.matrixWorld.elements[10], cx = cam.position.x, cy = cam.position.y, cz = cam.position.z;
    const ord = this.order; ord.length = n;
    for (let i = 0; i < n; i++) { ord[i] = i; this.dep[i] = (this.px[i] - cx) * fx + (this.py[i] - cy) * fy + (this.pz[i] - cz) * fz; }
    ord.sort(this.byDepth);
    const M = this.cards.instanceMatrix.array, I = this.aInfo.array, C = this.aCol.array;
    for (let j = 0; j < n; j++) {
      const i = ord[j], m = j * 16, s = this.ps[i];
      M[m] = s * this.pq[i]; M[m + 5] = s; M[m + 10] = s; M[m + 15] = 1; M[m + 12] = this.px[i]; M[m + 13] = this.py[i]; M[m + 14] = this.pz[i];
      I[j * 4] = this.pk[i]; I[j * 4 + 1] = this.pa[i]; I[j * 4 + 2] = this.pr[i]; I[j * 4 + 3] = this.pw[i];
      C[j * 3] = this.pc[i * 3]; C[j * 3 + 1] = this.pc[i * 3 + 1]; C[j * 3 + 2] = this.pc[i * 3 + 2];
    }
    this.cards.count = n; this.cards.visible = n > 0;
    this.cards.instanceMatrix.needsUpdate = true; this.aInfo.needsUpdate = true; this.aCol.needsUpdate = true;
  },
});
