#!/usr/bin/env node
// Builds the floor plan from where the museum's galleries really are.
//
//   node tools/build_layout.mjs [cache.json]     writes src/layout.js
//
// (Behind a proxy: NODE_USE_ENV_PROXY=1 node tools/build_layout.mjs. With a cache file named, the
// records are read from it if it exists and saved to it if it does not.)
//
// The API gives every gallery a latitude, a longitude and a floor, but no outline. So each gallery
// starts as a small square on its true spot, on its true level, and grows until it meets its
// neighbours on that level, leaving a wall's thickness between them. Rooms that end up wall to wall
// on the same level get a doorway. Rooms on different levels never block or join one another: they
// are simply stacked.
//
// What the records cannot give is put in by hand, sized sensibly and no more than that: the Michigan
// Avenue lobby, the Grand Staircase as a two-storey stair hall with its flights and the gallery round
// its well, Griffin Court as a three-storey street with its stair, bridges and lift, the passage the
// Thorne Miniature Rooms line, and the ways down to the lower level. Where a room is still cut off
// on its level a plain passage is run to its nearest neighbour.
//
// This is an interim plan. Room outlines traced from the architects' drawings are to replace the
// grown rectangles; the schema written here (levels, y on rooms and doors, decks, ramps, lifts) is
// the one they will be written in.

import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const AGENT = 'Sorry, the Museum is Closed (hobby browser game; cfreder2@nd.edu)';
const get = async u => { const r = await fetch(u, { headers: { 'User-Agent': AGENT, 'AIC-User-Agent': AGENT } }); if (!r.ok) throw new Error(r.status + ' ' + u); return r.json(); };
const T = 1, GRID = 0.5;
const snap = v => Math.round(v / GRID) * GRID;

// Floor elevations, metres above the street, from the architect's section. This is the one place
// they are written down. Everything else carries its own y.
const LEVELS = { LL: -4.6, '1': 0, '2': 5.2, '3': 11.3 };
const ORDER = ['LL', '1', '2', '3'];
const SLAB = 0.5;                                              // floor to the ceiling below
const CLEAR = { LL: 4.0, '1': 6.5, '2': 7.5, '3': 7.4 };       // clear height where nothing is overhead
const above = f => { const i = ORDER.indexOf(f); return i < ORDER.length - 1 ? LEVELS[ORDER[i + 1]] : Infinity; };

// ---- 1. the museum's own records ------------------------------------------

const cache = process.argv[2];
let all, counts;
if (cache && existsSync(cache)) ({ all, rows: counts } = JSON.parse(readFileSync(cache, 'utf8')));
else {
  all = [];
  for (let page = 1; ; page++) {
    const j = await get(`https://api.artic.edu/api/v1/galleries?limit=100&page=${page}`);
    all.push(...j.data);
    if (page >= j.pagination.total_pages) break;
    await new Promise(r => setTimeout(r, 300));
  }
  const q = { query: { bool: { must: [{ term: { is_public_domain: true } }, { term: { is_on_view: true } }, { exists: { field: 'image_id' } }] } }, limit: 0, aggs: { g: { terms: { field: 'gallery_id', size: 300 } } } };
  const agg = await get('https://api.artic.edu/api/v1/artworks/search?params=' + encodeURIComponent(JSON.stringify(q)));
  counts = agg.aggregations.g.buckets.map(b => ({ id: b.key, n: b.doc_count }));
  if (cache) writeFileSync(cache, JSON.stringify({ all, rows: counts }));
}
const nById = Object.fromEntries(counts.map(c => [c.id, c.n]));
const src = all.filter(g => g.latitude && g.longitude && nById[g.id]);
const lat0 = Math.min(...src.map(g => +g.latitude)), lon0 = Math.min(...src.map(g => +g.longitude));
const north = g => (+g.latitude - lat0) * 110950, east = g => (+g.longitude - lon0) * 111320 * Math.cos(41.879 * Math.PI / 180);
const NMAX = Math.max(...src.map(north));

// ---- 2. every gallery on its own spot, on its own level ---------------------

