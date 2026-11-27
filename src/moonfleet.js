// The mice's saucers: many small ones, mouse-shaped (a little silver saucer whose dome has two round ears, whisker lights at
// its nose, a soft colour of its own round the rim, and a tail of light behind it). They run errands all over the base,
// to and fro: the shaft down to the hangar, the landing pad, the museum, the carrier, the crater park; now and then a dozen
// of them sweep up together into a pattern (a ring round the dome, a figure of eight, a ribbon, a spiral up into the sky
// and down); one swoops low past the toy now and then, to say hello. When the carrier comes in they swarm round it, and
// three of them unload it with green tractor beams (src/voyage.js tells them where; beam() draws it).
//
// One InstancedMesh for the hulls, one for their lights, one for what they carry, the tails as points: four draw calls
// for the whole fleet, and the beams.

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { MOTIF, hz } from './motif.js';

const TAU = Math.PI * 2, V3 = THREE.Vector3;
const COLS = ['#7dffa8', '#7ad8ff', '#ffd27a', '#d7a0ff', '#ff9fc0', '#a8ffef'];
const paint = (g, hex) => { g = g.index ? g.toNonIndexed() : g; const c = new THREE.Color(hex), n = g.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) a.set([c.r, c.g, c.b], i * 3); g.setAttribute('color', new THREE.BufferAttribute(a, 3)); if (g.attributes.uv) g.deleteAttribute('uv'); return g; };
// The saucer, about a metre across: +z is its nose.
function hullGeo() {
  const p = [];
  p.push(paint(new THREE.LatheGeometry([[0, -0.13], [0.3, -0.12], [0.5, -0.06], [0.56, 0], [0.5, 0.05], [0.3, 0.09], [0.12, 0.11], [0, 0.11]].map(([r, y]) => new THREE.Vector2(r, y)), 20), 0xc6ced4));
  p.push(paint(new THREE.SphereGeometry(0.2, 14, 8, 0, TAU, 0, Math.PI / 2).translate(0, 0.08, 0), 0x9fe8ff));
  for (const s of [-1, 1]) { p.push(paint(new THREE.CylinderGeometry(0.1, 0.1, 0.025, 14).rotateX(Math.PI / 2).rotateY(s * 0.3).translate(s * 0.13, 0.3, -0.02), 0xc6ced4)); p.push(paint(new THREE.CylinderGeometry(0.065, 0.065, 0.03, 12).rotateX(Math.PI / 2).rotateY(s * 0.3).translate(s * 0.13, 0.3, 0.0), 0xf7a8c4)); }      // two round ears on the dome
  p.push(paint(new THREE.SphereGeometry(0.035, 8, 6).translate(0, 0.0, 0.56), 0xff9cb8));        // a pink nose at the front of the rim
  return mergeGeometries(p);
}
function glowGeo() {
  const p = [new THREE.TorusGeometry(0.53, 0.025, 5, 28).rotateX(Math.PI / 2)];
  for (const s of [-1, 1]) for (const dy of [-0.012, 0.012]) p.push(new THREE.BoxGeometry(0.16, 0.008, 0.008).translate(s * 0.09, dy, 0).rotateY(s * 0.25).translate(s * 0.05, 0, 0.6));      // whisker lights
  p.push(new THREE.CircleGeometry(0.16, 16).rotateX(Math.PI / 2).translate(0, -0.135, 0));    // the port underneath
  return mergeGeometries(p.map(g => { const t = g.index ? g.toNonIndexed() : g; for (const k of Object.keys(t.attributes)) if (k !== 'position') t.deleteAttribute(k); return t; }));
}

