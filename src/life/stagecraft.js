// Stagecraft: a few things the shows with a band, a corps de ballet or a flock share, on top of the kit
// (src/paintlife.js). Used by src/life/61128-at-the-moulin-rouge.js, 18951-yellow-dancers.js, 14572-millinery-shop.js.
//
//   score(L)       a band on the work's voice that plays to the show's own clock (L.t), a little ahead of it, so the
//                  dancing falls on the beat, any moment can be posed, and the music stops the moment the look ends.
//                  s.tune(mel, t0, bpm, opts), s.note(t, hz, dur, opts), s.hit(t, { d, vol, lp, hp }) (a drum, a
//                  cymbal, a clap: filtered noise), s.loop(t0, period, events, until) for a vamp; s.done(); then each
//                  frame s.play(L.t) while it shows, and s.from(L.t) when a show starts.
//   noise(v, at, o) filtered noise on a voice (placed and panned with the work).
//   inked(g, d, ink) the inverted-hull outline: g with a shell d metres outside it, its faces turned inwards, in ink,
//                  so that only its rim shows round the shape (a lithograph's bold line, in one draw call).
//   Bones          parent-child matrices for figures in a rig: b.set(m, x, y, z, yaw, pitch, roll), b.child(out,
//                  parent, x, y, z, yaw, pitch, roll); rotations YXZ, as rig.put has them.
import * as THREE from 'three';
import { parse } from '../carols.js';

export const hz = m => 440 * Math.pow(2, (m - 69) / 12);

// ------------------------------------------------------------------ noise on the work's voice --
const BUF = new WeakMap();
export function noise(v, at, { d = 0.1, vol = 0.03, lp = 0, hp = 0, attack = 0.002, bp = 0, q = 1 } = {}) {
  const c = v.ctx, out = c && v.out(); if (!c || !out) return;
  let b = BUF.get(c);
  if (!b) { const n = Math.floor(c.sampleRate * 1.5); b = c.createBuffer(1, n, c.sampleRate); const dd = b.getChannelData(0); for (let i = 0; i < n; i++) dd[i] = Math.random() * 2 - 1; BUF.set(c, b); }
  const s = c.createBufferSource(), g = c.createGain(), t = c.currentTime + Math.max(0, at); s.buffer = b;
  let node = s;
  for (const [type, f] of [['lowpass', lp], ['highpass', hp], ['bandpass', bp]]) if (f) { const fl = c.createBiquadFilter(); fl.type = type; fl.frequency.value = f; if (type === 'bandpass') fl.Q.value = q; node.connect(fl); node = fl; }
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + attack); g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(attack + 0.01, d));
  node.connect(g); g.connect(out); s.start(t, Math.random() * (1.5 - Math.min(1.4, d + 0.1)), d + 0.05);
}

// ------------------------------------------------------------------ the band --
class Score {
  constructor(L) { this.L = L; this.ev = []; this.pat = []; this.until = 0; this.i = 0; }
  note(t, f, d, o = {}) { this.ev.push({ t, f, d, ...o }); return this; }
  hit(t, o = {}) { this.ev.push({ t, noise: true, ...o }); return this; }
  // A melody in carols.js's notation, its beats at bpm, from show-time t0. Pre-1900 music only.
  tune(mel, t0, bpm, { oct = 0, legato = 0.88, ...o } = {}) {
    const { notes, len } = parse(mel), b = 60 / bpm;
    for (const n of notes) if (n.m) this.note(t0 + n.t * b, hz(n.m + 12 * oct), Math.max(0.07, n.d * b * legato), o);
    return t0 + len * b;
  }
  // events [{ t, f, d, ... } or { t, noise: true, ... }] again every `period` seconds from t0 (until `until`).
  loop(t0, period, events, until = Infinity) { this.pat.push({ t0, period, events, until }); return this; }
  done() { this.ev.sort((a, b) => a.t - b.t); return this; }
  from(t) { this.until = t; let i = 0; while (i < this.ev.length && this.ev[i].t < t) i++; this.i = i; }
  play(t, ahead = 0.3) {
    const L = this.L, v = L.voice(), to = t + ahead;
    if (to <= this.until) return;
    if (L.quiet || !v.ctx) { this.from(to); return; }
    const ev = this.ev;
    while (this.i < ev.length && ev[this.i].t < to) { const e = ev[this.i++]; if (e.t >= this.until - 1e-6) this.fire(v, e, e.t - t); }
    for (const p of this.pat) {
      const a = Math.max(this.until, p.t0), b = Math.min(to, p.until); if (b <= a) continue;
      for (let n = Math.max(0, Math.floor((a - p.t0) / p.period) - 1); p.t0 + n * p.period < b; n++)
        for (const e of p.events) { const tt = p.t0 + n * p.period + e.t; if (tt >= a && tt < b) this.fire(v, e, tt - t); }
    }
    this.until = to;
  }
  fire(v, e, at) {
    if (e.noise) return noise(v, at, e);
    v.note(e.f, e.d, { at: Math.max(0, at), vol: e.vol == null ? 0.03 : e.vol, type: e.type || 'triangle', attack: e.attack == null ? 0.01 : e.attack, to: e.to || 0 });
    if (e.over) v.note(e.f * e.over, e.d * 0.5, { at: Math.max(0, at), vol: (e.vol == null ? 0.03 : e.vol) * (e.overVol || 0.3), type: 'sine', attack: 0.004 });
  }
}
export const score = L => new Score(L);

