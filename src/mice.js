// The museum mice. One lives in each wing: the old building's north and south galleries, the Rice building,
// the Modern Wing and the lower level. Each has a hole in the skirting of a long gallery wall. Come close and
// the mouse runs for it, along the bottom of the wall, just ahead of the toy; keep up and you see it home.
// See all five home and you have found the museum mice.

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { feature } from './features.js';
import { wallSpots, sameFloor, claimed, claim, placingNow } from './placing.js';

const WINGS = [
  { id: 'north', name: 'the old building, north', test: r => r.building === 'main' && r.floor === '1' && r.x1 < 108 && r.z1 < 104 },
  { id: 'south', name: 'the old building, south', test: r => r.building === 'main' && r.floor === '1' && r.x1 < 108 && r.z0 > 112 },
  { id: 'rice', name: 'the Rice building', test: r => r.building === 'main' && r.x0 > 140 && r.z0 > 140 },
  { id: 'modern', name: 'the Modern Wing', test: r => r.building === 'modern' },
  { id: 'lower', name: 'the lower level', test: r => r.building === 'lower' || r.floor === 'LL' },
];
const RUN = 8.5;          // how far along the wall a mouse starts from its hole

function mouseGeometry() {
  const parts = [], col = (g, hex) => { g = g.index ? g.toNonIndexed() : g; const c = new THREE.Color(hex), n = g.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) a.set([c.r, c.g, c.b], i * 3); g.setAttribute('color', new THREE.BufferAttribute(a, 3)); g.deleteAttribute('uv'); return g; };
  const ball = (r, x, y, z, hex, sx = 1, sy = 1, sz = 1) => { const g = new THREE.SphereGeometry(r, 10, 7); g.scale(sx, sy, sz); g.translate(x, y, z); parts.push(col(g, hex)); };
  ball(0.03, 0, 0.028, 0, 0x8d8780, 1, 0.9, 1.7);            // body
  ball(0.02, 0, 0.034, 0.052, 0x948e86, 1, 0.9, 1.3);        // head
  ball(0.006, 0, 0.032, 0.078, 0xd99aa0);                   // nose
  ball(0.013, -0.016, 0.054, 0.046, 0xc9a0a0, 1, 1, 0.35);  // ears
  ball(0.013, 0.016, 0.054, 0.046, 0xc9a0a0, 1, 1, 0.35);
  ball(0.004, -0.011, 0.041, 0.066, 0x0a0a0a); ball(0.004, 0.011, 0.041, 0.066, 0x0a0a0a);   // eyes
  const t = new THREE.CylinderGeometry(0.003, 0.0025, 0.09, 5); t.rotateX(Math.PI / 2 - 0.25); t.translate(0, 0.016, -0.09); parts.push(col(t, 0xb8a8a0));
  return mergeGeometries(parts);
}

