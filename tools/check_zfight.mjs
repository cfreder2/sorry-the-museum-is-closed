#!/usr/bin/env node
// Finds faces drawn on top of one another: two large faces in the same plane (within a few millimetres), facing the
// same way and overlapping, from different meshes or in different looks. The depth buffer cannot tell them apart, so
// they flicker as the camera moves: a pattern laid flush on a wall, two buildings' walls in one plane, a stripe flush
// with a train's side. (Two faces back to back, facing opposite ways, are a thin wall and are fine, unless one of
// them is drawn double-sided.) The usual fix is to stand one off the other by a centimetre or two, or not draw one.
//
//   PUPPETEER=/path/to/puppeteer node tools/check_zfight.mjs [x,z ...] [--gap=0.005] [--area=0.05] [--all] [--offset]
//
// Each x,z puts the toy there before looking, since some things are only shown near the toy; with none it looks
// from where the game starts. --all looks at hidden meshes too. Pairs whose two faces would look identical (one
// material, the same texture coordinates) are counted but not listed: they cannot be seen to fight. Nor are pairs drawn
// in different polygon offsets, which is how a layer is meant to lie on another, unless --offset is given.
// Needs puppeteer (any install; point PUPPETEER at its folder) and a GPU browser. It serves the repo itself.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const ROOT = path.dirname(path.dirname(new URL(import.meta.url).pathname));
const require = createRequire(import.meta.url);
const puppeteer = require(process.env.PUPPETEER || 'puppeteer');
const opt = k => { const a = process.argv.find(s => s.startsWith('--' + k + '=')); return a ? +a.split('=')[1] : null; };
const GAP = opt('gap') ?? 0.005, AREA = opt('area') ?? 0.05, ALL = process.argv.includes('--all'), OFFSET = process.argv.includes('--offset');
const spots = process.argv.slice(2).filter(s => /^-?[\d.]+,-?[\d.]+$/.test(s)).map(s => s.split(',').map(Number));
const TYPES = { '.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
const server = http.createServer((q, r) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'; fs.readFile(path.join(ROOT, p), (e, d) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' }); r.end(d); }); }).listen(0);
const port = server.address().port;
const b = await puppeteer.launch({ headless: true, protocolTimeout: 900000, args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const errors = [];
try {
  const p = await b.newPage(); await p.setViewport({ width: 900, height: 600 });
  p.on('pageerror', e => errors.push(String(e)));
  // (audit: the fit-out keeps its vertices after upload, src/museum.js, so the furniture can be looked at too)
  await p.goto(`http://localhost:${port}/?mode=explore&toy=car&saved&audit`); await p.waitForFunction(() => window.__ah && window.__ah.state === 'play', { timeout: 200000 });
  const found = new Map(); let same = 0, apart = 0, tris = 0;
  for (const at of spots.length ? spots : [null]) {
    if (at) { await p.evaluate(at => window.__ah.vehicle.place(at[0], at[1], 0), at); await new Promise(r => setTimeout(r, 1200)); }
    const out = await p.evaluate(async (GAP, AREA, ALL, OFFSET) => {
      const THREE = await import('/vendor/three.module.min.js'), G = window.__ah;
      G.scene.updateMatrixWorld(true);
      const toy = new Set(); for (const v of [G.car, G.drone]) v && v.group && v.group.traverse(o => toy.add(o));
      // Static-looking, opaque meshes. (Instanced meshes are looked at instance by instance.)
      const meshes = [];
      G.scene.traverse(o => {
        if (!o.isMesh || toy.has(o) || !o.geometry || !o.geometry.attributes.position) return;
        if (!ALL) for (let q = o; q; q = q.parent) if (!q.visible) return;
        const ms = Array.isArray(o.material) ? o.material : [o.material];
        if (ms.every(m => !m || m.transparent || !m.depthWrite || !m.depthTest || m.blending !== THREE.NormalBlending)) return;
        meshes.push(o);
      });
      const name = o => { const c = []; for (let q = o; q && q.type !== 'Scene'; q = q.parent) c.push(q.name || q.type); return c.join('<'); };
      const look = m => !m ? '?' : [m.type.replace('Material', ''), m.color ? '#' + m.color.getHexString() : '', m.map ? 'map' + (m.map.image ? m.map.image.width + 'x' + m.map.image.height : '') : '', m.emissive ? 'em#' + m.emissive.getHexString() : '', m.side === THREE.DoubleSide ? 'double' : '', m.polygonOffset ? 'offset' + m.polygonOffsetFactor : ''].filter(Boolean).join(' ');
      // Overlap of two triangles in one plane: clip one by the other, in the plane's own 2D.
      const to2 = (n, P) => { const ax = Math.abs(n[0]), ay = Math.abs(n[1]), az = Math.abs(n[2]); return ax >= ay && ax >= az ? [P[1], P[2]] : ay >= az ? [P[0], P[2]] : [P[0], P[1]]; };
      const scale = n => 1 / Math.max(Math.abs(n[0]), Math.abs(n[1]), Math.abs(n[2]));
      const area2 = P => { let s = 0; for (let i = 0; i < P.length; i++) { const q = P[i], r = P[(i + 1) % P.length]; s += q[0] * r[1] - r[0] * q[1]; } return s / 2; };
      const clip = (subject, win) => {
        let out = subject; const ccw = area2(win) > 0 ? 1 : -1;
        for (let i = 0; i < win.length && out.length; i++) {
          const a = win[i], b = win[(i + 1) % win.length], inp = out; out = [];
          const side = q => ccw * ((b[0] - a[0]) * (q[1] - a[1]) - (b[1] - a[1]) * (q[0] - a[0]));
          for (let j = 0; j < inp.length; j++) {
            const P = inp[j], Q = inp[(j + 1) % inp.length], sp = side(P), sq = side(Q);
            if (sp >= 0) out.push(P);
            if ((sp >= 0) !== (sq >= 0)) { const t = sp / (sp - sq); out.push([P[0] + (Q[0] - P[0]) * t, P[1] + (Q[1] - P[1]) * t]); }
          }
        }
        return out.length >= 3 ? Math.abs(area2(out)) : 0;
      };
      // The texture coordinate at a point of a triangle, to tell two faces that would look the same from two that would not.
      const uvAt = (t, q2) => { const P = t.p.map(v => to2(t.n, v)), d = (P[1][0] - P[0][0]) * (P[2][1] - P[0][1]) - (P[2][0] - P[0][0]) * (P[1][1] - P[0][1]); if (!t.uv || Math.abs(d) < 1e-12) return null; const l1 = ((q2[0] - P[0][0]) * (P[2][1] - P[0][1]) - (P[2][0] - P[0][0]) * (q2[1] - P[0][1])) / d, l2 = ((P[1][0] - P[0][0]) * (q2[1] - P[0][1]) - (q2[0] - P[0][0]) * (P[1][1] - P[0][1])) / d, l0 = 1 - l1 - l2; return [0, 1].map(k => l0 * t.uv[0][k] + l1 * t.uv[1][k] + l2 * t.uv[2][k]); };
      const GS = 12, PLANE = Math.max(GAP, 0.002);
      // Every big enough triangle, in world space, filed under its plane.
      const T = [], cells = new Map(), A = new THREE.Vector3(), B = new THREE.Vector3(), C = new THREE.Vector3(), N = new THREE.Vector3(), E1 = new THREE.Vector3(), E2 = new THREE.Vector3(), M = new THREE.Matrix4(), IM = new THREE.Matrix4();
      const ua = [], ub = [], uc = [];
      for (const [mi, o] of meshes.entries()) {
        const g = o.geometry, pos = g.attributes.position, uv = g.attributes.uv, idx = g.index;
        if (!pos?.array || (idx && !idx.array) || (uv && !uv.array)) continue;      // (a geometry whose copy was let go once it was on the graphics card)
        const count = idx ? idx.count : pos.count;
        const ms = Array.isArray(o.material) ? o.material : [o.material];
        const groups = g.groups.length ? g.groups : [{ start: 0, count, materialIndex: 0 }];
        const inst = o.isInstancedMesh ? o.count : 1;
        for (let k = 0; k < inst; k++) {
          if (o.isInstancedMesh) { o.getMatrixAt(k, IM); M.multiplyMatrices(o.matrixWorld, IM); } else M.copy(o.matrixWorld);
          for (const gr of groups) {
            const mat = ms[gr.materialIndex || 0];
            if (!mat || mat.transparent || !mat.depthWrite || !mat.depthTest || mat.blending !== THREE.NormalBlending || mat.visible === false) continue;
            const end = Math.min(count, gr.start + gr.count);
            for (let i = gr.start; i + 2 < end; i += 3) {
              const a = idx ? idx.getX(i) : i, b = idx ? idx.getX(i + 1) : i + 1, c = idx ? idx.getX(i + 2) : i + 2;
              A.fromBufferAttribute(pos, a).applyMatrix4(M); B.fromBufferAttribute(pos, b).applyMatrix4(M); C.fromBufferAttribute(pos, c).applyMatrix4(M);
              E1.subVectors(B, A); E2.subVectors(C, A); N.crossVectors(E1, E2); const area = N.length() / 2;
              if (area < AREA) continue;
              N.normalize();
              const t = { mi, mat, n: [N.x, N.y, N.z], d: N.dot(A), p: [A.toArray(), B.toArray(), C.toArray()], uv: uv ? [[uv.getX(a), uv.getY(a)], [uv.getX(b), uv.getY(b)], [uv.getX(c), uv.getY(c)]] : null, area };
              T.push(t);
              // file under the plane (the normal to a few degrees, sign kept, and the offset to the gap) and, in the plane, a grid
              const P2 = t.p.map(v => to2(t.n, v)); t.b2 = [Math.min(P2[0][0], P2[1][0], P2[2][0]), Math.min(P2[0][1], P2[1][1], P2[2][1]), Math.max(P2[0][0], P2[1][0], P2[2][0]), Math.max(P2[0][1], P2[1][1], P2[2][1])];
              t.nk = Math.round(N.x * 40) + ',' + Math.round(N.y * 40) + ',' + Math.round(N.z * 40); t.cell = Math.floor(t.d / PLANE);
              for (let gx = Math.floor(t.b2[0] / GS); gx <= Math.floor(t.b2[2] / GS); gx++) for (let gy = Math.floor(t.b2[1] / GS); gy <= Math.floor(t.b2[3] / GS); gy++) {
                const ks = t.nk + '|' + t.cell + '|' + gx + '|' + gy; if (!cells.has(ks)) cells.set(ks, []); cells.get(ks).push(T.length - 1);
              }
            }
          }
        }
      }
      const pairs = new Map(); let sameLook = 0, offsetApart = 0;
      for (const [ks, list] of cells) {
        const [nk, c, gx, gy] = ks.split('|'), cell = +c, neg = nk.split(',').map(v => -v).join(',');
        const at = q => cells.get(q) || [];
        const ahead = at(nk + '|' + (cell + 1) + '|' + gx + '|' + gy);
        // facing the opposite way, only a double-sided face can fight
        const back = [...at(neg + '|' + (-cell - 1) + '|' + gx + '|' + gy), ...at(neg + '|' + (-cell) + '|' + gx + '|' + gy)];
        for (const [ii, i] of list.entries()) {
          const t = T[i];
          for (const j of [...list.slice(ii + 1), ...ahead, ...back.filter(j => j > i)]) {
            const u = T[j];
            // each pair once: in the grid square where the overlap of their bounds begins
            if (Math.floor(Math.max(t.b2[0], u.b2[0]) / GS) !== +gx || Math.floor(Math.max(t.b2[1], u.b2[1]) / GS) !== +gy) continue;
            const dot = t.n[0] * u.n[0] + t.n[1] * u.n[1] + t.n[2] * u.n[2];
            if (Math.abs(dot) < 0.9995) continue;
            if (dot < 0 && t.mat.side !== THREE.DoubleSide && u.mat.side !== THREE.DoubleSide) continue;
            const gap = Math.abs(t.d - Math.sign(dot) * u.d); if (gap > GAP) continue;
            const P = t.p.map(v => to2(t.n, v)), Q = u.p.map(v => to2(t.n, v));
            if (Math.max(...P.map(v => v[0])) <= Math.min(...Q.map(v => v[0])) || Math.max(...Q.map(v => v[0])) <= Math.min(...P.map(v => v[0])) || Math.max(...P.map(v => v[1])) <= Math.min(...Q.map(v => v[1])) || Math.max(...Q.map(v => v[1])) <= Math.min(...P.map(v => v[1]))) continue;
            const ov = clip(P, Q) * scale(t.n); if (ov < 0.01) continue;
            if (t.mat === u.mat && dot > 0) {      // one material: a fight only if the texture is laid differently on the two
              const c = [(P[0][0] + P[1][0] + P[2][0]) / 3, (P[0][1] + P[1][1] + P[2][1]) / 3], a1 = uvAt(t, c), a2 = uvAt(u, c);
              const same = !t.mat.map || (a1 && a2 && Math.abs(a1[0] - a2[0]) < 0.02 && Math.abs(a1[1] - a2[1]) < 0.02);
              if (same) { sameLook++; continue; }
            }
            // drawn in different depth offsets on purpose (a layer laid over another with polygonOffset): the depth test keeps them apart
            const off = m => m.polygonOffset ? m.polygonOffsetFactor + '/' + m.polygonOffsetUnits : '0/0';
            if (!OFFSET && dot > 0 && off(t.mat) !== off(u.mat)) { offsetApart++; continue; }
            const [lo, hi] = t.mi < u.mi || (t.mi === u.mi && t.mat.id <= u.mat.id) ? [t, u] : [u, t];
            const pk = lo.mi + '/' + lo.mat.id + '|' + hi.mi + '/' + hi.mat.id + '|' + (dot > 0 ? '=' : 'x');
            const cx = (t.p[0][0] + t.p[1][0] + t.p[2][0]) / 3, cy = (t.p[0][1] + t.p[1][1] + t.p[2][1]) / 3, cz = (t.p[0][2] + t.p[1][2] + t.p[2][2]) / 3;
            const e = pairs.get(pk) || { a: name(meshes[lo.mi]) + ' [' + look(lo.mat) + ']', b: name(meshes[hi.mi]) + ' [' + look(hi.mat) + ']', facing: dot > 0 ? 'same way' : 'back to back, double-sided', area: 0, gap: 0, n: lo.n.map(v => +v.toFixed(2)), lo: [cx, cy, cz], hi: [cx, cy, cz] };
            e.area += ov; e.gap = Math.max(e.gap, gap);
            e.lo = e.lo.map((v, q) => Math.min(v, [cx, cy, cz][q])); e.hi = e.hi.map((v, q) => Math.max(v, [cx, cy, cz][q]));
            pairs.set(pk, e);
          }
        }
      }
      return { tris: T.length, sameLook, offsetApart, pairs: [...pairs.entries()].map(([k, e]) => ({ k, ...e, lo: e.lo.map(v => +v.toFixed(1)), hi: e.hi.map(v => +v.toFixed(1)), area: +e.area.toFixed(2), gap: +(e.gap * 1000).toFixed(1) })) };
    }, GAP, AREA, ALL, OFFSET);
    tris = Math.max(tris, out.tris); same += out.sameLook; apart += out.offsetApart;
    for (const e of out.pairs) { const k = e.a + '|' + e.b + '|' + e.lo.join(); if (!found.has(k)) found.set(k, e); }
  }
  const list = [...found.values()].sort((a, b) => b.area - a.area);
  console.log(`${tris} faces of ${AREA} m² or more looked at; ${list.length} overlapping pairs that can be seen to fight (and ${same} that would look the same either way, ${apart} kept apart by a polygon offset).`);
  for (const e of list) console.log(`  ${e.area} m², gap ${e.gap} mm, ${e.facing}, facing [${e.n}], around [${e.lo}]..[${e.hi}]\n      ${e.a}\n      ${e.b}`);
} finally {
  if (errors.length) console.log('page errors:\n  ' + errors.join('\n  '));
  await b.close(); server.close();
}
