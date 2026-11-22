// The music of Snow Ball, the dance game on the band shell (bandshell.js): two dances, both published long before 1900,
// written down as their melodies (in carols.js's notation) with a chord a bar, arranged here for a small dance band and
// played note by note on the game's own audio context. Nothing is recorded.
//
// The steps are worked out from the melody too (chart): every step falls on a note of the tune, the strong beats first,
// as many as the level allows; and the arrow follows the tune's line, low notes to the left, high notes to the right.
//
// No three.js, no DOM: `node` can load this file (checkSongs at the end checks the bars add up).
import { parse, chart as chords } from './carols.js';

// ---------------------------------------------------------------- the dances
// A song is sections played one after another: [melody, chords, transpose (semitones), what joins in]. `count` bars of
// hi-hat count it in. `pal` is its three colours for the lights.
const CAN_A = `C5 C5 | D5:.5 F5:.5 E5:.5 D5:.5 | G5 G5 | G5:.5 A5:.5 E5:.5 F5:.5 | D5 D5 | D5:.5 F5:.5 E5:.5 D5:.5 | C5:.5 C6:.5 B5:.5 A5:.5 | G5:.5 F5:.5 E5:.5 D5:.5 |
               C5 C5 | D5:.5 F5:.5 E5:.5 D5:.5 | G5 G5 | G5:.5 A5:.5 E5:.5 F5:.5 | D5 D5 | D5:.5 F5:.5 E5:.5 D5:.5 | C5:.5 G5:.5 D5:.5 E5:.5 | C5 R`;
const CAN_H = 'C G G C G G C G C G G C G G C/G C';
const DAN_A = `D4 D4 F#4 | A4:3 | R A5 A5 | R F#5 F#5 | D4 D4 F#4 | A4:3 | R A5 A5 | R G5 G5 |
               C#4 C#4 E4 | B4:3 | R B5 B5 | R G5 G5 | C#4 C#4 E4 | B4:3 | R B5 B5 | R F#5 F#5 |
               D4 D4 F#4 | A4:3 | R D6 D6 | R A5 A5 | D4 D4 F#4 | A4:3 | R D6 D6 | R B5 B5 |
               E4 E4 G4 | B4:3 | B4 G#4 A4 | F#5:3 | E5:2 C#5 | D5:3`;
const DAN_H = 'D D D D D D D A A A A A A A A D D D D D D D D G Em Em E D A D';

export const DANCES = [
  { id: 'cancan', title: 'CAN-CAN', by: 'Offenbach, 1858', long: 'Galop infernal, from Orpheus in the Underworld', meter: 2, bpm: 144, count: 2, lead: 'brass',
    pal: [[2.9, 0.35, 0.5], [2.8, 1.9, 0.35], [0.4, 1.2, 2.9]],
    sections: [[CAN_A, CAN_H, 0, ''], [CAN_A, CAN_H, 0, 'hat glock'], [CAN_A, CAN_H, 2, 'hat glock'], [CAN_A, CAN_H, 2, 'hat glock end']] },
  { id: 'danube', title: 'BLUE DANUBE', by: 'J. Strauss II, 1867', long: 'An der schönen blauen Donau, waltz', meter: 3, bpm: 168, count: 2, lead: 'strings',
    pal: [[0.35, 1.4, 2.9], [1.9, 2.3, 2.9], [1.5, 0.5, 2.7]],
    sections: [[DAN_A, DAN_H, 0, ''], [DAN_A, DAN_H, 0, 'glock end']] },
];
export const LEVELS = [{ name: 'EASY', gap: 0.6, window: 1.9 }, { name: 'NORMAL', gap: 0.3, window: 1.55 }, { name: 'HARD', gap: 0.2, window: 1.25, fill: true }];
export const LANES = ['LEFT', 'DOWN', 'UP', 'RIGHT'];

