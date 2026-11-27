#!/usr/bin/env node
// Does ?cull hide anything that can be seen? It must not: the pass mark is NO fault in any view. Run it after making the
// table (tools/dev/pvs.mjs) and before ?cull is trusted anywhere.
//   python3 tools/dev/serve.py 8896 "$PWD" &
//   node tools/dev/cullcheck.mjs 8896                    every view: 3,000 random and some 9,000 directed (about forty minutes on one browser)
//   node tools/dev/cullcheck.mjs 8896 --jobs=3           the same, shared between three browsers
//   node tools/dev/cullcheck.mjs 8896 --random=600 --no-directed --seed=11     a quick look
//   node tools/dev/cullcheck.mjs 8896 --only="door,in a doorway"                 some kinds of directed view only
//   --out=FILE (the faults and the tallies, as json)   --stills=DIR (the worst faults, with ?cull off and on, as pictures)
// What it looks at, and how a see-through thing is judged, is at the top of tools/dev/cullcheck-page.js.
// Exit code 0 if no view has a fault, 1 if any has, 2 if it could not run.
import fs from 'fs'; import path from 'path';
const PUP = process.env.PUPPETEER || '/Users/cfreder2/.nvm/versions/node/v24.10.0/lib/node_modules/@mermaid-js/mermaid-cli/node_modules/puppeteer/lib/esm/puppeteer/puppeteer.js';
const args = process.argv.slice(2), port = args.find(a => /^\d+$/.test(a)), flag = k => { const a = args.find(q => q === '--' + k || q.startsWith('--' + k + '=')); return a ? (a.includes('=') ? a.slice(a.indexOf('=') + 1) : true) : null; };
if (!port) { console.error('usage: node tools/dev/cullcheck.mjs <port> [--random=3000] [--no-directed] [--seed=7] [--jobs=1] [--only=kind,kind] [--out=file] [--stills=dir]'); process.exit(2); }
const jobs = +(flag('jobs') || 1), W = 1280, H = 800, sleep = ms => new Promise(r => setTimeout(r, ms));
const puppeteer = (await import(PUP)).default;
const boot = async () => {
  const b = await puppeteer.launch({ headless: 'new', protocolTimeout: 14400000, args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist', `--window-size=${W},${H}`], defaultViewport: { width: W, height: H, deviceScaleFactor: 1 } });
  const p = await b.newPage(), errs = [];
  p.on('pageerror', e => { const m = String(e.message || e); if (!/artic|CORS|ERR_FAILED/.test(m)) errs.push(m.slice(0, 300)); });
  await p.setRequestInterception(true);
  p.on('request', q => { const u = q.url(); if (!/^(http:\/\/127\.0\.0\.1|data:|blob:)/.test(u) && /supabase/.test(u)) return q.abort(); q.continue(); });      // (nothing is sent to the game's statistics)
  await p.evaluateOnNewDocument(() => { try { localStorage.clear(); } catch {} });
  await p.goto(`http://127.0.0.1:${port}/?saved&noopen&nofps&cull`, { waitUntil: 'domcontentloaded' });
  await p.waitForFunction('window.__ah && window.__ah.state === "title" && !document.querySelector(\'button[data-act="start"]\').disabled', { timeout: 300000, polling: 200 });
  for (let i = 0; i < 80; i++) { if (await p.evaluate(() => window.__ah.state) === 'play') break; await p.evaluate(() => { const q = document.querySelector('button[data-act="start"]'); if (q && !q.disabled) q.click(); }); await sleep(250); }
  await sleep(4000);
  return { b, p, errs };
};
const first = await boot();
let list;
try {
  list = await first.p.evaluate(async o => { const m = await import('/tools/dev/cullcheck-page.js'); return m.views(window.__ah.plan, o); }, { random: flag('random') == null ? 3000 : +flag('random'), directed: !flag('no-directed'), seed: +(flag('seed') || 7) });
} catch (e) { console.error(String(e)); await first.b.close(); process.exit(2); }
if (flag('only')) { const only = String(flag('only')).split(','); list = list.filter(v => only.includes(v[0])); }
if (flag('views')) list = JSON.parse(fs.readFileSync(String(flag('views')), 'utf8'));      // (a file of views to look at again: [[kind, x, y, z, yaw, pitch], ...])
if (flag('limit')) list = list.filter((_, i) => i % Math.ceil(list.length / +flag('limit')) === 0);
console.error(`${list.length} views, ${jobs} browser${jobs > 1 ? 's' : ''}`);
const t0 = Date.now(), run = async (who, part) => {
  const tell = setInterval(async () => { try { process.stderr.write(`\r[${part}] ` + (await who.p.title()).padEnd(50)); } catch {} }, 4000);
  try { return await who.p.evaluate(async l => { const m = await import('/tools/dev/cullcheck-page.js'); return JSON.stringify(await m.check(l)); }, list.filter((_, i) => i % jobs === part)).then(JSON.parse); } finally { clearInterval(tell); }
};
let parts;
try { const others = await Promise.all(Array.from({ length: jobs - 1 }, () => boot())); const all = [first, ...others]; try { parts = await Promise.all(all.map((w, i) => run(w, i))); } finally { for (const w of others) await w.b.close(); } }
catch (e) { console.error('\n' + String(e)); await first.b.close(); process.exit(2); }
process.stderr.write('\n');
const bad = parts.find(q => q.error); if (bad) { console.error(bad.error); await first.b.close(); process.exit(2); }
const sum = { views: 0, covered: 0, everythingDrawn: 0, faultViews: 0, byFault: { solid: 0, seeThrough: 0, reflection: 0 }, byKind: {}, faults: [], thingsHidden: 0 };
for (const q of parts) { for (const k of ['views', 'covered', 'everythingDrawn', 'faultViews', 'thingsHidden']) sum[k] += q[k]; for (const k in q.byFault) sum.byFault[k] += q.byFault[k]; for (const [k, v] of Object.entries(q.byKind)) { const s = sum.byKind[k] || (sum.byKind[k] = { views: 0, covered: 0, faultViews: 0, faults: 0 }); for (const j in v) s[j] += v[j]; } sum.faults.push(...q.faults); }
sum.faults.sort((a, b) => b.px - a.px); sum.meanThingsHidden = sum.covered ? Math.round(sum.thingsHidden / sum.covered) : 0; sum.seconds = Math.round((Date.now() - t0) / 1000); sum.pageErrors = first.errs.slice(0, 5);
console.log(`views ${sum.views}: the table covers ${sum.covered} (everything drawn at the other ${sum.everythingDrawn}); ${sum.meanThingsHidden} things hidden on average where it does`);
console.log(`views with a fault: ${sum.faultViews}   faults: solid ${sum.byFault.solid}, see-through ${sum.byFault.seeThrough}, in the reflection ${sum.byFault.reflection}`);
console.log('kind of view'.padEnd(26) + 'views  covered  with a fault'); for (const [k, v] of Object.entries(sum.byKind)) console.log(k.padEnd(26) + String(v.views).padStart(5) + String(v.covered).padStart(9) + String(v.faultViews).padStart(8));
for (const f of sum.faults.slice(0, 25)) console.log(`  ${f.fault.padEnd(10)} ${String(f.px).padStart(7)} px (${f.share}%)  ${f.thing} [${f.material || ''}] ${f.size || ''}  bin ${f.bin}  from ${f.from}  view ${JSON.stringify(f.view)}`);
if (flag('out')) fs.writeFileSync(String(flag('out')), JSON.stringify(sum, null, 1));
// the worst faults as pictures: the same frozen frame with everything drawn, and as ?cull draws it
if (flag('stills') && sum.faults.length) {
  const dir = String(flag('stills')); fs.mkdirSync(dir, { recursive: true }); const seen = new Set(); let n = 0;
  for (const f of sum.faults) { const key = JSON.stringify(f.view); if (seen.has(key)) continue; seen.add(key); if (++n > 12) break;
    const [, x, y, z, yaw, pitch] = f.view;
    for (const off of [true, false]) {
      await first.p.evaluate(async (x, y, z, yaw, pitch, off) => { const G = window.__ah, fr = () => new Promise(r => requestAnimationFrame(() => r())); G.vehicle.place(x, z, yaw, y); G.testEye = { at: [x, y, z], look: [x + Math.sin(yaw) * Math.cos(pitch) * 10, y + Math.sin(pitch) * 10, z + Math.cos(yaw) * Math.cos(pitch) * 10] }; G.vis.off = off; for (let i = 0; i < 4; i++) await fr(); }, x, y, z, yaw, pitch, off);
      await first.p.screenshot({ path: path.join(dir, `fault-${String(n).padStart(2, '0')}-${off ? 'all' : 'cull'}.png`) });
    }
    fs.appendFileSync(path.join(dir, 'faults.txt'), `fault-${String(n).padStart(2, '0')}: ${f.fault}, ${f.px} px, ${f.thing} ${f.size || ''}, bin ${f.bin}, from ${f.from}, view ${key}\n`);
  }
  await first.p.evaluate(() => { window.__ah.vis.off = false; window.__ah.testEye = null; });
}
await first.b.close();
console.log(sum.faultViews ? 'FAIL' : 'PASS', `(${sum.seconds} s)`);
process.exit(sum.faultViews ? 1 : 0);
