// The music of the voyage, made here note by note on the game's own audio (src/audio.js): its context, its room
// reverb, and the "Music and lamp chimes" slider. All of it is built on the craft's call (src/motif.js), which is our
// own; the chords under it are plain D major ones. Nothing is recorded and nothing is borrowed.
//
//   space    slow chords that take eight seconds each to bloom, a low hum, stray bell notes, and every so often
//            the call itself, played slowly, high up, with an echo
//   moon     the space chords, thinner and further apart
//   finale   the full arrangement for the opening and the credits: the call three times over, each time with
//            more under it (chords, then a harmony a third below and running eighths, then everything in octaves
//            with a walking bass), the held last note at last coming home; then the credits' gentle loop.

import { MOTIF, motifTimes, motifVoice, hz } from './motif.js';

// D add9, B minor 7 (add 11), G major 7, A sus2: the four chords the space music turns round.
const CHORDS = [[38, 45, 52, 54, 57, 64], [35, 42, 50, 52, 57, 62], [31, 38, 54, 59, 61, 66], [33, 40, 47, 52, 57, 64]];
const PENTA = [62, 64, 66, 69, 71, 74, 76, 78, 81, 83];
// Under each note of the call, in the finale: a chord (root and the notes above it).
const UNDER = [[38, 50, 57, 62, 66], [31, 43, 50, 59, 62], [40, 47, 55, 59, 64], [45, 52, 57, 61, 64], [33, 45, 52, 57, 59, 64]];
// A third below each note, in D major.
const THIRD = [59, 64, 67, 66, 61];

export class CosmicMusic {
  constructor(sound) {
    this.s = sound; this.mode = null; this.out = null; this.events = []; this.loopAt = 0; this.chord = 0; this.cycles = 0;
    this.played = 0;                    // notes sounded, for a test to see the music is going
  }
  get ctx() { const c = this.s && this.s.ctx; return c && c.state === 'running' ? c : null; }

  _ensure() {
    const c = this.ctx; if (!c) return false;
    if (this.out) return true;
    const S = this.s;
    this.out = c.createGain(); this.out.gain.value = 0;
    // The call echoes: a delay three beats long, fed back a little and darkened each time round.
    this.echo = c.createDelay(2); this.echo.delayTime.value = 1.26;
    const fb = c.createGain(); fb.gain.value = 0.34; const dark = c.createBiquadFilter(); dark.type = 'lowpass'; dark.frequency.value = 2400;
    this.echoIn = c.createGain(); this.echoIn.gain.value = 0.5;
    this.echoIn.connect(this.echo); this.echo.connect(dark); dark.connect(fb); fb.connect(this.echo); dark.connect(this.out);
    this.padBus = c.createBiquadFilter(); this.padBus.type = 'lowpass'; this.padBus.frequency.value = 1300; this.padBus.connect(this.out);
    this.wet = c.createGain(); this.wet.gain.value = 0.8;
    this.out.connect(S.dry); this.out.connect(this.wet); this.wet.connect(S.send);
    return true;
  }

  setMode(mode) {
    if (mode === this.mode) return;
    this.mode = mode; this.events = []; this.loopAt = 0; this.cycles = 0;
    const c = this.ctx; if (!c || !this._ensure()) { this._pending = true; return; }
    this._pending = false;
    const now = c.currentTime;
    if (mode === 'finale') this._finale(now);
  }

  stop() {
    this.mode = null; this.events = [];
    const c = this.ctx; if (c && this.out) this.out.gain.setTargetAtTime(0, c.currentTime, 0.6);
  }

  // Every frame. Notes are laid down a little ahead of when they sound.
  update() {
    const c = this.ctx; if (!c) return;
    if (!this._ensure()) return;
    if (this._pending) { const m = this.mode; this.mode = null; this.setMode(m); }
    const now = c.currentTime, S = this.s;
    this.out.gain.setTargetAtTime(this.mode ? 0.9 * S.vol.music : 0, now, 0.8);
    const ahead = now + 0.35;
    while (this.events.length && this.events[0].t < ahead) { const e = this.events.shift(); e.fn(Math.max(e.t, now)); }
    if (this.mode === 'space' || this.mode === 'moon' || this.mode === 'credits') {
      if (now >= this.loopAt - 0.3) this._loop(Math.max(now, this.loopAt), this.mode);
    }
  }

  _at(t, fn) { this.events.push({ t, fn }); this.events.sort((a, b) => a.t - b.t); }

