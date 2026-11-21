// Robot security guards. A handful of squat wheeled robots patrol the galleries at night, each on its own
// beat: out along a short chain of rooms and back, stopping in each to sweep its searchlight about. Where
// the light falls (a pool on the floor, cut off by the walls) is where it can see. Stay in it and a "?"
// comes up while it makes up its mind; then "!" and it comes for you, much slower than the car but
// quicker round a corner. Break its line of sight for three seconds and it gives up. Let it get within
// a metre and a half and its prong glows for half a second (time to swerve or duck behind something),
// then a bolt: you are zapped, carried out, and wake up in the dumpster round the back. It keeps 50 chips.
//
// Your headlamp gives you away: lights off, it sees you at 6 m; lights on, at 9.5 m and faster. Benches
// and low boxes hide a car crouched close behind them; walls, columns and cases hide anything.
//
// Explore only, never in a race, not during a heist; they stand still while you look at a work. Settings
// has a switch (`guards`). The patrols, the grid they drive on and what they can see are in src/guardplan.js.

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { feature } from './features.js';
import * as TX from './textures.js';
import { confine, groundAt } from './plan.js';
import { BOT, ROOM, patrols, beat, cellAt, lineClear, sight, reach, path } from './guardplan.js';

const PHONE = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
const COUNT = PHONE ? 3 : 6;
const HALF = 0.5;                       // the searchlight's half-angle, radians
const SEE = { dark: 6, lit: 9.5 };      // how far it sees you, headlamp off and on
const FAN = 20;                         // rays in the pool of light on the floor
const LOSE = 3;                         // seconds out of sight and it gives up
const CHARGE = 0.5;                     // the tell before the bolt
const EVADE = 5;                        // chases shaken off, for the trophy
const FINE = 50;                        // chips it keeps
const TAU = Math.PI * 2;
const wrap = a => { a = (a + Math.PI) % TAU; if (a < 0) a += TAU; return a - Math.PI; };
const turn = (a, b, max) => { const d = wrap(b - a); return a + Math.max(-max, Math.min(max, d)); };
const ease = t => t * t * (3 - 2 * t);

// Everything in the building glows a little in its own colour (src/lights.js); these do too, or at night they are black shapes.
function selfLit(mat, k) {
  mat.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n  totalEmissiveRadiance += vColor.rgb * ' + k.toFixed(3) + ';'); };
  mat.customProgramCacheKey = () => 'selfLit' + k;
  return mat;
}

// ------------------------------------------------------------------ the robot --
function paint(g, hex) { g = g.index ? g.toNonIndexed() : g; const c = new THREE.Color(hex), n = g.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) { a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; } g.setAttribute('color', new THREE.BufferAttribute(a, 3)); if (g.attributes.uv) g.deleteAttribute('uv'); return g; }
const cyl = (r0, r1, h, x, y, z, hex, seg = 20, open = false, t0 = 0, tl = TAU) => { const g = new THREE.CylinderGeometry(r0, r1, h, seg, 1, open, t0, tl); g.translate(x, y + h / 2, z); return paint(g, hex); };
const box = (w, h, d, x, y, z, hex) => { const g = new THREE.BoxGeometry(w, h, d); g.translate(x, y + h / 2, z); return paint(g, hex); };
const ball = (r, x, y, z, hex, sy = 1, half = false) => { const g = new THREE.SphereGeometry(r, 16, half ? 6 : 10, 0, TAU, 0, half ? Math.PI / 2 : Math.PI); g.scale(1, sy, 1); g.translate(x, y, z); return paint(g, hex); };
const ring = (r, t, x, y, z, hex, rx = Math.PI / 2) => { const g = new THREE.TorusGeometry(r, t, 6, 20); g.rotateX(rx); g.translate(x, y, z); return paint(g, hex); };
const rodZ = (r, len, x, y, z, hex) => { const g = new THREE.CylinderGeometry(r, r, len, 14); g.rotateX(Math.PI / 2); g.translate(x, y, z + len / 2); return paint(g, hex); };

const SHELL = 0xc8ced6, NAVY = 0x1d2a44, RUBBER = 0x1a1c20, YEL = 0xd9a71c, COPPER = 0xb8733a, DARK = 0x2a2e35;
// The body, which turns with the way it drives: a rubber skirt over its wheels, a pale shell with a navy band and a yellow pinstripe.
function bodyGeo() {
  return mergeGeometries([
    cyl(0.37, 0.39, 0.13, 0, 0.03, 0, RUBBER, 24),
    cyl(0.33, 0.36, 0.06, 0, 0.16, 0, DARK, 24),
    cyl(0.3, 0.335, 0.2, 0, 0.22, 0, SHELL, 24),
    cyl(0.29, 0.3, 0.09, 0, 0.42, 0, NAVY, 24),
    cyl(0.292, 0.292, 0.02, 0, 0.51, 0, YEL, 24),
    cyl(0.26, 0.29, 0.19, 0, 0.53, 0, SHELL, 24),
    ring(0.255, 0.022, 0, 0.72, 0, DARK),
    box(0.3, 0.06, 0.05, 0, 0.09, 0.37, DARK),                 // a bumper, front
    box(0.08, 0.04, 0.02, -0.1, 0.3, 0.315, 0xb0201a), box(0.08, 0.04, 0.02, 0.1, 0.3, 0.315, 0xb0201a),      // reflectors
  ]);
}
// The head, which turns on its own: a navy drum with a pale dome, the searchlight, the antenna and the prong the bolt comes from.
function headGeo() {
  return mergeGeometries([
    cyl(0.22, 0.24, 0.2, 0, 0.72, 0, NAVY, 22),
    ball(0.22, 0, 0.92, 0, SHELL, 0.55, true),
    rodZ(0.075, 0.14, 0, BOT.lens, 0.16, DARK),               // the lamp housing, poking out of the front
    ring(0.075, 0.012, 0, BOT.lens, 0.3, DARK, 0),
    cyl(0.006, 0.006, 0.3, -0.11, 0.95, -0.07, 0x9aa0a8, 6),  // the antenna
    cyl(0.03, 0.035, 0.05, 0.12, 0.95, 0.06, DARK, 10),       // the prong's foot
    (() => { const g = new THREE.CylinderGeometry(0.011, 0.014, 0.16, 8); g.rotateX(0.5); g.translate(0.12, 1.02, 0.1); return paint(g, COPPER); })(),
    ring(0.024, 0.006, 0.12, 0.99, 0.085, COPPER, Math.PI / 2 - 0.5), ring(0.024, 0.006, 0.12, 1.02, 0.1, COPPER, Math.PI / 2 - 0.5), ring(0.024, 0.006, 0.12, 1.05, 0.115, COPPER, Math.PI / 2 - 0.5),
    ball(0.024, 0.12, BOT.emitter, 0.14, COPPER),
  ]);
}
// The parts that glow, in the robot's mood: a visor round the front of the head, the beacon on top, the antenna tip.
function glowGeo() {
  const visor = new THREE.CylinderGeometry(0.243, 0.243, 0.035, 18, 1, true, -1.0, 2.0); visor.translate(0, 0.875, 0);
  const beacon = new THREE.SphereGeometry(0.045, 12, 6, 0, TAU, 0, Math.PI / 2); beacon.scale(1, 1.3, 1); beacon.translate(0, 1.03, -0.03);
  const tip = new THREE.SphereGeometry(0.018, 8, 6); tip.translate(-0.11, 1.26, -0.07);
  for (const g of [visor, beacon, tip]) if (g.attributes.uv) g.deleteAttribute('uv');
  return mergeGeometries([visor.toNonIndexed(), beacon.toNonIndexed(), tip.toNonIndexed()]);
}
const EMIT = new THREE.Vector3(0.12, BOT.emitter, 0.14);        // where the prong's tip is, in the head's frame

