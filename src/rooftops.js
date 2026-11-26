// Things to find and do on the roofs (features.js). The roofs of the old building are one long floor for a car
// that has come up the builders' scaffold by Gallery 211; the bridge over the railway runs on from them, and a
// board laid across a gap carries on to the Rice Building (rooftops-east.js). A drone goes anywhere.
//
// This file: the old building's roofs. A snowman to build, five vents that play Jingle Bells (James Lord
// Pierpont, 1857), a wave of snow to go through, a look down through the skylights at the pictures below, a run
// over the roofs to the top of the conservation wing (and a ramp up onto it), and three parcels for three chimneys.
// rooftops-high.js has the conservation wing's top and the sky; rooftops-east.js the Rice Building and the Modern Wing.
import * as THREE from 'three';
import { feature } from './features.js';
import { mats, lit, snowCap, canvasTex } from './roofkit.js';
import './rooftops-high.js';
import './rooftops-east.js';

const WAVE_UC = 3.4;                                     // the line under the snow wave's lip, metres in front of its back
const waveS = t => 0.62 + 0.38 * Math.pow(Math.sin(Math.PI * Math.min(1, Math.max(0, t))), 0.6);      // the snow wave's size along its length
const near2 = (p, x, z) => (p.x - x) ** 2 + (p.z - z) ** 2;
const inBox = (p, b, m = 0) => p.x > b.x0 - m && p.x < b.x1 + m && p.z > b.z0 - m && p.z < b.z1 + m;
const _q = new THREE.Quaternion(), _ax = new THREE.Vector3();

