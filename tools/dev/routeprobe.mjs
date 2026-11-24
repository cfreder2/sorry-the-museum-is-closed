#!/usr/bin/env node
// Lit-route check: for pairs of points, is the route on the ground it is drawn over, and does it pass through anything solid?
//   node tools/dev/routeprobe.mjs <port> ['[["name",fx,fz,tx,tz],...]'] [outdir]
// A pair may give heights too: ["name", fx, fz, tx, tz, fy, ty] (left out, each end is on the ground there, under 3 m).
// The word "more" among the pairs (or no pairs at all) adds the ones the plan itself knows where to find, with the
// building unlocked (routecases.mjs): a hilltop, the lighthouse by the marked way and the floes, a floe, a table top by
// its ramp, the bridgeway's deck, a roof by the scaffold, the foot of the staff vent's duct and back up it, a room on
// another floor by the stairs, a room with kit in it, a jump indoors. (routedrive.mjs drives the same ways.)
// Each line: how long the way is, how many of its points are under the ground (`buried`), over it (`floating`) or inside
// something solid (`solid`), how high it goes, where it ends, and how long it took to find (ms; `looked`: places searched).
import fs from 'node:fs'; import path from 'node:path';
import { moreCases } from './routecases.mjs';
const PUP = process.env.PUPPETEER || '/Users/cfreder2/.nvm/versions/node/v24.10.0/lib/node_modules/@mermaid-js/mermaid-cli/node_modules/puppeteer/lib/esm/puppeteer/puppeteer.js';
const puppeteer = (await import(PUP)).default;
const [port, pairs, out] = process.argv.slice(2); if (out) fs.mkdirSync(out, { recursive: true });
const b = await puppeteer.launch({ headless: 'new', args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const p = await b.newPage(); await p.setViewport({ width: 960, height: 540 }); p.on('pageerror', e => console.log('ERR', String(e).slice(0, 200)));
await p.goto(`http://127.0.0.1:${port}/?mode=explore&saved&noopen`, { waitUntil: 'domcontentloaded' });
await p.waitForFunction('window.__ah && window.__ah.state === "play" && window.__ah.nav', { timeout: 300000, polling: 500 });
await p.addStyleTag({ content: 'body > *:not(#view) { visibility: hidden !important; }' });
let list = pairs ? JSON.parse(pairs) : ['more'];
if (list.includes('more')) {
  const more = await p.evaluate(moreCases);
  list = list.flatMap(q => (q === 'more' ? more : [q]));
}
let unlocked = false;
for (const [name, fx, fz, tx, tz, fy, ty] of list) {
  const r = await p.evaluate(async (fx, fz, tx, tz, fy, ty, unlock) => {
    const G = window.__ah, P = G.plan, plan = await import('./src/plan.js'); G.set.guards = false;
    if (unlock && P.locked) G.museum.setLocked(false, false);
    G.vehicle.place(fx, fz, Math.atan2(tx - fx, tz - fz), (fy ?? 0) + 0.05); await new Promise(r => setTimeout(r, 500));
    const gy = (x, z, y) => { const u = P.under, g = plan.groundAt(P, x, z, y); P.under = u; return g; };
    const from = { x: fx, y: G.vehicle.pos.y, z: fz }, to = { x: tx, y: ty ?? gy(tx, tz, 3), z: tz, label: 'test' };
    const t0 = performance.now(), ok = G.nav.goTo(to), ms = +(performance.now() - t0).toFixed(1); await new Promise(r => setTimeout(r, 600));
    const path = G.nav.path || (G.nav.state && G.nav.state.path) || G.nav.route(from, to);
    if (!path) return { ok, none: true, ms };
    const pts = (path.runs ? path.runs.flat() : path.points || path);
    let worst = 0, at = null, buried = 0, floating = 0, solid = 0, n = 0; const solids = [];
    for (const q of pts) {
      if (q.air) continue; n++;
      // (the ground something at the point's own height would be on: indoors, and up on a deck or under one, that is not whatever is highest within a metre)
      const g = gy(q.x, q.z, (q.y || 0) + (q.o && Math.abs(q.y) < 1.5 ? 1.2 : 0.3)), d = (q.y || 0) - g;
      if (d < -0.08) buried++; if (d > 0.25) floating++;
      if (Math.abs(d) > Math.abs(worst)) { worst = d; at = [+q.x.toFixed(1), +q.z.toFixed(1), +(q.y || 0).toFixed(2), +g.toFixed(2)]; }
      const o = P.obstacles.find(o => !o.gate && q.x > o.x0 && q.x < o.x1 && q.z > o.z0 && q.z < o.z1 && o.y0 < g + 0.3 && o.y1 > g + 0.1);
      if (o) { solid++; if (solids.length < 4) solids.push([+q.x.toFixed(1), +q.z.toFixed(1), o.id || o.kind || o.skin || Object.keys(o).filter(k => o[k] === true).join('+') || 'obstacle']); }
    }
    const maxG = Math.max(...pts.map(q => gy(q.x, q.z, 30))), e = pts[pts.length - 1];
    return { ok, len: Math.round(path.length || 0), pts: pts.length, onGround: n, buried, floating, worst: +worst.toFixed(2), at, solid, solids, highestGroundCrossed: +maxG.toFixed(2), y: [+Math.min(...pts.map(q => q.y)).toFixed(2), +Math.max(...pts.map(q => q.y)).toFixed(2)], end: [+e.x.toFixed(1), +e.y.toFixed(2), +e.z.toFixed(1)], jumpIn: path.jumpIn, jumps: (path.airs || []).length, ms, looked: path.looked };
  }, fx, fz, tx, tz, fy ?? null, ty ?? null, fy != null || ty != null || unlocked);
  if (fy != null || ty != null) unlocked = true;
  console.log(name.padEnd(16), JSON.stringify(r));
  if (out) { await p.evaluate(async (fx, fz, tx, tz, y) => { const G = window.__ah, mx = (fx + tx) / 2, mz = (fz + tz) / 2, d = Math.hypot(tx - fx, tz - fz) || 1; G.testEye = { at: [fx - (tz - fz) / d * 6 - (tx - fx) / d * 4, y + 7, fz + (tx - fx) / d * 6 - (tz - fz) / d * 4], look: [mx, y + 0.5, mz] }; await new Promise(r => setTimeout(r, 1500)); }, fx, fz, tx, tz, Math.max(0, fy ?? 0)); await p.screenshot({ path: path.join(out, name + '.jpg'), type: 'jpeg', quality: 82 }); }
}
console.log('land', JSON.stringify(await p.evaluate(() => { const L = window.__ah.nav.land; return L ? L.stats : null; })));
await b.close();
