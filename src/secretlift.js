// The goods lift behind the hidden doorway (tools/build_layout.mjs, section 8: plan.secret.lift names its two cars).
//
// Two cars the same size and the same way round, one at the top of the way down and one twelve metres under the street,
// and nothing between them on any drawing. Drive into either and stop: the doors close, the hum comes up, the lights in the
// shaft go past the slots in the doors faster and faster, and at the other end there is a flash and a heavy thunk and the
// doors open on the other floor. The toy is carried across while the doors are shut (G.ride holds it still: src/main.js),
// so whatever happens it comes out of one car or the other, on that car's floor. A toy that is not in the car any more when
// it is carried (a new game, a test putting it somewhere) is let go where it is, the doors open, and nothing waits for it.
// Reduce motion: no lights rushing past, no flash and no shaking, a steady glow in the slots and a slow fade instead, and
// slower all round.
//
// Drawn here, the same in both cars: a steel lining, a floor plate, a lit panel in the ceiling, a handrail each side, a pair
// of doors at each end (only the pair onto a landing ever opens; the others are there so the two cars look alike) and the
// floor shown over each pair. No light is added: what glows is emissive.

import * as THREE from 'three';
import { Geo } from './geo.js';

const DOOR = 2.6;                     // the doors' height: the doorway's
const SHUT = 1.0, OPEN = 0.9;         // seconds the doors take to close, and to open
const RIDE = 3.6;                     // seconds from the doors meeting to the thunk
const SETTLE = 0.5;                   // seconds stopped inside before the doors close
const ease = k => k * k * (3 - 2 * k);

export class SecretLift {
  // G: the game. ui: { say, callout, arrived(foot) }.
  constructor(G, ui) {
    this.G = G; this.ui = ui; this.ok = false;
    const P = G.plan, S = P.secret && P.secret.lift, top = S && P.byId[S.top], foot = S && P.byId[S.foot];
    if (!top || !foot) return;
    this.ok = true; this.t = 0; this.state = 'idle'; this.at = -1; this.armed = true; this.still = 0; this.flashT = -1;
    this.group = new THREE.Group(); this.group.name = 'secret-lift'; G.museum.group.add(this.group);
    this.hold = (dt) => { const v = this.G.vehicle; v.vel.set(0, 0, 0); if (v.speed != null) v.speed = 0; };      // G.ride while the doors are shut: the toy goes nowhere
    // Materials: one set for both cars.
    const M = this.M = {
      steel: new THREE.MeshStandardMaterial({ color: 0x9aa3aa, roughness: 0.35, metalness: 0.7, emissive: 0x3a4148, emissiveIntensity: 0.9 }),
      dark: new THREE.MeshStandardMaterial({ color: 0x2c3136, roughness: 0.5, metalness: 0.6, emissive: 0x15181b, emissiveIntensity: 0.8 }),
      door: new THREE.MeshStandardMaterial({ color: 0xb4bcc2, roughness: 0.28, metalness: 0.75, emissive: 0x4a5258, emissiveIntensity: 0.85 }),
      plate: new THREE.MeshStandardMaterial({ color: 0x6d757b, roughness: 0.55, metalness: 0.6, emissive: 0x262a2e, emissiveIntensity: 0.9, map: plateTexture() }),
      panel: new THREE.MeshBasicMaterial({ color: new THREE.Color(1.25, 1.2, 1.08), toneMapped: false }),
      slot: new THREE.MeshBasicMaterial({ map: shaftTexture(), color: new THREE.Color(0.32, 0.32, 0.34), toneMapped: false }),
      brass: new THREE.MeshStandardMaterial({ color: 0xc89b45, roughness: 0.4, metalness: 0.8, emissive: 0x4a3612, emissiveIntensity: 0.8 }),
    };
    this.slotTex = M.slot.map;
    this.cars = [top, foot].map((r, i) => this._car(r, i, [top, foot][1 - i]));
    this.flash = document.createElement('div'); this.flash.id = 'liftFlash';
    this.flash.style.cssText = 'position:fixed;inset:0;pointer-events:none;opacity:0;background:#fff;z-index:20;transition:none';
    document.body.appendChild(this.flash);
    // A toy that starts inside a car (a saved game) is not taken anywhere until it has driven out and in again (worked out in
    // the first frame of play: there is no toy yet while the building goes up).
    this.armed = null;
  }