feature({
  id: 'mice',
  secrets: [['mice', 'The museum mice']],
  init(k) { this.k = k; this.list = []; },

  place() {
    const k = this.k, P = k.plan, taken = claimed(k.G);
    for (const w of WINGS) {
      let best = null;
      for (const r of P.rooms) {
        if (r.secret || r.passage || !w.test(r)) continue;
        const spots = wallSpots(P, k.museum, r, { step: 0.5, clear: 0.9, depth: 0.25, height: 0.2, width: 0.2 });
        // the longest clear stretch of one wall
        for (const side of ['n', 's', 'w', 'e']) {
          const s = spots.filter(q => q.side === side).sort((a, b) => a.u - b.u);
          for (let i = 0, j = 0; i < s.length; i = j) {
            for (j = i + 1; j < s.length && s[j].u - s[j - 1].u < 0.55; j++);
            const len = s[j - 1].u - s[i].u; if (len < RUN + 0.6) continue;
            const a = s[i], b = s[j - 1], hole = { x: b.x, y: r.y, z: b.z };
            let far = 60; for (const t of taken) far = Math.min(far, sameFloor(hole, t));
            const score = Math.min(len, 16) + (r.kind === 'gallery' ? 4 : 0) + far * 0.1;
            if (!best || score > best.score) best = { score, r, a, b, side };
          }
        }
      }
      if (!best) continue;
      const { r, a, b } = best, horiz = best.side === 'n' || best.side === 's';
      // hole at one end of the stretch; the mouse starts RUN metres back along it
      const holeU = b.u - 0.2, startU = holeU - RUN, dir = 1;
      const at = u => ({ x: horiz ? u : a.x, z: horiz ? a.z : u });
      const m = { id: 'mouse-' + w.id, wing: w, room: r.id, y: r.y, nx: a.nx, nz: a.nz, horiz, holeU, startU, dir, u: startU, state: 'peek', t: 0, far: 0 };
      const h = at(holeU); m.hole = { x: h.x, y: r.y, z: h.z };
      m.at = u => { const p = at(u); return { x: p.x + m.nx * 0.09, z: p.z + m.nz * 0.09 }; };
      this.list.push(m); claim(m.hole);
    }
    this.tally = this.k.tally('mice', this.list.length);
    this._build(); this.placed = true;
  },

  _build() {
    const k = this.k, geo = mouseGeometry(), mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, emissive: 0x1a1816, emissiveIntensity: 0.6 });
    const holeGeo = new THREE.CircleGeometry(0.055, 14, 0, Math.PI), holeMat = new THREE.MeshBasicMaterial({ color: 0x050403 });
    const rimGeo = new THREE.RingGeometry(0.055, 0.066, 14, 1, 0, Math.PI), rimMat = new THREE.MeshStandardMaterial({ color: 0x6a5a48, roughness: 1 });
    for (const m of this.list) {
      const hole = new THREE.Group(), face = Math.atan2(m.nx, m.nz);
      hole.add(new THREE.Mesh(holeGeo, holeMat), new THREE.Mesh(rimGeo, rimMat));
      hole.position.set(m.hole.x + m.nx * 0.006, m.y, m.hole.z + m.nz * 0.006); hole.rotation.y = face; k.group.add(hole);
      m.mesh = new THREE.Mesh(geo, mat); k.group.add(m.mesh);
      if (this.tally.has(m.id)) { m.state = 'done'; m.u = m.holeU - 0.16; }
      this._put(m, m.state === 'done' ? -m.dir : m.dir);
    }
  },
  _put(m, facing) {
    const p = m.at(m.u); m.mesh.position.set(p.x, m.y + 0.002, p.z);
    m.mesh.rotation.y = m.horiz ? (facing > 0 ? Math.PI / 2 : -Math.PI / 2) : (facing > 0 ? 0 : Math.PI);
    m.mesh.visible = m.state !== 'home';
  },

  active(k) { return k.G.mode !== 'race' && !k.plan.racing; },
  update(dt, k) {
    if (!this.placed) this.place();
    const p = k.pos, v = k.v, speed = v && v.vel ? Math.hypot(v.vel.x, v.vel.z) : 0;
    for (const m of this.list) {
      const q = m.at(m.u), d = sameFloor(p, { x: q.x, y: m.y, z: q.z });
      if (d > 30 && m.state !== 'run') { if (m.mesh.visible !== (m.state !== 'home') ) m.mesh.visible = m.state !== 'home'; continue; }
      m.t += dt;
      if (m.state === 'done' || m.state === 'peek') {
        // sitting up and sniffing, only while someone is near enough to see
        m.mesh.position.y = m.y + 0.002 + Math.max(0, Math.sin(m.t * 9)) * 0.004;
        m.mesh.rotation.z = Math.sin(m.t * 2.3) * 0.08;
        if (m.state === 'peek' && d < 3.5) { m.state = 'run'; m.far = 0; k.synth.note(2600, 0.05, { type: 'sine', vol: 0.02 }); k.synth.note(3100, 0.04, { type: 'sine', vol: 0.02, at: 0.07 }); k.once('mouse-first', 'A mouse! It is off along the skirting. Follow it.', 4); }
      } else if (m.state === 'run') {
        // just ahead of the toy: as fast as it comes, and waiting if it falls behind
        const sp = d > 7 ? 0 : Math.min(5, Math.max(1.2, speed + 0.8));
        m.u = Math.min(m.holeU, m.u + m.dir * sp * dt);
        m.mesh.position.y = m.y + 0.002 + (sp ? Math.abs(Math.sin(m.t * 30)) * 0.006 : 0);
        m.mesh.rotation.z = 0;
        m.far = d > 12 ? m.far + dt : 0;
        if (m.far > 5) { m.state = 'peek'; m.u = m.startU; m.t = 0; }                       // lost it: back where it was
        else if (m.u >= m.holeU - 0.01) {
          m.state = 'home'; m.t = 0;
          if (d < 6) {
            if (this.tally.add(m.id)) {
              k.synth.chime([1568, 2093], { vol: 0.04, gap: 0.1, dur: 0.6 });
              k.say(this.tally.done ? 'Home! That is all five museum mice followed home.' : `Home! ${this.tally.count} of ${this.tally.total} museum mice followed home (one lives in each wing).`, 5);
              if (this.tally.done) k.find('mice');
            }
            m.followed = true;
          }
        }
        this._put(m, m.dir);
      } else if (m.state === 'home' && m.t > (m.followed ? 4 : 30)) {
        // out again: one that was followed sits by its hole from now on; one that was not, back where it was
        if (m.followed) { m.state = 'done'; m.u = m.holeU - 0.16; this._put(m, -m.dir); }
        else { m.state = 'peek'; m.u = m.startU; this._put(m, m.dir); }
      }
    }
  },
  spots(k) {
    if (!this.placed && !placingNow()) { this.k = this.k || k; this.place(); }
    return (this.list || []).map(m => ({ kind: 'secret', id: 'mice', name: 'Mouse hole: ' + m.wing.name, x: m.hole.x, y: m.y, z: m.hole.z }));
  },
  reset() { for (const m of this.list || []) if (m.state !== 'done') { m.state = 'peek'; m.u = m.startU; m.t = 0; if (m.mesh) this._put(m, m.dir); } },
});
