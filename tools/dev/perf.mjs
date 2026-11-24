#!/usr/bin/env node
// Frame cost at set spots, phone-sized (844x390 at 2x, touch): each frame's own work (the frame function, then gl.finish),
// so a 30 Hz display cap doesn't hide it; plus draw calls and triangles. One browser, one build per run.
//   node tools/dev/perf.mjs <port> [label] [cpuThrottle]
const PUP = process.env.PUPPETEER || '/Users/cfreder2/.nvm/versions/node/v24.10.0/lib/node_modules/@mermaid-js/mermaid-cli/node_modules/puppeteer/lib/esm/puppeteer/puppeteer.js';
const puppeteer = (await import(PUP)).default;
const SPOTS = [['lobby', 30, 100, 60, 100], ['gallery 201', 'life', 20684], ['security room', 'room', 'BLL-2'], ['butler field', 330, 60, 400, 100], ['lake drive', 497, 100, 497, 180], ['harbour', 555, 150, 610, 200], ['columbus', 285, 60, 285, 140], ['big hill', 205, 200, 240, 224], ['monroe', 150, -30, 230, -30], ['bin yard', 103, 8, 97, 1], ['north garden', 35, 20, 60, 50]];
const [port, label = '', thr = '1'] = process.argv.slice(2);
const b = await puppeteer.launch({ headless: 'new', args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const p = await b.newPage(); await p.setViewport({ width: 844, height: 390, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
p.on('pageerror', e => console.log('ERR', String(e).slice(0, 160)));
await p.evaluateOnNewDocument(() => { window.__ft = []; window.__fc = []; window.__fq = []; const raf = window.requestAnimationFrame.bind(window); window.requestAnimationFrame = cb => raf(t => { const t0 = performance.now(); cb(t); const G = window.__ah, r = G && G.renderer; if (r && window.__ftOn) { r.getContext().finish(); window.__ft.push(performance.now() - t0); window.__fc.push(r.info.render.calls); window.__fq.push(r.info.render.triangles); } }); });
await p.goto(`http://127.0.0.1:${port}/?mode=explore&saved&noopen`, { waitUntil: 'domcontentloaded' });
await p.waitForFunction('window.__ah && window.__ah.state === "play"', { timeout: 300000, polling: 500 });
if (+thr > 1) { const c = await p.createCDPSession(); await c.send('Emulation.setCPUThrottlingRate', { rate: +thr }); }
await p.evaluate(() => { window.__ah.set.guards = false; });
for (const spot of SPOTS) {
  const r = await p.evaluate(async ([name, x, z, lx, lz]) => {
    const G = window.__ah;
    if (x === 'life') { const L = window.__life.life(z), q = L.floor(0.6, 2.2); G.vehicle.place(q.x, q.z, Math.atan2(-L.nx, -L.nz), L.y + 0.05); G.testEye = null; }
    else if (x === 'room') { const r = G.plan.byId[z]; G.vehicle.place((r.x0 + r.x1) / 2, (r.z0 + r.z1) / 2, 0, r.y + 0.05); G.testEye = null; }
    else { G.vehicle.place(x, z, Math.atan2(lx - x, lz - z), 0.05); await new Promise(res => setTimeout(res, 300)); const gy = G.vehicle.pos.y; G.testEye = { at: [x, gy + 0.55, z], look: [lx, gy + 0.45, lz] }; }
    await new Promise(res => setTimeout(res, 3500));
    window.__ft.length = window.__fc.length = window.__fq.length = 0; window.__ftOn = true; await new Promise(res => setTimeout(res, 6000)); window.__ftOn = false;
    const s = a => a.slice().sort((p, q) => p - q), t = s(window.__ft);
    return { state: G.state, n: t.length, ms: +t[t.length >> 1].toFixed(1), p95: +t[Math.floor(t.length * 0.95)].toFixed(1), calls: s(window.__fc)[window.__fc.length >> 1], tris: s(window.__fq)[window.__fq.length >> 1], pr: G.renderer.getPixelRatio() };
  }, spot);
  console.log(`${label.padEnd(4)} ${spot[0].padEnd(14)} ${String(r.ms).padStart(5)} ms  p95 ${String(r.p95).padStart(5)}  ${String(r.calls).padStart(5)} calls  ${String(Math.round(r.tris / 1000)).padStart(5)}k tris  pr ${r.pr}  frames ${r.n}  ${r.state}`);
}
await b.close();
