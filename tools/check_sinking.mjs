#!/usr/bin/env node
// Finds places outdoors where something is drawn higher than the ground a toy actually drives on, so its wheels
// would sink into it: a kerb, an apron, a pool's ice, a step drawn as a box with no surface on top. The usual fix is
// landable(plan, x0, x1, z0, z1, top) from src/plan.js beside the drawing (or drawing it lower). Snow drifts of a
// few centimetres show up too, and are fine to sink into.
//
//   PUPPETEER=/path/to/puppeteer node tools/check_sinking.mjs [step-in-metres]
//
// Needs puppeteer (any install; point PUPPETEER at its folder) and a GPU browser. It serves the repo itself.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const ROOT = path.dirname(path.dirname(new URL(import.meta.url).pathname));
const require = createRequire(import.meta.url);
const puppeteer = require(process.env.PUPPETEER || 'puppeteer');
const step = +(process.argv[2] || 2);
const TYPES = { '.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
const server = http.createServer((q, r) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'; fs.readFile(path.join(ROOT, p), (e, d) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' }); r.end(d); }); }).listen(0);
const port = server.address().port;
const b = await puppeteer.launch({ headless: true, protocolTimeout: 900000, args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const p = await b.newPage(); await p.setViewport({ width: 900, height: 600 });
await p.goto(`http://localhost:${port}/?mode=explore&toy=car&saved`); await p.waitForFunction(() => window.__ah && window.__ah.state === 'play', { timeout: 200000 });
const out = await p.evaluate(async (step) => {
    const THREE = await import('/vendor/three.module.min.js'), P = await import('/src/plan.js'), G = window.__ah, plan = G.plan, B = plan.bounds;
    G.scene.updateMatrixWorld(true);
    // static, opaque, visible meshes only (no sprites, glows, the toy, snowfall)
    const meshes = []; G.scene.traverse(o => { if (!o.isMesh || o.isInstancedMesh) return; for (let q = o; q; q = q.parent) if (!q.visible) return; const m = Array.isArray(o.material) ? o.material[0] : o.material; if (!m || m.transparent || m.blending !== THREE.NormalBlending || !m.depthWrite) return; if (G.vehicle.group && (o === G.vehicle.group || G.vehicle.group.getObjectById(o.id))) return; try { if (!o.geometry.attributes.position) return; if (o.geometry.index === null && o.geometry.attributes.position.count % 3) return; o.geometry.boundingSphere || o.geometry.computeBoundingSphere(); } catch { return; } try { if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); if (!o.geometry.boundingBox) return; o.userData._bb = o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld); } catch { return; } meshes.push(o); });
    const rc = new THREE.Raycaster(), down = new THREE.Vector3(0, -1, 0), from = new THREE.Vector3(), clusters = new Map(); let n = 0, bad = 0;
    for (let x = B.x0; x <= (B.cx1 || B.x1); x += step) for (let z = B.z0; z <= B.z1; z += step) {
      if (P.roomAt(plan, x, z, 0.2)) continue;                        // outdoors only
      const g = P.groundAt(plan, x, z, 30); if (!(g > -6 && g < 25)) continue; if (plan.obstacles.some(o => x > o.x0 - 0.15 && x < o.x1 + 0.15 && z > o.z0 - 0.15 && z < o.z1 + 0.15 && o.y0 < g + 0.3 && o.y1 > g + 0.02)) continue;
      from.set(x, g + 0.6, z); rc.set(from, down); rc.far = 0.6 + 0.4;
      let hits = []; for (const o of meshes) { const bb = o.userData._bb; if (x < bb.min.x || x > bb.max.x || z < bb.min.z || z > bb.max.z || bb.max.y < g - 0.1 || bb.min.y > g + 0.6) continue; try { o.raycast(rc, hits); } catch {} } hits.sort((a, b) => a.distance - b.distance); if (!hits.length) continue; n++;
      const h = hits[0]; if (!h.face || Math.abs(h.face.normal.clone().transformDirection(h.object.matrixWorld).y) < 0.9) continue;    // a top, not a side
      const lift = h.point.y - g;
      if (lift > 0.035) { bad++; const k = Math.round(x / 6) * 6 + ',' + Math.round(z / 6) * 6; const c = clusters.get(k) || { x, z, n: 0, max: 0, col: (Array.isArray(h.object.material) ? h.object.material[0] : h.object.material).color?.getHexString() }; c.n++; c.max = Math.max(c.max, lift); clusters.set(k, c); }
    }
    return { n, bad, clusters: [...clusters.values()].sort((a, b) => b.n - a.n).slice(0, 60).map(c => [Math.round(c.x), Math.round(c.z), c.n, +c.max.toFixed(2), c.col]) };
  }, step);
console.log(`${out.n} outdoor points, ${out.bad} drawn more than 3.5 cm above the ground. [x, z, points, how high, colour]:`);
for (const c of out.clusters) console.log('  ' + JSON.stringify(c));
await b.close(); server.close();
