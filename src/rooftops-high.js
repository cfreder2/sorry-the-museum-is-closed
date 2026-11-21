// The high places (rooftops.js has the rest): at the north end of the conservation wing, the top roof of the old
// building, a weather vane to spin and a telescope trained on the night; stars hung low over the bridge to join
// up; pigeons that go up when you come near; and a kite somebody lost in the Modern Wing's sunshade.
import * as THREE from 'three';
import { feature } from './features.js';
import { mats, lit, snowCap, canvasTex } from './roofkit.js';

const near2 = (p, x, z) => (p.x - x) ** 2 + (p.z - z) ** 2;
const TAU = Math.PI * 2;

// ---------------------------------------------------------------- the weather vane
// A gilt cockerel on an arrow, over N, E, S and W, at the north end of the conservation wing. It swings to the wind;
// fly into it and it spins. Three turns, fast, for the secret.
feature({
  id: 'roofvane',
  secrets: [['roofvane', 'Spin the weather vane']],
  init(k) {
    const x = 87.4, z = -1.4, y = k.roofAt(x, z);
    if (!(y > 15 && y < 17)) return;
    const M = mats(), P = k.parts(), O = k.plan.obstacles;
    this.at = { x, y, z }; this.hub = y + 3.35;
    // A lead-covered plinth, the mast, the arms of the compass and their letters.
    P.add(new THREE.BoxGeometry(1.0, 0.55, 1.0), M.stone, x, y + 0.275, z); P.add(new THREE.BoxGeometry(1.1, 0.08, 1.1), M.stone, x, y + 0.59, z); P.add(snowCap(1.1, 1.1, 0.07), M.snow, x, y + 0.63, z);
    P.add(new THREE.CylinderGeometry(0.035, 0.05, 2.9, 10), M.dark, x, y + 0.6 + 1.45, z);
    P.add(new THREE.SphereGeometry(0.09, 12, 8), M.gilt, x, y + 2.6, z);
    P.add(new THREE.BoxGeometry(1.3, 0.03, 0.03), M.dark, x, y + 2.45, z); P.add(new THREE.BoxGeometry(0.03, 0.03, 1.3), M.dark, x, y + 2.45, z);
    P.done(k.group);
    O.push({ x0: x - 0.5, x1: x + 0.5, z0: z - 0.5, z1: z + 0.5, y0: y, y1: y + 0.63 }, { x0: x - 0.06, x1: x + 0.06, z0: z - 0.06, z1: z + 0.06, y0: y, y1: y + 3.5 });
    for (const [ch, dx, dz] of [['N', 0, -1], ['E', 1, 0], ['S', 0, 1], ['W', -1, 0]]) {
      const t = canvasTex(64, 64, g => { g.font = 'bold 54px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#e8c04a'; g.fillText(ch, 32, 36); });
      const m = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.26), new THREE.MeshBasicMaterial({ map: t, transparent: true, alphaTest: 0.4, side: THREE.DoubleSide, color: new THREE.Color(1.4, 1.3, 1.1) }));
      m.position.set(x + dx * 0.72, y + 2.45, z + dz * 0.72); m.lookAt(x + dx * 3, y + 2.45, z + dz * 3); k.group.add(m);
    }
    // The vane: an arrow, a tail, and the cockerel standing on it, all gilt.
    const vane = this.vane = new THREE.Group(); vane.position.set(x, this.hub, z); k.group.add(vane);
    const V = k.parts();
    V.add(new THREE.BoxGeometry(0.03, 0.03, 1.5), M.gilt, 0, 0, 0);
    const head = new THREE.Shape([new THREE.Vector2(0, 0.14), new THREE.Vector2(0.11, -0.05), new THREE.Vector2(-0.11, -0.05)]);
    V.add(new THREE.ExtrudeGeometry(head, { depth: 0.02, bevelEnabled: false }), M.gilt, 0, 0, 0.74, Math.PI / 2, 0, 0);
    const tail = new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(0.28, 0.2), new THREE.Vector2(0.38, 0.2), new THREE.Vector2(0.3, 0), new THREE.Vector2(0.38, -0.2), new THREE.Vector2(0.28, -0.2)]);
    V.add(new THREE.ExtrudeGeometry(tail, { depth: 0.02, bevelEnabled: false }), M.gilt, -0.01, 0, -0.42, 0, Math.PI / 2, 0);
    const bird = new THREE.Shape(); bird.moveTo(-0.22, 0.04);
    for (const [a, b] of [[-0.12, 0.02], [-0.02, 0.06], [0.06, 0.14], [0.08, 0.26], [0.14, 0.33], [0.2, 0.3], [0.17, 0.27], [0.22, 0.24], [0.16, 0.22], [0.15, 0.14], [0.2, 0.06], [0.12, -0.02], [0.04, -0.03], [0.05, -0.08], [0.0, -0.08], [-0.02, -0.03], [-0.1, -0.01], [-0.26, 0.2], [-0.34, 0.24], [-0.32, 0.12], [-0.38, 0.14], [-0.3, 0.04]]) bird.lineTo(a, b);
    V.add(new THREE.ExtrudeGeometry(bird, { depth: 0.02, bevelEnabled: false }), M.gilt, -0.01, 0.1, 0.05, 0, -Math.PI / 2, 0, 1.5);
    V.done(vane);
    this.th = 0; this.w = 0; this.wind = 1.2; this.spun = 0; this.tick = 0; this.creak = 0;
  },
  active(k) { const p = k.pos; return !!this.at && near2(p, this.at.x, this.at.z) < 40 * 40; },
  update(dt, k) {
    const p = k.pos, v = k.v, dx = p.x - this.at.x, dz = p.z - this.at.z, r2 = dx * dx + dz * dz;
    // The wind wanders; the vane swings round to it.
    this.wind += Math.sin(performance.now() / 9000) * dt * 0.05;
    let d = this.wind - this.th; d = Math.atan2(Math.sin(d), Math.cos(d));
    this.w += d * 1.6 * dt; this.w *= Math.exp(-0.55 * dt);
    // Struck by something flying through it: spun the way it was going.
    if (v.kind === 'drone' && Math.abs(p.y - this.hub) < 0.4 && r2 < 0.95 * 0.95 && r2 > 0.01) {
      const sx = Math.sin(this.th), sz = Math.cos(this.th), off = Math.abs(dx * sz - dz * sx);
      if (off < 0.3) { const want = 1.6 * (v.vel.x * dz - v.vel.z * dx) / Math.max(r2, 0.12); if (Math.abs(want) > Math.abs(this.w) || Math.sign(want) !== Math.sign(this.w)) this.w += (want - this.w) * 0.5; if (Math.abs(want) > 1.5 && (this.creak -= dt) < 0) { this.creak = 0.3; k.synth.noise(0.12, { vol: 0.05, lp: 2200 }); } }
    }
    this.w = Math.max(-28, Math.min(28, this.w));
    const was = this.th; this.th += this.w * dt;
    if (Math.floor(was / Math.PI) !== Math.floor(this.th / Math.PI) && Math.abs(this.w) > 2) k.synth.note(1900, 0.05, { type: 'square', vol: 0.012 });
    this.vane.rotation.y = this.th;
    if (Math.abs(this.w) > 4) this.spun += Math.abs(this.w) * dt; else this.spun = Math.max(0, this.spun - dt * 3);
    if (this.spun > 3 * TAU) { this.spun = 0; k.synth.chime([523, 784, 1047]); if (k.find('roofvane')) k.callout('SPUN THE VANE'); }
    if (r2 < 6 * 6 && Math.abs(p.y - this.at.y) < 6) k.once('roofvane', v.kind === 'drone' ? 'A weather vane. Fly through it.' : 'A weather vane, out of reach of wheels.', 4);
  },
  spots() { return this.at ? [{ kind: 'secret', id: 'roofvane', name: 'Weather vane (drone: spin it three times round)', ...this.at }] : []; },
});

