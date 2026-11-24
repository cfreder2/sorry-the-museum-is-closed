// Hubert Robert, The Fountains (1787-88), Gallery 218. The word: pour.
//
// One of four great canvases of ruins he painted to be set into the panelling of a salon at the chateau of Mereville,
// so that the wall opened on another space. The museum says the ruins themselves are its subject, and gives Diderot's
// line for them: "Everything vanishes, everything dies, only time endures." What still moves in his dead city is in
// the title. Under each of the two great statue bases a pair of dark bronze masks pours a thin stream into a round
// stone basin, as it has for two thousand years (the right-hand basin runs over, by a hole low in its wall, into a
// shallow pool on the ground); and from behind the far arch the late sun pours down the great stair towards us, gold
// on the treads, the risers left dark. Water and light: both pour, and that is the show.
//
// Look at it and the foot of his picture comes out of the wall under the frame, toy-sized, stone on stone: the stair
// runs out like a drawer of slabs, each one stopping a little further on than the one above, a fallen block shoved
// along in front of it, which slides on and turns when the stair stops; the two statue bases glide out either side
// with their basins before them, and their upper stones after (the bases stand empty: the statues stay in the picture,
// above them); a column drum rolls out beyond the right-hand base and rocks to rest. Dust. It is all in shade, and
// dry. A drop swells on the lip of a mask and falls into the dry stone, and another. Then the sun finds the top of the
// stair and comes down it tread by tread, a long round-headed tongue of light through an arch we cannot see, out over
// his ground; and as it reaches the left-hand fountain the pipes cough and the masks give their water: a sputter, then
// two bright streams, lit from behind against the dark stone. A little after, the pair in the shade on the right. The
// basins fill, rings going out from where the streams land, the sun glittering on the lit one and motes turning in the
// beam; the right-hand one comes up to its hole and a thread of water goes over into the pool; and green comes up in
// the joints of the stair and round the fallen stones, as it has all over his arch. While you keep looking the water
// runs. When you stop, the masks run dry, the light goes back up the stair, and the stones slide home into the wall.
//
// How it is made: three draw calls. The stone is one rig (every slab, block, basin and mask; his surface is smooth
// glazes, so each stone is a tint over a soft painted texture of close greys, and the courses and joints, the stains
// under the masks and the light are worked out in its shader: the sun really falls on the treads and leaves the
// risers). His ground, the water in the basins and the pool, and the light on them are one flat mesh with one shader.
// The streams, the drops, the dust, the motes and the leaves are soft quads in one instanced mesh. Nothing is solid and
// nothing stays out after the look. All of it stands under 0.61 m and within 1.1 m of the wall: from none of the
// check's cameras does any of it come in front of a canvas, so the guard has nothing to cut. (A glass case stands
// 2.4 m out from this wall and the look camera has to stand between the two, so the top of this very tall canvas is
// out of the view; the foot of it, which the show answers stone for stone, is there above it.) With "Reduce motion
// and flashing" on, the glitter on the water is a steady sheen, the spray does not flicker, the leaves and the
// water's own light move at half speed, and the stones land quietly.
//
// What it does not do: nobody comes out of the picture (not the women drawing water, the men resting on the stones,
// the people on the stair or the groom with the horses: they are Roman townspeople painted by a French visitor, and
// are there, the museum says, only to give the scale), and the two horse tamers on the statue bases are not built in
// any form, because they are gods of the old city and unclothed; there is no tune, because a ruin has none, only water.
import * as THREE from 'three';
import { lifeFor, ease, ramp, clamp01, lerp, canvasTexture, rng } from '../paintlife.js';
import { score } from './stagecraft.js';

const TAU = Math.PI * 2;
// Everything below is in the scene's own metres: x along the wall (to the right), y up from the floor, z out from the
// wall's own face.
const NSTEP = 10, RISE = 0.04, TREAD = 0.058, LAND = 0.1;         // the stair: the top slab is the landing
const ST = { x0: -0.5, x1: 0.48 };
const stepTop = k => (NSTEP - k) * RISE, stepFront = k => LAND + k * TREAD;
const FMAX = stepFront(NSTEP - 1);
const PED = [{ cx: -0.77 }, { cx: 0.75 }], PHW = 0.27;             // the two statue bases: their middles, half their width
const LOW = { h: 0.36, d: 0.27 }, DIE = { y1: 0.578, in: 0.05, d: 0.225 }, CAP = 0.603;
const BASIN = { z: 0.485, R: 0.232, rim: 0.17, floor: 0.058, r0: 0.172, r1: 0.199, full: 0.143 };
const MASK = { y: 0.272, dx: 0.115 }, MOUTH = { y: 0.244, z: LOW.d + 0.034 };
// The right-hand basin runs over, as his does, by a hole low in its wall into a shallow round pool on the ground.
const SPOUT = { a: -0.5, y: 0.104, r: 0.207, v: 0.22 }, POOL = { x: 0.62, z: 0.762, R: 0.118, r: 0.097, y: 0.021 };
const G = 9.8, SPX = PED[1].cx + Math.sin(SPOUT.a) * SPOUT.r, SPZ = BASIN.z + Math.cos(SPOUT.a) * SPOUT.r, TFO = Math.sqrt(2 * (SPOUT.y - POOL.y) / G);      // (TFO: that thread's fall)
const TRAIN = [BASIN.z + BASIN.R + 0.004, POOL.z + POOL.R + 0.004];   // a base and what stands before it, front to back
const SLAB = { x: 0.12, y: 0.04, z: 0.8, yaw: 0.36, w: 0.27, h: 0.08, d: 0.15 };
const DRUM = { x: 1.2, r: 0.065, len: 0.18, z: 0.4, t: [0.95, 2.35] };
// The story, in show seconds.
const T_STAIR = [0.12, 1.12], T_FOUNT = [[0.28, 1.22], [0.5, 1.46]], T_DIE = [[0.92, 1.5], [1.1, 1.7]];
const HOME = 1.75;                                                // the stones are all out (the drum rolls on): the building rewinds from here when the look ends
const T_SUN = [1.95, 4.5];                                         // the light: from the top of the stair to the floor in front
const T_ON = [3.3, 3.52, 4.35, 4.55];                              // the four masks give their water (two left, two right)
const PRE = [[0, 1.75], [1, 2.25], [0, 2.7], [2, 3.3], [3, 3.8]];  // the drops before it: [mask, when it lets go]
const T_GREEN = 4.7;
const VY0 = 0.1, TF = 0.186;                                       // a stream: how it leaves the lip, and its longest fall
// The sun: its rays run down and out of the wall and a little to the left: x + KX z and y + KY z are the same all along
// a ray, so a point is lit if that pair falls inside the arch the light comes through.
const KX = 0.7, KY = 1.3, SOFT = 0.05;
const ARCH = { xc: -0.47, w: 0.92, head: 0.3, s0: 0.3, s1: 1.16 };  // its middle, half width, the round head; the springing, from and to
const SUN_L = new THREE.Vector3(KX, KY, -1).normalize();           // towards the sun
const N_ST = 14, N_SPL = 3, N_HOP = 3, N_DUSTC = 24, N_MOTE = 10, N_OV = 7;
const _h = (a, b = 0) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };
const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
// A heavy thing sliding out: it gets going, runs steadily and settles.
const travel = q => { q = clamp01(q); return 0.5 * q + 0.5 * q * q * (3 - 2 * q); };
const smooth = (a, b, x) => { const q = clamp01((x - a) / (b - a)); return q * q * (3 - 2 * q); };

const SUN_GLSL = /* glsl */`
uniform vec4 uArch; uniform vec4 uSunK; uniform vec3 uO; uniform vec4 uAx;
// (a point of the scene: is it in the light that comes through the arch?)
float sunAt(vec3 p) {
  float qx = p.x + uSunK.x * p.z, qy = p.y + uSunK.y * p.z, dx = (qx - uArch.x) / uArch.y;
  float head = uArch.z + uArch.w * sqrt(max(0.0, 1.0 - dx * dx));
  return smoothstep(0.0, uSunK.z, (1.0 - abs(dx)) * uArch.y) * smoothstep(0.0, uSunK.z * 1.6, head - qy) * uSunK.w;
}
float h1(float x) { return fract(sin(x * 127.1) * 43758.5453); }
`;

// ---------------------------------------------------------------- stone, as geometry
// A part is one piece of the rig (it moves as one): positions, normals, a tint for each vertex and what it is made of
// (0 a slab of the stair or a fallen stone, 1 coursed masonry, 2 bronze, 3 the basin).
const part = () => ({ pos: [], nor: [], col: [], mat: [], n: 0 });
const _a = V3(), _b = V3(), _n = V3(), _v = V3(), _w = V3();
function tri(P, a, b, c, ca, cb, cc, m) {
  _n.crossVectors(_a.subVectors(b, a), _b.subVectors(c, a)).normalize();
  for (const [v, k] of [[a, ca], [b, cb], [c, cc]]) { P.pos.push(v.x, v.y, v.z); P.nor.push(_n.x, _n.y, _n.z); P.col.push(k.r, k.g, k.b); P.mat.push(m); }
  P.n += 3;
}
// (a, b, c, d go round anticlockwise seen from outside)
function quad(P, a, b, c, d, ca, cb, cc, cd, m) { tri(P, a, b, c, ca, cb, cc, m); tri(P, a, c, d, ca, cc, cd, m); }
function box(P, x0, x1, y0, y1, z0, z1, c, m, faces = 'xXYZ') {
  const q = (a, b, cc, d) => quad(P, a, b, cc, d, c, c, c, c, m);
  if (faces.includes('Z')) q(V3(x0, y0, z1), V3(x1, y0, z1), V3(x1, y1, z1), V3(x0, y1, z1));
  if (faces.includes('z')) q(V3(x1, y0, z0), V3(x0, y0, z0), V3(x0, y1, z0), V3(x1, y1, z0));
  if (faces.includes('X')) q(V3(x1, y0, z1), V3(x1, y0, z0), V3(x1, y1, z0), V3(x1, y1, z1));
  if (faces.includes('x')) q(V3(x0, y0, z0), V3(x0, y0, z1), V3(x0, y1, z1), V3(x0, y1, z0));
  if (faces.includes('Y')) q(V3(x0, y1, z1), V3(x1, y1, z1), V3(x1, y1, z0), V3(x0, y1, z0));
  if (faces.includes('y')) q(V3(x0, y0, z0), V3(x1, y0, z0), V3(x1, y0, z1), V3(x0, y0, z1));
}
// Any three.js geometry, with its own (smooth) normals; paint(v, n) may give each vertex its tint.
const _c = new THREE.Color();
function solid(P, g, c, m, paint = null) {
  g = g.index ? g.toNonIndexed() : g;
  const p = g.attributes.position, n = g.attributes.normal;
  for (let i = 0; i < p.count; i++) {
    _v.fromBufferAttribute(p, i); _w.fromBufferAttribute(n, i);
    const k = paint ? paint(_v, _w) : c;
    P.pos.push(_v.x, _v.y, _v.z); P.nor.push(_w.x, _w.y, _w.z); P.col.push(k.r, k.g, k.b); P.mat.push(m);
  }
  P.n += p.count;
}

