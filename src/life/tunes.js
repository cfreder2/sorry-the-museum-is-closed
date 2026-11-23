// Music for the lives in this folder: a phrase of a piece published before 1900, written out note by note, played on the
// work's own voice (L.voice(), so it is placed at the work and louder the nearer you are), scheduled a little ahead of
// the audio clock and looped for as long as the show wants it. Nothing is made until the sound has been started.
//
//   const p = looper(L.voice(), [[0, 'G#3', 1], [1, 'C#4', 1], ...], { len: 48, step: 0.3, type: 'sine', vol: 0.02 });
//   p.run(on, level, note => 1)   each frame: on false stops scheduling (what is already scheduled finishes);
//                                 note(event) may return a factor for that note's pitch (2: an octave up)
//   p.reset()                     back to the top next time it runs
//
// Each event: [at (steps from the top), note ('C#4', middle C is C4) or Hz, length (steps), loudness (default 1)].

const NAMES = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
export function hz(n) {
  if (typeof n === 'number') return n;
  const m = /^([A-G])(#|b)?(-?\d)$/.exec(n); if (!m) throw new Error('note ' + n);
  const midi = 12 * (+m[3] + 1) + NAMES[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function looper(voice, seq, { len, step = 0.25, type = 'sine', vol = 0.02, attack = 0.01, ring = 1, partial = 0 } = {}) {
  const ev = seq.map(([at, n, d, v = 1]) => ({ at, f: hz(n), d, v })).sort((a, b) => a.at - b.at);
  return {
    t0: null, i: 0, k: 0,
    reset() { this.t0 = null; this.i = 0; this.k = 0; },
    run(on, level = 1, pitch = null) {
      const c = voice.ctx; if (!c) return;
      if (!on || level <= 0.001) { this.t0 = null; return; }
      if (this.t0 == null) { this.t0 = c.currentTime + 0.06 - (this.k * len + (ev[this.i] ? ev[this.i].at : 0)) * step; }
      for (let guard = 0; guard < 64; guard++) {
        const e = ev[this.i], when = this.t0 + (this.k * len + e.at) * step;
        if (when > c.currentTime + 0.25) break;
        if (when > c.currentTime - 0.05) {
          const f = e.f * (pitch ? pitch(e) || 1 : 1), dur = Math.max(0.12, e.d * step * ring), at = Math.max(0, when - c.currentTime), v = vol * e.v * level;
          voice.note(f, dur, { at, vol: v, type, attack });
          if (partial) voice.note(f * 4, Math.min(dur, 0.35), { at, vol: v * partial, type: 'sine', attack: 0.004 });
        }
        if (++this.i >= ev.length) { this.i = 0; this.k++; }
      }
    },
  };
}
