// The floor plan. Pure data and geometry maths: no three.js in here, so the
// same module lays out the museum, confines the vehicles and steers the bots.
//
// Axes: x runs east, z runs south, y is up. Units are metres. The vehicles are
// true to scale (a 46 cm car), which is the whole point: the rooms are not big,
// you are small.

export const T = 1;            // wall thickness
export const RW = 16;          // gallery width (x)
export const RD = 13;          // gallery depth (z)
export const RH = 7.5;         // gallery ceiling
export const PITCH = RW + T;
export const LEN = 5 * RW + 4 * T;   // 84 m of hall
export const HW = 7;           // hall half-width
export const SPRING = 9;       // where the hall's vault starts
export const VAULT_R = 7;
export const CORR = { z0: -26.5, z1: -22, h: 3.4 };

// Real gallery numbers, west to east. If a gallery has been rehung and comes
// back empty, the curator fills the room from the next best-stocked gallery.
export const NORTH = ['Gallery 201', 'Gallery 240', 'Gallery 241', 'Gallery 243', 'Gallery 248'];
export const SOUTH = ['Gallery 211', 'Gallery 213', 'Gallery 220', 'Gallery 161', 'Gallery 273'];

// Wall colours, the deep paint museums use so gilt frames sing.
const TINT_N = [0x4a5a66, 0x56604f, 0x5c4a58, 0x445a5c, 0x6a5a48];
const TINT_S = [0x5e2f2c, 0x2f4638, 0x3a4059, 0x6b5536, 0x4f3c4d];

