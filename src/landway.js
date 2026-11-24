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
const SUB = 0.125;               // a step is tried in lengths of this
const SIDE = 0.24;               // and this far to either side of it nothing may stand taller than a wheel climbs
export const CLIMB = 0.85;       // the steepest the plain car climbs from a standing start at half throttle (1.2 m/s at 0.8, a stall at 1.0)
const KEEP = 0.7;                // nearer than this to something solid costs
const MASS = 1, OBST = 2, KIT = 4, RING = 8, WET = 16, WALL = 32, EDGE = 64, ANCH = 128;
const SOLID = MASS | OBST | WET | WALL, SPOT = KIT | RING;
const UNIT = 40;                 // a cell's cost: this many to the metre
const PAVE = 1, ROAD = 1.06, SNOW = 1.13, ICE = 1.22, BLACK = 1.7;     // what a metre costs, by what is underfoot: a mild preference, no more
export const VB = 1 << 27;              // the building's ways are numbered from here

export function createLandway(plan) {
  // The field covers the plan's bounds and any strip of ground beyond them that may be driven (plan.allow: the foot of the bridgeway).
  const B = plan.bounds, F = (plan.allow || []).reduce((f, q) => ({ x0: Math.min(f.x0, q.x0), x1: Math.max(f.x1, q.x1), z0: Math.min(f.z0, q.z0), z1: Math.max(f.z1, q.z1) }), { x0: B.x0, x1: B.x1, z0: B.z0, z1: B.z1 });
  const X0 = F.x0 - CELL, Z0 = F.z0 - CELL, NX = Math.ceil((F.x1 - F.x0) / CELL) + 2, NZ = Math.ceil((F.z1 - F.z0) / CELL) + 2, NC = NX * NZ, INV = 1 / UNIT;
  const H = new Float32Array(NC), K = new Uint8Array(NC), C = new Uint8Array(NC), D = new Uint8Array(NC), CC = new Uint8Array(NC);      // height; what it is; what is underfoot; how far from anything solid; what a metre costs (UNIT to the metre)
  const nbX = Math.ceil(NX / 8), nbZ = Math.ceil(NZ / 8), NCN = nbX * nbZ * 8, lab = new Uint8Array(NC), blockOf = c => (Math.floor(c / NX) >> 3) * nbX + ((c % NX) >> 3);      // (the field in blocks, for the coarse look: see guide)
  const coarse = { ready: false, min: new Uint8Array(NCN), adj: new Array(NCN), far: new Float32Array(NCN) };
  const cellOf = (x, z) => { const i = Math.floor((x - X0) / CELL), j = Math.floor((z - Z0) / CELL); return i < 1 || j < 1 || i >= NX - 1 || j >= NZ - 1 ? -1 : j * NX + i; };
  const xOf = c => X0 + (c % NX + 0.5) * CELL, zOf = c => Z0 + (Math.floor(c / NX) + 0.5) * CELL;
  const wet = plan.lakefront && plan.lakefront.wet ? plan.lakefront.wet : null;
  const DX = [1, -1, 0, 0, 1, 1, -1, -1], DZ = [0, 0, 1, -1, 1, -1, 1, -1], DIST = DX.map((d, k) => Math.hypot(d, DZ[k]) * CELL), OFF = DX.map((d, k) => d + DZ[k] * NX);
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
  function sort(list, into, pad, from, to) {
    for (let n = from; n < to; n++) {
      const q = list[n]; if (!(q.x1 >= q.x0) || !(q.z1 >= q.z0) || q.train) continue;
      const i0 = Math.max(0, Math.floor((q.x0 - pad - bx0) / BK)), i1 = Math.min(nbx - 1, Math.floor((q.x1 + pad - bx0) / BK)), j0 = Math.max(0, Math.floor((q.z0 - pad - bz0) / BK)), j1 = Math.min(nbz - 1, Math.floor((q.z1 + pad - bz0) / BK));
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const k = j * nbx + i; (subs[k] || (subs[k] = blank()))[into].push(q); }
    }
  }
  // (A few thousand at a time while the field is being made; all at once when something has been set down or taken up since: a fire door's bars, a cage.)
  let seen = null, queue = [], qi = 0;
  const low = new Set();           // pieces that lie no higher than a wheel climbs (a plate, a low block of ice, a floe): ground like any other
  function sortBegin() {
    subs.fill(null); qi = 0; seen = new Set(plan.obstacles);
    queue = [[plan.surfaces, 'surfaces', 1.2], [plan.roofs || [], 'roofs', 1.2], [plan.floors, 'floors', 1.2], [plan.obstacles, 'obstacles', 1.2], [plan.boxes, 'boxes', 1.2], [plan.masses, 'masses', 1.2],
      [plan.surfaces.filter(s => s.hill || low.has(s)), '_hills', 0.1], [plan.rooms, '_rooms', 0.1], [plan.decks, '_decks', 0.1]];
  }
  function sortSome(n) {
    while (n > 0 && queue.length) { const [list, into, pad] = queue[0], e = Math.min(list.length, qi + n); sort(list, into, pad, qi, e); n -= Math.max(1, e - qi); qi = e; if (e >= list.length) { queue.shift(); qi = 0; } }
    return !queue.length;
  }
  function sortAll() { sortBegin(); sortSome(Infinity); }

  // ---- the field ----------------------------------------------------------------------------
  const mark = (x0, x1, z0, z1, pad, f) => {
    const i0 = Math.max(1, Math.ceil((x0 - pad - X0) / CELL - 0.5)), i1 = Math.min(NX - 2, Math.floor((x1 + pad - X0) / CELL - 0.5)), j0 = Math.max(1, Math.ceil((z0 - pad - Z0) / CELL - 0.5)), j1 = Math.min(NZ - 2, Math.floor((z1 + pad - Z0) / CELL - 0.5));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) f(j * NX + i);
  };
  const T = { built: false, phase: 0, row: 1, col: 1, k: 0, ms: 0, worst: 0, step: [], ex: 0, exMs: 0, open: null };
  let soft = null, kitted = [], blocks = [];
  function classify() {
    // What stands on the street, and how. `low` is ground. What is well under the ground, or overhead with room for a
    // car beneath, is nothing to a car on the street (it matters only to something already down there or up on it).
    // A level block too tall for a wheel is a wall, and no more. What is left (anything that slopes, anything with a
    // shape of its own, a lift) is kit: driven, not read.
    low.clear(); kitted = []; blocks = [];
    for (const s of plan.surfaces) {
      if (s.hill) continue;
      const sy = streetY(plan, (s.x0 + s.x1) / 2, (s.z0 + s.z1) / 2), top = Math.max(s.h0, s.h1), bot = s.thick ? Math.min(s.h0, s.h1) - s.thick : s.base || 0, level = !s.axis && !s.fn && !s.lift;
      if (top < sy - 0.3 || bot > sy + (level ? 0.24 : 0.6)) continue;
      if (top <= sy + STEP - 0.004 && top >= sy - 0.02 && !s.lift) low.add(s); else if (level) blocks.push(s); else kitted.push(s);
    }
  }
  // Nothing can be beyond the bounds, the car's width short of them, except in a strip that may be driven.
  function begin() { K.fill(MASS); C.fill(Math.round(SNOW * UNIT)); soft = new Uint8Array(NC); }
  const openGround = () => [{ x0: B.x0 + RAD, x1: B.x1 - RAD, z0: B.z0 + RAD, z1: B.z1 - RAD }, ...(plan.allow || [])];
  function outRow(j, i0, i1) { const z = Z0 + (j + 0.5) * CELL; for (const q of T.open || (T.open = openGround())) { if (z <= q.z0 || z >= q.z1) continue; const a = Math.max(i0, Math.ceil((q.x0 - X0) / CELL - 0.5)), b = Math.min(i1, Math.floor((q.x1 - X0) / CELL - 0.5)); if (b >= a) K.fill(0, j * NX + a, j * NX + b + 1); } }
  // The buildings; then where a place to stand has to be found by driving: on and beside every piece of kit, and in
  // every lift. Round a hole in the ground (a pit, a well) each cell is looked at as it is read: lidded over, it is
  // ground; open, it is kit. (Each of these is one small job: see `batch`.)
  const layKit = () => [
    ...plan.masses.filter(m => m.top > 0.9).map(m => () => mark(m.x0, m.x1, m.z0, m.z1, RAD, c => { K[c] |= MASS; })),
    ...kitted.map(s => () => mark(s.x0, s.x1, s.z0, s.z1, 0.3, c => { K[c] |= KIT; })),
    ...blocks.map(s => () => mark(s.x0, s.x1, s.z0, s.z1, RAD, c => { K[c] |= WALL; })),
    ...(plan.lifts || []).map(q => () => mark(q.x0, q.x1, q.z0, q.z1, 0.5, c => { K[c] |= KIT; })),
    ...[...(plan.pits || []), ...(plan.wells || [])].map(q => () => mark(q.x0, q.x1, q.z0, q.z1, 0.5, c => { soft[c] = 1; }))];
  // What is underfoot. Later ones lie over earlier.
  const ROADC = Math.round(ROAD * UNIT), PAVEC = Math.round(PAVE * UNIT);
  const layGround = () => {
    const put = (q, v) => () => mark(q.x0, q.x1, q.z0, q.z1, 0, c => { C[c] = v; }), Gd = plan.grounds || {}, L = plan.lakefront;
    return [...(plan.paved || []).map(q => put(q, PAVEC)),
      ...[Gd.michigan, Gd.columbus, L && L.lsd].filter(Boolean).map(s => put({ x0: s.x0, x1: s.x1, z0: B.z0, z1: B.z1 }, ROADC)),
      ...[Gd.monroe, Gd.jackson].filter(Boolean).map(s => put({ x0: B.x0, x1: B.x1, z0: s.z0, z1: s.z1 }, ROADC)),
      ...[...(Gd.paths || []), ...((L && L.paths) || [])].map(q => put(q, PAVEC)),
      ...(Gd.plazas || []).map(q => () => mark(q.x - q.r, q.x + q.r, q.z - q.r, q.z + q.r, 0, c => { if ((xOf(c) - q.x) ** 2 + (zOf(c) - q.z) ** 2 < q.r * q.r) C[c] = PAVEC; }))];
  };
  // Ice, by how well it holds (a sheet may say, spot by spot: crust): snowed over is only ice, glassy is black ice. Where two sheets say, the worse.
  function iceRow(j, i0, i1) {
    const z = Z0 + (j + 0.5) * CELL, sheets = plan.ice || [];
    for (let n = 0; n < sheets.length; n++) { const q = sheets[n]; if (z < q.z0 || z > q.z1) continue;
      const a = Math.max(i0, Math.ceil((q.x0 - X0) / CELL - 0.5)), b = Math.min(i1, Math.floor((q.x1 - X0) / CELL - 0.5)), crust = typeof q.crust === 'function' ? q.crust : null;
      for (let i = a; i <= b; i++) { const c = j * NX + i, k = crust ? crust(X0 + (i + 0.5) * CELL, z) : q.crust ? 0.85 : 0, v = Math.round((BLACK + (ICE - BLACK) * Math.min(1, k / 0.6)) * UNIT); C[c] = soft[c] & 2 ? Math.max(C[c], v) : v; soft[c] |= 2; } }
  }
  // The way staked out across the ice is a path like any other.
  function layWay() {
    const way = plan.lakefront && plan.lakefront.safeWay;
    if (way) for (let k = 0; k + 1 < way.length; k++) { const [ax, az] = way[k], [bx, bz] = way[k + 1], dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz || 1;
      mark(Math.min(ax, bx), Math.max(ax, bx), Math.min(az, bz), Math.max(az, bz), 1.6, c => { const x = xOf(c), z = zOf(c), t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / l2)); if (Math.hypot(x - ax - dx * t, z - az - dz * t) < 1.6) C[c] = PAVEC; }); }
  }
  function heights(j, i0, i1) {
    for (let i = i0; i <= i1; i++) {
      const c = j * NX + i, k = K[c]; if (k & MASS) continue;
      const x = X0 + (i + 0.5) * CELL, z = Z0 + (j + 0.5) * CELL, sy = streetY(plan, x, z), sub = subAt(x, z); let h = sy;
      if ((k & KIT) || (soft[c] & 1)) {
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
  // that and what is underfoot, what a metre of it costs. A row at a time: the brink of every drop is found, the
  // distances are swept forwards and then back, and the costs are written. `w`: only this much of the field (after a change).
  const A = 10, G2 = 14, lo = (c, v) => { if (v < D[c]) D[c] = v; };
  const near = new Uint8Array(256); for (let d = 0; d < 256; d++) { const m = d * 0.05; near[d] = m >= KEEP ? 0 : Math.round(((KEEP - m) / KEEP) ** 2 * 2.6 * UNIT); }
  const costOf = c => CC[c] * INV;
  const steep = (c, n, h) => !(K[n] & MASS) && Math.abs(H[n] - h) > 0.9;
  function brinkRow(j, i0, i1, edge) {
    for (let i = i0; i <= i1; i++) { const c = j * NX + i; let k = K[c] & ~EDGE; if (!(k & SOLID)) { const h = H[c]; if (steep(c, c - 1, h) || steep(c, c + 1, h) || steep(c, c - NX, h) || steep(c, c + NX, h)) k |= EDGE; } K[c] = k; if (!edge || (i > i0 && i < i1 && !edge(j))) D[c] = k & (SOLID | EDGE) ? 0 : 250; }
  }
  function fwdRow(j, i0, i1) { for (let i = i0; i <= i1; i++) { const c = j * NX + i; if (!D[c]) continue; lo(c, D[c - 1] + A); lo(c, D[c - NX] + A); lo(c, D[c - NX - 1] + G2); lo(c, D[c - NX + 1] + G2); } }
  function backRow(j, i0, i1) { for (let i = i1; i >= i0; i--) { const c = j * NX + i; if (!D[c]) continue; lo(c, D[c + 1] + A); lo(c, D[c + NX] + A); lo(c, D[c + NX + 1] + G2); lo(c, D[c + NX - 1] + G2); } }
  function costRow(j, i0, i1) { for (let i = i0; i <= i1; i++) { const c = j * NX + i; CC[c] = Math.min(255, C[c] + near[D[c]]); } }
  function ringRow(j, i0, i1) { for (let i = i0; i <= i1; i++) { const c = j * NX + i; if (K[c] & KIT) continue; if ((K[c - 1] | K[c + 1] | K[c - NX] | K[c + NX] | K[c - NX - 1] | K[c - NX + 1] | K[c + NX - 1] | K[c + NX + 1]) & KIT) K[c] |= RING; } }      // beside the kit: where a step onto it starts from
  function costs(w) {
    for (let j = w.j0; j <= w.j1; j++) brinkRow(j, w.i0, w.i1, r => r === w.j0 || r === w.j1);      // (the rim of the window keeps the distances it had: the rest is measured from them)
    for (let j = w.j0; j <= w.j1; j++) fwdRow(j, w.i0, w.i1);
    for (let j = w.j1; j >= w.j0; j--) backRow(j, w.i0, w.i1);
    for (let j = w.j0; j <= w.j1; j++) costRow(j, w.i0, w.i1);
  }
  // For the coarse look: the joined-up parts of each block (a row of blocks at a time), and which parts of neighbouring blocks each joins.
  const joined = (a, b) => ((K[a] | K[b]) & SPOT) !== 0 || Math.abs(H[a] - H[b]) <= CELL * 1.1;
  const stack = new Int32Array(64);
  function parts(bj) {
    if (bj === 0) { lab.fill(0); coarse.min.fill(255); coarse.adj.fill(undefined); }
    for (let bi = 0; bi < nbX; bi++) {
      const i0 = bi * 8, j0 = bj * 8, i1 = Math.min(NX, i0 + 8), j1 = Math.min(NZ, j0 + 8), base = (bj * nbX + bi) * 8; let n = 0;
      for (let j = j0; j < j1; j++) for (let i = i0; i < i1; i++) {
        const c = j * NX + i; if ((K[c] & SOLID) || lab[c]) continue;
        const id = Math.min(8, ++n); let top = 0, least = 255; stack[top++] = c; lab[c] = id;
        while (top) { const u = stack[--top], ui = u % NX, uj = (u - ui) / NX; if (CC[u] < least) least = CC[u];
          if (ui + 1 < i1) { const v = u + 1; if (!(K[v] & SOLID) && !lab[v] && joined(u, v)) { lab[v] = id; stack[top++] = v; } }
          if (ui > i0) { const v = u - 1; if (!(K[v] & SOLID) && !lab[v] && joined(u, v)) { lab[v] = id; stack[top++] = v; } }
          if (uj + 1 < j1) { const v = u + NX; if (!(K[v] & SOLID) && !lab[v] && joined(u, v)) { lab[v] = id; stack[top++] = v; } }
          if (uj > j0) { const v = u - NX; if (!(K[v] & SOLID) && !lab[v] && joined(u, v)) { lab[v] = id; stack[top++] = v; } } }
        coarse.min[base + id - 1] = Math.min(coarse.min[base + id - 1], least);      // (what a metre of it costs, at the least)
      }
    }
  }
  function joins(bj) {
    const link = (a, b, diag) => { if (!lab[a] || !lab[b] || !joined(a, b)) return; const na = blockOf(a) * 8 + lab[a] - 1, nb = blockOf(b) * 8 + lab[b] - 1; for (const [p, q] of [[na, nb], [nb, na]]) { const e = coarse.adj[p] || (coarse.adj[p] = []); if (!e.includes(q * 2 + diag) && !e.includes(q * 2 + 1 - diag)) e.push(q * 2 + diag); } };
    for (let bi = 0; bi < nbX; bi++) {
      const i0 = bi * 8, j0 = bj * 8, iE = i0 + 8, jS = j0 + 8;
      if (iE < NX) for (let j = j0; j < Math.min(NZ, jS); j++) link(j * NX + iE - 1, j * NX + iE, 0);
      if (jS < NZ) for (let i = i0; i < Math.min(NX, iE); i++) link((jS - 1) * NX + i, jS * NX + i, 0);
      if (iE < NX && jS < NZ) { const a = (jS - 1) * NX + iE - 1; if (lab[a + 1] && lab[a + NX]) link(a, a + NX + 1, 1); if (lab[a] && lab[a + NX + 1]) link(a + 1, a + NX, 1); }
    }
  }
  // The making of it, in pieces none of which is long: what stands where, the plan sorted into squares, what is
  // underfoot, then a row of the field at a time (heights; beside the kit; the brinks; distances there and back; costs),
  // with the obstacles set down in between, a few hundred at a go.
  // (A list of small jobs, done a millisecond's worth at a go.)
  const batch = make => { let list = null, i = 0; return () => { if (!list) { list = make(); i = 0; } const t0 = now(); while (i < list.length && now() - t0 < 1) list[i++](); if (i >= list.length) { list = null; next(); } }; };
  const next = () => { T.phase++; const s = STEPS[T.phase], back = s && s.back; T.row = back ? NZ - 2 : 1; T.col = back ? NX - 2 : 1; T.k = 0; };
  const rows = (f, back, SPAN = 512) => Object.assign(() => {
    if (!back) { const a = T.col, b = Math.min(NX - 2, a + SPAN - 1); f(T.row, a, b); if (b >= NX - 2) { T.col = 1; if (++T.row > NZ - 2) next(); } else T.col = b + 1; }
    else { const b = T.col, a = Math.max(1, b - SPAN + 1); f(T.row, a, b); if (a <= 1) { T.col = NX - 2; if (--T.row < 1) next(); } else T.col = a - 1; }
  }, { back: !!back });
  const once = f => () => { f(); next(); };
  const STEPS = [once(classify), once(sortBegin), () => { if (sortSome(700)) next(); }, once(begin), rows(outRow), batch(layKit), batch(layGround), rows(iceRow), once(layWay), rows(heights, false, 128), rows(ringRow),
    () => { const list = plan.obstacles, e = Math.min(list.length, T.k + 600); for (; T.k < e; T.k++) { const o = list[T.k]; if (!o.gate && !o.train) mark(o.x0, o.x1, o.z0, o.z1, RAD, c => { if (solidTo(o, c)) K[c] |= OBST; }); } if (T.k >= list.length) { soft = null; next(); } },
    rows(brinkRow), rows(fwdRow), rows(backRow, true), rows(costRow),
    () => { parts(T.k++); if (T.k >= nbZ) next(); }, () => { joins(T.k++); if (T.k >= nbZ) { coarse.ready = true; next(); } }];
  function build() { const t0 = now(), ph = T.phase; STEPS[ph](); if (T.phase >= STEPS.length) T.built = true; const dt = now() - t0; T.ms += dt; if (dt > (T.step[ph] || 0)) T.step[ph] = dt; }
  const tick = ms => { const t0 = now(); let n = 0; while (!T.built && now() - t0 < ms) { build(); n++; } const dt = now() - t0; if (dt > T.worst) T.worst = dt; return T.built; };
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
    sortAll(); spots.clear(); coarse.ready = false;      // (the coarse look is made again when next wanted)
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
  // Near the edge of what it stands on (the flank of a ramp, the rim of a table, a deck, a floe, the ice): each side
  // the ground falls away on costs, so a way up a ramp goes up the middle of it.
  function brink(sub, x, z, y, on) {
    let n = 0;
    for (const [r, w] of [[0.42, 1.1], [0.85, 0.5]]) for (let k = 0; k < 4; k++) { const px = x + DX[k] * r, pz = z + DZ[k] * r, s2 = r > 0.5 ? subAt(px, pz) : sub, g = groundAt(s2, px, pz, y + 0.12, 0.12, on || null), u = s2.under; if (g < y - 0.3 || (wet && (!u || u.land) && wet(px, pz))) n += w; }
    return n;
  }
  function spot(x, z, y, on) {
    const key = keyOf(x, z), list = spots.at.get(key);
    if (list) for (const e of list) if (Math.abs(spots.y[e] - y) < 0.3) return e;
    const e = spots.n++, c = cellOf(x, z), sub = subAt(x, z);
    spots.x[e] = x; spots.y[e] = y; spots.z[e] = z; spots.on[e] = on || null; spots.pl[e] = placeOf(sub, x, z, y); spots.out[e] = null; spots.st[e] = 0; spots.cell[e] = -1;
    spots.cost[e] = (c >= 0 && !(K[c] & MASS) && Math.abs(H[c] - y) < 0.3 ? costOf(c) : 1.04) + (on && !on.hill ? brink(sub, x, z, y, on) : 0);      // (on the open ground the field has already counted the brinks)
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
      // (Not the foot of a ramp, where it is within a wheel's climb of the street: that is come onto by a step, square on, like the rest of it.)
      if (!(u && !u.hill && !low.has(u)) && clear(sub, x, g, z, RAD)) { e = spot(x, z, g, u); if (!(K[c] & KIT)) spots.cell[e] = c; }
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
    const sx = -(z1 - z0) / d * SIDE, sz = (x1 - x0) / d * SIDE;
    // From open ground to open ground beside the kit (most steps there are): the far end is looked at, and that nothing
    // stands in the line or beside it; only a step onto, along or off a piece is walked a hand's breadth at a time.
    if (busy && d < 0.8 && (!on0 || on0.hill)) {
      const sub = subAt(x1, z1), g = groundAt(sub, x1, z1, y0, STEP, on0), u = sub.under, rise = g - y0;
      if ((!u || u.hill) && rise <= (u ? Math.max(STEP, d * CLIMB) : STEP + 0.005) && rise >= -Math.max(0.12, d * 1.3)) {
        if (wet && (!u || u.land) && wet(x1, z1)) return -1;
        for (let t = 1; t <= 3; t++) { const x = x0 + (x1 - x0) * t / 3, z = z0 + (z1 - z0) * t / 3, yy = y0 + rise * t / 3; if (wallAt(sub, x, z, yy, STEP, on0) || wallAt(sub, x + sx, z + sz, yy, STEP, on0) || wallAt(sub, x - sx, z - sz, yy, STEP, on0)) return 0; }
        if (d > 0.6 && !clear(sub, (x0 + x1) / 2, y0 + rise / 2, (z0 + z1) / 2, 0.2)) return 0;
        let x = x1, z = z1, yy = g, on = u;
        if (!clear(sub, x, yy, z, RAD)) {
          if (!snap || Math.hypot(P3.x - x, P3.z - z) > 0.3) return 0;
          x = P3.x; z = P3.z; const s2 = subAt(x, z), g2 = groundAt(s2, x, z, yy, STEP, on); if (Math.abs(g2 - yy) > 0.08 || wallAt(s2, x, z, yy, STEP, on)) return 0; yy = g2; on = s2.under;
        }
        for (const q of plan.lifts || []) if (x > q.x0 - 0.1 && x < q.x1 + 0.1 && z > q.z0 - 0.1 && z < q.z1 + 0.1) return 0;
        W.x = x; W.y = yy; W.z = z; W.on = on; W.drop = 0;
        return 1;
      }
    }
    const n = busy ? Math.max(1, Math.ceil(d / SUB)) : d > 0.6 ? 2 : 1, l = d / n; let yy = y0, on = on0, drop = 0, x = x0, z = z0;
    for (let i = 1; i <= n; i++) {
      x = x0 + (x1 - x0) * i / n; z = z0 + (z1 - z0) * i / n;
      const sub = subAt(x, z);
      if (wallAt(sub, x, z, yy, STEP, on)) return 0;
      // (and not along the side of a piece either: the middle of the car may be clear of a ramp's flank when the car is not)
      if (busy && (wallAt(sub, x + sx, z + sz, yy, STEP, on) || wallAt(sub, x - sx, z - sz, yy, STEP, on))) return 0;
      const g = groundAt(sub, x, z, yy, STEP, on), u = sub.under, rise = g - yy;
      if (rise > (u && u.hill ? Math.max(STEP, l * CLIMB) : u && u === on ? Math.max(STEP, l * 1.3) : STEP + 0.005)) return 0;
      if (rise < -Math.max(0.12, l * 1.3)) { drop -= rise; if (drop > 0.35) return -1; }
      if (wet && (!u || u.land) && wet(x, z)) return -1;
      // Onto a piece of kit: square on, and well in from its corners (as far to either side, the same piece is underfoot).
      if (u && u !== on && !u.hill) { const m = Math.min(1, 0.28 * Math.min(u.x1 - u.x0, u.z1 - u.z0)) / SIDE; for (const sg of [m, -m]) { groundAt(sub, x + sx * sg, z + sz * sg, yy, STEP, on); if (sub.under !== u) return 0; } }
      yy = g; on = u;
      if (i === n || !busy || !(i & 1)) {
        if (!clear(sub, x, yy, z, i === n ? RAD : 0.2)) {
          if (i < n || !snap || Math.hypot(P3.x - x, P3.z - z) > 0.3) return 0;
          x = P3.x; z = P3.z; const s2 = subAt(x, z), g2 = groundAt(s2, x, z, yy, STEP, on); if (Math.abs(g2 - yy) > 0.08 || wallAt(s2, x, z, yy, STEP, on)) return 0; yy = g2; on = s2.under;
        }
      }
    }
    for (const q of plan.lifts || []) if (x > q.x0 - 0.1 && x < q.x1 + 0.1 && z > q.z0 - 0.1 && z < q.z1 + 0.1) return 0;      // (a lift is a way of the building's, taken as one: its floor is not always there)
    W.x = x; W.y = yy; W.z = z; W.on = on; W.drop = drop;
    return 1;
  }
  const slope = (dh, d) => { const g = dh / d; return g > 0.1 ? (g - 0.1) * (g - 0.1) * 12 * d + dh * 1.2 : g < -0.15 ? (g + 0.15) * (g + 0.15) * 6 * d : 0; };
  // Where a spot's eight steps lead: [to, cost, how] in threes. `how`: 0 a step, 1 a step down off something, 2 + n a leap (leaps[n]).
  function explore(e) {
    const out = [], ex = spots.x[e], ez = spots.z[e], ey = spots.y[e], on = spots.on[e], ci = Math.floor((ex - X0) / CELL), cj = Math.floor((ez - Z0) / CELL), hill = !on || on.hill, c0 = spots.cell[e];
    for (let k = 0, n = hill ? 8 : 4; k < n; k++) {      // (up on a piece, square steps only: a line across it is pulled straight afterwards, see line)
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
  // Can this line be driven, point to point, the car's way? (For a bend drawn between places to stand up on the kit: [{ x, y, z }, ...].)
  function walks(pts) {
    const a = pts[0], sub = subAt(a.x, a.z); let y = groundAt(sub, a.x, a.z, a.y + 0.15, 0.15), on = sub.under, x = a.x, z = a.z;
    if (Math.abs(y - a.y) > 0.25) return false;
    for (let i = 1; i < pts.length; i++) { const b = pts[i]; if (Math.hypot(b.x - x, b.z - z) < 0.02) continue; if (step(x, z, y, on, b.x, b.z, false) !== 1 || W.drop > 0.1 || Math.abs(W.y - b.y) > 0.3) return false; x = W.x; z = W.z; y = W.y; on = W.on; }
    return true;
  }
  // Metres from (x, z), at height y, to the nearest thing a car cannot be in (a guess of plenty where the field does not say).
  function room(x, z) { const c = cellOf(x, z); return c < 0 ? 0 : (K[c] & SOLID) ? 0 : D[c] * 0.05; }
  const street = (x, z) => { const c = cellOf(x, z); return c >= 0 && !(K[c] & (MASS | SPOT)) ? H[c] : null; };

  // ---- the search ------------------------------------------------------------------------------
  const gC = new Float32Array(NC), pd = new Uint8Array(NC), st = new Uint16Array(NC), pm = new Map(); let q = 0;      // (where each cell was come to from: which of its eight neighbours, or, for the few come to from a spot or a way, kept on the side)
  const parOf = v => (pd[v] < 8 ? v - OFF[pd[v]] : pm.get(v));
  let hk = new Float32Array(4096), hv = new Int32Array(4096), hn = 0;
  const push = (f, v) => { if (hn === hk.length) { const a = new Float32Array(hn * 2), b = new Int32Array(hn * 2); a.set(hk); b.set(hv); hk = a; hv = b; } let i = hn++; while (i > 0) { const p = (i - 1) >> 1; if (hk[p] <= f) break; hk[i] = hk[p]; hv[i] = hv[p]; i = p; } hk[i] = f; hv[i] = v; };
  const pop = () => { const top = hv[0], f = hk[--hn], v = hv[hn]; let i = 0; for (;;) { let l = 2 * i + 1; if (l >= hn) break; if (l + 1 < hn && hk[l + 1] < hk[l]) l++; if (hk[l] >= f) break; hk[i] = hk[l]; hv[i] = hv[l]; i = l; } hk[i] = f; hv[i] = v; return top; };
  // o: { n: how many of the building's ways; adj(m): [[m2, cost, how], ...]; at(m): { x, z }; anchor: Int32Array(n), the
  //   cell or spot each stands at out of doors (or -1); S, T: which of them are the start and the end; open: the places
  //   (rooms, decks) whose floors may be driven over spot by spot (the end is up on something there); portals(place, n):
  //   [[m, cost], ...], the ways of a room for something that has just driven onto its floor at n; fly: a drone
  //   (straight over anything that is not a building); limit: how many places may be looked at }
  // Returns { cost, path: [node, ...], looked } or null. A node below VB is a cell or a spot; from VB up, way m + VB.
  const EPS = 1.1;                  // how far the straight line is trusted: the way found is within this of the best (and the search looks at a fraction of what it otherwise would)
  function search(o) {
    finish();
    if (o.fly || o.bound) return seek(o, null, o.limit || 260000);
    // A short look first, by the straight line. If that is not enough (the way is a long way round: over a bridge,
    // round a building), the whole of it is looked at coarsely from the far end first, and the search follows that.
    const r = seek(o, null, 9000); if (r || !T.capped) return r;
    return seek(o, guide(o), o.limit || 260000);
  }
  function seek(o, far, limit) {
    T.capped = false;
    if (++q > 32000) { st.fill(0); for (let e = 0; e < spots.n; e++) spots.st[e] = 0; q = 1; }
    const open = q << 1, shut = open | 1, nv = o.n, vg = new Float64Array(nv).fill(Infinity), vp = new Int32Array(nv).fill(-1), vs = new Uint8Array(nv), anchor = o.anchor;
    const tgt = o.at(o.T), tx = tgt.x, tz = tgt.z, ty = tgt.y || 0, fly = !!o.fly, block = fly ? MASS : SOLID;
    const back = new Map();          // which ways stand at a cell or a spot
    for (let m = 0; m < nv; m++) { const a = anchor[m]; if (a < 0) continue; if (back.has(a)) back.get(a).push(m); else back.set(a, [m]); if (a < NC) K[a] |= ANCH; }
    const crow = (x, z) => Math.sqrt((x - tx) * (x - tx) + (z - tz) * (z - tz));
    // How far there still is to go, at the least: the straight line; or, with a guide, what the coarse look made of it from that part of the field (less a block's width, which is all it is good to).
    const hOf = far ? (x, z) => { const c = cellOf(x, z), l = c < 0 ? 0 : lab[c], d = l ? far.land[blockOf(c) * 8 + l - 1] : Infinity, e = crow(x, z) * EPS, f = (d - SLACK) * EPS; return d < Infinity && f > e ? f : e; } : (x, z) => crow(x, z) * EPS;
    const hWay = far ? m => { const p = o.at(m), e = crow(p.x, p.z) * 0.85, d = far.ways[m] - SLACK; return d < Infinity && d > e ? d : e; } : m => { const p = o.at(m); return crow(p.x, p.z) * 0.85; };
    pm.clear();
    const relax = (v, g, from, k = 255) => {
      if (v >= VB) { const m = v - VB; if (vs[m] === 2 || g >= vg[m]) return; vg[m] = g; vp[m] = from; vs[m] = 1; push(g + hWay(m), v); }      // (the building's ways are never overrated: a jump is offered at 0.85 of its length, and is to be taken when it is passed)
      else if (v >= NC) { const e = v - NC; if (spots.st[e] === shut || (spots.st[e] === open && g >= spots.g[e])) return; spots.g[e] = g; spots.par[e] = from; spots.st[e] = open; const up = Math.abs(spots.y[e] - ty) - 1; push(g + hOf(spots.x[e], spots.z[e]) + (up > 0 ? up * 2 : 0), v); }      // (up on something, or down in something, that the end is not: there is all that height to get back, and seldom in the right direction. It keeps the search off the roofs unless the way is over them.)
      else { if (st[v] === shut || (st[v] === open && g >= gC[v])) return; gC[v] = g; pd[v] = k; if (k === 255) pm.set(v, from); st[v] = open; push(g + hOf(xOf(v), zOf(v)), v); }
    };
    hn = 0; vg[o.S] = 0; vs[o.S] = 1; push(0, o.S + VB);
    let looked = 0, found = false, driven = 0; const drive = o.drive || 6000;      // (how many new spots may be driven to in one search: each is a few dozen questions of the plan)
    const bound = o.bound || Infinity;       // (give up once nothing left to look at could be on a way as short as this)
    while (hn) {
      if (hk[0] > bound) break;
      const u = pop();
      if (u >= VB) {
        const m = u - VB; if (vs[m] === 2) continue; vs[m] = 2; if (m === o.T) { found = true; break; }
        const g = vg[m]; for (const [m2, c] of o.adj(m)) relax(m2 + VB, g + c, u);
        if (anchor[m] >= 0) relax(anchor[m], g + (o.reach ? o.reach[m] : 0), u);
      } else if (u >= NC) {
        const e = u - NC; if (spots.st[e] === shut) continue; spots.st[e] = shut; if (++looked > limit) { T.capped = true; break; }
        const g = spots.g[e], pl = spots.pl[e];
        const ms = back.get(u); if (ms) for (const m of ms) relax(m + VB, g + (o.reach ? o.reach[m] : 0), u);
        if (pl && !(o.open && o.open.has(pl))) { if (!o.sealed) for (const [m, c] of o.portals(pl, u)) relax(m + VB, g + c, u); continue; }      // onto a room's floor: from here it is the room's own ways (not while the building is locked: nothing shows a way in before one is found)
        if (fly) continue;
        let out = spots.out[e]; if (!out) { if (++driven > drive) continue; const t0 = now(); out = spots.out[e] = explore(e); T.ex++; T.exMs += now() - t0; }      // (past the allowance nothing new is driven to: the search goes on over what it knows)
        for (let i = 0; i < out.length; i += 3) relax(out[i], g + out[i + 1], u);
      } else {
        if (st[u] === shut) continue; st[u] = shut; if (++looked > limit) { T.capped = true; break; }
        const g = gC[u], ku = K[u], hu = H[u], cu = fly ? 1 : CC[u] * INV;
        if (ku & ANCH) { const ms = back.get(u); if (ms) for (const m of ms) relax(m + VB, g + (o.reach ? o.reach[m] : 0), u); }
        for (let k = 0; k < 8; k++) {
          const v = u + OFF[k], kv = K[v];
          if (kv & block) continue;
          if (k >= 4 && ((K[u + DX[k]] | K[u + DZ[k] * NX]) & block)) continue;
          if (fly) { relax(v, g + DIST[k], u, k); continue; }
          if (kv & SPOT) { const e = baseSpot(v); if (e < 0) continue; const dh = spots.y[e] - hu; if (dh > DIST[k] * CLIMB || dh < -DIST[k] * 1.1) continue; relax(NC + e, g + DIST[k] * (cu + spots.cost[e]) * 0.5 + slope(dh, DIST[k]), u); continue; }
          const dh = H[v] - hu; if (dh > DIST[k] * CLIMB || dh < -DIST[k] * 1.1) continue;
          relax(v, g + DIST[k] * (cu + CC[v] * INV) * 0.5 + slope(dh, DIST[k]), u, k);
        }
      }
    }
    for (const a of back.keys()) if (a < NC) K[a] &= ~ANCH;
    if (!found) return null;
    const path = [];
    for (let u = o.T + VB; u >= 0;) { path.push(u); u = u >= VB ? vp[u - VB] : u >= NC ? spots.par[u - NC] : parOf(u); if (u === o.S + VB) { path.push(u); break; } }
    path.reverse();
    return { cost: vg[o.T], path, looked };
  }
  // The coarse look. The field in blocks of eight cells (4 m), and in each block the parts of it that are joined up
  // (a fence through a block, the brink of the cutting, make two): each such part is one place, joined to the parts
  // of the blocks round it that a car can cross into. From the far end of a way, over these and the building's own
  // ways (taken either way round), how far it is to everywhere: a few thousand places, not a million.
  const SLACK = 4;
  function guide(o) {
    if (!coarse.ready) { for (let bj = 0; bj < nbZ; bj++) parts(bj); for (let bj = 0; bj < nbZ; bj++) joins(bj); coarse.ready = true; }
    const nv = o.n, land = coarse.far.fill(Infinity), ways = new Float32Array(nv).fill(Infinity) /* (as the heap keeps its keys: a key must compare equal to what it was pushed for) */, und = Array.from({ length: nv }, () => []);
    for (let m = 0; m < nv; m++) for (const [m2, c] of o.adj(m)) { und[m].push(m2, c); und[m2].push(m, c); }
    const at = new Int32Array(nv).fill(-1), from = new Map();
    for (let m = 0; m < nv; m++) { const a = o.anchor[m]; if (a < 0) continue; const c = a < NC ? a : cellOf(spots.x[a - NC], spots.z[a - NC]); if (c < 0 || !lab[c] || (a >= NC && Math.abs(spots.y[a - NC] - H[c]) > 0.6)) continue; const n = blockOf(c) * 8 + lab[c] - 1; at[m] = n; if (from.has(n)) from.get(n).push(m); else from.set(n, [m]); }
    hn = 0; ways[o.T] = 0; push(0, NCN + o.T);
    const go = (v, d) => { if (v >= NCN) { if (d < ways[v - NCN]) { ways[v - NCN] = d; push(d, v); } } else if (d < land[v]) { land[v] = d; push(d, v); } };
    while (hn) {
      const d0 = hk[0], u = pop();
      if (u >= NCN) { const m = u - NCN; if (d0 > ways[m]) continue; const e = und[m]; for (let i = 0; i < e.length; i += 2) go(NCN + e[i], d0 + e[i + 1]); if (at[m] >= 0) go(at[m], d0 + (o.reach ? o.reach[m] : 0)); }
      else { if (d0 > land[u]) continue; const e = coarse.adj[u], cu = coarse.min[u]; if (e) for (let i = 0; i < e.length; i++) { const v = e[i] >> 1; go(v, d0 + (e[i] & 1 ? 5.66 : 4) * (cu + coarse.min[v]) * 0.5 * INV); } const ms = from.get(u); if (ms) for (const m of ms) go(NCN + m, d0 + (o.reach ? o.reach[m] : 0)); }
    }
    return { land, ways };
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
      // (Up on the kit: straight from one spot to another wherever that line can be driven, the car's way, and comes out where the other is.)
      const spotty = j => { const a = nodes[i] - NC, b = nodes[j]; return step(spots.x[a], spots.z[a], spots.y[a], spots.on[a], xN(b), zN(b), false) === 1 && W.drop < 0.1 && Math.abs(W.y - yOf(b)) < 0.12; };
      const hop = k => { const outE = nodes[k] >= NC ? spots.out[nodes[k] - NC] : null; if (outE) for (let q = 0; q < outE.length; q += 3) if (outE[q] === nodes[k + 1] && outE[q + 2] >= 1) return true; return false; };      // (a step down or a leap: not to be cut across)
      if (!plain[i] && !fly && v >= NC && !hop(i)) { let e = i + 1; while (e < n - 1 && e - i < 14 && nodes[e] >= NC && !hop(e)) e++; for (let j = e; j > i + 1; j--) if (nodes[j] >= NC && spotty(j)) { best = j; break; } }
      if (plain[i] || fly) { let e = i + 1; while (e < n && e - i < 90 && (fly ? nodes[e] < NC : plain[e])) e++; for (let j = e - 1; j > i + 1; j--) if (straight(v, nodes[j], (gOf(nodes[j]) - gOf(v)) * 1.006 + 0.02)) { best = j; break; } }
      else if (v >= NC && best === i + 1) {
        const w = nodes[i + 1], outE = spots.out[v - NC];
        if (outE) for (let k = 0; k < outE.length; k += 3) if (outE[k] === w && outE[k + 2] >= 2) {
          const lp = leaps[outE[k + 2] - 2], ux = lp.land.x - lp.lip.x, uz = lp.land.z - lp.lip.z, far = Math.hypot(ux, uz), kk = GRAVITY / (2 * lp.v * lp.v * Math.cos(lp.th) ** 2);
          out.push({ ...lp.lip, o: true, rigid: true, air: false, leap: lp.v });
          for (let s = 0.25; s < far; s += 0.25) out.push({ x: lp.lip.x + ux * s / far, y: Math.max(lp.land.y, lp.lip.y + s * Math.tan(lp.th) - kk * s * s), z: lp.lip.z + uz * s / far, o: true, rigid: true, air: true });
          out.push({ ...lp.land, o: true, rigid: true, air: false });
        }
      }
      i = best;
    }
    return out;
  }

  return { CELL, NC, tick, finish, sync, search, line, nodeAt, flyAt, walks, baseSpot, xN, zN, yOf, placeOfNode, groundUnder, U, room, street, subAt,
    get built() { return T.built; }, get ms() { return T.ms; }, reset() { T.built = false; T.phase = 0; T.row = 1; T.col = 1; T.k = 0; T.ms = 0; T.open = null; coarse.ready = false; spots.clear(); },
    forget() { spots.clear(); },
    get stats() { return { cells: NC, spots: spots.n, leaps: leaps.length, explored: T.ex, exploreMs: +T.exMs.toFixed(1), worstTick: +T.worst.toFixed(1), longestStep: T.step.map(v => +v.toFixed(1)), buildMs: +T.ms.toFixed(1), bytes: H.byteLength + K.byteLength + C.byteLength + D.byteLength + CC.byteLength + gC.byteLength + pd.byteLength + st.byteLength + lab.byteLength + coarse.min.byteLength + coarse.far.byteLength }; },
    debug: { H, K, C, D, NX, NZ, X0, Z0, spots, leaps, cellOf, costOf } /* for a picture of it from above: tools/dev/routedrive.mjs */ };
}