  // ---------------------------------------------------------------- voices --
  // A pad: each note two detuned oscillators, blooming in and dying away; into the darkened pad bus.
  pad(notes, t, dur, gain = 0.022, attack = 3) {
    const c = this.ctx; if (!c) return;
    for (const n of notes) for (const [det, type, g] of [[-5, 'sine', 1], [6, 'triangle', 0.35]]) {
      const o = c.createOscillator(), e = c.createGain(), gg = gain * g * (n < 45 ? 1.3 : 1);
      o.type = type; o.frequency.value = hz(n); o.detune.value = det;
      e.gain.setValueAtTime(0, t); e.gain.linearRampToValueAtTime(gg, t + attack); e.gain.setValueAtTime(gg, t + Math.max(attack, dur - 1));
      e.gain.linearRampToValueAtTime(0, t + dur + 3);
      o.connect(e); e.connect(this.padBus); o.start(t); o.stop(t + dur + 3.1);
    }
    this.played += notes.length;
  }
  // A struck note, bell-like, that rings out.
  bell(midi, t, gain = 0.03, decay = 2.4, echo = 0) {
    const c = this.ctx; if (!c) return;
    const out = c.createGain(); out.gain.value = 1; out.connect(this.out); if (echo) { const s = c.createGain(); s.gain.value = echo; out.connect(s); s.connect(this.echoIn); }
    for (const [mult, g, d] of [[1, 1, 1], [2.0, 0.3, 0.55], [3.01, 0.1, 0.3], [4.2, 0.05, 0.16]]) {
      const o = c.createOscillator(), e = c.createGain();
      o.frequency.value = hz(midi) * mult;
      e.gain.setValueAtTime(0, t); e.gain.linearRampToValueAtTime(gain * g, t + 0.008); e.gain.exponentialRampToValueAtTime(0.0001, t + decay * d);
      o.connect(e); e.connect(out); o.start(t); o.stop(t + decay * d + 0.05);
    }
    this.played++;
  }
  // A plucked, soft note for running figures.
  pluck(midi, t, gain = 0.02, dur = 0.5) {
    const c = this.ctx; if (!c) return;
    const o = c.createOscillator(), f = c.createBiquadFilter(), e = c.createGain();
    o.type = 'sawtooth'; o.frequency.value = hz(midi); f.type = 'lowpass'; f.frequency.setValueAtTime(2600, t); f.frequency.exponentialRampToValueAtTime(500, t + dur);
    e.gain.setValueAtTime(0, t); e.gain.linearRampToValueAtTime(gain, t + 0.01); e.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(f); f.connect(e); e.connect(this.out); o.start(t); o.stop(t + dur + 0.05);
    this.played++;
  }
  // A low note that swells and fades.
  bass(midi, t, dur, gain = 0.05) {
    const c = this.ctx; if (!c) return;
    const o = c.createOscillator(), e = c.createGain(); o.type = 'sine'; o.frequency.value = hz(midi);
    const o2 = c.createOscillator(), e2 = c.createGain(); o2.type = 'triangle'; o2.frequency.value = hz(midi + 12); e2.gain.value = 0.18;
    e.gain.setValueAtTime(0, t); e.gain.linearRampToValueAtTime(gain, t + 0.08); e.gain.setTargetAtTime(gain * 0.7, t + 0.1, 0.4); e.gain.setTargetAtTime(0.0001, t + dur, 0.3);
    o.connect(e); o2.connect(e2); e2.connect(e); e.connect(this.out); o.start(t); o2.start(t); o.stop(t + dur + 1.6); o2.stop(t + dur + 1.6);
    this.played++;
  }
  // The call, in the craft's voice; `echo` sends it round the delay.
  call(t, { beat = 0.6, transpose = 12, gain = 0.045, echo = 0.5 } = {}) {
    const c = this.ctx; if (!c) return t;
    const dest = c.createGain(); dest.gain.value = 1; dest.connect(this.out);
    if (echo) { const s = c.createGain(); s.gain.value = echo; dest.connect(s); s.connect(this.echoIn); }
    let end = t;
    for (const n of motifTimes(beat, transpose)) end = motifVoice(c, dest, n.midi, t + n.t, n.dur, gain);
    this.played += MOTIF.length;
    return end;
  }
  // ---------------------------------------------------------------- modes --
  // One turn of the slow chords (eight seconds), with what goes over it.
  _loop(t, mode) {
    const moon = mode === 'moon', credits = mode === 'credits', len = moon ? 10 : 8;
    const ch = CHORDS[this.chord++ % CHORDS.length];
    if (moon && this.chord % 2 === 0) this.chord++;                 // on the Moon: D and G only, further apart
    this.pad(ch, t, len, moon ? 0.016 : 0.02);
    this.bass(ch[0], t, len * 0.9, moon ? 0.03 : 0.04);
    // stray bell notes, a few a turn, from the pentatonic
    const n = moon ? 2 : 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < n; i++) this.bell(PENTA[Math.floor(Math.random() * PENTA.length)] + (Math.random() < 0.3 ? 12 : 0), t + 0.7 + Math.random() * (len - 1.4), 0.018, 2.6, 0.3);
    this.cycles++;
    // and the call, every third turn (every other one under the credits): slowly, high, with its echo
    if (credits ? this.cycles % 2 === 1 : this.cycles % 3 === 2) this.call(t + 1.2, { beat: 0.62, transpose: 12, gain: moon ? 0.03 : 0.04 });
    else if (moon && this.cycles % 3 === 0) for (const nt of motifTimes(0.6, 12).slice(0, 3)) this.bell(nt.midi, t + 2 + nt.t, 0.022, 2.2, 0.4);   // the first three notes, as if remembered
    this.loopAt = t + len;
  }

  // The full arrangement: three times through the call, each time fuller. About 40 seconds; then the credits' loop.
  _finale(t0) {
    const B = 0.5, len = 7 * B, gap = B;                                  // the call is seven beats long
    let t = t0;
    // two bars of the D chord blooming, the bass coming in
    this.pad(CHORDS[0], t, 6, 0.02, 2.5); this.bass(38, t + 2, 4, 0.05);
    for (let i = 0; i < 6; i++) this.bell(PENTA[(i * 3) % PENTA.length] + 12, t + 0.5 + i * 0.66, 0.014, 2, 0.3);
    t += 4;
    // 1: the call alone over its chords
    const under = (t, k = 1, bassOn = true) => motifTimes(B, 0).forEach((n, i) => { this.pad(UNDER[i].slice(1), t + n.t, n.dur + 0.4, 0.014 * k, 0.15); if (bassOn) this.bass(UNDER[i][0], t + n.t, n.dur, 0.045 * k); });
    this._at(t, s => { this.call(s, { beat: B, transpose: 12, gain: 0.05, echo: 0.35 }); under(s, 0.8, false); });
    t += len + gap;
    // 2: with a harmony a third below and running eighths
    this._at(t, s => {
      this.call(s, { beat: B, transpose: 12, gain: 0.05, echo: 0.25 });
      motifTimes(B, 0).forEach((n, i) => { motifVoice(this.ctx, this.out, THIRD[i] + 12, s + n.t, n.dur, 0.028); });
      under(s, 1);
      for (let i = 0; i < 14; i++) { const k = Math.min(4, Math.floor(i / 2)), ch = UNDER[k]; this.pluck(ch[1 + (i % (ch.length - 1))] + 12, s + i * B / 2, 0.014, 0.45); }
    });
    t += len + gap;
    // 3: everything, in octaves, with a walking bass; the held E over A, then home to D
    this._at(t, s => {
      this.call(s, { beat: B, transpose: 12, gain: 0.05, echo: 0.2 });
      this.call(s, { beat: B, transpose: 0, gain: 0.04, echo: 0 });
      this.call(s, { beat: B, transpose: 24, gain: 0.018, echo: 0.3 });
      under(s, 1.2);
      const walk = [38, 40, 43, 45, 47, 45, 43, 45, 45, 45, 45, 33, 33, 33];
      walk.forEach((m, i) => this.bass(m, s + i * B / 2, B / 2 * 0.9, 0.035));
      for (let i = 0; i < 14; i++) { const k = Math.min(4, Math.floor(i / 2)), ch = UNDER[k]; this.pluck(ch[1 + ((i * 2) % (ch.length - 1))] + 24, s + i * B / 2, 0.012, 0.4); }
    });
    t += len;
    // the held note at last comes home
    this._at(t, s => {
      this.pad([38, 45, 50, 54, 57, 64, 69], s, 8, 0.024, 0.4); this.bass(26, s, 7, 0.06); this.bass(38, s, 7, 0.04);
      [62, 66, 69, 74, 76, 81, 86].forEach((m, i) => this.bell(m, s + i * 0.09, 0.03, 4.2, 0.4));
    });
    t += 9;
    this._at(t, () => { if (this.mode === 'finale') { this.mode = 'credits'; this.loopAt = 0; } });
  }
}
