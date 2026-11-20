// Gallery 240: Seurat's A Sunday on La Grande Jatte comes to life while you stand and look at it. Strollers of my
// own, made of dots, walk along the bank in front of the painted ones; their parasols turn; a little dog trots by.
// A waltz plays, quietly (Johann Strauss II, The Blue Danube, 1866: the first strain, made up here, not recorded).
//
// And the monkey on the lead slips it. Only once the Director's passage has been found, though: until then the
// monkey is the clue to it (src/secret.js, src/secretclue.js), and must stay put to be tapped. After that it gets
// away into the gallery, as a small monkey of my own, and hides in a corner: drive up to it to find it.
// Everything here is drawn over the picture at runtime, on a sheet in front of it; nothing is saved.
import * as THREE from 'three';
import { feature } from './features.js';

const CW = 384;                                 // the sheet's width in pixels
const rnd = (s => () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646)(240);
const PAL = { navy: '#2b2f5e', orange: '#d8823a', cream: '#ecdfb4', pink: '#d77c7a', green: '#2f6b45', black: '#1e1b22', violet: '#6a4f8f', red: '#c2413a', white: '#f3eedf', ochre: '#c9a14a' };
const COMP = { navy: '#d8a24a', orange: '#3b6bb5', cream: '#9a8fd0', pink: '#5f9a6a', green: '#d06a5a', black: '#3b3f7a', violet: '#c8b34a', red: '#3f9a8a', white: '#e0c87a', ochre: '#5a6fc0' };

// A shape as dots: [dx, dy, colour] in units of the figure's height, feet at 0, head at -1.
function dotsFor(kind, col) {
  const out = [], put = (x, y, c) => out.push([x, y, rnd() < 0.18 ? COMP[c] : PAL[c]]);
  const fill = (x0, x1, y0, y1, c, step = 0.045, shape = null) => { for (let y = y0; y <= y1; y += step) for (let x = x0; x <= x1; x += step) if (!shape || shape(x, y)) put(x + (rnd() - 0.5) * 0.02, y + (rnd() - 0.5) * 0.02, c); };
  if (kind === 'lady') {
    fill(-0.2, 0.26, -0.5, 0, col, 0.045, (x, y) => Math.abs(x - 0.03) < 0.11 + (y + 0.5) * 0.3 || (x > 0.1 && y > -0.42 && y < -0.2));      // the skirt, and the bustle behind
    fill(-0.08, 0.08, -0.8, -0.5, col);                        // the bodice
    fill(-0.06, 0.06, -0.92, -0.8, 'cream');                   // the face
    fill(-0.12, 0.12, -1.0, -0.93, 'black');                   // the hat
  } else if (kind === 'man') {
    fill(-0.08, 0.08, -0.4, 0, 'black', 0.04);                 // the trousers (two legs, moved apart when he walks)
    fill(-0.11, 0.11, -0.78, -0.4, col);                       // the coat
    fill(-0.055, 0.055, -0.9, -0.78, 'cream');
    fill(-0.06, 0.06, -1.06, -0.9, 'black', 0.035);            // the top hat
    fill(-0.12, 0.12, -0.93, -0.9, 'black', 0.035);
  } else if (kind === 'child') {
    fill(-0.12, 0.12, -0.55, -0.15, col); fill(-0.05, 0.05, -0.15, 0, 'cream'); fill(-0.07, 0.07, -0.72, -0.55, 'cream'); fill(-0.1, 0.1, -0.8, -0.72, 'ochre');
  } else if (kind === 'dog') {
    fill(-0.5, 0.45, -0.55, -0.25, 'black', 0.07); fill(0.4, 0.7, -0.75, -0.45, 'black', 0.07); fill(0.55, 0.65, -0.85, -0.7, 'black', 0.07);
    fill(-0.7, -0.45, -0.75, -0.5, 'black', 0.07, (x, y) => y < -0.5 - (x + 0.7) * 0.6);      // the tail up
  }
  return out;
}