  // ---- building a car ----
  _car(r, i, other) {
    const P = this.G.plan, M = this.M, g = new THREE.Group(); g.name = 'secret-lift-car-' + r.id; this.group.add(g);
    const land = P.doors.find(d => (d.a === r.id || d.b === r.id) && d.a !== other.id && d.b !== other.id);
    const alongZ = !land || land.along === 'z';           // (the doors are in the car's ends across this axis)
    const ends = alongZ ? [r.z0, r.z1] : [r.x0, r.x1], landEnd = land ? (alongZ ? (Math.abs(land.z1 - r.z0) < 0.05 ? 0 : 1) : (Math.abs(land.x1 - r.x0) < 0.05 ? 0 : 1)) : 0;
    const uc = land ? (alongZ ? (land.x0 + land.x1) / 2 : (land.z0 + land.z1) / 2) : (alongZ ? (r.x0 + r.x1) / 2 : (r.z0 + r.z1) / 2), half = land ? (alongZ ? land.x1 - land.x0 : land.z1 - land.z0) / 2 : 0.9;
    // A point in the car: `u` along the end walls, `y` up from the floor, `d` in from end e (0 or 1).
    const P3 = (e, u, y, d) => { const f = ends[e] + (e ? -d : d); return alongZ ? [u, r.y + y, f] : [f, r.y + y, u]; };
    const box = (geo, e, u0, u1, y0, y1, d0, d1) => { const a = P3(e, u0, y0, d0), b = P3(e, u1, y1, d1); geo.box(Math.min(a[0], b[0]), Math.max(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[1], b[1]), Math.min(a[2], b[2]), Math.max(a[2], b[2])); };
    const lo = alongZ ? r.x0 : r.z0, hi = alongZ ? r.x1 : r.z1, len = ends[1] - ends[0], H = Math.min(3.2, r.h - 0.1), I = 0.02;
    const steel = new Geo(), dark = new Geo(), door = new Geo(), plate = new Geo(), panel = new Geo(), slot = new Geo(), brass = new Geo();
    // The lining: the long walls whole, each end wall round its doorway.
    const side = (u, du) => { const a = P3(0, u, 0, I), b = P3(1, u + du, H, I); steel.box(Math.min(a[0], b[0]), Math.max(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[1], b[1]), Math.min(a[2], b[2]), Math.max(a[2], b[2])); };
    side(lo + I, 0.02); side(hi - I - 0.02, 0.02);
    // The lining's panels: a dark seam between each, along the long walls, and a kick plate along their foot.
    for (const u of [lo + I + 0.02, hi - I - 0.02]) {
      const o = u < (lo + hi) / 2 ? 1 : -1, w0 = Math.min(u, u + o * 0.006), w1 = Math.max(u, u + o * 0.006);
      for (let d = 0.95; d < len - 0.3; d += 0.95) { const a = P3(0, w0, 0, d - 0.006), b = P3(0, w1, H, d + 0.006); dark.box(Math.min(a[0], b[0]), Math.max(a[0], b[0]), a[1], b[1], Math.min(a[2], b[2]), Math.max(a[2], b[2])); }
      { const a = P3(0, Math.min(u, u + o * 0.01), 0, I), b = P3(1, Math.max(u, u + o * 0.01), 0.28, I); dark.box(Math.min(a[0], b[0]), Math.max(a[0], b[0]), a[1], b[1], Math.min(a[2], b[2]), Math.max(a[2], b[2])); }
    }
    for (const e of [0, 1]) {
      box(steel, e, lo + I, uc - half - 0.05, 0, H, I, I + 0.02); box(steel, e, uc + half + 0.05, hi - I, 0, H, I, I + 0.02); box(steel, e, uc - half - 0.05, uc + half + 0.05, DOOR + 0.02, H, I, I + 0.02);
      box(dark, e, uc - half - 0.08, uc - half - 0.03, 0, DOOR + 0.05, I + 0.02, I + 0.05); box(dark, e, uc + half + 0.03, uc + half + 0.08, 0, DOOR + 0.05, I + 0.02, I + 0.05); box(dark, e, uc - half - 0.08, uc + half + 0.08, DOOR, DOOR + 0.06, I + 0.02, I + 0.05);
      box(dark, e, uc - half - 0.1, uc + half + 0.1, 0, 0.02, I, 0.16);               // the sill
      box(dark, e, uc - 0.22, uc + 0.22, DOOR + 0.12, DOOR + 0.36, I + 0.02, I + 0.045);   // the floor over the doors: a dark box, and its figures (below)
      // Beside the doors, a plate with the two buttons this lift has.
      box(steel, e, uc + half + 0.14, uc + half + 0.3, 0.95, 1.35, I + 0.02, I + 0.032);
      box(brass, e, uc + half + 0.18, uc + half + 0.26, 1.2, 1.28, I + 0.032, I + 0.042); box(brass, e, uc + half + 0.18, uc + half + 0.26, 1.02, 1.1, I + 0.032, I + 0.042);
    }
    // The floor plate, a handrail along each side, the panel of light overhead and the dark round it.
    { const a = P3(0, lo + I, 0.004, I), b = P3(1, hi - I, 0.014, I); plate.box(Math.min(a[0], b[0]), Math.max(a[0], b[0]), a[1], b[1], Math.min(a[2], b[2]), Math.max(a[2], b[2])); }
    for (const u of [lo + 0.09, hi - 0.09]) { const a = P3(0, u - 0.02, 0.88, 0.45), b = P3(1, u + 0.02, 0.92, 0.45); brass.box(Math.min(a[0], b[0]), Math.max(a[0], b[0]), a[1], b[1], Math.min(a[2], b[2]), Math.max(a[2], b[2])); }
    { const m = Math.min(0.5, len * 0.18), a = P3(0, lo + 0.45, H - 0.025, m), b = P3(1, hi - 0.45, H - 0.012, m); panel.box(Math.min(a[0], b[0]), Math.max(a[0], b[0]), a[1], b[1], Math.min(a[2], b[2]), Math.max(a[2], b[2]));
      const c = P3(0, lo + I, H - 0.01, I), d = P3(1, hi - I, H, I); dark.box(Math.min(c[0], d[0]), Math.max(c[0], d[0]), c[1], d[1], Math.min(c[2], d[2]), Math.max(c[2], d[2])); }
    // The doors that never open (the other end from the landing): drawn shut, with their slots.
    const leafAt = (geo, sg, e, k) => { const w = half + 0.02, u0 = sg < 0 ? uc - w - k * w : uc + k * w, u1 = u0 + w; box(geo, e, u0, u1, 0.01, DOOR, I + 0.06, I + 0.1); return [u0, u1]; };
    const slotsOn = (geo, e, u0, u1, dd) => { for (const f of [0.3, 0.7]) { const u = u0 + (u1 - u0) * f, a = P3(e, u - 0.03, 0.22, dd), b = P3(e, u + 0.03, 2.1, dd); quadFacing(geo, a, b, alongZ, e); } };      // (long, and low enough for a toy's eye)
    const blind = 1 - landEnd;
    for (const sg of [-1, 1]) { const [u0, u1] = leafAt(door, sg, blind, 0); slotsOn(slot, blind, u0, u1, I + 0.101); }
    for (const [geo, mat] of [[steel, M.steel], [dark, M.dark], [door, M.door], [plate, M.plate], [panel, M.panel], [slot, M.slot], [brass, M.brass]]) if (!geo.empty) g.add(geo.mesh(mat));
    // The doors onto the landing: each leaf its own mesh, to slide.
    const leaves = [-1, 1].map(sg => {
      const geo = new Geo(), sl = new Geo(), w = half + 0.02, u0 = sg < 0 ? uc - w : uc, u1 = u0 + w;
      box(geo, landEnd, u0, u1, 0.01, DOOR, I + 0.06, I + 0.1); slotsOn(sl, landEnd, u0, u1, I + 0.101);
      const m = geo.mesh(M.door); m.add(sl.mesh(M.slot)); g.add(m);
      return { m, sg, w };
    });
    // The floor over the doors, both ends: a little lit sign of its own for each car.
    const cv = document.createElement('canvas'); cv.width = 128; cv.height = 64; const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
    const sign = new Geo(); for (const e of [0, 1]) { const a = P3(e, uc - 0.19, DOOR + 0.14, I + 0.047), b = P3(e, uc + 0.19, DOOR + 0.34, I + 0.047); quadFacing(sign, a, b, alongZ, e); }
    g.add(sign.mesh(new THREE.MeshBasicMaterial({ map: tex, toneMapped: false })));
    // What is solid: the landing doors, while they are not open.
    const gate = { off: true };
    if (land) P.obstacles.push({ x0: land.x0, x1: land.x1, z0: land.z0, z1: land.z1, y0: land.y - 0.2, y1: land.y + land.h, gate, liftDoor: true });
    const car = { r, i, land, alongZ, landEnd, uc, half, ends, leaves, gate, open: 1, want: 1, g, cv, tex, floor: null };
    this._sign(car, i === 0 ? '2' : '9');
    this._doors(car);
    return car;
  }
  _doors(c) {
    const k = ease(c.open), A = c.alongZ ? 'x' : 'z';
    for (const L of c.leaves) { L.m.position.set(0, 0, 0); L.m.position[A] = L.sg * k * (L.w - 0.04); L.m.updateMatrix(); }
    c.gate.off = c.open > 0.85;
  }
  _sign(c, text) {
    if (c.floor === text) return; c.floor = text;
    const g = c.cv.getContext('2d'); g.fillStyle = '#120a04'; g.fillRect(0, 0, 128, 64);
    g.fillStyle = '#ffb347'; g.font = 'bold 44px "Courier New", monospace'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 64, 34); c.tex.needsUpdate = true;
  }

  // ---- where the toy is ----
  // Which car is p in, well inside (m clear of the doorway onto its landing), or -1.
  inCar(p, m = 0.55) {
    if (!this.ok) return -1;
    for (const c of this.cars) { const r = c.r, a = c.alongZ, m0 = c.landEnd === 0 ? m : 0.05, m1 = c.landEnd === 1 ? m : 0.05; if (p.y > r.y - 0.35 && p.y < r.y + r.h && (a ? p.x : p.z) > (a ? r.x0 : r.z0) + 0.05 && (a ? p.x : p.z) < (a ? r.x1 : r.z1) - 0.05 && (a ? p.z : p.x) > c.ends[0] + m0 && (a ? p.z : p.x) < c.ends[1] - m1) return c.i; }
    return -1;
  }
  get riding() { return this.state === 'shut' || this.state === 'ride'; }

  // ---- every frame of play (and of a look) ----
  update(dt, v, cam) {
    if (!this.ok) return;
    this.t += dt;
    const G = this.G, calm = !!(G.set && G.set.reduce), slow = calm ? 1.4 : 1, p = v.pos, here = this.inCar(p);
    const near = this.cars.some(c => Math.abs(p.y - c.r.y) < 8 && Math.abs(p.x - (c.r.x0 + c.r.x1) / 2) < 30 && Math.abs(p.z - (c.r.z0 + c.r.z1) / 2) < 30) || cam.y < -4 && Math.abs(cam.x - 91) < 40;
    this.group.visible = near;
    if (this.armed === null && (this.t0 = (this.t0 || 0) + dt) > 0.4) this.armed = here < 0;      // (a moment in, when the toy is surely where the game put it)
    if (here < 0) { this.armed = true; this.still = 0; }
    const sp = Math.hypot(v.vel.x, v.vel.z) + Math.abs(v.vel.y || 0);
    if (this.state === 'idle') {
      if (here >= 0 && this.armed && G.state === 'play' && !G.racing && !G.held) {
        this.still = sp < 0.6 ? this.still + dt : 0;
        if (this.still > SETTLE) { this.state = 'closing'; this.at = here; this.cars[here].want = 0; this.st = 0; this._whirr(SHUT * slow); }
      }
    } else if (this.state === 'closing') {
      const c = this.cars[this.at];
      if (here !== this.at || sp > 1.2) { this.state = 'idle'; c.want = 1; this.still = 0; this._whirr(OPEN * slow * 0.6); }      // (backed out: the doors go back, as a lift's do)
      else if (c.open <= 0) { this.state = 'ride'; this.st = 0; this.from = this.at; this.to = 1 - this.at; this.went = false; if (G.ride == null) G.ride = this.hold; this.mine = G.ride === this.hold; G.sound.tick(0.09, 700, 0.06); this._hum(RIDE * slow); }
    } else if (this.state === 'ride') {
      this.st += dt;
      const T = RIDE * slow, f = Math.min(1, this.st / T), down = this.from === 0;
      // The shaft going by: slow, quick, slow; the floor shown over the doors counts the floors passed.
      const sp2 = Math.sin(Math.PI * Math.min(1, f * 1.08)) ** 0.6;
      if (!calm) { this.slotTex.offset.y = (this.slotTex.offset.y + (down ? 1 : -1) * dt * (0.4 + sp2 * 5.2)) % 1; this.M.slot.color.setScalar(0.35 + 1.25 * sp2); }
      else this.M.slot.color.setScalar(0.32 + 0.5 * Math.sin(Math.PI * f));
      if (!calm && (this.tk = (this.tk || 0) + dt * (0.4 + sp2 * 5.2) * 2.5) > 1) { this.tk = 0; G.sound.tick(0.025 + 0.02 * sp2, 2600, 0.025); }
      const seq = down ? ['2', '1', 'LL', '·', '9'] : ['9', '·', 'LL', '1', '2'], at = seq[Math.min(seq.length - 2, Math.floor(f * 4.2))];
      for (const c of this.cars) this._sign(c, f >= 0.98 ? seq[4] : at);
      const panelK = calm ? 1 : 0.85 + 0.15 * Math.sin(this.t * 37) * sp2;      // (the light in the car flutters as it runs)
      this.M.panel.color.setRGB(1.25 * panelK, 1.2 * panelK, 1.08 * panelK);
      // Carried across while the doors are shut: at the flash (or in the dark of the fade).
      const cross = T - (calm ? 0.7 : 0.38);
      if (!this.went && this.st >= cross) this._cross(v, calm);
      if (this.st >= T) {
        this.state = 'opening'; this.at = this.to; const c = this.cars[this.at]; c.want = 1; this.armed = false; this.still = 0;
        { const f = this.cars[this.from]; f.open = f.want = 1; this._doors(f); }      // (the car it left is back, open, for nobody: unseen)
        if (this.mine && G.ride === this.hold) G.ride = null; this.mine = false;
        this.M.slot.color.setScalar(0.32); this.M.panel.color.setRGB(1.25, 1.2, 1.08);
        G.sound.bell(880, 0, 0.05, 1.4); G.sound.bell(659.25, (G.sound.ctx ? G.sound.ctx.currentTime : 0) + 0.18, 0.045, 1.6); this._whirr(OPEN * slow);
        this.ui.arrived(this.at === 1);
      }
      // A little shake while it runs, and the jolt at the bottom (never with Reduce motion).
      if (!calm && G.state === 'play') { const j = Math.max(0, 1 - (this.st - cross) / 0.5) * (this.st > cross ? 0.05 : 0), s = 0.006 * sp2 + j; cam.x += (Math.random() - 0.5) * s; cam.y += (Math.random() - 0.5) * s; }
    } else if (this.state === 'opening') {
      if (this.cars[this.at].open >= 1) this.state = 'idle';
    }
    // Nobody in the car being carried (a new game, the toy put somewhere else): let go, open up, wait for nobody.
    if (this.state === 'ride' && !this.went && here !== this.from && this.st > 0.1) this._let();
    for (const c of this.cars) if (c.open !== c.want) { c.open = c.want ? Math.min(1, c.open + dt / (OPEN * slow)) : Math.max(0, c.open - dt / (SHUT * slow)); this._doors(c); }
    // The flash, or the slow fade.
    if (this.flashT >= 0) {
      this.flashT += dt; const F = this.flash.style;
      if (calm) { const q = this.flashT / 1.4; F.opacity = String(q < 0.5 ? q * 2 : Math.max(0, 2 - q * 2)); if (q >= 1) this.flashT = -1; }
      else { const q = this.flashT / 0.42; F.opacity = String(0.92 * Math.max(0, 1 - q) ** 1.6); if (q >= 1) this.flashT = -1; }
      if (this.flashT < 0) F.opacity = '0';
    }
  }
  // Across to the other car: the same place in it, the same way round.
  _cross(v, calm) {
    const G = this.G, a = this.cars[this.from], b = this.cars[this.to];
    this.went = true;
    if (this.inCar(v.pos, 0.1) !== this.from) { this._let(); return; }
    b.open = b.want = 0; this._doors(b);
    v.place(v.pos.x, v.pos.z, v.yaw, v.pos.y + (b.r.y - a.r.y)); v.vel.set(0, 0, 0);
    if (G.shell && G.shell.chase) G.shell.chase();
    this.flashT = 0; this.flash.style.background = calm ? '#000' : '#fff';
    this._thunk(calm);
  }
  _let() {
    const G = this.G;
    if (this.mine && G.ride === this.hold) G.ride = null; this.mine = false;
    for (const c of this.cars) c.want = 1;
    this.state = 'idle'; this.at = -1; this.armed = false; this.M.slot.color.setScalar(0.32);
  }
  // A new game, or the title: open, still, holding nobody.
  reset() {
    if (!this.ok) return;
    this._let(); this.armed = null; this.t0 = 0; this.flashT = -1; this.flash.style.opacity = '0';
    for (const c of this.cars) { c.open = c.want = 1; this._doors(c); this._sign(c, c.i === 0 ? '2' : '9'); }
  }

  // ---- sounds: all made here, on the game's own sound ----
  _out() { const s = this.G.sound, c = s && s.ctx; return c && c.state === 'running' && s.dry ? { s, c } : null; }
  _whirr(dur) {
    const o = this._out(); if (!o) return; const { s, c } = o, t = c.currentTime;
    const n = c.createBufferSource(); n.buffer = s.noise; n.loop = true; const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 520; f.Q.value = 2.5;
    const e = c.createGain(); e.gain.setValueAtTime(0, t); e.gain.linearRampToValueAtTime(0.06, t + 0.12); e.gain.setValueAtTime(0.06, t + dur - 0.15); e.gain.linearRampToValueAtTime(0, t + dur);
    n.connect(f); f.connect(e); e.connect(s.dry); n.start(t); n.stop(t + dur + 0.05);
    s.tick(0.07, 900, 0.06, dur);      // and the clack as they meet (or stop)
  }
  _hum(dur) {
    const o = this._out(); if (!o) return; const { s, c } = o, t = c.currentTime, calm = !!(this.G.set && this.G.set.reduce);
    const bus = c.createGain(); bus.gain.setValueAtTime(0, t); bus.gain.linearRampToValueAtTime(0.11, t + 0.5); bus.gain.setValueAtTime(0.11, t + dur - 0.45); bus.gain.linearRampToValueAtTime(0.0001, t + dur); bus.connect(s.dry); const wet = c.createGain(); wet.gain.value = 0.4; bus.connect(wet); wet.connect(s.send);
    for (const [type, f0, f1, g] of [['sawtooth', 42, 96, 0.35], ['sine', 84, 190, 0.5], ['triangle', 330, calm ? 520 : 940, 0.08]]) {
      const os = c.createOscillator(), lp = c.createBiquadFilter(), gg = c.createGain(); os.type = type; os.frequency.setValueAtTime(f0, t); os.frequency.exponentialRampToValueAtTime(f1, t + dur * 0.75); os.frequency.exponentialRampToValueAtTime(f1 * 0.8, t + dur);
      lp.type = 'lowpass'; lp.frequency.value = 900; gg.gain.value = g; os.connect(lp); lp.connect(gg); gg.connect(bus); os.start(t); os.stop(t + dur + 0.1);
    }
    const n = c.createBufferSource(); n.buffer = s.noise; n.loop = true; const nf = c.createBiquadFilter(); nf.type = 'lowpass'; nf.frequency.setValueAtTime(300, t); nf.frequency.linearRampToValueAtTime(calm ? 700 : 2200, t + dur * 0.7);
    const ng = c.createGain(); ng.gain.value = 0.5; n.connect(nf); nf.connect(ng); ng.connect(bus); n.start(t); n.stop(t + dur + 0.1);
  }
  _thunk(calm) {
    const o = this._out(); if (!o) return; const { s, c } = o, t = c.currentTime;
    s.bump(calm ? 2.5 : 6);
    const os = c.createOscillator(), e = c.createGain(); os.type = 'sine'; os.frequency.setValueAtTime(72, t); os.frequency.exponentialRampToValueAtTime(28, t + 0.5);
    e.gain.setValueAtTime(calm ? 0.25 : 0.55, t); e.gain.exponentialRampToValueAtTime(0.0001, t + 0.7); os.connect(e); e.connect(s.dry); e.connect(s.send); os.start(t); os.stop(t + 0.75);
    if (!calm) { const n = c.createBufferSource(); n.buffer = s.noise; const f = c.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 2500; const g = c.createGain(); g.gain.setValueAtTime(0.12, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3); n.connect(f); f.connect(g); g.connect(s.dry); n.start(t, Math.random()); n.stop(t + 0.32); }
  }
}

