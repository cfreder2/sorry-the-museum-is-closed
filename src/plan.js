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
  // The museum is closed, and every outside door is locked. But a ventilation grille has come
  // loose low on the Michigan Avenue wall, just big enough for a toy car...
  // The Michigan Avenue front is one long wall of limestone standing a little way in front of the
  // rooms behind it, with the entrance pavilion stepping forward in the middle.
  const west = rooms.filter(r => r.building === 'main' && r.x0 < 30);
  const FX = Math.min(...west.map(r => r.x0 - T)) - 0.5, PX = FX - 2;
  const lobby = byId.G215;
  const front = (lobby && doors.find(d => d.a === 'G215' && d.out && d.along === 'x' && d.x1 <= lobby.x0 + 0.01)) || doors.find(d => d.out);
  if (front.a === 'G215') front.x0 = PX;                 // the way in runs right through the pavilion
  const fz = (front.z0 + front.z1) / 2;
  // The museum is closed and every outside door is locked, but nobody has to hunt for the way in.
  // For a car: a hole knocked through the foot of the wall right beside the front doors, lit from
  // inside. For a drone: the fanlight over the same doors, left open.
  let vent = null, transom = null;
  if (front.a === 'G215') {
    vent = { id: 'vent', a: 'G215', b: 'out', along: 'x', x0: PX, x1: lobby.x0, z0: fz - 4.4, z1: fz - 3.2, h: 0.75, out: true, vent: true };
    doors.push(vent);
    transom = { x0: PX, x1: lobby.x0, z0: fz - 1.3, z1: fz + 1.3, y0: front.h + 0.36, y1: front.h + 1.5 };
  }
  // ...and somebody has left a pane of the big skylight over the Grand Staircase propped open.
  const sr = byId.G200;
  const skylight = sr ? { room: sr.id, x0: (sr.x0 + sr.x1) / 2 - 1.3, x1: (sr.x0 + sr.x1) / 2 + 1.3, z0: sr.z1 - 14.2, z1: sr.z1 - 11.6, y: sr.h } : null;
  // Two more skylights have been left open, further in: one over the bridge, one over the old first floor.
  const skylights = skylight ? [skylight] : [];
  for (const id of ['G240', 'G151']) { const r = byId[id]; if (r) skylights.push({ room: id, x0: (r.x0 + r.x1) / 2 - 1.3, x1: (r.x0 + r.x1) / 2 + 1.3, z0: (r.z0 + r.z1) / 2 - 1.3, z1: (r.z0 + r.z1) / 2 + 1.3, y: r.h }); }
  // And for a car there are other ways in, for anyone who goes looking: low openings through an
  // outside wall, each a different kind of thing left open.
  const holes = [];
  const solid = (x, z) => rooms.some(r => x > r.x0 - T && x < r.x1 + T && z > r.z0 - T && z < r.z1 + T);
  const pierce = (id, side, kind, w = 1.2, h = 0.6) => {
    const r = byId[id];
    if (!r) return;
    const horiz = side === 'n' || side === 's', lo = horiz ? r.x0 : r.z0, hi = horiz ? r.x1 : r.z1;
    for (const t of [0.5, 0.32, 0.68, 0.2, 0.8]) {
      const u = lo + (hi - lo) * t, ox = side === 'w' ? r.x0 - T - 2 : side === 'e' ? r.x1 + T + 2 : u, oz = side === 'n' ? r.z0 - T - 2 : side === 's' ? r.z1 + T + 2 : u;
      if (solid(ox, oz) || solid(ox + (horiz ? 1.5 : 0), oz + (horiz ? 0 : 1.5)) || solid(ox - (horiz ? 1.5 : 0), oz - (horiz ? 0 : 1.5))) continue;
      if (doors.some(d => (d.a === id || d.b === id) && (horiz ? d.along === 'z' && Math.abs((d.x0 + d.x1) / 2 - u) < 3.5 : d.along === 'x' && Math.abs((d.z0 + d.z1) / 2 - u) < 3.5))) continue;
      const d = horiz ? { along: 'z', x0: u - w / 2, x1: u + w / 2, z0: side === 'n' ? r.z0 - T : r.z1, z1: side === 'n' ? r.z0 : r.z1 + T } : { along: 'x', z0: u - w / 2, z1: u + w / 2, x0: side === 'w' ? r.x0 - T : r.x1, x1: side === 'w' ? r.x0 : r.x1 + T };
      Object.assign(d, { id: 'hole' + holes.length, a: id, b: 'out', h, out: true, vent: true, kind, side });
      doors.push(d); holes.push(d);
      return;
    }
  };
  pierce('GStock_Exchange', 'e', 'dock', 2.2, 0.7);     // a delivery shutter not quite pulled down, on the path to the skate park
  pierce('G184', 's', 'duct', 1.1, 0.6);                // another duct, in the courtyard
  pierce('G238', 'e', 'flap', 0.8, 0.45);               // a service door onto the railway with its bottom panel kicked in
  pierce('G239', 'w', 'window', 1.0, 0.5);              // a cellar window propped open, by the South Garden
  pierce('G59', 'w', 'window', 1.0, 0.5);
  const hall = rooms.find(r => r.kind === 'hall');

  // Walkable volumes indoors: every room, every doorway stretched a little
  // past the wall either side, and the tall middle of the hall under its vault.
  const boxes = rooms.map(r => ({ x0: r.x0, x1: r.x1, z0: r.z0, z1: r.z1, y1: r.ceil }));
  const hx = (hall.x0 + hall.x1) / 2;
  boxes.push({ x0: hx - 4, x1: hx + 4, z0: hall.z0, z1: hall.z1, y1: 14.5 });
  for (const k of skylights) boxes.push({ x0: k.x0, x1: k.x1, z0: k.z0, z1: k.z1, y1: SKY });     // straight up and out
  if (transom) boxes.push({ x0: transom.x0 - 1.6, x1: transom.x1 + 1.6, z0: transom.z0, z1: transom.z1, y0: transom.y0, y1: transom.y1 });   // above the door: for things that fly
  for (const d of doors) {
    const e = 1.6;
    boxes.push(d.along === 'z'
      ? { x0: d.x0, x1: d.x1, z0: d.z0 - e, z1: d.z1 + e, y1: d.h, lock: d.out && !d.vent }
      : { x0: d.x0 - e, x1: d.x1 + e, z0: d.z0, z1: d.z1, y1: d.h, lock: d.out && !d.vent });
  }
  // Outdoors is everywhere that is not a building. Each room, with its walls, is a solid block from outside.
  const masses = rooms.map(r => ({ x0: r.x0 - T, x1: r.x1 + T, z0: r.z0 - T, z1: r.z1 + T, top: (r.kind === 'hall' ? SPRING + VAULT_R : r.h) + 0.5 + (hash(r.id) % 7) * 0.012, room: r }));
  // The front wall itself, and the solid between it and the rooms.
  const WING = 9.6, PAV = 12.6;
  const cuts = [...new Set(west.flatMap(r => [r.z0 - T, r.z1 + T]))].sort((a, b) => a - b);
  for (let i = 0; i < cuts.length - 1; i++) {
    const a = cuts[i], b = cuts[i + 1], mid = (a + b) / 2;
    if (b - a < 0.01) continue;
    const behind = Math.min(...rooms.filter(r => r.x0 < 60 && r.z0 - T <= mid && r.z1 + T >= mid).map(r => r.x0 - T));
    masses.push({ x0: FX, x1: behind, z0: a, z1: b, top: WING, facade: true });
  }
  masses.push({ x0: PX, x1: FX, z0: fz - 13, z1: fz + 13, top: PAV, facade: true, pavilion: true });
  const facade = { FX, PX, z0: cuts[0], z1: cuts[cuts.length - 1], cz: fz, half: 13, wing: WING, pav: PAV };
  // The city block: Michigan Avenue to the west, Monroe to the north, Columbus to the east, Jackson to the south.
  const xs = rooms.flatMap(r => [r.x0, r.x1]), zs = rooms.flatMap(r => [r.z0, r.z1]);
  const bounds = { x0: -28, x1: Math.max(298, Math.max(...xs) + 12), z0: Math.min(-42, Math.min(...zs) - 12), z1: Math.max(262, Math.max(...zs) + 8) };

  const plan = { rooms, doors, byId, boxes, masses, bounds, obstacles: [], hall, made: LAYOUT.made, vent, transom, skylight, skylights, holes, locked: true, facade };
  plan.walls = rooms.flatMap(r => wallsOf(plan, r));
  plan.doorsOf = id => doors.filter(d => d.a === id || d.b === id);
  // Where you begin: out on Michigan Avenue in the snow, facing the front door.
  plan.front = front;
  plan.spawn = { x: PX - 6.5, z: fz, yaw: Math.PI / 2 };
  addGrounds(plan);
  addStunts(plan);
  addLand(plan);
  // The roof of Gallery 211, at the top of the scaffold, is kept clear: there is a card game up there.
  { const tm = masses.find(m => m.room && m.room.id === 'G211'); if (tm) plan.terrace = { room: 'G211', x: (tm.x0 + tm.x1) / 2 + 0.6, z: (tm.z0 + tm.z1) / 2, top: tm.top }; }
  addRoofs(plan);
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

