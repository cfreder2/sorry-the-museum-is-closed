// Juan Sánchez Cotán, Still Life with Game Fowl (about 1600 to 1603), Gallery 211. The word: still.
//
// A stone window, black behind, a hard light raking in from the left; fruit and vegetables hung on strings so that
// nothing touches anything else, and others set on the sill, some of them over its edge and into our space. He painted
// it in Toledo just before he gave up his workshop and went to be a lay brother of the Carthusians, who keep silence.
// The picture is about one thing, and it is the thing the whole kind of picture is named for: everything in it has
// come to rest. So the show is the coming to rest.
//
// Look at it and his window comes out of the wall under the picture, toy-sized, stone grinding on stone, and stops.
// Its opening is black from the first, and as the stone comes on out what is in it comes forward out of that dark.
// What hangs was carried along and swings from the stop: the quince on its short string, quick and light, its two
// leaves turning like a weathercock; the cabbage on its long one, slow and heavy, winding one way and back. What lies
// on the sill slides and rolls forward to where he painted it, at and over the edge: the pale furrowed fruit at the
// left (a citron, as I read it), the cut melon rocking on its round, the slice seesawing on its rind like a cradle,
// the cucumber nosing out over the lip. Meanwhile the light comes round from the left, as his does: the shadow of the
// jamb draws back across the sill and one thing after another is found by it, those at the lip first and the quince,
// deepest in, last, each with its bright side and its dark. Everything swings a little less each time. The slice is
// the last to stop. Then nothing moves at all, and it is his picture (the arrangement is the one he used when he
// painted fewer things: a curve falling from the quince at the top left to the cucumber at the bottom right, and the
// dark at the upper right left empty).
//
// While you keep looking it stays still; now and then a breath of air stirs the two strings and they settle again.
// When you stop, it stays out while the toy is near: drive past and the draught of the toy sets the quince and the
// cabbage swinging; only when the toy is still do they come to rest. Then the light goes and the window slides back.
//
// There is no music: only the stone, the two strings taking the weight (the short one sounds higher than the long
// one, as strings do), the knock of the slice on the sill, and then quiet. The swings are slower than strings so
// short would give: his go on up out of the picture. With "Reduce motion and flashing" on, everything swings half as
// far and winds half as fast, and the sounds are softer; there is no flash in it anyway. Nothing is solid (the toy
// drives through) and nothing ever comes in front of the picture or its neighbours: the window stands under the
// frame, lower than the pictures on either side begin, and from the checks' nine cameras the guard has nothing to
// cut. Two draw calls: the window with all that is in it, and its shadow on the floor.
//
// What it does not do: the four birds stay in the picture. They are dead game, hung by the neck and the beak; they are
// not modelled, hung, swung or brought back to life here, because a dead animal is not a toy, and waking them would
// change what he painted. Only the fruit, the vegetables, the strings, the stone and the light come out.
import * as THREE from 'three';
import { lifeFor, ease, ramp, clamp01, lerp } from '../paintlife.js';
import { score } from './stagecraft.js';

const TAU = Math.PI * 2;
// The window, in its own metres: x along the wall (to the viewer's right), y up from the floor, z out from its black back.
const A = 0.34, S = 0.06, TOP = 0.55, YT = 0.6, XO = 0.42, D = 0.31, ZB = -0.05;      // half the opening; the sill; the lintel's underside and top; half the block; its depth; its back, in the wall
const U0 = 0;                                                     // where it stands, along the wall from the middle of the picture
const T_OUT = 1.3, T_STILL = 7.4;                                 // it stops; nothing moves any more
const SUN0 = [-0.87, 0.35, 0.35], SUN1 = [-0.56, 0.46, 0.69];     // the way to the light: raking at first, then come round to where he has it
const JAMB1 = [-0.22, 0.47, 0.855];                                 // (the jamb's shadow draws back a little further than that, clear of what hangs by it)
const T_SUN = [1.0, 5.6];
const BREATH = { t0: T_STILL + 4.5, every: 13 };                  // a breath of air, now and then, once all is still

// What hangs: the pivot under the lintel (x, z), the string, the swing (how far, radians; its period, seconds; how it
// dies away), the slow winding of the string, and where the middle of the thing is below the knot (for its shadow).
const HUNG = [
  { name: 'quince', x: -0.2, z: 0.1, len: 0.083, ax: 0.3, az: 0.14, lag: 0.1, px: 1.45, pz: 1.36, tau: 2.4, tw: 1.25, pt: 3.1, tt: 2.7, mid: 0.06, r: 0.05 },
  { name: 'cabbage', x: -0.145, z: 0.17, len: 0.215, ax: 0.15, az: 0.09, lag: 0.07, px: 2.25, pz: 2.12, tau: 3.1, tw: 1.05, pt: 4.4, tt: 3.5, mid: 0.108, r: 0.085 },
];
// What lies on the sill: where it comes to rest, and how far back it started (it slides forward when the window stops).
const MELON = { x: 0.075, z: 0.165, R: 0.095, back: 0.05 };
const SLICE = { x: 0.186, z: 0.262, R: 0.066, RY: 0.072, yaw: 0.2, tilt: -0.3, back: 0.07 };
const CITRON = { x: -0.215, z: 0.29, back: 0.045 };
const CUKE = { x: 0.3, z: 0.285, back: 0.075 };

