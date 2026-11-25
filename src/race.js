// A race against the toys you find waiting about the building (src/racespots.js finds them and sets them going).
//
// The course is laid by src/course.js round what is really there. The rivals are toys like yours (the same Car, so the
// same walls, doorways, ramps and floors stop them): each one steers for a point a little way along the line, in a
// lane of its own, slows for the bends it can see coming, and if it ends up nose-in to something backs off and comes
// round. Stuck for good, it is put back on the line where it left it.
//
// While a race is on its course is drawn: a ribbon on the floor with marks running the way to go, solid cones on the
// outside of the tight bends, and a pair of cones and a bar of light at each checkpoint. Nothing of it is there
// otherwise. When it is over the rivals finish their laps out of the way and go home (racespots.js puts them back).

import * as THREE from 'three';
import { confine, wallAt } from './plan.js';

const ang = a => Math.atan2(Math.sin(a), Math.cos(a));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const OFF = 3.2;          // further than this from the line is off the track
const LEAVE = 14;         // and further than this, or off it for LEAVE_T seconds, is leaving the race
const LEAVE_T = 10;
const CONE_R = 0.07;

// The marks on the ribbon, one repeat of them: drawn per theme, in colour, on a clear ground.
function ribbonTexture(style, a, b) {
  const c = document.createElement('canvas'); c.width = 128; c.height = 256;
  const g = c.getContext('2d'), A = '#' + new THREE.Color(a).getHexString(), B = '#' + new THREE.Color(b).getHexString();
  g.clearRect(0, 0, 128, 256);
  g.globalAlpha = 0.14; g.fillStyle = A; g.fillRect(8, 0, 112, 256); g.globalAlpha = 1;
  const chevron = (y, col, w = 9) => { g.strokeStyle = col; g.lineWidth = w; g.lineJoin = 'miter'; g.beginPath(); g.moveTo(38, y + 40); g.lineTo(64, y); g.lineTo(90, y + 40); g.stroke(); };
  if (style === 'candy') {                         // red and white barber stripes down both edges
    for (let y = -32; y < 256; y += 32) for (const x0 of [2, 112]) { g.fillStyle = A; g.beginPath(); g.moveTo(x0, y); g.lineTo(x0 + 14, y + 16); g.lineTo(x0 + 14, y + 32); g.lineTo(x0, y + 16); g.fill(); g.fillStyle = B; g.beginPath(); g.moveTo(x0, y + 16); g.lineTo(x0 + 14, y + 32); g.lineTo(x0 + 14, y + 48); g.lineTo(x0, y + 32); g.fill(); }
    chevron(110, A, 11);
  } else if (style === 'glyph') {                  // the visitors' marks: rings and ticks that mean nothing to anybody here
    g.fillStyle = A; g.fillRect(6, 0, 5, 256); g.fillRect(117, 0, 5, 256);
    for (let y = 8; y < 256; y += 24) { g.fillRect(14, y, 6, 6); g.fillRect(108, y + 12, 6, 6); }
    g.strokeStyle = A; g.lineWidth = 6; g.beginPath(); g.arc(64, 70, 22, 0.3, Math.PI * 1.7); g.stroke();
    g.beginPath(); g.moveTo(64, 48); g.lineTo(64, 92); g.stroke(); g.fillStyle = B; g.beginPath(); g.arc(64, 70, 6, 0, 7); g.fill();
    g.strokeStyle = B; g.lineWidth = 5; g.beginPath(); g.moveTo(44, 190); g.lineTo(64, 160); g.lineTo(84, 190); g.moveTo(52, 200); g.lineTo(76, 200); g.stroke();
  } else if (style === 'pixel') {                  // an arcade's: square dots down the edges and a blocky arrow
    g.fillStyle = A; for (let y = 0; y < 256; y += 16) { g.fillRect(4, y, 10, 10); g.fillRect(114, y + 8, 10, 10); }
    g.fillStyle = B; for (const [x, y] of [[56, 100], [48, 108], [64, 108], [40, 116], [72, 116], [56, 108], [56, 116], [56, 124], [56, 132]]) g.fillRect(x, y, 16, 8);
  } else if (style === 'gilt') {                   // a double rule in gold, and a slim arrow
    g.fillStyle = A; g.fillRect(4, 0, 6, 256); g.fillRect(118, 0, 6, 256); g.fillStyle = B; g.fillRect(14, 0, 3, 256); g.fillRect(111, 0, 3, 256);
    chevron(108, A, 6); chevron(124, B, 3);
  } else if (style === 'frost') {                  // ice: a thin line each side and snowflake ticks
    g.fillStyle = A; g.fillRect(5, 0, 6, 256); g.fillRect(117, 0, 6, 256);
    g.strokeStyle = B; g.lineWidth = 4; for (let k = 0; k < 3; k++) { const q = k * Math.PI / 3; g.beginPath(); g.moveTo(64 + Math.cos(q) * 20, 60 + Math.sin(q) * 20); g.lineTo(64 - Math.cos(q) * 20, 60 - Math.sin(q) * 20); g.stroke(); }
    chevron(150, A, 8);
  } else {                                         // neon: bright edges and a fat arrow
    g.fillStyle = A; g.fillRect(4, 0, 9, 256); g.fillRect(115, 0, 9, 256);
    chevron(106, B, 10);
  }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4;
  return t;
}

