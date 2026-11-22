// Fireworks from the roof of the Modern Wing's west pavilion (features.js): a rack of mortar tubes in a crate on the
// terrace, where the glass lift comes up. LAUNCH and a show goes up over Monroe Street, Millennium Park and the lake:
// peonies, rings, gold willows that droop and crackle, crossettes that split, and a finale. Each shell thumps out of
// its tube and whistles up; its bang comes a beat after its flash, as far off as it is. Sit still and the camera turns
// to watch; drive off and it lets you go. Nothing is done per frame when no show is running.
import * as THREE from 'three';
import { feature } from './features.js';

const MAX = 5000;                 // sparks at once
const GRAV = 9.8;
const PAL = [[1.0, 0.35, 0.3], [0.35, 0.8, 1.0], [1.0, 0.85, 0.35], [0.5, 1.0, 0.45], [0.95, 0.45, 1.0], [1.0, 1.0, 1.0], [1.0, 0.6, 0.2]];

const V = `attribute float aSize; attribute vec3 aCol; attribute float aA; varying vec3 vC; varying float vA;
void main() { vC = aCol; vA = aA; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = min(18.0, aSize * (420.0 / max(1.0, -mv.z))); gl_Position = projectionMatrix * mv; }`;
const F = `varying vec3 vC; varying float vA;
void main() { vec2 d = gl_PointCoord - 0.5; float r = dot(d, d) * 4.0; if (r > 1.0) discard; gl_FragColor = vec4(vC * vA * (1.0 - r * 0.7), 1.0); }`;

