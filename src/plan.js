// The floor plan. Pure data and geometry maths: no three.js in here, so the
// same module lays out the museum, confines the vehicles and steers the bots.
//
// Axes: x runs east, z runs south, y is up. Units are metres. The vehicles are
// true to scale (a 46 cm car), which is the whole point: the rooms are not big,
// you are small.
//
// The rooms and the doorways between them come from src/layout.js, which
// tools/build_layout.mjs generates from where the museum's galleries really
// are. Everything here is built on top of that: collision, the stunt kit, where
// the pictures hang, where the glass cases stand, and the race.

import LAYOUT from './layout.js';

export const T = 1;            // wall thickness
export const HW = 7;           // Griffin Court's half-width
export const SPRING = 9;       // where its vault starts
export const VAULT_R = 7;
export const GRAVITY = 9.8;
export const STEP = 0.09;      // the tallest lip a toy wheel will climb
export const SKY = 46;         // how high a drone may go outdoors

// Wall colours, the deep paint museums use so gilt frames sing.
const TINTS = {
  '2': [0x5e2f2c, 0x2f4638, 0x3a4059, 0x4a5a66, 0x56604f, 0x5c4a58, 0x445a5c, 0x6a5a48, 0x4f3c4d, 0x6b5536],
  '1': [0x6a6456, 0x5a6158, 0x66605c, 0x545a60], '3': [0x8a8880, 0x7c7e84], LL: [0x2a2c33, 0x30292a],
};
const hash = s => { let h = 7; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };

export function buildPlan() {
  const rooms = LAYOUT.rooms.map(r => {
    const pal = TINTS[r.floor] || TINTS['2'];
    return { ...r, want: r.gallery, ceil: r.kind === 'hall' ? 12.4 : r.h - 0.15,
      tint: r.kind === 'hall' ? 0x8c8a84 : r.kind === 'corridor' ? 0x16171c : pal[hash(r.id) % pal.length] };
  });
  const doors = LAYOUT.doors.map((d, i) => ({ id: 'D' + i, ...d, out: d.b === 'out' }));
  const byId = Object.fromEntries(rooms.map(r => [r.id, r]));
  const hall = rooms.find(r => r.kind === 'hall');

  // Walkable volumes indoors: every room, every doorway stretched a little
  // past the wall either side, and the tall middle of the hall under its vault.
  const boxes = rooms.map(r => ({ x0: r.x0, x1: r.x1, z0: r.z0, z1: r.z1, y1: r.ceil }));
  const hx = (hall.x0 + hall.x1) / 2;
  boxes.push({ x0: hx - 4, x1: hx + 4, z0: hall.z0, z1: hall.z1, y1: 14.5 });
  for (const d of doors) {
    const e = 1.6;
    boxes.push(d.along === 'z'
      ? { x0: d.x0, x1: d.x1, z0: d.z0 - e, z1: d.z1 + e, y1: d.h }
      : { x0: d.x0 - e, x1: d.x1 + e, z0: d.z0, z1: d.z1, y1: d.h });
  }
  // Outdoors is everywhere that is not a building. Each room, with its walls, is a solid block from outside.
  const masses = rooms.map(r => ({ x0: r.x0 - T, x1: r.x1 + T, z0: r.z0 - T, z1: r.z1 + T, top: (r.kind === 'hall' ? SPRING + VAULT_R : r.h) + 0.5 + (hash(r.id) % 7) * 0.012, room: r }));
  const xs = rooms.flatMap(r => [r.x0, r.x1]), zs = rooms.flatMap(r => [r.z0, r.z1]), pad = 34;
  const bounds = { x0: Math.min(...xs) - pad, x1: Math.max(...xs) + pad, z0: Math.min(...zs) - pad, z1: Math.max(...zs) + pad };

  const plan = { rooms, doors, byId, boxes, masses, bounds, obstacles: [], hall, made: LAYOUT.made };
  plan.walls = rooms.flatMap(r => wallsOf(plan, r));
  plan.doorsOf = id => doors.filter(d => d.a === id || d.b === id);
  // Where you begin: out on Michigan Avenue in the snow, facing the front door.
  const front = doors.find(d => d.a === 'G214' && d.out) || doors.find(d => d.out);
  plan.front = front;
  plan.spawn = { x: front.x0 - 9, z: (front.z0 + front.z1) / 2, yaw: Math.PI / 2 };
  addStunts(plan);
  return plan;
}

// One entry per wall face: where it is, which way it faces, and the stretches
// of plaster left between its doors.
function wallsOf(plan, r) {
  const out = [];
  const sides = [
    { side: 'n', fixed: r.z0, lo: r.x0, hi: r.x1, nx: 0, nz: 1, rot: 0 },
    { side: 's', fixed: r.z1, lo: r.x0, hi: r.x1, nx: 0, nz: -1, rot: Math.PI },
    { side: 'w', fixed: r.x0, lo: r.z0, hi: r.z1, nx: 1, nz: 0, rot: Math.PI / 2 },
    { side: 'e', fixed: r.x1, lo: r.z0, hi: r.z1, nx: -1, nz: 0, rot: -Math.PI / 2 },
  ];
  for (const s of sides) {
    const horiz = s.side === 'n' || s.side === 's';
    const openings = [];
    for (const d of plan.doors) {
      if (d.a !== r.id && d.b !== r.id) continue;
      if (horiz && d.along === 'z') {
        if ((s.side === 'n' && d.z1 === r.z0) || (s.side === 's' && d.z0 === r.z1)) openings.push({ lo: d.x0, hi: d.x1, h: d.h, door: d });
      } else if (!horiz && d.along === 'x') {
        if ((s.side === 'w' && d.x1 === r.x0) || (s.side === 'e' && d.x0 === r.x1)) openings.push({ lo: d.z0, hi: d.z1, h: d.h, door: d });
      }
    }
    openings.sort((a, b) => a.lo - b.lo);
    const segs = [];
    let u = s.lo;
    for (const o of openings) { if (o.lo - u > 0.01) segs.push({ lo: u, hi: o.lo }); u = o.hi; }
    if (s.hi - u > 0.01) segs.push({ lo: u, hi: s.hi });
    out.push({ ...s, room: r, horiz, openings, segs });
  }
  return out;
}

export function wallPoint(w, u, y, off = 0) {
  return w.horiz
    ? { x: u, y, z: w.fixed + w.nz * off }
    : { x: w.fixed + w.nx * off, y, z: u };
}