// ---------------------------------------------------------------- the telescope
// On a tripod at the north end of the conservation wing. Look through it and steer: the far things of the night
// are named as they come into the middle of the glass. All five for the secret.
feature({
  id: 'roofscope',
  secrets: [['roofscope', 'Through the telescope']],
  init(k) {
    const x = 77.0, z = -1.6, y = k.roofAt(x, z), P = k.plan, mw = k.museum.mw;
    if (!(y > 15 && y < 17)) return;
    const M = mats(), G = k.parts(), brass = lit(0xc8a050, { metalness: 0.7, roughness: 0.3, glow: 0.45 });
    this.at = { x, y, z }; this.eye = new THREE.Vector3(x, y + 1.1, z);
    for (let i = 0; i < 3; i++) { const a = i * TAU / 3; G.add(new THREE.CylinderGeometry(0.018, 0.025, 1.12, 6), M.wood, x + Math.sin(a) * 0.22, y + 0.52, z + Math.cos(a) * 0.22, Math.cos(a) * 0.38, 0, -Math.sin(a) * 0.38); }
    G.add(new THREE.CylinderGeometry(0.05, 0.05, 0.08, 10), M.dark, x, y + 1.02, z);
    G.done(k.group);
    k.plan.obstacles.push({ x0: x - 0.32, x1: x + 0.32, z0: z - 0.32, z1: z + 0.32, y0: y, y1: y + 1.25 });
    const head = this.head = new THREE.Group(); head.position.set(x, y + 1.08, z); k.group.add(head);
    const tube = this.tube = new THREE.Group(); head.add(tube);
    const T = k.parts();
    T.add(new THREE.CylinderGeometry(0.06, 0.075, 0.95, 16), brass, 0, 0.02, 0.15, Math.PI / 2, 0, 0);
    T.add(new THREE.CylinderGeometry(0.085, 0.085, 0.08, 16), M.dark, 0, 0.02, 0.62, Math.PI / 2, 0, 0);
    T.add(new THREE.CylinderGeometry(0.025, 0.03, 0.14, 10), M.dark, 0, 0.02, -0.38, Math.PI / 2, 0, 0);
    T.add(new THREE.BoxGeometry(0.03, 0.08, 0.05), M.dark, 0, -0.02, 0);
    T.done(tube);
    // What there is to find from here.
    const L = P.lakefront, out = [];
    if (L && L.light) out.push({ name: 'The harbour light', x: L.light.x, y: 6, z: L.light.z });
    if (L && L.ballpark) out.push({ name: 'The ballpark', x: L.ballpark.hx + 30, y: 2, z: L.ballpark.hz + 30 });
    if (P.grounds && P.grounds.tree) out.push({ name: 'The Christmas tree', x: P.grounds.tree.x, y: (P.grounds.tree.h || 10) * 0.5, z: P.grounds.tree.z });
    if (mw && mw.shade) out.push({ name: 'The flying carpet', x: (mw.shade.x0 + mw.shade.x1) / 2, y: mw.shade.y, z: (mw.shade.z0 + mw.shade.z1) / 2 });
    if (mw && mw.E && mw.A) out.push({ name: 'The Bridgeway', x: (mw.E.x + mw.A.x) / 2, y: (mw.E.y + mw.A.y) / 2, z: (mw.E.z + mw.A.z) / 2 });
    this.marks = out.map(m => ({ ...m, dir: new THREE.Vector3(m.x - this.eye.x, m.y - this.eye.y, m.z - this.eye.z).normalize() }));
    this.tally = k.tally('roofscope', this.marks.length);
    this.yaw = 2.4; this.pitch = 0.05; this.dir = new THREE.Vector3(); this.cam = { at: new THREE.Vector3(), look: new THREE.Vector3() };
    this._aim();
  },
  _aim() {
    const c = Math.cos(this.pitch); this.dir.set(Math.sin(this.yaw) * c, Math.sin(this.pitch), Math.cos(this.yaw) * c);
    this.head.rotation.y = this.yaw; this.tube.rotation.x = -this.pitch;
  },
  near(v, k) {
    if (!this.at) return null;
    if (this.on) return { verb: 'BACK', hint: '', act: () => this.leave(k) };
    if (!k.close(this.at, 1.4, 1.3)) return null;
    return { verb: 'LOOK', hint: 'Look through the telescope.', act: () => this.enter(k) };
  },
  enter(k) {
    this.on = true; this.seen = null;
    if (!this.ui) {
      const d = this.ui = document.createElement('div'); d.setAttribute('data-roofscope', '');
      d.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:20;background:radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 0, rgba(0,0,0,0) 30vmin, rgba(4,6,10,.94) 31vmin);display:flex;align-items:flex-end;justify-content:center';
      const cross = document.createElement('div'); cross.style.cssText = 'position:absolute;left:50%;top:50%;width:5vmin;height:5vmin;margin:-2.5vmin 0 0 -2.5vmin;border:1px solid rgba(240,230,200,.45);border-radius:50%';
      const lab = this.label = document.createElement('div'); lab.style.cssText = 'margin-bottom:calc(50vh - 27vmin);font:italic 600 20px Georgia,serif;color:#f1e6c8;text-shadow:0 1px 4px #000;min-height:1.4em';
      d.append(cross, lab); document.body.append(d);
    }
    this.ui.hidden = false; this.label.textContent = '';
    k.hold((dt, inp) => {
      const turn = (inp.steer || 0) + (inp.yaw || 0) + (inp.roll || 0), tilt = (inp.throttle || 0) + (inp.pitch || 0) + (inp.climb || 0);
      this.yaw -= Math.max(-1, Math.min(1, turn)) * 0.7 * dt; this.pitch = Math.max(-0.25, Math.min(0.5, this.pitch + Math.max(-1, Math.min(1, tilt)) * 0.45 * dt));
      this._aim();
    });
    k.once('roofscope', 'Steer to look round. Five things out there have names.', 5);
  },
  leave(k) { this.on = false; if (this.ui) this.ui.hidden = true; k.hold(null); },
  update(dt, k) {
    if (!this.on) return;
    const e = this.eye, ZOOM = 28;
    this.cam.at.copy(e).addScaledVector(this.dir, ZOOM); this.cam.look.copy(e).addScaledVector(this.dir, ZOOM + 60);
    k.camClose = this.cam;
    let hit = null; for (const m of this.marks) if (m.dir.dot(this.dir) > 0.9985) { hit = m; break; }
    if (hit !== this.seen) {
      this.seen = hit; this.label.textContent = hit ? hit.name : '';
      if (hit && this.tally.add(hit.name)) { k.synth.chime([659, 988], { gap: 0.1, dur: 0.6 }); if (this.tally.done && k.find('roofscope')) k.callout('EVERYTHING IN VIEW'); }
    }
  },
  reset(k) { if (this.on) this.leave(k); },
  spots() { return this.at ? [{ kind: 'secret', id: 'roofscope', name: 'Telescope (find all five named places)', ...this.at }] : []; },
});

