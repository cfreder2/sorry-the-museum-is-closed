// Four set-pieces (features.js): the armour in Gallery 239 that wants a joust, the dragon that comes out of
// Saint George in Gallery 237, the twelve clocks of Galleries 231-233 that want to strike midnight, and the
// lion hunt: twelve lions loose about the building, started by the lion hunt painting in Gallery 220.
// Everything here is modelled for the game (clay, boxes and canvas); none of it copies a work in the collection.
import * as THREE from 'three';
import { feature } from './features.js';
import { Clay, cast } from './sculpt.js';

const TAU = Math.PI * 2;
const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));
const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, emissive: color, emissiveIntensity: 0.18, ...o });
function box(w, h, d, m, x, y, z, parent) { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); parent.add(b); return b; }
function cyl(rt, rb, h, m, x, y, z, parent, seg = 14) { const c = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m); c.position.set(x, y, z); parent.add(c); return c; }
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private window */ } },
};
// Is a spot on the floor clear: no furniture, ramp or doorway within `rad`?
function clear(P, room, x, z, rad, door = 1.6) {
  const y = room.y;
  if (x < room.x0 + 0.1 || x > room.x1 - 0.1 || z < room.z0 + 0.1 || z > room.z1 - 0.1) return false;
  for (const o of P.obstacles) if (o.y0 < y + 1.2 && o.y1 > y + 0.02 && x > o.x0 - rad && x < o.x1 + rad && z > o.z0 - rad && z < o.z1 + rad) return false;
  for (const s of P.surfaces) { const hi = Math.max(s.h0 ?? s.h ?? 0, s.h1 ?? s.h ?? 0); if (hi > y - 0.05 && hi < y + 3 && x > s.x0 - rad && x < s.x1 + rad && z > s.z0 - rad && z < s.z1 + rad) return false; }
  for (const d of P.doorsOf(room.id)) { const cx = Math.max(d.x0, Math.min(d.x1, x)), cz = Math.max(d.z0, Math.min(d.z1, z)); if (Math.hypot(x - cx, z - cz) < door) return false; }
  return true;
}
// Is a stretch of wall free of hung works?
function bareWall(museum, room, x, z, nx, nz, half = 0.5) {
  for (const a of museum.arts) {
    if (a.room !== room.id) continue;
    if (Math.abs((a.x - x) * nx + (a.z - z) * nz) > 0.6) continue;
    const lat = Math.abs((a.x - x) * nz - (a.z - z) * nx);
    if (lat < (a.w || 1) / 2 + half) return false;
  }
  return true;
}

// ================================================================ the armour and the joust (Gallery 239)
function armourBody() {
  const c = new Clay([-0.42, -0.02, -0.26], [0.42, 1.44, 0.3], 0.02);
  for (const s of [-1, 1]) {
    c.limb([s * 0.1, 0.92, 0], [s * 0.11, 0.52, 0.02], 0.075, 0.058);
    c.blob([s * 0.11, 0.5, 0.045], 0.062, { k: 0.02 });
    c.limb([s * 0.11, 0.5, 0.02], [s * 0.11, 0.1, 0], 0.057, 0.045);
    c.blob([s * 0.11, 0.04, 0.05], [0.055, 0.04, 0.12], { k: 0.03 });
  }
  c.blob([0, 0.96, 0], [0.17, 0.09, 0.12]);
  for (let i = 0; i < 3; i++) c.blob([0, 0.9 - i * 0.055, 0.01], [0.19 + i * 0.012, 0.03, 0.13 + i * 0.008], { k: 0.012 });
  c.blob([0, 1.17, 0.0], [0.19, 0.2, 0.13]);
  c.blob([0, 1.2, 0.05], [0.14, 0.15, 0.09]);
  c.limb([0, 1.3, 0.12], [0, 1.05, 0.13], 0.012, 0.012, { k: 0.01 });
  c.blob([0, 1.37, 0], [0.075, 0.05, 0.07]);
  for (const s of [-1, 1]) {
    c.blob([s * 0.2, 1.32, 0], [0.1, 0.07, 0.1], { k: 0.03 });
    c.limb([s * 0.23, 1.28, 0], [s * 0.26, 1.04, 0.03], 0.05, 0.045);
    c.blob([s * 0.26, 1.03, 0.03], 0.055, { k: 0.02 });
    c.limb([s * 0.26, 1.03, 0.03], [s * 0.23, 0.86, 0.16], 0.045, 0.04);
    c.blob([s * 0.22, 0.85, 0.18], [0.045, 0.05, 0.055], { k: 0.02 });
  }
  return c.mesh({ hi: 0xdfe5ec, lo: 0x262a31, snow: 0, reach: 0.1 });
}
function armourHelm() {
  const c = new Clay([-0.14, -0.06, -0.16], [0.14, 0.3, 0.18], 0.012);
  c.blob([0, 0.12, 0], [0.1, 0.13, 0.115]);
  c.blob([0, 0.08, 0.075], [0.085, 0.07, 0.07], { k: 0.03 });
  c.limb([0, 0.25, -0.1], [0, 0.255, 0.08], 0.014, 0.014, { k: 0.02 });
  c.blob([0, 0.14, 0.135], [0.075, 0.01, 0.06], { cut: true, k: 0.005 });
  for (let i = 0; i < 4; i++) c.blob([0.02 * (i - 1.5), 0.06, 0.14], [0.004, 0.02, 0.05], { cut: true, k: 0.003 });
  return c.mesh({ hi: 0xe8edf2, lo: 0x22262c, snow: 0, reach: 0.06 });
}
function horseHead() {
  const c = new Clay([-0.1, -0.12, -0.12], [0.1, 0.24, 0.3], 0.012);
  c.limb([0, 0, -0.06], [0, 0.12, 0.08], 0.05, 0.06);
  c.blob([0, 0.12, 0.12], [0.055, 0.06, 0.1]);
  c.blob([0, 0.08, 0.24], [0.045, 0.045, 0.05]);
  for (const s of [-1, 1]) c.limb([s * 0.03, 0.17, 0.06], [s * 0.035, 0.23, 0.04], 0.015, 0.006, { k: 0.01 });
  for (let i = 0; i < 5; i++) c.blob([0, 0.17 - i * 0.04, 0.02 - i * 0.03], [0.018, 0.035, 0.03], { k: 0.02 });
  return c.mesh({ hi: 0xf1e6cf, lo: 0x5b4226, snow: 0, reach: 0.06 });
}
function lanceMesh(len, steel, wood) {
  const g = new THREE.Group();
  const shaft = cyl(0.012, 0.026, len, wood, 0, 0, 0, g); shaft.rotation.x = Math.PI / 2; shaft.position.z = len * 0.5;
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.016, 0.07, 10), steel); tip.rotation.x = Math.PI / 2; tip.position.z = len + 0.03; g.add(tip);
  const guard = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.1, 14, 1, true), steel); guard.rotation.x = -Math.PI / 2; guard.position.z = len * 0.18; g.add(guard);
  return g;
}

