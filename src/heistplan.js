// The heist, on paper: which room, which way there, where the beams go, and proof a car can get through.
//
// No three.js and no DOM in here, so all of it can be run and checked without a browser
// (src/heist.js draws it and plays it).
//
//   * way(plan)            a route finder over doorways, stairs and lifts, for the clock and the arrow
//   * targets(plan)        the galleries a heist can be set in
//   * lasers(plan, ...)    the beams for a room, built from a seed out of patterns with known gaps
//   * beamAt(b, t, o)      where one beam is at time t, and whether it is lit
//   * solve(plan, ...)     a search over floor and time: can a toy car get from here to there untouched?
//
// A beam is one of four kinds: 's' static, 'b' blinking (lit for `on` seconds of every `P`), 'm'
// sliding to and fro along its own length, 'r' turning about a post like a lighthouse. Every period
// divides CYCLE, so the whole room repeats and the search can cover all of time.

import { roomAt } from './plan.js';

export const CYCLE = 12;                 // seconds: every beam's period divides this
export const LOW = 0.15;                 // the height of a beam a car cannot go under
export const UPPER = [0.62, 1.08, 1.54, 2.0, 2.46];      // the ones it can, and a drone must find a way between
export const WARN = 0.45;                // a blinking beam glows dimly this long before it comes on
const TAU = Math.PI * 2;

