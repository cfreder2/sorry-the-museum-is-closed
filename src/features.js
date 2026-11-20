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
    update(dt) { k.camClose = null; for (const f of features) { if (f._broken || !f.update) continue; try { if (!f.active || f.active(k)) f.update(dt, k); } catch (e) { console.error('feature ' + f.id, e); f._broken = true; } } },
    look(art) { for (const f of features) if (!f._broken && f.onLook) try { f.onLook(art, k); } catch (e) { console.error('feature ' + f.id, e); } },
    spots() { return features.flatMap(f => { try { return f.spots ? f.spots(k) : []; } catch { return []; } }); },
    reset() { k.carry.clear(); for (const f of features) if (f.reset) try { f.reset(k); } catch (e) { console.error('feature ' + f.id, e); } },
  };
  return api;
}
