// The monitors somebody left switched on.
//
// In ten of the back rooms (the laboratories first, then wherever else a screen might be) an old
// monitor sits on a low trolley with a game on it: a different game on each, so finding them all
// means going looking. In the room it is the one screen that is lit, showing the game's name and a
// small moving picture of it. Pull up in front (or hover there) and the LOOK button reads PLAY.
//
// Where they stand is decided in src/furnish.js (ARCADE_ROOMS, and plan.arcades); the games are in
// src/arcadegames.js. This file lights the screens, and runs the full-screen game: keys, fingers,
// the on-screen buttons, scores kept between visits.
//
// For anything else that wants to know (trophies, say): this object carries `total`, `found` and
// `played` (Sets of game ids) and `best` ({ id: score }), and each change is announced with
//   window.dispatchEvent(new CustomEvent('museum:arcade', { detail: { id, event: 'found' | 'played' | 'score', score } }))

import * as THREE from 'three';
import * as TX from './textures.js';
import { GAMES, banner, INK } from './arcadegames.js';

const KEY = 'after-hours.arcade';
const $ = id => document.getElementById(id);
const KEYS = { ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', Space: 'a', Enter: 'a', KeyE: 'a', KeyF: 'b', ShiftLeft: 'b', ShiftRight: 'b' };

export class Arcade {
  constructor(museum, plan, sound) {
    this.plan = plan; this.sound = sound; this.on = false; this.game = null; this.cur = null; this.t = 0; this.since = 0;
    this.found = new Set(); this.played = new Set(); this.best = {};
    try { const s = JSON.parse(localStorage.getItem(KEY) || '{}'); for (const id of s.found || []) this.found.add(id); for (const id of s.played || []) this.played.add(id); Object.assign(this.best, s.best || {}); } catch { /* no storage */ }
    // One monitor for each place the fit-out made for one, and a game for each.
    const g = this.group = new THREE.Group(); museum.group.add(g);
    const shell = new THREE.MeshStandardMaterial({ color: 0x6f6a5c, roughness: 0.85, emissive: 0x3a362c, emissiveIntensity: 0.5 }), dark = new THREE.MeshStandardMaterial({ color: 0x19191b, roughness: 0.5 });
    const body = new THREE.BoxGeometry(0.62, 0.5, 0.44), back = new THREE.BoxGeometry(0.4, 0.36, 0.14), bezel = new THREE.BoxGeometry(0.56, 0.44, 0.02), face = new THREE.PlaneGeometry(0.5, 0.375), pool = new THREE.PlaneGeometry(2.6, 2.6);
    this.list = (plan.arcades || []).filter(a => GAMES[a.slot]).map(a => {
      const Game = GAMES[a.slot], m = new THREE.Group();
      m.position.set(a.x + a.fx * 0.4, a.y + 0.3, a.z + a.fz * 0.4); m.rotation.y = Math.atan2(a.fx, a.fz);
      const put = (geo, mat, x, y, z) => { const o = new THREE.Mesh(geo, mat); o.position.set(x, y, z); m.add(o); return o; };
      put(body, shell, 0, 0.25, 0); put(back, shell, 0, 0.24, -0.27); put(bezel, dark, 0, 0.26, 0.222);
      const cv = document.createElement('canvas'); cv.width = 640; cv.height = 480;      // drawn as if 160 by 120; big enough to play on when the camera comes close
      const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
      put(face, new THREE.MeshBasicMaterial({ map: tex, color: new THREE.Color(1.7, 1.7, 1.7) }), 0, 0.26, 0.234);
      // The light it throws on the floor in front of it: nothing else in the room does that.
      const glow = put(pool, new THREE.MeshBasicMaterial({ map: TX.radial(0, 1), color: new THREE.Color(0.1, 0.42, 0.2), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }), 0, -0.285, 1.0);
      glow.rotation.x = -Math.PI / 2; glow.renderOrder = 4;
      g.add(m);
      const c2 = cv.getContext('2d'); c2.scale(4, 4);
      const it = { ...a, id: Game.id, Game, cv, c: c2, tex, glow, sx: a.x + a.fx * 1.35, sz: a.z + a.fz * 1.35 };
      this._attract(it, 0);
      return it;
    });
    this.total = this.list.length;
    this._dom();
  }

  // What the screen shows in the room: the name, a small moving picture of the game, and PLAY.
  _attract(it, t) {
    const c = it.c;
    c.fillStyle = INK.bg; c.fillRect(0, 0, 160, 120);
    it.Game.icon(c, t);
    c.fillStyle = INK.g; c.font = 'bold 13px ui-monospace, Menlo, Consolas, monospace'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(it.Game.title.toUpperCase(), 80, 12);
    if (Math.floor(t * 1.5) % 2 === 0) { c.fillStyle = INK.a; c.font = 'bold 11px ui-monospace, Menlo, Consolas, monospace'; c.fillText(this.best[it.id] ? 'BEST ' + this.best[it.id] : 'PLAY', 80, 108); }
    c.fillStyle = 'rgba(0,0,0,.22)'; for (let y = 0; y < 120; y += 3) c.fillRect(0, y, 160, 1);
    it.tex.needsUpdate = true;
  }

  // The monitor this toy is pulled up in front of, if any.
  near(v) {
    if (this.on) return null;
    for (const it of this.list) {
      const dy = v.pos.y - it.y;
      if (dy < -0.3 || dy > 2.4) continue;
      const dx = v.pos.x - it.sx, dz = v.pos.z - it.sz;
      if (dx * dx + dz * dz > 1.6 * 1.6 || (v.pos.x - it.x) * it.fx + (v.pos.z - it.z) * it.fz < 0.55 || Math.hypot(v.vel.x, v.vel.z) > 3) continue;
      if (!this.found.has(it.id)) { this.found.add(it.id); this._save(); this._tell(it.id, 'found'); this.justFound = it; }
      return it;
    }
    return null;
  }

  // In the room: the screens near the camera are redrawn a few times a second.
  update(dt, t, cam, calm) {
    this.t = t; this.since += dt;
    if (this.since < 0.28) return;
    this.since = 0;
    for (const it of this.list) if (!(this.on && it === this.cur) && Math.abs(cam.y - it.y - 1) < 5 && (cam.x - it.x) ** 2 + (cam.z - it.z) ** 2 < 26 * 26) this._attract(it, calm ? 0 : t);
  }

  reset() { this.found.clear(); this.played.clear(); this._save(); }      // a new game forgets what was found, not the best scores
  _save() { try { localStorage.setItem(KEY, JSON.stringify({ found: [...this.found], played: [...this.played], best: this.best })); } catch { /* fine */ } }
  _tell(id, event, score) { try { window.dispatchEvent(new CustomEvent('museum:arcade', { detail: { id, event, score } })); } catch { /* fine */ } }

  // ---- sitting down at one ----
  open(it) {
    this.cur = it; this.on = true; this.held = { up: false, down: false, left: false, right: false, a: false };
    if (!this.played.has(it.id)) { this.played.add(it.id); this._save(); this._tell(it.id, 'played'); }
    const G = it.Game, touch = document.body.classList.contains('touch');
    $('arcName').textContent = G.title; $('arcHelp').textContent = (touch ? G.touch : G.keys + '. R starts again, Esc leaves') + '.';
    const pad = G.pad || {};
    $('arcPad').dataset.dirs = pad.dirs || ''; $('arcA').hidden = !pad.a; $('arcA').textContent = pad.a || ''; $('arcB').hidden = !pad.b; $('arcB').textContent = pad.b || '';
    $('arcade').hidden = false;
    this._new();
    $('arcScreen').focus({ preventScroll: true });
  }
  _new() { this.game = new this.cur.Game(); this.overAt = 0; this.told = false; $('arcAgain').hidden = true; if (this.cur.Game.pad && this.cur.Game.pad.b) $('arcB').textContent = this.cur.Game.pad.b; this._score(); }
  _score() { const s = this.game ? this.game.score : 0, b = this.best[this.cur.id] || 0; $('arcScore').textContent = s; $('arcBest').textContent = Math.max(b, 0); this.shown = s; }
  // A score that beats the best is kept, and announced.
  _record() {
    const g = this.game, id = this.cur.id;
    if (!g || !(g.score > (this.best[id] || 0))) return false;
    this.best[id] = g.score; this._save(); this._tell(id, 'score', g.score);
    return true;
  }
  // The glass of a monitor, as a rectangle in the building: where the camera goes to play on it.
  surface(it) { return { x: it.x + it.fx * 0.636, y: it.y + 0.56, z: it.z + it.fz * 0.636, nx: it.fx, ny: 0, nz: it.fz, w: 0.5, h: 0.375 }; }
  // Put the game being played onto its monitor's glass.
  show() {
    const it = this.cur; if (!this.on || !it) return;
    it.c.save(); it.c.setTransform(1, 0, 0, 1, 0, 0); it.c.drawImage($('arcScreen'), 0, 0, it.cv.width, it.cv.height); it.c.restore();
    it.tex.needsUpdate = true;
  }
  leave() { if (!this.on) return; this._record(); this._stopRepeat(); this.on = false; this.game = null; $('arcade').hidden = true; if (this.cur) this._attract(this.cur, this.t); }

  press(k) {
    const g = this.game; if (!g) return;
    if (k === 'leave') return this.leave();
    if (k === 'again') return this._new();
    if (g.over) { if ((k === 'a') && this.overAt > 0.5) this._new(); return; }
    if (k === 'b2') { if (g.second) $('arcB').textContent = g.second(); else g.press('b'); return; }
    g.press(k);
  }
  key(e) {
    if (!this.on) return false;
    if (e.code === 'Escape') { if (!e.repeat) this.leave(); return true; }
    if (e.code === 'KeyR') { if (!e.repeat) this._new(); return true; }
    const k = KEYS[e.code]; if (!k) return false;
    if (k in this.held) this.held[k] = true;
    if (!e.repeat || (this.cur.Game.repeat && k !== 'a' && k !== 'up')) this.press(k);
    return true;
  }
  keyup(e) { const k = KEYS[e.code]; if (this.on && k && k in this.held) this.held[k] = false; }

  // One frame of whatever is being played.
  frame(dt) {
    const g = this.game; if (!g) return;
    if (!g.over) g.update(dt, this.held); else this.overAt += dt;
    for (const f of g.fx.splice(0)) {
      const s = this.sound;
      if (typeof f === 'number') s.beep(f, 0.16, 0.05); else if (f === 'blip') s.tick(0.06, 2600, 0.03); else if (f === 'hit') s.beep(220, 0.05, 0.05); else if (f === 'good') { s.beep(660, 0.07, 0.05); setTimeout(() => s.beep(990, 0.1, 0.05), 80); } else if (f === 'bad') s.beep(110, 0.3, 0.07);
    }
    if (g.score !== this.shown) this._score();
    const c = this.ctx;
    c.setTransform(2, 0, 0, 2, 0, 0);
    g.draw(c, this.t);
    if (g.over) {
      if (!this.told) { this.told = true; this.fresh = this._record(); this._score(); $('arcAgain').hidden = false; }
      banner(c, g.won ? 'WELL PLAYED' : 'GAME OVER', (g.msg ? g.msg + ' ' : '') + (this.fresh ? 'A new best!' : ''));
    } else if (g.score > 0 && g.score !== this.kept && (this.cur.id === 'lamps' || this.cur.id === 'noughts')) { this.kept = g.score; this._record(); this._score(); }      // these two have no end to wait for
  }

  // ---- the page: built once, here, so index.html only has to hold the frame ----
  _dom() {
    const root = $('arcade'), cv = $('arcScreen');
    if (!root) return;
    this.ctx = cv.getContext('2d');
    addEventListener('keydown', e => { if (this.on && this.key(e)) e.preventDefault(); });
    addEventListener('keyup', e => this.keyup(e));
    addEventListener('blur', () => { if (this.held) for (const k in this.held) this.held[k] = false; });
    // Buttons: the four directions and the two actions are held, and some games repeat while they are.
    const down = (b, e) => {
      e.preventDefault();
      const k = b.dataset.arc;
      if (k === 'leave' || k === 'again') return this.press(k);
      if (k === 'b') return this.press('b2');
      if (k in this.held) this.held[k] = true;
      this.press(k);
      if (this.cur && this.cur.Game.repeat && k !== 'a' && k !== 'up') { this._stopRepeat(); this._rep = setTimeout(() => { this._rep = setInterval(() => this.press(k), 90); }, 260); }
      b.classList.add('down');
    };
    const up = b => { const k = b.dataset.arc; if (this.held && k in this.held) this.held[k] = false; this._stopRepeat(); b.classList.remove('down'); };
    for (const b of root.querySelectorAll('button[data-arc]')) {
      b.addEventListener('pointerdown', e => { if (this.on) down(b, e); });
      for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) b.addEventListener(ev, () => up(b));
      b.addEventListener('click', e => e.preventDefault());
      b.addEventListener('contextmenu', e => e.preventDefault());
    }
    // The screen itself: tap, long press, swipe, drag.
    const at = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * 320, (e.clientY - r.top) / r.height * 240]; };
    let p = null;
    cv.addEventListener('pointerdown', e => {
      if (!this.on || !this.game) return;
      e.preventDefault(); try { cv.setPointerCapture(e.pointerId); } catch { /* fine */ }
      const [x, y] = at(e), g = this.game;
      p = { id: e.pointerId, x0: e.clientX, y0: e.clientY, ox: e.clientX, oy: e.clientY, used: false, moved: false };
      if (g.drag && !g.over) g.drag(x, y);
      if (g.hold) p.timer = setTimeout(() => { if (p && !p.moved && !p.used && this.game === g && !g.over) { g.hold(x, y); p.used = true; } }, 480);
    });
    cv.addEventListener('pointermove', e => {
      if (!p || e.pointerId !== p.id || !this.game) return;
      const g = this.game, [x, y] = at(e);
      if (Math.hypot(e.clientX - p.x0, e.clientY - p.y0) > 12) p.moved = true;
      if (g.over) return;
      if (g.drag) { g.drag(x, y); return; }
      if (p.used && !this.cur.Game.repeat) return;                 // one swipe, one move (only Blocks slides on as the finger does)
      const dx = e.clientX - p.ox, dy = e.clientY - p.oy, far = Math.max(22, cv.getBoundingClientRect().width / 14);
      if (Math.abs(dx) > far || Math.abs(dy) > far) { this.press(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up')); p.ox = e.clientX; p.oy = e.clientY; p.used = true; }
    });
    const end = e => {
      if (!p || e.pointerId !== p.id) return;
      clearTimeout(p.timer);
      const g = this.game, was = p; p = null;
      if (!g || e.type === 'pointercancel' || was.used || was.moved) return;
      if (g.over) { if (this.overAt > 0.5) this._new(); return; }
      const [x, y] = at(e);
      if (g.tap) g.tap(x, y); else g.press('a');
    };
    cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
    cv.addEventListener('contextmenu', e => e.preventDefault());
  }
  _stopRepeat() { clearTimeout(this._rep); clearInterval(this._rep); this._rep = 0; }
}
