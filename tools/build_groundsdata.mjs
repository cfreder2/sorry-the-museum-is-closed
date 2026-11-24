#!/usr/bin/env node
// Turns the OpenStreetMap survey of the grounds (tools/survey/grounds-osm.json, fetched by tools/fetch_grounds.mjs)
// into the small table the game reads (src/groundsdata.js): where the real trees, benches, flagpoles, bike racks and
// hedges stand, in the galleries' frame, west of Columbus Drive, where the game's ground is the real ground. (East of
// it the game's park is squeezed, so the real pattern is used there, not the real positions: src/groundsplan.js.)
//   node tools/build_groundsdata.mjs
// Map data © OpenStreetMap contributors, ODbL.
import fs from 'node:fs';
const d = JSON.parse(fs.readFileSync(new URL('./survey/grounds-osm.json', import.meta.url)));
const inBox = n => n.x >= -28 && n.x <= 296 && n.z >= -42 && n.z <= 262, r1 = v => Math.round(v * 10) / 10;
const N = d.nodes.filter(inBox), pick = f => N.filter(n => f(n.tags)).map(n => [r1(n.x), r1(n.z)]);
const out = {
  trees: pick(t => t.natural === 'tree'),
  benches: N.filter(n => n.tags.amenity === 'bench').map(n => [r1(n.x), r1(n.z), n.tags.direction != null ? +n.tags.direction || 0 : -1]),
  flagpoles: pick(t => t.man_made === 'flagpole'),
  racks: pick(t => t.amenity === 'bicycle_parking'),
  docks: pick(t => t.amenity === 'bicycle_rental'),
  bins: pick(t => t.amenity === 'waste_basket'),
  boards: pick(t => t.tourism === 'information'),
  lamps: pick(t => t.highway === 'street_lamp'),
  hedges: d.ways.filter(w => w.tags.barrier === 'hedge' && w.pts.some(p => p[0] >= -28 && p[0] <= 296 && p[1] >= -42 && p[1] <= 262)).map(w => w.pts.map(p => [r1(p[0]), r1(p[1])])),
  beds: d.ways.filter(w => (w.tags.leisure === 'garden' || w.tags.landuse === 'flowerbed') && w.pts.length > 3 && w.pts.every(p => p[0] >= -28 && p[0] <= 296 && p[1] >= -42 && p[1] <= 262)).map(w => { const xs = w.pts.map(p => p[0]), zs = w.pts.map(p => p[1]); return [r1(Math.min(...xs)), r1(Math.max(...xs)), r1(Math.min(...zs)), r1(Math.max(...zs))]; }).filter(b => (b[1] - b[0]) * (b[3] - b[2]) < 900),
};
const lines = Object.entries(out).map(([k, v]) => `  ${k}: ${JSON.stringify(v)},`);
fs.writeFileSync(new URL('../src/groundsdata.js', import.meta.url), `// Where the real things stand west of Columbus Drive, from OpenStreetMap, in the galleries' frame ([x, z] in metres;
// a bench also has the way it faces in degrees from north, or -1; a hedge is a line of points; a bed is [x0, x1, z0, z1]).
// Written by tools/build_groundsdata.mjs from tools/survey/grounds-osm.json: do not edit by hand.
// Map data © OpenStreetMap contributors, ODbL (fetched ${d.fetched ? String(d.fetched).slice(0, 10) : ''}).
export const REAL = {\n${lines.join('\n')}\n};\n`);
console.log(Object.fromEntries(Object.entries(out).map(([k, v]) => [k, v.length])));
if (process.argv.includes('--list')) for (const k of ['benches', 'flagpoles', 'racks', 'docks', 'bins', 'boards', 'beds']) console.log(k, JSON.stringify(out[k]));
