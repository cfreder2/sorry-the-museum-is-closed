// All sound is made here, none is loaded. A toy motor, a big empty room to
// hear it in, and a note for every lamp that comes on.

const PENTA = [0, 2, 4, 7, 9];                    // D major pentatonic: nothing in it can clash
const midi = n => 440 * Math.pow(2, (n - 69) / 12);
// Jingle Bells (James Pierpont, 1857): the chorus, as [note, beats]. 0 is a rest.
const E = 76, F = 77, G = 79, C = 72, D = 74;
const CAROL = [[E, 1], [E, 1], [E, 2], [E, 1], [E, 1], [E, 2], [E, 1], [G, 1], [C, 1.5], [D, 0.5], [E, 4],
  [F, 1], [F, 1], [F, 1.5], [F, 0.5], [F, 1], [E, 1], [E, 1], [E, 0.5], [E, 0.5], [E, 1], [D, 1], [D, 1], [E, 1], [D, 2], [G, 2],
  [E, 1], [E, 1], [E, 2], [E, 1], [E, 1], [E, 2], [E, 1], [G, 1], [C, 1.5], [D, 0.5], [E, 4],
  [F, 1], [F, 1], [F, 1.5], [F, 0.5], [F, 1], [E, 1], [E, 1], [E, 0.5], [E, 0.5], [G, 1], [G, 1], [F, 1], [D, 1], [C, 4], [0, 4]];
const CHORDS = [[50, 57, 64, 69], [47, 54, 62, 66], [43, 50, 59, 62], [45, 52, 61, 64]];

export class Sound {
  constructor() { this.ctx = null; this.muted = false; this.kind = null; this.vol = { master: 0.8, motor: 0.5, music: 0.8 }; }

  // Three sliders: everything, the toy's motor, and the music with the lamp chimes.
  setVolumes(v) {
    Object.assign(this.vol, { master: v.master, motor: v.motor, music: v.music });
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(this.muted ? 0 : this.vol.master, t, 0.05);
    this.motorVol.gain.setTargetAtTime(this.vol.motor, t, 0.05);
  }

