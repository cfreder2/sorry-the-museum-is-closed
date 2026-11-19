// The heist.
//
// In the security control room (there are two, at either end of the lower level) there is a plinth
// with a big red button. Press it and the building picks a gallery, and a picture in it, and fills
// the room with laser beams. A toy-sized copy of the picture stands on a plinth in the middle. Get
// to it, get it back to the button before the clock runs out, and do not touch a beam: three alarms
// are forgiven, the fourth ends it. It is theatre: the real picture never leaves the wall.
//
// src/heistplan.js decides the room, the route and the beams, and proves a car can get through
// them; this file draws them, runs the clock and keeps the score.
//
// For anything else that wants to know (trophies, say): this object carries `active`, `completed`,
// `clean` (runs with no alarm) and `best` ({ roomId: seconds }), and announces
//   window.dispatchEvent(new CustomEvent('museum:heist', { detail: { event: 'start' | 'trip' | 'grab' | 'win' | 'lose', room, time, trips } }))

import * as THREE from 'three';
import * as TX from './textures.js';
import { roomAt } from './plan.js';
import { way, targets, deal, gate, solve, beamAt, segDist2, inside, dice, hash, lasers } from './heistplan.js';

const KEY = 'after-hours.heist', FORGIVEN = 3, MAXB = 400;
const $ = id => document.getElementById(id);
const clock = s => { s = Math.max(0, s); const m = Math.floor(s / 60), r = Math.floor(s - m * 60); return `${m}:${r < 10 ? '0' : ''}${r}`; };
const LEVEL = { LL: 'the lower level', 1: 'the first floor', 2: 'the second floor', 3: 'the third floor' };
const RANKS = ['A GHOST', 'CAT BURGLAR', 'LIGHT FINGERS', 'BY A WHISKER'];
const roomName = r => (r.kind === 'hall' ? 'Griffin Court' : String(r.gallery || r.id).replace(/^Galleries /, 'Gallery '));