export const hash = s => { let h = 7; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };
export function dice(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// ------------------------------------------------------------------ the way --

// The point just inside room `r` from doorway `d`, `m` metres in, and the way that faces into the room.
export function inside(d, r, m = 0.9) {
  if (d.along === 'x') { const west = (d.x0 + d.x1) / 2 < (r.x0 + r.x1) / 2, x = west ? r.x0 + m : r.x1 - m; return { x, z: (d.z0 + d.z1) / 2, y: d.y, yaw: west ? Math.PI / 2 : -Math.PI / 2, nx: west ? 1 : -1, nz: 0 }; }
  const north = (d.z0 + d.z1) / 2 < (r.z0 + r.z1) / 2, z = north ? r.z0 + m : r.z1 - m;
  return { x: (d.x0 + d.x1) / 2, z, y: d.y, yaw: north ? 0 : Math.PI, nx: 0, nz: north ? 1 : -1 };
}

// A route finder. Its places are the two sides of every doorway, the two ends of every stair and
// ramp, and every stop of every lift; two places in the same room on the same level are joined by
// a straight line. Good enough to say how far it is and which doorway to make for next.
export function way(plan) {
  const ends = [], byRoom = new Map(), adj = [];
  const add = (room, x, z, y, door) => { if (!room) return -1; const i = ends.length; ends.push({ room: room.id, x, z, y, door }); adj.push([]); if (!byRoom.has(room.id)) byRoom.set(room.id, []); byRoom.get(room.id).push(i); return i; };
  const join = (a, b, c) => { if (a < 0 || b < 0) return; adj[a].push([b, c]); adj[b].push([a, c]); };
  for (const d of plan.doors) {
    if (d.out || d.b === 'out' || d.vent) continue;
    const ra = plan.byId[d.a], rb = plan.byId[d.b]; if (!ra || !rb) continue;
    const pa = inside(d, ra, 0.7), pb = inside(d, rb, 0.7);
    join(add(ra, pa.x, pa.z, d.y, d), add(rb, pb.x, pb.z, d.y, d), Math.hypot(pa.x - pb.x, pa.z - pb.z));
  }
  for (const q of plan.ramps) {
    const cx = (q.x0 + q.x1) / 2, cz = (q.z0 + q.z1) / 2, e = 0.4;
    const lo = q.axis === 'x' ? [q.x0 - e, cz] : [cx, q.z0 - e], hi = q.axis === 'x' ? [q.x1 + e, cz] : [cx, q.z1 + e];
    const run = q.axis === 'x' ? q.x1 - q.x0 : q.z1 - q.z0;
    join(add(roomAt(plan, lo[0], lo[1], q.y0 + 0.1), lo[0], lo[1], q.y0), add(roomAt(plan, hi[0], hi[1], q.y1 + 0.1), hi[0], hi[1], q.y1), Math.hypot(run, q.y1 - q.y0) + 2 * e);
  }
  for (const l of plan.lifts) {
    const cx = (l.x0 + l.x1) / 2, cz = (l.z0 + l.z1) / 2, at = l.stops.map(y => add(roomAt(plan, cx, cz, y + 0.1), cx, cz, y));
    for (let i = 0; i < at.length; i++) for (let j = i + 1; j < at.length; j++) join(at[i], at[j], 14 + Math.abs(l.stops[i] - l.stops[j]) * 2);      // a lift is slow, and has to be waited for
  }
  const level = (a, b) => Math.abs(a.y - b.y) < 1.2;
  for (const list of byRoom.values()) for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) { const a = ends[list[i]], b = ends[list[j]]; if (level(a, b)) join(list[i], list[j], Math.hypot(a.x - b.x, a.z - b.z)); }
  const N = ends.length;
  // from, to: { x, y, z, room } (room: an id). Returns { len, pts: [{ x, y, z }...] } ending at `to`, or null.
  function route(from, to) {
    if (!from.room || !to.room) return null;
    if (from.room === to.room && level(from, to)) return { len: Math.hypot(from.x - to.x, from.z - to.z), pts: [{ x: to.x, y: to.y, z: to.z }] };
    const dist = new Float64Array(N + 1).fill(Infinity), prev = new Int32Array(N + 1).fill(-1), done = new Uint8Array(N + 1), GOAL = N;
    for (const i of byRoom.get(from.room) || []) if (level(ends[i], from)) dist[i] = Math.hypot(ends[i].x - from.x, ends[i].z - from.z);
    const last = new Map(); for (const i of byRoom.get(to.room) || []) if (level(ends[i], to)) last.set(i, Math.hypot(ends[i].x - to.x, ends[i].z - to.z));
    for (;;) {
      let u = -1, best = Infinity;
      for (let i = 0; i <= N; i++) if (!done[i] && dist[i] < best) { best = dist[i]; u = i; }
      if (u < 0) return null;
      if (u === GOAL) break;
      done[u] = 1;
      for (const [v, c] of adj[u]) if (best + c < dist[v]) { dist[v] = best + c; prev[v] = u; }
      if (last.has(u) && best + last.get(u) < dist[GOAL]) { dist[GOAL] = best + last.get(u); prev[GOAL] = u; }
    }
    const pts = [{ x: to.x, y: to.y, z: to.z }];
    for (let u = prev[GOAL]; u >= 0; u = prev[u]) pts.unshift({ x: ends[u].x, y: ends[u].y, z: ends[u].z, door: ends[u].door, room: ends[u].room });
    return { len: dist[GOAL], pts };
  }
  return { route, ends };
}

// ------------------------------------------------------------- the targets --

