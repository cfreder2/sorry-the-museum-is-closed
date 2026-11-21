#!/usr/bin/env node
// Builds the floor plan the game plays in from the survey of the real building.
//
//   node tools/build_layout.mjs        reads survey/*.json, writes src/layout.js
//
// The survey (see survey/README.md) holds every room that has been traced from the architect's
// drawings and the museum's visitor maps, and the back-of-house rooms assumed for the space that
// is left inside the outline. This tool turns those rectangles into a building a toy car can
// drive round:
//
//   1. each room is put on its level at its real floor height;
//   2. the rooms that rise through more than one storey are made tall, and what crosses them
//      upstairs becomes a deck inside them: Griffin Court and its bridges, the Grand Staircase
//      and the gallery round its well, the Sculpture Court and its balcony;
//   3. stair towers get real switchback flights, lift shafts a platform;
//   4. rooms traced a little over one another are trimmed so a wall stands between them;
//   5. rooms that stand wall to wall on a level get a doorway;
//   6. whatever is still cut off is joined on: by a doorway, a short passage, a flight of stairs
//      or a lift, in that order of preference;
//   7. the ways in from the street;
//   8. and last, so that it disturbs nothing above, what is on no drawing at all (see section 8).
//
// The survey is in the building's own grid (the map turned 0.94 degrees so walls run along the
// axes), and so is the game.

import { writeFileSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { firstClue } from '../src/secretclue.js';

const here = p => fileURLToPath(new URL(p, import.meta.url));
const load = n => JSON.parse(readFileSync(here(`../survey/${n}.json`), 'utf8'));
const r2 = v => Math.round(v * 100) / 100;
const T = 1;                                                   // the thickness of an outside wall

// Floor elevations, metres above the street, from the architect's section.
const LEVELS = { LL: -4.6, '1': 0, '2': 5.2, '3': 11.3 };
const BASEMENT = -5.9;                                         // the Modern Wing's basement is deeper than the old lower level
const SLAB = 0.5;
// Clear heights. The Modern Wing's are measured from its section; the older buildings' are not known and are set to match.
const CLEAR = { mod: { LL: 4.9, '1': 4.4, '2': 5.3, '3': 5.9 }, old: { LL: 4.0, '1': 4.7, '2': 7.0, '3': 4.0 } };

// ---- 1. the survey ----------------------------------------------------------

const raw = [];
for (const [file, src] of [['modern-wing', 'mod'], ['old-buildings', 'old'], ['back-of-house', 'bac']])
  for (const r of load(file).rooms) raw.push({ ...r, src });
const S = Object.fromEntries(raw.map(r => [r.id, r]));
const GAL = load('galleries'), titles = (Array.isArray(GAL) ? GAL : GAL.rooms || GAL.galleries || Object.values(GAL).find(Array.isArray)).map(g => g.title);

// The name the museum's own records use for a room, so its works can be hung in it.
function galleryName(r) {
  const m = /^G(\d+[A-Z]?)$/.exec(r.id);
  if (m && titles.includes('Gallery ' + m[1])) return 'Gallery ' + m[1];
  if (r.id === 'G231_233') return 'Galleries 231-233';
  const t = titles.find(t => t === r.name || (r.name.length > 8 && t.startsWith(r.name)));
  if (r.id === 'F1-library') return 'Research Center Franke Reading Room';
  if (r.id === 'F1-fullerton') return 'Fullerton Hall Lobby';
  return t || (m ? r.name.replace(/ \(.*\)$/, '') : r.name);
}

const rooms = [], decks = [], ramps = [], lifts = [], links = [];
const byId = {};
const used = new Set();                                        // survey rooms already turned into something
const add = r => { r.top = r.y + r.h; rooms.push(r); byId[r.id] = r; return r; };
const rect = r => ({ x0: r.x0, x1: r.x1, z0: r.z0, z1: r.z1 });
const deck = (id, room, q, y, rails = [], thick = 0.4) => decks.push({ id, room, x0: r2(q.x0), x1: r2(q.x1), z0: r2(q.z0), z1: r2(q.z1), y, thick, rails });
const ramp = (id, room, x0, x1, z0, z1, axis, y0, y1, stairs = true) => ramps.push({ id, room, x0: r2(x0), x1: r2(x1), z0: r2(z0), z1: r2(z1), axis, y0: r2(y0), y1: r2(y1), stairs });

// What is left of rectangle a when b is taken out of it: up to four pieces.
function minus(a, b) {
  if (b.x0 >= a.x1 || b.x1 <= a.x0 || b.z0 >= a.z1 || b.z1 <= a.z0) return [a];
  const out = [];
  if (b.z0 > a.z0) out.push({ x0: a.x0, x1: a.x1, z0: a.z0, z1: b.z0 });
  if (b.z1 < a.z1) out.push({ x0: a.x0, x1: a.x1, z0: b.z1, z1: a.z1 });
  const z0 = Math.max(a.z0, b.z0), z1 = Math.min(a.z1, b.z1);
  if (b.x0 > a.x0) out.push({ x0: a.x0, x1: b.x0, z0, z1 });
  if (b.x1 < a.x1) out.push({ x0: b.x1, x1: a.x1, z0, z1 });
  return out;
}
// The biggest rectangles of a that keep clear of b: the whole of a to one side of it.
const keep = (a, b) => [{ ...a, x1: Math.min(a.x1, b.x0) }, { ...a, x0: Math.max(a.x0, b.x1) }, { ...a, z1: Math.min(a.z1, b.z0) }, { ...a, z0: Math.max(a.z0, b.z1) }].filter(q => q.x1 > q.x0 && q.z1 > q.z0);
const cross = (a, b) => ({ x0: Math.max(a.x0, b.x0), x1: Math.min(a.x1, b.x1), z0: Math.max(a.z0, b.z0), z1: Math.min(a.z1, b.z1) });
const sized = (q, m = 0.6) => q.x1 - q.x0 >= m && q.z1 - q.z0 >= m;

// ---- 2. the tall rooms ------------------------------------------------------

// A floor inside a tall room, cut from a room the survey has upstairs: the part of it that lies
// inside the tall room, less whatever is open to below. Rails go on the edges that are over a drop.
function decksFrom(tall, pieces, y, name, voids = []) {
  let parts = pieces.map(p => cross(p, tall)).filter(q => sized(q));
  for (const v of voids) parts = parts.flatMap(p => minus(p, v)).filter(q => sized(q));
  const touch = (p, s) => parts.some(o => o !== p && (s === 'w' ? Math.abs(o.x1 - p.x0) < 0.05 : s === 'e' ? Math.abs(o.x0 - p.x1) < 0.05 : s === 'n' ? Math.abs(o.z1 - p.z0) < 0.05 : Math.abs(o.z0 - p.z1) < 0.05)
    && (s === 'w' || s === 'e' ? o.z0 < p.z1 - 0.05 && o.z1 > p.z0 + 0.05 : o.x0 < p.x1 - 0.05 && o.x1 > p.x0 + 0.05));
  parts.forEach((p, i) => {
    const rails = [];
    if (p.x0 > tall.x0 + 0.05 && !touch(p, 'w')) rails.push('w');
    if (p.x1 < tall.x1 - 0.05 && !touch(p, 'e')) rails.push('e');
    if (p.z0 > tall.z0 + 0.05 && !touch(p, 'n')) rails.push('n');
    if (p.z1 < tall.z1 - 0.05 && !touch(p, 's')) rails.push('s');
    deck(`${name}${parts.length > 1 ? '-' + (i + 1) : ''}`, tall.id, p, y, rails);
  });
}

// Griffin Court: the Modern Wing's street, three storeys to its glass roof, the Monroe Street
// doors in the glass at its north end. Two bridges cross it at the north end, one on each upper
// floor. Its stair climbs the east wall to the second-floor balcony.
{
  const g = S.G185;
  const r = add({ id: 'hall', gallery: 'Griffin Court', kind: 'hall', building: 'modern', floor: '1', ...rect(g), y: 0, h: g.h, glass: 'n', fixed: true });
  decksFrom(r, [S['MW2-bridgeN']], LEVELS['2'], 'hall-bridge-2');
  decksFrom(r, [S['MW3-bridgeN']], LEVELS['3'], 'hall-bridge-3');
  const w = 2.8, top = 27, len = 16;
  deck('hall-stairhead', r.id, { x0: r.x1 - w, x1: r.x1, z0: top - 4.5, z1: top }, LEVELS['2'], ['w', 'n']);
  ramp('hall-up', r.id, r.x1 - w, r.x1, top, top + len, 'z', LEVELS['2'], 0);
  for (const id of ['G185', 'MW2-bridgeN', 'MW3-bridgeN']) used.add(id);
}

// The Michigan Avenue lobby and the Grand Staircase. The lobby is the first floor of the middle of
// the 1893 building; the staircase hall stands in the east half of it and goes on up to the
// skylight over the second floor, with a gallery round its well. In from the lobby on the west; a
// wide flight straight ahead to a landing against the east wall; two flights back, left and
// right, to the gallery. One more flight goes down along the south wall to the lower lobby.
{
  const lob = S.G100, st = S.G200, L2 = LEVELS['2'];
  const r = add({ id: 'G200', gallery: 'Gallery 200', kind: 'gallery', building: 'main', floor: '1', ...rect(st), y: 0, h: L2 + CLEAR.old['2'], fixed: true });
  add({ id: 'lobby', gallery: 'Michigan Avenue Lobby', kind: 'room', use: 'lobby', building: 'main', floor: '1', x0: lob.x0, x1: st.x0 - 0.6, z0: lob.z0, z1: lob.z1, y: 0, h: CLEAR.old['1'], fixed: true });
  add({ id: 'lobby-n', gallery: 'Lobby, north side', kind: 'room', use: 'lobby', passage: true, building: 'main', floor: '1', x0: st.x0, x1: lob.x1, z0: lob.z0, z1: st.z0 - 0.6, y: 0, h: CLEAR.old['1'], fixed: true });
  add({ id: 'lobby-s', gallery: 'Lobby, south side', kind: 'room', use: 'lobby', passage: true, building: 'main', floor: '1', x0: st.x0, x1: lob.x1, z0: st.z1 + 0.6, z1: lob.z1, y: 0, h: CLEAR.old['1'], fixed: true });
  const AX = (r.z0 + r.z1) / 2, mid = L2 / 2, fx0 = r.x0 + 5.5, fx1 = r.x1 - 6, side = 2.6;
  ramp('G200-up', r.id, fx0, fx1, AX - 3, AX + 3, 'x', 0, mid);
  deck('G200-landing', r.id, { x0: fx1, x1: r.x1, z0: AX - 8.5, z1: AX + 8.5 }, mid, ['w', 'n', 's']);
  ramp('G200-north', r.id, fx0, fx1, AX - 8.5, AX - 4.5, 'x', L2, mid);
  ramp('G200-south', r.id, fx0, fx1, AX + 4.5, AX + 8.5, 'x', L2, mid);
  deck('G200-west', r.id, { x0: r.x0, x1: fx0, z0: r.z0, z1: r.z1 }, L2, ['e']);
  deck('G200-north-side', r.id, { x0: fx0, x1: r.x1, z0: r.z0, z1: r.z0 + side }, L2, ['s']);
  deck('G200-south-side', r.id, { x0: fx0, x1: r.x1, z0: r.z1 - side, z1: r.z1 }, L2, ['n']);
  deck('G200-east', r.id, { x0: r.x1 - 4.5, x1: r.x1, z0: r.z0 + side, z1: r.z1 - side }, L2, ['w']);
  // (Kept 1.4 m off the south wall: the doorways in that wall, on this floor and the one below, open onto floor and not onto the stair.)
  ramp('G200-down', r.id, fx0 + 1, fx0 + 15, r.z1 - 3, r.z1 - 1.4, 'x', 0, LEVELS.LL);
  links.push(['G200', 'G10']);
  for (const id of ['G100', 'G200']) used.add(id);
}

// The Sculpture Court: two storeys, with Gallery 261 as the balcony round it.
{
  const g = S.G161;
  const r = add({ id: 'G161', gallery: galleryName(g), kind: 'gallery', building: 'main', floor: '1', ...rect(g), y: 0, h: LEVELS['2'] + CLEAR.old['2'], fixed: true });
  decksFrom(r, [S.G261], LEVELS['2'], 'G161-balcony', [S['V2-sc']]);
  used.add('G161');
}

// ---- 3. stair towers and lift shafts ---------------------------------------

// A stair tower: flights up one side of the well and back down the other, with a landing across
// each end. No flight is steeper than one in three, so a storey takes two or three of them.
function stairwell(id, name, q, stops, building) {
  const alongZ = q.z1 - q.z0 >= q.x1 - q.x0, LD = 2;
  const [a0, a1, b0, b1] = alongZ ? [q.z0, q.z1, q.x0, q.x1] : [q.x0, q.x1, q.z0, q.z1];
  const run = a1 - a0 - 2 * LD, half = (b1 - b0 - 0.2) / 2;
  const r = add({ id, gallery: name, kind: 'room', use: 'stair', passage: true, building, floor: stops[0] < -0.1 ? 'LL' : '1', ...rect(q), y: stops[0], h: stops[stops.length - 1] - stops[0] + 4, fixed: true });
  const at = (p0, p1, s0, s1) => alongZ ? { x0: s0, x1: s1, z0: p0, z1: p1 } : { x0: p0, x1: p1, z0: s0, z1: s1 };
  let k = 0, y = stops[0];
  for (let s = 1; s < stops.length; s++) {
    const rise = stops[s] - stops[s - 1], n = Math.ceil(rise / (run / 3) - 1e-6);
    for (let i = 0; i < n; i++, k++) {
      const y1 = i === n - 1 ? stops[s] : y + rise / n, out = k % 2 === 0;           // out: away from the low end
      const f = at(a0 + LD, a1 - LD, k % 2 ? b1 - half : b0, k % 2 ? b1 : b0 + half);
      ramp(`${id}-${k + 1}`, id, f.x0, f.x1, f.z0, f.z1, alongZ ? 'z' : 'x', out ? y : y1, out ? y1 : y);
      deck(`${id}-at-${k + 1}`, id, out ? at(a1 - LD, a1, b0, b1) : at(a0, a0 + LD, b0, b1), r2(y1), []);
      y = y1;
    }
  }
  return r;
}
// A lift shaft: the platform across one end, and a floor across the rest at every stop above the lowest.
function shaft(id, name, q, stops, building, platformAt) {
  const r = add({ id, gallery: name, kind: 'room', use: 'lift', passage: true, building, floor: '1', ...rect(q), y: stops[0], h: stops[stops.length - 1] - stops[0] + 4, fixed: true });
  const alongZ = q.z1 - q.z0 > q.x1 - q.x0, P = 2.6;
  const plat = alongZ ? (platformAt === 'lo' ? { ...rect(q), z1: q.z0 + P } : { ...rect(q), z0: q.z1 - P }) : (platformAt === 'lo' ? { ...rect(q), x1: q.x0 + P } : { ...rect(q), x0: q.x1 - P });
  const rest = minus(rect(q), plat)[0];
  stops.slice(1).forEach((y, i) => deck(`${id}-floor-${i + 2}`, id, rest, y, []));
  lifts.push({ id: `${id}-car`, room: id, x0: r2(plat.x0), x1: r2(plat.x1), z0: r2(plat.z0), z1: r2(plat.z1), stops });
  return r;
}
stairwell('MW-stairW', 'West stair', S['MW2-stairW'], [0, LEVELS['2'], LEVELS['3']], 'modern');
stairwell('MW-stairE', 'East stair tower', S['MW1-stairE'], [BASEMENT, 0, LEVELS['2'], LEVELS['3']], 'modern');
stairwell('spiral', 'Spiral stair', S['S2-spiral'], [0, LEVELS['2']], 'main');
shaft('MW-lift', 'Passenger lift', S['MW1-lift'], [0, LEVELS['2'], LEVELS['3']], 'modern', 'hi');
for (const id of ['MW1-stairW', 'MW2-stairW', 'MW3-stairW', 'MW1-stairE', 'MW2-stairE', 'MW3-stairE', 'S2-spiral', 'MW1-lift']) used.add(id);

// ---- 4. every other room ----------------------------------------------------

// Open to the sky or open to below: not rooms. (The entrance steps and the gardens are outdoors.)
const NOT_ROOMS = new Set(['void', 'garden', 'entrance']);
const PASSAGES = new Set(['corridor', 'balcony', 'bridge']);
const order = { mod: 0, old: 1, bac: 2 };
const rest = raw.filter(r => !used.has(r.id) && !NOT_ROOMS.has(r.kind)).sort((a, b) => order[a.src] - order[b.src] || PASSAGES.has(b.kind) - PASSAGES.has(a.kind));

const band = r => [r.y, r.fixed ? r.top : r.y + 2.5];        // rooms on different levels never stand in each other's way; a tall room does
const shares = (a, b) => { const p = band(a), q = band(b); return p[0] < q[1] - 0.01 && q[0] < p[1] - 0.01; };
const over = (a, b, m = 0) => a.x0 < b.x1 + m && a.x1 > b.x0 - m && a.z0 < b.z1 + m && a.z1 > b.z0 - m;
const area = q => (q.x1 - q.x0) * (q.z1 - q.z0);
const dropped = [], why = {};

for (const s of rest) {
  const lower = s.level === 'LL' || s.level === 'B', floor = lower ? 'LL' : s.level;
  const y = s.level === 'B' ? BASEMENT : LEVELS[floor];
  const nominal = Math.min(s.h || 99, CLEAR[s.src === 'mod' ? 'mod' : 'old'][floor]);
  const public_ = s.id === 'F1-library' || s.id === 'F1-fullerton' || s.kind === 'gallery' || s.kind === 'court' || s.kind === 'exhibition' || s.kind === 'stairhall';
  const numbered = /^G\d+[A-Z]?$/.test(s.id) && titles.includes('Gallery ' + s.id.slice(1));       // a balcony or corridor the museum hangs work in keeps its gallery number
  const r = { id: s.id, gallery: s.id === 'G11' || public_ || numbered ? galleryName(s) : s.name, floor,
    kind: s.id === 'G11' ? 'corridor' : public_ ? 'gallery' : 'room',
    building: s.src === 'mod' ? 'modern' : lower ? 'lower' : 'main', ...rect(s), y, h: nominal, top: y + nominal, src: s.src };
  if (!public_) r.use = s.kind;
  if (PASSAGES.has(s.kind)) r.passage = true;
  if (s.assumed || s.kind === 'backofhouse') r.assumed = true;
  if (s.glass) r.glass = s.glass;                               // a side open to the air (drawn as glass, still a wall to drive into)
  // Trim it clear of everything already placed that it would run into, leaving a wall between: the
  // Modern Wing's partitions are thin, the old buildings' walls are masonry.
  let q = rect(r), ok = true;
  for (let pass = 0; pass < 30 && ok; pass++) {
    let hit = null, o_id = '';
    for (const o of rooms) {
      const wall = o.src === 'mod' && r.src === 'mod' ? 0.2 : 0.4;
      if (shares(r, o) && over(q, o, wall - 0.001)) { hit = { x0: o.x0 - wall, x1: o.x1 + wall, z0: o.z0 - wall, z1: o.z1 + wall }; o_id = o.id; break; }
    }
    if (!hit) break;
    const left = keep(q, hit).sort((a, b) => area(b) - area(a))[0];
    if (!left || !sized(left, 1.5) || area(left) < 5) { ok = false; why[s.id] = o_id; } else q = left;
  }
  if (!ok || rooms.some(o => shares(r, o) && over(q, o, 0.19))) { dropped.push(s.id); continue; }
  Object.assign(r, { x0: r2(q.x0), x1: r2(q.x1), z0: r2(q.z0), z1: r2(q.z1) });
  add(r);
}

// A room's clear height is its own; under another room it stops a slab's thickness short of that room's floor.
for (const r of rooms) {
  if (r.fixed) continue;
  let h = r.h;
  if (r.y < 0) h = Math.min(h, -r.y - SLAB - 0.1);                                    // the ground is overhead
  for (const o of rooms) if (o !== r && o.y > r.y + 0.5 && over(r, o, T)) h = Math.min(h, o.y - r.y - SLAB);
  r.h = r2(h); r.top = r.y + r.h;
}

// ---- 5. doorways -------------------------------------------------------------
//
// A doorway joins two rooms whose floors are level there. Into a tall room from an upper floor that
// means onto one of its decks: the doorway can only be where a deck at that height meets the wall.

const doors = [];
const same = (a, b) => Math.abs(a - b) < 0.02;
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
// The heights two rooms could meet at: the same floor, or a deck in a tall one level with the other's floor.
function meets(a, b) {
  if (same(a.y, b.y)) return [a.y];
  const out = [];
  for (const [t, o] of [[a, b], [b, a]]) if (t.fixed && t.y < o.y && t.top > o.y + 2 && decks.some(d => d.room === t.id && same(d.y, o.y))) out.push(o.y);
  return out;
}
function doorHeight(d, a, b) {
  let h = Math.min(4.2, Math.min(a.top, b.top) - d.y - 0.7);
  for (const k of decks) if ((k.room === a.id || k.room === b.id) && k.y > d.y + 1 && k.x0 < d.x1 + 1.5 && k.x1 > d.x0 - 1.5 && k.z0 < d.z1 + 1.5 && k.z1 > d.z0 - 1.5) h = Math.min(h, k.y - k.thick - d.y - 0.1);
  return r2(h);
}
// A doorway must keep clear of the foot or head of any flight, and of a lift.
const blocked = (d, y) => ramps.some(q => Math.min(q.y0, q.y1) < y + 2.4 && Math.max(q.y0, q.y1) > y - 0.2 && !same(q.y0 > q.y1 ? q.y0 : q.y1, y) && !same(q.y0 > q.y1 ? q.y1 : q.y0, y) && over(d, q, 0.3) && false)
  || lifts.some(l => over(d, l, 0.05) && (d.along === 'x' ? d.z0 < l.z1 && d.z1 > l.z0 && (Math.abs(d.x1 - l.x0) < 0.05 || Math.abs(d.x0 - l.x1) < 0.05) : d.x0 < l.x1 && d.x1 > l.x0 && (Math.abs(d.z1 - l.z0) < 0.05 || Math.abs(d.z0 - l.z1) < 0.05)));
function join(a, b, y, maxGap = 3.01) {
  let made = false;
  for (const fa of faces(a, y)) for (const fb of faces(b, y)) {
    if (!((fa.s === 'e' && fb.s === 'w') || (fa.s === 's' && fb.s === 'n'))) continue;        // b lies beyond a in the + direction
    const gap = fb.at - fa.at;
    if (gap < 0.19 || gap > maxGap) continue;
    const lo = Math.max(fa.lo, fb.lo), hi = Math.min(fa.hi, fb.hi);
    if (hi - lo < 1.9) continue;
    const low = Math.min(a.top, b.top) - y, staff = a.assumed || b.assumed;
    // A gallery doorway is about a third of the wall it is in and never more than 2.6 m: the rest of the wall is for pictures.
    let w = Math.min(staff ? 1.8 : Math.min(2.6, Math.max(1.6, (hi - lo) * 0.3)), hi - lo - 0.4), c = r2((lo + hi) / 2);
    // Into a stair tower, a doorway opens onto a landing: never onto the side of a flight, nor over the well. On the
    // tower's own floor that is wherever no flight stands; higher up, the landing built at that level.
    { let ok = true;
      for (const t of [a, b]) {
        if (t.use !== 'stair') continue;
        const ax = fa.s === 'e' ? 'z' : 'x', ox = ax === 'z' ? 'x' : 'z', P = q => [q[ax + '0'], q[ax + '1']];
        const off = q => t === b ? q[ox + '0'] - fb.at : fa.at - q[ox + '1'];      // how far a thing in the tower stands back from this wall
        let free = same(y, t.y) ? [[t[ax + '0'], t[ax + '1']]] : decks.filter(k => k.room === t.id && same(k.y, y) && off(k) < 0.3).map(P);
        if (same(y, t.y)) for (const q of ramps) if (q.room === t.id && Math.min(q.y0, q.y1) < y + 2.4 && off(q) < 1.4) free = free.flatMap(([p0, p1]) => { const [q0, q1] = P(q), out = []; if (q0 - p0 > 0.01) out.push([p0, Math.min(p1, q0)]); if (p1 - q1 > 0.01) out.push([Math.max(p0, q1), p1]); return q1 <= p0 || q0 >= p1 ? [[p0, p1]] : out; });
        free = free.map(([p0, p1]) => [Math.max(p0, lo) + 0.15, Math.min(p1, hi) - 0.15]).filter(([p0, p1]) => p1 - p0 >= 1.2);
        if (!free.length) { ok = false; break; }
        if (free.some(([p0, p1]) => c - w / 2 >= p0 && c + w / 2 <= p1)) continue;      // already on a landing: leave it be
        const best = free.sort((p, q) => Math.abs((p[0] + p[1]) / 2 - c) - Math.abs((q[0] + q[1]) / 2 - c))[0];
        w = Math.min(w, r2(best[1] - best[0])); c = r2(Math.max(best[0] + w / 2, Math.min(best[1] - w / 2, c)));
      }
      if (!ok) continue; }
    const d = fa.s === 'e' ? { a: a.id, b: b.id, along: 'x', x0: fa.at, x1: fb.at, z0: r2(c - w / 2), z1: r2(c + w / 2), y } : { a: a.id, b: b.id, along: 'z', x0: r2(c - w / 2), x1: r2(c + w / 2), z0: fa.at, z1: fb.at, y };
    d.h = doorHeight(d, a, b);
    if (d.h < 1.2 || blocked(d, y)) continue;
    // Nothing else may stand in the wall the doorway goes through.
    if (rooms.some(o => o !== a && o !== b && o.y < y + d.h && o.top > y && over(d, o, -0.01))) continue;
    doors.push(d); made = true;
  }
  return made;
}
const joined = (a, b) => doors.some(d => (d.a === a.id && d.b === b.id) || (d.a === b.id && d.b === a.id));
const pair = (a, b) => { let m = false; for (const y of meets(a, b)) { m = join(a, b, y) || m; m = join(b, a, y) || m; } return m; };
// Public rooms open into one another. A back-of-house room opens onto its corridor, and the
// corridor onto the public rooms: not every office straight into a gallery.
const corridor = r => r.passage;
const natural = (a, b) => !a.assumed && !b.assumed ? true : a.assumed && b.assumed ? corridor(a) || corridor(b) : corridor(a.assumed ? a : b);
for (let i = 0; i < rooms.length; i++) for (let j = i + 1; j < rooms.length; j++) if (natural(rooms[i], rooms[j])) pair(rooms[i], rooms[j]);

// ---- 6. nobody left cut off -------------------------------------------------

// Places you can stand: the floor of each room and each deck. What joins them: a doorway (to the
// room's floor, or to the deck at its sill), a flight, a lift, and decks that touch.
function standAt(x, z, y) {
  for (const d of decks) if (same(d.y, y) && x >= d.x0 - 0.05 && x <= d.x1 + 0.05 && z >= d.z0 - 0.05 && z <= d.z1 + 0.05) return 'D' + d.id;
  for (const r of rooms) if (same(r.y, y) && x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1) return 'R' + r.id;
  return null;
}
function groups() {
  const g = {};
  const find = x => (g[x] === undefined ? (g[x] = x) : g[x] === x ? x : (g[x] = find(g[x])));
  const link = (a, b) => { if (a && b) g[find(a)] = find(b); };
  const side = (id, d) => { const r = byId[id]; if (same(r.y, d.y)) return 'R' + id; const k = decks.find(k => k.room === id && same(k.y, d.y) && over(k, d, 0.05)); return k ? 'D' + k.id : null; };
  for (const d of doors) if (d.b !== 'out') link(side(d.a, d), side(d.b, d));
  for (const q of ramps) {
    const c = q.axis === 'x' ? (q.z0 + q.z1) / 2 : (q.x0 + q.x1) / 2;
    const lo = q.axis === 'x' ? standAt(q.x0 - 0.3, c, q.y0) : standAt(c, q.z0 - 0.3, q.y0), hi = q.axis === 'x' ? standAt(q.x1 + 0.3, c, q.y1) : standAt(c, q.z1 + 0.3, q.y1);
    link(lo, hi);
  }
  for (const l of lifts) {
    const cx = (l.x0 + l.x1) / 2, cz = (l.z0 + l.z1) / 2; let first = null;
    for (const y of l.stops) for (const [x, z] of [[l.x0 - 0.3, cz], [l.x1 + 0.3, cz], [cx, l.z0 - 0.3], [cx, l.z1 + 0.3]]) { const p = standAt(x, z, y); if (p) { if (first) link(first, p); else first = p; } }
  }
  for (let i = 0; i < decks.length; i++) for (let j = i + 1; j < decks.length; j++) { const a = decks[i], b = decks[j]; if (a.room === b.room && same(a.y, b.y) && over(a, b, 0.05)) link('D' + a.id, 'D' + b.id); }
  return r => find('R' + r.id);
}
const HOME = byId.G200;
let passages = 0, forced = 0;
// A doorway straight through, where two rooms stand wall to wall after all.
function force(of, home) {
  for (const a of rooms) if (of(a) === home) for (const b of rooms) if (of(b) !== home && over(a, b, 3.02) && !joined(a, b) && pair(a, b)) { forced++; return true; }
  return false;
}
// A plain passage from a room that is cut off to the nearest room on its level that is not.
function passage(of, home) {
  let best = null;
  for (const a of rooms) for (const b of rooms) {
    if (of(a) === home || of(b) !== home || a === b || !over(a, b, 14)) continue;
    for (const y of meets(a, b)) for (const [p, q] of [[a, b], [b, a]]) for (const fp of faces(p, y)) for (const fq of faces(q, y)) {
      if (!((fp.s === 'e' && fq.s === 'w') || (fp.s === 's' && fq.s === 'n'))) continue;
      const gap = fq.at - fp.at, lo = Math.max(fp.lo, fq.lo), hi = Math.min(fp.hi, fq.hi);
      if (gap <= 3.01 || gap > 14 || hi - lo < 2.4) continue;
      const w = Math.min(3, hi - lo), c = r2((lo + hi) / 2), W = 0.4;
      const k = fp.s === 'e' ? { x0: fp.at + W, x1: fq.at - W, z0: c - w / 2, z1: c + w / 2 } : { x0: c - w / 2, x1: c + w / 2, z0: fp.at + W, z1: fq.at - W };
      Object.assign(k, { y, floor: (same(y, p.y) ? p : q).floor, top: y + 3 });
      if (!rooms.every(o => o === p || o === q || !shares(k, o) || !over(k, o, 0.39))) continue;
      if (!best || gap < best.gap) best = { gap, k, p, q, y };
    }
  }
  if (!best) return false;
  const { k, p, q, y } = best;
  Object.assign(k, { id: 'K' + (++passages), gallery: 'Passage', kind: 'room', use: 'corridor', building: p.building === q.building ? p.building : 'main', passage: true, h: 3 });
  for (const o of rooms) if (o.y > k.y + 0.5 && over(k, o, T)) k.h = Math.min(k.h, o.y - k.y - SLAB);
  if (k.y < 0) k.h = Math.min(k.h, -k.y - SLAB - 0.1);
  add(k);
  join(p, k, y); join(k, q, y);
  return true;
}
// A flight of stairs from a first-floor room down into a lower-level room beneath it. The flight
// lies along a wall of the lower room; its head must come up inside one room above.
const inside = (r, x0, x1, z0, z1, m = 0) => r && x0 >= r.x0 + m && x1 <= r.x1 - m && z0 >= r.z0 + m && z1 <= r.z1 - m;
const taken = (q, m) => doors.some(d => over(d, q, m)) || ramps.some(o => over(o, q, m)) || lifts.some(o => over(o, q, m)) || decks.some(o => over(o, q, m));
function flight(a, b) {
  if (a.fixed || b.fixed || !same(a.y, 0) || !(b.y < 0) || a.passage) return false;
  const rise = -b.y, run = Math.ceil(rise * 3 * 2) / 2, w = 3, head = 6, before = 2;
  for (const axis of ['x', 'z']) for (const dir of [1, -1]) {
    const [lo, hi, c0, c1, a0, a1] = axis === 'x' ? [b.x0, b.x1, b.z0, b.z1, a.z0, a.z1] : [b.z0, b.z1, b.x0, b.x1, a.x0, a.x1];
    const across = [a0, a1 - w, c0, c1 - w];
    for (let c = c0; c + w <= c1; c += 0.5) across.push(c);
    for (const c of across) for (let u = lo + (dir > 0 ? 0 : 2.5); u + run <= hi - (dir > 0 ? 2.5 : 0) + 0.01; u += 0.5) {
      const top = dir > 0 ? u : u + run, h0 = dir > 0 ? top - before : top - head, h1 = dir > 0 ? top + head : top + before;
      const at = (p, q, r, s) => axis === 'x' ? [p, q, r, s] : [r, s, p, q];
      const [x0, x1, z0, z1] = at(u, u + run, c, c + w);
      const flush = c - a0 < 0.01 || a1 - (c + w) < 0.01, side = flush ? 0 : 1.7;
      if (!inside(b, x0, x1, z0, z1) || !inside(a, ...at(h0 + 0.1, h1 - 0.1, Math.max(a0, c - side), Math.min(a1, c + w + side))) || (!flush && (c - side < a0 || c + w + side > a1))) continue;
      if (taken({ x0, x1, z0, z1 }, 2.2)) continue;
      ramp(`${a.id}-down`, a.id, x0, x1, z0, z1, axis, dir > 0 ? 0 : b.y, dir > 0 ? b.y : 0);
      links.push([a.id, b.id]);
      return true;
    }
  }
  return false;
}
// A lift between two rooms that stand one over the other.
function lift(a, b) {
  const [lo, up] = a.y < b.y ? [a, b] : [b, a];
  if (lo.fixed || up.fixed || up.y - lo.top > 1.5 || up.y - lo.top < -0.01) return false;
  const q = cross(lo, up), w = 2.6;
  for (let x = q.x0 + 1; x + w <= q.x1 - 1; x += 0.5) for (let z = q.z0 + 1; z + w <= q.z1 - 1; z += 0.5) {
    const p = { x0: r2(x), x1: r2(x + w), z0: r2(z), z1: r2(z + w) };
    if (taken(p, 2.6)) continue;
    lifts.push({ id: `${up.id}-lift`, room: up.id, ...p, stops: [lo.y, up.y] });
    links.push([lo.id, up.id]);
    return true;
  }
  return false;
}
// The ways between levels the survey knows of come first: where it has a lift or a stair, that is where one goes.
const vertical = r => r.use === 'lift' || r.use === 'stair' || /stair|Lift/.test(r.gallery) ? 0 : r.assumed ? 2 : 1;
function between(of, home, make) {
  const c = [];
  for (const a of rooms) if (of(a) === home) for (const b of rooms) if (of(b) !== home && !same(a.y, b.y) && over(a, b, -2.3)) c.push([a, b]);
  c.sort((p, q) => (vertical(p[0]) + vertical(p[1])) - (vertical(q[0]) + vertical(q[1])) || area(cross(q[0], q[1])) - area(cross(p[0], p[1])));
  for (const [a, b] of c) if (make(a, b)) return true;
  return false;
}
for (let n = 0; n < 400; n++) {
  const of = groups(), home = of(HOME);
  if (rooms.every(r => of(r) === home)) break;
  if (force(of, home) || passage(of, home) || between(of, home, (a, b) => flight(a, b) || flight(b, a)) || between(of, home, lift)) continue;
  break;
}
// What could not be joined on at all is left out.
{
  const of = groups(), home = of(HOME), cut = rooms.filter(r => of(r) !== home);
  for (const r of cut) { dropped.push(r.id); rooms.splice(rooms.indexOf(r), 1); delete byId[r.id]; }
  for (let i = doors.length - 1; i >= 0; i--) if (!byId[doors[i].a] || (doors[i].b !== 'out' && !byId[doors[i].b])) doors.splice(i, 1);
}

// ---- 7. ways in from outside, on the ground floor only -----------------------
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
  const h = Math.min(4.2, r.h - 0.7), cx = r2((r.x0 + r.x1) / 2), cz = r2((r.z0 + r.z1) / 2);
  w = Math.min(w, (side === 'w' || side === 'e' ? r.z1 - r.z0 : r.x1 - r.x0) - 1);
  doors.push(side === 'w' ? { a: id, b: 'out', side, along: 'x', x0: r.x0 - T, x1: r.x0, z0: cz - w / 2, z1: cz + w / 2, y: 0, h }
    : side === 'e' ? { a: id, b: 'out', side, along: 'x', x0: r.x1, x1: r.x1 + T, z0: cz - w / 2, z1: cz + w / 2, y: 0, h }
    : side === 'n' ? { a: id, b: 'out', side, along: 'z', x0: cx - w / 2, x1: cx + w / 2, z0: r.z0 - T, z1: r.z0, y: 0, h }
    : { a: id, b: 'out', side, along: 'z', x0: cx - w / 2, x1: cx + w / 2, z0: r.z1, z1: r.z1 + T, y: 0, h });
  return true;
}
// The Michigan Avenue front door, on the axis of the Grand Staircase. Then the museum's other real
// ways in: Monroe Street into Griffin Court, the Modern Wing's west door, Columbus Drive.
if (!outside('lobby', 'w', 4, true)) throw new Error('the front door has nowhere to go');
{ const d = doors[doors.length - 1]; d.h = Math.min(d.h, byId.lobby.h - 1.7); }      // low enough to leave wall over it for the fanlight, which is the drone's way in
for (const [id, side] of [['hall', 'n'], ['MW1-west', 'w'], ['G161', 'e'], ['G161', 's'], ['F1-regenstein', 's'], ['G184', 'w'], ['G142', 'n']]) outside(id, side);
{
  const count = () => doors.filter(d => d.b === 'out').length;
  for (const r of rooms.filter(q => same(q.y, 0) && !q.passage && !q.fixed && q.kind === 'gallery').sort((a, b) => area(b) - area(a))) {
    if (count() >= 12) break;
    if (doors.some(d => d.a === r.id && d.b === 'out')) continue;
    for (const side of ['s', 'e', 'w', 'n']) if (outside(r.id, side)) break;
  }
}

