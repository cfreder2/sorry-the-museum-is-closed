// The museum mice. One lives in each wing: the old building's north and south galleries, the Rice building,
// the Modern Wing and the lower level. None is in the entrance hall (runOf, below). Each has its home behind a little grille low on a wall (plan.js addNests;
// what is behind it is src/nests.js). They are radioactive: they glow green, light a pool of floor round them and
// leave glowing footprints that fade over several seconds, so one can be followed across a dark gallery even when
// it gets ahead.
//
// They are not shy. Each sits out in the open, well away from home, in the middle of a room, sniffing. Come near
// and it scampers off home the long way round: through doorways, across several rooms, down the middles of them
// (its run is laid on the real floor, round the furniture and through the doors, never through a wall). Every so
// often it stops in the open, sits up, sniffs and looks back at you, then runs on, just faster than the toy is
// coming; fall behind and it waits for you. See it home and it squeezes in through its grille with a flash: that
// grille can be opened now. See all five home and you have found the museum mice.

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { feature } from './features.js';
import { MOUSE_WINGS } from './plan.js';
import { claimed, claim, placingNow } from './placing.js';
import * as TX from './textures.js';
import { MOTIF, hz } from './motif.js';

const SCALE = 1.75;       // a well-fed mouse, bigger than life, so it reads from a toy's height and from the chase camera
// Pace. The car tops out near 9.5 m/s; a mouse runs a little faster than the toy is coming, up to TOP.
const TOP = 8.2, PACE = 4.5, SEE = 14, BOLT = 4.5, SCARE = 2.2, LAG = 10, BACK = 6, WAIT = 6;
const HUNT = 30;          // seconds from the bolt for which the robots leave a toy that is following it alone
// notices you within SEE and sits up to look; runs within BOLT; at a stop on the way it stays put until you are within
// SCARE; beyond LAG it stops and waits up to WAIT seconds for the toy to come within BACK, then runs on alone (and home
// alone does not count)
// Footprints: one buffer for every mouse, a ring of quads written in place.
const PRINTS = 1200, STEP = 0.12, LIFE = 12, PAW = 0.085;
const GREEN = new THREE.Color(0.32, 1, 0.42);
// The run home: how long (along the floor), and the grid it is found on.
const CELL = 0.45, WANT = 62, MINRUN = 36, MAXRUN = 95, OPEN = 1.4;
const TAUT = 0.7;         // how clear of walls and furniture the run is kept where it is pulled straight (see mouseRun)

