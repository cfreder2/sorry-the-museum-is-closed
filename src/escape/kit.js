// What gets out of a living painting (src/escapes.js, docs/ESCAPES.md): the parts every escapee is made from.
//
//   escapeFor(id, spec)   one escapee for the living work with that id (a file here per work; src/escapes.js runs them)
//
// spec = {
//   name, tag            'the keg float', 'KEG FLOAT' (the tracker's and the terminal's name for it)
//   line                 what is said the first time it gets out
//   count                how many creatures it is (a flock of five hats is 5): the kit may draw fewer where memory is short
//   speed, herd          metres a second wandering, and with the toy behind it
//   radius, height       a ball round all of it, for the guard (metres)
//   rest: [a, b]         seconds it stays where it has got to, before it moves on
//   react                in a robot's light: 'none' (does not care), 'still' (stops where it is), 'off' (ambles off)
//   hold                 seconds a robot's lamp rests on it before the lamp goes warm (1.4 if not given)
//   need                 metres of clear floor it keeps round its middle (0.42)
//   where(E, k, g)       somewhere it would rather wander to ({ x, z }), or null: g is the floor it knows (guardplan)
//   colors               hex colours of its strokes when it comes apart (the work's own palette is mixed in)
//   chips                paid when the toy brings it home
//   async build(E, L, kit)   make it under E.group (the kit guards every material); L is the work's Life, built
//   pose(E, dt, k)       every frame it has a body: E.x, E.z, E.y (floor), E.yaw, E.v (speed now), E.t, E.lit (0..1 in a
//                        robot's light), E.led (the toy is bringing it home), E.n (creatures to draw), E.gone (0..1 coming apart)
//   hide(L, S)           every frame of the work's show while it is out: take the escaped thing out of the show
//   voice(E, k, vol)     its small sound, now and then (vol: by how far it is; it carries a little through walls)
//   trail(E)             a mark to leave behind it: { color, size, long } or null
// }
//
// One escapee is one mesh if it can be: its parts are merged, or one BatchedMesh; what it carries of its world (a patch of
// sea, of sandy path) is one more. Every material goes through paint() or patch() here and the kit's guard, so not a
// pixel of it can be drawn over a canvas, whichever room it is in.

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { rng } from '../paintlife.js';

export const SPECS = [];
export function escapeFor(id, spec) { SPECS.push({ id, ...spec }); }

const TAU = Math.PI * 2;

// One small texture for every escapee: the left half a soft, ragged dab of paint (alpha), the right half solid.
let _atlas = null;
export function atlas() {
  if (_atlas) return _atlas;
  const W = 128, H = 64, c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d'), img = g.createImageData(W, H), R = rng(77);
  const lobes = Array.from({ length: 7 }, () => [R() * TAU, 0.05 + R() * 0.11]);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const o = (y * W + x) * 4; img.data[o] = img.data[o + 1] = img.data[o + 2] = 255;
    if (x >= 64) { img.data[o + 3] = 255; continue; }
    const u = (x + 0.5) / 32 - 1, v = (y + 0.5) / 32 - 1, a = Math.atan2(v, u);
    let e = 0.8; lobes.forEach(([ph, am], i) => { e += am * Math.sin(a * (i + 2) + ph); });
    const d = Math.hypot(u, v * 1.08) / e;
    img.data[o + 3] = Math.round(255 * Math.max(0, Math.min(1, (1 - d) * 3.2 + 0.5)));
  }
  g.putImageData(img, 0, 0);
  _atlas = new THREE.CanvasTexture(c); _atlas.colorSpace = THREE.SRGBColorSpace; _atlas.generateMipmaps = false; _atlas.minFilter = _atlas.magFilter = THREE.LinearFilter;
  return _atlas;
}
const SOLID_U = 0.76, SOLID_V = 0.5;

// The body's material: vertex colours that glow a little in themselves (the galleries are dark at night), cut out by
// the atlas (dabs), and uGone (0 to 1) to come apart with: specks of it go, till none is left.
export function paint({ glow = 0.42, rough = 0.9, map = null } = {}) {
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: rough, metalness: 0, emissive: 0xffffff, emissiveIntensity: glow, side: THREE.DoubleSide, map: map || atlas(), alphaTest: 0.5 });
  const u = m.userData.u = { uGone: { value: 0 } };
  m.onBeforeCompile = sh => {
    sh.uniforms.uGone = u.uGone;
    sh.fragmentShader = 'uniform float uGone;\n' + sh.fragmentShader
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n  totalEmissiveRadiance *= vColor.rgb;')
      .replace('#include <alphatest_fragment>', '#include <alphatest_fragment>\n  if (uGone > 0.0) { vec2 gq = floor(gl_FragCoord.xy / 2.0); if (fract(sin(dot(gq, vec2(12.9898, 78.233))) * 43758.5453) < uGone * 1.02) discard; }');
  };
  m.customProgramCacheKey = () => 'escapepaint';
  return m;
}