export function roomAt(plan, x, z) {
  for (const r of plan.rooms) if (x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1) return r;
  return null;
}

// How high the ceiling is over a point: a room's, a doorway's, or the sky.
export function ceilingAt(plan, x, z) {
  const r = roomAt(plan, x, z);
  if (r) return r.kind === 'hall' ? SPRING + Math.sqrt(Math.max(0, VAULT_R * VAULT_R - (x - (r.x0 + r.x1) / 2) ** 2)) - 0.2 : r.h;
  for (const d of plan.doors) if (x >= d.x0 && x <= d.x1 && z >= d.z0 && z <= d.z1) return d.h;
  return SKY + 20;
}

// Keep a sphere of radius r where it is allowed to be: inside a room or a
// doorway, or outdoors clear of every building. Returns true when it had to
// move the point, and writes the push direction to `out`.
const _o = { x: 0, y: 0, z: 0 };
export function confine(plan, p, r, flying, out, noFurniture) {
  let best = Infinity, bx = p.x, by = p.y, bz = p.z;
  for (const b of plan.boxes) {
    const x0 = b.x0 + r, x1 = b.x1 - r, z0 = b.z0 + r, z1 = b.z1 - r;
    if (x0 > x1 || z0 > z1) continue;
    const cx = p.x < x0 ? x0 : p.x > x1 ? x1 : p.x;
    const cz = p.z < z0 ? z0 : p.z > z1 ? z1 : p.z;
    let cy = p.y;
    if (flying) { const y1 = b.y1 - r; cy = p.y > y1 ? y1 : p.y; }
    const d = (cx - p.x) ** 2 + (cz - p.z) ** 2 + (cy - p.y) ** 2;
    if (d < best) { best = d; bx = cx; by = cy; bz = cz; if (d === 0) break; }
  }
  if (best > 1e-10) {
    // Not indoors. Outdoors, then: push clear of any building it is touching
    // (or, coming down from above, set it on the roof).
    const B = plan.bounds;
    _o.x = Math.max(B.x0 + r, Math.min(B.x1 - r, p.x)); _o.z = Math.max(B.z0 + r, Math.min(B.z1 - r, p.z)); _o.y = Math.min(p.y, SKY);
    let ok = true;
    for (let pass = 0; pass < 3; pass++) {
      let moved = false;
      for (const m of plan.masses) {
        if (_o.x + r <= m.x0 || _o.x - r >= m.x1 || _o.z + r <= m.z0 || _o.z - r >= m.z1) continue;
        if (flying && _o.y - r >= m.top) continue;
        if (flying && _o.y > m.top - 0.7) { _o.y = m.top + r; moved = true; continue; }
        const l = _o.x + r - m.x0, rr = m.x1 - (_o.x - r), n = _o.z + r - m.z0, s = m.z1 - (_o.z - r), k = Math.min(l, rr, n, s);
        if (k === l) _o.x -= l; else if (k === rr) _o.x += rr; else if (k === n) _o.z -= n; else _o.z += s;
        moved = true;
      }
      if (!moved) break;
      if (pass === 2) ok = false;
    }
    const d = (_o.x - p.x) ** 2 + (_o.y - p.y) ** 2 + (_o.z - p.z) ** 2;
    if (ok && d < best) { best = d; bx = _o.x; by = _o.y; bz = _o.z; }
  }
  let hit = best > 1e-10;
  if (hit && out) { out.x = bx - p.x; out.y = by - p.y; out.z = bz - p.z; }
  p.x = bx; p.y = by; p.z = bz;
  // Furniture.
  if (noFurniture) return hit;
  for (const o of plan.obstacles) {
    const top = flying ? p.y + r * 0.5 : p.y + 0.24, bot = flying ? p.y - r * 0.5 : p.y;
    if (bot > o.y1 || top < o.y0) continue;
    const cx = p.x < o.x0 ? o.x0 : p.x > o.x1 ? o.x1 : p.x;
    const cz = p.z < o.z0 ? o.z0 : p.z > o.z1 ? o.z1 : p.z;
    let dx = p.x - cx, dz = p.z - cz;
    const d2 = dx * dx + dz * dz;
    if (d2 >= r * r) continue;
    if (d2 < 1e-9) {
      const l = p.x - o.x0, rr = o.x1 - p.x, n = p.z - o.z0, s = o.z1 - p.z;
      const m = Math.min(l, rr, n, s);
      if (m === l) { dx = -(l + r); dz = 0; } else if (m === rr) { dx = rr + r; dz = 0; }
      else if (m === n) { dx = 0; dz = -(n + r); } else { dx = 0; dz = s + r; }
    } else {
      const d = Math.sqrt(d2), k = (r - d) / d;
      dx *= k; dz *= k;
    }
    p.x += dx; p.z += dz;
    if (out) { out.x = (hit ? out.x : 0) + dx; out.z = (hit ? out.z : 0) + dz; if (!hit) out.y = 0; }
    hit = true;
  }
  return hit;
}

// ------------------------------------------------------------ the stunt kit --
//
// Somebody has been in here before you with plywood and a staple gun. Every
// piece is a rectangle with a height: flat, sloping, eased like toy track, or
// curved like a skate ramp. Solid pieces go down to the floor and stop you like
// a wall from the side; thin ones (table tops, hung track) can be driven under
// and landed on.
//
// Pieces are placed in a room's own frame: `u` runs along the room's longer
// side from its middle, `v` across it. That way one description of a half-pipe
// fits whichever way a real gallery happens to lie.

function frame(r) {
  const lx = r.x1 - r.x0, lz = r.z1 - r.z0;
  return { r, ax: lx >= lz ? 'x' : 'z', cx: (r.x0 + r.x1) / 2, cz: (r.z0 + r.z1) / 2, L: Math.max(lx, lz), W: Math.min(lx, lz) };
}