// ------------------------------------------------------------------ the inked line --
// The shell is pushed out along normals averaged where faces meet (so it does not crack at the seams), and its faces
// are turned inside out: drawn front faces only, it shows behind the shape and round it, a line of even width.
export function inked(g, d = 0.005, ink = '#1b1612') {
  const p = g.attributes.position, n = p.count, acc = new Map(), keyOf = i => `${Math.round(p.getX(i) * 2e4)},${Math.round(p.getY(i) * 2e4)},${Math.round(p.getZ(i) * 2e4)}`;
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), fn = new THREE.Vector3(), keys = new Array(n);
  for (let i = 0; i < n; i++) keys[i] = keyOf(i);
  for (let f = 0; f < n; f += 3) {
    a.fromBufferAttribute(p, f); b.fromBufferAttribute(p, f + 1); c.fromBufferAttribute(p, f + 2);
    fn.crossVectors(b.clone().sub(a), c.clone().sub(a));
    for (let j = 0; j < 3; j++) { const k = keys[f + j]; let s = acc.get(k); if (!s) acc.set(k, s = new THREE.Vector3()); s.add(fn); }
  }
  for (const s of acc.values()) s.normalize();
  const pos = new Float32Array(n * 3);
  for (let f = 0; f < n; f += 3) for (let j = 0; j < 3; j++) {
    const src = f + [0, 2, 1][j], s = acc.get(keys[src]);
    pos[(f + j) * 3] = p.getX(src) + s.x * d; pos[(f + j) * 3 + 1] = p.getY(src) + s.y * d; pos[(f + j) * 3 + 2] = p.getZ(src) + s.z * d;
  }
  const sh = new THREE.BufferGeometry(); sh.setAttribute('position', new THREE.BufferAttribute(pos, 3)); sh.computeVertexNormals();
  const col = new Float32Array(n * 3), k = new THREE.Color(ink); for (let i = 0; i < n; i++) { col[i * 3] = k.r; col[i * 3 + 1] = k.g; col[i * 3 + 2] = k.b; }
  sh.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const out = new THREE.BufferGeometry();
  for (const name of ['position', 'normal', 'color']) { const A = g.attributes[name].array, B = sh.attributes[name].array, m = new Float32Array(A.length + B.length); m.set(A); m.set(B, A.length); out.setAttribute(name, new THREE.BufferAttribute(m, 3)); }
  return out;
}

// ------------------------------------------------------------------ bones --
export class Bones {
  constructor() { this.e = new THREE.Euler(0, 0, 0, 'YXZ'); this.q = new THREE.Quaternion(); this.v = new THREE.Vector3(); this.s = new THREE.Vector3(1, 1, 1); this.l = new THREE.Matrix4(); }
  set(m, x, y, z, yaw = 0, pitch = 0, roll = 0, sc = 1) { this.e.set(pitch, yaw, roll, 'YXZ'); this.q.setFromEuler(this.e); if (typeof sc === 'number') this.s.setScalar(sc); else this.s.copy(sc); return m.compose(this.v.set(x, y, z), this.q, this.s); }
  child(out, parent, x, y, z, yaw = 0, pitch = 0, roll = 0, sc = 1) { this.set(this.l, x, y, z, yaw, pitch, roll, sc); return out.multiplyMatrices(parent, this.l); }
}

// A gentle hump: 0 at a, 1 in the middle, 0 at b.
export const hump = (t, a, b) => (t <= a || t >= b ? 0 : Math.sin(Math.PI * (t - a) / (b - a)));
// Shortest way round from angle a to b, at k.
export const turnTo = (a, b, k) => a + Math.atan2(Math.sin(b - a), Math.cos(b - a)) * k;
