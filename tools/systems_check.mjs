#!/usr/bin/env node
// The building's systems (src/systems.js) and the art rule: nothing is ever drawn over a work.
//
//   node tools/systems_check.mjs [--port 8857]
//
// Serve the game first (any static server on --port, from the repo root, with data/img/ for the pictures). It boots
// the game headless, opens every sprinkler valve the system allows, runs the fire suppression test in two wings, and
// then renders from a camera at every doorway between a raining room and a room with works in it (both ways), and
// from three cameras inside each of fourteen galleries under test: once with everything src/systems.js draws hidden,
// once with it shown (__ah.systems.artCheck). It prints how many pixels of works were looked at and how many changed:
//   true    a work shown exactly (alpha 0 in the frame, src/finish.js keepTrue)
//   veiled  a work seen through something of the game's own that already adds light over it (the glass of a case, a
//           picture lamp's wash across a doorway)
// Both must be 0 changed, and the run fails otherwise.
// Puppeteer: the copy inside mermaid-cli (see tools/lifesheet.mjs), or $PUPPETEER.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const args = process.argv.slice(2), opt = n => { const i = args.indexOf('--' + n); return i < 0 ? null : args[i + 1]; };
const port = opt('port') || 8857;
const PUP = process.env.PUPPETEER || '/Users/cfreder2/.nvm/versions/node/v24.10.0/lib/node_modules/@mermaid-js/mermaid-cli/node_modules/puppeteer/lib/esm/puppeteer/puppeteer.js';
const puppeteer = (await import(PUP)).default;
const wait = ms => new Promise(r => setTimeout(r, ms));
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'systems-check-'));
const browser = await puppeteer.launch({ headless: 'new', userDataDir: profile, args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const errors = []; let failed = false;
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto(`http://127.0.0.1:${port}/?mode=explore&saved&noopen`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction('window.__ah && window.__ah.state === "play" && window.__ah.systems', { timeout: 180000, polling: 500 });
  await wait(1500);

  const setup = await page.evaluate(async () => {
    const G = window.__ah, S = G.systems, me = S._self, P = G.plan; G.set.guards = false;
    G.vehicle.place(24.5, 100, 0, 0); G.lampOn = true; G.lamp.intensity = 70;
    G.museum.wakeAll();
    const a = S.run('sprinklers', ['all', 'on']);
    const b = S.run('firetest', ['main-2']), c = S.run('firetest', ['G161']), d = S.run('firetest', ['modern-2']);
    // Views: through every doorway between a raining room and a room with works in it, both ways; and inside tested galleries.
    const views = [], hasArt = id => G.museum.rooms[id] && G.museum.rooms[id].arts.length > 0;
    for (const w of me.wet.values()) {
      const r = w.r;
      for (const dr of P.doorsOf(r.id)) {
        const oid = dr.a === r.id ? dr.b : dr.a, o = P.byId[oid]; if (!o || !hasArt(oid) || Math.abs(o.y - r.y) > 0.3) continue;
        const mx = (dr.x0 + dr.x1) / 2, mz = (dr.z0 + dr.z1) / 2, ax = dr.along === 'x', s = Math.sign(ax ? (r.x0 + r.x1) / 2 - mx : (r.z0 + r.z1) / 2 - mz);
        const back = Math.min(3.2, (ax ? r.x1 - r.x0 : r.z1 - r.z0) * 0.6);
        views.push({ name: r.id + '>' + oid, at: [mx + (ax ? s * back : 0.3), r.y + 0.9, mz + (ax ? 0.3 : s * back)], look: [mx - (ax ? s * 4 : 0), r.y + 1.3, mz - (ax ? 0 : s * 4)], fov: 70 });
        views.push({ name: oid + '>' + r.id, at: [mx - (ax ? s * 3 : 0.4), o.y + 1.2, mz - (ax ? 0.4 : s * 3)], look: [mx + (ax ? s * 3 : 0), o.y + 0.6, mz + (ax ? 0 : s * 3)], fov: 75 });
      }
    }
    const tested = [...me.tests.values()].map(ft => ft.r);
    for (const r of tested.filter(r => hasArt(r.id)).slice(0, 14)) {
      const cx = (r.x0 + r.x1) / 2, cz = (r.z0 + r.z1) / 2;
      views.push({ name: r.id + ' corner', at: [r.x0 + 0.8, r.y + 1.5, r.z0 + 0.8], look: [r.x1 - 1, r.y + 0.6, r.z1 - 1], fov: 75 });
      views.push({ name: r.id + ' low', at: [cx, r.y + 0.25, cz], look: [r.x0, r.y + 0.9, cz + 0.5], fov: 75 });
      views.push({ name: r.id + ' floor', at: [r.x1 - 0.7, r.y + 0.12, r.z1 - 0.7], look: [r.x0 + 1, r.y + 1.2, r.z0 + 1], fov: 80 });
    }
    return { a: a.lines, b: b.lines, c: c.lines, d: d.lines, views, wet: me.wet.size, tests: me.tests.size, struck: me.struck.length, caps: tested.slice(0, 200).map(r => +me.tests.get(r.id).cap.toFixed(2)) };
  });
  console.log(JSON.stringify({ ...setup, views: setup.views.length, caps: undefined }));
  const caps = setup.caps; console.log('vapour caps: min', Math.min(...caps), 'max', Math.max(...caps), 'no vapour (cap < 0.12):', caps.filter(c => c < 0.12).length, 'of', caps.length);
  await wait(9000);      // the rain has spread, the tests are running (20 s)
  const t0 = Date.now(); const rows = []; let n = 0;
  const pass = async (views, label) => {
    for (const v of views) {
      await page.evaluate(v => { window.__ah.testEye = { at: v.at, look: v.look }; }, v);
      await wait(450);
      const r = await page.evaluate(v => { const G = window.__ah, me = G.systems._self; const res = G.systems.artCheck([v]); return { row: res.rows[0], running: [...me.tests.values()].filter(t => t.stage === 'run').length, raining: [...me.wet.values()].filter(w => w.on).length, fx: [...me.wet.values()].filter(w => w.fx && w.near).length + [...me.tests.values()].filter(t => t.fx && t.near).length }; }, v);
      rows.push({ ...r.row, label, running: r.running, raining: r.raining, fx: r.fx });
    }
  };
  // The test lasts 20 s: the gallery views first, then (the wing re-armed) the doorway views.
  const gal = setup.views.filter(v => / (corner|low|floor)$/.test(v.name)), doors = setup.views.filter(v => !/ (corner|low|floor)$/.test(v.name));
  await pass(gal.slice(0, 18), 'test');
  await pass(doors, 'doors');
  console.log('rearm', JSON.stringify(await page.evaluate(async () => { const G = window.__ah, me = G.systems._self; for (const ft of [...me.tests.values()]) { me._endTest(ft, 'x'); } me.rested.clear(); await new Promise(r => setTimeout(r, 4000)); me.rested.clear(); const a = G.systems.run('sprinklers', ['all', 'on']); const b = G.systems.run('firetest', ['main-2']); return [a.lines[0], b.lines[0]]; })));
  await wait(9000);
  await pass(gal.slice(18), 'test2');
  const sum = k => rows.reduce((a, r) => a + r[k], 0);
  console.log(JSON.stringify({ views: rows.length, secs: Math.round((Date.now() - t0) / 1000), truePx: sum('truePx'), trueChanged: sum('trueChanged'), veiledPx: sum('veiledPx'), veiledChanged: sum('veiledChanged'), effectPx: sum('effectPx'), viewsWithArt: rows.filter(r => r.truePx > 0).length, viewsWithEffect: rows.filter(r => r.effectPx > 0).length, viewsWithBoth: rows.filter(r => r.truePx > 0 && r.effectPx > 0).length }));
  const by = l => { const q = rows.filter(r => r.label.startsWith(l)); const s2 = k => q.reduce((a, r) => a + r[k], 0); return { views: q.length, truePx: s2('truePx'), trueChanged: s2('trueChanged'), veiledPx: s2('veiledPx'), veiledChanged: s2('veiledChanged'), effectPx: s2('effectPx'), worstVeiled: Math.max(0, ...q.map(r => r.worstVeiled)) }; };
  console.log('doorways (rain)', JSON.stringify(by('doors'))); console.log('galleries (fire test)', JSON.stringify(by('test')));
  const bad = rows.filter(r => r.trueChanged > 0 || r.veiledChanged > 0); console.log('views with any change on a work:', bad.length); for (const r of bad.slice(0, 14)) console.log(JSON.stringify(r));
  failed = sum('trueChanged') > 0 || sum('veiledChanged') > 0;
  console.log(failed ? 'FAIL: pixels of a work have changed' : 'PASS: not one pixel of a work has changed, shown true or veiled');
} finally {
  if (errors.length) { console.log('page errors:\n' + [...new Set(errors)].join('\n')); failed = true; }
  await browser.close();
  await wait(500);
  try { fs.rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 }); } catch { /* left behind */ }
}
process.exit(failed ? 1 : 0);