function addStunts(plan) {
  const S = plan.surfaces = [], L = plan.loops = [], D = plan.decals = [], H = plan.hoops = [], P = plan.props = [];
  plan.puddles = []; plan.benches = []; plan.lions = []; plan.lamps = [];
  const world = (F, u0, u1, v0, v1) => F.ax === 'x' ? [F.cx + u0, F.cx + u1, F.cz + v0, F.cz + v1] : [F.cx + v0, F.cx + v1, F.cz + u0, F.cz + u1];
  const at = (F, u, v) => F.ax === 'x' ? [F.cx + u, F.cz + v] : [F.cx + v, F.cz + u];
  const other = a => (a === 'x' ? 'z' : 'x');
  const push = (skin, rect, axis, h0, h1, o = {}) => { const s = { skin, x0: rect[0], x1: rect[1], z0: rect[2], z1: rect[3], axis, h0, h1, thick: 0, ...o }; S.push(s); return s; };
  const ramp = (F, u0, u1, v0, v1, hA, hB, o, skin = 'ply') => push(skin, world(F, u0, u1, v0, v1), F.ax, hA, hB, o);         // slopes along u
  const rampV = (F, u0, u1, v0, v1, hA, hB, o, skin = 'ply') => push(skin, world(F, u0, u1, v0, v1), other(F.ax), hA, hB, o);  // slopes along v
  const flat = (F, u0, u1, v0, v1, h, o, skin = 'ply') => push(skin, world(F, u0, u1, v0, v1), null, h, h, o);
  const hoop = (F, u, v, y, dir = 'u', r = 0.8) => { const [x, z] = at(F, u, v); H.push({ x, y, z, axis: dir === 'y' ? 'y' : dir === 'u' ? F.ax : other(F.ax), r }); };
  const decal = (F, u0, u1, v0, v1, dir) => { const [x0, x1, z0, z1] = world(F, u0, u1, v0, v1); D.push({ x0, x1, z0, z1, axis: F.ax, dir }); };
  const cone = (F, u, v) => { const [x, z] = at(F, u, v); P.push({ type: 'cone', x, z }); };

  // Would this patch of floor sit in a doorway's path?
  const lanes = r => plan.doorsOf(r.id).map(d => {
    const into = 3.2, w = 0.5;
    if (d.along === 'z') { const south = d.z0 >= r.z1 - 0.01; return { x0: d.x0 - w, x1: d.x1 + w, z0: south ? r.z1 - into : r.z0, z1: south ? r.z1 : r.z0 + into }; }
    const east = d.x0 >= r.x1 - 0.01; return { x0: east ? r.x1 - into : r.x0, x1: east ? r.x1 : r.x0 + into, z0: d.z0 - w, z1: d.z1 + w };
  });
  const hits = (a, b, m = 0) => a[0] < b.x1 + m && a[1] > b.x0 - m && a[2] < b.z1 + m && a[3] > b.z0 - m;
  // The racing line is kept clear of everything except the jumps put on it on purpose.
  const line = plan.line = sampleRoute(buildRoute(plan), 1).pts;
  const onLine = (rect, m) => line.some(p => p.x > rect[0] - m && p.x < rect[1] + m && p.z > rect[2] - m && p.z < rect[3] + m);
  const free = (F, u0, u1, v0, v1, m = 0.3) => {
    if (u0 < -F.L / 2 + 0.2 || u1 > F.L / 2 - 0.2 || v0 < -F.W / 2 - 0.01 || v1 > F.W / 2 + 0.01) return false;
    const rect = world(F, u0, u1, v0, v1);
    if (!F.onLine && onLine(rect, 1.3)) return false;
    return !F.lanes.some(l => hits(rect, l)) && !S.some(s => hits(rect, s, m));
  };

  // ---- the pieces ----
  const tabletop = (F, u, v, h = 0.42, w = 1.8, run = 1.6, top = 0.6) => {
    if (!free(F, u - top - run - 1.2, u + top + run + 1.2, v - w / 2, v + w / 2)) return false;
    ramp(F, u - top - run, u - top, v - w / 2, v + w / 2, 0, h); flat(F, u - top, u + top, v - w / 2, v + w / 2, h); ramp(F, u + top, u + top + run, v - w / 2, v + w / 2, h, 0);
    if (hash(F.r ? F.r.id : 'park') % 3 === 0 || !F.r) hoop(F, u, v, h + 0.62, 'u', 0.75);
    if (!F.r || hash(F.r.id) % 2) { cone(F, u - top - run - 0.5, v - w / 2 - 0.35); cone(F, u + top + run + 0.5, v + w / 2 + 0.35); }
    return true;
  };
  const funbox = (F, u, v, h = 0.5, run = 1.6, top = 0.6) => {
    if (!free(F, u - top - run, u + top + run, v - top - run, v + top + run)) return false;
    flat(F, u - top, u + top, v - top, v + top, h);
    ramp(F, u - top - run, u - top, v - top, v + top, 0, h); ramp(F, u + top, u + top + run, v - top, v + top, h, 0);
    rampV(F, u - top, u + top, v - top - run, v - top, 0, h); rampV(F, u - top, u + top, v + top, v + top + run, h, 0);
    if (hash(F.r.id) % 2) hoop(F, u, v, h + 0.6, 'u', 0.75);
    return true;
  };
  const crates = (F, u, v, dir = 1) => {
    const a = (x) => u + dir * x, lo = (p, q) => Math.min(a(p), a(q)), hi = (p, q) => Math.max(a(p), a(q));
    if (!free(F, lo(-3.6, 2.6), hi(-3.6, 2.6), v - 0.9, v + 0.9)) return false;
    ramp(F, lo(-3.4, -0.6), hi(-3.4, -0.6), v - 0.9, v + 0.9, dir > 0 ? 0 : 0.75, dir > 0 ? 0.75 : 0);
    flat(F, lo(-0.6, 0.7), hi(-0.6, 0.7), v - 0.9, v + 0.9, 0.75, {}, 'crate');
    flat(F, lo(0.7, 1.12), hi(0.7, 1.12), v - 0.9, v + 0.9, 0.5, {}, 'crate'); flat(F, lo(1.12, 1.54), hi(1.12, 1.54), v - 0.9, v + 0.9, 0.25, {}, 'crate');
    hoop(F, a(2.4), v, 0.95, 'u', 0.75);
    return true;
  };
  // Up a ramp, along a table, off a kicker at the far end.
  const tableRun = (F, v, dir = 1) => {
    const a = (x) => dir * x, lo = (p, q) => Math.min(a(p), a(q)), hi = (p, q) => Math.max(a(p), a(q));
    if (!free(F, lo(-5.6, 5.4), hi(-5.6, 5.4), v - 0.6, v + 0.6)) return false;
    ramp(F, lo(-5.2, -2.4), hi(-5.2, -2.4), v - 0.6, v + 0.6, dir > 0 ? 0 : 0.72, dir > 0 ? 0.72 : 0);
    const t = flat(F, lo(-2.4, 3.2), hi(-2.4, 3.2), v - 0.6, v + 0.6, 0.72, { thick: 0.06, perch: 'table' }, 'table');
    plan.obstacles.push({ x0: t.x0, x1: t.x1, z0: t.z0, z1: t.z1, y0: 0.72 - 0.17, y1: 0.72 - 0.08 });      // the apron: low enough that a car cresting the ramp clears it
    for (const lx of [t.x0 + 0.08, t.x1 - 0.08]) for (const lz of [t.z0 + 0.08, t.z1 - 0.08]) plan.obstacles.push({ x0: lx - 0.035, x1: lx + 0.035, z0: lz - 0.035, z1: lz + 0.035, y0: 0, y1: 0.66, leg: true });
    ramp(F, lo(2.1, 3.2), hi(2.1, 3.2), v - 0.45, v + 0.45, dir > 0 ? 0.72 : 0.92, dir > 0 ? 0.92 : 0.72, { thick: 0.2, onTop: 0.72 });
    hoop(F, a(4.5), v, 1.3, 'u', 0.8);
    return true;
  };
  // Skate ramps. An arc of radius R cut off at the lip; a ledge behind the lip
  // to land on. Whatever hangs on the wall above is hung higher to clear it,
  // so the top of your air is right in front of a picture.
  const quarter = (F, u, side, R = 2.6, run = 2.4, deck = 1.0, w = 3.8) => {
    const lipH = R - Math.sqrt(R * R - run * run), wall = side * F.W / 2, a = wall - side * deck, b = a - side * run;
    if (!free(F, u - w / 2, u + w / 2, Math.min(wall, b), Math.max(wall, b), 0.1)) return 0;
    rampV(F, u - w / 2, u + w / 2, Math.min(a, b), Math.max(a, b), side > 0 ? 0 : lipH, side > 0 ? lipH : 0, { curve: R });
    flat(F, u - w / 2, u + w / 2, Math.min(wall, a), Math.max(wall, a), lipH, { perch: 'ledge' });
    hoop(F, u, a - side * 0.25, lipH + 1.5, 'y', 1.05);
    return lipH;
  };
  const halfpipe = (F, u, R, run) => {
    const w = 3.8, deck = 1.0, r2 = run || 2.4;
    if (!free(F, u - w / 2, u + w / 2, -F.W / 2, -F.W / 2 + deck + r2, 0.1) || !free(F, u - w / 2, u + w / 2, F.W / 2 - deck - r2, F.W / 2, 0.1)) return false;
    quarter(F, u, -1, R, r2, deck, w); quarter(F, u, 1, R, r2, deck, w);
    return true;
  };
  const hopHoops = (F, v) => { for (const u of [-F.L / 4, 0, F.L / 4]) hoop(F, u, v, 0.8, 'u', 0.55); return true; };

  // ---- jumps on the racing line, wherever it runs straight across a room ----
  {
    const pts = buildRoute(plan);
    let k = 0;
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length], dx = b.x - a.x, dz = b.z - a.z, d = Math.hypot(dx, dz);
      if (d < 9.5 || (Math.abs(dx) > 0.7 && Math.abs(dz) > 0.7) || a.start || b.start) continue;
      if (k++ % 2) continue;                       // every other straight, so there is somewhere to breathe
      const F = { ax: Math.abs(dx) > Math.abs(dz) ? 'x' : 'z', cx: (a.x + b.x) / 2, cz: (a.z + b.z) / 2, L: d - 2, W: 6, lanes: [], onLine: true, r: null };
      tabletop(F, 0, 0, 0.42, 2.2);
    }
  }

  // ---- Griffin Court: the skyway ----
  // Sixty metres of toy track hung from the glass roof on wires, level with the
  // big pictures: an easy climb, a gap, a kicker, another gap, and a launch
  // towards the window. Every change of slope is a curve, as on the real thing.
  const hall = plan.hall, HF = frame(hall); HF.lanes = lanes(hall);
  {
    const N = hall.z1, lane = [hall.x1 - 3.4, hall.x1 - 2.1];
    // A piece from s0 to s1 metres north of the hall's south wall, at height hA rising (or falling) to hB.
    const sky = (s0, s1, hA, hB, o = {}) => push('track', [lane[0], lane[1], N - s1, N - s0], hA === hB ? null : 'z', hB, hA, { thick: 0.07, hang: true, run: 'z', lip: true, ...o });
    sky(5, 16, 0, 2.6, { ease: true }); sky(16, 22, 2.6, 2.6);
    sky(24.6, 31, 1.9, 1.9); sky(31, 33.6, 1.9, 2.6, { curve: 5.2 });
    sky(36.4, 43, 2.6, 2.6); sky(43, 49, 2.6, 1.4, { ease: true }); sky(49, 51.4, 1.4, 2.05, { curve: 4.8 });
    D.push({ x0: lane[0] + 0.2, x1: lane[1] - 0.2, z0: N - 5, z1: N - 1.5, axis: 'z', dir: -1 });
    const lx = (lane[0] + lane[1]) / 2;
    for (const [s, y, r] of [[23.3, 2.55, 0.8], [35, 2.95, 0.8], [53.8, 2.5, 0.9], [57, 1.7, 0.95]]) H.push({ x: lx, y, z: N - s, axis: 'z', r });
    // Two ledges beside the track to hop across to, and one hung out in the middle of the hall, to look from.
    push('track', [lane[1] + 0.25, hall.x1 - 0.3, N - 21.5, N - 17], null, 2.6, 2.6, { thick: 0.07, hang: true, run: 'z', perch: 'skyway ledge' });
    push('track', [lane[0] - 2.4, lane[0] - 0.25, N - 42.5, N - 37.5], null, 2.6, 2.6, { thick: 0.07, hang: true, run: 'z', perch: 'crow’s nest' });
  }

  // ---- the Grand Staircase (Gallery 200) ----
  // A ramp up, a landing with a kicker on it, and the steps down the far side.
  const g200 = plan.byId.G200;
  if (g200) {
    const F = frame(g200); F.lanes = lanes(g200);
    const LH = 1.5, u0 = -F.L / 2 + 5;
    ramp(F, u0, u0 + 9, -3, 3, 0, LH, { ease: true });
    flat(F, u0 + 9, u0 + 14, -3, 3, LH, { carpet: [-1.3, 1.3], perch: 'staircase landing' }, 'stone');
    for (let k = 0; k < 7; k++) flat(F, u0 + 14 + 0.36 * k, u0 + 14 + 0.36 * (k + 1), -3, 3, LH - 0.1875 * (k + 1), { carpet: [-1.3, 1.3] }, 'stone');
    ramp(F, u0 + 11.9, u0 + 14, -0.9, 0.9, LH, LH + 0.36, { thick: 0.4, onTop: LH });
    hoop(F, u0 + 16.6, 0, 2.15, 'u', 0.9);
    decal(F, u0 - 3.5, u0, -1.2, 1.2, 1);
    // Somebody mopped. The floor here really is slippery, and nothing is fixed down.
    const [px, pz] = at(F, F.L / 2 - 7, 3.5), puddle = { x: px, z: pz, r: 2.2 };
    plan.puddles.push(puddle);
    for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2 + 0.4; P.push({ type: 'cone', x: px + Math.cos(a) * 2.65, z: pz + Math.sin(a) * 2.65 }); }
    P.push({ type: 'sign', x: px - 2.1, z: pz - 2.1, yaw: 0.6 }, { type: 'sign', x: px + 2.3, z: pz + 1.9, yaw: -2.4 });
  }

  // ---- the Thorne passage: jumps between the little lit windows ----
  const C = plan.byId.C;
  if (C) {
    const F = frame(C); F.lanes = lanes(C);
    tabletop(F, -14, 0, 0.4, 1.6); tabletop(F, 10, 0, 0.4, 1.6);
    for (const u of [-25, -22, 22, 25]) { ramp(F, u - 0.8, u, -0.8, 0.8, 0, 0.2); ramp(F, u, u + 0.8, -0.8, 0.8, 0.2, 0); }
  }

  // ---- every other gallery gets something, chosen by its size and its doors ----
  const pipes = new Set(['G211', 'G240', 'G222', 'G218', 'G231_233', 'G239', 'G152', 'G216', 'G273']);
  for (const r of plan.rooms) {
    if (r.kind !== 'gallery' || r === g200) continue;
    const F = frame(r); F.lanes = lanes(r);
    const k = hash(r.id), tall = r.h >= 7;
    let placed = 0;
    if (tall && F.W >= 12.5 && pipes.has(r.id)) for (const u of [0, F.L / 4, -F.L / 4, F.L / 3, -F.L / 3]) if (halfpipe(F, u, F.W >= 15 ? 3.2 : 2.6, F.W >= 15 ? 3.0 : 2.4)) { placed++; break; }
    const tries = [
      () => F.L >= 12.5 && F.W >= 9 && (tableRun(F, F.W / 2 - 3.4, k % 2 ? 1 : -1) || tableRun(F, -F.W / 2 + 3.4, k % 2 ? -1 : 1)),
      () => F.L >= 9.5 && (tabletop(F, F.L / 5, 0) || tabletop(F, -F.L / 5, 0) || tabletop(F, 0, F.W / 4) || tabletop(F, 0, -F.W / 4)),
      () => F.L >= 9 && F.W >= 9 && (funbox(F, -F.L / 5, F.W / 6) || funbox(F, F.L / 5, -F.W / 6) || funbox(F, 0, 0)),
      () => F.L >= 11 && (crates(F, 0, -F.W / 5, k % 2 ? 1 : -1) || crates(F, 0, F.W / 5, k % 2 ? 1 : -1)),
      () => tall && F.W >= 11 && !pipes.has(r.id) && (quarter(F, F.L / 4, 1) || quarter(F, -F.L / 4, -1)) > 0,
    ];
    // The sculpture floors keep more of their floor for glass cases.
    const cases = r.floor === '1' || r.floor === 'LL';
    const want = (F.L * F.W >= 300 ? 3 : F.L * F.W >= 150 ? 2 : F.L * F.W >= 70 ? 1 : 0) - (cases ? 1 : 0);
    for (let i = 0; i < tries.length && placed < want; i++) if (tries[(i + k) % tries.length]()) placed++;
    if (k % 7 === 0 && F.L >= 9 && F.W >= 6) hopHoops(F, (k % 2 ? 1 : -1) * Math.min(1.6, F.W / 4));
    // A bench in the middle, if the middle is still free.
    if (F.W >= 7.5 && free(F, -0.5, 0.5, -1.5, 1.5, 0.5)) {
      const [bx, bz] = at(F, 0, 0), alongX = F.ax === 'z';
      plan.benches.push({ x: bx, z: bz, alongX });
      const hxx = alongX ? 1.4 : 0.38, hzz = alongX ? 0.38 : 1.4;
      S.push({ skin: 'bench', x0: bx - hxx, x1: bx + hxx, z0: bz - hzz, z1: bz + hzz, axis: null, h0: 0.5, h1: 0.5, thick: 0.1 });
    }
  }

  // ---- outside ----
  // On the open ground south of the bridge: the loop, a big curved launcher, a
  // line of jumps. Snow is slippery; the track laid on it is not.
  const clearOutside = (x0, x1, z0, z1) => plan.masses.every(m => x1 < m.x0 - 1 || x0 > m.x1 + 1 || z1 < m.z0 - 1 || z0 > m.z1 + 1);
  let park = null;
  // The nearest clear rectangle to the middle of the grounds.
  const B = plan.bounds, mx = (B.x0 + B.x1) / 2, mz = (B.z0 + B.z1) / 2;
  let bestD = Infinity;
  for (let z = B.z0 + 30; z <= B.z1 - 50; z += 2) for (let x = B.x0 + 30; x <= B.x1 - 74; x += 2) {
    const d = Math.hypot(x + 22 - mx, z + 10 - mz);
    if (d < bestD && clearOutside(x - 2, x + 46, z - 2, z + 22)) { bestD = d; park = { x, z }; }
  }
  plan.park = park;
  if (park) {
    const F = { ax: 'x', cx: park.x + 22, cz: park.z + 10, L: 44, W: 20, lanes: [] };
    L.push({ x: F.cx, z: F.cz - 5, dir: 1, r: 1.15, shift: 0.62, w: 0.56 });
    decal(F, -13, 0, -5.28, -4.72, 1); decal(F, 0, 11, -4.66, -4.1, -1);
    for (const dx of [-1.45, 1.45]) for (const dz of [-0.55, 1.15]) plan.obstacles.push({ x0: F.cx + dx - 0.04, x1: F.cx + dx + 0.04, z0: F.cz - 5 + dz - 0.04, z1: F.cz - 5 + dz + 0.04, y0: 0, y1: 2.5, post: true });
    // The big one.
    ramp(F, -6, -3, 0.9, 3.1, 0, 3.4 - Math.sqrt(3.4 * 3.4 - 9), { curve: 3.4 });
    decal(F, -14, -6, 1.25, 2.75, 1);
    hoop(F, 0.2, 2, 4.3, 'u', 1.15);
    tabletop(F, -12, 6.5, 0.45, 2); tabletop(F, 2, 6.5, 0.45, 2); tabletop(F, 14, 6.5, 0.45, 2);
    for (const u of [-18, -9, 9, 18]) { cone(F, u, -1.5); cone(F, u, 9.2); }
    P.push({ type: 'sign', x: F.cx - 19, z: F.cz - 5, yaw: 1.2 });
  }
  // The lions either side of the Michigan Avenue door, and a lamp by every way in.
  const f = plan.front, fz = (f.z0 + f.z1) / 2;
  for (const s of [-1, 1]) {
    const lion = { x: f.x0 - 3.2, z: fz + s * 4.4, yaw: Math.PI / 2 };
    plan.lions.push(lion);
    plan.obstacles.push({ x0: lion.x - 1.5, x1: lion.x + 1.5, z0: lion.z - 0.75, z1: lion.z + 0.75, y0: 0, y1: 3 });
  }
  for (const d of plan.doors) if (d.out) {
    const r = plan.byId[d.a], cx = (d.x0 + d.x1) / 2, cz = (d.z0 + d.z1) / 2;
    const ox = d.along === 'x' ? (d.x0 < r.x0 ? -1 : 1) : 0, oz = d.along === 'z' ? (d.z0 < r.z0 ? -1 : 1) : 0;
    for (const s of [-1, 1]) plan.lamps.push({ x: cx + ox * 2.2 + (oz ? s * 2.6 : 0), z: cz + oz * 2.2 + (ox ? s * 2.6 : 0) });
  }
}

