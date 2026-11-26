// Last Donut: the game on the security desk's computer.
//
// The last donut in the box has rolled off the desk, out of the control room and away down the lower
// level, and the night guard goes after it on a swivel chair. The floor is the museum's own: the real
// service corridors and back rooms of the lower level, taken from the plan (arenaFrom), names and all.
//
//   * The chair has momentum and no brakes: steer by pushing (arrows, WASD, or a thumb dragged on the
//     glass). It bounces off walls and spins. PUSH OFF (space, or the button) is a shove in the way you
//     are steering, a much bigger one with a wall at your back.
//   * The mice want the donut too. One that reaches it hangs on and eats: a bite every couple of seconds, six
//     bites to a donut, two to fill a mouse. They also slow it down. Run at a mouse and it lets go.
//   * Coffee, left about on the floor, is a burst. A wet floor is a wet floor.
//   * The supervisor's radio is the clock. Catch the donut before it calls you back and there is, it
//     turns out, another donut: each round faster, with more mice and less time. The score is kept;
//     the best is saved by the desk (src/secdesk.js).
//
// No DOM and no three.js: update(dt, input) is plain arithmetic (tested in node with a robot at the
// controls) and draw(c, W, H) wants only a 2D context. Sounds are asked for by name in `fx`; the tune
// (Grieg, In the Hall of the Mountain King, 1875) is `Tune`, played by whoever has a synth.

const TAU = Math.PI * 2;
const R_CHAIR = 0.36, CATCH = 0.8, SHOO = 1.05, BITES = 6;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// ---------------------------------------------------------------- the floor
// The lower level as a place to slide about: its rooms (rectangles), the doorways between them, and for each
// doorway a point just inside each of its two rooms (anything that goes room to room goes by those, so it
// goes through the opening and not the wall).
export function arenaFrom(plan) {
  const y = plan.levels && plan.levels.LL != null ? plan.levels.LL : -4.6;
  const rooms = plan.rooms.filter(r => Math.abs(r.y - y) < 0.7 && !r.secret).map(r => ({ id: r.id, name: String(r.gallery || r.name || ''), x0: r.x0, x1: r.x1, z0: r.z0, z1: r.z1, hall: (r.x1 - r.x0 < 3.2 || r.z1 - r.z0 < 3.2) && Math.max(r.x1 - r.x0, r.z1 - r.z0) > 9, doors: [] }));
  const byId = Object.fromEntries(rooms.map(r => [r.id, r])), doors = [];
  for (const d of plan.doors) {
    const a = byId[d.a], b = byId[d.b];
    if (!a || !b || d.secret || d.vent || d.shut) continue;
    const cx = (d.x0 + d.x1) / 2, cz = (d.z0 + d.z1) / 2, alongX = a.x1 <= d.x0 + 0.06 || a.x0 >= d.x1 - 0.06;      // which way you go through it
    if ((alongX ? d.z1 - d.z0 : d.x1 - d.x0) < 0.9) continue;                      // (too narrow for a chair)
    const side = r => (alongX ? { x: r.x1 <= d.x0 + 0.06 ? d.x0 - 0.55 : d.x1 + 0.55, z: cz } : { x: cx, z: r.z1 <= d.z0 + 0.06 ? d.z0 - 0.55 : d.z1 + 0.55 });
    const q = { a: a.id, b: b.id, x0: d.x0, x1: d.x1, z0: d.z0, z1: d.z1, alongX, pa: side(a), pb: side(b) };
    doors.push(q); a.doors.push(q); b.doors.push(q);
  }
  return { rooms, doors, byId };
}
const other = (d, id) => (d.a === id ? d.b : d.a);
const sideOf = (d, id) => (d.a === id ? d.pa : d.pb);

export class Arena {
  constructor(a) { Object.assign(this, a); }
  roomAt(x, z, hint) {
    const h = hint && this.byId[hint]; if (h && x >= h.x0 && x <= h.x1 && z >= h.z0 && z <= h.z1) return h.id;
    for (const r of this.rooms) if (x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1) return r.id;
    return null;
  }
  // Is there floor for something r across at (x, z)? In a room, clear of its walls, or in a doorway.
  free(x, z, r) {
    for (const q of this.rooms) if (x >= q.x0 + r && x <= q.x1 - r && z >= q.z0 + r && z <= q.z1 - r) return true;
    for (const d of this.doors) { if (d.alongX ? (x >= d.x0 - r - 0.1 && x <= d.x1 + r + 0.1 && z >= d.z0 + r * 0.5 && z <= d.z1 - r * 0.5) : (z >= d.z0 - r - 0.1 && z <= d.z1 + r + 0.1 && x >= d.x0 + r * 0.5 && x <= d.x1 - r * 0.5)) return true; }
    return false;
  }
  // How many doorways from room `from` to every room it can reach; `shut` is a room not to go through.
  steps(from, shut) {
    const dist = { [from]: 0 }, prev = {}, q = [from];
    for (let i = 0; i < q.length; i++) for (const d of this.byId[q[i]].doors) { const n = other(d, q[i]); if (n in dist || n === shut) continue; dist[n] = dist[q[i]] + 1; prev[n] = { room: q[i], door: d }; q.push(n); }
    return { dist, prev };
  }
  // The way from a room to another, as points to pass through: each doorway's near side, then its far side.
  way(from, to, shut) {
    if (from === to) return [];
    const { prev } = this.steps(from, shut); if (!prev[to]) return null;
    const pts = [];
    for (let at = to; at !== from; at = prev[at].room) { const d = prev[at].door; pts.unshift({ ...sideOf(d, prev[at].room), room: prev[at].room }, { ...sideOf(d, at), room: at }); }
    return pts;
  }
}

