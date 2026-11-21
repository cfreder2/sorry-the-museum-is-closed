// The robot security guards, on paper: where each one patrols, the floor it can drive, and what it can see.
//
// No three.js and no DOM in here, so it can be run and checked without a browser (src/guards.js draws
// the robots and plays them).
//
//   * patrols(plan, n)          n patrol loops, each a short chain of galleries on one level, spread over the building
//   * a patrol's grid           the floor of its rooms and their neighbours cut into cells: open (drivable by a robot
//                               of radius BOT.r, clear of every wall, case, bench, stair and ramp), and what blocks sight
//   * clearAt, lineClear        is this spot, this straight line, drivable by a robot?
//   * sight(g, a, b, low)       can a robot at a see b? Walls and tall things block it; benches and low kit only hide
//                               something low down close behind them
//   * reach(g, x, z, dx, dz)    how far a ray of light goes before it meets a wall (the searchlight on the floor)
//   * path(g, a, b, out)        the way from a to b over the grid (A*), pulled tight into a few straight runs
//
// A robot only ever stands on an open cell, and only moves along lines that lineClear has passed, so it
// cannot be in a wall. A grid ends at the doorways out of its patrol's neighbourhood: a robot never
// leaves it, and gives up a chase that does.

import { dice, hash, inside } from './heistplan.js';

export const BOT = {
  r: 0.36,          // radius of the robot's skirt
  h: 1.0,           // the height it stands (things lower than this over the floor are in its way)
  lens: 0.8,        // its searchlight
  emitter: 1.08,    // the tip of the prong the bolt comes from
  walk: 1.25,       // on patrol, m/s
  look: 1.9,        // going to see what that was
  run: 5.6,         // chasing (the car tops out near 9.5: you can always outrun one in the open)
  reach: 1.5,       // the bolt, from the prong to the toy
};
export const ROOM = BOT.r + 0.06;      // the clearance a robot's way is planned with (a little over its radius: lines are tested at points)
const C = 0.3;      // grid cell, metres
const same = (a, b) => Math.abs(a - b) < 0.06;

// Interior doorways a robot can drive through, by room.
function links(plan) {
  const out = new Map();
  const add = (a, b, d) => { if (!out.has(a)) out.set(a, []); out.get(a).push({ to: b, door: d }); };
  for (const d of plan.doors) {
    if (d.out || d.b === 'out' || d.vent || d.hidden || d.h < 1.3) continue;
    const ra = plan.byId[d.a], rb = plan.byId[d.b];
    if (!ra || !rb || ra.secret || rb.secret || !same(ra.y, d.y) || !same(rb.y, d.y)) continue;
    add(d.a, d.b, d); add(d.b, d.a, d);
  }
  return out;
}

const centre = r => ({ x: (r.x0 + r.x1) / 2, z: (r.z0 + r.z1) / 2, y: r.y });

// Galleries a robot can patrol: one plain level, not the Grand Staircase or Griffin Court, and not near the way in.
function patrollable(plan, r) {
  if (r.kind !== 'gallery' || r.secret || r.id === 'G200' || r.passage) return false;
  if (r.floor !== '1' && r.floor !== '2') return false;
  const w = r.x1 - r.x0, d = r.z1 - r.z0;
  if (Math.min(w, d) < 5 || r.h < 2.6) return false;
  const s = plan.spawn, c = centre(r);
  return Math.hypot(c.x - s.x, c.z - s.z) > 48;
}