const num = g => (g.title || '').replace(/^Galler(y|ies) /, '');
// Which building a room belongs to only decides what its outside wall is made of.
function building(g) {
  const n = num(g);
  if (g.floor === '3' || /^(18|28)\d$/.test(n)) return 'modern';
  if (g.floor === 'LL') return 'lower';
  if (/^(101A?|10[2-8]|13[0-4]|14[0-2])$/.test(n) || /Fullerton|Franke/.test(g.title)) return 'first';
  return 'main';
}
let rooms = src.map(g => {
  const n = num(g);
  return { id: 'G' + n.replace(/\W+/g, '_').slice(0, 14), gallery: g.title, floor: g.floor, building: building(g), n: nById[g.id],
    y: LEVELS[g.floor], cx: east(g) + 20, cz: NMAX - north(g) + 20 };
}).filter(r => r.gallery !== 'Gallery 11' && r.gallery !== 'Gallery 200');           // the Thorne rooms get their passage and the Grand Staircase its hall, below

// ---- 3. rooms the records cannot give us -----------------------------------
//
// `top` is how high a room stands for the purpose of keeping others out of it: a tall room keeps
// its footprint clear on every level it rises through.

const AX = 110;                                    // the axis of the front door and the Grand Staircase (Adams Street)
const fixed = [
  // Inside the Michigan Avenue doors.
  { id: 'lobby', gallery: 'Michigan Avenue Lobby', building: 'main', floor: '1', x0: 20, x1: 36.5, z0: AX - 6.5, z1: AX + 6.5, h: LEVELS['2'] - SLAB - 0.1 },
  // Gallery 200, the Grand Staircase: one hall from the first floor to the skylight over the second.
  { id: 'G200', gallery: 'Gallery 200', building: 'main', floor: '1', x0: 37.5, x1: 60, z0: AX - 17.5, z1: AX + 17.5, h: LEVELS['2'] + CLEAR['2'] },
  // Griffin Court: the Modern Wing's long skylit street, three storeys to the spring of its glass roof, running north to a wall of glass.
  { id: 'hall', gallery: 'Griffin Court', kind: 'hall', building: 'modern', floor: '1', x0: 168, x1: 182, z0: 2, z1: 70, glass: 'n', h: 18 },
  // Under the Grand Staircase, where its lower flight comes down.
  { id: 'LL200', gallery: 'Lower Level', building: 'lower', floor: 'LL', x0: 40, x1: 59.5, z0: AX + 6, z1: AX + 17, h: CLEAR.LL },
  // Gallery 11: the Thorne Miniature Rooms, in a long dark passage as they really are.
  { id: 'C', gallery: 'Gallery 11', kind: 'corridor', building: 'lower', floor: 'LL', x0: 60.5, x1: 66.5, z0: AX - 40, z1: AX + 22, h: 3.4 },
];
for (const f of fixed) { f.y = LEVELS[f.floor]; f.fixed = true; f.top = f.y + f.h; }
const byId = {};
const G200 = fixed[1], HALL = fixed[2];

const decks = [], ramps = [], lifts = [];
const deck = (id, room, x0, x1, z0, z1, y, rails = [], thick = 0.4) => decks.push({ id, room, x0, x1, z0, z1, y, thick, rails });
const ramp = (id, room, x0, x1, z0, z1, axis, y0, y1, stairs = true) => ramps.push({ id, room, x0, x1, z0, z1, axis, y0, y1, stairs });

