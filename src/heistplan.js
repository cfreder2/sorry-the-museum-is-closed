// The heist, on paper: which room, which way there, where the beams go, and proof a car can get through.
//
// No three.js and no DOM in here, so all of it can be run and checked without a browser
// (src/heist.js draws it and plays it).
//
//   * way(plan)            a route finder over doorways, stairs and lifts, for the clock and the arrow
//   * targets(plan)        the galleries a heist can be set in; pool() the ones near enough to a button
//   * pars(route, ...)     the clock: a par for the drive out, an allowance for the room, a par for the drive back
//   * lasers(plan, ...)    the beams for a room, built from a seed out of patterns with known gaps
//   * beamAt(b, t, o)      where one beam is at time t, and whether it is lit
//   * solve(plan, ...)     a search over floor and time: can a toy car get from here to there untouched,
//                          driving and hopping?
//
// A beam is one of four kinds: 's' static, 'b' blinking (lit for `on` seconds of every `P`), 'm'
// sliding to and fro along its own length, 'r' turning about a post like a lighthouse. Every period
// divides CYCLE, so the whole room repeats and the search can cover all of time.
//
// THE HOP. A car can leave the floor (Space; src/vehicles.js), so a low beam right across the way is
// no longer a wall: it is a hurdle. Measured in the game, on the flat, an ordinary car (jump 1.0):
//     the shortest tap (one frame)   0.54 m high, 0.67 s in the air
//     a 100 ms tap                   0.99 m,      0.92 s
//     a 150 ms press                 1.29 m,      1.07 s
//     held (0.26 s or more)          2.08 m,      1.38 s
// and it goes as far as its speed takes it in that time (2.0 m at 3 m/s for the shortest tap). The
// low-slung cars hop 0.44 m at the least; the monster truck 2.68 m at the most. hopY() below is that
// arc. A hurdle is one beam at LOW with nothing over it below LINTEL, so any tap clears it and a held
// jump, at the top of its arc, does not. What is beyond a hurdle matters as much as the hurdle: a hop
// at a sensible speed lands three or four metres on, so hurdles are only dealt where the landing is
// kind (onto the plinth, which stops the car; out into the open room; through a doorway).

import { roomAt } from './plan.js';

export const CYCLE = 12;                 // seconds: every beam's period divides this
export const LOW = 0.15;                 // the height of a beam a car cannot go under, and can hop over
export const UPPER = [0.62, 1.08, 1.54, 2.0, 2.46];      // the ones it can, and a drone must find a way between
export const LINTEL = 2.0;               // over a hurdle the beams start here: a tap goes under, a held jump may not
export const LIMBO = 1.08;               // and for a drone they start here: it goes through low, over the line and under the bar
export const WARN = 0.45;                // a blinking beam glows dimly this long before it comes on
export const GRACE = 2.2;                // and for this long after the treasure is taken, as the room deals itself again, nothing in it can be tripped
// What of a toy a beam can touch: a ball this big, this far above where its wheels are (src/heist.js tests exactly this).
export const BODY = { car: { r: 0.17, up: 0.14 }, drone: { r: 0.24, up: 0 } };
// The hop, as the search tries it: from a standstill, a short run and a tap. It must work for the weakest hop there is
// (the lowest car, the shortest tap) and the strongest that is still a tap (the monster truck, a 150 ms press), slow and fast.
export const HOP = { kick: 3.0, boost: 15.5, hold: 0.26, g: 9.8, lowJ: 0.9, highJ: 1.12, tap: 1 / 60, press: 0.15, slow: 2.4, fast: 3.4, runs: [0.5, 0.6, 0.7], runT: 0.42, roll: 0.3, clear: 0.26, early: 0.15, late: 0.12 };
const TAU = Math.PI * 2;

