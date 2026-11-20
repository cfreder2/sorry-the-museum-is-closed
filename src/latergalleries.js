// Things to find and do in four galleries of later painting (features.js):
//   G243, Monet: the stacks of wheat change the light of the room to their own hour and season; looking at the
//         Water Lilies opens a pond in the floor, with lily pads to hop across to a frog.
//   G242, Toulouse-Lautrec: At the Moulin Rouge strikes up the can-can (Offenbach, 1858) over a floor of lit
//         squares to dance on; At the Circus lays a sawdust ring to drive round, fast.
//   G226, Degas: a slalom through practice barres, from the mark by the west door.
//   G246, Hammershøi: the Music Room hums one held note; an upright piano by the east wall to play a chord on.
// Only works with nothing in `work.c` are ever acted on, and none of them is changed: everything is round them.
import * as THREE from 'three';
import { feature } from './features.js';

const hz = m => 440 * Math.pow(2, (m - 69) / 12);
const fall = (d, far) => (d >= far ? 0 : (1 - d / far) ** 2);
const dist = (k, q) => Math.hypot(k.pos.x - q.x, k.pos.z - q.z);
const artIn = (k, room, re) => k.museum.arts.find(a => a.room === room && !a.work.c && re.test(String(a.work.t || '')));
const ctxOf = k => (k.sound && k.sound.ctx && k.sound.ctx.state === 'running' ? k.sound.ctx : null);
function bus(k) { const c = ctxOf(k); if (!c) return null; const g = c.createGain(); g.gain.value = 0; g.connect(k.sound.master); return g; }
function tone(c, out, f, t, dur, { type = 'triangle', vol = 0.05, attack = 0.008 } = {}) {
  const o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.value = f;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + attack); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(out); o.start(t); o.stop(t + dur + 0.05);
}
const flat = (w, d, color, opacity = 1) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ color, transparent: opacity < 1, opacity, depthWrite: opacity >= 1, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })); m.rotation.x = -Math.PI / 2; return m; };
let speck = null;           // a soft round dot, so that a mote is not a square
function dust(n, size) {
  if (!speck) { const c = document.createElement('canvas'); c.width = c.height = 32; const x = c.getContext('2d'), gr = x.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.45, 'rgba(255,255,255,0.8)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, 32, 32); speck = new THREE.CanvasTexture(c); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  const p = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size, map: speck, transparent: true, opacity: 0.85, depthWrite: false })); p.frustumCulled = false; p.visible = false; return p;
}

// ================================================================ G243: Monet
const SEASONS = {
  summer: { tint: 0xfff0c4, mote: 0xffe6a0, sink: -0.04, sway: 0.1, size: 0.03, line: 'End of summer: the room goes hazy and warm, and there is pollen in the air.' },
  autumn: { tint: 0xffc999, mote: 0xffa860, sink: 0.12, sway: 0.18, size: 0.035, line: 'Autumn, the end of the day: the light goes long and amber.' },
  sunset: { tint: 0xffa98c, mote: 0xffc4a8, sink: 0.04, sway: 0.1, size: 0.03, line: 'Sunset: the room turns rose.' },
  snow: { tint: 0xd6d0f2, mote: 0xffffff, sink: 0.45, sway: 0.25, size: 0.045, line: 'Snow, at sunset: the light goes violet, and it starts to snow.' },
};
const seasonOf = t => (/snow|winter/i.test(t) ? 'snow' : /autumn|fall/i.test(t) ? 'autumn' : /sunset|evening/i.test(t) ? 'sunset' : 'summer');

feature({
  id: 'monet243',
  secrets: [['wheat', 'The seasons of the wheat'], ['lilypad', 'The frog on the lily pad']],
  init(k) {
    const r = this.r = k.plan.byId.G243; if (!r) return;
    this.stacks = k.museum.arts.filter(a => a.room === 'G243' && !a.work.c && /stacks? of wheat|grainstack|haystack/i.test(String(a.work.t || '')))
      .map(a => ({ a, season: seasonOf(a.work.t), at: { x: a.x + a.nx * 1.3, y: r.y, z: a.z + a.nz * 1.3 } }));
    this.seen = new Set(); this.cur = null; this.tint = k.tint('G243');
    // the air: pollen, leaves of light, snow
    const N = 420; this.motes = dust(N, 0.035); this.mv = new Float32Array(N);
    const P = this.motes.geometry.attributes.position.array;
    for (let i = 0; i < N; i++) { P[i * 3] = r.x0 + Math.random() * (r.x1 - r.x0); P[i * 3 + 1] = r.y + Math.random() * 3.2; P[i * 3 + 2] = r.z0 + Math.random() * (r.z1 - r.z0); this.mv[i] = Math.random() * 6.28; }
    k.group.add(this.motes);
    // the pond, out of sight until the Water Lilies have been looked at
    const L = this.lilies = artIn(k, 'G243', /^water lilies/i);
    if (L) {
      const cx = L.x, cz = (r.z0 + r.z1) / 2, x0 = Math.max(r.x0 + 1, cx - 2.6), x1 = Math.min(r.x1 - 1, cx + 3.1);
      const P0 = this.pond = { x0, x1, z0: cz - 1.5, z1: cz + 1.5, cz, open: false, want: false, t: 0, pads: [], top: r.y + 0.12 };
      const g = P0.group = new THREE.Group(); g.visible = false; k.group.add(g);
      const water = P0.water = flat(x1 - x0, 3, 0x1d4650, 0.93); water.position.set((x0 + x1) / 2, r.y + 0.006, cz); g.add(water);
      const rim = flat(x1 - x0 + 0.16, 3.16, 0x56664a, 0.9); rim.position.set((x0 + x1) / 2, r.y + 0.004, cz); g.add(rim);
      const pad = new THREE.MeshStandardMaterial({ color: 0x62a346, roughness: 0.7, emissive: 0x2c5a1a, emissiveIntensity: 0.8 });
      const n = 5, step = (x1 - x0 - 0.9) / (n - 1);
      for (let i = 0; i < n; i++) {
        const x = x0 + 0.45 + i * step, z = cz + [0.25, -0.35, 0.3, -0.25, 0.1][i];
        const m = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.12, 24, 1, false, 0.35, Math.PI * 2 - 0.5), pad); m.position.set(x, r.y + 0.06, z); m.rotation.y = i * 1.7; g.add(m);
        if (i % 2 === 1) { const fl = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), new THREE.MeshStandardMaterial({ color: 0xf2b8cf, emissive: 0x5a2a3c, emissiveIntensity: 0.6 })); fl.position.set(x + 0.2, r.y + 0.15, z - 0.15); fl.scale.y = 0.6; g.add(fl); }
        P0.pads.push({ x, z, m, s: { skin: 'wall', fixed: true, pond: true, x0: x - 0.42, x1: x + 0.42, z0: z - 0.42, z1: z + 0.42, axis: null, h0: P0.top, h1: P0.top, base: r.y } });
      }
      // the frog, on the far pad
      const fg = P0.frog = new THREE.Group(), skin = new THREE.MeshStandardMaterial({ color: 0x6fae3a, roughness: 0.6, emissive: 0x1e3a0c, emissiveIntensity: 0.5 });
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.09, 14, 10), skin); body.scale.set(1, 0.7, 1.25); body.position.y = 0.06; fg.add(body);
      for (const s of [-1, 1]) {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), skin); eye.position.set(s * 0.045, 0.12, 0.06); fg.add(eye);
        const pup = new THREE.Mesh(new THREE.SphereGeometry(0.014, 6, 5), new THREE.MeshBasicMaterial({ color: 0x111111 })); pup.position.set(s * 0.05, 0.13, 0.085); fg.add(pup);
      }
      const last = P0.pads[n - 1]; fg.position.set(last.x + 0.1, P0.top, last.z); fg.rotation.y = -Math.PI / 2; g.add(fg); P0.croak = 2;
      this.drips = dust(24, 0.03); this.drips.material.color.set(0x9fd0e8); this.dv = new Float32Array(24 * 3); this.dripT = 0; k.group.add(this.drips);
    }
  },
  active(k) { return !!this.r && (k.inRoom('G243', 3) || this.cur || (this.pond && this.pond.open)); },
  onLook(art) { if (this.pond && art === this.lilies) this.pond.want = true; },
  update(dt, k) {
    const inside = k.inRoom('G243', 0.2);
    // ---- the seasons
    if (inside) for (const s of this.stacks) if (k.close(s.at, 1.8) && this.cur !== s) this._season(s, k);
    if (!inside && this.cur) { this.cur = null; this.tint.off(1); this.motes.visible = false; }
    if (this.motes.visible) {
      const S = SEASONS[this.cur.season], P = this.motes.geometry.attributes.position.array, r = this.r, t = k.G.t || 0;
      for (let i = 0; i < this.mv.length; i++) {
        P[i * 3 + 1] -= S.sink * dt * (0.6 + (i % 5) * 0.15); P[i * 3] += Math.sin(t * 0.7 + this.mv[i]) * S.sway * dt; P[i * 3 + 2] += Math.cos(t * 0.5 + this.mv[i]) * S.sway * 0.6 * dt;
        if (P[i * 3 + 1] < r.y) P[i * 3 + 1] = r.y + 3.2; else if (P[i * 3 + 1] > r.y + 3.3) P[i * 3 + 1] = r.y + 0.05;
      }
      this.motes.geometry.attributes.position.needsUpdate = true;
    }
    // ---- the pond
    const p = this.pond; if (!p) return;
    if (p.want && k.G.state === 'play') { p.want = false; if (!p.open) this._open(k); }
    if (p.open && !k.inRoom('G243', 0.4)) this._close(k);
    if (this.dripT > 0) this._drip(dt, k);
    if (!p.open) return;
    p.t += dt; const a = Math.min(1, p.t / 1.2); p.group.scale.set(1, 1, 1); p.water.material.opacity = 0.93 * a;
    for (const q of p.pads) q.m.scale.setScalar(0.3 + 0.7 * a);
    const v = k.v, x = v.pos.x, z = v.pos.z;
    const inPond = x > p.x0 + 0.04 && x < p.x1 - 0.04 && z > p.z0 + 0.04 && z < p.z1 - 0.04;
    const onPad = p.pads.find(q => x > q.s.x0 && x < q.s.x1 && z > q.s.z0 && z < q.s.z1);
    if (inPond && !v.air && !onPad && v.pos.y < p.top - 0.05) this._splash(k);
    else if (onPad && onPad === p.pads[p.pads.length - 1] && !v.air && v.pos.y > p.top - 0.04 && !p.frogGone) {
      p.frogGone = 1; if (k.find('lilypad')) k.callout('RIBBIT'); else k.say('The frog has seen you before. Plop.');
      this._croak(k, 1);
    }
    // the frog sits, croaks now and then, and when visited leaps into the water and comes back later
    const fg = p.frog;
    if (p.frogGone) { p.frogGone += dt; const u = Math.min(1, (p.frogGone - 1) / 0.6); fg.position.y = p.top + Math.sin(u * Math.PI) * 0.35 - u * 0.2; fg.position.x = p.pads[p.pads.length - 1].x + 0.1 + u * 0.9; fg.visible = u < 1; if (p.frogGone > 9 && !onPad) { p.frogGone = 0; fg.visible = true; fg.position.set(p.pads[p.pads.length - 1].x + 0.1, p.top, p.pads[p.pads.length - 1].z); } }
    else { p.croak -= dt; if (p.croak < 0) { p.croak = 4 + Math.random() * 4; this._croak(k, fall(dist(k, fg.position), 9)); } fg.scale.y = 1 + Math.max(0, Math.sin((k.G.t || 0) * 9)) * (p.croak > 3.6 ? 0.15 : 0); }
  },
  _season(s, k) {
    const S = SEASONS[s.season]; this.cur = s;
    this.tint.set(S.tint, 1.6);
    this.motes.material.color.set(S.mote); this.motes.material.size = S.size; this.motes.visible = true;
    k.synth.chime(s.season === 'snow' ? [hz(76), hz(83), hz(88)] : s.season === 'autumn' ? [hz(69), hz(72), hz(76)] : [hz(72), hz(76), hz(79)], { vol: 0.03, gap: 0.22 });
    if (!this.seen.has(s.a)) { this.seen.add(s.a); k.say(S.line); }
    if (this.stacks.length >= 2 && this.seen.size >= this.stacks.length && k.find('wheat')) k.callout('ALL THE SEASONS');
  },
  _open(k) {
    const p = this.pond, r = this.r; p.open = true; p.t = 0; p.group.visible = true; p.frogGone = 0; p.frog.visible = true;
    for (const q of p.pads) k.plan.surfaces.push(q.s);
    const v = k.v; if (v.pos.x > p.x0 - 0.3 && v.pos.x < p.x1 + 0.3 && v.pos.z > p.z0 - 0.3 && v.pos.z < p.z1 + 0.3 && Math.abs(v.pos.y - r.y) < 0.5) v.place(p.x0 - 0.5, p.cz + 0.25, Math.PI / 2, r.y);
    k.say('Where the floor was, a pond. A frog waits on the far pad: hop from pad to pad.');
    k.synth.chime([hz(67), hz(71), hz(74), hz(79)], { vol: 0.03, gap: 0.12 });
  },
  _close(k) {
    const p = this.pond; p.open = false; p.group.visible = false;
    k.plan.surfaces.splice(0, k.plan.surfaces.length, ...k.plan.surfaces.filter(s => !s.pond));
  },
  _splash(k) {
    const p = this.pond, v = k.v;
    k.synth.noise(0.5, { vol: 0.12, lp: 1400 }); k.synth.note(hz(50), 0.25, { type: 'sine', vol: 0.06 });
    v.place(p.x0 - 0.5, p.cz + 0.25, Math.PI / 2, this.r.y);
    k.say('Plop. Fished out at the edge of the pond, dripping.');
    this.dripT = 3; const P = this.drips.geometry.attributes.position.array; for (let i = 0; i < 24; i++) { P[i * 3] = 9999; this.dv[i * 3 + 1] = -1; }
    this.drips.visible = true;
  },
  _drip(dt, k) {
    this.dripT -= dt; const P = this.drips.geometry.attributes.position.array, V = this.dv, c = k.pos;
    for (let i = 0; i < 24; i++) {
      if (P[i * 3 + 1] < this.r.y || V[i * 3 + 1] < -0.5 && P[i * 3] === 9999) { if (this.dripT > 0 && Math.random() < dt * 6) { P[i * 3] = c.x + (Math.random() - 0.5) * 0.16; P[i * 3 + 1] = c.y + 0.08; P[i * 3 + 2] = c.z + (Math.random() - 0.5) * 0.16; V[i * 3 + 1] = 0; } else { P[i * 3] = 9999; V[i * 3 + 1] = -1; continue; } }
      V[i * 3 + 1] -= 9.8 * dt * 0.6; P[i * 3 + 1] += V[i * 3 + 1] * dt;
    }
    this.drips.geometry.attributes.position.needsUpdate = true;
    if (this.dripT <= -1) this.drips.visible = false;
  },
  _croak(k, vol) { if (vol <= 0.01) return; k.synth.note(hz(41), 0.12, { type: 'square', vol: 0.025 * vol }); k.synth.note(hz(40), 0.16, { type: 'square', vol: 0.025 * vol, at: 0.16 }); },
  spots() {
    const out = [];
    if (this.stacks && this.stacks[0]) { const s = this.stacks[0]; out.push({ kind: 'secret', id: 'wheat', name: 'The seasons of the wheat', x: s.at.x, y: this.r.y, z: s.at.z }); }
    if (this.pond) { const q = this.pond.pads[this.pond.pads.length - 1]; out.push({ kind: 'secret', id: 'lilypad', name: 'The frog on the lily pad', x: q.x, y: this.r.y, z: q.z }); }
    return out;
  },
  reset(k) { if (!this.r) return; this.seen.clear(); this.cur = null; this.tint.off(0.01); this.motes.visible = false; if (this.pond && this.pond.open) this._close(k); },
});