// ------------------------------------------------------------------ grid --
// The floor of a set of rooms on one level, cut into cells.
//   open[k]   1 where a robot's middle may be (clr >= BOT.r there too, see clr)
//   clr[k]    how far the cell is from the nearest thing a robot would hit
//   sight[k]  bit 1: blocks sight (a wall, a column, a tall case); bit 2: low (a bench, a box): hides only what is low and close behind it
export function grid(plan, roomIds, fy) {
  const rooms = roomIds.map(id => plan.byId[id]);
  const set = new Set(roomIds);
  let X0 = Infinity, X1 = -Infinity, Z0 = Infinity, Z1 = -Infinity;
  for (const r of rooms) { X0 = Math.min(X0, r.x0); X1 = Math.max(X1, r.x1); Z0 = Math.min(Z0, r.z0); Z1 = Math.max(Z1, r.z1); }
  X0 -= 1.5; Z0 -= 1.5; X1 += 1.5; Z1 += 1.5;
  const nx = Math.ceil((X1 - X0) / C), nz = Math.ceil((Z1 - Z0) / C), N = nx * nz;
  const floor = new Uint8Array(N), open = new Uint8Array(N), sight = new Uint8Array(N).fill(1);
  const span = (a0, a1, o, n) => [Math.max(0, Math.floor((a0 - o) / C)), Math.min(n - 1, Math.ceil((a1 - o) / C) - 1)];
  const fill = (x0, x1, z0, z1, f) => {
    if (x1 < X0 || x0 > X1 || z1 < Z0 || z0 > Z1) return;
    const [i0, i1] = span(x0, x1, X0, nx), [j0, j1] = span(z0, z1, Z0, nz);
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) f(j * nx + i);
  };
  // The floor: every room in the set, and the doorways between two of them, a metre into the room either side. A cell is
  // floor only if it lies wholly inside one of those: a wall thinner than a cell still shuts the cells either side of it.
  const lay = (x0, x1, z0, z1) => {
    const i0 = Math.max(0, Math.ceil((x0 - X0) / C - 1e-6)), i1 = Math.min(nx - 1, Math.floor((x1 - X0) / C + 1e-6) - 1);
    const j0 = Math.max(0, Math.ceil((z0 - Z0) / C - 1e-6)), j1 = Math.min(nz - 1, Math.floor((z1 - Z0) / C + 1e-6) - 1);
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) floor[j * nx + i] = 1;
  };
  for (const r of rooms) lay(r.x0, r.x1, r.z0, r.z1);
  for (const d of plan.doors) if (!d.out && !d.vent && !d.hidden && d.h >= 1.3 && same(d.y, fy) && set.has(d.a) && set.has(d.b)) {
    if (d.along === 'x') lay(d.x0 - 1, d.x1 + 1, d.z0, d.z1); else lay(d.x0, d.x1, d.z0 - 1, d.z1 + 1);
  }
  for (let k = 0; k < N; k++) if (floor[k]) { open[k] = 1; sight[k] = 0; }
  // Shut: whatever stands on that floor up to the robot's height; and what of it blocks sight.
  const H = fy + BOT.h;
  const solid = (x0, x1, z0, z1, bot, top) => {
    if (top <= fy + 0.05 || bot >= H) return;
    fill(x0, x1, z0, z1, k => { open[k] = 0; });
    if (bot < fy + 0.5) { const tall = top > fy + 1.0; fill(x0, x1, z0, z1, k => { if (floor[k]) sight[k] |= tall ? 1 : 2; }); }
  };
  for (const o of plan.obstacles) solid(o.x0, o.x1, o.z0, o.z1, o.y0, o.y1);
  for (const s of plan.surfaces) {
    if (s.hill || s.roof) continue;
    const top = Math.max(s.h0, s.h1), bot = s.thick ? Math.min(s.h0, s.h1) - s.thick : s.base || 0;
    if (s.thick && bot > fy + 0.3) { if (bot < H) fill(s.x0, s.x1, s.z0, s.z1, k => { open[k] = 0; }); continue; }      // a table top, a low deck: the robot will not fit under, but it sees under it
    solid(s.x0, s.x1, s.z0, s.z1, Math.min(bot, top), top);
  }
  for (const q of plan.ramps || []) if (Math.min(q.y0, q.y1) < H && Math.max(q.y0, q.y1) > fy - 0.1) fill(q.x0 - 0.2, q.x1 + 0.2, q.z0 - 0.2, q.z1 + 0.2, k => { open[k] = 0; });
  for (const l of plan.lifts || []) if (l.stops[0] - 0.3 < H && l.stops[l.stops.length - 1] + 2.7 > fy) fill(l.x0 - 0.2, l.x1 + 0.2, l.z0 - 0.2, l.z1 + 0.2, k => { open[k] = 0; sight[k] |= 1; });
  for (const w of plan.wells || []) if (Math.abs(w.y - fy) < 0.3) fill(w.x0 - 0.3, w.x1 + 0.3, w.z0 - 0.3, w.z1 + 0.3, k => { open[k] = 0; });
  // How far each cell is from the nearest shut one (two passes, near enough).
  const dist = new Float32Array(N).fill(99);
  for (let k = 0; k < N; k++) if (!open[k]) dist[k] = 0;
  const D1 = C, D2 = C * Math.SQRT2;
  const relax = (k, i, j, di, dj, w) => { const a = i + di, b = j + dj; if (a < 0 || b < 0 || a >= nx || b >= nz) { if (dist[k] > C / 2) dist[k] = C / 2; return; } const v = dist[b * nx + a] + w; if (v < dist[k]) dist[k] = v; };
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const k = j * nx + i; if (!open[k]) continue; relax(k, i, j, -1, 0, D1); relax(k, i, j, 0, -1, D1); relax(k, i, j, -1, -1, D2); relax(k, i, j, 1, -1, D2); }
  for (let j = nz - 1; j >= 0; j--) for (let i = nx - 1; i >= 0; i--) { const k = j * nx + i; if (!open[k]) continue; relax(k, i, j, 1, 0, D1); relax(k, i, j, 0, 1, D1); relax(k, i, j, 1, 1, D2); relax(k, i, j, -1, 1, D2); }
  const clr = new Float32Array(N);
  for (let k = 0; k < N; k++) clr[k] = open[k] ? dist[k] - C / 2 : -1;
  return { X0, Z0, X1, Z1, nx, nz, N, C, fy, open, clr, sight, rooms: roomIds };
}