// The Grand Staircase. In from the lobby on the west; a wide flight straight ahead up to a landing
// against the east wall; two flights back, left and right, up to the gallery that runs round the
// well on the second floor. And one more flight, along the south side, down to the lower level.
{
  const r = G200, L2 = LEVELS['2'], mid = L2 / 2, fx0 = r.x0 + 5.5, fx1 = r.x1 - 6;       // the flights run from fx0 to fx1
  ramp('G200-up', r.id, fx0, fx1, AX - 3, AX + 3, 'x', 0, mid);
  deck('G200-landing', r.id, fx1, r.x1, AX - 9, AX + 9, mid, ['w', 'n', 's']);
  ramp('G200-north', r.id, fx0, fx1, AX - 9, AX - 4.5, 'x', L2, mid);
  ramp('G200-south', r.id, fx0, fx1, AX + 4.5, AX + 9, 'x', L2, mid);
  deck('G200-west', r.id, r.x0, fx0, r.z0, r.z1, L2, ['e']);
  deck('G200-north-side', r.id, fx0, r.x1, r.z0, r.z0 + 5.5, L2, ['s']);
  deck('G200-south-side', r.id, fx0, r.x1, r.z1 - 5.5, r.z1, L2, ['n']);
  deck('G200-east', r.id, r.x1 - 4.5, r.x1, r.z0 + 5.5, r.z1 - 5.5, L2, ['w']);
  ramp('G200-down', r.id, fx0 + 1, fx0 + 15, AX + 9.5, AX + 12.5, 'x', 0, LEVELS.LL);
}
// Griffin Court. A stair up the west side from the glass end to the second floor, whose gallery runs
// on south along the wall; a second flight back north beside it to the third, where a bridge crosses
// to the gallery along the east side; and a lift in the middle that stops at all three.
{
  const r = HALL, L2 = LEVELS['2'], L3 = LEVELS['3'], a = r.x0, b = a + 3.5, c = b + 3.5, d = c + 2.6;
  ramp('hall-up', r.id, a, b, r.z0 + 4, r.z0 + 24, 'z', 0, L2);
  deck('hall-west-2', r.id, a, b, r.z0 + 24, r.z1, L2, ['e']);
  deck('hall-turn-2', r.id, b, c, r.z0 + 43, r.z0 + 46, L2, ['n', 's', 'e']);
  ramp('hall-up-3', r.id, b, c, r.z0 + 24, r.z0 + 43, 'z', L3, L2);
  deck('hall-bridge-3', r.id, b, r.x1, r.z0 + 19, r.z0 + 24, L3, ['n', 's', 'w']);
  deck('hall-east-3', r.id, r.x1 - 3.5, r.x1, r.z0 + 8, r.z0 + 19, L3, ['w', 'n']);
  deck('hall-east-3s', r.id, r.x1 - 3.5, r.x1, r.z0 + 24, r.z0 + 34, L3, ['w', 's']);
  deck('hall-lift-3', r.id, c, d, r.z0 + 24, r.z0 + 43, L3, ['w', 'e']);
  lifts.push({ id: 'hall-lift', room: r.id, x0: c, x1: d, z0: r.z0 + 43, z1: r.z0 + 46, stops: [0, L2, L3] });
}

const band = r => [r.y, r.fixed ? r.top : above(r.floor)];
const shares = (a, b) => { const p = band(a), q = band(b); return p[0] < q[1] - 0.01 && q[0] < p[1] - 0.01; };      // do these two stand in each other's way?

// A gallery whose point falls inside one of those is moved to its nearest edge.
for (const r of rooms) for (const f of fixed) {
  if (!shares(r, f)) continue;
  const m = 2 + T, l = r.cx - (f.x0 - m), rr = (f.x1 + m) - r.cx, n = r.cz - (f.z0 - m), s = (f.z1 + m) - r.cz, k = Math.min(l, rr, n, s);
  if (k <= 0) continue;
  if (k === l) r.cx -= l; else if (k === rr) r.cx += rr; else if (k === n) r.cz -= n; else r.cz += s;
}
// Push apart any two on the same level that the records put almost on top of each other.
for (let pass = 0; pass < 60; pass++) for (const a of rooms) for (const b of rooms) {
  if (a === b || !shares(a, b)) continue;
  const dx = b.cx - a.cx, dz = b.cz - a.cz, d = Math.hypot(dx, dz) || 0.01;
  if (d < 6.6) { const k = (6.6 - d) / 2 / d; a.cx -= dx * k; a.cz -= dz * k; b.cx += dx * k; b.cz += dz * k; }
}
for (const r of rooms) {
  const m = Math.max(5, Math.min(12.5, 4.5 + Math.sqrt(r.n) * 0.85));
  r.max = [m, m];
  r.cx = snap(r.cx); r.cz = snap(r.cz);
  r.x0 = r.cx - 2; r.x1 = r.cx + 2; r.z0 = r.cz - 2; r.z1 = r.cz + 2;
}
rooms.push(...fixed);

// ---- 4. grow, level by level ------------------------------------------------

