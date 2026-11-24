// The map. In the corner, a round radar that turns with you, as in a driving game: the level you
// are on, you in the middle, whatever way you face at the top. Touch it (or press G) and the whole
// building opens on the level you are on, a level at a time. Tap a room there for its card, and Show the way lights it up, on the big map
// and on the radar, across stairs and lifts if it is on another level.

import { heightOf, groundAt, GRAVITY } from './plan.js';
import { features } from './features.js';
import { createLandway, VB } from './landway.js';

const TAU = Math.PI * 2;
const near = (a, b, e = 0.7) => Math.abs(a - b) < e;

export function createMap(G, { radarEl, show, resume, say, THREE, scene, wallAt }) {
  const rc = radarEl.getContext('2d');
  const big = document.getElementById('bigmap'), bc = document.getElementById('bmCanvas'), bx = bc.getContext('2d');
  const state = { level: null, target: null, path: null, at: 0, fit: null, marks: [], zoom: 1, cx: null, cz: null, card: null };
  let nav = null;

  // ---- which level is which --------------------------------------------------
  // The hidden level (X) is not on the map at all until you have been down there: nothing but the clues mentions it before.
  const secretLevel = () => (G.secrets && G.secrets.has('vault')) || (G.vehicle && G.vehicle.pos.y < -8);
  const levels = () => Object.entries(G.plan.levels || { 1: 0 }).filter(([name]) => name !== 'X' || secretLevel()).map(([name, y]) => ({ name, y })).sort((a, b) => a.y - b.y);
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
  // And the base beyond it (src/finale.js, the `B-` rooms) until the blast door has been opened, and most of it until you have been in.
  const based = r => !/^B-/.test(r.id) || (G.finale && (G.finale.found || (r.id === 'B-tunnel' && G.finale.doorOpen)));
  const shown = r => !r || !r.secret || (found() && based(r));

  // ---- places, and the ways between them ----------------------------------
  // A place is somewhere you can stand: the floor of a room, a deck, or outdoors. A way joins two
  // places: a doorway, a flight of stairs, a lift. The route is the shortest chain of them.
  // Everywhere else that a toy car can stand is one place, 'OUT': the ground out of doors at whatever height it lies
  // (a hill is ground), and whatever is reached from it by driving (a table top, a roof, the ice, a floe, a duct under
  // the yard). It is not crossed in straight lines: src/landway.js knows the lie of it.
  let land = null, landReady = false, landKey = '';
  const landKeyNow = () => { const p = G.plan; return `${p.surfaces.length}|${p.masses.length}|${p.floors.length}|${(p.roofs || []).length}|${p.boxes.length}`; };      // what the field was made from: if this is not what it was, it is made again
  const landOf = () => { if (!land) { land = createLandway(G.plan); landKey = landKeyNow(); } land.finish(); return land; };
  function placeAt(x, z, y) {
    const p = G.plan;
    for (const d of p.decks) if (near(d.y, y) && x >= d.x0 - 0.05 && x <= d.x1 + 0.05 && z >= d.z0 - 0.05 && z <= d.z1 + 0.05) return 'D' + d.id;
    for (const r of p.rooms) if (near(r.y, y) && x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1) return 'R' + r.id;
    if (landOf().nodeAt(x, z, y) >= 0) return 'OUT';
    return null;
  }
  function build() {
    const tB0 = performance.now();
    const p = G.plan, nodes = [], adj = [], flights = [];
    const node = (x, y, z, place) => { nodes.push({ x, y, z, place }); adj.push([]); return nodes.length - 1; };
    const link = (a, b, cost, how) => { adj[a].push([b, cost, how]); adj[b].push([a, cost, how]); };
    const way = (A, B, cost, how) => { if (A.place && B.place && A.place !== B.place) link(node(A.x, A.y, A.z, A.place), node(B.x, B.y, B.z, B.place), cost, how); };
    const L = landOf();
    for (const d of p.doors) {
      if (d.secret && !(found() && shown(p.byId[d.a]) && shown(p.byId[d.b]))) continue;                 // no way through a wall that has not opened
      if (p.locked && d.out && d !== p.vent) continue;      // nor through a locked door, nor by a way in that has yet to be found. The front vent is always a way: lit, open, the way in (src/plan.js)
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
      // Out of doors, the way on begins a stride clear of the wall, on the side away from the room.
      if (nodes.length === n0 + 2) for (const i of [n0, n0 + 1]) if (nodes[i].place === 'OUT') {
        const r = p.byId[nodes[i === n0 ? n0 + 1 : n0].place.slice(1)], n = nodes[i]; if (!r) continue;
        const sg = n.ax[0] ? Math.sign(cx - (r.x0 + r.x1) / 2) || 1 : Math.sign(cz - (r.z0 + r.z1) / 2) || 1, off = n.deep + 0.9;
        n.stride = { x: cx + n.ax[0] * sg * off, z: cz + n.ax[1] * sg * off };
      }
    }
    // A way through a wall that is not a doorway (the staff vent's duct, a mouse's run): it is driven, not crossed, so
    // all that is wanted here is the foot of it in the room. Where it leads is found by driving (landway.js).
    for (const w of p.walls || []) for (const o of w.openings || []) {
      if (p.locked || !o.door || !o.door.vent || p.doors.includes(o.door) || !w.room || !shown(w.room) || (w.room.secret && !found())) continue;
      const r = w.room, mid = (o.lo + o.hi) / 2, y = r.y + (o.y || 0), ew = w.side === 'e' || w.side === 'w', sg = w.side === 'e' || w.side === 's' ? 1 : -1, edge = w.side === 'e' ? r.x1 : w.side === 'w' ? r.x0 : w.side === 's' ? r.z1 : r.z0;
      const at = d => (ew ? { x: edge + sg * d, z: mid } : { x: mid, z: edge + sg * d });
      const a = L.nodeAt(at(0.45).x, at(0.45).z, y, false); if (a < 0) continue;
      const i = node(at(-0.5).x, y, at(-0.5).z, 'R' + r.id); nodes[i].hole = a; nodes[i].ax = ew ? [1, 0] : [0, 1]; nodes[i].deep = 0.3;
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
      // In by the doorway at each stop (plan.js picks the side): the other sides are shaft wall.
      const side = { w: [l.x0 - 0.5, cz], e: [l.x1 + 0.5, cz], n: [cx, l.z0 - 0.5], s: [cx, l.z1 + 0.5] };
      l.stops.forEach((y, i) => { for (const [x, z] of [...(l.doors ? [side[l.doors[i]]] : []), side.w, side.e, side.n, side.s]) { const place = placeAt(x, z, y); if (place) { stops.push({ x, y, z, place }); break; } } });
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
      // (Asked of what is near each point only, landway.js's sorting of the plan: asked of every obstacle in the building, this took half a second.)
      const free = (a, b) => { for (let t = 0; t <= 1.001; t += 0.25) { const q = at(a + (b - a) * t), near = L.subAt(q.x, q.z); if (placeAt(q.x, q.z, bot) == null || (wallAt && wallAt(near, q.x, q.z, bot)) || near.obstacles.some(o => !o.gate && q.x > o.x0 - 0.2 && q.x < o.x1 + 0.2 && q.z > o.z0 - 0.2 && q.z < o.z1 + 0.2 && o.y0 < bot + 0.3 && o.y1 > bot + 0.04)) return false; } return true; };
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
    // Where each way stands on the land: the cell or the spot (landway.js) it is reached from and left by, and how far off that is.
    const N = nodes.length, anchor = new Int32Array(N + 2).fill(-1), reach = new Float32Array(N + 2), flyAnchor = new Int32Array(N + 2).fill(-1);
    nodes.forEach((n, i) => {
      const q = n.stride || n;
      if (n.hole != null) anchor[i] = n.hole;
      else if (n.place === 'OUT') { anchor[i] = L.nodeAt(q.x, q.z, n.y, true); flyAnchor[i] = L.flyAt(q.x, q.z); }
      // (A doorway to the outside costs a few metres more than it is long, each way: indoors for choice.)
      if (anchor[i] >= 0) reach[i] = Math.max(0.05, Math.hypot(L.xN(anchor[i]) - n.x, L.zN(anchor[i]) - n.z)) + (n.stride ? 4 : 0);
    });
    // Which ways can be got to from which without going out of doors: so that a way that cannot be had is known at once, not after looking everywhere.
    const comp = new Int32Array(N).map((v, i) => i), top = i => { while (comp[i] !== i) i = comp[i] = comp[comp[i]]; return i; }, join = (a, b) => { a = top(a); b = top(b); if (a !== b) comp[a] = b; };
    adj.forEach((es, a) => { for (const e of es) join(a, e[0]); });
    for (const [pl, list] of byPlace) if (pl !== 'OUT') for (const i of list) join(list[0], i);
    const lands = new Set(), flies = new Set(); for (let i = 0; i < N; i++) { comp[i] = top(i); if (anchor[i] >= 0) lands.add(comp[i]); if (flyAnchor[i] >= 0) flies.add(comp[i]); }
    return { nodes, adj, byPlace, flights, jumps, anchor, reach, flyAnchor, none: new Int32Array(N + 2).fill(-1), comp, lands, flies, key: navKey(), ms: performance.now() - tB0 };
  }
  // What the ways depend on that can change under them: the doors (locked, then not), what has been found, and how much is standing about.
  const navKey = () => { const p = G.plan, f = G.finale; return `${p.locked ? 1 : 0}${p.secretOpen ? 1 : 0}${f && f.found ? 1 : 0}${f && f.doorOpen ? 1 : 0}|${p.surfaces.length}|${p.doors.length}|${p.masses.length}|${p.boxes.length}`; };
  const walk = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);

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
  function clearanceAt(x, y, z) {
    const inside = r => near(r.y, y, 0.3) && x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1;
    const room = lastRoom && inside(lastRoom) ? lastRoom : G.plan.rooms.find(inside);      // (asked thousands of times along one route, nearly always of the same room as last time)
    if (!room) return land && land.built && Math.abs(y - (land.street(x, z) ?? 99)) < 0.6 ? land.room(x, z) : 9;      // out of doors, on the ground: the land says
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
      if (!b || a.how || a.thru || (a.o && b.o) || Math.abs(a.y - b.y) > 0.1) continue;
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
      V.push({ x: a.x, y: a.y, z: a.z, rigid: !!(a.how && !/lift/.test(a.how)) || !!a.rigid, flight: !!(a.how && !/lift/.test(a.how)), o: !!a.o, air: !!a.air });
      if (a.how && /lift/.test(a.how)) flush();
    }
    flush();
    path.runs = runs.map(smooth).filter(r => r.length > 1);
    path.runs.forEach(drape);
    // How far it is, over the ground.
    path.length = 0; for (const r of path.runs) for (let i = 1; i < r.length; i++) path.length += Math.hypot(r[i].x - r[i - 1].x, r[i].y - r[i - 1].y, r[i].z - r[i - 1].z);
    path.draw = path.runs.map(r => r.filter((p, i) => i % 4 === 0 || i === r.length - 1 || p.air !== (r[i - 1] || p).air));
    path.jumpIn = null;
    { let s = 0; outer: for (const r of path.runs) for (let i = 0; i < r.length; i++) { if (r[i].air) { path.jumpIn = s; break outer; } s += STEP; } }
    // Every place the way leaves the ground (a jump over a pair of ramps, a leap off one): where the take-off is, and how fast it has to be taken.
    const speeds = path.pts.filter(a => (a.how === 'jump' && a.jump) || a.leap).map(a => (a.leap ? a.leap : a.jump.v)); path.airs = [];
    for (const r of path.runs) for (let i = 1; i < r.length; i++) if (r[i].air && !r[i - 1].air) path.airs.push({ x: r[i - 1].x, y: r[i - 1].y, z: r[i - 1].z, v: speeds[path.airs.length] || 5 });
    return path;
  }
  // Out of doors the way lies on the ground: each point of it is set on whatever is under it there (snow, a hill, a
  // ramp, the ice, a floe), found the way the car finds it, from the point before. (Indoors a floor is flat and a
  // flight of stairs is a straight line up its nosings: those are left as they are. So is a leap: it is in the air.)
  function drape(run) {
    let y = null, on = null;
    for (const p of run) {
      if (!p.o || p.air) { y = null; on = null; continue; }
      const g = land.groundUnder(p.x, p.z, y == null ? p.y : y, on, y == null ? 0.6 : 0.35);
      if (Math.abs(g - (y == null ? p.y : y)) > 1.5) { y = null; on = null; continue; }      // (nothing to lie on within reach: leave it where the search put it)
      p.y = y = g; on = land.U.on;
    }
  }
  function smooth(V) {
    // Drop points that sit on top of one another.
    V = V.filter((p, i) => i === 0 || Math.hypot(p.x - V[i - 1].x, p.z - V[i - 1].z) > 0.02 || Math.abs(p.y - V[i - 1].y) > 0.02);
    if (V.length < 2) return V;
    const clearance = (x, y, z, p) => (p && p.o ? (p.rigid ? 9 : land.room(x, z)) : clearanceAt(x, y, z));      // (out of doors the land says; up on the kit the search has already kept clear)
    const blockedAt = p => clearance(p.x, p.y, p.z, p) <= 0;
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
        for (let k = 0; k <= n; k++) { const s = k / n, q = 1 - s; pts.push({ x: q * q * p0.x + 2 * q * s * B.x + s * s * p2.x, y: q * q * p0.y + 2 * q * s * B.y + s * s * p2.y, z: q * q * p0.z + 2 * q * s * B.z + s * s * p2.z, rigid: k === n ? B.rigid : false, bend: true, o: B.o && (k < n / 2 ? V[i - 1].o : C.o), rigid0: !!(B.o && B.rigid) }); }
        if (B.o && B.rigid ? land.walks(pts) : !pts.some(blockedAt)) { arc = pts; break; }      // (a bend up on the kit has to be one a car can drive, the car's way)
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
      for (; s <= len; s += STEP) { const f = s / len; S.push({ x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f, z: a.z + (b.z - a.z) * f, rigid: a.rigid, air: a.air && b.air, bend: a.bend || b.bend, o: a.o && b.o, rigid0: a.rigid0 || b.rigid0 }); }
      carry = len - (s - STEP);
    }
    { const e = R[R.length - 1], l = S[S.length - 1]; if (Math.hypot(e.x - l.x, e.z - l.z) > 0.05) S.push({ ...e }); }
    // 3. Ease it: each point towards the middle of its neighbours, unless that would take it nearer to something solid than it should be.
    for (let it = 0; it < 24; it++) for (let i = 1; i < S.length - 1; i++) {
      const p = S[i]; if (p.air || p.rigid0 || S[i - 1].air || S[i + 1].air || ((p.rigid || S[i - 1].rigid) && !p.bend) || (p.bend && (S[i - 1].rigid && !S[i - 1].bend || S[i + 1].rigid && !S[i + 1].bend))) continue;
      const nx2 = p.x * 0.5 + (S[i - 1].x + S[i + 1].x) * 0.25, nz2 = p.z * 0.5 + (S[i - 1].z + S[i + 1].z) * 0.25, was = clearance(p.x, p.y, p.z, p), now = clearance(nx2, p.y, nz2, p);
      if (now >= Math.min(was, 0.45) - 0.01 && now > 0) { p.x = nx2; p.z = nz2; }       // (a bend may give up a little room to be a bend, but never the car's own width)
    }
    // A bend that begins on a flight of stairs lies on the stairs: its height is the flight's at that point.
    for (const q of S) { if (!q.bend) continue; const f = G.plan.ramps.find(f => q.x >= f.x0 && q.x <= f.x1 && q.z >= f.z0 && q.z <= f.z1 && q.y > Math.min(f.y0, f.y1) - 0.4 && q.y < Math.max(f.y0, f.y1) + 0.4); if (f) { const t = f.axis === 'x' ? (q.x - f.x0) / (f.x1 - f.x0) : (q.z - f.z0) / (f.z1 - f.z0); q.y = f.y0 + (f.y1 - f.y0) * t; q.rigid = true; } }
    return S;
  }

  // Whatever has changed since the ways were last worked out: a door unlocked, a wall opened, something set down or taken up.
  function fresh() {
    if (land && landKey !== landKeyNow()) { land.reset(); landKey = landKeyNow(); nav = null; grids.clear(); }
    const L = landOf();
    const changed = L.sync();
    if (changed.length) { nav = null; for (const [id, g] of grids) if (changed.some(o => o.x1 > g.room.x0 && o.x0 < g.room.x1 && o.z1 > g.room.z0 && o.z0 < g.room.z1)) grids.delete(id); }
    if (L.stats.spots > 120000 || (nav && nav.key !== navKey())) { L.forget(); nav = null; }      // (a door unlocked, a wall opened: what was found by driving while it was shut is forgotten)
    if (!nav) nav = build();
    return L;
  }
  // The shortest way from one spot to another: a list of points, each with how you get to the next.
  // One search over everything: the building's ways (doors, stairs, lifts, decks, jumps: `nav`), with a straight walk from
  // each to every other in the same room, and the land out of doors cell by cell (landway.js), joined wherever a way
  // stands on the land. A drone flies: no jumps, and out of doors straight over anything that is not a building.
  function route(from, to) {
    const L = fresh(), { nodes, adj, byPlace } = nav, N = nodes.length, S = N, T = N + 1, fly = !!(G.vehicle && G.vehicle.kind === 'drone'), noJumps = fly;
    let fp = placeAt(from.x, from.z, from.y), tp = to.place || placeAt(to.x, to.z, to.y);
    const anchor = (fly ? nav.flyAnchor : nav.anchor).slice(), reach = nav.reach, open = new Set();
    // The end. If it is on no floor of the building it is wherever a car can stand nearest to it: on the ground, on a
    // hill, or up on something. Up on something inside a room, that room's floor is driven over spot by spot to reach it.
    let end = { x: to.x, y: to.y, z: to.z };
    if (tp === 'OUT' || !tp) {
      const a = fly ? L.flyAt(to.x, to.z) : L.nodeAt(to.x, to.z, to.y, true);
      if (a < 0) return null;
      const near2 = Math.hypot(L.xN(a) - to.x, L.zN(a) - to.z) < 0.4;
      anchor[T] = a; end = { x: near2 ? to.x : L.xN(a), y: L.yOf(a), z: near2 ? to.z : L.zN(a), o: true };
      if (!fly && tp !== 'OUT') for (const r of G.plan.rooms) if (to.x >= r.x0 && to.x <= r.x1 && to.z >= r.z0 && to.z <= r.z1 && to.y > r.y - 0.3 && to.y < r.top + 0.3) { open.add('R' + r.id); for (const i of byPlace.get('R' + r.id) || []) if (anchor[i] < 0) { const n = nodes[i]; anchor[i] = L.nodeAt(n.x, n.z, n.y, true); } }
      tp = 'OUT';
    }
    // In the air or on a flight of stairs you are nowhere in particular: start from the nearest way.
    const startLinks = [];
    // Part-way up a flight, the ways on are its two ends, not the floor it started from.
    const on = nav.flights.find(f => from.x >= f.q.x0 && from.x <= f.q.x1 && from.z >= f.q.z0 && from.z <= f.q.z1 && from.y > Math.min(f.q.y0, f.q.y1) + 0.12 && from.y < Math.max(f.q.y0, f.q.y1) + 0.5);
    const nearest = () => { let b = -1, bd = Infinity; nodes.forEach((n, i) => { const d = Math.hypot(n.x - from.x, n.z - from.z) + Math.abs(n.y - from.y) * 4; if (d < bd) { bd = d; b = i; } }); if (b >= 0) startLinks.push([b, bd]); fp = null; };
    if (on) { for (const i of [on.lo, on.hi]) startLinks.push([i, Math.hypot(nodes[i].x - from.x, nodes[i].z - from.z) * 1.2]); fp = null; }
    else if (fp === 'OUT' || !fp) { const a = fly ? L.flyAt(from.x, from.z) : L.nodeAt(from.x, from.z, from.y, true); if (a >= 0) { anchor[S] = a; fp = 'OUT'; } else nearest(); }
    else if (byPlace.has(fp)) for (const i of byPlace.get(fp)) startLinks.push([i, walk(from, nodes[i])]);
    else nearest();
    const endCost = new Map();
    if (tp !== 'OUT' && byPlace.has(tp)) for (const i of byPlace.get(tp)) endCost.set(i, walk(to, nodes[i]));
    const ways = m => {
      if (m === T) return [];
      if (m === S) return fp && fp === tp && fp !== 'OUT' ? [...startLinks, [T, walk(from, to)]] : startLinks;
      const out = [], pl = nodes[m].place;
      for (const e of adj[m]) if (!(e[2] === 'jump' && noJumps)) out.push(e);
      if (endCost.has(m)) out.push([T, endCost.get(m)]);
      // Within a room, every way in it is a straight walk from every other.
      if (pl !== 'OUT') for (const v of byPlace.get(pl)) if (v !== m) out.push([v, walk(nodes[m], nodes[v])]);
      return out;
    };
    // Can it be had at all? Each end is on the land, or among the ways of some part of the building: those must be the same part, or both parts must open onto the land.
    { const sides = (a, links) => (a >= 0 ? null : new Set(links.map(e => nav.comp[e[0]]))), sS = sides(anchor[S], startLinks), sT = sides(anchor[T], [...endCost.keys()].map(i => [i])), onLand = fly ? nav.flies : nav.lands;
      const direct = fp && fp === tp && fp !== 'OUT', out = set => !set || [...set].some(c => onLand.has(c));
      if (!open.size && !direct && !(sS && sT && [...sS].some(c => sT.has(c))) && !(out(sS) && out(sT))) return null; }
    const portals = (pl, u) => { const q = { x: L.xN(u), z: L.zN(u) }, out = []; for (const i of byPlace.get(pl) || []) out.push([i, walk(q, nodes[i])]); if (pl === tp) out.push([T, walk(q, to)]); return out; };
    // Indoors for choice: from one room to another the way through the building is taken, if there is one, unless going out of doors is a good deal shorter.
    const ask = { n: N + 2, adj: ways, at: m => (m === S ? from : m === T ? end : nodes[m]), anchor, reach, S, T, open, portals, fly, sealed: !!G.plan.locked }, tA = performance.now();
    let res = null;
    if (anchor[S] < 0 && anchor[T] < 0 && !open.size) { res = L.search({ ...ask, anchor: nav.none }); if (res) res = L.search({ ...ask, bound: res.cost * 0.62, drive: 600 }) || res; }
    if (!res) res = L.search(ask);
    if (!res) return null;
    const tB = performance.now(), pts = []; let run = [];
    const flush = () => { if (run.length) { pts.push(...L.line(run, fly)); run = []; } };
    for (const id of res.path) {
      if (id < VB) { run.push(id); continue; }
      flush();
      const m = id - VB;
      pts.push(m === T ? end : m === S ? { x: from.x, y: from.y, z: from.z, o: fp === 'OUT' } : { x: nodes[m].x, y: nodes[m].y, z: nodes[m].z, i: m });
    }
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
      const prev = pts[k - 1], after = prev && ((Math.hypot(prev.x - q.x, prev.z - q.z) < 0.05 && Math.abs(prev.y - q.y) < 0.1) || (n.hole != null && prev.o));        // just come through it: the stride is on the far side
      if (after || k === 0) { full.push({ ...q, thru: true }, inner); } else { full.push({ ...inner, thru: true }, q); }
    }
    for (let k = 0; k + 1 < full.length; k++) if (Math.hypot(full[k].x - full[k + 1].x, full[k].z - full[k + 1].z) < 0.05 && Math.abs(full[k].y - full[k + 1].y) < 0.1 && !full[k].how) full[k].thru = true;
    const tC = performance.now(), path = refine({ pts: full, length: res.cost, cost: res.cost, looked: res.looked, out: tp === 'OUT' });
    path.ms = [tB - tA, tC - tB, performance.now() - tC].map(v => +v.toFixed(1));      // (the search, the line, the smoothing: for whoever is measuring)
    return path;
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
    // bisector at each point), three centimetres off the floor. Over a jump it is dotted, and hangs in the air where the car will be.
    // Out of doors each edge lies on the ground under it, so the strip tips with a bank or the side of a hill as paint on a road would.
    const pos = [], uv = [], idx = [], W = 0.2, LIFT = 0.03;
    for (const r of path.runs || []) {
      let run = 0, base = -1;
      for (let i = 0; i < r.length; i++) {
        const a = r[Math.max(0, i - 1)], b = r[Math.min(r.length - 1, i + 1)], p = r[i]; let dx = b.x - a.x, dz = b.z - a.z; const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l;
        if (i) run += Math.hypot(p.x - r[i - 1].x, p.y - r[i - 1].y, p.z - r[i - 1].z);
        const n = pos.length / 3; let yl = p.y, yr = p.y;
        if (p.o && !p.air && land) { const a = land.groundUnder(p.x - dz * W, p.z + dx * W, p.y, null, 0.3), b = land.groundUnder(p.x + dz * W, p.z - dx * W, p.y, null, 0.3); if (Math.abs(a - p.y) < 0.3) yl = a; if (Math.abs(b - p.y) < 0.3) yr = b; }
        pos.push(p.x - dz * W, yl + LIFT, p.z + dx * W, p.x + dz * W, yr + LIFT, p.z - dx * W); uv.push(run / 0.8, 0, run / 0.8, 1);
        if (base >= 0 && !(p.air && r[i - 1].air && (i >> 1) % 2)) idx.push(base, base + 1, n, base + 1, n + 1, n);
        base = n;
      }
    }
    const geo = ribbon.geometry;
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx);
    ribbon.visible = pos.length > 0;
  }

  // ---- out of doors ------------------------------------------------------------
  // Everything at street level that is not a room: the snow, the gardens and Butler Field, the pavements and paths, the
  // four streets and the Drive with their kerbs and lines, the railway in its cutting, the harbour, and the things to
  // find out there (the tree, the fountains, the rink, the skate park, the hills, the sled run, the light show's way,
  // the diamonds, the band shell). None of it changes, so it is drawn once, in metres, onto a picture of its own, and
  // both maps lay that picture under the street level's plan. (It is drawn again once, when the park's features have
  // started: the light show, the diamonds and the sled run are theirs.)
  const OUT = {
    snow: '#1a202d', lawn: '#18261f', hill: 'rgba(120,140,170,.10)', hillRing: 'rgba(170,190,220,.16)',
    pave: '#30353f', path: '#3a404c', road: '#0f1115', kerb: 'rgba(196,202,212,.6)', lane: 'rgba(226,230,238,.42)', yellow: 'rgba(240,196,84,.85)', median: '#272c35',
    ice: '#3f5c80', water: '#0b1a31', shore: 'rgba(170,196,226,.7)', rail: '#0a0b0e', track: 'rgba(160,150,132,.75)',
    snowkit: 'rgba(214,226,240,.5)', gold: 'rgba(255,206,110,.95)', label: 'rgba(226,205,148,.9)',
  };
  const featureById = id => features.find(f => f.id === id);
  // The streets: [name, axis of travel, kerb to kerb across, along, medians (strips down the middle)].
  function streetsOf() {
    const p = G.plan, Gd = p.grounds, B = p.bounds, L = p.lakefront; if (!Gd || !Gd.michigan) return [];
    const M = Gd.michigan, MO = Gd.monroe, JA = Gd.jackson, C = Gd.columbus, east = L ? L.lsd.x0 : B.x1;
    const out = [
      { name: 'MICHIGAN AVE', ax: 'z', a0: M.x0, a1: M.x1, b0: B.z0, b1: B.z1, med: [[-13, -12.2]] },
      { name: 'COLUMBUS DR', ax: 'z', a0: C.x0, a1: C.x1, b0: B.z0, b1: B.z1, med: [[(C.x0 + C.x1) / 2 - 0.4, (C.x0 + C.x1) / 2 + 0.4]] },
      { name: 'MONROE ST', ax: 'x', a0: MO.z0, a1: MO.z1, b0: M.x0, b1: east, med: [] },
      { name: 'JACKSON DR', ax: 'x', a0: JA.z0, a1: JA.z1, b0: M.x0, b1: east, med: [] },
    ];
    if (L) out.push({ name: 'LAKE SHORE DR', ax: 'z', a0: L.lsd.x0, a1: L.lsd.x1, b0: B.z0, b1: B.z1, med: [[L.lsd.med[0], L.lsd.med[1]]] });
    return out;
  }
  function drawOutdoors(c, px) {
    const p = G.plan, B = p.bounds, Gd = p.grounds || {}, L = p.lakefront;
    const rect = (q, col) => { c.fillStyle = col; c.fillRect(q.x0, q.z0, q.x1 - q.x0, q.z1 - q.z0); };
    const line = (x0, z0, x1, z1, col, w, dash) => { c.strokeStyle = col; c.lineWidth = w; c.setLineDash(dash || []); c.beginPath(); c.moveTo(x0, z0); c.lineTo(x1, z1); c.stroke(); c.setLineDash([]); };
    const ell = (x, z, rx, rz, fill, stroke, w) => { c.beginPath(); c.ellipse(x, z, rx, rz, 0, 0, TAU); if (fill) { c.fillStyle = fill; c.fill(); } if (stroke) { c.strokeStyle = stroke; c.lineWidth = w || px; c.stroke(); } };
    rect(B, OUT.snow);
    // Lawns under the snow: the two gardens, Butler Field.
    for (const q of [Gd.north, Gd.south, L && L.field]) if (q) rect(q, OUT.lawn);
    // The hills: a few rings, as contours.
    for (const h of p.hills || []) for (let k = 1; k <= 3; k++) ell(h.cx, h.cz, h.rx * k / 3, h.rz * k / 3, OUT.hill, OUT.hillRing, px * 1.2);
    // The lake: the shelf of ice from the shore to the buoys, open water beyond, the breakwater and its light.
    if (L) {
      const xw = L.edge ? L.edgeMin : L.buoys;
      rect({ x0: xw, x1: B.x1, z0: B.z0, z1: B.z1 }, OUT.water); rect({ x0: L.shore, x1: xw, z0: B.z0, z1: B.z1 }, OUT.ice);
      if (L.edge) {      // the ice out to its broken edge, and the floes (harbourplan.js) where they float
        c.fillStyle = OUT.ice; c.beginPath(); c.moveTo(xw, L.edge[0][1]); for (const [x, z] of L.edge) c.lineTo(x, z); c.lineTo(xw, L.edge[L.edge.length - 1][1]); c.fill();
        for (const f of L.floes) { c.beginPath(); f.poly.forEach(([u, v], i) => { const x = f.hx + (u * f.sx) * f.c + (v * f.sz) * f.s, z = f.hz - (u * f.sx) * f.s + (v * f.sz) * f.c; if (i) c.lineTo(x, z); else c.moveTo(x, z); }); c.fill(); }
      }
      line(L.shore, B.z0, L.shore, B.z1, OUT.shore, px * 2.5);
      if (!L.edge) for (let z = B.z0 + 4; z < B.z1; z += 9) ell(L.buoys, z, 0.9, 0.9, 'rgba(255,120,80,.8)');
      rect(L.breakwater, '#5b616c'); ell(L.light.x, L.light.z, 2.2, 2.2, L.edge ? 'rgba(255,90,80,1)' : 'rgba(120,255,170,1)');
      if (L.window) { rect(L.window, '#1c2c44'); ell((L.window.x0 + L.window.x1) / 2, (L.window.z0 + L.window.z1) / 2, 1.2, 1.2, '#06101e', OUT.shore, px * 1.5); }
    }
    // Pavements, the promenade and the paths through the gardens and the field.
    for (const q of p.paved || []) if (!L || q.x0 < (L.edge ? L.edgeMin : L.buoys) - 1) rect(q, OUT.pave);       // (plan.paved also marks the open water, where nothing glitters)
    if (L) rect({ x0: L.prom.x0, x1: L.shore, z0: B.z0, z1: B.z1 }, OUT.pave);
    for (const q of [...(Gd.paths || []), ...((L && L.paths) || [])]) rect(q, OUT.path);
    for (const q of Gd.plazas || []) ell(q.x, q.z, q.r, q.r, OUT.path);
    // The streets: asphalt, a kerb line down each side, lanes dashed, a median or a double yellow line down the middle.
    // The avenues go on first; the cross streets over them, so a junction is plain asphalt.
    const S = streetsOf(), avenues = S.filter(s => s.ax === 'z'), cross = S.filter(s => s.ax === 'x');
    const along = (s, a, b0, b1, col, w, dash) => (s.ax === 'z' ? line(a, b0, a, b1, col, w, dash) : line(b0, a, b1, a, col, w, dash));
    const spans = s => { if (s.ax === 'z') { let out = [[s.b0, s.b1]]; for (const x of cross) out = out.flatMap(([u, v]) => (x.a1 <= u || x.a0 >= v ? [[u, v]] : [[u, x.a0], [x.a1, v]].filter(([m, n]) => n - m > 0.5))); return out; }
      let out = [[s.b0, s.b1]]; for (const a of avenues) out = out.flatMap(([u, v]) => (a.a1 <= u || a.a0 >= v ? [[u, v]] : [[u, a.a0], [a.a1, v]].filter(([m, n]) => n - m > 0.5))); return out; };
    const paint = s => {
      if (s.ax === 'z') rect({ x0: s.a0, x1: s.a1, z0: s.b0, z1: s.b1 }, OUT.road); else rect({ x0: s.b0, x1: s.b1, z0: s.a0, z1: s.a1 }, OUT.road);
      for (const [u, v] of spans(s)) {
        along(s, s.a0, u, v, OUT.kerb, px * 1.4); along(s, s.a1, u, v, OUT.kerb, px * 1.4);
        // the carriageways either side of the middle, each split into lanes about 3.4 m wide
        const mid = s.med.length ? s.med : [[(s.a0 + s.a1) / 2, (s.a0 + s.a1) / 2]];
        for (const [m0, m1] of mid) {
          if (m1 > m0) { if (s.ax === 'z') rect({ x0: m0, x1: m1, z0: u, z1: v }, OUT.median); else rect({ x0: u, x1: v, z0: m0, z1: m1 }, OUT.median); }
          else { along(s, m0 - 0.2, u, v, OUT.yellow, Math.max(px, 0.14)); along(s, m0 + 0.2, u, v, OUT.yellow, Math.max(px, 0.14)); }
          for (const [k0, k1] of [[s.a0, m0], [m1, s.a1]]) { const n = Math.max(1, Math.round((k1 - k0) / 3.4)); for (let i = 1; i < n; i++) along(s, k0 + (k1 - k0) * i / n, u, v, OUT.lane, Math.max(px * 0.8, 0.12), [3, 9]); }
        }
      }
    };
    avenues.forEach(paint); cross.forEach(paint);
    // The railway in its cutting, where it is open to the sky (not under the streets' bridges or the galleries), its tracks down it.
    const R = Gd.rail, cut = p.cut || (R && R.cut);
    if (R && cut) for (const o of cut.open || [{ z0: B.z0, z1: B.z1 }]) {
      const z0 = Math.max(B.z0, o.z0), z1 = Math.min(B.z1, o.z1);
      rect({ x0: cut.x0, x1: cut.x1, z0, z1 }, OUT.rail);
      for (const x of R.tracks || []) for (const d of [-0.72, 0.72]) line(x + d, z0, x + d, z1, OUT.track, Math.max(px * 0.9, 0.12));
    }
    // Ice: the frozen pool, the fountains' basins, the rink (an ellipse, with its goals).
    for (const q of p.ice || []) { if (L && q.x0 >= L.shore - 1) continue; rect(q, OUT.ice); }
    if (p.rink) { const k = p.rink; ell(k.x, k.z, k.rx, k.rz, '#5d82ad', '#cfe2f6', px * 1.6); for (const sg of [-1, 1]) line(k.x + sg * k.gx, k.z - k.gw, k.x + sg * k.gx, k.z + k.gw, '#ff6a5a', px * 2.4); line(k.x, k.z - k.rz, k.x, k.z + k.rz, 'rgba(255,106,90,.6)', px * 1.2); }
    for (const f of Gd.fountains || []) ell(f.x, f.z, f.r, f.r, '#4f6f96', '#c9d8ea', px * 1.6);
    if (Gd.fountain) ell(Gd.fountain.x, Gd.fountain.z, 3.2, 3.2, '#4f6f96', '#c9d8ea', px * 1.6);
    // The skate park's empty pool, and the snow kit about the grounds (the sled run, the jump park, the light show's jumps).
    if (p.pool) { rect(p.pool, '#2d5d93'); c.strokeStyle = '#a9c8ea'; c.lineWidth = px * 1.4; c.strokeRect(p.pool.x0, p.pool.z0, p.pool.x1 - p.pool.x0, p.pool.z1 - p.pool.z0); }
    for (const q of p.surfaces || []) if ((q.skin === 'snow' || q.skin === 'ply') && !q.hill && Math.max(q.h0, q.h1) < 9 && (q.base || 0) < 0.5 && !p.rooms.some(r => r.y < 1 && q.x0 >= r.x0 && q.x1 <= r.x1 && q.z0 >= r.z0 && q.z1 <= r.z1)) rect(q, OUT.snowkit);
    // The light show's way: packed snow between two strings of lights.
    const show = featureById('lightshow');
    if (show && show.P && show.P.length > 1) {
      const P = show.P, w = (P[0].w || 2.2) * 2, trace = () => { c.beginPath(); P.forEach((q, i) => (i ? c.lineTo(q.x, q.z) : c.moveTo(q.x, q.z))); };
      c.lineJoin = 'round'; c.lineCap = 'round';
      trace(); c.strokeStyle = 'rgba(255,196,96,.55)'; c.lineWidth = w + px * 3; c.stroke();
      trace(); c.strokeStyle = '#d9dde6'; c.lineWidth = w; c.stroke();
      trace(); c.strokeStyle = 'rgba(255,120,90,.9)'; c.lineWidth = Math.max(px * 1.6, 0.4); c.setLineDash([1.2, 2.4]); c.stroke(); c.setLineDash([]);
      if (show.gateAt) { const g = show.gateAt; line(g.x - g.nx * 4, g.z - g.nz * 4, g.x + g.nx * 4, g.z + g.nz * 4, OUT.gold, 1.2); }
    }
    // The softball diamonds: a diamond of bases and the backstop's arc.
    const bf = featureById('butlerfield');
    for (const d of (bf && bf.diamonds) || []) {
      const [h, f1, f2, f3] = d.bases; c.beginPath(); c.moveTo(h.x, h.z); c.lineTo(f1.x, f1.z); c.lineTo(f2.x, f2.z); c.lineTo(f3.x, f3.z); c.closePath();
      c.fillStyle = 'rgba(150,112,70,.55)'; c.fill(); c.strokeStyle = 'rgba(240,232,210,.8)'; c.lineWidth = px * 1.4; c.stroke();
      for (const q of d.bases) ell(q.x, q.z, 0.7, 0.7, '#f4f0e6');
      const ux = h.x - (f1.x + f3.x) / 2, uz = h.z - (f1.z + f3.z) / 2, a = Math.atan2(uz, ux); c.beginPath(); c.arc(h.x, h.z, 4.5, a - 1.25, a + 1.25); c.strokeStyle = 'rgba(190,200,212,.9)'; c.lineWidth = Math.max(px * 1.6, 0.35); c.stroke();
    }
    // The band shell; the tree in the courtyard, with its star.
    if (L && L.shell) rect({ x0: L.shell.x0, x1: L.shell.x1, z0: L.shell.z0, z1: L.shell.z1 + 1.2 }, '#c7c8ce');
    if (Gd.tree) { const t = Gd.tree; c.beginPath(); c.moveTo(t.x, t.z - 4.2); c.lineTo(t.x + 3.6, t.z + 3); c.lineTo(t.x - 3.6, t.z + 3); c.closePath(); c.fillStyle = '#2f8a4c'; c.fill(); c.strokeStyle = '#ffd25e'; c.lineWidth = px * 1.4; c.stroke(); ell(t.x, t.z - 4.2, 1.1, 1.1, '#ffd25e'); }
    if (show && show.P && show.P.length) { const q = show.P[show.P.length - 1]; ell(q.x, q.z, 4.5, 4.5, null, OUT.gold, 1); }        // the Singing Tree at the finish
  }
  let outPic = null;
  function outdoorPicture() {
    const full = !!G.features;
    if (outPic && (outPic.full || !full)) return outPic;
    const B = G.plan.bounds, ppm = 4, cv = (outPic && outPic.canvas) || document.createElement('canvas');
    cv.width = Math.ceil((B.x1 - B.x0) * ppm); cv.height = Math.ceil((B.z1 - B.z0) * ppm);
    const k = cv.getContext('2d');
    k.setTransform(ppm, 0, 0, ppm, -B.x0 * ppm, -B.z0 * ppm);
    drawOutdoors(k, 1 / ppm);
    return (outPic = { canvas: cv, x0: B.x0, z0: B.z0, ppm, full });
  }
  const layOutdoors = c => { const k = outdoorPicture(); c.imageSmoothingEnabled = true; c.drawImage(k.canvas, k.x0, k.z0, k.canvas.width / k.ppm, k.canvas.height / k.ppm); };
  // The names out of doors: each street's, along it, and the big places'. Upright on the screen, at a size for it.
  function outdoorNames() {
    const p = G.plan, L = p.lakefront, B = p.bounds, out = streetsOf().map(s => ({ ...s, street: true }));
    if (L) out.push({ name: 'BUTLER FIELD', x: (L.field.x0 + L.field.x1) / 2 + 40, z: 150 }, { name: 'MONROE HARBOR', x: (L.buoys + B.x1) / 2, z: 120 }, { name: 'WINTER WONDERLAND', x: 342, z: 40 });
    return out;
  }
  // On the big map: each name written along its street (a street's name every so often), in screen pixels.
  function drawOutdoorNames(c, px) {
    c.font = `600 ${px * 11}px ${MONO}`; c.fillStyle = OUT.label; c.strokeStyle = 'rgba(5,6,10,.85)'; c.lineWidth = px * 3; c.lineJoin = 'round'; c.textAlign = 'center'; c.textBaseline = 'middle';
    const say = (t, x, z, rot) => { c.save(); c.translate(x, z); if (rot) c.rotate(rot); c.strokeText(t, 0, 0); c.fillText(t, 0, 0); c.restore(); };
    for (const n of outdoorNames()) {
      if (!n.street) { say(n.name, n.x, n.z); continue; }
      const mid = (n.a0 + n.a1) / 2, step = Math.max(60, px * 420);
      for (let b = n.b0 + step / 2; b < n.b1; b += step) n.ax === 'z' ? say(n.name, mid, b, Math.PI / 2) : say(n.name, b, mid, 0);
    }
  }
  // On the radar: the name of each street near you, at the point of it nearest you, upright whichever way you face.
  function radarNames(c, v, R, s) {
    const a = v.yaw - Math.PI, ca = Math.cos(a), sa = Math.sin(a), reach = (R - 22) / s;
    c.font = `700 ${Math.round(R * 0.085)}px ${MONO}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round'; c.lineWidth = 3;
    const put = [];
    for (const n of outdoorNames()) {
      let x, z;
      if (n.street) { const mid = (n.a0 + n.a1) / 2, b = Math.max(n.b0, Math.min(n.b1, n.ax === 'z' ? v.pos.z : v.pos.x)); if (n.ax === 'z') { x = mid; z = b; } else { x = b; z = mid; } }
      else { x = n.x; z = n.z; }
      const dx = x - v.pos.x, dz = z - v.pos.z; if (Math.hypot(dx, dz) > reach) continue;
      // (a little way along the street from you, not on top of the arrow)
      let rx = (dx * ca - dz * sa) * s, ry = (dx * sa + dz * ca) * s;
      // Where it can go: there, or (if that is on top of you, or of another name) a way along the street ahead, or behind.
      const tw = c.measureText(n.name).width + 6, th = R * 0.1, tries = [];
      if (!n.street || Math.hypot(rx, ry) >= R * 0.3) tries.push([rx, ry]);
      if (n.street) { const ex = n.ax === 'z' ? 0 : 1, ez = 1 - ex; let ux = ex * ca - ez * sa, uy = ex * sa + ez * ca; if (uy > 0) { ux = -ux; uy = -uy; } for (const k of [0.42, -0.42, 0.62]) tries.push([rx + ux * R * k, ry + uy * R * k]); }
      const spot = tries.find(([qx, qy]) => Math.hypot(qx, qy) < R - 18 - tw * 0.3 && !(Math.abs(qx) < tw / 2 + 14 && Math.abs(qy) < th / 2 + 14) && !put.some(o => Math.abs(o[0] - qx) < (o[2] + tw) / 2 && Math.abs(o[1] - qy) < th));
      if (!spot) continue;
      put.push([spot[0], spot[1], tw]);
      c.strokeStyle = 'rgba(5,6,10,.9)'; c.fillStyle = OUT.label; c.strokeText(n.name, R + spot[0], R + spot[1]); c.fillText(n.name, R + spot[0], R + spot[1]);
    }
  }

  // ---- drawing a level -------------------------------------------------------
  // Everything is drawn in metres; the caller has already set the transform. `px` is how many
  // metres one screen pixel is, so that lines keep their weight whatever the scale.
  const ZMIN = 0.42;                                   // far enough out to see from the avenue to the water
  function drawLevel(c, ly, px, label) {
    const p = G.plan;
    // Out of doors, on the big map: the streets, the gardens, the park, the Drive and the harbour (outdoorPicture). Zoom out to see them all.
    if (label && Math.abs(ly) < 1) { layOutdoors(c); drawOutdoorNames(c, px); }
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
    for (const d of p.doors) if (Math.abs(d.y - ly) < 1.6 && (!d.secret || (found() && shown(p.byId[d.a]) && shown(p.byId[d.b])))) c.fillRect(d.x0 - px, d.z0 - px, Math.max(2 * px, d.x1 - d.x0 + 2 * px), Math.max(2 * px, d.z1 - d.z0 + 2 * px));
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
    const here = q => (q.o ? Math.abs(ly) < 1 : Math.abs(q.y - ly) < 2.4);      // (out of doors is the street's level, however high the ground lies: a hill is not upstairs)
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
    if (e && (path.out ? Math.abs(ly) < 1 : here(e))) { const s = px * (7 + Math.sin(t * 5) * 1.5); c.strokeStyle = '#7fe9f5'; c.lineWidth = px * 2.5; c.beginPath(); c.arc(e.x, e.z, s, 0, TAU); c.stroke(); c.fillStyle = '#fff'; c.beginPath(); c.arc(e.x, e.z, px * 3, 0, TAU); c.fill(); }
  }
  // The secrets found so far: a small gold star on each, on its own level.
  let gotSpots = [];
  function drawFound(c, ly, px) {
    for (const m of gotSpots) {
      if (Math.abs((m.y || 0) - ly) > 2.4 && !(ly === 0 && (m.y || 0) > -2 && (m.y || 0) < 2.5)) continue;
      c.save(); c.translate(m.x, m.z); c.scale(px, px); c.beginPath();
      for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 4.4 : 10.5; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
      c.closePath(); c.fillStyle = '#ffd25e'; c.strokeStyle = 'rgba(0,0,0,.85)'; c.lineWidth = 2; c.fill(); c.stroke(); c.restore();
    }
  }
  // The races come across so far (G.raceIcons, src/racespots.js): a little chequered flag on each start line, gold once
  // its rival is beaten, and on the big map the best time beside it.
  const lapTime = t => `${Math.floor(t / 60)}:${(t % 60 < 10 ? '0' : '') + (t % 60).toFixed(2)}`;
  function drawRaces(c, ly, px, big) {
    for (const r of G.raceIcons ? G.raceIcons() : []) {
      if (Math.abs(r.y - ly) > 2.4) continue;
      const gold = r.won ? '#ffd25e' : '#f1ecdf';
      c.save(); c.translate(r.x, r.z); c.scale(px, px);
      c.strokeStyle = 'rgba(0,0,0,.85)'; c.lineWidth = 4; c.beginPath(); c.moveTo(-6, 9); c.lineTo(-6, -12); c.stroke();
      c.strokeStyle = gold; c.lineWidth = 2; c.beginPath(); c.moveTo(-6, 9); c.lineTo(-6, -12); c.stroke();
      for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) { c.fillStyle = (i + j) % 2 ? gold : '#111'; c.fillRect(-5 + i * 4, -12 + j * 4, 4, 4); }
      c.strokeStyle = 'rgba(0,0,0,.85)'; c.lineWidth = 1; c.strokeRect(-5, -12, 12, 8);
      if (big) {
        const text = r.best ? `${r.name} \u00b7 ${lapTime(r.best)}` : r.name;
        c.font = `700 11px ${MONO}`; c.textAlign = 'left'; c.textBaseline = 'middle'; c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,.85)'; c.strokeText(text, 10, -8); c.fillStyle = gold; c.fillText(text, 10, -8);
      }
      c.restore();
    }
  }
  // Marks other parts of the game ask for (G.mapMarks: [{ x, y, z, colour, ring }]).
  function drawMarks(c, ly, px, t, rot = 0) {
    for (const m of G.mapMarks || []) {
      if (m.y != null && Math.abs(m.y - ly) > 2.4) continue;
      // A glyph instead of a dot (the story's faint "?" where to look next: src/story.js): drawn in screen pixels, upright.
      if (m.glyph) { c.save(); c.translate(m.x, m.z); c.rotate(-rot); c.scale(px, px); c.globalAlpha = 0.55 + 0.25 * Math.sin(t * 2.4); c.font = `700 ${m.size || 22}px Georgia, serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = 4; c.strokeStyle = 'rgba(0,0,0,.8)'; c.strokeText(m.glyph, 0, 0); c.fillStyle = m.colour || '#9dffb0'; c.fillText(m.glyph, 0, 0); c.restore(); continue; }
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

  // Out of doors the radar shows the street's level, but the tag says where you are when that is somewhere up: in the
  // glass lift, the level it is at (its own buttons say 1, 3 and R); on the Nichols Bridgeway, Bridge; over any roof (the
  // terrace, the rink, the card game), Roof. Nothing when you are on the ground, or flying over it.
  function outdoorTag() {
    if (G.roomId) return null;
    const v = G.vehicle, p = v.pos, mw = G.museum && G.museum.mw, L = mw && mw.lift;
    if (L && p.y > 1 && p.x > L.x0 - 0.3 && p.x < L.x1 + 0.3 && p.z > L.z0 - 0.3 && p.z < L.z1 + 0.3) return p.y < 6 ? null : p.y < 14 ? 'L3' : 'Roof';
    if (p.y < 2.4) return null;
    const P = G.plan, under = P.under, g = groundAt(P, p.x, p.z, p.y + 0.1); P.under = under;      // (leave the toy's own answer about what it is on as it was)
    if (g < 2.4) return null;
    const D = mw && mw.deck;
    if (D && p.z > D.z0 - 0.5 && p.z < D.z1 + 0.5 && Math.abs(p.x - D.cx(Math.max(D.z0, Math.min(D.z1, p.z)))) < D.w + 0.6) return 'Bridge';
    // A roof is up on a building; a hill (the sled hill, the snow banks) is the street's level however high it is.
    for (const m of P.masses || []) if (p.x > m.x0 - 0.5 && p.x < m.x1 + 0.5 && p.z > m.z0 - 0.5 && p.z < m.z1 + 0.5 && g > m.top - 3) return 'Roof';
    return null;
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
    const m = G.museum, key = `${Math.round(ly * 10)}|${m.visited.size}|${m.seenCount}|${G.plan.rooms.length}|${G.secret && G.secret.open ? 1 : 0}|${G.finale && G.finale.found ? 1 : 0}${G.finale && G.finale.doorOpen ? 1 : 0}`, now = performance.now();
    if (pic && (pic.key === key || now - pic.at < 500) && pic.ly === Math.round(ly * 10)) return pic;
    const B = G.plan.rooms.filter(r => !/^B-/.test(r.id) || shown(r)).reduce((b, r) => ({ x0: Math.min(b.x0, r.x0), x1: Math.max(b.x1, r.x1), z0: Math.min(b.z0, r.z0), z1: Math.max(b.z1, r.z1) }), { x0: 1e9, x1: -1e9, z0: 1e9, z1: -1e9 });
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
    // The lie of the land out of doors (landway.js), read a strip at a time once everything is standing where it will stand, so that the first way asked for does not wait for it.
    if (!landReady && G.features && G.state === 'play') { if (!land) { land = createLandway(G.plan); landKey = landKeyNow(); } landReady = land.tick(2); }
    const ly = youY();
    c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, W, W);
    c.save();
    c.beginPath(); c.arc(R, R, R - 2, 0, TAU); c.clip();
    c.fillStyle = Math.abs(ly) < 1 && !G.roomId ? 'rgba(10,12,18,.93)' : 'rgba(8,10,16,.72)'; c.fillRect(0, 0, W, W);      // (out of doors the ground is drawn: past its edge, the city, dark)
    c.translate(R, R); c.rotate(v.yaw - Math.PI); c.scale(s, s); c.translate(-v.pos.x, -v.pos.z);
    c.textAlign = 'center'; c.textBaseline = 'middle';
    if (Math.abs(ly) < 1) layOutdoors(c);                // the streets and the grounds, under the street level's rooms
    { const k = levelPicture(ly); c.imageSmoothingEnabled = true; c.drawImage(k.canvas, k.x0, k.z0, k.canvas.width / k.ppm, k.canvas.height / k.ppm); }
    c.strokeStyle = 'rgba(255,140,60,.95)'; c.lineWidth = 2.5 / s;
    for (const L of G.plan.loops) { c.beginPath(); c.arc(L.x, L.z, 5.5 / s, 0, TAU); c.stroke(); }
    if (G.racing) {
      const Rc = G.race;
      c.strokeStyle = 'rgba(127,233,245,.6)'; c.lineWidth = 2 / s; c.beginPath();
      Rc.route.pts.forEach((p, i) => (i % 4 === 0) && (i ? c.lineTo(p.x, p.z) : c.moveTo(p.x, p.z)));
      c.closePath(); c.stroke();
      for (const b of Rc.bots) { c.fillStyle = '#' + b.colour.toString(16).padStart(6, '0'); c.beginPath(); c.arc(b.x, b.z, 5 / s, 0, TAU); c.fill(); }
    }
    drawPath(c, ly, 1 / s, t);
    drawMarks(c, ly, 1 / s, t, v.yaw - Math.PI);
    drawRaces(c, ly, 1 / s, false);
    c.restore();
    if (!G.roomId && Math.abs(ly) < 1) { c.save(); c.beginPath(); c.arc(R, R, R - 2, 0, TAU); c.clip(); radarNames(c, v, R, s); c.restore(); }      // out of doors, the streets' names
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
    if (G.racing) { const g = G.race.gates[G.race.next]; if (g) rim(g.x, g.z, '#7fe9f5'); }
    for (const m of G.mapMarks || []) if (!m.glyph) rim(m.x, m.z, m.colour || '#ff5a4d');
    // The story's "?" (src/story.js) off the edge: a small one on the rim, the way to the next clue (src/hud.js rings the radar when it moves on).
    for (const m of G.mapMarks || []) if (m.glyph) {
      const dx = m.x - v.pos.x, dz = m.z - v.pos.z, a = v.yaw - Math.PI, rx = (dx * Math.cos(a) - dz * Math.sin(a)) * s, ry = (dx * Math.sin(a) + dz * Math.cos(a)) * s, d = Math.hypot(rx, ry);
      if (d < R - 10) continue;
      const k = (R - 11) / d, x = R + rx * k, y = R + ry * k;
      c.save(); c.globalAlpha = 0.7 + 0.3 * Math.sin(t * 2.4); c.fillStyle = 'rgba(6,14,9,.85)'; c.beginPath(); c.arc(x, y, 8.5, 0, TAU); c.fill();
      c.font = '700 14px Georgia, serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = m.colour || '#9dffb0'; c.fillText(m.glyph, x, y + 1); c.restore();
    }
    // North, on the rim.
    { const a = v.yaw - Math.PI, nx = Math.sin(a) * (R - 13), ny = -Math.cos(a) * (R - 13); c.fillStyle = 'rgba(226,205,148,.95)'; c.font = '700 15px ui-monospace, Menlo, monospace'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('N', R + nx, R + ny); }
    drawYou(c, R, R, Math.PI, 1.15);
    c.strokeStyle = 'rgba(226,205,148,.85)'; c.lineWidth = 3; c.beginPath(); c.arc(R, R, R - 2, 0, TAU); c.stroke();
    // Which level you are on: a gold tag on the rim at the bottom, big enough to read on the smallest radar (a phone's is a third the size).
    { const lv = levelOf(ly), text = outdoorTag() || (lv.name === 'LL' ? 'SL1' : lv.name === 'X' ? 'SL9' : lv.name === 'B' ? 'SL10' : 'L' + lv.name), font = `700 ${Math.round(W * 0.11)}px ${MONO}`;
      c.font = font; const tw = c.measureText(text).width, ph = W * 0.15, pw = Math.max(ph * 1.5, tw + W * 0.08), px = R - pw / 2, py = W - ph - W * 0.035;
      c.fillStyle = 'rgba(226,205,148,.97)'; c.strokeStyle = 'rgba(8,10,16,.9)'; c.lineWidth = 3;
      c.beginPath(); if (c.roundRect) c.roundRect(px, py, pw, ph, ph / 2); else c.rect(px, py, pw, ph); c.fill(); c.stroke();
      c.fillStyle = '#14120c'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, R, py + ph / 2 + 1); }
    // A jump on the way, coming up: said once, as it is when the way starts with one.
    if (state.path && state.path.airs) for (const a of state.path.airs) if (!a.told && Math.hypot(a.x - v.pos.x, a.z - v.pos.z) < 12 && Math.abs(a.y - v.pos.y) < 2.5) { a.told = true; if (say && v.kind === 'car') say('Jump ahead: the arrows leave the floor. Take it at speed.'); }
    if (state.target && Math.hypot(state.target.x - v.pos.x, state.target.z - v.pos.z) < 2.6 && Math.abs(state.target.y - v.pos.y) < 1.6) { say(`You are here: ${state.target.label}.`); clear(); }
  }

  // ---- the whole building ------------------------------------------------------
  function fit() {
    const dpr = Math.min(2, window.devicePixelRatio || 1), w = bc.clientWidth, h = bc.clientHeight;
    if (bc.width !== Math.round(w * dpr) || bc.height !== Math.round(h * dpr)) { bc.width = Math.round(w * dpr); bc.height = Math.round(h * dpr); }
    const B = G.plan.rooms.filter(r => !/^B-/.test(r.id) || shown(r)).reduce((b, r) => ({ x0: Math.min(b.x0, r.x0), x1: Math.max(b.x1, r.x1), z0: Math.min(b.z0, r.z0), z1: Math.max(b.z1, r.z1) }), { x0: 1e9, x1: -1e9, z0: 1e9, z1: -1e9 });
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
    drawFound(c, ly, dpr / s);
    drawRaces(c, ly, dpr / s, true);
    if (here) drawYou(c, v.pos.x, v.pos.z, v.yaw, dpr / s);
    c.setTransform(1, 0, 0, 1, 0, 0);
    if (here) drawHere(c, v.pos.x, v.pos.z);
    requestAnimationFrame(drawBig);
  }
  const NAMES = { LL: 'Sub-level 1', 1: 'First', 2: 'Second', 3: 'Third', X: 'Sub-level 9', B: 'Sub-level 10' };      // (B: the base's lower storey, once it has been found: src/finale.js)
  const levelText = n => { const t = NAMES[n] || n; return /^Sub/.test(t) ? t.toLowerCase() : `the ${t.toLowerCase()} level`; };
  function tabs() {
    const el = document.getElementById('bmLevels'); el.textContent = '';
    const you = levelOf(youY()), tg = state.target && levelOf(state.target.place === 'OUT' || (state.path && state.path.out) ? 0 : state.target.y);
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
    if (!off.hidden) { off.innerHTML = '<b>★</b>'; off.append(`You are on ${levelText(you.name)}`); }
    document.getElementById('bmNote').textContent = state.target
      ? (state.path ? `To ${state.target.label}${tg.name !== you.name ? ` (${levelText(tg.name)})` : ''}: about ${Math.round(state.path.length)} m.${state.path.jumpIn != null ? ' There is a jump on the way.' : ''}` : `No way found to ${state.target.label}.`)
      : 'Tap a room for its card.';
    document.getElementById('bmClear').hidden = !state.target;
    if (state.card && state.card.room && !onLevel(state.card.room, state.level.y)) card(null);
  }
  // Show the level you are on, with you in the middle of it if the plan is zoomed in far enough to lose you.
  function toYou() {
    state.level = levelOf(youY());
    if (state.zoom > 1.05) { state.cx = G.vehicle.pos.x; state.cz = G.vehicle.pos.z; }
    else state.cx = state.cz = null;          // the whole plan, centred: it grows when the base under the park is found
  }
  function open() {
    gotSpots = G.foundSpots ? G.foundSpots() : [];
    if (G.state !== 'play') return;
    G.state = 'paused'; show('bigmap'); card(null);
    if (innerWidth < 900 && state.zoom === 1) state.zoom = 3;            // (a phone: near enough in for the names to fit)
    toYou(); tabs();
    if (!drawing) requestAnimationFrame(drawBig);
  }
  function close() { card(null); resume(); }
  function refresh() {
    const v = G.vehicle;
    state.path = state.target ? route({ x: v.pos.x, y: v.pos.y, z: v.pos.z }, state.target) : null;
    layRibbon();
    if (state.path && state.path.jumpIn != null && state.path.jumpIn < 15 && say) { say('Jump ahead: the arrows leave the floor. Take it at speed.'); if (state.path.airs[0]) state.path.airs[0].told = true; }
  }
  function clear() { state.target = null; state.path = null; layRibbon(); }
  // Set a destination from anywhere in the game: { x, y, z, label }.
  function goTo(target) { state.target = target; refresh(); return !!state.path; }
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
    if (near(ly, 0) && !p.rooms.some(q => q.y < 1 && q.top > 0.5 && inside(q)) && !(p.masses || []).some(m => m.top > 0.5 && inside(m))) return { room: null, target: { x, y: landOf().street(x, z) ?? 0, z, place: 'OUT', label: 'that spot outdoors' } };      // (on the ground there, however high it lies)
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
    if (r) { const got = gotSpots.filter(q => q.x >= r.x0 && q.x <= r.x1 && q.z >= r.z0 && q.z <= r.z1 && Math.abs((q.y || 0) - r.y) < 3).map(q => q.name).filter((v, i, a) => a.indexOf(v) === i); if (got.length) bits.push('★ ' + (got.length > 2 ? `${got.slice(0, 2).join(', ')} +${got.length - 2}` : got.join(', '))); }
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

  return { radar, open, close, goTo, clear, route, clearance: clearanceAt, picture: levelPicture /* the plan of the level at height y, as a canvas: src/tracker.js */, get target() { return state.target; }, get path() { return state.path; }, get land() { return land; }, get nav() { return nav; } /* test aids (tools/dev/routeprobe.mjs): the lie of the land, and the ways worked out */, reset() { nav = null; grids.clear(); if (land) land.forget(); clear(); } };
}
