// The lie of the land, for whoever has to find a way over it (src/map.js lights that way on the ground and the map).
// No three.js and no DOM in here.
//
// Indoors a room is a box with a flat floor, and map.js walks it on a grid of its own. Out of doors nothing is flat and
// nothing is a box: hills, drifts, banks beside the paths, windrows along the kerbs, the railway in its cutting, the
// ice and where it gives out, fences, trees, parked cars, and kit to drive up, along and off. So the outdoors is read
// here from the plan itself, by the same three questions the car asks every frame (plan.js groundAt, wallAt, confine),
// and from nothing else: whatever is in the plan when this is built is in the way or is the way, with no list of names.
//
//   * The field: one cell every half metre over the plan's bounds. Each knows how high the ground is, whether a toy car
//     can be there at all (not in a building, not within its own width of anything solid, not in the water), how far it
//     is from the nearest solid thing, and what a metre of it costs to cross: swept paving and the marked way over the
//     ice least, a road a little more, snow more, ice more again and black ice most, and more the nearer to something
//     solid. Going from cell to cell costs more the steeper it is, and nothing is climbed that the plain car cannot
//     climb at half throttle (measured: a gradient of 0.85; see CLIMB). That is all there is to most of the outdoors.
//   * The kit: wherever a piece of the building or the stunt kit stands (anything in plan.surfaces that is not a hill,
//     a roof, a pit), a cell is not a number but a place to stand, found by driving: from a spot, a step to the next
//     is tried the way the car would take it, a hand's breadth at a time, climbing what a wheel climbs, staying on the
//     ramp it is on, stopped by what stops the car. A spot reached at another height is another spot (the table top
//     over the ground, the roof over the building, the duct under the yard). Nothing of this is worked out until a
//     search first comes to it, and then it is kept.
//   * A leap: where a rising ramp ends in the air, the flight off its lip is flown ahead of time at a few speeds, as
//     the car's own take-off is; if it comes down on something to stand on, with room to run out, that is a way too,
//     in that one direction, and whoever takes it has to take it at speed.
//
// The search (one A*, over cells, spots and the building's own ways handed in by map.js) is told how far it may look
// and gives up beyond that. The field is made in strips, a few milliseconds at a time (tick), or all at once if a way
// is asked for before it is ready (finish).

import { groundAt, wallAt, confine, streetY, heightOf, STEP, GRAVITY } from './plan.js';

export const CELL = 0.5;
const BK = 8;                    // the plan is sorted into squares this big, so that a question is asked only of what is near
const RAD = 0.32;                // a way is planned for something this wide: the car (0.19) and a hand's breadth to spare
const SUB = 0.1;                 // a step is tried in lengths of this
export const CLIMB = 0.85;       // the steepest the plain car climbs from a standing start at half throttle (1.2 m/s at 0.8, a stall at 1.0)
const KEEP = 0.7;                // nearer than this to something solid costs
const MASS = 1, OBST = 2, KIT = 4, RING = 8, WET = 16, WALL = 32, EDGE = 64, ANCH = 128;
const SOLID = MASS | OBST | WET | WALL, SPOT = KIT | RING;
const UNIT = 40;                 // a cell's cost: this many to the metre
const PAVE = 1, ROAD = 1.1, SNOW = 1.22, ICE = 1.32, BLACK = 1.8;      // what a metre costs, by what is underfoot
export const VB = 1 << 27;              // the building's ways are numbered from here

