// Fireworks from the roof of the Modern Wing's west pavilion (features.js): a wooden rack of six cardboard mortar tubes
// on the terrace where the glass lift comes up, their fuses run to a lead, and the lead to a plunger box. Push the plunger
// (LAUNCH) and a short show goes up over Monroe Street, Millennium Park and the lake: peonies, rings, gold willows that
// droop and crackle, crossettes that split, palms, then a finale of salutes and a gold crown. Each shell thumps out of
// its tube and whistles up; its bang comes a beat after its flash, as far off as it is. The sparks are small and hard,
// each drawn with a short streak behind it. Sit still and the camera turns to watch; drive off and it lets you go.
// Nothing is done per frame when no show is running.
import * as THREE from 'three';
import { feature } from './features.js';
import { fitText, SANS, rng } from './textures.js';

const MAX = 6000;                 // sparks at once
const GRAV = 9.8;
const STREAK = 0.05;              // seconds of travel each spark's streak shows
const HOT = 1.3;                  // how far over white a spark burns: more, and the bloom pass turns every burst to fog
const PAL = [[1.0, 0.35, 0.3], [0.35, 0.8, 1.0], [1.0, 0.85, 0.35], [0.5, 1.0, 0.45], [0.95, 0.45, 1.0], [1.0, 1.0, 1.0], [1.0, 0.6, 0.2]];

// Small hard sparks: a white-hot core, a sharp edge, and a cap on size so a near one is never a blob.
const V = `attribute float aSize; attribute vec3 aCol; attribute float aA; varying vec3 vC; varying float vA;
void main() { vC = aCol; vA = aA; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = clamp(aSize * (340.0 / max(1.0, -mv.z)), 1.5, 6.0); gl_Position = projectionMatrix * mv; }`;
const F = `varying vec3 vC; varying float vA;
void main() { vec2 d = gl_PointCoord - 0.5; float r = length(d) * 2.0; if (r > 1.0) discard;
  float edge = 1.0 - smoothstep(0.6, 1.0, r), core = 1.0 - smoothstep(0.0, 0.45, r);
  gl_FragColor = vec4((vC + vec3(0.5) * core) * vA * edge, 1.0); }`;