feature({
  id: 'joust239',
  secrets: [['joust', 'The joust']],
  init(k) {
    const r = k.plan.byId.G239; if (!r) { this.off = true; return; }
    const y = r.y; this.r = r; this.y = y;
    // The lists run up the east side, clear of the bench and the lift: you ride down between the lift and the tilt.
    this.tx = r.x0 + 11.5; this.laneKnight = r.x0 + 12.3;
    this.north = r.z0 + 1.8; this.stand = { x: this.laneKnight, y, z: r.z1 - 2.5 }; this.start = { x: this.laneKnight, y, z: r.z1 - 3.3 };
    const steel = cast({ metalness: 0.7, roughness: 0.35, emissiveIntensity: 0.5 }), wood = std(0x6b4a2c), dark = std(0x2b1d12), red = std(0xa3192a), brass = std(0xc9a24a, { metalness: 0.6, roughness: 0.4 });
    this.mats = { steel, wood, red, brass };
    // The stand: a low plinth with a post up the back.
    const st = new THREE.Group(); st.position.set(this.stand.x, y, this.stand.z); k.group.add(st);
    box(0.74, 0.08, 0.54, dark, 0, 0.04, 0, st); box(0.05, 1.4, 0.05, dark, 0, 0.75, 0.22, st);
    k.plan.obstacles.push({ x0: this.stand.x - 0.37, x1: this.stand.x + 0.37, z0: this.stand.z - 0.27, z1: this.stand.z + 0.27, y0: y, y1: y + 1.6 });
    // The knight: yaw > tilt (to fall and bow) > armour, helmet, horse and lance.
    const kn = new THREE.Group(), tilt = new THREE.Group(); kn.add(tilt); k.group.add(kn);
    tilt.add(new THREE.Mesh(armourBody(), steel));
    const helm = new THREE.Group(); helm.position.y = 1.38; tilt.add(helm); helm.add(new THREE.Mesh(armourHelm(), steel));
    const plume = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), red); plume.scale.set(0.7, 1.4, 1.6); plume.position.set(0, 0.3, -0.06); helm.add(plume);
    const horse = new THREE.Group(); tilt.add(horse); horse.visible = false;
    const hh = new THREE.Mesh(horseHead(), cast({ metalness: 0.05, roughness: 0.8, emissiveIntensity: 0.55 })); hh.position.set(0, 0.92, 0.42); horse.add(hh);
    const stick = cyl(0.016, 0.016, 1.25, wood, 0, 0.5, 0.0, horse); stick.rotation.x = -0.72;
    const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.015, 6, 16), dark); wheel.rotation.y = Math.PI / 2; wheel.position.set(0, 0.07, -0.42); horse.add(wheel);
    const rein = box(0.006, 0.006, 0.45, red, 0, 0.9, 0.3, horse); rein.rotation.x = 0.4;
    const lance = lanceMesh(2.8, steel, wood); lance.position.set(-0.22, 0.86, 0.15); lance.rotation.y = 0.62; tilt.add(lance); lance.visible = false;
    Object.assign(this, { kn, tilt, helm, horse, lance });
    // The tilt: a low painted barrier down the middle of the room, there only while a joust is on.
    const z0 = r.z0 + 1.6, z1 = r.z1 - 3.6;
    this.barrier = new THREE.Group(); k.group.add(this.barrier); this.barrier.visible = false;
    for (let z = z0, i = 0; z < z1; z += 0.8, i++) box(0.06, 0.5, Math.min(0.8, z1 - z), i % 2 ? red : std(0xeadfc8), this.tx, y + 0.25, z + Math.min(0.8, z1 - z) / 2, this.barrier);
    box(0.08, 0.04, z1 - z0, dark, this.tx, y + 0.52, (z0 + z1) / 2, this.barrier);
    this.gate = { off: true };
    k.plan.obstacles.push({ x0: this.tx - 0.05, x1: this.tx + 0.05, z0, z1, y0: y, y1: y + 0.55, gate: this.gate });
    // The lance, put away in the service corridor nearest the gallery.
    const B = k.plan.byId['B2-125'] || r;
    this.lanceAt = { x: B.x0 + 0.45, y: B.y, z: Math.min(B.z1 - 2, B.z0 + 9) };
    for (const dz of [0, 3, 6, -3, 9, 12]) if (clear(k.plan, B, B.x0 + 0.45, B.z0 + 9 + dz, 0.3, 1.2)) { this.lanceAt.z = B.z0 + 9 + dz; break; }
    this.rack = { x: this.stand.x + 0.6, y, z: this.stand.z + 0.1 };
    this.toy = lanceMesh(0.62, steel, wood); this.toy.scale.setScalar(1);
    k.group.add(this.toy); this.home(k);
    this.layLance(k);
  },
  home(k) {
    this.phase = 'idle'; this.t = 0;
    this.kn.position.set(this.stand.x, this.y + 0.08, this.stand.z); this.kn.rotation.y = Math.PI; this.tilt.rotation.x = 0;
    this.horse.visible = false; this.lance.visible = false; this.barrier.visible = false; this.gate.off = true;
  },
  layLance(k, at = this.lanceAt, up = false) {
    k.group.add(this.toy); this.toy.position.set(at.x, at.y + (up ? 0.03 : 0.03), at.z); this.toy.rotation.set(up ? -1.25 : 0, up ? 0 : 0.04, 0); this.lying = at;
  },
  active(k) { return !this.off && (this.phase !== 'idle' || k.inRoom(['G239', 'B2-125'], 3)); },
  update(dt, k) {
    const v = k.v, p = k.pos;
    // The lance: drive into it to pick it up.
    if (this.lying && !k.carry.has('lance')) {
      const L = this.lying, d = this.lying === this.lanceAt ? Math.max(Math.abs(p.x - L.x) - 0.08, 0) ** 2 + Math.max(Math.abs(p.z - (L.z + 0.31)) - 0.31, 0) ** 2 : (p.x - L.x) ** 2 + (p.z - L.z) ** 2;
      if (Math.abs(p.y - L.y) < 1 && d < 0.3 * 0.3) {
        if (k.carry.list.length >= k.carry.max) k.once('lance-full', 'A lance, but your hands are full: take something back first.', 3);
        else { this.toy.rotation.set(0, 0, 0); this.lying = null; k.carry.take({ id: 'lance', mesh: this.toy }); k.say(L === this.lanceAt ? 'A tilting lance, put away in the corridor. The armour in Gallery 239 has been looking for it.' : 'The lance again.', 4); }
      }
    }
    if (!k.inRoom('G239', 1) && this.phase === 'idle') return;
    const kn = this.kn, ease = (a, b, s) => a + (b - a) * Math.min(1, dt * s);
    this.t += dt;
    if (this.phase === 'idle') {
      // The helmet turns to follow the toy round the room.
      const want = Math.max(-1.1, Math.min(1.1, wrap(Math.atan2(p.x - kn.position.x, p.z - kn.position.z) - kn.rotation.y)));
      this.helm.rotation.y = ease(this.helm.rotation.y, want, 3);
      if (!k.carry.has('lance') && k.close(this.stand, 3)) k.once('armour-lance', 'The helmet follows you round the room. Its lance is missing: put away somewhere behind the scenes.', 4);
      return;
    }
    this.helm.rotation.y = ease(this.helm.rotation.y, 0, 4);
    const glide = (to, sp) => { const dx = to.x - kn.position.x, dz = to.z - kn.position.z, d = Math.hypot(dx, dz); if (d < 0.05) return true; const s = Math.min(d, sp * dt); kn.position.x += dx / d * s; kn.position.z += dz / d * s; kn.position.y = this.y + Math.abs(Math.sin(this.t * 9)) * 0.03; return false; };
    if (this.phase === 'mount') { if (glide(this.start, 1.6)) { this.phase = 'wait'; this.t = 0; kn.rotation.y = Math.PI; } }
    else if (this.phase === 'wait') {
      if (this.inLane(p) && p.z < this.north + 2.5) { this.phase = 'count'; this.t = 0; k.callout('LANCE LEVEL'); }
      else if (this.t > 40) { k.say('The knight gives up waiting and goes back to his stand.', 3); this.phase = 'return'; }
    } else if (this.phase === 'count') {
      if (this.t > 1.2) { this.phase = 'charge'; this.t = 0; this.sp = 1; k.callout('CHARGE'); [392, 523, 659, 784].forEach((f, i) => k.synth.note(f, i === 3 ? 0.7 : 0.18, { type: 'sawtooth', vol: 0.035, at: i * 0.16 })); }
    } else if (this.phase === 'charge') {
      this.sp = Math.min(5, this.sp + dt * 4);
      kn.position.z -= this.sp * dt;
      kn.position.y = this.y + Math.abs(Math.sin(this.t * 11)) * 0.06;
      this.tilt.rotation.x = Math.sin(this.t * 11) * 0.04;
      if (kn.position.z <= p.z && this.inLane(p) && Math.abs(p.y - this.y) < 1) {
        const hit = v.vel.z >= 3 && !v.air && k.carry.has('lance');
        if (hit) {
          this.phase = 'down'; this.t = 0;
          k.synth.noise(0.35, { vol: 0.12, lp: 5000 }); k.synth.note(1240, 0.6, { type: 'square', vol: 0.04 }); k.synth.note(620, 0.9, { vol: 0.05 });
          if (k.find('joust')) k.chips(60);
          k.callout('A HIT!'); k.say('A clean hit. The knight goes over with a clatter, and the lance is his to keep on the stand.', 4);
          k.carry.drop('lance'); this.layLance(k, this.rack, true);
        } else {
          this.phase = 'miss'; this.t = 0;
          k.say(!k.carry.has('lance') ? 'No lance, no joust.' : v.vel.z < 3 ? 'Too slow: you have to meet him at a gallop.' : 'You were in the air: keep your lance level on the ground.', 3.5);
        }
      } else if (kn.position.z < this.north) { this.phase = 'miss'; this.t = 0; k.say('He thunders past. Meet him in your lane, at a gallop.', 3.5); }
    } else if (this.phase === 'down') {
      this.tilt.rotation.x = ease(this.tilt.rotation.x, -1.45, 6); kn.position.y = ease(kn.position.y, this.y, 6);
      if (this.t > 3.2) { this.tilt.rotation.x = 0; this.phase = 'return'; }
    } else if (this.phase === 'miss') {
      kn.position.y = ease(kn.position.y, this.y, 6);
      kn.rotation.y = ease(kn.rotation.y, 0, 3);
      this.tilt.rotation.x = this.t > 0.8 && this.t < 2 ? ease(this.tilt.rotation.x, 0.5, 5) : ease(this.tilt.rotation.x, 0, 5);
      if (this.t > 1 && this.t < 1.1) k.say('He bows. Again, whenever you like.', 3);
      if (this.t > 2.4) this.phase = 'return';
    } else if (this.phase === 'return') {
      this.barrier.visible = false; this.gate.off = true; this.horse.visible = false; this.lance.visible = false; this.tilt.rotation.x = 0;
      kn.rotation.y = Math.atan2(this.stand.x - kn.position.x, this.stand.z - kn.position.z);
      if (glide(this.stand, 2)) this.home(k);
    }
  },
  inLane(p) { return p.x > this.tx - 1.6 && p.x < this.tx - 0.08 && p.z > this.r.z0 && p.z < this.r.z1; },
  near(v, k) {
    if (this.off || this.phase !== 'idle' || !k.carry.has('lance') || !k.close(this.stand, 2.2)) return null;
    return { verb: 'JOUST', hint: 'The knight wants his lance back, at the gallop. E to accept the challenge.', act: () => {
      this.phase = 'mount'; this.t = 0; this.horse.visible = true; this.lance.visible = true; this.barrier.visible = true; this.gate.off = false;
      this.kn.rotation.y = Math.atan2(this.start.x - this.kn.position.x, this.start.z - this.kn.position.z);
      k.say('A joust! Ride to the doors at the far end, turn, and charge him down your side of the tilt, lance level.', 5);
    } };
  },
  spots() { return this.off ? [] : [{ kind: 'secret', id: 'joust', name: 'The joust', x: this.stand.x, y: this.y, z: this.stand.z }, { kind: 'secret', id: 'joust', name: 'The lance', x: this.lanceAt.x, y: this.lanceAt.y, z: this.lanceAt.z }]; },
  reset(k) { if (this.off) return; this.home(k); this.layLance(k); },
});

