// Claude Monet, Cliff Walk at Pourville (1882). The word: gust.
//
// Two women stand on a cliff top above the Channel, one under an orange parasol; the grass and the wildflowers are
// laid in short flicked strokes, all leaning one way, the sea is green and blue with white horses and little white
// sails, and the clouds are moving. Everything in the picture is wind. Look at it and a breath of that wind comes out
// from under the frame: a few flicks of his sky pour down the wall, and where they touch the floor his cliff top
// grows, blade by blade, each blade one flick of his paint in the picture's own ochres, pinks, greens and lilacs,
// with his poppies and buttercups in it; along the skirting to the left lies a strip of his sea, and his sails cross
// it. The two walk out of the wall onto the grass, the girl ahead, pointing at the boats, the woman behind under the
// parasol. Grieg's Morning Mood (Peer Gynt, 1875) starts up on a flute.
//
// Then the breeze drops. The grass stands up straight, the skirts hang, the tune stops in the middle of its second
// bar. And the gust comes: from the sea, from the left, a wave that combs the grass flat and pale as it crosses the
// floor, heels the boats over one after another, tears the petals off the flowers, takes the girl's hat ribbons and
// both skirts and spins the woman round by her parasol. She hangs on with both hands, on tiptoe; and it is gone:
// snatched, cartwheeling away over the grass, bouncing once on its rim, up in an eddy. The girl runs after it with a
// hand on her hat. The wind dies, the parasol rights itself and floats down like a dandelion seed, and she jumps and
// catches it by the handle, and for a moment it carries her. The tune finishes its phrase. While you keep looking
// they stand together under it, the grass runs in waves, the boats cross, and now and then a smaller gust goes over.
//
// When you stop looking the wind turns for home: it combs the grass towards the wall and blows the two of them, the
// parasol and the petals back in under the picture, and the cliff top draws in after them. If the toy is near it all
// stays out a while, and the grass parts round the toy as it drives through.
//
// Nothing rises anywhere near a picture: the grass is ankle high to the toy, the parasol's eddy keeps well under
// the frame's bottom rail, and the kit's guard does the rest. Three draw calls: the land (the ground, the sea, every blade and flower,
// one mesh, the wind worked out in its shader), one rig (the two figures' soft underbodies and the parasol), and his
// marks (the dabs the figures are painted in, ribbons, petals, the flicks of wind, the sails).
//
// With "Reduce motion and flashing" on, the gusts come at half speed and about half strength, nothing flutters, bobs
// or beats faster than once a second, the parasol turns over once, slowly, and there is no snap or run of hits.
//
// What it does not do: nobody goes near the cliff's edge and nothing and nobody goes over one (the wind blows in off
// the sea, so the parasol and the chase after it go inland, away from the water, over flat grass), and the two are
// never made fun of (their skirts stream sideways but are never lifted, and are closed underneath), because these
// are two people out for a walk on a real cliff top and the wind in the picture is a pleasure, not a danger.
import * as THREE from 'three';
import { lifeFor, ease, ramp, clamp01, lerp, shape, canvasTexture, flight } from '../paintlife.js';
import { score, Bones, hump, turnTo, hz } from './stagecraft.js';
import { strokes as strokeTex } from './brush.js';
import { parse } from '../carols.js';

const TAU = Math.PI * 2;
const _h = (a, b = 0) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };
const sm = (x, a, b) => ease.smooth(ramp(x, a, b));

// ---------------------------------------------------------------- the land, by the stage's own measure (along, out)
const MEADOW = { u: 0.15, o: 0.5, a: 1.05, b: 0.7 };       // the cliff top: an uneven round, cut off by the wall
const edgeOf = a => 1 + 0.10 * Math.sin(3 * a + 1.3) + 0.06 * Math.sin(5 * a + 0.4) + 0.04 * Math.sin(9 * a + 2.0);
const meadowR = (u, o) => { const x = (u - MEADOW.u) / MEADOW.a, y = (o - MEADOW.o) / MEADOW.b; return Math.hypot(x, y) / edgeOf(Math.atan2(y, x)); };
const SEA = { u0: -1.9, a: -1.78, span: 1.04 };           // the sea along the skirting, and the stretch the boats cross
const GROW = 2.9;
// ---------------------------------------------------------------- the wind, and the timeline
const GUST = { t: 3.45, u0: -2.3, v: 3.0, k: 1.3, tail: 5.2 };          // the gust: when its front sets out, from where, how fast
const AGAIN = { t: 11.2, every: 5.6, u0: -2.3, v: 2.4, k: 0.55, tail: 1.5 };  // and the smaller ones after
const arrive = u => GUST.t + (u - GUST.u0) / GUST.v;
const W0 = { u: -0.25, o: 0.6 }, G0 = { u: -0.45, o: 0.8 }, GC = { u: 0.75, o: 0.8 }, GE = { u: 0.34, o: 0.86 };
const T_W = 0.95, T_G = 0.75;                                              // the woman and the girl come out of the wall
const T_STRAIN = arrive(W0.u), T_SNATCH = T_STRAIN + 0.5, T_FLOAT = 6.45, T_CATCH = 7.3, T_END = 10.2;
// Grieg, Morning Mood (Peer Gynt, Op. 23, 1875): the flute's opening, in E, 6/8 (a beat here is a quaver).
const MOOD = ['B4 G#4 F#4 E4 F#4 G#4', 'B4 G#4 F#4 E4', 'B4 G#4 B4 C#5 G#4 C#5 | B4 G#4 F#4 E4:3',
  'B4 G#4 F#4 E4 F#4 G#4 | B4 G#4 F#4 E4 F#4:0.5 G#4:0.5 F#4:0.5 G#4:0.5 | B4 G#4 B4 C#5 G#4 C#5 | B4 G#4 F#4 E4:3'];
const QUAVER = 0.24, BPM = 60 / QUAVER;

// ---------------------------------------------------------------- the figures' bones (metres; the woman 0.5 m with her hat)
const NP = 9, PEL = 0, SKIRT = 1, TOR = 2, HEAD = 3, HAT = 4, UAL = 5, FAL = 6, UAR = 7, FAR = 8, PARASOL = 18;
const WAIST = 0.27, UARM = 0.085, FARM = 0.08, PSC = 1.2, STICK = 0.3 * PSC;
const SKIRT_PROF = [[0.108, -0.255], [0.103, -0.21], [0.09, -0.13], [0.064, -0.05], [0.038, 0]];
const skirtR = y => { for (let i = 0; i < SKIRT_PROF.length - 1; i++) { const a = SKIRT_PROF[i], b = SKIRT_PROF[i + 1]; if (y <= b[1]) return a[0] + (b[0] - a[0]) * clamp01((y - a[1]) / (b[1] - a[1])); } return 0.038; };
// arms: [forward, out to the side, the elbow, the forearm folded in over]
const ARM = {
  rest: [0.12, 0.14, 0.3, 0], hold: [0.95, 0.25, 1.45, 0.25], both: [1.38, -0.14, 0.4, 0.2], hat: [0.25, 2.25, 0.2, 1.75], point: [1.42, 0.2, 0.06, 0],
  reach: [2.75, 0.12, 0.12, 0], fling: [2.2, 0.9, 0.5, 0], clap: [1.15, -0.2, 1.55, 0.35], fore: [0.75, 0.15, 0.95, 0], aft: [-0.55, 0.15, 0.6, 0], high: [1.25, 0.2, 1.3, 0.2],
};
const mix4 = (a, b, k) => { if (k <= 0) return; for (let i = 0; i < 4; i++) a[i] += (b[i] - a[i]) * k; };
const newPose = () => ({ u: 0, o: 0, lift: 0, bob: 0, yaw: 0, lu: 0, lo: 0, hy: 0, hp: 0, tp: 0, aL: [0, 0, 0, 0], aR: [0, 0, 0, 0], vis: false, w: 0, vu: 0, vo: 0, ex: 0, ez: 0, ew: 0 });

