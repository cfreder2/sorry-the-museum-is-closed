// The roads on a winter night, east of the museum and all the way round: what the ploughs, the salt trucks and the
// street lights have made of them. streets.js lays the streets; this puts the winter on them.
//
//   * The map (one 2048 x 1024 picture of the whole street grid, painted here once at start-up) that the road shader
//     reads (streetscape.js, "winter on the road"): where packed snow lies and where the wheels have polished the
//     asphalt black and wet, lane by lane; and how much light every street lamp throws on every spot of ground.
//   * Street lights, at the spacing the real ones stand at: sodium on tall davits along Lake Shore Drive, white ones
//     down Columbus Drive's median and along Monroe and Jackson. Each is one instance of one pole; its pool of light
//     is in the map, so it lies on the road, the kerb, the pavement and the snow alike and costs nothing per frame.
//   * Relief, all of it real ground (plan.surfaces, read by the car through groundAt): the plough's windrows along
//     the kerbs and the Drive's median, lumpy, heaped higher where the blade was lifted at a crossing and broken
//     where somebody dug through; washboard in the packed snow where everybody brakes for the lights; frost heaves;
//     a raised crosswalk before the museum's east door; steel plates over a trench where the road is up. And black
//     ice on the two bridges over the railway, which freeze before the road does (plan.ice: the car slides on it).
//     Every piece is drawn from the same function the wheels ride on.
//   * What stands about: the road works on the Drive (barrels, concrete barriers, plates, a sign), speed limits,
//     warning signs, cars snowed in along Monroe and Jackson.
//
// Nothing here runs per frame, and all of it is a dozen meshes: the windrows one to a stretch of street (so that what is
// out of sight is not drawn), every pole, post, drum, barrier and plate in one, every lamp's glass in one, the glare in one.

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { feature } from './features.js';
import { radial } from './textures.js';
import { hash, ROAD, winterRoad, trafficLanes, asphaltMaterial, paintMaterial, bankMaterial, GeoLite } from './streetscape.js';

const smooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
// Smooth value noise along a line, 0..1, the same every night.
const vn = (p, s) => { const i = Math.floor(p), f = p - i, u = f * f * (3 - 2 * f); return hash(i, s, 3) * (1 - u) + hash(i + 1, s, 3) * u; };

// ------------------------------------------------------------------------------------------------ the map --
const MW = 2048, MH = 1024;
class Mask {
  constructor(x0, x1, z0, z1) { this.x0 = x0; this.z0 = z0; this.sx = MW / (x1 - x0); this.sz = MH / (z1 - z0); this.L = [new Float32Array(MW * MH), new Float32Array(MW * MH)]; this.S = new Float32Array(MW * MH).fill(0.34); this.D = new Uint8Array(MW * MH); }
  // How much snow lies on a rectangle of road: 0 polished bare, 0.5 about half of it in patches, 0.8 and up a sheet.
  // (`dir`: which way the road runs there: 0 north and south, 255 east and west, 128 a junction)
  snow(x0, x1, z0, z1, v, dir = -1) {
    const i0 = Math.max(0, Math.round((Math.min(x0, x1) - this.x0) * this.sx)), i1 = Math.min(MW, Math.round((Math.max(x0, x1) - this.x0) * this.sx)), j0 = Math.max(0, Math.round((Math.min(z0, z1) - this.z0) * this.sz)), j1 = Math.min(MH, Math.round((Math.max(z0, z1) - this.z0) * this.sz));
    for (let j = j0; j < j1; j++) { this.S.fill(v, j * MW + i0, j * MW + Math.max(i0, i1)); if (dir >= 0) this.D.fill(dir, j * MW + i0, j * MW + Math.max(i0, i1)); }
  }
  // A lamp `h` metres up over (x, z): the light it throws on the ground, falling off as the real thing does (1 straight under it).
  // A street light's glass throws it along the road, not across: `kx`, `kz` stretch the pool each way.
  lamp(ch, x, z, h, power = 1, kx = 1, kz = 1) {
    const R = h * 2.7, L = this.L[ch], i0 = Math.max(2, Math.floor((x - R * kx - this.x0) * this.sx)), i1 = Math.min(MW - 2, Math.ceil((x + R * kx - this.x0) * this.sx)), j0 = Math.max(2, Math.floor((z - R * kz - this.z0) * this.sz)), j1 = Math.min(MH - 2, Math.ceil((z + R * kz - this.z0) * this.sz));
    for (let j = j0; j < j1; j++) for (let i = i0; i < i1; i++) {
      const dx = (this.x0 + (i + 0.5) / this.sx - x) / kx, dz = (this.z0 + (j + 0.5) / this.sz - z) / kz, d2 = dx * dx + dz * dz; if (d2 >= R * R) continue;
      const e = h * h * h / Math.pow(d2 + h * h, 1.5), w = 1 - d2 / (R * R);
      L[j * MW + i] += power * e * w * w;
    }
  }
  texture() {
    // The snow's edges softened a little (the shader cuts them again with its grain), then all three packed into bytes.
    const S = this.S, T = new Float32Array(S.length), r = 2;
    for (let pass = 0; pass < 2; pass++) {
      for (let j = 0; j < MH; j++) { let acc = 0; const o = j * MW; for (let i = -r; i < MW + r; i++) { acc += S[o + Math.min(MW - 1, Math.max(0, i + r))]; if (i >= r + 1) acc -= S[o + Math.min(MW - 1, Math.max(0, i - r - 1))]; if (i >= 0 && i < MW) T[o + i] = acc / Math.min(2 * r + 1, i + r + 1); } }
      for (let i = 0; i < MW; i++) { let acc = 0; for (let j = -r; j < MH + r; j++) { acc += T[Math.min(MH - 1, Math.max(0, j + r)) * MW + i]; if (j >= r + 1) acc -= T[Math.min(MH - 1, Math.max(0, j - r - 1)) * MW + i]; if (j >= 0 && j < MH) S[j * MW + i] = acc / Math.min(2 * r + 1, j + r + 1); } }
    }
    const d = new Uint8Array(MW * MH * 4), A = this.L[0], Bc = this.L[1];
    for (let i = 0; i < MW * MH; i++) { d[i * 4] = Math.sqrt(Math.min(1, A[i])) * 255; d[i * 4 + 1] = Math.sqrt(Math.min(1, Bc[i])) * 255; d[i * 4 + 2] = Math.min(1, S[i]) * 255; d[i * 4 + 3] = this.D[i]; }
    const t = new THREE.DataTexture(d, MW, MH, THREE.RGBAFormat, THREE.UnsignedByteType);
    t.colorSpace = THREE.NoColorSpace; t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; t.anisotropy = 4; t.needsUpdate = true;
    this.L = this.S = this.D = null;
    return t;
  }
}

