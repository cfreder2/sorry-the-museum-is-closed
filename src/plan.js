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
//
// The building has levels. Every room has its own floor height `y` and stands `h` tall above it,
// and rooms on different levels lie one over another: (x, z) does not say which room you are in,
// (x, y, z) does. Nothing here looks a height up from a floor's name; it is always the room's own y.

import LAYOUT from './layout.js';

export const T = 1;            // wall thickness, for the outside of a building
export const HW = HALL_HW();    // Griffin Court's half-width
const HALL = LAYOUT.rooms.find(r => r.kind === 'hall');
export const SPRING = (HALL.y || 0) + HALL.h;      // where its vault starts
export const VAULT_R = 0.5;   // its roof is flat glass: this is only the depth of the roof over the ceiling
function HALL_HW() { const h = LAYOUT.rooms.find(r => r.kind === 'hall'); return (h.x1 - h.x0) / 2; }
export const GRAVITY = 9.8;
export const STEP = 0.09;      // the tallest lip a toy wheel will climb
export const SKY = 46;         // how high a drone may go outdoors
export const SLAB = 0.5;       // a floor, from its top to the ceiling of the room below

// Wall colours, the deep paint museums use so gilt frames sing.
const TINTS = {
  '2': [0x5e2f2c, 0x2f4638, 0x3a4059, 0x4a5a66, 0x56604f, 0x5c4a58, 0x445a5c, 0x6a5a48, 0x4f3c4d, 0x6b5536],
  '1': [0x6a6456, 0x5a6158, 0x66605c, 0x545a60], '3': [0x8a8880, 0x7c7e84], LL: [0x2a2c33, 0x30292a],
  X: [0x3b4650, 0x36424a],            // what is on no drawing: bare concrete, lit cold
};
const hash = s => { let h = 7; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };
const same = (a, b) => Math.abs(a - b) < 0.02;

// What is left of a rectangle once others have been cut out of it, as rectangles.
export function carve(rect, holes) {
  let out = [{ x0: rect.x0, x1: rect.x1, z0: rect.z0, z1: rect.z1 }];
  for (const h of holes) {
    const next = [];
    for (const r of out) {
      if (h.x1 <= r.x0 + 0.01 || h.x0 >= r.x1 - 0.01 || h.z1 <= r.z0 + 0.01 || h.z0 >= r.z1 - 0.01) { next.push(r); continue; }
      const a = Math.max(r.x0, h.x0), b = Math.min(r.x1, h.x1);
      if (h.z0 > r.z0 + 0.01) next.push({ x0: r.x0, x1: r.x1, z0: r.z0, z1: h.z0 });
      if (h.z1 < r.z1 - 0.01) next.push({ x0: r.x0, x1: r.x1, z0: h.z1, z1: r.z1 });
      if (a > r.x0 + 0.01) next.push({ x0: r.x0, x1: a, z0: Math.max(r.z0, h.z0), z1: Math.min(r.z1, h.z1) });
      if (b < r.x1 - 0.01) next.push({ x0: b, x1: r.x1, z0: Math.max(r.z0, h.z0), z1: Math.min(r.z1, h.z1) });
    }
    out = next;
  }
  return out;
}

export function buildPlan() {
  const rooms = LAYOUT.rooms.map(r => {
    const pal = TINTS[r.floor] || TINTS['2'], y = r.y || 0;
    return { ...r, y, top: y + r.h, want: r.gallery, ceil: r.kind === 'hall' ? r.h + 3.4 : r.h - 0.15,
      tint: r.kind === 'hall' ? 0x8c8a84 : r.kind === 'corridor' ? 0x16171c : pal[hash(r.id) % pal.length] };
  });
  const doors = LAYOUT.doors.map((d, i) => ({ id: 'D' + i, ...d, y: d.y || 0, out: d.b === 'out' }));
  const byId = Object.fromEntries(rooms.map(r => [r.id, r]));
  const lap = (a, b, m = 0) => a.x0 < b.x1 + m && a.x1 > b.x0 - m && a.z0 < b.z1 + m && a.z1 > b.z0 - m;
  // Is there sky over a room, or another room (or the ground)? Skylights go only where there is sky.
  for (const r of rooms) r.sky = r.top > 0.5 && !rooms.some(o => o !== r && o.y > r.y + 1 && lap(r, o, T));
  // The museum is closed, and every outside door is locked. But a ventilation grille has come
  // loose low on the Michigan Avenue wall, just big enough for a toy car...
  // The Michigan Avenue front is one long wall of limestone standing a little way in front of the
  // rooms behind it, with the entrance pavilion stepping forward in the middle.
  const west = rooms.filter(r => r.building === 'main' && r.x0 < 30 && r.top > 0.5);
  const FX = Math.min(...west.map(r => r.x0 - T)) - 0.5, PX = FX - 2;
  // The front door is the outside door furthest west that opens west: the one on Michigan Avenue.
  const front = doors.filter(d => d.out && d.along === 'x' && byId[d.a].x0 >= d.x1 - 0.01).sort((a, b) => a.x0 - b.x0)[0] || doors.find(d => d.out);
  const lobby = byId[front.a], atFront = front.along === 'x' && lobby.x0 < 40;
  if (atFront) front.x0 = PX;                            // the way in runs right through the pavilion
  const fz = (front.z0 + front.z1) / 2;
  // The museum is closed and every outside door is locked, but nobody has to hunt for the way in.
  // For a car: a hole knocked through the foot of the wall right beside the front doors, lit from
  // inside. For a drone: the fanlight over the same doors, left open.
  let vent = null, transom = null;
  if (atFront) {
    vent = { id: 'vent', a: lobby.id, b: 'out', along: 'x', x0: PX, x1: lobby.x0, z0: fz - 4.4, z1: fz - 3.2, y: 0, h: 0.75, out: true, vent: true };
    doors.push(vent);
    // (The fanlight over the doors used to stand open for the drone. It did not look right, and the vent takes a drone as well.)
  }
  // ...and somebody has left a pane of the big skylight over the Grand Staircase propped open.
  // Two more have been left open, further in: one over the bridge, one over the old first floor.
  // (Only ever over a room with nothing but sky above it: what flies in comes down into the top of the building.)
  const sr = byId.G200;
  const skylights = [];
  if (sr && sr.sky) skylights.push({ room: sr.id, x0: (sr.x0 + sr.x1) / 2 - 1.3, x1: (sr.x0 + sr.x1) / 2 + 1.3, z0: sr.z1 - 14.2, z1: sr.z1 - 11.6, y: sr.top });
  for (const id of ['G240', 'G151']) { const r = byId[id]; if (r && r.sky) skylights.push({ room: id, x0: (r.x0 + r.x1) / 2 - 1.3, x1: (r.x0 + r.x1) / 2 + 1.3, z0: (r.z0 + r.z1) / 2 - 1.3, z1: (r.z0 + r.z1) / 2 + 1.3, y: r.top }); }
  // And a pane left open here and there across the rest of the roofs, so that no part of the building is far from a way down
  // into it: over any top-lit gallery, the biggest first, none within forty-five metres of another.
  for (const r of rooms.filter(r => r.sky && r.kind === 'gallery' && !r.secret && Math.min(r.x1 - r.x0, r.z1 - r.z0) >= 8.5).sort((a, b) => (b.x1 - b.x0) * (b.z1 - b.z0) - (a.x1 - a.x0) * (a.z1 - a.z0))) {
    if (skylights.length >= 9) break;
    const cx = (r.x0 + r.x1) / 2, cz2 = (r.z0 + r.z1) / 2;
    if (skylights.some(k => k.room === r.id || Math.hypot((k.x0 + k.x1) / 2 - cx, (k.z0 + k.z1) / 2 - cz2) < 45)) continue;
    skylights.push({ room: r.id, x0: cx - 1.3, x1: cx + 1.3, z0: cz2 - 1.3, z1: cz2 + 1.3, y: r.top });
  }
  const skylight = skylights[0] || null;
  // And for a car there are other ways in, for anyone who goes looking: low openings through an
  // outside wall, each a different kind of thing left open. They are at street level, so each must
  // lead into a room whose floor is at street level; the first on its list that will do is used.
  // The bridges across the north end of Griffin Court open at both ends: onto the west galleries (the layout gives that
  // doorway) and onto the balcony that runs down the east side on each floor, so that they can be walked across.
  for (const [lv, east] of [['hall-bridge-2', 'G288'], ['hall-bridge-3', 'G389']]) {
    const k = (LAYOUT.decks || []).find(q => q.id === lv), e = byId[east], h = byId.hall;
    if (!k || !e || !h || !same(e.y, k.y) || doors.some(d => (d.a === 'hall' && d.b === east || d.b === 'hall' && d.a === east) && same(d.y, k.y) && d.z0 < k.z1 && d.z1 > k.z0)) continue;      // (one at the stairhead, further along, is another door)
    const z0 = Math.max(k.z0, e.z0) + 0.1, z1 = Math.min(k.z1, e.z1) - 0.1;
    if (z1 - z0 < 1.2) continue;
    doors.push({ id: lv + '-east', a: 'hall', b: east, along: 'x', x0: h.x1, x1: e.x0, z0, z1, y: k.y, h: Math.min(4.2, e.h - 0.7) });
  }
  const holes = [];
  // (Open ground: clear of every room above the street on any level, since each is a block down to the ground.)
  const solid = (x, z) => rooms.some(r => r.top > 0.5 && x > r.x0 - T - 0.3 && x < r.x1 + T + 0.3 && z > r.z0 - T - 0.3 && z < r.z1 + T + 0.3);
  const pierce = (where, kind, w = 1.2, h = 0.6) => {
    for (const [id, side] of where) {
      const r = byId[id];
      if (!r || !same(r.y, 0) || holes.some(q => q.a === id)) continue;
      const horiz = side === 'n' || side === 's', lo = horiz ? r.x0 : r.z0, hi = horiz ? r.x1 : r.z1;
      for (const t of [0.5, 0.32, 0.68, 0.2, 0.8]) {
        const u = lo + (hi - lo) * t, out = k => [side === 'w' ? r.x0 - T - k : side === 'e' ? r.x1 + T + k : u, side === 'n' ? r.z0 - T - k : side === 's' ? r.z1 + T + k : u];
        const [ox, oz] = out(2.4), [nx, nz] = out(0.6);
        if (solid(nx, nz) || solid(ox, oz) || solid(ox + (horiz ? 1.5 : 0), oz + (horiz ? 0 : 1.5)) || solid(ox - (horiz ? 1.5 : 0), oz - (horiz ? 0 : 1.5))) continue;
        const onSide = d => side === 'n' ? d.z1 <= r.z0 + 0.01 : side === 's' ? d.z0 >= r.z1 - 0.01 : side === 'w' ? d.x1 <= r.x0 + 0.01 : d.x0 >= r.x1 - 0.01;      // a door in this same wall
        if (doors.some(d => (d.a === id || d.b === id) && onSide(d) && (horiz ? d.along === 'z' && Math.abs((d.x0 + d.x1) / 2 - u) < 3.5 : d.along === 'x' && Math.abs((d.z0 + d.z1) / 2 - u) < 3.5))) continue;
        const d = horiz ? { along: 'z', x0: u - w / 2, x1: u + w / 2, z0: side === 'n' ? r.z0 - T : r.z1, z1: side === 'n' ? r.z0 : r.z1 + T } : { along: 'x', z0: u - w / 2, z1: u + w / 2, x0: side === 'w' ? r.x0 - T : r.x1, x1: side === 'w' ? r.x0 : r.x1 + T };
        Object.assign(d, { id: 'hole' + holes.length, a: id, b: 'out', y: 0, h, out: true, vent: true, kind, side });
        doors.push(d); holes.push(d);
        return true;
      }
    }
    return false;
  };
  pierce([['GStock_Exchange', 'e'], ['G152', 'e']], 'dock', 2.2, 0.7);                         // a delivery shutter not quite pulled down, on the path to the skate park
  pierce([['G184', 's'], ['G184', 'w'], ['G182', 'w']], 'duct', 1.1, 0.6);
  // From the south end of Griffin Court to the Christmas tree: a grille low in the end wall, a duct round one bend through
  // the wall into the restrooms beside it, and across them a second duct out of their far wall, to the tree.
  {
    const h = byId.hall, wc = byId['MW1-wc'];
    if (h && wc && same(wc.y, 0) && Math.abs(wc.x1 - (h.x0 - T)) < 1.2 && wc.z0 < h.z1 - 3 && wc.z1 > h.z1 + 3) {
      const W = 1.2, H = 0.6, xa = h.x0 + 0.3, za = h.z1, zb = h.z1 + 3.4, zc = zb - W;      // the run south, then the run west
      // (A passage is open 1.6 m past each end of a doorway, so each run is given 1.6 m short of where its duct ends.)
      const s1 = { id: 'treeduct1', a: 'hall', b: 'out', along: 'z', x0: xa, x1: xa + W, z0: za, z1: zb - 1.6, y: 0, h: H, out: true, vent: true, kind: 'inner', side: 's',
        tube: { x0: xa, x1: xa + W, z0: za, z1: zb }, open: { w: [zc, zb] }, cap: 'z1', mouth: { x: xa + W / 2, z: za, nx: 0, nz: -1, w: W } };
      const s2 = { id: 'treeduct2', a: wc.id, b: 'out', along: 'x', x0: wc.x1, x1: xa + W - 1.6, z0: zc, z1: zb, y: 0, h: H, out: true, vent: true, kind: 'inner', side: 'e',
        tube: { x0: wc.x1, x1: xa, z0: zc, z1: zb }, mouth: { x: wc.x1, z: zc + W / 2, nx: -1, nz: 0, w: W } };
      pierce([[wc.id, 'w']], 'duct', 1.1, 0.6);                                         // out the other side, by the tree (first: a room gets one vent from pierce)
      doors.push(s1, s2); holes.push(s1, s2);
    }
  }                     // another duct, in the courtyard
  pierce([['G142', 'n'], ['G142', 's'], ['G141', 'n'], ['G141', 's'], ['G140', 'n']], 'flap', 0.8, 0.45);    // a service door by the railway with its bottom panel kicked in
  pierce([['G134', 's'], ['G134', 'w'], ['G108', 's'], ['G108', 'w'], ['G133', 's']], 'window', 1.0, 0.5);   // a cellar window propped open, by the South Garden
  pierce([['G161', 'w'], ['G161', 'e'], ['G153', 'e'], ['G153', 's'], ['G151', 'n'], ['G151', 'e']], 'window', 1.0, 0.5);
  // And more of them, all the way round: any street-level room with an outside wall on open ground will do, each at least
  // forty metres from the next way in, so that you are never far from one whichever side of the building you are on.
  // (Not the Michigan Avenue front or the Modern Wing's glass, whose faces are built separately; nor into the railway cutting.)
  {
    const KIND = [['duct', 1.1, 0.6], ['flap', 0.8, 0.45], ['window', 1.0, 0.5], ['dock', 2.2, 0.7]], ways = () => [...holes, ...doors.filter(d => d.out)];
    let n = 0;
    for (const r of rooms.filter(r => same(r.y, 0) && !r.secret && r.kind !== 'hall' && !/^MW/.test(r.id) && r.id !== lobby.id).sort((a, b) => a.x0 + a.z0 - b.x0 - b.z0)) {
      for (const side of ['n', 'e', 's', 'w']) {
        if (side === 'w' && r.x0 < 30) continue;
        const mx = side === 'w' ? r.x0 : side === 'e' ? r.x1 : (r.x0 + r.x1) / 2, mz = side === 'n' ? r.z0 : side === 's' ? r.z1 : (r.z0 + r.z1) / 2;
        const ox = mx + (side === 'w' ? -2.5 : side === 'e' ? 2.5 : 0), oz = mz + (side === 'n' ? -2.5 : side === 's' ? 2.5 : 0);
        if (ox > 108 && ox < 128) continue;                                                     // the railway
        if (ox > 150 && oz < 2) continue;                                                       // the Modern Wing's glass front on Monroe Street
        if (ways().some(d => Math.hypot((d.x0 + d.x1) / 2 - mx, (d.z0 + d.z1) / 2 - mz) < 40)) continue;
        const k = KIND[n % KIND.length];
        if (pierce([[r.id, side]], k[0], k[1], k[2])) { n++; break; }
      }
    }
  }
  const hall = rooms.find(r => r.kind === 'hall');

  // Outdoors is everywhere that is not a building. Each room that stands above the ground, with its
  // walls, is a solid block from the street to its roof when seen from outside: rooms stacked one
  // over another make blocks one inside another, and it is the tallest over any spot that counts.
  // Rooms below ground are not blocks at all: the snow lies over them.
  const masses = rooms.filter(r => r.top > 0.5).map(r => ({ x0: r.x0 - T, x1: r.x1 + T, z0: r.z0 - T, z1: r.z1 + T, top: (r.kind === 'hall' ? SPRING + VAULT_R : r.top) + 0.5 + (hash(r.id) % 7) * 0.012, room: r }));
  const massOf = Object.fromEntries(masses.map(m => [m.room.id, m]));
  // The front wall itself, and the solid between it and the rooms.
  // It stands a little higher than the rooms behind it, however many storeys of them there are: a plain attic over the cornice.
  // (Measured off photographs against the people on the pavement: the wings' cornice is about 18.5 m above the terrace, the
  // pavilion's about 20.5, and the pavilion is about 32 m wide. The steps run on past it to the lions, 26 m either side of the door.)
  const WING = Math.max(18.5, ...west.map(r => r.top + 1.1)), PAV = WING + 2, HALF = 16, STEPS = 24.2, LION = 26.4;
  const cuts = [...new Set(west.flatMap(r => [r.z0 - T, r.z1 + T]))].sort((a, b) => a - b);
  for (let i = 0; i < cuts.length - 1; i++) {
    const a = cuts[i], b = cuts[i + 1], mid = (a + b) / 2;
    if (b - a < 0.01) continue;
    const behind = Math.min(FX + 6, ...rooms.filter(r => r.top > 0.5 && r.x0 < 60 && r.z0 - T <= mid && r.z1 + T >= mid).map(r => r.x0 - T));
    masses.push({ x0: FX, x1: behind, z0: a, z1: b, top: WING, facade: true });
  }
  masses.push({ x0: PX, x1: FX, z0: fz - HALF, z1: fz + HALF, top: PAV, facade: true, pavilion: true });
  const facade = { FX, PX, z0: cuts[0], z1: cuts[cuts.length - 1], cz: fz, half: HALF, wing: WING, pav: PAV, steps: STEPS, lion: LION };
  // The city block: Michigan Avenue to the west, Monroe to the north, Columbus to the east, Jackson to the south.
  const up = rooms.filter(r => r.top > 0.5), xs = up.flatMap(r => [r.x0, r.x1]), zs = up.flatMap(r => [r.z0, r.z1]);
  // (East of Columbus Drive the world goes on across the park to the lake: `cx1` is where the block itself ends.)
  const cx1 = Math.max(298, Math.max(...xs) + 12);
  const bounds = { x0: -28, x1: 620, cx1, z0: Math.min(-42, Math.min(...zs) - 12), z1: Math.max(262, Math.max(...zs) + 8) };

  const plan = { rooms, doors, byId, boxes: [], masses, massOf, bounds, obstacles: [], surfaces: [], hall, made: LAYOUT.made, levels: { ...(LAYOUT.levels || {}) },
    // What is on no drawing (see src/secret.js): which room it is behind, and whether its doorway has been found. Until it has, that doorway is a wall.
    secret: LAYOUT.secret || null, secretOpen: false, pits: rooms.filter(r => r.y < -0.5 && r.top > 0.5)        /* any room that rises from below through street level (a stair tower, a shaft, the secret stair): the street is not a floor inside it */, vent, transom, skylight, skylights, holes, locked: true, facade };
  plan.walls = rooms.flatMap(r => wallsOf(plan, r));
  plan.doorsOf = id => doors.filter(d => d.a === id || d.b === id);
  addLevels(plan);

  // Walkable volumes indoors: every room from its floor to its ceiling, every doorway stretched a
  // little past the wall either side, the tall middle of the hall under its vault, and the hole in
  // a floor wherever a stair or a lift goes down through it. A volume has a bottom as well as a top:
  // the slab between one room and the room over it is in none of them, and that is what stops a
  // drone flying up through a floor.
  const boxes = plan.boxes;
  // (The air inside a room stops well short of its own roof: a room whose ceiling reached the roof could be flown into from above.)
  const under = (r, y1) => { const m = massOf[r.id]; return m ? Math.min(y1, m.top - 1.0) : y1; };
  for (const r of rooms) boxes.push({ x0: r.x0, x1: r.x1, z0: r.z0, z1: r.z1, y0: r.y, y1: under(r, r.y + r.ceil) });
  const hx = (hall.x0 + hall.x1) / 2;
  boxes.push({ x0: hx - 4, x1: hx + 4, z0: hall.z0, z1: hall.z1, y0: hall.y, y1: under(hall, SPRING + VAULT_R) });
  for (const k of skylights) boxes.push({ x0: k.x0, x1: k.x1, z0: k.z0, z1: k.z1, y0: k.y - 1, y1: SKY });     // straight up and out
  if (transom) boxes.push({ x0: transom.x0 - 1.6, x1: transom.x1 + 1.6, z0: transom.z0, z1: transom.z1, y0: transom.y0, y1: transom.y1, fly: true });   // above the door: for things that fly
  for (const d of doors) {
    const e = 1.6;
    boxes.push(d.along === 'z'
      ? { x0: d.x0, x1: d.x1, z0: d.z0 - e, z1: d.z1 + e, y0: d.y, y1: d.y + d.h, lock: d.out && !d.vent, hidden: !!d.hidden }
      : { x0: d.x0 - e, x1: d.x1 + e, z0: d.z0, z1: d.z1, y0: d.y, y1: d.y + d.h, lock: d.out && !d.vent, hidden: !!d.hidden });
  }
  for (const w of plan.wells) boxes.push({ x0: w.x0, x1: w.x1, z0: w.z0, z1: w.z1, y0: w.y - SLAB - 1.6, y1: w.y + 1 });

  // Where you begin: out on Michigan Avenue in the snow, facing the front door.
  plan.front = front;
  plan.spawn = { x: PX - 2.7, z: fz, yaw: Math.PI / 2 };
  addGrounds(plan);
  addLakefront(plan);
  addStunts(plan);
  addLand(plan);
  // The roof of Gallery 211, at the top of the scaffold, is kept clear: there is a card game up there.
  { const tm = massOf.G211 || masses.find(m => m.room && m.room.sky && m.room.kind === 'gallery'); if (tm) plan.terrace = { room: tm.room.id, x: (tm.x0 + tm.x1) / 2 + 0.6, z: (tm.z0 + tm.z1) / 2, top: tm.top }; }
  addRoofs(plan);
  return plan;
}