const clear = (r, x0, x1, z0, z1, m = T) => rooms.every(o => o === r || !shares(r, o) || x1 + m <= o.x0 || x0 - m >= o.x1 || z1 + m <= o.z0 || z0 - m >= o.z1);
for (let round = 0; round < 80; round++) {
  let grew = false;
  for (const r of rooms) {
    if (!r.max) continue;
    const tries = [['x0', -GRID], ['x1', GRID], ['z0', -GRID], ['z1', GRID]];
    for (const [side, d] of tries) {
      const n = { x0: r.x0, x1: r.x1, z0: r.z0, z1: r.z1 }; n[side] += d;
      if (n.x1 - n.x0 > r.max[0] * 2 || n.z1 - n.z0 > r.max[1] * 2) continue;
      // No room is allowed to become a corridor by accident.
      if ((n.x1 - n.x0) > (n.z1 - n.z0) * 2.4 || (n.z1 - n.z0) > (n.x1 - n.x0) * 2.4) continue;
      if (!clear(r, n.x0, n.x1, n.z0, n.z1)) continue;
      r[side] = n[side]; grew = true;
    }
  }
  if (!grew) break;
}
// A room's clear height is its own. Under another room it stops a slab's thickness short of that room's floor.
const over = (a, b, m = T) => a.x0 < b.x1 + m && a.x1 > b.x0 - m && a.z0 < b.z1 + m && a.z1 > b.z0 - m;
function headroom(r) {
  let h = r.gallery === 'Gallery 239' ? 9.5 : CLEAR[r.floor];
  if (r.y < 0) h = Math.min(h, -r.y - SLAB - 0.1);                                   // the ground is overhead
  for (const o of rooms) if (o !== r && o.y > r.y + 0.5 && over(r, o)) h = Math.min(h, o.y - r.y - SLAB);
  return h;
}
for (const r of rooms) if (!r.fixed) { r.h = headroom(r); r.top = r.y + r.h; }
for (const r of rooms) byId[r.id] = r;

// ---- 5. doorways -------------------------------------------------------------
//
// A doorway joins two rooms whose floors are level there. Into a tall room from an upper floor that
// means onto one of its decks: the doorway can only be where a deck at that height meets the wall.

const doors = [];
const same = (a, b) => Math.abs(a - b) < 0.02;
// The stretches of a room's walls that a doorway at height y could be cut in.
function faces(r, y) {
  const full = [{ s: 'w', at: r.x0, lo: r.z0, hi: r.z1 }, { s: 'e', at: r.x1, lo: r.z0, hi: r.z1 }, { s: 'n', at: r.z0, lo: r.x0, hi: r.x1 }, { s: 's', at: r.z1, lo: r.x0, hi: r.x1 }];
  if (same(y, r.y)) return full;
  const out = [];
  for (const d of decks) {
    if (d.room !== r.id || !same(d.y, y)) continue;
    if (d.x0 <= r.x0 + 0.01) out.push({ s: 'w', at: r.x0, lo: d.z0, hi: d.z1 });
    if (d.x1 >= r.x1 - 0.01) out.push({ s: 'e', at: r.x1, lo: d.z0, hi: d.z1 });
    if (d.z0 <= r.z0 + 0.01) out.push({ s: 'n', at: r.z0, lo: d.x0, hi: d.x1 });
    if (d.z1 >= r.z1 - 0.01) out.push({ s: 's', at: r.z1, lo: d.x0, hi: d.x1 });
  }
  return out;
}
// The height two rooms could meet at, if any: the same floor, or the upper one's floor where the other is tall enough to have a deck there.
const meet = (a, b) => same(a.y, b.y) ? a.y : a.fixed && a.y < b.y && a.top > b.y + 2.5 ? b.y : b.fixed && b.y < a.y && b.top > a.y + 2.5 ? a.y : null;
// How high a doorway can be: under the lower of the two ceilings, and under any deck that crosses in front of it.
function doorHeight(d, a, b) {
  let h = Math.min(4.2, Math.min(a.top, b.top) - d.y - 0.7);
  for (const k of decks) if ((k.room === a.id || k.room === b.id) && k.y > d.y + 1 && k.x0 < d.x1 + 1.5 && k.x1 > d.x0 - 1.5 && k.z0 < d.z1 + 1.5 && k.z1 > d.z0 - 1.5) h = Math.min(h, k.y - k.thick - d.y - 0.1);
  return Math.round(h * 100) / 100;
}
function join(a, b, y, maxGap = 3.01) {
  let made = false;
  for (const fa of faces(a, y)) for (const fb of faces(b, y)) {
    // b lies beyond a in the + direction
    if (!((fa.s === 'e' && fb.s === 'w') || (fa.s === 's' && fb.s === 'n'))) continue;
    const gap = fb.at - fa.at;
    if (gap < 0.19 || gap > maxGap) continue;
    const lo = Math.max(fa.lo, fb.lo), hi = Math.min(fa.hi, fb.hi);
    if (hi - lo < 3.2) continue;
    // Wide doorways: a toy car arrives at them fast.
    const low = Math.min(a.top, b.top) - y, w = Math.min(low < 4 ? 2.6 : 4, hi - lo - 1), c = snap((lo + hi) / 2);
    const d = fa.s === 'e' ? { a: a.id, b: b.id, along: 'x', x0: fa.at, x1: fb.at, z0: c - w / 2, z1: c + w / 2, y } : { a: a.id, b: b.id, along: 'z', x0: c - w / 2, x1: c + w / 2, z0: fa.at, z1: fb.at, y };
    d.h = doorHeight(d, a, b);
    if (d.h < 1.2) continue;
    doors.push(d); made = true;
  }
  return made;
}
const pair = (a, b) => { const y = meet(a, b); if (y == null) return false; const p = join(a, b, y), q = join(b, a, y); return p || q; };
for (let i = 0; i < rooms.length; i++) for (let j = i + 1; j < rooms.length; j++) pair(rooms[i], rooms[j]);

