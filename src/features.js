// The shared kit for things to find and do. Every gallery set-piece, little secret and outdoor game is a
// "feature": a plain object registered here, which main.js runs through one hook. Nothing else in main.js
// has to change to add one. Use this, and the helpers below, rather than writing your own.
// A worked example, start to finish: src/lostfound.js (placed once, instanced, carried, handed in, counted).
//
//   import { feature } from './features.js';
//   feature({
//     id: 'rain201',
//     secrets: [['rain201', 'Rain indoors']],          // registered with the Secrets screen (src/secrets.js)
//     init(k) { ... build meshes into k.group ... },     // once, after the museum is built
//     active(k) { return k.inRoom('G201', 1); },        // optional: update() only runs while this is true (cheap test)
//     update(dt, k) { ... },                            // per frame while active (and while the game is in play or a look)
//     near(v, k) { return k.close(this.at, 1.6) ? { verb: 'PLAY', hint: 'A piano. E to play.', act: () => ... } : null },
//     onLook(art, k) { if (/Rainy Day/.test(art.work.t)) ... },   // the player has just stepped up to look at a work
//     spots() { return [{ kind: 'secret', id: 'rain201', name: 'Rain indoors', x, y, z }] },   // for the ?secrets debug map
//     reset(k) { ... },                                 // a new night: put things back
//     fresh(k) { ... },                                 // a new game (not just a new start): forget what was kept between visits
//   });
//
// The kit `k` handed to every call:
//   k.G, k.plan, k.museum, k.sound, k.stage, k.THREE, k.group (a THREE.Group already in the scene)
//   k.find(id)            -> true the first time: a secret found (toast and count handled by the Secrets system)
//   k.say(text, hold), k.once(key, text, hold), k.callout(TEXT)
//   k.v                   the toy now; k.pos its position; k.room the room it is in (or null outdoors)
//   k.inRoom(id | id[], around = 0)   in that room, or within `around` metres of it on the same level
//   k.close(p, r, dy = 1.5)          within r metres of {x,y,z} (and dy vertically)
//   k.chips(n)            give n chips (negative to take; returns false if there are not enough)
//   k.carry               what the toy is carrying: k.carry.take(item), k.carry.has(id), k.carry.drop(id), k.carry.list
//   k.synth               small synthesised sounds: k.synth.note(freq, dur, opts), k.synth.chime(freqs), k.synth.noise(dur, opts)
//   k.camClose            set to { at: {x,y,z}, look: {x,y,z} } from update() to stand the chase camera there this frame (inside a small
//                         enclosure, say, where the usual camera behind the toy would end up in a wall). Cleared before each update round.
//   k.tally(key, total)   a set of things to collect across the building, remembered between visits:
//                         t.add(id) (true if new), t.has(id), t.count, t.total, t.done
//   k.tint(roomId)        light a room differently: .set(color, secs), .off(secs)   (see the end of this file)
//   k.course(gates, opts) a timed run through gates in order: .start(), .update(dt), .fail(why)   (ditto)
//   k.roofAt(x, z), k.roofSolid(piece, mat), k.parts()   up on the roofs, and drawing many small things cheaply (see "added for the roofs")

import { confine } from './plan.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const features = [];
const SKY_TOP = 40;          // k.roofAt looks no higher than this

