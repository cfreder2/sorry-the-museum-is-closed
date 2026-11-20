// The Modern Wing from outside, and the Nichols Bridgeway.
//
// Worked by eye from aerial and street photographs: the north face of glass between limestone
// piers; the "flying carpet", a white sunshade of fine blades floating over the gallery pavilion
// on thin columns; the glass boxes and the pink glass of the terrace on the west pavilion, over
// the railway; and the footbridge, a long thin white blade that climbs from Millennium Park on
// slender splayed legs, over Monroe Street, to a glass stair tower at the wing's third floor.
//
// All of it is drawn here and none of it is part of the plan: the rooms are where they were.
// What stands on the ground (the tower, the legs, the columns) is added to the plan's obstacles.

import * as THREE from 'three';
import { Geo } from './geo.js';

const tex = (w, h, draw, rx = 1, ry = 1) => {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.anisotropy = 4;
  return t;
};
// A small steady random, so the lit windows are the same every night.
const rng = seed => () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };

// One bay of curtain wall, one storey high: tall panes between thin pale mullions, a few of them lit.
function curtain(seed, lit = 0.22) {
  return tex(256, 256, (c, w, h) => {
    const r = rng(seed), g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#16283c'); g.addColorStop(0.6, '#1d3550'); g.addColorStop(1, '#122234');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    const n = 8, pw = w / n;
    for (let i = 0; i < n; i++) {
      if (r() < lit) { const a = 0.18 + r() * 0.3; c.fillStyle = `rgba(255,${200 + (r() * 40 | 0)},${130 + (r() * 60 | 0)},${a})`; c.fillRect(i * pw, 0, pw, h); }
      else if (r() < 0.3) { c.fillStyle = 'rgba(120,170,210,0.10)'; c.fillRect(i * pw, 0, pw, h); }
    }
    c.fillStyle = 'rgba(214,222,232,0.9)';
    for (let i = 0; i <= n; i++) c.fillRect(Math.round(i * pw) - 1, 0, 2, h);
    c.fillStyle = 'rgba(214,222,232,0.55)'; c.fillRect(0, h * 0.46, w, 2);
  });
}

// The sunshade's blades: fine, close, parallel, with the sky between them.
function blades() {
  return tex(64, 64, (c, w, h) => {
    c.clearRect(0, 0, w, h);
    c.fillStyle = 'rgba(244,247,252,0.96)';
    for (let x = 0; x < w; x += 4) c.fillRect(x, 0, 2, h);
    c.fillStyle = 'rgba(244,247,252,0.5)'; c.fillRect(0, 0, w, 1);
  });
}

// Glass with the lights left on a long way behind it: a soft even glow, brighter low down.
function glowTex(warm) {
  return tex(128, 128, (c, w, h) => {
    const r = rng(warm ? 9 : 5), g = c.createLinearGradient(0, 0, 0, h);
    if (warm) { g.addColorStop(0, '#6b5230'); g.addColorStop(0.5, '#e8b56a'); g.addColorStop(1, '#f2c888'); }
    else { g.addColorStop(0, '#7f8ea0'); g.addColorStop(0.55, '#b9c4cf'); g.addColorStop(1, '#d9dcd6'); }
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 16; i++) { c.fillStyle = `rgba(${warm ? '90,50,10' : '30,50,80'},${0.05 + r() * 0.16})`; c.fillRect(i * 8, 0, 8, h); }
    if (warm) for (let i = 0; i < 5; i++) { c.fillStyle = 'rgba(20,16,12,0.55)'; c.fillRect(8 + r() * 104, h * 0.55, 3 + r() * 8, h * 0.45); }      // things standing in the lobby
  });
}
// A screen of thin white fins, close together, with the gaps open.
function finTex() {
  return tex(64, 8, (c, w, h) => { c.clearRect(0, 0, w, h); c.fillStyle = 'rgba(246,248,252,1)'; for (let x = 0; x < w; x += 8) c.fillRect(x, 0, 3, h); });
}
// Limestone in big coursed blocks.
function limeTex() {
  return tex(128, 128, (c, w, h) => {
    const r = rng(41); c.fillStyle = '#b3aa98'; c.fillRect(0, 0, w, h);
    const rows = 4, rh = h / rows;
    for (let j = 0; j < rows; j++) for (let i = -1; i < 2; i++) {
      const x = i * w / 2 + (j % 2 ? w / 4 : 0), t = 204 + (r() * 9 | 0);
      c.fillStyle = `rgb(${t + 8},${t + 1},${t - 14})`; c.fillRect(x + 0.7, j * rh + 0.7, w / 2 - 1.4, rh - 1.4);
      for (let k = 0; k < 14; k++) { c.fillStyle = `rgba(120,104,80,${0.05 + r() * 0.08})`; c.fillRect(x + r() * w / 2, j * rh + r() * rh, 2 + r() * 9, 1 + r() * 2); }
    }
  });
}
// Stone paving in square slabs, for the terrace.
function slabTex() {
  return tex(64, 64, (c) => { const r = rng(77); for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) { const t = 132 + (r() * 22 | 0); c.fillStyle = `rgb(${t},${t + 2},${t + 6})`; c.fillRect(i * 32, j * 32, 32, 32); } c.strokeStyle = 'rgba(70,74,84,0.9)'; c.lineWidth = 1.5; c.strokeRect(0, 0, 32, 32); c.strokeRect(32, 0, 32, 32); c.strokeRect(0, 32, 32, 32); c.strokeRect(32, 32, 32, 32); });
}

