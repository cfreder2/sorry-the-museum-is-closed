// Gallery music: in some galleries, very quietly, a tune of the time and place of what hangs there. All of it
// synthesised here, note by note, from music old enough to be anybody's (nothing recorded):
//   Japanese galleries (100s, 130s-140s)   "Sakura Sakura", on something like a koto
//   Ancient art (150s)                      the Seikilos epitaph, on something like a lyre
//   the clocks (231-234)                    the Cambridge quarters, on a music box, with the ticking
//   Gallery 242                             Offenbach's galop, the can-can (unless something there is already playing it)
//   the other French rooms (200s-240s)      Chopin's Nocturne in E flat, Op. 9 No. 2 (its opening)
//   American art (260s-270s)                Stephen Foster's "Oh! Susanna", on something like a banjo
//   the Modern Wing, and everywhere else    nothing
// One tune at a time; it fades in as you go into the room and out as you leave. Settings: "Gallery music"
// turns it off, and it is as loud as "Music and lamp chimes".

import { feature } from './features.js';
import { galleryNo } from './placing.js';

const THEMES = {
  koto: { unit: 0.35, vol: 0.07, lp: 3200, voice: 'koto', notes: [[69, 2], [69, 2], [71, 4], [69, 2], [69, 2], [71, 4], [69, 2], [71, 2], [72, 2], [71, 2], [69, 2], [71, 1], [69, 1], [65, 4], [64, 2], [60, 2], [64, 2], [65, 2], [64, 2], [64, 1], [60, 1], [59, 4]] },
  lyre: { unit: 0.33, vol: 0.07, lp: 2200, voice: 'lyre', notes: [[69, 2], [76, 4], [73, 2], [74, 2], [76, 2], [74, 1], [73, 1], [74, 4], [73, 2], [71, 2], [69, 4], [71, 2], [73, 2], [74, 2], [71, 2], [69, 2], [68, 2], [66, 2], [64, 6]] },
  clock: { unit: 0.4, vol: 0.05, lp: 6000, voice: 'bell', tick: true, notes: [[76, 2], [72, 2], [74, 2], [67, 4], [67, 2], [74, 2], [76, 2], [72, 4], [76, 2], [74, 2], [72, 2], [67, 4], [67, 2], [74, 2], [76, 2], [72, 4]] },
  cancan: { unit: 0.13, vol: 0.035, lp: 2400, voice: 'reed', notes: [[60, 2], [60, 2], [62, 1], [65, 1], [64, 1], [62, 1], [67, 2], [67, 2], [67, 1], [69, 1], [64, 1], [65, 1], [62, 2], [62, 2], [62, 1], [65, 1], [64, 1], [62, 1], [60, 1], [72, 1], [71, 1], [69, 1], [67, 1], [65, 1], [64, 1], [62, 1], [60, 4]] },
  nocturne: { unit: 0.3, vol: 0.06, lp: 3000, voice: 'piano', notes: [[70, 1], [79, 4], [77, 1], [79, 2], [77, 1], [75, 3], [70, 2], [79, 1], [72, 2], [84, 1], [79, 2], [82, 1], [80, 2], [79, 1], [77, 2], [79, 1], [72, 2], [74, 1], [75, 3]] },
  susanna: { unit: 0.2, vol: 0.045, lp: 2000, voice: 'banjo', notes: [[60, 1], [62, 1], [64, 2], [67, 2], [67, 3], [69, 1], [67, 2], [64, 2], [60, 3], [62, 1], [64, 2], [64, 2], [62, 2], [60, 2], [62, 6], [60, 1], [62, 1], [64, 2], [67, 2], [67, 3], [69, 1], [67, 2], [64, 2], [60, 3], [62, 1], [64, 2], [64, 2], [62, 2], [62, 2], [60, 6]] },
};
const REST = 7;           // seconds between one time through a tune and the next

/** Which tune for a room, or null. */
export function themeFor(r) {
  if (!r || r.building === 'modern') return null;
  const n = galleryNo(r); if (!n) return null;
  if ((n >= 101 && n <= 109) || (n >= 130 && n <= 143)) return 'koto';
  if (n >= 150 && n <= 159) return 'lyre';
  if (n >= 231 && n <= 234) return 'clock';
  if (n === 242) return 'cancan';
  if (n >= 200 && n <= 249) return 'nocturne';
  if (n >= 260 && n <= 279) return 'susanna';
  return null;
}

const hz = m => 440 * Math.pow(2, (m - 69) / 12);