// The mouse, in the units of its figure (the floor at y = 0, nose towards +z): a pear of a body, big round ears, a pointed
// snout with whiskers, four little legs and a long thin tail. Everything is coloured by vertex, so one material does it all.
const colour = (g, hex) => { g = g.index ? g.toNonIndexed() : g; const c = new THREE.Color(hex), n = g.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) a.set([c.r, c.g, c.b], i * 3); g.setAttribute('color', new THREE.BufferAttribute(a, 3)); if (g.attributes.uv) g.deleteAttribute('uv'); return g; };
const ball = (to, r, x, y, z, hex, sx = 1, sy = 1, sz = 1, w = 10, h = 7) => { const g = new THREE.SphereGeometry(r, w, h); g.scale(sx, sy, sz); g.translate(x, y, z); to.push(colour(g, hex)); };
const FUR = 0x8fd486, BELLY = 0xd2f5c4, PINK = 0xff9cb8, INNER = 0xf7a8c4;
// where the parts that move hang from
export const TAIL_ROOT = [0, 0.022, -0.062];
const EAR_AT = [[-0.017, 0.058, 0.043], [0.017, 0.058, 0.043]];
const LEG_AT = [[-0.015, 0.024, 0.03], [0.015, 0.024, 0.03], [-0.019, 0.026, -0.03], [0.019, 0.026, -0.03]];       // front left, front right, hind left, hind right
const TAIL = { n: 12, sides: 4, len: 0.19, r0: 0.0052, r1: 0.0016 };
function earGeometry() {
  const p = [];
  ball(p, 0.0195, 0, 0.016, 0, FUR, 1, 1, 0.26, 10, 6);           // big and round
  ball(p, 0.0145, 0, 0.0165, 0.0035, INNER, 1, 1, 0.18, 10, 5);     // pink inside, facing forward
  return mergeGeometries(p);
}
function legGeometry(hind) {
  const p = [], len = hind ? 0.019 : 0.016, r = hind ? 0.0046 : 0.0041;
  const c = new THREE.CapsuleGeometry(r, len, 2, 6); c.translate(0, -len / 2 - 0.002, 0); p.push(colour(c, FUR));
  ball(p, hind ? 0.0066 : 0.0057, 0, -(hind ? 0.0232 : 0.0205), hind ? 0.007 : 0.004, PINK, 0.9, 0.45, hind ? 2 : 1.6, 8, 5);   // a foot, pink
  return mergeGeometries(p);
}
// The tail's centre line: from its root it lifts a little, then lies along the floor, `drop` below the root. A wave runs
// down it (phase, amp) and it curls to one side (curl).
function tailLine(out, phase, amp, curl, drop = TAIL_ROOT[1]) {
  const { n, len } = TAIL;
  for (let i = 0; i <= n; i++) {
    const s = i / n, z = -s * len, y = 0.006 * Math.sin(Math.min(1, s * 3) * Math.PI) - Math.max(0, drop - TAIL.r0) * ss01(s * 2.2);
    out[i] = out[i] || new THREE.Vector3();
    out[i].set(amp * Math.sin(phase - s * 7) * Math.pow(s, 0.8) + curl * s * s, y, z);
  }
  return out;
}
const ss01 = t => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };
function tailGeometry() {
  const { n, sides } = TAIL, rings = n + 1, g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(rings * sides * 3), 3).setUsage(THREE.DynamicDrawUsage));
  g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(rings * sides * 3), 3).setUsage(THREE.DynamicDrawUsage));
  const c = new THREE.Color(0xc8f4b8), col = new Float32Array(rings * sides * 3); for (let i = 0; i < rings * sides; i++) col.set([c.r, c.g, c.b], i * 3);
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const idx = []; for (let i = 0; i < n; i++) for (let j = 0; j < sides; j++) { const a = i * sides + j, b = i * sides + (j + 1) % sides, a2 = a + sides, b2 = b + sides; idx.push(a, a2, b, b, a2, b2); }
  g.setIndex(idx);
  poseTail(g, 0, 0.01, 0.015);
  g.computeBoundingSphere(); g.boundingSphere.radius += 0.05;
  return g;
}
const _tl = [], _t = new THREE.Vector3(), _sd = new THREE.Vector3(), _u2 = new THREE.Vector3(), _UP = new THREE.Vector3(0, 1, 0);
export function poseTail(g, phase, amp, curl, drop) {
  const { n, sides, r0, r1 } = TAIL, P = tailLine(_tl, phase, amp, curl, drop), pos = g.attributes.position.array, nor = g.attributes.normal.array;
  for (let i = 0; i <= n; i++) {
    _t.subVectors(P[Math.min(n, i + 1)], P[Math.max(0, i - 1)]).normalize();
    _sd.crossVectors(_t, _UP).normalize(); _u2.crossVectors(_sd, _t);
    const r = r0 + (r1 - r0) * (i / n);
    for (let j = 0; j < sides; j++) {
      const a = j / sides * Math.PI * 2, cx = Math.cos(a), cy = Math.sin(a), k = (i * sides + j) * 3;
      const nx = _sd.x * cx + _u2.x * cy, ny = _sd.y * cx + _u2.y * cy, nz = _sd.z * cx + _u2.z * cy;
      nor[k] = nx; nor[k + 1] = ny; nor[k + 2] = nz;
      pos[k] = P[i].x + nx * r; pos[k + 1] = P[i].y + ny * r; pos[k + 2] = P[i].z + nz * r;
    }
  }
  g.attributes.position.needsUpdate = true; g.attributes.normal.needsUpdate = true;
}
// The body, in one piece: what does not move.
function trunkGeometry() {
  const p = [];
  ball(p, 0.03, 0, 0.036, 0.0, FUR, 0.95, 0.84, 1.5, 12, 8);            // the body
  ball(p, 0.031, 0, 0.0365, -0.015, FUR, 1.02, 0.9, 1.25, 12, 8);       // (one smooth back, not two lumps)
  ball(p, 0.03, 0, 0.037, -0.031, FUR, 1.12, 0.96, 1.06, 12, 8);        // haunches, round
  ball(p, 0.026, 0, 0.027, 0.004, BELLY, 0.84, 0.6, 1.42);              // a paler belly
  ball(p, 0.0215, 0, 0.046, 0.051, FUR, 0.95, 0.9, 1.08);               // head
  ball(p, 0.013, 0, 0.0405, 0.077, BELLY, 0.78, 0.72, 1.95);            // a long pointed snout
  ball(p, 0.0052, 0, 0.0415, 0.1015, PINK, 1, 1, 1, 8, 6);              // nose
  for (const s of [-1, 1]) {
    ball(p, 0.0058, s * 0.0128, 0.0515, 0.067, 0x030503, 1, 1, 1, 8, 6);                 // eyes, black beads
    ball(p, 0.0017, s * 0.0148, 0.0538, 0.0712, 0xffffff, 1, 1, 1, 4, 3);                 // with a glint
    for (const [dy, dz] of [[0.004, -0.004], [0, 0], [-0.004, 0.003]]) {                   // whiskers
      const a = new THREE.Vector3(s * 0.006, 0.041, 0.093), b = new THREE.Vector3(s * 0.042, 0.041 + dy * 1.6, 0.084 + dz), d = b.clone().sub(a), L = d.length();
      const w = new THREE.CylinderGeometry(0.0007, 0.0004, L, 3, 1, true); w.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(_UP, d.normalize())); w.translate((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
      p.push(colour(w, 0xeaffdf));
    }
  }
  return mergeGeometries(p);
}
let _mg = null;
function mouseParts() { return _mg || (_mg = { trunk: trunkGeometry(), ear: earGeometry(), front: legGeometry(false), hind: legGeometry(true) }); }
// A mouse that moves: { fig, ears, legs, tail }. Parts are put on `fig`, whose origin is the floor under the middle of it.
export function buildMouse(mat) {
  const G = mouseParts(), fig = new THREE.Group();
  fig.add(new THREE.Mesh(G.trunk, mat));
  const ears = EAR_AT.map(([x, y, z], i) => { const e = new THREE.Mesh(G.ear, mat), s = i ? 1 : -1; e.position.set(x, y, z); e.rotation.set(-0.12, s * 0.38, -s * 0.42); e.userData.rest = e.rotation.clone(); fig.add(e); return e; });
  const legs = LEG_AT.map(([x, y, z], i) => { const l = new THREE.Mesh(i < 2 ? G.front : G.hind, mat); l.position.set(x, y, z); fig.add(l); return l; });
  const tail = new THREE.Mesh(tailGeometry(), mat); tail.position.set(...TAIL_ROOT); fig.add(tail);
  return { fig, ears, legs, tail };
}
// The whole mouse as three still pieces (src/story.js draws one this way): body (ears and legs on), eyes (nothing more:
// they are on the body), tail (its root at TAIL_ROOT).
export function mouseGeometry() {
  const G = mouseParts(), p = [G.trunk.clone()];
  EAR_AT.forEach(([x, y, z], i) => { const s = i ? 1 : -1, e = G.ear.clone(); e.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.12, s * 0.38, -s * 0.42)), new THREE.Vector3(1, 1, 1))); p.push(e); });
  LEG_AT.forEach(([x, y, z], i) => p.push((i < 2 ? G.front : G.hind).clone().translate(x, y, z)));
  const eyes = new THREE.BufferGeometry(); eyes.setAttribute('position', new THREE.BufferAttribute(new Float32Array(9), 3));
  const tail = tailGeometry(); poseTail(tail, 0, 0, 0.03);
  return { body: mergeGeometries(p), eyes, tail };
}

