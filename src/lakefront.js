// East of Columbus Drive, as far as the water: Butler Field under snow with the band shell in its
// corner (bandshell.js), Lake Shore Drive, the promenade along the revetment, and Monroe Harbor frozen out to the
// line of mooring buoys, with the breakwater and its light beyond. Where things are is in plan.js
// (addLakefront); this draws them. All of it made by hand.

import * as THREE from 'three';
import * as TX from './textures.js';
import { Geo } from './geo.js';
import { landable } from './plan.js';
import { asphaltMaterial, walkMaterial, paintMaterial, ParkFurniture } from './streetscape.js';

export function buildLakefront(museum, plan) {
  const L = plan.lakefront; if (!L) return;
  const B = plan.bounds, group = museum.group, snowTex = museum.snowTex;
  const add = (...m) => { for (const x of m) { x.matrixAutoUpdate = false; x.updateMatrix(); group.add(x); } };
  const off = (f = -1) => ({ polygonOffset: true, polygonOffsetFactor: f, polygonOffsetUnits: f });
  const flat = (g, x0, x1, z0, z1, y, s = 4) => g.quad([x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1], [0, 1, 0], [[x0 / s, z0 / s], [x1 / s, z0 / s], [x1 / s, z1 / s], [x0 / s, z1 / s]]);
  const road = new Geo(), paint = new Geo(), walk = new Geo(), stone = new Geo(), dark = new Geo(), white = new Geo(), snow = new Geo(), ice = new Geo(), bike = new Geo();
  const { lsd, prom, shore, buoys, slip } = L, z0 = B.z0, z1 = B.z1;

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
  flat(bike, prom.x0 + 1.2, prom.x0 + 4.4, z0, z1, 0.009); for (let z = z0; z < z1; z += 6) flat(paint, prom.x0 + 2.75, prom.x0 + 2.85, z, z + 2, 0.012);
  for (const [a, b] of [[z0, slip[0]], [slip[1], z1]]) {
    stone.box(prom.x1, shore, 0, 0.5, a, b, 1.2); snow.box(prom.x1 + 0.1, shore - 0.1, 0.5, 0.56, a, b);
    stone.box(shore, shore + 1.1, 0, 0.3, a, b, 1.2); stone.box(shore + 1.1, shore + 2.3, 0, 0.13, a, b, 1.2);         // two steps down to the ice
  }
  flat(walk, prom.x1, shore + 4, slip[0], slip[1], 0.012, 2.5);
  for (const z of slip) { stone.box(prom.x1 - 0.2, shore + 2.4, 0, 0.62, z - 0.25, z + 0.25); dark.box(prom.x1 + 0.9, prom.x1 + 1.1, 0.62, 1.5, z - 0.08, z + 0.08);
    landable(plan, prom.x1 - 0.2, shore + 2.4, z - 0.25, z + 0.25, 0.62); plan.obstacles.push({ x0: prom.x1 + 0.9, x1: prom.x1 + 1.1, z0: z - 0.08, z1: z + 0.08, y0: 0.5, y1: 1.5 }); }      // the slipway's walls, solid, with tops to drive along
  // Benches facing the water (the streets' cast iron and slats, streetscape.js), and their snow.
  const PF = new ParkFurniture(plan);
  for (let z = z0 + 30; z < z1 - 10; z += 34) if (z < slip[0] - 4 || z > slip[1] + 4) PF.bench(prom.x1 - 1.6, 0, z, 1, 0);

  // ---- the harbour ice, out to the buoys
  { const w = L.window, X0 = shore, X1 = buoys + 0.6, Z0 = z0 - 200, Z1 = z1 + 200;
    if (!w) flat(ice, X0, X1, Z0, Z1, 0.01, 22);
    else { flat(ice, X0, X1, Z0, w.z0, 0.01, 22); flat(ice, X0, X1, w.z1, Z1, 0.01, 22); flat(ice, X0, w.x0, w.z0, w.z1, 0.01, 22); flat(ice, w.x1, X1, w.z0, w.z1, 0.01, 22); } }      // (clear ice over the fishing hole: icefish.js)

  // ---- the breakwater, and its light
  { const b = L.breakwater; stone.box(b.x0, b.x1, -0.2, 1.2, b.z0, b.z1, 1.4); snow.box(b.x0 + 0.3, b.x1 - 0.3, 1.2, 1.27, b.z0 + 4, b.z1 - 0.3);
    const t = L.light; white.box(t.x - 0.9, t.x + 0.9, 1.2, 1.7, t.z - 0.9, t.z + 0.9); white.box(t.x - 0.45, t.x + 0.45, 1.7, 5.2, t.z - 0.45, t.z + 0.45); dark.box(t.x - 0.6, t.x + 0.6, 5.2, 5.4, t.z - 0.6, t.z + 0.6); dark.box(t.x - 0.5, t.x + 0.5, 6.3, 6.5, t.z - 0.5, t.z + 0.5);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.42, 12, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.5, 3.2, 1.4), fog: false })); lamp.position.set(t.x, 5.85, t.z);
    const halo = new THREE.Mesh(new THREE.PlaneGeometry(26, 26), new THREE.MeshBasicMaterial({ map: TX.radial(0, 1.6), color: new THREE.Color(0.12, 0.6, 0.3), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
    halo.position.set(t.x, 0.2, t.z); halo.rotation.x = -Math.PI / 2; add(lamp, halo); }

  // (The cars on the Drive are traffic.js's, and they move.)

  // ---- buoys: a line of them where the ice gives out, and the empty moorings beyond
  {
    const r = TX.rng(4471), at = [];
    for (let z = z0 + 4; z < z1; z += 11) at.push([buoys + 0.25, z, 1]);
    for (let i = 0; i < 34; i++) at.push([buoys + 6 + r() * (B.x1 - buoys - 30), z0 + r() * (z1 - z0), 0.8]);
    const ball = new THREE.InstancedMesh(new THREE.SphereGeometry(0.42, 10, 8), new THREE.MeshStandardMaterial({ color: 0xf2efe8, roughness: 0.6, emissive: 0x596078, emissiveIntensity: 0.7 }), at.length);
    const band = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.435, 0.435, 0.16, 10), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.1, 0.25, 0.7) }), at.length), M = new THREE.Matrix4();
    at.forEach(([x, z, s], i) => { ball.setMatrixAt(i, M.makeScale(s, s, s).setPosition(x, 0.2, z)); band.setMatrixAt(i, M.makeScale(s, s, s).setPosition(x, 0.3, z)); });
    ball.frustumCulled = band.frustumCulled = false; group.add(ball, band);
  }

  // ---- materials
  const iceT = (() => { const cv = document.createElement('canvas'); cv.width = cv.height = 256; const c = cv.getContext('2d'), r = TX.rng(88); c.fillStyle = '#b9cbe0'; c.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 60; i++) { c.fillStyle = `rgba(${225 + r() * 30},${235 + r() * 20},255,${0.1 + r() * 0.2})`; c.beginPath(); c.ellipse(r() * 256, r() * 256, 10 + r() * 40, 6 + r() * 22, r() * 3, 0, 7); c.fill(); }
    c.strokeStyle = 'rgba(70,95,140,0.5)'; c.lineWidth = 1; for (let i = 0; i < 9; i++) { let x = r() * 256, y = r() * 256; c.beginPath(); c.moveTo(x, y); for (let k = 0; k < 6; k++) { x += (r() - 0.5) * 70; y += (r() - 0.5) * 70; c.lineTo(x, y); } c.stroke(); }
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; })();
  add(road.mesh(asphaltMaterial()), walk.mesh(walkMaterial()));
  { const pm = paint.mesh(paintMaterial(false)); pm.renderOrder = -3; for (let i = 0, uv = pm.geometry.attributes.uv; i < uv.count; i++) uv.setXY(i, 0.25, uv.getY(i) + uv.getX(i)); add(pm); }      // (the middle of the fresh half of the paint)
  add(bike.mesh(new THREE.MeshStandardMaterial({ color: 0x4a5a52, roughness: 0.8, emissive: 0x1c2622, emissiveIntensity: 0.6, ...off(-2) })));
  add(stone.mesh(new THREE.MeshStandardMaterial({ color: 0xa9a59b, roughness: 0.9, emissive: 0x41465a, emissiveIntensity: 0.55 })));
  add(dark.mesh(new THREE.MeshStandardMaterial({ color: 0x23262d, roughness: 0.7, emissive: 0x0e1016, emissiveIntensity: 0.6 })));
  add(white.mesh(new THREE.MeshStandardMaterial({ color: 0xd9dbe0, roughness: 0.6, metalness: 0.15, emissive: 0x565c70, emissiveIntensity: 0.6, side: THREE.DoubleSide })));
  { const m = new THREE.MeshStandardMaterial({ map: snowTex, roughness: 0.95, emissiveMap: snowTex, emissive: new THREE.Color(0.25, 0.3, 0.45), emissiveIntensity: 0.5 }); add(snow.mesh(m), ...PF.meshes(m)); }
  add(ice.mesh(new THREE.MeshStandardMaterial({ map: iceT, roughness: 0.18, metalness: 0.1, emissiveMap: iceT, emissive: new THREE.Color(0.2, 0.26, 0.4), emissiveIntensity: 0.55, ...off(-1) })));
}
