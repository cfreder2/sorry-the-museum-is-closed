// Furniture that is not fixed down: the café's chairs, stools, bins, queue posts and small tables.
//
// The same idea as the cones and wet-floor signs in src/props.js (hit one and it goes, and lies where
// it lands), cut down so that a hundred and sixty of them cost next to nothing: each kind is one
// instanced mesh, a thing at rest is only looked at to see whether something has run into it, and
// only the ones that are moving are moved. Where they stand at the start of the night is decided by
// the fit-out (src/furnish.js, which leaves a note for each); they stay where they are left until the
// next night.
//
// A chair can be shoved along at a crawl and sent flying at speed. A table is heavier: it takes a
// real hit to shift one and a hard one to tip it, and running into one slowly just stops you.

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { groundAt, keepClear, solidsNear, GRAVITY } from './plan.js';

// (A table has a `foot`: something low enough goes under the top and meets only that.)
// r: how big round it is standing; w: how wide (half) it is lying down; h: how tall; m: how heavy (a toy car is about 1);
// lie: how far off the floor its middle is when it is on its side; tip: how hard it must be hit to go over.
const TYPES = {
  chair: { r: 0.27, w: 0.22, h: 0.9, m: 1.0, lie: 0.21, tip: 2.4 },
  stool: { r: 0.2, w: 0.2, h: 0.62, m: 0.8, lie: 0.17, tip: 1.8 },
  highchair: { r: 0.27, w: 0.22, h: 1.3, m: 1.1, lie: 0.21, tip: 2.0 },
  barstool: { r: 0.2, w: 0.2, h: 0.75, m: 0.9, lie: 0.17, tip: 1.6 },
  lowstool: { r: 0.2, w: 0.2, h: 0.5, m: 0.8, lie: 0.17, tip: 2.0 },
  bin: { r: 0.17, w: 0.165, h: 0.5, m: 0.6, lie: 0.15, tip: 1.6 },
  post: { r: 0.17, w: 0.17, h: 0.95, m: 1.3, lie: 0.05, tip: 2.0 },
  wetfloor: { r: 0.2, w: 0.16, h: 0.64, m: 0.4, lie: 0.04, tip: 1.0 },
  round: { r: 0.44, w: 0.42, h: 0.76, m: 4, lie: 0.4, tip: 5.2, foot: 0.27 },
  square: { r: 0.46, w: 0.42, h: 0.76, m: 4.5, lie: 0.4, tip: 5.4, foot: 0.27 },
  round4: { r: 0.62, w: 0.6, h: 0.76, m: 6.5, lie: 0.58, tip: 6.4, foot: 0.36 },
};

