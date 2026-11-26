// Five small things in five first-floor galleries, each a feature in the shared kit (src/features.js):
//
//   Gallery 141  Shiva as Lord of the Dance. Look at him and the ring of flames that surrounds the dance is lit on
//                the floor of the room. Go once round inside it, without touching its edges.
//   Gallery 107  Utamaro's Twelve Hours of the Green Houses. Each print is an hour. Look at the one for the hour it
//                is now where you are, or at every one of them that is on view.
//   Gallery 103  Noh masks on stands, which turn to watch you. One stand is empty: its mask is lying in a back room.
//                Bring it home on the roof of the car.
//   Gallery 154  A Roman floor of the four seasons with its four squares lifted. Push them back into place.
//   Gallery 161  Winslow Homer's The Herring Net. Look at it and you hear the sea, and a herring jumps out of the
//                net onto the floor. Catch it.
//
// Everything here is modelled and painted by the game: no picture of any work is copied. Only works on view with
// no copyright notice are touched. Nothing runs unless you are near. Nothing is ever drawn on or over a work (the
// user's rule): a glow goes on the wall round it or the floor below it, and the herring leaps from below the frame.

import * as THREE from 'three';
import * as TX from './textures.js';
import { feature } from './features.js';

const TAU = Math.PI * 2;
// The Japanese hours: each animal's hour is two of ours, the Rat's centred on midnight.
const ANIMAL = { rat: 0, ox: 2, tiger: 4, hare: 6, rabbit: 6, dragon: 8, snake: 10, serpent: 10, horse: 12, sheep: 14, ram: 14, goat: 14, monkey: 16, rooster: 18, cock: 18, bird: 18, dog: 20, boar: 22 };
const HIRA = [0, 2, 3, 7, 8, 12, 14, 15];        // a koto's scale (hirajoshi), in semitones

const canvasTex = (w, h, draw) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
const std = o => new THREE.MeshStandardMaterial({ roughness: 0.6, ...o });
const midi = n => 440 * Math.pow(2, (n - 69) / 12);
const art = (k, room, re) => { const st = k.museum.rooms[room]; return st ? st.arts.find(a => re.test(a.work.t || '') && !a.work.c) : null; };

// A spot of floor clear of walls, plinths and doorways.
// The spot must lie inside the room, so only the obstacles that reach into the room at that height can be in its way:
// those (and the room's door centres) are picked out once per room and height, not looked through in full on every
// call. (The whole list is thousands long, and the ring search for Shiva asks hundreds of thousands of times.)
const nearby = new WeakMap();
function inRoom(k, room, y) {
  const all = k.plan.obstacles;
  let per = nearby.get(all); if (!per) nearby.set(all, per = new Map());
  const key = room.id + '@' + y; let c = per.get(key);
  if (!c || c.n !== all.length) {
    const x0 = room.x0 + 0.25, x1 = room.x1 - 0.25, z0 = room.z0 + 0.25, z1 = room.z1 - 0.25;
    c = { n: all.length, obs: all.filter(o => o.y1 > y + 0.04 && o.y0 < y + 1.2 && x1 > o.x0 && x0 < o.x1 && z1 > o.z0 && z0 < o.z1),
      doors: k.plan.doorsOf(room.id).map(d => [(d.x0 + d.x1) / 2, (d.z0 + d.z1) / 2]) };
    per.set(key, c);
  }
  return c;
}
function free(k, x, z, r, room, y = room.y, doorGap = 1.3) {
  if (x - r < room.x0 + 0.25 || x + r > room.x1 - 0.25 || z - r < room.z0 + 0.25 || z + r > room.z1 - 0.25) return false;
  const c = inRoom(k, room, y);
  for (const o of c.obs) if (x + r > o.x0 && x - r < o.x1 && z + r > o.z0 && z - r < o.z1) return false;
  for (const [cx, cz] of c.doors) if (Math.hypot(x - cx, z - cz) < doorGap + r) return false;
  return true;
}
const gain = (k, x, z, reach) => Math.max(0, 1 - Math.hypot(k.pos.x - x, k.pos.z - z) / reach);
const music = k => (k.sound.vol && k.sound.vol.music) || 1;
const live = k => { const s = k.sound; return s && s.ctx && s.ctx.state === 'running' && !s.muted; };
const outs = k => (k.sound.dry && k.sound.send ? [k.sound.dry, k.sound.send] : [k.sound.master]);
// A koto string, bright when struck and dulling as it rings (richer than k.synth.note: it needs a falling filter).
function pluck(k, freq, when, vol) {
  if (!live(k)) return; const c = k.sound.ctx, t = c.currentTime + when;
  const o = c.createOscillator(), f = c.createBiquadFilter(), e = c.createGain();
  o.type = 'sawtooth'; o.frequency.setValueAtTime(freq * 1.006, t); o.frequency.exponentialRampToValueAtTime(freq, t + 0.08);
  f.type = 'lowpass'; f.Q.value = 2; f.frequency.setValueAtTime(5200, t); f.frequency.exponentialRampToValueAtTime(700, t + 0.9);
  e.gain.setValueAtTime(0, t); e.gain.linearRampToValueAtTime(vol, t + 0.004); e.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
  o.connect(f); f.connect(e); for (const n of outs(k)) e.connect(n); o.start(t); o.stop(t + 1.7);
}
const koto = (k, seed = 0) => { for (let i = 0; i < 5; i++) pluck(k, midi(62 + HIRA[(seed * 3 + i * (i % 2 ? 2 : 3)) % HIRA.length]), i * 0.24, 0.045 * music(k)); };
// A gull: a falling cry with a quick warble in it.
function gull(k, vol) {
  if (!live(k)) return; const c = k.sound.ctx, t = c.currentTime;
  for (let n = 0; n < 2 + (Math.random() * 2 | 0); n++) { const t0 = t + n * 0.28, o = c.createOscillator(), e = c.createGain(), v = c.createOscillator(), vg = c.createGain();
    o.type = 'triangle'; o.frequency.setValueAtTime(1500 + Math.random() * 300, t0); o.frequency.exponentialRampToValueAtTime(820, t0 + 0.24);
    v.frequency.value = 26; vg.gain.value = 40; v.connect(vg); vg.connect(o.frequency);
    e.gain.setValueAtTime(0, t0); e.gain.linearRampToValueAtTime(vol, t0 + 0.03); e.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.26);
    o.connect(e); for (const q of outs(k)) e.connect(q); o.start(t0); v.start(t0); o.stop(t0 + 0.3); v.stop(t0 + 0.3); }
}

