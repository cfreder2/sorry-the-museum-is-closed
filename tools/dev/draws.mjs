#!/usr/bin/env node
// Draw calls, stills and frame cost at a set of views, out of doors and in, on a phone-sized screen (?lowmem) or a computer's.
//   node tools/dev/draws.mjs <port> <phone|desk> <count|shoot|fps|count+shoot+fps> <outdir> [only=view,view] [extra=&nobake]
// count: for each view, the draw calls of the view and of the floor's reflection, and who owns them (the first named group a
//        thing hangs from, or museum#i / scene#i for the museum's i-th child); with 'who', also by the line of src that made it.
// shoot: a still of each view (fixed eyes: kept in <outdir>/../<size>-eyes.json the first time, so a second run matches), and
//        the opening's night at her window and four moments of its flight.
// fps:   each frame's own work (the frame function, then gl.finish) at each view, and on a long drive round the park.
import fs from 'node:fs'; import path from 'node:path';
const PUP = process.env.PUPPETEER || '/Users/cfreder2/.nvm/versions/node/v24.10.0/lib/node_modules/@mermaid-js/mermaid-cli/node_modules/puppeteer/lib/esm/puppeteer/puppeteer.js';
const puppeteer = (await import(PUP)).default, sleep = ms => new Promise(r => setTimeout(r, ms));
const args = process.argv.slice(2), [port, size, mode, outdir = '.'] = args, phone = size === 'phone';
const only = (args.find(a => a.startsWith('only=')) || '').slice(5).split(',').filter(Boolean), extra = (args.find(a => a.startsWith('extra=')) || '').slice(6);
const want = n => !only.length || only.includes(n), modes = mode.split('+');
fs.mkdirSync(outdir, { recursive: true });
// [name, eye, look, 'high'?] (an eye on the ground is so high over the ground the toy finds there), [name, 'start'], [name, 'chase', yaw], [name, 'room', id-regex]
const VIEWS = [
  ['start', 'start'], ['start0', 'chase', 0],
  ['steps', [33, 1.2, 120], [60, 1, 140]], ['butler', [330, 0.6, 60], [400, 0.5, 100]], ['lakedrive', [497, 0.6, 100], [497, 0.5, 180]],
  ['harbour', [555, 0.6, 150], [610, 0.5, 200]], ['columbus', [285, 0.6, 60], [285, 0.5, 140]], ['bighill', [205, 0.6, 200], [240, 0.5, 224]],
  ['monroe', [150, 0.6, -30], [230, 0.5, -30]], ['northgarden', [35, 0.6, 20], [60, 0.5, 50]], ['binyard', [103, 0.6, 8], [97, 0.5, 1]],
  ['dronehigh', [300, 40, 20], [380, 2, 120], 'high'], ['dronehigh2', [60, 30, 200], [40, 2, 120], 'high'],
  ['griffin', 'room', '^hall$'], ['g216', 'room', '^G216$'], ['g202', 'room', '^G202$'],
];
const NIGHT = [['night-window', 'night', 19.0], ['fly-03', 'fly', 3], ['fly-08', 'fly', 8], ['fly-12', 'fly', 12], ['fly-16', 'fly', 16]];
const DRIVE = [[60, 140], [150, 150], [240, 120], [300, 60], [380, 40], [470, 60], [500, 140], [470, 220], [380, 240], [290, 230], [210, 210], [140, 190], [60, 140]];