// ------------------------------------------------------------- the levels --
//
// What joins one level to another, from the layout: decks (a floor slab inside a tall room: a
// balcony, a bridge, the gallery round a stair well), ramps (a sloping way between levels, drawn as
// a flight of steps with a plank laid over it when it is a stair) and lifts (a platform that goes
// up and down a shaft). All three are surfaces like the stunt kit's, so the same few functions that
// let a car stand on a table let it stand on a balcony. They are marked `fixed`: they are part of
// the building, there in a race as well, and nothing is placed on top of them.
//
// Also worked out here: the floors (one per room and per doorway, each at its own height), and the
// wells, the holes in a floor where a stair or a lift goes down through it.
function addLevels(plan) {
  const S = plan.surfaces, O = plan.obstacles, { rooms, doors, byId } = plan;
  plan.decks = (LAYOUT.decks || []).map(d => ({ ...d, thick: d.thick || 0.4, rails: d.rails || [] }));
  plan.ramps = (LAYOUT.ramps || []).map(q => ({ ...q }));
  plan.lifts = (LAYOUT.lifts || []).map(l => ({ ...l, stops: [...l.stops].sort((a, b) => a - b) }));
  for (const d of plan.decks) S.push(d.surface = { skin: 'deck', x0: d.x0, x1: d.x1, z0: d.z0, z1: d.z1, axis: null, h0: d.y, h1: d.y, thick: d.thick, base: d.y - d.thick, fixed: true, slab: true, deck: d });
  for (const q of plan.ramps) {
    const lo = Math.min(q.y0, q.y1);
    // A stair is solid stone under its plank, down to the level it starts from. A plain ramp is a plank and you can go under it.
    S.push(q.surface = { skin: q.stairs ? 'stair' : 'plank', x0: q.x0, x1: q.x1, z0: q.z0, z1: q.z1, axis: q.axis, h0: q.y0, h1: q.y1, thick: q.stairs ? 0 : 0.22, base: lo, fixed: true, slab: true, ramp: q });
  }
  for (const l of plan.lifts) {
    Object.assign(l, { at: 0, dir: 1, y: l.stops[0], wait: 3, vy: 0 });
    S.push(l.surface = { skin: 'lift', x0: l.x0, x1: l.x1, z0: l.z0, z1: l.z1, axis: null, h0: l.y, h1: l.y, thick: 0.14, base: l.y - 0.14, fixed: true, slab: true, lift: l });
  }
  plan.slabs = S.filter(s => s.slab);

  // Floors. A doorway's threshold is floor too, at the doorway's own height.
  plan.floors = [...rooms.map(r => ({ x0: r.x0, x1: r.x1, z0: r.z0, z1: r.z1, y: r.y, room: r })), ...doors.map(d => ({ x0: d.x0, x1: d.x1, z0: d.z0, z1: d.z1, y: d.y }))];
  // Wells. A stair cuts the floor it goes down through for as far as there would not be headroom
  // under it (after that it is simply in the room below, coming down out of the ceiling). A lift cuts
  // every floor between its lowest stop and its highest.
  const wells = plan.wells = [];
  const HEAD = 1.3;
  for (const q of plan.ramps) {
    const lo = Math.min(q.y0, q.y1), hi = Math.max(q.y0, q.y1);
    for (const y of [...new Set(rooms.filter(r => r.y > lo + 0.05 && r.y <= hi + 0.01 && q.x0 < r.x1 && q.x1 > r.x0 && q.z0 < r.z1 && q.z1 > r.z0).map(r => r.y))]) {
      // The part of the run where the plank is less than a slab and some headroom below this floor.
      const t = Math.min(1, Math.max(0, (y - SLAB - HEAD - lo) / (hi - lo))), a = q.axis === 'x' ? q.x0 : q.z0, b = q.axis === 'x' ? q.x1 : q.z1, cut = q.y1 > q.y0 ? a + (b - a) * t : b - (b - a) * t;
      const [u0, u1] = q.y1 > q.y0 ? [cut, b] : [a, cut];
      wells.push(q.axis === 'x' ? { x0: u0, x1: u1, z0: q.z0, z1: q.z1, y, ramp: q } : { x0: q.x0, x1: q.x1, z0: u0, z1: u1, y, ramp: q });
      (q.wells = q.wells || []).push(wells[wells.length - 1]);
    }
  }
  for (const l of plan.lifts) for (const y of [...new Set(rooms.filter(r => r.y > l.stops[0] + 0.3 && r.y <= l.stops[l.stops.length - 1] + 0.01 && l.x0 < r.x1 && l.x1 > r.x0 && l.z0 < r.z1 && l.z1 > r.z0).map(r => r.y))]) wells.push({ x0: l.x0, x1: l.x1, z0: l.z0, z1: l.z1, y, lift: l });

  // Guard rails, so that stairs and balconies can be taken at speed. A rail is a run of short level
  // lengths, each a thin obstacle a hand's height above what it guards.
  const rail = (x0, x1, z0, z1, lo, hi) => O.push({ x0, x1, z0, z1, y0: lo + 0.03, y1: hi + 0.5, rail: true });
  const TH = 0.06;
  // Along one edge of a rectangle from u0 to u1, at a height that may slope, leaving out the stretches in `gaps`.
  const run = (side, r, u0, u1, hA, hB, gaps = []) => {
    let segs = [[u0, u1]];
    for (const [a, b] of gaps) segs = segs.flatMap(([p, q]) => (b <= p || a >= q ? [[p, q]] : [[p, Math.min(q, a)], [Math.max(p, b), q]].filter(([m, n]) => n - m > 0.25)));
    for (const [p, q] of segs) {
      const n = Math.max(1, Math.ceil((q - p) / 1.1));
      for (let i = 0; i < n; i++) {
        const a = p + (q - p) * i / n, b = p + (q - p) * (i + 1) / n, ha = hA + (hB - hA) * (a - u0) / (u1 - u0 || 1), hb = hA + (hB - hA) * (b - u0) / (u1 - u0 || 1);
        if (side === 'n') rail(a, b, r.z0, r.z0 + TH, Math.min(ha, hb), Math.max(ha, hb));
        else if (side === 's') rail(a, b, r.z1 - TH, r.z1, Math.min(ha, hb), Math.max(ha, hb));
        else if (side === 'w') rail(r.x0, r.x0 + TH, a, b, Math.min(ha, hb), Math.max(ha, hb));
        else rail(r.x1 - TH, r.x1, a, b, Math.min(ha, hb), Math.max(ha, hb));
      }
    }
  };
  const span = (side, r) => (side === 'n' || side === 's' ? [r.x0, r.x1] : [r.z0, r.z1]);
  // Does `o` come up against this side of `r`, at height y? Then the rail leaves a gap for it.
  const meets = (side, r, o, y) => {
    const e = 0.06, on = side === 'n' ? Math.abs(o.z1 - r.z0) < e : side === 's' ? Math.abs(o.z0 - r.z1) < e : side === 'w' ? Math.abs(o.x1 - r.x0) < e : Math.abs(o.x0 - r.x1) < e;
    if (!on) return null;
    const lo = o.stops ? o.stops[0] : o.y != null ? o.y : Math.min(o.y0, o.y1), hi = o.stops ? o.stops[o.stops.length - 1] : o.y != null ? o.y : Math.max(o.y0, o.y1);
    if (y < lo - 0.05 || y > hi + 0.05) return null;
    // A stair meets a landing only at the end of it that is at the landing's height.
    if (o.axis) { const endOn = (o.axis === 'x') === (side === 'w' || side === 'e'); if (!endOn) return null; const near = side === 'w' || side === 'n' ? o.y1 : o.y0; if (Math.abs(near - y) > 0.05) return null; }
    const [a, b] = span(side, o);
    return [a, b];
  };
  const others = r => [...plan.decks, ...plan.ramps, ...plan.lifts].filter(o => o !== r);
  const atWall = (side, r) => { const room = byId[r.room]; return room && (side === 'n' ? r.z0 <= room.z0 + 0.05 : side === 's' ? r.z1 >= room.z1 - 0.05 : side === 'w' ? r.x0 <= room.x0 + 0.05 : r.x1 >= room.x1 - 0.05); };
  for (const d of plan.decks) for (const side of d.rails) {
    if (atWall(side, d)) continue;
    const [u0, u1] = span(side, d);
    run(side, d, u0, u1, d.y, d.y, others(d).map(o => meets(side, d, o, d.y)).filter(Boolean));
  }
  for (const q of plan.ramps) for (const side of q.axis === 'x' ? ['n', 's'] : ['w', 'e']) {
    if (atWall(side, q)) continue;
    const [u0, u1] = span(side, q);
    run(side, q, u0, u1, q.y0, q.y1);
  }
  // A lift is a car in a shaft, walled all round from the pit to over the top stop, with one doorway at each stop and
  // a gate across it whenever the car is somewhere else: nobody drives into an empty shaft, or under a car on its way down.
  for (const l of plan.lifts) liftShaft(plan, l);
  // Round a well: along both sides of the stair and across its low end, at the level of the floor it is cut in.
  for (const w of wells) {
    const q = w.ramp, r = { x0: w.x0 - TH, x1: w.x1 + TH, z0: w.z0 - TH, z1: w.z1 + TH }, room = rooms.find(o => same(o.y, w.y) && lap2(o, w));
    if (!q) continue;
    for (const side of q.axis === 'x' ? ['n', 's', q.y1 > q.y0 ? 'w' : 'e'] : ['w', 'e', q.y1 > q.y0 ? 'n' : 's']) {
      if (room && (side === 'n' ? w.z0 <= room.z0 + 0.3 : side === 's' ? w.z1 >= room.z1 - 0.3 : side === 'w' ? w.x0 <= room.x0 + 0.3 : w.x1 >= room.x1 - 0.3)) continue;
      const [u0, u1] = span(side, r);
      run(side, r, u0, u1, w.y, w.y);
    }
  }
}
const lap2 = (a, b) => a.x0 < b.x1 && a.x1 > b.x0 && a.z0 < b.z1 && a.z1 > b.z0;