export const cellAt = (g, x, z) => { const i = Math.floor((x - g.X0) / g.C), j = Math.floor((z - g.Z0) / g.C); return i < 0 || j < 0 || i >= g.nx || j >= g.nz ? -1 : j * g.nx + i; };
export const clearAt = (g, x, z) => { const k = cellAt(g, x, z); return k < 0 ? -1 : g.clr[k]; };
const cx = (g, k) => g.X0 + ((k % g.nx) + 0.5) * g.C, cz = (g, k) => g.Z0 + (Math.floor(k / g.nx) + 0.5) * g.C;

// Can a robot drive straight from a to b? (Every few centimetres along the way is clear of things by `need`.)
export function lineClear(g, ax, az, bx, bz, need = ROOM) {
  const L = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.ceil(L / (g.C / 6)));
  for (let s = 0; s <= n; s++) { const t = s / n; if (clearAt(g, ax + (bx - ax) * t, az + (bz - az) * t) < need) return false; }
  return true;
}

// Can a robot at a see b? `low`: b is down near the floor, so a bench or a box close in front of it hides it.
export function sight(g, ax, az, bx, bz, low) {
  const L = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.ceil(L / (g.C * 0.5)));
  for (let s = 1; s < n; s++) {
    const t = s / n, k = cellAt(g, ax + (bx - ax) * t, az + (bz - az) * t);
    if (k < 0) return false;
    const m = g.sight[k];
    if (m & 1) return false;
    if ((m & 2) && low && t > 0.55 && L * (1 - t) < 1.6) return false;
  }
  return cellAt(g, bx, bz) >= 0;
}

// How far a ray goes from (x, z) along (dx, dz) (a unit vector) before it meets something that blocks sight, up to max.
export function reach(g, x, z, dx, dz, max) {
  const st = g.C * 0.5;
  for (let d = st; d < max; d += st) { const k = cellAt(g, x + dx * d, z + dz * d); if (k < 0 || (g.sight[k] & 1)) return Math.max(0, d - st * 0.5); }
  return max;
}

// The open cell nearest (x, z) with at least `need` of clearance, within `within` metres; or -1.
export function nearestOpen(g, x, z, need = ROOM, within = 1.5) {
  const ci = Math.floor((x - g.X0) / g.C), cj = Math.floor((z - g.Z0) / g.C), R = Math.ceil(within / g.C);
  let best = -1, bd = Infinity;
  for (let j = cj - R; j <= cj + R; j++) for (let i = ci - R; i <= ci + R; i++) {
    if (i < 0 || j < 0 || i >= g.nx || j >= g.nz) continue;
    const k = j * g.nx + i; if (g.clr[k] < need) continue;
    const d = (i - ci) ** 2 + (j - cj) ** 2; if (d < bd) { bd = d; best = k; }
  }
  return best;
}

