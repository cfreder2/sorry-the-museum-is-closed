// Level 3: the conservation offices along the main building's top-floor corridor (features.js; galleries in level3.js).
// The staff's own small stories, each a clue to something in the Modern Wing upstairs: an X-ray of a painting with a
// guitar under it (391), slides on a light table (392, 393, 398), a fax for the restaurant (Terzo Piano), a notice board
// with a sprint time on it (389). And a birthday cake nobody has blown the candles out on.
import * as THREE from 'three';
import { feature } from './features.js';
import { wallSpots } from './placing.js';
import { TAU, std, metal, glowMat, canvasTex, lathe, glow, spot, block, rnd, ease } from './level3kit.js';

const once = (k, key, text, hold = 4) => k.once('l3-' + key, text, hold);
// Something flat on a wall, low enough for a toy to see: the first clear stretch of wall in the room, turned to face in.
function onWall(k, id, { w = 1.0, h = 0.8, prefer = null } = {}) {
  const r = k.plan.byId[id]; if (!r) return null;
  let s = wallSpots(k.plan, k.museum, r, { step: 0.4, clear: 0.8, depth: 0.25, height: 1.3, width: w / 2 + 0.1 });
  if (prefer) s = s.filter(q => q.side === prefer).concat(s.filter(q => q.side !== prefer));
  const q = s.find(q => q.u > q.lo + w / 2 + 0.3 && q.u < q.hi - w / 2 - 0.3) || s[0]; if (!q) return null;
  return { x: q.x + q.nx * 0.1, z: q.z + q.nz * 0.1, nx: q.nx, nz: q.nz, yaw: Math.atan2(q.nx, q.nz), y: r.y, room: r };
}
// A flat picture on a wall (or a table), with a close look from in front of it.
function panel(k, at, w, h, y0, tex, o = {}) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: 0xffffff, emissiveIntensity: o.glow ?? 0.15, roughness: 0.7 }));
  m.position.set(at.x, at.y + y0 + h / 2, at.z); m.rotation.y = at.yaw; k.group.add(m); return m;
}
const closeLook = (at, y, d = 0.9) => ({ at: { x: at.x + at.nx * d, y: at.y + y + 0.05, z: at.z + at.nz * d }, look: { x: at.x, y: at.y + y, z: at.z } });