// The tractor beam, as the one under the hangar's craft (src/finalelaunch.js): a soft cone of bands, sparks drawn up it.
export function makeBeam() {
  const U = { t: { value: 0 }, len: { value: 4 }, r0: { value: 0.25 }, r1: { value: 0.9 }, op: { value: 0 }, col: { value: new THREE.Color(0.55, 1.0, 0.85) } };
  const vs = `uniform float len, r0, r1; varying float vA; varying vec3 vN, vV;
    void main() { vec3 p = position; float a = p.y; p.xz *= mix(r0, r1, a); p.y = a * len;
      vec4 w = modelMatrix * vec4(p, 1.0); vV = normalize(cameraPosition - w.xyz); vN = normalize(mat3(modelMatrix) * vec3(normal.x, 0.0, normal.z)); vA = a;
      gl_Position = projectionMatrix * viewMatrix * w; }`;
  const fs = `uniform float t, op; uniform vec3 col; varying float vA; varying vec3 vN, vV;
    void main() { float e = abs(dot(vN, vV)); float soft = pow(e, 1.6); float bands = 0.62 + 0.38 * sin(vA * 26.0 - t * 7.0);
      float ends = smoothstep(0.0, 0.05, vA) * (1.0 - smoothstep(0.85, 1.0, vA)); gl_FragColor = vec4(col * soft * bands * ends * op * 0.55, 1.0); }`;
  const geo = new THREE.CylinderGeometry(1, 1, 1, 24, 1, true); geo.translate(0, 0.5, 0);
  const m = new THREE.Mesh(geo, new THREE.ShaderMaterial({ uniforms: U, vertexShader: vs, fragmentShader: fs, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
  m.frustumCulled = false; m.renderOrder = 7; m.visible = false; m.userData.u = U;
  const up = new V3(0, 1, 0), d = new V3();
  // from a point (the saucer's port) down to another; k 0..1 how strong
  m.userData.set = (from, to, k, dt, calm) => { m.visible = k > 0.01; if (!m.visible) return; d.subVectors(to, from); const L = Math.max(0.5, d.length()); m.position.copy(from); m.quaternion.setFromUnitVectors(up, d.divideScalar(L)); U.len.value = L; U.op.value = k; U.t.value += dt * (calm ? 0.35 : 1); U.r1.value = Math.min(1.4, 0.5 + L * 0.12); };
  return m;
}

export class Fleet {
  /** places: { mouth, pad, dome, craft, shaft, park, bays: [{x, z, y}] } in the world; n: how many. */
  constructor({ n = 36, places, synth = null, reduce = () => false }) {
    this.n = n; this.P = places; this.synth = synth; this.reduce = reduce; this.t = 0; this.list = [];
    this.hulls = new THREE.InstancedMesh(hullGeo(), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.3, metalness: 0.6, emissive: 0x3a444d, emissiveIntensity: 0.7 }), n);
    this.glow = new THREE.InstancedMesh(glowGeo(), new THREE.MeshBasicMaterial({ color: 0xffffff }), n);
    this.carry = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.1, 0), new THREE.MeshBasicMaterial({ color: 0xffffff }), n);
    // the tails of light: K points behind each, fading
    const K = this.K = 14, N = n * K;
    this.tp = new Float32Array(N * 3); this.ta = new Float32Array(N); this.tc = new Float32Array(N * 3);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(this.tp, 3)); g.setAttribute('alpha', new THREE.BufferAttribute(this.ta, 1)); g.setAttribute('color', new THREE.BufferAttribute(this.tc, 3));
    this.tails = new THREE.Points(g, new THREE.ShaderMaterial({ uniforms: { uScale: { value: 260 * Math.min(2, window.devicePixelRatio || 1) } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, vertexColors: true,
      vertexShader: 'attribute float alpha; varying float vA; varying vec3 vC; uniform float uScale; void main() { vA = alpha; vC = color; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = 0.22 * uScale / max(0.3, -mv.z) * (0.4 + alpha); }',
      fragmentShader: 'varying float vA; varying vec3 vC; void main() { float d = length(gl_PointCoord - 0.5) * 2.0; float a = smoothstep(1.0, 0.0, d) * vA; if (a < 0.01) discard; gl_FragColor = vec4(vC * a, 1.0); }' }));
    this.group = new THREE.Group(); this.group.name = 'mouse saucers';
    for (const m of [this.hulls, this.glow, this.carry, this.tails]) { m.frustumCulled = false; this.group.add(m); }
    const c = new THREE.Color(), CARRY = [0xf0c860, 0xb0b4a8, 0xff8ad8, 0x8affb0];
    const bays = places.bays || [];
    for (let i = 0; i < n; i++) {
      const col = new THREE.Color(COLS[i % COLS.length]);
      const s = { i, p: new V3(), v: new V3(), yaw: Math.random() * TAU, bank: 0, col, mode: 'errand', path: null, t: 0, wait: 0, carry: -1, slot: null, trail: [], tAcc: 0, bay: i < bays.length && i % 2 === 0 ? i : -1 };
      if (s.bay >= 0) { const b = bays[s.bay]; s.p.set(b.x, b.y + 0.14, b.z); s.mode = 'rest'; s.wait = 4 + Math.random() * 20; }
      else { s.p.set((Math.random() - 0.5) * 160, 12 + Math.random() * 20, (Math.random() - 0.5) * 160); this._next(s); s.path.t = Math.random() * s.path.T; }
      for (let k = 0; k < K; k++) s.trail.push(s.p.clone());
      this.glow.setColorAt(i, c.copy(col).multiplyScalar(2.0)); this.carry.setColorAt(i, c.set(CARRY[i % CARRY.length]).multiplyScalar(1.3));
      for (let k = 0; k < K; k++) this.tc.set([col.r, col.g, col.b], (i * K + k) * 3);
      this.list.push(s);
    }
    this.flockAt = 9; this.helloAt = 14; this.beams = [makeBeam(), makeBeam(), makeBeam()]; for (const b of this.beams) this.group.add(b);
    this._m = new THREE.Matrix4(); this._q = new THREE.Quaternion(); this._e = new THREE.Euler(0, 0, 0, 'YXZ'); this._s = new V3(1, 1, 1); this._v = new V3();
  }
  // a new errand: from where it is to somewhere else on the base, over an arc
  _next(s) {
    const P = this.P, picks = ['mouth', 'pad', 'dome', 'craft', 'park', 'shaft', 'pad', 'dome', 'wander'], k = picks[Math.floor(Math.random() * picks.length)];
    let to;
    if (k === 'wander') to = new V3((Math.random() - 0.5) * 220, 10 + Math.random() * 26, (Math.random() - 0.5) * 220);
    else { const q = P[k]; to = new V3(q.x + (Math.random() - 0.5) * 6, (q.y || 0) + 3 + Math.random() * 6, q.z + (Math.random() - 0.5) * 6); }
    if (k === 'pad') to.y = (P.pad.y || 0) + 0.45;
    if (k === 'shaft' && P.bays && P.bays.length) { const free = P.bays.map((b, j) => j).filter(j => !this.list.some(q => q.bay === j)); if (free.length) { s.bay = free[Math.floor(Math.random() * free.length)]; to = new V3(P.shaft.x, 4, P.shaft.z); } }
    const from = s.p.clone(), mid = from.clone().lerp(to, 0.5); mid.y += 6 + from.distanceTo(to) * 0.12;
    s.path = { a: from, b: mid, c: to, t: 0, T: Math.max(3, from.distanceTo(to) / (this.reduce() ? 5 : 9 + Math.random() * 5)), what: k };
    s.carry = Math.random() < 0.55 ? (s.i % 4) : -1; s.mode = 'errand';
  }
  /** Three saucers set aside for the unloading (their targets given each frame by job()). */
  crew(n = 3) { const out = []; for (const s of this.list) { if (out.length >= n) break; if (s.mode === 'errand' && s.bay < 0) { s.mode = 'job'; s.target = s.p.clone(); s.carry = -1; out.push(s); } } return out; }
  release(s) { if (s.mode === 'job') this._next(s); }
  beam(j, from, to, k, dt) { const b = this.beams[j]; if (b) b.userData.set(from, to, k, dt, this.reduce()); }
  /** ctx: { toy: { x, y, z }, escort: Vector3 | null (the carrier coming in), cam } */
  update(dt, ctx) {
    this.t += dt;
    const calm = this.reduce(), P = this.P, toy = ctx.toy, tmp = this._v;
    // now and then a dozen sweep up into a pattern
    if ((this.flockAt -= dt) < 0 && !ctx.escort) {
      this.flockAt = 24 + Math.random() * 14;
      const kinds = ['ring', 'eight', 'ribbon', 'spiral'], kind = kinds[Math.floor(Math.random() * kinds.length)], who = this.list.filter(s => s.mode === 'errand').slice(0, 12);
      this.flock = { kind, t: 0, T: 16, who }; who.forEach((s, j) => { s.mode = 'flock'; s.slot = j; });
    }
    if (this.flock) { const F = this.flock; F.t += dt; if (F.t > F.T) { for (const s of F.who) if (s.mode === 'flock') this._next(s); this.flock = null; } }
    // and one comes low past the toy, to say hello
    if ((this.helloAt -= dt) < 0 && toy && toy.y > -1) {
      this.helloAt = 16 + Math.random() * 16;
      const s = this.list.find(q => q.mode === 'errand' && q.p.distanceTo(tmp.set(toy.x, toy.y, toy.z)) < 90);
      if (s) { const side = Math.random() < 0.5 ? -1 : 1, near = new V3(toy.x + side * 2.2, toy.y + 1.4, toy.z + 1), away = new V3(toy.x - side * 40, toy.y + 18, toy.z + (Math.random() - 0.5) * 40); s.path = { a: s.p.clone(), b: near, c: away, t: 0, T: calm ? 9 : 5.5, what: 'hello' }; s.mode = 'hello'; s.said = false; }
    }
    for (const s of this.list) {
      const prev = this._pv || (this._pv = new V3()); prev.copy(s.p);
      if (s.mode === 'rest') {
        const b = P.bays[s.bay]; s.p.set(b.x, b.y + 0.14 + 0.03 * Math.sin(this.t * 2 + s.i), b.z); s.yaw += dt * 0.1;
        if ((s.wait -= dt) < 0) { s.mode = 'lift'; s.t = 0; }      // off again: up out of the bay, up the shaft
      } else if (s.mode === 'lift') {
        s.t += dt; const b = P.bays[s.bay], u = Math.min(1, s.t / (calm ? 7 : 4)), sh = P.shaft;
        if (u < 0.35) s.p.set(b.x, b.y + 0.14 + u / 0.35 * 2.5, b.z);
        else { const w = (u - 0.35) / 0.65; s.p.set(b.x + (sh.x - b.x) * Math.min(1, w * 2), b.y + 2.6 + w * w * 14, b.z + (sh.z - b.z) * Math.min(1, w * 2)); }
        s.yaw += dt * 2;
        if (u >= 1) { s.bay = -1; this._next(s); }
      } else if (s.mode === 'land') {
        // down the shaft and into its bay
        s.t += dt; const b = P.bays[s.bay], sh = P.shaft, u = Math.min(1, s.t / (calm ? 7 : 4));
        if (u < 0.6) { const w = u / 0.6; s.p.set(sh.x + (b.x - sh.x) * Math.max(0, w * 2 - 1), 4 - w * (4 - (b.y + 2.6)), sh.z + (b.z - sh.z) * Math.max(0, w * 2 - 1)); }
        else s.p.set(b.x, b.y + 2.6 - (u - 0.6) / 0.4 * 2.46, b.z);
        if (u >= 1) { s.mode = 'rest'; s.wait = 8 + Math.random() * 20; s.carry = -1; }
      } else if (s.mode === 'job') {
        s.p.lerp(s.target, 1 - Math.exp(-dt * (calm ? 1.5 : 3)));
      } else if (s.mode === 'flock' && this.flock) {
        const F = this.flock, j = s.slot, m = F.who.length, u = j / m, T = F.t * (calm ? 0.4 : 1), tg = tmp.set(0, 0, 0);
        if (F.kind === 'ring') { const a = u * TAU + T * 0.4; tg.set(P.dome.x + Math.sin(a) * 24, 16 + Math.sin(a * 3 + T) * 1.5, P.dome.z + Math.cos(a) * 24); }
        else if (F.kind === 'eight') { const a = u * TAU + T * 0.35; tg.set(10 + Math.sin(a) * 30, 18 + Math.sin(a * 2) * 2, 10 + Math.sin(a * 2) * 14); }
        else if (F.kind === 'ribbon') { tg.set(-40 + u * 80, 20 + Math.sin(u * 7 - T * 2.2) * 3.5, -6 + Math.cos(u * 4 - T) * 4); }
        else { const a = u * TAU * 1.5 + T * 0.8, h = 8 + (0.5 - 0.5 * Math.cos(Math.min(1, F.t / F.T) * TAU)) * 40 + u * 6; tg.set(Math.sin(a) * (6 + u * 6), h, P.craft.z - 30 + Math.cos(a) * (6 + u * 6)); }
        const want = tg.clone(); s.p.lerp(want, 1 - Math.exp(-dt * (F.t < 3 ? 1.2 : 3.5)));
      } else if (ctx.escort && s.mode === 'errand' && s.i % 2 === 0) {
        // the carrier coming in: half the fleet swarms round it in welcome
        const a = s.i / this.n * TAU + this.t * 0.6, r = 13 + (s.i % 3) * 3, e = ctx.escort, tg = new V3(e.x + Math.sin(a) * r, e.y + 2 + Math.sin(a * 2 + this.t) * 2, e.z + Math.cos(a) * r);
        s.p.lerp(tg, 1 - Math.exp(-dt * 1.6)); s.path = null;
      } else {
        if (!s.path) this._next(s);
        const pa = s.path; pa.t += dt; const u = Math.min(1, pa.t / pa.T), e = u * u * (3 - 2 * u), a1 = 1 - e;
        s.p.set(0, 0, 0).addScaledVector(pa.a, a1 * a1).addScaledVector(pa.b, 2 * a1 * e).addScaledVector(pa.c, e * e);
        if (pa.what === 'hello' && !s.said && toy && s.p.distanceTo(new V3(toy.x, toy.y, toy.z)) < 3.5) { s.said = true; this._chirp(); }
        if (u >= 1) { if (pa.what === 'shaft' && s.bay >= 0) { s.mode = 'land'; s.t = 0; } else if (pa.what === 'pad' && !s.padded) { s.padded = true; pa.t = pa.T * 0.999; s.wait = 1.6; s.path = { a: s.p.clone(), b: s.p.clone().add(new V3(0, 0.2, 0)), c: s.p.clone(), t: 0, T: 1.6, what: 'sit' }; } else { s.padded = false; this._next(s); } }
      }
      // heading and bank from how it moved
      s.v.subVectors(s.p, prev).divideScalar(Math.max(dt, 1e-3));
      const sp = Math.hypot(s.v.x, s.v.z);
      if (sp > 0.3 && s.mode !== 'rest') { const want = Math.atan2(s.v.x, s.v.z); let d = want - s.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); s.yaw += d * Math.min(1, dt * 4); s.bank += (Math.max(-0.5, Math.min(0.5, -d * 1.2)) - s.bank) * Math.min(1, dt * 3); }
      else s.bank *= 1 - Math.min(1, dt * 3);
      // its tail of light
      s.tAcc += dt; if (s.tAcc > 0.05) { s.tAcc = 0; s.trail.unshift(s.trail.pop().copy(s.p)); }
    }
    this._draw();
  }
  _chirp() { if (!this.synth) return; const s = Math.floor(Math.random() * 3); for (let i = 0; i < 3; i++) this.synth.note(hz(MOTIF[(s + i) % 5].midi + 24), 0.07, { type: 'sine', vol: 0.012, at: i * 0.07 }); }
  _draw() {
    const M = this._m, Q = this._q, E = this._e, S = this._s, K = this.K, hide = this._hid || (this._hid = new THREE.Matrix4().makeScale(0, 0, 0)), pulse = this.reduce() ? 0 : 1;
    for (const s of this.list) {
      E.set(0, s.yaw, s.bank); Q.setFromEuler(E); M.compose(s.p, Q, S.set(1, 1, 1));
      this.hulls.setMatrixAt(s.i, M); this.glow.setMatrixAt(s.i, M);
      if (s.carry >= 0 && s.mode !== 'rest') { M.compose(this._v.copy(s.p).add({ x: 0, y: -0.32, z: 0 }), Q, S.set(1, 1, 1)); this.carry.setMatrixAt(s.i, M); } else this.carry.setMatrixAt(s.i, hide);
      const moving = s.mode !== 'rest';
      for (let k = 0; k < K; k++) { const q = s.trail[k], j = s.i * K + k; this.tp[j * 3] = q.x; this.tp[j * 3 + 1] = q.y; this.tp[j * 3 + 2] = q.z; this.ta[j] = moving ? (1 - k / K) * 0.75 * (k ? 1 : 0.6) : 0; }
      void pulse;
    }
    this.hulls.instanceMatrix.needsUpdate = this.glow.instanceMatrix.needsUpdate = this.carry.instanceMatrix.needsUpdate = true;
    const g = this.tails.geometry; g.attributes.position.needsUpdate = true; g.attributes.alpha.needsUpdate = true;
  }
}

