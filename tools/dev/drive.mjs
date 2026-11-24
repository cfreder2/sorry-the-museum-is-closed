#!/usr/bin/env node
// Drive the car by hand over set lines at 30 and 60 fps (stepping update(dt) directly: a real-time run hides frame-rate
// bugs) and compare: where it ends, how long in the air, the hardest bump, whether it ever sank below the ground or went NaN.
//   node tools/dev/drive.mjs <port> ['[["name",x,z,toX,toZ,throttle?,secs?],...]']
const PUP = process.env.PUPPETEER || '/Users/cfreder2/.nvm/versions/node/v24.10.0/lib/node_modules/@mermaid-js/mermaid-cli/node_modules/puppeteer/lib/esm/puppeteer/puppeteer.js';
const puppeteer = (await import(PUP)).default;
const DEF = [["butler drifts", 300, 40, 460, 90], ["ball field", 380, 120, 450, 200], ["path bank", 330, 20, 330, 110], ["big hill over", 200, 224, 280, 224], ["big hill half", 200, 224, 280, 224, 0.5], ["sled hill", 310, 163, 375, 163], ["windrow LSD", 470, 120, 520, 120], ["columbus x", 265, 100, 305, 100], ["monroe east", 300, -30, 470, -30], ["rail bridge ice", 100, -30, 135, -30, 0.6], ["harbour ridges", 530, 150, 610, 200], ["marked way", 524, 78, 571, 66], ["ice far", 540, 220, 600, 120], ["jump park", 240, 62, 290, 62], ["north garden", 20, 10, 60, 50, 0.7], ["bin yard", 110, 12, 96, 1.6, 0.5], ["lake promenade", 520, 40, 520, 220]];
const [port, lines] = process.argv.slice(2);
const b = await puppeteer.launch({ headless: 'new', args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const p = await b.newPage(); await p.setViewport({ width: 640, height: 360 }); p.on('pageerror', e => console.log('ERR', String(e).slice(0, 200)));
await p.goto(`http://127.0.0.1:${port}/?mode=explore&saved&noopen`, { waitUntil: 'domcontentloaded' });
await p.waitForFunction('window.__ah && window.__ah.state === "play"', { timeout: 300000, polling: 500 });
await new Promise(r => setTimeout(r, 3000));
let bad = 0;
for (const [name, x, z, tx, tz, th = 1, secs = 8] of (lines ? JSON.parse(lines) : DEF)) {
  const r = await p.evaluate(async (x, z, tx, tz, th, secs) => {
    const G = window.__ah, P = G.plan, plan = await import('./src/plan.js'), v = G.vehicle; G.set.guards = false;
    const gy = (x, z, y) => { const u = P.under, g = plan.groundAt(P, x, z, y); P.under = u; return g; };
    const run = fps => {
      v.place(x, z, Math.atan2(tx - x, tz - z), gy(x, z, 3) + 0.05); v.vel.set(0, 0, 0); if (typeof v.speed === 'number') v.speed = 0;
      const dt = 1 / fps; let air = 0, bump = 0, sunk = 0, nan = false, top = 0, maxY = -99, stuckT = 0, t = 0, reached = null;
      for (let i = 0; i < secs * fps; i++) {
        const want = Math.atan2(tx - v.pos.x, tz - v.pos.z); let d = want - v.yaw; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
        v.update(dt, { throttle: th, steer: Math.max(-1, Math.min(1, -d * 2)), jump: false, yaw: 0 }); t += dt;
        if (!isFinite(v.pos.x + v.pos.y + v.pos.z)) { nan = true; break; }
        if (v.air) air += dt; bump = Math.max(bump, v.bump || 0);
        const g = gy(v.pos.x, v.pos.z, v.pos.y + 0.6); if (v.pos.y < g - 0.12) sunk++;
        const sp = Math.hypot(v.vel.x, v.vel.z); top = Math.max(top, sp); if (sp < 0.3 && t > 1) stuckT += dt; maxY = Math.max(maxY, v.pos.y - g);
        if (reached == null && Math.hypot(tx - v.pos.x, tz - v.pos.z) < 2.5) { reached = +t.toFixed(1); break; }
      }
      return { x: +v.pos.x.toFixed(1), z: +v.pos.z.toFixed(1), y: +v.pos.y.toFixed(2), air: +air.toFixed(2), bump: +bump.toFixed(1), sunk, nan, top: +top.toFixed(1), hop: +maxY.toFixed(2), stuck: +stuckT.toFixed(1), reached };
    };
    return { a: run(30), b: run(60) };
  }, x, z, tx, tz, th, secs);
  const { a, b: c } = r, apart = Math.hypot(a.x - c.x, a.z - c.z), flag = a.nan || c.nan || a.sunk > 2 || c.sunk > 2 || (a.reached == null) !== (c.reached == null) || (a.reached == null && apart > 4) || Math.abs(a.hop - c.hop) > 0.8;
  if (flag) bad++;
  const f = q => `end (${q.x}, ${q.z}) y ${q.y}  ${q.reached != null ? 'arrived ' + q.reached + ' s' : 'not arrived'}  air ${q.air} s  highest ${q.hop} m  bump ${q.bump}  top ${q.top}  stuck ${q.stuck} s  sunk ${q.sunk}${q.nan ? '  NaN!' : ''}`;
  console.log(`${flag ? 'CHECK ' : 'ok    '}${name.padEnd(16)} 30: ${f(a)}\n${''.padEnd(22)} 60: ${f(c)}`);
}
console.log(bad ? `${bad} line(s) to look at` : 'all lines agree at 30 and 60 fps');
await b.close();