export function heightOf(s, x, z) {
  if (!s.axis) return s.h0;
  const t = s.axis === 'x' ? (x - s.x0) / (s.x1 - s.x0) : (z - s.z0) / (s.z1 - s.z0);
  if (s.curve) {
    // A skate ramp: an arc of a circle, flat where you roll in, steep at the lip.
    const run = s.axis === 'x' ? s.x1 - s.x0 : s.z1 - s.z0;
    const d = Math.max(0, Math.min(run, (s.h1 > s.h0 ? t : 1 - t) * run));
    return Math.min(s.h0, s.h1) + s.curve - Math.sqrt(s.curve * s.curve - d * d);
  }
  // Toy track: flat at both ends of the slope, so it meets the next piece without a corner.
  if (s.ease) { const c = Math.max(0, Math.min(1, t)); return s.h0 + (s.h1 - s.h0) * c * c * (3 - 2 * c); }
  return s.h0 + (s.h1 - s.h0) * t;
}

// The highest thing under (x, z) that something at height y could be standing on.
// `sticky` is the piece already under the wheels: it stays underfoot however steeply it climbs.
export function groundAt(plan, x, z, y, step = STEP, sticky = null) {
  let g = 0, under = null;
  for (const s of plan.surfaces) {
    if (x < s.x0 || x > s.x1 || z < s.z0 || z > s.z1) continue;
    const h = heightOf(s, x, z);
    if ((h <= y + step || (s === sticky && h <= y + 1.6)) && h > g) { g = h; under = s; }
  }
  plan.under = under;          // which piece that was, for whoever just asked
  return g;
}

