// The Night Circuit: two laps of the building against three other toys.

import * as THREE from 'three';
import { buildRoute, sampleRoute, groundAt, GRAVITY } from './plan.js';
import * as TX from './textures.js';
import { buildCar, buildDrone } from './vehicles.js';

export const LAPS = 2;
const RIVALS = [
  { name: 'Blue', colour: 0x1f5fd0, skill: 0.8, lane: -0.55 },
  { name: 'Green', colour: 0x25a244, skill: 0.87, lane: 0.55 },
  { name: 'Yellow', colour: 0xe0b020, skill: 0.94, lane: -0.2 },
];

export class Race {
  constructor(scene, plan) {
    this.scene = scene;
    this.plan = plan;
    this.src = buildRoute(plan);
    this.route = sampleRoute(this.src, 0.5);
    this.fy = plan.lineY || 0;         // the circuit keeps to one level: this is its floor
    this.group = new THREE.Group();
    this.group.visible = false;
    scene.add(this.group);
    this.active = false;
    this.state = 'idle';
    this.gates = [];
    this.bots = [];
    this.best = {};
    try { this.best = JSON.parse(localStorage.getItem('after-hours.best') || '{}'); } catch { /* no storage */ }
    this._buildGates();
    this._paintTrack();
    this.off = false; this.offT = 0; this.sOn = 0; this.warped = false;
  }

