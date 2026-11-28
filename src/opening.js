// The opening of a new game, seen through the eyes of the child who will drive the toy. Her bedroom, high over Monroe
// Street; the holiday lights on Butler Field below, and the museum beyond them. She sees lights that are not Christmas
// lights, and penguins, and nobody will look. Told a line at a time, typed in a box along the bottom, a key's click to every
// other letter and the wah-wah of whoever is speaking under it: a click, a tap, a key or the A button brings the next.
// Then bed: her lamp clicks off, the television, the light in the hall, and the room is lit by the string of bulbs
// round her window and the colours of the show in the park. She takes the handset and the car from her bookcase,
// tiptoes out by the door, and (the stairs, the snow) comes back to the window: her breath on the glass, the handset
// in her mittens, the toy waking in the snow below. It pulls away, and we go with it: out through the glass, down past
// it, up over the lights and the park and the roofs of the museum, and round to the steps behind the toy, which is yours.
//
// Nobody is ever seen in the room: her parents are voices from along the hall. What is said comes in a box along the
// bottom with the speaker's name on it and, for her mother, her father and the television, a small drawn head that
// talks while the line is typed. Her own lines have no head: they are yours.
//
// New games only (main.js decides: never on Continue, never with ?mode, ?voyage or ?noopen). The Skip button, Escape or
// a pad's Start hands the toy over at once. With Reduce motion the camera cuts instead of moving and the lines are not
// typed.
//
//   const opening = new Opening(G, { THREE, scene, camera, sound });
//   opening.begin(done)      starts it; done(seconds it took) once control is handed over (or at once if it cannot run)
//   opening.frame(dt)        each frame while G.state === 'opening'
//   opening.advance()        what a click does
//   opening.seek(phase, t)   (tests) stop the clock at t seconds of 'night' or 'fly', or at card t of 'room'
//
// The set is src/openingset.js, the sounds src/openingsound.js.

import { buildSet, DOORWAY } from './openingset.js';
import { OpeningSound } from './openingsound.js';
import { flyWarm } from './flywarm.js';

const ease = t => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
const lerp = (a, b, t) => a + (b - a) * t;
const span = (t, a, b) => ease((t - a) / (b - a));
const TAU = Math.PI * 2;

// Where she lives: a flat across Monroe Street from the lights, eight floors up, its window looking south-west.
const EYE = [415, 25, -50], AIM = [290, 4, 55];
const TREE = [352, 12, -3], STAR = [352, 21.5, -3], INTO = [240, 11, 8];      // the Singing Tree; where the lights go in
const MUSEUM = [234, 9, 12];
const PENGUINS = { x: 371, z: -8 };
const CAR = { x: 389.5, z: -21.5, to: [352, -5] };                                // where she sets the toy down, and the way it leaves
const GLOWS = [[241, 9, 8, 15], [238, 14, 22, 12], [224, 14, -10, 14], [206, 16, -10, 12], [240, 5, -3, 10], [226, 20, 8, 46]];

// What is said. who: me (the child), mom, dad, tv. A card is a click's worth.
const CARDS = [
  { view: 'room', pre: 1.5, lines: [
    { who: 'tv', text: '…and the Art Institute stays closed tonight for renovations. Now, the weather…' },
    { who: 'me', text: 'Hey, Mom, there are lights.', view: 'lights' },
    { who: 'mom', text: 'Don’t be silly, honey. There are no lights.' }] },
  { view: 'show', lines: [
    { who: 'dad', text: 'Yeah, it’s just the Christmas lights across the street. Don’t scare your baby sister.' }] },
  { view: 'penguin', pre: 2.2, lines: [
    { who: 'me', text: 'Mom, I’m serious, there are penguins in the park.' },
    { who: 'mom', text: 'That’s crazy, honey. There are no penguins in Chicago, right?' }] },
  { view: 'penguin2', lines: [
    { who: 'me', text: 'No, Mom, I swear. Look.' },
    { who: 'mom', text: 'I’m not going to look, honey. Stop joking around and put on your pajamas.' }] },
  { view: 'door', lines: [
    { who: 'dad', text: 'Stop bothering your mother. It’s time for bed.' },
    { who: 'me', text: 'But….', view: 'show' },
    { who: 'dad', text: 'Don’t make me count to ten.' }] },
  { view: 'orbs', pre: 6.6, on: '_lightsGo', lines: [
    { who: 'me', text: 'Dad, the lights went into the museum. I want to go to the museum and see what’s happening.' },
    { who: 'dad', text: 'Sorry, honey, the museum is closed.' }] },
  { view: 'museum', lines: [
    { who: 'me', text: 'Why is it closed?' },
    { who: 'mom', text: 'I don’t know, honey, it’s just closed. We can talk about this tomorrow.' },
    { who: 'dad', note: 'mutters', text: 'The news said it’s closed for renovations.' }] },
  { view: 'museum2', pre: 3.4, on: '_flash', lines: [      // (pre: the museum's five notes are heard out before she speaks)
    { who: 'me', text: 'But Mom, I swear something is happening at the museum. Did you hear that?' },
    { who: 'mom', text: 'Honey, those are the Christmas lights.' },
    { who: 'dad', text: 'It’s time for bed.' }] },
  { view: 'room', pre: 0.9, lines: [{ who: 'me', text: 'Fine.' }] },
];
const NAMES = { me: 'You', mom: 'Mom', dad: 'Dad', tv: 'TV' };
// The talking heads, drawn (100 by 100). `.shut` is the mouth at rest and `.open` the mouth that moves while a line is
// typed; `.flick` is the television's picture jumping.
const SVG = body => `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${body}</svg>`;
const HEADS = {
  mom: SVG(`<rect width="100" height="100" fill="#3b2632"/><circle cx="50" cy="48" r="45" fill="#54323f"/>
<circle cx="50" cy="13" r="11" fill="#8a4426"/><ellipse cx="50" cy="45" rx="28" ry="30" fill="#7c3c22"/>
<path d="M4 100Q8 80 36 75L64 75Q92 80 96 100Z" fill="#2f7460"/><path d="M40 75.5L50 90L60 75.5Z" fill="#f3ead8"/>
<rect x="43" y="62" width="14" height="17" rx="5" fill="#dfa385"/>
<ellipse cx="50" cy="47" rx="20" ry="24" fill="#f2c5a6"/><path d="M50 23A20 24 0 0 1 50 71Z" fill="#e6b393" opacity=".55"/>
<path d="M29 49Q26 23 50 21.5Q74 23 71 49Q68.5 37 59 31Q47 37.5 36 36.5Q31 41 29 49Z" fill="#8a4426"/>
<circle cx="29.6" cy="57" r="2.1" fill="#e8c460"/><circle cx="70.4" cy="57" r="2.1" fill="#e8c460"/>
<path d="M37 43.5Q41.5 41 46 43.5M54 43.5Q58.5 41 63 43.5" stroke="#6b3220" stroke-width="1.8" fill="none" stroke-linecap="round"/>
<ellipse cx="41.5" cy="49.5" rx="2.4" ry="2.9" fill="#2b1d1f"/><ellipse cx="58.5" cy="49.5" rx="2.4" ry="2.9" fill="#2b1d1f"/>
<circle cx="42.3" cy="48.5" r=".8" fill="#fff"/><circle cx="59.3" cy="48.5" r=".8" fill="#fff"/>
<circle cx="37" cy="57.5" r="4.2" fill="#f08f8f" opacity=".4"/><circle cx="63" cy="57.5" r="4.2" fill="#f08f8f" opacity=".4"/>
<path d="M49.2 52Q48 56 50.6 56.6" stroke="#d39a7c" stroke-width="1.5" fill="none" stroke-linecap="round"/>
<path class="shut" d="M44 62Q50 66.5 56 62" stroke="#a8443f" stroke-width="2.2" fill="none" stroke-linecap="round"/>
<ellipse class="open" cx="50" cy="63.6" rx="4.6" ry="4" fill="#7c2630"/>`),
  dad: SVG(`<rect width="100" height="100" fill="#1f2a3e"/><circle cx="50" cy="48" r="45" fill="#2b3a55"/>
<path d="M2 100Q6 79 34 74L66 74Q94 79 98 100Z" fill="#8d2f2f"/><path d="M41 74.5L50 86L59 74.5Z" fill="#e9e3d2"/>
<rect x="42" y="62" width="16" height="17" rx="5" fill="#cf9572"/>
<circle cx="28.5" cy="50" r="4.5" fill="#dba27e"/><circle cx="71.5" cy="50" r="4.5" fill="#dba27e"/>
<rect x="29" y="21" width="42" height="52" rx="18" fill="#e6b28d"/><path d="M50 21h3a18 18 0 0 1 18 18v16a18 18 0 0 1-18 18h-3Z" fill="#d9a27c" opacity=".55"/>
<path d="M28 45Q24.5 17 50 16Q75.5 17 72 45Q70 33 62 28Q50 25 38 28Q30 33 28 45Z" fill="#2f2622"/>
<path d="M35 41.3L46 40.3M54 40.3L65 41.3" stroke="#2f2622" stroke-width="2.6" stroke-linecap="round"/>
<rect x="33.5" y="43.5" width="14" height="11" rx="4" fill="#cfe3ff" fill-opacity=".16" stroke="#15171d" stroke-width="2"/>
<rect x="52.5" y="43.5" width="14" height="11" rx="4" fill="#cfe3ff" fill-opacity=".16" stroke="#15171d" stroke-width="2"/>
<path d="M47.5 48h5M33.5 47.500L29 46M66.5 47.500L71 46" stroke="#15171d" stroke-width="2" stroke-linecap="round"/>
<circle cx="40.5" cy="49" r="2.1" fill="#221a1a"/><circle cx="59.5" cy="49" r="2.1" fill="#221a1a"/>
<path d="M49 52Q47.5 57 51 57.5" stroke="#c48a68" stroke-width="1.6" fill="none" stroke-linecap="round"/>
<path class="shut" d="M45.5 65.800Q50 67.3 54.5 65.8" stroke="#8a4a3c" stroke-width="2" fill="none" stroke-linecap="round"/>
<ellipse class="open" cx="50" cy="66.4" rx="4.2" ry="3.5" fill="#5c2026"/>
<path d="M39.5 62.800Q50 55.5 60.5 62.800Q55 61.6 50 61.900Q45 61.6 39.5 62.800Z" fill="#2f2622"/>`),
  tv: SVG(`<rect width="100" height="100" fill="#171a23"/><circle cx="50" cy="56" r="46" fill="#202635"/>
<path d="M50 28L31 7M50 28L70 9" stroke="#b9bfcc" stroke-width="2" stroke-linecap="round"/><circle cx="31" cy="7" r="2.4" fill="#b9bfcc"/><circle cx="70" cy="9" r="2.4" fill="#b9bfcc"/>
<rect x="18" y="84" width="9" height="6" fill="#3a2b20"/><rect x="73" y="84" width="9" height="6" fill="#3a2b20"/>
<rect x="9" y="27" width="82" height="59" rx="9" fill="#6a4e36" stroke="#4a3524" stroke-width="2"/>
<rect x="15" y="33" width="54" height="47" rx="7" fill="#14202e"/><rect x="17" y="35" width="50" height="43" rx="6" fill="#7fb4e6"/>
<circle cx="42" cy="49" r="7.5" fill="#24415f"/><path d="M27 72Q29 59 42 59Q55 59 57 72Z" fill="#24415f"/>
<rect x="17" y="64" width="50" height="8" fill="#c23b30"/><text x="20" y="70.4" font-family="monospace" font-size="6.5" font-weight="700" fill="#fff">NEWS</text><rect class="open" x="40" y="67" width="23" height="2" fill="#f6e2df"/>
<path d="M21 39h13l-9 11h-4Z" fill="#fff" opacity=".2"/><rect class="flick" x="17" y="35" width="50" height="43" rx="6" fill="#fff"/>
<circle cx="80" cy="43" r="5" fill="#d8cdb4"/><path d="M80 43V39" stroke="#6a4e36" stroke-width="1.6"/><circle cx="80" cy="57" r="5" fill="#d8cdb4"/><path d="M80 57L83 54.5" stroke="#6a4e36" stroke-width="1.6"/>
<path d="M74.5 68h11M74.5 72h11M74.5 76h11" stroke="#3f2d1f" stroke-width="1.8" stroke-linecap="round"/>`),
};
const CPS = 30;                       // letters a second
const STOP = 0.3, COMMA = 0.14;       // the breath after a sentence, and after a comma
const TUNE = [0, 3, 5, 2, 0, -2, 3, 7, 5, 2];      // how a voice with no words in it goes up and down
// The night, in seconds from the last click.
const N = {
  lamp: 0.7, tv: 1.5, hall: 2.2,                    // her lamp clicks off; the television; the light in the hall
  toShelf: 2.9, shelf: 4.5,                         // across the room to the bookcase
  rem0: 4.6, rem1: 5.2, pocket: 5.85,               // the handset: reached for, taken, into her pocket
  car0: 6.1, car1: 6.75, lift: 7.6,                 // the car: both hands round it, and up
  turn: 8.6, door: 9.9, door0: 9.7, door1: 10.7,    // round, and over to the door, which she eases open
  thru: 10.9, black: 11.3, gone: 12.1,              // out by it
  set: 14.2, back: 14.9,                            // (the stairs, the street door, the snow; and back up)
  win: 17.0, glass: 17.9, puff: 17.7, puff2: 18.8,  // to the window, her nose to the glass, her breath on it
  up0: 18.0, up1: 18.7, sw: 19.1, lit: 19.4, go: 19.75, end: 20.5,      // the handset comes up; the switch; the toy's lamp; away
};
const WALKS = [[N.toShelf, N.shelf, 0.5], [N.lift + 0.15, N.door, 0.46], [N.thru, N.gone, 0.4], [N.back + 0.1, N.win + 0.4, 0.5]];      // when she is on her feet: from, to, seconds a step
const GRIP = 0.178;                                 // from the middle of the toy in her hands to the palm on its bumper
// The flight from her window to the museum's steps: down to the toy, along behind it, then up and over the park.
const SWOOP = 2.4, CHASE = 5, OVER = 11.5, FLY = SWOOP + CHASE + OVER, CALM_FLY = 4.6;
const TOY = { v: 3.4, far: 30 };                    // how fast the toy goes over the snow, and how far: to the ring of lights round the Singing Tree
const MOTOR = { kind: 'car', speed: TOY.v, throttle: 0.45, air: false };      // what the game's own motor sound is told while we are down beside it
// The museum's call on the green-lights card: the five notes (src/motif.js), when, how fast, and how loud (her voice is 0.03).
const CALL = { at: 0.5, beat: 0.42, gain: 0.3 };

