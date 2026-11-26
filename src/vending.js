// The vending machines. There is a row of them in the café and one or two elsewhere behind the scenes,
// and what they sell is spray paint: six colours to a machine, a different six in each, 25 chips a can.
// A can bought is a colour kept for good (src/garage.js keeps the list): it goes straight onto the body
// of whatever you are driving, and after that any colour you own can be put on any toy from the title
// screen. One machine also sells cans of pop, which do what pop does.
//
// The money is the card game's chips, as at the stall on the roof. Anybody who has not sat down at the
// table still has their stake; and there is loose change on the café floor, five chips a coin.
//
// src/furnish.js draws the cabinets and leaves a note of where each stands. This file fills them (cans
// on the shelves, glass over the front, a name across the top), and stands the camera in front of one
// when you pull up to it: tap a can, then BUY.

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { PAINTS } from './garage.js';
import { fitText } from './textures.js';

const PRICE = 25, POP = 10, COIN = 5, FIZZ = 30;
const COLS = [-0.32, -0.12, 0.08], ROWS = [0.97, 1.34], LOW = 0.6;          // where the cans stand in the case: across it, and the two shelves (and the bottom one)
const hexOf = n => '#' + n.toString(16).padStart(6, '0');

const STYLE = `
#vend { position: fixed; inset: 0; z-index: 30; pointer-events: none; font-family: var(--serif, Georgia, serif); color: var(--cream, #f1ead8); }
#vend[hidden] { display: none; }
#vend .chips { position: fixed; top: max(10px, env(safe-area-inset-top)); left: max(12px, env(safe-area-inset-left)); background: rgba(4,5,9,.8); padding: 6px 14px; border-radius: 10px; font: 600 13px var(--mono, ui-monospace, monospace); letter-spacing: .1em; color: var(--gilt, #e2cd94); white-space: nowrap; }
#vend button { font: 700 12px var(--mono, ui-monospace, monospace); letter-spacing: .12em; cursor: pointer; pointer-events: auto; }
#vend .leave { position: fixed; right: max(12px, env(safe-area-inset-right)); top: max(10px, env(safe-area-inset-top)); height: 44px; padding: 0 18px; border-radius: 8px; border: 1px solid rgba(226,205,148,.6); background: rgba(8,9,14,.78); color: var(--gilt, #e2cd94); }
#vend .can { position: fixed; left: var(--x, 50%); top: var(--y, 50%); width: var(--w, 48px); height: var(--h, 80px); transform: translate(-50%, -50%); border: 2px solid transparent; border-radius: 8px; background: none; padding: 0; color: #fff; }
#vend .can.on { border-color: #fff3c8; box-shadow: 0 0 14px rgba(255,243,200,.55); }
#vend .can span { position: absolute; left: 50%; bottom: -3px; transform: translate(-50%, 100%); font-size: 11px; letter-spacing: .04em; background: rgba(4,5,9,.78); color: var(--gilt, #e2cd94); padding: 1px 6px; border-radius: 6px; white-space: nowrap; }
#vend .can.own span { color: #9fe0b0; }
#vend .card { position: fixed; right: max(14px, env(safe-area-inset-right)); top: 50%; transform: translateY(-50%); width: min(220px, 30vw); background: rgba(6,7,11,.86); border: 1px solid rgba(226,205,148,.45); border-radius: 12px; padding: 12px; display: flex; flex-direction: column; gap: 8px; pointer-events: auto; }
#vend .sw { height: 34px; border-radius: 8px; border: 1px solid rgba(255,255,255,.35); }
#vend .card b { font-size: 18px; font-weight: 400; color: var(--gilt, #e2cd94); }
#vend .card .what { font-size: 12.5px; line-height: 1.35; color: #cfc8b4; min-height: 2.6em; }
#vend .buy { height: 48px; border-radius: 8px; border: 1px solid #fff3c8; background: #dcc88e; color: #15130d; font-size: 15px; letter-spacing: .18em; }
#vend .buy[disabled] { opacity: .45; cursor: default; }
#vend .note { position: fixed; left: 50%; transform: translateX(-50%); bottom: max(8px, env(safe-area-inset-bottom)); max-width: min(70vw, 520px); text-align: center; background: rgba(4,5,9,.8); padding: 5px 12px; border-radius: 10px; font-size: 13px; }
#vend .note:empty { display: none; }
@media (max-height: 460px) { #vend .card { padding: 9px; gap: 6px; width: min(190px, 26vw); } #vend .card b { font-size: 15px; } #vend .card .what { font-size: 11px; min-height: 0; } #vend .buy { height: 44px; } #vend .sw { height: 24px; } }
`;

