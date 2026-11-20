// The shared kit for things to find and do. Every gallery set-piece, little secret and outdoor game is a
// "feature": a plain object registered here, which main.js runs through one hook. Nothing else in main.js
// has to change to add one. Use this, and the helpers below, rather than writing your own.
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

export const features = [];
export function feature(f) { features.push(f); return f; }

// ---------------------------------------------------------------- carrying
// One thing-on-the-car system for everything that is picked up and taken somewhere (lost property, the lance,
// the mask, a key...). An item: { id, mesh (THREE.Object3D, carried on the car's roof), onDrop? }.
class Carry {
  constructor(k) { this.k = k; this.list = []; this.max = 3; }
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
    this.list.forEach((it, n) => { if (!it.mesh) return; if (it.mesh.parent !== g) g.add(it.mesh); it.mesh.position.set((n - (this.list.length - 1) / 2) * 0.09, 0.2 + (it.lift || 0), -0.03); });
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
    this.home = mesh.position.clone(); this.q0 = mesh.quaternion.clone(); this.vx = this.vz = 0; this.tipped = false; this.fall = 0; this.axis = new k.THREE.Vector3(); this._q = new k.THREE.Quaternion();
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
    if (this.tipped && o.tip && this.fall < 1) { this.fall = Math.min(1, this.fall + dt / 0.35); this.mesh.quaternion.copy(this._q.setFromAxisAngle(this.axis, (Math.PI / 2) * this.fall * this.fall)).multiply(this.q0); }
  }
  reset() { this.mesh.position.copy(this.home); this.mesh.quaternion.copy(this.q0); this.vx = this.vz = 0; this.tipped = false; this.fall = 0; }
}

// ---------------------------------------------------------------- the hook main.js calls
export function startFeatures(o) {
  const { G, THREE, secrets, say, once, callout, sound, stage } = o;
  const group = new THREE.Group(); group.name = 'features'; G.museum.group.add(group);
  const k = {
    G, plan: G.plan, museum: G.museum, sound, stage, THREE, group, say, once, callout,
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
  };
  k.carry = new Carry(k);
  for (const f of features) {
    for (const [id, name] of f.secrets || []) secrets.add(id, name);
    try { if (f.init) f.init(k); } catch (e) { console.error('feature ' + f.id, e); f._broken = true; }
  }
  const api = {
    kit: k,
    // Called where main.js decides what the action button says. Returns { verb, hint, act } or null.
    near(v) { for (const f of features) { if (f._broken || !f.near) continue; let r = null; try { r = f.near(v, k); } catch (e) { console.error('feature ' + f.id, e); f._broken = true; } if (r) return r; } return null; },
    update(dt) { for (const f of features) { if (f._broken || !f.update) continue; try { if (!f.active || f.active(k)) f.update(dt, k); } catch (e) { console.error('feature ' + f.id, e); f._broken = true; } } },
    look(art) { for (const f of features) if (!f._broken && f.onLook) try { f.onLook(art, k); } catch (e) { console.error('feature ' + f.id, e); } },
    spots() { return features.flatMap(f => { try { return f.spots ? f.spots(k) : []; } catch { return []; } }); },
    reset() { k.carry.clear(); for (const f of features) if (f.reset) try { f.reset(k); } catch (e) { console.error('feature ' + f.id, e); } },
  };
  return api;
}
