// The craft's call: five notes, our own. It rises (D, G, B), turns (A), and falls to a held E that never quite
// comes home: a question asked of the sky. It is not any film's theme and copies none.
//
// Everything that plays or asks for the call uses this one list: the tone console in the base (phase 3, the
// Simon-style echo), the saucer's music in space and on the Moon (src/cosmicmusic.js), the credits. Each note has
// its own colour and pad, in order, so the console, the rim lights and the art can all answer in the same colours.
//
// No three.js and no DOM here: it runs anywhere.

export const MOTIF = Object.freeze([
  Object.freeze({ midi: 62, beats: 1, name: 'D', colour: '#4fc8ff', pad: 0 }),       // ice blue
  Object.freeze({ midi: 67, beats: 1, name: 'G', colour: '#6dff9e', pad: 1 }),       // green
  Object.freeze({ midi: 71, beats: 1, name: 'B', colour: '#ffe35c', pad: 2 }),       // yellow
  Object.freeze({ midi: 69, beats: 1, name: 'A', colour: '#ff8a4c', pad: 3 }),       // orange
  Object.freeze({ midi: 64, beats: 3, name: 'E', colour: '#d78cff', pad: 4 }),       // violet, held
]);
export const MOTIF_BEATS = Object.freeze(MOTIF.map(n => n.beats));        // [1, 1, 1, 1, 3]
export const MOTIF_COLOURS = Object.freeze(MOTIF.map(n => n.colour));
export const hz = m => 440 * Math.pow(2, (m - 69) / 12);

/** When each note starts and how long it lasts, in seconds, at `beat` seconds a beat: [{ i, midi, t, dur }]. */
export function motifTimes(beat = 0.42, transpose = 0) {
  let t = 0;
  return MOTIF.map((n, i) => { const o = { i, midi: n.midi + transpose, t, dur: n.beats * beat }; t += n.beats * beat; return o; });
}


// One note of the call, in the craft's own voice: a glassy tone (a sine and a soft triangle a fifth-and-octave up,
// fading in quickly and ringing out), sent to `out` (any AudioNode). Returns when it has finished sounding.
export function motifVoice(ctx, out, midi, when, dur, gain = 0.06) {
  const t = Math.max(when, ctx.currentTime), f = hz(midi), end = t + dur + 0.9;
  const e = ctx.createGain();
  e.gain.setValueAtTime(0, t); e.gain.linearRampToValueAtTime(gain, t + 0.025);
  e.gain.setTargetAtTime(gain * 0.62, t + 0.06, 0.25);
  e.gain.setValueAtTime(gain * 0.62, t + dur); e.gain.setTargetAtTime(0.0001, t + dur, 0.28);
  e.connect(out);
  for (const [mult, type, g, det] of [[1, 'sine', 1, 0], [1, 'triangle', 0.18, 6], [3, 'sine', 0.06, -4], [2, 'sine', 0.12, 3]]) {
    const o = ctx.createOscillator(), og = ctx.createGain();
    o.type = type; o.frequency.value = f * mult; o.detune.value = det;
    // a slow shimmer on the held note
    if (dur > 0.8 && mult === 1) { const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = 5.2; lg.gain.value = 4; l.connect(lg); lg.connect(o.detune); l.start(t + 0.3); l.stop(end); }
    og.gain.value = g; o.connect(og); og.connect(e); o.start(t); o.stop(end);
  }
  return end;
}

/** The whole call from `when`. Returns the time it ends. */
export function playMotif(ctx, out, when, { beat = 0.42, gain = 0.06, transpose = 0, onNote = null } = {}) {
  let last = when;
  for (const n of motifTimes(beat, transpose)) {
    last = motifVoice(ctx, out, n.midi, when + n.t, n.dur, gain);
    if (onNote) { const ms = Math.max(0, (when + n.t - ctx.currentTime) * 1000); setTimeout(() => onNote(n.i), ms); }
  }
  return last;
}
