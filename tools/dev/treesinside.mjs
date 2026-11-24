#!/usr/bin/env node
// Count the vertices of the grounds' trees and shrubs that lie inside the building: inMass (inside a mass, walls and
// slabs included) and inRoomAir (in the air of a room, where they can be seen, more than 5 cm off the floor: this must be 0), by room.
//   node tools/dev/treesinside.mjs <port>
// Serve the repo first with tools/dev/serve.py. 
const PUP = process.env.PUPPETEER || '/Users/cfreder2/.nvm/versions/node/v24.10.0/lib/node_modules/@mermaid-js/mermaid-cli/node_modules/puppeteer/lib/esm/puppeteer/puppeteer.js';
const puppeteer = (await import(PUP)).default;
const [port] = process.argv.slice(2);
const b = await puppeteer.launch({ headless: 'new', args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const p = await b.newPage(); await p.setViewport({ width: 640, height: 360 }); const errs = [];
p.on('pageerror', e => errs.push('PAGE ' + String(e).slice(0, 240)));
await p.goto(`http://127.0.0.1:${port}/?mode=explore&saved&noopen`, { waitUntil: 'domcontentloaded' });
await p.waitForFunction('window.__ah && window.__ah.state === "play"', { timeout: 300000, polling: 500 });
console.log(JSON.stringify(await p.evaluate(() => {
  const G = window.__ah, M = G.plan.masses, IN = 0.12, rooms = {}, lods = []; let total = 0, verts = 0, high = 0, seen = 0; const where = [];
  G.museum.group.traverse(o => { if (o.name === 'trees') lods.push(o); });
  for (const lod of lods) for (const lv of lod.levels) {
    const g = lv.object.geometry; if (!g) continue; const a = g.attributes.position, cx = lod.position.x, cz = lod.position.z;
    for (let i = 0; i < a.count; i++) {
      const x = a.getX(i) + cx, y = a.getY(i), z = a.getZ(i) + cz; verts++;
      for (const m of M) if (x > m.x0 + IN && x < m.x1 - IN && z > m.z0 + IN && z < m.z1 - IN && y < m.top - 0.1 && y > (m.room ? m.room.y - 0.3 : -2)) { total++; if (y > (m.room ? m.room.y : 0) + 1.6) high++; const r = m.room; if (r && x > r.x0 + 0.02 && x < r.x1 - 0.02 && z > r.z0 + 0.02 && z < r.z1 - 0.02 && y > r.y + 0.05 && y < Math.min(r.top, r.y + (r.ceil || r.h))) { seen++; rooms[r.id] = (rooms[r.id] || 0) + 1; if (where.length < 6) where.push([+x.toFixed(2), +y.toFixed(2), +z.toFixed(2), r.id, r.x0, r.x1, r.z0, r.z1, r.y, r.top]); } break; }
    }
  }
  return { lods: lods.length, verts, inMass: total, inRoomAir: seen, above1_6m: high, trees: G.museum.treeStats && G.museum.treeStats.trees, rooms, where };
})));
console.log(errs.length ? errs.slice(0, 8).join('\n') : 'no errors'); await b.close();
