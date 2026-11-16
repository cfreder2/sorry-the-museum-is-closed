#!/usr/bin/env node
// Builds the floor plan from where the museum's galleries really are.
//
//   node tools/build_layout.mjs          writes src/layout.js
//
// The API gives every gallery a latitude, a longitude and a floor, but no
// outline. So each gallery starts as a small square on its true spot and grows
// until it meets its neighbours, leaving a wall's thickness between them. Rooms
// that end up wall to wall get a doorway.
//
// The game has one level, so the building is unfolded. The second floor, where
// nearly all the paintings are, stays exactly where it is. First-floor and
// lower-level galleries that sit directly under second-floor ones are moved
// out as pavilions of their own; the rest stay put. Nothing else is invented
// except the two rooms the API has no art in and so no record of worth using:
// Griffin Court, and the passage the Thorne Miniature Rooms line.

import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const AGENT = 'after-hours (hobby browser game; cfreder2@nd.edu)';
const get = async u => { const r = await fetch(u, { headers: { 'User-Agent': AGENT, 'AIC-User-Agent': AGENT } }); if (!r.ok) throw new Error(r.status + ' ' + u); return r.json(); };
const T = 1, GRID = 0.5;
const snap = v => Math.round(v / GRID) * GRID;

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
}
const nById = Object.fromEntries(counts.map(c => [c.id, c.n]));
const src = all.filter(g => g.latitude && g.longitude && nById[g.id]);
const lat0 = Math.min(...src.map(g => +g.latitude)), lon0 = Math.min(...src.map(g => +g.longitude));
const north = g => (+g.latitude - lat0) * 110950, east = g => (+g.longitude - lon0) * 111320 * Math.cos(41.879 * Math.PI / 180);
const NMAX = Math.max(...src.map(north));

// ---- 2. unfolding ----------------------------------------------------------

const num = g => (g.title || '').replace(/^Galler(y|ies) /, '');
const WEST_UNDER = /^(101A?|10[2-8]|13[0-4]|14[0-2])$/;      // first-floor rooms under the second floor
function building(g) {
  const n = num(g);
  if (g.floor === '2') return n === '285' ? 'modern' : 'main';
  if (g.floor === '3') return 'modern';
  if (g.floor === 'LL') return 'lower';
  if (WEST_UNDER.test(n) || /Fullerton|Franke/.test(g.title)) return 'first';
  if (/^18\d$/.test(n)) return 'modern';
  return 'main';                    // first-floor rooms with nothing above them: McKinlock Court and the American wing
}
const SHIFT = { main: [0, 0], modern: [0, 0], first: [62, 84], lower: [-138, 66] };
const NUDGE = { '285': [30, 0], '237': [-6.5, 0], '238': [6.5, 0] };

let rooms = src.map(g => {
  const b = building(g), n = num(g), s = SHIFT[b], d = NUDGE[n] || [0, 0];
  return { id: 'G' + n.replace(/\W+/g, '_').slice(0, 14), gallery: g.title, floor: g.floor, building: b, n: nById[g.id],
    cx: east(g) + s[0] + d[0] + 20, cz: NMAX - north(g) + s[1] + d[1] + 20 };
}).filter(r => r.gallery !== 'Gallery 11');           // the Thorne rooms get their passage, below

// Push apart any two that the records put almost on top of each other.
for (let pass = 0; pass < 60; pass++) for (const a of rooms) for (const b of rooms) {
  if (a === b) continue;
  const dx = b.cx - a.cx, dz = b.cz - a.cz, d = Math.hypot(dx, dz) || 0.01;
  if (d < 6.6) { const k = (6.6 - d) / 2 / d; a.cx -= dx * k; a.cz -= dz * k; b.cx += dx * k; b.cz += dz * k; }
}

// ---- 3. rooms the records cannot give us -----------------------------------

