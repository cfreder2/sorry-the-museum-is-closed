// The two toys. Both are built from primitives at true scale, and both are
// driven the way the real ones are: two sticks.

import * as THREE from 'three';
import { confine, roomAt, groundAt, wallAt, heightOf, GRAVITY, STEP } from './plan.js';

const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.5, ...o });
const glow = (r, g, b) => new THREE.MeshBasicMaterial({ color: new THREE.Color(r, g, b) });

function part(geo, mat, x, y, z, parent) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  parent.add(m);
  return m;
}

// ------------------------------------------------------------------- car ---

export function buildCar(colour = 0xd2261c) {
  const g = new THREE.Group();
  const body = new THREE.Group();
  g.add(body);
  const paint = std(colour, { roughness: 0.3, emissive: colour, emissiveIntensity: 0.12 });
  const black = std(0x0c0c0e, { roughness: 0.7 });
  const trim = std(0xf3c21b, { roughness: 0.4, emissive: 0xf3c21b, emissiveIntensity: 0.15 });

  part(new THREE.BoxGeometry(0.2, 0.025, 0.42), black, 0, 0.07, 0, body);                     // chassis
  part(new THREE.BoxGeometry(0.19, 0.055, 0.4), paint, 0, 0.115, -0.005, body);               // tub
  const hood = part(new THREE.BoxGeometry(0.17, 0.03, 0.15), paint, 0, 0.15, 0.12, body);
  hood.rotation.x = 0.22;
  const cab = part(new THREE.BoxGeometry(0.15, 0.06, 0.15), std(0x10151c, { roughness: 0.15, metalness: 0.5 }), 0, 0.17, -0.03, body);
  cab.scale.set(1, 1, 1);
  part(new THREE.BoxGeometry(0.155, 0.012, 0.11), paint, 0, 0.206, -0.035, body);             // roof
  part(new THREE.BoxGeometry(0.19, 0.008, 0.02), trim, 0, 0.146, -0.19, body);                // stripe
  part(new THREE.BoxGeometry(0.02, 0.008, 0.36), trim, 0, 0.147, 0, body);
  for (const s of [-1, 1]) part(new THREE.BoxGeometry(0.012, 0.07, 0.03), black, s * 0.08, 0.2, -0.2, body);
  part(new THREE.BoxGeometry(0.24, 0.01, 0.07), paint, 0, 0.24, -0.205, body);                // wing
  part(new THREE.BoxGeometry(0.22, 0.03, 0.02), black, 0, 0.075, 0.225, body);                // bumper
  for (const s of [-1, 1]) {
    part(new THREE.SphereGeometry(0.018, 10, 8), glow(4, 3.6, 2.6), s * 0.06, 0.125, 0.2, body);
    part(new THREE.BoxGeometry(0.03, 0.014, 0.01), glow(2.2, 0.1, 0.08), s * 0.07, 0.125, -0.207, body);
  }

  // Wheels: chunky, bigger at the back, the way a toy buggy's always were.
  const wheels = [];
  const tyre = std(0x08080a, { roughness: 0.9 });
  for (const [x, z, r, w, front] of [[-0.125, 0.14, 0.058, 0.05, true], [0.125, 0.14, 0.058, 0.05, true], [-0.135, -0.14, 0.068, 0.065, false], [0.135, -0.14, 0.068, 0.065, false]]) {
    const pivot = new THREE.Group();
    pivot.position.set(x, r, z);
    const spin = new THREE.Group();
    const t = new THREE.Mesh(new THREE.CylinderGeometry(r, r, w, 16), tyre); t.rotation.z = Math.PI / 2;
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.55, r * 0.55, w + 0.004, 6), trim); hub.rotation.z = Math.PI / 2;
    spin.add(t, hub);
    pivot.add(spin);
    g.add(pivot);
    wheels.push({ pivot, spin, r, front });
  }

  // The aerial. It whips.
  const aerial = new THREE.Group();
  aerial.position.set(-0.07, 0.2, -0.14);
  part(new THREE.CylinderGeometry(0.0022, 0.003, 0.36, 5), std(0xbfc4c9, { metalness: 0.8, roughness: 0.3 }), 0, 0.18, 0, aerial);
  part(new THREE.SphereGeometry(0.008, 8, 6), glow(1.3, 0.45, 0.05), 0, 0.365, 0, aerial);
  body.add(aerial);

  // Headlights you can see by.
  const lamp = new THREE.SpotLight(0xfff0d0, 70, 30, 0.5, 0.75, 1.6);
  lamp.position.set(0, 0.14, 0.2);
  lamp.target.position.set(0, 0.02, 4);
  g.add(lamp, lamp.target);

  // A blob of shadow, since nothing else here casts one.
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.62), new THREE.MeshBasicMaterial({ color: 0, transparent: true, opacity: 0.55, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }));
  shadow.rotation.x = -Math.PI / 2; shadow.rotation.order = 'YXZ';
  g.rotation.order = 'YXZ';          // yaw, then tip the whole car nose-up or nose-down

  return { group: g, body, wheels, aerial, lamp, shadow, radius: 0.19, kind: 'car' };
}

