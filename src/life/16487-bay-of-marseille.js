// Paul Cézanne, The Bay of Marseille, Seen from L'Estaque (about 1885), Gallery 248. The word: card.
//
// He wrote to Pissarro from L'Estaque that the view was "like a playing card. Red roofs against the blue sea", and
// that the sun there was so strong that things stood out as flat shapes of colour: the opposite of modelling. He built
// this picture that way, in four bands (village, water, mountain, sky), every one of them laid in flat, slanting
// touches of the brush, and yet it holds as solid as a wall. Nothing in it moves but one thing: the white plume from
// the chimney on the right.
//
// Look at it and the picture is dealt out on the floor below, as cards, far to near. His mountains first: a rank of
// cards lying along the foot of the wall, violet and grey-blue, stands up one card after another into his slanting
// touches, low on the left and highest on the right. Then the bay: cards pour out from under the
// frame and lay themselves across the floor in overlapping rows, as a dealer spreads a deck, blues with green and
// violet among them, the pale line of Marseille along the far side, the ochre headland with its green fields coming in
// from the left, and one pale card askew on the blue for the jetty. Then the village is dealt, card by card, spinning
// flat out of the slot under the frame and landing on its edge: four walls, the gables, and two red cards slapped down
// for each roof (each with a note, like a tile tapped); green cards are dealt in heaps between the houses for his
// trees, lighter where the sun is; the tall brick chimney comes down end over end, lands upright and rocks until it is
// still. The big house in the middle is roofed last. A pause; the short chimney on the right rattles. Then the one
// thing in the picture that is not flat and not still: a puff, and his white plume leans out to the left over the
// blue, in soft streaked touches, not a card in it.
// While you keep looking the smoke goes on, and now and then a ripple runs along one row of the bay.
//
// When you stop, the smoke thins and it is all gathered up again: the roofs first, back into the slot under the frame,
// then the walls, the sea row by row, and the mountains lie down again along the wall.
//
// Three draw calls: every card (one instanced box, each with its own colour and its own slanting brush touches), the
// smoke (soft dabs that face the eye), and the shadows under the houses.
//
// It does not knock the houses down: a house of cards that fell would make a joke of a painter who wanted things to
// stand, so the cards are gathered, never toppled; and it adds no boat, bird or person, because he painted none.
import * as THREE from 'three';
import { lifeFor, ease, ramp, clamp01, canvasTexture } from '../paintlife.js';
import { score } from './stagecraft.js';

const TAU = Math.PI * 2, HALF = Math.PI / 2;
const SC = 1.15;                                   // the size of it all (what follows is in its own metres)
const TH = 0.003;                                  // a card's thickness
// The bay: rows of cards, far to near (z: out from the wall), each spread across the floor one card over the last.
const CW = 0.085, CL = 0.12, ROWS = 6, ROW0 = 0.27, ROW_D = 0.122, PITCH = 0.07, HALF_W = 0.98, TILT = 0.12;
const COAST = [-9, -9, -9, -0.62, -0.38, -0.12];   // in each row, the headland lies left of this
const T_HILLS = 0.1, T_SEA = 0.45, ROW_GAP = 0.17, SWEEP = 0.42, FLY = 0.46;
const T_PUFF = 5.6, T_BUILT = 6.0;
const SMOKE = 34, LIFE = 3.2;                      // the plume's dabs, and how long each lasts (s)
const RIP0 = 9.5, RIP_EVERY = 5.5, RIP_STEP = 0.028, RIP_LEN = 0.55;       // a ripple along one row of the bay
// The village. u (along the wall), z (out), yaw, w (along the ridge), d, h (walls), rise (roof), t (dealt at), and its
// colours: the walls front, right, back, left; the roof towards you and away. slow: heavier cards (the last house).
const HOUSES = [
  { u: -0.82, z: 0.64, yaw: 0.2, w: 0.1, d: 0.075, h: 0.05, rise: 0.034, t: 2.1, y: 0.03, c: ['#e2c08c', '#c99a6a', '#b98a60', '#d8b07c', '#d8704c', '#c8603f'] },
  { u: -0.62, z: 0.8, yaw: 0.15, w: 0.15, d: 0.1, h: 0.075, rise: 0.045, t: 2.3, y: 0.03, c: ['#d9b27c', '#e6cf9a', '#a57c5c', '#a8805e', '#d47a55', '#c4633f'] },
  { u: -0.34, z: 0.9, yaw: -0.25, w: 0.13, d: 0.095, h: 0.07, rise: 0.04, t: 2.5, y: 0.03, c: ['#cfa070', '#e3c78f', '#a57c5c', '#9c7a62', '#d8805a', '#c66a44'] },
  { u: 0.36, z: 1.02, yaw: 0.04, w: 0.36, d: 0.14, h: 0.1, rise: 0.055, t: 2.9, c: ['#b98a5a', '#cfa272', '#8f6a4c', '#96705a', '#b86a4a', '#a55a40'] },
  { u: -0.6, z: 1.27, yaw: -0.05, w: 0.46, d: 0.19, h: 0.15, rise: 0.085, t: 3.3, c: ['#9a8a78', '#e6c98f', '#8d7a66', '#8a7868', '#e09a72', '#cf7a56'] },
  { u: 0.56, z: 1.31, yaw: 0.03, w: 0.42, d: 0.17, h: 0.13, rise: 0.075, t: 3.7, win: true, c: ['#a9a6a6', '#e2c492', '#8f8478', '#90887e', '#e3a274', '#d28458'] },
  { u: 0.0, z: 1.25, yaw: 0.9, w: 0.3, d: 0.21, h: 0.21, rise: 0.1, t: 4.15, slow: true, c: ['#dfc391', '#b99a78', '#8a7462', '#7d6a5c', '#dc6f4a', '#c95c3c'] },
];
// The roofs, two notes each (D major pentatonic, climbing), and the last house low: D and A, which the puff's long notes fill out.
const ROOF = [[587.33, 739.99], [659.25, 880], [739.99, 987.77], [880, 1174.66], [987.77, 1318.5], [880, 1174.66], [293.66, 440]];
const STACK = { u: -0.5, z: 1.1, s: 0.05, H: 0.47, t: 2.5, dur: 0.75 };      // the tall brick chimney
const SMOKER = { u: 0.578, z: 1.0, s: 0.036, H: 0.25, t: 3.2, dur: 0.6 };   // the one that smokes
// The trees: u, z, size, t.
const TREES = [[-0.3, 1.08, 0.7, 2.8], [0.25, 1.17, 1.0, 3.5], [0.5, 1.155, 0.9, 3.75], [0.9, 1.2, 1.25, 4.0], [-0.9, 1.4, 1.0, 3.9], [-0.22, 1.44, 0.85, 4.5]];
// The mountains across the bay: how high the ridge stands at u (his three masses, the tallest to the right).
const ridge = u => 0.075 + 0.075 * Math.exp(-(((u + 0.7) / 0.26) ** 2)) + 0.125 * Math.exp(-(((u - 0.02) / 0.3) ** 2)) + 0.2 * Math.exp(-(((u - 0.7) / 0.27) ** 2));
const HILL_STEP = 0.055, HILL_LAG = 0.013, HILL_OPEN = 0.42;
const _h = (a, b = 0) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };

// A card's paint: its own flat colour, laid in his short parallel touches on a slant (a little lighter or darker,
// warmer or cooler each), a dark line round its edge as he draws round a roof, glowing a little in its own colour.
function cardPaint() {
  const m = new THREE.MeshStandardMaterial({ roughness: 0.85, metalness: 0, emissive: 0xffffff, emissiveIntensity: 0.46 });
  m.onBeforeCompile = sh => {
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float aSeed; varying vec3 vCP; varying vec3 vCN; varying vec2 vCH; varying float vSeed;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
  { vec3 cs = vec3(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz), length(instanceMatrix[2].xyz)); vCP = position * cs; vCH = cs.xy * 0.5; vCN = normal; vSeed = aSeed; }`);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
varying vec3 vCP; varying vec3 vCN; varying vec2 vCH; varying float vSeed;
float cpH(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }`)
      .replace('#include <color_fragment>', `#include <color_fragment>
{
  float sd = vSeed * 61.0, face = step(0.5, abs(vCN.z));
  float an = 0.85 + (fract(sd * 0.37) - 0.5) * 0.6;
  vec2 r = vec2(cos(an) * vCP.x + sin(an) * vCP.y, -sin(an) * vCP.x + cos(an) * vCP.y);
  r.y += 0.002 * sin(r.x * 40.0 + sd);                                      // (the lanes waver, as a hand does)
  vec2 q = r / vec2(0.055, 0.0155);
  float lane = floor(q.y); q.x = q.x * (0.7 + 0.6 * cpH(vec2(lane, sd + 3.0))) + cpH(vec2(lane, sd)) * 7.0;      // (each lane its own length of touch)
  vec2 id = vec2(floor(q.x), lane), f = fract(q);
  float h = cpH(id + sd), h2 = cpH(id + sd + 17.3);
  float soft = smoothstep(0.0, 0.32, f.y) * smoothstep(1.0, 0.68, f.y), tip = smoothstep(0.0, 0.09, f.x);
  vec3 c = diffuseColor.rgb;
  c *= mix(1.0, (0.9 + 0.2 * h) * (0.93 + 0.07 * soft) * (0.95 + 0.05 * tip), face);
  c *= mix(vec3(1.0), mix(vec3(0.94, 0.99, 1.08), vec3(1.07, 1.0, 0.9), h2), face * 0.8);
  float bd = min(vCH.x - abs(vCP.x), vCH.y - abs(vCP.y));
  c = mix(c, c * vec3(0.5, 0.56, 0.74), face * (1.0 - smoothstep(0.0012, 0.0042, bd)) * 0.8);
  c = mix(c * 1.1 + 0.02, c, face);
  diffuseColor.rgb = c;
}`)
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n  totalEmissiveRadiance *= diffuseColor.rgb;');
  };
  m.customProgramCacheKey = () => 'estaque-card';
  return m;
}