// ---------------------------------------------------------------- a snowman to build
// Three snowballs lie about the roof east of the card game. Roll the middle one into the big one and it goes up
// on top; then the small one. The face, the hat and the scarf are already waiting. Knock it down and it is three
// snowballs again.
feature({
  id: 'roofsnowman',
  secrets: [['roofsnowman', 'A snowman on the roof']],
  init(k) {
    const box = { x0: 38.2, x1: 54.5, z0: 145.6, z1: 158.6 }, top = k.roofAt(46, 152);
    if (!(top > 12 && top < 13.5)) return;
    this.box = box; this.top = top;
    const M = mats(), ballG = new THREE.SphereGeometry(1, 22, 16);
    this.balls = [[0.42, 46.4, 152.2], [0.3, 51.2, 150.2], [0.2, 41.6, 149.8]].map(([r, x, z]) => {
      const mesh = new THREE.Mesh(ballG, M.snow); mesh.scale.setScalar(r); mesh.position.set(x, top + r * 0.92, z); mesh.rotation.set(Math.random() * 6, Math.random() * 6, 0); k.group.add(mesh);
      return { r, hx: x, hz: z, x, z, y: top, hw: r * 0.72, hd: r * 0.72, vx: 0, vz: 0, mesh, px: x, pz: z, on: false, hop: -1, grow: 1 };
    });
    const [b, m, h] = this.balls;
    this.yb = top + b.r * 0.92; this.ym = this.yb + b.r * 0.82 + m.r * 0.82; this.yh = this.ym + m.r * 0.8 + h.r * 0.86;
    // What makes it a snowman, waiting to be put on: coal, a carrot, a scarf, two twigs, a hat.
    const P = k.parts(), coal = M.black, carrot = lit(0xff7a1c, { glow: 0.5 }), twig = lit(0x3a2a1c), scarf = M.red;
    const yh = this.yh - top, ym = this.ym - top, dot = new THREE.SphereGeometry(0.025, 6, 5);
    for (const sx of [-1, 1]) P.add(dot, coal, sx * 0.065, yh + 0.05, h.r * 0.93);
    for (let i = -2; i <= 2; i++) P.add(dot, coal, i * 0.04, yh - 0.06 - (2 - Math.abs(i)) * 0.012, h.r * 0.95, 0, 0, 0, 0.8);
    for (const y of [0.1, 0, -0.1]) P.add(dot, coal, 0, ym + y, m.r * 0.98, 0, 0, 0, 1.2);
    P.add(new THREE.ConeGeometry(0.03, 0.2, 8), carrot, 0, yh, h.r + 0.08, Math.PI / 2, 0, 0);
    P.add(new THREE.TorusGeometry(m.r * 0.72, 0.045, 8, 20), scarf, 0, ym + m.r * 0.62, 0, Math.PI / 2, 0, 0);
    P.add(new THREE.BoxGeometry(0.08, 0.26, 0.03), scarf, 0.1, ym + m.r * 0.3, m.r * 0.78, -0.2, 0, -0.25);
    for (const sx of [-1, 1]) { P.add(new THREE.CylinderGeometry(0.012, 0.018, 0.5, 5), twig, sx * (m.r + 0.18), ym + 0.08, 0, 0, 0, -sx * 1.0); P.add(new THREE.CylinderGeometry(0.008, 0.01, 0.14, 4), twig, sx * (m.r + 0.36), ym + 0.24, 0, 0, 0, -sx * 0.3); }
    P.add(new THREE.CylinderGeometry(0.2, 0.2, 0.02, 18), coal, 0, yh + h.r * 0.8, 0, 0, 0, 0.12);
    P.add(new THREE.CylinderGeometry(0.125, 0.13, 0.22, 18), coal, 0.014, yh + h.r * 0.8 + 0.12, 0, 0, 0, 0.12);
    P.add(new THREE.CylinderGeometry(0.132, 0.132, 0.04, 18), M.red, 0.008, yh + h.r * 0.8 + 0.04, 0, 0, 0, 0.12);
    this.deco = new THREE.Group(); P.done(this.deco); this.deco.visible = false; k.group.add(this.deco);
    this.ob = { x0: 0, x1: 0, z0: 0, z1: 0, y0: -999, y1: -998 }; k.plan.obstacles.push(this.ob);
    this.puff = k.puffs(60, { color: 0xeef4ff, size: 0.16 });
    this.done = false; this.pop = 0; this.k = k;
    this.fixed = k.plan.obstacles.filter(o => o.y1 > top && o.y0 < top + 1 && o.x1 > box.x0 - 1 && o.x0 < box.x1 + 1 && o.z1 > box.z0 - 1 && o.z0 < box.z1 + 1);
    this.fixed.push(this.ob);
  },
  active(k) { const p = k.pos; return !!this.box && inBox(p, this.box, 8) && p.y > this.top - 1 && p.y < this.top + 8; },
  update(dt, k) {
    const [b, m, h] = this.balls, p = k.pos, v = k.v;
    k.once('roofsnowman', 'Three snowballs. Stack them.', 4);
    for (const s of this.balls) {
      if (s.hop >= 0) {                                   // going up onto the one below
        s.hop = Math.min(1, s.hop + dt / 0.38); const e = s.hop, ty = s === m ? this.ym : this.yh;
        s.mesh.position.set(s.fx + (b.x - s.fx) * e, s.fy + (ty - s.fy) * e + Math.sin(e * Math.PI) * 0.45, s.fz + (b.z - s.fz) * e);
        if (e >= 1) { s.hop = -1; k.synth.noise(0.18, { vol: 0.05, lp: 900 }); this.puff.emit(b.x, ty - s.r, b.z, 10, { spread: s.r, up: 0.4 }); if (s === h) this.finish(k); }
        continue;
      }
      if (s.grow < 1) { s.grow = Math.min(1, s.grow + dt * 2); s.mesh.scale.setScalar(s.r * s.grow); }
      if (s.on || (s === b && m.on)) continue;
      if (this.roll(s, dt, v)) {
        const dx = s.x - s.px, dz = s.z - s.pz, d = Math.hypot(dx, dz);
        if (d > 1e-5) { _ax.set(dz / d, 0, -dx / d); s.mesh.quaternion.premultiply(_q.setFromAxisAngle(_ax, d / s.r)); }
        s.mesh.position.set(s.x, s.y + s.r * 0.92, s.z); s.px = s.x; s.pz = s.z;
      }
      // Rolled up against the big one: up it goes.
      if (s !== b && !s.on && ((s === m) || m.on) && Math.hypot(s.x - b.x, s.z - b.z) < (b.r + s.r) * 1.3) {
        s.on = true; s.hop = 0; s.fx = s.mesh.position.x; s.fy = s.mesh.position.y; s.fz = s.mesh.position.z;
        if (s === m) Object.assign(this.ob, { x0: b.x - b.r * 0.8, x1: b.x + b.r * 0.8, z0: b.z - b.r * 0.8, z1: b.z + b.r * 0.8, y0: this.top, y1: this.yh + h.r });
      }
    }
    if (this.done && this.pop < 1) { this.pop = Math.min(1, this.pop + dt / 0.5); const e = this.pop, s = 1 + Math.sin(e * Math.PI) * 0.25; this.deco.scale.setScalar(Math.max(0.01, e * s)); }
    // Knocked down.
    if (this.done && near2(p, b.x, b.z) < (b.r + (v.radius || 0.15) + 0.12) ** 2 && p.y < this.yh && Math.abs(v.speed || 0) > 3) this.knock(k);
    this.puff.update(dt);
  },
  // A ball shoved by the toy: pushed straight away from where it was struck (it is round), rolling to a stop,
  // stopped by the edges of this patch of roof, by anything fixed down, and by the other balls.
  roll(s, dt, v) {
    const p = v.pos, R = s.r * 0.9 + (v.radius || 0.15), dx = s.x - p.x, dz = s.z - p.z, d = Math.hypot(dx, dz), x0 = s.x, z0 = s.z;
    if (d < R && d > 1e-4 && p.y - s.y < s.r * 1.4) {
      const nx = dx / d, nz = dz / d, into = Math.max(0, v.vel.x * nx + v.vel.z * nz);
      s.x = p.x + nx * R; s.z = p.z + nz * R; s.vx = nx * into * 1.05; s.vz = nz * into * 1.05;
    }
    if (Math.abs(s.vx) + Math.abs(s.vz) > 0.01) { s.x += s.vx * dt; s.z += s.vz * dt; const f = Math.exp(-2.2 * dt); s.vx *= f; s.vz *= f; } else s.vx = s.vz = 0;
    const B = this.box, m = s.r * 0.8;
    if (s.x < B.x0 + m || s.x > B.x1 - m) { s.x = Math.max(B.x0 + m, Math.min(B.x1 - m, s.x)); s.vx *= -0.3; }
    if (s.z < B.z0 + m || s.z > B.z1 - m) { s.z = Math.max(B.z0 + m, Math.min(B.z1 - m, s.z)); s.vz *= -0.3; }
    for (const o of this.balls) {
      if (o === s || o.on) continue;
      const ex = s.x - o.x, ez = s.z - o.z, e = Math.hypot(ex, ez), need = (s.r + o.r) * 0.92;
      if (e < need && e > 1e-4 && !(o === this.balls[0] && s !== o && (s === this.balls[1] || this.balls[1].on))) { s.x = o.x + ex / e * need; s.z = o.z + ez / e * need; s.vx *= 0.3; s.vz *= 0.3; }
    }
    for (const o of this.fixed) if (o.y1 > s.y + 0.05 && o.y0 < s.y + s.r && s.x + m > o.x0 && s.x - m < o.x1 && s.z + m > o.z0 && s.z - m < o.z1 && o !== this.ob) { s.x = x0; s.z = z0; s.vx *= -0.3; s.vz *= -0.3; break; }
    return s.x !== x0 || s.z !== z0;
  },
  finish(k) {
    const b = this.balls[0], p = k.pos;
    this.done = true; this.pop = 0; this.deco.visible = true; this.deco.position.set(b.x, this.top, b.z); this.deco.rotation.y = Math.atan2(p.x - b.x, p.z - b.z); this.deco.scale.setScalar(0.01);
    k.synth.chime([523, 659, 784, 1047], { gap: 0.12 });
    if (k.find('roofsnowman')) k.callout('SNOWMAN');
  },
  knock(k) {
    for (const s of this.balls) this.puff.emit(s.mesh.position.x, s.mesh.position.y, s.mesh.position.z, 16, { spread: s.r * 1.4, up: 1.2, out: 1.4 });
    k.synth.noise(0.4, { vol: 0.08, lp: 1200 });
    this.reset(k);
  },
  reset() {
    if (!this.balls) return;
    for (const s of this.balls) { s.x = s.px = s.hx; s.z = s.pz = s.hz; s.vx = s.vz = 0; s.on = false; s.hop = -1; s.grow = 0.01; s.mesh.scale.setScalar(0.01); s.mesh.position.set(s.x, s.y + s.r * 0.92, s.z); }
    this.done = false; this.deco.visible = false; Object.assign(this.ob, { y0: -999, y1: -998 });
  },
  spots() { return this.box ? [{ kind: 'secret', id: 'roofsnowman', name: 'Snowman on the roof (stack three snowballs)', x: 46.4, y: this.top, z: 152.2 }] : []; },
});