// ---------------------------------------------------------------- 1. the ring of flames, Gallery 141
feature({
  id: 'shiva141',
  secrets: [['shiva141', 'The dance of Shiva']],
  R: null, t: 0,
  init(k) {
    const a = art(k, 'G141', /Nataraja/i), room = k.plan.byId.G141; if (!a || !room) return;
    const rin = 1.7, rout = 2.7, y = room.y;
    // Somewhere on the floor near the god where a whole ring of that size is clear of plinths and doorways.
    let best = null;
    for (let cx = room.x0 + rout + 0.3; cx <= room.x1 - rout - 0.3; cx += 0.25) for (let cz = room.z0 + rout + 0.3; cz <= room.z1 - rout - 0.3; cz += 0.25) {
      let ok = true;
      for (let n = 0; n < 40 && ok; n++) { const q = n / 40 * TAU; for (const r of [rin - 0.15, (rin + rout) / 2, rout + 0.15]) if (!free(k, cx + Math.cos(q) * r, cz + Math.sin(q) * r, 0.18, room, y, 0.9)) { ok = false; break; } }
      if (!ok) continue; const d = Math.hypot(cx - a.x, cz - a.z); if (!best || d < best.d) best = { x: cx, z: cz, d };
    }
    if (!best) return;
    const g = new THREE.Group(); g.position.set(best.x, y, best.z); g.visible = false; k.group.add(g);
    // A band of warm light on the floor between the two rings of flame.
    const band = new THREE.Mesh(new THREE.RingGeometry(rin, rout, 96, 1), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.0, 0.45, 0.12), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    band.rotation.x = -Math.PI / 2; band.position.y = 0.015; g.add(band);
    const N = 56, flameTex = TX.radial(0, 1.6);
    const edge = r => { const pos = new Float32Array(N * 3); for (let i = 0; i < N; i++) { const q = i / N * TAU; pos[i * 3] = Math.cos(q) * r; pos[i * 3 + 1] = 0.2; pos[i * 3 + 2] = Math.sin(q) * r; }
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const p = new THREE.Points(geo, new THREE.PointsMaterial({ map: flameTex, size: 0.55, color: new THREE.Color(1.6, 0.7, 0.2), transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }));
      p.frustumCulled = false; g.add(p); return [p, r]; };
    this.R = { art: a, room, x: best.x, z: best.z, y, rin, rout, g, band, edges: [edge(rin), edge(rout)], lit: 0, flare: 0, done: false, drone: null, bellIn: 0, lap: k.lap({ x: best.x, z: best.z }, rin, rout) };
  },
  onLook(a, k) {
    const R = this.R; if (!R || a !== R.art || R.done) return;
    const was = R.lit > 0; R.lit = 75; R.lap.reset();
    if (!was) k.say('The ring of flames he dances in is burning on the floor. Go once round inside it.', 0.6, 7);
  },
  active() { return !!this.R && this.R.lit > 0; },
  update(dt, k) {
    const R = this.R; this.t += dt;
    const near = k.inRoom(R.room.id, 10);
    R.lit -= dt; R.g.visible = near && R.lit > 0;
    const fade = Math.max(0, Math.min(1, R.lit / 3, (75 - R.lit) / 1.5 + 0.0001));
    R.band.material.opacity = 0.16 * fade + R.flare * 0.3;
    if (R.g.visible) for (const [P, r] of R.edges) { const at = P.geometry.attributes.position; for (let i = 0; i < at.count; i++) at.setY(i, 0.18 + 0.12 * Math.abs(Math.sin(this.t * 7 + i * 1.7 + r))); at.needsUpdate = true;
      P.material.size = 0.5 + 0.08 * Math.sin(this.t * 11) + R.flare * 0.6; P.material.opacity = 0.9 * fade; P.material.color.setRGB(1.6 + R.flare, 0.7 + R.flare * 0.8, 0.2 + R.flare * 0.6); }
    R.flare = Math.max(0, R.flare - dt * 2);
    // The sound: a low drone like breath on a reed, and now and then a small bell.
    if (live(k)) {
      const g = (near ? gain(k, R.x, R.z, 26) : 0) * fade * music(k), c = k.sound.ctx;
      if (!R.drone && g > 0) { const out = c.createGain(); out.gain.value = 0; for (const n of outs(k)) out.connect(n);
        const os = [98, 147, 196.5].map((f, i) => { const o = c.createOscillator(); o.type = i ? 'sine' : 'triangle'; o.frequency.value = f; const e = c.createGain(); e.gain.value = [0.5, 0.3, 0.16][i]; o.connect(e); e.connect(out); o.start(); return o; });
        R.drone = { out, os }; }
      if (R.drone) R.drone.out.gain.setTargetAtTime(0.05 * g, c.currentTime, 0.4);
      R.bellIn -= dt; if (g > 0.05 && R.bellIn <= 0) { R.bellIn = 2.2 + Math.random() * 2.5; k.synth.note(midi(74 + [0, 2, 7, 9, 12][Math.random() * 5 | 0]), 2.4, { type: 'sine', vol: 0.03 * g }); }
    }
    if (R.lit <= 0) { this._off(k); return; }
    // The lap: wholly inside the band, all the way round one way, in the car and on the floor.
    if (R.done || k.v.kind !== 'car' || k.pos.y - R.y > 0.6) return;
    const s = R.lap.step(k.pos);
    if (s === 'broke') { R.flare = 1; k.sound.tick(0.08, 900, 0.12); }
    else if (s === 'done') {
      R.done = true; R.flare = 2; R.lit = Math.min(R.lit, 8);
      k.synth.chime([62, 69, 74, 81, 86].map(midi), { gap: 0.18, dur: 3, vol: 0.05 });
      k.callout('THE DANCE OF SHIVA'); k.find('shiva141');
    }
  },
  _off(k) {
    const R = this.R; R.g.visible = false; R.lit = 0; R.lap.reset();
    if (R.drone) { const d = R.drone; d.out.gain.setTargetAtTime(0, k.sound.ctx.currentTime, 0.3); setTimeout(() => d.os.forEach(o => { try { o.stop(); } catch { /* already stopped */ } }), 1500); R.drone = null; }
  },
  spots() { const R = this.R; return R ? [{ kind: 'secret', id: 'shiva141', name: 'Ring of flames (look at Shiva, then drive a lap)', x: R.x, y: R.y, z: R.z }] : []; },
  reset(k) { if (this.R) this._off(k); },
});