// Is there a solid piece here standing taller than something at height y can climb?
export function wallAt(plan, x, z, y, step = STEP, ignore = null) {
  for (const s of plan.surfaces) {
    if (s === ignore) continue;
    if (x < s.x0 || x > s.x1 || z < s.z0 || z > s.z1) continue;
    const h = heightOf(s, x, z);
    if (h <= y + step) continue;
    if (!s.thick || h - s.thick < y + 0.24) return true;
  }
  return false;
}

// ---------------------------------------------------------------- the hang --

const cm = v => (typeof v === 'number' && v > 0 ? v / 100 : 0);

// Real size on the wall, in metres, from the museum's own measurements.
export function realSize(work, maxH, maxW) {
  const aspect = work.iw && work.ih ? work.iw / work.ih : 0.8;
  let w = cm(work.w), h = cm(work.h);
  if (h && w) {
    // Trust the picture's proportions over a measurement that disagrees
    // (a polyptych measured panel by panel, a sheet measured with its mount).
    if (Math.abs(w / h - aspect) / aspect > 0.2) w = h * aspect;
  } else if (h) w = h * aspect;
  else if (w) h = w / aspect;
  else { h = 0.9; w = h * aspect; }
  const small = Math.max(w, h);
  if (small < 0.5) { const k = 0.5 / small; w *= k; h *= k; }
  const k = Math.min(1, maxH / h, maxW / w);
  return { w: w * k, h: h * k };
}

