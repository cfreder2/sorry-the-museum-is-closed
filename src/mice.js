// The museum mice. One lives in each wing: the old building's north and south galleries, the Rice building,
// the Modern Wing and the lower level. Each has its home behind a little grille low on a wall (plan.js addNests;
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

const SCALE = 1.35;       // a well-fed mouse, a little bigger than life, so it reads from a toy's height
// Pace. The car tops out near 9.5 m/s; a mouse runs a little faster than the toy is coming, up to TOP.
const TOP = 8.2, PACE = 4.5, SEE = 14, BOLT = 4.5, SCARE = 2.2, LAG = 10, BACK = 6, WAIT = 6;
// notices you within SEE and sits up to look; runs within BOLT; at a stop on the way it stays put until you are within
// SCARE; beyond LAG it stops and waits up to WAIT seconds for the toy to come within BACK, then runs on alone (and home
// alone does not count)
// Footprints: one buffer for every mouse, a ring of quads written in place.
const PRINTS = 1200, STEP = 0.12, LIFE = 12, PAW = 0.085;
const GREEN = new THREE.Color(0.32, 1, 0.42);
// The run home: how long (along the floor), and the grid it is found on.
const CELL = 0.45, WANT = 62, MINRUN = 36, MAXRUN = 95, OPEN = 1.4;

export function mouseGeometry() {
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
export function mouseRun(plan, n, seed = 1) {
  const y = n.y, R = 70, vx = n.vent.x, vz = n.vent.z;
  const rooms = plan.rooms.filter(r => !r.secret && same(r.y, y) && r.kind !== 'hall' && !/stair|lift/.test(r.use || '') && Math.max(r.x0 - vx, vx - r.x1, r.z0 - vz, vz - r.z1, 0) < R);
  const ids = new Set(rooms.map(r => r.id));
  const doors = plan.doors.filter(d => !d.out && !d.hidden && !d.secret && same(d.y, y) && ids.has(d.a) && ids.has(d.b));
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
  // pulled taut: straight from each point to the furthest one it can see across open floor
  const see = (a, b) => { const ax = cx(a), az = cz(a), bx = cx(b), bz = cz(b), L = Math.hypot(bx - ax, bz - az), m = Math.ceil(L / 0.15); for (let t = 1; t < m; t++) { const k = cellOf(ax + (bx - ax) * t / m, az + (bz - az) * t / m); if (k < 0 || !floor[k] || open[k] < 0.4) return false; } return true; };
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
      const run = mouseRun(P, n, 17 + i * 101); if (!run) return;
      const m = {
        id: 'mouse-' + w.id, wing: w, nest: n, room: n.room, y: n.y, nx: n.nx, nz: n.nz, ...run,
        hole: { x: n.vent.x, y: n.y, z: n.vent.z },
        s: 0, state: 'peek', t: 0, spd: 0, yaw: 0, pitch: 0, pause: 0, acc: 0, foot: 1, flare: 0, alone: false, squeak: 0, px: 0, pz: 0, hx: 0, hz: 1, stop: 0, look: 0, fidget: 0, home: false,
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
    const k = this.k, G = mouseGeometry();
    const body = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6, color: 0x88aa88, emissive: 0xffffff, emissiveIntensity: 1.25 });
    // the glow takes the fur's colour: ears and nose glow their own shades, the eyes stay dark
    body.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n\ttotalEmissiveRadiance *= vColor.rgb * vec3(0.45, 1.5, 0.5);'); };
    const eyes = new THREE.MeshBasicMaterial({ color: 0x040604 });
    const glowTex = TX.radial(0, 1.2);
    const haloMat = new THREE.SpriteMaterial({ map: glowTex, color: GREEN, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
    const poolMat = new THREE.MeshBasicMaterial({ map: glowTex, color: GREEN.clone().multiplyScalar(0.75), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
    const poolGeo = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
    for (const m of this.list) {
      const g = m.mesh = new THREE.Group(); g.rotation.order = 'YXZ'; g.name = m.id;
      m.fig = new THREE.Group(); m.fig.scale.setScalar(SCALE); g.add(m.fig);
      m.fig.add(new THREE.Mesh(G.body, body), new THREE.Mesh(G.eyes, eyes));
      m.tail = new THREE.Mesh(G.tail, body); m.tail.position.set(0, 0.022, -0.062); m.fig.add(m.tail);
      m.halo = new THREE.Sprite(haloMat.clone()); m.halo.position.set(0, 0.05, 0); m.halo.scale.setScalar(0.36); g.add(m.halo);
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
        if (d < SEE) k.once('mouse-first', 'A glowing mouse, right out in the open! Follow it home.', 4);
        if (d < BOLT) { m.state = 'run'; m.t = 0; m.spd = 3; m.stop = 0; k.synth.note(2600, 0.05, { type: 'sine', vol: 0.02 }); k.synth.note(3100, 0.04, { type: 'sine', vol: 0.02, at: 0.07 }); }
      }
    } else if (m.state === 'run' || m.state === 'wait' || m.state === 'sit') {
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
      m.tail.rotation.y = Math.sin(m.t * wag) * 0.35;
    }
    this._glow(m, d);
  },
  // the glow: a halo on the mouse and a pool of light on the floor round it, brighter as it flares
  _glow(m, d = 0) {
    const fl = m.flare, pulse = 1 + 0.08 * Math.sin(this.time * 5 + m.len);
    const at = m.state === 'home' || m.state === 'duck' ? m.hole : m.mesh.position;
    m.pool.position.set(at.x, m.y + 0.004, at.z); m.pool.scale.setScalar((2.2 + fl * 1.2) * pulse * (m.state === 'done' ? 0.55 : 1));
    m.pool.material.opacity = Math.min(1, 0.85 + fl); m.pool.visible = m.state !== 'home' || fl > 0;
    m.halo.scale.setScalar((0.36 + fl * 0.4) * pulse * (m.state === 'done' ? 1 : Math.max(1, Math.min(3.2, d / 4))));     // a beacon: bigger from further off
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
      k.once('mouse-vent', 'It went into the vent. E to open.', 5);
    }
  },
  // Its squeak is two notes of the craft's call (src/motif.js), three octaves up, and the next two at the next stop:
  // follow a mouse across its run and you have heard the whole of it. (The story: src/story.js.)
  _chirp(k, m) {
    const i = (m.chirp = ((m.chirp || 0) + 1) % 4), a = MOTIF[i], b = MOTIF[i + 1];
    k.synth.note(hz(a.midi + 36), 0.05, { type: 'sine', vol: 0.016 }); k.synth.note(hz(b.midi + 36), b.beats > 1 ? 0.12 : 0.05, { type: 'sine', vol: 0.014, at: 0.09 });
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
