#!/usr/bin/env node
// Carry the toy along a line through the lower level and the galleries in real time and report the stalls: the worst
// frame, how many frames took over 50 ms and over 250 ms, and the frame rate at the end (a game that never recovers
// shows here as a low last-second rate).
//   node tools/dev/hitch.mjs <port> [query, e.g. lowmem] [secsPerLeg]
// Serve the repo first with tools/dev/serve.py.
const PUP = process.env.PUPPETEER || '/Users/cfreder2/.nvm/versions/node/v24.10.0/lib/node_modules/@mermaid-js/mermaid-cli/node_modules/puppeteer/lib/esm/puppeteer/puppeteer.js';
const puppeteer = (await import(PUP)).default;
const [port, query = '', secs = '5'] = process.argv.slice(2);
const b = await puppeteer.launch({ headless: 'new', args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const p = await b.newPage(); await p.setViewport({ width: 1280, height: 720 }); const errs = [];
p.on('pageerror', e => errs.push('PAGE ' + String(e).slice(0, 200)));
p.on('console', m => { const t = m.text(); if (m.type() === 'error' && !/artic\.edu|Failed to load resource/.test(t)) errs.push(t.slice(0, 200)); });
await p.goto(`http://127.0.0.1:${port}/?mode=explore&saved&noopen${query ? '&' + query : ''}`, { waitUntil: 'domcontentloaded' });
await p.waitForFunction('window.__ah && window.__ah.state === "play"', { timeout: 300000, polling: 500 });
await new Promise(r => setTimeout(r, 4000));
// [name, x, z, y] waypoints: lower level (the auditoriums, the corridor between), up to the ground floor, the galleries above
const WAY = [['price auditorium', 26, 66, -4.5], ['morton auditorium', 66, 86, -4.5], ['green room', 27, 126, -4.5], ['morton again', 66, 86, -4.5],
  ['ground floor west', 40, 75, 0.1], ['ground floor east', 200, 75, 0.1], ['gallery 241', 101, 104, 5.3], ['gallery 213', 60, 20, 5.3], ['price again', 26, 66, -4.5]];
const out = await p.evaluate(async (WAY, secs) => {
  const G = window.__ah, v = G.vehicle; G.set.guards = false; const res = [];
  const frame = () => new Promise(r => requestAnimationFrame(t => r(t)));
  let last = await frame(), from = WAY[0];
  v.place(from[1], from[2], 0, from[3]);
  for (let i = 1; i < WAY.length; i++) {
    const to = WAY[i], t0 = performance.now(); let worst = 0, n = 0, over50 = 0, over250 = 0; const tail = [];
    while (performance.now() - t0 < secs * 1000) {
      const k = Math.min(1, (performance.now() - t0) / (secs * 700));
      v.place(from[1] + (to[1] - from[1]) * k, from[2] + (to[2] - from[2]) * k, Math.atan2(to[1] - from[1], to[2] - from[2]), from[3] + (to[3] - from[3]) * k);
      if (v.vel) v.vel.set(0, 0, 0);
      const t = await frame(), d = t - last; last = t; n++; worst = Math.max(worst, d); if (d > 50) over50++; if (d > 250) over250++;
      tail.push(d); if (tail.length > 30) tail.shift();
    }
    const fpsEnd = Math.round(1000 / (tail.reduce((a, c) => a + c, 0) / tail.length));
    res.push({ leg: from[0] + ' > ' + to[0], frames: n, worstMs: Math.round(worst), over50, over250, fpsEnd, streamedOut: G.stream ? G.stream.out : null });
    from = to;
  }
  const info = G.renderer.info;
  return { res, geometries: info.memory.geometries, textures: info.memory.textures, stream: !!G.stream };
}, WAY, +secs);
for (const r of out.res) console.log(JSON.stringify(r));
console.log(JSON.stringify({ geometries: out.geometries, textures: out.textures, stream: out.stream }));
console.log(errs.length ? errs.slice(0, 8).join('\n') : 'no errors'); await b.close();