// ================================================================ the dragon's shadow (Gallery 237)
function shadowTex(draw) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 256; const g = c.getContext('2d');
  g.fillStyle = 'rgba(0,0,0,0.85)'; g.shadowColor = 'rgba(0,0,0,0.9)'; g.shadowBlur = 10; draw(g);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const dragonBody = g => {             // seen from above, head towards the bottom of the canvas
  g.beginPath(); g.ellipse(128, 118, 22, 46, 0, 0, TAU); g.fill();
  g.beginPath(); g.moveTo(112, 150); g.quadraticCurveTo(120, 200, 128, 214); g.quadraticCurveTo(136, 200, 144, 150); g.fill();
  g.beginPath(); g.ellipse(128, 222, 13, 20, 0, 0, TAU); g.fill();
  for (const s of [-1, 1]) { g.beginPath(); g.moveTo(128 + s * 6, 210); g.lineTo(128 + s * 22, 196); g.lineTo(128 + s * 10, 214); g.fill(); }
  g.lineWidth = 9; g.lineCap = 'round'; g.strokeStyle = g.fillStyle; g.beginPath(); g.moveTo(128, 80); g.bezierCurveTo(150, 40, 96, 30, 120, 4); g.stroke();
  for (const s of [-1, 1]) for (const z of [100, 145]) { g.beginPath(); g.moveTo(128 + s * 18, z); g.lineTo(128 + s * 40, z + 10); g.lineTo(128 + s * 36, z + 18); g.fill(); }
};
const dragonWings = g => {
  for (const s of [-1, 1]) {
    g.beginPath(); g.moveTo(128, 120); g.lineTo(128 + s * 120, 70); g.lineTo(128 + s * 112, 110); g.lineTo(128 + s * 92, 112); g.lineTo(128 + s * 86, 146); g.lineTo(128 + s * 62, 140); g.lineTo(128 + s * 50, 168); g.lineTo(128 + s * 18, 150); g.closePath(); g.fill();
  }
};

