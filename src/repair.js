// The conservation line.
//
// In one conservation studio there is a long low inspection table with a belt running across the
// top of it, a lamp at one end and a sign over it (src/furnish.js sets the table down; this file
// makes its top). Pull up in front and the action button reads REPAIR.
//
// It is played on the table itself, the way the monitors and the easel are (src/stage.js): the
// camera goes and stands over the bench looking straight down, the belt is the bench's top, and an
// invisible pane of the page lies exactly over it to take the taps. Only the score, the accuracy
// meter, LEAVE and the notice at the end are on the page. The world waits while you work.
// Paintings come along the belt in gilded frames; each has blemishes; touch a blemish and it is
// repaired. The rules (how fast, how many, what counts against you, when you are sent home) are in
// src/repairgame.js, which knows nothing about pages or pictures. This file draws them, listens for
// fingers, a mouse and keys, keeps the best score, and tells anybody who wants to know:
//   window.dispatchEvent(new CustomEvent('museum:repair', { detail: { event: 'start' | 'end', repaired, accuracy, score, sent } }))
// (`sent`: true when the shift ended because accuracy fell under 90%, false when you walked off.)
//
// The canvases are real works from tonight's hang, public domain only (a work with a copyright
// notice is never used here). Each is drawn at once from the tiny preview that comes with the
// collection data, scaled up soft, and replaced by a proper image (400 px) if and when one loads.
// Nothing waits for the network: with no images at all it plays the same.
//
// The page for it is built here, style and all, so index.html and style.css do not have to know.

import * as THREE from 'three';
import * as TX from './textures.js';
import { imageUrl } from './collection.js';
import { RepairGame, H, CY, EXIT, NEED, speedAt } from './repairgame.js';

// The belt is this long, in the rules' units (and 540 across); the table top is the same shape, 2.4 m by 1.08 m.
const BELT = 1200, PX = 1.25, TOP_W = 2.4, TOP_H = TOP_W * H / BELT, TOP_Y = 0.297, TOP_OUT = 0.67;

const KEY = 'after-hours.repair';
const $ = id => document.getElementById(id);

const CSS = `
#repair { position: fixed; inset: 0; z-index: 30; background: none; pointer-events: none; color: #e9e2d0; font-family: var(--mono, ui-monospace, Menlo, Consolas, monospace); user-select: none; -webkit-user-select: none; overflow: hidden; }
#repair[hidden] { display: none; }
#repCanvas { position: absolute; left: 0; top: 0; width: 100%; height: 100%; display: block; touch-action: none; outline: none; cursor: crosshair; opacity: 0; pointer-events: auto; }
#repair .bar, #repEnd { pointer-events: auto; }
#repair .bar { position: absolute; left: 0; right: 0; top: 0; display: flex; align-items: center; gap: 18px; padding: max(6px, env(safe-area-inset-top)) max(12px, env(safe-area-inset-right)) 6px max(12px, env(safe-area-inset-left)); background: rgba(20,17,13,.78); font-size: 12px; letter-spacing: .1em; text-transform: uppercase; }
#repName { color: var(--gilt, #e2cd94); font-weight: 700; font-size: 14px; letter-spacing: .16em; margin-right: auto; white-space: nowrap; }
#repair .sc { white-space: nowrap; } #repair .sc b { color: #fff; font-size: 15px; }
#repair .acc { display: flex; align-items: center; gap: 8px; white-space: nowrap; }
#repAcc { display: inline-block; min-width: 3.2em; text-align: right; }
#repair .meter { position: relative; display: inline-block; width: 150px; height: 12px; border-radius: 6px; background: #2a251d; box-shadow: inset 0 0 0 1px #6b5f48; overflow: hidden; }
#repair .meter .fill { position: absolute; left: 0; top: 0; bottom: 0; width: 100%; background: #86c47a; transition: width .15s linear; }
#repair .meter.low .fill { background: #d2603f; }
#repair .meter.wait .fill { background: #9c9482; }
#repair .meter .mark { position: absolute; top: -2px; bottom: -2px; left: 80%; width: 2px; background: #fff; }
#repair .acc small { font-size: 10px; color: #b7ad96; letter-spacing: .06em; }
#repair button { border: 2px solid rgba(226,205,148,.55); background: rgba(30,25,18,.9); color: #e9e2d0; font: 700 13px var(--mono, monospace); letter-spacing: .1em; border-radius: 10px; min-width: 88px; height: 44px; padding: 0 14px; touch-action: none; }
#repair button:active { background: rgba(226,205,148,.3); }
#repHelp { position: absolute; left: 0; right: 0; bottom: max(6px, env(safe-area-inset-bottom)); text-align: center; font-size: 12px; letter-spacing: .03em; color: #e4dcc6; pointer-events: none; padding: 0 12px; text-shadow: 0 1px 2px #000, 0 0 6px #000; }
#repEnd { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(12,10,8,.72); padding: 12px; }
#repEnd[hidden] { display: none; }
#repEnd .memo { width: min(560px, 100%); max-height: 100%; overflow: auto; background: #f1ead8; color: #26221b; border-radius: 3px; padding: 22px 26px 18px; box-shadow: 0 14px 50px rgba(0,0,0,.6); font-family: "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif; font-size: 16px; line-height: 1.45; user-select: text; -webkit-user-select: text; }
#repEnd .head { font: 700 11px var(--mono, monospace); letter-spacing: .16em; text-transform: uppercase; color: #6b5f48; border-bottom: 1px solid #b9ad90; padding-bottom: 8px; margin-bottom: 12px; display: flex; justify-content: space-between; gap: 12px; }
#repEnd h2 { font: 600 19px "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif; margin: 0 0 10px; color: #26221b; text-transform: none; letter-spacing: 0; }
#repEnd p { margin: 0 0 10px; }
#repEnd .verdict { font-weight: 700; }
#repEnd .row { display: flex; gap: 12px; margin-top: 16px; }
#repEnd button { flex: 1; background: #26221b; color: #f1ead8; border-color: #26221b; }
#repEnd button.go { background: #8a6a1c; border-color: #8a6a1c; }
#repEnd button:focus-visible, #repair .bar button:focus-visible { outline: 3px solid #5aa0ff; outline-offset: 2px; }
.bigtext #repHelp, .bigtext #repair .bar { font-size: 15px; } .bigtext #repEnd .memo { font-size: 19px; }
@media (max-height: 520px) { #repair .bar { gap: 12px; font-size: 11px; } #repName { font-size: 12px; } #repair .meter { width: 96px; } #repair .bar button { height: 40px; min-width: 76px; } #repEnd .memo { padding: 12px 18px 12px; font-size: 14px; line-height: 1.32; } #repEnd h2 { font-size: 16px; margin-bottom: 6px; } #repEnd p { margin-bottom: 6px; } #repEnd .row { margin-top: 8px; } #repEnd .head { margin-bottom: 8px; padding-bottom: 5px; } }
@media (max-width: 700px) { #repName { display: none; } #repair .acc small { display: none; } }
`;