export function buildBridgeway(museum, plan) {
  const group = museum.group, B = plan.bounds, h = plan.hall;
  const add = (...m) => { for (const x of m) { x.matrixAutoUpdate = false; x.updateMatrix(); group.add(x); } };
  const O = plan.obstacles;
  const white = new THREE.MeshStandardMaterial({ color: 0xeef1f5, roughness: 0.5, emissive: 0x6a7184, emissiveIntensity: 0.72 });
  const steel = new THREE.MeshStandardMaterial({ color: 0xc9ced6, roughness: 0.45, metalness: 0.3, emissive: 0x4c5262, emissiveIntensity: 0.7 });
  const lt = limeTex();
  const lime = new THREE.MeshStandardMaterial({ map: lt, roughness: 0.9, emissiveMap: lt, emissive: new THREE.Color(0.5, 0.47, 0.44), emissiveIntensity: 0.78 });
  const finMat = new THREE.MeshBasicMaterial({ map: finTex(), transparent: true, alphaTest: 0.5, side: THREE.DoubleSide, color: new THREE.Color(0.82, 0.86, 0.95) });
  const glowMat = new THREE.MeshBasicMaterial({ map: glowTex(false), color: new THREE.Color(0.62, 0.68, 0.8) });
  const warmMat = new THREE.MeshBasicMaterial({ map: glowTex(true), color: new THREE.Color(0.95, 0.82, 0.62) });
  const fins = new Geo(), glow = new Geo(), warm = new Geo(), clearGlass = new Geo();
  const GR = plan.grounds;
  const hit = (q, x0, x1, z0, z1, m = 0.4) => q.x0 < x1 + m && q.x1 > x0 - m && q.z0 < z1 + m && q.z1 > z0 - m;
  // Is this patch of ground free: no kit, path, hill, tree, lamp or racing line on it?
  const clear = (x0, x1, z0, z1) =>
    !O.some(o => o.y0 < 2 && o.y1 > 0.05 && hit(o, x0, x1, z0, z1))
    && !plan.surfaces.some(q => !q.hill && Math.min(q.h0 || 0, q.h1 || 0) < 3 && hit(q, x0, x1, z0, z1, 1))
    && !(GR.paths || []).some(q => hit(q, x0, x1, z0, z1))
    && !(plan.decals || []).some(q => hit(q, x0, x1, z0, z1))
    && !(plan.hills || []).some(q => q.cx + q.rx > x0 && q.cx - q.rx < x1 && q.cz + q.rz > z0 && q.cz - q.rz < z1)
    && ![...(GR.trees || []), ...(plan.lamps || []), ...(GR.snowmen || []), ...(plan.line || [])].some(q => q.x > x0 - 1.2 && q.x < x1 + 1.2 && q.z > z0 - 1.2 && q.z < z1 + 1.2)
    && !plan.masses.some(q => hit(q, x0, x1, z0, z1, 0.1));
  const dark = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.03, 0.04, 0.07) });

  const mod = plan.masses.filter(m => m.room && m.room.building === 'modern' && m.room.kind !== 'hall');
  if (!mod.length || !h) return;
  const tallest = (x, z) => { let t = 0; for (const q of plan.masses) if (x > q.x0 && x < q.x1 && z > q.z0 && z < q.z1 && q.top > t) t = q.top; return t; };
  // A thin round member from one point to another.
  const strut = (a, b, r, mat) => {
    const d = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]), len = d.length();
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 8), mat);
    m.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
    add(m);
  };

  // ------------------------------------------------------------ the north face
  // Read off the plan: along the wing's north side, which block stands furthest north at each
  // metre, and how tall. Each stretch gets glass from the ground to the eaves, storey by storey,
  // between limestone piers.
  const stone = new Geo(), fascia = new Geo();
  {
    const X0 = Math.min(...mod.map(m => m.x0)), X1 = Math.max(...mod.map(m => m.x1)), zN = Math.min(...mod.map(m => m.z0));
    const runs = [];
    for (let x = X0 + 0.25; x < X1; x += 0.5) {
      const here = mod.filter(m => x > m.x0 && x < m.x1 && m.z0 < zN + 8);
      if (!here.length) continue;
      const z = Math.min(...here.map(m => m.z0)), top = Math.max(...here.filter(m => m.z0 < z + 0.6).map(m => m.top));
      if (tallest(x, z - 0.6) > top - 0.5) continue;        // something stands in front of it (the court's own glass end, the stair tower)
      const last = runs[runs.length - 1];
      if (last && Math.abs(last.z - z) < 0.3 && Math.abs(last.top - top) < 0.5 && x - last.x1 < 0.8) last.x1 = x + 0.25;
      else runs.push({ x0: x - 0.25, x1: x + 0.25, z, top });
    }
    runs.forEach((r) => {
      if (r.x1 - r.x0 < 1.5) return;
      const z = r.z - 0.07, n = [0, 0, -1], w = r.x1 - r.x0, bays = Math.max(1, Math.round(w / 12)), tall = r.top > 8;
      // The ground floor: clear glass, and the lights on inside.
      const g1 = tall ? 4.85 : r.top - 0.45;
      warm.quad([r.x1, 0.14, z], [r.x0, 0.14, z], [r.x0, g1, z], [r.x1, g1, z], n, [[0, 0], [w / 9, 0], [w / 9, 1], [0, 1]]);
      fascia.box(r.x0, r.x1, 0, 0.14, z - 0.1, z + 0.02);
      for (let x = r.x0 + 2; x < r.x1 - 1; x += 2) fascia.box(x - 0.03, x + 0.03, 0.14, g1, z - 0.06, z);
      if (tall) {
        // Above it, two tall tiers of glass glowing softly behind a screen of thin white fins, with a rail between.
        const yA = 5.3, yB = r.top - 0.45, mid = (yA + yB) / 2, zf = z - 0.34;
        glow.quad([r.x1, yA, z], [r.x0, yA, z], [r.x0, yB, z], [r.x1, yB, z], n, [[0, 0], [w / 7, 0], [w / 7, 1], [0, 1]]);
        fins.quad([r.x1, yA - 0.15, zf], [r.x0, yA - 0.15, zf], [r.x0, yB + 0.9, zf], [r.x1, yB + 0.9, zf], n, [[0, 0], [w / 1.9, 0], [w / 1.9, 1], [0, 1]]);
        fascia.box(r.x0, r.x1, 4.85, yA, z - 0.42, z + 0.02);                 // the edge of the first floor, and the foot of the screen
        fascia.box(r.x0, r.x1, mid - 0.1, mid + 0.1, zf - 0.05, z);
        fascia.box(r.x0, r.x1, yB, yB + 0.12, zf - 0.05, z);
      }
      fascia.box(r.x0 - 0.1, r.x1 + 0.1, r.top - 0.45, r.top + 0.25, z - 0.18, z + 0.02);
      // Piers: broad slabs of limestone, one at each end of the stretch and one every bay between.
      for (let i = 0; i <= bays; i++) { const x = r.x0 + (w * i) / bays, hw = tall ? 1.25 : 0.5; stone.box(Math.max(r.x0 - 0.5, x - hw), Math.min(r.x1 + 0.5, x + hw), 0, r.top + 0.35, z - 0.5, z + 0.04, 3.2); }
    });
  }

  // ------------------------------------------------------------ the west pavilion
  // Its north end carries the terrace: glass boxes stacked on the railway side, and on the roof
  // a screen of pink glass.
  const wp = mod.filter(m => m.room.use === 'terrace').sort((a, b) => b.top - a.top)[0] || mod.slice().sort((a, b) => a.x0 - b.x0)[0];
  {
    const boxGlass = new THREE.MeshBasicMaterial({ map: curtain(77, 0.4), color: new THREE.Color(0.85, 0.92, 1) });
    const frame = new Geo();
    const glassBox = (x0, x1, y0, y1, z0, z1, seed) => {
      const g = new Geo(), u = Math.max(1, Math.round((z1 - z0) / 10)), v = Math.max(1, Math.round((x1 - x0) / 10));
      g.quad([x0, y0, z1], [x0, y0, z0], [x0, y1, z0], [x0, y1, z1], [-1, 0, 0], [[0, 0], [u, 0], [u, 1], [0, 1]]);
      g.quad([x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], [0, 0, -1], [[0, 0], [v, 0], [v, 1], [0, 1]]);
      g.quad([x1, y0, z1], [x0, y0, z1], [x0, y1, z1], [x1, y1, z1], [0, 0, 1], [[0, 0], [v, 0], [v, 1], [0, 1]]);
      const m = boxGlass.clone(); m.map = curtain(seed, 0.4); add(g.mesh(m));
      frame.box(x0 - 0.06, x1, y1, y1 + 0.22, z0 - 0.06, z1 + 0.06); frame.box(x0 - 0.06, x1, y0 - 0.22, y0, z0 - 0.06, z1 + 0.06);
      for (const z of [z0, z1]) frame.box(x0 - 0.07, x0 + 0.07, y0, y1, z - 0.07, z + 0.07);
      O.push({ x0, x1, z0, z1, y0: y0 - 0.25, y1: y1 + 0.25 });
    };
    const wx = wp.x0, zn = wp.z0;
    glassBox(wx - 3.4, wx - 0.02, 5.7, 10.9, zn + 1.2, zn + 17, 201);
    glassBox(wx - 2.2, wx - 0.02, 11.5, 15.6, zn + 3.2, zn + 13, 202);
    // The four blue legs the lower box stands on, as in the photograph.
    for (const z of [zn + 3, zn + 15.2]) { strut([wx - 2.9, 0, z], [wx - 2.9, 5.5, z], 0.11, steel); O.push({ x0: wx - 3.05, x1: wx - 2.75, z0: z - 0.15, z1: z + 0.15, y0: 0, y1: 5.5 }); }
    add(frame.mesh(white));
    // The pink glass: a waist-high-and-more screen round the roof terrace, lit from inside.
    const px0 = wp.x0 + 0.5, px1 = wp.x1 - 0.5, pz0 = wp.z0 + 0.5, pz1 = Math.min(wp.z1 - 0.5, wp.z0 + 20), py = wp.top, ph = 1.7;
    const pink = new Geo(), rail = new Geo(), clearG = new Geo();
    for (const [a, b] of [[[px0, pz0], [px1, pz0]], [[px1, pz0], [px1, pz1]], [[px1, pz1], [px0, pz1]], [[px0, pz1], [px0, pz0]]]) {
      const nn = a[1] === b[1] ? [0, 0, a[1] === pz0 ? -1 : 1] : [a[0] === px0 ? -1 : 1, 0, 0], street = (a[1] === pz0 && b[1] === pz0) || (a[0] === px0 && b[0] === px0);
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]), o = 0.12;
      if (street) {
        pink.quad([a[0], py - 0.5, a[1]], [b[0], py - 0.5, b[1]], [b[0], py + ph + 0.4, b[1]], [a[0], py + ph + 0.4, a[1]], nn);
        // the fins of the screen below run on up past it
        fins.quad([a[0] + nn[0] * o, py - 0.6, a[1] + nn[2] * o], [b[0] + nn[0] * o, py - 0.6, b[1] + nn[2] * o], [b[0] + nn[0] * o, py + ph + 1.1, b[1] + nn[2] * o], [a[0] + nn[0] * o, py + ph + 1.1, a[1] + nn[2] * o], nn, [[0, 0], [len / 1.9, 0], [len / 1.9, 1], [0, 1]]);
      } else clearG.quad([a[0], py, a[1]], [b[0], py, b[1]], [b[0], py + 1.15, b[1]], [a[0], py + 1.15, a[1]], nn);
    }
    for (let x = px0; x <= px1 + 0.01; x += (px1 - px0) / 6) rail.box(x - 0.03, x + 0.03, py, py + 1.2, pz1 - 0.03, pz1 + 0.03);
    for (let z = pz0; z <= pz1 + 0.01; z += (pz1 - pz0) / 8) rail.box(px1 - 0.03, px1 + 0.03, py, py + 1.2, z - 0.03, z + 0.03);
    const pm = pink.mesh(new THREE.MeshBasicMaterial({ color: new THREE.Color(1.5, 0.22, 0.95), transparent: true, opacity: 0.7, side: THREE.DoubleSide, depthWrite: false })); pm.renderOrder = 2;
    const cm = clearG.mesh(new THREE.MeshBasicMaterial({ color: new THREE.Color(0.55, 0.75, 0.9), transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false })); cm.renderOrder = 2;
    add(pm, cm, rail.mesh(white));

    // The terrace itself: paving, a white pergola frame over it, and four things to walk round.
    // (The sculptures are made up for the game: nobody's work.)
    {
      const st = slabTex(), pav = new Geo(), perg = new Geo(), y = py + 0.04;
      pav.quad([px0, y, pz0], [px0, y, pz1], [px1, y, pz1], [px1, y, pz0], [0, 1, 0], [[0, 0], [0, (pz1 - pz0) / 2.4], [(px1 - px0) / 2.4, (pz1 - pz0) / 2.4], [(px1 - px0) / 2.4, 0]]);
      add(pav.mesh(new THREE.MeshStandardMaterial({ map: st, roughness: 0.85, emissiveMap: st, emissive: new THREE.Color(0.42, 0.45, 0.55), emissiveIntensity: 0.6, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })));
      const H = 3.1, nxp = 3, nzp = 4;
      for (let i = 0; i <= nxp; i++) for (let j = 0; j <= nzp; j++) { if (i > 0 && i < nxp && j > 0 && j < nzp) continue; const x = px0 + 0.25 + ((px1 - px0 - 0.5) * i) / nxp, z = pz0 + 0.25 + ((pz1 - pz0 - 0.5) * j) / nzp; perg.box(x - 0.05, x + 0.05, py, py + H, z - 0.05, z + 0.05); O.push({ x0: x - 0.08, x1: x + 0.08, z0: z - 0.08, z1: z + 0.08, y0: py, y1: py + H }); }
      for (const z of [pz0 + 0.25, pz1 - 0.25]) perg.box(px0 + 0.2, px1 - 0.2, py + H - 0.14, py + H, z - 0.06, z + 0.06);
      for (const x of [px0 + 0.25, px1 - 0.25]) perg.box(x - 0.06, x + 0.06, py + H - 0.14, py + H, pz0 + 0.2, pz1 - 0.2);
      for (let z = pz0 + 1.4; z < pz1 - 1; z += 1.2) perg.box(px0 + 0.2, px0 + 3.2, py + H - 0.1, py + H - 0.04, z - 0.03, z + 0.03);      // slats along the street side
      add(perg.mesh(white));
      const granite = tex(64, 64, (c, w, hh) => { const r = rng(3); c.fillStyle = '#9a4a3c'; c.fillRect(0, 0, w, hh); for (let i = 0; i < 700; i++) { c.fillStyle = ['#c06a55', '#6e2f27', '#d8a090', '#3a2422'][i % 4]; c.fillRect(r() * w, r() * hh, 1.5, 1.5); } });
      const red = new THREE.MeshStandardMaterial({ map: granite, roughness: 0.8, emissiveMap: granite, emissive: new THREE.Color(0.5, 0.36, 0.34), emissiveIntensity: 0.6, side: THREE.DoubleSide });
      const rock = new THREE.MeshStandardMaterial({ color: 0x8b8a86, roughness: 0.95, flatShading: true, emissive: 0x3a3d48, emissiveIntensity: 0.6 });
      const bronze = new THREE.MeshStandardMaterial({ color: 0x6a4a2c, roughness: 0.45, metalness: 0.6, emissive: 0x2c1e10, emissiveIntensity: 0.7 });
      const cx = (px0 + px1) / 2, cz = (pz0 + pz1) / 2;
      // A zigzag of red stone: three wedges leaning on one another.
      { const zg = new Geo(), bx = cx - 2.6, bz = cz - 3.2, wd = 1.5;
        const wedge = (x0, x1, hA, hB) => { zg.quad([x0, py, bz], [x1, py, bz], [x1, py + hB, bz], [x0, py + hA, bz], [0, 0, -1]); zg.quad([x1, py, bz + wd], [x0, py, bz + wd], [x0, py + hA, bz + wd], [x1, py + hB, bz + wd], [0, 0, 1]); zg.quad([x0, py + hA, bz], [x1, py + hB, bz], [x1, py + hB, bz + wd], [x0, py + hA, bz + wd], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]]); zg.quad([x0, py, bz + wd], [x0, py, bz], [x0, py + hA, bz], [x0, py + hA, bz + wd], [-1, 0, 0]); zg.quad([x1, py, bz], [x1, py, bz + wd], [x1, py + hB, bz + wd], [x1, py + hB, bz], [1, 0, 0]); };
        wedge(bx, bx + 1.1, 1.25, 0.25); wedge(bx + 1.1, bx + 2.1, 0.25, 0.95); wedge(bx + 2.1, bx + 3.0, 0.95, 0.12);
        add(zg.mesh(red)); O.push({ x0: bx, x1: bx + 3, z0: bz, z1: bz + wd, y0: py, y1: py + 1.25 }); }
      // Two rough boulders.
      for (const [dx, dz, sc, seed] of [[2.6, 2.2, 0.85, 11], [-1.2, 4.6, 0.7, 23]]) {
        const g = new THREE.IcosahedronGeometry(1, 1), pa = g.attributes.position, r = rng(seed);
        const jit = new Map(); for (let i = 0; i < pa.count; i++) { const k = [pa.getX(i), pa.getY(i), pa.getZ(i)].map(v => v.toFixed(2)).join(); if (!jit.has(k)) jit.set(k, 0.78 + r() * 0.4); const f = jit.get(k); pa.setXYZ(i, pa.getX(i) * f, Math.max(-0.35, pa.getY(i) * f * 0.75), pa.getZ(i) * f); }
        g.computeVertexNormals(); const m = new THREE.Mesh(g, rock); m.scale.setScalar(sc); m.position.set(cx + dx, py + 0.35 * sc, cz + dz); m.rotation.y = seed; add(m);
        O.push({ x0: cx + dx - sc, x1: cx + dx + sc, z0: cz + dz - sc, z1: cz + dz + sc, y0: py, y1: py + sc * 1.1 });
      }
      // A bronze drum on its side, on a low block.
      { const d = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 1.5, 20), bronze); d.rotation.set(0, 0.5, Math.PI / 2); d.position.set(cx + 3.3, py + 0.95, cz - 4.6); const bl = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.4, 1.0), red); bl.position.set(cx + 3.3, py + 0.2, cz - 4.6); bl.rotation.y = 0.5; add(d, bl);
        O.push({ x0: cx + 2.4, x1: cx + 4.2, z0: cz - 5.4, z1: cz - 3.8, y0: py, y1: py + 1.5 }); }
    }

    // The pavilion's west face, over the railway: limestone piers, a grey ribbed panel, and south of
    // the door a screen of white fins over glowing glass. The door's own block gets a glass canopy.
    {
      const wxf = wp.x0 - 0.08, top = wp.top, W = [-1, 0, 0], rib = tex(16, 8, (c, w, hh) => { c.fillStyle = '#7d8492'; c.fillRect(0, 0, w, hh); c.fillStyle = '#5c6270'; c.fillRect(0, 0, 3, hh); c.fillStyle = '#9aa1ae'; c.fillRect(8, 0, 2, hh); });
      const ribG = new Geo(), wall = (g, z0, z1, y0, y1, u, v = 1) => g.quad([wxf, y0, z1], [wxf, y0, z0], [wxf, y1, z0], [wxf, y1, z1], W, [[0, 0], [u, 0], [u, v], [0, v]]);
      const blk = plan.masses.find(m => m.room && m.room.id === 'MW1-west'), bz0 = blk ? blk.z0 : wp.z0 + 24, bz1 = blk ? blk.z1 : wp.z0 + 31, btop = blk ? blk.top : 5;
      const rz0 = wp.z0 + 17.4, s0 = bz1 + 0.6, s1 = Math.min(wp.z1 - 0.6, s0 + 17);
      wall(ribG, rz0, bz0 - 0.5, 0.2, top - 0.3, (bz0 - 0.5 - rz0) / 0.5);
      add(ribG.mesh(new THREE.MeshStandardMaterial({ map: rib, roughness: 0.55, metalness: 0.3, emissiveMap: rib, emissive: new THREE.Color(0.36, 0.38, 0.46), emissiveIntensity: 0.6 })));
      wall(warm, s0, s1, 0.14, 4.85, (s1 - s0) / 9);
      wall(glow, s0, s1, 5.3, top - 0.45, (s1 - s0) / 7);
      fins.quad([wxf - 0.3, 5.15, s1], [wxf - 0.3, 5.15, s0], [wxf - 0.3, top - 0.4, s0], [wxf - 0.3, top - 0.4, s1], W, [[0, 0], [(s1 - s0) / 1.9, 0], [(s1 - s0) / 1.9, 1], [0, 1]]);
      fascia.box(wxf - 0.36, wxf + 0.04, 4.85, 5.3, s0, s1); fascia.box(wxf - 0.36, wxf + 0.04, (5.3 + top) / 2 - 0.1, (5.3 + top) / 2 + 0.1, s0, s1);
      for (const z of [rz0, bz0 - 0.1, s0 - 0.3, s1 + 0.3]) stone.box(wxf - 0.45, wxf + 0.1, z >= bz0 - 0.2 && z < bz1 ? btop : 0, top + 0.35, z - 0.55, z + 0.55, 3.2);
      if (blk) {
        // Over the west door: a thin canopy of glass on a white frame, held off the wall.
        const cz0 = blk.z0 + 0.4, cz1 = blk.z1 - 0.4, cx0 = blk.x0 - 2.6, cx1 = blk.x0;
        fascia.box(cx0, cx1, 3.3, 3.36, cz0, cz0 + 0.08); fascia.box(cx0, cx1, 3.3, 3.36, cz1 - 0.08, cz1); fascia.box(cx0, cx0 + 0.08, 3.3, 3.36, cz0, cz1);
        clearGlass.quad([cx0, 3.34, cz0], [cx0, 3.34, cz1], [cx1, 3.34, cz1], [cx1, 3.34, cz0], [0, 1, 0]);
        O.push({ x0: cx0, x1: cx1, z0: cz0, z1: cz1, y0: 3.25, y1: 3.45 });
      }
    }
  }

  // ------------------------------------------------------------ the stair tower
  // Where the bridge lands: a tall box of glass between two limestone piers, against the north
  // end of the west pavilion, with the bridge going in at the third floor.
  const tw = { x0: (wp.x0 + wp.x1) / 2 - 3.4, x1: (wp.x0 + wp.x1) / 2 + 3.4, z0: wp.z0 - 5.4, z1: wp.z0 - 0.05, top: wp.top + 0.8 }, L3 = 11.3;
  {
    const g = new Geo(), n = Math.round(tw.top / 4.5);
    g.quad([tw.x1, 0.15, tw.z0], [tw.x0, 0.15, tw.z0], [tw.x0, tw.top, tw.z0], [tw.x1, tw.top, tw.z0], [0, 0, -1], [[0, 0], [1, 0], [1, n], [0, n]]);
    g.quad([tw.x0, 0.15, tw.z0], [tw.x0, 0.15, tw.z1], [tw.x0, tw.top, tw.z1], [tw.x0, tw.top, tw.z0], [-1, 0, 0], [[0, 0], [1, 0], [1, n], [0, n]]);
    g.quad([tw.x1, 0.15, tw.z1], [tw.x1, 0.15, tw.z0], [tw.x1, tw.top, tw.z0], [tw.x1, tw.top, tw.z1], [1, 0, 0], [[0, 0], [1, 0], [1, n], [0, n]]);
    add(g.mesh(new THREE.MeshBasicMaterial({ map: curtain(55, 0.5), color: new THREE.Color(0.95, 1, 1.08) })));
    for (const x of [tw.x0, tw.x1]) stone.box(x - 0.55, x + 0.55, 0, tw.top + 0.5, tw.z0 - 0.45, tw.z0 + 0.65, 3.2);
    fascia.box(tw.x0 - 0.3, tw.x1 + 0.3, tw.top, tw.top + 0.3, tw.z0 - 0.3, tw.z1);
    fascia.box(tw.x0, tw.x1, 0, 0.15, tw.z0 - 0.05, tw.z1);
    // The flights inside, seen through the glass: a zigzag of pale slabs.
    const st = new Geo();
    for (let y = 0.2, k = 0; y < tw.top - 3; y += 2.8, k++) { const a = tw.x0 + 0.9, b = tw.x1 - 0.9, x0 = k % 2 ? b : a, x1 = k % 2 ? a : b; st.quad([x0, y, tw.z0 + 0.5], [x1, y + 2.8, tw.z0 + 0.5], [x1, y + 2.8, tw.z0 + 1.9], [x0, y, tw.z0 + 1.9], [0, 1, 0]); }
    const sm = st.mesh(new THREE.MeshBasicMaterial({ color: new THREE.Color(0.5, 0.46, 0.38), side: THREE.DoubleSide })); add(sm);
    // The way in from the bridge.
    const dz = tw.z0 - 0.09, cx = (tw.x0 + tw.x1) / 2, door = new Geo();
    door.quad([cx + 1.5, L3, dz], [cx - 1.5, L3, dz], [cx - 1.5, L3 + 2.9, dz], [cx + 1.5, L3 + 2.9, dz], [0, 0, -1]);
    add(door.mesh(new THREE.MeshBasicMaterial({ color: new THREE.Color(0.95, 0.7, 0.36) })));
    fascia.box(cx - 1.7, cx + 1.7, L3 + 2.9, L3 + 3.15, dz - 0.12, dz + 0.05); for (const s of [-1, 1]) fascia.box(cx + s * 1.6 - 0.1, cx + s * 1.6 + 0.1, L3, L3 + 2.9, dz - 0.12, dz + 0.05);
    O.push({ x0: tw.x0 - 0.5, x1: tw.x1 + 0.5, z0: tw.z0 - 0.4, z1: tw.z1, y0: 0, y1: tw.top + 0.5 });
  }
  // ------------------------------------------------------------ the way in from Monroe Street
  // Glass doors at the court's north end under a thin flat canopy; a long low limestone wall with
  // the museum's name on it; a clipped hedge along the pavement before the gallery pavilion.
  {
    const hm = plan.massOf[h.id] || { x0: h.x0 - 1, x1: h.x1 + 1, z0: h.z0 - 1 }, zf = hm.z0 - 0.09, x0 = hm.x0 + 0.6, x1 = hm.x1 - 0.6;
    warm.quad([x1, 0.1, zf], [x0, 0.1, zf], [x0, 3.1, zf], [x1, 3.1, zf], [0, 0, -1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    for (let x = x0; x <= x1 + 0.01; x += (x1 - x0) / 6) fascia.box(x - 0.04, x + 0.04, 0, 3.1, zf - 0.07, zf);
    fascia.box(x0 - 0.1, x1 + 0.1, 3.1, 3.3, zf - 0.1, zf);
    const c0 = hm.x0 - 0.8, c1 = hm.x1 + 0.8, cz0 = hm.z0 - 4.2;
    fascia.box(c0, c1, 3.5, 3.58, cz0, cz0 + 0.1); fascia.box(c0, c0 + 0.1, 3.5, 3.58, cz0, hm.z0); fascia.box(c1 - 0.1, c1, 3.5, 3.58, cz0, hm.z0);
    for (let x = c0 + (c1 - c0) / 4; x < c1 - 1; x += (c1 - c0) / 4) fascia.box(x - 0.04, x + 0.04, 3.48, 3.56, cz0, hm.z0);
    clearGlass.quad([c0, 3.56, cz0], [c0, 3.56, hm.z0], [c1, 3.56, hm.z0], [c1, 3.56, cz0], [0, 1, 0]);
    O.push({ x0: c0, x1: c1, z0: cz0, z1: hm.z0, y0: 3.4, y1: 3.7 });
    // A paved apron, a step proud of the snow.
    const apron = new Geo(), st = slabTex();
    apron.box(c0, c1, 0, 0.07, cz0 - 1.5, hm.z0, 2.4);
    add(apron.mesh(new THREE.MeshStandardMaterial({ map: st, roughness: 0.85, emissiveMap: st, emissive: new THREE.Color(0.5, 0.46, 0.4), emissiveIntensity: 0.6 })));

    // The wall with the name on it, before the west pavilion.
    const wz = Math.min(...mod.map(m => m.z0)) - 9.2, wx0 = wp.x0 - 3.5, wx1 = wp.x1 - 3.4, wh = 1.5;
    if (clear(wx0, wx1, wz - 0.3, wz + 0.3)) {
      stone.box(wx0, wx1, 0, wh, wz - 0.28, wz + 0.28, 3.2); fascia.box(wx0 - 0.05, wx1 + 0.05, wh, wh + 0.07, wz - 0.32, wz + 0.32);
      const name = tex(2048, 128, (c, w, hh) => { c.clearRect(0, 0, w, hh); c.fillStyle = '#f4f1e6'; c.font = '600 74px "Helvetica Neue", Arial, sans-serif'; c.textBaseline = 'middle'; c.textAlign = 'left'; const t = 'THE ART INSTITVTE OF CHICAGO'; let tw = 0; for (const ch of t) tw += c.measureText(ch).width + 9; let x = (w - tw) / 2; for (const ch of t) { c.fillText(ch, x, hh / 2 + 4); x += c.measureText(ch).width + 9; } });
      name.wrapS = name.wrapT = THREE.ClampToEdgeWrapping;
      const nm = new THREE.Mesh(new THREE.PlaneGeometry(wx1 - wx0 - 1.2, (wx1 - wx0 - 1.2) / 16), new THREE.MeshBasicMaterial({ map: name, transparent: true, depthWrite: false, color: new THREE.Color(0.9, 0.9, 0.95) }));
      nm.position.set((wx0 + wx1) / 2, wh * 0.56, wz - 0.3); nm.rotation.y = Math.PI; add(nm);
      O.push({ x0: wx0, x1: wx1, z0: wz - 0.3, z1: wz + 0.3, y0: 0, y1: wh });
    }
    // The hedge, in lengths, wherever the ground is free.
    const zN = Math.min(...mod.map(q => q.z0)), east = mod.filter(m => m.x0 > h.x1 + 8 && m.z0 < zN + 1.5);
    if (east.length) {
      const ex0 = Math.min(...east.map(m => m.x0)) + 1, ex1 = Math.max(...east.map(m => m.x1)) - 1, hz = zN - 8.6, hedge = new Geo(), cap = new Geo();
      for (let x = ex0; x < ex1 - 3; x += 8.6) { const xb = Math.min(ex1, x + 7.4); if (!clear(x, xb, hz - 0.55, hz + 0.55)) continue; hedge.box(x, xb, 0, 1.05, hz - 0.5, hz + 0.5); cap.box(x - 0.03, xb + 0.03, 1.05, 1.13, hz - 0.53, hz + 0.53); O.push({ x0: x, x1: xb, z0: hz - 0.5, z1: hz + 0.5, y0: 0, y1: 1.1 }); }
      if (!hedge.empty) add(hedge.mesh(new THREE.MeshStandardMaterial({ color: 0x1f3a26, roughness: 0.95, emissive: 0x0c1a10, emissiveIntensity: 0.7 })), cap.mesh(new THREE.MeshStandardMaterial({ color: 0xe8eef6, roughness: 0.95, emissive: 0x6a7388, emissiveIntensity: 0.6 })));
    }
  }
  add(stone.mesh(lime), fascia.mesh(white));
  if (!fins.empty) add(fins.mesh(finMat));
  if (!glow.empty) add(glow.mesh(glowMat));
  if (!warm.empty) add(warm.mesh(warmMat));
  if (!clearGlass.empty) { const m = clearGlass.mesh(new THREE.MeshBasicMaterial({ color: new THREE.Color(0.6, 0.8, 0.95), transparent: true, opacity: 0.28, side: THREE.DoubleSide, depthWrite: false })); m.renderOrder = 2; add(m); }

  // ------------------------------------------------------------ the bridgeway
  // From the tower's third floor it runs north and a little west, falling all the way, over
  // Monroe Street and on into the park: far longer than it is wide, and thin as a blade.
  {
    const A = new THREE.Vector3((tw.x0 + tw.x1) / 2, L3, tw.z0 - 0.1), E = new THREE.Vector3(A.x - 13, 0.5, B.z0 - 72);
    const len = A.distanceTo(E), HW = 1.9, g = new THREE.Group();
    g.position.copy(A); g.lookAt(E);                     // local +z runs down the bridge
    const deck = new Geo(), rails = new Geo(), mesh = new Geo();
    deck.box(-HW, HW, -0.12, 0, 0, len);                 // the walking surface
    // The hull under it: a shallow V down to a keel, which is what makes it read as a blade from below.
    deck.quad([-HW, -0.12, 0], [0, -0.85, 0], [0, -0.85, len], [-HW, -0.12, len], [-0.35, -0.94, 0]);
    deck.quad([HW, -0.12, 0], [0, -0.85, 0], [0, -0.85, len], [HW, -0.12, len], [0.35, -0.94, 0]);
    deck.quad([-HW, -0.12, len], [HW, -0.12, len], [0, -0.85, len], [0, -0.85, len], [0, 0, 1]);
    for (const s of [-1, 1]) {
      const x = s * (HW - 0.05);
      rails.box(x - 0.035, x + 0.035, 1.08, 1.15, 0, len);
      for (let z = 0; z <= len; z += 2.4) rails.box(x - 0.025, x + 0.025, 0, 1.08, z - 0.025, z + 0.025);
      mesh.quad([x, 0.05, 0], [x, 0.05, len], [x, 1.05, len], [x, 1.05, 0], [s, 0, 0], [[0, 0], [len / 0.5, 0], [len / 0.5, 1], [0, 1]]);
    }
    const net = tex(32, 32, (c) => { c.clearRect(0, 0, 32, 32); c.strokeStyle = 'rgba(225,230,238,0.75)'; c.lineWidth = 1; for (let i = 0; i <= 32; i += 8) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i, 32); c.stroke(); c.beginPath(); c.moveTo(0, i); c.lineTo(32, i); c.stroke(); } });
    const dm = deck.mesh(white), rm = rails.mesh(steel), nm = mesh.mesh(new THREE.MeshBasicMaterial({ map: net, transparent: true, side: THREE.DoubleSide, depthWrite: false, color: new THREE.Color(0.75, 0.8, 0.9) }));
    g.add(dm, rm, nm); g.updateMatrixWorld(true);
    for (const m of [dm, rm, nm]) m.updateMatrix();
    g.matrixAutoUpdate = false; g.updateMatrix(); group.add(g);
    // Legs: pairs of thin steel columns, splayed, wherever the ground is clear of the street and the tracks.
    const at = t => A.clone().lerp(E, t), M = plan.grounds.monroe;
    for (let z = A.z - 9; z > E.z + 10; z -= 21) {
      let zz = z; if (zz > M.z0 - 2.5 && zz < M.z1 + 2.5) zz = zz > (M.z0 + M.z1) / 2 ? M.z1 + 3 : M.z0 - 3;      // not in the road
      const t = (A.z - zz) / (A.z - E.z), p = at(t), top = p.y - 0.6;
      if (top < 1.2) continue;
      for (const s of [-1, 1]) {
        strut([p.x + s * 1.7, 0, zz], [p.x + s * 0.5, top, zz], 0.1, steel);
        if (zz > B.z0 - 1) O.push({ x0: p.x + s * 1.1 - (s > 0 ? 0.6 : 0.7), x1: p.x + s * 1.1 + (s > 0 ? 0.7 : 0.6), z0: zz - 0.14, z1: zz + 0.14, y0: 0, y1: Math.min(top, 1.6) });
      }
    }
  }

  // ------------------------------------------------------------ the flying carpet
  // A flat white sheet of fine blades over the gallery pavilion (the part of the wing east of the
  // court), wider than the building under it, held well clear of the roof on thin white columns.
  {
    const east = mod.filter(m => m.x0 > h.x1 - 1 && m.z1 < h.z0 + 45 && m.top > 15);
    const src = east.length ? east : mod;
    const bx0 = Math.min(...src.map(m => m.x0)), bx1 = Math.max(...src.map(m => m.x1)), bz0 = Math.min(...src.map(m => m.z0)), bz1 = Math.max(...src.map(m => m.z1));
    const roof = Math.max(...src.map(m => m.top), plan.massOf[h.id] ? plan.massOf[h.id].top : 0);
    const x0 = bx0 - 6.5, x1 = bx1 + 6.5, z0 = bz0 - 9.5, z1 = bz1 + 7, y = Math.max(22.4, roof + 2.6);      // 22.4 m in the architect's section
    const bt = blades(); bt.repeat.set((x1 - x0) / 1.2, (z1 - z0) / 6);
    const sheet = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0), new THREE.MeshBasicMaterial({ map: bt, transparent: true, side: THREE.DoubleSide, depthWrite: false, color: new THREE.Color(0.72, 0.77, 0.9), fog: false }));
    sheet.rotation.x = -Math.PI / 2; sheet.position.set((x0 + x1) / 2, y, (z0 + z1) / 2); sheet.renderOrder = 3; add(sheet);
    const fr = new Geo(), t = 0.09;
    fr.box(x0, x1, y - t, y + t, z0 - 0.12, z0); fr.box(x0, x1, y - t, y + t, z1, z1 + 0.12); fr.box(x0 - 0.12, x0, y - t, y + t, z0, z1); fr.box(x1, x1 + 0.12, y - t, y + t, z0, z1);
    // The beams the blades sit on, running east and west under them, and one spine each way.
    const nb = Math.max(3, Math.round((z1 - z0) / 4.2)); for (let i = 1; i < nb; i++) { const z = z0 + ((z1 - z0) * i) / nb; fr.box(x0, x1, y - 0.42, y - 0.08, z - 0.05, z + 0.05); }
    const nx = Math.max(3, Math.round((x1 - x0) / 7.5)); for (let i = 1; i < nx; i++) { const x = x0 + ((x1 - x0) * i) / nx; fr.box(x - 0.09, x + 0.09, y - 0.72, y - 0.42, z0, z1); }
    add(fr.mesh(white));
    // Columns: a row down each long side and one across each end, each standing on whatever is under it.
    const cols = [];
    for (let i = 0; i <= 4; i++) { const x = x0 + 2.5 + ((x1 - x0 - 5) * i) / 4; cols.push([x, z0 + 4.4], [x, z1 - 2.2]); }
    for (const z of [z0 + (z1 - z0) / 3, z0 + (2 * (z1 - z0)) / 3]) cols.push([x0 + 2.5, z], [x1 - 2.5, z]);
    for (const [x, z] of cols) {
      const foot = tallest(x, z);
      strut([x, foot, z], [x, y - 0.72, z], 0.13, white);
      if (!foot) O.push({ x0: x - 0.14, x1: x + 0.14, z0: z - 0.14, z1: z + 0.14, y0: 0, y1: y });
    }
  }
  void dark;
}