  // Call from a key press or a finger lifting; browsers allow nothing sooner.
  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch { /* older iOS */ }
      this.ctx = new AC();
      this._build();
    }
    if (this.ctx.state !== 'running') this.ctx.resume().catch(() => {});
  }

  _build() {
    const c = this.ctx;
    this.master = c.createGain(); this.master.gain.value = this.muted ? 0 : this.vol.master;
    const comp = c.createDynamicsCompressor();
    comp.threshold.value = -16; comp.ratio.value = 5;
    // Everything passes through one filter, which closes in slow motion.
    this.tone = c.createBiquadFilter(); this.tone.type = 'lowpass'; this.tone.frequency.value = 20000;
    this.master.connect(this.tone); this.tone.connect(comp); comp.connect(c.destination);

    // The room: three and a half seconds of stone.
    const len = Math.floor(c.sampleRate * 3.6), ir = c.createBuffer(2, len, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = ir.getChannelData(ch);
      let lp = 0;
      for (let i = 0; i < len; i++) {
        const t = i / len;
        lp += ((Math.random() * 2 - 1) - lp) * (0.55 - 0.4 * t);     // the tail gets duller as it dies
        d[i] = lp * Math.pow(1 - t, 2.6) * (i < 400 ? i / 400 : 1);
      }
    }
    this.verb = c.createConvolver(); this.verb.buffer = ir;
    this.wet = c.createGain(); this.wet.gain.value = 0.55;
    this.verb.connect(this.wet); this.wet.connect(this.master);
    this.dry = c.createGain(); this.dry.connect(this.master);
    this.send = c.createGain(); this.send.connect(this.verb);

    // Motor: two oscillators and a filter that opens with speed.
    this.motor = { o1: c.createOscillator(), o2: c.createOscillator(), f: c.createBiquadFilter(), g: c.createGain(), s: c.createGain() };
    const m = this.motor;
    m.o1.type = 'sawtooth'; m.o2.type = 'square';
    m.f.type = 'lowpass'; m.f.Q.value = 3;
    m.g.gain.value = 0; m.s.gain.value = 0.3;
    this.motorVol = c.createGain(); this.motorVol.gain.value = this.vol.motor;
    m.o1.connect(m.f); m.o2.connect(m.f); m.f.connect(this.motorVol); this.motorVol.connect(m.g); m.g.connect(this.dry); m.g.connect(m.s); m.s.connect(this.send);
    m.o1.start(); m.o2.start();

    // Room tone: the hush of a very large building with the heating on.
    const nb = c.createBuffer(1, c.sampleRate * 2, c.sampleRate), nd = nb.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    this.noise = nb;
    const tone = c.createBufferSource(); tone.buffer = nb; tone.loop = true;
    const tf = c.createBiquadFilter(); tf.type = 'lowpass'; tf.frequency.value = 220;
    const tg = c.createGain(); tg.gain.value = 0.05;
    tone.connect(tf); tf.connect(tg); tg.connect(this.master); tone.start();

    this.padGain = c.createGain(); this.padGain.gain.value = 0;
    const pf = c.createBiquadFilter(); pf.type = 'lowpass'; pf.frequency.value = 900;
    this.padGain.connect(pf); pf.connect(this.dry); pf.connect(this.send);
    this.padVoices = [];
    this.chord = 0; this.nextChord = 0; this.nextTune = c.currentTime + 6;
  }

  // A short sample of a group, so a slider can be set by ear.
  preview(group) {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const t = this.ctx.currentTime;
    if (this._prev && t - this._prev < 0.25) return;
    this._prev = t;
    if (group === 'music') this.bell(midi(74), t, 0.045 * this.vol.music, 1.2);
    else {
      const o = this.ctx.createOscillator(), e = this.ctx.createGain();
      o.type = 'sawtooth'; o.frequency.setValueAtTime(240, t); o.frequency.linearRampToValueAtTime(420, t + 0.3);
      e.gain.setValueAtTime(0.03 * this.vol.motor, t); e.gain.linearRampToValueAtTime(0, t + 0.32);
      o.connect(e); e.connect(this.dry); o.start(t); o.stop(t + 0.34);
    }
  }

  // k is the speed of the world: 1 is normal, 0.2 is a held breath.
  setSlow(k) {
    this.slowK = k;
    if (this.tone) this.tone.frequency.setTargetAtTime(500 + 19500 * k * k, this.ctx.currentTime, 0.05);
  }

  // The sound of time slowing: two low notes and one very high one.
  swell() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.bell(midi(50), t, 0.09, 4.5); this.bell(midi(57), t + 0.04, 0.06, 4.5); this.bell(midi(93), t + 0.1, 0.02, 3);
  }

  setMuted(m) { this.muted = m; if (this.master) this.master.gain.setTargetAtTime(m ? 0 : this.vol.master, this.ctx.currentTime, 0.05); }

  // --------------------------------------------------------------- per frame --

  update(vehicle, active) {
    const c = this.ctx;
    if (!c || c.state !== 'running') return;
    const now = c.currentTime, m = this.motor;
    if (!active || !vehicle) { m.g.gain.setTargetAtTime(0, now, 0.1); }
    else if (vehicle.kind === 'car') {
      const v = Math.min(1.1, Math.abs(vehicle.speed) / 11.5), load = Math.abs(vehicle.throttle);
      const f = (70 + 620 * v + load * 30 + (vehicle.air ? 220 * load : 0)) * (0.45 + 0.55 * (this.slowK ?? 1));
      m.o1.frequency.setTargetAtTime(f, now, 0.04); m.o2.frequency.setTargetAtTime(f * 2.02, now, 0.04);
      m.f.frequency.setTargetAtTime(500 + 2600 * v + 500 * load, now, 0.05);
      m.g.gain.setTargetAtTime(0.003 + 0.02 * v + 0.014 * load * (0.4 + v), now, 0.05);
    } else {
      const th = vehicle.landed ? 0.12 : vehicle.thrust, f = 150 + 150 * th;
      m.o1.frequency.setTargetAtTime(f, now, 0.06); m.o2.frequency.setTargetAtTime(f * 1.503, now, 0.06);
      m.f.frequency.setTargetAtTime(900 + 1500 * th, now, 0.06);
      m.g.gain.setTargetAtTime(vehicle.landed ? 0.004 : 0.011 + 0.02 * th, now, 0.06);
    }
    this._music(now);
  }

  // Slow chords under everything, and now and then a few notes of a tune you
  // half remember.
  _music(now) {
    if (!this.musicOn) { this.padGain.gain.setTargetAtTime(0, now, 1.5); return; }
    this.padGain.gain.setTargetAtTime(this.vol.music, now, 0.6);
    if (now >= this.nextChord) {
      const c = this.ctx, notes = CHORDS[this.chord++ % CHORDS.length];
      const dur = 15;
      for (const n of notes) for (const [det, type, g] of [[-4, 'sine', 0.02], [5, 'triangle', 0.008]]) {
        const o = c.createOscillator(), e = c.createGain();
        o.type = type; o.frequency.value = midi(n); o.detune.value = det;
        e.gain.setValueAtTime(0, now); e.gain.linearRampToValueAtTime(g, now + 5); e.gain.setValueAtTime(g, now + dur - 4); e.gain.linearRampToValueAtTime(0, now + dur + 3);
        o.connect(e); e.connect(this.padGain); o.start(now); o.stop(now + dur + 3.2);
      }
      this.nextChord = now + dur;
    }
    if (now >= this.nextTune) {
      const n = 2 + Math.floor(Math.random() * 4);
      let t = now, deg = Math.floor(Math.random() * 5);
      for (let i = 0; i < n; i++) {
        deg += Math.random() < 0.7 ? (Math.random() < 0.5 ? 1 : -1) : 2;
        const oct = Math.floor(deg / 5), note = 74 + PENTA[((deg % 5) + 5) % 5] + oct * 12;
        this.bell(midi(note), t, 0.035 * this.vol.music, 2.6);
        t += [0.42, 0.42, 0.84][Math.floor(Math.random() * 3)];
      }
      this.nextTune = now + 9 + Math.random() * 12;
    }
  }

  // --------------------------------------------------------------- one-shots --

  bell(freq, when, gain = 0.06, decay = 2.2, wet = 1) {
    const c = this.ctx;
    if (!c || c.state !== 'running') return;
    const t = Math.max(when || 0, c.currentTime);
    const out = c.createGain(); out.gain.value = 1;
    out.connect(this.dry);
    const s = c.createGain(); s.gain.value = wet; out.connect(s); s.connect(this.send);
    for (const [mult, g, d] of [[1, 1, 1], [2.01, 0.28, 0.6], [3.02, 0.09, 0.35], [5.4, 0.04, 0.15]]) {
      const o = c.createOscillator(), e = c.createGain();
      o.frequency.value = freq * mult;
      e.gain.setValueAtTime(0, t); e.gain.linearRampToValueAtTime(gain * g, t + 0.006);
      e.gain.exponentialRampToValueAtTime(0.0001, t + decay * d);
      o.connect(e); e.connect(out); o.start(t); o.stop(t + decay * d + 0.05);
    }
  }

  // The note a lamp makes as it comes on. Each work has its own, always the same.
  lamp(art) {
    if (!this.ctx) return;
    const id = art.work.id, deg = id % 5, oct = (id >> 3) % 3;
    const note = (art.mini ? 74 : 62) + PENTA[deg] + oct * 12;
    const k = this.vol.music;
    this.bell(midi(note), 0, (art.mini ? 0.028 : 0.045) * k, art.mini ? 1.4 : 2.4);
    this.tick(0.05 * k, 3500);
  }

  tick(gain = 0.08, freq = 1800, dur = 0.04) {
    const c = this.ctx;
    if (!c || c.state !== 'running') return;
    const s = c.createBufferSource(); s.buffer = this.noise;
    const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = 1.2;
    const e = c.createGain(), t = c.currentTime;
    e.gain.setValueAtTime(gain, t); e.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(e); e.connect(this.dry); e.connect(this.send);
    s.start(t, Math.random()); s.stop(t + dur + 0.02);
  }

  bump(strength) {
    const c = this.ctx;
    if (!c || c.state !== 'running') return;
    const g = Math.min(0.5, 0.05 + strength * 0.05), t = c.currentTime;
    const o = c.createOscillator(), e = c.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(48, t + 0.14);
    e.gain.setValueAtTime(g, t); e.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
    o.connect(e); e.connect(this.dry); e.connect(this.send); o.start(t); o.stop(t + 0.22);
    this.tick(g * 0.7, 900, 0.07);
  }

  beep(freq, dur = 0.14, gain = 0.09) {
    const c = this.ctx;
    if (!c || c.state !== 'running') return;
    const t = c.currentTime, o = c.createOscillator(), e = c.createGain();
    o.type = 'square'; o.frequency.value = freq;
    e.gain.setValueAtTime(gain, t); e.gain.setValueAtTime(gain, t + dur - 0.02); e.gain.linearRampToValueAtTime(0, t + dur);
    o.connect(e); e.connect(this.dry); e.connect(this.send); o.start(t); o.stop(t + dur + 0.02);
  }

  gate() { this.bell(midi(86), 0, 0.05, 0.7, 0.6); }
  // One soft note for each work seen.
  seen() { this.bell(midi(81 + PENTA[Math.floor(Math.random() * 5)]), 0, 0.03 * this.vol.music, 1.1, 0.7); }

  // A perfect landing: the chord, all at once and bright.
  perfect() { const t = this.ctx ? this.ctx.currentTime : 0; [74, 81, 86, 90, 93].forEach((n, i) => this.bell(midi(n), t + i * 0.035, 0.06, 2.2)); }

  // Each hoop a step higher up the scale than the last.
  hoop(n) {
    const t = this.ctx ? this.ctx.currentTime : 0, deg = n % 10, note = 74 + PENTA[deg % 5] + Math.floor(deg / 5) * 12;
    this.bell(midi(note), t, 0.07, 1.4); this.bell(midi(note + 7), t + 0.07, 0.05, 1.6);
  }

  // The spring of a hop.
  boing() {
    const c = this.ctx;
    if (!c || c.state !== 'running') return;
    const t = c.currentTime, o = c.createOscillator(), e = c.createGain();
    o.type = 'triangle'; o.frequency.setValueAtTime(180, t); o.frequency.exponentialRampToValueAtTime(520, t + 0.13);
    e.gain.setValueAtTime(0.07, t); e.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
    o.connect(e); e.connect(this.dry); e.connect(this.send); o.start(t); o.stop(t + 0.22);
  }

  // Hollow plastic: a cone or a folding sign taking a hit.
  knock(speed, big) {
    const c = this.ctx;
    if (!c || c.state !== 'running') return;
    const t = c.currentTime;
    if (this._knock && t - this._knock < 0.04) return;
    this._knock = t;
    const g = Math.min(0.22, 0.04 + speed * 0.022), o = c.createOscillator(), e = c.createGain();
    o.type = 'square'; o.frequency.setValueAtTime(big ? 210 : 330 + Math.random() * 90, t); o.frequency.exponentialRampToValueAtTime(big ? 120 : 190, t + 0.07);
    e.gain.setValueAtTime(g * 0.5, t); e.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
    o.connect(e); e.connect(this.dry); e.connect(this.send); o.start(t); o.stop(t + 0.1);
    this.tick(g, big ? 600 : 1400, 0.05);
  }
  // Jingle Bells, picked out on bells with a shake of sleigh bells on the beat, coming from the tree:
  // nothing at forty-five metres, plain at ten. Notes are laid down a quarter of a second ahead.
  carol(dist) {
    const c = this.ctx;
    if (!c || c.state !== 'running') return;
    const near = Math.max(0, 1 - dist / 45);
    if (near <= 0 || this.muted) { this._carolAt = 0; return; }
    const beat = 0.29, now = c.currentTime;
    if (!this._carolAt || this._carolAt < now - 0.5) { this._carolAt = now + 0.1; this._carolI = 0; }
    const vol = near * near * 0.075 * this.vol.music;
    while (this._carolAt < now + 0.25) {
      const [n, len] = CAROL[this._carolI], t = this._carolAt;
      if (n) { this.bell(midi(n), t, vol, 0.9 + len * 0.35, 0.5); this.bell(midi(n - 12), t, vol * 0.3, 0.8, 0.3); }
      for (let b = 0; b < len; b++) {                       // sleigh bells
        const s = c.createBufferSource(), f = c.createBiquadFilter(), e = c.createGain(), tb = t + b * beat;
        s.buffer = this.noise; f.type = 'highpass'; f.frequency.value = 6500;
        e.gain.setValueAtTime(vol * 0.55, tb); e.gain.exponentialRampToValueAtTime(0.0001, tb + 0.1);
        s.connect(f); f.connect(e); e.connect(this.dry); s.start(tb, Math.random()); s.stop(tb + 0.12);
      }
      this._carolAt += len * beat; this._carolI = (this._carolI + 1) % CAROL.length;
    }
  }
  // Packed snow coming apart: a soft thump and a hiss.
  poof(speed) {
    const c = this.ctx;
    if (!c || c.state !== 'running') return;
    const t = c.currentTime, g = Math.min(0.3, 0.1 + speed * 0.02), o = c.createOscillator(), e = c.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.16);
    e.gain.setValueAtTime(g, t); e.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
    o.connect(e); e.connect(this.dry); o.start(t); o.stop(t + 0.24);
    this.tick(g * 0.9, 2600, 0.22); this.tick(g * 0.6, 700, 0.12);
  }
  lap() { const t = this.ctx ? this.ctx.currentTime : 0; [74, 78, 81].forEach((n, i) => this.bell(midi(n), t + i * 0.09, 0.06, 1.2)); }
  finish() { const t = this.ctx ? this.ctx.currentTime : 0; [74, 78, 81, 86, 90].forEach((n, i) => this.bell(midi(n), t + i * 0.13, 0.07, 3)); }
  roomChord() { const t = this.ctx ? this.ctx.currentTime : 0; [50, 57].forEach((n, i) => this.bell(midi(n), t + i * 0.05, 0.05, 4)); }
}