// ------------------------------------------------------------------ geometry --
// Every part ends as a plain (not indexed) geometry of position, normal, color and uv, so parts merge.
const C0 = new THREE.Color();
function plain(g, color) {
  if (g.index) g = g.toNonIndexed();
  const n = g.attributes.position.count;
  if (!g.attributes.normal) g.computeVertexNormals();
  if (!g.attributes.color || color != null) { const c = new Float32Array(n * 3); C0.set(color == null ? 0xffffff : color); for (let i = 0; i < n; i++) { c[i * 3] = C0.r; c[i * 3 + 1] = C0.g; c[i * 3 + 2] = C0.b; } g.setAttribute('color', new THREE.BufferAttribute(c, 3)); }
  const uv = new Float32Array(n * 2); for (let i = 0; i < n; i++) { uv[i * 2] = SOLID_U; uv[i * 2 + 1] = SOLID_V; }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'color', 'uv'].includes(k)) g.deleteAttribute(k);
  return g;
}
// A solid thing in one colour (or coloured by fn(x, y, z, into) -> THREE.Color), ready to merge.
export function solid(g, color, fn) {
  g = plain(g, color == null ? 0xffffff : color);
  if (fn) { const p = g.attributes.position, c = g.attributes.color; for (let i = 0; i < p.count; i++) { fn(p.getX(i), p.getY(i), p.getZ(i), C0); c.setXYZ(i, C0.r, C0.g, C0.b); } }
  return g;
}
// Parts of the work's own show, taken out of its rig (a BatchedMesh): the very strokes the show is made of. insts: the
// rig's instance numbers; each comes back in its own space, as the show poses it. Whether its uv is the show's own
// (useMap: draw it with the show's texture) or the solid cell of ours.
export function take(L, insts, { useMap = false } = {}) {
  const m = L.spec.rig.mesh, src = m.geometry, A = src.attributes, out = [];
  for (const inst of [].concat(insts)) {
    const r = m.getGeometryRangeAt(m.getGeometryIdAt(inst)), g = new THREE.BufferGeometry();
    const idx = src.index && r.indexStart >= 0 && r.indexCount > 0 ? Array.from(src.index.array.slice(r.indexStart, r.indexStart + r.indexCount)) : null;
    for (const name of ['position', 'normal', 'color', 'uv']) {
      const a = A[name]; if (!a) continue;
      const sz = a.itemSize, n = idx ? idx.length : r.vertexCount, arr = new Float32Array(n * sz);
      if (idx) for (let i = 0; i < n; i++) for (let j = 0; j < sz; j++) arr[i * sz + j] = a.array[idx[i] * sz + j];
      else arr.set(a.array.subarray(r.vertexStart * sz, (r.vertexStart + r.vertexCount) * sz));
      g.setAttribute(name, new THREE.BufferAttribute(arr, sz));
    }
    if (!useMap || !g.attributes.uv) { const keep = g.attributes.color; plain(g); if (keep) g.setAttribute('color', keep); }
    out.push(g);
  }
  return Array.isArray(insts) ? out : out[0];
}
// Dabs of paint: flat four-sided marks lying on a surface. list of { p: Vector3, n: Vector3 (out of the surface),
// s (size, metres), l (how long for its width, 1 = round), c: THREE.Color, a (turned about n, radians) }.
// A show's model, made light enough to walk about the building: its smooth bodies are kept; each soft dab of paint over
// them (a little leaf of six triangles) becomes a kite of two, and only `dab` of them are kept (a little larger, to cover);
// of the curls of light (twelve triangles) `curl` are kept as they are. R: a seeded random.
export function thin(g, { dab = 0.7, curl = 0, R = Math.random, grow = null } = {}) {
  const P = g.attributes.position.array, nt = P.length / 9, par = new Int32Array(nt), names = Object.keys(g.attributes), seen = new Map();
  for (let i = 0; i < nt; i++) par[i] = i;
  const find = i => { while (par[i] !== i) { par[i] = par[par[i]]; i = par[i]; } return i; };
  for (let t = 0; t < nt; t++) for (let v = 0; v < 3; v++) { const i = t * 9 + v * 3, key = Math.round(P[i] * 1e5) + ',' + Math.round(P[i + 1] * 1e5) + ',' + Math.round(P[i + 2] * 1e5), q = seen.get(key); if (q == null) seen.set(key, t); else { const a = find(q), b = find(t); if (a !== b) par[a] = b; } }
  const groups = new Map(); for (let t = 0; t < nt; t++) { const r = find(t); let l = groups.get(r); if (!l) groups.set(r, l = []); l.push(t); }
  const verts = [], N = g.attributes.normal && g.attributes.normal.array, gk = grow == null ? (dab < 1 ? 1 / Math.sqrt(Math.max(0.3, dab)) : 1) : grow;      // (vertex numbers, in threes; negative: a made vertex)
  const made = [], D2 = (a, b) => (P[a * 3] - P[b * 3]) ** 2 + (P[a * 3 + 1] - P[b * 3 + 1]) ** 2 + (P[a * 3 + 2] - P[b * 3 + 2]) ** 2;
  for (const tris of groups.values()) {
    if (tris.length === 12) { if (R() < curl) for (const t of tris) verts.push(t * 3, t * 3 + 1, t * 3 + 2); continue; }
    if (tris.length !== 6) { for (const t of tris) verts.push(t * 3, t * 3 + 1, t * 3 + 2); continue; }
    if (R() >= dab) continue;
    const vs = []; for (const t of tris) vs.push(t * 3, t * 3 + 1, t * 3 + 2);
    let A = vs[0], B = vs[1], best = -1; for (let i = 0; i < vs.length; i++) for (let j = i + 1; j < vs.length; j++) { const d = D2(vs[i], vs[j]); if (d > best) { best = d; A = vs[i]; B = vs[j]; } }
    const ax = P[B * 3] - P[A * 3], ay = P[B * 3 + 1] - P[A * 3 + 1], az = P[B * 3 + 2] - P[A * 3 + 2], al = ax * ax + ay * ay + az * az || 1e-12;
    const perp = v => { const x = P[v * 3] - P[A * 3], y = P[v * 3 + 1] - P[A * 3 + 1], z = P[v * 3 + 2] - P[A * 3 + 2], f = (x * ax + y * ay + z * az) / al; return [x - ax * f, y - ay * f, z - az * f]; };
    let C = -1, cp = null, cb = 0; for (const v of vs) { const q = perp(v), d = q[0] * q[0] + q[1] * q[1] + q[2] * q[2]; if (d > cb) { cb = d; C = v; cp = q; } }
    if (C < 0) continue;
    let Dv = -1, db = 0; for (const v of vs) { const q = perp(v), d = q[0] * cp[0] + q[1] * cp[1] + q[2] * cp[2]; if (d < db) { db = d; Dv = v; } }
    // (the kite, a little larger about its middle; wound as the dab was, so the light falls on it as it did)
    const quad = Dv < 0 ? [A, C, B] : [A, C, B, Dv], cx = quad.reduce((s, v) => s + P[v * 3], 0) / quad.length, cy = quad.reduce((s, v) => s + P[v * 3 + 1], 0) / quad.length, cz = quad.reduce((s, v) => s + P[v * 3 + 2], 0) / quad.length;
    const id = quad.map(v => { made.push({ v, x: cx + (P[v * 3] - cx) * gk, y: cy + (P[v * 3 + 1] - cy) * gk, z: cz + (P[v * 3 + 2] - cz) * gk }); return -made.length; });
    const m = i => made[-id[i] - 1], e1 = [m(1).x - m(0).x, m(1).y - m(0).y, m(1).z - m(0).z], e2 = [m(2).x - m(0).x, m(2).y - m(0).y, m(2).z - m(0).z];
    const flip = N ? (e1[1] * e2[2] - e1[2] * e2[1]) * N[A * 3] + (e1[2] * e2[0] - e1[0] * e2[2]) * N[A * 3 + 1] + (e1[0] * e2[1] - e1[1] * e2[0]) * N[A * 3 + 2] < 0 : false;
    if (flip) verts.push(id[0], id[2], id[1]); else verts.push(id[0], id[1], id[2]);
    if (id.length === 4) { if (flip) verts.push(id[0], id[3], id[2]); else verts.push(id[0], id[2], id[3]); }
  }
  const out = new THREE.BufferGeometry();
  for (const name of names) {
    const a = g.attributes[name], sz = a.itemSize, arr = new Float32Array(verts.length * sz);
    for (let i = 0; i < verts.length; i++) { const v = verts[i], src = v < 0 ? made[-v - 1].v : v; for (let j = 0; j < sz; j++) arr[i * sz + j] = a.array[src * sz + j]; if (v < 0 && name === 'position') { const q = made[-v - 1]; arr[i * 3] = q.x; arr[i * 3 + 1] = q.y; arr[i * 3 + 2] = q.z; } }
    out.setAttribute(name, new THREE.BufferAttribute(arr, sz));
  }
  return out;
}