export class Opening {
  constructor(G, { THREE, scene, camera, sound }) {
    this.G = G; this.THREE = THREE; this.scene = scene; this.camera = camera; this.sound = sound;
    this.on = false; this.t = 0; this.frozen = false;
    this.snd = new OpeningSound(sound);
    this._input = e => {
      if (!this.on) return;
      if (e.type === 'keydown') {
        if (e.repeat || ['Shift', 'Control', 'Alt', 'Meta', 'Tab', 'CapsLock'].includes(e.key) || e.ctrlKey || e.metaKey || e.altKey) return;
        e.stopImmediatePropagation();                                                 // (or the same Esc that skips would go on to pause the game)
        if (e.key === 'Escape' && this.G.input.padBtn !== 1) { e.preventDefault(); this.finish(true); return; }      // (a pad's B is Escape too, src/input.js: here it is only the next line, and Menu is the skip)
        if (e.key === ' ' || e.key.startsWith('Arrow')) e.preventDefault();          // (the page must not scroll)
        this.advance();
        return;
      }
      // (No preventDefault on a pointerdown: it would cancel the focus a click gives, and in itch's frame the keys would never arrive.)
      if (!document.hasFocus()) window.focus();
      if (e.target && e.target.closest && e.target.closest('.skipb')) { this.finish(true); return; }
      if (e.target && e.target.closest && e.target.closest('.perfp')) return;                  // (the ?perf panel: src/perfpanel.js)
      this.advance();
    };
  }