// One touch of his smoke: a few curved bristle lines side by side, as a loaded brush turned on the canvas leaves.
function dabTexture() {
  return canvasTexture(128, 128, (g, w, h) => {
    let s = 16487; const r = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
    g.clearRect(0, 0, w, h);
    const body = g.createRadialGradient(64, 64, 4, 64, 64, 60); body.addColorStop(0, 'rgba(255,255,255,0.6)'); body.addColorStop(0.55, 'rgba(255,255,255,0.3)'); body.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = body; g.fillRect(0, 0, w, h);
    g.lineCap = 'round';
    for (let rad = 150; rad <= 250; rad += 12.5) {
      g.strokeStyle = `rgba(255,255,255,${0.35 + 0.5 * r()})`; g.lineWidth = 5 + r() * 5;
      g.beginPath(); g.arc(64 + (r() - 0.5) * 8, 264, rad + (r() - 0.5) * 5, Math.PI * 1.5 - 0.34 + r() * 0.12, Math.PI * 1.5 + 0.34 - r() * 0.12); g.stroke();
    }
    // (soft at its ends and edges: no square shows)
    g.globalCompositeOperation = 'destination-in';
    const mask = g.createRadialGradient(64, 64, 10, 64, 64, 62); mask.addColorStop(0, 'rgba(0,0,0,1)'); mask.addColorStop(0.55, 'rgba(0,0,0,0.9)'); mask.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = mask; g.fillRect(0, 0, w, h);
  });
}