// ---------------------------------------------------------------- the game
export class LastDonut {
  // arena: an Arena. o: { start: the id of the control room you are sitting in, rnd, best }.
  constructor(arena, o = {}) {
    this.A = arena; this.rnd = o.rnd || Math.random; this.best = o.best || 0; this.fx = [];
    const start = arena.byId[o.start] ? o.start : (arena.rooms.find(r => /Security control/i.test(r.name)) || arena.rooms[0]).id, r = arena.byId[start];
    this.home = start;
    this.chair = { x: (r.x0 + r.x1) / 2, z: (r.z0 + r.z1) / 2, vx: 0, vz: 0, spin: 0, w: 0, room: start, kick: 0, coffee: 0, wet: false, face: 0 };
    this.score = 0; this.round = 0; this.over = false; this.why = ''; this.state = 'title'; this.t = 0; this.st = 0; this.msg = null; this.caught = 0; this.shooed = 0;
    this.mice = []; this.cups = []; this.wets = []; this.trail = []; this.pops = [];
    this.cam = { x: this.chair.x, z: this.chair.z };
    this._newDonut(true);
  }
  // ---- a round
  _newDonut(first) {
    const A = this.A, c = this.chair, r = A.byId[c.room] || A.byId[this.home];
    // The first rolls off the desk and is out of the door before you have turned the chair round; each one after jumps
    // out of your hands where you sit. Either way it has a few seconds' start, going flat out, and cannot be caught in them.
    const d = first && r.doors[0], out = d ? sideOf(d, other(d, r.id)) : { x: c.x, z: c.z }, room = d ? other(d, r.id) : r.id;
    this.donut = { x: out.x, z: out.z, room, path: [], bites: BITES, roll: 0, dir: 0, dash: first ? 2.0 : 2.8, speed: 0, biteT: 0, wob: this.rnd() * 6 };
    this.round++; this.time = this.limit = Math.max(8, 40 - (this.round - 1) * 5); this.radioed = false;
    this.mice = this.mice.filter(m => m.state === 'flee'); this.mouseT = 3.2; this.cups = []; this.wets = []; this.trail = [];
    this._route();
  }
  // Where it rolls next: some room a good many doorways off, by a way that does not go past the chair.
  _route() {
    const A = this.A, D = this.donut, shut = this.chair.room !== D.room ? this.chair.room : null;
    let { dist } = A.steps(D.room, shut), far = Object.keys(dist).filter(id => dist[id] >= 3);
    if (far.length < 3) { dist = A.steps(D.room, null).dist; far = Object.keys(dist).filter(id => dist[id] >= 2); }
    if (!far.length) { D.path = []; return; }
    far.sort((a, b) => dist[b] - dist[a]);
    const to = far[Math.floor(this.rnd() * Math.min(far.length, Math.max(4, far.length * 0.5)))];
    const way = A.way(D.room, to, shut) || A.way(D.room, to, null) || [], end = A.byId[to];
    D.path = [...way, { x: (end.x0 + end.x1) / 2, z: (end.z0 + end.z1) / 2, room: to }];
    // Things left about on its way: coffee, and a wet floor or two (never right in a doorway).
    let run = 0, px = D.x, pz = D.z, nextCup = 9 + this.rnd() * 6, nextWet = 20 + this.rnd() * 10;
    for (const p of D.path) {
      const l = Math.hypot(p.x - px, p.z - pz);
      for (; nextCup < run + l && this.cups.length < 5; nextCup += 17 + this.rnd() * 9) { const f = (nextCup - run) / l, side = (this.rnd() < 0.5 ? -1 : 1) * 0.45, nx = -(p.z - pz) / (l || 1), nz = (p.x - px) / (l || 1), x = px + (p.x - px) * f + nx * side, z = pz + (p.z - pz) * f + nz * side; if (A.free(x, z, 0.3)) this.cups.push({ x, z, t: 0 }); }
      for (; nextWet < run + l && this.wets.length < 3; nextWet += 26 + this.rnd() * 14) { const f = (nextWet - run) / l, x = px + (p.x - px) * f, z = pz + (p.z - pz) * f; if (l > 6 && f > 0.25 && f < 0.75) this.wets.push({ x, z, r: 1.25 }); }
      run += l; px = p.x; pz = p.z;
    }
  }
  begin() { if (this.state === 'title') { this.state = 'play'; this.st = 0; this.say('THE LAST DONUT HAS LEFT THE DESK', 'After it!', 2.2); this.fx.push('start'); } }
  say(head, sub, hold = 2) { this.msg = { head, sub, t: hold }; }
  get tempo() { return this.state !== 'play' ? 0 : 152 + (1 - this.time / this.limit) * 70 + (this.round - 1) * 8; }