// A quad from corner a to corner b (opposite corners), in the plane of a car's end wall, facing into the car from end e:
// its u running to the right of somebody inside looking at that wall (so the sign over the doors reads the right way round).
function quadFacing(geo, a, b, alongZ, e) {
  const n = alongZ ? [0, 0, e ? -1 : 1] : [e ? -1 : 1, 0, 0], right = alongZ ? (e ? 1 : -1) : (e ? -1 : 1);
  const uA = alongZ ? Math.min(a[0], b[0]) : Math.min(a[2], b[2]), uB = alongZ ? Math.max(a[0], b[0]) : Math.max(a[2], b[2]), L = right > 0 ? uA : uB, R = right > 0 ? uB : uA;
  const f = alongZ ? a[2] : a[0], y0 = Math.min(a[1], b[1]), y1 = Math.max(a[1], b[1]), P = (u, y) => (alongZ ? [u, y, f] : [f, y, u]);
  geo.quad(P(L, y0), P(R, y0), P(R, y1), P(L, y1), n);
}

// Diamond plate, small, to repeat.
function plateTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
  g.fillStyle = '#7a7f84'; g.fillRect(0, 0, 64, 64); g.strokeStyle = '#9aa0a5'; g.lineWidth = 4; g.lineCap = 'round';
  for (const [x, y, s] of [[16, 16, 1], [48, 48, 1], [48, 16, -1], [16, 48, -1]]) { g.beginPath(); g.moveTo(x - 7, y - 7 * s); g.lineTo(x + 7, y + 7 * s); g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(8, 12); t.colorSpace = THREE.SRGBColorSpace; return t;
}
// What is seen through a slot in the doors: the shaft wall going by, a lamp in it every so often. It scrolls while the lift runs.
function shaftTexture() {
  const c = document.createElement('canvas'); c.width = 16; c.height = 256; const g = c.getContext('2d');
  g.fillStyle = '#0b0d10'; g.fillRect(0, 0, 16, 256);
  for (const y of [18, 100, 170, 222]) { const gr = g.createLinearGradient(0, y - 10, 0, y + 10); gr.addColorStop(0, 'rgba(255,236,200,0)'); gr.addColorStop(0.5, 'rgba(255,240,214,1)'); gr.addColorStop(1, 'rgba(255,236,200,0)'); g.fillStyle = gr; g.fillRect(0, y - 10, 16, 20); }
  g.fillStyle = 'rgba(120,130,140,.25)'; for (let y = 0; y < 256; y += 32) g.fillRect(0, y, 16, 2);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return t;
}
