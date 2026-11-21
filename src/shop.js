// The stall on the roof, beside the card game. Somebody is selling toys up here: a supercar and a
// sleek black drone, each turning on its stand under a striped awning. They cost chips, and the
// only chips there are are the ones on the card table: you sit down with 1,000, so a toy means
// winning.

import * as THREE from 'three';
import { VEHICLES, buildVehicle } from './garage.js';
import { fitText } from './textures.js';

const STYLE = `
#shop { position: fixed; inset: 0; z-index: 30; display: flex; align-items: center; justify-content: center; background: rgba(4,5,9,.86); font-family: var(--serif, Georgia, serif); color: var(--cream, #f1ead8); padding: 14px; box-sizing: border-box; }
#shop[hidden] { display: none; }
/* at the counter itself: the camera stands in front of the stall, and the page holds only the price tags */
#shop.inworld { background: none; align-items: stretch; pointer-events: none; padding: 0; }
#shop.inworld .stall { width: 100%; max-height: none; overflow: visible; }
#shop.inworld h2 { display: none; }
#shop.inworld .chips { position: fixed; top: max(10px, env(safe-area-inset-top)); left: 50%; transform: translateX(-50%); background: rgba(4,5,9,.78); padding: 6px 14px; border-radius: 10px; margin: 0; }
#shop.inworld .goods { display: block; }
#shop.inworld .item { position: static; border: 0; background: none; padding: 0; display: block; }
#shop.inworld .item img, #shop.inworld .item b, #shop.inworld .item span:not(.price):not(.short) { display: none; }
#shop.inworld .item .price { display: block; position: fixed; left: var(--x, 50%); top: var(--ty, 30%); transform: translate(-50%, -100%); font: 700 20px var(--mono, ui-monospace, monospace); letter-spacing: .08em; color: var(--gilt, #e2cd94); white-space: nowrap; pointer-events: none; background: rgba(4,5,9,.72); padding: 2px 10px; border-radius: 8px; }
#shop.inworld .item .price.own { font-size: 13px; color: var(--cream, #f1ead8); letter-spacing: .16em; }
#shop.inworld .item button { position: fixed; left: var(--x, 50%); top: var(--by, 70%); transform: translateX(-50%); width: 112px; height: 46px; margin: 0; pointer-events: auto; font-size: 15px; letter-spacing: .18em; }
#shop.inworld .item button:not([disabled]) { background: #dcc88e; color: #15130d; border-color: #fff3c8; box-shadow: 0 3px 14px rgba(0,0,0,.6); }
#shop.inworld .item button[disabled] { opacity: .45; }
#shop.inworld .item button.own { display: none; }
#shop .item button span { color: inherit; font: inherit; letter-spacing: inherit; min-height: 0; }
#shop.inworld .item button .full { display: none; } #shop.inworld .item button .short { display: inline; }
#shop.inworld .note:empty { display: none; }
#shop.inworld .note { position: fixed; left: 50%; transform: translateX(-50%); bottom: max(8px, env(safe-area-inset-bottom)); width: min(70vw, 560px); text-align: center; background: rgba(4,5,9,.78); padding: 5px 12px; border-radius: 10px; margin: 0; min-height: 0; }
#shop.inworld .leave { position: fixed; right: max(12px, env(safe-area-inset-right)); top: max(10px, env(safe-area-inset-top)); width: auto; padding: 0 18px; margin: 0; pointer-events: auto; }
#shop .stall { width: min(720px, 100%); max-height: 100%; overflow: auto; }
#shop h2 { margin: 0 0 2px; font-size: 24px; letter-spacing: .12em; text-transform: uppercase; color: var(--gilt, #e2cd94); }
#shop .chips { font: 600 14px var(--mono, ui-monospace, monospace); letter-spacing: .08em; color: var(--gilt, #e2cd94); margin-bottom: 12px; }
#shop .goods { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
#shop .item { border: 1px solid rgba(226,205,148,.45); border-radius: 10px; padding: 12px; background: rgba(12,14,20,.7); display: flex; flex-direction: column; gap: 6px; }
#shop .item img { width: 100%; height: 120px; object-fit: contain; }
#shop .item b { font-size: 19px; }
#shop .item .price, #shop .item button .short { display: none; }
#shop .item span { font-size: 13px; line-height: 1.35; color: #cfc8b4; min-height: 2.7em; }
#shop .item .stat { font: 11px var(--mono, ui-monospace, monospace); color: var(--gilt-dim, #a8996c); min-height: 0; }
#shop button { height: 46px; border-radius: 8px; border: 1px solid rgba(226,205,148,.6); background: rgba(226,205,148,.92); color: #14120c; font: 700 13px var(--mono, ui-monospace, monospace); letter-spacing: .12em; }
#shop button[disabled] { background: rgba(8,9,14,.66); color: var(--gilt-dim, #a8996c); }
#shop .leave { width: 100%; margin-top: 12px; background: rgba(8,9,14,.66); color: var(--gilt, #e2cd94); }
#shop .note { font-size: 13px; color: #cfc8b4; margin-top: 10px; min-height: 1.3em; }
@media (max-height: 460px) { #shop .item img { height: 76px; } #shop h2 { font-size: 18px; } #shop .item span { min-height: 0; } }
`;