  // ---- one frame. inp: { x, y } which way the chair is pushed (y down the screen), kick: PUSH OFF was pressed.
  update(dt, inp = {}) {
    this.t += dt; this.st += dt;
    if (this.msg && (this.msg.t -= dt) <= 0 && !this.over) this.msg = null;
    for (const p of this.pops) p.t += dt; this.pops = this.pops.filter(p => p.t < 1);
    if (this.state === 'title') { if (inp.kick || Math.abs(inp.x || 0) + Math.abs(inp.y || 0) > 0.3) this.begin(); this._camera(dt); return; }
    if (this.state === 'got') { this._chair(dt, inp, 0.4); if (this.st > 2.3) { this.state = 'play'; this.st = 0; this._newDonut(false); this.say(`DONUT ${this.round}`, 'The box had another layer.', 1.8); this.fx.push('start'); } this._camera(dt); return; }
    if (this.over) { this._chair(dt, {}, 0); this._camera(dt); return; }
    this.time -= dt;
    if (!this.radioed && this.time < 10) { this.radioed = true; this.say('RADIO: "Unit 4. Where ARE you?"', 'Ten seconds.', 2.4); this.fx.push('radio'); }
    if (this.time < 5 && Math.ceil(this.time) !== Math.ceil(this.time + dt)) this.fx.push('tick');
    if (this.time <= 0) return this._end('radio');
    this._chair(dt, inp, 1);
    this._donut(dt);
    this._mice(dt);
    // coffee, and the wet floor
    const c = this.chair;
    for (const k of this.cups) { k.t += dt; if (!k.gone && Math.hypot(k.x - c.x, k.z - c.z) < 0.85) { k.gone = true; c.coffee = 3.2; const l = Math.hypot(c.vx, c.vz) || 1; c.vx += c.vx / l * 3.2; c.vz += c.vz / l * 3.2; this.score += 10; this.pop(k.x, k.z, 'COFFEE +10'); this.fx.push('coffee'); } }
    this.cups = this.cups.filter(k => !k.gone);
    // caught it?
    const D = this.donut;
    if (D.dash <= 0 && Math.hypot(D.x - c.x, D.z - c.z) < CATCH) {
      const gain = 100 + 25 * D.bites + 5 * Math.ceil(this.time);
      this.score += gain; this.caught++; this.state = 'got'; this.st = 0; this.fx.push('catch');
      this.say('GOT IT', `+${gain}   ${D.bites === BITES ? 'Not a bite out of it.' : D.bites + ' sixths of a donut.'}`, 2.2);
      for (const m of this.mice) if (m.state !== 'flee') this._flee(m, false);
    }
    this._camera(dt);
  }
  _end(why) {
    this.over = true; this.why = why; this.state = 'over'; this.fresh = this.score > this.best; if (this.fresh) this.best = this.score;
    this.say(why === 'radio' ? 'RADIO: "Unit 4. Desk. NOW."' : 'THE MICE FINISHED IT', why === 'radio' ? 'The donut rolls on into the dark.' : 'They will be glowing AND full.', 99);
    this.fx.push('over');
  }
  pop(x, z, text) { this.pops.push({ x, z, text, t: 0 }); }