// A paw print with a soft halo round it, toes towards +v.
export function pawTexture() {
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
const same = (a, b) => Math.abs(a - b) < 0.05;

// ---- the run home, found on the floor itself
// A grid over the level round the grille: a cell is floor if it is in a room on that level (clear of the wall) or in a
// doorway between two of them, and nothing stands on it. How far each cell is from anything it cannot cross is its
// `open`ness. The way home is the cheapest from every cell to the grille, where a step costs more the nearer it is to
// a wall or a piece of furniture: so a mouse keeps to the middles of rooms. It starts out well out in the open, some
// sixty metres of floor from home.
class Heap {
  constructor(n) { this.k = new Float64Array(n); this.v = new Int32Array(n); this.n = 0; }
  push(key, v) { if (this.n === this.k.length) { const k = new Float64Array(this.n * 2), w = new Int32Array(this.n * 2); k.set(this.k); w.set(this.v); this.k = k; this.v = w; } let i = this.n++; const K = this.k, V = this.v; while (i > 0) { const p = (i - 1) >> 1; if (K[p] <= key) break; K[i] = K[p]; V[i] = V[p]; i = p; } K[i] = key; V[i] = v; }
  pop() { const K = this.k, V = this.v, top = V[0], key = K[--this.n], v = V[this.n]; let i = 0; for (;;) { let c = 2 * i + 1; if (c >= this.n) break; if (c + 1 < this.n && K[c + 1] < K[c]) c++; if (K[c] >= key) break; K[i] = K[c]; V[i] = V[c]; i = c; } K[i] = key; V[i] = v; return top; }
}
// Rooms that are no part of a mouse's floor: it neither sits in them nor runs through them.
//   * the Thorne corridor (Gallery 11), for the lower-level mouse. It sat at the far end of it, and the way in is at the
//     near end: it bolted back past the toy and out by the door the toy had just come in by, and the toy, turning right
//     round among the miniature rooms, lost it more often than not (7 seen home in 15 scripted tries). Kept out of there
//     it sits out in the open in Gallery 10 and runs away from whoever finds it.
//   * the entrance hall (the room the front doors open into, plan.front.a: the Michigan Avenue Lobby), for every mouse.
//     The owner wants no mouse at the front entrance: the saucer has the hall (src/entry.js). The north mouse sat at the
//     far end of it and ran its length; kept out, it sits in a gallery off the Grand Staircase and goes home by the
//     Fullerton Hall lobby and Member Services, to the same grille.
//     (It is left out only for a mouse whose run would otherwise touch it: runOf, below. Leaving a room out for a mouse
//     that never went near it still moves that mouse, because where each sits is chosen with a throw of the dice over
//     every spot of its floor, and fewer spots is a different throw: the south mouse moved into the north one's rooms.)
const KEEP_OUT = { lower: ['G11'] };
export function keptOut(plan, wing) { return new Set(KEEP_OUT[wing] || []); }
// A mouse's run for a nest, with the entrance hall no part of it.
export function runOf(plan, n, seed = 1) {
  const out = keptOut(plan, n.wing), hall = plan.byId[plan.front && plan.front.a];
  let run = mouseRun(plan, n, seed, out);
  if (run && hall && same(hall.y, n.y) && touches(run, hall)) { out.add(hall.id); run = mouseRun(plan, n, seed, out); }
  return run;
}
function touches(run, r) {
  for (let i = 1; i < run.pts.length; i++) { const a = run.pts[i - 1], b = run.pts[i], m = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) / 0.25)); for (let t = 0; t <= m; t++) { const x = a.x + (b.x - a.x) * t / m, z = a.z + (b.z - a.z) * t / m; if (x > r.x0 && x < r.x1 && z > r.z0 && z < r.z1) return true; } }
  return false;
}
export function mouseRun(plan, n, seed = 1, out = keptOut(plan, n.wing)) {
  const y = n.y, R = 70, vx = n.vent.x, vz = n.vent.z;
  const rooms = plan.rooms.filter(r => !r.secret && !out.has(r.id) && same(r.y, y) && r.kind !== 'hall' && !/stair|lift/.test(r.use || '') && Math.max(r.x0 - vx, vx - r.x1, r.z0 - vz, vz - r.z1, 0) < R);
  const ids = new Set(rooms.map(r => r.id));
  const doors = plan.doors.filter(d => !d.out && !d.hidden && !d.secret && !d.shut && same(d.y, y) && ids.has(d.a) && ids.has(d.b));
  let X0 = Infinity, X1 = -Infinity, Z0 = Infinity, Z1 = -Infinity;
  for (const r of rooms) { X0 = Math.min(X0, r.x0); X1 = Math.max(X1, r.x1); Z0 = Math.min(Z0, r.z0); Z1 = Math.max(Z1, r.z1); }
  X0 = Math.max(X0, vx - R) - 1; X1 = Math.min(X1, vx + R) + 1; Z0 = Math.max(Z0, vz - R) - 1; Z1 = Math.min(Z1, vz + R) + 1;
  const W = Math.ceil((X1 - X0) / CELL), H = Math.ceil((Z1 - Z0) / CELL), N = W * H, floor = new Uint8Array(N);
  const fill = (x0, x1, z0, z1, v) => { const i0 = Math.max(0, Math.ceil((x0 - X0) / CELL - 0.5)), i1 = Math.min(W - 1, Math.floor((x1 - X0) / CELL - 0.5)), j0 = Math.max(0, Math.ceil((z0 - Z0) / CELL - 0.5)), j1 = Math.min(H - 1, Math.floor((z1 - Z0) / CELL - 0.5)); for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) floor[j * W + i] = v; };
  for (const r of rooms) fill(r.x0 + 0.15, r.x1 - 0.15, r.z0 + 0.15, r.z1 - 0.15, r.kind === 'gallery' || (r.use !== 'backofhouse' && !r.assumed) ? 2 : 1);      // 2: a public room, where it would rather sit
  // Every room's edge is a wall: two rooms side by side otherwise fill cells right up to each other, and the run went
  // straight through the wall between them. Only the doorways (next) open it again.
  { const t = CELL * 0.55;
    for (const r of rooms) { fill(r.x0 - t, r.x0 + t, r.z0 - t, r.z1 + t, 0); fill(r.x1 - t, r.x1 + t, r.z0 - t, r.z1 + t, 0); fill(r.x0 - t, r.x1 + t, r.z0 - t, r.z0 + t, 0); fill(r.x0 - t, r.x1 + t, r.z1 - t, r.z1 + t, 0); } }
  for (const d of doors) d.along === 'z' ? fill(d.x0 + 0.05, d.x1 - 0.05, d.z0 - 0.5, d.z1 + 0.5, 1) : fill(d.x0 - 0.5, d.x1 + 0.5, d.z0 + 0.05, d.z1 - 0.05, 1);
  const lap = q => q.x1 > X0 && q.x0 < X1 && q.z1 > Z0 && q.z0 < Z1, e = 0.1;
  for (const o of plan.obstacles) if (lap(o) && o.y0 < y + 0.14 && o.y1 > y + 0.01 && !o.nest) fill(o.x0 - e, o.x1 + e, o.z0 - e, o.z1 + e, 0);
  for (const s of plan.surfaces) if (lap(s) && !s.hill && Math.max(s.h0 || 0, s.h1 || 0) > y + 0.04 && (s.base || 0) < y + 0.14) fill(s.x0 - e, s.x1 + e, s.z0 - e, s.z1 + e, 0);
  for (const q of [...(plan.ramps || []), ...plan.lifts, ...plan.wells]) if (lap(q)) fill(q.x0 - 0.3, q.x1 + 0.3, q.z0 - 0.3, q.z1 + 0.3, 0);
  // openness: distance to the nearest cell that is not floor (two passes of a chamfer)
  const open = new Float32Array(N), D1 = CELL, D2 = CELL * 1.414;
  for (let i = 0; i < N; i++) open[i] = floor[i] ? 1e6 : 0;
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { const k = j * W + i; if (!open[k]) continue; let v = open[k]; if (i > 0) v = Math.min(v, open[k - 1] + D1); else v = Math.min(v, D1); if (j > 0) { v = Math.min(v, open[k - W] + D1); if (i > 0) v = Math.min(v, open[k - W - 1] + D2); if (i < W - 1) v = Math.min(v, open[k - W + 1] + D2); } else v = Math.min(v, D1); open[k] = v; }
  for (let j = H - 1; j >= 0; j--) for (let i = W - 1; i >= 0; i--) { const k = j * W + i; if (!open[k]) continue; let v = open[k]; if (i < W - 1) v = Math.min(v, open[k + 1] + D1); else v = Math.min(v, D1); if (j < H - 1) { v = Math.min(v, open[k + W] + D1); if (i < W - 1) v = Math.min(v, open[k + W + 1] + D2); if (i > 0) v = Math.min(v, open[k + W - 1] + D2); } else v = Math.min(v, D1); open[k] = v; }
  const cellOf = (x, z) => { const i = Math.round((x - X0) / CELL - 0.5), j = Math.round((z - Z0) / CELL - 0.5); return i < 0 || j < 0 || i >= W || j >= H ? -1 : j * W + i; };
  const cx = k => X0 + (k % W + 0.5) * CELL, cz = k => Z0 + (Math.floor(k / W) + 0.5) * CELL;
  const ok = k => floor[k] && open[k] >= 0.34;
  // the grille: the cell in front of it, half a metre out
  let goal = -1;
  for (let t = 0; t < 30 && goal < 0; t++) { const k = cellOf(vx + n.nx * (0.35 + t * 0.05), vz + n.nz * (0.35 + t * 0.05)); if (k >= 0 && floor[k] && open[k] > 0.2) goal = k; }
  if (goal < 0) return null;
  // cheapest way home from every cell
  const cost = new Float64Array(N).fill(Infinity), len = new Float32Array(N), via = new Int32Array(N).fill(-1), heap = new Heap(N * 2);
  cost[goal] = 0; heap.push(0, goal);
  const NB = [[1, 0, D1], [-1, 0, D1], [0, 1, D1], [0, -1, D1], [1, 1, D2], [1, -1, D2], [-1, 1, D2], [-1, -1, D2]];
  while (heap.n) {
    const c0 = heap.k[0], k = heap.pop(); if (c0 > cost[k]) continue;
    const i = k % W, j = (k - i) / W;
    for (const [di, dj, dl] of NB) {
      const a = i + di, b = j + dj; if (a < 0 || b < 0 || a >= W || b >= H) continue;
      const q = b * W + a; if (!ok(q)) continue;
      if (di && dj && (!ok(j * W + a) || !ok(b * W + i))) continue;         // no squeezing diagonally past a corner
      const c = cost[k] + dl * (1 + 2.2 / (0.25 + Math.min(open[q], 3)));
      if (c < cost[q]) { cost[q] = c; len[q] = len[k] + dl; via[q] = k; heap.push(c, q); }
    }
  }
  // where it sits to begin with: well out in the open, about WANT metres of floor from home
  const r = (() => { let s = seed >>> 0 || 1; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; })();
  let start = -1, bs = -Infinity;
  for (const minOpen of [OPEN, 1.0, 0.7]) {
    for (let k = 0; k < N; k++) {
      if (!(len[k] > MINRUN && len[k] < MAXRUN) || open[k] < minOpen) continue;
      const s = Math.min(open[k], 3.2) * 3 - Math.abs(len[k] - WANT) * 0.08 + (floor[k] === 2 ? 5 : 0) + r() * 0.6;
      if (s > bs) { bs = s; start = k; }
    }
    if (start >= 0) break;
  }
  if (start < 0) { for (let k = 0; k < N; k++) if (len[k] > (start < 0 ? 8 : len[start]) && open[k] > 0.6) start = k; }
  if (start < 0) return null;
  const cells = []; for (let k = start; k >= 0; k = via[k]) cells.push(k);
  // pulled taut: straight from each point to the furthest one it can see across open floor, TAUT clear of anything
  // (at 0.4 m the straight line cut doorways by the jamb, 5 cm from one of them, and a toy on its prints hit it)
  const see = (a, b) => { const ax = cx(a), az = cz(a), bx = cx(b), bz = cz(b), L = Math.hypot(bx - ax, bz - az), m = Math.ceil(L / 0.15); for (let t = 1; t < m; t++) { const k = cellOf(ax + (bx - ax) * t / m, az + (bz - az) * t / m); if (k < 0 || !floor[k] || open[k] < TAUT) return false; } return true; };
  const pts = [{ x: cx(cells[0]), z: cz(cells[0]) }];
  for (let i = 0; i < cells.length - 1;) { let j = i + 1; while (j + 1 < cells.length && j - i < 60 && see(cells[i], cells[j + 1])) j++; pts.push({ x: cx(cells[j]), z: cz(cells[j]) }); i = j; }
  pts.push({ x: vx + n.nx * 0.1, z: vz + n.nz * 0.1 });                     // and up to the grille itself
  const cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z));
  const total = cum[cum.length - 1];
  // The stops on the way: wherever the floor is most open, every nine metres or more, none in the last six.
  const stops = [];
  { let last = -1e9, best = null;
    for (let s = 3; s < total - 6; s += 0.5) {
      let i = 1; while (i < pts.length - 1 && cum[i] < s) i++;
      const f = (s - cum[i - 1]) / ((cum[i] - cum[i - 1]) || 1), k = cellOf(pts[i - 1].x + (pts[i].x - pts[i - 1].x) * f, pts[i - 1].z + (pts[i].z - pts[i - 1].z) * f), o = k >= 0 ? open[k] : 0;
      if (o >= 1.3 && s - last > 9) { if (!best || o > best.o) best = { s, o }; }
      if (best && s - best.s > 2.5) { stops.push(best.s); last = best.s; best = null; }
    }
    if (best) stops.push(best.s); }
  return { pts, cum, len: total, stops, startOpen: open[start] };
}