const b = await puppeteer.launch({ headless: 'new', args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'], protocolTimeout: 1800000 });
const p = await b.newPage(); await p.setViewport(phone ? { width: 844, height: 390, deviceScaleFactor: 3, isMobile: true, hasTouch: true } : { width: 1280, height: 800 });
const errs = []; p.on('pageerror', e => errs.push(String(e).slice(0, 300)));
p.on('console', m => { if (/^bake|THREE\.|shader/i.test(m.text())) errs.push('console ' + m.text().slice(0, 200)); });
await p.setRequestInterception(true);
const who = modes.includes('who');
p.on('request', q => { const u = q.url();
  if (/supabase/.test(u)) return q.abort();
  if (who && /vendor\/three\.module\.min\.js$/.test(u)) return q.respond({ status: 200, contentType: 'text/javascript', body: `export * from './three.module.min.js?orig'; import { Object3D } from './three.module.min.js?orig';
Error.stackTraceLimit = 40; const W = globalThis.__st = new WeakMap(); const a = Object3D.prototype.add; Object3D.prototype.add = function (...o) { for (const c of o) if (c && !W.has(c)) W.set(c, new Error().stack); return a.apply(this, o); };` });
  q.continue(); });
if (modes.includes('fps')) await p.evaluateOnNewDocument(() => { window.__ft = []; const raf = window.requestAnimationFrame.bind(window); window.requestAnimationFrame = cb => raf(t => { const t0 = performance.now(); cb(t); const G = window.__ah, r = G && G.renderer; if (r && window.__ftOn) { r.getContext().finish(); window.__ft.push(performance.now() - t0); } }); });
const url = `http://127.0.0.1:${port}/?saved&nofps${phone ? '&lowmem' : ''}${extra}`;
await p.goto(url, { waitUntil: 'domcontentloaded' }); await p.evaluate(() => localStorage.clear()); await p.goto(url, { waitUntil: 'domcontentloaded' });
await p.waitForFunction('window.__ah && window.__ah.state === "title"', { timeout: 300000, polling: 500 });
for (let i = 0; i < 60; i++) { if (await p.evaluate(() => window.__ah.state) !== 'title') break; try { await p.click('button[data-act="start"]'); } catch {} await sleep(500); }
await p.waitForFunction('window.__ah.state === "opening"', { timeout: 120000 }); await sleep(1500);
const shot = name => p.screenshot({ path: path.join(outdir, `${size}-${name}.png`), type: 'png' });
if (modes.includes('shoot')) {
  await p.addStyleTag({ content: 'body > *:not(canvas) { visibility: hidden !important; }' });
  for (const [name, ph, t] of NIGHT) if (want(name)) { await p.evaluate((ph, t) => window.__ah.opening.seek(ph, t), ph, t); await sleep(2500); await shot(name); }
}
await p.evaluate(() => window.__ah.opening.finish(true)); await p.waitForFunction('window.__ah.state === "play"', { timeout: 60000 }); await sleep(3000);
const start = await p.evaluate(() => { const c = window.__ah.camera, d = c.getWorldDirection(new c.position.constructor()), v = window.__ah.vehicle.pos; return { eye: c.position.toArray(), look: c.position.clone().addScaledVector(d, 10).toArray(), toy: [v.x, v.z, v.y] }; });
await p.evaluate(async (WHY) => {
  const G = window.__ah, r = G.museum.renderer, V = await import('/src/visible.js'), T = await import('three'); let S = G.museum.group; while (S.parent) S = S.parent;
  G.set.guards = false;
  const M = window.__d = { on: false, passes: [] }, orig = r.renderBufferDirect.bind(r), rend = r.render.bind(r);
  r.render = (s, c) => { if (M.on) M.passes.push(M.cur = { cam: s !== S ? 'other' : c === G.camera ? 'view' : 'refl', n: 0, objs: [] }); rend(s, c); M.cur = null; };
  r.renderBufferDirect = (cam, scene, geo, mat, obj, grp) => { if (M.on && M.cur) { M.cur.n++; M.cur.objs.push(obj); } return orig(cam, scene, geo, mat, obj, grp); };
  const owner = o => { const path = []; let q = o; while (q && q !== G.museum.group && q !== S) { if (q.name && q.name.length > 1) return q.name; path.push(q); q = q.parent; } const top = path[path.length - 1]; const i = top && top.parent ? top.parent.children.indexOf(top) : -1; return (q === G.museum.group ? 'museum#' : 'scene#') + i; };
  const W = globalThis.__st, site = o => { if (!W) return '?'; for (let q = o; q; q = q.parent) { const s = W.get(q); if (!s) continue; const L = s.split('\n').slice(2).map(l => (/\/src\/([\w\-\/]+\.js):(\d+)/.exec(l) || [])).filter(m => m[1]); if (L.length) return L.slice(0, 2).map(m => m[1] + ':' + m[2]).join(' < '); } return '?'; };
  const P = new V.Places(G.plan), B = new T.Box3();
  M.sum = () => M.passes.filter(ps => ps.n >= 5 && ps.cam !== 'other').map(ps => {
    const cls = {}, own = {}, mats = new Set(), seen = new Set(), st = new Map();
    for (const o of ps.objs) { if (seen.has(o)) continue; seen.add(o);
      let c; if (o.userData.batch) c = 'batch'; else if (WHY && G.bake) { c = G.bake.why(o); if (!c) c = !V.boxOf(o, B) ? 'no box' : P.binOf(B) == null ? 'big' : 'alone'; } else if (!V.fixed(o)) c = 'notfixed'; else if (!V.boxOf(o, B)) c = 'nobox'; else { const bn = P.binOf(B); c = bn == null ? 'big' : bn.startsWith('c:') ? 'sq' : 'room'; }
      cls[c] = (cls[c] || 0) + 1; const k = owner(o); own[k] = (own[k] || 0) + 1;
      mats.add(Array.isArray(o.material) ? o.material.map(m => m.uuid).join() : o.material && o.material.uuid);
      if (W) { const ob = o.material && !Array.isArray(o.material) && o.material.onBeforeCompile !== T.Material.prototype.onBeforeCompile ? ' obc:' + String(o.material.onBeforeCompile).slice(0, 60).replace(/\s+/g, ' ') : ''; const s = (WHY ? c + ' ' : '') + site(o) + (WHY ? ob : ''); st.set(s, (st.get(s) || 0) + 1); } }
    return { pass: ps.cam, calls: ps.n, objects: seen.size, materials: mats.size, where: cls, owners: Object.entries(own).sort((a, b) => b[1] - a[1]).slice(0, 14).map(([k, v]) => k + ':' + v).join(' '),
      sites: W ? [...st].sort((a, b) => b[1] - a[1]).slice(0, 70).map(([k, n]) => String(n).padStart(4) + ' ' + k) : undefined }; });
}, modes.includes('why'));
const fixedEyes = {}, eyesFile = path.join(outdir, '..', `${size}-eyes.json`); try { Object.assign(fixedEyes, JSON.parse(fs.readFileSync(eyesFile, 'utf8'))); } catch {}
const goView = async v => {
  if (v[1] === 'start') return p.evaluate(s => { const G = window.__ah; G.vehicle.place(s.toy[0], s.toy[1], Math.PI / 2, s.toy[2]); G.vehicle.vel.set(0, 0, 0); G.testEye = { at: s.eye, look: s.look }; }, start);
  if (v[1] === 'room') return p.evaluate(re => { const G = window.__ah, r = G.plan.rooms.find(r => new RegExp(re).test(r.id)); const x = (r.x0 + r.x1) / 2, z = (r.z0 + r.z1) / 2; G.vehicle.place(x, z, 0, r.y + 0.05); G.vehicle.vel.set(0, 0, 0); G.testEye = { at: [x - (r.x1 - r.x0) * 0.35, r.y + 1.3, z], look: [r.x1, r.y + 1.0, z] }; }, v[2]);
  const f = fixedEyes[v[0]];
  if (f) return p.evaluate(f => { const G = window.__ah; G.vehicle.place(f.toy[0], f.toy[1], f.toy[2], f.toy[3]); G.vehicle.vel.set(0, 0, 0); G.testEye = { at: f.at, look: f.look }; }, f);
  if (v[1] === 'chase') {
    await p.evaluate((s, yaw) => { const G = window.__ah; G.testEye = null; G.vehicle.place(s.toy[0], s.toy[1], yaw, s.toy[2]); G.vehicle.vel.set(0, 0, 0); }, start, v[2]); await sleep(3000);
    const c = await p.evaluate(() => { const c = window.__ah.camera, d = c.getWorldDirection(new c.position.constructor()); return { at: c.position.toArray(), look: c.position.clone().addScaledVector(d, 10).toArray() }; });
    fixedEyes[v[0]] = { toy: [start.toy[0], start.toy[1], v[2], start.toy[2]], ...c };
  } else {
    const e = v[1], l = v[2], yaw = Math.atan2(l[0] - e[0], l[2] - e[2]);
    await p.evaluate((e, yaw) => { const G = window.__ah; G.testEye = null; G.vehicle.place(e[0], e[2], yaw, 0.05); G.vehicle.vel.set(0, 0, 0); }, e, yaw); await sleep(400);
    const gy = await p.evaluate(() => window.__ah.vehicle.pos.y);
    fixedEyes[v[0]] = v[3] === 'high' ? { toy: [e[0], e[2], yaw, gy], at: e, look: l } : { toy: [e[0], e[2], yaw, gy], at: [e[0], gy + e[1], e[2]], look: [l[0], gy + l[1], l[2]] };
  }
  return goView(v);
};
const results = {};
for (const v of VIEWS) {
  if (!want(v[0])) continue;
  await goView(v); await sleep(3500); await goView(v); await sleep(2000);
  if (modes.includes('count') || who || modes.includes('why')) {
    const r = await p.evaluate(async () => { const M = window.__d; M.passes = []; M.on = true; await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); M.passes = []; await new Promise(r => requestAnimationFrame(r)); M.on = false;
      const G = window.__ah; return { room: G.roomId, vis: G.vis ? G.vis.sig : 'none', bake: G.bake ? G.bake.status() : '', passes: M.sum() }; });
    results[v[0]] = r;
    const vp = r.passes.find(q => q.pass === 'view') || {}, rp = r.passes.find(q => q.pass === 'refl') || {};
    console.log(`\n== ${v[0]} room=${r.room} vis=${r.vis}  VIEW ${vp.calls} (${vp.objects} obj, ${vp.materials} mats)  REFL ${rp.calls || '-'}   ${r.bake}`);
    console.log('  where', JSON.stringify(vp.where)); console.log('  owners', vp.owners); if (vp.sites) for (const s of vp.sites) console.log('   ', s);
  }
  if (modes.includes('shoot')) { await sleep(500); await shot(v[0]); }
  if (modes.includes('fps')) {
    const r = await p.evaluate(async () => { window.__ft.length = 0; window.__ftOn = true; await new Promise(res => setTimeout(res, 5000)); window.__ftOn = false;
      const t = window.__ft.slice().sort((p, q) => p - q); return { n: t.length, ms: +t[t.length >> 1].toFixed(2), mean: +(t.reduce((a, b) => a + b, 0) / t.length).toFixed(2) }; });
    console.log(`fps ${v[0].padEnd(12)} median ${r.ms} ms  mean ${r.mean} ms  frames ${r.n}`); results[v[0] + ':fps'] = r;
  }
}
if (modes.includes('fps') && want('drive')) {
  await p.evaluate(() => { window.__ft.length = 0; window.__ftOn = true; });
  for (let i = 0; i < DRIVE.length - 1; i++) { const [ax, az] = DRIVE[i], [bx, bz] = DRIVE[i + 1];
    for (let k = 0; k < 12; k++) { const t = k / 12, x = ax + (bx - ax) * t, z = az + (bz - az) * t, yaw = Math.atan2(bx - ax, bz - az);
      await p.evaluate((x, z, yaw) => { const G = window.__ah; G.vehicle.place(x, z, yaw, 0.05); G.vehicle.vel.set(0, 0, 0); const y = G.vehicle.pos.y; G.testEye = { at: [x - Math.sin(yaw) * 3, y + 1.6, z - Math.cos(yaw) * 3], look: [x + Math.sin(yaw) * 10, y + 0.6, z + Math.cos(yaw) * 10] }; }, x, z, yaw); await sleep(100); } }
  const r = await p.evaluate(() => { window.__ftOn = false; const t = window.__ft.slice().sort((p, q) => p - q); return { n: t.length, ms: +t[t.length >> 1].toFixed(2), mean: +(t.reduce((a, b) => a + b, 0) / t.length).toFixed(2), p95: +t[Math.floor(t.length * 0.95)].toFixed(2) }; });
  console.log(`fps DRIVE median ${r.ms} ms  mean ${r.mean} ms  p95 ${r.p95}  frames ${r.n}`); results['drive:fps'] = r;
}
if (!fs.existsSync(eyesFile)) fs.writeFileSync(eyesFile, JSON.stringify(fixedEyes, null, 1));
fs.writeFileSync(path.join(outdir, `${size}-${modes.join('+')}.json`), JSON.stringify(results, null, 1));
console.log('\npage errors', errs.length, errs.slice(0, 6)); await b.close();
