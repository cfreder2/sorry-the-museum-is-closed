// Jacob van Ruisdael, Landscape with the Ruins of the Castle of Egmond (1650–55), Gallery 213. The word: shelter.
//
// The museum says the castle was sacrificially destroyed in the Dutch revolt against Spain, more than eighty years
// before he painted it, and that a ruin like this stood for the republic's struggle. What he shows is what was left:
// one tall shell of red brick, open down its right side, standing over its own reflection in still, dark water, with
// broken walls and fallen masonry going green beside it, woods behind and reeds in front. Over it is his real
// subject, the weather: a slate storm cloud swelling behind the tower, and a break of light from the left that
// catches the brick. Everything alive in the picture answers that sky: a shepherd in a red coat is with his sheep
// on the far bank, and high on the left, very small against the cloud, two dark birds are on the wing beside the
// tower. A lord's house that shelters nobody now is still shelter to them.
//
// Look at it and the water comes out over the floor under the picture; the ruin stands up out of it on its bank
// (the tower, the low wall, the gable, the arches up the slope, the fallen masonry, his woods behind, the reeds and
// the brown stone in front); and his sky heaps up on the wall behind it, under the frame, pale and mild. The two
// birds slip out from behind the frame's left side, at the height he painted them, come down the bare wall and go
// round over the water, calling. Then the weather turns: the cloud swells and darkens, its shadow comes over the
// water from the right, the wind gets up in the reeds, and far off it thunders. For a moment the air goes slack and
// the water holds the tower whole. Then the gust comes over the pool from the left, flattening the reeds, tearing
// leaves out of the wood and wiping the reflection away, and it catches the two of them in the open, beside the
// tower: they hang in it, beating, going nowhere, and are carried back; then they come in under it and through the
// broken side of the tower as the first drops ring the water, and settle on a ledge inside, out of the wind, close
// together. It rains. Then the cloud breaks on the left, as it does in the picture, and the light comes across the
// water and up the brick: the tower stands red against the dark, with its reflection lying under it again. One bird
// shakes the rain off, hops up onto the broken top into the sun and calls, and the other follows. While you keep
// looking they sit there, the reeds stir, and now and then the shadow of a cloud goes over. When you stop, they fly
// back up the wall and in behind the frame, the ruin goes down and the water draws back under the picture.
//
// How it is made: three draw calls. The floor and the wall are one mesh with one shader: the pool (what it reflects
// is worked out for each pixel from where you stand: the tower's boxes, the woods, the sky, bent by the ripples, the
// rain's rings and the gust), its muddy edge, the storm's shadow on the floorboards, and his sky on the wall (soft
// masses, with his billows painted once in a texture, which drift, thicken and break). Everything solid is a second
// mesh with its own light (overcast, storm, the sun from the left, the tower's own shadow): the ground, the
// brickwork in courses of short dabs, the stones, every reed (the wind bends them in the shader), and the two
// birds, whose bodies and wings are parts of the same mesh moved by six matrices. His foliage, the plaster and moss
// on the brick, the flying leaves and the rain are soft cards in a third. Nothing is solid and nothing stays out
// after the look. The tower stands 0.75 m at its highest, close under the picture: from the look camera nothing
// comes in front of a canvas (the birds come down the bare wall to the left of the frame, and keep below its rail
// while they are in front of it), and the kit's guard does the rest.
// With "Reduce motion and flashing" on, the gust is half as strong and crosses at half the speed, the reeds and the
// leaves move at half speed, the light and the cloud's shadow take about twice as long to cross, the bird does not
// shake itself, and the thunder is quieter and comes up more slowly. There is no lightning at any setting.
//
// The birds are too small in the picture to name; they are built dark and grey at the nape, like the jackdaws that
// keep to towers. There is no tune: a ruin has none, only the weather.
//
// What it does not do: the tower does not fall and no stone of it moves, because the ruin is a memorial and the
// point of the picture is that it still stands; the shepherd and his sheep stay in the picture (a man at his work,
// far off, is not a prop); and the storm only passes over: there is no lightning, nothing is struck, and the birds
// are not thrown about for fun, they get in before the rain.
import * as THREE from 'three';
import { lifeFor, ease, ramp, clamp01, lerp, shape, canvasTexture, flight, hop } from '../paintlife.js';
import { strokes } from './brush.js';
import { score, hump } from './stagecraft.js';

const TAU = Math.PI * 2;
const Z = 1.14;                                  // the scene is laid out in its own units: this many metres to one
// the timeline (seconds of show)
const T_OUT = 0.9, T_TURN = 2.2, T_THUNDER = 2.9, T_LULL = 3.5, T_GUST = 3.9, T_RAIN = 4.3, T_HOME = 5.5, T_SUN = 6.2, T_SHAKE = 7.2, T_TOP = 7.55;
const TOWER = { u0: -0.175, u1: 0.035, o0: 0.28, o1: 0.44, th: 0.02 };
const FOOT = [-0.07, 0.47];                      // where the tower meets the water: everything spreads from here
const LEDGE = 0.405;                             // the ledge inside the tower (its top)
const N_RAIN = 34, N_DROP = 14, N_LEAF = 16, N_CARD = 200;
// the boxes the pool reflects: [lo (along, up, out), hi, kind (0 brick, 1 the dark inside)]
const BOXES = [
  [[-0.175, 0, 0.28], [-0.06, 0.63, 0.44], 0], [[-0.06, 0, 0.28], [0.035, 0.59, 0.3], 1], [[-0.06, 0, 0.3], [0.035, 0.22, 0.44], 0],
  [[-0.235, 0, 0.3], [-0.175, 0.36, 0.42], 0], [[-0.47, 0, 0.395], [-0.235, 0.12, 0.415], 0], [[-0.69, 0, 0.335], [-0.55, 0.32, 0.365], 0],
];
const shore = u => 0.52 + 0.035 * Math.sin(3.1 * u + 0.7) + 0.02 * Math.sin(7.3 * u + 2.1);
const ground = (u, o) => {
  const side = 1 - ease.smooth(ramp(Math.abs(u), 0.8, 1.08)), back = 1 - ease.smooth(ramp(o, 0, 0.5));
  const hill = 0.045 + back * (0.03 + 0.13 * Math.exp(-(((u + 0.5) / 0.36) ** 2))) + 0.012 * Math.sin(u * 9 + o * 7) * back;
  return hill * (1 - ease.smooth(ramp(o, shore(u) - 0.2, shore(u) + 0.03))) * side - 0.014;
};
const hash = (a, b) => { const x = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return x - Math.floor(x); };

// What every shader here knows: where the stage is, the weather, and the light it makes.
const LIGHT = /* glsl */`
uniform vec3 uO; uniform vec4 uAx; uniform float uStorm, uSunK, uSunF, uTime, uRise; uniform vec4 uShade, uWind; uniform vec3 cAmb, cSun, uTowLo, uTowHi; uniform vec2 uFoot;
uniform sampler2D tNoise;
const vec3 SUN = vec3(-0.7526, 0.4390, 0.4913);      // towards his sun: low, from the left and from the room (along, up, out)
float windAt(float su) { return uWind.x + uWind.y * smoothstep(uWind.z + 0.15, uWind.z - 0.5, su); }
float sunAt(float su) { return uSunK * smoothstep(uSunF + 0.3, uSunF - 0.3, su) * (1.0 - uShade.x * exp(-pow((su - uShade.y) / 0.7, 2.0))); }
// 1 where the tower stands between this point and the sun (or the point is inside it)
float towerShade(vec3 P) {
  vec3 o = P + SUN * 0.006, inv = 1.0 / SUN, t0 = (uTowLo - o) * inv, t1 = (uTowHi - o) * inv, tn = min(t0, t1), tf = max(t0, t1);
  float a = max(max(tn.x, tn.y), tn.z), b = min(min(tf.x, tf.y), tf.z);
  return step(a, b) * step(0.0, b);
}
vec3 lightOn(vec3 alb, vec3 n, vec3 P) {
  float lam = clamp(dot(n, SUN) * 0.8 + 0.2, 0.0, 1.0), amb = mix(1.0, 0.5, uStorm);
  return alb * (cAmb * amb * (0.72 + 0.28 * n.y) + cSun * sunAt(P.x) * lam * lam * (1.0 - towerShade(P)));
}
`;

