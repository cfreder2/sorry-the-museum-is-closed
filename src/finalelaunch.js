// Project Green Cheese, phase 3: the five notes, the tractor beam and the launch (docs/FINALE.md, beats 4 to 6).
//
// The tone console in the control room (src/finale.js draws it and calls G.finale.console.onUse; this file sets it).
//   * The five notes. The craft plays the start of its call (src/motif.js) and you play it back, Simon-style, on the
//     console's five pads (or keys 1 to 5, or the five big buttons at the foot of the screen). Three phrases, each
//     longer and faster: three notes, four, then the whole call with its held last note. Each one right, and the
//     hangar and the saucer's rim answer in the notes' colours, and the archive's pictures light up on their easels,
//     one to a note, in time. A wrong note: a soft sour chord, and the same phrase again. Nothing is ever lost.
//     Done, the finale's state is 'played' (saved): a reload picks up at the beam.
//   * The beam. The ramp comes up and the saucer lifts off its cradle. A beam reaches out through the archive door
//     and takes the lit pictures one by one up into the craft; then a few books from the reading room and whatever
//     lost property you handed in. Then a cue, and it is your turn: down to the hangar floor, and the beam takes the
//     toy too (the car rides up it; the drone flies up and docks).
//   * The launch, a cinematic you can skip (a key, or SKIP): sirens and amber lamps, the silo doors part and snow
//     pours down the shaft, the platform carries the saucer up and out over Butler Field, it hangs over the lake a
//     moment, then streaks up. The state is 'launched' (saved) and the voyage takes over: startVoyage (src/voyage.js)
//     with the cargo: { arts: work records, books, items: [{ kind, name }] }. A reload in 'launched' goes straight
//     back to the voyage (src/voyage.js resumeVoyage, or from the cargo kept here if the voyage had not yet saved).
//
// Nothing here is built or run until the base is: then only while one of these is going on, and its few meshes are
// built as each part begins. The music is the game's own (src/motif.js); the call is original.
//
// For tests: G.finale.launch = { open(), press(i), skip(), beam(), mode, run, phrase, cargo, want }.

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { feature, features } from './features.js';
import { MOTIF, motifVoice, hz } from './motif.js';
import { KINDS } from './lostfound.js';
import { loadBooks, booksFor } from './books.js';
import { startVoyage, voyageSaved, voyageFinished } from './voyage.js';
import * as TX from './textures.js';

const KEY = 'after-hours.launch';                                  // { toy, cargo }: kept at the launch, for a reload before the voyage saves
const ORDER = ['locked', 'found', 'played', 'launched', 'landed', 'opened'];
const past = (s, t) => ORDER.indexOf(s) >= ORDER.indexOf(t);
// The three phrases: how many notes of the call, and how quick (seconds a beat). The last is the whole call.
const PHRASES = [{ n: 3, beat: 0.62 }, { n: 4, beat: 0.5 }, { n: 5, beat: 0.42 }];
const LIFT = 1.6;                                                  // how far the craft hovers off its cradle while the beam works
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const ease = t => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };
const easeIn = t => { t = Math.max(0, Math.min(1, t)); return t * t; };
const easeOut = t => { t = Math.max(0, Math.min(1, t)); return 1 - (1 - t) * (1 - t); };
const COL = MOTIF.map(n => new THREE.Color(n.colour));
const AMBER = new THREE.Color(2.6, 1.3, 0.15), WHITE = new THREE.Color(1, 1, 1);

const CSS = `
body.fcine #hud > :not(#toast):not(#trick) { display: none !important; }
#tones { position: fixed; left: 0; right: 0; bottom: max(14px, env(safe-area-inset-bottom)); z-index: 25; display: flex; flex-direction: column; align-items: center; gap: 10px; pointer-events: none; padding: 0 12px; user-select: none; -webkit-user-select: none; }
#tones[hidden], #fskip[hidden] { display: none; }
#tones .tsay { font: 600 13px var(--mono, ui-monospace, monospace); letter-spacing: .12em; text-transform: uppercase; color: var(--gilt, #e2cd94); background: rgba(4,5,9,.7); padding: 5px 14px; border-radius: 8px; min-height: 1.4em; text-align: center; max-width: 92vw; }
#tones .tpads { display: flex; gap: clamp(8px, 2.4vw, 18px); pointer-events: auto; }
#tones .tpads button { width: clamp(56px, 15vw, 92px); height: clamp(56px, 15vw, 92px); border-radius: 50%; border: 3px solid rgba(255,255,255,.28); background: var(--c); opacity: .42; color: #0b0d12; font: 700 15px var(--mono, ui-monospace, monospace); touch-action: manipulation; transition: opacity .08s, transform .08s, box-shadow .12s; padding: 0; }
#tones .tpads button.lit, #tones .tpads.wait button.lit { opacity: 1; transform: scale(1.07); box-shadow: 0 0 30px var(--c); border-color: #fff; }
#tones .tpads.wait button { opacity: .25; }
#tones .tpads button kbd { background: rgba(255,255,255,.55); color: #111; border-color: rgba(0,0,0,.35); }
.touch #tones kbd, .pad #tones kbd { display: none; }
#tones .tpads button.sel { outline: 3px solid #fff; outline-offset: 4px; }
#tones .tleave, #fskip { position: fixed; pointer-events: auto; height: 40px; padding: 0 16px; border-radius: 8px; border: 1px solid rgba(226,205,148,.55); background: rgba(8,9,14,.66); color: var(--gilt, #e2cd94); font: 700 12px var(--mono, ui-monospace, monospace); letter-spacing: .12em; z-index: 26; }
#tones .tleave { top: max(14px, env(safe-area-inset-top)); left: max(14px, env(safe-area-inset-left)); }
#fskip { right: max(16px, env(safe-area-inset-right)); bottom: max(16px, env(safe-area-inset-bottom)); }
#fskip kbd { margin-left: 6px; font-size: 10px; padding: 1px 5px; }
.touch #fskip kbd { display: none; }
#ffade { position: fixed; inset: 0; background: #000; opacity: 0; pointer-events: none; transition: opacity .9s ease; z-index: 24; }
#ffade.white { background: #f4f7ff; }
/* Reduce motion: the fade is a slow dip to dark. Never a cut (style.css turns transitions off under .reduce: a hard flash), and never to white. */
.reduce #ffade { transition: opacity .9s linear !important; }
.reduce #ffade.white { background: #0a0c12; }
@media (max-height: 430px) { #tones { gap: 6px; } #tones .tsay { font-size: 11px; padding: 3px 10px; } }
`;