const HARD = [1, 1], SOFT = [0.72, 0.88];      // rivals' pace on the straight and through a bend: as they are, and against the gentle car
export class Race {
  constructor(scene, plan) {
    this.scene = scene;
    this.plan = plan;
    this.group = new THREE.Group();
    this.group.visible = false;
    scene.add(this.group);
    this.active = false;          // a race is being run: the player is in it
    this.cooling = false;         // over, and the rivals are finishing out of the way before going home
    this.state = 'idle';
    this.gates = [];
    this.bots = [];
    this.events = [];
    this.cones = [];
    this.off = false; this.offT = 0; this.sOn = 0; this.left = false;
    this._p = { x: 0, y: 0, z: 0 }; this._o = { x: 0, y: 0, z: 0 };
    this.coneGeo = new THREE.ConeGeometry(CONE_R, 0.22, 10); this.coneGeo.translate(0, 0.11, 0);
    this.coneMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.stripGeo = new THREE.PlaneGeometry(1, 0.07); this.stripGeo.rotateX(-Math.PI / 2);
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

  // ---- what is drawn while it is on ----
  _draw(theme) {
    this._clear();
    const pts = this.route.pts, n = pts.length;
    // The ribbon.
    const pos = [], uv = [], idx = [];
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
    this.trackTex = ribbonTexture(theme.style, theme.line, theme.mark);
    const mesh = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ map: this.trackTex, color: new THREE.Color(theme.glow || 1.6, theme.glow || 1.6, theme.glow || 1.6), transparent: true, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3, fog: false }));
    mesh.renderOrder = 6; mesh.frustumCulled = false;
    this.ribbon = mesh;
    this.group.add(mesh);
    // Cones: a pair at each checkpoint, and a row round the outside of every tight bend (where the floor leaves room for them).
    const cones = this.cones = [];
    this.gates.forEach((G, gi) => { for (const sg of [-1, 1]) cones.push({ x: G.x + G.tz * sg * G.half, z: G.z - G.tx * sg * G.half, y: G.fy, gate: gi }); });
    let lastS = -99;
    for (let i = 0; i < n; i++) {
      const p = pts[i]; if (p.k < 0.22 || i * this.route.step - lastS < 1.2) continue;
      const off = p.hw + 0.18; if (off > p.w - 0.12) continue;
      const sg = -p.turn;                     // the outside of the bend
      const x = p.x + p.tz * sg * off, z = p.z - p.tx * sg * off;
      if (this.gates.some(G => Math.hypot(G.x - x, G.z - z) < 1.5)) continue;
      cones.push({ x, z, y: p.g, gate: -1 }); lastS = i * this.route.step;
    }
    const im = this.coneMesh = new THREE.InstancedMesh(this.coneGeo, this.coneMat, Math.max(1, cones.length));
    const M = new THREE.Matrix4();
    cones.forEach((c, i) => { M.makeTranslation(c.x, c.y, c.z); im.setMatrixAt(i, M); im.setColorAt(i, new THREE.Color(theme.cone)); });
    im.count = cones.length; im.frustumCulled = false; if (im.instanceColor) im.instanceColor.needsUpdate = true;
    this.group.add(im);
    // A bar of light across each checkpoint.
    const sm = this.stripMesh = new THREE.InstancedMesh(this.stripGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false, fog: false }), this.gates.length);
    const Q = new THREE.Quaternion(), S = new THREE.Vector3(), V = new THREE.Vector3(), Y = new THREE.Vector3(0, 1, 0);
    this.gates.forEach((G, i) => { Q.setFromAxisAngle(Y, Math.atan2(G.tx, G.tz)); S.set(G.half * 2, 1, 1); V.set(G.x, G.fy + 0.017, G.z); M.compose(V, Q, S); sm.setMatrixAt(i, M); sm.setColorAt(i, new THREE.Color(1, 1, 1)); });
    sm.frustumCulled = false; sm.renderOrder = 7;
    this.group.add(sm);
    this.theme = theme;
    this.group.visible = true;
  }

  _clear() {
    if (this.ribbon) { this.group.remove(this.ribbon); this.ribbon.geometry.dispose(); this.ribbon.material.dispose(); }
    if (this.coneMesh) { this.group.remove(this.coneMesh); this.coneMesh.dispose(); }                     // (the shared cone shape and paint are kept)
    if (this.stripMesh) { this.group.remove(this.stripMesh); this.stripMesh.material.dispose(); this.stripMesh.dispose(); }
    if (this.trackTex) this.trackTex.dispose();
    this.ribbon = this.coneMesh = this.stripMesh = this.trackTex = null;
    this.cones = [];
    this.group.visible = false;
  }

  // A place on the grid, `back` metres behind the line and `side` across: pulled in towards the middle until it is clear.
  _slot(back, side) {
    const s = this.gates[this.startGate].s - back, q = this.at(s), P = this._p;
    for (let lat = side; ; lat *= 0.5) {
      P.x = q.x + q.tz * lat; P.z = q.z - q.tx * lat; P.y = q.g;
      if (Math.abs(lat) < 0.05 || (!confine(this.plan, P, 0.24, false, this._o) && !wallAt(this.plan, P.x, P.z, q.g))) return { x: q.x + q.tz * lat, z: q.z - q.tx * lat, g: q.g, y: q.y, yaw: Math.atan2(q.tx, q.tz), s };
    }
  }

  // { course, laps, rivals: [{ name, colour, skill, lane, wander, pace, look, v (a Car) }], player, sound, theme }
  begin({ course, laps, rivals, player, sound, theme, id }) {
    this.course = course; this.id = id;
    this.route = { pts: course.pts, step: course.step, length: course.length };
    this.gates = course.gates.map((c, i) => ({ i, s: c.s, x: c.x, z: c.z, y: c.y, fy: c.g, tx: c.tx, tz: c.tz, half: c.half, start: !!c.start }));
    this.startGate = Math.max(0, this.gates.findIndex(g => g.start));
    this.laps = laps;
    this.player = player;
    this.sound = sound;
    this.active = true; this.cooling = false;
    this.state = 'countdown';
    this.clock = -3.6;
    this.lastBeep = 4;
    this.lap = 1;
    this.next = (this.startGate + 1) % this.gates.length;
    this.lapTimes = [];
    this.lapStart = 0;
    this.finished = false;
    this.place = rivals.length + 1;
    this.shown = this.place; this.heldT = 0;
    this.events.length = 0;
    this.bumps = 0;
    // The rivals in front, two by two (the quickest at the front), the player at the back: you earn it.
    this.bots = rivals.map((r, i) => {
      const v = r.v, row = rivals.length - 1 - i, at = this._slot(1.4 + row * 1.1, row % 2 ? -0.42 : 0.42);
      v.place(at.x, at.z, at.yaw, at.g);
      return { ...r, v, s: at.s, prog: at.s - this.gates[this.startGate].s, best: -Infinity, done: false, phase: i * 2.1, stuckT: 0, backT: 0, noneT: 0, offT: 0, shift: 0, shiftT: 0, x: v.pos.x, y: v.pos.y, z: v.pos.z, rescued: 0, log: [] };
    });
    const me = this._slot(1.4 + rivals.length * 1.1, rivals.length % 2 ? -0.42 : 0.42);
    player.place(me.x, me.z, me.yaw, me.g);
    this.sP = this.sOn = me.s;
    this.off = false; this.offT = 0; this.left = false;
    this.prev = player.pos.clone();
    this.lastGate = this.startGate;
    this._draw(theme);
    this._paintGates(0);
  }

  // Over: the player is out of it (finished, or gave up). The rivals finish out of the way; `home(b)` is asked of each
  // in turn whether it can go home now (out of sight), and they are gone when it says so.
  end(home) {
    this.active = false;
    this.state = 'idle';
    this.home = home;
    this.cooling = this.bots.length > 0;
    this.coolT = 0;
    this._clear();
  }
  // Everything put away at once (a new game, the title).
  stop() { this.active = false; this.cooling = false; this.state = 'idle'; this._clear(); this.bots = []; }

  get locked() { return this.state === 'countdown'; }

  update(dt, t) {
    if (this.cooling) return this._cool(dt, t);
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
    this._conesPush();
    if (!this.calm && this.trackTex) this.trackTex.offset.y = -(t * 0.5) % 1;        // the marks run the way you should be going
    this._paintGates(t);
    const mine = this.finished ? Infinity : this.mine();
    const was = this.place;
    this.place = this.finished ? this.finalPlace : 1 + this.bots.filter(b => b.prog > mine).length;
    // The HUD has the new place at once; the flash and the blip wait until it has held a moment.
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

  // Off the track: the arrow points the way back. Far off, or off for long, and you have left the race.
  _stray(dt) {
    const p = this.player.pos, q = this.at(this.sP), d = Math.hypot(q.x - p.x, q.z - p.z);
    this.off = d > OFF || Math.abs(p.y - q.g) > 2.5;
    if (!this.off) { this.offT = 0; this.sOn = this.sP; return; }
    this.offT += dt;
    if (d > LEAVE || this.offT > LEAVE_T || Math.abs(p.y - q.g) > 4) this.left = true;
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
    const expect = ((this.gates[this.next].s - s0) % r.length + r.length) % r.length || r.length;
    if (rel > expect + r.length * 0.5) rel -= r.length;
    else if (this.next === this.startGate && rel < r.length * 0.5) rel += r.length;
    return rel;
  }

  _player() {
    const g = this.gates[this.next], p = this.player.pos, q = this.prev;
    const d0 = (q.x - g.x) * g.tx + (q.z - g.z) * g.tz, d1 = (p.x - g.x) * g.tx + (p.z - g.z) * g.tz;
    if (d0 < 0 && d1 >= 0) {
      const lat = Math.abs((p.x - g.x) * g.tz - (p.z - g.z) * g.tx);
      if (lat < g.half + 0.5) {
        this.lastGate = this.next;
        if (g.start) {
          const now = this.clock, split = now - this.lapStart;
          this.lapTimes.push(split);
          this.lapStart = now;
          if (this.lap >= this.laps) return this._finish(split);
          this.lap++;
          this.sound.lap();
          if (this.lap === this.laps) this.sound.beep(1175, 0.3, 0.07);
          this.events.push({ type: 'lap', lap: this.lap, laps: this.laps, final: this.lap === this.laps, split, n: this.lap - 1 });
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
    this.sound.finish();
    this.events.push({ type: 'finish', place: this.finalPlace, of: this.bots.length + 1, split, total: this.total, laps: this.laps });
  }

  // Put the player back at the last gate they cleared, pointing the right way.
  reset() {
    const g = this.gates[this.lastGate];
    this.player.place(g.x, g.z, Math.atan2(g.tx, g.tz), g.fy);
    this.prev.copy(this.player.pos);
    this.sP = g.s;
  }

  // ---- the rivals ----
  _bots(dt, t) {
    const L = this.route.length, s0 = this.gates[this.startGate].s, go = this.state !== 'countdown';
    const mine = this.finished || !this.active ? Infinity : this.mine(), me = this.player.pos;
    for (const b of this.bots) {
      const v = b.v;
      if (!go) { v.update(dt, { throttle: 0, steer: 0 }); this._keep(b); continue; }
      const here = this._locate(v.pos.x, v.pos.z, b.s);
      b.s = here.s; b.prog = b.s - s0;
      if (!b.done && b.prog >= this.laps * L) { b.done = true; b.doneAt = this.clock; }
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
      // A doorway coming up: close in to the middle, and of two toys arriving at it side by side, the one behind (or,
      // level, the slower) waits its turn rather than both trying the gap at once and wedging there.
      let narrow = Infinity; for (let d = 0; d <= 3.5; d += 0.5) narrow = Math.min(narrow, this.at(b.s + d).w);
      if (narrow < 1.0) {
        lane *= clamp((narrow - 0.55) / 0.6, 0, 1); b.shift = 0;
        const others = [...this.bots.filter(o => o !== b).map(o => ({ v: o.v, prog: o.prog, done: o.done })), { v: this.player, prog: mine, done: this.finished || !this.active }];
        for (const o of others) {
          if (o.done || !Number.isFinite(o.prog) || Math.abs(o.v.pos.y - v.pos.y) > 0.4) continue;
          const lead = o.prog - b.prog, apart = Math.hypot(o.v.pos.x - v.pos.x, o.v.pos.z - v.pos.z), osp = Math.hypot(o.v.vel.x, o.v.vel.z);
          if (apart > 2.4 || lead < -0.35 || lead > 2.2) continue;
          if (Math.abs(lead) <= 0.35 && (osp < sp || (osp === sp && o.v !== this.player && this.bots.indexOf(b) < this.bots.findIndex(q => q.v === o.v)))) continue;      // level: the faster goes first
          queue = Math.min(queue, Math.max(0.25, osp * 0.85) + Math.max(0, lead - 0.9) * 1.5);
        }
      }
      if (b.calm > 0) { b.calm -= dt; lane = 0; }           // just backed out of something: down the middle for a bit
      const { x: tx, z: tz } = this.aim(v.pos, b.s, (1.2 + sp * 0.32) * b.look, lane);
      const a = ang(Math.atan2(tx - v.pos.x, tz - v.pos.z) - v.yaw);
      // Slow for the tightest bend in braking distance; a toy race should stay a race, so whoever is well clear eases off.
      let k = 0;
      for (let d = 0; d <= 2 + sp * 0.9; d += 0.5) k = Math.max(k, this.at(b.s + d).k);
      const gap = b.prog - mine, band = b.done || !this.active ? 0.45 : gap > 20 ? 0.9 : gap < -20 ? 1.06 : 1;
      // Against the gentle car (Settings, and the red RC Car as it comes) they take it gently too: it tops out lower and
      // comes round more slowly at speed, and nobody driving it could have won.
      const soft = this.player.gentle ? SOFT : HARD;
      const vt = Math.min(10 * (b.top || 1) * soft[0], Math.sqrt(5.6 * (b.grip || 1) / Math.max(k, 0.004)) * soft[1]) * b.skill * band * (Math.abs(a) > 1 ? 0.5 : 1), vq = Math.min(vt, queue);
      // Nose in to something: back off, turning away, then come on again.
      if (!b.at || Math.hypot(v.pos.x - b.at.x, v.pos.z - b.at.z) > 0.25 || b.backT > 0 || v.air) { b.at = { x: v.pos.x, z: v.pos.z }; b.stuckT = 0; }
      else b.stuckT += dt;
      if (b.stuckT > 0.7) { b.stuckT = 0; b.backT = 0.75; b.backA = a; b.calm = 2.5; b.backs = (b.backs || 0) + 1; }
      const inp = b.backT > 0 ? { throttle: -1, steer: Math.sign(b.backA) || 1 }
        : { throttle: sp < vq ? 1 : sp > vq + 1 ? -0.6 : 0.15, steer: clamp(-a * 3, -1, 1) };
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

  // After the finish: the rivals run on to the end of their laps, easy, and go home when nobody is looking.
  _cool(dt, t) {
    this.coolT += dt; this.clock += dt;
    this._bots(dt, t);
    for (const b of [...this.bots]) if ((b.done || this.coolT > 4) && this.home && this.home(b, this.coolT > 30)) this.bots.splice(this.bots.indexOf(b), 1);
    if (!this.bots.length) this.cooling = false;
  }

  // The cones are solid: whatever runs into one is stopped by it (they are only ever where the floor leaves room).
  _conesPush() {
    for (const v of [this.player, ...this.bots.map(b => b.v)]) for (const c of this.cones) {
      const dx = v.pos.x - c.x, dz = v.pos.z - c.z; if (Math.abs(dx) > 0.4 || Math.abs(dz) > 0.4 || Math.abs(v.pos.y - c.y) > 0.25) continue;
      const d = Math.hypot(dx, dz), R = v.radius + CONE_R;
      if (d >= R || d < 1e-4) continue;
      const k = (R - d) / d;
      this._nudge(v, dx * k, dz * k);
      const into = -(v.vel.x * dx + v.vel.z * dz) / d;
      if (into > 0) { v.vel.x += dx / d * into * 1.2; v.vel.z += dz / d * into * 1.2; }
      if (v === this.player && (!this._coneT || this.clock - this._coneT > 0.4)) { this._coneT = this.clock; this.sound.knock && this.sound.knock(2, false); }
    }
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
    b.log.push({ why, t: +this.clock.toFixed(1), x: +v.pos.x.toFixed(2), z: +v.pos.z.toFixed(2), y: +v.pos.y.toFixed(2) });       // (for the tests)
    for (let back = 0; back < 12; back += 0.75) {
      const q = this.at(b.s - back);
      const busy = [...this.bots.map(o => o.v), this.player].some(o => o !== v && Math.hypot(o.pos.x - q.x, o.pos.z - q.z) < 0.6);
      if (busy) continue;
      v.place(q.x, q.z, Math.atan2(q.tx, q.tz), q.g);
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
    if (confine(this.plan, P, v.radius, false, this._o) || wallAt(this.plan, P.x, P.z, v.pos.y)) return;
    v.pos.x = P.x; v.pos.z = P.z;
    const l = Math.hypot(dx, dz) || 1;
    v.vel.x += dx / l * 0.6; v.vel.z += dz / l * 0.6;
    v.sync(0);
  }

  _keep(b) { b.x = b.v.pos.x; b.y = b.v.pos.y; b.z = b.v.pos.z; }

  _paintGates(t) {
    if (!this.stripMesh || !this.theme) return;
    const pulse = this.calm ? 1 : 0.75 + 0.25 * Math.sin(t * 7), C = this._c || (this._c = new THREE.Color()), T = this.theme;
    this.gates.forEach((g, i) => {
      const d = (i - this.next + this.gates.length) % this.gates.length;
      if (this.finished) C.setRGB(0.25, 0.2, 0.1);
      else if (d === 0) C.set(T.next).multiplyScalar(1.6 * pulse);                    // next: bright
      else if (g.start) C.set(T.start).multiplyScalar(1.2);                          // the line
      else C.set(T.line).multiplyScalar(0.6);
      this.stripMesh.setColorAt(i, C);
    });
    this.stripMesh.instanceColor.needsUpdate = true;
  }

  // Which way the next gate lies, as an angle off the nose (for the HUD arrow).
  bearing() {
    const g = this.off ? this.at(this.sOn + 2) : this.gates[this.next], p = this.player;
    const dx = g.x - p.pos.x, dz = g.z - p.pos.z;
    const a = Math.atan2(dx, dz) - p.yaw;
    return { angle: -Math.atan2(Math.sin(a), Math.cos(a)), dist: Math.hypot(dx, dz), off: this.off };
  }
}

export function clockText(sec) {
  if (!(sec >= 0)) return '0:00.00';
  const m = Math.floor(sec / 60), s = sec - m * 60;
  return `${m}:${s < 10 ? '0' : ''}${s.toFixed(2)}`;
}

// 1st, 2nd, 3rd, 4th.
export const ordinal = n => n + (['th', 'st', 'nd', 'rd'][n] || 'th');
