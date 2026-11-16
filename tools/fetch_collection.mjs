#!/usr/bin/env node
// Saves the copy of the collection the game falls back to when the Art
// Institute's API cannot be reached. Run from anywhere:
//
//   node tools/fetch_collection.mjs            the list of works
//   node tools/fetch_collection.mjs --images   and an offline copy of every image (about 35 MB,
//                                              kept out of git; for a kiosk, or a network that
//                                              cannot reach artic.edu)
//
// It asks the API the same questions the game asks at start-up, keeps only the
// works the rooms can hold, and writes data/collection.json.

import { writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { fetchLive, trim, curate, remoteUrl, AGENT } from '../src/collection.js';
import { buildPlan, hang } from '../src/plan.js';

const raw = trim(await fetchLive());
const out = fileURLToPath(new URL('../data/collection.json', import.meta.url));
writeFileSync(out, JSON.stringify(raw));

const c = curate(raw);
const placed = hang(buildPlan(), c);
console.log(`${raw.works.length} works saved, ${placed.length} hung`);
for (const [id, r] of Object.entries(c.rooms)) {
  const n = placed.filter(p => p.room === id).length;
  console.log(`  ${id}  ${r.gallery.padEnd(12)} ${String(n).padStart(2)} of ${String(r.works.length).padStart(2)} hung  ${r.names.join(', ')}`);
}
console.log(`  hall ${placed.filter(p => p.room === 'hall').length} of ${c.hall.length}`);
console.log(`  miniature rooms ${placed.filter(p => p.room === 'C').length} of ${c.corridor.length}`);
for (const p of placed.filter(p => p.room === 'hall')) console.log(`     hall: ${p.work.t.slice(0, 50)} — ${p.work.a} ${p.w.toFixed(1)}×${p.h.toFixed(1)} m`);

if (process.argv.includes('--images')) {
  const dir = fileURLToPath(new URL('../data/img/', import.meta.url));
  mkdirSync(dir, { recursive: true });
  const size = 843;                      // the size the museum asks apps to use, and keeps cached
  let got = 0, had = 0, bad = 0;
  for (const p of placed) {
    const file = `${dir}${p.work.img}-${size}.jpg`;
    if (existsSync(file)) { had++; continue; }
    const res = await fetch(remoteUrl(p.work, size), { headers: { 'User-Agent': AGENT } });
    if (!res.ok) { bad++; console.log(`  ${res.status} ${p.work.t}`); continue; }
    writeFileSync(file, Buffer.from(await res.arrayBuffer()));
    got++;
    if (got % 25 === 0) console.log(`  ${got + had} of ${placed.length} images`);
    await new Promise(r => setTimeout(r, 150));      // one at a time, unhurried
  }
  const ids = readdirSync(dir).filter(f => f.endsWith(`-${size}.jpg`)).map(f => f.slice(0, -`-${size}.jpg`.length));
  writeFileSync(dir + 'index.json', JSON.stringify({ sizes: [size], ids }));
  console.log(`images: ${got} fetched, ${had} already here, ${bad} refused`);
}