// ------------------------------------------------------------------------------------------------- relief --
// Ground with a shape of its own, laid over the flat street: a function of (x, z) that is pushed onto the plan as a hill
// (ground at any height, never a wall: the car climbs it, rolls off it and leaves it at the top) and drawn as a grid of
// the same function, close enough that the wheels and the picture agree to a centimetre.
class Relief {
  constructor(plan) { this.plan = plan; this.parts = new Map(); this.inRoad = []; }
  _geo(key) { let g = this.parts.get(key); if (!g) this.parts.set(key, g = { p: [], n: [], uv: [], c: [], idx: [] }); return g; }
  // xs, zs: where the grid's lines run. colour(x, z, h) tints it. `road`: the traffic rides over it too (plan.roadRelief).
  add(key, xs, zs, fn, { lift = 0.006, colour = null, top = 1, road = false, uv = 4, surface = true } = {}) {
    const g = this._geo(key), base = g.p.length / 3, e = 0.04;
    for (const z of zs) for (const x of xs) {
      const h = fn(x, z), gx = (fn(x + e, z) - fn(x - e, z)) / (2 * e), gz = (fn(x, z + e) - fn(x, z - e)) / (2 * e), l = Math.hypot(gx, 1, gz);
      g.p.push(x, h + lift, z); g.n.push(-gx / l, 1 / l, -gz / l); g.uv.push(x / uv, z / uv);
      const c = colour ? colour(x, z, h) : [1, 1, 1]; g.c.push(c[0], c[1], c[2]);
    }
    const nx = xs.length;
    for (let j = 0; j < zs.length - 1; j++) for (let i = 0; i < nx - 1; i++) { const a = base + j * nx + i; g.idx.push(a, a + nx, a + 1, a + 1, a + nx, a + nx + 1); }
    if (!surface) return;
    const x0 = xs[0], x1 = xs[nx - 1], z0 = zs[0], z1 = zs[zs.length - 1];
    const s = { skin: 'snow', hill: true, axis: 'hill', fn, x0, x1, z0, z1, h0: 0, h1: top, thick: 0, cx: (x0 + x1) / 2, cz: (z0 + z1) / 2, rx: (x1 - x0) / 2, rz: (z1 - z0) / 2, H: top, roadwork: true };
    this.plan.surfaces.push(s); if (road) this.inRoad.push(s);
  }
  // Something else made of the same stuff (a cap of snow on a drum), drawn with that piece: no ground of its own.
  addGeometry(key, geo, c = [1, 1, 1]) {
    const g = this._geo(key), q = geo.index ? geo.toNonIndexed() : geo, P = q.attributes.position.array, N = q.attributes.normal.array, base = g.p.length / 3, n = P.length / 3;
    for (let i = 0; i < n; i++) { g.p.push(P[i * 3], P[i * 3 + 1], P[i * 3 + 2]); g.n.push(N[i * 3], N[i * 3 + 1], N[i * 3 + 2]); g.uv.push(P[i * 3] / 3, P[i * 3 + 2] / 3); g.c.push(c[0], c[1], c[2]); g.idx.push(base + i); }
  }
  // every piece whose key starts with `prefix`, each a mesh of its own (so that what is out of sight is not drawn)
  meshes(prefix, mat) { return [...this.parts.keys()].filter(k => k.startsWith(prefix)).map(k => this.mesh(k, mat)).filter(Boolean); }
  mesh(key, mat) {
    const g = this.parts.get(key); if (!g || !g.idx.length) return null;
    const b = new THREE.BufferGeometry();
    b.setAttribute('position', new THREE.Float32BufferAttribute(g.p, 3)); b.setAttribute('normal', new THREE.Float32BufferAttribute(g.n, 3)); b.setAttribute('uv', new THREE.Float32BufferAttribute(g.uv, 2));
    if (mat.vertexColors) b.setAttribute('color', new THREE.Float32BufferAttribute(g.c, 3));
    b.setIndex(g.idx); const m = new THREE.Mesh(b, mat); m.matrixAutoUpdate = false; m.updateMatrix(); return m;
  }
}
const range = (a, b, step) => { const n = Math.max(1, Math.round((b - a) / step)), out = []; for (let i = 0; i <= n; i++) out.push(a + (b - a) * i / n); return out; };

// ---------------------------------------------------------------------------------------------- furniture --
// One street light: a tapered steel pole on a flanged base, a davit arm curving out over the road (one, or one each
// way), a flat "cobra head" at the end of it. Built once along +x; every light in the world is an instance.
function lightGeo(H, reach, arms) {
  const metal = [], lens = [];
  const pole = new THREE.CylinderGeometry(0.07, 0.115, H - 0.9, 10, 1, true); pole.translate(0, (H - 0.9) / 2, 0); metal.push(pole);
  const foot = new THREE.CylinderGeometry(0.15, 0.2, 0.42, 10); foot.translate(0, 0.21, 0); metal.push(foot);
  for (let k = 0; k < arms; k++) {
    const s = k ? -1 : 1, curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(0, H - 0.95, 0), new THREE.Vector3(s * 0.25, H + 0.12, 0), new THREE.Vector3(s * reach, H, 0));
    metal.push(new THREE.TubeGeometry(curve, 8, 0.045, 6, false));
    const head = new THREE.SphereGeometry(1, 12, 6); head.scale(0.4, 0.09, 0.17); head.translate(s * (reach + 0.28), H - 0.01, 0); metal.push(head);
    const glass = new THREE.SphereGeometry(1, 10, 5); glass.scale(0.27, 0.085, 0.125); glass.translate(s * (reach + 0.33), H - 0.075, 0); lens.push(glass);
  }
  const strip = g => { const q = g.index ? g.toNonIndexed() : g; q.deleteAttribute('uv'); return q; };
  return { metal: mergeGeometries(metal.map(strip)), lens: mergeGeometries(lens.map(strip)) };
}
// The orange drum of a road works: fat, with two reflective bands and a rubber foot. Vertex-coloured, one material.
function drumGeo() {
  const parts = [], col = (g, c) => { const q = g.index ? g.toNonIndexed() : g; q.deleteAttribute('uv'); const n = q.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) a.set(c, i * 3); q.setAttribute('color', new THREE.BufferAttribute(a, 3)); parts.push(q); };
  const ORANGE = [0.95, 0.33, 0.04], WHITE = [0.92, 0.92, 0.9], BLACK = [0.03, 0.03, 0.035];
  let y = 0.06; const band = (h, r0, r1, c) => { const g = new THREE.CylinderGeometry(r1, r0, h, 20, 1, true); g.translate(0, y + h / 2, 0); col(g, c); y += h; };
  { const g = new THREE.CylinderGeometry(0.36, 0.38, 0.06, 20); g.translate(0, 0.03, 0); col(g, BLACK); }
  band(0.22, 0.29, 0.285, ORANGE); band(0.13, 0.285, 0.28, WHITE); band(0.14, 0.28, 0.275, ORANGE); band(0.13, 0.275, 0.27, WHITE); band(0.2, 0.27, 0.262, ORANGE);
  { const g = new THREE.SphereGeometry(0.262, 20, 6, 0, Math.PI * 2, 0, Math.PI / 2); g.scale(1, 0.22, 1); g.translate(0, y, 0); col(g, ORANGE); }
  return mergeGeometries(parts);
}
// A concrete barrier, the real section (a wide foot, a slope, a tall narrow stem), `len` long along z.
function barrierGeo(len) {
  const prof = [[-0.3, 0], [-0.3, 0.08], [-0.17, 0.33], [-0.085, 0.81], [0.085, 0.81], [0.17, 0.33], [0.3, 0.08], [0.3, 0]];
  const sh = new THREE.Shape(prof.map(([x, y]) => new THREE.Vector2(x, y)));
  const g = new THREE.ExtrudeGeometry(sh, { depth: len, bevelEnabled: false }); g.translate(0, 0, -len / 2); return g;
}
// Every kind of sign on one sheet, 128 px to a plate. Returns the texture and where each plate is on it.
function plateSheet(kinds) {
  const names = Object.keys(kinds), cols = 4, rows = Math.ceil(names.length / cols), cv = document.createElement('canvas'); cv.width = cols * 128; cv.height = rows * 128; const c = cv.getContext('2d'), cell = {};
  names.forEach((name, ix) => {
    const [lines, { bg, fg, diamond }] = kinds[name], i = ix % cols, j = (ix / cols) | 0;
    c.save(); c.translate(i * 128, j * 128); c.beginPath(); c.rect(0, 0, 128, 128); c.clip();
    if (diamond) { c.translate(64, 64); c.rotate(Math.PI / 4); c.fillStyle = bg; c.fillRect(-44, -44, 88, 88); c.strokeStyle = fg; c.lineWidth = 4; c.strokeRect(-39, -39, 78, 78); c.rotate(-Math.PI / 4); c.translate(-64, -64); }
    else { c.fillStyle = bg; c.fillRect(16, 2, 96, 124); c.strokeStyle = fg; c.lineWidth = 4; c.strokeRect(21, 7, 86, 114); }
    c.fillStyle = fg; c.textAlign = 'center'; c.textBaseline = 'middle';
    const n = lines.length, step = diamond ? 17 : Math.min(30, 100 / n);
    lines.forEach((t, k) => { const big = /^\d+$/.test(t); c.font = `800 ${big ? 46 : diamond ? 15 : 17}px Helvetica, Arial, sans-serif`; c.fillText(t, 64, 64 + (k - (n - 1) / 2) * step + (big ? 6 : 0), diamond ? 62 : 80); });
    c.restore(); cell[name] = [i / cols, (rows - 1 - j) / rows, 1 / cols, 1 / rows];
  });
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return { map: t, cell };
}

