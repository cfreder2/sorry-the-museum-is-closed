// The heist.
//
// In the security control room (there are two, at either end of the lower level) there is a plinth
// with a big red button. Press it and the building picks a gallery not too far off, and a picture
// in it, and fills the room with laser beams. A toy-sized copy of the picture stands on a plinth in
// the middle. Get to it and get it back to the button before the clock runs out. Some of the beams
// lie low across the way and have to be hopped. Touch one, once, and a cage drops: the alarm, the
// robot's voice, and you wake up in the dumpster round the back (src/guards.js does the carrying; the
// vent beside the dumpster goes straight back down to the button, src/staffvent.js). It is theatre:
// the real picture never leaves the wall, and being caged costs nothing but the heist. And the room
// is kept: after a cage the next press of either button offers the same gallery and the same beams,
// for another go, until it is won, the clock runs out on it, or it is turned down.
//
// src/heistplan.js decides the room, the route, the clock and the beams, and proves a car can get
// through them; this file draws them, runs the clock and keeps the score.
//
// For anything else that wants to know (trophies, say): this object carries `active`, `completed`,
// `clean` (runs with no alarm: every one, now) and `best` ({ roomId: seconds }), and announces
//   window.dispatchEvent(new CustomEvent('museum:heist', { detail: { event: 'start' | 'trip' | 'grab' | 'win' | 'lose', room, time, trips, rank, ghost } }))

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import * as TX from './textures.js';
import { roomAt, ceilingAt } from './plan.js';
import { features } from './features.js';
import { way, targets, pool, pars, level, deal, twin, gate, solve, beamAt, segDist2, inside, dice, hash, lasers, BODY, GRACE } from './heistplan.js';

const KEY = 'after-hours.heist', MAXB = 460;
const HELD = 2.5;                  // seconds in the cage before it is carried off
const $ = id => document.getElementById(id);
const clock = s => { s = Math.max(0, s); const m = Math.floor(s / 60), r = Math.floor(s - m * 60); return `${m}:${r < 10 ? '0' : ''}${r}`; };
const LEVEL = { LL: 'the lower level', 1: 'the first floor', 2: 'the second floor', 3: 'the third floor' };
// How it went, by how much of the clock was left at the button.
const RANKS = [[0.25, 'A GHOST'], [0.15, 'CAT BURGLAR'], [0.07, 'LIGHT FINGERS'], [0, 'BY A WHISKER']];
// What a finished heist pays, in chips (the game's money: the shop, the card table). The job itself, more for a harder
// room, and a bonus for the rank: time left on the clock. A cage or the clock running out pays nothing and costs nothing.
const PAY = { job: 100, perLevel: 25, rank: [75, 50, 25, 0] };
const payFor = (lv, rankIndex) => PAY.job + PAY.perLevel * Math.max(0, lv | 0) + (PAY.rank[rankIndex] || 0);
const roomName = r => (r.kind === 'hall' ? 'Griffin Court' : String(r.gallery || r.id).replace(/^Galleries /, 'Gallery '));

// Every beam in play, as one mesh: a strip for each, turned to face the camera, bright down the
// middle and hazy at the edges. No lights: it glows by being drawn over everything, added on.
// A beam low enough to be hopped also lays a faint line on the floor under it, which is what shows
// how far off the floor it is.
class Beams {
  constructor(parent) {
    const g = this.geo = new THREE.BufferGeometry();
    this.pos = new Float32Array(MAXB * 12); this.alpha = new Float32Array(MAXB * 4);
    const uv = new Float32Array(MAXB * 8), idx = new Uint16Array(MAXB * 6);
    for (let i = 0; i < MAXB; i++) { uv.set([0, -1, 0, 1, 1, 1, 1, -1], i * 8); idx.set([i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3], i * 6); }
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('aA', new THREE.BufferAttribute(this.alpha, 1).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setIndex(new THREE.BufferAttribute(idx, 1));
    this.mesh = new THREE.Mesh(g, new THREE.ShaderMaterial({
      vertexShader: 'attribute float aA; varying vec2 vUv; varying float vA; void main() { vUv = uv; vA = aA; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'varying vec2 vUv; varying float vA; void main() { float d = abs(vUv.y); float core = smoothstep(0.22, 0.0, d); float haze = pow(1.0 - d, 3.0); float ends = smoothstep(0.0, 0.02, vUv.x) * smoothstep(1.0, 0.98, vUv.x); gl_FragColor = vec4((vec3(2.4, 0.3, 0.2) * core + vec3(0.22, 0.01, 0.006) * haze) * vA * ends, 1.0); }',
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    }));
    this.mesh.frustumCulled = false; this.mesh.renderOrder = 6;
    // The little boxes they come out of, and the posts at the corners.
    this.boxes = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: 0x16181c }), MAXB * 2 + 64);
    this.boxes.frustumCulled = false; this.boxes.count = 0;
    this.group = new THREE.Group(); this.group.add(this.mesh, this.boxes); this.group.visible = false; parent.add(this.group);
    this.o = {}; this.m = new THREE.Matrix4();
  }
  // sets: [{ beams, posts, t0 }]. `dim`: 0..1, how nearly out they are (just after the grab, or as a new pattern comes up).
  draw(sets, now, cam, dim, calm) {
    const P = this.pos, A = this.alpha, o = this.o, m = this.m;
    let n = 0, k = 0;
    const box = (x, y, z, sx, sy, sz) => { if (k >= MAXB * 2 + 64) return; m.makeScale(sx, sy, sz); m.setPosition(x, y, z); this.boxes.setMatrixAt(k++, m); };
    const strip = (ax, ay, az, bx, by, bz, sx, sy, sz, a) => {
      const i = n * 12;
      P[i] = ax - sx; P[i + 1] = ay - sy; P[i + 2] = az - sz; P[i + 3] = ax + sx; P[i + 4] = ay + sy; P[i + 5] = az + sz;
      P[i + 6] = bx + sx; P[i + 7] = by + sy; P[i + 8] = bz + sz; P[i + 9] = bx - sx; P[i + 10] = by - sy; P[i + 11] = bz - sz;
      A[n * 4] = A[n * 4 + 1] = A[n * 4 + 2] = A[n * 4 + 3] = a;
      n++;
    };
    for (const set of sets) {
      const t = now - set.t0, fade = Math.min(1, Math.max(0, (now - (set.shownAt || 0)) / 0.8)), fy = set.rect.y;
      for (const b of set.beams) {
        if (n >= MAXB - 1) break;
        beamAt(b, t, o);
        if (!b.net) { box(o.ax, o.ay, o.az, 0.07, 0.07, 0.07); if (b.k !== 'r') box(o.bx, o.by, o.bz, 0.07, 0.07, 0.07); }
        let a = o.on ? 1 : o.warn ? (calm ? 0.16 : 0.12 + 0.09 * Math.sin(now * 40)) : 0;      // about to come on: a dim flicker (steady, with motion reduced)
        if (!a) continue;
        a *= (b.net ? 0.22 : 1) * fade * (1 - 0.75 * dim);
        // Turn the strip to face the camera, and widen it with distance so it never thins to nothing.
        const dx = o.bx - o.ax, dy = o.by - o.ay, dz = o.bz - o.az, mx = (o.ax + o.bx) / 2 - cam.x, my = (o.ay + o.by) / 2 - cam.y, mz = (o.az + o.bz) / 2 - cam.z;
        let sx = dy * mz - dz * my, sy = dz * mx - dx * mz, sz = dx * my - dy * mx;
        const sl = Math.hypot(sx, sy, sz) || 1, w = Math.max(0.055, Math.hypot(mx, my, mz) * 0.0045) / sl;
        strip(o.ax, o.ay, o.az, o.bx, o.by, o.bz, sx * w, sy * w, sz * w, a);
        // Its line on the floor, straight under it.
        if (o.ay - fy < 0.3 && !b.net) { const l = Math.hypot(dx, dz) || 1, u = 0.05 / l; strip(o.ax, fy + 0.012, o.az, o.bx, fy + 0.012, o.bz, -dz * u, 0, dx * u, a * 0.3); }
      }
      for (const p of set.posts || []) box(p.x, p.y + p.h / 2, p.z, 0.05, p.h, 0.05);
    }
    this.count = n;
    this.geo.setDrawRange(0, n * 6); this.geo.attributes.position.needsUpdate = true; this.geo.attributes.aA.needsUpdate = true;
    this.boxes.count = k; this.boxes.instanceMatrix.needsUpdate = true;
    this.group.visible = n > 0 || k > 0;
  }
  clear() { this.count = 0; this.geo.setDrawRange(0, 0); this.boxes.count = 0; this.group.visible = false; }
}