// ---------------------------------------------------------------- one mesh per material (k.parts)
class Parts {
  constructor(THREE) { this.T = THREE; this.by = new Map(); this.m = new THREE.Matrix4(); this.q = new THREE.Quaternion(); this.e = new THREE.Euler(); this.v = new THREE.Vector3(); this.s = new THREE.Vector3(); }
  add(geo, mat, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) {
    let g = geo.index ? geo.toNonIndexed() : geo.clone();
    for (const n of Object.keys(g.attributes)) if (n !== 'position' && n !== 'normal' && n !== 'uv') g.deleteAttribute(n);
    if (!g.attributes.uv) g.setAttribute('uv', new this.T.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    if (x && x.isMatrix4) g.applyMatrix4(x);
    else g.applyMatrix4(this.m.compose(this.v.set(x, y, z), this.q.setFromEuler(this.e.set(rx, ry, rz)), this.s.set(sx, sy, sz)));
    if (!this.by.has(mat)) this.by.set(mat, []);
    this.by.get(mat).push(g); return this;
  }
  done(parent) {
    const out = [];
    for (const [mat, list] of this.by) {
      const m = new this.T.Mesh(mergeGeometries(list), mat); m.matrixAutoUpdate = false; m.updateMatrix(); m.receiveShadow = true;
      for (const g of list) g.dispose();
      if (parent) parent.add(m); out.push(m);
    }
    this.by.clear(); return out;
  }
}
export function feature(f) { features.push(f); return f; }

// ---------------------------------------------------------------- carrying
// One thing-on-the-car system for everything that is picked up and taken somewhere (lost property, the lance,
// the mask, a key...). An item: { id, mesh (THREE.Object3D, carried on the car's roof), onDrop? }.
class Carry {
  constructor(k) { this.k = k; this.list = []; }
  // Three things, or as many as the toy in use is built to carry (a long one, more: garage spec.carry).
  get max() { const v = this.k.G.vehicle; return (v && v.spec && v.spec.carry) || 3; }
  has(id) { return this.list.some(i => i.id === id); }
  take(item) {
    if (this.has(item.id)) return true;
    if (this.list.length >= this.max) { this.k.say('Your hands are full: take something back first.', 3); return false; }
    this.list.push(item); this._mount(); return true;
  }
  drop(id) { const i = this.list.findIndex(q => q.id === id); if (i < 0) return null; const [it] = this.list.splice(i, 1); if (it.mesh && it.mesh.parent) it.mesh.parent.remove(it.mesh); this._mount(); return it; }
  clear() { for (const it of [...this.list]) this.drop(it.id); }
  _mount() {
    const g = this.k.G.vehicle && this.k.G.vehicle.group; if (!g) return;
    const long = this.max > 3;                     // (a long toy carries them nose to tail, down its roof and bed)
    this.list.forEach((it, n) => { if (!it.mesh) return; if (it.mesh.parent !== g) g.add(it.mesh); if (long) it.mesh.position.set(0, 0.22 + (it.lift || 0), 0.14 - n * 0.11); else it.mesh.position.set((n - (this.list.length - 1) / 2) * 0.09, 0.2 + (it.lift || 0), -0.03); });
  }
}

// ---------------------------------------------------------------- sound
// A few plain voices on the game's own audio context, so features do not each build their own.
function synth(sound) {
  const ctx = () => sound && (sound.ctx || sound.ac || sound.audio);
  const out = () => sound && (sound.master || sound.out || sound.bus) || (ctx() && ctx().destination);
  return {
    note(freq, dur = 0.4, { type = 'triangle', vol = 0.08, at = 0, attack = 0.01 } = {}) {
      const c = ctx(); if (!c || c.state !== 'running') return;
      const t = c.currentTime + at, o = c.createOscillator(), g = c.createGain();
      o.type = type; o.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + attack); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(out()); o.start(t); o.stop(t + dur + 0.05);
    },
    chime(freqs, { gap = 0.18, dur = 1.6, vol = 0.06 } = {}) { freqs.forEach((f, i) => this.note(f, dur, { type: 'sine', vol, at: i * gap })); },
    noise(dur = 0.3, { vol = 0.05, at = 0, lp = 1800 } = {}) {
      const c = ctx(); if (!c || c.state !== 'running') return;
      const t = c.currentTime + at, n = Math.ceil(c.sampleRate * dur), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
      const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(); s.buffer = b; f.type = 'lowpass'; f.frequency.value = lp; g.gain.value = vol;
      s.connect(f); f.connect(g); g.connect(out()); s.start(t);
    },
  };
}