const MOOD = {
  calm: new THREE.Color(0.25, 1.1, 1.6), wary: new THREE.Color(2.0, 1.15, 0.15), hunt: new THREE.Color(2.4, 0.18, 0.12),
  poolCalm: new THREE.Color(0.55, 0.72, 0.85), poolWary: new THREE.Color(0.9, 0.62, 0.18), poolHunt: new THREE.Color(1.0, 0.2, 0.14),
};
const moodOf = m => (m === 'chase' || m === 'charge' || m === 'hold' ? 'hunt' : m === 'alert' || m === 'search' ? 'wary' : 'calm');

function glyph(ch, colour) {
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  g.font = '900 104px ui-rounded, system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.lineWidth = 14; g.strokeStyle = 'rgba(10,12,18,0.9)'; g.strokeText(ch, 64, 70); g.fillStyle = colour; g.fillText(ch, 64, 70);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

// The pool of light on the floor: a fan of rays, each stopped by the first wall, bright near the lamp and soft at the edges.
const POOL_V = 'attribute float aT; attribute float aE; varying float vT; varying float vE; void main() { vT = aT; vE = aE; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
const POOL_F = 'uniform vec3 uC; uniform float uK; varying float vT; varying float vE; void main() { float edge = 1.0 - smoothstep(0.55, 1.0, abs(vE)); float fall = (1.0 - smoothstep(0.5, 1.0, vT)) * (0.45 + 0.55 * smoothstep(0.0, 0.18, vT)); gl_FragColor = vec4(uC * (edge * fall * uK), 1.0); }';
function poolMesh() {
  const n = FAN * 3, pos = new Float32Array(n * 3), t = new Float32Array(n), e = new Float32Array(n);
  for (let i = 0; i < FAN; i++) { const e0 = -1 + 2 * i / FAN, e1 = -1 + 2 * (i + 1) / FAN; e[i * 3] = (e0 + e1) / 2; e[i * 3 + 1] = e0; e[i * 3 + 2] = e1; }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
  g.setAttribute('aT', new THREE.BufferAttribute(t, 1).setUsage(THREE.DynamicDrawUsage));
  g.setAttribute('aE', new THREE.BufferAttribute(e, 1));
  const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ vertexShader: POOL_V, fragmentShader: POOL_F, uniforms: { uC: { value: MOOD.poolCalm.clone() }, uK: { value: 0.42 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
  m.frustumCulled = false; m.renderOrder = 4; m.matrixAutoUpdate = false; return m;
}

// ------------------------------------------------------------------ the bolt --
// A jagged line of light from the prong to whatever it hits, re-struck every few hundredths of a second:
// a strip per segment, turned to face the camera, white-hot down the middle and blue at the edges.
const MAXS = 40;
class Bolt {
  constructor(parent) {
    const g = this.geo = new THREE.BufferGeometry();
    this.pos = new Float32Array(MAXS * 12); this.alpha = new Float32Array(MAXS * 4);
    const uv = new Float32Array(MAXS * 8), idx = new Uint16Array(MAXS * 6);
    for (let i = 0; i < MAXS; i++) { uv.set([0, -1, 0, 1, 1, 1, 1, -1], i * 8); idx.set([i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3], i * 6); }
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('aA', new THREE.BufferAttribute(this.alpha, 1).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setIndex(new THREE.BufferAttribute(idx, 1));
    this.mesh = new THREE.Mesh(g, new THREE.ShaderMaterial({
      vertexShader: 'attribute float aA; varying vec2 vUv; varying float vA; void main() { vUv = uv; vA = aA; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'varying vec2 vUv; varying float vA; void main() { float d = abs(vUv.y); float core = smoothstep(0.35, 0.0, d); float haze = pow(max(1.0 - d, 0.0), 2.5); gl_FragColor = vec4((vec3(2.6, 2.8, 3.2) * core + vec3(0.25, 0.45, 1.6) * haze) * vA, 1.0); }',
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    }));
    this.mesh.frustumCulled = false; this.mesh.renderOrder = 7; this.mesh.visible = false; parent.add(this.mesh);
    this.pts = new Float32Array(64 * 3); this.segs = new Int16Array(MAXS * 2); this.wid = new Float32Array(MAXS); this.ns = 0;
    this.a = new THREE.Vector3(); this.b = new THREE.Vector3(); this.on = 0; this.re = 0;
    this.glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: TX.radial(0, 1.6), color: new THREE.Color(0.5, 0.7, 1.6), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    this.glow.visible = false; this.glow.renderOrder = 7; parent.add(this.glow);
  }
  fire(a, b, secs) { this.a.copy(a); this.b.copy(b); this.on = secs; this.re = 0; this.mesh.visible = true; this.glow.visible = true; }
  _strike() {
    const P = this.pts, a = this.a, b = this.b, dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z, L = Math.hypot(dx, dy, dz) || 1;
    // Two directions square to the line, for the zigzag.
    let ux = -dz, uy = 0, uz = dx; const ul = Math.hypot(ux, uz) || 1; ux /= ul; uz /= ul;
    const vx = (dy * uz - dz * uy) / L, vy = (dz * ux - dx * uz) / L, vz = (dx * uy - dy * ux) / L;
    const N = 14, amp = Math.min(0.16, L * 0.09);
    let np = 0, ns = 0;
    const put = (x, y, z) => { P[np * 3] = x; P[np * 3 + 1] = y; P[np * 3 + 2] = z; return np++; };
    let prev = put(a.x, a.y, a.z);
    const main = [prev];
    for (let i = 1; i <= N; i++) {
      const t = i / N, w = i === N ? 0 : Math.sin(Math.PI * t) * amp, p = (Math.random() - 0.5) * 2 * w, q = (Math.random() - 0.5) * 2 * w;
      const k = put(a.x + dx * t + ux * p + vx * q, a.y + dy * t + uy * p + vy * q, a.z + dz * t + uz * p + vz * q);
      this.segs[ns * 2] = prev; this.segs[ns * 2 + 1] = k; this.wid[ns] = 0.045; ns++; prev = k; main.push(k);
    }
    // A couple of forks off the main line.
    for (let f = 0; f < 3; f++) {
      let from = main[2 + Math.floor(Math.random() * (N - 4))], x = P[from * 3], y = P[from * 3 + 1], z = P[from * 3 + 2];
      const sx = (Math.random() - 0.5) * 2, sy = (Math.random() - 0.7), sz = (Math.random() - 0.5) * 2, sl = Math.hypot(sx, sy, sz) || 1;
      for (let s = 0; s < 4 && ns < MAXS; s++) {
        const st = 0.06 + Math.random() * 0.07; x += (sx / sl + (Math.random() - 0.5)) * st; y += (sy / sl + (Math.random() - 0.5)) * st; z += (sz / sl + (Math.random() - 0.5)) * st;
        const k = put(x, y, z); this.segs[ns * 2] = from; this.segs[ns * 2 + 1] = k; this.wid[ns] = 0.02; ns++; from = k;
      }
    }
    this.ns = ns;
  }
  update(dt, cam) {
    if (this.on <= 0) { if (this.mesh.visible) { this.mesh.visible = false; this.glow.visible = false; } return; }
    this.on -= dt; this.re -= dt;
    if (this.re <= 0) { this._strike(); this.re = 0.035 + Math.random() * 0.03; this.flick = Math.random() < 0.18 ? 0.25 : 1; }
    const P = this.pts, Q = this.pos, A = this.alpha;
    for (let s = 0; s < this.ns; s++) {
      const i0 = this.segs[s * 2] * 3, i1 = this.segs[s * 2 + 1] * 3;
      const ax = P[i0], ay = P[i0 + 1], az = P[i0 + 2], bx = P[i1], by = P[i1 + 1], bz = P[i1 + 2];
      const dx = bx - ax, dy = by - ay, dz = bz - az, mx = (ax + bx) / 2 - cam.x, my = (ay + by) / 2 - cam.y, mz = (az + bz) / 2 - cam.z;
      let sx = dy * mz - dz * my, sy = dz * mx - dx * mz, sz = dx * my - dy * mx;
      const sl = Math.hypot(sx, sy, sz) || 1, w = Math.max(this.wid[s], Math.hypot(mx, my, mz) * 0.004) / sl; sx *= w; sy *= w; sz *= w;
      const i = s * 12;
      Q[i] = ax - sx; Q[i + 1] = ay - sy; Q[i + 2] = az - sz; Q[i + 3] = ax + sx; Q[i + 4] = ay + sy; Q[i + 5] = az + sz;
      Q[i + 6] = bx + sx; Q[i + 7] = by + sy; Q[i + 8] = bz + sz; Q[i + 9] = bx - sx; Q[i + 10] = by - sy; Q[i + 11] = bz - sz;
      const al = this.flick * (this.wid[s] < 0.03 ? 0.7 : 1);
      A[s * 4] = A[s * 4 + 1] = A[s * 4 + 2] = A[s * 4 + 3] = al;
    }
    this.geo.setDrawRange(0, this.ns * 6); this.geo.attributes.position.needsUpdate = true; this.geo.attributes.aA.needsUpdate = true;
    this.glow.position.copy(this.b); const gs = 0.5 + Math.random() * 0.4; this.glow.scale.set(gs, gs, 1); this.glow.material.opacity = this.flick;
  }
}

// Sparks: a few dozen points, flung and falling, hot blue-white going out.
class Sparks {
  constructor(parent) {
    const n = this.n = 96; this.p = new Float32Array(n * 3); this.v = new Float32Array(n * 3); this.life = new Float32Array(n); this.c = new Float32Array(n * 3); this.next = 0;
    const g = this.geo = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.p, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('color', new THREE.BufferAttribute(this.c, 3).setUsage(THREE.DynamicDrawUsage));
    this.mesh = new THREE.Points(g, new THREE.PointsMaterial({ size: 0.045, map: TX.radial(0, 1.4), vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    this.mesh.frustumCulled = false; this.mesh.renderOrder = 7; this.mesh.visible = false; parent.add(this.mesh); this.live = 0;
  }
  burst(x, y, z, k = 18, power = 2.2) {
    for (let j = 0; j < k; j++) {
      const i = this.next; this.next = (this.next + 1) % this.n;
      this.p[i * 3] = x; this.p[i * 3 + 1] = y; this.p[i * 3 + 2] = z;
      const a = Math.random() * TAU, s = Math.random() * power;
      this.v[i * 3] = Math.cos(a) * s; this.v[i * 3 + 1] = 0.5 + Math.random() * power; this.v[i * 3 + 2] = Math.sin(a) * s;
      this.life[i] = 0.25 + Math.random() * 0.45;
    }
    this.live = 1; this.mesh.visible = true;
  }
  update(dt, floor) {
    if (!this.live) return;
    let any = 0;
    for (let i = 0; i < this.n; i++) {
      if (this.life[i] <= 0) { this.c[i * 3] = this.c[i * 3 + 1] = this.c[i * 3 + 2] = 0; continue; }
      any = 1; this.life[i] -= dt;
      this.v[i * 3 + 1] -= 9.8 * dt;
      this.p[i * 3] += this.v[i * 3] * dt; this.p[i * 3 + 1] += this.v[i * 3 + 1] * dt; this.p[i * 3 + 2] += this.v[i * 3 + 2] * dt;
      if (this.p[i * 3 + 1] < floor) { this.p[i * 3 + 1] = floor; this.v[i * 3 + 1] *= -0.35; this.v[i * 3] *= 0.6; this.v[i * 3 + 2] *= 0.6; }
      const l = Math.max(0, Math.min(1, this.life[i] * 2.2)); this.c[i * 3] = 1.6 * l; this.c[i * 3 + 1] = 1.9 * l; this.c[i * 3 + 2] = 2.6 * l;
    }
    this.geo.attributes.position.needsUpdate = true; this.geo.attributes.color.needsUpdate = true;
    if (!any) { this.live = 0; this.mesh.visible = false; }
  }
}

// ------------------------------------------------------------------ the dumpster --
// A real one: about 1.9 m by 1.1, 1.2 high on four casters, two hinged plastic lids with snow lying on them,
// ribs down the front, fork pockets on the sides, a little rust; two bin bags and a box beside it.
const DW = 1.9, DD = 1.1, DH = 1.18;
const GREEN = 0x23503a, GREEN2 = 0x1b3f2d, RUST = 0x6b3b22, LID = 0x17191b, SNOW = 0xeef2f8;
function dumpsterGeo() {
  const parts = [
    box(DW, DH - 0.14, DD, 0, 0.14, 0, GREEN),
    box(DW + 0.06, 0.06, DD + 0.06, 0, DH - 0.06, 0, GREEN2),                       // the rim
    box(DW + 0.04, 0.05, DD + 0.04, 0, 0.14, 0, GREEN2),                           // the foot
    box(0.12, 0.12, DD + 0.14, -DW / 2 + 0.05, 0.42, 0, GREEN2), box(0.12, 0.12, DD + 0.14, DW / 2 - 0.05, 0.42, 0, GREEN2),      // fork pockets
    box(0.14, 0.06, 0.06, -DW / 2 - 0.02, 0.78, 0, GREEN2), box(0.14, 0.06, 0.06, DW / 2 + 0.02, 0.78, 0, GREEN2),                 // the lifting pins
    box(0.05, 0.05, DD + 0.02, 0, DH - 0.1, 0, GREEN2),                            // the bar between the lids
  ];
  for (const x of [-0.66, -0.22, 0.22, 0.66]) parts.push(box(0.06, DH - 0.32, 0.03, x, 0.22, DD / 2 + 0.01, GREEN2));      // ribs
  for (const [x, y, w, h] of [[-0.48, 0.3, 0.12, 0.08], [0.4, 0.62, 0.09, 0.14], [0.78, 0.24, 0.1, 0.06], [-0.8, 0.85, 0.07, 0.1]]) parts.push(box(w, h, 0.012, x, y, DD / 2 + 0.003, RUST));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { parts.push(cyl(0.012, 0.012, 0.06, sx * (DW / 2 - 0.15), 0.08, sz * (DD / 2 - 0.12), 0x555a60, 6)); const w = new THREE.CylinderGeometry(0.055, 0.055, 0.04, 12); w.rotateZ(Math.PI / 2); w.translate(sx * (DW / 2 - 0.15), 0.055, sz * (DD / 2 - 0.12)); parts.push(paint(w, RUBBER)); }
  // Snow along the rim, and a drift at its foot against the wall side.
  parts.push(ball(0.5, -0.3, 0.0, -DD / 2 - 0.1, SNOW, 0.35), ball(0.42, 0.55, 0.0, -DD / 2 - 0.05, SNOW, 0.3));
  return mergeGeometries(parts);
}
function lidGeo(withSnow) {
  // In the frame of its hinge, along the back edge: it lies forward over the bin, with a little fall to the front.
  const w = DW / 2 - 0.04, parts = [box(w, 0.045, DD + 0.04, 0, 0, (DD + 0.04) / 2, LID), box(w, 0.07, 0.04, 0, -0.05, DD + 0.04, LID), box(0.18, 0.03, 0.08, -w / 2 + 0.2, 0.04, DD - 0.12, 0x2a2d30), box(0.18, 0.03, 0.08, w / 2 - 0.2, 0.04, DD - 0.12, 0x2a2d30)];
  if (withSnow) parts.push(...snowGeo(w));
  const g = mergeGeometries(parts); return g;
}
function snowGeo(w) {
  return [box(w - 0.06, 0.07, DD - 0.06, 0, 0.04, DD / 2, SNOW), ball(0.24, -w / 4, 0.1, DD * 0.35, SNOW, 0.35), ball(0.2, w / 5, 0.1, DD * 0.65, SNOW, 0.3), ball(0.16, 0, 0.1, DD * 0.2, SNOW, 0.35)];
}
function bagsGeo() {
  const b = new THREE.BoxGeometry(0.4, 0.3, 0.32); b.rotateY(0.3); b.translate(0, 0.15, 0);
  return mergeGeometries([ball(0.26, 0, 0.22, 0, 0x2a2d33, 0.85), ball(0.07, 0.02, 0.44, 0, 0x2a2d33), ball(0.22, 0.42, 0.18, 0.18, 0x30343a, 0.8), paint(b.translate(-0.55, 0, 0.12), 0x9a7a4c), box(0.36, 0.05, 0.28, -0.55, 0.3, 0.12, SNOW)]);
}

// ------------------------------------------------------------------ sound --
function voices(k) {
  const S = k.sound, ok = () => S && S.ctx && S.ctx.state === 'running' && S.master;
  const osc = (type, f0, f1, dur, vol, at = 0, lfo = 0) => {
    if (!ok()) return; const c = S.ctx, t = c.currentTime + at, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.02); g.gain.setValueAtTime(vol, t + Math.max(0.02, dur - 0.08)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let node = o;
    if (lfo) { const l = c.createOscillator(), lg = c.createGain(), am = c.createGain(); l.frequency.value = lfo; lg.gain.value = 0.5; am.gain.value = 0.5; l.connect(lg); lg.connect(am.gain); o.connect(am); node = am; l.start(t); l.stop(t + dur + 0.05); }
    node.connect(g); g.connect(S.master); o.start(t); o.stop(t + dur + 0.05);
  };
  const sy = k.synth;
  return {
    query() { sy.note(660, 0.12, { type: 'triangle', vol: 0.05 }); sy.note(990, 0.2, { type: 'triangle', vol: 0.05, at: 0.12 }); },
    spotted() { for (let i = 0; i < 3; i++) sy.note(1250, 0.07, { type: 'square', vol: 0.03, at: i * 0.09 }); osc('sawtooth', 300, 900, 0.35, 0.025, 0.28); },
    giveUp() { sy.note(700, 0.14, { type: 'triangle', vol: 0.04 }); sy.note(470, 0.3, { type: 'triangle', vol: 0.04, at: 0.13 }); },
    blip() { sy.note(1320, 0.06, { type: 'sine', vol: 0.016 }); },
    charge() { osc('sine', 380, 2200, CHARGE, 0.045); osc('sawtooth', 120, 260, CHARGE, 0.015); },
    crack(big) { sy.noise(big ? 0.25 : 0.14, { vol: big ? 0.2 : 0.12, lp: 9000 }); sy.note(1900, 0.05, { type: 'square', vol: 0.04 }); },
    buzz(dur) { osc('sawtooth', 96, 92, dur, 0.06, 0, 34); osc('square', 192, 180, dur, 0.02, 0, 21); for (let t = 0; t < dur; t += 0.09 + Math.random() * 0.08) sy.noise(0.05, { vol: 0.07, lp: 7000, at: t }); },
    carried() { sy.noise(1.1, { vol: 0.05, lp: 380 }); sy.noise(0.9, { vol: 0.04, lp: 520, at: 0.95 }); sy.note(68, 0.35, { type: 'sine', vol: 0.12, at: 0.62 }); sy.noise(0.2, { vol: 0.08, lp: 260, at: 0.62 }); },
    slam(at = 0) { sy.noise(0.22, { vol: 0.16, lp: 900, at }); sy.note(58, 0.3, { type: 'sine', vol: 0.12, at }); },
    thump() { sy.note(80, 0.18, { type: 'sine', vol: 0.1 }); sy.noise(0.1, { vol: 0.05, lp: 500 }); },
    clang() { sy.note(220, 0.4, { type: 'triangle', vol: 0.06 }); sy.note(331, 0.35, { type: 'triangle', vol: 0.04 }); sy.noise(0.12, { vol: 0.07, lp: 2500 }); },
    boing() { osc('sine', 260, 520, 0.22, 0.05); },
  };
}

// ------------------------------------------------------------------ the feature --
feature({
  id: 'guards',

  init(k) {
    this.k = k; this.v3 = new THREE.Vector3(); this.v3b = new THREE.Vector3(); this.sparkFloor = 0;
    this.seq = null; this.grace = 0; this.wasOn = false; this.blipT = 0; this.prevState = 'play';
    this.root = new THREE.Group(); this.root.name = 'security robots'; k.group.add(this.root);
    this.sfx = voices(k);
    const P = this.patrols = patrols(k.plan, COUNT);
    // One body, one head and one set of glowing bits, shared; each robot has its own glow colour, its own pool of light and its own mark.
    this.bodyGeo = bodyGeo(); this.headGeo = headGeo(); this.glowGeo = glowGeo();
    this.mat = selfLit(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.45, metalness: 0.15 }), 0.32);
    this.lensMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 2.3, 2.1) });
    this.lensGeo = new THREE.CircleGeometry(0.062, 18); this.lensGeo.translate(0, 0, 0.301); this.lensGeo.translate(0, BOT.lens, 0);
    this.marks = { '?': glyph('?', '#ffc23a'), '!': glyph('!', '#ff4636') };
    this.bots = P.map((p, i) => this._makeBot(p, i));
    this.bolt = new Bolt(this.root); this.sparks = new Sparks(this.root);
    this._dumpster();
  },

  // One robot on beat p: its body, head, glow, searchlight pool and mark.
  _makeBot(p, i) {
    const halo = this.halo || (this.halo = TX.radial(0, 1.5));
      const g = new THREE.Group(), head = new THREE.Group();
      const body = new THREE.Mesh(this.bodyGeo, this.mat), hm = new THREE.Mesh(this.headGeo, this.mat);
      const glowMat = new THREE.MeshBasicMaterial({ color: MOOD.calm.clone() }), glow = new THREE.Mesh(this.glowGeo, glowMat), lens = new THREE.Mesh(this.lensGeo, this.lensMat);
      const lensHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: halo, color: new THREE.Color(0.7, 0.8, 0.85), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); lensHalo.position.set(0, BOT.lens, 0.33); lensHalo.scale.set(0.5, 0.5, 1);
      const beacon = new THREE.Sprite(new THREE.SpriteMaterial({ map: halo, color: MOOD.calm.clone(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); beacon.position.set(0, 1.07, -0.03); beacon.scale.set(0.4, 0.4, 1);
      const spark = new THREE.Sprite(new THREE.SpriteMaterial({ map: halo, color: new THREE.Color(0.6, 0.8, 2.0), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 })); spark.position.copy(EMIT); spark.scale.set(0.22, 0.22, 1);
      head.add(hm, glow, lens, lensHalo, beacon, spark); g.add(body, head);
      const mark = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.marks['?'], transparent: true, depthTest: false })); mark.position.set(0, 1.55, 0); mark.scale.set(0.42, 0.42, 1); mark.visible = false; mark.renderOrder = 9; g.add(mark);
      const pool = poolMesh(); this.root.add(g, pool); g.visible = false; pool.visible = false;
      for (const m of [body, hm, glow, lens]) m.matrixAutoUpdate = true;
      const b = {
        i, P: p, g: p.grid, fy: p.fy, group: g, head, glowMat, beacon, spark, mark, pool, markOn: '', markT: 0,
        x: 0, z: 0, yaw: 0, look: 0, v: 0, k: 0, mode: 'patrol', mt: 0, dur: 0, sus: 0, seenAt: -99, seen: false, lx: 0, lz: 0, lost: 0, chaseT: 0, cool: 0,
        path: new Float32Array(512), pn: 0, pk: 0, replan: 0, chk: i * 0.017, poolT: 0, slow: 0, phase: i * 1.7, near: false, far: false,
      };
      this._home(b, Math.floor((i * 0.37 % 1) * p.n));
      return b;
  },

  // Put a robot back on its beat, at point i.
  _home(b, i = 0) {
    const p = b.P; b.k = i % p.n; b.x = p.pts[b.k * 2]; b.z = p.pts[b.k * 2 + 1];
    const j = (b.k + 1) % p.n; b.yaw = b.look = Math.atan2(p.pts[j * 2] - b.x, p.pts[j * 2 + 1] - b.z);
    b.mode = 'patrol'; b.mt = 0; b.v = 0; b.sus = 0; b.lost = 0; b.pn = 0; b.cool = 0; b.seen = false;
  },

  // Where you wake up: beside a service door at the back, against the wall, on open ground.
  _dumpster() {
    const k = this.k, P = k.plan;
    const rank = h => { const r = P.byId[h.a]; const back = r && (r.kind === 'room' || r.kind === 'corridor') && /not public|service|range|foyer/i.test(r.gallery || ''); return (back ? 0 : 10) + ({ flap: 0, dock: 1, duct: 2, window: 3 }[h.kind] ?? 5); };
    const holes = (P.holes || []).filter(h => h.side && h.kind !== 'inner').sort((a, b) => rank(a) - rank(b));
    const inMass = (x, z, m = 0.15) => P.masses.some(q => x > q.x0 - m && x < q.x1 + m && z > q.z0 - m && z < q.z1 + m);
    const clearHere = (x, z) => !inMass(x, z) && Math.abs(groundAt(P, x, z, 0.3)) < 0.04 && !P.obstacles.some(o => x > o.x0 - 0.3 && x < o.x1 + 0.3 && z > o.z0 - 0.3 && z < o.z1 + 0.3 && o.y0 < 1.3) && !P.surfaces.some(s => x > s.x0 - 0.2 && x < s.x1 + 0.2 && z > s.z0 - 0.2 && z < s.z1 + 0.2 && Math.max(s.h0, s.h1) > 0.06);
    for (const h of holes) {
      const n = { n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0] }[h.side], t = [n[1], -n[0]];
      const face = h.side === 'n' ? h.z0 : h.side === 's' ? h.z1 : h.side === 'e' ? h.x1 : h.x0;
      const hx = (h.x0 + h.x1) / 2, hz = (h.z0 + h.z1) / 2, hw = (h.side === 'n' || h.side === 's' ? h.x1 - h.x0 : h.z1 - h.z0) / 2;
      for (const sgn of [1, -1]) {
        const off = sgn * (hw + DW / 2 + 1.2), out = DD / 2 + 0.2;
        const base = n[0] ? { x: face + n[0] * out, z: hz + t[1] * off } : { x: hx + t[0] * off, z: face + n[1] * out };
        const at = (a, b) => ({ x: base.x + n[0] * a + t[0] * b, z: base.z + n[1] * a + t[1] * b });
        const tests = [at(0, 0), at(DD / 2, DW / 2), at(DD / 2, -DW / 2), at(-DD / 2 + 0.05, DW / 2), at(-DD / 2 + 0.05, -DW / 2), at(DD / 2 + 1.6, -DW / 4), at(DD / 2 + 3, 0), at(4.4, 1.8)];
        if (!tests.every(q => clearHere(q.x, q.z))) continue;
        this.bin = { x: base.x, z: base.z, nx: n[0], nz: n[1], tx: t[0], tz: t[1], yaw: Math.atan2(n[0], n[1]), hole: h.id };
        break;
      }
      if (this.bin) break;
    }
    if (!this.bin) return;
    const B = this.bin, g = this.binGroup = new THREE.Group(); g.position.set(B.x, 0, B.z); g.rotation.y = B.yaw; g.name = 'dumpster';
    const mat = selfLit(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, metalness: 0.1 }), 0.42);
    const body = new THREE.Mesh(dumpsterGeo(), mat);
    // Two lids, hinged along the back: the left one is the one that flies open. Its snow is a separate piece, to come off.
    this.lid = new THREE.Group(); this.lid.position.set(-DW / 4, DH, -DD / 2 - 0.02); this.lid.add(new THREE.Mesh(lidGeo(false), mat));
    this.lidSnow = new THREE.Mesh(mergeGeometries(snowGeo(DW / 2 - 0.04)), mat); this.lid.add(this.lidSnow);
    const lid2 = new THREE.Group(); lid2.position.set(DW / 4, DH, -DD / 2 - 0.02); lid2.add(new THREE.Mesh(lidGeo(true), mat));
    const bags = new THREE.Mesh(bagsGeo(), mat); bags.position.set(DW / 2 + 0.45, 0, -0.1);
    g.add(body, this.lid, lid2, bags); k.group.add(g);
    // Solid: the bin and the bags (in the bin's frame, turned into the plan's).
    const foot = (lx0, lx1, lz0, lz1, top) => { const cs = [[lx0, lz0], [lx1, lz0], [lx0, lz1], [lx1, lz1]].map(([a, b]) => ({ x: B.x + B.tx * a + B.nx * b, z: B.z + B.tz * a + B.nz * b })); P.obstacles.push({ x0: Math.min(...cs.map(c => c.x)), x1: Math.max(...cs.map(c => c.x)), z0: Math.min(...cs.map(c => c.z)), z1: Math.max(...cs.map(c => c.z)), y0: 0, y1: top }); };
    // (the plan's x along the bin is -t: the group's +x is the tangent turned by its yaw)
    const ax = Math.cos(B.yaw), az = -Math.sin(B.yaw); B.ax = ax; B.az = az;      // the group's local +x in the world
    B.tx = ax; B.tz = az;
    foot(-DW / 2 - 0.05, DW / 2 + 0.05, -DD / 2 - 0.05, DD / 2 + 0.05, DH + 0.05);
    foot(DW / 2 + 0.1, DW / 2 + 0.95, -0.45, 0.3, 0.5);
  },
  _local(lx, ly, lz, out) { const B = this.bin; return out.set(B.x + B.ax * lx + B.nx * lz, ly, B.z + B.az * lx + B.nz * lz); },

  reset(k) {
    this._release(true);
    if (this.bots) for (const b of this.bots) { this._home(b, b.k); b.group.visible = false; b.pool.visible = false; }
    if (this.lidSnow) { this.lidSnow.visible = true; this.lid.rotation.x = 0; this.binGroup.position.y = 0; }
    this.grace = k.G.t + 20;            // a moment to get your bearings on a new night
  },

  spots() {
    const out = (this.bots || []).map(b => ({ kind: 'thing', id: b.P.id, name: 'Security robot (' + b.P.rooms.join(', ') + ')', x: b.x, y: b.fy, z: b.z }));
    if (this.bin) out.push({ kind: 'thing', id: 'dumpster', name: 'The dumpster', x: this.bin.x, y: 0, z: this.bin.z });
    return out;
  },

  // ---------------------------------------------------------------- each frame
  update(dt, k) {
    const G = k.G, on = G.mode === 'explore' && G.set.guards !== false && !!this.bots && this.bots.length > 0;
    if (!on) {
      if (this.wasOn) { this.wasOn = false; this._release(true); for (const b of this.bots || []) { b.group.visible = false; b.pool.visible = false; } }
      return;
    }
    this.wasOn = true;
    // The lobby's own robot: one beat up and down the Michigan Avenue lobby, past the front doors, the first one most people meet.
    // Built on the first frame rather than at the start, so the coat-check counter (src/lobby.js) is on its plan as somewhere to hide.
    if (!this.lobbyTried) {
      this.lobbyTried = true;
      const L = k.plan.byId[k.plan.front && k.plan.front.a];
      const p = L && beat(k.plan, [L.id], 'bot-lobby');
      if (p) { const b = this._makeBot(p, this.bots.length); b.lobby = true; this._home(b, 0); this.bots.push(b); this.lobbyBot = b; }
    }
    const v = k.v, p = v.pos, now = G.t, cam = G.camera ? G.camera.position : p;
    // Back from something else (a look, a game, the pause menu): a moment before anybody can see you.
    if (G.state !== this.prevState) { if (G.state === 'play') this.grace = Math.max(this.grace, now + 1.5); this.prevState = G.state; }
    if (this.seq) this._sequence(dt, k);
    const frozen = G.state !== 'play';          // looking at a work: they stand where they are
    const watch = !frozen && !G.held && now > this.grace && !(G.heist && G.heist.active);
    const lamp = !!G.lampOn, drone = v.kind === 'drone';
    let nearest = 1e9;
    for (const b of this.bots) {
      const dx = p.x - b.x, dz = p.z - b.z, d2 = dx * dx + dz * dz, dy = p.y - b.fy;
      const sameLevel = dy > -1.5 && dy < 4;
      b.near = sameLevel && d2 < 45 * 45; b.far = !sameLevel || d2 > 60 * 60;
      if (!frozen) {
        if (b.far) { b.slow += dt; if (b.slow >= 0.25) { this._step(b, Math.min(b.slow, 0.5), k, false, lamp, drone, now); b.slow = 0; } }
        else this._step(b, dt, k, watch, lamp, drone, now);
      }
      b.group.visible = b.near; b.pool.visible = b.near;
      if (b.near) {
        this._draw(b, dt, now, lamp, frozen, cam);
        const d = Math.sqrt(d2);
        if (d < nearest) nearest = d;
      }
      // You cannot drive through one: it shoves you aside like a heavy thing does.
      if (!G.held && sameLevel && dy < 0.9) {
        const d = Math.sqrt(d2), r = BOT.r + (v.radius || 0.19);
        if (d < r && d > 1e-4) { const nx = dx / d, nz = dz / d, into = v.vel.x * nx + v.vel.z * nz; p.x = b.x + nx * r; p.z = b.z + nz * r; if (into < 0) { v.vel.x -= nx * into * 1.3; v.vel.z -= nz * into * 1.3; } confine(k.plan, p, v.radius || 0.19, drone); }
      }
    }
    // A tick from the beacon of one nearby, so you hear it round a corner before you see it.
    if (!frozen && nearest < 12 && (this.blipT -= dt) <= 0) { this.blipT = 1.25; this.sfx.blip(); }
    if (!frozen && this.lobbyBot && this.lobbyBot.near && !G.told.has('guards-lobby')) {
      const b = this.lobbyBot;
      if ((p.x - b.x) ** 2 + (p.z - b.z) ** 2 < 15 * 15 && sight(b.g, b.x, b.z, p.x, p.z, false)) { G.told.add('guards'); k.once('guards-lobby', 'A security robot! Duck behind the coat check till it passes.', 6); }
    }
    if (!frozen && nearest < 14 && !G.told.has('guards')) {
      const b = this.bots.find(q => q.near && (p.x - q.x) ** 2 + (p.z - q.z) ** 2 < 196);
      if (b && sight(b.g, b.x, b.z, p.x, p.z, false)) k.once('guards', 'A security robot. Keep out of its light.', 4);
    }
    this.bolt.update(dt, cam);
    this.sparks.update(dt, this.sparkFloor);
  },

  // ---------------------------------------------------------------- a robot's mind
  _step(b, dt, k, watch, lamp, drone, now) {
    const p = k.v.pos, G = k.G;
    b.mt += dt; b.cool = Math.max(0, b.cool - dt);
    // Looking: a few times a second (more often when it is after you).
    if ((b.chk -= dt) <= 0) {
      const hunting = b.mode === 'chase' || b.mode === 'charge';
      b.chk = hunting ? 0.05 : 0.1;
      b.seen = watch && this._sees(b, p, lamp, drone);
      if (b.seen) { b.lx = p.x; b.lz = p.z; b.seenAt = now; }
      if (!hunting && b.mode !== 'alert') {
        if (b.seen) {
          const d = Math.hypot(p.x - b.x, p.z - b.z), range = lamp ? SEE.lit : SEE.dark, sp = Math.hypot(k.v.vel.x, k.v.vel.z);
          b.sus += 0.1 * (lamp ? 2.2 : 1.1) * (0.5 + 1.5 * Math.max(0, 1 - d / range)) * (sp > 4 ? 1.25 : 1);
        } else b.sus = Math.max(0, b.sus - 0.1 * 0.45);
        if (b.sus >= 1) {
          b.mode = 'alert'; b.mt = 0; b.sus = 0; this.sfx.query();
          if (lamp) k.once('guards-lamp', 'Lights off: harder to spot.', 3.5);
        }
      }
    }
    const look = (a, rate) => { b.look = turn(b.look, a, rate * dt); };
    const atToy = () => Math.atan2(p.x - b.x, p.z - b.z);
    switch (b.mode) {
      case 'patrol': {
        const P = b.P, tx = P.pts[b.k * 2], tz = P.pts[b.k * 2 + 1];
        b.phase += dt * 1.1;
        if (this._go(b, tx, tz, BOT.walk, dt, 2.6)) {
          if (P.scan[b.k]) { b.mode = 'scan'; b.mt = 0; b.dur = 2.4 + ((b.k * 7 + b.i * 3) % 5) * 0.3; }
          b.k = (b.k + 1) % P.n;
        }
        look(b.yaw + Math.sin(b.phase) * 0.45, 2.5);
        break;
      }
      case 'scan':
        b.v = 0; look(b.yaw + Math.sin(b.mt * 1.25) * 1.35, 3);
        if (b.mt > b.dur) b.mode = 'patrol';
        break;
      case 'alert':
        b.v = Math.max(0, b.v - dt * 6); if (b.seen) look(atToy(), 5);
        if (b.mt > 0.9) {
          if (now - b.seenAt < 0.35) { b.mode = 'chase'; b.mt = 0; b.lost = 0; b.chaseT = 0; b.replan = 0; b.pn = 0; this.sfx.spotted(); }
          else this._search(b);
        }
        break;
      case 'chase': {
        b.chaseT += dt;
        const d2 = Math.hypot(p.x - b.x, p.z - b.z);
        if (b.seen) b.lost = 0; else b.lost += dt * (d2 > 30 ? 2 : 1);
        if ((b.replan -= dt) <= 0) { b.replan = 0.3; this._plan(b, b.lx, b.lz); if (!b.pn) b.lost += 0.3; }
        if (b.pn) this._follow(b, BOT.run, dt);
        if (b.seen) look(atToy(), 8); else look(b.yaw, 4);
        if (b.seen && b.cool <= 0 && this._dist3(b, p) < BOT.reach) { b.mode = 'charge'; b.mt = 0; this.sfx.charge(); }
        else if (b.lost > LOSE) {
          this.sfx.giveUp();
          if (b.chaseT > 2.5) { this._evaded(k); k.callout('SHAKEN OFF'); }
          this._search(b);
        }
        break;
      }
      case 'charge':
        b.v = Math.max(0, b.v - dt * 30); if (b.pn && b.v > 0) this._follow(b, b.v, dt);
        look(atToy(), 9);
        if (b.mt >= CHARGE) this._fire(b, k, lamp, drone);
        break;
      case 'search':
        // Going to see where it saw you last, then looking about.
        if (b.pn && b.pk < b.pn) this._follow(b, BOT.look, dt);
        else { b.v = 0; look(b.yaw + Math.sin(b.mt * 2.1) * 1.5, 4); if (b.dur < 0) b.dur = b.mt + 2.4; }
        if (b.dur >= 0 && b.mt > b.dur) this._return(b);
        break;
      case 'return':
        if (b.pk < b.pn) this._follow(b, BOT.walk * 1.2, dt);
        else { b.mode = 'patrol'; b.mt = 0; }
        look(b.yaw, 3);
        break;
    }
  },
  _search(b) { b.mode = 'search'; b.mt = 0; b.dur = -1; b.lost = 0; this._plan(b, b.lx, b.lz); if (!b.pn) b.dur = 2; },
  _return(b) {
    // The nearest point on its beat, and on from there.
    const P = b.P; let best = 0, bd = Infinity;
    for (let i = 0; i < P.n; i++) { const d = (P.pts[i * 2] - b.x) ** 2 + (P.pts[i * 2 + 1] - b.z) ** 2; if (d < bd) { bd = d; best = i; } }
    b.k = best; b.mode = 'return'; b.mt = 0; this._plan(b, P.pts[best * 2], P.pts[best * 2 + 1], 0);
    if (!b.pn) this._home(b, best);            // (no way back found: it is put back on its beat, never driven through a wall)
  },
  _dist3(b, p) { const e = this._emitter(b, this.v3b); return Math.hypot(p.x - e.x, p.y + 0.1 - e.y, p.z - e.z); },
  _emitter(b, out) {
    const c = Math.cos(b.look), s = Math.sin(b.look);
    return out.set(b.x + EMIT.x * c + EMIT.z * s, b.fy + EMIT.y, b.z - EMIT.x * s + EMIT.z * c);
  },
  // Can it see the toy? In its pool of light (a wedge from the lamp, widened once it is after you), or right up against it, and nothing in the way.
  _sees(b, p, lamp, drone) {
    const dy = p.y - b.fy; if (dy < -0.4 || dy > 2.6) return false;
    const dx = p.x - b.x, dz = p.z - b.z, d = Math.hypot(dx, dz);
    const hunting = b.mode === 'chase' || b.mode === 'charge' || b.mode === 'alert';
    const range = (lamp ? SEE.lit : SEE.dark) * (hunting ? 1.6 : 1), half = HALF * (hunting ? 1.8 : 1);
    if (d > range) return false;
    if (d > 1.2 && Math.abs(wrap(Math.atan2(dx, dz) - b.look)) > half) return false;
    if (cellAt(b.g, p.x, p.z) < 0) return false;
    return sight(b.g, b.x, b.z, p.x, p.z, !drone && dy < 0.5);
  },
  // A way to (x, z) over its grid: straight there if it can be driven straight, or found.
  _plan(b, x, z, limit = 9000) {
    if (lineClear(b.g, b.x, b.z, x, z)) { b.path[0] = b.x; b.path[1] = b.z; b.path[2] = x; b.path[3] = z; b.pn = 2; b.pk = 1; return; }
    b.pn = path(b.g, b.x, b.z, x, z, b.path, ROOM, limit); b.pk = 1;      // (its first point is where it stands)
  },
  _follow(b, speed, dt) {
    while (b.pk < b.pn) {
      const tx = b.path[b.pk * 2], tz = b.path[b.pk * 2 + 1];
      if (this._go(b, tx, tz, speed, dt, 7)) { b.pk++; if (b.pk >= b.pn) return true; continue; }
      return false;
    }
    return true;
  },
  // Drive towards (tx, tz) along the straight line from where it is (which the planner has passed as clear).
  // It turns its body first, slows for the turn, and arrives. Returns true on arriving.
  _go(b, tx, tz, speed, dt, rate) {
    const dx = tx - b.x, dz = tz - b.z, d = Math.hypot(dx, dz);
    if (d < 0.04) { b.x = tx; b.z = tz; return true; }
    const want = Math.atan2(dx, dz); b.yaw = turn(b.yaw, want, rate * dt);
    const err = Math.abs(wrap(want - b.yaw)), s = err > 1.2 ? 0 : speed * Math.cos(err);
    const acc = speed > 3 ? 6 : 2.5;
    b.v = b.v < s ? Math.min(s, b.v + acc * dt) : Math.max(s, b.v - 8 * dt);
    const step = Math.min(d, b.v * dt);
    b.x += dx / d * step; b.z += dz / d * step;
    return d - step < 0.04;
  },
  _evaded(k) {
    const T = k.G.trophies; if (!T) return;
    T.flags.evaded = (T.flags.evaded || 0) + 1; T.save();
  },

  // ---------------------------------------------------------------- the bolt
  _fire(b, k, lamp, drone) {
    const p = k.v.pos, e = this._emitter(b, this.v3);
    const seen = this._sees(b, p, lamp, drone) || (Math.hypot(p.x - b.x, p.z - b.z) < 2 && sight(b.g, b.x, b.z, p.x, p.z, false));
    const hit = seen && this._dist3(b, p) <= BOT.reach + 0.3 && !k.G.held;
    b.cool = 1.1; b.mode = 'chase'; b.mt = 0;
    if (hit) { b.mode = 'hold'; b.v = 0; b.pn = 0; this._capture(b, k); return; }      // ('hold': it stands over you while it is done)
    // Missed: it strikes the floor where you were going to be, a reach away.
    const end = this.v3b.set(e.x + Math.sin(b.look) * BOT.reach, b.fy + 0.02, e.z + Math.cos(b.look) * BOT.reach);
    this.bolt.fire(e, end, 0.22); this.sparkFloor = b.fy; this.sparks.burst(end.x, end.y + 0.02, end.z, 16, 1.8);
    this.sfx.crack(false);
  },

  // ---------------------------------------------------------------- caught
  _capture(b, k) {
    const G = k.G, v = k.v, e = this._emitter(b, this.v3);
    G.held = true; v.vel.set(0, 0, 0); if (v.kind === 'car') { v.air = false; v.airT = 0; v.vy = 0; v.rail = null; v.flip = v.spin = 0; }
    this.seq = { t: 0, b, hx: v.pos.x, hy: v.pos.y, hz: v.pos.z, yaw: v.yaw, stage: 'zap', popT: -1, spark: 0 };
    this.sparkFloor = groundAt(k.plan, v.pos.x, v.pos.z, v.pos.y + 0.3);
    this.bolt.fire(e, this.v3b.set(v.pos.x, v.pos.y + 0.1, v.pos.z), 1.05);
    this.sparks.burst(v.pos.x, v.pos.y + 0.12, v.pos.z, 26, 2.4);
    this.sfx.crack(true); this.sfx.buzz(1.05);
    this._fx(k.G.set.reduce ? 0.35 : 0.85, k.G.set.reduce ? '#1a2540' : '#cfe0ff');
    for (const q of this.bots) { if (q !== b && (q.mode === 'chase' || q.mode === 'charge' || q.mode === 'alert')) this._return(q); q.sus = 0; }
  },
  // The screen: a flash, a fade to black and back.
  _fx(alpha, colour) {
    if (!this.fxEl) { const el = this.fxEl = document.createElement('div'); el.id = 'guardFx'; el.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:28;opacity:0;background:#000'; document.body.append(el); }
    if (colour) this.fxEl.style.background = colour;
    this.fxEl.style.opacity = String(Math.max(0, Math.min(1, alpha)));
  },
  _sequence(dt, k) {
    const S = this.seq, G = k.G, v = k.v, calm = !!G.set.reduce;
    S.t += dt; const t = S.t;
    const hold = () => { v.pos.set(S.hx, S.hy, S.hz); v.vel.set(0, 0, 0); if (v.speed !== undefined) v.speed = 0; v.yaw = S.yaw; v.sync(0); };
    if (S.stage === 'zap') {
      hold();
      // The toy jerks about on the end of it, and spits sparks.
      if (!calm) { v.group.rotation.z = (Math.random() - 0.5) * 0.35; v.group.rotation.x += (Math.random() - 0.5) * 0.25; v.group.position.y += Math.random() * 0.03; }
      if ((S.spark -= dt) <= 0) { S.spark = 0.11; this.sparks.burst(S.hx, S.hy + 0.12, S.hz, 6, 1.6); }
      // The flash dies away, then the dark comes up.
      if (t < 0.3) this._fx((calm ? 0.35 : 0.85) * (1 - t / 0.3));
      else if (t > 1.1) { this.fxEl.style.background = '#000'; this._fx((t - 1.1) / 0.45); }
      else this._fx(0);
      if (t > 1.6) {
        v.group.rotation.z = 0;
        S.stage = 'carried'; this.sfx.carried();
        // Back on its beat, the one that did it.
        this._home(S.b, 0);
        if (!this.bin) { S.stage = 'done'; this._release(false); return; }
      }
      return;
    }
    const B = this.bin, fx = B.x + B.nx * 3.5 + B.ax * 1.2, fz = B.z + B.nz * 3.5 + B.az * 1.2;
    k.camClose = { at: { x: fx, y: 1.45, z: fz }, look: { x: B.x + B.nx * 0.7 - B.ax * 0.2, y: 0.85, z: B.z + B.nz * 0.7 - B.az * 0.2 } };
    if (S.stage === 'carried') {
      // In the bin, out of sight, lid down.
      this._local(-DW / 4, 0.55, 0, v.pos); v.vel.set(0, 0, 0); v.yaw = B.yaw; v.sync(0); v.group.visible = false; if (v.shadow) v.shadow.visible = false;
      this._fx(1);
      if (t > 2.8) this._fx(1 - (t - 2.8) / 0.6);
      if (t > 3.55 && !S.jolt) { S.jolt = true; this.sfx.thump(); }
      if (!calm && S.jolt) this.binGroup.position.y = t < 3.75 ? Math.sin((t - 3.55) * 60) * 0.015 : 0;
      if (t > 4.0) { S.stage = 'pop'; S.popT = 0; this._fx(0); this.sfx.clang(); this.sfx.boing(); this.lidSnow.visible = false; this.sparkFloor = 0; const sn = this._local(-DW / 4, DH + 0.15, 0.2, this.v3); G.museum.winter.burst(sn.x, sn.y, sn.z, 50, 1.8); }
      return;
    }
    if (S.stage === 'pop') {
      S.popT += dt; const u = Math.min(1, S.popT / 0.8);
      // The lid flies open, and the toy comes out of it head over heels.
      this.lid.rotation.x = -2.0 * Math.min(1, S.popT / 0.2) ** 0.6;
      const a = this._local(-DW / 4, 0.7, 0, this.v3), L = this._local(-DW / 4, 0, DD / 2 + 1.5, this.v3b);
      const y = a.y + (0 - a.y) * u + 4 * 1.25 * u * (1 - u);
      v.group.visible = true; if (v.shadow) v.shadow.visible = v.kind === 'car' || v.kind === 'drone';
      v.pos.set(a.x + (L.x - a.x) * u, Math.max(0, y) + (v.kind === 'drone' ? u * 0.9 : 0), a.z + (L.z - a.z) * u); v.vel.set(0, 0, 0); v.yaw = B.yaw; v.sync(0);
      if (!calm && v.kind === 'car') v.group.rotation.x = -TAU * ease(u);
      if (u >= 1) {
        v.group.rotation.x = 0;
        if (v.kind === 'drone') v.place(L.x, L.z, B.yaw, 0.9); else v.place(L.x, L.z, B.yaw, 0);
        G.camYaw = B.yaw;
        G.museum.winter.burst(L.x, 0.05, L.z, 24, 1.4); this.sfx.thump();
        S.stage = 'out'; S.outT = 0;
        G.held = false;
        this.grace = G.t + 8;
        const fined = k.chips(-FINE);
        k.callout('THROWN OUT');
        if (fined) k.say(`−${FINE} chips`, 0.6, 3);
        if (G.trophies) G.trophies.flag('binned');
      }
      return;
    }
    if (S.stage === 'out') {
      S.outT += dt;
      // The lid drops back, with a bang; the camera goes back to following you.
      if (S.outT < 0.8) k.camClose = { at: { x: fx, y: 1.45, z: fz }, look: { x: v.pos.x, y: 0.4, z: v.pos.z } };
      else k.camClose = null;
      const c = Math.max(0, (S.outT - 0.5) / 0.45);
      this.lid.rotation.x = -2.0 * (1 - c * c);
      if (c >= 1 && !S.banged) { S.banged = true; this.lid.rotation.x = 0; this.sfx.slam(); }
      if (S.outT > 1.2) { this.seq = null; }
    }
  },
  // Let go of the toy (a new night, the switch turned off, or nowhere to put it).
  _release(quiet) {
    const G = this.k.G;
    if (this.seq) { const v = this.k.v; v.group.rotation.z = 0; v.group.rotation.x = 0; v.group.visible = true; if (v.shadow) v.shadow.visible = true; if (this.seq.stage === 'carried' && quiet) { /* left in the bin by a new night: start() puts the toy where it belongs */ } }
    this.seq = null; G.held = false;
    if (this.fxEl) this._fx(0);
    if (this.lid) this.lid.rotation.x = 0;
    if (this.binGroup) this.binGroup.position.y = 0;
  },

  // ---------------------------------------------------------------- drawing one
  _draw(b, dt, now, lamp, frozen, cam) {
    const g = b.group;
    // With one right behind you the camera can end up inside it: then it is not drawn, only its light and its mark.
    const inside = (cam.x - b.x) ** 2 + (cam.z - b.z) ** 2 < 0.8 * 0.8 && cam.y < b.fy + 1.45;
    g.children[0].visible = b.head.visible = !inside;
    g.position.set(b.x, b.fy + (b.v > 0.2 ? Math.sin(now * 23 + b.i) * 0.004 : 0), b.z);
    g.rotation.y = b.yaw; b.head.rotation.y = wrap(b.look - b.yaw);
    const mood = moodOf(b.mode), col = MOOD[mood];
    // The beacon: a slow pulse on patrol, quick when wary, a hard flash when it is after you.
    const rate = mood === 'hunt' ? 7 : mood === 'wary' ? 3.5 : 0.8, ph = (now * rate + b.i * 0.3) % 1, pulse = mood === 'hunt' ? (ph < 0.5 ? 1 : 0.15) : 0.35 + 0.65 * Math.max(0, Math.sin(ph * TAU));
    b.glowMat.color.copy(col);
    b.beacon.material.color.copy(col).multiplyScalar(pulse * 0.9); const bs = 0.3 + pulse * 0.25; b.beacon.scale.set(bs, bs, 1);
    // The prong warms up before it fires.
    const ch = b.mode === 'charge' ? Math.min(1, b.mt / CHARGE) : 0;
    b.spark.material.opacity = ch ? 0.4 + ch * 0.6 + Math.random() * 0.2 : 0; const ss = 0.12 + ch * 0.4; b.spark.scale.set(ss, ss, 1);
    // Its mark.
    const want = mood === 'hunt' ? '!' : mood === 'wary' ? '?' : '';
    if (want !== b.markOn) { b.markOn = want; b.markT = 0; if (want) b.mark.material.map = this.marks[want]; b.mark.visible = !!want; }
    if (b.mark.visible) { b.markT += dt; const m = b.markT, s = 0.42 * (m < 0.12 ? 0.3 + m / 0.12 : m < 0.25 ? 1.3 - (m - 0.12) / 0.13 * 0.3 : 1); b.mark.scale.set(s, s, 1); b.mark.position.y = 1.55 + Math.sin(now * 5) * 0.02; }
    // The pool of light on the floor, stopped by the walls: rebuilt a few times a second.
    if ((b.poolT -= dt) <= 0) {
      const hunting = b.mode === 'chase' || b.mode === 'charge' || b.mode === 'alert';
      b.poolT = hunting ? 0.03 : 0.06;
      const range = (lamp ? SEE.lit : SEE.dark) * (hunting ? 1.6 : 1), half = HALF * (hunting ? 1.8 : 1);
      const P = b.pool.geometry.attributes.position.array, T = b.pool.geometry.attributes.aT.array, y = b.fy + 0.02;
      const ox = b.x + Math.sin(b.look) * 0.3, oz = b.z + Math.cos(b.look) * 0.3;
      let px = 0, pz = 0, pt = 0;
      for (let i = 0; i <= FAN; i++) {
        const a = b.look - half + 2 * half * i / FAN, sx = Math.sin(a), sz = Math.cos(a), L = reach(b.g, ox, oz, sx, sz, range);
        const x = ox + sx * L, z = oz + sz * L, tt = L / range;
        if (i > 0) {
          const j = (i - 1) * 9, q = (i - 1) * 3;
          P[j] = ox; P[j + 1] = y; P[j + 2] = oz; P[j + 3] = px; P[j + 4] = y; P[j + 5] = pz; P[j + 6] = x; P[j + 7] = y; P[j + 8] = z;
          T[q] = 0; T[q + 1] = pt; T[q + 2] = tt;
        }
        px = x; pz = z; pt = tt;
      }
      b.pool.geometry.attributes.position.needsUpdate = true; b.pool.geometry.attributes.aT.needsUpdate = true;
      const u = b.pool.material.uniforms; u.uC.value.copy(mood === 'hunt' ? MOOD.poolHunt : mood === 'wary' ? MOOD.poolWary : MOOD.poolCalm); u.uK.value = mood === 'calm' ? 0.42 : 0.55;
    }
  },
});
