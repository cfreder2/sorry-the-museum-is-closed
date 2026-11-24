#!/usr/bin/env node
// Gathers what the map knows about the grounds around the museum: trees, benches, lamps,
// hedges, paths, artworks, memorials, the harbour's furniture.
//
//   node tools/fetch_grounds.mjs         writes tools/survey/grounds-osm.json
//
// One public record, put into the game frame (metres; x east, z south):
//   OpenStreetMap, through the Overpass API          (c) OpenStreetMap contributors, ODbL
//
// Plain Node 24, no dependencies. One request per endpoint attempt, at most three tries each.

import { writeFileSync } from 'node:fs';

const AGENT = 'grounds-survey-script/1.0 (hobby game research)';
const ENDPOINTS = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter'];
const S = 41.8770, W = -87.6262, N = 41.8832, E = -87.6120;
const KX = 111320 * Math.cos(41.879 * Math.PI / 180), KZ = 110950;
const r1 = v => Math.round(v * 10) / 10;
const xz = (lat, lon) => [r1((lon + 87.623993587801) * KX + 20), r1(212.3 - (lat - 41.8786621052) * KZ)];

// What is asked for. [key, values-regex or null for "any value", element kinds]
const WANT = [
  ['natural', 'tree|tree_row|shrub|scrub', 'nw'],
  ['amenity', 'bench|waste_basket|drinking_water|bicycle_parking|bicycle_rental|fountain|shelter|kiosk|toilets|boat_storage', 'nw'],
  ['highway', 'street_lamp', 'nw'],
  ['highway', 'footway|path|cycleway|pedestrian|steps', 'w'],
  ['barrier', 'hedge|wall|fence|bollard|retaining_wall|chain', 'nw'],
  ['leisure', 'garden|playground|pitch|park|marina|slipway|picnic_table|yacht_club', 'nw'],
  ['tourism', 'artwork|information', 'nw'],
  ['historic', 'memorial|monument', 'nw'],
  ['man_made', 'flagpole|pier', 'nw'],
  ['landuse', 'grass|flowerbed', 'nw'],
  ['emergency', 'life_ring', 'nw'],
  ['club', 'sailing', 'nw'],
  ['seamark:type', null, 'nw'],
];
const kinds = { n: 'node', w: 'way' };
const query = `[out:json][timeout:90][bbox:${S},${W},${N},${E}];\n(\n` + WANT.flatMap(([k, v, el]) =>
  [...el].map(c => `  ${kinds[c]}["${k}"${v ? `~"^(${v})$"` : ''}];`)).join('\n') + `\n);\nout geom qt;`;

const sleep = ms => new Promise(r => setTimeout(r, ms));
async function ask() {
  let last;
  for (const url of ENDPOINTS) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const r = await fetch(url, {
          method: 'POST',
          headers: { 'User-Agent': AGENT, 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
          body: 'data=' + encodeURIComponent(query),
          signal: AbortSignal.timeout(120000),
        });
        if (!r.ok) throw new Error('HTTP ' + r.status);
        const j = await r.json();
        if (!Array.isArray(j.elements)) throw new Error('no elements in the answer');
        if (j.remark) console.warn('remark from the server:', j.remark);
        console.log(`answered by ${new URL(url).host} on try ${attempt}`);
        return j;
      } catch (e) {
        last = e;
        console.warn(`${new URL(url).host} try ${attempt}: ${e.message}`);
        if (attempt < 3) await sleep(5000 * 2 ** (attempt - 1));    // 5 s, then 10 s
      }
    }
  }
  throw new Error('Overpass could not be reached: ' + (last && last.message));
}

const j = await ask();
const nodes = [], ways = [], counts = {};
const tally = tags => {
  for (const [k, v] of WANT) {
    if (k === 'seamark:type') { if (Object.keys(tags).some(t => t.startsWith('seamark'))) counts['seamark'] = (counts['seamark'] || 0) + 1; continue; }
    if (tags[k] && new RegExp(`^(${v})$`).test(tags[k])) counts[`${k}=${tags[k]}`] = (counts[`${k}=${tags[k]}`] || 0) + 1;
  }
};
for (const e of j.elements) {
  const tags = e.tags || {};
  for (const k of Object.keys(tags)) if (/^(brand|network|operator)(:|$)/.test(k) || (k.startsWith('name') && tags.amenity === 'bicycle_rental')) delete tags[k];      // what is where, not whose it is
  if (e.type === 'node') {
    const [x, z] = xz(e.lat, e.lon);
    nodes.push({ id: e.id, x, z, lon: e.lon, lat: e.lat, tags }); tally(tags);
  } else if (e.type === 'way' && e.geometry) {
    ways.push({ id: e.id, tags, pts: e.geometry.filter(Boolean).map(p => xz(p.lat, p.lon)) }); tally(tags);
  }
}
nodes.sort((a, b) => a.id - b.id); ways.sort((a, b) => a.id - b.id);
const sorted = Object.fromEntries(Object.entries(counts).sort((a, b) => a[0] < b[0] ? -1 : 1));

const out = {
  fetched: new Date().toISOString(),
  source: 'OpenStreetMap contributors, ODbL',
  bbox: [S, W, N, E],
  frame: 'x = (lon + 87.623993587801) * 111320 * cos(41.879 deg) + 20 ; z = 212.3 - (lat - 41.8786621052) * 110950 ; metres, x east, z south',
  counts: sorted, nodes, ways,
};
const file = new URL('./survey/grounds-osm.json', import.meta.url);
writeFileSync(file, JSON.stringify(out).replace(/\},\{"id"/g, '},\n{"id"'));
console.log(`${nodes.length} nodes, ${ways.length} ways -> tools/survey/grounds-osm.json`);
console.log(sorted);