// ---------------------------------------------------------------- the vents that play
// Five vent caps in a row on the north range, each with its stack behind it, tuned C D E F G. Run over them and they
// sound. Follow the glowing one and you play the first line of Jingle Bells; then the vents play the whole chorus.
const NOTE = [523.25, 587.33, 659.25, 698.46, 783.99];
const TUNE = [2, 2, 2, 2, 2, 2, 2, 4, 0, 1, 2];
// The chorus, [pad, beats]: E E E- E E E- E G C. D E--- F F F. F F E E E. E E D D E D- G-
const CHORUS = [[2, 1], [2, 1], [2, 2], [2, 1], [2, 1], [2, 2], [2, 1], [4, 1], [0, 1.5], [1, 0.5], [2, 4], [3, 1], [3, 1], [3, 1.5], [3, 0.5], [3, 1], [2, 1], [2, 1], [2, 0.5], [2, 0.5], [2, 1], [1, 1], [1, 1], [2, 1], [1, 2], [4, 2]];
const BASS = [130.81, 130.81, 130.81, 130.81, 174.61, 130.81, 146.83, 98];          // a note a bar under it: C C C C F C D G
feature({
  id: 'roofjingle',
  secrets: [['roofjingle', 'Jingle Bells on the vents']],
  init(k) {
    const top = k.roofAt(37, 65);
    if (!(top > 12 && top < 13.5)) return;
    this.top = top; const M = mats(), P = k.parts();
    const grate = canvasTex(128, 128, (g, w) => { g.fillStyle = '#8a9098'; g.beginPath(); g.arc(64, 64, 63, 0, 7); g.fill(); g.strokeStyle = '#23262b'; g.lineWidth = 5; for (let r = 14; r < 60; r += 12) { g.beginPath(); g.arc(64, 64, r, 0, 7); g.stroke(); } for (let a = 0; a < 12; a++) { g.save(); g.translate(64, 64); g.rotate(a * Math.PI / 6); g.fillStyle = '#9aa0a8'; g.fillRect(-2, 8, 4, 54); g.restore(); } }, 1, 1);
    const grateM = new THREE.MeshStandardMaterial({ map: grate, roughness: 0.55, metalness: 0.35, emissiveMap: grate, emissive: 0x6a7080, emissiveIntensity: 0.6, transparent: true, alphaTest: 0.3, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    const COL = [0xff5a4a, 0xffb02e, 0xffe14a, 0x5ee07a, 0x4ab8ff];
    this.pads = NOTE.map((f, i) => {
      const x = 33.0 + i * 1.8, z = 65.0, y = k.roofAt(x, z), pz = 67.5, H = 1.5 - i * 0.14;
      const disc = new THREE.Mesh(new THREE.CircleGeometry(0.5, 28), grateM); disc.rotation.x = -Math.PI / 2; disc.position.set(x, y + 0.012, z); k.group.add(disc);
      const ringM = new THREE.MeshBasicMaterial({ color: new THREE.Color(COL[i]).multiplyScalar(0.35) });
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.57, 32), ringM); ring.rotation.x = -Math.PI / 2; ring.position.set(x, y + 0.014, z); k.group.add(ring);
      // the stack behind: a galvanised pipe on a flashing, with a cowl on three stays
      P.add(new THREE.CylinderGeometry(0.24, 0.3, 0.12, 16), M.steel, x, y + 0.06, pz);
      P.add(new THREE.CylinderGeometry(0.15, 0.15, H, 18), M.steel, x, y + H / 2, pz);
      for (const yy of [0.35, H - 0.2]) P.add(new THREE.TorusGeometry(0.155, 0.018, 6, 18), M.dark, x, y + yy, pz, Math.PI / 2, 0, 0);
      P.add(new THREE.ConeGeometry(0.24, 0.16, 16), M.steel, x, y + H + 0.2, pz);
      for (let s = 0; s < 3; s++) P.add(new THREE.BoxGeometry(0.015, 0.14, 0.015), M.dark, x + Math.cos(s * 2.1) * 0.1, y + H + 0.07, pz + Math.sin(s * 2.1) * 0.1);
      P.add(snowCap(0.48, 0.48, 0.05), M.snow, x, y + H + 0.26, pz);
      k.plan.obstacles.push({ x0: x - 0.3, x1: x + 0.3, z0: pz - 0.3, z1: pz + 0.3, y0: y, y1: y + H + 0.3 });
      return { x, z, y, pz, top: y + H + 0.3, f, on: false, flash: 0, ringM, col: new THREE.Color(COL[i]) };
    });
    P.done(k.group);
    this.puff = k.puffs(70, { color: 0xdfe8f5, size: 0.22 });
    this.at = { x: 36.6, y: top, z: 65 }; this.n = 0; this.show = null; this.t = 0;
  },
  active(k) { const p = k.pos; return !!this.at && near2(p, this.at.x, this.at.z) < 22 * 22 && p.y > this.top - 1; },
  sound(k, i, at = 0, beats = 1) {
    const f = NOTE[i]; k.synth.note(f, 0.32 + beats * 0.22, { type: 'triangle', vol: 0.09, at }); k.synth.note(f * 2, 0.3, { type: 'sine', vol: 0.025, at });
    k.synth.noise(0.07, { vol: 0.018, lp: 9000, at });                                       // a shake of sleigh bells
  },
  hit(k, i) {
    const d = this.pads[i]; d.flash = 1; this.sound(k, i); this.puff.emit(d.x, d.top, d.pz, 6, { spread: 0.08, up: 1.1, out: 0.2 });
    if (this.show) return;
    if (i === TUNE[this.n]) this.n++; else this.n = i === TUNE[0] ? 1 : 0;
    if (this.n >= TUNE.length) { this.n = 0; this.play(k); }
  },
  // The whole chorus, the vents puffing as they sound.
  play(k) {
    const beat = 0.27; let t = 0.5; this.show = [];
    for (const [i, b] of CHORUS) { this.sound(k, i, t, b); this.show.push([t, i]); t += b * beat; }
    for (let bar = 0; bar < 8; bar++) k.synth.note(BASS[bar], beat * 4 * 0.95, { type: 'sine', vol: 0.06, at: 0.5 + bar * 4 * beat });
    this.t = 0; this.end = t + 0.5;
    if (k.find('roofjingle')) k.callout('JINGLE BELLS');
  },
  update(dt, k) {
    const p = k.pos;
    if (near2(p, this.at.x, this.at.z) < 8 * 8) k.once('roofjingle', 'Five vents, five notes. Follow the glow.', 5);
    for (let i = 0; i < this.pads.length; i++) {
      const d = this.pads[i];
      const dd = near2(p, d.x, d.z), up = p.y - d.y;
      if (!d.on && dd < 0.5 * 0.5 && up < 0.7 && up > -0.3) { d.on = true; this.hit(k, i); }
      else if (d.on && (dd > 0.62 * 0.62 || up > 0.9)) d.on = false;
      d.flash = Math.max(0, d.flash - dt * 2.5);
      const hint = !this.show && i === TUNE[this.n] ? 0.55 + 0.45 * Math.sin(performance.now() / 180) : 0;
      d.ringM.color.copy(d.col).multiplyScalar(0.3 + 1.6 * Math.max(d.flash, hint));
    }
    if (this.show) {
      this.t += dt;
      while (this.show.length && this.show[0][0] <= this.t) { const [, i] = this.show.shift(), d = this.pads[i]; d.flash = 1; this.puff.emit(d.x, d.top, d.pz, 5, { spread: 0.06, up: 1.3, out: 0.15 }); }
      if (!this.show.length && this.t > this.end) this.show = null;
    }
    this.puff.update(dt);
  },
  reset() { this.n = 0; this.show = null; },
  spots() { return this.at ? [{ kind: 'secret', id: 'roofjingle', name: 'Vents that play Jingle Bells', ...this.at }] : []; },
});