// ---- 6. the ways between levels, and nobody left cut off --------------------

// Which rooms can be got to from which, indoors: through doorways, and up or down any ramp or lift
// (those are put in a tall room that every level opens onto, or run from one room down into the one below).
const links = [];                                   // pairs of room ids joined by a ramp or a lift
function groups() {
  const g = Object.fromEntries(rooms.map(r => [r.id, r.id]));
  const find = x => (g[x] === x ? x : (g[x] = find(g[x])));
  for (const d of doors) if (d.b !== 'out') g[find(d.a)] = find(d.b);
  for (const [a, b] of links) g[find(a)] = find(b);
  return r => find(r.id);
}
links.push(['G200', 'LL200']);                      // the flight down

// A plain passage from a room that is cut off to the nearest room on its level that is not.
let passages = 0;
function passage(of, home) {
  let best = null;
  for (const a of rooms) for (const b of rooms) {
    if (of(a) === home || of(b) !== home || a === b) continue;
    const y = meet(a, b);
    if (y == null) continue;
    for (const [p, q] of [[a, b], [b, a]]) for (const fp of faces(p, y)) for (const fq of faces(q, y)) {
      if (!((fp.s === 'e' && fq.s === 'w') || (fp.s === 's' && fq.s === 'n'))) continue;
      const gap = fq.at - fp.at, lo = Math.max(fp.lo, fq.lo), hi = Math.min(fp.hi, fq.hi);
      if (gap <= 3.01 || gap > 60 || hi - lo < 3) continue;
      const w = Math.min(4, hi - lo), c = snap((lo + hi) / 2);
      const k = fp.s === 'e' ? { x0: fp.at + T, x1: fq.at - T, z0: c - w / 2, z1: c + w / 2 } : { x0: c - w / 2, x1: c + w / 2, z0: fp.at + T, z1: fq.at - T };
      Object.assign(k, { y, floor: (same(y, p.y) ? p : q).floor, fixed: true, top: y + 4.2 });
      if (!rooms.every(o => o === p || o === q || !shares(k, o) || !over(k, o, T - 0.01))) continue;
      if (!best || gap < best.gap) best = { gap, k, p, q, y };
    }
  }
  if (!best) return false;
  const { k, p, q, y } = best;
  Object.assign(k, { id: 'K' + (++passages), gallery: 'Passage', kind: 'gallery', building: p.building === q.building ? p.building : 'main', passage: true });
  k.h = Math.min(4.2, headroom(k)); k.top = y + k.h;
  rooms.push(k); byId[k.id] = k;
  join(p, k, y); join(k, q, y);
  return true;
}
// Start from the Grand Staircase and keep joining things to it until nothing more can be joined.
for (let n = 0; n < 60; n++) {
  const of = groups(), home = of(G200);
  if (rooms.every(r => of(r) === home) || !passage(of, home)) break;
}