// ------------------------------------------------------------------ the way --
// A* over the grid, 8 ways, kept off the walls where there is room; the scratch arrays are shared and
// grown once, so asking for a way allocates nothing.
let S = null;
function scratch(N) {
  if (S && S.N >= N) return S;
  const cap = N * 4;
  S = { N, cost: new Float32Array(N), from: new Int32Array(N), stamp: new Uint32Array(N), shut: new Uint32Array(N), gen: 0, hk: new Int32Array(cap), hv: new Float32Array(cap), cap, cells: new Int32Array(N) };
  return S;
}
// Writes the way as x, z pairs into `out` (a Float32Array) and returns how many points; the first is a, the last b.
// 0 if there is none (or it would be longer than out holds, pulled tight).
export function path(g, ax, az, bx, bz, out, need = ROOM, limit = 0) {
  const A = clearAt(g, ax, az) >= need ? cellAt(g, ax, az) : nearestOpen(g, ax, az, need, 0.9);
  const B = clearAt(g, bx, bz) >= need ? cellAt(g, bx, bz) : nearestOpen(g, bx, bz, need, 1.5);
  if (A < 0 || B < 0) return 0;
  const s = scratch(g.N), nx = g.nx, clr = g.clr;
  s.gen = (s.gen + 1) >>> 0 || 1; const gen = s.gen;
  let hn = 0;
  const push = (k, v) => {
    if (hn >= s.cap) return;
    let i = hn++; s.hk[i] = k; s.hv[i] = v;
    while (i > 0) { const p = (i - 1) >> 1; if (s.hv[p] <= s.hv[i]) break; const tk = s.hk[p], tv = s.hv[p]; s.hk[p] = s.hk[i]; s.hv[p] = s.hv[i]; s.hk[i] = tk; s.hv[i] = tv; i = p; }
  };
  const pop = () => {
    const top = s.hk[0]; hn--;
    if (hn > 0) {
      s.hk[0] = s.hk[hn]; s.hv[0] = s.hv[hn]; let i = 0;
      for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < hn && s.hv[l] < s.hv[m]) m = l; if (r < hn && s.hv[r] < s.hv[m]) m = r; if (m === i) break; const tk = s.hk[m], tv = s.hv[m]; s.hk[m] = s.hk[i]; s.hv[m] = s.hv[i]; s.hk[i] = tk; s.hv[i] = tv; i = m; }
    }
    return top;
  };
  const bi = B % nx, bj = (B - bi) / nx;
  const h = k => { const i = k % nx, j = (k - i) / nx, di = Math.abs(i - bi), dj = Math.abs(j - bj); return (Math.max(di, dj) + 0.4142 * Math.min(di, dj)) * g.C; };
  s.stamp[A] = gen; s.cost[A] = 0; s.from[A] = A; push(A, h(A));
  let found = false, steps = 0;
  const max = limit || g.N;
  while (hn > 0) {
    const u = pop();
    if (s.shut[u] === gen) continue;
    s.shut[u] = gen;
    if (u === B) { found = true; break; }
    if (++steps > max) break;
    const ui = u % nx, uj = (u - ui) / nx, cu = s.cost[u];
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
      if (!di && !dj) continue;
      const i = ui + di, j = uj + dj; if (i < 0 || j < 0 || i >= nx || j >= g.nz) continue;
      const v = j * nx + i; if (clr[v] < need || s.shut[v] === gen) continue;
      if (di && dj && (clr[uj * nx + i] < need || clr[j * nx + ui] < need)) continue;      // no cutting a corner
      const c = clr[v], pen = c < need + 0.5 ? 1 + (need + 0.5 - c) * 3 : 1;
      const nc = cu + (di && dj ? 1.4142 : 1) * g.C * pen;
      if (s.stamp[v] === gen && nc >= s.cost[v]) continue;
      s.stamp[v] = gen; s.cost[v] = nc; s.from[v] = u; push(v, nc + h(v));
    }
  }
  if (!found) return 0;
  // Back from B, then pulled tight: from each point, the furthest one further on that can be driven to in a straight line.
  let n = 0; for (let k = B; ; k = s.from[k]) { s.cells[n++] = k; if (k === A) break; }
  const cells = s.cells, cap = out.length >> 1;
  let m = 0;
  const put = (x, z) => { if (m >= cap) return false; out[m * 2] = x; out[m * 2 + 1] = z; m++; return true; };
  const ox = clearAt(g, ax, az) >= need ? ax : cx(g, A), oz = clearAt(g, ax, az) >= need ? az : cz(g, A);
  if (ox !== ax || oz !== az) put(ax, az);      // (starting a little close to something: first out to the open cell, then on)
  put(ox, oz);
  let px = ox, pz = oz, i = n - 1;
  while (i > 0) {
    let j = 0;
    for (let q = 0; q < i; q++) { if (lineClear(g, px, pz, cx(g, cells[q]), cz(g, cells[q]), need)) { j = q; break; } }
    if (j >= i) {
      j = i - 1;
      // (Nothing straight from here: an off-centre start may clip a corner on the way to the next cell, so go by this cell's middle.)
      if (!lineClear(g, px, pz, cx(g, cells[j]), cz(g, cells[j]), need) && (px !== cx(g, cells[i]) || pz !== cz(g, cells[i]))) { px = cx(g, cells[i]); pz = cz(g, cells[i]); if (!put(px, pz)) return 0; continue; }
    }
    px = cx(g, cells[j]); pz = cz(g, cells[j]);
    if (!put(px, pz)) return 0;
    i = j;
  }
  // End exactly at b when b itself is clear and in a straight line from the last point.
  if (clearAt(g, bx, bz) >= need && (px !== bx || pz !== bz)) {
    const qx = m > 1 ? out[(m - 2) * 2] : ox, qz = m > 1 ? out[(m - 2) * 2 + 1] : oz;
    if (m > 1 && lineClear(g, qx, qz, bx, bz, need)) { out[(m - 1) * 2] = bx; out[(m - 1) * 2 + 1] = bz; }
    else if (lineClear(g, px, pz, bx, bz, need) && !put(bx, bz)) return 0;
  }
  return m;
}

