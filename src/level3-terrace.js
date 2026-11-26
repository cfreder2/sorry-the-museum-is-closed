// Level 3: the Bluhm Family Terrace, Terzo Piano and its kitchen (features.js; the galleries are in level3.js).
// The terrace is open on its west side now (survey/modern-wing.json): snow has blown in across the paving, and beyond
// the glass the city and the railway. Strings of lights, heaters, a steel ring to drive through, snow to roll into a
// snowman, and a coin viewer that looks up the Bridgeway into Millennium Park. Through the doors, Terzo Piano: ring at
// the kitchen pass and run the plate to the table that is laid for eleven o'clock.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { feature } from './features.js';
import { TAU, std, metal, glowMat, canvasTex, lathe, glow, spot, block, rnd, ease } from './level3kit.js';

const T = 'MW3-terrace';
const once = (k, key, text, hold = 4) => k.once('l3-' + key, text, hold);
const snowMat = (o = {}) => new THREE.MeshStandardMaterial({ color: 0xf4f7fb, roughness: 0.95, emissive: 0x9fb2cc, emissiveIntensity: 0.32, ...o });

// ================================================================ the terrace itself: snow, glass, lights, heaters
feature({
  id: 'l3terrace',
  init(k) {
    const r = k.plan.byId[T]; if (!r) return;
    const y = r.y, P = k.plan, W = r.x1 - r.x0, D = r.z1 - r.z0;
    // Snow blown in from the open side: deep and white along the glass, thinning to bare paving by the far wall.
    const snowTex = canvasTex(256, 512, (g, w, h) => {
      const R = rnd(31);
      for (let x = 0; x < w; x++) { const f = x / w, a = Math.max(0, Math.min(1, 1.15 - f * 1.35)); g.fillStyle = `rgba(244,247,251,${a})`; g.fillRect(x, 0, 1, h); }
      for (let i = 0; i < 4000; i++) { const x = Math.pow(R(), 1.6) * w, yy = R() * h; g.fillStyle = `rgba(255,255,255,${0.5 * R() * (1 - x / w)})`; g.fillRect(x, yy, 1 + R() * 2, 1); }
      for (let i = 0; i < 140; i++) { const x = w * (0.35 + R() * 0.6), yy = R() * h; g.fillStyle = `rgba(240,244,250,${0.06 + R() * 0.12})`; g.beginPath(); g.ellipse(x, yy, 2 + R() * 6, 6 + R() * 18, 0, 0, TAU); g.fill(); }
    });
    const lift = (P.lifts || []).filter(l => l.room === T), cuts = [];
    // the floor of snow, in strips that leave the lift's platform clear
    const xs = [r.x0, r.x1], zs = [r.z0, r.z1]; for (const l of lift) { xs.push(l.x0 - 0.05, l.x1 + 0.05); zs.push(l.z0 - 0.05, l.z1 + 0.05); }
    xs.sort((a, b) => a - b); zs.sort((a, b) => a - b);
    const sg = [];
    for (let i = 0; i < xs.length - 1; i++) for (let j = 0; j < zs.length - 1; j++) {
      const x0 = xs[i], x1 = xs[i + 1], z0 = zs[j], z1 = zs[j + 1], cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
      if (x1 - x0 < 0.01 || z1 - z0 < 0.01 || lift.some(l => cx > l.x0 - 0.05 && cx < l.x1 + 0.05 && cz > l.z0 - 0.05 && cz < l.z1 + 0.05)) continue;
      const g = new THREE.PlaneGeometry(x1 - x0, z1 - z0); g.rotateX(-Math.PI / 2); g.translate(cx, y + 0.012, cz);
      const uv = g.attributes.uv, pos = g.attributes.position; for (let q = 0; q < uv.count; q++) uv.setXY(q, (pos.getX(q) - r.x0) / W, 1 - (pos.getZ(q) - r.z0) / D);
      sg.push(g);
    }
    const snow = new THREE.MeshStandardMaterial({ map: snowTex, transparent: true, depthWrite: false, roughness: 0.95, emissive: 0x8fa4c0, emissiveIntensity: 0.35, emissiveMap: snowTex, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    for (const g of sg) { const m = new THREE.Mesh(g, snow); m.renderOrder = 1; k.group.add(m); }
    // Snow lying on whatever stands out here low enough to catch it: tables, planters, benches.
    const caps = [];
    for (const o of P.obstacles) {
      if (o.x1 < r.x0 || o.x0 > r.x1 || o.z1 < r.z0 || o.z0 > r.z1 || o.y0 > y + 0.1 || o.y1 < y + 0.3 || o.y1 > y + 1.3) continue;
      const w = o.x1 - o.x0, d = o.z1 - o.z0; if (w > 6 || d > 6 || w < 0.2 || d < 0.2) continue;
      const near = Math.max(0, 1 - (((o.x0 + o.x1) / 2) - r.x0) / (W * 0.9));
      const g = new THREE.CapsuleGeometry(0.5, 1, 3, 10); g.rotateZ(Math.PI / 2); g.scale((w - 0.04) / 2, 0.012 + 0.03 * near, d - 0.04); g.translate((o.x0 + o.x1) / 2, o.y1 + 0.005, (o.z0 + o.z1) / 2); caps.push(g);
    }
    if (caps.length) k.group.add(new THREE.Mesh(mergeGeometries(caps), snowMat()));
    // The glass along the open side: panes waist high and a little more, a steel rail on top, posts between.
    const glass = new THREE.MeshStandardMaterial({ color: 0xcfe3ee, transparent: true, opacity: 0.18, roughness: 0.05, metalness: 0.1, emissive: 0x223844, depthWrite: false, side: THREE.DoubleSide, forceSinglePass: true });      // (both sides in one go, not two)
    const steel = metal(0xb8bec4, { roughness: 0.3 }), gx = r.x0 + 0.04, gh = 1.15;
    const pane = new THREE.Mesh(new THREE.PlaneGeometry(D, gh), glass); pane.rotation.y = Math.PI / 2; pane.position.set(gx, y + gh / 2, r.z0 + D / 2); k.group.add(pane);
    const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, D, 10), steel); rail.rotation.x = Math.PI / 2; rail.position.set(gx, y + gh + 0.03, r.z0 + D / 2); k.group.add(rail);
    const posts = new THREE.InstancedMesh(new THREE.BoxGeometry(0.04, gh, 0.06), steel, Math.ceil(D / 1.6) + 1); let pi = 0; const M = new THREE.Matrix4();
    for (let z = r.z0 + 0.05; z <= r.z1; z += 1.6) posts.setMatrixAt(pi++, M.makeTranslation(gx, y + gh / 2, Math.min(z, r.z1 - 0.05))); posts.count = pi; k.group.add(posts);
    const sill = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, D), snowMat()); sill.position.set(gx + 0.02, y + 0.04, r.z0 + D / 2); k.group.add(sill);
    // Strings of lights, from tall posts along the glass to the far wall and back, sagging between.
    const poleH = 3.3, N = Math.max(3, Math.round(D / 9)), poles = [];
    for (let i = 0; i <= N; i++) { const z = r.z0 + 0.6 + (D - 1.2) * i / N; poles.push(z); const p = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, poleH, 8), metal(0x30343a)); p.position.set(r.x0 + 0.35, y + poleH / 2, z); k.group.add(p); block(k, r.x0 + 0.35, z, 0.05, 0.05, y, y + poleH); }
    const bulbs = [], cord = [];
    const string = (a, b, sag) => { const n = Math.max(6, Math.round(a.distanceTo(b) / 0.5)); let prev = null; for (let i = 0; i <= n; i++) { const t = i / n, p = a.clone().lerp(b, t); p.y -= Math.sin(t * Math.PI) * sag; if (prev) cord.push(prev.x, prev.y, prev.z, p.x, p.y, p.z); if (i > 0 && i < n) bulbs.push(p.clone()); prev = p; } };
    for (let i = 0; i < poles.length; i++) {
      const a = new THREE.Vector3(r.x0 + 0.35, y + poleH - 0.05, poles[i]);
      const zE = i < poles.length - 1 ? (poles[i] + poles[i + 1]) / 2 : poles[i] - 4;
      string(a, new THREE.Vector3(r.x1 - 0.1, y + 3.7, Math.max(r.z0 + 0.5, Math.min(r.z1 - 0.5, zE))), 0.7);
      if (i < poles.length - 1) string(new THREE.Vector3(r.x1 - 0.1, y + 3.7, zE), new THREE.Vector3(r.x0 + 0.35, y + poleH - 0.05, poles[i + 1]), 0.7);
    }
    const cg = new THREE.BufferGeometry(); cg.setAttribute('position', new THREE.Float32BufferAttribute(cord, 3)); k.group.add(new THREE.LineSegments(cg, new THREE.LineBasicMaterial({ color: 0x1a1a1a })));
    const bi = new THREE.InstancedMesh(new THREE.SphereGeometry(0.035, 8, 6), glowMat(0xffd9a0), bulbs.length);
    bulbs.forEach((p, i) => bi.setMatrixAt(i, M.makeTranslation(p.x, p.y - 0.03, p.z))); k.group.add(bi);
    this.bulbs = bi;
    // Heaters: tall mushrooms with a red glow in the cage.
    this.heaters = [];
    for (const fz of [0.22, 0.52, 0.82]) {
      const s = spot(k, T, 0.62, fz, 0.45, 1.6); if (!s) continue;
      const g = new THREE.Group(); g.position.set(s.x, y, s.z); k.group.add(g);
      const dark = metal(0x3a3d42, { roughness: 0.4 });
      g.add(new THREE.Mesh(lathe([[0.26, 0], [0.26, 0.05], [0.2, 0.09], [0.05, 0.12], [0.04, 1.75], [0.07, 1.8]], 24), dark));
      const cage = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.32, 16, 1, true), new THREE.MeshBasicMaterial({ color: 0xff5a1a, toneMapped: false, side: THREE.DoubleSide })); cage.position.y = 1.97; g.add(cage);
      const hood = new THREE.Mesh(lathe([[0.04, 0.0], [0.42, -0.12], [0.43, -0.14], [0.05, -0.02]], 28), metal(0xc0c4c8, { side: THREE.DoubleSide })); hood.position.y = 2.28; g.add(hood);
      const gl = glow(1.6, 0xff6a2a, 0.5); gl.position.y = 1.97; g.add(gl);
      block(k, s.x, s.z, 0.22, 0.22, y, y + 2.3);
      this.heaters.push({ x: s.x, z: s.z, gl });
    }
    this.hum = k.loop({ type: 'noise', lp: 500 });
    this.y = y; this.t = 0;
  },
  active(k) { return !!this.heaters && k.inRoom(T, 2); },
  update(dt, k) {
    this.t += dt;
    once(k, 'terrace', 'Snow has blown in across the terrace.', 4);
    let near = 9;
    for (const h of this.heaters) { h.gl.material.opacity = 0.45 + Math.sin(this.t * 7 + h.x) * 0.05; near = Math.min(near, Math.hypot(k.pos.x - h.x, k.pos.z - h.z)); }
    this.hum.set(near < 2.5 ? 0.025 * (1 - near / 2.5) : 0);
  },
  reset() { if (this.hum) this.hum.set(0); },
});

