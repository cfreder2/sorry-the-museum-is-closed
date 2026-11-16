// Things that are not fixed down: traffic cones and wet-floor signs. Hit one
// and it goes flying, bounces off the walls, and lies where it lands.

import * as THREE from 'three';
import * as TX from './textures.js';
import { confine, groundAt, GRAVITY } from './plan.js';

export class Props {
  constructor(plan) {
    this.plan = plan;
    this.group = new THREE.Group();
    this.onHit = null;        // (prop, speed)
    const orange = new THREE.MeshStandardMaterial({ color: 0xff5a14, roughness: 0.55, emissive: 0x7a2204, emissiveIntensity: 0.55 });
    const white = new THREE.MeshStandardMaterial({ color: 0xf2f2ee, roughness: 0.6, emissive: 0x555550, emissiveIntensity: 0.5 });
    const yellow = new THREE.MeshStandardMaterial({ map: TX.caution(), roughness: 0.6, emissive: 0x3a2e05, emissiveIntensity: 0.6, side: THREE.DoubleSide });
    const coneG = new THREE.ConeGeometry(0.075, 0.26, 14), bandG = new THREE.CylinderGeometry(0.043, 0.056, 0.05, 14), baseG = new THREE.BoxGeometry(0.19, 0.016, 0.19);
    const panelG = new THREE.PlaneGeometry(0.3, 0.62);
    this.items = plan.props.map(def => {
      const body = new THREE.Group();          // tips and rolls
      const root = new THREE.Group();          // moves and turns
      root.add(body);
      if (def.type === 'cone') {
        const c = new THREE.Mesh(coneG, orange); c.position.y = 0.146;
        const b = new THREE.Mesh(bandG, white); b.position.y = 0.15;
        const s = new THREE.Mesh(baseG, orange); s.position.y = 0.008;
        body.add(c, b, s);
      } else {
        for (const sgn of [-1, 1]) {
          const p = new THREE.Mesh(panelG, yellow);
          p.position.set(0, 0.3, sgn * 0.1); p.rotation.x = -sgn * 0.32; if (sgn < 0) { p.rotation.y = Math.PI; p.rotation.x = -0.32; }
          body.add(p);
        }
      }
      this.group.add(root);
      return { def, root, body, r: def.type === 'cone' ? 0.1 : 0.17, h: def.type === 'cone' ? 0.27 : 0.6, m: def.type === 'cone' ? 1 : 1.6,
        pos: new THREE.Vector3(), vel: new THREE.Vector3(), yaw: 0, av: 0, tip: 0, tipTo: 0, tipAxis: 0, rest: true };
    });
    this.reset();
  }

  reset() {
    for (const p of this.items) {
      p.pos.set(p.def.x, 0, p.def.z); p.vel.set(0, 0, 0);
      p.yaw = p.def.yaw || 0; p.av = 0; p.tip = p.tipTo = 0; p.rest = true;
      this._place(p);
    }
  }

  _place(p) {
    p.root.position.copy(p.pos);
    p.root.rotation.y = p.yaw;
    // Tip over about a horizontal axis: lying down, a cone's side is its radius off the floor.
    p.body.rotation.set(Math.cos(p.tipAxis) * p.tip, 0, Math.sin(p.tipAxis) * p.tip);
    p.body.position.y = Math.sin(Math.min(Math.PI / 2, Math.abs(p.tip))) * (p.def.type === 'cone' ? 0.07 : 0.02);
  }

  // movers: [{ x, y, z, vx, vz, r }]
  update(dt, movers) {
    const out = { x: 0, y: 0, z: 0 };
    for (const p of this.items) {
      for (const m of movers) {
        const dx = p.pos.x - m.x, dz = p.pos.z - m.z, rr = p.r + m.r;
        if (dx * dx + dz * dz > rr * rr || m.y > p.pos.y + p.h || m.y + 0.3 < p.pos.y) continue;
        const sp = Math.hypot(m.vx, m.vz);
        if (sp < 0.4) continue;
        const d = Math.hypot(dx, dz) || 0.01, nx = dx / d, nz = dz / d;
        // Thrown ahead of whatever hit it, and a little to the side it was struck on.
        p.vel.x = m.vx * 1.15 / p.m + nx * sp * 0.45; p.vel.z = m.vz * 1.15 / p.m + nz * sp * 0.45;
        p.vel.y = (1.2 + sp * 0.32) / p.m;
        p.av = (nx * m.vz - nz * m.vx) * 2.5 + (Math.random() - 0.5) * 6;
        p.tipTo = Math.PI / 2 * (Math.random() < 0.5 ? 1 : -1); p.tipAxis = Math.random() * Math.PI * 2;
        p.pos.x = m.x + nx * (rr + 0.02); p.pos.z = m.z + nz * (rr + 0.02);
        p.rest = false;
        if (this.onHit) this.onHit(p, sp);
      }
      if (p.rest) continue;
      p.vel.y -= GRAVITY * dt;
      p.pos.addScaledVector(p.vel, dt);
      p.yaw += p.av * dt;
      p.tip += (p.tipTo - p.tip) * Math.min(1, dt * 9);
      const g = groundAt(this.plan, p.pos.x, p.pos.z, p.pos.y + 0.15, 0.2);
      if (p.pos.y <= g) {
        p.pos.y = g;
        if (p.vel.y < -1.2) { p.vel.y *= -0.38; if (this.onHit) this.onHit(p, -p.vel.y * 2); } else p.vel.y = 0;
        const k = Math.exp(-3.2 * dt); p.vel.x *= k; p.vel.z *= k; p.av *= Math.exp(-2.5 * dt);
        if (Math.hypot(p.vel.x, p.vel.z) < 0.08 && p.vel.y === 0) { p.vel.set(0, 0, 0); p.av = 0; p.tip = p.tipTo; p.rest = true; }
      }
      if (confine(this.plan, p.pos, p.r, false, out, true)) {
        const l = Math.hypot(out.x, out.z);
        if (l > 1e-6) {
          const nx = out.x / l, nz = out.z / l, into = p.vel.x * nx + p.vel.z * nz;
          if (into < 0) { p.vel.x -= nx * into * 1.5; p.vel.z -= nz * into * 1.5; if (into < -1.5 && this.onHit) this.onHit(p, -into); }
        }
      }
      this._place(p);
    }
  }
}