const lap = (a, b, m = 0) => a.x0 < b.x1 + m && a.x1 > b.x0 - m && a.z0 < b.z1 + m && a.z1 > b.z0 - m;
// What stands on a room's floor that a car has to go round.
export function floorThings(plan, r) {
  const out = [];
  for (const o of plan.obstacles) if (lap(o, r) && o.y0 < r.y + 0.3 && o.y1 > r.y + 0.09 && !(o.gate)) out.push(o);
  for (const s of plan.surfaces) {
    if (s.hill || s.roof || !lap(s, r)) continue;
    const top = Math.max(s.h0, s.h1);
    if (top <= r.y + 0.09 || top > r.top + 1) continue;
    if (s.thick && Math.min(s.h0, s.h1) - s.thick > r.y + 0.3) continue;            // a table top: a car goes under it (its legs are in the list above)
    if (!s.fixed && Math.abs((s.base || 0) - r.y) > 0.6) continue;
    out.push(s);
  }
  return out;
}
// Galleries a heist can be set in: one plain floor, big enough for a ring of beams and not a hall.
export function targets(plan) {
  return plan.rooms.filter(r => {
    if (r.kind !== 'gallery' || r.id === 'G200') return false;
    const w = r.x1 - r.x0, l = r.z1 - r.z0;
    if (Math.min(w, l) < 9 || Math.max(w, l) > 32 || r.h < 3.3) return false;
    if (plan.surfaces.some(s => (s.fixed || s.ramp || s.lift || s.deck) && lap(s, r) && Math.max(s.h0, s.h1) > r.y - 0.2 && Math.min(s.h0, s.h1) - (s.thick || 0) < r.top)) return false;
    if ((plan.wells || []).some(q => lap(q, r, 0.5) && q.y > r.y - 0.3 && q.y < r.top + 0.6)) return false;
    if ((plan.lifts || []).some(q => lap(q, r, 0.5))) return false;
    return !!spot(plan, r);
  }).sort((a, b) => (a.id < b.id ? -1 : 1));
}
// Where the plinth goes: the clear place nearest the middle of the room with room for a ring round it.
export function spot(plan, r) {
  const things = floorThings(plan, r), cx = (r.x0 + r.x1) / 2, cz = (r.z0 + r.z1) / 2;
  const over = plan.surfaces.filter(s => !s.hill && !s.roof && lap(s, r) && Math.max(s.h0, s.h1) > r.y + 0.09 && Math.max(s.h0, s.h1) < r.y + 4);      // and not under a table or a bench either
  let best = null, bd = Infinity;
  for (let x = cx - 3; x <= cx + 3.01; x += 0.5) for (let z = cz - 3; z <= cz + 3.01; z += 0.5) {
    const d = (x - cx) ** 2 + (z - cz) ** 2;
    if (d >= bd || Math.min(x - r.x0, r.x1 - x, z - r.z0, r.z1 - z) < RING0 + CLEAR) continue;
    if (things.some(o => x > o.x0 - 1 && x < o.x1 + 1 && z > o.z0 - 1 && z < o.z1 + 1) || over.some(o => x > o.x0 - 0.6 && x < o.x1 + 0.6 && z > o.z0 - 0.6 && z < o.z1 + 0.6)) continue;
    best = { x, z }; bd = d;
  }
  return best;
}

// --------------------------------------------------------------- the beams --

const RING0 = 1.8, RING_STEP = 1.6, CLEAR = 2.0;      // the first ring's half-width, how far apart the rings are, and how far the last keeps from the walls (doorways stay clear)

