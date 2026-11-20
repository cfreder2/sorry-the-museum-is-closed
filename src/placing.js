// Where to put a small thing down in the building: a clear patch of floor, a clear stretch of wall
// low down, and how far a spot is from everything else there is to find. Used by the lost property,
// the mice and the guard's notes (lostfound.js, mice.js, notes.js); anything else may use it too.
//
// Placement is worked out from the plan alone, so the same building gets the same things in the same
// places every night.

import { groundAt } from './plan.js';

/** A seeded random number, so that every night is the same. */
export function rng(seed) { let s = seed >>> 0 || 1; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

/** The doorways in one wall of room r: side is 'n' (z0), 's' (z1), 'w' (x0) or 'e' (x1). Each as [lo, hi] along the wall. */
export function doorsOnSide(plan, r, side) {
  const out = [], horiz = side === 'n' || side === 's', at = side === 'n' ? r.z0 : side === 's' ? r.z1 : side === 'w' ? r.x0 : r.x1;
  for (const d of plan.doorsOf(r.id)) {
    if (Math.abs(d.y - r.y) > 1.2) continue;
    if (horiz ? d.along !== 'z' : d.along !== 'x') continue;
    const a = horiz ? d.z0 : d.x0, b = horiz ? d.z1 : d.x1;
    if (Math.abs(a - at) > 0.7 && Math.abs(b - at) > 0.7 && !(a < at && b > at)) continue;
    out.push(horiz ? [d.x0, d.x1] : [d.z0, d.z1]);
  }
  return out;
}

/** Is anything solid standing in the box given, at the height of a toy on this floor?
 *  `near` (from within()) narrows the search to what lies in a larger box around it, for many asks in one place. */
export function blocked(plan, x0, x1, z0, z1, y0, y1, near = plan) {
  for (const o of near.obstacles) if (o.x0 < x1 && o.x1 > x0 && o.z0 < z1 && o.z1 > z0 && o.y0 < y1 && o.y1 > y0) return true;
  for (const s of near.surfaces) if (!s.hill && s.x0 < x1 && s.x1 > x0 && s.z0 < z1 && s.z1 > z0 && Math.max(s.h0 || 0, s.h1 || 0) > y0 + 0.02 && (s.base || 0) < y1) return true;
  for (const q of near.ramps || []) if (q.x0 < x1 && q.x1 > x0 && q.z0 < z1 && q.z1 > z0 && Math.min(q.y0, q.y1) < y1 && Math.max(q.y0, q.y1) > y0 - 0.5) return true;
  return false;
}
/** The obstacles, surfaces and ramps reaching into the box x0..x1, z0..z1: anything that blocks a box inside it is
 *  among them. Taken afresh for each search, since some of them move (the trains, the lifts). */
export function within(plan, x0, x1, z0, z1) {
  const hit = o => o.x0 < x1 && o.x1 > x0 && o.z0 < z1 && o.z1 > z0;
  return { obstacles: plan.obstacles.filter(hit), surfaces: plan.surfaces.filter(hit), ramps: (plan.ramps || []).filter(hit) };
}

/** A clear patch of floor in room r near (x, z), spiralling out until one is found; or null. */
export function freeFloor(plan, r, x, z, rad = 0.45, clearDoors = 1.4) {
  const ds = plan.doorsOf(r.id).filter(d => Math.abs(d.y - r.y) < 1.2), near = within(plan, r.x0 + 0.7 - rad, r.x1 - 0.7 + rad, r.z0 + 0.7 - rad, r.z1 - 0.7 + rad);
  for (let k = 0; k < 90; k++) {
    const a = k * 2.399, d = Math.sqrt(k) * 0.55, px = x + Math.cos(a) * d, pz = z + Math.sin(a) * d;
    if (px < r.x0 + 0.7 || px > r.x1 - 0.7 || pz < r.z0 + 0.7 || pz > r.z1 - 0.7) continue;
    if (ds.some(q => px > q.x0 - clearDoors && px < q.x1 + clearDoors && pz > q.z0 - clearDoors && pz < q.z1 + clearDoors)) continue;
    if (blocked(plan, px - rad, px + rad, pz - rad, pz + rad, r.y - 0.05, r.y + 1.2, near)) continue;
    if ((plan.wells || []).some(w => px > w.x0 - 0.5 && px < w.x1 + 0.5 && pz > w.z0 - 0.5 && pz < w.z1 + 0.5)) continue;
    if ((plan.lifts || []).some(w => px > w.x0 - 0.5 && px < w.x1 + 0.5 && pz > w.z0 - 0.5 && pz < w.z1 + 0.5)) continue;
    if (Math.abs(groundAt(plan, px, pz, r.y + 0.3) - r.y) > 0.04) continue;
    return { x: px, z: pz };
  }
  return null;
}

/**
 * Places along the walls of room r, low down: clear of doorways, of anything standing against the wall,
 * and of anything hung low on it. Each: { x, z, nx, nz, side, u, lo, hi, room } (u along the wall, n pointing into the room).
 */
export function wallSpots(plan, museum, r, { step = 0.6, clear = 0.7, depth = 0.4, height = 0.6, width = 0.3 } = {}) {
  const out = [], m = width + depth + 0.1, near = within(plan, r.x0 - m, r.x1 + m, r.z0 - m, r.z1 + m);
  for (const side of ['n', 's', 'w', 'e']) {
    const horiz = side === 'n' || side === 's', lo = horiz ? r.x0 : r.z0, hi = horiz ? r.x1 : r.z1;
    const at = side === 'n' ? r.z0 : side === 's' ? r.z1 : side === 'w' ? r.x0 : r.x1;
    const nx = side === 'w' ? 1 : side === 'e' ? -1 : 0, nz = side === 'n' ? 1 : side === 's' ? -1 : 0;
    const doors = doorsOnSide(plan, r, side);
    const works = (museum.arts || []).filter(a => a.room === r.id && Math.abs((horiz ? a.z : a.x) - at) < 0.3);
    for (let u = lo + 0.5; u <= hi - 0.5; u += step) {
      if (doors.some(([a, b]) => u > a - clear && u < b + clear)) continue;
      if (works.some(a => Math.abs((horiz ? a.x : a.z) - u) < a.w / 2 + 0.3 && a.y - a.h / 2 - (a.frame || 0) < r.y + height + 0.15)) continue;
      const x = horiz ? u : at, z = horiz ? at : u;
      const bx0 = horiz ? u - width : Math.min(at, at + nx * depth), bx1 = horiz ? u + width : Math.max(at, at + nx * depth);
      const bz0 = horiz ? Math.min(at, at + nz * depth) : u - width, bz1 = horiz ? Math.max(at, at + nz * depth) : u + width;
      if (blocked(plan, bx0, bx1, bz0, bz1, r.y - 0.05, r.y + height, near)) continue;
      out.push({ x, z, nx, nz, side, u, lo, hi, room: r });
    }
  }
  return out;
}

/** Distance on the same floor (anything on another floor counts as far away). */
export const sameFloor = (a, b) => (Math.abs((a.y || 0) - (b.y || 0)) < 2.4 ? Math.hypot(a.x - b.x, a.z - b.z) : 1e4);

/** The museum's gallery number for a room, or 0. */
export const galleryNo = r => { const m = /Galler(?:y|ies) (\d+)/.exec(r && r.gallery || ''); return m ? +m[1] : 0; };

// What is already somewhere, so that new things keep away from it: every spot on the debug map (G.spots),
// read once, plus whatever the small-things files have put down since.
let busy = false, taken = null;
export function claimed(G) {
  if (!taken) {
    busy = true;
    try { taken = (G.spots ? G.spots() : []).map(s => ({ x: s.x, y: s.y, z: s.z })); } catch { taken = []; }
    busy = false;
  }
  return taken;
}
export const claim = p => { if (taken) taken.push({ x: p.x, y: p.y, z: p.z }); };
/** True while the list above is being read: a spots() that would place things itself must return [] then. */
export const placingNow = () => busy;