// ================================================================ X-ray room: under the paint
// A light box low on the wall with a film clipped to it. Pull up and it flickers on: a lady in a hat, and under her, as
// X-rays show what a painter painted out, a guitar, a glass, and an eye in a ring on the floor before them.
function xrayTex() {
  return canvasTex(512, 400, (g, W, H) => {
    const R = rnd(42);
    const grd = g.createRadialGradient(W / 2, H / 2, 40, W / 2, H / 2, 320); grd.addColorStop(0, '#5b6a73'); grd.addColorStop(1, '#141a1e'); g.fillStyle = grd; g.fillRect(0, 0, W, H);
    // what was painted first, faint and white
    g.strokeStyle = 'rgba(235,245,250,.5)'; g.fillStyle = 'rgba(235,245,250,.18)'; g.lineWidth = 5;
    g.beginPath(); g.arc(250, 270, 80, 0, TAU); g.arc(250, 160, 60, 0, TAU); g.fill(); g.beginPath(); g.arc(250, 270, 80, 0, TAU); g.stroke(); g.beginPath(); g.arc(250, 160, 60, 0, TAU); g.stroke();
    g.beginPath(); g.arc(254, 215, 22, 0, TAU); g.stroke(); g.save(); g.translate(250, 160); g.rotate(-0.42); g.strokeRect(-11, -170, 22, 150); g.restore();
    g.beginPath(); g.moveTo(350, 120); g.quadraticCurveTo(356, 190, 385, 196); g.quadraticCurveTo(414, 190, 420, 120); g.stroke(); g.beginPath(); g.moveTo(385, 196); g.lineTo(385, 250); g.stroke();
    g.beginPath(); g.ellipse(250, 360, 46, 16, 0, 0, TAU); g.stroke(); g.beginPath(); g.moveTo(220, 360); g.quadraticCurveTo(250, 346, 280, 360); g.quadraticCurveTo(250, 374, 220, 360); g.stroke();
    // what is painted over it: a lady in a hat, in denser white
    g.fillStyle = 'rgba(245,250,252,.55)'; g.beginPath(); g.ellipse(160, 150, 46, 58, 0.1, 0, TAU); g.fill();
    g.beginPath(); g.ellipse(160, 96, 92, 22, 0.08, 0, TAU); g.fill(); g.beginPath(); g.moveTo(90, 400); g.quadraticCurveTo(110, 230, 160, 212); g.quadraticCurveTo(220, 230, 240, 400); g.fill();
    for (let i = 0; i < 9000; i++) { g.fillStyle = `rgba(255,255,255,${R() * 0.05})`; g.fillRect(R() * W, R() * H, 1, 1); }
    // the stretcher and its nails, the film's edge, a pencilled number
    g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 10; g.strokeRect(14, 14, W - 28, H - 28);
    g.fillStyle = 'rgba(255,255,255,.9)'; for (let i = 0; i < 14; i++) { g.fillRect(14 + i * 35, 10, 4, 8); g.fillRect(14 + i * 35, H - 18, 4, 8); }
    g.fillStyle = '#e8e2c8'; g.font = 'bold 26px "Courier New", monospace'; g.fillText('391', W - 90, H - 34);
  });
}
feature({
  id: 'l3xray',
  secrets: [['l3xray', 'Under the paint']],
  init(k) {
    const at = onWall(k, 'B3-42', { w: 1.0, h: 0.8 }); if (!at) return;
    const frame = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.92, 0.07), std(0xd8dcdc, { roughness: 0.4 })); frame.position.set(at.x + at.nx * 0.0, at.y + 0.35 + 0.46, at.z + at.nz * 0.0); frame.rotation.y = at.yaw; k.group.add(frame);
    const film = panel(k, { ...at, x: at.x + at.nx * 0.037, z: at.z + at.nz * 0.037 }, 1.0, 0.8, 0.41, xrayTex(), { glow: 0.03 });
    film.material.color.setScalar(0.25);
    for (const s of [-0.3, 0.3]) { const clip = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.03, 0.02), metal(0x888c90)); clip.position.set(at.x + at.nx * 0.05 + at.nz * s, at.y + 1.2, at.z + at.nz * 0.05 - at.nx * s); clip.rotation.y = at.yaw; k.group.add(clip); }
    block(k, at.x, at.z, Math.abs(at.nz) * 0.56 + 0.04, Math.abs(at.nx) * 0.56 + 0.04, at.y + 0.3, at.y + 1.3);
    Object.assign(this, { at, film, on: 0, look: closeLook(at, 0.81, 1.1) });
  },
  near(v, k) { return this.at && k.close({ x: this.at.x + this.at.nx * 0.6, y: this.at.y, z: this.at.z + this.at.nz * 0.6 }, 0.9, 0.6) ? { verb: 'LOOK', hint: 'An X-ray on a light box. E to look.', act: () => { this.on = 6; k.synth.noise(0.4, { vol: 0.02, lp: 6000 }); if (k.find('l3xray')) setTimeout(() => k.callout('UNDER THE PAINT'), 1500); } } : null; },
  active(k) { return !!this.at && (this.on > 0 || k.inRoom('B3-42', 0.5)); },
  update(dt, k) {
    if (this.on <= 0) { this.film.material.emissiveIntensity = 0.03; return; }
    this.on -= dt; const t = 6 - this.on, flick = t < 0.6 ? (Math.sin(t * 60) > 0 ? 1 : 0.2) : 1;
    this.film.material.emissiveIntensity = 1.1 * flick; this.film.material.color.setScalar(0.25 + 0.5 * flick);
    if (k.close(this.at, 2.2, 1)) k.camClose = this.look; else this.on = 0;
  },
  spots() { return this.at ? [{ kind: 'secret', id: 'l3xray', name: 'Under the paint (the X-ray light box)', x: this.at.x, y: this.at.y, z: this.at.z }] : []; },
});