// ---------------------------------------------------------------- 2. the twelve hours, Gallery 107
feature({
  id: 'hours107',
  secrets: [['hours107', 'The twelve hours']],
  H: null, t: 0,
  init(k) {
    const st = k.museum.rooms.G107; if (!st) return;
    const prints = st.arts.filter(a => !a.work.c && /Hour of the (\w+)/i.test(a.work.t || '')).map(a => { const m = /Hour of the (\w+)/i.exec(a.work.t), h = ANIMAL[m[1].toLowerCase()]; return h == null ? null : { art: a, animal: m[1], hour: h }; }).filter(Boolean);
    if (!prints.length) return;
    let seen = []; try { seen = JSON.parse(localStorage.getItem('after-hours.hours') || '[]'); } catch { /* none kept */ }
    const halo = TX.radial(0.5, 1.1);
    for (const p of prints) {
      // The glow when it is found: a halo on the wall round the print, laid 1.5 cm off the wall, behind the print and its
      // frame (they hang 4 cm out), so they hide the middle of it and it can only light the wall round them. Never on the
      // print itself (the user's rule). And a little pool of the same light on the floor below.
      const a = p.art, mat = new THREE.MeshBasicMaterial({ alphaMap: halo, color: new THREE.Color(1, 0.6, 0.22), transparent: true, opacity: 0, depthWrite: false });      // (laid over the wall, not added: a pale wall would only go white)
      const m = new THREE.Mesh(new THREE.PlaneGeometry(a.w + 0.7, a.h + 1.3), mat);      // (taller than wide: the prints hang close side by side)
      m.position.set(a.x - a.nx * 0.025, a.y, a.z - a.nz * 0.025); m.lookAt(a.x + a.nx, a.y, a.z + a.nz); m.visible = false; k.group.add(m); p.glow = m; p.g = 0;
      const f = new THREE.Mesh(new THREE.PlaneGeometry(a.w + 0.6, 0.7), new THREE.MeshBasicMaterial({ alphaMap: TX.radial(0, 1), color: new THREE.Color(1, 0.62, 0.25), transparent: true, opacity: 0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
      f.rotation.x = -Math.PI / 2; f.rotation.z = Math.atan2(a.nx, a.nz); f.position.set(a.x + a.nx * 0.4, (k.plan.byId.G107 || { y: 0 }).y + 0.006, a.z + a.nz * 0.4); f.visible = false; k.group.add(f); p.pool = f;
    }
    this.H = { room: k.plan.byId.G107, prints, seen: new Set(seen), done: false };
  },
  now(p, d = new Date()) { return (d.getHours() - (p.hour + 23) % 24 + 24) % 24 < 2; },
  onLook(a, k) {
    const H = this.H; if (!H) return; const p = H.prints.find(q => q.art === a); if (!p) return;
    if (!H.done && k.G.secrets && k.G.secrets.has('hours107')) H.done = true;      // (found on an earlier visit: the callout is not said again at the first look after every reload)
    p.g = 1; H.seen.add(p.animal.toLowerCase()); try { localStorage.setItem('after-hours.hours', JSON.stringify([...H.seen])); } catch { /* not kept */ }
    koto(k, p.hour);
    const now = this.now(p), all = H.prints.every(q => H.seen.has(q.animal.toLowerCase()));
    const s = (p.hour + 23) % 24, from = s === 0 ? 'midnight' : s === 12 ? 'noon' : `${s % 12} ${s < 12 ? 'in the morning' : s < 18 ? 'in the afternoon' : 'in the evening'}`;
    if (!H.done && (now || all)) { H.done = true; p.g = 2; k.find('hours107'); k.callout(now ? `THE HOUR OF THE ${p.animal.toUpperCase()}` : 'THE TWELVE HOURS'); k.say(now ? `The Hour of the ${p.animal}: this hour, here and now.` : 'Every hour on these walls, seen.', 0.4, 6); }
    else if (!H.done) k.say(`The Hour of the ${p.animal}, from ${from}. ${H.prints.filter(q => H.seen.has(q.animal.toLowerCase())).length} of ${H.prints.length} hours on view seen.`, 0.4, 6);      // (of tonight's prints: the kept set can hold more than are hung tonight, "4 of 2")
  },
  active() { return !!this.H && this.H.prints.some(p => p.g > 0 || p.glow.visible); },
  update(dt) {
    this.t += dt;
    for (const p of this.H.prints) { p.g = Math.max(0, p.g - dt * 0.35); p.glow.visible = p.pool.visible = p.g > 0.01; const o = Math.min(1, p.g) * (0.85 + 0.15 * Math.sin(this.t * 3)); p.glow.material.opacity = o * 0.85; p.pool.material.opacity = o * 0.55; }
  },
  spots() { const H = this.H; if (!H) return []; const a = H.prints[0].art; return [{ kind: 'secret', id: 'hours107', name: 'The twelve hours (look at the print for this hour)', x: a.x, y: H.room.y, z: a.z }]; },
});

// ---------------------------------------------------------------- 3. the masks, Gallery 103
function maskMesh(kind) {
  const tex = canvasTex(256, 128, (c, w, h) => {
    c.fillStyle = kind === 0 ? '#efe6d6' : kind === 1 ? '#c99a62' : '#b8322a'; c.fillRect(0, 0, w, h);
    c.fillStyle = 'rgba(0,0,0,.06)'; for (let i = 0; i < 60; i++) c.fillRect(Math.random() * w, Math.random() * h, 2, 2);
    // the hairline, the high painted brows, the eyes cut through, a small mouth
    c.fillStyle = kind === 2 ? '#2a0f0c' : '#1b1612'; c.fillRect(w * 0.25, 0, w * 0.5, h * 0.12);
    for (let i = 0; i < 9; i++) c.fillRect(w * (0.28 + i * 0.055), h * 0.1, 2, h * 0.08);
    c.fillStyle = '#2b2622'; for (const sx of [-1, 1]) { c.beginPath(); c.ellipse(w * (0.5 + sx * 0.1), h * 0.26, w * 0.035, h * 0.03, 0, 0, TAU); c.fill(); }
    c.fillStyle = '#050403'; for (const sx of [-1, 1]) { c.beginPath(); c.ellipse(w * (0.5 + sx * 0.085), h * 0.43, w * 0.03, h * 0.04, sx * 0.2, 0, TAU); c.fill(); }
    c.fillStyle = kind === 1 ? '#7a4a2a' : '#a8221d'; c.beginPath(); c.ellipse(w * 0.5, h * 0.74, w * 0.04, h * 0.035, 0, 0, TAU); c.fill();
    if (kind === 1) { c.strokeStyle = 'rgba(70,40,20,.6)'; c.lineWidth = 2; for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(w * 0.36, h * (0.3 + i * 0.05)); c.quadraticCurveTo(w * 0.5, h * (0.27 + i * 0.05), w * 0.64, h * (0.3 + i * 0.05)); c.stroke(); } }      // an old man's lines
  });
  const geo = new THREE.SphereGeometry(1, 24, 16, Math.PI / 2, Math.PI, 0, Math.PI); geo.scale(0.085, 0.11, 0.05);
  const g = new THREE.Group();
  g.add(new THREE.Mesh(geo, std({ map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.22, roughness: 0.45 })), new THREE.Mesh(geo, std({ color: 0x3a2a1e, side: THREE.BackSide, roughness: 0.8 })));
  return g;
}
feature({
  id: 'masks103',
  secrets: [['masks103', 'The missing mask']],
  M: null, t: 0,
  init(k) {
    const room = k.plan.byId.G103; if (!room) return;
    const y = room.y, cx = (room.x0 + room.x1) / 2, cz = (room.z0 + room.z1) / 2;
    const corners = [[room.x0 + 0.85, room.z0 + 0.85], [room.x1 - 0.85, room.z0 + 0.85], [room.x0 + 0.85, room.z1 - 0.85], [room.x1 - 0.85, room.z1 - 0.85]].filter(([x, z]) => free(k, x, z, 0.3, room, y, 1.2));
    if (corners.length < 2) return;
    // Its mask, face up on the floor of a back room some way off: on this floor or the one below.
    const rooms = k.plan.rooms.filter(r => !r.secret && r.kind === 'room' && /backofhouse|office/.test(r.use || '') && (Math.abs(r.y - y) < 0.1 || Math.abs(r.y + 4.6) < 0.1) && k.plan.doorsOf(r.id).length && (r.x1 - r.x0) > 3 && (r.z1 - r.z0) > 3);
    const far = r => Math.abs(Math.hypot((r.x0 + r.x1) / 2 - cx, (r.z0 + r.z1) / 2 - cz) - 40);
    rooms.sort((a, b) => far(a) - far(b));
    let lost = null;
    for (const r of rooms) { for (let n = 0; n < 60 && !lost; n++) { const x = r.x0 + 0.6 + ((n * 0.37) % 1) * (r.x1 - r.x0 - 1.2), z = r.z0 + 0.6 + ((n * 0.61) % 1) * (r.z1 - r.z0 - 1.2); if (free(k, x, z, 0.3, r, r.y, 1.0)) lost = { room: r, x, y: r.y, z }; } if (lost) break; }
    if (!lost) return;
    const plinth = std({ color: 0x23201d, roughness: 0.7 }), brass = std({ color: 0x8a7a5a, metalness: 0.6 });
    const stands = corners.map(([x, z], i) => {
      const g = new THREE.Group(); g.position.set(x, y, z); k.group.add(g);
      const p = new THREE.Mesh(new THREE.BoxGeometry(0.42, 1.02, 0.42), plinth); p.position.y = 0.51; g.add(p);
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.16, 8), brass); post.position.y = 1.1; g.add(post);
      k.plan.obstacles.push({ x0: x - 0.22, x1: x + 0.22, z0: z - 0.22, z1: z + 0.22, y0: y, y1: y + 1.05 });
      const rest = Math.atan2(cx - x, cz - z), head = new THREE.Group(); head.position.y = 1.24; head.rotation.y = rest; g.add(head);
      return { g, head, rest, x, z, mask: null, i };
    });
    const empty = stands[stands.length - 1];
    stands.forEach((s, i) => { if (s !== empty) { s.mask = maskMesh(i % 3); s.head.add(s.mask); } });
    const note = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.1), new THREE.MeshBasicMaterial({ map: canvasTex(256, 128, (c, w) => { c.fillStyle = '#efe8d8'; c.fillRect(0, 0, w, 128); c.fillStyle = '#2a2520'; c.font = 'italic 26px Georgia, serif'; c.textAlign = 'center'; c.fillText('Mask: on loan to', w / 2, 52); c.fillText('…we are not sure.', w / 2, 92); }) }));
    note.position.set(0, 0.7, 0.212); empty.g.add(note); empty.g.rotation.y = empty.rest;
    const mesh = maskMesh(2); mesh.rotation.x = -Math.PI / 2; mesh.position.set(lost.x, lost.y + 0.055, lost.z); k.group.add(mesh);
    this.M = { room, y, stands, empty, lost, mesh, state: 'lost', anim: 0 };
  },
  active(k) { const M = this.M; return !!M && (M.state === 'flying' || M.state === 'carried' || k.inRoom(M.room.id, 4) || M.state === 'lost' && k.inRoom(M.lost.room.id, 1)); },
  update(dt, k) {
    const M = this.M, p = k.pos; this.t += dt;
    if (k.inRoom(M.room.id, 4)) {
      // They turn to watch: each mask's face follows the toy, as far as a neck would let it.
      for (const s of M.stands) { if (!s.mask) continue; let want = Math.atan2(p.x - s.x, p.z - s.z) - s.rest; want = Math.max(-1.1, Math.min(1.1, Math.atan2(Math.sin(want), Math.cos(want)))); const cur = s.head.rotation.y - s.rest;
        s.head.rotation.y = s.rest + cur + (want - cur) * Math.min(1, dt * 2.5); s.head.rotation.x = Math.max(-0.4, Math.min(0.25, Math.atan2(1.24 - (p.y - M.y), Math.hypot(p.x - s.x, p.z - s.z)) * 0.6)); }
      if (k.G.roomId === M.room.id) k.once('masks103', M.state === 'home' ? 'Four masks, each back where it belongs.' : 'Four stands, three masks. They watch you. The fourth has gone missing.', 6);
    }
    if (M.state === 'lost') {
      if (k.close(M.lost, 0.45, 0.6)) {
        if (k.carry.take({ id: 'noh-mask', mesh: M.mesh, lift: 0.09 })) { M.state = 'carried'; M.mesh.rotation.set(-Math.PI / 2, 0, 0); k.sound.tick(0.08, 2600, 0.05); k.callout('A NOH MASK'); k.say('It belongs on an empty stand in Gallery 103. Take it home.', 0.3, 7); }
      } else M.mesh.rotation.z = Math.sin(this.t * 0.5) * 0.04;
    } else if (M.state === 'carried') {
      if (!k.carry.has('noh-mask')) { this._lose(k); return; }
      const g = k.v.group; if (M.mesh.parent !== g) { g.add(M.mesh); M.mesh.position.set(0, 0.29, -0.03); }      // changed toy
      const e = M.empty; if (k.G.roomId === M.room.id && k.close({ x: e.x, y: M.y, z: e.z }, 1.25)) {
        const w = new THREE.Vector3(); M.mesh.getWorldPosition(w); k.carry.drop('noh-mask');
        k.group.add(M.mesh); M.mesh.position.copy(k.group.worldToLocal(w.clone())); M.from = M.mesh.position.clone(); M.fromRot = M.mesh.rotation.x; M.state = 'flying'; M.anim = 0;
      }
    } else if (M.state === 'flying') {
      M.anim = Math.min(1, M.anim + dt * 1.4); const e = M.empty, s = M.anim * M.anim * (3 - 2 * M.anim);
      const to = k.group.worldToLocal(new THREE.Vector3(e.x, M.y + 1.24, e.z)); M.mesh.position.lerpVectors(M.from, to, s); M.mesh.position.y += Math.sin(Math.PI * s) * 0.4;
      M.mesh.rotation.set(M.fromRot * (1 - s), e.head.rotation.y * s, 0);
      if (M.anim >= 1) { M.state = 'home'; e.head.attach(M.mesh); M.mesh.position.set(0, 0, 0); M.mesh.rotation.set(0, 0, 0); e.mask = M.mesh;
        koto(k, 5); k.callout('THE MISSING MASK'); k.find('masks103'); }
    }
  },
  _lose(k) { const M = this.M; M.state = 'lost'; M.mesh.rotation.set(-Math.PI / 2, 0, 0); M.mesh.position.set(M.lost.x, M.lost.y + 0.055, M.lost.z); k.group.add(M.mesh); },
  spots() { const M = this.M; if (!M) return []; return [{ kind: 'secret', id: 'masks103', name: 'Noh masks (the empty stand)', x: M.empty.x, y: M.y, z: M.empty.z }, { kind: 'todo', id: 'masks103-lost', name: 'The missing mask', x: M.lost.x, y: M.lost.y, z: M.lost.z }]; },
  // A new night: a mask still on the car goes back where it was found (the kit has already taken it off the car).
  reset(k) { const M = this.M; if (M && (M.state === 'carried' || M.state === 'flying')) this._lose(k); },
});