// His surface: smooth glazes, one soft tone run into the next, no stroke standing up. A texture that wraps: `n` soft
// patches of close colours over a base (some drawn out level, as a broad soft brush leaves them), a scatter of small
// pits and lights; and in its alpha a slow cloud of its own (0 to 1), for breaking an edge or a stain softly.
function glaze({ size = 512, seed = 1, base = '#888888', colors = [['#999999', 1]], n = 240, rad = [28, 100], alpha = [0.1, 0.22], speck = 420, drag = 0.5 } = {}) {
  const W = size, rand = rng(seed), mk = () => { const c = document.createElement('canvas'); c.width = c.height = W; return c; };
  const cv = mk(), g = cv.getContext('2d', { willReadFrequently: true }), iv = mk(), gi = iv.getContext('2d', { willReadFrequently: true });
  g.fillStyle = base; g.fillRect(0, 0, W, W); gi.fillStyle = 'rgb(128,128,128)'; gi.fillRect(0, 0, W, W);
  const rgb = h => `${parseInt(h.slice(1, 3), 16)},${parseInt(h.slice(3, 5), 16)},${parseInt(h.slice(5, 7), 16)}`;
  let total = 0; for (const c of colors) total += c[1];
  const pick = () => { let r = rand() * total; for (const c of colors) if ((r -= c[1]) <= 0) return c[0]; return colors[0][0]; };
  const blob = (ctx, x, y, rx, ry, rot, c, a) => {
    for (const ox of [-W, 0, W]) for (const oy of [-W, 0, W]) {
      if (x + ox < -rx || x + ox > W + rx || y + oy < -rx || y + oy > W + rx) continue;
      ctx.save(); ctx.translate(x + ox, y + oy); ctx.rotate(rot); ctx.scale(1, ry / rx);
      const q = ctx.createRadialGradient(0, 0, 0, 0, 0, rx); q.addColorStop(0, `rgba(${c},${a})`); q.addColorStop(0.5, `rgba(${c},${a * 0.6})`); q.addColorStop(1, `rgba(${c},0)`);
      ctx.fillStyle = q; ctx.fillRect(-rx, -rx, rx * 2, rx * 2); ctx.restore();
    }
  };
  for (let i = 0; i < n; i++) {
    const r = rad[0] + rand() * (rad[1] - rad[0]), long = rand() < drag, a = alpha[0] + rand() * (alpha[1] - alpha[0]);
    blob(g, rand() * W, rand() * W, long ? r * 1.9 : r, long ? r * 0.34 : r * (0.6 + 0.4 * rand()), (rand() - 0.5) * 0.4, rgb(pick()), a);
    const v = rand() < 0.5 ? 245 : 10; blob(gi, rand() * W, rand() * W, r * 1.1, r * (0.5 + 0.5 * rand()), rand() * 3, `${v},${v},${v}`, 0.34);
  }
  for (let i = 0; i < speck; i++) { const r = 2 + rand() * 5, v = rand() < 0.6 ? '40,34,26' : '225,215,195'; blob(g, rand() * W, rand() * W, r, r * (0.5 + 0.5 * rand()), rand() * 3, v, 0.07 + 0.13 * rand()); }
  const c = g.getImageData(0, 0, W, W).data, d = gi.getImageData(0, 0, W, W).data, out = new Uint8Array(W * W * 4);
  for (let i = 0; i < W * W * 4; i += 4) { out[i] = c[i]; out[i + 1] = c[i + 1]; out[i + 2] = c[i + 2]; out[i + 3] = d[i]; }
  const t = new THREE.DataTexture(out, W, W, THREE.RGBAFormat);
  t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.flipY = false;
  t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter; t.anisotropy = 4; t.needsUpdate = true;
  return t;
}

