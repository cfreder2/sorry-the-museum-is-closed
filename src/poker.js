// The game on the roof.
//
// Up the scaffold, on the roof of Gallery 211, somebody has stood a painting on an easel: Coolidge's
// A Friend in Need, the dogs at their poker. In front of it, under strings of Christmas lights,
// there is a table, and round the table three toy cars and two drones, playing Texas hold'em.
// There is an empty place. Everybody has $1,000.

import * as THREE from 'three';
import * as TX from './textures.js';
import { buildCar, buildDrone } from './vehicles.js';
import { Holdem, RANKS, SUITS } from './holdem.js';

const KEY = 'after-hours.poker', STAKE = 1000;
const WHO = [
  { name: 'You', bot: false },
  { name: 'Dozer', kind: 'car', colour: 0xe8b21c, tight: 0.75, bold: 0.3 },      // waits for a hand
  { name: 'Moth', kind: 'drone', colour: 0xd9dde4, tight: 0.3, bold: 0.45 },     // sees too many flops
  { name: 'Stinger', kind: 'car', colour: 0x1f4f8a, tight: 0.45, bold: 0.9 },    // bets at everything
  { name: 'Hawk', kind: 'drone', colour: 0x2a2c30, tight: 0.6, bold: 0.65 },
  { name: 'Buggy', kind: 'car', colour: 0x1f6a3a, tight: 0.4, bold: 0.5 },
];
const $ = id => document.getElementById(id);
const money = n => '$' + n.toLocaleString('en-US');