// A picture never hangs behind a ramp. If part of the stunt kit stands against
// the wall here, this is how high the bottom of a frame must be to clear it.
function clearance(plan, wall, u0, u1) {
  const depth = 2.5, r = wall.room;
  const zone = wall.horiz
    ? { x0: u0 - 0.3, x1: u1 + 0.3, z0: wall.nz > 0 ? r.z0 : r.z1 - depth, z1: wall.nz > 0 ? r.z0 + depth : r.z1 }
    : { x0: wall.nx > 0 ? r.x0 : r.x1 - depth, x1: wall.nx > 0 ? r.x0 + depth : r.x1, z0: u0 - 0.3, z1: u1 + 0.3 };
  let need = 0;
  for (const s of plan.surfaces) {
    if (s.skin === 'bench' || s.x1 <= zone.x0 || s.x0 >= zone.x1 || s.z1 <= zone.z0 || s.z0 >= zone.z1) continue;
    const top = Math.max(s.h0, s.h1);
    if (s.thick && top - s.thick > 1.9) continue;        // track hung well overhead hides nothing
    need = Math.max(need, top + 0.5);
  }
  return need;
}

// Fill one stretch of wall with as many works from the queue as it will hold,
// the most important in the middle.
function fillSegment(plan, wall, seg, queue, opts) {
  const len = seg.hi - seg.lo;
  const margin = opts.margin, gap = opts.gap;
  const picked = [];
  let used = 0;
  for (let i = 0; i < queue.length && picked.length < opts.maxPer;) {
    const wk = queue[i];
    const frame = opts.frame(wk);
    const full = wk._size.w + frame * 2;
    const need = used + full + (picked.length ? gap : 0);
    if (need <= len - margin * 2) {
      picked.push({ wk, frame, full });
      used = need;
      queue.splice(i, 1);
    } else if (picked.length === 0 && i < 6) i++;   // too wide for this stretch: try the next
    else break;
  }
  if (!picked.length) return [];
  // Centre-out: 0 in the middle, then alternate sides.
  const order = [];
  picked.forEach((p, i) => (i % 2 ? order.unshift(p) : order.push(p)));
  const slack = len - used;
  const pad = slack / (order.length + 1);
  let u = seg.lo;
  const placed = [];
  for (const p of order) {
    u += pad + p.full / 2;
    const { w, h } = p.wk._size;
    const lift = clearance(plan, wall, u - p.full / 2, u + p.full / 2);
    const cy = Math.max(opts.centre(h), lift + p.frame + h / 2);
    if (cy + h / 2 + p.frame <= wall.room.h - 0.3) {
      const pos = wallPoint(wall, u, cy, 0.04);
      placed.push({ work: p.wk, room: wall.room.id, x: pos.x, y: pos.y, z: pos.z, rot: wall.rot, nx: wall.nx, nz: wall.nz, w, h, frame: p.frame, kind: opts.kind, high: lift > 0 });
    } else if (!p.wk._bumped) { p.wk._bumped = true; queue.push(p.wk); }       // no room above the ramp: try another wall
    u += p.full / 2;
  }
  return placed;
}