lifeFor(57051, {
  title: /^The Fountains/,
  word: 'pour',
  // (the look camera stands between the wall and the glass case in front of it; see the header)
  stage: { out: 1.15, half: 1.3, cam: { dist: 2.1, side: 0.3, height: 0.95, fov: 62, lookU: -0.04, lookOut: 0.42, lookH: 0.68 } },
  wake: 2, ret: 2.4,

  build(L) {
    const P = L.pal, col = (h, a = 0.16) => P.near(h, a), R = () => L.rand();
    this.O = L.floor(0, -L.wall);
    this.B = new THREE.Matrix4().makeBasis(V3(L.tx, 0, L.tz), V3(0, 1, 0), V3(L.nx, 0, L.nz)).setPosition(this.O);
    this.V = { m: new THREE.Matrix4(), a: new THREE.Matrix4(), q: new THREE.Quaternion(), e: new THREE.Euler(0, 0, 0, 'YXZ'), v: V3(), s: V3(1, 1, 1) };
    // the light, shared by all three shaders
    this.sun = { uArch: { value: new THREE.Vector4(ARCH.xc, ARCH.w, ARCH.s0, ARCH.head) }, uSunK: { value: new THREE.Vector4(KX, KY, SOFT, 0) },
      uO: { value: this.O.clone() }, uAx: { value: new THREE.Vector4(L.tx, L.tz, L.nx, L.nz) } };
    // the water, shared by the stone and the floor: each basin's middle (x, z now), its level, how much sun plays on it;
    // and where each stream lands (x, z, how hard, how far the wet has spread)
    this.wu = { uBasin: { value: [new THREE.Vector4(PED[0].cx, BASIN.z, BASIN.floor, 0), new THREE.Vector4(PED[1].cx, BASIN.z, BASIN.floor, 0)] },
      uHit: { value: Array.from({ length: 4 }, () => new THREE.Vector4(0, 0, 0, 0)) }, uTime: { value: 0 } };

    this.buildStone(L, col, R);
    this.buildFloor(L, col);
    this.buildCards(L, col, R);
    this.tOver = T_ON[2]; this.hold = Infinity; while (this.tOver < T_ON[2] + 4 && this.level(1, this.tOver) < SPOUT.y + 0.006) this.tOver += 0.02;
    this.band = this.makeScore(L);
    this.hiss = L.voice().loop({ lp: 5200, hp: 1500 });      // the streams on stone, and on water
    this.deep = L.voice().loop({ lp: 640, hp: 150 });        // the basins filling
    this.hold = Infinity; this.hide();
  },

  // ---------------------------------------------------------------- the stone: stair, bases, basins, masks, fallen blocks
  buildStone(L, col, R) {
    // his stone: tints laid over a painted texture of close greys (the glaze), so a slab is never one flat colour
    const TREADC = col('#8f7c5c'), RUST = col('#6b5846'), OCHRE = col('#7c6a4e'), LEDGE = col('#8a785a'), BOWL = col('#6c5644'), BOWLIN = col('#54463a'),
      RIMC = col('#96805c'), GREY = col('#7d776a'), DARK = col('#786a56'), BRONZE = col('#4a4230', 0.1), BRONZED = col('#17140e', 0.05), VERD = col('#55604a', 0.1);
    const shade = (c, k) => c.clone().multiplyScalar(k);

    // ---- the stair: ten slabs, each of several stones, their edges worn and their joints dark
    const steps = [];
    for (let k = 0; k < NSTEP; k++) {
      const S = part(), y1 = stepTop(k), y0 = y1 - RISE, z1 = stepFront(k), zi = k ? stepFront(k - 1) - 0.004 : 0;
      let x = ST.x0;
      while (x < ST.x1 - 1e-4) {
        let xe = Math.min(ST.x1, x + 0.15 + 0.2 * R()); if (ST.x1 - xe < 0.09) xe = ST.x1;
        // (the lower right of his stair is broken: stones there sit back, chipped)
        const broke = k >= 6 && x > 0.05 ? R() : 0, chip = broke > 0.45 ? 0.006 + 0.012 * R() : 0;
        const zf = z1 + (R() - 0.5) * 0.005 - chip, yt = y1 - R() * 0.003 - chip * 0.25, bev = 0.004 + 0.005 * R() + chip * 0.7;
        const c = shade(TREADC, 0.92 + 0.16 * R()).lerp(GREY, 0.2 * R()), cj = shade(c, 0.7), ci = shade(c, 0.62), cji = shade(cj, 0.62), e = 0.003;
        for (const [xa, xb, ca, cb, cai, cbi] of [[x, x + e, cj, c, cji, ci], [x + e, xe - e, c, c, ci, ci], [xe - e, xe, c, cj, ci, cji]]) {
          // the tread (darker where the next riser stands on it), the worn edge, the riser
          quad(S, V3(xa, yt, zf - bev), V3(xb, yt, zf - bev), V3(xb, yt, zi), V3(xa, yt, zi), ca, cb, cbi, cai, 0);
          quad(S, V3(xa, yt - bev, zf), V3(xb, yt - bev, zf), V3(xb, yt, zf - bev), V3(xa, yt, zf - bev), ca, cb, cb, ca, 0);
          quad(S, V3(xa, y0, zf), V3(xb, y0, zf), V3(xb, yt - bev, zf), V3(xa, yt - bev, zf), ca, cb, cb, ca, 0);
        }
        x = xe;
      }
      box(S, ST.x0, ST.x1, y0, y1 - 0.003, 0, z1 - 0.004, shade(TREADC, 0.8), 0, 'xX');
      steps.push(S);
    }

    // ---- a statue base, its two masks and its basin, as one train; and the upper die, which comes out after it
    const fount = [], upper = [];
    this.masks = [];
    for (const [i, pd] of PED.entries()) {
      const F = part(), x0 = pd.cx - PHW, x1 = pd.cx + PHW;
      box(F, x0, x1, 0, LOW.h, 0, LOW.d, RUST, 1, 'xXZ');
      // (its ledge, level with the head of the stair: two small courses, the upper one standing out)
      box(F, x0 - 0.008, x1 + 0.008, LOW.h, LOW.h + 0.016, 0, LOW.d + 0.008, shade(LEDGE, 0.86), 0, 'xXYZ');
      box(F, x0 - 0.02, x1 + 0.02, LOW.h + 0.016, LOW.h + 0.04, 0, LOW.d + 0.02, LEDGE, 0, 'xXYZy');
      for (const sx of [-1, 1]) { const mx = pd.cx + sx * MASK.dx; this.masks.push(new THREE.Vector2(mx, MASK.y)); this.mask(F, mx, MASK.y, LOW.d, BRONZE, BRONZED, VERD); }
      this.basin(F, pd.cx, BASIN.z, BOWL, BOWLIN, RIMC);
      if (i === 1) {
        // (the hole it runs over by, a worn lip under it; and the pool: a low ring of his pale stone)
        const lip = (dy, r, k) => { const g = new THREE.SphereGeometry(1, 8, 6); g.scale(r, r * 0.7, r); g.translate(SPX, SPOUT.y + dy, SPZ); solid(F, g, k, 3, (v, n) => _c.copy(k).multiplyScalar(0.75 + 0.4 * clamp01(n.y))); };
        lip(0.002, 0.01, BRONZED); lip(-0.01, 0.011, BOWL);
        const g = new THREE.LatheGeometry([[POOL.R - 0.004, 0], [POOL.R, 0.01], [POOL.R - 0.002, 0.028], [POOL.R - 0.01, 0.034], [POOL.r + 0.003, 0.03], [POOL.r, 0.02], [POOL.r - 0.004, 0.012], [0.0001, 0.011]].map(([r, y]) => new THREE.Vector2(r, y)), 26);
        g.translate(POOL.x, 0, POOL.z);
        solid(F, g, GREY, 3, (v, n) => { const r = Math.hypot(v.x - POOL.x, v.z - POOL.z); return _c.copy(r < POOL.r + 0.002 ? BOWLIN : RIMC).lerp(GREY, 0.45).multiplyScalar(r < POOL.r + 0.002 ? 0.8 : 0.8 + 6 * Math.min(v.y, 0.034)); });
      }
      fount.push(F);
      const U = part(), u0 = x0 + DIE.in, u1 = x1 - DIE.in;
      box(U, u0, u1, LOW.h + 0.04, DIE.y1, 0, DIE.d, OCHRE, 1, 'xXZ');
      box(U, u0 - 0.012, u1 + 0.012, DIE.y1, CAP, 0, DIE.d + 0.012, shade(LEDGE, 0.95), 0, 'xXYZy');
      upper.push(U);
    }

    // ---- the fallen block (in its own frame: it slides and turns) and the column drum (it rolls)
    const slab = part(), sw = SLAB.w / 2, sh = SLAB.h / 2, sd = SLAB.d / 2, bv = 0.012;
    box(slab, -sw, sw, -sh, sh - bv, -sd, sd, DARK, 0, 'xXZz');
    box(slab, -sw + bv, sw - bv, sh - bv, sh, -sd + bv, sd - bv, shade(DARK, 1.12), 0, 'Y');
    for (const [ax, s] of [['x', -1], ['x', 1], ['z', -1], ['z', 1]]) {      // (its worn top edges)
      const lo = ax === 'x' ? [V3(s * sw, sh - bv, -s * sd), V3(s * sw, sh - bv, s * sd), V3(s * (sw - bv), sh, s * (sd - bv)), V3(s * (sw - bv), sh, -s * (sd - bv))]
        : [V3(s * sw, sh - bv, s * sd), V3(-s * sw, sh - bv, s * sd), V3(-s * (sw - bv), sh, s * (sd - bv)), V3(s * (sw - bv), sh, s * (sd - bv))];
      quad(slab, lo[0], lo[1], lo[2], lo[3], DARK, DARK, DARK, DARK, 0);
    }
    const drum = part(), dl = DRUM.len / 2, dr = DRUM.r;
    {
      const g = new THREE.LatheGeometry([[0, -dl], [dr - 0.012, -dl], [dr - 0.003, -dl + 0.004], [dr, -dl + 0.012], [dr, dl - 0.012], [dr - 0.003, dl - 0.004], [dr - 0.012, dl], [0, dl]].map(([r, y]) => new THREE.Vector2(Math.max(1e-4, r), y)), 26);
      g.rotateZ(Math.PI / 2);
      solid(drum, g, GREY, 0, (v, n) => _c.copy(TREADC).lerp(GREY, 0.5).multiplyScalar(Math.abs(n.x) > 0.5 ? 0.82 : 0.92 + 0.14 * _h(Math.round(Math.atan2(v.z, v.y) * 5), 3)));
    }

    // ---- the rig
    const parts = { fountL: fount[0], fountR: fount[1], upL: upper[0], upR: upper[1], slab, drum };
    steps.forEach((S, k) => { parts['step' + k] = S; });
    let total = 0; for (const p of Object.values(parts)) total += p.n;
    const su = this.su = { tStone: { value: this.stoneTexture() }, uMask: { value: this.masks }, uFlow: { value: [0, 0, 0, 0] }, uL: { value: SUN_L },
      cLo: { value: new THREE.Color(0.31, 0.29, 0.29) }, cHi: { value: new THREE.Color(0.54, 0.52, 0.52) }, cSun: { value: new THREE.Color(2.35, 1.86, 1.2) },
      cBounce: { value: new THREE.Color(0.6, 0.44, 0.27) }, cCaus: { value: new THREE.Color(0.3, 0.24, 0.14) }, uSplit: { value: new THREE.Vector2(0.22, 0.56) } };
    const sm = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0, emissive: 0xffffff, emissiveIntensity: 1 });
    sm.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, su, this.sun, this.wu);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float aMat; varying vec3 vRest; varying vec3 vRestN; varying float vMat;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\n  vRest = position; vRestN = normal; vMat = aMat;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