// ================================================================ snow falling past the open side
feature({
  id: 'l3snowfall',
  init(k) {
    const r = k.plan.byId[T]; if (!r) return;
    const N = 1400, P = new Float32Array(N * 3), S = new Float32Array(N), R = rnd(7);
    for (let i = 0; i < N; i++) { const inside = R() < 0.22; P[i * 3] = inside ? r.x0 + Math.pow(R(), 2) * 3 : r.x0 - 0.3 - R() * 7; P[i * 3 + 1] = R() * 7; P[i * 3 + 2] = r.z0 - 2 + R() * (r.z1 - r.z0 + 4); S[i] = R(); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('seed', new THREE.BufferAttribute(S, 1));
    const mat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { uT: { value: 0 }, uY: { value: r.y - 0.2 } },
      vertexShader: 'attribute float seed; uniform float uT; uniform float uY; varying float vA; void main(){ vec3 p = position; float sp = 0.35 + seed * 0.4; p.y = uY + mod(p.y - uT * sp, 7.0); p.x += sin(uT * 0.6 + seed * 40.0) * 0.35 + uT * 0.0; p.z += cos(uT * 0.4 + seed * 23.0) * 0.3; vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_PointSize = clamp((0.014 + seed * 0.018) * 520.0 / -mv.z, 1.0, 7.0); vA = 0.55 + seed * 0.45; gl_Position = projectionMatrix * mv; }',
      fragmentShader: 'varying float vA; void main(){ vec2 d = gl_PointCoord - 0.5; float a = smoothstep(0.5, 0.1, length(d)) * vA; gl_FragColor = vec4(0.95, 0.97, 1.0, a); }' });
    const pts = new THREE.Points(g, mat); pts.frustumCulled = false; pts.visible = false; k.group.add(pts);
    this.pts = pts; this.mat = mat;
  },
  active(k) { const on = !!this.pts && k.inRoom(T, 8); if (this.pts) this.pts.visible = on; return on; },
  update(dt) { this.mat.uniforms.uT.value += dt; },
});