const _t = new THREE.Vector3(), _b = new THREE.Vector3(), _n = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0), _x = new THREE.Vector3(1, 0, 0);
export function dabs(list, lift = 0.003) {
  const n = list.length, P = new Float32Array(n * 18), N = new Float32Array(n * 18), C = new Float32Array(n * 18), U = new Float32Array(n * 12);
  const Q = [[-1, -1], [1, -1], [1, 1], [-1, -1], [1, 1], [-1, 1]];
  list.forEach((d, i) => {
    _n.copy(d.n).normalize(); _t.crossVectors(Math.abs(_n.y) > 0.92 ? _x : _up, _n).normalize(); _b.crossVectors(_n, _t);
    const a = d.a || 0, ca = Math.cos(a), sa = Math.sin(a), w = d.s / 2, h = w * (d.l || 1);
    Q.forEach(([qx, qy], j) => {
      const lx = qx * w, ly = qy * h, tx = lx * ca - ly * sa, ty = lx * sa + ly * ca, o = i * 18 + j * 3;
      P[o] = d.p.x + _t.x * tx + _b.x * ty + _n.x * lift; P[o + 1] = d.p.y + _t.y * tx + _b.y * ty + _n.y * lift; P[o + 2] = d.p.z + _t.z * tx + _b.z * ty + _n.z * lift;
      N[o] = _n.x; N[o + 1] = _n.y; N[o + 2] = _n.z; C[o] = d.c.r; C[o + 1] = d.c.g; C[o + 2] = d.c.b;
      U[i * 12 + j * 2] = 0.02 + (qx * 0.5 + 0.5) * 0.46; U[i * 12 + j * 2 + 1] = 0.03 + (qy * 0.5 + 0.5) * 0.94;
    });
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.BufferAttribute(N, 3));
  g.setAttribute('color', new THREE.BufferAttribute(C, 3)); g.setAttribute('uv', new THREE.BufferAttribute(U, 2));
  return g;
}
// Dabs all over a ball (centre, radii): n of them, coloured by pick(nx, ny, nz, R) -> THREE.Color; size [a, b].
export function ballDabs(c, r, n, pick, size, R, { long = 1.3, out = 1.0 } = {}) {
  const list = [];
  for (let i = 0; i < n; i++) {
    const y = 1 - 2 * (i + 0.5) / n, q = Math.sqrt(1 - y * y), a = i * 2.39996 + R() * 0.5, x = Math.cos(a) * q, z = Math.sin(a) * q;
    const nn = new THREE.Vector3(x / r[0], y / r[1], z / r[2]).normalize();
    list.push({ p: new THREE.Vector3(c[0] + x * r[0] * out, c[1] + y * r[1] * out, c[2] + z * r[2] * out), n: nn, s: size[0] + R() * (size[1] - size[0]), l: long, a: R() * TAU, c: pick(nn.x, nn.y, nn.z, R).clone() });
  }
  return dabs(list);
}
export const ball = (c, r, color, seg = 12) => { const g = new THREE.SphereGeometry(1, seg, Math.max(6, seg - 4)); g.scale(r[0], r[1], r[2]); g.translate(c[0], c[1], c[2]); return solid(g, color); };
export const merge = list => mergeGeometries(list.map(g => (g.attributes.uv && g.attributes.color && !g.index ? g : plain(g))), false);

// Several parts, each posed by itself, in one draw call: a BatchedMesh of the given geometries (plain ones: solid(),
// take(), dabs(), merge()). B.add(g) -> a part of geometry number g; B.put(i, x, y, z, yaw, pitch, roll, s); B.show(i, on).
export function batch(geos, max, material) {
  let verts = 0; for (const g of geos) verts += g.attributes.position.count;
  const mesh = new THREE.BatchedMesh(max, verts, 0, material);
  mesh.perObjectFrustumCulled = false; mesh.sortObjects = false; mesh.frustumCulled = false;
  const ids = geos.map(g => mesh.addGeometry(g)), e = new THREE.Euler(0, 0, 0, 'YXZ'), q = new THREE.Quaternion(), v = new THREE.Vector3(), s3 = new THREE.Vector3(), m = new THREE.Matrix4();
  for (const g of geos) g.dispose();
  return {
    mesh, m,
    add: g => mesh.addInstance(ids[g]),
    put(i, x, y, z, yaw = 0, pitch = 0, roll = 0, s = 1) { e.set(pitch, yaw, roll, 'YXZ'); q.setFromEuler(e); if (typeof s === 'number') s3.set(s, s, s); else s3.copy(s); mesh.setMatrixAt(i, m.compose(v.set(x, y, z), q, s3)); },
    mat(i, mm) { mesh.setMatrixAt(i, mm); },
    show(i, on) { mesh.setVisibleAt(i, on); },
  };
}

// ------------------------------------------------------------------ the patch of its world it carries --
// A ragged patch on the floor, painted in strokes (map: a strokes() texture from src/life/brush.js, whose alpha is each
// stroke's number, so the edge breaks up stroke by stroke). uGrow 0..1: how much of it there is (it drains to nothing).
// wave: metres of swell (a sea); the same swell is waveAt() on the CPU, for what floats on it.
export function patch({ r = 0.7, map, tile = 1.1, wave = 0, bright = 1, crest = 0xffffff, foam = 0 } = {}) {
  const g = new THREE.PlaneGeometry(2, 2, wave ? 22 : 1, wave ? 22 : 1); g.rotateX(-Math.PI / 2);
  const u = { uGrow: { value: 1 }, uT: { value: 0 }, uWave: { value: wave }, uTile: { value: r / tile }, uCrest: { value: new THREE.Color(crest) }, uFoam: { value: foam }, uBright: { value: bright } };
  const m = new THREE.MeshBasicMaterial({ map, transparent: true, depthWrite: false, toneMapped: true, side: THREE.DoubleSide });
  m.userData.u = u;
  m.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, u);
    sh.vertexShader = 'uniform float uT, uWave; varying vec2 vQ; varying float vH;\n' + WAVE + sh.vertexShader
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n  vQ = position.xz; vH = uWave > 0.0 ? swell(position.xz, uT) : 0.0; transformed.y += vH * uWave * smoothstep(1.0, 0.55, length(position.xz));');
    sh.fragmentShader = 'uniform float uGrow, uTile, uFoam, uBright; uniform vec3 uCrest; varying vec2 vQ; varying float vH;\n' + sh.fragmentShader
      .replace('#include <map_fragment>', `
  vec4 tx = texture2D(map, vQ * uTile + 0.5);
  float th = atan(vQ.y, vQ.x), rr = length(vQ) / (0.86 * (1.0 + 0.07 * sin(3.0 * th + 1.0) + 0.045 * sin(5.0 * th + 0.3) + 0.03 * sin(8.0 * th + 2.1)));
  float edge = (uGrow - rr) + (tx.a - 0.66) * 0.3;
  float pa = smoothstep(0.0, 0.07, edge) * step(0.001, uGrow);
  vec3 pc = tx.rgb * uBright;
  pc *= 0.82 + 0.3 * vH;
  pc = mix(pc, uCrest, uFoam * 0.5 * smoothstep(0.45, 1.0, vH) * step(0.7, tx.a));
  pc = mix(pc, uCrest, uFoam * smoothstep(0.07, 0.0, abs(rr - uGrow * 0.9)) * step(0.74, tx.a));
  diffuseColor = vec4(pc, pa);`);
  };
  m.customProgramCacheKey = () => 'escapepatch';
  const mesh = new THREE.Mesh(g, m); mesh.scale.set(r, 1, r); mesh.renderOrder = 5; mesh.userData.u = u; mesh.userData.r = r;
  return mesh;
}
const WAVE = /* glsl */`
float swell(vec2 q, float t) { return sin(q.x * 4.6 + q.y * 2.1 - t * 2.4) * 0.6 + sin(q.x * -3.1 + q.y * 6.3 - t * 3.6) * 0.3 + sin(q.x * 9.0 - q.y * 7.0 + t * 5.1) * 0.12; }
`;
export const swellAt = (x, z, t) => Math.sin(x * 4.6 + z * 2.1 - t * 2.4) * 0.6 + Math.sin(x * -3.1 + z * 6.3 - t * 3.6) * 0.3 + Math.sin(x * 9.0 - z * 7.0 + t * 5.1) * 0.12;

export const col = (pal, hex, k = 0.2) => (pal ? pal.near(hex, k) : new THREE.Color(hex));
export { TAU };