const DARK = [0.12, 0.125, 0.135], WHITE = [1, 1, 1], STEEL = [0.5, 0.52, 0.56];
function tint(g, c) { const n = g.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) a.set(c, i * 3); g.setAttribute('color', new THREE.BufferAttribute(a, 3)); return g; }
const bx = (w, h, d, x, y, z, c = WHITE) => tint(new THREE.BoxGeometry(w, h, d).translate(x, y, z), c);
const cy = (r0, r1, h, x, y, z, c = WHITE, seg = 10) => tint(new THREE.CylinderGeometry(r0, r1, h, seg).translate(x, y, z), c);
function shape(type) {
  const p = [];
  if (type === 'chair' || type === 'highchair') {
    const s = type === 'chair' ? 0.44 : 0.84;
    p.push(bx(0.44, 0.05, 0.44, 0, s, 0), bx(0.44, 0.46, 0.05, 0, s + 0.26, -0.2), bx(0.4, 0.03, 0.03, 0, s - 0.14, -0.19, DARK));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) p.push(bx(0.03, s - 0.02, 0.03, sx * 0.19, (s - 0.02) / 2, sz * 0.19, DARK));
  } else if (type === 'stool' || type === 'barstool' || type === 'lowstool') {
    const s = type === 'stool' ? 0.6 : type === 'barstool' ? 0.73 : 0.48;
    p.push(cy(0.17, 0.17, 0.045, 0, s, 0, WHITE, 12), cy(0.025, 0.025, s - 0.04, 0, s / 2, 0, DARK, 6), cy(0.2, 0.2, 0.03, 0, 0.015, 0, DARK, 12), cy(0.13, 0.13, 0.015, 0, 0.24, 0, STEEL, 10));
  } else if (type === 'bin') {
    p.push(cy(0.16, 0.13, 0.46, 0, 0.23, 0, WHITE, 10), cy(0.165, 0.165, 0.04, 0, 0.48, 0, DARK, 10));
  } else if (type === 'wetfloor') {                     // two boards leaning on each other
    for (const sg of [-1, 1]) p.push(tint(new THREE.BoxGeometry(0.3, 0.66, 0.02).rotateX(sg * 0.3).translate(0, 0.31, -sg * 0.1), WHITE), tint(new THREE.BoxGeometry(0.2, 0.2, 0.004).rotateX(sg * 0.3).translate(0, 0.38, -sg * 0.112), DARK));
  } else if (type === 'post') {
    p.push(cy(0.022, 0.022, 0.9, 0, 0.47, 0, STEEL, 8), cy(0.16, 0.17, 0.035, 0, 0.018, 0, DARK, 12), cy(0.04, 0.04, 0.05, 0, 0.93, 0, WHITE, 8));
  } else {
    const big = type === 'round4';
    if (type === 'square') p.push(bx(0.8, 0.04, 0.8, 0, 0.74, 0), bx(0.74, 0.03, 0.74, 0, 0.705, 0, DARK));
    else p.push(cy(big ? 0.62 : 0.42, big ? 0.62 : 0.42, 0.04, 0, 0.74, 0, WHITE, big ? 18 : 14), cy(big ? 0.58 : 0.38, big ? 0.58 : 0.38, 0.02, 0, 0.71, 0, DARK, 12));
    p.push(cy(0.04, 0.04, 0.7, 0, 0.36, 0, DARK, 6), cy(big ? 0.34 : 0.25, big ? 0.36 : 0.27, 0.03, 0, 0.015, 0, DARK, 10));
  }
  const g = mergeGeometries(p.map(q => q.toNonIndexed())); g.computeBoundingSphere(); return g;
}