// Every beam in play, as one mesh: a strip for each, turned to face the camera, bright down the
// middle and hazy at the edges. No lights: it glows by being drawn over everything, added on.
class Beams {
  constructor(parent) {
    const g = this.geo = new THREE.BufferGeometry();
    this.pos = new Float32Array(MAXB * 12); this.alpha = new Float32Array(MAXB * 4);
    const uv = new Float32Array(MAXB * 8), idx = new Uint16Array(MAXB * 6);
    for (let i = 0; i < MAXB; i++) { uv.set([0, -1, 0, 1, 1, 1, 1, -1], i * 8); idx.set([i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3], i * 6); }
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('aA', new THREE.BufferAttribute(this.alpha, 1).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setIndex(new THREE.BufferAttribute(idx, 1));
    this.mesh = new THREE.Mesh(g, new THREE.ShaderMaterial({
      vertexShader: 'attribute float aA; varying vec2 vUv; varying float vA; void main() { vUv = uv; vA = aA; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'varying vec2 vUv; varying float vA; void main() { float d = abs(vUv.y); float core = smoothstep(0.22, 0.0, d); float haze = pow(1.0 - d, 3.0); float ends = smoothstep(0.0, 0.02, vUv.x) * smoothstep(1.0, 0.98, vUv.x); gl_FragColor = vec4((vec3(2.4, 0.3, 0.2) * core + vec3(0.22, 0.01, 0.006) * haze) * vA * ends, 1.0); }',
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    }));
    this.mesh.frustumCulled = false; this.mesh.renderOrder = 6;
    // The little boxes they come out of, and the posts at the corners.
    this.boxes = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: 0x16181c }), MAXB * 2 + 64);
    this.boxes.frustumCulled = false; this.boxes.count = 0;
    this.group = new THREE.Group(); this.group.add(this.mesh, this.boxes); this.group.visible = false; parent.add(this.group);
    this.o = {}; this.m = new THREE.Matrix4();
  }
  // sets: [{ beams, posts, t0 }]. `dim`: 0..1, how nearly out they are (just after an alarm, or as a new pattern comes up).
  draw(sets, now, cam, dim, calm) {
    const P = this.pos, A = this.alpha, o = this.o, m = this.m;
    let n = 0, k = 0;
    const box = (x, y, z, sx, sy, sz) => { if (k >= MAXB * 2 + 64) return; m.makeScale(sx, sy, sz); m.setPosition(x, y, z); this.boxes.setMatrixAt(k++, m); };
    for (const set of sets) {
      const t = now - set.t0, fade = Math.min(1, Math.max(0, (now - (set.shownAt || 0)) / 0.8));
      for (const b of set.beams) {
        if (n >= MAXB) break;
        beamAt(b, t, o);
        if (!b.net) { box(o.ax, o.ay, o.az, 0.07, 0.07, 0.07); if (b.k !== 'r') box(o.bx, o.by, o.bz, 0.07, 0.07, 0.07); }
        let a = o.on ? 1 : o.warn ? (calm ? 0.14 : 0.1 + 0.08 * Math.sin(now * 40)) : 0;      // about to come on: a dim flicker (steady, with motion reduced)
        if (!a) continue;
        a *= (b.net ? 0.22 : 1) * fade * (1 - 0.75 * dim);
        // Turn the strip to face the camera, and widen it with distance so it never thins to nothing.
        const dx = o.bx - o.ax, dy = o.by - o.ay, dz = o.bz - o.az, mx = (o.ax + o.bx) / 2 - cam.x, my = (o.ay + o.by) / 2 - cam.y, mz = (o.az + o.bz) / 2 - cam.z;
        let sx = dy * mz - dz * my, sy = dz * mx - dx * mz, sz = dx * my - dy * mx;
        const sl = Math.hypot(sx, sy, sz) || 1, w = Math.max(0.055, Math.hypot(mx, my, mz) * 0.0045) / sl;
        sx *= w; sy *= w; sz *= w;
        const i = n * 12;
        P[i] = o.ax - sx; P[i + 1] = o.ay - sy; P[i + 2] = o.az - sz; P[i + 3] = o.ax + sx; P[i + 4] = o.ay + sy; P[i + 5] = o.az + sz;
        P[i + 6] = o.bx + sx; P[i + 7] = o.by + sy; P[i + 8] = o.bz + sz; P[i + 9] = o.bx - sx; P[i + 10] = o.by - sy; P[i + 11] = o.bz - sz;
        A[n * 4] = A[n * 4 + 1] = A[n * 4 + 2] = A[n * 4 + 3] = a;
        n++;
      }
      for (const p of set.posts || []) box(p.x, p.y + p.h / 2, p.z, 0.05, p.h, 0.05);
    }
    this.count = n;
    this.geo.setDrawRange(0, n * 6); this.geo.attributes.position.needsUpdate = true; this.geo.attributes.aA.needsUpdate = true;
    this.boxes.count = k; this.boxes.instanceMatrix.needsUpdate = true;
    this.group.visible = n > 0 || k > 0;
  }
  clear() { this.count = 0; this.geo.setDrawRange(0, 0); this.boxes.count = 0; this.group.visible = false; }
}

