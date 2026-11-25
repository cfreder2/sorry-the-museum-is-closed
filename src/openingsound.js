// What the opening sounds like (src/opening.js): the television through the wall; the lines being typed (a key's
// click for every other letter, and under it the wah-wah of whoever is speaking, a horn with a hand over its bell);
// switches, a door, feet on the stairs, snow underfoot, a toy switched on. All of it made here, as everything in the
// game is (src/audio.js), and all of it on one bus, so a skip can hush it at once.

import { playMotif } from './motif.js';

export class OpeningSound {
  constructor(sound) { this.s = sound; this.bus = null; this.tv = null; }

  get ctx() { const c = this.s.ctx; return c && c.state === 'running' ? c : null; }
  _out() {
    const c = this.ctx; if (!c) return null;
    if (!this.bus) { this.bus = c.createGain(); this.bus.gain.value = 1; this.bus.connect(this.s.master); }
    return this.bus;
  }
  /** Hush everything, now. */
  stop() {
    const b = this.bus; this.bus = null; this.tv = null;
    if (!b) return;
    try { b.gain.setTargetAtTime(0, b.context.currentTime, 0.04); } catch { /* closed */ }
    setTimeout(() => { try { b.disconnect(); } catch { /* gone */ } }, 500);
  }

  _noise(at, dur, { type = 'bandpass', f = 1000, f1 = null, q = 1, gain = 0.05, attack = 0.005 } = {}) {
    const c = this.ctx, out = this._out(); if (!c || !this.s.noise) return;
    const t = c.currentTime + Math.max(0, at), s = c.createBufferSource(); s.buffer = this.s.noise; s.loop = true;
    const fl = c.createBiquadFilter(); fl.type = type; fl.frequency.setValueAtTime(f, t); if (f1) fl.frequency.exponentialRampToValueAtTime(f1, t + dur); fl.Q.value = q;
    const e = c.createGain(); e.gain.setValueAtTime(0, t); e.gain.linearRampToValueAtTime(gain, t + attack); e.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(fl); fl.connect(e); e.connect(out); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.03);
  }
  _tone(at, dur, { type = 'sine', f = 440, f1 = null, gain = 0.05, attack = 0.004, lp = 0 } = {}) {
    const c = this.ctx, out = this._out(); if (!c) return;
    const t = c.currentTime + Math.max(0, at), o = c.createOscillator(), e = c.createGain(); o.type = type;
    o.frequency.setValueAtTime(f, t); if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    e.gain.setValueAtTime(0, t); e.gain.linearRampToValueAtTime(gain, t + attack); e.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    if (lp) { const fl = c.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = lp; o.connect(fl); fl.connect(e); } else o.connect(e);
    e.connect(out); o.start(t); o.stop(t + dur + 0.03);
  }

  /** A line being typed: one key going down. */
  key(who) {
    const k = who === 'tv' ? 0.5 : 1;
    this._noise(0, 0.02, { f: 3300 + Math.random() * 900, q: 3, gain: 0.034 * k, attack: 0.001 });
    this._tone(0, 0.028, { type: 'square', f: ({ me: 300, mom: 240, dad: 180, tv: 210 }[who] || 220) * (0.95 + Math.random() * 0.1), gain: 0.0075 * k, attack: 0.001, lp: 1300 });
  }
  /** One syllable of somebody talking, with no word in it: a muted horn that opens (wah). Dad a trombone, Mom a
   *  trumpet, the child something small and bright. st: semitones off the voice's own note; bend: where it slides to. */
  wah(who, at, dur, st = 0, bend = 0) {
    const c = this.ctx, out = this._out(); if (!c) return;
    const V = { dad: [123.5, 0.062, 330, 1000, 2100], mom: [233, 0.048, 420, 1250, 2700], me: [392, 0.03, 560, 1650, 3400] }[who]; if (!V) return;
    const [base, gain, lo, hi, top] = V, t = c.currentTime + Math.max(0, at), f0 = base * Math.pow(2, st / 12), f1 = f0 * Math.pow(2, bend / 12);
    const o = c.createOscillator(); o.type = 'sawtooth';
    o.frequency.setValueAtTime(f0 * 0.93, t); o.frequency.linearRampToValueAtTime(f0, t + dur * 0.3); o.frequency.linearRampToValueAtTime(f1, t + dur);
    const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 2.3;
    bp.frequency.setValueAtTime(lo, t); bp.frequency.exponentialRampToValueAtTime(hi, t + dur * 0.42); bp.frequency.exponentialRampToValueAtTime(lo * 1.35, t + dur);
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = top;
    const e = c.createGain(); e.gain.setValueAtTime(0, t); e.gain.linearRampToValueAtTime(gain, t + Math.min(0.03, dur * 0.25)); e.gain.setValueAtTime(gain, t + dur * 0.55); e.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(bp); bp.connect(lp); lp.connect(e); e.connect(out); o.start(t); o.stop(t + dur + 0.03);
  }

  // The news, through a wall: a voice with no words in it. Made once, as a loop.
  _tvBuffer(c) {
    const sr = c.sampleRate, n = Math.floor(sr * 9), buf = c.createBuffer(1, n, sr), d = buf.getChannelData(0);
    let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    let i = 0, ph = 0, bp = 0, low = 0;
    while (i < n) {
      const syl = 4 + Math.floor(rnd() * 7), f0b = 100 + rnd() * 34;
      for (let s = 0; s < syl && i < n; s++) {
        const len = Math.floor((0.1 + rnd() * 0.14) * sr), form = 320 + rnd() * 700, f0 = f0b * (1 + (rnd() - 0.5) * 0.22 - s * 0.012), voiced = rnd() > 0.14;
        const f = 2 * Math.sin(Math.PI * form / sr);
        for (let k = 0; k < len && i < n; k++, i++) {
          ph += f0 / sr; if (ph > 1) ph -= 1;
          const src = voiced ? (ph < 0.12 ? 1 : -0.136) : (rnd() * 2 - 1) * 0.45;
          low += f * bp; bp += f * (src - low - 0.3 * bp);
          d[i] = bp * Math.sin(Math.PI * k / len) * 0.5;
        }
        i += Math.floor((0.008 + rnd() * 0.04) * sr);
      }
      i += Math.floor((0.2 + rnd() * 0.45) * sr);
    }
    const edge = Math.floor(sr * 0.08); for (let k = 0; k < edge; k++) { d[k] *= k / edge; d[n - 1 - k] *= k / edge; }
    return buf;
  }
  tvOn() {
    const c = this.ctx, out = this._out(); if (!c || this.tv) return;
    const s = c.createBufferSource(); s.buffer = this._tvBuf || (this._tvBuf = this._tvBuffer(c)); s.loop = true;
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 760; lp.Q.value = 0.4;
    const g = c.createGain(); g.gain.value = 0; g.gain.setTargetAtTime(0.085, c.currentTime, 0.5);
    s.connect(lp); lp.connect(g); g.connect(out); s.start();
    this.tv = { s, g };
  }
  /** Turned down while a line is being read, up again after; off for the night. */
  tvLevel(k) { const c = this.ctx; if (c && this.tv) this.tv.g.gain.setTargetAtTime(0.085 * k, c.currentTime, 0.25); }
  tvOff() {
    const c = this.ctx, tv = this.tv; this.tv = null; if (!c || !tv) return;
    tv.g.gain.setTargetAtTime(0, c.currentTime, 0.02); tv.s.stop(c.currentTime + 0.3);
    this._noise(0, 0.05, { f: 2400, q: 2, gain: 0.05 }); this._tone(0, 0.12, { f: 9000, f1: 5000, gain: 0.006 });
  }

  // A hinge that wants oil: a string of little slips, quicker and then slower, ringing in the door.
  creak(at = 0, dur = 0.95, gain = 0.5) {
    const c = this.ctx, out = this._out(); if (!c) return;
    const sr = c.sampleRate, n = Math.floor(sr * dur), buf = c.createBuffer(1, n, sr), d = buf.getChannelData(0);
    let seed = 23; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    let next = 0, b1 = 0, l1 = 0, b2 = 0, l2 = 0;
    const f1 = 2 * Math.sin(Math.PI * 870 / sr), f2 = 2 * Math.sin(Math.PI * 1640 / sr);
    for (let i = 0; i < n; i++) {
      const u = i / n, rate = 26 + 62 * Math.sin(Math.PI * Math.pow(u, 0.8)) + 10 * Math.sin(u * 23);
      let x = 0; if (i >= next) { x = 0.6 + rnd() * 0.4; next = i + sr / rate * (0.86 + rnd() * 0.28); }
      l1 += f1 * b1; b1 += f1 * (x - l1 - 0.07 * b1); l2 += f2 * b2; b2 += f2 * (x - l2 - 0.1 * b2);
      d[i] = (b1 * 0.5 + b2 * 0.3) * Math.sin(Math.PI * u) * 0.22;
    }
    const s = c.createBufferSource(), g = c.createGain(); s.buffer = buf; g.gain.value = gain; s.connect(g); g.connect(out); s.start(c.currentTime + Math.max(0, at));
  }
  /** Feet on the stairs: n of them, growing fainter going down (dir -1) or louder coming back (dir +1). */
  steps(at, n, dir, gap = 0.16) {
    for (let i = 0; i < n; i++) {
      const u = i / Math.max(1, n - 1), k = dir < 0 ? 1 - u * 0.82 : 0.2 + u * 0.8, t = at + i * gap * (dir < 0 ? 1 - u * 0.12 : 1) + (i % 2) * 0.025;
      this._tone(t, 0.11, { f: 96 - (i % 2) * 9, f1: 52, gain: 0.16 * k });
      this._noise(t, 0.07, { type: 'lowpass', f: 300 + 500 * k, q: 0.7, gain: 0.07 * k });
    }
  }
  /** Tiptoe, on a rug and old boards: n soft steps. */
  tiptoe(at, n, gap = 0.48) {
    for (let i = 0; i < n; i++) { const t = at + i * gap + (i % 2) * 0.03; this._tone(t, 0.08, { f: 128 - (i % 2) * 14, f1: 66, gain: 0.05 }); this._noise(t, 0.06, { type: 'lowpass', f: 520, q: 0.7, gain: 0.02 }); }
  }
  /** A light switch: a snap, and the spring behind it. */
  flick(at, gain = 0.08) { this._noise(at, 0.03, { f: 3100, q: 2.5, gain, attack: 0.001 }); this._noise(at + 0.035, 0.03, { f: 1500, q: 2, gain: gain * 0.6, attack: 0.001 }); this._tone(at, 0.06, { f: 190, f1: 110, gain: gain * 0.5, attack: 0.001 }); }
  thud(at, gain = 0.1) { this._tone(at, 0.3, { f: 74, f1: 38, gain }); this._noise(at, 0.09, { type: 'lowpass', f: 420, gain: gain * 0.5 }); }
  click(at, gain = 0.05) { this._noise(at, 0.035, { f: 2600, q: 2.5, gain }); this._noise(at + 0.05, 0.03, { f: 1700, q: 2.5, gain: gain * 0.7 }); }
  /** Boots in snow, heard from a window above: n steps. */
  crunch(at, n = 4, gain = 0.045) {
    for (let i = 0; i < n; i++) { const t = at + i * 0.27; this._noise(t, 0.13, { f: 1500, f1: 900, q: 0.8, gain, attack: 0.02 }); this._noise(t + 0.075, 0.1, { f: 2300, f1: 1300, q: 0.9, gain: gain * 0.7, attack: 0.015 }); }
  }
  breath(at) { this._noise(at, 0.75, { f: 820, f1: 560, q: 0.5, gain: 0.03, attack: 0.22 }); }
  /** The toy coming to life: the handset's three notes, and a servo finding its middle. */
  powerUp(at) {
    [880, 1175, 1568].forEach((f, i) => this._tone(at + i * 0.085, 0.075, { type: 'square', f, gain: 0.028, lp: 3200 }));
    this._tone(at + 0.3, 0.3, { type: 'sawtooth', f: 190, f1: 520, gain: 0.02, lp: 1300 });
  }
  /** The air going by, for `dur` seconds. */
  wind(at, dur) {
    const c = this.ctx, out = this._out(); if (!c || !this.s.noise) return;
    const t = c.currentTime + Math.max(0, at), s = c.createBufferSource(); s.buffer = this.s.noise; s.loop = true;
    const f = c.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 0.6; f.frequency.setValueAtTime(260, t); f.frequency.linearRampToValueAtTime(820, t + dur * 0.45); f.frequency.linearRampToValueAtTime(300, t + dur);
    const e = c.createGain(); e.gain.setValueAtTime(0, t); e.gain.linearRampToValueAtTime(0.09, t + dur * 0.4); e.gain.linearRampToValueAtTime(0.05, t + dur * 0.8); e.gain.linearRampToValueAtTime(0, t + dur);
    s.connect(f); f.connect(e); e.connect(out); s.start(t); s.stop(t + dur + 0.05);
  }
  /** The five notes (src/motif.js). onNote(i) as each sounds. */
  motif(at, o = {}) { const c = this.ctx, out = this._out(); if (!c) return; playMotif(c, out, c.currentTime + Math.max(0, at), { ...o, gain: (o.gain || 0.05) * this.s.vol.music }); }
  /** One small bright note, for a light going by. */
  spark(at, midi, gain = 0.02) { const c = this.ctx; if (c) this.s.bell(440 * Math.pow(2, (midi - 69) / 12), c.currentTime + Math.max(0, at), gain * this.s.vol.music, 1.3, 0.8); }
}