lifeFor(60755, {
  title: /^Landscape with the Ruins of the Castle of Egmond/,
  word: 'shelter',
  stage: { out: 1.4, half: 1.4, cam: { dist: 2.7, height: 0.62, side: 0.28, fov: 56, lookU: -0.06, lookOut: 0.4, floorOut: 1.3 } },
  wake: 2, ret: 2.2,

  build(L) {
    const P = L.pal, col = (h, a = 0.25) => P.near(h, a);
    const base = L.cy - L.y;
    // a point of the scene, in its own units (along the wall, out from the canvas plane, up from the floor)
    this.W = (u, o, h, v = new THREE.Vector3()) => L.at(u * Z, h * Z - base, o * Z, v);
    // and one in plain metres
    this.R = (u, o, h, v = new THREE.Vector3()) => L.at(u, h - base, o, v);
    this.v = new THREE.Vector3(); this.wx = {};
    const noise = this.noiseTex(L); this.tCloud = this.cloudTex(L);
    this.lu = {
      uO: { value: L.floor(0, 0) }, uAx: { value: new THREE.Vector4(L.tx, L.tz, L.nx, L.nz) }, uTime: { value: 0 }, uRise: { value: 0 },
      uStorm: { value: 0 }, uSunK: { value: 0 }, uSunF: { value: 9 }, uShade: { value: new THREE.Vector4(0, 0, 0, 0) }, uWind: { value: new THREE.Vector4(0, 0, -9, 0) },
      cAmb: { value: new THREE.Color(0.6, 0.64, 0.72) }, cSun: { value: new THREE.Color(1.2, 1.04, 0.78) },
      uTowLo: { value: new THREE.Vector3(TOWER.u0, -0.1, TOWER.o0) }, uTowHi: { value: new THREE.Vector3(TOWER.u1, 0.6, TOWER.o1) }, uFoot: { value: new THREE.Vector2(FOOT[0], FOOT[1]) },
      tNoise: { value: noise },
    };
    this.buildFloor(L, col);
    this.buildLand(L, col);
    this.buildCards(L, col);
    this.buildPaths(L);
    this.bands = [this.makeScore(L, false), this.makeScore(L, true)]; this.band = this.bands[0];
    this.windLo = L.voice().loop({ lp: 480, hp: 100 }); this.windHi = L.voice().loop({ lp: 3800, hp: 1300 }); this.hiss = L.voice().loop({ lp: 7200, hp: 2400 });
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

  // His cloud, painted once: heaps of round billows, each lit on its upper left and dark beneath, the thick of the
  // storm along the top (red: light to dark; alpha: cloud, or a gap of sky). It tiles along the wall.
  cloudTex(L) {
    const t = canvasTexture(512, 256, (g, w, h) => {
      g.clearRect(0, 0, w, h);
      const R = () => L.rand(), G = () => (R() + R() + R() - 1.5) / 1.5;
      const puff = (x, y, r, lit, dark) => {
        for (const ox of [-w, 0, w]) {
          const X = x + ox; if (X < -r || X > w + r) continue;
          const gr = g.createRadialGradient(X - 0.3 * r, y - 0.36 * r, r * 0.05, X, y, r), m = (lit + dark) >> 1;
          gr.addColorStop(0, `rgba(${lit},${lit},${lit},1)`); gr.addColorStop(0.5, `rgba(${m},${m},${m},1)`); gr.addColorStop(0.84, `rgba(${dark},${dark},${dark},0.92)`); gr.addColorStop(1, `rgba(${dark},${dark},${dark},0)`);
          g.fillStyle = gr; g.beginPath(); g.arc(X, y, r, 0, TAU); g.fill();
        }
      };
      for (let i = 0; i < 26; i++) puff(R() * w, 6 + R() * 34, 34 + R() * 26, 78 + Math.floor(R() * 26), 50);
      const list = [];
      for (let c = 0; c < 8; c++) { const cx = (c + R()) / 8 * w, cy = 78 + R() * 112, bright = R(); for (let i = 0; i < 15; i++) list.push([cx + G() * 62, cy + G() * 30 + 8, 18 + R() * 40, bright]); }
      list.sort((a, b) => b[2] - a[2] + (a[1] - b[1]) * 0.2);
      for (const [x, y, r, b] of list) puff(x, y, r, Math.floor(118 + 122 * b * (0.55 + 0.45 * R())), Math.floor(48 + 40 * R()));
    }, false);
    t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.ClampToEdgeWrapping; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter;
    return t;
  },

  // ---------------------------------------------------------------- the floor and the wall: the pool, its edge, the storm's shadow, his sky
  buildFloor(L, col) {
    const pos = [], kind = [];
    const quad = (a, b, c, d, k) => { for (const p of [a, b, c, a, c, d]) { pos.push(p.x, p.y, p.z); kind.push(k); } };
    const F = (u, o) => L.floor(u, o, new THREE.Vector3()).setY(L.y + 0.013), Wp = (u, h) => this.R(u, -0.004, h);
    quad(F(-2.0, -L.wall), F(2.1, -L.wall), F(2.1, 2.5), F(-2.0, 2.5), 0);
    quad(Wp(-2.0, 0.012), Wp(2.0, 0.012), Wp(2.0, 1.04), Wp(-2.0, 1.04), 1);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('aKind', new THREE.Float32BufferAttribute(kind, 1));
    // the pool's edge: wet earth and weed, in small dabs
    const bank = this.tBank = strokes({
      size: 256, seed: 60755, n: 2800, len: [4, 10], width: [2, 4], bend: 0.4, lift: 0.14, base: col('#232619', 0.3).getStyle(),
      colors: [['#2c3a1c', 4], ['#3a4621', 3], ['#4a5326', 2.2], ['#5a5e2c', 1.1], ['#787040', 0.35], ['#40341f', 1.6], ['#20241a', 2]].map(([c, w]) => [col(c, 0.25).getStyle(), w]),
      angle: (x, y, r) => r() * Math.PI,
    });
    const V3 = a => new THREE.Vector3(a[0], a[1], a[2]);
    const u = this.fu = {
      ...this.lu, tBank: { value: bank }, tCloud: { value: this.tCloud },
      uSpread: { value: 0 }, uVeil: { value: 0 }, uRain: { value: 0 }, uCloudT: { value: 0 }, uBreak: { value: new THREE.Vector3(0, -1.1, 0) }, uZ: { value: Z },
      uDrop: { value: Array.from({ length: N_DROP }, () => new THREE.Vector3(0, 0, -1)) },
      uBoxLo: { value: BOXES.map(b => V3(b[0])) }, uBoxHi: { value: BOXES.map(b => V3(b[1])) },
      cDeep: { value: col('#1f2017', 0.3) }, cBrick: { value: col('#b0603e', 0.3) }, cInner: { value: col('#4b4a4c', 0.3) }, cGreen: { value: col('#3e4a26', 0.3) },
      cCloudDark: { value: col('#3b3a39', 0.3) }, cCloudMid: { value: col('#716f6a', 0.3) }, cCloudLit: { value: col('#d8cfb9', 0.25) }, cSky: { value: col('#8296a6', 0.3) },
    };
    const m = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide });
    m.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, u);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float aKind; varying float vKind;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\n  vKind = aKind;');
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', `#include <common>
${LIGHT}
#define NB ${BOXES.length}
uniform sampler2D tBank, tCloud; uniform float uSpread, uVeil, uRain, uCloudT, uZ; uniform vec3 uBreak; uniform vec3 uDrop[${N_DROP}], uBoxLo[NB], uBoxHi[NB];
uniform vec3 cDeep, cBrick, cInner, cGreen, cCloudDark, cCloudMid, cCloudLit, cSky;
varying float vKind; vec3 fCol; float fA;
float fbm(vec2 p) { return texture2D(tNoise, p).r * 0.5 + texture2D(tNoise, p * 2.03 + 0.31).g * 0.3 + texture2D(tNoise, p * 4.07 + 0.77).b * 0.2; }
// His sky at a point of the wall (along, up): soft swelling masses that drift to the right, slate where they are
// thick, lit along the sides that face the break, with his painted billows for their detail. The storm thickens
// and darkens it; the break opens low on the left, and the dark stays behind the tower, as it does in the picture.
vec4 cloud(vec2 q) {
  vec2 p = q * vec2(0.34, 0.5) + vec2(-uCloudT * 0.016, uCloudT * 0.002);
  float w = fbm(p * 0.5 + vec2(3.1, 1.7 + uCloudT * 0.004)); vec2 pw = p + (w - 0.5) * 0.22;
  float d = fbm(pw), d2 = fbm(pw + vec2(-0.022, 0.03));
  vec4 pf = texture2D(tCloud, vec2(q.x * 0.3 - uCloudT * 0.014 + (w - 0.5) * 0.1, clamp(q.y * 0.6 + 0.12 + (d - 0.5) * 0.1, 0.02, 0.98)));
  float brk = uBreak.x * exp(-(pow((q.x - uBreak.y) / 0.6, 2.0) + pow((q.y - 0.62) / 0.4, 2.0)));
  float st = max(uStorm, uBreak.z * smoothstep(-0.95, -0.2, q.x)) * (1.0 - brk);
  float dd = d + st * 0.17 + clamp(q.x, -1.5, 1.5) * 0.035 - brk * 0.3;
  float cov = smoothstep(0.33, 0.45, dd), tone = smoothstep(0.36, 0.7, dd);
  float lum = mix(0.84, 0.34, tone) + clamp((d - d2) * 5.0, -1.0, 1.0) * 0.3 + (pf.r - 0.5) * pf.a * 0.2;
  lum = clamp(lum * mix(1.0, 0.36, st) + brk * 0.22, 0.0, 1.0);
  vec3 c = lum < 0.5 ? mix(cCloudDark, cCloudMid, lum * 2.0) : mix(cCloudMid, cCloudLit, lum * 2.0 - 1.0);
  vec3 sky = mix(cSky, cCloudLit, 0.15 + 0.6 * brk) * mix(1.0, 0.55, st);
  return vec4(mix(sky, c, cov), cov);
}
float boxHit(vec3 P, vec3 D, vec3 lo, vec3 hi, out vec3 n) {
  vec3 inv = 1.0 / D, t0 = (lo - P) * inv, t1 = (hi - P) * inv, tn = min(t0, t1), tf = max(t0, t1);
  float a = max(max(tn.x, tn.y), tn.z), b = min(min(tf.x, tf.y), tf.z);
  n = a == tn.x ? vec3(-sign(D.x), 0.0, 0.0) : a == tn.y ? vec3(0.0, -sign(D.y), 0.0) : vec3(0.0, 0.0, -sign(D.z));
  return (a > b || a < 0.0) ? -1.0 : a;
}
// What the water shows along a ray from it (stage: along, up, out): the tower and the walls, the woods, the sky.
vec3 scene(vec3 P, vec3 D) {
  float best = 1.0e3; vec3 bn = vec3(0.0, 0.0, 1.0); int bi = -1;
  for (int i = 0; i < NB; i++) {
    vec3 n; float t = boxHit(P, D, uBoxLo[i], uBoxHi[i], n); if (t <= 0.0 || t >= best) continue;
    vec3 H = P + D * t; if (H.y > uBoxHi[i].y - 0.09 * texture2D(tNoise, vec2(H.x * 2.6 + float(i) * 0.3, H.z * 2.6)).g) continue;      // (their tops are broken)
    float rr = clamp(uRise * 1.75 - length(H.xz - uFoot) * 0.6, 0.0, 1.0); if (rr < 1.0 && H.y > rr * 0.8 - 0.03) continue;             // (and they are still coming up)
    best = t; bn = n; bi = i;
  }
  if (bi >= 0) {
    vec3 H = P + D * best; float mot = (0.72 + 0.56 * texture2D(tNoise, vec2(H.x + H.z, H.y * 0.3) * 4.0).r) * (0.85 + 0.3 * texture2D(tNoise, vec2(H.x + H.z, H.y) * 9.0).b);
    return lightOn((bi == 1 ? cInner : cBrick) * mot, bn, H) * 0.8;
  }
  float t = D.z < -1.0e-3 ? (0.1 - P.z) / D.z : 40.0;
  vec2 q = vec2(P.x + D.x * t, D.y * t); float nq = texture2D(tNoise, q * 1.6).g;
  float trees = 0.2 + 0.09 * sin(q.x * 5.0 + 1.0) + 0.05 * sin(q.x * 11.0 + 0.3) + 0.2 * smoothstep(0.35, 1.0, abs(q.x + 0.05)) + (nq - 0.5) * 0.12;
  float tk = D.z < -1.0e-3 ? (1.0 - smoothstep(trees - 0.04, trees + 0.04, q.y)) * smoothstep(0.45, 1.0, uRise) : 0.0;
  vec3 wood = cGreen * (0.5 + 0.7 * nq) * (cAmb * mix(1.0, 0.5, uStorm) * 0.62 + cSun * sunAt(q.x) * 0.16);
  // (the sky in the water is the whole sky, not only the cloud on the wall: soft, dark where the storm is, with the break's gleam)
  float d = fbm(q * vec2(0.13, 0.2) + vec2(-uCloudT * 0.012, 0.0));
  float brk = uBreak.x * exp(-(pow((q.x - uBreak.y) / 0.8, 2.0) + pow((q.y - 0.75) / 0.7, 2.0)));
  float st = max(uStorm, uBreak.z * smoothstep(-0.95, -0.2, q.x)) * (1.0 - brk);
  float lum = clamp(mix(0.6, 0.4, smoothstep(0.3, 0.7, d)) * mix(1.0, 0.4, st) + brk * 0.5, 0.0, 1.0);
  vec3 sky = lum < 0.5 ? mix(cCloudDark, cCloudMid, lum * 2.0) : mix(cCloudMid, cCloudLit, lum * 2.0 - 1.0);
  return mix(sky * 0.92, wood, tk);
}`)
        .replace('#include <map_fragment>', `#include <map_fragment>
vec2 lq = lifeP.xz - uO.xz; float su = dot(lq, uAx.xy) / uZ, so = dot(lq, uAx.zw) / uZ;
if (vKind > 0.5) {
  // the wall under the picture: his sky, a cloud that heaps up from the floor behind the ruin, its head catching the light
  float h = (lifeP.y - uO.y) / uZ; vec2 q = vec2(su, h);
  vec4 cl = cloud(q);
  float wob = texture2D(tNoise, q * 0.31 + vec2(-uCloudT * 0.012, 0.0)).r - 0.5, wob2 = texture2D(tNoise, q * 0.9 + vec2(-uCloudT * 0.02, 0.3)).g - 0.5;
  float ex = 1.0 - smoothstep(0.6, 1.75, abs(su + 0.1)), ey = 1.0 - smoothstep(0.3, 1.0, h + 0.1 * abs(su + 0.1));
  float field = ex * ey + wob * 0.55 + wob2 * 0.16 + 0.09 * uStorm - (1.0 - uVeil) * 1.3 * (0.3 + h);
  float body = smoothstep(0.2, 0.3, field), rim = body * (1.0 - smoothstep(0.3, 0.5, field)) * smoothstep(0.1, 0.5, h);
  fCol = mix(cl.rgb, cCloudLit, rim * (0.3 + 0.45 * smoothstep(0.6, -1.0, su)) * (1.0 - 0.65 * uStorm));
  fA = body * mix(0.86, 0.98, cl.a) * step(0.001, uVeil);
} else {
  vec2 st = vec2(su, so);
  vec4 bk = texture2D(tBank, st / 0.5); float nz = texture2D(tNoise, st * 0.7).a;
  vec2 e = vec2(su / 1.1, (so - 0.42) / 0.69); float ang = atan(e.y, e.x);
  float r = length(e) / (1.0 + 0.09 * sin(3.0 * ang + 1.3) + 0.06 * sin(5.0 * ang + 0.4) + 0.04 * sin(8.0 * ang + 2.0) + (nz - 0.5) * 0.16);
  float dF = length(st - uFoot), reach = uSpread * 1.8;
  float grow = step(0.001, uSpread) * (1.0 - smoothstep(reach - 0.1, reach + 0.02, dF + (bk.a - 0.5) * 0.12));
  float pond = (1.0 - smoothstep(0.97, 1.0, r + (bk.a - 0.6) * 0.04)) * grow;
  float edge = (1.0 - smoothstep(1.01, 1.07, r + (bk.a - 0.55) * 0.1)) * grow * step(0.4, bk.a);
  float gloom = (0.1 + 0.36 * uStorm) * (1.0 - smoothstep(0.95, 2.1, r + (nz - 0.5) * 0.5)) * grow * (1.0 - 0.6 * sunAt(su));
  // the water: what it reflects from where you stand, bent by the ripples, the rain's rings and the wind
  vec3 V = normalize(lifeP - cameraPosition), Vs = vec3(dot(V.xz, uAx.xy), V.y, dot(V.xz, uAx.zw));
  float wnd = windAt(su), amp = 0.018 + 0.2 * wnd;
  vec2 slope = ((texture2D(tNoise, st * 1.3 + uTime * vec2(0.021, 0.013)).rg - 0.5) + (texture2D(tNoise, st * 3.7 - uTime * vec2(0.05, 0.017)).ba - 0.5) * 0.6) * amp;
  float ring = 0.0;
  for (int i = 0; i < ${N_DROP}; i++) {
    vec3 dr = uDrop[i]; if (dr.z < 0.0) continue;
    vec2 dd = st - dr.xy; float dl = length(dd), rad = 0.008 + dr.z * 0.15, w = exp(-pow((dl - rad) / 0.007, 2.0)) * (1.0 - dr.z / 0.7) * uRain;
    slope += dd / max(dl, 1.0e-3) * w * 0.4; ring += w;
  }
  vec3 D = reflect(Vs, normalize(vec3(-slope.x, 1.0, -slope.y * 2.2))); D.y = abs(D.y) + 1.0e-4; D.xz += 1.0e-5;
  vec3 refl = scene(vec3(su, 0.0, so), D);
  vec3 c = mix(cDeep, refl, mix(0.92, 0.6, clamp(-Vs.y, 0.0, 1.0)));
  // the wind takes the mirror away: matt grey water, streaked the way it blows, paler along the front of the gust
  vec3 matt = mix(cCloudMid, cCloudDark, 0.3 + 0.5 * uStorm) * (0.75 + 0.6 * texture2D(tNoise, vec2(su * 0.8 - uTime * 0.22, so * 5.0)).a);
  float ruf = clamp(wnd * 1.25 - 0.22, 0.0, 1.0);
  c = mix(c, matt, ruf * 0.8);
  c = mix(c, matt * 1.3, uWind.y * exp(-pow((su - uWind.z + 0.25) / 0.22, 2.0)) * 0.55);
  c += cCloudLit * ring * 0.09;
  c = mix(c, bk.rgb * 0.5, smoothstep(0.86, 1.0, r) * 0.55);                 // shallow and weedy at the edge
  vec3 mud = bk.rgb * 0.6 * (cAmb * mix(1.0, 0.5, uStorm) + cSun * sunAt(su) * 0.5);
  float aw = pond * 0.96, ae = edge * 0.95 * (1.0 - aw);
  fA = 1.0 - (1.0 - gloom) * (1.0 - ae) * (1.0 - aw);
  fCol = (mud * ae + c * aw) / max(fA, 1.0e-3);
}`)
        .replace('#include <opaque_fragment>', '  outgoingLight = fCol; diffuseColor.a = fA;\n#include <opaque_fragment>');
    };
    m.customProgramCacheKey = () => 'egmond-floor';
    this.floor = new THREE.Mesh(g, m); this.floor.renderOrder = 5;
    L.add(this.floor);
    // (it lies on the floor and the wall: kept out of the floor's own reflection, which shows and hides by material)
    const fl = L.k.museum.floors; if (fl && !fl.includes(this.floor)) fl.push(this.floor);
  },

  // ---------------------------------------------------------------- everything solid: ground, brick, stone, reeds, the two birds
  buildLand(L, col) {
    const pos = [], nor = [], cl = [], uv = [], inf = [], W = this.W, tmp = new THREE.Vector3();
    let part = 0;
    const vert = (p, n, c, t, tex, sway = 0, lever = 0) => {
      W(p[0], p[1], p[2], tmp); pos.push(tmp.x, tmp.y, tmp.z);
      nor.push(L.tx * n[0] + L.nx * n[2], n[1], L.tz * n[0] + L.nz * n[2]);
      cl.push(c.r, c.g, c.b); uv.push(t[0], t[1]); inf.push(tex, sway, part, lever);
    };
    const quad = (a, b, c, d, n, k, tex, ta, tb, tc, td) => { vert(a, n, k, ta, tex); vert(b, n, k, tb, tex); vert(c, n, k, tc, tex); vert(a, n, k, ta, tex); vert(c, n, k, tc, tex); vert(d, n, k, td, tex); };
    const C = (r, g, b) => new THREE.Color(r, g, b);
    const WHITE = C(1, 1, 1), SLATE = C(0.36, 0.38, 0.43), CAP = C(0.74, 0.8, 0.6), PLASTER = C(1.5, 1.6, 1.7), DIM = C(0.8, 0.78, 0.76);
    const TS = 0.2, R = () => L.rand();
    // his brick: courses of short dabs, red, orange and brown, a little pale mortar, darker where it is weathered
    this.tBrick = strokes({
      size: 256, seed: 6075, n: 4200, len: [7, 13], width: [2.2, 3.4], bend: 0.05, lift: 0.07, base: col('#8f4f37', 0.2).getStyle(),
      colors: [['#a45a3d', 4], ['#b0633f', 3], ['#96513a', 3], ['#b9714a', 1.2], ['#84493a', 1.4], ['#c79a78', 0.22], ['#a06a4e', 1]].map(([c, w]) => [col(c, 0.2).getStyle(), w]),
      angle: (x, y, r) => (r() - 0.5) * 0.1,
    });
    const lin = pts => s => { for (let i = 1; i < pts.length; i++) if (s <= pts[i][0]) { const a = pts[i - 1], b = pts[i]; return a[1] + (b[1] - a[1]) * clamp01((s - a[0]) / (b[0] - a[0])); } return pts[pts.length - 1][1]; };
    // A wall from (u0, o0) to (u1, o1), th thick to the right of the way it runs, in columns each with its own top
    // (broken brickwork goes down in steps).
    const wall = (u0, o0, u1, o1, th, top, { cols = 10, bot = -0.03, out = WHITE, inn = SLATE, cap = CAP, jit = 0.012 } = {}) => {
      const len = Math.hypot(u1 - u0, o1 - o0), du = (u1 - u0) / len, dz = (o1 - o0) / len, nu = dz, no = -du, uo = R() * 3;
      for (let j = 0; j < cols; j++) {
        const s0 = j / cols, s1 = (j + 1) / cols, ht = top((s0 + s1) / 2) + (R() - 0.5) * 2 * jit; if (ht <= bot) continue;
        const a0 = [u0 + du * len * s0, o0 + dz * len * s0], a1 = [u0 + du * len * s1, o0 + dz * len * s1], b0 = [a0[0] + nu * th, a0[1] + no * th], b1 = [a1[0] + nu * th, a1[1] + no * th];
        const x0 = uo + s0 * len / TS, x1 = uo + s1 * len / TS, y0 = bot / TS, y1 = ht / TS, tw = th / TS;
        quad([...a0, bot], [...a1, bot], [...a1, ht], [...a0, ht], [-nu, 0, -no], out, 0, [x0, y0], [x1, y0], [x1, y1], [x0, y1]);
        quad([...b1, bot], [...b0, bot], [...b0, ht], [...b1, ht], [nu, 0, no], inn, 0, [x1 + 0.37, y0], [x0 + 0.37, y0], [x0 + 0.37, y1], [x1 + 0.37, y1]);
        quad([...a0, ht], [...a1, ht], [...b1, ht], [...b0, ht], [0, 1, 0], cap, 0, [x0, y1], [x1, y1], [x1, y1 + tw], [x0, y1 + tw]);
        quad([...b0, bot], [...a0, bot], [...a0, ht], [...b0, ht], [-du, 0, -dz], out, 0, [x0 - tw, y0], [x0, y0], [x0, y1], [x0 - tw, y1]);
        quad([...a1, bot], [...b1, bot], [...b1, ht], [...a1, ht], [du, 0, dz], out, 0, [x1, y0], [x1 + tw, y0], [x1 + tw, y1], [x1, y1]);
      }
    };
    // Something dark let into a wall's face: a window, a putlog hole, a doorway (round-headed if arch).
    const DARK = col('#1d1612', 0.2), DARK2 = col('#2a211c', 0.2);
    const mark = (u0, o0, u1, o1, s, h, w, hh, arch = false, k = DARK) => {
      const len = Math.hypot(u1 - u0, o1 - o0), du = (u1 - u0) / len, dz = (o1 - o0) / len, nu = -dz, no = du, e = 0.0016;
      const at = (x, y) => [u0 + du * (s + x) + nu * e, o0 + dz * (s + x) + no * e, h + y], n = [nu, 0, no];
      quad(at(-w / 2, 0), at(w / 2, 0), at(w / 2, hh), at(-w / 2, hh), n, k, 2, [0, 0], [1, 0], [1, 1], [0, 1]);
      if (arch) for (let i = 0; i < 6; i++) { const a0 = Math.PI * i / 6, a1 = Math.PI * (i + 1) / 6; vert(at(0, hh), n, k, [0, 0], 2); vert(at(Math.cos(a0) * w / 2, hh + Math.sin(a0) * w / 2), n, k, [0, 0], 2); vert(at(Math.cos(a1) * w / 2, hh + Math.sin(a1) * w / 2), n, k, [0, 0], 2); }
    };
    // A block, turned and tipped (fallen masonry, a ledge): centre [u, o, h], size [along, up, out].
    const M4 = new THREE.Matrix4(), E = new THREE.Euler(), V = new THREE.Vector3(), NN = new THREE.Vector3();
    const block = (c, s, rot = [0, 0, 0], tint = WHITE, cap = CAP, tex = 0) => {
      M4.makeRotationFromEuler(E.set(rot[0], rot[1], rot[2], 'YXZ'));
      const pt = (x, y, z) => { V.set(x * s[0] / 2, y * s[1] / 2, z * s[2] / 2).applyMatrix4(M4); return [c[0] + V.x, c[1] + V.z, c[2] + V.y]; };
      const face = (ax, sg) => {
        const o = [0, 1, 2].filter(i => i !== ax), q = (a, b) => { const v = [0, 0, 0]; v[ax] = sg; v[o[0]] = a; v[o[1]] = b; return pt(v[0], v[1], v[2]); };
        const nv = [0, 0, 0]; nv[ax] = sg; NN.set(nv[0], nv[1], nv[2]).applyMatrix4(M4);
        const w = s[o[0]] / TS, h = s[o[1]] / TS, x0 = R() * 3, y0 = R() * 3;
        quad(q(-1, -1), q(1, -1), q(1, 1), q(-1, 1), [NN.x, NN.y, NN.z], NN.y > 0.6 ? cap : tint, tex, [x0, y0], [x0 + w, y0], [x0 + w, y0 + h], [x0, y0 + h]);
      };
      for (const ax of [0, 1, 2]) for (const sg of [-1, 1]) face(ax, sg);
    };

    // ---- the ground: a bank at the foot of the wall, rising to the left, going down into the water
    {
      const NU = 30, NO = 9, u0 = -1.1, u1 = 1.1, o0 = -0.035, o1 = 0.6, cA = C(1, 1, 1), cB = C(0.72, 0.6, 0.48), cc = new THREE.Color();
      const P = (i, j) => { const u = u0 + (u1 - u0) * i / NU, o = o0 + (o1 - o0) * j / NO; return [u, o, ground(u, o)]; };
      const Nn = (u, o) => { const e = 0.02, dx = (ground(u + e, o) - ground(u - e, o)) / (2 * e), dz = (ground(u, o + e) - ground(u, o - e)) / (2 * e), l = Math.hypot(dx, 1, dz); return [-dx / l, 1 / l, -dz / l]; };
      const vv = p => { cc.copy(cA).lerp(cB, ease.smooth(ramp(p[1], shore(p[0]) - 0.16, shore(p[0]) + 0.02)) * 0.8); vert(p, Nn(p[0], p[1]), cc, [p[0] / 0.45, p[1] / 0.45], 1); };
      for (let i = 0; i < NU; i++) for (let j = 0; j < NO; j++) { const a = P(i, j), b = P(i + 1, j), c = P(i + 1, j + 1), d = P(i, j + 1); vv(a); vv(b); vv(c); vv(a); vv(c); vv(d); }
    }
    // ---- the tower: a shell of brick, whole on the left and to the top, broken open at the front right corner
    {
      const T = TOWER;
      wall(T.u0, T.o1, T.u1, T.o1, T.th, lin([[0, 0.6], [0.1, 0.585], [0.2, 0.61], [0.3, 0.63], [0.42, 0.655], [0.5, 0.645], [0.545, 0.62], [0.56, 0.46], [0.62, 0.4], [0.7, 0.31], [0.8, 0.25], [0.9, 0.2], [1, 0.17]]), { cols: 36, jit: 0.005 });
      wall(T.u1, T.o1, T.u1, T.o0, T.th, lin([[0, 0.17], [0.3, 0.2], [0.5, 0.3], [0.65, 0.42], [0.8, 0.52], [1, 0.57]]), { cols: 22, out: DIM, jit: 0.006 });
      wall(T.u1, T.o0, T.u0, T.o0, T.th, lin([[0, 0.57], [0.3, 0.6], [0.6, 0.635], [1, 0.61]]), { cols: 28, jit: 0.006 });
      wall(T.u0, T.o0, T.u0, T.o1, T.th, lin([[0, 0.61], [0.5, 0.6], [1, 0.6]]), { cols: 22, jit: 0.006 });
      block([(T.u0 + T.u1) / 2, T.o0 + T.th + 0.03, LEDGE - 0.01], [T.u1 - T.u0 - 2 * T.th, 0.02, 0.06], [0, 0, 0], SLATE, C(0.55, 0.52, 0.5));      // the ledge inside
      block([(T.u0 + T.u1) / 2, (T.o0 + T.o1) / 2, 0.07], [T.u1 - T.u0 - 2 * T.th, 0.02, T.o1 - T.o0 - 2 * T.th], [0, 0, 0], SLATE, C(0.3, 0.32, 0.28));      // and its floor, dark
      // the lower block against its left side, and the thin slab of an upper wall still standing behind it
      wall(-0.235, 0.42, T.u0, 0.42, 0.12, lin([[0, 0.33], [0.5, 0.37], [1, 0.36]]), { cols: 9, jit: 0.006 });
      wall(-0.228, 0.32, -0.196, 0.32, 0.02, lin([[0, 0.5], [1, 0.47]]), { cols: 2, out: PLASTER, jit: 0.006 });
      // his openings: the square window high in the lit face, the two round-headed ones at the foot, putlog holes
      mark(T.u0, T.o1, T.u1, T.o1, 0.068, 0.315, 0.03, 0.04, false);
      mark(T.u0, T.o1, T.u1, T.o1, 0.078, 0.075, 0.024, 0.036, true); mark(T.u0, T.o1, T.u1, T.o1, 0.142, 0.045, 0.02, 0.022, true, DARK2);
      for (const [s, h] of [[0.03, 0.2], [0.09, 0.2], [0.035, 0.42], [0.085, 0.425], [0.05, 0.5], [0.1, 0.505], [0.02, 0.545], [0.075, 0.56], [0.045, 0.27], [0.1, 0.275]]) mark(T.u0, T.o1, T.u1, T.o1, s, h, 0.007, 0.007);
      mark(T.u0, T.o0, T.u0, T.o1, 0.09, 0.3, 0.02, 0.03, false); mark(-0.235, 0.42, T.u0, 0.42, 0.03, 0.2, 0.018, 0.026, false, DARK2);
    }
    // ---- the ruins to the left: the low wall with its blind arch, the gable, the far wall and its doorway, the arches up the slope
    wall(-0.47, 0.415, -0.235, 0.405, 0.022, lin([[0, 0.09], [0.3, 0.1], [0.6, 0.13], [1, 0.15]]), { cols: 30, jit: 0.006 });
    mark(-0.47, 0.415, -0.235, 0.405, 0.15, 0.06, 0.022, 0.03, true, DARK2);
    wall(-0.69, 0.36, -0.55, 0.35, 0.03, lin([[0, 0.2], [0.15, 0.27], [0.3, 0.36], [0.42, 0.37], [0.55, 0.3], [0.7, 0.22], [0.85, 0.16], [1, 0.12]]), { cols: 24, jit: 0.005 });
    wall(-0.9, 0.37, -0.69, 0.365, 0.025, lin([[0, 0.11], [0.4, 0.17], [0.8, 0.18], [1, 0.2]]), { cols: 22, jit: 0.006 });
    mark(-0.9, 0.37, -0.69, 0.365, 0.1, 0.04, 0.05, 0.07, true);
    for (let k = 0; k < 3; k++) wall(-0.525 + k * 0.062, 0.18, -0.503 + k * 0.062, 0.18, 0.03, () => 0.315, { cols: 1, bot: 0.08, out: DIM, jit: 0 });
    wall(-0.53, 0.18, -0.372, 0.18, 0.03, lin([[0, 0.36], [0.5, 0.375], [1, 0.35]]), { cols: 20, bot: 0.3, out: DIM, jit: 0.006 });
    wall(-0.372, 0.18, -0.31, 0.19, 0.03, lin([[0, 0.3], [1, 0.2]]), { cols: 8, bot: 0.05, out: DIM, jit: 0.006 });
    // ---- fallen masonry on the slope, going green
    const DULL = C(0.62, 0.58, 0.56), DULLER = C(0.5, 0.52, 0.44);
    for (const [c, sz, r] of [[[-0.36, 0.475, 0.05], [0.085, 0.045, 0.055], [0.5, 0.25, 0.42]], [[-0.29, 0.505, 0.028], [0.065, 0.04, 0.048], [-0.4, 0.12, -0.5]], [[-0.44, 0.488, 0.038], [0.058, 0.036, 0.046], [1.1, -0.35, 0.22]], [[-0.5, 0.452, 0.066], [0.072, 0.044, 0.05], [0.2, 0.5, 0.55]], [[-0.2, 0.512, 0.02], [0.048, 0.028, 0.038], [2.0, 0.12, 0.18]]]) block(c, sz, r, DULL, DULLER);
    // ---- the brown stone in the water, in front
    const stone = (cu, co, A, B, Cz, seed, lit, shade) => {
      const g = shape.ball(1, 0xffffff, 2), p = g.attributes.position, cc = new THREE.Color();
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i), y = p.getY(i), z = p.getZ(i), k = 1 + 0.09 * Math.sin(x * 3 + z * 2.5 + seed) + 0.04 * Math.sin(y * 5 + x * 4 + seed);
        NN.set(x / A, Math.max(0.05, y) / B, z / Cz).normalize(); cc.copy(shade).lerp(lit, ease.smooth(clamp01(NN.y * 0.9 + 0.2)));
        vert([cu + x * A * k, co + z * Cz * k, Math.max(-0.3, y) * B * k + 0.004], [NN.x, NN.y, NN.z], cc, [x, z], 2);
      }
    };
    stone(0.2, 0.97, 0.085, 0.036, 0.055, 0.4, col('#6f5a44', 0.3), col('#35291f', 0.3));
    stone(0.31, 1.01, 0.035, 0.016, 0.028, 2.2, col('#6f5a44', 0.3), col('#35291f', 0.3));
    // ---- reeds: in the shallows in front, round the stone, and under the tower. Each blade is three joints; the
    // wind bends it in the shader, further the higher up the blade (sway), by its own length (lever).
    {
      const dk = col('#2d3220', 0.3), md = col('#55592e', 0.3), tip = col('#8f8b52', 0.3), seed = col('#4a3524', 0.3), cc = new THREE.Color(), up = [-0.3, 0.8, 0.5];
      const blade = (bu, bo, hgt, yaw, lean) => {
        const w = 0.0035 + 0.002 * R(), cx = Math.cos(yaw), sx = Math.sin(yaw), J = 3, heavy = R() < 0.16;
        const at = (k, side) => { const t = k / J, off = lean * t * t * hgt, ww = w * (1 - 0.75 * t) * side; return [bu + cx * off + sx * ww, bo + sx * off - cx * ww, hgt * t * (1 - 0.18 * lean * t)]; };
        for (let k = 0; k < J; k++) for (const [kk, sd] of [[k, -1], [k, 1], [k + 1, 1], [k, -1], [k + 1, 1], [k + 1, -1]]) {
          const t = kk / J; cc.copy(dk).lerp(md, clamp01(t * 2)).lerp(heavy && t > 0.9 ? seed : tip, clamp01(t * 2 - 1));
          vert(at(kk, sd), up, cc, [0, 0], 3, t, hgt * Z);
        }
      };
      const clump = (cu, co, n, spread, h0, h1) => { for (let i = 0; i < n; i++) { const a = R() * TAU, rr = Math.sqrt(R()) * spread; blade(cu + Math.cos(a) * rr * 1.6, co + Math.sin(a) * rr, h0 + (h1 - h0) * R(), R() * TAU, 0.5 + 0.9 * R()); } };
      clump(0.2, 0.99, 14, 0.06, 0.08, 0.17); clump(0.44, 1.03, 16, 0.07, 0.07, 0.16); clump(0.66, 0.98, 14, 0.06, 0.06, 0.15); clump(-0.03, 1.07, 10, 0.05, 0.05, 0.12);
      clump(-0.38, 1.04, 12, 0.06, 0.06, 0.14); clump(-0.7, 0.92, 12, 0.05, 0.06, 0.15); clump(-0.3, 0.6, 9, 0.04, 0.05, 0.12); clump(0.92, 0.78, 9, 0.04, 0.05, 0.13);
      clump(-0.98, 0.66, 8, 0.04, 0.05, 0.12); clump(0.07, 0.58, 6, 0.035, 0.04, 0.09);
    }
    // ---- the two birds: jackdaw-dark, grey at the nape. A body and two wings each, moved by their own matrices.
    this.bScale = 1.1;
    {
      const BS = this.bScale, black = col('#232329', 0.15), wingc = col('#2c2b30', 0.15), prim = col('#18181c', 0.15), grey = col('#7d818a', 0.15), beak = col('#2e2c2b', 0.1), eye = col('#cfd6dc', 0.05), leg = col('#2a2624', 0.1);
      const add = (g, texk = 4) => { const p = g.attributes.position, n = g.attributes.normal, c = g.attributes.color; for (let i = 0; i < p.count; i++) { pos.push(p.getX(i) * BS, p.getY(i) * BS, p.getZ(i) * BS); nor.push(n.getX(i), n.getY(i), n.getZ(i)); cl.push(c.getX(i), c.getY(i), c.getZ(i)); uv.push(0, 0); inf.push(texk, 0, part, 0); } };
      const bodyG = () => {
        const prof = [[0.0015, 0], [0.006, 0.006], [0.0115, 0.018], [0.0158, 0.032], [0.0165, 0.044], [0.0148, 0.054], [0.0122, 0.0605], [0.0124, 0.067], [0.0112, 0.073], [0.0075, 0.078], [0.0042, 0.082], [0.0008, 0.089]];
        const body = shape.lathe(prof, 12, black), p = body.attributes.position;
        for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); p.setXYZ(i, x * 0.92, -z + 0.006 * ease.smooth((y - 0.05) / 0.02), y - 0.04); }
        body.computeVertexNormals();
        shape.paint(body, (c, n) => (c.z > 0.039 ? beak : c.z > 0.016 && c.z < 0.031 && n.y > -0.45 && !(n.y > 0.8 && c.z > 0.024) ? grey : black));
        const eyes = [-1, 1].map(s => shape.move(shape.ball(0.0022, eye, 1), s * 0.0098, 0.0105, 0.0285));
        const tail = new THREE.BufferGeometry(); tail.setAttribute('position', new THREE.Float32BufferAttribute([0, 0.003, -0.03, -0.013, 0.001, -0.074, -0.004, 0.001, -0.078, 0, 0.003, -0.03, -0.004, 0.001, -0.078, 0.004, 0.001, -0.078, 0, 0.003, -0.03, 0.004, 0.001, -0.078, 0.013, 0.001, -0.074], 3));
        tail.computeVertexNormals(); tail.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(27), 3)); shape.paint(tail, () => prim);
        const legs = [-1, 1].map(s => shape.move(shape.cyl(0.0013, 0.0013, 0.016, 4, leg), s * 0.006, -0.02, 0.002));
        return shape.merge([body, ...eyes, tail, ...legs]);
      };
      const wingG = () => {
        const pts = [[0, 0.012], [0, -0.017], [0.028, 0.018], [0.03, -0.024], [0.06, 0.013], [0.062, -0.023], [0.086, 0.004], [0.084, -0.019], [0.105, -0.008], [0.098, -0.017]];
        const tri = [[0, 2, 1], [1, 2, 3], [2, 4, 3], [3, 4, 5], [4, 6, 5], [5, 6, 7], [6, 8, 7], [7, 8, 9]], ps = [];
        for (const t of tri) for (const k of t) ps.push(pts[k][0], (pts[k][1] > 0 ? 0.003 : 0) * Math.min(1, pts[k][0] * 30), pts[k][1]);
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(ps, 3)); g.computeVertexNormals();
        g.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(ps.length), 3)); shape.paint(g, (c, n, f) => (f >= 5 || f % 2 ? prim : wingc));
        return g;
      };
      const bg = bodyG(), wg = wingG();
      for (let b = 0; b < 2; b++) { part = b * 3 + 1; add(bg); part = b * 3 + 2; add(wg); part = b * 3 + 3; add(wg); }
      part = 0;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(cl, 3)); g.setAttribute('aUv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('aInfo', new THREE.Float32BufferAttribute(inf, 4));
    this.parts = Array.from({ length: 6 }, () => new THREE.Matrix4().makeScale(0, 0, 0));
    const u = this.su = { ...this.lu, tBrick: { value: this.tBrick }, tBank: { value: this.tBank }, uPart: { value: this.parts }, uZ: { value: Z }, uWet: { value: 0 } };
    const m = new THREE.MeshBasicMaterial({ color: 0xffffff, vertexColors: true, fog: false, side: THREE.DoubleSide });
    m.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, u);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', `#include <common>
attribute vec4 aInfo; attribute vec2 aUv; uniform mat4 uPart[6]; uniform vec3 uO; uniform vec4 uAx, uWind; uniform float uTime, uZ;
varying vec3 vN; varying vec4 vInfo; varying vec2 vUv2;`)
        .replace('#include <begin_vertex>', `#include <begin_vertex>
  vec3 nn = normal;
  if (aInfo.z > 0.5) { mat4 pm = uPart[int(aInfo.z + 0.5) - 1]; transformed = (pm * vec4(position, 1.0)).xyz; nn = mat3(pm) * normal; }
  else if (aInfo.y > 0.0) {
    // a reed in the wind: it leans the way the wind goes (to the right), and shivers
    float su = dot(position.xz - uO.xz, uAx.xy) / uZ, w = uWind.x + uWind.y * smoothstep(uWind.z + 0.15, uWind.z - 0.5, su);
    float ph = position.x * 31.0 + position.z * 17.0, k = aInfo.y * aInfo.y;
    float lean = (w * 0.8 * (1.0 + 0.16 * sin(uTime * (6.0 + 3.0 * fract(ph)) + ph)) + 0.07 * sin(uTime * 1.3 + ph * 0.3)) * aInfo.w * k;
    transformed.xz += uAx.xy * lean; transformed.y -= lean * lean / max(aInfo.w, 0.03) * 0.55 * aInfo.y;
  }
  vN = nn; vInfo = aInfo; vUv2 = aUv;`);
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', `#include <common>
${LIGHT}
uniform sampler2D tBrick, tBank; uniform float uZ, uWet;
varying vec3 vN; varying vec4 vInfo; varying vec2 vUv2; vec3 fCol;`)
        .replace('#include <map_fragment>', `#include <map_fragment>
{
  vec2 lq = lifeP.xz - uO.xz; vec3 Ps = vec3(dot(lq, uAx.xy), lifeP.y - uO.y, dot(lq, uAx.zw)) / uZ;
  // it stands up out of the water: nearest the tower first, from the ground up, the edge ragged
  if (vInfo.x < 3.5) {
    float r = clamp(uRise * 1.75 - length(Ps.xz - uFoot) * 0.6, 0.0, 1.0);
    if (r < 1.0 && Ps.y > r * 0.8 - 0.03 + (texture2D(tNoise, vec2(Ps.x * 2.3 + Ps.z, Ps.y * 2.3 + Ps.z * 1.7)).a - 0.5) * 0.09) discard;
  }
  vec3 n = normalize(vN); if (dot(n, cameraPosition - lifeP) < 0.0) n = -n;
  vec3 ns = vec3(dot(n.xz, uAx.xy), n.y, dot(n.xz, uAx.zw));
  vec3 alb = vColor;
  if (vInfo.x < 0.5) {
    // brick: his dabs in courses, streaked dark by eighty winters, green and damp at the foot
    alb *= texture2D(tBrick, vUv2).rgb * (0.72 + 0.56 * texture2D(tNoise, vUv2 * vec2(0.9, 0.16)).r);
    alb = mix(alb, alb * vec3(0.6, 0.72, 0.5), (1.0 - smoothstep(0.02, 0.12, Ps.y - 0.03)) * 0.55);
  } else if (vInfo.x < 1.5) alb *= texture2D(tBank, vUv2).rgb * 1.15;
  else alb *= 0.8 + 0.4 * texture2D(tNoise, vUv2 * 0.6 + Ps.xy * 3.0).g;
  alb *= 1.0 - 0.16 * uWet * step(vInfo.x, 3.5);
  fCol = lightOn(alb, ns, Ps);
}`)
        .replace('#include <opaque_fragment>', '  outgoingLight = fCol;\n#include <opaque_fragment>');
    };
    m.customProgramCacheKey = () => 'egmond-land';
    this.land = new THREE.Mesh(g, m); this.land.renderOrder = 1;
    L.add(this.land);
  },

  // ---------------------------------------------------------------- soft cards: his foliage, moss and plaster on the brick, the rain
  buildCards(L, col) {
    const atlas = canvasTexture(512, 512, (g, w, h) => {
      g.clearRect(0, 0, w, h); g.scale(2, 2);
      const clip = (x, y, f) => { g.save(); g.beginPath(); g.rect(x, y, 128, 128); g.clip(); f(x + 64, y + 64); g.restore(); };
      // 0: a mass of his leaves: many small dabs heaped in a mound, lit on the upper left (red: lit to dark)
      const leaves = (cx, cy, ink) => {
        const sub = Array.from({ length: 6 }, () => [cx + (L.rand() - 0.5) * 64, cy + (L.rand() - 0.5) * 42, 15 + L.rand() * 14]); sub.push([cx, cy + 6, 24]);
        g.globalAlpha = 0.9; g.fillStyle = ink(40); for (const q of sub) { g.beginPath(); g.ellipse(q[0], q[1], q[2] * 0.8, q[2] * 0.68, 0, 0, TAU); g.fill(); } g.globalAlpha = 1;
        for (let i = 0; i < 900; i++) {
          const s = sub[Math.floor(L.rand() * sub.length)], a = L.rand() * TAU, rr = Math.sqrt(L.rand()) * s[2], x = s[0] + Math.cos(a) * rr, y = s[1] + Math.sin(a) * rr * 0.85;
          if (Math.abs(x - cx) > 58 || Math.abs(y - cy) > 58) continue;
          const lit = clamp01(0.3 - (x - s[0]) / (s[2] * 2.6) - (y - s[1]) / (s[2] * 2.0) + (L.rand() - 0.5) * 0.5), v = Math.floor(45 + 200 * lit * lit);
          g.fillStyle = ink(v); g.beginPath(); g.ellipse(x, y, 1.2 + L.rand() * 1.5, 0.9 + L.rand() * 0.9, L.rand() * Math.PI, 0, TAU); g.fill();
        }
      };
      clip(0, 0, (cx, cy) => leaves(cx, cy, v => `rgb(${v},${v},${v})`));
      // 1: one dab of paint, a few loaded strokes over each other, ragged at the ends
      clip(128, 0, (cx, cy) => {
        g.lineCap = 'round';
        for (let i = 0; i < 14; i++) {
          const y = cy + (L.rand() - 0.5) * 56, half = 40 * Math.sqrt(Math.max(0.05, 1 - Math.pow((y - cy) / 30, 2) * 0.8)), x0 = cx - half * (0.7 + 0.3 * L.rand()), x1 = cx + half * (0.7 + 0.3 * L.rand());
          const v = Math.floor(110 + 145 * clamp01(0.55 - (y - cy) / 70 + (L.rand() - 0.5) * 0.4));
          g.strokeStyle = `rgb(${v},${v},${v})`; g.lineWidth = 7 + L.rand() * 7; g.beginPath(); g.moveTo(x0, y); g.quadraticCurveTo(cx, y - 4 + L.rand() * 8, x1, y + (L.rand() - 0.5) * 6); g.stroke();
        }
      });
      // 2: the elder by the tower: leaves, and its flat heads of white blossom (green: where the blossom is)
      clip(0, 128, (cx, cy) => {
        leaves(cx, cy, v => `rgb(${v},0,0)`);
        for (let k = 0; k < 9; k++) { const a = L.rand() * TAU, rr = Math.sqrt(L.rand()) * 38, x = cx + Math.cos(a) * rr, y = cy - 4 + Math.sin(a) * rr * 0.7; for (let i = 0; i < 9; i++) { g.fillStyle = 'rgb(255,255,255)'; g.beginPath(); g.arc(x + (L.rand() - 0.5) * 13, y + (L.rand() - 0.5) * 5, 1.3 + L.rand() * 1.1, 0, TAU); g.fill(); } }
      });
      // 3: a streak of rain
      clip(128, 128, (cx, cy) => { const gr = g.createLinearGradient(cx, cy - 60, cx, cy + 60); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.9)'); gr.addColorStop(1, 'rgba(255,255,255,0.2)'); g.strokeStyle = gr; g.lineWidth = 7; g.lineCap = 'round'; g.beginPath(); g.moveTo(cx, cy - 56); g.lineTo(cx, cy + 56); g.stroke(); });
    }, false);
    const n = N_CARD, geo = new THREE.PlaneGeometry(1, 1);
    this.aInfo = new THREE.InstancedBufferAttribute(new Float32Array(n * 4), 4).setUsage(THREE.DynamicDrawUsage);
    this.aCol = new THREE.InstancedBufferAttribute(new Float32Array(n * 3), 3).setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('aInfo', this.aInfo); geo.setAttribute('aCol', this.aCol);
    const cu = this.cu = { ...this.lu, tAtlas: { value: atlas }, uZ: { value: Z }, cBlossom: { value: col('#e9e6d6', 0.15) } };
    const m = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide });
    m.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, cu);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', `#include <common>
${LIGHT}
uniform float uZ; attribute vec4 aInfo; attribute vec3 aCol; varying vec4 vInfo; varying vec3 vCol; varying vec2 vQ; varying float vSun;`)
        .replace('#include <project_vertex>', `vec3 ic = instanceMatrix[3].xyz; vec4 mvPosition = modelViewMatrix * vec4(ic, 1.0);
  float cs = cos(aInfo.z), sn = sin(aInfo.z); vec2 q = vec2(cs * position.x - sn * position.y, sn * position.x + cs * position.y);
  mvPosition.xy += vec2(position.x * instanceMatrix[0][0], position.y * instanceMatrix[1][1]) * mat2(cs, sn, -sn, cs);
  vQ = position.xy + 0.5; vInfo = aInfo; vCol = aCol;
  { vec2 lq = ic.xz - uO.xz; vec3 Ps = vec3(dot(lq, uAx.xy), ic.y - uO.y, dot(lq, uAx.zw)) / uZ; vSun = sunAt(Ps.x) * (1.0 - towerShade(Ps)); }
  gl_Position = projectionMatrix * mvPosition;`);
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', `#include <common>
uniform sampler2D tAtlas; uniform vec3 cAmb, cSun, cBlossom; uniform float uStorm; varying vec4 vInfo; varying vec3 vCol; varying vec2 vQ; varying float vSun;`)
        .replace('#include <map_fragment>', `{
  float kd = vInfo.x; vec2 cell = kd < 0.5 ? vec2(0.0, 1.0) : kd < 1.5 ? vec2(1.0, 1.0) : kd < 2.5 ? vec2(0.0, 0.0) : vec2(1.0, 0.0);
  vec4 tx = texture2D(tAtlas, (clamp(vQ, 0.02, 0.98) + cell) * 0.5);
  vec3 lc = cAmb * mix(1.0, 0.5, uStorm) + cSun * vSun * vInfo.w * (0.25 + 0.75 * tx.r), c; float a;
  if (kd < 0.5) { c = vCol * (0.42 + 0.95 * tx.r) * lc; a = smoothstep(0.3, 0.6, tx.a) * vInfo.y; }
  else if (kd < 1.5) { c = vCol * (0.55 + 0.7 * tx.r) * lc; a = smoothstep(0.25, 0.55, tx.a) * vInfo.y; }
  else if (kd < 2.5) { c = mix(vCol * (0.42 + 0.95 * tx.r), cBlossom, tx.g) * lc; a = smoothstep(0.3, 0.6, tx.a) * vInfo.y; }
  else { c = vCol; a = tx.a * vInfo.y; }
  if (a < 0.01) discard;
  diffuseColor = vec4(c, a);
}`);
    };
    m.customProgramCacheKey = () => 'egmond-cards';
    const mesh = this.cards = new THREE.InstancedMesh(geo, m, n);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); mesh.count = 0; mesh.renderOrder = 6;
    L.add(mesh);
    // ---- where they are: [kind, along, out, up (middle), size, colour, how much sun it takes, how far the wind moves it]
    const R = () => L.rand(), F = this.F = [];
    const pick = a => a[Math.floor(R() * a.length)];
    const deep = ['#1f2a18', '#263220', '#2c381f', '#1b2216', '#323d22'].map(c => col(c, 0.3)), mid = ['#3a4724', '#445028', '#4d5a2c', '#33401f'].map(c => col(c, 0.3)), olive = ['#4a4f28', '#575a2e', '#404a26', '#63602f'].map(c => col(c, 0.3));
    const mass = (uc, oc, w, h0, h1, n, s0, s1, cols, sun = 0.7) => { for (let i = 0; i < n; i++) { const u = uc + (R() - 0.5) * w, o = oc + (R() - 0.5) * 0.08, hh = h0 + (h1 - h0) * R(); F.push({ k: 0, u, o, h: hh, s: s0 + (s1 - s0) * R(), q: 1.1 + 0.5 * R(), c: pick(cols), sun: sun * (0.5 + 0.5 * (hh - h0) / Math.max(0.01, h1 - h0)), sway: 0.012 + 0.012 * R(), ph: R() * TAU, spin: (R() - 0.5) * 0.5 }); } };
    mass(-0.84, 0.09, 0.5, 0.15, 0.46, 21, 0.17, 0.26, deep);               // the wood on the left
    mass(-0.45, 0.07, 0.42, 0.28, 0.44, 10, 0.13, 0.2, mid, 0.9);           // the hillside behind the arches, greener
    mass(-0.27, 0.13, 0.12, 0.2, 0.44, 6, 0.11, 0.17, deep);                // the tree between the gable and the tower
    mass(0.36, 0.14, 0.6, 0.09, 0.26, 14, 0.15, 0.23, deep, 0.5);           // the far bank, right of the tower
    mass(0.93, 0.1, 0.4, 0.1, 0.3, 10, 0.17, 0.25, deep, 0.6);              // the tall trees at the right: their dark feet
    mass(0.93, 0.07, 0.42, 0.26, 0.5, 16, 0.16, 0.25, olive, 0.8);          // and their heads, paler
    mass(0.7, 0.38, 0.14, 0.07, 0.15, 3, 0.12, 0.15, [col('#7a6a34', 0.3), col('#6a6230', 0.3)], 0.8);      // the ochre bush at the water
    for (let i = 0; i < 3; i++) F.push({ k: 2, u: 0.085 + i * 0.045, o: 0.385 + 0.03 * R(), h: 0.1 + 0.05 * i + 0.02 * R(), s: 0.13 + 0.03 * R(), c: pick(deep), sun: 0.7, sway: 0.01, ph: R() * TAU, spin: (R() - 0.5) * 0.4 });      // the elder in flower at the tower's foot
    // grass and weed along the bank, on the fallen blocks and round the walls' feet
    for (let i = 0; i < 16; i++) { const u = -0.95 + 1.9 * (i + R()) / 16, o = shore(u) - 0.05 - 0.1 * R(); F.push({ k: 0, u, o, h: ground(u, o) + 0.025, s: 0.07 + 0.04 * R(), c: pick(mid), sun: 0.9, sway: 0.006, ph: R() * TAU, spin: (R() - 0.5) * 0.6 }); }
    for (const [u, o, h, s] of [[-0.36, 0.5, 0.11, 0.075], [-0.3, 0.52, 0.075, 0.06], [-0.45, 0.5, 0.085, 0.06], [-0.5, 0.46, 0.115, 0.06], [-0.4, 0.43, 0.13, 0.07], [-0.62, 0.38, 0.1, 0.07], [-0.2, 0.45, 0.07, 0.06], [-0.13, 0.46, 0.055, 0.06], [0.0, 0.46, 0.05, 0.06]]) F.push({ k: 0, u, o, h, s, c: pick(mid), sun: 0.9, sway: 0.005, ph: R() * TAU, spin: (R() - 0.5) * 0.8 });
    // ivy on the lit face, as he has it
    for (const [u, h, s] of [[-0.088, 0.2, 0.05], [-0.095, 0.255, 0.04], [-0.082, 0.16, 0.04]]) F.push({ k: 0, u, o: TOWER.o1 + 0.004, h, s, c: pick(deep), sun: 0.8, sway: 0.002, ph: R() * TAU, spin: R() * 2 });
    // plaster still clinging, pale; and dabs of brick and moss that break the walls' hard tops
    const plaster = col('#8f8672', 0.3), bricks = ['#8e4a33', '#9a5639', '#7c4230', '#86543c'].map(c => col(c, 0.3)), moss = col('#465028', 0.3);
    for (const [u, o, h, s] of [[-0.37, 0.42, 0.105, 0.055], [-0.565, 0.368, 0.17, 0.05], [-0.212, 0.303, 0.44, 0.04], [0.005, 0.445, 0.13, 0.04], [-0.165, 0.445, 0.17, 0.035]]) F.push({ k: 1, u, o, h, s, q: 1.5, c: plaster, sun: 0.5, sway: 0, ph: 0, spin: (R() - 0.5) * 0.5 });
    for (let i = 0; i < 12; i++) { const s = (i + R()) / 12, u = TOWER.u0 + s * (TOWER.u1 - TOWER.u0), h = s < 0.55 ? 0.6 + 0.05 * Math.sin(s * 5) : lerp(0.44, 0.17, (s - 0.55) / 0.45); F.push({ k: 1, u, o: TOWER.o1 - 0.004, h: h + 0.002, s: 0.022 + 0.01 * R(), q: 1.5, c: R() < 0.4 ? moss : pick(bricks), sun: 0.55, sway: 0, ph: 0, spin: (R() - 0.5) * 0.6 }); }
    for (const [u, o, h] of [[-0.62, 0.356, 0.36], [-0.66, 0.358, 0.27], [-0.58, 0.354, 0.26], [-0.45, 0.19, 0.37], [-0.2, 0.42, 0.365], [-0.3, 0.41, 0.135], [-0.8, 0.368, 0.18]]) F.push({ k: 1, u, o, h, s: 0.024 + 0.01 * R(), q: 1.5, c: R() < 0.5 ? moss : pick(bricks), sun: 0.55, sway: 0, ph: 0, spin: (R() - 0.5) * 0.6 });
    for (const f of F) f.d = Math.hypot(f.u - FOOT[0], f.o - FOOT[1]);
    this.rainC = col('#c9d0d6', 0.15);
    // the leaves the gust tears from the wood on the left and carries across
    this.leaves = Array.from({ length: N_LEAF }, (_, i) => ({ u: -1.0 + 0.5 * R(), o: 0.12 + 0.5 * R(), h: 0.24 + 0.24 * R(), v: 1.3 + 0.9 * R(), a: R(), b: R(), s: 0.016 + 0.014 * R(), c: R() < 0.35 ? col('#8a7a3c', 0.3) : pick(mid) }));
    // scratch: one row per card, then drawn far to near
    this.px = new Float32Array(n); this.py = new Float32Array(n); this.pz = new Float32Array(n); this.ps = new Float32Array(n); this.pq = new Float32Array(n);
    this.pk = new Float32Array(n); this.pw = new Float32Array(n); this.pa = new Float32Array(n); this.pr = new Float32Array(n); this.pc = new Float32Array(n * 3); this.dep = new Float32Array(n);
    this.order = Array.from({ length: n }, (_, i) => i); this.byDepth = (a, b) => this.dep[b] - this.dep[a];
  },

  // ---------------------------------------------------------------- where the two birds fly
  buildPaths(L) {
    const R = this.R, W = this.W, hid = -(L.hw + L.fw * 0.55);
    // (in metres: out from behind the frame's left side at the height he painted them, down the bare wall, round over the water)
    const paint = L.top - L.y - 0.18 * (L.hh * 2);
    this.hidden = [R(hid, -L.wall + 0.02, paint), R(hid, -L.wall + 0.02, paint - 0.06)];
    this.stall = [W(0.26, 0.7, 0.6), W(0.42, 0.84, 0.64)];
    this.inn = [
      flight([this.hidden[0], R(-0.9, 0.07, paint - 0.02), R(-1.3, 0.34, 1.7), R(-1.6, 0.8, 1.32), R(-1.3, 1.22, 0.98), R(-0.5, 1.4, 0.8), R(0.4, 1.3, 0.74), R(1.02, 1.0, 0.74), W(0.62, 0.82, 0.64), this.stall[0]], { closed: false, tension: 0.45 }),
      flight([this.hidden[1], R(-0.92, 0.09, paint - 0.1), R(-1.36, 0.42, 1.62), R(-1.6, 0.82, 1.24), R(-1.34, 1.36, 0.92), R(-0.46, 1.55, 0.76), R(0.52, 1.44, 0.7), R(1.16, 1.12, 0.74), W(0.8, 0.96, 0.66), this.stall[1]], { closed: false, tension: 0.45 }),
    ];
    // (in the scene's units: the ledge inside the tower, and the broken top)
    const lh = LEDGE + 0.019 * this.bScale / Z;
    this.ledge = [W(-0.044, 0.338, lh), W(0.0, 0.342, lh)];
    this.tops = [W(-0.092, 0.432, 0.657 + 0.019 * this.bScale / Z), W(-0.02, 0.292, 0.6 + 0.019 * this.bScale / Z)];
    this.blown = [W(0.46, 0.7, 0.54), W(0.52, 0.84, 0.6)];
    this.home = [
      flight([this.blown[0], W(0.28, 0.62, 0.44), W(0.12, 0.52, 0.45), W(0.03, 0.42, 0.47), this.ledge[0]], { closed: false, tension: 0.4 }),
      flight([this.blown[1], W(0.36, 0.7, 0.46), W(0.18, 0.56, 0.45), W(0.07, 0.44, 0.47), this.ledge[1]], { closed: false, tension: 0.4 }),
    ];
    this.bp = [new THREE.Vector3(), new THREE.Vector3()]; this.bd = new THREE.Vector3(); this.from = [new THREE.Vector3(), new THREE.Vector3()]; this.fromYaw = [0, 0];
    this.byaw = [0, 0]; this.mid = new THREE.Vector3();
    this.M = new THREE.Matrix4(); this.Wm = new THREE.Matrix4(); this.Rm = new THREE.Matrix4(); this.Tm = new THREE.Matrix4(); this.Fm = new THREE.Matrix4(); this.Q = new THREE.Quaternion(); this.E = new THREE.Euler(0, 0, 0, 'YXZ'); this.S = new THREE.Vector3();
    this.bo = { vis: false, yaw: 0, pitch: 0, roll: 0, flap: 0, fold: 0, sc: 1 };
  },

  makeScore(L, calm) {
    const s = score(L), q = calm ? 0.6 : 1;
    // the two of them calling as they come round: a jackdaw's short, hard "tchak"
    const chak = (t, v = 1, f = 1500) => { s.note(t, f, 0.075, { type: 'square', vol: 0.006 * v, to: f * 0.6, attack: 0.004 }); s.hit(t, { d: 0.06, vol: 0.006 * v, bp: 2100, q: 3, attack: 0.003 }); };
    chak(1.75); chak(1.95, 0.8, 1420); chak(2.9, 0.9, 1560); chak(3.08, 0.7); chak(3.55, 0.8, 1450);
    chak(T_GUST + 0.5, 1.1, 1620); chak(T_GUST + 0.72, 1.1, 1580); chak(T_GUST + 1.1, 0.9, 1500);
    chak(T_TOP + 0.9, 1, 1500); chak(T_TOP + 1.1, 0.8, 1440); chak(T_TOP + 3.2, 0.7, 1520);
    // far off, thunder: a long low roll, never a crack
    s.note(T_THUNDER, 41, 2.6, { type: 'sine', vol: 0.05 * q, attack: calm ? 1.4 : 0.8 }); s.hit(T_THUNDER + 0.1, { d: 2.4, vol: 0.04 * q, lp: 130, attack: calm ? 1.2 : 0.6 });
    s.hit(T_THUNDER + 0.9, { d: 1.6, vol: 0.02 * q, lp: 90, attack: 0.5 });
    s.note(T_RAIN + 0.9, 37, 2.2, { type: 'sine', vol: 0.03 * q, attack: 1.0 }); s.hit(T_RAIN + 1.0, { d: 2.0, vol: 0.022 * q, lp: 110, attack: 0.8 });
    // the gust arriving
    s.hit(T_GUST - 0.05, { d: 1.5, vol: 0.03 * q, lp: 900, hp: 160, attack: calm ? 0.7 : 0.4 });
    // two wings folding, inside
    s.hit(T_HOME, { d: 0.09, vol: 0.008, lp: 1500, hp: 400, attack: 0.01 }); s.hit(T_HOME + 0.42, { d: 0.09, vol: 0.008, lp: 1500, hp: 400, attack: 0.01 });
    if (!calm) for (let i = 0; i < 5; i++) s.hit(T_SHAKE + i * 0.07, { d: 0.05, vol: 0.005, lp: 2400, hp: 700, attack: 0.004 });
    return s.done();
  },

  hideAll() {
    this.cards.count = 0; this.cards.visible = false; this.land.visible = false; this.floor.material.visible = false;
    for (const m of this.parts) m.makeScale(0, 0, 0);
    this.fu.uSpread.value = 0; this.fu.uVeil.value = 0; this.lu.uRise.value = 0;
  },
  quiet() { this.windLo.set(0); this.windHi.set(0); this.hiss.set(0); },
  start(L, resumed) { if (!resumed) this.hideAll(); this.band = this.bands[L.calm ? 1 : 0]; this.band.from(L.t); this.floor.material.visible = true; this.land.visible = true; },
  back(L) {
    this.bT = L.t; this.rise0 = this.lu.uRise.value; this.spread0 = this.fu.uSpread.value; this.veil0 = this.fu.uVeil.value;
    for (let i = 0; i < 2; i++) { this.from[i].copy(this.bp[i]); this.fromYaw[i] = this.byaw[i]; }
    this.wasOut = [this.bT > T_OUT, this.bT > T_OUT + 0.38];
  },
  end(L) { this.hideAll(); this.quiet(); },
  reset(L) { this.hideAll(); this.quiet(); },

  // ---------------------------------------------------------------- the weather at show-time t
  weather(t, calm) {
    const w = this.wx, sp = calm ? 0.5 : 1, sm = ease.smooth;
    const lull = hump(t, T_LULL - 0.35, T_GUST + 0.05);
    const pre = (0.2 + 0.32 * sm(ramp(t, T_TURN, T_LULL - 0.35))) * (1 - 0.94 * lull), after = lerp(0.42, 0.2, sm(ramp(t, T_GUST + 1.2, T_SUN + 1.4)));
    w.wind = (t < T_GUST ? pre : lerp(0.03, after, ramp(t, T_GUST, T_GUST + 0.5))) * (calm ? 0.6 : 1) + 0.03 * Math.sin(t * 0.7);
    w.gust = t < T_GUST ? 0 : (calm ? 0.36 : 0.75) * (1 - sm(ramp(t, T_GUST + 0.8, T_GUST + 2.7)));
    w.gustF = -2.0 + (t - T_GUST) * 3.4 * sp;
    w.storm = sm(ramp(t, T_TURN, T_GUST + 0.2)) * (1 - 0.92 * sm(ramp(t, T_SUN - 0.3, T_SUN + 1.5)));
    w.rain = sm(ramp(t, T_RAIN, T_RAIN + 0.7)) * (1 - sm(ramp(t, T_SUN - 0.5, T_SUN + 0.6)));
    // a mild grey light at first, which the cloud's shadow takes away from the right; then the break, from the left
    if (t < T_SUN - 0.4) { w.sun = 0.26 * sm(ramp(t, 0.3, 1.6)); w.sunF = 2.6 - 5.4 * ease.inOut(ramp(t, T_TURN - 0.1, T_TURN + (calm ? 3 : 1.7))); }
    else { w.sun = sm(ramp(t, T_SUN - 0.4, T_SUN + 0.2)); w.sunF = Math.min(9, -2.1 + Math.max(0, t - T_SUN) * 2.3 * sp); }
    // while you keep looking, now and then the shadow of a cloud goes over
    w.shade = 0; w.shadeU = 0;
    const k = t - 14, len = calm ? 12 : 7; if (k > 0) { const c = (k % 19) / len; if (c < 1) { w.shade = 0.62 * Math.sin(Math.PI * c); w.shadeU = -2.3 + 4.6 * c; } }
    w.cloudT = t + 3 * sm(ramp(t, T_GUST, T_GUST + 2.2)) * sp;
    w.keep = 0.78 * sm(ramp(t, T_TURN, T_GUST)); w.brk = sm(ramp(t, T_SUN - 0.7, T_SUN + 1.3)); w.brkU = -1.15 + 0.05 * Math.min(8, Math.max(0, t - T_SUN));
    return w;
  },

  // ---------------------------------------------------------------- bird i at show-time t: where, which way, how its wings are (into this.bo, this.bp[i])
  birdAt(L, i, t, calm) {
    const o = this.bo, p = this.bp[i], d = this.bd, t0 = T_OUT + i * 0.38, tS = T_GUST + 0.08 + i * 0.14, tH0 = tS + 1.05, tL = T_HOME + i * 0.42, tT = T_TOP + i * 1.7;
    o.vis = t >= t0; o.sc = 1; o.roll = 0; o.fold = 0; o.pitch = 0;
    if (!o.vis) return o;
    const into = L.yawOf(-1, 0);                            // facing up the wind, along the wall to the left
    if (t < tS) {
      // out from behind the frame and round over the water: a few beats, a glide, a few beats
      const x = (t - t0) / (tS - t0), s = x;
      const F = this.inn[i]; F.at(s, p); F.dir(s, d); o.yaw = Math.atan2(d.x, d.z); o.pitch = -Math.asin(Math.max(-1, Math.min(1, d.y))) * 0.7; o.roll = -F.bank(s) * 0.9;
      const beat = ((t * 1.25 + i * 0.4) % 1) < 0.62 || x < 0.2 || x > 0.9;
      o.flap = beat ? Math.sin(t * TAU * 5.2 + i) * 0.85 : 0.22 + 0.05 * Math.sin(t * 5); o.sc = 0.5 + 0.5 * ease.out((t - t0) / 0.3);
      // the lull before the gust: the air goes slack and they glide
      if (t > T_LULL - 0.1 && t < T_GUST - 0.05) o.flap = lerp(o.flap, 0.3, 0.8);
    } else if (t < tH0) {
      // the gust has them: beating hard, going nowhere, carried back and down
      const k = (t - tS) / (tH0 - tS), a = this.stall[i], b = this.blown[i], e = ease.out(Math.min(1, k * 1.5));
      p.lerpVectors(a, b, e); p.y += 0.035 * Math.sin(t * 9 + i * 2) * (1 - 0.5 * k) + 0.05 * Math.sin(Math.PI * k);
      o.yaw = into + 0.25 * Math.sin(t * 5 + i * 1.7); o.pitch = -0.5 + 0.2 * Math.sin(t * 7 + i); o.roll = 0.4 * Math.sin(t * 6.3 + i * 2.3);
      o.flap = Math.sin(t * TAU * (calm ? 4 : 7.5) + i) * 1.1;
    } else if (t < tL) {
      // under it, low over the water, and in through the broken side
      const x = (t - tH0) / (tL - tH0), s = x < 0.8 ? ease.in(x / 0.8) * 0.45 + (x / 0.8) * 0.4 : 0.85 + 0.15 * ease.out((x - 0.8) / 0.2);
      const F = this.home[i]; F.at(s, p); F.dir(s, d); o.yaw = Math.atan2(d.x, d.z); o.pitch = -Math.asin(Math.max(-1, Math.min(1, d.y))) * 0.6; o.roll = -F.bank(s) * 0.6;
      o.flap = Math.sin(t * TAU * 6 + i) * 0.9;
      if (x > 0.82) { const f = (x - 0.82) / 0.18; o.pitch = lerp(o.pitch, -0.55, f); o.flap = 0.55 + Math.sin(t * 34) * 0.4; }      // flaring to land
    } else if (t < tT) {
      // on the ledge, wings shut, close together; when the light comes, a shake
      p.copy(this.ledge[i]); const set = ease.out(ramp(t, tL, tL + 0.35));
      o.fold = set; o.flap = 0.5 * (1 - set); o.yaw = L.yawOut + 0.35 - i * 0.5 + 0.12 * Math.sin(t * 0.9 + i * 2); o.pitch = 0.1 * (1 - set);
      p.y += 0.004 * Math.sin(t * 2.1 + i);
      const sh = i === 0 && !calm ? hump(t, T_SHAKE, T_SHAKE + 0.5) : 0; if (sh > 0) { o.roll = 0.3 * sh * Math.sin(t * 42); o.fold = 1 - 0.35 * sh; o.flap = 0.25 * sh; }
    } else {
      // up onto the broken top, into the sun
      const k = (t - tT) / 0.75;
      if (k < 1) {
        const e = ease.inOut(k); hop(this.ledge[i], this.tops[i], 0.07 * Z, e, p); p.addScaledVector(this.v.set(L.nx, 0, L.nz), 0.1 * Z * Math.sin(Math.PI * e));
        o.flap = Math.sin(t * TAU * 7) * 0.9; o.fold = 0; o.pitch = -0.4 * Math.sin(Math.PI * e); o.yaw = L.yawOut + 0.35 - i * 0.5;
      } else {
        p.copy(this.tops[i]); const set = ease.out(ramp(k, 1, 1.5)); o.fold = set; o.flap = 0.4 * (1 - set);
        o.yaw = L.yawOut + (i ? -0.9 : 0.5) + 0.3 * Math.sin(t * 0.55 + i * 2.2) + 0.12 * Math.sin(t * 1.7 + i); o.pitch = 0.05 * Math.sin(t * 1.3 + i * 3);
        // now and then it opens its wings to the sun and settles them again
        const st = hump((t + i * 5.5) % 11, 9.3, 10.3); if (st > 0) { o.fold = 1 - 0.8 * st; o.flap = 0.25 * st; }
      }
    }
    return o;
  },
  // Body at p; each wing from its shoulder, raised and lowered about the body's length (flap), swept back (fold).
  pose(i, p, o) {
    const M = this.M, Wm = this.Wm, Rm = this.Rm, Tm = this.Tm, Fm = this.Fm, BS = this.bScale;
    if (!o.vis) { for (let j = 0; j < 3; j++) this.parts[i * 3 + j].makeScale(0, 0, 0); return; }
    this.Q.setFromEuler(this.E.set(o.pitch, o.yaw, o.roll, 'YXZ'));
    M.compose(p, this.Q, this.S.set(o.sc, o.sc, o.sc)); this.parts[i * 3].copy(M);
    for (const side of [1, -1]) {
      Tm.makeTranslation(side * 0.011 * BS, 0.007 * BS, 0.012 * BS);
      Rm.makeRotationZ(side * (o.flap * 0.95 + (o.fold > 0.5 ? -0.1 : 0.08)));
      Fm.makeRotationY(-side * o.fold * 1.45); Rm.multiply(Fm);
      Fm.makeRotationX(-o.fold * 1.25); Rm.multiply(Fm);
      Fm.makeScale(side, 1, 1); Rm.multiply(Fm);
      Wm.copy(M).multiply(Tm).multiply(Rm); this.parts[i * 3 + (side > 0 ? 1 : 2)].copy(Wm);
    }
  },

  update(L, dt) {
    const ph = L.phase, showing = ph === 'wake' || ph === 'play', back = ph === 'return', calm = L.calm, sm = ease.smooth;
    if (!showing && !back) return;
    const t = showing ? L.t : this.bT + 0.35 * L.r, ret = back ? L.ret : 0, cam = L.k.G.camera;
    const w = this.weather(t, calm), lu = this.lu, fu = this.fu, K = back ? 1 - ease.inOut(ramp(ret, 0.1, 0.95)) : 1;
    lu.uTime.value = calm ? t * 0.5 : t;
    lu.uStorm.value = w.storm * K; lu.uSunK.value = w.sun; lu.uSunF.value = w.sunF; lu.uShade.value.set(w.shade, w.shadeU, 0, 0);
    lu.uWind.value.set(w.wind, w.gust, w.gustF, 0);
    const rise = lu.uRise.value = showing ? ramp(t, 0.25, 1.95) : this.rise0 * (1 - ease.inOut(ramp(ret, 0.12, 0.8)));
    fu.uSpread.value = showing ? ease.out(ramp(t, 0.05, 1.8)) : this.spread0 * (1 - ease.inOut(ramp(ret, 0.4, 1)));
    fu.uVeil.value = showing ? sm(ramp(t, 0.1, 1.7)) : this.veil0 * (1 - sm(ramp(ret, 0.25, 1)));
    fu.uRain.value = w.rain * K; fu.uCloudT.value = w.cloudT; fu.uBreak.value.set(w.brk, w.brkU, w.keep * K); this.su.uWet.value = sm(ramp(t, T_RAIN + 0.3, T_RAIN + 1.4)) * (1 - 0.7 * sm(ramp(t, T_SUN + 1, T_SUN + 6)));
    // ---- the rain's rings on the water
    const drops = fu.uDrop.value;
    for (let j = 0; j < N_DROP; j++) {
      const x = t / 0.7 + j / N_DROP, cyc = Math.floor(x), age = (x - cyc) * 0.7;
      if (w.rain < 0.02) { drops[j].z = -1; continue; }
      drops[j].set(-0.9 + 1.8 * hash(j + 1, cyc), 0.56 + 0.5 * hash(j + 7, cyc + 3), age);
    }
    // ---- the cards
    let n = 0; const v = this.v;
    const put = (u, o, h, s, sq, kind, a, spin, sun, c) => {
      if (a <= 0.004 || s <= 0.001 || n >= N_CARD) return;
      this.W(u, o, h, v);
      this.px[n] = v.x; this.py[n] = v.y; this.pz[n] = v.z; this.ps[n] = s * Z; this.pq[n] = sq; this.pk[n] = kind; this.pa[n] = a; this.pr[n] = spin; this.pw[n] = sun;
      this.pc[n * 3] = c.r; this.pc[n * 3 + 1] = c.g; this.pc[n * 3 + 2] = c.b; n++;
    };
    const tw = lu.uTime.value;
    for (const f of this.F) {
      const r = clamp01(rise * 1.75 - f.d * 0.6), k = sm(clamp01((r * 0.8 - f.h + f.s * 0.3) / 0.12)); if (k <= 0.01) continue;
      const wl = w.wind + w.gust * sm(clamp01((w.gustF + 0.15 - f.u) / 0.65)), sw = f.sway * (wl * 2.2 * (1 + 0.3 * Math.sin(tw * 5.3 + f.ph)) + 0.5 * Math.sin(tw * 1.1 + f.ph));
      put(f.u + sw, f.o, f.h - 0.04 * (1 - k), f.s * (0.7 + 0.3 * k), f.q || 1, f.k, k, f.spin + sw * 2.5, f.sun, f.c);
    }
    for (const f of this.leaves) {
      const sp = calm ? 0.5 : 1, tau = (t - T_GUST - (f.u + 2.0) / 3.4 / sp - 0.25 * f.a) * sp; if (tau <= 0 || tau > 1.5) continue;
      put(f.u + f.v * tau, f.o + 0.25 * f.b * tau, f.h + 0.1 * Math.sin(tau * 7 + f.a * 6) - 0.12 * tau * tau, f.s, 0.7, 1, K * sm(tau / 0.12) * (1 - sm(ramp(tau, 1.0, 1.5))), tau * (calm ? 4 : 9) + f.a * 6, 0.6, f.c);
    }
    if (w.rain > 0.02) for (let i = 0; i < N_RAIN; i++) {
      const per = 0.36 + 0.1 * hash(i, 5), x = t / per + i * 0.618, cyc = Math.floor(x), k = x - cyc, slant = 0.25 + 0.5 * (w.wind + w.gust);
      put(-1.0 + 2.0 * hash(i + 2, cyc) + slant * 0.22 * k, 0.52 + 0.6 * hash(i + 9, cyc + 1), 0.56 * (1 - k) + 0.02, 0.085, 0.12, 3, w.rain * K * 0.34 * sm(k / 0.3), -slant * 0.6, 0, this.rainC);
    }
    this.flushCards(n, cam);
    // ---- the two birds
    for (let i = 0; i < 2; i++) {
      const p = this.bp[i]; let o = this.bo;
      if (showing) { this.birdAt(L, i, t, calm); this.byaw[i] = o.yaw; }
      else if (!this.wasOut[i]) o.vis = false;
      else {
        // home: up the bare wall and in behind the frame's side
        const s = ease.inOut(ramp(ret, i * 0.1, 0.82 + i * 0.1)), a = 1 - s, mid = this.R(-1.7, 0.7, 1.2, this.mid), h = this.hidden[i], f = this.from[i];
        p.set(a * a * f.x + 2 * a * s * mid.x + s * s * h.x, a * a * f.y + 2 * a * s * mid.y + s * s * h.y, a * a * f.z + 2 * a * s * mid.z + s * s * h.z);
        this.bd.set(2 * a * (mid.x - f.x) + 2 * s * (h.x - mid.x), 0, 2 * a * (mid.z - f.z) + 2 * s * (h.z - mid.z));
        const want = Math.atan2(this.bd.x, this.bd.z), y0 = this.fromYaw[i];
        o.vis = s < 0.995; o.yaw = y0 + Math.atan2(Math.sin(want - y0), Math.cos(want - y0)) * Math.min(1, s * 5); o.pitch = -0.35 * Math.sin(Math.PI * s); o.roll = 0; o.fold = 0;
        o.flap = Math.sin(L.r * TAU * 6 + i) * 0.9; o.sc = 1 - 0.5 * ramp(s, 0.8, 1);
      }
      this.pose(i, p, o);
    }
    // ---- sound
    if (showing) this.band.play(t);
    const near = L.quiet ? 0 : Math.max(0, 1 - Math.hypot(cam.position.x - L.cx, cam.position.z - L.cz) / 12) * K;
    const blow = w.wind + w.gust * sm(clamp01((w.gustF + 1.2) / 1.5));
    this.windLo.set(near * (0.006 + 0.03 * blow)); this.windHi.set(near * 0.012 * Math.max(0, blow - 0.25)); this.hiss.set(near * 0.02 * w.rain);
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
