#!/usr/bin/env node
// Makes data/pvs.json, the table src/visible.js reads under ?cull: for every place a camera can be, what can be seen from it.
//   python3 tools/dev/serve.py 8896 "$PWD" &          (serve this checkout)
//   node tools/dev/pvs.mjs 8896                        (writes data/pvs.json; about a quarter of an hour, headless)
//   node tools/dev/pvs-stale.mjs [8896]                (is the table still good for these sources? for this game as it runs?)
//   node tools/dev/cullcheck.mjs 8896                  (does ?cull hide anything that can be seen? thousands of views; it must pass)
// Make it again whenever a room, a wall, a floor, a roof or the ground changes (src/layout.js, src/shut.js, src/plan.js,
// src/museum.js and whatever else builds something big and solid). The game checks for itself and draws everything if
// the table does not fit (see the top of src/visible.js); pvs-stale.mjs says so before a build is published.
// Options:  --out=FILE   --step=3 (metres between sample points in a room)   --rooms=id,id (those rooms only: a trial, not to keep)
//           --quick (a short watch for things that move)   --dry (count the sample points and stop)   --limit=N (the first N sample points only)
// How it works is at the top of tools/dev/pvs-page.js, which is the part that runs in the page.
import fs from 'fs'; import path from 'path'; import crypto from 'crypto';
const PUP = process.env.PUPPETEER || '/Users/cfreder2/.nvm/versions/node/v24.10.0/lib/node_modules/@mermaid-js/mermaid-cli/node_modules/puppeteer/lib/esm/puppeteer/puppeteer.js';
const args = process.argv.slice(2), port = args.find(a => /^\d+$/.test(a)), flag = k => { const a = args.find(q => q === '--' + k || q.startsWith('--' + k + '=')); return a ? (a.includes('=') ? a.split('=')[1] : true) : null; };
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..'), outFile = flag('out') || path.join(root, 'data/pvs.json');
export function sources(root) {      // what the table was made from: the files that draw the plan, and every source file
  const all = []; const walk = d => { for (const f of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, f.name); if (f.isDirectory()) walk(p); else if (f.name.endsWith('.js') && path.relative(root, p) !== 'src/visible.js') all.push(p); } }; walk(path.join(root, 'src')); all.sort();
  const h = list => { const c = crypto.createHash('sha256'); for (const p of list) { c.update(path.relative(root, p)); c.update(fs.readFileSync(p)); } return c.digest('hex').slice(0, 16); };
  const files = {}; for (const p of all) files[path.relative(root, p)] = crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex').slice(0, 10);
  return { plan: h(['layout.js', 'shut.js', 'plan.js'].map(f => path.join(root, 'src', f))), all: h(all), files };
}
if (process.argv[1] === new URL(import.meta.url).pathname) {
  if (!port) { console.error('usage: node tools/dev/pvs.mjs <port> [--out=data/pvs.json]'); process.exit(2); }
  const puppeteer = (await import(PUP)).default;
  const b = await puppeteer.launch({ headless: 'new', protocolTimeout: 7200000, args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
  try {
    const p = await b.newPage(); await p.setViewport({ width: 640, height: 400 });
    p.on('pageerror', e => console.log('ERR', String(e).slice(0, 300)));
    await p.evaluateOnNewDocument(() => { try { localStorage.clear(); } catch {} });
    await p.goto(`http://127.0.0.1:${port}/?saved&noopen&nofps`, { waitUntil: 'domcontentloaded' });
    await p.waitForFunction('window.__ah && window.__ah.state === "title" && !document.querySelector(\'button[data-act="start"]\').disabled', { timeout: 300000, polling: 200 });
    for (let i = 0; i < 80; i++) { if (await p.evaluate(() => window.__ah.state) === 'play') break; await p.evaluate(() => { const q = document.querySelector('button[data-act="start"]'); if (q && !q.disabled) q.click(); }); await new Promise(r => setTimeout(r, 250)); }
    await new Promise(r => setTimeout(r, 4000));
    const t0 = Date.now(), tell = setInterval(async () => { try { process.stderr.write('\r' + (await p.title()).padEnd(70)); } catch {} }, 5000);
    const opt = { quick: !!flag('quick'), dry: !!flag('dry'), step: +(flag('step') || 3), rooms: flag('rooms') ? String(flag('rooms')).split(',') : null, limit: +(flag('limit') || 0), debug: false, dRoom: +(flag('droom') || 0), dAir: +(flag('dair') || 0) };
    const out = await p.evaluate(async o => { const m = await import('/tools/dev/pvs-page.js'); return JSON.stringify(await m.makeTable(o)); }, opt).then(JSON.parse).finally(() => clearInterval(tell));
    process.stderr.write('\n');
    if (out.pvs) { out.pvs.src = sources(root); fs.writeFileSync(outFile, JSON.stringify(out.pvs)); console.log(JSON.stringify(out.stats, null, 1)); console.log('in', Math.round((Date.now() - t0) / 1000), 's;', outFile, Math.round(fs.statSync(outFile).size / 1024), 'KB'); }
    else console.log(JSON.stringify(out.stats, null, 1));
  } finally { await b.close(); }
}