export const mice = feature({
  id: 'mice',
  secrets: [['mice', 'The museum mice']],
  init(k) { this.k = k; this.list = []; this.time = 0; },

  place() {
    const k = this.k, P = k.plan;
    claimed(k.G);                                     // (read what is already placed, so that where these sit is added to it)
    MOUSE_WINGS.forEach((w, i) => {
      const n = (P.nests || []).find(q => q.wing === w.id); if (!n) return;
      const run = runOf(P, n, 17 + i * 101); if (!run) return;
      const m = {
        id: 'mouse-' + w.id, wing: w, nest: n, room: n.room, y: n.y, nx: n.nx, nz: n.nz, ...run,
        hole: { x: n.vent.x, y: n.y, z: n.vent.z },
        s: 0, state: 'peek', t: 0, chase: 0, spd: 0, yaw: 0, pitch: 0, pause: 0, acc: 0, foot: 1, flare: 0, alone: false, squeak: 0, px: 0, pz: 0, hx: 0, hz: 1, stop: 0, look: 0, fidget: 0, home: false,
      };
      this.list.push(m); claim({ x: run.pts[0].x, y: n.y, z: run.pts[0].z });
    });
    this.tally = this.k.tally('mice', this.list.length);
    this._build(); this.placed = true;
  },
  // Where a mouse is at s metres along its run: m.px, m.pz, heading m.hx, m.hz (no allocation).
  _at(m, s) {
    const P = m.pts, C = m.cum; let i = 1; while (i < P.length - 1 && C[i] < s) i++;
    const a = P[i - 1], b = P[i], L = C[i] - C[i - 1] || 1, f = Math.max(0, Math.min(1, (s - C[i - 1]) / L));
    m.px = a.x + (b.x - a.x) * f; m.pz = a.z + (b.z - a.z) * f; m.hx = (b.x - a.x) / L; m.hz = (b.z - a.z) / L;
  },

  _build() {
    const k = this.k;
    const body = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, color: 0xb8d8b4, emissive: 0xffffff, emissiveIntensity: 0.6 });
    // The glow takes the fur's colour (ears and nose glow their own shades, the eyes stay dark), and it is strongest round
    // the edges: a green rim round the whole outline, so the shape of a mouse shows inside its own light.
    body.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
      totalEmissiveRadiance *= vColor.rgb * vec3(0.5, 1.35, 0.55);
      { float rim = 1.0 - saturate(dot(normal, normalize(vViewPosition))), lit = step(0.1, max(vColor.r, vColor.g));
        totalEmissiveRadiance += vec3(0.35, 1.25, 0.45) * pow(rim, 2.2) * 1.6 * lit; }`); };
    body.customProgramCacheKey = () => 'mouse-fur';
    const glowTex = TX.radial(0, 1.2);
    const haloMat = new THREE.SpriteMaterial({ map: glowTex, color: GREEN, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
    const poolMat = new THREE.MeshBasicMaterial({ map: glowTex, color: GREEN.clone().multiplyScalar(0.75), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
    const poolGeo = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
    for (const m of this.list) {
      const g = m.mesh = new THREE.Group(); g.rotation.order = 'YXZ'; g.name = m.id;
      const rig = buildMouse(body); m.fig = rig.fig; m.ears = rig.ears; m.legs = rig.legs; m.tail = rig.tail;
      m.fig.scale.setScalar(SCALE); g.add(m.fig);
      m.gait = 0; m.tph = Math.random() * 6; m.twitch = 0; m.earT = 1;
      // The halo is drawn just behind the mouse (pushed away from whichever camera is looking), so it is a glow round the
      // mouse and not a fog over it.
      m.halo = new THREE.Sprite(haloMat.clone()); m.halo.position.set(0, 0.06, 0); m.halo.scale.setScalar(0.36); g.add(m.halo);
      m.halo.onBeforeRender = (r, sc, cam) => { const e = m.halo.matrixWorld.elements, c = cam.matrixWorld.elements, dx = e[12] - c[12], dy = e[13] - c[13], dz = e[14] - c[14], l = Math.hypot(dx, dy, dz) || 1, b = Math.min(0.2, l * 0.5) / l; e[12] += dx * b; e[13] += dy * b; e[14] += dz * b; };
      m.pool = new THREE.Mesh(poolGeo, poolMat.clone()); m.pool.scale.setScalar(2.2); m.pool.renderOrder = 2;
      k.group.add(g, m.pool);
      if (this.tally.has(m.id)) m.state = 'done';
      this._place(m);
    }
    this._trail();
  },
  // Put the mouse where its state says: out at the start of its run, or (once it has been seen home) in its nest.
  _place(m) {
    if (m.state === 'done') {
      const n = m.nest, b = n.back, tx = n.vent.x - b.x, tz = n.vent.z - b.z, l = Math.hypot(tx, tz) || 1;
      m.px = b.x + tx / l * 0.32; m.pz = b.z + tz / l * 0.32; m.yaw = Math.atan2(tx, tz);
    } else { m.s = 0; this._at(m, 0); m.yaw = Math.atan2(m.hx, m.hz); }
    m.mesh.position.set(m.px, m.y + 0.002, m.pz); m.mesh.rotation.set(0, m.yaw, 0); m.fig.scale.setScalar(SCALE); m.fig.position.set(0, 0, 0);
    m.stop = 0; m.mesh.visible = m.state !== 'home'; this._glow(m);
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
    this.tr = { mesh, pos, colr, born: new Float32Array(PRINTS).fill(-1e6), next: 0, last: -1e6, lit: false };
  },
  _print(m) {
    const T = this.tr, i = T.next; T.next = (i + 1) % PRINTS;
    m.foot = -m.foot;
    const fx = Math.sin(m.yaw), fz = Math.cos(m.yaw), rx = -fz, rz = fx, side = m.foot * 0.024, cx = m.px + rx * side, cz = m.pz + rz * side, y = m.y + 0.005;
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
      const f = (1 - age / LIFE), b = 1.6 * f * Math.sqrt(f) + (age < 0.25 ? (0.25 - age) * 3 : 0);    // a flash as it is laid, then a slow fade
      for (let j = 0; j < 4; j++) { c[o + j * 3] = GREEN.r * b; c[o + j * 3 + 1] = GREEN.g * b; c[o + j * 3 + 2] = GREEN.b * b; }
    }
    T.lit = true; T.mesh.geometry.attributes.color.needsUpdate = true;
  },

  active(k) { return !k.G.racing; },
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
    if (d > 45 && (m.state === 'peek' || m.state === 'done') && !m.flare) return;   // nobody near: leave it be
    const toYaw = (want, rate) => { m.yaw += wrap(want - m.yaw) * Math.min(1, dt * rate); };
    let bob = 0, wag = 3, moved = 0;
    if (m.state === 'peek' || m.state === 'done') {
      // sitting out in the open, sniffing; it looks round at you when you come into sight, and fidgets about
      bob = Math.max(0, Math.sin(m.t * 9)) * 0.004; m.pitch = -0.12 + Math.sin(m.t * 2.3) * 0.06;
      if (d < SEE) { toYaw(Math.atan2(dx, dz), 4); m.pitch += -0.22; }
      else if ((m.fidget -= dt) < 0) { m.fidget = 1.5 + Math.random() * 2.5; m.look = m.yaw + (Math.random() - 0.5) * 2.4; }
      else toYaw(m.look, 2.5);
      if (m.state === 'peek') {
        if (d < SEE) k.once('mouse-first', 'A glowing mouse, right out in the open! Follow it home.', 4, true);      // (at once: in its turn it came up behind the first minute's hints, seconds before the mouse was home)
        if (d < BOLT) { m.state = 'run'; m.t = 0; m.spd = 3; m.stop = 0; m.chase = 0; k.synth.note(2600, 0.05, { type: 'sine', vol: 0.02 }); k.synth.note(3100, 0.04, { type: 'sine', vol: 0.02, at: 0.07 }); }
      }
    } else if (m.state === 'run' || m.state === 'wait' || m.state === 'sit') {
      m.chase += dt;                              // how long since it bolted (following(): the robots)
      if (m.state === 'run') {
        // a little faster than the toy is coming, faster still when it is close; stop-start when it is not
        if (d < BACK) m.alone = false;
        let want = m.alone ? PACE : d < LAG - 3 ? Math.max(PACE, Math.min(TOP, 2.6 + cs * 0.72 + (4 - d) * 0.7)) : 2.4;
        if (m.pause > 0) { m.pause -= dt; want = 0; } else if (d > 4 && !m.alone && Math.random() < dt * 0.6) m.pause = 0.16 + Math.random() * 0.14;
        m.spd += (want - m.spd) * Math.min(1, dt * (want > m.spd ? 9 : 14));
        const was = m.s; m.s = Math.min(m.len, m.s + m.spd * dt); moved = m.s - was;
        this._at(m, m.s);
        toYaw(Math.atan2(m.hx, m.hz), 16);
        m.pitch = 0; bob = m.spd > 0.3 ? Math.abs(Math.sin(m.t * 32)) * 0.006 : 0; wag = 6 + m.spd * 2;
        // one of its stops: right out in the open, where it sits up and looks back at you
        const next = m.stops[m.stop];
        if (next != null && m.s >= next && !m.alone) { m.stop++; if (d > SCARE) { m.state = 'sit'; m.t = 0; m.hold = 1.3 + Math.random() * 0.9; m.squeak = 0.25; } }
        else if (next != null && m.s >= next) m.stop++;
        if (m.state !== 'run') { /* it has stopped to look */ }
        else if (d > LAG && !m.alone) { m.state = 'wait'; m.t = 0; m.squeak = 0.4; k.once('mouse-wait', 'It waits for you. Keep up!', 3); }
        else if (m.s >= m.len - 0.01) { m.state = 'duck'; m.t = 0; this._home(m, k, d); }
      } else {
        // stopped: turn round, sit up, glow and squeak; at a stop, until the toy comes close; fallen behind, until it catches up
        toYaw(Math.atan2(dx, dz), 6); m.pitch += (-0.38 - m.pitch) * Math.min(1, dt * 6); m.spd = 0; wag = 2;
        bob = Math.max(0, Math.sin(m.t * 7)) * 0.003;
        if ((m.squeak -= dt) <= 0) { m.squeak = 1.7; m.flare = Math.max(m.flare, 0.55); if (d < 30) this._chirp(k, m); }
        if (m.state === 'sit') { if (d < SCARE || (m.t > m.hold && d < LAG)) { m.state = 'run'; m.t = 0; m.spd = 2.5; } else if (d > LAG) { m.state = 'wait'; m.t = 0; } }
        else if (d < BACK) { m.state = 'run'; m.t = 0; }
        else if (m.t > WAIT) { m.state = 'run'; m.t = 0; m.alone = true; }      // given up waiting: off home on its own
      }
      g.position.set(m.px, m.y + 0.002, m.pz);
    } else if (m.state === 'duck') {
      // in through the grille: on to the wall and through the slats, getting smaller
      const f = Math.min(1, m.t / 0.4);
      g.position.set(m.px - m.nx * 0.2 * f, m.y + 0.002, m.pz - m.nz * 0.2 * f);
      toYaw(Math.atan2(-m.nx, -m.nz), 20); m.fig.scale.setScalar(SCALE * (1 - 0.65 * f)); wag = 14;
      if (f >= 1) { m.state = 'home'; m.t = 0; g.visible = false; }
    } else if (m.state === 'home') {
      if (m.t > (m.followed ? 1.5 : 20)) {
        // one that was followed lives in its nest from now on; one that was not comes out again where it was
        if (m.followed) m.state = 'done'; else { m.state = 'peek'; m.alone = false; }
        m.flare = 0.6; this._place(m);
      }
    }
    if (moved > 0) for (m.acc += moved; m.acc > STEP; m.acc -= STEP) this._print(m);
    if (g.visible) {
      g.position.y = m.y + 0.002 + bob; g.rotation.y = m.yaw; g.rotation.x = m.pitch;
      this._pose(m, dt, wag);
    }
    m.d = d; this._glow(m, d);
  },
  // How it holds itself: a scurrying trot while it runs (legs in diagonal pairs, the body stretching and bunching, ears laid
  // back, the tail whipping), and still, a slow sway of the tail and now and then a flick of one ear.
  _pose(m, dt, wag) {
    const run = m.state === 'run' && m.spd > 0.3 ? Math.min(1, m.spd / 2.5) : 0, duck = m.state === 'duck';
    m.gait += dt * Math.PI * 2 * (run ? 3 + m.spd * 1.3 : 0);
    m.run = (m.run || 0) + (run - (m.run || 0)) * Math.min(1, dt * 10);
    const R = m.run, ph = m.gait, sitting = m.pitch < -0.25;
    for (let i = 0; i < 4; i++) {
      const pair = i === 0 || i === 3 ? 0 : Math.PI, want = Math.sin(ph + pair) * 0.95 * R + (sitting && i < 2 ? -0.7 : 0);
      m.legs[i].rotation.x += (want - m.legs[i].rotation.x) * Math.min(1, dt * (R > 0.2 ? 40 : 10));
    }
    if (!duck) { const c = Math.sin(ph * 2) * R; m.fig.scale.set(SCALE * (1 - 0.03 * c), SCALE * (1 - 0.05 * c), SCALE * (1 + 0.08 * c)); }
    // ears: laid back at a run; still, a twitch every second or two
    if ((m.earT -= dt) < 0) { m.earT = 0.8 + Math.random() * 2.2; m.twitch = 0.32; m.earWhich = Math.random() < 0.5 ? 0 : Math.random() < 0.7 ? 1 : 2; }
    m.twitch = Math.max(0, m.twitch - dt);
    m.ears.forEach((e, i) => {
      const rest = e.userData.rest, flick = !R && m.twitch > 0 && (m.earWhich === 2 || m.earWhich === i) ? Math.sin(m.twitch * 44) * 0.4 * (m.twitch / 0.32) : 0;
      e.rotation.set(rest.x - 0.75 * R + flick, rest.y, rest.z + flick * 0.5 * (i ? -1 : 1));
    });
    // the tail: a wave running down it, quick and tight at a run, slow and wide sitting still
    m.tph += dt * (R ? 10 + m.spd : wag * 0.7);
    // kept lying on the floor whichever way the body is tipped: level, and dropped as far as its root is off the floor
    const p = m.mesh.rotation.x, drop = TAIL_ROOT[1] * Math.cos(p) - TAIL_ROOT[2] * Math.sin(p) + (m.mesh.position.y - m.y - 0.002) / SCALE;
    m.tail.rotation.x = -p;
    if (m.d === undefined || m.d < 25) poseTail(m.tail.geometry, m.tph, 0.012 + 0.03 * (1 - R), 0.035 * Math.sin(m.tph * 0.23) * (1 - R), drop);
  },
  // the glow: a halo on the mouse and a pool of light on the floor round it, brighter as it flares
  _glow(m, d = 0) {
    const fl = m.flare, pulse = 1 + 0.08 * Math.sin(this.time * 5 + m.len);
    const at = m.state === 'home' || m.state === 'duck' ? m.hole : m.mesh.position;
    m.pool.position.set(at.x, m.y + 0.004, at.z); m.pool.scale.setScalar((2.2 + fl * 1.2) * pulse * (m.state === 'done' ? 0.55 : 1));
    m.pool.material.opacity = Math.min(1, 0.85 + fl); m.pool.visible = m.state !== 'home' || fl > 0;
    m.halo.scale.setScalar((0.36 + fl * 0.4) * pulse * (m.state === 'done' ? 1 : Math.max(1, Math.min(3.2, d / 4))));     // a beacon: bigger from further off
    m.halo.material.opacity = Math.min(1, 0.45 + d / 16 + fl * 0.5);                  // and fainter close to, where the mouse itself is what you should see
  },
  _home(m, k, d) {
    m.flare = 1.2; m.followed = d < LAG - 1; m.home = true;
    MOTIF.forEach((n, i) => k.synth.note(hz(n.midi + 36), i === 4 ? 0.16 : 0.05, { type: 'sine', vol: 0.016, at: i * 0.075 }));      // in through the grille: the whole call, in a squeak
    if (!m.followed) { k.once('mouse-lost', 'It got home without you. It will be back.', 4); return; }
    k.synth.noise(0.12, { vol: 0.03, lp: 3000, at: 0.05 });            // the rattle of the grille as it squeezes through
    if (this.tally.add(m.id)) {
      k.synth.chime([1568, 2093, 2637], { vol: 0.045, gap: 0.11, dur: 0.9 });
      k.callout(`MICE ${this.tally.count} / ${this.tally.total}`);
      if (this.tally.done) k.find('mice');
      k.once('mouse-vent', 'It went into the vent. E to open.', 5, true);
    }
  },
  // Its squeak is two notes of the craft's call (src/motif.js), three octaves up, and the next two at the next stop:
  // follow a mouse across its run and you have heard the whole of it. (The story: src/story.js.)
  _chirp(k, m) {
    const i = (m.chirp = ((m.chirp || 0) + 1) % 4), a = MOTIF[i], b = MOTIF[i + 1];
    k.synth.note(hz(a.midi + 36), 0.05, { type: 'sine', vol: 0.016 }); k.synth.note(hz(b.midi + 36), b.beats > 1 ? 0.12 : 0.05, { type: 'sine', vol: 0.014, at: 0.09 });
  },
  // Is the toy on a mouse's tail just now? (src/guards.js: the robots leave such a toy alone.) Narrowly: a mouse the toy
  // set off is running, or sat up at one of its stops; it has not given the toy up and gone on alone, and is not
  // stopped waiting for a toy that has fallen behind; the toy is within LAG metres of it, on its level; and it bolted
  // less than HUNT seconds ago (a run takes eight to twenty: nobody is left alone for dawdling behind a mouse longer than that).
  following() {
    for (const m of this.list || []) if ((m.state === 'run' || m.state === 'sit') && !m.alone && m.d < LAG && m.chase < HUNT) return true;
    return false;
  },
  // Has this wing's mouse been seen home? (src/nests.js: its grille can be opened once it has.)
  seenHome(wing) { return !!this.tally && this.tally.has('mouse-' + wing); },
  spots(k) {
    if (!this.placed && !placingNow()) { this.k = this.k || k; this.place(); }
    return (this.list || []).flatMap(m => [{ kind: 'secret', id: 'mice', name: 'Mouse: ' + m.wing.name, x: m.pts[0].x, y: m.y, z: m.pts[0].z }, { kind: 'todo', id: 'mouse-vent', name: 'Mouse vent: ' + m.wing.name, x: m.hole.x, y: m.y, z: m.hole.z }]);
  },
  reset() {
    for (const m of this.list || []) if (m.state !== 'done') { m.state = 'peek'; m.t = 0; m.flare = 0; m.alone = false; if (m.mesh) this._place(m); }
    if (this.tr) { this.tr.born.fill(-1e6); this.tr.last = -1e6; }
  },
});
