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
//   k.tint(roomId)        light a room differently: .set(color, secs), .off(secs)   (see the end of this file)
//   k.course(gates, opts) a timed run through gates in order: .start(), .update(dt), .fail(why)   (ditto)

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
    tint: id => tint(k, id),
    course: (gates, opts) => new Course(k, gates, opts),
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