feature({
  id: 'dragon237',
  secrets: [['dragon', 'Lost the dragon']],
  init(k) {
    const art = k.museum.arts.find(a => a.room === 'G237' && /Saint George/i.test(a.work.t)) || k.museum.arts.find(a => /Saint George and the Dragon/i.test(a.work.t));
    if (!art) { this.off = true; return; }
    this.art = art; this.from = { x: art.x + (art.nx || 0) * 0.6, y: k.plan.byId[art.room].y, z: art.z + (art.nz || 0) * 0.6 };
    const m = o => new THREE.MeshBasicMaterial({ map: o, transparent: true, opacity: 0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, color: 0xffffff });
    this.g = new THREE.Group(); this.g.visible = false; k.group.add(this.g);
    const body = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 2.8), m(shadowTex(dragonBody))); body.rotation.x = -Math.PI / 2; body.position.y = 0.012;
    const wings = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 3.6), m(shadowTex(dragonWings))); wings.rotation.x = -Math.PI / 2; wings.position.y = 0.014;
    this.wingPivot = new THREE.Group(); this.wingPivot.add(wings); this.wingPivot.position.z = 0.1; this.g.add(body, this.wingPivot); this.mats = [body.material, wings.material];
    this.phase = 'idle';
  },
  onLook(art, k) {
    if (this.off || !art || art.work !== this.art.work || this.phase !== 'idle') return;
    this.phase = 'wake'; this.t = 0; this.trail = [{ ...this.from, room: art.room }]; this.s = 0; this.sp = 2; this.still = 0; this.opacity = 0;
    k.synth.note(55, 2.5, { type: 'sawtooth', vol: 0.03, attack: 0.8 });
  },
  active() { return !this.off && this.phase !== 'idle'; },
  update(dt, k) {
    const p = k.pos, v = k.v;
    this.t += dt;
    if (this.phase === 'wake') {             // waits until you step back from the painting
      if (k.G.study) { this.t = 0; return; }
      if (this.t > 0.5) { this.phase = 'rise'; this.t = 0; this.g.visible = true; this.yaw = Math.atan2(k.pos.x - this.from.x, k.pos.z - this.from.z); this.g.position.set(this.from.x - Math.sin(this.yaw) * 1.1, this.from.y, this.from.z - Math.cos(this.yaw) * 1.1); this.g.rotation.y = this.yaw; k.callout('RUN'); k.say('Something has got out of the painting. Run: three rooms away, or hide in a doorway.', 4); k.synth.noise(1.2, { vol: 0.07, lp: 500 }); }
      return;
    }
    if (this.phase === 'rise') {             // a moment to spread its wings, and for you to get going
      this.opacity = Math.min(0.62, this.opacity + dt * 0.4); for (const mm of this.mats) mm.opacity = this.opacity;
      this.wingPivot.scale.x = 0.7 + 0.3 * Math.sin(this.t * 5.5);
      if (this.t > 1.8) { this.phase = 'chase'; this.t = 0; }
      return;
    }
    // Breadcrumbs: the dragon follows the toy's own path, so it comes through doors and not walls.
    const last = this.trail[this.trail.length - 1];
    if (this.phase === 'chase' && Math.hypot(p.x - last.x, p.z - last.z) > 0.3) this.trail.push({ x: p.x, y: p.y, z: p.z, room: k.G.roomId });
    const fade = this.phase === 'fade';
    this.opacity = Math.max(0, Math.min(0.62, this.opacity + (fade ? -0.5 : 0.4) * dt));
    for (const mm of this.mats) mm.opacity = this.opacity;
    this.wingPivot.scale.x = 0.7 + 0.3 * Math.sin(this.t * 5.5);
    if (fade) { if (this.opacity <= 0) { this.phase = 'idle'; this.g.visible = false; } return; }
    // Move along the trail.
    this.sp = Math.min(5.5, this.sp + dt * 0.35);
    let go = this.sp * dt;
    while (go > 0 && this.s < this.trail.length - 1) {
      const i = Math.floor(this.s), a = this.trail[i], b = this.trail[i + 1], seg = Math.max(1e-4, Math.hypot(b.x - a.x, b.z - a.z)), f = this.s - i, left = seg * (1 - f);
      if (go >= left) { go -= left; this.s = i + 1; } else { this.s += go / seg; go = 0; }
    }
    const i = Math.min(Math.floor(this.s), this.trail.length - 1), a = this.trail[i], b = this.trail[Math.min(i + 1, this.trail.length - 1)], f = this.s - i;
    const hx = a.x + (b.x - a.x) * f, hz = a.z + (b.z - a.z) * f, hy = a.y + (b.y - a.y) * f;
    const look = this.trail[Math.min(this.trail.length - 1, i + 3)];
    if (Math.hypot(look.x - hx, look.z - hz) > 0.05) this.yaw = Math.atan2(look.x - hx, look.z - hz);
    const yaw = this.yaw || 0;
    this.g.position.set(hx - Math.sin(yaw) * 1.1, hy, hz - Math.cos(yaw) * 1.1); this.g.rotation.y = yaw;
    // Caught?
    if (Math.hypot(p.x - hx, p.z - hz) < 0.8 && Math.abs(p.y - hy) < 1) {
      const d = Math.hypot(p.x - hx, p.z - hz) || 1;
      v.vel.x += (p.x - hx) / d * 7 + Math.sin(yaw) * 3; v.vel.z += (p.z - hz) / d * 7 + Math.cos(yaw) * 3;
      k.synth.noise(0.9, { vol: 0.12, lp: 900 });
      k.say('A gust of dragon breath, and it is gone. Look at Saint George again to try again.', 4);
      this.phase = 'fade'; return;
    }
    // Lost? Three rooms between it and you...
    const seen = new Set(), here = this.trail[i].room;
    for (let j = i; j < this.trail.length; j++) { const rm = this.trail[j].room; if (rm && rm !== here) seen.add(rm); }
    const rooms = seen.size;
    // ...or keep still in a doorway.
    const speed = Math.hypot(v.vel.x, v.vel.z), room = k.room;
    const inDoor = room && k.plan.doorsOf(room.id).some(d => p.x > d.x0 - 0.45 && p.x < d.x1 + 0.45 && p.z > d.z0 - 0.45 && p.z < d.z1 + 0.45);
    this.still = inDoor && speed < 0.3 && Math.hypot(p.x - hx, p.z - hz) > 1.6 ? this.still + dt : 0;
    if (rooms >= 3 || this.still > 1.5) {
      k.say(rooms >= 3 ? 'The shadow loses the scent and sinks back into the floor.' : 'It snuffles past the doorway and never sees you.', 4);
      if (k.find('dragon')) { k.callout('LOST THE DRAGON'); k.chips(40); }
      this.phase = 'fade'; return;
    }
    if (this.t > 90) { k.say('The dragon tires and fades away.', 3); this.phase = 'fade'; }
  },
  spots() { return this.off ? [] : [{ kind: 'secret', id: 'dragon', name: 'Lost the dragon', x: this.from.x, y: this.from.y, z: this.from.z }]; },
  reset() { if (this.off) return; this.phase = 'idle'; this.g.visible = false; this.opacity = 0; },
});

