// The data for the map of the building: every room, door and thing to find, read off the running game.
//
//   python3 tools/dev/serve.py 8895 "$PWD" &            (serve the checkout you want mapped)
//   node tools/dev/roommap/dump.mjs 8895 map-data.json   (boots it headless with ?noopen&saved&nofps, writes the file)
//
// The whole file is made again in one run; run it after every build. What it reads, and from where:
//   dump.page.js   runs in the page: the plan, the hang, G.spots(), each feature's own state, and the tables of what
//                  cannot be read off the game (a sentence for each kind of thing, keyed by the game's ids)
//   srctext.js     reads the game's words out of its source as it is served (what is only ever said: say, once, callout)
//   life.json      one sentence for each living painting, by the museum's id of the work (from its file in src/life/)
//   shut-rooms.json  the rooms that are shut: used only if the game served has no src/shut.js of its own and the
//                  branch shut-doors is not there to read it from
// It prints the counts, the checks it made, and a warning for everything the game has that the tables do not know.
// Environment: ROOMMAP_WS=<a puppeteer browser's ws endpoint> uses a game already booted there (for working on this).
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const [,, port = '8895', outFile = 'map-data.json'] = process.argv;
const PUP = process.env.PUPPETEER || '/Users/cfreder2/.nvm/versions/node/v24.10.0/lib/node_modules/@mermaid-js/mermaid-cli/node_modules/puppeteer/lib/esm/puppeteer/puppeteer.js';
const puppeteer = (await import(PUP)).default;
const base = `http://localhost:${port}`;

// ---- the rooms that are shut: the game's own list if it has one, else the branch's, else the copy kept here
async function shutRooms() {
  const pick = s => [...s.matchAll(/^\s*'([^']+)',/gm)].map(m => m[1]);
  try { const r = await fetch(base + '/src/shut.js'); if (r.ok) { const ids = pick(await r.text()); if (ids.length) return { ids, from: 'src/shut.js as served' }; } } catch { /* not there */ }
  try { const ids = pick(execFileSync('git', ['-C', HERE, 'show', 'shut-doors:src/shut.js'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })); if (ids.length) return { ids, from: 'branch shut-doors, src/shut.js' }; } catch { /* no such branch here */ }
  return { ids: JSON.parse(fs.readFileSync(path.join(HERE, 'shut-rooms.json'), 'utf8')), from: 'tools/dev/roommap/shut-rooms.json (a copy: the branch could not be read)' };
}
const shut = await shutRooms();

// ---- the game
const errs = [];
let browser, page, own = false;
if (process.env.ROOMMAP_WS) {
  browser = await puppeteer.connect({ browserWSEndpoint: process.env.ROOMMAP_WS, protocolTimeout: 900000, defaultViewport: null });
  page = (await browser.pages()).find(p => p.url().includes(':' + port));
} else {
  own = true;
  browser = await puppeteer.launch({ headless: 'new', protocolTimeout: 900000, args: ['--use-angle=metal', '--window-size=1280,800'], defaultViewport: { width: 1280, height: 800 } });
  page = await browser.newPage();
  page.on('pageerror', e => { const m = String(e.message || e); if (!/artic|CORS|ERR_FAILED/.test(m)) errs.push('PAGEERROR ' + m.slice(0, 300)); });
  page.on('console', m => { const t = m.text(); if (m.type() === 'error' && !/artic|CORS|ERR_FAILED|Failed to load resource/.test(t)) errs.push('CONSOLE ' + t.slice(0, 300)); });
  await page.evaluateOnNewDocument(() => { try { if (!sessionStorage.__roommap) { localStorage.clear(); sessionStorage.__roommap = 1; } } catch { /* fine */ } });
  await page.goto(base + '/index.html?noopen&saved&nofps', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__ah && window.__ah.state === 'title', { timeout: 180000 });
  for (let i = 0; i < 60; i++) {
    if (await page.evaluate(() => window.__ah.state) !== 'title') break;
    await page.evaluate(() => { const b = document.querySelector('button[data-act="start"]'); if (b) b.click(); });
    await new Promise(r => setTimeout(r, 500));
  }
  await page.waitForFunction(() => window.__ah.state === 'play', { timeout: 120000 });
  await new Promise(r => setTimeout(r, 3000));
}

const lib = fs.readFileSync(path.join(HERE, 'srctext.js'), 'utf8').replace(/^export /gm, '');
const body = fs.readFileSync(path.join(HERE, 'dump.page.js'), 'utf8');
const LIFE = JSON.parse(fs.readFileSync(path.join(HERE, 'life.json'), 'utf8'));
const res = JSON.parse(await page.evaluate(`(async () => { ${lib}\nconst SHUT = ${JSON.stringify(shut.ids)}, LIFE = ${JSON.stringify(LIFE)};\nconst __r = await (async () => { ${body}\n})(); return JSON.stringify(__r); })()`));
if (own) await browser.close(); else await browser.disconnect();
const { data, warnings } = res;

