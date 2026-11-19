// Your own picture. In the Michigan Avenue lobby, where everybody comes in, hangs one big gilt
// frame with a card under it: ARTWORK IN PROGRESS, in a studio of the Ryan Learning Center. Go to
// that studio, pull up at the easel, and you get a paint program of the old sort: a handful of
// colours, a few brushes, a bucket and an eraser. What you make hangs in the lobby frame.

import * as THREE from 'three';
import { wallPoint } from './plan.js';

const KEY = 'after-hours.painting', CW = 800, CH = 600;
const COLOURS = ['#000000', '#7f7f7f', '#880015', '#ed1c24', '#ff7f27', '#fff200', '#22b14c', '#00a2e8', '#3f48cc', '#a349a4',
  '#ffffff', '#c3c3c3', '#b97a57', '#ffaec9', '#ffc90e', '#efe4b0', '#b5e61d', '#99d9ea', '#7092be', '#c8bfe7'];
const SIZES = [3, 8, 18, 36];

const STYLE = `
#paint { position: fixed; inset: 0; z-index: 31; display: flex; align-items: center; justify-content: center; background: #008080; font: 13px "MS Sans Serif", Tahoma, Geneva, sans-serif; color: #000; padding: max(6px, env(safe-area-inset-top)) max(6px, env(safe-area-inset-right)) max(6px, env(safe-area-inset-bottom)) max(6px, env(safe-area-inset-left)); box-sizing: border-box; user-select: none; -webkit-user-select: none; }
#paint[hidden] { display: none; }
#paint .win { display: flex; flex-direction: column; width: 100%; height: 100%; max-width: 1100px; background: #c0c0c0; border: 2px solid; border-color: #fff #404040 #404040 #fff; box-shadow: 1px 1px 0 #000; }
#paint .bar { display: flex; align-items: center; gap: 8px; background: linear-gradient(90deg, #000080, #1084d0); color: #fff; font-weight: 700; padding: 4px 6px; }
#paint .bar span { flex: 1; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
#paint .body { flex: 1; min-height: 0; display: flex; gap: 6px; padding: 6px; }
#paint .tools { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; align-content: start; width: 136px; flex: none; }
#paint .tools button { min-width: 0; padding: 2px; overflow: hidden; }
#paint .stage { flex: 1; min-width: 0; display: flex; align-items: center; justify-content: center; background: #808080; border: 2px solid; border-color: #404040 #fff #fff #404040; overflow: hidden; }
#paint canvas { background: #fff; touch-action: none; cursor: crosshair; max-width: 100%; max-height: 100%; aspect-ratio: 4 / 3; image-rendering: auto; }
#paint button { min-height: 40px; background: #c0c0c0; border: 2px solid; border-color: #fff #404040 #404040 #fff; font: inherit; color: #000; padding: 2px 6px; }
#paint button[aria-pressed="true"] { border-color: #404040 #fff #fff #404040; background: #e8e8e8; }
#paint .tools .wide { grid-column: 1 / -1; }
#paint .dot { display: inline-block; background: #000; border-radius: 50%; vertical-align: middle; }
#paint .foot { display: flex; align-items: center; gap: 6px; padding: 0 6px 6px; }
#paint .pal { display: grid; grid-template-columns: repeat(10, 1fr); gap: 2px; flex: 1; max-width: 420px; }
#paint .pal button { min-height: 0; height: 24px; padding: 0; }
#paint .now { width: 44px; height: 50px; border: 2px solid; border-color: #404040 #fff #fff #404040; }
#paint input { flex: 1; min-width: 60px; height: 30px; border: 2px solid; border-color: #404040 #fff #fff #404040; font: inherit; padding: 0 6px; }
#paint .hang { font-weight: 700; min-width: 96px; }
@media (max-height: 460px) { #paint .tools { width: 124px; } #paint button { min-height: 34px; } #paint .pal button { height: 20px; } #paint .now { height: 42px; } }
`;