export class Car {
  constructor(plan, colour) {
    this.plan = plan;
    Object.assign(this, buildCar(colour));
    this.pos = new THREE.Vector3(0, 0, 0);
    this.vel = new THREE.Vector3();
    this.yaw = 0;
    this.steer = 0; this.throttle = 0;
    this.aerialV = new THREE.Vector2(); this.aerialP = new THREE.Vector2();
    this.speed = 0; this.slip = 0; this.bump = 0; this.roll = 0; this.pitch = 0;
    this.vy = 0; this.air = false; this.airT = 0; this.tilt = 0; this.squash = 0;
    this.rail = null;            // set while the car is on the loop
    this.flip = 0; this.spin = 0; this.cool = 0; this.hopped = false;
    this.on = null;              // the stunt piece under the wheels, if any
    this.wet = false;
    this.launched = 0;           // for one frame: the seconds of air this take-off should give
    this.landed = null;          // for one frame: { air, dist, impact }
    this._from = { x: 0, z: 0 };
    this._push = { x: 0, y: 0, z: 0 };
  }

  place(x, z, yaw, y = 0) {
    this.pos.set(x, y, z); this.vel.set(0, 0, 0); this.yaw = yaw;
    this.vy = 0; this.air = false; this.rail = null; this.tilt = 0; this.speed = 0; this.flip = this.spin = 0;
    this.pos.y = groundAt(this.plan, x, z, y + 0.3);
    this.sync(0);
  }