  _overlay() {
    if (this.el) return this.el;
    const st = document.createElement('style');
    st.textContent = `#opening { position: fixed; inset: 0; z-index: 30; pointer-events: none; }
#opening i { position: absolute; left: 0; right: 0; height: 9vh; background: #000; transition: transform .7s ease; z-index: 2; }
#opening i.t { top: 0; } #opening i.b { bottom: 0; }
#opening.out i.t { transform: translateY(-100%); } #opening.out i.b { transform: translateY(100%); }
#opening .fade { position: absolute; inset: 0; background: #000; opacity: 0; transition: opacity .9s ease; z-index: 1; }
#opening .fade.quick { transition-duration: .3s; }
#opening .fade.on { opacity: 1; } #opening .fade.cut { transition: none; }
#opening .box { --who: #e2cd94; position: absolute; left: 50%; bottom: calc(9vh + 24px); transform: translateX(-50%); box-sizing: border-box; width: min(33em, 92vw); min-height: 4.7em; padding: .8em 1.3em 1em; z-index: 3;
  border: 2px solid var(--who); border-radius: .45em; background: rgba(11,12,19,.9); box-shadow: 0 .3em 1.6em rgba(0,0,0,.7), inset 0 0 0 1px rgba(255,255,255,.05);
  font: 500 clamp(17px, min(2.3vw, 4.1vh), 36px)/1.3 var(--serif, Georgia, serif); color: var(--cream, #efe8d8); opacity: 0; visibility: hidden; transition: opacity .2s ease, border-color .2s ease, visibility 0s .2s; }
#opening .box.on { opacity: 1; visibility: visible; transition-delay: 0s; }
#opening .box.mom { --who: #f7b9c6; } #opening .box.dad { --who: #a9cdf5; } #opening .box.tv { --who: #a5b9d6; }
#opening .box.head { padding-left: 6.6em; }
#opening .face { display: none; position: absolute; left: .85em; bottom: .75em; width: 5em; height: 5em; box-sizing: border-box; border: 2px solid var(--who); border-radius: .4em; overflow: hidden; background: #14151c; box-shadow: 0 .2em .9em rgba(0,0,0,.7); }
#opening .box.head .face { display: block; }
#opening .face svg { display: block; width: 100%; height: 100%; animation: ophead .22s ease-out; }
#opening .face .open, #opening .face .flick { display: none; }
#opening .box.talk .face .open { display: inline; transform-box: fill-box; transform-origin: 50% 15%; animation: optalk .15s ease-in-out infinite alternate; }
#opening .box.talk .face .shut { display: none; }
.reduce #opening .box.talk .face .open { animation: optalk .15s ease-in-out infinite alternate !important; }      /* (the mouths still talk with Reduce motion on: a small drawn mouth, not motion; the head's pop-in and the television's flicker stay off) */
#opening .box.talk .face .flick { display: inline; opacity: 0; animation: opflick .9s steps(1) infinite; }
@keyframes optalk { from { transform: scaleY(.22); } to { transform: scaleY(1); } }
@keyframes opflick { 0%, 100% { opacity: 0; } 35% { opacity: .1; } 60% { opacity: .03; } 80% { opacity: .13; } }
@keyframes ophead { from { transform: translateY(18%) scale(.92); opacity: .3; } }
#opening .name { position: absolute; top: 0; left: 1.6em; transform: translateY(-58%); font: 700 .5em var(--mono, monospace); letter-spacing: .14em; text-transform: uppercase; color: #14151c; background: var(--who); border-radius: .5em; padding: .42em .95em .34em; box-shadow: 0 .2em .8em rgba(0,0,0,.6); animation: opname .22s ease-out; }
#opening .box.head .name { left: 13.2em; }
@keyframes opname { from { transform: translateY(-20%); opacity: 0; } }
#opening .cap p { margin: 0; }
#opening .box.me .cap p { color: #fff; }
#opening .box.tv .cap p { font-style: italic; color: #c3cfe2; }
#opening .cap p em { font-size: .8em; opacity: .75; margin-right: .5em; }
#opening .cap p u { text-decoration: none; opacity: 0; }
#opening .cap p.typing span::after { content: ''; position: absolute; width: .09em; height: .95em; margin: .16em 0 0 .06em; background: currentColor; opacity: .8; }
#opening .next { position: absolute; right: 1.1em; bottom: 0; transform: translateY(50%); font: 700 .46em var(--mono, monospace); letter-spacing: .14em; text-transform: uppercase; white-space: nowrap; color: var(--gilt, #e2cd94); background: #14151c; border: 1.5px solid currentColor; border-radius: 99px; padding: .4em 1em .32em; opacity: 0; transition: opacity .3s ease; }
#opening .next.on { opacity: 1; animation: opnext 1.5s ease-in-out infinite; }
@keyframes opnext { 50% { opacity: .45; } }
#opening .skipb { position: absolute; right: max(18px, env(safe-area-inset-right)); top: calc(9vh + 10px); z-index: 3; pointer-events: auto; cursor: pointer; font: clamp(12px, 1.1vw, 14px) var(--mono, monospace); letter-spacing: .14em; text-transform: uppercase; color: var(--gilt-dim, #a8966a); background: rgba(10,11,16,.5); border: 1px solid rgba(168,150,106,.4); border-radius: 3px; padding: 9px 14px; }
#opening .skipb:hover { color: var(--gilt, #e2cd94); border-color: var(--gilt, #e2cd94); }
@media (max-width: 700px) { #opening .box { bottom: calc(9vh + 34px); padding: .7em 1em .95em; } #opening .box.head { padding-left: 5.5em; } #opening .face { left: .65em; width: 4.2em; height: 4.2em; } #opening .name { left: 1.3em; } #opening .box.head .name { left: 11em; } #opening .next { font-size: .6em; } }
@media (max-height: 480px) { #opening .box { font-size: clamp(15px, 2.3vw, 20px); bottom: calc(9vh + 12px); min-height: 4.4em; padding-top: .7em; padding-bottom: .85em; } #opening .name { font-size: .58em; } #opening .next { font-size: .58em; } }
.reduce #opening i, .reduce #opening .box { transition: none; } .reduce #opening .fade { transition: opacity .4s linear !important; } .reduce #opening .fade.cut { transition: none !important; } .reduce #opening .next.on, .reduce #opening .face svg, .reduce #opening .name, .reduce #opening .box.talk .face .open, .reduce #opening .box.talk .face .flick { animation: none; }`;
    document.head.append(st);
    const el = this.el = document.createElement('div'); el.id = 'opening'; el.hidden = true;
    el.innerHTML = '<div class="fade"></div><i class="t"></i><i class="b"></i><div class="box"><div class="face" aria-hidden="true"></div><b class="name"></b><div class="cap" aria-live="polite"></div><div class="next" aria-hidden="true"></div></div><button class="skipb" type="button" tabindex="-1">Skip</button>';
    document.body.append(el);
    this.box = el.querySelector('.box'); this.face = el.querySelector('.face'); this.name = el.querySelector('.name'); this.cap = el.querySelector('.cap'); this.next = el.querySelector('.next'); this.fade = el.querySelector('.fade');
    return el;
  }
  // The box goes (what was in it fades with it, unless it must be gone at once).
  _hush(now = false) { this.box.classList.remove('on', 'talk'); this.next.classList.remove('on'); if (now) { this.cap.textContent = ''; this.box.className = 'box'; this.who = null; } }
  _fade(on, cut = false, quick = false) { const c = this.fade.classList; c.toggle('cut', cut); c.toggle('quick', quick); c.toggle('on', on); }      // (Reduce motion: a short plain fade, in the style above. It was a cut: the whole screen to black and back at a stroke)

  begin(done) {
    const G = this.G, THREE = this.THREE;
    if (this.on || !G.plan || !G.plan.facade || !G.vehicle) { done(0); return; }
    this.done = done; this.on = true; this.t = 0; this.last = 0; this.frozen = false; this.fired = {};
    this.calm = !!G.set.reduce;
    const el = this._overlay(); el.hidden = false; el.classList.remove('out'); this._hush(true);
    this._prompt();
    this._fade(true, true);

    // The toy: where the game will find it, and (for now) where she will set it down, across the street.
    const v = G.vehicle, fx = Math.sin(v.yaw), fz = Math.cos(v.yaw), drone = v.kind === 'drone';
    this.home = { x: v.pos.x, y: v.pos.y, z: v.pos.z, yaw: v.yaw, back: false };
    this.endAt = new THREE.Vector3(v.pos.x - fx * (drone ? 1.35 : 1.3), v.pos.y + (drone ? 0.34 : 0.46), v.pos.z - fz * (drone ? 1.35 : 1.3));
    this.endLook = new THREE.Vector3(v.pos.x + fx * 2.2, v.pos.y + (drone ? 0 : 0.42), v.pos.z + fz * 2.2);
    G.lampOn = false; if (G.lamp) G.lamp.intensity = 0;

    const set = this.set = buildSet(G, { eye: new THREE.Vector3(...EYE), aim: new THREE.Vector3(...AIM) });
    // The car on her bookcase: the very toy, copied, at the size a toy is in a child's hands (its lamp left off: a new
    // lamp would recompile the whole museum). Its paint is copied too, to be dimmed when the room is: ours to throw away.
    const car = this.car = v.group.clone(true), lamps = [];
    this.dim = new Map(); this.tint = []; this._c = new THREE.Color();
    const own = m => {
      if (!m || !m.color) return m;
      if (!this.dim.has(m)) { const d = m.clone(), top = Math.max(m.color.r, m.color.g, m.color.b); if (m.isMeshBasicMaterial && top > 1.05) d.color.multiplyScalar(0.07 / top); this.dim.set(m, d); this.tint.push([d, d.color.clone()]); }
      return this.dim.get(m);
    };
    car.traverse(o => { if (o.isLight) lamps.push(o); else if (o.material) o.material = Array.isArray(o.material) ? o.material.map(own) : own(o.material); }); for (const o of lamps) o.removeFromParent();
    car.scale.setScalar(0.62); car.position.copy(set.carSpot); car.rotation.set(0, 0.22, 0); car.visible = true; set.room.add(car);
    car.updateMatrixWorld(true);
    const bb = new THREE.Box3().setFromObject(car);
    car.position.y += set.L(set.carSpot.x, set.carSpot.y, set.carSpot.z).y - bb.min.y;          // its wheels on the shelf, whatever its build
    this.carRest = car.position.clone();
    this.carYaw = Math.atan2(CAR.to[0] - CAR.x, CAR.to[1] - CAR.z);
    v.place(CAR.x, CAR.z, this.carYaw, 0); this._toy(false);
    this.carGround = v.pos.y;

    // out of doors
    const py = set.ground(PENGUINS.x, PENGUINS.z);
    set.pool.position.set(PENGUINS.x, py + 0.06, PENGUINS.z); set.pool.visible = true; set.pool.material.opacity = 0.2;
    this.py = py;
    GLOWS.forEach(([x, y, z, s], i) => { set.glows[i].position.set(x, y, z); set.glows[i].scale.setScalar(s); });
    this.green = 0; this.greenTo = 0; this.pulses = []; this.trig = Infinity; this.gone = false;

    // the camera's own state: a place in the room, a way of looking, a width
    this.cp = new THREE.Vector3(); this.cq = new THREE.Quaternion(); this.cf = 50; this.snap = true;
    this._v = new THREE.Vector3(); this._w = new THREE.Vector3(); this._m = new THREE.Matrix4(); this._q = new THREE.Quaternion(); this._up = new THREE.Vector3(0, 1, 0);
    this._iq = new THREE.Quaternion(); this._t = Array.from({ length: 8 }, () => new THREE.Vector3()); this.ch = Math.PI; this.lampK = 1; this.darkK = 0; this.keys = null;
    this._air = new THREE.Vector3(); this._out = new THREE.Vector3(AIM[0] - EYE[0], 0, AIM[2] - EYE[2]).normalize();
    this.phase = 'room'; this.tB = 0; this.tF = 0; this._bs = null; this.lastAdv = performance.now() + 500;
    this._card(0);
    for (const k of ['keydown', 'pointerdown']) addEventListener(k, this._input, { capture: true });
    this.snd.tvOn();
    setTimeout(() => { if (this.on && this.phase === 'room') this._fade(false); }, 150);
    this._warmFlight();
    this.frame(0);
  }

  // ------------------------------------------------------------------ the lines --