export class Paint {
  // deps: { museum, plan, resume(), say(text), onHang() }
  constructor(G, deps) {
    Object.assign(this, deps);
    this.G = G; this.on = false;
    this.tool = 'brush'; this.colour = '#000000'; this.size = 8; this.undo = [];
    this.title = '';
    try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s && s.img) { this.saved = s.img; this.title = s.title || ''; } } catch { /* no storage */ }
    this._frame();
    this._easel();
    this._dom();
  }
  get done() { return !!this.saved; }

  // ---- the frame in the lobby ----
  _frame() {
    const plan = this.plan, lobby = plan.byId.lobby;
    if (!lobby) return;
    const PW = 3.2, PH = 2.4;
    // The wall you face as you come in from Michigan Avenue, on the longest clear stretch of it.
    const walls = plan.walls.filter(w => w.room === lobby);
    let best = null;
    for (const w of walls) for (const s of w.segs) {
      const len = s.hi - s.lo; if (len < PW + 1.6) continue;
      const score = len + (w.side === 'e' ? 100 : w.side === 'n' || w.side === 's' ? 50 : 0);
      if (!best || score > best.score) best = { w, s, score };
    }
    if (!best) return;
    const { w, s } = best, mid = (w.lo + w.hi) / 2, u = Math.max(s.lo + PW / 2 + 0.8, Math.min(s.hi - PW / 2 - 0.8, mid < s.lo ? s.lo : mid > s.hi ? s.hi : mid));
    const cy = Math.min(lobby.h - PH / 2 - 0.45, 1.05 + PH / 2), p = wallPoint(w, u, lobby.y + cy, 0.06);
    const g = this.frame = new THREE.Group(); g.position.set(p.x, p.y, p.z); g.rotation.y = Math.atan2(w.nx, w.nz);
    this.museum.group.add(g);
    this.cv = document.createElement('canvas'); this.cv.width = CW; this.cv.height = CH;
    this.tex = new THREE.CanvasTexture(this.cv); this.tex.colorSpace = THREE.SRGBColorSpace; this.tex.anisotropy = 8;
    g.add(new THREE.Mesh(new THREE.PlaneGeometry(PW, PH), new THREE.MeshBasicMaterial({ map: this.tex, color: new THREE.Color(0.86, 0.84, 0.8) })));
    const gilt = new THREE.MeshStandardMaterial({ color: 0xc9a23a, roughness: 0.4, metalness: 0.5, emissive: 0x6a5216, emissiveIntensity: 0.8 });
    const bar = (bw, bh, x, y) => { const m = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, 0.12), gilt); m.position.set(x, y, 0.02); g.add(m); };
    bar(PW + 0.44, 0.22, 0, PH / 2 + 0.11); bar(PW + 0.44, 0.22, 0, -PH / 2 - 0.11); bar(0.22, PH, -PW / 2 - 0.11, 0); bar(0.22, PH, PW / 2 + 0.11, 0);
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(PW * 0.6, 0.05, 0.08), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 1.8, 1.1) })); lamp.position.set(0, PH / 2 + 0.42, 0.3); g.add(lamp);
    // The card under it.
    this.card = document.createElement('canvas'); this.card.width = 768; this.card.height = 192;
    this.cardTex = new THREE.CanvasTexture(this.card); this.cardTex.colorSpace = THREE.SRGBColorSpace;
    const cm = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.375), new THREE.MeshBasicMaterial({ map: this.cardTex })); cm.position.set(0, -PH / 2 - 0.5, 0.01); g.add(cm);
    this.art = { custom: true, room: 'lobby', x: p.x, y: p.y, z: p.z, fy: lobby.y, nx: w.nx, nz: w.nz, rot: Math.atan2(w.nx, w.nz), w: PW, h: PH, seen: true, wakeAt: 0, focus: false, work: {} };
    this._show();
  }
  _studio() {
    const rooms = this.plan.rooms, pick = rooms.find(r => r.id === 'MW1-ed00') || rooms.find(r => /Ryan Learning Center, studio/.test(r.gallery)) || rooms.find(r => /School painting studio/.test(r.gallery)) || rooms.find(r => /studio/i.test(r.gallery));
    return pick || null;
  }
  // Draw what hangs in the frame, and write its card and its label.
  _show() {
    if (!this.cv) return;
    const c = this.cv.getContext('2d'), room = this.room || (this.room = this._studio()), where = room ? room.gallery.replace(/,? ?\d+$/, '') : 'a studio';
    const finish = () => { this.tex.needsUpdate = true; };
    if (this.saved) { const im = new Image(); im.onload = () => { c.fillStyle = '#fff'; c.fillRect(0, 0, CW, CH); c.drawImage(im, 0, 0, CW, CH); finish(); }; im.src = this.saved; }
    else {
      c.fillStyle = '#f6f2e8'; c.fillRect(0, 0, CW, CH);
      c.strokeStyle = '#b9ad92'; c.lineWidth = 4; c.setLineDash([18, 14]); c.strokeRect(40, 40, CW - 80, CH - 80); c.setLineDash([]);
      c.fillStyle = '#3a3226'; c.textAlign = 'center'; c.font = '700 62px Georgia, serif'; c.fillText('ARTWORK IN PROGRESS', CW / 2, CH / 2 - 40);
      c.font = 'italic 40px Georgia, serif'; c.fillText('in the ' + where, CW / 2, CH / 2 + 30, CW - 120);
      c.font = '30px Georgia, serif'; c.fillText('The artist is you. Go and paint it.', CW / 2, CH / 2 + 100);
      finish();
    }
    const k = this.card.getContext('2d');
    k.fillStyle = '#f4efe2'; k.fillRect(0, 0, 768, 192); k.fillStyle = '#14120c'; k.textAlign = 'center';
    if (this.saved) { k.font = 'italic 700 46px Georgia, serif'; k.fillText(this.title || 'Untitled', 384, 72, 720); k.font = '32px Georgia, serif'; k.fillText('You, tonight. Paint on screen.', 384, 132); }
    else { k.font = '700 44px Georgia, serif'; k.fillText('ARTWORK IN PROGRESS', 384, 72); k.font = 'italic 32px Georgia, serif'; k.fillText('in the ' + where, 384, 132, 720); }
    this.cardTex.needsUpdate = true;
    const levels = { LL: 'lower level', 1: 'first floor', 2: 'second floor', 3: 'third floor' };
    this.art.work = this.saved
      ? { id: 0, t: this.title || 'Untitled', a: 'You', d: 'tonight', m: 'Paint on screen, 800 × 600.', g: 'Michigan Avenue Lobby', alt: 'Painted in the ' + where + '. Go back to the easel there to change it or start again.', note: 'Yours. It is kept on this device and goes nowhere else.' }
      : { id: 0, t: 'Artwork in progress', a: 'You', d: 'not yet', m: 'An empty frame.', g: 'Michigan Avenue Lobby', alt: `It is being made in the ${where}${room ? ', on the ' + (levels[room.floor] || 'first floor') : ''}. Pull up at the easel there and paint it; it will hang here.`, note: 'The way to the studio is lit on the map and on the floor.' };
  }
  /** Facing the frame, close enough to look? */
  facing(v) {
    const a = this.art; if (!a || this.on) return false;
    const dx = v.pos.x - a.x, dz = v.pos.z - a.z, out = dx * a.nx + dz * a.nz, along = Math.abs(dx * a.nz - dz * a.nx);
    return v.pos.y > a.fy - 0.3 && v.pos.y < a.fy + 4.5 && out > 0.3 && out < 8 && along < 3.2 && -(Math.sin(v.yaw) * a.nx + Math.cos(v.yaw) * a.nz) > 0.45 && Math.hypot(v.vel.x, v.vel.z) < 3;
  }
  /** Where to send somebody who has looked at the empty frame. */
  get studioSpot() { return this.spot ? { x: this.spot.x, y: this.spot.y, z: this.spot.z + 0.9, label: (this.room && this.room.gallery) || 'the studio' } : null; }

  // ---- the easel in the studio ----
  _easel() {
    const room = this.room || (this.room = this._studio()); if (!room) return;
    const plan = this.plan, O = plan.obstacles, m = 0.9;
    // A clear patch of floor as near the middle of the room as there is one, away from the doors.
    const doors = plan.doors.filter(d => d.a === room.id || d.b === room.id);
    const clear = (x, z) => !O.some(o => o.y0 < room.y + 1.2 && o.y1 > room.y && o.x1 > x - m && o.x0 < x + m && o.z1 > z - m - 0.9 && o.z0 < z + m + 0.9)
      && !doors.some(d => Math.hypot((d.x0 + d.x1) / 2 - x, (d.z0 + d.z1) / 2 - z) < 3) && x > room.x0 + 1.4 && x < room.x1 - 1.4 && z > room.z0 + 1.4 && z < room.z1 - 2.2;
    const cx = (room.x0 + room.x1) / 2, cz = (room.z0 + room.z1) / 2; let best = null;
    for (let x = room.x0 + 1.4; x <= room.x1 - 1.4; x += 0.4) for (let z = room.z0 + 1.4; z <= room.z1 - 2.2; z += 0.4) if (clear(x, z)) { const d = Math.hypot(x - cx, z - cz); if (!best || d < best.d) best = { x, z, d }; }
    if (!best) return;
    this.spot = { x: best.x, y: room.y, z: best.z };
    const g = this.easel = new THREE.Group(); g.position.set(best.x, room.y, best.z); this.museum.group.add(g);
    const wood = new THREE.MeshStandardMaterial({ color: 0x7a5632, roughness: 0.7, emissive: 0x7a5632, emissiveIntensity: 0.2 });
    const add = (geo, mat, x, y, z, rx = 0) => { const k = new THREE.Mesh(geo, mat); k.position.set(x, y, z); k.rotation.x = rx; g.add(k); return k; };
    // A low easel, toy height, leaning back, with the same picture on it as hangs in the lobby.
    for (const s of [-1, 1]) add(new THREE.BoxGeometry(0.04, 1.0, 0.04), wood, s * 0.32, 0.48, 0.02, -0.16);
    add(new THREE.BoxGeometry(0.04, 1.0, 0.04), wood, 0, 0.46, -0.3, 0.34);
    add(new THREE.BoxGeometry(0.8, 0.04, 0.08), wood, 0, 0.2, 0.1);
    add(new THREE.PlaneGeometry(0.72, 0.54), new THREE.MeshBasicMaterial({ map: this.tex || null, color: 0xffffff }), 0, 0.5, 0.075, -0.16);
    add(new THREE.BoxGeometry(0.76, 0.58, 0.02), new THREE.MeshStandardMaterial({ color: 0xe8e2d2, roughness: 0.8 }), 0, 0.5, 0.06, -0.16);
    // Pots of paint on the floor beside it.
    [0xed1c24, 0xfff200, 0x00a2e8, 0x22b14c].forEach((c, i) => add(new THREE.CylinderGeometry(0.06, 0.06, 0.1, 12), new THREE.MeshBasicMaterial({ color: c }), 0.55 + (i % 2) * 0.16, 0.05, 0.1 + Math.floor(i / 2) * 0.16));
    O.push({ x0: best.x - 0.42, x1: best.x + 0.42, z0: best.z - 0.36, z1: best.z + 0.14, y0: room.y, y1: room.y + 1.05, fit: true });
  }
  /** Pulled up at the easel? */
  near(v) {
    const s = this.spot; if (!s || this.on) return false;
    return Math.abs(v.pos.y - s.y) < 1.6 && Math.hypot(v.pos.x - s.x, v.pos.z - (s.z + 0.7)) < 1.7 && Math.hypot(v.vel.x, v.vel.z) < 3;
  }

  // ---- the paint program ----
  _dom() {
    const st = document.createElement('style'); st.textContent = STYLE; document.head.append(st);
    const el = this.el = document.createElement('section'); el.id = 'paint'; el.hidden = true; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', 'Paint');
    el.innerHTML = `<div class="win"><div class="bar"><span>untitled - Paint</span></div>
      <div class="body"><div class="tools">
        <button data-tool="brush" aria-pressed="true">Brush</button><button data-tool="eraser">Rubber</button>
        <button data-tool="fill">Fill</button><button data-act="undo">Undo</button>
        ${SIZES.map(s => `<button data-size="${s}" aria-label="Brush ${s}"><i class="dot" style="width:${Math.min(22, s)}px;height:${Math.min(22, s)}px"></i></button>`).join('')}
        <button class="wide" data-act="clear">New</button>
      </div><div class="stage"><canvas width="${CW}" height="${CH}" aria-label="Your picture"></canvas></div></div>
      <div class="foot"><div class="now"></div><div class="pal">${COLOURS.map(c => `<button data-colour="${c}" style="background:${c}" aria-label="${c}"></button>`).join('')}</div>
        <input type="text" maxlength="40" placeholder="Title" aria-label="Title"><button data-act="cancel">Cancel</button><button class="hang" data-act="hang">Hang it</button></div></div>`;
    document.body.append(el);
    this.pc = el.querySelector('canvas'); this.px = this.pc.getContext('2d', { willReadFrequently: true });
    // Buttons answer as they are touched, not on the click after: a click straight after a stroke can go missing.
    el.addEventListener('pointerdown', e => {
      const b = e.target.closest('button'); if (!b) return;
      e.preventDefault();
      if (b.dataset.tool) this.tool = b.dataset.tool;
      else if (b.dataset.size) this.size = +b.dataset.size;
      else if (b.dataset.colour) { this.colour = b.dataset.colour; if (this.tool === 'eraser') this.tool = 'brush'; }
      else if (b.dataset.act === 'undo') this._undo();
      else if (b.dataset.act === 'clear') { this._keep(); this.px.fillStyle = '#fff'; this.px.fillRect(0, 0, CW, CH); }
      else if (b.dataset.act === 'cancel') this.close();
      else if (b.dataset.act === 'hang') this.hang();
      this._ui();
    });
    addEventListener('keydown', e => { if (!this.on) return; if (e.code === 'Escape') { e.preventDefault(); e.stopPropagation(); this.close(); } else if ((e.ctrlKey || e.metaKey) && e.code === 'KeyZ') { e.preventDefault(); this._undo(); } e.stopPropagation(); }, true);
    // Drawing: one finger or the mouse. A stroke is a run of round dabs joined up.
    const at = e => { const r = this.pc.getBoundingClientRect(); return [(e.clientX - r.left) * CW / r.width, (e.clientY - r.top) * CH / r.height]; };
    let last = null, id = null;
    this.pc.addEventListener('pointerdown', e => {
      if (id !== null) return; e.preventDefault(); id = e.pointerId; this.pc.setPointerCapture(id);
      const [x, y] = at(e); this._keep();
      if (this.tool === 'fill') { this._fill(Math.round(x), Math.round(y)); id = null; return; }
      last = [x, y]; this._dab(x, y, x, y);
    });
    this.pc.addEventListener('pointermove', e => { if (e.pointerId !== id || !last) return; e.preventDefault(); const [x, y] = at(e); this._dab(last[0], last[1], x, y); last = [x, y]; });
    const up = e => { if (e.pointerId === id) { id = null; last = null; } };
    this.pc.addEventListener('pointerup', up); this.pc.addEventListener('pointercancel', up);
  }
  _ui() {
    for (const b of this.el.querySelectorAll('[data-tool]')) b.setAttribute('aria-pressed', b.dataset.tool === this.tool);
    for (const b of this.el.querySelectorAll('[data-size]')) b.setAttribute('aria-pressed', +b.dataset.size === this.size);
    this.el.querySelector('.now').style.background = this.tool === 'eraser' ? '#fff' : this.colour;
  }
  _keep() { this.undo.push(this.px.getImageData(0, 0, CW, CH)); if (this.undo.length > 12) this.undo.shift(); }
  _undo() { const d = this.undo.pop(); if (d) this.px.putImageData(d, 0, 0); }
  _dab(x0, y0, x1, y1) {
    const c = this.px; c.strokeStyle = this.tool === 'eraser' ? '#fff' : this.colour; c.lineWidth = this.tool === 'eraser' ? this.size * 2 : this.size; c.lineCap = 'round'; c.lineJoin = 'round';
    c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1 + 0.01, y1 + 0.01); c.stroke();
  }
  // The bucket: everything joined to the spot that is nearly its colour.
  _fill(x, y) {
    if (x < 0 || y < 0 || x >= CW || y >= CH) return;
    const img = this.px.getImageData(0, 0, CW, CH), d = img.data, n = parseInt(this.colour.slice(1), 16), fr = n >> 16, fg = (n >> 8) & 255, fb = n & 255;
    const i0 = (y * CW + x) * 4, r0 = d[i0], g0 = d[i0 + 1], b0 = d[i0 + 2];
    if (Math.abs(r0 - fr) + Math.abs(g0 - fg) + Math.abs(b0 - fb) < 6) return;
    const like = i => Math.abs(d[i] - r0) + Math.abs(d[i + 1] - g0) + Math.abs(d[i + 2] - b0) < 96;
    const stack = [x, y];
    while (stack.length) {
      const py = stack.pop(); let px = stack.pop();
      while (px >= 0 && like((py * CW + px) * 4)) px--;
      px++;
      let up = false, down = false;
      for (; px < CW && like((py * CW + px) * 4); px++) {
        const i = (py * CW + px) * 4; d[i] = fr; d[i + 1] = fg; d[i + 2] = fb; d[i + 3] = 255;
        if (py > 0) { const a = like(((py - 1) * CW + px) * 4); if (a && !up) stack.push(px, py - 1); up = a; }
        if (py < CH - 1) { const a = like(((py + 1) * CW + px) * 4); if (a && !down) stack.push(px, py + 1); down = a; }
      }
    }
    this.px.putImageData(img, 0, 0);
  }
  open() {
    if (this.on || !this.spot) return;
    this.on = true; this.G.state = 'paused'; this.undo = [];
    this.px.fillStyle = '#fff'; this.px.fillRect(0, 0, CW, CH);
    if (this.saved) { const im = new Image(); im.onload = () => { if (this.on) this.px.drawImage(im, 0, 0, CW, CH); }; im.src = this.saved; }
    this.el.querySelector('input').value = this.title;
    this.el.querySelector('.bar span').textContent = `${this.title || 'untitled'} - Paint`;
    this._ui(); this.el.hidden = false;
  }
  close() { if (!this.on) return; this.on = false; this.el.hidden = true; this.resume(); }
  hang() {
    this.title = this.el.querySelector('input').value.trim().slice(0, 40);
    this.saved = this.pc.toDataURL('image/jpeg', 0.86);
    try { localStorage.setItem(KEY, JSON.stringify({ img: this.saved, title: this.title, at: Date.now() })); } catch { /* too big or no storage: it still hangs until the page is closed */ }
    this._show();
    this.close();
    if (this.say) this.say('Hung. It is in the big frame in the Michigan Avenue lobby.');
    if (this.onHang) this.onHang();
  }
  /** A new game takes the picture down. */
  reset() { this.saved = null; this.title = ''; try { localStorage.removeItem(KEY); } catch { /* fine */ } this._show(); }
}
