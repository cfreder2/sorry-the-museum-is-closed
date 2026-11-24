#!/usr/bin/env node
// Which works hang tonight and which have a life: writes a JSON list of every hung picture.
//   node tools/dev/hung.mjs <port> <out.json>
import fs from 'node:fs';
const PUP = process.env.PUPPETEER || '/Users/cfreder2/.nvm/versions/node/v24.10.0/lib/node_modules/@mermaid-js/mermaid-cli/node_modules/puppeteer/lib/esm/puppeteer/puppeteer.js';
const puppeteer = (await import(PUP)).default;
const b = await puppeteer.launch({ headless: 'new', args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const p = await b.newPage(); await p.setViewport({ width: 640, height: 360 });
await p.goto(`http://127.0.0.1:${process.argv[2]}/?mode=explore&saved&noopen`, { waitUntil: 'domcontentloaded' });
await p.waitForFunction('window.__ah && window.__ah.state === "play" && window.__life', { timeout: 300000, polling: 500 });
const rows = await p.evaluate(() => { const G = window.__ah, alive = new Set(window.__life.list().map(l => l.id)); return G.museum.arts.filter(a => !a.obj && !a.mini && a.nx != null).map(a => { const w = a.work, r = G.plan.byId[a.room]; return { id: w.id, t: w.t, a: w.a, d: w.d, k: w.k, m: w.m, s: w.s, c: w.c ? 1 : 0, b: w.b || 0, room: a.room, gallery: (r && r.gallery) || a.room, floor: r && r.floor, w: +a.w.toFixed(2), h: +a.h.toFixed(2), bottom: +(a.y - a.h / 2 - (a.fy || 0)).toFixed(2), alive: alive.has(w.id) || /Grande Jatte/.test(w.t || '') }; }); });
fs.writeFileSync(process.argv[3], JSON.stringify(rows)); console.log(rows.length, 'hung pictures'); await b.close();