// The beams for the target room. `seed` decides everything; `out` (the way back) deals differently
// from the same room. Returns { beams, posts, plinth: { x, z }, rings: [half-widths], cap }.
export function lasers(plan, r, seed, out = false, o = {}) {
  const p = spot(plan, r); if (!p) return null;
  const rnd = dice(hash(r.id) ^ Math.imul(seed + 1, 0x9E3779B1) ^ (out ? 0x5bd1e995 : 0)), y = r.y;
  const room = Math.min(p.x - r.x0, r.x1 - p.x, p.z - r.z0, r.z1 - p.z), rings = [];
  for (let R = RING0; R <= room - CLEAR + 1e-6 && rings.length < 3; R += RING_STEP) rings.push(R);
  const cap = Math.min(2.9, r.h - 0.35), ups = UPPER.filter(h => h < cap - 0.3), beams = [], posts = [];
  const B = (k, ax, ay, az, bx, by, bz, more) => { const b = { k, ax, ay: y + ay, az, bx, by: y + by, bz, ...more }; beams.push(b); return b; };
  const kinds = o.plain ? ['gap'] : ['gap', 'blink', 'slide'];
  let turn = Math.floor(rnd() * 4);
  rings.forEach((R, k) => {
    // Four sides. One is always a way through for a car; one more may be; the rest are shut.
    const sides = ['wall', 'wall', 'wall', 'wall'];
    turn = (turn + 1 + Math.floor(rnd() * 3)) % 4;                    // never the same side as the ring outside it
    sides[turn] = kinds[Math.floor(rnd() * kinds.length) % kinds.length];
    const other = (turn + 2) % 4; if (rnd() < 0.6) sides[other] = kinds[Math.floor(rnd() * kinds.length) % kinds.length];
    const C = [[p.x - R, p.z - R], [p.x + R, p.z - R], [p.x + R, p.z + R], [p.x - R, p.z + R]];
    for (const [x, z] of C) posts.push({ x, z, y, h: cap });
    for (let s = 0; s < 4; s++) {
      const [ax, az] = C[s], [bx, bz] = C[(s + 1) % 4], len = 2 * R, ux = (bx - ax) / len, uz = (bz - az) / len, kind = sides[s];
      const seg = (h, t0, t1, more, kk = 's') => B(kk, ax + ux * t0, h, az + uz * t0, ax + ux * t1, h, az + uz * t1, more);
      if (kind === 'wall') { seg(LOW, 0, len); for (const h of ups) seg(h, 0, len); }
      else if (kind === 'gap') {
        const g = 0.35 + rnd() * (len - 0.7 - GAP); seg(LOW, 0, g); seg(LOW, g + GAP, len);                       // a gap in the low beam, for a car
        const slot = Math.floor(rnd() * Math.max(1, ups.length - 1)); ups.forEach((h, i) => { if (i !== slot && i !== slot + 1) seg(h, 0, len); });      // and two beams left out higher up, for a drone
      } else if (kind === 'blink') {
        const P = rnd() < 0.5 ? 3 : 4, more = { P, on: P * 0.5, ph: Math.floor(rnd() * 8) * 0.5 };
        seg(LOW, 0, len, more, 'b'); for (const h of ups) seg(h, 0, len, more, 'b');
      } else {
        const more = { P: 6, ph: rnd() * TAU, ux, uz, amp: len * 0.45 };                                         // a curtain over a little more than half the side, sliding from one end to the other
        seg(LOW, 0, len * 0.55, more, 'm'); for (const h of ups) seg(h, 0, len * 0.55, more, 'm');
      }
    }
  });
  // A net over the top, so nothing flies in over the lot.
  if (rings.length) {
    const R = rings[rings.length - 1], n = Math.ceil(2 * R / 0.42);            // a mesh too fine for a drone to drop through
    for (let i = 0; i <= n; i++) { const t = -R + 2 * R * i / n; B('s', p.x + t, cap, p.z - R, p.x + t, cap, p.z + R, { net: true }); B('s', p.x - R, cap, p.z + t, p.x + R, cap, p.z + t, { net: true }); }
  }
  // And one turning about the plinth itself, low: come in behind it.
  if (rings.length && !o.plain && !o.still) B('r', p.x, LOW, p.z, p.x, LOW, p.z, { cx: p.x, cz: p.z, r0: 0.45, r1: rings[0] - 0.3, w: (out ? -1 : 1) * TAU / 6, ph: o.phase != null ? o.phase : rnd() * TAU });
  return { beams, posts, plinth: p, rings, cap };
}
const GAP = 1.4;