  update(dt, inp) {
    this.launched = 0; this.landed = null; this.bump = 0;
    if (this.rail) return this._loop(dt, inp);
    const TOP = 12, REV = 4.5;
    const fx = Math.sin(this.yaw), fz = Math.cos(this.yaw);
    const rx = -fz, rz = fx;
    let vf = this.vel.x * fx + this.vel.z * fz;
    let vl = this.vel.x * rx + this.vel.z * rz;
    this._vf0 = vf;              // speed before the motor has its say (wheels spin on a wet floor)
    const th = inp.throttle;
    this.throttle = th;
    this.steer += (inp.steer - this.steer) * Math.min(1, dt * 11);
    let rate = 0;
    if (!this.air) {
      if (th > 0) vf += th * 13 * (1 - Math.max(0, vf) / TOP) * dt * (vf < 0 ? 2.2 : 1);
      else if (th < 0) vf += th * (vf > 0.4 ? 20 : 9 * (1 - Math.max(0, -vf) / REV)) * dt;
      vf -= vf * 0.24 * dt + Math.sign(vf) * Math.min(Math.abs(vf), 0.4 * dt);     // tops out near 9.5 m/s
      // Marble is slippery; a gallery's wood floor is not; a mopped floor is something else.
      const room = roomAt(this.plan, this.pos.x, this.pos.z);
      let grip = room && room.kind === 'gallery' ? 9 : 5.2;
      let bite = Math.max(-1, Math.min(1, vf / 1.4));
      this.wet = false;
      if (this.pos.y < 0.03) for (const p of this.plan.puddles) if ((this.pos.x - p.x) ** 2 + (this.pos.z - p.z) ** 2 < p.r * p.r) this.wet = true;
      if (this.wet) { grip = 0.35; bite *= 0.55; vf -= (vf - this._vf0) * 0.7; }
      rate = this.steer * bite * 3.6 / (1 + Math.abs(vf) / 13);
      this.yaw -= rate * dt;
      this.slip = Math.abs(vl);
      vl *= Math.exp(-grip * dt);
      const nfx = Math.sin(this.yaw), nfz = Math.cos(this.yaw);
      this.vel.x = nfx * vf + (-nfz) * vl;
      this.vel.z = nfz * vf + nfx * vl;
    } else if (inp.trick) {
      // Hold the jump button in the air and the sticks throw the car about:
      // left and right spin it, forward and back flip it.
      const s = inp.steer * 7 * dt, f = th * 8 * dt;
      this.yaw -= s; this.spin += s;
      this.tilt += f; this.flip += f;
    } else {
      // In the air the wheels do nothing, but a toy will still twist a little.
      this.yaw -= this.steer * 0.9 * dt;
    }
    // Space: a hop. No toy car ever did this. This one does.
    this.cool -= dt;
    if (inp.jump && !this.air && this.cool <= 0) {
      this.hopped = this.vy < 0.8;             // a hop off the flat, as opposed to extra off a ramp
      this.vy = Math.max(0, this.vy) + 3.7; this.cool = 0.2; this.jumped = true;
    }

    const ox = this.pos.x, oz = this.pos.z;
    // On a slope, speed is shared between along and up: a steep lip sends you
    // skyward, not forward.
    const sp = Math.hypot(this.vel.x, this.vel.z);
    let cs = 1, rise = 0;
    const on = this.on;
    if (!this.air && on && on.axis && sp > 0.05) {
      // The slope of the piece under the wheels, measured along the way we are going.
      // Measured backwards when the next step would be off its end, so an edge is not mistaken for a cliff.
      const e = 0.05, ux = this.vel.x / sp, uz = this.vel.z / sp, px = this.pos.x, pz = this.pos.z;
      const inside = (x, z) => x >= on.x0 && x <= on.x1 && z >= on.z0 && z <= on.z1;
      let tan = 0;
      if (inside(px + ux * e, pz + uz * e)) tan = (heightOf(on, px + ux * e, pz + uz * e) - heightOf(on, px, pz)) / e;
      else if (inside(px - ux * e, pz - uz * e)) tan = (heightOf(on, px, pz) - heightOf(on, px - ux * e, pz - uz * e)) / e;
      tan = Math.max(-5, Math.min(5, tan));
      cs = 1 / Math.sqrt(1 + tan * tan);
      rise = sp * cs * tan;          // how fast the slope is lifting us
    }
    this.pos.x += this.vel.x * cs * dt; this.pos.z += this.vel.z * cs * dt;

    // The stunt kit, side on: plywood does not move.
    if (sp > 0.01) {
      const ax = this.vel.x / sp * 0.17, az = this.vel.z / sp * 0.17, y = this.pos.y, P = this.plan;
      if (wallAt(P, this.pos.x + ax, this.pos.z + az, y, STEP, on)) {
        if (!wallAt(P, ox + ax, this.pos.z + az, y, STEP, on)) { this.pos.x = ox; this.bump = Math.abs(this.vel.x); this.vel.x *= -0.25; }
        else if (!wallAt(P, this.pos.x + ax, oz + az, y, STEP, on)) { this.pos.z = oz; this.bump = Math.abs(this.vel.z); this.vel.z *= -0.25; }
        else { this.pos.x = ox; this.pos.z = oz; this.bump = sp; this.vel.x *= -0.25; this.vel.z *= -0.25; }
      }
    }

    const push = this._push;
    if (confine(this.plan, this.pos, this.radius, false, push)) {
      const l = Math.hypot(push.x, push.z);
      if (l > 1e-6) {
        const nx = push.x / l, nz = push.z / l;
        const into = this.vel.x * nx + this.vel.z * nz;
        if (into < 0) {
          this.vel.x -= nx * into * 1.35; this.vel.z -= nz * into * 1.35;   // a little bounce
          this.vel.multiplyScalar(0.82);
          this.bump = Math.max(this.bump, -into);
        }
      }
    }

    // Up and down. Follow the ground while it is there; when it falls away
    // faster than gravity would take you, you are flying.
    const g = groundAt(this.plan, this.pos.x, this.pos.z, this.pos.y, STEP, this.on);
    const beneath = this.plan.under;
    const yb = this.pos.y + this.vy * dt - 0.5 * GRAVITY * dt * dt;
    if (yb > g + 0.004) {
      if (!this.air) {
        this.air = true; this.airT = 0; this._from.x = this.pos.x; this._from.z = this.pos.z;
        this.vel.x *= cs; this.vel.z *= cs; this.on = null;        // what went into height is no longer going forwards
        // Fly the arc ahead of time to see how long it really lasts (a table may be in the way).
        let t = 0, px = this.pos.x, pz = this.pos.z, py = yb, pv = this.vy;
        while (t < 2.5) {
          t += 0.03; px += this.vel.x * 0.03; pz += this.vel.z * 0.03; pv -= GRAVITY * 0.03; py += pv * 0.03;
          if (py <= groundAt(this.plan, px, pz, py + 0.1)) break;
        }
        if (t > 0.3 && sp > 2.5) this.launched = t;
        this.fromHop = this.hopped; this.hopped = false; this.flip = this.spin = 0;
      }
      this.pos.y = yb; this.vy -= GRAVITY * dt; this.airT += dt;
    } else {
      if (this.air) {
        this.air = false;
        const impact = Math.max(0, -this.vy);
        // Wheels down, or not? Anything within a radian of upright is a landing.
        const off = Math.atan2(Math.sin(this.tilt), Math.cos(this.tilt)), crash = Math.abs(off) > 1.05;
        if (this.airT > 0.22) {
          this.landed = { air: this.airT, dist: Math.hypot(this.pos.x - this._from.x, this.pos.z - this._from.z), impact, crash,
            flips: crash ? 0 : Math.round(this.flip / (Math.PI * 2)), spins: crash ? 0 : Math.round(Math.abs(this.spin) / Math.PI), hop: this.fromHop };
          this.squash = Math.min(1, impact / 5);
        }
        this.tilt = off;
        if (crash) { this.vel.multiplyScalar(0.4); this.squash = 1; }
        this.vy = 0;
      } else if (dt > 0) {
        this.vy = rise;            // the slope under the wheels; a kerb or a lip is not a slope
      }
      this.pos.y = g;
      // Hanging track has a lip down each side, so you leave it on purpose or not at all.
      const u = this.on = beneath;
      if (u && u.lip && !this.air) {
        if (u.run === 'z') { const c = Math.max(u.x0 + 0.17, Math.min(u.x1 - 0.17, this.pos.x)); if (c !== this.pos.x) { this.pos.x = c; this.vel.x = 0; } }
        else { const c = Math.max(u.z0 + 0.17, Math.min(u.z1 - 0.17, this.pos.z)); if (c !== this.pos.z) { this.pos.z = c; this.vel.z = 0; } }
      }
    }
    this.speed = vf;

    // Onto the loop? Squarely, and with enough behind you to be worth trying.
    // It can be taken from either end: in by one lane and out by the other.
    if (!this.air && this.pos.y < 0.05) for (const L of this.plan.loops) {
      for (const way of [1, -1]) {
        const lane = way === L.dir ? L.z : L.z + L.shift;
        if ((ox - L.x) * way < 0 && (this.pos.x - L.x) * way >= 0 && Math.abs(this.pos.z - lane) < 0.36 && fx * way > 0.88 && vf > 4) {
          this.rail = { L, th: 0, v: vf, top: false, way, rev: way !== L.dir };
          this.yaw = way > 0 ? Math.PI / 2 : -Math.PI / 2;
        }
      }
    }

    // Attitude: nose along the slope, or along the arc in the air.
    const want = this.air ? -Math.atan2(this.vy, Math.max(3, sp)) * 0.75 : -Math.atan2(this.vy, Math.max(0.6, Math.abs(vf))) * Math.sign(vf || 1);
    let d = want - this.tilt; d = Math.atan2(Math.sin(d), Math.cos(d));
    if (!(this.air && inp.trick && Math.abs(th) > 0.2)) this.tilt += d * Math.min(1, dt * (this.air ? 5 : 16));
    const latAcc = rate * vf;
    this.roll += (Math.max(-0.16, Math.min(0.16, latAcc * 0.012)) - this.roll) * Math.min(1, dt * 8);
    this.pitch += (Math.max(-0.07, Math.min(0.07, -th * 0.05)) - this.pitch) * Math.min(1, dt * 6);
    this.squash = this.calm ? 0 : Math.max(0, this.squash - dt * 5);
    const under = this.pos.y < 0.3 && this.plan.obstacles.some(o => o.bench && this.pos.x > o.x0 - 0.1 && this.pos.x < o.x1 + 0.1 && this.pos.z > o.z0 - 0.1 && this.pos.z < o.z1 + 0.1);
    const tx = -latAcc * 0.02 + this.bump * 0.2, tz = -th * 0.22 - (under ? 1.25 : 0) + vf * 0.02 + this.squash * 0.9 + (this.air ? 0.25 : 0);
    this.aerialV.x += ((tx - this.aerialP.x) * 90 - this.aerialV.x * 5) * dt;
    this.aerialV.y += ((tz - this.aerialP.y) * 90 - this.aerialV.y * 5) * dt;
    this.aerialP.addScaledVector(this.aerialV, dt);
    this.under = under;
    this.sync(dt);
  }