// ------------------------------------------------------------------ patrols --
// The place in a room where a robot stops to look about: open floor near the middle, well away from its doorways.
function scanSpot(plan, g, r, doors) {
  const c = centre(r);
  let best = -1, bd = Infinity, fb = -1, fc = -1;
  for (let k = 0; k < g.N; k++) {
    if (g.clr[k] < BOT.r) continue;
    const x = cx(g, k), z = cz(g, k);
    if (x < r.x0 + 0.5 || x > r.x1 - 0.5 || z < r.z0 + 0.5 || z > r.z1 - 0.5) continue;
    if (g.clr[k] > fc) { fc = g.clr[k]; fb = k; }
    if (g.clr[k] < 0.9) continue;
    if (doors.some(d => Math.hypot((d.x0 + d.x1) / 2 - x, (d.z0 + d.z1) / 2 - z) < 3)) continue;
    const dd = (x - c.x) ** 2 + (z - c.z) ** 2;
    if (dd < bd) { bd = dd; best = k; }
  }
  const k = best >= 0 ? best : fb;
  return k < 0 ? null : { x: cx(g, k), z: cz(g, k) };
}

// n patrols, spread out. Each: { id, fy, rooms (the chain), area (the chain and its neighbours: its grid), grid,
// pts (Float32Array x, z pairs, a loop: out along the chain and back), scan (Uint8Array, 1 where it stops to look), n }.
export function patrols(plan, want, seed = 'guards') {
  const L = links(plan), rnd = dice(hash(seed));
  const ok = new Set(plan.rooms.filter(r => patrollable(plan, r)).map(r => r.id));
  // Chains: a short walk from a gallery through its doorways to galleries on the same level, never back on itself.
  const chains = [];
  const starts = [...ok].sort();
  for (let t = 0; t < 240 && starts.length; t++) {
    const s = starts[Math.floor(rnd() * starts.length)], chain = [s], len = 2 + Math.floor(rnd() * 3);
    while (chain.length < len) {
      const here = chain[chain.length - 1], next = (L.get(here) || []).filter(q => ok.has(q.to) && !chain.includes(q.to));
      if (!next.length) break;
      chain.push(next[Math.floor(rnd() * next.length)].to);
    }
    const r0 = plan.byId[s];
    if (chain.length < 2 && Math.max(r0.x1 - r0.x0, r0.z1 - r0.z0) < 12) continue;
    chains.push(chain);
  }
  // Spread them out: each next one as far as can be from those already taken (another level counts as far).
  const mid = ch => { let x = 0, z = 0; for (const id of ch) { const c = centre(plan.byId[id]); x += c.x; z += c.z; } return { x: x / ch.length, z: z / ch.length, y: plan.byId[ch[0]].y }; };
  const taken = [], used = new Set();
  while (taken.length < want) {
    let best = null, bd = -1;
    for (const ch of chains) {
      if (ch.some(id => used.has(id))) continue;
      const m = mid(ch); let d = 1e9;
      for (const t of taken) { const q = mid(t); d = Math.min(d, Math.hypot(m.x - q.x, m.z - q.z) + (Math.abs(m.y - q.y) > 1 ? 45 : 0)); }
      d += ch.length * 3;
      if (d > bd) { bd = d; best = ch; }
    }
    if (!best || (taken.length && bd < 30)) break;
    taken.push(best); for (const id of best) used.add(id);
    // (and not in a room next to one taken: two robots' beats never touch)
    for (const id of best) for (const q of L.get(id) || []) used.add(q.to);
  }
  const out = [];
  for (const chain of taken) { const p = build(plan, L, chain, out.length); if (p) out.push(p); }
  return out;
}