feature({
  id: 'fireworks',
  secrets: [['fireworks', 'Fireworks over the park']],
  init(k) {
    const T = k.museum.mw && k.museum.mw.terrace; if (!T) return;
    this.k = k; this.T = T; this.run = null; this.t = 0; this.live = 0; this.cool = 0;
    // The crate: near the terrace's north-east corner, its tubes leaning a little towards the park.
    // (at whichever end of the north side is further from the glass lift, so its shaft is not in the way of the view)
    const L = k.museum.mw.lift, lx = L ? (L.x0 + L.x1) / 2 : T.x1, ends = [T.x1 - 1.3, T.x0 + 1.6];
    const cx = Math.abs(ends[0] - lx) > Math.abs(ends[1] - lx) ? ends[0] : ends[1], cz = T.z0 + 1.4, y = T.y;
    this.crate = { x: cx, z: cz, y };
    const wood = new THREE.MeshStandardMaterial({ color: 0x8a5a32, roughness: 0.85, emissive: 0x2a1a0e, emissiveIntensity: 0.6 });
    const tubeM = new THREE.MeshStandardMaterial({ color: 0x2b2f36, roughness: 0.6, emissive: 0x0c0e12, emissiveIntensity: 0.6 });
    const red = new THREE.MeshStandardMaterial({ color: 0xd8342a, roughness: 0.5, emissive: 0x6a1410, emissiveIntensity: 0.8 });
    const g = new THREE.Group(); g.position.set(cx, y, cz); k.group.add(g);
    const box = (w, h, d, m, x, yy, z) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, yy, z); g.add(b); return b; };
    box(1.0, 0.36, 0.7, wood, 0, 0.18, 0);
    for (const sx of [-0.52, 0.52]) box(0.04, 0.4, 0.74, wood, sx, 0.2, 0);
    this.tubes = [];
    for (let i = 0; i < 6; i++) {
      const tx = -0.33 + (i % 3) * 0.33, tz = i < 3 ? -0.15 : 0.15;
      const tb = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.5, 12, 1, true), tubeM); tb.position.set(tx, 0.55, tz); tb.rotation.x = -0.12; g.add(tb);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.012, 6, 14), red); rim.rotation.x = Math.PI / 2 - 0.12; rim.position.set(tx, 0.8, tz - 0.03); g.add(rim);
      this.tubes.push(new THREE.Vector3(cx + tx, y + 0.8, cz + tz - 0.03));
    }
    // a plunger box on a lead beside it
    box(0.22, 0.16, 0.18, red, 0.75, 0.08, 0.35); box(0.04, 0.16, 0.04, tubeM, 0.75, 0.24, 0.35); this.plunger = box(0.16, 0.035, 0.05, tubeM, 0.75, 0.33, 0.35);
    (k.plan.roofs || k.plan.surfaces).push({ skin: 'deck', x0: cx - 0.5, x1: cx + 0.5, z0: cz - 0.35, z1: cz + 0.35, axis: null, h0: y + 0.36, h1: y + 0.36, thick: 0.36, roof: true, fixed: true });      // drawn above; solid as drawn
    // The sparks: one pool, drawn as glowing points.
    this.P = new Float32Array(MAX * 3); this.Vv = new Float32Array(MAX * 3); this.C = new Float32Array(MAX * 3); this.S = new Float32Array(MAX); this.A = new Float32Array(MAX);
    this.life = new Float32Array(MAX); this.max = new Float32Array(MAX); this.drag = new Float32Array(MAX); this.kind = new Uint8Array(MAX); this.n = 0;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.P, 3)); geo.setAttribute('aCol', new THREE.BufferAttribute(this.C, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(this.S, 1)); geo.setAttribute('aA', new THREE.BufferAttribute(this.A, 1));
    geo.setDrawRange(0, 0);
    this.geo = geo;
    const pts = this.pts = new THREE.Points(geo, new THREE.ShaderMaterial({ vertexShader: V, fragmentShader: F, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    pts.frustumCulled = false; pts.renderOrder = 6; pts.visible = false; k.group.add(pts);
    this.shells = [];
  },

  near(v, k) {
    if (!this.crate || this.run) return null;
    const p = k.pos, c = this.crate;
    if (Math.abs(p.y - c.y) > 1.2 || Math.hypot(p.x - c.x, p.z - c.z) > 2.2) return null;
    if (this.cool > 0) return { verb: 'WAIT', hint: 'Reloading the tubes…', act: () => {} };
    return { verb: 'LAUNCH', hint: 'Fireworks. E to light them.', act: () => this.start(k) };
  },

  start(k) {
    // A programme: singles, then pairs, then a finale. [time, kind, target x offset, height, colour]
    const r = Math.random, kinds = ['peony', 'ring', 'willow', 'crossette', 'palm'], prog = [];
    let t = 1.2;
    for (let i = 0; i < 12; i++) { prog.push([t, kinds[i % kinds.length], (r() - 0.5) * 50, 48 + r() * 22, Math.floor(r() * PAL.length)]); t += 1.6 + r() * 1.2; }
    for (let i = 0; i < 8; i++) { for (let j = 0; j < 2; j++) prog.push([t + j * 0.25, kinds[Math.floor(r() * kinds.length)], (j ? 1 : -1) * (10 + r() * 20), 50 + r() * 20, Math.floor(r() * PAL.length)]); t += 1.5 + r() * 0.8; }
    t += 1.0;
    for (let i = 0; i < 18; i++) prog.push([t + i * 0.18, i % 3 ? 'peony' : 'willow', (r() - 0.5) * 70, 52 + r() * 25, Math.floor(r() * PAL.length)]);
    prog.push([t + 18 * 0.18 + 0.6, 'willow', 0, 80, 2]);
    this.run = { t: 0, prog, i: 0, end: t + 18 * 0.18 + 6 };
    this.pts.visible = true;
    this.plunger.position.y = 0.25;
    k.callout('FIREWORKS!');
    k.say('Light the blue touch paper… and stand well back.', 0.3, 4);
  },

  active(k) { return !!(this.run || this.live > 0 || this.shells.length || this.cool > 0); },

  update(dt, k) {
    this.t += dt; if (this.cool > 0) this.cool -= dt;
    const R = this.run;
    if (R) {
      R.t += dt;
      while (R.i < R.prog.length && R.prog[R.i][0] <= R.t) { this._launch(k, R.prog[R.i]); R.i++; }
      // Sit still and the camera turns to watch: from behind the crate, up over the park.
      const v = k.v, sp = Math.hypot(v.vel.x, v.vel.z), c = this.crate;
      if (sp < 0.4 && Math.hypot(k.pos.x - c.x, k.pos.z - c.z) < 6) k.camClose = { at: { x: c.x + (c.x < (this.T.x0 + this.T.x1) / 2 ? 1.2 : -1.2), y: c.y + 3.7, z: c.z + 3.2 }, look: { x: c.x + 30, y: c.y + 50, z: c.z - 85 } };      // just over the pergola: nothing overhead, the screen below
      if (R.t > R.end) {
        this.run = null; this.cool = 4; this.plunger.position.y = 0.33;
        if (k.find('fireworks')) k.callout('FIREWORKS OVER THE PARK');
      }
    }
    // shells on their way up: a bright head and a short trail, then the burst
    for (let i = this.shells.length - 1; i >= 0; i--) {
      const s = this.shells[i]; s.t += dt;
      s.vy -= GRAV * 0.35 * dt; s.x += s.vx * dt; s.y += s.vy * dt; s.z += s.vz * dt;
      if (Math.random() < 0.9) this._spark(s.x, s.y, s.z, (Math.random() - 0.5) * 0.6, -1 - Math.random(), (Math.random() - 0.5) * 0.6, [1, 0.75, 0.4], 0.35 + Math.random() * 0.25, 0.7, 2, 0);
      if (s.t >= s.T) { this._burst(k, s); this.shells.splice(i, 1); }
    }
    this._step(dt);
  },

  _launch(k, [, kind, ox, h, ci]) {
    const tube = this.tubes[Math.floor(Math.random() * this.tubes.length)], c = this.crate;
    // over the park and the lake: north (-z) of the pavilion, a little east
    const tx = c.x + 30 + ox, tz = c.z - 70 - Math.random() * 30, ty = c.y + h, T = 1.6 + Math.random() * 0.5;
    const vy = (ty - tube.y) / T + 0.5 * GRAV * 0.35 * T;
    this.shells.push({ x: tube.x, y: tube.y, z: tube.z, vx: (tx - tube.x) / T, vy, vz: (tz - tube.z) / T, t: 0, T, kind, ci });
    const S = k.synth; S.noise(0.12, { vol: 0.09, lp: 420 }); S.note(70, 0.12, { type: 'sine', vol: 0.09 });
    this._whistle(k, T);
    for (let i = 0; i < 10; i++) this._spark(tube.x, tube.y, tube.z, (Math.random() - 0.5) * 1.5, 2 + Math.random() * 3, (Math.random() - 0.5) * 1.5, [1, 0.8, 0.5], 0.4, 0.2, 1.5, 0);
  },
  _whistle(k, T) {
    const S = k.sound; if (!S || !S.ctx || S.ctx.state !== 'running' || !S.master || Math.random() < 0.4) return;
    const c = S.ctx, t = c.currentTime, o = c.createOscillator(), g = c.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(1800, t); o.frequency.exponentialRampToValueAtTime(700, t + T);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.02, t + 0.1); g.gain.exponentialRampToValueAtTime(0.0001, t + T);
    o.connect(g); g.connect(S.master); o.start(t); o.stop(t + T + 0.05);
  },
  _burst(k, s) {
    const col = PAL[s.ci], R = Math.random, x = s.x, y = s.y, z = s.z;
    const sphere = (n, sp, life, size, drag, kind, c2) => { for (let i = 0; i < n; i++) { const u = R() * 2 - 1, a = R() * Math.PI * 2, q = Math.sqrt(1 - u * u), f = sp * (0.85 + R() * 0.3); this._spark(x, y, z, q * Math.cos(a) * f, u * f, q * Math.sin(a) * f, c2 || col, life * (0.8 + R() * 0.4), size, drag, kind); } };
    if (s.kind === 'peony') { sphere(180, 19, 1.9, 2.6, 1.1, 0); sphere(50, 8, 1.3, 2.0, 1.4, 0, [1, 1, 1]); }
    else if (s.kind === 'ring') {
      const ax = R() - 0.5, ay = 0.6 + R() * 0.4, az = R() - 0.5, n = new THREE.Vector3(ax, ay, az).normalize(), e1 = new THREE.Vector3(1, 0, 0).cross(n).normalize(), e2 = n.clone().cross(e1);
      for (let i = 0; i < 90; i++) { const a = i / 90 * Math.PI * 2, f = 20; this._spark(x, y, z, (e1.x * Math.cos(a) + e2.x * Math.sin(a)) * f, (e1.y * Math.cos(a) + e2.y * Math.sin(a)) * f, (e1.z * Math.cos(a) + e2.z * Math.sin(a)) * f, col, 1.9, 2.6, 1.0, 0); }
      sphere(30, 6, 1.0, 1.8, 1.5, 0, PAL[(s.ci + 2) % PAL.length]);
    }
    else if (s.kind === 'willow') sphere(170, 15, 3.8, 2.4, 2.4, 1, [1, 0.72, 0.28]);
    else if (s.kind === 'crossette') sphere(16, 17, 0.9, 3.0, 0.6, 2);
    else { for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2; for (let j = 0; j < 12; j++) { const f = 11 + j * 1.1; this._spark(x, y, z, Math.cos(a) * f * 0.8, 8 + j * 0.4, Math.sin(a) * f * 0.8, col, 2.2, 2.6, 1.6, 0); } } }
    // the bang, late by the distance: and a crackle after a willow
    const d = Math.hypot(x - k.pos.x, y - k.pos.y, z - k.pos.z), at = Math.min(0.6, d / 343), S = k.synth, big = s.kind !== 'crossette';
    S.noise(big ? 0.5 : 0.25, { vol: big ? 0.12 : 0.07, lp: 1400, at }); S.note(55, 0.4, { type: 'sine', vol: 0.1, at });
    if (s.kind === 'willow') for (let i = 0; i < 10; i++) S.noise(0.03, { vol: 0.03, lp: 6000, at: at + 0.8 + i * 0.12 + R() * 0.08 });
  },
  _spark(x, y, z, vx, vy, vz, col, life, size, drag, kind) {
    if (this.n >= MAX) return;
    const i = this.n++;
    this.P[i * 3] = x; this.P[i * 3 + 1] = y; this.P[i * 3 + 2] = z;
    this.Vv[i * 3] = vx; this.Vv[i * 3 + 1] = vy; this.Vv[i * 3 + 2] = vz;
    this.C[i * 3] = col[0] * 2.2; this.C[i * 3 + 1] = col[1] * 2.2; this.C[i * 3 + 2] = col[2] * 2.2;
    this.life[i] = this.max[i] = life; this.S[i] = size; this.A[i] = 1; this.drag[i] = drag; this.kind[i] = kind;
  },
  _step(dt) {
    let n = this.n;
    for (let i = 0; i < n; i++) {
      this.life[i] -= dt;
      if (this.life[i] <= 0) {
        // a crossette's star splits into four as it dies
        if (this.kind[i] === 2) { const x = this.P[i * 3], y = this.P[i * 3 + 1], z = this.P[i * 3 + 2]; this.kind[i] = 0; for (let j = 0; j < 4; j++) { const a = j / 4 * Math.PI * 2 + Math.random(); this._spark(x, y, z, Math.cos(a) * 7, (Math.random() - 0.3) * 4, Math.sin(a) * 9, [this.C[i * 3] / 2.2, this.C[i * 3 + 1] / 2.2, this.C[i * 3 + 2] / 2.2], 1.0, 2.2, 1.2, 0); } }
        n = --this.n;
        this._copy(n, i); i--; continue;
      }
      const dr = Math.exp(-this.drag[i] * dt), g = this.kind[i] === 1 ? GRAV * 0.35 : GRAV * 0.5;
      this.Vv[i * 3] *= dr; this.Vv[i * 3 + 1] = this.Vv[i * 3 + 1] * dr - g * dt; this.Vv[i * 3 + 2] *= dr;
      this.P[i * 3] += this.Vv[i * 3] * dt; this.P[i * 3 + 1] += this.Vv[i * 3 + 1] * dt; this.P[i * 3 + 2] += this.Vv[i * 3 + 2] * dt;
      const f = this.life[i] / this.max[i];
      this.A[i] = this.kind[i] === 1 ? Math.min(1, f * 1.6) * (0.7 + 0.3 * Math.sin(this.t * 30 + i)) : f * f * (0.75 + 0.25 * Math.sin(this.t * 24 + i * 1.7));
    }
    this.live = this.n;
    const gq = this.geo; gq.setDrawRange(0, this.n);
    for (const nm of ['position', 'aCol', 'aSize', 'aA']) { const a = gq.attributes[nm]; a.needsUpdate = true; a.clearUpdateRanges && a.clearUpdateRanges(); a.addUpdateRange && a.addUpdateRange(0, this.n * a.itemSize); }
    if (!this.n && !this.run && !this.shells.length) this.pts.visible = false;
  },
  _copy(from, to) {
    if (from === to) return;
    for (let c = 0; c < 3; c++) { this.P[to * 3 + c] = this.P[from * 3 + c]; this.Vv[to * 3 + c] = this.Vv[from * 3 + c]; this.C[to * 3 + c] = this.C[from * 3 + c]; }
    this.life[to] = this.life[from]; this.max[to] = this.max[from]; this.S[to] = this.S[from]; this.A[to] = this.A[from]; this.drag[to] = this.drag[from]; this.kind[to] = this.kind[from];
  },
});