// ---------------------------------------------------------------- join the stars
// Seven stars hung low over the bridge. Fly through them in order and they join up: the Plough. Then another figure.
const FIGURES = [
  { name: 'THE PLOUGH', pts: [[0, 0], [1.2, 0.5], [2.3, 0.6], [3.3, 0.3], [4.6, 0.75], [4.4, -0.55], [3.2, -0.75], [3.3, 0.3]] },
  { name: 'CASSIOPEIA', pts: [[0, 0.2], [1.1, -0.7], [2.2, 0.1], [3.2, -0.8], [4.4, 0.4]] },
];
feature({
  id: 'roofstars',
  secrets: [['roofstars', 'Join the stars']],
  init(k) {
    const top = k.roofAt(118, 110);
    if (!(top > 12 && top < 13.5)) return;
    this.top = top; this.at = { x: 120, y: top, z: 110 };
    const glow = canvasTex(64, 64, (g) => { const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.2, 'rgba(255,245,220,.8)'); r.addColorStop(0.5, 'rgba(160,190,255,.18)'); r.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); }, 1, 1, false);
    this.stars = []; this.links = [];
    for (let i = 0; i < 8; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: 0xffffff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
      s.scale.setScalar(1.1); s.visible = false; k.group.add(s); this.stars.push(s);
      const l = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1, 6, 1, true), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.55, 0.75, 1.4), transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
      l.visible = false; k.group.add(l); this.links.push(l);
    }
    this.fig = 0; this.next = 0; this.wait = 0; this.sparks = k.puffs(60, { color: 0xbfd6ff, size: 0.16 });
    this.v0 = new THREE.Vector3(); this.v1 = new THREE.Vector3(); this.up = new THREE.Vector3(0, 1, 0);
    this.lay();
  },
  // Lay out the current figure in the air over the bridge.
  lay() {
    const f = FIGURES[this.fig];
    this.pos = f.pts.map(([sx, sy]) => new THREE.Vector3(103 + sx * 7.4, this.top + 4.6 + sy * 2.4 + sx * 0.35, 110 + sy * 3.2));
    this.stars.forEach((s, i) => { const q = this.pos[i]; s.visible = !!q && this.pos.findIndex(o => o.equals(q)) === i; if (q) s.position.copy(q); s.material.color.setRGB(0.8, 0.85, 1); });
    this.links.forEach(l => { l.visible = false; });
    this.idx = this.pos.map(q => this.pos.findIndex(o => o.equals(q)));        // (a figure that closes on itself comes back to a star it has had)
    this.next = 0; this.done = false;
  },
  link(i) {
    const l = this.links[i - 1], a = this.pos[i - 1], b = this.pos[i];
    this.v0.subVectors(b, a); const len = this.v0.length();
    l.position.copy(a).addScaledVector(this.v0, 0.5); l.scale.set(1, len, 1); l.quaternion.setFromUnitVectors(this.up, this.v0.normalize()); l.visible = true;
  },
  active(k) { const p = k.pos; return !!this.at && near2(p, this.at.x, this.at.z) < 50 * 50; },
  update(dt, k) {
    const p = k.pos, t = performance.now() / 1000;
    if (near2(p, this.at.x, this.at.z) < 30 * 30) k.once('roofstars', k.v.kind === 'drone' ? 'Stars, low over the roof. Fly through them in order.' : 'Stars, low over the roof. Only a drone can reach them.', 5);
    if (this.wait > 0) { this.wait -= dt; if (this.wait <= 0) { this.fig = (this.fig + 1) % FIGURES.length; this.lay(); } this.sparks.update(dt); return; }
    const n = this.pos.length, g = this.pos[this.next], ni = g ? this.idx[this.next] : -1;
    for (let i = 0; i < this.stars.length; i++) { const s = this.stars[i]; if (!s.visible) continue; s.scale.setScalar(i === ni ? 1.1 + 0.35 * Math.sin(t * 5) : i < this.next || this.done ? 1.25 : 0.8 + 0.1 * Math.sin(t * 2 + i)); }
    if (g && p.distanceToSquared(g) < 0.85 * 0.85) {
      this.stars[ni].material.color.setRGB(1.4, 1.25, 0.9);
      k.synth.note(523.25 * Math.pow(2, [0, 2, 4, 7, 9, 12, 14, 12][this.next] / 12), 0.9, { type: 'sine', vol: 0.06 });
      this.sparks.emit(g.x, g.y, g.z, 8, { spread: 0.3, up: 0.2, out: 0.6 });
      if (this.next > 0) this.link(this.next);
      this.next++;
      if (this.next >= n) {
        this.done = true; this.wait = 6; k.synth.chime([523, 659, 784, 1047, 1319], { gap: 0.11, dur: 2 });
        for (const q of this.pos) this.sparks.emit(q.x, q.y, q.z, 6, { spread: 0.4, up: 0.3, out: 0.8 });
        if (this.fig === 0 && k.find('roofstars')) k.callout(FIGURES[0].name); else k.callout(FIGURES[this.fig].name);
      }
    }
    this.sparks.update(dt);
  },
  reset() { if (this.pos) { this.fig = 0; this.wait = 0; this.lay(); } },
  spots() { return this.at ? [{ kind: 'secret', id: 'roofstars', name: 'Stars over the bridge (drone: join them in order)', ...this.at }] : []; },
});