export const hash = s => { let h = 7; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };
export function dice(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// How high the wheels are, t seconds after a hop: `J` the car's own spring (its spec.jump), `p` how long the button was down.
export function hopY(t, J = 1, p = HOP.tap) {
  const v0 = HOP.kick * J, a = HOP.boost * J - HOP.g, tp = Math.min(p, HOP.hold);
  if (t <= tp) return v0 * t + 0.5 * a * t * t;
  const u = t - tp;
  return v0 * tp + 0.5 * a * tp * tp + (v0 + a * tp) * u - 0.5 * HOP.g * u * u;
}
// And how long it is off the floor.
export function hopAir(J = 1, p = HOP.tap) {
  const v0 = HOP.kick * J, a = HOP.boost * J - HOP.g, tp = Math.min(p, HOP.hold), hp = v0 * tp + 0.5 * a * tp * tp, vp = v0 + a * tp;
  return tp + (vp + Math.sqrt(vp * vp + 2 * HOP.g * hp)) / HOP.g;
}
// How hard the room is: it rises with the heists pulled off. 0 is the first one anybody gets.
export const level = done => (done <= 0 ? 0 : done === 1 ? 1 : done <= 3 ? 2 : done <= 6 ? 3 : 4);

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
  const add = (room, x, z, y, door, kind) => { if (!room) return -1; const i = ends.length; ends.push({ room: room.id, x, z, y, door, kind }); adj.push([]); if (!byRoom.has(room.id)) byRoom.set(room.id, []); byRoom.get(room.id).push(i); return i; };
  const join = (a, b, c) => { if (a < 0 || b < 0) return; adj[a].push([b, c]); adj[b].push([a, c]); };
  for (const d of plan.doors) {
    if (d.out || d.b === 'out' || d.vent || d.shut) continue;
    const ra = plan.byId[d.a], rb = plan.byId[d.b]; if (!ra || !rb) continue;
    const pa = inside(d, ra, 0.7), pb = inside(d, rb, 0.7);
    join(add(ra, pa.x, pa.z, d.y, d), add(rb, pb.x, pb.z, d.y, d), Math.hypot(pa.x - pb.x, pa.z - pb.z));
  }
  for (const q of plan.ramps) {
    const cx = (q.x0 + q.x1) / 2, cz = (q.z0 + q.z1) / 2, e = 0.4;
    const lo = q.axis === 'x' ? [q.x0 - e, cz] : [cx, q.z0 - e], hi = q.axis === 'x' ? [q.x1 + e, cz] : [cx, q.z1 + e];
    const run = q.axis === 'x' ? q.x1 - q.x0 : q.z1 - q.z0;
    join(add(roomAt(plan, lo[0], lo[1], q.y0 + 0.1), lo[0], lo[1], q.y0, null, 'stair'), add(roomAt(plan, hi[0], hi[1], q.y1 + 0.1), hi[0], hi[1], q.y1, null, 'stair'), Math.hypot(run, q.y1 - q.y0) + 2 * e);
  }
  for (const l of plan.lifts) {
    const cx = (l.x0 + l.x1) / 2, cz = (l.z0 + l.z1) / 2, at = l.stops.map(y => add(roomAt(plan, cx, cz, y + 0.1), cx, cz, y, null, 'lift'));
    for (let i = 0; i < at.length; i++) for (let j = i + 1; j < at.length; j++) join(at[i], at[j], 14 + Math.abs(l.stops[i] - l.stops[j]) * 2);      // a lift is slow, and has to be waited for
  }
  const level = (a, b) => Math.abs(a.y - b.y) < 1.2;
  for (const list of byRoom.values()) for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) { const a = ends[list[i]], b = ends[list[j]]; if (level(a, b)) join(list[i], list[j], Math.hypot(a.x - b.x, a.z - b.z)); }
  const N = ends.length;
  // from, to: { x, y, z, room } (room: an id). Returns { len, pts: [{ x, y, z }...], lifts, stairs } ending at `to`, or null
  // (lifts, stairs: how many of each the way takes).
  function route(from, to) {
    if (!from.room || !to.room) return null;
    if (from.room === to.room && level(from, to)) return { len: Math.hypot(from.x - to.x, from.z - to.z), pts: [{ x: to.x, y: to.y, z: to.z }], lifts: 0, stairs: 0 };
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
    let lifts = 0, stairs = 0;
    for (let u = prev[GOAL]; u >= 0; u = prev[u]) {
      const e = ends[u], w = prev[u] >= 0 ? ends[prev[u]] : null;
      if (w && e.kind && e.kind === w.kind && Math.abs(e.y - w.y) > 0.3) { if (e.kind === 'lift') lifts++; else stairs++; }
      pts.unshift({ x: e.x, y: e.y, z: e.z, door: e.door, room: e.room });
    }
    return { len: dist[GOAL], pts, lifts, stairs };
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
    if (things.some(o => x > o.x0 - KEEP && x < o.x1 + KEEP && z > o.z0 - KEEP && z < o.z1 + KEEP) || over.some(o => x > o.x0 - 0.6 && x < o.x1 + 0.6 && z > o.z0 - 0.6 && z < o.z1 + 0.6)) continue;
    best = { x, z }; bd = d;
  }
  return best;
}

// ------------------------------------------------------- how far, how long --

// Which of the galleries a button will send you to. `list`: [{ r, rt }], each with its route from that button. A lift
// is slow and has to be waited for, so a way that needs one is left out while there are others; then nothing nearer
// than NEAR (no drive at all) and nothing further than CAP, unless that leaves too few, when it is the LEAST nearest.
// (From the south control room that is twenty-two rooms, from 85 to 160 m off; the north one is 83 m further from
// every stair, so it gets its twelve nearest, from 110 to 220 m.)
export const POOL = { near: 60, cap: 160, least: 12 };
export function pool(list) {
  const walk = list.filter(q => !q.rt.lifts), from = (walk.length >= 4 ? walk : list).filter(q => q.rt.len >= POOL.near).sort((a, b) => a.rt.len - b.rt.len);
  const within = from.filter(q => q.rt.len <= POOL.cap);
  return within.length >= POOL.least ? within : from.slice(0, POOL.least);
}

