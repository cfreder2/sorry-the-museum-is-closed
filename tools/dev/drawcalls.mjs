#!/usr/bin/env node
// How many draw calls a frame costs, pass by pass (the view, the floor's reflection), at a few fixed spots, four ways at each; and, with --detail,
// what was drawn, by where src/visible.js files it. For measuring culling (src/visible.js) and anything else that changes what is drawn.
//   python3 tools/dev/serve.py 8901 "$PWD" &
//   node tools/dev/drawcalls.mjs 8901 phone              a phone-sized view (844 x 390, ?lowmem: the streamer on, as on a phone)
//   node tools/dev/drawcalls.mjs 8901 desk               1280 x 800
//   options: a query to add (e.g. nocull, cull=table) as the third word; --only=216 (spots whose name has that, facing one way, in detail);
//   --detail; --json=FILE; --ms (the time each pass takes in the page, as measured here: a headless browser's, not a phone's)
// The floor's reflection is held on (the quality governor turns it off in a slow headless browser).
import fs from 'fs';
const PUP = process.env.PUPPETEER || '/Users/cfreder2/.nvm/versions/node/v24.10.0/lib/node_modules/@mermaid-js/mermaid-cli/node_modules/puppeteer/lib/esm/puppeteer/puppeteer.js';
const puppeteer = (await import(PUP)).default, sleep = ms => new Promise(r => setTimeout(r, ms));
const args = process.argv.slice(2), port = +args[0], phone = args[1] === 'phone', extra = args[2] && !args[2].startsWith('--') ? args[2] : '';
const flag = k => { const a = args.find(q => q === '--' + k || q.startsWith('--' + k + '=')); return a ? (a.includes('=') ? a.slice(a.indexOf('=') + 1) : true) : null; };
const only = flag('only') || '', detail = !!flag('detail') || !!only;
if (!port) { console.error('usage: node tools/dev/drawcalls.mjs <port> phone|desk [query] [--only=name] [--detail] [--json=file]'); process.exit(2); }
const b = await puppeteer.launch({ headless: 'new', args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'], protocolTimeout: 900000 });
const p = await b.newPage(); await p.setViewport(phone ? { width: 844, height: 390, deviceScaleFactor: 3, isMobile: true, hasTouch: true } : { width: 1280, height: 800 });
const errs = []; p.on('pageerror', e => errs.push(String(e).slice(0, 300)));
await p.setRequestInterception(true); p.on('request', q => (/supabase/.test(q.url()) ? q.abort() : q.continue()));      // (nothing is sent to the game's statistics)
const url = `http://127.0.0.1:${port}/?saved&nofps${phone ? '&lowmem' : ''}${extra ? '&' + extra : ''}`;
await p.goto(url, { waitUntil: 'domcontentloaded' }); await p.evaluate(() => localStorage.clear()); await p.goto(url, { waitUntil: 'domcontentloaded' });
await p.waitForFunction('window.__ah && window.__ah.state === "title"', { timeout: 300000, polling: 500 });
for (let i = 0; i < 60; i++) { if (await p.evaluate(() => window.__ah.state) !== 'title') break; try { await p.click('button[data-act="start"]'); } catch {} await sleep(500); }
await p.waitForFunction('window.__ah.state === "opening"', { timeout: 120000 }); await sleep(1000);
await p.evaluate(() => window.__ah.opening.finish(true)); await p.waitForFunction('window.__ah.state === "play"', { timeout: 60000 }); await sleep(3000);
await p.evaluate(async () => {
  const G = window.__ah, r = G.museum.renderer, V = await import('/src/visible.js'), T = await import('three'); let S = G.museum.group; while (S.parent) S = S.parent;
  const M = window.__d = { on: false, passes: [] }; const orig = r.renderBufferDirect.bind(r), rend = r.render.bind(r);
  r.render = (s, c) => { if (M.on) M.passes.push(M.cur = { scene: s === S ? 'world' : 'other', cam: c === G.camera ? 'view' : c === G.mirror.cam ? 'refl' : 'cam', n: 0, objs: [], t: performance.now() }); rend(s, c); if (M.cur) M.cur.ms = performance.now() - M.cur.t; M.cur = null; };
  r.renderBufferDirect = (cam, scene, geo, mat, obj, grp) => { if (M.on && M.cur) { M.cur.n++; M.cur.objs.push(obj); } return orig(cam, scene, geo, mat, obj, grp); };
  const owner = o => { let q = o, last = o; while (q && q !== G.museum.group && q !== S) { if (q.name && q.name.length > 1) return q.name; last = q; q = q.parent; } return (q === G.museum.group ? 'museum#' : 'scene#') + (last.parent ? last.parent.children.indexOf(last) : -1); };
  const P = new V.Places(G.plan), B = new T.Box3();
  M.sum = detail => { const out = []; const here = G.roomId;
    for (const ps of M.passes) { if (ps.scene !== 'world') continue;
      const cls = {}, own = {}, seen = new Set();
      for (const o of ps.objs) { if (seen.has(o)) continue; seen.add(o);
        let c; if (!V.fixed(o)) c = 'not fixed'; else if (!V.boxOf(o, B)) c = 'no box'; else { const bn = P.binOf(B); c = bn == null ? 'too big for a bin' : bn === here ? 'this room' : bn.startsWith('c:') ? 'open-air square' : 'other room'; }
        cls[c] = (cls[c] || 0) + 1; const k = owner(o); own[k] = (own[k] || 0) + 1; }
      out.push({ cam: ps.cam, calls: ps.n, ms: +ps.ms.toFixed(2), where: detail ? cls : undefined, owners: detail ? Object.entries(own).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([k, v]) => k + ':' + v).join(' ') : undefined }); }
    return out; };
});
const spot = async (x, z, y, yaw) => {
  await p.evaluate((x, z, y, yaw) => { const G = window.__ah; G.set.guards = false; G.vehicle.place(x, z, yaw, y); G.vehicle.vel.set(0, 0, 0); }, x, z, y, yaw); await sleep(1800);
  return p.evaluate(async detail => { const G = window.__ah, M = window.__d; G.mirror.enabled = true; M.passes = []; M.on = true; await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); M.passes = []; await new Promise(r => requestAnimationFrame(r)); M.on = false;
    const v = G.vis; return { room: G.roomId, vis: v ? v.status().split('\n')[0] : 'none', ms: v ? +v.ms.toFixed(2) : 0, passes: M.sum(detail) }; }, detail); };
