// The Night Circuit: two laps of the building against three other toys.
//
// The course is laid by src/course.js through real doorways and round everything solid. The rivals
// are toys like yours (the same Car and Drone, so the same walls, doorways, ramps and floors stop
// them): each one steers for a point a little way along the line, in a lane of its own, slows for
// the bends it can see coming, and if it ends up nose-in to something backs off and comes round.
// Stuck for good, it is put back on the line where it left it, as you are.

import * as THREE from 'three';
import { confine, wallAt } from './plan.js';
import { buildCourse } from './course.js';
import * as TX from './textures.js';
import { Car, Drone } from './vehicles.js';

export const LAPS = 2;
// skill: how hard it pushes (a fraction of what the corners allow); lane: where it likes to be across the track;
// wander and pace: how much it drifts about in that lane, and how often; look: how far ahead it steers for.
const RIVALS = [
  { name: 'Blue', colour: 0x1f5fd0, skill: 0.84, lane: -0.3, wander: 0.22, pace: 0.31, look: 1.1 },
  { name: 'Green', colour: 0x25a244, skill: 0.9, lane: 0.3, wander: 0.16, pace: 0.23, look: 1.25 },
  { name: 'Yellow', colour: 0xe0b020, skill: 0.96, lane: 0, wander: 0.28, pace: 0.41, look: 0.95 },
];
const ang = a => Math.atan2(Math.sin(a), Math.cos(a));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export class Race {
  constructor(scene, plan) {
    this.scene = scene;
    this.plan = plan;
    this.course = buildCourse(plan);
    this.route = { pts: this.course.pts, step: this.course.step, length: this.course.length };
    this.fy = this.course.fy;           // the circuit keeps to one level: this is its floor
    this.group = new THREE.Group();
    this.group.visible = false;
    scene.add(this.group);
    this.active = false;
    this.state = 'idle';
    this.gates = [];
    this.bots = [];
    this.fleet = {};
    this.events = [];
    this.best = {};
    try { this.best = JSON.parse(localStorage.getItem('after-hours.best') || '{}'); } catch { /* no storage */ }
    this._buildGates();
    this._paintTrack();
    this.off = false; this.offT = 0; this.sOn = 0; this.warped = false;
    this._p = { x: 0, y: 0, z: 0 }; this._o = { x: 0, y: 0, z: 0 };
  }

  // The track itself, drawn on the floor all the way round: as wide as the room allows, never up a wall.
  _paintTrack() {
    const pts = this.route.pts, n = pts.length, pos = [], uv = [], idx = [];
    for (let i = 0; i <= n; i++) {
      const p = pts[i % n], nx = p.tz, nz = -p.tx, v = i * this.route.step / 2.2, h = p.hw, y = p.g + 0.014;
      pos.push(p.x + nx * h, y, p.z + nz * h, p.x - nx * h, y, p.z - nz * h);
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
    return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t, g: a.g + (b.g - a.g) * t, tx: a.tx, tz: a.tz, k: a.k, w: Math.min(a.w, b.w) };
  }

  // Where along the line a point is, looked for near where it was last: an unbroken distance, laps and all.
  _locate(x, z, s) {
    const r = this.route, n = r.pts.length, c = Math.round(s / r.step);
    let bi = c, bd = Infinity;
    for (let k = -14; k <= 26; k++) {
      const q = r.pts[((c + k) % n + n) % n], d = (q.x - x) ** 2 + (q.z - z) ** 2;
      if (d < bd) { bd = d; bi = c + k; }
    }
    return { s: bi * r.step, d: Math.sqrt(bd) };
  }

  _buildGates() {
    const cone = new THREE.ConeGeometry(0.075, 0.24, 12);
    const base = new THREE.BoxGeometry(0.2, 0.014, 0.2);
    for (const c of this.course.gates) {
      const g = { i: this.gates.length, s: c.s, x: c.x, z: c.z, y: c.y, fy: c.g, tx: c.tx, tz: c.tz, half: c.half, start: !!c.start };
      const grp = new THREE.Group();
      grp.position.set(c.x, c.g, c.z);
      grp.rotation.y = Math.atan2(c.tx, c.tz);
      const mat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      // On the floor: two cones and a line of light between them.
      const floor = new THREE.Group();
      for (const sgn of [-1, 1]) {
        const k = new THREE.Mesh(cone, mat); k.position.set(sgn * c.half, 0.134, 0);
        const b = new THREE.Mesh(base, mat); b.position.set(sgn * c.half, 0.007, 0);
        floor.add(k, b);
      }
      const strip = new THREE.Mesh(new THREE.PlaneGeometry(c.half * 2, 0.07), mat);
      strip.rotation.x = -Math.PI / 2; strip.position.y = 0.016;
      floor.add(strip);
      // In the air: a hoop.
      g.r = Math.max(0.5, Math.min(2.2, c.half * 0.82, c.y - c.g - 0.15));
      const ring = new THREE.Mesh(new THREE.TorusGeometry(g.r, 0.035, 8, 48), mat);
      ring.position.y = c.y - c.g;
      grp.add(floor, ring);
      g.floor = floor; g.ring = ring; g.mat = mat; g.group = grp;
      this.group.add(grp);
      this.gates.push(g);
    }
    this.startGate = this.gates.findIndex(g => g.start);
  }

  // A place on the grid, `back` metres behind the line and `side` across: pulled in towards the middle until it is clear.
  _slot(back, side) {
    const s = this.gates[this.startGate].s - back, q = this.at(s), P = this._p;
    for (let lat = side; ; lat *= 0.5) {
      P.x = q.x + q.tz * lat; P.z = q.z - q.tx * lat; P.y = q.g;
      if (Math.abs(lat) < 0.05 || (!confine(this.plan, P, 0.24, false, this._o) && !wallAt(this.plan, P.x, P.z, q.g))) return { x: q.x + q.tz * lat, z: q.z - q.tx * lat, g: q.g, y: q.y, yaw: Math.atan2(q.tx, q.tz), s };
    }
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
    this.place = RIVALS.length + 1;
    this.shown = this.place; this.heldT = 0;
    this.events.length = 0;
    // The rivals: real toys, made once for each kind and kept.
    for (const b of this.bots) this.group.remove(b.v.group, b.v.shadow);
    const kind = this.flying ? 'drone' : 'car';
    this.fleet[kind] = this.fleet[kind] || RIVALS.map(r => {
      const v = this.flying ? new Drone(this.plan, r.colour) : new Car(this.plan, r.colour);
      v.group.remove(v.lamp, v.lamp.target);                     // rivals do not need real lights
      return v;
    });
    // Two by two behind the line, the player at the back: you earn it.
    this.bots = RIVALS.map((r, i) => {
      const v = this.fleet[kind][i], row = RIVALS.length - 1 - i, at = this._slot(1.4 + row * 1.1, row % 2 ? -0.42 : 0.42);      // (the quickest at the front)
      this.group.add(v.group, v.shadow);
      if (this.flying) v.place(at.x, at.z, at.yaw, this.fy + 0.9); else v.place(at.x, at.z, at.yaw, at.g);
      return { ...r, v, s: at.s, prog: at.s - this.gates[this.startGate].s, best: -Infinity, done: false, phase: i * 2.1, stuckT: 0, backT: 0, noneT: 0, offT: 0, shift: 0, shiftT: 0, x: v.pos.x, y: v.pos.y, z: v.pos.z, rescued: 0 };
    });
    const me = this._slot(1.4 + RIVALS.length * 1.1, RIVALS.length % 2 ? -0.42 : 0.42);
    if (this.flying) player.place(me.x, me.z, me.yaw, this.fy + 1.2); else player.place(me.x, me.z, me.yaw, me.g);
    for (const g of this.gates) { g.floor.visible = !this.flying; g.ring.visible = this.flying; }
    this.sP = this.sOn = me.s;
    this.off = false; this.offT = 0;
    this.prev = player.pos.clone();
    this.lastGate = this.startGate;
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
    if (this.state !== 'countdown' && !this.finished) { this._player(); this._stray(dt); }
    this._bots(dt, t);
    if (!this.calm) this.trackTex.offset.y = -(t * 0.5) % 1;        // the arrows run the way you should be going
    this._paintGates(t);
    // Standing: how far everyone has come.
    const mine = this.finished ? Infinity : this.mine();
    const was = this.place;
    this.place = this.finished ? this.finalPlace : 1 + this.bots.filter(b => b.prog > mine).length;
    // The HUD has the new place at once; the flash and the blip wait until it has held a moment, so two toys
    // side by side swapping back and forth do not flash every frame.
    if (this.place !== was) this.heldT = 0; else this.heldT = (this.heldT || 0) + dt;
    if (this.state === 'go' && !this.finished && this.place !== this.shown && this.heldT > 0.25) {
      this.events.push({ type: 'place', place: this.place, up: this.place < this.shown });
      this.sound.beep(this.place < this.shown ? 990 : 330, 0.08, 0.05);
      this.shown = this.place;
    }
    if (this.state !== 'go') this.shown = this.place;
    this.prev.copy(p.pos);
  }

  // How far round the player has come since the start: laps and all.
  mine() { return (this.lap - 1) * this.route.length + this._progress(); }

  // Off the track? After a few seconds of it, you are put back where you left it.
  _stray(dt) {
    const p = this.player.pos, q = this.at(this.sP), d = Math.hypot(q.x - p.x, q.z - p.z);
    this.off = d > (this.flying ? 4.5 : 3.2);
    if (!this.off) { this.offT = 0; this.sOn = this.sP; return; }
    this.offT += dt;
    if (this.offT > 4.5) {
      const b = this.at(this.sOn), yaw = Math.atan2(b.tx, b.tz);
      if (this.flying) this.player.place(b.x, b.z, yaw, b.y); else this.player.place(b.x, b.z, yaw, b.g);
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
    // And just past it, before the lap is counted (the line is crossed when you cross it, not when the nearest point is past it), still this lap.
    else if (this.next === this.startGate && rel < r.length * 0.5) rel += r.length;
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
          const now = this.clock, split = now - this.lapStart;
          this.lapTimes.push(split);
          this.lapStart = now;
          if (this.lap >= LAPS) return this._finish(split);
          this.lap++;
          this.sound.lap();
          if (this.lap === LAPS) this.sound.beep(1175, 0.3, 0.07);
          this.events.push({ type: 'lap', lap: this.lap, final: this.lap === LAPS, split, n: this.lap - 1 });
        } else this.sound.gate();
        this.next = (this.next + 1) % this.gates.length;
      }
    }
  }

  _finish(split) {
    this.finished = true;
    this.state = 'done';
    this.total = this.clock;
    this.finalPlace = 1 + this.bots.filter(b => b.done).length;
    const key = this.player.kind;
    this.first = !this.best[key];                          // the first finish is a time to beat, not a record broken
    this.record = !this.first && this.total < this.best[key];
    if (this.record || this.first) { this.best[key] = this.total; try { localStorage.setItem('after-hours.best', JSON.stringify(this.best)); } catch { /* fine */ } }
    this.sound.finish();
    this.events.push({ type: 'finish', place: this.finalPlace, of: this.bots.length + 1, split, total: this.total, record: this.record });
  }

  // Put the player back at the last gate they cleared, pointing the right way.
  reset() {
    const g = this.gates[this.lastGate];
    const yaw = Math.atan2(g.tx, g.tz);
    if (this.flying) this.player.place(g.x, g.z, yaw, g.y); else this.player.place(g.x, g.z, yaw, g.fy);
    this.prev.copy(this.player.pos);
    this.sP = g.s;
  }

  // ---- the rivals ----
  _bots(dt, t) {
    const L = this.route.length, s0 = this.gates[this.startGate].s, go = this.state !== 'countdown';
    const mine = this.finished ? Infinity : this.mine(), me = this.player.pos;
    for (const b of this.bots) {
      const v = b.v;
      if (!go) { v.update(dt, this.flying ? { pitch: 0, roll: 0, yaw: 0, climb: 0 } : { throttle: 0, steer: 0 }); this._keep(b); continue; }
      const here = this._locate(v.pos.x, v.pos.z, b.s);
      b.s = here.s; b.prog = b.s - s0;
      if (!b.done && b.prog >= LAPS * L) { b.done = true; b.doneAt = this.clock; }
      const sp = Math.hypot(v.vel.x, v.vel.z);
      // A lane of its own, drifting a little, and out of the way of whoever is just ahead in it: round them if
      // there is room, or else sat behind them at their speed (a doorway is one toy wide).
      let lane = b.lane + b.wander * Math.sin(t * b.pace * 2 + b.phase), queue = Infinity;
      const width = Math.max(0, Math.min(this.at(b.s).w, this.at(b.s + 1.5).w) - 0.42);
      if (b.shiftT > 0) b.shiftT -= dt;
      else b.shift = 0;
      for (const o of this.bots) {
        const ov = o === b ? this.player : o.v;          // (in place of itself: the player)
        const dx = ov.pos.x - v.pos.x, dz = ov.pos.z - v.pos.z, fx = Math.sin(v.yaw), fz = Math.cos(v.yaw);
        const ahead = dx * fx + dz * fz, side = dx * fz - dz * fx;
        if (ahead < 0.15 || ahead > 2.2 || Math.abs(side) > 0.42 || Math.abs(ov.pos.y - v.pos.y) > 0.4) continue;
        if (width > 0.3 && b.shiftT <= 0) { b.shift = side > 0 ? -0.55 : 0.55; b.shiftT = 0.9; }
        else if (ahead < 1.4) queue = Math.min(queue, Math.max(0.4, ov.vel.x * fx + ov.vel.z * fz) + (ahead - 0.6) * 2);
      }
      lane += b.shift;
      // A doorway coming up (the course narrows to about one toy's room each side): close in to the middle, and of two
      // toys arriving at it side by side, the one behind (or, level, the slower) waits its turn rather than both
      // trying the gap at once and wedging there.
      let narrow = Infinity; for (let d = 0; d <= 3.5; d += 0.5) narrow = Math.min(narrow, this.at(b.s + d).w);
      if (narrow < 1.0) {
        lane *= clamp((narrow - 0.55) / 0.6, 0, 1); b.shift = 0;
        const others = [...this.bots.filter(o => o !== b).map(o => ({ v: o.v, prog: o.prog, done: o.done })), { v: this.player, prog: mine, done: this.finished }];
        for (const o of others) {
          if (o.done || !Number.isFinite(o.prog) || Math.abs(o.v.pos.y - v.pos.y) > 0.4) continue;
          const lead = o.prog - b.prog, apart = Math.hypot(o.v.pos.x - v.pos.x, o.v.pos.z - v.pos.z), osp = Math.hypot(o.v.vel.x, o.v.vel.z);
          if (apart > 2.4 || lead < -0.35 || lead > 2.2) continue;
          if (Math.abs(lead) <= 0.35 && (osp < sp || (osp === sp && o.v !== this.player && this.bots.indexOf(b) < this.bots.findIndex(q => q.v === o.v)))) continue;      // level: the faster goes first
          queue = Math.min(queue, Math.max(0.25, osp * 0.85) + Math.max(0, lead - 0.9) * 1.5);
        }
      }
      if (b.calm > 0) { b.calm -= dt; lane = 0; }           // just backed out of something: down the middle for a bit
      const { q, x: tx, z: tz } = this.aim(v.pos, b.s, (1.2 + sp * 0.32) * b.look, lane);
      const a = ang(Math.atan2(tx - v.pos.x, tz - v.pos.z) - v.yaw);
      // Slow for the tightest bend in braking distance; a toy race should stay a race, so whoever is well clear eases off.
      let k = 0;
      for (let d = 0; d <= 2 + sp * 0.9; d += 0.5) k = Math.max(k, this.at(b.s + d).k);
      const gap = b.prog - mine, band = b.done ? 0.45 : gap > 20 ? 0.9 : gap < -20 ? 1.06 : 1;
      const vt = Math.min(this.flying ? 10.5 : 10, Math.sqrt((this.flying ? 6.5 : 5.6) / Math.max(k, 0.004))) * b.skill * band * (Math.abs(a) > 1 ? 0.5 : 1), vq = Math.min(vt, queue);
      // Nose in to something: back off, turning away, then come on again.
      // (Told by not having got anywhere, not by speed: pressed against a jamb a car rocks back and forth on the spot.)
      if (!b.at || Math.hypot(v.pos.x - b.at.x, v.pos.z - b.at.z) > 0.25 || b.backT > 0 || (!this.flying && v.air)) { b.at = { x: v.pos.x, z: v.pos.z }; b.stuckT = 0; }
      else b.stuckT += dt;
      if (b.stuckT > 0.7) { b.stuckT = 0; b.backT = 0.75; b.backA = a; b.calm = 2.5; b.backs = (b.backs || 0) + 1; }
      let inp;
      if (this.flying) {
        const yawErr = ang(Math.atan2(q.tx, q.tz) - v.yaw), y = q.y + b.lane * 0.4;
        inp = b.backT > 0 ? { pitch: -1, roll: clamp(-b.backA * 2, -1, 1), yaw: clamp(-b.backA * 2, -1, 1), climb: 0 }
          : { pitch: sp < vq ? 1 : -0.4, roll: clamp(-a * 2.2, -1, 1), yaw: clamp(-(a + yawErr) * 2.5, -1, 1), climb: clamp((y - v.pos.y) * 2.5, -1, 1) };
      } else {
        inp = b.backT > 0 ? { throttle: -1, steer: Math.sign(b.backA) || 1 }
          : { throttle: sp < vq ? 1 : sp > vq + 1 ? -0.6 : 0.15, steer: clamp(-a * 3, -1, 1) };
      }
      if (b.backT > 0) b.backT -= dt;
      v.update(dt, inp);
      // Making no headway, or lost well off the line: put back on it where it left it.
      if (b.prog > b.best + 0.5) { b.best = b.prog; b.noneT = 0; } else b.noneT += dt;
      b.offT = here.d > 3 ? b.offT + dt : 0;
      if (b.noneT > 5 || b.offT > 3) this._rescue(b, b.offT > 3 ? 'lost' : 'stuck');
      this._keep(b);
    }
    // Toys do not pass through one another either.
    for (let i = 0; i < this.bots.length; i++) for (let j = i + 1; j < this.bots.length; j++) this._apart(this.bots[i].v, this.bots[j].v, 0.5);
    for (const b of this.bots) { this._apart(b.v, this.player, 0); this._keep(b); }
  }

  // Where to steer for from p, at s along the line: a point `look` on, `lane` across (as far as there is room). Nearer in
  // a tight spot, so that the straight line to it never cuts a corner into a wall.
  aim(p, s, look, lane = 0) {
    for (;;) {
      const q = this.at(s + look), m = this.at(s + look / 2), room = Math.max(0, Math.min(q.w, m.w, this.at(s).w) - 0.5);
      const lat = clamp(lane, -room, room), x = q.x + q.tz * lat, z = q.z - q.tx * lat;
      if (look <= 0.9 || Math.hypot((p.x + x) / 2 - m.x, (p.z + z) / 2 - m.z) < m.w - 0.3) return { q, x, z, y: q.y };
      look *= 0.7;
    }
  }

  // Back on the line, at the nearest clear spot behind where it went wrong.
  _rescue(b, why) {
    const v = b.v;
    (b.log = b.log || []).push({ why, t: +this.clock.toFixed(1), x: +v.pos.x.toFixed(2), z: +v.pos.z.toFixed(2), y: +v.pos.y.toFixed(2) });       // (for the tests)
    for (let back = 0; back < 12; back += 0.75) {
      const q = this.at(b.s - back);
      const busy = [...this.bots.map(o => o.v), this.player].some(o => o !== v && Math.hypot(o.pos.x - q.x, o.pos.z - q.z) < 0.6);
      if (busy) continue;
      const yaw = Math.atan2(q.tx, q.tz);
      if (this.flying) v.place(q.x, q.z, yaw, q.y); else v.place(q.x, q.z, yaw, q.g);
      b.s -= back; b.noneT = 0; b.offT = 0; b.stuckT = 0; b.backT = 0; b.rescued++;
      return;
    }
  }

  // Two toys overlapping: each pushed half the way apart (k = how much of it the second one takes), and kept out of the walls.
  _apart(a, c, k) {
    const dx = a.pos.x - c.pos.x, dz = a.pos.z - c.pos.z, d = Math.hypot(dx, dz), R = a.radius + c.radius;
    if (d >= R || d < 1e-4 || Math.abs(a.pos.y - c.pos.y) > 0.3) return;
    const push = (R - d) / d;
    this._nudge(a, dx * push * (1 - k), dz * push * (1 - k));
    if (k) this._nudge(c, -dx * push * k, -dz * push * k);
  }

  _nudge(v, dx, dz) {
    const P = this._p;
    P.x = v.pos.x + dx; P.y = v.pos.y; P.z = v.pos.z + dz;
    if (confine(this.plan, P, v.radius, this.flying, this._o) || wallAt(this.plan, P.x, P.z, this.flying ? v.pos.y - 0.07 : v.pos.y, this.flying ? 0.06 : undefined)) return;
    v.pos.x = P.x; v.pos.z = P.z;
    const l = Math.hypot(dx, dz) || 1;
    v.vel.x += dx / l * 0.6; v.vel.z += dz / l * 0.6;
    v.sync(0);
  }

  _keep(b) { b.x = b.v.pos.x; b.y = b.v.pos.y; b.z = b.v.pos.z; }

  _paintGates(t) {
    const pulse = this.calm ? 1 : 0.75 + 0.25 * Math.sin(t * 7);
    this.gates.forEach((g, i) => {
      const d = (i - this.next + this.gates.length) % this.gates.length;
      if (this.finished) g.mat.color.setRGB(0.25, 0.2, 0.1);
      else if (d === 0) g.mat.color.setRGB(0.15 * pulse, 1.45 * pulse, 1.7 * pulse);     // next: bright
      else if (d === 1) g.mat.color.setRGB(0.1, 0.5, 0.6);
      else if (g.start) g.mat.color.setRGB(1.2, 1.2, 1.2);                               // the line: white
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

// 1st, 2nd, 3rd, 4th.
export const ordinal = n => n + (['th', 'st', 'nd', 'rd'][n] || 'th');