const canvas = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
// Kraft-paper mortar tubes, spiral-wound, with a printed band.
const tubeTex = () => canvas(128, 256, (g, w, h) => {
  const r = rng(57); g.fillStyle = '#9c7446'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '60,38,18' : '200,160,110'},${r() * 0.12})`; g.fillRect(r() * w, r() * h, 1 + r() * 3, 1); }
  g.strokeStyle = 'rgba(60,40,20,0.45)'; g.lineWidth = 1.5; for (let y = -h; y < h * 2; y += 22) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y + 40); g.stroke(); }
  g.fillStyle = '#b8242a'; g.fillRect(0, 24, w, 30); g.fillStyle = '#f2e6c8'; g.fillRect(0, 58, w, 6);
  g.fillStyle = '#141414'; g.fillRect(0, h - 26, w, 26);
});
// The board on its stake.
const signTex = () => canvas(256, 192, (g, w, h) => {
  g.fillStyle = '#f2c21a'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#c4161c'; g.fillRect(0, 0, w, 58);
  g.fillStyle = '#fff'; fitText(g, 'DANGER', { x: w / 2, y: 30, w: w - 30, h: 44, px: 46, weight: '900', family: SANS });
  g.fillStyle = '#111'; fitText(g, 'FIREWORKS', { x: w / 2, y: 98, w: w - 28, h: 44, px: 44, weight: '900', family: SANS });
  fitText(g, 'KEEP BACK', { x: w / 2, y: 150, w: w - 60, h: 34, px: 30, weight: '700', family: SANS });
  g.strokeStyle = '#111'; g.lineWidth = 6; g.strokeRect(3, 3, w - 6, h - 6);
});
// The plunger box's face: varnished wood with its maker's plate.
const boxTex = () => canvas(128, 128, (g, w, h) => {
  const r = rng(12); g.fillStyle = '#6a3c1c'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 40; i++) { g.strokeStyle = `rgba(${r() < 0.5 ? '40,20,8' : '150,90,45'},${0.15 + r() * 0.2})`; g.lineWidth = 1 + r() * 2; g.beginPath(); const y = r() * h; g.moveTo(0, y); g.bezierCurveTo(w * 0.3, y + (r() - 0.5) * 10, w * 0.7, y + (r() - 0.5) * 10, w, y + (r() - 0.5) * 6); g.stroke(); }
  g.fillStyle = '#c4161c'; g.fillRect(18, 44, w - 36, 40); g.fillStyle = '#fff'; fitText(g, 'DANGER', { x: w / 2, y: 64, w: w - 48, h: 28, px: 24, weight: '900', family: SANS });
});

feature({
  id: 'fireworks',
  secrets: [['fireworks', 'Fireworks over the park']],
  init(k) {
    const T = k.museum.mw && k.museum.mw.terrace; if (!T) return;
    this.k = k; this.T = T; this.run = null; this.t = 0; this.live = 0; this.cool = 0; this.press = 0; this.pressTo = 0;
    // The rack: near the terrace's north-west corner, the far end of the north side from the glass lift.
    const L = k.museum.mw.lift, lx = L ? (L.x0 + L.x1) / 2 : T.x1, ends = [T.x1 - 1.3, T.x0 + 1.6];
    const cx = Math.abs(ends[0] - lx) > Math.abs(ends[1] - lx) ? ends[0] : ends[1], cz = T.z0 + 1.4, y = T.y, side = cx < (T.x0 + T.x1) / 2 ? 1 : -1;
    this.crate = { x: cx, z: cz, y };
    const O = k.plan.obstacles, P = k.parts();
    const wood = new THREE.MeshStandardMaterial({ color: 0xa8784a, roughness: 0.85, emissive: 0x3a2412, emissiveIntensity: 0.6 });
    const tt = tubeTex(), tubeM = new THREE.MeshStandardMaterial({ map: tt, roughness: 0.9, emissiveMap: tt, emissive: new THREE.Color(0.45, 0.4, 0.38), emissiveIntensity: 0.55 });
    const dark = new THREE.MeshBasicMaterial({ color: 0x080606 });
    const fuseM = new THREE.MeshStandardMaterial({ color: 0x3f8a3a, roughness: 0.6, emissive: 0x1a4018, emissiveIntensity: 0.7 });
    const red = new THREE.MeshStandardMaterial({ color: 0xc8242a, roughness: 0.5, emissive: 0x5a1010, emissiveIntensity: 0.7 });
    const black = new THREE.MeshStandardMaterial({ color: 0x18181a, roughness: 0.5, emissive: 0x0a0a0c, emissiveIntensity: 0.6 });
    const steel = new THREE.MeshStandardMaterial({ color: 0xb8bec6, roughness: 0.35, metalness: 0.5, emissive: 0x4a5058, emissiveIntensity: 0.7 });
    const brass = new THREE.MeshStandardMaterial({ color: 0xc89a40, roughness: 0.35, metalness: 0.5, emissive: 0x5a4010, emissiveIntensity: 0.7 });
    const B = (w, h, d) => new THREE.BoxGeometry(w, h, d);
    // a wooden rack: runners on the paving, two ladder frames the tubes stand through, corner posts and end braces
    const RW = 0.96, RD = 0.5, TUBE = 0.055, LEN = 0.56, TILT = 0.08;
    for (const z of [-RD / 2 + 0.03, RD / 2 - 0.03]) P.add(B(RW + 0.1, 0.06, 0.07), wood, cx, y + 0.03, cz + z);
    for (const fy of [0.13, 0.43]) {
      for (const z of [-RD / 2 + 0.03, RD / 2 - 0.03]) P.add(B(RW, 0.035, 0.05), wood, cx, y + fy, cz + z);
      for (const x of [-RW / 2 + 0.02, -RW / 6, RW / 6, RW / 2 - 0.02]) P.add(B(0.05, 0.035, RD - 0.02), wood, cx + x, y + fy, cz);
    }
    for (const x of [-RW / 2 + 0.02, RW / 2 - 0.02]) for (const z of [-RD / 2 + 0.03, RD / 2 - 0.03]) P.add(B(0.045, 0.46, 0.045), wood, cx + x, y + 0.23, cz + z);
    for (const x of [-RW / 2 + 0.02, RW / 2 - 0.02]) P.add(B(0.03, 0.56, 0.035), wood, cx + x, y + 0.27, cz, Math.atan2(RD - 0.06, 0.4), 0, 0);
    this.tubes = [];
    const tubeG = new THREE.CylinderGeometry(TUBE, TUBE, LEN, 18, 1, true), endG = new THREE.CircleGeometry(TUBE * 0.94, 16).rotateX(-Math.PI / 2), rimG = new THREE.TorusGeometry(TUBE, 0.006, 6, 18).rotateX(Math.PI / 2);
    const fuseCurves = [];
    for (let i = 0; i < 6; i++) {
      const tx = -RW / 3 + (i % 3) * RW / 3, tz = i < 3 ? -0.11 : 0.11, mx = cx + tx, mz = cz + tz, ty = y + 0.04 + LEN / 2, lean = -TILT - (i < 3 ? 0.03 : 0), splay = tx * 0.12;
      const m = new THREE.Matrix4().compose(new THREE.Vector3(mx, ty, mz), new THREE.Quaternion().setFromEuler(new THREE.Euler(lean, 0, -splay)), new THREE.Vector3(1, 1, 1));
      P.add(tubeG, tubeM, m);
      const top = new THREE.Vector3(0, LEN / 2, 0).applyMatrix4(m), inner = new THREE.Vector3(0, LEN / 2 - 0.05, 0).applyMatrix4(m);
      const tm = new THREE.Matrix4().compose(top, new THREE.Quaternion().setFromEuler(new THREE.Euler(lean, 0, -splay)), new THREE.Vector3(1, 1, 1));
      P.add(rimG, black, tm); P.add(endG, dark, new THREE.Matrix4().compose(inner, new THREE.Quaternion().setFromEuler(new THREE.Euler(lean, 0, -splay)), new THREE.Vector3(1, 1, 1)));
      this.tubes.push(top.clone());
      // its fuse: out of the mouth, over the rim, down the south face to the chain
      const s = i < 3 ? -1 : 1, lip = top.clone().add(new THREE.Vector3(0, 0.02, s * TUBE * 0.6));
      fuseCurves.push(new THREE.CatmullRomCurve3([top.clone().add(new THREE.Vector3(0, -0.03, s * TUBE * 0.3)), lip, lip.clone().add(new THREE.Vector3(0.01, -0.04, s * 0.05)), new THREE.Vector3(mx + 0.02, y + 0.3, cz + s * (RD / 2 + 0.01)), new THREE.Vector3(mx + 0.05, y + 0.1, cz + s * (RD / 2 + 0.02))]));
    }
    for (const c of fuseCurves) P.add(new THREE.TubeGeometry(c, 16, 0.0045, 5), fuseM);
    // the chain along both long faces, joined at the east end, and the lead from there to the plunger box
    for (const s of [-1, 1]) P.add(new THREE.CylinderGeometry(0.005, 0.005, RW - 0.1, 5).rotateZ(Math.PI / 2), fuseM, cx + 0.05, y + 0.1, cz + s * (RD / 2 + 0.02));
    const dx = cx + side * 1.3, dz = cz + 1.05;
    this.det = { x: dx, z: dz };
    const joint = new THREE.Vector3(cx + side * (RW / 2 + 0.08), y + 0.02, cz + RD / 2 + 0.05);
    P.add(new THREE.CylinderGeometry(0.005, 0.005, RD + 0.04, 5).rotateX(Math.PI / 2), fuseM, joint.x, y + 0.1, cz);
    P.add(B(0.05, 0.03, 0.04), red, joint.x, y + 0.025, joint.z);
    const leadPts = [joint, new THREE.Vector3(joint.x + side * 0.25, y + 0.008, joint.z + 0.25), new THREE.Vector3(dx - side * 0.5, y + 0.008, dz - 0.25), new THREE.Vector3(dx - side * 0.25, y + 0.008, dz + 0.05), new THREE.Vector3(dx - side * 0.09, y + 0.19, dz - 0.04)];
    for (const [off, mat] of [[0.007, red], [-0.007, black]]) P.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(leadPts.map(p => p.clone().add(new THREE.Vector3(0, 0, off)))), 40, 0.006, 5), mat);
    // the warning sign, on a stake at the near corner
    const sx = cx - side * 0.15, sz = cz + RD / 2 + 0.55, st = signTex();
    P.add(B(0.03, 0.62, 0.03), wood, sx, y + 0.31, sz);
    P.add(B(0.34, 0.26, 0.012), wood, sx, y + 0.5, sz - 0.022);
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.24), new THREE.MeshStandardMaterial({ map: st, roughness: 0.6, emissiveMap: st, emissive: new THREE.Color(0.8, 0.8, 0.8), emissiveIntensity: 0.55 }));
    sign.position.set(sx, y + 0.5, sz - 0.015); sign.matrixAutoUpdate = false; sign.updateMatrix(); k.group.add(sign);
    O.push({ x0: sx - 0.03, x1: sx + 0.03, z0: sz - 0.035, z1: sz + 0.02, y0: y, y1: y + 0.63 });
    O.push({ x0: sx - 0.17, x1: sx + 0.17, z0: sz - 0.03, z1: sz - 0.015, y0: y + 0.37, y1: y + 0.63 });
    // the plunger box: wood, brass corners and terminals, the rod and its T-handle
    const bt = boxTex(), boxM = new THREE.MeshStandardMaterial({ map: bt, roughness: 0.55, emissiveMap: bt, emissive: new THREE.Color(0.55, 0.5, 0.48), emissiveIntensity: 0.55 });
    const BW = 0.26, BD = 0.18, BH = 0.2;
    const plain = new THREE.MeshStandardMaterial({ color: 0x6a3c1c, roughness: 0.55, emissive: 0x2a160a, emissiveIntensity: 0.6 });
    const body = new THREE.Mesh(B(BW, BH, BD), [plain, plain, plain, plain, boxM, boxM]); body.position.set(dx, y + BH / 2, dz); body.matrixAutoUpdate = false; body.updateMatrix(); k.group.add(body);      // the plate on the long faces only
    P.add(B(BW + 0.012, 0.012, BD + 0.012), brass, dx, y + BH, dz); P.add(B(BW + 0.012, 0.02, BD + 0.012), black, dx, y + 0.01, dz);
    for (const ex of [-1, 1]) for (const ez of [-1, 1]) P.add(B(0.014, BH - 0.02, 0.014), brass, dx + ex * BW / 2, y + BH / 2, dz + ez * BD / 2);
    for (const ex of [-1, 1]) { P.add(new THREE.CylinderGeometry(0.011, 0.011, 0.03, 10), brass, dx + ex * 0.09, y + BH + 0.015, dz - 0.05); P.add(new THREE.CylinderGeometry(0.016, 0.016, 0.006, 10), brass, dx + ex * 0.09, y + BH + 0.024, dz - 0.05); }
    P.add(new THREE.CylinderGeometry(0.025, 0.03, 0.02, 14), steel, dx, y + BH + 0.01, dz + 0.02);
    P.done(k.group).forEach(m => { m.matrixAutoUpdate = false; m.updateMatrix(); });
    // the handle moves: a group of its own
    const hg = this.handle = new THREE.Group(); hg.position.set(dx, y + BH, dz + 0.02); k.group.add(hg);
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.24, 10), steel); rod.position.y = 0.1; hg.add(rod);
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.16, 12).rotateZ(Math.PI / 2), wood); bar.position.y = 0.22; hg.add(bar);
    for (const s of [-1, 1]) { const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.05, 12).rotateZ(Math.PI / 2), black); grip.position.set(s * 0.1, 0.22, 0); hg.add(grip); }
    this.UP = 0; this.DOWN = -0.16;
    // Solid as drawn: the rack (its frame, tubes and all), the box, and the handle where it stands.
    O.push({ x0: cx - RW / 2 - 0.05, x1: cx + RW / 2 + 0.05, z0: cz - RD / 2 - 0.02, z1: cz + RD / 2 + 0.03, y0: y, y1: y + 0.66 });
    O.push({ x0: dx - BW / 2 - 0.007, x1: dx + BW / 2 + 0.007, z0: dz - BD / 2 - 0.007, z1: dz + BD / 2 + 0.007, y0: y, y1: y + BH + 0.03 });
    this.handleBox = { x0: dx - 0.125, x1: dx + 0.125, z0: dz + 0.02 - 0.022, z1: dz + 0.02 + 0.022, y0: y + BH + 0.2, y1: y + BH + 0.24 };
    this.rodBox = { x0: dx - 0.012, x1: dx + 0.012, z0: dz + 0.008, z1: dz + 0.032, y0: y + BH, y1: y + BH + 0.22 };
    O.push(this.handleBox, this.rodBox);
    // The sparks: one pool, drawn as small hard points, each with a short streak.
    this.P = new Float32Array(MAX * 3); this.Vv = new Float32Array(MAX * 3); this.C = new Float32Array(MAX * 3); this.S = new Float32Array(MAX); this.A = new Float32Array(MAX);
    this.life = new Float32Array(MAX); this.max = new Float32Array(MAX); this.drag = new Float32Array(MAX); this.kind = new Uint8Array(MAX); this.n = 0;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.P, 3)); geo.setAttribute('aCol', new THREE.BufferAttribute(this.C, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(this.S, 1)); geo.setAttribute('aA', new THREE.BufferAttribute(this.A, 1));
    geo.setDrawRange(0, 0); this.geo = geo;
    const pts = this.pts = new THREE.Points(geo, new THREE.ShaderMaterial({ vertexShader: V, fragmentShader: F, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    pts.frustumCulled = false; pts.renderOrder = 6; pts.visible = false; k.group.add(pts);
    this.LP = new Float32Array(MAX * 6); this.LC = new Float32Array(MAX * 6);
    const lg = this.lgeo = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.BufferAttribute(this.LP, 3)); lg.setAttribute('color', new THREE.BufferAttribute(this.LC, 3)); lg.setDrawRange(0, 0);
    const lines = this.lines = new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    lines.frustumCulled = false; lines.renderOrder = 6; lines.visible = false; k.group.add(lines);
    this.shells = [];
  },

  near(v, k) {
    if (!this.crate || this.run) return null;
    const p = k.pos, d = this.det;
    if (Math.abs(p.y - this.crate.y) > 1.2 || (Math.hypot(p.x - d.x, p.z - d.z) > 1.4 && Math.hypot(p.x - this.crate.x, p.z - this.crate.z) > 1.8)) return null;
    if (this.cool > 0) return { verb: 'WAIT', hint: 'Reloading the tubes…', act: () => {} };
    return { verb: 'LAUNCH', hint: 'Fireworks. E to push the plunger.', act: () => this.start(k) };
  },

  start(k) {
    // A programme of about 22 s: singles, pairs, then a finale. [time, kind, target x offset, height, colour]
    const r = Math.random, kinds = ['peony', 'ring', 'willow', 'crossette', 'palm'], prog = [], col = () => Math.floor(r() * PAL.length);
    let t = 1.0;
    for (let i = 0; i < 6; i++) { prog.push([t, kinds[i % kinds.length], (r() - 0.5) * 50, 50 + r() * 20, col()]); t += 1.1 + r() * 0.5; }
    for (let i = 0; i < 4; i++) { for (let j = 0; j < 2; j++) prog.push([t + j * 0.2, kinds[Math.floor(r() * kinds.length)], (j ? 1 : -1) * (10 + r() * 20), 50 + r() * 20, col()]); t += 1.1 + r() * 0.4; }
    t += 0.5;
    // the finale: a barrage, salutes cracking through it, then a gold crown over everything
    for (let i = 0; i < 24; i++) prog.push([t + i * 0.11, i % 4 === 3 ? 'salute' : i % 3 ? 'peony' : 'willow', (r() - 0.5) * 70, 52 + r() * 25, col()]);
    const t2 = t + 24 * 0.11 + 0.35;
    prog.push([t2, 'salute', -24, 60, 5], [t2 + 0.08, 'salute', 24, 62, 5], [t2 + 0.2, 'salute', 0, 66, 5], [t2 + 0.45, 'brocade', 0, 84, 2]);
    this.run = { t: 0, prog, i: 0, end: t2 + 0.45 + 1.9 + 3.0 };
    this.pts.visible = this.lines.visible = true;
    this.pressTo = 1;
    k.synth.noise(0.08, { vol: 0.08, lp: 900 }); k.synth.note(110, 0.15, { type: 'square', vol: 0.03 });
    k.callout('FIREWORKS!');
    k.say('Fire in the hole… stand well back.', 0.3, 3.5);
  },

  active(k) { return !!(this.run || this.live > 0 || this.shells.length || this.cool > 0 || this.press !== this.pressTo); },

  update(dt, k) {
    this.t += dt; if (this.cool > 0) this.cool -= dt;
    // the plunger: down hard, up slowly
    if (this.press !== this.pressTo) {
      this.press = this.pressTo > this.press ? Math.min(1, this.press + dt / 0.18) : Math.max(0, this.press - dt / 1.2);
      const h = this.UP + (this.DOWN - this.UP) * this.press; this.handle.position.y = this.crate.y + 0.2 + h; this.handle.updateMatrix();
      const hb = this.handleBox, base = this.crate.y + 0.2; hb.y0 = base + 0.2 + h; hb.y1 = base + 0.24 + h; this.rodBox.y1 = base + 0.22 + h;
    }
    const R = this.run;
    if (R) {
      R.t += dt;
      while (R.i < R.prog.length && R.prog[R.i][0] <= R.t) { this._launch(k, R.prog[R.i]); R.i++; }
      // Sit still and the camera turns to watch: from behind the rack, up over the park.
      const v = k.v, sp = Math.hypot(v.vel.x, v.vel.z), c = this.crate;
      if (sp < 0.4 && Math.hypot(k.pos.x - c.x, k.pos.z - c.z) < 6) k.camClose = { at: { x: c.x + (c.x < (this.T.x0 + this.T.x1) / 2 ? 1.2 : -1.2), y: c.y + 3.7, z: c.z + 3.2 }, look: { x: c.x + 30, y: c.y + 50, z: c.z - 85 } };      // just over the pergola: nothing overhead, the screen below
      if (R.t > R.end) {
        this.run = null; this.cool = 4; this.pressTo = 0;
        if (k.find('fireworks')) k.callout('FIREWORKS OVER THE PARK');
      }
    }
    // shells on their way up: a bright head and a short trail, then the burst
    for (let i = this.shells.length - 1; i >= 0; i--) {
      const s = this.shells[i]; s.t += dt;
      s.vy -= GRAV * 0.35 * dt; s.x += s.vx * dt; s.y += s.vy * dt; s.z += s.vz * dt;
      if (Math.random() < 0.8) this._spark(s.x, s.y, s.z, (Math.random() - 0.5) * 0.6, -1 - Math.random(), (Math.random() - 0.5) * 0.6, [1, 0.72, 0.38], 0.3 + Math.random() * 0.2, 0.8, 2, 0);
      if (s.t >= s.T) { this._burst(k, s); this.shells.splice(i, 1); }
    }
    this._step(dt);
  },

  _launch(k, [, kind, ox, h, ci]) {
    const tube = this.tubes[Math.floor(Math.random() * this.tubes.length)], c = this.crate;
    // over the park and the lake: north (-z) of the pavilion, a little east
    const tx = c.x + 30 + ox, tz = c.z - 70 - Math.random() * 30, ty = c.y + h, T = 1.5 + Math.random() * 0.4;
    const vy = (ty - tube.y) / T + 0.5 * GRAV * 0.35 * T;
    this.shells.push({ x: tube.x, y: tube.y, z: tube.z, vx: (tx - tube.x) / T, vy, vz: (tz - tube.z) / T, t: 0, T, kind, ci });
    const S = k.synth; S.noise(0.12, { vol: 0.09, lp: 420 }); S.note(70, 0.12, { type: 'sine', vol: 0.09 });
    this._whistle(k, T);
    for (let i = 0; i < 10; i++) this._spark(tube.x, tube.y, tube.z, (Math.random() - 0.5) * 1.5, 2 + Math.random() * 3, (Math.random() - 0.5) * 1.5, [1, 0.8, 0.5], 0.35, 0.6, 1.5, 0);
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
    const sphere = (n, sp, life, size, drag, kind, c2) => { for (let i = 0; i < n; i++) { const u = R() * 2 - 1, a = R() * Math.PI * 2, q = Math.sqrt(1 - u * u), f = sp * (0.88 + R() * 0.24); this._spark(x, y, z, q * Math.cos(a) * f, u * f, q * Math.sin(a) * f, c2 || col, life * (0.8 + R() * 0.4), size, drag, kind); } };
    if (s.kind === 'peony') { sphere(220, 22, 1.7, 1.25, 1.1, 0); sphere(50, 9, 1.1, 1.0, 1.4, 0, [1, 1, 1]); }
    else if (s.kind === 'ring') {
      const n = new THREE.Vector3(R() - 0.5, 0.6 + R() * 0.4, R() - 0.5).normalize(), e1 = new THREE.Vector3(1, 0, 0).cross(n).normalize(), e2 = n.clone().cross(e1);
      for (let i = 0; i < 110; i++) { const a = i / 110 * Math.PI * 2, f = 23; this._spark(x, y, z, (e1.x * Math.cos(a) + e2.x * Math.sin(a)) * f, (e1.y * Math.cos(a) + e2.y * Math.sin(a)) * f, (e1.z * Math.cos(a) + e2.z * Math.sin(a)) * f, col, 1.7, 1.3, 1.0, 0); }
      sphere(30, 6, 0.9, 1.0, 1.5, 0, PAL[(s.ci + 2) % PAL.length]);
    }
    else if (s.kind === 'willow') sphere(200, 17, 3.2, 1.05, 2.4, 1, [1, 0.72, 0.28]);
    else if (s.kind === 'brocade') { sphere(340, 22, 3.6, 1.2, 1.7, 1, [1, 0.78, 0.32]); sphere(80, 9, 1.4, 1.4, 1.2, 0, [1, 1, 1]); }
    else if (s.kind === 'salute') sphere(140, 26, 0.35, 1.6, 2.5, 0, [1, 1, 1]);
    else if (s.kind === 'crossette') sphere(18, 17, 0.85, 1.6, 0.6, 2);
    else { for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2; for (let j = 0; j < 12; j++) { const f = 11 + j * 1.1; this._spark(x, y, z, Math.cos(a) * f * 0.8, 8 + j * 0.4, Math.sin(a) * f * 0.8, col, 2.0, 1.3, 1.6, 0); } } }
    // the bang, late by the distance: louder for a salute; a crackle after a willow or the crown
    const d = Math.hypot(x - k.pos.x, y - k.pos.y, z - k.pos.z), at = Math.min(0.6, d / 343), S = k.synth, big = s.kind !== 'crossette', sal = s.kind === 'salute' || s.kind === 'brocade';
    S.noise(sal ? 0.7 : big ? 0.5 : 0.25, { vol: sal ? 0.17 : big ? 0.12 : 0.07, lp: sal ? 2600 : 1400, at }); S.note(sal ? 42 : 55, sal ? 0.6 : 0.4, { type: 'sine', vol: sal ? 0.14 : 0.1, at });
    if (s.kind === 'willow' || s.kind === 'brocade') for (let i = 0; i < (s.kind === 'brocade' ? 22 : 10); i++) S.noise(0.03, { vol: 0.03, lp: 6000, at: at + 0.8 + i * 0.1 + R() * 0.08 });
  },
  _spark(x, y, z, vx, vy, vz, col, life, size, drag, kind) {
    if (this.n >= MAX) return;
    const i = this.n++;
    this.P[i * 3] = x; this.P[i * 3 + 1] = y; this.P[i * 3 + 2] = z;
    this.Vv[i * 3] = vx; this.Vv[i * 3 + 1] = vy; this.Vv[i * 3 + 2] = vz;
    this.C[i * 3] = col[0] * HOT; this.C[i * 3 + 1] = col[1] * HOT; this.C[i * 3 + 2] = col[2] * HOT;
    this.life[i] = this.max[i] = life; this.S[i] = size; this.A[i] = 1; this.drag[i] = drag; this.kind[i] = kind;
  },
  _step(dt) {
    let n = this.n;
    for (let i = 0; i < n; i++) {
      this.life[i] -= dt;
      if (this.life[i] <= 0) {
        // a crossette's star splits into four as it dies
        if (this.kind[i] === 2) { const x = this.P[i * 3], y = this.P[i * 3 + 1], z = this.P[i * 3 + 2]; this.kind[i] = 0; for (let j = 0; j < 4; j++) { const a = j / 4 * Math.PI * 2 + Math.random(); this._spark(x, y, z, Math.cos(a) * 7, (Math.random() - 0.3) * 4, Math.sin(a) * 9, [this.C[i * 3] / HOT, this.C[i * 3 + 1] / HOT, this.C[i * 3 + 2] / HOT], 0.9, 1.1, 1.2, 0); } }
        n = --this.n;
        this._copy(n, i); i--; continue;
      }
      const dr = Math.exp(-this.drag[i] * dt), g = this.kind[i] === 1 ? GRAV * 0.35 : GRAV * 0.5;
      this.Vv[i * 3] *= dr; this.Vv[i * 3 + 1] = this.Vv[i * 3 + 1] * dr - g * dt; this.Vv[i * 3 + 2] *= dr;
      this.P[i * 3] += this.Vv[i * 3] * dt; this.P[i * 3 + 1] += this.Vv[i * 3 + 1] * dt; this.P[i * 3 + 2] += this.Vv[i * 3 + 2] * dt;
      const f = this.life[i] / this.max[i];
      this.A[i] = this.kind[i] === 1 ? Math.min(1, f * 1.6) * (0.7 + 0.3 * Math.sin(this.t * 30 + i)) : f * f * (0.75 + 0.25 * Math.sin(this.t * 24 + i * 1.7));
    }
    n = this.n;
    // each spark's streak: from where it is back along the way it came, fading to nothing
    const LP = this.LP, LC = this.LC, P = this.P, Vv = this.Vv, C = this.C, A = this.A;
    for (let i = 0; i < n; i++) {
      const j = i * 6, q = i * 3, a = A[i] * 0.8;
      LP[j] = P[q]; LP[j + 1] = P[q + 1]; LP[j + 2] = P[q + 2];
      LP[j + 3] = P[q] - Vv[q] * STREAK; LP[j + 4] = P[q + 1] - Vv[q + 1] * STREAK; LP[j + 5] = P[q + 2] - Vv[q + 2] * STREAK;
      LC[j] = C[q] * a; LC[j + 1] = C[q + 1] * a; LC[j + 2] = C[q + 2] * a; LC[j + 3] = LC[j + 4] = LC[j + 5] = 0;
    }
    this.live = n;
    const gq = this.geo; gq.setDrawRange(0, n);
    for (const nm of ['position', 'aCol', 'aSize', 'aA']) { const a = gq.attributes[nm]; a.needsUpdate = true; a.clearUpdateRanges && a.clearUpdateRanges(); a.addUpdateRange && a.addUpdateRange(0, n * a.itemSize); }
    const lg = this.lgeo; lg.setDrawRange(0, n * 2);
    for (const nm of ['position', 'color']) { const a = lg.attributes[nm]; a.needsUpdate = true; a.clearUpdateRanges && a.clearUpdateRanges(); a.addUpdateRange && a.addUpdateRange(0, n * 6); }
    if (!n && !this.run && !this.shells.length) this.pts.visible = this.lines.visible = false;
  },
  _copy(from, to) {
    if (from === to) return;
    for (let c = 0; c < 3; c++) { this.P[to * 3 + c] = this.P[from * 3 + c]; this.Vv[to * 3 + c] = this.Vv[from * 3 + c]; this.C[to * 3 + c] = this.C[from * 3 + c]; }
    this.life[to] = this.life[from]; this.max[to] = this.max[from]; this.S[to] = this.S[from]; this.A[to] = this.A[from]; this.drag[to] = this.drag[from]; this.kind[to] = this.kind[from];
  },
});
