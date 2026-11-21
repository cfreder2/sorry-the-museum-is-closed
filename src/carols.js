// The music of the light show on Butler Field (lightshow.js): a medley of Christmas tunes, every one published before
// 1900, played note by note on the game's own audio context (nothing recorded). Each tune is written down below as its
// melody alone; the harmony is worked out here from the melody, bar by bar, and the band is laid on top: a lead and a
// glockenspiel for the tune, a plucked bass, chords on the off-beats, a soft kick, sleigh bells, and a tubular bell at
// the top of each verse. The player also says where the music is (beat, bar, which note of the tune is sounding and how
// loud), so the lights can keep time with it, whether or not anybody is near enough to hear.
//
// No three.js, no DOM: `node` can load this file, and tools can check the scores (see checkScores at the end).

// ---------------------------------------------------------------- the tunes
// A melody is a string of notes: name and octave (C4 is middle C), then :beats (a crotchet is 1; no :beats is 1).
// R is a rest. | marks the bars and is there for reading and for checkScores. `pick` is the length of the up-beat.
// `harm` is the chords, one a bar (two, split by /, for a chord a half bar): C, F#, Bb, Em... `key` is the tune's key.
export const SONGS = [
  { id: 'jingle', title: 'Jingle Bells', by: 'James Lord Pierpont, 1857', key: 'C', meter: 4, pick: 0, bpm: 136, pal: [[2.8, 0.3, 0.25], [0.4, 2.5, 0.55], [2.9, 2.0, 0.5]],
    harm: 'C C C F F G G C C C C F F G G C C C C C F C D G C C C C F C G C',
    mel: `G4 E5 D5 C5 | G4:3 G4:.5 G4:.5 | G4 E5 D5 C5 | A4:4 | A4 F5 E5 D5 | B4:4 | G5 G5 F5 D5 | E5:4 |
          G4 E5 D5 C5 | G4:4 | G4 E5 D5 C5 | A4:4 | A4 F5 E5 D5 | G5 G5 G5 G5 | A5 G5 F5 D5 | C5:2 R:2 |
          E5 E5 E5:2 | E5 E5 E5:2 | E5 G5 C5:1.5 D5:.5 | E5:4 | F5 F5 F5:1.5 F5:.5 | F5 E5 E5 E5:.5 E5:.5 | E5 D5 D5 E5 | D5:2 G5:2 |
          E5 E5 E5:2 | E5 E5 E5:2 | E5 G5 C5:1.5 D5:.5 | E5:4 | F5 F5 F5:1.5 F5:.5 | F5 E5 E5 E5:.5 E5:.5 | G5 G5 F5 D5 | C5:4` },
  { id: 'deck', title: 'Deck the Hall', by: 'Welsh air, these words 1862', key: 'F', meter: 4, pick: 0, bpm: 120, pal: [[2.9, 1.9, 0.45], [0.35, 2.3, 0.6], [2.6, 0.4, 0.3]],
    harm: 'F F C/F C/F F F C/F C/F C F/C G C F F Bb/C F',
    mel: `C5:1.5 Bb4:.5 A4 G4 | F4 G4 A4 F4 | G4:.5 A4:.5 Bb4:.5 G4:.5 A4:1.5 G4:.5 | F4 E4 F4:2 |
          C5:1.5 Bb4:.5 A4 G4 | F4 G4 A4 F4 | G4:.5 A4:.5 Bb4:.5 G4:.5 A4:1.5 G4:.5 | F4 E4 F4:2 |
          G4:1.5 A4:.5 Bb4 G4 | A4:1.5 Bb4:.5 C5 G4 | A4:.5 B4:.5 C5 D5:.5 E5:.5 F5 | E5 D5 C5:2 |
          C5:1.5 Bb4:.5 A4 G4 | F4 G4 A4 F4 | D5:.5 D5:.5 D5:.5 D5:.5 C5:1.5 Bb4:.5 | A4 G4 F4:2` },
  { id: 'wish', title: 'We Wish You a Merry Christmas', by: 'English West Country carol', key: 'G', meter: 3, pick: 1, bpm: 160, pal: [[2.8, 0.3, 0.3], [2.4, 2.4, 2.5], [0.4, 2.3, 0.6]],
    harm: 'G C A D B Em C/D G G D Em D Em G C/D G G C A D B Em C/D G',
    mel: `D4 | G4 G4:.5 A4:.5 G4:.5 F#4:.5 | E4 E4 E4 | A4 A4:.5 B4:.5 A4:.5 G4:.5 | F#4 D4 D4 | B4 B4:.5 C5:.5 B4:.5 A4:.5 | G4 E4 D4:.5 D4:.5 | E4 A4 F#4 | G4:2
          D4 | G4 G4 G4 | F#4:2 F#4 | G4 F#4 E4 | D4:2 A4 | B4 A4 G4 | D5 D4 D4:.5 D4:.5 | E4 A4 F#4 | G4:2
          D4 | G4 G4:.5 A4:.5 G4:.5 F#4:.5 | E4 E4 E4 | A4 A4:.5 B4:.5 A4:.5 G4:.5 | F#4 D4 D4 | B4 B4:.5 C5:.5 B4:.5 A4:.5 | G4 E4 D4:.5 D4:.5 | E4 A4 F#4 | G4:3` },
  { id: 'joy', title: 'Joy to the World', by: 'Isaac Watts, 1719; music arranged by Lowell Mason, 1839', key: 'D', meter: 4, pick: 0, bpm: 112, pal: [[2.9, 2.2, 0.8], [2.6, 2.6, 2.6], [2.9, 1.2, 0.3]],
    harm: 'D/A D/G D/A D G A D D A/D D A/D D D A A G/D A/D A/D',
    mel: `D5:2 C#5:1.5 B4:.5 | A4:3 G4 | F#4:2 E4:2 | D4:3 A4 | B4:3 B4 | C#5:3 C#5 | D5:3 D5 |
          D5 C#5 B4 A4 | A4:1.5 G4:.5 F#4 D5 | D5 C#5 B4 A4 | A4:1.5 G4:.5 F#4 F#4 |
          F#4 F#4 F#4 F#4:.5 G4:.5 | A4:3 G4:.5 F#4:.5 | E4 E4 E4 E4:.5 F#4:.5 | G4:3 F#4:.5 E4:.5 |
          D4 B4:2 A4 | G4:1.5 F#4:.5 G4 F#4 | E4:2 D4:2` },
  { id: 'hark', title: 'Hark! The Herald Angels Sing', by: 'Felix Mendelssohn, 1840; set by W. H. Cummings, 1855', key: 'G', meter: 4, pick: 0, bpm: 108, pal: [[0.6, 1.2, 2.9], [2.6, 2.6, 2.7], [2.9, 2.0, 0.5]],
    harm: 'G G/D G G G G/D D A/D G C/D G C/D C C D/G D/G C C D/G D/G',
    mel: `D4 G4 G4:1.5 F#4:.5 | G4 B4 B4 A4 | D5 D5 D5:1.5 C5:.5 | B4 A4 B4:2 |
          D4 G4 G4:1.5 F#4:.5 | G4 B4 B4 A4 | D5 A4 A4:1.5 F#4:.5 | F#4 E4 D4:2 |
          D5 D5 D5 G4 | C5 B4 B4 A4 | D5 D5 D5 G4 | C5 B4 B4 A4 |
          E5:1.5 E5:.5 E5 D5 | C5 B4 C5:2 | A4 B4:.5 C5:.5 D5:1.5 G4:.5 | G4 A4 B4:2 |
          E5:1.5 E5:.5 E5 D5 | C5 B4 C5:2 | A4 B4:.5 C5:.5 D5:1.5 G4:.5 | G4 A4 G4:2` },
  { id: 'tannenbaum', title: 'O Christmas Tree', by: 'Ernst Anschütz, 1824, to a folk tune', key: 'F', meter: 3, pick: 1, bpm: 104, pal: [[0.35, 2.4, 0.6], [2.9, 2.0, 0.45], [2.7, 0.35, 0.3]],
    harm: 'F F C C/F F/Bb C C F F F C C/F',
    mel: `C4 | F4:.75 F4:.25 F4:1.5 G4:.5 | A4:.75 A4:.25 A4:1.5 A4:.5 | G4:.5 A4:.5 Bb4 E4 | G4 F4 R:.5 C5:.5 |
          C5:.5 A4:.5 D5:1.5 C5:.5 | C5:.5 Bb4:.5 Bb4:1.5 Bb4:.5 | Bb4:.5 G4:.5 C5:1.5 Bb4:.5 | Bb4:.5 A4:.5 A4 C4 |
          F4:.75 F4:.25 F4:1.5 G4:.5 | A4:.75 A4:.25 A4:1.5 A4:.5 | G4:.5 A4:.5 Bb4 E4 | G4 F4:2` },
  { id: 'wenceslas', title: 'Good King Wenceslas', by: 'J. M. Neale, 1853, to a tune printed in 1582', key: 'G', meter: 4, pick: 0, bpm: 120, pal: [[1.2, 2.0, 2.9], [2.6, 2.6, 2.8], [1.7, 0.7, 2.7]],
    harm: 'G G/D C/D G G G/D C/D G G/D G C/D G G/D G/D G/D G/C G',
    mel: `G4 G4 G4 A4 | G4 G4 D4:2 | E4 D4 E4 F#4 | G4:2 G4:2 |
          G4 G4 G4 A4 | G4 G4 D4:2 | E4 D4 E4 F#4 | G4:2 G4:2 |
          D5 C5 B4 A4 | B4 A4 G4:2 | E4 D4 E4 F#4 | G4:2 G4:2 |
          D4 D4 E4 F#4 | G4 G4 A4:2 | D5 C5 B4 A4 | G4:2 C5:2 | G4:4` },
];

const PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const midiOf = n => { const m = /^([A-G])([#b]?)(-?\d)$/.exec(n); if (!m) throw new Error('bad note ' + n); return 12 * (+m[3] + 1) + PC[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0); };
// [{ m (0 for a rest), t (beats from the first note), d }], and the bars as written (for checkScores)
export function parse(mel) {
  const out = [], bars = [[]]; let t = 0;
  for (const tok of mel.split(/\s+/).filter(Boolean)) {
    if (tok === '|') { bars.push([]); continue; }
    const [n, b] = tok.split(':'), d = b ? parseFloat(b) : 1;
    out.push({ m: n === 'R' ? 0 : midiOf(n), t, d }); t += d; bars[bars.length - 1].push(d);
  }
  return { notes: out, len: t, bars: bars.map(b => b.reduce((a, c) => a + c, 0)) };
}

// ---------------------------------------------------------------- harmony
// The chords of the key (degree of the root, and the triad above it), with how readily each is reached for.
const CHORDS = [
  { r: 0, q: [0, 4, 7], w: 0.35 }, { r: 2, q: [0, 3, 7], w: 0.05 }, { r: 4, q: [0, 3, 7], w: -0.1 }, { r: 5, q: [0, 4, 7], w: 0.25 },
  { r: 7, q: [0, 4, 7], w: 0.3 }, { r: 9, q: [0, 3, 7], w: 0.1 }, { r: 2, q: [0, 4, 7], w: -0.15 },          // the last: V of V, for a raised fourth
];
function fit(notes, a, b, key, ch, meter) {
  let s = ch.w, inn = 0, all = 0;
  for (const n of notes) {
    if (!n.m || n.t >= b || n.t + n.d <= a) continue;
    const o = Math.min(b, n.t + n.d) - Math.max(a, n.t), pc = ((n.m - key - ch.r) % 12 + 12) % 12, strong = Math.abs(n.t - a) < 1e-6 ? 1.6 : (n.t - a) % (meter === 3 ? 3 : 2) < 1e-6 ? 1.2 : 1;
    const ok = ch.q.includes(pc); all += o * strong; if (ok) inn += o * strong; s += (ok ? 1 : -0.6) * o * strong;
  }
  return { s, cover: all ? inn / all : 1 };
}
// One chord per bar (or per half bar in common time, where one will not do), as { t, d, root (midi pitch class), q }
export function harmonise(notes, key, meter, t0, bars) {
  const out = [];
  for (let i = 0; i < bars; i++) {
    const a = t0 + i * meter, b = a + meter, last = i === bars - 1, pen = i === bars - 2;
    const pick = (a, b) => {
      if (last) return CHORDS[0];
      let best = null, bs = -1e9; for (const ch of CHORDS) { let { s } = fit(notes, a, b, key, ch, meter); if (pen && ch.r === 7 && ch.q[1] === 4) s += 0.6; if (out.length && out[out.length - 1].ch === ch) s += 0.15; if (s > bs) { bs = s; best = ch; } }
      return best;
    };
    const one = pick(a, b);
    if (meter === 4 && !last && fit(notes, a, b, key, one, meter).cover < 0.7) { const h = a + 2; out.push({ t: a, d: 2, ch: pick(a, h) }); out.push({ t: h, d: 2, ch: pick(h, b) }); }
    else out.push({ t: a, d: meter, ch: one });
  }
  return out.map(c => ({ t: c.t, d: c.d, root: (key + c.ch.r) % 12, q: c.ch.q }));
}

// A chord chart, as harmonise gives it: 'G C/D G' is a bar of G, half a bar of C and half of D, a bar of G.
export function chart(str, meter) {
  const out = []; let t = meter;
  for (const bar of str.trim().split(/\s+/)) {
    const parts = bar.split('/'), d = meter / parts.length;
    for (const p of parts) {
      const m = /^([A-G])([#b]?)(m?)$/.exec(p); if (!m) throw new Error('bad chord ' + p);
      out.push({ t, d, root: (PC[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + 12) % 12, q: m[3] ? [0, 3, 7] : [0, 4, 7] }); t += d;
    }
  }
  return out;
}

// ---------------------------------------------------------------- the band
// Everything a tune will play, in beats from the top of its count-in bar: [{ t, d, v (voice), m (midi), g (0..1) }].
// One bar of sleigh bells to count in; the tune; one bar to let the last chord ring.
export function arrange(song) {
  const { notes, len } = parse(song.mel), meter = song.meter, key = PC[song.key[0]] + (song.key[1] === '#' ? 1 : song.key[1] === 'b' ? -1 : 0);
  const t0 = meter - song.pick;                       // the first note: the up-beat falls at the end of the count-in bar
  const bars = Math.ceil((t0 + len - meter) / meter - 1e-6);
  const harm = song.harm ? chart(song.harm, meter) : harmonise(notes.map(n => ({ ...n, t: n.t + t0 })), key, meter, meter, bars);
  const total = meter * (bars + 2), ev = [];
  const near = (pc, lo) => { let m = lo + ((pc - lo) % 12 + 12) % 12; return m; };
  const mel = notes.filter(n => n.m).map(n => ({ t: n.t + t0, d: n.d, m: n.m }));
  const second = t0 + len / 2;
  for (const n of mel) {
    ev.push({ t: n.t, d: n.d, v: 'lead', m: n.m, g: 1 });
    if (n.t >= second) ev.push({ t: n.t, d: n.d, v: 'glock', m: n.m + 12, g: 0.8 });       // the glockenspiel joins for the second half
  }
  for (const c of harm) {
    const root = near(c.root, 40), fifth = root + 7, triad = c.q.map(q => near((c.root + q) % 12, 55));
    for (let b = 0; b < c.d - 1e-6; b++) {
      const t = c.t + b, beatInBar = Math.round(((t - meter) % meter) * 2) / 2;
      if (meter === 3) {
        if (beatInBar === 0) { ev.push({ t, d: 1, v: 'bass', m: root, g: 1 }); ev.push({ t, d: 0.3, v: 'kick', g: 1 }); }
        else ev.push({ t, d: 0.5, v: 'chord', m: triad, g: beatInBar === 1 ? 1 : 0.8 });
      } else {
        if (b === 0) ev.push({ t, d: Math.min(2, c.d), v: 'bass', m: root, g: 1 });
        else if (b === 2) ev.push({ t, d: 2, v: 'bass', m: fifth > 52 ? fifth - 12 : fifth, g: 0.85 });
        if (beatInBar % 2 === 0) ev.push({ t, d: 0.3, v: 'kick', g: beatInBar === 0 ? 1 : 0.7 });
        ev.push({ t: t + 0.5, d: 0.4, v: 'chord', m: triad, g: beatInBar % 2 ? 1 : 0.7 });
      }
    }
  }
  const step = meter === 3 ? 1 : 0.5;                 // sleigh bells: quavers in common time, crotchets in a waltz
  for (let t = 0; t < total - meter; t += step) ev.push({ t, d: 0.1, v: 'shake', g: (t % 1 === 0 ? 1 : 0.55) * (t < meter ? 0.7 : 1) });
  for (let b = 1; b <= bars; b += 4) ev.push({ t: b * meter, d: 3, v: 'bell', m: near(key, 72), g: b === 1 ? 1 : 0.6 });
  const end = meter * (bars + 1);
  ev.push({ t: end, d: meter, v: 'bell', m: near(key, 60), g: 1 }, { t: end, d: meter, v: 'bass', m: near(key, 40), g: 1 });
  ev.sort((a, b) => a.t - b.t);
  return { song, ev, mel, harm, total, meter, spb: 60 / song.bpm, t0, bars };
}

// ---------------------------------------------------------------- the player
const hz = m => 440 * Math.pow(2, (m - 69) / 12);
export class CarolPlayer {
  constructor() {
    this.tunes = SONGS.map(arrange);
    this.i = 0; this.start = null; this.base = null; this.next = 0; this.out = null; this.ctx = null;
    // where the music is, for the lights (filled by sync)
    this.S = { beat: 0, ph: 0, kick: 0, bar: 0, barN: 0, note: 0, hue: 0, pitch: 0, dark: 0, flash: 0, song: 0, beats: 0, live: 0, pal: this.tunes[0].song.pal, title: '' };
  }
  get tune() { return this.tunes[this.i]; }
  // The clock: the audio context's when there is one, else the page's. The medley runs on whether or not it is heard.
  _now(sound) {
    const c = sound && sound.ctx, live = !!(c && c.state === 'running'), base = live ? 'ctx' : 'page', now = live ? c.currentTime : performance.now() / 1000;
    if (base !== this.base) { this.base = base; this.start = now + 0.2; this.next = 0; }
    return now;
  }
  // Once a frame. `level` is how loud it should be (0 silent: then nothing is scheduled, but the clock still runs).
  update(sound, level) {
    const now = this._now(sound);
    let beat = (now - this.start) / this.tune.spb;
    while (beat >= this.tune.total) { this.start += this.tune.total * this.tune.spb; this.i = (this.i + 1) % this.tunes.length; this.next = 0; beat = (now - this.start) / this.tune.spb; }
    this._sync(beat);
    const c = sound && sound.ctx;
    if (!c || c.state !== 'running' || !sound.dry) { this.S.live = 0; return; }
    if (!this.out || this.ctx !== c) {
      this.ctx = c; this.out = c.createGain(); this.out.gain.value = 0;
      const wet = c.createGain(); wet.gain.value = 0.18; this.out.connect(sound.dry); this.out.connect(wet); wet.connect(sound.send || sound.dry);
    }
    this.out.gain.setTargetAtTime(level, now, 0.3);
    this.S.live = level;
    if (level < 0.002) { this.next = Math.max(this.next, beat + 0.5); return; }       // nothing scheduled while it cannot be heard
    // Lay notes down a third of a second ahead.
    const T = this.tune, ahead = beat + 0.35 / T.spb, ev = T.ev;
    let i = this._cursor(ev, this.next);
    for (; i < ev.length && ev[i].t < ahead; i++) {
      const e = ev[i]; if (e.t < this.next) continue;
      const when = this.start + e.t * T.spb; if (when < now - 0.02) continue;
      this._play(sound, e, Math.max(when, now), T.spb);
    }
    this.next = ahead;
  }
  _cursor(ev, t) { let lo = 0, hi = ev.length; while (lo < hi) { const m = (lo + hi) >> 1; if (ev[m].t < t) lo = m + 1; else hi = m; } return lo; }
  // Beat, bar, the note of the tune now sounding, the dark of the count-in and the flash at the first downbeat.
  _sync(beat) {
    const T = this.tune, S = this.S, b = Math.max(0, beat), m = T.meter, spb = T.spb, f = b - Math.floor(b);
    S.beat = b; S.ph = f; S.kick = Math.exp(-f * spb * 7); S.barN = Math.floor(b / m); S.bar = Math.exp(-((b % m) * spb) * 3);
    S.song = this.i; S.beats = T.total; S.pal = T.song.pal; S.title = T.song.title;
    S.dark = b < m ? 1 : b > T.total - 0.5 ? 1 : 0;                                       // the count-in: everything waits in the dark
    S.flash = b >= m ? Math.exp(-(b - m) * spb * 1.6) : 0;
    let lo = 0, hi = T.mel.length - 1, k = -1; while (lo <= hi) { const md = (lo + hi) >> 1; if (T.mel[md].t <= b) { k = md; lo = md + 1; } else hi = md - 1; }
    if (k >= 0) { const n = T.mel[k], age = (b - n.t) * spb, on = b < n.t + n.d; S.note = on ? Math.exp(-age * 2.5) * 0.7 + 0.3 : Math.max(0, 0.3 - (b - n.t - n.d) * spb); S.pitch = n.m; S.hue = (n.m % 12) / 12; }
    else { S.note = 0; }
  }
  // ---- the voices
  _play(sound, e, t, spb) {
    const c = this.ctx, out = this.out, d = e.d * spb;
    const env = (g, a, hold, rel) => { const n = c.createGain(); n.gain.setValueAtTime(0, t); n.gain.linearRampToValueAtTime(g, t + a); if (hold > a) n.gain.setValueAtTime(g, t + hold); n.gain.exponentialRampToValueAtTime(0.0005, t + hold + rel); n.connect(out); return n; };
    const osc = (type, f, to, end, det = 0) => { const o = c.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t); o.detune.value = det; o.connect(to); o.start(t); o.stop(end); return o; };
    switch (e.v) {
      case 'lead': {          // a bright reed: two saws a hair apart through a soft filter, and a sine an octave down
        const f = hz(e.m), n = env(0.05 * e.g, 0.012, Math.max(0.05, d * 0.85), 0.12), lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(3200, t); lp.frequency.exponentialRampToValueAtTime(1500, t + Math.max(0.1, d)); lp.Q.value = 0.7; lp.connect(n);
        const end = t + d + 0.2; osc('sawtooth', f, lp, end, -6); osc('sawtooth', f, lp, end, 6); const sub = c.createGain(); sub.gain.value = 0.9; sub.connect(n); osc('triangle', f / 2, sub, end);
        break;
      }
      case 'glock': {         // metal bars: a sine and its bright, short overtones
        const f = hz(e.m);
        for (const [mul, g, dec] of [[1, 1, 1.1], [2.76, 0.35, 0.35], [5.4, 0.12, 0.15]]) { const n = env(0.045 * e.g * g, 0.004, 0.004, dec); osc('sine', f * mul, n, t + dec + 0.05); }
        break;
      }
      case 'bass': { const f = hz(e.m), n = env(0.16 * e.g, 0.01, 0.02, Math.min(1.6, d * 0.9 + 0.2)); osc('sine', f, n, t + d + 0.3); const h = c.createGain(); h.gain.value = 0.35; h.connect(n); osc('triangle', f * 2, h, t + d + 0.3); break; }
      case 'chord': { for (const m of e.m) { const n = env(0.022 * e.g, 0.008, 0.02, 0.32); osc('triangle', hz(m), n, t + 0.4); } break; }
      case 'kick': { const n = env(0.3 * e.g, 0.004, 0.01, 0.22), o = osc('sine', 120, n, t + 0.3); o.frequency.exponentialRampToValueAtTime(42, t + 0.14); break; }
      case 'shake': {
        if (!sound.noise) break;
        const s = c.createBufferSource(), bp = c.createBiquadFilter(), n = env(0.06 * e.g, 0.003, 0.01, 0.07);
        s.buffer = sound.noise; bp.type = 'highpass'; bp.frequency.value = 6800; s.connect(bp); bp.connect(n); s.start(t, Math.random() * 1.5); s.stop(t + 0.12);
        break;
      }
      case 'bell': {          // a tubular bell: inharmonic partials, long ring
        const f = hz(e.m);
        for (const [mul, g, dec] of [[1, 1, 3.2], [2.0, 0.5, 2.2], [3.0, 0.25, 1.4], [4.2, 0.18, 0.9], [5.4, 0.1, 0.5]]) { const n = env(0.05 * e.g * g, 0.005, 0.005, dec); osc('sine', f * mul, n, t + dec + 0.05); }
        break;
      }
    }
  }
}

// ---------------------------------------------------------------- checking the scores
// Every bar adds up to the metre (the first may be the up-beat, the last may be short). Returns a list of problems.
export function checkScores() {
  const out = [];
  for (const s of SONGS) {
    const { bars } = parse(s.mel);
    bars.forEach((b, i) => {
      const okFirst = i === 0 && s.pick && Math.abs(b - s.pick) < 1e-6, okLast = i === bars.length - 1 && b <= s.meter + 1e-6;
      if (Math.abs(b - s.meter) > 1e-6 && !okFirst && !okLast) out.push(`${s.id}: bar ${i + 1} has ${b} beats`);
    });
    const a = arrange(s), n = s.harm ? s.harm.trim().split(/\s+/).length : a.bars;
    if (n !== a.bars) out.push(`${s.id}: ${n} bars of chords for ${a.bars} bars of tune`);
  }
  return out;
}
