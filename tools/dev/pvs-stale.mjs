#!/usr/bin/env node
// Is data/pvs.json (the table ?cull reads: tools/dev/pvs.mjs) still good? To be run before a build is published.
//   node tools/dev/pvs-stale.mjs            by the sources alone: have the files that draw the plan, or any source file, changed since the table was made?
//   node tools/dev/pvs-stale.mjs 8896       and by the game itself, run headless from a served checkout with ?cull: does it accept the table, and is every wall
//                                           the table counts on still standing where it stood? (This is the answer that counts: the game makes the same test
//                                           every time it starts, and draws everything if the table fails it.)
// Exit code 0: good.  1: THE TABLE IS STALE (make it again: node tools/dev/pvs.mjs <port>).  2: could not tell (sources have changed; give it a port).
import fs from 'fs'; import path from 'path';
import { sources } from './pvs.mjs';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..'), port = process.argv.slice(2).find(a => /^\d+$/.test(a));
let pvs; try { pvs = JSON.parse(fs.readFileSync(path.join(root, 'data/pvs.json'), 'utf8')); } catch { console.log('THE TABLE IS STALE: there is no data/pvs.json (?cull draws everything)'); process.exit(1); }
const now = sources(root), was = pvs.src || { files: {} }, changed = Object.keys({ ...now.files, ...was.files }).filter(f => now.files[f] !== was.files[f]);
console.log(`data/pvs.json: made ${pvs.when || '?'} for the plan of ${pvs.made}, ${pvs.rooms} rooms, ${pvs.bins.length} bins, ${pvs.occ.length} walls counted on, ${Object.keys(pvs.of).length} places`);
let code = 0;
if (now.plan !== was.plan) { console.log('THE TABLE IS STALE: the plan\'s sources have changed since it was made (' + changed.filter(f => /src\/(layout|shut|plan)\.js$/.test(f)).join(', ') + ')'); code = 1; }
else if (changed.length) { console.log(`${changed.length} source file${changed.length > 1 ? 's have' : ' has'} changed since it was made (the plan's have not): ${changed.slice(0, 12).join(', ')}${changed.length > 12 ? ', ...' : ''}`); code = 2; }
else console.log('no source file has changed since it was made');
if (port) {
  const PUP = process.env.PUPPETEER || '/Users/cfreder2/.nvm/versions/node/v24.10.0/lib/node_modules/@mermaid-js/mermaid-cli/node_modules/puppeteer/lib/esm/puppeteer/puppeteer.js';
  const puppeteer = (await import(PUP)).default, b = await puppeteer.launch({ headless: 'new', protocolTimeout: 600000, args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
  try {
    const p = await b.newPage(); await p.setViewport({ width: 640, height: 400 }); await p.setRequestInterception(true); p.on('request', q => (/supabase/.test(q.url()) ? q.abort() : q.continue()));
    await p.evaluateOnNewDocument(() => { try { localStorage.clear(); } catch {} });
    await p.goto(`http://127.0.0.1:${port}/?saved&noopen&nofps&cull`, { waitUntil: 'domcontentloaded' });
    await p.waitForFunction('window.__ah && window.__ah.state === "title" && !document.querySelector(\'button[data-act="start"]\').disabled', { timeout: 300000, polling: 200 });
    for (let i = 0; i < 80; i++) { if (await p.evaluate(() => window.__ah.state) === 'play') break; await p.evaluate(() => { const q = document.querySelector('button[data-act="start"]'); if (q && !q.disabled) q.click(); }); await new Promise(r => setTimeout(r, 250)); }
    await new Promise(r => setTimeout(r, 5000));
    const s = await p.evaluate(() => { const v = window.__ah.vis; return v ? { ok: v.ok, why: v.why, live: v.live, missing: v.missing, walls: v.walls ? v.walls.size : 0, fixed: v.count, never: v.never, seen: v.seen, sig: v.sig } : null; });
    if (!s) { console.log('THE TABLE IS STALE: the game did not take it up at all (is the port serving this checkout?)'); code = 1; }
    else if (!s.ok) { console.log('THE TABLE IS STALE: the game refuses it (' + s.why + ') and draws everything'); code = 1; }
    else if (s.missing) { console.log(`THE TABLE IS STALE: ${s.missing} of the ${s.walls} walls it counts on are not in the game as it stands; the game draws everything`); code = 1; }
    else if (!s.live) { console.log('THE TABLE IS STALE: a wall it counts on is hidden or has moved at the start of play; the game draws everything'); code = 1; }
    else { console.log(`the game accepts it: all ${s.walls} walls stand where they stood; ${s.fixed} of ${s.seen} things are filed and can be hidden (${s.never} never are); the camera at the start is filed under ${s.sig}`); code = 0; }
  } finally { await b.close(); }
}
console.log(code === 0 ? 'GOOD' : code === 1 ? 'STALE' : 'CANNOT TELL: run it with the port of a served checkout');
process.exit(code);
