// The monkey's show: what touching the part of the picture starts, the first time (src/secret.js asks for it; the figures
// are the living picture's own, put through it by src/l2-grandejatte.js, on the floor in front of the picture, never on it).
//
// The monkey jumps down out of the frame and five figures stand in a line: the lady with the parasol, her gentleman, the girl
// in white, the little dog and, last, the monkey itself. One at a time each steps forward and turns once round on its toes,
// and bows. Press E (a pad's A, NOW on glass, or a finger anywhere on the screen) at the top of the turn, before the bow: a
// marker sweeps the bar at the foot of the screen, and the top of the turn is the gold. A hit plays that figure's note of the
// five-note call (src/motif.js: the craft's call, which the ending answers) and it holds its pose; a miss and it stumbles,
// the monkey chatters, and the same figure goes again, the gold a little wider: no starting over, no clock, no way to lose.
// All five: they bow together to the whole call, the monkey tugs its lead, the figures go back into the picture and the
// wall turns (src/secret.js, find()). Stepping back from the picture (Esc, a pad's B, BACK) ends it; touch again to start
// again. Reduce motion: everything slower, the stumbles gentle, nothing flashes and the camera never moves.
//
// The tuning, for the owner to change: SPIN, the seconds each figure's turn takes; WIN, its gold as a share of the bar; TOP,
// where along the bar the top of the turn is (the figure faces you again just there). A press is judged at the middle of the
// frame it came in, with GRACE seconds allowed either side of the gold; each miss widens that figure's gold by WIDEN.
import { MOTIF, motifVoice, playMotif } from './motif.js';

export const SPIN = [1.5, 1.35, 1.2, 1.05, 0.9], WIN = [0.22, 0.19, 0.17, 0.15, 0.13], TOP = 0.8, GRACE = 0.035, WIDEN = 1.25;
const CALM = 1.6;                                                          // Reduce motion: this much slower
const T_INTRO = 2.4, T_STEP = 0.45, T_HOLD = 0.5, T_BOW = 0.75, T_MISS = 1.4, T_ALL = 2.3, T_TUG = 1.2, T_HOME = 1.0;
export const CAST = ['The lady with the parasol', 'Her gentleman', 'The girl in white', 'The little dog', 'The monkey'];

let css = false;
const CSS = `
#promenade { position: fixed; left: 50%; bottom: max(16px, env(safe-area-inset-bottom)); transform: translateX(-50%); width: min(520px, calc(100vw - 32px)); pointer-events: none; z-index: 12; font: 15px/1.3 Georgia, 'Times New Roman', serif; color: #f4ecd6; text-align: center; transition: opacity .3s; text-shadow: 0 1px 3px #000; }
#promenade[hidden] { display: none; }
#promenade .cap { margin-bottom: 7px; min-height: 1.3em; }
#promenade .cap b { font-weight: normal; font-style: italic; margin-right: .6em; }
#promenade .cap span { font: 12px/1.3 ui-monospace, Menlo, monospace; letter-spacing: .04em; color: #e8d9a8; }
#promenade .bar { position: relative; height: 18px; border-radius: 9px; background: rgba(12,11,16,.78); border: 1px solid rgba(236,223,180,.55); overflow: hidden; }
#promenade .bar .gold { position: absolute; top: 0; bottom: 0; background: linear-gradient(#f3d77a, #c9a03c); }
#promenade .bar .mark { position: absolute; top: -2px; bottom: -2px; width: 4px; margin-left: -2px; background: #fff; box-shadow: 0 0 6px rgba(255,255,255,.8); }
#promenade.calm .bar .mark { box-shadow: none; }
#promenade .pips { margin-top: 7px; display: flex; justify-content: center; gap: 10px; }
#promenade .pips i { width: 11px; height: 11px; border-radius: 50%; border: 1.5px solid rgba(236,223,180,.6); box-sizing: border-box; }
#promenade .pips i.now { border-color: #fff; }
@media (max-width: 1100px) and (min-height: 521px) { #promenade { bottom: calc(max(18px, env(safe-area-inset-bottom)) + 56px); width: min(440px, calc(100vw - 32px)); } }      /* (a narrow screen: over the bar of buttons under a look) */
@media (max-height: 520px) { #promenade { left: auto; right: calc(max(18px, env(safe-area-inset-right)) + 254px); transform: none; bottom: max(18px, env(safe-area-inset-bottom)); width: min(340px, calc(100vw - 300px)); text-align: left; }
  #promenade .cap { font-size: 13px; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; } #promenade .bar { height: 14px; } #promenade .pips { display: none; } }      /* (a phone on its side: low, just left of the buttons, under the figures on the floor) */
`;