// ---------------------------------------------------------------- the snow wave
// The wind has heaped the snow on the inner roof into a wave as tall as a man, breaking, and hollow under its lip.
// Go through the tube from one end to the other.
feature({
  id: 'roofwave',
  secrets: [['roofwave', 'Through the snow wave']],
  init(k) {
    const X = 60.5, zA = 121.5, zB = 136.5, L = zB - zA, top = k.roofAt(57, 129);
    if (!(top > 12 && top < 13.5)) return;
    this.top = top; this.X = X; this.zA = zA; this.zB = zB;
    // The profile, u west of the back of the wave and v up: over the back and the crest to the lip, and back in under it to the foot of the face.
    const prof = [[0, 0], [0.6, 0.8], [1.1, 1.75], [1.6, 2.6], [2.2, 3.15], [2.9, 3.35], [3.6, 3.2], [4.15, 2.75], [4.5, 2.1], [4.55, 1.5], [4.35, 1.15],
      [4.2, 1.45], [4.0, 1.95], [3.6, 2.35], [3.0, 2.55], [2.45, 2.35], [2.1, 1.9], [1.98, 1.3], [2.08, 0.7], [2.38, 0.25], [2.75, 0]];
    const shape = new THREE.Shape(prof.map(([u, v]) => new THREE.Vector2(-u, v)));
    const geo = new THREE.ExtrudeGeometry(shape, { depth: L, bevelEnabled: false, steps: 30, curveSegments: 4 });
    // Bigger in the middle than at the ends, as a wave peels: drawn in about the line under the lip (UC), so the
    // tube runs straight through; the lip thrown furthest where it is biggest.
    const UC = WAVE_UC, uOf = (x, s) => UC + (-x - UC) / s, pos = geo.attributes.position, col = [];
    for (let i = 0; i < pos.count; i++) {
      const t = pos.getZ(i) / L, s = waveS(t), u = -pos.getX(i), y = pos.getY(i), ex = u > 3.6 ? 1 + 0.06 * Math.sin(Math.PI * t) : 1;
      pos.setXYZ(i, -(UC + (u * ex - UC) * s), y * s, pos.getZ(i));
    }
    geo.computeVertexNormals();
    const nrm = geo.attributes.normal, deep = new THREE.Color(0x3f74b4), pale = new THREE.Color(0xd8ebf8), white = new THREE.Color(0xf6f9fd), c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const s = waveS(pos.getZ(i) / L), y = pos.getY(i) / s, u = uOf(pos.getX(i), s), nx = nrm.getX(i), ny = nrm.getY(i);
      if (ny < -0.25 || (nx < -0.2 && u < 3.3)) c.copy(deep).lerp(pale, Math.min(1, y / 2.7) ** 1.5); else c.copy(white).lerp(pale, Math.max(0, 0.45 - y * 0.25));
      col.push(c.r, c.g, c.b);
    }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    const wm = new THREE.MeshStandardMaterial({ vertexColors: true, map: mats().snowT, roughness: 0.6, metalness: 0.05, emissive: new THREE.Color(0.5, 0.56, 0.7), emissiveIntensity: 0.75 });
    // The glow takes the colours too: blue ice in the hollow, white on the back. And the hollow is not a smooth gradient: wind
    // carves the underside of a breaking drift into scallops a hand across, packed like fish scales, with ridges of brighter
    // crust between them and a glassy glaze in their bottoms, the scallops drawn out along the wave. Worked out in the shader
    // from where the fragment is (no texture to stretch round the curl), strongest in the blue of the hollow, a trace on the back.
    wm.onBeforeCompile = sh => {
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWavePos;').replace('#include <project_vertex>', '#include <project_vertex>\n  vWavePos = (modelMatrix * vec4(transformed, 1.0)).xyz;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
        varying vec3 vWavePos;
        vec2 waveCell(vec2 p) { return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453); }
        // distance to the nearest scallop centre, and to the next (their difference is the ridge between two)
        vec2 scallops(vec2 p) {
          vec2 i = floor(p), f = fract(p); float d1 = 8.0, d2 = 8.0;
          for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) { vec2 g = vec2(float(x), float(y)), o = waveCell(i + g); float d = length(g + o * 0.85 - f); if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d; }
          return vec2(d1, d2);
        }`).replace('#include <map_fragment>', `#include <map_fragment>
        float hollow = clamp((vColor.b - vColor.r) * 2.6, 0.0, 1.0);
        // scallops stretched along the wave (z), about 16 cm across and 30 cm long; a finer set inside them
        vec2 sc = scallops(vec2(vWavePos.z * 3.2, vWavePos.y * 6.0 + vWavePos.x * 2.0));
        vec2 sf = scallops(vec2(vWavePos.z * 9.0 + 3.7, vWavePos.y * 15.0 - vWavePos.x * 5.0));
        float ridge = 1.0 - smoothstep(0.0, 0.16, sc.y - sc.x), dish = smoothstep(0.0, 0.75, sc.x);
        float fine = 1.0 - smoothstep(0.0, 0.12, sf.y - sf.x);
        float carve = mix(1.0, 0.86 + 0.16 * dish + 0.13 * ridge + 0.07 * fine, mix(0.2, 1.0, hollow));
        diffuseColor.rgb *= carve;
        float wGlaze = hollow * (1.0 - dish) * 0.5;`).replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        totalEmissiveRadiance *= vColor.rgb * carve;
        totalEmissiveRadiance += vec3(0.55, 0.75, 1.0) * wGlaze * 0.12;`);
    };
    wm.customProgramCacheKey = () => 'roofwave-scallops';
    const wave = new THREE.Mesh(geo, wm);
    wave.position.set(X, top, zA); wave.receiveShadow = true; k.group.add(wave);
    // Claws of spray along the lip.
    const P = k.parts(), M = mats(), claw = new THREE.ConeGeometry(0.07, 0.34, 6), xu = (u, s) => X - (UC + (u - UC) * s);
    for (let z = zA + 0.3; z < zB - 0.2; z += 0.42) {
      const t = (z - zA) / L, s = waveS(t), j = Math.sin(z * 7.3) * 0.08;
      P.add(claw, M.snow, xu(4.35 * (1 + 0.06 * Math.sin(Math.PI * t)), s) + 0.05, top + 1.12 * s - 0.08 + j, z, 0, 0, -2.6 + j * 2);
      P.add(claw, M.snow, xu(4.25, s), top + 1.3 * s - 0.05, z + 0.2, 0, 0, -2.2 - j * 3, 0.8);
    }
    P.done(k.group);
    // Solid as drawn, a length at a time: the back and the crest, and the lip overhead (a car goes under it; a drone flying high hits it).
    for (let i = 0; i < 10; i++) {
      const z0 = zA + L * i / 10, z1 = zA + L * (i + 1) / 10, s = Math.min(waveS(i / 10), waveS((i + 1) / 10)), S = Math.max(waveS(i / 10), waveS((i + 1) / 10));
      k.plan.obstacles.push({ x0: xu(2.15, s), x1: xu(0.15, s), z0, z1, y0: top, y1: top + 3.35 * S }, { x0: xu(4.5, S), x1: xu(2.15, s), z0, z1, y0: top + 1.1 * s, y1: top + 3.35 * S });
    }
    this.xu = xu;
    this.puff = k.puffs(90, { color: 0xffffff, size: 0.12 }); this.spray = 0; this.from = 0;
    this.at = { x: X - WAVE_UC, y: top, z: (zA + zB) / 2 };
  },
  active(k) { const p = k.pos; return !!this.at && near2(p, this.at.x, this.at.z) < 26 * 26 && p.y > this.top - 1; },
  inside(p) {
    if (p.z < this.zA - 0.6 || p.z > this.zB + 0.6 || p.y < this.top - 0.3) return false;
    const s = waveS((p.z - this.zA) / (this.zB - this.zA)); return p.x > this.xu(4.3, s) && p.x < this.xu(2.4, s) && p.y < this.top + 1.0 * s;
  },
  update(dt, k) {
    const p = k.pos;
    if (near2(p, this.at.x, this.at.z) < 12 * 12) k.once('roofwave', 'A wave of snow, breaking. Go through it.', 5);
    if ((this.spray -= dt) < 0) { this.spray = 0.18; const z = this.zA + Math.random() * (this.zB - this.zA); const s = waveS((z - this.zA) / (this.zB - this.zA)); this.puff.emit(this.xu(2.9, s), this.top + 3.3 * s, z, 3, { spread: 0.3, up: 0.5, out: 0.9, life: 1.6 }); }
    if (!this.inside(p)) this.from = 0;
    else if (!this.from) { if (p.z < this.zA + 1.5) this.from = -1; else if (p.z > this.zB - 1.5) this.from = 1; }
    else if ((this.from < 0 && p.z > this.zB - 0.5) || (this.from > 0 && p.z < this.zA + 0.5)) {
      this.from = 0; k.synth.chime([392, 523, 659, 784], { gap: 0.09 });
      for (let z = this.zA; z < this.zB; z += 1) this.puff.emit(this.xu(4.2, 1), this.top + 1.5, z, 2, { spread: 0.3, up: 0.3, out: 0.8 });
      if (k.find('roofwave')) k.callout('IN THE TUBE');
    }
    this.puff.update(dt);
  },
  spots() { return this.at ? [{ kind: 'secret', id: 'roofwave', name: 'Through the snow wave (end to end, under the lip)', ...this.at }] : []; },
});