// ---------------------------------------------------------------- pigeons
// Four flocks: on the bridge's parapet, on the edge of the Rice Building, on the conservation wing, and over Columbus Drive. They go up
// when anything comes near, wheel round, and come back down when it has gone.
const FLOCKS = [{ id: 'bridge', a: [113, 100.25], b: [123, 100.25], face: Math.PI }, { id: 'rice', a: [151.5, 137], b: [151.5, 146], face: -Math.PI / 2 }, { id: 'north', a: [89.2, 28], b: [89.2, 37], face: Math.PI / 2 }, { id: 'columbus', a: [228, 92.8], b: [237, 92.8], face: Math.PI }];
feature({
  id: 'roofpigeons',
  secrets: [['roofpigeons', 'Every pigeon up']],
  init(k) {
    const M = mats(), grey = lit(0x8a8f9a, { glow: 0.45 }), wingM = lit(0x6f7684, { side: THREE.DoubleSide, glow: 0.45 });
    const BP = k.parts();
    BP.add(new THREE.SphereGeometry(0.09, 10, 8), grey, 0, 0.1, 0, 0, 0, 0, 0.85, 0.8, 1.5);
    BP.add(new THREE.SphereGeometry(0.055, 8, 6), grey, 0, 0.19, 0.12);
    BP.add(new THREE.ConeGeometry(0.014, 0.05, 5), grey, 0, 0.185, 0.18, Math.PI / 2, 0, 0);
    BP.add(new THREE.BoxGeometry(0.1, 0.015, 0.12), grey, 0, 0.1, -0.17, 0.25, 0, 0);
    const bodyG = BP.done()[0].geometry;
    const wingG = new THREE.BufferGeometry(); wingG.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0.06, 0.32, 0.1, -0.02, 0, 0, -0.08, 0, 0, 0.06, -0.32, 0.1, -0.02, 0, 0, -0.08], 3)); wingG.computeVertexNormals();
    this.tally = k.tally('roofpigeons', FLOCKS.length);
    this.flocks = [];
    const O = new THREE.Object3D();
    for (const f of FLOCKS) {
      const y = k.roofAt((f.a[0] + f.b[0]) / 2, (f.a[1] + f.b[1]) / 2); if (!(y > 10)) continue;
      const n = 9, body = new THREE.InstancedMesh(bodyG, grey, n), wing = new THREE.InstancedMesh(wingG, wingM, n);
      body.frustumCulled = wing.frustumCulled = false;
      const birds = [];
      for (let i = 0; i < n; i++) {
        const t = (i + 0.3 * Math.sin(i * 7.1)) / (n - 1), x = f.a[0] + (f.b[0] - f.a[0]) * t, z = f.a[1] + (f.b[1] - f.a[1]) * t, yaw = f.face + Math.sin(i * 3.7) * 0.6;
        birds.push({ hx: x, hy: y, hz: z, hyaw: yaw, x, y, z, yaw, ph: Math.random() * TAU, R: 4 + Math.random() * 4, h: 2.5 + Math.random() * 4, w: (Math.random() > 0.5 ? 1 : -1) * (0.9 + Math.random() * 0.6), a: Math.random() * TAU, rest: true });
        O.position.set(x, y, z); O.rotation.set(0, yaw, 0); O.scale.set(1, 1, 1); O.updateMatrix(); body.setMatrixAt(i, O.matrix);
        O.position.y = y + 0.11; O.scale.set(0.35, -0.3, 0.6); O.updateMatrix(); wing.setMatrixAt(i, O.matrix);
        const shade = 0.8 + 0.4 * ((i * 0.618) % 1); body.setColorAt(i, new THREE.Color(shade, shade, shade * 1.04)); wing.setColorAt(i, new THREE.Color(shade, shade, shade));
      }
      k.group.add(body, wing);
      this.flocks.push({ ...f, y, cx: (f.a[0] + f.b[0]) / 2, cz: (f.a[1] + f.b[1]) / 2, body, wing, birds, state: 'sit', t: 0 });
    }
    this.O = O;
  },
  active(k) { return !!this.flocks && this.flocks.length > 0; },
  update(dt, k) {
    const p = k.pos, O = this.O;
    for (const f of this.flocks) {
      const d2 = near2(p, f.cx, f.cz), close = d2 < 4.2 * 4.2 && Math.abs(p.y - f.y) < 4;
      if (f.state === 'sit') {
        if (!close) continue;
        f.state = 'fly'; f.t = 0;
        for (const b of f.birds) { b.a = Math.atan2(b.z - f.cz, b.x - f.cx); b.rest = false; }
        for (let i = 0; i < 5; i++) k.synth.noise(0.06, { vol: 0.05, lp: 1400, at: i * 0.05 });
        if (this.tally.add(f.id) && this.tally.done && k.find('roofpigeons')) k.callout('PIGEONS UP');
      } else if (d2 > 80 * 80) {                                    // far off: put them straight back
        f.state = 'sit'; for (let i = 0; i < f.birds.length; i++) { const b = f.birds[i]; b.x = b.hx; b.y = b.hy; b.z = b.hz; b.yaw = b.hyaw; b.rest = true; this.place(f, i, b, 0); }
        f.body.instanceMatrix.needsUpdate = f.wing.instanceMatrix.needsUpdate = true; continue;
      }
      if (f.state === 'sit') continue;
      f.t += dt;
      const home = f.t > 9 && !close && d2 > 7 * 7;
      let allDown = true;
      for (let i = 0; i < f.birds.length; i++) {
        const b = f.birds[i];
        if (b.rest) { this.place(f, i, b, 0); continue; }
        allDown = false;
        let tx, ty, tz;
        if (!home) { b.a += b.w * dt; tx = f.cx + Math.cos(b.a) * b.R; tz = f.cz + Math.sin(b.a) * b.R; ty = f.y + b.h + Math.sin(f.t * 1.3 + i) * 0.5; }
        else { tx = b.hx; ty = b.hy; tz = b.hz; }
        const dx = tx - b.x, dy = ty - b.y, dz = tz - b.z, dd = Math.hypot(dx, dy, dz), sp = Math.min(dd, (home ? 4 : 7) * dt);
        if (dd > 1e-4) { b.x += dx / dd * sp; b.y += dy / dd * sp; b.z += dz / dd * sp; if (Math.abs(dx) + Math.abs(dz) > 0.02) b.yaw = Math.atan2(dx, dz); }
        if (home && dd < 0.05) { b.rest = true; b.x = b.hx; b.y = b.hy; b.z = b.hz; b.yaw = b.hyaw; }
        b.ph += dt * (home && dd < 1.5 ? 10 : 17);
        this.place(f, i, b, Math.cos(b.ph));
      }
      f.body.instanceMatrix.needsUpdate = f.wing.instanceMatrix.needsUpdate = true;
      if (allDown) f.state = 'sit';
    }
    void O;
  },
  place(f, i, b, flap) {
    const O = this.O; O.position.set(b.x, b.y, b.z); O.rotation.set(0, b.yaw, 0); O.scale.set(1, 1, 1); O.updateMatrix(); f.body.setMatrixAt(i, O.matrix);
    O.position.y = b.y + 0.11; if (b.rest) O.scale.set(0.35, -0.3, 0.6); else O.scale.set(1, flap, 1); O.updateMatrix(); f.wing.setMatrixAt(i, O.matrix);
  },
  spots() { return (this.flocks || []).map(f => ({ kind: 'secret', id: 'roofpigeons', name: 'Pigeons (' + f.id + ')', x: f.cx, y: f.y, z: f.cz })); },
});