// ================================================================ paper conservation: the light table
// A light table tilted up like a drawing board, slides laid out on it: seven coloured shapes, a black-and-white grid with a
// red square and a yellow one, and seven white dots in the shape of a saucepan.
function slidesTex() {
  return canvasTex(640, 400, (g, W, H) => {
    g.fillStyle = '#f4f6f2'; g.fillRect(0, 0, W, H);
    const slide = (x, y, draw) => { g.fillStyle = '#e9e4d6'; g.fillRect(x, y, 120, 120); g.fillStyle = '#c8c0aa'; g.fillRect(x + 4, y + 4, 112, 112); g.save(); g.beginPath(); g.rect(x + 16, y + 24, 88, 72); g.clip(); g.fillStyle = '#fbfbf6'; g.fillRect(x + 16, y + 24, 88, 72); draw(x + 60, y + 60); g.restore(); };
    const cols = ['#f2c31b', '#23409c', '#d2321f', '#2f8a55', '#141414', '#888', '#e0642a'];
    cols.forEach((c, i) => slide(20 + (i % 5) * 124, 16 + Math.floor(i / 5) * 128, (cx, cy) => {
      g.fillStyle = c;
      if (i === 0 || i === 1) { g.beginPath(); g.arc(cx, cy, 24, 0, TAU); g.fill(); }
      else if (i === 2) { g.beginPath(); g.moveTo(cx - 26, cy + 18); g.lineTo(cx + 26, cy + 18); g.lineTo(cx + 4, cy - 24); g.fill(); }
      else if (i === 3) { g.save(); g.translate(cx, cy); g.rotate(0.35); g.fillRect(-20, -20, 40, 40); g.restore(); }
      else if (i === 4) { g.strokeStyle = c; g.lineWidth = 4; g.beginPath(); for (let t = 0; t <= 40; t++) g.lineTo(cx - 36 + t * 1.8, cy + Math.sin(t / 40 * TAU * 1.5) * 12); g.stroke(); }
      else if (i === 5) { for (let a = 0; a < 4; a++) for (let b = 0; b < 4; b++) { g.fillStyle = (a + b) % 2 ? '#141414' : '#f1ead8'; g.fillRect(cx - 24 + a * 12, cy - 24 + b * 12, 12, 12); } }
      else { g.beginPath(); g.arc(cx, cy, 24, -1.9, 1.9); g.arc(cx + 10, cy, 20, 1.9, -1.9, true); g.fill(); }
    }));
    slide(20 + 2 * 124, 144, (cx, cy) => { g.fillStyle = '#eeebe1'; g.fillRect(cx - 44, cy - 36, 88, 72); g.fillStyle = '#141414'; g.fillRect(cx - 40, cy - 3, 60, 6); g.fillRect(cx + 17, cy - 3, 6, 30); g.fillRect(cx - 10, cy + 24, 50, 6); g.fillStyle = '#c8261d'; g.fillRect(cx - 44, cy - 8, 8, 16); g.fillStyle = '#f0c419'; g.fillRect(cx + 36, cy + 20, 8, 14); });
    slide(20 + 3 * 124, 144, (cx, cy) => { g.fillStyle = '#0d1430'; g.fillRect(cx - 44, cy - 36, 88, 72); const D = [[0, 0.3], [1, 0], [2, 0.05], [3, 0.2], [3.1, 1.1], [4.4, 1.2], [4.5, 0.25]]; g.fillStyle = '#fff7d0'; for (const [a, b] of D) { g.beginPath(); g.arc(cx - 36 + a * 16, cy + 14 - b * 22, 3, 0, TAU); g.fill(); } });
    g.fillStyle = '#2a2a2a'; g.font = '15px "Courier New", monospace'; g.fillText('392 · 393 · 398', 30, H - 22);
    const loupe = g.createRadialGradient(560, 300, 10, 560, 300, 46); loupe.addColorStop(0, 'rgba(255,255,255,0)'); loupe.addColorStop(0.85, 'rgba(255,255,255,.1)'); loupe.addColorStop(1, 'rgba(30,30,30,.9)'); g.fillStyle = loupe; g.beginPath(); g.arc(560, 300, 46, 0, TAU); g.fill();
  });
}
feature({
  id: 'l3slides',
  init(k) {
    const s = spot(k, 'B3-45', 0.55, 0.5, 0.75, 1.2); if (!s) return;
    const r = s.room, yaw = -Math.PI / 2, g = new THREE.Group(); g.position.set(s.x, r.y, s.z); g.rotation.y = yaw; k.group.add(g);      // its face to the west, the corridor side
    const W = 1.1, H = 0.7, tilt = -0.62, cy = 0.5;
    const board = new THREE.Group(); board.position.set(0, cy, 0); board.rotation.x = tilt; g.add(board);
    const box = new THREE.Mesh(new THREE.BoxGeometry(W + 0.08, H + 0.08, 0.07), std(0xd9d6cc)); box.position.z = -0.04; board.add(box);
    const lit = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshBasicMaterial({ map: slidesTex(), toneMapped: false })); lit.position.z = 0.0; board.add(lit);
    const lip = new THREE.Mesh(new THREE.BoxGeometry(W + 0.08, 0.03, 0.05), std(0x9a968c)); lip.position.set(0, -H / 2 - 0.04, 0.02); board.add(lip);
    for (const sx of [-1, 1]) { const leg = new THREE.Mesh(new THREE.BoxGeometry(0.04, cy + 0.2, 0.04), metal(0x55595e)); leg.position.set(sx * (W / 2 - 0.05), (cy + 0.2) / 2, -0.25); g.add(leg); const foot = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.03, 0.6), metal(0x55595e)); foot.position.set(sx * (W / 2 - 0.05), 0.015, -0.1); g.add(foot); }
    const gl = glow(1.6, 0xf4f6ff, 0.16, false); gl.position.set(0, cy + 0.1, 0.3); g.add(gl);
    block(k, s.x, s.z, 0.32, W / 2 + 0.05, r.y, r.y + cy + 0.3);
    const fx = -1, fz = 0;      // the way it faces, in the world
    Object.assign(this, { at: { x: s.x, y: r.y, z: s.z }, look: { at: { x: s.x + fx * 0.95, y: r.y + cy + 0.45, z: s.z }, look: { x: s.x, y: r.y + cy, z: s.z } }, front: { x: s.x + fx * 0.7, y: r.y, z: s.z + fz }, t: 0 });
  },
  near(v, k) { return this.at && k.close(this.front, 0.8, 0.6) ? { verb: 'LOOK', hint: 'Slides on a light table. E to look.', act: () => { this.t = 6; } } : null; },
  active(k) { return !!this.at && (this.t > 0 || k.inRoom('B3-45', 0.5)); },
  update(dt, k) { if (this.t <= 0) return; this.t -= dt; if (k.close(this.front, 1.6, 1)) k.camClose = this.look; else this.t = 0; },
});