// =================================================================================================== build ==
// ctx, from streets.js: { parked(x, z, fx, fz, opts), paintW }: its parked cars, which these join, and its white paint.
let registered = false;
export function buildWinterRoads(museum, plan, ctx = {}) {
  const G = plan.grounds, B = plan.bounds, L = plan.lakefront, O = plan.obstacles, group = museum.group;
  if (!L || !plan.street) return;
  const M = G.michigan, MO = G.monroe, JA = G.jackson, C = G.columbus, R = G.rail, LSD = L.lsd, SX = plan.street.x, TL = trafficLanes(plan);
  const add = m => { if (!m) return null; m.matrixAutoUpdate = false; m.updateMatrix(); m.userData.winterRoads = true; group.add(m); return m; };
  // Everything hard that stands about (poles, posts, drums, barriers, plates), coloured by the vertex: one mesh.
  const hard = [], STEEL = [0.2, 0.215, 0.24], ZINC = [0.42, 0.44, 0.47], CONCRETE = [0.56, 0.55, 0.52], PLATE = [0.27, 0.235, 0.2];
  const put = (list, geo, c, m4) => { const q = geo.index ? geo.toNonIndexed() : geo.clone(); if (q.attributes.uv) q.deleteAttribute('uv'); if (m4) q.applyMatrix4(m4); if (c) { const n = q.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) a.set(c, i * 3); q.setAttribute('color', new THREE.BufferAttribute(a, 3)); } list.push(q); };
  const mz = (MO.z0 + MO.z1) / 2, jz = (JA.z0 + JA.z1) / 2, FLAT0 = SX + 12;          // east of here the cross streets are level
  const blocked = (x, z, r = 0.7, tall = 0.3) => G.trees.some(t => Math.abs(t.x - x) < r + 0.5 && Math.abs(t.z - z) < r + 0.5) || O.some(o => o.y1 > tall && o.y0 < 2 && x > o.x0 - r && x < o.x1 + r && z > o.z0 - r && z < o.z1 + r) || (plan.lamps || []).some(l => Math.abs(l.x - x) < r + 0.3 && Math.abs(l.z - z) < r + 0.3);

  // ---------------------------------------------------------------------------------- where the snow lies
  const mask = new Mask(-40, 536, -70, 290);
  ROAD.uRoadBox.value.set(-40, -70, 1 / 576, 1 / 360);
  { // Michigan Avenue: its lanes polished, the parking lane and the median's edges left to the snow.
    mask.snow(M.x0, M.x1, -70, 290, 0.38);
    for (const x of [...TL.ns.mich[1], ...TL.ns.mich[-1]]) mask.snow(x - 1.25, x + 1.25, -70, 290, 0.1);
    mask.snow(M.x0, M.x0 + 2.1, -70, 290, 0.74); mask.snow(M.x1 - 0.9, M.x1, -70, 290, 0.7); mask.snow(-14.3, -10.9, -70, 290, 0.62);
    // Monroe and Jackson: one lane each way worn bare, the crown between them half covered, the sides a sheet.
    for (const [st, zc] of [[MO, mz], [JA, jz]]) {
      mask.snow(M.x1, LSD.x0, st.z0, st.z1, 0.5, 255);
      for (const d of [-1, 1]) { mask.snow(M.x1, LSD.x0, zc + d * TL.ew - 1.2, zc + d * TL.ew + 1.2, 0.08); mask.snow(M.x1, LSD.x0, d < 0 ? st.z0 : st.z1 - 1.5, d < 0 ? st.z0 + 1.5 : st.z1, 0.82); }
      mask.snow(M.x0, M.x1, st.z0, st.z1, 0.24, 128);                                      // the junction with the avenue, churned
    }
    // Columbus Drive: a lane each way, the bike lanes ploughed full, snow off the median's hedges at its foot.
    { const zA = MO.z1, zB = JA.z0, c1 = TL.ns.col[1][0], c2 = TL.ns.col[-1][0], mid = (C.x0 + C.x1) / 2;
      mask.snow(C.x0, C.x1, zA, zB, 0.46);
      for (const x of [c1, c2]) mask.snow(x - 1.3, x + 1.3, zA, zB, 0.08);
      mask.snow(C.x0, C.x0 + 1.9, zA, zB, 0.84); mask.snow(C.x1 - 1.9, C.x1, zA, zB, 0.84); mask.snow(mid - 1.9, mid + 1.9, zA, zB, 0.66);
      mask.snow(C.x0 + 2, C.x1 - 2, 105.5, 114.5, 0.2);                               // the crossing at the east door, salted
      for (const st of [MO, JA]) mask.snow(C.x0, C.x1, st.z0, st.z1, 0.26, 128); }
    // Lake Shore Drive: the traffic keeps to the middle two lanes of each side. The kerb lane is the plough's; the
    // lane by the median half gone; a ridge of grey between the two that are driven.
    for (const [kerb, d] of [[LSD.x0, 1], [LSD.x1, -1]]) {
      const at = u => kerb + d * u, band = (u0, u1, v) => mask.snow(at(u0), at(u1), -70, 290, v);
      band(0, 14.5, 0.4); band(0, 3.9, 0.76); band(1.2, 2.9, 0.5); band(4.3, 6.7, 0.07); band(7.8, 10.2, 0.07); band(6.9, 7.6, 0.6); band(10.9, 14.5, 0.56); band(11.7, 13.3, 0.3); band(13.6, 14.5, 0.8);
    }
    for (const st of [MO, JA]) mask.snow(LSD.x0, LSD.med[0], st.z0 - 1, st.z1 + 1, 0.22, 128);
  }

  // ---------------------------------------------------------------------------------------- street lights
  // [x, z, which way the arm reaches (unit x, z), arms, height, reach, channel (0 sodium, 1 white)]
  const lights = [];
  const light = (x, z, ax, az, arms, h, reach, ch, tall = 0.3) => {
    let px = x, pz = z; for (let k = 0; k < 4 && blocked(px, pz, 0.5, tall); k++) { px += Math.abs(az) * 2.2; pz += Math.abs(ax) * 2.2; }      // step along the kerb past a tree or a post
    lights.push([px, pz, ax, az, arms, h, reach, ch]);
    O.push({ x0: px - 0.13, x1: px + 0.13, z0: pz - 0.13, z1: pz + 0.13, y0: 0, y1: h });
    for (let k = 0; k < arms; k++) { const s = k ? -1 : 1; mask.lamp(ch, px + ax * s * (reach + 0.3), pz + az * s * (reach + 0.3), h, ch ? 1.05 : 1, ax ? 1.05 : 1.75, ax ? 1.75 : 1.05); }
  };
  // Lake Shore Drive: sodium, 9.5 m up, on the park side and the lake side by turns.
  for (const z of [-22, 24, 68, 119, 164, 208, 241]) light(LSD.x0 - 0.75, z, 1, 0, 1, 9.5, 2.6, 0);
  for (const z of [1, 46, 90, 141, 186, 230]) light(LSD.x1 + 0.75, z, -1, 0, 1, 9.5, 2.6, 0);
  // Columbus Drive: white, two arms on a pole in the median; and one each side of the crossing at the east door.
  { const mid = (C.x0 + C.x1) / 2; for (const z of [6, 42, 78, 142, 178, 214]) light(mid, z, 1, 0, 2, 8.6, 2.3, 1, 1.2);      // (it stands in the hedge; only a tree's trunk moves it along)
    light(C.x0 - 0.7, 105.6, 1, 0, 1, 7.4, 2.2, 1); light(C.x1 + 0.7, 114.4, -1, 0, 1, 7.4, 2.2, 1); }
  // Monroe and Jackson: white, on the outer pavement, their arms out over the street.
  for (let x = 44, i = 0; x < LSD.x0 - 12; x += 44, i++) {
    for (const [st, off, az] of [[MO, 0, 1], [JA, 22, -1]]) { const xx = x + off; if (xx > LSD.x0 - 12 || (xx > R.x0 - 4 && xx < R.x1 + 4) || (xx > C.x0 - 8 && xx < C.x1 + 8)) continue; light(xx, az > 0 ? st.z0 - 0.8 : st.z1 + 0.8, 0, az, 1, 8.6, 2.3, 1); }
  }
  const lenses = [];
  { const kinds = new Map(), M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), UP = new THREE.Vector3(0, 1, 0), ONE = new THREE.Vector3(1, 1, 1), P = new THREE.Vector3();
    for (const [x, z, ax, az, arms, h, reach, ch] of lights) {
      const key = `${arms}|${h}|${reach}`, g = kinds.get(key) || (kinds.set(key, lightGeo(h, reach, arms)), kinds.get(key));
      M4.compose(P.set(x, 0, z), Q.setFromAxisAngle(UP, Math.atan2(-az, ax)), ONE);
      put(hard, g.metal, STEEL, M4); put(lenses, g.lens, ch ? [3.4, 2.95, 2.3] : [4.2, 2.0, 0.55], M4);
    }
    // The glare round each lamp: one cloud of points for all of them.
    { const p = [], c = []; for (const [x, z, ax, az, arms, h, reach, ch] of lights) for (let k = 0; k < arms; k++) { const s = k ? -1 : 1; p.push(x + ax * s * (reach + 0.33), h - 0.09, z + az * s * (reach + 0.33)); c.push(...(ch ? [0.34, 0.3, 0.24] : [0.46, 0.23, 0.07])); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(c, 3));
      const halo = new THREE.Points(g, new THREE.PointsMaterial({ map: radial(0, 1.3), size: 3.4, sizeAttenuation: true, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); halo.frustumCulled = false; halo.renderOrder = 7; add(halo); }
  }

  // ------------------------------------------------------------------------------------- the windrows
  // What the plough leaves along a kerb: a ridge with its crest in the gutter, a steep cut face to the road where
  // the blade ran, lapping back over the kerb. `k` is the kerb's road face, `d` the way from it into the road,
  // [a, b] its run along `axis`; it lies `behind` the face and `into` the road. `gaps` are kept clear (crossings,
  // parked cars, a hydrant somebody dug out): the ridge runs down to nothing over a metre either side, and is
  // heaped higher just beyond a crossing, where the driver lifted the blade.
  const rel = new Relief(plan), signs = [];
  const DIRT = [0.5, 0.47, 0.43], CLEAN = [0.94, 0.96, 1.0];
  const windrow = ({ axis, k, d, a, b, H, behind = 0.42, into = 1.2, gaps = [], seed = 1, heaps = [], open = [false, false], piece }) => {
    const gs = gaps.filter(([g0, g1]) => g1 > a && g0 < b).sort((p, q) => p[0] - q[0]);
    // random breaks where somebody dug a way through from the pavement
    for (let p = a + 14 + hash(seed, a, 1) * 20; p < b - 10; p += 24 + hash(p, seed, 2) * 30) gs.push([p - 0.55, p + 0.55]);
    const tp = (0.2 + behind) / (behind + into), gam = Math.log(0.5) / Math.log(tp), WMAX = behind + into * 1.32;
    const wide = p => behind + into * (0.6 + 0.5 * vn(p / 5.3, seed + 5) + 0.22 * vn(p / 2.3, seed + 6));      // how far it was thrown, which comes and goes, in scallops
    const lean = p => gam * (0.78 + 0.5 * vn(p / 2.9, seed + 8));                        // and where across it the crest lies
    const amp = p => {
      let g = 1; for (const [g0, g1] of gs) { const o = Math.max(g0 - p, p - g1); if (o < 1.1) g = Math.min(g, smooth(0, 1.1, o)); if (g === 0) return 0; }
      if (!open[0]) g = Math.min(g, smooth(0, 1.4, p - a)); if (!open[1]) g = Math.min(g, smooth(0, 1.4, b - p));
      let h = H * (0.34 + 0.9 * vn(p / 3.7, seed) + 0.4 * vn(p / 1.9, seed + 11));
      for (const c of heaps) { const u = (p - c) / 1.15; if (u > -3 && u < 3) h += H * 0.9 * Math.exp(-u * u); }
      return h * g;
    };
    const fn = axis === 'z'
      ? (x, z) => { const u = (x - k) * d + behind; if (u <= 0 || u >= WMAX) return 0; const t = u / wide(z); if (t >= 1) return 0; const A = amp(z); return A ? A * (0.5 - 0.5 * Math.cos(2 * Math.PI * Math.pow(t, lean(z)))) : 0; }
      : (x, z) => { const u = (z - k) * d + behind; if (u <= 0 || u >= WMAX) return 0; const t = u / wide(x); if (t >= 1) return 0; const A = amp(x); return A ? A * (0.5 - 0.5 * Math.cos(2 * Math.PI * Math.pow(t, lean(x)))) : 0; };
    const across = [0, 0.08, 0.18, 0.29, 0.41, 0.54, 0.7, 1].map(t => k + d * (t * WMAX - behind)); if (d < 0) across.reverse();
    const colour = (x, z, h) => { const u = ((axis === 'z' ? x : z) - k) * d, grit = smooth(0.1, into, u) * (0.55 + 0.45 * hash(x * 7, z * 7, 5)), q = Math.min(1, grit * 0.9 + (h < 0.03 ? 0.25 : 0)); return [CLEAN[0] + (DIRT[0] - CLEAN[0]) * q, CLEAN[1] + (DIRT[1] - CLEAN[1]) * q, CLEAN[2] + (DIRT[2] - CLEAN[2]) * q]; };
    // in lengths of 70 m or so, each its own piece of ground, skipping what the gaps leave empty
    for (let p0 = a; p0 < b - 0.01; p0 += 70) {
      const p1 = Math.min(b, p0 + 70), along = range(p0, p1, 0.8), key = 'snow|' + piece((p0 + p1) / 2);
      if (axis === 'z') rel.add(key, across, along, fn, { colour, top: H * 2.4, lift: 0.012, uv: 3 }); else rel.add(key, along, across, fn, { colour, top: H * 2.4, lift: 0.012, uv: 3 });
    }
  };
  const lsdPiece = p => (p < 110 ? 'LSD-N' : 'LSD-S');      // (which mesh a length of windrow is drawn with: one to a stretch of street)
  const mouthM = [MO.z0 - 1.6, MO.z1 + 1.6], mouthJ = [JA.z0 - 1.6, JA.z1 + 1.6], WORK = [137, 181];      // (the road works on the Drive's lake side)
  // Lake Shore Drive: the park side, the lake side, and both edges of its median (where the snow goes up among the trees).
  windrow({ axis: 'z', k: LSD.x0 + 0.12, d: 1, a: B.z0, b: B.z1, H: 0.33, gaps: [mouthM, mouthJ, [107.4, 112.6]], heaps: [MO.z1 + 3.4, JA.z0 - 3.4], seed: 3, open: [true, true], piece: lsdPiece });
  windrow({ axis: 'z', k: LSD.x1 - 0.12, d: -1, a: B.z0, b: B.z1, H: 0.33, gaps: [[102.5, 117.5], WORK], heaps: [100.4, 119.6], seed: 5, open: [true, true], piece: lsdPiece });
  windrow({ axis: 'z', k: LSD.med[0] - 0.12, d: -1, a: B.z0, b: B.z1, H: 0.3, behind: 1.25, into: 0.95, gaps: [[106.5, 113.5]], seed: 7, open: [true, true], piece: lsdPiece });
  windrow({ axis: 'z', k: LSD.med[1] + 0.12, d: 1, a: B.z0, b: B.z1, H: 0.3, behind: 1.25, into: 0.95, gaps: [[106.5, 113.5]], seed: 9, open: [true, true], piece: lsdPiece });
  // Columbus Drive: both kerbs, clear at the corners, the bus stop, the crossing at the east door and the hydrants.
  windrow({ axis: 'z', k: C.x0 + 0.12, d: 1, a: MO.z1, b: JA.z0, H: 0.27, gaps: [[MO.z1, MO.z1 + 5.6], [JA.z0 - 5.6, JA.z0], [55.5, 66], [102, 118]], heaps: [MO.z1 + 7.6, JA.z0 - 7.6, 100, 120], seed: 13, piece: () => 'COL' });
  windrow({ axis: 'z', k: C.x1 - 0.12, d: -1, a: MO.z1, b: JA.z0, H: 0.27, gaps: [[MO.z1, MO.z1 + 5.6], [JA.z0 - 5.6, JA.z0], [102, 118], [42.7, 45.3], [168.7, 171.3]], heaps: [MO.z1 + 7.6, JA.z0 - 7.6, 100, 120], seed: 15, piece: () => 'COL' });
  // Monroe and Jackson, east of where they come up level: the outer kerb and the block's, clear at Columbus Drive,
  // over the railway, at the Drive, and round every car parked for the night (the plough went round them: parked.js).
  const PARKED = { [MO.z1]: [52, 76, 158, 222, 318, 431], [JA.z0]: [52, 76, 158, 222, 334, 392.6] };
  for (const [st, sgn] of [[MO, 1], [JA, -1]]) {
    const piece = p => (sgn > 0 ? 'MON-' : 'JAC-') + (p < (C.x0 + C.x1) / 2 ? 'W' : 'E');
    const outer = sgn > 0 ? st.z0 : st.z1, inner = sgn > 0 ? st.z1 : st.z0, cross = [[C.x0 - 6.2, C.x1 + 6.2], [R.x0 - 1.6, R.x1 + 1.6], [LSD.x0 - 5, LSD.x0]];
    windrow({ axis: 'x', k: outer + sgn * 0.12, d: sgn, a: FLAT0 + 3, b: LSD.x0, H: 0.25, gaps: cross, heaps: [C.x0 - 8.2, C.x1 + 8.2], seed: 21 + sgn, piece });
    windrow({ axis: 'x', k: inner - sgn * 0.12, d: -sgn, a: FLAT0 + 3, b: LSD.x0, H: 0.25, gaps: [...cross, ...PARKED[inner].map(x => [x - 3.5, x + 3.5])], heaps: [C.x0 - 8.2, C.x1 + 8.2], seed: 25 + sgn, piece });
    // (the cars east of Columbus Drive are this file's: the plough's heap round each is parked.js's)
    if (ctx.parked) for (const x of PARKED[inner]) if (x > C.x1) ctx.parked(x, inner - sgn * 1.0, sgn, 0, hash(x, sgn, 9) < 0.3 ? { scraped: true } : undefined);
  }

  // ----------------------------------------------------------- washboard, heaves, the raised crosswalk
  // In the road itself, and drawn in the road's own material (its picture is laid by where it is in the world, so a
  // piece of it lifted a few centimetres joins the flat road round it without a seam). The traffic rides them too.
  const bump = (x0, x1, z0, z1, fn, nx, nz, top, snow) => {
    const xs = range(x0, x1, (x1 - x0) / nx), zs = range(z0, z1, (z1 - z0) / nz);
    rel.add('road', xs, zs, fn, { lift: 0.0085, top, road: true });
    if (snow !== undefined) mask.snow(x0 + 0.3, x1 - 0.3, z0 + 0.3, z1 - 0.3, snow);
  };
  // Washboard: ripples 42 cm from crest to crest, 3 cm deep, in the snow packed down where everybody brakes.
  const washboard = (axis, c0, c1, p0, p1, seed) => {          // across c0..c1, along p0..p1
    const lam = 0.42, A = 0.03, len = p1 - p0, w = c1 - c0;
    const f = (c, p) => { const e = smooth(0, 1.1, p - p0) * smooth(0, 1.1, p1 - p) * smooth(0, 0.5, c - c0) * smooth(0, 0.5, c1 - c); if (e <= 0) return 0; return A * e * (0.55 + 0.45 * vn(p / 1.9, seed)) * (0.5 - 0.5 * Math.cos(2 * Math.PI * (p - p0) / lam + Math.sin(c * 2.1 + seed) * 0.9)); };
    const na = Math.round(len / (lam / 5)), nc = Math.max(4, Math.round(w / 0.5));
    if (axis === 'z') bump(c0, c1, p0, p1, (x, z) => f(x, z), nc, na, A, 0.86); else bump(p0, p1, c0, c1, (x, z) => f(z, x), na, nc, A, 0.86);
  };
  { const sb = TL.ns.lsd[1], nb = TL.ns.lsd[-1], c1 = TL.ns.col[1][0], c2 = TL.ns.col[-1][0];
    // the Drive: southbound (the park side) braking for Jackson, northbound (the lake side) for Monroe
    for (const x of sb) washboard('z', x - 1.45, x + 1.45, JA.z0 - 15.5, JA.z0 - 7, x + 3);
    for (const x of nb) washboard('z', x - 1.45, x + 1.45, MO.z1 + 7, MO.z1 + 15.5, x + 7);
    // Columbus, braking for the two streets; Monroe and Jackson (eastbound on the south side), braking for Columbus and for the Drive
    washboard('z', c1 - 1.4, c1 + 1.4, JA.z0 - 15, JA.z0 - 6.5, 31); washboard('z', c2 - 1.4, c2 + 1.4, MO.z1 + 6.5, MO.z1 + 15, 33);
    for (const [zc, s] of [[mz, 41], [jz, 43]]) {
      washboard('x', zc + TL.ew - 1.3, zc + TL.ew + 1.3, C.x0 - 14.5, C.x0 - 6.5, s); washboard('x', zc - TL.ew - 1.3, zc - TL.ew + 1.3, C.x1 + 6.5, C.x1 + 14.5, s + 1);
      washboard('x', zc + TL.ew - 1.3, zc + TL.ew + 1.3, LSD.x0 - 16, LSD.x0 - 7.5, s + 2);
    }
  }
  // Frost heaves: where the ground has lifted the road in a ridge across a lane.
  const heave = (axis, c, p, w, h, seed) => {
    const hw = w / 2, f = (cc, pp) => { const u = (pp - p) / 0.75 + Math.sin((cc - c) * 1.7 + seed) * 0.18, e = smooth(0, 0.8, hw - Math.abs(cc - c)); return Math.abs(u) >= 1 || e <= 0 ? 0 : h * e * (0.5 + 0.5 * Math.cos(Math.PI * u)) * (0.8 + 0.2 * Math.cos((cc - c) * 2.3 + seed)); };
    if (axis === 'z') bump(c - hw, c + hw, p - 1.05, p + 1.05, (x, z) => f(x, z), 8, 14, h); else bump(p - 1.05, p + 1.05, c - hw, c + hw, (x, z) => f(z, x), 14, 8, h);
  };
  heave('z', TL.ns.lsd[1][0], 52, 3.6, 0.05, 1); heave('z', TL.ns.lsd[1][1], 139, 3.6, 0.045, 2); heave('z', TL.ns.lsd[-1][1], 88, 3.6, 0.05, 3); heave('z', TL.ns.lsd[-1][0], 214, 3.6, 0.045, 4); heave('z', LSD.x0 + 3.0, 186, 3.0, 0.055, 5);
  heave('x', mz + TL.ew, 344, 3.2, 0.05, 6); heave('x', mz - TL.ew, 402, 3.2, 0.045, 7); heave('x', jz - TL.ew, 330, 3.2, 0.05, 8); heave('x', jz + TL.ew, 418, 3.2, 0.045, 9); heave('x', jz - TL.ew, 196, 3.2, 0.045, 10); heave('x', mz + TL.ew, 176, 3.2, 0.045, 11);
  heave('z', TL.ns.col[1][0], 158, 3.2, 0.045, 12); heave('z', TL.ns.col[-1][0], 66, 3.2, 0.045, 13);
  // Black ice on the bridges over the railway: meltwater frozen again where there is cold air under the road. A sheet in
  // each lane, the eastbound's the longer; it is ice to the wheels (plan.ice) and a dark mirror to the eye.
  const iceG = new GeoLite();
  for (const [zc, s] of [[mz, 1], [jz, -1]]) for (const [x0, x1, c] of [[R.x0 + 0.4, R.x1 - 0.4, zc + TL.ew], [R.x0 + 2.2, R.x1 - 1.6, zc - TL.ew + s * 0.2]]) {
    const z0 = c - 1.45, z1 = c + 1.45, e = 0.7, y = 0.0105;
    (plan.ice || (plan.ice = [])).push({ x0, x1, z0, z1 });
    iceG.quad([x0 - e, y, z0 - e], [x0 - e, y, z1 + e], [x1 + e, y, z1 + e], [x1 + e, y, z0 - e], [0, 1, 0]);
    mask.snow(x0 - 1, x1 + 1, z0 - 0.6, z1 + 0.6, 0.03);
  }
  signs.push([R.x0 - 9, MO.z1 + 0.75, 'ice', -Math.PI / 2], [R.x1 + 9, MO.z0 - 0.75, 'ice', Math.PI / 2], [R.x0 - 9, JA.z1 + 0.75, 'ice', -Math.PI / 2], [R.x1 + 9, JA.z0 - 0.75, 'ice', Math.PI / 2]);
  // The raised crosswalk before the east door: a table the height of the kerb, 5.6 m long, a ramp of 1.6 m up to it each way.
  const TABLE = { z0: 107.2, z1: 112.8, ramp: 1.6, h: 0.085, x0: C.x0 + 0.24, x1: C.x1 - 0.24 };
  { const T = TABLE, f = (x, z) => T.h * smooth(T.z0 - T.ramp, T.z0, z) * smooth(T.z1 + T.ramp, T.z1, z);
    rel.add('road', [T.x0, (T.x0 + T.x1) / 2, T.x1], [...range(T.z0 - T.ramp, T.z0, T.ramp / 10), ...range(T.z0, T.z1, T.z1 - T.z0).slice(1), ...range(T.z1, T.z1 + T.ramp, T.ramp / 10).slice(1)], f, { lift: 0.0085, top: T.h, road: true });
    // its paint: a ladder across the top, and a row of white teeth up each ramp
    const pw = ctx.paintW || new GeoLite(), y = T.h + 0.0085 + 0.006, U = [[0.02, 0], [0.02, 1], [0.48, 1], [0.48, 0]];
    const q = (x0, x1, z0, z1, ya, yb) => pw.quad([x0, ya, z0], [x0, yb, z1], [x1, yb, z1], [x1, ya, z0], [0, 1, 0], U);
    for (const z of [T.z0 + 0.45, T.z1 - 0.45]) q(T.x0 + 0.5, T.x1 - 0.5, z - 0.15, z + 0.15, y, y);
    for (let x = T.x0 + 1.0; x < T.x1 - 1.2; x += 1.5) q(x, x + 0.6, T.z0 + 0.75, T.z1 - 0.75, y, y);
    for (let x = T.x0 + 0.9; x < T.x1 - 1.0; x += 1.5) for (const [za, zb] of [[T.z0 - T.ramp + 0.15, T.z0 - 0.3], [T.z1 + T.ramp - 0.15, T.z1 + 0.3]]) pw.quad([x, f(x, za) + 0.0145, za], [x + 0.36, f(x, zb) + 0.0145, zb], [x + 0.44, f(x, zb) + 0.0145, zb], [x + 0.8, f(x, za) + 0.0145, za], [0, 1, 0], U);
    if (!ctx.paintW) { const m = add(new THREE.Mesh(pw.build(), paintMaterial(false))); m.renderOrder = -3; }      // (with streets.js's paint, when it lends it)
  }
  // What the traffic's wheels ride over (traffic.js adds it to the street's level under each axle).
  { const list = rel.inRoad; plan.roadRelief = (x, z) => { let h = 0; for (const s of list) if (x > s.x0 && x < s.x1 && z > s.z0 && z < s.z1) { const v = s.fn(x, z); if (v > h) h = v; } return h; }; }

  // ------------------------------------------------------------------------------------ the road works
  // The lake side of the Drive, its kerb lane shut: drums in a taper, concrete barriers along the lane line, a trench
  // under three steel plates (each 2.5 cm of plate to bump up onto), the spoil heaped at the end, and a sign before it all.
  const drums = [], solid = (x0, x1, z0, z1, y1) => O.push({ x0, x1, z0, z1, y0: 0, y1 });
  { const xk = LSD.x1 - 0.5, xl = LSD.x1 - 3.85;                                           // just off the kerb; the lane line
    mask.snow(xl + 0.2, LSD.x1, WORK[0] + 1, WORK[1] - 4, 0.62);
    for (let i = 0; i < 6; i++) drums.push([xk + (xl - xk) * i / 5, WORK[1] - 1 - i * 2.1]);     // the taper, where the northbound traffic meets it
    for (const z of [151, 147, 143, 139]) drums.push([xl - 0.05, z]);
    for (const zc of [163.5, 159.4, 155.3]) {
      const g = barrierGeo(3.7); g.translate(xl, 0, zc); put(hard, g, CONCRETE);
      const cap = new THREE.BoxGeometry(0.2, 0.05, 3.6); cap.translate(xl, 0.835, zc); rel.addGeometry('snow|LSD-S', cap);
      plan.surfaces.push({ skin: 'wall', fixed: true, x0: xl - 0.11, x1: xl + 0.11, z0: zc - 1.85, z1: zc + 1.85, axis: null, h0: 0.86, h1: 0.86, base: 0 });      // its top, a rail to ride
      O.push({ x0: xl - 0.3, x1: xl + 0.3, z0: zc - 1.85, z1: zc + 1.85, y0: 0, y1: 0.78 });
    }
    for (const [x0, x1, z0, z1, t] of [[xl + 0.55, xk - 0.25, 156.2, 158.75, 0.026], [xl + 0.65, xk - 0.15, 158.8, 161.35, 0.026], [xl + 0.5, xk - 0.3, 161.4, 163.95, 0.026]]) {
      const y0 = 0.004, y1 = t + 0.004, g = new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0); g.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); put(hard, g, PLATE);
      plan.surfaces.push({ skin: 'wall', fixed: true, x0, x1, z0, z1, axis: null, h0: y1, h1: y1, base: 0, roadwork: true });
      mask.snow(x0 - 0.4, x1 + 0.4, z0 - 0.4, z1 + 0.4, 0.2);
    }
    // the spoil: a heap of dug-out ground under the snow, a mound to run up and jump from
    { const cx = (xl + xk) / 2 + 0.2, cz = 146.6, rx = 1.5, rz = 2.3, H = 0.62, f = (x, z) => { const d = Math.hypot((x - cx) / rx, (z - cz) / rz); return d >= 1 ? 0 : H * (0.5 + 0.5 * Math.cos(Math.PI * d)) * (0.86 + 0.14 * Math.cos(x * 3.1 + z * 2.3)); };
      rel.add('snow|LSD-S', range(cx - rx, cx + rx, 0.3), range(cz - rz, cz + rz, 0.3), f, { top: H, lift: 0.012, uv: 3, colour: (x, z, h) => { const q = 0.25 + 0.5 * hash(x * 5, z * 5, 3) * (1 - h / H); return [CLEAN[0] + (0.42 - CLEAN[0]) * q, CLEAN[1] + (0.36 - CLEAN[1]) * q, CLEAN[2] + (0.3 - CLEAN[2]) * q]; } }); }
    signs.push([LSD.x1 + 0.7, WORK[1] + 14, 'work', 0], [LSD.x1 + 0.7, WORK[1] + 40, 'workahead', 0]);      // (northbound traffic meets them coming up from the south)
  }
  { const dg = drumGeo(), M4 = new THREE.Matrix4(), cap = new THREE.SphereGeometry(0.255, 14, 5, 0, Math.PI * 2, 0, Math.PI / 2); cap.scale(1, 0.3, 1);
    for (const [x, z] of drums) { solid(x - 0.3, x + 0.3, z - 0.3, z + 0.3, 1.0); put(hard, dg, null, M4.makeRotationY(hash(x, z, 1) * 6.28).setPosition(x, 0.004, z)); const c = cap.clone(); c.translate(x, 1.02, z); rel.addGeometry('snow|LSD-S', c); } }

  // ------------------------------------------------------------------------------------------- signs
  // [x, z, which, yaw]: a plate on a steel post, facing the traffic it is for (yaw 0 faces +z, towards northbound cars).
  for (const z of [36, 196]) { signs.push([LSD.x0 - 0.75, z, 'speed', Math.PI]); signs.push([LSD.x1 + 0.75, z + 30, 'speed', 0]); }
  signs.push([C.x0 - 0.75, TABLE.z0 - 13, 'hump', Math.PI], [C.x1 + 0.75, TABLE.z1 + 13, 'hump', 0], [C.x0 - 0.75, TABLE.z0 - 1.9, 'ped', Math.PI], [C.x1 + 0.75, TABLE.z1 + 1.9, 'ped', 0]);
  signs.push([344 - 7, MO.z1 + 0.75, 'bump', -Math.PI / 2], [330 + 7, JA.z0 - 0.75, 'bump', Math.PI / 2]);
  let signFaces = null;
  { const KINDS = { speed: [['SPEED', 'LIMIT', '40'], { bg: '#f2f2ee', fg: '#111' }, 0.6, 0.75], hump: [['RAISED', 'CROSS', 'WALK'], { bg: '#f2c318', fg: '#111', diamond: true }, 0.86, 0.86], ped: [['STOP', 'FOR', 'PEOPLE'], { bg: '#f2c318', fg: '#111', diamond: true }, 0.7, 0.7], bump: [['BUMP'], { bg: '#f2c318', fg: '#111', diamond: true }, 0.8, 0.8], ice: [['BRIDGE', 'ICES', 'FIRST'], { bg: '#f2c318', fg: '#111', diamond: true }, 0.86, 0.86], work: [['ROAD', 'WORK'], { bg: '#f47a16', fg: '#111', diamond: true }, 0.95, 0.95], workahead: [['RIGHT', 'LANE', 'CLOSED'], { bg: '#f47a16', fg: '#111', diamond: true }, 0.95, 0.95] };
    const sheet = plateSheet(KINDS), faces = [];
    for (const [x0, z0, kind, yaw] of signs) {
      let x = x0, z = z0; for (let k = 0; k < 4 && blocked(x, z, 0.35); k++) { x += Math.abs(Math.sin(yaw)) * 1.6; z += Math.abs(Math.cos(yaw)) * 1.6; }
      const [, { diamond }, w, h] = KINDS[kind], top = 2.75, cy = top - h / 2 - 0.05, fx = Math.sin(yaw), fz = Math.cos(yaw), [u0, v0, du, dv] = sheet.cell[kind];
      const post = new THREE.CylinderGeometry(0.03, 0.03, top, 8, 1, true); post.translate(x, top / 2, z); put(hard, post, ZINC);
      const face = new THREE.PlaneGeometry(w, h), uv = face.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, u0 + uv.getX(i) * du, v0 + uv.getY(i) * dv);
      face.rotateY(yaw); face.translate(x + fx * 0.036, cy, z + fz * 0.036); faces.push(face);
      const back = new THREE.PlaneGeometry(w * (diamond ? 0.68 : 0.76), h * (diamond ? 0.68 : 0.95)); if (diamond) back.rotateZ(Math.PI / 4); back.rotateY(yaw + Math.PI); back.translate(x + fx * 0.03, cy, z + fz * 0.03); put(hard, back, ZINC);
      solid(x - 0.04, x + 0.04, z - 0.04, z + 0.04, top);
    }
    if (faces.length) signFaces = add(new THREE.Mesh(mergeGeometries(faces), winterRoad(new THREE.MeshStandardMaterial({ map: sheet.map, roughness: 0.6, emissiveMap: sheet.map, emissive: new THREE.Color(0.3, 0.3, 0.3), emissiveIntensity: 1, alphaTest: 0.5 }))));
  }

  // ------------------------------------------------------------------------------------ into the world
  const snowM = bankMaterial(museum.snowTex);
  const banks = rel.meshes('snow', snowM); banks.forEach(add);
  const roadPiece = add(rel.mesh('road', asphaltMaterial()));
  // (the poles and the rest, glowing a little with their own colour as everything out here does, so the drums read orange in the dark)
  const hardM = winterRoad(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, metalness: 0.2, emissive: 0xffffff, emissiveIntensity: 0.2 }));
  hardM.onBeforeCompile = (prev => (sh, r) => { prev(sh, r); sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance *= vColor.rgb;'); })(hardM.onBeforeCompile); hardM.customProgramCacheKey = () => 'winter-hard';
  const hardMesh = hard.length ? add(new THREE.Mesh(mergeGeometries(hard), hardM)) : null;
  if (lenses.length) add(new THREE.Mesh(mergeGeometries(lenses), new THREE.MeshBasicMaterial({ vertexColors: true, fog: false })));
  let iceMesh = null;
  if (!iceG.empty) { const im = new THREE.MeshStandardMaterial({ color: 0x0a121c, roughness: 0.07, transparent: true, opacity: 0.9, alphaMap: radial(0.25, 0.45), depthWrite: false, emissive: 0x0b1522, emissiveIntensity: 0.6, polygonOffset: true, polygonOffsetFactor: -6, polygonOffsetUnits: -6 });
    if (museum.mirror) museum.mirror.patch(im, [0.3, 0.6]);
    iceMesh = add(new THREE.Mesh(iceG.build(), winterRoad(im))); iceMesh.renderOrder = -1; }

  // The map, the mirror, and (below, once everything is built) the road meshes kept out of their own reflection (reflect.js).
  ROAD.tRoadMask.value = mask.texture(); ROAD.uRoadK.value.set(1, 0.6, 0, 0);
  const mirror = museum.mirror;
  if (mirror) { ROAD.tRoadRefl.value = mirror.rt.texture; ROAD.roadReflM.value = mirror.matrix; ROAD.roadReflOn = mirror.strength; ROAD.roadReflY = mirror.level; }
  const asphalt = asphaltMaterial(), hideRoads = root => root.traverse(o => { if (o.isMesh && o.material === asphalt && !museum.floors.includes(o)) museum.floors.push(o); });
  void roadPiece;      // (not here: lights.js, built after this, takes every mesh in museum.floors for a gallery floor and gives its material a room; the roads join the list last, below)
  plan.streetLights = lights.map(([x, z, ax, az, arms, h, reach, ch]) => ({ x, z, h, ch, ax, az, arms, reach }));

  // Last of all, once every feature has built what it builds (features.js; this registers after src/look.js): the lamps
  // shine on the snow too, whoever drew it, and any road laid since is kept out of the mirror.
  if (!registered) { registered = true;
    feature({ id: 'winterroads', init(k) {
      const snow = k.museum.snowTex && k.museum.snowTex.source; let n = 0;
      k.G.scene.traverse(o => { for (const m of [].concat(o.material || [])) if (m && m.isMeshStandardMaterial && !m.userData.winterRoad && snow && m.map && m.map.source === snow) { winterRoad(m, 'lit'); m.needsUpdate = true; n++; } });
      hideRoads(k.G.scene); this.snowMats = n;
      for (const m of [...banks, hardMesh, signFaces, iceMesh]) if (m && !k.museum.floors.includes(m)) k.museum.floors.push(m);      // (the windrows, the poles and the signs too: none is missed in a wet road's reflection, where the lamps' glass and glare are what shows, and each would be drawn twice)
    } }); }
}
