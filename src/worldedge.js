// The north and south edges of the world (plan.bounds z0 and z1): where the toy can go no further, something stands
// that stops it. Along the back of the Monroe and Jackson pavements, across the park, the promenade, the revetment and
// out over the harbour ice, the snow the ploughs have thrown up lies in a bank taller than the toy is long. Across the
// two through roads (Michigan Avenue and Lake Shore Drive), whose traffic carries on out of the world, the plough has
// left a windrow of crusted slush: the cars ride through it in the ruts their wheels have cut, and to a 46 cm toy it is
// still a wall. On the promenade and the pavements a row of water-filled barriers stands in front of the bank, and out
// on the ice a sign says why not.
//
// Solid as drawn: every bank, windrow and barrier has its foot (or its face) on the line that confine() keeps the toy
// behind (plan.js), so the toy stops against it. All of it is one snow mesh, one barrier mesh and one sign.

import * as THREE from 'three';
import * as TX from './textures.js';
import { Geo } from './geo.js';
import { groundAt } from './plan.js';
import { trafficLanes } from './streetscape.js';

// Value noise along a line, smooth, 0..1.
const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const noise = x => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return hash(i) + (hash(i + 1) - hash(i)) * u; };
const smooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

export function buildWorldEdge(museum, plan) {
  const B = plan.bounds, G = plan.grounds, L = plan.lakefront, group = museum.group;
  const add = (...m) => { for (const x of m) { x.matrixAutoUpdate = false; x.updateMatrix(); group.add(x); } };
  const TL = trafficLanes(plan);
  // Where it runs across, west to east: from the city's frontage to a little short of the open water.
  const XW = B.x0 - 6;
  const iceEnd = z => { if (!L || !L.edge) return B.x1; let m = Infinity; for (const [x, ez] of L.edge) if (Math.abs(ez - z) < 6) m = Math.min(m, x); return (m === Infinity ? L.edgeMin : m) - 0.9; };
  // The strip under the Nichols Bridgeway that is opened beyond the line and fenced (wingplay.js): left open.
  const mw = museum.mw, gap = mw && mw.A && mw.E ? [Math.min(mw.E.x, mw.A.x) - 8.4, Math.max(mw.E.x, mw.A.x) + 8.4] : null;
  // The through roads: the windrow, with ruts where the traffic's wheels run (a track either side of each lane's line).
  const roads = [[G.michigan.x0, G.michigan.x1, [...TL.ns.mich[1], ...TL.ns.mich[-1]]]];
  if (L) roads.push([L.lsd.x0, L.lsd.med[0], TL.ns.lsd[1]], [L.lsd.med[1], L.lsd.x1, TL.ns.lsd[-1]]);
  // The barriers: on the promenade, and on the pavements either side of Michigan Avenue.
  const fenced = [];
  if (L) fenced.push([L.prom.x0 + 0.3, L.prom.x1 - 0.2]);
  fenced.push([G.walk.x0 + 0.4, G.walk.x1 - 0.4]);

  const snowTex = museum.snowTex;
  const bank = { p: [], uv: [], c: [], idx: [] };
  const barrier = new Geo(), cap = new Geo(), post = new Geo();
  const lamps = [];

  for (const side of [-1, 1]) {
    const zl = side < 0 ? B.z0 : B.z1;            // the line
    const xe = iceEnd(zl);
    const runs = gap && side < 0 ? [[XW, gap[0]], [gap[1], xe]] : [[XW, xe]];
    const seed = side < 0 ? 0 : 500;
    for (const [xa, xb] of runs) {
      const n = Math.ceil((xb - xa) / 0.5), base = bank.p.length / 3, ACROSS = 10;
      for (let i = 0; i <= n; i++) {
        const x = xa + (xb - xa) * i / n;
        // How much of a bank (1) or of a windrow (0) it is here; how far back a barrier sets it.
        let road = 0; for (const [a, b] of roads) road = Math.max(road, smooth(a - 0.8, a + 0.6, x) * (1 - smooth(b - 0.6, b + 0.8, x)));
        let set = 0; for (const [a, b] of fenced) set = Math.max(set, smooth(a - 0.6, a, x) * (1 - smooth(b, b + 0.6, x)));
        let rut = 1; if (road > 0) for (const [, , lanes] of roads) for (const lx of lanes) for (const w of [-0.82, 0.82]) rut = Math.min(rut, 0.35 + 0.65 * smooth(0.12, 0.42, Math.abs(x - lx - w)));
        const end = smooth(xa, xa + 1.6, x) * (1 - smooth(xb - 1.6, xb, x));     // rounded off at the ends, never cut
        const hb = (1.2 + 0.32 * noise(x / 3.1 + seed) + 0.14 * noise(x / 0.9 + seed + 50)) * (1 + 0.15 * set);
        const hw = 0.36 * rut * (0.9 + 0.2 * noise(x / 0.7 + seed + 9));
        const h = (hb + (hw - hb) * road) * Math.max(end, 0.04), wide = (3.9 + 0.5 * noise(x / 4 + seed + 3)) * (1 - road) + 1.8 * road;
        const d0 = set * 0.62;                     // (the bank stands back behind a row of barriers)
        const g0 = groundAt(plan, x, zl - side * 0.25, 4), g1 = groundAt(plan, x, zl + side * (d0 + wide), 4);
        const gIn = Number.isFinite(g0) ? g0 : 0, gOut = Number.isFinite(g1) ? g1 : gIn, top = Math.max(gIn, gOut);
        for (let k = 0; k <= ACROSS; k++) {
          const t = k / ACROSS;
          // the profile: a steep face on the side the toy is on, the crest a third of the way back, a long tail
          const f = t < 0.28 ? Math.sin(t / 0.28 * Math.PI / 2) ** 0.8 : 0.5 + 0.5 * Math.cos((t - 0.28) / 0.72 * Math.PI);
          const d = d0 + t * wide, gy = gIn + (gOut - gIn) * smooth(0.1, 1, t);
          const y = t === 0 ? gIn - 0.02 : t === 1 ? gOut - 0.04 : Math.max(gy, top * f + gy * (1 - f) + h * f);
          const z = zl + side * d;
          bank.p.push(x, y, z); bank.uv.push(x / 2.6, d / 2.6);
          // ploughed snow is grey along its foot on a road, and clean on top
          const grime = (0.62 + 0.38 * smooth(0.0, 0.7, f)) * (1 - 0.18 * road) + 0.06 * noise(x * 1.7 + k);
          bank.c.push(grime * 0.97, grime * 0.98, Math.min(1, grime * 1.03));
        }
      }
      for (let i = 0; i < n; i++) for (let k = 0; k < ACROSS; k++) {
        const a = base + i * (ACROSS + 1) + k, b = a + ACROSS + 1;
        if (side < 0) bank.idx.push(a, b, a + 1, b, b + 1, a + 1); else bank.idx.push(a, a + 1, b, b, a + 1, b + 1);
      }
    }
    // A row of water-filled barriers, orange and white, face on the line, snow on their tops; a lamp on every third.
    for (const [a, b] of fenced) {
      const cnt = Math.max(1, Math.round((b - a) / 1.25)), len = (b - a) / cnt;
      for (let i = 0; i < cnt; i++) {
        const x0 = a + i * len + 0.025, x1 = x0 + len - 0.05, gy = groundAt(plan, (x0 + x1) / 2, zl - side * 0.25, 4);
        const y0 = Number.isFinite(gy) ? gy : 0, col = i % 2 ? [0.92, 0.9, 0.86] : [0.95, 0.36, 0.08];
        // cross-section: a broad foot, a waist, a narrow top, from the line outwards
        const prof = [[0, 0], [0, 0.14], [0.08, 0.3], [0.13, 0.74], [0.15, 0.8], [0.37, 0.8], [0.39, 0.74], [0.44, 0.3], [0.52, 0.14], [0.52, 0]];
        barrier.col = col;
        for (let k = 0; k + 1 < prof.length; k++) {
          const [da, ya] = prof[k], [db, yb] = prof[k + 1], za = zl + side * (da + 0.03), zb = zl + side * (db + 0.03), nd = -(yb - ya), ny = db - da, l = Math.hypot(nd, ny) || 1;
          const sh = 0.62 + 0.38 * Math.min(1, (ya + yb) / 1.5) + (ny / l > 0.9 ? 0.08 : 0); barrier.col = col.map(c => c * sh);      // moulded plastic: darker down at the foot, lightest on the top
          barrier.quad([x0, y0 + ya, za], [x1, y0 + ya, za], [x1, y0 + yb, zb], [x0, y0 + yb, zb], [0, ny / l, side * nd / l]);
        }
        barrier.col = col.map(c => c * 0.8);
        for (const x of [x0, x1]) { const pts = prof.map(([d, y]) => [x, y0 + y, zl + side * (d + 0.03)]); for (let k = 1; k + 1 < pts.length; k++) barrier.quad(pts[0], pts[k], pts[k + 1], pts[k + 1], [x === x0 ? -1 : 1, 0, 0]); }
        barrier.col = [0.12, 0.12, 0.13];                         // the fill cap and the moulded handle slot
        barrier.box((x0 + x1) / 2 - 0.07, (x0 + x1) / 2 + 0.07, y0 + 0.8, y0 + 0.83, zl + side * 0.22 - 0.05, zl + side * 0.22 + 0.05);
        cap.box(x0 + 0.04, x1 - 0.04, y0 + 0.8, y0 + 0.86 + 0.03 * Math.sin(i * 2.1), Math.min(zl + side * 0.16, zl + side * 0.36), Math.max(zl + side * 0.16, zl + side * 0.36));
        if (i % 3 === 1) { const lx = (x0 + x1) / 2, lz = zl + side * 0.26; post.box(lx - 0.02, lx + 0.02, y0 + 0.83, y0 + 1.02, lz - 0.02, lz + 0.02); lamps.push([lx, y0 + 1.07, lz]); }
      }
    }
  }

  // ---- the bank
  { const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(bank.p, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(bank.uv, 2)); g.setAttribute('color', new THREE.Float32BufferAttribute(bank.c, 3));
    g.setIndex(bank.idx); g.computeVertexNormals();
    const m = new THREE.MeshStandardMaterial({ map: snowTex, vertexColors: true, roughness: 0.95, emissiveMap: snowTex, emissive: new THREE.Color(0.27, 0.32, 0.48), emissiveIntensity: 0.55 });
    m.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n\ttotalEmissiveRadiance *= vColor.rgb;'); };
    add(new THREE.Mesh(g, m)); }
  // ---- the barriers, their snow, the lamps on them (amber, lit: they are what the eye finds first in the dark)
  { const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, emissive: 0xffffff, emissiveIntensity: 0.32 });
    m.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n\ttotalEmissiveRadiance *= vColor.rgb;'); };
    add(barrier.mesh(m), post.mesh(new THREE.MeshStandardMaterial({ color: 0x202226, roughness: 0.6, emissive: 0x0c0d10, emissiveIntensity: 0.6 })));
    add(cap.mesh(new THREE.MeshStandardMaterial({ map: snowTex, roughness: 0.95, emissiveMap: snowTex, emissive: new THREE.Color(0.3, 0.36, 0.52), emissiveIntensity: 0.55 }))); }
  if (lamps.length) {
    const lens = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.07, 0.07, 0.05, 12).rotateX(Math.PI / 2), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 1.2, 0.15) }), lamps.length), M = new THREE.Matrix4();
    lamps.forEach(([x, y, z], i) => lens.setMatrixAt(i, M.makeTranslation(x, y, z)));
    lens.frustumCulled = false; group.add(lens);
    const glowM = new THREE.SpriteMaterial({ map: TX.radial(0, 1.6), color: new THREE.Color(1.0, 0.55, 0.12), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
    for (const [x, y, z] of lamps) { const s = new THREE.Sprite(glowM); s.position.set(x, y, z); s.scale.setScalar(0.7); add(s); }
  }
  // ---- out on the ice, a sign on a post in the bank at each end: why not
  if (L) {
    const cv = document.createElement('canvas'); cv.width = 256; cv.height = 160; const c = cv.getContext('2d');
    c.fillStyle = '#f3efe4'; c.fillRect(0, 0, 256, 160); c.fillStyle = '#c4202a'; c.fillRect(0, 0, 256, 54); c.strokeStyle = '#1b1b1b'; c.lineWidth = 6; c.strokeRect(3, 3, 250, 154);
    c.fillStyle = '#fff'; c.font = '700 40px Arial, Helvetica, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('DANGER', 128, 29);
    c.fillStyle = '#1b1b1b'; c.font = '700 34px Arial, Helvetica, sans-serif'; c.fillText('THIN ICE', 128, 88); c.font = '600 22px Arial, Helvetica, sans-serif'; c.fillText('KEEP OFF', 128, 128);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    const face = new THREE.MeshStandardMaterial({ map: t, roughness: 0.6, emissiveMap: t, emissive: 0xffffff, emissiveIntensity: 0.4 });
    const pole = new THREE.MeshStandardMaterial({ color: 0x26292e, roughness: 0.6, emissive: 0x0c0d10, emissiveIntensity: 0.6 });
    for (const side of [-1, 1]) {
      const zl = side < 0 ? B.z0 : B.z1, x = (L.shore + iceEnd(zl)) / 2 + 6, z = zl + side * 1.4;
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 2.0, 6), pole); p.position.set(x, 1.0, z);
      const s = TX.twoFaced(new THREE.PlaneGeometry(0.9, 0.56), face); s.position.set(x, 1.85, z - side * 0.04); if (side > 0) s.rotation.y = Math.PI;
      add(p, s);
    }
  }
}