// A flight of stairs from a first-floor room down into a lower-level room beneath it, and a lift.
// The flight lies along a wall of the lower room; its head must come up inside one room above.
const inside = (r, x0, x1, z0, z1, m = 0) => r && x0 >= r.x0 + m && x1 <= r.x1 - m && z0 >= r.z0 + m && z1 <= r.z1 - m;
const doorsNear = (x0, x1, z0, z1, m = 2.2) => doors.some(d => d.x0 < x1 + m && d.x1 > x0 - m && d.z0 < z1 + m && d.z1 > z0 - m);
function flightDown(b) {
  const rise = -b.y, run = Math.ceil(rise * 3 * 2) / 2, w = 3, head = 6, before = 2;
  for (const a of rooms.filter(r => same(r.y, 0) && over(r, b, -3)).sort((p, q) => (q.x1 - q.x0) * (q.z1 - q.z0) - (p.x1 - p.x0) * (p.z1 - p.z0))) {
    for (const axis of ['x', 'z']) for (const dir of [1, -1]) {
      const [lo, hi, c0, c1, a0, a1] = axis === 'x' ? [b.x0, b.x1, b.z0, b.z1, a.z0, a.z1] : [b.z0, b.z1, b.x0, b.x1, a.x0, a.x1];
      // Against a wall of the room above for choice, then of the room below, then wherever it fits.
      const across = [a0, a1 - w, c0, c1 - w];                       // (hard against it: no gap behind a stair for a car to wedge itself into)
      for (let c = c0; c + w <= c1; c += GRID) across.push(c);
      for (const c of across) for (let u = lo + (dir > 0 ? 0 : 2.5); u + run <= hi - (dir > 0 ? 2.5 : 0) + 0.01; u += GRID) {
        // The head of the flight is at u when it runs down in the + direction, and at u + run when it does not.
        const top = dir > 0 ? u : u + run, h0 = dir > 0 ? top - before : top - head, h1 = dir > 0 ? top + head : top + before;
        const rect = (p, q, r, s) => axis === 'x' ? [p, q, r, s] : [r, s, p, q];
        const [x0, x1, z0, z1] = rect(u, u + run, c, c + w);
        const flush = c - a0 < 0.01 || a1 - (c + w) < 0.01, side = flush ? 0 : 1.7;
        if (!inside(b, x0, x1, z0, z1) || !inside(a, ...rect(h0 + 0.1, h1 - 0.1, Math.max(a0, c - side), Math.min(a1, c + w + side))) || (!flush && (c - side < a0 || c + w + side > a1))) continue;      // the well, and floor to drive onto it from
        if (doorsNear(x0, x1, z0, z1) || ramps.some(q => over({ x0, x1, z0, z1 }, q, 1))) continue;
        ramp(`${a.id}-down`, a.id, x0, x1, z0, z1, axis, dir > 0 ? 0 : b.y, dir > 0 ? b.y : 0);
        links.push([a.id, b.id]);
        return a;
      }
    }
  }
  return null;
}
function liftDown(b) {
  const w = 2.6;
  for (const a of rooms.filter(r => same(r.y, 0) && over(r, b, -3))) {
    const x0 = Math.max(a.x0, b.x0), x1 = Math.min(a.x1, b.x1), z0 = Math.max(a.z0, b.z0), z1 = Math.min(a.z1, b.z1);
    for (let x = x0 + 1; x + w <= x1 - 1; x += GRID) for (let z = z0 + 1; z + w <= z1 - 1; z += GRID) {
      if (doorsNear(x, x + w, z, z + w, 3) || ramps.some(q => over({ x0: x, x1: x + w, z0: z, z1: z + w }, q, 2.5))) continue;
      lifts.push({ id: `${a.id}-lift`, room: a.id, x0: x, x1: x + w, z0: z, z1: z + w, stops: [b.y, 0] });
      links.push([a.id, b.id]);
      return a;
    }
  }
  return null;
}
{
  // Each cut-off part of the lower level gets a flight down to it; the biggest room of the first gets the lift as well.
  let lifted = false;
  for (let n = 0; n < 8; n++) {
    const of = groups(), home = of(G200);
    const cut = rooms.filter(r => r.y < 0 && of(r) !== home).sort((p, q) => (q.x1 - q.x0) * (q.z1 - q.z0) - (p.x1 - p.x0) * (p.z1 - p.z0));
    if (!cut.length) break;
    const b = cut.find(flightDown);
    if (!b) break;
    if (!lifted) lifted = !!cut.find(liftDown);
  }
}