// ---------------------------------------------------------------- the band
// Everything a dance plays, in beats from the top of the count-in: [{ t, d, v (voice), m (midi or chord), g }], with the
// tune itself (for the steps) as [{ t, d, m }].
export function arrange(song) {
  const M = song.meter, ev = [], tune = [];
  let t0 = song.count * M;
  for (let b = 0; b < t0; b++) ev.push({ t: b, d: 0.1, v: 'click', g: b % M === 0 ? 1 : 0.6 });
  for (const [mel, harm, tr, how] of song.sections) {
    const { notes, len } = parse(mel), bars = Math.round(len / M), ch = chords(harm, M);
    const glock = how.includes('glock'), hat = how.includes('hat');
    for (const n of notes) {
      if (!n.m) continue;
      const m = n.m + tr, t = t0 + n.t;
      tune.push({ t, d: n.d, m });
      ev.push({ t, d: n.d, v: song.lead, m, g: 1 });
      if (glock) ev.push({ t, d: n.d, v: 'glock', m: m + 12, g: 0.7 });
    }
    for (const c of ch) {
      const at = t0 + c.t - M, root = 36 + ((c.root + tr) % 12 + 12) % 12, triad = c.q.map(q => 55 + ((c.root + tr + q - 55) % 12 + 12) % 12);
      for (let b = 0; b < c.d - 1e-6; b++) {
        const t = at + b, beat = Math.round((t - t0) % M * 2) / 2;
        if (M === 3) {                  // a waltz: the bass on one, the chord on two and three
          if (beat === 0) { ev.push({ t, d: 1, v: 'bass', m: root, g: 1 }); ev.push({ t, d: 0.2, v: 'kick', g: 0.7 }); }
          else ev.push({ t, d: 0.6, v: 'chord', m: triad, g: beat === 1 ? 1 : 0.75 });
          if (hat || glock) ev.push({ t, d: 0.05, v: 'hat', g: beat === 0 ? 0.6 : 0.35 });
        } else {                        // a galop: bass on the beat, the chord off it, the snare on two
          ev.push({ t, d: 0.5, v: 'bass', m: beat === 0 ? root : root + 7, g: 1 });
          ev.push({ t, d: 0.3, v: 'kick', g: beat === 0 ? 1 : 0.75 });
          ev.push({ t: t + 0.5, d: 0.3, v: 'chord', m: triad, g: 0.9 });
          if (beat === 1) ev.push({ t, d: 0.2, v: 'snare', g: hat ? 1 : 0.6 });
          if (hat) { ev.push({ t, d: 0.05, v: 'hat', g: 0.35 }); ev.push({ t: t + 0.5, d: 0.05, v: 'hat', g: 0.7 }); }
        }
      }
    }
    t0 += bars * M;
    if (how.includes('end')) {
      const key = ch[ch.length - 1], root = 36 + ((key.root + tr) % 12 + 12) % 12;
      ev.push({ t: t0, d: M * 1.5, v: 'crash', g: 1 }, { t: t0, d: M * 1.5, v: 'bass', m: root, g: 1 }, { t: t0, d: M * 1.5, v: 'chord', m: key.q.map(q => 55 + ((key.root + tr + q - 55) % 12 + 12) % 12).concat([67 + ((key.root + tr - 67) % 12 + 12) % 12]), g: 1.4 }, { t: t0, d: 0.3, v: 'kick', g: 1 });
    }
  }
  ev.sort((a, b) => a.t - b.t);
  return { song, ev, tune, beats: t0 + song.meter * 1.5, spb: 60 / song.bpm, first: song.count * M };
}