// A lift's shaft, as built: museum.js draws exactly this. `J` is the steel either side of a doorway (the car's front
// returns line up with it), `DOOR` how tall a doorway is, `CAB` how tall the car is inside, `W` how thick a shaft wall is
// (it stands just outside the car's footprint, as the gates always did). The doorway is J short of each corner: 2 m
// clear in a 2.6 m shaft, room for a car to turn in.
export const LIFT = { J: 0.3, DOOR: 2.3, CAB: 2.4, W: 0.06 };
// Where the doorway is chosen by hand. Regenstein Hall lies north of its lift: up there it opens onto the hall, not
// onto the street door 4 m behind it.
const LIFT_ENTRY = { 'F1-regenstein-lift': { 0: 'n' } };
const LIFT_SIDES = ['n', 's', 'w', 'e'];
function liftShaft(plan, l) {
  const { J, DOOR, CAB, W } = LIFT, O = plan.obstacles;
  const span = s => (s === 'n' || s === 's' ? [l.x0, l.x1] : [l.z0, l.z1]);
  const outAt = (s, u, d) => (s === 'n' ? [u, l.z0 - d] : s === 's' ? [u, l.z1 + d] : s === 'w' ? [l.x0 - d, u] : [l.x1 + d, u]);
  const inside = (q, x, z) => x > q.x0 && x < q.x1 && z > q.z0 && z < q.z1;
  // Somewhere a car could stand at height y, with nothing built on it: a room's floor or a deck, not a well, a stair or another lift.
  const roomOf = (x, z, y) => plan.rooms.find(r => same(r.y, y) && inside(r, x, z));
  const clear = (x, z, y) => (plan.decks.some(k => same(k.y, y) && inside(k, x, z)) || (roomOf(x, z, y) && !plan.wells.some(w => same(w.y, y) && inside(w, x, z))))
    && !plan.ramps.some(q => inside(q, x, z) && Math.max(q.y0, q.y1) > y - 0.1 && Math.min(q.y0, q.y1) < y + 2)
    && !plan.lifts.some(o => o !== l && inside(o, x, z) && o.stops[0] < y + 2 && o.stops[o.stops.length - 1] > y - 0.1);
  // How much floor lies in front of each side at each stop, up to 2.4 m; the doorway goes on the side with most, and
  // of sides with as much, the one nearest a doorway into the room.
  const depth = (s, y) => { const [a, b] = span(s); let d = 0; for (let k = 0.2; k < 2.41; k += 0.2) { if (![0.2, 0.5, 0.8].every(t => clear(...outAt(s, a + (b - a) * t, k), y))) break; d = k; } return d; };
  const doorDist = (s, y) => {
    const [a, b] = span(s), [x, z] = outAt(s, (a + b) / 2, 1), r = roomOf(x, z, y);
    let best = 99;
    for (const d of plan.doors) if (same(d.y, y) && (!r || d.a === r.id || d.b === r.id)) best = Math.min(best, Math.hypot((d.x0 + d.x1) / 2 - x, (d.z0 + d.z1) / 2 - z));
    return best;
  };
  l.doors = l.stops.map(y => {
    const pick = LIFT_ENTRY[l.id] && LIFT_ENTRY[l.id][y];
    if (pick) return pick;
    let best = 'w', score = -Infinity;
    for (const s of LIFT_SIDES) { const v = depth(s, y) * 100 - doorDist(s, y); if (v > score) { score = v; best = s; } }
    return best;
  });
  // The shaft. A side with a room's own wall against it at every stop needs no wall of its own.
  const lo = l.stops[0] - 0.3, top = l.stops[l.stops.length - 1] + CAB + 0.3;
  const sides = {};
  for (const s of LIFT_SIDES) {
    const [a, b] = span(s);
    const walled = l.stops.every(y => !roomOf(...outAt(s, (a + b) / 2, 0.15), y) && !plan.decks.some(k => same(k.y, y) && inside(k, ...outAt(s, (a + b) / 2, 0.15))));
    const doorsHere = l.stops.filter((y, i) => l.doors[i] === s);
    sides[s] = { walled, doors: doorsHere, a, b };
    if (walled && !doorsHere.length) continue;
    // A strip of wall along this side from u0 to u1 (it reaches round the corners), from y0 to y1.
    const strip = (u0, u1, y0, y1) => O.push(s === 'n' ? { x0: u0, x1: u1, z0: l.z0 - W, z1: l.z0, y0, y1, lift: l, shaft: true }
      : s === 's' ? { x0: u0, x1: u1, z0: l.z1, z1: l.z1 + W, y0, y1, lift: l, shaft: true }
      : s === 'w' ? { x0: l.x0 - W, x1: l.x0, z0: u0, z1: u1, y0, y1, lift: l, shaft: true }
      : { x0: l.x1, x1: l.x1 + W, z0: u0, z1: u1, y0, y1, lift: l, shaft: true });
    if (!doorsHere.length) { strip(a - W, b + W, lo, top); continue; }
    strip(a - W, a + J, lo, top); strip(b - J, b + W, lo, top);
    // Between the jambs: solid but for a doorway at each stop it opens at.
    let y = lo;
    for (const d of doorsHere) { if (d - 0.15 > y) strip(a + J, b - J, y, d - 0.15); y = d + DOOR; }
    if (top > y) strip(a + J, b - J, y, top);
  }
  l.shaft = { lo: l.stops[0], top, sides };
  l.gates = l.stops.map((y, i) => {
    const s = l.doors[i], [a, b] = span(s), g = { y, side: s, off: false, bars: [] };
    const o = s === 'n' ? { x0: a + J, x1: b - J, z0: l.z0 - W, z1: l.z0 } : s === 's' ? { x0: a + J, x1: b - J, z0: l.z1, z1: l.z1 + W }
      : s === 'w' ? { x0: l.x0 - W, x1: l.x0, z0: a + J, z1: b - J } : { x0: l.x1, x1: l.x1 + W, z0: a + J, z1: b - J };
    Object.assign(o, { y0: y - 0.2, y1: y + 1.0, rail: true, gate: g });
    O.push(o); g.bars.push(o);
    return g;
  });
}

// The lifts. Each waits at a stop, goes to the next, waits again, up through its stops and back
// down. Drive on and it does not keep you waiting long; wait at its gate on another floor and it
// comes for you next.
const LIFT_V = 1.5;
export function stepLifts(plan, dt, riders = []) {
  for (const l of plan.lifts) {
    const s = l.surface, over = (p, m) => p.x > l.x0 - m && p.x < l.x1 + m && p.z > l.z0 - m && p.z < l.z1 + m;
    const aboard = riders.some(p => over(p, 0) && Math.abs(p.y - l.y) < 0.4);
    l.vy = 0;
    if (l.wait > 0) {
      // (Somebody who has just ridden here is given the whole wait to drive off: the lift hurries only for somebody getting on.)
      if (!aboard) l.rode = false;
      const call = aboard ? -1 : l.stops.findIndex((y, i) => i !== l.at && riders.some(p => over(p, 1.6) && Math.abs(p.y - y) < 0.4));
      if (((aboard && !l.rode) || call >= 0) && l.wait > 1.2) l.wait = 1.2;
      l.wait -= dt;
      if (l.wait <= 0) {
        if (call >= 0) { l.to = call; l.dir = Math.sign(call - l.at); }
        else { if (l.at + l.dir < 0 || l.at + l.dir >= l.stops.length) l.dir = -l.dir; l.to = l.at + l.dir; }
      }
    } else {
      const want = l.stops[l.to], d = want - l.y, stepY = Math.sign(d) * Math.min(Math.abs(d), LIFT_V * dt);
      l.y += stepY; l.vy = dt > 0 ? stepY / dt : 0;
      if (Math.abs(want - l.y) < 1e-4) { l.y = want; l.at = l.to; l.wait = 4.5; l.rode = aboard; }
    }
    s.h0 = s.h1 = l.y; s.base = l.y - s.thick;
    for (const g of l.gates) g.off = Math.abs(l.y - g.y) < 0.06;
  }
}

// One entry per wall face: where it is, which way it faces, the openings in it (each with how far
// above the room's own floor it starts: in a tall room a doorway may be a storey up, onto a deck),
// and the stretches of plaster left between its doors at floor level, where pictures can hang.
function wallsOf(plan, r) {
  const out = [];
  const sides = [
    { side: 'n', fixed: r.z0, lo: r.x0, hi: r.x1, nx: 0, nz: 1, rot: 0 },
    { side: 's', fixed: r.z1, lo: r.x0, hi: r.x1, nx: 0, nz: -1, rot: Math.PI },
    { side: 'w', fixed: r.x0, lo: r.z0, hi: r.z1, nx: 1, nz: 0, rot: Math.PI / 2 },
    { side: 'e', fixed: r.x1, lo: r.z0, hi: r.z1, nx: -1, nz: 0, rot: -Math.PI / 2 },
  ];
  const at = (a, b) => Math.abs(a - b) < 0.011;
  for (const s of sides) {
    const horiz = s.side === 'n' || s.side === 's';
    const openings = [];
    for (const d of plan.doors) {
      if (d.a !== r.id && d.b !== r.id) continue;
      if (horiz && d.along === 'z') {
        if ((s.side === 'n' && at(d.z1, r.z0)) || (s.side === 's' && at(d.z0, r.z1))) openings.push({ lo: d.x0, hi: d.x1, h: d.h, y: d.y - r.y, door: d });
      } else if (!horiz && d.along === 'x') {
        if ((s.side === 'w' && at(d.x1, r.x0)) || (s.side === 'e' && at(d.x0, r.x1))) openings.push({ lo: d.z0, hi: d.z1, h: d.h, y: d.y - r.y, door: d });
      }
    }
    openings.sort((a, b) => a.lo - b.lo);
    let segs = [{ lo: s.lo, hi: s.hi }];
    for (const o of openings) if (o.y < 4.5) segs = segs.flatMap(g => (o.hi <= g.lo || o.lo >= g.hi ? [g] : [{ lo: g.lo, hi: Math.min(g.hi, o.lo) }, { lo: Math.max(g.lo, o.hi), hi: g.hi }].filter(q => q.hi - q.lo > 0.01)));
    out.push({ ...s, room: r, horiz, openings, segs });
  }
  return out;
}

export function wallPoint(w, u, y, off = 0) {
  return w.horiz
    ? { x: u, y, z: w.fixed + w.nz * off }
    : { x: w.fixed + w.nx * off, y, z: u };
}

// Which room is this point in? With a height, the room on that level (a little slack either way, so
// that something on the floor or brushing the ceiling still counts). Without one, the topmost room
// over the spot: what you would see looking down at the plan.
export function roomAt(plan, x, z, y) {
  let best = null;
  for (const r of plan.rooms) {
    if (x < r.x0 || x > r.x1 || z < r.z0 || z > r.z1) continue;
    if (y == null) { if (!best || r.y > best.y) best = r; continue; }
    if (y < r.y - 0.3 || y > r.top + 0.3) continue;
    if (!best || r.y > best.y) best = r;
  }
  return best;
}

