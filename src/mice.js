// The museum mice. One lives in each wing: the old building's north and south galleries, the Rice building,
// the Modern Wing and the lower level. Each has a hole in the skirting of a long gallery wall. They are
// radioactive: they glow green, light a little pool of floor under them and leave glowing footprints that
// fade over several seconds, so one can be followed across a dark gallery even when it gets ahead.
// Come close and the mouse bolts along the skirting (round a corner, where the room allows) for its hole,
// just faster than the toy is coming; fall behind and it stops, turns and waits for you. See it home and
// it ducks in with a flash and a chime. See all five home and you have found the museum mice.

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { feature } from './features.js';
import { wallSpots, claimed, claim, placingNow } from './placing.js';
import * as TX from './textures.js';

const WINGS = [
  { id: 'north', name: 'the old building, north', test: r => r.building === 'main' && r.floor === '1' && r.x1 < 108 && r.z1 < 104 },
  { id: 'south', name: 'the old building, south', test: r => r.building === 'main' && r.floor === '1' && r.x1 < 108 && r.z0 > 112 },
  { id: 'rice', name: 'the Rice building', test: r => r.building === 'main' && r.x0 > 140 && r.z0 > 140 },
  { id: 'modern', name: 'the Modern Wing', test: r => r.building === 'modern' },
  { id: 'lower', name: 'the lower level', test: r => r.building === 'lower' || r.floor === 'LL' },
];
const RUN = 8.5;          // the shortest run along the hole's wall
const LONG = 24;          // and the longest
const OFF = 0.09;         // how far out from the skirting a mouse runs
const SCALE = 1.25;       // a well-fed mouse, a little bigger than life, so it reads from a toy's height
// Pace. The car tops out near 9.5 m/s; a mouse runs a little faster than the toy is coming, up to TOP.
const TOP = 8.2, PACE = 4.5, SEE = 9, BOLT = 5.5, LAG = 10, BACK = 6, WAIT = 5;
// hint within SEE, bolts within BOLT; never slower than PACE while the toy is close; beyond LAG it stops and waits
// up to WAIT seconds for the toy to come within BACK, then runs on alone (and home alone does not count)
// Footprints: one buffer for every mouse, a ring of quads written in place.
const PRINTS = 640, STEP = 0.12, LIFE = 8, PAW = 0.075;
const GREEN = new THREE.Color(0.32, 1, 0.42);

function mouseGeometry() {
  const parts = [], eyes = [], col = (g, hex) => { g = g.index ? g.toNonIndexed() : g; const c = new THREE.Color(hex), n = g.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) a.set([c.r, c.g, c.b], i * 3); g.setAttribute('color', new THREE.BufferAttribute(a, 3)); g.deleteAttribute('uv'); return g; };
  const ball = (to, r, x, y, z, hex, sx = 1, sy = 1, sz = 1) => { const g = new THREE.SphereGeometry(r, 12, 8); g.scale(sx, sy, sz); g.translate(x, y, z); to.push(col(g, hex)); };
  ball(parts, 0.03, 0, 0.03, 0.005, 0x9ccf94, 1, 0.92, 1.55);          // body
  ball(parts, 0.031, 0, 0.031, -0.03, 0x94c88c, 1.08, 0.95, 1.15);     // haunches
  ball(parts, 0.021, 0, 0.037, 0.055, 0xa8d8a0, 1, 0.9, 1.3);          // head
  ball(parts, 0.012, 0, 0.032, 0.077, 0xb4e0aa, 0.95, 0.85, 1.6);      // snout
  ball(parts, 0.0055, 0, 0.032, 0.097, 0xff9cb8);                     // nose
  for (const s of [-1, 1]) {
    ball(parts, 0.015, s * 0.018, 0.06, 0.045, 0xd6ffb0, 1, 1, 0.32);  // ears
    ball(parts, 0.0072, s * 0.019, 0.006, 0.035, 0xc8f0b8, 1, 0.6, 1.5);   // front feet
    ball(parts, 0.008, s * 0.022, 0.006, -0.035, 0xc8f0b8, 1, 0.6, 1.7);   // back feet
    ball(eyes, 0.0048, s * 0.012, 0.044, 0.07, 0x050805);              // eyes
  }
  const tail = new THREE.TubeGeometry(new THREE.CatmullRomCurve3([[0, 0, 0], [0.012, -0.006, -0.05], [-0.01, -0.012, -0.1], [0.004, -0.012, -0.15]].map(p => new THREE.Vector3(...p))), 16, 0.0032, 5, false);
  return { body: mergeGeometries(parts), eyes: mergeGeometries(eyes), tail: col(tail, 0xc0f0a8) };
}

