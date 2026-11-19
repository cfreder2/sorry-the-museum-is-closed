// The colour pedestal in Griffin Court. Four lit pads in four of the roof's colours: it plays a
// pattern, you play it back, it adds one. Get five patterns right and the roof lets go: confetti
// in the colours of all 126 panes comes down the length of the court.

import * as THREE from 'three';

const PADS = [
  { name: 'yellow', css: '#f2c70f', hex: 0xf2c70f, note: 329.63 },
  { name: 'blue', css: '#3b3fd6', hex: 0x3b3fd6, note: 261.63 },
  { name: 'red', css: '#e6283c', hex: 0xe6283c, note: 392.0 },
  { name: 'green', css: '#57b36a', hex: 0x57b36a, note: 523.25 },
];
// The roof's own colours, west row and east row (as in src/museum.js).
const ROOF = ['#f2c70f', '#dfe6a8', '#f6cfa0', '#f39a2d', '#b8651a', '#d99a1e', '#f4a6a0', '#f3e08a', '#f5ecc8', '#f6d5cf', '#f1efe9', '#cfd2d0', '#f1d23c', '#ef8a2a', '#e5552a', '#f0b04a', '#f6e27a', '#c9d84a', '#8fc45a', '#e9c63a', '#f2a03a',
  '#dfeee6', '#3b3fd6', '#2f6fe0', '#2a93d8', '#7cc4ea', '#cfe6f3', '#e6e3f3', '#5a2fd0', '#cdbdf0', '#8a3fd8', '#e5a6e6', '#e6283c', '#e040c8', '#f2a0c8', '#c93ad0', '#e0303a', '#f07a8a', '#9a6ae0', '#58a8e8', '#48c0b0', '#c9d84a'];
const KEY = 'after-hours.simon', GOAL = 5;

const STYLE = `
#simon { position: fixed; inset: 0; z-index: 31; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; background: rgba(4,5,9,.88); font-family: var(--serif, Georgia, serif); color: var(--cream, #f1ead8); padding: 12px; box-sizing: border-box; user-select: none; -webkit-user-select: none; }
#simon[hidden] { display: none; }
#simon .head { text-align: center; }
#simon h2 { margin: 0; font-size: 22px; letter-spacing: .14em; text-transform: uppercase; color: var(--gilt, #e2cd94); }
#simon .say { font: 600 13px var(--mono, ui-monospace, monospace); letter-spacing: .08em; color: var(--gilt, #e2cd94); min-height: 1.3em; margin-top: 4px; }
#simon .pads { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; width: min(62vh, 86vw, 420px); aspect-ratio: 1; }
#simon .pads button { border: 3px solid rgba(255,255,255,.25); border-radius: 18px; opacity: .45; transition: opacity .08s, transform .08s; touch-action: none; }
#simon .pads button.lit { opacity: 1; transform: scale(1.03); box-shadow: 0 0 34px currentColor; border-color: #fff; }
#simon .row { display: flex; gap: 10px; }
#simon .row button { min-width: 110px; height: 44px; border-radius: 8px; border: 1px solid rgba(226,205,148,.6); background: rgba(8,9,14,.66); color: var(--gilt, #e2cd94); font: 700 12px var(--mono, ui-monospace, monospace); letter-spacing: .12em; }
@media (max-height: 460px) { #simon { flex-direction: row; gap: 18px; } #simon .pads { width: min(78vh, 300px); } #simon .row { flex-direction: column; } }
`;

