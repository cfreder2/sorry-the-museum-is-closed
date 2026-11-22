#!/usr/bin/env node
// Checks that src/layout.js describes a building a toy car can get all the way round.
//
//   node tools/check_layout.mjs [path/to/layout.js]
//
// The plan is turned into places you can stand (the floor of each room, each deck, each doorway's
// threshold, and outdoors) and the ways between them (stairs and ramps, lifts, decks that touch, a
// threshold and whatever is level with it either side), and then walked from the front door. It
// fails, with a list, if a room or a deck cannot be reached, if a doorway opens onto nothing (a
// door a storey up a wall with no deck in front of it; a door into a room whose floor is at another
// height with no ramp to it), if a ramp or a lift does not arrive at a floor, or if a ramp is steeper
// than about one in three.
//
// Rooms marked `secret` are on no drawing and are reached only through the doorway marked `hidden`,
// which is shut until it is found. So the walk is made twice. With that doorway shut, everything
// that is not secret must still be reached and nothing secret may be: a secret room is never the
// way to anything else. With it open, the secret rooms must be reached too.

import { pathToFileURL, fileURLToPath } from 'node:url';

const file = process.argv[2] || fileURLToPath(new URL('../src/layout.js', import.meta.url));
const L = (await import(pathToFileURL(file))).default;
const rooms = L.rooms, doors = L.doors, decks = L.decks || [], ramps = L.ramps || [], lifts = L.lifts || [];
const byId = Object.fromEntries(rooms.map(r => [r.id, r]));
const same = (a, b) => Math.abs(a - b) < 0.06;
const problems = [], notes = [];

// ---- places ----
const R = r => 'room ' + r.id, D = d => 'deck ' + d.id, T = i => 'doorway ' + i, OUT = 'outdoors';
const edges = new Map();
const link = (a, b, how) => { if (!a || !b || a === b) return; for (const [p, q] of [[a, b], [b, a]]) { if (!edges.has(p)) edges.set(p, []); edges.get(p).push([q, how]); } };
const secretRooms = new Set(rooms.filter(r => r.secret).map(r => r.id));
const isSecret = p => (p.startsWith('room ') && secretRooms.has(p.slice(5))) || (p.startsWith('deck ') && secretRooms.has((decks.find(d => D(d) === p) || {}).room));
// What is there to stand on at (x, z, y)? A deck there at that height, the floor of a room there at that height, or a doorway's threshold.
function standAt(x, z, y) {
  for (const [i, d] of doors.entries()) if (same(d.y, y) && x >= d.x0 - 0.01 && x <= d.x1 + 0.01 && z >= d.z0 - 0.01 && z <= d.z1 + 0.01) return T(i);
  for (const d of decks) if (same(d.y, y) && x >= d.x0 - 0.01 && x <= d.x1 + 0.01 && z >= d.z0 - 0.01 && z <= d.z1 + 0.01) return D(d);
  for (const r of rooms) if (same(r.y || 0, y) && x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1) return R(r);
  return null;
}
const insideRoom = (o, r) => o.x0 >= r.x0 - 0.01 && o.x1 <= r.x1 + 0.01 && o.z0 >= r.z0 - 0.01 && o.z1 <= r.z1 + 0.01;

// ---- the schema, as far as it can be checked ----
if (!L.levels) problems.push('no `levels` table');
for (const r of rooms) {
  if (typeof r.y !== 'number' || !(r.h > 0)) problems.push(`${r.id}: needs a floor height y and a clear height h`);
  if (!['LL', '1', '2', '3'].includes(r.floor) && !(r.secret && r.floor === 'X')) problems.push(`${r.id}: floor is ${r.floor}`);
  if (!(r.x1 > r.x0 && r.z1 > r.z0)) problems.push(`${r.id}: no size`);
}
// Two rooms may lie one over the other, but not one inside the other.
for (let i = 0; i < rooms.length; i++) for (let j = i + 1; j < rooms.length; j++) {
  const a = rooms[i], b = rooms[j];
  if (a.x0 < b.x1 && a.x1 > b.x0 && a.z0 < b.z1 && a.z1 > b.z0 && a.y < b.y + b.h - 0.01 && b.y < a.y + a.h - 0.01) problems.push(`${a.id} and ${b.id} run into each other (${a.y}..${(a.y + a.h).toFixed(2)} and ${b.y}..${(b.y + b.h).toFixed(2)})`);
}
for (const d of decks) { const r = byId[d.room]; if (!r) problems.push(`deck ${d.id}: no room ${d.room}`); else { if (!insideRoom(d, r)) problems.push(`deck ${d.id}: sticks out of ${r.id}`); if (d.y <= r.y + 0.5 || d.y > r.y + r.h - 1) problems.push(`deck ${d.id}: at ${d.y}, not inside the height of ${r.id}`); } }

