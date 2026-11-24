#!/usr/bin/env node
// Lit-route check: for pairs of points, is the route on the ground it is drawn over, and does it pass through anything solid?
//   node tools/dev/routeprobe.mjs <port> ['[["name",fx,fz,tx,tz],...]'] [outdir]
// A pair may give heights too: ["name", fx, fz, tx, tz, fy, ty] (left out, each end is on the ground there, under 3 m).
// The word "more" among the pairs (or no pairs at all) adds the ones the plan itself knows where to find, with the
// building unlocked: a hilltop, the lighthouse by the marked way and the floes, a floe, a table top by its ramp, the
// bridgeway's deck, a roof by the scaffold, the foot of the staff vent's duct and back up it, a room on another floor by
// the stairs, a room with kit in it, a jump indoors.
// Each line: how long the way is, how many of its points are under the ground (`buried`), over it (`floating`) or inside
// something solid (`solid`), how high it goes, where it ends, and how long it took to find (ms; `looked`: places searched).
import fs from 'node:fs'; import path from 'node:path';
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
  const more = await p.evaluate(async () => {
    const G = window.__ah, P = G.plan, plan = await import('./src/plan.js');
    const top = (x, z, y = 40) => { const u = P.under, g = plan.groundAt(P, x, z, y); P.under = u; return g; };
    const mid = id => { const r = P.byId[id]; return r ? [(r.x0 + r.x1) / 2, (r.z0 + r.z1) / 2, r.y] : null; };
    const L = [], add = (name, f, t) => { if (f && t) L.push([name, f[0], f[1], t[0], t[1], f[2] ?? top(f[0], f[1], 3), t[2] ?? top(t[0], t[1], 3)]); };
    const big = (P.hills || []).slice().sort((a, b) => b.H - a.H);
    if (big[1]) add('hilltop', [big[1].cx - big[1].rx - 20, big[1].cz], [big[1].cx + 3, big[1].cz + 1, top(big[1].cx + 3, big[1].cz + 1)]);
    if (big[0]) add('sled-hill-top', [big[0].cx - big[0].rx - 3, big[0].cz - big[0].rz - 14], [big[0].cx, big[0].cz, top(big[0].cx, big[0].cz)]);
    const K = P.lakefront;
    if (K && K.light) { add('lighthouse', [K.lsd.x0 - 10, 70], [K.light.x, K.light.z + 6, top(K.light.x, K.light.z + 6)]); const f = K.floes.filter(q => q.route)[1]; if (f) add('floe', [K.shore + 10, 100], [f.hx, f.hz, f.top]); }
    const tb = P.surfaces.find(s => s.skin === 'snow' && !s.axis && !s.hill && s.h0 > 1.5 && s.h0 < 2.5 && P.surfaces.some(q => q.skin === 'snow' && q.axis === 'x' && !q.curve && Math.abs(q.x1 - s.x0) < 0.05 && q.h1 === s.h0 && q.h0 === 0));
    if (tb) add('table-top', [tb.x0 - 16, tb.z0 - 6], [(tb.x0 + tb.x1) / 2, (tb.z0 + tb.z1) / 2, tb.h0]);
    const D = G.museum.mw && G.museum.mw.deck; if (D) { const z = (D.z0 + D.z1) / 2 - 10, x = D.cx(z); add('bridgeway-deck', [x - 3, P.bounds.z0 + 12], [x, z, top(x, z)]); }
    if (P.scaffold) add('roof', [P.scaffold.x - 12, P.scaffold.z + 26], [P.scaffold.x + 6, P.scaffold.z - 13, top(P.scaffold.x + 6, P.scaffold.z - 13)]);
    const V = P.staffVent; if (V) { add('duct-foot', [V.bin.land.x + 3, V.zc + 4], [V.x0 - 1.6, V.zc, V.y]); add('up-the-duct', [V.x0 - 4, V.zc, V.y], [V.bin.land.x + 0.5, V.zc]); }
    add('upstairs', mid('G200'), mid('G283')); add('room-with-kit', mid('G150'), mid('G161'));
    if (P.locked) G.museum.setLocked(false, false);
    G.nav.goTo({ x: 300, y: 0, z: 100, label: 'warm' }); const nav = G.nav.nav;      // (a test aid on the map: the ways it has worked out)
    if (nav) for (const [key, J] of nav.jumps) { const [a, c] = key.split(':').map(Number), A = nav.nodes[a], B = nav.nodes[c]; if (A.place[0] !== 'R' || J.gap < 0.3) continue; const ux = B.x - A.x, uz = B.z - A.z, l = Math.hypot(ux, uz); add('jump-indoors', [A.x - ux / l * 1.2, A.z - uz / l * 1.2, A.y], [B.x + ux / l * 1.5, B.z + uz / l * 1.5, B.y]); break; }
    G.nav.clear();
    return L;
  });
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
