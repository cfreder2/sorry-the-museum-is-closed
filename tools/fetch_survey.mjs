#!/usr/bin/env node
// Gathers the measured facts the true-to-scale building is drawn from.
//
//   node tools/fetch_survey.mjs          writes survey/outline.json and survey/galleries.json
//
// Two public records, put into one frame (metres; x east, z south; the same
// origin the game has always used, so nothing outdoors has to move):
//
//   OpenStreetMap   the outline of the building and of its named parts, the
//                   railway and the streets          (c) OpenStreetMap contributors, ODbL
//   the museum API  every gallery's number, floor and position, including the
//                   ones with no public-domain art in them, which the old plan left out
//
// Drawings (plans, sections) are not fetched or kept here: see survey/README.md.

import { writeFileSync, readFileSync } from 'node:fs';

const AGENT = 'Sorry, the Museum is Closed (hobby browser game)';
const get = async (u, json = true) => { const r = await fetch(u, { headers: { 'User-Agent': AGENT, 'AIC-User-Agent': AGENT } }); if (!r.ok) throw new Error(r.status + ' ' + u); return json ? r.json() : r.text(); };
const BOX = [-87.6250, 41.8765, -87.6195, 41.8815];           // west, south, east, north
const KX = 111320 * Math.cos(41.879 * Math.PI / 180), KZ = 110950;
const r1 = v => Math.round(v * 10) / 10, r2 = v => Math.round(v * 100) / 100;

// ---- the galleries ----------------------------------------------------------
const all = [];
for (let page = 1; ; page++) {
  const j = await get(`https://api.artic.edu/api/v1/galleries?limit=100&page=${page}`);
  all.push(...j.data);
  if (page >= j.pagination.total_pages) break;
  await new Promise(r => setTimeout(r, 400));
}

// ---- the frame --------------------------------------------------------------
// The game's origin was first fixed by the old generator. It is recovered here from the plan that
// generator wrote: the second-floor rooms were never moved, so each sits on its gallery's true spot.
const old = readFileSync(new URL('../src/layout.js', import.meta.url), 'utf8');
const LAY = JSON.parse(old.slice(old.indexOf('{'), old.lastIndexOf('}') + 1));
const byTitle = Object.fromEntries(LAY.rooms.map(r => [r.gallery, r]));
const median = a => a.sort((p, q) => p - q)[a.length >> 1];
const dx = [], dz = [];
for (const g of all) {
  const r = byTitle[g.title];
  if (!r || !g.latitude || r.floor !== '2' || r.building !== 'main' || /^Gallery (200|237|238)$/.test(g.title)) continue;
  dx.push((r.x0 + r.x1) / 2 - g.longitude * KX); dz.push((r.z0 + r.z1) / 2 + g.latitude * KZ);
}
const OX = median(dx), OZ = median(dz);
const xz = (lat, lon) => [lon * KX + OX, OZ - lat * KZ];

// ---- the map ----------------------------------------------------------------
const xml = await get(`https://www.openstreetmap.org/api/0.6/map?bbox=${BOX.join(',')}`, false);
const nodes = {};
for (const m of xml.matchAll(/<node id="(\d+)"[^>]*? lat="([-\d.]+)" lon="([-\d.]+)"/g)) nodes[m[1]] = xz(+m[2], +m[3]);
const ways = [];
for (const m of xml.matchAll(/<way id="(\d+)"[^>]*>([\s\S]*?)<\/way>/g)) {
  const tags = Object.fromEntries([...m[2].matchAll(/<tag k="([^"]+)" v="([^"]*)"/g)].map(t => [t[1], t[2].replace(/&quot;/g, '"').replace(/&amp;/g, '&')]));
  const pts = [...m[2].matchAll(/<nd ref="(\d+)"/g)].map(n => nodes[n[1]]).filter(Boolean);
  ways.push({ id: m[1], tags, pts });
}
const OUTER = '23891004', COURT = '139013466';                 // the museum's outline, and McKinlock Court inside it
const PART = /Modern|Americas|Stock Exchange|Rubloff|Fullerton|Ryerson|Alsdorf|Ryan|Special Ex|Contemporary|Film and Media|Sculpture Court|Shop/;
const area = p => Math.abs(p.reduce((s, q, i) => i ? s + p[i - 1][0] * q[1] - q[0] * p[i - 1][1] : 0, 0)) / 2;
const shape = w => ({ id: w.id, name: w.tags.name || '', level: w.tags.level || '', area: Math.round(area(w.pts)), pts: w.pts.map(p => [r2(p[0]), r2(p[1])]) });
const outer = ways.find(w => w.id === OUTER), court = ways.find(w => w.id === COURT);
if (!outer || !court) throw new Error('the museum outline is not where it was on the map');
// How far the building's own grid is turned from true north: the length-weighted lean of its long walls.
let sx = 0, sy = 0;
for (let i = 1; i < outer.pts.length; i++) {
  const ex = outer.pts[i][0] - outer.pts[i - 1][0], ez = outer.pts[i][1] - outer.pts[i - 1][1], len = Math.hypot(ex, ez);
  if (len < 12) continue;
  const a = Math.atan2(ez, ex) * 4;                             // walls at right angles all count the same
  sx += Math.cos(a) * len; sy += Math.sin(a) * len;
}
const turn = Math.atan2(sy, sx) / 4;

writeFileSync(new URL('../survey/outline.json', import.meta.url), JSON.stringify({
  note: 'Map data (c) OpenStreetMap contributors, ODbL 1.0. Metres; x east, z south; the game frame.',
  made: new Date().toISOString().slice(0, 10), frame: { OX, OZ, KX, KZ }, turnDegrees: r2(turn * 180 / Math.PI),
  outline: shape(outer), court: shape(court),
  parts: ways.filter(w => w.id !== OUTER && w.id !== COURT && PART.test(w.tags.name || '') && w.pts.length > 3).map(shape),
  rail: ways.filter(w => w.tags.railway).map(w => w.pts.map(p => [r1(p[0]), r1(p[1])])),
  streets: ways.filter(w => /^(primary|secondary|tertiary|residential|trunk)$/.test(w.tags.highway || '') && w.tags.name).map(w => ({ name: w.tags.name, pts: w.pts.map(p => [r1(p[0]), r1(p[1])]) })),
}));
writeFileSync(new URL('../survey/galleries.json', import.meta.url), JSON.stringify(all.filter(g => g.latitude).map(g => {
  const [x, z] = xz(+g.latitude, +g.longitude);
  return { id: g.id, title: g.title, number: g.number, floor: g.floor, closed: g.is_closed, x: r1(x), z: r1(z) };
}), null, 0).replace(/\},/g, '},\n'));
const per = {}; for (const g of all) if (g.latitude) per[g.floor] = (per[g.floor] || 0) + 1;
console.log(`outline ${Math.round(area(outer.pts) - area(court.pts))} m2 on the ground, turned ${(turn * 180 / Math.PI).toFixed(2)} degrees; galleries`, per);
