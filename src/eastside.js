// The Columbus Drive side, and what the two gardens and the north-east corner look like from above.
//
// Worked by eye from aerial views: the wide pavement and the row of street trees along Columbus
// Drive, the east entrance under its flat canopy, the lawn the Stock Exchange arch stands in with
// a hedge round its street sides, the South Garden's hawthorns each in a raised stone planter with
// paving round the long pool, and the North Garden's lawn panels inside their stone kerbs.
// (The trees themselves, the hedges round the gardens, the pool, the fountains and the arch are
// drawn elsewhere: grounds.js and statues.js.)
//
// Nothing here takes ground away from a car that had it: the kerbs are lower than a wheel climbs,
// and a planter or a hedge is only put where nothing else already stands or runs.

import * as THREE from 'three';
import * as TX from './textures.js';
import { Geo } from './geo.js';

export function buildEastSide(museum, plan) {
  const G = plan.grounds, B = plan.bounds, group = museum.group, O = plan.obstacles;
  const add = (...m) => { for (const x of m) { x.matrixAutoUpdate = false; x.updateMatrix(); group.add(x); } };
  const off = { polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 };
  const trim = new THREE.MeshStandardMaterial({ color: 0xbdb6a6, roughness: 0.85, emissive: 0x4a4d5c, emissiveIntensity: 0.55 });
  const paving = new THREE.MeshStandardMaterial({ color: 0x9a968e, roughness: 0.85, emissive: 0x3a3f4f, emissiveIntensity: 0.5, ...off });
  const snowTex = museum.snowTex;
  const snow = new THREE.MeshStandardMaterial({ map: snowTex, roughness: 0.95, emissiveMap: snowTex, emissive: new THREE.Color(0.25, 0.3, 0.45), emissiveIntensity: 0.5 });
  const lawn = new THREE.MeshStandardMaterial({ map: snowTex, roughness: 1, emissiveMap: snowTex, emissive: new THREE.Color(0.3, 0.36, 0.5), emissiveIntensity: 0.62, ...off });
  const hedgeM = new THREE.MeshStandardMaterial({ color: 0x1c3324, roughness: 0.95, emissive: 0x0c1810, emissiveIntensity: 0.7 });
  const flat = (g, x0, x1, z0, z1, y, s = 3) => g.quad([x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1], [0, 1, 0], [[x0 / s, z0 / s], [x1 / s, z0 / s], [x1 / s, z1 / s], [x0 / s, z1 / s]]);

  // Is this patch of ground free of everything that already stands on it, runs over it or is played on?
  const hit = (q, x0, x1, z0, z1, m = 0) => x1 > q.x0 - m && x0 < q.x1 + m && z1 > q.z0 - m && z0 < q.z1 + m;
  const near = (p, x0, x1, z0, z1, r) => p.x > x0 - r && p.x < x1 + r && p.z > z0 - r && p.z < z1 + r;
  const free = (x0, x1, z0, z1, { paths = true } = {}) => {
    if (plan.masses.some(q => hit(q, x0, x1, z0, z1, 0.3))) return false;
    if (paths && G.paths.some(q => hit(q, x0, x1, z0, z1, 0.3))) return false;
    for (const list of [plan.surfaces, plan.decals, plan.ice, plan.benches, plan.puddles]) for (const q of list || []) if (q.x0 !== undefined && !q.roof && hit(q, x0, x1, z0, z1, 0.6)) return false;
    for (const h of plan.hills || []) if (hit({ x0: h.cx - h.rx, x1: h.cx + h.rx, z0: h.cz - h.rz, z1: h.cz + h.rz }, x0, x1, z0, z1, 0.5)) return false;
    for (const list of [G.snowmen, plan.props, plan.hoops, plan.lamps, G.sculpt, G.fountains, plan.loops]) for (const p of list || []) if (p.x !== undefined && near(p, x0, x1, z0, z1, 1.6 + (p.r || 0))) return false;
    for (const q of [plan.rink, plan.park, plan.pool, plan.terrace]) if (q && q.x0 !== undefined && hit(q, x0, x1, z0, z1, 0.6)) return false;
    if (G.tree && near(G.tree, x0, x1, z0, z1, 6)) return false;
    if (near(G.fountain, x0, x1, z0, z1, 5.5) || near(G.calder, x0, x1, z0, z1, 2.5)) return false;
    return true;
  };

  const walk = new Geo(), kerb = new Geo(), grass = new Geo(), box = new Geo(), cap = new Geo(), hedge = new Geo(), hcap = new Geo();
  // A panel of lawn: a lighter sheet of snow inside a stone kerb a wheel rides over.
  const panel = (x0, x1, z0, z1) => {
    if (x1 - x0 < 2 || z1 - z0 < 2) return;
    flat(grass, x0, x1, z0, z1, 0.004, 4.5);
    const w = 0.16, h = 0.06;
    kerb.box(x0 - w, x1 + w, 0, h, z0 - w, z0); kerb.box(x0 - w, x1 + w, 0, h, z1, z1 + w); kerb.box(x0 - w, x0, 0, h, z0, z1); kerb.box(x1, x1 + w, 0, h, z0, z1);
  };

  // ------------------------------------------------------------------ Columbus Drive
  {
    const C = G.columbus, x1 = C.x0, x0 = x1 - 5.2, zA = G.monroe.z1, zB = G.jackson.z0;
    // The pavement: wide, shovelled, with a kerb at the road. (The trees along it are in the plan, with the others.)
    flat(walk, x0, x1, zA, zB, 0.007, 2.5);
    kerb.box(x1 - 0.12, x1 + 0.12, 0, 0.07, zA, zB);
    // Squares of open earth round each street tree, under snow.
    for (const t of G.trees) if (t.x > x0 && t.x < x1) flat(grass, t.x - 0.75, t.x + 0.75, t.z - 0.75, t.z + 0.75, 0.01, 2);

    // The east entrance: glass doors with the lights left on, under a thin flat canopy on two posts, and a paved way in from the pavement.
    const face = plan.masses.filter(q => q.top > 8 && q.x1 > 240 && q.z1 > 100 && q.z0 < 120).sort((a, b) => b.x1 - a.x1)[0];
    if (face) {
      const fx = face.x1, zc = Math.max(face.z0 + 4.2, Math.min(face.z1 - 4.2, (face.z0 + face.z1) / 2)), hw = 3.6, reach = 3.4;
      if (free(fx + 0.4, fx + reach + 0.6, zc - hw - 0.8, zc + hw + 0.8, { paths: false })) {
        flat(walk, fx, x0, zc - hw, zc + hw, 0.007, 2.5);
        const glow = new Geo(), dark = new Geo(), E = [1, 0, 0], gx = fx + 0.05;
        dark.quad([gx - 0.01, 0, zc - hw], [gx - 0.01, 0, zc + hw], [gx - 0.01, 3.3, zc + hw], [gx - 0.01, 3.3, zc - hw], E);
        for (let i = 0; i < 4; i++) { const a = zc - hw + 0.25 + i * (2 * hw - 0.5) / 4, b = a + (2 * hw - 0.5) / 4 - 0.14; glow.quad([gx, 0.12, a], [gx, 0.12, b], [gx, 2.5, b], [gx, 2.5, a], E); glow.quad([gx, 2.62, a], [gx, 2.62, b], [gx, 3.1, b], [gx, 3.1, a], E); }
        add(dark.mesh(new THREE.MeshBasicMaterial({ color: new THREE.Color(0.03, 0.035, 0.05) })), glow.mesh(new THREE.MeshBasicMaterial({ color: new THREE.Color(0.8, 0.6, 0.32) })));
        const cn = new Geo();
        cn.box(fx, fx + reach, 3.45, 3.62, zc - hw - 0.6, zc + hw + 0.6);
        for (const sg of [-1, 1]) { const pz = zc + sg * (hw + 0.2); cn.box(fx + reach - 0.4, fx + reach - 0.24, 0, 3.45, pz - 0.08, pz + 0.08); O.push({ x0: fx + reach - 0.42, x1: fx + reach - 0.22, z0: pz - 0.1, z1: pz + 0.1, y0: 0, y1: 3.6 }); }
        add(cn.mesh(new THREE.MeshStandardMaterial({ color: 0xd4d6da, roughness: 0.5, emissive: 0x565c6c, emissiveIntensity: 0.6 })));
        const top = new Geo(); flat(top, fx, fx + reach, zc - hw - 0.6, zc + hw + 0.6, 3.63, 3); add(top.mesh(snow));
        const name = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 0.42), new THREE.MeshBasicMaterial({ map: TX.carved('THE  ART  INSTITUTE  OF  CHICAGO', 2048, 96, 64, '#f1dfae'), transparent: true, depthWrite: false, color: new THREE.Color(1.2, 1.1, 0.85), fog: false }));
        name.position.set(fx + reach + 0.02, 3.53, zc); name.rotation.y = Math.PI / 2; add(name);
        const spill = new THREE.Mesh(new THREE.PlaneGeometry(7, 5), new THREE.MeshBasicMaterial({ map: TX.radial(0, 1), color: new THREE.Color(0.5, 0.36, 0.2), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, ...off }));
        spill.rotation.x = -Math.PI / 2; spill.position.set(fx + 2.6, 0.02, zc); spill.renderOrder = 4; add(spill);
        plan.outdoorArt.push({ x: fx + 3, z: zc, r: 6, text: 'The Columbus Drive entrance. Locked, like the other one.' });
      }
    }
  }

  // ------------------------------------------------- the lawn the Stock Exchange arch stands in
  {
    const a = G.sculpt.find(s => s.kind === 'arch');
    if (a) {
      const x0 = a.x - 9, x1 = Math.min(a.x + 4.4, G.columbus.x0 - 5.6), z0 = Math.max(a.z - a.half - 4, G.monroe.z1 + 2.2), z1 = a.z + a.half + 4;
      panel(x0, x1, z0, z1);
      // Paving under the arch and out through it to the pavement, as people walk it.
      flat(walk, a.x - 2.2, G.columbus.x0 - 5.2, a.z - a.open - 0.4, a.z + a.open + 0.4, 0.016, 2.5);
      // A low hedge on the two street sides, with a way through in the middle of each.
      const run = (hx0, hx1, hz0, hz1) => { if (!free(hx0, hx1, hz0, hz1)) return; hedge.box(hx0, hx1, 0, 0.8, hz0, hz1); hcap.box(hx0 - 0.03, hx1 + 0.03, 0.8, 0.88, hz0 - 0.03, hz1 + 0.03); O.push({ x0: hx0, x1: hx1, z0: hz0, z1: hz1, y0: 0, y1: 0.9 }); };
      const mx = (x0 + x1) / 2, mz = a.z;
      run(x0, mx - 2, z0 - 0.9, z0 - 0.3); run(mx + 2, x1, z0 - 0.9, z0 - 0.3);
      run(x1 + 0.3, x1 + 0.9, z0, mz - a.open - 0.8); run(x1 + 0.3, x1 + 0.9, mz + a.open + 0.8, z1);
    }
  }

  // ------------------------------------------------------------------ the South Garden
  {
    const g = G.south, p = G.pool;
    // Paving round the long pool, and a strip of it out to the fountain.
    const m = 2.2;
    flat(walk, p.x0 - m, p.x1 + m, p.z0 - m, p.z0 - 0.4, 0.008, 2.5); flat(walk, p.x0 - m, p.x1 + m, p.z1 + 0.4, p.z1 + m, 0.008, 2.5);
    flat(walk, p.x0 - m, p.x0 - 0.4, p.z0 - 0.4, p.z1 + 0.4, 0.008, 2.5); flat(walk, p.x1 + 0.4, p.x1 + m, p.z0 - 0.4, p.z1 + 0.4, 0.008, 2.5);
    flat(walk, p.x1 + m, G.fountain.x - 3.4, (p.z0 + p.z1) / 2 - 1.6, (p.z0 + p.z1) / 2 + 1.6, 0.008, 2.5);
    // Each hawthorn in its own raised square of stone, snow on the soil.
    for (const t of G.trees) {
      if (t.kind !== 'hawthorn' || t.x < g.x0 || t.x > g.x1 || t.z < g.z0 || t.z > g.z1) continue;
      const r = 0.95, x0 = t.x - r, x1 = t.x + r, z0 = t.z - r, z1 = t.z + r;
      if (!free(x0, x1, z0, z1)) continue;
      box.box(x0, x1, 0, 0.34, z0, z1); cap.box(x0 + 0.14, x1 - 0.14, 0.34, 0.39, z0 + 0.14, z1 - 0.14);
      O.push({ x0, x1, z0, z1, y0: 0, y1: 0.4 });
    }
  }

  // ------------------------------------------------------------------ the North Garden
  {
    // Four panels of lawn between the paths that cross it, each inside its kerb. Where the sculpture
    // stands in the middle the panels stop short and leave it its own ground.
    const g = G.north, mx = (g.x0 + g.x1) / 2, mz = (g.z0 + g.z1) / 2, in0 = 2.6, pw = 2.4;
    for (const [x0, x1] of [[g.x0 + in0, mx - pw], [mx + pw, g.x1 - in0]]) for (const [z0, z1] of [[g.z0 + in0, mz - pw], [mz + pw, g.z1 - in0]]) panel(x0, x1, z0, z1);
    // The South Garden has the same, outside its grid of planters: a border of lawn along each long side.
    const s = G.south;
    panel(s.x0 + 2.2, s.x1 - 9, s.z0 + 1.6, s.z0 + 2.8); panel(s.x0 + 2.2, s.x1 - 9, s.z1 - 2.8, s.z1 - 1.6);
  }

  add(walk.mesh(paving), kerb.mesh(trim), grass.mesh(lawn), box.mesh(trim), cap.mesh(snow), hedge.mesh(hedgeM), hcap.mesh(snow));
}