function label(text, sub, bg, fg) {
  // (the shape of the strip it is on, 0.58 by 0.12, so the letters are not squeezed)
  const W = 464, cv = document.createElement('canvas'); cv.width = W; cv.height = 96; const g = cv.getContext('2d');
  g.fillStyle = bg; g.fillRect(0, 0, W, 96);
  g.fillStyle = fg; fitText(g, text, { x: W / 2, y: 40, w: W - 30, h: 56, px: 54, weight: '700', family: 'Georgia, serif' });
  fitText(g, sub, { x: W / 2, y: 80, w: W - 30, h: 18, px: 17, weight: '600', family: 'ui-monospace, monospace' });
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}

export class Vending {
  constructor(G, { museum, plan, garage, poker, sound, stage, resume, callout, secrets, trophies, onBuy }) {
    Object.assign(this, { G, museum, plan, garage, poker, sound, stage, resume, callout, secrets, trophies, onBuy });
    this.on = false; this.at = null; this.sel = 0; this.fizz = 0; this.drop = null; this._v = new THREE.Vector3();
    this.group = new THREE.Group(); museum.group.add(this.group);
    const marks = (plan.marks || []).filter(m => m.kind === 'vending');
    // The café's row first, so that the thirty colours are all to be had in the one room; then the rest of the building's.
    marks.sort((a, b) => (a.room === 'F0-cafe' ? 0 : 1) - (b.room === 'F0-cafe' ? 0 : 1));
    this.list = marks.map((m, i) => {
      const stock = [0, 1, 2, 3, 4, 5].map(k => PAINTS[(i * 6 + k) % PAINTS.length]);
      // A point in the machine's own frame (u across, y up, d out from its front) set down in the building.
      const P = (u, y, d) => new THREE.Vector3(m.x + u * m.fz + d * m.fx, m.y + y, m.z - u * m.fx + d * m.fz);
      return { ...m, i, stock, pop: i === 0, P, front: P(-0.1, 0, 0.75) };
    });
    this._build();
    this._coins();
    this._dom();
  }