uniform sampler2D tStone; uniform vec2 uMask[4]; uniform float uFlow[4]; uniform vec3 uL, cLo, cHi, cSun, cBounce, cCaus; uniform vec2 uSplit;
uniform vec4 uBasin[2]; uniform float uTime;
varying vec3 vRest; varying vec3 vRestN; varying float vMat;
${SUN_GLSL}`)
        .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
{
  // where this is in the scene, and which way it faces there
  vec3 wn = inverseTransformDirection(normal, viewMatrix); vec2 lq = lifeP.xz - uO.xz;
  vec3 p = vec3(dot(lq, uAx.xy), lifeP.y - uO.y, dot(lq, uAx.zw)), n = vec3(dot(wn.xz, uAx.xy), wn.y, dot(wn.xz, uAx.zw));
  vec3 rn = normalize(vRestN), an = abs(rn);
  vec2 uv = an.y > 0.62 ? vRest.xz : (an.x > an.z ? vRest.zy : vRest.xy);
  if (vMat > 2.5) { vec2 bc = vec2(vRest.x < 0.0 ? ${PED[0].cx.toFixed(3)} : ${PED[1].cx.toFixed(3)}, ${BASIN.z.toFixed(3)}); vec2 bd = vRest.xz - bc; uv = an.y > 0.8 ? vRest.xz : vec2(atan(bd.x, bd.y) * 0.21, vRest.y); }
  vec4 tx = texture2D(tStone, uv * 1.9);
  vec3 alb = vColor.rgb * tx.rgb * 3.5;
  float up = 1.0 - smoothstep(0.4, 0.7, an.y);
  if (vMat > 0.5 && vMat < 1.5) {
    // coursed masonry: the beds, the joints broken from course to course, each block a little its own colour
    float along = an.x > an.z ? vRest.z : vRest.x, row = floor(vRest.y / 0.12), fy = fract(vRest.y / 0.12);
    float bl = 0.27 + 0.16 * h1(row * 3.1 + 0.5), cx = along / bl + h1(row * 7.7), fx = fract(cx);
    float j = max(1.0 - smoothstep(0.0, 0.028, min(fy, 1.0 - fy)), 1.0 - smoothstep(0.0, 0.009, min(fx, 1.0 - fx)));
    alb *= mix(1.0, 0.88 + 0.24 * h1(row * 13.0 + floor(cx) * 5.3), up) * (1.0 - 0.36 * j * up * (0.5 + tx.a));
    alb *= mix(0.7, 1.0, smoothstep(0.0, 0.11, vRest.y));
    // the long dark stains under the masks, wetter once the water runs
    for (int i = 0; i < 4; i++) {
      float below = uMask[i].y - 0.02 - vRest.y, dx = (vRest.x - uMask[i].x) / (0.02 + 0.07 * max(below, 0.0));
      float s = exp(-dx * dx) * smoothstep(0.0, 0.03, below) * step(0.5, rn.z) * (0.5 + 0.9 * tx.a);
      alb = mix(alb, alb * vec3(0.4, 0.47, 0.36), clamp(s * (0.45 + 0.4 * uFlow[i]), 0.0, 0.85));
    }
  } else if (vMat > 1.5 && vMat < 2.5) alb = vColor.rgb * (0.85 + 0.3 * tx.a);
  // his light: shade from the sky above, the sun where it comes through the arch (from behind: on what faces up or
  // right, never on what faces us), and its warmth thrown back up off the lit ground
  float sun = sunAt(p), ndl = max(dot(n, uL), 0.0);
  float bnc = sunAt(vec3(p.x, 0.0, p.z + 0.2)) * max(n.z, 0.0) * (1.0 - smoothstep(0.0, 0.6, p.y));
  vec3 C = alb * (mix(cLo, cHi, 0.5 + 0.5 * n.y) + cSun * sun * ndl + cBounce * bnc);
  // and light off the moving water, on the stone over a basin the sun is on
  for (int i = 0; i < 2; i++) {
    vec2 dq = p.xz - uBasin[i].xy; float lv = uBasin[i].z;
    float k = exp(-dot(dq, dq) / 0.05) * smoothstep(lv, lv + 0.02, p.y) * (1.0 - smoothstep(lv + 0.06, lv + 0.2, p.y)) * uBasin[i].w;
    if (k > 0.004) C += cCaus * smoothstep(0.16, 0.42, texture2D(tStone, vec2(p.x + p.z * 0.6, p.y * 0.8) * 2.6 + uTime * vec2(0.05, 0.12)).a * texture2D(tStone, vec2(p.x - p.z * 0.4, p.y) * 3.7 - uTime * vec2(0.08, 0.05)).a) * k * (0.35 + 0.65 * abs(n.z));
  }
  diffuseColor.rgb = C * uSplit.x; totalEmissiveRadiance = C * uSplit.y;
}`);
    };
    sm.customProgramCacheKey = () => 'robert-stone';
    const rig = this.rig = L.rig(Object.keys(parts).length + 1, total + 64, sm);
    this.I = {};
    for (const [name, p] of Object.entries(parts)) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(p.pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(p.nor, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(p.col, 3)); g.setAttribute('aMat', new THREE.Float32BufferAttribute(p.mat, 1));
      this.I[name] = rig.add(rig.geo(g)); rig.mat(this.I[name], this.B);
      p.pos = p.nor = p.col = p.mat = null;
    }
    // when each stone stops (for the sounds and the dust): the slabs of the stair, the two fountains, the two dies
    const stopAt = (T, frac) => { let a = 0, b = 1; for (let i = 0; i < 24; i++) { const m = (a + b) / 2; if (travel(m) < frac) a = m; else b = m; } return T[0] + (T[1] - T[0]) * b; };
    this.stops = { step: Array.from({ length: NSTEP }, (_, k) => stopAt(T_STAIR, (stepFront(k) + 0.03) / (FMAX + 0.03))), fount: T_FOUNT.map(T => T[1]), die: T_DIE.map(T => T[1]) };
  },

  // A lion's mask in dark bronze, the water's way out under its jaw: soft bosses, nothing sharp.
  mask(F, x, y, z, c, dark, verd) {
    const paint = k => (v, n) => _c.copy(k).lerp(verd, 0.45 * clamp01(n.y * 0.8 + 0.2)).multiplyScalar(0.5 + 0.95 * clamp01(n.y * 0.6 + n.z * 0.4));
    const blob = (dx, dy, dz, rx, ry, rz, k = c) => { const g = new THREE.SphereGeometry(1, 8, 5); g.scale(rx, ry, rz); g.translate(x + dx, y + dy, z + dz); solid(F, g, k, 2, paint(k)); };
    { const g = new THREE.TorusGeometry(0.034, 0.017, 6, 16); g.scale(1, 1.08, 0.62); g.translate(x, y + 0.004, z + 0.004); solid(F, g, c, 2, paint(c)); }      // the mane, one soft ruff
    blob(0, 0.002, 0.012, 0.031, 0.035, 0.022);                                                           // the face
    for (const s of [-1, 1]) { blob(s * 0.014, 0.015, 0.03, 0.012, 0.007, 0.008); blob(s * 0.026, 0.034, 0.012, 0.01, 0.011, 0.008); blob(s * 0.016, -0.008, 0.027, 0.012, 0.011, 0.01); }      // brows, ears, cheeks
    blob(0, -0.006, 0.033, 0.011, 0.014, 0.012);                                                          // the muzzle
    blob(0, -0.029, 0.024, 0.013, 0.009, 0.012, dark);                                                    // the open mouth
  },

  // The basin: a wide round tub of his red-brown stone, a rolled rim, a moulded foot, a ring cut in relief either side.
  basin(F, cx, cz, c, inside, rim) {
    const prof = [[0.166, 0], [0.174, 0.008], [0.17, 0.024], [0.179, 0.03], [0.192, 0.07], [0.206, 0.112], [0.214, 0.138], [0.224, 0.143], [BASIN.R, 0.154], [BASIN.R - 0.001, 0.164], [0.222, BASIN.rim],
      [0.21, BASIN.rim - 0.003], [0.202, 0.158], [BASIN.r1, 0.15], [0.186, 0.1], [BASIN.r0, BASIN.floor + 0.004], [0.16, BASIN.floor], [0.0001, BASIN.floor]];
    const g = new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), 34); g.translate(cx, 0, cz);
    solid(F, g, c, 3, (v, n) => {
      const r = Math.hypot(v.x - cx, v.z - cz), inner = n.y > 0.3 && r < 0.205 || (r < 0.2 && v.y < 0.15 && (n.x * (v.x - cx) + n.z * (v.z - cz)) < 0);
      if (inner) return _c.copy(inside).multiplyScalar(0.75 + 1.6 * (v.y - BASIN.floor));
      return _c.copy(c).lerp(rim, smooth(0.13, 0.165, v.y)).multiplyScalar(0.78 + 1.5 * Math.min(v.y, 0.15));
    });
    for (const a of [-0.62, 0.62]) {
      const rr = 0.2, t = new THREE.TorusGeometry(0.024, 0.0065, 6, 14); t.scale(1, 1, 0.7); t.rotateX(-0.12); t.rotateY(a); t.translate(cx + Math.sin(a) * rr, 0.088, cz + Math.cos(a) * rr);
      solid(F, t, c, 3, (v, n) => _c.copy(c).multiplyScalar(0.7 + 0.5 * clamp01(n.y)));
      const b = new THREE.SphereGeometry(0.011, 8, 6); b.translate(cx + Math.sin(a) * (rr + 0.006), 0.114, cz + Math.cos(a) * (rr + 0.006));
      solid(F, b, c, 3, (v, n) => _c.copy(rim).multiplyScalar(0.7 + 0.5 * clamp01(n.y)));
    }
  },

  // The glaze the stone is tinted over: soft patches of close warm and cool greys.
  stoneTexture() {
    return glaze({ size: 512, seed: 57051, n: 300, rad: [22, 90], alpha: [0.1, 0.24], base: '#8a8782',
      colors: [['#8c8a84', 3], ['#a09a8e', 3], ['#75767a', 3], ['#aea697', 2], ['#6e695f', 2.4], ['#958a76', 2], ['#5f5e5a', 1], ['#b8ae9a', 1]] });
  },

  // ---------------------------------------------------------------- the floor: his ground, and the water in the basins
  buildFloor(L, col) {
    const pos = [], kind = [], O = this.O;
    const S = (x, y, z) => V3(O.x + L.tx * x + L.nx * z, O.y + y, O.z + L.tz * x + L.nz * z);
    const quadK = (a, b, c, d, k) => { for (const p of [a, b, c, a, c, d]) { pos.push(p.x, p.y, p.z); kind.push(k); } };
    quadK(S(-1.5, 0.013, 0.002), S(1.46, 0.013, 0.002), S(1.46, 0.013, 1.3), S(-1.5, 0.013, 1.3), 0);
    PED.forEach((pd, i) => quadK(S(pd.cx - 0.22, 0, BASIN.z - 0.22), S(pd.cx + 0.22, 0, BASIN.z - 0.22), S(pd.cx + 0.22, 0, BASIN.z + 0.22), S(pd.cx - 0.22, 0, BASIN.z + 0.22), 1 + i));
    quadK(S(POOL.x - 0.11, 0, POOL.z - 0.11), S(POOL.x + 0.11, 0, POOL.z - 0.11), S(POOL.x + 0.11, 0, POOL.z + 0.11), S(POOL.x - 0.11, 0, POOL.z + 0.11), 3);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aKind', new THREE.Float32BufferAttribute(kind, 1));
    const st = (c, a = 0.2) => '#' + col(c, a).getHexString();
    // his ground: dry earth and dust dragged level, close in tone
    const ground = glaze({ size: 512, seed: 57052, n: 280, rad: [20, 80], alpha: [0.12, 0.26], drag: 0.7, speck: 700, base: st('#7b684c'),
      colors: [['#806c4e', 4], ['#6f5d43', 3], ['#8a7656', 3], ['#665740', 2], ['#93805e', 1.6], ['#6c6448', 1.4], ['#5c513b', 1]].map(([c, w]) => [st(c), w]) });
    const u = this.fu = { tGround: { value: ground }, uC: { value: 0 }, uBuilt: { value: 0 }, uLift: { value: [V3(), V3(), V3()] }, uFill: { value: [0, 0] }, uGlint: { value: 1 }, uPool: { value: new THREE.Vector4(POOL.x, POOL.z, 0, 0) }, uPoolHit: { value: new THREE.Vector2(POOL.x, POOL.z) },
      cSunG: { value: new THREE.Color(1.3, 1.06, 0.76) }, cShadeG: { value: new THREE.Color(0.47, 0.47, 0.46) }, cGreen: { value: new THREE.Color(0.74, 0.9, 0.66) },
      cDeep: { value: col('#1f1b12', 0.2) }, cMid: { value: col('#3c3524', 0.2) }, cSky: { value: col('#8f978a', 0.3) }, cFoam: { value: col('#e9ecdf', 0.1) }, cGold: { value: new THREE.Color(1.5, 1.22, 0.75) } };
    const m = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide });
    m.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, u, this.sun, this.wu);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float aKind; uniform vec3 uLift[3]; varying float vKind;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\n  vKind = aKind; if (aKind > 2.5) transformed += uLift[2]; else if (aKind > 1.5) transformed += uLift[1]; else if (aKind > 0.5) transformed += uLift[0];');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