// ================================================================ twelve clocks and midnight (Galleries 231-234)
function dialTex(bg, ink) {
  const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
  g.fillStyle = bg; g.beginPath(); g.arc(128, 128, 127, 0, TAU); g.fill();
  g.strokeStyle = ink; g.lineWidth = 5; g.beginPath(); g.arc(128, 128, 120, 0, TAU); g.stroke();
  g.lineWidth = 2; g.beginPath(); g.arc(128, 128, 84, 0, TAU); g.stroke();
  g.fillStyle = ink; g.font = 'bold 25px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  ['XII', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'].forEach((s, i) => { const a = i / 12 * TAU; g.save(); g.translate(128 + Math.sin(a) * 102, 128 - Math.cos(a) * 102); g.rotate(a); g.fillText(s, 0, 0); g.restore(); });
  for (let i = 0; i < 60; i++) { const a = i / 60 * TAU; g.save(); g.translate(128, 128); g.rotate(a); g.fillRect(-1, -119, 2, i % 5 ? 5 : 9); g.restore(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const CLOCKS = ['bracket clock', 'lantern clock', 'drum clock', 'skeleton clock', 'cartel clock', 'carriage clock'];
const fmt = t => { const h = Math.floor(t / 60) % 12 || 12, m = Math.round(t % 60); return h + ':' + String(m).padStart(2, '0'); };

feature({
  id: 'clocks231',
  secrets: [['midnight', 'Midnight']],
  init(k) {
    const r = k.plan.byId.G231_233, cab = k.plan.byId.G234e; if (!r) { this.off = true; return; }
    const y = r.y; this.r = r; this.y = y;
    const M = {
      walnut: std(0x5a3418), ebony: std(0x1d1612), gilt: std(0xd8b04c, { metalness: 0.7, roughness: 0.35 }), brass: std(0xc79a3a, { metalness: 0.65, roughness: 0.4 }),
      stone: std(0x9a958c), glass: new THREE.MeshStandardMaterial({ color: 0xbfd8e8, transparent: true, opacity: 0.22, roughness: 0.1, depthWrite: false }), hand: std(0x151515),
    };
    const dials = [dialTex('#f4ecd8', '#1a1a1a'), dialTex('#d9d4c8', '#222'), dialTex('#d6b55e', '#2a1a08')].map(t => new THREE.MeshStandardMaterial({ map: t, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.3, roughness: 0.5 }));
    const startH = [9, 11, 10, 8, 11, 9, 10, 11, 7, 10, 9, 11];
    this.clocks = [];
    const zs = [125.5, 128, 130.5, 133, 135.5, 138].map(z => r.z0 + (z - 122.3));
    for (let n = 0; n < 12; n++) {
      const east = n >= 6, x = east ? r.x0 + 10.9 : r.x0 + 3.9, z = zs[n % 6], nx = east ? 1 : -1, master = n === 11;
      const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = nx * Math.PI / 2; k.group.add(g);
      let top = 0.85, dialR = 0.1, dialY, dialZ, style = n % 6;
      if (master) {
        // A tall case clock on the floor: hood, trunk, and a base with a panel that slides.
        box(0.5, 0.5, 0.32, M.walnut, 0, 0.25, 0, g); box(0.4, 1.0, 0.26, M.walnut, 0, 1.0, 0, g); box(0.52, 0.5, 0.34, M.walnut, 0, 1.75, 0, g);
        box(0.56, 0.06, 0.38, M.ebony, 0, 2.03, 0, g); box(0.08, 0.14, 0.08, M.gilt, 0, 2.13, 0, g);
        box(0.14, 0.6, 0.01, M.ebony, 0, 1.0, 0.131, g);
        this.panel = box(0.3, 0.26, 0.02, M.ebony, 0, 0.25, 0.165, g);
        top = 0; dialR = 0.19; dialY = 1.76; dialZ = 0.172;
        k.plan.obstacles.push({ x0: x - 0.2, x1: x + 0.2, z0: z - 0.27, z1: z + 0.27, y0: y, y1: y + 2.1 });
      } else {
        box(0.44, top, 0.44, M.stone, 0, top / 2, 0, g); box(0.5, 0.04, 0.5, M.stone, 0, top + 0.02, 0, g); top += 0.04;
        k.plan.obstacles.push({ x0: x - 0.25, x1: x + 0.25, z0: z - 0.25, z1: z + 0.25, y0: y, y1: y + top + 0.5 });
        if (style === 0) { box(0.28, 0.34, 0.16, n % 2 ? M.ebony : M.walnut, 0, top + 0.17, 0, g); const a = cyl(0.14, 0.14, 0.16, M.walnut, 0, top + 0.34, 0, g); a.rotation.x = Math.PI / 2; a.scale.y = 1; box(0.12, 0.02, 0.03, M.brass, 0, top + 0.5, 0, g); dialY = top + 0.19; dialZ = 0.081; }
        else if (style === 1) { box(0.16, 0.24, 0.13, M.brass, 0, top + 0.12, 0, g); const b = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 8, 0, TAU, 0, Math.PI / 2), M.brass); b.position.y = top + 0.27; g.add(b); for (const s of [-1, 1]) cyl(0.012, 0.012, 0.05, M.brass, s * 0.07, top + 0.26, 0.05, g, 8); dialR = 0.075; dialY = top + 0.13; dialZ = 0.066; }
        else if (style === 2) { const d = cyl(0.13, 0.13, 0.1, M.gilt, 0, top + 0.18, 0, g, 24); d.rotation.x = Math.PI / 2; box(0.3, 0.05, 0.14, M.ebony, 0, top + 0.025, 0, g); dialY = top + 0.18; dialZ = 0.051; }
        else if (style === 3) { const dome = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 10, 0, TAU, 0, Math.PI / 2), M.glass); dome.scale.y = 1.9; dome.position.y = top + 0.04; g.add(dome); cyl(0.16, 0.16, 0.04, M.ebony, 0, top + 0.02, 0, g, 20); const ring = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.008, 6, 24), M.brass); ring.position.y = top + 0.16; g.add(ring); for (const s of [-1, 1]) box(0.01, 0.12, 0.01, M.brass, s * 0.05, top + 0.08, 0, g); dialY = top + 0.16; dialZ = 0.006; dialR = 0.085; }
        else if (style === 4) { box(0.22, 0.44, 0.1, M.gilt, 0, top + 0.22, 0, g); const urn = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), M.gilt); urn.position.y = top + 0.48; g.add(urn); const sw = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.015, 6, 16, Math.PI), M.gilt); sw.position.set(0, top + 0.06, 0.03); sw.rotation.z = Math.PI; g.add(sw); dialY = top + 0.28; dialZ = 0.051; dialR = 0.085; }
        else { box(0.12, 0.16, 0.1, M.brass, 0, top + 0.08, 0, g); box(0.1, 0.12, 0.101, M.glass, 0, top + 0.08, 0, g); const h = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.006, 6, 12, Math.PI), M.brass); h.position.y = top + 0.16; g.add(h); dialR = 0.04; dialY = top + 0.09; dialZ = 0.051; }
      }
      const face = new THREE.Mesh(new THREE.CircleGeometry(dialR, 28), dials[master ? 0 : n % 3]); face.position.set(0, dialY, dialZ); g.add(face);
      const hands = new THREE.Group(); hands.position.set(0, dialY, dialZ + 0.004); g.add(hands);
      const mk = (len, w) => { const gg = new THREE.BoxGeometry(w, len, 0.004); gg.translate(0, len / 2 - len * 0.12, 0); const m = new THREE.Mesh(gg, M.hand); hands.add(m); return m; };
      const hour = mk(dialR * 0.55, dialR * 0.09), minute = mk(dialR * 0.82, dialR * 0.06);
      const t = startH[n] * 60 + 7 + Math.floor(Math.random() * 46);
      this.clocks.push({ n, g, x, z, nx, master, name: master ? 'tall case clock' : CLOCKS[style], hour, minute, t, shown: t, front: { x: x + nx * (master ? 0.65 : 0.62), y, z }, bell: [523, 587, 659, 698, 784, 880, 988, 1047, 1175, 1319, 1397, 196][n] });
    }
    this.startH = startH; this.done = false; this.midT = -1;
    // The key, and the cabinet it opens in the gallery to the south.
    const key = new THREE.Group(); const ring = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.008, 6, 14), M.brass); key.add(ring);
    box(0.008, 0.008, 0.09, M.brass, 0, 0, 0.075, key); box(0.008, 0.025, 0.02, M.brass, 0, -0.014, 0.11, key); ring.rotation.x = Math.PI / 2;
    this.key = key; this.keyG = key; key.visible = false; k.group.add(key);
    const mc = this.clocks[11]; this.keyAt = { x: mc.x + mc.nx * 0.45, y, z: mc.z };
    if (cab) {
      const cx = cab.x1 - 0.2; let cz = cab.z0 + 6.8;
      for (const dz of [0, -1, 1, -2, 2, -3, -4]) { const zz = cab.z0 + 6.8 + dz; if (clear(k.plan, cab, cx - 0.35, zz, 0.32, 1.2) && bareWall(k.museum, cab, cab.x1, zz, -1, 0, 0.5)) { cz = zz; break; } }
      const cg = new THREE.Group(); cg.position.set(cx, y, cz); cg.rotation.y = -Math.PI / 2; k.group.add(cg);
      box(0.6, 0.9, 0.36, M.walnut, 0, 0.45, 0, cg); box(0.64, 0.04, 0.4, M.ebony, 0, 0.92, 0, cg);
      box(0.5, 0.7, 0.02, M.ebony, 0, 0.47, 0.165, cg);
      const door = new THREE.Group(); door.position.set(-0.25, 0.47, 0.19); cg.add(door); box(0.5, 0.72, 0.03, M.walnut, 0.25, 0, 0, door); box(0.03, 0.05, 0.02, M.brass, 0.44, 0, 0.02, door);
      const chips = new THREE.Group(); cg.add(chips); chips.visible = !store.get('feature-clock-cabinet', false);
      for (let i = 0; i < 5; i++) cyl(0.035, 0.035, 0.012, [std(0xc0392b), std(0x2c3e8f), std(0xe8e8e8)][i % 3], -0.08 + (i % 2) * 0.04, 0.2 + i * 0.013, 0.02, chips, 16);
      this.cab = { g: cg, door, chips, at: { x: cx - 0.6, y, z: cz }, open: 0, opening: false, room: cab.id };
      k.plan.obstacles.push({ x0: cx - 0.2, x1: cx + 0.2, z0: cz - 0.32, z1: cz + 0.32, y0: y, y1: y + 0.95 });
    }
  },
  active(k) { return !this.off && (k.inRoom(['G231_233', 'G234e'], 2) || this.midT >= 0); },
  update(dt, k) {
    for (const c of this.clocks) {
      if (c.shown < c.t) c.shown = Math.min(c.t, c.shown + dt * 240);
      c.hour.rotation.z = -(c.shown / 720) * TAU; c.minute.rotation.z = -((c.shown % 60) / 60) * TAU;
    }
    if (k.inRoom('G231_233')) k.once('clocks', 'Twelve clocks, and not one of them agrees with another.', 3.5);
    if (this.midT >= 0) {
      this.midT += dt;
      const mc = this.clocks[11];
      if (this.midT > 3.5 && this.panel.position.x < 0.28) this.panel.position.x = Math.min(0.28, this.panel.position.x + dt * 0.3);
      if (this.midT > 4.6) {
        if (!this.key.visible) { this.key.visible = true; this.kf = 0.3; this.key.position.set(mc.x + mc.nx * 0.2, this.y + 0.3, mc.z); }
        if (this.kf > 0) { this.kf = Math.max(0, this.kf - dt * 1.4); const s = 1 - this.kf / 0.3; this.key.position.set(mc.x + mc.nx * (0.2 + 0.25 * s), this.y + 0.015 + this.kf, mc.z); this.key.rotation.y += dt * 8; }
        else if (this.midT > 6 && this.midT < 50) { this.midT = 50; if (k.find('midnight')) k.callout('MIDNIGHT'); k.say('Midnight, everywhere at once. A panel in the tall clock has slid open, and a small brass key has dropped out.', 5); }
      }
    }
    if (this.key.visible && this.key.parent === k.group && !this.kf && k.close(this.keyAt, 0.4, 1)) {
      if (k.carry.list.length >= k.carry.max) k.once('key-full', 'A small brass key, but your hands are full.', 3);
      else if (k.carry.take({ id: 'clockkey', mesh: this.key, lift: 0.02 })) this.key.rotation.set(0, 0, 0), k.say('A small brass key. Something in the gallery to the south is locked.', 4);
    }
    const C = this.cab;
    if (C && C.opening && C.open < 1) { C.open = Math.min(1, C.open + dt * 1.5); C.door.rotation.y = -C.open * 1.9; if (C.open >= 1) C.chips.visible = false; }
  },
  near(v, k) {
    if (this.off) return null;
    const C = this.cab;
    if (C && !C.opening && k.close(C.at, 0.9)) {
      if (!k.carry.has('clockkey')) return { verb: 'LOCKED', hint: 'A little cabinet, locked. The key must be somewhere.', act: () => k.say('Locked. The key must be somewhere.', 2.5) };
      return { verb: 'UNLOCK', hint: 'A little cabinet with a brass keyhole. E to try the key.', act: () => {
        C.opening = true; k.carry.drop('clockkey');
        if (!store.get('feature-clock-cabinet', false)) { store.set('feature-clock-cabinet', true); k.chips(150); k.callout('+150 CHIPS'); k.say('The key turns. Inside: a little stack of chips, left by whoever wound the clocks.', 4); }
        else k.say('The key turns. The cabinet is empty: you had the chips on an earlier night.', 3.5);
      } };
    }
    if (this.done || !k.inRoom('G231_233')) return null;
    let best = null, bd = 0.8;
    for (const c of this.clocks) { const d = Math.hypot(k.pos.x - c.front.x, k.pos.z - c.front.z); if (d < bd) { bd = d; best = c; } }
    if (!best) return null;
    const c = best;
    return { verb: 'SET', hint: `A ${c.name}. It says ${fmt(c.t)}. E to put it on an hour.`, act: () => {
      c.t = c.t % 60 ? Math.ceil(c.t / 60) * 60 : c.t + 60; if (c.t > 720) { c.t -= 720; c.shown -= 720; }
      k.synth.note(2400, 0.05, { type: 'square', vol: 0.025 }); k.synth.note(1800, 0.05, { type: 'square', vol: 0.02, at: 0.09 });
      if (c.t % 720 === 0) k.synth.note(c.bell, 1.2, { type: 'sine', vol: 0.05 });
      if (this.clocks.every(q => q.t % 720 === 0)) this.midnight(k);
    } };
  },
  midnight(k) {
    this.done = true; this.midT = 0;
    this.clocks.forEach((c, i) => { if (!c.master) for (let s = 0; s < 3; s++) k.synth.note(c.bell, 1.4, { type: 'sine', vol: 0.03, at: 0.3 + i * 0.27 + s * 0.6 }); });
    for (let s = 0; s < 12; s++) { k.synth.note(196, 2.2, { type: 'sine', vol: 0.07, at: 1.2 + s * 0.9 }); k.synth.note(392 * 1.2, 1.2, { type: 'sine', vol: 0.02, at: 1.2 + s * 0.9 }); }
  },
  spots() { return this.off ? [] : [{ kind: 'secret', id: 'midnight', name: 'Midnight', x: this.clocks[11].x, y: this.y, z: this.clocks[11].z }].concat(this.cab ? [{ kind: 'secret', id: 'midnight', name: 'The clock cabinet', ...this.cab.at }] : []); },
  reset(k) {
    if (this.off) return;
    this.clocks.forEach((c, i) => { c.t = c.shown = this.startH[i] * 60 + 7 + Math.floor(Math.random() * 46); });
    this.done = false; this.midT = -1; this.panel.position.x = 0; this.key.visible = false; this.kf = 0; if (this.key.parent !== k.group) k.group.add(this.key);
    if (this.cab) { this.cab.opening = false; this.cab.open = 0; this.cab.door.rotation.y = 0; }
  },
});

