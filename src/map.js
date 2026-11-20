// The map. In the corner, a round radar that turns with you, as in a driving game: the level you
// are on, you in the middle, whatever way you face at the top. Touch it (or press G) and the whole
// building opens on the level you are on, a level at a time. Tap a room there for its card, and Show the way lights it up, on the big map
// and on the radar, across stairs and lifts if it is on another level.

import { heightOf, GRAVITY } from './plan.js';

const TAU = Math.PI * 2;
const near = (a, b, e = 0.7) => Math.abs(a - b) < e;

export function createMap(G, { radarEl, show, resume, say, THREE, scene, wallAt }) {
  const rc = radarEl.getContext('2d');
  const big = document.getElementById('bigmap'), bc = document.getElementById('bmCanvas'), bx = bc.getContext('2d');
  const state = { level: null, target: null, path: null, at: 0, fit: null, marks: [], zoom: 1, cx: null, cz: null, card: null };
  let nav = null;

  // ---- which level is which --------------------------------------------------
  const levels = () => Object.entries(G.plan.levels || { 1: 0 }).map(([name, y]) => ({ name, y })).sort((a, b) => a.y - b.y);
  const levelOf = y => { let best = null; for (const l of levels()) if (!best || Math.abs(l.y - y) < Math.abs(best.y - y)) best = l; return best; };
  const onLevel = (r, ly) => Math.abs(r.y - ly) < 0.7 || (r.y < ly && r.top > ly + 2.5);    // its floor is here, or it is a tall room rising through
  // The floor you are on: the room's own, or the highest deck in it under you (a bridge over Griffin Court is upstairs),
  // so a drone hovering high in a tall hall is still on the level it took off from. Outdoors, and on the roofs, it is the street.
  function youY() {
    const v = G.vehicle, r = G.roomId && G.plan.byId[G.roomId];
    if (!r) return G.roomId ? v.pos.y : 0;
    let y = r.y;
    for (const d of G.plan.decks) if (d.room === r.id && d.y > y && d.y < v.pos.y + 0.6 && v.pos.x >= d.x0 - 0.3 && v.pos.x <= d.x1 + 0.3 && v.pos.z >= d.z0 - 0.3 && v.pos.z <= d.z1 + 0.3) y = d.y;
    // On a flight of stairs, whichever end is nearer.
    for (const q of G.plan.ramps) if (q.room === r.id && v.pos.x >= q.x0 && v.pos.x <= q.x1 && v.pos.z >= q.z0 && v.pos.z <= q.z1 && v.pos.y > Math.min(q.y0, q.y1) - 0.3 && v.pos.y < Math.max(q.y0, q.y1) + 0.6) y = levelOf(v.pos.y).y;
    return y;
  }

  // What is on no drawing is on no map either, until it has been found (src/secret.js).
  const found = () => !!G.plan.secretOpen;
  const shown = r => !r || !r.secret || found();

  // ---- places, and the ways between them ----------------------------------
  // A place is somewhere you can stand: the floor of a room, a deck, or outdoors. A way joins two
  // places: a doorway, a flight of stairs, a lift. The route is the shortest chain of them.
  function placeAt(x, z, y) {
    const p = G.plan;
    for (const d of p.decks) if (near(d.y, y) && x >= d.x0 - 0.05 && x <= d.x1 + 0.05 && z >= d.z0 - 0.05 && z <= d.z1 + 0.05) return 'D' + d.id;
    for (const r of p.rooms) if (near(r.y, y) && x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1) return 'R' + r.id;
    if (near(y, 0, 1) && !p.rooms.some(r => r.y < 1 && r.top > 0.5 && x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1)) return 'OUT';
    return null;
  }
  function build() {
    const p = G.plan, nodes = [], adj = [], flights = [];
    const node = (x, y, z, place) => { nodes.push({ x, y, z, place }); adj.push([]); return nodes.length - 1; };
    const link = (a, b, cost, how) => { adj[a].push([b, cost, how]); adj[b].push([a, cost, how]); };
    const way = (A, B, cost, how) => { if (A.place && B.place && A.place !== B.place) link(node(A.x, A.y, A.z, A.place), node(B.x, B.y, B.z, B.place), cost, how); };
    for (const d of p.doors) {
      if (d.secret && !found()) continue;                 // no way through a wall that has not opened
      const cx = (d.x0 + d.x1) / 2, cz = (d.z0 + d.z1) / 2;
      const side = id => {
        if (id === 'out') return 'OUT';
        const r = p.byId[id]; if (!r) return null;
        if (near(r.y, d.y, 0.1)) return 'R' + id;
        const k = p.decks.find(k => k.room === id && near(k.y, d.y, 0.1) && k.x0 < d.x1 + 0.1 && k.x1 > d.x0 - 0.1 && k.z0 < d.z1 + 0.1 && k.z1 > d.z0 - 0.1);
        return k ? 'D' + k.id : null;
      };
      const P = place => ({ x: cx, y: d.y, z: cz, place });
      const n0 = nodes.length;
      way(P(side(d.a)), P(side(d.b)), d.vent ? 3 : 0.5, 'door');
      // (Which way it is gone through, and how deep the wall is: the route runs square through the middle of it.)
      for (let i = n0; i < nodes.length; i++) { nodes[i].ax = d.along === 'x' ? [1, 0] : [0, 1]; nodes[i].deep = (d.along === 'x' ? d.x1 - d.x0 : d.z1 - d.z0) / 2; }
    }
    for (const q of p.ramps) {
      if (!shown(p.byId[q.room])) continue;
      // Up one side of a wide flight, not the middle: the middle of the Grand Staircase's landing has a kicker on it.
      const wide = q.axis === 'x' ? q.z1 - q.z0 : q.x1 - q.x0, c = (q.axis === 'x' ? (q.z0 + q.z1) / 2 : (q.x0 + q.x1) / 2) + (wide > 4.5 ? wide * 0.28 : 0), len = q.axis === 'x' ? q.x1 - q.x0 : q.z1 - q.z0;
      const lo = q.axis === 'x' ? { x: q.x0 - 0.4, z: c } : { x: c, z: q.z0 - 0.4 }, hi = q.axis === 'x' ? { x: q.x1 + 0.4, z: c } : { x: c, z: q.z1 + 0.4 };
      const n0 = nodes.length;
      way({ ...lo, y: q.y0, place: placeAt(lo.x, lo.z, q.y0) }, { ...hi, y: q.y1, place: placeAt(hi.x, hi.z, q.y1) }, len * 1.2, q.y1 > q.y0 ? 'up' : 'down');
      if (nodes.length === n0 + 2) flights.push({ q, lo: n0, hi: n0 + 1 });
    }
    for (const l of p.lifts) {
      const cx = (l.x0 + l.x1) / 2, cz = (l.z0 + l.z1) / 2, stops = [];
      for (const y of l.stops) for (const [x, z] of [[l.x0 - 0.5, cz], [l.x1 + 0.5, cz], [cx, l.z0 - 0.5], [cx, l.z1 + 0.5]]) { const place = placeAt(x, z, y); if (place) { stops.push({ x, y, z, place }); break; } }
      for (let i = 1; i < stops.length; i++) way(stops[i - 1], stops[i], 9, 'lift');
    }
    for (let i = 0; i < p.decks.length; i++) for (let j = i + 1; j < p.decks.length; j++) {
      const a = p.decks[i], b = p.decks[j];
      if (a.room !== b.room || !near(a.y, b.y, 0.1) || a.x0 > b.x1 + 0.05 || b.x0 > a.x1 + 0.05 || a.z0 > b.z1 + 0.05 || b.z0 > a.z1 + 0.05) continue;
      const x = (Math.max(a.x0, b.x0) + Math.min(a.x1, b.x1)) / 2, z = (Math.max(a.z0, b.z0) + Math.min(a.z1, b.z1)) / 2;
      way({ x, y: a.y, z, place: 'D' + a.id }, { x, y: a.y, z, place: 'D' + b.id }, 0.1, 'deck');
    }
    // The stunt kit. A kicker with a landing ramp beyond it (or a hump: the two back to back) is a way too, in the one
    // direction it can be taken: up the kicker and down the landing, never across and never backwards. It is offered a
    // little cheaper than walking round, so a route that passes a jump takes it, and only if the plain car can clear the gap.
    const jumps = new Map(), kit = p.surfaces.filter(q => (q.skin === 'ply' || q.skin === 'snow') && q.axis && !q.curve && !q.hang && !q.hill && Math.abs(q.h1 - q.h0) > 0.12);
    for (const U of kit) for (const Dn of kit) {
      if (U === Dn || U.axis !== Dn.axis) continue;
      const ax = U.axis, dir = U.h1 > U.h0 ? 1 : -1, lo = q => (ax === 'x' ? q.x0 : q.z0), hi = q => (ax === 'x' ? q.x1 : q.z1), c0 = Math.max(ax === 'x' ? U.z0 : U.x0, ax === 'x' ? Dn.z0 : Dn.x0), c1 = Math.min(ax === 'x' ? U.z1 : U.x1, ax === 'x' ? Dn.z1 : Dn.x1);
      if (c1 - c0 < 0.6) continue;
      const lip = dir > 0 ? hi(U) : lo(U), foot = dir > 0 ? lo(U) : hi(U), land = dir > 0 ? lo(Dn) : hi(Dn), far = dir > 0 ? hi(Dn) : lo(Dn), gap = (land - lip) * dir;
      const top = Math.max(U.h0, U.h1), bot = Math.min(U.h0, U.h1), dTop = dir > 0 ? Dn.h0 : Dn.h1, dBot = dir > 0 ? Dn.h1 : Dn.h0;
      if (gap < -0.05 || gap > 5 || dTop - dBot < 0.12 || Math.abs(dTop - top) > 0.35 || Math.abs(dBot - bot) > 0.3) continue;
      const theta = Math.atan2(top - bot, hi(U) - lo(U)), need = gap < 0.15 ? 0 : Math.sqrt(GRAVITY * gap / Math.sin(2 * theta));
      if (need > 12 * 0.8) continue;                       // (the plain car's top speed is 12 m/s: leave a fifth in hand)
      // A run-up to get straight and up to speed, and a run-out to land in: 2.4 m of clear floor each if there is that much, a metre if not.
      const c = (c0 + c1) / 2, at = a => (ax === 'x' ? { x: a, z: c } : { x: c, z: a });
      const free = (a, b) => { for (let t = 0; t <= 1.001; t += 0.25) { const q = at(a + (b - a) * t); if (placeAt(q.x, q.z, bot) == null || (wallAt && wallAt(p, q.x, q.z, bot)) || p.obstacles.some(o => !o.gate && q.x > o.x0 - 0.2 && q.x < o.x1 + 0.2 && q.z > o.z0 - 0.2 && q.z < o.z1 + 0.2 && o.y0 < bot + 0.3 && o.y1 > bot + 0.04)) return false; } return true; };
      const eOff = free(foot - dir * 0.4, foot - dir * 2.4) ? 2.4 : free(foot - dir * 0.4, foot - dir * 1.0) ? 1.0 : 0, xOff = free(far + dir * 0.4, far + dir * 2.4) ? 2.4 : free(far + dir * 0.4, far + dir * 1.0) ? 1.0 : 0;
      if (!eOff || !xOff) continue;                        // nowhere to come from, or nowhere to land
      const e = foot - dir * eOff, x = far + dir * xOff, E = at(e), X = at(x);
      const place = placeAt(E.x, E.z, bot);
      if (!place || place !== placeAt(X.x, X.z, bot)) continue;
      const a = node(E.x, bot, E.z, place), b = node(X.x, bot, X.z, place);
      adj[a].push([b, Math.abs(x - e) * 0.85, 'jump']);
      jumps.set(a + ':' + b, { U, D: Dn, ax, dir, c, bot, theta, gap, v: Math.max(need * 1.12, 5) });
    }
    const byPlace = new Map();
    nodes.forEach((n, i) => { if (!byPlace.has(n.place)) byPlace.set(n.place, []); byPlace.get(n.place).push(i); });
    return { nodes, adj, byPlace, flights, jumps };
  }
  const walk = (a, b, place) => Math.hypot(a.x - b.x, a.z - b.z) * (place === 'OUT' ? 3 : 1);      // indoors for choice

  // Inside a room the way from one doorway to the next is walked on a grid of where a toy car can
  // go, made the first time the room is needed. Every cell knows how far it is from the nearest solid
  // thing (a wall, a jamb, a case, a ramp's side), and a cell near one costs more to cross, steeply
  // more the nearer: so the way keeps to the middle of a corridor and of a doorway by itself, and
  // only comes close where there is no room to do otherwise. (Loose chairs are not in it: they move.)
  const CELL = 0.3, KEEP = 0.6, grids = new Map();
  function gridOf(room) {
    if (grids.has(room.id)) return grids.get(room.id);
    const nx = Math.max(1, Math.ceil((room.x1 - room.x0) / CELL)), nz = Math.max(1, Math.ceil((room.z1 - room.z0) / CELL)), N = nx * nz, blocked = new Uint8Array(N), dist = new Float32Array(N).fill(99), m = 0.2;
    const mark = (x0, x1, z0, z1) => { const i0 = Math.max(0, Math.floor((x0 - m - room.x0) / CELL)), i1 = Math.min(nx - 1, Math.floor((x1 + m - room.x0) / CELL)), j0 = Math.max(0, Math.floor((z0 - m - room.z0) / CELL)), j1 = Math.min(nz - 1, Math.floor((z1 + m - room.z0) / CELL)); for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) blocked[j * nx + i] = 1; };
    for (const o of G.plan.obstacles) if (!o.gate && o.x1 > room.x0 && o.x0 < room.x1 && o.z1 > room.z0 && o.z0 < room.z1 && o.y0 < room.y + 0.3 && o.y1 > room.y + 0.04) mark(o.x0, o.x1, o.z0, o.z1);
    if (wallAt) {
      // (Only where a piece of the kit or the building stands: asking of every cell of a big room is what took the time.)
      const kit = G.plan.surfaces.filter(q => !q.hill && q.x1 > room.x0 && q.x0 < room.x1 && q.z1 > room.z0 && q.z0 < room.z1 && Math.max(q.h0, q.h1) > room.y + 0.09 && (q.thick ? Math.max(q.h0, q.h1) - q.thick : (q.base || 0)) < room.y + 0.3);       // (not the roofs: a room is indoors)
      for (const q of kit) { const i0 = Math.max(0, Math.floor((q.x0 - room.x0) / CELL) - 1), i1 = Math.min(nx - 1, Math.floor((q.x1 - room.x0) / CELL) + 1), j0 = Math.max(0, Math.floor((q.z0 - room.z0) / CELL) - 1), j1 = Math.min(nz - 1, Math.floor((q.z1 - room.z0) / CELL) + 1);
        for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) if (!blocked[j * nx + i] && wallAt(G.plan, room.x0 + (i + 0.5) * CELL, room.z0 + (j + 0.5) * CELL, room.y)) blocked[j * nx + i] = 1; }
    }
    // How far from anything solid: nothing at a blocked cell, and half a cell at the room's own walls, except where a doorway is.
    const doors = (G.plan.doorsOf ? G.plan.doorsOf(room.id) : G.plan.doors.filter(d => d.a === room.id || d.b === room.id)).filter(d => Math.abs(d.y - room.y) < 0.6);
    const inDoor = (x, z) => doors.some(d => x > d.x0 - 0.3 && x < d.x1 + 0.3 && z > d.z0 - 0.3 && z < d.z1 + 0.3);
    for (let k = 0; k < N; k++) if (blocked[k]) dist[k] = 0;
    for (let i = 0; i < nx; i++) { const x = room.x0 + (i + 0.5) * CELL; if (!inDoor(x, room.z0 - 0.15)) dist[i] = Math.min(dist[i], CELL / 2); if (!inDoor(x, room.z1 + 0.15)) dist[(nz - 1) * nx + i] = Math.min(dist[(nz - 1) * nx + i], CELL / 2); }
    for (let j = 0; j < nz; j++) { const z = room.z0 + (j + 0.5) * CELL; if (!inDoor(room.x0 - 0.15, z)) dist[j * nx] = Math.min(dist[j * nx], CELL / 2); if (!inDoor(room.x1 + 0.15, z)) dist[j * nx + nx - 1] = Math.min(dist[j * nx + nx - 1], CELL / 2); }
    const D1 = CELL, D2 = CELL * Math.SQRT2, relax = (k, i, j, di, dj, w) => { const a = i + di, b = j + dj; if (a < 0 || b < 0 || a >= nx || b >= nz) return; const v = dist[b * nx + a] + w; if (v < dist[k]) dist[k] = v; };
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const k = j * nx + i; relax(k, i, j, -1, 0, D1); relax(k, i, j, 0, -1, D1); relax(k, i, j, -1, -1, D2); relax(k, i, j, 1, -1, D2); }
    for (let j = nz - 1; j >= 0; j--) for (let i = nx - 1; i >= 0; i--) { const k = j * nx + i; relax(k, i, j, 1, 0, D1); relax(k, i, j, 0, 1, D1); relax(k, i, j, 1, 1, D2); relax(k, i, j, -1, 1, D2); }
    const g = { nx, nz, blocked, dist, room };
    grids.set(room.id, g);
    return g;
  }
  // How much room there is round a point on the floor: metres to the nearest solid thing (a guess of plenty where nothing is known).
  let lastRoom = null;
  function clearance(x, y, z) {
    const inside = r => near(r.y, y, 0.3) && x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1;
    const room = lastRoom && inside(lastRoom) ? lastRoom : G.plan.rooms.find(inside);      // (asked thousands of times along one route, nearly always of the same room as last time)
    if (!room) return 9;
    lastRoom = room;
    const g = gridOf(room), i = Math.min(g.nx - 1, Math.floor((x - room.x0) / CELL)), j = Math.min(g.nz - 1, Math.floor((z - room.z0) / CELL)), k = j * g.nx + i;
    return g.blocked[k] ? 0 : g.dist[k];
  }
  // From a to b across a room: the cheapest way over the grid, pulled tight wherever that costs no clearance.
  function around(room, a, b) {
    const g = gridOf(room), { nx, nz, blocked, dist } = g, N = nx * nz;
    const cell = p => [Math.max(0, Math.min(nx - 1, Math.floor((p.x - room.x0) / CELL))), Math.max(0, Math.min(nz - 1, Math.floor((p.z - room.z0) / CELL)))];
    // The nearest open cell to each end (a doorway's own cell may be shadowed by something beside it).
    const open = p => { const [ci, cj] = cell(p); for (let r = 0; r < 10; r++) for (let j = cj - r; j <= cj + r; j++) for (let i = ci - r; i <= ci + r; i++) if (i >= 0 && j >= 0 && i < nx && j < nz && !blocked[j * nx + i]) return j * nx + i; return -1; };
    const A = open(a), B = open(b);
    if (A < 0 || B < 0) return null;
    const pen = k => { const d = dist[k]; return d >= KEEP + 0.15 ? 0 : ((KEEP + 0.15 - d) / (KEEP + 0.15)) ** 2 * 7; };
    const cost = new Float32Array(N).fill(Infinity), from = new Int32Array(N).fill(-1), heap = [[0, A]]; cost[A] = 0; from[A] = A;
    const bi = B % nx, bj = (B - bi) / nx;
    const push = e => { let i = heap.push(e) - 1; while (i > 0) { const p = (i - 1) >> 1; if (heap[p][0] <= heap[i][0]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } };
    const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let s = i; if (l < heap.length && heap[l][0] < heap[s][0]) s = l; if (r < heap.length && heap[r][0] < heap[s][0]) s = r; if (s === i) break; [heap[s], heap[i]] = [heap[i], heap[s]]; i = s; } } return top; };
    const done = new Uint8Array(N);
    while (heap.length) {
      const [, u] = pop(); if (done[u]) continue; done[u] = 1; if (u === B) break;
      const ui = u % nx, uj = (u - ui) / nx;
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
        const i = ui + di, j = uj + dj;
        if (i < 0 || j < 0 || i >= nx || j >= nz) continue;
        const v = j * nx + i;
        if (done[v] || blocked[v] || (di && dj && (blocked[uj * nx + i] || blocked[j * nx + ui]))) continue;
        const c = cost[u] + (di && dj ? Math.SQRT2 : 1) * CELL * (1 + pen(v));
        if (c < cost[v]) { cost[v] = c; from[v] = u; push([c + Math.hypot(i - bi, j - bj) * CELL, v]); }
      }
    }
    if (from[B] < 0) return null;
    const cells = [];
    for (let u = B; u !== A; u = from[u]) cells.unshift(u);
    cells.unshift(A);
    const at = u => ({ x: room.x0 + (u % nx + 0.5) * CELL, y: a.y, z: room.z0 + (Math.floor(u / nx) + 0.5) * CELL });
    const pts = cells.map(at), dd = cells.map(u => dist[u]);
    // Pull the string tight: a stretch may be cut straight only if the straight line keeps as clear as the way round did (or clear enough).
    const lineMin = (p, q) => { const n = Math.max(1, Math.ceil(Math.hypot(q.x - p.x, q.z - p.z) / (CELL * 0.5))); let mn = 99; for (let k = 0; k <= n; k++) { const [i, j] = cell({ x: p.x + (q.x - p.x) * k / n, z: p.z + (q.z - p.z) * k / n }), c = j * nx + i; if (blocked[c]) return -1; if (dist[c] < mn) mn = dist[c]; } return mn; };
    const out = [];
    for (let i = 0; i < pts.length - 1;) {
      let best = i + 1, run = dd[i];
      const mins = [run]; for (let j = i + 1; j < pts.length; j++) { run = Math.min(run, dd[j]); mins.push(run); }
      for (let j = pts.length - 1; j > i + 1; j--) { if (lineMin(pts[i], pts[j]) >= Math.min(KEEP, mins[j - i]) - 0.02) { best = j; break; } }
      out.push(pts[best]); i = best;
    }
    out.pop();                                             // the last is b's own cell: b itself follows
    // The first and last cells stand in for a and b; keep them only if they are a real step away.
    const res = [pts[0], ...out].filter(p => Math.hypot(p.x - a.x, p.z - a.z) > 0.45 && Math.hypot(p.x - b.x, p.z - b.z) > 0.45);
    return res;
  }
  function refine(path) {
    const out = [];
    for (let k = 0; k < path.pts.length; k++) {
      const a = path.pts[k], b = path.pts[k + 1];
      out.push(a);
      if (!b || a.how || a.thru || Math.abs(a.y - b.y) > 0.1) continue;
      const room = G.plan.rooms.find(r => near(r.y, a.y, 0.1) && a.x >= r.x0 - 0.6 && a.x <= r.x1 + 0.6 && a.z >= r.z0 - 0.6 && a.z <= r.z1 + 0.6 && b.x >= r.x0 - 0.6 && b.x <= r.x1 + 0.6 && b.z >= r.z0 - 0.6 && b.z <= r.z1 + 0.6);
      const via = room && around(room, a, b);
      if (via) out.push(...via);
    }
    path.pts = out;
    return curve(path);
  }

  // ---- the way made smooth ----------------------------------------------------
  // The corners are rounded (a turning circle of 0.9 m wherever there is room for one), the result
  // is stepped out evenly a quarter of a metre at a time and eased, and it is never allowed to cut a
  // corner into something solid. Flights of stairs and jumps are left dead straight. What comes out
  // is `path.runs`: one unbroken line of points for each stretch between lifts.
  const STEP = 0.25, TURN = 0.9;
  function jumpLine(J, from, to) {
    // Up the kicker, through the air, and down the landing: stepped out along the piece's own axis.
    const { U, D, ax, dir, c, bot } = J, out = [], P = a => (ax === 'x' ? { x: a, z: c } : { x: c, z: a });
    const a0 = ax === 'x' ? from.x : from.z, a1 = ax === 'x' ? to.x : to.z, uLo = ax === 'x' ? U.x0 : U.z0, uHi = ax === 'x' ? U.x1 : U.z1, dLo = ax === 'x' ? D.x0 : D.z0, dHi = ax === 'x' ? D.x1 : D.z1;
    const lip = dir > 0 ? uHi : uLo, land = dir > 0 ? dLo : dHi, far = dir > 0 ? dHi : dLo, inside = (a, lo, hi) => a >= lo - 1e-6 && a <= hi + 1e-6;
    const top = Math.max(U.h0, U.h1), tan = Math.tan(J.theta), kk = GRAVITY / (2 * J.v * J.v * Math.cos(J.theta) ** 2);
    let flying = false, down = false;
    // (The run-up and the run-out on the flat are left to be curved into like any other leg: only the pieces and the air between are fixed.)
    const foot = dir > 0 ? uLo : uHi; out.push({ x: from.x, y: bot, z: from.z });
    for (let s = Math.max(0, (foot - a0) * dir - 0.3), L = Math.min(Math.abs(a1 - a0), (far - a0) * dir + 0.3); s <= L + 1e-6; s += STEP) {
      const a = a0 + dir * Math.min(s, L), p = P(a); let y = bot, air = false;
      if (!down && inside(a, uLo, uHi) && (a - lip) * dir <= 0) y = Math.max(bot, heightOf(U, p.x, p.z));
      else if ((a - lip) * dir > 0 && !down) {
        const t = (a - lip) * dir, fall = top + t * tan - kk * t * t, under = inside(a, dLo, dHi) ? heightOf(D, p.x, p.z) : (a - land) * dir < 0 ? -1e9 : bot;
        if (fall > under + 0.02 && (a - far) * dir < 0) { y = Math.max(fall, bot); air = flying = true; } else { down = true; y = Math.max(bot, inside(a, dLo, dHi) ? heightOf(D, p.x, p.z) : bot); }
      } else if (down) y = Math.max(bot, inside(a, dLo, dHi) ? heightOf(D, p.x, p.z) : bot);
      out.push({ x: p.x, y, z: p.z, rigid: true, air });
    }
    void flying; out[out.length - 1].rigid = false;
    return out;
  }
  function curve(path) {
    const runs = []; let V = [];
    const flush = () => { if (V.length > 1) runs.push(V); V = []; };
    for (let k = 0; k < path.pts.length; k++) {
      const a = path.pts[k], b = path.pts[k + 1];
      if (a.how === 'jump' && b && a.jump) { V.push(...jumpLine(a.jump, a, b)); continue; }
      V.push({ x: a.x, y: a.y, z: a.z, rigid: !!(a.how && !/lift/.test(a.how)), flight: !!(a.how && !/lift/.test(a.how)) });
      if (a.how && /lift/.test(a.how)) flush();
    }
    flush();
    path.runs = runs.map(smooth).filter(r => r.length > 1);
    path.draw = path.runs.map(r => r.filter((p, i) => i % 4 === 0 || i === r.length - 1 || p.air !== (r[i - 1] || p).air));
    path.jumpIn = null;
    { let s = 0; outer: for (const r of path.runs) for (let i = 0; i < r.length; i++) { if (r[i].air) { path.jumpIn = s; break outer; } s += STEP; } }
    return path;
  }
  function smooth(V) {
    // Drop points that sit on top of one another.
    V = V.filter((p, i) => i === 0 || Math.hypot(p.x - V[i - 1].x, p.z - V[i - 1].z) > 0.02 || Math.abs(p.y - V[i - 1].y) > 0.02);
    if (V.length < 2) return V;
    const blockedAt = p => clearance(p.x, p.y, p.z) <= 0;
    // 1. Round each corner with a curve that leaves one leg and joins the next tangentially.
    const R = [V[0]];
    for (let i = 1; i < V.length - 1; i++) {
      const A = R[R.length - 1], B = V[i], C = V[i + 1], la = Math.hypot(B.x - A.x, B.z - A.z), lc = Math.hypot(C.x - B.x, C.z - B.z);
      if (la < 0.03 || lc < 0.03) { R.push(B); continue; }
      const ux = (B.x - A.x) / la, uz = (B.z - A.z) / la, wx = (C.x - B.x) / lc, wz = (C.z - B.z) / lc, phi = Math.acos(Math.max(-1, Math.min(1, ux * wx + uz * wz)));
      if (phi < 0.06) { R.push(B); continue; }
      // How far back along each leg the bend may start: nearly half of an ordinary leg, but only a short lead on a flight of
      // stairs or through a doorway, which must themselves stay straight. The two need not be the same.
      const inRigid = V[i - 1].rigid, outRigid = B.rigid, want = TURN * Math.tan(Math.min(phi, 2.6) / 2) * 1.5;
      // (A flight is wide: the bend may begin a metre down it, and the car takes the last steps at a slant. A doorway gives up to half its depth.)
      let ti = Math.min(want, V[i - 1].flight ? Math.min(1.0, la * 0.25) : la * 0.48), to = Math.min(want, B.flight ? Math.min(1.0, lc * 0.25) : lc * 0.48); void inRigid; void outRigid;
      let arc = null;
      for (let tries = 0; tries < 4 && Math.max(ti, to) > 0.06; tries++, ti *= 0.55, to *= 0.55) {
        const p0 = { x: B.x - ux * ti, z: B.z - uz * ti, y: B.y + (A.y - B.y) * (ti / la) }, p2 = { x: B.x + wx * to, z: B.z + wz * to, y: B.y + (C.y - B.y) * (to / lc) }, n = Math.max(3, Math.ceil(phi / 0.15)), pts = [];
        for (let k = 0; k <= n; k++) { const s = k / n, q = 1 - s; pts.push({ x: q * q * p0.x + 2 * q * s * B.x + s * s * p2.x, y: q * q * p0.y + 2 * q * s * B.y + s * s * p2.y, z: q * q * p0.z + 2 * q * s * B.z + s * s * p2.z, rigid: k === n ? B.rigid : false, bend: true }); }
        if (!pts.some(blockedAt)) { arc = pts; break; }
      }
      if (arc) R.push(...arc); else R.push(B);
    }
    R.push(V[V.length - 1]);
    // 2. Step it out evenly.
    const S = [{ ...R[0] }]; let carry = 0;
    for (let i = 0; i + 1 < R.length; i++) {
      const a = R[i], b = R[i + 1], len = Math.hypot(b.x - a.x, b.z - a.z);
      if (len < 1e-4) { if (Math.abs(b.y - a.y) > 0.05) S.push({ ...b }); continue; }
      let s = STEP - carry;
      for (; s <= len; s += STEP) { const f = s / len; S.push({ x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f, z: a.z + (b.z - a.z) * f, rigid: a.rigid, air: a.air && b.air, bend: a.bend || b.bend }); }
      carry = len - (s - STEP);
    }
    { const e = R[R.length - 1], l = S[S.length - 1]; if (Math.hypot(e.x - l.x, e.z - l.z) > 0.05) S.push({ ...e }); }
    // 3. Ease it: each point towards the middle of its neighbours, unless that would take it nearer to something solid than it should be.
    for (let it = 0; it < 24; it++) for (let i = 1; i < S.length - 1; i++) {
      const p = S[i]; if (p.air || S[i - 1].air || S[i + 1].air || ((p.rigid || S[i - 1].rigid) && !p.bend) || (p.bend && (S[i - 1].rigid && !S[i - 1].bend || S[i + 1].rigid && !S[i + 1].bend))) continue;
      const nx2 = p.x * 0.5 + (S[i - 1].x + S[i + 1].x) * 0.25, nz2 = p.z * 0.5 + (S[i - 1].z + S[i + 1].z) * 0.25, was = clearance(p.x, p.y, p.z), now = clearance(nx2, p.y, nz2);
      if (now >= Math.min(was, 0.45) - 0.01 && now > 0) { p.x = nx2; p.z = nz2; }       // (a bend may give up a little room to be a bend, but never the car's own width)
    }
    // A bend that begins on a flight of stairs lies on the stairs: its height is the flight's at that point.
    for (const q of S) { if (!q.bend) continue; const f = G.plan.ramps.find(f => q.x >= f.x0 && q.x <= f.x1 && q.z >= f.z0 && q.z <= f.z1 && q.y > Math.min(f.y0, f.y1) - 0.4 && q.y < Math.max(f.y0, f.y1) + 0.4); if (f) { const t = f.axis === 'x' ? (q.x - f.x0) / (f.x1 - f.x0) : (q.z - f.z0) / (f.z1 - f.z0); q.y = f.y0 + (f.y1 - f.y0) * t; q.rigid = true; } }
    return S;
  }

  // The shortest way from one spot to another: a list of points, each with how you get to the next.
  function route(from, to) {
    if (!nav) nav = build();
    const { nodes, adj, byPlace } = nav, N = nodes.length, S = N, T = N + 1, noJumps = !!(G.vehicle && G.vehicle.kind === 'drone');
    let fp = placeAt(from.x, from.z, from.y), tp = to.place || placeAt(to.x, to.z, to.y);
    if (!tp) return null;
    // In the air or on a flight of stairs you are nowhere in particular: start from the nearest way.
    const startLinks = [];
    // Part-way up a flight, the ways on are its two ends, not the floor it started from.
    const on = nav.flights.find(f => from.x >= f.q.x0 && from.x <= f.q.x1 && from.z >= f.q.z0 && from.z <= f.q.z1 && from.y > Math.min(f.q.y0, f.q.y1) + 0.12 && from.y < Math.max(f.q.y0, f.q.y1) + 0.5);
    if (on) { for (const i of [on.lo, on.hi]) startLinks.push([i, Math.hypot(nodes[i].x - from.x, nodes[i].z - from.z) * 1.2]); fp = null; }
    else if (fp && byPlace.has(fp)) for (const i of byPlace.get(fp)) startLinks.push([i, walk(from, nodes[i], fp)]);
    else { let b = -1, bd = Infinity; nodes.forEach((n, i) => { const d = Math.hypot(n.x - from.x, n.z - from.z) + Math.abs(n.y - from.y) * 4; if (d < bd) { bd = d; b = i; } }); if (b >= 0) startLinks.push([b, bd]); fp = null; }
    const endCost = new Map();
    if (byPlace.has(tp)) for (const i of byPlace.get(tp)) endCost.set(i, walk(to, nodes[i], tp));
    const dist = new Float64Array(N + 2).fill(Infinity), prev = new Int32Array(N + 2).fill(-1), done = new Uint8Array(N + 2);
    dist[S] = 0;
    if (fp && fp === tp) { dist[T] = walk(from, to, tp); prev[T] = S; }
    for (;;) {
      let u = -1, ud = Infinity;
      for (let i = 0; i < N + 2; i++) if (!done[i] && dist[i] < ud) { ud = dist[i]; u = i; }
      if (u < 0 || u === T) break;
      done[u] = 1;
      const out = u === S ? startLinks : adj[u];
      for (const [v, c, how] of out) if (!(how === 'jump' && noJumps) && dist[u] + c < dist[v]) { dist[v] = dist[u] + c; prev[v] = u; }
      if (u !== S && endCost.has(u) && dist[u] + endCost.get(u) < dist[T]) { dist[T] = dist[u] + endCost.get(u); prev[T] = u; }
      // Within a place, every way in it is a straight walk from every other.
      if (u !== S) for (const v of byPlace.get(nodes[u].place)) { const c = walk(nodes[u], nodes[v], nodes[u].place); if (dist[u] + c < dist[v]) { dist[v] = dist[u] + c; prev[v] = u; } }
    }
    if (dist[T] === Infinity) return null;
    const pts = [];
    for (let u = T; u >= 0; u = prev[u]) pts.unshift(u === T ? { x: to.x, y: to.y, z: to.z } : u === S ? { x: from.x, y: from.y, z: from.z } : { x: nodes[u].x, y: nodes[u].y, z: nodes[u].z, i: u });
    // Mark the legs that change level, and how.
    for (let k = 0; k + 1 < pts.length; k++) if (pts[k].i != null && pts[k + 1].i != null) { const e = adj[pts[k].i].find(e => e[0] === pts[k + 1].i); if (e && (e[2] === 'up' || e[2] === 'down' || e[2] === 'lift')) pts[k].how = e[2] === 'lift' ? (pts[k + 1].y > pts[k].y ? 'lift up' : 'lift down') : (pts[k + 1].y > pts[k].y ? 'up' : 'down'); }
    for (let k = 0; k + 1 < pts.length; k++) if (pts[k].i != null && pts[k + 1].i != null && !pts[k].how) { const J = nav.jumps.get(pts[k].i + ':' + pts[k + 1].i); if (J && !noJumps) { pts[k].how = 'jump'; pts[k].jump = J; } }
    // Through a doorway: square on, down the middle, from a stride inside one room to a stride inside the next.
    const full = [];
    for (let k = 0; k < pts.length; k++) {
      const q = pts[k], n = q.i != null ? nodes[q.i] : null, room = n && n.ax && n.place[0] === 'R' ? G.plan.byId[n.place.slice(1)] : null;
      if (!room || q.how) { full.push(q); continue; }
      const along = n.ax[0] ? 'x' : 'z', mid = along === 'x' ? (room.x0 + room.x1) / 2 : (room.z0 + room.z1) / 2, sg = Math.sign(mid - (along === 'x' ? q.x : q.z)) || 1, off = n.deep + 0.75;
      const inner = { x: q.x + n.ax[0] * sg * off, y: q.y, z: q.z + n.ax[1] * sg * off };
      const prev = pts[k - 1], after = prev && Math.hypot(prev.x - q.x, prev.z - q.z) < 0.05 && Math.abs(prev.y - q.y) < 0.1;        // just come through it: the stride is on the far side
      if (after || k === 0) { full.push({ ...q, thru: true }, inner); } else { full.push({ ...inner, thru: true }, q); }
    }
    for (let k = 0; k + 1 < full.length; k++) if (Math.hypot(full[k].x - full[k + 1].x, full[k].z - full[k + 1].z) < 0.05 && Math.abs(full[k].y - full[k + 1].y) < 0.1 && !full[k].how) full[k].thru = true;
    return refine({ pts: full, length: dist[T] });
  }

  // ---- the way, laid on the floor ------------------------------------------
  // The same route as a ribbon of arrows on the floor of the building, running ahead of you.
  let ribbon = null;
  function layRibbon() {
    if (!THREE || !scene) return;
    if (!ribbon) {
      const cv = document.createElement('canvas'); cv.width = 64; cv.height = 64;
      const g = cv.getContext('2d'); g.strokeStyle = '#7fe9f5'; g.lineWidth = 9; g.lineCap = 'round'; g.lineJoin = 'round';
      g.beginPath(); g.moveTo(14, 12); g.lineTo(40, 32); g.lineTo(14, 52); g.stroke();
      const tex = new THREE.CanvasTexture(cv); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.colorSpace = THREE.SRGBColorSpace;
      const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.95, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, polygonOffset: true, polygonOffsetFactor: -4 });
      ribbon = new THREE.Mesh(new THREE.BufferGeometry(), mat); ribbon.frustumCulled = false; ribbon.renderOrder = 4; ribbon.visible = false;
      scene.add(ribbon);
    }
    const path = state.path;
    if (!path) { ribbon.visible = false; return; }
    // One strip per run, as wide all the way round a bend as on the straight (the edges are set out along the
    // bisector at each point), two centimetres off the floor. Over a jump it is dotted, and hangs in the air where the car will be.
    const pos = [], uv = [], idx = [], W = 0.2, LIFT = 0.03;
    for (const r of path.runs || []) {
      let run = 0, base = -1;
      for (let i = 0; i < r.length; i++) {
        const a = r[Math.max(0, i - 1)], b = r[Math.min(r.length - 1, i + 1)], p = r[i]; let dx = b.x - a.x, dz = b.z - a.z; const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l;
        if (i) run += Math.hypot(p.x - r[i - 1].x, p.z - r[i - 1].z);
        const n = pos.length / 3;
        pos.push(p.x - dz * W, p.y + LIFT, p.z + dx * W, p.x + dz * W, p.y + LIFT, p.z - dx * W); uv.push(run / 0.8, 0, run / 0.8, 1);
        if (base >= 0 && !(p.air && r[i - 1].air && (i >> 1) % 2)) idx.push(base, base + 1, n, base + 1, n + 1, n);
        base = n;
      }
    }
    const geo = ribbon.geometry;
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx);
    ribbon.visible = pos.length > 0;
  }

  // ---- drawing a level -------------------------------------------------------
  // Everything is drawn in metres; the caller has already set the transform. `px` is how many
  // metres one screen pixel is, so that lines keep their weight whatever the scale.
  const ZMIN = 0.42;                                   // far enough out to see from the avenue to the water
  function drawLevel(c, ly, px, label) {
    const p = G.plan;
    // Out of doors, on the big map: the park, the Drive and the harbour, as far as the buoys. (Zoom out to see them.)
    if (label && p.lakefront && Math.abs(ly) < 1) {
      const L = p.lakefront, B = p.bounds, z0 = B.z0, h = B.z1 - B.z0;
      c.fillStyle = 'rgba(40,48,66,.55)'; c.fillRect(L.field.x0, L.field.z0, L.field.x1 - L.field.x0, L.field.z1 - L.field.z0);
      c.fillStyle = 'rgba(16,18,26,.9)'; c.fillRect(L.lsd.x0, z0, L.lsd.x1 - L.lsd.x0, h);
      c.fillStyle = 'rgba(70,76,92,.7)'; c.fillRect(L.prom.x0, z0, L.shore - L.prom.x0, h); for (const q of L.paths) c.fillRect(q.x0, q.z0, q.x1 - q.x0, q.z1 - q.z0);
      c.fillStyle = 'rgba(150,180,215,.45)'; c.fillRect(L.shore, z0, L.buoys - L.shore, h);
      c.fillStyle = 'rgba(22,38,70,.9)'; c.fillRect(L.buoys, z0, B.x1 - L.buoys, h);
      c.fillStyle = 'rgba(200,200,205,.8)'; c.fillRect(L.shell.x0, L.shell.z0, L.shell.x1 - L.shell.x0, L.shell.z1 - L.shell.z0 + 1.2); c.fillRect(L.breakwater.x0, L.breakwater.z0, L.breakwater.x1 - L.breakwater.x0, L.breakwater.z1 - L.breakwater.z0);
      c.fillStyle = 'rgba(120,255,170,1)'; c.beginPath(); c.arc(L.light.x, L.light.z, Math.max(1.6, px * 3), 0, TAU); c.fill();
      c.fillStyle = 'rgba(226,205,148,.75)'; c.font = `${Math.max(5, px * 11)}px ui-monospace, monospace`;
      c.fillText('BUTLER FIELD', (L.field.x0 + L.field.x1) / 2, 150); c.fillText('MONROE HARBOR', (L.buoys + B.x1) / 2 - 4, 120);
      c.save(); c.translate((L.lsd.x0 + L.lsd.x1) / 2, 110); c.rotate(Math.PI / 2); c.fillText('LAKE SHORE DRIVE', 0, 0); c.restore();
    }
    for (const st of Object.values(G.museum.rooms)) {
      const r = st.room;
      if (!onLevel(r, ly) || !shown(r)) continue;
      const been = G.museum.visited.has(r.id), n = st.arts.length, f = n ? st.seen / n : 0, done = n ? st.done : been;
      const w = r.x1 - r.x0, h = r.z1 - r.z0;
      c.fillStyle = done ? 'rgba(226,190,110,.95)' : been ? 'rgba(62,70,98,.95)' : r.assumed || r.passage ? 'rgba(20,23,32,.92)' : 'rgba(30,34,48,.94)';
      c.fillRect(r.x0, r.z0, w, h);
      if (!done && f > 0) { c.fillStyle = 'rgba(240,200,110,.95)'; c.fillRect(r.x0, r.z1 - Math.min(h * 0.2, 1.6), w * f, Math.min(h * 0.2, 1.6)); }
      // A big room fills the radar edge to edge when you are in it: floor lines every four metres give it something to move against.
      if (Math.max(w, h) > 14) { c.strokeStyle = done ? 'rgba(120,90,30,.28)' : 'rgba(170,180,215,.16)'; c.lineWidth = px * 0.8; c.beginPath();
        for (let x = Math.ceil(r.x0 / 4) * 4; x < r.x1; x += 4) { c.moveTo(x, r.z0); c.lineTo(x, r.z1); } for (let z = Math.ceil(r.z0 / 4) * 4; z < r.z1; z += 4) { c.moveTo(r.x0, z); c.lineTo(r.x1, z); } c.stroke(); }
      c.lineWidth = px * 1.2;
      c.strokeStyle = done ? 'rgba(255,235,170,1)' : been ? 'rgba(226,205,148,.8)' : 'rgba(150,150,170,.45)';
      c.strokeRect(r.x0, r.z0, w, h);
      if (r.secret) { c.strokeStyle = 'rgba(255,90,77,.95)'; c.lineWidth = px * 2; c.setLineDash([px * 5, px * 3]); c.strokeRect(r.x0 + px * 2, r.z0 + px * 2, w - px * 4, h - px * 4); c.setLineDash([]); }
    }
    // (The names are written afterwards, on the big map only, at a size for the screen: see drawLabels.)
    // The partitions inside a restroom block (src/furnish.js walls it into rooms of its own): thin lines, so the way in can be seen.
    if (p.wc && p.wc.length) { const ids = new Set(p.wc.map(q => q.room)); c.fillStyle = 'rgba(170,176,196,.7)';
      for (const id of ids) { const r = p.byId[id]; if (!r || !onLevel(r, ly) || !shown(r)) continue; { const st = G.museum.rooms[id], gold = st && (st.arts.length ? st.done : G.museum.visited.has(id)); c.fillStyle = gold ? 'rgba(70,52,16,.8)' : 'rgba(170,176,196,.7)'; }
        for (const o of p.obstacles) if (o.fit && o.y1 - o.y0 > 1.9 && Math.abs(o.y0 - r.y) < 0.05 && Math.min(o.x1 - o.x0, o.z1 - o.z0) < 0.2 && o.x0 >= r.x0 - 0.01 && o.x1 <= r.x1 + 0.01 && o.z0 >= r.z0 - 0.01 && o.z1 <= r.z1 + 0.01) c.fillRect(o.x0, o.z0, Math.max(o.x1 - o.x0, px * 1.2), Math.max(o.z1 - o.z0, px * 1.2)); } }
    c.fillStyle = 'rgba(226,205,148,.95)';
    for (const d of p.doors) if (Math.abs(d.y - ly) < 1.6 && (!d.secret || found())) c.fillRect(d.x0 - px, d.z0 - px, Math.max(2 * px, d.x1 - d.x0 + 2 * px), Math.max(2 * px, d.z1 - d.z0 + 2 * px));
    // Ways up and down from here: stairs hatched, lifts solid.
    c.strokeStyle = 'rgba(127,233,245,.9)'; c.fillStyle = 'rgba(127,233,245,.85)'; c.lineWidth = px;
    for (const q of p.ramps) {
      if (Math.min(q.y0, q.y1) > ly + 1.6 || Math.max(q.y0, q.y1) < ly - 1.6 || !shown(p.byId[q.room])) continue;
      c.strokeRect(q.x0, q.z0, q.x1 - q.x0, q.z1 - q.z0);
      c.beginPath();
      if (q.axis === 'x') for (let x = q.x0 + 1; x < q.x1; x += 1) { c.moveTo(x, q.z0); c.lineTo(x, q.z1); } else for (let z = q.z0 + 1; z < q.z1; z += 1) { c.moveTo(q.x0, z); c.lineTo(q.x1, z); }
      c.stroke();
    }
    for (const l of p.lifts) if (l.stops[0] < ly + 1.6 && l.stops[l.stops.length - 1] > ly - 1.6) c.fillRect(l.x0, l.z0, l.x1 - l.x0, l.z1 - l.z0);
  }
  // The route: bright where it runs on this level, faint where it is on another, with an arrow
  // wherever it goes up or down.
  function drawPath(c, ly, px, t) {
    const path = state.path; if (!path) return;
    const here = q => Math.abs(q.y - ly) < 2.4;
    c.lineCap = 'round'; c.lineJoin = 'round';
    // The same smooth line as on the floor: each unbroken stretch on this level in one stroke, so its dashes run on round the bends.
    for (const pass of [0, 1]) for (const r of path.draw || []) {
      for (let k = 0; k + 1 < r.length;) {
        const on = here(r[k]) || here(r[k + 1]); let e = k + 1;
        while (e + 1 < r.length && (here(r[e]) || here(r[e + 1])) === on) e++;
        if ((pass === 1) === on) {
          c.beginPath(); c.moveTo(r[k].x, r[k].z); for (let i = k + 1; i <= e; i++) c.lineTo(r[i].x, r[i].z);
          if (on) { c.strokeStyle = 'rgba(0,0,0,.55)'; c.lineWidth = px * 7; c.setLineDash([]); c.stroke(); c.strokeStyle = '#7fe9f5'; c.lineWidth = px * 3.5; c.setLineDash([px * 9, px * 7]); c.lineDashOffset = -t * px * 22; }
          else { c.strokeStyle = 'rgba(127,233,245,.3)'; c.lineWidth = px * 2; c.setLineDash([px * 3, px * 6]); c.lineDashOffset = 0; }
          c.stroke();
        }
        k = e;
      }
    }
    c.setLineDash([]);
    for (const a of path.pts) if (a.how && here(a)) {
      const up = /up/.test(a.how), s = px * 8;
      c.fillStyle = '#7fe9f5'; c.strokeStyle = '#04121a'; c.lineWidth = px * 1.5;
      c.beginPath(); c.arc(a.x, a.z, s, 0, TAU); c.fill(); c.stroke();
      c.fillStyle = '#04121a'; c.beginPath();
      if (up) { c.moveTo(a.x, a.z - s * 0.6); c.lineTo(a.x + s * 0.55, a.z + s * 0.35); c.lineTo(a.x - s * 0.55, a.z + s * 0.35); } else { c.moveTo(a.x, a.z + s * 0.6); c.lineTo(a.x + s * 0.55, a.z - s * 0.35); c.lineTo(a.x - s * 0.55, a.z - s * 0.35); }
      c.closePath(); c.fill();
    }
    const e = state.target;
    if (e && here(e)) { const s = px * (7 + Math.sin(t * 5) * 1.5); c.strokeStyle = '#7fe9f5'; c.lineWidth = px * 2.5; c.beginPath(); c.arc(e.x, e.z, s, 0, TAU); c.stroke(); c.fillStyle = '#fff'; c.beginPath(); c.arc(e.x, e.z, px * 3, 0, TAU); c.fill(); }
  }
  // Marks other parts of the game ask for (G.mapMarks: [{ x, y, z, colour, ring }]).
  function drawMarks(c, ly, px, t) {
    for (const m of G.mapMarks || []) {
      if (m.y != null && Math.abs(m.y - ly) > 2.4) continue;
      c.fillStyle = m.colour || '#ff5a4d'; c.strokeStyle = '#000'; c.lineWidth = px;
      c.beginPath(); c.arc(m.x, m.z, px * 5, 0, TAU); c.fill(); c.stroke();
      if (m.ring) { c.strokeStyle = m.colour || '#ff5a4d'; c.lineWidth = px * 2; c.beginPath(); c.arc(m.x, m.z, px * (9 + (t * 8) % 8), 0, TAU); c.stroke(); }
    }
  }
  function drawYou(c, x, z, yaw, s) {
    c.save(); c.translate(x, z); c.rotate(Math.PI - yaw); c.scale(s, s);
    // Unmissable: a cone of what is ahead, a ring that breathes, and a big bright arrow with a dark edge.
    const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 260);
    { const g = c.createRadialGradient(0, 0, 4, 0, 0, 46); g.addColorStop(0, 'rgba(255,90,60,.38)'); g.addColorStop(1, 'rgba(255,90,60,0)'); c.fillStyle = g; c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, 46, -Math.PI / 2 - 0.5, -Math.PI / 2 + 0.5); c.closePath(); c.fill(); }
    c.strokeStyle = `rgba(255,90,60,${0.85 - pulse * 0.55})`; c.lineWidth = 2.5; c.beginPath(); c.arc(0, 0, 15 + pulse * 7, 0, TAU); c.stroke();
    c.fillStyle = 'rgba(0,0,0,.55)'; c.beginPath(); c.arc(0, 0, 13, 0, TAU); c.fill();
    c.fillStyle = '#ff5a3c'; c.strokeStyle = '#fff'; c.lineWidth = 2.5; c.lineJoin = 'round';
    c.beginPath(); c.moveTo(0, -14); c.lineTo(9.5, 10); c.lineTo(0, 4.5); c.lineTo(-9.5, 10); c.closePath(); c.fill(); c.stroke();
    c.restore();
  }

  // ---- names on the big map ------------------------------------------------------
  // Written in screen pixels, not metres: big enough to read whatever the zoom (a little bigger as you zoom in),
  // light on dark with a dark edge, inside the room or not at all. A long name that will not fit tries a shorter
  // form of itself ("west studio" for "Ryan Learning Center, west studio"), then two lines, then gives up.
  const SERIF = '"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif', MONO = 'ui-monospace, Menlo, monospace';
  const widths = new Map();
  const measure = (c, font, text) => { const k = font + '|' + text; let w = widths.get(k); if (w == null) { if (widths.size > 6000) widths.clear(); c.font = font; w = c.measureText(text).width; widths.set(k, w); } return w; };
  // What a room is called: its title, and what is in it.
  function nameOf(r) {
    if (!r) return { title: 'Outdoors', sub: '' };
    if (r.secret) return { title: 'Top secret', sub: '' };
    if (r.kind === 'hall') return { title: 'Griffin Court', sub: 'The Modern Wing' };
    if (r.kind === 'corridor') return { title: 'Gallery 11', sub: 'The Thorne Miniature Rooms' };
    const g = r.gallery || '', set = G.collection && G.collection.rooms && G.collection.rooms[r.id];
    if (r.kind !== 'gallery') return { title: g, sub: '' };
    const m = /^(.*?) \((.*)\)$/.exec(g), aside = m ? m[2][0].toUpperCase() + m[2].slice(1) : '';
    return { title: (m ? m[1] : g).replace(/^Galleries /, 'Gallery '), sub: [aside, ...(set && set.names ? set.names : [])].filter(Boolean).join(' · ') };
  }
  function labelsOf(r) {
    if (r.secret) return { names: ['TOP SECRET', '?'], mono: true };
    if (r.kind === 'hall') return { names: ['Griffin Court', 'Griffin'] };
    if (r.kind === 'corridor') return { names: ['11'], mono: true };
    const g = r.gallery || '';
    if (r.kind === 'gallery') { const n = g.replace(/^Galler(y|ies) /, '').replace(/ \(.*\)$/, ''); return { names: [n], mono: true }; }
    const k = g.search(/, (?![^(]*\))/), tail = k > 0 ? g.slice(k + 2) : '', head = k > 0 ? g.slice(0, k) : '', bare = g.replace(/ \(.*\)$/, '');
    return { names: [g, ...(bare !== g ? [bare] : []), ...(/ /.test(tail) ? [tail] : []), ...(head ? [head] : [])] };
  }
  function drawLabels(c, ly) {
    const { s, ox, oz, dpr } = state.fit, W = bc.width, H = bc.height, sc = s / dpr;
    const f0 = Math.round(Math.max(11.5, Math.min(17, 10 + sc * 0.4)) * 2) / 2, pad = 3 * dpr;
    c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
    for (const st of Object.values(G.museum.rooms)) {
      const r = st.room;
      if (r.passage || !onLevel(r, ly) || !shown(r)) continue;
      const X0 = r.x0 * s + ox, X1 = r.x1 * s + ox, Z0 = r.z0 * s + oz, Z1 = r.z1 * s + oz, w = X1 - X0 - 2 * pad, h = Z1 - Z0 - pad;
      if (X1 < 0 || X0 > W || Z1 < 0 || Z0 > H || w < 14 * dpr || h < 11 * dpr) continue;
      const L = labelsOf(r), been = G.museum.visited.has(r.id), done = st.arts.length ? st.done : been;
      let put = null;
      outer: for (const name of L.names) for (const f of [f0, f0 * 0.88]) {
        if (f < 10.5) continue;
        const px = f * dpr, font = `${L.mono ? '700' : '600'} ${px}px ${L.mono ? MONO : SERIF}`, lh = px * 1.15;
        if (lh <= h && measure(c, font, name) <= w) { put = { font, lines: [name], lh }; break outer; }
        if (2 * lh <= h && / /.test(name)) {
          // Two lines, broken at the space nearest the middle.
          let best = -1; for (let i = name.indexOf(' '); i > 0; i = name.indexOf(' ', i + 1)) if (best < 0 || Math.abs(i - name.length / 2) < Math.abs(best - name.length / 2)) best = i;
          const a = name.slice(0, best), b = name.slice(best + 1);
          if (measure(c, font, a) <= w && measure(c, font, b) <= w) { put = { font, lines: [a, b], lh }; break outer; }
        }
      }
      if (!put) continue;
      c.font = put.font;
      const cx = (X0 + X1) / 2, cy = (Z0 + Z1) / 2 - (put.lines.length - 1) * put.lh / 2;
      c.fillStyle = r.secret ? '#ff8a78' : done ? '#22190a' : been ? '#fbf1d6' : r.assumed ? 'rgba(222,216,200,.82)' : '#ece5d2';
      c.strokeStyle = 'rgba(5,6,10,.9)'; c.lineWidth = 3 * dpr;
      put.lines.forEach((t, i) => { if (!done) c.strokeText(t, cx, cy + i * put.lh); c.fillText(t, cx, cy + i * put.lh); });
    }
  }
  // "★ You are here", over the arrow on the big map: a tag in the arrow's own red that breathes.
  function drawHere(c, x, z) {
    const { s, ox, oz, dpr } = state.fit, X = x * s + ox, Z = z * s + oz, t = performance.now() / 1000;
    if (X < -40 || X > bc.width + 40 || Z < -40 || Z > bc.height + 40) return;
    const text = '★ You are here', font = `700 ${14 * dpr}px ${SERIF}`, tw = measure(c, font, text), ph = 26 * dpr, pw = tw + 20 * dpr;
    const above = Z - 30 * dpr - ph > 0, py = above ? Z - 30 * dpr - ph : Z + 30 * dpr, px = Math.max(4 * dpr, Math.min(bc.width - pw - 4 * dpr, X - pw / 2));
    const glow = 0.5 + 0.5 * Math.sin(t * 4);
    c.save();
    c.shadowColor = `rgba(255,90,60,${0.45 + glow * 0.45})`; c.shadowBlur = (6 + glow * 10) * dpr;
    c.fillStyle = '#ff5a3c'; c.strokeStyle = '#fff'; c.lineWidth = 2 * dpr;
    c.beginPath(); if (c.roundRect) c.roundRect(px, py, pw, ph, ph / 2); else c.rect(px, py, pw, ph); c.fill(); c.shadowBlur = 0; c.stroke();
    // (A little stalk from the tag to the arrow.)
    c.beginPath(); c.moveTo(Math.max(px + ph / 2, Math.min(px + pw - ph / 2, X)), above ? py + ph : py); c.lineTo(X, above ? Z - 16 * dpr : Z + 16 * dpr); c.stroke();
    c.fillStyle = '#fff'; c.font = font; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, px + pw / 2, py + ph / 2 + dpr);
    c.restore();
  }

  // ---- the radar ---------------------------------------------------------------
  // The plan of a level is drawn once onto a picture of its own, and the radar only turns and slides
  // that picture each frame: drawing several hundred rooms afresh every frame is what made it jerk.
  // The picture is redrawn when something on it changes (a room visited, a work seen), at most twice a second.
  // One picture per storey, keyed by the storey and not by the toy's exact height: a jump, a ramp or a hovering drone
  // changes the height every frame, and redrawing the whole plan each time is what made the radar stutter.
  const pics = new Map(); let pic = null;
  function levelPicture(y) {
    const ly = levelOf(y).y; pic = pics.get(ly) || null;
    const m = G.museum, key = `${Math.round(ly * 10)}|${m.visited.size}|${m.seenCount}|${G.plan.rooms.length}|${G.secret && G.secret.open ? 1 : 0}`, now = performance.now();
    if (pic && (pic.key === key || now - pic.at < 500) && pic.ly === Math.round(ly * 10)) return pic;
    const B = G.plan.rooms.reduce((b, r) => ({ x0: Math.min(b.x0, r.x0), x1: Math.max(b.x1, r.x1), z0: Math.min(b.z0, r.z0), z1: Math.max(b.z1, r.z1) }), { x0: 1e9, x1: -1e9, z0: 1e9, z1: -1e9 });
    const pad = 4, ppm = 4, cv = (pic && pic.canvas) || document.createElement('canvas');
    cv.width = Math.ceil((B.x1 - B.x0 + 2 * pad) * ppm); cv.height = Math.ceil((B.z1 - B.z0 + 2 * pad) * ppm);
    const k = cv.getContext('2d');
    k.setTransform(ppm, 0, 0, ppm, -(B.x0 - pad) * ppm, -(B.z0 - pad) * ppm);
    k.textAlign = 'center'; k.textBaseline = 'middle';
    drawLevel(k, ly, 1 / ppm, false);
    pic = { key, ly: Math.round(ly * 10), at: now, canvas: cv, x0: B.x0 - pad, z0: B.z0 - pad, ppm }; pics.set(ly, pic); return pic;
  }
  function radar() {
    const v = G.vehicle, c = rc, W = radarEl.width, R = W / 2, s = W / 62;             // 62 m across
    const t = performance.now() / 1000;
    // The route is drawn once, when it is asked for, and stays as drawn until you arrive or rub it out.
    if (ribbon && ribbon.visible) ribbon.material.map.offset.x = -(t * 1.6) % 1;
    const ly = youY();
    c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, W, W);
    c.save();
    c.beginPath(); c.arc(R, R, R - 2, 0, TAU); c.clip();
    c.fillStyle = 'rgba(8,10,16,.72)'; c.fillRect(0, 0, W, W);
    c.translate(R, R); c.rotate(v.yaw - Math.PI); c.scale(s, s); c.translate(-v.pos.x, -v.pos.z);
    c.textAlign = 'center'; c.textBaseline = 'middle';
    { const k = levelPicture(ly); c.imageSmoothingEnabled = true; c.drawImage(k.canvas, k.x0, k.z0, k.canvas.width / k.ppm, k.canvas.height / k.ppm); }
    c.strokeStyle = 'rgba(255,140,60,.95)'; c.lineWidth = 2.5 / s;
    for (const L of G.plan.loops) { c.beginPath(); c.arc(L.x, L.z, 5.5 / s, 0, TAU); c.stroke(); }
    if (G.mode === 'race' && G.race && G.race.active) {
      const Rc = G.race;
      c.strokeStyle = 'rgba(127,233,245,.6)'; c.lineWidth = 2 / s; c.beginPath();
      Rc.route.pts.forEach((p, i) => (i % 4 === 0) && (i ? c.lineTo(p.x, p.z) : c.moveTo(p.x, p.z)));
      c.closePath(); c.stroke();
      for (const b of Rc.bots) { c.fillStyle = '#' + b.colour.toString(16).padStart(6, '0'); c.beginPath(); c.arc(b.x, b.z, 5 / s, 0, TAU); c.fill(); }
    }
    drawPath(c, ly, 1 / s, t);
    drawMarks(c, ly, 1 / s, t);
    c.restore();
    // Whatever is off the edge is pinned to the rim: the next turn of the route, the race's next gate.
    const rim = (x, z, colour) => {
      const dx = x - v.pos.x, dz = z - v.pos.z, a = v.yaw - Math.PI, rx = (dx * Math.cos(a) - dz * Math.sin(a)) * s, ry = (dx * Math.sin(a) + dz * Math.cos(a)) * s, d = Math.hypot(rx, ry);
      if (d < R - 10) return;
      const k = (R - 9) / d;
      c.fillStyle = colour; c.strokeStyle = '#000'; c.lineWidth = 2; c.beginPath(); c.arc(R + rx * k, R + ry * k, 7, 0, TAU); c.fill(); c.stroke();
    };
    if (state.path) {
      // The part of the route still ahead: from the point of it nearest you, the first that is off the edge of the radar.
      const pts = (state.path.draw || []).flat(); let near = 0, nd = Infinity;
      pts.forEach((p, i) => { const d = Math.hypot(p.x - v.pos.x, p.z - v.pos.z) + Math.abs(p.y - v.pos.y) * 3; if (d < nd) { nd = d; near = i; } });
      const far = !pts.length ? state.target : pts.slice(near).find(p => Math.hypot(p.x - v.pos.x, p.z - v.pos.z) > (R - 12) / s) || state.target; rim(far.x, far.z, '#7fe9f5');
    }
    if (G.mode === 'race' && G.race && G.race.active) { const g = G.race.gates[G.race.next]; if (g) rim(g.x, g.z, '#7fe9f5'); }
    for (const m of G.mapMarks || []) rim(m.x, m.z, m.colour || '#ff5a4d');
    // North, on the rim.
    { const a = v.yaw - Math.PI, nx = Math.sin(a) * (R - 13), ny = -Math.cos(a) * (R - 13); c.fillStyle = 'rgba(226,205,148,.95)'; c.font = '700 15px ui-monospace, Menlo, monospace'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('N', R + nx, R + ny); }
    drawYou(c, R, R, Math.PI, 1.15);
    c.strokeStyle = 'rgba(226,205,148,.85)'; c.lineWidth = 3; c.beginPath(); c.arc(R, R, R - 2, 0, TAU); c.stroke();
    // Which level you are on: a gold tag on the rim at the bottom, big enough to read on the smallest radar (a phone's is a third the size).
    { const lv = levelOf(ly), text = lv.name === 'LL' ? 'LL' : lv.name === 'X' ? 'SL9' : 'L' + lv.name, font = `700 ${Math.round(W * 0.11)}px ${MONO}`;
      c.font = font; const tw = c.measureText(text).width, ph = W * 0.15, pw = Math.max(ph * 1.5, tw + W * 0.08), px = R - pw / 2, py = W - ph - W * 0.035;
      c.fillStyle = 'rgba(226,205,148,.97)'; c.strokeStyle = 'rgba(8,10,16,.9)'; c.lineWidth = 3;
      c.beginPath(); if (c.roundRect) c.roundRect(px, py, pw, ph, ph / 2); else c.rect(px, py, pw, ph); c.fill(); c.stroke();
      c.fillStyle = '#14120c'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, R, py + ph / 2 + 1); }
    if (state.target && Math.hypot(state.target.x - v.pos.x, state.target.z - v.pos.z) < 2.6 && Math.abs(state.target.y - v.pos.y) < 1.6) { say(`You are here: ${state.target.label}.`); clear(); }
  }

  // ---- the whole building ------------------------------------------------------
  function fit() {
    const dpr = Math.min(2, window.devicePixelRatio || 1), w = bc.clientWidth, h = bc.clientHeight;
    if (bc.width !== Math.round(w * dpr) || bc.height !== Math.round(h * dpr)) { bc.width = Math.round(w * dpr); bc.height = Math.round(h * dpr); }
    const B = G.plan.rooms.reduce((b, r) => ({ x0: Math.min(b.x0, r.x0), x1: Math.max(b.x1, r.x1), z0: Math.min(b.z0, r.z0), z1: Math.max(b.z1, r.z1) }), { x0: 1e9, x1: -1e9, z0: 1e9, z1: -1e9 });
    const pad = 6, s0 = Math.min(bc.width / (B.x1 - B.x0 + 2 * pad), bc.height / (B.z1 - B.z0 + 2 * pad));
    if (state.cx == null) { state.cx = (B.x0 + B.x1) / 2; state.cz = (B.z0 + B.z1) / 2; }
    state.zoom = Math.max(ZMIN, Math.min(9, state.zoom));
    // Never drag the building right off the screen.
    state.cx = Math.max(B.x0, Math.min(G.plan.lakefront ? G.plan.bounds.x1 : B.x1, state.cx)); state.cz = Math.max(B.z0, Math.min(B.z1, state.cz));
    const s = s0 * state.zoom;
    state.fit = { s, ox: bc.width / 2 - state.cx * s, oz: bc.height / 2 - state.cz * s, dpr };
  }
  let drawing = false;
  function drawBig() {
    if (big.hidden) { drawing = false; return; }
    drawing = true;
    fit();
    const { s, ox, oz, dpr } = state.fit, c = bx, t = performance.now() / 1000, ly = state.level.y, v = G.vehicle, here = Math.abs(youY() - ly) < 0.7;
    c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, bc.width, bc.height);
    c.setTransform(s, 0, 0, s, ox, oz);
    c.textAlign = 'center'; c.textBaseline = 'middle';
    drawLevel(c, ly, 1 / s, true);
    // The room whose card is open, ringed in gold.
    const sel = state.card && state.card.room;
    if (sel && onLevel(sel, ly)) { c.fillStyle = 'rgba(255,225,140,.16)'; c.fillRect(sel.x0, sel.z0, sel.x1 - sel.x0, sel.z1 - sel.z0); c.strokeStyle = '#ffe08a'; c.lineWidth = 3 * dpr / s; c.strokeRect(sel.x0, sel.z0, sel.x1 - sel.x0, sel.z1 - sel.z0); }
    // The names go on in screen pixels; then the route, the marks and you, over them.
    c.setTransform(1, 0, 0, 1, 0, 0);
    drawLabels(c, ly);
    c.setTransform(s, 0, 0, s, ox, oz);
    drawPath(c, ly, 1 / s, t);
    drawMarks(c, ly, 1 / s, t);
    if (here) drawYou(c, v.pos.x, v.pos.z, v.yaw, dpr / s);
    c.setTransform(1, 0, 0, 1, 0, 0);
    if (here) drawHere(c, v.pos.x, v.pos.z);
    requestAnimationFrame(drawBig);
  }
  const NAMES = { LL: 'Lower', 1: 'First', 2: 'Second', 3: 'Third', X: 'Sub-level 9' };
  function tabs() {
    const el = document.getElementById('bmLevels'); el.textContent = '';
    const you = levelOf(youY()), tg = state.target && levelOf(state.target.y);
    for (const l of levels().slice().reverse()) {
      const b = document.createElement('button'); b.dataset.level = l.name;
      // The level you are on carries your star, whichever level is being looked at.
      if (l.name === you.name) { const i = document.createElement('span'); i.className = 'here'; i.textContent = '★'; b.append(i); b.setAttribute('aria-label', `${NAMES[l.name] || l.name}, you are here`); }
      b.append(NAMES[l.name] || l.name);
      b.setAttribute('aria-pressed', l.name === state.level.name);
      el.append(b);
    }
    // Looking at another level: say where you are, and take you back with a tap.
    const off = document.getElementById('bmYou');
    off.hidden = you.name === state.level.name;
    if (!off.hidden) { off.innerHTML = '<b>★</b>'; off.append(`You are on the ${(NAMES[you.name] || you.name).toLowerCase()} level`); }
    document.getElementById('bmNote').textContent = state.target
      ? (state.path ? `To ${state.target.label}${tg.name !== you.name ? ` (${(NAMES[tg.name] || tg.name).toLowerCase()} level)` : ''}: about ${Math.round(state.path.length)} m.${state.path.jumpIn != null ? ' There is a jump on the way.' : ''}` : `No way found to ${state.target.label}.`)
      : 'Tap a room for its card.';
    document.getElementById('bmClear').hidden = !state.target;
    if (state.card && state.card.room && !onLevel(state.card.room, state.level.y)) card(null);
  }
  // Show the level you are on, with you in the middle of it if the plan is zoomed in far enough to lose you.
  function toYou() {
    state.level = levelOf(youY());
    if (state.zoom > 1.05) { state.cx = G.vehicle.pos.x; state.cz = G.vehicle.pos.z; }
  }
  function open() {
    if (G.state !== 'play') return;
    G.state = 'paused'; show('bigmap'); card(null);
    if (innerWidth < 900 && state.zoom === 1) state.zoom = 3;            // (a phone: near enough in for the names to fit)
    toYou(); tabs();
    if (!drawing) requestAnimationFrame(drawBig);
  }
  function close() { card(null); resume(); }
  function refresh() {
    const v = G.vehicle;
    state.path = state.target ? route({ x: v.pos.x, y: G.roomId ? v.pos.y : 0, z: v.pos.z }, state.target) : null;
    layRibbon();
    if (state.path && state.path.jumpIn != null && state.path.jumpIn < 15 && say) say('Jump ahead: the arrows leave the floor. Take it at speed.');
  }
  function clear() { state.target = null; state.path = null; layRibbon(); }
  // Set a destination from anywhere in the game: { x, y, z, label }.
  function goTo(target) { state.target = target; nav = nav || build(); refresh(); return !!state.path; }
  // Drag to move the plan, pinch or roll the wheel to zoom, tap (a touch that hardly moves) for a room's card.
  {
    const fingers = new Map(); let moved = 0, pinch = 0;
    const world = (cx, cy) => { const r = bc.getBoundingClientRect(), { s, ox, oz, dpr } = state.fit; return [((cx - r.left) * dpr - ox) / s, ((cy - r.top) * dpr - oz) / s]; };
    const zoomAt = (cx, cy, k) => { const [wx, wz] = world(cx, cy), z0 = state.zoom; state.zoom = Math.max(ZMIN, Math.min(9, z0 * k)); const f = state.zoom / z0; state.cx = wx - (wx - state.cx) / f; state.cz = wz - (wz - state.cz) / f; };
    bc.addEventListener('pointerdown', ev => { if (!state.fit) return; bc.setPointerCapture(ev.pointerId); fingers.set(ev.pointerId, { x: ev.clientX, y: ev.clientY }); if (fingers.size === 1) moved = 0; pinch = 0; });
    bc.addEventListener('pointermove', ev => {
      const f = fingers.get(ev.pointerId); if (!f || !state.fit) return;
      const dx = ev.clientX - f.x, dy = ev.clientY - f.y;
      if (fingers.size === 1) { moved += Math.hypot(dx, dy); if (moved > 8) { state.cx -= dx * state.fit.dpr / state.fit.s; state.cz -= dy * state.fit.dpr / state.fit.s; } }
      f.x = ev.clientX; f.y = ev.clientY;
      if (fingers.size === 2) { const [p, q] = [...fingers.values()], d = Math.hypot(p.x - q.x, p.y - q.y); if (pinch) zoomAt((p.x + q.x) / 2, (p.y + q.y) / 2, d / pinch); pinch = d; moved = 99; }
    });
    const up = ev => { const had = fingers.delete(ev.pointerId); pinch = 0; if (had && ev.type === 'pointerup' && fingers.size === 0 && moved <= 8) pick(ev); };
    bc.addEventListener('pointerup', up); bc.addEventListener('pointercancel', up);
    bc.addEventListener('wheel', ev => { ev.preventDefault(); if (state.fit) zoomAt(ev.clientX, ev.clientY, ev.deltaY < 0 ? 1.2 : 1 / 1.2); }, { passive: false });
  }
  // What is under a tap: a room on this level, a deck in a tall room, or the street.
  function placeUnder(x, z) {
    const ly = state.level.y, p = G.plan, inside = q => x >= q.x0 && x <= q.x1 && z >= q.z0 && z <= q.z1;
    const room = p.rooms.find(q => near(q.y, ly) && inside(q) && shown(q));
    if (room) return { room, target: { x, y: room.y, z, place: 'R' + room.id, label: room.kind === 'hall' ? 'Griffin Court' : room.gallery } };
    const d = p.decks.find(q => near(q.y, ly) && inside(q) && shown(p.byId[q.room]));
    if (d) { const r = p.byId[d.room]; return { room: r, target: { x, y: d.y, z, place: 'D' + d.id, label: r.kind === 'hall' ? 'Griffin Court' : r.gallery } }; }
    // (Not the thickness of a wall between two rooms: that is not outdoors.)
    if (near(ly, 0) && !p.rooms.some(q => q.y < 1 && q.top > 0.5 && inside(q)) && !(p.masses || []).some(m => m.top > 0.5 && inside(m))) return { room: null, target: { x, y: 0, z, place: 'OUT', label: 'that spot outdoors' } };
    return null;
  }
  function pick(ev) {
    const r = bc.getBoundingClientRect(), { s, ox, oz, dpr } = state.fit;
    const x = ((ev.clientX - r.left) * dpr - ox) / s, z = ((ev.clientY - r.top) * dpr - oz) / s;
    const at = placeUnder(x, z);
    // A tap on nothing, or on the room already open, puts the card away.
    if (!at || (state.card && at.room && state.card.room === at.room)) { card(null); return; }
    card(at, ev.clientX - r.left, ev.clientY - r.top);
  }
  // ---- a room's card -------------------------------------------------------------
  // Its name, its gallery number, what hangs in it and how much of that you have seen, and the button that lights the way.
  const cardEl = document.getElementById('bmCard');
  function card(at, cx, cy) {
    state.card = at;
    if (!at) { cardEl.hidden = true; return; }
    const r = at.room, n = nameOf(r), st = r && G.museum.rooms[r.id], arts = st ? st.arts.length : 0;
    document.getElementById('bmCardT').textContent = n.title;
    document.getElementById('bmCardS').textContent = n.sub;
    const lv = levelOf(at.target.y), bits = [`${NAMES[lv.name] || lv.name} level`];
    if (arts) bits.unshift(st.done ? `All ${arts} works seen ✓` : `${st.seen} of ${arts} works seen`);
    else if (r && G.museum.visited.has(r.id)) bits.unshift('Visited');
    document.getElementById('bmCardN').textContent = r ? bits.join(' · ') : '';
    const go = document.getElementById('bmGo'), inIt = r ? G.roomId === r.id && Math.abs(youY() - at.target.y) < 0.7 : false;
    go.disabled = inIt; go.textContent = inIt ? '★ You are here' : 'Show the way';
    cardEl.hidden = false;
    // Beside the tap and kept on the plan (on a small screen it may sit over the tap: the room is ringed, so that is fine).
    const box = cardEl.parentElement.getBoundingClientRect(), w = cardEl.offsetWidth, h = cardEl.offsetHeight, m = 8;
    let x = cx + 16, y = cy - h / 2;
    if (x + w > box.width - m) x = cx - 16 - w;
    if (x < m) x = Math.max(m, Math.min(box.width - w - m, cx - w / 2));
    y = Math.max(m, Math.min(box.height - h - m, y));
    cardEl.style.left = x + 'px'; cardEl.style.top = y + 'px';
  }
  addEventListener('keydown', e => { if (e.code === 'Escape' && !big.hidden && state.card) { e.preventDefault(); e.stopImmediatePropagation(); card(null); } }, true);
  big.addEventListener('click', ev => {
    const b = ev.target.closest('button');
    if (b && b.dataset.level) { state.level = levels().find(l => l.name === b.dataset.level); tabs(); }
    else if (b && b.id === 'bmClear') { clear(); tabs(); }
    else if (b && b.id === 'bmClose') close();
    else if (b && b.id === 'bmIn') state.zoom *= 1.5;
    else if (b && b.id === 'bmOut') state.zoom /= 1.5;
    else if (b && b.id === 'bmYou') { toYou(); tabs(); }
    else if (b && b.id === 'bmCardX') card(null);
    else if (b && b.id === 'bmGo' && state.card) { const t = state.card.target; card(null); goTo(t); tabs(); }
    // A tap anywhere off the plan and off the card (the heading, the key) puts the card away too.
    else if (!b && state.card && !ev.target.closest('#bmCard') && ev.target !== bc) card(null);
  });
  const tap = ev => { ev.preventDefault(); open(); };
  radarEl.addEventListener('touchstart', tap, { passive: false });
  radarEl.addEventListener('click', tap);

  return { radar, open, close, goTo, clear, route, clearance, get target() { return state.target; }, get path() { return state.path; }, reset() { nav = null; grids.clear(); clear(); } };
}