// One beat over rooms you name (src/lobby.js puts one through the Michigan Avenue lobby, the first robot most people meet).
export function beat(plan, rooms, id) { const p = build(plan, links(plan), rooms, 0); if (p) p.id = id; return p; }

function build(plan, L, chain, n) {
  const fy = plan.byId[chain[0]].y;
  const area = new Set(chain);
  for (const id of chain) for (const q of L.get(id) || []) area.add(q.to);
  const g = grid(plan, [...area], fy);
  // Key points: the scan spot in each room, and either side of each doorway on the way to the next, square through it.
  const keys = [];
  for (let i = 0; i < chain.length; i++) {
    const r = plan.byId[chain[i]], doors = (L.get(r.id) || []).map(q => q.door);
    const sp = scanSpot(plan, g, r, doors); if (!sp) return null;
    if (chain.length === 1) {
      // One long room: two spots, a third of the way in from each end.
      const along = r.x1 - r.x0 > r.z1 - r.z0, c = centre(r), off = (along ? r.x1 - r.x0 : r.z1 - r.z0) / 4;
      for (const s of [-1, 1]) { const k = nearestOpen(g, along ? c.x + s * off : c.x, along ? c.z : c.z + s * off, 0.8, 3); if (k >= 0) keys.push({ x: cx(g, k), z: cz(g, k), scan: true }); }
      break;
    }
    keys.push({ x: sp.x, z: sp.z, scan: true });
    if (i < chain.length - 1) {
      const d = (L.get(r.id) || []).find(q => q.to === chain[i + 1]).door, a = inside(d, r, 0.9), b = inside(d, plan.byId[chain[i + 1]], 0.9);
      keys.push({ x: a.x, z: a.z }, { x: (d.x0 + d.x1) / 2, z: (d.z0 + d.z1) / 2 }, { x: b.x, z: b.z });
    }
  }
  // Every key point on open floor (a doorway's middle can be close to its jamb in a thick wall).
  for (const q of keys) if (clearAt(g, q.x, q.z) < ROOM) { const k = nearestOpen(g, q.x, q.z, ROOM, 1.5); if (k < 0) return null; q.x = cx(g, k); q.z = cz(g, k); }
  if (keys.length < 2) return null;
  // Out along the chain and back again.
  const loop = [...keys, ...keys.slice(1, -1).reverse()];
  const xs = [], zs = [], scan = [], buf = new Float32Array(1024);
  for (let i = 0; i < loop.length; i++) {
    const a = loop[i], b = loop[(i + 1) % loop.length];
    const m = path(g, a.x, a.z, b.x, b.z, buf);
    if (!m) return null;
    for (let q = 0; q < m - 1; q++) { xs.push(buf[q * 2]); zs.push(buf[q * 2 + 1]); scan.push(q === 0 && a.scan ? 1 : 0); }
  }
  const pts = new Float32Array(xs.length * 2);
  for (let i = 0; i < xs.length; i++) { pts[i * 2] = xs[i]; pts[i * 2 + 1] = zs[i]; }
  return { id: 'bot' + n, fy, rooms: chain, area: [...area], grid: g, pts, scan: Uint8Array.from(scan), n: xs.length };
}