// ---- doorways ----
const unmet = [];                    // doorways into a room whose floor is not at the sill: a ramp must make up the difference
for (const [i, d] of doors.entries()) {
  const name = `door ${i} (${d.a} to ${d.b})`;
  if (typeof d.y !== 'number') { problems.push(`${name}: no y`); continue; }
  for (const id of [d.a, d.b]) {
    if (id === 'out') { if (!same(d.y, 0)) problems.push(`${name}: a way outdoors at ${d.y} m, not at the street`); link(T(i), OUT, 'door'); continue; }
    const r = byId[id];
    if (!r) { problems.push(`${name}: no room ${id}`); continue; }
    if (same(d.y, r.y)) { link(T(i), R(r), d.hidden ? 'hidden' : 'door'); continue; }
    // A storey up a tall room: a deck at the sill, against the wall the door is in.
    const cx = (d.x0 + d.x1) / 2, cz = (d.z0 + d.z1) / 2, px = d.along === 'x' ? (cx < (r.x0 + r.x1) / 2 ? r.x0 + 0.3 : r.x1 - 0.3) : cx, pz = d.along === 'z' ? (cz < (r.z0 + r.z1) / 2 ? r.z0 + 0.3 : r.z1 - 0.3) : cz;
    const k = decks.find(k => k.room === id && same(k.y, d.y) && px >= k.x0 && px <= k.x1 && pz >= k.z0 && pz <= k.z1);
    if (k) { link(T(i), D(k), 'door'); const [lo, hi, a, b] = d.along === 'x' ? [d.z0, d.z1, k.z0, k.z1] : [d.x0, d.x1, k.x0, k.x1]; if (lo < a - 0.01 || hi > b + 0.01) problems.push(`${name}: wider than the deck ${k.id} it opens onto`); }
    else unmet.push([i, name, r]);
  }
}

// ---- stairs and ramps ----
for (const q of ramps) {
  const run = q.axis === 'x' ? q.x1 - q.x0 : q.z1 - q.z0, rise = Math.abs(q.y1 - q.y0), cx = (q.x0 + q.x1) / 2, cz = (q.z0 + q.z1) / 2, e = 0.3;
  if (rise / run > 0.345) problems.push(`ramp ${q.id}: ${rise.toFixed(2)} m in ${run} m is steeper than one in three`);
  const lo = q.axis === 'x' ? standAt(q.x0 - e, cz, q.y0) : standAt(cx, q.z0 - e, q.y0), hi = q.axis === 'x' ? standAt(q.x1 + e, cz, q.y1) : standAt(cx, q.z1 + e, q.y1);
  if (!lo) problems.push(`ramp ${q.id}: nothing to drive onto at its low-coordinate end (${q.y0} m)`);
  if (!hi) problems.push(`ramp ${q.id}: nothing to drive onto at its high-coordinate end (${q.y1} m)`);
  link(lo, hi, q.stairs ? 'stair' : 'ramp');
  notes.push(`  ${q.stairs ? 'stair' : 'ramp '} ${q.id.padEnd(14)} ${rise.toFixed(1)} m in ${String(run).padStart(4)} m (1 in ${(run / rise).toFixed(1)})   ${lo} <-> ${hi}`);
}

// ---- lifts ----
for (const l of lifts) {
  const at = [];
  for (const y of l.stops) {
    const cx = (l.x0 + l.x1) / 2, cz = (l.z0 + l.z1) / 2, e = 0.3;
    const p = [standAt(l.x0 - e, cz, y), standAt(l.x1 + e, cz, y), standAt(cx, l.z0 - e, y), standAt(cx, l.z1 + e, y)].filter(Boolean);
    if (!p.length) problems.push(`lift ${l.id}: nothing to drive off onto at its stop at ${y} m`);
    at.push(...p);
  }
  for (const p of at) link(at[0], p, 'lift');
  notes.push(`  lift  ${l.id.padEnd(14)} stops at ${l.stops.join(', ')} m   ${[...new Set(at)].join(' <-> ')}`);
}

// ---- decks that touch are one floor ----
for (let i = 0; i < decks.length; i++) for (let j = i + 1; j < decks.length; j++) {
  const a = decks[i], b = decks[j];
  if (!same(a.y, b.y)) continue;
  const ox = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0), oz = Math.min(a.z1, b.z1) - Math.max(a.z0, b.z0);
  if ((ox >= -0.05 && oz > 0.5) || (oz >= -0.05 && ox > 0.5)) link(D(a), D(b), 'deck');
}

// A doorway into a room at another height is sound if a ramp starts at its threshold and ends on that room's floor.
for (const [i, name, r] of unmet) if (!(edges.get(T(i)) || []).some(([p, how]) => p === R(r) && how !== 'door')) problems.push(`${name}: opens into ${r.id} at ${doors[i].y} m, where its floor is at ${r.y} m, and there is neither a deck nor a ramp`);