// ================================================================ a steel ring to drive through
feature({
  id: 'l3ring',
  init(k) {
    const r = k.plan.byId[T]; if (!r) return;
    const s = spot(k, T, 0.35, 0.36, 1.1, 1.6); if (!s) return;
    const R = 0.95, g = new THREE.Group(); g.position.set(s.x, r.y + R - 0.04, s.z); k.group.add(g);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(R, 0.075, 18, 72), metal(0xd6dade, { roughness: 0.12, metalness: 0.95, emissiveIntensity: 0.3 })); g.add(ring);
    const cap = new THREE.Mesh(new THREE.TorusGeometry(R, 0.078, 8, 36, Math.PI * 0.5), snowMat()); cap.rotation.z = Math.PI * 0.25; cap.scale.set(1, 1, 0.9); cap.position.y = 0.012; g.add(cap);
    for (const sx of [-1, 1]) block(k, s.x + sx * R, s.z, 0.1, 0.1, r.y, r.y + 2 * R);
    Object.assign(this, { x: s.x, z: s.z, y: r.y, R, side: 0, glow: 0, ring });
  },
  active(k) { return this.x != null && k.inRoom(T, 1) && Math.abs(k.pos.z - this.z) < 4; },
  update(dt, k) {
    const p = k.pos, n = p.z - this.z, side = Math.sign(n) || 1;
    if (this.side && side !== this.side && Math.abs(p.x - this.x) < this.R - 0.15) { k.synth.chime([659, 988, 1319], { gap: 0.07, vol: 0.05 }); this.glow = 1; }
    this.side = Math.abs(n) < 1 ? side : 0;
    this.glow = Math.max(0, this.glow - dt); this.ring.material.emissiveIntensity = 0.3 + this.glow * 1.2;
  },
});