export class Simon {
  // deps: { museum, plan, sound, resume(), onWin(round), calm() }
  constructor(G, deps) {
    Object.assign(this, deps);
    this.G = G; this.on = false; this.best = 0; this.won = false;
    try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s) { this.best = s.best || 0; this.won = !!s.won; } } catch { /* no storage */ }
    this._pedestal();
    this._dom();
    this.bits = null;
  }

  // ---- the pedestal ----
  _pedestal() {
    const hall = this.plan.hall; if (!hall) return;
    // In the middle of the court's width, a third of the way up from the south end, clear of whatever stands there.
    const O = this.plan.obstacles, S = this.plan.surfaces, cx = (hall.x0 + hall.x1) / 2;
    const clear = (x, z) => !O.some(o => o.y0 < hall.y + 1.5 && o.y1 > hall.y && o.x1 > x - 1.2 && o.x0 < x + 1.2 && o.z1 > z - 1.2 && o.z0 < z + 1.2)
      && !S.some(s => Math.min(s.h0, s.h1) < hall.y + 2 && s.x1 > x - 1.3 && s.x0 < x + 1.3 && s.z1 > z - 1.3 && s.z0 < z + 1.3 && s.skin !== 'deck')
      && !this.plan.doors.some(d => (d.a === hall.id || d.b === hall.id) && Math.hypot((d.x0 + d.x1) / 2 - x, (d.z0 + d.z1) / 2 - z) < 3.2);
    let at = null;
    for (const z of [0.62, 0.55, 0.7, 0.48, 0.78, 0.4].map(f => hall.z0 + (hall.z1 - hall.z0) * f)) for (const dx of [0, 0.8, -0.8, 1.6, -1.6]) if (!at && clear(cx + dx, z)) at = { x: cx + dx, z };
    if (!at) return;
    this.at = { ...at, y: hall.y };
    const g = this.group = new THREE.Group(); g.position.set(at.x, hall.y, at.z); this.museum.group.add(g);
    const add = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); g.add(m); return m; };
    const stone = new THREE.MeshStandardMaterial({ color: 0xd8d4c8, roughness: 0.6, emissive: 0xd8d4c8, emissiveIntensity: 0.12 });
    add(new THREE.CylinderGeometry(0.42, 0.5, 0.36, 24), stone, 0, 0.18, 0);          // low enough for a toy to see the top of
    add(new THREE.CylinderGeometry(0.46, 0.46, 0.04, 24), new THREE.MeshStandardMaterial({ color: 0x15161b, roughness: 0.4 }), 0, 0.38, 0);
    this.lamps = PADS.map((p, i) => {
      const a0 = i * Math.PI / 2 + 0.06, shape = new THREE.Shape();
      shape.moveTo(0.06 * Math.cos(a0), 0.06 * Math.sin(a0)); shape.absarc(0, 0, 0.42, a0, a0 + Math.PI / 2 - 0.12, false); shape.absarc(0, 0, 0.06, a0 + Math.PI / 2 - 0.12, a0, true);
      const m = add(new THREE.ShapeGeometry(shape, 10), new THREE.MeshBasicMaterial({ color: p.hex, side: THREE.DoubleSide }), 0, 0.405, 0); m.rotation.x = -Math.PI / 2;
      return m;
    });
    O.push({ x0: at.x - 0.5, x1: at.x + 0.5, z0: at.z - 0.5, z1: at.z + 0.5, y0: hall.y, y1: hall.y + 0.42 });
  }
  near(v) { const a = this.at; return !!a && !this.on && Math.abs(v.pos.y - a.y) < 2 && Math.hypot(v.pos.x - a.x, v.pos.z - a.z) < 1.9 && Math.hypot(v.vel.x, v.vel.z) < 3; }
  // The pads on the pedestal breathe in turn, so that it reads as something to press.
  update(dt, t) {
    if (this.lamps) this.lamps.forEach((m, i) => { const k = 0.45 + 0.55 * Math.max(0, Math.sin(t * 1.6 - i * 1.57)); m.material.color.setHex(PADS[i].hex).multiplyScalar(k); });
    this._fall(dt);
  }

  // ---- the game ----
  _dom() {
    const st = document.createElement('style'); st.textContent = STYLE; document.head.append(st);
    const el = this.el = document.createElement('section'); el.id = 'simon'; el.hidden = true; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', 'The colour pedestal');
    el.innerHTML = `<div class="head"><h2>Follow the colours</h2><div class="say" role="status"></div></div>
      <div class="pads">${PADS.map((p, i) => `<button data-pad="${i}" style="background:${p.css};color:${p.css}" aria-label="${p.name}"></button>`).join('')}</div>
      <div class="row"><button data-act="again">Again</button><button data-act="leave">Leave</button></div>`;
    document.body.append(el);
    el.addEventListener('pointerdown', e => {
      const b = e.target.closest('button'); if (!b) return;
      e.preventDefault();
      if (b.dataset.pad) this._press(+b.dataset.pad);
      else if (b.dataset.act === 'again') this._start();
      else if (b.dataset.act === 'leave') this.close();
    });
    addEventListener('keydown', e => {
      if (!this.on) return;
      const k = { Digit1: 0, Digit2: 1, Digit3: 2, Digit4: 3, KeyQ: 0, KeyW: 1, KeyA: 2, KeyS: 3 }[e.code];
      if (e.code === 'Escape') this.close(); else if (k != null) this._press(k); else if (e.code === 'Enter' || e.code === 'Space') { if (!this.playing && !this.turn) this._start(); } else return;
      e.preventDefault(); e.stopPropagation();
    }, true);
  }
  _say(t) { this.el.querySelector('.say').textContent = t; }
  _light(i, ms = 320) {
    const b = this.el.querySelector(`[data-pad="${i}"]`); b.classList.add('lit');
    if (this.sound && this.sound.bell) this.sound.bell(PADS[i].note, 0, 0.09, 0.5, 0.3);
    setTimeout(() => b.classList.remove('lit'), ms);
  }
  _start() { this.seq = []; this.round = 0; this._next(); }
  _next() {
    this.seq.push(Math.floor(Math.random() * 4)); this.round = this.seq.length; this.turn = false; this.playing = true; this.i = 0;
    this._say(`PATTERN ${this.round}${this.round <= GOAL ? ' OF ' + GOAL : ''} · WATCH`);
    const gap = Math.max(260, 560 - this.round * 30), run = this.run = (this.run || 0) + 1;
    this.seq.forEach((p, k) => setTimeout(() => { if (this.on && this.run === run) this._light(p, gap * 0.7); }, 600 + k * gap));
    setTimeout(() => { if (this.on && this.run === run) { this.playing = false; this.turn = true; this._say(`PATTERN ${this.round} · YOUR TURN`); } }, 600 + this.seq.length * gap);
  }
  _press(i) {
    if (!this.turn) return;
    this._light(i, 200);
    if (i !== this.seq[this.i]) {
      this.turn = false; this.run++;
      this._say(`NOT QUITE. YOU GOT ${this.round - 1} PATTERN${this.round - 1 === 1 ? '' : 'S'}. BEST ${Math.max(this.best, this.round - 1)}.`);
      this._record(this.round - 1);
      return;
    }
    if (++this.i < this.seq.length) return;
    this.turn = false; this._record(this.round);
    if (this.round === GOAL) {
      // Five right: the roof lets go. Step out of the game to watch it.
      this.won = true; this._save();
      this._say('FIVE. LOOK UP.');
      setTimeout(() => { if (this.on) { this.close(); this.celebrate(); if (this.onWin) this.onWin(GOAL); } }, 700);
      return;
    }
    this._say('YES.'); setTimeout(() => { if (this.on) this._next(); }, 650);
  }
  _record(n) { if (n > this.best) { this.best = n; this._save(); } }
  _save() { try { localStorage.setItem(KEY, JSON.stringify({ best: this.best, won: this.won })); } catch { /* fine */ } }
  open() { if (this.on || !this.at) return; this.on = true; this.G.state = 'paused'; this.el.hidden = false; this._start(); }
  close() { if (!this.on) return; this.on = false; this.turn = false; this.run++; this.el.hidden = true; this.resume(); }

  // ---- confetti ----
  // A piece of paper for every pane, several times over, let go along the whole roof.
  celebrate() {
    const hall = this.plan.hall; if (!hall) return;
    const calm = this.calm && this.calm(), N = calm ? 300 : 1400, top = hall.y + hall.h - 0.4;
    if (!this.mesh) {
      const geo = new THREE.PlaneGeometry(0.26, 0.16);
      this.mesh = new THREE.InstancedMesh(geo, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }), 1400);
      this.mesh.frustumCulled = false; this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      this.museum.group.add(this.mesh);
    }
    const col = new THREE.Color(); this.bits = [];
    for (let i = 0; i < N; i++) {
      this.mesh.setColorAt(i, col.set(ROOF[i % ROOF.length]));
      this.bits.push({ x: hall.x0 + 0.4 + Math.random() * (hall.x1 - hall.x0 - 0.8), y: top - Math.random() * 1.5, z: hall.z0 + 1 + Math.random() * (hall.z1 - hall.z0 - 2),
        vy: -(0.7 + Math.random() * 1.1), ph: Math.random() * 6.28, sp: 2 + Math.random() * 4, sw: 0.25 + Math.random() * 0.5, wait: Math.random() * 2.2, rx: Math.random() * 6.28, rz: Math.random() * 6.28, down: false });
    }
    this.mesh.count = N; this.mesh.instanceColor.needsUpdate = true; this.mesh.visible = true;
    this.left = 26; this.floor = hall.y + 0.02;
    if (this.sound && this.sound.perfect) this.sound.perfect();
  }
  _fall(dt) {
    if (!this.bits) return;
    const m = this._m || (this._m = new THREE.Object3D());
    this.left -= dt;
    this.bits.forEach((b, i) => {
      if (b.wait > 0) b.wait -= dt;
      else if (!b.down) {
        b.ph += b.sp * dt; b.y += b.vy * dt; b.x += Math.sin(b.ph) * b.sw * dt; b.z += Math.cos(b.ph * 0.7) * b.sw * dt; b.rx += b.sp * dt; b.rz += b.sp * 0.6 * dt;
        if (b.y <= this.floor) { b.y = this.floor; b.down = true; b.rx = Math.PI / 2; }
      }
      m.position.set(b.x, b.y, b.z); m.rotation.set(b.rx, b.ph, b.down ? 0 : b.rz); const s = this.left < 3 ? Math.max(0, this.left / 3) : 1; m.scale.setScalar(s); m.updateMatrix();
      this.mesh.setMatrixAt(i, m.matrix);
    });
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.left <= 0) { this.bits = null; this.mesh.visible = false; }
  }
}