export class Heist {
  constructor(G, ui) {
    this.G = G; this.ui = ui; this.plan = G.plan; this.state = 'idle'; this.briefing = false;
    this.attempts = 0; this.completed = 0; this.clean = 0; this.best = {};
    try { const s = JSON.parse(localStorage.getItem(KEY) || '{}'); this.attempts = s.attempts | 0; this.completed = s.completed | 0; this.clean = s.clean | 0; Object.assign(this.best, s.best || {}); } catch { /* no storage */ }
    this.consoles = (G.plan.heistConsoles || []).map(c => ({ ...c, sx: c.x + c.fx * 1.3, sz: c.z + c.fz * 1.3 }));
    const g = this.group = new THREE.Group(); G.museum.group.add(g);
    // The button on each console: the one thing in the room that pulses.
    const dome = new THREE.SphereGeometry(0.1, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    this.buttonMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 0.15, 0.1) });
    for (const c of this.consoles) {
      const b = new THREE.Mesh(dome, this.buttonMat); b.position.set(c.x + c.fx * 0.29, c.y + 0.395, c.z + c.fz * 0.29); g.add(b);
      const pool = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.2), new THREE.MeshBasicMaterial({ map: TX.radial(0, 1), color: new THREE.Color(0.4, 0.04, 0.03), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }));
      pool.rotation.x = -Math.PI / 2; pool.position.set(c.x + c.fx * 0.9, c.y + 0.02, c.z + c.fz * 0.9); pool.renderOrder = 4; g.add(pool);
    }
    this.beams = new Beams(g);
    // The plinth, and the treasure on it: a small copy of the picture in a gilt frame, turning slowly.
    const std = o => new THREE.MeshStandardMaterial(o);
    this.plinth = new THREE.Group(); this.plinth.visible = false; g.add(this.plinth);
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.16, 0.3, 16), std({ color: 0x24262c, roughness: 0.5, emissive: 0x14161a, emissiveIntensity: 0.6 })); col.position.y = 0.15; this.plinth.add(col);
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.02, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.0, 0.76, 0.26) })); rim.position.y = 0.31; this.plinth.add(rim);
    const t = this.treasure = new THREE.Group(); t.visible = false;
    this.frame = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 0.018), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.25, 0.95, 0.32) }));
    this.picMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.95, 0.92, 0.85) });
    this.picA = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), this.picMat); this.picB = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), this.picMat); this.picB.rotation.y = Math.PI;
    this.halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: TX.radial(0, 1), color: new THREE.Color(0.42, 0.31, 0.1), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); this.halo.scale.set(0.8, 0.8, 1);
    t.add(this.frame, this.picA, this.picB, this.halo); g.add(t);
    this.o = {}; this.prev = new THREE.Vector3(); this.sets = [];
    document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('[data-heist]'); if (!b || !this.briefing) return; e.stopPropagation(); if (b.dataset.heist === 'go') this.go(); else this.decline(); }, true);
    addEventListener('keydown', e => { if (!this.briefing || e.repeat) return; if (e.code === 'Enter' || e.code === 'Space' || e.code === 'KeyE') { e.preventDefault(); this.go(); } else if (e.code === 'Escape') { e.preventDefault(); this.decline(); } });
  }
  get active() { return this.state === 'in' || this.state === 'out'; }
  _save() { try { localStorage.setItem(KEY, JSON.stringify({ attempts: this.attempts, completed: this.completed, clean: this.clean, best: this.best })); } catch { /* fine */ } }
  _tell(event) { try { window.dispatchEvent(new CustomEvent('museum:heist', { detail: { event, room: this.target ? this.target.id : null, time: +(this.elapsed || 0).toFixed(1), trips: this.trips || 0 } })); } catch { /* fine */ } }

  // The console this toy is pulled up at, when there is nothing running.
  near(v) {
    if (this.state !== 'idle' || this.briefing) return null;
    for (const c of this.consoles) {
      const dy = v.pos.y - c.y;
      if (dy > -0.3 && dy < 2.4 && (v.pos.x - c.sx) ** 2 + (v.pos.z - c.sz) ** 2 < 1.6 * 1.6 && Math.hypot(v.vel.x, v.vel.z) < 3) return c;
    }
    return null;
  }

  // Tonight's target: a gallery for this attempt (the same one until the attempt is used), a route to it, and a picture in it.
  _pick(c) {
    const G = this.G, plan = this.plan;
    if (!this.nav) this.nav = way(plan);
    if (!this.rooms) this.rooms = targets(plan).filter(r => { const st = G.museum.rooms[r.id]; return st && st.arts.some(a => !a.mini); });
    const from = { x: c.sx, z: c.sz, y: c.y, room: c.room }, list = c.list || (c.list = []);      // (worked out once for each console: the building does not change)
    if (!c.listed) for (const r of this.rooms) {
      const first = lasers(plan, r, 0); if (!first) continue;
      const rt = this.nav.route(from, { x: first.plinth.x, z: first.plinth.z, y: r.y, room: r.id }); if (!rt) continue;
      const k = rt.pts.findIndex(p => p.door && p.room === r.id && Math.abs(p.door.y - r.y) < 0.3); if (k < 0) continue;
      list.push({ r, rt, k });
    }
    c.listed = true;
    if (!list.length) return null;
    const mid = list.filter(q => q.rt.len > 60 && q.rt.len < 340), pool = mid.length >= 4 ? mid : list, rnd = dice(hash('heist') + this.attempts * 7919);
    const q = pool[Math.floor(rnd() * pool.length) % pool.length], arts = G.museum.rooms[q.r.id].arts.filter(a => !a.mini), flat = arts.filter(a => !a.obj);
    const art = (flat.length ? flat : arts)[Math.floor(rnd() * (flat.length || arts.length)) % (flat.length || arts.length)];
    return { ...q, art, time: Math.round((95 + q.rt.len * 1.05) / 5) * 5 };
  }

  // The button is pressed: say what the job is, and wait for a yes.
  brief(c) {
    const p = this._pick(c);
    if (!p) { this.ui.say('The console hums, and thinks better of it. No gallery will do tonight.', 0, 5); return false; }
    this.pending = { ...p, console: c };
    const w = p.art.work;
    $('hbTitle').textContent = roomName(p.r);
    $('hbText').textContent = `Tonight's treasure is “${w.t}”${w.a ? ', ' + w.a : ''}. A toy-sized copy of it stands on a plinth in the middle of ${roomName(p.r)}, on ${LEVEL[p.r.floor] || 'another floor'}. The real one stays on the wall. Fetch the copy and bring it back to this button.`;
    $('hbFacts').innerHTML = `ABOUT ${Math.round(p.rt.len / 10) * 10} M AWAY<br>ON THE CLOCK <b>${clock(p.time)}</b><br>THE ROOM IS FULL OF LASERS<br>THREE ALARMS FORGIVEN` + (this.completed ? `<br>HEISTS DONE ${this.completed} · CLEAN ${this.clean}` : '') + (this.best[p.r.id] ? `<br>BEST HERE ${clock(this.best[p.r.id])}` : '');
    $('heistBrief').hidden = false; this.briefing = true;
    const first = $('heistBrief').querySelector('[data-first]'); if (first) first.focus({ preventScroll: true });
    return true;
  }
  decline() { this.briefing = false; this.pending = null; $('heistBrief').hidden = true; }

  go() {
    const p = this.pending, G = this.G, plan = this.plan; if (!p) return this.decline();
    this.decline();
    const seed = this.attempts, door = p.rt.pts[p.k].door;
    const set = deal(plan, p.r, seed, false, door);
    if (!set) { this.ui.say('The lasers would not come on. Try the button again.', 0, 5); this.attempts++; this._save(); return; }
    this.attempts++; this._save();
    this.seed = seed; this.target = p.r; this.door = door; this.art = p.art; this.console = p.console; this.route0 = p.rt;
    this.limit = p.time; this.left = p.time; this.elapsed = 0; this.trips = 0; this.now = 0; this.safeUntil = 0; this.dim = 0;
    this.doorIn = inside(door, p.r, 0.9); this.spot = set.plinth;
    set.t0 = 0; set.shownAt = 0; set.rect = p.r; set.main = true;
    this.sets = [set];
    // A gate round the doorway on the near side, if the room before has the floor for it and it can be passed both ways.
    const before = p.rt.pts[p.k - 1], r2 = before && before.door === door ? plan.byId[before.room] : null, entry = p.rt.pts[p.k - 2];
    this.back = null;
    if (r2 && r2.id !== p.console.room) {
      const from = entry && entry.room === r2.id ? entry : null, g = gate(plan, r2, door, from, seed), ins = inside(door, r2, 0.9), far = from || { x: (r2.x0 + r2.x1) / 2, z: (r2.z0 + r2.z1) / 2 };
      if (g && solve(plan, r2, g.beams, far, ins, { reach: 0.5 }) >= 0 && solve(plan, r2, g.beams, ins, far, { reach: 0.6 }) >= 0) {
        g.t0 = 0; g.shownAt = 0; g.rect = r2; this.sets.push(g);
        this.back = from && from.door ? inside(from.door, r2, 0.9) : { x: far.x, z: far.z, y: r2.y, yaw: Math.atan2(ins.x - far.x, ins.z - far.z) };
      }
    }
    // The treasure, on its plinth.
    const a = p.art, k = Math.min(1.6, Math.max(0.6, (a.w || 1) / (a.h || 1))), pw = k >= 1 ? 0.22 : 0.22 * k, ph = k >= 1 ? 0.22 / k : 0.22;
    this.frame.scale.set(pw + 0.035, ph + 0.035, 1); this.picA.scale.set(pw, ph, 1); this.picB.scale.set(pw, ph, 1); this.picA.position.z = 0.0095; this.picB.position.z = -0.0095;
    this.th = ph + 0.035;
    this.plinth.position.set(set.plinth.x, p.r.y, set.plinth.z); this.plinth.visible = true;
    this._home(); this.treasure.visible = true;
    this.state = 'in'; this.prev.set(0, -999, 0); this.routeAt = -9; this.shown = {};
    $('heist').hidden = false; $('pAbandon').hidden = false; document.body.classList.add('heisting');
    this._goal();
    this.ui.callout('THE HEIST IS ON'); G.sound.gate();
    this.ui.say(`To ${roomName(p.r)}, on ${LEVEL[p.r.floor] || 'another floor'}. Follow the arrow. Mind the beams.`, 0.8, 7);
    this._tell('start');
  }
  _home() { const t = this.treasure; if (t.parent !== this.group) this.group.add(t); t.position.set(this.spot.x, this.target.y + 0.33 + this.th / 2 + 0.03, this.spot.z); t.rotation.set(0, 0, 0); this.halo.visible = true; }
  // Where to now: the plinth, or the button. The map and the route light are told too, if they are there.
  _goal() {
    const G = this.G, c = this.console;
    this.goal = this.state === 'out' ? { x: c.sx, y: c.y, z: c.sz, room: c.room, label: 'The security control room' } : { x: this.spot.x, y: this.target.y, z: this.spot.z, room: this.target.id, label: roomName(this.target) };
    G.mapMarks = [{ x: this.goal.x, y: this.goal.y, z: this.goal.z, colour: '#ff5040', ring: true }];
    if (G.nav && G.nav.goTo) try { G.nav.goTo({ x: this.goal.x, y: this.goal.y, z: this.goal.z, label: this.goal.label }); } catch { /* the map is somebody else's */ }
    this.routeAt = -9;
  }

  // Once a frame while driving.
  update(dt, v) {
    const G = this.G;
    if (!this.active) { this.buttonMat.color.setRGB(1.5 + 0.9 * Math.sin(G.t * 3), 0.15, 0.1); return; }
    this.buttonMat.color.setRGB(this.state === 'out' ? 1.5 + 0.9 * Math.sin(G.t * 9) : 0.5, 0.15, 0.1);
    this.now += dt; this.elapsed += dt; this.left -= dt;
    const drone = v.kind === 'drone', cx = v.pos.x, cy = v.pos.y + (drone ? 0 : 0.11), cz = v.pos.z, rad = drone ? 0.24 : 0.2;
    if (this.left <= 0) return this._lose('time');
    // Touching a beam: the path flown since the last frame against every lit beam near enough to matter.
    const jumped = this.prev.y < -900 || this.prev.distanceToSquared(v.pos) > 9;
    if (jumped) this.prev.set(cx, cy, cz);
    if (this.now > this.safeUntil) {
      const o = this.o;
      scan: for (const set of this.sets) {
        const q = set.rect; if (cx < q.x0 - 1 || cx > q.x1 + 1 || cz < q.z0 - 1 || cz > q.z1 + 1 || cy < q.y - 1 || cy > q.y + 5) continue;
        const t = this.now - set.t0;
        for (const b of set.beams) {
          beamAt(b, t, o);
          if (o.on && segDist2(this.prev.x, this.prev.y, this.prev.z, cx, cy, cz, o.ax, o.ay, o.az, o.bx, o.by, o.bz) < rad * rad) { this.lastTrip = { x: cx, y: cy, z: cz, kind: b.k, at: this.now }; this._trip(v, set); break scan; }
        }
      }
    }
    if (!this.active) return;
    this.prev.set(v.pos.x, v.pos.y + (drone ? 0 : 0.11), v.pos.z);
    this.dim += ((this.now < this.safeUntil ? 1 : 0) - this.dim) * Math.min(1, dt * 6);
    // The treasure: turning on its plinth, or riding on the roof, or slung underneath.
    const t = this.treasure;
    if (this.picMat.map !== this.art.mat.map) { this.picMat.map = this.art.mat.map; this.picMat.needsUpdate = true; }
    if (this.state === 'in') {
      t.rotation.y = G.t * 0.9; t.position.y = this.target.y + 0.33 + this.th / 2 + 0.03 + 0.02 * Math.sin(G.t * 2);
      const d = Math.hypot(v.pos.x - this.spot.x, v.pos.z - this.spot.z);
      if (d < (drone ? 0.7 : 0.78) && v.pos.y - this.target.y < 1.3 && v.pos.y > this.target.y - 0.3) this._grab(v);
    } else {
      if (t.parent !== v.group) { v.group.add(t); this.halo.visible = false; }
      if (drone) { t.position.set(0, -0.1 - this.th / 2, 0); t.rotation.set(0, 0, 0); } else { t.position.set(0, 0.2, -0.04); t.rotation.set(-1.25, 0, 0); }
      const c = this.console;
      if (Math.hypot(v.pos.x - c.sx, v.pos.z - c.sz) < 1.9 && Math.abs(v.pos.y - c.y) < 2.6) return this._win();
    }
    this.beams.draw(this.sets, this.now, G.camera.position, this.dim, G.set.reduce);
    this._hud(v);
  }

  _grab(v) {
    const G = this.G;
    this.state = 'out';
    // The room deals itself again for the way out, with the turning beam on the far side of the plinth from the toy.
    const from = { x: v.pos.x, z: v.pos.z }, phase = Math.atan2(v.pos.z - this.spot.z, v.pos.x - this.spot.x) + Math.PI;
    const set = deal(this.plan, this.target, this.seed, true, this.door, { from, phase });
    this.sets = this.sets.filter(s => !s.main);
    if (set) { set.t0 = this.now; set.shownAt = this.now; set.rect = this.target; set.main = true; this.sets.unshift(set); }
    this.safeUntil = this.now + 2;
    v.vel.multiplyScalar(0.12); if (typeof v.speed === 'number') v.speed *= 0.12;      // it pulls up to take it: nobody coasts on into the new beams
    this.ui.callout('GOT IT'); G.sound.perfect();
    this.ui.say('Now back to the button in the security control room. The beams have moved.', 0.6, 7);
    this._goal(); this._tell('grab');
  }

  _trip(v, set) {
    const G = this.G;
    this.trips++; this._tell('trip');
    this._alarm();
    if (this.trips > FORGIVEN) return this._lose('caught');
    // Back to the doorway: of the target room, or of the room before if that is where the beam was.
    const p = set.main || this.state === 'out' || !this.back ? this.doorIn : this.back;
    v.place(p.x, p.z, p.yaw || 0, v.kind === 'drone' ? p.y + 0.7 : p.y);
    G.camYaw = v.yaw; this.prev.set(0, -999, 0); this.safeUntil = this.now + 1.8;
    const left = FORGIVEN - this.trips;
    this.ui.callout('ALARM!'); this.ui.say(left ? `Back to the doorway. ${left === 1 ? 'One more alarm is' : left + ' more alarms are'} forgiven.` : 'Back to the doorway. That was the last alarm they will forgive.', 0, 5);
  }
  _alarm() {
    const s = this.G.sound, el = $('heistFlash');
    for (let i = 0; i < 6; i++) setTimeout(() => s.beep(i % 2 ? 660 : 880, 0.16, 0.07), i * 180);
    el.classList.remove('on'); void el.offsetWidth; el.classList.add('on');
  }

  _win() {
    const G = this.G, id = this.target.id, time = this.elapsed, was = this.best[id];
    this.completed++; if (!this.trips) this.clean++;
    const record = !(was > 0) || time < was; if (record) this.best[id] = +time.toFixed(1);
    this._save(); this._tell('win');
    this.ui.callout(`HEIST COMPLETE\n${RANKS[Math.min(this.trips, 3)]}`); G.sound.finish();
    this.ui.say(`“${this.art.work.t}”, out of ${roomName(this.target)} in ${clock(time)}${this.trips ? `, with ${this.trips} alarm${this.trips > 1 ? 's' : ''}` : ', and not a beam touched'}.${record && was ? ' A new best for that room.' : ''} The copy goes in the lost property box.`, 1.2, 10);
    this._end();
  }
  _lose(why) {
    this._tell('lose');
    this.ui.callout('THE HEIST IS OFF');
    this.ui.say(why === 'time' ? 'The clock ran out. The lasers go dark, the copy goes back on its plinth, and the guards never knew.' : 'One alarm too many. The lasers go dark, and the guards never knew. The button will be there tomorrow.', 0.8, 9);
    this.G.sound.bump(2);
    this._end();
  }
  // Walk away from it: from the pause menu, or because the game itself is ending.
  abandon(quiet) { if (this.briefing) this.decline(); if (!this.active) return; this._tell('lose'); if (!quiet) this.ui.say('The heist is off. The lasers go dark, and the guards never knew.', 0.3, 6); this._end(); }
  // Everything back as it was.
  _end() {
    const G = this.G;
    this.state = 'idle'; this.sets = []; this.beams.clear();
    this.plinth.visible = false; this.treasure.visible = false; if (this.treasure.parent !== this.group) this.group.add(this.treasure);
    this.picMat.map = null; this.picMat.needsUpdate = true;
    $('heist').hidden = true; $('pAbandon').hidden = true; document.body.classList.remove('heisting'); $('heistFlash').classList.remove('on');
    G.mapMarks = [];
    if (G.nav && G.nav.clear) try { G.nav.clear(); } catch { /* the map is somebody else's */ }
    this.goal = null; this.target = null; this.pending = null;
  }

  // The clock, the alarms left, and an arrow to the next doorway on the way.
  _hud(v) {
    const G = this.G, s = this.shown;
    if (this.now - this.routeAt > 1.2 || G.roomId !== this.routeRoom) {
      this.routeAt = this.now; this.routeRoom = G.roomId;
      const here = roomAt(this.plan, v.pos.x, v.pos.z, v.pos.y);
      const rt = here ? this.nav.route({ x: v.pos.x, y: v.kind === 'drone' && v.pos.y - here.y < 4 ? here.y : v.pos.y, z: v.pos.z, room: here.id }, this.goal) : null;
      if (rt || !here) this.route = rt;                  // (half way up a stair there is no answer: keep the last one)
    }
    let p = this.goal, dist = Math.hypot(p.x - v.pos.x, p.z - v.pos.z);
    if (this.route) { dist = this.route.len; p = this.route.pts.find(q => Math.hypot(q.x - v.pos.x, q.z - v.pos.z) > 1.3) || this.goal; }
    const a = Math.atan2(p.x - v.pos.x, p.z - v.pos.z) - G.camYaw, ang = -Math.atan2(Math.sin(a), Math.cos(a)), dy = p.y - v.pos.y + (v.kind === 'drone' ? 0.6 : 0);
    $('hArrow').firstElementChild.style.transform = `rotate(${ang}rad)`;
    const set = (id, text) => { if (s[id] !== text) { s[id] = text; $(id).textContent = text; } };
    set('hClock', clock(this.left));
    set('hTrips', `ALARMS LEFT ${Math.max(0, FORGIVEN - this.trips)}`);
    set('hGoal', this.state === 'out' ? 'BACK TO THE BUTTON' : roomName(this.target).toUpperCase());
    set('hDist', `${Math.round(dist)} m` + (Math.abs(dy) > 1.5 ? (dy > 0 ? ' ▲' : ' ▼') : ''));
    $('heist').classList.toggle('late', this.left < 30);
  }
}