// ================================================================ G242: Toulouse-Lautrec
// The can-can: Offenbach's galop from Orpheus in the Underworld (1858), one eighth note to a slot, 8 bars of 2/4.
const TUNE = [[72, 2], [74, 1], [77, 1], [76, 1], [74, 1], [79, 2], [79, 2], [79, 1], [81, 1], [76, 1], [77, 1], [74, 2], [74, 2], [74, 1], [77, 1], [76, 1], [74, 1], [72, 1], [84, 1], [83, 1], [81, 1], [79, 1], [77, 1], [76, 1], [74, 1], [72, 2]];
const ROOTS = [48, 43, 48, 43, 43, 48, 43, 48];                 // C, G under each bar (oom: the root; pah: the chord)
const SLOTS = []; { let s = 0; for (const [m, d] of TUNE) { SLOTS[s] = [m, d]; s += d; } }
const EIGHTH = 0.21, BAR = EIGHTH * 4, ROUND = 8;
const TILE = [0xe8413c, 0xf2c230, 0x3b7de0, 0x3fb55a, 0xd94fb0, 0xf08a2a, 0x3cc6d0, 0xf59ab8, 0xf4efe0];

feature({
  id: 'lautrec242',
  secrets: [['cancan', 'Can-can'], ['circus', 'Three times round the ring']],
  init(k) {
    const r = this.r = k.plan.byId.G242; if (!r) return;
    const M = this.moulin = artIn(k, 'G242', /moulin rouge/i);
    if (M) {
      const cx = M.x, cz = M.z + M.nz * 2.2, g = this.floor = new THREE.Group(); g.visible = false; k.group.add(g);
      this.tiles = [];
      for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) {
        const x = cx + (i - 1) * 0.92, z = cz + (j - 1) * 0.92, m = flat(0.86, 0.86, TILE[j * 3 + i], 0.3); m.position.set(x, r.y + 0.008, z); g.add(m);
        this.tiles.push({ x, z, m });
      }
      this.fc = { x: cx, y: r.y, z: cz };
    }
    const C = this.circus = artIn(k, 'G242', /^at the circus/i);
    if (C) {
      const cx = Math.max(r.x0 + 2.8, Math.min(r.x1 - 2.8, C.x)), cz = (r.z0 + r.z1) / 2, g = this.ring = new THREE.Group(); g.visible = false; k.group.add(g);
      const cv = document.createElement('canvas'); cv.width = cv.height = 128; const x2 = cv.getContext('2d'); x2.fillStyle = '#c9a46e'; x2.fillRect(0, 0, 128, 128);
      for (let i = 0; i < 1400; i++) { const l = 150 + Math.random() * 70 | 0; x2.fillStyle = `rgb(${l},${l * 0.78 | 0},${l * 0.5 | 0})`; x2.fillRect(Math.random() * 128, Math.random() * 128, 1 + Math.random() * 2, 1); }
      const tex = new THREE.CanvasTexture(cv); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(4, 4); tex.colorSpace = THREE.SRGBColorSpace;
      const band = new THREE.Mesh(new THREE.RingGeometry(1.35, 2.5, 72), new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.95, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
      band.rotation.x = -Math.PI / 2; band.position.set(cx, r.y + 0.007, cz); g.add(band);
      for (const [a, b, c] of [[2.5, 2.6, 0xb0262a], [1.27, 1.35, 0xf4efe0]]) { const m = new THREE.Mesh(new THREE.RingGeometry(a, b, 72), new THREE.MeshBasicMaterial({ color: c, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 })); m.rotation.x = -Math.PI / 2; m.position.set(cx, r.y + 0.008, cz); g.add(m); }
      this.rc = { x: cx, y: r.y, z: cz }; this.lap = { acc: 0, last: null, slow: 0, n: 0 };
    }
    this.dance = { on: false, want: false };
  },
  active(k) { return !!this.r && (k.inRoom('G242', 3) || this.dance.on || (this.ring && this.ring.visible)); },
  onLook(art) { if (art === this.moulin && this.floor) this.dance.want = true; if (art === this.circus && this.ring) this.ringWant = true; },
  update(dt, k) {
    const inside = k.inRoom('G242', 0.3), D = this.dance;
    // ---- the can-can
    if (D.want && k.G.state === 'play') { D.want = false; if (!D.on) this._strike(k); }
    if (D.on && !inside) this._stop(k);
    if (D.on) this._dance(dt, k);
    // ---- the ring
    if (this.ringWant && k.G.state === 'play') { this.ringWant = false; if (!this.ring.visible) { this.ring.visible = true; this.lap = { acc: 0, last: null, slow: 0, n: 0 }; k.say('Sawdust, and a ring. Three laps of it, at a gallop.'); k.synth.chime([hz(67), hz(72), hz(76), hz(79)], { vol: 0.035, gap: 0.1 }); } }
    if (this.ring && this.ring.visible) { if (!inside) this.ring.visible = false; else this._laps(dt, k); }
  },
  _strike(k) {
    const c = ctxOf(k); if (!c) { k.say('(No sound yet: tap or press a key once, and look again.)'); return; }
    const D = this.dance; D.on = true; D.bus = bus(k); D.next = c.currentTime + 0.15; D.slot = 0; D.t0 = D.next; D.round = null; D.wait = 2; D.done = false;
    this.floor.visible = true; k.say('The can-can! Drive onto each square as it lights, in time with the band.');
  },
  _stop(k) {
    const D = this.dance; D.on = false; this.floor.visible = false;
    if (D.bus) { const c = D.bus.context, b = D.bus; b.gain.setTargetAtTime(0, c.currentTime, 0.08); setTimeout(() => b.disconnect(), 600); D.bus = null; }
  },
  _dance(dt, k) {
    const D = this.dance, c = D.bus && D.bus.context; if (!c) return;
    // the band: schedule a little ahead, and fade with distance from the dance floor
    D.bus.gain.setTargetAtTime(0.9 * fall(dist(k, this.fc), 14), c.currentTime, 0.1);
    while (D.next < c.currentTime + 0.3) {
      const s = D.slot % 32, bar = Math.floor(s / 4), n = SLOTS[s];
      if (n) { tone(c, D.bus, hz(n[0]), D.next, n[1] * EIGHTH * 0.9, { vol: 0.05 }); tone(c, D.bus, hz(n[0]), D.next, n[1] * EIGHTH * 0.6, { type: 'square', vol: 0.012 }); }
      if (s % 2 === 0) { const root = ROOTS[bar]; if (s % 4 === 0) tone(c, D.bus, hz(root - 12), D.next, EIGHTH * 1.2, { vol: 0.07 }); else for (const m of root === 48 ? [64, 67] : [62, 65]) tone(c, D.bus, hz(m - 12), D.next, EIGHTH * 0.7, { vol: 0.03 }); }
      D.next += EIGHTH; D.slot++;
    }
    // the floor: every square pulses on the beat; the one wanted burns
    const now = c.currentTime - D.t0, beat = (now / (EIGHTH * 2)) % 1, R = D.round;
    for (let i = 0; i < this.tiles.length; i++) { const T = this.tiles[i]; T.m.material.opacity = R && R.want === i ? (beat < 0.5 ? 0.98 : 0.75) : 0.07 + 0.13 * Math.max(0, 1 - beat * 3); }
    const v = k.v, on = this.tiles.findIndex(T => Math.abs(v.pos.x - T.x) < 0.46 && Math.abs(v.pos.z - T.z) < 0.46 && Math.abs(v.pos.y - this.r.y) < 0.4);
    if (!R) {                                   // between rounds: start one on the next bar, if the toy is on (or by) the floor
      D.wait -= dt; if (D.wait > 0 || dist(k, this.fc) > 3) return;
      D.round = { n: 0, want: -1, until: 0, at: this._bar(now) };
      return;
    }
    if (R.want < 0) { if (now < R.at) return; R.want = this._pick(on); R.left = BAR * (R.n < 4 ? 3 : 2) + 0.15; return; }      // (the time allowed is counted in game time, so a slow frame never costs a step)
    if (on === R.want) {
      R.n++; k.synth.note(hz([72, 76, 79, 84, 79, 76, 79, 84][R.n - 1] || 84), 0.25, { type: 'sine', vol: 0.05 });
      if (R.n >= ROUND) { D.round = null; D.wait = 6; if (k.find('cancan')) k.callout('CAN-CAN!'); else k.say('Bravo! Encore?'); for (const T of this.tiles) T.m.material.opacity = 1; return; }
      R.want = -1; R.at = this._bar(now);
    } else if ((R.left -= dt) < 0) { k.say(`Out of step, after ${R.n} of ${ROUND}. The band plays on: again from the next bar.`); k.synth.noise(0.25, { vol: 0.06, lp: 600 }); D.round = null; D.wait = 2.5; }
  },
  _bar(now) { return (Math.floor(now / BAR) + 1) * BAR; },
  _pick(on) { let i; do i = Math.floor(Math.random() * this.tiles.length); while (i === on || i === this._lastPick); this._lastPick = i; return i; },
  _laps(dt, k) {
    const L = this.lap, v = k.v, dx = v.pos.x - this.rc.x, dz = v.pos.z - this.rc.z, d = Math.hypot(dx, dz), sp = Math.hypot(v.vel.x, v.vel.z);
    const onRing = d > 1.25 && d < 2.7 && Math.abs(v.pos.y - this.r.y) < 0.6;
    if (!onRing) { if (Math.abs(L.acc) > Math.PI) k.say('Off the ring. Back on, and round again.'); L.acc = 0; L.last = null; L.n = 0; return; }
    const a = Math.atan2(dz, dx);
    if (L.last !== null) {
      let da = a - L.last; if (da > Math.PI) da -= 2 * Math.PI; if (da < -Math.PI) da += 2 * Math.PI;
      if (L.acc && Math.sign(da) !== Math.sign(L.acc) && Math.abs(da) > 0.02) { L.acc = 0; L.n = 0; }
      L.acc += da;
    }
    L.last = a;
    L.slow = sp < 2.2 ? L.slow + dt : 0;
    if (L.slow > 0.7) { if (Math.abs(L.acc) > Math.PI) k.say('Too slow for the ring: it wants a gallop.'); L.acc = 0; L.n = 0; L.slow = 0; return; }
    const n = Math.floor(Math.abs(L.acc) / (2 * Math.PI));
    if (n > L.n) {
      L.n = n; k.synth.noise(0.12, { vol: 0.07, lp: 3000 }); k.synth.noise(0.12, { vol: 0.07, lp: 3000, at: 0.14 });
      if (n < 3) k.say(n === 1 ? 'One lap!' : 'Two!');
      else { L.acc = 0; L.n = 0; if (k.find('circus')) k.callout('THREE TIMES ROUND'); else k.say('Three laps! Hup!'); k.synth.chime([hz(72), hz(76), hz(79), hz(84)], { vol: 0.04, gap: 0.09 }); }
    }
  },
  spots() {
    const out = [];
    if (this.fc) out.push({ kind: 'secret', id: 'cancan', name: 'Can-can', x: this.fc.x, y: this.r.y, z: this.fc.z });
    if (this.rc) out.push({ kind: 'secret', id: 'circus', name: 'Three times round the ring', x: this.rc.x, y: this.r.y, z: this.rc.z });
    return out;
  },
  reset(k) { if (!this.r) return; if (this.dance.on) this._stop(k); this.dance.want = false; if (this.ring) this.ring.visible = false; },
});