// ---------------------------------------------------------------- specks (k.puffs)
let _speck = null;
function speckTex(THREE) {
  if (_speck) return _speck;
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, '#fff'); r.addColorStop(0.35, 'rgba(255,255,255,0.55)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  return (_speck = new THREE.CanvasTexture(c));
}
class Puffs {
  constructor(k, max, { color = 0xffffff, size = 0.14 } = {}) {
    const T = k.THREE; this.max = max; this.live = 0; this.c0 = new T.Color(color); this.tc = new T.Color();
    this.p = new Float32Array(max * 3).fill(-999); this.c = new Float32Array(max * 3); this.v = new Float32Array(max * 3); this.age = new Float32Array(max); this.life = new Float32Array(max); this.col = new Float32Array(max * 3); this.i = 0;
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(this.p, 3)); g.setAttribute('color', new T.BufferAttribute(this.c, 3));
    this.points = new T.Points(g, new T.PointsMaterial({ size, map: speckTex(T), vertexColors: true, transparent: true, blending: T.AdditiveBlending, depthWrite: false, sizeAttenuation: true, fog: false }));
    this.points.frustumCulled = false; this.points.visible = false; k.group.add(this.points);
  }
  emit(x, y, z, n = 8, { spread = 0.2, up = 0.6, life = 1.2, color = null, out = 0.5 } = {}) {
    const col = color == null ? this.c0 : this.tc.set(color);
    for (let q = 0; q < n; q++) {
      const i = this.i = (this.i + 1) % this.max, j = i * 3, a = Math.random() * 6.283, s = Math.random();
      this.p[j] = x + Math.cos(a) * spread * s; this.p[j + 1] = y + (Math.random() - 0.5) * spread * 0.5; this.p[j + 2] = z + Math.sin(a) * spread * s;
      this.v[j] = Math.cos(a) * out * (0.4 + s); this.v[j + 1] = up * (0.6 + Math.random() * 0.8); this.v[j + 2] = Math.sin(a) * out * (0.4 + s);
      this.age[i] = 0; this.life[i] = life * (0.7 + Math.random() * 0.6); this.col[j] = col.r; this.col[j + 1] = col.g; this.col[j + 2] = col.b;
    }
    this.live = Math.max(this.live, 1); this.points.visible = true;
  }
  update(dt) {
    if (!this.live) return;
    let alive = 0;
    for (let i = 0; i < this.max; i++) {
      const j = i * 3; if (this.age[i] >= this.life[i]) { if (this.c[j] || this.c[j + 1] || this.c[j + 2]) { this.c[j] = this.c[j + 1] = this.c[j + 2] = 0; this.p[j + 1] = -999; } continue; }
      alive++; this.age[i] += dt; const f = Math.max(0, 1 - this.age[i] / this.life[i]), d = Math.exp(-1.6 * dt);
      this.v[j] *= d; this.v[j + 2] *= d; this.v[j + 1] = this.v[j + 1] * d - 0.25 * dt;
      this.p[j] += this.v[j] * dt; this.p[j + 1] += this.v[j + 1] * dt; this.p[j + 2] += this.v[j + 2] * dt;
      const b = f * f; this.c[j] = this.col[j] * b; this.c[j + 1] = this.col[j + 1] * b; this.c[j + 2] = this.col[j + 2] * b;
    }
    this.points.geometry.attributes.position.needsUpdate = true; this.points.geometry.attributes.color.needsUpdate = true;
    if (!alive) { this.live = 0; this.points.visible = false; }
  }
}