// The clock, from the real car. Driven flat out with clean lines a car covers a route at about `v` metres a second,
// and loses about `turn` seconds at each doorway or corner on the way and `stair` more on each flight. (Measured: a
// script following the lit path flat out took 19 s over 100 m with fourteen doorways and a flight of stairs, 22 s over
// 124 m with sixteen and a flight, 16 s over 109 m with six and none; this says 19.7, 23.4 and 15.8.) That is the
// drive at its briskest. Par is
// that with slack on it: 35% for a first heist, a little less each time one is pulled off, never under 25%. The room
// has an allowance of its own for each way, by how many rings of beams stand round the plinth, and a little more once
// there may be a gate of beams at its door (from the second heist on). The clock is the sum.
export const PACE = { v: 8.2, turn: 0.42, stair: 1.6, slack: 0.35, tighten: 0.02, least: 0.25, in: [14, 12], out: [10, 10], gate: 5, lift: 16 };
export const brisk = rt => rt.len / PACE.v + PACE.turn * Math.max(0, rt.pts.length - 1) + PACE.stair * (rt.stairs || 0) + PACE.lift * (rt.lifts || 0);
export function pars(rt, rings, done = 0) {
  const slack = Math.max(PACE.least, PACE.slack - PACE.tighten * done), drive = Math.ceil(brisk(rt) * (1 + slack));
  const gate = done > 0 ? PACE.gate : 0;
  const p = { slack, out: drive, in: PACE.in[0] + PACE.in[1] * rings + gate, leave: PACE.out[0] + PACE.out[1] * rings + gate, back: drive };
  p.total = Math.round((p.out + p.in + p.leave + p.back) / 5) * 5;
  p.in += p.total - (p.out + p.in + p.leave + p.back);            // (the rounding goes to the room)
  return p;
}

// --------------------------------------------------------------- the beams --

const KEEP = 2.1;                      // nothing stands on the floor this near the plinth: the first ring of beams, and the floor to hop onto inside it, are clear all round
const RING0 = 1.8, RING_STEP = 1.6, CLEAR = 2.0;      // the first ring's half-width, how far apart the rings are, and how far the last keeps from the walls (doorways stay clear)
const GAP = 1.4;

// The beams for the target room. `seed` decides everything; `out` (the way back) deals differently
// from the same room. Returns { beams, posts, plinth: { x, z }, rings: [half-widths], cap }.
//
// Rings of beams stand round the plinth, square, 1.6 m apart. Each ring is shut on most sides and open
// on one or two, and how a side is open is its kind:
//   gap       a 1.4 m hole in the low beam for a car, and two beams left out higher up for a drone
//   blink     the whole side goes dark half the time
//   slide     a curtain over half the side, sliding from end to end
//   hop       a hurdle: the low beam runs the whole way along and has to be hopped; nothing over it below LINTEL
//   hopblink  a hurdle with a shutter over it (the beams between) that blinks: hop while it is dark
//   hopslide  a hurdle with a curtain over it that slides: hop where it is not
// A hurdle is only ever on the ring where the landing is kind: going in, the innermost (the car comes down by the
// plinth, takes the treasure and is stopped); going out, the outermost (it comes down in the open room). Low, about the
// plinth, a beam turns; it too can be hopped.
//
// `o.level` (0 to 4, see level()) is how hard: 0 has nothing that moves and offers its one hurdle beside an open gap;
// 1 adds blinking and a slow turning beam and asks for the hop; 2 adds sliding and shutters; 3 a third ring, curtains
// over hurdles and sometimes a second turning arm; 4 keeps the hurdles timed. `o.drone` deals the same room for a
// drone: over each hurdle the bars start at LIMBO, not LINTEL, so it must go through low, between the line and the bar.
export function lasers(plan, r, seed, out = false, o = {}) {
  const p = spot(plan, r); if (!p) return null;
  const lv = o.level == null ? 3 : o.level, plain = !!o.plain;
  const rnd = dice(hash(r.id) ^ Math.imul(seed + 1, 0x9E3779B1) ^ (out ? 0x5bd1e995 : 0)), y = r.y;
  const room = Math.min(p.x - r.x0, r.x1 - p.x, p.z - r.z0, r.z1 - p.z), rings = [], most = lv <= 1 ? 2 : 3;
  for (let R = RING0; R <= room - CLEAR + 1e-6 && rings.length < most; R += RING_STEP) rings.push(R);
  const cap = Math.min(2.9, r.h - 0.35), ups = UPPER.filter(h => h < cap - 0.3), beams = [], posts = [];
  const bar = o.drone ? LIMBO : LINTEL, shutter = ups.filter(h => h < bar - 0.01), over = ups.filter(h => h >= bar - 0.01);
  const B = (k, ax, ay, az, bx, by, bz, more) => { const b = { k, ax, ay: y + ay, az, bx, by: y + by, bz, ...more }; beams.push(b); return b; };
  const kinds = plain || lv === 0 ? ['gap'] : lv === 1 ? ['gap', 'blink'] : ['gap', 'blink', 'slide'];
  const hurdles = plain ? ['gap'] : lv <= 1 ? ['hop'] : lv === 2 ? ['hop', 'hop', 'hopblink'] : lv === 3 ? ['hop', 'hopblink', 'hopslide'] : ['hopblink', 'hopslide', 'hopblink', 'hop'];
  const pick = list => list[Math.floor(rnd() * list.length) % list.length];
  const hopRing = out ? rings.length - 1 : 0, sidesOf = [];
  let turn = Math.floor(rnd() * 4);
  rings.forEach((R, k) => {
    // Four sides. One is always a way through for a car; one more may be; the rest are shut.
    const sides = ['wall', 'wall', 'wall', 'wall'], hopping = k === hopRing;
    turn = (turn + 1 + Math.floor(rnd() * 3)) % 4;                    // never the same side as the ring outside it
    sides[turn] = pick(hopping ? hurdles : kinds);
    const other = (turn + 2) % 4, also = rnd(), what = pick(hopping && lv >= 2 ? hurdles : kinds);
    if (hopping && lv === 0 && !plain) sides[other] = 'gap';          // a first heist: the hurdle is offered, and a gap stands open beside it
    else if (also < (hopping ? [0, 0.5, 0.4, 0.3, 0.2][lv] : 0.6)) sides[other] = what;
    sidesOf.push(sides);
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
        const P = lv >= 4 || rnd() < 0.5 ? 3 : 4, more = { P, on: P * 0.5, ph: Math.floor(rnd() * 8) * 0.5 };
        seg(LOW, 0, len, more, 'b'); for (const h of ups) seg(h, 0, len, more, 'b');
      } else if (kind === 'slide') {
        const more = { P: 6, ph: rnd() * TAU, ux, uz, amp: len * 0.45 };                                         // a curtain over a little more than half the side, sliding from one end to the other
        seg(LOW, 0, len * 0.55, more, 'm'); for (const h of ups) seg(h, 0, len * 0.55, more, 'm');
      } else {
        // A hurdle. The line to hop, the bars well over it, and between them nothing, a shutter or a curtain.
        seg(LOW, 0, len, { hop: true }); for (const h of over) seg(h, 0, len);
        const P = lv >= 4 || rnd() < 0.5 ? 3 : 4, ph = Math.floor(rnd() * 8) * 0.5, ph2 = rnd() * TAU;            // (the dice are thrown the same whatever it turns out to be, so a drone's deal is the car's with the bars lower)
        if (kind === 'hopblink') for (const h of shutter) seg(h, 0, len, { P, on: P * 0.5, ph }, 'b');
        else if (kind === 'hopslide') for (const h of shutter) seg(h, 0, len * 0.35, { P: 6, ph: ph2, ux, uz, amp: len * 0.65 }, 'm');      // (a shorter curtain than a `slide`'s: the middle of the side, where the plinth is straight ahead, has to come clear)
      }
    }
  });
  // A net over the top, so nothing flies in over the lot.
  if (rings.length) {
    const R = rings[rings.length - 1], n = Math.ceil(2 * R / 0.42);            // a mesh too fine for a drone to drop through
    for (let i = 0; i <= n; i++) { const t = -R + 2 * R * i / n; B('s', p.x + t, cap, p.z - R, p.x + t, cap, p.z + R, { net: true }); B('s', p.x - R, cap, p.z + t, p.x + R, cap, p.z + t, { net: true }); }
  }
  // And one turning about the plinth itself, low: come in behind it, or over it. Later on it has two arms.
  // On the way out it starts where it is least in the way of a toy that has just taken the treasure (`o.toy`: which way
  // the toy is from the plinth): a little ahead of it and going away, so that it is most of a turn before it comes
  // round; with two arms, the other is as far off as it can be, the far side of the plinth.
  if (rings.length && !plain && !o.still && lv >= 1) {
    const P = lv === 1 || (out && lv === 2) ? 12 : 6, two = lv >= 4 || (lv === 3 && rnd() < 0.5), w = (out ? -1 : 1) * TAU / P, any = rnd() * TAU;      // (slow at first, and slow on the way out a little longer: the toy starts inside its sweep there)
    const ph = o.toy != null ? o.toy + Math.sign(w) * (two ? 0.35 : 0.9) : o.phase != null ? o.phase : any;
    const arm = a => B('r', p.x, LOW, p.z, p.x, LOW, p.z, { cx: p.x, cz: p.z, r0: 0.45, r1: rings[0] - 0.3, w, ph: a });
    arm(ph); if (two) arm(ph + Math.PI);
  }
  return { beams, posts, plinth: p, rings, cap, sides: sidesOf, level: lv };
}