// ---------------------------------------------------------------- the lost kite
// Caught on the north-west corner of the Modern Wing's sunshade, its tail hanging. Fly the drone into it and it is
// yours, on its string; take it up high.
feature({
  id: 'roofkite',
  secrets: [['roofkite', 'The lost kite']],
  init(k) {
    const S = k.museum.mw && k.museum.mw.shade; if (!S) return;
    const hx = S.x0 - 0.7, hy = S.y - 1.3, hz = S.z0 + 6;
    this.home = new THREE.Vector3(hx, hy, hz); this.snag = new THREE.Vector3(S.x0 + 0.1, S.y - 0.1, hz - 0.4);
    const kite = this.kite = new THREE.Group(); k.group.add(kite);
    const cols = [0xd8332b, 0xf2c230, 0x2a6fd8, 0xf2efe6], tri = (a, b, c) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([...a, ...b, ...c], 3)); g.computeVertexNormals(); return g; };
    const T = [0, 0.55, 0], B = [0, -0.75, 0], Lf = [-0.42, 0.1, 0], R = [0.42, 0.1, 0], C = [0, 0.1, 0.03];
    [[T, Lf, C], [T, C, R], [Lf, B, C], [C, B, R]].forEach((f, i) => kite.add(new THREE.Mesh(tri(...f), lit(cols[i], { side: THREE.DoubleSide, glow: 0.55 }))));
    const stick = lit(0x5a3a1a), s1 = new THREE.Mesh(new THREE.BoxGeometry(0.015, 1.3, 0.015), stick), s2 = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.015, 0.015), stick);
    s1.position.set(0, -0.1, 0.02); s2.position.set(0, 0.1, 0.02); kite.add(s1, s2);
    // The tail: bows on a line, each following the one before.
    this.tail = []; const bowG = new THREE.BoxGeometry(0.16, 0.05, 0.01);
    for (let i = 0; i < 8; i++) { const m = new THREE.Mesh(bowG, lit(cols[i % 3], { glow: 0.6 })); k.group.add(m); this.tail.push({ m, p: new THREE.Vector3(hx, hy - 0.8 - i * 0.3, hz) }); }
    this.lineG = new THREE.BufferGeometry(); this.lineP = new Float32Array(17 * 3); this.lineG.setAttribute('position', new THREE.BufferAttribute(this.lineP, 3));
    this.line = new THREE.Line(this.lineG, new THREE.LineBasicMaterial({ color: 0xe8e4d8, transparent: true, opacity: 0.8 })); this.line.frustumCulled = false; k.group.add(this.line);
    this.vel = new THREE.Vector3(); this.tmp = new THREE.Vector3(); this.want = new THREE.Vector3();
    this.at = { x: hx, y: hy, z: hz };
    this.reset();
  },
  reset() {
    if (!this.kite) return;
    this.held = false; this.kite.position.copy(this.home); this.kite.rotation.set(0.3, Math.PI / 2, 0.5); this.vel.set(0, 0, 0);
    this.tail.forEach((b, i) => b.p.set(this.home.x, this.home.y - 0.8 - i * 0.3, this.home.z));
    this.string(this.snag);
  },
  string(from) {
    const a = from, b = this.kite.position, n = 16;
    for (let i = 0; i <= n; i++) { const t = i / n; this.lineP[i * 3] = a.x + (b.x - a.x) * t; this.lineP[i * 3 + 1] = a.y + (b.y - a.y) * t - Math.sin(t * Math.PI) * Math.min(1.2, a.distanceTo(b) * 0.08); this.lineP[i * 3 + 2] = a.z + (b.z - a.z) * t; }
    this.lineG.attributes.position.needsUpdate = true;
  },
  active(k) { if (!this.kite) return false; const p = k.pos; return this.held || near2(p, this.home.x, this.home.z) < 60 * 60; },
  update(dt, k) {
    const p = k.pos, v = k.v, K = this.kite.position, t = performance.now() / 1000;
    if (!this.held) {
      this.kite.rotation.z = 0.5 + Math.sin(t * 1.7) * 0.12;
      if (near2(p, this.home.x, this.home.z) < 14 * 14 && Math.abs(p.y - this.home.y) < 8) k.once('roofkite', 'A kite, caught in the sunshade.', 4);
      if (v.kind === 'drone' && p.distanceToSquared(K) < 1.0) { this.held = true; k.synth.chime([523, 784], { gap: 0.1 }); k.say('Got it. Now take it up high.', 3.5); }
    } else {
      // On its string: downwind of the toy and above it, tugging and swaying.
      const L = 5.5, wind = this.tmp.set(-0.8, 0, 0.35).normalize(), climb = 0.9 + Math.min(0.5, v.vel.length() * 0.08);
      this.want.copy(p).addScaledVector(wind, L * Math.cos(climb)).add(this.tmp.set(Math.sin(t * 0.9) * 0.6, L * Math.sin(climb) + Math.sin(t * 1.3) * 0.3, Math.cos(t * 0.7) * 0.5));
      this.want.y = Math.max(this.want.y, p.y + 0.5);
      this.vel.addScaledVector(this.tmp.subVectors(this.want, K), 6 * dt); this.vel.multiplyScalar(Math.exp(-2.5 * dt)); K.addScaledVector(this.vel, dt);
      if (K.distanceTo(p) > L * 1.3) K.sub(p).setLength(L * 1.3).add(p);
      this.kite.lookAt(p.x, p.y, p.z); this.kite.rotateX(-0.6); this.kite.rotateZ(Math.sin(t * 2.1) * 0.25);
      if (K.y > 34 && k.find('roofkite')) k.callout('HIGH AS A KITE');
    }
    // The tail follows.
    let prev = this.tmp.copy(K).add(this.want.set(0, -0.62, 0));
    for (const b of this.tail) { this.want.copy(prev); this.want.y -= 0.26; b.p.lerp(this.want, Math.min(1, dt * 9)); b.m.position.copy(b.p); b.m.rotation.set(0, t * 2 + b.p.x, 0.3); prev = b.p; }
    this.string(this.held ? p : this.snag);
  },
  spots() { return this.at ? [{ kind: 'secret', id: 'roofkite', name: 'Kite in the sunshade (drone: free it, fly it above 34 m)', ...this.at }] : []; },
});