// ================================================================ the lion hunt
// Lions in the round, modelled facing +z; `pose` is how it sits, `s` its size.
function lionGeo(pose, s, colours, ball) {
  const c = new Clay([-0.22 * s, -0.01, -0.36 * s], [0.22 * s, 0.52 * s, 0.38 * s], 0.012 * s), S = (x, y, z) => [x * s, y * s, z * s], R = v => Array.isArray(v) ? v.map(q => q * s) : v * s;
  const mane = (h, z) => { c.blob(S(0, h, z), R([0.105, 0.11, 0.08]), { k: 0.03 * s }); for (let i = 0; i < 11; i++) { const a = (i / 11 - 0.5) * 4.6; c.blob(S(Math.sin(a) * 0.105, h + Math.cos(a) * 0.1, z - 0.01), R(0.042), { k: 0.025 * s }); } c.blob(S(0, h, z + 0.06), R(0.062)); c.blob(S(0, h - 0.025, z + 0.11), R([0.034, 0.03, 0.036])); c.blob(S(0, h - 0.002, z + 0.145), R(0.014), { k: 0.01 * s }); for (const e of [-1, 1]) { c.blob(S(e * 0.025, h + 0.02, z + 0.115), R(0.009), { cut: true, k: 0.004 * s }); c.blob(S(e * 0.05, h + 0.07, z + 0.05), R(0.018)); } };
  if (pose === 'mask') {
    c.blob(S(0, 0.25, -0.02), R([0.17, 0.17, 0.05]), { k: 0.03 * s });
    for (let i = 0; i < 14; i++) { const a = i / 14 * TAU; c.blob(S(Math.sin(a) * 0.15, 0.25 + Math.cos(a) * 0.15, -0.01), R(0.045), { k: 0.03 * s }); }
    c.blob(S(0, 0.26, 0.04), R([0.085, 0.095, 0.06])); c.blob(S(0, 0.2, 0.1), R([0.045, 0.038, 0.045]));
    c.blob(S(0, 0.165, 0.13), R([0.03, 0.014, 0.04]), { cut: true, k: 0.004 * s });
    for (const e of [-1, 1]) c.blob(S(e * 0.035, 0.29, 0.095), R(0.012), { cut: true, k: 0.004 * s });
    c.blob(S(0, 0.235, 0.14), R(0.016));
  } else if (pose === 'lie') {
    c.blob(S(0, 0.1, -0.03), R([0.1, 0.08, 0.2])); c.blob(S(0, 0.12, 0.1), R([0.095, 0.09, 0.09]));
    for (const e of [-1, 1]) { c.limb(S(e * 0.05, 0.04, 0.12), S(e * 0.05, 0.025, 0.3), R(0.028), R(0.026)); c.blob(S(e * 0.075, 0.08, -0.14), R([0.045, 0.07, 0.09])); }
    c.limb(S(0, 0.07, -0.22), S(0.1, 0.02, -0.32), R(0.012)); c.blob(S(0.11, 0.022, -0.33), R(0.022));
    mane(0.2, 0.16);
  } else if (pose === 'stand') {
    c.blob(S(0, 0.22, 0), R([0.085, 0.08, 0.19]));
    for (const e of [-1, 1]) for (const z of [-0.13, 0.12]) c.limb(S(e * 0.055, 0.2, z), S(e * 0.055, 0.015, z + 0.02), R(0.03), R(0.024));
    c.limb(S(0, 0.24, -0.18), S(0, 0.32, -0.33), R(0.012)); c.blob(S(0, 0.33, -0.34), R(0.022));
    mane(0.31, 0.15);
  } else {                                // sitting
    c.blob(S(0, 0.1, -0.08), R([0.1, 0.1, 0.11])); c.blob(S(0, 0.22, 0.03), R([0.085, 0.13, 0.08]));
    for (const e of [-1, 1]) { c.limb(S(e * 0.05, 0.22, 0.07), S(e * 0.05, 0.02, 0.1), R(0.027), R(0.025)); c.blob(S(e * 0.05, 0.015, 0.12), R([0.028, 0.016, 0.035])); }
    c.limb(S(0.08, 0.03, -0.14), S(0.12, 0.02, 0.06), R(0.012));
    mane(0.36, 0.06);
    if (ball) c.blob(S(-0.09, 0.05, 0.2), R(0.05));
  }
  return c.mesh({ hi: colours[0], lo: colours[1], snow: 0, reach: 0.07 * s });
}

