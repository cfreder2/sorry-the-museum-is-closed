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