// Is this point on top of a building rather than in it? Only the tallest block over the spot has a roof you can be on.
export function onRoof(plan, x, z, y) {
  if (y < 2.5) return false;
  let best = null;
  for (const m of plan.masses) if (x > m.x0 && x < m.x1 && z > m.z0 && z < m.z1 && (!best || m.top > best.top)) best = m;
  if (!best || y < best.top - 0.4) return false;
  // (In a doorway between two upper rooms the tallest thing underfoot may be the roof of the room below. That is not being on a roof.)
  for (const d of plan.doors) if (x >= d.x0 && x <= d.x1 && z >= d.z0 && z <= d.z1 && y >= d.y - 0.3 && y <= d.y + d.h) return false;
  return best;
}

// The underside of a piece: of its slab if it is one, or the floor it stands on if it is solid.
const bottom = (s, h) => (s.thick ? h - s.thick : s.base || 0);

// The lowest underside of anything built overhead here (a deck, a bridge, a stair you can go under, a lift), or the sky.
export function headAt(plan, x, z, y) {
  let c = SKY + 20;
  for (const s of plan.slabs) {
    if (x < s.x0 || x > s.x1 || z < s.z0 || z > s.z1) continue;
    const h = heightOf(s, x, z), b = bottom(s, h);
    if (h > y + 0.3 && b > y - 0.3 && b < c) c = b;
  }
  return c;
}

// How high the ceiling is over a point: a room's, a doorway's, whatever is built overhead, or the sky.
export function ceilingAt(plan, x, z, y) {
  if (y != null && onRoof(plan, x, z, y)) return SKY + 20;
  const r = roomAt(plan, x, z, y);
  let c = SKY + 20;
  if (r) c = r.kind === 'hall' ? SPRING + Math.sqrt(Math.max(0, VAULT_R * VAULT_R - (x - (r.x0 + r.x1) / 2) ** 2)) - 0.2 : r.top;
  else for (const d of plan.doors) if (x >= d.x0 && x <= d.x1 && z >= d.z0 && z <= d.z1 && (y == null || (y > d.y - 0.3 && y < d.y + d.h + 0.3))) { c = d.y + d.h; break; }
  if (r && plan.skylights.some(k => k.room === r.id && x > k.x0 && x < k.x1 && z > k.z0 && z < k.z1)) c = SKY + 20;
  return y == null ? c : Math.min(c, headAt(plan, x, z, y));
}

