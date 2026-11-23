// The Rice Building's roofs (rooftops.js has the rest). A board across the gap from the end of the bridge, so a car
// can come over; a rink on the roof of Gallery 161, beside the room where George Bellows's Love of Winter (1914)
// hangs, with the picture itself by the boards; a roof garden asleep under the snow, and the museum's beehives,
// wrapped for the winter; and snow to clear off the solar panels, which light the rink when they are clean.
import * as THREE from 'three';
import { feature } from './features.js';
import { mats, lit, snowCap, canvasTex, bulbs, sag } from './roofkit.js';
import { imageUrl } from './collection.js';
import { keepTrue } from './finish.js';

const near2 = (p, x, z) => (p.x - x) ** 2 + (p.z - z) ** 2;
const rink = { power: false, onPower: null };          // shared: the solar panels switch on the rink's floodlights

// ---------------------------------------------------------------- the board across
// Two scaffold boards and a pair of tube rails over the two-metre gap between the end of the bridge and the Rice
// Building, so a car can drive on round.
feature({
  id: 'roofboard',
  init(k) {
    const x0 = 147.5, x1 = 150.4, z0 = 104.0, z1 = 106.6, a = k.roofAt(147.0, 105.3), b = k.roofAt(151.0, 105.3);
    if (!(a > 12 && a < 13.5 && Math.abs(a - b) < 0.08)) return;
    const y = Math.max(a, b) + 0.005, M = mats(), P = k.parts(), O = k.plan.obstacles;
    k.roofSolid({ skin: 'deck', x0, x1, z0, z1, axis: null, h0: y, h1: y, thick: 0.12 });
    for (let i = 0; i < 2; i++) P.add(new THREE.BoxGeometry(x1 - x0, 0.05, 1.27), M.wood, (x0 + x1) / 2, y - 0.025, z0 + 0.65 + i * 1.3);
    for (const z of [z0 - 0.04, z1 + 0.04]) {
      P.add(new THREE.CylinderGeometry(0.024, 0.024, x1 - x0 + 0.6, 8), M.steel, (x0 + x1) / 2, y + 0.9, z, 0, 0, Math.PI / 2);
      P.add(new THREE.CylinderGeometry(0.024, 0.024, x1 - x0 + 0.6, 8), M.steel, (x0 + x1) / 2, y + 0.45, z, 0, 0, Math.PI / 2);
      for (const x of [x0 - 0.25, x1 + 0.25]) P.add(new THREE.CylinderGeometry(0.026, 0.026, 0.95, 8), M.steel, x, y + 0.47, z);
      O.push({ x0: x0 - 0.3, x1: x1 + 0.3, z0: z - 0.04, z1: z + 0.04, y0: y, y1: y + 0.92 });
    }
    P.add(new THREE.BoxGeometry(x1 - x0, 0.05, 0.14), M.snow, (x0 + x1) / 2, y + 0.0, z0 + 0.07);
    P.done(k.group);
  },
});