// A paw print with a soft halo round it, toes towards +v.
function pawTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
  g.fillStyle = '#000'; g.fillRect(0, 0, 64, 64);
  const h = g.createRadialGradient(32, 34, 2, 32, 34, 31); h.addColorStop(0, 'rgba(120,120,120,1)'); h.addColorStop(1, 'rgba(0,0,0,1)');
  g.fillStyle = h; g.fillRect(0, 0, 64, 64);
  g.fillStyle = '#fff'; g.shadowColor = '#fff'; g.shadowBlur = 4;
  g.beginPath(); g.ellipse(32, 40, 9, 8, 0, 0, Math.PI * 2); g.fill();
  for (const [x, y] of [[19, 26], [27, 20], [37, 20], [45, 26]]) { g.beginPath(); g.ellipse(x, y, 4, 5, 0, 0, Math.PI * 2); g.fill(); }
  const t = new THREE.CanvasTexture(c); return t;    // linear: it is a mask, added in
}

const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));

feature({
  id: 'mice',
  secrets: [['mice', 'The museum mice']],
  init(k) { this.k = k; this.list = []; this.time = 0; },

  place() {
    const k = this.k, P = k.plan, taken = claimed(k.G);
    for (const w of WINGS) {
      let best = null;
      for (const r of P.rooms) {
        if (r.secret || r.passage || !w.test(r)) continue;
        const spots = wallSpots(P, k.museum, r, { step: 0.5, clear: 0.9, depth: 0.25, height: 0.2, width: 0.2 });
        // the longest clear stretch of one wall
        for (const side of ['n', 's', 'w', 'e']) {
          const s = spots.filter(q => q.side === side).sort((a, b) => a.u - b.u);
          for (let i = 0, j = 0; i < s.length; i = j) {
            for (j = i + 1; j < s.length && s[j].u - s[j - 1].u < 0.55; j++);
            const len = s[j - 1].u - s[i].u; if (len < RUN + 0.6) continue;
            const a = s[i], b = s[j - 1], hole = { x: b.x, y: r.y, z: b.z };
            let far = 60; for (const t of taken) if (Math.abs(t.y - hole.y) < 2.4) far = Math.min(far, Math.hypot(t.x - hole.x, t.z - hole.z));
            const score = Math.min(len, 16) + (r.kind === 'gallery' ? 4 : 0) + far * 0.1;
            if (!best || score > best.score) best = { score, r, a, b, side, spots };
          }
        }
      }
      if (!best) continue;
      const m = this._path(w, best);
      this.list.push(m); claim(m.hole);
    }
    this.tally = this.k.tally('mice', this.list.length);
    this._build(); this.placed = true;
  },

  // The run: along the hole's wall from the far end of its clear stretch, and if that stretch reaches the
  // corner, along the next wall to the corner first. Points sit OFF out from the skirting.
  _path(w, { r, a, b, side, spots }) {
    const horiz = side === 'n' || side === 's', W = horiz ? a.z : a.x, nx = a.nx, nz = a.nz;
    const on = u => horiz ? { x: u, z: W + nz * OFF } : { x: W + nx * OFF, z: u };
    const holeU = b.u - 0.2, lo = a.lo;
    const pts = [on(holeU)];
    if (holeU - lo < LONG + 0.5 && a.u - lo < 1.3) {
      // round the corner at the low end: the wall there is w (for n and s) or n (for w and e)
      const ps = horiz ? 'w' : 'n', from = W;
      const q = spots.filter(s => s.side === ps).map(s => Math.abs(s.u - from)).sort((x, y) => x - y);
      let reach = 0; if (q.length && q[0] < 1.3) { reach = q[0]; for (let i = 1; i < q.length && q[i] - q[i - 1] < 0.55; i++) reach = q[i]; }
      reach = Math.min(reach, 7);
      pts.unshift(on(lo + OFF));
      if (reach > 2) pts.unshift(horiz ? { x: lo + OFF, z: W + nz * (OFF + reach) } : { x: W + nx * (OFF + reach), z: lo + OFF });
      else pts.splice(0, 1, on(Math.max(a.u, holeU - LONG)));
    } else pts.unshift(on(Math.max(a.u + 0.1, holeU - LONG)));
    const cum = [0], wn = [];
    for (let i = 1; i < pts.length; i++) {
      const L = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z); cum.push(cum[i - 1] + L);
      // the wall beside each leg: the hole's, or (round the corner) the next one, whose normal points along +x or +z
      wn.push(Math.abs((pts[i].x - pts[i - 1].x) * nx + (pts[i].z - pts[i - 1].z) * nz) < 0.5 * L ? [nx, nz] : horiz ? [1, 0] : [0, 1]);
    }
    const h = on(holeU);
    return {
      id: 'mouse-' + w.id, wing: w, room: r.id, y: r.y, nx, nz, pts, cum, wn, wnx: nx, wnz: nz, len: cum[cum.length - 1],
      hole: { x: h.x - nx * OFF, y: r.y, z: h.z - nz * OFF },
      s: 0, state: 'peek', t: 0, spd: 0, yaw: 0, pitch: 0, pause: 0, acc: 0, foot: 1, flare: 0, alone: false, squeak: 0, px: 0, pz: 0, hx: 0, hz: 1,
    };
  },
  // Where a mouse is at s metres along its run: m.px, m.pz, heading m.hx, m.hz (no allocation).
  _at(m, s) {
    const P = m.pts, C = m.cum; let i = 1; while (i < P.length - 1 && C[i] < s) i++;
    const a = P[i - 1], b = P[i], L = C[i] - C[i - 1] || 1, f = Math.max(0, Math.min(1, (s - C[i - 1]) / L));
    m.px = a.x + (b.x - a.x) * f; m.pz = a.z + (b.z - a.z) * f; m.hx = (b.x - a.x) / L; m.hz = (b.z - a.z) / L; m.wnx = m.wn[i - 1][0]; m.wnz = m.wn[i - 1][1];
  },

  _build() {
    const k = this.k, G = mouseGeometry();
    const body = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6, color: 0x88aa88, emissive: 0xffffff, emissiveIntensity: 1 });
    // the glow takes the fur's colour: ears and nose glow their own shades, the eyes stay dark
    body.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n\ttotalEmissiveRadiance *= vColor.rgb * vec3(0.45, 1.5, 0.5);'); };
    const eyes = new THREE.MeshBasicMaterial({ color: 0x040604 });
    const glowTex = TX.radial(0, 1.2);
    const haloMat = new THREE.SpriteMaterial({ map: glowTex, color: GREEN, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
    const poolMat = new THREE.MeshBasicMaterial({ map: glowTex, color: GREEN.clone().multiplyScalar(0.7), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
    const poolGeo = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), washGeo = new THREE.PlaneGeometry(1, 1);
    const holeGeo = new THREE.CircleGeometry(0.06, 16, 0, Math.PI), holeMat = new THREE.MeshBasicMaterial({ color: 0x030604 });
    const rimGeo = new THREE.RingGeometry(0.06, 0.072, 16, 1, 0, Math.PI), rimMat = new THREE.MeshStandardMaterial({ color: 0x6a5a48, roughness: 1 });
    for (const m of this.list) {
      const hole = new THREE.Group();
      hole.add(new THREE.Mesh(holeGeo, holeMat), new THREE.Mesh(rimGeo, rimMat));
      hole.position.set(m.hole.x + m.nx * 0.006, m.y, m.hole.z + m.nz * 0.006); hole.rotation.y = Math.atan2(m.nx, m.nz); k.group.add(hole);
      const g = m.mesh = new THREE.Group(); g.rotation.order = 'YXZ';
      m.fig = new THREE.Group(); m.fig.scale.setScalar(SCALE); g.add(m.fig);
      m.fig.add(new THREE.Mesh(G.body, body), new THREE.Mesh(G.eyes, eyes));
      m.tail = new THREE.Mesh(G.tail, body); m.tail.position.set(0, 0.022, -0.062); m.fig.add(m.tail);
      m.halo = new THREE.Sprite(haloMat.clone()); m.halo.position.set(0, 0.05, 0); m.halo.scale.setScalar(0.34); g.add(m.halo);
      m.pool = new THREE.Mesh(poolGeo, poolMat.clone()); m.pool.scale.setScalar(1.6); m.pool.renderOrder = 2;
      m.wash = new THREE.Mesh(washGeo, m.pool.material); m.wash.scale.setScalar(1.2); m.wash.renderOrder = 2;     // and on the skirting and wall behind it
      k.group.add(g, m.pool, m.wash);
      if (this.tally.has(m.id)) { m.state = 'done'; m.s = m.len - 0.2; }
      this._place(m);
    }
    this._trail();
  },
  // Put the mouse where m.s says, facing back out of its hole if it lives there now.
  _place(m) {
    this._at(m, m.s);
    m.yaw = m.state === 'done' ? Math.atan2(-m.hx, -m.hz) : Math.atan2(m.hx, m.hz);
    m.mesh.position.set(m.px, m.y + 0.002, m.pz); m.mesh.rotation.set(0, m.yaw, 0); m.fig.scale.setScalar(SCALE); m.fig.position.set(0, 0, 0);
    m.mesh.visible = m.state !== 'home'; this._glow(m);
  },

  // ---- the glowing footprints
  _trail() {
    const pos = new Float32Array(PRINTS * 12), colr = new Float32Array(PRINTS * 12), uv = new Float32Array(PRINTS * 8), idx = new Uint16Array(PRINTS * 6);
    for (let i = 0; i < PRINTS; i++) { uv.set([0, 0, 1, 0, 1, 1, 0, 1], i * 8); idx.set([i * 4, i * 4 + 2, i * 4 + 1, i * 4, i * 4 + 3, i * 4 + 2], i * 6); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('color', new THREE.BufferAttribute(colr, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setIndex(new THREE.BufferAttribute(idx, 1));
    const mat = new THREE.MeshBasicMaterial({ map: pawTexture(), vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
    const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = 3; mesh.name = 'mouse-trail';
    this.k.group.add(mesh);
    this.tr = { mesh, pos, colr, born: new Float32Array(PRINTS).fill(-1e6), y: new Float32Array(PRINTS), next: 0, last: -1e6, lit: false };
  },
  _print(m) {
    const T = this.tr, i = T.next; T.next = (i + 1) % PRINTS;
    m.foot = -m.foot;
    const fx = m.hx, fz = m.hz, rx = -fz, rz = fx, side = m.foot * 0.022, cx = m.px + rx * side, cz = m.pz + rz * side, y = m.y + 0.005;
    const hw = PAW * 0.42, hl = PAW * 0.5, o = i * 12, p = T.pos;
    p[o] = cx - rx * hw - fx * hl; p[o + 1] = y; p[o + 2] = cz - rz * hw - fz * hl;
    p[o + 3] = cx + rx * hw - fx * hl; p[o + 4] = y; p[o + 5] = cz + rz * hw - fz * hl;
    p[o + 6] = cx + rx * hw + fx * hl; p[o + 7] = y; p[o + 8] = cz + rz * hw + fz * hl;
    p[o + 9] = cx - rx * hw + fx * hl; p[o + 10] = y; p[o + 11] = cz - rz * hw + fz * hl;
    T.born[i] = this.time; T.last = this.time;
    T.mesh.geometry.attributes.position.needsUpdate = true;
  },
  _fade() {
    const T = this.tr; if (!T) return;
    if (this.time - T.last > LIFE + 0.2) { if (!T.lit) return; T.colr.fill(0); T.lit = false; T.mesh.geometry.attributes.color.needsUpdate = true; return; }
    const c = T.colr, now = this.time;
    for (let i = 0; i < PRINTS; i++) {
      const age = now - T.born[i], o = i * 12;
      if (age > LIFE) { if (c[o + 1] !== 0) for (let j = 0; j < 12; j++) c[o + j] = 0; continue; }
      const f = (1 - age / LIFE), b = 1.5 * f * f + (age < 0.25 ? (0.25 - age) * 3 : 0);    // a flash as it is laid, then a slow fade
      for (let j = 0; j < 4; j++) { c[o + j * 3] = GREEN.r * b; c[o + j * 3 + 1] = GREEN.g * b; c[o + j * 3 + 2] = GREEN.b * b; }
    }
    T.lit = true; T.mesh.geometry.attributes.color.needsUpdate = true;
  },

  active(k) { return k.G.mode !== 'race' && !k.plan.racing; },
  update(dt, k) {
    if (!this.placed) this.place();
    this.time += dt;
    const p = k.pos, v = k.v, cs = v && v.vel ? Math.hypot(v.vel.x, v.vel.z) : 0;
    for (const m of this.list) this._step(m, dt, k, p, cs);
    this._fade();
  },
  _step(m, dt, k, p, cs) {
    const g = m.mesh, dx = p.x - g.position.x, dz = p.z - g.position.z;
    const d = Math.abs(p.y - m.y) < 2.4 ? Math.hypot(dx, dz) : 1e4;
    m.t += dt;
    m.flare = Math.max(0, m.flare - dt * 0.9);
    if (d > 40 && (m.state === 'peek' || m.state === 'done') && !m.flare) return;   // nobody near: leave it be
    const toYaw = (want, rate) => { m.yaw += wrap(want - m.yaw) * Math.min(1, dt * rate); };
    let bob = 0, wag = 3;
    if (m.state === 'peek' || m.state === 'done') {
      // sitting up and sniffing
      bob = Math.max(0, Math.sin(m.t * 9)) * 0.004; m.pitch = -0.12 + Math.sin(m.t * 2.3) * 0.06;
      if (m.state === 'peek') {
        if (d < SEE) k.once('mouse-first', 'A glowing mouse! Follow it home.', 4);
        if (d < BOLT) { m.state = 'run'; m.t = 0; m.spd = 3; k.synth.note(2600, 0.05, { type: 'sine', vol: 0.02 }); k.synth.note(3100, 0.04, { type: 'sine', vol: 0.02, at: 0.07 }); }
      }
    } else if (m.state === 'run' || m.state === 'wait') {
      if (m.state === 'run') {
        // a little faster than the toy is coming, faster still when it is close; stop-start when it is not
        if (d < BACK) m.alone = false;
        let want = m.alone ? PACE : d < LAG - 3 ? Math.max(PACE, Math.min(TOP, 2.6 + cs * 0.72 + (4 - d) * 0.7)) : 2;
        if (m.pause > 0) { m.pause -= dt; want = 0; } else if (d > 4 && !m.alone && Math.random() < dt * 0.7) m.pause = 0.18 + Math.random() * 0.15;
        m.spd += (want - m.spd) * Math.min(1, dt * (want > m.spd ? 9 : 14));
        m.s = Math.min(m.len, m.s + m.spd * dt);
        this._at(m, m.s);
        for (m.acc += m.spd * dt; m.acc > STEP; m.acc -= STEP) this._print(m);
        toYaw(Math.atan2(m.hx, m.hz), 16);
        m.pitch = 0; bob = m.spd > 0.3 ? Math.abs(Math.sin(m.t * 32)) * 0.006 : 0; wag = 6 + m.spd * 2;
        if (d > LAG && !m.alone) { m.state = 'wait'; m.t = 0; m.squeak = 0.4; k.once('mouse-wait', 'It waits for you. Keep up!', 3); }
        else if (m.s >= m.len - 0.01) { m.state = 'duck'; m.t = 0; this._home(m, k, d); }
      } else {
        // fallen behind: turn round, sit up, glow and squeak until the toy comes on
        toYaw(Math.atan2(dx, dz), 6); m.pitch += (-0.38 - m.pitch) * Math.min(1, dt * 6); m.spd = 0; wag = 2;
        bob = Math.max(0, Math.sin(m.t * 7)) * 0.003;
        if ((m.squeak -= dt) <= 0) { m.squeak = 1.7; m.flare = Math.max(m.flare, 0.55); if (d < 30) { k.synth.note(2900, 0.05, { type: 'sine', vol: 0.016 }); k.synth.note(3400, 0.05, { type: 'sine', vol: 0.014, at: 0.09 }); } }
        if (d < BACK) { m.state = 'run'; m.t = 0; }
        else if (m.t > WAIT) { m.state = 'run'; m.t = 0; m.alone = true; }      // given up waiting: off home on its own
      }
      g.position.set(m.px, m.y + 0.002, m.pz);
    } else if (m.state === 'duck') {
      // into the hole: on to the wall and through it, getting smaller
      const f = Math.min(1, m.t / 0.4);
      g.position.set(m.px - m.nx * (OFF + 0.04) * f, m.y + 0.002, m.pz - m.nz * (OFF + 0.04) * f);
      toYaw(Math.atan2(-m.nx, -m.nz), 20); m.fig.scale.setScalar(SCALE * (1 - 0.6 * f)); wag = 14;
      if (f >= 1) { m.state = 'home'; m.t = 0; g.visible = false; }
    } else if (m.state === 'home') {
      if (m.t > (m.followed ? 4 : 20)) {
        // out again: one that was followed sits by its hole from now on; one that was not, back where it was
        if (m.followed) { m.state = 'done'; m.s = m.len - 0.2; } else { m.state = 'peek'; m.s = 0; m.alone = false; }
        m.flare = 0.6; this._place(m);
      }
    }
    if (g.visible) {
      g.position.y = m.y + 0.002 + bob; g.rotation.y = m.yaw; g.rotation.x = m.pitch;
      m.tail.rotation.y = Math.sin(m.t * wag) * 0.35;
    }
    this._glow(m, d);
  },
  // the glow: a halo on the mouse, a pool of light on the floor and a wash on the wall, brighter as it flares
  _glow(m, d = 0) {
    const fl = m.flare, pulse = 1 + 0.08 * Math.sin(this.time * 5 + m.len);
    const at = m.state === 'home' || m.state === 'duck' ? m.hole : m.mesh.position;
    m.pool.position.set(at.x, m.y + 0.004, at.z); m.pool.scale.setScalar((1.6 + fl * 1.0) * pulse);
    m.pool.material.opacity = Math.min(1, 0.85 + fl); m.pool.visible = m.wash.visible = m.state !== 'home' || fl > 0;
    const wx = at === m.hole ? m.nx : m.wnx, wz = at === m.hole ? m.nz : m.wnz, back = at === m.hole ? -0.012 : OFF - 0.012;
    m.wash.position.set(at.x - wx * back, m.y, at.z - wz * back); m.wash.rotation.y = Math.atan2(wx, wz); m.wash.scale.setScalar((1.2 + fl * 0.8) * pulse);
    m.halo.scale.setScalar((0.34 + fl * 0.4) * pulse * Math.max(1, Math.min(3, d / 4)));     // a beacon: bigger from further off m.halo.material.opacity = 0.9;
  },
  _home(m, k, d) {
    m.flare = 1.2; m.followed = d < LAG - 1;
    k.synth.note(3300, 0.04, { type: 'sine', vol: 0.02 });
    if (!m.followed) { k.once('mouse-lost', 'It got home without you. It will be back.', 4); return; }
    if (this.tally.add(m.id)) {
      k.synth.chime([1568, 2093, 2637], { vol: 0.045, gap: 0.11, dur: 0.9 });
      k.callout(`MICE ${this.tally.count} / ${this.tally.total}`);
      if (this.tally.done) k.find('mice');
      else k.once('mouse-home', 'Home! One mouse lives in each wing.', 4);
    }
  },
  spots(k) {
    if (!this.placed && !placingNow()) { this.k = this.k || k; this.place(); }
    return (this.list || []).map(m => ({ kind: 'secret', id: 'mice', name: 'Mouse hole: ' + m.wing.name, x: m.hole.x, y: m.y, z: m.hole.z }));
  },
  reset() {
    for (const m of this.list || []) if (m.state !== 'done') { m.state = 'peek'; m.s = 0; m.t = 0; m.flare = 0; m.alone = false; if (m.mesh) this._place(m); }
    if (this.tr) { this.tr.born.fill(-1e6); this.tr.last = -1e6; }
  },
});