export class Promenade {
  // S: the secret (src/secret.js). stage: the living picture (src/l2-grandejatte.js), which draws everyone.
  constructor(S, stage) {
    this.S = S; this.stage = stage; this.G = S.G; this.calm = !!(this.G.set && this.G.set.reduce);
    this.i = 0; this.phase = 'intro'; this.pt = 0; this.spin = 0; this.top = TOP; this.done = [false, false, false, false, false]; this.wide = [1, 1, 1, 1, 1];
    this.misses = 0; this.log = []; this.said = ''; this.pressed = false; this.cast = CAST;
    this._ui();
    stage.promenade(this);
    this.log.push(['start', +S.t.toFixed(2)]);
  }
  get slow() { return this.calm ? CALM : 1; }
  get T() { return SPIN[this.i] * this.slow; }                             // this figure's turn, in seconds
  get W() { return Math.min(0.4, WIN[this.i] * this.wide[this.i]); }       // its gold, a share of the bar
  get stepT() { return T_STEP * this.slow; }
  get bowT() { return T_BOW * this.slow; }
  // The button (judged in update, at the middle of the frame it came in).
  press() { this.pressed = true; }
  _go(phase) { this.phase = phase; this.pt = 0; if (phase === 'spin') { this.spin = 0; this._swish(); } }
  update(dt) {
    if (!this.S.live) { this.end(false); return; }
    this.pt += dt;
    const s = this.slow, pressed = this.pressed; this.pressed = false;
    switch (this.phase) {
      case 'intro': if (this.pt >= T_INTRO * s) this._go('step'); break;
      case 'step': if (this.pt >= T_STEP * s) this._go('spin'); break;
      case 'spin': {
        this.spin = this.pt / this.T;
        if (pressed) this._judge(Math.max(0, (this.pt - dt / 2) / this.T));
        else if (this.spin >= 1) this._miss('late', 1);
        break;
      }
      case 'hit': if (this.pt >= T_HOLD * s) { if (this.i === 4) { this._go('all'); this._call(); } else this._go('bow'); } break;
      case 'bow': if (this.pt >= T_BOW * s) { this.i++; this._go('step'); } break;
      case 'miss': if (this.pt >= T_MISS * s) this._go('step'); break;
      case 'all': if (this.pt >= T_ALL * s) { this._go('tug'); this._tug(); } break;
      case 'tug': if (this.pt >= T_TUG * s) this._go('home'); break;
      case 'home': if (this.pt >= T_HOME * s) { this.end(true); return; } break;
    }
    this._draw();
  }
  _judge(m) {
    const g = GRACE / this.T, lo = TOP - this.W / 2 - g, hi = TOP + this.W / 2 + g;
    if (m >= lo && m <= hi) this._hit(m); else this._miss(m < lo ? 'soon' : 'late', m);
  }
  _hit(m) {
    this.done[this.i] = true; this.spin = m; this.log.push(['hit', this.i, +m.toFixed(3), +this.S.t.toFixed(2)]);
    const o = this._out(); if (o) motifVoice(o.c, o.out, MOTIF[this.i].midi, o.c.currentTime + 0.01, MOTIF[this.i].beats * 0.42, 0.08);
    this._go('hit'); this.said = 'Held.';
  }
  _miss(why, m) {
    this.misses++; this.wide[this.i] = Math.min(1.8, this.wide[this.i] * WIDEN); this.log.push(['miss', this.i, why, +m.toFixed(3), +this.S.t.toFixed(2)]);
    this._go('miss'); this.said = why === 'soon' ? 'Too soon. Again.' : 'Too late. Again.';
    this._bwoop(); if (this.stage.chatter) this.stage.chatter(this.stage.k, 0.035);
  }
  // Over. Won: the wall turns (find). Not: everybody back into the picture, and it can be started again.
  end(won) {
    if (this.over) return; this.over = true;
    this.log.push([won ? 'won' : 'left', +this.S.t.toFixed(2)]);
    if (this.el) this.el.hidden = true;
    this.stage.promenade(null, won);
    this.S.game = null; this.S.lastGame = this;
    if (won) this.S.find();
  }

