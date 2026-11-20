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
import { groundAt, GRAVITY } from './plan.js';

// (A table has a `foot`: something low enough goes under the top and meets only that.)
// r: how big round it is; h: how tall; m: how heavy (a toy car is about 1); lie: how far off the floor its
// middle is when it is on its side; tip: how hard it must be hit to go over.
const TYPES = {
  chair: { r: 0.27, h: 0.9, m: 1.0, lie: 0.21, tip: 2.4 },
  stool: { r: 0.2, h: 0.62, m: 0.8, lie: 0.17, tip: 1.8 },
  highchair: { r: 0.27, h: 1.3, m: 1.1, lie: 0.21, tip: 2.0 },
  barstool: { r: 0.2, h: 0.75, m: 0.9, lie: 0.17, tip: 1.6 },
  lowstool: { r: 0.2, h: 0.5, m: 0.8, lie: 0.17, tip: 2.0 },
  bin: { r: 0.17, h: 0.5, m: 0.6, lie: 0.15, tip: 1.6 },
  post: { r: 0.17, h: 0.95, m: 1.3, lie: 0.05, tip: 2.0 },
  round: { r: 0.44, h: 0.76, m: 4, lie: 0.4, tip: 5.2, foot: 0.27 },
  square: { r: 0.46, h: 0.76, m: 4.5, lie: 0.4, tip: 5.4, foot: 0.27 },
  round4: { r: 0.62, h: 0.76, m: 6.5, lie: 0.58, tip: 6.4, foot: 0.36 },
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
    const marks = [...(plan.marks || []), ...(plan.looseExtra || [])].filter(m => m.kind === 'loose' && TYPES[m.type]);
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
    this.fixed = null;
    this.reset();
  }

  /** A new night: everything back where the fit-out put it. */
  reset() {
    for (const b of this.bodies) {
      const d = b.def; b.x = d.x; b.y = d.y; b.z = d.z; b.vx = b.vy = b.vz = 0; b.yaw = d.yaw || 0; b.av = 0; b.rest = true;
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

  // What does not move, in and round the rooms these are in: found once, the first time it is wanted.
  _fixed(r) {
    const out = [];
    for (const o of this.plan.obstacles) if (o.x1 > r.x0 && o.x0 < r.x1 && o.z1 > r.z0 && o.z0 < r.z1 && o.y1 > r.y + 0.05 && o.y0 < r.y + 0.6) out.push(o);
    return out;
  }
  _wake(b) {
    if (!b.rest) return; b.rest = false; this.awake++; b.set.awake++;
    if (b.def.up != null || b.y > groundAt(this.plan, b.x, b.z, b.y + 0.15, 0.2) + 0.02 || true) for (const o of b.set.list) if (o !== b && o.rest && Math.abs(o.x - b.x) < 0.12 && Math.abs(o.z - b.z) < 0.12 && o.y > b.y) this._wake(o);      // what was stacked on it comes down too
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
    for (const s of here) if (!s.fixed) s.fixed = this._fixed(s.R);
    dt = Math.min(dt, 0.05);
    const now = performance.now(), knock = (f, heavy) => { if (this.sound && now - (this._kt || 0) > 70) { this._kt = now; this.sound.knock(f, heavy); } };
    // 1. whatever has been run into
    if (near) for (let k = 0; k < movers.length; k++) {
      const m = movers[k];
      for (const s of here) for (const b of s.list) {
        const dx = b.x - m.x, dz = b.z - m.z, rr = (b.T.foot && Math.abs(b.tip) < 0.3 && m.y + 0.36 < b.y + 0.68 ? b.T.foot : b.T.r) + m.r;
        if (dx > rr || dx < -rr || dz > rr || dz < -rr) continue;
        const d2 = dx * dx + dz * dz; if (d2 > rr * rr) continue;
        const top = b.y + (Math.abs(b.tip) > 0.8 ? b.T.r * 0.9 : b.T.h); if (m.y > top || m.y + 0.32 < b.y) continue;
        const d = Math.sqrt(d2) || 0.01, nx = dx / d, nz = dz / d, into = m.vx * nx + m.vz * nz, M = b.T.m, heavy = M > 2;
        if (heavy && into < 1.6) {
          // Too slow to shift it: it is the toy that stops. (And a nudge, so a car leaning on a table does creep it along.)
          if (k === 0 && v) { v.pos.x -= nx * (rr - d); v.pos.z -= nz * (rr - d); if (into > 0) { v.vel.x -= nx * into; v.vel.z -= nz * into; } }
          if (into > 0.5) { b.vx += nx * into * 0.25; b.vz += nz * into * 0.25; this._wake(b); }
          continue;
        }
        b.x = m.x + nx * (rr + 0.005); b.z = m.z + nz * (rr + 0.005);
        if (into < 0.15) { if (b.rest) this._place(b); continue; }
        const give = 1.25 / (0.35 + M);
        b.vx = nx * into * give + m.vx * 0.3 / M; b.vz = nz * into * give + m.vz * 0.3 / M;
        b.av += (nx * m.vz - nz * m.vx) * 2.2 / M + (Math.random() - 0.5) * (heavy ? 1 : 5);
        const hard = into > b.T.tip * (Math.abs(b.tip) > 0.8 ? 0.5 : 1);
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
    for (const s of this.setList) { if (!s.awake) continue; if (!s.fixed) s.fixed = this._fixed(s.R);
    for (const b of s.list) {
      if (b.rest) continue;
      const T = b.T, M = T.m;
      b.vy -= GRAVITY * dt; b.x += b.vx * dt; b.y += b.vy * dt; b.z += b.vz * dt; b.yaw += b.av * dt;
      b.tip += (b.to - b.tip) * Math.min(1, dt * 8);
      const g = groundAt(this.plan, b.x, b.z, b.y + 0.15, 0.2);
      if (b.y <= g) {
        b.y = g;
        if (b.vy < -1.4) { b.vy *= -0.3; knock(-b.vy * 2, M > 2); } else b.vy = 0;
        const f = Math.exp(-(M > 2 ? 6.5 : Math.abs(b.tip) > 0.8 ? 4.2 : 3.2) * dt); b.vx *= f; b.vz *= f; b.av *= Math.exp(-3 * dt);
      }
      // other furniture: a chair sent into a chair sends that one on
      for (const o of s.list) {
        if (o === b) continue;
        const dx = o.x - b.x, dz = o.z - b.z, rr = (T.r + o.T.r) * 0.86;
        if (dx > rr || dx < -rr || dz > rr || dz < -rr || Math.abs(o.y - b.y) > 0.7) continue;
        const d2 = dx * dx + dz * dz; if (d2 > rr * rr) continue;
        const d = Math.sqrt(d2) || 0.01, nx = dx / d, nz = dz / d, rel = (b.vx - o.vx) * nx + (b.vz - o.vz) * nz, share = M / (M + o.T.m), over = rr - d;
        b.x -= nx * over * (1 - share); b.z -= nz * over * (1 - share); o.x += nx * over * share; o.z += nz * over * share;
        if (rel > 0.25) {
          o.vx += nx * rel * share * 1.3; o.vz += nz * rel * share * 1.3; b.vx -= nx * rel * (1 - share) * 1.3; b.vz -= nz * rel * (1 - share) * 1.3;
          o.av += (Math.random() - 0.5) * 3 / o.T.m;
          if (rel * share > o.T.tip * 0.8 && Math.abs(o.to) < 0.1) { o.to = Math.PI / 2; o.ax = nz; o.az = -nx; }
          if (o.rest) this.knocked++;
          this._wake(o);
          if (rel > 1) knock(rel, false);
        } else if (o.rest) this._place(o);
      }
      // the walls of its room, and what is fixed down in it
      const r = s.R, R = T.r * 0.9;
      if (r) {
        if (b.x < r.x0 + R) { b.x = r.x0 + R; if (b.vx < 0) b.vx *= -0.4; } else if (b.x > r.x1 - R) { b.x = r.x1 - R; if (b.vx > 0) b.vx *= -0.4; }
        if (b.z < r.z0 + R) { b.z = r.z0 + R; if (b.vz < 0) b.vz *= -0.4; } else if (b.z > r.z1 - R) { b.z = r.z1 - R; if (b.vz > 0) b.vz *= -0.4; }
      }
      for (const o of s.fixed) {
        if (b.x < o.x0 - R || b.x > o.x1 + R || b.z < o.z0 - R || b.z > o.z1 + R || b.y > o.y1 || b.y + T.h * 0.6 < o.y0) continue;
        const cx = b.x < o.x0 ? o.x0 : b.x > o.x1 ? o.x1 : b.x, cz = b.z < o.z0 ? o.z0 : b.z > o.z1 ? o.z1 : b.z;
        let dx = b.x - cx, dz = b.z - cz; const d2 = dx * dx + dz * dz;
        if (d2 >= R * R) continue;
        if (d2 < 1e-8) { const l = b.x - o.x0, rgt = o.x1 - b.x, n = b.z - o.z0, s2 = o.z1 - b.z, k = Math.min(l, rgt, n, s2); if (k === l) { b.x = o.x0 - R; dx = -1; dz = 0; } else if (k === rgt) { b.x = o.x1 + R; dx = 1; dz = 0; } else if (k === n) { b.z = o.z0 - R; dx = 0; dz = -1; } else { b.z = o.z1 + R; dx = 0; dz = 1; } }
        else { const d = Math.sqrt(d2); dx /= d; dz /= d; b.x = cx + dx * R; b.z = cz + dz * R; }
        const into = b.vx * dx + b.vz * dz; if (into < 0) { b.vx -= dx * into * 1.4; b.vz -= dz * into * 1.4; if (into < -1.5) knock(-into, M > 2); }
      }
      if (b.y <= g + 1e-4 && b.vy === 0 && Math.hypot(b.vx, b.vz) < 0.07 && Math.abs(b.to - b.tip) < 0.03) { b.vx = b.vz = 0; b.av = 0; b.tip = b.to; b.rest = true; this.awake--; s.awake--; }
      this._place(b);
    } }
  }
}