feature({
  id: 'l2-grande-jatte',
  secrets: [['monkey', 'The monkey off its lead']],
  init(k) {
    const art = this.art = k.museum.arts.find(a => a.work.id === 27992) || k.museum.arts.find(a => /^A Sunday on La Grande Jatte/.test(a.work.t || ''));
    if (!art || art.work.c) { this.art = null; return; }            // only a work out of copyright is drawn on
    this.roomId = art.room; const room = k.plan.byId[art.room];
    // The sheet in front of the picture.
    const ch = Math.round(CW * art.h / art.w), c = this.canvas = document.createElement('canvas'); c.width = CW; c.height = ch; this.ctx = c.getContext('2d');
    const t = this.tex = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const m = this.sheet = new THREE.Mesh(new THREE.PlaneGeometry(art.w, art.h), new THREE.MeshBasicMaterial({ map: t, transparent: true, opacity: 0, depthWrite: false }));
    m.position.set(art.x + art.nx * 0.012, art.y, art.z + art.nz * 0.012); m.rotation.y = Math.atan2(art.nx, art.nz); m.visible = false; m.renderOrder = 2; k.group.add(m);
    // The people, a dog. (Kept off the patch of grass where the monkey sits until the monkey is free to go.)
    this.walkers = [];
    const add = (kind, col, v, hh, sp, parasol) => this.walkers.push({ kind, v, hh, sp, u: rnd(), dots: dotsFor(kind, col), parasol, spin: rnd() * 6, ph: rnd() * 6, pcol: parasol ? [PAL[parasol[0]], PAL[parasol[1]]] : null });
    add('lady', 'navy', 0.6, 0.2, 0.012, ['orange', 'cream']); add('man', 'black', 0.62, 0.21, -0.014);
    add('lady', 'pink', 0.66, 0.24, -0.01, ['white', 'red']); add('child', 'white', 0.7, 0.14, 0.02);
    add('lady', 'violet', 0.55, 0.16, 0.016, ['cream', 'green']); add('man', 'navy', 0.53, 0.15, 0.011);
    add('dog', 'black', 0.975, 0.06, 0.05);
    // The monkey of my own, for when it gets away: brown, a red collar, a curl of a tail.
    const mk = this.monkey = new THREE.Group(), fur = new THREE.MeshLambertMaterial({ color: 0x6b4426, emissive: 0x3a2412 }), face = new THREE.MeshLambertMaterial({ color: 0xd6b48a, emissive: 0x6a5238 });
    const ball = (r, mat, x, y, z, sx = 1, sy = 1, sz = 1) => { const b = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), mat); b.position.set(x, y, z); b.scale.set(sx, sy, sz); mk.add(b); return b; };
    ball(0.06, fur, 0, 0.07, 0, 1, 1.2, 0.9); ball(0.045, fur, 0, 0.16, 0.01); ball(0.03, face, 0, 0.155, 0.04, 1, 0.8, 0.6);
    for (const sx of [-1, 1]) { ball(0.016, face, sx * 0.042, 0.175, 0.005); ball(0.018, fur, sx * 0.05, 0.03, 0.02, 0.8, 1.4, 0.8); }
    const collar = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.006, 6, 14), new THREE.MeshLambertMaterial({ color: 0xc0392b, emissive: 0x5a1010 })); collar.position.set(0, 0.12, 0.005); collar.rotation.x = Math.PI / 2; mk.add(collar);
    const tail = this.tail = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0.04, -0.05), new THREE.Vector3(0, 0.02, -0.13), new THREE.Vector3(0, 0.1, -0.17), new THREE.Vector3(0, 0.14, -0.12)]), 12, 0.008, 5), fur);
    mk.add(tail); mk.visible = false; k.group.add(mk);
    // Where it can hide: three corners (not the one with the Director's door in it).
    const e = 0.32, hidden = k.plan.doors.find(d => d.hidden && (d.a === room.id || d.b === room.id));
    this.corners = [[room.x1 - e, room.z0 + e], [room.x1 - e, room.z1 - e], [room.x0 + e, room.z1 - e], [room.x0 + e, room.z0 + e]]
      .filter(([x, z]) => !k.plan.doorsOf(room.id).some(d => x > d.x0 - 1.2 && x < d.x1 + 1.2 && z > d.z0 - 1.2 && z < d.z1 + 1.2) && !(hidden && Math.hypot(x - (hidden.x0 + hidden.x1) / 2, z - (hidden.z0 + hidden.z1) / 2) < 3))
      .map(([x, z]) => ({ x, y: room.y, z }));
    if (!this.corners.length) this.corners = [{ x: room.x1 - e, y: room.y, z: room.z1 - e }];
    this.state = 'home'; this.look = 0; this.fade = 0; this.draw = 0; this.leap = 0; this.at = null;
    this.wz = null;    // the waltz
  },
  active(k) { return !!this.art && (k.inRoom(this.roomId, 2) || this.fade > 0.001); },
  // The monkey goes only once the passage it points to has been found (or there is no passage this time).
  free(k) { const S = k.G.secret; return !S || !S.enabled || !S.clue || S.clue.work.id !== this.art.work.id || S.open; },
  update(dt, k) {
    const looking = k.looking === this.art;
    this.look = looking ? this.look + dt : 0;
    this.fade = Math.max(0, Math.min(1, this.fade + (looking ? dt / 1.5 : -dt / 1.2)));
    const m = this.sheet; m.visible = this.fade > 0.001; m.material.opacity = this.fade;
    if (m.visible) { this.draw -= dt; if (this.draw <= 0) { this.draw = 1 / 15; this.paint(k); } this.step(dt); }
    this.waltz(k, looking);
    // The monkey: off the lead after a few seconds of looking, if it may go.
    if (this.state === 'home' && this.look > 4 && this.free(k)) { this.state = 'leaving'; this.leap = 0; k.synth.chime([1568, 1976, 2349], { gap: 0.07, dur: 0.3, vol: 0.04 }); }
    if (this.state === 'leaving') {
      this.leap += dt;
      if (this.leap > 1.6) { this.state = 'out'; this.at = this.corners[Math.floor(Math.random() * this.corners.length)]; this.monkey.position.set(this.at.x, this.at.y, this.at.z); this.monkey.visible = true; k.say('The monkey has slipped its lead. It is in here somewhere.', 5); }
    }
    if (this.state === 'out' || this.state === 'caught') {
      const mk = this.monkey, tt = performance.now() / 1000;
      mk.rotation.y = Math.atan2(k.pos.x - mk.position.x, k.pos.z - mk.position.z);
      this.tail.rotation.y = Math.sin(tt * 3) * 0.4;
      if (this.state === 'out') {
        mk.position.y = this.at.y + Math.abs(Math.sin(tt * 5)) * 0.015;
        if (k.close(this.at, 0.7, 1) && k.G.state === 'play') {
          this.state = 'caught'; this.leap = 0;
          for (let i = 0; i < 4; i++) k.synth.note(1400 + i * 260, 0.08, { type: 'square', vol: 0.025, at: i * 0.07 });
          if (k.find('monkey')) k.callout('THE MONKEY');
          k.say('Found. It chatters at you, and goes back to the picture, and its lead.', 5);
        }
      } else {
        this.leap += dt; mk.position.y = this.at.y + Math.max(0, Math.sin(this.leap * 9)) * 0.12; mk.scale.setScalar(Math.max(0.01, 1 - Math.max(0, this.leap - 1.2) * 1.5));
        if (this.leap > 2) { mk.visible = false; mk.scale.setScalar(1); this.state = 'back'; }
      }
    }
  },
  step(dt) { for (const w of this.walkers) { w.u += w.sp * dt; if (w.u > 1.12) w.u = -0.12; if (w.u < -0.12) w.u = 1.12; w.spin += dt * (w.parasol ? 0.8 : 0); w.ph += dt * Math.abs(w.sp) * 90; } },
  paint(k) {
    const c = this.ctx, W = this.canvas.width, H = this.canvas.height, R = this.art.work.id === 27992 && k.G.secret && k.G.secret.clue ? k.G.secret.clue.rect : [0.685, 0.755, 0.805, 0.9];
    c.clearRect(0, 0, W, H);
    const dot = (x, y, s, col) => { c.fillStyle = col; c.fillRect(x - s / 2, y - s / 2, s, s); };
    // Off its lead: dots of grass and shadow where it sat. Leaving: the monkey, in dots, bounding out of the frame.
    if (this.state === 'leaving' || this.state === 'out' || this.state === 'caught') {
      const r = this.rr || (this.rr = Array.from({ length: 260 }, () => [rnd(), rnd(), rnd() < 0.5 ? (rnd() < 0.5 ? '#2f5a3a' : '#3e7048') : rnd() < 0.5 ? '#26304f' : '#5b8a4e']));
      for (const [a, b, col] of r) dot((R[0] + (R[2] - R[0]) * a) * W, (R[1] + (R[3] - R[1]) * b) * H, 2.6, col);
    }
    if (this.state === 'leaving') {
      const f = Math.min(1, this.leap / 1.6), u = (R[0] + R[2]) / 2 + f * 0.4, v = (R[1] + R[3]) / 2 - Math.sin(f * Math.PI * 3) * 0.06 * (1 - f);
      for (let i = 0; i < 40; i++) { const a = i * 2.4, rr = Math.sqrt(i / 40) * 0.025; dot((u + Math.cos(a) * rr) * W, (v + Math.sin(a) * rr * 1.3) * H, 2.2, i % 5 ? '#6b4426' : '#d6b48a'); }
    }
    const S = H;       // the figures are measured in the picture's height
    for (const w of this.walkers) {
      if (!this.free(k) || this.state === 'home') { if (w.v > R[1] - 0.02 && w.u > R[0] - 0.08 && w.u < R[2] + 0.08 && w.kind !== 'dog') continue; }
      const x0 = w.u * W, y0 = w.v * H + (w.kind === 'dog' ? -Math.abs(Math.sin(w.ph)) * 3 : -Math.abs(Math.sin(w.ph)) * 1.2), h = w.hh * S, flip = w.sp < 0 ? -1 : 1, sz = Math.max(1.5, h * 0.04);
      const legs = w.kind === 'man' ? Math.sin(w.ph) * 0.05 : 0;
      for (const [dx, dy, col] of w.dots) dot(x0 + (dx + (dy > -0.4 && w.kind === 'man' ? (dx < 0 ? -legs : legs) : 0)) * h * flip, y0 + dy * h, sz, col);
      if (w.parasol) {
        // A parasol, turning: its gores go round.
        const px = x0 + 0.02 * h * flip, py = y0 - 1.12 * h, pr = 0.34 * h;
        for (let a = 0; a < Math.PI; a += 0.16) for (let rr = 0.25; rr <= 1; rr += 0.22) {
          const gore = Math.floor(((a + w.spin) / (Math.PI / 4)) + 100) % 2;
          dot(px + Math.cos(a + Math.PI) * pr * rr, py - Math.sin(a) * pr * rr * 0.55, sz, w.pcol[gore]);
        }
        for (let yy = 0; yy < 0.35; yy += 0.06) dot(px, py + yy * h, sz * 0.7, '#3a2a1c');
      }
    }
    this.tex.needsUpdate = true;
  },
  // The waltz, on the game's own sound, louder the nearer the picture, and only while it is being looked at.
  waltz(k, on) {
    const c = k.sound && k.sound.ctx;
    if (!c || c.state !== 'running' || !k.sound.master) return;
    const d = Math.hypot(k.pos.x - this.art.x, k.pos.z - this.art.z), want = on ? 0.9 * Math.max(0, 1 - d / 10) : 0;
    if (!this.wz) { if (!on) return; const bus = c.createGain(); bus.gain.value = 0; bus.connect(k.sound.master); this.wz = { bus, next: 0, t0: c.currentTime + 0.1 }; }
    const z = this.wz; z.bus.gain.setTargetAtTime(want * 0.6, c.currentTime, on ? 0.4 : 0.6);
    if (!on) { z.idle = (z.idle || 0) + 1; if (z.idle > 300) { z.bus.disconnect(); this.wz = null; } return; }
    z.idle = 0;
    const B = 0.36, SONG = WALTZ, len = 48;
    if (z.t0 + z.next * B < c.currentTime) { z.t0 = c.currentTime + 0.05; z.next = 0; }       // fell behind (a pause): pick up again
    while (z.t0 + z.next * B < c.currentTime + 0.35) {
      const beat = z.next % len, at = z.t0 + z.next * B;
      for (const [b, mnote, dur] of SONG) if (b === beat) this.voice(c, z.bus, mnote, at, dur * B, 'triangle', 0.09);
      const bar = Math.floor(beat / 3), ch = bar < 8 || bar === 15 ? [50, [54, 57, 62]] : [45, [55, 61, 64]];
      if (beat % 3 === 0) this.voice(c, z.bus, ch[0], at, B * 0.9, 'triangle', 0.07);
      else for (const n of ch[1]) this.voice(c, z.bus, n, at, B * 0.4, 'sine', 0.025);
      z.next++;
    }
  },
  voice(c, out, m, at, dur, type, vol) {
    const o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.value = 440 * Math.pow(2, (m - 69) / 12);
    g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(vol, at + 0.015); g.gain.setTargetAtTime(0, at + dur * 0.6, dur * 0.35);
    o.connect(g); g.connect(out); o.start(at); o.stop(at + dur + 0.4);
  },
  spots() { return this.art ? [{ kind: 'secret', id: 'monkey', name: 'The monkey off its lead', x: this.art.x, y: this.art.y - 1.6, z: this.art.z + this.art.nz * 1.5 }] : []; },
  reset() { if (!this.art) return; this.state = 'home'; this.monkey.visible = false; this.monkey.scale.setScalar(1); this.look = 0; },
});

// The Blue Danube, the first strain: [beat, midi note, beats long]. Three beats to the bar.
const WALTZ = [
  [0, 62, 1], [1, 66, 1], [2, 69, 1], [3, 69, 3], [7, 81, 1], [8, 81, 1], [10, 78, 1], [11, 78, 1],
  [12, 62, 1], [13, 66, 1], [14, 69, 1], [15, 69, 3], [19, 83, 1], [20, 83, 1], [22, 79, 1], [23, 79, 1],
  [24, 61, 1], [25, 64, 1], [26, 71, 1], [27, 71, 3], [31, 83, 1], [32, 83, 1], [34, 79, 1], [35, 79, 1],
  [36, 61, 1], [37, 64, 1], [38, 71, 1], [39, 71, 3], [43, 81, 1], [44, 81, 1], [46, 78, 1], [47, 78, 1],
];
