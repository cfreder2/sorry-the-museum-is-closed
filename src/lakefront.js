// East of Columbus Drive, as far as the water: Butler Field under snow with the band shell in its
// corner (bandshell.js), Lake Shore Drive, the promenade along the revetment, and Monroe Harbor frozen out to a
// broken edge, open water beyond it, and the breakwater and its light. Where things are is in plan.js
// (addLakefront, and harbourplan.js for the edge); this draws them, and harbour.js what floats. All made by hand.

import * as THREE from 'three';
import * as TX from './textures.js';
import { Geo } from './geo.js';
import { landable } from './plan.js';
import { asphaltMaterial, walkMaterial, paintMaterial, ParkFurniture } from './streetscape.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import './harbour.js';         // the open water, the floes, the light's lamp, and going in (a feature: features.js)

export function buildLakefront(museum, plan) {
  const L = plan.lakefront; if (!L) return;
  const B = plan.bounds, group = museum.group, snowTex = museum.snowTex;
  const add = (...m) => { for (const x of m) { x.matrixAutoUpdate = false; x.updateMatrix(); group.add(x); } };
  const off = (f = -1) => ({ polygonOffset: true, polygonOffsetFactor: f, polygonOffsetUnits: f });
  const flat = (g, x0, x1, z0, z1, y, s = 4) => g.quad([x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1], [0, 1, 0], [[x0 / s, z0 / s], [x1 / s, z0 / s], [x1 / s, z1 / s], [x0 / s, z1 / s]]);
  const road = new Geo(), paint = new Geo(), walk = new Geo(), stone = new Geo(), dark = new Geo(), white = new Geo(), snow = new Geo(), ice = new Geo();
  const { lsd, prom, shore, slip } = L, z0 = B.z0, z1 = B.z1;

  // ---- the field's paths
  for (const q of L.paths) flat(walk, q.x0, q.x1, q.z0, q.z1, 0.006, 2.5);

  // (the band shell is bandshell.js's, with the dance game on it)

  // ---- Lake Shore Drive: two carriageways of four lanes, a snowed-up median between kerbs
  for (const [a, b] of [[lsd.x0, lsd.med[0]], [lsd.med[1], lsd.x1]]) {
    flat(road, a, b, z0, z1, 0.004);
    // (its lanes are painted in streets.js, laid to the traffic's)
  }
  // (its kerbs are streets.js's, granite like every other street's)
  for (const st of [plan.grounds.monroe, plan.grounds.jackson]) for (let z = st.z0 + 0.6; z < st.z1 - 0.4; z += 0.9) flat(paint, lsd.x0 - 3.2, lsd.x0 - 0.6, z, z + 0.45, 0.008);       // where the cross streets meet it

  // ---- the promenade, the cycle path, the revetment and the slipway
  flat(walk, prom.x0, prom.x1, z0, z1, 0.006, 2.5);
  // (no cycle path drawn on it: a dark strip with a dashed line read as a second, lesser road beside the Drive)
  // The revetment: three steps up from the promenade to a snowy top, three down to the ice. The ground over each flight
  // is the line through its nosings (plan.js), so the snow that has drifted against the bottom step is drawn to it.
  const RV = L.rev, RW = RV.run * (RV.n + 1);
  for (const [a, b] of [[z0, slip[0]], [slip[1], z1]]) {
    stone.box(prom.x1, shore, 0, RV.top - 0.06, a, b, 1.2); snow.box(prom.x1 + 0.04, shore - 0.04, RV.top - 0.06, RV.top, a, b);
    for (let i = 1; i <= RV.n; i++) {
      const h = RV.top - i * RV.rise, e0 = shore + (i - 1) * RV.run, w1 = prom.x1 - (i - 1) * RV.run;
      stone.box(e0, e0 + RV.run, 0, h - 0.025, a, b, 1.2); snow.box(e0, e0 + RV.run - 0.07, h - 0.025, h, a, b);                // down to the ice
      stone.box(w1 - RV.run, w1, 0, h - 0.025, a, b, 1.2); snow.box(w1 - RV.run + 0.07, w1, h - 0.025, h, a, b);                // up from the promenade
    }
    // the drifts against the bottom steps, from the bottom tread's height to nothing a step out
    const xe = shore + RV.n * RV.run, xw = prom.x1 - RV.n * RV.run, hb = RV.top - RV.n * RV.rise, nx = hb / Math.hypot(hb, RV.run), ny = RV.run / Math.hypot(hb, RV.run);
    snow.quad([xe, hb, a], [xe, hb, b], [xe + RV.run, 0.004, b], [xe + RV.run, 0.004, a], [nx, ny, 0], [[0, a / 4], [0, b / 4], [0.2, b / 4], [0.2, a / 4]]);
    snow.quad([xw, hb, b], [xw, hb, a], [xw - RV.run, 0.004, a], [xw - RV.run, 0.004, b], [-nx, ny, 0], [[0, b / 4], [0, a / 4], [0.2, a / 4], [0.2, b / 4]]);
  }
  flat(walk, prom.x1, shore + 4, slip[0], slip[1], 0.012, 2.5);
  for (const z of slip) { const xa = prom.x1 - RW - 0.1, xb = shore + RW + 0.1;
    stone.box(xa, xb, 0, 0.62, z - 0.25, z + 0.25); dark.box(prom.x1 + 0.9, prom.x1 + 1.1, 0.62, 1.5, z - 0.08, z + 0.08);
    landable(plan, xa, xb, z - 0.25, z + 0.25, 0.62); plan.obstacles.push({ x0: prom.x1 + 0.9, x1: prom.x1 + 1.1, z0: z - 0.08, z1: z + 0.08, y0: 0.5, y1: 1.5 }); }      // the slipway's walls, solid, with tops to drive along, over the ends of the steps
  // Benches facing the water (the streets' cast iron and slats, streetscape.js), and their snow, back from the steps.
  const PF = new ParkFurniture(plan);
  for (let z = z0 + 30; z < z1 - 10; z += 34) if (z < slip[0] - 4 || z > slip[1] + 4) PF.bench(prom.x1 - RW - 1.4, 0, z, 1, 0);

  // ---- the harbour ice, out to its broken edge (where it gives out, and what lies there: harbourplan.js)
  const WY = L.waterY, edge = L.edge, slab = new Geo(), rim = new Geo(), face = new Geo(), crack = new Geo(), wet = new Geo();
  { const w = L.window, X0 = shore + RV.n * RV.run, X1 = L.edgeMin, Z0 = z0 - 200, Z1 = z1 + 200;
    if (!w) flat(ice, X0, X1, Z0, Z1, 0.01, 22);
    else { flat(ice, X0, X1, Z0, w.z0, 0.01, 22); flat(ice, X0, X1, w.z1, Z1, 0.01, 22); flat(ice, X0, w.x0, w.z0, w.z1, 0.01, 22); flat(ice, w.x1, X1, w.z0, w.z1, 0.01, 22); }      // (clear ice over the fishing hole: icefish.js)
    // out from there to the broken line, and the line itself: the ice's raw edge, white at the top and green-blue down into the water
    const u = (x, z) => [x / 22, z / 22];
    for (let i = 0; i + 1 < edge.length; i++) {
      const [xa, za] = edge[i], [xb, zb] = edge[i + 1], l = Math.hypot(xb - xa, zb - za) || 1, nx = (zb - za) / l, nz = -(xb - xa) / l;
      ice.quad([X1, 0.01, za], [xa, 0.01, za], [xb, 0.01, zb], [X1, 0.01, zb], [0, 1, 0], [u(X1, za), u(xa, za), u(xb, zb), u(X1, zb)]);
      rim.quad([xa - 0.35, 0.013, za], [xa, 0.013, za], [xb, 0.013, zb], [xb - 0.35, 0.013, zb], [0, 1, 0], [[0, za / 3], [0.12, za / 3], [0.12, zb / 3], [0, zb / 3]]);
      wet.quad([xa - 3.2, 0.011, za], [xa - 0.3, 0.011, za], [xb - 0.3, 0.011, zb], [xb - 3.2, 0.011, zb], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]]);      // the ice grows thinner and darker towards the edge
      face.col = [0.86, 0.95, 1.0]; face.quad([xa, 0.012, za], [xb, 0.012, zb], [xb, -0.05, zb], [xa, -0.05, za], [nx, 0, nz]);
      face.col = [0.32, 0.62, 0.72]; face.quad([xa, -0.05, za], [xb, -0.05, zb], [xb, WY - 0.12, zb], [xa, WY - 0.12, za], [nx, 0, nz]);
    }
  }
  // Slabs tipped up along the edge (ramps), and blocks shoved up into ridges: snow on their tops, raw ice down their sides.
  const SNOWC = [0.9, 0.94, 1.0], ICEC = [0.55, 0.74, 0.88];
  for (const q of L.slabs) {
    const { x0, x1, z0: za, z1: zb } = q;
    if (q.kind === 'block') { slab.col = ICEC; slab.box(x0, x1, -0.02, q.h, za, zb); slab.col = SNOWC; slab.quad([x0 + 0.03, q.h + 0.004, za + 0.03], [x1 - 0.03, q.h + 0.004, za + 0.03], [x1 - 0.03, q.h + 0.004, zb - 0.03], [x0 + 0.03, q.h + 0.004, zb - 0.03], [0, 1, 0]); continue; }
    // a tipped plate: its top, its underside (where it is out of the ice), its broken edges round about
    const T = q.T, H = (x, z) => q.axis === 'x' ? q.h0 + (q.h1 - q.h0) * (x - x0) / (x1 - x0) : q.h0 + (q.h1 - q.h0) * (z - za) / (zb - za);
    const P = (x, z, dy = 0) => [x, H(x, z) + dy, z];
    const d = q.axis === 'x' ? x1 - x0 : zb - za, g = (q.h1 - q.h0) / d, n = q.axis === 'x' ? [-g, 1, 0] : [0, 1, -g];
    slab.col = SNOWC; slab.quad(P(x0, za), P(x1, za), P(x1, zb), P(x0, zb), n);
    slab.col = [0.36, 0.55, 0.7]; slab.quad(P(x0, za, -T), P(x1, za, -T), P(x1, zb, -T), P(x0, zb, -T), n.map(c => -c));
    slab.col = ICEC;
    slab.quad(P(x0, za, -T), P(x1, za, -T), P(x1, za), P(x0, za), [0, 0, -1]); slab.quad(P(x0, zb, -T), P(x1, zb, -T), P(x1, zb), P(x0, zb), [0, 0, 1]);
    slab.quad(P(x0, za, -T), P(x0, zb, -T), P(x0, zb), P(x0, za), [-1, 0, 0]); slab.quad(P(x1, za, -T), P(x1, zb, -T), P(x1, zb), P(x1, za), [1, 0, 0]);
  }
  // The slab of ice shoved up against the breakwater: the way up onto it from the last of the floes.
  { const q = L.ramp, P = (x, z, y) => [x, y, z], g = (q.h1 - q.h0) / (q.x1 - q.x0), H = x => q.h0 + g * (x - q.x0), lo = WY - 0.15;
    slab.col = SNOWC; slab.quad(P(q.x0, q.z0, q.h0), P(q.x1, q.z0, q.h1), P(q.x1, q.z1, q.h1), P(q.x0, q.z1, q.h0), [-g, 1, 0]);
    slab.col = ICEC;
    for (const [z, nz] of [[q.z0, -1], [q.z1, 1]]) slab.quad(P(q.x0, z, lo), P(q.x1, z, lo), P(q.x1, z, H(q.x1)), P(q.x0, z, q.h0), [0, 0, nz]);
    slab.quad(P(q.x0, q.z0, lo), P(q.x0, q.z1, lo), P(q.x0, q.z1, q.h0), P(q.x0, q.z0, q.h0), [-1, 0, 0]);
  }
  // Cracks running back into the ice from the edge.
  for (const pts of L.cracks) for (let i = 0; i + 1 < pts.length; i++) {
    const [xa, za] = pts[i], [xb, zb] = pts[i + 1], l = Math.hypot(xb - xa, zb - za) || 1, w = 0.018 * (1 - i / pts.length) + 0.007, px = -(zb - za) / l * w, pz = (xb - xa) / l * w;
    crack.quad([xa - px, 0.015, za - pz], [xa + px, 0.015, za + pz], [xb + px, 0.015, zb + pz], [xb - px, 0.015, zb - pz], [0, 1, 0]);
  }

  // ---- the breakwater, and its light: a red and white tower on a plinth, a gallery with a rail round it, and the
  // lantern up top (the lamp in it, and its beam, are harbour.js's: they turn)
  { const b = L.breakwater; stone.box(b.x0, b.x1, WY - 0.3, 1.2, b.z0, b.z1, 1.4); snow.box(b.x0 + 0.3, b.x1 - 0.3, 1.2, 1.27, b.z0 + 4, b.z1 - 0.3);
    const t = L.light; stone.box(t.x - 0.9, t.x + 0.9, 1.2, 1.66, t.z - 0.9, t.z + 0.9, 1.4); snow.box(t.x - 0.86, t.x + 0.86, 1.66, 1.7, t.z - 0.86, t.z + 0.86);
    const stripes = (() => { const cv = document.createElement('canvas'); cv.width = 8; cv.height = 64; const c = cv.getContext('2d'); for (let i = 0; i < 4; i++) { c.fillStyle = i % 2 ? '#f2f0ea' : '#c4202a'; c.fillRect(0, i * 16, 8, 16); } const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace; tx.magFilter = THREE.NearestFilter; return tx; })();
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.56, 3.3, 24, 1, true), new THREE.MeshStandardMaterial({ map: stripes, roughness: 0.55, emissiveMap: stripes, emissive: 0xffffff, emissiveIntensity: 0.32 }));
    tower.position.set(t.x, 1.7 + 1.65, t.z);
    const iron = [];
    iron.push(new THREE.CylinderGeometry(0.8, 0.74, 0.1, 24).translate(t.x, 5.05, t.z));                          // the gallery
    iron.push(new THREE.TorusGeometry(0.78, 0.022, 5, 32).rotateX(Math.PI / 2).translate(t.x, 5.46, t.z));        // its rail
    iron.push(new THREE.TorusGeometry(0.78, 0.014, 4, 32).rotateX(Math.PI / 2).translate(t.x, 5.28, t.z));
    for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; iron.push(new THREE.CylinderGeometry(0.014, 0.014, 0.36, 4).translate(t.x + Math.cos(a) * 0.78, 5.28, t.z + Math.sin(a) * 0.78)); }
    for (let i = 0; i < 6; i++) { const a = (i + 0.5) / 6 * Math.PI * 2; iron.push(new THREE.CylinderGeometry(0.02, 0.02, 0.76, 4).translate(t.x + Math.cos(a) * 0.37, 5.48, t.z + Math.sin(a) * 0.37)); }      // the lantern's glazing bars
    iron.push(new THREE.CylinderGeometry(0.4, 0.4, 0.06, 20).translate(t.x, 5.87, t.z), new THREE.SphereGeometry(0.07, 8, 6).translate(t.x, 6.42, t.z), new THREE.CylinderGeometry(0.02, 0.02, 0.2, 4).translate(t.x, 6.32, t.z));
    const ironM = new THREE.Mesh(mergeGeometries(iron.map(g => g.index ? g.toNonIndexed() : g)), new THREE.MeshStandardMaterial({ color: 0x1d2026, roughness: 0.5, metalness: 0.4, emissive: 0x0c0e14, emissiveIntensity: 0.6 }));
    const roof = new THREE.Mesh(new THREE.ConeGeometry(0.48, 0.42, 24), new THREE.MeshStandardMaterial({ color: 0xb01c24, roughness: 0.5, emissive: 0x3a0608, emissiveIntensity: 0.8 }));
    roof.position.set(t.x, 5.9 + 0.21, t.z);
    add(tower, ironM, roof);
  }

  // (The cars on the Drive are traffic.js's, and they move.)

  // ---- a few mooring buoys out past the breakwater, riding in the open water
  {
    const r = TX.rng(4471), at = [], b = L.breakwater;
    for (let i = 0; i < 14; i++) { const x = b.x1 + 4 + r() * 12, z = b.z0 + r() * (b.z1 - b.z0); if (!L.bits.some(q => Math.hypot(q.x - x, q.z - z) < q.rad + 0.6) && !L.floes.some(f => Math.hypot(f.hx - x, f.hz - z) < f.reach + f.drift + 0.6)) at.push([x, z, 0.8]); }
    const ball = new THREE.InstancedMesh(new THREE.SphereGeometry(0.42, 10, 8), new THREE.MeshStandardMaterial({ color: 0xf2efe8, roughness: 0.6, emissive: 0x596078, emissiveIntensity: 0.7 }), at.length);
    const band = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.435, 0.435, 0.16, 10), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.1, 0.25, 0.7) }), at.length), M = new THREE.Matrix4();
    at.forEach(([x, z, s], i) => { ball.setMatrixAt(i, M.makeScale(s, s, s).setPosition(x, WY + 0.12, z)); band.setMatrixAt(i, M.makeScale(s, s, s).setPosition(x, WY + 0.22, z)); });
    ball.frustumCulled = band.frustumCulled = false; group.add(ball, band);
  }

  // ---- materials
  const iceT = (() => { const cv = document.createElement('canvas'); cv.width = cv.height = 256; const c = cv.getContext('2d'), r = TX.rng(88); c.fillStyle = '#b9cbe0'; c.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 60; i++) { c.fillStyle = `rgba(${225 + r() * 30},${235 + r() * 20},255,${0.1 + r() * 0.2})`; c.beginPath(); c.ellipse(r() * 256, r() * 256, 10 + r() * 40, 6 + r() * 22, r() * 3, 0, 7); c.fill(); }
    c.strokeStyle = 'rgba(70,95,140,0.5)'; c.lineWidth = 1; for (let i = 0; i < 9; i++) { let x = r() * 256, y = r() * 256; c.beginPath(); c.moveTo(x, y); for (let k = 0; k < 6; k++) { x += (r() - 0.5) * 70; y += (r() - 0.5) * 70; c.lineTo(x, y); } c.stroke(); }
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; })();
  add(road.mesh(asphaltMaterial()), walk.mesh(walkMaterial()));
  { const pm = paint.mesh(paintMaterial(false)); pm.renderOrder = -3; for (let i = 0, uv = pm.geometry.attributes.uv; i < uv.count; i++) uv.setXY(i, 0.25, uv.getY(i) + uv.getX(i)); add(pm); }      // (the middle of the fresh half of the paint)
  add(stone.mesh(new THREE.MeshStandardMaterial({ color: 0xa9a59b, roughness: 0.9, emissive: 0x41465a, emissiveIntensity: 0.55 })));
  add(dark.mesh(new THREE.MeshStandardMaterial({ color: 0x23262d, roughness: 0.7, emissive: 0x0e1016, emissiveIntensity: 0.6 })));
  add(white.mesh(new THREE.MeshStandardMaterial({ color: 0xd9dbe0, roughness: 0.6, metalness: 0.15, emissive: 0x565c70, emissiveIntensity: 0.6, side: THREE.DoubleSide })));
  { const m = new THREE.MeshStandardMaterial({ map: snowTex, roughness: 0.95, emissiveMap: snowTex, emissive: new THREE.Color(0.25, 0.3, 0.45), emissiveIntensity: 0.5 }); add(snow.mesh(m), ...PF.meshes(m)); }
  add(ice.mesh(new THREE.MeshStandardMaterial({ map: iceT, roughness: 0.18, metalness: 0.1, emissiveMap: iceT, emissive: new THREE.Color(0.2, 0.26, 0.4), emissiveIntensity: 0.55, ...off(-1) })));
  // the edge: its snowy lip, its raw face, the slabs and blocks along it, the cracks back from it
  { const m = new THREE.MeshStandardMaterial({ map: snowTex, roughness: 0.9, emissiveMap: snowTex, emissive: new THREE.Color(0.32, 0.38, 0.55), emissiveIntensity: 0.6, ...off(-3) }); add(rim.mesh(m)); }
  add(face.mesh(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.25, emissive: new THREE.Color(0.18, 0.32, 0.42), emissiveIntensity: 1 })));
  add(slab.mesh(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.45, emissive: new THREE.Color(0.2, 0.26, 0.4), emissiveIntensity: 0.7 })));
  add(crack.mesh(new THREE.MeshBasicMaterial({ color: 0x2c3d60, ...off(-4) })));
  { const cv = document.createElement('canvas'); cv.width = 64; cv.height = 4; const c = cv.getContext('2d'), gr = c.createLinearGradient(0, 0, 64, 0); gr.addColorStop(0, 'rgba(20,48,74,0)'); gr.addColorStop(1, 'rgba(20,48,74,0.55)'); c.fillStyle = gr; c.fillRect(0, 0, 64, 4);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
    const m = wet.mesh(new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, ...off(-2) })); m.renderOrder = 1; add(m); }
}