// ---------------------------------------------------------------- geometry
// A smooth surface from a rule: f(u, v, o) sets o.p (a point) and o.c (its colour) for u, v in 0..1. Its normals are
// taken from the rule itself (not from the facets), so a round thing is round however it is lit.
const _o = { p: new THREE.Vector3(), c: new THREE.Color() }, _q = [0, 1, 2, 3].map(() => new THREE.Vector3()), _n = new THREE.Vector3();
function surf(nu, nv, f, mark = 0) {
  const W = nv + 1, n = (nu + 1) * W, P = new Float32Array(n * 3), N = new Float32Array(n * 3), C = new Float32Array(n * 3), e = 2e-3;
  const at = (u, v, into) => { f(u, v, _o); return into.copy(_o.p); };
  for (let i = 0; i <= nu; i++) for (let j = 0; j <= nv; j++) {
    const u = i / nu, v = j / nv, k = (i * W + j) * 3;
    f(u, v, _o); P[k] = _o.p.x; P[k + 1] = _o.p.y; P[k + 2] = _o.p.z; C[k] = _o.c.r; C[k + 1] = _o.c.g; C[k + 2] = _o.c.b;
    const uu = Math.min(1 - e, Math.max(e, u)), vv = Math.min(1 - e, Math.max(e, v));
    at(uu + e, vv, _q[0]).sub(at(uu - e, vv, _q[1])); at(uu, vv + e, _q[2]).sub(at(uu, vv - e, _q[3]));
    _n.crossVectors(_q[0], _q[2]); if (_n.lengthSq() < 1e-24) _n.set(0, 1, 0); else _n.normalize();
    N[k] = _n.x; N[k + 1] = _n.y; N[k + 2] = _n.z;
  }
  const m = nu * nv * 6, pos = new Float32Array(m * 3), nor = new Float32Array(m * 3), col = new Float32Array(m * 3), uv = new Float32Array(m * 2); let w = 0;
  const put = k => { for (let c = 0; c < 3; c++) { pos[w * 3 + c] = P[k * 3 + c]; nor[w * 3 + c] = N[k * 3 + c]; col[w * 3 + c] = C[k * 3 + c]; } uv[w * 2] = Math.floor(k / W) / nu; uv[w * 2 + 1] = (k % W) / nv + mark; w++; };
  for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) { const a = i * W + j, b = (i + 1) * W + j, c = (i + 1) * W + j + 1, d = i * W + j + 1; put(a); put(b); put(d); put(b); put(c); put(d); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setAttribute('aUv', new THREE.BufferAttribute(uv, 2));
  return g;
}
// Flat faces: each [a, b, c, d] (corners, anticlockwise seen from outside), its colour and what it is.
function faces(list) {
  const n = list.length * 6, pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3), id = new Float32Array(n);
  const a = new THREE.Vector3(), b = new THREE.Vector3(), nn = new THREE.Vector3(); let w = 0;
  for (const [pts, c, what = 0] of list) {
    a.fromArray(pts[1]).sub(b.fromArray(pts[0])); nn.fromArray(pts[3]).sub(b); nn.crossVectors(a, nn).normalize();
    for (const k of [0, 1, 2, 0, 2, 3]) { pos.set(pts[k], w * 3); nor.set([nn.x, nn.y, nn.z], w * 3); col.set([c.r, c.g, c.b], w * 3); id[w] = what; w++; }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setAttribute('aId', new THREE.BufferAttribute(id, 1)); g.setAttribute('aUv', new THREE.BufferAttribute(new Float32Array(n * 2), 2));
  return g;
}
const tag = (g, id) => { g.setAttribute('aId', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count).fill(id), 1)); return g; };
function merge(list, id) {
  let n = 0; for (const g of list) n += g.attributes.position.count;
  const out = new THREE.BufferGeometry();
  for (const [name, k] of [['position', 3], ['normal', 3], ['color', 3], ['aUv', 2]]) { const a = new Float32Array(n * k); let o = 0; for (const g of list) { a.set(g.attributes[name].array, o); o += g.attributes[name].array.length; } out.setAttribute(name, new THREE.BufferAttribute(a, k)); }
  return tag(out, id);
}
// Stood on axes of its own: x and y as given (y is squared up to x), z across them; at `at`.
const _bx = new THREE.Vector3(), _by = new THREE.Vector3(), _bz = new THREE.Vector3();
function basis(x, y, at = [0, 0, 0], into = new THREE.Matrix4()) {
  _bx.fromArray(x).normalize(); _by.fromArray(y); _by.addScaledVector(_bx, -_by.dot(_bx)).normalize(); _bz.crossVectors(_bx, _by);
  return into.makeBasis(_bx, _by, _bz).setPosition(at[0], at[1], at[2]);
}
const sstep = (a, b, x) => { const q = clamp01((x - a) / (b - a)); return q * q * (3 - 2 * q); };
const bump = (x, c, w) => Math.exp(-((x - c) / w) * ((x - c) / w));
// A profile through points [[t, r], ...], eased between them.
function profile(pts, t) {
  for (let i = 1; i < pts.length; i++) if (t <= pts[i][0]) { const a = pts[i - 1], b = pts[i]; return lerp(a[1], b[1], sstep(a[0], b[0], t) * 0.6 + 0.4 * clamp01((t - a[0]) / (b[0] - a[0]))); }
  return pts[pts.length - 1][1];
}
// A length of something round along y, from y0 to y1.
const tube = (r0, r1, y0, y1, c, seg = 8) => surf(seg, 1, (u, v, o) => { const ph = -u * TAU, r = lerp(r0, r1, v); o.p.set(r * Math.cos(ph), lerp(y0, y1, v), r * Math.sin(ph)); o.c.copy(c); });
// A loop of string: a ring of radius R (in its own x-y plane), the string r thick.
const loop = (R, r, c) => surf(12, 5, (u, v, o) => { const a = u * TAU, b = v * TAU, q = R + r * Math.cos(b); o.p.set(q * Math.cos(a), q * Math.sin(a) * 1.5, r * Math.sin(b)); o.c.copy(c); });

// His light, on everything in the window (one material, one draw call). Each part says what it is (aId): 0 the stone,
// 8 the dark behind, 7 string, 1 to 6 the things, which shade one another and the sill as balls would. Inside the
// window the left jamb and the lintel keep the light off whatever they stand between it and.
function cotanLight(u) {
  const m = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide, fog: false });
  m.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, u);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float aId; attribute vec2 aUv; varying float vId; varying vec3 vOP; varying vec2 vLf;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n  vId = aId; vOP = position; vLf = aUv;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