export class Loose {
  constructor(museum, plan, sound) {
    this.museum = museum; this.plan = plan; this.sound = sound; this.group = new THREE.Group(); this.onHit = null;
    const marks = [...(plan.marks || []), ...(plan.looseExtra || [])].filter(m => m.kind === 'loose' && TYPES[m.type]);      // (a shut room's chairs are not among them: src/furnish.js keeps no marks for it)
    this.bodies = marks.map(m => ({ def: m, T: TYPES[m.type], type: m.type, x: m.x, y: m.y, z: m.z, vx: 0, vy: 0, vz: 0, yaw: m.yaw || 0, av: 0, tip: 0, to: 0, ax: 1, az: 0, rest: true, i: 0, mesh: null }));
    // Each room keeps its own list: only the room the toy is in (or beside) is ever looked at, so two thousand chairs
    // elsewhere in the building cost nothing. `R` is the room (or, outdoors, the patch of ground they are kept to).
    this.sets = new Map();
    for (const b of this.bodies) { const id = b.def.room, R = plan.byId[id] || (b.def.bounds && { id, ...b.def.bounds }); if (!R) continue; let s = this.sets.get(id); if (!s) this.sets.set(id, s = { R, list: [], fixed: null, awake: 0 }); s.list.push(b); b.set = s; }
    this.bodies = this.bodies.filter(b => b.set); this.setList = [...this.sets.values()];
    this.rooms = this.setList.map(s => s.R);
    this.mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7, metalness: 0.05, emissive: 0xffffff, emissiveIntensity: 0.06 });
    // (it glows a little with its own colour, as everything in the back rooms does, and more when the lights are on)
    this.mat.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n\ttotalEmissiveRadiance *= vColor.rgb;'); };
    this.meshes = {};
    const col = new THREE.Color();
    const geo = {}, levels = [...new Set(this.bodies.map(b => Math.round(b.set.R.y * 10) / 10))];
    for (const type of Object.keys(TYPES)) for (const lv of levels) {                    // one mesh for each kind on each floor: a floor not in sight is not drawn
      const list = this.bodies.filter(b => b.type === type && Math.round(b.set.R.y * 10) / 10 === lv); if (!list.length) continue;
      const mesh = new THREE.InstancedMesh(geo[type] || (geo[type] = shape(type)), this.mat, list.length); mesh.frustumCulled = false; mesh.userData.level = lv;
      list.forEach((b, i) => { b.i = i; b.mesh = mesh; mesh.setColorAt(i, col.set(b.def.col == null ? 0x8a9098 : b.def.col)); });
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      this.meshes[type + '|' + lv] = mesh; this.group.add(mesh);
    }
    this.count = this.bodies.length; this.awake = 0; this.knocked = 0;
    this._m = new THREE.Matrix4(); this._q = new THREE.Quaternion(); this._q2 = new THREE.Quaternion(); this._p = new THREE.Vector3(); this._s = new THREE.Vector3(1, 1, 1); this._a = new THREE.Vector3(); this._up = new THREE.Vector3(0, 1, 0);
    this._S = {}; this._SO = {}; this._pt = { x: 0, z: 0 }; this._out = { x: 0, z: 0, t: 0 }; this._ss = { dx: 0, dz: 0 };
    this.reset();
  }

  /** A new night: everything back where the fit-out put it. */
  reset() {
    for (const b of this.bodies) {
      const d = b.def; b.x = d.x; b.y = d.y; b.z = d.z; b.vx = b.vy = b.vz = 0; b.yaw = d.yaw || 0; b.av = 0; b.rest = true; b.lean = null;
      b.tip = b.to = d.tip ? Math.PI / 2 : 0; b.ax = Math.cos(b.yaw); b.az = -Math.sin(b.yaw);
      this._place(b);
    }
    this.awake = 0; this.knocked = 0; for (const s of this.setList) s.awake = 0;
    for (const m of Object.values(this.meshes)) m.instanceMatrix.needsUpdate = true;
  }

  _place(b) {
    this._q.setFromAxisAngle(this._up, b.yaw);
    if (b.tip) { this._q2.setFromAxisAngle(this._a.set(b.ax, 0, b.az), b.tip); this._q.premultiply(this._q2); }
    this._p.set(b.x, b.y + Math.sin(Math.min(Math.PI / 2, Math.abs(b.tip))) * b.T.lie, b.z);
    b.mesh.setMatrixAt(b.i, this._m.compose(this._p, this._q, this._s)); b.mesh.instanceMatrix.needsUpdate = true;
  }

  // Where it is on the floor: a capsule along the way it has fallen (a disc, standing up), from its foot `a` to `e` metres
  // out along (dx, dz), radius rad; h is how high it stands, for what it can go under. Partly over, it is partly each.
  _shape(b, S) {
    const T = b.T, s = Math.sin(Math.min(Math.PI / 2, Math.abs(b.tip))), rad = T.r + (T.w - T.r) * s;
    let a = rad - T.r * (1 - s), e = T.r * (1 - s) + T.h * s - rad; if (e < a) a = e = (a + e) / 2;
    S.dx = -b.az; S.dz = b.ax; S.rad = rad; S.a = a; S.e = e;
    S.ax = b.x + S.dx * a; S.az = b.z + S.dz * a; S.ex = S.dx * (e - a); S.ez = S.dz * (e - a);
    S.h = T.h * 0.6 * (1 - s) + 2 * T.w * s;       // (a chair standing goes in under a desk as far as its seat)
    S.reach = Math.max(Math.abs(a), Math.abs(e)) + rad;
    return S;
  }
  // Out of the walls of its room and whatever is fixed down there, by its whole footprint (S: its shape, which may have
  // been taken before it last moved: only the shape is used, not where it was). The push is left in this._out.
  _clear(b, S = this._shape(b, this._S)) {
    const st = b.set; if (!st.fixed) st.fixed = solidsNear(this.plan, st.R);
    const q = this._pt; q.x = b.x + S.dx * S.a; q.z = b.z + S.dz * S.a;
    if (!keepClear(q, b.y, S.h, S.ex, S.ez, S.rad, st.R, st.fixed, this._out)) return false;
    b.x += this._out.x; b.z += this._out.z; return true;
  }
  // What a wall or a column does to it when it runs into one: it comes off with a little of its speed, and, struck
  // off its middle (a chair lying on its side, hitting the wall with one end), swings round.
  _bounce(b, S, knock) {
    const o = this._out, l = Math.hypot(o.x, o.z); if (l < 1e-6) return;
    const nx = o.x / l, nz = o.z / l, L = S.e - S.a, rl = (o.t - 0.5) * L, rx = S.dx * rl, rz = S.dz * rl;
    const I = L > 0.05 ? 12 / ((L + 2 * S.rad) ** 2) : 0, rn = rz * nx - rx * nz;         // (one over its moment of inertia, for a mass of one)
    const vn = (b.vx + b.av * rz) * nx + (b.vz - b.av * rx) * nz;
    if (vn < 0) {
      const j = -1.4 * vn / (1 + rn * rn * I);
      b.vx += nx * j; b.vz += nz * j; b.av = Math.max(-14, Math.min(14, b.av + j * rn * I));
      if (vn < -1.5) knock(-vn, b.T.m > 2);
    }
    // Going over, and the top meets the wall first: it stops there and leans on it.
    if (b.tip < b.to - 0.05 && o.t > 0.6 && o.x * S.dx + o.z * S.dz < 0) { b.to = b.tip; b.lean = b.lean || { x: 0, z: 0 }; b.lean.x = nx; b.lean.z = nz; }
  }
  _wake(b) {
    if (!b.rest) return; b.rest = false; this.awake++; b.set.awake++;
    for (const o of b.set.list) if (o !== b && o.rest && Math.abs(o.x - b.x) < 0.12 && Math.abs(o.z - b.z) < 0.12 && o.y > b.y) this._wake(o);      // what was stacked on it comes down too
  }

  /** movers: [{ x, y, z, vx, vz, r }], the first of them the toy being driven (`vehicle`), which a table can stop. */
  update(dt, movers, vehicle) {
    if (!this.count) return;
    const v = vehicle; if (!v) return;
    // The rooms to look at: the one the toy is in and any it is within a chair's throw of. Nothing else is touched.
    const here = this._here || (this._here = []); here.length = 0;
    for (const s of this.setList) { const r = s.R; if (v.pos.x > r.x0 - 1.5 && v.pos.x < r.x1 + 1.5 && v.pos.z > r.z0 - 1.5 && v.pos.z < r.z1 + 1.5 && v.pos.y > r.y - 1.5 && v.pos.y < r.y + r.h + 1) here.push(s); }
    const near = here.length > 0;
    for (const k in this.meshes) { const m = this.meshes[k]; m.visible = Math.abs(v.pos.y - m.userData.level) < 9; }
    { const s = here[0], st = s && this.museum.rooms[s.R.id], k = st && st.lum ? st.lum.value : s && !this.museum.rooms[s.R.id] ? 0.6 : this._lum || 0; this._lum = k; this.mat.emissiveIntensity = 0.05 + 0.3 * k; }
    if (!near && !this.awake) return;
    dt = Math.min(dt, 0.05);
    const knock = this._knock || (this._knock = (f, heavy) => { const t = performance.now(); if (this.sound && t - (this._kt || 0) > 70) { this._kt = t; this.sound.knock(f, heavy); } });
    const S = this._S, O = this._SO;
    // 1. whatever has been run into
    if (near) for (let k = 0; k < movers.length; k++) {
      const m = movers[k];
      for (const s of here) for (const b of s.list) {
        const T = b.T, far = T.h + T.r + m.r;
        if (b.x - m.x > far || m.x - b.x > far || b.z - m.z > far || m.z - b.z > far) continue;
        this._shape(b, S);
        // the nearest point of it to the mover
        const L2 = S.ex * S.ex + S.ez * S.ez; let t = L2 > 1e-8 ? ((m.x - S.ax) * S.ex + (m.z - S.az) * S.ez) / L2 : 0; t = t < 0 ? 0 : t > 1 ? 1 : t;
        const dx = S.ax + S.ex * t - m.x, dz = S.az + S.ez * t - m.z, rr = (T.foot && Math.abs(b.tip) < 0.3 && m.y + 0.36 < b.y + 0.68 ? T.foot : S.rad) + m.r;
        if (dx > rr || dx < -rr || dz > rr || dz < -rr) continue;
        const d2 = dx * dx + dz * dz; if (d2 > rr * rr) continue;
        const top = b.y + (Math.abs(b.tip) > 0.8 ? T.w * 1.8 : T.h); if (m.y > top || m.y + 0.32 < b.y) continue;
        const d = Math.sqrt(d2) || 0.01, nx = dx / d, nz = dz / d, into = m.vx * nx + m.vz * nz, M = T.m, heavy = M > 2;
        if (heavy && into < 1.6) {
          // Too slow to shift it: it is the toy that stops. (And a nudge, so a car leaning on a table does creep it along.)
          if (k === 0 && v) { v.pos.x -= nx * (rr - d); v.pos.z -= nz * (rr - d); if (into > 0) { v.vel.x -= nx * into; v.vel.z -= nz * into; } }
          if (into > 0.5) { b.vx += nx * into * 0.25; b.vz += nz * into * 0.25; this._wake(b); }
          continue;
        }
        b.x += nx * (rr - d + 0.005); b.z += nz * (rr - d + 0.005);
        // Shoved against a wall or a column, it goes no further, and nor does whatever is shoving it.
        if (this._clear(b, S)) {
          const back = -(this._out.x * nx + this._out.z * nz);
          if (back > 1e-3 && k === 0 && v) { v.pos.x -= nx * back; v.pos.z -= nz * back; if (into > 0) { v.vel.x -= nx * into; v.vel.z -= nz * into; } }
        }
        if (into < 0.15) { if (b.rest) this._place(b); continue; }
        const give = 1.25 / (0.35 + M);
        b.vx = nx * into * give + m.vx * 0.3 / M; b.vz = nz * into * give + m.vz * 0.3 / M;
        b.av += (nx * m.vz - nz * m.vx) * 2.2 / M + (Math.random() - 0.5) * (heavy ? 1 : 5);
        { const L = S.e - S.a; if (L > 0.05) { const rl = ((S.a + t * L) - (S.a + S.e) / 2), I = 12 / ((L + 2 * S.rad) ** 2); b.av += into * give * (S.dz * rl * nx - S.dx * rl * nz) * I * 0.6; } }      // (hit at one end, a thing lying down swings round)
        const hard = into > T.tip * (Math.abs(b.tip) > 0.8 ? 0.5 : 1);
        if (into > 1.2 && !heavy) b.vy = Math.max(b.vy, Math.min(2.6, 0.5 + into * 0.3) / M);
        if (hard && Math.abs(b.to) < 0.1) { b.to = Math.PI / 2; b.ax = nz; b.az = -nx; if (heavy) b.vy = 1.1; }
        if (k === 0 && v) { const drag = Math.min(0.75, 0.1 + 0.11 * M); v.vel.x -= nx * into * drag; v.vel.z -= nz * into * drag; }
        if (b.rest) this.knocked++;
        this._wake(b);
        if (into > 0.8) { knock(into, heavy); if (this.onHit) this.onHit(b, into); }
      }
    }
    if (!this.awake) return;
    // 2. whatever is on the move
    for (const s of this.setList) { if (!s.awake) continue;
    for (const b of s.list) {
      if (b.rest) continue;
      const T = b.T, M = T.m;
      b.vy -= GRAVITY * dt; b.y += b.vy * dt;
      if (b.av) {
        // Turning: about its middle, which for a thing on its side is halfway along it (so its foot swings round too).
        const da = b.av * dt; b.yaw += da;
        if (b.tip) { this._shape(b, S); const mm = (S.a + S.e) / 2, cx = b.x + S.dx * mm, cz = b.z + S.dz * mm, c = Math.cos(da), sn = Math.sin(da), ax = b.ax * c + b.az * sn, az = b.az * c - b.ax * sn; b.ax = ax; b.az = az; b.x = cx + az * mm; b.z = cz - ax * mm; }
      }
      if (b.lean && b.vx * b.lean.x + b.vz * b.lean.z > 0.15) { b.lean = null; b.to = Math.PI / 2; }      // drawn away from what it leant on, it goes on over
      b.tip += (b.to - b.tip) * Math.min(1, dt * 8);
      // Along the floor, in steps no longer than it is wide, so that it cannot jump a thin rail or a table leg.
      const n = Math.min(4, 1 + Math.floor((Math.abs(b.vx) + Math.abs(b.vz)) * dt / (T.r * 0.7)));
      for (let i = 0; i < n; i++) { b.x += b.vx * dt / n; b.z += b.vz * dt / n; if (this._clear(b, this._shape(b, S))) this._bounce(b, S, knock); }
      const g = groundAt(this.plan, b.x, b.z, b.y + 0.15, 0.2);
      if (b.y <= g) {
        b.y = g;
        if (b.vy < -1.4) { b.vy *= -0.3; knock(-b.vy * 2, M > 2); } else b.vy = 0;
        const f = Math.exp(-(M > 2 ? 6.5 : Math.abs(b.tip) > 0.8 ? 4.2 : 3.2) * dt); b.vx *= f; b.vz *= f; b.av *= Math.exp(-3 * dt);
      }
      // other furniture: a chair sent into a chair sends that one on. Each by its footprint, as with the walls.
      this._shape(b, S);
      let pushed = false;
      for (const o of s.list) {
        if (o === b) continue;
        const far = S.reach + o.T.h + o.T.r;
        if (o.x - b.x > far || b.x - o.x > far || o.z - b.z > far || b.z - o.z > far || Math.abs(o.y - b.y) > 0.7) continue;
        this._shape(o, O);
        const rr = (S.rad + O.rad) * 0.86;
        segSeg(S.ax, S.az, S.ex, S.ez, O.ax, O.az, O.ex, O.ez, this._ss);
        let dx = this._ss.dx, dz = this._ss.dz;
        if (dx > rr || dx < -rr || dz > rr || dz < -rr) continue;
        const d2 = dx * dx + dz * dz; if (d2 > rr * rr) continue;
        if (d2 < 1e-8) { dx = o.x - b.x || 0.01; dz = o.z - b.z; }
        const d = Math.sqrt(dx * dx + dz * dz) || 0.01, nx = dx / d, nz = dz / d, rel = (b.vx - o.vx) * nx + (b.vz - o.vz) * nz, share = M / (M + o.T.m), over = rr - Math.sqrt(d2);
        b.x -= nx * over * (1 - share); b.z -= nz * over * (1 - share); o.x += nx * over * share; o.z += nz * over * share; pushed = true;
        // (and if that one is up against a wall, it is this one that gives)
        if (this._clear(o, O)) { const back = -(this._out.x * nx + this._out.z * nz); if (back > 0) { b.x -= nx * back; b.z -= nz * back; } }
        if (rel > 0.25) {
          o.vx += nx * rel * share * 1.3; o.vz += nz * rel * share * 1.3; b.vx -= nx * rel * (1 - share) * 1.3; b.vz -= nz * rel * (1 - share) * 1.3;
          o.av += (Math.random() - 0.5) * 3 / o.T.m;
          if (rel * share > o.T.tip * 0.8 && Math.abs(o.to) < 0.1) { o.to = Math.PI / 2; o.ax = nz; o.az = -nx; }
          if (o.rest) this.knocked++;
          this._wake(o);
          if (rel > 1) knock(rel, false);
        } else if (o.rest) this._place(o);
        this._shape(b, S);
      }
      if (pushed && this._clear(b, S)) this._bounce(b, S, knock);
      if (b.y <= g + 1e-4 && b.vy === 0 && Math.hypot(b.vx, b.vz) < 0.07 && Math.abs(b.to - b.tip) < 0.03) { b.vx = b.vz = 0; b.av = 0; b.tip = b.to; b.rest = true; this.awake--; s.awake--; }
      this._place(b);
    } }
  }
}

// The nearest points of two segments on the floor, a + s u and b + t v (s, t in [0, 1]): o.dx, o.dz from the first to the second.
function segSeg(ax, az, ux, uz, bx, bz, vx, vz, o) {
  const cl = x => (x < 0 ? 0 : x > 1 ? 1 : x), rx = ax - bx, rz = az - bz, a = ux * ux + uz * uz, e = vx * vx + vz * vz, f = vx * rx + vz * rz;
  let s = 0, t = 0;
  if (a < 1e-8) t = e < 1e-8 ? 0 : cl(f / e);
  else {
    const c = ux * rx + uz * rz;
    if (e < 1e-8) s = cl(-c / a);
    else {
      const bb = ux * vx + uz * vz, den = a * e - bb * bb;
      s = den > 1e-8 ? cl((bb * f - c * e) / den) : 0; t = (bb * s + f) / e;
      if (t < 0) { t = 0; s = cl(-c / a); } else if (t > 1) { t = 1; s = cl((bb - c) / a); }
    }
  }
  o.dx = bx + vx * t - (ax + ux * s); o.dz = bz + vz * t - (az + uz * s);
}