  _chair(dt, inp, power) {
    const c = this.chair, A = this.A;
    let ix = clamp(inp.x || 0, -1, 1), iz = clamp(inp.y || 0, -1, 1); const il = Math.hypot(ix, iz); if (il > 1) { ix /= il; iz /= il; }
    c.wet = this.wets.some(w => Math.hypot(w.x - c.x, w.z - c.z) < w.r);
    const grip = c.wet ? 0.12 : 1, acc = 11.5 * (c.coffee > 0 ? 1.55 : 1) * grip * power, drag = c.wet ? 0.35 : 1.75;
    c.vx += ix * acc * dt; c.vz += iz * acc * dt;
    if (il > 0.2) c.face = Math.atan2(ix, iz);
    c.kick = Math.max(0, c.kick - dt); c.coffee = Math.max(0, c.coffee - dt);
    if (inp.kick && c.kick <= 0 && power > 0) {
      const sp = Math.hypot(c.vx, c.vz), dx = il > 0.2 ? ix / il : sp > 0.2 ? c.vx / sp : Math.sin(c.face), dz = il > 0.2 ? iz / il : sp > 0.2 ? c.vz / sp : Math.cos(c.face);
      const wall = !A.free(c.x - dx * 0.95, c.z - dz * 0.95, R_CHAIR * 0.6), push = wall ? 6.2 : 3.6;      // a wall at your back is something to push off
      c.vx += dx * push; c.vz += dz * push; c.kick = 1.05; c.w += (this.rnd() - 0.5) * 6; this.fx.push(wall ? 'wallkick' : 'kick');
      if (wall) this.pop(c.x, c.z, 'OFF THE WALL');
    }
    const f = Math.exp(-drag * dt); c.vx *= f; c.vz *= f;
    const sp = Math.hypot(c.vx, c.vz), top = c.coffee > 0 ? 12 : 9.5; if (sp > top) { c.vx *= top / sp; c.vz *= top / sp; }
    // move, a short step at a time so as not to skip a wall
    const n = Math.max(1, Math.ceil(sp * dt / 0.15)), h = dt / n;
    for (let i = 0; i < n; i++) {
      const nx = c.x + c.vx * h, nz = c.z + c.vz * h;
      if (A.free(nx, nz, R_CHAIR)) { c.x = nx; c.z = nz; continue; }
      const hit = Math.hypot(c.vx, c.vz);
      if (A.free(nx, c.z, R_CHAIR)) { c.x = nx; c.vz *= -0.42; } else if (A.free(c.x, nz, R_CHAIR)) { c.z = nz; c.vx *= -0.42; } else { c.vx *= -0.42; c.vz *= -0.42; }
      if (hit > 2.4) { c.w += (this.rnd() < 0.5 ? -1 : 1) * hit * 1.6; this.fx.push('bonk'); }
    }
    c.spin += c.w * dt; c.w *= Math.exp(-2.2 * dt);
    c.room = A.roomAt(c.x, c.z, c.room) || c.room;
  }
  _donut(dt) {
    const D = this.donut, c = this.chair, hang = this.mice.filter(m => m.state === 'bite').length;
    const d = Math.hypot(D.x - c.x, D.z - c.z);
    let v = Math.min(9.2, 3.6 + (this.round - 1) * 0.55);
    if (D.dash > 0) { D.dash -= dt; v *= 1.9; }
    v *= d > 20 ? 0.72 : d < 4.5 ? 1.1 : 1;                 // it dawdles when you are nowhere, and hurries when you are close
    if (hang) v *= Math.max(0.3, 1 - 0.42 * hang);          // mice are heavy
    D.speed = v;
    let left = v * dt;
    while (left > 0) {
      if (!D.path.length) { this._route(); if (!D.path.length) break; }
      const p = D.path[0], l = Math.hypot(p.x - D.x, p.z - D.z);
      if (l <= left) { D.x = p.x; D.z = p.z; D.room = p.room || D.room; D.path.shift(); left -= l; }
      else { D.dir = Math.atan2(p.x - D.x, p.z - D.z); D.x += (p.x - D.x) / l * left; D.z += (p.z - D.z) / l * left; left = 0; }
    }
    D.roll += v * dt / 0.45;
    // a sprinkle now and then, to follow
    if (!this.trail.length || Math.hypot(this.trail[this.trail.length - 1].x - D.x, this.trail[this.trail.length - 1].z - D.z) > 1.1) { this.trail.push({ x: D.x + (this.rnd() - 0.5) * 0.3, z: D.z + (this.rnd() - 0.5) * 0.3, k: Math.floor(this.rnd() * 5) }); if (this.trail.length > 46) this.trail.shift(); }
    // eaten
    if (hang) { D.biteT += dt * hang; if (D.biteT > 2.1) { D.biteT = 0; D.bites--; this.fx.push('bite'); this.pop(D.x, D.z, 'NIBBLE');
      const full = this.mice.find(m => m.state === 'bite' && ++m.ate >= 2); if (full) this._flee(full, false);      // two bites and a mouse is full, and waddles off
      if (D.bites <= 0) this._end('eaten'); } }
  }
  _flee(m, pts = true) {
    if (pts) { const gain = m.state === 'bite' ? 25 : 15; this.score += gain; this.shooed++; this.pop(m.x, m.z, 'SHOO +' + gain); this.fx.push('squeak'); }
    const c = this.chair, l = Math.hypot(m.x - c.x, m.z - c.z) || 1; m.state = 'flee'; m.t = 0; m.fx = (m.x - c.x) / l; m.fz = (m.z - c.z) / l;
  }
  _mice(dt) {
    const A = this.A, D = this.donut, c = this.chair, want = Math.min(5, 1 + this.round);
    if ((this.mouseT -= dt) <= 0 && this.mice.filter(m => m.state !== 'flee').length < want) {
      this.mouseT = Math.max(1.6, 4.6 - this.round * 0.5);
      // out of a room a couple of doorways ahead of the donut: nowhere you are, nowhere it has been
      const { dist } = A.steps(D.room, c.room !== D.room ? c.room : null), ahead = new Set(D.path.map(p => p.room));
      const from = Object.keys(dist).filter(id => dist[id] >= 2 && dist[id] <= 4 && id !== c.room), pickFrom = from.filter(id => ahead.has(id)).concat(from);
      if (pickFrom.length) { const r = A.byId[pickFrom[Math.floor(this.rnd() * Math.min(pickFrom.length, 4))]]; this.mice.push({ x: (r.x0 + r.x1) / 2, z: (r.z0 + r.z1) / 2, room: r.id, state: 'run', t: 0, path: null, re: 0, dir: 0, ate: 0, ph: this.rnd() * 6 }); this.fx.push('mouse'); }
    }
    for (const m of this.mice) {
      m.t += dt; m.ph += dt * 14;
      if (m.state === 'flee') { const nx = m.x + m.fx * 7.5 * dt, nz = m.z + m.fz * 7.5 * dt; if (A.free(nx, nz, 0.15)) { m.x = nx; m.z = nz; } m.dir = Math.atan2(m.fx, m.fz); continue; }
      if (Math.hypot(m.x - c.x, m.z - c.z) < SHOO) { this._flee(m); continue; }
      if (m.state === 'bite') { const a = m.at; m.x = D.x + Math.sin(a) * 0.42; m.z = D.z + Math.cos(a) * 0.42; m.dir = a + Math.PI; continue; }
      // after the donut: room to room by the doorways, then straight at it
      if ((m.re -= dt) <= 0 || !m.path) { m.re = 0.45; m.path = m.room === D.room ? [] : A.way(m.room, D.room, null) || []; }
      const p = m.path.length ? m.path[0] : D, l = Math.hypot(p.x - m.x, p.z - m.z), step = (5.4 + this.round * 0.25) * dt;
      if (l <= step) { m.x = p.x; m.z = p.z; if (m.path.length) { m.room = m.path[0].room || m.room; m.path.shift(); } }
      else { m.x += (p.x - m.x) / l * step; m.z += (p.z - m.z) / l * step; m.dir = Math.atan2(p.x - m.x, p.z - m.z); }
      if (Math.hypot(D.x - m.x, D.z - m.z) < 0.5) { m.state = 'bite'; m.at = this.rnd() * TAU; this.fx.push('latch'); }
    }
    this.mice = this.mice.filter(m => !(m.state === 'flee' && m.t > 1.6));
  }
  _camera(dt) {
    const c = this.chair, D = this.donut, k = 1 - Math.exp(-dt * 4);
    let tx = c.x + c.vx * 0.42, tz = c.z + c.vz * 0.42;
    const dx = D.x - c.x, dz = D.z - c.z, d = Math.hypot(dx, dz) || 1, lean = Math.min(d, 6) * 0.3; tx += dx / d * lean; tz += dz / d * lean;      // lean towards the donut
    this.cam.x += (tx - this.cam.x) * k; this.cam.z += (tz - this.cam.z) * k;
  }