// Keep a sphere of radius r where it is allowed to be: inside a room or a
// doorway, or outdoors clear of every building. Returns true when it had to
// move the point, and writes the push direction to `out`.
const _o = { x: 0, y: 0, z: 0 };
export function confine(plan, p, r, flying, out, noFurniture) {
  let best = Infinity, bx = p.x, by = p.y, bz = p.z;
  // (Up on a roof a car is outdoors, and the rooms below are nothing to do with it: it is above their volumes.)
  for (const b of plan.boxes) {
    if (b.lock && plan.locked) continue;              // a locked door is a wall
    if (b.hidden && !plan.secretOpen) continue;       // and so is one that has not been found
    if (b.fly && !flying) continue;                   // a way through up in the air is no use to a car
    const x0 = b.x0 + r, x1 = b.x1 - r, z0 = b.z0 + r, z1 = b.z1 - r;
    if (x0 > x1 || z0 > z1) continue;
    const cx = p.x < x0 ? x0 : p.x > x1 ? x1 : p.x;
    const cz = p.z < z0 ? z0 : p.z > z1 ? z1 : p.z;
    let cy = p.y, d = (cx - p.x) ** 2 + (cz - p.z) ** 2;
    if (flying) {
      // Something that flies is kept between the floor and the ceiling of the volume it is in.
      const y1 = b.y1 - r, y0 = b.y0 + (b.fly ? r : 0);
      cy = p.y > y1 ? y1 : p.y < y0 ? Math.min(y0, y1) : p.y;
      d += (cy - p.y) ** 2;
    } else {
      // A car goes where the ground takes it, so it is not moved up or down: but a volume on
      // another level is not one it is in. How far off its level counts against it.
      const dy = p.y < b.y0 - 0.3 ? b.y0 - 0.3 - p.y : p.y > b.y1 ? p.y - b.y1 : 0;
      d += dy * dy;
    }
    if (d < best) { best = d; bx = cx; by = cy; bz = cz; if (d === 0) break; }
  }
  if (best > 1e-10) {
    // Not indoors. Outdoors, then: push clear of any building it is touching
    // (or, coming down from above, set it on the roof).
    const B = plan.bounds;
    _o.x = Math.max(B.x0 + r, Math.min(B.x1 - r, p.x)); _o.z = Math.max(B.z0 + r, Math.min(B.z1 - r, p.z)); _o.y = Math.min(p.y, SKY);
    for (const q of plan.allow || []) if (p.x > q.x0 && p.x < q.x1 && p.z > q.z0 && p.z < q.z1) { _o.x = p.x; _o.z = p.z; }      // strips of ground beyond the bounds that may be driven (the foot of the bridgeway)
    let ok = true;
    for (let pass = 0; pass < 3; pass++) {
      let moved = false;
      for (const m of plan.masses) {
        if (_o.x + r <= m.x0 || _o.x - r >= m.x1 || _o.z + r <= m.z0 || _o.z - r >= m.z1) continue;
        if (flying && _o.y - r >= m.top) continue;
        if (!flying && _o.y >= m.top - 0.4) continue;              // level with its roof or above it, a building is not in the way: from a scaffold, or in the air, you go on over the edge                   // a roof no higher than this one is floor, not wall
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
    if ((o.kit && plan.racing) || (o.gate && o.gate.off)) continue;
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

// ---------------------------------------------------------- loose things --
//
// Chairs, stools, cones: things the toy shoves about the floor. Each is kept inside the room it stands in and out of
// whatever is fixed down there, by its real footprint, so that it comes to rest flush against a wall or a column and
// never half inside one. These two are shared by everything loose (src/loose.js, src/props.js, k.pushable).

// What something loose on the floor of `r` (a room, or any box with a floor height y) can run into: whatever is fixed
// down in and round it and comes lower than `top` over that floor (plan.obstacles: furniture, columns, rails), and any
// flat solid block built on that floor too tall to be climbed. It is the slow part: find it once for a room and keep it.
export function solidsNear(plan, r, top = 1.3, pad = 0.8) {
  const y = r.y || 0, out = [];
  const lap = q => q.x1 > r.x0 - pad && q.x0 < r.x1 + pad && q.z1 > r.z0 - pad && q.z0 < r.z1 + pad;
  for (const o of plan.obstacles) if (o.y1 > y + 0.05 && o.y0 < y + top && lap(o)) out.push(o);
  for (const s of plan.surfaces) {
    if (s.axis || s.hill || s.roof || !lap(s)) continue;                 // (slopes are climbed: src/loose.js follows the ground up them)
    const y0 = s.thick ? s.h0 - s.thick : s.base || 0;
    if (s.h0 > y + 0.2 && y0 < y + top) out.push({ x0: s.x0, x1: s.x1, z0: s.z0, z1: s.z1, y0, y1: s.h0, climb: 0.2 });
  }
  return out;
}

// Keep a footprint clear of the walls of `room` (a box it must stay inside, or null) and of `solids` (from solidsNear).
// The footprint is a capsule on the floor: from (p.x, p.z) to (p.x + ex, p.z + ez), radius rad (ex = ez = 0: a disc),
// standing from y to y + h. p is moved out of whatever it is in, the room's walls having the last word. `out` gets how
// far it was moved (x, z) and where along the capsule the deepest contact was (t: 0 at p, 1 at the far end).
// Returns true if it had to be moved.
export function keepClear(p, y, h, ex, ez, rad, room, solids, out) {
  let sx = 0, sz = 0, deep = 0, tt = 0.5;
  const len = Math.hypot(ex, ez), n = len > 1e-3 ? Math.ceil(len / (rad * 0.75)) : 0;
  const lx = Math.min(0, ex) - rad, hx = Math.max(0, ex) + rad, lz = Math.min(0, ez) - rad, hz = Math.max(0, ez) + rad;
  if (solids) for (let pass = 0; pass < 2; pass++) {
    let moved = false;
    for (let k = 0; k < solids.length; k++) {
      const o = solids[k];
      if (o.y1 <= y + (o.climb || 0.02) || o.y0 >= y + h || (o.gate && o.gate.off)) continue;
      const px = p.x + sx, pz = p.z + sz;
      if (px + hx <= o.x0 || px + lx >= o.x1 || pz + hz <= o.z0 || pz + lz >= o.z1) continue;
      for (let i = 0; i <= n; i++) {
        const t = n ? i / n : 0, qx = p.x + sx + ex * t, qz = p.z + sz + ez * t;
        const cx = qx < o.x0 ? o.x0 : qx > o.x1 ? o.x1 : qx, cz = qz < o.z0 ? o.z0 : qz > o.z1 ? o.z1 : qz;
        let dx = qx - cx, dz = qz - cz, d2 = dx * dx + dz * dz, d;
        if (d2 >= rad * rad) continue;
        if (d2 < 1e-12) {             // its middle is inside: out by the nearest side
          const l = qx - o.x0, r = o.x1 - qx, f = qz - o.z0, b = o.z1 - qz, m = Math.min(l, r, f, b);
          if (m === l) { dx = -(l + rad); dz = 0; } else if (m === r) { dx = r + rad; dz = 0; } else if (m === f) { dx = 0; dz = -(f + rad); } else { dx = 0; dz = b + rad; }
          d = m + rad;
        } else { const dd = Math.sqrt(d2), s = (rad - dd) / dd; dx *= s; dz *= s; d = rad - dd; }
        sx += dx; sz += dz; moved = true;
        if (d > deep) { deep = d; tt = t; }
      }
    }
    if (!moved) break;
  }
  if (room) {
    const end = e => (e < -1e-3 ? 1 : e > 1e-3 ? 0 : 0.5);      // which end of it is lowest along an axis
    const fit = (lo, hi, a0, a1, e) => {                          // the shift along one axis that puts [lo, hi] inside [a0, a1]
      const dl = a0 - lo, dh = hi - a1;
      if (dl > 0 && dh > 0) return (dl - dh) / 2;
      if (dl > 0) { if (dl > deep) { deep = dl; tt = end(e); } return dl; }
      if (dh > 0) { if (dh > deep) { deep = dh; tt = 1 - end(e); } return -dh; }
      return 0;
    };
    const x = p.x + sx, z = p.z + sz;
    sx += fit(x + lx, x + hx, room.x0, room.x1, ex); sz += fit(z + lz, z + hz, room.z0, room.z1, ez);
  }
  if (out) { out.x = sx; out.z = sz; out.t = tt; }
  if (sx === 0 && sz === 0) return false;
  p.x += sx; p.z += sz;
  return true;
}

// ------------------------------------------------------------- the grounds --
//
// What stands round the building, placed from the map: Michigan Avenue and the other three streets
// of the block, the railway in its cutting, the North Garden and the South Garden with its pool and
// the Fountain of the Great Lakes. Positions come from OpenStreetMap, in the same frame as the rooms.

function addGrounds(plan) {
  const F = plan.facade, B = plan.bounds, O = plan.obstacles;
  const inMass = (x, z, m = 1.2) => plan.masses.some(q => x > q.x0 - m && x < q.x1 + m && z > q.z0 - m && z < q.z1 + m);
  // Michigan Avenue lies below the museum's floor, as it does: the door is up a flight of steps
  // from the pavement. Everything west of `x` is at `y`; `ways` are the places the two levels meet,
  // each climbing east over `run` metres.
  const SX = 7, SY = -1.2, nz = 18.5, sz = 204;
  plan.street = { x: SX, y: SY, reach: 12, ways: [
    { id: 'steps', z0: F.cz - F.steps, z1: F.cz + F.steps, run: 5.6, land: [1.8, 3.8], stairs: 8, ramps: [[F.cz - F.steps, F.cz - F.steps + 2.6], [-1.5 + F.cz, F.cz + 1.5], [F.cz + F.steps - 2.6, F.cz + F.steps]] },       // two flights and a landing
    { id: 'north', z0: nz - 3, z1: nz + 3, run: 3.6, stairs: 8, ramps: [[nz - 3, nz - 0.4]] }, { id: 'south', z0: sz - 3, z1: sz + 3, run: 3.6, stairs: 8, ramps: [[sz + 0.4, sz + 3]] },
    { id: 'monroe', z0: B.z0 - 1, z1: -24, run: 12, road: true }, { id: 'jackson', z0: 244, z1: B.z1 + 1, run: 12, road: true }] };
  // The wall that holds the terrace up, between the ways.
  { const cuts = plan.street.ways.map(w => [w.z0, w.z1]).sort((a, b) => a[0] - b[0]); let z = B.z0; plan.street.walls = [];
    for (const [a, b] of [...cuts, [B.z1, B.z1]]) { if (a - z > 0.05) { plan.street.walls.push([z, a]); O.push({ x0: SX, x1: SX + 0.3, z0: z, z1: a, y0: SY - 0.3, y1: -0.04 }); } z = Math.max(z, b); }
    // and the sides of the two streets that climb beside it
    for (const w of plan.street.ways) if (w.road) { const zz = w.z0 < 0 ? w.z1 : w.z0; O.push({ x0: SX, x1: SX + w.run, z0: zz - 0.15, z1: zz + 0.15, y0: SY - 0.3, y1: -0.04 }); }
    
    // the stone cheeks of the great steps
    // (grounds.js makes them, and the other low walls out here, things that can be jumped up onto) 
  }
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
  plan.paved = [{ x0: G.michigan.x0, x1: SX + 0.3, z0: B.z0, z1: B.z1 }, { x0: SX, x1: SX + 5.7, z0: F.cz - F.steps, z1: F.cz + F.steps }, { x0: SX + 5.6, x1: F.PX, z0: F.cz - 3.4, z1: F.cz + 3.4 }, { x0: F.PX - 2.4, x1: F.PX, z0: F.cz - F.half, z1: F.cz + F.half }, { x0: SX, x1: SX + 12, z0: B.z0, z1: -24 }, { x0: SX, x1: SX + 12, z0: 244, z1: B.z1 }, { x0: SX, x1: 12, z0: nz - 3, z1: nz + 3 }, { x0: SX, x1: 12, z0: sz - 3, z1: sz + 3 }, { x0: B.x0, x1: B.x1, z0: G.monroe.z0, z1: G.monroe.z1 }, { x0: B.x0, x1: B.x1, z0: G.jackson.z0, z1: G.jackson.z1 }, { x0: G.columbus.x0, x1: G.columbus.x1, z0: B.z0, z1: B.z1 }];
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
  // It stands where it always has if that is still open ground, and otherwise on the nearest open ground to it.
  G.tree = { x: 160, z: 87.5, h: 11.5 };
  {
    const open = (x, z) => !inMass(x, z, 6.5) && Math.hypot(x - 141, z - 87) > 11 && !(x > G.rail.x0 - 6 && x < G.rail.x1 + 6) && x > B.x0 + 8 && x < G.columbus.x0 - 8 && z > G.monroe.z1 + 8 && z < G.jackson.z0 - 8;
    let best = null;
    for (let x = 130; x <= 270 && !open(G.tree.x, G.tree.z); x += 1) for (let z = -20; z <= 240; z += 1) {
      if (!open(x, z)) continue;
      const d = Math.hypot(x - 160, z - 87.5);
      if (!best || d < best.d) best = { x, z, d };
    }
    if (best) { G.tree.x = best.x; G.tree.z = best.z; const n = G.paths.length; path(best.x, best.x, CZ, best.z); path(137, best.x, CZ, CZ); plan.paved.push(...G.paths.slice(n)); }
  }
  G.plazas.push({ x: G.tree.x, z: G.tree.z, r: 5.6 });
  plan.paved.push({ x0: G.tree.x - 4, x1: G.tree.x + 4, z0: G.tree.z - 4, z1: G.tree.z + 4 });
  O.push({ x0: G.tree.x - 0.3, x1: G.tree.x + 0.3, z0: G.tree.z - 0.3, z1: G.tree.z + 0.3, y0: 0, y1: G.tree.h });
  O.push({ x0: G.tree.x - 2.1, x1: G.tree.x + 2.1, z0: G.tree.z - 2.1, z1: G.tree.z + 2.1, y0: 2.4, y1: 8 });        // the boughs: a car goes under them, a drone does not go through
  G.parcels = [[1.5, 0.4, 0.5, 0.36, 0xb3242b], [-1.2, 1.1, 0.42, 0.3, 0x1f6a3a], [0.3, -1.6, 0.6, 0.3, 0xc9a23a], [-1.7, -0.6, 0.36, 0.42, 0x1f4f8a], [1.0, 1.5, 0.34, 0.24, 0xe9e4d6]].map(([dx, dz, w, h, c]) => ({ x: G.tree.x + dx, z: G.tree.z + dz, w, h, c }));
  for (const b of G.parcels) O.push({ x0: b.x - b.w / 2, x1: b.x + b.w / 2, z0: b.z - b.w / 2, z1: b.z + b.w / 2, y0: 0, y1: b.h });
  // Fountains, drained for the winter.
  G.fountains.push({ kind: 'triton', x: 141, z: 87, r: 2.7, h: 3.6 }, { kind: 'bowl', x: 29.5, z: 12, r: 2.2, h: 1.9 });
  // A fountain is a round basin you can get into: a low rim to hop, the frozen water inside, and only what stands in the
  // middle of it solid. (It used to be one square block as tall as the whole thing.)
  for (const f of G.fountains) {
    const rimH = f.kind === 'triton' ? 0.6 : 0.5, n = 20, w = Math.PI * f.r / n + 0.04;
    for (let i = 0; i < n; i++) { const a = (i + 0.5) / n * Math.PI * 2, x = f.x + Math.cos(a) * (f.r - 0.1), z = f.z + Math.sin(a) * (f.r - 0.1); O.push({ x0: x - w, x1: x + w, z0: z - w, z1: z + w, y0: 0, y1: rimH - 0.07 }); plan.surfaces.push({ skin: 'wall', fixed: true, x0: x - w, x1: x + w, z0: z - w, z1: z + w, axis: null, h0: rimH, h1: rimH, base: 0 }); }
    const core = f.kind === 'triton' ? 0.95 : 0.45; O.push({ x0: f.x - core, x1: f.x + core, z0: f.z - core, z1: f.z + core, y0: 0, y1: f.h });
    if (f.kind === 'triton') for (let i = 0; i < 3; i++) { const a = i * 2.0944 + 0.5, x = f.x + Math.sin(a) * 1.5, z = f.z + Math.cos(a) * 1.5; O.push({ x0: x - 0.45, x1: x + 0.45, z0: z - 0.45, z1: z + 0.45, y0: 0, y1: 3 }); }
    const q = (f.r - 0.35) * 0.7; (plan.ice || (plan.ice = [])).push({ x0: f.x - q, x1: f.x + q, z0: f.z - q, z1: f.z + q });
  }
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
  G.snowmen = [[13.6, F.cz - 30.4, 1], [14.1, F.cz + 29.6, 0.82], [32.6, 21.6, 1.05], [39.2, 15.2, 0.8], [152.5, 82, 1.1], [166, 93.2, 0.78], [170.5, 79.4, 0.95], [243.5, 136.5, 1], [206.5, 161, 0.85], [41.2, 207.6, 1.1], [30.5, 187.5, 0.8]].map(([x, z, s]) => ({ x, z, s }));
  // One that a building now stands on has been rebuilt beside the tree.
  G.snowmen.filter(m => inMass(m.x, m.z, 0.6)).forEach((m, i) => { const a = 0.9 + i * 2.1; m.x = G.tree.x + Math.cos(a) * 7.5; m.z = G.tree.z + Math.sin(a) * 7.5; });
  const keepOff = (x, z) => G.paths.some(q => x > q.x0 - 0.9 && x < q.x1 + 0.9 && z > q.z0 - 0.9 && z < q.z1 + 0.9) || G.snowmen.some(m => Math.hypot(x - m.x, z - m.z) < 1.4)
    || G.fountains.some(f => Math.hypot(x - f.x, z - f.z) < f.r + 1.5) || G.sculpt.some(c => Math.hypot(x - c.x, z - c.z) < 3);

  // Trees, bare for the winter. Honey locusts in rows in the North Garden, hawthorns in a grid in the South, and a line along the avenue.
  const tree = (x, z, kind) => { if (inMass(x, z) || keepOff(x, z)) return; G.trees.push({ x, z, kind, s: 0.85 + ((x * 13 + z * 7) % 10) / 30, yaw: (x * 3 + z * 5) % 6.28 }); O.push({ x0: x - 0.16, x1: x + 0.16, z0: z - 0.16, z1: z + 0.16, y0: streetY(plan, x, z), y1: 5 }); };
  for (let x = 13; x <= 60; x += 7.8) for (let z = -11; z <= 49; z += 7.5) if (!(x > 28 && x < 48 && z > 10 && z < 36)) tree(x, z, 'locust');
  for (let x = 15; x <= G.south.x1 - 3; x += 6.4) for (let z = 172; z <= 237; z += 6.4) {
    if (x > G.pool.x0 - 3 && x < G.pool.x1 + 3 && z > G.pool.z0 - 3 && z < G.pool.z1 + 3) continue;
    if (Math.hypot(x - G.fountain.x, z - G.fountain.z) < 9) continue;
    tree(x, z, 'hawthorn');
  }
  for (let z = B.z0 + 10; z < B.z1 - 6; z += 13) if (Math.abs(z - F.cz) > F.lion + 3 && !(z > G.monroe.z0 - 2 && z < G.monroe.z1 + 2) && !(z > G.jackson.z0 - 2 && z < G.jackson.z1 + 2)) tree(3.4, z, 'locust');       // not in the mouths of the side streets
  // And a row along Columbus Drive, on the pavement's edge.
  for (let z = G.monroe.z1 + 8; z < G.jackson.z0 - 6; z += 12.5) if (Math.abs(z + 14) > 4.2 && Math.abs(z - 110) > 6) tree(G.columbus.x0 - 1.4, z, 'locust');      // not across the arch, nor the east door
  // Street trees in grates along the block's side of Monroe Street and Jackson Drive (streets.js draws the grates).
  for (let x = 51; x < G.columbus.x0 - 10; x += 23) if (!(x > G.rail.x0 - 8 && x < G.rail.x1 + 8)) { tree(x, G.monroe.z1 + 1.3, 'locust'); tree(x, G.jackson.z0 - 1.3, 'locust'); }
  // Low hedges round both gardens, with gaps to get in by.
  // A hedge stops you from the side, and its clipped top can be landed on and driven along.
  const hedge = (x0, x1, z0, z1) => { G.hedges.push({ x0, x1, z0, z1 }); O.push({ x0, x1, z0, z1, y0: 0, y1: 0.8 }); plan.surfaces.push({ skin: 'wall', fixed: true, x0: x0 - 0.05, x1: x1 + 0.05, z0: z0 - 0.05, z1: z1 + 0.05, axis: null, h0: 0.88, h1: 0.88, base: 0 }); };
  for (const g of [G.north, G.south]) {
    const mx = (g.x0 + g.x1) / 2, mz = (g.z0 + g.z1) / 2;
    hedge(g.x0, mx - 3, g.z0, g.z0 + 0.7); hedge(mx + 3, g.x1, g.z0, g.z0 + 0.7);
    hedge(g.x0, mx - 3, g.z1 - 0.7, g.z1); hedge(mx + 3, g.x1, g.z1 - 0.7, g.z1);
    hedge(g.x0, g.x0 + 0.7, g.z0, mz - 3); hedge(g.x0, g.x0 + 0.7, mz + 3, g.z1);
  }
  O.push({ x0: G.fountain.x - 3.2, x1: G.fountain.x + 3, z0: G.fountain.z - 4.4, z1: G.fountain.z + 4.4, y0: 0, y1: 5 });
  O.push({ x0: G.calder.x - 0.5, x1: G.calder.x + 0.5, z0: G.calder.z - 0.5, z1: G.calder.z + 0.5, y0: 0, y1: 4 });
  { const l = plan.facade; plan.outdoorArt.push({ x: 6.1, z: l.cz - l.lion, r: 6, text: 'Edward Kemeys, the lions. Wreathed for the season.' }, { x: 6.1, z: l.cz + l.lion, r: 6, text: 'Edward Kemeys, the lions. Wreathed for the season.', same: true }); }
  // A commuter train, stopped for the night in the cutting north of the bridge.
  const bridge = plan.masses.filter(q => q.x0 < G.rail.x1 && q.x1 > G.rail.x0).sort((a, b) => a.z0 - b.z0);
  G.railGaps = [];
  let z = B.z0;
  for (const q of bridge) { if (q.z0 - z > 1) G.railGaps.push([z, q.z0]); z = Math.max(z, q.z1); }
  if (B.z1 - z > 1) G.railGaps.push([z, B.z1]);
  // The cutting. The tracks lie well below the street between retaining walls; the museum's own
  // galleries bridge them, the two streets cross on bridges, and the garden path on a footbridge.
  // `open` are the stretches open to the sky, each with a service ramp up its east wall so that
  // nothing that drops in is stuck there: the ramp climbs towards `top` and lets out through the wall.
  {
    const R = G.rail, D = 4.4, x0 = R.x0 + 0.3, x1 = R.x1 - 0.3, RW = 2.0, RUN = 14.2, hall = bridge.length ? [Math.min(...bridge.map(q => q.z0)), Math.max(...bridge.map(q => q.z1))] : [0, 0];
    const C = R.cut = { x0, x1, y: -D, lane: x1 - RW, run: RUN, open: [] };
    const stretch = (z0, z1, top) => { if (z1 - z0 < RUN + 12) return; const up = top === z0 ? 1 : -1; C.open.push({ z0, z1, top, up, land: top + up * 2.6, foot: top + up * (2.6 + RUN) }); };
    stretch(G.monroe.z1 + 0.6, 16.6, 16.6); stretch(20.4, hall[0] - 3.9, 20.4); stretch(hall[1] + 4.3, G.jackson.z0 - 0.6, hall[1] + 4.3);
    // Tracks: two right through, and a third down the east side wherever the ramp is not.
    R.tracks = [x0 + 1.6, x0 + 4.7, x0 + 7.8];
    // Two trains laid up for the night.
    const s2 = C.open[1], s3 = C.open[2]; G.train = null; G.trains = [];
    if (s2) G.trains.push({ x: R.tracks[2], z0: s2.foot + 6, z1: s2.z1 - 1.5 });       // clear of the foot of the ramp
    if (s3) G.trains.push({ x: R.tracks[2], z0: s3.z0 + 30, z1: s3.z0 + 88 });       // both on the east siding: the other two tracks are running lines (railway.js)
    G.train = G.trains[0] || null;
    for (const t of G.trains) O.push({ x0: t.x - 1.5, x1: t.x + 1.5, z0: t.z0, z1: t.z1, y0: -D, y1: -D + 5 });
    // Walls. The sides hold the ground up and carry a balustrade; the ends are the bridges' abutments.
    const wall = (ax0, ax1, az0, az1, y1 = 0.95, y0 = -D - 0.4) => O.push({ x0: ax0, x1: ax1, z0: az0, z1: az1, y0, y1 });
    for (const s of C.open) {
      wall(R.x0, x0, s.z0, s.z1); wall(x0, x1, s.z0 - 0.3, s.z0); wall(x0, x1, s.z1, s.z1 + 0.3);
      const a = Math.min(s.top, s.land), b = Math.max(s.top, s.land);                 // the landing, where the east wall stands open
      wall(x1, R.x1, s.z0, a); wall(x1, R.x1, b, s.z1); wall(x1, R.x1, a, b, -0.06);
      // The ramp's own kerb, on the side of the drop, and across the head of the landing.
      wall(C.lane - 0.12, C.lane, a, b); wall(C.lane, x1, s.up > 0 ? a - 0.12 : b, s.up > 0 ? a : b + 0.12);
      for (let i = 0; i < 12; i++) { const za = s.land + s.up * RUN * i / 12, zb = s.land + s.up * RUN * (i + 1) / 12; wall(C.lane - 0.12, C.lane, Math.min(za, zb), Math.max(za, zb), -D * i / 12 + 0.4); }
    }
    plan.cut = C;
  }

  // The lions, either side of the way in, and lamps: along the avenue and by every door.
  plan.lions = []; plan.lamps = [];
  for (const sgn of [-1, 1]) {
    // On the two great blocks that end the steps, as they are.
    // At the foot of the steps, out by the pavement, on blocks about as tall as a person.
    const lion = { x: plan.street.x - 0.9, z: F.cz + sgn * F.lion, y: plan.street.y, h: 1.55 };
    plan.lions.push(lion);
    O.push({ x0: lion.x - 2.3, x1: lion.x + 2.3, z0: lion.z - 1.0, z1: lion.z + 1.0, y0: lion.y - 0.3, y1: 2.6 });
  }
  const lamp = (x, z) => { if (!inMass(x, z, 0.3)) plan.lamps.push({ x, z }); };
  for (let zz = B.z0 + 16; zz < B.z1 - 6; zz += 26) lamp(1.7, zz + (Math.abs(zz - F.cz) < 3 ? 6 : 0));
  for (const d of plan.doors) if (d.out && !d.vent) {
    const r = plan.byId[d.a], cx = (d.x0 + d.x1) / 2, cz = (d.z0 + d.z1) / 2;
    if (d === plan.front) continue;                      // the front door has its own lamp standards (grounds.js)
    if (d.along === 'x') { const w = d.x0 < r.x0, ex = w ? d.x0 - 2.2 : d.x1 + 2.2; for (const sg of [-1, 1]) lamp(ex, cz + sg * (d === plan.front ? 6.6 : 3)); }
    else { const n = d.z0 < r.z0, ez = n ? d.z0 - 2.2 : d.z1 + 2.2; for (const sg of [-1, 1]) lamp(cx + sg * 3, ez); }
  }
}

// East of Columbus Drive: Butler Field under snow with the band shell in its corner, Lake Shore
// Drive, the promenade, and Monroe Harbor frozen out as far as the mooring buoys. The park is
// about 190 m deep here where the real one is nearer 330: the order of things is kept, not the size.
function addLakefront(plan) {
  const B = plan.bounds, G = plan.grounds, O = plan.obstacles, C = G.columbus, S = plan.surfaces;
  const z0 = G.monroe.z1, z1 = G.jackson.z0;
  const L = plan.lakefront = {
    field: { x0: C.x1, x1: 480, z0, z1 }, lsd: { x0: 480, x1: 514, med: [494.5, 499.5] }, prom: { x0: 514, x1: 528 },
    shore: 530, buoys: 575, slip: [104, 116], shell: { x0: 304, x1: 328, z0: 220, z1: 232, h: 1.1 },
    breakwater: { x0: 600, x1: 605, z0: 44, z1: 200 }, light: { x: 602.5, z: 46 },
    paths: [], cars: [], hills: [[352, 48, 17, 4.5, 14], [436, 178, 21, 6.5, 17]],
  };
  // Clear ice over the fishing hole (icefish.js): the harbour ice and the snow under it are left open here, and the
  // water, the weed and the fish are drawn below.
  { const fx = (L.shore + L.buoys) / 2 - 2.5, fz = 122; L.fish = { x: fx, z: fz }; L.window = { x0: fx - 4, x1: fx + 4, z0: fz - 4, z1: fz + 4 }; }
  // Paths shovelled across the field, and the roads and the promenade.
  const PW = 1.5, path = q => { L.paths.push(q); plan.paved.push(q); };
  path({ x0: C.x1, x1: L.lsd.x0, z0: 110 - PW, z1: 110 + PW }); path({ x0: 387 - PW, x1: 387 + PW, z0, z1 });
  path({ x0: 328, x1: 387 - PW, z0: 214 - PW, z1: 214 + PW });                         // from the cross path to the band shell
  plan.paved.push({ x0: L.lsd.x0, x1: L.lsd.med[0], z0: B.z0, z1: B.z1 }, { x0: L.lsd.med[1], x1: L.lsd.x1, z0: B.z0, z1: B.z1 }, { x0: L.prom.x0, x1: L.shore, z0: B.z0, z1: B.z1 });
  plan.paved.push({ x0: L.buoys, x1: B.x1 + 400, z0: B.z0 - 400, z1: B.z1 + 400 });   // open water: nothing glitters or takes a tyre track there
  plan.ice.push({ x0: L.shore, x1: L.buoys, z0: B.z0, z1: B.z1 });                    // the harbour, frozen as far as the buoys
  // The revetment along the water, with the slipway through it; the line of buoys where the ice gives out; the breakwater.
  O.push({ x0: L.prom.x1, x1: L.shore, z0: B.z0, z1: L.slip[0], y0: -0.3, y1: 0.5 }, { x0: L.prom.x1, x1: L.shore, z0: L.slip[1], z1: B.z1, y0: -0.3, y1: 0.5 });
  O.push({ x0: L.buoys, x1: L.buoys + 0.5, z0: B.z0, z1: B.z1, y0: -0.3, y1: 0.7 });
  O.push({ ...L.breakwater, y0: -0.3, y1: 1.3 });
  // The band shell: a stone stage facing north across the lawn, a ramp of somebody's plywood up its west end, and a kicker on its lip.
  const sh = L.shell;
  S.push({ skin: 'stone', x0: sh.x0, x1: sh.x1, z0: sh.z0, z1: sh.z1, axis: null, h0: sh.h, h1: sh.h });
  S.push({ skin: 'ply', x0: sh.x0 - 8, x1: sh.x0 + 0.4, z0: sh.z0 + 0.4, z1: sh.z0 + 5.6, axis: 'x', h0: 0, h1: sh.h + 0.08, thick: 0.1, posts: true });
  S.push({ skin: 'ply', x0: 312, x1: 320, z0: sh.z0, z1: sh.z0 + 3.4, axis: 'z', h0: sh.h + 0.75, h1: sh.h, base: sh.h });
  O.push({ x0: sh.x0 - 1.2, x1: sh.x1 + 1.2, z0: sh.z1, z1: sh.z1 + 1.2, y0: 0, y1: 8 });
  for (const x of [sh.x0 - 0.9, sh.x1 + 0.3]) O.push({ x0: x, x1: x + 0.6, z0: sh.z0 + 6, z1: sh.z1, y0: sh.h, y1: 8 });
  plan.paved.push({ x0: sh.x0 - 9, x1: sh.x1 + 2, z0: sh.z0 - 1, z1: sh.z1 + 2 });
  // Elms along the field's edges.
  const clearOf = (x, z) => !L.paths.some(q => x > q.x0 - 2.5 && x < q.x1 + 2.5 && z > q.z0 - 2.5 && z < q.z1 + 2.5) && !(x > sh.x0 - 12 && x < sh.x1 + 6 && z > sh.z0 - 8);
  const elm = (x, z) => { if (!clearOf(x, z)) return; G.trees.push({ x, z, kind: 'elm', s: 1.15 + ((x * 13 + z * 7) % 10) / 28, yaw: (x * 3 + z * 5) % 6.28 }); O.push({ x0: x - 0.18, x1: x + 0.18, z0: z - 0.18, z1: z + 0.18, y0: 0, y1: 5 }); };
  for (let x = 304; x <= 472; x += 14) { elm(x, z0 + 5); elm(x, z1 - 5); }
  for (let z = z0 + 19; z <= z1 - 19; z += 14) { elm(473, z); elm(301, z); }
  for (let z = B.z0 + 14; z < B.z1 - 6; z += 22) elm((L.lsd.med[0] + L.lsd.med[1]) / 2, z);
  // Lamps down the middle of the Drive and along the promenade.
  for (let z = B.z0 + 25; z < B.z1 - 6; z += 44) { plan.lamps.push({ x: 497, z }, { x: 521, z: z + 22 > B.z1 - 4 ? z - 22 : z + 22 }); }
  plan.reserved.push({ x0: C.x1, x1: B.x1, z0: B.z0, z1: B.z1 });
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
// side from its middle, `v` across it, and heights are measured up from the
// room's own floor. That way one description of a half-pipe fits whichever way
// a real gallery happens to lie, and whichever level it is on. A piece remembers
// the floor it stands on as its `base`.

// Is this piece on the level whose floor is at y? What is built into the building (a stair, a
// balcony) counts wherever it comes within reach of that floor.
// And how much of the floor at y it takes up: all of its own outline, except a stair going down, which takes only the hole it goes down through.
const foot = (s, y) => (s.ramp && s.ramp.wells && s.ramp.wells.find(w => same(w.y, y))) || s;
const onLevel = (s, y) => s.fixed ? bottom(s, Math.min(s.h0, s.h1)) < y + 3 && Math.max(s.h0, s.h1) > y - 0.1 : Math.abs((s.base || 0) - y) < 0.6;

function frame(r) {
  const lx = r.x1 - r.x0, lz = r.z1 - r.z0;
  return { r, y: r.y, ax: lx >= lz ? 'x' : 'z', cx: (r.x0 + r.x1) / 2, cz: (r.z0 + r.z1) / 2, L: Math.max(lx, lz), W: Math.min(lx, lz) };
}

function addStunts(plan) {
  const S = plan.surfaces, L = plan.loops = [], D = plan.decals = [], H = plan.hoops = [], P = plan.props = [];
  plan.puddles = []; plan.benches = [];
  const world = (F, u0, u1, v0, v1) => F.ax === 'x' ? [F.cx + u0, F.cx + u1, F.cz + v0, F.cz + v1] : [F.cx + v0, F.cx + v1, F.cz + u0, F.cz + u1];
  const at = (F, u, v) => F.ax === 'x' ? [F.cx + u, F.cz + v] : [F.cx + v, F.cz + u];
  const other = a => (a === 'x' ? 'z' : 'x');
  const push = (skin, rect, axis, h0, h1, o = {}, Y = 0) => { const s = { skin, x0: rect[0], x1: rect[1], z0: rect[2], z1: rect[3], axis, h0: h0 + Y, h1: h1 + Y, thick: 0, base: Y, ...o }; if (o.onTop != null) s.onTop = o.onTop + Y; S.push(s); return s; };
  const ramp = (F, u0, u1, v0, v1, hA, hB, o, skin = 'ply') => push(skin, world(F, u0, u1, v0, v1), F.ax, hA, hB, o, F.y || 0);         // slopes along u
  const rampV = (F, u0, u1, v0, v1, hA, hB, o, skin = 'ply') => push(skin, world(F, u0, u1, v0, v1), other(F.ax), hA, hB, o, F.y || 0);  // slopes along v
  const flat = (F, u0, u1, v0, v1, h, o, skin = 'ply') => push(skin, world(F, u0, u1, v0, v1), null, h, h, o, F.y || 0);
  const hoop = (F, u, v, y, dir = 'u', r = 0.8) => { const [x, z] = at(F, u, v); H.push({ x, y: y + (F.y || 0), z, axis: dir === 'y' ? 'y' : dir === 'u' ? F.ax : other(F.ax), r }); };
  const decal = (F, u0, u1, v0, v1, dir) => { const [x0, x1, z0, z1] = world(F, u0, u1, v0, v1); D.push({ x0, x1, z0, z1, y: F.y || 0, axis: F.ax, dir }); };
  const cone = (F, u, v) => { const [x, z] = at(F, u, v); P.push({ type: 'cone', x, y: F.y || 0, z }); };

  // Would this patch of floor sit in a doorway's path?
  const lanes = r => plan.doorsOf(r.id).filter(d => same(d.y, r.y)).map(d => {
    const into = 3.2, w = 0.5;
    if (d.along === 'z') { const south = d.z0 >= r.z1 - 0.01; return { x0: d.x0 - w, x1: d.x1 + w, z0: south ? r.z1 - into : r.z0, z1: south ? r.z1 : r.z0 + into }; }
    const east = d.x0 >= r.x1 - 0.01; return { x0: east ? r.x1 - into : r.x0, x1: east ? r.x1 : r.x0 + into, z0: d.z0 - w, z1: d.z1 + w };
  });
  const hits = (a, b, m = 0) => a[0] < b.x1 + m && a[1] > b.x0 - m && a[2] < b.z1 + m && a[3] > b.z0 - m;
  // The racing line is kept clear of everything except the jumps put on it on purpose.
  // (It runs on one level, and only that level's rooms need keep clear of it.)
  const line = plan.line = sampleRoute(buildRoute(plan), 1).pts;
  const lineY = plan.lineY = (plan.byId[RING.find(id => plan.byId[id])] || { y: 0 }).y;
  const onLine = (rect, m, y) => same(y, lineY) && line.some(p => p.x > rect[0] - m && p.x < rect[1] + m && p.z > rect[2] - m && p.z < rect[3] + m);
  // Room to breathe: a piece either stands hard against a wall or another piece, or it leaves
  // at least GAP of clear floor. Nothing is left that a car could wedge itself into.
  const GAP = 1.7;
  const free = (F, u0, u1, v0, v1, m = GAP, flush = false) => {
    if (u0 < -F.L / 2 + 0.2 || u1 > F.L / 2 - 0.2 || v0 < -F.W / 2 - 0.01 || v1 > F.W / 2 + 0.01) return false;
    if (!flush && F.r && (u0 < -F.L / 2 + GAP || u1 > F.L / 2 - GAP || v0 < -F.W / 2 + GAP || v1 > F.W / 2 - GAP)) return false;
    const rect = world(F, u0, u1, v0, v1);
    if (!F.onLine && onLine(rect, 1.3, F.y || 0)) return false;
    if (plan.lifts.some(l => l.stops[0] < (F.y || 0) + 3 && l.stops[l.stops.length - 1] > (F.y || 0) - 0.1 && hits(rect, l, m))) return false;      // nothing in a lift shaft
    return !F.lanes.some(l => hits(rect, l)) && !S.some(s => onLevel(s, F.y || 0) && hits(rect, foot(s, F.y || 0), m));
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
    plan.obstacles.push({ x0: t.x0, x1: t.x1, z0: t.z0, z1: t.z1, y0: F.y + 0.72 - 0.17, y1: F.y + 0.72 - 0.08, kit: true });      // the apron: low enough that a car cresting the ramp clears it
    for (const lx of [t.x0 + 0.08, t.x1 - 0.08]) for (const lz of [t.z0 + 0.08, t.z1 - 0.08]) plan.obstacles.push({ x0: lx - 0.035, x1: lx + 0.035, z0: lz - 0.035, z1: lz + 0.035, y0: F.y, y1: F.y + 0.66, leg: true, kit: true });
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
  // A tabletop: a straight ramp up, a flat deck to land on or roll across, a straight ramp down. (It was a spine, two
  // skate ramps back to back meeting in a ridge; a ridge is no place to land a toy car.)
  const spine = (F, u, v, R = 2.2, run = 1.9, w = 2.6) => {
    const H = R - Math.sqrt(R * R - run * run), top = 1.8, a = u - top / 2, b = u + top / 2;
    if (!free(F, a - run, b + run, v - w / 2, v + w / 2)) return false;
    ramp(F, a - run, a, v - w / 2, v + w / 2, 0, H);
    ramp(F, a, b, v - w / 2, v + w / 2, H, H);
    ramp(F, b, b + run, v - w / 2, v + w / 2, H, 0);
    hoop(F, u, v, H + 1.5, 'u', 0.95);
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
      const F = { ax: Math.abs(dx) > Math.abs(dz) ? 'x' : 'z', y: lineY, cx: (a.x + b.x) / 2, cz: (a.z + b.z) / 2, L: d - 1.5, W: 6, lanes: [], onLine: true, r: null };
      // Only where the whole jump stands on one room's floor: a line that runs along a wall, or through one, gets none.
      const within = plan.rooms.find(r => Math.abs(r.y - lineY) < 0.1 && F.cx > r.x0 && F.cx < r.x1 && F.cz > r.z0 && F.cz < r.z1), half = 1.5;
      if (!within || (F.ax === 'z' ? F.cx - half < within.x0 || F.cx + half > within.x1 || F.cz - 3 < within.z0 || F.cz + 3 > within.z1 : F.cz - half < within.z0 || F.cz + half > within.z1 || F.cx - 3 < within.x0 || F.cx + 3 > within.x1)) continue;
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
    const N = hall.z1, lane = [hall.x0 + 2.1, hall.x0 + 3.4];       // down the west side: the court's own stair climbs the east wall
    // A piece from s0 to s1 metres north of the hall's south wall, at height hA rising (or falling) to hB.
    const sky = (s0, s1, hA, hB, o = {}) => push('track', [lane[0], lane[1], N - s1, N - s0], hA === hB ? null : 'z', hB, hA, { thick: 0.07, hang: true, run: 'z', lip: true, ...o }, hall.y);
    sky(5, 16, 0, 2.6, { ease: true }); sky(16, 22, 2.6, 2.6);
    sky(24.6, 31, 1.9, 1.9); sky(31, 33.6, 1.9, 2.6, { curve: 5.2 });
    sky(36.4, 43, 2.6, 2.6); sky(43, 49, 2.6, 1.4, { ease: true }); sky(49, 51.4, 1.4, 2.05, { curve: 4.8 });
    D.push({ x0: lane[0] + 0.2, x1: lane[1] - 0.2, z0: N - 5, z1: N - 1.5, y: hall.y, axis: 'z', dir: -1 });
    const lx = (lane[0] + lane[1]) / 2;
    for (const [s, y, r] of [[23.3, 2.55, 0.8], [35, 2.95, 0.8], [53.8, 2.5, 0.9], [57, 1.7, 0.95]]) H.push({ x: lx, y: y + hall.y, z: N - s, axis: 'z', r });
    // Two ledges beside the track to hop across to, and one hung out in the middle of the hall, to look from.
    push('track', [hall.x0 + 0.3, lane[0] - 0.25, N - 21.5, N - 17], null, 2.6, 2.6, { thick: 0.07, hang: true, run: 'z', perch: 'skyway ledge' }, hall.y);
    push('track', [lane[1] + 0.25, lane[1] + 2.4, N - 42.5, N - 37.5], null, 2.6, 2.6, { thick: 0.07, hang: true, run: 'z', perch: 'crow’s nest' }, hall.y);
  }

  // Two spines down the middle of Griffin Court.
  spine(HF, -12, -2.2); spine(HF, 14, -2.2);

  // ---- the Grand Staircase (Gallery 200) ----
  // The stair is the real one now (see addLevels). What the plywood adds: a kicker on the landing,
  // aimed back down the middle flight, a hoop hung over the steps, and arrows on the floor at the foot.
  const g200 = plan.byId.G200;
  if (g200) {
    const F = frame(g200); F.lanes = lanes(g200);
    const up = plan.ramps.find(q => q.room === g200.id && q.stairs && same(Math.min(q.y0, q.y1), g200.y)), land = up && plan.decks.find(d => d.room === g200.id && same(d.y, Math.max(up.y0, up.y1)));
    if (up && land && up.axis === 'x' && up.y1 > up.y0) {
      const zc = (up.z0 + up.z1) / 2, LH = land.y;
      push('ply', [up.x1, up.x1 + 2.1, zc - 0.9, zc + 0.9], 'x', LH + 0.36, LH, { thick: 0.4, onTop: LH - 0 }, 0);
      H.push({ x: (up.x0 + up.x1) / 2 + 1, y: (up.y0 + up.y1) / 2 + 1.9, z: zc, axis: 'x', r: 0.9 });
      D.push({ x0: up.x0 - 3.6, x1: up.x0 - 0.2, z0: zc - 1.2, z1: zc + 1.2, y: g200.y, axis: 'x', dir: 1 });
      land.surface.perch = 'staircase landing';
    }
    // Somebody mopped. The floor here really is slippery, and nothing is fixed down.
    const [px, pz] = at(F, -(F.L / 2 - 4.6), 5.5), puddle = { x: px, y: g200.y, z: pz, r: 2.2 };
    plan.puddles.push(puddle);
    for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2 + 0.4; P.push({ type: 'cone', x: px + Math.cos(a) * 2.65, y: g200.y, z: pz + Math.sin(a) * 2.65 }); }
    P.push({ type: 'sign', x: px - 2.1, y: g200.y, z: pz - 2.1, yaw: 0.6 }, { type: 'sign', x: px + 2.3, y: g200.y, z: pz + 1.9, yaw: -2.4 });
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
    if (r.kind !== 'gallery' || r === g200 || r.passage) continue;
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
      plan.benches.push({ x: bx, y: r.y, z: bz, alongX });
      const hxx = alongX ? 1.4 : 0.38, hzz = alongX ? 0.38 : 1.4;
      S.push({ skin: 'bench', x0: bx - hxx, x1: bx + hxx, z0: bz - hzz, z1: bz + hzz, axis: null, h0: r.y + 0.5, h1: r.y + 0.5, thick: 0.1, base: r.y });
    }
  }

  // ---- outside ----
  // On the open ground south of the bridge: the loop, a big curved launcher, a
  // line of jumps. Snow is slippery; the track laid on it is not.
  const clearOutside = (x0, x1, z0, z1) => [...plan.masses, ...plan.reserved].every(m => x1 < m.x0 - 1 || x0 > m.x1 + 1 || z1 < m.z0 - 1 || z0 > m.z1 + 1);
  let park = null;
  // The nearest clear rectangle to the middle of the grounds.
  const B = plan.bounds, mx = (B.x0 + B.cx1) / 2, mz = (B.z0 + B.z1) / 2;
  let bestD = Infinity;
  for (let z = B.z0 + 4; z <= B.z1 - 24; z += 2) for (let x = B.x0 + 4; x <= B.cx1 - 48; x += 2) {
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
    // Only where there is open ground for it: the buildings have grown since these paths were first walked.
    const fx = axis === 'x' ? run : w, fz = axis === 'x' ? w : run;
    if (plan.masses.some(m => x + fx > m.x0 - 0.5 && x - fx < m.x1 + 0.5 && z + fz > m.z0 - 0.5 && z - fz < m.z1 + 0.5)) return;
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
  // Where it was if that is still open snow; otherwise the nearest open snow to there.
  const fits = (x, z) => clear(x - rink.rx - 1, x + rink.rx + 1, z - rink.rz - 3.5, z + rink.rz + 1);
  if (!fits(rink.x, rink.z)) {
    let best = null;
    for (let x = 20; x <= 260; x += 1) for (let z = -24; z <= 236; z += 0.5) {
      const d = Math.hypot(x - 88, z + 6);
      if ((!best || d < best.d) && fits(x, z)) best = { x, z, d };
    }
    if (best) { rink.x = best.x; rink.z = best.z; }
  }
  if (fits(rink.x, rink.z)) {
    plan.rink = rink;
    plan.ice.push({ x0: rink.x - rink.rx * 0.9, x1: rink.x + rink.rx * 0.9, z0: rink.z - rink.rz * 0.8, z1: rink.z + rink.rz * 0.8 });
  }
  const hill = (cx, cz, r, H, rz = r) => {
    if (!clear(cx - r, cx + r, cz - rz, cz + rz)) return;
    const s = { skin: 'hill', hill: true, axis: 'hill', cx, cz, rx: r, rz, H, x0: cx - r, x1: cx + r, z0: cz - rz, z1: cz + rz, h0: 0, h1: H, thick: 0 };
    if (H >= 5) { s.bump = 0.9; s.br = 2.6; }
    S.push(s); plan.hills.push(s);
  };
  // The ski jump: a long bank of packed snow run up against the north wall of the galleries over the
  // railway, standing higher than their roof at the top. Take it flat out and you come down on the roof.
  {
    const g = plan.massOf.G240;
    if (g && g.room.sky) {
      const H = g.top + 1.7, xa = g.x0 + 10.2, xb = xa + 4.6, zb = g.z0 - 3.2, za = zb - Math.max(28, Math.min(44, H * 2.9));       // east of the open skylight, so that you land on roof and not in the hole
      if (clear(xa, xb, za, zb, 0.6)) {
        S.push({ skin: 'snow', x0: xa, x1: xb, z0: za, z1: zb, axis: 'z', h0: 0, h1: H, thick: 0, jump: true });
        plan.paved.push({ x0: xa, x1: xb, z0: za - 12, z1: zb });
        plan.decals.push({ x0: (xa + xb) / 2 - 0.6, x1: (xa + xb) / 2 + 0.6, z0: za - 9, z1: za - 0.2, y: 0, axis: 'z', dir: 1 });
        plan.skiJump = { x: (xa + xb) / 2, z0: za, z1: zb, H, roof: g.top };
      }
    }
  }
  // Two big ones...
  hill(88, 38, 15, 6.5, 13); hill(240, 224, 20, 8.5, 17);
  for (const h of (plan.lakefront && plan.lakefront.hills) || []) hill(...h);        // out on Butler Field
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
    // A block's roof is only where no taller block stands on the same ground: over a room with another room on top of it there is no roof at all.
    const taller = plan.masses.filter(o => o !== m && o.top > m.top + 0.05 && o.x0 < m.x1 && o.x1 > m.x0 && o.z0 < m.z1 && o.z1 > m.z0);
    const k = r && plan.skylights.find(q => q.room === r.id);
    m.roofs = carve(m, k ? [k, ...taller] : taller);
    for (const q of m.roofs) roof(q.x0, q.x1, q.z0, q.z1, m.top);
    m.glass = null;
    if (r && r.kind === 'gallery' && r.sky && !k) {
      const w = r.x1 - r.x0, d = r.z1 - r.z0, g = { x0: r.x0 + w * 0.27 - 0.2, x1: r.x1 - w * 0.27 + 0.2, z0: r.z0 + d * 0.27 - 0.2, z1: r.z1 - d * 0.27 + 0.2 };
      if (Math.min(w, d) >= 8.5 && !(plan.terrace && plan.terrace.room === r.id) && !taller.some(o => o.x0 < g.x1 + 0.5 && o.x1 > g.x0 - 0.5 && o.z0 < g.z1 + 0.5 && o.z1 > g.z0 - 0.5)) { m.glass = g; roof(g.x0, g.x1, g.z0, g.z1, m.top + 0.32, { skin: 'roofglass', thick: 0.32 }); }
    }
  }
  // The scaffold: flights of planking up the south wall of Gallery 211, turn and turn about, and a
  // landing level with its roof. The roof is two storeys up, so there are four flights, in two lanes.
  const g = plan.terrace && plan.massOf[plan.terrace.room];
  if (g) {
    const z = g.z1, top = g.top + 0.02, x0 = g.x0 + 0.3, x1 = g.x1 - 0.1, n = Math.max(2, 2 * Math.ceil(top / 7.5)), rise = top / n;
    const A = [z + 2.6, z + 4.6], B = [z + 0.2, z + 2.2];                                // the outer lane and the one against the wall
    const piece = (rect, axis, h0, h1, o = {}) => { const s = { skin: 'ply', x0: rect[0], x1: rect[1], z0: rect[2], z1: rect[3], axis, h0, h1, thick: 0.1, posts: true, ...o }; S.push(s); if (Math.min(h0, h1) < 0.5) plan.paved.push(s); return s; };
    // Guard rails, so that the turns can be taken at speed. A rail on a slope is a run of short level lengths.
    const O = plan.obstacles, rail = (rx0, rx1, rz0, rz1, lo, hi) => O.push({ x0: rx0, x1: rx1, z0: rz0, z1: rz1, y0: lo + 0.03, y1: hi + 0.38, rail: true, kit: true });
    const sloped = (xa, xb, zr, ha, hb) => { for (let i = 0; i < 10; i++) { const p = xa + (xb - xa) * i / 10, q = xa + (xb - xa) * (i + 1) / 10, hp = ha + (hb - ha) * i / 10, hq = ha + (hb - ha) * (i + 1) / 10; rail(p, q, zr, zr + 0.06, Math.min(hp, hq), Math.max(hp, hq)); } };
    for (let i = 0; i < n; i++) {
      const lo = rise * i, hi = rise * (i + 1), last = i === n - 1;
      if (i % 2 === 0) {
        piece([x0, x1, A[0], A[1]], 'x', hi, lo);                                        // up from the east end, going west
        sloped(x0, x1, A[1], hi, lo); sloped(x0, x1, A[0] - 0.06, hi, lo);
        piece([x0 - 2.6, x0, B[0], A[1]], null, hi, hi);                                 // the turn at the west end
        rail(x0 - 2.66, x0 - 2.6, B[0], A[1] + 0.06, hi, hi); rail(x0 - 2.6, x0, A[1], A[1] + 0.06, hi, hi); rail(x0 - 2.6, x0, B[0] - 0.06, B[0], hi, hi);
      } else {
        const xe = last ? x1 - 3.4 : x1;
        piece([x0, xe, B[0], B[1]], 'x', lo, hi);                                        // back east
        sloped(x0, xe, B[1], lo, hi);
        if (last) {
          piece([x1 - 3.4, x1, z - 1.2, B[1]], null, top, top, { perch: 'scaffold' });   // and onto the roof
          rail(x1, x1 + 0.06, z, B[1], top, top); rail(x1 - 3.4, x1, B[1], B[1] + 0.06, top, top);
        } else {
          piece([x1, x1 + 2.6, B[0], A[1]], null, hi, hi);                               // the turn at the east end, over the way on
          rail(x1 + 2.6, x1 + 2.66, B[0], A[1] + 0.06, hi, hi); rail(x1, x1 + 2.6, A[1], A[1] + 0.06, hi, hi); rail(x1, x1 + 2.6, B[0] - 0.06, B[0], hi, hi);
        }
      }
    }
    plan.scaffold = { x: x1 + 1.5, z: z + 3.6, top, flights: n };
    plan.decals.push({ x0: x1, x1: x1 + 4, z0: z + 3.0, z1: z + 4.2, y: 0, axis: 'x', dir: -1 });
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
  // A big one has a kicker of packed snow on the very top, to leave the ground from.
  if (s.hill) {
    const d = Math.hypot((x - s.cx) / s.rx, (z - s.cz) / s.rz);
    if (d >= 1) return 0;
    let h = s.H * (Math.cos(d * Math.PI) + 1) / 2;
    if (s.bump) { const b = Math.hypot(x - s.cx, z - s.cz) / s.br; if (b < 1) h += s.bump * (Math.cos(b * Math.PI) + 1) / 2; }
    return h;
  }
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

// Is (x, z) over a hole in the floor that is at height y: a stair well, a lift shaft?
function inWell(plan, x, z, y) {
  for (const w of plan.wells) if (x > w.x0 && x < w.x1 && z > w.z0 && z < w.z1 && same(w.y, y)) return true;
  return false;
}

// A shaft that goes down through the ground from above it has no street in it: only its own floor, far below.
// How high the open ground is at (x, z): the museum's floor level, or the avenue below it, or part
// of the way up between the two.
export function streetY(plan, x, z) {
  { const C = plan.cut; if (C && x > C.x0 && x < C.x1) for (const s of C.open) if (z > s.z0 && z < s.z1) {      // down in the railway cutting
    if (x < C.lane) return C.y;
    const d = (z - s.land) * s.up;                       // on the service ramp: level at the top, then down
    return d <= 0 ? ((z - s.top) * s.up >= 0 ? 0 : C.y) : d >= C.run ? C.y : C.y * d / C.run;
  } }
  const S = plan.street; if (!S || x >= S.x + S.reach) return 0;
  if (x <= S.x) return S.y;
  for (const w of S.ways) if (z > w.z0 && z < w.z1) {
    const d = x - S.x; if (d >= w.run) return 0;
    // Real steps are steps: each tread is level. Between them, in places, a plain ramp for anything on wheels.
    if (w.stairs && !(w.ramps && w.ramps.some(q => z > q[0] && z < q[1]))) {
      const n = w.stairs, tread = 0.45, i = w.land ? (d < w.land[0] ? Math.floor(d / tread) : d < w.land[1] ? n / 2 - 1 : n / 2 + Math.floor((d - w.land[1]) / tread)) : Math.floor(d / tread);
      return S.y * (1 - Math.min(n, i + 1) / n);
    }
    if (!w.land || w.ramps) return S.y * (1 - d / w.run);
    const [a, b] = w.land;                               // half way up, a landing
    return S.y * (d < a ? 1 - 0.5 * d / a : d < b ? 0.5 : 0.5 - 0.5 * (d - b) / (w.run - b));
  }
  return 0;
}

function inPit(plan, x, z) {
  for (const r of plan.pits) if (x > r.x0 && x < r.x1 && z > r.z0 && z < r.z1) return true;
  return false;
}

// The highest thing under (x, z) that something at height y could be standing on: the floor of the
// room on that level, the street, or a piece of the kit or the building. A floor a storey up is not
// under you, and neither is one you have dropped below.
// `sticky` is the piece already under the wheels: it stays underfoot however steeply it climbs.
export function groundAt(plan, x, z, y, step = STEP, sticky = null) {
  let g = -Infinity, under = null;
  for (const f of plan.floors) if (f.y > g && f.y <= y + step && x >= f.x0 && x <= f.x1 && z >= f.z0 && z <= f.z1 && !inWell(plan, x, z, f.y)) g = f.y;
  const sy = streetY(plan, x, z);
  if (g < sy && y + step >= sy && !inWell(plan, x, z, 0) && !inPit(plan, x, z)) g = sy;      // the street, and the snow
  for (const list of y > 2 && plan.roofs ? [plan.surfaces, plan.roofs] : [plan.surfaces]) for (const s of list) {
    if (plan.racing && !s.line && s.skin !== 'bench' && !s.roof && !s.fixed) continue;        // in a race, only what is on the track is there
    if (x < s.x0 || x > s.x1 || z < s.z0 || z > s.z1) continue;
    const h = heightOf(s, x, z);
    if ((h <= y + step || (s.hill && y > -1) || (s === sticky && h <= y + 1.6)) && h > g) { g = h; under = s; }      // a hill is ground at any height: there is no under it (short of being in a cellar)
  }
  plan.under = under;          // which piece that was, for whoever just asked
  if (g === -Infinity) { g = sy > y + 0.5 && plan.street && x < plan.street.x + plan.street.reach ? plan.street.y : sy; for (const f of plan.floors) if (f.y < g && x >= f.x0 && x <= f.x1 && z >= f.z0 && z <= f.z1) g = f.y; }      // below everything: the lowest floor there is here
  return g;
}

// Is there a solid piece here standing taller than something at height y can climb?
// A slab (a table top, a balcony) is only in the way of something level with it; a solid piece only
// of something no lower than the floor it stands on.
export function wallAt(plan, x, z, y, step = STEP, ignore = null) {
  for (const list of y > 2 && plan.roofs ? [plan.surfaces, plan.roofs] : [plan.surfaces]) for (const s of list) {
    if (s === ignore || s.hill || (plan.racing && !s.line && s.skin !== 'bench' && !s.roof && !s.fixed)) continue;      // and never a wall
    if (x < s.x0 || x > s.x1 || z < s.z0 || z > s.z1) continue;
    const h = heightOf(s, x, z);
    if (h <= y + step) continue;
    if (s.thick ? h - s.thick < y + 0.24 : (s.base || 0) < y + 0.24) return true;
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

// A picture never hangs behind a ramp. If part of the stunt kit (or a stair) stands against the
// wall here, `need` is how high above the floor the bottom of a frame must be to clear it; and if a
// balcony or a bridge runs along the wall overhead, `cap` is how high the top of a frame may come.
function clearance(plan, wall, u0, u1) {
  const depth = 2.5, r = wall.room;
  const zone = wall.horiz
    ? { x0: u0 - 0.3, x1: u1 + 0.3, z0: wall.nz > 0 ? r.z0 : r.z1 - depth, z1: wall.nz > 0 ? r.z0 + depth : r.z1 }
    : { x0: wall.nx > 0 ? r.x0 : r.x1 - depth, x1: wall.nx > 0 ? r.x0 + depth : r.x1, z0: u0 - 0.3, z1: u1 + 0.3 };
  let need = 0, cap = r.h - 0.3;
  for (const s of plan.surfaces) {
    const f = foot(s, r.y);
    if (s.skin === 'bench' || !onLevel(s, r.y) || f.x1 <= zone.x0 || f.x0 >= zone.x1 || f.z1 <= zone.z0 || f.z0 >= zone.z1) continue;
    const top = Math.max(s.h0, s.h1) - r.y, under = bottom(s, Math.min(s.h0, s.h1)) - r.y;
    if (s.fixed && under > 1.9) { cap = Math.min(cap, under - 0.15); continue; }
    if (s.thick && top - s.thick > 1.9) continue;        // track hung well overhead hides nothing
    need = Math.max(need, top + 0.5);
  }
  for (const l of plan.lifts) if (l.stops[0] < r.top && l.stops[l.stops.length - 1] > r.y - 0.1 && l.x1 > zone.x0 && l.x0 < zone.x1 && l.z1 > zone.z0 && l.z0 < zone.z1) need = 99;      // nor behind a lift
  return { need, cap };
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
    } else i++;                                     // too wide for what is left of this stretch: try the next, which may be smaller
  }
  if (!picked.length) return [];
  // Centre-out: 0 in the middle, then alternate sides.
  const order = [];
  picked.forEach((p, i) => (i % 2 ? order.unshift(p) : order.push(p)));
  // The margin is kept at both ends whatever is hung between: a frame run up to the end of its wall is cut off by the door jamb or the corner there.
  const slack = len - margin * 2 - used;
  const pad = slack / (order.length + 1);
  let u = seg.lo + margin;
  const placed = [];
  for (const p of order) {
    u += pad + p.full / 2;
    const { w, h } = p.wk._size;
    const { need: lift, cap } = clearance(plan, wall, u - p.full / 2, u + p.full / 2);
    const cy = Math.max(opts.centre(h), lift + p.frame + h / 2);
    if (cy + h / 2 + p.frame <= cap) {
      const pos = wallPoint(wall, u, wall.room.y + cy, 0.04);            // heights on a wall are measured from the room's own floor
      placed.push({ work: p.wk, room: wall.room.id, fy: wall.room.y, x: pos.x, y: pos.y, z: pos.z, rot: wall.rot, nx: wall.nx, nz: wall.nz, w, h, frame: p.frame, kind: opts.kind, high: lift > 0 });
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
          const pos = wallPoint(wall, u, r.y + 0.95, 0.04);    // low enough for a toy car to look in
          placements.push({ work: wk, room: r.id, fy: r.y, x: pos.x, y: pos.y, z: pos.z, rot: wall.rot, nx: wall.nx, nz: wall.nz, w: wk._size.w, h: wk._size.h, frame: 0.05, kind: 'miniature' });
        }
      }
      continue;
    }
    const isHall = r.kind === 'hall';
    const segs = walls.flatMap(wall => wall.segs.map(seg => ({ wall, seg, len: seg.hi - seg.lo }))).filter(s => s.len >= 1.3).sort((a, b) => b.len - a.len);
    if (!segs.length) continue;
    const under = Math.min(r.h, ...plan.decks.filter(d => d.room === r.id && !isHall).map(d => d.y - d.thick - r.y));      // in a stair hall the pictures hang under the gallery
    const queue = set.wall.map(w => ({ ...w, _size: realSize(w, isHall ? 5.6 : under - 2.4, Math.min(isHall ? 9 : 12, segs[0].len - 2)) }));
    for (const { wall, seg } of segs) {
      placements.push(...fillSegment(plan, wall, seg, queue, isHall
        ? { margin: 1.4, gap: 1.6, maxPer: 3, frame: frameFor, kind: 'painting', centre: h => 1.5 + h / 2 }
        : { margin: 0.55, gap: 0.5, maxPer: 8, frame: frameFor, kind: 'painting', centre: h => Math.max(1.62, 0.8 + h / 2) }));       // hung close, as the museum's own rooms are
    }
    if (!isHall) spill.push(...queue);
  }
  placements.push(...stand(plan, collection, placements));
  return placements;
}

// Is there still `w` metres of clear floor from every doorway of room r to every other,
// with `extra` boxes standing in it as well as the stunt kit?
function lanesOpen(plan, r, w, extra) {
  const doors = plan.doorsOf(r.id).filter(d => same(d.y, r.y));          // the doors on this floor: one a storey up, onto a balcony, is not got to across it
  if (doors.length < 2) return true;
  const g = 0.3, nx = Math.ceil((r.x1 - r.x0) / g), nz = Math.ceil((r.z1 - r.z0) / g), m = w / 2;
  const blocks = plan.surfaces.filter(s => s.skin !== 'bench' && onLevel(s, r.y) && !(bottom(s, Math.min(s.h0, s.h1)) > r.y + 0.5) && s.x1 > r.x0 && s.x0 < r.x1 && s.z1 > r.z0 && s.z0 < r.z1).map(s => foot(s, r.y)).concat(extra, plan.lifts.filter(l => l.stops[0] < r.top && l.stops[l.stops.length - 1] > r.y - 0.1));
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
    const zones = plan.doorsOf(r.id).filter(d => same(d.y, r.y)).map(d => {
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
      if (zones.some(z => near(z, 0)) || here.some(c => near(c, 1.5)) || plan.puddles.some(p => same(p.y || 0, r.y) && Math.hypot(p.x - s.x, p.z - s.z) < p.r + 1.6)) continue;
      if (same(r.y, plan.lineY) && plan.line.some(p => Math.abs(p.x - s.x) < 1.8 && Math.abs(p.z - s.z) < 1.8)) continue;
      if (plan.surfaces.some(q => onLevel(q, r.y) && near(foot(q, r.y), q.skin === 'bench' ? 1.1 : 1.7))) continue;
      if (plan.lifts.some(l => l.stops[0] < r.top && l.stops[l.stops.length - 1] > r.y - 0.1 && near(l, 1.7))) continue;
      if (!lanesOpen(plan, r, 2.2, [...here, box])) continue;
      here.push(box);
      plan.obstacles.push({ ...box, y0: r.y, y1: r.y + plinth + h + 0.2, case: true });
      out.push({ work: wk, room: r.id, fy: r.y, x: s.x, y: r.y + plinth + h / 2 + 0.02, z: s.z, rot: 0, nx: 0, nz: 1, w, h, frame: 0, kind: 'object', plinth, half });
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

// The doorways the circuit goes through, in order: each with the room it leads into.
export function ringSteps(plan) {
  // The circuit keeps to one level: only doorways between rooms whose floors are level with each other.
  const flat = d => !d.out && same(plan.byId[d.a].y, d.y) && same(plan.byId[d.b].y, d.y);
  const nb = id => plan.doorsOf(id).filter(flat).map(d => [d.a === id ? d.b : d.a, d]);
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
  return steps;
}

// The circuit's doorways and a steering point across each big room: the rough line the stunt kit
// and the cases keep clear of. (The line raced on is src/course.js, laid round what is really there.)
export function buildRoute(plan) {
  const steps = ringSteps(plan), pts = [];
  steps.forEach((s, i) => {
    const d = s.door, r = plan.byId[s.room];
    pts.push({ x: (d.x0 + d.x1) / 2, z: (d.z0 + d.z1) / 2, y: d.y + Math.min(2.2, d.h - 1.3), fy: d.y, gate: (d.along === 'z' ? d.x1 - d.x0 : d.z1 - d.z0) / 2, room: s.room });
    // A point in the middle of a big room keeps the line off the walls on a long diagonal.
    const next = steps[(i + 1) % steps.length].door, nx = (next.x0 + next.x1) / 2, nz = (next.z0 + next.z1) / 2;
    if (Math.hypot(nx - (d.x0 + d.x1) / 2, nz - (d.z0 + d.z1) / 2) > 9) {
      const mx = ((d.x0 + d.x1) / 2 + nx) / 2, mz = ((d.z0 + d.z1) / 2 + nz) / 2, cx = (r.x0 + r.x1) / 2, cz = (r.z0 + r.z1) / 2;
      pts.push({ x: mx * 0.7 + cx * 0.3, z: mz * 0.7 + cz * 0.3, y: r.y + 2.2, fy: r.y, mid: true, room: s.room });
    }
  });
  // Start and finish on the longest clear stretch.
  let best = pts.findIndex(p => p.mid);
  if (best < 0) best = 0;
  pts[best].gate = 2.4; pts[best].start = true; pts[best].y = (pts[best].fy || 0) + 3;
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