// ================================================================ the snowman
// Three snowballs, small. They grow as they roll. Push a smaller one into a big one and it goes up on top; a third for the
// head. Deck the Hall (a Welsh air, these words 1862) when he has a face.
const DECK = 'C5:1.5 Bb4:.5 A4 G4 | F4 G4 A4 F4 | G4:.5 A4:.5 Bb4:.5 G4:.5 A4:1.5 G4:.5 | F4 E4 F4:2';
function ballGeo() {
  const g = new THREE.SphereGeometry(1, 28, 20), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), n = 1 + Math.sin(x * 9 + y * 4) * Math.sin(z * 7 - y * 5) * 0.035 + Math.sin(x * 23 + z * 19) * 0.012; p.setXYZ(i, x * n, y * n, z * n); }
  g.computeVertexNormals(); return g;
}
feature({
  id: 'l3snowman',
  secrets: [['l3snowman', 'A snowman on the terrace']],
  init(k) {
    const r = k.plan.byId[T]; if (!r) return;
    const geo = ballGeo(), mat = snowMat({ roughness: 1, emissiveIntensity: 0.4 });
    this.balls = [[0.25, 0.62], [0.3, 0.72], [0.2, 0.86]].map(([fx, fz], i) => {
      const s = spot(k, T, fx, fz, 0.45, 1.6) || { x: r.x0 + 2 + i, z: r.z0 + 30 }, m = new THREE.Mesh(geo, mat), proxy = new THREE.Object3D();
      proxy.position.set(s.x, r.y, s.z); m.position.set(s.x, r.y + 0.09, s.z); m.scale.setScalar(0.09); k.group.add(m);
      return { m, proxy, b: k.pushable(proxy, { r: 0.09, h: 0.6, drag: 3.0 }), r: 0.09, lx: s.x, lz: s.z, sx: s.x, sz: s.z, role: null };
    });
    // the face and the rest, put on when he is finished
    const dress = new THREE.Group(); dress.visible = false; k.group.add(dress);
    const coal = std(0x111111, { roughness: 0.9 }), carrot = std(0xe0701e), stick = std(0x4a2f1a, { roughness: 0.9 }), scarf = std(0xb3242b, { roughness: 0.8 });
    Object.assign(this, { r, y: r.y, dress, coal, carrot, stick, scarf, axis: new THREE.Vector3(), q: new THREE.Quaternion(), done: false, at: { x: this.balls[0].sx, y: r.y, z: this.balls[0].sz } });
  },
  active(k) { return !!this.balls && k.inRoom(T, 1); },
  update(dt, k) {
    if (k.close(this.at, 4)) once(k, 'snowman', 'Snowballs. They grow as they roll.', 4);
    const B = this.balls, v = k.v;
    for (const b of B) {
      if (b.role) continue;
      b.b.o.r = b.r; b.b.step(dt);
      const p = b.proxy.position, dx = p.x - b.lx, dz = p.z - b.lz, d = Math.hypot(dx, dz);
      if (d > 1e-4) { b.r = Math.min(0.34, b.r + d * 0.011); this.axis.set(dz / d, 0, -dx / d); b.m.quaternion.premultiply(this.q.setFromAxisAngle(this.axis, d / b.r)); b.lx = p.x; b.lz = p.z; }
      b.m.position.set(p.x, this.y + b.r * 0.94, p.z); b.m.scale.setScalar(b.r);
    }
    // stacking
    let base = B.find(b => b.role === 'base'); const mid = B.find(b => b.role === 'mid');
    if (!base) for (const a of B) for (const c of B) {
      if (base || c === a || a.role || c.role) continue;
      const d = Math.hypot(a.proxy.position.x - c.proxy.position.x, a.proxy.position.z - c.proxy.position.z), sp = Math.hypot(a.b.vx, a.b.vz);
      if (d > a.r + c.r + 0.04 || sp < 0.15) continue;
      if (c.r >= 0.22 && a.r <= c.r * 0.88 && a.r >= 0.13) { c.role = 'base'; a.role = 'mid'; base = c; this.lift(k, a, c); block(k, c.proxy.position.x, c.proxy.position.z, c.r * 0.8, c.r * 0.8, this.y, this.y + c.r * 2 + a.r * 1.7); }
    }
    if (base && mid && !this.done) for (const a of B) {
      if (a.role) continue;
      const d = Math.hypot(a.proxy.position.x - base.proxy.position.x, a.proxy.position.z - base.proxy.position.z);
      if (d < a.r + base.r + 0.06 && a.r <= mid.r * 0.92 && a.r >= 0.09 && Math.hypot(a.b.vx, a.b.vz) > 0.12) { a.role = 'head'; this.lift(k, a, base, mid); this.finish(k, base, mid, a); }
    }
    for (const b of B) if (b.hop) {
      b.hop.t = Math.min(1, b.hop.t + dt * 2.2); const t = ease(b.hop.t), h = b.hop;
      b.m.position.set(h.x0 + (h.x1 - h.x0) * t, h.y0 + (h.y1 - h.y0) * t + Math.sin(t * Math.PI) * 0.25, h.z0 + (h.z1 - h.z0) * t);
      if (b.hop.t >= 1) b.hop = null;
    }
  },
  lift(k, a, base, mid) {
    const x = base.proxy.position.x, z = base.proxy.position.z, top = this.y + base.r * 1.86 + (mid ? mid.r * 1.8 : 0);
    a.hop = { t: 0, x0: a.m.position.x, y0: a.m.position.y, z0: a.m.position.z, x1: x, y1: top + a.r * 0.92, z1: z };
    k.synth.note(523, 0.15, { type: 'sine', vol: 0.05 }); k.synth.noise(0.2, { vol: 0.04, lp: 1200 });
  },
  finish(k, base, mid, head) {
    const g = this.dress; g.clear();
    const x = base.proxy.position.x, z = base.proxy.position.z, hy = this.y + base.r * 1.86 + mid.r * 1.8 + head.r * 0.92, my = this.y + base.r * 1.86 + mid.r * 0.9;
    const face = Math.atan2(k.pos.x - x, k.pos.z - z), fx = Math.sin(face), fz = Math.cos(face), sx = Math.cos(face), sz = -Math.sin(face);
    const put = (m, dx, dy, dz) => { m.position.set(x + dx, dy, z + dz); g.add(m); return m; };
    for (const s of [-1, 1]) put(new THREE.Mesh(new THREE.SphereGeometry(head.r * 0.11, 8, 6), this.coal), fx * head.r * 0.88 + sx * s * head.r * 0.35, hy + head.r * 0.25, fz * head.r * 0.88 + sz * s * head.r * 0.35);
    for (let i = 0; i < 5; i++) { const a = (i - 2) * 0.32; put(new THREE.Mesh(new THREE.SphereGeometry(head.r * 0.07, 6, 5), this.coal), fx * head.r * 0.9 * Math.cos(a) + sx * Math.sin(a) * head.r * 0.55, hy - head.r * 0.32 + Math.abs(i - 2) * head.r * 0.07, fz * head.r * 0.9 * Math.cos(a) + sz * Math.sin(a) * head.r * 0.55); }
    const nose = put(new THREE.Mesh(new THREE.ConeGeometry(head.r * 0.12, head.r * 0.7, 10), this.carrot), fx * head.r * 1.15, hy, fz * head.r * 1.15); nose.lookAt(x + fx * 5, hy, z + fz * 5); nose.rotateX(Math.PI / 2);
    for (let i = 0; i < 3; i++) put(new THREE.Mesh(new THREE.SphereGeometry(mid.r * 0.09, 6, 5), this.coal), fx * mid.r * 0.96, my + (0.35 - i * 0.35) * mid.r, fz * mid.r * 0.96);
    for (const s of [-1, 1]) {
      const arm = put(new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.018, mid.r * 2.6, 6), this.stick), sx * s * mid.r * 1.9, my + mid.r * 0.4, sz * s * mid.r * 1.9);
      arm.lookAt(x + sx * s * 9, my + mid.r * 0.4 + 4, z + sz * s * 9); arm.rotateX(Math.PI / 2);
    }
    const sc = put(new THREE.Mesh(new THREE.TorusGeometry(mid.r * 0.62, mid.r * 0.14, 8, 24), this.scarf), 0, this.y + base.r * 1.86 + mid.r * 1.72, 0); sc.rotation.x = Math.PI / 2;
    const tail = put(new THREE.Mesh(new THREE.BoxGeometry(mid.r * 0.3, mid.r * 1.0, 0.03), this.scarf), fx * mid.r * 0.7 + sx * mid.r * 0.3, my + mid.r * 0.55, fz * mid.r * 0.7 + sz * mid.r * 0.3); tail.rotation.y = face;
    setTimeout(() => { if (this.done) g.visible = true; }, 500);      // (not over snowballs that have been put back meanwhile: reset())
    this.done = true; k.tune(DECK, { bpm: 132, type: 'triangle', vol: 0.07, at: 0.6 });
    if (k.find('l3snowman')) k.callout('A SNOWMAN ON THE TERRACE');
  },
  reset() {
    if (!this.balls) return;
    for (const b of this.balls) { b.role = null; b.hop = null; b.r = 0.09; b.b.reset(); b.lx = b.sx; b.lz = b.sz; b.m.position.set(b.sx, this.y + 0.09, b.sz); b.m.scale.setScalar(0.09); }
    this.dress.visible = false; this.done = false;
  },
  spots() { return this.at ? [{ kind: 'secret', id: 'l3snowman', name: 'A snowman on the terrace (roll, then stack)', ...this.at }] : []; },
});