feature({
  id: 'music',
  init(k) { this.k = k; this.key = null; this.cur = null; k.G.galleryMusic = this; },
  // What should be playing now.
  want(k) {
    const G = k.G, s = k.sound;
    if (!s || !s.ctx || s.ctx.state !== 'running' || !s.musicOn || G.set.gallerymusic === false) return null;
    if (G.state !== 'play' && G.state !== 'study') return null;
    if (G.racing) return null;
    const key = themeFor(k.room);
    if (key === 'cancan' && G.musicBusy) return null;               // the room's own can-can is on: let it have the floor
    return key;
  },
  update(dt, k) {
    const key = this.want(k), s = k.sound;
    if (key !== this.key) { this._switch(key); this.key = key; }
    if (!this.cur) return;
    const c = s.ctx, now = c.currentTime, T = this.cur.theme;
    this.cur.gain.gain.setTargetAtTime(T.vol * s.vol.music, now, 0.5);
    if (s.nextTune !== undefined) s.nextTune = Math.max(s.nextTune, now + 6);  // the ambient bells keep quiet meanwhile
    if (this.cur.next < now) this.cur.next = now + 0.05;
    while (this.cur.next < now + 0.4) {
      const [m, u] = T.notes[this.cur.i], dur = u * T.unit;
      this._note(T, m, this.cur.next, dur);
      if (T.tick) for (let j = 0; j < u; j++) this._tick(this.cur.next + j * T.unit);
      this.cur.next += dur;
      if (++this.cur.i >= T.notes.length) { this.cur.i = 0; this.cur.next += REST; this.cur.loops++; }
    }
  },
  _switch(key) {
    const s = this.k.sound;
    if (this.cur) { const g = this.cur.gain, now = s.ctx.currentTime; g.gain.cancelScheduledValues(now); g.gain.setTargetAtTime(0, now, 0.5); setTimeout(() => { try { g.disconnect(); } catch { } }, 4000); this.cur = null; }
    if (!key) return;
    const c = s.ctx, gain = c.createGain(), lp = c.createBiquadFilter(), wet = c.createGain(), theme = THEMES[key];
    gain.gain.value = 0; lp.type = 'lowpass'; lp.frequency.value = theme.lp; wet.gain.value = 0.35;
    gain.connect(lp); lp.connect(s.dry || s.master); lp.connect(wet); wet.connect(s.send || s.master);
    this.cur = { key, theme, gain, i: 0, next: c.currentTime + 1.2, loops: 0 };
  },
  // One note of the tune, in its instrument's voice.
  _note(T, m, t, dur) {
    const c = this.k.sound.ctx, f = hz(m), out = this.cur.gain, e = c.createGain(), o = c.createOscillator();
    let o2 = null, len = Math.max(dur * 1.4, 0.6);
    const amp = { piano: 0.9, koto: 1, lyre: 0.9, bell: 0.8, reed: 0.7, banjo: 0.9 }[T.voice];
    o.frequency.setValueAtTime(f, t);
    if (T.voice === 'koto') { o.type = 'triangle'; o.frequency.setValueAtTime(f * 1.012, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.06); len = 1.3; }
    else if (T.voice === 'lyre') { o.type = 'triangle'; len = 1.7; }
    else if (T.voice === 'bell') { o.type = 'sine'; len = 1.8; o2 = c.createOscillator(); o2.type = 'sine'; o2.frequency.value = f * 2.76; }
    else if (T.voice === 'reed') { o.type = 'sawtooth'; len = dur * 0.95; }
    else if (T.voice === 'banjo') { o.type = 'square'; len = 0.45; }
    else { o.type = 'sine'; len = Math.max(dur * 1.6, 1.4); o2 = c.createOscillator(); o2.type = 'sine'; o2.frequency.value = f * 2; }
    e.gain.setValueAtTime(0, t); e.gain.linearRampToValueAtTime(amp, t + (T.voice === 'reed' ? 0.015 : 0.006));
    if (T.voice === 'reed') { e.gain.setValueAtTime(amp, t + len * 0.7); e.gain.linearRampToValueAtTime(0, t + len); }
    else e.gain.exponentialRampToValueAtTime(0.0008, t + len);
    o.connect(e); e.connect(out); o.start(t); o.stop(t + len + 0.05);
    if (o2) { const e2 = c.createGain(); e2.gain.value = T.voice === 'bell' ? 0.18 : 0.25; o2.connect(e2); e2.connect(e); o2.start(t); o2.stop(t + len + 0.05); }
  },
  _tick(t) {
    const c = this.k.sound.ctx, o = c.createOscillator(), e = c.createGain();
    o.type = 'square'; o.frequency.value = 2400; e.gain.setValueAtTime(0.12, t); e.gain.exponentialRampToValueAtTime(0.0005, t + 0.02);
    o.connect(e); e.connect(this.cur.gain); o.start(t); o.stop(t + 0.03);
  },
  reset() { if (this.cur) { this._switch(null); this.key = null; } },
});