export function createLandway(plan) {
  const B = plan.bounds, X0 = B.x0 - CELL, Z0 = B.z0 - CELL, NX = Math.ceil((B.x1 - B.x0) / CELL) + 2, NZ = Math.ceil((B.z1 - B.z0) / CELL) + 2, NC = NX * NZ;
  const H = new Float32Array(NC), K = new Uint8Array(NC), C = new Uint8Array(NC), D = new Uint8Array(NC), CC = new Float32Array(NC);      // height; what it is; what is underfoot; how far from anything solid; what a metre costs
  const cellOf = (x, z) => { const i = Math.floor((x - X0) / CELL), j = Math.floor((z - Z0) / CELL); return i < 1 || j < 1 || i >= NX - 1 || j >= NZ - 1 ? -1 : j * NX + i; };
  const xOf = c => X0 + (c % NX + 0.5) * CELL, zOf = c => Z0 + (Math.floor(c / NX) + 0.5) * CELL;
  const wet = plan.lakefront && plan.lakefront.wet ? plan.lakefront.wet : null;
  const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

  // ---- the plan, sorted into squares ------------------------------------------------------
  // Each square has a plan of its own: the real plan, with only what is in or near the square in its lists. The car's
  // own questions are asked of that, so the answers are the car's, at a hundredth of the cost.
  let bx0 = B.x0 - 4, bz0 = B.z0 - 4, bx1 = B.x1 + 4, bz1 = B.z1 + 4;
  for (const q of plan.allow || []) { bx0 = Math.min(bx0, q.x0 - 4); bx1 = Math.max(bx1, q.x1 + 4); bz0 = Math.min(bz0, q.z0 - 4); bz1 = Math.max(bz1, q.z1 + 4); }
  const nbx = Math.ceil((bx1 - bx0) / BK), nbz = Math.ceil((bz1 - bz0) / BK), subs = new Array(nbx * nbz).fill(null);
  const blank = () => { const s = Object.create(plan); s.surfaces = []; s.roofs = plan.roofs ? [] : null; s.floors = []; s.obstacles = []; s.boxes = []; s.masses = []; s._hills = []; s._rooms = []; s._decks = []; return s; };
  const nowhere = blank();
  const subAt = (x, z) => { const i = Math.floor((x - bx0) / BK), j = Math.floor((z - bz0) / BK); return i < 0 || j < 0 || i >= nbx || j >= nbz ? nowhere : subs[j * nbx + i] || nowhere; };
  function sort(list, into, pad = 1.2) {
    for (const q of list || []) {
      if (!(q.x1 >= q.x0) || !(q.z1 >= q.z0)) continue;
      const i0 = Math.max(0, Math.floor((q.x0 - pad - bx0) / BK)), i1 = Math.min(nbx - 1, Math.floor((q.x1 + pad - bx0) / BK)), j0 = Math.max(0, Math.floor((q.z0 - pad - bz0) / BK)), j1 = Math.min(nbz - 1, Math.floor((q.z1 + pad - bz0) / BK));
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const k = j * nbx + i; (subs[k] || (subs[k] = blank()))[into].push(q); }
    }
  }
  // Whatever has been set down or taken up since (a fire door's bars, a cage): the squares it touches are sorted again.
  let seen = null;
  const low = new Set();           // pieces that lie no higher than a wheel climbs (a plate, a low block of ice, a floe): ground like any other
  function sortAll() {
    subs.fill(null);
    sort(plan.surfaces, 'surfaces'); if (plan.roofs) sort(plan.roofs, 'roofs'); sort(plan.floors, 'floors'); sort(plan.obstacles.filter(o => !o.train), 'obstacles'); sort(plan.boxes, 'boxes'); sort(plan.masses, 'masses');
    sort(plan.surfaces.filter(s => s.hill || low.has(s)), '_hills', 0.1); sort(plan.rooms, '_rooms', 0.1); sort(plan.decks, '_decks', 0.1);
    seen = new Set(plan.obstacles);
  }

  // ---- the field ----------------------------------------------------------------------------
  const mark = (x0, x1, z0, z1, pad, f) => {
    const i0 = Math.max(1, Math.ceil((x0 - pad - X0) / CELL - 0.5)), i1 = Math.min(NX - 2, Math.floor((x1 + pad - X0) / CELL - 0.5)), j0 = Math.max(1, Math.ceil((z0 - pad - Z0) / CELL - 0.5)), j1 = Math.min(NZ - 2, Math.floor((z1 + pad - Z0) / CELL - 0.5));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) f(j * NX + i);
  };
  const T = { built: false, phase: 0, row: 1, ms: 0, ex: 0, exMs: 0 };
  let soft = null;
  function prepare() {
    // What stands on the street, and how. `low` is ground. What is well under the ground, or overhead with room for a
    // car beneath, is nothing to a car on the street (it matters only to something already down there or up on it).
    // A level block too tall for a wheel is a wall, and no more. What is left (anything that slopes, anything with a
    // shape of its own, a lift) is kit: driven, not read.
    low.clear(); const kitted = [], blocks = [];
    for (const s of plan.surfaces) {
      if (s.hill) continue;
      const sy = streetY(plan, (s.x0 + s.x1) / 2, (s.z0 + s.z1) / 2), top = Math.max(s.h0, s.h1), bot = s.thick ? Math.min(s.h0, s.h1) - s.thick : s.base || 0, level = !s.axis && !s.fn && !s.lift;
      if (top < sy - 0.3 || bot > sy + (level ? 0.24 : 0.6)) continue;
      if (top <= sy + STEP - 0.004 && top >= sy - 0.02 && !s.lift) low.add(s); else if (level) blocks.push(s); else kitted.push(s);
    }
    sortAll();
    K.fill(0); C.fill(Math.round(SNOW * UNIT)); soft = new Uint8Array(NC);
    for (let i = 0; i < NX; i++) { K[i] = MASS; K[(NZ - 1) * NX + i] = MASS; } for (let j = 0; j < NZ; j++) { K[j * NX] = MASS; K[j * NX + NX - 1] = MASS; }
    // (A strip of ground beyond the bounds that may be driven, plan.allow: the field stops at the bounds, and from its edge there the way on is found by driving.)
    for (const q of plan.allow || []) { const edge = c => { const x = xOf(c), z = zOf(c); if (x > q.x0 + RAD && x < q.x1 - RAD && z > q.z0 - CELL && z < q.z1 + CELL) K[c] = KIT; };
      for (let i = 0; i < NX; i++) { edge(i); edge((NZ - 1) * NX + i); } for (let j = 0; j < NZ; j++) { edge(j * NX); edge(j * NX + NX - 1); } }
    for (const m of plan.masses) if (m.top > 0.9) mark(m.x0, m.x1, m.z0, m.z1, RAD, c => { K[c] |= MASS; });
    // Where a place to stand has to be found by driving: on and beside every piece of kit, and in every lift. Round a
    // hole in the ground (a pit, a well) each cell is looked at as it is read: lidded over, it is ground; open, it is kit.
    for (const s of kitted) mark(s.x0, s.x1, s.z0, s.z1, 0.3, c => { K[c] |= KIT; });
    for (const s of blocks) mark(s.x0, s.x1, s.z0, s.z1, RAD, c => { K[c] |= WALL; });
    for (const q of plan.lifts || []) mark(q.x0, q.x1, q.z0, q.z1, 0.5, c => { K[c] |= KIT; });
    for (const q of [...(plan.pits || []), ...(plan.wells || [])]) mark(q.x0, q.x1, q.z0, q.z1, 0.5, c => { soft[c] = 1; });
    // What is underfoot. Later ones lie over earlier.
    const lay = (q, v, pad = 0) => mark(q.x0, q.x1, q.z0, q.z1, pad, c => { C[c] = v; });
    const Gd = plan.grounds || {}, L = plan.lakefront, road = Math.round(ROAD * UNIT), pave = Math.round(PAVE * UNIT);
    for (const q of plan.paved || []) lay(q, pave);
    for (const s of [Gd.michigan, Gd.columbus, L && L.lsd]) if (s) lay({ x0: s.x0, x1: s.x1, z0: B.z0, z1: B.z1 }, road);
    for (const s of [Gd.monroe, Gd.jackson]) if (s) lay({ x0: B.x0, x1: B.x1, z0: s.z0, z1: s.z1 }, road);
    for (const q of [...(Gd.paths || []), ...((L && L.paths) || [])]) lay(q, pave);
    for (const q of Gd.plazas || []) mark(q.x - q.r, q.x + q.r, q.z - q.r, q.z + q.r, 0, c => { if ((xOf(c) - q.x) ** 2 + (zOf(c) - q.z) ** 2 < q.r * q.r) C[c] = pave; });
    // Ice, by how well it holds (a sheet may say, spot by spot: crust): snowed over is only ice, glassy is black ice. Where two sheets say, the worse.
    const iced = new Uint8Array(NC);
    for (const q of plan.ice || []) {
      const crust = typeof q.crust === 'function' ? q.crust : null;
      mark(q.x0, q.x1, q.z0, q.z1, 0, c => { const k = crust ? crust(xOf(c), zOf(c)) : q.crust ? 0.85 : 0, v = Math.round((BLACK + (ICE - BLACK) * Math.min(1, k / 0.6)) * UNIT); C[c] = iced[c] ? Math.max(C[c], v) : v; iced[c] = 1; });
    }
    // The way staked out across the ice is a path like any other.
    const way = L && L.safeWay;
    if (way) for (let k = 0; k + 1 < way.length; k++) { const [ax, az] = way[k], [bx, bz] = way[k + 1], dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz || 1;
      mark(Math.min(ax, bx), Math.max(ax, bx), Math.min(az, bz), Math.max(az, bz), 1.6, c => { const x = xOf(c), z = zOf(c), t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / l2)); if (Math.hypot(x - ax - dx * t, z - az - dz * t) < 1.6) C[c] = pave; }); }
  }
  function heights(j) {
    for (let i = 1; i < NX - 1; i++) {
      const c = j * NX + i, k = K[c]; if (k & MASS) continue;
      const x = X0 + (i + 0.5) * CELL, z = Z0 + (j + 0.5) * CELL, sy = streetY(plan, x, z), sub = subAt(x, z); let h = sy;
      if ((k & KIT) || soft[c]) {
        h = groundAt(sub, x, z, sy + 0.02); const u = sub.under, wall = wallAt(sub, x, z, sy);
        if (!(k & KIT) && (wall || Math.abs(h - sy) > STEP + 0.001)) K[c] |= KIT;      // an open hole
        if (wall) K[c] |= WALL; else if (wet && (!u || u.land) && wet(x, z)) K[c] |= WET;
      } else {
        let on = false;
        if (sy > -1.02) { const hs = sub._hills; for (let n = 0; n < hs.length; n++) { const s = hs[n]; if (x < s.x0 || x > s.x1 || z < s.z0 || z > s.z1) continue; const v = heightOf(s, x, z); if (v > h) h = v; if (!s.hill && v >= sy - 0.02) on = true; } }
        if (wet && !on && wet(x, z)) K[c] |= WET;
      }
      H[c] = h;
    }
  }
  const solidTo = (o, c) => !(K[c] & MASS) && o.y0 <= H[c] + 0.24 && o.y1 >= H[c];
  function obstacles(list, bit = OBST) { for (const o of list) { if (o.gate || o.train) continue; mark(o.x0, o.x1, o.z0, o.z1, RAD, c => { if (solidTo(o, c)) K[c] |= bit; }); } }
  // How far each cell is from the nearest thing a car cannot be in or on (in twentieths of a metre, to 12 m), and from
  // that and what is underfoot, what a metre of it costs. `win`: only this much of the field (after a change).
  function costs(win) {
    const i0 = win ? win.i0 : 1, i1 = win ? win.i1 : NX - 2, j0 = win ? win.j0 : 1, j1 = win ? win.j1 : NZ - 2, A = 10, G2 = 14;
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const c = j * NX + i; let k = K[c] & ~EDGE;
      if (!(k & SOLID)) { const h = H[c]; if ((!(K[c - 1] & MASS) && Math.abs(H[c - 1] - h) > 0.9) || (!(K[c + 1] & MASS) && Math.abs(H[c + 1] - h) > 0.9) || (!(K[c - NX] & MASS) && Math.abs(H[c - NX] - h) > 0.9) || (!(K[c + NX] & MASS) && Math.abs(H[c + NX] - h) > 0.9)) k |= EDGE; }      // the brink of a drop
      K[c] = k; if (!win || (i > i0 && i < i1 && j > j0 && j < j1)) D[c] = k & (SOLID | EDGE) ? 0 : 250;
    }
    const lo = (c, v) => { if (v < D[c]) D[c] = v; };
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const c = j * NX + i; if (!D[c]) continue; lo(c, D[c - 1] + A); lo(c, D[c - NX] + A); lo(c, D[c - NX - 1] + G2); lo(c, D[c - NX + 1] + G2); }
    for (let j = j1; j >= j0; j--) for (let i = i1; i >= i0; i--) { const c = j * NX + i; if (!D[c]) continue; lo(c, D[c + 1] + A); lo(c, D[c + NX] + A); lo(c, D[c + NX + 1] + G2); lo(c, D[c + NX - 1] + G2); }
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const c = j * NX + i; CC[c] = C[c] / UNIT + near[D[c]]; }
  }
  const near = new Float32Array(256); for (let d = 0; d < 256; d++) { const m = d * 0.05; near[d] = m >= KEEP ? 0 : ((KEEP - m) / KEEP) ** 2 * 2.6; }
  const costOf = c => CC[c];
  function build() {
    const t0 = now();
    if (T.phase === 0) { prepare(); T.phase = 1; T.row = 1; }
    else if (T.phase === 1) { const e = Math.min(NZ - 1, T.row + 6); for (; T.row < e; T.row++) heights(T.row); if (T.row >= NZ - 1) T.phase = 2; }
    else if (T.phase === 2) {
      for (let j = 1; j < NZ - 1; j++) for (let i = 1; i < NX - 1; i++) { const c = j * NX + i; if (K[c] & KIT) continue; if ((K[c - 1] | K[c + 1] | K[c - NX] | K[c + NX] | K[c - NX - 1] | K[c - NX + 1] | K[c + NX - 1] | K[c + NX + 1]) & KIT) K[c] |= RING; }      // beside the kit: where a step onto it starts from
      obstacles(plan.obstacles); soft = null; T.phase = 3;
    }
    else { costs(null); T.built = true; }
    T.ms += now() - t0;
  }
  const tick = ms => { const t0 = now(); while (!T.built && now() - t0 < ms) build(); return T.built; };
  const finish = () => { while (!T.built) build(); };
  // Something has been put down or taken up since the field was made (plan.obstacles is not the list it was): only
  // the ground round each such thing is looked at again. Returns what changed, for whoever else keeps a picture of it.
  function sync() {
    if (!T.built || !seen) return [];
    const cur = plan.obstacles; let same = cur.length === seen.size; if (same) for (let i = cur.length - 1, n = 0; i >= 0 && n < 64; i--, n++) if (!seen.has(cur[i])) { same = false; break; }
    if (same) return [];
    const live = new Set(cur), changed = [];
    for (const o of cur) if (!seen.has(o)) changed.push(o);
    for (const o of seen) if (!live.has(o)) changed.push(o);
    sortAll(); spots.clear();
    for (const o of changed) {
      const w = { i0: Math.max(1, Math.floor((o.x0 - 2.5 - X0) / CELL)), i1: Math.min(NX - 2, Math.ceil((o.x1 + 2.5 - X0) / CELL)), j0: Math.max(1, Math.floor((o.z0 - 2.5 - Z0) / CELL)), j1: Math.min(NZ - 2, Math.ceil((o.z1 + 2.5 - Z0) / CELL)) };
      if (w.i1 < w.i0 || w.j1 < w.j0) continue;
      for (let j = w.j0; j <= w.j1; j++) for (let i = w.i0; i <= w.i1; i++) K[j * NX + i] &= ~OBST;
      const x = X0 + (w.i0 + 0.5) * CELL, z = Z0 + (w.j0 + 0.5) * CELL, x1 = X0 + (w.i1 + 0.5) * CELL, z1 = Z0 + (w.j1 + 0.5) * CELL;
      obstacles(cur.filter(q => q.x1 > x - 1 && q.x0 < x1 + 1 && q.z1 > z - 1 && q.z0 < z1 + 1));
      costs(w);
    }
    return changed;
  }

  // ---- places to stand, found by driving ------------------------------------------------------
  // A spot: where it is, how high, what is under it (the piece that stays underfoot however it climbs), which room's
  // floor or deck it is on if it is on one, and, once asked, where a step leads from it.
  const spots = { n: 0, x: [], y: [], z: [], on: [], pl: [], cost: [], out: [], cell: [], at: new Map(), base: new Map(), g: [], par: [], st: [],
    clear() { this.n = 0; for (const k of ['x', 'y', 'z', 'on', 'pl', 'cost', 'out', 'cell', 'g', 'par', 'st']) this[k].length = 0; this.at.clear(); this.base.clear(); leaps.length = 0; } };
  const leaps = [];
  const keyOf = (x, z) => (Math.floor((x - X0) / CELL) + 4096) + (Math.floor((z - Z0) / CELL) + 4096) * 16384;
  const placeOf = (sub, x, z, y) => {
    for (const d of sub._decks) if (Math.abs(d.y - y) < 0.3 && x >= d.x0 - 0.05 && x <= d.x1 + 0.05 && z >= d.z0 - 0.05 && z <= d.z1 + 0.05) return 'D' + d.id;
    for (const r of sub._rooms) if (Math.abs(r.y - y) < 0.3 && x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1) return 'R' + r.id;
    return null;
  };
  function spot(x, z, y, on) {
    const key = keyOf(x, z), list = spots.at.get(key);
    if (list) for (const e of list) if (Math.abs(spots.y[e] - y) < 0.3) return e;
    const e = spots.n++, c = cellOf(x, z), sub = subAt(x, z);
    spots.x[e] = x; spots.y[e] = y; spots.z[e] = z; spots.on[e] = on || null; spots.pl[e] = placeOf(sub, x, z, y); spots.out[e] = null; spots.st[e] = 0; spots.cell[e] = -1;
    spots.cost[e] = c >= 0 && !(K[c] & MASS) && Math.abs(H[c] - y) < 0.3 ? costOf(c) : 1.04;
    if (list) list.push(e); else spots.at.set(key, [e]);
    return e;
  }
  const P3 = { x: 0, y: 0, z: 0 };
  // Can a car be here, standing at height y on `on`? Moved a little if it is only a little too near something (P3 says where to).
  function clear(sub, x, y, z, r) { P3.x = x; P3.y = y; P3.z = z; return !confine(sub, P3, r, false, null) || Math.hypot(P3.x - x, P3.z - z) < 1e-4; }
  // The spot that is a cell's own: the street's level there, or what is within a wheel's climb of it.
  function baseSpot(c) {
    let e = spots.base.get(c); if (e !== undefined) return e;
    e = -1;
    if (!(K[c] & SOLID)) {
      const x = xOf(c), z = zOf(c), sub = subAt(x, z), sy = streetY(plan, x, z), g = groundAt(sub, x, z, sy + 0.02), u = sub.under;
      if (clear(sub, x, g, z, RAD)) { e = spot(x, z, g, u); if (!(K[c] & KIT)) spots.cell[e] = c; }
    }
    spots.base.set(c, e); return e;
  }
  // One step, as the car would take it. Returns 0 (stopped by something solid, or too steep), -1 (the ground falls
  // away), or 1 with where it ends in W.
  const W = { x: 0, y: 0, z: 0, on: null, drop: 0 };
  function step(x0, z0, y0, on0, x1, z1, snap) {
    const d = Math.hypot(x1 - x0, z1 - z0);
    // With nothing along the way but the ground it is on (the open street, the middle of one ramp, the flat of one floor) a stride or two will do.
    let busy = false;
    { const s0 = subAt((x0 + x1) / 2, (z0 + z1) / 2), ax = Math.min(x0, x1) - 0.06, bx = Math.max(x0, x1) + 0.06, az = Math.min(z0, z1) - 0.06, bz = Math.max(z0, z1) + 0.06;
      const over = q => q.x0 < bx && q.x1 > ax && q.z0 < bz && q.z1 > az, within = q => q.x0 <= ax && q.x1 >= bx && q.z0 <= az && q.z1 >= bz;
      for (const list of y0 > 1.5 && s0.roofs ? [s0.surfaces, s0.roofs] : [s0.surfaces]) { for (let i = 0; i < list.length && !busy; i++) { const s = list[i]; if (s.hill || !over(s)) continue; if (s === on0 && within(s)) continue; const top = Math.max(s.h0, s.h1); if (top < y0 - 1.7 || (s.thick ? Math.min(s.h0, s.h1) - s.thick : s.base || 0) > y0 + 0.7) continue; busy = true; } if (busy) break; }
      if (!busy) for (const f of s0.floors) if (f.y > y0 - 1.7 && f.y < y0 + 0.3 && over(f) && !within(f)) { busy = true; break; }
      if (!busy) for (const q of plan.pits) if (over(q)) { busy = true; break; }
      if (!busy) for (const q of plan.wells) if (over(q)) { busy = true; break; }
    }
    const n = busy ? Math.max(1, Math.ceil(d / SUB)) : d > 0.6 ? 2 : 1, l = d / n; let yy = y0, on = on0, drop = 0, x = x0, z = z0;
    for (let i = 1; i <= n; i++) {
      x = x0 + (x1 - x0) * i / n; z = z0 + (z1 - z0) * i / n;
      const sub = subAt(x, z);
      if (wallAt(sub, x, z, yy, STEP, on)) return 0;
      const g = groundAt(sub, x, z, yy, STEP, on), u = sub.under, rise = g - yy;
      if (rise > (u && u.hill ? Math.max(STEP, l * CLIMB) : u && u === on ? Math.max(STEP, l * 1.3) : STEP + 0.005)) return 0;
      if (rise < -Math.max(0.12, l * 1.3)) { drop -= rise; if (drop > 0.35) return -1; }
      if (wet && (!u || u.land) && wet(x, z)) return -1;
      yy = g; on = u;
      if (i === n || !busy || !(i & 1)) {
        if (!clear(sub, x, yy, z, i === n ? RAD : 0.2)) {
          if (i < n || !snap || Math.hypot(P3.x - x, P3.z - z) > 0.3) return 0;
          x = P3.x; z = P3.z; const s2 = subAt(x, z), g2 = groundAt(s2, x, z, yy, STEP, on); if (Math.abs(g2 - yy) > 0.08 || wallAt(s2, x, z, yy, STEP, on)) return 0; yy = g2; on = s2.under;
        }
      }
    }
    W.x = x; W.y = yy; W.z = z; W.on = on; W.drop = drop;
    return 1;
  }
  const DX = [1, -1, 0, 0, 1, 1, -1, -1], DZ = [0, 0, 1, -1, 1, -1, 1, -1], DIST = DX.map((d, k) => Math.hypot(d, DZ[k]) * CELL), OFF = DX.map((d, k) => d + DZ[k] * NX);
  const slope = (dh, d) => { const g = dh / d; return g > 0.1 ? (g - 0.1) * (g - 0.1) * 12 * d + dh * 1.2 : g < -0.15 ? (g + 0.15) * (g + 0.15) * 6 * d : 0; };
  // Where a spot's eight steps lead: [to, cost, how] in threes. `how`: 0 a step, 1 a step down off something, 2 + n a leap (leaps[n]).
  function explore(e) {
    const out = [], ex = spots.x[e], ez = spots.z[e], ey = spots.y[e], on = spots.on[e], ci = Math.floor((ex - X0) / CELL), cj = Math.floor((ez - Z0) / CELL), hill = !on || on.hill, c0 = spots.cell[e];
    for (let k = 0; k < 8; k++) {
      // Beside the kit, a step that does not go onto it is a step over plain ground, and is taken as one.
      if (c0 >= 0) { const v = c0 + OFF[k], kv = K[v];
        if (!(kv & KIT)) {
          if ((kv & SOLID) || (k >= 4 && ((K[c0 + DX[k]] | K[c0 + DZ[k] * NX]) & SOLID))) continue;
          const e2 = kv & RING ? baseSpot(v) : -2; if (e2 === -1) continue;
          const hv = e2 >= 0 ? spots.y[e2] : H[v], dh = hv - ey; if (dh > DIST[k] * CLIMB || dh < -DIST[k] * 1.1) continue;
          out.push(e2 >= 0 ? NC + e2 : v, DIST[k] * (spots.cost[e] + (e2 >= 0 ? spots.cost[e2] : costOf(v))) * 0.5 + slope(dh, DIST[k]), 0); continue;
        } }
      const tx = X0 + (ci + DX[k] + 0.5) * CELL, tz = Z0 + (cj + DZ[k] + 0.5) * CELL, r = step(ex, ez, ey, on, tx, tz, true);
      if (r === 1) {
        const c2 = cellOf(W.x, W.z), d = Math.hypot(W.x - ex, W.z - ez), dh = W.y - ey; let to = -1, cost;
        if (c2 >= 0 && !(K[c2] & (SPOT | MASS)) && Math.abs(W.y - H[c2]) < 0.2) { if (!(K[c2] & SOLID)) { to = c2; cost = costOf(c2); } }
        else if (c2 >= 0 && (K[c2] & RING) && Math.abs(W.y - H[c2]) < 0.2) { const e2 = baseSpot(c2); if (e2 >= 0) { to = NC + e2; cost = spots.cost[e2]; } }
        else { const e2 = spot(W.x, W.z, W.y, W.on); to = NC + e2; cost = spots.cost[e2]; }
        if (to >= 0) out.push(to, Math.hypot(d, dh) * (spots.cost[e] + cost) * 0.5 + (hill ? slope(dh, d) : 0) + (W.drop > 0.1 ? 0.6 : 0), W.drop > 0.1 ? 1 : 0);
      }
      // Off the top of a rising ramp: is there somewhere to come down?
      if (k < 4 && on && !on.hill && on.axis && !on.curve && (r === -1 || (r === 1 && W.drop > 0.1))) { const lp = leap(e, DX[k], DZ[k]); if (lp) { leaps.push(lp); out.push(lp.to, lp.cost, 1 + leaps.length); } }
    }
    return out;
  }
  // The flight off the lip of the ramp a spot is on, along (ux, uz), at the least of a few speeds that comes down well.
  function leap(e, ux, uz) {
    const on = spots.on[e], x0 = spots.x[e], z0 = spots.z[e], hz = (x, z) => heightOf(on, Math.max(on.x0, Math.min(on.x1, x)), Math.max(on.z0, Math.min(on.z1, z)));
    const tan = (hz(x0 + ux * 0.2, z0 + uz * 0.2) - hz(x0 - ux * 0.2, z0 - uz * 0.2)) / 0.4;
    if (tan < 0.08 || tan > 1.3) return null;
    // On up to the lip, the car's way.
    let lx = x0, lz = z0, ly = spots.y[e];
    for (let s = SUB; s < 1.6; s += SUB) { const x = x0 + ux * s, z = z0 + uz * s; if (x < on.x0 || x > on.x1 || z < on.z0 || z > on.z1) break; const sub = subAt(x, z); if (wallAt(sub, x, z, ly, STEP, on)) return null; const g = groundAt(sub, x, z, ly, STEP, on); if (sub.under !== on) break; lx = x; lz = z; ly = g; }
    const th = Math.atan(tan);
    for (const v of [4.5, 6.5, 8.5]) {
      let x = lx, z = lz, y = ly, vy = v * Math.sin(th), vh = v * Math.cos(th), hit = null;
      for (let t = 0; t < 1.6 && !hit; t += 0.02) {
        x += ux * vh * 0.02; z += uz * vh * 0.02; vy -= GRAVITY * 0.02; y += vy * 0.02;
        const sub = subAt(x, z), g = groundAt(sub, x, z, y + 0.1);
        if (y <= g) hit = { x, y: g, z, on: sub.under, sub }; else if (vy > 0 && wallAt(sub, x, z, y)) break;
      }
      if (!hit) continue;
      const far = Math.hypot(hit.x - lx, hit.z - lz);
      if (far < 0.5 || hit.y < ly - 0.9 || (wet && (!hit.on || hit.on.land) && wet(hit.x, hit.z)) || hit.on === on || !clear(hit.sub, hit.x, hit.y, hit.z, RAD)) continue;
      // Somewhere to run out: a metre and a bit on from where the wheels come down.
      if (step(hit.x, hit.z, hit.y, hit.on, hit.x + ux * 1.2, hit.z + uz * 1.2, false) !== 1 || W.drop > 0.1) continue;
      const c2 = cellOf(W.x, W.z); let to;
      if (c2 >= 0 && !(K[c2] & (SPOT | MASS)) && Math.abs(W.y - H[c2]) < 0.2) { if (K[c2] & SOLID) continue; to = c2; } else to = NC + spot(W.x, W.z, W.y, W.on);
      const end = { x: W.x, y: W.y, z: W.z };
      return { from: NC + e, to, lip: { x: lx, y: ly, z: lz }, land: { x: hit.x, y: hit.y, z: hit.z }, end, th, v, cost: (Math.hypot(lx - x0, lz - z0) + far + 1.2) * 0.92 };
    }
    return null;
  }

  // ---- where a point is, on all this ---------------------------------------------------------
  // The place to stand at (x, z) nearest to height y: a cell, a spot, or -1. With `wide`, the nearest there is within a
  // couple of metres (a point given inside a tree, on the wrong side of a kerb, a little off the ground).
  function nodeAt(x, z, y, wide) {
    const c = cellOf(x, z);
    if (c >= 0 && !(K[c] & (SPOT | MASS)) && !(K[c] & SOLID) && Math.abs(H[c] - y) < 0.6) return c;
    {      // (not the street's level here, or not plain ground: is there something at this height to stand on?)
      const sub = subAt(x, z), g = groundAt(sub, x, z, y + 0.35, 0.3), u = sub.under, street = c >= 0 && !(K[c] & (SPOT | MASS)) && Math.abs(H[c] - g) < 0.2;      // (the street's own level over plain ground: the field has the last word on it)
      if (street) { if (!(K[c] & SOLID)) return c; }
      else if (Math.abs(g - y) < (wide ? 1.2 : 0.75) && !wallAt(sub, x, z, g, STEP, u) && !(wet && (!u || u.land) && wet(x, z))) {
        if (clear(sub, x, g, z, RAD)) return NC + spot(x, z, g, u);
        if (Math.hypot(P3.x - x, P3.z - z) < 0.4) { const px = P3.x, pz = P3.z, s2 = subAt(px, pz), g2 = groundAt(s2, px, pz, g + 0.1, 0.1, u); if (Math.abs(g2 - g) < 0.15 && clear(s2, px, g2, pz, RAD * 0.9)) return NC + spot(px, pz, g2, s2.under); }
      }
    }
    if (!wide) return -1;
    if (c >= 0 && !(K[c] & (SPOT | MASS | SOLID)) && Math.abs(H[c] - y) < 3) return c;      // (given a little off the ground, over open ground: the ground)
    for (let r = 1; r <= 5; r++) { let best = -1, bd = Infinity;
      for (let a = 0; a < 8 * r; a++) { const th = a / (8 * r) * Math.PI * 2, px = x + Math.cos(th) * r * CELL, pz = z + Math.sin(th) * r * CELL, n = nodeAt(px, pz, y, false); if (n >= 0) { const d = Math.abs(yOf(n) - y); if (d < bd) { bd = d; best = n; } } }
      if (best >= 0) return best; }
    return -1;
  }
  // For something that flies: the cell under it, if that is not a building.
  const flyAt = (x, z) => { const c = cellOf(x, z); return c >= 0 && !(K[c] & MASS) ? c : -1; };
  const xN = n => (n >= NC ? spots.x[n - NC] : xOf(n)), zN = n => (n >= NC ? spots.z[n - NC] : zOf(n)), yOf = n => (n >= NC ? spots.y[n - NC] : H[n]);
  const placeOfNode = n => (n >= NC ? spots.pl[n - NC] : null);
  // The ground under a point, for something lying on it at about height y: what the car would be standing on there.
  const U = { on: null };
  function groundUnder(x, z, y, on, reach = 0.3) { const sub = subAt(x, z), g = groundAt(sub, x, z, y + reach, reach, on); U.on = sub.under; return g; }
  // Metres from (x, z), at height y, to the nearest thing a car cannot be in (a guess of plenty where the field does not say).
  function room(x, z) { const c = cellOf(x, z); return c < 0 ? 0 : (K[c] & SOLID) ? 0 : D[c] * 0.05; }
  const street = (x, z) => { const c = cellOf(x, z); return c >= 0 && !(K[c] & (MASS | SPOT)) ? H[c] : null; };

  // ---- the search ------------------------------------------------------------------------------
  const gC = new Float32Array(NC), par = new Int32Array(NC), st = new Uint16Array(NC); let q = 0;
  let hk = new Float32Array(4096), hv = new Int32Array(4096), hn = 0;
  const push = (f, v) => { if (hn === hk.length) { const a = new Float32Array(hn * 2), b = new Int32Array(hn * 2); a.set(hk); b.set(hv); hk = a; hv = b; } let i = hn++; while (i > 0) { const p = (i - 1) >> 1; if (hk[p] <= f) break; hk[i] = hk[p]; hv[i] = hv[p]; i = p; } hk[i] = f; hv[i] = v; };
  const pop = () => { const top = hv[0], f = hk[--hn], v = hv[hn]; let i = 0; for (;;) { let l = 2 * i + 1; if (l >= hn) break; if (l + 1 < hn && hk[l + 1] < hk[l]) l++; if (hk[l] >= f) break; hk[i] = hk[l]; hv[i] = hv[l]; i = l; } hk[i] = f; hv[i] = v; return top; };
  // o: { n: how many of the building's ways; adj(m): [[m2, cost, how], ...]; at(m): { x, z }; anchor: Int32Array(n), the
  //   cell or spot each stands at out of doors (or -1); S, T: which of them are the start and the end; open: the places
  //   (rooms, decks) whose floors may be driven over spot by spot (the end is up on something there); portals(place, n):
  //   [[m, cost], ...], the ways of a room for something that has just driven onto its floor at n; fly: a drone
  //   (straight over anything that is not a building); limit: how many places may be looked at }
  // Returns { cost, path: [node, ...], looked } or null. A node below VB is a cell or a spot; from VB up, way m + VB.
  const EPS = 1.08;                 // how far the straight line is trusted: the way found is within this of the best
  function search(o) {
    finish();
    if (++q > 32000) { st.fill(0); for (let e = 0; e < spots.n; e++) spots.st[e] = 0; q = 1; }
    const open = q << 1, shut = open | 1, nv = o.n, vg = new Float64Array(nv).fill(Infinity), vp = new Int32Array(nv).fill(-1), vs = new Uint8Array(nv), anchor = o.anchor;
    const tgt = o.at(o.T), tx = tgt.x, tz = tgt.z, fly = !!o.fly, limit = o.limit || 260000, block = fly ? MASS : SOLID;
    const back = new Map();          // which ways stand at a cell or a spot
    for (let m = 0; m < nv; m++) { const a = anchor[m]; if (a < 0) continue; if (back.has(a)) back.get(a).push(m); else back.set(a, [m]); if (a < NC) K[a] |= ANCH; }
    const hOf = (x, z) => Math.sqrt((x - tx) * (x - tx) + (z - tz) * (z - tz)) * EPS;
    const relax = (v, g, from) => {
      if (v >= VB) { const m = v - VB; if (vs[m] === 2 || g >= vg[m]) return; vg[m] = g; vp[m] = from; vs[m] = 1; const p = o.at(m); push(g + hOf(p.x, p.z), v); }
      else if (v >= NC) { const e = v - NC; if (spots.st[e] === shut || (spots.st[e] === open && g >= spots.g[e])) return; spots.g[e] = g; spots.par[e] = from; spots.st[e] = open; push(g + hOf(spots.x[e], spots.z[e]), v); }
      else { if (st[v] === shut || (st[v] === open && g >= gC[v])) return; gC[v] = g; par[v] = from; st[v] = open; push(g + hOf(xOf(v), zOf(v)), v); }
    };
    hn = 0; vg[o.S] = 0; vs[o.S] = 1; push(0, o.S + VB);
    let looked = 0, found = false, driven = 0; const drive = o.drive || 5000;      // (how many new spots may be driven to in one search: each is a few dozen questions of the plan)
    const bound = o.bound || Infinity;       // (give up once nothing left to look at could be on a way as short as this)
    while (hn) {
      if (hk[0] > bound) break;
      const u = pop();
      if (u >= VB) {
        const m = u - VB; if (vs[m] === 2) continue; vs[m] = 2; if (m === o.T) { found = true; break; }
        const g = vg[m]; for (const [m2, c] of o.adj(m)) relax(m2 + VB, g + c, u);
        if (anchor[m] >= 0) relax(anchor[m], g + (o.reach ? o.reach[m] : 0), u);
      } else if (u >= NC) {
        const e = u - NC; if (spots.st[e] === shut) continue; spots.st[e] = shut; if (++looked > limit) break;
        const g = spots.g[e], pl = spots.pl[e];
        const ms = back.get(u); if (ms) for (const m of ms) relax(m + VB, g + (o.reach ? o.reach[m] : 0), u);
        if (pl && !(o.open && o.open.has(pl))) { if (!o.sealed) for (const [m, c] of o.portals(pl, u)) relax(m + VB, g + c, u); continue; }      // onto a room's floor: from here it is the room's own ways (not while the building is locked: nothing shows a way in before one is found)
        if (fly) continue;
        let out = spots.out[e]; if (!out) { if (++driven > drive) break; const t0 = now(); out = spots.out[e] = explore(e); T.ex++; T.exMs += now() - t0; }
        for (let i = 0; i < out.length; i += 3) relax(out[i], g + out[i + 1], u);
      } else {
        if (st[u] === shut) continue; st[u] = shut; if (++looked > limit) break;
        const g = gC[u], ku = K[u], hu = H[u], cu = fly ? 1 : CC[u];
        if (ku & ANCH) { const ms = back.get(u); if (ms) for (const m of ms) relax(m + VB, g + (o.reach ? o.reach[m] : 0), u); }
        for (let k = 0; k < 8; k++) {
          const v = u + OFF[k], kv = K[v];
          if (kv & block) continue;
          if (k >= 4 && ((K[u + DX[k]] | K[u + DZ[k] * NX]) & block)) continue;
          if (fly) { relax(v, g + DIST[k], u); continue; }
          if (kv & SPOT) { const e = baseSpot(v); if (e < 0) continue; const dh = spots.y[e] - hu; if (dh > DIST[k] * CLIMB || dh < -DIST[k] * 1.1) continue; relax(NC + e, g + DIST[k] * (cu + spots.cost[e]) * 0.5 + slope(dh, DIST[k]), u); continue; }
          const dh = H[v] - hu; if (dh > DIST[k] * CLIMB || dh < -DIST[k] * 1.1) continue;
          relax(v, g + DIST[k] * (cu + CC[v]) * 0.5 + slope(dh, DIST[k]), u);
        }
      }
    }
    for (const a of back.keys()) if (a < NC) K[a] &= ~ANCH;
    if (!found) return null;
    const path = [];
    for (let u = o.T + VB; u >= 0;) { path.push(u); u = u >= VB ? vp[u - VB] : u >= NC ? spots.par[u - NC] : par[u]; if (u === o.S + VB) { path.push(u); break; } }
    path.reverse();
    return { cost: vg[o.T], path, looked };
  }
  const gOf = n => (n >= NC ? spots.g[n - NC] : gC[n]);
  // A stretch of the way just found, over cells and spots, as points: pulled straight wherever the straight line costs
  // no more than the way round did (so it keeps to a path it chose, and clear of what it went round), and with every
  // leap flown. Each point: { x, y, z, o: true, rigid (it is on the kit: not to be moved), air }.
  function line(nodes, fly) {
    const n = nodes.length, out = [], plain = nodes.map(v => v < NC && !(K[v] & SPOT));
    const straight = (a, b, budget) => {
      const ax = xOf(a), az = zOf(a), bx = xOf(b), bz = zOf(b), d = Math.hypot(bx - ax, bz - az), m = Math.max(1, Math.ceil(d / (CELL * 0.5))), ds = d / m; let cost = 0, ph = H[a], pc = fly ? 1 : costOf(a);
      for (let i = 1; i <= m; i++) {
        const c = cellOf(ax + (bx - ax) * i / m, az + (bz - az) * i / m); if (c < 0 || (K[c] & (fly ? MASS : SOLID | SPOT))) return false;
        if (fly) { cost += ds; continue; }
        const dh = H[c] - ph, cc = costOf(c); if (dh > ds * CLIMB || dh < -ds * 1.1) return false;
        cost += ds * (pc + cc) * 0.5 + slope(dh, ds); if (cost > budget) return false; ph = H[c]; pc = cc;
      }
      return true;
    };
    for (let i = 0; i < n;) {
      const v = nodes[i]; out.push({ x: xN(v), y: fly && v < NC ? H[v] : yOf(v), z: zN(v), o: true, rigid: !plain[i] && !fly });
      if (i === n - 1) break;
      let best = i + 1;
      if (plain[i] || fly) { let e = i + 1; while (e < n && e - i < 90 && (fly ? nodes[e] < NC : plain[e])) e++; for (let j = e - 1; j > i + 1; j--) if (straight(v, nodes[j], (gOf(nodes[j]) - gOf(v)) * 1.006 + 0.02)) { best = j; break; } }
      else if (v >= NC) {
        const w = nodes[i + 1], outE = spots.out[v - NC];
        if (outE) for (let k = 0; k < outE.length; k += 3) if (outE[k] === w && outE[k + 2] >= 2) {
          const lp = leaps[outE[k + 2] - 2], ux = lp.land.x - lp.lip.x, uz = lp.land.z - lp.lip.z, far = Math.hypot(ux, uz), kk = GRAVITY / (2 * lp.v * lp.v * Math.cos(lp.th) ** 2);
          out.push({ ...lp.lip, o: true, rigid: true, air: false });
          for (let s = 0.25; s < far; s += 0.25) out.push({ x: lp.lip.x + ux * s / far, y: Math.max(lp.land.y, lp.lip.y + s * Math.tan(lp.th) - kk * s * s), z: lp.lip.z + uz * s / far, o: true, rigid: true, air: true });
          out.push({ ...lp.land, o: true, rigid: true, air: false }); out[out.length - 1].speed = lp.v;
        }
      }
      i = best;
    }
    return out;
  }

  return { CELL, NC, tick, finish, sync, search, line, nodeAt, flyAt, baseSpot, xN, zN, yOf, placeOfNode, groundUnder, U, room, street, subAt,
    get built() { return T.built; }, get ms() { return T.ms; }, reset() { T.built = false; T.phase = 0; T.ms = 0; spots.clear(); },
    forget() { spots.clear(); },
    get stats() { return { cells: NC, spots: spots.n, leaps: leaps.length, explored: T.ex, exploreMs: +T.exMs.toFixed(1), buildMs: +T.ms.toFixed(1), bytes: H.byteLength + K.byteLength + C.byteLength + D.byteLength + CC.byteLength + gC.byteLength + par.byteLength + st.byteLength }; },
    _dbg: { H, K, C, D, NX, NZ, X0, Z0, spots, leaps, cellOf, step, W, explore, costOf } };
}