// ================================================================ conservators' office: the birthday cake
// On a trolley in the aisle: a cake with six candles. Drive past fast enough and the wind of it puts them out.
// The song is older than anyone thinks: Good Morning to All, Mildred and Patty Hill, 1893.
const HILL = 'G4:.75 G4:.25 | A4 G4 C5 | B4:2 G4:.75 G4:.25 | A4 G4 D5 | C5:2 G4:.75 G4:.25 | G5 E5 C5 | B4 A4 F5:.75 F5:.25 | E5 C5 D5 | C5:2';
feature({
  id: 'l3cake',
  secrets: [['l3cake', 'Blow out the candles']],
  init(k) {
    const s = spot(k, 'B3-47', 0.55, 0.5, 0.45, 1.2) || spot(k, 'B3-47', 0.3, 0.5, 0.4, 1.0); if (!s) return;
    const r = s.room, g = new THREE.Group(); g.position.set(s.x, r.y, s.z); k.group.add(g);
    const steel = metal(0xb0b5ba, { roughness: 0.35 });
    for (const yy of [0.1, 0.42]) { const sh = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.02, 0.42), steel); sh.position.y = yy; g.add(sh); }
    for (const [sx, sz] of [[-0.28, -0.19], [0.28, -0.19], [-0.28, 0.19], [0.28, 0.19]]) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.42, 6), steel); l.position.set(sx, 0.23, sz); g.add(l); const w = new THREE.Mesh(new THREE.TorusGeometry(0.02, 0.008, 6, 12), std(0x222222)); w.position.set(sx, 0.02, sz); g.add(w); }
    const icing = std(0xfbf4ea, { roughness: 0.55 }), pink = std(0xe58aa8, { roughness: 0.5 });
    const cake = new THREE.Mesh(lathe([[0, 0], [0.16, 0], [0.165, 0.01], [0.165, 0.1], [0.16, 0.11], [0.0, 0.11]], 40), icing); cake.position.y = 0.43; g.add(cake);
    const tier = new THREE.Mesh(lathe([[0, 0], [0.1, 0], [0.105, 0.01], [0.105, 0.07], [0.1, 0.075], [0, 0.075]], 36), icing); tier.position.y = 0.54; g.add(tier);
    for (const [rr, yy, n] of [[0.165, 0.435, 22], [0.105, 0.545, 16]]) for (let i = 0; i < n; i++) { const a = i / n * TAU, b = new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 5), pink); b.position.set(Math.cos(a) * rr, yy, Math.sin(a) * rr); g.add(b); }
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.008, 32), std(0xd8d8d8)); plate.position.y = 0.434; g.add(plate);
    this.candles = [];
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * TAU, cx = Math.cos(a) * 0.065, cz = Math.sin(a) * 0.065;
      const c = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.07, 8), std([0x6aa0e0, 0xf0c040, 0xe06a8a][i % 3])); c.position.set(cx, 0.65, cz); g.add(c);
      const f = glow(0.09, 0xffc060, 0.95); f.position.set(cx, 0.695, cz); g.add(f);
      const core = new THREE.Mesh(new THREE.SphereGeometry(0.007, 6, 5), glowMat(0xfff0c0)); core.scale.y = 1.8; core.position.set(cx, 0.693, cz); g.add(core);
      this.candles.push({ f, core, lit: true, x: s.x + cx, z: s.z + cz });
    }
    const card = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.08), new THREE.MeshStandardMaterial({ map: canvasTex(128, 84, c => { c.fillStyle = '#fbf6e8'; c.fillRect(0, 0, 128, 84); c.fillStyle = '#b3242b'; c.font = 'italic 19px Georgia, serif'; c.textAlign = 'center'; c.fillText('Happy birthday', 64, 34); c.fillText('Ruth', 64, 60); }), emissive: 0xffffff, emissiveIntensity: 0.15, side: THREE.DoubleSide }));
    card.position.set(0.22, 0.47, 0.08); card.rotation.set(-0.2, 0.8, 0); g.add(card);
    block(k, s.x, s.z, 0.31, 0.22, r.y, r.y + 0.72);
    this.smoke = []; for (let i = 0; i < 6; i++) { const m = glow(0.12, 0x9a9a9a, 0); g.add(m); this.smoke.push({ m, t: 1 }); }
    Object.assign(this, { at: { x: s.x, y: r.y, z: s.z }, g, out: 0 });
  },
  active(k) { return !!this.candles && k.inRoom('B3-47', 0.5); },
  update(dt, k) {
    if (k.close(this.at, 3)) once(k, 'cake', 'A birthday cake. Nobody blew the candles out.', 4);
    const p = k.pos, v = k.v, sp = Math.hypot(v.vel.x, v.vel.z), t = performance.now() / 1000;
    this.candles.forEach((c, i) => {
      if (c.lit) {
        const d = Math.hypot(p.x - c.x, p.z - c.z), s = 1 + Math.sin(t * 13 + i * 2) * 0.12 + (d < 1.2 && sp > 1 ? Math.sin(t * 40) * 0.25 : 0);
        c.f.scale.setScalar(s); c.core.scale.set(1, 1.8 * s, 1);
        if (d < 0.75 && sp > 2.4) { c.lit = false; c.f.visible = c.core.visible = false; const sm = this.smoke[i]; sm.t = 0; sm.m.position.set(c.x - this.at.x, 0.72, c.z - this.at.z); k.synth.noise(0.15, { vol: 0.03, lp: 1500 }); if (this.candles.every(q => !q.lit)) { k.tune(HILL, { bpm: 110, type: 'triangle', vol: 0.07, at: 0.4 }); if (k.find('l3cake')) k.callout('BLOW OUT THE CANDLES'); } }
      }
    });
    for (const s of this.smoke) { if (s.t >= 1) continue; s.t = Math.min(1, s.t + dt / 2.5); s.m.position.y += dt * 0.12; s.m.material.opacity = 0.35 * (1 - s.t); s.m.scale.setScalar(1 + s.t * 2); }
  },
  reset() { if (!this.candles) return; for (const c of this.candles) { c.lit = true; c.f.visible = c.core.visible = true; } },
  spots() { return this.at ? [{ kind: 'secret', id: 'l3cake', name: 'Blow out the candles (drive past fast)', ...this.at }] : []; },
});