// A gate of beams in the room before, round the doorway `d` into the target: shut at the sides,
// blinking across the front. `r2` is that room; `from` is where the route comes into it, to keep clear of.
export function gate(plan, r2, d, from, seed) {
  const q = inside(d, r2, 0), depth = 2.3, half = (d.along === 'x' ? d.z1 - d.z0 : d.x1 - d.x0) / 2 + 0.7, tx = -q.nz, tz = q.nx, y = r2.y;
  const cap = Math.min(2.9, r2.h - 0.35), ups = UPPER.filter(h => h < cap - 0.3);
  const c = [[q.x + tx * half, q.z + tz * half], [q.x + tx * half + q.nx * depth, q.z + tz * half + q.nz * depth], [q.x - tx * half + q.nx * depth, q.z - tz * half + q.nz * depth], [q.x - tx * half, q.z - tz * half]];
  const box = { x0: Math.min(...c.map(p => p[0])), x1: Math.max(...c.map(p => p[0])), z0: Math.min(...c.map(p => p[1])), z1: Math.max(...c.map(p => p[1])) };
  if (box.x0 < r2.x0 - 0.01 || box.x1 > r2.x1 + 0.01 || box.z0 < r2.z0 - 0.01 || box.z1 > r2.z1 + 0.01) return null;      // no room for it
  if (from && from.x > box.x0 - 2.2 && from.x < box.x1 + 2.2 && from.z > box.z0 - 2.2 && from.z < box.z1 + 2.2) return null;
  for (const e of plan.doorsOf(r2.id)) { if (e === d || Math.abs(e.y - r2.y) > 0.3) continue; const i = inside(e, r2, 0.9); if (i.x > box.x0 - 1.2 && i.x < box.x1 + 1.2 && i.z > box.z0 - 1.2 && i.z < box.z1 + 1.2) return null; }
  if (floorThings(plan, r2).some(o => lap(o, box, 0.3))) return null;
  const rnd = dice(hash(r2.id) ^ Math.imul(seed + 7, 0x9E3779B1)), beams = [], posts = [];
  const P = 4, more = { P, on: 1.8, ph: Math.floor(rnd() * 8) * 0.5 };
  for (const h of [LOW, ...ups]) {
    beams.push({ k: 's', ax: c[0][0], ay: y + h, az: c[0][1], bx: c[1][0], by: y + h, bz: c[1][1] }, { k: 's', ax: c[3][0], ay: y + h, az: c[3][1], bx: c[2][0], by: y + h, bz: c[2][1] });
    beams.push({ k: 'b', ax: c[1][0], ay: y + h, az: c[1][1], bx: c[2][0], by: y + h, bz: c[2][1], ...more });
  }
  for (const t of [0.33, 0.66]) beams.push({ k: 's', net: true, ax: c[0][0] + (c[1][0] - c[0][0]) * t, ay: y + cap, az: c[0][1] + (c[1][1] - c[0][1]) * t, bx: c[3][0] + (c[2][0] - c[3][0]) * t, by: y + cap, bz: c[3][1] + (c[2][1] - c[3][1]) * t });
  beams.push({ k: 's', net: true, ax: c[1][0], ay: y + cap, az: c[1][1], bx: c[2][0], by: y + cap, bz: c[2][1] });
  for (const [x, z] of c) posts.push({ x, z, y, h: cap });
  return { beams, posts, box };
}

// Where beam `b` is at time `t`. Fills o: ax..bz, on (lit and dangerous), warn (about to be).
export function beamAt(b, t, o) {
  o.ax = b.ax; o.ay = b.ay; o.az = b.az; o.bx = b.bx; o.by = b.by; o.bz = b.bz; o.on = true; o.warn = false;
  if (b.k === 'b') { const u = (((t + b.ph) % b.P) + b.P) % b.P; o.on = u < b.on; o.warn = !o.on && u > b.P - WARN; }
  else if (b.k === 'm') { const s = b.amp * (0.5 + 0.5 * Math.sin(t * TAU / b.P + b.ph)); o.ax += b.ux * s; o.bx += b.ux * s; o.az += b.uz * s; o.bz += b.uz * s; }
  else if (b.k === 'r') { const a = b.w * t + b.ph, c = Math.cos(a), s = Math.sin(a); o.ax = b.cx + c * b.r0; o.az = b.cz + s * b.r0; o.bx = b.cx + c * b.r1; o.bz = b.cz + s * b.r1; }
  return o;
}

// The shortest distance between two segments in space (p1-q1 and p2-q2), squared.
export function segDist2(ax, ay, az, bx, by, bz, cx, cy, cz, dx, dy, dz) {
  const ux = bx - ax, uy = by - ay, uz = bz - az, vx = dx - cx, vy = dy - cy, vz = dz - cz, wx = ax - cx, wy = ay - cy, wz = az - cz;
  const a = ux * ux + uy * uy + uz * uz, e = vx * vx + vy * vy + vz * vz, f = vx * wx + vy * wy + vz * wz;
  let s, t;
  if (a <= 1e-12 && e <= 1e-12) { s = t = 0; }
  else if (a <= 1e-12) { s = 0; t = Math.max(0, Math.min(1, f / e)); }
  else {
    const c = ux * wx + uy * wy + uz * wz;
    if (e <= 1e-12) { t = 0; s = Math.max(0, Math.min(1, -c / a)); }
    else {
      const b = ux * vx + uy * vy + uz * vz, den = a * e - b * b;
      s = den > 1e-12 ? Math.max(0, Math.min(1, (b * f - c * e) / den)) : 0;
      t = (b * s + f) / e;
      if (t < 0) { t = 0; s = Math.max(0, Math.min(1, -c / a)); } else if (t > 1) { t = 1; s = Math.max(0, Math.min(1, (b - c) / a)); }
    }
  }
  const x = wx + ux * s - vx * t, y = wy + uy * s - vy * t, z = wz + uz * s - vz * t;
  return x * x + y * y + z * z;
}