// ---------------------------------------------------------------- looking down through the skylights
// Stop by one of the glass lanterns over a gallery and look down: the camera dips through the glass to the biggest
// picture in the room below, lit for you. Four rooms for the secret.
feature({
  id: 'roofpeek',
  secrets: [['roofpeek', 'Through the skylights']],
  init(k) {
    const arts = k.museum.arts || [];
    this.list = [];
    for (const m of k.plan.masses) {
      if (!m.glass || !m.room) continue;
      let best = null; for (const a of arts) if (a.room === m.room.id && !a.obj && a.nx != null && (!best || a.w * a.h > best.w * best.h)) best = a;
      if (best && best.w >= 0.5) this.list.push({ id: m.room.id, g: m.glass, top: m.top, room: m.room, art: best });
    }
    this.tally = k.tally('roofpeek', 4); this.on = null;
  },
  near(v, k) {
    if (this.on) return { verb: 'BACK', hint: '', act: () => this.stop(k) };
    const p = k.pos; if (p.y < 11 || Math.abs(v.speed || 0) > 2) return null;
    for (const L of this.list) if (inBox(p, L.g, 0.9) && p.y > L.top - 0.3 && p.y < L.top + 3) return { verb: 'PEER', hint: 'Look down through the glass.', act: () => this.start(k, L) };
    return null;
  },
  start(k, L) {
    const a = L.art, r = L.room, mu = k.museum, st = mu.rooms && mu.rooms[r.id];
    if (st && !st.lit) { st.lit = true; for (const q of st.arts) if (q.wakeAt < 0) { q.wakeAt = mu.time + 0.3 + Math.random() * 0.6; if (mu._waking) mu._waking.add(q); } }
    a.focus = true;
    const reach = Math.abs(a.nx) > 0.5 ? r.x1 - r.x0 : r.z1 - r.z0, d = Math.min(4.4, reach * 0.55), ceil = r.y + (r.h || 7) - 0.45;
    this.on = { L, t: 0, at: { x: a.x + a.nx * d, y: Math.max(a.y + 0.6, Math.min(ceil, a.y + 3.4)), z: a.z + a.nz * d }, look: { x: a.x, y: a.y, z: a.z } };
    k.hold();
    k.say(`${a.work.t.length > 54 ? a.work.t.slice(0, 52) + '…' : a.work.t}. ${a.work.a}`, 1.2, 5);
    if (this.tally.add(r.id) && this.tally.done && k.find('roofpeek')) k.callout('THROUGH THE GLASS');
  },
  stop(k) { if (!this.on) return; this.on.L.art.focus = false; this.on = null; k.hold(null); },
  update(dt, k) {
    if (!this.on) return;
    this.on.t += dt; k.camClose = this.on;
    if (this.on.t > 8) this.stop(k);
  },
  reset(k) { this.stop(k); },
  spots() { return (this.list || []).map(L => ({ kind: 'secret', id: 'roofpeek', name: 'Skylight over ' + L.id + ' (peer down)', x: (L.g.x0 + L.g.x1) / 2, y: L.top, z: (L.g.z0 + L.g.z1) / 2 })); },
});