// ---- 8. what is on no drawing ---------------------------------------------------
//
// Invented, not surveyed, and marked `secret`: a passage behind one wall of one gallery, a stair
// tower down from it, and three rooms twelve metres under the street, below everything else in the
// building. Which gallery is decided by a picture: the first on the list in src/secretclue.js that
// is in the saved copy of the collection (data/collection.json) says which room, and the game
// reads the same list. Each such room needs its site drawn here by hand, like the tall rooms at
// the top of this file; a room with no site drawn gets no passage, and the game then leaves the
// whole thing out.
//
// All of it is added after everything else, so nothing above is moved by it: the plan without the
// `secret` rooms and doors is the plan as it was. The doorway marked `hidden` is the one way in.
const DEEP = -12, VAULT_H = 5;
const SITES = {
  // Gallery 240, over the west end of the galleries that bridge the railway. Its north wall has
  // 5 m of plaster west of its door, and behind that is a pocket between Gallery 230 and Gallery
  // 241 that nothing uses. North of the pocket, outside the old wall, the corner between the
  // railway-side range and the bridge galleries is open ground from the street up: the tower
  // stands there, and goes on down past the lower level. The store is north of its foot.
  G240(g) {
    const sec = r => Object.assign(r, { secret: true, floor: 'X' });
    const pass = sec(add({ id: 'X-pass', gallery: 'Unlisted passage', kind: 'room', use: 'corridor', passage: true, building: 'main', floor: 'X', x0: g.x0, x1: r2(g.x0 + 2.5), z0: r2(g.z0 - 6.3), z1: r2(g.z0 - 0.4), y: g.y, h: 3.4 }));
    const T0 = { x0: r2(g.x0 + 0.4), x1: r2(g.x0 + 5.4), z0: r2(pass.z0 - 12.4), z1: r2(pass.z0 - 0.4) };
    const stair = sec(stairwell('X-stair', 'Service stair', T0, [DEEP, 0, g.y], 'main'));
    const cx = r2((stair.x0 + stair.x1) / 2);
    const vault = sec(add({ id: 'X-vault', gallery: 'Sub-level 9 storage', kind: 'room', use: 'secret', building: 'lower', floor: 'X', x0: cx - 12, x1: cx + 12, z0: r2(stair.z0 - 20.4), z1: r2(stair.z0 - 0.4), y: DEEP, h: VAULT_H }));
    const lab = sec(add({ id: 'X-lab', gallery: 'Specimen room', kind: 'room', use: 'secret', building: 'lower', floor: 'X', x0: r2(vault.x0 - 10.4), x1: r2(vault.x0 - 0.4), z0: vault.z0 + 2, z1: vault.z0 + 11, y: DEEP, h: VAULT_H }));
    const brief = sec(add({ id: 'X-brief', gallery: 'Debriefing room', kind: 'room', use: 'secret', building: 'lower', floor: 'X', x0: r2(vault.x1 + 0.4), x1: r2(vault.x1 + 8.4), z0: vault.z0 + 2, z1: vault.z0 + 11, y: DEEP, h: VAULT_H }));
    const door = d => { doors.push({ ...d, secret: true }); };
    door({ a: 'X-pass', b: g.id, along: 'z', x0: r2(g.x0 + 0.4), x1: r2(g.x0 + 2.2), z0: pass.z1, z1: g.z0, y: g.y, h: 3, hidden: true });
    door({ a: 'X-stair', b: 'X-pass', along: 'z', x0: r2(stair.x0 + 0.2), x1: r2(stair.x0 + 2), z0: stair.z1, z1: pass.z0, y: g.y, h: 2.8 });
    door({ a: 'X-vault', b: 'X-stair', along: 'z', x0: r2(cx - 0.9), x1: r2(cx + 0.9), z0: vault.z1, z1: stair.z0, y: DEEP, h: 3.2 });
    door({ a: 'X-lab', b: 'X-vault', along: 'x', x0: lab.x1, x1: vault.x0, z0: r2(lab.z0 + 3.6), z1: r2(lab.z0 + 5.4), y: DEEP, h: 3.2 });
    door({ a: 'X-vault', b: 'X-brief', along: 'x', x0: vault.x1, x1: brief.x0, z0: r2(brief.z0 + 3.6), z1: r2(brief.z0 + 5.4), y: DEEP, h: 3.2 });
    return [pass, stair, vault, lab, brief, ...BASE(brief, sec, door)];
  },
};
// ---- 8a. and further: Project Green Cheese (docs/FINALE.md) ----
// A blast door in the east wall of the Debriefing room, a tunnel east under the railway cutting and Columbus Drive,
// and a base under Butler Field in two storeys: the upper at the depth of Sub-level 9, the lower six metres under it,
// where the hangar is, a storey and a half tall, under the silo in the ballfield's centre field (src/finaleplan.js
// has the silo, its doors and the saucer, which are not rooms). The base's rooms are `B-`, so that the map can keep
// them off it until the blast door has been opened (src/map.js). All of it is `secret`, behind the same hidden doorway.
const LOWER = DEEP - 6;
function BASE(brief, sec, door) {
  const room = (id, gallery, x0, x1, z0, z1, o = {}) => sec(add({ id, gallery, kind: 'room', use: 'secret', building: 'lower', floor: 'X', x0, x1, z0, z1, y: DEEP, h: 5, ...o }));
  const way = { use: 'corridor', passage: true };
  const zm = r2((brief.z0 + brief.z1) / 2);
  const tunnel = room('B-tunnel', 'Tunnel', r2(brief.x1 + 0.4), 299.6, r2(zm - 2.2), r2(zm + 2.2), { ...way, h: 4.6 });
  const check = room('B-check', 'Security checkpoint', 300, 318, 62, 88);
  const conc = room('B-conc', 'Concourse', 318.4, 438, 71.6, 78.6, way);
  const north = [['B-labA', 'Laboratory', 322, 346], ['B-labB', 'Crystal laboratory', 346.4, 372], ['B-crew', 'Crew quarters', 372.4, 396], ['B-mess', 'Mess hall', 396.4, 416], ['B-power', 'Generator hall', 416.4, 438, { h: 6 }]]
    .map(([id, name, x0, x1, o]) => room(id, name, x0, x1, 48, 71.2, o));
  const south = [['B-bay', 'Robot bay', 322, 352], ['B-records', 'Records room', 352.4, 384], ['B-stores', 'Stores', 384.4, 421.6]].map(([id, name, x0, x1]) => room(id, name, x0, x1, 79, 112));
  const sway = room('B-way', 'Service way', 422, 429, 79, 144.6, way);
  const office = room('B-office', 'Office of the Director, special projects', 429.4, 452, 79, 95.6);
  const sit = room('B-sit', 'Situation room', 429.4, 452, 96, 144.6);
  const ctrl = room('B-ctrl', 'Control room', 418, 446, 145, 155.6);
  const hangar = room('B-hangar', 'Hangar', 410, 454, 156, 196, { y: LOWER, h: 12 });
  const archive = room('B-archive', 'Archive', 366, 409.6, 160, 192, { y: LOWER, h: 5.5 });
  const mid = (r, w) => [r2((r.x0 + r.x1) / 2 - w / 2), r2((r.x0 + r.x1) / 2 + w / 2)];
  const midz = (r, w) => [r2((r.z0 + r.z1) / 2 - w / 2), r2((r.z0 + r.z1) / 2 + w / 2)];
  // The blast door: shut, and opened with a card (src/finale.js).
  door({ a: brief.id, b: tunnel.id, along: 'x', x0: brief.x1, x1: tunnel.x0, z0: r2(zm - 1.2), z1: r2(zm + 1.2), y: DEEP, h: 3.2, blast: true });
  door({ a: tunnel.id, b: check.id, along: 'x', x0: tunnel.x1, x1: check.x0, z0: r2(zm - 1.2), z1: r2(zm + 1.2), y: DEEP, h: 3.2 });
  door({ a: check.id, b: conc.id, along: 'x', x0: check.x1, x1: conc.x0, z0: 74, z1: 76.2, y: DEEP, h: 3.2 });
  for (const r of north) { const [x0, x1] = mid(r, 2.2); door({ a: r.id, b: conc.id, along: 'z', x0, x1, z0: r.z1, z1: conc.z0, y: DEEP, h: 3.2 }); }
  for (const r of south) { const [x0, x1] = mid(r, 2.2); door({ a: conc.id, b: r.id, along: 'z', x0, x1, z0: conc.z1, z1: r.z0, y: DEEP, h: 3.2 }); }
  door({ a: conc.id, b: sway.id, along: 'z', x0: 424.6, x1: 426.4, z0: conc.z1, z1: sway.z0, y: DEEP, h: 3.2 });
  door({ a: sway.id, b: office.id, along: 'x', x0: sway.x1, x1: office.x0, z0: 86.4, z1: 88.2, y: DEEP, h: 3 });
  door({ a: sway.id, b: sit.id, along: 'x', x0: sway.x1, x1: sit.x0, z0: 126, z1: 128.2, y: DEEP, h: 3.2 });
  door({ a: sway.id, b: ctrl.id, along: 'z', x0: 424.6, x1: 426.4, z0: sway.z1, z1: ctrl.z0, y: DEEP, h: 3.2 });
  // From the control room into the hangar, a storey up its north wall: a long window (glazed, src/finaleplan.js) and a door
  // beside it, both onto the gantry that runs along that wall; a stair down the east wall to the hangar floor.
  door({ a: ctrl.id, b: hangar.id, along: 'z', x0: 421, x1: 437, z0: ctrl.z1, z1: hangar.z0, y: DEEP, h: 2.6, window: true });
  door({ a: ctrl.id, b: hangar.id, along: 'z', x0: 439, x1: 440.8, z0: ctrl.z1, z1: hangar.z0, y: DEEP, h: 2.6 });
  deck('B-gantry', hangar.id, { x0: hangar.x0, x1: hangar.x1, z0: hangar.z0, z1: hangar.z0 + 3 }, DEEP, ['s']);
  ramp('B-hangar-stair', hangar.id, hangar.x1 - 3.2, hangar.x1, hangar.z0 + 3, hangar.z0 + 21.2, 'z', DEEP, LOWER);
  // And from the hangar floor, wide open, into the archive beside it.
  { const [z0, z1] = midz(archive, 20); door({ a: archive.id, b: hangar.id, along: 'x', x0: archive.x1, x1: hangar.x0, z0, z1, y: LOWER, h: 5 }); }
  return [tunnel, check, conc, ...north, ...south, sway, office, sit, ctrl, hangar, archive];
}
let secret = null;
{
  const before = { rooms: rooms.length, doors: doors.length, decks: decks.length, ramps: ramps.length };
  const saved = JSON.parse(readFileSync(here('../data/collection.json'), 'utf8'));
  const first = firstClue(saved.works || []);
  const g = first && rooms.find(r => r.kind === 'gallery' && r.gallery === first.work.g);
  if (!first) console.log('nothing on the list in src/secretclue.js is in the saved copy: no passage built');
  else if (!g || !SITES[g.id]) console.log(`no site is drawn in tools/build_layout.mjs for ${first.work.g} (“${first.work.t}”): no passage built`);
  else {
    const made = SITES[g.id](g);
    // It must stand clear of everything that was there before it, by a wall's thickness, at every height it passes.
    for (const r of made) for (const o of rooms) {
      if (made.includes(o) || !(r.y < o.top + SLAB - 0.01 && o.y < r.top + SLAB - 0.01) || !over(r, o, 0.39)) continue;
      throw new Error(`the secret ${r.id} runs into ${o.id}`);
    }
    // And of every way in from the street: a tower in front of a door would be no secret.
    for (const r of made) if (r.top > 0.5) for (const d of doors) if (d.b === 'out' && over(d, r, 4)) throw new Error(`the secret ${r.id} stands in front of an outside door of ${d.a}`);
    secret = { room: g.id, gallery: g.gallery, work: first.work.id, title: first.work.t, y: DEEP, rooms: made.map(r => r.id) };
    console.log(`behind ${g.gallery} (“${first.work.t}”): ${rooms.length - before.rooms} rooms, ${doors.length - before.doors} doorways, ${ramps.length - before.ramps} flights and ${decks.length - before.decks} landings that are on no drawing`);
  }
}