// ------------------------------------------------------------------ the cage --
// What drops when a beam is touched: a steel birdcage on a cable, out of a hatch in the ceiling. Round, 1.6 m across
// and 1.35 high to the shoulder, domed over; eighteen bars, three hoops, a skirt that sits on the floor, a lamp on the
// crown. It is one mesh (and the lamp, and the two glows). The toy is kept inside it by Cage.keep(), to the same radius
// the bars are drawn at.
const CAGE = { R: 0.8, H: 1.15, DOME: 0.5, BARS: 18 };
function cageGeo() {
  const { R, H, DOME, BARS } = CAGE, parts = [], col = (g, hex) => { const c = new THREE.Color(hex), n = g.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) { a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; } g.setAttribute('color', new THREE.BufferAttribute(a, 3)); const q = g.index ? g.toNonIndexed() : g; q.deleteAttribute('uv'); return q; };
  const STEEL = 0x7e868f, DARK = 0x3d424a, BRASS = 0xb8923a, HAZ = 0xe0a81c, BLACK = 0x1a1c20;
  const hoop = (y, r, tube, hex) => { const g = new THREE.TorusGeometry(r, tube, 10, 48); g.rotateX(Math.PI / 2); g.translate(0, y, 0); parts.push(col(g, hex)); };
  // the skirt it lands on: a flat band with a rolled edge top and bottom, hazard blocks round it
  { const g = new THREE.CylinderGeometry(R + 0.012, R + 0.012, 0.11, 48, 1, true); g.translate(0, 0.065, 0); parts.push(col(g, DARK)); }
  hoop(0.014, R, 0.022, STEEL); hoop(0.12, R, 0.02, STEEL);
  for (let i = 0; i < 24; i += 2) { const a0 = i / 24 * Math.PI * 2, g = new THREE.CylinderGeometry(R + 0.016, R + 0.016, 0.06, 4, 1, true, a0, Math.PI * 2 / 24); g.translate(0, 0.066, 0); parts.push(col(g, HAZ)); }
  // the bars: turned steel, a collar where each meets a hoop
  for (let i = 0; i < BARS; i++) {
    const a = (i + 0.5) / BARS * Math.PI * 2, x = Math.cos(a) * R, z = Math.sin(a) * R;
    const bar = new THREE.CylinderGeometry(0.014, 0.014, H - 0.12, 10); bar.translate(x, 0.12 + (H - 0.12) / 2, z); parts.push(col(bar, STEEL));
    for (const y of [0.14, H * 0.55, H - 0.01]) { const c = new THREE.CylinderGeometry(0.021, 0.021, 0.035, 10); c.translate(x, y, z); parts.push(col(c, DARK)); }
    // and on over the top: a quarter of a hoop, in to the crown
    const arc = new THREE.TorusGeometry(DOME, 0.012, 8, 14, Math.PI / 2); arc.scale((R - 0.07) / DOME, 1, 1); arc.translate(0.07, H, 0); arc.rotateY(-a); parts.push(col(arc, STEEL));
  }
  hoop(H * 0.55, R, 0.013, STEEL); hoop(H, R, 0.022, STEEL);
  // the crown: a boss the bars run in to, a shackle, and the cable up to the hatch
  { const boss = new THREE.CylinderGeometry(0.075, 0.1, 0.06, 20); boss.translate(0, H + DOME, 0); parts.push(col(boss, DARK));
    const cap = new THREE.SphereGeometry(0.075, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2); cap.scale(1, 0.5, 1); cap.translate(0, H + DOME + 0.03, 0); parts.push(col(cap, STEEL));
    const sh = new THREE.TorusGeometry(0.045, 0.011, 8, 20); sh.translate(0, H + DOME + 0.1, 0); parts.push(col(sh, BRASS));
  }
  // the door nobody opens from inside: two heavier uprights, hinges, a lock plate with a keyhole
  { const a = 0, c = Math.cos(a), s = Math.sin(a), at = (g, r, y, da = 0) => { g.translate(Math.cos(a + da) * r, y, Math.sin(a + da) * r); return g; };
    for (const da of [-0.19, 0.19]) parts.push(col(at(new THREE.CylinderGeometry(0.02, 0.02, H - 0.1, 10), R, 0.1 + (H - 0.1) / 2, da), DARK));
    for (const y of [0.3, 0.9]) { const h = new THREE.CylinderGeometry(0.027, 0.027, 0.09, 10); parts.push(col(at(h, R + 0.004, y, -0.19), BRASS)); }
    const plate = new THREE.BoxGeometry(0.03, 0.17, 0.12); plate.rotateY(-a); parts.push(col(at(plate, R + 0.012, 0.62, 0.19 - 0.07), DARK));
    const hole = new THREE.CylinderGeometry(0.014, 0.014, 0.034, 12); hole.rotateZ(Math.PI / 2); hole.rotateY(-a); parts.push(col(at(hole, R + 0.014, 0.64, 0.19 - 0.07), BLACK));
    const rail = new THREE.BoxGeometry(0.018, 0.03, 2 * R * Math.sin(0.19)); rail.rotateY(-a); for (const y of [0.3, 0.9]) parts.push(col(at(rail.clone(), R * Math.cos(0.19), y), STEEL));
    void c; void s; }
  return mergeGeometries(parts);                // (each part keeps its own smooth normals)
}
class Cage {
  constructor(parent, sfx) {
    this.sfx = sfx;
    const g = this.group = new THREE.Group(); g.visible = false; parent.add(g);
    // Lit by nothing: it shows by its own dull shine, and goes red with the alarm.
    this.mat = new THREE.MeshStandardMaterial({ vertexColors: true, metalness: 0.4, roughness: 0.42, emissive: new THREE.Color(0x0c0d10), emissiveIntensity: 1, side: THREE.DoubleSide });
    this.mat.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n  totalEmissiveRadiance += vColor.rgb * 0.2;'); };
    this.mat.customProgramCacheKey = () => 'heistCage';
    this.mesh = new THREE.Mesh(cageGeo(), this.mat); this.mesh.frustumCulled = false; g.add(this.mesh);
    // the cable it hangs on, paid out from the hatch as it falls
    const cg = new THREE.CylinderGeometry(0.009, 0.009, 1, 8); cg.translate(0, 0.5, 0);
    this.cable = new THREE.Mesh(cg, new THREE.MeshBasicMaterial({ color: 0x0c0d10 })); this.cable.position.y = CAGE.H + CAGE.DOME + 0.14; g.add(this.cable);
    this.lampMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 0.2, 0.12) });
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.05, 14, 8), this.lampMat); lamp.position.y = CAGE.H + CAGE.DOME - 0.07; g.add(lamp);
    const halo = TX.radial(0, 1);
    this.glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: halo, color: new THREE.Color(1.2, 0.1, 0.05), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); this.glow.position.y = CAGE.H + CAGE.DOME - 0.07; this.glow.scale.set(1.1, 1.1, 1); g.add(this.glow);
    this.pool = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: halo, color: new THREE.Color(0.9, 0.06, 0.03), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }));
    this.pool.scale.set(4.6, 1, 4.6); this.pool.renderOrder = 4; this.pool.visible = false; parent.add(this.pool);
    // the hatch it came out of, in the ceiling
    this.hatch = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.05, 1.9), new THREE.MeshBasicMaterial({ color: 0x08090b })); this.hatch.visible = false; parent.add(this.hatch);
    this.on = false; this.t = 0;
  }
  // Over (x, z), to come down to `y` (the floor; or, round a drone, as far as the drone: it stops there, on its cable)
  // from a ceiling at `top`. `floor`: where its light falls.
  drop(x, y, z, top, floor = y) {
    this.on = true; this.t = 0; this.x = x; this.y = y; this.z = z; this.landed = false; this.shake = 0; this.hung = y > floor + 0.05;
    this.from = Math.max(0.3, Math.min(3.4, top - y - CAGE.H - CAGE.DOME - 0.2)); this.fall = Math.sqrt(2 * this.from / 60);      // (it comes down hard: 60 m/s2)
    this.group.position.set(x, y + this.from, z); this.group.rotation.set(0, 0, 0); this.group.visible = true;
    this.pool.position.set(x, floor + 0.014, z); this.pool.visible = true;
    this.top = top; this.hatch.position.set(x, top - 0.03, z); this.hatch.visible = top - y < 8.9;
  }
  // Each frame it is out: the fall, the clang, the red. Returns true on the frame it lands.
  update(dt, now, calm) {
    if (!this.on) return false;
    this.t += dt; let hit = false;
    const h = this.t < this.fall ? this.from - 30 * this.t * this.t : 0;
    if (!this.landed && this.t >= this.fall) { this.landed = true; hit = true; this.shake = 1; }
    this.shake = Math.max(0, this.shake - dt * 3.2);
    const k = this.shake * this.shake, w = calm ? 0 : Math.sin(this.t * 46) * 0.035 * k;
    this.group.position.y = this.y + h + (calm ? 0 : Math.abs(Math.sin(this.t * 31)) * 0.03 * k);
    this.group.rotation.z = w; this.group.rotation.x = calm ? 0 : Math.cos(this.t * 39) * 0.025 * k;
    this.cable.scale.y = Math.max(0.01, this.top - this.group.position.y - CAGE.H - CAGE.DOME - 0.14);
    const beat = calm ? 0.75 : 0.5 + 0.5 * Math.sin(now * 12.6), on = this.landed ? beat : 0.25;      // (two flashes a second)
    this.mat.emissive.setRGB(0.03 + 0.3 * on, 0.03 - 0.015 * on, 0.035 - 0.02 * on);        // dull steel, catching the red as the lamp comes round
    this.lampMat.color.setRGB(0.5 + 2.4 * on, 0.1 + 0.15 * on, 0.08);
    const s = 0.7 + 0.9 * on; this.glow.scale.set(s, s, 1); this.glow.material.opacity = 0.35 + 0.65 * on;
    this.pool.material.opacity = this.landed ? 0.25 + 0.6 * on : 0.15;
    return hit;
  }
  // The bars are solid: whatever is in it stays in it. A knock sets it ringing.
  keep(v) {
    if (!this.on || !this.landed) return;
    const lim = CAGE.R - 0.02 - Math.min(0.3, v.radius || 0.19), dx = v.pos.x - this.x, dz = v.pos.z - this.z, d = Math.hypot(dx, dz);
    if (d > lim) {
      const nx = dx / d, nz = dz / d, into = v.vel.x * nx + v.vel.z * nz;
      v.pos.x = this.x + nx * lim; v.pos.z = this.z + nz * lim;
      if (into > 0) { v.vel.x -= nx * into * 1.5; v.vel.z -= nz * into * 1.5; if (into > 0.7) { this.shake = Math.max(this.shake, Math.min(0.8, into * 0.25)); if (this.sfx) this.sfx(into); } }
    }
    const top = this.y + CAGE.H + 0.1;
    if (this.hung && v.pos.y < this.y + 0.2) { v.pos.y = this.y + 0.2; if (v.vel.y < 0) v.vel.y = 0; }      // (hanging in the air, it has a floor of bars too)
    if (v.pos.y > top) { v.pos.y = top; if (v.kind === 'drone') { if (v.vel.y > 0) v.vel.y = 0; } else if (v.vy > 0) v.vy = 0; }
  }
  off() { this.on = false; this.group.visible = false; this.pool.visible = false; this.hatch.visible = false; }
}

