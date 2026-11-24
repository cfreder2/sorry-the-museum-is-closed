#!/usr/bin/env node
// Drive the lit way: light it (G.nav.goTo), then steer the real car at the arrows, stepped by hand at 60 and at 30
// frames a second (update(dt) directly, the game's own loop paused), at a sensible speed: 3.6 m/s, slower into bends,
// and at whatever speed a jump on the way asks for. Says whether it arrived, how far off the arrows it ever was on the
// ground (maxOff, metres: the car is 0.38 m wide), what it hit (bumps), whether it went into the water, how long in the air.
//   node tools/dev/routedrive.mjs <port> ['[["name",fx,fz,tx,tz,fy?,ty?],...]'] [outdir]
// Pairs as routeprobe.mjs takes them; "more" (or none given) for the ones the plan knows (routecases.mjs), "first" for
// the eight out of doors. With an outdir, a picture of each from above: the field (landway.js: grey ground, greener the
// higher, redder the dearer; red what is solid, purple the kit's walls, blue water), the spots found by driving, the
// way (cyan; white where it is in the air) and where the car went (yellow).
import fs from 'node:fs'; import path from 'node:path';
import { moreCases, FIRST } from './routecases.mjs';
const PUP = process.env.PUPPETEER || '/Users/cfreder2/.nvm/versions/node/v24.10.0/lib/node_modules/@mermaid-js/mermaid-cli/node_modules/puppeteer/lib/esm/puppeteer/puppeteer.js';
const puppeteer = (await import(PUP)).default;
const [port, pairs, out] = process.argv.slice(2); if (out) fs.mkdirSync(out, { recursive: true });
const b = await puppeteer.launch({ headless: 'new', args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'], protocolTimeout: 900000 });
const p = await b.newPage(); await p.setViewport({ width: 640, height: 360 }); p.on('pageerror', e => console.log('ERR', String(e).slice(0, 200)));
await p.goto(`http://127.0.0.1:${port}/?mode=explore&saved&noopen`, { waitUntil: 'domcontentloaded' });
await p.waitForFunction('window.__ah && window.__ah.state === "play" && window.__ah.nav', { timeout: 300000, polling: 500 });
let list = pairs ? JSON.parse(pairs) : ['first', 'more'];
const more = list.includes('more') ? await p.evaluate(moreCases) : [];
list = list.flatMap(q => (q === 'more' ? more : q === 'first' ? FIRST : [q]));

// (in the page) one drive: from f to t, [x, z, y], at fps
async function drive(f, t, fps, trace) {
  const G = window.__ah, P = G.plan, planM = await import('./src/plan.js'), v = G.vehicle, dt = 1 / fps;
  if (P.locked) G.museum.setLocked(false, false);
  G.state = 'play'; G.set.guards = false;
  const gy = (x, z) => { const u = P.under, g = planM.groundAt(P, x, z, 3); P.under = u; return g; };
  v.place(f[0], f[1], 0, (f[2] ?? 0) + 0.05);
  if (!G.nav.goTo({ x: t[0], y: t[2] ?? gy(t[0], t[1]), z: t[1], label: 'test' })) return { fps, none: true };
  const way = G.nav.path, pts = way.runs.flat(), n = pts.length;
  if (way.runs.length > 1) return { fps, lift: true };                 // (a lift on the way: not driven here)
  { const a = pts[0], c = pts[Math.min(n - 1, 6)]; v.place(a.x, a.z, Math.atan2(c.x - a.x, c.z - a.z), a.y + 0.05); }
  G.state = 'paused';                                                 // the game's own loop leaves the car alone
  const cum = [0]; for (let i = 1; i < n; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z));
  const airs = (way.airs || []).map(a => { let k = 0, bd = 1e9; for (let i = 0; i < n; i++) { const d = Math.hypot(pts[i].x - a.x, pts[i].z - a.z) + Math.abs(pts[i].y - a.y); if (d < bd) { bd = d; k = i; } } return { i: k, v: a.v }; });
  const seg = (x, z, i) => { const a = pts[i], c = pts[i + 1], dx = c.x - a.x, dz = c.z - a.z, l2 = dx * dx + dz * dz || 1e-9, u = Math.max(0, Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / l2)); return Math.hypot(x - a.x - dx * u, z - a.z - dz * u); };
  let best = -1, at = 0, T = 0, maxOff = 0, offAt = null, bumps = 0, worst = 0, bumpAt = null, wet = false, stuck = 0, maxV = 0, airT = 0; const log = [], inp = { throttle: 0, steer: 0, jump: false, trick: false };
  for (; T < 180; T += dt) {
    let k0 = at, bd = 1e9; for (let i = Math.max(0, at - 4); i < Math.min(n, at + 40); i++) { const d = Math.hypot(pts[i].x - v.pos.x, pts[i].z - v.pos.z) + Math.abs(pts[i].y - v.pos.y) * 0.5; if (d < bd) { bd = d; k0 = i; } }
    at = k0;
    const sp = Math.hypot(v.vel.x, v.vel.z); if (sp > maxV) maxV = sp;
    if (!v.air) { let off = 1e9; for (let i = Math.max(0, at - 8); i <= Math.min(n - 2, at + 8); i++) if (Math.abs(pts[i].y - v.pos.y) < 1.2) off = Math.min(off, seg(v.pos.x, v.pos.z, i)); if (off < 1e8 && off > maxOff && T > 0.3) { maxOff = off; offAt = [+v.pos.x.toFixed(1), +v.pos.y.toFixed(2), +v.pos.z.toFixed(1)]; } } else airT += dt;
    if ((cum[n - 1] - cum[at] < 0.7 || Math.hypot(pts[n - 1].x - v.pos.x, pts[n - 1].z - v.pos.z) < 1) && Math.abs(pts[n - 1].y - v.pos.y) < 1) break;
    const nextAir = airs.find(a => a.i >= at - 2), toAir = nextAir ? cum[nextAir.i] - cum[at] : 1e9;
    const Ld = Math.max(0.8, Math.min(2.4, 0.55 + sp * 0.26)); let k = at; while (k < n - 1 && cum[k] - cum[at] < Ld) k++;
    let err = Math.atan2(pts[k].x - v.pos.x, pts[k].z - v.pos.z) - v.yaw; err = Math.atan2(Math.sin(err), Math.cos(err));
    let k2 = at; while (k2 < n - 1 && cum[k2] - cum[at] < 3.5) k2++;
    const h0 = Math.atan2(pts[Math.min(n - 1, at + 2)].x - pts[at].x, pts[Math.min(n - 1, at + 2)].z - pts[at].z), h1 = Math.atan2(pts[k2].x - pts[Math.max(0, k2 - 2)].x, pts[k2].z - pts[Math.max(0, k2 - 2)].z), bend = Math.abs(Math.atan2(Math.sin(h1 - h0), Math.cos(h1 - h0)));
    let vd = 3.6 * Math.max(0.42, 1 - bend * 0.55 - Math.abs(err) * 0.9);
    if (Math.abs(err) > 1.1) vd = 0.9;                                                         // a hairpin: at a crawl
    if (toAir < 9 && toAir > -0.5) vd = Math.max(vd, nextAir.v * 1.04);                        // a jump: at the speed it asks for
    else if (cum[n - 1] - cum[at] < 3) vd = Math.min(vd, Math.max(0.7, (cum[n - 1] - cum[at]) * 0.8));
    { const a = pts[at], c = pts[Math.min(n - 1, at + 1)], tx = c.x - a.x, tz = c.z - a.z, tl = Math.hypot(tx, tz) || 1, cross = ((v.pos.x - a.x) * tz - (v.pos.z - a.z) * tx) / tl; if (!v.air) err += Math.max(-0.5, Math.min(0.5, -cross * 0.9)); }      // back onto the line
    inp.steer = Math.max(-1, Math.min(1, -err * 2.6));
    inp.throttle = Math.max(-0.6, Math.min(1, (vd - sp) * 0.9 + 0.12));
    if (Math.abs(err) > 1.9 && sp < 0.5) inp.throttle = 0.5;
    planM.stepLifts(P, dt, [v.pos]);
    v.update(dt, inp);
    if (v.bump > 0.6 && !v.landed) { bumps++; if (v.bump > worst) { worst = v.bump; bumpAt = [+v.pos.x.toFixed(1), +v.pos.y.toFixed(2), +v.pos.z.toFixed(1)]; } }
    if (P.lakefront && P.lakefront.wet(v.pos.x, v.pos.z) && v.pos.y < 0.02 && !v.air) { wet = true; break; }
    if (sp < 0.05 || at <= best) { stuck += dt; if (stuck > 8) break; } else stuck = 0;
    if (at > best) best = at;
    if (trace) log.push([v.pos.x, v.pos.z]);
  }
  const end = pts[n - 1], arrived = Math.hypot(end.x - v.pos.x, end.z - v.pos.z) < 1.2 && Math.abs(end.y - v.pos.y) < 1;
  G.state = 'play';
  return { fps, arrived, secs: +T.toFixed(1), len: Math.round(cum[n - 1]), maxOff: +maxOff.toFixed(2), offAt, bumps, worstBump: +worst.toFixed(1), bumpAt, wet, stuck: stuck > 8, topSpeed: +maxV.toFixed(1), airSecs: +airT.toFixed(2), jumps: airs.length, log: trace ? log : undefined };
}
// (in the page) the field, the spots, the way and the car's line, from above
function picture(log) {
  const G = window.__ah, L = G.nav.land, d = L.debug, P = G.plan, pts = G.nav.path.runs.flat(), all = [...pts.map(q => [q.x, q.z]), ...log];
  const x0 = Math.min(...all.map(q => q[0])) - 4, x1 = Math.max(...all.map(q => q[0])) + 4, z0 = Math.min(...all.map(q => q[1])) - 4, z1 = Math.max(...all.map(q => q[1])) + 4, ppm = Math.max(4, Math.min(40, 1600 / Math.max(x1 - x0, z1 - z0)));
  const cv = document.createElement('canvas'); cv.width = Math.round((x1 - x0) * ppm); cv.height = Math.round((z1 - z0) * ppm); const c = cv.getContext('2d'), X = x => (x - x0) * ppm, Z = z => (z - z0) * ppm;
  c.fillStyle = '#000'; c.fillRect(0, 0, cv.width, cv.height);
  for (let z = Math.floor(z0 * 2) / 2; z < z1; z += 0.5) for (let x = Math.floor(x0 * 2) / 2; x < x1; x += 0.5) {
    const k = d.cellOf(x + 0.25, z + 0.25); if (k < 0) continue; const f = d.K[k];
    c.fillStyle = f & 1 ? '#333' : f & 2 ? '#a22' : f & 32 ? '#737' : f & 16 ? '#124' : f & 4 ? '#664' : f & 8 ? '#443' : `rgb(${Math.min(255, 20 + (d.costOf(k) - 1) * 160)},${60 + Math.min(120, Math.max(0, d.H[k]) * 40)},60)`;
    c.fillRect(X(x), Z(z), ppm / 2 + 0.5, ppm / 2 + 0.5);
  }
  c.lineWidth = 1; c.strokeStyle = 'rgba(255,255,255,.45)'; for (const s of P.surfaces) if (!s.hill && s.x1 > x0 && s.x0 < x1 && s.z1 > z0 && s.z0 < z1) c.strokeRect(X(s.x0), Z(s.z0), (s.x1 - s.x0) * ppm, (s.z1 - s.z0) * ppm);
  const sp = d.spots; for (let e = 0; e < sp.n; e++) { const x = sp.x[e], z = sp.z[e]; if (x < x0 || x > x1 || z < z0 || z > z1) continue; c.fillStyle = sp.out[e] ? `hsl(${(sp.y[e] * 60 + 200) % 360},90%,60%)` : '#555'; c.fillRect(X(x) - 1, Z(z) - 1, 2, 2); }
  c.strokeStyle = '#7fe9f5'; c.lineWidth = 2; c.beginPath(); pts.forEach((q, i) => (i ? c.lineTo(X(q.x), Z(q.z)) : c.moveTo(X(q.x), Z(q.z)))); c.stroke(); c.fillStyle = '#fff'; for (const q of pts) if (q.air) c.fillRect(X(q.x) - 1, Z(q.z) - 1, 2, 2);
  c.strokeStyle = '#ff4'; c.lineWidth = 1.2; c.beginPath(); log.forEach((q, i) => (i ? c.lineTo(X(q[0]), Z(q[1])) : c.moveTo(X(q[0]), Z(q[1])))); c.stroke();
  return cv.toDataURL('image/png');
}
let ok = 0, all = 0;
for (const [name, fx, fz, tx, tz, fy, ty] of list) {
  for (const fps of [60, 30]) {
    const r = await p.evaluate(drive, [fx, fz, fy], [tx, tz, ty], fps, !!out && fps === 60); const log = r.log; delete r.log;
    all++; if (r.arrived && !r.bumps && r.maxOff <= 0.38) ok++;
    console.log(name.padEnd(16), JSON.stringify(r));
    if (out && log && !r.none && !r.lift) fs.writeFileSync(path.join(out, name + '-driven.png'), Buffer.from((await p.evaluate(picture, log)).split(',')[1], 'base64'));
  }
}
console.log(`${ok} of ${all} drives arrived on the arrows (within the car's own width, 0.38 m) with nothing hit`);
await b.close();
