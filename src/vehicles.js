// The two toys. Both are built from primitives at true scale, and both are
// driven the way the real ones are: two sticks.

import * as THREE from 'three';
import { confine, roomAt, groundAt, wallAt, heightOf, ceilingAt, headAt, GRAVITY, STEP } from './plan.js';

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
  const paint = std(colour, { roughness: 0.3, emissive: colour, emissiveIntensity: 0.12 }); paint.name = 'paint';      // (the one a can of paint goes on: src/garage.js)
  const black = std(0x0c0c0e, { roughness: 0.7 });
  const trim = std(0xf3c21b, { roughness: 0.4, emissive: 0xf3c21b, emissiveIntensity: 0.15 });

  part(new THREE.BoxGeometry(0.2, 0.04, 0.42), black, 0, 0.0695, 0, body);                    // chassis: up to the underside of the tub, down to the axles
  part(new THREE.BoxGeometry(0.19, 0.055, 0.4), paint, 0, 0.115, -0.005, body);               // tub
  const hood = part(new THREE.BoxGeometry(0.17, 0.03, 0.15), paint, 0, 0.15, 0.12, body);
  hood.rotation.x = 0.22;
  const cab = part(new THREE.BoxGeometry(0.15, 0.06, 0.15), std(0x10151c, { roughness: 0.15, metalness: 0.5 }), 0, 0.17, -0.03, body);
  cab.scale.set(1, 1, 1);
  part(new THREE.BoxGeometry(0.155, 0.012, 0.11), paint, 0, 0.206, -0.035, body);             // roof
  part(new THREE.BoxGeometry(0.19, 0.008, 0.02), trim, 0, 0.146, -0.19, body);                // stripe
  part(new THREE.BoxGeometry(0.02, 0.008, 0.36), trim, 0, 0.147, 0, body);
  for (const s of [-1, 1]) part(new THREE.BoxGeometry(0.012, 0.1, 0.03), black, s * 0.08, 0.187, -0.188, body);      // wing posts, standing on the tub
  part(new THREE.BoxGeometry(0.24, 0.01, 0.07), paint, 0, 0.24, -0.195, body);                // wing
  part(new THREE.BoxGeometry(0.22, 0.03, 0.02), black, 0, 0.075, 0.228, body);                // bumper
  for (const s of [-1, 1]) part(new THREE.BoxGeometry(0.02, 0.016, 0.03), black, s * 0.07, 0.072, 0.212, body);       // and the two stays that hold it to the chassis
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

  // An axle through each pair of wheels, so that they are plainly on the car.
  const steel = std(0x8d9299, { metalness: 0.8, roughness: 0.35 });
  for (const [z, r, half] of [[0.14, 0.058, 0.125], [-0.14, 0.068, 0.135]]) { const ax = part(new THREE.CylinderGeometry(0.009, 0.009, half * 2, 8), steel, 0, r, z, g); ax.rotation.z = Math.PI / 2; }

  // The aerial. It whips.
  const aerial = new THREE.Group();
  aerial.position.set(-0.07, 0.143, -0.14);                // its foot is on the deck behind the cab
  part(new THREE.CylinderGeometry(0.008, 0.01, 0.012, 8), black, 0, 0.006, 0, aerial);
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