// ---- the checks
const fails = [], R = Object.fromEntries(data.rooms.map(r => [r.id, r])), L = new Set(data.levels.map(l => l.id));
const check = (ok, msg) => { if (!ok) fails.push(msg); };
const seen = new Set();
for (const it of data.items) {
  check(!seen.has(it.id), 'two items share the id ' + it.id); seen.add(it.id);
  check(L.has(it.level), `item ${it.id} is on a level that is not listed: ${it.level}`);
  check(typeof it.x === 'number' && typeof it.z === 'number' && isFinite(it.x) && isFinite(it.z), `item ${it.id} has no place`);
  check(Array.isArray(it.text) && it.text.every(t => typeof t === 'string'), `item ${it.id}: text is not a list of strings`);
  check(!!it.what, `item ${it.id} has no sentence`);
  if (it.room === null) continue;
  const r = R[it.room]; check(!!r, `item ${it.id} is in a room that does not exist: ${it.room}`);
  if (r) check(it.x >= r.x0 && it.x <= r.x1 && it.z >= r.z0 && it.z <= r.z1, `item ${it.id} (${it.x}, ${it.z}) is outside its room ${it.room}`);
}
for (const d of data.doors) { check(!!R[d.a], `door ${d.id}: no room ${d.a}`); check(d.b === null || !!R[d.b], `door ${d.id}: no room ${d.b}`); check(L.has(d.level), `door ${d.id} is on a level that is not listed: ${d.level}`); }
for (const a of data.areas) for (const id of a.rooms) check(!!R[id], `area ${a.id}: no room ${id}`);
for (const p of data.paths) { check(L.has(p.level), `path ${p.id} is on a level that is not listed: ${p.level}`); check(p.pts.length > 1, `path ${p.id} has no points`); }
for (const r of data.rooms) { check(L.has(r.level), `room ${r.id} is on a level that is not listed: ${r.level}`); check(r.worksList.length === r.works, `room ${r.id}: worksList is not as long as works`); }
// (what was asked to be confirmed at build 2026.11.25.23; a later build may move them, and then these lines say so)
const MICE = { 'mouse-north': [59.2, 96.7, 'G101'], 'mouse-south': [115.5, 114.8, 'G141'], 'mouse-rice': [188.8, 140.5, 'G160'], 'mouse-modern': [154, 120.2, 'G150'], 'mouse-lower': [35.9, 94.9, 'G10'] };
const moved = [];
for (const [id, [x, z, room]] of Object.entries(MICE)) { const m = data.items.find(i => i.id === id); if (!m) fails.push('no ' + id); else if (Math.abs(m.x - x) > 0.051 || Math.abs(m.z - z) > 0.051 || m.room !== room) moved.push(`${id} sits at (${m.x}, ${m.z}) in ${m.room}; at build .23 it sat at (${x}, ${z}) in ${room}`); }
const count = k => data.items.filter(i => i.kind === k).length;
if (count('whiteboard') !== 27) moved.push(`whiteboards: ${count('whiteboard')}; at build .23 there were 27`);

fs.mkdirSync(path.dirname(path.resolve(outFile)), { recursive: true });
fs.writeFileSync(outFile, JSON.stringify(data, null, 1));

// ---- the report
const kinds = {}; for (const it of data.items) kinds[it.kind] = (kinds[it.kind] || 0) + 1;
console.log(`build ${data.build}: wrote ${outFile}, ${fs.statSync(outFile).size} bytes`);
console.log(`rooms ${data.rooms.length} (${data.rooms.filter(r => !r.shut).length} open, ${data.rooms.filter(r => r.shut).length} shut; shut list: ${shut.ids.length} ids from ${shut.from}), doors ${data.doors.length} (${data.doors.filter(d => d.shut).length} join a shut room), items ${data.items.length}, paths ${data.paths.length}, areas ${data.areas.length}`);
console.log('levels ' + data.levels.map(l => `${l.id} "${l.name}" ${l.y}`).join(', '));
console.log('works ' + data.rooms.reduce((n, r) => n + r.works, 0) + ', living ' + data.rooms.reduce((n, r) => n + r.living, 0));
console.log('items by kind: ' + Object.entries(kinds).sort().map(([k, n]) => `${k} ${n}`).join(', '));
const inShut = data.items.filter(i => i.room && R[i.room] && R[i.room].shut);
console.log(`items in shut rooms: ${inShut.length}` + (inShut.length ? ' (' + inShut.map(i => i.id + ' in ' + i.room).join(', ') + ')' : ''));
console.log(`not found (${data.notFound.length}):`); for (const n of data.notFound) console.log('  - ' + n);
console.log(`warnings (${warnings.length}):`); for (const w of warnings) console.log('  ! ' + w);
console.log(`moved since build .23 (${moved.length}):`); for (const m of moved) console.log('  ~ ' + m);
console.log(`page errors (${errs.length}):`); for (const e of errs.slice(0, 20)) console.log('  x ' + e);
console.log(`checks failed (${fails.length}):`); for (const f of fails.slice(0, 60)) console.log('  x ' + f);
process.exit(fails.length || errs.length ? 1 : 0);