// ---------------------------------------------------------------- hover carts --
// A low floating tray with a rail round it, a soft glow underneath, and a mouse riding at the back (the mice put it there).
export function makeCart() {
  const g = new THREE.Group(), metal = new THREE.MeshStandardMaterial({ color: 0xb8c2ca, roughness: 0.35, metalness: 0.6, emissive: 0x30383f, emissiveIntensity: 0.7 });
  const parts = [new THREE.BoxGeometry(1.5, 0.08, 1.0).translate(0, 0.05, 0)];
  for (const [x, z, w, d] of [[0, 0.5, 1.5, 0.04], [0, -0.5, 1.5, 0.04], [0.75, 0, 0.04, 1.0], [-0.75, 0, 0.04, 1.0]]) parts.push(new THREE.BoxGeometry(w, 0.12, d).translate(x, 0.15, z));
  g.add(new THREE.Mesh(mergeGeometries(parts), metal));
  const under = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.3).rotateX(Math.PI / 2), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.3, 1.2, 0.6), transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, map: radialTex() }));
  under.position.y = -0.02; under.renderOrder = 3; g.add(under);
  g.userData.under = under; g.userData.load = [];
  return g;
}
let _rt = null;
function radialTex() { if (_rt) return _rt; const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); _rt = new THREE.CanvasTexture(c); return _rt; }