// ================================================================ the coin viewer
// A pair of binoculars on a post at the glass, the kind on every lookout. Pull up and look: up the Bridgeway, over Monroe
// Street, into Millennium Park.
feature({
  id: 'l3viewer',
  secrets: [['l3viewer', 'Up the Bridgeway']],
  init(k) {
    const r = k.plan.byId[T]; if (!r) return;
    const mw = k.museum.mw;
    const x = r.x0 + 0.55, z = Math.max(r.z0 + 1.2, (k.plan.lifts || []).filter(l => l.room === T).reduce((a, l) => Math.max(a, l.z1 + 1.0), r.z0 + 1.2)), y = r.y;
    const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = -Math.PI / 2 - 0.5; k.group.add(g);
    const paint = std(0x2f6b5a, { roughness: 0.45, metalness: 0.3 }), chrome = metal(0xcfd3d6, { roughness: 0.2 });
    g.add(new THREE.Mesh(lathe([[0.2, 0], [0.2, 0.04], [0.09, 0.08], [0.06, 0.12], [0.05, 0.95], [0.08, 1.0], [0.08, 1.04]], 24), paint));
    const head = new THREE.Group(); head.position.y = 1.18; head.rotation.x = -0.12; g.add(head);
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.2, 6, 16), paint); body.rotation.z = Math.PI / 2; head.add(body);
    for (const s of [-1, 1]) { const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.06, 0.26, 18), paint); tube.rotation.x = Math.PI / 2; tube.position.set(s * 0.09, 0.02, 0.02); head.add(tube); const eye = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.05, 14), std(0x111111)); eye.rotation.x = Math.PI / 2; eye.position.set(s * 0.09, 0.02, -0.13); head.add(eye); const lens = new THREE.Mesh(new THREE.CircleGeometry(0.045, 16), new THREE.MeshBasicMaterial({ color: 0x5a7a90 })); lens.position.set(s * 0.09, 0.02, 0.152); head.add(lens); }
    const yoke = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.015, 6, 20, Math.PI), chrome); yoke.rotation.z = Math.PI; yoke.position.y = -0.02; head.add(yoke);
    const coin = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.16, 0.08), chrome); coin.position.set(0, 0.85, -0.06); g.add(coin);
    block(k, x, z, 0.18, 0.18, y, y + 1.35);
    // where it looks: from out past the glass, up the bridge to its foot in the park
    const A = mw && mw.A ? mw.A : { x: 159.3, z: r.z0 - 6 }, E = mw && mw.E ? mw.E : { x: 146, z: r.z0 - 100 };
    this.eye = { x: r.x0 - 4.2, y: y + 1.6, z: r.z0 - 4.8 };
    this.target = { x: A.x - 3.3, y: y - 3.2, z: A.z - 26 };
    Object.assign(this, { x, z, y, at: { x, y, z }, view: 0, lookNow: { x: 0, y: 0, z: 0 } });
  },
  near(v, k) {
    if (this.x == null || this.view > 0 || !k.close(this.at, 0.9, 0.6)) return null;
    return { verb: 'LOOK', hint: 'A coin viewer. E to look.', act: () => this.start(k) };
  },
  start(k) {
    this.view = 9; k.synth.note(1200, 0.05, { type: 'square', vol: 0.03 }); k.synth.noise(0.3, { vol: 0.03, lp: 2500, at: 0.05 });
    if (!this.mask) {
      this.mask = document.createElement('div'); this.mask.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:20;transition:opacity .5s;opacity:0';
      this.mask.innerHTML = '<svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice"><defs><filter id="l3vb"><feGaussianBlur stdDeviation="0.9"/></filter><mask id="l3vm"><rect width="100" height="100" fill="#fff"/><g filter="url(#l3vb)"><circle cx="39" cy="50" r="17" fill="#000"/><circle cx="61" cy="50" r="17" fill="#000"/></g></mask></defs><rect width="100" height="100" fill="#000" fill-opacity=".95" mask="url(#l3vm)"/></svg>';
      document.body.append(this.mask);
    }
    requestAnimationFrame(() => { if (this.mask) this.mask.style.opacity = '1'; });
    if (k.find('l3viewer')) setTimeout(() => k.callout('UP THE BRIDGEWAY'), 1200);
  },
  stop() { this.view = 0; if (this.mask) this.mask.style.opacity = '0'; },
  active(k) { return this.x != null && (this.view > 0 || k.inRoom(T, 1)); },
  update(dt, k) {
    if (this.view <= 0) return;
    this.view -= dt;
    if (this.view <= 0 || !k.close(this.at, 1.4, 0.8)) { this.stop(); return; }
    const t = 9 - this.view, pan = Math.sin(t * 0.35) * 0.18;
    const dx = this.target.x - this.eye.x, dz = this.target.z - this.eye.z, c = Math.cos(pan), s = Math.sin(pan);
    this.lookNow.x = this.eye.x + dx * c - dz * s; this.lookNow.z = this.eye.z + dx * s + dz * c; this.lookNow.y = this.target.y;
    k.camClose = { at: this.eye, look: this.lookNow };
  },
  reset() { this.stop(); },
  spots() { return this.at ? [{ kind: 'secret', id: 'l3viewer', name: 'Up the Bridgeway (the coin viewer)', ...this.at }] : []; },
});