  // The track itself, drawn on the floor all the way round.
  _paintTrack() {
    const pts = this.route.pts, n = pts.length, half = 1.35, pos = [], uv = [], idx = [];
    for (let i = 0; i <= n; i++) {
      const p = pts[i % n], nx = p.tz, nz = -p.tx, v = i * this.route.step / 2.2;
      pos.push(p.x + nx * half, this.fy + 0.013, p.z + nz * half, p.x - nx * half, this.fy + 0.013, p.z - nz * half);
      uv.push(0, v, 1, v);
      if (i < n) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    this.trackTex = TX.raceLine();
    const mesh = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ map: this.trackTex, color: new THREE.Color(0.15, 0.58, 0.68), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }));
    mesh.renderOrder = 6; mesh.frustumCulled = false;
    this.group.add(mesh);
  }

  at(s) {
    const r = this.route, n = r.pts.length;
    const f = ((s % r.length) + r.length) % r.length / r.step;
    const i = Math.floor(f) % n, j = (i + 1) % n, t = f - Math.floor(f);
    const a = r.pts[i], b = r.pts[j];
    return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t, tx: a.tx, tz: a.tz, k: a.k };
  }

  _buildGates() {
    const cone = new THREE.ConeGeometry(0.075, 0.24, 12);
    const base = new THREE.BoxGeometry(0.2, 0.014, 0.2);
    this.src.forEach((p, i) => {
      if (!p.gate) return;
      const s = this.route.gateS[i], q = this.at(s);
      const g = { i: this.gates.length, s, x: p.x, z: p.z, y: p.y, tx: q.tx, tz: q.tz, half: p.gate, start: !!p.start };
      const grp = new THREE.Group();
      grp.position.set(p.x, this.fy, p.z);
      grp.rotation.y = Math.atan2(q.tx, q.tz);
      const mat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      // On the floor: two cones and a line of light between them.
      const floor = new THREE.Group();
      for (const sgn of [-1, 1]) {
        const c = new THREE.Mesh(cone, mat); c.position.set(sgn * p.gate, 0.134, 0);
        const b = new THREE.Mesh(base, mat); b.position.set(sgn * p.gate, 0.007, 0);
        floor.add(c, b);
      }
      const strip = new THREE.Mesh(new THREE.PlaneGeometry(p.gate * 2, 0.07), mat);
      strip.rotation.x = -Math.PI / 2; strip.position.y = 0.012;
      floor.add(strip);
      // In the air: a hoop.
      g.r = Math.min(2.2, p.gate * 0.82, p.y - this.fy - 0.15);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(g.r, 0.035, 8, 48), mat);
      ring.position.y = p.y - this.fy;
      grp.add(floor, ring);
      g.floor = floor; g.ring = ring; g.mat = mat; g.group = grp;
      this.group.add(grp);
      this.gates.push(g);
    });
    this.startGate = this.gates.findIndex(g => g.start);
  }

  begin(player, sound) {
    this.player = player;
    this.sound = sound;
    this.flying = player.kind === 'drone';
    this.active = true;
    this.group.visible = true;
    this.state = 'countdown';
    this.clock = -3.6;
    this.lastBeep = 4;
    this.lap = 1;
    this.next = (this.startGate + 1) % this.gates.length;
    this.lapTimes = [];
    this.lapStart = 0;
    this.finished = false;
    this.place = 1;
    for (const b of this.bots) this.group.remove(b.model.group, b.model.shadow);
    const s0 = this.gates[this.startGate].s;
    this.bots = RIVALS.map((r, i) => {
      const model = this.flying ? buildDrone(r.colour) : buildCar(r.colour);
      model.group.remove(model.lamp, model.lamp.target);        // rivals do not need real lights
      this.group.add(model.group, model.shadow);
      return { ...r, model, s: s0 - 1.3 - i * 1.15, v: 0, lapsDone: 0, done: false, spin: 0, y: this.fy, vy: 0, tilt: 0 };
    });
    for (const g of this.gates) { g.floor.visible = !this.flying; g.ring.visible = this.flying; }
    // Player lines up at the back: you earn it.
    const grid = this.at(s0 - 1.3 - RIVALS.length * 1.15);
    const yaw = Math.atan2(grid.tx, grid.tz);
    if (this.flying) player.place(grid.x + grid.tz * 0.3, grid.z - grid.tx * 0.3, yaw, this.fy + 1.2);
    else player.place(grid.x + grid.tz * 0.3, grid.z - grid.tx * 0.3, yaw, this.fy);
    this.sP = this.sOn = s0 - 1.3 - RIVALS.length * 1.15;
    this.off = false; this.offT = 0;
    this.prev = player.pos.clone();
    this.lastGate = this.startGate;
    this._placeBots(0);
    this._paintGates(0);
  }

  end() { this.active = false; this.group.visible = false; this.state = 'idle'; }

  get locked() { return this.state === 'countdown'; }

  update(dt, t) {
    if (!this.active) return;
    const p = this.player;
    this.clock += dt;
    if (this.state === 'countdown') {
      const n = Math.ceil(-this.clock);
      if (n !== this.lastBeep && n <= 3 && n >= 1) { this.lastBeep = n; this.sound.beep(440, 0.16); }
      if (this.clock >= 0) { this.state = 'go'; this.sound.beep(880, 0.5, 0.11); this.lapStart = 0; }
    }
    if (this.state !== 'countdown') {
      this._bots(dt);
      if (!this.finished) { this._player(); this._stray(dt); }
    }
    if (!this.calm) this.trackTex.offset.y = -(t * 0.5) % 1;        // the arrows run the way you should be going
    this._placeBots(dt);
    this._paintGates(t);
    // Standing: how far everyone has come.
    const mine = (this.lap - 1) * this.route.length + this._progress();
    this.place = 1 + this.bots.filter(b => b.s - this.gates[this.startGate].s > mine).length;
    if (this.finished) this.place = this.finalPlace;
    this.prev.copy(p.pos);
  }

  // Off the track? After a few seconds of it, you are put back where you left it.
  _stray(dt) {
    const p = this.player.pos, q = this.at(this.sP), d = Math.hypot(q.x - p.x, q.z - p.z);
    this.off = d > (this.flying ? 4.5 : 3.2);
    if (!this.off) { this.offT = 0; this.sOn = this.sP; return; }
    this.offT += dt;
    if (this.offT > 4.5) {
      const b = this.at(this.sOn), yaw = Math.atan2(b.tx, b.tz);
      if (this.flying) this.player.place(b.x, b.z, yaw, b.y); else this.player.place(b.x, b.z, yaw, this.fy);
      this.prev.copy(this.player.pos); this.sP = this.sOn; this.off = false; this.offT = 0; this.warped = true;
    }
  }

  // Distance round the lap, measured from the start line.
  _progress() {
    const r = this.route, n = r.pts.length, p = this.player.pos;
    let bi = Math.round(this.sP / r.step), bd = Infinity;
    const c = bi;
    for (let k = -30; k <= 60; k++) {
      const i = ((c + k) % n + n) % n, q = r.pts[i];
      const d = (q.x - p.x) ** 2 + (q.z - p.z) ** 2;
      if (d < bd) { bd = d; bi = c + k; }
    }
    this.sP = bi * r.step;
    const s0 = this.gates[this.startGate].s;
    let rel = ((this.sP - s0) % r.length + r.length) % r.length;
    // Just short of the line on the grid counts as behind it, not a lap ahead.
    const expect = ((this.gates[this.next].s - s0) % r.length + r.length) % r.length || r.length;
    if (rel > expect + r.length * 0.5) rel -= r.length;
    return rel;
  }

  _player() {
    const g = this.gates[this.next], p = this.player.pos, q = this.prev;
    const d0 = (q.x - g.x) * g.tx + (q.z - g.z) * g.tz, d1 = (p.x - g.x) * g.tx + (p.z - g.z) * g.tz;
    if (d0 < 0 && d1 >= 0) {
      const lat = Math.abs((p.x - g.x) * g.tz - (p.z - g.z) * g.tx);
      const okY = !this.flying || Math.abs(p.y - g.y) < g.r + 1.2;     // generous: anywhere a doorway lets you through counts
      if (lat < g.half + 0.5 && okY) {
        this.lastGate = this.next;
        if (g.start) {
          const now = this.clock;
          this.lapTimes.push(now - this.lapStart);
          this.lapStart = now;
          if (this.lap >= LAPS) return this._finish();
          this.lap++;
          this.sound.lap();
        } else this.sound.gate();
        this.next = (this.next + 1) % this.gates.length;
      }
    }
  }

  _finish() {
    this.finished = true;
    this.state = 'done';
    this.total = this.clock;
    this.finalPlace = 1 + this.bots.filter(b => b.done).length;
    const key = this.player.kind;
    this.record = !this.best[key] || this.total < this.best[key];
    if (this.record) { this.best[key] = this.total; try { localStorage.setItem('after-hours.best', JSON.stringify(this.best)); } catch { /* fine */ } }
    this.sound.finish();
  }

  // Put the player back at the last gate they cleared, pointing the right way.
  reset() {
    const g = this.gates[this.lastGate];
    const yaw = Math.atan2(g.tx, g.tz);
    if (this.flying) this.player.place(g.x, g.z, yaw, g.y); else this.player.place(g.x, g.z, yaw, this.fy);
    this.prev.copy(this.player.pos);
    this.sP = g.s;
  }

  _bots(dt) {
    const top = this.flying ? 11.2 : 10.8, grip = this.flying ? 7.5 : 6.2;
    const s0 = this.gates[this.startGate].s;
    const mine = (this.lap - 1) * this.route.length + (this.finished ? this.route.length : this._progress());
    for (const b of this.bots) {
      // Look ahead as far as it would take to brake, and take the tightest corner in view.
      let k = 0;
      const look = 2 + b.v * 0.9;
      for (let d = 0; d <= look; d += 1) k = Math.max(k, this.at(b.s + d).k);
      // A toy race should stay a race: whoever is well clear eases off, whoever is well back digs in.
      const gap = (b.s - s0) - mine;
      const band = gap > 22 ? 0.93 : gap < -22 ? 1.05 : 1;
      const vt = Math.min(top, Math.sqrt(grip / Math.max(k, 0.004))) * (b.done ? 0.45 : b.skill * band);
      b.v += Math.max(-13 * dt, Math.min(7.5 * dt, vt - b.v));
      b.s += b.v * dt;
      if (!b.done && b.s - s0 >= LAPS * this.route.length) b.done = true;
    }
  }

  _placeBots(dt) {
    for (const b of this.bots) {
      const q = this.at(b.s), g = b.model.group;
      const x = q.x + q.tz * b.lane, z = q.z - q.tx * b.lane;
      if (!this.flying && dt > 0) {
        // Rivals are on rails side to side, but they leave the ground like you do.
        const gnd = groundAt(this.plan, x, z, b.y, 0.5);
        const yb = b.y + b.vy * dt - 0.5 * GRAVITY * dt * dt;
        if (yb > gnd + 0.004) { b.y = yb; b.vy -= GRAVITY * dt; b.air = true; }
        else { b.vy = b.air ? 0 : Math.max(-6, Math.min(b.v * 0.5, (gnd - b.y) / dt)); b.y = gnd; b.air = false; }
        const want = -Math.atan2(b.vy, Math.max(2, b.v)) * (b.air ? 0.75 : 1);
        b.tilt += (want - b.tilt) * Math.min(1, dt * (b.air ? 5 : 16));
      }
      g.position.set(x, this.flying ? q.y + b.lane * 0.3 : b.y, z);
      const yaw = Math.atan2(q.tx, q.tz);
      let d = yaw - g.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d));
      g.rotation.y += d * Math.min(1, dt * 12 || 1);
      if (this.flying) {
        b.spin += dt * 70;
        for (const p of b.model.props) p.blade.rotation.y = b.spin * p.dir;
        b.model.body.rotation.x = 0.1 + b.v * 0.02;
        b.model.body.rotation.z = -d * 2;
        b.model.shadow.position.set(x, this.fy + 0.006, z);
      } else {
        for (const w of b.model.wheels) { w.spin.rotation.x += (b.v / w.r) * dt; if (w.front) w.pivot.rotation.y = d * 3; }
        b.model.aerial.rotation.x = -0.1 - b.v * 0.02;
        g.rotation.x = b.tilt;
        const gnd = groundAt(this.plan, x, z, b.y + 0.05);
        b.model.shadow.position.set(x, gnd + 0.006, z); b.model.shadow.rotation.y = g.rotation.y;
      }
      b.x = x; b.z = z; if (this.flying) b.y = g.position.y;
    }
  }

  _paintGates(t) {
    const pulse = this.calm ? 1 : 0.75 + 0.25 * Math.sin(t * 7);
    this.gates.forEach((g, i) => {
      const d = (i - this.next + this.gates.length) % this.gates.length;
      if (this.finished) g.mat.color.setRGB(0.25, 0.2, 0.1);
      else if (d === 0) g.mat.color.setRGB(0.15 * pulse, 1.45 * pulse, 1.7 * pulse);     // next: bright
      else if (d === 1) g.mat.color.setRGB(0.1, 0.5, 0.6);
      else g.mat.color.setRGB(0.9, 0.3, 0.04);                                          // the rest: cone orange
    });
  }

  // Which way the next gate lies, as an angle off the nose (for the HUD arrow).
  bearing() {
    // On the track the arrow points at the next gate; off it, at the way back.
    const g = this.off ? this.at(this.sOn + 2) : this.gates[this.next], p = this.player;
    const dx = g.x - p.pos.x, dz = g.z - p.pos.z;
    const a = Math.atan2(dx, dz) - p.yaw;
    return { angle: -Math.atan2(Math.sin(a), Math.cos(a)), dist: Math.hypot(dx, dz), dy: g.y - p.pos.y, off: this.off, left: Math.max(0, 4.5 - this.offT) };
  }
}

export function clockText(sec) {
  if (!(sec >= 0)) return '0:00.00';
  const m = Math.floor(sec / 60), s = sec - m * 60;
  return `${m}:${s < 10 ? '0' : ''}${s.toFixed(2)}`;
}