// How a car handles, as multiples of the first one's. Every body in the garage starts from these.
export const CAR_SPEC = { top: 1, accel: 1, grip: 1, steer: 1, jump: 1, ice: 0 };      // ice: 0, slides like anything else; 1, as if it were snow
export const DRONE_SPEC = { accel: 1, climb: 1, yaw: 1 };

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
    this.vert = null;            // set during an air off a skate ramp
    this.flip = 0; this.spin = 0; this.cool = 0; this.hopped = false;
    this.on = null;              // the stunt piece under the wheels, if any
    this.wet = false;
    this.launched = 0;           // for one frame: the seconds of air this take-off should give
    this.landed = null;          // for one frame: { air, dist, impact }
    this._from = { x: 0, z: 0 };
    this._push = { x: 0, y: 0, z: 0 };
    this.spec = { ...CAR_SPEC };
    this.gravity = GRAVITY;      // Earth's; the Moon's while it is there (src/voyage.js)
  }

  // Another body on the same toy (see garage.js): new bodywork, wheels and aerial, and how it handles.
  reskin(model, spec = {}) {
    this.group.remove(this.body); for (const w of this.wheels) this.group.remove(w.pivot);
    this.body = model.body; this.wheels = model.wheels; this.aerial = model.aerial;
    this.group.add(this.body); for (const w of this.wheels) this.group.add(w.pivot);
    this.spec = { ...CAR_SPEC, ...spec };
    // A long body keeps its ends out of the walls with extra circles along it ([offset forward, radius]); a plough has a
    // blade (winter.js clears the snow it passes over); a semi has a trailer, towed behind on its own (see _tow).
    this.radius = model.radius || 0.19; this.probes = model.probes || null; this.blade = model.blade || null;
    if (this.trailer) { this.group.remove(this.trailer.group); this.trailer = null; }
    if (model.trailer) { const t = this.trailer = { ...model.trailer, ax: 0, az: 0, y: 0, yaw: this.yaw }; this.group.add(t.group); this._hitchReset(); }
    this.sync(0);
  }

  place(x, z, yaw, y = 0) {
    this.pos.set(x, y, z); this.vel.set(0, 0, 0); this.yaw = yaw;
    this.vy = 0; this.air = false; this.rail = null; this.tilt = 0; this.speed = 0; this.flip = this.spin = 0;
    this.pos.y = groundAt(this.plan, x, z, y + 0.3);
    this._hitchReset();
    this.sync(0);
  }

  // ---- the trailer (a semi's). Its kingpin rides on the tractor's fifth wheel; its axles, `len` behind the kingpin, roll
  // where they are pulled and never sideways: each frame the axle moves straight towards wherever the kingpin has gone.
  // That is all it takes for it to cut corners going forward, swing wide backing up, and fold up (jack-knife) if
  // reversed carelessly. Walls push it round about the kingpin.
  _hitch(out) { const t = this.trailer; return out.set(this.pos.x + Math.sin(this.yaw) * t.hitch, this.pos.y, this.pos.z + Math.cos(this.yaw) * t.hitch); }
  _hitchReset() {
    const t = this.trailer; if (!t) return;
    const H = this._hitch(this._hv || (this._hv = new THREE.Vector3()));
    t.yaw = this.yaw; t.ax = H.x - Math.sin(this.yaw) * t.len; t.az = H.z - Math.cos(this.yaw) * t.len; t.y = this.pos.y; t.v = 0; t.folded = 0;
  }
  _tow(dt) {
    const t = this.trailer; if (!t) return;
    const H = this._hitch(this._hv || (this._hv = new THREE.Vector3()));
    let dx = H.x - t.ax, dz = H.z - t.az, d = Math.hypot(dx, dz);
    if (d > t.len * 3 || !(d > 1e-6)) { this._hitchReset(); return; }                     // put back behind (after a teleport)
    const px = t.ax, pz = t.az;
    t.ax = H.x - dx / d * t.len; t.az = H.z - dz / d * t.len;
    // Folded too far round, the trailer's nose meets the back of the cab: it can go no further.
    const lim = 1.4;
    const fold = () => { let k = Math.atan2(H.x - t.ax, H.z - t.az) - this.yaw; k = Math.atan2(Math.sin(k), Math.cos(k)); return k; };
    let k = fold();
    t.folded = Math.max(0, (t.folded || 0) - dt);
    if (Math.abs(k) > lim) { const a = this.yaw + Math.sign(k) * lim; t.ax = H.x - Math.sin(a) * t.len; t.az = H.z - Math.cos(a) * t.len; t.folded = 0.6; k = Math.sign(k) * lim; }
    // Walls: points down the trailer's length, each kept clear of walls and fixed things; what moves them swings the trailer.
    const q = this._tq || (this._tq = { x: 0, y: 0, z: 0 }), push = this._tp || (this._tp = { x: 0, y: 0, z: 0 });
    for (let pass = 0; pass < 2; pass++) for (const s of [0.18, t.len, t.rear - 0.04]) {
      dx = t.ax - H.x; dz = t.az - H.z; d = Math.hypot(dx, dz) || 1e-6;
      q.x = H.x + dx / d * s; q.y = t.y; q.z = H.z + dz / d * s;
      const ox = q.x, oz = q.z;
      if (confine(this.plan, q, t.width, false, push)) {
        const f = t.len / s;                                                                // a nudge at s turns the line about the kingpin as much as f times it at the axle
        t.ax += (q.x - ox) * f; t.az += (q.z - oz) * f;
        dx = t.ax - H.x; dz = t.az - H.z; d = Math.hypot(dx, dz) || 1e-6; t.ax = H.x + dx / d * t.len; t.az = H.z + dz / d * t.len;
      }
    }
    t.yaw = Math.atan2(H.x - t.ax, H.z - t.az);
    t.v = dt > 0 ? ((t.ax - px) * Math.sin(t.yaw) + (t.az - pz) * Math.cos(t.yaw)) / dt : 0;
    // Up and down: the axles on the ground under them (stepping up a kerb the way the car does), the kingpin on the tractor.
    const g = groundAt(this.plan, t.ax, t.az, Math.max(t.y, this.pos.y) + 0.25);
    t.y = this.air ? Math.max(g, Math.min(t.y, this.pos.y)) : g;
    if (Math.abs(t.y - this.pos.y) > 1.2) t.y = this.pos.y;                                 // never hanging off a balcony
  }
  _drawTrailer(dt) {
    const t = this.trailer; if (!t) return;
    const W = this._tw || (this._tw = new THREE.Matrix4()), E = this._te || (this._te = new THREE.Euler(0, 0, 0, 'YXZ')), Qt = this._tqq || (this._tqq = new THREE.Quaternion()), one = this._t1 || (this._t1 = new THREE.Vector3(1, 1, 1)), H = this._hitch(this._hv2 || (this._hv2 = new THREE.Vector3()));
    E.set(Math.atan2(t.y - H.y, t.len), t.yaw, 0); Qt.setFromEuler(E);
    W.compose(H, Qt, one);
    this.group.updateMatrix();
    const inv = this._ti || (this._ti = new THREE.Matrix4()); inv.copy(this.group.matrix).invert();
    W.premultiply(inv); W.decompose(t.group.position, t.group.quaternion, t.group.scale);
    for (const w of t.wheels) w.spin.rotation.x += (t.v / w.r) * dt;
  }
  // Besides the toy itself, what else of it runs into things (loose.js, props.js): a plough's blade, a trailer.
  extraMovers(out) {
    const fx = Math.sin(this.yaw), fz = Math.cos(this.yaw);
    if (this.blade) out.push({ x: this.pos.x + fx * this.blade.z, y: this.pos.y, z: this.pos.z + fz * this.blade.z, vx: this.vel.x * 1.15, vz: this.vel.z * 1.15, r: this.blade.hw });
    const t = this.trailer;
    if (t) { const sx = Math.sin(t.yaw), sz = Math.cos(t.yaw), H = this._hitch(this._hv3 || (this._hv3 = new THREE.Vector3())); for (const s of [0.2, 0.42]) out.push({ x: H.x - sx * s, y: t.y, z: H.z - sz * s, vx: sx * t.v, vz: sz * t.v, r: t.width + 0.02 }); }
  }

  update(dt, inp) {
    const GRAVITY = this.gravity;          // (everything below falls at this toy's own gravity)
    this.launched = 0; this.landed = null; this.bump = 0;
    this.clock = (this.clock || 0) + dt;
    if (this.rail) return this._loop(dt, inp);
    const S = this.spec, TOP = 12 * S.top, REV = 4.5;
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
      // Part throttle is a lower top speed, not just a slower run up to the same one.
      if (th > 0) vf += th * 13 * S.accel * (1 - Math.max(0, vf) / (TOP * (0.22 + 0.78 * th))) * dt * (vf < 0 ? 2.2 : 1);
      else if (th < 0) vf += th * (vf > 0.4 ? 20 : 9 * (1 - Math.max(0, -vf) / REV)) * dt;
      vf -= vf * 0.24 * dt + Math.sign(vf) * Math.min(Math.abs(vf), 0.4 * dt);     // tops out near 9.5 m/s
      // Marble is slippery; a gallery's wood floor is not; a mopped floor is something else.
      const room = roomAt(this.plan, this.pos.x, this.pos.z, this.pos.y);
      let grip = !room ? 3.4 : room.kind === 'gallery' && room.floor !== '1' ? 9 : 5.2;
      // Gritted streets hold better than snow; the frozen pool does not hold at all.
      if (!room) { for (const q of this.plan.paved) if (this.pos.x > q.x0 && this.pos.x < q.x1 && this.pos.z > q.z0 && this.pos.z < q.z1) grip = 6; for (const q of this.plan.ice) if (this.pos.x > q.x0 && this.pos.x < q.x1 && this.pos.z > q.z0 && this.pos.z < q.z1) grip = 0.3; }
      // Snow outdoors, unless there is track laid on it.
      if (!room) for (const d of this.plan.decals) if (this.pos.x > d.x0 && this.pos.x < d.x1 && this.pos.z > d.z0 - 0.3 && this.pos.z < d.z1 + 0.3) grip = 9;
      grip *= S.grip;
      let bite = Math.max(-1, Math.min(1, vf / 1.4));
      this.wet = false;
      for (const p of this.plan.puddles) if (Math.abs(this.pos.y - (p.y || 0)) < 0.03 && (this.pos.x - p.x) ** 2 + (this.pos.z - p.z) ** 2 < p.r * p.r) this.wet = true;
      if (this.wet) { grip = 0.35; bite *= 0.55; vf -= (vf - this._vf0) * 0.7; }
      // Ice: the wheels spin, the brakes do little, and the car goes on the way it was going whichever way it is pointed.
      const icy = !this.wet && !room && Math.abs(this.pos.y) < 0.05 && this.plan.ice.some(q => this.pos.x > q.x0 && this.pos.x < q.x1 && this.pos.z > q.z0 && this.pos.z < q.z1);
      // (Big studded tyres, S.ice, bite into it: less wheelspin, more steering, and the slide is caught sooner.)
      if (icy) { const ice = S.ice || 0; grip = 0.15 + ice * 2.4 * S.grip; bite *= 0.8 + 0.2 * ice; vf -= (vf - this._vf0) * 0.8 * (1 - ice * 0.85); }
      rate = this.steer * bite * 3.6 * S.steer / (1 + Math.abs(vf) / 13);
      this.yaw -= rate * dt;
      this.slip = Math.abs(vl);
      const nfx = Math.sin(this.yaw), nfz = Math.cos(this.yaw);
      if (icy || this.wet) {
        // Nothing holds it. What it was doing over the ground carries on, and comes round only slowly to where the wheels point.
        // (Everywhere else the car simply goes where it is pointed, which is why nothing used to slide at all.)
        const wx = fx * vf + rx * vl, wz = fz * vf + rz * vl;
        vf = wx * nfx + wz * nfz; vl = (wx * -nfz + wz * nfx) * Math.exp(-grip * dt);
      } else vl *= Math.exp(-grip * dt);
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
      this.vy = Math.max(0, this.vy) + 3.0 * S.jump; this.cool = 0.2; this.jumped = true; this.boost = 0.26;
    }
    // Keep the button down and it goes on pushing for a quarter of a second: a tap is a hop, a hold clears a wall.
    if (this.boost > 0) { if (inp.trick && this.vy > 0) { this.vy += 15.5 * S.jump * dt; this.boost -= dt; } else this.boost = 0; }

    const ox = this.pos.x, oz = this.pos.z;
    // On a slope, speed is shared between along and up: a steep lip sends you
    // skyward, not forward.
    const sp = Math.hypot(this.vel.x, this.vel.z);
    let cs = 1, rise = 0, slope = 0;
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
      slope = tan;
      // Remember being on the steep top of a skate ramp: a slow frame can step the car over the lip
      // onto the ledge before it knows it has left, and it should still fly as if off the ramp.
      if (on.curve && tan > 1.1) { this.lipRide = on; this.lipAt = this.clock; this.lipVy = rise; }
      // Rolling down a skate ramp, the ramp does some of the work: that is how you pump a half-pipe.
      if (on.curve && tan < 0) { const k = (sp + GRAVITY * 0.75 * -tan * cs * dt) / sp; this.vel.x *= k; this.vel.z *= k; }
    }
    // On a hill the ground pulls you down the slope, moving or not, whichever way you are pointing:
    // that is what makes it a hill. Let go of the stick on the side of one and you roll.
    if (!this.air && on && on.hill) {
      const q = 0.3, px = this.pos.x, pz = this.pos.z, gx = (heightOf(on, px + q, pz) - heightOf(on, px - q, pz)) / (2 * q), gz = (heightOf(on, px, pz + q) - heightOf(on, px, pz - q)) / (2 * q);
      this.vel.x -= GRAVITY * 0.6 * gx * dt; this.vel.z -= GRAVITY * 0.6 * gz * dt;
    }
    this.pos.x += this.vel.x * cs * dt; this.pos.z += this.vel.z * cs * dt;

    // The stunt kit, side on: plywood does not move.
    if (sp > 0.01) {
      // Climbing, the car will be higher by the time it gets there: what stands at the top of a ramp is not a wall in front of it.
      const ax = this.vel.x / sp * 0.17, az = this.vel.z / sp * 0.17, y = this.pos.y + (this.air ? 0 : Math.max(0, slope) * 0.2), P = this.plan, air = this.air;
      // The way ahead is walked in short steps, taking the height along. Looked at only where the car
      // will end up, the far end of a long step up a ramp stands taller than a wheel can climb, and at
      // speed on a slow frame the ramp was taken for a wall.
      const blocked = (x0, z0, x1, z1) => {
        const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, z1 - z0) / 0.08));
        let yy = y;
        for (let i = 1; i <= n; i++) {
          const px = x0 + (x1 - x0) * i / n, pz = z0 + (z1 - z0) * i / n;
          if (wallAt(P, px, pz, yy, STEP, on)) return true;
          if (!air) { const gh = groundAt(P, px, pz, yy, STEP, on); if (gh > yy) yy = gh; }
        }
        return false;
      };
      const nx = this.pos.x, nz = this.pos.z;
      if (blocked(ox, oz, nx + ax, nz + az)) {
        if (!blocked(ox, oz, ox + ax, nz + az)) { this.pos.x = ox; this.bump = Math.abs(this.vel.x); this.vel.x *= -0.25; }
        else if (!blocked(ox, oz, nx + ax, oz + az)) { this.pos.z = oz; this.bump = Math.abs(this.vel.z); this.vel.z *= -0.25; }
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
    // A long body: its nose and its tail kept out of the walls too, each a circle of its own, and the car moved with them.
    if (this.probes) for (const [o, r] of this.probes) {
      const fx2 = Math.sin(this.yaw), fz2 = Math.cos(this.yaw), q = this._pq || (this._pq = { x: 0, y: 0, z: 0 }), pp = this._pp || (this._pp = { x: 0, y: 0, z: 0 });
      q.x = this.pos.x + fx2 * o; q.y = this.pos.y; q.z = this.pos.z + fz2 * o;
      const ox = q.x, oz = q.z;
      if (confine(this.plan, q, r, false, pp)) {
        const mx = q.x - ox, mz = q.z - oz, l = Math.hypot(mx, mz);
        this.pos.x += mx; this.pos.z += mz;
        if (l > 1e-6) { const into = (this.vel.x * mx + this.vel.z * mz) / l; if (into < 0) { this.vel.x -= mx / l * into * 1.2; this.vel.z -= mz / l * into * 1.2; this.bump = Math.max(this.bump, -into); } }
      }
    }

    // Up and down. Follow the ground while it is there; when it falls away
    // faster than gravity would take you, you are flying.
    // The ground under the wheels now. On the floor, the height is carried up along the way just driven,
    // so that a long step onto a ramp ends on the ramp and not inside it.
    let reach = this.pos.y;
    if (!this.air) {
      const n = Math.max(1, Math.ceil(Math.hypot(this.pos.x - ox, this.pos.z - oz) / 0.08));
      for (let i = 1; i < n; i++) { const gh = groundAt(this.plan, ox + (this.pos.x - ox) * i / n, oz + (this.pos.z - oz) * i / n, reach, STEP, this.on); if (gh > reach) reach = gh; }
    }
    const g = groundAt(this.plan, this.pos.x, this.pos.z, reach, STEP, this.on);
    const beneath = this.plan.under;
    const yb = this.pos.y + this.vy * dt - 0.5 * GRAVITY * dt * dt;
    // On a hill the test is how hard the ground is falling away, not how far: the car leaves it when the round of the hill
    // drops faster than the car can fall (by a clear margin, 4 m/s2), and that is the same test at any frame rate.
    // A fixed distance let it hop at thirty frames a second and never leave the ground at sixty.
    const onHill = !this.air && on && on.hill && beneath && beneath.hill;
    // A lift going down takes the car with it: the floor is not falling away, it is being lowered.
    const lowered = !this.air && beneath && beneath.lift && yb - g < 0.25;
    // A plain slope of the street (the ramps beside the front steps, the side streets climbing from the avenue) is driven
    // down with the wheels on it: the ground only ever drops a few centimetres a frame there. Without this the car left the
    // slope every frame and fell back onto it, which felt like going down the stairs. (A stair tread drops 15 cm at once: that still bumps.)
    const ST = this.plan.street, hug = !this.air && !beneath && ST && this.pos.x < ST.x + ST.reach && this.vy <= 0.01 && this.pos.y - g > 0 && this.pos.y - g < 0.12;
    if (!lowered && !hug && (onHill ? yb - g > 2 * dt * dt + 0.0002 : yb > g + 0.004)) {
      if (!this.air) {
        this.air = true; this.airT = 0; this._from.x = this.pos.x; this._from.z = this.pos.z;
        this.vert = null;
        const ramp = on && on.curve && slope > 1.1 ? on : (this.lipRide && this.clock - this.lipAt < 0.16 ? this.lipRide : null);
        if (ramp && this.vy < 2 && this.lipVy > 2 && ramp !== on) this.vy = this.lipVy;
        if (ramp && this.vy > 2) {
          const on = ramp;
          // Off the lip of a skate ramp. The speed has all gone upwards, so the car hangs over
          // the lip in an arc and comes down: back onto the ramp it left, turned round to roll
          // down it, or, off a spine, over the top and onto the ramp on the other side.
          const up = on.h1 > on.h0 ? 1 : -1, ux = on.axis === 'x' ? up : 0, uz = on.axis === 'z' ? up : 0;
          const T = 2 * this.vy / GRAVITY + 0.14, carry = (on.spine ? 0.95 : -0.85) / T;
          const side = this.vel.x * uz - this.vel.z * ux;                    // keep a little of any sideways drift
          this.vel.x = ux * carry + uz * side * 0.3; this.vel.z = uz * carry - ux * side * 0.3;
          this.vert = { T, t: 0, turn: on.spine ? 0 : (this.steer < 0 ? Math.PI : -Math.PI), tilt0: this.tilt, spine: !!on.spine };
        } else { this.vel.x *= cs; this.vel.z *= cs; }                       // what went into height is no longer going forwards
        this.on = null;
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
      if (this.vert && this.vert.t < this.vert.T) { const v = this.vert, step = Math.min(dt, v.T - v.t); v.t += step; this.yaw += v.turn * step / v.T; }
      // Ceilings are real.
      const roof = ceilingAt(this.plan, this.pos.x, this.pos.z, this.pos.y) - 0.3;
      if (this.pos.y > roof) { this.pos.y = roof; if (this.vy > 0) { this.bump = Math.max(this.bump, this.vy); this.vy *= -0.2; } }
    } else {
      if (this.air) {
        this.air = false;
        const impact = Math.max(0, -this.vy);
        const ffx = Math.sin(this.yaw), ffz = Math.cos(this.yaw), L = beneath && beneath.axis && !beneath.hill ? beneath : null;
        // The slope where the wheels came down, along the way the car is pointing and along the ramp.
        let fwdTan = 0, axTan = 0;
        if (L) {
          const e = 0.04, here = heightOf(L, this.pos.x, this.pos.z), cl = (v, a, b) => Math.max(a, Math.min(b, v));
          fwdTan = (heightOf(L, cl(this.pos.x + ffx * e, L.x0, L.x1), cl(this.pos.z + ffz * e, L.z0, L.z1)) - heightOf(L, cl(this.pos.x - ffx * e, L.x0, L.x1), cl(this.pos.z - ffz * e, L.z0, L.z1))) / (2 * e);
          axTan = L.axis === 'x' ? (heightOf(L, cl(this.pos.x + e, L.x0, L.x1), this.pos.z) - heightOf(L, cl(this.pos.x - e, L.x0, L.x1), this.pos.z)) / (2 * e)
            : (heightOf(L, this.pos.x, cl(this.pos.z + e, L.z0, L.z1)) - heightOf(L, this.pos.x, cl(this.pos.z - e, L.z0, L.z1))) / (2 * e);
          void here;
        }
        // Wheels down, or not? Judged against the slope: nose-down on a steep ramp is right, not a crash.
        const level = -Math.atan(fwdTan);
        let off = this.tilt - level; off = Math.atan2(Math.sin(off), Math.cos(off));
        const crash = Math.abs(off) > 1.05;
        // Coming down onto a slope, the fall turns into speed down it.
        if (L && !crash && Math.abs(axTan) > 0.08) {
          const th = Math.atan(Math.abs(axTan)), d = axTan > 0 ? -1 : 1, along = L.axis === 'x' ? this.vel.x : this.vel.z;
          const run = along * d * Math.cos(th) + impact * Math.sin(th);
          if (run > Math.abs(along)) { if (L.axis === 'x') this.vel.x = d * run; else this.vel.z = d * run; }
        }
        // Coming down on a hill. On the ground the car's speed is counted along the slope, in the air over the flat; leaving
        // the ground turns one into the other, so touching down must turn it back, or every little hop over the round of a
        // hill costs speed and the car judders to a stop. What it has along the slope is its whole motion, fall and all,
        // laid along the slope: so a long drop onto a downhill side comes out as speed down the hill.
        if (beneath && beneath.hill && !crash) {
          const q = 0.3, gx = (heightOf(beneath, this.pos.x + q, this.pos.z) - heightOf(beneath, this.pos.x - q, this.pos.z)) / (2 * q), gz = (heightOf(beneath, this.pos.x, this.pos.z + q) - heightOf(beneath, this.pos.x, this.pos.z - q)) / (2 * q);
          const vh = Math.hypot(this.vel.x, this.vel.z);
          if (vh > 0.05) {
            const tanV = (gx * this.vel.x + gz * this.vel.z) / vh, along = Math.max(0, (vh + this.vy * tanV) / Math.sqrt(1 + tanV * tanV)), k = along / vh;
            this.vel.x *= k; this.vel.z *= k;
          }
        }
        const vs = Math.hypot(this.vel.x, this.vel.z), facing = vs > 0.8 ? Math.abs(this.vel.x * ffx + this.vel.z * ffz) / vs : 1;
        const flips = crash ? 0 : Math.round(this.flip / (Math.PI * 2)), spins = crash ? 0 : Math.round(Math.abs(this.spin) / Math.PI);
        // Perfect: a trick thrown, and the car brought round to land square, wheels flat to the surface, pointing the way it is going.
        const perfect = !crash && (flips !== 0 || spins > 0) && Math.abs(off) < 0.4 && facing > 0.92;
        if (this.airT > 0.22) {
          this.landed = { air: this.airT, dist: Math.hypot(this.pos.x - this._from.x, this.pos.z - this._from.z), impact, crash, flips, spins, hop: this.fromHop, perfect, vert: !!this.vert };
          this.squash = Math.min(1, impact / 5);
        }
        this.tilt = crash ? off : level + off;
        if (crash) { this.vel.multiplyScalar(0.4); this.squash = 1; }
        else if (perfect) this.vel.multiplyScalar(1.12);                    // and a perfect landing carries its speed
        this.vert = null;
        // Carry straight on down the slope landed on, rather than skipping off it.
        this.vy = 0;
        if (beneath && beneath.hill) {
          const q = 0.3;
          this.vy = (heightOf(beneath, this.pos.x + q, this.pos.z) - heightOf(beneath, this.pos.x - q, this.pos.z)) / (2 * q) * this.vel.x + (heightOf(beneath, this.pos.x, this.pos.z + q) - heightOf(beneath, this.pos.x, this.pos.z - q)) / (2 * q) * this.vel.z;
        }
        if (L && !crash && vs > 0.5) {
          const tv = axTan * (L.axis === 'x' ? this.vel.x : this.vel.z) / vs;
          this.vy = vs * tv / Math.sqrt(1 + tv * tv);
        }
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
    // A loop runs along x on the ground unless it says otherwise: `axis: 'z'` runs it along z, and `y` stands it on a
    // deck at that height (the one on the Nichols Bridgeway, bridgeplay.js).
    if (!this.air) for (const L of this.plan.loops) {
      if (Math.abs(this.pos.y - (L.y || 0)) >= 0.05) continue;
      const zx = L.axis === 'z', u0 = zx ? oz : ox, u1 = zx ? this.pos.z : this.pos.x, U = zx ? L.z : L.x, f = zx ? fz : fx;
      for (const way of [1, -1]) {
        const lane = (zx ? L.x : L.z) + (way === L.dir ? 0 : L.shift);
        if ((u0 - U) * way < 0 && (u1 - U) * way >= 0 && Math.abs((zx ? this.pos.x : this.pos.z) - lane) < 0.36 && f * way > 0.88 && vf > 4) {
          this.rail = { L, th: 0, v: vf, top: false, way, rev: way !== L.dir };
          this.yaw = zx ? (way > 0 ? 0 : Math.PI) : (way > 0 ? Math.PI / 2 : -Math.PI / 2);
        }
      }
    }

    // Attitude: nose along the slope, or along the arc in the air.
    let want = this.air ? -Math.atan2(this.vy, Math.max(3, sp)) * 0.75 : -Math.atan2(this.vy, Math.max(0.6, Math.abs(vf))) * Math.sign(vf || 1);
    // On the ground, the slope is read off the ground itself under the wheels, front to back and side to side: parked
    // on a ramp (no climb to measure) the car still sits along it, and across a slope it leans with it instead of
    // half sinking in. A step or an edge under one wheel (more than 20 cm off) is not a slope and is ignored.
    let lean = 0;
    if (!this.air && !this.rail) {
      const fx = Math.sin(this.yaw), fz = Math.cos(this.yaw), Lw = 0.2, Ww = 0.14, x = this.pos.x, z = this.pos.z, y0 = this.pos.y;
      const h = (dx, dz) => { const g = groundAt(this.plan, x + dx, z + dz, y0 + 0.25, STEP, this.on); return Math.abs(g - y0) < 0.2 ? g : y0; };
      const hf = h(fx * Lw, fz * Lw), hb = h(-fx * Lw, -fz * Lw), hl = h(fz * Ww, -fx * Ww), hr = h(-fz * Ww, fx * Ww);
      want = -Math.atan2(hf - hb, 2 * Lw);
      lean = Math.max(-0.5, Math.min(0.5, Math.atan2(hl - hr, 2 * Ww)));
    }
    if (this.air && this.vert) { const k = Math.min(1, this.vert.t / this.vert.T), e = k * k * (3 - 2 * k); want = this.vert.tilt0 + ((this.vert.spine ? 0.48 : 0.9) - this.vert.tilt0) * e; }       // nose down, to suit the slope it will meet
    let d = want - this.tilt; d = Math.atan2(Math.sin(d), Math.cos(d));
    if (!(this.air && inp.trick && Math.abs(th) > 0.2)) this.tilt += d * Math.min(1, dt * (this.air ? (this.vert ? 10 : 5) : 16));
    const latAcc = rate * vf;
    this.roll += (Math.max(-0.16, Math.min(0.16, latAcc * 0.012)) - this.roll) * Math.min(1, dt * 8);
    this.lean = (this.lean || 0) + (lean - (this.lean || 0)) * Math.min(1, dt * 14);      // the whole car, wheels and all, leans with the ground
    this.pitch += (Math.max(-0.07, Math.min(0.07, -th * 0.05)) - this.pitch) * Math.min(1, dt * 6);
    this.squash = this.calm ? 0 : Math.max(0, this.squash - dt * 5);
    const under = this.plan.obstacles.some(o => o.bench && this.pos.y < o.y0 && this.pos.y > o.y0 - 0.6 && this.pos.x > o.x0 - 0.1 && this.pos.x < o.x1 + 0.1 && this.pos.z > o.z0 - 0.1 && this.pos.z < o.z1 + 0.1);
    const tx = -latAcc * 0.02 + this.bump * 0.2, tz = -th * 0.22 - (under ? 1.25 : 0) + vf * 0.02 + this.squash * 0.9 + (this.air ? 0.25 : 0);
    this.aerialV.x += ((tx - this.aerialP.x) * 90 - this.aerialV.x * 5) * dt;
    this.aerialV.y += ((tz - this.aerialP.y) * 90 - this.aerialV.y * 5) * dt;
    this.aerialP.addScaledVector(this.aerialV, dt);
    this.under = under;
    this._tow(dt);
    this.sync(dt);
  }

  // On the loop the car runs on a rail: one number, how far round it is.
  // Speed is traded for height honestly, so too slow and it drops off the top.
  _loop(dt, inp) {
    const GRAVITY = this.gravity;
    const s = this.rail, L = s.L, r = L.r;
    this.throttle = inp.throttle; this.steer = 0;
    s.v += (-GRAVITY * Math.sin(s.th) + Math.max(0, inp.throttle) * 6.5 - s.v * 0.12) * dt;
    s.th += (s.v / r) * dt;
    const c = Math.cos(s.th);
    if (s.th > Math.PI * 0.5 && s.th < Math.PI * 1.5) s.top = true;
    const fell = s.v < 0.4 || (c < 0 && s.v * s.v < -GRAVITY * r * c * 0.7);
    const turn = Math.min(1, s.th / (Math.PI * 2)), zx = L.axis === 'z', y0 = L.y || 0, along = s.way * r * Math.sin(s.th), side = L.shift * (s.rev ? 1 - turn : turn);
    if (zx) this.pos.set(L.x + side, y0 + r - r * c, L.z + along); else this.pos.set(L.x + along, y0 + r - r * c, L.z + side);
    this.speed = s.v;
    this.airT = 0;
    if (fell) {
      // Not enough speed: let go of the track and fall like a dropped toy.
      if (zx) this.vel.set(0, 0, s.way * s.v * c); else this.vel.set(s.way * s.v * c, 0, 0);
      this.vy = s.v * Math.sin(s.th);
      this.tilt = -s.th; this.rail = null; this.air = true; this._from.x = this.pos.x; this._from.z = this.pos.z;
      this.flip = this.spin = 0; this.fromHop = false; this.on = null;
      this.fellOff = true;
    } else if (s.th >= Math.PI * 2) {
      if (zx) { this.pos.set(L.x + (s.rev ? 0 : L.shift), y0, L.z + s.way * 0.02); this.vel.set(0, 0, s.way * s.v); }
      else { this.pos.set(L.x + s.way * 0.02, y0, L.z + (s.rev ? 0 : L.shift)); this.vel.set(s.way * s.v, 0, 0); }
      this.vy = 0; this.tilt = 0; this.rail = null;
      this.looped = true;
    } else this.tilt = -s.th;
    this.roll = 0; this.pitch = 0; this.lean = 0;
    this.sync(dt);
  }

  sync(dt) {
    this.group.position.copy(this.pos);
    this.group.position.y -= this.squash * 0.018;
    this.group.rotation.y = this.yaw;
    this.group.rotation.x = this.tilt;
    this.group.rotation.z = this.lean || 0;
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
    this._drawTrailer(dt);
  }

  get height() { return 0.12; }
}

// ----------------------------------------------------------------- drone ---

export function buildDrone(colour = 0xe9e6df) {
  const g = new THREE.Group();
  const body = new THREE.Group();
  g.add(body);
  const shell = std(colour, { roughness: 0.35, emissive: colour, emissiveIntensity: 0.1 }); shell.name = 'paint';
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
    this.spec = { ...DRONE_SPEC };
  }

  // Another airframe on the same toy (see garage.js).
  reskin(model, spec = {}) {
    this.group.remove(this.body);
    this.body = model.body; this.props = model.props;
    this.anim = model.anim || null;                   // a body that moves by itself (a saucer's lights) says how
    this.group.add(this.body);
    this.spec = { ...DRONE_SPEC, ...spec };
    this.sync(0);
  }

  place(x, z, yaw, y = 1.2) { this.pos.set(x, y, z); this.vel.set(0, 0, 0); this.yaw = yaw; this.sync(0); }

  update(dt, inp) {
    const fx = Math.sin(this.yaw), fz = Math.cos(this.yaw);
    const rx = -fz, rz = fx;
    const S = this.spec, A = 22 * S.accel;
    this.vel.x += (fx * inp.pitch + rx * inp.roll) * A * dt;
    this.vel.z += (fz * inp.pitch + rz * inp.roll) * A * dt;
    const drag = Math.exp(-1.7 * (S.drag || 1) * dt);
    this.vel.x *= drag; this.vel.z *= drag;
    this.vel.y += (inp.climb * 5.2 * S.climb - this.vel.y) * Math.min(1, dt * 5 * (S.drag || 1));
    this.yaw -= inp.yaw * 2.5 * S.yaw * dt;
    const ox = this.pos.x, oy = this.pos.y, oz = this.pos.z;
    this.pos.addScaledVector(this.vel, dt);

    this.bump = 0;
    // Plywood and stone stop a drone side-on too; table tops and ramps are somewhere to land.
    if (wallAt(this.plan, this.pos.x, this.pos.z, this.pos.y - 0.07, 0.06)) {
      if (!wallAt(this.plan, ox, this.pos.z, this.pos.y - 0.07, 0.06)) { this.pos.x = ox; this.vel.x *= -0.3; }
      else if (!wallAt(this.plan, this.pos.x, oz, this.pos.y - 0.07, 0.06)) { this.pos.z = oz; this.vel.z *= -0.3; }
      else { this.pos.x = ox; this.pos.z = oz; this.vel.x *= -0.3; this.vel.z *= -0.3; }
    }
    // Whatever it was above before this step it is still above. (Coming down fast, a quick airframe or a slow frame moves
    // it further in one step than a deck or a plank is thick: it must land on it, not pass into it and be found under it.)
    const floor = groundAt(this.plan, this.pos.x, this.pos.z, Math.max(this.pos.y, oy), 0.02) + 0.07;
    this.floor = floor;
    if (this.pos.y < floor) { this.pos.y = floor; if (this.vel.y < 0) this.vel.y = 0; }
    // And a balcony, a bridge or a stair overhead is as solid from below as from above: from below. Something it is
    // already in (a lift car that has come up round it) does not push it down through itself; climbing takes it out on top.
    const head = headAt(this.plan, this.pos.x, this.pos.z, Math.min(this.pos.y, oy)) - 0.2;
    if (this.pos.y > head && head > floor + 0.1 && oy <= head + 0.12 && !(this._free > 0)) { this.pos.y = head; if (this.vel.y > 0) { this.bump = this.vel.y; this.vel.y = 0; } }
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
    // Never trapped. Holding still with climb held and yet carried down, frame after frame, by something overhead (still
    // air under a fixed slab does not do that; flying along under a sloping plank does, and is left alone): for a moment
    // nothing overhead holds it, and it goes up through.
    if (this._free > 0) this._free -= dt;
    if (inp.climb > 0.3 && this.pos.y < oy - 1e-4 && Math.hypot(this.pos.x - ox, this.pos.z - oz) < 0.6 * dt) { this._sunk = (this._sunk || 0) + dt; if (this._sunk > 0.6) { this._free = 1.2; this._sunk = 0; } }
    else this._sunk = 0;
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
    if (this.anim) this.anim(this, dt);
    const g = groundAt(this.plan, this.pos.x, this.pos.z, this.pos.y, 0.02), h = this.pos.y - g;
    this.shadow.position.set(this.pos.x, g + 0.006, this.pos.z);
    const k = Math.max(0, 1 - h / 5);
    this.shadow.material.opacity = 0.45 * k;
    this.shadow.scale.setScalar(1 + h * 0.5);
  }

  get height() { return 0; }
}