lifeFor(16487, {
  title: /^The Bay of Marseille/,
  word: 'card',
  // (a small work: the kit keeps the whole of it in view, in the upper part; the camera stands high enough to look
  // down on the bay over the roofs, as he did from the hill)
  stage: { out: 1.8, half: 1.25, cam: { dist: 2.9, height: 1.1, side: 0.3, fov: 58, lookU: 0, lookOut: 0.7, lookH: 0.7, floorOut: 1.76 } },
  wake: 2, ret: 2.6,

  build(L) {
    const P = L.pal, col = (h, a = 0.3) => P.near(h, a);
    const V3 = THREE.Vector3, Qn = THREE.Quaternion, M4 = THREE.Matrix4;
    const T = this.T = { v: new V3(), w: new V3(), c: new V3(), q: new Qn(), q2: new Qn(), m: new M4(), e: new THREE.Euler(0, 0, 0, 'YXZ'), one: new V3(1, 1, 1), col: new THREE.Color() };
    const qe = this.qe = (out, yaw, pitch = 0, roll = 0) => out.setFromEuler(T.e.set(pitch, yaw, roll, 'YXZ'));
    const AX = { x: new V3(1, 0, 0), y: new V3(0, 1, 0), z: new V3(0, 0, 1) };
    // The stage: x along the wall (to the right), y up, z out from the wall, at the foot of the wall under the work.
    const stage = this.stage = new THREE.Group(); stage.matrixAutoUpdate = false;
    stage.matrix.makeBasis(new V3(L.tx * SC, 0, L.tz * SC), new V3(0, SC, 0), new V3(L.nx * SC, 0, L.nz * SC)).setPosition(L.floor(0, -L.wall));
    L.group.add(stage);
    this.railY = (L.rail - L.y) / SC; this.zFront = (L.wall + 0.05) / SC;
    const rand = L.rand;

    // ------------------------------------------------------------ the cards, and the groups they move in
    const cards = this.cards = [], groups = this.groups = [];
    const s = this.sc = score(L);
    const group = o => { const g = Object.assign({ kind: 'deal', piv: new V3(), t0: 0, dur: 0.5, mu: 0, drop: 0.035, arc: 0.9, reach: 0.6, cen: new V3(), yaw0: 0, turns: 1.5, flut: 0, wob: 0, wobF: 22, wobD: 7, wax: new V3(1, 0, 0), th0: HALF, bax: AX.z, open: 0, openD: 0.5, P: new V3(), Q: new Qn(), qh: new Qn(), qhi: new Qn(), on: false, fly: false, stamp: -1, cards: [] }, o); groups.push(g); return g; };
    const card = (g, o) => { const c = Object.assign({ g, rel: new V3(), qb: new Qn(), ax: null, ang: 0, off: new V3(), post: null, col: null, fan: false, ang0: 0, lag: 0, row: -1, j: 0, done: false }, o); if (!c.post) c.post = new M4().makeScale(o.w, o.h, TH); c.i = cards.length; cards.push(c); g.cards.push(c); return c; };
    // One card dealt on its own: where it comes to rest (its pivot, how it is turned there, and from the pivot to its
    // middle), and when.
    const single = (o, go) => {
      const g = group(go), c = card(g, o);
      g.qh.copy(c.qb); if (c.ax) g.qh.multiply(T.q.setFromAxisAngle(c.ax, c.ang)); g.qhi.copy(g.qh).invert();
      g.cen.copy(c.off).applyQuaternion(g.qh);
      g.tEnd = g.t0 + g.dur + (g.wob ? 1.2 : 0.02);
      return g;
    };
    const tick = (t, vol = 0.014, bp = 2400) => s.hit(t, { d: 0.028, vol, bp, q: 1.4 });

    // ---- the mountains: a rank of cards laid along the foot of the wall, which stand up one after another into his
    // slanting touches; the ridge is where their tops come to
    const hillC = ['#7f86a3', '#9a8fa6', '#6f8a9a', '#8f9f9a', '#b3a3a8', '#8791ad'];
    {
      const g = group({ kind: 'rise', piv: new V3(0, 0.004, 0.058), t0: T_HILLS, dur: 0.3, open: T_HILLS + 0.3, openD: HILL_OPEN });
      let n = 0;
      for (let u = -1.06; u < 0.97; u += HILL_STEP * (0.9 + 0.2 * rand()), n++) {
        const ang = -(0.52 + 0.24 * rand()), top = ridge(u + 0.09) * (0.93 + 0.14 * rand()), l = top / Math.cos(ang), deep = clamp01((top - 0.16) / 0.1);
        card(g, { qb: new Qn(), ax: AX.z, ang, ang0: -1.5, fan: true, lag: n * HILL_LAG, rel: new V3(u, 0, (n % 6) * 0.003), off: new V3(0, l / 2, 0), w: 0.085, h: l, col: col(rand() < deep * 0.7 ? '#5f7390' : hillC[Math.floor(rand() * hillC.length)], 0.3) });
      }
      g.tEnd = g.open + n * HILL_LAG + HILL_OPEN + 0.05;
      for (let i = 0; i < 14; i++) tick(g.open + 0.1 + i * n * HILL_LAG / 14, 0.007 + 0.004 * (i % 2), 3000 + 60 * i);
      s.hit(T_HILLS + 0.05, { d: 0.3, vol: 0.012, lp: 900, attack: 0.1 });
    }

    // ---- the far shore, the bay and the headland: rows spread across the floor, one card over the last
    const seaC = ['#3f5f86', '#4a6b8f', '#476a96', '#5a7a98', '#4b5a8a', '#4f7f80', '#6e8ea6'];
    const landC = ['#cf9a5a', '#d9a86a', '#c9824a', '#ddb47a'], fieldC = ['#5f9a5a', '#4f8f62', '#7aa860'], shoreC = ['#cdbd95', '#aaa3b2', '#d6cbaa', '#b9b0a4'];
    const row = (r, z, t0, n, w, l, pitch, pick) => {
      const dir = r % 2 ? -1 : 1;
      const j0 = Math.floor(rand() * 2.4), j1 = n - Math.floor(rand() * 2.4), m = j1 - j0;      // (ragged ends: no straight edge to the bay)
      for (let k = 0; k < m; k++) {
        const j = dir > 0 ? j0 + k : j1 - 1 - k, u = (j - (n - 1) / 2) * pitch + (rand() - 0.5) * 0.012;
        single({ qb: qe(new Qn(), (rand() - 0.5) * 0.16, -HALF), ax: AX.y, ang: dir * (TILT + (rand() - 0.5) * 0.05), off: new V3(-dir * w / 2, 0, 0), w, h: l, col: pick(u, j), row: r, j: k },
          { kind: 'stream', piv: new V3(u + dir * w / 2, 0.019, z + (rand() - 0.5) * 0.014), t0: t0 + SWEEP * k / m, dur: FLY + rand() * 0.05, mu: u * 0.32, arc: 0.72, reach: 0.35, turns: 0.75 * (rand() < 0.5 ? -1 : 1), flut: 0.5, yaw0: 0 });
      }
      for (let i = 0; i < 12; i++) tick(t0 + FLY + SWEEP * i / 12, 0.007 + 0.005 * _h(i, r), 3000 + 900 * _h(r, i));
    };
    row(-1, 0.17, T_SEA - 0.12, 17, 0.125, 0.06, 0.118, () => col(shoreC[Math.floor(rand() * shoreC.length)], 0.25));
    const NROW = Math.round(2 * HALF_W / PITCH) + 1;
    for (let r = 0; r < ROWS; r++) {
      row(r, ROW0 + r * ROW_D, T_SEA + r * ROW_GAP, NROW, CW, CL, PITCH, u => {
        if (u < COAST[r] + (rand() - 0.5) * 0.05) {
          const field = (r === 4 && u > -0.84 && u < -0.5) || (r === 5 && u > -0.62 && u < -0.3) || (r === 3 && u < -0.9);
          return col(field ? fieldC[Math.floor(rand() * 3)] : landC[Math.floor(rand() * 4)], 0.3);
        }
        // deeper far out, his greens to the left of the middle, a paler reach to the right
        const g = Math.exp(-(((u + 0.25) / 0.3) ** 2) - ((r - 2.6) / 1.4) ** 2), lt = Math.exp(-(((u - 0.45) / 0.35) ** 2) - ((r - 3.5) / 1.6) ** 2), q = rand();
        return col(q < g * 0.6 ? '#4f7f80' : q > 1 - lt * 0.45 ? '#6e8ea6' : r < 2 && q < 0.6 ? seaC[Math.floor(rand() * 3)] : seaC[Math.floor(rand() * 5)], 0.42);
      });
    }
    this.nRow = NROW;
    // the jetty: one pale card, askew on the blue
    single({ qb: qe(new Qn(), -0.5, -HALF), w: 0.04, h: 0.17, col: col('#cdb78c', 0.2), off: new V3(0, 0, 0) }, { kind: 'stream', piv: new V3(-0.5, 0.034, 0.33), t0: T_SEA + ROWS * ROW_GAP + 0.3, dur: 0.5, mu: -0.2, arc: 0.72, reach: 0.4, turns: 1, yaw0: -0.5 });
    tick(T_SEA + ROWS * ROW_GAP + 0.8, 0.02, 1800);

    // ---- the village: walls, gables and red roofs, dealt card by card
    this.shadows = [];
    HOUSES.forEach((H, hi) => {
      const y0 = H.y || 0.002, dur = H.slow ? 0.6 : 0.5, C = H.c.map(c => col(c, 0.28)), at = (x, y, z) => new V3(x, y, z).applyAxisAngle(AX.y, H.yaw).add(new V3(H.u, y0, H.z));
      const jit = c => c.clone().multiplyScalar(0.95 + 0.1 * rand());
      const deal = (o, t, wob, extra = {}) => single(o, Object.assign({ kind: 'deal', t0: t, dur, mu: H.u * 0.3 + (rand() - 0.5) * 0.1, turns: (H.slow ? 1.5 : 2) * (hi % 2 ? -1 : 1), wob, wobF: 20 + rand() * 6, wobD: 6.5 }, extra));
      // the walls: back, left, right, front
      const walls = [[0, -H.d / 2, Math.PI, H.w, 2], [-H.w / 2, 0, -HALF, H.d, 3], [H.w / 2, 0, HALF, H.d, 1], [0, H.d / 2, 0, H.w, 0]];
      walls.forEach(([x, z, a, w, ci], k) => {
        const qb = qe(new Qn(), H.yaw + a), g = deal({ qb, off: new V3(0, H.h / 2, 0), w, h: H.h, col: jit(C[ci]) }, H.t + k * 0.06, 0.13, { piv: at(x, 0, z), yaw0: H.yaw + a });
        g.wax.set(1, 0, 0).applyQuaternion(qb); tick(g.t0 + dur, H.slow ? 0.024 : 0.017, H.slow ? 1500 : 2100);
      });
      // the gables: a card set on its corner behind each end wall
      [[H.w / 2 - 0.004, HALF, 1], [-H.w / 2 + 0.004, -HALF, 3]].forEach(([x, a, ci], k) => {
        const post = new M4().makeScale((H.d / 2 - 0.003) / Math.SQRT1_2, (H.rise - 0.004) / Math.SQRT1_2, TH).multiply(new M4().makeRotationZ(Math.PI / 4));
        deal({ qb: qe(new Qn(), H.yaw + a), post, col: jit(C[ci]) }, H.t + 0.24 + k * 0.05, 0, { piv: at(x, H.h, 0), yaw0: H.yaw + a });
      });
      // the roof: two red cards, slapped down
      const sl = Math.hypot(H.d / 2, H.rise) + 0.022, pitch = -Math.atan2(H.d / 2, H.rise);
      [[Math.PI, 5], [0, 4]].forEach(([a, ci], k) => {
        const qb = qe(new Qn(), H.yaw + a, pitch), t = H.t + 0.36 + k * (H.slow ? 0.16 : 0.1);
        const g = deal({ qb, off: new V3(0, -sl / 2, 0.0035), w: H.w + 0.03, h: sl, col: jit(C[ci]) }, t, 0.1, { piv: at(0, H.h + H.rise + 0.003, 0), yaw0: H.yaw + a });
        g.wax.set(1, 0, 0).applyAxisAngle(AX.y, H.yaw);
        // a tile tapped: a short clear note, and the card's own slap
        const f = ROOF[hi][k], tl = t + dur;
        s.note(tl, f, 0.3, { type: 'sine', vol: H.slow ? 0.04 : 0.028, attack: 0.003, over: 3.01, overVol: 0.22 });
        s.hit(tl, { d: 0.04, vol: H.slow ? 0.03 : 0.02, bp: 1300, q: 1.2 });
      });
      if (H.win) for (let k = 0; k < 3; k++) { const g = deal({ qb: qe(new Qn(), H.yaw), w: 0.03, h: 0.04, col: col(k === 1 ? '#8a4a3a' : '#a0604a', 0.2) }, H.t + 0.62 + k * 0.09, 0, { piv: at((k - 0.6) * 0.085, H.h * 0.5, H.d / 2 + 0.004), yaw0: H.yaw, turns: 3 }); tick(g.t0 + dur, 0.012, 3400); }
      if (!H.y) this.shadows.push({ u: H.u, z: H.z, r: Math.max(H.w, H.d) * 0.62, t: H.t + dur });
    });

    // ---- the chimneys: a tall brick stack and the short one that smokes, each four narrow cards, thrown as one
    const stack = (S, cols, turns) => {
      const g = group({ kind: 'baton', piv: new V3(S.u, 0.002, S.z), t0: S.t, dur: S.dur, mu: S.u * 0.4, drop: 0.06, arc: 0.6, reach: 0.5, turns, th0: HALF, bax: AX.z, wob: 0.17, wobF: 8.5, wobD: 2.6 });
      g.cen.set(0, S.H / 2, 0); g.wax.set(0.5, 0, 0.87); g.tEnd = Math.max(S.t + S.dur + 2.2, T_PUFF + 0.2);
      for (let k = 0; k < 4; k++) card(g, { qb: qe(new Qn(), k * HALF + 0.3), rel: new V3(Math.sin(k * HALF + 0.3) * S.s / 2, 0, Math.cos(k * HALF + 0.3) * S.s / 2), off: new V3(0, S.H / 2, 0), w: S.s, h: S.H, col: col(cols[k], 0.25) });
      s.note(S.t + S.dur, 196, 0.16, { type: 'triangle', vol: 0.03, to: 150, attack: 0.004 }); s.hit(S.t + S.dur, { d: 0.05, vol: 0.022, lp: 900 });
      for (let i = 1; i < 4; i++) tick(S.t + S.dur + i * Math.PI / 8.5, 0.012 / i, 1200);       // it rocks: quieter each time
      this.shadows.push({ u: S.u, z: S.z, r: S.s * 1.6, t: S.t + S.dur });
      return g;
    };
    stack(STACK, ['#9a5540', '#7a4436', '#6a3c34', '#8a4c3a'], 1);
    stack(SMOKER, ['#6a554c', '#54443f', '#4c3e3c', '#5e4c46'], 1).rattle = T_PUFF - 0.34;
    for (let i = 0; i < 4; i++) tick(T_PUFF - 0.32 + i * 0.075, 0.012, 1500);
    this.top = new V3(SMOKER.u, SMOKER.H + 0.012, SMOKER.z);

    // ---- the trees: his foliage dealt in a heap, slanting touches turned every way, lighter above and to the right
    // where the sun is, over a dark green block that is the shade inside
    const leafD = ['#3f6f5a', '#4f7f5a', '#47785f'], leafM = ['#5f8f4f', '#6a9a58', '#4f8a5a'], leafL = ['#7fa24f', '#9aae52', '#8aa85a'];
    TREES.forEach(([u, z, size, t], ti) => {
      const R = 0.085 * size, Hh = 0.14 * size, mu = u * 0.35;
      single({ qb: qe(new Qn(), ti * 1.3 + 0.6), post: new M4().makeScale(R * 1.05, Hh * 0.66, R * 1.05), col: col('#3a6a52', 0.3) }, { kind: 'grow', piv: new V3(u, Hh * 0.33 + 0.002, z), t0: t + 0.52, dur: 0.3 });      // (the dark inside of it fills in as the first cards land)
      for (let k = 0; k < 8; k++) {
        // five leaning in round it, their feet on the floor, and three laid over the top, as slates lie on a dome
        const low = k < 5, phi = low ? k * TAU / 5 + ti * 0.9 + (rand() - 0.5) * 0.3 : k * TAU / 3 + ti + (rand() - 0.5) * 0.5, el = low ? 0.42 + rand() * 0.16 : 1.0 + rand() * 0.22;
        const nx = Math.sin(phi) * Math.cos(el), ny = Math.sin(el), nz = Math.cos(phi) * Math.cos(el), sun = nx * 0.5 + ny * 0.6 + nz * 0.25 + (rand() - 0.5) * 0.3;
        const tone = sun > 0.62 ? leafL : sun > 0.2 ? leafM : leafD, t1 = t + 0.14 + k * 0.04, h = (low ? 0.108 + rand() * 0.02 : 0.09 + rand() * 0.02) * size;
        const rr = low ? R * 0.86 : R * 0.42, y = low ? h * 0.5 * Math.cos(el) + 0.005 : Hh * 0.74 + rand() * 0.012 * size;
        single({ qb: qe(new Qn(), phi, -el, (rand() - 0.5) * (low ? 0.36 : 1.4)), w: (0.112 + rand() * 0.02) * size, h, col: col(tone[Math.floor(rand() * 3)], 0.3) },
          { kind: 'deal', piv: new V3(u + Math.sin(phi) * rr, y, z + Math.cos(phi) * rr), t0: t1, dur: 0.45, mu: mu + (rand() - 0.5) * 0.08, turns: k % 2 ? 1.5 : -1.5, yaw0: phi });
        if (k % 2 === 0) s.hit(t1 + 0.45, { d: 0.03, vol: 0.009, hp: 2600 });
      }
      this.shadows.push({ u, z, r: R * 1.35, t: t + 0.5 });
    });

    // ------------------------------------------------------------ one mesh for every card
    const n = cards.length, geo = new THREE.BoxGeometry(1, 1, 1), seed = new Float32Array(n);
    for (let i = 0; i < n; i++) seed[i] = rand();
    geo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seed, 1));
    const mesh = this.mesh = new THREE.InstancedMesh(geo, cardPaint(), n);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.zero = new M4().makeScale(0, 0, 0);
    cards.forEach((c, i) => { mesh.setColorAt(i, c.col); mesh.setMatrixAt(i, this.zero); });
    L.add(mesh, stage);

    // ------------------------------------------------------------ the smoke: soft curled dabs, facing the eye
    const su = { uLit: { value: col('#f4f3ee', 0.1) }, uShade: { value: col('#a9bccb', 0.25) } };
    const sm = new THREE.MeshBasicMaterial({ map: dabTexture(), transparent: true, depthWrite: false, fog: false });
    sm.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, su);
      // (instanceColor carries each dab's own numbers: r how much of it there is, g how white, b its turn on the screen)
      sh.vertexShader = sh.vertexShader.replace('#include <project_vertex>', `
  vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
  {
    float dws = length(modelMatrix[0].xyz), drot = instanceColor.b * 6.2832;
    vec2 dq = position.xy * vec2(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz)) * dws; mvPosition.xy += vec2(cos(drot) * dq.x - sin(drot) * dq.y, sin(drot) * dq.x + cos(drot) * dq.y);
  }
  gl_Position = projectionMatrix * mvPosition;`);
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec3 uLit; uniform vec3 uShade;')
        .replace('#include <color_fragment>', '  diffuseColor.a *= vColor.r; diffuseColor.rgb = mix(uShade, uLit, vColor.g);');
    };
    sm.customProgramCacheKey = () => 'estaque-smoke';
    const smoke = this.smoke = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), sm, SMOKE);
    smoke.instanceMatrix.setUsage(THREE.DynamicDrawUsage); smoke.renderOrder = 6;
    for (let i = 0; i < SMOKE; i++) { smoke.setColorAt(i, T.col.setRGB(0, 1, 0)); smoke.setMatrixAt(i, this.zero); }
    L.add(smoke, stage);
    this.dab = Array.from({ length: SMOKE }, (_, i) => ({ ph: _h(i, 1.7) * TAU, side: _h(i, 4.1) - 0.5, up: _h(i, 6.3) - 0.5, turn: _h(i, 8.9) * TAU, spin: (_h(i, 2.2) - 0.5) * 0.9, big: 0.8 + 0.5 * _h(i, 5.5) }));

    // ------------------------------------------------------------ shadows under what stands on the bare floor
    this.blobs = L.blobs(this.shadows.length, { fade: true });
    for (const b of this.shadows) { const p = L.floor(b.u * SC, b.z * SC - L.wall); b.x = p.x; b.wz = p.z; }

    // ------------------------------------------------------------ the rest of the sound
    s.hit(T_SEA - 0.1, { d: 0.5, vol: 0.012, hp: 2600, attack: 0.2 });                                   // the deck, sprung
    s.hit(T_PUFF, { d: 0.42, vol: 0.03, lp: 850, attack: 0.07 });                                        // the puff
    s.note(T_PUFF + 0.12, 880, 1.6, { type: 'sine', vol: 0.011, attack: 0.3 }); s.note(T_PUFF + 0.5, 1174.66, 1.9, { type: 'sine', vol: 0.008, attack: 0.4 });
    s.loop(RIP0, RIP_EVERY, Array.from({ length: 10 }, (_, i) => ({ t: 0.06 + i * 0.085, noise: true, d: 0.03, vol: 0.006 + 0.003 * (i % 3), bp: 2800, q: 1.2 })));
    s.done();
    this.hold = 0; this.frame = 0; this.hide();
  },

  hide() { this.mesh.visible = false; this.smoke.visible = false; this.blobs.count = 0; this.blobs.visible = false; },

  // Where a group is at build-time c: still in the wall, in the air (out of the slot under the frame, across, and
  // turning to its place), or down (and rocking a little until it is still).
  pose(g, c, calm) {
    const k = (c - g.t0) / g.dur, P = g.P, Q = g.Q;
    g.on = k > 0; if (!g.on) return;
    g.fly = k < 1;
    if (!g.fly) {
      P.copy(g.piv); Q.identity();
      if (g.wob) { const tau = c - g.t0 - g.dur; if (tau < 2.2) Q.setFromAxisAngle(g.wax, g.wob * Math.exp(-tau * g.wobD) * Math.sin(tau * g.wobF)); }
      if (g.rattle) { const tau = c - g.rattle; if (tau > 0 && tau < 0.5) Q.setFromAxisAngle(g.wax, 0.07 * Math.sin(Math.PI * tau / 0.5) * Math.sin(tau * (calm ? 21 : 42))); }      // (something is coming)
      return;
    }
    if (g.kind === 'rise') { P.copy(g.piv); P.z -= 0.14 * (1 - ease.out(k)); Q.identity(); return; }
    if (g.kind === 'grow') { P.copy(g.piv); Q.identity(); return; }
    const a = 0.15, C = this.T.c, zf = this.zFront, y0 = this.railY - g.drop, tx = g.piv.x + g.cen.x, ty = g.piv.y + g.cen.y, tz = g.piv.z + g.cen.z;
    let s = 0;
    if (k < a) C.set(g.mu, y0, -0.12 + (zf + 0.12) * ease.out(k / a));
    else {
      s = (k - a) / (1 - a); const e = 1 - Math.pow(1 - s, g.kind === 'stream' ? 1.25 : 1.5), i = 1 - e;
      const cx = g.mu + (tx - g.mu) * 0.5, cy = Math.max(ty, y0 * g.arc), cz = zf + (tz - zf) * g.reach;
      C.set(i * i * g.mu + 2 * i * e * cx + e * e * tx, i * i * y0 + 2 * i * e * cy + e * e * ty, i * i * zf + 2 * i * e * cz + e * e * tz);
    }
    const spin = calm ? 0.5 : 1;
    if (g.kind === 'baton') Q.setFromAxisAngle(g.bax, (g.th0 + TAU * g.turns * spin) * (1 - ease.smooth(ramp(s, 0.25, 1))));
    else {
      // a dealt card: flat, spinning about its own middle, then turning to stand (or lie) where it lands
      this.qe(Q, g.yaw0 + TAU * g.turns * spin * (1 - s), -HALF + g.flut * Math.sin(s * TAU * 1.5) * (1 - s));
      Q.slerp(g.qh, ease.smooth(ramp(s, 0.6, 1))).multiply(g.qhi);
    }
    P.copy(C).sub(g.cen);
  },

  start(L, resumed) {
    this.sc.from(0); this.hold = 0;
    for (const c of this.cards) c.done = false;
    if (!this.told && !L.quiet) { this.told = true; L.k.say('Cézanne wrote that this view was like a playing card: red roofs against the blue sea.', 4.5); }
  },
  back(L) { this.hold = L.t; if (!L.quiet) L.k.synth.noise(0.7, { vol: 0.014, lp: 2600 }); },
  end() { this.hide(); },
  reset() { this.hide(); this.hold = 0; },

  update(L, dt) {
    const ph = L.phase, showing = ph === 'wake' || ph === 'play';
    if (!showing && ph !== 'return') { this.hide(); return; }
    const T = this.T, calm = L.calm, mesh = this.mesh;
    // c: the dealing's clock (it runs back when the look ends); tp: the smoke's and the ripples' (it goes on)
    const c = showing ? L.t : Math.min(this.hold, T_BUILT) * (1 - ease.inOut(L.ret)), tp = showing ? L.t : this.hold + L.r;
    if (showing) this.sc.play(L.t);
    mesh.visible = true; this.frame++;

    // ---- a ripple along one row of the bay, now and then
    let ripRow = -2, rt = 0, ripDir = 1;
    if (showing && tp > RIP0) {
      const nth = Math.floor((tp - RIP0) / RIP_EVERY); rt = tp - RIP0 - nth * RIP_EVERY;
      if (rt < this.nRow * RIP_STEP + RIP_LEN + 0.1) { ripRow = [2, 4, 1, 3, 0, 5][nth % 6]; ripDir = nth % 2 ? -1 : 1; }
    }
    const ripA = calm ? 0.2 : 0.38, ripLen = calm ? RIP_LEN * 1.6 : RIP_LEN;

    // ---- the cards
    let dirty = false;
    for (const cd of this.cards) {
      const g = cd.g, rip = cd.row === ripRow;
      if (cd.done && c >= g.tEnd && !rip) continue;
      dirty = true;
      if (g.stamp !== this.frame) { g.stamp = this.frame; this.pose(g, c, calm); }
      cd.done = c >= g.tEnd && !rip;
      if (!g.on) { mesh.setMatrixAt(cd.i, this.zero); continue; }
      let ang = cd.ang;
      if (cd.fan) ang = cd.ang0 + (ang - cd.ang0) * ease.outBack(ramp(c, g.open + cd.lag, g.open + cd.lag + g.openD));
      if (rip) { const k = (rt - (ripDir > 0 ? cd.j : this.nRow - 1 - cd.j) * RIP_STEP) / ripLen; if (k > 0 && k < 1) ang += Math.sign(cd.ang) * ripA * Math.sin(Math.PI * k) ** 2; }
      const q = T.q.copy(cd.qb); if (cd.ax) q.multiply(T.q2.setFromAxisAngle(cd.ax, ang));
      const p = T.v.copy(cd.off).applyQuaternion(q).add(cd.rel);
      if (g.fly) p.sub(g.cen).applyQuaternion(g.Q).add(g.cen); else p.applyQuaternion(g.Q);
      p.add(g.P); q.premultiply(g.Q);
      mesh.setMatrixAt(cd.i, T.m.compose(p, q, g.kind === 'grow' && g.fly ? T.w.setScalar(ease.out((c - g.t0) / g.dur)) : T.one).multiply(cd.post));
    }
    if (dirty) mesh.instanceMatrix.needsUpdate = true;

    // ---- the shadows
    const B = this.blobs; B.visible = true; B.count = this.shadows.length;
    this.shadows.forEach((b, i) => B.set(i, b.x, b.wz, b.r * SC, 0.62 * ramp(c, b.t - 0.12, b.t + 0.1)));

    // ---- the smoke: dabs given off one after another, each rising a little, leaning away to the left over the bay,
    // opening and thinning as it goes, as his plume does
    const sm = this.smoke, ts = tp - T_PUFF, gone = showing ? 0 : ease.smooth(ramp(L.ret, 0, 0.42)), stop = showing ? Infinity : this.hold - T_PUFF;
    sm.visible = ts > 0 && gone < 1;
    if (sm.visible) {
      for (let i = 0; i < SMOKE; i++) {
        const d = this.dab[i], first = i * LIFE / SMOKE;
        let born = -1; if (ts >= first) born = first + Math.floor((ts - first) / LIFE) * LIFE;      // when this dab last left the chimney
        if (born > stop) born -= LIFE;                                                                // (none given off once the look has ended)
        const age = ts - born, k = age / LIFE;
        if (born < 0 || k >= 1) { sm.setMatrixAt(i, this.zero); continue; }
        const lean = 0.85 + 0.3 * Math.sin(born * 0.7 + 1), puff = born < 0.05 ? 1.5 : 1;       // the wind eases and freshens; the first puff is the biggest
        const x = this.top.x - 0.165 * age * lean + d.side * 0.02 * age + 0.012 * Math.sin(age * 2.3 + d.ph) * age;
        const y = this.top.y + 0.045 * (1 - Math.exp(-age * 2.6)) + 0.042 * age * (1.1 - 0.25 * lean) + d.up * 0.028 * age;
        const z = this.top.z - 0.07 * age + d.side * 0.03 * age;
        const size = (0.036 + 0.04 * age) * d.big * puff;
        const al = ramp(age, 0, 0.14) * (1 - ease.smooth(ramp(k, 0.4, 1))) * (0.9 - 0.4 * k) * (1 - gone);
        sm.setMatrixAt(i, T.m.compose(T.v.set(x, y, z), T.q.identity(), T.w.set(size * 1.45, size * 0.85, 1)));
        const turn = (TAU - 0.3 + (d.turn - Math.PI) * 0.22 + d.spin * age * (calm ? 0.5 : 1)) / TAU;
        sm.setColorAt(i, T.col.setRGB(al, 1 - 0.55 * k - 0.25 * (d.up < -0.2 ? 1 : 0), turn - Math.floor(turn)));
      }
      sm.instanceMatrix.needsUpdate = true; sm.instanceColor.needsUpdate = true;
    }
    L.voice().place();
  },
});