// A gate of beams in the room before, round the doorway `d` into the target: shut at the sides, and
// across the front either blinking or (from level 2) a hurdle, sometimes with a shutter. `r2` is that
// room; `from` is where the route comes into it, to keep clear of.
export function gate(plan, r2, d, from, seed, o = {}) {
  const q = inside(d, r2, 0), depth = 2.3, half = (d.along === 'x' ? d.z1 - d.z0 : d.x1 - d.x0) / 2 + 0.7, tx = -q.nz, tz = q.nx, y = r2.y, lv = o.level == null ? 1 : o.level;
  const cap = Math.min(2.9, r2.h - 0.35), ups = UPPER.filter(h => h < cap - 0.3);
  const c = [[q.x + tx * half, q.z + tz * half], [q.x + tx * half + q.nx * depth, q.z + tz * half + q.nz * depth], [q.x - tx * half + q.nx * depth, q.z - tz * half + q.nz * depth], [q.x - tx * half, q.z - tz * half]];
  const box = { x0: Math.min(...c.map(p => p[0])), x1: Math.max(...c.map(p => p[0])), z0: Math.min(...c.map(p => p[1])), z1: Math.max(...c.map(p => p[1])) };
  if (box.x0 < r2.x0 - 0.01 || box.x1 > r2.x1 + 0.01 || box.z0 < r2.z0 - 0.01 || box.z1 > r2.z1 + 0.01) return null;      // no room for it
  if (from && from.x > box.x0 - 2.2 && from.x < box.x1 + 2.2 && from.z > box.z0 - 2.2 && from.z < box.z1 + 2.2) return null;
  for (const e of plan.doorsOf(r2.id)) { if (e === d || Math.abs(e.y - r2.y) > 0.3) continue; const i = inside(e, r2, 0.9); if (i.x > box.x0 - 1.2 && i.x < box.x1 + 1.2 && i.z > box.z0 - 1.2 && i.z < box.z1 + 1.2) return null; }
  if (floorThings(plan, r2).some(o2 => lap(o2, box, 0.3))) return null;
  const rnd = dice(hash(r2.id) ^ Math.imul(seed + 7, 0x9E3779B1)), beams = [], posts = [];
  const P = 4, more = { P, on: 1.8, ph: Math.floor(rnd() * 8) * 0.5 };
  const kind = lv >= 2 && rnd() < (lv >= 4 ? 0.75 : 0.5) ? (lv >= 3 && rnd() < 0.5 ? 'hopblink' : 'hop') : 'blink';
  const bar = o.drone ? LIMBO : LINTEL;
  for (const h of [LOW, ...ups]) {
    beams.push({ k: 's', ax: c[0][0], ay: y + h, az: c[0][1], bx: c[1][0], by: y + h, bz: c[1][1] }, { k: 's', ax: c[3][0], ay: y + h, az: c[3][1], bx: c[2][0], by: y + h, bz: c[2][1] });
    const front = { ax: c[1][0], ay: y + h, az: c[1][1], bx: c[2][0], by: y + h, bz: c[2][1] };
    if (kind === 'blink') beams.push({ k: 'b', ...front, ...more });
    else if (h === LOW) beams.push({ k: 's', ...front, hop: true });
    else if (h >= bar - 0.01) beams.push({ k: 's', ...front });
    else if (kind === 'hopblink') beams.push({ k: 'b', ...front, ...more, on: 2 });
  }
  for (const t of [0.33, 0.66]) beams.push({ k: 's', net: true, ax: c[0][0] + (c[1][0] - c[0][0]) * t, ay: y + cap, az: c[0][1] + (c[1][1] - c[0][1]) * t, bx: c[3][0] + (c[2][0] - c[3][0]) * t, by: y + cap, bz: c[3][1] + (c[2][1] - c[3][1]) * t });
  beams.push({ k: 's', net: true, ax: c[1][0], ay: y + cap, az: c[1][1], bx: c[2][0], by: y + cap, bz: c[2][1] });
  for (const [x, z] of c) posts.push({ x, z, y, h: cap });
  return { beams, posts, box, kind };
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

// The hops the search must see through, each flown ahead of time: the weakest there is (the lowest car, the shortest
// tap) and the strongest that is still a tap (the monster truck, a 150 ms press), each slow and fast. A hop the search
// uses must clear everything, and come down on free floor, flown any of these four ways.
const FLIGHTS = (() => {
  const out = [];
  for (const [J, p] of [[HOP.lowJ, HOP.tap], [HOP.highJ, HOP.press]]) for (const v of [HOP.slow, HOP.fast]) {
    const air = hopAir(J, p), pts = [];
    for (let i = 0, n = Math.ceil(air / 0.06); i <= n; i++) { const t = air * i / n; pts.push({ s: v * t, h: i === n ? 0 : hopY(t, J, p), t }); }
    out.push({ J, p, v, air, land: v * air, roll: v * HOP.roll, pts });
  }
  return out;
})();
const REACH = Math.max(...FLIGHTS.map(f => f.land + f.roll)), SHORT = Math.min(...FLIGHTS.map(f => f.land));      // the furthest any of them gets from where it left the floor, and the least any of them flies

// Can a toy car get from `from` to within `reach` of `to` across room `r` without touching a beam?
// A search over the floor (cells of 0.2 m) and over time (steps of 1/8 s, round the CYCLE): the car
// may wait or move one cell a step (1.6 m/s, which any car can better), is kept `margin` clear of
// every low beam, of the walls and of whatever stands on the floor, and treats a beam that is about
// to come on as on. `t0`: when it sets off (null: whenever it likes). Returns the seconds taken, or -1.
//
// And it may hop. From a standstill: a run of half a metre or so straight ahead (along x or z), a tap, the flight, and
// the roll after it. The flight is checked in the air, against every beam at its own height (low, high, the bars over
// a hurdle, the net), for all four FLIGHTS, each kept HOP.clear from every beam; every one of the four must come down
// on free floor, or be stopped by a wall well past the last beam it crossed, or arrive (reaching the goal in the air
// counts: a car takes the treasure as it flies over it). A hop is only tried over a low beam that never goes out,
// which is what a hurdle is. `o.nohop` leaves hopping out (what could be done before the car could hop).
// With `o.path` it returns { secs, path, hops }: where to be and when, each hop marked, for a test that wants to drive it.
export function solve(plan, r, beams, from, to, o = {}) {
  const S = 0.2, DT = 0.125, L = Math.round(CYCLE / DT), nx = Math.ceil((r.x1 - r.x0) / S), nz = Math.ceil((r.z1 - r.z0) / S), n = nx * nz;
  const margin = o.margin == null ? 0.36 : o.margin, wall = 0.24, reach = o.reach || 0.5;
  const X = i => r.x0 + (i + 0.5) * S, Z = j => r.z0 + (j + 0.5) * S, cell = (x, z) => Math.max(0, Math.min(nx - 1, Math.floor((x - r.x0) / S))) + Math.max(0, Math.min(nz - 1, Math.floor((z - r.z0) / S))) * nx;
  // `solid`: walls and what stands on the floor. `still`: those, and the floor under every low beam that never moves.
  const solid = new Uint8Array(n), still = new Uint8Array(n), things = floorThings(plan, r);
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    const x = X(i), z = Z(j);
    if (x < r.x0 + wall || x > r.x1 - wall || z < r.z0 + wall || z > r.z1 - wall) { solid[i + j * nx] = 1; continue; }
    for (const q of things) { const cx = Math.max(q.x0, Math.min(q.x1, x)), cz = Math.max(q.z0, Math.min(q.z1, z)); if ((cx - x) ** 2 + (cz - z) ** 2 < wall * wall) { solid[i + j * nx] = 1; break; } }
  }
  still.set(solid);
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

  // ---- hopping
  const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]], NR = HOP.runs.length, clear2 = HOP.clear * HOP.clear, up = BODY.car.up + r.y;
  const fixed = beams.filter(b => b.k === 's'), movers = beams.filter(b => b.k !== 's'), SLIP = [-HOP.early, 0, HOP.late];
  // Where each beam that moves is, lit or about to be, at each 1/32 s of the cycle: worked out as it is asked for.
  const Q = 32, slots = CYCLE * Q, cache = movers.map(() => new Array(slots)), clearM2 = (HOP.clear + 0.05) ** 2;
  const moverAt = (mi, t) => { const k = ((Math.round(t * Q) % slots) + slots) % slots; let e = cache[mi][k]; if (e === undefined) { beamAt(movers[mi], k / Q, o2); e = cache[mi][k] = o2.on || o2.warn ? [o2.ax, o2.ay, o2.az, o2.bx, o2.by, o2.bz] : false; } return e; };
  const tried = o.nohop ? null : new Uint8Array(n * 4 * NR), none = new Uint8Array(n), known = new Map();
  // What a hop from cell c, along DIRS[d], after a run of HOP.runs[ri], does, as far as what never moves can say: null if
  // it cannot be made, or { cells, goalT, lo, hi, tLand, tEnd, near, flights }.
  const hopFrom = (c, d, ri) => {
    const key = (c * 4 + d) * NR + ri;
    if (tried[key]) return tried[key] === 2 ? known.get(key) : null;
    tried[key] = 1;
    const [dx, dz] = DIRS[d], i0 = c % nx, j0 = (c - i0) / nx, x0 = X(i0), z0 = Z(j0), run = HOP.runs[ri];
    const at = s => { const i = Math.floor((x0 + dx * s - r.x0) / S), j = Math.floor((z0 + dz * s - r.z0) / S); return i < 0 || j < 0 || i >= nx || j >= nz ? -1 : i + j * nx; };
    const cells = [c];
    for (let s = S; s < run + S - 1e-6; s += S) { const q = at(Math.min(s, run)); if (q < 0 || still[q]) return null; cells.push(q); }      // the run: free floor
    // Ahead: the low beam to be hopped (the first floor a beam keeps a car off, to the far edge of it), which every
    // flight must be over the whole of; and the first thing solid.
    let wallAt = Infinity, first = -1, last = -1;
    for (let s = run; s <= run + REACH + S; s += S / 2) { const q = at(s); if (q < 0 || solid[q]) { wallAt = s; break; } if (still[q]) { if (first < 0) first = s; if (last < 0 || s - last < S) last = s; } }
    if (first < 0 || last > run + SHORT - 0.3 || wallAt < last + 0.3) return null;      // nothing here to hop, or too far off to be sure of clearing
    const stop = wallAt - 0.26;                                      // as far as a car gets before a wall
    if (wallAt < Infinity && stop - last < 0.9) return null;         // a wall too soon after the beam: it would be knocked back onto it
    const bx0 = Math.min(x0, x0 + dx * (run + REACH)) - 0.6, bx1 = Math.max(x0, x0 + dx * (run + REACH)) + 0.6, bz0 = Math.min(z0, z0 + dz * (run + REACH)) - 0.6, bz1 = Math.max(z0, z0 + dz * (run + REACH)) + 0.6;
    const by = b => Math.min(b.ax, b.bx) < bx1 && Math.max(b.ax, b.bx) > bx0 && Math.min(b.az, b.bz) < bz1 && Math.max(b.az, b.bz) > bz0;
    const fx = fixed.filter(by), near = [];
    movers.forEach((b, mi) => { if (b.k === 'r' ? b.cx + b.r1 > bx0 && b.cx - b.r1 < bx1 && b.cz + b.r1 > bz0 && b.cz - b.r1 < bz1 : b.k === 'm' ? by({ ax: Math.min(b.ax, b.ax + b.ux * b.amp), bx: Math.max(b.bx, b.bx + b.ux * b.amp), az: Math.min(b.az, b.az + b.uz * b.amp), bz: Math.max(b.bz, b.bz + b.uz * b.amp) }) : by(b)) near.push(mi); });
    const flights = []; let lo = Infinity, hi = -Infinity, near0 = Infinity, tLand = Infinity, tEnd = 0, goalT = 0, allGoal = true;
    for (const F of FLIGHTS) {
      // In the air, as far as the goal, a wall or the floor.
      const f = { F, n: 0, goalT: -1, segs: [] }; let hit = false;
      for (let i = 0; i + 1 < F.pts.length && !hit; i++) {
        const a = F.pts[i], b = F.pts[i + 1];
        if (run + a.s >= stop) { hit = true; break; }
        const ax = x0 + dx * (run + a.s), az = z0 + dz * (run + a.s), bs = Math.min(run + b.s, stop), bx = x0 + dx * bs, bz = z0 + dz * bs;
        for (const q of fx) if (segDist2(ax, up + a.h, az, bx, up + b.h, bz, q.ax, q.ay, q.az, q.bx, q.by, q.bz) < clear2) return null;
        f.n = i + 1; f.segs.push(ax, up + a.h, az, bx, up + b.h, bz, a.t, b.t);
        if (o.grab !== false && (bx - to.x) ** 2 + (bz - to.z) ** 2 <= reach * reach) { f.goalT = b.t; break; }
      }
      if (f.goalT < 0) {
        // Down: where, and the roll after it, over free floor (or it reaches the goal rolling).
        // (Stopped by a wall in the air, it drops at the foot of it, knocked back a little.)
        const s0 = hit ? stop - 0.5 : run + F.land, s1 = hit ? stop : Math.min(s0 + F.roll, stop);
        f.ground = []; f.t0 = F.air; f.t1 = F.air + F.roll / F.v;
        for (let s = s0 - 0.1; s <= s1 + 1e-6; s += S / 2) {
          const q = at(Math.min(s, s1)); if (q < 0 || still[q]) return null;
          if (f.ground[f.ground.length - 1] !== q) f.ground.push(q);
          if (goal[q]) { f.goalT = F.air + Math.max(0, s - s0) / F.v; break; }
        }
        if (f.goalT < 0) { lo = Math.min(lo, s0); hi = Math.max(hi, s1); near0 = Math.min(near0, s1); tLand = Math.min(tLand, F.air); tEnd = Math.max(tEnd, f.t1); allGoal = false; }
      }
      if (f.goalT >= 0) goalT = Math.max(goalT, f.goalT);
      flights.push(f);
    }
    // The strip: everywhere any of them is on the floor. `rest`: where it may have come to rest, the nearest stop to the furthest.
    const strip = [], rest = [];
    if (!allGoal) for (let s = lo - 0.1; s <= hi + 1e-6; s += S / 2) { const q = at(s); if (q < 0 || still[q]) return null; if (strip[strip.length - 1] !== q) { strip.push(q); if (s >= near0 - 0.11) rest.push(q); } }
    const h = { x0, z0, dx, dz, run, cells, flights, near, strip, rest, tLand, tEnd: allGoal ? goalT : tEnd, goalT: allGoal ? goalT : -1 };
    tried[key] = 2; known.set(key, h);
    return h;
  };
  // And as far as what moves can say, setting off at step l of the cycle.
  const hopNow = (h, l) => {
    const l1 = l + Math.ceil(HOP.runT / DT);
    for (let q = l; q <= l1; q++) for (const c of h.cells) if (dyn[(q % L) * n + c]) return false;
    const tt = l * DT + HOP.runT;
    if (h.strip.length) { const q0 = Math.floor((tt + h.tLand - HOP.early) / DT), q1 = Math.ceil((tt + h.tEnd + HOP.late) / DT); for (let q = q0; q <= q1; q++) for (const c of h.strip) if (dyn[(q % L) * n + c]) return false; }
    for (const f of h.flights) if (f.ground) { const q0 = Math.floor((tt + f.t0 - HOP.early) / DT), q1 = Math.ceil((tt + f.t1 + HOP.late) / DT); for (let q = q0; q <= q1; q++) for (const c of f.ground) if (dyn[(q % L) * n + c]) return false; }
    if (h.near.length) for (const f of h.flights) for (let i = 0, g = f.segs; i < g.length; i += 8) {
      const y0 = Math.min(g[i + 1], g[i + 4]) - HOP.clear - 0.06, y1 = Math.max(g[i + 1], g[i + 4]) + HOP.clear + 0.06;
      for (const mi of h.near) {
        const my = movers[mi].ay; if (my < y0 || my > y1) continue;            // (every beam is level: one that is not at this height cannot be touched from here)
        // (Nobody leaves the floor on the dot: it must be clear a little early and a little late as well.)
        for (let e = 0; e < 2; e++) for (const dt of SLIP) { const q = moverAt(mi, tt + g[i + 6 + e] + dt); if (q && segDist2(g[i], g[i + 1], g[i + 2], g[i + 3], g[i + 4], g[i + 5], q[0], q[1], q[2], q[3], q[4], q[5]) < clearM2) return false; }
      }
    }
    return true;
  };

  const seen = new Uint8Array(L * n), queue = new Int32Array(L * n), steps = new Int32Array(L * n), came = o.path ? new Int32Array(L * n).fill(-1) : null, how = o.path ? new Map() : null;
  let head = 0, tail = 0;
  const grace = o.grace ? Math.round(o.grace / DT) : 0;
  const push = (c, l, k, from, hop) => { const id = l * n + c; if (seen[id]) return; seen[id] = 1; steps[id] = k; if (came) { came[id] = from; if (hop) how.set(id, hop); } queue[tail++] = id; };
  const done = (id, k, last) => {
    if (!came) return k * DT;
    const path = []; let hops = last ? 1 : 0;                      // (o.path, for a test that wants to drive it: where to be, and how long after setting off)
    if (last) path.push({ x: to.x, z: to.z, t: k * DT, hop: last });
    for (let u = id; u >= 0; u = came[u]) { const cc = u % n, hop = how.get(u); if (hop) hops++; path.unshift({ x: X(cc % nx), z: Z(Math.floor(cc / nx)), t: steps[u] * DT, hop }); }
    return { secs: k * DT, path, hops, layer0: Math.floor(queue[0] / n) };
  };
  if (o.t0 == null) { for (let l = 0; l < L; l++) if (!dyn[l * n + s0]) push(s0, l, 0, -1); } else push(s0, ((Math.round(o.t0 / DT) % L) + L) % L, 0, -1);
  // A hop takes many steps at once, so where it ends is kept back (`late`, by the step it ends on) and joins the queue
  // when the search gets to that step: the first way found is then the quickest, hops and all.
  const late = [], defer = (k, e) => { (late[k] || (late[k] = [])).push(e); pending++; };
  let pending = 0, upTo = -1, bound = Infinity;                     // (bound: the step a hop already found gets there on; no later hop can better it)
  for (;;) {
    if (head === tail) { if (!pending) break; upTo++; while (!late[upTo]) upTo++; } else upTo = Math.max(upTo, steps[queue[head]]);
    if (late[upTo]) {
      for (const e of late[upTo]) { pending--; if (e.goal) return done(e.from, upTo, e.hop || true); push(e.c, e.l, upTo, e.from, e.hop); }
      late[upTo] = null;
    }
    if (head === tail) continue;
    const id = queue[head++], l = Math.floor(id / n), c = id - l * n, k = steps[id];
    if (goal[c]) return done(id, k);
    const l2 = (l + 1) % L, i = c % nx, free = k < grace;
    for (let m = 0; m < 5; m++) {
      const c2 = m === 0 ? c : m === 1 ? (i + 1 < nx ? c + 1 : -1) : m === 2 ? (i > 0 ? c - 1 : -1) : m === 3 ? c + nx : c - nx;
      if (c2 < 0 || c2 >= n || still[c2]) continue;
      if (!free && (dyn[l2 * n + c2] || dyn[l * n + c2])) continue;
      push(c2, l2, k + 1, id);
    }
    if (tried && none[c] !== 1 && k + 4 < bound) for (let d = 0, any = 0; d < 4; d++) for (let ri = 0; ri < NR; ri++) {
      const h = hopFrom(c, d, ri); if (h) any = 1; else if (d === 3 && ri === NR - 1 && !any) none[c] = 1;      // (most of the floor is nowhere to hop from: found out once)
      if (!h || !hopNow(h, l)) continue;
      const dk = Math.ceil((HOP.runT + h.tEnd) / DT), hop = came ? { x: X(i), z: Z((c - i) / nx), dx: h.dx, dz: h.dz, run: h.run, at: k * DT } : null;
      if (h.goalT >= 0) { defer(k + dk, { goal: true, from: id, hop }); bound = Math.min(bound, k + dk); }
      else for (const q of h.rest) defer(k + dk, { c: q, l: (l + dk) % L, from: id, hop });      // it has come to rest somewhere along the end of the strip
      break;                                                         // (one run that works is enough for this way: a longer one lands in much the same place)
    }
  }
  return -1;
}