feature({
  id: 'finalelaunch',

  init(k) {
    this.k = k; this.fin = features.find(f => f.id === 'finale');
    if (!this.fin || !this.fin.F) { this.fin = null; return; }
    this.run = null;          // 'tones' | 'beam' | 'cue' | 'take' | 'launch' while something is going on
    this.mode = null;         // in the tones: 'call' | 'echo' | 'sour' | 'answer'
    this.phrase = 0; this.idx = 0; this.lit = 0;
    this.q = []; this.clock = 0; this.tw = []; this.flights = [];
    this.padK = [0, 0, 0, 0, 0]; this.rim = { mode: 'chase', c: new THREE.Color(), k: 0 };
    this.booted = false; this.hooked = false; this.autoTried = false; this.artGone = false;
    this.cargo = { arts: [], books: [], items: [] };
    this.hold = (dt, inp) => this._hold(dt, inp);
    const me = this;
    k.G.finale.launch = {
      open: () => this.use(), press: i => this.press(i), skip: () => this.skip(), beam: () => this.startBeam(),
      get run() { return me.run; }, get mode() { return me.mode; }, get phrase() { return me.phrase; }, get idx() { return me.idx; },
      get want() { return me.mode === 'echo' ? me.idx < PHRASES[me.phrase].n ? me.idx : null : null; }, get cargo() { return me.cargo; }, get lit() { return me.lit; },
      get flights() { return me.flights.map(f => f.kind + ' ' + f.obj.position.toArray().map(v => v.toFixed(1)).join(',') + (f.obj.visible ? '' : ' hidden')); },
    };
  },

  // Asleep until the base is built; then only while something is going on (or there is something to set up once).
  active(k) {
    if (!this.fin) return false;
    if (this.run || !this.booted || this.q.length) return true;
    if (!this.fin.built) return false;
    if (!this.hooked) return true;
    const st = this.fin.save.state, vis = this.fin.baseG && this.fin.baseG.visible;
    return !!vis && ((st === 'played' && !this.autoTried) || (past(st, 'launched') && !this.artGone));
  },

  update(dt, k) {
    const G = k.G, fin = this.fin, st = fin.save.state;
    // Once, at the start of a game: a launch that happened but whose voyage never got going (the page left in between).
    if (!this.booted) {
      this.booted = true;
      if (st === 'launched' && G.mode === 'explore' && !G.voyage && !voyageSaved()) {
        let s = null; try { s = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { /* none */ }
        if (s && s.cargo) { setTimeout(() => { if (!G.voyage && G.state === 'play') startVoyage(G, { cargo: s.cargo, toy: s.toy || G.vehicle.kind, stage: 'space' }); }, 0); return; }
      }
    }
    if (!fin.built) return;
    if (!this.hooked) this._hook(k);
    if (!this.run) {
      if (st === 'played' && !this.autoTried && /^B-(ctrl|hangar|archive)$/.test(G.roomId || '')) { this.autoTried = true; this._after(1.2, () => { if (!this.run && fin.save.state === 'played') this.startBeam(); }); }
      if (past(st, 'launched')) this._artGone();
      if (!this.q.length) return;
    }
    // The clock, the queue of things to happen, the things in motion.
    this.clock += dt;
    while (this.q.length && this.q[0].t <= this.clock) this.q.shift().fn();
    for (let i = this.tw.length - 1; i >= 0; i--) { const w = this.tw[i]; w.t += dt; const u = Math.min(1, w.t / w.dur); w.fn(u, dt); if (u >= 1) { this.tw.splice(i, 1); if (w.done) w.done(); } }
    if (this.flights.length) this._fly(dt);
    // The pads fade, the rim answers.
    for (let i = 0; i < 5; i++) {
      if (this.padK[i] > 0) { this.padK[i] = Math.max(0, this.padK[i] - dt * 2.2); }
      const p = this.consoleApi && this.consoleApi.pads[i]; if (p) p.light(Math.max(this.padK[i], this.run === 'tones' && this.mode === 'echo' ? 0.12 : 0.04));
    }
    this.rim.k = Math.max(0, this.rim.k - dt * 1.6);
    if (this.beam) this._beamTick(dt);
    if (this.cam) { this.cam.t += dt; G.cineEye = this.cam.fn(this.cam.t); }
    if (this.run === 'cue') this._cueTick(dt, k);
    if (this.run === 'launch' || this.run === 'take') this._launchTick(dt, k);
  },

  // ---------------------------------------------------------------- the console wakes with the base
  _hook(k) {
    this.hooked = true;
    const fin = this.fin, c = this.consoleApi = fin.consoleApi;
    this.hangar = fin.hangar;
    if (c) c.onUse = () => this.use();
    const me = this;
    if (this.hangar) this.hangar.rim.colour((i, t) => me._rimColour(i, t));
    if (fin.save.state === 'played') { this._screen(['CRAFT: AWAKE', 'USE TO CALL IT']); for (const e of this._easels()) e.light(1); this.lit = 12; }
    else if (past(fin.save.state, 'launched')) this._screen(['CRAFT: AWAY', 'LUNAR BASE']);
  },
  // Whatever is pressed at the console.
  use() {
    const k = this.k, st = this.fin.save.state;
    if (this.run === 'cue') { k.say('Down to the hangar floor, into the beam.', 4); return; }
    if (this.run) return;
    if (!this.fin.built) this.fin._build();
    if (!this.hooked) this._hook(k);
    if (st === 'played') { this.startBeam(); return; }
    if (past(st, 'launched')) {
      // A voyage flown home before the Moon museum had opened (older builds offered Fly home too soon): the craft is back and
      // still loaded, and nothing else would ever start it again. The console sends it back up.
      const G = k.G, s = voyageSaved();
      if (s && s.stage === 'home' && !voyageFinished() && !G.voyage) { k.say('The craft is still loaded. Off it goes again.', 3); this._after(1.6, () => { if (!G.voyage && G.state === 'play') startVoyage(G, { cargo: s.cargo, toy: G.vehicle.kind, stage: 'space' }); }); return; }
      k.say('The pads are dark. The craft is resting.', 4); return;
    }
    if (!this.consoleApi) { k.say('Five pads, dark. Nothing answers.', 4); return; }
    this.openTones();
  },

  // ---------------------------------------------------------------- the five notes
  openTones() {
    const k = this.k, G = k.G;
    this._ui();
    this.run = 'tones'; this.mode = null; this.idx = 0;
    this._grip(true);
    this.tonesEl.hidden = false; document.body.classList.add('fcine');
    this._say(this.phrase ? 'Again, from where you were.' : 'Listen.');
    this._screen(['CRAFT: LISTENING', `PHRASE ${this.phrase + 1} OF 3`]);
    this._consoleCam();
    this._after(1.0, () => this._call());
    k.once('finale-tones', G.story && G.story.heard ? 'Five pads. You know this tune: the mice, the snow.' : 'Five pads. The craft has something to say.', 5);      // (src/story.js: heard on the way here)
    void G;
  },
  closeTones(why) {
    if (this.run !== 'tones') return;
    this.run = null; this.mode = null; this.q.length = 0;
    this.tonesEl.hidden = true; document.body.classList.remove('fcine');
    this._grip(false); this.cam = null; this.k.G.cineEye = null; this._chair(true);
    if (why) this.k.say(why, 3);
  },
  _consoleCam() {
    const c = this.consoleApi.position, m = this.consoleApi.mark;
    // From behind where the toy stands: the pads and the screen, the window, and the craft beyond it. (The big chair is put
    // away while you play, as the furniture is while you read a board: it stands right in the way.)
    const at = V(c.x, c.y + 2.1, c.z - 1.05), look = V(m.x - 1.2, -16.4, 176);
    this.cam = { t: 0, fn: () => ({ at, look, fov: 60 }) };
    this._chair(false);
  },
  _chair(on) { if (this.fin.chair) this.fin.chair.visible = on; },
  _call() {
    const P = PHRASES[this.phrase];
    this.mode = 'call'; this.idx = 0; this._padsWait(true);
    this._say(`Phrase ${this.phrase + 1} of 3 · listen`);
    this._screen(['CRAFT: CALLING', `PHRASE ${this.phrase + 1} OF 3`]);
    let t = 0;
    for (let i = 0; i < P.n; i++) { const dur = MOTIF[i].beats * P.beat; this._after(t, () => this._note(i, dur, true)); t += Math.max(dur, P.beat); }
    this._after(t + 0.1, () => { this.mode = 'echo'; this.idx = 0; this._padsWait(false); this._say(`Your turn · ${P.n} notes`); this._screen(['YOUR TURN', `${P.n} NOTES`]); });
  },
  press(i) {
    if (this.run !== 'tones' || i < 0 || i > 4) return;
    if (this.mode !== 'echo') return;
    const P = PHRASES[this.phrase], want = this.idx;
    if (i !== want) {
      this._note(i, 0.3, false);
      this.mode = 'sour'; this._padsWait(true);
      this._after(0.22, () => this._sour());
      this._say('Not quite. Again.');
      this._screen(['NOT QUITE', 'AGAIN']);
      this._after(2.0, () => this._call());
      return;
    }
    this._note(i, i === 4 ? 1.1 : 0.34, false);
    this.idx++;
    if (this.idx < P.n) return;
    this.mode = 'answer'; this._padsWait(true);
    this._after(0.45, () => this._answer());
  },
  // Right: the craft plays the phrase back, and the hangar, the rim and the archive answer in colour, a picture to a note.
  _answer() {
    const k = this.k, G = k.G, P = PHRASES[this.phrase], last = this.phrase === PHRASES.length - 1;
    this._say(last ? 'It knows you.' : 'Yes.');
    this._screen(last ? ['CRAFT: AWAKE', 'HELLO'] : ['ANSWERED', `PHRASE ${this.phrase + 2} OF 3`]);
    if (G.lights && G.lights.active) for (const id of ['B-hangar', 'B-archive']) if (!G.lights.isOn(id)) G.lights.set(id, true);
    this._answerCam(this.phrase);
    const easels = this._easels();
    let t = 0.6;
    for (let i = 0; i < P.n; i++) {
      const dur = MOTIF[i].beats * P.beat * 1.15, e = easels[this.lit + i];
      this._after(t, () => { this._note(i, dur, true, true); if (e) this._lightEasel(e, i); });
      t += Math.max(dur, P.beat * 1.15);
    }
    this.lit += P.n;
    if (!last) {
      this._after(t + 1.1, () => { if (this.run !== 'tones') return; this.phrase++; this._consoleCam(); this._after(0.7, () => this._call()); });
      return;
    }
    // The whole call: it is awake.
    this._after(t + 0.4, () => { this.rim.mode = 'bands'; k.sound.finish && k.sound.finish(); });
    this._after(t + 1.8, () => {
      this.fin.setState('played'); this.autoTried = true;
      this.tonesEl.hidden = true; this.run = null; this.mode = null; this._chair(true);
      this.startBeam(true);
    });
  },
  _answerCam(p) {
    // Across the hangar from its south-east corner: the craft on the right, the archive through its door on the left.
    const shots = [
      [V(404.5, -15.0, 161.4), V(385, -16.6, 179.5), 62],            // in the archive, along the easels
      [V(407.6, -15.6, 170.0), V(380, -16.6, 178.5), 62],            // from its door
      [V(440, -14.0, 194.5), V(400, -16.4, 176), 46],                // across the hangar: the craft, and the archive through its door
    ];
    const [at, look, fov] = shots[p] || shots[0], at2 = at.clone().add(V(-0.8, 0.1, -0.6));
    this.cam = { t: 0, fn: t => ({ at: this.k.G.set.reduce ? at : at.clone().lerp(at2, ease(t / 6)), look, fov }) };
  },
  // One note: its pad, its colour on the rim and in the hangar, its sound. `craft`: the craft's own voice (louder, ringing).
  _note(i, dur, craft, answer = false) {
    const k = this.k;
    this.padK[i] = 1;
    const b = this.tonesEl && this.tonesEl.querySelector(`[data-tone="${i}"]`);
    if (b) { b.classList.add('lit'); clearTimeout(b._t); b._t = setTimeout(() => b.classList.remove('lit'), Math.max(160, dur * 800)); }
    this.rim.mode = 'flash'; this.rim.c.copy(COL[i]); this.rim.k = craft ? 1 : 0.6;
    if (answer) { const t = k.tint('B-hangar'); if (t) { t.set(WHITE.clone().lerp(COL[i], 0.55), 0.08); clearTimeout(this._tintT); this._tintT = setTimeout(() => t.off(0.9), Math.max(250, dur * 900)); } }
    const out = this._out(); if (!out) return;
    const c = this.k.sound.ctx;
    motifVoice(c, out, MOTIF[i].midi, c.currentTime + 0.005, dur, craft ? 0.07 : 0.05);
    if (craft && answer) motifVoice(c, out, MOTIF[i].midi - 12, c.currentTime + 0.005, dur, 0.03);
  },
  // A gentle sour chord: a cluster round the D, soft and low.
  _sour() {
    const out = this._out(); if (!out) return;
    const c = this.k.sound.ctx, t = c.currentTime;
    for (const m of [61, 62, 66.5]) {
      const o = c.createOscillator(), f = c.createBiquadFilter(), g = c.createGain();
      o.type = 'triangle'; o.frequency.value = hz(m - 12); f.type = 'lowpass'; f.frequency.value = 900;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.03, t + 0.06); g.gain.setTargetAtTime(0.0001, t + 0.35, 0.25);
      o.connect(f); f.connect(g); g.connect(out); o.start(t); o.stop(t + 1.6);
    }
  },
  _easels() {
    if (this._order) return this._order;
    const h = this.fin.hangar, list = h ? h.easels.slice() : [];
    // Nearest the hangar first, from the middle of the room out.
    list.sort((a, b) => (b.position.x - a.position.x) || (Math.abs(a.position.z - 176) - Math.abs(b.position.z - 176)));
    return (this._order = list);
  },
  _lightEasel(e, i) {
    this.tw.push({ t: 0, dur: 0.5, fn: u => e.light(ease(u)) });
    this._pools();
    const n = this._easels().indexOf(e); if (n >= 0 && this.poolMesh) { this.poolOn[n] = i; this._poolsTo(n, 1); }
  },
  // A pool of the note's colour on the floor in front of each lit picture.
  _pools() {
    if (this.poolMesh) return;
    const E = this._easels(), n = E.length; if (!n) return;
    const m = this.poolMesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: TX.radial(0, 1.4), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3, fog: false }), n);
    const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion().setFromAxisAngle(V(1, 0, 0), -Math.PI / 2), S = V(2.6, 2.6, 1), c = new THREE.Color(0, 0, 0);
    E.forEach((e, i) => { m.setMatrixAt(i, M4.compose(V(e.position.x + 0.9, this.fin.F.fl + 0.015, e.position.z), Q, S)); m.setColorAt(i, c); });
    m.frustumCulled = false; m.renderOrder = 5; this.fin.baseG.add(m);
    this.poolOn = new Array(n).fill(-1);
  },
  _poolsTo(n, k2) {
    const m = this.poolMesh; if (!m) return;
    const i = this.poolOn[n]; const c = i >= 0 ? COL[i].clone().multiplyScalar(0.42 * k2) : new THREE.Color(0, 0, 0);
    m.setColorAt(n, c); m.instanceColor.needsUpdate = true;
  },

  // ---------------------------------------------------------------- the beam
  startBeam(now = false) {      // (not async: nothing in it waits, and a throw after it had gripped the toy was an unhandled rejection that nothing let go of)
    const k = this.k, G = k.G, h = this.hangar || (this.hangar = this.fin.hangar);
    if (this.run && this.run !== 'tones') return;
    if (!this.hooked) this._hook(k);
    this.run = 'beam'; this.mode = null; this.q.length = 0; this.tw.length = 0;
    this._ui(); this._grip(true);
    document.body.classList.add('fcine'); this.tonesEl.hidden = true; this.skipEl.hidden = false;
    if (G.lights && G.lights.active) for (const id of ['B-hangar', 'B-archive']) if (!G.lights.isOn(id)) G.lights.set(id, true);
    for (const e of this._easels()) e.light(1);
    this.lit = this._easels().length; this.rim.mode = 'bands';
    this._screen(['CRAFT: AWAKE', 'LOADING']);
    // The cargo: the pictures on the easels (public domain only, counted when the beam reaches them), a few books about
    // them, what you handed in.
    this.cargo = { arts: [], books: [], items: this._items() }; this.beamArts = null; this.waitArt = 0;
    // The craft wakes: the ramp in, the lift off its cradle, a hum.
    const d0 = now ? 0.6 : 0.2;
    this._shot('wake');
    this._after(d0, () => { h.ramp.raise(); this._hum(1); k.say('It wakes.', 3); });
    this._after(d0 + 1.9, () => this.tw.push({ t: 0, dur: 2.2, fn: u => h.craft.set(LIFT * ease(u)) }));
    this._after(d0 + 4.3, () => { this._beamOn(); this._shot('archive'); this._artsUp(); });
  },
  _cargoArts() {
    const arts = this.beamArts = this._easels().filter(e => e.art.work && !e.art.work.c && e.art.mesh.visible);
    this.cargo.arts = arts.map(e => compact(e.art.work));
    loadBooks().then(B => { if (B && !this.cargo.books.length) this.cargo.books = pickBooks(B, arts.map(e => e.art.work)); }).catch(() => {});
    return arts;
  },
  // The pictures, one by one (waiting a moment for them, if they have only just been hung).
  _artsUp() {
    const arts = this._cargoArts();
    if (!arts.length && ++this.waitArt < 12) { this._after(0.5, () => this._artsUp()); return; }
    let t = 0.9;
    arts.forEach((e, n) => { this._after(t, () => this._liftArt(e, n)); t += n < 4 ? 1.15 : 0.8; });
    this._after(0.9 + Math.min(4, arts.length) * 1.15 + 0.4, () => this._shot('stream'));
    this._after(t + 1.4, () => this._cargoIn());
  },
  _cargoIn() {
    const k = this.k, books = this.cargo.books, items = this.cargo.items;
    this._aimAt(V(386, this.fin.F.fl + 0.6, 176));
    let t = 0;
    if (books.length) { this._after(0, () => k.say('Books from the reading room.', 3)); books.forEach((b, i) => { this._after(t, () => this._liftThing('book', b, i)); t += 0.32; }); t += 1.0; }
    if (items.length) { this._after(t, () => k.say(items.length === 1 ? 'And the lost thing you handed in.' : 'And the lost property you handed in.', 3.5)); items.forEach((it, i) => { this._after(t, () => this._liftThing('item', it, i)); t += 0.28; }); t += 1.0; }
    this._after(t + 1.6, () => this._cue());
  },
  // The cue: the beam turns down under the craft and waits. Your turn.
  _cue() {
    const k = this.k, G = k.G, F = this.fin.F;
    this.flights.length = 0;
    this.run = 'cue'; this.skipEl.hidden = true;
    this._aimAt(V(F.cx, F.fl, F.cz));
    this.cam = null; G.cineEye = null; document.body.classList.remove('fcine');
    this._grip(false);
    this._screen(['PASSENGER', 'HANGAR FLOOR']);
    const out = this._out(); if (out) { const c = k.sound.ctx; motifVoice(c, out, MOTIF[3].midi, c.currentTime + 0.05, 0.42, 0.07); motifVoice(c, out, MOTIF[4].midi, c.currentTime + 0.47, 1.4, 0.07); }
    k.callout('YOUR TURN');
    k.say('It wants you too. Down to the hangar floor, into the beam.', 0.6, 7);
    this.mark = { x: F.cx - 6, y: F.fl, z: F.cz, colour: '#d78cff', ring: true };
    G.mapMarks = [...(G.mapMarks || []), this.mark];
  },
  _cueTick(dt, k) {
    const v = k.v, p = v.pos, H = this.hangar.hangarRoom;
    if (!H || p.x < H.x0 + 0.3 || p.x > H.x1 - 0.3 || p.z < H.z0 + 3.2 || p.z > H.z1 - 0.3 || p.y > H.y + 3.4 || p.y < H.y - 0.5) return;
    if (this.mark) { k.G.mapMarks = (k.G.mapMarks || []).filter(m => m !== this.mark); this.mark = null; }
    this._take(v);
  },
  // The beam takes the toy: the car rides up it, turning slowly; the drone flies up it and docks.
  _take(v) {
    const k = this.k, G = k.G, port = this.hangar.beamOrigin.clone();
    this.run = 'take'; this.toy = v.kind === 'drone' ? 'drone' : 'car';
    this._grip(true); document.body.classList.add('fcine'); this.skipEl.hidden = false;
    const from = v.pos.clone(), yaw0 = v.yaw, dur = this.toy === 'drone' ? 2.3 : 3.2;
    this._aimAt(from, 0.5);
    // the camera stands in the corner of the hangar nearest the toy (but not on top of it), low, and watches it go up
    const H = this.hangar.hangarRoom, y = H.y + 1.6;
    const corners = [V(H.x0 + 3, y, H.z1 - 2.5), V(449.5, y, H.z1 - 2.5), V(H.x0 + 3, y, H.z0 + 5.5), V(448.5, y + 0.6, H.z0 + 5.5)];
    let at = corners[0], best = 1e9;
    for (const c of corners) { const d = Math.hypot(c.x - from.x, c.z - from.z); const score = d < 7 ? 1e6 - d : d; if (score < best) { best = score; at = c; } }
    this.cam = { t: 0, fn: t => ({ at, look: from.clone().lerp(port, 0.2 + 0.55 * ease(t / (dur + 0.7))), fov: 58 }) };
    this.toyPath = { from, port, yaw0, t: -0.7, dur };
    this._say(null);
    k.sound.tick(0.08, 900, 0.06);
  },

  // ---------------------------------------------------------------- the launch
  _launch() {
    const k = this.k, G = k.G, h = this.hangar, F = this.fin.F;
    this.run = 'launch'; this.lt = 0; this.lphase = -1;
    this.toyPath = null;
    const v = G.vehicle; v.group.visible = false; this._shadow(v, false);
    this._beamOff();
    this.rimOwn = false;
    this._snow(); this._amber(true);
    this._sirens(true);
    // The script: [when, what]. Times in seconds from now.
    this.script = [
      [0.0, () => this._shot('hangarUp')],
      [0.6, () => h.doors.open(5.2)],
      [1.8, () => { this.snowT = 0; this.snowM.visible = true; }],
      [5.6, () => { this._shot('field'); this.rise = 0; }],
      [11.2, () => { this._shot('over'); this._flyFree(); }],
      [16.8, () => { this._shot('lake'); this._sirens(false); }],
      [19.3, () => this._callOver()],
      [23.2, () => { this.streak = 0; this._swell(); }],
      [26.2, () => this._fade(true, true)],
      [27.4, () => this._toVoyage()],
    ];
  },
  _launchTick(dt, k) {
    const h = this.hangar, F = this.fin.F, G = k.G, v = G.vehicle;
    // the toy on its way up the beam
    if (this.run === 'take' && this.toyPath) {
      const P = this.toyPath; P.t += dt;
      const u = Math.max(0, P.t) / P.dur;
      this._aimAt(v.pos, 0.25);
      if (P.t > 0) {
        const e = this.toy === 'drone' ? ease(u) : easeIn(u) * 0.35 + ease(u) * 0.65;
        const lift = Math.sin(Math.min(1, u) * Math.PI) * 0.6;
        v.pos.lerpVectors(P.from, P.port, e); v.pos.y += lift * (1 - u) - (this.toy === 'drone' ? 0 : 0.15 * u);
        if (this.toy === 'car') { v.yaw = P.yaw0 + u * 2.6; v.tilt = Math.sin(u * 5) * 0.12; } else { v.yaw = P.yaw0 + ease(u) * 0.8; }
        v.sync(0);
      }
      if (u >= 1) {
        v.group.visible = false; this._shadow(v, false);
        this._portFlash(); k.sound.bump && k.sound.bump(this.toy === 'drone' ? 2.4 : 3.2);
        if (this.toy === 'drone') k.sound.bell && k.sound.bell(880, 0, 0.04, 1.2);
        this.toyPath = null;
        this._after(0.9, () => this._launch());
      }
      return;
    }
    if (this.run !== 'launch') return;
    this.lt += dt;
    while (this.script.length && this.script[0][0] <= this.lt) this.script.shift()[1]();
    if (this.run !== 'launch') return;
    // amber lamps and the hangar wash, flashing
    if (this.amberOn) {
      // (Reduce motion: the amber is on and steady, the lamps round the silo too. It does not flash.)
      const calm = !!G.set.reduce, on = calm || Math.sin(this.lt * 7.5) > 0;
      if (on !== this._amb) { this._amb = on; for (const b of this.fin.beacons || []) b.material.color.copy(on ? AMBER : new THREE.Color(0.4, 0.22, 0.04)); const t = k.tint('B-hangar'); if (t && this.lt < 11) t.set(on ? 0xffc27a : 0xffe6c8, 0.15); }
      if (this.ambG) this.ambG.children.forEach((s, i) => { const q = calm ? 0.6 : 0.5 + 0.5 * Math.sin(this.lt * 5 - i * 0.8); s.material.opacity = 0.25 + 0.75 * q; });
    }
    if (this.snowT != null) { this.snowT += dt; this.snowM.material.uniforms.t.value = this.snowT; if (this.snowT > 14) { this.snowM.visible = false; this.snowT = null; } }
    // up the shaft on the platform
    if (this.rise != null && this.rise < 1) {
      this.rise = Math.min(1, this.rise + dt / 5.4);
      h.platform.set((-F.platformTop) * ease(this.rise));
    }
    // free of the platform: up, out over the field, over the lake; then up and away
    if (this.free) this._freeTick(dt);
    // the toy goes where the craft goes, inside it
    const s = h.saucer.position; v.pos.set(s.x, s.y + 2.9, s.z); v.vel.set(0, 0, 0);
    this._rimOwn(true);
  },
  _flyFree() {
    const h = this.hangar, s = h.saucer, F = this.fin.F;
    // From here the craft is moved by itself, not with its collision (nobody can drive into it up there): out of the base's
    // group, so that it is drawn wherever the camera has got to.
    this.root().attach(s);
    const p0 = s.position.clone();
    this.free = { t: 0, p0, path: [p0, V(p0.x + 8, 26, p0.z - 4), V(520, 40, 158), V(598, 44, 146)] };
    void F;
  },
  _freeTick(dt) {
    const f = this.free, s = this.hangar.saucer; f.t += dt;
    const [a, b, c, d] = f.path, t = f.t;
    if (t < 3) { const u = ease(t / 3); s.position.lerpVectors(a, b, u); }
    else if (t < 8) { const u = ease((t - 3) / 5); bez(s.position, b, c, d, u); }
    else if (this.streak == null) { s.position.copy(d); s.position.y += Math.sin((t - 8) * 2.2) * 0.35; }
    if (this.streak != null) {
      this.streak += dt;
      const u = this.streak, rise = 14 * u * u * u + 4 * u * u;
      s.position.set(d.x + u * 6, d.y + rise * (1 + u * 3), d.z - u * 4);
      if (this.trail) { this.trail.visible = true; const L = Math.min(260, 6 + rise * 0.9); this.trail.scale.set(1 + u * 1.5, L, 1 + u * 1.5); this.trail.position.copy(s.position); this.trail.material.opacity = Math.min(1, u * 2); }
      if (this.flare) { this.flare.visible = true; this.flare.position.copy(s.position).add(V(0, 2.5, 0)); const g = 8 + u * 30; this.flare.scale.set(g, g, 1); }
      this._humTo(55 + u * 300, 0.04);
    }
    s.rotation.y += dt * (0.4 + (this.streak || 0) * 3);
    s.updateMatrixWorld(true);
  },
  _toVoyage() {
    const k = this.k, G = k.G, v = G.vehicle, toy = this.toy || v.kind;
    this.fin.setState('launched');
    try { localStorage.setItem(KEY, JSON.stringify({ toy, cargo: this.cargo })); } catch { /* fine */ }
    this._reset();
    v.group.visible = true; this._shadow(v, true);
    const H = this.hangar.hangarRoom; if (v.kind === 'drone') v.place(H.x0 + 4, (H.z0 + H.z1) / 2, Math.PI / 2, H.y + 0.6); else v.place(H.x0 + 4, (H.z0 + H.z1) / 2, Math.PI / 2, H.y);
    startVoyage(G, { cargo: this.cargo, toy, stage: 'space' });
    setTimeout(() => this._fade(false), 300);
  },
  // Skip: the tones are not skipped; the beam goes straight to the cue (everything aboard); the launch straight to the voyage.
  skip() {
    if (this.run === 'beam') {
      this.q.length = 0; this.tw.length = 0; this.flights.length = 0;
      if (!this.beamArts) this._cargoArts();
      const h = this.hangar; h.craft.set(LIFT);
      if (h.ramp.down) h.ramp.raise(); this._hum(1);      // (skipped before the ramp came up and the hum began)
      for (const e of this.beamArts || []) { e.art.mesh.visible = false; if (e.fly) { this.fin.baseG.attach(e.art.mesh); e.art.mesh.visible = false; e.fly.parent && e.fly.parent.remove(e.fly); } }
      if (this.hangar.frames) this.hangar.frames.visible = false;
      this._clearThings();
      if (!this.beam) this._beamOn();
      this._cue();
      return;
    }
    if (this.run === 'take' && this.toyPath) { this.toyPath.t = this.toyPath.dur; return; }
    if (this.run === 'launch' && !this.skipping) {
      this.skipping = true; this._fade(true);
      this._after(0.9, () => { this.skipping = false; if (this.run !== 'launch') return; this.script = []; this._sirens(false); this._toVoyage(); });      // (on the launch's own clock, which stands still in the pause menu: a wall-clock timer started the voyage under it)
    }
  },
  // Everything back as it was (the craft on its platform, the platform down, the doors shut, the ramp down), drawn
  // nowhere while the voyage runs; and the archive's easels empty.
  _reset() {
    const k = this.k, G = k.G, h = this.hangar, fin = this.fin;
    this.run = null; this.cam = null; G.cineEye = null; this.free = null; this.streak = null; this.rise = null; this.script = []; this.skipping = false; this.toyPath = null;
    this.q.length = 0; this.tw.length = 0; this.flights.length = 0;
    document.body.classList.remove('fcine'); if (this.skipEl) this.skipEl.hidden = true;
    this._grip(false);
    this._beamOff(); this._amber(false); this._sirens(false); this._hum(0);
    if (this.snowM) this.snowM.visible = false; if (this.trail) this.trail.visible = false; if (this.flare) this.flare.visible = false;
    const s = h.saucer; fin.baseG.attach(s); s.rotation.set(0, 0, 0); s.position.set(fin.F.cx, fin.F.platformTop, fin.F.cz);
    h.platform.set(0); h.craft.set(0); h.doors.set(0);
    fin.rampTo = 0; fin.rampU = 0; if (fin.craft) fin.craft.setRamp(0); fin.F.setRamp(true);
    const t = k.tint('B-hangar'); if (t) t.off(0.1);
    for (const b of fin.beacons || []) b.material.color.setRGB(0.5, 0.3, 0.05);
    this.rimOwn = false; this.rim.mode = 'chase';
    this._artGone();
    this._screen(['CRAFT: AWAY', 'LUNAR BASE']);
  },
  // After the launch the pictures are on the Moon: the easels stay empty (a reload too, once the pictures have come in).
  _artGone() {
    const h = this.fin.hangar; if (!h) return;
    for (const e of h.easels) e.art.mesh.visible = false;
    if (h.frames) { h.frames.visible = false; this.artGone = true; }
    if (this.poolMesh) this.poolMesh.visible = false;
  },

  // ---------------------------------------------------------------- the beam, drawn
  _beamOn() {
    if (!this.beamG) this._buildBeam();
    this.beam = true; this.beamG.visible = true;
    this.beamU.op.value = 0; this.tw.push({ t: 0, dur: 0.7, fn: u => { this.beamU.op.value = u; } });
    const out = this._out(); if (out) this._whoosh(out);
    if (!this.aim) this.aim = { p: this.hangar.beamOrigin.clone().add(V(0, -3, 0)), to: V(), rate: 2 };
    this._aimAt(V(394, this.fin.F.fl + 0.8, 176));
  },
  _beamOff() { this.beam = false; if (this.beamG) this.beamG.visible = false; },      // (the hum carries on into the launch: _reset stops it)
  _aimAt(p, rate = 2) { if (!this.aim) this.aim = { p: p.clone(), to: p.clone(), rate }; this.aim.to.copy(p); this.aim.rate = 1 / Math.max(0.05, rate); },
  _beamTick(dt) {
    const o = this.hangar.beamOrigin, a = this.aim;
    a.p.lerp(a.to, 1 - Math.exp(-dt * 3 * a.rate));
    const dir = a.p.clone().sub(o), len = Math.max(1, dir.length()); dir.divideScalar(len);
    this.beamG.position.copy(o); this.beamG.quaternion.setFromUnitVectors(V(0, 1, 0), dir);
    this.beamU.len.value = len; this.beamU.r1.value = Math.max(1.4, Math.min(4.2, len * 0.085)); this.beamU.t.value += dt;
  },
  _buildBeam() {
    const g = this.beamG = new THREE.Group(); g.name = 'beam'; this.root().add(g);
    const U = this.beamU = { t: { value: 0 }, len: { value: 10 }, r0: { value: 1.7 }, r1: { value: 3 }, op: { value: 0 }, col: { value: new THREE.Color(0.55, 1.0, 0.85) }, px: { value: 700 * Math.min(2, window.devicePixelRatio || 1) } };
    const vs = `uniform float len, r0, r1; varying float vA; varying vec3 vN, vV;
      void main() { vec3 p = position; float a = p.y; p.xz *= mix(r0, r1, a); p.y = a * len;
        vec4 w = modelMatrix * vec4(p, 1.0); vV = normalize(cameraPosition - w.xyz); vN = normalize(mat3(modelMatrix) * vec3(normal.x, 0.0, normal.z)); vA = a;
        gl_Position = projectionMatrix * viewMatrix * w; }`;
    const fs = `uniform float t, op; uniform vec3 col; varying float vA; varying vec3 vN, vV;
      void main() { float e = abs(dot(vN, vV)); float soft = pow(e, 1.6);
        float bands = 0.62 + 0.38 * sin(vA * 26.0 + t * 7.0);
        float ends = smoothstep(0.0, 0.05, vA) * (1.0 - smoothstep(0.82, 1.0, vA));
        gl_FragColor = vec4(col * soft * bands * ends * op * (1.15 - 0.55 * vA) * 0.55, 1.0); }`;
    const geo = new THREE.CylinderGeometry(1, 1, 1, 40, 1, true); geo.translate(0, 0.5, 0);
    const cone = new THREE.Mesh(geo, new THREE.ShaderMaterial({ uniforms: U, vertexShader: vs, fragmentShader: fs, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
    cone.frustumCulled = false; cone.renderOrder = 7; g.add(cone);
    // sparks drawn up it, all in the shader: nothing per frame but the clock
    const N = 260, seed = new Float32Array(N * 3); for (let i = 0; i < N * 3; i++) seed[i] = Math.random();
    const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3)); pg.setAttribute('seed', new THREE.BufferAttribute(seed, 3));
    const pvs = `uniform float t, len, r0, r1, px; attribute vec3 seed; varying float vK;
      void main() { float a = 1.0 - fract(seed.x + t * (0.22 + seed.y * 0.2)); float r = mix(r0, r1, a) * (0.15 + 0.8 * seed.y); float th = seed.z * 6.2832 + t * (0.6 + seed.x);
        vec4 mv = modelViewMatrix * vec4(cos(th) * r, a * len, sin(th) * r, 1.0); vK = smoothstep(0.0, 0.1, a) * (1.0 - smoothstep(0.85, 1.0, a));
        gl_PointSize = px * 0.07 / max(0.5, -mv.z); gl_Position = projectionMatrix * mv; }`;
    const pfs = `uniform float op; uniform vec3 col; varying float vK; void main() { vec2 d = gl_PointCoord - 0.5; float q = smoothstep(0.5, 0.0, length(d)); gl_FragColor = vec4((col * 0.6 + 0.6) * q * vK * op, 1.0); }`;
    const pts = new THREE.Points(pg, new THREE.ShaderMaterial({ uniforms: U, vertexShader: pvs, fragmentShader: pfs, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    pts.frustumCulled = false; pts.renderOrder = 8; g.add(pts);
    g.visible = false;
  },
  _portFlash() {
    const port = this.fin.craft && this.fin.craft.port; if (!port) return;
    this.tw.push({ t: 0, dur: 0.5, fn: u => port.material.color.setRGB(0.15 + 2.2 * (1 - u), 0.7 + 1.6 * (1 - u), 0.4 + 1.8 * (1 - u)) });
  },

  // ---------------------------------------------------------------- things going up the beam
  // A picture lifts off its easel, frame and all, and goes up the beam into the port.
  _liftArt(e, n) {
    const a = e.art, base = this.fin.baseG, fly = new THREE.Group();
    fly.position.copy(a.mesh.position); base.add(fly);
    fly.attach(a.mesh); a.mesh.position.set(0, 0, 0);
    const fr = new THREE.Mesh(new THREE.BoxGeometry(0.035, a.h + 0.12, a.w + 0.12), this._frameMat());
    fr.position.x = -0.03; fly.add(fr);
    e.fly = fly;
    if (n === 0 && this.hangar.frames) this.hangar.frames.visible = false;      // (the frames go with their pictures)
    if (this.poolMesh) { const i = this._easels().indexOf(e); if (i >= 0) this._poolsTo(i, 0); }
    this._aimAt(fly.position.clone(), 0.6); this.lastArt = fly;
    this.flights.push({ kind: 'art', obj: fly, from: fly.position.clone(), t: 0, dur: 3.3, spin: (n % 2 ? 1 : -1) * (0.6 + (n % 3) * 0.3), note: n % 5, e, size: 1 });
  },
  _frameMat() { return this._fm || (this._fm = new THREE.MeshStandardMaterial({ color: 0xa8843a, roughness: 0.4, metalness: 0.6, emissive: 0xa8843a, emissiveIntensity: 0.35 })); },
  // A book or a lost thing: in from the far end of the archive, along the beam and up.
  _liftThing(kind, x, i) {
    const F = this.fin.F, obj = kind === 'book' ? this._bookMesh(x, i) : this._itemMesh(x);
    if (!obj) return;
    const from = V(368 + (i % 3), F.fl + 0.5 + (i % 2) * 0.6, 176 + ((i * 7) % 9 - 4) * 0.9);
    obj.position.copy(from); this.root().add(obj);
    (this.things || (this.things = [])).push(obj);
    this.flights.push({ kind, obj, from, t: 0, dur: 3.2, spin: 1.4 + (i % 3) * 0.5, note: i % 5, size: 1 });
  },
  _bookMesh(b, i) {
    const pal = [0x7a1f24, 0x1f3b6a, 0x2f5a3a, 0x6b4a1e, 0x3b2a52, 0x8a6a2a, 0x2a2a2e, 0x5a1e3a];
    const h = String(b.k || b.t || i).split('').reduce((s, c) => (s * 31 + c.charCodeAt(0)) >>> 0, 7);
    const g = new THREE.Group(), cover = new THREE.MeshBasicMaterial({ color: new THREE.Color(pal[h % pal.length]).multiplyScalar(1.4) }), pages = new THREE.MeshBasicMaterial({ color: 0xe9e0c8 });
    const bk = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.25, 0.04), [pages, cover, pages, pages, cover, cover]); g.add(bk);
    g.scale.setScalar(1.6);
    return g;
  },
  _itemMesh(it) {
    const K = KINDS.find(q => q.id === it.kind); if (!K) return null;
    const cache = this._ig || (this._ig = {});
    if (!cache[K.id]) { try { cache[K.id] = mergeGeometries(K.make()); cache[K.id].computeBoundingSphere(); } catch { return null; } }
    const m = new THREE.Mesh(cache[K.id], this._im || (this._im = new THREE.MeshBasicMaterial({ vertexColors: true, color: new THREE.Color(1.15, 1.15, 1.15) })));
    const g = new THREE.Group(); g.add(m); m.position.y = -0.03;
    g.scale.setScalar(Math.min(4, 0.5 / Math.max(0.06, cache[K.id].boundingSphere.radius)));      // (small things made big enough to see in the light)
    return g;
  },
  _fly(dt) {
    const port = this.hangar.beamOrigin, below = V(port.x, port.y - 2.2, port.z);
    for (let i = this.flights.length - 1; i >= 0; i--) {
      const f = this.flights[i]; f.t += dt;
      const u = Math.min(1, f.t / f.dur), o = f.obj;
      if (f.kind === 'art') {
        // a moment's lift off the easel, then along the beam, faster and faster, curling up into the port
        const up = ease(Math.min(1, f.t / 0.8)) * 0.45, w = Math.max(0, (f.t - 0.8) / (f.dur - 0.8));
        const st = f.from.clone(); st.y += up; st.x += Math.sin(f.t * 9) * 0.015 * (1 - w);
        bezQ(o.position, st, below, port, easeIn(w) * 0.6 + ease(w) * 0.4);
        o.rotation.y = f.spin * w * 1.6; o.rotation.z = Math.sin(w * 3) * 0.2;
        o.scale.setScalar(1 - 0.55 * easeIn(w));
      } else {
        const mid = V(392, port.y - 1.6, 176);
        bezQ(o.position, f.from, mid, port, easeIn(u) * 0.5 + ease(u) * 0.5);
        o.rotation.y += dt * f.spin; o.rotation.x += dt * f.spin * 0.6;
        if (u > 0.85) o.scale.multiplyScalar(1 - dt * 3);
      }
      if (u >= 1) {
        this.flights.splice(i, 1);
        if (f.kind === 'art') { o.visible = false; f.e.art.mesh.visible = false; }
        else { o.parent && o.parent.remove(o); }
        this._portFlash(); this._chime(f.note, f.kind === 'art' ? 0.05 : 0.025);
      }
    }
  },
  _clearThings() { for (const o of this.things || []) if (o.parent) o.parent.remove(o); this.things = []; },
  _items() {
    const lf = features.find(f => f.id === 'lostfound'), out = [];
    if (!lf || !lf.tally) return out;
    for (let i = 0; i < 30; i++) if (lf.tally.has('lost' + i)) { const K = KINDS[i % KINDS.length]; out.push({ kind: K.id, name: K.name }); }
    return out;
  },

  // ---------------------------------------------------------------- the camera
  _shot(name) {
    const F = this.fin.F, h = this.hangar, s = () => h.saucer.position;
    // (Reduce motion: every shot is taken from where it starts. The camera does not travel or zoom; it only turns to keep the craft in view.)
    const calm = !!this.k.G.set.reduce, mv = t => (calm ? 0 : t);
    const fixed = (at, look, fov = 62) => ({ t: 0, fn: () => ({ at, look, fov }) });
    const dolly = (a0, l0, a1, l1, dur, fov = 62) => ({ t: 0, fn: t => { const u = ease(mv(t) / dur); return { at: a0.clone().lerp(a1, u), look: l0.clone().lerp(l1, u), fov }; } });
    const shots = {
      // the craft lifting off its cradle, from the hangar floor
      wake: dolly(V(414.5, -17.0, 192.5), V(431, -15.2, 177), V(413.5, -16.6, 190.8), V(431, -14.6, 177), 6, 64),
      // in the archive, by the door: the beam comes in over your shoulder
      archive: { t: 0, fn: t => { const base = V(388, -16.6, 177), f = this.lastArt; return { at: V(413.2 - mv(t) * 0.12, -13.7, 167.4), look: f && f.parent ? base.lerp(f.position, 0.45) : base, fov: 62 }; } },
      // across the hangar: the pictures streaming from the door into the port
      stream: dolly(V(419, -16.6, 195.3), V(422, -15.6, 176), V(421.5, -16.3, 195.3), V(423.5, -15.5, 176), 12, 68),
      // under the craft: the doors parting, the snow coming down the shaft
      hangarUp: dolly(V(418.6, -17.3, 193.4), V(432, -6, 176.4), V(419.4, -17.0, 192.6), V(432, -4, 176.2), 6, 74),
      // out on the field, by the hole: up it comes
      field: { t: 0, fn: t => ({ at: V(456 - mv(t) * 0.15, 1.7 + mv(t) * 0.1, 182 + mv(t) * 0.1), look: V(432, Math.max(-2, s().y + 3.2), 176), fov: 66 }) },
      // over Butler Field, the museum and the city behind it
      over: { t: 0, fn: t => ({ at: V(522 - mv(t) * 1.2, 18 + mv(t) * 0.5, 232 - mv(t) * 0.6), look: s().clone().add(V(0, 2, 0)), fov: 58 }) },
      // out over the lake, looking back at the city; then up
      lake: { t: 0, fn: t => ({ at: V(656, 30, 176), look: this.streak != null ? s().clone().lerp(V(598, 44, 146), Math.max(0, 0.6 - this.streak * 0.3)) : s().clone().add(V(0, 1.5, 0)), fov: this.streak != null && !calm ? 58 - Math.min(14, this.streak * 6) : 58 }) },
    };
    this.cam = shots[name];
    void F;
  },

  // ---------------------------------------------------------------- the toy, held
  _grip(on) {
    const G = this.k.G, gd = features.find(f => f.id === 'guards');
    if (on) {
      if (G.ride !== this.hold) G.ride = this.hold;
      if (gd) gd.grace = Math.max(gd.grace || 0, G.t + 1e6);      // (no robot takes the toy in the middle of all this)
      G.vehicle.vel.set(0, 0, 0);
      this._keys(true);
    } else {
      if (G.ride === this.hold) G.ride = null;
      if (gd) gd.grace = G.t + 1.5;
      this._keys(false);
    }
  },
  _hold(dt, inp) {
    const v = this.k.G.vehicle;
    v.vel.set(0, 0, 0); if (v.kind === 'car') { v.speed = 0; v.throttle = 0; v.air = false; v.vy = 0; v.landed = null; v.launched = 0; } else v.landed = true;
    v.bump = 0; v.sync(dt);
    this._pad(inp);
  },
  // A gamepad, while the console or the cinematic has the screen. (Driving, a pad's buttons are actions and never keys, src/input.js,
  // so the key handler below never hears them.) At the pads: the D-pad or a stick moves along the five, A plays the one it is on,
  // B leaves. In the cinematic: A or B skips. Menu still pauses.
  _pad(inp) {
    const I = this.k.G.input; if (!I || !this.run || this.run === 'cue') return;
    if (this.run !== 'tones') { I.took('swap'); if (I.pad && (I.took('look') || I.took('back'))) this.skip(); return; }      // (and no swapping toys while the beam has this one)
    if (!I.pad) { this._sel(-1); return; }
    const x = !inp ? 0 : inp.steer != null ? inp.steer : Math.abs(inp.roll) > Math.abs(inp.yaw) ? inp.roll : inp.yaw, lean = x > 0.6 ? 1 : x < -0.6 ? -1 : 0;
    const dir = I.took('right') ? 1 : I.took('left') ? -1 : lean !== this._lean ? lean : 0; this._lean = lean;
    if (this.sel == null) this.sel = 0;
    if (dir) this.sel = Math.max(0, Math.min(4, this.sel + dir));
    this._sel(this.sel);
    if (I.took('look')) this.press(this.sel);
    if (I.took('back')) this.closeTones('The pads go quiet. Come back any time.');
  },
  _sel(i) { if (i === this._selOn || !this.tonesEl) return; this._selOn = i; this.tonesEl.querySelectorAll('.tpads button').forEach((b, n) => b.classList.toggle('sel', n === i)); },
  _shadow(v, on) { if (v.shadow) v.shadow.visible = on; },
  // While the console or the cinematic has the screen: keys 1-5 for the pads, Esc to leave; Space, Enter or Esc to skip.
  _keys(on) {
    if (on && !this._onKey) {
      this._onKey = e => {
        if (!this.run || this.run === 'cue' || this.k.G.state !== 'play') return;      // (not in the pause menu or on the title: Esc, Enter and Space there are the menu's)
        if (e.target && /^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName)) return;
        const code = e.code;
        if (this.run === 'tones') {
          const m = /^(Digit|Numpad)([1-5])$/.exec(code);
          if (m) { if (!e.repeat) this.press(+m[2] - 1); }
          else if (code === 'Escape') this.closeTones('The pads go quiet. Come back any time.');
          else if (!/^(Arrow|Key[WASD]$)/.test(code)) return;
        } else if (code === 'Escape' || code === 'Space' || code === 'Enter' || code === 'KeyE') { if (!e.repeat) this.skip(); }
        e.preventDefault(); e.stopPropagation();
      };
      addEventListener('keydown', this._onKey, true);
    } else if (!on && this._onKey) { removeEventListener('keydown', this._onKey, true); this._onKey = null; }
  },

  // ---------------------------------------------------------------- the screen, the buttons
  _ui() {
    if (this.tonesEl) return;
    const st = document.createElement('style'); st.textContent = CSS; document.head.append(st);
    const el = this.tonesEl = document.createElement('section'); el.id = 'tones'; el.hidden = true; el.setAttribute('role', 'group'); el.setAttribute('aria-label', 'The tone console');
    el.innerHTML = `<button class="tleave" data-tone="leave">LEAVE</button><div class="tsay" role="status" aria-live="polite"></div>
      <div class="tpads">${MOTIF.map((n, i) => `<button data-tone="${i}" style="--c:${n.colour}" aria-label="Pad ${i + 1}"><kbd>${i + 1}</kbd></button>`).join('')}</div>`;
    document.body.append(el);
    // (pointerdown, so a thumb already down on the glass does not stop the tap; data-tone, so the game's own button handler leaves them alone)
    el.addEventListener('pointerdown', e => {
      if (!document.hasFocus()) window.focus();
      const b = e.target.closest('button'); if (!b || this.k.G.state !== 'play') return;
      // (No preventDefault on a pointerdown: it would cancel the focus a click gives, and in itch's frame the keys would never arrive. Nothing is lost by it: style.css already stops text being selected and the page being dragged, for every element.)
      this.k.sound.unlock && this.k.sound.unlock();
      if (b.dataset.tone === 'leave') this.closeTones('The pads go quiet. Come back any time.');
      else this.press(+b.dataset.tone);
    });
    const sk = this.skipEl = document.createElement('button'); sk.id = 'fskip'; sk.hidden = true; sk.dataset.tone = 'skip'; sk.innerHTML = `SKIP<kbd data-key="Space" data-pad="A">${this.k.G.input && this.k.G.input.pad ? 'A' : 'Space'}</kbd>`;      // (data-pad: main.js keycaps() swaps the caption when a pad is picked up)
    sk.addEventListener('pointerdown', () => { if (!document.hasFocus()) window.focus(); if (this.k.G.state === 'play') this.skip(); });      // (no preventDefault: as the pads, above)
    document.body.append(sk);
    const fd = this.fadeEl = document.createElement('div'); fd.id = 'ffade'; document.body.append(fd);
  },
  _say(t) { const s = this.tonesEl && this.tonesEl.querySelector('.tsay'); if (s) { s.textContent = t || ''; s.hidden = !t; } },
  _padsWait(w) { const p = this.tonesEl && this.tonesEl.querySelector('.tpads'); if (p) p.classList.toggle('wait', w); },
  _fade(on, white = false) { const f = this.fadeEl; if (!f) return; f.classList.toggle('white', !!white); f.style.opacity = on ? '1' : '0'; },
  _screen(lines) {
    const s = this.consoleApi && this.consoleApi.screen; if (!s) return;
    const c = s.ctx, w = s.w, h = s.h;
    c.fillStyle = '#04110a'; c.fillRect(0, 0, w, h); c.fillStyle = '#3cff8a';
    // (low on the glass: the console's hood hides the top of it from where you stand)
    c.font = 'bold 32px ui-monospace, Menlo, monospace'; c.fillText(lines[0] || '', 22, 112);
    c.font = '26px ui-monospace, Menlo, monospace'; c.fillText(lines[1] || '', 22, 148);
    s.tex.needsUpdate = true;
  },
  _after(t, fn) { const at = this.clock + t; let i = this.q.length; while (i > 0 && this.q[i - 1].t > at) i--; this.q.splice(i, 0, { t: at, fn }); },
  root() { if (!this._root) { this._root = new THREE.Group(); this._root.name = 'finale launch'; this.k.group.add(this._root); } return this._root; },

  // ---------------------------------------------------------------- the rim
  _rimColour(i, t) {
    const r = this.rim, c = this._rc || (this._rc = new THREE.Color());
    if (this.run === 'launch' && this.lt != null) {
      if (this.streak != null) return c.setRGB(3, 3, 3);
      const q = this.k.G.set.reduce ? 0.5 : Math.max(0, Math.sin(t * 6 - i * 0.9)); return c.copy(this.lt < 11 ? AMBER : COL[Math.floor(i / 6) % 5]).multiplyScalar(0.35 + 1.4 * q);      // (Reduce motion: lit evenly, no chase round the rim)
    }
    if (r.mode === 'flash' && r.k > 0) return c.copy(r.c).multiplyScalar(0.4 + 2.2 * r.k);
    if (r.mode === 'flash' || r.mode === 'bands' || this.fin.save.state === 'played') {
      const j = Math.floor(((i + t * 6) % 30) / 6) % 5, q = 0.6 + 0.4 * Math.sin(t * 3 - i * 0.5);
      return c.copy(COL[j]).multiplyScalar(0.9 + 1.0 * q * (r.mode === 'flash' ? 0.6 : 1));
    }
    return null;
  },
  // Up in the air the base's own drawing of the rim stops (it is drawn only while you are in the base): done here.
  _rimOwn(on) {
    if (on) this.rimOwn = true;
    if (this.fin.baseG.visible && Math.abs(this.k.G.camera.position.x - this.fin.F.cx) < 90) return;
    const L = this.hangar.rim.lamps, t = this.fin.t;
    for (let i = 0; i < L.count; i++) L.setColorAt(i, this._rimColour(i, t) || WHITE);
    L.instanceColor.needsUpdate = true;
  },

  // ---------------------------------------------------------------- the launch, drawn
  // Snow down the shaft: drawn in the shader from a seed and the clock.
  _snow() {
    if (this.snowM) return;
    const sq = this.fin.F.silo, N = 900, seed = new Float32Array(N * 4); for (let i = 0; i < N * 4; i++) seed[i] = Math.random();
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3)); g.setAttribute('seed', new THREE.BufferAttribute(seed, 4));
    const U = { t: { value: 0 }, sq: { value: new THREE.Vector4(sq.x0, sq.z0, sq.x1 - sq.x0, 0) }, px: { value: 700 * Math.min(2, window.devicePixelRatio || 1) } };
    const vs = `uniform float t, px; uniform vec4 sq; attribute vec4 seed; varying float vA;
      void main() { float d = seed.w * 4.5; float tt = max(0.0, t - d);
        float open = min(1.0, 0.3 + d / 4.5); float sx = sq.x + sq.z * (0.5 + (seed.x - 0.5) * open); float sz = sq.y + sq.z * seed.y;
        vec3 p = vec3(sx, sq.w + 0.4 + seed.z * 0.8, sz);
        p.y -= tt * (1.6 + seed.z * 2.2) + 0.45 * tt * tt;
        p.x += sin(tt * 1.7 + seed.x * 30.0) * 0.5; p.z += cos(tt * 1.3 + seed.y * 30.0) * 0.5;
        vA = step(d, t) * (1.0 - smoothstep(13.0, 18.0, -p.y)) * (1.0 - smoothstep(0.0, 1.5, tt - 9.0));
        vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_PointSize = px * (0.05 + 0.05 * seed.z) / max(0.3, -mv.z); gl_Position = projectionMatrix * mv; }`;
    const fs = `varying float vA; void main() { vec2 d = gl_PointCoord - 0.5; float q = smoothstep(0.5, 0.15, length(d)); if (q * vA < 0.02) discard; gl_FragColor = vec4(vec3(0.92, 0.95, 1.0), q * vA * 0.9); }`;
    const m = this.snowM = new THREE.Points(g, new THREE.ShaderMaterial({ uniforms: U, vertexShader: vs, fragmentShader: fs, transparent: true, depthWrite: false }));
    m.frustumCulled = false; m.visible = false; m.renderOrder = 6; this.root().add(m);
    // and the streak the craft leaves going up, and the flare round it
    const tg = new THREE.CylinderGeometry(0.4, 2.2, 1, 16, 1, true); tg.translate(0, -0.5, 0);
    const tm = new THREE.MeshBasicMaterial({ map: TX.radial(0, 1), color: new THREE.Color(0.7, 1.2, 1.1), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });
    this.trail = new THREE.Mesh(tg, tm); this.trail.visible = false; this.trail.frustumCulled = false; this.root().add(this.trail);
    this.flare = new THREE.Sprite(new THREE.SpriteMaterial({ map: TX.radial(0, 1.6), color: new THREE.Color(1.6, 1.9, 1.8), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
    this.flare.visible = false; this.root().add(this.flare);
  },
  // Amber lamps round the silo on the field, flush with the snow, and their glow; the hangar's beacons flash.
  _amber(on) {
    this.amberOn = on; this._amb = null;
    if (on && !this.ambG) {
      const sq = this.fin.F.silo, g = this.ambG = new THREE.Group(), tex = TX.radial(0, 1.3);
      const pts = []; for (const fx of [0, 0.5, 1]) for (const fz of [0, 0.5, 1]) if (fx !== 0.5 || fz !== 0.5) pts.push([sq.x0 - 0.6 + (sq.x1 - sq.x0 + 1.2) * fx, sq.z0 - 0.6 + (sq.z1 - sq.z0 + 1.2) * fz]);
      for (const [x, z] of pts) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: new THREE.Color(2.4, 1.2, 0.2), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); s.position.set(x, 0.35, z); s.scale.set(1.5, 1.5, 1); g.add(s); }
      this.root().add(g);
    }
    if (this.ambG) this.ambG.visible = on;
    if (!on) { const t = this.k.tint('B-hangar'); if (t) t.off(0.6); for (const b of this.fin.beacons || []) b.material.color.setRGB(0.5, 0.3, 0.05); }
  },

  // ---------------------------------------------------------------- sound
  _out() {
    const S = this.k.sound, c = S && S.ctx; if (!c || !S.dry) return null;
    if (this.outNode && this.outNode.context === c) return this.outNode;
    const o = this.outNode = c.createGain(); o.gain.value = 1; o.connect(S.world || S.dry);      // (the hum and the sirens go on and on: the world's, silent while a menu is up, audio.js quiet())
    if (S.send) { const w = c.createGain(); w.gain.value = 0.45; o.connect(w); w.connect(S.worldWet || S.send); }
    return o;
  },
  _chime(i, gain = 0.04) { const out = this._out(); if (!out) return; const c = this.k.sound.ctx; motifVoice(c, out, MOTIF[i].midi + 12, c.currentTime + 0.01, 0.25, gain); },
  _whoosh(out) {
    const c = this.k.sound.ctx, t = c.currentTime, n = Math.ceil(c.sampleRate * 1.2), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * i / n);
    const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(); s.buffer = b; f.type = 'bandpass'; f.frequency.setValueAtTime(300, t); f.frequency.exponentialRampToValueAtTime(2400, t + 1.1); f.Q.value = 1.4; g.gain.value = 0.05;
    s.connect(f); f.connect(g); g.connect(out); s.start(t);
  },
  // The craft's hum: two low sines, on while it is awake.
  _hum(on) {
    const out = this._out(); if (!out) return;
    const c = this.k.sound.ctx;
    if (on && !this.humN) {
      const g = c.createGain(); g.gain.value = 0; g.connect(out);
      const os = [55, 110.5, 165.2].map((f, i) => { const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = f; const og = c.createGain(); og.gain.value = [1, 0.5, 0.18][i]; o.connect(og); og.connect(g); o.start(); return o; });
      g.gain.setTargetAtTime(0.035, c.currentTime, 1.2);
      this.humN = { g, os };
    } else if (!on && this.humN) {
      const h = this.humN; this.humN = null;
      h.g.gain.setTargetAtTime(0, c.currentTime, 0.4); for (const o of h.os) o.stop(c.currentTime + 2);
    }
  },
  _humTo(f, gain) { const h = this.humN; if (!h) return; const c = this.k.sound.ctx; h.os.forEach((o, i) => o.frequency.setTargetAtTime(f * (i + 1), c.currentTime, 0.1)); h.g.gain.setTargetAtTime(gain, c.currentTime, 0.2); },
  // Sirens: a slow two-note wail, through a low-pass, from the shaft.
  _sirens(on) {
    const out = this._out();
    if (on && out && !this.sirenN) {
      const c = this.k.sound.ctx, g = c.createGain(), f = c.createBiquadFilter(); g.gain.value = 0; f.type = 'lowpass'; f.frequency.value = 1500; f.connect(g); g.connect(out);
      const o = c.createOscillator(), lfo = c.createOscillator(), lg = c.createGain(); o.type = 'sawtooth'; o.frequency.value = 560; lfo.frequency.value = 0.55; lg.gain.value = 150;
      lfo.connect(lg); lg.connect(o.frequency); o.connect(f); o.start(); lfo.start();
      g.gain.setTargetAtTime(0.022, c.currentTime, 0.4);
      this.sirenN = { g, o, lfo };
    } else if (!on && this.sirenN) {
      const s = this.sirenN, c = this.k.sound.ctx; this.sirenN = null;
      s.g.gain.setTargetAtTime(0, c.currentTime, 0.8); s.o.stop(c.currentTime + 4); s.lfo.stop(c.currentTime + 4);
    }
  },
  // Over the lake: the call, slow, in the craft's own voice.
  _callOver() {
    const out = this._out(); if (!out) return;
    const c = this.k.sound.ctx; let t = c.currentTime + 0.3;
    MOTIF.forEach((n, i) => { const dur = n.beats * 0.55; motifVoice(c, out, n.midi, t, dur, 0.07); motifVoice(c, out, n.midi - 12, t, dur, 0.035); this._after(t - c.currentTime, () => { this.rim.mode = 'flash'; this.rim.c.copy(COL[i]); this.rim.k = 1; }); t += dur; });
  },
  // And as it goes, the music swells: a D chord that opens out, and the call an octave up.
  _swell() {
    const out = this._out(); if (!out) return;
    const c = this.k.sound.ctx, t = c.currentTime;
    for (const m of [38, 50, 57, 62, 64, 66, 69, 74]) {
      const o = c.createOscillator(), g = c.createGain(); o.type = m < 45 ? 'sine' : 'triangle'; o.frequency.value = hz(m);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(m < 45 ? 0.05 : 0.016, t + 2.6); g.gain.setTargetAtTime(0, t + 3.6, 0.9);
      o.connect(g); g.connect(out); o.start(t); o.stop(t + 8);
    }
    let tt = t + 0.6; MOTIF.forEach(n => { motifVoice(c, out, n.midi + 12, tt, n.beats * 0.32, 0.05); tt += n.beats * 0.32; });
  },

  // Quit to the title, or a new start, in the middle of any of it: everything is let go of (the toy, the camera, the pads, the
  // sounds) and it stands as a reload would find it. Left running, the pads and the held toy were still there on the title screen.
  reset(k) {
    if (!this.fin || !this.run) return;
    if (this.run === 'tones') { this.closeTones(); return; }
    const G = k.G, v = G.vehicle, st = this.fin.save.state;
    if (this.mark) { G.mapMarks = (G.mapMarks || []).filter(m => m !== this.mark); this.mark = null; }
    this._reset(); this._clearThings(); this._fade(false);
    v.group.visible = true; this._shadow(v, true);
    if (past(st, 'launched')) return;
    // (not launched: the pictures are still on their easels, and the craft is awake and will call again)
    this.artGone = false; this.autoTried = false; this._artBack(1);
    if (this.poolMesh) this.poolMesh.visible = true;
    this.rim.mode = st === 'played' ? 'bands' : 'chase';
    this._screen(st === 'played' ? ['CRAFT: AWAKE', 'USE TO CALL IT'] : ['CRAFT: ASLEEP', 'AWAITING TONES  _']);
  },
  // The pictures back on their easels (lit this much), whatever the beam had done with them.
  _artBack(lit) {
    const h = this.fin.hangar && this.fin.built ? this.fin.hangar : null; if (!h) return null;
    for (const e of h.easels) { e.light(lit); if (e.art.work) e.art.mesh.visible = true; if (e.fly) { this.fin.baseG.attach(e.art.mesh); e.fly.parent && e.fly.parent.remove(e.fly); e.fly = null; e.art.mesh.scale.set(e.art.w, e.art.h, 1); e.art.mesh.rotation.set(0, Math.PI / 2, 0); e.art.mesh.position.copy(e.position); } }
    if (h.frames) h.frames.visible = true;
    return h;
  },
  // A new game: none of it has happened.
  fresh(k) {
    if (!this.fin) return;
    try { localStorage.removeItem(KEY); } catch { /* fine */ }
    if (this.run === 'tones') this.closeTones(); else if (this.run) this._reset();
    this._chair(true);
    this.phrase = 0; this.lit = 0; this.autoTried = false; this.artGone = false; this.mode = null;
    if (this._artBack(0)) {
      if (this.poolMesh) { this.poolMesh.visible = true; for (let i = 0; i < this.poolOn.length; i++) { this.poolOn[i] = -1; this._poolsTo(i, 0); } }
      this._screen(['CRAFT: ASLEEP', 'AWAITING TONES  _']);
    }
    this.rim.mode = 'chase';
  },
});