// ================================================================ Terzo Piano: service!
// Ring the bell at the kitchen pass and a plate of spaghetti goes on the roof. Run it through the restaurant to the table
// laid for two, before it goes cold. La donna è mobile (Verdi, 1851) when it is down.
const VERDI = 'B4:.5 B4:.5 B4:.5 D5:1 C5:.5 | A4:.5 A4:.5 A4:.5 C5:1 B4:.5 | G4:.5 G4:.5 G4:.5 B4:1 A4:.5 | F#4:1 G4:.5 G4:1.5';
function plateMesh() {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(lathe([[0, 0], [0.07, 0.003], [0.085, 0.012], [0.11, 0.02], [0.115, 0.018], [0.09, 0.008], [0.06, 0.0]], 28), std(0xf6f3ec, { roughness: 0.3 })));
  const nest = new THREE.Mesh(new THREE.TorusKnotGeometry(0.035, 0.012, 64, 6, 3, 7), std(0xe8c870, { roughness: 0.6 })); nest.rotation.x = Math.PI / 2; nest.scale.set(1, 1, 0.5); nest.position.y = 0.03; g.add(nest);
  const sauce = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 8), std(0xb3261b, { roughness: 0.35 })); sauce.scale.y = 0.45; sauce.position.y = 0.048; g.add(sauce);
  const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 6), std(0x2f7a2a)); leaf.scale.set(1.6, 0.3, 1); leaf.position.set(0.01, 0.06, 0.005); g.add(leaf);
  return g;
}
feature({
  id: 'l3service',
  secrets: [['l3service', 'Service!']],
  init(k) {
    const kit = k.plan.byId['MW3-kitchen'], terzo = k.plan.byId['MW3-terzo']; if (!kit || !terzo) return;
    const door = k.plan.doorsOf('MW3-kitchen').find(d => d.b === 'MW3-terzo' || d.a === 'MW3-terzo');
    const passAt = spot(k, 'MW3-kitchen', door ? ((door.x1 + 1.6) - kit.x0) / (kit.x1 - kit.x0) : 0.7, 0.1, 0.55, 1.0); if (!passAt) return;
    const tbl = spot(k, 'MW3-terzo', 0.5, 0.06, 0.75, 1.2) || spot(k, 'MW3-terzo', 0.2, 0.1, 0.7, 1.2); if (!tbl) return;
    const y = kit.y;
    // The pass: a steel shelf at the height of the car, under two heat lamps, with a bell.
    const steel = metal(0xc8ccd0, { roughness: 0.25 }), pass = new THREE.Group(); pass.position.set(passAt.x, y, passAt.z); k.group.add(pass);
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.03, 0.5), steel); shelf.position.y = 0.32; pass.add(shelf);
    for (const [sx, sz] of [[-0.5, -0.2], [0.5, -0.2], [-0.5, 0.2], [0.5, 0.2]]) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.32, 8), steel); l.position.set(sx, 0.16, sz); pass.add(l); }
    const top = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.03, 0.5), steel); top.position.y = 0.95; pass.add(top);
    for (const sx of [-0.25, 0.25]) { const lamp = new THREE.Mesh(lathe([[0.02, 0], [0.09, -0.08], [0.095, -0.1], [0.025, -0.02]], 20), metal(0x9a2a20, { side: THREE.DoubleSide })); lamp.position.set(sx, 0.78, 0); pass.add(lamp); const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), glowMat(0xff7a3a)); bulb.position.set(sx, 0.72, 0); pass.add(bulb); const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.16, 4), std(0x222222)); cord.position.set(sx, 0.86, 0); pass.add(cord); }
    for (const sx of [-0.53, 0.53]) { const up = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.62, 0.03), steel); up.position.set(sx, 0.64, -0.22); pass.add(up); }
    const warm = glow(1.2, 0xff8a40, 0.35, false); warm.rotation.x = -Math.PI / 2; warm.position.y = 0.34; pass.add(warm);
    const bell = new THREE.Group(); bell.position.set(0.38, 0.335, 0.12); pass.add(bell);
    bell.add(new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.012, 20), std(0x1a1a1a)));
    { const dome = new THREE.Mesh(new THREE.SphereGeometry(0.03, 18, 10, 0, TAU, 0, Math.PI / 2), metal(0xd6a640, { roughness: 0.15 })); dome.position.y = 0.006; bell.add(dome); }
    block(k, passAt.x, passAt.z, 0.56, 0.26, y + 0.3, y + 1.0);
    const plate = plateMesh(); plate.position.set(-0.15, 0.335, 0); pass.add(plate);
    // The table, laid for two, with a candle and a card.
    const t = new THREE.Group(); t.position.set(tbl.x, terzo.y, tbl.z); k.group.add(t);
    const cloth = new THREE.Mesh(lathe([[0, 0.76], [0.42, 0.76], [0.45, 0.74], [0.46, 0.5], [0.0, 0.5]], 36), std(0xf4f1ea, { roughness: 0.85 })); t.add(cloth);
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 0.5, 10), std(0x222222)); leg.position.y = 0.25; t.add(leg);
    const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.12, 10), std(0xf2ead2)); candle.position.set(0, 0.82, 0); t.add(candle);
    const flame = glow(0.25, 0xffc070, 0.9); flame.position.set(0, 0.9, 0); t.add(flame);
    const card = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.05), new THREE.MeshStandardMaterial({ map: canvasTex(128, 64, g => { g.fillStyle = '#f6f1e2'; g.fillRect(0, 0, 128, 64); g.fillStyle = '#7a1a14'; g.font = 'italic 22px Georgia, serif'; g.textAlign = 'center'; g.fillText('Riservato', 64, 30); g.font = '16px Georgia, serif'; g.fillText('23:00', 64, 52); }), emissive: 0xffffff, emissiveIntensity: 0.2 }));
    card.position.set(0.12, 0.79, 0.08); card.rotation.set(-0.3, 0.6, 0); t.add(card);
    for (const s of [-1, 1]) { const ch = new THREE.Group(); ch.position.set(s * 0.6, 0, 0); ch.rotation.y = s * Math.PI / 2; t.add(ch); const seat = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.04, 0.42), std(0x2a2422)); seat.position.y = 0.46; ch.add(seat); const back = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.45, 0.04), std(0x2a2422)); back.position.set(0, 0.7, 0.2); ch.add(back); for (const [lx, lz] of [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]]) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.46, 6), std(0x1a1a1a)); l.position.set(lx, 0.23, lz); ch.add(l); } }
    block(k, tbl.x, tbl.z, 0.08, 0.08, terzo.y, terzo.y + 0.5); block(k, tbl.x, tbl.z, 0.45, 0.45, terzo.y + 0.48, terzo.y + 0.8);
    const served = plateMesh(); served.position.set(0, 0.765, -0.12); served.visible = false; t.add(served);
    this.timer = k.timer({ id: 'l3service', name: 'SERVICE', limit: 30, min: 1,
      start: { x0: passAt.x - 1.2, x1: passAt.x + 1.2, z0: passAt.z - 1.2, z1: passAt.z + 1.2, y0: y - 0.5, y1: y + 1.5 },
      finish: { x0: tbl.x - 1.0, x1: tbl.x + 1.0, z0: tbl.z - 1.0, z1: tbl.z + 1.0, y0: y - 0.5, y1: y + 1.5 },
      inside: p => p.x > terzo.x0 - 0.5 && p.x < kit.x1 + 0.5 && p.z > terzo.z0 - 0.5 && p.z < kit.z1 + 0.5 && p.y > y - 0.6 && p.y < y + 2,
      onFinish: t2 => this.deliver(k, t2),
    });
    Object.assign(this, { y, pass: { x: passAt.x, y, z: passAt.z }, at: { x: passAt.x, y, z: passAt.z }, tableAt: { x: tbl.x, y, z: tbl.z }, plate, served, bell, carrying: false });
  },
  near(v, k) {
    if (!this.pass || this.carrying || !k.close(this.pass, 1.0, 0.8)) return null;
    return { verb: 'RING', hint: 'The pass. E to ring for service.', act: () => this.ring(k) };
  },
  ring(k) {
    k.synth.note(2093, 1.2, { type: 'sine', vol: 0.07 }); k.synth.note(3136, 0.8, { type: 'sine', vol: 0.03, at: 0.01 });
    this.bell.position.y = 0.33; setTimeout(() => (this.bell.position.y = 0.335), 120);
    const item = { id: 'l3plate', mesh: plateMesh(), lift: 0.02 };
    if (!k.carry.take(item)) return;
    this.plate.visible = false; this.carrying = true; this.timer.cancel(); this.timer.state = 'idle';
    k.say('Table for two, far end. Before it goes cold.', 3);
  },
  deliver(k, t) {
    if (!this.carrying) return;
    k.carry.drop('l3plate'); this.carrying = false; this.served.visible = true;
    k.tune(VERDI, { bpm: 150, type: 'triangle', vol: 0.07, at: 0.2 });
    if (k.find('l3service')) k.callout('SERVICE!');
    setTimeout(() => { if (!this.carrying) this.plate.visible = true; }, 3000);      // (not while you are carrying the next one)
  },
  active(k) { return !!this.timer && (this.carrying || k.inRoom(['MW3-kitchen', 'MW3-terzo'], 1)); },
  update(dt, k) {
    if (!this.carrying) return;
    if (!k.carry.has('l3plate')) { this.carrying = false; this.plate.visible = true; this.timer.cancel(); return; }
    const was = this.timer.state; this.timer.update(dt);
    if (was === 'running' && this.timer.state === 'idle' && this.carrying) { k.carry.drop('l3plate'); this.carrying = false; this.plate.visible = true; k.say('Cold. Back to the pass.', 2.5); }
  },
  reset(k) { if (!this.timer) return; this.timer.cancel(); this.carrying = false; this.plate.visible = true; this.served.visible = false; },
  spots() { return this.at ? [{ kind: 'secret', id: 'l3service', name: 'Service! (ring at the pass, run the plate)', ...this.at }] : []; },
});