const H = { '2': 7.5, '1': 6.5, '3': 6.5, LL: 4.4 };
const fixed = [
  // Griffin Court: the Modern Wing's long skylit hall, running north to a wall of glass.
  { id: 'hall', gallery: 'Griffin Court', kind: 'hall', building: 'modern', floor: '1', x0: 168, x1: 182, z0: 2, z1: 70, glass: 'n', h: 9 },
  // Gallery 11: the Thorne Miniature Rooms, in a long dark passage as they really are.
  { id: 'C', gallery: 'Gallery 11', kind: 'corridor', building: 'lower', floor: 'LL', x0: 8, x1: 70, z0: 221.5, z1: 227.5, h: 3.4 },
];
for (const r of rooms) {
  const big = r.gallery === 'Gallery 200' ? [15, 34] : null;       // the Grand Staircase
  const m = Math.max(5, Math.min(12.5, 4.5 + Math.sqrt(r.n) * 0.85));
  r.max = big || [m, m];
  r.h = r.gallery === 'Gallery 200' ? 13 : r.gallery === 'Gallery 239' ? 9.5 : H[r.floor] || 7;
  r.cx = snap(r.cx); r.cz = snap(r.cz);
  r.x0 = r.cx - 2; r.x1 = r.cx + 2; r.z0 = r.cz - 2; r.z1 = r.cz + 2;
}
rooms.push(...fixed);

// ---- 4. grow ---------------------------------------------------------------

const clear = (r, x0, x1, z0, z1) => rooms.every(o => o === r || x1 + T <= o.x0 || x0 - T >= o.x1 || z1 + T <= o.z0 || z0 - T >= o.z1);
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

// ---- 5. doorways -----------------------------------------------------------

const doors = [];
const overlap = (a0, a1, b0, b1) => [Math.max(a0, b0), Math.min(a1, b1)];
for (let i = 0; i < rooms.length; i++) for (let j = i + 1; j < rooms.length; j++) {
  const a = rooms[i], b = rooms[j];
  for (const [p, q, along] of [[a, b, 'x'], [b, a, 'x'], [a, b, 'z'], [b, a, 'z']]) {
    // q lies beyond p in the + direction of `along`
    const gap = along === 'x' ? q.x0 - p.x1 : q.z0 - p.z1;
    if (gap < T - 0.01 || gap > 3.01) continue;
    const [lo, hi] = along === 'x' ? overlap(p.z0, p.z1, q.z0, q.z1) : overlap(p.x0, p.x1, q.x0, q.x1);
    if (hi - lo < 3.2) continue;
    // Wide doorways: a toy car arrives at them fast.
    const low = Math.min(p.h, q.h), w = Math.min(low < 4 ? 2.6 : 4, hi - lo - 1), c = snap((lo + hi) / 2), h = Math.min(4.2, low - 0.7);
    doors.push(along === 'x'
      ? { a: p.id, b: q.id, along: 'x', x0: p.x1, x1: q.x0, z0: c - w / 2, z1: c + w / 2, h }
      : { a: p.id, b: q.id, along: 'z', x0: c - w / 2, x1: c + w / 2, z0: p.z1, z1: q.z0, h });
  }
}

// Ways in from outside. Named ones first; then every group of rooms that is
// still cut off gets a door on whichever of its walls has open ground beyond.
const byId = Object.fromEntries(rooms.map(r => [r.id, r]));
const sideFree = (r, side, depth = 4) => {
  const [x0, x1, z0, z1] = side === 'w' ? [r.x0 - T - depth, r.x0 - T, r.z0, r.z1] : side === 'e' ? [r.x1 + T, r.x1 + T + depth, r.z0, r.z1]
    : side === 'n' ? [r.x0, r.x1, r.z0 - T - depth, r.z0 - T] : [r.x0, r.x1, r.z1 + T, r.z1 + T + depth];
  return rooms.every(o => o === r || x1 <= o.x0 - T || x0 >= o.x1 + T || z1 <= o.z0 - T || z0 >= o.z1 + T);
};
function outside(id, side, w = 4) {
  const r = byId[id];
  if (!r || doors.some(d => d.a === id && d.b === 'out' && d.side === side)) return false;
  if (!sideFree(r, side)) return false;
  const h = Math.min(4.2, r.h - 0.7), cx = snap((r.x0 + r.x1) / 2), cz = snap((r.z0 + r.z1) / 2);
  w = Math.min(w, (side === 'w' || side === 'e' ? r.z1 - r.z0 : r.x1 - r.x0) - 1);
  doors.push(side === 'w' ? { a: id, b: 'out', side, along: 'x', x0: r.x0 - T, x1: r.x0, z0: cz - w / 2, z1: cz + w / 2, h }
    : side === 'e' ? { a: id, b: 'out', side, along: 'x', x0: r.x1, x1: r.x1 + T, z0: cz - w / 2, z1: cz + w / 2, h }
    : side === 'n' ? { a: id, b: 'out', side, along: 'z', x0: cx - w / 2, x1: cx + w / 2, z0: r.z0 - T, z1: r.z0, h }
    : { a: id, b: 'out', side, along: 'z', x0: cx - w / 2, x1: cx + w / 2, z0: r.z1, z1: r.z1 + T, h });
  return true;
}
// The Michigan Avenue front door, the court, the hall's south end, and the far ends of each arm.
for (const [id, side] of [['G214', 'w'], ['hall', 's'], ['G239', 's'], ['G249', 'e'], ['G150', 'e'], ['G151', 's'], ['G152', 'w'], ['G153', 'n'], ['G154', 'n'],
  ['C', 'n'], ['G222', 'n'], ['G273', 'n'], ['G161', 's'], ['G184', 'e'], ['G182', 'e'], ['G285', 'w'], ['G391', 'w'], ['G246', 's'], ['G243', 'n'], ['G236', 'w'], ['G209', 's']]) outside(id, side);