lifeFor(14620, {
  title: /^Cliff Walk at Pourville/,
  word: 'gust',
  // (a small work, hung high: the kit keeps all of it in view over the cliff top on the floor; the camera stands low,
  // a child's eye, so the figures are seen from the side and the grass is a sward, not a map)
  stage: { out: 1.3, half: 1.7, cam: { dist: 2.55, height: 0.7, side: 0.25, fov: 62, lookU: 0.08, lookOut: 0.45, lookH: 1.0, floorOut: 1.12 } },
  wake: 2, ret: 2.4,
  linger: { near: 4.5, max: 40 },

  build(L) {
    const P = L.pal, col = (h, a = 0.22) => P.near(h, a);
    this.L = L; this.Wout = -L.wall - 0.17;
    this.T3 = new THREE.Vector3(L.tx, 0, L.tz); this.N3 = new THREE.Vector3(L.nx, 0, L.nz); this.UP = new THREE.Vector3(0, 1, 0);
    this.v = new THREE.Vector3(); this.n = new THREE.Vector3(); this.x3 = new THREE.Vector3(); this.z3 = new THREE.Vector3(); this.s3 = new THREE.Vector3(); this.ax = new THREE.Vector3();
    this.qa = new THREE.Quaternion(); this.qy = new THREE.Quaternion(); this.mk = new THREE.Matrix4(); this.sh = new THREE.Matrix4(); this.ZERO = new THREE.Vector3();
    this.hub = new THREE.Vector3(); this.sdir = new THREE.Vector3(0, 1, 0); this.hand = new THREE.Vector3(); this.hubFrom = new THREE.Vector3(); this.sFrom = new THREE.Vector3(0, 1, 0);
    this.bones = new Bones(); this.q = {}; this.q2 = {};
    this.gust = [[-9, 0, 1, 0], [-9, 0, 1, 1.7]]; this.B = 0; this.tw = 0; this.wdu = 1; this.wdo = 0;
    this.calm = false; this.cs = 1; this.pz = 1; this.pa = 1;          // ("Reduce motion": gusts at half speed and strength, no quick flutter, no bobbing)
    this.lit = new THREE.Vector3().addScaledVector(this.T3, -0.45).addScaledVector(this.N3, 0.4).add(new THREE.Vector3(0, 0.8, 0)).normalize();
    const C = (list, a) => list.map(h => col(h, a));
    this.figs = [
      { id: 'woman', b: 0, sc: 1.2, head: 1, apron: 0.85, hat: 'bonnet', home: 0.05, P: newPose(), ax: 0, ao: 0, C: {
        front: C(['#dcc878', '#e8d898', '#d0b862', '#e2caa0', '#dba294']), skirt: C(['#8fbfa8', '#a6ccb4', '#7fae9c', '#bcd4be', '#d89c94']), shade: col('#7f8cb8'),
        bodice: C(['#8cbca6', '#a2c8b0', '#7aa998']), sleeve: col('#98c2aa'), sleeve2: col('#b0d0b8'), skin: col('#d8a288', 0.12), hair: col('#3f3550', 0.15),
        hat: C(['#4b4468', '#3b3656', '#6a628c'], 0.15), sash: col('#e2928f'), ribbon: col('#e59a94') } },
      { id: 'girl', b: 9, sc: 0.94, head: 1.12, apron: 0.6, hat: 'straw', home: -0.12, P: newPose(), ax: 0, ao: 0, C: {
        front: C(['#e0d8e2', '#ece6ea', '#d4cade', '#e2c6cc']), skirt: C(['#dcd4e0', '#ccc4dc', '#e8e2e8', '#dcb8c0', '#b8bcda']), shade: col('#8f98c4'),
        bodice: C(['#90b8a6', '#7ca89c', '#a6c8b4']), sleeve: col('#94baa8'), sleeve2: col('#a8cab6'), skin: col('#d8a288', 0.12), hair: col('#4a3a42', 0.15),
        hat: C(['#e4917c', '#ea9f88', '#d9806e'], 0.15), crown: col('#f1ceae', 0.15), band: col('#c46a5e', 0.15), sash: col('#8f9fc8'), ribbon: col('#5a5488', 0.15) } },
    ];
    this.buildLand(L, col); this.buildRig(L, col); this.buildMarks(L, col);
    this.plan(L);
    this.bands = [this.makeScore(L, false), this.makeScore(L, true)]; this.band = this.bands[0];
    this.windLo = L.voice().loop({ lp: 460, hp: 90 }); this.windHi = L.voice().loop({ lp: 5200, hp: 1400 });
    this.tc = 0; this.tOff = 0; this.growFrom = 0; this.pmode = 'woman';
    this.hideAll();
  },

  // ---------------------------------------------------------------- the land: ground, sea, every blade and flower
  buildLand(L, col) {
    const R = () => L.rand(), css = (h, a = 0.22) => col(h, a).getStyle();
    const grass = strokeTex({ size: 512, seed: 14620, n: 2600, base: css('#8c8658', 0.25), len: [14, 34], width: [4, 8], bend: 0.35, lift: 0.2,
      colors: [['#b39a62', 3], ['#c4aa74', 2], ['#7f8a50', 3], ['#6f8f52', 2], ['#9bab62', 1.5], ['#c4907e', 2], ['#d0a394', 1], ['#9a8aa8', 1.2], ['#819aa8', 0.8], ['#c8824c', 0.5]].map(([c, w]) => [css(c), w]),
      angle: (x, y, r) => -1.15 + (r() - 0.5) * 0.9 });
    const sea = strokeTex({ size: 256, seed: 1882, n: 1100, base: css('#4c9088', 0.08), len: [10, 26], width: [3, 6], bend: 0.2, lift: 0.25,
      colors: [['#4f9a8c', 3], ['#3f8a94', 2.5], ['#62a888', 2], ['#7cb89c', 1], ['#4a78a0', 1.2], ['#7f86b0', 0.7], ['#a8d0bc', 0.6]].map(([c, w]) => [css(c, 0.08), w]),
      angle: (x, y, r) => (r() - 0.5) * 0.3 });
    const pos = [], aB = [], aS = [], aC = [], idx = [];
    const vert = (u, h, o, b0, b1, b2, b3, s0, s1, s2, s3, c) => { pos.push(u, h, o); aB.push(b0, b1, b2, b3); aS.push(s0, s1, s2, s3); aC.push(c.r, c.g, c.b); return pos.length / 3 - 1; };
    const white = new THREE.Color(1, 1, 1);
    // the ground: one sheet, its shapes cut in the shader
    { const y = 0.012, o0 = -L.wall + 0.003, a = vert(-2.05, y, o0, 0, 0, 0, 0, 0, 0, 0, 0, white), b = vert(1.75, y, o0, 0, 0, 0, 0, 0, 0, 0, 0, white), c = vert(1.75, y, 1.6, 0, 0, 0, 0, 0, 0, 0, 0, white), d = vert(-2.05, y, 1.6, 0, 0, 0, 0, 0, 0, 0, 0, white); idx.push(a, b, c, a, c, d); }
    // the grass: each blade one flick, in the picture's own colours, gathered in patches as he laid them
    const sets = {
      ochre: ['#b39a62', '#c4aa74', '#a48a54', '#bb927a', '#9a9068', '#cdb684'], green: ['#6f8f52', '#86a25a', '#9bab62', '#7f8a50', '#5f8050', '#a8b872'],
      pink: ['#c4907e', '#d0a394', '#b58078', '#c4aa74', '#9a8aa8', '#d8b2a2'], cool: ['#9a8aa8', '#819aa8', '#7f8a50', '#a8a0be'],
    };
    for (const k of Object.keys(sets)) sets[k] = sets[k].map(h => col(h, 0.12));
    const tint = new THREE.Color();
    const NBLADE = 2500; let made = 0;
    for (let tries = 0; made < NBLADE && tries < 60000; tries++) {
      const u = -1.15 + R() * 2.65, o = -L.wall + 0.015 + R() * 1.45, r = meadowR(u, o);
      if (r > 1.1 || (r > 0.8 && R() > (1.1 - r) / 0.3)) continue;
      const tuft = 0.5 + 0.5 * Math.sin(u * 7.1 + o * 3.3) * Math.sin(o * 6.3 - u * 2.1), byWall = 1 - sm(o, 0.05, 0.42), rim = sm(r, 0.6, 1.05);
      const H = (0.04 + 0.05 * R()) * (0.75 + 0.6 * tuft) * (1 + 0.6 * byWall + 0.25 * rim), wd = 0.015 + 0.012 * R();
      const z1 = Math.sin(u * 2.3 + o * 1.7 + 0.6), z2 = Math.sin(u * 1.3 - o * 2.9 + 2.0), wG = clamp01(0.42 + 0.4 * z1 + 0.25 * u), wP = clamp01(0.4 + 0.4 * z2), pk = R();
      const set = pk < wG * 0.6 ? sets.green : pk < wG * 0.6 + wP * 0.45 ? sets.pink : pk < wG * 0.6 + wP * 0.45 + 0.1 ? sets.cool : sets.ochre;
      tint.copy(set[Math.floor(R() * set.length)]).multiplyScalar(0.8 + 0.3 * R());
      const seed = R(), la = R() * TAU, d = Math.hypot(u, o + L.wall), base = pos.length / 3;
      for (let j = 0; j <= 4; j++) for (const s of [-1, 1]) vert(u, 0.012, o, j / 4, s, H, wd, seed, 1, d, la, tint);
      for (let j = 0; j < 4; j++) { const a = base + j * 2; idx.push(a, a + 1, a + 3, a, a + 3, a + 2); }
      made++;
    }
    // his wildflowers: a dab on a stem's end, red, pink, yellow, white, a few violet
    const fl = ['#d2523c', '#e294a0', '#e4c456', '#eedcd6', '#d8604a', '#e0a0a6', '#9a86c0', '#e8cc68'].map(h => col(h, 0.15));
    this.flowers = [];
    for (let i = 0, tries = 0; i < 62 && tries < 4000; tries++) {
      const u = -0.95 + R() * 2.3, o = -L.wall + 0.05 + R() * 1.3; if (meadowR(u, o) > 0.96) continue;
      const H = 0.075 + 0.08 * R(), size = 0.022 + 0.018 * R(), seed = R(), la = R() * TAU, d = Math.hypot(u, o + L.wall), c = fl[Math.floor(R() * fl.length)], base = pos.length / 3;
      for (const [x, y] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) vert(u, 0.012, o, x, y, H, size, seed, 2, d, la, c);
      idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
      this.flowers.push({ u, o, h: H, c }); i++;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aB', new THREE.Float32BufferAttribute(aB, 4));
    g.setAttribute('aS', new THREE.Float32BufferAttribute(aS, 4)); g.setAttribute('aCol', new THREE.Float32BufferAttribute(aC, 3)); g.setIndex(idx);
    const u = this.lu = {
      tGrass: { value: grass }, tSea: { value: sea }, uTime: { value: 0 }, uGrow: { value: 0 }, uBreeze: { value: 0 }, uWall: { value: L.wall }, uWd: { value: new THREE.Vector2(1, 0) }, uFl: { value: new THREE.Vector2(1, 1) },
      uGust: { value: [new THREE.Vector3(-9, 0, 1), new THREE.Vector3(-9, 0, 1)] }, uPush: { value: [new THREE.Vector4(), new THREE.Vector4(), new THREE.Vector4()] },
      cCliff: { value: col('#4f4658', 0.3) }, cFoam: { value: col('#eef0e6', 0.1) }, cShade: { value: col('#5d5a78', 0.25) }, cPale: { value: col('#efe6c8', 0.1) },
    };
    const WIND = /* glsl */`
uniform float uTime, uGrow, uBreeze, uWall; uniform vec2 uWd, uFl; uniform vec3 uGust[2]; uniform vec4 uPush[3];
float gWind(vec2 p) {
  float w = uBreeze * (0.30 + 0.16 * sin(2.3 * uTime - 2.1 * p.x + 1.1 * p.y) + 0.10 * sin(4.1 * uTime - 3.7 * p.x - 1.9 * p.y + 1.7));
  for (int i = 0; i < 2; i++) { float s = uGust[i].x - p.x + 0.25 * sin(p.y * 2.3 + float(i) * 1.7); w += uGust[i].y * smoothstep(0.0, 0.22, s) * exp(-max(s, 0.0) / uGust[i].z); }
  return w;
}`;
    const m = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, fog: false });
    m.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, u);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec4 aB; attribute vec4 aS; attribute vec3 aCol;\nvarying vec2 vQ; varying vec3 vK; varying vec2 vLoc; varying vec3 vCol;' + WIND)
        .replace('#include <project_vertex>', `vec4 mvPosition;
{
  vec3 P = position; float kind = aS.y, bend = 0.0, shade = 0.0;
  vQ = aB.xy; vLoc = P.xz; vCol = aCol;
  if (kind > 0.5) {
    // a blade (or a flower on its stem): it springs up as the cliff top reaches it, leans its own way, and bends
    // before the wind along an arc, stiffer at the root; it leans away from whoever stands in it
    float sd = aS.x, g = clamp((uGrow - aS.z) / 0.3, 0.0, 1.0);
    g = g * g * (3.0 - 2.0 * g) * (1.0 + 0.3 * sin(g * 3.14159));
    float w = gWind(P.xz);
    vec2 lv = vec2(cos(aS.w), sin(aS.w)) * (0.15 + 0.4 * fract(sd * 7.31)) + vec2(0.5, 0.0);
    lv += uWd * (w * (0.8 + 0.45 * fract(sd * 5.13)) + sin(uTime * (7.0 + 6.0 * fract(sd * 3.71)) * uFl.x + sd * 40.0) * 0.14 * uFl.y * min(w, 1.0));
    for (int i = 0; i < 3; i++) { vec2 dd = P.xz - uPush[i].xy; float l = length(dd), r = uPush[i].z; if (l < r) { float k = 1.0 - l / r; lv += dd / max(l, 0.001) * k * k * 1.7; shade = max(shade, k * uPush[i].w); } }
    float ll = length(lv), th = min(ll, 1.42); vec2 dir = lv / max(ll, 0.0001);
    bend = th;
    float t = kind < 1.5 ? aB.x : 1.0, H = aB.z * g;
    float a0 = th * 0.3, kk = th * 0.7, ak = a0 + kk * t, hx, hy;
    if (kk > 0.001) { hx = (cos(a0) - cos(ak)) / kk; hy = (sin(ak) - sin(a0)) / kk; } else { hx = 0.0; hy = t; }
    vec4 mv = modelViewMatrix * vec4(P + vec3(dir.x * hx, hy, dir.y * hx) * H, 1.0);
    if (kind < 1.5) {
      vec3 tv = (modelViewMatrix * vec4(dir.x * sin(ak), cos(ak), dir.y * sin(ak), 0.0)).xyz;
      vec2 ax = tv.xy; float al = length(ax); ax = al > 0.0001 ? ax / al : vec2(0.0, 1.0);
      float tx = (t - 0.2) / 0.8, wd = aB.w * g * (t < 0.2 ? mix(0.6, 1.0, t / 0.2) : mix(1.0, 0.14, tx * tx));
      mv.xy += vec2(-ax.y, ax.x) * aB.y * wd * 0.5;
    } else mv.xy += aB.xy * aB.w * g * 0.5;
    mvPosition = mv;
  } else mvPosition = modelViewMatrix * vec4(P, 1.0);
  vK = vec3(kind, bend, shade);
}
gl_Position = projectionMatrix * mvPosition;`);
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform sampler2D tGrass, tSea; uniform vec3 cCliff, cFoam, cShade, cPale;\nvarying vec2 vQ; varying vec3 vK; varying vec2 vLoc; varying vec3 vCol;' + WIND)
        .replace('#include <map_fragment>', `{
  vec3 c;
  if (vK.x < 0.5) {
    vec2 p = vLoc;
    vec4 gs = texture2D(tGrass, p / 0.7);
    vec4 ss = texture2D(tSea, vec2(p.x - uTime * 0.03, p.y * 1.25) / 0.5);
    vec4 fl = texture2D(tSea, vec2(p.x - uTime * 0.16, p.y * 1.6 + 0.37) / 0.33);
    // it all spreads from the foot of the wall under the picture, stroke by stroke
    if (uGrow - length(p - vec2(0.0, -uWall)) + (gs.a - 0.6) * 0.14 < 0.0) discard;
    vec2 e = (p - vec2(${MEADOW.u.toFixed(3)}, ${MEADOW.o.toFixed(3)})) / vec2(${MEADOW.a.toFixed(3)}, ${MEADOW.b.toFixed(3)}); float an = atan(e.y, e.x);
    float mr = length(e) / (1.0 + 0.10 * sin(3.0 * an + 1.3) + 0.06 * sin(5.0 * an + 0.4) + 0.04 * sin(9.0 * an + 2.0));
    if (mr + (gs.a - 0.65) * 0.2 < 1.0) {
      // the cliff top's ground, under the grass, darker where someone stands on it
      c = gs.rgb * vec3(0.4, 0.44, 0.36);
      for (int i = 0; i < 3; i++) c = mix(c, cShade, uPush[i].w * 0.5 * (1.0 - smoothstep(0.0, max(uPush[i].z, 0.001) * 0.8, length(p - uPush[i].xy))));
    } else {
      // his sea, along the skirting: green and blue dabs, white horses running before the wind, the cliff's shadow
      float so = (0.24 + 0.2 * smoothstep(-1.9, -1.2, p.x)) * (1.0 + 0.12 * sin(p.x * 4.3 + 0.7));
      if (p.x > 0.0 || p.y + (ss.a - 0.6) * 0.12 > so || p.x < ${SEA.u0.toFixed(2)} + (ss.a - 0.3) * 0.3) discard;
      c = mix(vec3(dot(ss.rgb, vec3(0.3, 0.59, 0.11))), ss.rgb, 0.82);
      float w = clamp(gWind(p), 0.0, 1.3);
      c = mix(c, cFoam, smoothstep(0.95 - 0.18 * w, 0.985 - 0.18 * w, fl.a) * 0.9);
      c = mix(c, cCliff, (1.0 - smoothstep(1.05, 1.36, mr)) * 0.85);
    }
    c *= 0.92;
  } else if (vK.x < 1.5) {
    // a blade: a flick of paint, a lighter ridge down one side, pale where the wind combs it over
    c = vCol * (0.84 + 0.26 * smoothstep(-0.3, 0.8, vQ.y) - 0.14 * (1.0 - vQ.x));
    c = mix(c, c * 1.1 + cPale * 0.08, smoothstep(0.6, 1.35, vK.y)) * 0.8;
    c = mix(c, cShade, vK.z * 0.4 * (1.0 - vQ.x * 0.6));
  } else {
    float r = length(vQ * vec2(1.0, 1.25)) + 0.1 * sin(atan(vQ.y, vQ.x) * 3.0 + vCol.r * 30.0);
    if (r > 0.9) discard;
    c = vCol * (0.74 + 0.3 * (vQ.y * 0.5 + 0.5));
  }
  // (the game's film curve lifts and greys a middle tone: laid in deeper and richer, it comes out as he painted it)
  diffuseColor.rgb = mix(vec3(dot(c, vec3(0.3, 0.59, 0.11))), c, vK.x > 1.5 ? 1.1 : 1.32) * (vK.x > 1.5 ? 0.8 : 0.74);
}`);
    };
    m.customProgramCacheKey = () => 'pourville-land';
    const mesh = this.land = new THREE.Mesh(g, m);
    mesh.matrixAutoUpdate = false; mesh.matrix.makeBasis(this.T3, this.UP, this.N3).setPosition(L.floor(0, 0)); mesh.renderOrder = 1;
    L.add(mesh);
  },

  // ---------------------------------------------------------------- the rig: the two figures' underbodies, the parasol
  buildRig(L, col) {
    const rig = this.rig = L.rig(24, 24000, L.paint({ glow: 0.5, rough: 0.92, side: THREE.DoubleSide }));
    this.M = Array.from({ length: 19 }, () => new THREE.Matrix4()); this.I = new Array(19).fill(-1);
    const tc = new THREE.Color();
    // a colour for every corner, by where it is: smooth over the form (no patchwork of faces)
    const tintBy = (g, fn) => { const p = g.attributes.position, c = g.attributes.color, v = new THREE.Vector3(), k = new THREE.Color(); for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); fn(v, k); c.setXYZ(i, k.r, k.g, k.b); } return g; };
    for (const f of this.figs) {
      const C = f.C, b = f.b;
      // the skirt: a long bell, fuller behind; yellow (or white) down the front, sea-green (or lilac) round the sides
      // (soft, unbroken colour, turning from the front's to the sides' and to shadow at the hem behind: the dabs laid
      // over it are what break it up)
      const skirt = tintBy(shape.move(shape.lathe(SKIRT_PROF, 24), 0, 0, -0.012, 0, 0, 0, 1, 1, 1.12), (v, k) => {
        const a = Math.atan2(v.x, v.z + 0.012), w = 0.5 + 0.5 * Math.sin(a * 3 + v.y * 22 + b);
        k.copy(C.front[0]).lerp(C.front[1], w).lerp(tc.copy(C.skirt[0]).lerp(C.skirt[1], w), sm(Math.abs(a), f.apron - 0.35, f.apron + 0.35));
        k.lerp(C.shade, 0.5 * sm(-v.y, 0.12, 0.26) * sm(Math.abs(a), 0.8, 2.4));
      });
      // (closed underneath at the hem, in shadow: there is nothing to see under it from the floor)
      const under = shape.move(shape.lathe([[0.0005, -0.25], [0.06, -0.252], [0.107, -0.2545]], 24, tc.copy(C.shade).multiplyScalar(0.6)), 0, 0, -0.012, 0, 0, 0, 1, 1, 1.12);
      const torso = tintBy(shape.move(shape.lathe([[0.037, 0], [0.043, 0.03], [0.048, 0.07], [0.046, 0.095], [0.03, 0.115], [0.015, 0.128], [0.013, 0.14]], 16), 0, 0, 0, 0, 0, 0, 1, 1, 0.72), (v, k) => {
        k.copy(C.bodice[0]).lerp(C.bodice[1], 0.5 + 0.5 * Math.sin(Math.atan2(v.x, v.z) * 2 + v.y * 30)).lerp(C.shade, 0.3 * sm(-v.z, 0, 0.03));
      });
      const head = shape.paint(shape.ball(0.031, C.hair, 2), (c, n) => (n.z > 0.3 && c.y < 0.013 ? C.skin : null));
      let hat;
      if (f.hat === 'bonnet') hat = tintBy(shape.lathe([[0.047, -0.002], [0.036, 0.003], [0.031, 0.006], [0.029, 0.02], [0.015, 0.03], [0.001, 0.031]], 16), (v, k) => { k.copy(v.y < 0.005 ? C.hat[1] : v.y < 0.011 ? C.hat[2] : C.hat[0]); });
      else hat = tintBy(shape.lathe([[0.064, -0.003], [0.046, 0.002], [0.03, 0.004], [0.028, 0.018], [0.016, 0.028], [0.001, 0.03]], 18), (v, k) => { if (v.y < 0.0045) k.copy(C.hat[0]).lerp(C.hat[1], 0.5 + 0.5 * Math.sin(Math.atan2(v.x, v.z) * 3)); else k.copy(v.y < 0.012 ? C.band : C.crown); });
      const uarm = shape.move(shape.cyl(0.0105, 0.0125, UARM, 8, C.sleeve), 0, -UARM / 2, 0);
      const farm = shape.merge([shape.move(shape.cyl(0.0085, 0.0105, FARM, 8, C.sleeve2), 0, -FARM / 2, 0), shape.move(shape.ball(0.0115, C.skin, 1), 0, -FARM - 0.004, 0)]);
      const gu = rig.geo(uarm), gf = rig.geo(farm);
      this.I[b + SKIRT] = rig.add(rig.geo(shape.merge([skirt, under]))); this.I[b + TOR] = rig.add(rig.geo(torso)); this.I[b + HEAD] = rig.add(rig.geo(head)); this.I[b + HAT] = rig.add(rig.geo(hat));
      this.I[b + UAL] = rig.add(gu); this.I[b + FAL] = rig.add(gf); this.I[b + UAR] = rig.add(gu); this.I[b + FAR] = rig.add(gf);
    }
    // the parasol: a shallow dome in his orange and salmon, mottled as he dabbed it, darker underneath; a thin stick
    const top = ['#e8765a', '#f09070', '#f2a890', '#ec8468', '#f6b8a0', '#d8604a'].map(h => col(h, 0.15)), under = ['#b85a46', '#a44c40', '#c66a52'].map(h => col(h, 0.15));
    const prof = [[0.152, -0.072], [0.143, -0.05], [0.12, -0.03], [0.085, -0.014], [0.045, -0.004], [0.004, 0]];
    const outer = tintBy(shape.lathe(prof, 30), (v, k) => {
      const a = Math.atan2(v.x, v.z), r = Math.hypot(v.x, v.z) / 0.152, gore = 0.5 + 0.5 * Math.sin(a * 5), w = 0.5 + 0.5 * Math.sin(a * 13 + r * 9);
      k.copy(top[0]).lerp(top[1], gore).lerp(top[2], 0.45 * w).lerp(top[4], 0.5 * (1 - r) * (1 - r)).lerp(top[5], 0.6 * sm(r, 0.86, 1));      // lighter at the crown, a deeper edge
    });
    const inner = tintBy(shape.move(shape.lathe(prof, 30), 0, -0.006, 0, 0, 0, 0, 0.97, 1, 0.97), (v, k) => { k.copy(under[0]).lerp(under[1], 0.5 + 0.5 * Math.sin(Math.atan2(v.x, v.z) * 5)).lerp(under[2], 0.4 * Math.hypot(v.x, v.z) / 0.15); });
    const stick = shape.move(shape.cyl(0.004, 0.004, 0.33, 6, col('#5a4234', 0.15)), 0, -0.135, 0);
    const knob = shape.move(shape.ball(0.009, col('#4a3628', 0.15), 1), 0, -0.3, 0), tip = shape.move(shape.ball(0.007, top[0], 1), 0, 0.03, 0);
    this.I[PARASOL] = rig.add(rig.geo(shape.merge([outer, inner, stick, knob, tip])));
  },

  // ---------------------------------------------------------------- his marks: dabs on the figures, ribbons, petals, wind, sails
  buildMarks(L, col) {
    const tex = canvasTexture(128, 128, (g, W, H) => {
      const img = g.createImageData(W, H), d = img.data;
      const groove = Array.from({ length: 64 }, () => 0.8 + L.rand() * 0.2), tail = Array.from({ length: 64 }, () => 0.8 + L.rand() * 0.2);
      for (let y = 0; y < H; y++) for (let x = 0; x < 64; x++) {
        // the flick: the brush lands loaded (s = 0, at the foot of the square) and lifts away to a point, a little curved
        const s = 1 - (y + 0.5) / H, xn = ((x + 0.5) / 64 - 0.5) * 2, xc = 0.2 * Math.sin((s - 0.15) * 1.9) - 0.06;
        const hw = s < 0.2 ? 0.4 * Math.sqrt(Math.max(0, s - 0.02) / 0.18) : 0.4 * Math.pow(Math.max(0, 1 - ((s - 0.2) / 0.78) ** 2), 0.6);
        const a = Math.min((hw - Math.abs(xn - xc)) * 8, (tail[x] - s) / 0.06) + (L.rand() - 0.5) * 0.25;
        const ridge = Math.exp(-(((xn - xc - 0.14) / 0.12) ** 2)), i = (y * W + x) * 4, lum = groove[x] * (0.84 + 0.14 * ridge);
        d[i] = d[i + 1] = d[i + 2] = Math.min(255, lum * 255); d[i + 3] = Math.max(0, Math.min(255, (a + 0.5) * 255));
      }
      for (let y = 0; y < H; y++) for (let x = 0; x < 64; x++) {
        // the dab: a short soft touch, its bristle marks in it
        const xn = ((x + 0.5) / 64 - 0.5) * 2, yn = ((y + 0.5) / H - 0.5) * 2, r = Math.pow(Math.abs(xn) ** 2.5 + Math.abs(yn) ** 2.5, 1 / 2.5);
        const a = (0.84 - r + (L.rand() - 0.5) * 0.12 + 0.05 * Math.sin(xn * 15 + yn * 4)) * 9, ridge = Math.exp(-(((xn - 0.3) / 0.22) ** 2));
        const i = (y * W + x + 64) * 4, lum = groove[x] * (0.85 + 0.13 * ridge);
        d[i] = d[i + 1] = d[i + 2] = Math.min(255, lum * 255); d[i + 3] = Math.max(0, Math.min(255, (a + 0.5) * 255));
      }
      g.putImageData(img, 0, 0);
    }, false);
    const defs = this.att = [], cols = [], jit = s => (L.rand() - 0.5) * s, any = list => list[Math.floor(L.rand() * list.length)];
    const add = (f, part, p, d, nrm, len, wid, c, cell = 0) => { defs.push({ f, m: f.b + part, p: new THREE.Vector3(...p), d: new THREE.Vector3(...d).normalize(), nr: new THREE.Vector3(...nrm).normalize(), len: len * f.sc, wid: wid * f.sc, cell }); cols.push(c); };
    for (const f of this.figs) {
      const C = f.C;
      // the skirt: three rounds of soft dabs, laid down its fall, a few in shadow near the hem
      for (const [y0, nk, len, wid] of [[-0.065, 8, 0.1, 0.05], [-0.145, 10, 0.105, 0.054], [-0.218, 11, 0.085, 0.05]]) for (let k = 0; k < nk; k++) {
        const a = ((k + 0.5 * (nk & 1)) / nk) * TAU + jit(0.3), y = y0 + jit(0.03), r = skirtR(y) * 1.01, sa = Math.sin(a), ca = Math.cos(a);
        const front = Math.abs(Math.atan2(sa, ca)) < f.apron, base = front ? C.front[0] : C.skirt[0];
        add(f, SKIRT, [sa * r, y, ca * r * 1.12 - 0.012], [sa * 0.25 + jit(0.3), 1, ca * 0.25], [sa, 0.2, ca], len * (0.85 + 0.3 * L.rand()), wid, (y0 < -0.2 && L.rand() < 0.35 ? C.shade : any(front ? C.front : C.skirt)).clone().lerp(base, 0.45), L.rand() < 0.8 ? 1 : 0);
      }
      for (let k = 0; k < 5; k++) { const a = (k / 5) * TAU + jit(0.3), sa = Math.sin(a), ca = Math.cos(a); add(f, TOR, [sa * 0.045, 0.062 + jit(0.015), ca * 0.033], [jit(0.4), 1, 0], [sa, 0.2, ca], 0.115, 0.042, any(C.bodice)); }
      add(f, TOR, [0, 0.008, 0.028], [1, jit(0.2), 0], [0, 0, 1], 0.085, 0.024, C.sash);
      add(f, HEAD, [0, -0.002, 0.024], [0, 1, 0], [0, 0.2, 1], 0.042, 0.036, C.skin, 1);
      add(f, HEAD, [0, 0.008, -0.016], [0, 1, 0], [0, 0.3, -1], 0.056, 0.054, C.hair, 1);
      if (f.hat === 'bonnet') { add(f, HAT, [0, 0.014, 0], [1, 0, 0], [0, 1, 0], 0.07, 0.04, C.hat[0], 1); add(f, HAT, [0.004, 0.022, 0.006], [1, 0.2, 0], [0, 1, 0.3], 0.035, 0.016, C.hat[2]); }
      else { add(f, HAT, [0, 0.004, 0.004], [1, 0, 0], [0, 1, 0.3], 0.13, 0.032, C.hat[0]); add(f, HAT, [0, 0.004, -0.02], [-1, 0, 0], [0, 1, -0.3], 0.11, 0.03, C.hat[1]); add(f, HAT, [0, 0.02, 0], [1, 0, 0], [0, 1, 0], 0.05, 0.036, C.crown, 1); }
      for (const [ua, fa, sx] of [[UAL, FAL, 1], [UAR, FAR, -1]]) { add(f, ua, [0, -UARM * 0.5, 0], [0, -1, 0], [sx, 0.3, 0.3], UARM * 1.25, 0.032, C.sleeve); add(f, fa, [0, -FARM * 0.48, 0], [0, -1, 0], [sx, 0.3, 0.3], FARM * 1.1, 0.027, C.sleeve2); add(f, fa, [0, -FARM - 0.004, 0], [0, -1, 0], [0, 0.5, 1], 0.026, 0.022, C.skin, 1); }
    }
    // the loose ones: ribbons (the woman's sash ends, the girl's hat ribbons), petals, flicks of wind, sails
    const NA = defs.length; this.iRib = NA; this.iPet = NA + 12; const NPET = 44, NSTK = 17, NBOAT = 4;
    this.iStk = this.iPet + NPET; this.iSail = this.iStk + NSTK; const NS = this.NS = this.iSail + NBOAT * 3;
    for (let i = 0; i < 12; i++) cols.push(this.figs[i < 6 ? 0 : 1].C.ribbon);
    const petalC = ['#e0503c', '#e98fa0', '#f1dcd8', '#ecca50', '#e9a0a8', '#d96a5a'].map(h => col(h, 0.15));
    this.pet = Array.from({ length: NPET }, (_, i) => {
      const fl = this.flowers[Math.floor(L.rand() * this.flowers.length)];
      cols.push(i % 3 === 0 ? fl.c : any(petalC));
      return { u: fl.u, o: fl.o, h: fl.h, a: L.rand(), b: L.rand(), c: L.rand(), d: L.rand(), size: 0.02 + 0.016 * L.rand(), p: new THREE.Vector3(), from: new THREE.Vector3(), on: 0 };
    });
    const skyC = ['#a9bedb', '#c9c2dc', '#ecdcdc', '#f4efe9', '#b9cce4', '#e2e6ee'].map(h => col(h, 0.12));
    this.stk = Array.from({ length: NSTK }, () => { cols.push(any(skyC)); return { back: -0.15 + 1.25 * L.rand(), h: 0.1 + 0.6 * L.rand(), o: 0.05 + 1.25 * L.rand(), len: 0.085 + 0.06 * L.rand(), wid: 0.034 + 0.02 * L.rand(), ph: L.rand() * TAU, u0: -0.32 + 0.64 * L.rand() }; });
    this.boats = [{ x: 0.1, o: 0.07, s: 1 }, { x: 0.42, o: 0.16, s: 0.8 }, { x: 0.63, o: 0.1, s: 1.1 }, { x: 0.86, o: 0.19, s: 0.72 }];
    for (let i = 0; i < NBOAT; i++) cols.push(col('#f3efe6', 0.1), col('#ecd9d2', 0.1), col('#474a60', 0.2));
    this.cols = cols;
    const geo = new THREE.PlaneGeometry(1, 1);
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
  if (aKind.x > 0.5) {        // lying in the world (a petal come to rest on the floor)
    mvPosition = viewMatrix * vec4(aPos + aDir * position.y * aSize.x + aSide * position.x * aSize.y, 1.0);
  } else {                    // a stroke: facing the camera, along its own direction as the camera sees it
    mvPosition = viewMatrix * vec4(aPos, 1.0);
    vec3 dv = (viewMatrix * vec4(aDir, 0.0)).xyz; vec2 ax = dv.xy; float al = length(ax);
    ax = al > 1e-4 ? ax / al : vec2(0.0, 1.0);
    float fore = mix(0.62, 1.0, clamp(al / max(length(dv), 1e-4), 0.0, 1.0));
    mvPosition.xy += ax * position.y * aSize.x * fore + vec2(-ax.y, ax.x) * position.x * aSize.y;
  }
  gl_Position = projectionMatrix * mvPosition;`);
    };
    mat.customProgramCacheKey = () => 'pourville-marks';
    const im = this.marks = new THREE.InstancedMesh(geo, mat, NS);
    for (let i = 0; i < NS; i++) im.setColorAt(i, cols[i]);
    im.instanceColor.setUsage(THREE.DynamicDrawUsage); im.count = 0; im.renderOrder = 2;
    L.add(im);
    this.shade = col('#7f86b8', 0.2);
  },

  // ---------------------------------------------------------------- sound: the flute, the gulls, the parasol
  // (calm: for "Reduce motion and flashing": no snap, no quick run of hits, everything softer and slower to come in)
  makeScore(L, calm) {
    const s = score(L), fl = { type: 'sine', vol: 0.03, attack: 0.03, oct: 1, legato: 0.96 }, air = { type: 'triangle', vol: 0.007, attack: 0.04, oct: 1, legato: 0.9 };
    const pedal = (t, d, v = 1) => { s.note(t, hz(52), d, { type: 'sine', vol: 0.014 * v, attack: 0.2 }); s.note(t, hz(59), d, { type: 'sine', vol: 0.009 * v, attack: 0.25 }); };
    s.hit(0.05, { d: 1.0, vol: 0.02, bp: 620, q: 0.8, attack: 0.3 });                                         // a breath out of the frame
    const t1 = 0.9, t2 = t1 + 6 * QUAVER;
    for (const o of [fl, air]) { s.tune(MOOD[0], t1, BPM, o); s.tune(MOOD[1], t2, BPM, o); }            // the tune sets out, and is cut off
    pedal(t1, 2.2);
    // gulls, before the gust
    for (const [t, f] of [[1.75, 1500], [2.02, 1650], [2.3, 1420]]) { s.note(t, f * 0.8, 0.07, { type: 'sine', vol: 0.008, to: f, attack: 0.01 }); s.note(t + 0.07, f, 0.24, { type: 'sine', vol: 0.011, to: f * 0.62, attack: 0.005 }); }
    // the gust: the boats' halyards, the parasol's cloth snapping taut, and the snatch
    s.hit(GUST.t + 0.1, { d: 1.8, vol: calm ? 0.014 : 0.03, bp: 520, q: 0.7, attack: calm ? 0.6 : 0.25 });
    for (const [t, f] of [[GUST.t + 0.3, 2900], [GUST.t + 0.42, 3300], [GUST.t + 0.62, 2700]]) s.note(t, f, 0.18, { type: 'sine', vol: 0.006, attack: 0.002 });
    if (!calm) for (const t of [T_STRAIN + 0.05, T_STRAIN + 0.22, T_STRAIN + 0.36]) s.hit(t, { d: 0.07, vol: 0.022, bp: 1500, q: 1.2 });
    if (!calm) s.hit(T_SNATCH, { d: 0.09, vol: 0.05, bp: 1900, q: 1.1 });
    s.hit(T_SNATCH + 0.02, { d: 0.3, vol: calm ? 0.012 : 0.03, lp: 700, attack: calm ? 0.08 : 0.002 });
    if (!calm) for (let i = 0; i < 6; i++) s.hit(T_SNATCH + 0.25 + i * 0.21 + 0.03 * i * i, { d: 0.06, vol: 0.016 - i * 0.002, bp: 1300 - i * 90, q: 1.2 });      // it cartwheels
    s.note(this.tBounce, 150, 0.16, { type: 'sine', vol: calm ? 0.02 : 0.045, to: 90, attack: calm ? 0.03 : 0.004 }); if (!calm) s.hit(this.tBounce, { d: 0.12, vol: 0.02, lp: 900 });
    if (!calm) for (const t of [6.74, 7.02]) s.note(t, 520, 0.06, { type: 'triangle', vol: 0.01, to: 700, attack: 0.004 });                              // the girl's hops
    // the catch: a little run up a harp, and the tune finishes its phrase
    [76, 80, 83, 88].forEach((m, i) => s.note(T_CATCH - 0.02 + i * 0.045, hz(m), 0.7, { type: 'sine', vol: 0.014, attack: 0.003 }));
    if (!calm) s.hit(T_CATCH, { d: 0.05, vol: 0.02, lp: 1400 });
    for (const o of [fl, air]) s.tune(MOOD[2], T_CATCH + 0.1, BPM, o);
    pedal(T_CATCH + 0.1, 3.4);
    // and round again, softer, while you keep looking
    const ev = [{ t: 0, f: hz(52), d: 6.2, type: 'sine', vol: 0.01, attack: 0.25 }];
    for (const n of parse(MOOD[3]).notes) if (n.m) ev.push({ t: n.t * QUAVER, f: hz(n.m + 12), d: Math.max(0.08, n.d * QUAVER * 0.96), type: 'sine', vol: 0.02, attack: 0.03 });
    s.loop(13.5, 24 * QUAVER + 9, ev);
    return s.done();
  },

  // ---------------------------------------------------------------- the wind, at show-time t (R: how far home it has turned)
  setWind(t, R = 0) {
    const g = this.gust, lull = sm(t, 2.55, 3.0) * (1 - sm(t, GUST.t + 0.2, GUST.t + 1.2));
    let B = sm(t, 0.15, 1.3) * (1 - 0.94 * lull), du = 1, dout = 0;
    g[0][0] = W0.u + GUST.v * this.cs * (t - T_STRAIN); g[0][1] = g[0][0] > GUST.u0 ? GUST.k * (this.calm ? 0.55 : 1) * (1 - sm(t, 5.9, 7.0)) : 0; g[0][2] = GUST.tail;
    const n = Math.floor((t - AGAIN.t) / AGAIN.every);
    if (n >= 0) { g[1][0] = AGAIN.u0 + AGAIN.v * this.cs * (t - AGAIN.t - n * AGAIN.every); g[1][1] = AGAIN.k * (this.calm ? 0.6 : 1) * (0.8 + 0.4 * _h(n, 3)); g[1][2] = AGAIN.tail; } else { g[1][0] = -9; g[1][1] = 0; g[1][2] = 1; }
    if (R > 0) { const k = sm(R, 0, 0.3); B = lerp(B, 1.6, k); du = lerp(1, -0.12, k); dout = lerp(0, -1, k); const l = Math.hypot(du, dout); du /= l; dout /= l; g[0][1] *= 1 - k; g[1][1] *= 1 - k; }
    this.B = B; this.tw = t; this.wdu = du; this.wdo = dout;
  },
  // When the gust's front reaches u (it is on the woman at T_STRAIN whatever its speed).
  arr(u) { return T_STRAIN + (u - W0.u) / (GUST.v * this.cs); },
  wind(u, o) {
    const t = this.tw;
    let w = this.B * (0.30 + 0.16 * Math.sin(2.3 * t - 2.1 * u + 1.1 * o) + 0.10 * Math.sin(4.1 * t - 3.7 * u - 1.9 * o + 1.7));
    for (const g of this.gust) { const s = g[0] - u + 0.25 * Math.sin(o * 2.3 + g[3]); if (s > 0 && g[1] > 0) w += g[1] * ease.smooth(s / 0.22) * Math.exp(-s / g[2]); }
    return w;
  },

  // ---------------------------------------------------------------- the two of them: where each is, and how she stands, at t
  womanPos(t, q) {
    const k = ease.inOut(ramp(t, T_W, 2.6)), a = 1 - k, st = ease.out(ramp(t, T_SNATCH, T_SNATCH + 0.4)), fo = ease.inOut(ramp(t, 5.1, 6.7));
    q.u = a * a * 0.02 + 2 * a * k * -0.02 + k * k * W0.u + 0.13 * ease.in(ramp(t, T_STRAIN + 0.1, T_SNATCH)) + 0.07 * st + 0.12 * fo;
    q.o = a * a * this.Wout + 2 * a * k * 0.32 + k * k * W0.o + 0.02 * st + 0.04 * fo;
  },
  girlPos(t, q) {
    const k = ease.inOut(ramp(t, T_G, 2.35)), a = 1 - k, r = ease.inOut(ramp(t, 4.95, 6.5)), b = 1 - r, h = ease.inOut(ramp(t, 8.0, 9.5));
    q.u = a * a * -0.2 + 2 * a * k * -0.3 + k * k * G0.u + (b * b * G0.u + 2 * b * r * 0.1 + r * r * GC.u - G0.u) + (GE.u - GC.u) * h;
    q.o = a * a * this.Wout + 2 * a * k * 0.34 + k * k * G0.o + (b * b * G0.o + 2 * b * r * 0.98 + r * r * GC.o - G0.o) + (GE.o - GC.o) * h;
  },
  womanPose(t, P) {
    const L = this.L, q = this.q, q2 = this.q2;
    this.womanPos(t - 0.05, q2); this.womanPos(t, q);
    P.u = q.u; P.o = q.o; P.vu = (q.u - q2.u) / 0.05; P.vo = (q.o - q2.o) / 0.05; P.vis = t > T_W && q.o > this.Wout + 0.02;
    const sp = Math.hypot(P.vu, P.vo), w = P.w = this.wind(P.u, P.o);
    let yaw = t < 2.9 && sp > 0.02 ? L.yawOf(P.vu, P.vo) : L.yawOf(-0.8, 0.6);
    yaw = turnTo(yaw, L.yawOf(-0.8, 0.6), sm(t, 2.25, 2.85));                              // she looks out to sea
    yaw = turnTo(yaw, L.yawOf(0.9, 0.42), ease.inOut(ramp(t, T_STRAIN, T_STRAIN + 0.36)));  // the parasol spins her round
    yaw = turnTo(yaw, L.yawOf(0.45, 0.9), ease.inOut(ramp(t, T_CATCH + 0.2, T_CATCH + 1.1)));
    P.yaw = yaw;
    const strain = sm(t, T_STRAIN, T_STRAIN + 0.22) * (1 - ramp(t, T_SNATCH, T_SNATCH + 0.1)), lurch = hump(t, T_SNATCH, T_SNATCH + 0.55);
    const joy = sm(t, T_CATCH, T_CATCH + 0.2) * (1 - sm(t, T_CATCH + 1.0, T_CATCH + 1.5)), lean = -0.07 * Math.min(w, 1.2) * (1 - strain) - 0.3 * strain + 0.22 * lurch;
    P.lu = this.wdu * lean; P.lo = this.wdo * lean;
    P.lift = 0.012 * strain + 0.014 * hump(t, T_CATCH + 0.1, T_CATCH + 0.42) + 0.01 * hump(t, T_CATCH + 0.45, T_CATCH + 0.75);
    P.bob = sp > 0.03 ? 0.006 * Math.abs(Math.sin(t * 9)) * this.pa : 0.002 * Math.sin(t * 1.7);
    P.tp = 0.05 * lurch; P.hy = 0.25 * Math.sin(t * 0.6) * sm(t, 9, 10); P.hp = -0.32 * sm(t, T_SNATCH + 0.2, T_SNATCH + 0.6) * (1 - sm(t, T_CATCH, T_CATCH + 0.5));
    const aR = P.aR, aL = P.aL, pull = sm(t, T_STRAIN, T_STRAIN + 0.2), fling = sm(t, T_SNATCH, T_SNATCH + 0.12), drop = sm(t, T_SNATCH + 0.45, T_SNATCH + 0.9);
    for (let i = 0; i < 4; i++) { aR[i] = ARM.hold[i]; aL[i] = ARM.rest[i]; }
    aL[0] += 0.08 * Math.sin(t * 2.1) * (1 - pull);
    mix4(aR, ARM.both, pull); mix4(aL, ARM.both, pull); mix4(aR, ARM.fling, fling); mix4(aL, ARM.fling, fling);
    mix4(aR, ARM.rest, drop); mix4(aL, ARM.hat, drop * (1 - sm(t, T_CATCH - 0.3, T_CATCH))); mix4(aL, ARM.rest, sm(t, T_CATCH - 0.3, T_CATCH));
    if (joy > 0) { mix4(aR, ARM.clap, joy); mix4(aL, ARM.clap, joy); const c = 0.2 * Math.abs(Math.sin(t * 13)) * joy * this.pa; aR[1] += c; aL[1] += c; }
  },
  girlPose(t, P) {
    const L = this.L, q = this.q, q2 = this.q2;
    this.girlPos(t - 0.05, q2); this.girlPos(t, q);
    P.u = q.u; P.o = q.o; P.vu = (q.u - q2.u) / 0.05; P.vo = (q.o - q2.o) / 0.05; P.vis = t > T_G && q.o > this.Wout + 0.02;
    const sp = Math.hypot(P.vu, P.vo), w = P.w = this.wind(P.u, P.o), tg = this.arr(G0.u);
    let yaw = sp > 0.04 ? L.yawOf(P.vu, P.vo) : L.yawOf(-1, 0.12);
    if (t >= 2.2 && t < 4.75) yaw = turnTo(yaw, L.yawOf(-1, 0.12), sm(t, 2.2, 2.5));        // she looks out to sea
    if (t >= 4.75 && t < 5.2) yaw = turnTo(L.yawOf(-1, 0.12), sp > 0.04 ? yaw : L.yawOf(1, 0.2), ease.inOut(ramp(t, 4.75, 5.1)));
    if (t >= 6.3 && t < 8.1) yaw = turnTo(sp > 0.04 ? yaw : L.yawOf(1, -0.1), L.yawOf(0.55, 0.85), sm(t, 6.3, 6.6));   // under it, looking up
    if (t >= 9.3) yaw = turnTo(sp > 0.04 ? yaw : L.yawOf(-1, 0), L.yawOf(-0.5, 0.85), sm(t, 9.3, 9.9));
    P.yaw = yaw;
    const braced = sm(t, tg, tg + 0.18) * (1 - sm(t, 4.75, 5.0)), run = sm(t, 4.95, 5.2) * (1 - sm(t, 6.3, 6.5)), wait = sm(t, 6.35, 6.6) * (1 - sm(t, T_CATCH, T_CATCH + 0.05));
    const got = sm(t, T_CATCH - 0.04, T_CATCH + 0.02), walk = sp > 0.04 && !run ? 1 : 0, lean = -0.3 * braced - 0.06 * Math.min(w, 1.2) * (1 - braced) * (1 - run);
    P.lu = this.wdu * lean + 0.2 * run * (P.vu / (sp || 1)); P.lo = this.wdo * lean + 0.2 * run * (P.vo / (sp || 1));
    // a jump for the handle, and it carries her a moment before it lets her down
    P.lift = this.pa * (0.03 * hump(t, 6.7, 6.9) + 0.03 * hump(t, 6.98, 7.14)) + (this.calm ? 0.05 : 0.09) * ease.out(ramp(t, 7.16, T_CATCH)) * (1 - ease.inOut(ramp(t, T_CATCH + 0.15, T_CATCH + 0.7)));
    P.bob = run > 0 ? 0.014 * Math.abs(Math.sin(t * 15)) * run * this.pa : walk ? 0.012 * Math.abs(Math.sin(t * 10.5)) * this.pa : 0.002 * Math.sin(t * 2.1 + 1);
    P.tp = 0.12 * run; P.hy = 0; P.hp = -0.45 * wait - 0.25 * got * (1 - sm(t, 8.0, 8.6));
    const aR = P.aR, aL = P.aL, sw = Math.sin(t * 15 * this.pz);
    for (let i = 0; i < 4; i++) { aR[i] = ARM.rest[i]; aL[i] = ARM.rest[i]; }
    if (walk && t < 3) { aL[0] += 0.5 * Math.sin(t * 10.5 * this.pz); aR[0] -= 0.5 * Math.sin(t * 10.5 * this.pz); }
    mix4(aL, ARM.point, sm(t, 2.3, 2.6) * (1 - sm(t, 2.9, 3.3)));                          // look, the boats
    mix4(aL, ARM.hat, sm(t, tg - 0.05, tg + 0.15) * (1 - sm(t, 6.4, 6.7)));                 // a hand on her hat
    if (run > 0) { for (let i = 0; i < 4; i++) aR[i] = lerp(aR[i], lerp(ARM.aft[i], ARM.fore[i], 0.5 + 0.5 * sw), run); }
    mix4(aR, ARM.reach, Math.max(wait, got)); mix4(aR, ARM.high, got * sm(t, T_CATCH + 0.55, T_CATCH + 1.3));      // and she brings it down onto her shoulder
    if (wait > 0) { aR[0] += 0.12 * Math.sin(t * 11 * this.pz) * wait; aL[1] += 0.5 * wait; }
  },
  // Going home: blown back to the wall under the picture.
  homePose(f, R, t, P) {
    const L = this.L, fr = f.from; if (!fr || !fr.vis) { P.vis = false; return; }
    const k = ease.inOut(ramp(R, 0.04 + (f.b ? 0 : 0.06), 0.9)), k2 = ease.inOut(ramp(R - 0.02, 0.04 + (f.b ? 0 : 0.06), 0.9)), hu = f.home, ho = this.Wout;
    P.u = lerp(fr.u, hu, k); P.o = lerp(fr.o, ho, k); P.vu = (fr.u - hu) * (k2 - k) / (0.02 * L.retDur); P.vo = (fr.o - ho) * (k2 - k) / (0.02 * L.retDur);
    P.vis = P.o > this.Wout + 0.03; P.w = this.wind(P.u, P.o);
    P.yaw = turnTo(fr.yaw, L.yawOf(hu - fr.u, ho - fr.o), sm(R, 0, 0.22));
    const l = Math.hypot(hu - fr.u, ho - fr.o) || 1; P.lu = 0.16 * (hu - fr.u) / l; P.lo = 0.16 * (ho - fr.o) / l;
    P.lift = 0; P.bob = 0.012 * Math.abs(Math.sin(t * 14 + f.b)) * this.pa; P.tp = 0.08; P.hy = 0; P.hp = 0;
    const sw = Math.sin(t * 14 * this.pz + f.b);
    for (let i = 0; i < 4; i++) { P.aL[i] = ARM.hat[i]; P.aR[i] = lerp(ARM.aft[i], ARM.fore[i], 0.5 + 0.5 * sw); }
    if (!f.b && this.pmode === 'woman') mix4(P.aR, ARM.hold, 1);
    if (f.b && this.pmode === 'girl') mix4(P.aR, ARM.high, 1);
  },
  // The bones from the pose: the body leans from the feet, the skirt hangs from the waist and is blown.
  figMats(f, P) {
    const L = this.L, M = this.M, b = f.b, B = this.bones, V = this.v;
    // what the cloth feels: the wind, less her own going
    const wx = L.tx * this.wdu + L.nx * this.wdo, wz = L.tz * this.wdu + L.nz * this.wdo, vx = L.tx * P.vu + L.nx * P.vo, vz = L.tz * P.vu + L.nz * P.vo;
    P.ex = wx * P.w - vx * 0.55; P.ez = wz * P.w - vz * 0.55; P.ew = Math.hypot(P.ex, P.ez);
    L.floor(P.u + f.ax, P.o + f.ao, V); V.y += P.lift + P.bob + WAIST * f.sc;
    const lx = L.tx * P.lu + L.nx * P.lo, lz = L.tz * P.lu + L.nz * P.lo, la = Math.hypot(lx, lz);
    this.qy.setFromAxisAngle(this.UP, P.yaw);
    if (la > 1e-5) this.qa.setFromAxisAngle(this.ax.set(lz / la, 0, -lx / la), la).multiply(this.qy); else this.qa.copy(this.qy);
    M[b + PEL].compose(V, this.qa, this.s3.setScalar(f.sc));
    // (it streams sideways from the waist and its hem stays down at the grass: it is never lifted, and it is closed underneath)
    const fl = 1 + 0.2 * Math.sin(this.tw * 11 * this.pz + b) * Math.min(1, P.ew), kk = Math.hypot(P.ex, P.ez) * 0.5 * fl, kc = kk > 0.62 ? 0.62 / kk : 1, kx = P.ex * 0.5 * fl * kc, kz = P.ez * 0.5 * fl * kc;
    this.mk.compose(this.ZERO, this.qy, this.s3); this.sh.set(1, -kx, 0, 0, 0, 1, 0, 0, 0, -kz, 1, 0, 0, 0, 0, 1);
    M[b + SKIRT].multiplyMatrices(this.sh, this.mk).setPosition(V);
    B.child(M[b + TOR], M[b + PEL], 0, 0, 0, 0, P.tp, 0);
    B.child(M[b + HEAD], M[b + TOR], 0, 0.162, 0, P.hy, P.hp, 0, f.head);
    B.child(M[b + HAT], M[b + HEAD], 0, 0.021, -0.003, 0, -0.1, 0);
    B.child(M[b + UAL], M[b + TOR], 0.047, 0.108, 0, 0, -P.aL[0], P.aL[1]); B.child(M[b + FAL], M[b + UAL], 0, -UARM, 0, 0, -P.aL[2], P.aL[3]);
    B.child(M[b + UAR], M[b + TOR], -0.047, 0.108, 0, 0, -P.aR[0], -P.aR[1]); B.child(M[b + FAR], M[b + UAR], 0, -UARM, 0, 0, -P.aR[2], -P.aR[3]);
  },
  handOf(f, out) { return out.set(0, -FARM - 0.006, 0).applyMatrix4(this.M[f.b + FAR]); },

  // ---------------------------------------------------------------- the parasol
  // In the woman's hand: over her shoulder; then, as the gust takes it, swung round downwind and pulling.
  heldByWoman(t) {
    const f = this.figs[0], P = f.P, L = this.L, s = this.sdir;
    this.handOf(f, this.hand);
    // (back over her shoulder: away from the way she faces, a little to her right)
    const fx = Math.sin(P.yaw), fz = Math.cos(P.yaw), pull = sm(t, T_STRAIN, T_STRAIN + 0.3), a = lerp(0.35, 1.12, ease.inOut(ramp(t, T_STRAIN + 0.05, T_SNATCH)));
    s.set(-fx * 0.34 + fz * 0.1, 1, -fz * 0.34 - fx * 0.1).normalize();
    this.n.copy(this.UP).multiplyScalar(Math.cos(a)).addScaledVector(this.T3, Math.sin(a)).addScaledVector(this.N3, 0.06 * Math.sin(t * 23) * this.pa);
    s.lerp(this.n, pull).normalize();
    this.hub.copy(this.hand).addScaledVector(s, STICK);
  },
  heldByGirl(t) {
    const f = this.figs[1], P = f.P, s = this.sdir, k = sm(t, T_CATCH, T_CATCH + 0.4), w = Math.min(1.2, P.ew);
    this.handOf(f, this.hand);
    s.set(P.ex * 0.3 * k, 1, P.ez * 0.3 * k); s.addScaledVector(this.T3, 0.06 * Math.sin(t * 2.3) * k * (0.4 + w)).normalize();
    this.hub.copy(this.hand).addScaledVector(s, STICK);
  },
  flyAt(t) {
    const q = ramp(t, T_SNATCH, T_CATCH), s = this.sdir;
    this.fly.at(lerp(q, 1 - (1 - q) * (1 - q), 0.6), this.hub);
    // cartwheeling along the wall, slower and slower, till it hangs the right way up and swings as it comes down
    const qa = ramp(t, T_SNATCH, T_FLOAT), a = t < T_FLOAT ? this.a0 + ((this.calm ? 1 : 2) * TAU - this.a0) * (1 - Math.pow(1 - qa, 1.5)) : 0.26 * Math.sin((t - T_FLOAT) * 5.4) * (1 - 0.8 * ramp(t, T_FLOAT, T_CATCH));
    s.copy(this.UP).multiplyScalar(Math.cos(a)).addScaledVector(this.T3, Math.sin(a)).addScaledVector(this.N3, 0.18 * Math.sin(qa * 9) * (1 - qa)).normalize();
    if (t >= T_FLOAT) this.hub.addScaledVector(this.T3, 0.03 * Math.sin((t - T_FLOAT) * 5.4) * (1 - ramp(t, T_FLOAT, T_CATCH)));
  },
  parasolMat(spin) {
    const s = this.sdir, X = this.x3, Z = this.z3;
    X.crossVectors(Math.abs(s.dot(this.N3)) > 0.95 ? this.T3 : this.N3, s).normalize(); Z.crossVectors(X, s);
    const c = Math.cos(spin), sn = Math.sin(spin);
    this.n.copy(X).multiplyScalar(c).addScaledVector(Z, sn); Z.multiplyScalar(c).addScaledVector(X, -sn);
    this.M[PARASOL].makeBasis(this.n, s, Z).scale(this.s3.setScalar(PSC)).setPosition(this.hub);
  },
  // Worked out once: where the parasol leaves her hands, where the girl's hand will be, and the way between.
  plan(L) {
    const [fw, fg] = this.figs, st = (u, h, o) => L.floor(u, o).setY(L.y + h);
    this.setWind(T_SNATCH); this.womanPose(T_SNATCH, fw.P); this.figMats(fw, fw.P); this.heldByWoman(T_SNATCH);
    const p0 = this.hub.clone(); this.a0 = Math.atan2(this.sdir.dot(this.T3), this.sdir.y);
    this.setWind(T_CATCH); this.girlPose(T_CATCH, fg.P); this.figMats(fg, fg.P); this.handOf(fg, this.hand);
    const p1 = this.hand.clone(); p1.y += STICK;
    this.fly = flight([p0, st(0.42, 0.86, 0.7), st(0.9, 0.26, 0.86), st(1.24, 0.5, 0.74), st(1.34, 0.84, 0.52), st(1.08, 0.94, 0.44), st(0.8, 0.94, 0.6), p1.clone().setY(p1.y + 0.14), p1], { closed: false });
    let lo = Infinity; this.tBounce = 5.2;
    for (let t = T_SNATCH + 0.2; t < 5.8; t += 0.02) { const q = ramp(t, T_SNATCH, T_CATCH); this.fly.at(lerp(q, 1 - (1 - q) * (1 - q), 0.6), this.v); if (this.v.y < lo) { lo = this.v.y; this.tBounce = t; } }
    this.setWind(0);
  },

  hideAll() {
    this.land.visible = false; this.rig.mesh.visible = false; this.marks.visible = false; this.marks.count = 0;
    this.lu.uGrow.value = 0;
  },
  start(L, resumed) {
    if (!resumed) { this.hideAll(); this.tOff = 0; for (const f of this.figs) { f.ax = f.ao = 0; f.from = null; } }
    else this.tOff = Math.max(T_END, this.tc || 0) - L.t;
    this.band.from(L.t + this.tOff);
    if (!this.told && !L.quiet) { this.told = true; L.k.say('Hold on to your hat. The wind has got out of the picture.', 4); }
  },
  back(L) {
    this.growFrom = this.lu.uGrow.value;
    for (const f of this.figs) f.from = { u: f.P.u + f.ax, o: f.P.o + f.ao, yaw: f.P.yaw, vis: f.P.vis };
    this.pmode = this.tc < T_SNATCH ? 'woman' : this.tc < T_CATCH ? 'fly' : 'girl';
    this.hubFrom.copy(this.hub); this.sFrom.copy(this.sdir);
    for (const p of this.pet) p.from.copy(p.p);
  },
  end() { this.hideAll(); this.windLo.set(0); this.windHi.set(0); },
  reset() { this.hideAll(); this.told = false; this.tc = 0; this.tOff = 0; this.windLo.set(0); this.windHi.set(0); },

  // ---------------------------------------------------------------- every frame
  update(L, dt) {
    const ph = L.phase, showing = ph === 'wake' || ph === 'play', back = ph === 'return', U = this.lu;
    if (showing) this.tc = L.t + this.tOff; else if (ph === 'linger') this.tc += dt;
    const R = back ? L.ret : 0, t = back ? this.tc + L.ret * L.retDur : this.tc;
    // "Reduce motion and flashing": gusts at half speed and about half strength, nothing that flutters, bobs or beats
    // faster than once a second, no snap; the way the parasol goes is worked out again for the gentler wind
    const calm = !!(L.k.museum && L.k.museum.calm);
    if (calm !== this.calm) { this.calm = calm; this.cs = calm ? 0.5 : 1; this.pz = calm ? 0.4 : 1; this.pa = calm ? 0 : 1; this.plan(L); this.band = this.bands[calm ? 1 : 0]; this.band.from(t); U.uFl.value.set(calm ? 0.45 : 1, calm ? 0.5 : 1); }
    this.setWind(t, R);
    U.uTime.value = t; U.uBreeze.value = this.B; U.uWd.value.set(this.wdu, this.wdo);
    for (let i = 0; i < 2; i++) U.uGust.value[i].set(this.gust[i][0], this.gust[i][1], this.gust[i][2]);
    U.uGrow.value = back ? this.growFrom * (1 - ease.inOut(ramp(R, 0.3, 1))) : GROW * sm(t, 0.2, 2.0);
    this.land.visible = U.uGrow.value > 0.01;

    // the two of them
    const [fw, fg] = this.figs, toy = L.k.G.vehicle, tl = toy && ph === 'linger' && Math.abs(toy.pos.y - L.y) < 0.5 ? L.local(toy.pos.x, toy.pos.z) : null;
    if (back) { this.homePose(fw, R, t, fw.P); this.homePose(fg, R, t, fg.P); } else { this.womanPose(t, fw.P); this.girlPose(t, fg.P); }
    for (const f of this.figs) {
      // out of the toy's way, softly (they never stop it)
      if (tl) { const eu = f.P.u + f.ax - tl.u, eo = f.P.o + f.ao - tl.out, d = Math.hypot(eu, eo), rr = 0.34; if (d < rr && d > 1e-4) { const k = Math.min(1, dt * 6); f.ax += (eu / d) * (rr - d) * 1.2 * k; f.ao += (eo / d) * (rr - d) * 1.2 * k; } }
      if (!back) { f.ax *= Math.exp(-dt * 1.2); f.ao *= Math.exp(-dt * 1.2); } else { f.ax = f.ao = 0; }
      this.figMats(f, f.P);
      for (let p = 1; p < NP; p++) { const id = this.I[f.b + p]; this.rig.show(id, f.P.vis); if (f.P.vis) this.rig.mat(id, this.M[f.b + p]); }
      const pu = U.uPush.value[f.b ? 1 : 0]; if (f.P.vis && f.P.o > -L.wall) pu.set(f.P.u + f.ax, f.P.o + f.ao, 0.24 * f.sc, 1); else pu.set(0, 0, 0, 0);
    }
    if (tl) U.uPush.value[2].set(tl.u, tl.out, 0.36, 0.35); else U.uPush.value[2].set(0, 0, 0, 0);

    // the parasol
    let pvis = true; const spin = 1.5 * t + (this.calm ? 0 : 4) * Math.max(0, Math.min(t, T_CATCH) - T_SNATCH);
    if (back) {
      if (this.pmode === 'woman') { this.heldByWoman(Math.min(this.tc, T_STRAIN)); pvis = fw.P.vis; }
      else if (this.pmode === 'girl') { this.heldByGirl(t); pvis = fg.P.vis; }
      else {
        // caught in the air when the look ended: it tumbles home on the wind, in under the picture
        const k = ease.in(ramp(R, 0, 0.85)), a = this.a0 + R * (this.calm ? 1 : 2) * TAU;
        L.floor(0.1, this.Wout - 0.1, this.v).setY(L.y + 0.4); this.hub.lerpVectors(this.hubFrom, this.v, k); this.hub.y += 0.25 * Math.sin(Math.PI * k);
        this.sdir.copy(this.UP).multiplyScalar(Math.cos(a)).addScaledVector(this.T3, Math.sin(a)).normalize(); pvis = R < 0.85;
      }
    } else if (t < T_SNATCH) { this.heldByWoman(t); pvis = fw.P.vis; } else if (t < T_CATCH) this.flyAt(t); else this.heldByGirl(t);
    this.rig.show(this.I[PARASOL], pvis); if (pvis) { this.parasolMat(spin); this.rig.mat(this.I[PARASOL], this.M[PARASOL]); }
    this.rig.mesh.visible = fw.P.vis || fg.P.vis || pvis;

    this.draw(L, t, R, back);

    // sound: the wind itself, low and high, by how hard it blows where they stand
    if (showing) this.band.play(t);
    const cam = L.k.G.camera.position, near = L.quiet ? 0 : Math.max(0, 1 - Math.hypot(cam.x - L.cx, cam.z - L.cz) / 11), wc = Math.min(1.6, this.wind(0.1, 0.7)), fade = back ? 1 - R : 1;
    const lv = calm ? 0.55 : 1, tau = calm ? 0.5 : 0.12;
    this.windLo.set(near * fade * lv * (0.003 + 0.03 * wc * wc), tau); this.windHi.set(near * fade * lv * (0.0015 + 0.011 * wc), tau);
    L.voice().place(L.cx + L.nx, L.cz + L.nz);
  },

  // ---------------------------------------------------------------- his marks, placed for this moment
  draw(L, t, R, back) {
    const aP = this.aPos.array, aD = this.aDir.array, aS = this.aSide.array, aK = this.aKind.array, aZ = this.aSize.array, V = this.v, N = this.n, M = this.M;
    const col = this.marks.instanceColor, lit = this.lit, sh = this.shade, cols = this.cols;
    const put = (i, x, y, z, dx, dy, dz, len, wid, cell) => { const j = i * 3, k = i * 2; aP[j] = x; aP[j + 1] = y; aP[j + 2] = z; aD[j] = dx; aD[j + 1] = dy; aD[j + 2] = dz; aK[k] = 0; aK[k + 1] = cell; aZ[k] = len; aZ[k + 1] = wid; };
    const none = i => { aZ[i * 2] = 0; aZ[i * 2 + 1] = 0; };
    // the dabs on the two figures, lit from the left and above; his shadows go lilac-blue
    const defs = this.att;
    for (let i = 0; i < defs.length; i++) {
      const s = defs[i], f = s.f; if (!f.P.vis) { none(i); continue; }
      const Mx = M[s.m]; V.copy(s.p).applyMatrix4(Mx); N.copy(s.d).transformDirection(Mx);
      put(i, V.x, V.y, V.z, N.x, N.y, N.z, s.len, s.wid, s.cell);
      N.copy(s.nr).transformDirection(Mx);
      const k = 0.6 + 0.4 * Math.max(0, N.dot(lit)), q = Math.max(0, 0.85 - k) * 0.7, c = cols[i];
      col.setXYZ(i, c.r * k + sh.r * q, c.g * k + sh.g * q, c.b * k + sh.b * q);
    }
    // ribbons: the woman's sash ends from the back of her waist, the girl's from her hat, streaming
    for (let r = 0; r < 4; r++) {
      const f = this.figs[r >> 1], P = f.P, i0 = this.iRib + r * 3, sx = r & 1 ? 1 : -1;
      if (!P.vis) { none(i0); none(i0 + 1); none(i0 + 2); continue; }
      if (r < 2) V.set(sx * 0.014, -0.004, -0.04).applyMatrix4(M[f.b + PEL]); else V.set(sx * 0.01, 0.006, -0.03).applyMatrix4(M[f.b + HAT]);
      const ew = P.ew, ex = ew > 1e-4 ? P.ex / ew : 0, ez = ew > 1e-4 ? P.ez / ew : 0, len = (r < 2 ? 0.05 : 0.046) * f.sc * (1 + 0.25 * Math.min(1, ew));
      let x = V.x, y = V.y, z = V.z;
      for (let j = 0; j < 3; j++) {
        const phi = Math.min(1.5, 0.12 + ew * 1.5) + 0.42 * Math.sin(t * 12 * this.pz - j * 1.5 + r * 2.1) * Math.min(1, 0.25 + ew * 1.2), s = Math.sin(phi), c = Math.cos(phi), dx = ex * s, dy = -c, dz = ez * s;
        put(i0 + j, x + dx * len * 0.5, y + dy * len * 0.5, z + dz * len * 0.5, dx, dy, dz, len, (0.02 - 0.003 * j) * f.sc, 0);
        x += dx * len * 0.8; y += dy * len * 0.8; z += dz * len * 0.8;
      }
    }
    // petals: torn off the flowers as a gust's front goes over them, carried, and settling on the floor downwind
    const g0 = this.gust[0], n = Math.floor((t - AGAIN.t) / AGAIN.every), tg = AGAIN.t + n * AGAIN.every, grow = this.lu.uGrow.value;
    for (let i = 0; i < this.pet.length; i++) {
      const p = this.pet[i], k = this.iPet + i, j = k * 3;
      if (back) {
        // swept home under the picture with everything else
        if (p.on <= 0) { none(k); continue; }
        const q = ease.in(ramp(R, 0.05 + 0.3 * p.a, 0.7 + 0.3 * p.a)); L.floor(0.5 * (p.b - 0.5), this.Wout, V).setY(L.y + 0.1 + 0.3 * p.c);
        V.lerpVectors(p.from, V, q); V.y += 0.25 * Math.sin(Math.PI * q) * (0.4 + p.d);
        put(k, V.x, V.y, V.z, Math.sin(t * 9 * this.pz + i), Math.cos(t * 9 * this.pz + i), 0, p.size * 1.3 * (1 - q), p.size * (1 - q), 1); continue;
      }
      // which gust has it now: the big one, or (every other petal) the latest of the small ones
      let t0 = this.arr(p.u) + 0.05 + 0.55 * p.a, big = true;
      if (n >= 0 && i % 2 === n % 2) { const ta = tg + (p.u - AGAIN.u0) / (AGAIN.v * this.cs) + 0.05 + 0.4 * p.a; if (t >= ta) { t0 = ta; big = false; } }
      const tau = t - t0;
      if (tau < 0 || grow < 0.5) { none(k); p.on = 0; continue; }
      const T = 1.5 + 0.9 * p.b, D = Math.min(big ? 0.55 + 0.85 * p.c : 0.3 + 0.4 * p.c, 1.8 - p.u), A = (big ? 0.22 + 0.34 * p.d : 0.1 + 0.16 * p.d), q = Math.min(1, tau / T);
      const u = p.u + D * (1 - Math.exp(-Math.min(tau, T) / 0.7)) / (1 - Math.exp(-T / 0.7)), o =p.o + (p.a - 0.5) * 0.5 * q + 0.05 * Math.sin(tau * 5 + i) * (1 - q);
      const h = lerp(p.h, 0.018, q) + 4 * A * q * (1 - q) + 0.025 * Math.sin(tau * 9 + i * 1.7) * (1 - q);
      const gone = 1 - sm(tau, T + (big ? 3.4 : 2.6), T + (big ? 4.4 : 3.4)), sz = p.size * sm(tau, 0, 0.12) * gone;
      L.floor(u, o, V); V.y = L.y + h; p.p.copy(V); p.on = sz > 0.001 ? 1 : 0;
      if (q >= 1) {
        // come to rest: lying on the floor
        const a = p.c * TAU, cx = Math.cos(a), sz2 = Math.sin(a);
        aP[j] = V.x; aP[j + 1] = V.y; aP[j + 2] = V.z; aD[j] = cx; aD[j + 1] = 0; aD[j + 2] = sz2; aS[j] = -sz2; aS[j + 1] = 0; aS[j + 2] = cx; aK[k * 2] = 1; aK[k * 2 + 1] = 1; aZ[k * 2] = sz * 1.3; aZ[k * 2 + 1] = sz;
      } else put(k, V.x, V.y, V.z, Math.sin(tau * 10 * this.pz + i), Math.cos(tau * 10 * this.pz + i), 0, sz * 1.3, sz, 1);
    }
    // flicks of his sky: a breath of them down from under the frame at first, then flying with each gust's front
    const railH = L.rail - L.y;
    for (let i = 0; i < this.stk.length; i++) {
      const s = this.stk[i], k = this.iStk + i;
      if (back || (this.calm && i % 2)) { none(k); continue; }
      if (i < 10 && t < 1.6) {
        const q = ramp(t, 0.05 + i * 0.055, 0.9 + i * 0.055), a = 1 - q, env = Math.sin(Math.PI * q); if (env <= 0.01) { none(k); continue; }
        const p0u = s.u0, p0h = railH - 0.035, p0o = -L.wall * 0.45, p1u = s.u0 + 0.05, p1h = 0.5, p1o = 0.4 + 0.2 * (s.o / 1.3), p2u = s.u0 + 0.8, p2h = 0.1, p2o = 0.5 + 0.5 * (s.o / 1.3);
        const u = a * a * p0u + 2 * a * q * p1u + q * q * p2u, h = a * a * p0h + 2 * a * q * p1h + q * q * p2h, o = a * a * p0o + 2 * a * q * p1o + q * q * p2o;
        const du = 2 * a * (p1u - p0u) + 2 * q * (p2u - p1u), dh = 2 * a * (p1h - p0h) + 2 * q * (p2h - p1h), dout = 2 * a * (p1o - p0o) + 2 * q * (p2o - p1o);
        L.floor(u, o, V); N.set(L.tx * du + L.nx * dout, dh, L.tz * du + L.nz * dout).normalize();
        put(k, V.x, L.y + h, V.z, -N.x, -N.y, -N.z, s.len * 0.9 * env, s.wid * env, 0); continue;
      }
      let front = g0[1] > 0 && g0[0] - s.back < 2.0 ? g0[0] : -9;
      if (front < -8 && n >= 0 && i % 2 === 0) front = this.gust[1][0];
      const u = front - s.back; if (u < -2.1 || u > 1.95) { none(k); continue; }
      const env = sm(u, -2.1, -1.7) * (1 - sm(u, 1.35, 1.95)), h = s.h + 0.09 * Math.sin(u * 3.2 + s.ph), dh = 0.29 * Math.cos(u * 3.2 + s.ph);
      L.floor(u, s.o, V); N.set(L.tx, dh, L.tz).normalize();
      put(k, V.x, L.y + h, V.z, -N.x, -N.y, -N.z, s.len * env, s.wid * env, 0);
    }
    // the sails: scudding along the skirting before the wind, heeling as a gust goes over them
    const run = 0.075 * t + 0.34 * ease.inOut(ramp(t, GUST.t + 0.2, GUST.t + 2.4)) + (n >= 0 ? 0.14 * (n + ease.inOut(ramp(t - tg, 0.3, 2.0))) : 0);
    for (let i = 0; i < this.boats.length; i++) {
      const b = this.boats[i], k = this.iSail + i * 3, x = ((b.x * SEA.span + run * (0.8 + 0.4 * b.s)) % SEA.span + SEA.span) % SEA.span, u = SEA.a + x;
      const sc = b.s * sm(x, 0, 0.06) * (1 - sm(x, SEA.span - 0.1, SEA.span)) * sm(grow - Math.hypot(u, b.o + L.wall), 0, 0.3) * (back ? 1 - sm(R, 0.2, 0.6) : 1);
      if (sc < 0.02) { none(k); none(k + 1); none(k + 2); continue; }
      const w = this.wind(u, b.o), heel = 0.1 + 0.55 * Math.min(1.3, w), sn = Math.sin(heel), cs = Math.cos(heel), bobY = 0.004 * Math.sin(t * 3 + i * 2);
      L.floor(u, b.o, V); const y = L.y + 0.024 + bobY, dx = L.tx * sn, dz = L.tz * sn;
      put(k, V.x + dx * 0.058 * sc, y + cs * 0.058 * sc, V.z + dz * 0.058 * sc, dx, cs, dz, 0.125 * sc, 0.07 * sc, 0);
      put(k + 1, V.x + L.tx * 0.04 * sc + dx * 0.034 * sc, y + cs * 0.034 * sc, V.z + L.tz * 0.04 * sc + dz * 0.034 * sc, dx + L.tx * 0.25, cs, dz + L.tz * 0.25, 0.075 * sc, 0.04 * sc, 0);
      put(k + 2, V.x + L.tx * 0.01 * sc, y - 0.004, V.z + L.tz * 0.01 * sc, L.tx, 0.12, L.tz, 0.085 * sc, 0.026 * sc, 1);
    }
    this.marks.count = this.NS; this.marks.visible = true;
    this.aPos.needsUpdate = true; this.aDir.needsUpdate = true; this.aSide.needsUpdate = true; this.aKind.needsUpdate = true; this.aSize.needsUpdate = true; col.needsUpdate = true;
  },
});