export function hang(plan, collection) {
  const placements = [];
  const frameFor = wk => Math.min(0.2, Math.max(0.055, 0.05 + 0.04 * Math.sqrt(wk._size.w * wk._size.h)));
  // Griffin Court is hung last, with the biggest canvases that found no wall in their own rooms.
  const spill = [];
  for (const r of [...plan.rooms].sort((a, b) => (a.kind === 'hall') - (b.kind === 'hall'))) {
    const walls = plan.walls.filter(w => w.room === r && w.side !== r.glass);
    const set = r.kind === 'hall' ? { wall: spill.filter(w => w.k === 'Painting').sort((a, b) => b._size.w * b._size.h - a._size.w * a._size.h) } : collection.rooms[r.id] || { wall: [] };
    if (r.kind === 'corridor') {
      // The Thorne Miniature Rooms: little lit windows down both sides of a dark passage.
      const queue = set.wall.map(w => {
        const aspect = w.iw && w.ih ? w.iw / w.ih : 1.5;
        const h = 0.62, wd = Math.min(1.25, Math.max(0.6, h * aspect));
        return { ...w, _size: { w: wd, h: wd / aspect } };
      });
      for (const wall of walls) for (const seg of wall.segs) {
        if (seg.hi - seg.lo < 3) continue;
        const n = Math.floor((seg.hi - seg.lo - 1.2) / 1.95);
        for (let k = 0; k < n && queue.length; k++) {
          const wk = queue.shift();
          const u = seg.lo + (seg.hi - seg.lo) * (k + 0.5) / n;
          const pos = wallPoint(wall, u, 0.95, 0.04);    // low enough for a toy car to look in
          placements.push({ work: wk, room: r.id, x: pos.x, y: pos.y, z: pos.z, rot: wall.rot, nx: wall.nx, nz: wall.nz, w: wk._size.w, h: wk._size.h, frame: 0.05, kind: 'miniature' });
        }
      }
      continue;
    }
    const isHall = r.kind === 'hall';
    const segs = walls.flatMap(wall => wall.segs.map(seg => ({ wall, seg, len: seg.hi - seg.lo }))).filter(s => s.len >= 2.2).sort((a, b) => b.len - a.len);
    if (!segs.length) continue;
    const queue = set.wall.map(w => ({ ...w, _size: realSize(w, isHall ? 5.6 : r.h - 2.4, Math.min(isHall ? 9 : 12, segs[0].len - 2)) }));
    for (const { wall, seg } of segs) {
      placements.push(...fillSegment(plan, wall, seg, queue, isHall
        ? { margin: 1.4, gap: 1.6, maxPer: 3, frame: frameFor, kind: 'painting', centre: h => 1.5 + h / 2 }
        : { margin: 0.9, gap: 1.0, maxPer: 4, frame: frameFor, kind: 'painting', centre: h => Math.max(1.62, 0.8 + h / 2) }));
    }
    if (!isHall) spill.push(...queue);
  }
  placements.push(...stand(plan, collection));
  return placements;
}

// Sculpture, armour and vessels stand on plinths in glass cases, out on the
// floor, clear of the doorways, the stunt kit and each other.
function stand(plan, collection) {
  const out = [];
  let total = 0;
  for (const r of plan.rooms) {
    const set = collection.rooms[r.id];
    if (!set || !set.objects || !set.objects.length || r.kind !== 'gallery') continue;
    const lanes = plan.doorsOf(r.id).map(d => d.along === 'z' ? { x0: d.x0 - 0.3, x1: d.x1 + 0.3, z0: r.z0, z1: r.z1 } : { x0: r.x0, x1: r.x1, z0: d.z0 - 0.3, z1: d.z1 + 0.3 });
    const area = (r.x1 - r.x0) * (r.z1 - r.z0), max = Math.min(set.objects.length, area > 450 ? 12 : area > 200 ? 7 : area > 90 ? 4 : 2);
    const spots = [];
    const cx = (r.x0 + r.x1) / 2, cz = (r.z0 + r.z1) / 2;
    for (let x = r.x0 + 2; x <= r.x1 - 2; x += 2.5) for (let z = r.z0 + 2; z <= r.z1 - 2; z += 2.5) {
      const box = [x - 0.8, x + 0.8, z - 0.8, z + 0.8];
      const hit = b => box[0] < b.x1 && box[1] > b.x0 && box[2] < b.z1 && box[3] > b.z0;
      if (plan.line.some(p => Math.abs(p.x - x) < 1.7 && Math.abs(p.z - z) < 1.7) || lanes.some(hit) || plan.surfaces.some(s => hit({ x0: s.x0 - 0.9, x1: s.x1 + 0.9, z0: s.z0 - 0.9, z1: s.z1 + 0.9 })) || plan.puddles.some(p => Math.hypot(p.x - x, p.z - z) < p.r + 1.5)) continue;
      spots.push({ x, z, d: Math.hypot(x - cx, z - cz) + ((x * 7 + z * 13) % 3) });
    }
    spots.sort((a, b) => a.d - b.d);
    for (let i = 0; i < Math.min(max, spots.length) && total < 170; i++, total++) {
      const wk = set.objects[i], s = spots[i];
      const aspect = wk.iw && wk.ih ? wk.iw / wk.ih : 0.7;
      let h = wk.h > 0 ? wk.h / 100 : 0.6;
      h = Math.max(0.28, Math.min(2.3, h));
      let w = h * aspect;
      if (w > 1.5) { w = 1.5; h = w / aspect; }
      const plinth = h > 1.4 ? 0.22 : h > 0.7 ? 0.42 : 0.62, half = Math.max(0.32, Math.min(0.85, w / 2 + 0.14));
      plan.obstacles.push({ x0: s.x - half, x1: s.x + half, z0: s.z - half, z1: s.z + half, y0: 0, y1: plinth + h + 0.2, case: true });
      out.push({ work: wk, room: r.id, x: s.x, y: plinth + h / 2 + 0.02, z: s.z, rot: 0, nx: 0, nz: 1, w, h, frame: 0, kind: 'object', plinth, half });
    }
  }
  return out;
}

