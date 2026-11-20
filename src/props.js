// Things that are not fixed down: traffic cones and wet-floor signs. Hit one
// and it goes flying, bounces off the walls, and lies where it lands.
// And snowmen, out in the grounds: drive through one and it comes apart.

import * as THREE from 'three';
import * as TX from './textures.js';
import { confine, groundAt, keepClear, solidsNear, GRAVITY } from './plan.js';

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
    const snowM = new THREE.MeshStandardMaterial({ color: 0xf2f5fb, roughness: 0.95, emissive: 0x596a8c, emissiveIntensity: 0.55 });
    const coal = new THREE.MeshStandardMaterial({ color: 0x0c0c0e, roughness: 0.8 }), carrot = new THREE.MeshStandardMaterial({ color: 0xff7a1c, roughness: 0.6, emissive: 0x7a2c04, emissiveIntensity: 0.6 });
    const twig = new THREE.MeshStandardMaterial({ color: 0x3a2a1c, roughness: 0.9, emissive: 0x16100a, emissiveIntensity: 0.6 }), scarf = new THREE.MeshStandardMaterial({ color: 0xb3242b, roughness: 0.9, emissive: 0x5a1014, emissiveIntensity: 0.6 });
    const ballG = new THREE.SphereGeometry(1, 16, 12), dotG = new THREE.SphereGeometry(0.022, 6, 5);
    this.snowmen = 0; this.busted = 0;
    this.items = plan.props.map(def => {
      const body = new THREE.Group();          // tips and rolls
      const root = new THREE.Group();          // moves and turns
      root.add(body);
      if (def.type === 'cone') {
        const c = new THREE.Mesh(coneG, orange); c.position.y = 0.146;
        const b = new THREE.Mesh(bandG, white); b.position.y = 0.15;
        const s = new THREE.Mesh(baseG, orange); s.position.y = 0.008;
        body.add(c, b, s);
      } else if (def.type === 'snowman') {
        // Three balls of snow, a carrot, coal, a scarf, two twigs and a hat. Each ball (with whatever is stuck in it) is a lump that can fly off on its own.
        const k = def.s || 1, lumps = [];
        const lump = (r, y) => { const g = new THREE.Group(); const m = new THREE.Mesh(ballG, snowM); m.scale.setScalar(r); g.add(m); g.position.y = y; body.add(g); lumps.push({ g, r: r * k, home: new THREE.Vector3(0, y, 0), pos: new THREE.Vector3(), vel: new THREE.Vector3(), spin: new THREE.Vector3(), rest: true }); return g; };
        const base = lump(0.3, 0.27), mid = lump(0.215, 0.69), head = lump(0.15, 0.99);
        const dot = (g, x, y, z) => { const m = new THREE.Mesh(dotG, coal); m.position.set(x, y, z); g.add(m); };
        for (const y of [-0.06, 0.05]) dot(mid, 0, y, 0.21);
        dot(head, -0.055, 0.045, 0.135); dot(head, 0.055, 0.045, 0.135);
        for (let i = -2; i <= 2; i++) dot(head, i * 0.03, -0.05 - (2 - Math.abs(i)) * 0.012, 0.14);
        const nose = new THREE.Mesh(new THREE.ConeGeometry(0.028, 0.17, 8), carrot); nose.rotation.x = Math.PI / 2; nose.position.set(0, 0, 0.21); head.add(nose);
        const wrap = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.035, 6, 14), scarf); wrap.rotation.x = Math.PI / 2; wrap.position.y = 0.19; mid.add(wrap);
        const tail = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.2, 0.025), scarf); tail.position.set(0.09, 0.1, 0.15); tail.rotation.z = -0.25; mid.add(tail);
        for (const sx of [-1, 1]) { const a = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.014, 0.38, 5), twig); a.position.set(sx * 0.33, 0.07, 0); a.rotation.z = -sx * 1.05; mid.add(a); }
        const hat = new THREE.Group(), brim = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.015, 14), coal), crown = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.1, 0.16, 14), coal);
        crown.position.y = 0.085; hat.add(brim, crown); hat.position.y = 1.125; hat.rotation.z = 0.12; body.add(hat);
        lumps.push({ g: hat, r: 0.06 * k, home: new THREE.Vector3(0, 1.125, 0), pos: new THREE.Vector3(), vel: new THREE.Vector3(), spin: new THREE.Vector3(), rest: true });
        void base;
        body.scale.setScalar(k);
        this.group.add(root); this.snowmen++;
        return { def, root, body, lumps, snow: true, bust: false, r: 0.3 * k, h: 1.2 * k, m: 1, pos: new THREE.Vector3(), vel: new THREE.Vector3(), yaw: 0, av: 0, tip: 0, tipTo: 0, tipAxis: 0, rest: true };
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
    this.busted = 0;
    for (const p of this.items) {
      p.pos.set(p.def.x, p.def.y || 0, p.def.z); p.vel.set(0, 0, 0);
      p.yaw = p.def.yaw || 0; p.av = 0; p.tip = p.tipTo = 0; p.rest = true;
      if (p.snow) { p.bust = false; for (const l of p.lumps) { l.g.position.copy(l.home); l.g.rotation.set(0, 0, l.g === p.lumps[3].g ? 0.12 : 0); l.rest = true; } }
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

  // A snowman stands until something runs into it, then every lump of it goes its own way and lies where it stops.
  _snowman(p, dt, movers) {
    if (!p.bust) {
      for (const m of movers) {
        const dx = p.pos.x - m.x, dz = p.pos.z - m.z, rr = p.r + m.r, sp = Math.hypot(m.vx, m.vz);
        if (dx * dx + dz * dz > rr * rr || m.y > p.h || m.y < -1 || sp < 0.5) continue;
        p.bust = true; this.busted++;
        const k = p.def.s || 1, d = Math.hypot(dx, dz) || 0.01, c = Math.cos(p.yaw), s2 = Math.sin(p.yaw);
        p.lumps.forEach((l, i) => {
          // Lumps are children of a scaled, turned body: work in that frame, where the ground is still y = 0.
          const vx = (m.vx * (0.35 + Math.random() * 0.5) + (dx / d) * sp * 0.25 + (Math.random() - 0.5) * 2.2) / k, vz = (m.vz * (0.35 + Math.random() * 0.5) + (dz / d) * sp * 0.25 + (Math.random() - 0.5) * 2.2) / k;
          l.vel.set(vx * c - vz * s2, (1.4 + Math.random() * 1.6 + sp * 0.18 + i * 0.5) / k, vx * s2 + vz * c);
          l.spin.set((Math.random() - 0.5) * 9, (Math.random() - 0.5) * 9, (Math.random() - 0.5) * 9);
          l.rest = false;
        });
        if (this.onHit) this.onHit(p, sp);
        break;
      }
      return;
    }
    const k = p.def.s || 1;
    for (const l of p.lumps) {
      if (l.rest) continue;
      l.vel.y -= GRAVITY / k * dt;
      l.g.position.addScaledVector(l.vel, dt);
      l.g.rotation.x += l.spin.x * dt; l.g.rotation.y += l.spin.y * dt; l.g.rotation.z += l.spin.z * dt;
      const floor = l.r / k * 0.7;                 // sunk a little way into the snow
      if (l.g.position.y <= floor) {
        l.g.position.y = floor;
        if (l.vel.y < -1.5) l.vel.y *= -0.22; else l.vel.y = 0;
        const f = Math.exp(-5 * dt); l.vel.x *= f; l.vel.z *= f; l.spin.multiplyScalar(Math.exp(-6 * dt));
        if (Math.hypot(l.vel.x, l.vel.z) < 0.1 && l.vel.y === 0) l.rest = true;
      }
    }
  }

  // movers: [{ x, y, z, vx, vz, r }]
  update(dt, movers) {
    const out = { x: 0, y: 0, z: 0 };
    for (const p of this.items) {
      if (p.snow) { this._snowman(p, dt, movers); continue; }
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
      // The walls (it may go out through a doorway), then whatever is fixed down near it: a column, a bench, a rail.
      const bounce = () => {
        const l = Math.hypot(out.x, out.z);
        if (l > 1e-6) {
          const nx = out.x / l, nz = out.z / l, into = p.vel.x * nx + p.vel.z * nz;
          if (into < 0) { p.vel.x -= nx * into * 1.5; p.vel.z -= nz * into * 1.5; if (into < -1.5 && this.onHit) this.onHit(p, -into); }
        }
      };
      if (confine(this.plan, p.pos, p.r, false, out, true)) bounce();
      if (!p.near || Math.abs(p.pos.x - p.near.x) > 3 || Math.abs(p.pos.z - p.near.z) > 3 || Math.abs(p.pos.y - p.near.y) > 1) {
        const R = 4; p.near = { x: p.pos.x, y: p.pos.y, z: p.pos.z }; p.solids = solidsNear(this.plan, { x0: p.pos.x - R, x1: p.pos.x + R, z0: p.pos.z - R, z1: p.pos.z + R, y: p.pos.y }, p.h + 0.1, 0);
      }
      if (keepClear(p.pos, p.pos.y, Math.abs(p.tip) > 0.8 ? p.r * 2 : p.h, 0, 0, p.r, null, p.solids, out)) bounce();
      this._place(p);
    }
  }
}