// ---------------------------------------------------------------- the steps
// The notes of the tune a level dances, strongest beats first, none closer than the level's gap (in seconds) to another;
// each given an arrow by how high it is among the tune's notes (low to the left, high to the right), and never three of
// the same arrow quickly in a row. Returns [{ t (seconds from the top), beat, lane }].
export function chart(A, level) {
  const { tune, spb, song } = A, M = song.meter, gap = level.gap;
  const strength = n => { const p = ((n.t % M) + M) % M; return (Math.abs(p) < 1e-6 ? 3 : Math.abs(p - Math.round(p)) < 1e-6 ? 2 : Math.abs(p * 2 - Math.round(p * 2)) < 1e-6 ? 1 : 0) + (n.d >= 2 ? 1 : 0); };
  // (HARD also steps out the beats under a long note: the waltz's oom-pah-pah under the held ones)
  const notes = level.fill ? tune.flatMap(n => n.d >= 2 ? [n, ...Array.from({ length: Math.round(n.d) - 1 }, (_, k) => ({ t: n.t + k + 1, d: 0.5, m: n.m }))] : [n]) : tune;
  const order = notes.map((n, i) => ({ n, i, s: strength(n) })).sort((a, b) => b.s - a.s || a.i - b.i), pick = [];
  for (const o of order) if (!pick.some(p => Math.abs(p.n.t - o.n.t) * spb < gap - 1e-6)) pick.push(o);
  pick.sort((a, b) => a.n.t - b.n.t);
  const ps = pick.map(o => o.n.m).sort((a, b) => a - b), q = f => ps[Math.min(ps.length - 1, Math.floor(ps.length * f))];
  const cut = [q(0.25), q(0.5), q(0.75)], out = [];
  for (const { n } of pick) {
    let lane = n.m < cut[0] ? 0 : n.m < cut[1] ? 1 : n.m < cut[2] ? 2 : 3;
    const a = out[out.length - 1], b = out[out.length - 2];
    if (a && n.m === a.m) lane = a.lane;                                                         // the same note, the same arrow
    else if (a && lane === a.lane) lane = Math.max(0, Math.min(3, lane + (n.m > a.m ? 1 : -1)));  // a step up or down the tune is a step to the side
    if (a && b && a.lane === lane && b.lane === lane && (n.t - b.beat) * spb < 1.0) lane = [1, 0, 3, 2][lane];
    out.push({ t: n.t * spb, beat: n.t, lane, m: n.m });
  }
  return out;
}