// ================================================================ conservation records: the fax
// On a low cabinet. Come near and it wakes, warbles and prints a page.
function faxTex() {
  return canvasTex(256, 360, (g, W, H) => {
    g.fillStyle = '#f7f5ee'; g.fillRect(0, 0, W, H); g.fillStyle = '#1a1a1a';
    g.font = 'bold 22px "Courier New", monospace'; g.fillText('TERZO PIANO', 24, 46); g.font = '16px "Courier New", monospace';
    g.fillText('TAVOLO PER DUE', 24, 92); g.fillText('ORE 23:00', 24, 120); g.font = 'bold 30px "Courier New", monospace'; g.fillText('CALDO!', 24, 180);
    g.font = '13px "Courier New", monospace'; g.fillText('suonate il campanello', 24, 230); g.fillText('al passe', 24, 250);
    g.fillStyle = 'rgba(0,0,0,.15)'; for (let y = 0; y < H; y += 3) g.fillRect(0, y, W, 1);
  });
}
feature({
  id: 'l3fax',
  init(k) {
    const s = spot(k, 'B3-49', 0.45, 0.5, 0.4, 1.2); if (!s) return;
    const r = s.room, g = new THREE.Group(); g.position.set(s.x, r.y, s.z); g.rotation.y = Math.PI / 2; k.group.add(g);
    const cab = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.45, 0.45), std(0x6d747a, { roughness: 0.5 })); cab.position.y = 0.225; g.add(cab);
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.1, 0.3), std(0xe2ddd2, { roughness: 0.5 })); body.position.y = 0.5; g.add(body);
    const keys = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.012, 0.1), std(0x333333)); keys.position.set(0.1, 0.556, 0.05); g.add(keys);
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 0.03), glowMat(0x7ab07a)); screen.rotation.x = -Math.PI / 2; screen.position.set(0.1, 0.557, -0.04); g.add(screen);
    const tray = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.006, 0.12), std(0x444444)); tray.position.set(-0.04, 0.56, -0.18); tray.rotation.x = 0.5; g.add(tray);
    const page = new THREE.Mesh(new THREE.PlaneGeometry(0.21, 0.29), new THREE.MeshStandardMaterial({ map: faxTex(), emissive: 0xffffff, emissiveIntensity: 0.45, side: THREE.DoubleSide }));
    const pivot = new THREE.Group(); pivot.position.set(-0.04, 0.52, 0.16); g.add(pivot); page.position.set(0, -0.145, 0); pivot.add(page); pivot.rotation.x = -1.2; pivot.scale.set(1, 0.001, 1);
    block(k, s.x, s.z, 0.24, 0.27, r.y, r.y + 0.56);
    Object.assign(this, { at: { x: s.x, y: r.y, z: s.z }, pivot, screen, t: -1, look: { at: { x: s.x + 0.62, y: r.y + 0.62, z: s.z - 0.04 }, look: { x: s.x + 0.2, y: r.y + 0.38, z: s.z - 0.04 } }, view: 0 });
  },
  near(v, k) { return this.at && this.t >= 3 && k.close(this.at, 1.2, 0.6) ? { verb: 'READ', hint: 'A fax. E to read it.', act: () => { this.view = 5; } } : null; },
  active(k) { return !!this.at && k.inRoom('B3-49', 0.5); },
  update(dt, k) {
    if (this.t < 0 && k.close(this.at, 2.2)) { this.t = 0; for (let i = 0; i < 6; i++) k.synth.note([1300, 2100, 1700, 2400, 1100, 1900][i], 0.12, { type: 'square', vol: 0.02, at: i * 0.13 }); k.synth.noise(1.6, { vol: 0.015, lp: 3000, at: 0.9 }); }
    if (this.t >= 0 && this.t < 3) { this.t += dt; const f = ease(Math.max(0, (this.t - 0.9) / 2)); this.pivot.scale.y = Math.max(0.001, f); this.pivot.rotation.x = -1.2 + f * 0.7; }
    if (this.view > 0) { this.view -= dt; if (k.close(this.at, 2, 1)) k.camClose = this.look; else this.view = 0; }
  },
  reset() { if (!this.at) return; this.t = -1; this.pivot.scale.y = 0.001; this.pivot.rotation.x = -1.2; },
});

