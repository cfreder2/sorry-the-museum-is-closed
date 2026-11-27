// The mice of the Moon: the glowing mice of the museum (src/mice.js), the same green fur with its rim of light, a little
// bigger, and many of them. The Moon is theirs, and they love you: you brought the art.
//
//   followers   about ten, out to meet you when the toy rolls down the ramp: a cheer, hops, squeaks, then a loose trail
//               behind you wherever you go (the plain, the dome, the caves), never in the way. Stop, and they crowd round,
//               sit up, and now and then one nuzzles the toy. Under a drone they gather beneath it, looking up.
//   gallery     the rest, once the museum has opened: in the dome, stopping in front of each picture, a tilt of the head,
//               moving on, now and then two sharing one. Come in, and they turn to you.
//   workers     the base's own: at the consoles, round the saucers, in the garden, on the landing pad. They look up and wave
//               as you pass.
//
// All of them are two instanced meshes (body, head) and two more for their glow (a halo, a pool on the ground): four draw
// calls for every mouse on the Moon. Nothing is lit by them: the glow is the fur's own and additive light.

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { MOTIF, hz } from './motif.js';
import { radial } from './textures.js';

const SC = 2.0;                                   // a mouse here, bigger than life (the museum's are 1.75)
const TAU = Math.PI * 2;
const angD = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
// ---- the figure, as src/mice.js draws it (copied: that file is not to be touched), cut at the neck so the head can turn
const colour = (g, hex) => { g = g.index ? g.toNonIndexed() : g; const c = new THREE.Color(hex), n = g.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) a.set([c.r, c.g, c.b], i * 3); g.setAttribute('color', new THREE.BufferAttribute(a, 3)); if (g.attributes.uv) g.deleteAttribute('uv'); return g; };
const ball = (to, r, x, y, z, hex, sx = 1, sy = 1, sz = 1, w = 10, h = 7) => { const g = new THREE.SphereGeometry(r, w, h); g.scale(sx, sy, sz); g.translate(x, y, z); to.push(colour(g, hex)); };
const FUR = 0x8fd486, BELLY = 0xd2f5c4, PINK = 0xff9cb8, INNER = 0xf7a8c4;
const NECK = [0, 0.042, 0.038];
function figure() {
  const body = [], head = [], UP = new THREE.Vector3(0, 1, 0);
  ball(body, 0.03, 0, 0.036, 0.0, FUR, 0.95, 0.84, 1.5, 12, 8); ball(body, 0.031, 0, 0.0365, -0.015, FUR, 1.02, 0.9, 1.25, 12, 8);
  ball(body, 0.03, 0, 0.037, -0.031, FUR, 1.12, 0.96, 1.06, 12, 8); ball(body, 0.026, 0, 0.027, 0.004, BELLY, 0.84, 0.6, 1.42);
  for (const [x, z, hind] of [[-0.015, 0.03, 0], [0.015, 0.03, 0], [-0.019, -0.03, 1], [0.019, -0.03, 1]]) { const len = hind ? 0.019 : 0.016, c = new THREE.CapsuleGeometry(hind ? 0.0046 : 0.0041, len, 2, 6); c.translate(x, 0.024 - len / 2 - 0.002, z); body.push(colour(c, FUR)); ball(body, hind ? 0.0066 : 0.0057, x, 0.024 - (hind ? 0.0232 : 0.0205), z + (hind ? 0.007 : 0.004), PINK, 0.9, 0.45, hind ? 2 : 1.6, 8, 5); }
  // the tail, lying in a curl along the ground behind
  { const pts = []; for (let i = 0; i <= 12; i++) { const s = i / 12; pts.push(new THREE.Vector3(0.03 * s * s + 0.012 * Math.sin(s * 5), 0.022 * (1 - Math.min(1, s * 2.2)) + 0.004, -0.062 - s * 0.19)); }
    body.push(colour(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, 0.0035, 4, false), 0xc8f4b8)); }
  const o = NECK;
  ball(head, 0.0215, 0, 0.046 - o[1], 0.051 - o[2], FUR, 0.95, 0.9, 1.08); ball(head, 0.013, 0, 0.0405 - o[1], 0.077 - o[2], BELLY, 0.78, 0.72, 1.95);
  ball(head, 0.0052, 0, 0.0415 - o[1], 0.1015 - o[2], PINK, 1, 1, 1, 8, 6);
  for (const s of [-1, 1]) {
    ball(head, 0.0058, s * 0.0128, 0.0515 - o[1], 0.067 - o[2], 0x030503, 1, 1, 1, 8, 6); ball(head, 0.0017, s * 0.0148, 0.0538 - o[1], 0.0712 - o[2], 0xffffff, 1, 1, 1, 4, 3);
    for (const [dy, dz] of [[0.004, -0.004], [0, 0], [-0.004, 0.003]]) { const a = new THREE.Vector3(s * 0.006, 0.041 - o[1], 0.093 - o[2]), b = new THREE.Vector3(s * 0.042, 0.041 + dy * 1.6 - o[1], 0.084 + dz - o[2]), d = b.clone().sub(a), L = d.length(); const w = new THREE.CylinderGeometry(0.0007, 0.0004, L, 3, 1, true); w.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(UP, d.normalize())); w.translate((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2); head.push(colour(w, 0xeaffdf)); }
    const ear = []; ball(ear, 0.0195, 0, 0.016, 0, FUR, 1, 1, 0.26, 10, 6); ball(ear, 0.0145, 0, 0.0165, 0.0035, INNER, 1, 1, 0.18, 10, 5);
    const e = mergeGeometries(ear); e.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(s * 0.017, 0.058 - o[1], 0.043 - o[2]), new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.12, s * 0.38, -s * 0.42)), new THREE.Vector3(1, 1, 1))); head.push(e);
  }
  return { body: mergeGeometries(body), head: mergeGeometries(head) };
}
/** The figure in two pieces, body and head (the head's origin at the neck, NECK): for the mice's own statues too. */
export function mouseFigure() { return figure(); }
export { NECK, SC as MOUSE_SCALE };
// the fur: it glows its own colour, strongest round the edges (src/mice.js, the same shader)
function furMat() {
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, color: 0xb8d8b4, emissive: 0xffffff, emissiveIntensity: 0.6 });
  m.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
      totalEmissiveRadiance *= vColor.rgb * vec3(0.5, 1.35, 0.55);
      { float rim = 1.0 - saturate(dot(normal, normalize(vViewPosition))), lit = step(0.1, max(vColor.r, vColor.g));
        totalEmissiveRadiance += vec3(0.35, 1.25, 0.45) * pow(rim, 2.2) * 1.6 * lit; }`); };
  m.customProgramCacheKey = () => 'moon-mouse-fur';
  return m;
}

export class MoonMice {
  /** max: how many mice there can be; ground(x, z, y): the height underfoot; synth: the game's (src/synth.js), for the squeaks. */
  constructor({ max = 48, ground, synth = null, reduce = () => false, inDome = () => false }) {
    this.max = max; this.ground = ground; this.synth = synth; this.reduce = reduce; this.inDome = inDome; this.list = []; this.t = 0; this.lastSqueak = 0;
    const F = figure(), fur = furMat(), glowT = radial(0, 1.2);
    this.body = new THREE.InstancedMesh(F.body, fur, max); this.head = new THREE.InstancedMesh(F.head, fur, max);
    this.halo = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: glowT, color: new THREE.Color(0.32, 1, 0.42), transparent: true, opacity: 0.32, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }), max);
    this.pool = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: glowT, color: new THREE.Color(0.32, 1, 0.42).multiplyScalar(0.3), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }), max);
    this.halo.renderOrder = 6; this.pool.renderOrder = 2;
    this.group = new THREE.Group(); this.group.name = 'moon mice';
    for (const m of [this.body, this.head, this.halo, this.pool]) { m.frustumCulled = false; m.count = 0; this.group.add(m); }
    this._m = new THREE.Matrix4(); this._n = new THREE.Matrix4(); this._q = new THREE.Quaternion(); this._v = new THREE.Vector3(); this._s = new THREE.Vector3(); this._e = new THREE.Euler(0, 0, 0, 'YXZ');
  }
  /** A mouse of a role ('follow', 'gallery', 'work'), hidden until it has somewhere to be. */
  add(role, o = {}) {
    if (this.list.length >= this.max) return null;
    const m = { i: this.list.length, role, x: 0, y: 0, z: 0, yaw: 0, vy: 0, air: false, ph: Math.random() * TAU, pitch: 0, tilt: 0, look: 0, up: 0, hidden: true, state: 'away', wait: 0, path: [], speed: 2.4 + Math.random() * 0.8, cheer: 0, waved: -99, ...o };
    this.list.push(m); this.body.count = this.head.count = this.halo.count = this.pool.count = this.list.length;
    return m;
  }
  of(role) { return this.list.filter(m => m.role === role); }
  // a squeak in the mouse voice (src/mice.js: notes of the call, very high)
  squeak(n = 2, vol = 0.014) {
    if (!this.synth || this.t - this.lastSqueak < 0.22) return; this.lastSqueak = this.t;
    const s = Math.floor(Math.random() * 4);
    for (let i = 0; i < n; i++) this.synth.note(hz(MOTIF[(s + i) % 5].midi + 36), 0.05 + (i === n - 1 ? 0.05 : 0), { type: 'sine', vol, at: i * 0.075 });
  }
  hop(m, k = 1) { if (m.air) return; m.vy = (this.reduce() ? 0.55 : 1.05) * k; m.air = true; }
  place(m, x, z, yaw = m.yaw) { m.x = x; m.z = z; m.yaw = yaw; m.y = this.ground(x, z, (m.y || 0) + 3); m.hidden = false; }

  // ---------------------------------------------------------------- the followers
  /** Out they come from `from` to meet you, in a happy line. */
  arrive(from, toy) {
    this.of('follow').forEach((m, i) => { this.place(m, from.x + (Math.random() - 0.5) * 3, from.z + (Math.random() - 0.5) * 3, Math.atan2(toy.x - from.x, toy.z - from.z)); m.state = 'come'; m.wait = i * 0.35; m.cheer = 2.5; });
    this.met = false;
  }
  /** Straight to the toy's side (a game picked up later, or a long way behind). */
  gather(toy) { this.of('follow').forEach((m, i) => { const a = i / 10 * TAU; this.place(m, toy.x + Math.sin(a) * 1.4, toy.z + Math.cos(a) * 1.4, a + Math.PI); m.state = 'follow'; }); this.met = true; }

  // ---------------------------------------------------------------- the gallery
  /** In from `from` along `via`, to the pictures (slots of src/moon.js domeLayout), when the museum opens. */
  fileIn(slots, via, D) {
    this.slots = slots; this.D = D;
    this.of('gallery').forEach((m, i) => { const p = via[0]; this.place(m, p.x + (Math.random() - 0.5) * 2, p.z + (Math.random() - 0.5) * 2); m.state = 'walk'; m.wait = i * 0.55; m.path = via.slice(1).map(q => ({ ...q })); m.pic = i % slots.length; m.share = i >= slots.length ? 1 : 0; });
  }
  settle(slots, D) {
    this.slots = slots; this.D = D;
    this.of('gallery').forEach((m, i) => { m.pic = i % slots.length; m.share = i >= slots.length ? 1 : 0; const p = this._stand(m); this.place(m, p.x, p.z); m.state = 'look'; m.wait = Math.random() * 4; m.path = []; });
  }
  // where to stand to look at picture m.pic: out from the wall, a little to one side if two share it
  _stand(m) {
    const s = this.slots[m.pic], D = this.D, r = D.IN - 2.2 - (m.i % 3) * 0.35, a = s.a + (m.share ? 0.035 : -0.012) * (m.i % 2 ? 1 : -1);
    return { x: D.x + Math.sin(a) * r, z: D.z + Math.cos(a) * r, a, r };
  }
  /** The toy has come into the dome: every head turns to it. */
  welcome(toy) { for (const m of this.of('gallery')) if (!m.hidden && m.state !== 'walk') { m.state = 'turn'; m.wait = 2.2 + Math.random() * 0.8; m.cheer = 1.5; } this.squeak(3, 0.016); void toy; }

  // ---------------------------------------------------------------- the workers
  /** A worker going round its stops: [{ x, z, wait, face: { x, z } }]. */
  work(m, stops) { m.stops = stops; m.k = 0; this.place(m, stops[0].x, stops[0].z); m.state = 'stop'; m.wait = Math.random() * 3; }

  // ---------------------------------------------------------------- each frame
  /** toy: { x, y, z, yaw, speed, kind, still (seconds stopped), at(d): a point d metres back along the way it came }. */
  update(dt, toy, cam) {
    this.t += dt;
    const reduce = this.reduce(), G = 1.63, close = this._close || (this._close = []);
    for (const m of this.list) {
      if (m.hidden) continue;
      if (m.ride) { const g = m.ride, a = g.rotation.y; m.yaw = a; m.x = g.position.x - Math.sin(a) * 0.5; m.z = g.position.z - Math.cos(a) * 0.5; m.y = g.position.y + 0.1; m.pitch = -0.35; m.up = 0.2; m.look = Math.sin(this.t * 0.6 + m.ph) * 0.3; continue; }      // (riding a hover cart, src/voyage.js: at the back of it, sitting up)
      let tx = m.x, tz = m.z, sp = 0, face = null;
      const dT = Math.hypot(toy.x - m.x, toy.z - m.z), near = dT < 7 && Math.abs(toy.y - m.y) < 3;
      if (m.wait > 0) m.wait -= dt;
      if (m.role === 'follow') {
        if (m.state === 'come') {
          if (m.wait <= 0) { tx = toy.x; tz = toy.z; sp = 4.5; if (dT < 3.5) { m.state = 'follow'; if (!this.met) { this.met = true; this.squeak(3, 0.018); } } }
          face = toy; if (m.cheer > 0 && !m.air && Math.random() < dt * 3) this.hop(m, 1.2);
        } else {
          const j = this.list.indexOf(m) % 10, gatherNow = toy.still > 0.8;
          if (gatherNow) {
            // crowd round: a loose ring, facing the toy; now and then one comes in close for a nuzzle
            const a = toy.yaw + j / 10 * TAU + 0.3, r = (toy.kind === 'drone' ? 1.2 : 0.75) + (j % 3) * 0.28;
            const nuz = m.nuzzle > 0 ? (m.nuzzle -= dt, 0.42) : r;
            tx = toy.x + Math.sin(a) * nuz; tz = toy.z + Math.cos(a) * nuz; sp = 2.6; face = toy;
            if (!(m.nuzzle > 0) && Math.random() < dt * 0.06) { m.nuzzle = 1.4; this.squeak(2, 0.012); }
            if (dT < r + 0.4 && !m.air && Math.random() < dt * (reduce ? 0.1 : 0.35)) this.hop(m, 0.8);
          } else {
            const p = toy.at(1.4 + j * 0.55), side = (j % 2 ? 1 : -1) * (0.3 + 0.18 * (j % 3)), hx = Math.sin(toy.yaw), hz = Math.cos(toy.yaw);
            tx = p.x + hz * side; tz = p.z - hx * side;
            const d = Math.hypot(tx - m.x, tz - m.z);
            sp = d > 14 ? 16 : Math.max(3.2, toy.speed * 1.25) * Math.min(1, d / 1.2);
            if (d > 45) { this.place(m, tx, tz, toy.yaw); m.vy = 0; m.air = false; }      // (left a long way behind: there again, as mice are)
          }
        }
      } else if (m.role === 'gallery') {
        if (m.state === 'walk') {
          if (m.wait <= 0) {
            if (!m.path.length) m.path.push(this._stand(m));
            const p = m.path[0]; tx = p.x; tz = p.z; sp = m.speed;
            if (Math.hypot(tx - m.x, tz - m.z) < 0.25) { m.path.shift(); if (!m.path.length) { m.state = 'look'; m.wait = 3 + Math.random() * 5; } }
          }
        } else if (m.state === 'look') {
          const s = this.slots[m.pic]; face = s; m.tilt = Math.sin(this.t * 0.8 + m.ph) * 0.28; m.up = 0.5;
          if (m.wait <= 0) {
            // on to another picture: a neighbour most often; now and then one somebody else is looking at, to share it
            const n = this.slots.length, busy = this.of('gallery').filter(q => q !== m && q.state === 'look').map(q => q.pic);
            m.pic = Math.random() < 0.18 && busy.length ? busy[Math.floor(Math.random() * busy.length)] : (m.pic + (Math.random() < 0.5 ? 1 : -1) * (1 + Math.floor(Math.random() * 2)) + n) % n;
            m.share = busy.includes(m.pic) ? 1 : 0;
            // round the room, not across it: along the ring to the next standpoint
            const D = this.D, a0 = Math.atan2(m.x - D.x, m.z - D.z), to = this._stand(m), da = angD(to.a, a0), r = D.IN - 2.6, steps = Math.max(1, Math.ceil(Math.abs(da) / 0.35));
            m.path = []; for (let i = 1; i <= steps; i++) { const a = a0 + da * i / steps; m.path.push(i === steps ? to : { x: D.x + Math.sin(a) * r, z: D.z + Math.cos(a) * r }); }
            m.state = 'walk'; m.tilt = 0; m.up = 0;
          }
        } else if (m.state === 'turn') {
          face = toy; m.up = 0.25; m.tilt = Math.sin(this.t * 3 + m.ph) * 0.15;
          if (m.cheer > 0 && !m.air && Math.random() < dt * 1.2) this.hop(m, 0.7);
          if (m.wait <= 0) { m.state = 'look'; m.wait = 1 + Math.random() * 3; }
        }
      } else if (m.role === 'work' && m.stops) {
        const st = m.stops[m.k];
        if (m.state === 'stop') { face = st.face || null; m.tilt = Math.sin(this.t * 1.3 + m.ph) * 0.12; m.up = st.up || 0; if (m.wait <= 0) { m.k = (m.k + 1) % m.stops.length; m.state = 'go'; } }
        else { const p = m.stops[m.k]; tx = p.x; tz = p.z; sp = m.speed * 0.8; if (Math.hypot(tx - m.x, tz - m.z) < 0.2) { m.state = 'stop'; m.wait = p.wait || 2; } }
        if (near && this.t - m.waved > 16) { m.waved = this.t; m.state = 'stop'; m.wait = Math.max(m.wait, 1.6); m.waveT = 1.6; this.hop(m, 0.8); this.squeak(2, 0.011); }
        if (m.waveT > 0) { m.waveT -= dt; face = toy; m.up = 0.35; m.tilt = Math.sin(this.t * 7) * 0.3; }
      }
      // move: towards the target, hopping as anything does here; never on top of the toy
      const dx = tx - m.x, dz = tz - m.z, d = Math.hypot(dx, dz);
      let moving = false;
      if (sp > 0 && d > 0.05) { const st = Math.min(d, sp * dt); m.x += dx / d * st; m.z += dz / d * st; moving = st > dt * 0.6; m.yaw += angD(Math.atan2(dx, dz), m.yaw) * Math.min(1, dt * 8); if (moving && !m.air && sp > 1) this.hop(m, Math.min(1.2, 0.5 + sp * 0.08)); }
      else if (face) m.yaw += angD(Math.atan2(face.x - m.x, face.z - m.z), m.yaw) * Math.min(1, dt * 5);
      if (toy.kind === 'car' && dT < 0.55 && dT > 1e-3 && Math.abs(toy.y - m.y) < 0.8) { m.x -= (toy.x - m.x) / dT * (0.55 - dT); m.z -= (toy.z - m.z) / dT * (0.55 - dT); }
      const gy = this.ground(m.x, m.z, m.y + 0.6);
      if (m.air) { m.vy -= G * dt; m.y += m.vy * dt; if (m.y <= gy) { m.y = gy; m.air = false; m.vy = 0; } }
      else m.y = gy;
      m.pitch += ((face && !moving && m.role !== 'gallery' ? -0.42 : 0) - m.pitch) * Math.min(1, dt * 6);      // sitting up to look at you
      if (m.cheer > 0) m.cheer -= dt;
      // looking: the head turns towards what it faces, up at the toy or a picture
      if (face) { const want = angD(Math.atan2(face.x - m.x, face.z - m.z), m.yaw); m.look += (Math.max(-0.8, Math.min(0.8, want)) - m.look) * Math.min(1, dt * 6); if (face === toy) m.up = Math.min(0.9, Math.max(m.up, Math.atan2(toy.y - m.y, Math.max(0.5, dT)))); }
      else { m.look *= 1 - Math.min(1, dt * 4); m.up *= 1 - Math.min(1, dt * 3); m.tilt *= 1 - Math.min(1, dt * 3); }
      m.moving = moving;
    }
    this._draw(cam);
  }
  _draw(cam) {
    const M = this._m, N = this._n, Q = this._q, V = this._v, S = this._s, E = this._e, one = this._one || (this._one = new THREE.Vector3(1, 1, 1));
    const camQ = cam.quaternion, cp = cam.position, hid = this._hid || (this._hid = new THREE.Matrix4().makeScale(0, 0, 0));
    for (const m of this.list) {
      const i = m.i;
      if (m.hidden) { this.body.setMatrixAt(i, hid); this.head.setMatrixAt(i, hid); this.halo.setMatrixAt(i, hid); this.pool.setMatrixAt(i, hid); continue; }
      const sq = m.air ? 1 + Math.min(0.12, Math.abs(m.vy) * 0.08) : 1;
      E.set(m.pitch, m.yaw, 0); Q.setFromEuler(E);
      M.compose(V.set(m.x, m.y + 0.002, m.z), Q, S.set(SC / Math.sqrt(sq), SC * sq, SC / Math.sqrt(sq)));
      this.body.setMatrixAt(i, M);
      E.set(-m.up * 0.7, m.look, m.tilt); Q.setFromEuler(E); N.compose(V.set(NECK[0], NECK[1], NECK[2]), Q, one); N.premultiply(M);
      this.head.setMatrixAt(i, N);
      // the halo, a little behind the mouse from wherever the camera is; not in the dome, where the pictures are
      if (this.inDome(m.x, m.z)) this.halo.setMatrixAt(i, hid);
      else { V.set(m.x - cp.x, 0, m.z - cp.z).normalize().multiplyScalar(0.2); V.x += m.x; V.z += m.z; V.y = m.y + 0.12; M.compose(V, camQ, S.set(0.55, 0.55, 0.55)); this.halo.setMatrixAt(i, M); }
      Q.identity(); M.compose(V.set(m.x, this.ground(m.x, m.z, m.y + 0.3) + 0.012, m.z), Q, S.set(0.9, 1, 0.9)); this.pool.setMatrixAt(i, M);
    }
    for (const q of [this.body, this.head, this.halo, this.pool]) q.instanceMatrix.needsUpdate = true;
  }
  /** The nearest of a role to a point. */
  nearest(role, x, z) { let best = null, bd = 1e9; for (const m of this.list) if (m.role === role && !m.hidden) { const d = Math.hypot(m.x - x, m.z - z); if (d < bd) { bd = d; best = m; } } return best; }
}