  _build() {
    const n = this.list.length; if (!n) return;
    const body = new THREE.CylinderGeometry(0.034, 0.034, 0.17, 12).translate(0, 0.085, 0), capG = mergeGeometries([new THREE.CylinderGeometry(0.02, 0.03, 0.022, 10).translate(0, 0.181, 0), new THREE.CylinderGeometry(0.012, 0.012, 0.02, 8).translate(0, 0.2, 0)]);
    const canM = new THREE.MeshStandardMaterial({ roughness: 0.5, metalness: 0.1, emissive: 0xffffff, emissiveIntensity: 0.62 });
    canM.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n\t#ifdef USE_COLOR\n\ttotalEmissiveRadiance *= vColor.rgb;\n\t#endif'); };
    const capM = new THREE.MeshStandardMaterial({ color: 0xe8eaee, roughness: 0.4, metalness: 0.5, emissive: 0x9aa0a8, emissiveIntensity: 0.5 });
    const total = n * 18 + 9;
    const cans = this.cans = new THREE.InstancedMesh(body, canM, total), caps = new THREE.InstancedMesh(capG, capM, total), M = new THREE.Matrix4(), c = new THREE.Color();
    let k = 0;
    const glass = [], names = [], names2 = [];
    const quad = (a, b, cc, d) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([a.x, a.y, a.z, b.x, b.y, b.z, cc.x, cc.y, cc.z, d.x, d.y, d.z], 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2)); g.setIndex([0, 1, 2, 0, 2, 3]); g.computeVertexNormals(); return g; };
    for (const m of this.list) {
      m.spots = [];
      m.stock.forEach((p, j) => {
        const u = COLS[j % 3], y = ROWS[Math.floor(j / 3)];
        m.spots.push({ u, y, kind: 'paint', paint: p });
        for (let d = 0; d < 3; d++) { const at = m.P(u, y, -0.07 - d * 0.075); M.makeTranslation(at.x, at.y, at.z); cans.setMatrixAt(k, M); caps.setMatrixAt(k, M); cans.setColorAt(k, c.set(p.hex)); k++; }
      });
      if (m.pop) {
        m.spots.push({ u: COLS[1], y: LOW, kind: 'pop' });
        for (const u of COLS) for (let d = 0; d < 3; d++) { const at = m.P(u, LOW, -0.07 - d * 0.075); M.makeTranslation(at.x, at.y, at.z).scale(new THREE.Vector3(0.95, 0.72, 0.95)); cans.setMatrixAt(k, M); M.makeScale(0, 0, 0); caps.setMatrixAt(k, M); cans.setColorAt(k, c.set(u === COLS[1] ? 0xe8482a : u < COLS[1] ? 0x2a8ae8 : 0x3ac86a)); k++; }
      }
      glass.push(quad(m.P(0.18, 0.52, -0.012), m.P(-0.42, 0.52, -0.012), m.P(-0.42, 1.7, -0.012), m.P(0.18, 1.7, -0.012)));
      (m.pop ? names2 : names).push(quad(m.P(-0.41, 1.715, 0.004), m.P(0.17, 1.715, 0.004), m.P(0.17, 1.835, 0.004), m.P(-0.41, 1.835, 0.004)));
    }
    M.makeScale(0, 0, 0); for (; k < total; k++) { cans.setMatrixAt(k, M); caps.setMatrixAt(k, M); cans.setColorAt(k, c.set(0)); }
    cans.frustumCulled = caps.frustumCulled = false; this.group.add(cans, caps);
    this.group.add(new THREE.Mesh(mergeGeometries(glass), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.55, 0.75, 0.9), transparent: true, opacity: 0.05, depthWrite: false, side: THREE.DoubleSide })));
    if (names.length) this.group.add(new THREE.Mesh(mergeGeometries(names), new THREE.MeshBasicMaterial({ map: label('SPRAY·O·MAT', 'A COLOUR FOR EVERY TOY · 25', '#f2efe6', '#b3261e') })));
    if (names2.length) this.group.add(new THREE.Mesh(mergeGeometries(names2), new THREE.MeshBasicMaterial({ map: label('FIZZ & SPRAY', 'PAINT 25 · POP 10', '#16304a', '#ffd35a') })));
    // The can that comes down the chute.
    const one = new THREE.Group(); const b1 = new THREE.Mesh(body, new THREE.MeshStandardMaterial({ roughness: 0.35, metalness: 0.25, emissive: 0xffffff, emissiveIntensity: 0.3 })), c1 = new THREE.Mesh(capG, capM); one.add(b1, c1); one.visible = false; this.fall = one; this.fallMat = b1.material; this.group.add(one);
  }

  // Loose change: where the fit-out says some rolled. Five chips a coin, back again the next night.
  _coins() {
    const marks = (this.plan.marks || []).filter(m => m.kind === 'coin');
    this.coins = marks.map(m => ({ x: m.x, y: m.y, z: m.z, got: false }));
    if (!marks.length) return;
    const g = new THREE.CylinderGeometry(0.045, 0.045, 0.012, 14).rotateX(Math.PI / 2);
    this.coinMesh = new THREE.InstancedMesh(g, new THREE.MeshStandardMaterial({ color: 0xe8c040, roughness: 0.3, metalness: 0.8, emissive: 0xb07a10, emissiveIntensity: 0.9 }), marks.length);
    this.coinMesh.frustumCulled = false; this.coinMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); this.group.add(this.coinMesh);
  }
  /** A new night: the change is back on the floor. (What you bought, you keep.) */
  reset() { for (const c of this.coins) c.got = false; this.fizz = 0; this._unfizz(); if (this.fall) this.fall.visible = false; }

  /** The machine you have pulled up to, if you have. */
  near(v) {
    if (this.on) return null;
    for (const m of this.list) if (Math.abs(v.pos.y - m.y) < 1.3 && Math.hypot(v.pos.x - m.front.x, v.pos.z - m.front.z) < 1.25 && Math.hypot(v.vel.x, v.vel.z) < 3) return m;
    return null;
  }

  update(dt, t = 0) {
    const G = this.G, v = G.vehicle;
    // coins: turning where they lie, and picked up by driving over them
    if (this.coinMesh && v) {
      const M = this._m || (this._m = new THREE.Matrix4()), q = this._q || (this._q = new THREE.Quaternion()), up = this._up || (this._up = new THREE.Vector3(0, 1, 0)), s1 = this._s1 || (this._s1 = new THREE.Vector3(1, 1, 1)), s0 = this._s0 || (this._s0 = new THREE.Vector3(0, 0, 0));
      const show = this.coins.length && Math.abs(v.pos.y - this.coins[0].y) < 8;
      this.coinMesh.visible = show;
      if (show) {
        const playing = G.state === 'play' && G.mode === 'explore';
        this.coins.forEach((c, i) => {
          if (!c.got && playing && Math.abs(v.pos.y - c.y) < 0.6 && (v.pos.x - c.x) ** 2 + (v.pos.z - c.z) ** 2 < 0.34 * 0.34) {
            c.got = true; this.poker.earn(COIN);
            if (this.sound) { const now = this.sound.ctx ? this.sound.ctx.currentTime : 0; this.sound.bell(1568, now, 0.05, 0.5, 0.4); this.sound.bell(2093, now + 0.07, 0.05, 0.7, 0.4); }
            if (this.callout) this.callout(`+${COIN} CHIPS`);
          }
          q.setFromAxisAngle(up, t * 2.2 + i);
          M.compose(this._v.set(c.x, c.y + 0.075 + Math.sin(t * 2.4 + i) * 0.012, c.z), q, c.got ? s0 : s1); this.coinMesh.setMatrixAt(i, M);
        });
        this.coinMesh.instanceMatrix.needsUpdate = true;
      }
    }
    // the pop wearing off
    if (this.fizz > 0 && G.state === 'play') { this.fizz -= dt; if (this.fizz <= 0) { this._unfizz(); if (this.callout) this.callout('THE FIZZ HAS GONE'); } }
    // a can on its way down
    if (this.drop) {
      const d = this.drop; d.t += dt;
      const k = Math.min(1, d.t / 0.75), e = k * k, m = d.m, u = d.u + (-0.12 - d.u) * Math.min(1, k * 1.6), y = d.y + (0.26 - d.y) * e, out = k < 0.25 ? -0.07 + k * 0.2 : -0.02;
      this.fall.position.copy(m.P(u, y, out)); this.fall.rotation.set(k * 5 * m.fz, 0, -k * 5 * m.fx); this.fall.visible = true;
      if (k >= 1 && !d.done) { d.done = true; this.fall.rotation.set(Math.PI / 2 * m.fz, 0, -Math.PI / 2 * m.fx); this.fall.position.copy(m.P(-0.12, 0.25, 0.02)); if (this.sound) { this.sound.knock(5, true); this.sound.tick(0.07, 900, 0.05); } this.drop = null; }
    }
    // a hum, if you are close enough to hear one
    this._hum(v);
    // the buttons over the cans
    if (this.on && this.stage && this.stage.on && this.at) {
      const cam = this.stage.camera, m = this.at;
      this.el.querySelectorAll('.can').forEach((b, i) => {
        const s = m.spots[i]; if (!s) return;
        const a = this._v.copy(m.P(s.u, s.y + 0.1, -0.03)).project(cam), x = (a.x + 1) / 2 * innerWidth, y = (1 - a.y) / 2 * innerHeight;
        const p0 = this._v.copy(m.P(s.u - 0.09, s.y - 0.02, -0.03)).project(cam), x0 = (p0.x + 1) / 2 * innerWidth, y0 = (1 - p0.y) / 2 * innerHeight;
        const p1 = this._v.copy(m.P(s.u + 0.09, s.y + 0.24, -0.03)).project(cam), x1 = (p1.x + 1) / 2 * innerWidth, y1 = (1 - p1.y) / 2 * innerHeight;
        b.style.setProperty('--x', x + 'px'); b.style.setProperty('--y', y + 'px'); b.style.setProperty('--w', Math.max(40, Math.abs(x1 - x0)) + 'px'); b.style.setProperty('--h', Math.max(44, Math.abs(y1 - y0)) + 'px');
      });
    }
  }
  _hum(v) {
    const s = this.sound, c = s && s.ctx; if (!c || c.state !== 'running' || !s.master || !v) return;
    let best = 1e9; for (const m of this.list) if (Math.abs(v.pos.y - m.y) < 2.5) best = Math.min(best, Math.hypot(v.pos.x - m.front.x, v.pos.z - m.front.z));
    const want = best < 7 ? 0.012 * (1 - best / 7) : 0;
    if (!this.hum) { if (!want) return; try { const o = c.createOscillator(), o2 = c.createOscillator(), g = c.createGain(); o.type = 'sine'; o.frequency.value = 100; o2.type = 'triangle'; o2.frequency.value = 200.6; g.gain.value = 0; o.connect(g); o2.connect(g); g.connect(s.master); o.start(); o2.start(); this.hum = g; } catch { return; } }
    this.hum.gain.setTargetAtTime(want, c.currentTime, 0.3);
  }

  // ---- buying ----
  _dom() {
    const st = document.createElement('style'); st.textContent = STYLE; document.head.append(st);
    const el = this.el = document.createElement('section'); el.id = 'vend'; el.hidden = true; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', 'A vending machine');
    el.innerHTML = '<div class="chips"></div><div class="cans"></div><div class="card"><div class="sw"></div><b></b><div class="what"></div><button class="buy" type="button"></button></div><div class="note" role="status"></div><button class="leave" type="button">Leave</button>';
    document.body.append(el);
    el.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.classList.contains('leave')) this.close();
      else if (b.classList.contains('can')) { this.sel = +b.dataset.i; this._draw(); }
      else if (b.classList.contains('buy')) this.buy();
    });
    addEventListener('keydown', e => {
      if (!this.on) return;
      if (e.code === 'Escape') { e.preventDefault(); e.stopPropagation(); this.close(); }
      else if (e.code === 'ArrowRight' || e.code === 'ArrowLeft') { e.preventDefault(); e.stopPropagation(); const n = this.at.spots.length; this.sel = (this.sel + (e.code === 'ArrowRight' ? 1 : n - 1)) % n; this._draw(); }
      else if (e.code === 'Enter' || e.code === 'KeyE') { e.preventDefault(); e.stopPropagation(); this.buy(); }
    }, true);
  }
  _wearing() { const v = this.G.vehicle, id = v && this.garage.on[v.kind]; return id || null; }
  _draw(note = '') {
    const m = this.at; if (!m) return;
    const chips = this.poker.chips(), box = this.el.querySelector('.cans'), wearing = this._wearing(), coat = wearing && this.garage.coatOf(wearing);
    this.el.querySelector('.chips').textContent = `YOUR CHIPS: ${chips.toLocaleString()}`;
    if (box.children.length !== m.spots.length) { box.textContent = ''; m.spots.forEach((s, i) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'can'; b.dataset.i = i; b.append(document.createElement('span')); box.append(b); }); }
    m.spots.forEach((s, i) => {
      const b = box.children[i], own = s.kind === 'paint' && this.garage.paints.has(s.paint.id);
      b.className = 'can' + (i === this.sel ? ' on' : '') + (own ? ' own' : ''); b.setAttribute('aria-pressed', String(i === this.sel));
      b.setAttribute('aria-label', s.kind === 'pop' ? `A can of pop, ${POP} chips` : `${s.paint.name}, ${own ? 'yours' : PRICE + ' chips'}`);
      b.firstChild.textContent = s.kind === 'pop' ? String(POP) : own ? '✓' : String(PRICE);
    });
    const s = m.spots[this.sel] || m.spots[0], card = this.el.querySelector('.card'), buy = card.querySelector('.buy');
    if (s.kind === 'pop') {
      card.querySelector('.sw').style.background = 'linear-gradient(90deg, #2a8ae8, #e8482a, #3ac86a)'; card.querySelector('b').textContent = 'A can of pop';
      card.querySelector('.what').textContent = `${POP} chips. Shaken, not opened: for ${FIZZ} seconds the car hops half as high again.`;
      buy.textContent = this.fizz > 0 ? 'FIZZING' : chips >= POP ? 'BUY' : 'NO CHIPS'; buy.disabled = this.fizz > 0 || chips < POP;
    } else {
      const own = this.garage.paints.has(s.paint.id), worn = coat && coat.id === s.paint.id;
      card.querySelector('.sw').style.background = hexOf(s.paint.hex); card.querySelector('b').textContent = s.paint.name;
      card.querySelector('.what').textContent = own ? (worn ? 'Yours, and on the toy you are driving.' : 'Yours. Put it on the toy you are driving?') : `${PRICE} chips a can. Yours for good, for any toy.`;
      buy.textContent = own ? (worn ? 'WEARING' : 'WEAR') : chips >= PRICE ? 'BUY' : 'NO CHIPS'; buy.disabled = (own && worn) || (!own && chips < PRICE);
    }
    this.el.querySelector('.note').textContent = note || (chips < PRICE && m.spots.some(q => q.kind === 'paint' && !this.garage.paints.has(q.paint.id)) ? 'Chips are won at the card table on the roof. There is loose change on the café floor, too.' : '');
  }
  open(m) {
    if (this.on || !m) return;
    this.on = true; this.at = m; this.sel = Math.max(0, m.spots.findIndex(s => s.kind === 'paint' && !this.garage.paints.has(s.paint.id)));
    this.G.state = 'paused';
    if (this.fall) this.fall.visible = false;
    this.el.hidden = false; this._draw();
    if (this.stage) { const c = m.P(-0.02, 1.02, 0); this.stage.enter({ x: c.x, y: c.y, z: c.z, nx: m.fx, ny: 0, nz: m.fz, w: 1.02, h: 1.68 }, { fill: 0.97 }); }
    const f = this.el.querySelector('.buy:not([disabled])') || this.el.querySelector('.leave'); if (f) f.focus({ preventScroll: true });
  }
  close() { if (!this.on) return; this.on = false; this.el.hidden = true; if (this.stage && this.stage.on) this.stage.leave(); this.resume(); }
  buy() {
    const m = this.at, s = m && m.spots[this.sel]; if (!s) return;
    if (s.kind === 'pop') {
      if (this.fizz > 0) return;
      if (!this.poker.spend(POP)) { this._draw('Not enough chips.'); return; }
      this._drop(m, s, 0xe8482a); this._fizz();
      if (this.secrets) this.secrets.find('vending');
      this._draw(`Fizz. The car hops higher for ${FIZZ} seconds.`); return;
    }
    const p = s.paint, wearing = this._wearing();
    if (!this.garage.paints.has(p.id)) {
      if (!this.poker.spend(PRICE)) { this._draw('Not enough chips.'); return; }
      this.garage.ownPaint(p.id); this._drop(m, s, p.hex);
      if (this.secrets) this.secrets.find('vending');
      if (this.trophies) { this.trophies.flags.paints = Math.max(this.trophies.flags.paints || 0, this.garage.paints.size); this.trophies.save(); }
      if (this.onBuy) this.onBuy(p);
    }
    const paints = wearing && wearing !== 'ufo';      // (not the saucer: the garage keeps no paint row for it, so paint put on it here could never be taken off)
    if (paints) this.garage.setCoat(wearing, p.id);
    this._draw(paints ? `${p.name}: on the ${this.garage.get(wearing).name} now, and yours for any toy from the title screen.` : `${p.name} is yours.`);
  }
  _drop(m, s, hex) { this.fallMat.color.set(hex); this.fallMat.emissive.set(hex); this.drop = { m, u: s.u, y: s.y, t: 0 }; if (this.sound) this.sound.tick(0.06, 320, 0.12); }
  _fizz() {
    this.fizz = FIZZ; const car = this.G.car; if (!car || this.fizzed) return;
    this.fizzed = car.spec; this.fizzWas = car.spec.jump; car.spec.jump = this.fizzWas * 1.5;
    if (this.sound && this.sound.grind) this.sound.tick(0.05, 5200, 0.5);
  }
  _unfizz() { if (this.fizzed) { if (this.G.car && this.G.car.spec === this.fizzed) this.fizzed.jump = this.fizzWas; this.fizzed = null; } }
}