// ---------------------------------------------------------------- shared helpers (k.solid, k.timer, k.pushable)
function blockMesh(THREE, s, mat) {
  const hAt = (x, z) => s.axis === 'x' ? s.h0 + (s.h1 - s.h0) * (x - s.x0) / (s.x1 - s.x0) : s.axis === 'z' ? s.h0 + (s.h1 - s.h0) * (z - s.z0) / (s.z1 - s.z0) : s.h0;
  const c = [[s.x0, s.z0], [s.x1, s.z0], [s.x1, s.z1], [s.x0, s.z1]], top = c.map(([x, z]) => hAt(x, z)), bot = top.map(h => s.thick ? h - s.thick : (s.base || 0));
  const P = [], V = (i, up) => { const [x, z] = c[i]; P.push(x, up ? top[i] : bot[i], z); };
  const quad = (a, b, cc, d) => { for (const [i, u] of [a, b, cc, a, cc, d]) V(i, u); };
  quad([0, 1], [3, 1], [2, 1], [1, 1]); quad([0, 0], [1, 0], [2, 0], [3, 0]);
  for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; quad([i, 0], [i, 1], [j, 1], [j, 0]); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.computeVertexNormals();
  const m = new THREE.Mesh(g, mat); m.receiveShadow = true; m.matrixAutoUpdate = false; m.updateMatrix(); return m;
}
const _in = (q, p) => !!q && p.x > q.x0 && p.x < q.x1 && p.z > q.z0 && p.z < q.z1 && (q.y0 == null || p.y > q.y0) && (q.y1 == null || p.y < q.y1);
let _hud = null;
const fmt = t => t.toFixed(2) + ' s';
class Timer {
  constructor(k, o) {
    this.k = k; this.o = { limit: 90, min: 2, ...o }; this.state = 'idle'; this.t = 0;
    try { this.best = parseFloat(localStorage.getItem('ah.best.' + o.id)) || null; } catch { this.best = null; }
  }
  hud(text, hold) {
    if (!_hud) { _hud = document.createElement('div'); _hud.id = 'featTimer'; _hud.style.cssText = 'position:fixed;top:calc(env(safe-area-inset-top) + 58px);left:50%;transform:translateX(-50%);padding:4px 12px;border-radius:10px;background:rgba(10,14,22,.62);color:#f3efe2;font:600 17px/1.3 ui-monospace,Menlo,monospace;letter-spacing:.04em;pointer-events:none;z-index:30;text-align:center'; document.body.append(_hud); }
    _hud.hidden = !text; _hud.textContent = text || ''; clearTimeout(this._off); if (hold) this._off = setTimeout(() => { if (_hud) _hud.hidden = true; }, hold * 1000);
  }
  cancel(why) { if (this.state === 'running') { this.hud(null); if (why) this.k.say(why, 2.5); } this.state = 'idle'; }
  update(dt) {
    const p = this.k.pos, o = this.o, inS = _in(o.start, p);
    if (this.state === 'idle') { if (inS) this.state = 'armed'; return; }
    if (this.state === 'armed') {
      if (inS) return;
      if (o.inside && !o.inside(p)) { this.state = 'idle'; return; }
      this.state = 'running'; this.t = 0; if (o.onStart) o.onStart(); return;
    }
    this.t += dt;
    if (inS) { this.state = 'armed'; this.hud(null); return; }            // back over the start line: ready to go again
    if (_in(o.finish, p) && this.t > o.min) {
      const t = this.t, isBest = !this.best || t < this.best; this.state = 'idle';
      if (isBest) { this.best = t; try { localStorage.setItem('ah.best.' + o.id, String(t)); } catch {} }
      this.hud((o.name ? o.name + '  ' : '') + fmt(t) + (isBest ? '  BEST' : '  best ' + fmt(this.best)), 4);
      if (o.onFinish) o.onFinish(t, this.best, isBest); return;
    }
    if (this.t > o.limit || (o.inside && !o.inside(p))) { this.cancel(o.inside && !o.inside(p) ? 'Off the course: the clock stops.' : null); return; }
    this.hud((o.name ? o.name + '  ' : '') + fmt(this.t) + (this.best ? '   best ' + fmt(this.best) : ''));
  }
}
class Body {
  constructor(k, mesh, o = {}) {
    this.k = k; this.mesh = mesh; this.o = { r: 0.15, h: 0.5, tip: false, hit: 0.5, drag: 2.5, ...o };
    this.home = mesh.position.clone(); this.q0 = mesh.quaternion.clone(); this.vx = this.vz = 0; this._x = this.home.x; this._z = this.home.z; this.tipped = false; this.fall = 0; this.axis = new k.THREE.Vector3(); this._q = new k.THREE.Quaternion();
  }
  step(dt) {
    const v = this.k.v, p = v.pos, m = this.mesh.position, o = this.o;
    const dx = m.x - p.x, dz = m.z - p.z, d = Math.hypot(dx, dz), reach = o.r + (v.radius || 0.15);
    if (d < reach && d > 1e-4 && p.y > m.y - 0.3 && p.y < m.y + o.h) {
      const nx = dx / d, nz = dz / d, into = v.vel.x * nx + v.vel.z * nz;
      if (into > 0.05) {
        if (!this.tipped || !o.tip) { this.vx += nx * into * 1.3; this.vz += nz * into * 1.3; }
        if (o.onHit) o.onHit(this, into);
        if (o.tip && !this.tipped && into > o.hit) { this.tipped = true; this.fall = 0; this.axis.set(nz, 0, -nx); if (o.onTip) o.onTip(this, into); }
      }
      if (!this.tipped || !o.tip) { m.x = p.x + nx * reach; m.z = p.z + nz * reach; }
    }
    if (this.vx || this.vz) { m.x += this.vx * dt; m.z += this.vz * dt; const f = Math.exp(-o.drag * dt); this.vx *= f; this.vz *= f; if (Math.abs(this.vx) + Math.abs(this.vz) < 0.01) this.vx = this.vz = 0; }
    // Not through a wall, nor into anything fixed down: it stops against it, and comes off with a little of its speed.
    if (m.x !== this._x || m.z !== this._z) {
      const out = this._o || (this._o = { x: 0, y: 0, z: 0 });
      if (confine(this.k.plan, m, o.r, false, out)) { const l = Math.hypot(out.x, out.z); if (l > 1e-6) { const nx = out.x / l, nz = out.z / l, into = this.vx * nx + this.vz * nz; if (into < 0) { this.vx -= nx * into * 1.4; this.vz -= nz * into * 1.4; } } }
      this._x = m.x; this._z = m.z;
    }
    if (this.tipped && o.tip && this.fall < 1) { this.fall = Math.min(1, this.fall + dt / 0.35); this.mesh.quaternion.copy(this._q.setFromAxisAngle(this.axis, (Math.PI / 2) * this.fall * this.fall)).multiply(this.q0); }
  }
  reset() { this.mesh.position.copy(this.home); this.mesh.quaternion.copy(this.q0); this.vx = this.vz = 0; this._x = this.home.x; this._z = this.home.z; this.tipped = false; this.fall = 0; }
}

