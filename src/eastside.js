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
import { frostHedges, hedgeMaterial } from './frost.js';
import * as TX from './textures.js';
import { Geo } from './geo.js';
import { landable } from './plan.js';
import { walkMaterial } from './streetscape.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export function buildEastSide(museum, plan) {
  const G = plan.grounds, B = plan.bounds, group = museum.group, O = plan.obstacles;
  const add = (...m) => { for (const x of m) { x.matrixAutoUpdate = false; x.updateMatrix(); group.add(x); } };
  const off = { polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 };
  const trim = new THREE.MeshStandardMaterial({ color: 0xbdb6a6, roughness: 0.85, emissive: 0x4a4d5c, emissiveIntensity: 0.55 });
  const paving = walkMaterial();                                    // the streets' concrete (streetscape.js)
  const snowTex = museum.snowTex;
  const snow = new THREE.MeshStandardMaterial({ map: snowTex, roughness: 0.95, emissiveMap: snowTex, emissive: new THREE.Color(0.25, 0.3, 0.45), emissiveIntensity: 0.5 });
  const lawn = new THREE.MeshStandardMaterial({ map: snowTex, roughness: 1, emissiveMap: snowTex, emissive: new THREE.Color(0.3, 0.36, 0.5), emissiveIntensity: 0.62, ...off });
  const hedgeM = hedgeMaterial();
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
    // (Its kerb, with ramps at the corners, and the iron grates round the street trees are streets.js's.)

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
        const name = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 0.42), new THREE.MeshBasicMaterial({ map: TX.carved('THE  ART  INSTITUTE  OF  CHICAGO', 2048, Math.round(2048 * 0.42 / 6.4), 88, '#f1dfae'), transparent: true, depthWrite: false, color: new THREE.Color(1.2, 1.1, 0.85), fog: false }));
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
      // A low hedge on the two street sides, with a way through in the middle of each, the two sides
      // meeting at the corner (each length is tried carried into the corner first, then short of it).
      // Every length is judged before any is laid, so that one side does not shut out the other.
      const runs = [], run = (...tries) => { const t = tries.find(([hx0, hx1, hz0, hz1]) => free(hx0, hx1, hz0, hz1)); if (t) runs.push({ x0: t[0], x1: t[1], z0: t[2], z1: t[3] }); };
      const mx = (x0 + x1) / 2, mz = a.z;
      run([x0, mx - 2, z0 - 0.9, z0 - 0.3]); run([mx + 2, x1 + 0.9, z0 - 0.9, z0 - 0.3], [mx + 2, x1, z0 - 0.9, z0 - 0.3]);
      run([x1 + 0.3, x1 + 0.9, z0 - 0.9, mz - a.open - 0.8], [x1 + 0.3, x1 + 0.9, z0, mz - a.open - 0.8]); run([x1 + 0.3, x1 + 0.9, mz + a.open + 0.8, z1]);
      for (const q of runs) landable(plan, q.x0, q.x1, q.z0, q.z1, 0.88, 0, 0.05);
      frostHedges(hedge, runs, 0, 0.86);
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
      landable(plan, x0, x1, z0, z1, 0.39);                 // jump up onto it: its rim and the snow in it are a top to stand on
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
  buildCourt(museum, plan, { add, trim, snow, hedgeM });
}