// ---------------------------------------------------------------- over the rooftops
// From the top of the scaffold, east along the south range, north up the inner lane to a ramp of boards onto the
// conservation wing, and along its whole length to the end over Monroe Street. Flags show the way.
const RUN_TARGET = 30;
feature({
  id: 'roofrun',
  secrets: [['roofrun', 'Over the rooftops']],
  init(k) {
    const P = k.plan, low = k.roofAt(75.4, 116), high = k.roofAt(75.4, 98), sc = P.scaffold;
    if (!(low > 12 && low < 13.5 && high > 15 && high < 16.5) || !sc) return;
    const M = mats(), G = k.parts(), x0 = 73.6, x1 = 77.2, za = 101.0, zb = 114.0, O = P.obstacles;
    this.low = low; this.high = high;
    // The ramp: boards on trestles, a rail each side.
    k.roofSolid({ skin: 'deck', x0, x1, z0: za, z1: zb, axis: 'z', h0: high, h1: low, thick: 0.2 });
    const slope = Math.atan2(high - low, zb - za), len = Math.hypot(high - low, zb - za), hAt = z => high + (low - high) * (z - za) / (zb - za);
    for (let i = 0; i < 12; i++) { const bx = x0 + 0.15 + i * 0.28; G.add(new THREE.BoxGeometry(0.26, 0.06, len), M.wood, bx + 0.13, (high + low) / 2 - 0.03, (za + zb) / 2, slope, 0, 0); }
    for (let z = za + 1.2; z < zb - 0.4; z += 2.2) { const h = hAt(z) - 0.06 - low; if (h < 0.15) continue; for (const x of [x0 + 0.1, x1 - 0.1]) G.add(new THREE.BoxGeometry(0.09, h, 0.09), M.wood, x, low + h / 2, z); G.add(new THREE.BoxGeometry(x1 - x0 - 0.2, 0.08, 0.08), M.wood, (x0 + x1) / 2, low + h * 0.5, z, 0, 0, 0); }
    for (const x of [x0 - 0.05, x1 + 0.05]) {
      G.add(new THREE.CylinderGeometry(0.025, 0.025, len, 8), M.steel, x, (high + low) / 2 + 0.85, (za + zb) / 2, Math.PI / 2 - slope, 0, 0);
      for (let z = za + 0.3; z < zb; z += 1.6) G.add(new THREE.CylinderGeometry(0.02, 0.02, 0.85, 6), M.steel, x, hAt(z) + 0.42, z);
      for (let i = 0; i < 10; i++) { const p = za + (zb - za) * i / 10, q = za + (zb - za) * (i + 1) / 10, hp = hAt(p), hq = hAt(q); O.push({ x0: x - 0.05, x1: x + 0.05, z0: p, z1: q, y0: Math.min(hp, hq) + 0.03, y1: Math.max(hp, hq) + 0.9 }); }
    }
    // Snow along the boards' edges.
    for (const x of [x0 + 0.12, x1 - 0.12]) G.add(new THREE.BoxGeometry(0.18, 0.05, len), M.snow, x, (high + low) / 2 + 0.02, (za + zb) / 2, slope, 0, 0);
    // Flags on poles where the way turns, and a banner over the end.
    const flagM = lit(0xd8332b, { side: THREE.DoubleSide, glow: 0.6 }), flag = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.42, -0.12, 0), new THREE.Vector3(0, -0.26, 0)]);
    flag.computeVertexNormals();
    this.flags = [];
    for (const [fx, fz] of [[31.5, 159.55], [54.8, 159.55], [77.3, 158.9], [77.7, 120.0], [73.3, 100.0], [77.6, 70.0], [77.6, 40.0]]) {
      const fy = k.roofAt(fx, fz); if (!(fy > 12)) continue;
      G.add(new THREE.CylinderGeometry(0.018, 0.022, 1.3, 6), M.steel, fx, fy + 0.65, fz);
      const f = new THREE.Mesh(flag, flagM); f.position.set(fx, fy + 1.28, fz); k.group.add(f); this.flags.push(f);
      O.push({ x0: fx - 0.04, x1: fx + 0.04, z0: fz - 0.04, z1: fz + 0.04, y0: fy, y1: fy + 1.3 });
    }
    const bz = 4.4, by = high + 1.8, bx0 = 73.7, bx1 = 80.9;
    for (const x of [bx0, bx1]) { G.add(new THREE.CylinderGeometry(0.04, 0.05, 2.1, 8), M.steel, x, high + 1.05, bz); O.push({ x0: x - 0.06, x1: x + 0.06, z0: bz - 0.06, z1: bz + 0.06, y0: high, y1: high + 2.1 }); }
    const cheq = canvasTex(256, 32, (g, w, h) => { for (let i = 0; i < 32; i++) for (let j = 0; j < 4; j++) { g.fillStyle = (i + j) % 2 ? '#111' : '#f4f1e8'; g.fillRect(i * 8, j * 8, 8, 8); } });
    const ban = new THREE.Mesh(new THREE.PlaneGeometry(bx1 - bx0, 0.4), new THREE.MeshStandardMaterial({ map: cheq, side: THREE.DoubleSide, roughness: 0.8, emissive: 0xffffff, emissiveMap: cheq, emissiveIntensity: 0.35 }));
    ban.position.set((bx0 + bx1) / 2, by, bz); k.group.add(ban);
    O.push({ x0: bx0, x1: bx1, z0: bz - 0.04, z1: bz + 0.04, y0: by - 0.22, y1: by + 0.22 });
    G.done(k.group);
    // The clock: off the scaffold's landing, to under the banner.
    this.timer = k.timer({
      id: 'roofrun', name: 'ROOFTOPS', limit: 150, min: 10,
      start: { x0: sc.x - 4.9, x1: sc.x - 1.2, z0: sc.z - 5.0, z1: sc.z - 1.3, y0: sc.top - 0.5, y1: sc.top + 1.2 },
      finish: { x0: 73, x1: 81.2, z0: -3.2, z1: bz, y0: high - 0.5 },
      inside: p => p.y > low - 1.5,
      onStart: () => k.synth.chime([523, 784], { gap: 0.1, dur: 0.5 }),
      onFinish: t => { if (t < RUN_TARGET) { if (k.find('roofrun')) k.callout('OVER THE ROOFTOPS'); k.synth.chime([523, 659, 784, 1047]); } else k.say(`${t.toFixed(2)} s. Under ${RUN_TARGET} for the secret.`, 3.5); },
    });
    this.start = { x: sc.x - 3, y: sc.top, z: sc.z - 3 };
  },
  active(k) { return !!this.timer && k.pos.y > 11; },
  update(dt, k) {
    if (k.close(this.start, 3.5, 1.5)) k.once('roofrun', 'A run over the roofs starts here. Follow the flags.', 5);
    this.timer.update(dt);
    const t = performance.now() / 1000; for (let i = 0; i < this.flags.length; i++) this.flags[i].rotation.y = Math.sin(t * 2.3 + i) * 0.35 - 0.4;
  },
  reset() { if (this.timer) this.timer.cancel(); },
  spots() { return this.start ? [{ kind: 'secret', id: 'roofrun', name: `Over the rooftops (scaffold to the banner in ${RUN_TARGET} s)`, ...this.start }] : []; },
});