  // On the loop the car runs on a rail: one number, how far round it is.
  // Speed is traded for height honestly, so too slow and it drops off the top.
  _loop(dt, inp) {
    const s = this.rail, L = s.L, r = L.r;
    this.throttle = inp.throttle; this.steer = 0;
    s.v += (-GRAVITY * Math.sin(s.th) + Math.max(0, inp.throttle) * 6.5 - s.v * 0.12) * dt;
    s.th += (s.v / r) * dt;
    const c = Math.cos(s.th);
    if (s.th > Math.PI * 0.5 && s.th < Math.PI * 1.5) s.top = true;
    const fell = s.v < 0.4 || (c < 0 && s.v * s.v < -GRAVITY * r * c * 0.7);
    const turn = Math.min(1, s.th / (Math.PI * 2));
    this.pos.set(L.x + s.way * r * Math.sin(s.th), r - r * c, L.z + L.shift * (s.rev ? 1 - turn : turn));
    this.speed = s.v;
    this.airT = 0;
    if (fell) {
      // Not enough speed: let go of the track and fall like a dropped toy.
      this.vel.set(s.way * s.v * c, 0, 0); this.vy = s.v * Math.sin(s.th);
      this.tilt = -s.th; this.rail = null; this.air = true; this._from.x = this.pos.x; this._from.z = this.pos.z;
      this.flip = this.spin = 0; this.fromHop = false; this.on = null;
      this.fellOff = true;
    } else if (s.th >= Math.PI * 2) {
      this.pos.set(L.x + s.way * 0.02, 0, L.z + (s.rev ? 0 : L.shift));
      this.vel.set(s.way * s.v, 0, 0); this.vy = 0; this.tilt = 0; this.rail = null;
      this.looped = true;
    } else this.tilt = -s.th;
    this.roll = 0; this.pitch = 0;
    this.sync(dt);
  }