// ---------------------------------------------------------------- the player
const hz = m => 440 * Math.pow(2, (m - 69) / 12);
export class Band {
  constructor() { this.A = null; this.out = null; this.ctx = null; this.next = 0; this.start = 0; }
  // Start a dance at audio time `at` (the top of the count-in).
  play(sound, A, at, level = 0.8) {
    this.stop(); const c = sound && sound.ctx; if (!c) return;
    this.A = A; this.start = at; this.next = 0; this.i0 = 0; this.ctx = c; this.sound = sound;
    this.out = c.createGain(); this.out.gain.value = level;
    const wet = c.createGain(); wet.gain.value = 0.22; this.out.connect(sound.dry || sound.master); this.out.connect(wet); wet.connect(sound.send || sound.dry || sound.master); this.wet = wet;
  }
  stop(fade = 0.08) {
    if (!this.out) return; const c = this.ctx, o = this.out, w = this.wet;
    try { o.gain.cancelScheduledValues(c.currentTime); o.gain.setTargetAtTime(0, c.currentTime, fade); } catch { /* closed */ }
    setTimeout(() => { try { o.disconnect(); w.disconnect(); } catch { /* gone */ } }, 1500);
    this.out = null; this.A = null;
  }
  // Once a frame: lay the notes down half a second ahead.
  update() {
    const A = this.A, c = this.ctx; if (!A || !this.out || c.state !== 'running') return;
    const now = c.currentTime, ahead = (now + 0.5 - this.start) / A.spb, ev = A.ev;
    for (let i = this.i0 || 0; i < ev.length && ev[i].t < ahead; i++) {
      this.i0 = i + 1; const e = ev[i]; if (e.t < this.next) continue;
      const when = this.start + e.t * A.spb; if (when < now - 0.03) continue;
      this._voice(e, Math.max(when, now), A.spb);
    }
    this.next = ahead;
  }
  _voice(e, t, spb) {
    const c = this.ctx, out = this.out, d = e.d * spb, sound = this.sound;
    const env = (g, a, hold, rel) => { const n = c.createGain(); n.gain.setValueAtTime(0, t); n.gain.linearRampToValueAtTime(g, t + a); if (hold > a) n.gain.setValueAtTime(g, t + hold); n.gain.exponentialRampToValueAtTime(0.0005, t + hold + rel); n.connect(out); return n; };
    const osc = (type, f, to, end, det = 0) => { const o = c.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t); o.detune.value = det; o.connect(to); o.start(t); o.stop(end); return o; };
    const noise = (to, end, off = 0) => { if (!sound.noise) return; const s = c.createBufferSource(); s.buffer = sound.noise; s.connect(to); s.start(t, off || Math.random() * 1.5); s.stop(end); };
    switch (e.v) {
      case 'brass': {         // a bright, buzzy lead for the galop: two saws and a square, the filter opening on each note
        const f = hz(e.m), n = env(0.045 * e.g, 0.01, Math.max(0.04, d * 0.7), 0.08), lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 2;
        lp.frequency.setValueAtTime(900, t); lp.frequency.linearRampToValueAtTime(4200, t + 0.03); lp.frequency.exponentialRampToValueAtTime(1800, t + Math.max(0.08, d)); lp.connect(n);
        const end = t + d + 0.15; osc('sawtooth', f, lp, end, -7); osc('sawtooth', f, lp, end, 7); const sq = c.createGain(); sq.gain.value = 0.5; sq.connect(lp); osc('square', f / 2, sq, end);
        break;
      }
      case 'strings': {       // a soft bowed lead for the waltz: saws a little apart, a slow swell, a vibrato that comes in late
        const f = hz(e.m), n = env(0.05 * e.g, Math.min(0.09, d * 0.3), Math.max(0.08, d * 0.88), 0.22), lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2600; lp.Q.value = 0.5; lp.connect(n);
        const end = t + d + 0.3, vib = c.createOscillator(), vg = c.createGain(); vib.frequency.value = 5.5; vg.gain.setValueAtTime(0, t); vg.gain.linearRampToValueAtTime(9, t + Math.min(0.5, d)); vib.connect(vg); vib.start(t); vib.stop(end);
        for (const det of [-8, 0, 8]) { const o = osc('sawtooth', f, lp, end, det); vg.connect(o.detune); }
        const sub = c.createGain(); sub.gain.value = 0.6; sub.connect(n); osc('triangle', f, sub, end);
        break;
      }
      case 'glock': { const f = hz(e.m); for (const [mul, g, dec] of [[1, 1, 0.9], [2.76, 0.3, 0.3], [5.4, 0.1, 0.12]]) { const n = env(0.03 * e.g * g, 0.003, 0.004, dec); osc('sine', f * mul, n, t + dec + 0.05); } break; }
      case 'bass': { const f = hz(e.m), n = env(0.15 * e.g, 0.008, Math.min(0.25, d * 0.5), Math.min(1.2, d * 0.6 + 0.1)); osc('triangle', f, n, t + d + 0.3); const h = c.createGain(); h.gain.value = 0.25; h.connect(n); osc('square', f, h, t + d + 0.3); break; }
      case 'chord': { for (const m of e.m) { const n = env(0.016 * e.g, 0.006, 0.02, Math.min(1.6, 0.22 + (e.d > 1 ? d * 0.6 : 0))); osc('triangle', hz(m), n, t + 0.3 + (e.d > 1 ? d : 0)); osc('square', hz(m), env(0.004 * e.g, 0.006, 0.02, 0.15), t + 0.25); } break; }
      case 'kick': { const n = env(0.32 * e.g, 0.003, 0.01, 0.2), o = osc('sine', 130, n, t + 0.28); o.frequency.exponentialRampToValueAtTime(44, t + 0.12); break; }
      case 'snare': { const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1900; bp.Q.value = 0.7; bp.connect(env(0.12 * e.g, 0.002, 0.01, 0.13)); noise(bp, t + 0.2); const n = env(0.06 * e.g, 0.002, 0.005, 0.07); osc('triangle', 210, n, t + 0.1); break; }
      case 'hat': case 'click': { const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = e.v === 'click' ? 4500 : 7600; hp.connect(env((e.v === 'click' ? 0.08 : 0.045) * e.g, 0.002, 0.004, e.v === 'click' ? 0.05 : 0.045)); noise(hp, t + 0.08); if (e.v === 'click') osc('sine', e.g >= 1 ? 1760 : 1320, env(0.03, 0.002, 0.004, 0.05), t + 0.08); break; }
      case 'crash': { const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 3800; hp.connect(env(0.09 * e.g, 0.002, 0.02, 1.6)); noise(hp, t + 1.8, 0.01); break; }
    }
  }
}

// ---------------------------------------------------------------- checking the scores
export function checkSongs() {
  const out = [];
  for (const s of DANCES) for (const [mel, harm] of s.sections) {
    const { bars, len } = parse(mel);
    bars.forEach((b, i) => { if (Math.abs(b - s.meter) > 1e-6 && !(i === bars.length - 1 && b <= s.meter + 1e-6)) out.push(`${s.id}: bar ${i + 1} has ${b} beats`); });
    const n = harm.trim().split(/\s+/).length, want = Math.round(len / s.meter);
    if (n !== want) out.push(`${s.id}: ${n} bars of chords for ${want} bars of tune`);
  }
  return out;
}