function rng(seed) { let a = (seed >>> 0) || 1; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const plural = (n, one, many) => `${n} ${n === 1 ? one : many || one + 's'}`;

export class Repair {
  constructor(museum, plan, sound, collection, stage) {
    this.plan = plan; this.sound = sound; this.stage = stage || null; this.on = false; this.game = null; this.best = 0; this.shifts = 0;
    try { const s = JSON.parse(localStorage.getItem(KEY) || '{}'); this.best = +s.best || 0; this.shifts = +s.shifts || 0; } catch { /* no storage */ }
    // Only what is in the public domain may be put on the belt.
    const seen = new Set();
    this.works = museum.arts.filter(a => !a.obj && !a.mini && a.work && a.work.img && !a.work.c && !seen.has(a.work.id) && seen.add(a.work.id)).map(a => a.work);
    this.pics = new Map();           // work id -> { soft: canvas, img: Image | null, tone: css colour }
    this.fx = []; this.keys = false; this.shake = 0; this.flash = 0; this.t = 0;
    this._dom();
    this._station(museum, plan);
  }

  // ---------------------------------------------------------------- the room --

  _station(museum, plan) {
    const g = this.group = new THREE.Group(); museum.group.add(g);
    const paint = new THREE.Color(0.62, 0.6, 0.56);
    const board = (lines, w, h, at, y, out) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: notice(lines, w / h), color: paint }));
      m.position.set(at.x + at.fx * out, at.y + y, at.z + at.fz * out); m.rotation.y = Math.atan2(at.fx, at.fz); m.matrixAutoUpdate = false; m.updateMatrix();
      g.add(m);
    };
    const a = this.at = plan.repair || null;
    if (a) {
      board(['The Conservation Line', 'steady hands wanted'], 1.6, 0.56, a, 1.42, 0.02);
      // The top of the table: the belt, drawn here and lit from within, like the screens. It is what the game is played on.
      const cv = $('repCanvas');
      const tex = this.tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8; tex.generateMipmaps = false; tex.minFilter = THREE.LinearFilter;
      const top = new THREE.Mesh(new THREE.PlaneGeometry(TOP_W, TOP_H), new THREE.MeshBasicMaterial({ map: tex, color: new THREE.Color(0.86, 0.86, 0.86) }));
      const up = new THREE.Vector3(-a.fx, 0, -a.fz), n = new THREE.Vector3(0, 1, 0), right = new THREE.Vector3().crossVectors(up, n);
      top.matrix.makeBasis(right, up, n).setPosition(a.x + a.fx * TOP_OUT, a.y + TOP_Y, a.z + a.fz * TOP_OUT); top.matrixAutoUpdate = false;
      g.add(top);
      this.surface = { x: a.x + a.fx * TOP_OUT, y: a.y + TOP_Y, z: a.z + a.fz * TOP_OUT, nx: 0, ny: 1, nz: 0, w: TOP_W, h: TOP_H, up: [-a.fx, 0, -a.fz] };
      // The lamp's light on the floor in front: the one warm thing in the room.
      const pool = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 2.4), new THREE.MeshBasicMaterial({ map: TX.radial(0, 1), color: new THREE.Color(0.42, 0.3, 0.14), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }));
      pool.rotation.x = -Math.PI / 2; pool.position.set(a.x + a.fx * 1.9, a.y + 0.014, a.z + a.fz * 1.9); pool.renderOrder = 4; pool.matrixAutoUpdate = false; pool.updateMatrix();
      g.add(pool);
      a.sx = a.x + a.fx * 2.05; a.sz = a.z + a.fz * 2.05;
      this._idle();
      setTimeout(() => { if (!this.on) this._idle(); }, 2500);          // again once the previews have decoded
    }
    for (const n of plan.repairNotes || []) board(['The conservation line', 'is in the other studio', 'of this name'], 0.56, 0.4, n, 0.44, 0.275);
  }

  // The bench this toy is pulled up in front of, if it is.
  near(v) {
    const a = this.at;
    if (!a || this.on) return null;
    const dy = v.pos.y - a.y;
    if (dy < -0.3 || dy > 2.4) return null;
    const dx = v.pos.x - a.sx, dz = v.pos.z - a.sz;
    if (dx * dx + dz * dz > 1.7 * 1.7 || (v.pos.x - a.x) * a.fx + (v.pos.z - a.z) * a.fz < 1.38 || Math.hypot(v.vel.x, v.vel.z) > 3) return null;
    return a;
  }

  // ------------------------------------------------------------- the pictures --

  // What a work looks like on the belt: straight away, a soft enlargement of its tiny preview (or,
  // with no preview, something painterly made up from its number); later, if it comes, the image.
  _pic(work) {
    let p = this.pics.get(work.id);
    if (p) return p;
    const aspect = work.iw && work.ih ? work.iw / work.ih : 0.8, w = aspect >= 1 ? 96 : Math.max(24, Math.round(96 * aspect)), h = aspect >= 1 ? Math.max(24, Math.round(96 / aspect)) : 96;
    const soft = document.createElement('canvas'); soft.width = w; soft.height = h;
    const c = soft.getContext('2d'), r = rng(work.id * 2654435761);
    // Made up: a ground, a horizon, a few soft masses.
    const hue = Math.floor(r() * 360), g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, `hsl(${hue},32%,${38 + r() * 20}%)`); g.addColorStop(0.55 + r() * 0.2, `hsl(${(hue + 30) % 360},30%,${30 + r() * 16}%)`); g.addColorStop(1, `hsl(${(hue + 200) % 360},26%,${20 + r() * 14}%)`);
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 7; i++) { const x = r() * w, y = r() * h, q = (0.12 + r() * 0.3) * Math.max(w, h), k = c.createRadialGradient(x, y, 0, x, y, q); k.addColorStop(0, `hsla(${(hue + r() * 140) % 360},${30 + r() * 30}%,${25 + r() * 45}%,.75)`); k.addColorStop(1, 'hsla(0,0%,0%,0)'); c.fillStyle = k; c.fillRect(0, 0, w, h); }
    p = { soft, img: null, tone: `hsl(${hue},30%,45%)`, aspect };
    this.pics.set(work.id, p);
    if (work.lq) {
      const lq = new Image();
      lq.onload = () => { try { c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high'; if ('filter' in c) c.filter = 'blur(1.2px)'; c.drawImage(lq, -2, -2, w + 4, h + 4); if ('filter' in c) c.filter = 'none'; const d = c.getImageData(w >> 1, h >> 1, 1, 1).data; p.tone = `rgb(${d[0]},${d[1]},${d[2]})`; } catch { /* keep what was made up */ } };
      lq.src = work.lq;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous'; img.referrerPolicy = 'no-referrer'; img.decoding = 'async';
    img.onload = () => { if (img.naturalWidth > 8) p.img = img; };
    img.onerror = () => { /* the preview will do */ };
    try { img.src = imageUrl(work, 400); } catch { /* fine */ }
    return p;
  }

  // ------------------------------------------------------------------ a shift --

  open() {
    if (!this.at || this.on) return;
    this.on = true; this.keys = false;
    $('repair').hidden = false;
    $('repHelp').textContent = document.body.classList.contains('touch')
      ? 'Tap each blemish before its painting leaves the belt. A tap on a good bit counts against you.'
      : 'Click each blemish before its painting leaves the belt. Keys: ← → choose, Space repairs. R starts again, Esc leaves.';
    if (this.stage && this.surface) this.stage.enter(this.surface, { el: $('repCanvas'), fill: 0.84 });
    this._new();
    $('repCanvas').focus({ preventScroll: true });
  }
  // What the table shows when nobody is at it: the belt stopped, a few paintings waiting.
  _idle() {
    const order = this.works, r = rng(77);
    const g = new RepairGame({ width: BELT, seed: 5, source: i => { const work = order.length ? order[(i * 37 + 11) % order.length] : null; if (!work) return { aspect: 0.7 + r() * 0.8, work: null }; const pic = this._pic(work); return { aspect: pic.aspect, work, pic }; } });
    g.t = 99; g.repaired = 30; for (let k = 0; k < 3; k++) { const p = g._spawn(false); p.x = 150 + k * 330; } g.paintings.shift(); g.repaired = 0;
    const was = this.game; this.game = g; this._draw(true, true); this.game = was;
  }
  _new() {
    // Tonight's works, shuffled afresh for each shift.
    const r = rng((Date.now() ^ (this.shifts * 7919)) >>> 0), order = this.works.slice();
    for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
    this.game = new RepairGame({ width: BELT, minHit: this._reach(), seed: Math.floor(r() * 4294967296), source: i => { const work = order.length ? order[i % order.length] : null; if (!work) return { aspect: 0.7 + r() * 0.8, work: null }; const pic = this._pic(work); return { aspect: pic.aspect, work, pic }; } });
    for (let i = 1; i < Math.min(5, order.length); i++) this._pic(order[i]);        // have the next few ready
    this.fx.length = 0; this.shake = 0; this.flash = 0; this.told = false; this.fresh = false;
    $('repEnd').hidden = true; $('repHelp').hidden = false;
    this.shifts++; this._save();
    this._hud();
    this._tell('start');
  }
  leave() {
    if (!this.on) return;
    if (this.game && !this.told) { this._record(); this._tell('end', this.game.over); }
    this.on = false; this.game = null;
    if (this.stage && this.stage.on) this.stage.leave();
    $('repair').hidden = true;
    this.fx.length = 0; this.shake = 0; this.flash = 0;
    this._idle();
  }
  press(k) { if (!this.on) return; if (k === 'leave') this.leave(); else if (k === 'again') { if (this.game && !this.told) { this._record(); this._tell('end', this.game.over); } this._new(); $('repCanvas').focus({ preventScroll: true }); } }
  _record() { const g = this.game; if (!g || !(g.score > this.best)) return false; this.best = g.score; this._save(); return true; }
  _save() { try { localStorage.setItem(KEY, JSON.stringify({ best: this.best, shifts: this.shifts })); } catch { /* fine */ } }
  _tell(event, sent) { const g = this.game; try { window.dispatchEvent(new CustomEvent('museum:repair', { detail: { event, repaired: g ? g.repaired : 0, accuracy: g ? g.accuracy : 1, score: g ? g.score : 0, sent: !!sent } })); } catch { /* fine */ } }

  _hud() {
    const g = this.game; if (!g) return;
    const acc = g.accuracy, pct = Math.floor(acc * 100 + 1e-9), m = $('repMeter');
    $('repScore').textContent = g.score; $('repBest').textContent = Math.max(this.best, 0);
    $('repAcc').textContent = pct + '%';
    m.querySelector('.fill').style.width = Math.max(0, Math.min(100, (acc - 0.5) * 200)) + '%';      // the bar runs from 50% to 100%; the white line is 90%
    m.classList.toggle('low', acc < 0.9); m.classList.toggle('wait', g.resolved < NEED && acc >= 0.9);
    m.setAttribute('aria-valuenow', pct);
    $('repNote').textContent = g.resolved < NEED ? `reviewed after ${NEED - g.resolved} more` : `belt ×${(g.speed / speedAt(0)).toFixed(1)}`;
    this.shown = g.repaired + g.missed * 1000 + g.stray * 1e6;
  }

  // The notice from Human Resources.
  _end() {
    const g = this.game, s = g.summary(), pct = Math.floor(s.accuracy * 100 + 1e-9);
    this.told = true; this.fresh = this._record();
    this._tell('end', true);
    $('repWhen').textContent = new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
    $('repBody').textContent = `In the course of it you repaired ${plural(s.repaired, 'blemish', 'blemishes')}. ${plural(s.paintings, 'painting')} left the belt spotless. `
      + `${s.missed === 0 ? 'No blemishes' : plural(s.missed, 'blemish', 'blemishes')} went by untreated, and you dabbed at ${s.stray === 0 ? 'no good paint' : plural(s.stray, 'perfectly good bit')}. `
      + `Your accuracy was ${pct}%. The standard for the line is 90%.`;
    $('repVerdict').textContent = 'You are asked to return tomorrow for remedial training.';
    $('repPs').textContent = (this.fresh ? `${s.score} is the most you have repaired in one shift; this has been noted on your file. ` : `Your best shift on file remains ${this.best}. `) + 'Aprons are to be returned to the hook.';
    $('repEnd').hidden = false; $('repHelp').hidden = true;
    this._hud();
    const s2 = this.sound; if (s2) { s2.bell(196, 0, 0.06, 2.4); setTimeout(() => s2.bell(146.83, 0, 0.06, 3), 260); }
    setTimeout(() => { if (this.on && this.told) $('repAgain').focus({ preventScroll: true }); }, 30);
  }

  // How near a touch must land, in the belt's units: never a smaller target than a fingertip (52 px across at the least),
  // however small the table is on the screen.
  _reach() { const r = $('repCanvas').getBoundingClientRect(); return 26 * BELT / Math.max(200, r.width || innerWidth * 0.84); }
  // A touch or a click at a place on the screen: the pane lies exactly over the table top, so where on the pane is where on the belt.
  _tapAt(cx, cy) {
    const g = this.game; if (!g || g.over) return;
    const r = $('repCanvas').getBoundingClientRect();
    g.minHit = this._reach();
    g.tap((cx - r.left) / r.width * BELT, (cy - r.top) / r.height * H);
  }
  key(e) {
    if (!this.on) return false;
    if (e.code === 'Escape') { if (!e.repeat) this.leave(); return true; }
    if (e.code === 'KeyR') { if (!e.repeat) this.press('again'); return true; }
    const g = this.game; if (!g) return false;
    if (g.over) return false;                              // the notice's own buttons have the keys now
    if (e.code === 'ArrowLeft' || e.code === 'ArrowUp' || (e.code === 'Tab' && !e.shiftKey)) { this.keys = true; g.cycle(1); return true; }
    if (e.code === 'ArrowRight' || e.code === 'ArrowDown' || (e.code === 'Tab' && e.shiftKey)) { this.keys = true; g.cycle(-1); return true; }
    if (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyE') { if (!e.repeat) { this.keys = true; g.dab(); } return true; }
    return false;
  }

  // One frame of it.
  frame(dt) {
    const g = this.game; if (!g) return;
    const calm = document.body.classList.contains('reduce');
    this.t += dt;
    if (!g.over) g.update(dt);
    for (const f of g.fx.splice(0)) {
      const s = this.sound;
      if (f.type === 'fix') { this.fx.push({ ...f, t: 0, len: 0.55 }); if (s) s.bell(880 + (g.repaired % 5) * 110, 0, 0.022, 0.45, 0.35); }
      else if (f.type === 'spotless') { this.fx.push({ ...f, t: 0, len: 0.9 }); if (s) s.bell(1760, 0, 0.016, 0.8, 0.5); }
      else if (f.type === 'miss') { this.fx.push({ ...f, t: 0, len: 1.1 }); this.flash = 1; if (!calm) this.shake = 0.22; if (s) s.beep(110, 0.16, 0.04); }
      else if (f.type === 'stray') { this.fx.push({ ...f, t: 0, len: 1.0 }); this.flash = 0.7; if (!calm) this.shake = 0.14; if (s) s.tick(0.1, 420, 0.07); }
    }
    for (const f of this.fx) f.t += dt;
    this.fx = this.fx.filter(f => f.t < f.len);
    this.shake = Math.max(0, this.shake - dt); this.flash = Math.max(0, this.flash - dt * 1.6);
    if (g.repaired + g.missed * 1000 + g.stray * 1e6 !== this.shown || Math.floor(this.t * 4) !== this._q) { this._q = Math.floor(this.t * 4); this._hud(); }
    if (g.over && !this.told) this._end();
    g.minHit = this._reach();
    this._draw(calm);
  }

  // ------------------------------------------------------------------ drawing --

  _draw(calm, idle) {
    const cv = $('repCanvas'), c = this.ctx, g = this.game, W = BELT, s = PX;
    this.W = W; this.scale = 1;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.fillStyle = '#14110d'; c.fillRect(0, 0, cv.width, cv.height);
    const sx = this.shake > 0 ? Math.sin(this.t * 90) * 5 * (this.shake / 0.22) : 0;
    c.setTransform(s, 0, 0, s, sx * s, 0);
    const top = 104, bot = 432;
    // The studio wall, and the bench.
    let gr = c.createLinearGradient(0, -200, 0, top); gr.addColorStop(0, '#191612'); gr.addColorStop(1, '#2b251c');
    c.fillStyle = gr; c.fillRect(-400, -300, W + 800, top + 300);
    gr = c.createLinearGradient(0, bot, 0, H + 200); gr.addColorStop(0, '#5b452b'); gr.addColorStop(0.12, '#4a3823'); gr.addColorStop(1, '#22190f');
    c.fillStyle = gr; c.fillRect(-400, bot, W + 800, H + 300 - bot);
    c.fillStyle = 'rgba(0,0,0,.25)'; for (let x = -400 + (0 % 90); x < W + 400; x += 90) c.fillRect(x, bot + 26, 2, H + 300);
    // The belt, with cleats that move.
    c.fillStyle = '#23262a'; c.fillRect(-400, top, W + 800, bot - top);
    c.fillStyle = '#2c3035'; const step = 64, off = g.travel % step;
    for (let x = -400 - step + off; x < W + 400; x += step) c.fillRect(x, top + 6, 5, bot - top - 12);
    c.fillStyle = '#c9a227'; c.fillRect(-400, top, W + 800, 5); c.fillRect(-400, bot - 5, W + 800, 5);
    c.fillStyle = '#17191c'; for (let x = -400 - 32 + (g.travel % 32); x < W + 400; x += 32) { c.fillRect(x, top, 14, 5); c.fillRect(x, bot - 5, 14, 5); }
    // Rollers under the front edge.
    for (let x = 40; x < W; x += 150) { c.fillStyle = '#3a3e44'; c.beginPath(); c.arc(x, bot + 16, 11, 0, 7); c.fill(); c.strokeStyle = '#8b9199'; c.lineWidth = 2; const a = g.travel / 11; c.beginPath(); c.moveTo(x - Math.cos(a) * 9, bot + 16 - Math.sin(a) * 9); c.lineTo(x + Math.cos(a) * 9, bot + 16 + Math.sin(a) * 9); c.stroke(); }
    // The lamp: its light on the belt.
    gr = c.createRadialGradient(W / 2, CY - 40, 40, W / 2, CY, Math.max(420, W * 0.62)); gr.addColorStop(0, 'rgba(255,236,190,.20)'); gr.addColorStop(0.5, 'rgba(255,225,170,.07)'); gr.addColorStop(1, 'rgba(0,0,0,.42)');
    c.fillStyle = gr; c.fillRect(-400, top, W + 800, bot - top);

    const sel = this.keys && !g.over && !idle ? g.selected() : null;
    for (const p of g.paintings) this._painting(c, p, g);
    if (sel) { c.strokeStyle = '#fff'; c.lineWidth = 3; c.setLineDash([7, 5]); c.lineDashOffset = -this.t * 30 * (calm ? 0 : 1); c.beginPath(); c.arc(sel.x, sel.y, g.reach(sel.b) + 4, 0, 7); c.stroke(); c.setLineDash([]); c.strokeStyle = 'rgba(0,0,0,.6)'; c.lineWidth = 1.5; c.beginPath(); c.arc(sel.x, sel.y, g.reach(sel.b) + 7, 0, 7); c.stroke(); }

    // The hoods at either end: in at the left, out at the right.
    const hood = (x0, x1, label) => { const k = c.createLinearGradient(x0, 0, x1, 0); k.addColorStop(0, '#3b4047'); k.addColorStop(0.5, '#565c65'); k.addColorStop(1, '#343840'); c.fillStyle = k; c.fillRect(x0, top - 22, x1 - x0, bot - top + 44); c.fillStyle = '#1b1d20'; c.fillRect(x0, top - 22, x1 - x0, 6); c.fillRect(x0, bot + 16, x1 - x0, 6); c.save(); c.translate(label ? x0 + EXIT / 2 : (x0 + x1) / 2, CY); c.rotate(-Math.PI / 2); c.fillStyle = '#e8c64a'; c.font = '700 15px ui-monospace, Menlo, Consolas, monospace'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(label, 0, 0); c.restore(); };
    hood(W - EXIT, W + 400, 'OUT →'); hood(-400, 16, '');
    // The lamp itself, on its arm, over the middle.
    c.strokeStyle = '#0d0c0a'; c.lineWidth = 7; c.lineCap = 'round'; c.beginPath(); c.moveTo(W / 2 + 190, -40); c.lineTo(W / 2 + 96, 44); c.lineTo(W / 2 + 6, 62); c.stroke();
    c.fillStyle = '#1f2327'; c.beginPath(); c.moveTo(W / 2 - 58, 92); c.lineTo(W / 2 - 34, 56); c.lineTo(W / 2 + 34, 56); c.lineTo(W / 2 + 58, 92); c.closePath(); c.fill();
    c.fillStyle = '#ffe9b8'; c.beginPath(); c.ellipse(W / 2, 92, 56, 5, 0, 0, 7); c.fill();
    gr = c.createLinearGradient(0, 92, 0, top + 40); gr.addColorStop(0, 'rgba(255,233,184,.22)'); gr.addColorStop(1, 'rgba(255,233,184,0)');
    c.fillStyle = gr; c.beginPath(); c.moveTo(W / 2 - 56, 93); c.lineTo(W / 2 + 56, 93); c.lineTo(W / 2 + 210, top + 40); c.lineTo(W / 2 - 210, top + 40); c.closePath(); c.fill();

    // What has just happened.
    for (const f of this.fx) this._effect(c, f, calm);
    // The first few seconds: what to do.
    if (g.teaching && !g.over && g.repaired < 3 && !idle) {
      const t0 = g.targets()[0];
      if (t0) { const k = calm ? 0.5 : 0.5 + 0.5 * Math.sin(this.t * 5); c.strokeStyle = `rgba(255,255,255,${0.35 + 0.5 * k})`; c.lineWidth = 3; c.beginPath(); c.arc(t0.x, t0.y, g.reach(t0.b) + 6 + (calm ? 0 : k * 6), 0, 7); c.stroke(); }
    }
    // A wrong one: the edge of the screen goes red for a moment.
    if (idle) { c.fillStyle = 'rgba(8,6,4,.34)'; c.fillRect(-10, -10, W + 20, H + 20); c.fillStyle = '#ffe9b8'; c.font = '700 30px ui-monospace, Menlo, Consolas, monospace'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(this.best ? `BEST SHIFT  ${this.best}` : 'STAFF WANTED', W / 2, 474); }
    if (this.tex) this.tex.needsUpdate = true;
    if (this.flash > 0 && !idle) { c.setTransform(1, 0, 0, 1, 0, 0); const v = c.createRadialGradient(cv.width / 2, cv.height / 2, Math.min(cv.width, cv.height) * 0.42, cv.width / 2, cv.height / 2, Math.max(cv.width, cv.height) * 0.72); v.addColorStop(0, 'rgba(200,50,30,0)'); v.addColorStop(1, `rgba(200,50,30,${0.5 * this.flash})`); c.fillStyle = v; c.fillRect(0, 0, cv.width, cv.height); }
  }

  _painting(c, p, g) {
    const F = p.f, x = p.x, y = p.y, w = p.w, h = p.h, pic = p.src && p.src.pic;
    // Its shadow on the belt.
    c.fillStyle = 'rgba(0,0,0,.38)'; c.fillRect(x + 7, y + 9, w, h);
    // The frame: gilt, with a dark sight edge and a light one outside.
    const gr = c.createLinearGradient(x, y, x + w, y + h); gr.addColorStop(0, '#f0d27c'); gr.addColorStop(0.3, '#b98d2e'); gr.addColorStop(0.55, '#e9c868'); gr.addColorStop(0.8, '#9a7322'); gr.addColorStop(1, '#d7b257');
    c.fillStyle = gr; c.fillRect(x, y, w, h);
    c.strokeStyle = 'rgba(255,244,200,.75)'; c.lineWidth = 1.5; c.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3);
    c.strokeStyle = 'rgba(70,45,5,.7)'; c.lineWidth = 2; c.strokeRect(x + F * 0.45, y + F * 0.45, w - F * 0.9, h - F * 0.9);
    c.fillStyle = '#3a2a0c'; c.fillRect(x + F - 2, y + F - 2, w - 2 * F + 4, h - 2 * F + 4);
    const ix = x + F, iy = y + F, iw = w - 2 * F, ih = h - 2 * F;
    c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
    if (pic) c.drawImage(pic.img || pic.soft, ix, iy, iw, ih);
    else { c.fillStyle = `hsl(${(p.id * 67) % 360},28%,36%)`; c.fillRect(ix, iy, iw, ih); c.fillStyle = `hsl(${(p.id * 67 + 150) % 360},30%,52%)`; c.fillRect(ix + iw * 0.2, iy + ih * 0.3, iw * 0.45, ih * 0.4); }
    c.fillStyle = 'rgba(255,255,255,.05)'; c.fillRect(ix, iy, iw, ih * 0.45);
    for (const b of p.blemishes) {
      if (b.fixed) continue;
      c.save(); c.translate(x + b.dx, y + b.dy); if (b.missed) c.globalAlpha = 0.45; blemish(c, b); c.restore();
    }
    if (p.complete) { c.strokeStyle = 'rgba(160,255,170,.8)'; c.lineWidth = 3; c.strokeRect(x - 3, y - 3, w + 6, h + 6); }
    // Its label, in small type on the belt underneath.
    const work = p.src && p.src.work;
    if (work) {
      const px = 19, max = Math.max(w + 90, 240);
      c.textAlign = 'center'; c.textBaseline = 'top';
      c.font = `italic 600 ${px}px "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif`; c.fillStyle = '#efe7d2';
      c.fillText(clip(c, work.t || 'Untitled', max), x + w / 2, y + h + 7);
      c.font = `${px * 0.88}px "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif`; c.fillStyle = '#b9ae95';
      c.fillText(clip(c, work.a || 'Artist unknown', max), x + w / 2, y + h + 11 + px * 1.12);
    }
  }

  _effect(c, f, calm) {
    const k = f.t / f.len;
    c.save();
    if (f.type === 'fix') {
      // A dab of colour, and a small sparkle (with motion reduced: a ring that fades).
      c.globalAlpha = Math.max(0, 1 - k * 1.3); c.fillStyle = 'rgba(255,250,230,.55)'; c.beginPath(); c.arc(f.x, f.y, 13 + (calm ? 0 : k * 6), 0, 7); c.fill();
      c.globalAlpha = 1 - k; c.strokeStyle = '#fff6c8'; c.lineWidth = 2.5;
      if (calm) { c.beginPath(); c.arc(f.x, f.y, 22, 0, 7); c.stroke(); }
      else { c.beginPath(); c.arc(f.x, f.y, 12 + k * 26, 0, 7); c.stroke(); for (let i = 0; i < 6; i++) { const a = i * 1.047 + 0.4, r0 = 16 + k * 22, r1 = r0 + 9 * (1 - k); c.beginPath(); c.moveTo(f.x + Math.cos(a) * r0, f.y + Math.sin(a) * r0); c.lineTo(f.x + Math.cos(a) * r1, f.y + Math.sin(a) * r1); c.stroke(); } }
    } else if (f.type === 'spotless') {
      c.globalAlpha = 1 - k; c.fillStyle = '#b8f5b0'; c.font = '700 15px ui-monospace, Menlo, Consolas, monospace'; c.textAlign = 'center'; c.textBaseline = 'bottom';
      c.fillText('SPOTLESS', f.x, f.y - 8 - (calm ? 0 : k * 14));
    } else if (f.type === 'miss' || f.type === 'stray') {
      const miss = f.type === 'miss', x = miss ? Math.min(f.x, this.W - EXIT - 12) : f.x, y = f.y;
      c.globalAlpha = 1 - k * k; c.strokeStyle = '#ff6a4a'; c.lineWidth = 4; c.lineCap = 'round';
      c.beginPath(); c.moveTo(x - 11, y - 11); c.lineTo(x + 11, y + 11); c.moveTo(x + 11, y - 11); c.lineTo(x - 11, y + 11); c.stroke();
      c.fillStyle = '#ffb19c'; c.font = '700 13px ui-monospace, Menlo, Consolas, monospace'; c.textAlign = miss ? 'right' : 'center'; c.textBaseline = 'bottom';
      c.fillText(miss ? 'MISSED' : 'A GOOD BIT', miss ? x + 12 : x, y - 18 - (calm ? 0 : k * 12));
    }
    c.restore();
  }

  // ---------------------------------------------------------------- the page --

  _dom() {
    if (typeof document === 'undefined' || $('repair')) return;
    const st = document.createElement('style'); st.textContent = CSS; document.head.append(st);
    const root = document.createElement('div');
    root.id = 'repair'; root.hidden = true; root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-labelledby', 'repName');
    root.innerHTML = `<canvas id="repCanvas" width="${BELT * PX}" height="${H * PX}" tabindex="-1" aria-label="The conveyor belt. Paintings with blemishes travel from left to right."></canvas>
<div class="bar"><span id="repName">The Conservation Line</span><span class="sc">Repaired <b id="repScore">0</b></span><span class="sc">Best <b id="repBest">0</b></span>
<span class="acc">Accuracy <b id="repAcc">100%</b><span class="meter" id="repMeter" role="meter" aria-label="Accuracy. The line marks 90 percent." aria-valuemin="50" aria-valuemax="100" aria-valuenow="100"><i class="fill"></i><i class="mark"></i></span><small id="repNote"></small></span>
<button data-act="repairLeave" id="repLeave">LEAVE</button></div>
<div id="repHelp" role="status"></div>
<section id="repEnd" hidden aria-labelledby="repHead"><div class="memo"><div class="head"><span>Human Resources · Conservation</span><span id="repWhen"></span></div>
<h2 id="repHead">Re: your shift on the Conservation Line</h2><p>Thank you for your time on the line this evening.</p><p id="repBody"></p><p class="verdict" id="repVerdict"></p><p id="repPs"></p>
<div class="row"><button data-act="repairAgain" id="repAgain" class="go" data-first>AGAIN</button><button data-act="repairLeave" id="repLeave2">LEAVE</button></div></div></section>`;
    document.body.append(root);
    const cv = $('repCanvas');
    this.ctx = cv.getContext('2d');
    addEventListener('keydown', e => { if (this.on && this.key(e)) e.preventDefault(); });
    // Every finger is its own touch: two thumbs can work the belt at once.
    cv.addEventListener('pointerdown', e => { if (!this.on) return; e.preventDefault(); if (e.pointerType === 'mouse' && e.button !== 0) return; if (e.pointerType !== 'touch') this.keys = false; this._tapAt(e.clientX, e.clientY); });
    cv.addEventListener('contextmenu', e => e.preventDefault());
    for (const ev of ['touchstart', 'touchmove']) cv.addEventListener(ev, e => { if (this.on) e.preventDefault(); }, { passive: false });      // no scrolling, no zooming, no loupe
  }
}

// A painted notice for the wall: a cream board, a dark rule round it, the first line large and the rest in italics, each made to fit.
function notice(lines, aspect) {
  const cv = document.createElement('canvas'); cv.height = 256; cv.width = Math.round(256 * aspect);
  const c = cv.getContext('2d'), W = cv.width, serif = '"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif';
  c.fillStyle = '#efe6cf'; c.fillRect(0, 0, W, 256); c.strokeStyle = '#1d3a2c'; c.lineWidth = 8; c.strokeRect(12, 12, W - 24, 232);
  c.fillStyle = '#1d3a2c'; c.textAlign = 'center'; c.textBaseline = 'middle';
  lines.forEach((l, i) => { let px = i === 0 ? 64 : 44; c.font = `${i === 0 ? '600 ' : 'italic '}${px}px ${serif}`; const w = c.measureText(l).width; if (w > W - 56) { px = Math.floor(px * (W - 56) / w); c.font = `${i === 0 ? '600 ' : 'italic '}${px}px ${serif}`; } c.fillText(l, W / 2, 128 + (i - (lines.length - 1) / 2) * 70); });
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}

// Text that fits: cut short with an ellipsis if it must be.
function clip(c, text, max) {
  if (c.measureText(text).width <= max) return text;
  let s = text;
  while (s.length > 3 && c.measureText(s + '…').width > max) s = s.slice(0, -1);
  return s.replace(/[\s,;:]+$/, '') + '…';
}

// One blemish, drawn about (0, 0), from its own seed so it never changes as it travels. Each has a
// dark part and a light part, so it shows against any picture.
function blemish(c, b) {
  const r = rng(b.seed + 1), R = b.r;
  c.lineCap = 'round'; c.lineJoin = 'round';
  switch (b.kind) {
    case 'scratch': {
      const a = r() * Math.PI, n = 2 + (r() < 0.5 ? 1 : 0);
      c.rotate(a);
      for (let i = 0; i < n; i++) {
        const o = (i - (n - 1) / 2) * 7, pts = []; for (let k = 0; k <= 5; k++) pts.push([-R + 2 * R * k / 5 + (r() - 0.5) * 3, o + (r() - 0.5) * 5]);
        for (const [col, lw, dy] of [['rgba(20,12,6,.8)', 4.6, 1.2], ['#f4efe2', 2.2, 0]]) { c.strokeStyle = col; c.lineWidth = lw; c.beginPath(); pts.forEach((p, k) => (k ? c.lineTo(p[0], p[1] + dy) : c.moveTo(p[0], p[1] + dy))); c.stroke(); }
      }
      break;
    }
    case 'flake': {
      const pts = []; for (let k = 0; k < 9; k++) { const a = k / 9 * 6.283, q = R * (0.62 + r() * 0.42); pts.push([Math.cos(a) * q, Math.sin(a) * q]); }
      c.fillStyle = 'rgba(25,15,8,.75)'; c.beginPath(); pts.forEach((p, k) => (k ? c.lineTo(p[0] + 1.5, p[1] + 2) : c.moveTo(p[0] + 1.5, p[1] + 2))); c.closePath(); c.fill();
      c.fillStyle = '#efe6d2'; c.strokeStyle = '#8a7a5c'; c.lineWidth = 1.4; c.beginPath(); pts.forEach((p, k) => (k ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = '#d9cdb2'; for (let k = 0; k < 4; k++) { c.beginPath(); c.arc((r() - 0.5) * R * 2.1, (r() - 0.5) * R * 2.1, 1.6 + r() * 1.8, 0, 7); c.fill(); }
      break;
    }
    case 'tear': {
      c.rotate((r() - 0.5) * 1.6);
      const L = R * 0.95, pts = [[-L, 0]]; for (let k = 1; k < 6; k++) pts.push([-L + 2 * L * k / 6, (k % 2 ? -1 : 1) * (2.5 + r() * 4)]); pts.push([L, 0]);
      c.fillStyle = '#efe4c8'; c.beginPath(); c.moveTo(-L * 0.2, -1); c.lineTo(L * 0.55, -R * 0.62); c.lineTo(L * 0.7, 0); c.closePath(); c.fill();
      c.strokeStyle = '#f2ead6'; c.lineWidth = 7.5; c.beginPath(); pts.forEach((p, k) => (k ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.stroke();
      c.strokeStyle = '#0d0906'; c.lineWidth = 4; c.beginPath(); pts.forEach((p, k) => (k ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.stroke();
      break;
    }
    case 'speck': {
      for (let k = 0; k < 7; k++) { const a = r() * 6.283, q = k ? R * (0.25 + r() * 0.7) : 0, s = k ? 1.8 + r() * 2.4 : 4.6; c.fillStyle = 'rgba(245,238,220,.8)'; c.beginPath(); c.arc(Math.cos(a) * q, Math.sin(a) * q, s + 1.4, 0, 7); c.fill(); c.fillStyle = '#1c120a'; c.beginPath(); c.arc(Math.cos(a) * q, Math.sin(a) * q, s, 0, 7); c.fill(); }
      break;
    }
    case 'stain': {
      c.scale(1, 0.78 + r() * 0.3); c.rotate(r() * 3);
      const g = c.createRadialGradient(0, 0, R * 0.2, 0, 0, R); g.addColorStop(0, 'rgba(120,88,46,.28)'); g.addColorStop(0.72, 'rgba(96,66,30,.5)'); g.addColorStop(0.9, 'rgba(60,38,14,.85)'); g.addColorStop(1, 'rgba(60,38,14,0)');
      c.fillStyle = g; c.beginPath(); c.arc(0, 0, R, 0, 7); c.fill();
      c.strokeStyle = 'rgba(240,228,200,.75)'; c.lineWidth = 1.6; c.beginPath(); c.arc(0, 0, R * 0.97, 0, 7); c.stroke();
      c.strokeStyle = 'rgba(50,30,10,.7)'; c.lineWidth = 1.2; c.beginPath(); c.arc(R * 0.2, -R * 0.1, R * 0.45, 0.4, 4.4); c.stroke();
      break;
    }
    default: {                                             // a patch of varnish gone yellow
      c.rotate((r() - 0.5) * 0.5);
      const w = R * 1.75, h = R * 1.45, q = 7;
      c.fillStyle = 'rgba(222,170,30,.62)'; c.strokeStyle = 'rgba(70,45,5,.8)'; c.lineWidth = 1.6;
      c.beginPath(); c.moveTo(-w / 2 + q, -h / 2); c.lineTo(w / 2 - q, -h / 2); c.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + q); c.lineTo(w / 2, h / 2 - q); c.quadraticCurveTo(w / 2, h / 2, w / 2 - q, h / 2); c.lineTo(-w / 2 + q, h / 2); c.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - q); c.lineTo(-w / 2, -h / 2 + q); c.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + q, -h / 2); c.closePath(); c.fill(); c.stroke();
      c.strokeStyle = 'rgba(255,246,200,.85)'; c.lineWidth = 2.2; c.beginPath(); c.moveTo(-w * 0.32, -h * 0.24); c.lineTo(-w * 0.05, -h * 0.34); c.stroke();
      c.strokeStyle = 'rgba(120,80,10,.55)'; c.lineWidth = 1; for (let k = 0; k < 3; k++) { const y = -h * 0.2 + k * h * 0.22; c.beginPath(); c.moveTo(-w * 0.36, y + r() * 3); c.lineTo(w * 0.36, y + r() * 3); c.stroke(); }
    }
  }
}