// Ways in from outside, on the ground floor only. Named ones first; then every group of rooms that is
// still cut off indoors gets a door on whichever of its walls has open ground beyond.
// A building is solid from the street to its roof, so "open ground" means clear of every room on any floor above ground.
const sideFree = (r, side, depth = 4) => {
  const [x0, x1, z0, z1] = side === 'w' ? [r.x0 - T - depth, r.x0 - T, r.z0, r.z1] : side === 'e' ? [r.x1 + T, r.x1 + T + depth, r.z0, r.z1]
    : side === 'n' ? [r.x0, r.x1, r.z0 - T - depth, r.z0 - T] : [r.x0, r.x1, r.z1 + T, r.z1 + T + depth];
  return rooms.every(o => o === r || o.top <= 0 || x1 <= o.x0 - T || x0 >= o.x1 + T || z1 <= o.z0 - T || z0 >= o.z1 + T);
};
function outside(id, side, w = 4, force = false) {
  const r = byId[id];
  if (!r || !same(r.y, 0) || doors.some(d => d.a === id && d.b === 'out' && d.side === side)) return false;
  if (!force && !sideFree(r, side)) return false;
  const h = Math.min(4.2, r.h - 0.7), cx = snap((r.x0 + r.x1) / 2), cz = snap((r.z0 + r.z1) / 2);
  w = Math.min(w, (side === 'w' || side === 'e' ? r.z1 - r.z0 : r.x1 - r.x0) - 1);
  doors.push(side === 'w' ? { a: id, b: 'out', side, along: 'x', x0: r.x0 - T, x1: r.x0, z0: cz - w / 2, z1: cz + w / 2, y: 0, h }
    : side === 'e' ? { a: id, b: 'out', side, along: 'x', x0: r.x1, x1: r.x1 + T, z0: cz - w / 2, z1: cz + w / 2, y: 0, h }
    : side === 'n' ? { a: id, b: 'out', side, along: 'z', x0: cx - w / 2, x1: cx + w / 2, z0: r.z0 - T, z1: r.z0, y: 0, h }
    : { a: id, b: 'out', side, along: 'z', x0: cx - w / 2, x1: cx + w / 2, z0: r.z1, z1: r.z1 + T, y: 0, h });
  return true;
}
// The Michigan Avenue front door, on the axis of Adams Street where the real one is, opening into the
// lobby and straight on to the Grand Staircase. Then the court, the hall's south end, and the far ends of each arm.
if (!outside('lobby', 'w', 4, true)) throw new Error('the front door has nowhere to go');
{ const d = doors[doors.length - 1]; d.h = Math.min(d.h, byId.lobby.h - 1.7); }      // low enough to leave wall over it for the fanlight, which is the drone's way in
for (const [id, side] of [['hall', 's'], ['G150', 'e'], ['G151', 's'], ['G152', 'w'], ['G153', 'n'], ['G154', 'n'], ['G161', 's'], ['G184', 's'], ['G182', 'w'], ['G134', 's'], ['G142', 'e']]) outside(id, side);
{
  const of = groups(), home = of(G200);
  for (const r of rooms.filter(q => same(q.y, 0)).sort((a, b) => (b.x1 - b.x0) * (b.z1 - b.z0) - (a.x1 - a.x0) * (a.z1 - a.z0))) {
    if (of(r) === home || rooms.some(m => of(m) === of(r) && doors.some(d => d.a === m.id && d.b === 'out'))) continue;
    for (const side of ['s', 'w', 'e', 'n']) if (outside(r.id, side)) break;
  }
  // And a few more, so that once the building is open there are ways in and out all round it: the biggest
  // ground-floor rooms that still have a wall on open ground and no outside door.
  const count = () => doors.filter(d => d.b === 'out').length;
  for (const r of rooms.filter(q => same(q.y, 0) && !q.passage && !q.fixed).sort((a, b) => (b.x1 - b.x0) * (b.z1 - b.z0) - (a.x1 - a.x0) * (a.z1 - a.z0))) {
    if (count() >= 14) break;
    if (doors.some(d => d.a === r.id && d.b === 'out')) continue;
    for (const side of ['s', 'e', 'w', 'n']) if (outside(r.id, side)) break;
  }
}

// ---- 7. write it down ------------------------------------------------------