// ------------------------------------------------------------- the proof --

// Can a toy car get from `from` to within `reach` of `to` across room `r` without touching a beam?
// A search over the floor (cells of 0.2 m) and over time (steps of 1/8 s, round the CYCLE): the car
// may wait or move one cell a step (1.6 m/s, which any car can better), is kept `margin` clear of
// every low beam, of the walls and of whatever stands on the floor, and treats a beam that is about
// to come on as on. `t0`: when it sets off (null: whenever it likes). Returns the seconds taken, or -1.
export function solve(plan, r, beams, from, to, o = {}) {
  const S = 0.2, DT = 0.125, L = Math.round(CYCLE / DT), nx = Math.ceil((r.x1 - r.x0) / S), nz = Math.ceil((r.z1 - r.z0) / S), n = nx * nz;
  const margin = o.margin == null ? 0.36 : o.margin, wall = 0.24, reach = o.reach || 0.5;
  const X = i => r.x0 + (i + 0.5) * S, Z = j => r.z0 + (j + 0.5) * S, cell = (x, z) => Math.max(0, Math.min(nx - 1, Math.floor((x - r.x0) / S))) + Math.max(0, Math.min(nz - 1, Math.floor((z - r.z0) / S))) * nx;
  const still = new Uint8Array(n), things = floorThings(plan, r);
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    const x = X(i), z = Z(j);
    if (x < r.x0 + wall || x > r.x1 - wall || z < r.z0 + wall || z > r.z1 - wall) { still[i + j * nx] = 1; continue; }
    for (const q of things) { const cx = Math.max(q.x0, Math.min(q.x1, x)), cz = Math.max(q.z0, Math.min(q.z1, z)); if ((cx - x) ** 2 + (cz - z) ** 2 < wall * wall) { still[i + j * nx] = 1; break; } }
  }
  const low = beams.filter(b => Math.min(b.ay, b.by) < r.y + 0.5), o2 = {};
  const stamp = (arr, off, ax, az, bx, bz) => {
    const i0 = Math.max(0, Math.floor((Math.min(ax, bx) - margin - r.x0) / S)), i1 = Math.min(nx - 1, Math.floor((Math.max(ax, bx) + margin - r.x0) / S)), j0 = Math.max(0, Math.floor((Math.min(az, bz) - margin - r.z0) / S)), j1 = Math.min(nz - 1, Math.floor((Math.max(az, bz) + margin - r.z0) / S));
    const ux = bx - ax, uz = bz - az, l2 = ux * ux + uz * uz || 1e-9;
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const x = X(i), z = Z(j), t = Math.max(0, Math.min(1, ((x - ax) * ux + (z - az) * uz) / l2)), dx = x - ax - ux * t, dz = z - az - uz * t; if (dx * dx + dz * dz < margin * margin) arr[off + i + j * nx] = 1; }
  };
  for (const b of low) if (b.k === 's') stamp(still, 0, b.ax, b.az, b.bx, b.bz);
  const moving = low.filter(b => b.k !== 's'), dyn = new Uint8Array(L * n);
  for (let l = 0; l < L; l++) for (const b of moving) for (const t of [l * DT, (l + 1) * DT]) { beamAt(b, t, o2); if (o2.on || o2.warn) stamp(dyn, l * n, o2.ax, o2.az, o2.bx, o2.bz); }
  const goal = new Uint8Array(n);
  { const k = Math.ceil(reach / S); const ci = Math.floor((to.x - r.x0) / S), cj = Math.floor((to.z - r.z0) / S); for (let j = cj - k; j <= cj + k; j++) for (let i = ci - k; i <= ci + k; i++) if (i >= 0 && j >= 0 && i < nx && j < nz && (X(i) - to.x) ** 2 + (Z(j) - to.z) ** 2 <= reach * reach) goal[i + j * nx] = 1; }
  // Set off from the nearest free cell to `from`.
  let s0 = cell(from.x, from.z);
  if (still[s0]) { let bd = Infinity; const ci = s0 % nx, cj = (s0 - ci) / nx; for (let j = cj - 3; j <= cj + 3; j++) for (let i = ci - 3; i <= ci + 3; i++) if (i >= 0 && j >= 0 && i < nx && j < nz && !still[i + j * nx]) { const d = (i - ci) ** 2 + (j - cj) ** 2; if (d < bd) { bd = d; s0 = i + j * nx; } } if (bd === Infinity) return -1; }
  const seen = new Uint8Array(L * n), queue = new Int32Array(L * n), steps = new Int32Array(L * n), came = o.path ? new Int32Array(L * n).fill(-1) : null;
  let head = 0, tail = 0;
  const grace = o.grace ? Math.round(o.grace / DT) : 0;
  const push = (c, l, k, from) => { const id = l * n + c; if (seen[id]) return; seen[id] = 1; steps[id] = k; if (came) came[id] = from; queue[tail++] = id; };
  if (o.t0 == null) { for (let l = 0; l < L; l++) if (!dyn[l * n + s0]) push(s0, l, 0, -1); } else push(s0, ((Math.round(o.t0 / DT) % L) + L) % L, 0, -1);
  while (head < tail) {
    const id = queue[head++], l = Math.floor(id / n), c = id - l * n, k = steps[id];
    if (goal[c]) {
      if (!came) return k * DT;
      const path = [];                                   // (o.path, for a test that wants to drive it: where to be, and how long after setting off)
      for (let u = id; u >= 0; u = came[u]) { const cc = u % n; path.unshift({ x: X(cc % nx), z: Z(Math.floor(cc / nx)), t: steps[u] * DT }); }
      return { secs: k * DT, path, layer0: Math.floor(queue[0] / n) };
    }
    const l2 = (l + 1) % L, i = c % nx, free = k < grace;
    for (let m = 0; m < 5; m++) {
      const c2 = m === 0 ? c : m === 1 ? (i + 1 < nx ? c + 1 : -1) : m === 2 ? (i > 0 ? c - 1 : -1) : m === 3 ? c + nx : c - nx;
      if (c2 < 0 || c2 >= n || still[c2]) continue;
      if (!free && (dyn[l2 * n + c2] || dyn[l * n + c2])) continue;
      push(c2, l2, k + 1, id);
    }
  }
  return -1;
}

// Deal a room its beams and prove them: the pattern for `seed` if a car can get through it, or else
// the next that it can (a few more seeds, then without the turning beam, then gaps only). `door` is
// the doorway the car comes and goes by. Inbound the car may set off whenever it likes; outbound it
// sets off at once from `o.from` (where it took the treasure), with the pattern's clock at nought.
// Returns the set, with `tries` (how many patterns were turned down first) and `secs` (how long the
// search's own slow car took), or null if the room cannot be done at all.
export function deal(plan, r, seed, out, door, o = {}) {
  const at = inside(door, r, 0.9);
  for (let k = 0; k < 8; k++) {
    const set = lasers(plan, r, seed + k * 101, out, { phase: o.phase, still: k >= 3 && k < 6, plain: k >= 6 });
    if (!set) return null;
    const secs = out ? solve(plan, r, set.beams, o.from || set.plinth, at, { t0: 0, grace: 2, reach: 0.6 }) : solve(plan, r, set.beams, at, set.plinth, { reach: 0.5 });
    if (secs >= 0) { set.tries = k; set.secs = secs; set.door = at; return set; }
  }
  return null;
}