// ================================================================ Terzo Piano: a bottle on ice
// A champagne bucket on its stand between the tables. Knock it and it goes over, ice and all.
feature({
  id: 'l3bucket',
  init(k) {
    const r = k.plan.byId['MW3-terzo']; if (!r) return;
    const s = spot(k, 'MW3-terzo', 0.5, 0.5, 0.35, 1.2) || spot(k, 'MW3-terzo', 0.3, 0.55, 0.35, 1.2); if (!s) return;
    const g = new THREE.Group(); g.position.set(s.x, r.y, s.z); k.group.add(g);
    const steel = metal(0xd0d4d8, { roughness: 0.18 }), inner = new THREE.Group(); g.add(inner);
    inner.add(new THREE.Mesh(lathe([[0.16, 0], [0.16, 0.02], [0.02, 0.04], [0.016, 0.62], [0.05, 0.64]], 20), steel));
    const bucket = new THREE.Mesh(lathe([[0, 0.62], [0.09, 0.62], [0.11, 0.64], [0.125, 0.84], [0.135, 0.85], [0.12, 0.85], [0.105, 0.66], [0, 0.66]], 28), steel); inner.add(bucket);
    for (const sx of [-1, 1]) { const h = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.006, 6, 12, Math.PI), steel); h.position.set(sx * 0.135, 0.8, 0); h.rotation.set(0, sx > 0 ? 0 : Math.PI, -Math.PI / 2); inner.add(h); }
    const bottle = new THREE.Mesh(lathe([[0.0, 0.66], [0.04, 0.66], [0.042, 0.86], [0.03, 0.92], [0.014, 0.97], [0.014, 1.02], [0.0, 1.02]], 18), std(0x1d3a24, { roughness: 0.2 })); bottle.rotation.z = 0.25; bottle.position.x = -0.03; inner.add(bottle);
    const foil = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.018, 0.06, 10), metal(0xd8b040)); foil.position.set(-0.03 - Math.sin(0.25) * 0.99, 0.99 * Math.cos(0.25) + 0.02, 0); foil.rotation.z = 0.25; inner.add(foil);
    const ice = new THREE.InstancedMesh(new THREE.BoxGeometry(0.03, 0.03, 0.03), new THREE.MeshStandardMaterial({ color: 0xdff4ff, transparent: true, opacity: 0.7, roughness: 0.05, emissive: 0x5a7a8a, emissiveIntensity: 0.4 }), 10);
    const M = new THREE.Matrix4(), R = rnd(77); this.cubes = []; for (let i = 0; i < 10; i++) { const a = R() * TAU, d = R() * 0.08; this.cubes.push({ x: Math.cos(a) * d, y: 0.83 + R() * 0.02, z: Math.sin(a) * d, vx: 0, vy: 0, vz: 0, s: R() * 3 }); const c = this.cubes[i]; c.x0 = c.x; c.y0 = c.y; c.z0 = c.z; ice.setMatrixAt(i, M.makeTranslation(this.cubes[i].x, this.cubes[i].y, this.cubes[i].z)); }
    g.add(ice);
    this.b = k.pushable(g, { r: 0.16, h: 1.0, tip: true, hit: 0.9, drag: 4, onTip: (bb) => { k.synth.note(1800, 0.4, { type: 'sine', vol: 0.04 }); k.synth.note(2600, 0.3, { type: 'sine', vol: 0.03, at: 0.05 }); k.synth.noise(0.5, { vol: 0.05, lp: 5000, at: 0.25 }); this.spill = 0; this.axis = bb.axis.clone(); } });
    Object.assign(this, { at: { x: s.x, y: r.y, z: s.z }, ice, M, spill: -1, g, inv: new THREE.Matrix4(), w: new THREE.Vector3(), dir: new THREE.Vector3() });
  },
  active(k) { return !!this.b && k.inRoom('MW3-terzo', 1) && k.close(this.at, 6); },
  update(dt) {
    this.b.step(dt);
    if (this.spill < 0 || this.spill > 2) return;
    if (this.spill === 0) { const dir = this.dir.set(0, 0.8, 0).applyAxisAngle(this.axis, Math.PI / 2); for (const c of this.cubes) { c.vx = dir.x * (0.8 + c.s * 0.4) + (Math.random() - 0.5) * 0.6; c.vz = dir.z * (0.8 + c.s * 0.4) + (Math.random() - 0.5) * 0.6; c.vy = 0.4; } }
    this.spill += dt;
    const inv = this.inv.copy(this.g.matrixWorld).invert();      // the cubes live in the stand's frame: work them in the world and bring them back
    this.cubes.forEach((c, i) => { c.vy -= 9.8 * dt; c.x += c.vx * dt; c.z += c.vz * dt; c.y = Math.max(0.015, c.y + c.vy * dt); if (c.y <= 0.015) { c.vx *= 0.9; c.vz *= 0.9; c.vy = 0; } const w = this.w.set(this.g.position.x + c.x, this.g.position.y + c.y, this.g.position.z + c.z).applyMatrix4(inv); this.ice.setMatrixAt(i, this.M.makeTranslation(w.x, w.y, w.z)); });
    this.ice.instanceMatrix.needsUpdate = true;
  },
  reset() { if (!this.b) return; this.b.reset(); this.spill = -1; this.cubes.forEach((c, i) => { c.x = c.x0; c.y = c.y0; c.z = c.z0; this.ice.setMatrixAt(i, this.M.makeTranslation(c.x, c.y, c.z)); }); this.ice.instanceMatrix.needsUpdate = true; },
});