const r2 = v => Math.round(v * 100) / 100;
const out = {
  made: new Date().toISOString().slice(0, 10),
  levels: LEVELS,
  rooms: rooms.map(r => ({ id: r.id, gallery: r.gallery, floor: r.floor, building: r.building, kind: r.kind || 'gallery', x0: r.x0, x1: r.x1, z0: r.z0, z1: r.z1, y: r.y, h: r2(r.h), ...(r.glass ? { glass: r.glass } : {}), ...(r.passage ? { passage: true } : {}) })),
  doors: doors.map(({ side, ...d }) => d),
  decks, ramps: ramps.map(q => ({ ...q, y0: r2(q.y0), y1: r2(q.y1) })), lifts,
};
const file = fileURLToPath(new URL('../src/layout.js', import.meta.url));
const lines = s => JSON.stringify(s).replace(/\{"id"/g, '\n  {"id"').replace(/\{"a"/g, '\n  {"a"');
writeFileSync(file, `// Generated by tools/build_layout.mjs on ${out.made} from the gallery records at\n// api.artic.edu/api/v1/galleries. Do not edit by hand: change the tool and run it again.\n\nexport default ${lines(out)};\n`);

// A picture of each level for the terminal.
const X1 = Math.max(...rooms.map(r => r.x1)) + 4, Z1 = Math.max(...rooms.map(r => r.z1)) + 4, sx = 2.2, sz = 4.4;
for (const f of ORDER) {
  const y = LEVELS[f], here = rooms.filter(r => r.y <= y + 0.01 && r.top > y + 2.5);
  const grid = Array.from({ length: Math.ceil(Z1 / sz) + 1 }, () => Array(Math.ceil(X1 / sx) + 1).fill(' '));
  for (const r of here) {
    for (let z = r.z0; z < r.z1; z += sz / 2) for (let x = r.x0; x < r.x1; x += sx / 2) grid[Math.floor(z / sz)][Math.floor(x / sx)] = same(r.y, y) ? '·' : ':';
    const label = r.id.replace(/^G/, '');
    [...label].forEach((ch, i) => { const gx = Math.floor((r.x0 + 0.6) / sx) + i, gz = Math.floor((r.z0 + r.z1) / 2 / sz); if (gx < Math.floor(r.x1 / sx) + 1) grid[gz][gx] = ch; });
  }
  for (const d of doors) if (same(d.y, y)) grid[Math.floor((d.z0 + d.z1) / 2 / sz)][Math.floor((d.x0 + d.x1) / 2 / sx)] = d.b === 'out' ? 'O' : '+';
  for (const q of ramps) if (Math.max(q.y0, q.y1) >= y - 0.01 && Math.min(q.y0, q.y1) <= y + 0.01) grid[Math.floor((q.z0 + q.z1) / 2 / sz)][Math.floor((q.x0 + q.x1) / 2 / sx)] = Math.min(q.y0, q.y1) < y - 0.01 ? 'v' : '^';
  for (const l of lifts) if (l.stops.some(s => same(s, y))) grid[Math.floor((l.z0 + l.z1) / 2 / sz)][Math.floor((l.x0 + l.x1) / 2 / sx)] = '#';
  console.log(`\n==== level ${f} (floor at ${y} m) ====   + door  O door to outside  ^ stair up  v stair down  # lift  : a tall room rising through`);
  console.log(grid.map(r => r.join('').replace(/\s+$/, '')).filter((l, i, a) => l || a[i - 1]).join('\n'));
}
const of = groups(), home = of(G200), groupsOut = {};
for (const r of rooms) (groupsOut[of(r)] = groupsOut[of(r)] || []).push(r.id.replace(/^G/, ''));
console.log(`\n${rooms.length} rooms (${passages} of them passages), ${doors.filter(d => d.b !== 'out').length} doors between rooms, ${doors.filter(d => d.b === 'out').length} doors to outside, ${decks.length} decks, ${ramps.length} ramps, ${lifts.length} lifts`);
console.log(`joined indoors to the Grand Staircase: ${groupsOut[home].length} rooms`);
for (const [k, g] of Object.entries(groupsOut)) if (k !== home) console.log('  apart, reached across the snow: ' + g.join(' '));
console.log('ramps', ramps.map(q => `${q.id} ${Math.abs(q.y1 - q.y0).toFixed(1)} m in ${(q.axis === 'x' ? q.x1 - q.x0 : q.z1 - q.z0)} m`).join('; '));
