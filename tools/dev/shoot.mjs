#!/usr/bin/env node
// Boot the game headless, report errors and the hang, and take car's-eye stills.
//   node tools/dev/shoot.mjs <port> [outdir] ['[["name",x,z,lookX,lookZ,eyeHeight?], ...]']
// Serve the repo first with tools/dev/serve.py. Puppeteer: the copy inside mermaid-cli, or $PUPPETEER.
import fs from 'node:fs'; import path from 'node:path';
const PUP = process.env.PUPPETEER || '/Users/cfreder2/.nvm/versions/node/v24.10.0/lib/node_modules/@mermaid-js/mermaid-cli/node_modules/puppeteer/lib/esm/puppeteer/puppeteer.js';
const puppeteer = (await import(PUP)).default;
const [port, out, spots] = process.argv.slice(2); if (out) fs.mkdirSync(out, { recursive: true });
const b = await puppeteer.launch({ headless: 'new', args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const p = await b.newPage(); await p.setViewport({ width: 960, height: 540 }); const errs = [];
p.on('pageerror', e => errs.push('PAGE ' + String(e).slice(0, 240)));
p.on('console', m => { const t = m.text(); if ((m.type() === 'error' || /shader|WebGL|THREE\./i.test(t)) && !/artic\.edu|Failed to load resource/.test(t)) errs.push(m.type() + ' ' + t.slice(0, 240)); });
await p.goto(`http://127.0.0.1:${port}/?mode=explore&saved&noopen`, { waitUntil: 'domcontentloaded' });
await p.waitForFunction('window.__ah && window.__ah.state === "play"', { timeout: 300000, polling: 500 });
await p.addStyleTag({ content: 'body > *:not(#view) { visibility: hidden !important; }' });
await new Promise(r => setTimeout(r, 3000));
console.log(JSON.stringify(await p.evaluate(() => { const G = window.__ah; G.set.guards = false; return { hung: G.museum.arts.length, lives: window.__life ? window.__life.list().length : 0, systems: !!G.systems }; })));
for (const [name, x, z, lx, lz, h = 0.55] of JSON.parse(spots || '[]')) {
  await p.evaluate(async (x, z, lx, lz, h) => { const G = window.__ah, y = G.plan.groundAt ? 0 : 0; G.vehicle.place(x, z, Math.atan2(lx - x, lz - z), 0.05); await new Promise(r => setTimeout(r, 300)); const gy = G.vehicle.pos.y; G.testEye = { at: [x, gy + h, z], look: [lx, gy + h - 0.1, lz] }; await new Promise(r => setTimeout(r, 1700)); }, x, z, lx, lz, h);
  await p.screenshot({ path: path.join(out, name + '.jpg'), type: 'jpeg', quality: 82 });
}
console.log(errs.length ? errs.slice(0, 12).join('\n') : 'no errors'); await b.close();