// ================================================================ the kitchen: pots to knock over
feature({
  id: 'l3pots',
  init(k) {
    const kit = k.plan.byId['MW3-kitchen']; if (!kit) return;
    const s = spot(k, 'MW3-kitchen', 0.5, 0.82, 0.7, 1.2); if (!s) return;
    const steel = metal(0xbfc4c8, { roughness: 0.28 }), copper = metal(0xc0723c, { roughness: 0.3 });
    this.pots = [[0, 0, 0.17, steel], [0.36, 0.05, 0.14, copper], [-0.34, 0.08, 0.15, steel], [0.12, 0.36, 0.12, copper], [-0.15, -0.34, 0.11, steel]].map(([dx, dz, rr, m], i) => {
      const g = new THREE.Group(); g.position.set(s.x + dx, kit.y, s.z + dz); k.group.add(g);
      const h = rr * 1.5, inner = new THREE.Group(); inner.position.y = 0; g.add(inner);
      const pot = new THREE.Mesh(lathe([[0, 0.004], [rr * 0.95, 0.006], [rr, 0.03], [rr, h], [rr * 1.04, h + 0.006], [rr * 0.96, h + 0.006], [rr * 0.94, 0.02], [0, 0.02]], 28), m); inner.add(pot);
      for (const sgn of [-1, 1]) { const hd = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.007, 6, 12, Math.PI), m); hd.position.set(sgn * (rr + 0.02), h * 0.85, 0); hd.rotation.set(0, sgn > 0 ? 0 : Math.PI, -Math.PI / 2); inner.add(hd); }
      const b = k.pushable(g, { r: rr, h: h + 0.05, tip: true, hit: 1.2, drag: 3, onTip: () => { k.synth.note(620 + i * 90, 0.5, { type: 'square', vol: 0.03 }); k.synth.note(1240 + i * 70, 0.35, { type: 'sine', vol: 0.03, at: 0.03 }); k.synth.noise(0.25, { vol: 0.05, lp: 4000 }); }, onHit: (bb, into) => { if (into > 0.4) k.synth.note(900 + i * 60, 0.15, { type: 'sine', vol: 0.025 }); } });
      return b;
    });
    this.at = { x: s.x, y: kit.y, z: s.z };
  },
  active(k) { return !!this.pots && k.inRoom('MW3-kitchen', 1) && k.close(this.at, 5); },
  update(dt) { for (const b of this.pots) b.step(dt); },
  reset() { if (this.pots) for (const b of this.pots) b.reset(); },
});