const group = () => {
  const g = Object.fromEntries(rooms.map(r => [r.id, r.id]));
  const find = x => (g[x] === x ? x : (g[x] = find(g[x])));
  for (const d of doors) if (d.b !== 'out') g[find(d.a)] = find(d.b);
  return r => find(r.id);
};
let of = group();
for (const r of [...rooms].sort((a, b) => (b.x1 - b.x0) * (b.z1 - b.z0) - (a.x1 - a.x0) * (a.z1 - a.z0))) {
  const mates = rooms.filter(o => of(o) === of(r));
  if (mates.some(m => doors.some(d => d.a === m.id && d.b === 'out'))) continue;
  for (const side of ['s', 'w', 'e', 'n']) if (outside(r.id, side)) break;
}

// ---- 6. write it down ------------------------------------------------------

const out = {
  made: new Date().toISOString().slice(0, 10),
  rooms: rooms.map(r => ({ id: r.id, gallery: r.gallery, floor: r.floor, building: r.building, kind: r.kind || 'gallery', x0: r.x0, x1: r.x1, z0: r.z0, z1: r.z1, h: r.h, ...(r.glass ? { glass: r.glass } : {}) })),
  doors: doors.map(({ side, ...d }) => d),
};
const file = fileURLToPath(new URL('../src/layout.js', import.meta.url));
writeFileSync(file, `// Generated by tools/build_layout.mjs on ${out.made} from the gallery records at\n// api.artic.edu/api/v1/galleries. Do not edit by hand: change the tool and run it again.\n\nexport default ${JSON.stringify(out).replace(/\{"id"/g, '\n  {"id"').replace(/\{"a"/g, '\n  {"a"')};\n`);

// A picture of it for the terminal.
const X1 = Math.max(...rooms.map(r => r.x1)) + 4, Z1 = Math.max(...rooms.map(r => r.z1)) + 4, sx = 2.2, sz = 4.4;
const grid = Array.from({ length: Math.ceil(Z1 / sz) + 1 }, () => Array(Math.ceil(X1 / sx) + 1).fill(' '));
for (const r of rooms) {
  for (let z = r.z0; z < r.z1; z += sz / 2) for (let x = r.x0; x < r.x1; x += sx / 2) grid[Math.floor(z / sz)][Math.floor(x / sx)] = '·';
  const label = r.id.replace(/^G/, '');
  [...label].forEach((ch, i) => { const gx = Math.floor((r.x0 + 0.6) / sx) + i, gz = Math.floor((r.z0 + r.z1) / 2 / sz); if (gx < Math.floor(r.x1 / sx) + 1) grid[gz][gx] = ch; });
}
for (const d of doors) grid[Math.floor((d.z0 + d.z1) / 2 / sz)][Math.floor((d.x0 + d.x1) / 2 / sx)] = d.b === 'out' ? 'O' : '+';
console.log(grid.map(r => r.join('').replace(/\s+$/, '')).filter((l, i, a) => l || a[i - 1]).join('\n'));
of = group();
const groups = {};
for (const r of rooms) (groups[of(r)] = groups[of(r)] || []).push(r.id.replace(/^G/, ''));
console.log(`\n${rooms.length} rooms, ${doors.filter(d => d.b !== 'out').length} doors between rooms, ${doors.filter(d => d.b === 'out').length} doors to outside, ${Object.keys(groups).length} separate buildings`);
for (const g of Object.values(groups)) console.log('  ' + g.length + ': ' + g.join(' '));
console.log('extent', X1.toFixed(0), 'x', Z1.toFixed(0), 'm; sizes', rooms.filter(r => r.max).map(r => `${r.id.slice(1)}:${r.x1 - r.x0}x${r.z1 - r.z0}`).join(' '));