uniform sampler2D tGround; uniform float uC, uBuilt, uTime, uGlint; uniform float uFill[2]; uniform vec4 uBasin[2]; uniform vec4 uHit[4]; uniform vec4 uPool; uniform vec2 uPoolHit;
uniform vec3 cSunG, cShadeG, cGreen, cDeep, cMid, cSky, cFoam, cGold;
varying float vKind; vec3 fCol; float fA;
${SUN_GLSL}
float boxD(vec2 q, vec2 c, vec2 h) { vec2 d = abs(q - c) - h; return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0); }`)
        .replace('#include <map_fragment>', `#include <map_fragment>
{
  vec2 lq = lifeP.xz - uO.xz; vec2 q = vec2(dot(lq, uAx.xy), dot(lq, uAx.zw));
  if (vKind > 2.5) {
    // the low pool the right-hand basin runs over into: the wet spreading from where the thread of water lands
    vec2 d = q - uPool.xy; float r = length(d), dd = length(q - uPoolHit); vec4 ws = texture2D(tGround, q * 2.1);
    float ring = sin((dd - uTime * 0.2) * 130.0) * exp(-dd * 15.0) * uPool.w;
    vec3 c = mix(cDeep, cMid, 0.3 + 0.2 * ws.a);
    c = mix(c, cSky, clamp(0.05 + 0.16 * smoothstep(0.02, -0.09, d.y) + 0.3 * smoothstep(0.2, 0.9, ring), 0.0, 0.5));
    c *= (1.0 - 0.25 * smoothstep(-0.2, -0.85, ring)) * (1.0 - 0.4 * smoothstep(${(POOL.r - 0.03).toFixed(3)}, ${POOL.r.toFixed(3)}, r));
    c = mix(c, cFoam, clamp(exp(-pow(dd / 0.013, 2.0)) * uPool.w, 0.0, 1.0) * 0.75);
    fCol = c; fA = (1.0 - smoothstep(${(POOL.r - 0.006).toFixed(3)}, ${POOL.r.toFixed(3)}, r)) * (1.0 - smoothstep(uPool.z * 0.21 - 0.014, uPool.z * 0.21, dd + (ws.a - 0.5) * 0.024)) * 0.96;
  } else if (vKind > 0.5) {
    // the water in a basin: dark, his pale sky lying in it, rings going out from where the two streams land
    int bi = vKind > 1.5 ? 1 : 0; vec4 Bn = uBasin[bi]; float fill = uFill[bi];
    vec2 d = q - Bn.xy; float r = length(d), rw = mix(${BASIN.r0.toFixed(3)}, ${BASIN.r1.toFixed(3)}, fill);
    vec4 ws = texture2D(tGround, q * 2.1 + vec2(uTime * 0.012, 0.0));
    float swell = sin(q.x * 33.0 + uTime * 0.8) * sin(q.y * 29.0 - uTime * 0.6), hgt = 0.0, foam = 0.0, pud = 0.0;
    for (int j = 0; j < 2; j++) {
      vec4 H = uHit[bi * 2 + j]; float dd = length(q - H.xy);
      hgt += sin((dd - uTime * 0.2) * 120.0) * exp(-dd * 12.0) * H.z;
      foam += exp(-pow(dd / (0.011 + 0.016 * H.z), 2.0)) * H.z;
      pud = max(pud, 1.0 - smoothstep(H.w - 0.012, H.w, dd + (ws.a - 0.5) * 0.03));
    }
    vec3 c = mix(cDeep, cMid, 0.25 + 0.2 * ws.a);
    c = mix(c, cSky, clamp(0.04 + 0.2 * smoothstep(0.02, -0.19, d.y + 0.3 * abs(d.x)) + 0.035 * swell + (ws.a - 0.5) * 0.04 + 0.3 * smoothstep(0.2, 0.9, hgt), 0.0, 0.5));
    c *= (1.0 - 0.3 * smoothstep(-0.2, -0.85, hgt)) * (1.0 - 0.45 * smoothstep(rw - 0.05, rw, r));
    // the sun on it: its net of light on the stone under the water, and (it comes from behind) its glitter towards us
    float sun = sunAt(vec3(q.x, Bn.z, q.y));
    c += cGold * sun * 0.035 * fill * (0.6 + 0.8 * ws.a);
    float gl = texture2D(tGround, q * 11.0 + uTime * vec2(0.13, 0.08) + hgt * 0.01).a * texture2D(tGround, q * 15.0 - uTime * vec2(0.09, 0.14)).a;
    float path = exp(-pow((d.x + d.y * ${KX.toFixed(2)}) / 0.055, 2.0));
    c += cGold * sun * path * mix(0.1, smoothstep(0.47, 0.6, gl) * 0.8, uGlint) * smoothstep(0.05, 0.3, fill);
    c = mix(c, cFoam * (1.0 + 0.7 * sun), clamp(foam, 0.0, 1.0) * 0.8);
    fCol = c; fA = (1.0 - smoothstep(rw - 0.006, rw, r)) * max(pud, smoothstep(0.02, 0.07, fill)) * 0.96;
  } else {
    // his ground: laid from the wall outwards, broken at its edge stroke by stroke; gold where the light through the
    // arch falls on it, dark and a little green in the shade on the right, darker still close under the stones
    vec4 gs = texture2D(tGround, q / 0.9); float ang = atan(q.y - 0.1, q.x + 0.02);
    vec2 e = (q - vec2(-0.02, 0.1)) / vec2(1.4, 1.02); e *= e;
    float r = sqrt(sqrt(dot(e, e))) / (1.0 + 0.05 * sin(ang * 3.0 + 0.6) + 0.04 * sin(ang * 5.0 + 2.1) + 0.03 * sin(ang * 9.0)) + (gs.a - 0.5) * 0.26;
    float laid = smoothstep(0.0, 0.1, uC * 1.5 - 0.06 - q.y - (gs.a - 0.5) * 0.3);
    vec3 gc = gs.rgb * mix(vec3(1.0), cGreen * 0.8, smoothstep(-0.1, 0.9, q.x) * smoothstep(0.4, 0.95, q.y) * (0.3 + 1.0 * gs.a));
    float sun = sunAt(vec3(q.x, 0.0, q.y));
    vec3 c = gc * (cShadeG + cSunG * sun * ${SUN_L.y.toFixed(3)});
    float dn = min(boxD(q, vec2(${((ST.x0 + ST.x1) / 2).toFixed(3)}, ${(FMAX / 2).toFixed(3)}), vec2(${((ST.x1 - ST.x0) / 2).toFixed(3)}, ${(FMAX / 2).toFixed(3)})),
      min(min(boxD(q, vec2(${PED[0].cx.toFixed(3)}, ${(LOW.d / 2).toFixed(3)}), vec2(${PHW.toFixed(3)}, ${(LOW.d / 2).toFixed(3)})), boxD(q, vec2(${PED[1].cx.toFixed(3)}, ${(LOW.d / 2).toFixed(3)}), vec2(${PHW.toFixed(3)}, ${(LOW.d / 2).toFixed(3)}))),
      min(min(length(q - vec2(${PED[0].cx.toFixed(3)}, ${BASIN.z.toFixed(3)})) - 0.17, length(q - vec2(${PED[1].cx.toFixed(3)}, ${BASIN.z.toFixed(3)})) - 0.17),
      min(boxD(q, vec2(${SLAB.x.toFixed(3)}, ${SLAB.z.toFixed(3)}), vec2(${(SLAB.w / 2 - 0.02).toFixed(3)}, ${(SLAB.d / 2).toFixed(3)})), boxD(q, vec2(${DRUM.x.toFixed(3)}, ${DRUM.z.toFixed(3)}), vec2(${(DRUM.len / 2).toFixed(3)}, 0.03))))));
    c *= 1.0 - 0.5 * uBuilt * (1.0 - smoothstep(0.0, 0.1, dn));
    float dust = (1.0 - smoothstep(0.78, 1.0, r)) * laid, spill = 0.13 * sun * (1.0 - smoothstep(0.95, 1.25, r));
    fA = max(dust, spill); fCol = mix(vec3(1.25, 0.9, 0.5), c, clamp(dust / max(fA, 1.0e-3), 0.0, 1.0));
  }
}`)
        .replace('#include <opaque_fragment>', '  outgoingLight = fCol; diffuseColor.a = fA;\n#include <opaque_fragment>');
    };
    m.customProgramCacheKey = () => 'robert-floor';
    this.floor = new THREE.Mesh(g, m); this.floor.renderOrder = 5;       // (after the gallery's own pools of lamplight, which would wash it out)
    L.add(this.floor);
  },

  // ---------------------------------------------------------------- the cards: water, dust, motes, leaves
  buildCards(L, col, R) {
    const atlas = canvasTexture(256, 256, (g, w, h) => {
      g.clearRect(0, 0, w, h); let s = 23; const r = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
      // 0 (top left): a length of falling water, upright: soft, a few brighter threads in it, feathered at both ends
      g.lineCap = 'round';
      // (across it: thin at the edges, a light down one side, as a round stream shows)
      for (let x = 30; x < 98; x++) {
        const u = (x - 64) / 30, a = Math.pow(Math.max(0, 1 - u * u), 0.8) * 0.62, v = Math.round(150 + 105 * Math.exp(-Math.pow((u + 0.3) / 0.3, 2)) + 30 * Math.exp(-Math.pow((u - 0.55) / 0.2, 2)));
        const q = g.createLinearGradient(0, 2, 0, 126); for (let k = 0; k <= 8; k++) q.addColorStop(k / 8, `rgba(${v},${v},${v},${(a * Math.pow(Math.sin(Math.PI * k / 8), 2)).toFixed(3)})`);
        g.fillStyle = q; g.fillRect(x, 2, 1, 124);
      }
      // 1 (top right): spray and dust: a soft cloud of small touches
      for (let i = 0; i < 60; i++) { const a = r() * TAU, rr = Math.sqrt(r()) * 42, x = 192 + Math.cos(a) * rr, y = 64 + Math.sin(a) * rr, v = 170 + Math.floor(r() * 85); const q = g.createRadialGradient(x, y, 0, x, y, 6 + r() * 10); q.addColorStop(0, `rgba(${v},${v},${v},${0.3 + 0.3 * r()})`); q.addColorStop(1, `rgba(${v},${v},${v},0)`); g.fillStyle = q; g.fillRect(x - 18, y - 18, 36, 36); }
      // 2 (bottom left): one drop
      const dq = g.createRadialGradient(64, 192, 0, 64, 192, 40); dq.addColorStop(0, 'rgba(255,255,255,1)'); dq.addColorStop(0.45, 'rgba(255,255,255,0.9)'); dq.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = dq; g.fillRect(0, 128, 128, 128);
      // 3 (bottom right): his leaves: a loose spray of small soft dabs, thicker low down
      // (stems fanning up from one root at the foot of the card, small leaves down each, lighter towards the tips)
      for (let i = 0; i < 13; i++) {
        const a0 = -Math.PI / 2 + (i / 12 - 0.5) * 2.3 + (r() - 0.5) * 0.25, len = 52 + r() * 58, bend = (r() - 0.5) * 0.9, n = Math.round(len / 7);
        g.strokeStyle = 'rgba(70,70,70,0.75)'; g.lineWidth = 2; g.beginPath(); g.moveTo(192, 251);
        const pts = []; for (let j = 1; j <= n; j++) { const t = j / n, a = a0 + bend * t * t; pts.push([192 + Math.cos(a0 + bend * t * 0.5) * len * t, 251 + Math.sin(a0 + bend * t * 0.5) * len * t, a, t]); }
        for (const [x, y] of pts) g.lineTo(x, y); g.stroke();
        for (const [x, y, a, t] of pts) for (const sd of [-1, 1]) {
          if (x < 133 || x > 251 || y < 133 || r() < 0.15) continue;
          const v = Math.round(90 + 150 * t * (0.6 + 0.4 * r())), la = a + sd * (0.7 + 0.5 * r()), rad = 3.6 + 3.2 * r() * (1 - 0.3 * t);
          g.save(); g.translate(x + Math.cos(la) * rad * 0.8, y + Math.sin(la) * rad * 0.8); g.rotate(la); g.scale(1, 0.5); const q = g.createRadialGradient(0, 0, 0, 0, 0, rad);
          q.addColorStop(0, `rgba(${v},${v},${v},0.95)`); q.addColorStop(0.65, `rgba(${v},${v},${v},0.85)`); q.addColorStop(1, `rgba(${v},${v},${v},0)`); g.fillStyle = q; g.fillRect(-rad, -rad, rad * 2, rad * 2); g.restore();
        }
      }
    }, false);
    // the leaves: [x, y, z (its root), size, when (after the green begins), which green]
    const TUFT = [
      [0.9, CAP, 0.07, 0.07, 0.5, 0], [0.6, CAP, 0.16, 0.055, 0.9, 1], [-0.95, CAP, 0.06, 0.05, 1.5, 3],
      [0.51, LOW.h + 0.04, 0.2, 0.05, 0.2, 1], [-0.25, stepTop(0), 0.03, 0.04, 1.9, 3],
      [0.4, stepTop(7), stepFront(6) + 0.006, 0.06, 0.0, 0], [0.27, stepTop(8), stepFront(7) + 0.006, 0.045, 0.6, 2], [0.44, stepTop(9), stepFront(8) + 0.008, 0.065, 0.3, 1], [0.03, stepTop(9), stepFront(8) + 0.005, 0.035, 1.5, 3],
      [SLAB.x + 0.19, 0.012, SLAB.z + 0.04, 0.085, 0.4, 0], [SLAB.x - 0.17, 0.012, SLAB.z + 0.03, 0.06, 1.1, 1], [DRUM.x - 0.13, 0.012, DRUM.z + 0.09, 0.08, 0.7, 2], [DRUM.x + 0.1, 0.012, DRUM.z - 0.1, 0.07, 1.6, 0],
      [1.04, 0.012, 0.68, 0.09, 0.1, 0], [0.8, 0.012, 0.86, 0.06, 1.3, 2],
      [-1.12, 0.012, 0.6, 0.08, 1.0, 3], [-1.16, 0.012, 0.34, 0.075, 1.4, 3], [-0.5, 0.012, 0.7, 0.05, 1.7, 3],
    ];
    const GREENS = [col('#4a4628', 0.25), col('#56512c', 0.25), col('#3c3d24', 0.25), col('#635c32', 0.25)], LIGHT = col('#857b48', 0.2);
    this.leaves = [];
    for (const [x, y, z, s, t, gi] of TUFT) for (let j = 0; j < 3; j++) {
      const c = GREENS[(gi + j) % 4].clone().lerp(LIGHT, j === 2 ? 0.4 : 0.1 * R());
      this.leaves.push({ x: x + (j - 1) * s * 0.3 + (R() - 0.5) * s * 0.2, y: y - 0.004, z: z + (R() - 0.5) * s * 0.3, s: s * (j === 1 ? 1.45 : 0.95 + 0.35 * R()), t: T_GREEN + t + j * 0.2 + 0.1 * R(), c, ph: R() * TAU, flip: R() });
    }
    this.NC = 4 * (N_ST + N_SPL + N_HOP) + N_OV + 2 + PRE.length + N_DUSTC + N_MOTE + this.leaves.length;
    const NC = this.NC, geo = new THREE.PlaneGeometry(1, 1);
    this.aVel = new THREE.InstancedBufferAttribute(new Float32Array(NC * 3), 3).setUsage(THREE.DynamicDrawUsage);
    this.aInfo = new THREE.InstancedBufferAttribute(new Float32Array(NC * 4), 4).setUsage(THREE.DynamicDrawUsage);
    this.aCol = new THREE.InstancedBufferAttribute(new Float32Array(NC * 3), 3).setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('aVel', this.aVel); geo.setAttribute('aInfo', this.aInfo); geo.setAttribute('aCol', this.aCol);
    const m = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide });
    const cu = { tAtlas: { value: atlas } };
    m.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, cu);
      // (each card faces the camera, its long side along the way it is going)
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec3 aVel; attribute vec4 aInfo; attribute vec3 aCol; varying vec4 vInfo; varying vec3 vCol; varying vec2 vQ;')
        .replace('#include <project_vertex>', `vec4 mvPosition = modelViewMatrix * vec4(instanceMatrix[3].xyz, 1.0);
  { vec3 vv = (modelViewMatrix * vec4(aVel, 0.0)).xyz; vec2 upv = dot(vv.xy, vv.xy) > 1.0e-8 ? normalize(vv.xy) : vec2(0.0, 1.0);
    mvPosition.xy += vec2(upv.y, -upv.x) * position.x * instanceMatrix[0][0] + upv * position.y * instanceMatrix[1][1]; }
  vQ = position.xy + 0.5; vInfo = aInfo; vCol = aCol;
  gl_Position = projectionMatrix * mvPosition;`);
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform sampler2D tAtlas; varying vec4 vInfo; varying vec3 vCol; varying vec2 vQ;')
        .replace('#include <map_fragment>', `{
  float kd = vInfo.x; vec2 cell = kd < 0.5 ? vec2(0.0, 1.0) : kd < 1.5 ? vec2(1.0, 1.0) : kd < 2.5 ? vec2(0.0, 0.0) : vec2(1.0, 0.0);
  vec2 uq = clamp(vQ, 0.02, 0.98); if (vInfo.w > 0.5) uq.x = 1.0 - uq.x;
  vec4 tx = texture2D(tAtlas, (uq + cell) * 0.5);
  float a = (kd > 2.5 ? smoothstep(0.25, 0.6, tx.a) : tx.a) * vInfo.y; if (a < 0.012) discard;
  diffuseColor = vec4(vCol * (kd > 2.5 ? 0.3 + 1.15 * tx.r : 0.72 + 0.4 * tx.r) * vInfo.z, a);
}`);
    };
    m.customProgramCacheKey = () => 'robert-cards';
    const mesh = this.cards = new THREE.InstancedMesh(geo, m, NC);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); mesh.renderOrder = 6;
    const im = mesh.instanceMatrix.array; for (let i = 0; i < NC; i++) { im[i * 16 + 10] = 1; im[i * 16 + 15] = 1; }
    L.add(mesh);
    this.PS = Array.from({ length: 4 }, () => Array.from({ length: N_ST }, (_, i) => ({ ph: (i + 0.6 * R()) / N_ST, a: R(), b: R() })));
    this.PH = Array.from({ length: 4 }, () => Array.from({ length: N_HOP }, () => ({ ph: R(), per: 0.26 + 0.14 * R(), a: R() * TAU, d: 0.025 + 0.035 * R(), h: 0.02 + 0.03 * R() })));
    this.PM = Array.from({ length: N_MOTE }, () => ({ x: -0.95 + 1.2 * R(), y: 0.2 + 0.36 * R(), z: 0.1 + 0.68 * R(), a: R() * TAU, b: R() * TAU, s: 0.006 + 0.004 * R() }));
    // the dust the stones raise where they stop: [when, x, y, z, how wide (along the wall), how much]
    const D = this.dust = [];
    for (let k = 1; k < NSTEP; k += 2) D.push([this.stops.step[k], -0.3 + 0.6 * R(), stepTop(k) - RISE, stepFront(k), 0.3, 0.5]);
    D.push([this.stops.step[NSTEP - 1], -0.2, 0, FMAX, 0.35, 0.9], [this.stops.step[NSTEP - 1], 0.25, 0, FMAX, 0.3, 0.8]);
    PED.forEach((pd, i) => { D.push([this.stops.fount[i], pd.cx - 0.1, 0, TRAIN[i], 0.22, 1], [this.stops.fount[i], pd.cx + 0.12, 0, TRAIN[0] - 0.05, 0.2, 0.9]); });
    this.PO = Array.from({ length: N_OV }, (_, i) => ({ ph: (i + 0.6 * R()) / N_OV, a: R() }));
    this.cWater = col('#aab0a2', 0.2); this.cWaterSun = new THREE.Color(1.0, 0.9, 0.68); this.cDust = col('#8f7c5e', 0.25); this.cMote = new THREE.Color(1.0, 0.86, 0.58);
    this.cT = new THREE.Color();
  },

  // ---------------------------------------------------------------- the sounds of the thing (no tune: a ruin has none)
  makeScore(L) {
    const s = score(L), calm = L.calm, q = calm ? 0.6 : 1;
    s.hit(0.1, { d: 1.5, vol: 0.02 * q, lp: 230, attack: 0.5 });                                     // stone sliding on stone
    this.stops.step.forEach((t, k) => s.hit(t, { d: 0.07, vol: (0.011 + 0.0012 * k) * q, lp: 1150 - 75 * k, attack: calm ? 0.02 : 0.003 }));      // each slab of the stair stopping, lower and lower
    for (const t of this.stops.fount) s.hit(t, { d: 0.26, vol: 0.034 * q, lp: 170, attack: calm ? 0.05 : 0.004 });
    for (const t of this.stops.die) s.hit(t, { d: 0.12, vol: 0.018 * q, lp: 420, attack: calm ? 0.03 : 0.003 });
    s.hit(DRUM.t[0] + 0.1, { d: 1.1, vol: 0.009, lp: 300, attack: 0.15 });                             // the drum rolling out
    // a drop into dry stone, and what the great vault gives back of it
    const fall = Math.sqrt(2 * (MOUTH.y - 0.012 - BASIN.floor) / G);
    for (const [m, t] of PRE) { const f = 760 + 150 * _h(m, t); [[0, 0.03], [0.31, 0.009], [0.63, 0.003]].forEach(([d, v]) => s.note(t + fall + d, f, 0.07, { vol: v, type: 'sine', to: f * 2.05, attack: 0.002 })); }
    // the pipes
    for (let i = 0; i < 5; i++) { const f = 130 + 38 * i; s.note(T_ON[0] - 0.42 + 0.075 * i, f, 0.1, { vol: 0.022, type: 'sine', to: f * 1.9, attack: 0.01 }); }
    for (let i = 0; i < 4; i++) { const f = 150 + 30 * i; s.note(T_ON[2] - 0.34 + 0.075 * i, f, 0.1, { vol: 0.013, type: 'sine', to: f * 1.9, attack: 0.01 }); }
    T_ON.forEach((t, i) => s.hit(t, { d: 0.2, vol: i < 2 ? 0.016 : 0.01, hp: 1300, attack: 0.02 }));  // the first sputter of each
    [[0, 0.016], [0.3, 0.005]].forEach(([d, v]) => s.note(this.tOver + TFO + d, 980, 0.07, { vol: v, type: 'sine', to: 1900, attack: 0.002 }));      // the basin's first water into its pool
    return s.done();
  },

  hide() { if (!this.rig) return; this.rig.mesh.visible = false; this.cards.visible = false; this.floor.visible = false; },
  start(L) { this.band.from(0); this.hold = Infinity; },
  back(L) { this.hold = L.t; },
  end() { this.hide(); this.hiss.set(0); this.deep.set(0); },
  reset() { this.hide(); this.hold = Infinity; if (this.hiss) { this.hiss.set(0); this.deep.set(0); } },

  // How hard mask s is running at water time t: a cough, a falter, then the steady stream; and it fails when the look ends.
  flow(s, t) {
    const x = t - T_ON[s]; if (x <= 0 || T_ON[s] > this.hold) return 0;
    let f = x < 0.1 ? 0.5 * ease.out(x / 0.1) : x < 0.24 ? lerp(0.5, 0.14, ease.smooth((x - 0.1) / 0.14)) : lerp(0.14, 1, ease.out((x - 0.24) / 0.45));
    f *= 1 + 0.035 * Math.sin(x * 7.3 + s * 2.1);
    if (t > this.hold) f *= 1 - ease.smooth((t - this.hold) / 0.55);
    return f;
  },
  // How full basin i is at story time t (0 to 1), and where that puts its water.
  fill(i, t) { return ease.smooth(ramp(t, T_ON[i * 2] + 0.45, T_ON[i * 2] + 3.0)); },
  level(i, t) { return BASIN.floor + 0.003 + (BASIN.full - BASIN.floor) * this.fill(i, t); },
  // How hard the right-hand basin is running over into its pool at water time t: from when its water reaches the hole,
  // and on for a moment after the masks have failed.
  over(t) {
    let f = smooth(SPOUT.y + 0.004, SPOUT.y + 0.02, this.level(1, Math.min(t, this.hold)));
    if (t > this.hold) f *= 1 - ease.smooth((t - this.hold - 0.2) / 0.6);
    return f;
  },
  // Is a point of the scene in the light through the arch, just now? (as the shaders ask it)
  sunAt(x, y, z) {
    const A = this.sun.uArch.value, dx = (x + KX * z - A.x) / A.y; if (Math.abs(dx) >= 1) return 0;
    return smooth(0, SOFT, (1 - Math.abs(dx)) * A.y) * smooth(0, SOFT * 1.6, A.z + A.w * Math.sqrt(1 - dx * dx) - (y + KY * z)) * this.sun.uSunK.value.w;
  },

  update(L, dt) {
    const ph = L.phase, showing = ph === 'wake' || ph === 'play';
    if (!showing && ph !== 'return') { this.hide(); return; }
    const calm = L.calm, hold = this.hold, back = showing ? 0 : L.ret;
    // tp: the story's clock (held when the look ends); tb: the building (it rewinds); tw: the water's clock (it runs on)
    const rew = showing ? 1 : 1 - ease.smooth(ramp(back, 0.2, 1)), tp = showing ? L.t : hold, tb = showing ? L.t : Math.min(hold, HOME) * rew, tw = showing ? L.t : hold + L.r;
    if (showing) this.band.play(L.t);
    const V = this.V, rig = this.rig, I = this.I, B = this.B, nx = L.nx, nz = L.nz;
    rig.mesh.visible = tb > T_STAIR[0] - 0.05; this.floor.visible = tb > 0.02;

    // ---- the stones: slid out of the wall by how far each has come
    const slide = (i, o) => { V.m.copy(B); V.m.elements[12] += nx * o; V.m.elements[14] += nz * o; rig.mat(i, V.m); };
    // (how far the front of a thing `len` deep has come out by now; a face is never left standing within a finger of
    // the wall, where the gallery's own wash of lamplight lies and would bleach it: it is out, or right inside)
    const come = (len, T) => { const f = -0.03 + (len + 0.03) * travel((tb - T[0]) / (T[1] - T[0])); return f < 0.022 ? -0.06 : f; };
    const F = come(FMAX, T_STAIR);
    for (let k = 0; k < NSTEP; k++) slide(I['step' + k], Math.min(0, F - stepFront(k)));
    const off = [0, 0];
    for (let i = 0; i < 2; i++) {
      off[i] = Math.min(0, come(TRAIN[i], T_FOUNT[i]) - TRAIN[i]);
      slide(I[i ? 'fountR' : 'fountL'], off[i]);
      slide(I[i ? 'upR' : 'upL'], Math.min(0, come(DIE.d + 0.012, T_DIE[i]) - (DIE.d + 0.012)));
    }
    // the fallen block: shoved along by the foot of the stair, and it slides on a little and turns when the stair stops
    {
      const go = ease.out(ramp(tb, T_STAIR[1] - 0.06, T_STAIR[1] + 0.5)), z = F + SLAB.d / 2 + 0.004 + go * (SLAB.z - FMAX - SLAB.d / 2 - 0.004);
      V.a.compose(V.v.set(SLAB.x, SLAB.y, z), V.q.setFromEuler(V.e.set(0, SLAB.yaw * go, 0)), V.s); rig.mat(I.slab, V.m.multiplyMatrices(B, V.a));
    }
    // the column drum: it rolls out of the wall beyond the right-hand base, slower and slower, and rocks back a hair
    {
      const q = showing ? ramp(tb, DRUM.t[0], DRUM.t[1]) : ramp(hold, DRUM.t[0], DRUM.t[1]) * clamp01(rew * 1.3 - 0.3), on = ease.out(q) - 0.03 * Math.sin(Math.PI * clamp01((q - 0.72) / 0.28)), z = -DRUM.r - 0.02 + (DRUM.z + DRUM.r + 0.02) * on;
      V.a.compose(V.v.set(DRUM.x, DRUM.r, z), V.q.setFromEuler(V.e.set((z - DRUM.z) / DRUM.r, 0, 0)), V.s); rig.mat(I.drum, V.m.multiplyMatrices(B, V.a));
    }

    // ---- the light: it comes down the stair, and goes back up it
    const lightK = showing ? 1 : 1 - ease.inOut(ramp(back, 0, 0.42));
    const A = this.sun.uArch.value, K = this.sun.uSunK.value;
    A.z = lerp(ARCH.s0, ARCH.s1 + 0.025 * Math.sin(tw * 0.31), ease.inOut(ramp(tp, T_SUN[0], T_SUN[1])) * lightK);
    K.w = ease.smooth(ramp(tp, T_SUN[0] - 0.25, T_SUN[0] + 0.9)) * (showing ? 1 : 1 - ease.smooth(ramp(back, 0.06, 0.45))) * (0.96 + 0.04 * Math.sin(tw * 0.53 + 1));

    // ---- the water
    const wu = this.wu, fu = this.fu, flows = this.su.uFlow.value;
    wu.uTime.value = calm ? tw * 0.5 : tw; fu.uGlint.value = calm ? 0 : 1;
    fu.uC.value = showing ? L.t : Math.min(hold, HOME) * (1 - ease.inOut(ramp(back, 0.45, 1))); fu.uBuilt.value = ease.smooth(ramp(tb, 1.3, 1.8));
    let flowSum = 0, fillSum = 0;
    const lvl = [0, 0];
    for (let i = 0; i < 2; i++) {
      const fill = this.fill(i, tp); fillSum += fill;
      lvl[i] = this.level(i, tp);
      fu.uFill.value[i] = fill;
      fu.uLift.value[i].set(nx * off[i], lvl[i], nz * off[i]);
      const cz = BASIN.z + off[i], Bn = wu.uBasin.value[i];
      Bn.set(PED[i].cx, cz, lvl[i], 0);
      Bn.w = this.sunAt(PED[i].cx, lvl[i], cz) * smooth(0.12, 0.6, fill);
    }
    const ov = this.over(tw - TFO);
    fu.uLift.value[2].set(nx * off[1], POOL.y, nz * off[1]);
    fu.uPool.value.set(POOL.x, POOL.z + off[1], ease.out(ramp(tp, this.tOver + TFO, this.tOver + TFO + 1.5)), ov);
    fu.uPoolHit.value.set(SPX + Math.sin(SPOUT.a) * (0.04 + SPOUT.v * ov) * TFO, SPZ + Math.cos(SPOUT.a) * (0.04 + SPOUT.v * ov) * TFO + off[1]);
    this.water(L, tw, tp, lvl, off, calm, showing, back);
    for (let s = 0; s < 4; s++) { flows[s] = this.flow(s, tw); flowSum += flows[s]; }

    const near = Math.max(0, 1 - Math.hypot(L.k.G.camera.position.x - L.cx, L.k.G.camera.position.z - L.cz) / 11), fl = flowSum / 4, fa = fillSum / 2;
    this.hiss.set(L.quiet ? 0 : (0.02 * fl * (1 - 0.4 * fa) + 0.005 * ov) * near);
    this.deep.set(L.quiet ? 0 : 0.034 * fl * (0.2 + 0.8 * fa) * near);
    L.voice().place();
    if (!showing && L.ret >= 1) this.hide();
  },

  // Every card for this moment, worked out from the clocks.
  water(L, tw, tp, lvl, off, calm, showing, back) {
    const O = this.O, tx = L.tx, tz = L.tz, nx = L.nx, nz = L.nz, im = this.cards.instanceMatrix.array, vel = this.aVel.array, info = this.aInfo.array, colr = this.aCol.array, cT = this.cT;
    const put = (i, x, y, z, w, h, vx, vy, vz, kind, a, br, cc, flip = 0) => {
      const k = i * 16; im[k] = w; im[k + 5] = h; im[k + 12] = O.x + tx * x + nx * z; im[k + 13] = O.y + y; im[k + 14] = O.z + tz * x + nz * z;
      vel[i * 3] = tx * vx + nx * vz; vel[i * 3 + 1] = vy; vel[i * 3 + 2] = tz * vx + nz * vz;
      info[i * 4] = kind; info[i * 4 + 1] = a; info[i * 4 + 2] = br; info[i * 4 + 3] = flip; colr[i * 3] = cc.r; colr[i * 3 + 1] = cc.g; colr[i * 3 + 2] = cc.b;
    };
    const none = i => { info[i * 4 + 1] = 0; im[i * 16] = 0; im[i * 16 + 5] = 0; };
    const hits = this.wu.uHit.value;
    let n = 0;
    for (let s = 0; s < 4; s++) {
      const b = s >> 1, mx = this.masks[s].x, zo = off[b], level = lvl[b];
      // where this stream meets the water (or the dry stone) just now
      const drop = MOUTH.y - level, ah = (-VY0 + Math.sqrt(VY0 * VY0 + 2 * G * drop)) / G, fh = this.flow(s, tw - ah), zh = MOUTH.z + (0.05 + 0.68 * fh) * ah;
      // (how far the wet has spread on the basin's floor: a spot from each drop, then the puddle)
      let wet = 0; for (const [m, t] of PRE) if (m === s && tp > t + 0.19) wet = Math.max(wet, 0.012 + 0.012 * ease.out(ramp(tp, t + 0.19, t + 0.6)));
      wet = Math.max(wet, T_ON[s] <= this.hold ? 0.3 * ease.out(ramp(tp, T_ON[s] + 0.15, T_ON[s] + 1.3)) : 0);
      hits[s].set(mx, zh + zo, fh, wet);
      const sunH = this.sunAt(mx, level + 0.02, zh);
      // the stream: lengths of water one after another down its arc
      for (const p of this.PS[s]) {
        const i = n++, a = ((tw / TF + p.ph) % 1) * TF, f = this.flow(s, tw - a);
        if (f < 0.03 || a > ah) { none(i); continue; }
        const vz = 0.05 + 0.68 * f, y = MOUTH.y - VY0 * a - 0.5 * G * a * a, z = MOUTH.z + vz * a, vy = -VY0 - G * a, sp = Math.hypot(vy, vz);
        const sun = this.sunAt(mx, y, z), w = (0.009 + 0.01 * f) * (0.9 + 0.25 * a / TF) * (0.94 + 0.12 * p.a);
        cT.copy(this.cWater).lerp(this.cWaterSun, sun);
        put(i, mx + 0.0008 * Math.sin(tw * 9 + p.b * 6), y, z + zo, w, Math.max(0.034, Math.min(0.1, sp * 0.07)), 0, vy, vz, 0, Math.min(1, a / 0.006) * Math.min(1, f * 3) * 0.66, 0.76 + 0.64 * sun, cT);
       
      }
      // where it lands: a little spray, and drops hopping off
      for (let j = 0; j < N_SPL; j++) {
        const i = n++; if (fh < 0.05) { none(i); continue; }
        const a = j * 2.1 + s, wob = calm ? 0.85 : 0.7 + 0.3 * Math.sin(tw * 8.3 + a * 3), sz = (0.03 + 0.016 * j) * Math.sqrt(fh) * wob;
        cT.copy(this.cWater).lerp(this.cWaterSun, sunH);
        put(i, mx + 0.012 * Math.cos(a + tw * 1.3), level + 0.006 + sz * 0.3, zh + zo + 0.01 * Math.sin(a + tw * 1.1), sz * 1.5, sz, 0, 1, 0, 1, 0.42 * fh, 0.9 + 0.45 * sunH, cT);
      }
      for (const p of this.PH[s]) {
        const i = n++; if (fh < 0.3) { none(i); continue; }
        const first = 1 + 1.6 * (1 - ramp(tw, T_ON[s] + 0.25, T_ON[s] + 1.1)), q = (tw / p.per + p.ph) % 1, d = p.d * q * first, y = level + 0.004 + 4 * p.h * first * q * (1 - q);
        cT.copy(this.cWater).lerp(this.cWaterSun, sunH);
        put(i, mx + Math.cos(p.a) * d, y, zh + zo + Math.sin(p.a) * d * 0.8, 0.006, 0.008, Math.cos(p.a) * 0.1, p.h * 8 * (0.5 - q), 0.05, 2, fh * (1 - q * q) * 0.85, 1 + 0.7 * sunH, cT);
      }
    }
    // the right-hand basin running over: a thin thread from the hole in its wall down into the pool
    {
      const sx = Math.sin(SPOUT.a), sz = Math.cos(SPOUT.a), zo = off[1];
      for (const p of this.PO) {
        const i = n++, a = ((tw / TFO + p.ph) % 1) * TFO, f = this.over(tw - a);
        if (f < 0.04) { none(i); continue; }
        const v = 0.04 + SPOUT.v * f, vy = -G * a;
        put(i, SPX + sx * v * a, SPOUT.y - 0.004 - 0.5 * G * a * a, SPZ + sz * v * a + zo, (0.006 + 0.005 * f) * (0.9 + 0.2 * p.a), Math.max(0.022, Math.min(0.06, Math.hypot(vy, v) * 0.07)), sx * v, vy, sz * v, 0, Math.min(1, a / 0.006) * Math.min(1, f * 3) * 0.9, 0.72, this.cWater);
      }
      const fo = this.over(tw - TFO), hx = SPX + sx * (0.04 + SPOUT.v * fo) * TFO, hz = SPZ + sz * (0.04 + SPOUT.v * fo) * TFO + zo;
      for (let j = 0; j < 2; j++) {
        const i = n++; if (fo < 0.06) { none(i); continue; }
        const sc = (0.022 + 0.01 * j) * Math.sqrt(fo) * (calm ? 0.85 : 0.72 + 0.28 * Math.sin(tw * 7.7 + j * 2));
        put(i, hx + 0.006 * Math.cos(tw * 1.2 + j * 3), POOL.y + 0.005 + sc * 0.3, hz + 0.006 * Math.sin(tw * 1.4 + j), sc * 1.5, sc, 0, 1, 0, 1, 0.4 * fo, 0.9, this.cWater);
      }
    }
    // the drops before the water comes: each swells on the lip of its mask, lets go and falls
    for (const [m, t] of PRE) {
      const i = n++, b = m >> 1, a = tw - t, y = MOUTH.y - 0.012 - (a > 0 ? 0.5 * G * a * a : 0);
      if (a < -0.45 || y < lvl[b] || t > this.hold) { none(i); continue; }
      const r = a < 0 ? 0.009 * ease.smooth(1 + a / 0.45) : 0.009, sun = this.sunAt(this.masks[m].x, y, MOUTH.z);
      cT.copy(this.cWater).lerp(this.cWaterSun, sun);
      put(i, this.masks[m].x, y, MOUTH.z - 0.004 + off[b], r, r * (1.25 + Math.max(0, a) * 6), 0, -1, 0, 2, 0.95, 1.05 + 0.6 * sun, cT);
    }
    // the dust where the stones stop: it puffs out low, hangs, and thins
    {
      let c = 0;
      for (const [t, x, y, z, wd, amt] of this.dust) for (let j = 0; j < 2 && c < N_DUSTC; j++, c++) {
        const i = n + c, a = tp - t - j * 0.04;
        if (!showing || a <= 0 || a > 1.5) { none(i); continue; }
        const q = a / 1.5, e = ease.out(q), sx = (j ? 1 : -1) * wd * (0.25 + 0.5 * e), sz = (0.07 + 0.13 * e) * (0.7 + 0.5 * amt);
        const sun = this.sunAt(x + sx, y + 0.03, z + 0.03);
        cT.copy(this.cDust).multiplyScalar(0.75 + 0.7 * sun);
        put(i, x + sx, y + 0.015 + 0.04 * e, z + 0.02 + 0.06 * e, sz * 2.1, sz * 0.8, 0, 1, 0, 1, 0.2 * amt * (1 - q) * (1 - q) * Math.min(1, a / 0.06), 1, cT, j);
      }
      for (; c < N_DUSTC; c++) none(n + c);
      n += N_DUSTC;
    }
    // motes turning in the beam: seen only where the light is
    for (const p of this.PM) {
      const i = n++, sp = calm ? 0.5 : 1, x = p.x + 0.05 * Math.sin(tw * 0.23 * sp + p.a), y = p.y + 0.04 * Math.sin(tw * 0.17 * sp + p.b) - 0.006 * ((tw * sp + p.a * 3) % 5), z = p.z + 0.05 * Math.cos(tw * 0.19 * sp + p.a * 2);
      const sun = this.sunAt(x, y, z) * ease.smooth(ramp(tp, 2.2, 3.4));
      if (sun < 0.03) { none(i); continue; }
      put(i, x, y, z, p.s, p.s, 0, 1, 0, 2, 0.6 * sun * (0.75 + 0.25 * Math.sin(tw * 0.9 * sp + p.b * 3)), 1.5, this.cMote);
    }
    // the green: it comes up out of the joints, a spray at a time, and stirs
    const wilt = showing ? 1 : 1 - ease.smooth(ramp(back, 0, 0.3));
    for (const f of this.leaves) {
      const i = n++, gq = ramp(tp, f.t, f.t + 1.1), g = (gq <= 0 ? 0 : ease.outBack(gq) * 0.9 + 0.1 * gq) * wilt;
      if (g < 0.02) { none(i); continue; }
      const s = f.s * g, sway = 0.07 * Math.sin(tw * (calm ? 0.55 : 1.1) + f.ph), sun = this.sunAt(f.x, f.y + s * 0.5, f.z);
      cT.copy(f.c).multiplyScalar(0.62 + 0.8 * sun);
      put(i, f.x + sway * s * 0.5, f.y + s * 0.5, f.z, s * 1.1, s, sway, 1, 0, 3, 1, 1, cT, f.flip);
    }
    this.cards.visible = true; this.cards.count = this.NC;      // (drawn all through the show, so the check counts the whole of it)
    this.cards.instanceMatrix.needsUpdate = true; this.aVel.needsUpdate = true; this.aInfo.needsUpdate = true; this.aCol.needsUpdate = true;
  },
});