// ---- 8b. one name, one room ------------------------------------------------
// Rooms on one level that the survey gives the same name (the Ryan Learning Center's three studios,
// two blocks of restrooms, the plant rooms numbered per zone) are told apart by where they stand:
// two or three by west, middle and east (or north and south), more by number from west to east.
// Galleries keep their own names, and the service corridors are passages nobody needs to tell apart.
{
  const base = n => n.replace(/ \d+$/, ''), groups = new Map();
  for (const r of rooms) if (r.kind !== 'gallery' && !r.passage && !r.secret) { const k = r.floor + '|' + base(r.gallery); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(r); }
  const mid = (r, a) => (r[a + '0'] + r[a + '1']) / 2;
  for (const list of groups.values()) {
    if (list.length < 2 || new Set(list.map(r => r.gallery)).size === list.length) continue;
    const spread = a => Math.max(...list.map(r => mid(r, a))) - Math.min(...list.map(r => mid(r, a))), ax = spread('x') >= spread('z') ? 'x' : 'z';
    list.sort((p, q) => mid(p, ax) - mid(q, ax));
    const name = base(list[0].gallery), words = list.length === 2 ? (ax === 'x' ? ['west', 'east'] : ['north', 'south']) : list.length === 3 ? (ax === 'x' ? ['west', 'middle', 'east'] : ['north', 'middle', 'south']) : null;
    // "Ryan Learning Center, studio" becomes "Ryan Learning Center, west studio"; "Restrooms", "Restrooms, west".
    list.forEach((r, i) => { r.gallery = !words ? `${name} ${i + 1}` : /, [^,]+$/.test(name) ? name.replace(/, ([^,]+)$/, `, ${words[i]} $1`) : `${name}, ${words[i]}`; });
  }
}