// ================================================================ frame conservation: an empty frame to drive through
feature({
  id: 'l3frame',
  init(k) {
    const s = spot(k, 'B3-48', 0.5, 0.5, 0.8, 1.2); if (!s) return;
    const r = s.room, W = 1.3, H = 1.0, g = new THREE.Group(); g.position.set(s.x, r.y, s.z); k.group.add(g);       // stands across the room, its opening along x
    const sh = new THREE.Shape(); sh.moveTo(-W / 2 - 0.12, 0); sh.lineTo(W / 2 + 0.12, 0); sh.lineTo(W / 2 + 0.12, H + 0.12); sh.lineTo(-W / 2 - 0.12, H + 0.12); sh.closePath();
    const hole = new THREE.Path(); hole.moveTo(-W / 2, 0.0); hole.lineTo(-W / 2, H); hole.lineTo(W / 2, H); hole.lineTo(W / 2, 0.0); hole.closePath(); sh.holes.push(hole);
    const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.07, bevelEnabled: true, bevelSize: 0.025, bevelThickness: 0.03, bevelSegments: 3 }); geo.translate(0, 0, -0.035);
    const gilt = metal(0xc79a3e, { roughness: 0.35, emissiveIntensity: 0.3 }), frame = new THREE.Mesh(geo, gilt); frame.rotation.y = Math.PI / 2; g.add(frame);
    for (const sz of [-1, 1]) { const foot = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.05, 0.08), std(0x5a3a22)); foot.position.set(0, 0.025, sz * (W / 2 + 0.06)); g.add(foot); block(k, s.x, s.z + sz * (W / 2 + 0.06), 0.2, 0.08, r.y, r.y + H + 0.12); }
    Object.assign(this, { x: s.x, z: s.z, W, frame, side: 0, flash: 0 });
  },
  active(k) { return this.x != null && k.inRoom('B3-48', 0.5); },
  update(dt, k) {
    const p = k.pos, n = p.x - this.x, side = Math.sign(n) || 1;
    if (this.side && side !== this.side && Math.abs(p.z - this.z) < this.W / 2 - 0.1) { this.flash = 1; k.synth.note(1760, 0.08, { type: 'square', vol: 0.025 }); k.synth.chime([523, 784], { gap: 0.1, vol: 0.04 }); }
    this.side = Math.abs(n) < 1 ? side : 0;
    this.flash = Math.max(0, this.flash - dt * 2); this.frame.material.emissiveIntensity = 0.3 + this.flash * 1.5;
  },
});