const LIONS = [
  { room: 'G142', pose: 'lie', s: 1.1, col: [0xdcd5c6, 0x4a463f], plinth: 0x8c877d, name: 'a stone lion, couchant' },
  { room: 'G130', pose: 'stand', s: 1, col: [0xd0a05c, 0x35210f], plinth: 0x2a2724, name: 'a bronze lion' },
  { room: 'G150', pose: 'sit', s: 0.95, col: [0xffe39a, 0x6b4a10], plinth: 0x30261c, name: 'a gilt lion' },
  { room: 'G105', pose: 'sit', s: 0.7, col: [0xc9a06e, 0x3b2614], wall: 'corbel', name: 'a lion carved on a corbel' },
  { room: 'G222', pose: 'mask', s: 1, col: [0xd8d2c4, 0x3f3b35], wall: 'fountain', name: 'a lion-head fountain' },
  { room: 'G227', pose: 'lie', s: 0.75, col: [0xf3b14c, 0x7a4510], toy: true, name: 'a toy lion' },
  { room: 'G272', pose: 'lie', s: 0.9, col: [0xf6f3ec, 0x6e6a62], plinth: 0x5b5249, name: 'a marble lion' },
  { room: 'G283', pose: 'sit', s: 0.9, col: [0x8fb39b, 0x1f3a2c], plinth: 0x2b2b2b, ball: true, name: 'a lion with its paw on a ball' },
  { room: 'G394', pose: 'lie', s: 0.6, col: [0x70757c, 0x141618], door: true, name: 'an iron doorstop lion' },
  { room: 'G397', pose: 'stand', s: 0.85, col: [0xe08a5e, 0x5a2a18], plinth: 0xd8d0c0, name: 'a terracotta lion' },
];