  // ---------------------------------------------------------------- the picture
  draw(c, W, H) {
    const A = this.A, s = clamp(Math.min(W, H) / 19, 15, 40), ox = W / 2 - this.cam.x * s, oz = H / 2 - this.cam.z * s, t = this.t;
    const X = x => x * s + ox, Z = z => z * s + oz, vis = (x0, x1, z0, z1) => X(x1) > -20 && X(x0) < W + 20 && Z(z1) > -20 && Z(z0) < H + 20;
    c.fillStyle = '#07090d'; c.fillRect(0, 0, W, H);
    // floors
    for (const r of A.rooms) {
      if (!vis(r.x0, r.x1, r.z0, r.z1)) continue;
      const x = X(r.x0), z = Z(r.z0), w = (r.x1 - r.x0) * s, h = (r.z1 - r.z0) * s;
      c.fillStyle = r.hall ? '#4a5870' : r.id === this.home ? '#3d4a66' : '#333f52'; c.fillRect(x, z, w, h);
      if (r.hall) { c.strokeStyle = 'rgba(226,205,148,.3)'; c.lineWidth = 2; c.setLineDash([s * 0.7, s * 0.7]); c.beginPath(); if (w > h) { c.moveTo(x, z + h / 2); c.lineTo(x + w, z + h / 2); } else { c.moveTo(x + w / 2, z); c.lineTo(x + w / 2, z + h); } c.stroke(); c.setLineDash([]); }
      else { c.strokeStyle = 'rgba(255,255,255,.05)'; c.lineWidth = 1; c.beginPath(); for (let gx = Math.ceil(r.x0 / 2) * 2; gx < r.x1; gx += 2) { c.moveTo(X(gx), z); c.lineTo(X(gx), z + h); } for (let gz = Math.ceil(r.z0 / 2) * 2; gz < r.z1; gz += 2) { c.moveTo(x, Z(gz)); c.lineTo(x + w, Z(gz)); } c.stroke(); }
      c.strokeStyle = '#7888a6'; c.lineWidth = 2; c.strokeRect(x, z, w, h);
    }
    for (const d of A.doors) { if (!vis(d.x0, d.x1, d.z0, d.z1)) continue; c.fillStyle = '#4a5870'; if (d.alongX) c.fillRect(X(d.x0) - 2, Z(d.z0) + 2, (d.x1 - d.x0) * s + 4, (d.z1 - d.z0) * s - 4); else c.fillRect(X(d.x0) + 2, Z(d.z0) - 2, (d.x1 - d.x0) * s - 4, (d.z1 - d.z0) * s + 4); }
    // the rooms' names, as they are on the plan
    c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = 'rgba(214,224,244,.42)';
    for (const r of A.rooms) {
      if (r.hall || !r.name || !vis(r.x0, r.x1, r.z0, r.z1)) continue;
      const w = (r.x1 - r.x0) * s, h = (r.z1 - r.z0) * s, px = clamp(Math.floor(s * 0.42), 9, 13); c.font = `600 ${px}px ui-monospace, Menlo, Consolas, monospace`;
      const words = r.name.toUpperCase().split(' '), lines = []; let line = '';
      for (const wd of words) { const tl = line ? line + ' ' + wd : wd; if (c.measureText(tl).width > w - 10 && line) { lines.push(line); line = wd; } else line = tl; } lines.push(line);
      if (lines.length * px * 1.2 > h - 6 || lines.some(l => c.measureText(l).width > w - 6)) continue;
      lines.forEach((l, i) => c.fillText(l, X((r.x0 + r.x1) / 2), Z((r.z0 + r.z1) / 2) + (i - (lines.length - 1) / 2) * px * 1.2));
    }
    // the desk it fell off
    { const r = A.byId[this.home]; if (r && vis(r.x0, r.x1, r.z0, r.z1)) { const x = X(r.x1 - 2.4), z = Z((r.z0 + r.z1) / 2 - 0.9); c.fillStyle = '#6a7690'; c.fillRect(x, z, s * 1.0, s * 1.8); c.fillStyle = '#9fe6a0'; c.fillRect(x + s * 0.55, z + s * 0.5, s * 0.14, s * 0.8); c.fillStyle = '#e9a3bd'; c.fillRect(x + s * 0.12, z + s * 1.15, s * 0.5, s * 0.5); } }
    // wet floors
    for (const w of this.wets) { if (!vis(w.x - 2, w.x + 2, w.z - 2, w.z + 2)) continue; c.fillStyle = 'rgba(120,190,255,.16)'; c.beginPath(); c.ellipse(X(w.x), Z(w.z), w.r * s, w.r * s * 0.86, 0.4, 0, TAU); c.fill(); c.strokeStyle = 'rgba(170,215,255,.3)'; c.lineWidth = 1.5; c.stroke();
      const x = X(w.x + w.r * 0.5), z = Z(w.z - w.r * 0.45); c.fillStyle = '#e8c21c'; c.beginPath(); c.moveTo(x, z - s * 0.42); c.lineTo(x + s * 0.3, z + s * 0.24); c.lineTo(x - s * 0.3, z + s * 0.24); c.closePath(); c.fill(); c.fillStyle = '#1b1b12'; c.font = `700 ${Math.max(8, s * 0.3)}px ui-monospace, monospace`; c.fillText('!', x, z + s * 0.04); }
    // sprinkles where it has been
    const SPR = ['#ff6fa8', '#ffd447', '#7fe9f5', '#9fe6a0', '#ffffff'];
    this.trail.forEach((p, i) => { c.fillStyle = SPR[p.k]; c.globalAlpha = 0.35 + 0.65 * (i / this.trail.length); c.save(); c.translate(X(p.x), Z(p.z)); c.rotate(p.k * 1.3 + i); c.fillRect(-s * 0.11, -s * 0.035, s * 0.22, s * 0.07); c.restore(); }); c.globalAlpha = 1;
    // coffee
    for (const k of this.cups) { const x = X(k.x), z = Z(k.z), r = s * 0.3; c.fillStyle = 'rgba(255,240,200,.12)'; c.beginPath(); c.arc(x, z, r * 2 + Math.sin(t * 4 + k.x) * 2, 0, TAU); c.fill(); c.fillStyle = '#efe8d8'; c.beginPath(); c.arc(x, z, r, 0, TAU); c.fill(); c.fillStyle = '#5a3a22'; c.beginPath(); c.arc(x, z, r * 0.68, 0, TAU); c.fill(); c.strokeStyle = '#efe8d8'; c.lineWidth = r * 0.3; c.beginPath(); c.arc(x + r * 1.05, z, r * 0.42, -1.2, 1.2); c.stroke(); }
    // mice
    for (const m of this.mice) {
      const x = X(m.x), z = Z(m.z), r = s * 0.3, a = -m.dir + Math.PI / 2;
      const g = c.createRadialGradient(x, z, 0, x, z, r * 4); g.addColorStop(0, 'rgba(110,255,140,.4)'); g.addColorStop(1, 'rgba(110,255,140,0)'); c.fillStyle = g; c.beginPath(); c.arc(x, z, r * 4, 0, TAU); c.fill();
      c.save(); c.translate(x, z); c.rotate(a); c.strokeStyle = '#ff9cb8'; c.lineWidth = Math.max(1.2, r * 0.18); c.beginPath(); c.moveTo(-r, 0); c.quadraticCurveTo(-r * 2, Math.sin(m.ph) * r * 0.8, -r * 2.6, Math.sin(m.ph + 1) * r * 0.5); c.stroke();
      c.fillStyle = '#8fd486'; c.beginPath(); c.ellipse(0, 0, r * 1.25, r * 0.85, 0, 0, TAU); c.fill(); c.fillStyle = '#b6f0a8'; c.beginPath(); c.arc(r * 0.6, -r * 0.62, r * 0.42, 0, TAU); c.arc(r * 0.6, r * 0.62, r * 0.42, 0, TAU); c.fill(); c.fillStyle = '#041006'; c.beginPath(); c.arc(r * 1.05, -r * 0.22, r * 0.13, 0, TAU); c.arc(r * 1.05, r * 0.22, r * 0.13, 0, TAU); c.fill(); c.restore();
    }
    // the donut
    const D = this.donut, dx = X(D.x), dz = Z(D.z), dr = s * 0.62;
    if (this.state !== 'got' && !(this.over && this.why === 'eaten')) {
      c.save(); c.translate(dx, dz); c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(dr * 0.12, dr * 0.16, dr, dr * 0.9, 0, 0, TAU); c.fill();
      c.rotate(D.roll);
      c.fillStyle = '#d9a35c'; c.beginPath(); c.arc(0, 0, dr, 0, TAU); c.arc(0, 0, dr * 0.3, 0, TAU, true); c.fill();
      c.fillStyle = '#f08fb4'; c.beginPath(); c.arc(0, 0, dr * 0.88, 0, TAU); c.arc(0, 0, dr * 0.4, 0, TAU, true); c.fill();
      for (let i = 0; i < 9; i++) { const a = i * 2.4 + 0.3, rr = dr * (0.52 + (i % 3) * 0.12); c.fillStyle = SPR[(i + 1) % 5]; c.save(); c.translate(Math.cos(a) * rr, Math.sin(a) * rr); c.rotate(a * 2.1); c.fillRect(-dr * 0.1, -dr * 0.03, dr * 0.2, dr * 0.07); c.restore(); }
      c.fillStyle = '#414d63'; for (let i = 0; i < BITES - D.bites; i++) { const a = i * TAU / BITES + 0.5; c.beginPath(); c.arc(Math.cos(a) * dr * 0.98, Math.sin(a) * dr * 0.98, dr * 0.36, 0, TAU); c.fill(); }
      c.restore();
    }
    // the guard, on the chair
    const ch = this.chair, cx = X(ch.x), cz = Z(ch.z), cr = s * 0.64;
    { const g = c.createRadialGradient(cx, cz, cr * 0.4, cx, cz, cr * 2.6); g.addColorStop(0, 'rgba(255,244,214,.2)'); g.addColorStop(1, 'rgba(255,244,214,0)'); c.fillStyle = g; c.beginPath(); c.arc(cx, cz, cr * 2.6, 0, TAU); c.fill(); }      // a pool of light to be found by
    c.save(); c.translate(cx, cz); c.fillStyle = 'rgba(0,0,0,.36)'; c.beginPath(); c.arc(cr * 0.1, cr * 0.14, cr * 1.05, 0, TAU); c.fill();
    if (ch.coffee > 0) { c.strokeStyle = `rgba(255,224,150,${0.35 + 0.25 * Math.sin(t * 20)})`; c.lineWidth = 3; c.beginPath(); c.arc(0, 0, cr * 1.3, 0, TAU); c.stroke(); }
    c.save(); c.rotate(ch.spin); c.strokeStyle = '#b9c2d2'; c.lineWidth = Math.max(2, cr * 0.16); c.lineCap = 'round'; for (let i = 0; i < 5; i++) { const a = i * TAU / 5; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a) * cr * 1.05, Math.sin(a) * cr * 1.05); c.stroke(); c.fillStyle = '#15171c'; c.beginPath(); c.arc(Math.cos(a) * cr * 1.05, Math.sin(a) * cr * 1.05, cr * 0.14, 0, TAU); c.fill(); } c.restore();
    c.rotate(-ch.face + Math.PI / 2 + ch.spin * 0.25);
    c.fillStyle = '#141821'; c.beginPath(); c.roundRect(-cr * 0.95, -cr * 0.78, cr * 0.5, cr * 1.56, cr * 0.2); c.fill();           // the chair's back
    c.fillStyle = '#4f74c4'; c.beginPath(); c.ellipse(0, 0, cr * 0.72, cr * 0.8, 0, 0, TAU); c.fill();                              // shoulders
    c.fillStyle = '#4266b0'; c.beginPath(); c.ellipse(cr * 0.5, -cr * 0.52, cr * 0.36, cr * 0.17, 0.5, 0, TAU); c.ellipse(cr * 0.5, cr * 0.52, cr * 0.36, cr * 0.17, -0.5, 0, TAU); c.fill();      // arms, reaching
    c.fillStyle = '#f0c49c'; c.beginPath(); c.arc(cr * 0.82, -cr * 0.66, cr * 0.13, 0, TAU); c.arc(cr * 0.82, cr * 0.66, cr * 0.13, 0, TAU); c.fill();
    c.fillStyle = '#1d2a4c'; c.beginPath(); c.arc(cr * 0.06, 0, cr * 0.44, 0, TAU); c.fill(); c.fillStyle = '#131c33'; c.beginPath(); c.ellipse(cr * 0.36, 0, cr * 0.26, cr * 0.4, 0, -1.4, 1.4); c.fill();      // the cap and its peak
    c.fillStyle = '#e2cd94'; c.beginPath(); c.arc(cr * 0.2, 0, cr * 0.09, 0, TAU); c.fill();
    c.restore();
    // which way it went, if it is off the screen
    if (this.state === 'play' && (dx < 14 || dx > W - 14 || dz < 14 || dz > H - 14)) {
      const a = Math.atan2(dz - cz, dx - cx), m = 30, px = clamp(dx, m, W - m), pz = clamp(dz, m + 30, H - m);
      c.save(); c.translate(px, pz); c.rotate(a); c.fillStyle = '#f08fb4'; c.beginPath(); c.moveTo(14, 0); c.lineTo(-8, -10); c.lineTo(-3, 0); c.lineTo(-8, 10); c.closePath(); c.fill(); c.restore();
      c.fillStyle = '#f7c6d8'; c.font = '700 11px ui-monospace, Menlo, monospace'; c.fillText(Math.round(Math.hypot(D.x - ch.x, D.z - ch.z)) + ' m', px - Math.cos(a) * 26, pz - Math.sin(a) * 26);
    }
    // what was just said over something
    c.font = `700 ${clamp(Math.floor(s * 0.42), 10, 14)}px ui-monospace, Menlo, monospace`;
    for (const p of this.pops) { c.globalAlpha = 1 - p.t; c.fillStyle = '#fff3c8'; c.fillText(p.text, X(p.x), Z(p.z) - s * 0.8 - p.t * 26); } c.globalAlpha = 1;
    this._hud(c, W, H);
  }
  _hud(c, W, H) {
    const mono = n => `700 ${n}px ui-monospace, Menlo, Consolas, monospace`, small = W < 460;
    c.textBaseline = 'middle';
    if (this.state === 'title') {
      c.fillStyle = 'rgba(5,7,12,.72)'; c.fillRect(0, 0, W, H);
      c.textAlign = 'center'; c.fillStyle = '#f08fb4'; c.font = mono(small ? 34 : 46); c.fillText('LAST DONUT', W / 2, H * 0.3);
      c.fillStyle = '#efe8d8'; c.font = mono(small ? 12 : 14);
      const lines = ['It has rolled off the desk.', 'It is getting away.', '', small ? 'Drag to push the chair.' : 'Arrows or WASD push the chair.', small ? 'PUSH OFF for a shove.' : 'Space: PUSH OFF (best with a wall behind you).', 'Shoo the mice. Drink the coffee.', 'Be back before the radio goes.'];
      lines.forEach((l, i) => c.fillText(l, W / 2, H * 0.3 + 46 + i * (small ? 18 : 21)));
      c.fillStyle = '#e2cd94'; c.font = mono(small ? 14 : 16); if (Math.floor(this.t * 2) % 2 === 0) c.fillText(small ? 'TAP TO START' : 'PRESS SPACE TO START', W / 2, H * 0.3 + 62 + lines.length * (small ? 18 : 21));
      if (this.best) { c.fillStyle = '#9fe6a0'; c.font = mono(12); c.fillText('HOUSE RECORD ' + this.best, W / 2, H - 22); }
      return;
    }
    // top strip: score, round, the radio
    c.fillStyle = 'rgba(5,7,12,.7)'; c.fillRect(0, 0, W, 30);
    c.textAlign = 'left'; c.font = mono(13); c.fillStyle = '#efe8d8'; c.fillText(`${this.score}`, 10, 16);
    c.fillStyle = '#8f99ab'; c.font = mono(10); c.fillText(small ? `D${this.round}` : `DONUT ${this.round}   BEST ${Math.max(this.best, this.score)}`, 10 + String(this.score).length * 9 + 10, 17);
    const bw = small ? W * 0.36 : 180, bx = W - bw - 10, f = clamp(this.time / this.limit, 0, 1), hot = this.time < 10;
    c.fillStyle = '#1b2230'; c.fillRect(bx, 9, bw, 13); c.fillStyle = hot ? (Math.floor(this.t * 6) % 2 ? '#ff4636' : '#ff9a52') : '#9fe6a0'; c.fillRect(bx + 1, 10, (bw - 2) * f, 11);
    c.textAlign = 'right'; c.fillStyle = hot ? '#ffb4a8' : '#8f99ab'; c.font = mono(10); c.fillText('RADIO ' + Math.max(0, Math.ceil(this.time)), bx - 8, 17);
    // the donut, what is left of it, and the push
    const D = this.donut, ix = 12, iy = 46;
    for (let i = 0; i < BITES; i++) { c.fillStyle = i < D.bites ? '#f08fb4' : '#3a3440'; c.beginPath(); c.moveTo(ix + 12, iy); c.arc(ix + 12, iy, 11, i * TAU / BITES - Math.PI / 2 + 0.06, (i + 1) * TAU / BITES - Math.PI / 2 - 0.06); c.closePath(); c.fill(); }
    c.fillStyle = '#090b10'; c.beginPath(); c.arc(ix + 12, iy, 4, 0, TAU); c.fill();
    const ch = this.chair; c.textAlign = 'left'; c.font = mono(10);
    c.fillStyle = ch.kick > 0 ? '#5a6272' : '#e2cd94'; c.fillText(ch.kick > 0 ? 'PUSH ...' : 'PUSH READY', ix + 32, iy - 6);
    if (ch.coffee > 0) { c.fillStyle = '#ffe096'; c.fillText('COFFEE ' + ch.coffee.toFixed(1), ix + 32, iy + 8); } else if (ch.wet) { c.fillStyle = '#9fd0ff'; c.fillText('WET FLOOR', ix + 32, iy + 8); }
    if (this.msg) {
      const y = this.over ? H * 0.36 : H * 0.24, hw = Math.min(W - 16, 520);
      c.fillStyle = 'rgba(5,7,12,.82)'; c.fillRect(W / 2 - hw / 2, y - 26, hw, this.over ? 112 : 58);
      c.strokeStyle = this.over ? '#ff7a5c' : '#e2cd94'; c.lineWidth = 1.5; c.strokeRect(W / 2 - hw / 2 + 0.5, y - 25.5, hw - 1, this.over ? 111 : 57);
      c.textAlign = 'center'; c.fillStyle = this.over ? '#ffb4a8' : '#f7e6b4'; c.font = mono(small ? 13 : 17); c.fillText(this.msg.head, W / 2, y - 6);
      c.fillStyle = '#efe8d8'; c.font = mono(small ? 10.5 : 12); if (this.msg.sub) c.fillText(this.msg.sub, W / 2, y + 16);
      if (this.over) { c.fillStyle = '#e2cd94'; c.font = mono(14); c.fillText(`SCORE ${this.score}${this.fresh ? '   A NEW HOUSE RECORD' : '   BEST ' + this.best}`, W / 2, y + 44); c.fillStyle = '#8f99ab'; c.font = mono(11); if (this.st > 1 && Math.floor(this.t * 2) % 2 === 0) c.fillText(small ? 'TAP FOR ANOTHER GO' : 'SPACE FOR ANOTHER GO', W / 2, y + 68); }
    }
  }
}