// Deal a room its beams and prove them: the pattern for `seed` if a car can get through it, or else
// the next that it can (a few more seeds, then without the turning beam, then gaps only). `door` is
// the doorway the car comes and goes by. Inbound the car may set off whenever it likes; outbound it
// sets off at once from `o.from` (where it took the treasure), with the pattern's clock at nought.
// Returns the set, with `tries` (how many patterns were turned down first), `secs` (how long the
// search's own slow car took) and `recipe` (what lasers() was asked for: twin() deals it again for
// the other kind of toy), or null if the room cannot be done at all. The proof is always the car's;
// with `o.drone` what comes back is the same room with the bars over its hurdles at a drone's height.
export function deal(plan, r, seed, out, door, o = {}) {
  const at = inside(door, r, 0.9);
  for (let k = 0; k < 8; k++) {
    const recipe = { seed: seed + k * 101, out, o: { phase: o.phase, toy: o.toy, still: k >= 3 && k < 6, plain: k >= 6, level: o.level } };
    const set = lasers(plan, r, recipe.seed, out, recipe.o);
    if (!set) return null;
    const way = more => (out ? solve(plan, r, set.beams, o.from || set.plinth, at, { t0: 0, grace: GRACE, reach: 0.6, grab: false, ...more }) : solve(plan, r, set.beams, at, set.plinth, { reach: 0.5, ...more }));
    const secs = way();
    if (secs >= 0 && o.level === 0 && k < 6 && way({ nohop: true }) < 0) continue;      // (a first heist never has to hop: if the gap beside its hurdle is no use, something stands in it, and it is dealt again)
    if (secs >= 0) { const got = o.drone ? lasers(plan, r, recipe.seed, out, { ...recipe.o, drone: true }) : set; got.tries = k; got.secs = secs; got.door = at; got.recipe = recipe; got.drone = !!o.drone; return got; }
  }
  return null;
}
// The same room again for the other kind of toy (somebody has swapped in the middle of a heist): same sides, same
// timing, the bars over each hurdle at that toy's height.
export function twin(plan, r, set, drone) {
  const q = set.recipe, got = lasers(plan, r, q.seed, q.out, { ...q.o, drone });
  got.tries = set.tries; got.secs = set.secs; got.door = set.door; got.recipe = q; got.drone = !!drone;
  return got;
}