// ---------------------------------------------------------------- three parcels, three chimneys
// A sack by the card game holds three parcels. Each goes down a different chimney: one on the west range, one on
// the conservation wing, one on the Rice Building. Only something that flies can reach a chimney pot.
const STACKS = [{ id: 'west', x: 20.3, z: 133.0 }, { id: 'north', x: 78.6, z: 52.0 }, { id: 'rice', x: 164.0, z: 112.5 }];
feature({
  id: 'roofchimney',
  secrets: [['roofchimney', 'Down the chimneys']],
  init(k) {
    const M = mats(), P = k.parts(), O = k.plan.obstacles;
    const sackAt = { x: 21.3, z: 158.2 }, sy = k.roofAt(sackAt.x, sackAt.z);
    if (!(sy > 12 && sy < 13.5)) return;
    this.tally = k.tally('roofchimney', STACKS.length);
    this.stacks = [];
    for (const s of STACKS) {
      const y = k.roofAt(s.x, s.z); if (!(y > 12 && y < 17)) continue;
      const H = 1.5, cx = s.x, cz = s.z;
      P.add(new THREE.BoxGeometry(1.0, H, 1.0), M.brick, cx, y + H / 2, cz);
      P.add(new THREE.BoxGeometry(1.16, 0.12, 1.16), M.stone, cx, y + H + 0.06, cz);
      P.add(new THREE.BoxGeometry(1.08, 0.08, 1.08), M.stone, cx, y + H - 0.25, cz);
      P.add(snowCap(1.1, 1.1, 0.06), M.snow, cx, y + H + 0.12, cz);
      for (const dx of [-0.25, 0.25]) {
        P.add(new THREE.CylinderGeometry(0.14, 0.19, 0.5, 14, 1, true), M.clay, cx + dx, y + H + 0.37, cz);
        P.add(new THREE.TorusGeometry(0.145, 0.03, 6, 16), M.clay, cx + dx, y + H + 0.62, cz, Math.PI / 2, 0, 0);
        P.add(new THREE.CircleGeometry(0.13, 14), dx < 0 ? M.warm : M.black, cx + dx, y + H + 0.5, cz, -Math.PI / 2, 0, 0);
      }
      O.push({ x0: cx - 0.5, x1: cx + 0.5, z0: cz - 0.5, z1: cz + 0.5, y0: y, y1: y + H + 0.12 });
      for (const dx of [-0.25, 0.25]) O.push({ x0: cx + dx - 0.18, x1: cx + dx + 0.18, z0: cz - 0.18, z1: cz + 0.18, y0: y + H + 0.12, y1: y + H + 0.62 });
      // A wreath goes up on the stack once its parcel is down.
      const wreath = new THREE.Group(), wp = k.parts();
      wp.add(new THREE.TorusGeometry(0.17, 0.055, 8, 18), M.green, 0, 0, 0);
      for (let i = 0; i < 7; i++) wp.add(new THREE.SphereGeometry(0.025, 6, 5), M.red, Math.cos(i * 0.9) * 0.17, Math.sin(i * 0.9) * 0.17, 0.05);
      wp.add(new THREE.BoxGeometry(0.1, 0.07, 0.03), M.red, 0, -0.18, 0.05);
      wp.done(wreath); wreath.position.set(cx, y + H * 0.62, cz + 0.52); wreath.visible = this.tally.has(s.id); k.group.add(wreath);
      this.stacks.push({ ...s, y, pot: { x: cx - 0.25, z: cz, y: y + H + 0.62 }, wreath });
    }
    // The sack, and the three parcels in it.
    const sackM = lit(0x9a7a4a, { roughness: 0.95 }), pts = [];
    for (let i = 0; i <= 10; i++) { const t = i / 10; pts.push(new THREE.Vector2(0.02 + Math.sin(t * Math.PI * 0.92) * 0.3 + (t > 0.85 ? (t - 0.85) * 1.2 : 0), t * 0.62)); }
    P.add(new THREE.LatheGeometry(pts, 16), sackM, sackAt.x, sy, sackAt.z);
    P.add(new THREE.TorusGeometry(0.2, 0.02, 6, 16), lit(0x5a3a1a), sackAt.x, sy + 0.5, sackAt.z, Math.PI / 2, 0, 0);
    O.push({ x0: sackAt.x - 0.3, x1: sackAt.x + 0.3, z0: sackAt.z - 0.3, z1: sackAt.z + 0.3, y0: sy, y1: sy + 0.62 });
    P.done(k.group);
    const COL = [0xc0262c, 0x1f7a44, 0xd4a838];
    this.parcel = n => {
      const g = new THREE.Group(), s = 0.075, ribbon = n === 2 ? M.red : M.gilt;
      g.add(new THREE.Mesh(new THREE.BoxGeometry(s, s * 0.8, s), lit(COL[n])));
      g.add(new THREE.Mesh(new THREE.BoxGeometry(s * 1.04, s * 0.84, s * 0.22), ribbon), new THREE.Mesh(new THREE.BoxGeometry(s * 0.22, s * 0.84, s * 1.04), ribbon));
      const bow = new THREE.Mesh(new THREE.TorusGeometry(s * 0.2, s * 0.07, 5, 10), ribbon); bow.position.y = s * 0.45; g.add(bow); return g;
    };
    this.inSack = [0, 1, 2].map(n => { const m = this.parcel(n); m.scale.setScalar(2.2); m.position.set(sackAt.x - 0.1 + n * 0.11, sy + 0.62 + (n === 1 ? 0.05 : 0), sackAt.z + (n - 1) * 0.06); m.rotation.y = n; k.group.add(m); return m; });
    this.sack = { x: sackAt.x, y: sy, z: sackAt.z }; this.taken = [false, false, false];
    this.drop = { mesh: null, t: -1 };
    this.smoke = k.puffs(70, { color: 0x8a8f99, size: 0.3 }); this.puff = k.puffs(40, { color: 0xffc070, size: 0.1 }); this.st = 0;
  },
  near(v, k) {
    if (!this.sack || !k.close(this.sack, 1.0, 1.4)) return null;
    const n = this.taken.indexOf(false); if (n < 0) return null;
    return { verb: 'TAKE', hint: 'A parcel for a chimney.', act: () => {
      const m = this.parcel(n); if (!k.carry.take({ id: 'parcel' + n, mesh: m })) return;
      this.taken[n] = true; this.inSack[n].visible = false; k.synth.chime([659, 880], { gap: 0.08, dur: 0.5 });
      k.once('roofchimney', v.kind === 'drone' ? 'Three chimneys. One parcel down each.' : 'Three chimneys. Only something that flies can reach the pots.', 5);
    } };
  },
  update(dt, k) {
    if (!this.stacks) return;
    const p = k.pos, v = k.v, carrying = this.carrying(k);
    // A little smoke from the lit pot of each, when anyone is near enough to see it.
    if ((this.st -= dt) < 0) { this.st = 0.35; for (const s of this.stacks) if (near2(p, s.x, s.z) < 45 * 45) this.smoke.emit(s.pot.x, s.pot.y + 0.05, s.pot.z, 1, { spread: 0.05, up: 0.55, out: 0.12, life: 3 }); }
    if (carrying) for (const s of this.stacks) {
      const dd = near2(p, s.pot.x, s.pot.z);
      if (dd > 9) continue;
      if (v.kind !== 'drone') { k.once('roofchimney-car', 'Only something that flies can reach the pots.', 4); continue; }
      if (dd < 0.34 * 0.34 && p.y > s.pot.y - 0.1 && p.y < s.pot.y + 0.55) {
        if (this.tally.has(s.id)) { k.once('roofchimney-had-' + s.id, 'That one has had its parcel. Another chimney.', 3); break; }
        const it = k.carry.drop(carrying.id); if (this.drop.mesh) k.group.remove(this.drop.mesh);
        const dm = this.drop.mesh = it.mesh; k.group.add(dm); dm.position.set(s.pot.x, p.y - 0.1, s.pot.z); dm.scale.setScalar(1.6); this.drop.t = 0;
        k.synth.chime([784, 659, 523, 392], { gap: 0.07, dur: 0.6 }); this.puff.emit(s.pot.x, s.pot.y, s.pot.z, 16, { spread: 0.1, up: 1.4, out: 0.4 }); this.smoke.emit(s.pot.x, s.pot.y, s.pot.z, 10, { spread: 0.1, up: 0.8, out: 0.3, life: 2.5 });
        this.tally.add(s.id); s.wreath.visible = true;
        if (this.tally.done) { if (k.find('roofchimney')) k.callout('DOWN THE CHIMNEYS'); } else k.say(`${this.tally.count} of ${this.tally.total} chimneys.`, 3);
        break;
      }
    }
    if (this.drop.t >= 0) { this.drop.t += dt; const m = this.drop.mesh; m.position.y -= dt * 1.2; m.rotation.y += dt * 6; if (this.drop.t > 0.6) { this.drop.t = -1; k.group.remove(m); this.drop.mesh = null; } }
    this.smoke.update(dt); this.puff.update(dt);
  },
  carrying(k) { for (const i of k.carry.list) if (i.id.startsWith('parcel')) return i; return null; },
  reset() { if (!this.inSack) return; this.taken = [false, false, false]; this.inSack.forEach(m => { m.visible = true; }); },
  spots() { return (this.stacks || []).map(s => ({ kind: 'secret', id: 'roofchimney', name: 'Chimney (' + s.id + ') for a parcel from the sack by the card game', x: s.x, y: s.y, z: s.z })); },
});