// ---------------------------------------------------------------- the hook main.js calls
// startFeatures(o) starts every feature at once and returns the api. startFeaturesInTurn(o, rest) does the same, but
// calls `await rest(done, total)` whenever starting them has held the page for a while, so a loading screen can move.
export function startFeatures(o) { const s = kitFor(o); for (const f of features) s.start(f); return s.api; }
export async function startFeaturesInTurn(o, rest, budget = 40) {
  const s = kitFor(o); let t = performance.now();
  for (let i = 0; i < features.length; i++) {
    s.start(features[i]);
    if (performance.now() - t > budget) { await rest(i + 1, features.length); t = performance.now(); }
  }
  return s.api;
}
function kitFor(o) {
  const { G, THREE, secrets, say, once, callout, sound, stage } = o;
  const group = new THREE.Group(); group.name = 'features'; G.museum.group.add(group);
  const k = {
    G, plan: G.plan, museum: G.museum, sound, stage, THREE, group, once, callout,
    // k.say(text, hold) as documented; k.say(text, delay, hold) as main.js's say. (Two arguments used to be read as a delay.)
    say: (text, a, b) => (b === undefined ? say(text, 0, a === undefined ? 5 : a) : say(text, a, b)),
    find: id => secrets.find(id),
    get v() { return G.vehicle; }, get pos() { return G.vehicle.pos; }, get room() { return G.roomId ? G.plan.byId[G.roomId] : null; },
    inRoom(ids, around = 0) {
      const p = G.vehicle.pos;
      for (const id of [].concat(ids)) { const r = G.plan.byId[id]; if (!r) continue; if (p.x > r.x0 - around && p.x < r.x1 + around && p.z > r.z0 - around && p.z < r.z1 + around && p.y > r.y - 0.6 && p.y < r.y + (r.h || 4) + 0.6) return true; }
      return false;
    },
    close(q, r, dy = 1.5) { const p = G.vehicle.pos; return !!q && Math.abs(p.y - (q.y || 0)) < dy && (p.x - q.x) ** 2 + (p.z - q.z) ** 2 < r * r; },
    chips(n) { const P = G.poker; if (!P) return false; if (n < 0) return P.spend(-n); if (P.earn) P.earn(n); else if (P.spend) P.spend(-n); return true; },
    synth: synth(sound),
    camClose: null,
    // A box lying on the floor that the toy shoves along: tiles, crates, targets. b = { x, z, y, hw, hd, vx, vz }.
    // Call once a frame; it is pushed out of the toy's way, keeps a little of the toy's speed and slides to a stop.
    // Walls of `room` (if given), fixed obstacles and the `others` boxes stop it. Returns true if it moved.
    push(b, dt, { room = null, others = [], r = 0.2, friction = 3.2, lift = 0.4 } = {}) {
      const v = G.vehicle, p = v.pos, x0 = b.x, z0 = b.z;
      if (p.y - b.y < lift) {
        const cx = Math.max(b.x - b.hw, Math.min(b.x + b.hw, p.x)), cz = Math.max(b.z - b.hd, Math.min(b.z + b.hd, p.z)), dx = cx - p.x, dz = cz - p.z, d = Math.hypot(dx, dz);
        if (d < r) {
          let nx, nz; if (d > 1e-4) { nx = dx / d; nz = dz / d; } else { const ax = b.x - p.x, az = b.z - p.z; if (Math.abs(ax) > Math.abs(az)) { nx = Math.sign(ax) || 1; nz = 0; } else { nx = 0; nz = Math.sign(az) || 1; } }
          const sp = Math.max(0, v.vel.x * nx + v.vel.z * nz); this._slide(b, nx * (r - d + 0.005), nz * (r - d + 0.005), room, others); b.vx = nx * sp * 0.9; b.vz = nz * sp * 0.9;
        }
      }
      if (Math.abs(b.vx || 0) + Math.abs(b.vz || 0) > 0.01) { this._slide(b, b.vx * dt, b.vz * dt, room, others); const f = Math.exp(-dt * friction); b.vx *= f; b.vz *= f; }
      return b.x !== x0 || b.z !== z0;
    },
    _slide(b, dx, dz, room, others) {
      const hit = (x, z) => G.plan.obstacles.some(o => o.y1 > b.y + 0.02 && o.y0 < b.y + 0.1 && x + b.hw > o.x0 && x - b.hw < o.x1 && z + b.hd > o.z0 && z - b.hd < o.z1) || others.some(q => q !== b && Math.abs(q.x - x) < b.hw + q.hw && Math.abs(q.z - z) < b.hd + q.hd);
      if (room && (b.x + dx - b.hw < room.x0 + 0.05 || b.x + dx + b.hw > room.x1 - 0.05)) { dx = 0; b.vx = -(b.vx || 0) * 0.3; }
      if (room && (b.z + dz - b.hd < room.z0 + 0.05 || b.z + dz + b.hd > room.z1 - 0.05)) { dz = 0; b.vz = -(b.vz || 0) * 0.3; }
      if (dx && hit(b.x + dx, b.z)) { dx = 0; b.vx = 0; }
      if (dz && hit(b.x + dx, b.z + dz)) { dz = 0; b.vz = 0; }
      b.x += dx; b.z += dz;
    },
    // A lap course: a ring on the floor to drive once round inside, without touching its edges.
    // const lap = k.lap({ x, z }, rin, rout); then each frame lap.step(k.pos) returns 'out', 'in', 'broke' (left the band
    // part way round) or 'done' (all the way round, one way). lap.acc is how far round (radians), lap.reset() starts again.
    lap(c, rin, rout, margin = 0.16) {
      const L = { acc: 0, inside: false, prev: 0, reset() { this.acc = 0; this.inside = false; },
        step(p) {
          const dx = p.x - c.x, dz = p.z - c.z, d = Math.hypot(dx, dz), a = Math.atan2(dz, dx), inn = d > rin + margin && d < rout - margin;
          if (inn && !this.inside) { this.inside = true; this.acc = 0; this.prev = a; return 'in'; }
          if (!inn) { const was = this.inside && Math.abs(this.acc) > 0.4; this.inside = false; this.acc = 0; return was ? 'broke' : 'out'; }
          let da = a - this.prev; if (da > Math.PI) da -= 2 * Math.PI; if (da < -Math.PI) da += 2 * Math.PI; this.prev = a;
          if (this.acc && Math.sign(da) !== Math.sign(this.acc) && Math.abs(da) > 0.02) this.acc = 0;       // turned back: begin again
          this.acc += da; if (Math.abs(this.acc) >= 2 * Math.PI) { this.acc = 0; this.inside = false; return 'done'; }
          return 'in';
        } };
      return L;
    },
    // A "collect N of a set across the building" counter (mice followed, notes read, lost things returned, lions
    // counted...), kept in localStorage so it lasts between visits.
    tally(key, total) {
      const store = 'after-hours.tally.' + key; let got;
      try { got = new Set(JSON.parse(localStorage.getItem(store) || '[]')); } catch { got = new Set(); }
      return {
        total, has: id => got.has(id), get count() { return got.size; }, get done() { return got.size >= total; },
        add(id) { if (got.has(id)) return false; got.add(id); try { localStorage.setItem(store, JSON.stringify([...got])); } catch { } return true; },
      };
    },
    tint: id => tint(k, id),
    course: (gates, opts) => new Course(k, gates, opts),
    // The work the player is standing looking at just now (a museum art: .work, .x/.y/.z, .nx/.nz, .w/.h, .rot), or null.
    get looking() { return G.state === 'study' && G.study ? G.study.art : null; },
    // A sound that goes on until it is turned down: rain, wind, a fountain (noise), or a hum ('sine', 'triangle'...).
    // const l = k.loop({ lp: 2600, hp: 500 }); l.set(0.05) each frame you want it; l.set(0) lets it fade and stop.
    loop({ type = 'noise', freq = 110, lp = 0, hp = 0 } = {}) {
      let src = null, g = null, idle = 0;
      const make = () => {
        const c = sound && sound.ctx; if (!c || c.state !== 'running' || !sound.master) return false;
        g = c.createGain(); g.gain.value = 0;
        if (type === 'noise') { const n = c.sampleRate * 2, b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; src = c.createBufferSource(); src.buffer = b; src.loop = true; }
        else { src = c.createOscillator(); src.type = type; src.frequency.value = freq; }
        let node = src;
        for (const [kind, f] of [['lowpass', lp], ['highpass', hp]]) if (f) { const q = c.createBiquadFilter(); q.type = kind; q.frequency.value = f; node.connect(q); node = q; }
        node.connect(g); g.connect(sound.master); src.start(); return true;
      };
      const stop = () => { if (!src) return; try { src.stop(); } catch { /* stopped */ } src.disconnect(); g.disconnect(); src = g = null; };
      return {
        set(vol, tau = 0.25) {
          if (vol <= 0.0005) { if (g && (idle += 1) > 240) stop(); else if (g) g.gain.setTargetAtTime(0, sound.ctx.currentTime, tau); return; }
          idle = 0; if (!g && !make()) return; g.gain.setTargetAtTime(vol, sound.ctx.currentTime, tau);
        },
        stop,
      };
    },
    // A set of things to collect across the building (the lions, mice, lost property...), remembered between visits.
    //   const lions = k.collect('lions', 12); lions.add('L3') -> the new count the first time, 0 if already had;
    //   lions.has(id), lions.count, lions.total, lions.done, lions.clear()
    collect(name, total) {
      const key = 'feature-set-' + name;
      let got = []; try { got = JSON.parse(localStorage.getItem(key) || '[]'); } catch { got = []; }
      const save = () => { try { localStorage.setItem(key, JSON.stringify(got)); } catch { /* private window: it lasts the visit */ } };
      return {
        total, has: id => got.includes(id), get count() { return got.length; }, get done() { return got.length >= total; },
        add(id) { if (got.includes(id)) return 0; got.push(id); save(); return got.length; },
        clear() { got = []; save(); },
      };
    },
    // ---- added for the outdoor games (sledding, the bridgeway sprint, the targets); general, use them too
    // k.resume(): back to the game after a staged view the feature opened itself (G.state = 'paused' and k.stage.enter).
    resume() { if (stage && stage.on) stage.leave(); G.state = G.study ? 'study' : 'play'; },
    // k.solid(piece, material): add a drivable piece to the plan (the same {x0,x1,z0,z1,axis,h0,h1,thick?,base?} as
    // plan.surfaces; plain linear slopes only) and draw it as a block, since the museum has already drawn its own.
    solid(s, mat) { G.plan.surfaces.push(s); const m = blockMesh(THREE, s, mat); if (m) group.add(m); return m; },
    // k.timer({ id, name, start, finish, inside?, limit?, min?, onStart?, onFinish(t, best, isBest)? }): a timed run.
    // start and finish are boxes {x0,x1,z0,z1,y0?,y1?}; the clock starts as the toy leaves the start box (into
    // `inside(p)` if given) and stops in the finish box. Best time kept in localStorage. Call .update(dt) every frame.
    timer(o) { return new Timer(k, o); },
    // k.pushable(mesh, { r, h, tip?, hit?, drag?, onHit?, onTip? }): something light the toy shoves about (a board,
    // a tile). With tip it falls over when hit harder than `hit` m/s. Call .step(dt) every frame; .reset() puts it back.
    pushable(mesh, o) { return new Body(k, mesh, o); },
    // ---- added for the roofs (src/rooftops.js); general, use them too
    // k.roofAt(x, z): the height of the roof (or whatever drivable top) under (x, z), from up in the air; -Infinity off the buildings.
    roofAt(x, z) { let g = -Infinity; for (const list of [G.plan.roofs || [], G.plan.surfaces]) for (const s of list) if (!s.hill && !s.axis && x >= s.x0 && x <= s.x1 && z >= s.z0 && z <= s.z1 && s.h0 > g && s.h0 < SKY_TOP) g = s.h0; return g; },
    // k.roofSolid(piece, material?): as k.solid, but kept with the roofs (plan.roofs), out of plan.surfaces, so it can never
    // stand in the way of a picture being hung. Only felt above 2 m, as the roofs are. Without a material nothing is drawn.
    roofSolid(s, mat) { (G.plan.roofs || G.plan.surfaces).push({ roof: true, ...s }); const m = mat ? blockMesh(THREE, s, mat) : null; if (m) group.add(m); return m; },
    // k.parts(): a bag of shapes drawn as one mesh per material, for few draw calls (phones).
    //   const P = k.parts(); P.add(geo, mat, x, y, z, rx, ry, rz, sx, sy, sz) (or P.add(geo, mat, matrix4)); P.done(parent) -> the meshes
    // Each geometry is copied when added, so one can be used over and over.
    parts() { return new Parts(THREE); },
    // k.puffs(max, { color, size }): a little cloud of glowing specks, for steam, soot, snow thrown up, sparks.
    //   const p = k.puffs(80); p.emit(x, y, z, n, { spread, up, life, color }); p.update(dt) every frame (nothing to do when none are alive)
    puffs(max = 80, o = {}) { return new Puffs(k, max, o); },
    // k.hold(fn?): keep the toy still (a telescope, a look through a skylight); fn(dt, inp) gets the controls meanwhile.
    // k.hold(null) lets it go again (only if this hold is still the one in force). Returns the hold.
    hold(fn) {
      if (!fn && fn !== undefined) { if (G.ride && G.ride._k === k && G.ride._own === this._held) G.ride = null; this._held = null; return null; }
      const own = {}, ride = (dt, inp) => { const v = G.vehicle; v.vel.set(0, 0, 0); if (fn) fn(dt, inp); };
      ride._k = k; ride._own = own; this._held = own; G.ride = ride; return ride;
    },
  };
  k.carry = new Carry(k);
  const start = f => {
    for (const [id, name] of f.secrets || []) secrets.add(id, name);
    try { if (f.init) f.init(k); } catch (e) { console.error('feature ' + f.id, e); f._broken = true; }
  };
  const api = {
    kit: k,
    // Called where main.js decides what the action button says. Returns { verb, hint, act } or null.
    near(v) { for (const f of features) { if (f._broken || !f.near) continue; let r = null; try { r = f.near(v, k); } catch (e) { console.error('feature ' + f.id, e); f._broken = true; } if (r) return r; } return null; },
    update(dt) { k.camClose = null; for (const f of features) { if (f._broken || !f.update) continue; try { if (!f.active || f.active(k)) f.update(dt, k); } catch (e) { console.error('feature ' + f.id, e); f._broken = true; } } },
    look(art) { for (const f of features) if (!f._broken && f.onLook) try { f.onLook(art, k); } catch (e) { console.error('feature ' + f.id, e); } },
    spots() { return features.flatMap(f => { try { return f.spots ? f.spots(k) : []; } catch { return []; } }); },
    reset() { k.carry.clear(); for (const f of features) if (f.reset) try { f.reset(k); } catch (e) { console.error('feature ' + f.id, e); } },
    fresh() { for (const f of features) if (f.fresh) try { f.fresh(k); } catch (e) { console.error('feature ' + f.id, e); } },
  };
  return { start, api };
}