  _card(i) {
    const c = CARDS[i];
    this.ci = i; this.li = -1; this.typing = false; this.waiting = false; this.n = 0;
    this.pre = this.calm ? Math.min(c.pre || 0.3, 1.2) : (c.pre || 0.3); this.view = c.view;
    this._hush();
    if (c.on) this[c.on]();
  }
  // The next line, in its box: whose it is on the name plate and in the colour of the frame, and their head beside it.
  _line() {
    const c = CARDS[this.ci], l = c.lines[++this.li], who = l.who, box = this.box;
    const p = document.createElement('p'); p.className = 'typing';
    if (l.note) { const em = document.createElement('em'); em.textContent = `(${l.note})`; p.append(em); }
    const shown = document.createElement('span'), rest = document.createElement('u'); rest.textContent = l.text; p.append(shown, rest);
    this.cap.replaceChildren(p); this.p = { p, shown, rest, l };
    if (this.who !== who || !box.classList.contains('on')) {       // (somebody else: the head and the plate come in afresh)
      this.who = who; this.face.innerHTML = HEADS[who] || '';
      const n = this.name.cloneNode(false); n.textContent = NAMES[who]; this.name.replaceWith(n); this.name = n;
    }
    box.className = `box on talk ${who}${HEADS[who] ? ' head' : ''}`; this.next.classList.remove('on');
    this.n = 0; this.acc = 0; this.hold = 0; this.keyed = 0; this.typing = true;
    if (l.view) this.view = l.view;
    this.snd.tvLevel(l.who === 'tv' ? 1.5 : 0.4);
    // (Typed out with Reduce motion on too: letters appearing in a box are not the motion that setting is for, and the owner
    // wants the lines told, not dropped in whole. The camera's sway, the walks and the long flight are still left out.)
  }
  _typed() {
    const { p, shown, rest, l } = this.p; shown.textContent = l.text; rest.textContent = ''; p.classList.remove('typing'); this.box.classList.remove('talk');
    this.typing = false; this.gap = 1.1 + l.text.length * 0.035;      // (a line is gone when the next comes: time to read it)
    if (this.li >= CARDS[this.ci].lines.length - 1) { this.waiting = true; this.next.classList.add('on'); this.snd.tvLevel(1); }
  }
  // One more letter of the line: a key for every other one, and at the start of a word the voice that says it.
  _letter(l, n, cps) {
    const text = l.text, ch = text[n - 1];
    if (!/[\w’']/.test(ch)) return;
    if (this.keyed++ % 2 === 0) this.snd.key(l.who);
    if (l.who === 'tv' || (n > 1 && /[\w’']/.test(text[n - 2]))) return;
    const word = text.slice(n - 1).match(/^[\w’']+/)[0], after = text.slice(n - 1 + word.length);
    const groups = (word.match(/[aeiouy]+/gi) || [1]).length, syl = Math.max(1, groups - (groups > 1 && /[^aeiou]e$/i.test(word) ? 1 : 0));
    const each = Math.max(0.12, word.length / cps / syl), last = /^[.?!…]/.test(after) || !after, asks = /^\?/.test(after);
    let hash = 0; for (let i = 0; i < word.length; i++) hash += word.charCodeAt(i);
    for (let i = 0; i < syl; i++) {
      const end = last && i === syl - 1;
      this.snd.wah(l.who, i * each, Math.min(0.3, each * (end ? 1.5 : 0.96)), TUNE[(hash + i) % TUNE.length] - 3 * n / text.length - (end && !asks ? 2 : 0), end ? (asks ? 4 : -3) : 0);
    }
  }
  _lines(dt) {
    if (this.pre > 0) { this.pre -= dt; if (this.pre <= 0) this._line(); return; }
    if (this.typing) {
      const { shown, rest, l } = this.p, text = l.text, cps = CPS * (l.who === 'tv' ? 1.4 : 1), was = this.n;
      if (this.hold > 0) { this.hold -= dt; return; }
      this.acc += dt * cps;
      while (this.acc >= 1 && this.n < text.length) {
        this.acc -= 1; const ch = text[this.n++], nx = text[this.n];
        this._letter(l, this.n, cps);
        if (nx === ' ' && /[.?!…,]/.test(ch)) { this.hold = ch === ',' ? COMMA : STOP; this.acc = 0; break; }
      }
      if (this.n !== was) { shown.textContent = text.slice(0, this.n); rest.textContent = text.slice(this.n); }
      if (this.n >= text.length) this._typed();
    } else if (!this.waiting) { this.gap -= dt; if (this.gap <= 0) this._line(); }
  }
  // The word beside a finished line, for whatever was used last. A gamepad's buttons arrive here as keys (src/input.js: poll).
  _prompt() {
    const inp = this.G.input, pad = !!(inp && inp.pad), touch = !pad && (inp && inp.usedTouch || matchMedia('(pointer: coarse)').matches);
    const w = pad ? 'A ▸' : touch ? 'Tap ▸' : 'Click ▸'; if (this.next.textContent !== w) this.next.textContent = w;
  }
  /** What a click, a tap, a key or the A button does. */
  advance() {
    if (!this.on || this.phase !== 'room') return;
    this._prompt();
    const now = performance.now(); if (now - this.lastAdv < 230) return; this.lastAdv = now;
    if (this.pre > 0) { this.pre = 0; this._line(); }
    else if (this.typing) this._typed();
    else if (!this.waiting) this._line();
    else if (this.ci + 1 < CARDS.length) this._card(this.ci + 1);
    else this._night();
  }
  // ---------------------------------------------------------- the night outside --

  // One of the lights that dance, at time t: round the Singing Tree, until they go (this.trig), then up its star and
  // away into the museum. null once it is in.
  _orb(i, t, out) {
    const a = t * (0.5 + 0.07 * i) + i * 1.257, r = 9 + 5 * Math.sin(t * 0.31 + i * 1.7), y = TREE[1] + 1 + 5.5 * Math.sin(t * 0.43 + i * 2.1) + i * 0.7;
    out.set(TREE[0] + Math.cos(a) * r * 1.5, y, TREE[2] + Math.sin(a) * r);
    const s = t - this.trig - i * 0.24;
    if (s <= 0) return out;
    if (s < 2.2) { const k = ease(s / 2.2), a2 = a + s * s * 2.2, r2 = lerp(r, 1.3, k); return out.set(STAR[0] + Math.cos(a2) * r2 * lerp(1.5, 1, k), lerp(y, STAR[1], k), STAR[2] + Math.sin(a2) * r2); }
    const u = (s - 2.2) / 3.3; if (u >= 1) return null;
    const k = u * u * (3 - 2 * u), b = 1 - k, wig = Math.sin(u * 15 + i * 2) * 2.2 * (1 - u);
    return out.set(b * b * STAR[0] + 2 * b * k * 300 + k * k * INTO[0], b * b * STAR[1] + 2 * b * k * (33 + i * 1.6) + k * k * INTO[1] + wig, b * b * STAR[2] + 2 * b * k * (i * 3 - 4) + k * k * INTO[2] + wig * 0.6);
  }
  _lightsGo() { if (this.trig === Infinity) this.trig = this.t + 0.5; }
  // The museum calls: its five notes, loud, a green light for each (the television turned down under them).
  _flash() {
    this.greenTo = 0.42; this.called = this.t + CALL.at + CALL.beat * 7;
    this.snd.tvLevel(0.2);
    this.snd.motif(CALL.at, { beat: CALL.beat, gain: CALL.gain, onNote: i => this._pulse(i % 5, 1) });
    this.snd.motif(CALL.at, { beat: CALL.beat, gain: CALL.gain * 0.3, transpose: 12 });      // (and an octave up, which a phone's small speaker carries)
  }
  _pulse(i, amp) { if (this.on) this.pulses.push({ i, amp, t: this.t }); }

  _outside(dt) {
    const set = this.set, t = this.t, v = this._v;
    // penguins, going round in the lamplight
    set.penguins.forEach((m, i) => {
      const a = t * 0.085 + i * 0.62, x = PENGUINS.x + Math.cos(a) * 3.6, z = PENGUINS.z + Math.sin(a) * 2.2, w = t * 6.2 + i * 2;
      m.visible = true; m.position.set(x, this.py + Math.abs(Math.sin(w)) * 0.025, z);
      m.rotation.set(0, Math.atan2(-Math.sin(a) * 3.6, Math.cos(a) * 2.2), this.calm ? 0 : Math.sin(w) * 0.15);
    });
    // the lights
    let alive = 0;
    set.orbs.forEach((tail, i) => tail.forEach((s, j) => {
      const p = this.gone ? null : this._orb(i, t - j * 0.055, v);
      if (!p) { s.visible = false; if (!j && !this.fired['in' + i] && t > this.trig) { this.fired['in' + i] = 1; this._pulse(0, 1); this._pulse(1 + i % 4, 0.7); if (!this.frozen) this.snd.spark(0, [86, 91, 95, 93, 88][i], 0.03); } return; }
      alive++; s.visible = true; s.position.copy(p);
      const tw = j ? 1 : 1 + 0.16 * Math.sin(t * 9 + i * 3); s.scale.setScalar(s.userData.k * tw);
    }));
    if (!alive && t > this.trig && !this.gone) { this.gone = true; this.greenTo = Math.max(this.greenTo, 0.16); }
    // the green in the museum
    this.green += (this.greenTo - this.green) * Math.min(1, dt * 1.5);
    if (this.phase === 'room' && this.ci === 7 && !this.calm && t > (this.called ?? 1e9) && Math.random() < dt * 1.4) this._pulse(Math.floor(Math.random() * 5), 0.2 + Math.random() * 0.3);      // (a glimmer afterwards: the bright flashes are the notes')
    this.pulses = this.pulses.filter(p => t - p.t < 2.2);
    set.glows.forEach((s, i) => {
      let k = this.green * (i === 5 ? 0.3 : 0.75 + 0.25 * Math.sin(t * 2.3 + i * 1.9));
      for (const p of this.pulses) if (p.i === i || i === 5) k += p.amp * (i === 5 ? 0.13 : 1) * Math.exp(-(t - p.t) * (this.calm ? 1.2 : 3.4));
      s.material.opacity = Math.min(1, k * 0.8); s.visible = k > 0.004;
    });
  }

  // -------------------------------------------------------------- the camera --

  // Where she is looking from and at: p in the room's own metres, look in the world (or, with `in`, in the room).
  _view(name) {
    const P = PENGUINS, py = this.py;
    switch (name) {
      case 'room': return { p: [-0.12, 1.26, 2.9], look: [318, 5, 32], fov: 50, rate: 1.7 };
      case 'lights': return { p: [0.02, 1.2, 0.86], look: [346, 12, 2], fov: 36 };
      case 'show': return { p: [0, 1.2, 1.0], look: [322, 6, 30], fov: 46 };
      case 'penguin': return { p: [0.05, 1.25, 0.5], look: [P.x, py + 0.5, P.z], fov: 13, rate: 1.9 };
      case 'penguin2': return { p: [0.05, 1.27, 0.42], look: [P.x, py + 0.55, P.z], fov: 7.2, rate: 1.9 };
      case 'door': return { p: [-0.05, 1.2, 1.15], look: [-1.9, 1.05, 2.3], in: true, fov: 52, rate: 2.3 };
      case 'orbs': { const o = this._orb(2, this.t - 0.25, this._w); return { p: [0.14, 1.2, 0.42], look: o ? [o.x, o.y - 1, o.z] : MUSEUM, fov: 27, rate: 2.0 }; }
      case 'museum': return { p: [0.2, 1.2, 0.3], look: MUSEUM, fov: 24 };
      case 'museum2': return { p: [0.22, 1.21, 0.26], look: [MUSEUM[0], MUSEUM[1] + 1, MUSEUM[2]], fov: 19 };
      case 'shelf': return { p: [0.52, 1.24, 1.68], look: [1.7, 0.8, 1.06], in: true, fov: 40 };
      case 'win': return { p: [0, 1.2, 0.95], look: [330, 6, 24], fov: 44, rate: 0.5 };
      case 'down': return { p: [0, 1.31, 0.3], look: [CAR.x - 1, this.carGround, CAR.z - 1.5], fov: 26, rate: 2.2 };
    }
    return null;
  }
  _aim(dt, name, snap) {
    const s = this._view(name), set = this.set, cam = this.camera;
    const k = snap || this.calm || this.frozen ? 1 : 1 - Math.exp(-dt * (s.rate || 2.4));
    this.cp.lerp(this._v.fromArray(s.p), k);
    set.L(this.cp.x, this.cp.y, this.cp.z, cam.position);
    if (s.in) set.L(s.look[0], s.look[1], s.look[2], this._w); else this._w.fromArray(s.look);
    this._q.setFromRotationMatrix(this._m.lookAt(cam.position, this._w, this._up));
    this.cq.slerp(this._q, k); this.cf = lerp(this.cf, s.fov, k);
    cam.quaternion.copy(this.cq);
    if (!this.calm && !this.frozen) { const t = this.t; cam.rotateX(Math.sin(t * 0.9) * 0.0028 + Math.sin(t * 0.37) * 0.002); cam.rotateY(Math.sin(t * 0.7 + 1) * 0.003); }
    if (Math.abs(cam.fov - this.cf) > 0.01) { cam.fov = this.cf; cam.updateProjectionMatrix(); }
  }
  _once(key, at, T, fn) { if (T >= at && !this.fired[key]) { this.fired[key] = 1; if (!this.frozen) fn(); } }

  // ------------------------------------------------------- when the house is asleep --

  // The light in the room. T: seconds of the night (less than 0: before it, her lamp on).
  _light(T) {
    const U = this.set.U, night = T >= 0, w = this.calm ? 0 : this.t;
    const lamp = !night || T < N.lamp ? 1 : 0.3 * (1 - span(T, N.lamp, N.lamp + 1.3));         // (a click, and the glow going out of it)
    const hall = !night ? 1 : 1 - span(T, N.hall, N.hall + 0.45);
    const dark = night ? span(T, N.lamp, N.hall + 1.8) : 0;                                    // her eyes getting used to it
    U.uLamp.value.setRGB(1.7, 1.2, 0.72).multiplyScalar(lamp);
    U.uWarm.value.setRGB(1.5, 0.95, 0.5).multiplyScalar((!night || T < N.tv ? this._tv : 0.8) * hall);
    U.uCool.value.setRGB(0.36, 0.5, 0.95).multiplyScalar(1 - 0.5 * dark);
    U.uAmb.value.setRGB(0.02, 0.024, 0.036).multiplyScalar(1 + dark);
    U.uBulb.value = 0.8 + 0.5 * dark;
    // the show in the park, on her ceiling: three colours that come and go
    const k = 0.4 + 2.3 * dark, mix = (c, a, b, m, g) => c.value.setRGB(lerp(a[0], b[0], m), lerp(a[1], b[1], m), lerp(a[2], b[2], m)).multiplyScalar(k * g);
    mix(U.uShowA, [1.0, 0.14, 0.08], [1.0, 0.6, 0.16], 0.5 + 0.5 * Math.sin(w * 0.43), 0.65 + 0.35 * Math.sin(w * 0.9 + 1));
    mix(U.uShowB, [0.12, 0.9, 0.3], [1.0, 0.84, 0.52], 0.5 + 0.5 * Math.sin(w * 0.31 + 2), 0.65 + 0.35 * Math.sin(w * 0.7 + 3));
    mix(U.uShowC, [0.18, 0.4, 1.0], [0.9, 0.2, 0.8], 0.5 + 0.5 * Math.sin(w * 0.37 + 4), 0.65 + 0.35 * Math.sin(w * 1.1 + 5));
    this.lampK = lamp; this.darkK = dark;
  }

  _night() {
    this.phase = 'night'; this.tB = 0; this._hush(); this.snd.tvLevel(1);
    // Where she goes, from where she stands now: [seconds, where her eyes are (the room's metres), which way she
    // faces (0: the back of the room; a quarter turn: the bookcase; a half: the window), up or down, how wide].
    const set = this.set, K = this.keys = [], w = this._w;
    const key = (T, p, h, pit, fov, go = false) => K.push({ T, v: [p[0], p[1], p[2], h, pit, fov], go });
    const facing = s => { w.fromArray(s.look); set.room.worldToLocal(w); const dx = w.x - s.p[0], dy = w.y - s.p[1], dz = w.z - s.p[2]; let h = Math.atan2(dx, dz); if (h < 0) h += TAU; return [h, Math.atan2(dy, Math.hypot(dx, dz))]; };
    const R = this._view('room'), [hR, pR] = facing(R), D = this._view('down'), [hD, pD] = facing(D);
    const f = this._v.set(0, 0, -1).applyQuaternion(this.cq).applyAxisAngle(this._up, -set.yaw);
    let h0 = Math.atan2(f.x, f.z); while (h0 - hR > Math.PI) h0 -= TAU; while (h0 - hR < -Math.PI) h0 += TAU;
    key(0, this.cp.toArray(), h0, Math.asin(Math.max(-1, Math.min(1, f.y))), this.cf);
    key(0.6, R.p, hR, pR, 50); key(N.toShelf, R.p, hR, pR, 50);
    key(N.shelf, [1.13, 1.2, 1.3], 1.62, -0.6, 54); key(N.rem1, [1.25, 1.17, 1.32], 1.63, -0.7, 54);
    key(N.pocket, [1.16, 1.2, 1.2], 1.58, -0.62, 54, true);
    key(N.car1, [1.3, 1.16, 1.06], 1.56, -0.72, 54); key(N.car1 + 0.12, [1.3, 1.16, 1.06], 1.56, -0.72, 54);
    key(N.lift, [1.16, 1.2, 1.1], 1.45, -0.5, 54);
    key(N.turn, [0.85, 1.2, 1.6], 0.1, -0.34, 54, true);
    key(N.door, [-0.6, 1.2, 2.13], -1.5, -0.3, 54); key(N.thru, [-0.78, 1.2, 2.14], -1.57, -0.26, 54);
    key(N.gone, [-2.3, 1.2, 2.15], -1.57, -0.2, 54); key(N.back - 0.3, [-2.3, 1.2, 2.15], -1.57, -0.2, 54);
    key(N.back - 0.29, [-1.25, 1.2, 2.16], 2.62, -0.04, 52);
    key(N.win, [0, 1.24, 0.8], Math.PI, -0.12, 46, true);
    key(N.glass, D.p, hD, pD, D.fov); key(N.end + 1, D.p, hD, pD, D.fov);
  }
  // Where she is and which way she is looking, T seconds into the night.
  _nightCam(T) {
    const K = this.keys, set = this.set, cam = this.camera, o = this._o || (this._o = [0, 0, 0, 0, 0, 0]);
    let i = 0; while (i < K.length - 2 && T >= K[i + 1].T) i++;
    if (this.calm) { while (i > 0 && K[i].go) i--; for (let c = 0; c < 6; c++) o[c] = K[i].v[c]; }      // (cuts)
    else {
      const a = K[i], b = K[i + 1], D = b.T - a.T, s = Math.min(1, Math.max(0, (T - a.T) / D)), s2 = s * s, s3 = s2 * s;
      const slope = (j, c) => (K[j].go && j > 0 && j < K.length - 1 ? (K[j + 1].v[c] - K[j - 1].v[c]) / (K[j + 1].T - K[j - 1].T) : 0);
      for (let c = 0; c < 6; c++) o[c] = (2 * s3 - 3 * s2 + 1) * a.v[c] + (s3 - 2 * s2 + s) * D * slope(i, c) + (3 * s2 - 2 * s3) * b.v[c] + (s3 - s2) * D * slope(i + 1, c);
    }
    let bob = 0; if (!this.calm) for (const [t0, t1, gap] of WALKS) if (T > t0 && T < t1) bob = (1 - Math.cos(TAU * (T - t0) / gap)) / 2 * Math.min(1, (T - t0) * 3, (t1 - T) * 3);
    this.bob = bob; this.cp.set(o[0], o[1] - bob * 0.017, o[2]); this.ch = o[3]; this.cf = o[5];
    const h = o[3] + (this.calm ? 0 : Math.sin(T * TAU / 0.96) * 0.006 * Math.min(1, bob * 4)), cp = Math.cos(o[4]);
    set.L(this.cp.x, this.cp.y, this.cp.z, cam.position);
    set.L(this.cp.x + Math.sin(h) * cp, this.cp.y + Math.sin(o[4]), this.cp.z + Math.cos(h) * cp, this._w);
    this.cq.setFromRotationMatrix(this._m.lookAt(cam.position, this._w, this._up)); cam.quaternion.copy(this.cq);
    if (!this.calm && !this.frozen) { const t = this.t; cam.rotateX(Math.sin(t * 0.9) * 0.0028 + Math.sin(t * 0.37) * 0.002); cam.rotateY(Math.sin(t * 0.7 + 1) * 0.003); }
    if (Math.abs(cam.fov - this.cf) > 0.01) { cam.fov = this.cf; cam.updateProjectionMatrix(); }
  }
  // A place measured from her eyes as she stands (the room's metres): to her right, up, in front of her.
  _body(side, up, fwd, out) { const h = this.ch, p = this.cp; return out.set(p.x - Math.cos(h) * side + Math.sin(h) * fwd, p.y + up, p.z + Math.sin(h) * side + Math.cos(h) * fwd); }

  // What she has hold of, and her arms. T: seconds of the night (less than 0: before it, everything in its place).
  _props(T) {
    const set = this.set, car = this.car, rem = set.remote, rig = set.rig, cam = this.camera, [t0, t1, t2, t3, t4, t5, t6, t7] = this._t;
    set.door.rotation.y = lerp(DOORWAY.ajar, -1.32, T < 0 ? 0 : span(T, N.door0, N.door1));
    // the light on the car, which the room's own shader does not paint
    const lk = this.lampK * 0.72, dk = 1 + 0.3 * this.darkK; this._c.setRGB(lk + 0.22 * dk, lk + 0.27 * dk, lk + 0.38 * dk);
    for (const [m, c] of this.tint) m.color.copy(c).multiply(this._c);
    rig.visible = false; set.handset.visible = false; for (const a of set.arms) set.hideArm(a);
    car.visible = T < N.gone; car.position.copy(this.carRest); car.rotation.y = 0.22;
    rem.visible = T < N.pocket; rem.position.copy(set.remoteSpot);
    if (T < N.rem0 || (T >= N.gone && T < N.up0)) return;
    rig.visible = true; rig.position.copy(cam.position); rig.quaternion.copy(cam.quaternion); set.held.value = T >= N.up0 ? 0.5 : 0.6;
    if (T >= N.up0) { this._window(span(T, N.up0, N.up1), T >= N.sw && T < N.sw + 0.2); return; }
    rig.scale.setScalar(1); rig.updateMatrixWorld(true); this._iq.copy(cam.quaternion).invert();
    const h = this.ch, fx = Math.sin(h), fz = Math.cos(h), rx = -Math.cos(h), rz = Math.sin(h);
    const at = v => rig.worldToLocal(set.L(v.x, v.y, v.z, v)), way = v => v.applyAxisAngle(this._up, set.yaw).applyQuaternion(this._iq);
    const pose = (a, wrist, fwd, up) => { const sd = a.side; set.poseArm(a, at(this._body(sd * 0.15, -0.21, -0.05, t5)), at(wrist), way(t6.set(rx * sd * 0.8 - fx * 0.3, -1, rz * sd * 0.8 - fz * 0.3)), way(fwd), way(up)); };
    const [al, ar] = set.arms;
    if (T < N.pocket) {                                           // her right hand, for the handset; and into her pocket with it
      const took = T >= N.rem1, rs = set.remoteSpot, grab = t2.set(rs.x - 0.17, rs.y + 0.075, rs.z + 0.01), rest = this._body(0.2, -0.62, 0.02, t1);
      let down = 0;
      if (!took) { const k = span(T, N.rem0, N.rem1); t0.lerpVectors(rest, grab, k); t0.y += Math.sin(k * Math.PI) * 0.08; }
      else {                                                      // (back off the shelf before it goes down: round by her chest)
        const k = span(T, N.rem1 + 0.1, N.pocket), a = (1 - k) * (1 - k), b = 2 * k * (1 - k), near = lerp(1, 0.4, Math.min(1, k * 3));
        this._body(0.2, -0.24, 0.16, t7); t0.set(grab.x * a + t7.x * b + rest.x * k * k, grab.y * a + t7.y * b + rest.y * k * k, grab.z * a + t7.z * b + rest.z * k * k); down = k;
        rem.position.set(t0.x + fx * 0.17 * near, t0.y - 0.075 * near - down * 0.05, t0.z + fz * 0.17 * near - 0.01);
      }
      pose(ar, t0, t3.set(fx * 0.9, -0.42 - down * 0.9, fz * 0.9), t4.set(fx * 0.4, 1, fz * 0.4));
    }
    if (T >= N.car0) {                                            // both hands for the car: round it, up, and carried
      const kl = span(T, N.car1 + 0.1, N.lift), kr = span(T, N.car0, N.car1), yaw = lerp(0.22, h - Math.PI / 2, kl);
      car.position.lerpVectors(this.carRest, this._body(0, -0.4 - this.bob * 0.006, 0.44, t1), kl); car.position.y += Math.sin(kl * Math.PI) * 0.06; car.rotation.y = yaw;
      // (a mitten clasped over each end of it, nose and tail: the toy is GRIP from its middle to a bumper, and a
      // mitten's palm is 8 cm on from its wrist. ax: along the car; px: across it, away from her.)
      const ax = Math.sin(yaw), az = Math.cos(yaw), px = az, pz = -ax;
      for (const a of [al, ar]) {
        const sd = a.side;
        t2.set(car.position.x + ax * sd * GRIP - px * 0.07, car.position.y + 0.1, car.position.z + az * sd * GRIP - pz * 0.07);
        t0.lerpVectors(this._body(sd * 0.2, -0.62, 0.02, t1), t2, kr); t0.y += Math.sin(kr * Math.PI) * 0.07;
        const open = 1 - kr;                                      // (her hands come in open, and close on it)
        pose(a, t0, t3.set(px * 0.95 - ax * sd * (0.3 - open * 0.3), -0.18 - open * 0.12, pz * 0.95 - az * sd * (0.3 - open * 0.3)), t4.set(ax * sd, 0.3, az * sd));
      }
    }
  }

  // At the window: the handset in both her mittens, held up into the bottom of the view (k: how far up it has come).
  // (small and close, in front of the glass: it is the toy below that the long lens is on)
  _window(k, press) {
    const set = this.set, rig = set.rig, cam = this.camera, [t0, t1, t2, t3, t4] = this._t, dy = -0.34 * (1 - k);
    rig.visible = k > 0.001; if (!rig.visible) return;
    rig.position.copy(cam.position); rig.quaternion.copy(cam.quaternion); rig.scale.setScalar(0.26); set.held.value = 0.5;
    set.handset.visible = true; set.handset.position.set(0, -0.118 + dy, -1.0); set.handset.rotation.set(0.85, 0, 0);
    for (const a of set.arms) {
      const sd = a.side, dip = sd > 0 && press ? 0.006 : 0;
      set.poseArm(a, t0.set(sd * 0.33, -0.47 + dy * 0.4, -0.6), t1.set(sd * 0.142, -0.178 + dy - dip, -0.925), t2.set(sd * 0.8, -0.6, 0.3), t3.set(-sd * 0.5, 0.5, -0.72), t4.set(sd * 0.75, 0.12, 0.62));
    }
  }

  _nightFrame(dt) {
    const G = this.G, set = this.set, T = this.tB, snd = this.snd, v = G.vehicle;
    this._light(T);
    // lights out
    this._once('lamp', N.lamp, T, () => snd.flick(0)); this._once('tvoff', N.tv, T, () => snd.tvOff()); this._once('hall', N.hall, T, () => snd.flick(0, 0.03));
    // on tiptoe: the bookcase, the handset, the car; the door
    this._once('w1', N.toShelf, T, () => snd.tiptoe(0.2, 3, 0.5)); this._once('rem', N.rem1, T, () => snd.click(0, 0.03)); this._once('car', N.car1, T, () => snd.thud(0, 0.02));
    this._once('w2', N.lift + 0.15, T, () => snd.tiptoe(0.2, 5, 0.46)); this._once('creak', N.door0, T, () => snd.creak(0, 0.95, 0.4)); this._once('w3', N.thru, T, () => snd.tiptoe(0.1, 3, 0.4));
    // off stage, in the dark: the stairs, the street door, the snow, and back up
    this._once('black', N.black, T, () => this._fade(true));
    this._once('down', N.gone, T, () => snd.steps(0, 7, -1, 0.15)); this._once('out', N.gone + 1.1, T, () => snd.thud(0, 0.045)); this._once('snow', N.gone + 1.3, T, () => snd.crunch(0, 3));
    this._once('set', N.set, T, () => snd.thud(0, 0.02)); this._once('up', N.set + 0.12, T, () => snd.steps(0, 5, 1, 0.13));
    this._once('in', N.back, T, () => this._fade(false)); this._once('w4', N.back + 0.1, T, () => snd.tiptoe(0.25, 4, 0.5)); this._once('shut', N.back + 0.75, T, () => snd.click(0, 0.03));
    if (this.frozen) this._fade(T > N.black + 0.45 && T < N.back + 0.45, true);
    if (!this.home.back) this._toy(T >= N.set);
    // back at the window: her breath on the glass, the handset in her hands, the toy waking in the snow below
    this._once('b1', N.puff, T, () => snd.breath(0)); this._once('b2', N.puff2, T, () => snd.breath(0));
    const puff = t0 => (T < t0 ? 0 : Math.min(1, (T - t0) / 0.55) * Math.exp(-Math.max(0, T - t0 - 0.55) / 2.4));
    const fog = Math.min(1, puff(N.puff) * 0.75 + puff(N.puff2) * 0.6);
    if (!this._bs) {                                                                   // where her line of sight to the toy meets the glass; she breathes just up and left of it
      const d = this._view('down'), e = this._w.fromArray(d.look); set.room.worldToLocal(e);
      const u = (0.009 - d.p[2]) / (e.z - d.p[2]); this._bs = [d.p[0] + (e.x - d.p[0]) * u - 0.068, d.p[1] + (e.y - d.p[1]) * u + 0.03];
    }
    set.breath.visible = fog > 0.01; set.breath.material.opacity = fog * 0.95; set.breath.position.set(this._bs[0], this._bs[1], 0.009); set.breath.scale.setScalar(0.2 + 0.07 * Math.min(1, Math.max(0, T - N.puff) / 2.5));
    this._once('sw', N.sw, T, () => snd.click(0, 0.06)); this._once('pw', N.sw + 0.12, T, () => snd.powerUp(0));
    set.led.material.color.setHex(T >= N.sw ? 0x4dff7a : 0x661414);
    if (T >= N.lit && !G.lampOn) { G.lampOn = true; if (G.lamp) G.lamp.intensity = 70; const b = document.getElementById('bLights'); if (b) b.setAttribute('aria-pressed', 'true'); }
    if (T < N.lit && G.lampOn && this.frozen) { G.lampOn = false; if (G.lamp) G.lamp.intensity = 0; }
    this._drive(T - N.go);
    this._nightCam(T); this._props(T);
    if (T >= N.end && !this.frozen) this._fly();
  }
  // The toy pulls away over the snow towards the lights (s seconds since it set off).
  _dist(s) { const d = s <= 0 ? 0 : s < 2 ? TOY.v / 4 * s * s : TOY.v * (s - 1), e = TOY.far - 2; return d < e ? d : TOY.far - 2 * Math.exp((e - d) / 2); }      // (it eases to a stop there)
  _drive(s) {
    const v = this.G.vehicle; if (this.home.back) return;
    const d = this._dist(s);
    if (d === this._drove) { v.speed = 0; return; }
    const was = this._drove; this._drove = d;
    v.place(CAR.x + Math.sin(this.carYaw) * d, CAR.z + Math.cos(this.carYaw) * d, this.carYaw, v.pos.y);
    v.speed = this.frozen || !(d > was) ? 0 : s < 2 ? TOY.v / 2 * s : Math.min(TOY.v, TOY.v * (TOY.far - d) / 2);          // (its wheels turn)
  }
  _home() {
    const v = this.G.vehicle, h = this.home; if (h.back) return; h.back = true;
    v.place(h.x, h.z, h.yaw, h.y); this._toy(true);
  }

  // ------------------------------------------------------------------ the flight --

  // Out through the glass and down to the toy, along behind it as it makes for the lights, then up over everything there
  // is to drive through, to where the game will find it.
  // The toy shown or hidden: its body, never its headlamp (switched off, it lights nothing). three.js builds each shader
  // for the lights in the scene, and a hidden lamp is not in it: hiding the whole toy compiled every shader in view
  // again, twice (as she set it down in the street, and as the game took it over at the steps).
  _toy(on) {
    const g = this.G.vehicle.group; g.visible = true;
    if (!this._parts || this._parts.g !== g) { this._parts = []; this._lamps = []; this._parts.g = g; g.traverse(o => { if (o !== g && (o.isMesh || o.isPoints || o.isLine || o.isSprite)) this._parts.push([o, o.visible]); else if (o.isLight) this._lamps.push([o, 0]); }); }
    if (this._parts.on === on) return; this._parts.on = on;
    for (const [o, was] of this._parts) o.visible = on ? was : false;
    for (const l of this._lamps) { if (on) l[0].intensity = l[1]; else { l[1] = l[0].intensity; l[0].intensity = 0; } }      // (a lamp of its own that is always lit, the drone's, kept dark while it is hidden)
  }
  // The flight's path over the park, from where the chase leaves the toy to where the game finds it.
  _flyPts() {
    const THREE = this.THREE, h = this.home, fx = Math.sin(h.yaw), fz = Math.cos(h.yaw), sx = -fz, sz = fx, V = (x, y, z) => new THREE.Vector3(x, y, z);
    const rel = (back, side, up) => V(h.x - fx * back + sx * side, h.y + up, h.z - fz * back + sz * side);
    // (It leaves the toy the way the toy is going, and no faster, and passes it on the left; round the tree and up over
    // it; high over the museum's roofs, and over the top of its front, which stands 27 m; then down and round to the steps.)
    const p = this._chase(SWOOP + CHASE, V()), ax = Math.sin(this.carYaw), az = Math.cos(this.carYaw);
    return [V(p.x - ax * 6, p.y, p.z - az * 6), p, V(p.x + ax * 6 + az * 1.2, p.y + 1.6, p.z + az * 6 - ax * 1.2), V(357, 12, 9), V(344, 27, 13), V(285, 36, 55),
      V(170, 38, 100), V(74, 37, 113), V(24, 34, 119), V(-7, 20, 122), rel(30, 7.6, 8.6), rel(19, 1.8, 2.7), this.endAt.clone()];
  }
  // On a phone (where the streamer keeps only what is near on the graphics card): everything the flight will pass is
  // pinned there, and warmed while she is in her room and at her window (src/flywarm.js), so that the flight itself sends
  // nothing up. Every first drawing on the way was a frame the phone's screen did not show: three or four stood still
  // at once over the park, while the frame counter said 60.
  _warmFlight() {
    const G = this.G, S = G.stream; if (!S || !G.museum || !G.museum.renderer) return;
    try {
      const THREE = this.THREE, at = [], v = new THREE.Vector3();
      for (let T = 0; T <= SWOOP + CHASE; T += 0.25) at.push(this._chase(T, new THREE.Vector3()));
      const c = new THREE.CatmullRomCurve3(this._flyPts(), false, 'centripetal'); c.arcLengthDivisions = 600;
      const L = c.getLength(); for (let s = 0; s <= L; s += 6) at.push(c.getPointAt(Math.min(1, s / L), v).clone());
      const items = S.pinAlong(at), objs = items.map(it => it.o);
      // (and the park's features the toy will be among at the steps, built behind the loading bar but kept hidden until the toy comes near)
      const reveal = G.features && G.features.unseenNear ? G.features.unseenNear(this.home) : [];
      for (const r of reveal) r.traverse(o => { if (o.isMesh || o.isPoints || o.isLine || o.isSprite) objs.push(o); });
      let root = G.museum.group; while (root.parent) root = root.parent;
      const fg = G.museum.group.getObjectByName('features'), compile = fg ? [...fg.children] : [];
      this.warm = flyWarm(G.museum.renderer, root, objs, { budget: 5, reveal, compile, camera: this.camera });
      if (G.features && G.features.prebuild) G.features.prebuild(this.home);
    } catch (e) { console.warn('warm', e); this.warm = null; }
  }
  _fly() {
    const THREE = this.THREE, h = this.home, cam = this.camera;
    this.phase = 'fly'; this.tF = 0; this.len = this.calm ? CALM_FLY : FLY; this.fov0 = cam.fov; this.w = 0;
    this.from = cam.position.clone();
    const pts = this._flyPts(), V = (x, y, z) => new THREE.Vector3(x, y, z);
    this.curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
    this.curve.arcLengthDivisions = 1200;
    let run = 0; const a = V(), b = pts[0].clone(); for (let i = 1; i <= 24; i++) { this.curve.getPoint(i / 24 / (pts.length - 1), a); run += a.distanceTo(b); b.copy(a); }
    const L = this.curve.getLength();
    this.u0 = run / L;                                     // (the first stretch is only there to aim it)
    this.s0 = TOY.v * OVER / (L - run);                    // the toy's speed, as a share of the way a second
    this.toy = V(h.x, h.y + 0.3, h.z);
    if (!this.frozen) {
      if (this.calm) this.snd.wind(0, this.len - 0.4);
      else { this.snd.wind(0, SWOOP + 0.8); this.snd.wind(SWOOP + CHASE - 0.6, OVER + 0.2); this.snd.motif(SWOOP + CHASE + 0.4, { beat: 1.0, gain: 0.05 }); }
    }
  }
  // Where the camera rides behind the toy, T seconds into the flight: low at its shoulder, then back and up.
  _chase(T, out) {
    const d = this._dist(N.end - N.go + T), ax = Math.sin(this.carYaw), az = Math.cos(this.carYaw), k = span(T, SWOOP, SWOOP + CHASE);
    // (On its right at first: a tree 15 m along hangs its branches low over the left. Once that is behind, across its tail to the left,
    // the side the flight leaves by.)
    const x = span(T, SWOOP + CHASE - 1.7, SWOOP + CHASE), back = lerp(1.7, 2.7, k), up = lerp(0.8, 1.25, x), side = lerp(lerp(-1.5, -1.0, k), 1.1, x);
    return out.set(CAR.x + ax * (d - back) + az * side, this.carGround + up, CAR.z + az * (d - back) - ax * side);
  }
  // The camera T seconds into the flight: where it is (set), what it is turned to (into this._v), how wide (returned).
  _pose(T) {
    const cam = this.camera, ax = Math.sin(this.carYaw), az = Math.cos(this.carYaw), T1 = SWOOP + CHASE;
    const d = this._dist(N.end - N.go + T), lead = lerp(0.3, 2.2, span(T, SWOOP * 0.5, SWOOP + 2));
    const car = [CAR.x + ax * (d + lead), this.carGround + 0.3, CAR.z + az * (d + lead)];
    let fov = 56;
    if (T < T1) {
      this.w = 0; this._chase(T, cam.position);
      if (T < SWOOP) {                                         // (bowed down and a little north: there is a way through the branches there)
        const f = this.from, k = ease(T / SWOOP), bow = Math.sin(Math.PI * k), dx = cam.position.x - f.x, dz = cam.position.z - f.z, l = Math.hypot(dx, dz) || 1;
        cam.position.lerpVectors(f, cam.position, k); cam.position.x -= dz / l * 2.2 * bow; cam.position.y -= 2 * bow; cam.position.z += dx / l * 2.2 * bow;
        fov = lerp(this.fov0, 56, span(T, 0, SWOOP * 0.7));
      }
      return this._v.fromArray(car), fov;
    }
    const x = Math.min(1, (T - T1) / OVER), s0 = this.s0, w = this.w = Math.min(1, s0 * x + (3 - 2 * s0) * x * x + (s0 - 2) * x * x * x);
    this.curve.getPointAt(this.u0 + (1 - this.u0) * w, cam.position);
    // the toy as we leave it, the tree, the park, the museum, the toy again
    const toy = this.toy.toArray(), K = [[0, car], [0.025, car], [0.11, [352, 15, -3]], [0.25, [250, 12, 60]], [0.47, [100, 10, 105]], [0.71, toy], [0.93, toy], [1, this.endLook.toArray()]];
    let i = 0; while (i < K.length - 2 && w > K[i + 1][0]) i++;
    const k = ease((w - K[i][0]) / (K[i + 1][0] - K[i][0]));
    this._v.set(lerp(K[i][1][0], K[i + 1][1][0], k), lerp(K[i][1][1], K[i + 1][1][1], k), lerp(K[i][1][2], K[i + 1][1][2], k));
    return w < 0.9 ? lerp(56, 62, w / 0.9) : lerp(62, 70, ease((w - 0.9) / 0.1));
  }
  _flyFrame(dt) {
    const set = this.set, cam = this.camera, T = this.tF, len = this.len, T1 = SWOOP + CHASE;
    // (with less motion: three still pictures, cut together: the toy, the park, the steps)
    const at = this.calm ? (T < 1.5 ? SWOOP + 2.5 : T < 3.0 ? T1 + OVER * 0.58 : FLY) : Math.min(T, FLY);
    this._drive(N.end - N.go + at);
    const fov = this._pose(at);
    if (this.w >= 0.4) this._home();
    this._motor = !this.calm && !this.frozen && this.G.vehicle.kind === 'car' && at > SWOOP * 0.6 && at < T1 + 1.3 ? MOTOR : null;
    this._q.setFromRotationMatrix(this._m.lookAt(cam.position, this._v, this._up));
    if (this.calm || this.frozen || T < 0.02) this.cq.copy(this._q); else this.cq.slerp(this._q, 1 - Math.exp(-dt * 7));
    if (this.w >= 0.999) this.cq.copy(this._q);
    cam.quaternion.copy(this.cq);
    if (Math.abs(cam.fov - fov) > 0.01) { cam.fov = fov; cam.updateProjectionMatrix(); }
    // through the glass: the frost and her breath clear, her hands drop away, then the room is behind us
    const k = this.calm ? 0 : 1 - span(T, 0, 0.45); set.frost.material.opacity = 0.85 * k; set.breath.material.opacity = Math.min(set.breath.material.opacity, 0.95 * k);
    const inside = this._w.copy(cam.position); set.room.worldToLocal(inside);
    set.room.visible = !this.calm && inside.z > 0.03; this._window(set.room.visible ? 1 - span(T, 0, 0.3) : 0, false);
    if (T > len - 0.8) this.el.classList.add('out');
    if (T >= len && !this.frozen) this.finish(false);
  }

  // ------------------------------------------------------------------- each frame --

  frame(dt) {
    if (!this.on) return;
    // On the wall clock, but never more than a thirtieth of a second a frame: a frame that came late is a step on, not a
    // leap. On a slow phone the opening runs slower and stays smooth (the owner: better one frame a second than frames
    // skipped). Under 30 frames a second it lasts longer than it would; the sounds already set going keep their own time.
    const now = performance.now(), d = Math.min(1 / 30, (now - (this.last || now)) / 1000 || dt || 0); this.last = now;
    this.t += d;
    const G = this.G, set = this.set, cam = this.camera;
    cam.up.set(0, 1, 0);
    // the television, flickering along the hall
    const t = this.t; this._tv = this.calm ? 1 : 0.86 + 0.1 * Math.sin(t * 7.3) * Math.sin(t * 2.1) + 0.08 * Math.sign(Math.sin(t * 1.3 + Math.sin(t * 0.6) * 3));
    if (this.warm && !this.warm.done) this.warm.step();
    else if (this.warm && !this.warm.pre && this.phase === 'room') { this.warm.pre = true; const F = this.G.features; if (F && F.prewarm) F.prewarm(); }
    else if (this.warm && this.warm.pre === true && this.phase === 'room') { this.warm.pre = 2; if (this.G.makeVis) this.G.makeVis(); }      // (a frame later: one thing a frame)
    if (this.phase === 'room') {
      this._light(-1); this._lines(this.frozen ? 0 : d); this._aim(d, this.view, this.snap); this.snap = false; this._props(-1);
    } else if (this.phase === 'night') { if (!this.frozen) this.tB += d; this._nightFrame(d); }
    if (this.phase === 'fly') { if (!this.frozen) this.tF += d; this._flyFrame(d); }
    if (!this.on) return;
    set.twinkle(this.calm ? 0 : t);
    this._outside(d);
    // The world goes on round it, as on the title screen; the park is awake because the toy is down there in it.
    // (The snow falls in a block of air round the camera: while she is indoors, round a place out past the glass instead.)
    const air = set.room.visible ? this._air.copy(cam.position).addScaledVector(this._out, 44) : cam.position;
    if (G.museum) { G.museum.update(dt, cam.position, null, air); G.museum.winter.update(dt, G.t, cam.position, null, G.set.reduce); }
    if (G.features && !this.home.back) G.features.update(dt, true);
    if (G.vehicle) G.vehicle.sync(dt);
    this.sound.update(this.phase === 'fly' ? this._motor : null, this.phase === 'fly' && !!this._motor);
  }

  /** (tests) Stop the clock at t seconds of the night or the flight, or at card t with its last line shown (or line `line`). */
  seek(phase, t, line) {
    if (!this.on) return;
    this.frozen = true;
    if (phase === 'room') { this.phase = 'room'; this._card(t); this.pre = 0; const to = Math.min(line == null ? 99 : line, CARDS[t].lines.length - 1); while (this.li < to) { this._line(); this._typed(); } this._fade(false, true); return; }
    if (this.phase === 'room') this._night();
    if (phase === 'night') { this.tB = t; return; }
    this.tB = N.end; this._nightFrame(0); if (this.phase !== 'fly') this._fly(); this._fade(false, true); this.tF = t;
  }

  /** Hand over: skipped or run to the end. */
  finish(skipped) {
    if (!this.on) return;
    this.on = false;
    for (const k of ['keydown', 'pointerdown']) removeEventListener(k, this._input, { capture: true });
    const G = this.G;
    this.snd.stop();
    if (G.stream) G.stream.release();
    if (G.features && G.features.prebuild) G.features.prebuild(null);
    this._home();
    if (!G.lampOn) { G.lampOn = true; if (G.lamp) G.lamp.intensity = 70; const b = document.getElementById('bLights'); if (b) b.setAttribute('aria-pressed', 'true'); }
    if (skipped) this.sound.tick(0.08, 2200, 0.03);
    if (this.car) { this.car.removeFromParent(); this.car = null; for (const d of this.dim.values()) d.dispose(); this.dim.clear(); this.tint = []; }
    if (this.set) { this.set.dispose(); this.set = null; }
    this.curve = null; this.keys = null; this.pulses = [];
    this.el.hidden = true; this._hush(true); this._fade(false, true);
    this.skipped = skipped;
    const took = this.t, done = this.done; this.done = null;
    if (done) done(took);
  }
}