export function buildPlan() {
  const rooms = [];
  const doors = [];
  const hall = { id: 'hall', kind: 'hall', x0: 0, x1: LEN, z0: -HW, z1: HW, h: SPRING, ceil: 12.4, tint: 0x8c8a84 };
  rooms.push(hall);
  for (let i = 0; i < 5; i++) {
    const x0 = i * PITCH, x1 = x0 + RW;
    rooms.push({ id: 'N' + i, kind: 'gallery', side: 'n', i, x0, x1, z0: -HW - T - RD, z1: -HW - T, h: RH, ceil: RH - 0.15, tint: TINT_N[i], want: NORTH[i] });
    rooms.push({ id: 'S' + i, kind: 'gallery', side: 's', i, x0, x1, z0: HW + T, z1: HW + T + RD, h: RH, ceil: RH - 0.15, tint: TINT_S[i], want: SOUTH[i] });
  }
  rooms.push({ id: 'C', kind: 'corridor', x0: 0, x1: LEN, z0: CORR.z0, z1: CORR.z1, h: CORR.h, ceil: CORR.h - 0.1, tint: 0x16171c, want: 'Gallery 11' });

  for (let i = 0; i < 5; i++) {
    const cx = i * PITCH + RW / 2;
    doors.push({ id: 'H-N' + i, a: 'hall', b: 'N' + i, along: 'z', x0: cx - 1.7, x1: cx + 1.7, z0: -HW - T, z1: -HW, h: 4.4 });
    doors.push({ id: 'H-S' + i, a: 'hall', b: 'S' + i, along: 'z', x0: cx - 1.7, x1: cx + 1.7, z0: HW, z1: HW + T, h: 4.4 });
    if (i < 4) {
      const wx = i * PITCH + RW;
      const zn = -HW - T - RD / 2, zs = HW + T + RD / 2;
      doors.push({ id: 'N' + i + '-N' + (i + 1), a: 'N' + i, b: 'N' + (i + 1), along: 'x', x0: wx, x1: wx + T, z0: zn - 1.4, z1: zn + 1.4, h: 3.8 });
      doors.push({ id: 'S' + i + '-S' + (i + 1), a: 'S' + i, b: 'S' + (i + 1), along: 'x', x0: wx, x1: wx + T, z0: zs - 1.4, z1: zs + 1.4, h: 3.8 });
    }
  }
  // The miniature-rooms passage hides behind the north wing, reached from its two ends.
  doors.push({ id: 'C-N0', a: 'C', b: 'N0', along: 'z', x0: 2.1, x1: 4.3, z0: CORR.z1, z1: CORR.z1 + T, h: 2.7 });
  doors.push({ id: 'C-N4', a: 'C', b: 'N4', along: 'z', x0: LEN - 4.3, x1: LEN - 2.1, z0: CORR.z1, z1: CORR.z1 + T, h: 2.7 });

  const byId = Object.fromEntries(rooms.map(r => [r.id, r]));

  // Walkable volumes: every room, every doorway stretched a little into the
  // rooms either side, and the tall middle of the hall under the vault.
  const boxes = rooms.map(r => ({ x0: r.x0, x1: r.x1, z0: r.z0, z1: r.z1, y1: r.ceil }));
  boxes.push({ x0: 0, x1: LEN, z0: -4, z1: 4, y1: 14.5 });
  for (const d of doors) {
    const e = 1.6;
    boxes.push(d.along === 'z'
      ? { x0: d.x0, x1: d.x1, z0: d.z0 - e, z1: d.z1 + e, y1: d.h }
      : { x0: d.x0 - e, x1: d.x1 + e, z0: d.z0, z1: d.z1, y1: d.h });
  }

  const plan = { rooms, doors, byId, boxes, obstacles: [], hall };
  plan.walls = rooms.flatMap(r => wallsOf(plan, r));
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

// Keep a sphere of radius r inside the walkable volumes. Returns true when it
// had to move the point, and writes the push direction to `out`.
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
      // Centre is inside the box: leave by the nearest face.
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
// piece is a rectangle with a height: flat, or sloping along one axis. Solid
// pieces go down to the floor and stop you like a wall from the side; thin
// ones (table tops) can be driven under and landed on.

export const GRAVITY = 9.8;
export const STEP = 0.09;       // the tallest lip a toy wheel will climb

function addStunts(plan) {
  const S = plan.surfaces = [], L = plan.loops = [], D = plan.decals = [];
  plan.noBench = new Set(['S3']);
  const add = (skin, x0, x1, z0, z1, axis, h0, h1, o = {}) => { const s = { skin, x0, x1, z0, z1, axis, h0, h1, thick: 0, ...o }; S.push(s); return s; };
  const flat = (skin, x0, x1, z0, z1, h, o) => add(skin, x0, x1, z0, z1, null, h, h, o);
  const track = (x0, x1, z0, z1, axis, dir) => D.push({ x0, x1, z0, z1, axis, dir });
  // A table: a thin top on four legs.
  const table = (x0, x1, z0, z1, h) => {
    flat('table', x0, x1, z0, z1, h, { thick: 0.06 });
    plan.obstacles.push({ x0, x1, z0, z1, y0: h - 0.17, y1: h - 0.08 });      // the apron: low enough that a car cresting the ramp clears it
    for (const lx of [x0 + 0.08, x1 - 0.08]) for (const lz of [z0 + 0.08, z1 - 0.08])
      plan.obstacles.push({ x0: lx - 0.035, x1: lx + 0.035, z0: lz - 0.035, z1: lz + 0.035, y0: 0, y1: h - 0.06, leg: true });
  };
  // Ramp up, flat top, ramp down, along x: jumpable from either end.
  const tabletop = (cx, z0, z1, h, run = 1.6, top = 0.6) => {
    add('ply', cx - top - run, cx - top, z0, z1, 'x', 0, h);
    flat('ply', cx - top, cx + top, z0, z1, h);
    add('ply', cx + top, cx + top + run, z0, z1, 'x', h, 0);
    track(cx - top - run - 3, cx - top - run, z0 + 0.25, z1 - 0.25, 'x', 1);
    track(cx + top + run, cx + top + run + 3, z0 + 0.25, z1 - 0.25, 'x', -1);
  };
  const zs = HW + T + RD / 2, zn = -zs, zc = (CORR.z0 + CORR.z1) / 2;

  // 1. The grand stair at the west end of the hall: a ramp up the north side,
  //    a landing under the biggest picture in the building, and a kicker
  //    pointing straight down the steps.
  const LH = 1.5, LX = 4.6;
  flat('stone', 0, LX, -5.8, 4, LH, { carpet: [-1.3, 1.3] });
  add('ply', LX, 13.6, -5.8, -4.2, 'x', LH, 0);
  track(13.6, 17, -5.6, -4.4, 'x', -1);
  for (let k = 0; k < 7; k++) flat('stone', LX + 0.36 * k, LX + 0.36 * (k + 1), -4, 4, LH - 0.1875 * (k + 1), { carpet: [-1.3, 1.3], stepFrom: LX });
  add('ply', 2.5, LX, -0.9, 0.9, 'x', LH, LH + 0.36, { thick: 0.4, onTop: LH });

  // 2. A tabletop jump on the hall straight, just after the start line.
  tabletop(23.8, -0.8, 1.2, 0.45, 1.8);

  // 3. The loop, run at towards the window.
  L.push({ x: 57, z: -3.4, dir: 1, r: 1.15, shift: 0.62, w: 0.56 });
  track(46, 57, -3.68, -3.12, 'x', 1);
  track(57, 62.5, -3.06, -2.5, 'x', 1);
  for (const dx of [-1.45, 1.45]) for (const dz of [-0.55, 1.15])
    plan.obstacles.push({ x0: 57 + dx - 0.04, x1: 57 + dx + 0.04, z0: -3.4 + dz - 0.04, z1: -3.4 + dz + 0.04, y0: 0, y1: 2.5, post: true });

  // 4. Gallery 211: up a ramp, along a table under the El Greco, off the end.
  add('ply', 0.5, 3.2, 17.6, 18.8, 'x', 0, 0.72);
  table(3.2, 9, 17.6, 18.8, 0.72);
  add('ply', 7.9, 9, 17.75, 18.65, 'x', 0.72, 0.92, { thick: 0.2, onTop: 0.72 });

  // 5. Gallery 213: a kicker either side of the bench. Clear it or land on it.
  add('ply', 21.6, 23.4, 13.7, 15.3, 'x', 0, 0.5);
  add('ply', 26.6, 28.4, 13.7, 15.3, 'x', 0.5, 0);
  track(18.6, 21.6, 13.95, 15.05, 'x', 1);

  // 6. Gallery 161: packing crates stacked into a ramp, a deck and three steps down.
  add('ply', 55.4, 58.2, 13.6, 15.4, 'x', 0, 0.75);
  flat('crate', 58.2, 59.5, 13.6, 15.4, 0.75);
  flat('crate', 59.5, 59.92, 13.6, 15.4, 0.5);
  flat('crate', 59.92, 60.34, 13.6, 15.4, 0.25);
  track(52.4, 55.4, 13.95, 15.05, 'x', 1);

  // 7. The miniature-rooms passage: two jumps between the little lit windows.
  tabletop(58, zc - 0.8, zc + 0.8, 0.4);
  tabletop(26, zc - 0.8, zc + 0.8, 0.4);

  // 8. Gallery 240: a table run along the wall, right under La Grande Jatte.
  add('ply', 18.2, 21, -19.5, -18.3, 'x', 0, 0.72);
  table(21, 26.6, -19.5, -18.3, 0.72);
  add('ply', 25.5, 26.6, -19.35, -18.45, 'x', 0.72, 0.92, { thick: 0.2, onTop: 0.72 });

  // 9. Gallery 243: the big gap, over the bench, between the Monets.
  add('ply', 53.6, 56.2, zn - 0.9, zn + 0.9, 'x', 0, 0.8);
  add('ply', 61, 63.6, zn - 0.9, zn + 0.9, 'x', 0.8, 0);
  track(51.4, 53.6, zn - 0.6, zn + 0.6, 'x', 1);
  track(63.6, 66, zn - 0.6, zn + 0.6, 'x', -1);
}

export function heightOf(s, x, z) {
  if (!s.axis) return s.h0;
  const t = s.axis === 'x' ? (x - s.x0) / (s.x1 - s.x0) : (z - s.z0) / (s.z1 - s.z0);
  return s.h0 + (s.h1 - s.h0) * t;
}

// The highest thing under (x, z) that something at height y could be standing on.
export function groundAt(plan, x, z, y, step = STEP) {
  let g = 0;
  for (const s of plan.surfaces) {
    if (x < s.x0 || x > s.x1 || z < s.z0 || z > s.z1) continue;
    const h = heightOf(s, x, z);
    if (h <= y + step && h > g) g = h;
  }
  return g;
}

// Is there a solid piece here standing taller than something at height y can climb?
export function wallAt(plan, x, z, y, step = STEP) {
  for (const s of plan.surfaces) {
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

// Fill one stretch of wall with as many works from the queue as it will hold,
// the most important in the middle.
function fillSegment(wall, seg, queue, opts) {
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
    const cy = opts.centre(h);
    const pos = wallPoint(wall, u, cy, 0.04);
    placed.push({ work: p.wk, room: wall.room.id, x: pos.x, y: pos.y, z: pos.z, rot: wall.rot, nx: wall.nx, nz: wall.nz, w, h, frame: p.frame, kind: opts.kind });
    u += p.full / 2 + (gap - pad > 0 ? 0 : 0);
  }
  return placed;
}

export function hang(plan, collection) {
  const placements = [];
  const frameFor = wk => Math.min(0.2, Math.max(0.055, 0.05 + 0.04 * Math.sqrt(wk._size.w * wk._size.h)));
  const labels = {};

  for (const r of plan.rooms) {
    const walls = plan.walls.filter(w => w.room === r);
    if (r.kind === 'gallery') {
      const set = collection.rooms[r.id] || { works: [] };
      labels[r.id] = set;
      const queue = set.works.map(w => ({ ...w, _size: realSize(w, r.h - 2.4, RW - 4) }));
      const feature = r.side === 'n' ? 'n' : 's';
      // Feature wall first, then the side walls, then either side of the hall door.
      const order = [feature, 'w', 'e', feature === 'n' ? 's' : 'n'];
      for (const side of order) {
        const wall = walls.find(w => w.side === side);
        const segs = [...wall.segs].sort((a, b) => (b.hi - b.lo) - (a.hi - a.lo));
        for (const seg of segs) {
          if (seg.hi - seg.lo < 2.2) continue;
          placements.push(...fillSegment(wall, seg, queue, {
            margin: 0.9, gap: 1.0, maxPer: 4, frame: frameFor, kind: 'painting',
            centre: h => Math.max(1.62, 0.8 + h / 2),
          }));
        }
      }
    } else if (r.kind === 'hall') {
      const queue = (collection.hall || []).map(w => ({ ...w, _size: realSize(w, 5.6, 9) }));
      // The west wall takes the single grandest thing; the long walls the rest.
      const west = walls.find(w => w.side === 'w');
      placements.push(...fillSegment(west, west.segs[0], queue, {
        margin: 1.5, gap: 2, maxPer: 1, frame: frameFor, kind: 'painting', centre: h => 2.35 + h / 2,   // clear of the stair landing
      }));
      for (const side of ['n', 's']) {
        const wall = walls.find(w => w.side === side);
        for (const seg of wall.segs) {
          if (seg.hi - seg.lo < 5) continue;
          placements.push(...fillSegment(wall, seg, queue, {
            margin: 1.4, gap: 1.6, maxPer: 3, frame: frameFor, kind: 'painting', centre: h => 1.5 + h / 2,
          }));
        }
      }
    } else if (r.kind === 'corridor') {
      // The Thorne Miniature Rooms: little lit windows down both sides of a dark passage.
      const queue = (collection.corridor || []).map(w => {
        const aspect = w.iw && w.ih ? w.iw / w.ih : 1.5;
        const h = 0.62, wd = Math.min(1.25, Math.max(0.6, h * aspect));
        return { ...w, _size: { w: wd, h: wd / aspect } };
      });
      for (const side of ['n', 's']) {
        const wall = walls.find(w => w.side === side);
        for (const seg of wall.segs) {
          if (seg.hi - seg.lo < 3) continue;
          const n = Math.floor((seg.hi - seg.lo - 1.2) / 2.45);
          for (let k = 0; k < n && queue.length; k++) {
            const wk = queue.shift();
            const u = seg.lo + (seg.hi - seg.lo) * (k + 0.5) / n;
            const pos = wallPoint(wall, u, 0.95, 0.04);    // low enough for a toy car to look in
            placements.push({ work: wk, room: r.id, x: pos.x, y: pos.y, z: pos.z, rot: wall.rot, nx: wall.nx, nz: wall.nz, w: wk._size.w, h: wk._size.h, frame: 0.05, kind: 'miniature' });
          }
        }
      }
    }
  }
  return placements;
}

// ------------------------------------------------------------- the circuit --

// One long lap that uses every kind of room: the south enfilade, the hall
// crossing, the miniature-rooms passage, the north enfilade, and the hall
// straight. `y` is the height the drone takes each point at.
export function buildRoute() {
  const zs = HW + T + RD / 2, zn = -zs, zc = (CORR.z0 + CORR.z1) / 2;
  const d = i => i * PITCH + RW + T / 2;      // enfilade door centres
  const pts = [
    { x: 30, z: 0, y: 7.5, gate: 3.2, start: true },
    { x: 17, z: 0.4, y: 5.5 },
    { x: 10.5, z: 2.6, y: 3.6 },
    { x: 8, z: 7.5, y: 2.2, gate: 1.7 },
    { x: 8.6, z: 12.2, y: 1.9 },
    { x: 12, z: zs, y: 1.9 },
    { x: d(0), z: zs, y: 1.9, gate: 1.4 },
    { x: d(0) + 8.5, z: zs, y: 1.9 },
    { x: d(1), z: zs, y: 1.9, gate: 1.4 },
    { x: d(1) + 8.5, z: zs, y: 1.9 },
    { x: d(2), z: zs, y: 1.9, gate: 1.4 },
    { x: d(2) + 8.5, z: zs, y: 1.9 },
    { x: d(3), z: zs, y: 1.9, gate: 1.4 },
    { x: 72.5, z: zs, y: 1.9 },
    { x: 75.6, z: 12, y: 2 },
    { x: 76, z: 7.5, y: 2.2, gate: 1.7 },
    { x: 76, z: 0, y: 6.5, gate: 3 },
    { x: 76, z: -7.5, y: 2.2, gate: 1.7 },
    { x: 77.2, z: -12.5, y: 1.8 },
    { x: 80.4, z: -18, y: 1.5 },
    { x: 80.8, z: -21.5, y: 1.35, gate: 1.1 },
    { x: 79.6, z: zc - 0.2, y: 1.5 },
    { x: 75, z: zc, y: 1.6 },
    { x: 60, z: zc, y: 1.7 },
    { x: 42, z: zc, y: 1.7, gate: 2.2 },
    { x: 24, z: zc, y: 1.7 },
    { x: 8, z: zc, y: 1.6 },
    { x: 4.2, z: zc + 0.3, y: 1.5 },
    { x: 3.2, z: -21.5, y: 1.35, gate: 1.1 },
    { x: 3.8, z: -18, y: 1.6 },
    { x: 8, z: zn - 0.3, y: 1.9 },
    { x: d(0), z: zn, y: 1.9, gate: 1.4 },
    { x: d(0) + 8.5, z: zn, y: 1.9 },
    { x: d(1), z: zn, y: 1.9, gate: 1.4 },
    { x: 38, z: zn, y: 1.9 },
    { x: 41.4, z: -12, y: 2 },
    { x: 42, z: -7.5, y: 2.2, gate: 1.7 },
    { x: 40.5, z: -2.6, y: 4.5 },
    { x: 36, z: -0.2, y: 6.5 },
  ];
  return pts;
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