// Is this point on top of a building rather than in it?
export function onRoof(plan, x, z, y) {
  if (y < 2.5) return false;
  for (const m of plan.masses) if (x > m.x0 && x < m.x1 && z > m.z0 && z < m.z1 && y >= m.top - 0.4) return m;
  return false;
}

// How high the ceiling is over a point: a room's, a doorway's, or the sky.
export function ceilingAt(plan, x, z, y) {
  if (y != null && onRoof(plan, x, z, y)) return SKY + 20;
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
  // Up on a roof, a car is outdoors: the rooms below are nothing to do with it.
  const up = !flying && p.y > 2.5 && onRoof(plan, p.x, p.z, p.y);
  if (!up) for (const b of plan.boxes) {
    if (b.lock && plan.locked) continue;              // a locked door is a wall
    if (b.y0 && !flying) continue;                    // a way through up in the air is no use to a car
    const x0 = b.x0 + r, x1 = b.x1 - r, z0 = b.z0 + r, z1 = b.z1 - r;
    if (x0 > x1 || z0 > z1) continue;
    const cx = p.x < x0 ? x0 : p.x > x1 ? x1 : p.x;
    const cz = p.z < z0 ? z0 : p.z > z1 ? z1 : p.z;
    let cy = p.y;
    if (flying) { const y1 = b.y1 - r; cy = p.y > y1 ? y1 : p.y; if (b.y0 && cy < b.y0 + r) cy = b.y0 + r; }
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
        if (up && _o.y >= m.top - 0.4) continue;                   // a roof no higher than this one is floor, not wall
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
    if (o.kit && plan.racing) continue;
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

// ------------------------------------------------------------- the grounds --
//
// What stands round the building, placed from the map: Michigan Avenue and the other three streets
// of the block, the railway in its cutting, the North Garden and the South Garden with its pool and
// the Fountain of the Great Lakes. Positions come from OpenStreetMap, in the same frame as the rooms.

function addGrounds(plan) {
  const F = plan.facade, B = plan.bounds, O = plan.obstacles;
  const inMass = (x, z, m = 1.2) => plan.masses.some(q => x > q.x0 - m && x < q.x1 + m && z > q.z0 - m && z < q.z1 + m);
  const G = plan.grounds = {
    michigan: { x0: -24, x1: 1 }, walk: { x0: 1, x1: F.FX }, monroe: { z0: -38, z1: -27 }, jackson: { z0: 247, z1: 258 }, columbus: { x0: 276, x1: 294 },
    rail: { x0: 113, x1: 123 }, north: { x0: 8, x1: 63, z0: -16, z1: 53 }, south: { x0: 11, x1: 62, z0: 168, z1: 240 },
    trees: [], hedges: [], train: null, paths: [], plazas: [], fountains: [], sculpt: [], snowmen: [],
  };
  // The Morton Wing's west wall, which the fountain stands against.
  const mw = Math.min(...plan.masses.filter(q => q.room && q.x0 > 50 && q.x0 < 100 && q.z0 < 203 && q.z1 > 190).map(q => q.x0), 80);
  G.south.x1 = mw - 0.5;
  G.fountain = { x: mw - 3.4, z: 196.5 };
  G.pool = { x0: 34, x1: Math.min(56, mw - 11), z0: 191.5, z1: 201.5 };
  G.calder = { x: 42.5, z: 26 };
  plan.ice = [G.pool];                                   // frozen over
  plan.paved = [{ x0: G.michigan.x0, x1: F.FX, z0: B.z0, z1: B.z1 }, { x0: B.x0, x1: B.x1, z0: G.monroe.z0, z1: G.monroe.z1 }, { x0: B.x0, x1: B.x1, z0: G.jackson.z0, z1: G.jackson.z1 }, { x0: G.columbus.x0, x1: G.columbus.x1, z0: B.z0, z1: B.z1 }];
  // Ground the stunt park must keep off.
  plan.reserved = [{ x0: B.x0, x1: F.FX + 2, z0: B.z0, z1: B.z1 }, { x0: B.x0, x1: B.x1, z0: B.z0, z1: G.monroe.z1 + 2 }, { x0: B.x0, x1: B.x1, z0: G.jackson.z0 - 2, z1: B.z1 }, { x0: G.columbus.x0 - 2, x1: B.x1, z0: B.z0, z1: B.z1 },
    { x0: G.rail.x0 - 2, x1: G.rail.x1 + 2, z0: B.z0, z1: B.z1 }, G.north, G.south];

  // Paths shovelled through the snow: across both gardens, over the railway, into the courtyard that
  // Griffin Court's south door opens on, and round to the skate park.
  const nmx = (G.north.x0 + G.north.x1) / 2, nmz = (G.north.z0 + G.north.z1) / 2, smx = (G.south.x0 + G.south.x1) / 2, smz = (G.south.z0 + G.south.z1) / 2, PW = 1.3;
  const path = (x0, x1, z0, z1) => G.paths.push(x0 === x1 ? { x0: x0 - PW, x1: x1 + PW, z0: Math.min(z0, z1) - PW, z1: Math.max(z0, z1) + PW } : { x0: Math.min(x0, x1) - PW, x1: Math.max(x0, x1) + PW, z0: z0 - PW, z1: z1 + PW });
  const CZ = 75.25;
  path(G.north.x0 + PW, 137, nmz, nmz); path(nmx, nmx, G.north.z0 + PW, G.north.z1 - PW);
  path(137, 137, nmz, CZ); path(137, 250, CZ, CZ); path(250, 250, CZ, 138);
  path(175, 175, 73, CZ); path(160, 160, CZ, 82);
  path(G.south.x0 + PW, G.south.x1 - 7, smz, smz); path(smx, smx, G.south.z0 + PW, G.pool.z0 - 2.4); path(smx, smx, G.pool.z1 + 2.4, G.south.z1 - PW);
  for (const q of G.paths) plan.paved.push(q);
  // The courtyard: the big tree, lit, with parcels under it, and Milles's Tritons with the water off.
  G.tree = { x: 160, z: 87.5, h: 11.5 };
  G.plazas.push({ x: G.tree.x, z: G.tree.z, r: 5.6 });
  plan.paved.push({ x0: G.tree.x - 4, x1: G.tree.x + 4, z0: G.tree.z - 4, z1: G.tree.z + 4 });
  O.push({ x0: G.tree.x - 0.3, x1: G.tree.x + 0.3, z0: G.tree.z - 0.3, z1: G.tree.z + 0.3, y0: 0, y1: G.tree.h });
  O.push({ x0: G.tree.x - 2.1, x1: G.tree.x + 2.1, z0: G.tree.z - 2.1, z1: G.tree.z + 2.1, y0: 2.4, y1: 8 });        // the boughs: a car goes under them, a drone does not go through
  G.parcels = [[1.5, 0.4, 0.5, 0.36, 0xb3242b], [-1.2, 1.1, 0.42, 0.3, 0x1f6a3a], [0.3, -1.6, 0.6, 0.3, 0xc9a23a], [-1.7, -0.6, 0.36, 0.42, 0x1f4f8a], [1.0, 1.5, 0.34, 0.24, 0xe9e4d6]].map(([dx, dz, w, h, c]) => ({ x: G.tree.x + dx, z: G.tree.z + dz, w, h, c }));
  for (const b of G.parcels) O.push({ x0: b.x - b.w / 2, x1: b.x + b.w / 2, z0: b.z - b.w / 2, z1: b.z + b.w / 2, y0: 0, y1: b.h });
  // Fountains, drained for the winter.
  G.fountains.push({ kind: 'triton', x: 141, z: 87, r: 2.7, h: 3.6 }, { kind: 'bowl', x: 29.5, z: 12, r: 2.2, h: 1.9 });
  for (const f of G.fountains) O.push({ x0: f.x - f.r, x1: f.x + f.r, z0: f.z - f.r, z1: f.z + f.r, y0: 0, y1: f.h });
  // Sculpture that stands outdoors. (The Calder and the Fountain of the Great Lakes are placed above.)
  G.sculpt.push({ kind: 'moore', x: 29.5, z: 26 }, { kind: 'cubi', x: 42.5, z: 12 }, { kind: 'arch', x: 266, z: -14, half: 7, open: 3.2, h: 8.6 });
  O.push({ x0: 28.6, x1: 30.4, z0: 25.2, z1: 26.8, y0: 0, y1: 5 }, { x0: 41.8, x1: 43.2, z0: 11.3, z1: 12.7, y0: 0, y1: 3.2 });
  { const a = G.sculpt[2]; O.push({ x0: a.x - 0.7, x1: a.x + 0.7, z0: a.z - a.half, z1: a.z - a.open, y0: 0, y1: a.h }, { x0: a.x - 0.7, x1: a.x + 0.7, z0: a.z + a.open, z1: a.z + a.half, y0: 0, y1: a.h }, { x0: a.x - 0.7, x1: a.x + 0.7, z0: a.z - a.open, z1: a.z + a.open, y0: 5.5, y1: a.h }); }
  // What is said the first time you come up to each.
  plan.outdoorArt = [
    { x: G.calder.x, z: G.calder.z, r: 6, text: 'Alexander Calder, Flying Dragon.' },
    { x: 29.5, z: 26, r: 5, text: 'Henry Moore, Large Interior Form.' },
    { x: 42.5, z: 12, r: 5, text: 'David Smith, Cubi VII.' },
    { x: G.fountain.x, z: G.fountain.z, r: 9, text: 'Lorado Taft, Fountain of the Great Lakes. Off for the winter.' },
    { x: 141, z: 87, r: 7, text: 'Carl Milles, Fountain of the Tritons. Off for the winter.' },
    { x: 266, z: -14, r: 10, text: 'Adler and Sullivan: the entrance arch of the old Chicago Stock Exchange.' },
    { x: G.tree.x, z: G.tree.z, r: 12, text: 'The courtyard tree. You fit under the lowest branches.' },
  ];
  // Somebody has been building snowmen.
  G.snowmen = [[5.6, F.cz - 7.2, 1], [6.1, F.cz + 6.6, 0.82], [32.6, 21.6, 1.05], [39.2, 15.2, 0.8], [152.5, 82, 1.1], [166, 93.2, 0.78], [170.5, 79.4, 0.95], [243.5, 136.5, 1], [206.5, 161, 0.85], [41.2, 207.6, 1.1], [30.5, 187.5, 0.8]].map(([x, z, s]) => ({ x, z, s }));
  const keepOff = (x, z) => G.paths.some(q => x > q.x0 - 0.9 && x < q.x1 + 0.9 && z > q.z0 - 0.9 && z < q.z1 + 0.9) || G.snowmen.some(m => Math.hypot(x - m.x, z - m.z) < 1.4)
    || G.fountains.some(f => Math.hypot(x - f.x, z - f.z) < f.r + 1.5) || G.sculpt.some(c => Math.hypot(x - c.x, z - c.z) < 3);

  // Trees, bare for the winter. Honey locusts in rows in the North Garden, hawthorns in a grid in the South, and a line along the avenue.
  const tree = (x, z, kind) => { if (inMass(x, z) || keepOff(x, z)) return; G.trees.push({ x, z, kind, s: 0.85 + ((x * 13 + z * 7) % 10) / 30, yaw: (x * 3 + z * 5) % 6.28 }); O.push({ x0: x - 0.16, x1: x + 0.16, z0: z - 0.16, z1: z + 0.16, y0: 0, y1: 5 }); };
  for (let x = 13; x <= 60; x += 7.8) for (let z = -11; z <= 49; z += 7.5) if (!(x > 28 && x < 48 && z > 10 && z < 36)) tree(x, z, 'locust');
  for (let x = 15; x <= G.south.x1 - 3; x += 6.4) for (let z = 172; z <= 237; z += 6.4) {
    if (x > G.pool.x0 - 3 && x < G.pool.x1 + 3 && z > G.pool.z0 - 3 && z < G.pool.z1 + 3) continue;
    if (Math.hypot(x - G.fountain.x, z - G.fountain.z) < 9) continue;
    tree(x, z, 'hawthorn');
  }
  for (let z = B.z0 + 10; z < B.z1 - 6; z += 13) if (Math.abs(z - F.cz) > 21) tree(3.4, z, 'locust');
  // Low hedges round both gardens, with gaps to get in by.
  const hedge = (x0, x1, z0, z1) => { G.hedges.push({ x0, x1, z0, z1 }); O.push({ x0, x1, z0, z1, y0: 0, y1: 0.9 }); };
  for (const g of [G.north, G.south]) {
    const mx = (g.x0 + g.x1) / 2, mz = (g.z0 + g.z1) / 2;
    hedge(g.x0, mx - 3, g.z0, g.z0 + 0.7); hedge(mx + 3, g.x1, g.z0, g.z0 + 0.7);
    hedge(g.x0, mx - 3, g.z1 - 0.7, g.z1); hedge(mx + 3, g.x1, g.z1 - 0.7, g.z1);
    hedge(g.x0, g.x0 + 0.7, g.z0, mz - 3); hedge(g.x0, g.x0 + 0.7, mz + 3, g.z1);
  }
  O.push({ x0: G.fountain.x - 3.2, x1: G.fountain.x + 3, z0: G.fountain.z - 4.4, z1: G.fountain.z + 4.4, y0: 0, y1: 5 });
  O.push({ x0: G.calder.x - 0.5, x1: G.calder.x + 0.5, z0: G.calder.z - 0.5, z1: G.calder.z + 0.5, y0: 0, y1: 4 });
  { const l = plan.facade; plan.outdoorArt.push({ x: l.PX - 3.4, z: l.cz - 15.5, r: 6, text: 'Edward Kemeys, the lions. Wreathed for the season.' }, { x: l.PX - 3.4, z: l.cz + 15.5, r: 6, text: 'Edward Kemeys, the lions. Wreathed for the season.', same: true }); }
  // A commuter train, stopped for the night in the cutting north of the bridge.
  const bridge = plan.masses.filter(q => q.x0 < G.rail.x1 && q.x1 > G.rail.x0).sort((a, b) => a.z0 - b.z0);
  G.railGaps = [];
  let z = B.z0;
  for (const q of bridge) { if (q.z0 - z > 1) G.railGaps.push([z, q.z0]); z = Math.max(z, q.z1); }
  if (B.z1 - z > 1) G.railGaps.push([z, B.z1]);
  const gap = G.railGaps.find(([a, b]) => b - a > 60);
  if (gap) { G.train = { x: G.rail.x1 - 2.6, z0: gap[1] - 64, z1: gap[1] - 6 }; O.push({ x0: G.train.x - 1.5, x1: G.train.x + 1.5, z0: G.train.z0, z1: G.train.z1, y0: 0, y1: 4.6 }); }

  // The lions, either side of the way in, and lamps: along the avenue and by every door.
  plan.lions = []; plan.lamps = [];
  for (const sgn of [-1, 1]) {
    const lion = { x: F.PX - 3.4, z: F.cz + sgn * 15.5 };
    plan.lions.push(lion);
    O.push({ x0: lion.x - 1.95, x1: lion.x + 1.95, z0: lion.z - 0.75, z1: lion.z + 0.75, y0: 0, y1: 3.6 });
  }
  const lamp = (x, z) => { if (!inMass(x, z, 0.3)) plan.lamps.push({ x, z }); };
  for (let zz = B.z0 + 16; zz < B.z1 - 6; zz += 26) lamp(1.7, zz + (Math.abs(zz - F.cz) < 3 ? 6 : 0));
  for (const d of plan.doors) if (d.out && !d.vent) {
    const r = plan.byId[d.a], cx = (d.x0 + d.x1) / 2, cz = (d.z0 + d.z1) / 2;
    if (d.along === 'x') { const w = d.x0 < r.x0, ex = w ? d.x0 - 2.2 : d.x1 + 2.2; for (const sg of [-1, 1]) lamp(ex, cz + sg * (d === plan.front ? 6.6 : 3)); }
    else { const n = d.z0 < r.z0, ez = n ? d.z0 - 2.2 : d.z1 + 2.2; for (const sg of [-1, 1]) lamp(cx + sg * 3, ez); }
  }
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
  plan.puddles = []; plan.benches = [];
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
  // Room to breathe: a piece either stands hard against a wall or another piece, or it leaves
  // at least GAP of clear floor. Nothing is left that a car could wedge itself into.
  const GAP = 1.7;
  const free = (F, u0, u1, v0, v1, m = GAP, flush = false) => {
    if (u0 < -F.L / 2 + 0.2 || u1 > F.L / 2 - 0.2 || v0 < -F.W / 2 - 0.01 || v1 > F.W / 2 + 0.01) return false;
    if (!flush && F.r && (u0 < -F.L / 2 + GAP || u1 > F.L / 2 - GAP || v0 < -F.W / 2 + GAP || v1 > F.W / 2 - GAP)) return false;
    const rect = world(F, u0, u1, v0, v1);
    if (!F.onLine && onLine(rect, 1.3)) return false;
    return !F.lanes.some(l => hits(rect, l)) && !S.some(s => hits(rect, s, m));
  };

  // ---- the pieces ----
  const tabletop = (F, u, v, h = 0.42, w = 1.8, run = 1.6, top = 0.6) => {
    if (!free(F, u - top - run - 1.2, u + top + run + 1.2, v - w / 2, v + w / 2)) return false;
    ramp(F, u - top - run, u - top, v - w / 2, v + w / 2, 0, h); flat(F, u - top, u + top, v - w / 2, v + w / 2, h); ramp(F, u + top, u + top + run, v - w / 2, v + w / 2, h, 0);
    if (!F.onLine && (hash(F.r ? F.r.id : 'park') % 3 === 0 || !F.r)) hoop(F, u, v, h + 0.62, 'u', 0.75);
    if (!F.onLine && (!F.r || hash(F.r.id) % 2)) { cone(F, u - top - run - 0.5, v - w / 2 - 0.35); cone(F, u + top + run + 0.5, v + w / 2 + 0.35); }
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
    plan.obstacles.push({ x0: t.x0, x1: t.x1, z0: t.z0, z1: t.z1, y0: 0.72 - 0.17, y1: 0.72 - 0.08, kit: true });      // the apron: low enough that a car cresting the ramp clears it
    for (const lx of [t.x0 + 0.08, t.x1 - 0.08]) for (const lz of [t.z0 + 0.08, t.z1 - 0.08]) plan.obstacles.push({ x0: lx - 0.035, x1: lx + 0.035, z0: lz - 0.035, z1: lz + 0.035, y0: 0, y1: 0.66, leg: true, kit: true });
    ramp(F, lo(2.1, 3.2), hi(2.1, 3.2), v - 0.45, v + 0.45, dir > 0 ? 0.72 : 0.92, dir > 0 ? 0.92 : 0.72, { thick: 0.2, onTop: 0.72 });
    hoop(F, a(4.5), v, 1.3, 'u', 0.8);
    return true;
  };
  // Skate ramps. An arc of radius R cut off at the lip; a ledge behind the lip
  // to land on. Whatever hangs on the wall above is hung higher to clear it,
  // so the top of your air is right in front of a picture.
  const quarter = (F, u, side, R = 2.6, run = 2.4, deck = 1.0, w = 3.8) => {
    const lipH = R - Math.sqrt(R * R - run * run), wall = side * F.W / 2, a = wall - side * deck, b = a - side * run;
    if (!free(F, u - w / 2, u + w / 2, Math.min(wall, b), Math.max(wall, b), GAP, true)) return 0;
    rampV(F, u - w / 2, u + w / 2, Math.min(a, b), Math.max(a, b), side > 0 ? 0 : lipH, side > 0 ? lipH : 0, { curve: R });
    flat(F, u - w / 2, u + w / 2, Math.min(wall, a), Math.max(wall, a), lipH, { perch: 'ledge' });
    hoop(F, u, a - side * 0.25, lipH + 1.5, 'y', 1.05);
    return lipH;
  };
  const halfpipe = (F, u, R, run) => {
    const w = 3.8, deck = 1.0, r2 = run || 2.4;
    if (!free(F, u - w / 2, u + w / 2, -F.W / 2, -F.W / 2 + deck + r2, GAP, true) || !free(F, u - w / 2, u + w / 2, F.W / 2 - deck - r2, F.W / 2, GAP, true)) return false;
    quarter(F, u, -1, R, r2, deck, w); quarter(F, u, 1, R, r2, deck, w);
    return true;
  };
  // A spine: two skate ramps back to back. Up one side, over the top, down the other.
  const spine = (F, u, v, R = 2.2, run = 1.9, w = 2.6) => {
    const lipH = R - Math.sqrt(R * R - run * run);
    if (!free(F, u - run, u + run, v - w / 2, v + w / 2)) return false;
    ramp(F, u - run, u, v - w / 2, v + w / 2, 0, lipH, { curve: R, spine: true });
    ramp(F, u, u + run, v - w / 2, v + w / 2, lipH, 0, { curve: R, spine: true });
    hoop(F, u, v, lipH + 1.5, 'u', 0.95);
    return true;
  };
  const hopHoops = (F, v) => { for (const u of [-F.L / 4, 0, F.L / 4]) hoop(F, u, v, 0.8, 'u', 0.55); return true; };

  // ---- jumps on the racing line, wherever it runs straight across a room ----
  {
    // Doorway to doorway, ignoring the steering points in between: a straight run across a room
    // gets a tabletop jump in the middle of it.
    const pts = buildRoute(plan).filter(p => p.gate && !p.mid);
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length], dx = b.x - a.x, dz = b.z - a.z, d = Math.hypot(dx, dz);
      if (d < 10.5 || (Math.abs(dx) > 1.2 && Math.abs(dz) > 1.2) || a.start || b.start) continue;
      const F = { ax: Math.abs(dx) > Math.abs(dz) ? 'x' : 'z', cx: (a.x + b.x) / 2, cz: (a.z + b.z) / 2, L: d - 1.5, W: 6, lanes: [], onLine: true, r: null };
      const i0 = S.length;
      tabletop(F, 0, 0, 0.42, 2.4, 1.6, 0.5);
      for (let j = i0; j < S.length; j++) S[j].line = true;      // these stay when the race is on
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

  // Two spines down the middle of Griffin Court.
  spine(HF, -12, -2.2); spine(HF, 14, -2.2);

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
    for (const u of [-24, 24]) { ramp(F, u - 0.8, u, -0.8, 0.8, 0, 0.2); ramp(F, u, u + 0.8, -0.8, 0.8, 0.2, 0); }
  }

  // ---- every other gallery gets something, chosen by its size and its doors ----
  const pipes = new Set(['G211', 'G240', 'G222', 'G218', 'G231_233', 'G239', 'G152', 'G216', 'G273']);
  for (const r of plan.rooms) {
    if (r.kind !== 'gallery' || r === g200) continue;
    const F = frame(r); F.lanes = lanes(r);
    const k = hash(r.id), tall = r.h >= 7;
    let placed = 0;
    // A half-pipe is enough for one room: it counts as two pieces.
    if (tall && F.W >= 12.5 && pipes.has(r.id)) for (const u of [0, F.L / 4, -F.L / 4, F.L / 3, -F.L / 3]) if (halfpipe(F, u, F.W >= 15 ? 3.2 : 2.6, F.W >= 15 ? 3.0 : 2.4)) { placed += 2; break; }
    const tries = [
      () => F.L >= 12.5 && F.W >= 9 && (tableRun(F, F.W / 2 - 3.4, k % 2 ? 1 : -1) || tableRun(F, -F.W / 2 + 3.4, k % 2 ? -1 : 1)),
      () => F.L >= 9.5 && (tabletop(F, F.L / 5, 0) || tabletop(F, -F.L / 5, 0) || tabletop(F, 0, F.W / 4) || tabletop(F, 0, -F.W / 4)),
      () => F.L >= 9 && F.W >= 9 && (funbox(F, -F.L / 5, F.W / 6) || funbox(F, F.L / 5, -F.W / 6) || funbox(F, 0, 0)),
      () => F.L >= 11 && (crates(F, 0, -F.W / 5, k % 2 ? 1 : -1) || crates(F, 0, F.W / 5, k % 2 ? 1 : -1)),
      () => tall && F.W >= 11 && !pipes.has(r.id) && (quarter(F, F.L / 4, 1) || quarter(F, -F.L / 4, -1)) > 0,
      () => tall && F.L >= 13 && F.W >= 8 && (spine(F, 0, 0) || spine(F, F.L / 5, F.W / 6) || spine(F, -F.L / 5, -F.W / 6)),
    ];
    // The sculpture floors keep more of their floor for glass cases.
    const cases = r.floor === '1' || r.floor === 'LL';
    // One thing in an ordinary room, two in a big one, three only in the very largest; small rooms are left to the art.
    const want = (F.L * F.W >= 520 ? 3 : F.L * F.W >= 300 ? 2 : F.L * F.W >= 115 ? 1 : 0) - (cases ? 1 : 0);
    for (let i = 0; i < tries.length && placed < want; i++) if (tries[(i + k) % tries.length]()) placed++;
    if (k % 7 === 0 && F.L >= 9 && F.W >= 6) hopHoops(F, (k % 2 ? 1 : -1) * Math.min(1.6, F.W / 4));
    // A bench in the middle, if the middle is still free.
    if (F.W >= 7.5 && free(F, -0.5, 0.5, -1.5, 1.5, 1.2)) {
      const [bx, bz] = at(F, 0, 0), alongX = F.ax === 'z';
      plan.benches.push({ x: bx, z: bz, alongX });
      const hxx = alongX ? 1.4 : 0.38, hzz = alongX ? 0.38 : 1.4;
      S.push({ skin: 'bench', x0: bx - hxx, x1: bx + hxx, z0: bz - hzz, z1: bz + hzz, axis: null, h0: 0.5, h1: 0.5, thick: 0.1 });
    }
  }

  // ---- outside ----
  // On the open ground south of the bridge: the loop, a big curved launcher, a
  // line of jumps. Snow is slippery; the track laid on it is not.
  const clearOutside = (x0, x1, z0, z1) => [...plan.masses, ...plan.reserved].every(m => x1 < m.x0 - 1 || x0 > m.x1 + 1 || z1 < m.z0 - 1 || z0 > m.z1 + 1);
  let park = null;
  // The nearest clear rectangle to the middle of the grounds.
  const B = plan.bounds, mx = (B.x0 + B.x1) / 2, mz = (B.z0 + B.z1) / 2;
  let bestD = Infinity;
  for (let z = B.z0 + 4; z <= B.z1 - 24; z += 2) for (let x = B.x0 + 4; x <= B.x1 - 48; x += 2) {
    const d = Math.hypot(x + 22 - mx, z + 10 - mz);
    if (d < bestD && clearOutside(x - 2, x + 46, z - 2, z + 22)) { bestD = d; park = { x, z }; }
  }
  plan.park = park;
  if (park) {
    const F = { ax: 'x', cx: park.x + 22, cz: park.z + 10, L: 44, W: 20, lanes: [] };
    L.push({ x: F.cx, z: F.cz - 5, dir: 1, r: 1.15, shift: 0.62, w: 0.56 });
    decal(F, -13, 0, -5.28, -4.72, 1); decal(F, 0, 11, -4.66, -4.1, -1);
    for (const dx of [-1.45, 1.45]) for (const dz of [-0.55, 1.15]) plan.obstacles.push({ x0: F.cx + dx - 0.04, x1: F.cx + dx + 0.04, z0: F.cz - 5 + dz - 0.04, z1: F.cz - 5 + dz + 0.04, y0: 0, y1: 2.5, post: true, kit: true });
    // The big one.
    ramp(F, -6, -3, 0.9, 3.1, 0, 3.4 - Math.sqrt(3.4 * 3.4 - 9), { curve: 3.4 });
    decal(F, -14, -6, 1.25, 2.75, 1);
    hoop(F, 0.2, 2, 4.3, 'u', 1.15);
    tabletop(F, -12, 6.5, 0.45, 2); tabletop(F, 2, 6.5, 0.45, 2); tabletop(F, 14, 6.5, 0.45, 2);
    F.r = null;
    spine(F, -17, -0.5); spine(F, 17, 1.5);
    for (const u of [-9, 9]) { cone(F, u, -1.5); cone(F, u, 9.2); }
    P.push({ type: 'sign', x: F.cx - 19, z: F.cz - 5, yaw: 1.2 });
  }

  // ---- the skate park ----
  // Beside the loop: a swimming pool with the water let out, tiled blue, three walls of it curved
  // to carve up and the shallow end open to roll in by; and a plywood half-pipe.
  const PG = plan.grounds;
  {
    const R = 3.0, run = 2.7, lip = R - Math.sqrt(R * R - run * run), dk = 1.2;
    const o = { x0: 208, x1: 236, z0: 163.5, z1: 178.5 };
    if (clearOutside(o.x0 - 4.5, o.x1, o.z0, o.z1)) {
      const bx0 = o.x0 + dk, bz0 = o.z0 + dk, bz1 = o.z1 - dk, cz = (o.z0 + o.z1) / 2;
      plan.pool = { ...o, bx0, bz0, bz1, lip };
      plan.paved.push({ x0: o.x0, x1: o.x1 + 3, z0: o.z0, z1: o.z1 });
      push('pool', [bx0, o.x1 + 2.5, bz0, bz1], null, 0.012, 0.012, { floor: true });
      push('pool', [o.x0, o.x1, o.z0, bz0], null, lip, lip, { perch: 'pool side' }); push('pool', [o.x0, o.x1, bz1, o.z1], null, lip, lip, { perch: 'pool side' });
      push('pool', [o.x0, bx0, bz0, bz1], null, lip, lip, { perch: 'pool side' });
      push('pool', [bx0, bx0 + run, bz0, bz0 + run], null, lip, lip); push('pool', [bx0, bx0 + run, bz1 - run, bz1], null, lip, lip);
      push('pool', [bx0 + run, o.x1, bz0, bz0 + run], 'z', lip, 0, { curve: R }); push('pool', [bx0 + run, o.x1, bz1 - run, bz1], 'z', 0, lip, { curve: R });
      push('pool', [bx0, bx0 + run, bz0 + run, bz1 - run], 'x', lip, 0, { curve: R });
      push('ply', [o.x0 - 4.2, o.x0, cz - 1.2, cz + 1.2], 'x', 0, lip, { ease: true });           // a way up onto the side, to drop in from
      for (const x of [bx0 + run + 5, bx0 + run + 14]) { H.push({ x, y: lip + 1.5, z: bz0 + 0.3, axis: 'y', r: 1.05 }); H.push({ x: x + 4, y: lip + 1.5, z: bz1 - 0.3, axis: 'y', r: 1.05 }); }
      H.push({ x: bx0 + 0.3, y: lip + 1.5, z: cz, axis: 'y', r: 1.05 });
      P.push({ type: 'cone', x: o.x1 + 1.6, z: o.z0 + 0.6 }, { type: 'cone', x: o.x1 + 1.6, z: o.z1 - 0.6 });
    }
    const h = { x0: 252, x1: 265, z0: 143.5, z1: 156.5 };
    if (clearOutside(h.x0, h.x1, h.z0 - 3.5, h.z1)) {
      plan.paved.push(h);
      push('ply', [h.x0, h.x0 + 1, h.z0, h.z1], null, lip, lip, { perch: 'half-pipe deck' }); push('ply', [h.x1 - 1, h.x1, h.z0, h.z1], null, lip, lip, { perch: 'half-pipe deck' });
      push('ply', [h.x0 + 1, h.x0 + 1 + run, h.z0, h.z1], 'x', lip, 0, { curve: R }); push('ply', [h.x1 - 1 - run, h.x1 - 1, h.z0, h.z1], 'x', 0, lip, { curve: R });
      push('ply', [h.x0, h.x0 + 1, h.z0 - 3.2, h.z0], 'z', 0, lip, { ease: true }); push('ply', [h.x1 - 1, h.x1, h.z0 - 3.2, h.z0], 'z', 0, lip, { ease: true });
      for (const x of [h.x0 + 1.25, h.x1 - 1.25]) H.push({ x, y: lip + 1.5, z: (h.z0 + h.z1) / 2, axis: 'y', r: 1.05 });
    }
  }
  // Snow, banked up into humps on the shovelled paths.
  const hump = (x, z, axis, hh = 0.36, run = 1.5, w = 1.1) => {
    if (axis === 'x') { push('snow', [x - run, x, z - w, z + w], 'x', 0, hh, { ease: true }); push('snow', [x, x + run, z - w, z + w], 'x', hh, 0, { ease: true }); }
    else { push('snow', [x - w, x + w, z - run, z], 'z', 0, hh, { ease: true }); push('snow', [x - w, x + w, z, z + run], 'z', hh, 0, { ease: true }); }
  };
  hump(88, 18.5, 'x'); hump(104, 18.5, 'x', 0.45); hump(137, 46, 'z'); hump(205, 75.25, 'x'); hump(232, 75.25, 'x', 0.45); hump(250, 98, 'z'); hump(250, 122, 'z', 0.45); hump(24, 204, 'x');
  // Snowmen, to be driven through.
  for (const m of PG.snowmen) P.push({ type: 'snowman', x: m.x, z: m.z, s: m.s, yaw: (m.x * 7 + m.z * 3) % 6.28 });
}

// ------------------------------------------------------------------- the land --
//
// The ground outdoors is not flat any more. Wherever there is open snow clear of buildings, streets,
// paths, the railway and the gardens, there are hills: low swells to roll over, and two big ones to
// climb and come down fast. And north of the building, between the garden and the railway, a pond,
// frozen, laid out for hockey.
function addLand(plan) {
  const G = plan.grounds, S = plan.surfaces;
  plan.hills = [];
  // The pond first, so that no hill is put on it.
  const rink = { x: 88, z: -6, rx: 14, rz: 8.5, gx: 11, gw: 1.3 };
  const clear = (x0, x1, z0, z1, m = 1.5) => !plan.masses.some(q => x1 > q.x0 - m && x0 < q.x1 + m && z1 > q.z0 - m && z0 < q.z1 + m)
    && ![...plan.paved, ...plan.ice, G.north, G.south, { x0: G.rail.x0 - 1, x1: G.rail.x1 + 1, z0: -1e3, z1: 1e3 }].some(q => x1 > q.x0 && x0 < q.x1 && z1 > q.z0 && z0 < q.z1)
    && !S.some(q => x1 > q.x0 - 1 && x0 < q.x1 + 1 && z1 > q.z0 - 1 && z0 < q.z1 + 1)
    && !plan.obstacles.some(o => o.y0 < 0.5 && x1 > o.x0 && x0 < o.x1 && z1 > o.z0 && z0 < o.z1)
    && !G.snowmen.some(m2 => m2.x > x0 - 1 && m2.x < x1 + 1 && m2.z > z0 - 1 && m2.z < z1 + 1)
    && x0 > plan.bounds.x0 + 2 && x1 < plan.bounds.x1 - 2 && z0 > plan.bounds.z0 + 2 && z1 < plan.bounds.z1 - 2;
  if (clear(rink.x - rink.rx - 1, rink.x + rink.rx + 1, rink.z - rink.rz - 3.5, rink.z + rink.rz + 1)) {
    plan.rink = rink;
    plan.ice.push({ x0: rink.x - rink.rx * 0.9, x1: rink.x + rink.rx * 0.9, z0: rink.z - rink.rz * 0.8, z1: rink.z + rink.rz * 0.8 });
  }
  const hill = (cx, cz, r, H, rz = r) => {
    if (!clear(cx - r, cx + r, cz - rz, cz + rz)) return;
    const s = { skin: 'hill', hill: true, axis: 'hill', cx, cz, rx: r, rz, H, x0: cx - r, x1: cx + r, z0: cz - rz, z1: cz + rz, h0: 0, h1: H, thick: 0 };
    S.push(s); plan.hills.push(s);
  };
  // Two big ones...
  hill(88, 38, 15, 6.5, 13); hill(240, 224, 20, 8.5, 17);
  // ...and swells wherever there is room.
  for (const [x, z, r, H] of [[150, -10, 10, 1.5], [128, 42, 6.5, 1.0], [150, 2, 5, 0.8], [215, 42, 8, 1.3], [264, 62, 8, 1.2], [265, 190, 8, 1.2], [268, 120, 5, 0.9], [100, 242, 9, 1.4], [84, -24, 0, 0], [70, 20, 4, 0.7], [104, 10, 5, 0.9], [262, -8, 7, 1.1], [205, 232, 7, 1.0], [130, 150, 5, 0.9], [150, 136, 5, 0.8]]) if (r) hill(x, z, r, H);
}

// ------------------------------------------------------------------ the roofs --
//
// Every roof is a floor, for anything that can get up there: a drone can land on one, and for a
// car there is the builders' scaffold at the south end of the Michigan Avenue wing. Roofs of the
// same height run into one another; a taller neighbour is a wall, a lower one a drop. The glass of
// a skylight stands a little proud and can be hopped onto. Where a skylight has been left open
// there is a hole, and what drives into it comes down inside.
function addRoofs(plan) {
  const S = plan.surfaces;
  plan.roofs = [];
  const roof = (x0, x1, z0, z1, h, o = {}) => { if (x1 - x0 > 0.01 && z1 - z0 > 0.01) { plan.roofs.push({ skin: 'roof', x0, x1, z0, z1, axis: null, h0: h, h1: h, thick: 0.45, roof: true, ...o }); } };
  for (const m of plan.masses) {
    const r = m.room;
    if (r && r.kind === 'hall') continue;                // Griffin Court's roof is a glass vault
    const k = r && plan.skylights.find(q => q.room === r.id);
    if (k) { roof(m.x0, m.x1, m.z0, k.z0, m.top); roof(m.x0, m.x1, k.z1, m.z1, m.top); roof(m.x0, k.x0, k.z0, k.z1, m.top); roof(k.x1, m.x1, k.z0, k.z1, m.top); }
    else roof(m.x0, m.x1, m.z0, m.z1, m.top);
    if (r && r.kind === 'gallery' && r.floor !== 'LL' && !k) {
      const w = r.x1 - r.x0, d = r.z1 - r.z0;
      if (Math.min(w, d) >= 8.5 && !(plan.terrace && plan.terrace.room === r.id)) roof(r.x0 + w * 0.27 - 0.2, r.x1 - w * 0.27 + 0.2, r.z0 + d * 0.27 - 0.2, r.z1 - d * 0.27 + 0.2, m.top + 0.32, { skin: 'roofglass', thick: 0.32 });
    }
  }
  // The scaffold: two flights of planking up the south wall of Gallery 211, and a landing level with its roof.
  const g = plan.masses.find(m => m.room && m.room.id === 'G211');
  if (g) {
    const z = g.z1, top = g.top + 0.02, half = top / 2, x0 = g.x0 + 0.3, x1 = g.x1 - 0.1;
    const piece = (rect, axis, h0, h1, o = {}) => { const s = { skin: 'ply', x0: rect[0], x1: rect[1], z0: rect[2], z1: rect[3], axis, h0, h1, thick: 0.1, posts: true, ...o }; S.push(s); plan.paved.push(s); return s; };
    piece([x0, x1, z + 2.6, z + 4.6], 'x', half, 0);                                  // up from the east end, going west
    piece([x0 - 2.6, x0, z + 0.2, z + 4.6], null, half, half);                         // the turn
    piece([x0, x1 - 3.4, z + 0.2, z + 2.2], 'x', half, top);                           // back east, up to the top
    piece([x1 - 3.4, x1, z - 1.2, z + 2.2], null, top, top, { perch: 'scaffold' });    // and onto the roof
    // Guard rails, so that the turn can be taken at speed: along the outside of the first flight, round
    // the turn, and round the top landing. A rail on a slope is a run of short level lengths.
    const O = plan.obstacles, rail = (rx0, rx1, rz0, rz1, lo, hi) => O.push({ x0: rx0, x1: rx1, z0: rz0, z1: rz1, y0: lo + 0.03, y1: hi + 0.38, rail: true, kit: true });
    for (let i = 0; i < 10; i++) { const xa = x0 + (x1 - x0) * i / 10, xb = x0 + (x1 - x0) * (i + 1) / 10, ha = half * (1 - (i + 1) / 10), hb = half * (1 - i / 10); rail(xa, xb, z + 4.6, z + 4.66, ha, hb); }
    rail(x0 - 2.66, x0 - 2.6, z + 0.2, z + 4.66, half, half); rail(x0 - 2.6, x0, z + 4.6, z + 4.66, half, half); rail(x0 - 2.6, x0, z + 0.14, z + 0.2, half, half);
    rail(x1, x1 + 0.06, z, z + 2.2, top, top); rail(x1 - 3.4, x1, z + 2.2, z + 2.26, top, top);
    for (let i = 0; i < 8; i++) { const L = x1 - 3.4 - x0, xa = x0 + L * i / 8, xb = x0 + L * (i + 1) / 8, ha = half + (top - half) * i / 8, hb = half + (top - half) * (i + 1) / 8; rail(xa, xb, z + 2.2, z + 2.26, ha, hb); }
    plan.scaffold = { x: x1 + 1.5, z: z + 3.6, top };
    plan.decals.push({ x0: x1, x1: x1 + 4, z0: z + 3.0, z1: z + 4.2, axis: 'x', dir: -1 });
  }
}

// Is this bare snow: outdoors, off the streets, the paths, the ice and the railway?
export function onSnow(plan, x, z) {
  const G = plan.grounds;
  if (x > G.rail.x0 && x < G.rail.x1) return false;
  for (const q of plan.paved) if (x > q.x0 && x < q.x1 && z > q.z0 && z < q.z1) return false;
  for (const q of plan.ice) if (x > q.x0 && x < q.x1 && z > q.z0 && z < q.z1) return false;
  for (const c of G.plazas) if ((x - c.x) ** 2 + (z - c.z) ** 2 < c.r * c.r) return false;
  for (const m of plan.masses) if (x > m.x0 && x < m.x1 && z > m.z0 && z < m.z1) return false;
  return true;
}

export function heightOf(s, x, z) {
  // A hill: a smooth mound, highest in the middle and running out flat at its foot.
  if (s.hill) { const d = Math.hypot((x - s.cx) / s.rx, (z - s.cz) / s.rz); return d >= 1 ? 0 : s.H * (Math.cos(d * Math.PI) + 1) / 2; }
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
  for (const list of y > 2 && plan.roofs ? [plan.surfaces, plan.roofs] : [plan.surfaces]) for (const s of list) {
    if (plan.racing && !s.line && s.skin !== 'bench' && !s.roof) continue;        // in a race, only what is on the track is there
    if (x < s.x0 || x > s.x1 || z < s.z0 || z > s.z1) continue;
    const h = heightOf(s, x, z);
    if ((h <= y + step || (s === sticky && h <= y + 1.6)) && h > g) { g = h; under = s; }
  }
  plan.under = under;          // which piece that was, for whoever just asked
  return g;
}

// Is there a solid piece here standing taller than something at height y can climb?
export function wallAt(plan, x, z, y, step = STEP, ignore = null) {
  for (const list of y > 2 && plan.roofs ? [plan.surfaces, plan.roofs] : [plan.surfaces]) for (const s of list) {
    if (s === ignore || (plan.racing && !s.line && s.skin !== 'bench' && !s.roof)) continue;
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
  placements.push(...stand(plan, collection, placements));
  return placements;
}

// Is there still `w` metres of clear floor from every doorway of room r to every other,
// with `extra` boxes standing in it as well as the stunt kit?
function lanesOpen(plan, r, w, extra) {
  const doors = plan.doorsOf(r.id);
  if (doors.length < 2) return true;
  const g = 0.3, nx = Math.ceil((r.x1 - r.x0) / g), nz = Math.ceil((r.z1 - r.z0) / g), m = w / 2;
  const blocks = plan.surfaces.filter(s => s.skin !== 'bench' && !(s.thick && Math.max(s.h0, s.h1) - s.thick > 0.5) && s.x1 > r.x0 && s.x0 < r.x1 && s.z1 > r.z0 && s.z0 < r.z1).concat(extra);
  const open = (i, j) => {
    const x = r.x0 + (i + 0.5) * g, z = r.z0 + (j + 0.5) * g;
    if (x < r.x0 + m || x > r.x1 - m || z < r.z0 + m || z > r.z1 - m) return false;
    for (const b of blocks) if (x > b.x0 - m && x < b.x1 + m && z > b.z0 - m && z < b.z1 + m) return false;
    return true;
  };
  const cells = doors.map(d => {
    const x = Math.max(r.x0 + m + 0.16, Math.min(r.x1 - m - 0.16, (d.x0 + d.x1) / 2)), z = Math.max(r.z0 + m + 0.16, Math.min(r.z1 - m - 0.16, (d.z0 + d.z1) / 2));
    return [Math.floor((x - r.x0) / g), Math.floor((z - r.z0) / g)];
  });
  if (!open(...cells[0])) return false;
  const seen = new Uint8Array(nx * nz), q = [cells[0]];
  seen[cells[0][1] * nx + cells[0][0]] = 1;
  while (q.length) {
    const [i, j] = q.pop();
    for (const [a, b] of [[i + 1, j], [i - 1, j], [i, j + 1], [i, j - 1]]) {
      if (a < 0 || b < 0 || a >= nx || b >= nz || seen[b * nx + a] || !open(a, b)) continue;
      seen[b * nx + a] = 1; q.push([a, b]);
    }
  }
  return cells.every(([i, j]) => seen[j * nx + i]);
}

// Sculpture, armour, pots and the rest stand on plinths in glass cases: out on
// the floor where there is room, and along any wall that has no pictures on
// it. A case never goes in front of a doorway, the stunt kit or a painting, and
// never where it would close the way between two doors.
function stand(plan, collection, hung) {
  const out = [];
  let total = 0;
  for (const r of plan.rooms) {
    const set = collection.rooms[r.id];
    if (!set || !set.objects || !set.objects.length || r.kind !== 'gallery') continue;
    const area = (r.x1 - r.x0) * (r.z1 - r.z0), max = Math.min(set.objects.length, 12, Math.max(2, Math.floor(area / 38)));
    const zones = plan.doorsOf(r.id).map(d => {
      const into = 3.4, w = 0.5;
      if (d.along === 'z') { const south = d.z0 >= r.z1 - 0.01; return { x0: d.x0 - w, x1: d.x1 + w, z0: south ? r.z1 - into : r.z0, z1: south ? r.z1 : r.z0 + into }; }
      const east = d.x0 >= r.x1 - 0.01; return { x0: east ? r.x1 - into : r.x0, x1: east ? r.x1 : r.x0 + into, z0: d.z0 - w, z1: d.z1 + w };
    });
    const mine = hung.filter(p => p.room === r.id);
    const cx = (r.x0 + r.x1) / 2, cz = (r.z0 + r.z1) / 2, spots = [];
    // Along the walls, wherever nothing hangs.
    for (const wall of plan.walls.filter(w => w.room === r)) for (const seg of wall.segs) {
      for (let u = seg.lo + 2.25; u <= seg.hi - 2.25; u += 3.1) {
        const p = wallPoint(wall, u, 0, 0);
        if (mine.some(a => a.nx === wall.nx && a.nz === wall.nz && Math.abs((wall.horiz ? a.x : a.z) - u) < a.w / 2 + 1.4)) continue;
        spots.push({ x: p.x, z: p.z, wall: true, d: 0, nx: wall.nx, nz: wall.nz });
      }
    }
    // And out on the floor.
    for (let x = r.x0 + 2.8; x <= r.x1 - 2.8; x += 3.5) for (let z = r.z0 + 2.8; z <= r.z1 - 2.8; z += 3.5) spots.push({ x, z, wall: false, d: 4 + Math.hypot(x - cx, z - cz) / 4 + ((x * 7 + z * 13) % 3) });
    // Where pictures cover the walls, the floor comes first; in a room of objects, the walls do.
    const floorFirst = mine.length >= 6;
    spots.sort((a, b) => (floorFirst ? (a.wall - b.wall) : (b.wall - a.wall)) || a.d - b.d);
    const here = [];
    let n = 0;
    for (const s of spots) {
      if (n >= max || total >= 320) break;
      const wk = set.objects[n];
      const aspect = wk.iw && wk.ih ? wk.iw / wk.ih : 0.7;
      const byWall = s.wall || s.flush;
      let h = Math.max(0.28, Math.min(byWall ? 1.9 : 2.3, wk.h > 0 ? wk.h / 100 : 0.6)), w = h * aspect;
      const wmax = byWall ? 1.1 : 1.5;
      if (w > wmax) { w = wmax; h = w / aspect; }
      const plinth = h > 1.4 ? 0.22 : h > 0.7 ? 0.42 : 0.62, half = Math.max(0.32, Math.min(byWall ? 0.62 : 0.85, w / 2 + 0.14));
      // Against a wall a case stands hard up to it, leaving no gap to get stuck in.
      if (s.wall) { s.x += s.nx * (half + 0.1); s.z += s.nz * (half + 0.1); s.wall = false; s.flush = true; }
      const box = { x0: s.x - half, x1: s.x + half, z0: s.z - half, z1: s.z + half };
      const near = (b, m) => box.x0 < b.x1 + m && box.x1 > b.x0 - m && box.z0 < b.z1 + m && box.z1 > b.z0 - m;
      if (zones.some(z => near(z, 0)) || here.some(c => near(c, 1.5)) || plan.puddles.some(p => Math.hypot(p.x - s.x, p.z - s.z) < p.r + 1.6)) continue;
      if (plan.line.some(p => Math.abs(p.x - s.x) < 1.8 && Math.abs(p.z - s.z) < 1.8)) continue;
      if (plan.surfaces.some(q => near(q, q.skin === 'bench' ? 1.1 : 1.7))) continue;
      if (!lanesOpen(plan, r, 2.2, [...here, box])) continue;
      here.push(box);
      plan.obstacles.push({ ...box, y0: 0, y1: plinth + h + 0.2, case: true });
      out.push({ work: wk, room: r.id, x: s.x, y: plinth + h / 2 + 0.02, z: s.z, rot: 0, nx: 0, nz: 1, w, h, frame: 0, kind: 'object', plinth, half });
      n++; total++;
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