export class Heist {
  constructor(G, ui) {
    this.G = G; this.ui = ui; this.plan = G.plan; this.state = 'idle'; this.briefing = false;
    this.attempts = 0; this.completed = 0; this.clean = 0; this.caught = 0; this.best = {}; this.taught = false;
    this.retry = null;            // { room, seed, lv }: the room a cage came down in, to be offered again as it was dealt
    this.avoid = null;            // and, once that has been turned down, the room not to offer next
    try { const s = JSON.parse(localStorage.getItem(KEY) || '{}'); this.attempts = s.attempts | 0; this.completed = s.completed | 0; this.clean = s.clean | 0; this.caught = s.caught | 0; this.taught = !!s.taught; Object.assign(this.best, s.best || {}); if (s.again && s.again.room) this.retry = { room: String(s.again.room), seed: s.again.seed | 0, lv: s.again.lv | 0 }; } catch { /* no storage */ }
    this.consoles = (G.plan.heistConsoles || []).map(c => ({ ...c, sx: c.x + c.fx * 1.3, sz: c.z + c.fz * 1.3 }));
    const g = this.group = new THREE.Group(); G.museum.group.add(g);
    // The button on each console: the one thing in the room that pulses.
    const dome = new THREE.SphereGeometry(0.1, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    this.buttonMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 0.15, 0.1) });
    for (const c of this.consoles) {
      const b = new THREE.Mesh(dome, this.buttonMat); b.position.set(c.x + c.fx * 0.29, c.y + 0.395, c.z + c.fz * 0.29); g.add(b);
      const pool = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.2), new THREE.MeshBasicMaterial({ map: TX.radial(0, 1), color: new THREE.Color(0.4, 0.04, 0.03), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }));
      pool.rotation.x = -Math.PI / 2; pool.position.set(c.x + c.fx * 0.9, c.y + 0.02, c.z + c.fz * 0.9); pool.renderOrder = 4; g.add(pool);
    }
    this.beams = new Beams(g);
    // The plinth, and the treasure on it: a small copy of the picture in a gilt frame, turning slowly.
    const std = o => new THREE.MeshStandardMaterial(o);
    this.plinth = new THREE.Group(); this.plinth.visible = false; g.add(this.plinth);
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.16, 0.3, 16), std({ color: 0x24262c, roughness: 0.5, emissive: 0x14161a, emissiveIntensity: 0.6 })); col.position.y = 0.15; this.plinth.add(col);
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.02, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.0, 0.76, 0.26) })); rim.position.y = 0.31; this.plinth.add(rim);
    const t = this.treasure = new THREE.Group(); t.visible = false;
    this.frame = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 0.018), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.25, 0.95, 0.32) }));
    this.picMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.95, 0.92, 0.85) });
    this.picA = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), this.picMat); this.picB = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), this.picMat); this.picB.rotation.y = Math.PI;
    this.halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: TX.radial(0, 1), color: new THREE.Color(0.42, 0.31, 0.1), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); this.halo.scale.set(0.8, 0.8, 1);
    t.add(this.frame, this.picA, this.picB, this.halo); g.add(t);
    this.o = {}; this.prev = new THREE.Vector3(); this.sets = []; this.cage = null;
    document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('[data-heist]'); if (!b || !this.briefing) return; e.stopPropagation(); if (b.dataset.heist === 'go') this.go(); else this.decline(true); }, true);
    addEventListener('keydown', e => { if (!this.briefing || e.repeat) return; if (e.code === 'Enter' || e.code === 'Space' || e.code === 'KeyE') { e.preventDefault(); this.go(); } else if (e.code === 'Escape') { e.preventDefault(); this.decline(true); } });
  }
  // Under way: on the way there, on the way back, or in the cage. (The security robots look the other way meanwhile.)
  get active() { return this.state === 'in' || this.state === 'out' || this.state === 'caged'; }
  get level() { return level(this.completed); }
  _save() { try { localStorage.setItem(KEY, JSON.stringify({ attempts: this.attempts, completed: this.completed, clean: this.clean, caught: this.caught, taught: this.taught, best: this.best, again: this.retry })); } catch { /* fine */ } }
  _tell(event, more) { try { window.dispatchEvent(new CustomEvent('museum:heist', { detail: { event, room: this.target ? this.target.id : null, time: +(this.elapsed || 0).toFixed(1), trips: this.trips || 0, ...more } })); } catch { /* fine */ } }
  // The security robots' own kit (src/guards.js): their voice, their dumpster.
  get guards() { return this._guards || (this._guards = features.find(f => f.id === 'guards') || null); }

  // The console this toy is pulled up at, when there is nothing running.
  near(v) {
    if (this.state !== 'idle' || this.briefing || this.G.held) return null;
    for (const c of this.consoles) {
      const dy = v.pos.y - c.y;
      if (dy > -0.3 && dy < 2.4 && (v.pos.x - c.sx) ** 2 + (v.pos.z - c.sz) ** 2 < 1.6 * 1.6 && Math.hypot(v.vel.x, v.vel.z) < 3) return c;
    }
    return null;
  }

  // The galleries this button will send you to, each with its route (worked out once: the building does not change).
  routes(c) {
    const G = this.G, plan = this.plan;
    if (c.pool) return c.pool;
    if (!this.nav) this.nav = way(plan);
    if (!this.rooms) this.rooms = targets(plan).filter(r => { const st = G.museum.rooms[r.id]; return st && st.arts.some(a => !a.mini); });
    const from = { x: c.sx, z: c.sz, y: c.y, room: c.room }, list = [];
    for (const r of this.rooms) {
      const first = lasers(plan, r, 0); if (!first) continue;
      const rt = this.nav.route(from, { x: first.plinth.x, z: first.plinth.z, y: r.y, room: r.id }); if (!rt) continue;
      const k = rt.pts.findIndex(p => p.door && p.room === r.id && Math.abs(p.door.y - r.y) < 0.3); if (k < 0) continue;
      list.push({ r, rt, k });
    }
    c.reach = list.length; c.all = list;
    return (c.pool = pool(list));
  }
  // Tonight's target: a gallery for this attempt (the same one until the attempt is used), a route to it, a picture in it,
  // and the clock. `skip`: rooms that turned out not to take the beams.
  _pick(c, skip) {
    const near = this.routes(c), R = this.retry;
    // Caged last time: the same gallery again, the same picture and the same beams, from whichever button this is.
    if (R) {
      const q = c.all.find(q => q.r.id === R.room && !(c.bad && c.bad.has(q.r.id)));
      if (q) { const rnd = dice(hash('heist') + R.seed * 7919); rnd(); return { ...this._job(q, rnd, R.lv), again: true, seed: R.seed }; }      // (the dice as they fell then: one throw for the room, the next for the picture)
    }
    let list = near.filter(q => !(c.bad && c.bad.has(q.r.id)) && !(skip && skip.has(q.r.id)));
    if (this.avoid && list.some(q => q.r.id !== this.avoid)) list = list.filter(q => q.r.id !== this.avoid);
    if (!list.length) return null;
    const rnd = dice(hash('heist') + this.attempts * 7919);
    return this._job(list[Math.floor(rnd() * list.length) % list.length], rnd);
  }
  // The job in one of a button's rooms (`q`, from routes()): which picture, how hard, and the clock.
  _job(q, rnd = dice(hash('heist') + this.attempts * 7919), lv = this.level) {
    const arts = this.G.museum.rooms[q.r.id].arts.filter(a => !a.mini), flat = arts.filter(a => !a.obj);
    const art = (flat.length ? flat : arts)[Math.floor(rnd() * (flat.length || arts.length)) % (flat.length || arts.length)];
    const rings = lasers(this.plan, q.r, 0, false, { level: lv }).rings.length;
    return { ...q, art, level: lv, par: pars(q.rt, rings, this.completed) };
  }

  // The button is pressed: say what the job is, and wait for a yes.
  brief(c) {
    const p = this._pick(c);
    if (!p) { this.ui.say('The console hums, and thinks better of it. No gallery will do tonight.', 0, 5); return false; }
    this.pending = { ...p, console: c };
    this._card(p);
    $('heistBrief').hidden = false; this.briefing = true;
    const first = $('heistBrief').querySelector('[data-first]'); if (first) first.focus({ preventScroll: true });
    return true;
  }
  _card(p) {
    const w = p.art.work, P = p.par;
    $('hbTitle').textContent = roomName(p.r);
    const over = $('heistBrief').querySelector('.over'); if (over) over.textContent = p.again ? 'In case of heist \u00a0·\u00a0 back for another go' : "In case of heist \u00a0·\u00a0 tonight's target";
    $('hbText').textContent = `${p.again ? 'The cage got you in there. It is all as it was: the same room, the same beams. The' : 'Tonight\u2019s'} treasure is “${w.t}”${w.a ? ', ' + w.a : ''}. A toy-sized copy of it stands on a plinth in the middle of ${roomName(p.r)}, on ${LEVEL[p.r.floor] || 'another floor'}. The real one stays on the wall. Fetch the copy and bring it back to this button.`;
    const more = [this.completed ? `HEISTS DONE ${this.completed}` : '', this.best[p.r.id] ? `BEST HERE ${clock(this.best[p.r.id])}` : ''].filter(Boolean).join(' · ');
    $('hbFacts').innerHTML = `ABOUT ${Math.round(p.rt.len / 10) * 10} M AWAY · ON THE CLOCK <b>${clock(P.total)}</b><br>PAR OUT ${clock(P.out)} · THE ROOM ${clock(P.in + P.leave)} · BACK ${clock(P.back)}<br>LASERS: THE LOW ONES CAN BE HOPPED<br>ONE TOUCH AND THE CAGE DROPS<br>THE JOB PAYS <b>${payFor(p.level, 3)}</b> CHIPS, UP TO ${payFor(p.level, 0)} WITH TIME TO SPARE` + (more ? '<br>' + more : '');
  }
  // Shut the card. `no`: the player said "Not tonight" (rather than the heist starting, or the game closing it): a room
  // offered for another go is given up, and the next press moves on to a new one.
  decline(no) {
    if (no && this.pending && this.pending.again && this.retry) { this.avoid = this.retry.room; this.retry = null; this._save(); }
    this.briefing = false; this.pending = null; $('heistBrief').hidden = true;
  }

  go() {
    let p = this.pending; const G = this.G, plan = this.plan; if (!p) return this.decline();
    const c = p.console, v = G.vehicle, drone = !!v && v.kind === 'drone';
    this.decline();
    // Deal the room. One that will not take the beams (something stands where they must go) is never offered again, and another is tried.
    // (Another go at a room: the seed it was dealt from then. Otherwise this attempt's own.)
    let seed = p.again ? p.seed : this.attempts, set = null, door = null;
    for (let n = 0; n < 4 && p; n++) {
      door = p.rt.pts[p.k].door;
      set = deal(plan, p.r, seed, false, door, { level: p.level, drone });
      if (set) break;
      (c.bad || (c.bad = new Set())).add(p.r.id);
      if (p.again) this.retry = null;                  // (it cannot be dealt from this button's door: let go of it)
      seed = this.attempts;
      const q = this._pick(c); p = q ? { ...q, console: c } : null;
    }
    this.attempts++; this.avoid = null; this._save();
    if (!set || !p) { this.ui.say('The lasers would not come on. Try the button again.', 0, 5); return; }
    this.seed = seed; this.target = p.r; this.door = door; this.art = p.art; this.console = c; this.route0 = p.rt; this.lv = p.level; this.kind = v ? v.kind : 'car';
    this.par = p.par; this.limit = p.par.total; this.left = this.limit; this.elapsed = 0; this.trips = 0; this.now = 0; this.safeUntil = 0; this.dim = 0;
    this.inRoom = 0; this.grabAt = -1; this.leftRoom = -1; this.tick = 11; this.gateBox = null;
    this.doorIn = inside(door, p.r, 0.9); this.spot = set.plinth;
    set.t0 = 0; set.shownAt = 0; set.rect = p.r; set.main = true;
    this.sets = [set];
    // A gate round the doorway on the near side, if the room before has the floor for it and it can be passed both ways.
    // (Not on a first heist.) If the one dealt cannot be proved, the plain blinking one is tried.
    const before = p.rt.pts[p.k - 1], r2 = before && before.door === door ? plan.byId[before.room] : null, entry = p.rt.pts[p.k - 2];
    if (r2 && r2.id !== c.room && p.level > 0) {
      const from = entry && entry.room === r2.id ? entry : null, ins = inside(door, r2, 0.9), far = from || { x: (r2.x0 + r2.x1) / 2, z: (r2.z0 + r2.z1) / 2 };
      for (const lv of p.level > 1 ? [p.level, 1] : [1]) {
        const g = gate(plan, r2, door, from, seed, { level: lv }); if (!g) break;
        if (solve(plan, r2, g.beams, far, ins, { reach: 0.5 }) >= 0 && solve(plan, r2, g.beams, ins, far, { reach: 0.6 }) >= 0) {
          const use = drone ? gate(plan, r2, door, from, seed, { level: lv, drone: true }) : g;
          use.t0 = 0; use.shownAt = 0; use.rect = r2; use.again = d => gate(plan, r2, door, from, seed, { level: lv, drone: d }); this.sets.push(use); this.gateBox = use.box;
          break;
        }
      }
    }
    // The treasure, on its plinth.
    const a = p.art, k = Math.min(1.6, Math.max(0.6, (a.w || 1) / (a.h || 1))), pw = k >= 1 ? 0.22 : 0.22 * k, ph = k >= 1 ? 0.22 / k : 0.22;
    this.frame.scale.set(pw + 0.035, ph + 0.035, 1); this.picA.scale.set(pw, ph, 1); this.picB.scale.set(pw, ph, 1); this.picA.position.z = 0.0095; this.picB.position.z = -0.0095;
    this.th = ph + 0.035;
    this.plinth.position.set(set.plinth.x, p.r.y, set.plinth.z); this.plinth.visible = true;
    this._home(); this.treasure.visible = true;
    if (!this.cage) this.cage = new Cage(this.group, hard => { const s = G.sound; s.beep(520 + Math.random() * 180, 0.09, Math.min(0.07, 0.02 * hard)); s.tick(0.05, 2600, 0.05); });      // (built now, while nobody is looking, not as the alarm goes)
    this.state = 'in'; this.prev.set(0, -999, 0); this.routeAt = -9; this.shown = {};
    $('heist').hidden = false; $('pAbandon').hidden = false; document.body.classList.add('heisting');
    this._goal();
    this.ui.callout('THE HEIST IS ON'); G.sound.gate();
    this.ui.say(`To ${roomName(p.r)}, on ${LEVEL[p.r.floor] || 'another floor'}: ${clock(p.par.out)} is par. Follow the arrow. One touch of a beam and the cage drops.`, 0.8, 8);
    this._tell('start');
  }
  _home() { const t = this.treasure; if (t.parent !== this.group) this.group.add(t); t.position.set(this.spot.x, this.target.y + 0.33 + this.th / 2 + 0.03, this.spot.z); t.rotation.set(0, 0, 0); this.halo.visible = true; }
  // Where to now: the plinth, or the button. The map and the route light are told too, if they are there.
  _goal() {
    const G = this.G, c = this.console;
    this.goal = this.state === 'out' ? { x: c.sx, y: c.y, z: c.sz, room: c.room, label: 'The security control room' } : { x: this.spot.x, y: this.target.y, z: this.spot.z, room: this.target.id, label: roomName(this.target) };
    G.mapMarks = [{ x: this.goal.x, y: this.goal.y, z: this.goal.z, colour: '#ff5040', ring: true }];
    if (G.nav && G.nav.goTo) try { G.nav.goTo({ x: this.goal.x, y: this.goal.y, z: this.goal.z, label: this.goal.label }); } catch { /* the map is somebody else's */ }
    this.routeAt = -9;
  }

  // Once a frame while driving.
  update(dt, v) {
    const G = this.G;
    if (!this.active) { this.buttonMat.color.setRGB(1.5 + 0.9 * Math.sin(G.t * 3), 0.15, 0.1); return; }
    this.buttonMat.color.setRGB(this.state === 'out' ? 1.5 + 0.9 * Math.sin(G.t * 9) : 0.5, 0.15, 0.1);
    this.now += dt;
    if (this.state === 'caged') return this._caged(dt, v);
    this.elapsed += dt; this.left -= dt;
    const drone = v.kind === 'drone', B = BODY[drone ? 'drone' : 'car'], cx = v.pos.x, cy = v.pos.y + B.up, cz = v.pos.z, rad = B.r;
    if (this.left <= 0) return this._lose('time');
    // Somebody has swapped toys: the same room, with the bars over each hurdle where that toy must go under them.
    if (v.kind !== this.kind) {
      this.kind = v.kind;
      this.sets = this.sets.map(s => { const q = s.recipe ? twin(this.plan, this.target, s, drone) : s.again ? s.again(drone) : null; if (!q) return s; q.t0 = s.t0; q.shownAt = s.shownAt; q.rect = s.rect; q.main = s.main; q.again = s.again; return q; });
      this.safeUntil = Math.max(this.safeUntil, this.now + 1.2); this.prev.set(0, -999, 0);
    }
    // Touching a beam: the path flown since the last frame against every lit beam near enough to matter.
    const jumped = this.prev.y < -900 || this.prev.distanceToSquared(v.pos) > 9;
    if (jumped) this.prev.set(cx, cy, cz);
    if (this.now > this.safeUntil && !G.held) {
      const o = this.o;
      scan: for (const set of this.sets) {
        const q = set.rect; if (cx < q.x0 - 1 || cx > q.x1 + 1 || cz < q.z0 - 1 || cz > q.z1 + 1 || cy < q.y - 1 || cy > q.y + 5) continue;
        const t = this.now - set.t0;
        for (const b of set.beams) {
          beamAt(b, t, o);
          if (o.on && segDist2(this.prev.x, this.prev.y, this.prev.z, cx, cy, cz, o.ax, o.ay, o.az, o.bx, o.by, o.bz) < rad * rad) { this.lastTrip = { x: cx, y: cy, z: cz, kind: b.k, h: +(o.ay - q.y).toFixed(2), hop: !!b.hop, at: this.now }; this._trip(v, set); break scan; }
        }
      }
    }
    if (this.state === 'caged') { this.beams.draw(this.sets, this.now, G.camera.position, this.dim, G.set.reduce); return; }
    if (!this.active) return;
    this.prev.set(cx, cy, cz);
    this.dim += ((this.now < this.safeUntil ? 1 : 0) - this.dim) * Math.min(1, dt * 6);
    // In the room, or at the gate before its door: its own allowance of the clock runs while you are (heistplan.js pars).
    const R = this.target, onFloor = v.pos.y > R.y - 0.5 && v.pos.y < R.top + 0.5, gb = this.gateBox;
    const here = onFloor && ((v.pos.x > R.x0 && v.pos.x < R.x1 && v.pos.z > R.z0 && v.pos.z < R.z1) || (!!gb && v.pos.x > gb.x0 - 2.5 && v.pos.x < gb.x1 + 2.5 && v.pos.z > gb.z0 - 2.5 && v.pos.z < gb.z1 + 2.5));
    if (here) {
      if (this.state === 'in') {
        this.inRoom += dt;
        if (!this.taught && v.kind === 'car') { this.taught = true; this._save(); this.ui.say(`A low beam right across the way is a hurdle: ${matchMedia('(pointer: coarse)').matches ? 'JUMP' : 'Space'} hops it. A tap. Hold it and you hit the bars above.`, 0, 8); }
      }
    } else if (this.state === 'out' && this.leftRoom < 0) this.leftRoom = this.now;
    // The treasure: turning on its plinth, or riding on the roof, or slung underneath.
    const t = this.treasure;
    if (this.picMat.map !== this.art.mat.map) { this.picMat.map = this.art.mat.map; this.picMat.needsUpdate = true; }
    if (this.state === 'in') {
      t.rotation.y = G.t * 0.9; t.position.y = this.target.y + 0.33 + this.th / 2 + 0.03 + 0.02 * Math.sin(G.t * 2);
      const d = Math.hypot(v.pos.x - this.spot.x, v.pos.z - this.spot.z);
      // (A car takes it as it comes down over it from a hop: anywhere under the bars. A drone has to come down to it.)
      if (d < (drone ? 0.7 : 0.78) && v.pos.y - this.target.y < (drone ? 1.3 : 2) && v.pos.y > this.target.y - 0.3) this._grab(v);
    } else {
      if (t.parent !== v.group) { v.group.add(t); this.halo.visible = false; }
      if (drone) { t.position.set(0, -0.1 - this.th / 2, 0); t.rotation.set(0, 0, 0); } else { t.position.set(0, 0.2, -0.04); t.rotation.set(-1.25, 0, 0); }
      const c = this.console;
      if (Math.hypot(v.pos.x - c.sx, v.pos.z - c.sz) < 1.9 && Math.abs(v.pos.y - c.y) < 2.6) return this._win();
    }
    this.beams.draw(this.sets, this.now, G.camera.position, this.dim, G.set.reduce);
    this._hud(v);
  }

  _grab(v) {
    const G = this.G;
    this.state = 'out'; this.grabAt = this.now; this.leftRoom = -1;
    // The room deals itself again for the way out, with the turning beam set off where it is least in the toy's way.
    const from = { x: v.pos.x, z: v.pos.z }, toy = Math.atan2(v.pos.z - this.spot.z, v.pos.x - this.spot.x);
    const set = deal(this.plan, this.target, this.seed, true, this.door, { from, toy, level: this.lv, drone: v.kind === 'drone' });
    this.sets = this.sets.filter(s => !s.main);
    if (set) { set.t0 = this.now; set.shownAt = this.now; set.rect = this.target; set.main = true; this.sets.unshift(set); }
    this.safeUntil = this.now + GRACE;
    v.vel.multiplyScalar(0.12); if (typeof v.speed === 'number') v.speed *= 0.12;      // it pulls up to take it: nobody coasts on into the new beams
    this.ui.callout('GOT IT'); G.sound.perfect();
    const P = this.par;
    this.ui.say(`${clock(this.left)} left to get it to the button; par for the way back is ${clock(P.leave + P.back)}. The beams have moved.`, 0.6, 8);
    this._goal(); this._tell('grab');
  }

  // A beam is touched. The alarm, and a cage out of the ceiling; no second chances.
  _trip(v) {
    const G = this.G;
    this.trips++; this.caught++; this.retry = { room: this.target.id, seed: this.seed, lv: this.lv }; this._save(); this._tell('trip');      // (the room is kept as it is, for another go)
    this.state = 'caged'; this.held = 0; this.handed = false; this.spoke = false;
    const r = roomAt(this.plan, v.pos.x, v.pos.z, v.pos.y), fy = r ? r.y : this.sets[0].rect.y;
    v.vel.multiplyScalar(0.25); if (typeof v.speed === 'number') v.speed *= 0.25;
    // Where it comes down: over the toy, but clear of the walls, so that the whole of it is in the room.
    let x = v.pos.x + v.vel.x * 0.12, z = v.pos.z + v.vel.z * 0.12;
    if (r) { x = Math.max(r.x0 + CAGE.R + 0.1, Math.min(r.x1 - CAGE.R - 0.1, x)); z = Math.max(r.z0 + CAGE.R + 0.1, Math.min(r.z1 - CAGE.R - 0.1, z)); }
    const top = Math.min(fy + 9, ceilingAt(this.plan, x, z, fy + 0.5));
    this.cage.drop(x, v.kind === 'drone' ? Math.max(fy, Math.min(v.pos.y - 0.55, top - CAGE.H - CAGE.DOME - 0.6)) : fy, z, top, fy);
    this._alarm();
    this.ui.callout('ALARM!');
    // (Once it is all over and the dumpster has had its say: what that was, if it was a hurdle driven into.)
    if (this.lastTrip && this.lastTrip.hop && v.kind === 'car') this.ui.say(`That was a hurdle: a low beam with nothing over it. ${matchMedia('(pointer: coarse)').matches ? 'JUMP' : 'Space'} hops one. A tap will do.`, 15, 7);
    $('heist').classList.remove('last'); $('heist').classList.add('caught');
    G.mapMarks = []; if (G.nav && G.nav.clear) try { G.nav.clear(); } catch { /* the map is somebody else's */ }
  }
  _caged(dt, v) {
    const G = this.G, c = this.cage, gd = this.guards;
    this.held += dt;
    if (c.update(dt, this.now, G.set.reduce)) { (gd && gd.sfx ? gd.sfx.clang() : 0); G.sound.bump(4); G.sound.beep(196, 0.5, 0.06); }
    if (!G.held) { c.keep(v); if (v.sync) v.sync(0); }
    if (!this.spoke && this.held > 0.55) { this.spoke = true; this.ui.callout('INTRUDER ALERT'); if (gd && gd.sfx) gd.sfx.speak('intruder-alert'); }
    // The alarm goes on as long as it is held.
    if (this.held > this.alarmAt && this.held < HELD - 0.3) this._alarm();
    this.dim += (1 - this.dim) * Math.min(1, dt * 4);
    this.beams.draw(this.sets, this.now, G.camera.position, this.dim, G.set.reduce);
    if (!this.handed && this.held >= HELD) {
      this.handed = true;
      // Carried out: the security robots' own way of doing it, to their dumpster, and nothing kept.
      const took = gd && gd.carryOut ? gd.carryOut({ fine: 0, why: 'heist' }) : false;
      if (!took) { const k = this.console; this._finishCaught(true); v.place(k.sx, k.sz, Math.atan2(-k.fx, -k.fz), v.kind === 'drone' ? k.y + 0.7 : k.y); G.camYaw = v.yaw; return; }      // (no dumpster to be had: put back at the button)
    }
    if (this.handed && this.held >= HELD + 0.6) this._finishCaught();      // (the screen is dark by now: the cage, the beams and the copy are cleared away behind it)
  }
  _finishCaught(say) {
    this._tell('lose', { why: 'caught' });
    if (say) this.ui.say('Caged. The heist is off; it cost you nothing else. The button will be there when you are.', 0.5, 7);      // (otherwise the dumpster has the last word: src/guards.js)
    this._end();
  }
  _alarm() {
    const s = this.G.sound, el = $('heistFlash');
    for (let i = 0; i < 6; i++) setTimeout(() => s.beep(i % 2 ? 660 : 880, 0.16, 0.07), i * 180);
    el.classList.remove('on'); void el.offsetWidth; el.classList.add('on');
    this.alarmAt = (this.held || 0) + 1.15;
  }

  _win() {
    const G = this.G, id = this.target.id, time = this.elapsed, was = this.best[id], f = this.left / this.limit;
    this.completed++; this.clean++; this.retry = null;                      // (won: on to another room)
    const record = !(was > 0) || time < was; if (record) this.best[id] = +time.toFixed(1);
    const ri = Math.max(0, RANKS.findIndex(q => f >= q[0])), rank = RANKS[ri][1];
    const pay = payFor(this.lv, ri), P = G.poker, paid = !!(P && (P.earn || P.spend));
    if (paid) { if (P.earn) P.earn(pay); else P.spend(-pay); }
    this._save(); this._tell('win', { rank, ghost: rank === RANKS[0][1], left: +this.left.toFixed(1), pay: paid ? pay : 0 });
    this.ui.callout(`HEIST COMPLETE\n${rank}${paid ? `\n+${pay} CHIPS` : ''}`); G.sound.finish();
    this.ui.say(`“${this.art.work.t}”, out of ${roomName(this.target)} in ${clock(time)}, with ${clock(this.left)} still on the clock and not a beam touched.${record && was ? ' A new best for that room.' : ''}${paid ? ` The job pays ${pay} chips.` : ''} The copy goes in the lost property box.`, 1.2, 10);
    this._end();
  }
  _lose(why) {
    this.retry = null; this._save();                 // (the clock ran out: that room has had its chance)
    this._tell('lose', { why });
    this.ui.callout('THE HEIST IS OFF');
    this.ui.say('The clock ran out. The lasers go dark, the copy goes back on its plinth, and the guards never knew.', 0.8, 9);
    this.G.sound.bump(2);
    this._end();
  }
  // Walk away from it: from the pause menu, or because the game itself is ending.
  abandon(quiet) { if (this.briefing) this.decline(); if (!this.active) return; this._tell('lose', { why: 'left' }); if (!quiet) this.ui.say('The heist is off. The lasers go dark, and the guards never knew.', 0.3, 6); this._end(); }
  // Everything back as it was.
  _end() {
    const G = this.G;
    this.state = 'idle'; this.sets = []; this.beams.clear(); if (this.cage) this.cage.off();
    this.plinth.visible = false; this.treasure.visible = false; if (this.treasure.parent !== this.group) this.group.add(this.treasure);
    this.picMat.map = null; this.picMat.needsUpdate = true;
    const el = $('heist'); el.hidden = true; el.classList.remove('late', 'last', 'caught'); $('pAbandon').hidden = true; document.body.classList.remove('heisting'); $('heistFlash').classList.remove('on');
    G.mapMarks = [];
    if (G.nav && G.nav.clear) try { G.nav.clear(); } catch { /* the map is somebody else's */ }
    this.goal = null; this.target = null; this.pending = null;
  }

  // How many seconds in hand against par, from here: the clock, less what par says the rest should take. The drive
  // legs are counted by how much of the route is left; the room's allowance by the time spent in it.
  ahead(dist) {
    const P = this.par, f = Math.max(0, Math.min(1, dist / (this.route0.len || 1)));
    if (this.state === 'in') return this.left - ((this.inRoom > 0 ? 0 : P.out * f) + Math.max(0, P.in - this.inRoom) + P.leave + P.back);
    return this.left - (this.leftRoom < 0 ? Math.max(0, P.leave - (this.now - this.grabAt)) + P.back : P.back * f);
  }
  // The clock, how you stand against par, and an arrow to the next doorway on the way.
  _hud(v) {
    const G = this.G, s = this.shown;
    if (this.now - this.routeAt > 1.2 || G.roomId !== this.routeRoom) {
      this.routeAt = this.now; this.routeRoom = G.roomId;
      const here = roomAt(this.plan, v.pos.x, v.pos.z, v.pos.y);
      const rt = here ? this.nav.route({ x: v.pos.x, y: v.kind === 'drone' && v.pos.y - here.y < 4 ? here.y : v.pos.y, z: v.pos.z, room: here.id }, this.goal) : null;
      if (rt || !here) this.route = rt;                  // (half way up a stair there is no answer: keep the last one)
    }
    let p = this.goal, dist = Math.hypot(p.x - v.pos.x, p.z - v.pos.z);
    if (this.route) { dist = this.route.len; p = this.route.pts.find(q => Math.hypot(q.x - v.pos.x, q.z - v.pos.z) > 1.3) || this.goal; }
    const a = Math.atan2(p.x - v.pos.x, p.z - v.pos.z) - G.camYaw, ang = -Math.atan2(Math.sin(a), Math.cos(a)), dy = p.y - v.pos.y + (v.kind === 'drone' ? 0.6 : 0);
    $('hArrow').firstElementChild.style.transform = `rotate(${ang}rad)`;
    const set = (id, text) => { if (s[id] !== text) { s[id] = text; $(id).textContent = text; } };
    const el = $('heist'), P = this.par, room = this.state === 'in' ? this.inRoom > 0 : this.leftRoom < 0, k = Math.round(this.ahead(dist));
    set('hClock', clock(this.left));
    set('hLeg', room ? 'THE ROOM' : this.state === 'in' ? `OUT · PAR ${clock(P.out)}` : `BACK · PAR ${clock(P.back)}`);
    set('hPar', k > 1 ? `${k} S AHEAD` : k < -1 ? `${-k} S BEHIND` : 'ON PAR');
    if (s.side !== Math.sign(k > 1 ? 1 : k < -1 ? -1 : 0)) { s.side = Math.sign(k > 1 ? 1 : k < -1 ? -1 : 0); $('hPar').className = s.side > 0 ? 'ahead' : s.side < 0 ? 'behind' : ''; }
    set('hGoal', this.state === 'out' ? 'BACK TO THE BUTTON' : roomName(this.target).toUpperCase());
    set('hDist', `${Math.round(dist)} m` + (Math.abs(dy) > 1.5 ? (dy > 0 ? ' ▲' : ' ▼') : ''));
    el.classList.toggle('late', this.left < 30); el.classList.toggle('last', this.left < 10);
    // The last ten seconds are counted out loud.
    const sec = Math.ceil(this.left);
    if (sec <= 10 && sec < this.tick) { this.tick = sec; G.sound.tick(0.11, sec <= 3 ? 2100 : 1500, 0.05); if (sec <= 3) G.sound.tick(0.07, 1050, 0.05, 0.09); }
  }
}

export { CAGE };