// ---- walk it ----
const front = doors.filter(d => d.b === 'out' && d.along === 'x' && byId[d.a] && byId[d.a].x0 >= d.x1 - 0.01).sort((a, b) => a.x0 - b.x0)[0];
if (!front) problems.push('no front door: no doorway to outdoors that opens west');
function walk(start, outdoors, found = false) {
  const seen = new Set([start]), q = [start];
  while (q.length) for (const [n, how] of edges.get(q.shift()) || []) if (!seen.has(n) && (outdoors || n !== OUT) && (found || how !== 'hidden')) { seen.add(n); q.push(n); }
  return seen;
}
if (front) {
  const start = R(byId[front.a]), indoors = walk(start, false), all = walk(start, true);
  const places = [...rooms.map(R), ...decks.map(D)];
  const lost = places.filter(p => !isSecret(p) && !all.has(p)), across = places.filter(p => all.has(p) && !indoors.has(p));
  for (const p of lost) problems.push(`${p}: cannot be reached from the front door`);
  // What is secret: shut away until its doorway is found, all of it reached once it is, and that doorway the only way.
  const hidden = doors.filter(d => d.hidden), opened = walk(start, true, true), secrets = places.filter(isSecret);
  for (const p of secrets) { if (all.has(p)) problems.push(`${p}: is secret, but can be reached without finding the hidden doorway`); if (!opened.has(p)) problems.push(`${p}: cannot be reached even with the hidden doorway open`); }
  if (secrets.length && hidden.length !== 1) problems.push(`${hidden.length} hidden doorways: there should be exactly one`);
  for (const d of hidden) if (secretRooms.has(d.a) === secretRooms.has(d.b)) problems.push(`the hidden doorway (${d.a} to ${d.b}) should join one secret room to one that is not`);
  for (const [i, d] of doors.entries()) if (!d.hidden && d.b !== 'out' && secretRooms.has(d.a) !== secretRooms.has(d.b)) problems.push(`door ${i} (${d.a} to ${d.b}): joins a secret room to one that is not, and is not the hidden doorway`);
  for (const d of doors) if ((secretRooms.has(d.a) || secretRooms.has(d.b)) && !d.secret) problems.push(`a doorway of a secret room (${d.a} to ${d.b}) is not marked secret`);
  if (secrets.length) notes.push(`  secret: ${secretRooms.size} rooms and ${secrets.length - secretRooms.size} decks behind the hidden doorway (${hidden.map(d => d.b).join()}); none reached with it shut, all reached with it open`);
  console.log(`${rooms.length} rooms, ${doors.length} doorways, ${decks.length} decks, ${ramps.length} ramps, ${lifts.length} lifts; levels ${JSON.stringify(L.levels)}`);
  console.log(notes.join('\n'));
  for (const f of ['LL', '1', '2', '3', 'X']) { const here = rooms.filter(r => r.floor === f); console.log(`  level ${f.padEnd(2)}: ${here.length} rooms, ${here.filter(r => indoors.has(R(r))).length} reached from the front door without going outdoors, ${here.filter(r => all.has(R(r))).length} reached in all`); }
  console.log(`  decks: ${decks.filter(d => indoors.has(D(d))).length} of ${decks.length} reached`);
  if (across.length) console.log(`  reached only by going out across the snow: ${across.join(', ')}`);
}
// ---- the snow ----
// The snow is a sheet at street level, cut open only where plan.js groundOpenings() says the ground drops away. Any
// ground below the street that is not in that list would sit under snow, seen as solid ground you then fall through
// (the railway cutting, a stair to the lower level, a lift shaft). Only for the game's own layout, which buildPlan reads.
if (!process.argv[2]) {
  const { buildPlan, groundAt, groundOpenings, streetY, confine } = await import(new URL('../src/plan.js', import.meta.url));
  const P = buildPlan(), O = groundOpenings(P), B = P.bounds, lids = new Map();
  for (let x = B.x0; x <= B.x1; x += 1) for (let z = B.z0; z <= B.z1; z += 1) {
    // the snow's own height: Michigan Avenue and the streets climbing from it on the low side; the terrace level (0) beyond
    const ref = P.street && x < P.street.x + 12 ? streetY(P, x, z) : 0, g = groundAt(P, x, z, ref + 0.5);
    if (g < ref - 0.25 && !O.some(o => x > o.x0 - 0.3 && x < o.x1 + 0.3 && z > o.z0 - 0.3 && z < o.z1 + 0.3)) { const k = `${Math.round(x / 10) * 10},${Math.round(z / 10) * 10}`; lids.set(k, (lids.get(k) || 0) + 1); }
  }
  if (lids.size) problems.push(`ground below the street left under snow near (x,z): ${[...lids.keys()].slice(0, 12).join('  ')}. Add it to groundOpenings() in src/plan.js.`);
  else console.log('  snow: open over every way below the street');
  // The mice's nests (plan.js addNests): each a grille in a wall of its room, a run behind it and the nest, in a hollow outside
  // wall or in the earth. None may run into a room, nor be open to the street; the grille must open off its room's floor.
  const lap = (a, b, m = 0) => a.x0 < b.x1 - m && a.x1 > b.x0 + m && a.z0 < b.z1 - m && a.z1 > b.z0 + m;
  for (const n of P.nests || []) {
    const host = P.byId[n.room], parts = [n.mouth, n.duct, n.cham].filter(Boolean);
    for (const q of parts) for (const r of P.rooms) if (r !== host && lap(q, r, -0.02) && n.y < r.y + r.h && n.y + n.CH > r.y) problems.push(`${n.id}: runs into ${r.id}`);
    for (const q of [n.duct, n.cham].filter(Boolean)) {
      if (lap(q, host, 0.005)) problems.push(`${n.id}: its nest is inside ${host.id}`);
      if (n.y > -0.5) { for (const [x, z] of [[q.x0, q.z0], [q.x1, q.z1], [q.x0, q.z1], [q.x1, q.z0]]) if (!P.masses.some(m => x > m.x0 && x < m.x1 && z > m.z0 && z < m.z1 && m.top > n.y + n.CH)) problems.push(`${n.id}: open to the outside at (${x.toFixed(1)}, ${z.toFixed(1)})`); }
      else if (n.y + n.CH > -0.5 || O.some(o => lap(q, o))) problems.push(`${n.id}: not under the ground`);
    }
    if (!lap(n.mouth, host) || !lap(n.mouth, n.duct || n.cham) || (n.duct && !lap(n.duct, n.cham))) problems.push(`${n.id}: its way in does not join its room to its nest`);
  }
  if (P.nests) console.log(`  nests: ${P.nests.length} (${P.nests.map(n => n.wing + ' ' + n.room).join(', ')}), each in a wall, none in a room`);
  // The races found about the building (src/racecourses.js): each course laid as the game lays it, against the plan with
  // the start arches standing in it, then walked every 10 cm with the car's own probes (course.js checkCourse): never
  // pushed by a wall, a jamb or anything fixed, never a step up or a drop, and indoors always in a room or a doorway. The
  // rivals must be parked on clear floor and off the line. (Out of doors this is the plan's own ground; what the grounds'
  // features add there, the ballpark's wall say, the game lays its course round, and the browser test checks.)
  const { SPOTS, archOf } = await import(new URL('../src/racecourses.js', import.meta.url));
  const { layCourse, checkCourse } = await import(new URL('../src/course.js', import.meta.url));
  for (const S of SPOTS) P.obstacles.push(...archOf(S).solids);
  const laid = [];
  for (const S of SPOTS) {
    let c;
    try { c = layCourse(P, S); } catch (e) { problems.push(`race ${S.id}: ${e.message}`); continue; }
    const [sx, sz] = S.way[0], inside = P.rooms.some(r => Math.abs(r.y - S.fy) < 0.1 && sx > r.x0 && sx < r.x1 && sz > r.z0 && sz < r.z1);
    const bad = checkCourse(P, c, { inside });
    if (bad.length) problems.push(`race ${S.id}: the line leaves the floor or meets something at ${bad.length} points, the first ${JSON.stringify(bad[0])}`);
    const A = archOf(S);
    for (const [ax, bk] of S.park) {
      const x = A.x + A.rx * ax - A.fx * bk, z = A.z + A.rz * ax - A.fz * bk, q = { x, y: S.fy, z };
      const off = Math.min(...c.pts.map(t => Math.hypot(t.x - x, t.z - z)));
      if (off < 1.6) problems.push(`race ${S.id}: a rival is parked ${off.toFixed(2)} m from the line`);
      if (confine(P, q, 0.25, false, { x: 0, y: 0, z: 0 }) && Math.hypot(q.x - x, q.z - z) > 0.005) problems.push(`race ${S.id}: a rival is parked against something at (${x.toFixed(1)}, ${z.toFixed(1)})`);
    }
    laid.push(`${S.id} ${Math.round(c.length)} m${inside ? '' : ' outdoors'}`);
  }
  console.log(`  races: ${laid.length} of ${SPOTS.length} courses laid and walked clear (${laid.join(', ')}), the rivals parked off the line`);
}

if (problems.length) { console.log(`\nNOT SOUND: ${problems.length} problem${problems.length > 1 ? 's' : ''}`); for (const p of problems) console.log('  ' + p); process.exit(1); }
console.log('\nSound: every room and every deck can be driven to from the front door.');
