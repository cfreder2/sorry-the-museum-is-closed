#!/usr/bin/env node
// Lit-route check: for pairs of points, is the route on the ground it is drawn over, and does it pass through anything solid?
//   node tools/dev/routeprobe.mjs <port> ['[["name",fx,fz,tx,tz],...]'] [outdir]
import fs from 'node:fs'; import path from 'node:path';
const PUP = process.env.PUPPETEER || '/Users/cfreder2/.nvm/versions/node/v24.10.0/lib/node_modules/@mermaid-js/mermaid-cli/node_modules/puppeteer/lib/esm/puppeteer/puppeteer.js';
const puppeteer = (await import(PUP)).default;
const [port, pairs, out] = process.argv.slice(2); if (out) fs.mkdirSync(out, { recursive: true });
const b = await puppeteer.launch({ headless: 'new', args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const p = await b.newPage(); await p.setViewport({ width: 960, height: 540 }); p.on('pageerror', e => console.log('ERR', String(e).slice(0, 200)));
await p.goto(`http://127.0.0.1:${port}/?mode=explore&saved&noopen`, { waitUntil: 'domcontentloaded' });
await p.waitForFunction('window.__ah && window.__ah.state === "play" && window.__ah.nav', { timeout: 300000, polling: 500 });
await p.addStyleTag({ content: 'body > *:not(#view) { visibility: hidden !important; }' });
for (const [name, fx, fz, tx, tz] of JSON.parse(pairs)) {
  const r = await p.evaluate(async (fx, fz, tx, tz) => {
    const G = window.__ah, P = G.plan, plan = await import('./src/plan.js'); G.set.guards = false;
    G.vehicle.place(fx, fz, Math.atan2(tx - fx, tz - fz), 0.05); await new Promise(r => setTimeout(r, 500));
    const gy = (x, z, y) => { const u = P.under, g = plan.groundAt(P, x, z, y); P.under = u; return g; };
    const from = { x: fx, y: G.vehicle.pos.y, z: fz }, to = { x: tx, y: gy(tx, tz, 3), z: tz, label: 'test' };
    const ok = G.nav.goTo(to); await new Promise(r => setTimeout(r, 600));
    const path = G.nav.path || (G.nav.state && G.nav.state.path) || G.nav.route(from, to);
    if (!path) return { ok, none: true };
    const pts = (path.runs ? path.runs.flat() : path.points || path);
    let worst = 0, at = null, buried = 0, floating = 0, solid = 0, n = 0; const solids = [];
    for (const q of pts) {
      if (q.air) continue; n++;
      const g = gy(q.x, q.z, (q.y || 0) + 1.2), d = (q.y || 0) - g;
      if (d < -0.08) buried++; if (d > 0.25) floating++;
      if (Math.abs(d) > Math.abs(worst)) { worst = d; at = [+q.x.toFixed(1), +q.z.toFixed(1), +(q.y || 0).toFixed(2), +g.toFixed(2)]; }
      const o = P.obstacles.find(o => !o.gate && q.x > o.x0 && q.x < o.x1 && q.z > o.z0 && q.z < o.z1 && o.y0 < g + 0.3 && o.y1 > g + 0.1);
      if (o) { solid++; if (solids.length < 4) solids.push([+q.x.toFixed(1), +q.z.toFixed(1), o.id || o.kind || o.skin || Object.keys(o).filter(k => o[k] === true).join('+') || 'obstacle']); }
    }
    const maxG = Math.max(...pts.map(q => gy(q.x, q.z, 30)));
    return { ok, len: Math.round(path.length || 0), pts: pts.length, onGround: n, buried, floating, worst: +worst.toFixed(2), at, solid, solids, highestGroundCrossed: +maxG.toFixed(2), keys: Object.keys(path).slice(0, 8), jumpIn: path.jumpIn };
  }, fx, fz, tx, tz);
  console.log(name.padEnd(16), JSON.stringify(r));
  if (out) { await p.evaluate(async (fx, fz, tx, tz) => { const G = window.__ah, mx = (fx + tx) / 2, mz = (fz + tz) / 2, d = Math.hypot(tx - fx, tz - fz); G.testEye = { at: [fx - (tz - fz) / d * 6 - (tx - fx) / d * 4, 7, fz + (tx - fx) / d * 6 - (tz - fz) / d * 4], look: [mx, 0.5, mz] }; await new Promise(r => setTimeout(r, 1500)); }, fx, fz, tx, tz); await p.screenshot({ path: path.join(out, name + '.jpg'), type: 'jpeg', quality: 82 }); }
}
await b.close();