feature({
  id: 'lionhunt',
  secrets: [['lionhunt', 'The lion hunt']],
  init(k) {
    const P = k.plan;
    this.set = k.collect('lions', 12, 'lionhunt');
    this.started = store.get('feature-lions-started', false);
    this.art = k.museum.arts.find(a => a.room === 'G220' && /Lion Hunt/i.test(a.work.t)) || k.museum.arts.find(a => /^The Lion Hunt|Lion Hunt/i.test(a.work.t));
    this.lions = [];
    LIONS.forEach((L, i) => {
      const r = P.byId[L.room]; if (!r) return;
      const y = r.y, g = new THREE.Group(), mat = cast({ metalness: L.col[0] === 0xd0a05c || L.col[0] === 0xffe39a ? 0.5 : 0.05, roughness: L.toy ? 0.95 : 0.55, emissiveIntensity: 0.5 });
      let at = null, yaw = 0, wall = null;
      if (L.toy) {           // under a bench, where a child dropped it
        const b = P.obstacles.find(o => o.bench && o.x0 > r.x0 && o.x1 < r.x1 && o.z0 > r.z0 && o.z1 < r.z1 && Math.abs(o.y0 - (y + 0.37)) < 0.1);
        if (b) { at = { x: (b.x0 + b.x1) / 2 + 0.3, z: (b.z0 + b.z1) / 2 }; yaw = 0.6; }
      }
      if (!at && L.door) {   // propping a door: beside the jamb, against the wall
        for (const d of P.doorsOf(r.id)) {
          const alongX = d.x1 - d.x0 > d.z1 - d.z0, cands = alongX ? [[d.x0 - 0.4, d.z0], [d.x1 + 0.4, d.z0]] : [[d.x0, d.z0 - 0.4], [d.x0, d.z1 + 0.4]];
          for (const [x0, z0] of cands) { const x = Math.max(r.x0 + 0.25, Math.min(r.x1 - 0.25, x0)), z = Math.max(r.z0 + 0.25, Math.min(r.z1 - 0.25, z0)); if (clear(P, r, x, z, 0.22, 0.3)) { at = { x, z }; yaw = Math.atan2((r.x0 + r.x1) / 2 - x, (r.z0 + r.z1) / 2 - z); break; } }
          if (at) break;
        }
      }
      if (!at && L.wall) {   // a bare stretch of wall
        const walls = [[r.x0, 0, 1, 0], [r.x1, 0, -1, 0], [0, r.z0, 0, 1], [0, r.z1, 0, -1]];
        outer: for (const [wx, wz, nx, nz] of walls) for (let t = 0.2; t <= 0.8; t += 0.1) {
          const x = nx ? wx + nx * 0.3 : r.x0 + (r.x1 - r.x0) * t, z = nz ? wz + nz * 0.3 : r.z0 + (r.z1 - r.z0) * t;
          if (clear(P, r, x, z, 0.3) && bareWall(k.museum, r, nx ? wx : x, nz ? wz : z, nx, nz, 0.6)) { at = { x, z }; wall = { x: nx ? wx : x, z: nz ? wz : z, nx, nz }; yaw = Math.atan2(nx, nz); break outer; }
        }
      }
      if (!at) {             // a corner, looking into the room
        const cs = [[r.x0 + 0.75, r.z0 + 0.75], [r.x1 - 0.75, r.z1 - 0.75], [r.x1 - 0.75, r.z0 + 0.75], [r.x0 + 0.75, r.z1 - 0.75]];
        for (const [x, z] of cs) if (clear(P, r, x, z, 0.4)) { at = { x, z }; break; }
        if (!at) for (let t = 0; t < 40 && !at; t++) { const x = r.x0 + 1 + Math.random() * (r.x1 - r.x0 - 2), z = r.z0 + 1 + Math.random() * (r.z1 - r.z0 - 2); if (clear(P, r, x, z, 0.4)) at = { x, z }; }
        if (!at) at = { x: r.x0 + 0.75, z: r.z0 + 0.75 };
        yaw = Math.atan2((r.x0 + r.x1) / 2 - at.x, (r.z0 + r.z1) / 2 - at.z);
      }
      const lion = new THREE.Mesh(lionGeo(L.pose, L.s, L.col, L.ball), mat); g.add(lion);
      let h = 0;
      if (L.plinth) { const pm = std(L.plinth); const ph = L.pose === 'lie' ? 0.5 : 0.35; box(0.4 * L.s + 0.08, ph, 0.6 * L.s + 0.08, pm, 0, ph / 2, 0, g); lion.position.y = ph; h = ph; }
      if (L.wall === 'corbel') { const wm = std(0x7d6a52); box(0.36, 0.06, 0.34, wm, 0, 1.15, -0.06, g); const br = box(0.18, 0.3, 0.26, wm, 0, 0.98, -0.12, g); br.rotation.x = 0.3; lion.position.set(0, 1.18, -0.08); g.position.set(wall.x + wall.nx * 0.17, y, wall.z + wall.nz * 0.17); }
      else if (L.wall === 'fountain') { lion.position.set(0, 0.6, -0.04); const bm = std(0xb9b2a4); box(0.6, 0.28, 0.3, bm, 0, 0.14, 0.12, g); box(0.5, 0.02, 0.22, std(0x2f4f5c, { roughness: 0.1, metalness: 0.3 }), 0, 0.27, 0.12, g); const spout = cyl(0.008, 0.008, 0.3, new THREE.MeshStandardMaterial({ color: 0xbfe0ff, transparent: true, opacity: 0.5 }), 0, 0.43, 0.15, g, 6); spout.rotation.x = 0.15; g.position.set(wall.x + wall.nx * 0.05, y, wall.z + wall.nz * 0.05); P.obstacles.push({ x0: g.position.x - 0.32, x1: g.position.x + 0.32, z0: g.position.z - 0.32, z1: g.position.z + 0.32, y0: y, y1: y + 0.3 }); }
      else { g.position.set(at.x, y, at.z); if (!L.toy) P.obstacles.push({ x0: at.x - 0.3 * L.s - 0.06, x1: at.x + 0.3 * L.s + 0.06, z0: at.z - 0.3 * L.s - 0.06, z1: at.z + 0.3 * L.s + 0.06, y0: y, y1: y + h + 0.5 * L.s }); }
      g.rotation.y = yaw; k.group.add(g);
      const p = { x: g.position.x + (wall ? wall.nx * 0.4 : 0), y, z: g.position.z + (wall ? wall.nz * 0.4 : 0) };
      this.lions.push({ id: 'L' + (i + 1), at: p, r: wall ? 1.1 : 0.9 + 0.3 * L.s, name: L.name, room: L.room, g });
    });
    // And the two bronze lions out on the steps, which everyone forgets are lions.
    (P.lions || []).forEach((l, i) => this.lions.push({ id: 'out' + (i + 1), at: { x: l.x, y: 0, z: l.z }, r: 3.4, dy: 4, name: 'one of the lions on the steps', outside: true }));
    this.check = 0;
  },
  onLook(art, k) {
    if (!this.art || !art || art.work !== this.art.work) return;
    if (this.set.done) { k.say('All twelve lions found. The hunt is over.', 3); return; }
    if (!this.started) { this.started = true; store.set('feature-lions-started', true); }
    k.say(this.set.count ? `Twelve lions are loose in the building. You have found ${this.set.count}.` : 'Twelve lions are loose in the building.', 4);
  },
  update(dt, k) {
    if (this.set.done) return;
    this.check -= dt; if (this.check > 0) return; this.check = 0.15;
    for (const L of this.lions) {
      if (!k.close(L.at, L.r, L.dy || 1.2)) continue;
      if (!this.started) { k.once('lion-unstarted', `That is ${L.name}. Somebody upstairs, in Gallery 220, is hunting lions.`, 4); return; }
      const n = this.set.add(L.id); if (!n) continue;
      k.callout(`LION ${n} / 12`);
      k.synth.noise(0.8, { vol: 0.06, lp: 380 }); k.synth.note(68, 0.9, { type: 'sawtooth', vol: 0.03, attack: 0.18 }); k.synth.note(52, 1.1, { type: 'sawtooth', vol: 0.025, attack: 0.3, at: 0.2 });
      if (n >= 12) { if (k.find('lionhunt')) k.chips(120); k.say('Twelve lions. The hunt is over, and nobody was hurt.', 4.5); }
      else k.say(`${L.name[0].toUpperCase() + L.name.slice(1)}. ${12 - n} still loose.`, 3);
      return;
    }
  },
  spots() { return this.lions.map((L, i) => ({ kind: 'secret', id: 'lionhunt', name: 'Lion ' + (i + 1) + ': ' + L.name, x: L.at.x, y: L.at.y, z: L.at.z })); },
});