// ---------------------------------------------------------------- light a room differently
// k.tint(roomId): a wash of colour over one room's walls, floor and ceiling. It is multiplied in, so it can
// only warm, cool or dim the light; the works hang in front of it and keep their own colours. Nothing is drawn
// while it is off. t.set(color, secs = 1.2) fades to that colour (white is no tint); t.off(secs) fades it away.
const tints = new WeakMap();
function tint(k, id) {
  let made = tints.get(k); if (!made) tints.set(k, made = new Map());
  if (made.has(id)) return made.get(id);
  const r = k.plan.byId[id]; if (!r) return null;
  const T = k.THREE, h = r.h || 4, e = 0.02, now = () => performance.now() / 1000;
  const mat = new T.MeshBasicMaterial({ color: 0xffffff, side: T.BackSide, transparent: true, premultipliedAlpha: true, blending: T.MultiplyBlending, depthWrite: false, fog: false, toneMapped: false });
  const m = new T.Mesh(new T.BoxGeometry(r.x1 - r.x0 - 2 * e, h - 2 * e, r.z1 - r.z0 - 2 * e), mat);
  m.position.set((r.x0 + r.x1) / 2, r.y + h / 2, (r.z0 + r.z1) / 2); m.visible = false; m.renderOrder = 5; m.frustumCulled = false; m.name = 'tint:' + id;
  k.group.add(m);
  const from = new T.Color(1, 1, 1), to = new T.Color(1, 1, 1); let t0 = 0, dur = 1;
  const at = () => { const a = Math.min(1, (now() - t0) / dur); return { a, c: from.clone().lerp(to, a * a * (3 - 2 * a)) }; };
  m.onBeforeRender = () => { const { a, c } = at(); mat.color.copy(c); if (a >= 1 && to.r === 1 && to.g === 1 && to.b === 1) m.visible = false; };
  const t = {
    mesh: m,
    set(color, secs = 1.2) { from.copy(at().c); to.set(color); t0 = now(); dur = Math.max(0.01, secs); m.visible = true; },
    off(secs = 1.2) { if (m.visible) t.set(0xffffff, secs); },
    get on() { return m.visible; },
  };
  made.set(id, t); return t;
}