// ---------------------------------------------------------------- helpers
// A work record, as small as the voyage needs it (src/voyage.js cargoOf; saved with the voyage).
function compact(w) { return { id: w.id, t: w.t, a: w.a, d: w.d, img: w.img, w: w.w, h: w.h, iw: w.iw, ih: w.ih, k: w.k, s: w.s, c: w.c || '' }; }
// A few books for the shelves on the Moon: one about each of the first pictures, then a spread of the rest.
function pickBooks(B, works, n = 8) {
  const out = [], seen = new Set(), add = b => { if (b && !seen.has(b.k) && out.length < n) { seen.add(b.k); out.push({ k: b.k, t: b.t, a: b.a, y: b.y, c: b.c }); } };
  for (const w of works) { for (const b of booksFor(w, 1)) add(b); if (out.length >= 5) break; }
  const all = B.all || [], step = Math.max(1, Math.floor(all.length / n));
  for (let i = 0; out.length < n && i < all.length; i += step) add(all[i]);
  return out;
}
// Points along curves.
function bezQ(out, a, b, c, u) { const v = 1 - u; return out.set(v * v * a.x + 2 * v * u * b.x + u * u * c.x, v * v * a.y + 2 * v * u * b.y + u * u * c.y, v * v * a.z + 2 * v * u * b.z + u * u * c.z); }
function bez(out, a, b, c, u) { return bezQ(out, a, b, c, u); }