  sync(dt) {
    this.group.position.copy(this.pos);
    this.group.position.y -= this.squash * 0.018;
    this.group.rotation.y = this.yaw;
    this.group.rotation.x = this.tilt;
    this.body.rotation.z = this.roll;
    this.body.rotation.x = this.pitch;
    this.aerial.rotation.z = this.aerialP.x;
    this.aerial.rotation.x = this.aerialP.y;
    const free = this.air ? this.throttle * 60 : 0;       // wheels race in the air
    for (const w of this.wheels) {
      w.spin.rotation.x += (this.speed / w.r + free) * dt;
      if (w.front) w.pivot.rotation.y = -this.steer * 0.45;
    }
    // The shadow stays on whatever is underneath.
    const g = groundAt(this.plan, this.pos.x, this.pos.z, this.pos.y + 0.05), h = Math.max(0, this.pos.y - g);
    this.shadow.position.set(this.pos.x, g + 0.006, this.pos.z);
    this.shadow.rotation.y = this.yaw;
    this.shadow.material.opacity = 0.55 * Math.max(0.15, 1 - h / 2.5);
    this.shadow.scale.setScalar(1 + h * 0.35);
  }

  get height() { return 0.12; }
}

// ----------------------------------------------------------------- drone ---

export function buildDrone(colour = 0xe9e6df) {
  const g = new THREE.Group();
  const body = new THREE.Group();
  g.add(body);
  const shell = std(colour, { roughness: 0.35, emissive: colour, emissiveIntensity: 0.1 });
  const dark = std(0x121316, { roughness: 0.6 });
  part(new THREE.BoxGeometry(0.1, 0.04, 0.16), shell, 0, 0, 0, body);
  part(new THREE.BoxGeometry(0.07, 0.02, 0.1), dark, 0, 0.03, -0.01, body);
  part(new THREE.SphereGeometry(0.022, 10, 8), std(0x05070a, { roughness: 0.1, metalness: 0.8 }), 0, -0.012, 0.088, body);
  const props = [];
  for (const [sx, sz] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) {
    const arm = part(new THREE.BoxGeometry(0.19, 0.012, 0.02), dark, sx * 0.075, 0, sz * 0.085, body);
    arm.rotation.y = -sx * sz * 0.83;
    part(new THREE.CylinderGeometry(0.014, 0.016, 0.03, 10), dark, sx * 0.14, 0.012, sz * 0.15, body);
    const disc = part(new THREE.CylinderGeometry(0.085, 0.085, 0.002, 20), new THREE.MeshBasicMaterial({ color: 0x9aa4b0, transparent: true, opacity: 0.16, depthWrite: false }), sx * 0.14, 0.032, sz * 0.15, body);
    const blade = part(new THREE.BoxGeometry(0.165, 0.003, 0.014), dark, sx * 0.14, 0.031, sz * 0.15, body);
    props.push({ disc, blade, dir: sx * sz });
    part(new THREE.SphereGeometry(0.008, 6, 5), sz > 0 ? glow(3, 3, 3) : glow(3, 0.15, 0.1), sx * 0.14, -0.012, sz * 0.15, body);
    part(new THREE.BoxGeometry(0.006, 0.05, 0.006), dark, sx * 0.05, -0.04, sz * 0.06, body);     // legs
  }
  const lamp = new THREE.SpotLight(0xe8f0ff, 7, 24, 0.6, 0.8, 1.5);
  lamp.position.set(0, 0, 0.1);
  lamp.target.position.set(0, -0.5, 4);
  g.add(lamp, lamp.target);
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.22, 20), new THREE.MeshBasicMaterial({ color: 0, transparent: true, opacity: 0.4, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }));
  shadow.rotation.x = -Math.PI / 2;
  return { group: g, body, props, lamp, shadow, radius: 0.24, kind: 'drone' };
}