// ---- 9. write it down ------------------------------------------------------

const out = {
  made: new Date().toISOString().slice(0, 10),
  levels: LEVELS,
  rooms: rooms.map(r => ({ id: r.id, gallery: r.gallery, floor: r.floor, building: r.building, kind: r.kind, x0: r.x0, x1: r.x1, z0: r.z0, z1: r.z1, y: r.y, h: r2(r.h),
    ...(r.glass ? { glass: r.glass } : {}), ...(r.passage ? { passage: true } : {}), ...(r.use ? { use: r.use } : {}), ...(r.assumed ? { assumed: true } : {}), ...(r.secret ? { secret: true } : {}) })),
  doors: doors.map(({ side, ...d }) => d),
  decks, ramps, lifts,
  ...(secret ? { secret } : {}),
};
const lines = s => JSON.stringify(s).replace(/\{"id"/g, '\n  {"id"').replace(/\{"a"/g, '\n  {"a"');
writeFileSync(here('../src/layout.js'), `// Generated by tools/build_layout.mjs on ${out.made} from the survey in survey/.\n// Do not edit by hand: change the survey or the tool and run it again.\n\nexport default ${lines(out)};\n`);

const sum = f => rooms.filter(r => r.floor === f);
for (const f of ['LL', '1', '2', '3', 'X']) if (sum(f).length) console.log(`level ${f.padEnd(2)}: ${String(sum(f).length).padStart(3)} rooms, ${Math.round(sum(f).reduce((s, r) => s + area(r), 0)).toLocaleString()} m2`);
console.log(`${rooms.length} rooms (${passages} passages added), ${doors.filter(d => d.b !== 'out').length} doorways (${forced} forced), ${doors.filter(d => d.b === 'out').length} to outside, ${decks.length} decks, ${ramps.length} flights, ${lifts.length} lifts`);
console.log('flights and lifts added to join levels:', [...ramps.filter(q => /-down$/.test(q.id) && q.id !== 'G200-down').map(q => q.id), ...lifts.filter(l => /-lift$/.test(l.id)).map(l => l.id)].join(' ') || 'none');
if (dropped.length) console.log(`left out (${dropped.length}): ${dropped.map(d => d + (why[d] ? '<' + why[d] : '')).join(' ')}`);