uniform mat4 uInv; uniform vec3 uSun, uJamb, uKey, uRoom; uniform float uLight; uniform vec4 uOcc[6]; uniform vec4 uDim;
varying float vId; varying vec3 vOP; varying vec2 vLf;
float cotH(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
float cotN(vec3 p) {
  vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(cotH(i), cotH(i + vec3(1, 0, 0)), f.x), mix(cotH(i + vec3(0, 1, 0)), cotH(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(cotH(i + vec3(0, 0, 1)), cotH(i + vec3(1, 0, 1)), f.x), mix(cotH(i + vec3(0, 1, 1)), cotH(i + vec3(1, 1, 1)), f.x), f.y), f.z);
}`)
      .replace('#include <opaque_fragment>', `{
  vec3 cP = (uInv * vec4(lifeP, 1.0)).xyz;
  vec3 cN = normalize(mat3(uInv) * inverseTransformDirection(normal, viewMatrix));
  int cid = int(vId + 0.5);
  vec3 alb = diffuseColor.rgb;
  if (cid == 8) outgoingLight = vec3(0.0035, 0.003, 0.0025);
  else {
    // in the window (1) or out in the room (0): the room's own light does not reach far in
    float within = step(abs(cP.x), uDim.x + 0.004) * step(cP.y, uDim.z + 0.004) * step(uDim.y - 0.004, cP.y);
    float deep = within * smoothstep(uDim.w + 0.035, uDim.w - 0.1, cP.z);
    if (cid == 0) {
      alb *= 0.84 + 0.22 * cotN(cP * 24.0) + 0.1 * cotN(cP * 120.0);
      alb *= 1.0 - 0.32 * within * smoothstep(0.16, 0.0, cP.z) * step(cP.z, uDim.w - 0.004);
    } else alb *= 0.95 + 0.1 * cotN(vOP * 260.0);
    if (cid == 2 && vLf.y > 1.5) {
      // a cabbage leaf: the thick pale rib down its middle, the veins branching off it, and the finer ones between
      float la = abs(vLf.x * 2.0 - 1.0), lb = vLf.y - 2.0;
      float rib = exp(-pow(la / (0.055 + 0.09 * (1.0 - lb)), 2.0)) * smoothstep(1.0, 0.55, lb);
      float v1 = smoothstep(0.12, 0.02, abs(fract((lb - 0.62 * la - 0.25 * la * la) * 5.5) - 0.5)) * smoothstep(0.03, 0.2, la) * (1.0 - 0.6 * la);
      float v2 = smoothstep(0.22, 0.04, abs(fract((lb + 0.85 * la) * 17.0 + 0.6 * cotN(vOP * 60.0)) - 0.5)) * smoothstep(0.08, 0.3, la) * cotN(vOP * 45.0);
      alb = mix(alb * (0.82 + 0.14 * cotN(vOP * 110.0)), vec3(0.76, 0.78, 0.6), clamp(0.92 * rib + 0.36 * v1 * (0.55 + 0.45 * cotN(vOP * 70.0)) + 0.16 * v2, 0.0, 1.0));
    }
    float nl = dot(cN, uSun), key = smoothstep(-0.08, 0.82, nl), shd = 1.0;
    if (within > 0.5 && cP.z < uDim.w - 0.004) {
      float s = (uDim.w - cP.z) / max(uJamb.z, 0.08), pen = 0.005 + 0.1 * s;
      shd *= smoothstep(-uDim.x - pen, -uDim.x + pen, cP.x + s * uJamb.x) * (cid == 0 ? smoothstep(uDim.z + pen, uDim.z - pen, cP.y + s * uJamb.y) : 1.0);
    }
    for (int i = 0; i < 6; i++) {
      if (i + 1 == cid) continue;
      vec3 v = uOcc[i].xyz - cP; float tp = dot(v, uSun), r = uOcc[i].w;
      if (tp <= 0.0 || r <= 0.0) continue;
      float dd = length(v - uSun * tp);
      shd *= 1.0 - 0.92 * smoothstep(r * 1.08 + 0.12 * tp, r * 0.62 - 0.05 * tp, dd) * smoothstep(0.0, r * 0.6, tp);
    }
    vec3 room = uRoom * mix(cid == 0 ? 0.55 : 0.2, 0.03, deep) * (0.72 + 0.28 * cN.y);
    float under = clamp(0.3 - 0.7 * cN.y, 0.0, 1.0) * smoothstep(0.28, 0.02, cP.y - uDim.y) * within;
    vec3 back = vec3(0.95, 0.84, 0.6) * (0.16 * uLight * under * (cid == 0 ? 0.3 : 1.0));
    outgoingLight = alb * (room + uKey * (key * shd * uLight) + back);
  }
}
#include <opaque_fragment>`);
  };
  m.customProgramCacheKey = () => 'cotan-window';
  return m;
}