export class Poker {
  constructor(museum, plan, sound) {
    this.plan = plan; this.sound = sound; this.on = false; this.game = null; this.wait = 0; this.raiseTo = 0; this.t = 0;
    const T = plan.terrace;
    if (!T) return;
    this.T = T;
    const g = this.group = new THREE.Group(); g.position.set(T.x, T.top, T.z); museum.group.add(g);
    const std = o => new THREE.MeshStandardMaterial(o), put = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); g.add(m); return m; };
    const wood = std({ color: 0x6a4526, roughness: 0.55, emissive: 0x4a2e18, emissiveIntensity: 0.55 }), dark = std({ color: 0x14161a, roughness: 0.5, emissive: 0x08090b, emissiveIntensity: 0.5 });
    // A deck of boards laid on the roof.
    const ply = TX.plywood(); ply.repeat.set(5, 4);
    // (set into the roof, its top a few millimetres proud: the toy drives on the roof's own level, and wheels sank into a thicker deck)
    put(new THREE.BoxGeometry(10, 0.04, 8), std({ map: ply, roughness: 0.8, emissiveMap: ply, emissive: 0x8a7a66, emissiveIntensity: 0.3, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 }), -0.6, -0.014, 0);
    // The table: green baize, a padded rail, one leg.
    const TH = 0.2;
    put(new THREE.CylinderGeometry(0.86, 0.86, 0.04, 40), std({ color: 0x1c6a3e, roughness: 0.95, emissive: 0x0e3a20, emissiveIntensity: 0.9 }), 0, TH, 0);
    put(new THREE.TorusGeometry(0.86, 0.045, 10, 44), wood, 0, TH + 0.02, 0).rotation.x = Math.PI / 2;
    put(new THREE.CylinderGeometry(0.12, 0.3, TH, 14), wood, 0, TH / 2, 0);
    plan.obstacles.push({ x0: T.x - 0.8, x1: T.x + 0.8, z0: T.z - 0.8, z1: T.z + 0.8, y0: T.top, y1: T.top + 0.5 });
    // The painting, in a gilt frame on an easel, with a lamp over it.
    const PW = 3.3, PH = PW * 918 / 1280, px = -4.7, py = 1.0 + PH / 2;
    const pic = new THREE.TextureLoader().load('assets/friend-in-need.jpg'); pic.colorSpace = THREE.SRGBColorSpace; pic.anisotropy = 8;
    put(new THREE.PlaneGeometry(PW, PH), new THREE.MeshBasicMaterial({ map: pic, color: new THREE.Color(0.8, 0.76, 0.7) }), px + 0.05, py, 0).rotation.y = Math.PI / 2;
    const gilt = std({ color: 0xc9a23a, roughness: 0.4, metalness: 0.5, emissive: 0x6a5216, emissiveIntensity: 0.8 });
    for (const [w, h, y, z] of [[0.12, 0.16, py + PH / 2 + 0.06, 0, PW + 0.3], [0.12, 0.16, py - PH / 2 - 0.06, 0, PW + 0.3]]) put(new THREE.BoxGeometry(w, h, PW + 0.3), gilt, px, y, z);
    for (const sz of [-1, 1]) put(new THREE.BoxGeometry(0.12, PH + 0.28, 0.16), gilt, px, py, sz * (PW / 2 + 0.07));
    put(new THREE.BoxGeometry(0.08, PH + 0.1, PW + 0.1), dark, px - 0.06, py, 0);
    for (const sz of [-1, 1]) { const leg = put(new THREE.BoxGeometry(0.09, py + PH / 2 + 0.5, 0.09), wood, px - 0.12, (py + PH / 2 + 0.5) / 2, sz * 1.1); leg.rotation.x = sz * 0.06; }
    put(new THREE.BoxGeometry(0.09, 3.2, 0.09), wood, px - 0.75, 1.5, 0).rotation.z = -0.36; put(new THREE.BoxGeometry(0.2, 0.08, PW + 0.5), wood, px + 0.02, py - PH / 2 - 0.2, 0);
    put(new THREE.BoxGeometry(0.08, 0.05, PW * 0.7), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 1.7, 0.9) }), px + 0.3, py + PH / 2 + 0.3, 0);
    put(new THREE.BoxGeometry(0.34, 0.03, 0.03), dark, px + 0.15, py + PH / 2 + 0.3, 0);
    plan.obstacles.push({ x0: T.x + px - 0.9, x1: T.x + px + 0.2, z0: T.z - PW / 2 - 0.3, z1: T.z + PW / 2 + 0.3, y0: T.top, y1: T.top + 4 });
    // The picture can be looked at like any other. It is not the museum's, so it carries its own label.
    this.easel = { easel: true, room: null, x: T.x + px + 0.05, y: T.top + py, z: T.z, fy: T.top, nx: 1, nz: 0, rot: Math.PI / 2, w: PW, h: PH, seen: true, wakeAt: 0, focus: false,
      work: { id: 0, t: 'A Friend in Need', a: 'Cassius Marcellus Coolidge', d: '1903', m: 'Oil on canvas. This one is a print, on an easel, on a roof.', g: 'The roof of Gallery 211', c: '',
        alt: 'Seven dogs round a card table late at night. The bulldog nearest us is passing an ace under the table to his friend.',
        note: 'Public domain: painted in 1903 for a calendar company, by an artist who died in 1934. Not in the Art Institute\u2019s collection.',
        url: 'https://en.wikipedia.org/wiki/Dogs_Playing_Poker' } };
    // Christmas lights: four poles, strings round the square and across it, sagging between.
    const poles = [[-5.2, -3.7], [4.0, -3.7], [4.0, 3.7], [-5.2, 3.7]], PT = 3.1, P = [], C = [], Ph = [], line = [];
    const palette = [[2.6, 0.35, 0.3], [2.6, 1.9, 0.5], [0.4, 2.2, 0.7], [0.5, 0.9, 2.8], [2.4, 2.2, 1.8]];
    for (const [x, z] of poles) { put(new THREE.CylinderGeometry(0.035, 0.045, PT, 8), dark, x, PT / 2, z); plan.obstacles.push({ x0: T.x + x - 0.06, x1: T.x + x + 0.06, z0: T.z + z - 0.06, z1: T.z + z + 0.06, y0: T.top, y1: T.top + PT }); }
    const string = (a, b, sag) => { const n = Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 0.3); for (let i = 0; i <= n; i++) { const t = i / n, x = a[0] + (b[0] - a[0]) * t, z = a[1] + (b[1] - a[1]) * t, y = PT - 0.05 - sag * 4 * t * (1 - t); line.push(x, y, z); if (i < n) { P.push(x, y - 0.04, z); C.push(...palette[(P.length / 3) % 5]); Ph.push(((P.length * 7) % 97) / 97); } if (i > 0 && i < n) line.push(x, y, z); } };
    for (let i = 0; i < 4; i++) string(poles[i], poles[(i + 1) % 4], 0.45);
    string(poles[0], poles[2], 0.85); string(poles[1], poles[3], 0.85);
    const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(line, 3)); g.add(new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: 0x101214 })));
    const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); bg.setAttribute('aCol', new THREE.Float32BufferAttribute(C, 3)); bg.setAttribute('aPh', new THREE.Float32BufferAttribute(Ph, 1));
    this.bulbs = new THREE.Points(bg, new THREE.ShaderMaterial({
      uniforms: { uT: { value: 0 } },
      vertexShader: `attribute vec3 aCol; attribute float aPh; uniform float uT; varying vec3 vC;
        void main() { vec4 mv = modelViewMatrix * vec4(position, 1.0); vC = aCol * (0.7 + 0.3 * sin(uT * (1.0 + aPh * 2.0) + aPh * 40.0));
          gl_PointSize = clamp(0.16 * projectionMatrix[1][1] * 400.0 / max(-mv.z, 0.05), 2.0, 22.0); gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `varying vec3 vC; void main() { float a = smoothstep(0.5, 0.05, length(gl_PointCoord - 0.5)); gl_FragColor = vec4(vC * a, a); }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    }));
    this.bulbs.frustumCulled = false; g.add(this.bulbs);
    const glow = put(new THREE.PlaneGeometry(13, 11), new THREE.MeshBasicMaterial({ map: TX.radial(0, 1), color: new THREE.Color(0.5, 0.36, 0.2), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }), -0.6, 0.045, 0);
    glow.rotation.x = -Math.PI / 2; glow.renderOrder = 4;
    // The players, nose in to the table. Seat 0, on the side away from the painting, is yours.
    this.seats = WHO.map((w, i) => { const a = i * Math.PI / 3; return { a, x: Math.cos(a) * 1.42, z: Math.sin(a) * 1.42, w }; });
    this.models = [];
    for (const s of this.seats.slice(1)) {
      const m = s.w.kind === 'car' ? buildCar(s.w.colour) : buildDrone(s.w.colour);
      if (m.lamp) m.group.remove(m.lamp, m.lamp.target);              // nobody at the table needs a real light
      m.group.position.set(s.x, s.w.kind === 'car' ? 0.04 : 0.62, s.z); m.group.rotation.y = Math.atan2(-s.x, -s.z);
      g.add(m.group); this.models.push({ m, s, y: m.group.position.y });
      if (s.w.kind === 'car') plan.obstacles.push({ x0: T.x + s.x - 0.2, x1: T.x + s.x + 0.2, z0: T.z + s.z - 0.2, z1: T.z + s.z + 0.2, y0: T.top, y1: T.top + 0.4 });
    }
    // On the baize: five places for the cards in the middle, two face down before each player, chips, the dealer's button.
    const cv = this.cv = document.createElement('canvas'); cv.width = 320; cv.height = 90; this.cardTex = new THREE.CanvasTexture(cv); this.cardTex.colorSpace = THREE.SRGBColorSpace;
    this.boardCards = [];
    for (let i = 0; i < 5; i++) {
      const geo = new THREE.PlaneGeometry(0.115, 0.16), uv = geo.attributes.uv; for (let k = 0; k < 4; k++) uv.setX(k, (i + uv.getX(k)) / 5);
      const m = put(geo, new THREE.MeshBasicMaterial({ map: this.cardTex, color: new THREE.Color(0.85, 0.85, 0.85) }), -0.02, TH + 0.024, (i - 2) * 0.13); m.rotation.set(-Math.PI / 2, 0, -Math.PI / 2); m.visible = false; this.boardCards.push(m);
    }
    const back = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.5, 0.08, 0.1) }), chip = std({ color: 0xc8261c, roughness: 0.5, emissive: 0x6a100a, emissiveIntensity: 0.8 }), chip2 = std({ color: 0x1f4f8a, roughness: 0.5, emissive: 0x0e2748, emissiveIntensity: 0.8 });
    this.hole = []; this.stacks = [];
    this.seats.forEach((s, i) => {
      const pair = [];
      for (const d of [-1, 1]) { const m = put(new THREE.PlaneGeometry(0.075, 0.105), back, Math.cos(s.a) * 0.6 - Math.sin(s.a) * d * 0.05, TH + 0.024, Math.sin(s.a) * 0.6 + Math.cos(s.a) * d * 0.05); m.rotation.set(-Math.PI / 2, 0, -s.a + Math.PI / 2 + d * 0.12); pair.push(m); }
      this.hole.push(pair);
      const st = put(new THREE.CylinderGeometry(0.035, 0.035, 1, 12), i % 2 ? chip : chip2, Math.cos(s.a + 0.32) * 0.68, TH + 0.02, Math.sin(s.a + 0.32) * 0.68); this.stacks.push(st);
    });
    this.potChips = put(new THREE.CylinderGeometry(0.05, 0.05, 1, 14), std({ color: 0xe2be5a, roughness: 0.4, metalness: 0.4, emissive: 0x6a5216, emissiveIntensity: 0.8 }), 0.2, TH + 0.02, 0);
    this.buttonDisc = put(new THREE.CylinderGeometry(0.04, 0.04, 0.012, 14), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 1.6, 1.5) }), 0, TH + 0.03, 0);
    this._table();
    // The screen: what is in your hand, what is on the table, and what you can do about it.
    document.addEventListener('click', e => { const b = e.target.closest('[data-pk]'); if (b && this.on) { e.stopPropagation(); this.press(b.dataset.pk); } }, true);
  }

  // Close enough, on the roof, and not going anywhere?
  near(v) { const T = this.T; return !!T && !this.on && v.pos.y > T.top - 0.3 && v.pos.y < T.top + 3 && Math.hypot(v.pos.x - T.x, v.pos.z - T.z) < 2.6 && Math.hypot(v.vel.x, v.vel.z) < 3; }
  // In front of the picture on the easel, on the roof, and pointed at it?
  facingEasel(v) {
    const e = this.easel; if (!e || this.on) return false;
    const dx = v.pos.x - e.x, dz = v.pos.z - e.z;
    return v.pos.y > e.fy - 0.3 && v.pos.y < e.fy + 4 && dx > 0.4 && dx < 9 && Math.abs(dz) < 3 && -Math.sin(v.yaw) > 0.5 && Math.hypot(v.vel.x, v.vel.z) < 3;
  }
  // Where your toy sits, and where the camera stands to watch.
  seat() { const T = this.T, s = this.seats[0]; return { x: T.x + s.x, z: T.z + s.z, y: T.top, yaw: -Math.PI / 2, cam: new THREE.Vector3(T.x + 3.3, T.top + 1.5, T.z + 0.9), look: new THREE.Vector3(T.x - 1.4, T.top + 0.7, T.z) }; }

  sit() {
    let saved = null; try { saved = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { /* fine */ }
    const stacks = saved && Array.isArray(saved.stacks) && saved.stacks.length === WHO.length && saved.stacks.some((n, i) => i > 0 && n > 0) ? saved.stacks : WHO.map(() => STAKE);
    if (stacks[0] <= 0) stacks[0] = STAKE;
    this.game = new Holdem(WHO.map((w, i) => ({ ...w, bot: i > 0, stack: stacks[i] })));
    if (saved && Number.isInteger(saved.button)) this.game.button = saved.button % WHO.length;
    this.on = true; this.note = '';
    $('poker').hidden = false;
    this._deal();
  }
  // Your chips, as they stand between sittings, and spending them (at the stall beside the table).
  chips() { try { const sv = JSON.parse(localStorage.getItem(KEY) || 'null'); if (sv && Array.isArray(sv.stacks) && sv.stacks[0] > 0) return sv.stacks[0]; } catch { /* fine */ } return STAKE; }
  spend(n) {
    const have = this.chips(); if (n > have) return false;
    let sv = null; try { sv = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { /* fine */ }
    if (!sv || !Array.isArray(sv.stacks) || sv.stacks.length !== WHO.length) sv = { stacks: WHO.map(() => STAKE), button: 0 };
    sv.stacks[0] = have - n;
    try { localStorage.setItem(KEY, JSON.stringify(sv)); } catch { return false; }
    this.game = null;
    return true;
  }
  /** Chips come by some other way (change picked up off the café floor). */
  earn(n) {
    if (this.game && this.game.p && this.game.p[0]) { this.game.p[0].stack += n; this._save(); return true; }
    let sv = null; try { sv = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { /* fine */ }
    if (!sv || !Array.isArray(sv.stacks) || sv.stacks.length !== WHO.length) sv = { stacks: WHO.map(() => STAKE), button: 0 };
    sv.stacks[0] = this.chips() + n;
    try { localStorage.setItem(KEY, JSON.stringify(sv)); } catch { return false; }
    return true;
  }
  leave() { this.on = false; $('poker').hidden = true; this._save(); }
  reset() { try { localStorage.removeItem(KEY); } catch { /* fine */ } this.game = null; if (this.T) this._table(); }
  _save() { if (!this.game) return; try { localStorage.setItem(KEY, JSON.stringify({ stacks: this.game.p.map(q => q.stack + q.total), button: this.game.button })); } catch { /* fine */ } }

  _deal() {
    const g = this.game;
    if (g.p[0].stack <= 0) { g.p[0].stack = STAKE; this.note = `Cleaned out. The table stakes you another ${money(STAKE)}.`; }
    if (g.p.slice(1).every(q => q.stack <= 0)) { for (const q of g.p) q.stack = STAKE; this.note = 'You took every chip on the roof. They have all bought back in.'; }
    g.deal(); this.wait = 0.9; this.raiseTo = 0; this.sound.tick(0.07, 2400, 0.05);
    this._show();
  }

  // A button on the screen, or the key that stands for it.
  press(what) {
    const g = this.game;
    if (!g) return;
    if (what === 'leave') return this.leave();
    if (g.phase === 'showdown') { if (what === 'next' || what === 'call') { this.note = ''; this._deal(); } return; }
    if (g.to !== 0) return;
    const L = g.legal(), step = Math.max(g.bb, Math.round(g.pot / 4 / 10) * 10);
    if (!this.raiseTo) this.raiseTo = L.min;
    if (what === 'fold') g.act('fold');
    else if (what === 'call') g.act('call');
    else if (what === 'raise') g.act('raise', this.raiseTo);
    else if (what === 'allin') g.act('raise', L.max);
    else if (what === 'more') { this.raiseTo = Math.min(L.max, this.raiseTo + step); return this._show(); }
    else if (what === 'less') { this.raiseTo = Math.max(L.min, this.raiseTo - step); return this._show(); }
    else return;
    this.raiseTo = 0; this.wait = 0.7; this.sound.tick(0.08, 3200, 0.04);
    this._after();
  }
  key(code) {
    const k = { KeyF: 'fold', KeyC: 'call', Space: 'call', Enter: 'call', KeyR: 'raise', KeyA: 'allin', ArrowRight: 'more', ArrowUp: 'more', Equal: 'more', ArrowLeft: 'less', ArrowDown: 'less', Minus: 'less', Escape: 'leave', KeyE: 'leave', KeyN: 'next' }[code];
    if (k) this.press(k);
    return !!k;
  }
  _after() {
    const g = this.game;
    if (g.phase === 'showdown') { this._save(); const me = g.p[0]; if (me.won > 0) this.sound.lap(); else if (g.result.show && !me.folded) this.sound.bump(2); }
    this._show();
  }

  update(dt, t, calm) {
    if (!this.T) return;
    this.t = t;
    this.bulbs.material.uniforms.uT.value = calm ? 0 : t;
    for (const { m, s, y } of this.models) if (s.w.kind === 'drone') { m.group.position.y = y + (calm ? 0 : Math.sin(t * 1.7 + s.a) * 0.035); if (m.rotors) for (const r of m.rotors) r.rotation.y += dt * 40; }
    const g = this.game;
    if (!this.on || !g || g.phase === 'showdown' || g.to <= 0) return;
    // A machine's turn: it takes a moment over it.
    this.wait -= dt;
    if (this.wait > 0) return;
    const [type, to] = g.think();
    g.act(type, to);
    this.sound.tick(0.06, type === 'fold' ? 900 : 3000, 0.04);
    this.wait = g.p[0].folded || g.p[0].allIn ? 0.45 : 0.95;
    this._after();
  }

  // ---- showing it ----
  _card(c, small, down) {
    if (down || c == null) return `<i class="pc${small ? ' sm' : ''} down"></i>`;
    const r = RANKS[c >> 2] === 'T' ? '10' : RANKS[c >> 2], s = SUITS[c & 3], red = (c & 3) === 1 || (c & 3) === 2;
    return `<i class="pc${small ? ' sm' : ''}${red ? ' red' : ''}" aria-label="${r} of ${['clubs', 'diamonds', 'hearts', 'spades'][c & 3]}"><b>${r}</b>${s}</i>`;
  }
  _show() {
    const g = this.game, me = g.p[0], done = g.phase === 'showdown', L = g.to === 0 ? g.legal() : null;
    $('pkSeats').innerHTML = g.p.slice(1).map((q, i) => {
      const cards = q.stack <= 0 && q.folded && !q.cards.length ? '' : q.folded ? '' : (q.shown ? q.cards.map(c => this._card(c, true)).join('') : this._card(0, true, true) + this._card(0, true, true));
      return `<div class="pkseat${g.to === i + 1 ? ' turn' : ''}${q.folded ? ' gone' : ''}${q.won ? ' won' : ''}"><span class="n">${q.name}${g.button === i + 1 ? ' <u>D</u>' : ''}</span><span class="s">${q.stack <= 0 && q.folded && !q.won ? 'out' : money(q.stack)}</span><span class="c">${cards}</span><span class="a">${q.said}${q.bet > 0 && !done ? ' · ' + money(q.bet) : ''}</span></div>`;
    }).join('');
    $('pkBoard').innerHTML = [0, 1, 2, 3, 4].map(i => g.board[i] != null ? this._card(g.board[i]) : '<i class="pc empty"></i>').join('');
    $('pkPot').textContent = done ? '' : `Pot ${money(g.pot)}`;
    const said = done ? g.result.lines.join(' ') : g.to === 0 ? (L.canCheck ? 'Your turn.' : `Your turn: ${money(L.call)} to call.`) : g.to > 0 ? `${g.p[g.to].name} is thinking…` : '';
    $('pkLog').textContent = (this.note ? this.note + ' ' : '') + said;
    $('pkMine').innerHTML = me.cards.map(c => this._card(c)).join('');
    $('pkStack').innerHTML = `<b>${money(me.stack)}</b>${g.button === 0 ? ' · dealer' : ''}${me.bet > 0 && !done ? ' · in for ' + money(me.bet) : ''}${me.folded && !done ? ' · folded' : ''}`;
    const acts = $('pkActs'), next = $('pkNext');
    acts.hidden = !L; next.hidden = !done;
    if (L) {
      if (!this.raiseTo || this.raiseTo < L.min) this.raiseTo = L.min;
      $('pkCall').textContent = L.canCheck ? 'Check' : L.call >= me.stack ? `Call all in ${money(L.call)}` : `Call ${money(L.call)}`;
      $('pkFold').disabled = L.canCheck;
      for (const id of ['pkRaise', 'pkLess', 'pkMore', 'pkAll']) $(id).disabled = !L.canRaise;
      $('pkRaise').textContent = `${g.cur === 0 ? 'Bet' : 'Raise to'} ${money(Math.min(this.raiseTo, L.max))}`;
    }
    this._table();
  }
  // The same, on the baize itself.
  _table() {
    const g = this.game, x = this.cv.getContext('2d');
    x.fillStyle = '#1c6a3e'; x.fillRect(0, 0, 320, 90);
    for (let i = 0; i < 5; i++) {
      const c = g && g.board[i];
      this.boardCards[i].visible = c != null;
      if (c == null) continue;
      x.fillStyle = '#f6f3ea'; x.fillRect(i * 64 + 2, 2, 60, 86);
      x.fillStyle = (c & 3) === 1 || (c & 3) === 2 ? '#c0221c' : '#14161a'; x.textAlign = 'center'; x.textBaseline = 'middle';
      x.font = 'bold 34px Georgia, serif'; x.fillText(RANKS[c >> 2] === 'T' ? '10' : RANKS[c >> 2], i * 64 + 32, 30); x.font = '32px Georgia, serif'; x.fillText(SUITS[c & 3], i * 64 + 32, 64);
    }
    this.cardTex.needsUpdate = true;
    this.seats.forEach((s, i) => {
      const q = g ? g.p[i] : null, inHand = q ? !q.folded : i > 0;
      for (const m of this.hole[i]) m.visible = inHand;
      const h = Math.max(0.012, (q ? q.stack : STAKE) / STAKE * 0.07);
      this.stacks[i].scale.y = h; this.stacks[i].position.y = 0.22 + h / 2; this.stacks[i].visible = !q || q.stack > 0;
    });
    const pot = g ? g.pot : 0, ph = Math.max(0.012, pot / STAKE * 0.07);
    this.potChips.visible = pot > 0; this.potChips.scale.y = ph; this.potChips.position.y = 0.22 + ph / 2;
    const b = this.seats[g ? g.button : 5]; this.buttonDisc.position.set(Math.cos(b.a - 0.3) * 0.66, 0.23, Math.sin(b.a - 0.3) * 0.66);
  }
}
