// The piano. There is a grand in the recital rooms, lid up, stool pulled out, and nobody about.
// Pull up to it and it can be played: the camera goes and stands over the keys, a finger (or several)
// on the glass plays them, and so does the row of letters on a keyboard, the way every computer
// piano has had it since there were computer pianos: A W S E D F T G Y H U J K O L P ;
//
// Every piano in the building is the same piano, from this one class. src/furnish.js stands the case
// and the stool in the room and leaves a mark where the keyboard goes; the eighty-eight keys, the lid
// and the sound are made here. The sound is made up, not recorded: a few slightly mistuned strings
// to a note, struck hard and dying away, longer in the bass.

import * as THREE from 'three';

const WW = 1.44 / 52, KL = 0.15, BL = 0.095, KH = 0.022;      // a white key's width and length, a black key's length, how far the keys stand off the bed
const STEP = [0, 2, 3, 5, 7, 8, 10];                           // white keys up from A
const whiteMidi = i => 21 + 12 * Math.floor(i / 7) + STEP[i % 7];
const isBlack = m => [1, 3, 6, 8, 10].includes(((m % 12) + 12) % 12);
const whiteIndex = m => { const o = Math.floor((m - 21) / 12), s = (m - 21) - o * 12; return o * 7 + STEP.indexOf(s); };
export const freq = m => 440 * Math.pow(2, (m - 69) / 12);
const KEYS = { KeyA: 0, KeyW: 1, KeyS: 2, KeyE: 3, KeyD: 4, KeyF: 5, KeyT: 6, KeyG: 7, KeyY: 8, KeyH: 9, KeyU: 10, KeyJ: 11, KeyK: 12, KeyO: 13, KeyL: 14, KeyP: 15, Semicolon: 16 };
// Beethoven, Für Elise, the opening: [when, note, how long], in semiquavers.
const TUNE = (() => {
  const a = [], rh = (t, list) => list.forEach((m, i) => a.push([t + i, m, 1])), lh = (t, list) => list.forEach((m, i) => a.push([t + i, m, 3 - i]));
  const turn = [76, 75, 76, 75, 76, 71, 74, 72];
  rh(0, turn); a.push([8, 69, 3]); lh(8, [45, 52, 57]); rh(11, [60, 64, 69]); a.push([14, 71, 3]); lh(14, [40, 52, 56]); rh(17, [64, 68, 71]); a.push([20, 72, 3]); lh(20, [45, 52, 57]); rh(23, [64]);
  rh(24, turn); a.push([32, 69, 3]); lh(32, [45, 52, 57]); rh(35, [60, 64, 69]); a.push([38, 71, 3]); lh(38, [40, 52, 56]); rh(41, [64, 72, 71]); a.push([44, 69, 6]); lh(44, [45, 52, 57]);
  return a.sort((p, q) => p[0] - q[0]);
})();

const STYLE = `
#piano { position: fixed; inset: 0; z-index: 30; pointer-events: none; font-family: var(--mono, ui-monospace, monospace); color: var(--cream, #f1ead8); }
#piano[hidden] { display: none; }
#piano .pane { position: fixed; pointer-events: auto; touch-action: none; cursor: pointer; -webkit-tap-highlight-color: transparent; }
#piano .bar { position: fixed; left: 0; right: 0; top: 0; display: flex; gap: 8px; align-items: center; justify-content: center; flex-wrap: wrap; padding: max(8px, env(safe-area-inset-top)) max(10px, env(safe-area-inset-right)) 0 max(10px, env(safe-area-inset-left)); }
#piano .name { font: italic 15px var(--serif, Georgia, serif); color: var(--gilt, #e2cd94); margin-right: 8px; text-shadow: 0 1px 6px #000; }
#piano button { pointer-events: auto; touch-action: none; height: 42px; min-width: 46px; padding: 0 13px; border-radius: 8px; border: 1px solid rgba(226,205,148,.6); background: rgba(8,9,14,.72); color: var(--gilt, #e2cd94); font: 700 12px var(--mono, ui-monospace, monospace); letter-spacing: .12em; -webkit-user-select: none; user-select: none; }
#piano button.on { background: #dcc88e; color: #15130d; }
#piano .oct { font-size: 11px; letter-spacing: .1em; color: var(--gilt-dim, #a8996c); min-width: 5.2em; text-align: center; text-shadow: 0 1px 6px #000; }
#piano .hint { position: fixed; left: 50%; transform: translateX(-50%); bottom: max(8px, env(safe-area-inset-bottom)); font-size: 11px; letter-spacing: .08em; color: var(--gilt-dim, #a8996c); background: rgba(4,5,9,.72); padding: 4px 12px; border-radius: 10px; white-space: nowrap; }
@media (hover: none) { #piano .hint { display: none; } }
@media (max-height: 460px) { #piano button { height: 36px; padding: 0 10px; font-size: 11px; } #piano .name { display: none; } }
`;