// ================================================================ the corridor: a notice board, a water cooler, a coat rack
function boardTex() {
  return canvasTex(512, 320, (g, W, H) => {
    const R = rnd(54); g.fillStyle = '#9a7a52'; g.fillRect(0, 0, W, H); for (let i = 0; i < 4000; i++) { g.fillStyle = `rgba(${R() < 0.5 ? '60,40,20' : '200,170,120'},.25)`; g.fillRect(R() * W, R() * H, 2, 2); }
    g.strokeStyle = '#d8d0c0'; g.lineWidth = 14; g.strokeRect(7, 7, W - 14, H - 14);
    const card = (x, y, w, h, rot, fill, lines, font = '18px "Courier New", monospace', ink = '#1d1d1d') => { g.save(); g.translate(x, y); g.rotate(rot); g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(-w / 2 + 4, -h / 2 + 4, w, h); g.fillStyle = fill; g.fillRect(-w / 2, -h / 2, w, h); g.fillStyle = ink; g.font = font; lines.forEach((l, i) => g.fillText(l, -w / 2 + 12, -h / 2 + 30 + i * 26)); g.fillStyle = '#c0302a'; g.beginPath(); g.arc(0, -h / 2 + 8, 6, 0, TAU); g.fill(); g.restore(); };
    card(120, 100, 190, 120, -0.05, '#fff7a8', ['G389 corridor', 'record 3.62 s', 'beat it!']);
    card(330, 92, 170, 110, 0.06, '#f4f4f0', ['SNOW ON THE', 'TERRACE: roll', 'it, stack it']);
    card(410, 230, 150, 110, -0.08, '#c8e6f4', ['395: go', 'round it', 'three times']);
    card(170, 240, 200, 100, 0.04, '#f6d2dc', ['Ruth\'s cake', '3:30, office', 'DON\'T BE LATE']);
  });
}
feature({
  id: 'l3corridor',
  init(k) {
    const r = k.plan.byId['B3-54']; if (!r) return;
    const y = r.y, wx = r.x0 + 0.1, doorsAt = k.plan.doorsOf('B3-54').map(d => (d.z0 + d.z1) / 2);
    const clear = z => !doorsAt.some(d => Math.abs(d - z) < 1.3);
    const pick = z => { for (let dz = 0; dz < 6; dz += 0.3) for (const s of [1, -1]) if (clear(z + s * dz)) return z + s * dz; return z; };
    // the notice board, near the lift end
    const bz = pick(r.z0 + 12), board = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.62), new THREE.MeshStandardMaterial({ map: boardTex(), emissive: 0xffffff, emissiveMap: null, emissiveIntensity: 0.0, roughness: 0.8 }));
    board.material.emissiveMap = board.material.map; board.material.emissiveIntensity = 0.18;
    board.position.set(wx + 0.02, y + 0.35 + 0.31, bz); board.rotation.y = Math.PI / 2; k.group.add(board);
    this.board = { x: wx, y, z: bz, nx: 1, nz: 0, yaw: Math.PI / 2 };
    // the water cooler: drive into it and it glugs
    const cz = pick(r.z0 + 38), cool = new THREE.Group(); cool.position.set(wx + 0.2, y, cz); k.group.add(cool);
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.95, 0.3), std(0xe8e8e4, { roughness: 0.5 })); body.position.y = 0.475; cool.add(body);
    const tap = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.04, 0.05), std(0x2f6fd0)); tap.position.set(0.17, 0.75, -0.05); cool.add(tap);
    const tap2 = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.04, 0.05), std(0xd0302a)); tap2.position.set(0.17, 0.75, 0.05); cool.add(tap2);
    const bottle = new THREE.Mesh(lathe([[0.03, 0], [0.05, 0.03], [0.13, 0.08], [0.13, 0.38], [0.11, 0.42], [0, 0.43]], 24), new THREE.MeshStandardMaterial({ color: 0x8cc4f0, transparent: true, opacity: 0.55, roughness: 0.05, emissive: 0x2a5a8a, emissiveIntensity: 0.5, depthWrite: false }));
    bottle.rotation.x = Math.PI; bottle.position.y = 0.95 + 0.43; cool.add(bottle);
    this.bubbles = []; for (let i = 0; i < 6; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.012 + i * 0.002, 8, 6), new THREE.MeshBasicMaterial({ color: 0xdff2ff, transparent: true, opacity: 0.8 })); b.visible = false; cool.add(b); this.bubbles.push({ b, t: 1 }); }
    block(k, wx + 0.2, cz, 0.17, 0.17, y, y + 1.4);
    // the coat rack: a turned pole, hooks, two coats and a scarf; it rocks when bumped
    const rz = pick(r.z0 + 66), rack = new THREE.Group(); rack.position.set(wx + 0.3, y, rz); k.group.add(rack);
    const wood = std(0x6a4528, { roughness: 0.55 }), sway = new THREE.Group(); rack.add(sway);
    sway.add(new THREE.Mesh(lathe([[0.2, 0], [0.2, 0.03], [0.04, 0.06], [0.025, 0.1], [0.022, 1.7], [0.04, 1.74], [0.03, 1.8], [0, 1.82]], 18), wood));
    for (let i = 0; i < 4; i++) { const a = i / 4 * TAU, h = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.16, 6), wood); h.position.set(Math.cos(a) * 0.06, 1.66, Math.sin(a) * 0.06); h.rotation.set(Math.sin(a) * 0.9, 0, -Math.cos(a) * 0.9); sway.add(h); }
    const coat = (a, color, len) => { const c = new THREE.Mesh(lathe([[0.03, 0], [0.13, -0.08], [0.17, -0.3], [0.2, -len], [0.0, -len]], 14), std(color, { roughness: 0.9, side: THREE.DoubleSide })); c.scale.z = 0.6; c.position.set(Math.cos(a) * 0.12, 1.68, Math.sin(a) * 0.12); c.rotation.y = -a; sway.add(c); };
    coat(0.4, 0x3a4a5a, 1.0); coat(2.8, 0x8a3a2a, 0.85);
    const scarf = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.025, 6, 16), std(0xe0b030)); scarf.position.set(0, 1.62, 0); scarf.rotation.x = Math.PI / 2; sway.add(scarf);
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.5, 0.02), std(0xe0b030)); tail.position.set(0.07, 1.36, 0.03); sway.add(tail);
    block(k, wx + 0.3, rz, 0.2, 0.2, y, y + 1.8);
    Object.assign(this, { y, cooler: { x: wx + 0.2, z: cz, v: 0 }, rack: { x: wx + 0.3, z: rz, g: sway, a: 0, va: 0 }, view: 0, look: closeLook(this.board, 0.66, 0.85) });
  },
  near(v, k) { return this.board && k.close({ x: this.board.x + 0.6, y: this.y, z: this.board.z }, 0.7, 0.6) ? { verb: 'READ', hint: 'A notice board. E to read it.', act: () => { this.view = 6; } } : null; },
  active(k) { return !!this.board && k.inRoom('B3-54', 0.3); },
  update(dt, k) {
    const p = k.pos, v = k.v, sp = Math.hypot(v.vel.x, v.vel.z);
    if (this.view > 0) { this.view -= dt; if (k.close(this.board, 1.6, 1)) k.camClose = this.look; else this.view = 0; }
    const c = this.cooler;
    if (Math.hypot(p.x - c.x, p.z - c.z) < 0.5 && sp > 0.6 && c.v <= 0) { c.v = 2; for (let i = 0; i < 4; i++) k.synth.note(180 + Math.random() * 120, 0.12, { type: 'sine', vol: 0.06, at: i * 0.18 }); this.bubbles.forEach((b, i) => { b.t = -i * 0.25; }); }
    c.v -= dt;
    for (const b of this.bubbles) { if (b.t >= 1) { b.b.visible = false; continue; } b.t += dt * 0.9; b.b.visible = b.t > 0; b.b.position.set(Math.sin(b.t * 9) * 0.02, 1.0 + Math.max(0, b.t) * 0.36, 0); }
    const R = this.rack, d = Math.hypot(p.x - R.x, p.z - R.z);
    if (d < 0.45 && sp > 0.5 && Math.abs(R.va) < 0.2) { R.va = Math.min(1.2, sp * 0.3); k.synth.note(150, 0.2, { type: 'triangle', vol: 0.05 }); }
    R.va += -R.a * 30 * dt; R.va *= Math.exp(-dt * 1.5); R.a += R.va * dt; R.g.rotation.z = R.a * 0.12;
  },
});