// ------------------------------------------------------------- the circuit --

// The race is run round the real ring of European painting galleries that
// circles the Grand Staircase on the second floor. The route goes through the
// middle of each doorway on the way round.
const RING = ['G201', 'G226', 'G225', 'G223', 'G222', 'G221', 'G220', 'G219', 'G218', 'G217', 'G216', 'G215', 'G213', 'G212', 'G211', 'G209', 'G208', 'G207', 'G206', 'G205', 'G204', 'G202'];

export function buildRoute(plan) {
  const nb = id => plan.doorsOf(id).filter(d => !d.out).map(d => [d.a === id ? d.b : d.a, d]);
  // Shortest way through doors from one room to the next on the list.
  const path = (from, to, avoid) => {
    const prev = new Map([[from, null]]), q = [from];
    while (q.length) {
      const id = q.shift();
      if (id === to) break;
      for (const [n, d] of nb(id)) if (!prev.has(n) && (n === to || !avoid.has(n))) { prev.set(n, [id, d]); q.push(n); }
    }
    const out = [];
    for (let id = to; prev.get(id); id = prev.get(id)[0]) out.unshift({ room: id, door: prev.get(id)[1] });
    return prev.has(to) ? out : null;
  };
  const ring = RING.filter(id => plan.byId[id]), steps = [], used = new Set(ring);
  for (let i = 0; i < ring.length; i++) {
    const leg = path(ring[i], ring[(i + 1) % ring.length], used) || path(ring[i], ring[(i + 1) % ring.length], new Set());
    if (leg) steps.push(...leg);
  }
  const pts = [];
  steps.forEach((s, i) => {
    const d = s.door, r = plan.byId[s.room];
    pts.push({ x: (d.x0 + d.x1) / 2, z: (d.z0 + d.z1) / 2, y: Math.min(2.2, d.h - 1.3), gate: (d.along === 'z' ? d.x1 - d.x0 : d.z1 - d.z0) / 2, room: s.room });
    // A point in the middle of a big room keeps the line off the walls on a long diagonal.
    const next = steps[(i + 1) % steps.length].door, nx = (next.x0 + next.x1) / 2, nz = (next.z0 + next.z1) / 2;
    if (Math.hypot(nx - (d.x0 + d.x1) / 2, nz - (d.z0 + d.z1) / 2) > 9) {
      const mx = ((d.x0 + d.x1) / 2 + nx) / 2, mz = ((d.z0 + d.z1) / 2 + nz) / 2, cx = (r.x0 + r.x1) / 2, cz = (r.z0 + r.z1) / 2;
      pts.push({ x: mx * 0.7 + cx * 0.3, z: mz * 0.7 + cz * 0.3, y: 2.2, mid: true, room: s.room });
    }
  });
  // Start and finish on the longest clear stretch.
  let best = pts.findIndex(p => p.mid);
  if (best < 0) best = 0;
  pts[best].gate = 2.4; pts[best].start = true; pts[best].y = 3;
  return [...pts.slice(best), ...pts.slice(0, best)];
}

// Closed Catmull-Rom through the route, resampled to even spacing so bots and
// the minimap can walk it by distance.
export function sampleRoute(pts, step = 0.5) {
  const n = pts.length;
  const cr = (a, b, c, d, t) => 0.5 * ((2 * b) + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t * t * t);
  const dense = [];
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i + n - 1) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    const segLen = Math.hypot(p2.x - p1.x, p2.z - p1.z);
    const k = Math.max(2, Math.ceil(segLen / 0.25));
    for (let j = 0; j < k; j++) {
      const t = j / k;
      dense.push({ x: cr(p0.x, p1.x, p2.x, p3.x, t), y: cr(p0.y, p1.y, p2.y, p3.y, t), z: cr(p0.z, p1.z, p2.z, p3.z, t), src: i, t });
    }
  }
  const out = [];
  const gateS = new Array(n).fill(0);
  let acc = 0, next = 0;
  for (let i = 0; i < dense.length; i++) {
    const a = dense[i], b = dense[(i + 1) % dense.length];
    if (a.t === 0) gateS[a.src] = acc;
    const seg = Math.hypot(b.x - a.x, b.z - a.z, b.y - a.y);
    while (next <= acc + seg) {
      const t = seg ? (next - acc) / seg : 0;
      out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t });
      next += step;
    }
    acc += seg;
  }
  // Tangents and a curvature-limited speed factor.
  const m = out.length;
  for (let i = 0; i < m; i++) {
    const a = out[(i + m - 2) % m], b = out[(i + 2) % m];
    const dx = b.x - a.x, dz = b.z - a.z, l = Math.hypot(dx, dz) || 1;
    out[i].tx = dx / l; out[i].tz = dz / l;
  }
  for (let i = 0; i < m; i++) {
    const a = out[(i + m - 3) % m], b = out[(i + 3) % m];
    const turn = Math.abs(a.tx * b.tz - a.tz * b.tx);
    out[i].k = turn / (6 * step);
  }
  return { pts: out, step, length: acc, gateS };
}