export class Piano {
  // deps: { museum, plan, sound, stage, camera, secrets, resume(), onPlay(piano) }
  constructor(G, deps = {}) {
    Object.assign(this, deps); this.G = G; this.on = false; this.cur = null; this.list = [];
    this.voices = []; this.held = new Map(); this.sus = false; this.base = 48; this.auto = null; this.played = 0;
    this.ptr = new Map(); this.keysDown = new Map();
    for (const m of (this.plan.marks || []).filter(q => q.kind === 'piano')) this.add(m);
    this._dom();
  }
  /** Another keyboard to play: `m` is { room, x, y, z, fx, fz } (the front edge of the keys, and the way into the instrument).
   *  o.grand === false: no grand's lid and prop (an upright stands its own case round the keys); o.secret === false: not a secret of its own; o.id: an id of its own. */
  add(m, o = {}) {
    const plan = this.plan, up = new THREE.Vector3(0, 1, 0);
    const ivory = new THREE.MeshStandardMaterial({ color: 0xf2ecdc, roughness: 0.35, emissive: 0xb9b3a4, emissiveIntensity: 0.8 });
    const ebony = new THREE.MeshStandardMaterial({ color: 0x16161a, roughness: 0.3, emissive: 0x08080a, emissiveIntensity: 0.6 });
    const lacquer = new THREE.MeshStandardMaterial({ color: 0x0c0c0f, roughness: 0.18, metalness: 0.3, emissive: 0x050506, emissiveIntensity: 0.6 });
    const brass = new THREE.MeshStandardMaterial({ color: 0xb8964a, roughness: 0.35, metalness: 0.8, emissive: 0x3a2c10, emissiveIntensity: 0.6 });
    const wg = new THREE.BoxGeometry(WW - 0.0022, KH, KL), bg = new THREE.BoxGeometry(WW * 0.56, KH + 0.012, BL);
    {
      const f = new THREE.Vector3(m.fx, 0, m.fz).normalize(), r = new THREE.Vector3().crossVectors(f, up).normalize();      // away from the player; to the player's right
      const O = new THREE.Vector3(m.x, m.y, m.z), room = plan.byId[m.room], name = room ? String(room.gallery || 'a back room') : 'a back room';
      const basis = new THREE.Matrix4().makeBasis(r, up, f.clone().negate());                                                 // local: x right, y up, -z away
      const group = new THREE.Group(); group.matrixAutoUpdate = false; group.matrix.copy(basis).setPosition(O); group.matrixWorldNeedsUpdate = true;
      const white = new THREE.InstancedMesh(wg, ivory, 52), black = new THREE.InstancedMesh(bg, ebony, 36);
      const slots = new Map(); let nb = 0;                                                                                   // midi -> { mesh, i, x, y, z }
      for (let i = 0; i < 52; i++) {
        const mw = whiteMidi(i); slots.set(mw, { mesh: white, i, x: (i - 25.5) * WW, y: KH / 2, z: -KL / 2 });
        if (isBlack(mw + 1) && mw + 1 <= 108) slots.set(mw + 1, { mesh: black, i: nb++, x: (i - 25) * WW, y: KH / 2 + 0.006, z: -(KL - BL / 2) });
      }
      const P = { id: o.id || 'piano:' + m.room + ':' + Math.round(m.x) + ',' + Math.round(m.z), name, room: m.room, O, f, r, group, slots, dip: new Map(), seat: O.clone().addScaledVector(f, -0.5) };
      for (const [, s] of slots) this._set(s, 0);
      white.frustumCulled = black.frustumCulled = false; group.add(white, black);
      // A felt strip behind the keys, the fallboard with a line of brass on it, and the lid, propped.
      const felt = new THREE.Mesh(new THREE.BoxGeometry(1.44, 0.006, 0.012), new THREE.MeshStandardMaterial({ color: 0x8a1f24, roughness: 0.9, emissive: 0x3a0c0e, emissiveIntensity: 0.6 })); felt.position.set(0, KH - 0.002, -KL - 0.007); group.add(felt);
      // (under the keys, something the colour of the shadow between two of them: seen from straight above, a gap shows what is below it)
      const bed = new THREE.Mesh(new THREE.BoxGeometry(1.44, 0.002, KL), new THREE.MeshBasicMaterial({ color: 0x4e4b44 })); bed.position.set(0, 0.004, -KL / 2); group.add(bed);
      const fall = new THREE.Mesh(new THREE.BoxGeometry(1.44, 0.16, 0.02), lacquer); fall.position.set(0, 0.1, -KL - 0.024); group.add(fall);
      const line = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.012, 0.004), brass); line.position.set(0, 0.11, -KL - 0.012); group.add(line);
      if (o.grand !== false) {
        const hinge = new THREE.Group(); hinge.position.set(-0.75, 0.275, -1.12); hinge.rotation.z = 0.5;
        const lid = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.028, 1.5), lacquer); lid.position.set(0.525, 0, 0); hinge.add(lid); group.add(hinge);
        const prop = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.5, 0.02), brass); prop.position.set(0.12, 0.5, -0.62); group.add(prop);
      }
      this.museum.group.add(group); group.updateMatrixWorld(true);
      this.list.push(P);
      if (this.secrets && o.secret !== false) this.secrets.add(P.id, `The piano in the ${name}`);
      return P;
    }
  }
  _set(s, dip) { const M = this._m || (this._m = new THREE.Matrix4()); s.mesh.setMatrixAt(s.i, M.makeTranslation(s.x, s.y - dip, s.z)); s.mesh.instanceMatrix.needsUpdate = true; }

  /** Pulled up at a keyboard, and not going anywhere? Gives back which piano. */
  near(v) {
    if (this.on) return null;
    for (const P of this.list) if (Math.abs(v.pos.y - (P.O.y - 0.74)) < 1.2 && Math.hypot(v.pos.x - P.seat.x, v.pos.z - P.seat.z) < 1.7 && Math.hypot(v.vel.x, v.vel.z) < 3) return P;
    return null;
  }

  // ---- the page over it ----
  _dom() {
    const st = document.createElement('style'); st.textContent = STYLE; document.head.append(st);
    const el = this.el = document.createElement('section'); el.id = 'piano'; el.hidden = true; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', 'The piano');
    el.innerHTML = '<div class="pane" aria-label="The keys. Touch to play."></div><div class="bar"><span class="name"></span><button data-act="down" aria-label="Octave down">◀</button><span class="oct"></span><button data-act="up" aria-label="Octave up">▶</button><button data-act="pedal" aria-pressed="false">PEDAL</button><button data-act="listen">LISTEN</button><button data-act="leave">LEAVE</button></div><div class="hint">A W S E D F T G Y H U J K O L P ;  ·  Z X octave  ·  Space pedal  ·  Esc leave</div>';
    document.body.append(el);
    const pane = this.pane = el.querySelector('.pane');
    const at = e => this.keyAt(e.clientX, e.clientY);
    pane.addEventListener('pointerdown', e => { e.preventDefault(); try { pane.setPointerCapture(e.pointerId); } catch { /* fine */ } const m = at(e); this.ptr.set(e.pointerId, m); if (m != null) this.press(m, 'p' + e.pointerId); });
    pane.addEventListener('pointermove', e => { if (!this.ptr.has(e.pointerId)) return; const was = this.ptr.get(e.pointerId), m = at(e); if (m === was) return; if (was != null) this.release(was, 'p' + e.pointerId); this.ptr.set(e.pointerId, m); if (m != null) this.press(m, 'p' + e.pointerId, 0.8); });
    const upP = e => { if (!this.ptr.has(e.pointerId)) return; const was = this.ptr.get(e.pointerId); this.ptr.delete(e.pointerId); if (was != null) this.release(was, 'p' + e.pointerId); };
    pane.addEventListener('pointerup', upP); pane.addEventListener('pointercancel', upP);
    for (const b of el.querySelectorAll('button')) {
      const act = b.dataset.act;
      if (act === 'pedal') { b.addEventListener('pointerdown', e => { e.preventDefault(); this.pedal(true); }); for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) b.addEventListener(ev, () => this.pedal(false)); }
      else b.addEventListener('pointerdown', e => { e.preventDefault(); if (act === 'leave') this.close(); else if (act === 'listen') this.listen(); else this.shift(act === 'up' ? 12 : -12); });
    }
    addEventListener('keydown', e => {
      if (!this.on) return;
      if (e.code === 'Escape') this.close();
      else if (e.code === 'Space') { if (!e.repeat) this.pedal(true); }
      else if (e.code === 'KeyZ') { if (!e.repeat) this.shift(-12); } else if (e.code === 'KeyX') { if (!e.repeat) this.shift(12); }
      else if (e.code in KEYS) { if (!e.repeat && !this.keysDown.has(e.code)) { const m = this.base + 12 + KEYS[e.code]; this.keysDown.set(e.code, m); this.press(m, e.code); } }
      else if (e.code === 'Enter') this.listen(); else return;
      e.preventDefault(); e.stopPropagation();
    }, true);
    addEventListener('keyup', e => {
      if (!this.on) return;
      if (e.code === 'Space') this.pedal(false);
      else if (this.keysDown.has(e.code)) { const m = this.keysDown.get(e.code); this.keysDown.delete(e.code); this.release(m, e.code); } else return;
      e.preventDefault(); e.stopPropagation();
    }, true);
    addEventListener('blur', () => { if (this.on) this.hush(); });
  }
  /** Which key is under this point on the screen: a midi note, or null. */
  keyAt(cx, cy) {
    const P = this.cur, c = this.camera; if (!P || !c) return null;
    const R = this._ray || (this._ray = new THREE.Raycaster()), n = this._n || (this._n = new THREE.Vector2()), hit = this._h || (this._h = new THREE.Vector3());
    R.setFromCamera(n.set(cx / innerWidth * 2 - 1, 1 - cy / innerHeight * 2), c);
    const pl = this._pl || (this._pl = new THREE.Plane()); pl.set(new THREE.Vector3(0, 1, 0), -(P.O.y + KH));
    if (!R.ray.intersectPlane(pl, hit)) return null;
    hit.sub(P.O); const u = hit.dot(P.r), d = hit.dot(P.f);
    if (d < -0.03 || d > KL + 0.03) return null;
    const x = u / WW + 26, i = Math.floor(x); if (i < 0 || i > 51) return null;
    if (d > KL - BL) { const j = Math.round(x), near = Math.abs(x - j) < 0.3, m = j >= 1 && j <= 51 ? whiteMidi(j - 1) + 1 : -1; if (near && m > 0 && isBlack(m) && m <= 108) return m; }
    return whiteMidi(i);
  }
  _label() { const o = Math.floor(this.base / 12) - 1; this.el.querySelector('.oct').textContent = `C${o} – B${o + 2}`; }
  _centre(v) { const P = this.cur, i0 = whiteIndex(this.base), u = (i0 + 10.5 - 26) * WW + WW / 2; return v.copy(P.O).addScaledVector(P.r, u).addScaledVector(P.f, KL / 2 - 0.004).setY(P.O.y + KH); }
  shift(by) { const b = Math.max(24, Math.min(72, this.base + by)); if (b === this.base) return; this.base = b; this._label(); }

  open(P) {
    P = P || this.list[0]; if (this.on || !P) return;
    this.on = true; this.cur = P; this.G.state = 'paused'; this.el.hidden = false; this.base = 48; this._label();
    this.el.querySelector('.name').textContent = `The piano in the ${P.name}`;
    if (this.sound && this.sound.unlock) this.sound.unlock();
    if (this.stage) {
      const c = this._centre(new THREE.Vector3()), n = new THREE.Vector3(0, 1, 0).addScaledVector(P.f, -0.2).normalize();
      this.stage.enter({ x: c.x, y: c.y, z: c.z, nx: n.x, ny: n.y, nz: n.z, w: 21 * WW, h: KL + 0.03, up: [P.f.x, 0, P.f.z] }, { el: this.pane, fill: 0.97 });
    }
    // the toy is parked at the stool, under the camera: its aerial would stand across the keys
    { const v = this.G.vehicle; if (v && v.group) { this._toy = v.group; this._toyWas = v.group.visible; v.group.visible = false; } }
    if (this.secrets) this.secrets.find(P.id);
    if (this.onPlay) this.onPlay(P);
  }
  close() {
    if (!this.on) return;
    this.on = false; this.auto = null; this.hush(); this.el.hidden = true; this.el.querySelector('[data-act=listen]').classList.remove('on');
    if (this.stage && this.stage.on) this.stage.leave();
    if (this._toy) { this._toy.visible = this._toyWas !== false; this._toy = null; }
    if (this.resume) this.resume();
  }
  hush() { for (const [m, set] of this.held) { set.clear(); this._up(m); } this.held.clear(); this.ptr.clear(); this.keysDown.clear(); this.pedal(false); }

  // ---- keys ----
  press(m, who = 'x', vel = 1) {
    if (m < 21 || m > 108) return;
    let set = this.held.get(m); if (!set) this.held.set(m, set = new Set());
    const first = set.size === 0; set.add(who);
    if (first || who === 'auto') { this.strike(m, vel); this.played++; }
  }
  release(m, who = 'x') { const set = this.held.get(m); if (!set) return; set.delete(who); if (set.size === 0) { this.held.delete(m); this._up(m); } }
  _up(m) { for (const v of this.voices) if (v.midi === m && !v.released) { if (this.sus) v.sustained = true; else this._end(v, 0.09); } }
  pedal(on) {
    on = !!on; if (on === this.sus) return; this.sus = on;
    const b = this.el.querySelector('[data-act=pedal]'); b.classList.toggle('on', on); b.setAttribute('aria-pressed', on);
    if (!on) for (const v of this.voices) if (v.sustained && !v.released && !this.held.has(v.midi)) this._end(v, 0.14);
  }
  listen() {
    const b = this.el.querySelector('[data-act=listen]');
    if (this.auto) { for (const [m] of this.auto.live) this.release(m, 'auto'); this.auto = null; b.classList.remove('on'); return; }
    this.base = 48; this._label(); this.auto = { t: -0.25, i: 0, live: new Map() }; b.classList.add('on');
  }

  // ---- the sound ----
  _wave(c) { if (this._pw && this._pwc === c) return this._pw; const n = 12, re = new Float32Array(n), im = new Float32Array(n); for (let k = 1; k < n; k++) im[k] = 1 / Math.pow(k, 1.7) * (k % 2 ? 1 : 0.75); this._pwc = c; return (this._pw = c.createPeriodicWave(re, im)); }
  strike(m, vel = 1) {
    const S = this.sound, c = S && S.ctx, t = c ? c.currentTime : 0, f = freq(m);
    const v = { midi: m, freq: f, t0: performance.now(), released: false, sustained: false, nodes: null };
    // the same string struck again: the old sound is damped as the new one starts
    for (const o of this.voices) if (o.midi === m && !o.released) this._end(o, 0.03);
    this.voices.push(v);
    while (this.voices.filter(o => !o.released).length > 16) this._end(this.voices.find(o => !o.released), 0.025);      // the oldest goes
    if (c && c.state === 'running') {
      const lo = Math.pow(2, -(m - 21) / 24), tau = 0.32 + 2.3 * lo, peak = 0.2 * vel * (0.55 + 0.45 * lo);
      const env = c.createGain(), lp = c.createBiquadFilter(), out = S.dry || S.master;
      lp.type = 'lowpass'; lp.Q.value = 0.4; lp.frequency.setValueAtTime(Math.min(14000, f * 9 + 1800 * vel), t); lp.frequency.setTargetAtTime(Math.min(9000, f * 2.2 + 260), t + 0.01, tau * 0.45);
      env.gain.setValueAtTime(0, t); env.gain.linearRampToValueAtTime(peak, t + 0.005); env.gain.setTargetAtTime(0, t + 0.006, tau);
      const oscs = [];
      for (const [cents, g] of m < 36 ? [[0, 1]] : [[-2.2, 0.55], [2.6, 0.55], [0.3, 0.4]]) { const o = c.createOscillator(), og = c.createGain(); o.setPeriodicWave(this._wave(c)); o.frequency.value = f; o.detune.value = cents; og.gain.value = g; o.connect(og); og.connect(lp); o.start(t); oscs.push(o); }
      // the knock of the hammer: a very short, bright blip
      { const o = c.createOscillator(), og = c.createGain(); o.type = 'sine'; o.frequency.value = Math.min(9000, f * 5.02); og.gain.setValueAtTime(0, t); og.gain.linearRampToValueAtTime(0.18, t + 0.003); og.gain.setTargetAtTime(0, t + 0.004, 0.03); o.connect(og); og.connect(lp); o.start(t); o.stop(t + 0.3); }
      lp.connect(env); env.connect(out);
      if (S.verb) { const send = c.createGain(); send.gain.value = 0.28; env.connect(send); send.connect(S.verb); }
      v.nodes = { env, lp, oscs, end: t + tau * 7 };
      for (const o of oscs) o.stop(t + tau * 7 + 0.2);
    }
    return v;
  }
  _end(v, tau) {
    if (!v || v.released) return; v.released = true; v.dead = performance.now() + (tau * 6 + 0.05) * 1000;
    const S = this.sound, c = S && S.ctx, n = v.nodes; if (!c || !n) return;
    const t = c.currentTime, g = n.env.gain;
    try { if (g.cancelAndHoldAtTime) g.cancelAndHoldAtTime(t); else { const now = g.value; g.cancelScheduledValues(t); g.setValueAtTime(now, t); } } catch { /* an old browser: let it ring */ }
    g.setTargetAtTime(0, t, tau);
    for (const o of n.oscs) { try { o.stop(t + tau * 7 + 0.05); } catch { /* already stopping */ } }
  }

  update(dt) {
    // the keys follow the fingers, on every piano that has been touched
    for (const P of this.list) {
      if (P !== this.cur && P.dip.size === 0) continue;
      for (const [m, s] of P.slots) {
        const want = P === this.cur && this.held.has(m) ? 0.009 : 0, was = P.dip.get(m) || 0;
        if (want === was) continue;
        const d = was + (want - was) * Math.min(1, dt * (want > was ? 60 : 24)), nd = Math.abs(d - want) < 0.0003 ? want : d;
        if (nd === 0) P.dip.delete(m); else P.dip.set(m, nd);
        this._set(s, nd);
      }
    }
    const now = performance.now(), ctx = this.sound && this.sound.ctx;
    if (this.voices.length) this.voices = this.voices.filter(v => !(v.released && now > v.dead) && !(v.nodes && ctx && ctx.currentTime > v.nodes.end) && !(!v.nodes && now - v.t0 > 8000));
    if (!this.on) return;
    if (this.stage && this.stage.on && this.stage.centre) { const c = this._centre(this._c || (this._c = new THREE.Vector3())); this.stage.centre.lerp(c, Math.min(1, dt * 9)); }
    // playing by itself
    const A = this.auto;
    if (A) {
      const step = 0.2; A.t += dt;
      for (const [m, off] of A.live) if (A.t >= off) { A.live.delete(m); this.release(m, 'auto'); }
      while (A.i < TUNE.length && A.t >= TUNE[A.i][0] * step) { const [, m, len] = TUNE[A.i++]; if (A.live.has(m)) this.release(m, 'auto'); this.press(m, 'auto', 0.8); A.live.set(m, A.t + len * step * 0.92); }
      if (A.i >= TUNE.length && A.live.size === 0) { this.auto = null; this.el.querySelector('[data-act=listen]').classList.remove('on'); }
    }
  }
}