export class Shop {
  // deps: { museum, plan, garage, poker, sound, resume(), onBuy(vehicle), thumb(id) }
  constructor(G, deps) {
    Object.assign(this, deps);
    this.G = G;
    this.goods = VEHICLES.filter(v => v.shop);
    this.on = false;
    this.spots = [];
    this._build();
    this._dom();
  }

  // ---- the stall itself ----
  _build() {
    const T = this.plan.terrace, roof = T && this.plan.massOf && this.plan.massOf[T.room];
    if (!T || !roof) return;
    // North of the table for choice, wherever there is roof for it and nothing standing there.
    const W = 2.6, D = 1.1, fits = (x, z) => x - W / 2 > roof.x0 + 0.8 && x + W / 2 < roof.x1 - 0.8 && z - D / 2 - 1.6 > roof.z0 + 0.4 && z + D / 2 + 1.6 < roof.z1 - 0.4
      && !this.plan.obstacles.some(o => o.y1 > T.top && o.y0 < T.top + 2 && o.x1 > x - W / 2 - 0.3 && o.x0 < x + W / 2 + 0.3 && o.z1 > z - D / 2 - 0.3 && o.z0 < z + D / 2 + 0.3);
    let at = null;
    for (const [dx, dz] of [[0, -4.2], [0, 4.2], [0, -3.4], [0, 3.4], [-1.5, -4.2], [1.5, -4.2], [-1.5, 4.2], [1.5, 4.2]]) if (fits(T.x + dx, T.z + dz)) { at = { x: T.x + dx, z: T.z + dz, face: dz < 0 ? 1 : -1 }; break; }
    if (!at) return;
    this.at = { ...at, y: T.top };
    const g = this.group = new THREE.Group(); g.position.set(at.x, T.top, at.z); g.rotation.y = at.face > 0 ? 0 : Math.PI;      // its front faces the table
    this.museum.group.add(g);
    const mat = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7, emissive: c, emissiveIntensity: 0.18, ...o });
    const add = (geo, m, x, y, z) => { const k = new THREE.Mesh(geo, m); k.position.set(x, y, z); g.add(k); return k; };
    const wood = mat(0x7a5632), dark = mat(0x2a2018);
    add(new THREE.BoxGeometry(W, 0.06, D), wood, 0, 0.34, 0);                             // a counter low enough for a toy to see over
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(new THREE.BoxGeometry(0.06, 0.34, 0.06), dark, sx * (W / 2 - 0.06), 0.17, sz * (D / 2 - 0.06));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(new THREE.BoxGeometry(0.04, 1.5, 0.04), dark, sx * (W / 2 - 0.04), 0.75 + 0.34, sz * (D / 2 - 0.04));
    // The awning: red and cream stripes, tipped forward.
    const stripes = 9;
    for (let i = 0; i < stripes; i++) { const s = add(new THREE.BoxGeometry(W / stripes, 0.03, D + 0.5), mat(i % 2 ? 0xf1e7cf : 0xb3242b), -W / 2 + (i + 0.5) * W / stripes, 1.86, 0.12); s.rotation.x = 0.16; }
    // A sign, and a string of bulbs along the front.
    const cv = document.createElement('canvas'); cv.width = 512; cv.height = 96;
    const c = cv.getContext('2d'); c.fillStyle = '#16120c'; c.fillRect(0, 0, 512, 96); c.fillStyle = '#f1dca0'; fitText(c, 'TOYS · 2,000 CHIPS', { x: 256, y: 50, w: 470, h: 70, px: 44, weight: '700', family: 'Georgia, serif' });
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
    add(new THREE.PlaneGeometry(1.9, 0.36), new THREE.MeshBasicMaterial({ map: tex }), 0, 1.58, D / 2 + 0.33).rotation.x = -0.08;
    for (let i = 0; i <= 10; i++) add(new THREE.SphereGeometry(0.035, 8, 6), new THREE.MeshBasicMaterial({ color: [0xffd27a, 0xff6a5a, 0x7fe9f5, 0xb6ff8a][i % 4] }), -W / 2 + i * W / 10, 1.74 - Math.sin(i / 10 * Math.PI) * 0.08, D / 2 + 0.36);
    // The two toys, each on a little turntable.
    this.turn = [];
    this.goods.forEach((v, i) => {
      const x = (i - (this.goods.length - 1) / 2) * 1.15;
      add(new THREE.CylinderGeometry(0.32, 0.34, 0.05, 24), mat(0x16171c, { roughness: 0.3 }), x, 0.395, 0);
      add(new THREE.CylinderGeometry(0.33, 0.33, 0.012, 24), new THREE.MeshBasicMaterial({ color: v.kind === 'car' ? 0xff7a2a : 0x3ad8ff }), x, 0.37, 0);
      const m = buildVehicle(v.id), holder = new THREE.Group();
      holder.position.set(x, v.kind === 'car' ? 0.42 : 0.62, 0); holder.add(m.group); g.add(holder);
      if (v.kind !== 'car') add(new THREE.CylinderGeometry(0.008, 0.008, 0.2, 6), dark, x, 0.52, 0);      // the drone stands on a pin
      this.turn.push(holder);
      // A price ticket.
      const tv = document.createElement('canvas'); tv.width = 256; tv.height = 96; const t = tv.getContext('2d');
      t.fillStyle = '#f4efe2'; t.fillRect(0, 0, 256, 96); t.fillStyle = '#14120c'; fitText(t, v.name.toUpperCase(), { x: 128, y: 30, w: 232, h: 36, px: 30, weight: '700', family: 'Georgia, serif' }); fitText(t, '2,000', { x: 128, y: 70, w: 232, h: 30, px: 26, weight: '600', family: 'ui-monospace, monospace' });
      const tt = new THREE.CanvasTexture(tv); tt.colorSpace = THREE.SRGBColorSpace; tt.anisotropy = 8;
      add(new THREE.PlaneGeometry(0.42, 0.16), new THREE.MeshBasicMaterial({ map: tt }), x, 0.22, D / 2 + 0.01);
    });
    // Solid to a car and a drone: the counter and the posts.
    const O = this.plan.obstacles, y = T.top;
    O.push({ x0: at.x - W / 2, x1: at.x + W / 2, z0: at.z - D / 2, z1: at.z + D / 2, y0: y, y1: y + 2 });
    // Where a customer pulls up: in front of the counter.
    this.front = { x: at.x, z: at.z + at.face * (D / 2 + 1.0) };
  }

  /** Pulled up at the counter, and not going anywhere? */
  near(v) {
    const f = this.front; if (!f || this.on) return false;
    return v.pos.y > this.at.y - 0.3 && v.pos.y < this.at.y + 3 && Math.hypot(v.pos.x - f.x, v.pos.z - f.z) < 1.9 && Math.hypot(v.vel.x, v.vel.z) < 3;
  }
  update(dt) {
    if (this.turn) for (const h of this.turn) h.rotation.y += dt * 0.7;
    // At the counter, each price tag sits under its own toy.
    if (this.on && this.stage && this.stage.on) this.el.querySelectorAll('.item').forEach((d, i) => {
      const h = this.turn[i]; if (!h) return;
      const v = this._v || (this._v = new THREE.Vector3()), w = h.getWorldPosition(v), wy = w.y;
      const top = v.set(w.x, wy + 0.27, w.z).project(this.stage.camera), x = (top.x + 1) / 2 * innerWidth, ty = (1 - top.y) / 2 * innerHeight;
      h.getWorldPosition(v); v.y = wy - 0.19; v.project(this.stage.camera); const by = (1 - v.y) / 2 * innerHeight;
      d.style.setProperty('--x', x + 'px'); d.style.setProperty('--ty', Math.max(46, ty) + 'px'); d.style.setProperty('--by', Math.min(innerHeight - 56, by) + 'px');
    });
  }

  // ---- buying ----
  _dom() {
    const st = document.createElement('style'); st.textContent = STYLE; document.head.append(st);
    const el = this.el = document.createElement('section'); el.id = 'shop'; el.hidden = true; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', 'The toy stall');
    el.innerHTML = '<div class="stall"><h2>The toy stall</h2><div class="chips"></div><div class="goods"></div><div class="note" role="status"></div><button class="leave">Leave</button></div>';
    document.body.append(el);
    el.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.classList.contains('leave')) this.close();
      else if (b.dataset.buy) this.buy(b.dataset.buy);
    });
    addEventListener('keydown', e => { if (this.on && e.code === 'Escape') { e.preventDefault(); e.stopPropagation(); this.close(); } }, true);
  }
  _draw(note = '') {
    const chips = this.poker.chips(), box = this.el.querySelector('.goods');
    this.el.querySelector('.chips').textContent = `YOUR CHIPS: ${chips.toLocaleString()}`;
    box.textContent = '';
    for (const v of this.goods) {
      const owned = this.garage.isOpen(v.id), d = document.createElement('div'); d.className = 'item';
      const img = document.createElement('img'); img.alt = ''; const src = this.thumb && this.thumb(v.id); if (src) img.src = src; else img.hidden = true;
      const name = document.createElement('b'); name.textContent = v.name;
      const hint = document.createElement('span'); hint.textContent = v.hint;
      const stat = document.createElement('span'); stat.className = 'stat'; stat.textContent = this.garage.statText(v);
      const b = document.createElement('button'); b.dataset.buy = v.id;
      const price = document.createElement('span'); price.className = 'price' + (owned ? ' own' : ''); price.textContent = owned ? 'YOURS' : v.shop.toLocaleString();
      const lab = (full, short) => { const f = document.createElement('span'); f.className = 'full'; f.textContent = full; const sh = document.createElement('span'); sh.className = 'short'; sh.textContent = short; b.append(f, sh); };
      if (owned) { lab('YOURS', 'YOURS'); b.disabled = true; b.className = 'own'; }
      else if (chips >= v.shop) lab(`BUY \u00b7 ${v.shop.toLocaleString()}`, 'BUY');
      else { lab(`${(v.shop - chips).toLocaleString()} MORE CHIPS`, 'BUY'); b.disabled = true; }
      d.append(img, name, hint, stat, price, b); box.append(d);
    }
    this.el.querySelector('.note').textContent = note || (this.stage && this.stage.on ? (this.goods.some(v => !this.garage.isOpen(v.id)) && chips < 2000 ? 'Chips are won at the card table behind you.' : '') : this.goods.every(v => this.garage.isOpen(v.id)) ? 'Sold out. You have the lot.' : chips < 2000 ? 'Chips are won at the card table behind you. You sit down with 1,000.' : 'Pick one. Choose it afterwards from the title screen.');
  }
  open() {
    if (this.on || !this.front) return;
    this.on = true; this.G.state = 'paused';
    this._draw(); this.el.hidden = false;
    // The camera goes and stands at the counter.
    if (this.stage && this.at) { const W = 2.9, f = this.at.face; this.stage.enter({ x: this.at.x, y: this.at.y + 0.52, z: this.at.z + f * 0.55, nx: 0, ny: 0.18, nz: f, w: W, h: 1.5 }, { fill: 0.92 }); this.el.classList.add('inworld'); this._draw(); }
    const f = this.el.querySelector('button:not([disabled])'); if (f) f.focus({ preventScroll: true });
  }
  close() { if (!this.on) return; this.on = false; this.el.hidden = true; if (this.stage && this.stage.on) { this.stage.leave(); this.el.classList.remove('inworld'); } this.resume(); }
  buy(id) {
    const v = this.goods.find(g => g.id === id);
    if (!v || this.garage.isOpen(id)) return;
    if (!this.poker.spend(v.shop)) { this._draw('Not enough chips.'); return; }
    this.garage.buy(id);
    if (this.onBuy) this.onBuy(v);
    this._draw(`The ${v.name} is yours, and you are ${this.G.vehicle && this.G.vehicle.kind === v.kind ? 'in it' : 'one SWAP away from it'}. Any toy you own can be picked on the title screen.`);
  }
}