export class Drone {
  constructor(plan, colour) {
    this.plan = plan;
    Object.assign(this, buildDrone(colour));
    this.pos = new THREE.Vector3(0, 1, 0);
    this.vel = new THREE.Vector3();
    this.yaw = 0; this.roll = 0; this.pitch = 0;
    this.speed = 0; this.bump = 0; this.thrust = 0; this.spin = 0;
    this._push = { x: 0, y: 0, z: 0 };
  }

  place(x, z, yaw, y = 1.2) { this.pos.set(x, y, z); this.vel.set(0, 0, 0); this.yaw = yaw; this.sync(0); }

  update(dt, inp) {
    const fx = Math.sin(this.yaw), fz = Math.cos(this.yaw);
    const rx = -fz, rz = fx;
    const A = 22;
    this.vel.x += (fx * inp.pitch + rx * inp.roll) * A * dt;
    this.vel.z += (fz * inp.pitch + rz * inp.roll) * A * dt;
    const drag = Math.exp(-1.7 * dt);
    this.vel.x *= drag; this.vel.z *= drag;
    this.vel.y += (inp.climb * 5.2 - this.vel.y) * Math.min(1, dt * 5);
    this.yaw -= inp.yaw * 2.5 * dt;
    const ox = this.pos.x, oz = this.pos.z;
    this.pos.addScaledVector(this.vel, dt);

    this.bump = 0;
    // Plywood and stone stop a drone side-on too; table tops and ramps are somewhere to land.
    if (wallAt(this.plan, this.pos.x, this.pos.z, this.pos.y - 0.07, 0.06)) {
      if (!wallAt(this.plan, ox, this.pos.z, this.pos.y - 0.07, 0.06)) { this.pos.x = ox; this.vel.x *= -0.3; }
      else if (!wallAt(this.plan, this.pos.x, oz, this.pos.y - 0.07, 0.06)) { this.pos.z = oz; this.vel.z *= -0.3; }
      else { this.pos.x = ox; this.pos.z = oz; this.vel.x *= -0.3; this.vel.z *= -0.3; }
    }
    const floor = groundAt(this.plan, this.pos.x, this.pos.z, this.pos.y, 0.02) + 0.07;
    this.floor = floor;
    if (this.pos.y < floor) { this.pos.y = floor; if (this.vel.y < 0) this.vel.y = 0; }
    const push = this._push;
    if (confine(this.plan, this.pos, this.radius, true, push)) {
      const l = Math.hypot(push.x, push.y, push.z);
      if (l > 1e-6) {
        const nx = push.x / l, ny = push.y / l, nz = push.z / l;
        const into = this.vel.x * nx + this.vel.y * ny + this.vel.z * nz;
        if (into < 0) {
          this.vel.x -= nx * into * 1.4; this.vel.y -= ny * into * 1.4; this.vel.z -= nz * into * 1.4;
          this.bump = -into;
        }
      }
    }
    this.speed = this.vel.x * fx + this.vel.z * fz;
    this.thrust = Math.min(1, 0.45 + Math.abs(inp.pitch) * 0.25 + Math.abs(inp.roll) * 0.2 + Math.max(0, inp.climb) * 0.4 - Math.max(0, -inp.climb) * 0.2);
    this.landed = this.pos.y <= floor + 0.001 && inp.climb <= 0;
    this.pitch += (inp.pitch * 0.38 - this.pitch) * Math.min(1, dt * 7);
    this.roll += (inp.roll * 0.38 + inp.yaw * 0.12 - this.roll) * Math.min(1, dt * 7);
    this.sync(dt);
  }

  sync(dt) {
    this.group.position.copy(this.pos);
    this.group.rotation.y = this.yaw;
    this.body.rotation.x = this.pitch;
    this.body.rotation.z = this.roll;
    this.spin += dt * (this.landed ? 12 : 70);
    for (const p of this.props) { p.blade.rotation.y = this.spin * p.dir; p.disc.material.opacity = this.landed ? 0.04 : 0.16; }
    const g = groundAt(this.plan, this.pos.x, this.pos.z, this.pos.y, 0.02), h = this.pos.y - g;
    this.shadow.position.set(this.pos.x, g + 0.006, this.pos.z);
    const k = Math.max(0, 1 - h / 5);
    this.shadow.material.opacity = 0.45 * k;
    this.shadow.scale.setScalar(1 + h * 0.5);
  }

  get height() { return 0; }
}