// ---------------------------------------------------------------- 4. the four seasons, Gallery 154
const SEASON = ['spring', 'summer', 'autumn', 'winter'];
function motif(c, w, s, ghost) {
  c.save(); c.translate(w / 2, w / 2); c.strokeStyle = c.fillStyle = ghost ? 'rgba(60,45,30,.45)' : ['#3f7a3a', '#d9a21c', '#b8862e', '#3e6f9a'][s]; c.lineWidth = w * 0.035; c.lineCap = 'round';
  if (s === 0) { c.beginPath(); c.ellipse(0, 0, w * 0.13, w * 0.3, 0.5, 0, TAU); if (ghost) c.stroke(); else c.fill(); if (!ghost) c.strokeStyle = '#1f4a1e'; c.beginPath(); c.moveTo(-w * 0.15, w * 0.24); c.lineTo(w * 0.15, -w * 0.24); c.stroke(); }        // a leaf
  else if (s === 1) { c.beginPath(); c.arc(0, 0, w * 0.14, 0, TAU); if (ghost) c.stroke(); else c.fill(); for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; c.beginPath(); c.moveTo(Math.cos(a) * w * 0.2, Math.sin(a) * w * 0.2); c.lineTo(Math.cos(a) * w * 0.32, Math.sin(a) * w * 0.32); c.stroke(); } }      // the sun
  else if (s === 2) { c.beginPath(); c.moveTo(0, w * 0.34); c.lineTo(0, -w * 0.3); c.stroke(); for (let i = 0; i < 5; i++) for (const sx of [-1, 1]) { c.beginPath(); c.ellipse(sx * w * 0.06, -w * 0.24 + i * w * 0.08, w * 0.05, w * 0.025, sx * 0.6, 0, TAU); if (ghost) c.stroke(); else c.fill(); } }      // wheat
  else for (let i = 0; i < 6; i++) { c.rotate(Math.PI / 3); c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -w * 0.32); c.moveTo(0, -w * 0.18); c.lineTo(w * 0.07, -w * 0.25); c.moveTo(0, -w * 0.18); c.lineTo(-w * 0.07, -w * 0.25); c.stroke(); }      // a snowflake
  c.restore();
}
const tess = (c, w, base) => { c.fillStyle = base; c.fillRect(0, 0, w, w); for (let i = 0; i < w; i += 8) for (let j = 0; j < w; j += 8) { c.fillStyle = `rgba(0,0,0,${0.03 + Math.random() * 0.06})`; c.fillRect(i, j, 7, 7); } };
feature({
  id: 'seasons154',
  secrets: [['seasons154', 'The four seasons, in stone']],
  M: null,
  init(k) {
    const room = k.plan.byId.G154; if (!room) return;
    const y = room.y, S = 0.7, H = 0.31;
    let at = null;
    for (let x = room.x1 - 2; x > room.x0 + 2 && !at; x -= 0.25) for (let z = room.z0 + 1.2; z < room.z1 - 1.2 && !at; z += 0.25) {
      let ok = true; for (const dx of [-0.9, 0, 0.9]) for (const dz of [-0.9, 0, 0.9]) if (!free(k, x + dx, z + dz, 0.12, room, y, 1.4)) ok = false;
      if (ok) at = { x, z };
    }
    if (!at) return;
    // The four tiles, set down wherever there was room, well away from where they go.
    const starts = []; for (let x = room.x0 + 1.5; x < room.x1 - 1.5 && starts.length < 4; x += 0.5) for (const z of [room.z0 + 2.4, room.z1 - 1.3, (room.z0 + room.z1) / 2]) { if (starts.length >= 4) break; if (Math.abs(x - at.x) < 6) continue; if (starts.some(q => Math.hypot(q.x - x, q.z - z) < 3)) continue; if (free(k, x, z, 0.45, room, y, 1.3)) starts.push({ x, z }); }
    if (starts.length < 4) return;
    // The floor: a border of key pattern round four squares, each lifted out and showing only the mark of what went there.
    const floorTex = canvasTex(512, 512, (c, w) => {
      tess(c, w, '#d8ccb2'); c.fillStyle = '#5a3a26'; const b = w * 0.07;
      for (let i = 0; i < w; i += b) { c.fillRect(i, 0, b * 0.5, b * 0.5); c.fillRect(i + b * 0.25, b * 0.5, b * 0.5, b * 0.25); c.fillRect(i, w - b * 0.5, b * 0.5, b * 0.5); c.fillRect(0, i, b * 0.5, b * 0.5); c.fillRect(w - b * 0.5, i, b * 0.5, b * 0.5); }
      const cell = (w - 2 * b) / 2;
      for (let s = 0; s < 4; s++) { const ox = b + (s % 2) * cell, oz = b + (s >> 1) * cell; c.fillStyle = '#6e6458'; c.fillRect(ox + 6, oz + 6, cell - 12, cell - 12); c.save(); c.translate(ox + 6, oz + 6); motif(c, cell - 12, s, true); c.restore(); }
    });
    const T = 2 * S + 0.3;
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(T, T), new THREE.MeshStandardMaterial({ map: floorTex, emissiveMap: floorTex, emissive: 0xffffff, emissiveIntensity: 0.3, roughness: 0.85,polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
    floor.rotation.x = -Math.PI / 2; floor.position.set(at.x, y + 0.006, at.z); k.group.add(floor);
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(T + 0.6, T + 0.6), new THREE.MeshBasicMaterial({ map: TX.radial(0, 1), color: new THREE.Color(1.3, 1.0, 0.6), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
    glow.rotation.x = -Math.PI / 2; glow.position.set(at.x, y + 0.02, at.z); glow.visible = false; k.group.add(glow);
    const cellW = (T - 2 * (T * 0.07)) / 2, slots = SEASON.map((_, s) => ({ x: at.x - cellW / 2 + (s % 2) * cellW, z: at.z - cellW / 2 + (s >> 1) * cellW }));
    const side = std({ color: 0xb8ad98, roughness: 0.9 });
    const tiles = SEASON.map((name, s) => {
      const tt = canvasTex(256, 256, (c, w) => { tess(c, w, '#d8ccb2'); motif(c, w, s, false); }), top = std({ map: tt, emissiveMap: tt, emissive: 0xffffff, emissiveIntensity: 0.3, roughness: 0.8 }), mesh = new THREE.Mesh(new THREE.BoxGeometry(2 * H, 0.06, 2 * H), [side, side, top, side, side, side]);
      const home = starts[(s + 2) % 4]; mesh.position.set(home.x, y + 0.03, home.z); mesh.rotation.y = (s - 1.5) * 0.3; k.group.add(mesh);
      return { s, name, mesh, x: home.x, z: home.z, y, hw: H, hd: H, vx: 0, vz: 0, set: false, home };
    });
    this.M = { room, y, at, slots, tiles, glow, done: false, g: 0 };
  },
  active(k) { const M = this.M; return !!M && (M.g > 0 || !M.done && k.inRoom(M.room.id, 2)); },
  update(dt, k) {
    const M = this.M;
    M.g = Math.max(0, M.g - dt * 0.4); M.glow.visible = M.g > 0; M.glow.material.opacity = M.g * 0.55;
    if (M.done) return;
    const loose = M.tiles.filter(t => !t.set);
    for (const t of loose) {
      k.push(t, dt, { room: M.room, others: M.tiles });
      // In its own square, it settles into place.
      const sl = M.slots[t.s];
      if (Math.hypot(t.x - sl.x, t.z - sl.z) < 0.24 && Math.abs(t.vx) + Math.abs(t.vz) < 1.5) {
        t.set = true; t.x = sl.x; t.z = sl.z; t.vx = t.vz = 0; k.sound.tick(0.1, 700, 0.08); k.synth.note(midi(69 + [0, 4, 7, 12][t.s]), 1.6, { type: 'sine', vol: 0.05 });
        const n = M.tiles.filter(q => q.set).length;
        if (n === 4) { M.done = true; M.g = 1.6; k.callout('THE FOUR SEASONS'); k.find('seasons154'); k.synth.chime([69, 73, 76, 81].map(midi), { gap: 0.2, dur: 2.4, vol: 0.05 }); }
        else k.say(`${t.name[0].toUpperCase() + t.name.slice(1)}, back in its place. ${n} of 4.`, 0, 3);
      }
      t.mesh.position.set(t.x, M.y + (t.set ? 0.004 : 0.03), t.z);
    }
    for (const t of M.tiles) if (t.set && Math.abs(t.mesh.rotation.y) > 0.001) { t.mesh.rotation.y *= 1 - Math.min(1, dt * 8); t.mesh.position.set(t.x, M.y + 0.004, t.z); }
  },
  spots() { const M = this.M; if (!M) return []; return [{ kind: 'secret', id: 'seasons154', name: 'Mosaic of the seasons (push the tiles home)', x: M.at.x, y: M.y, z: M.at.z }, ...M.tiles.map(t => ({ kind: 'todo', id: 'seasons154-' + t.name, name: 'Mosaic tile: ' + t.name, x: t.home.x, y: M.y, z: t.home.z }))]; },
  reset() { const M = this.M; if (!M || M.done) return; for (const t of M.tiles) if (!t.set) { t.x = t.home.x; t.z = t.home.z; t.vx = t.vz = 0; t.mesh.position.set(t.x, M.y + 0.03, t.z); } },
});

// ---------------------------------------------------------------- 5. the herring, Gallery 161
feature({
  id: 'herring161',
  secrets: [['herring161', 'The one that got away... caught']],
  F: null, t: 0,
  init(k) {
    const a = art(k, 'G161', /Herring Net/i), room = k.plan.byId.G161; if (!a || !room) return;
    const g = new THREE.Group(), silver = std({ color: 0x9fb4bf, metalness: 0.75, roughness: 0.25, emissive: 0x334450, emissiveIntensity: 0.6 }), back = std({ color: 0x3c5a62, metalness: 0.6, roughness: 0.3, emissive: 0x15242a });
    const body = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 10), silver); body.scale.set(0.13, 0.034, 0.03); g.add(body);
    const top = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 8, 0, TAU, 0, Math.PI / 2), back); top.scale.set(0.125, 0.03, 0.026); top.position.y = 0.004; g.add(top);
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.07, 4), silver); tail.rotation.z = -Math.PI / 2; tail.scale.set(1, 1, 0.25); tail.position.x = -0.15; g.add(tail);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.008, 6, 4), new THREE.MeshBasicMaterial({ color: 0x050505 })); eye.position.set(0.1, 0.008, 0.024); g.add(eye);
    g.visible = false; k.group.add(g);
    this.F = { art: a, room, y: room.y, g, tail, state: 'net', hops: 0, x: 0, z: 0, from: null, to: null, t: 0, sea: 0, gullIn: 0, waveIn: 0 };
  },
  spot(k, x, z, rmin, rmax) {
    const F = this.F; for (let n = 0; n < 30; n++) { const a = Math.random() * TAU, d = rmin + Math.random() * (rmax - rmin), tx = x + Math.cos(a) * d, tz = z + Math.sin(a) * d; if (free(k, tx, tz, 0.2, F.room, F.y, 0.6) && Math.hypot(tx - F.art.x, tz - F.art.z) < 12) return { x: tx, z: tz }; }
    return null;
  },
  onLook(a, k) {
    const F = this.F; if (!F || a !== F.art) return;
    F.sea = 30; if (F.state !== 'net') return;
    F.state = 'jump'; F.t = 0;
    F.from = { x: a.x + a.nx * 0.12, y: a.y - a.h / 2 - (a.frame || 0.08) - 0.04, z: a.z + a.nz * 0.12 };      // from under the frame, never across the picture
    F.to = this.spot(k, a.x + a.nx * 1.4, a.z + a.nz * 1.4, 0.2, 1.0) || { x: a.x + a.nx * 1.2, z: a.z + a.nz * 1.2 };
    F.to.y = F.y + 0.035; F.g.visible = true;
    k.say('Something silver dropped from under the frame. It is flapping about on the floor.', 2.2, 6);
  },
  active(k) { const F = this.F; return !!F && (F.sea > 0 || F.state !== 'net' && F.state !== 'caught' && k.inRoom(F.room.id, 4)); },
  update(dt, k) {
    const F = this.F, p = k.pos, near = k.inRoom(F.room.id, 4); this.t += dt;
    // The sea in the painting: a long wash of surf, and gulls.
    if (F.sea > 0) { F.sea -= dt; if (near && live(k)) { const g = gain(k, F.art.x, F.art.z, 30) * Math.min(1, F.sea / 4) * music(k);
      F.waveIn -= dt; if (F.waveIn <= 0 && g > 0.05) { F.waveIn = 3.2 + Math.random() * 1.5; k.synth.noise(3.4, { vol: 0.06 * g, lp: 500 + Math.random() * 300 }); }
      F.gullIn -= dt; if (F.gullIn <= 0 && g > 0.05) { F.gullIn = 3 + Math.random() * 5; gull(k, 0.02 * g); } } }
    if (F.state === 'net' || F.state === 'caught' || !near) return;
    if (F.state === 'jump' || F.state === 'hop') {
      F.t = Math.min(1, F.t + dt * (F.state === 'jump' ? 1.1 : 1.8)); const s = F.t, h = F.state === 'jump' ? 0.12 : 0.45;      // (the leap off the frame stays low: down and out, not up across the picture)
      F.g.position.set(F.from.x + (F.to.x - F.from.x) * s, F.from.y + (F.to.y - F.from.y) * s + Math.sin(Math.PI * s) * h, F.from.z + (F.to.z - F.from.z) * s);
      F.g.rotation.set(0, Math.atan2(-(F.to.z - F.from.z), F.to.x - F.from.x), Math.sin(s * TAU * 1.5) * 0.9);
      if (F.t >= 1) { F.state = 'floor'; F.x = F.to.x; F.z = F.to.z; k.sound.tick(0.07, 1300, 0.05); }
      return;
    }
    // On the floor, flapping where it lies; come near and it hops off, until it tires.
    F.g.position.set(F.x, F.y + 0.035 + Math.max(0, Math.sin(this.t * 9)) * 0.03, F.z); F.g.rotation.x = Math.sin(this.t * 13) * 0.6; F.tail.rotation.y = Math.sin(this.t * 20) * 0.5;
    if (Math.random() < dt * 1.2) k.sound.tick(0.03 * gain(k, F.x, F.z, 10), 1500, 0.03);
    if (!k.close({ x: F.x, y: F.y, z: F.z }, F.hops >= 4 ? 0.35 : 0.85, 0.6)) return;
    if (F.hops >= 4) { F.state = 'caught'; F.g.visible = false; k.synth.noise(0.5, { vol: 0.06, lp: 2500 }); k.callout('CAUGHT IT'); k.find('herring161'); k.say('One herring, returned to the North Atlantic (by way of the conservation studio).', 0.4, 6); return; }
    const away = Math.atan2(F.z - p.z, F.x - p.x), to = this.spot(k, F.x + Math.cos(away) * 1.8, F.z + Math.sin(away) * 1.8, 0, 0.9) || this.spot(k, F.x, F.z, 1.4, 2.6);
    if (to) { F.hops++; F.state = 'hop'; F.t = 0; F.from = { x: F.x, y: F.y + 0.035, z: F.z }; F.to = { ...to, y: F.y + 0.035 }; k.sound.tick(0.06, 1800, 0.04); }
  },
  spots() { const F = this.F; return F ? [{ kind: 'secret', id: 'herring161', name: 'The Herring Net (look, then catch the fish)', x: F.art.x, y: F.y, z: F.art.z }] : []; },
  reset() { const F = this.F; if (F && F.state !== 'caught') { F.state = 'net'; F.hops = 0; F.g.visible = false; F.sea = 0; } },
});