  // ---- the bar at the foot of the screen ----
  _ui() {
    if (!css) { css = true; const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st); }
    let el = document.getElementById('promenade');
    if (!el) {
      el = document.createElement('div'); el.id = 'promenade'; el.setAttribute('role', 'status'); el.setAttribute('aria-live', 'polite');
      el.innerHTML = '<div class="cap"><b></b><span></span></div><div class="bar"><i class="gold"></i><i class="mark"></i></div><div class="pips">' + '<i></i>'.repeat(5) + '</div>';
      document.body.appendChild(el);
    }
    this.el = el; el.hidden = false; el.classList.toggle('calm', this.calm); el.style.opacity = '0';
    this.$ = { who: el.querySelector('.cap b'), how: el.querySelector('.cap span'), gold: el.querySelector('.gold'), mark: el.querySelector('.mark'), pips: [...el.querySelectorAll('.pips i')], bar: el.querySelector('.bar') };
    this.key = '';
  }
  _draw() {
    const $ = this.$, ph = this.phase, G = this.G, key = G.input && G.input.pad ? 'X' : G.input && G.input.usedTouch ? 'NOW' : 'E';
    const show = ph !== 'intro' || this.pt > 1.6 * this.slow, gone = ph === 'tug' || ph === 'home';
    this.el.style.opacity = gone ? '0' : show ? '1' : '0';
    const who = ph === 'all' ? 'All five.' : this.cast[this.i], how = ph === 'intro' ? 'The monkey wants a show.' : ph === 'hit' || ph === 'miss' ? this.said : ph === 'all' ? '' : `${key} at the top of the turn`;
    const k = who + '|' + how;
    if (k !== this.key) { this.key = k; $.who.textContent = who; $.how.textContent = how; }
    const W = this.W; if (W !== this.lastW) { this.lastW = W; $.gold.style.left = ((TOP - W / 2) * 100).toFixed(2) + '%'; $.gold.style.width = (W * 100).toFixed(2) + '%'; }
    const mk = (Math.max(0, Math.min(1, ph === 'spin' || ph === 'hit' || ph === 'miss' ? this.spin : 0)) * 100).toFixed(1) + '%'; if (mk !== this.lastMk) { this.lastMk = mk; $.mark.style.left = mk; }
    $.pips.forEach((p, i) => { const c = this.done[i] ? MOTIF[i].colour : 'transparent'; if (p.style.background !== c) p.style.background = c; p.classList.toggle('now', i === this.i && !this.done[i]); });
  }

  // ---- sounds: the game's own ----
  _out() {
    const s = this.G.sound, c = s && s.ctx; if (!c || c.state !== 'running' || !s.dry) return null;
    if (!this.bus || this.bus.context !== c) { this.bus = c.createGain(); this.bus.connect(s.dry); const w = c.createGain(); w.gain.value = 0.5; this.bus.connect(w); w.connect(s.send); }
    return { s, c, out: this.bus };
  }
  // A soft swish, rising to the top of the turn.
  _swish() {
    const o = this._out(); if (!o) return; const { s, c, out } = o, t = c.currentTime, up = this.T * TOP;
    const n = c.createBufferSource(); n.buffer = s.noise; n.loop = true; const f = c.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 3; f.frequency.setValueAtTime(500, t); f.frequency.exponentialRampToValueAtTime(2400, t + up);
    const e = c.createGain(); e.gain.setValueAtTime(0, t); e.gain.linearRampToValueAtTime(0.03, t + up * 0.8); e.gain.linearRampToValueAtTime(0, t + up + 0.15);
    n.connect(f); f.connect(e); e.connect(out); n.start(t, Math.random()); n.stop(t + up + 0.2);
  }
  // A stumble: a little falling slide.
  _bwoop() {
    const o = this._out(); if (!o) return; const { c, out } = o, t = c.currentTime, os = c.createOscillator(), e = c.createGain();
    os.type = 'triangle'; os.frequency.setValueAtTime(420, t); os.frequency.exponentialRampToValueAtTime(130, t + 0.32);
    e.gain.setValueAtTime(0.06, t); e.gain.exponentialRampToValueAtTime(0.0001, t + 0.38); os.connect(e); e.connect(out); os.start(t); os.stop(t + 0.4);
  }
  // All five: the whole call, as they bow.
  _call() { const o = this._out(); if (o) playMotif(o.c, o.out, o.c.currentTime + 0.15, { beat: 0.36, gain: 0.07 }); }
  // The lead pulled twice, and something in the wall lets go.
  _tug() {
    const s = this.G.sound, k = this.slow;
    setTimeout(() => s.creak(), 420 * k); setTimeout(() => s.creak(), 720 * k); setTimeout(() => s.bump(3), 1050 * k);
  }
}