// ---------------------------------------------------------------- the rink, and Love of Winter
const RK = { x0: 161.4, x1: 183.4, z0: 162.8, z1: 176.2, cx: 172.4, cz: 169.5 };
feature({
  id: 'roofrink',
  secrets: [['roofrink', 'Love of Winter']],
  init(k) {
    const top = k.roofAt(RK.cx, RK.cz);
    if (!(top > 12 && top < 13.5)) return;
    this.top = top; const M = mats(), P = k.parts(), O = k.plan.obstacles, y = top, W = RK.x1 - RK.x0, D = RK.z1 - RK.z0;
    // The ice: scored by blades, a little blue, taking the light.
    const iceT = canvasTex(256, 256, (g, w, h) => {
      g.fillStyle = '#cfe2f0'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 160; i++) { g.strokeStyle = `rgba(255,255,255,${0.15 + Math.random() * 0.35})`; g.lineWidth = 0.6 + Math.random(); g.beginPath(); const cx = Math.random() * w, cy = Math.random() * h, r = 20 + Math.random() * 120, a = Math.random() * 6; g.arc(cx, cy, r, a, a + 0.3 + Math.random() * 0.8); g.stroke(); }
      for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(120,160,200,${Math.random() * 0.12})`; g.beginPath(); g.ellipse(Math.random() * w, Math.random() * h, 10 + Math.random() * 30, 5 + Math.random() * 12, Math.random() * 3, 0, 7); g.fill(); }
    }, W / 6, D / 6);
    const ice = new THREE.Mesh(new THREE.PlaneGeometry(W, D), new THREE.MeshStandardMaterial({ map: iceT, roughness: 0.12, metalness: 0.25, emissive: 0x6a8aa8, emissiveIntensity: 0.45, emissiveMap: iceT, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
    ice.rotation.x = -Math.PI / 2; ice.position.set(RK.cx, y + 0.008, RK.cz); k.group.add(ice);
    k.plan.ice.push({ x0: RK.x0, x1: RK.x1, z0: RK.z0, z1: RK.z1 });
    // The boards, white with a red cap, open at the west end for a way on.
    const gate = [RK.cz - 1.1, RK.cz + 1.1], H = 0.32, red = M.red, white = lit(0xf2f2ee, { glow: 0.45 });
    const board = (bx0, bx1, bz0, bz1) => { P.add(new THREE.BoxGeometry(bx1 - bx0, H, bz1 - bz0), white, (bx0 + bx1) / 2, y + H / 2, (bz0 + bz1) / 2); P.add(new THREE.BoxGeometry(bx1 - bx0 + 0.02, 0.04, bz1 - bz0 + 0.02), red, (bx0 + bx1) / 2, y + H + 0.02, (bz0 + bz1) / 2); O.push({ x0: bx0, x1: bx1, z0: bz0, z1: bz1, y0: y, y1: y + H + 0.04 }); };
    board(RK.x0 - 0.08, RK.x1 + 0.08, RK.z0 - 0.08, RK.z0); board(RK.x0 - 0.08, RK.x1 + 0.08, RK.z1, RK.z1 + 0.08);
    board(RK.x1, RK.x1 + 0.08, RK.z0, RK.z1); board(RK.x0 - 0.08, RK.x0, RK.z0, gate[0]); board(RK.x0 - 0.08, RK.x0, gate[1], RK.z1);
    // The island in the middle: a little fir in a tub of snow, hung with lights.
    const fir = lit(0x1d4a32, { glow: 0.5 });
    P.add(new THREE.CylinderGeometry(0.75, 0.85, 0.35, 32), M.wood, RK.cx, y + 0.175, RK.cz); P.add(snowCap(1.5, 1.5, 0.12), M.snow, RK.cx, y + 0.35, RK.cz);
    for (const [r, h, yy] of [[0.7, 1.0, 0.75], [0.55, 0.85, 1.25], [0.38, 0.7, 1.7]]) { P.add(new THREE.ConeGeometry(r, h, 24), fir, RK.cx, y + yy, RK.cz); P.add(new THREE.ConeGeometry(r * 0.85, h * 0.3, 24), M.snow, RK.cx, y + yy + h * 0.28, RK.cz); }
    P.add(new THREE.OctahedronGeometry(0.1), M.gilt, RK.cx, y + 2.12, RK.cz);
    O.push({ x0: RK.cx - 0.85, x1: RK.cx + 0.85, z0: RK.cz - 0.85, z1: RK.cz + 0.85, y0: y, y1: y + 2.2 });
    const lights = []; for (let i = 0; i < 26; i++) { const a = i * 1.9, hh = 0.5 + i * 0.055, r = 0.72 - i * 0.022; lights.push([RK.cx + Math.cos(a) * r, y + hh, RK.cz + Math.sin(a) * r]); }
    k.group.add(bulbs(lights, undefined, 0.03));
    // Poles at the corners with a sagging string of bulbs round the rink, and two floodlights the solar panels feed.
    const poles = [[RK.x0 - 0.4, RK.z0 - 0.4], [RK.x1 + 0.4, RK.z0 - 0.4], [RK.x1 + 0.4, RK.z1 + 0.4], [RK.x0 - 0.4, RK.z1 + 0.4]], PH = 3.2, wire = [];
    for (const [px, pz] of poles) { P.add(new THREE.CylinderGeometry(0.04, 0.06, PH, 8), M.dark, px, y + PH / 2, pz); O.push({ x0: px - 0.07, x1: px + 0.07, z0: pz - 0.07, z1: pz + 0.07, y0: y, y1: y + PH }); }
    for (let i = 0; i < 4; i++) { const a = poles[i], b = poles[(i + 1) % 4]; wire.push(...sag([a[0], y + PH - 0.1, a[1]], [b[0], y + PH - 0.1, b[1]], Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 0.8), 0.5).slice(1)); }
    k.group.add(bulbs(wire));
    this.flood = [];
    for (const [px, pz] of [poles[0], poles[2]]) {
      P.add(new THREE.BoxGeometry(0.3, 0.2, 0.18), M.dark, px, y + PH + 0.1, pz);
      const lens = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.15), new THREE.MeshBasicMaterial({ color: 0x222222 })); lens.position.set(px + Math.sign(RK.cx - px) * 0.16, y + PH + 0.1, pz); lens.lookAt(RK.cx, y, RK.cz); k.group.add(lens);
      const beam = new THREE.Mesh(new THREE.ConeGeometry(3.2, 4.6, 20, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff0d0, transparent: true, opacity: 0.0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
      const mid = new THREE.Vector3(px + (RK.cx - px) * 0.42, y + PH / 2, pz + (RK.cz - pz) * 0.42); beam.position.copy(mid); beam.lookAt(px, y + PH + 0.1, pz); beam.rotateX(Math.PI / 2); beam.visible = false; k.group.add(beam);
      this.flood.push({ lens, beam });
    }
    const pool = new THREE.Mesh(new THREE.PlaneGeometry(W, D), new THREE.MeshBasicMaterial({ color: 0xfff2d8, transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }));
    pool.rotation.x = -Math.PI / 2; pool.position.set(RK.cx, y + 0.012, RK.cz); pool.visible = false; k.group.add(pool); this.pool = pool;
    rink.onPower = () => { for (const f of this.flood) { f.lens.material.color.setRGB(2.2, 2.0, 1.6); f.beam.visible = true; f.beam.material.opacity = 0.07; } this.pool.visible = true; };
    if (rink.power) rink.onPower();
    // Love of Winter, on a board on two posts by the south side, facing the ice.
    const isIt = w => w && (w.id === 109780 || /^Love of Winter$/.test(w.t || '')), hung = (k.museum.arts || []).find(a => isIt(a.work));
    let work = hung ? hung.work : null;
    if (!work) for (const r of Object.values((k.G.collection && k.G.collection.rooms) || {})) { work = (r.wall || []).find(isIt) || (r.objects || []).find(isIt); if (work) break; }
    if (work && !work.c) {
      const PW = 2.6, PHh = PW * (work.ih && work.iw ? work.ih / work.iw : 0.79), bx = RK.cx, bz = RK.z1 + 1.1, by = y + 0.7 + PHh / 2;
      const pic = keepTrue(new THREE.MeshBasicMaterial({ color: 0x2a2a2e }));      // a work of art: no grade or glow over it (src/finish.js)
      if (work.lq) new THREE.TextureLoader().load(work.lq, t => { if (pic.map) return; t.colorSpace = THREE.SRGBColorSpace; pic.map = t; pic.color.setRGB(0.82, 0.82, 0.82); pic.needsUpdate = true; });      // the museum's own tiny placeholder first (dimmed, never tinted)
      new THREE.TextureLoader().load(imageUrl(work, 843), t => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; if (pic.map) pic.map.dispose(); pic.map = t; pic.color.setRGB(0.82, 0.82, 0.82); pic.needsUpdate = true; }, undefined, () => {});
      const face = new THREE.Mesh(new THREE.PlaneGeometry(PW, PHh), pic); face.position.set(bx, by, bz - 0.06); face.rotation.y = Math.PI; k.group.add(face);
      P.add(new THREE.BoxGeometry(PW + 0.24, PHh + 0.24, 0.1), M.gilt, bx, by, bz);
      for (const sx of [-1, 1]) { P.add(new THREE.BoxGeometry(0.1, by - y + 0.2, 0.1), M.dark, bx + sx * (PW / 2 - 0.2), (by + y) / 2 - 0.1, bz + 0.1); O.push({ x0: bx + sx * (PW / 2 - 0.2) - 0.07, x1: bx + sx * (PW / 2 - 0.2) + 0.07, z0: bz + 0.03, z1: bz + 0.17, y0: y, y1: by }); }
      O.push({ x0: bx - PW / 2 - 0.12, x1: bx + PW / 2 + 0.12, z0: bz - 0.08, z1: bz + 0.06, y0: by - PHh / 2 - 0.12, y1: by + PHh / 2 + 0.12 });
      P.add(new THREE.BoxGeometry(0.9, 0.06, 0.1), M.dark, bx, by + PHh / 2 + 0.32, bz - 0.25); P.add(new THREE.BoxGeometry(0.8, 0.03, 0.05), M.bulb, bx, by + PHh / 2 + 0.29, bz - 0.28);
      this.work = work;
    }
    P.done(k.group);
    this.lap = k.lap({ x: RK.cx, z: RK.cz }, 1.4, 6.5, 0.1); this.at = { x: RK.cx, y, z: RK.cz };
    this.chips = k.puffs(50, { color: 0xeaf6ff, size: 0.08 });
  },
  active(k) { const p = k.pos; return !!this.at && near2(p, RK.cx, RK.cz) < 30 * 30 && p.y > this.top - 1 && p.y < this.top + 12; },
  update(dt, k) {
    const p = k.pos, v = k.v, onIce = p.x > RK.x0 && p.x < RK.x1 && p.z > RK.z0 && p.z < RK.z1 && p.y < this.top + 0.35;
    if (near2(p, RK.cx, RK.cz) < 15 * 15) k.once('roofrink', this.work ? 'Bellows painted these skaters; they hang just below. Once round the tree.' : 'A rink on the roof. Once round the tree.', 6);
    if (onIce) {
      if (Math.abs(v.speed || 0) > 4 && Math.random() < dt * 20) this.chips.emit(p.x, p.y + 0.03, p.z, 1, { spread: 0.05, up: 0.4, out: 0.6, life: 0.5 });
      const r = this.lap.step(p);
      if (r === 'done') { k.synth.chime([523, 659, 784, 1047]); if (k.find('roofrink')) k.callout('LOVE OF WINTER'); }
    } else this.lap.reset();
    this.chips.update(dt);
  },
  spots() { return this.at ? [{ kind: 'secret', id: 'roofrink', name: 'Rink on the roof of G161 (a lap round the tree on the ice)', ...this.at }] : []; },
});

// ---------------------------------------------------------------- the roof garden and the bees
// Planters asleep under the snow, a bench, and three hives wrapped in black for the winter. Stop beside a hive and
// listen: the bees are in there, keeping warm. All three for the secret. Bump one hard and they let you know.
const HIVES = [[166.6, 118.4], [168.6, 118.4], [170.6, 118.4]];
feature({
  id: 'roofbees',
  secrets: [['roofbees', 'The rooftop bees']],
  init(k) {
    const top = k.roofAt(166, 115);
    if (!(top > 12 && top < 13.5)) return;
    this.top = top; const M = mats(), P = k.parts(), O = k.plan.obstacles, y = top;
    // Three planters, snow heaped in them and the dry heads of lavender and grasses standing out of it.
    const stalk = lit(0x8a7a5a, { glow: 0.45 });
    for (const [px, pz, w, d] of [[157.5, 111, 3.2, 1.0], [157.5, 114.5, 3.2, 1.0], [162.4, 111, 1.0, 4.5]]) {
      P.add(new THREE.BoxGeometry(w, 0.42, d), M.wood, px, y + 0.21, pz); P.add(new THREE.BoxGeometry(w - 0.12, 0.08, d - 0.12), M.snow, px, y + 0.44, pz);
      for (let i = 0; i < 9; i++) P.add(snowCap(0.5, 0.45, 0.14), M.snow, px + (((i * 0.37) % 1) - 0.5) * (w - 0.5), y + 0.46, pz + (((i * 0.61) % 1) - 0.5) * (d - 0.4));
      for (let i = 0; i < 26; i++) { const sx = px + (((i * 0.713) % 1) - 0.5) * (w - 0.3), sz = pz + (((i * 0.419) % 1) - 0.5) * (d - 0.25), h = 0.25 + ((i * 0.37) % 1) * 0.3; P.add(new THREE.CylinderGeometry(0.006, 0.008, h, 4), stalk, sx, y + 0.44 + h / 2, sz, (i % 5 - 2) * 0.08, 0, (i % 3 - 1) * 0.1); P.add(new THREE.SphereGeometry(0.018, 5, 4), stalk, sx, y + 0.44 + h, sz, 0, 0, 0, 1, 2.2, 1); }
      O.push({ x0: px - w / 2, x1: px + w / 2, z0: pz - d / 2, z1: pz + d / 2, y0: y, y1: y + 0.5 });
    }
    // A bench, with snow on it.
    P.add(new THREE.BoxGeometry(1.6, 0.06, 0.45), M.wood, 160.5, y + 0.45, 120.5); P.add(new THREE.BoxGeometry(1.6, 0.35, 0.05), M.wood, 160.5, y + 0.68, 120.73); P.add(new THREE.BoxGeometry(1.5, 0.05, 0.4), M.snow, 160.5, y + 0.5, 120.48);
    for (const sx of [-0.7, 0.7]) P.add(new THREE.BoxGeometry(0.06, 0.45, 0.42), M.dark, 160.5 + sx, y + 0.225, 120.5);
    O.push({ x0: 159.7, x1: 161.3, z0: 120.25, z1: 120.78, y0: y, y1: y + 0.9 });
    // The hives on their stand: wrapped in black, a lid of snow, the entrance a slot of warm light.
    P.add(new THREE.BoxGeometry(5.2, 0.08, 0.8), M.wood, 168.6, y + 0.32, 118.4);
    for (const sx of [-2.4, -0.8, 0.8, 2.4]) P.add(new THREE.BoxGeometry(0.08, 0.32, 0.7), M.dark, 168.6 + sx, y + 0.16, 118.4);
    const wrap = lit(0x15171b, { glow: 0.35, roughness: 0.5 });
    for (const [hx, hz] of HIVES) {
      P.add(new THREE.BoxGeometry(0.5, 0.62, 0.5), wrap, hx, y + 0.36 + 0.31, hz);
      P.add(new THREE.BoxGeometry(0.58, 0.07, 0.58), M.stone, hx, y + 0.36 + 0.66, hz); P.add(snowCap(0.6, 0.6, 0.09), M.snow, hx, y + 0.36 + 0.7, hz);
      P.add(new THREE.BoxGeometry(0.28, 0.03, 0.02), M.warm, hx, y + 0.36 + 0.08, hz + 0.255);
      P.add(new THREE.BoxGeometry(0.34, 0.02, 0.08), M.wood, hx, y + 0.36 + 0.05, hz + 0.29);
    }
    O.push({ x0: 165.9, x1: 171.3, z0: 117.95, z1: 118.85, y0: y, y1: y + 1.1 });
    P.done(k.group);
    this.tally = k.tally('roofbees', HIVES.length); this.still = 0; this.angry = 0; this.which = -1;
    this.hum = [k.loop({ type: 'sawtooth', freq: 196, lp: 520 }), k.loop({ type: 'sawtooth', freq: 199.5, lp: 520 })];
    this.bees = k.puffs(50, { color: 0xffc040, size: 0.05 });
    this.at = { x: 168.6, y, z: 118.4 };
  },
  active(k) { const p = k.pos; const on = !!this.at && near2(p, this.at.x, this.at.z) < 16 * 16 && Math.abs(p.y - this.top) < 6; if (!on && this.hum && this.loud) { this.loud = 0; this.hum.forEach(h => h.set(0)); } return on; },
  update(dt, k) {
    const p = k.pos, v = k.v, sp = Math.abs(v.speed || 0);
    let best = -1, bd = 9;
    for (let i = 0; i < HIVES.length; i++) { const d = near2(p, HIVES[i][0], HIVES[i][1] + 0.45); if (d < bd) { bd = d; best = i; } }
    if (bd < 6 * 6) k.once('roofbees', 'The museum’s beehives, wrapped for winter. Stop and listen.', 5);
    const close = bd < 1.0 && Math.abs(p.y - this.top) < 1.4;
    if (close && sp > 2.2 && this.angry <= 0) { this.angry = 3; k.say('Too hard. Gently.', 2.5); }
    if (close && sp < 0.3) { if (best !== this.which) { this.which = best; this.still = 0; } this.still += dt; } else { this.still = Math.max(0, this.still - dt * 2); }
    if (close && this.still > 1.6 && this.tally.add('h' + best)) {
      k.synth.chime([392, 494], { gap: 0.1, dur: 0.8, vol: 0.04 });
      if (this.tally.done) { if (k.find('roofbees')) k.callout('THE BEES ARE WELL'); } else k.say(`${this.tally.count} of ${this.tally.total} hives.`, 2.5);
    }
    this.angry -= dt;
    const want = this.angry > 0 ? 0.06 : close ? Math.min(0.035, this.still * 0.025) : bd < 9 ? 0.006 : 0;
    this.loud = want; this.hum[0].set(want); this.hum[1].set(want * 0.8);
    if (best >= 0 && (this.angry > 0 || (close && this.still > 0.8)) && Math.random() < dt * (this.angry > 0 ? 30 : 6)) {
      const [hx, hz] = HIVES[best], tx = this.angry > 0 ? p.x : hx, tz = this.angry > 0 ? p.z : hz + 0.3;
      this.bees.emit(tx, this.top + 0.5, tz, 1, { spread: this.angry > 0 ? 0.4 : 0.12, up: 0.15, out: 0.25, life: 1.2 });
    }
    this.bees.update(dt);
  },
  reset() { this.angry = 0; this.still = 0; },
  spots() { return this.at ? [{ kind: 'secret', id: 'roofbees', name: 'Beehives in the roof garden (stop by each and listen)', ...this.at }] : []; },
});

// ---------------------------------------------------------------- snow on the solar panels
// The array nearest the rink is under snow. Drive over it, or fly low and let the rotors blow it off: clean enough
// and it feeds the rink's floodlights.
feature({
  id: 'roofsolar',
  secrets: [['roofsolar', 'Power from the roof']],
  init(k) {
    const list = (k.museum.roofscape && k.museum.roofscape.solar) || [];
    let A = null; for (const a of list) if (!A || Math.hypot((a.x0 + a.x1) / 2 - RK.cx, (a.z0 + a.z1) / 2 - RK.cz) < Math.hypot((A.x0 + A.x1) / 2 - RK.cx, (A.z0 + A.z1) / 2 - RK.cz)) A = a;
    if (!A) return;
    const PX = 4, W = Math.max(8, Math.round((A.x1 - A.x0) * PX)), H = Math.max(8, Math.round((A.z1 - A.z0) * PX));
    const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
    g.fillStyle = '#f2f5fa'; g.fillRect(0, 0, W, H);
    for (let i = 0; i < W * H / 6; i++) { g.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,.6)' : 'rgba(150,165,195,.18)'; g.fillRect(Math.random() * W, Math.random() * H, 1 + Math.random() * 2, 1); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(A.x1 - A.x0 + 0.1, A.z1 - A.z0 + 0.1), new THREE.MeshStandardMaterial({ map: t, alphaTest: 0.5, roughness: 0.95, emissive: new THREE.Color(0.3, 0.36, 0.52), emissiveIntensity: 0.6, emissiveMap: t, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }));
    m.rotation.x = -Math.PI / 2; m.position.set((A.x0 + A.x1) / 2, A.y + 0.012, (A.z0 + A.z1) / 2); k.group.add(m);
    Object.assign(this, { A, PX, W, H, g, t, mesh: m, grid: new Uint8Array(W * H).fill(1), left: W * H, total: W * H, dirty: false, done: false });
    this.blow = k.puffs(60, { color: 0xffffff, size: 0.12 });
    this.at = { x: (A.x0 + A.x1) / 2, y: A.y, z: (A.z0 + A.z1) / 2 };
    // A row of little lamps along its edge, dark until it is clean.
    const pts = []; for (let x = A.x0; x <= A.x1; x += 0.9) pts.push([x, A.y + 0.1, A.z0 - 0.35]);
    this.leds = bulbs(pts, [0x223344], 0.03); k.group.add(this.leds);
  },
  active(k) { const p = k.pos, A = this.A; return !!A && !this.done && p.x > A.x0 - 6 && p.x < A.x1 + 6 && p.z > A.z0 - 6 && p.z < A.z1 + 6 && p.y > A.y - 1 && p.y < A.y + 3; },
  update(dt, k) {
    const p = k.pos, A = this.A, v = k.v, h = p.y - A.y;
    if (p.x > A.x0 - 3 && p.x < A.x1 + 3 && p.z > A.z0 - 3 && p.z < A.z1 + 3) k.once('roofsolar', 'Solar panels under snow. Clear them.', 4);
    const r = v.kind === 'drone' ? (h < 1.6 ? 0.9 - h * 0.3 : 0) : (h < 0.35 ? 0.42 : 0);
    if (r > 0 && p.x > A.x0 - r && p.x < A.x1 + r && p.z > A.z0 - r && p.z < A.z1 + r) this.clear(p.x, p.z, r, v.kind === 'drone');
    if (this.dirty) { this.t.needsUpdate = true; this.dirty = false; }
    this.blow.update(dt);
    if (!this.done && this.left < this.total * 0.25) this.finish(k);
  },
  clear(x, z, r, drone) {
    const { A, PX, W, H, grid, g } = this, cx = (x - A.x0) * PX, cy = (z - A.z0) * PX, R = r * PX;
    let n = 0;
    for (let j = Math.max(0, Math.floor(cy - R)); j < Math.min(H, Math.ceil(cy + R)); j++) for (let i = Math.max(0, Math.floor(cx - R)); i < Math.min(W, Math.ceil(cx + R)); i++) { const q = j * W + i; if (grid[q] && (i - cx) ** 2 + (j - cy) ** 2 < R * R) { grid[q] = 0; n++; } }
    if (!n) return;
    this.left -= n; g.save(); g.globalCompositeOperation = 'destination-out'; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.fill(); g.restore(); this.dirty = true;
    if (Math.random() < (drone ? 0.6 : 0.3)) this.blow.emit(x, A.y + 0.1, z, drone ? 3 : 1, { spread: r, up: drone ? 0.8 : 0.4, out: drone ? 1.6 : 0.5, life: 0.9 });
  },
  finish(k) {
    this.done = true; this.mesh.visible = false;
    const c = new THREE.Color(); for (let i = 0; i < this.leds.count; i++) this.leds.setColorAt(i, c.set(i % 2 ? 0x7fffb0 : 0xffe080).multiplyScalar(1.8)); this.leds.instanceColor.needsUpdate = true;
    rink.power = true; if (rink.onPower) rink.onPower();
    k.synth.chime([392, 523, 659, 784, 1047], { gap: 0.1 });
    if (k.find('roofsolar')) k.callout('POWER ON');
  },
  reset() {
    if (!this.A || !this.done && this.left === this.total) return;
    this.g.globalCompositeOperation = 'source-over'; this.g.fillStyle = '#f2f5fa'; this.g.fillRect(0, 0, this.W, this.H); this.t.needsUpdate = true;
    this.grid.fill(1); this.left = this.total; this.done = false; this.mesh.visible = true;
    const c = new THREE.Color(0x223344); for (let i = 0; i < this.leds.count; i++) this.leds.setColorAt(i, c); this.leds.instanceColor.needsUpdate = true;
  },
  spots() { return this.at ? [{ kind: 'secret', id: 'roofsolar', name: 'Snow on the solar panels (clear three quarters of it)', ...this.at }] : []; },
});