// ================================================================ the lab at the end: flasks that bubble
feature({
  id: 'l3flasks',
  init(k) {
    const s = spot(k, 'B3-53', 0.5, 0.5, 0.45, 1.2) || spot(k, 'B3-52', 0.5, 0.5, 0.45, 1.2); if (!s) return;
    const r = s.room, g = new THREE.Group(); g.position.set(s.x, r.y, s.z); k.group.add(g);
    const steel = metal(0xa8adb2, { roughness: 0.35 });
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.03, 0.4), steel); shelf.position.y = 0.32; g.add(shelf);
    for (const [sx, sz] of [[-0.33, -0.18], [0.33, -0.18], [-0.33, 0.18], [0.33, 0.18]]) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.32, 6), steel); l.position.set(sx, 0.16, sz); g.add(l); }
    const glass = new THREE.MeshStandardMaterial({ color: 0xdff0f4, transparent: true, opacity: 0.3, roughness: 0.05, depthWrite: false, side: THREE.DoubleSide });
    this.flasks = [[-0.2, 0x3ad06a], [0.02, 0x3a8ae0], [0.22, 0xe04aa0]].map(([fx, col], i) => {
      const prof = i === 1 ? [[0.0, 0], [0.09, 0.005], [0.1, 0.05], [0.04, 0.17], [0.025, 0.2], [0.025, 0.3]] : [[0.0, 0], [0.07, 0.01], [0.075, 0.08], [0.06, 0.13], [0.025, 0.16], [0.022, 0.25]];
      const f = new THREE.Mesh(lathe(prof, 20), glass); f.position.set(fx, 0.335, 0); g.add(f);
      const liq = new THREE.Mesh(lathe(prof.slice(0, 3).map(([a, b]) => [a * 0.93, b * 0.95]), 20), glowMat(col, { transparent: true, opacity: 0.75 })); liq.position.set(fx, 0.338, 0); g.add(liq);
      const gl = glow(0.4, col, 0.35); gl.position.set(fx, 0.4, 0); g.add(gl);
      const bub = []; for (let j = 0; j < 4; j++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.008, 6, 5), glowMat(0xffffff, { transparent: true, opacity: 0.8 })); g.add(b); bub.push({ b, t: Math.random() }); }
      return { fx, gl, bub, col };
    });
    block(k, s.x, s.z, 0.36, 0.21, r.y, r.y + 0.6);
    Object.assign(this, { at: { x: s.x, y: r.y, z: s.z }, room: r.id, boil: 0 });
  },
  active(k) { return !!this.flasks && k.inRoom(this.room, 0.5); },
  update(dt, k) {
    const p = k.pos, sp = Math.hypot(k.v.vel.x, k.v.vel.z);
    if (Math.hypot(p.x - this.at.x, p.z - this.at.z) < 0.55 && sp > 0.5 && this.boil < 0.5) { this.boil = 3; for (let i = 0; i < 5; i++) k.synth.note(500 + Math.random() * 500, 0.08, { type: 'sine', vol: 0.04, at: i * 0.09 }); }
    this.boil = Math.max(0, this.boil - dt); const rate = 0.4 + this.boil * 1.4;
    for (const f of this.flasks) { f.gl.material.opacity = 0.3 + this.boil * 0.12; for (const b of f.bub) { b.t += dt * rate; if (b.t > 1) b.t -= 1; b.b.position.set(f.fx + Math.sin(b.t * 20 + f.fx * 9) * 0.015, 0.36 + b.t * 0.16, Math.cos(b.t * 17) * 0.012); } }
  },
});