// ---------------------------------------------------------------------- McKinlock Court
// The open court with the Fountain of the Tritons in it: stone flags, the long shallow pool the
// fountain stands in (frozen), the café's tables left out for the winter under their green
// parasols, clipped hedges, a couple of firs, and on the walls the arcade of round-headed glazed
// doors with the balustraded gallery over it. The tree and the fountain are drawn elsewhere and
// stay where they are; the court is laid out round them.
function buildCourt(museum, plan, { add, trim, snow, hedgeM }) {
  const G = plan.grounds, O = plan.obstacles, f = (G.fountains || []).find(q => q.kind === 'triton'), t = G.tree;
  if (!f) return;
  // The walls it lies against: the nearest building east of the fountain, and the nearest south of it.
  const eastM = plan.masses.filter(m => m.x0 > f.x && m.x0 < f.x + 22 && m.z0 < f.z && m.z1 > f.z).sort((a, b) => a.x0 - b.x0)[0];
  const southM = plan.masses.filter(m => m.z0 > f.z && m.z0 < f.z + 22 && m.x0 < f.x && m.x1 > f.x).sort((a, b) => a.z0 - b.z0)[0];
  if (!eastM || !southM) return;
  const E = eastM.x0, S = southM.z0, X0 = Math.max(G.rail.x1 + 4, f.x - 14), Z0 = t ? Math.max(t.z + 4, f.z - 8) : f.z - 8;
  if (E - X0 < 16 || S - Z0 < 14) return;
  const solid = (x0, x1, z0, z1, y1, y0 = 0) => O.push({ x0, x1, z0, z1, y0, y1 });
  const blocked = (x0, x1, z0, z1) => O.some(o => o.y0 < 3 && o.y1 > 0.05 && o.x0 < x1 && o.x1 > x0 && o.z0 < z1 && o.z1 > z0)
    || (G.snowmen || []).some(m => m.x > x0 - 0.8 && m.x < x1 + 0.8 && m.z > z0 - 0.8 && m.z < z1 + 0.8)
    || plan.doors.some(d => d.out && d.x0 < x1 + 1.2 && d.x1 > x0 - 1.2 && d.z0 < z1 + 2.5 && d.z1 > z0 - 2.5);

  // Flags underfoot.
  const flagT = (() => { const cv = document.createElement('canvas'); cv.width = cv.height = 128; const c = cv.getContext('2d'), r = TX.rng(77);
    c.fillStyle = '#a9a7a4'; c.fillRect(0, 0, 128, 128);
    for (let j = 0; j < 4; j++) for (let i = -1; i < 5; i++) { const v = 158 + Math.floor(r() * 30); c.fillStyle = `rgb(${v},${v},${v + 6})`; c.fillRect(i * 32 + (j % 2 ? 16 : 0) + 1, j * 32 + 1, 30, 30); }
    const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace; tx.wrapS = tx.wrapT = THREE.RepeatWrapping; tx.anisotropy = 4; return tx; })();
  const flags = new THREE.MeshStandardMaterial({ map: flagT, roughness: 0.9, emissiveMap: flagT, emissive: new THREE.Color(0.32, 0.35, 0.45), emissiveIntensity: 0.5, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
  const floor = new Geo();
  floor.quad([X0, 0.008, Z0], [X0, 0.008, S], [E, 0.008, S], [E, 0.008, Z0], [0, 1, 0], [[X0 / 2.4, Z0 / 2.4], [X0 / 2.4, S / 2.4], [E / 2.4, S / 2.4], [E / 2.4, Z0 / 2.4]]);
  plan.paved.push({ x0: X0, x1: E, z0: Z0, z1: S });

  // The pool, frozen, inside a low kerb with snow along the top of it.
  const stoneG = new Geo(), capG = new Geo(), iceG = new Geo(), hedgeG = new Geo();
  const P = { x0: f.x - 5.4, x1: f.x + 5.4, z0: f.z - 4.4, z1: f.z + 4.4 }, kw = 0.36, kh = 0.24;
  iceG.quad([P.x0, 0.012, P.z0], [P.x0, 0.012, P.z1], [P.x1, 0.012, P.z1], [P.x1, 0.012, P.z0], [0, 1, 0]);      // the ice at the level the wheels are on (at 7 cm they sank into it)
  for (const [x0, x1, z0, z1] of [[P.x0 - kw, P.x1 + kw, P.z0 - kw, P.z0], [P.x0 - kw, P.x1 + kw, P.z1, P.z1 + kw], [P.x0 - kw, P.x0, P.z0, P.z1], [P.x1, P.x1 + kw, P.z0, P.z1]]) {
    stoneG.box(x0, x1, 0, kh, z0, z1); capG.box(x0 + 0.03, x1 - 0.03, kh, kh + 0.05, z0 + 0.03, z1 - 0.03); landable(plan, x0, x1, z0, z1, kh + 0.05);
  }

  // Clipped hedges round the edges, and a fir in two of the corners.
  const hedges = [], hedge = (x0, x1, z0, z1, h = 0.95) => { if (blocked(x0, x1, z0, z1)) return; hedges.push({ x0, x1, z0, z1, h: h + 0.05 }); landable(plan, x0, x1, z0, z1, h + 0.07, 0, 0.05); };
  hedge(X0, X0 + 0.8, Z0 + 0.6, S - 7);                                   // along the side towards the railway, stopping short of the door
  hedge(E - 4.6, E - 0.5, S - 1.5, S - 0.6); hedge(E - 1.3, E - 0.5, S - 7.5, S - 1.5);
  hedge(E - 1.3, E - 0.5, Z0 + 0.6, Z0 + 6);
  frostHedges(hedgeG, hedges, 0);
  const parts = { green: [], white: [], wood: [], metal: [] };
  const put = (k, g, x, y, z) => { g.translate(x, y, z); parts[k].push(g); };
  const fir = (x, z, s) => {
    if (blocked(x - 0.9 * s, x + 0.9 * s, z - 0.9 * s, z + 0.9 * s)) return;
    put('wood', new THREE.CylinderGeometry(0.09 * s, 0.12 * s, 0.7 * s, 6), x, 0.35 * s, z);
    for (let i = 0; i < 4; i++) { const r = (1.05 - i * 0.22) * s, y = (0.75 + i * 0.72) * s; put('green', new THREE.ConeGeometry(r, 1.1 * s, 9), x, y + 0.3 * s, z); put('white', new THREE.ConeGeometry(r * 0.72, 0.5 * s, 9), x, y + 0.66 * s, z); }
    solid(x - 0.7 * s, x + 0.7 * s, z - 0.7 * s, z + 0.7 * s, 3.8 * s);
  };
  fir(X0 + 2.4, Z0 + 1.6, 1.25); fir(E - 2.9, S - 3.4, 1.05);

  // The café's tables: a round top on a pedestal, two chairs, and a green parasol, open with the
  // snow lying on it or furled for the winter.
  const table = (x, z, open, turn) => {
    if (blocked(x - 0.8, x + 0.8, z - 0.8, z + 0.8)) return;
    put('metal', new THREE.CylinderGeometry(0.46, 0.46, 0.035, 14), x, 0.72, z); put('metal', new THREE.CylinderGeometry(0.035, 0.035, 0.7, 6), x, 0.36, z); put('metal', new THREE.CylinderGeometry(0.22, 0.24, 0.03, 10), x, 0.02, z);
    put('white', new THREE.CylinderGeometry(0.43, 0.45, 0.05, 14), x, 0.765, z);
    for (const sg of [-1, 1]) { const cx = x + Math.cos(turn) * 0.68 * sg, cz = z + Math.sin(turn) * 0.68 * sg;
      // (the chairs are loose: src/loose.js stands one here, facing the table, and it can be knocked about)
      (plan.looseExtra || (plan.looseExtra = [])).push({ kind: 'loose', room: 'court', bounds: { x0: X0, x1: E, z0: Z0, z1: S, y: 0, h: 4 }, type: 'chair', x: cx, y: 0, z: cz, yaw: Math.atan2(-Math.cos(turn) * sg, -Math.sin(turn) * sg), col: 0x3d4a44 }); }
    put('wood', new THREE.CylinderGeometry(0.028, 0.028, 2.5, 6), x, 1.25, z);
    if (open) { put('green', new THREE.ConeGeometry(1.3, 0.5, 8, 1, true), x, 2.35, z); put('white', new THREE.ConeGeometry(0.98, 0.38, 8), x, 2.44, z); solid(x - 1.1, x + 1.1, z - 1.1, z + 1.1, 2.7, 2.05); }
    else { put('green', new THREE.ConeGeometry(0.15, 1.35, 8), x, 1.85, z); put('white', new THREE.ConeGeometry(0.08, 0.3, 8), x, 2.5, z); }
    solid(x - 0.3, x + 0.3, z - 0.3, z + 0.3, 1.0);
  };
  { let i = 0;
    for (const z of [f.z - 4, f.z, f.z + 4]) table(P.x0 - 3.9, z, i++ % 3 !== 1, 1.57);                       // the side towards the railway
    for (const x of [P.x0 - 1.6, P.x0 + 2.4, P.x1 - 2.2, P.x1 + 1.2]) table(x, P.z1 + 3.9, i++ % 3 !== 1, 0.2 + i); }      // and the side towards the arcade

  // ------------------------------------------------------------------------ the walls
  // Thin dressings just proud of what is there: an arcade, a balustraded gallery over it, and (on
  // the south side) a row of wide square windows above that.
  const wallG = new Geo(), trimG = new Geo(), glowG = new Geo(), barG = new Geo(), winG = new Geo();
  const dress = (east, u0, u1, upper) => {
    // u runs along the wall, d out from it into the court.
    const bx = (g, a, b, y0, y1, d0, d1) => east ? g.box(E - d1, E - d0, y0, y1, a, b) : g.box(a, b, y0, y1, S - d1, S - d0);
    const pt = (u, y, d) => east ? [E - d, y, u] : [u, y, S - d], n = east ? [-1, 0, 0] : [0, 0, -1];
    const top = upper ? 9.3 : 5.5, nb = Math.max(2, Math.round((u1 - u0) / 4.3)), bay = (u1 - u0) / nb, w = 2.3, spring = 2.55, r = w / 2;
    // (Left open round any way in that has been cut through this wall: a dressing laid over it would wall it up.)
    const cuts = (plan.holes || []).filter(q => east ? Math.abs((q.x0 + q.x1) / 2 - E) < 1.2 && q.z1 > u0 && q.z0 < u1 : Math.abs((q.z0 + q.z1) / 2 - S) < 1.2 && q.x1 > u0 && q.x0 < u1).map(q => east ? [q.z0 - 0.12, q.z1 + 0.12, q.h + 0.12] : [q.x0 - 0.12, q.x1 + 0.12, q.h + 0.12]).sort((p, q) => p[0] - q[0]);
    { let u = u0; for (const [a, b, hh] of cuts) { bx(wallG, u, a, 0, top, 0, 0.07); bx(trimG, u, a, 0, 0.3, 0.07, 0.16); bx(wallG, a, b, hh, top, 0, 0.07); u = b; } bx(wallG, u, u1, 0, top, 0, 0.07); bx(trimG, u, u1, 0, 0.3, 0.07, 0.16); } bx(trimG, u0, u1, 4.25, 4.5, 0.07, 0.3); bx(trimG, u0, u1, top - 0.28, top, 0.07, 0.26);
    for (let i = 0; i <= nb; i++) { const u = u0 + i * bay; bx(trimG, u - 0.3, u + 0.3, 0.3, 4.25, 0.07, 0.2); bx(trimG, u - 0.36, u + 0.36, 3.95, 4.25, 0.07, 0.26); }
    for (let i = 0; i < nb; i++) {
      const c = u0 + (i + 0.5) * bay, d = 0.09;
      // the glazed door and its round head, lit from inside
      glowG.quad(pt(c - r, 0.3, d), pt(c + r, 0.3, d), pt(c + r, spring, d), pt(c - r, spring, d), n);
      for (let k = 0; k < 10; k++) { const a0 = Math.PI * k / 10, a1 = Math.PI * (k + 1) / 10; glowG.quad(pt(c, spring, d), pt(c + r * Math.cos(a0), spring + r * Math.sin(a0), d), pt(c + r * Math.cos(a1), spring + r * Math.sin(a1), d), pt(c, spring, d), n); }
      for (let k = 0; k < 10; k++) { const a = Math.PI * (k + 0.5) / 10, y = spring + (r + 0.13) * Math.sin(a), u = c + (r + 0.13) * Math.cos(a); bx(trimG, u - 0.2, u + 0.2, y - 0.19, y + 0.19, 0.07, 0.19); }
      bx(trimG, c - r - 0.26, c - r, 0.3, spring, 0.07, 0.19); bx(trimG, c + r, c + r + 0.26, 0.3, spring, 0.07, 0.19);
      bx(barG, c - 0.035, c + 0.035, 0.3, spring + r - 0.05, 0.09, 0.13); bx(barG, c - r, c + r, spring - 0.04, spring + 0.04, 0.09, 0.13); bx(barG, c - r, c + r, 0.3, 0.42, 0.09, 0.13);
      for (const o of [-r / 2, r / 2]) bx(barG, c + o - 0.02, c + o + 0.02, 0.3, spring, 0.09, 0.12);
      // the gallery's balustrade over it
      bx(trimG, c - bay / 2 + 0.3, c + bay / 2 - 0.3, 5.22, 5.36, 0.1, 0.3); bx(trimG, c - bay / 2 + 0.3, c + bay / 2 - 0.3, 4.5, 4.6, 0.1, 0.3);
      for (let u = c - bay / 2 + 0.55; u < c + bay / 2 - 0.45; u += 0.3) bx(trimG, u - 0.055, u + 0.055, 4.6, 5.22, 0.15, 0.26);
      if (upper) { const ww = Math.min(3.1, bay - 1.1) / 2; winG.quad(pt(c - ww, 6.1, d), pt(c + ww, 6.1, d), pt(c + ww, 8.3, d), pt(c - ww, 8.3, d), n); bx(trimG, c - ww - 0.12, c + ww + 0.12, 8.3, 8.48, 0.07, 0.18); bx(trimG, c - ww - 0.12, c + ww + 0.12, 5.94, 6.1, 0.07, 0.2); bx(barG, c - 0.03, c + 0.03, 6.1, 8.3, 0.09, 0.13); }
    }
    for (let i = 0; i <= nb; i++) { const u = u0 + i * bay; bx(trimG, u - 0.3, u + 0.3, 4.5, 5.42, 0.07, 0.32); if (upper) bx(trimG, u - 0.24, u + 0.24, 5.42, top - 0.28, 0.07, 0.16); }
  };
  // The south wall: clear of the real door in it. The east wall: the length of the court.
  { const doors = plan.doors.filter(d => d.out && Math.abs(d.z0 - S) < 1.5 && d.x1 > X0 - 6 && d.x0 < E), u0 = Math.max(X0, ...doors.map(d => d.x1 + 1.6)); if (E - 0.4 - u0 > 8) dress(false, u0, E - 0.4, true); }
  { const doors = plan.doors.filter(d => d.out && Math.abs(d.x0 - E) < 1.5 && d.z1 > Z0 && d.z0 < S), u0 = Math.max(Z0 - 1.5, ...doors.map(d => d.z1 + 1.6)); if (S - 0.4 - u0 > 8) dress(true, u0, S - 0.4, false); }

  const std = (c, e, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.85, emissive: e, emissiveIntensity: 0.6, ...o });
  const both = { side: THREE.DoubleSide };
  add(floor.mesh(flags), stoneG.mesh(trim), capG.mesh(snow), hedgeG.mesh(hedgeM),
    iceG.mesh(new THREE.MeshStandardMaterial({ color: 0xa9c4d6, roughness: 0.18, metalness: 0.1, emissive: 0x2c4660, emissiveIntensity: 0.7 })),
    wallG.mesh(std(0xb9b3a5, 0x4d4f5e)), trimG.mesh(trim),
    glowG.mesh(new THREE.MeshBasicMaterial({ color: new THREE.Color(0.8, 0.54, 0.25), ...both })), winG.mesh(new THREE.MeshBasicMaterial({ color: new THREE.Color(0.2, 0.19, 0.2), ...both })),
    barG.mesh(std(0x25262b, 0x0c0d10)));
  const mats = { green: std(0x1f4a34, 0x0d2418, { side: THREE.DoubleSide }), white: snow, wood: std(0x4a3a2a, 0x1a140e), metal: std(0x8d9198, 0x34373f, { roughness: 0.5 }) };
  for (const k in parts) if (parts[k].length) add(new THREE.Mesh(mergeGeometries(parts[k].map(g => g.index ? g.toNonIndexed() : g)), mats[k]));
}