// ---------------------------------------------------------------- the tune
// Grieg's In the Hall of the Mountain King (1875): the creeping theme, round and round, faster as the radio
// runs down. `synth` is the feature kit's (k.synth.note(freq, dur, { type, vol, at })). Call tick(bpm) every
// frame while the game is on (0 for silence): notes are booked a little ahead on the audio clock.
const KING = [[59, 0.5], [61, 0.5], [62, 0.5], [64, 0.5], [66, 0.5], [62, 0.5], [66, 1], [65, 0.5], [61, 0.5], [65, 1], [64, 0.5], [60, 0.5], [64, 1],
  [59, 0.5], [61, 0.5], [62, 0.5], [64, 0.5], [66, 0.5], [62, 0.5], [66, 0.5], [71, 0.5], [69, 0.5], [66, 0.5], [62, 0.5], [66, 0.5], [69, 2]];
export class Tune {
  constructor(synth, now = () => performance.now() / 1000) { this.s = synth; this.now = now; this.i = 0; this.next = 0; this.beat = 0; this.on = false; }
  tick(bpm, vol = 0.045) {
    if (!bpm || !this.s) { this.on = false; return; }
    const t = this.now(); if (!this.on || this.next < t - 0.3) { this.on = true; this.next = t + 0.08; this.i = 0; this.beat = 0; }
    const b = 60 / bpm, hz = m => 440 * Math.pow(2, (m - 69) / 12);
    while (this.next < t + 0.22) {
      const [m, d] = KING[this.i], at = Math.max(0, this.next - t), up = this.loops > 1 ? 12 : 0;
      this.s.note(hz(m + up), Math.max(0.09, d * b * 0.8), { type: 'triangle', vol, at });
      if (this.beat % 1 === 0) this.s.note(hz(this.beat % 2 ? 42 : 47), 0.12, { type: 'sine', vol: vol * 1.3, at });      // pizzicato, underneath
      this.next += d * b; this.beat += d; if (++this.i >= KING.length) { this.i = 0; this.loops = (this.loops || 0) + 1; }
    }
  }
  stop() { this.on = false; this.loops = 0; }
}