// ================================================================ G226: Degas
feature({
  id: 'degas226',
  secrets: [['pasdedeux', 'Pas de deux']],
  init(k) {
    const r = this.r = k.plan.byId.G226; if (!r) return;
    const west = k.plan.doorsOf('G226').find(d => Math.abs(d.x0 - r.x0) < 0.5 && Math.abs(d.x1 - r.x0) < 0.5);
    const c = this.c = west ? (west.z0 + west.z1) / 2 : (r.z0 + r.z1) / 2, y = r.y;
    this.start = { x: r.x0 + 1.3, y, z: c };
    const n = 5, xs = Array.from({ length: n }, (_, i) => r.x0 + 2.7 + i * (r.x1 - r.x0 - 4.6) / (n - 1));
    const wood = new THREE.MeshStandardMaterial({ color: 0xb07a45, roughness: 0.5, emissive: 0x3a240e, emissiveIntensity: 0.5 });
    const iron = new THREE.MeshStandardMaterial({ color: 0x2b2b2e, roughness: 0.6, metalness: 0.5 });
    const tape = 0xf3c6cf;
    this.barres = xs.map((x, i) => {
      const s = i % 2 ? -1 : 1, za = c - s * 0.2, zb = c + s * 1.35, z0 = Math.min(za, zb), z1 = Math.max(za, zb), zm = (z0 + z1) / 2, L = z1 - z0;
      const g = new THREE.Group(); g.position.set(x, y, zm); g.visible = false; k.group.add(g);
      for (const e of [-1, 1]) { const post = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.95, 10), iron); post.position.set(0, 0.475, e * (L / 2 - 0.05)); g.add(post); const foot = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.04, 0.06), iron); foot.position.set(0, 0.02, e * (L / 2 - 0.05)); g.add(foot); }
      for (const h of [0.5, 0.92]) { const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, L, 12), wood); rail.rotation.x = Math.PI / 2; rail.position.y = h; g.add(rail); }
      const run = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.07, L), iron); run.position.y = 0.035; g.add(run);
      const gate = { x, z: c - s * 0.85, r: 0.45 };
      const mk = flat(0.3, 0.04, tape, 0.45), mk2 = flat(0.04, 0.3, tape, 0.45); mk.position.set(gate.x, y + 0.005, gate.z); mk2.position.set(gate.x, y + 0.005, gate.z); k.group.add(mk, mk2);
      return { g, gate, box: { x0: x - 0.12, x1: x + 0.12, z0, z1, y0: y, y1: y + 0.95 } };
    });
    const sm = this.startMark = flat(0.5, 0.5, 0xf6d7de, 0.5); sm.position.set(this.start.x, y + 0.005, c); k.group.add(sm);
    const fin = flat(0.06, 1.4, tape, 0.5); fin.position.set(r.x1 - 1.1, y + 0.005, c); k.group.add(fin);
    const gates = [{ x: this.start.x + 0.4, z: c, r: 0.7 }, ...this.barres.map(b => b.gate), { x: r.x1 - 1.1, z: c, r: 0.8 }];
    this.course = k.course(gates, {
      limit: 40,
      onPass: (i, n) => { if (i > 0) k.synth.note(hz([62, 64, 66, 67, 69, 71, 73, 74][i - 1] || 74), 0.5, { type: 'sine', vol: 0.045 }); if (i === 0) k.say('And… go: weave through the barres to the line by the far door, and don’t touch.'); },
      onDone: t => { this._lower(k); k.synth.chime([hz(62), hz(66), hz(69), hz(74)], { vol: 0.045, gap: 0.08 }); if (k.find('pasdedeux')) k.callout('PAS DE DEUX'); else k.say(`Clean, in ${t.toFixed(1)} s. Bravo.`); },
      onFail: why => { this._lower(k); k.say(why === 'time' ? 'Too slow for the music. Back to the mark.' : why === 'touch' ? 'You touched the barre. Back to the mark, and lightly.' : 'Off the course. Back to the mark.'); },
    });
    this.up = 0; this.rise = 0;
  },
  active(k) { return !!this.r && (k.inRoom('G226', 2) || this.up); },
  update(dt, k) {
    const C = this.course;
    if (!this.up && !this.cool && k.inRoom('G226', 0) && k.close(this.start, 0.45, 0.5)) this._raise(k);
    if (this.cool) this.cool = Math.max(0, this.cool - dt);
    if (this.rise !== this.up) { this.rise += Math.sign(this.up - this.rise) * Math.min(Math.abs(this.up - this.rise), dt * 1.6); for (const b of this.barres) { b.g.visible = this.rise > 0.01; b.g.scale.y = Math.max(0.01, this.rise); } }
    this.startMark.material.opacity = this.up ? 0.2 : 0.35 + 0.25 * Math.sin((k.G.t || 0) * 3);
    if (!this.up) return;
    if (!k.inRoom('G226', 0.2)) { C.stop(); this._lower(k); return; }
    C.update(dt);
    if (!C.armed) return;
    const p = k.pos; for (const b of this.barres) { const o = b.box; if (p.x > o.x0 - 0.22 && p.x < o.x1 + 0.22 && p.z > o.z0 - 0.12 && p.z < o.z1 + 0.12) return C.fail('touch'); }
  },
  _raise(k) {
    this.up = 1; for (const b of this.barres) k.plan.obstacles.push(b.box);
    this.course.start(); k.synth.note(hz(57), 0.4, { type: 'sine', vol: 0.04 });
    k.once('degas226', 'The barres rise: a slalom for one, through the dancers.');
  },
  _lower(k) {
    if (!this.up) return; this.up = 0; this.cool = 2;
    const boxes = new Set(this.barres.map(b => b.box)); k.plan.obstacles.splice(0, k.plan.obstacles.length, ...k.plan.obstacles.filter(o => !boxes.has(o)));
  },
  spots() { return this.start ? [{ kind: 'secret', id: 'pasdedeux', name: 'Pas de deux', x: this.start.x, y: this.r.y, z: this.start.z }] : []; },
  reset(k) { if (!this.r) return; this.course.stop(); this._lower(k); this.cool = 0; },
});