lifeFor(84709, {
  title: /^Still Life with Game Fowl/,
  word: 'still',
  // (a small work: the kit keeps the whole of it in view, with the window under it; the camera a little to the left,
  // so the lit jamb on the right shows, and low enough to see the top of the sill as he does)
  stage: { out: 0.9, half: 0.9, cam: { dist: 2.0, side: -0.34, height: 0.74, fov: 58, lookU: 0.12, lookOut: 0.1, lookH: 0.95, floorOut: 0.38 } },
  wake: 2, ret: 2.4,
  linger: { near: 3.5, max: 28 },

  build(L) {
    const P = L.pal, col = (h, a = 0.12) => P.near(h, a);
    const V = this.V = { n: new THREE.Matrix4(), l: new THREE.Matrix4(), w: new THREE.Matrix4(), a: new THREE.Matrix4(), b: new THREE.Matrix4(), v: new THREE.Vector3(), sun: new THREE.Vector3() };
    this.B = new THREE.Matrix4().makeBasis(new THREE.Vector3(L.tx, 0, L.tz), new THREE.Vector3(0, 1, 0), new THREE.Vector3(L.nx, 0, L.nz)).setPosition(L.floor(U0, 0));
    const u = this.u = {
      uInv: { value: new THREE.Matrix4() }, uSun: { value: new THREE.Vector3(...SUN1).normalize() }, uJamb: { value: new THREE.Vector3(...JAMB1).normalize() }, uLight: { value: 0 },
      uKey: { value: new THREE.Color(0.74, 0.69, 0.585) }, uRoom: { value: new THREE.Color(1.0, 0.93, 0.8) },
      uOcc: { value: Array.from({ length: 6 }, () => new THREE.Vector4(0, -9, 0, 0)) }, uDim: { value: new THREE.Vector4(A, S, TOP, D) },
    };

    // ------------------------------------------------------------ the window: a block of his grey stone
    const stone = col('#b3a992', 0.06), wallF = col('#55514a', 0.05), wallS = col('#6f6a5e', 0.05), black = new THREE.Color('#000000');
    const niche = faces([
      [[[-XO, 0, D], [-A, 0, D], [-A, YT, D], [-XO, YT, D]], wallF], [[[A, 0, D], [XO, 0, D], [XO, YT, D], [A, YT, D]], wallF],          // the wall's face: left, right
      [[[-A, TOP, D], [A, TOP, D], [A, YT, D], [-A, YT, D]], wallF], [[[-A, 0, D], [A, 0, D], [A, S, D], [-A, S, D]], wallF],          // over the opening, under the sill
      [[[-A, S, D], [A, S, D], [A, S, 0], [-A, S, 0]], stone],                                                                        // the sill
      [[[-A, S, D], [-A, S, 0], [-A, TOP, 0], [-A, TOP, D]], stone], [[[A, S, 0], [A, S, D], [A, TOP, D], [A, TOP, 0]], stone],          // the jambs
      [[[-A, TOP, 0], [A, TOP, 0], [A, TOP, D], [-A, TOP, D]], stone],                                                                // the lintel, from under
      [[[-XO, 0, ZB], [-XO, 0, D], [-XO, YT, D], [-XO, YT, ZB]], wallS], [[[XO, 0, D], [XO, 0, ZB], [XO, YT, ZB], [XO, YT, D]], wallS],   // the block's sides and top
      [[[-XO, YT, D], [XO, YT, D], [XO, YT, ZB], [-XO, YT, ZB]], wallS],
    ]);

    // the dark behind: flush in the opening as the window first shows, left behind at the wall as the stone comes on out,
    // so that what is in the window comes forward out of the dark
    const dark = faces([[[[-A, S, 0], [A, S, 0], [A, TOP, 0], [-A, TOP, 0]], black, 8]]);

    // ------------------------------------------------------------ string
    const hemp = col('#cbc4b0', 0.04), hempD = col('#a39a84', 0.04);
    const string = tag(surf(6, 1, (uu, v, o) => { const ph = -uu * TAU; o.p.set(0.0026 * Math.cos(ph), -v, 0.0026 * Math.sin(ph)); o.c.copy(hemp); }), 7);
    const bow = (y, s = 1) => [
      shape(loop(0.006 * s, 0.0016, hemp), basis([0.85, 0.5, 0.15], [-0.5, 0.85, 0], [0.006 * s, y + 0.001, 0.004])),
      shape(loop(0.0055 * s, 0.0016, hempD), basis([-0.8, 0.55, 0.2], [0.55, 0.8, 0], [-0.006 * s, y, 0.003])),
    ];
    function shape(g, m) { g.applyMatrix4(m); return g; }

    // ------------------------------------------------------------ the quince (hung by its stalk, a leaf to either side)
    const quince = (() => {
      const R = 0.046, cy = -(0.014 + R), c1 = col('#ddd091', 0.08), c2 = col('#c4bf7f', 0.08), c3 = col('#94783f', 0.1);
      const body = surf(30, 20, (uu, v, o) => {
        const ph = uu * TAU, th = v * Math.PI, st = Math.sin(th), ct = Math.cos(th);
        const r = R * (1 + 0.05 * Math.sin(2 * ph + 0.8) * st + 0.035 * Math.cos(3 * ph + 0.3) * st * st + 0.05 * Math.max(0, -ct));      // broader below, a little uneven
        o.p.set(r * st * Math.cos(ph), cy + R * 0.97 * ct - 0.01 * bump(th, 0, 0.42) + 0.007 * bump(th, Math.PI, 0.3), r * st * Math.sin(ph));
        o.c.copy(c1).lerp(c2, clamp01(0.4 - 0.5 * ct + 0.2 * Math.sin(3 * ph + 1.3))).lerp(c3, 0.5 * bump(th, Math.PI, 0.25) + 0.75 * bump(th, 0, 0.3));
      });
      const stalk = tube(0.0042, 0.003, -0.02, 0.002, col('#5a3a26'));
      const leaf = (len, wid, x, y, droop, dk, lt, rib) => shape(surf(10, 16, (uu, v, o) => {
        const a = uu * 2 - 1, b = v, w = wid * Math.pow(Math.sin(Math.PI * Math.pow(0.03 + 0.97 * b, 0.75)), 0.75);
        o.p.set(len * b, a * w + 0.006 * Math.sin(b * 7) * b, droop * (0.42 * len * b * b + 0.3 * wid * a * a) + 0.0035 * Math.sin(a * 5 + b * 11));
        o.c.copy(dk).lerp(lt, clamp01(0.3 + 0.35 * Math.sin(b * 3) - 0.3 * Math.abs(a) + 0.25 * Math.pow(0.5 + 0.5 * Math.cos(Math.abs(a) * 9 - b * 16), 4))).lerp(rib, 0.6 * bump(a, 0, 0.09) * (1 - 0.6 * b));
      }), basis(x, y, [0, -0.011, 0.001]));
      return merge([body, stalk,
        leaf(0.092, 0.03, [-0.92, 0.12, 0.15], [0.1, 0.75, -0.6], 1, col('#36432d'), col('#6c7b53'), col('#98a27a')),
        leaf(0.086, 0.031, [0.85, 0.25, 0.25], [-0.2, 0.75, -0.6], -1, col('#2c3a28'), col('#586b45'), col('#8a9670')),
        ...bow(0.0, 0.75)], 1);
    })();

    // ------------------------------------------------------------ the cabbage: a tight head lapped in broad leaves, each with its
    // thick pale rib and the veins off it; hung by the stalk, a leaf or two come loose
    const cabbage = (() => {
      const R = 0.078, cy = -HUNG[1].mid, parts = [];
      const pale = col('#dfe2c6', 0.05), light = col('#b6c7a4', 0.06), mid = col('#84a080', 0.08), deep = col('#445c4b', 0.1), rimC = col('#8d8a5a', 0.1);
      parts.push(tube(0.011, 0.016, -0.03, 0.004, pale, 10));
      parts.push(surf(24, 16, (uu, v, o) => {
        const ph = uu * TAU, th = v * Math.PI, st = Math.sin(th), r = R * 0.95;
        o.p.set(r * st * Math.cos(ph), cy + r * 0.97 * Math.cos(th), r * st * Math.sin(ph)); o.c.copy(light).lerp(pale, 0.4 + 0.3 * Math.sin(ph * 5 + th * 4) * st);
      }));
      // [where round the head, how wide, how far down and under it reaches, how far it has come loose, how far off the head, how dark, how ruffled]
      const LEAVES = [
        [1.9, 1.55, 2.7, 0, 0.003, 0.0, 0.02], [4.0, 1.5, 2.66, 0, 0.006, 0.1, 0.02], [6.0, 1.5, 2.68, 0, 0.009, 0.15, 0.02],
        [0.75, 1.4, 2.3, 0.04, 0.013, 0.25, 0.03], [2.85, 1.4, 2.24, 0.06, 0.016, 0.32, 0.03], [4.95, 1.35, 2.2, 0.05, 0.019, 0.38, 0.03],
        [3.35, 1.1, 1.3, 0.38, 0.024, 0.55, 0.13], [0.3, 0.75, 1.75, 0.7, 0.027, 0.7, 0.1], [5.1, 1.0, 1.5, 0.5, 0.03, 0.7, 0.1],
      ];
      for (const [f0, wide, wrap, open, off, dark, ruf] of LEAVES) parts.push(surf(28, 26, (uu, v, o) => {
        const a = uu * 2 - 1, b = v, aa = Math.abs(a), th = 0.14 + b * wrap;
        const ph = f0 + a * wide * Math.pow(Math.sin(Math.PI * (0.07 + 0.86 * b)), 0.5);
        const edge = sstep(0.55, 1, Math.max(aa, b * b)), frill = Math.sin(11 * a + 5 * b + f0 * 3) * Math.sin(7 * b + 2 * a + f0) + 0.5 * Math.sin(17 * a * b + f0 * 2);
        const rib = bump(a, 0, 0.075 + 0.07 * (1 - b)) * sstep(1, 0.6, b);
        const lip = sstep(0.8, 1, Math.max(aa, b));
        const r = R + off + R * (0.045 * rib + 0.03 * lip) + R * ruf * edge * frill + open * R * (0.5 * b * b + 0.4 * b * b * b * b);
        o.p.set(r * Math.sin(th) * Math.cos(ph), cy + r * 0.97 * Math.cos(th) - open * 0.03 * b * b, r * Math.sin(th) * Math.sin(ph));
        o.c.copy(light).lerp(mid, clamp01(0.2 + 0.3 * b + 0.25 * aa + 0.3 * dark)).lerp(deep, clamp01(dark * 0.35 + 0.5 * sstep(0.5, 0.93, Math.max(aa, b * 0.97)) * (1 - 0.5 * open)))
          .lerp(pale, 0.55 * sstep(0.95, 1, Math.max(aa, b))).lerp(rimC, 0.35 * sstep(0.9, 1, Math.max(aa, b)) * open);
      }, 2));
      parts.push(...bow(0.0, 1.1));
      const g = merge(parts, 2); g.applyMatrix4(new THREE.Matrix4().makeRotationZ(-0.26).multiply(new THREE.Matrix4().makeRotationX(0.14)));      // (the stalk a little to the right of the head, as he has it)
      return g;
    })();

    // ------------------------------------------------------------ the melon, a wedge cut out of it; and the slice
    const rindD = col('#3d5236', 0.08), rindL = col('#6f8a5c', 0.08), rindP = col('#b9c097', 0.06), cream = col('#dfe0b4', 0.05), flesh = col('#eec4a8', 0.05), fleshD = col('#dba083', 0.06), pith = col('#e4c7a4', 0.05), seed = col('#f6ecd2', 0.03), gap = col('#c08f6a', 0.06);
    // the rind: dark green, pale stripes running pole to pole and a fine net between them
    const rindC = (o, ph, th) => {
      const stripe = Math.pow(0.5 + 0.5 * Math.cos(11 * ph), 4), net = Math.pow(0.5 + 0.5 * Math.sin(ph * 64 + 3 * Math.sin(th * 7)), 5) * (0.5 + 0.5 * Math.sin(th * 23 + ph * 9));
      o.c.copy(rindD).lerp(rindL, 0.35 + 0.3 * Math.sin(ph * 5 + th * 3)).lerp(rindP, clamp01(0.8 * stripe + 0.45 * net + 0.4 * bump(th, 0, 0.22) + 0.4 * bump(th, Math.PI, 0.22)));
    };
    // a cut face: the green skin, the pale band under it, the flesh
    const cutC = (o, rho, cav) => {
      if (rho > 0.965) o.c.copy(rindD); else if (rho > 0.915) o.c.copy(cream).lerp(rindL, sstep(0.94, 0.965, rho));
      else o.c.copy(fleshD).lerp(flesh, sstep(cav * 0.8, 0.8, rho)).lerp(cream, sstep(0.85, 0.915, rho));
    };
    const melon = (() => {
      const R = MELON.R, wh = 0.92, parts = [];
      parts.push(surf(46, 26, (uu, v, o) => {
        const ph = wh + uu * (TAU - 2 * wh), th = v * Math.PI, st = Math.sin(th), r = R * (1 + 0.012 * Math.cos(11 * ph) * st);
        o.p.set(r * st * Math.cos(ph), R * Math.cos(th), r * st * Math.sin(ph)); rindC(o, ph, th);
      }));
      const hollow = (rho, th, st) => {      // the middle, where the seeds are: scooped a little, and lumpy with them
        const cav = 0.5 * Math.pow(st, 0.7), inC = sstep(cav, cav * 0.5, rho), lump = Math.sin(rho * 52 + 3 * Math.sin(th * 9)) * Math.sin(th * 25 + 2 * Math.sin(rho * 18));
        return [cav, inC, lump, R * (0.07 * inC + 0.035 * inC * lump) * Math.min(1, st * 6)];
      };
      for (const sg of [1, -1]) {
        const ph = sg * wh, nx = Math.sin(wh), nz = -sg * Math.cos(wh);        // (the way the face looks, into the gap)
        parts.push(surf(20, 30, (uu, v, o) => {
          const rho = uu, th = v * Math.PI, st = Math.sin(th), [cav, inC, lump, dip] = hollow(rho, th, st);
          o.p.set(rho * R * st * Math.cos(ph) - nx * dip, R * Math.cos(th), rho * R * st * Math.sin(ph) - nz * dip);
          cutC(o, rho, cav); if (inC > 0.02) o.c.lerp(pith, inC).lerp(seed, inC * sstep(0.05, 0.5, lump) * 0.9).lerp(gap, inC * sstep(-0.35, -0.8, lump) * 0.6);
        }));
      }
      parts.push(surf(4, 30, (uu, v, o) => {      // the bottom of the hollow, between the two faces
        const th = v * Math.PI, st = Math.sin(th), dip = hollow(0, th, st)[3];
        o.p.set(-Math.sin(wh) * dip, R * Math.cos(th), (uu * 2 - 1) * Math.cos(wh) * dip);
        o.c.copy(pith).lerp(seed, sstep(0.05, 0.5, Math.sin(uu * 9 + th * 23) * Math.sin(th * 31)) * 0.9);
      }));
      return merge(parts, 3);
    })();
    const slice = (() => {
      const R = SLICE.R, RY = SLICE.RY, ws = 0.7, parts = [];
      const r0 = th => 0.5 + 0.035 * Math.sin(th * 13 + 0.5) + 0.025 * Math.sin(th * 29 + 2) + 0.018 * Math.sin(th * 47);      // where the seeds were pulled away: ragged
      parts.push(surf(10, 24, (uu, v, o) => {
        const ph = -ws + uu * 2 * ws, th = v * Math.PI, st = Math.sin(th);
        o.p.set(R * st * Math.cos(ph), RY * Math.cos(th), R * st * Math.sin(ph)); rindC(o, ph * 1.4 + 0.3, th);
      }));
      for (const sg of [1, -1]) parts.push(surf(8, 24, (uu, v, o) => {
        const th = v * Math.PI, st = Math.sin(th), rho = lerp(r0(th), 1, uu);
        o.p.set(rho * R * st * Math.cos(sg * ws), RY * Math.cos(th), rho * R * st * Math.sin(sg * ws)); cutC(o, rho, 0.5); o.c.lerp(flesh, 0.3);
      }));
      parts.push(surf(8, 24, (uu, v, o) => {
        const ph = -ws + uu * 2 * ws, th = v * Math.PI, st = Math.sin(th), q = r0(th);
        o.p.set(q * R * st * Math.cos(ph), RY * Math.cos(th), q * R * st * Math.sin(ph)); o.c.copy(flesh).lerp(seed, 0.45 + 0.3 * Math.sin(th * 21 + ph * 9));
      }));
      return merge(parts, 4);
    })();

    // ------------------------------------------------------------ the citron (deep furrows, a nipple at its end) and the cucumber
    const citron = (() => {
      const LEN = 0.125, c1 = col('#cdcd94', 0.08), c2 = col('#a5ad74', 0.08), c3 = col('#7f8c58', 0.1);
      const PR = [[0, 0], [0.05, 0.028], [0.2, 0.05], [0.45, 0.057], [0.66, 0.05], [0.8, 0.034], [0.9, 0.02], [0.96, 0.012], [1, 0]];
      return tag(surf(32, 26, (uu, v, o) => {
        const ph = uu * TAU, t = v, fur = Math.cos(4 * ph + 1.2 * t + 0.6 * Math.sin(ph)), lobe = 1 + (0.11 * fur + 0.035 * Math.cos(9 * ph - 2 * t + 1)) * sstep(0, 0.2, t) * sstep(1, 0.86, t);
        const r = profile(PR, t) * lobe * (1 + 0.025 * Math.sin(ph * 3 + t * 17));
        o.p.set(r * Math.cos(ph), (0.5 - t) * LEN, r * Math.sin(ph));
        o.c.copy(c1).lerp(c2, clamp01(0.45 - 0.5 * fur + 0.2 * Math.sin(t * 21 + ph * 4))).lerp(c3, 0.5 * sstep(0.82, 1, t) + 0.4 * sstep(0.12, 0, t) + 0.35 * sstep(-0.5, -1, fur));
      }), 5);
    })();
    const cuke = (() => {
      const LEN = 0.135, c1 = col('#4a643b', 0.08), c2 = col('#a4ad78', 0.08), c3 = col('#c4bf80', 0.08);
      const PR = [[0, 0], [0.04, 0.012], [0.15, 0.02], [0.5, 0.0235], [0.85, 0.021], [0.96, 0.013], [1, 0]];
      return tag(surf(22, 24, (uu, v, o) => {
        const ph = uu * TAU, t = v, wart = Math.pow(0.5 + 0.5 * Math.sin(ph * 7 + 1) * Math.sin(t * 34 + 2 * Math.sin(ph * 3)), 3), fur = Math.pow(0.5 + 0.5 * Math.cos(7 * ph), 2);
        const r = profile(PR, t) * (1 + (0.08 * wart - 0.05 * fur) * sstep(0, 0.12, t) * sstep(1, 0.9, t));
        o.p.set(r * Math.cos(ph) + 0.006 * Math.sin(t * Math.PI), (0.5 - t) * LEN, r * Math.sin(ph));
        o.c.copy(c2).lerp(c1, clamp01(0.75 * fur * (1 - 0.6 * t) + 0.2 * (1 - wart) * (1 - t))).lerp(c3, 0.7 * sstep(0.7, 1, t));
      }), 6);
    })();

    // ------------------------------------------------------------ the rig: every part, one draw call
    const rig = this.rig = L.rig(12, 84000, cotanLight(u));
    this.I = { niche: rig.add(rig.geo(niche)), dark: rig.add(rig.geo(dark)), quince: rig.add(rig.geo(quince)), cabbage: rig.add(rig.geo(cabbage)), melon: rig.add(rig.geo(melon)), slice: rig.add(rig.geo(slice)), citron: rig.add(rig.geo(citron)), cuke: rig.add(rig.geo(cuke)) };
    const sg = rig.geo(string); this.I.s0 = rig.add(sg); this.I.s1 = rig.add(sg);
    HUNG[0].id = this.I.quince; HUNG[0].sid = this.I.s0; HUNG[1].id = this.I.cabbage; HUNG[1].sid = this.I.s1;
    // how each thing on the sill lies when it has come to rest
    this.melonR = basis([0.38, 0.62, 0.69], [-0.62, -0.45, 0.64]);                              // the cut upwards and towards us; the end its stripes run to, down on the left
    this.sliceR = basis([0, -1, 0], [Math.cos(SLICE.yaw), 0, -Math.sin(SLICE.yaw)]);             // on its rind
    this.citronR = basis([1, 0, 0.1], [0.06, 0.66, -0.75]);                                    // its nipple down and towards us, over the edge
    this.cukeR = basis([1, 0, 0.2], [0.2, 0.06, -0.97]);                                         // end on
    this.stir = HUNG.map(() => ({ x: 0, vx: 0, z: 0, vz: 0 }));

    // ------------------------------------------------------------ on the floor: the block's shadow, thrown by the same light
    const fu = this.fu = { uInvS: { value: this.B.clone().invert() }, uSun: u.uSun, uBox: { value: new THREE.Vector4(XO, YT, ZB, D) }, uK: { value: new THREE.Vector2(0, 0) } };
    const fm = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, depthWrite: false, fog: false });
    fm.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, fu);
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform mat4 uInvS; uniform vec3 uSun; uniform vec4 uBox; uniform vec2 uK;')
        .replace('#include <opaque_fragment>', `{
  vec3 p = (uInvS * vec4(lifeP, 1.0)).xyz; p.y = 0.0;
  // how much of the block the way to the light passes through (a little: the soft edge of its shadow)
  vec3 lo = vec3(-uBox.x, 0.0, uBox.z), hi = vec3(uBox.x, uBox.y, uBox.w);
  vec3 t0 = (lo - p) / uSun, t1 = (hi - p) / uSun, ta = min(t0, t1), tb = max(t0, t1);
  float thrown = smoothstep(0.0, 0.3, min(tb.x, min(tb.y, tb.z)) - max(max(ta.x, ta.y), max(ta.z, 0.0)));
  // and close round its foot
  float foot = smoothstep(0.11, 0.0, length(max(vec2(abs(p.x) - uBox.x, p.z - uBox.w), 0.0)));
  diffuseColor.a = max(thrown * uK.y, foot * 0.4) * uK.x;
  outgoingLight = vec3(0.0);
}
#include <opaque_fragment>`);
    };
    fm.customProgramCacheKey = () => 'cotan-shadow';
    this.shade = L.decal({ w: 1.85, d: 0.9, u: U0 + 0.16, out: 0.36, material: fm });
    this.shade.renderOrder = 5;

    // ------------------------------------------------------------ the sounds: stone, two strings, a knock, and quiet
    const s = this.sc = score(L);
    s.hit(0.02, { d: 1.4, vol: 0.03, lp: 240, attack: 0.32 }); s.note(0.04, 52, 1.25, { type: 'sine', vol: 0.02, to: 43, attack: 0.3 });      // stone on stone
    s.note(T_OUT, 64, 0.32, { type: 'sine', vol: 0.045, to: 40, attack: 0.008 }); s.hit(T_OUT, { d: 0.13, vol: 0.028, lp: 360 });               // it stops
    s.note(T_OUT + 0.05, 220, 1.0, { type: 'triangle', vol: 0.012, attack: 0.005 }); s.note(T_OUT + 0.05, 440.6, 0.5, { type: 'sine', vol: 0.004 });   // the short string takes the weight
    s.note(T_OUT + 0.14, 146.8, 1.5, { type: 'triangle', vol: 0.014, attack: 0.006 }); s.note(T_OUT + 0.14, 294, 0.7, { type: 'sine', vol: 0.004 });   // and the long one
    s.hit(T_OUT + 0.2, { d: 0.5, vol: 0.012, lp: 300, attack: 0.05 });                                                                     // the melon rolls
    for (const [k, t] of this.knocks().entries()) { s.hit(t, { d: 0.05, vol: 0.02 * Math.pow(0.7, k), bp: 820, q: 2.2 }); s.note(t, 310 - 12 * k, 0.07, { type: 'triangle', vol: 0.012 * Math.pow(0.7, k), attack: 0.002 }); }
    s.loop(BREATH.t0, BREATH.every, [{ t: 0, noise: true, d: 2.0, vol: 0.006, lp: 520, attack: 0.8 }]);
    s.done();

    this.lin = 0; this.run = 0; this.at = 0; this.hold = 0; this.hide();
  },

  // ---------------------------------------------------------------- how things move
  // What is left of a swing at show-time t: it dies away, and by T_STILL it has stopped altogether.
  left(t, tau) { const s = t - T_OUT; return s <= 0 ? 1 : Math.exp(-s / tau) * (1 - ease.smooth(ramp(t, T_STILL - 2.4, T_STILL))); },
  // The slice's seesaw (radians): it goes on longest.
  seesaw(t) { const s = t - T_OUT - 0.12; return s <= 0 ? 0 : 0.34 * Math.exp(-s / 2.3) * Math.sin(TAU * s / 0.92) * (1 - ease.smooth(ramp(t, T_STILL - 1.4, T_STILL))) * (1 - Math.exp(-s * 6)); },
  // When an end of it knocks on the sill.
  knocks() { const out = []; for (let k = 0; k < 7; k++) out.push(T_OUT + 0.12 + 0.92 * (0.25 + 0.5 * k)); return out; },
  // A breath of air, once all is still: a swing of a few degrees that dies away (0 otherwise).
  breath(t, period) {
    const s = t - BREATH.t0; if (s < 0) return 0;
    const q = s - Math.floor(s / BREATH.every) * BREATH.every;
    return 0.028 * Math.exp(-q / 2.4) * Math.sin(TAU * q / period) * (1 - Math.exp(-q * 2.5));
  },

  hide() { this.rig.mesh.visible = false; this.shade.visible = false; },
  // (a look that finds it still out carries on from where it had got to, not from the top)
  start(L, resumed) { this.lin = resumed ? this.at - L.t : 0; this.run = 0; this.hold = 0; this.sc.from(resumed ? this.at : 0); },
  back(L) { this.hold = this.out || 0; if (!L.quiet) L.k.synth.noise(1.2, { vol: 0.012, lp: 260 }); },
  end() { this.hide(); },
  reset() { this.hide(); this.lin = this.run = this.at = 0; for (const q of this.stir) q.x = q.vx = q.z = q.vz = 0; },

  update(L, dt) {
    const ph = L.phase, showing = ph === 'wake' || ph === 'play', linger = ph === 'linger', back = ph === 'return';
    if (!showing && !linger && !back) { this.hide(); return; }
    const calm = L.calm, soft = calm ? 0.5 : 1, V = this.V, rig = this.rig, I = this.I, u = this.u;
    // t: the show's clock (it runs on while the window stays out for the toy, and is held on the way back);
    // ts: the same, running on through the way back too, for what is still swinging
    if (linger) this.lin += dt; else if (back) this.run += dt;
    const t = this.at = L.t + this.lin, ts = t + this.run, gone = back ? L.ret : 0;
    if (showing) this.sc.play(t);
    const voice = L.voice(); voice.level = calm ? 0.6 : 1; voice.place();

    // ---- the window slides out of the wall, and stops short; when the look ends, back in
    const q = ramp(t, 0, T_OUT);
    if (!back) this.out = (1 - Math.cos(q * 2.25)) / (1 - Math.cos(2.25));
    const out = back ? this.hold * (1 - ease.inOut(ramp(gone, 0.22, 1))) : this.out;
    V.n.copy(this.B).multiply(V.a.makeTranslation(0, 0, -(D + 0.075) * (1 - out)));
    u.uInv.value.copy(V.n).invert();
    rig.mesh.visible = out > 0.002;
    rig.mat(I.niche, V.n);
    rig.mat(I.dark, V.w.copy(V.n).multiply(V.a.makeTranslation(0, 0, Math.min(D - 0.0006, 0.012 + (D + 0.075) * (1 - out)))));

    // ---- the light comes up, and round
    const lit = ease.smooth(ramp(t, 0.7, 2.6)) * (back ? 1 - ease.smooth(ramp(gone, 0, 0.5)) : 1), round = ease.inOut(ramp(t, T_SUN[0], T_SUN[1]));
    u.uLight.value = lit * (0.9 + 0.1 * ease.smooth(ramp(t, T_STILL - 1, T_STILL + 0.8)));      // (and a shade fuller as the last thing comes to rest)
    u.uSun.value.set(lerp(SUN0[0], SUN1[0], round), lerp(SUN0[1], SUN1[1], round), lerp(SUN0[2], SUN1[2], round)).normalize();
    u.uJamb.value.set(lerp(SUN0[0], JAMB1[0], round), lerp(SUN0[1], JAMB1[1], round), lerp(SUN0[2], JAMB1[2], round)).normalize();
    this.shade.visible = out > 0.02; this.fu.uBox.value.w = D - (D + 0.075) * (1 - out); this.fu.uK.value.set(ease.smooth(ramp(out, 0.02, 0.5)), 0.5 * lit);

    // ---- what hangs: carried out with the window, swinging from the stop, winding on its string; less each time
    this.toyWind(L, dt, linger || showing);
    const fade = back ? 1 - ease.smooth(ramp(gone, 0, 0.35)) : 1;
    HUNG.forEach((h, i) => {
      const s = ts - T_OUT, k = this.left(ts, h.tau) * fade * soft, st = this.stir[i];
      let ax = 0, az = -h.lag * ease.smooth(ramp(t, 0.05, 0.5)) * soft * fade, tw = 0;
      if (s > 0) {
        ax = h.ax * k * Math.sin(TAU * s / h.px + 0.5 * i);
        az = k * (-h.lag * Math.cos(TAU * s / h.pz) + h.az * Math.sin(TAU * s / h.pz));
        const sw = calm ? s * 0.5 : s;
        tw = h.tw * soft * fade * Math.exp(-s / h.tt) * (1 - ease.smooth(ramp(ts, T_STILL - 2.0, T_STILL))) * Math.sin(TAU * sw / h.pt);
        ax += (this.breath(ts, h.px) * (i ? 0.8 : 1) * soft + st.x) * fade; az += st.z * fade; tw += st.x * 1.6 * fade;
      }
      V.l.makeTranslation(h.x, TOP, h.z).multiply(V.a.makeRotationZ(ax)).multiply(V.a.makeRotationX(-az));
      rig.mat(h.sid, V.w.copy(V.n).multiply(V.l).multiply(V.a.makeScale(1, h.len, 1)));
      V.l.multiply(V.a.makeTranslation(0, -h.len, 0)).multiply(V.a.makeRotationY(tw + (i ? 0.5 : -0.2)));
      rig.mat(h.id, V.w.copy(V.n).multiply(V.l));
      V.v.set(0, -h.mid, 0).applyMatrix4(V.l); u.uOcc.value[i].set(V.v.x, V.v.y, V.v.z, h.r);
    });

    // ---- what lies on the sill: forward to where he painted it when the window stops, rocking, then still
    const s = t - T_OUT, slid = (b, tau, per) => (s <= 0 ? b : b * this.left(t, tau) * Math.cos(TAU * s / per)) * (calm ? 0.6 : 1);
    { // the melon rolls forward on its round, and back, and a little less
      const M = MELON, dz = slid(M.back, 1.15, 1.5), wob = s > 0 ? 0.07 * soft * this.left(t, 1.6) * Math.sin(TAU * s / 1.1) : 0;
      V.l.makeTranslation(M.x, S + M.R, M.z - dz).multiply(V.a.makeRotationX(-dz / M.R)).multiply(V.a.makeRotationZ(wob)).multiply(this.melonR);
      rig.mat(I.melon, V.w.copy(V.n).multiply(V.l)); u.uOcc.value[2].set(M.x, S + M.R, M.z - dz, M.R * 0.96);
    }
    { // the slice slides up beside it and seesaws on its rind, end to end, and rocks a little across
      const C = SLICE, dz = slid(C.back, 0.7, 2.6), a = C.tilt + this.seesaw(t) * soft, b = s > 0 ? 0.2 * soft * this.left(t, 1.5) * Math.sin(TAU * s / 0.7 + 1) : 0;
      const cy = Math.cos(C.yaw), sy = Math.sin(C.yaw);
      V.l.makeTranslation(C.x - C.RY * a * cy + C.R * b * sy, S + C.R, C.z - dz + C.RY * a * sy + C.R * b * cy).multiply(this.sliceR).multiply(V.a.makeRotationZ(a)).multiply(V.a.makeRotationY(b));
      rig.mat(I.slice, V.w.copy(V.n).multiply(V.l)); u.uOcc.value[3].set(C.x, S + 0.03, C.z - dz, 0.036);
    }
    { // the citron noses over the edge and nods
      const C = CITRON, dz = slid(C.back, 0.8, 2.1), nod = s > 0 ? 0.13 * soft * this.left(t, 1.3) * Math.sin(TAU * s / 0.8) : 0;
      V.l.makeTranslation(C.x, S + 0.046, C.z - dz).multiply(V.a.makeRotationX(nod)).multiply(this.citronR).multiply(V.a.makeRotationY(nod * 0.8));
      rig.mat(I.citron, V.w.copy(V.n).multiply(V.l)); u.uOcc.value[4].set(C.x, S + 0.05, C.z - dz, 0.055);
    }
    { // the cucumber slides out over the lip, rolling a little, and dips
      const C = CUKE, dz = slid(C.back, 0.6, 3.0), roll = s > 0 ? 0.5 * soft * this.left(t, 1.2) * Math.sin(TAU * s / 0.95) : 0;
      const dip = 0.1 * ease.smooth(ramp(s, 0.1, 0.9)) + (s > 0 ? 0.06 * this.left(t, 0.9) * Math.sin(TAU * s / 0.6) : 0);
      V.l.makeTranslation(C.x + 0.012 * roll, S + 0.0235, C.z - dz).multiply(V.a.makeRotationX(dip)).multiply(this.cukeR).multiply(V.a.makeRotationY(roll));
      rig.mat(I.cuke, V.w.copy(V.n).multiply(V.l)); u.uOcc.value[5].set(C.x, S + 0.022, C.z - dz + 0.02, 0.026);
    }
    if (back && L.ret >= 1) this.hide();
  },

  // The toy's draught: driving near the window sets what hangs swinging; it dies away when the toy is still.
  toyWind(L, dt, on) {
    const G = L.k.G, veh = G.vehicle, near = on && dt > 0 && G.state === 'play' && veh && veh.group.visible && Math.abs(veh.pos.y - L.y) < 0.5;
    let fu = 0, fo = 0;
    if (near) {
      const p = L.local(veh.pos.x, veh.pos.z), d = Math.hypot(p.u - U0, p.out - 0.3), k = clamp01(1 - (d - 0.5) / 1.3);
      fu = (veh.vel.x * L.tx + veh.vel.z * L.tz) * k; fo = (veh.vel.x * L.nx + veh.vel.z * L.nz) * k;
    }
    const h = Math.min(dt, 0.05);
    HUNG.forEach((H, i) => {
      const st = this.stir[i], wx = TAU / H.px, wz = TAU / H.pz, zeta = 0.11;
      st.vx += (-wx * wx * st.x - 2 * zeta * wx * st.vx + fu * 0.9) * h; st.x += st.vx * h;
      st.vz += (-wz * wz * st.z - 2 * zeta * wz * st.vz + fo * 0.8) * h; st.z += st.vz * h;
      st.x = Math.max(-0.2, Math.min(0.2, st.x)); st.z = Math.max(-0.16, Math.min(0.16, st.z));
    });
    return near;
  },
});