const R = await p.evaluate(() => { const G = window.__ah, P = G.plan, f = id => { const r = P.byId[id]; return r ? [(r.x0 + r.x1) / 2, (r.z0 + r.z1) / 2, r.y + 0.05] : [null]; };
  return [['outdoors at the start', G.vehicle.pos.x, G.vehicle.pos.z, G.vehicle.pos.y], ['Gallery 202', ...f('G202')], ['Gallery 216', ...f('G216')], ['Gallery 240', ...f('G240')], ['Gallery 140', ...f('G140')], ['Griffin Court', ...f('hall')], ['Modern Wing, G182', ...f('G182')], ['the lobby', ...f('lobby')], ['the drone up high', P.spawn.x + 30, P.spawn.z + 20, 40]].filter(q => q[1] != null); });
const res = [];
for (const [label, x, z, y] of R) {
  if (only && !label.includes(only)) continue;
  const per = []; for (const yaw of only ? [0] : [0, Math.PI / 2, Math.PI, 3 * Math.PI / 2]) per.push(await spot(x, z, y, yaw));
  const g = k => per.map(q => (q.passes.find(s => s.cam === k) || { calls: 0 }).calls), gm = k => per.map(q => (q.passes.find(s => s.cam === k) || { ms: 0 }).ms);
  const v = g('view'), rf = g('refl'), mean = a => Math.round(a.reduce((s, c) => s + c, 0) / a.length), meanf = a => +(a.reduce((s, c) => s + c, 0) / a.length).toFixed(2);
  res.push({ label, view: v, refl: rf, viewMean: mean(v), reflMean: mean(rf), viewMs: meanf(gm('view')), reflMs: meanf(gm('refl')), cullMs: meanf(per.map(q => q.ms)), first: per[0] });
  console.log(`${label.padEnd(22)} view ${String(mean(v)).padStart(5)} [${v.join(' ')}]  reflection ${String(mean(rf)).padStart(5)} [${rf.join(' ')}]` + (flag('ms') ? `  ms view ${meanf(gm('view'))} refl ${meanf(gm('refl'))} cull ${meanf(per.map(q => q.ms))}` : '') + `  ${per[0].vis}`);
  if (detail) console.log(JSON.stringify(per[0].passes, null, 1));
}
if (flag('json')) fs.writeFileSync(String(flag('json')), JSON.stringify(res, null, 1));
console.log('page errors', errs.length, errs.slice(0, 3)); await b.close();
process.exit(errs.length ? 1 : 0);