// ================================================================ G246: Hammershøi
feature({
  id: 'hammershoi246',
  secrets: [['musicroom', 'The music room']],
  init(k) {
    const r = this.r = k.plan.byId.G246; if (!r || !k.G.piano) return;
    const A = this.room = artIn(k, 'G246', /music room/i);
    if (A) this.hum = { x: A.x + A.nx * 1.5, y: r.y, z: A.z + A.nz * 1.5 };
    // an upright in an oak case by the east wall (after M. H. Baillie Scott's Manxman, 1896): the keys face west
    const ex = r.x1, cz = (r.z0 + r.z1) / 2, y = r.y, O = { room: 'G246', x: ex - 0.62, y: y + 0.74, z: cz, fx: 1, fz: 0 };
    const oak = new THREE.MeshStandardMaterial({ color: 0xa87a48, roughness: 0.55, emissive: 0x5a3c1e, emissiveIntensity: 0.7 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x7a5530, roughness: 0.6, emissive: 0x3a2610, emissiveIntensity: 0.7 });
    const brass = new THREE.MeshStandardMaterial({ color: 0xc09a50, roughness: 0.35, metalness: 0.8, emissive: 0x3a2c10, emissiveIntensity: 0.5 });
    const g = new THREE.Group(); k.group.add(g);
    const box = (w, h, d, x, yy, z, m = oak) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, yy, z); g.add(b); return b; };
    const back = ex - 0.04, front = O.x + 0.16;
    box(back - front, 1.32, 1.6, (front + back) / 2, y + 0.66, cz);                                   // the case
    box(0.03, 0.5, 1.4, front - 0.015, y + 1.08, cz, dark);                                           // the panel over the keys
    for (const s of [-1, 1]) { box(0.06, 1.08, 0.2, front + 0.04, y + 0.66, cz + s * 0.68, oak); box(back - O.x + 0.06, 0.06, 0.08, (O.x - 0.06 + back) / 2, y + 0.8, cz + s * 0.76, oak); box(0.012, 0.16, 0.025, front - 0.01, y + 1.08, cz + s * 0.45, brass); }      // cheeks, arms, the long brass hinges
    box(0.1, 0.04, 1.66, front + 0.05, y + 1.34, cz, dark);                                            // the cornice
    box(0.02, 0.62, 1.4, front - 0.01, y + 0.33, cz, dark);                                           // the panel under the keys
    k.plan.obstacles.push({ x0: O.x - 0.12, x1: ex, z0: cz - 0.82, z1: cz + 0.82, y0: y, y1: y + 1.35 });
    const P = this.P = k.G.piano.add(O, { grand: false, secret: false });
    P.name = 'music room, an upright in an oak case';
    // a chord: three or more keys down together, or struck within a moment of each other
    const pn = k.G.piano, press = pn.press.bind(pn), hits = [];
    pn.press = (m, who, vel) => {
      press(m, who, vel);
      if (pn.cur !== P || !pn.on) return;
      const t = performance.now() / 1000; hits.push([m, t]); while (hits.length && t - hits[0][1] > 0.3) hits.shift();
      if (pn.held.size >= 3 || new Set(hits.map(h => h[0])).size >= 3) { if (k.find('musicroom')) { hits.length = 0; k.say('A chord in the music room. The light in the painting hardly moves.'); } }
    };
  },
  active(k) { return !!this.P && (k.inRoom('G246', 2) || !!this.osc); },
  update(dt, k) {
    // the Music Room: one note, held, very soft, only near it
    if (!this.hum) return;
    const vol = 0.03 * fall(dist(k, this.hum), 5);
    const c = ctxOf(k);
    if (vol > 0.0005 && c && !this.osc) {
      const o = c.createOscillator(), o2 = c.createOscillator(), g = c.createGain(); o.type = 'sine'; o.frequency.value = hz(62); o2.type = 'sine'; o2.frequency.value = hz(62) * 2.003;
      const g2 = c.createGain(); g2.gain.value = 0.18; o2.connect(g2); g2.connect(g); o.connect(g); g.gain.value = 0; g.connect(k.sound.master); o.start(); o2.start(); this.osc = { o, o2, g };
    }
    if (this.osc) {
      const g = this.osc.g; g.gain.setTargetAtTime(vol, g.context.currentTime, 0.5);
      if (vol <= 0.0005 && g.gain.value < 0.0008) this._hush();
    }
  },
  _hush() { if (!this.osc) return; const { o, o2, g } = this.osc; try { o.stop(); o2.stop(); } catch { /* stopped */ } g.disconnect(); this.osc = null; },
  near(v, k) {
    if (!this.P || k.G.piano.on || k.G.piano.near(v) !== this.P) return null;
    return { verb: 'PLAY', hint: 'An upright piano in an oak case. E to play: try a chord.', act: () => k.G.piano.open(this.P) };
  },
  spots() { return this.P ? [{ kind: 'secret', id: 'musicroom', name: 'The music room', x: this.P.O.x - 0.6, y: this.r.y, z: this.P.O.z }] : []; },
  reset() { this._hush(); },
});