// ---------------------------------------------------------------- a timed run through gates
// k.course(gates, opts): gates [{ x, z, r }] to be reached in order; the clock starts at the first.
// opts.limit (seconds, 0 for none), opts.onPass(i, n), opts.onDone(time), opts.onFail(why).
// c.start() arms it, c.update(dt) from the feature's update, c.fail(why) ends it early (a touched barrier,
// left the track), c.stop() quietly. c.armed, c.running, c.t (seconds since the first gate), c.next (the gate wanted).
class Course {
  constructor(k, gates, o = {}) { this.k = k; this.gates = gates; this.o = o; this.stop(); }
  start() { this.armed = true; this.running = false; this.next = 0; this.t = 0; }
  stop() { this.armed = false; this.running = false; this.next = 0; this.t = 0; }
  fail(why) { if (!this.armed) return; this.stop(); if (this.o.onFail) this.o.onFail(why); }
  update(dt) {
    if (!this.armed) return;
    if (this.running) { this.t += dt; if (this.o.limit && this.t > this.o.limit) return this.fail('time'); }
    const g = this.gates[this.next], p = this.k.pos;
    if (!g || (p.x - g.x) ** 2 + (p.z - g.z) ** 2 > (g.r || 0.6) ** 2) return;
    if (this.next === 0) this.running = true;
    this.next++;
    if (this.o.onPass) this.o.onPass(this.next - 1, this.gates.length);
    if (this.next >= this.gates.length) { const t = this.t; this.stop(); if (this.o.onDone) this.o.onDone(t); }
  }
}
