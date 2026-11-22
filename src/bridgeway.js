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
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { landable } from './plan.js';
import { frostHedges, hedgeMaterial } from './frost.js';

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

  // The west pavilion, the stair tower against its north end, and beside the tower the glass lift (wingplay.js): its
  // shaft stands clear of the north face, which is drawn round it.
  const wp = mod.filter(m => m.room.use === 'terrace').sort((a, b) => b.top - a.top)[0] || mod.slice().sort((a, b) => a.x0 - b.x0)[0];
  const tw = { x0: (wp.x0 + wp.x1) / 2 - 3.4, x1: (wp.x0 + wp.x1) / 2 + 3.4, z0: wp.z0 - 5.4, z1: wp.z0 - 0.05, top: wp.top + 0.8 }, L3 = 11.3;
  const lift = (() => {
    const x0 = tw.x1 + 0.6, x1 = tw.x1 + 2.4, here = mod.filter(m => m.x1 > x0 && m.x0 < x1 && m.z0 < wp.z0 + 1);
    const face = Math.min(wp.z0, ...here.map(m => m.z0)) - 0.07, z1 = face - 0.15;      // 15 cm off the glass of the face
    return { x0, x1, z0: z1 - 1.8, z1, face };
  })();
  // A stretch [a, b] with the shaft (and a hand's breadth either side) taken out of it.
  const cx0 = lift.x0 - 0.12, cx1 = lift.x1 + 0.12;
  const besideLift = (a, b) => (b <= cx0 || a >= cx1) ? [[a, b]] : [[a, Math.min(b, cx0)], [Math.max(a, cx1), b]].filter(([p, q]) => q - p > 0.05);

  // ------------------------------------------------------------ the north face
  // Read off the plan: along the wing's north side, which block stands furthest north at each
  // metre, and how tall. Each stretch gets glass from the ground to the eaves, storey by storey,
  // between limestone piers. Where the lift runs up it the glass carries on behind the shaft, but
  // the fins, the floor edges and the piers stop either side of it.
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
      const parts = besideLift(r.x0, r.x1);
      for (const [a, b] of parts) fascia.box(a, b, 0, 0.14, z - 0.1, z + 0.02);
      for (let x = r.x0 + 2; x < r.x1 - 1; x += 2) if (x + 0.03 <= cx0 || x - 0.03 >= cx1) fascia.box(x - 0.03, x + 0.03, 0.14, g1, z - 0.06, z);
      if (tall) {
        // Above it, two tall tiers of glass glowing softly behind a screen of thin white fins, with a rail between.
        const yA = 5.3, yB = r.top - 0.45, mid = (yA + yB) / 2, zf = z - 0.34;
        glow.quad([r.x1, yA, z], [r.x0, yA, z], [r.x0, yB, z], [r.x1, yB, z], n, [[0, 0], [w / 7, 0], [w / 7, 1], [0, 1]]);
        for (const [a, b] of parts) {
          fins.quad([b, yA - 0.15, zf], [a, yA - 0.15, zf], [a, yB + 0.9, zf], [b, yB + 0.9, zf], n, [[(a - r.x0) / 1.9, 0], [(b - r.x0) / 1.9, 0], [(b - r.x0) / 1.9, 1], [(a - r.x0) / 1.9, 1]]);
          fascia.box(a, b, 4.85, yA, z - 0.42, z + 0.02);                 // the edge of the first floor, and the foot of the screen
          fascia.box(a, b, mid - 0.1, mid + 0.1, zf - 0.05, z);
          fascia.box(a, b, yB, yB + 0.12, zf - 0.05, z);
        }
      }
      for (const [a, b] of besideLift(r.x0 - 0.1, r.x1 + 0.1)) fascia.box(a, b, r.top - 0.45, r.top + 0.25, z - 0.18, z + 0.02);
      // Piers: broad slabs of limestone, one at each end of the stretch and one every bay between (none in the lift's way).
      for (let i = 0; i <= bays; i++) { const x = r.x0 + (w * i) / bays, hw = tall ? 1.25 : 0.5, a = Math.max(r.x0 - 0.5, x - hw), b = Math.min(r.x1 + 0.5, x + hw); if (b <= cx0 || a >= cx1) stone.box(a, b, 0, r.top + 0.35, z - 0.5, z + 0.04, 3.2); }
    });
  }

  // ------------------------------------------------------------ the west pavilion
  // Its north end carries the terrace: glass boxes stacked on the railway side, and on the roof
  // a screen of pink glass.
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
      if (street && a[1] === pz0 && b[1] === pz0) {
        // The north side, with a doorway in it where the lift's step comes across from the shaft (wingplay.js).
        for (const [p, q] of besideLift(Math.min(a[0], b[0]), Math.max(a[0], b[0]))) {
          pink.quad([p, py - 0.5, pz0], [q, py - 0.5, pz0], [q, py + ph + 0.4, pz0], [p, py + ph + 0.4, pz0], nn);
          fins.quad([p, py - 0.6, pz0 - o], [q, py - 0.6, pz0 - o], [q, py + ph + 1.1, pz0 - o], [p, py + ph + 1.1, pz0 - o], nn, [[0, 0], [(q - p) / 1.9, 0], [(q - p) / 1.9, 1], [0, 1]]);
        }
        if (cx0 > a[0] && cx1 < b[0]) for (const x of [cx0, cx1]) fascia.box(x - 0.05, x + 0.05, py - 0.6, py + ph + 1.1, pz0 - o - 0.05, pz0 + 0.05);      // the doorway's jambs
      } else if (street) {
        pink.quad([a[0], py - 0.5, a[1]], [b[0], py - 0.5, b[1]], [b[0], py + ph + 0.4, b[1]], [a[0], py + ph + 0.4, a[1]], nn);
        // the fins of the screen below run on up past it
        fins.quad([a[0] + nn[0] * o, py - 0.6, a[1] + nn[2] * o], [b[0] + nn[0] * o, py - 0.6, b[1] + nn[2] * o], [b[0] + nn[0] * o, py + ph + 1.1, b[1] + nn[2] * o], [a[0] + nn[0] * o, py + ph + 1.1, a[1] + nn[2] * o], nn, [[0, 0], [len / 1.9, 0], [len / 1.9, 1], [0, 1]]);
      } else clearG.quad([a[0], py, a[1]], [b[0], py, b[1]], [b[0], py + 1.15, b[1]], [a[0], py + 1.15, a[1]], nn);
    }
    // The glass is solid, as drawn: the screen on the street sides, the clear rail on the others, with the lift's doorway
    // left open. (Before, the toy drove straight through it and off the roof.)
    { const th = 0.08, tall = py + ph + 0.4, low = py + 1.15;
      for (const [p, q] of besideLift(px0, px1)) O.push({ x0: p, x1: q, z0: pz0 - th, z1: pz0, y0: py - 0.3, y1: tall });
      O.push({ x0: px0 - th, x1: px0, z0: pz0 - th, z1: pz1 + th, y0: py - 0.3, y1: tall });
      O.push({ x0: px1, x1: px1 + th, z0: pz0 - th, z1: pz1 + th, y0: py - 0.3, y1: low });
      O.push({ x0: px0 - th, x1: px1 + th, z0: pz1, z1: pz1 + th, y0: py - 0.3, y1: low }); }
    for (let x = px0; x <= px1 + 0.01; x += (px1 - px0) / 6) rail.box(x - 0.03, x + 0.03, py, py + 1.2, pz1 - 0.03, pz1 + 0.03);
    for (let z = pz0; z <= pz1 + 0.01; z += (pz1 - pz0) / 8) rail.box(px1 - 0.03, px1 + 0.03, py, py + 1.2, z - 0.03, z + 0.03);
    const pm = pink.mesh(new THREE.MeshBasicMaterial({ color: new THREE.Color(1.5, 0.22, 0.95), transparent: true, opacity: 0.7, side: THREE.DoubleSide, depthWrite: false })); pm.renderOrder = 2;
    const cm = clearG.mesh(new THREE.MeshBasicMaterial({ color: new THREE.Color(0.55, 0.75, 0.9), transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false })); cm.renderOrder = 2;
    add(pm, cm, rail.mesh(white));

    // The terrace itself: paving, a white pergola frame over it, and four things to walk round.
    // (The sculptures are made up for the game: nobody's work.)
    {
      const st = slabTex(), pav = new Geo(), perg = new Geo(), y = py + 0.004;      // (flush with what the toy drives on: at +4 cm its wheels looked sunk in it)
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
        wedge(bx, bx + 1.1, 1.25, 0.25); wedge(bx + 1.1, bx + 2.1, 0.25, 0.95); wedge(bx + 2.1, bx + 3.0, 0.95, 0.03);
        add(zg.mesh(red));
        // You can drive on it: each wedge is a ramp, exactly as drawn (and off the high end, a drop).
        const RS = plan.roofs || plan.surfaces;
        for (const [x0, x1, hA, hB] of [[bx, bx + 1.1, 1.25, 0.25], [bx + 1.1, bx + 2.1, 0.25, 0.95], [bx + 2.1, bx + 3.0, 0.95, 0.03]])
          RS.push({ skin: 'stone', x0, x1, z0: bz, z1: bz + wd, axis: 'x', h0: py + hA, h1: py + hB, base: py, roof: true, fixed: true }); }
      // Two boulders, smooth enough to drive over: each is drawn from the same height the toy feels (a mound with a
      // little wobble round its rim), so the wheels sit on the stone, never in it.
      for (const [dx, dz, sc, seed] of [[2.6, 2.2, 0.85, 11], [-1.2, 4.6, 0.7, 23]]) {
        const bx0 = cx + dx, bz0 = cz + dz, R = sc * 1.3, H = sc * 0.95, ph = seed * 1.7;
        const rimAt = a => R * (1 + 0.12 * Math.sin(3 * a + ph) + 0.07 * Math.sin(5 * a - ph * 0.6));
        const fn = (x, z) => { const ddx = x - bx0, ddz = z - bz0, d = Math.hypot(ddx, ddz) / rimAt(Math.atan2(ddz, ddx)); return d >= 1 ? py : py + H * (Math.cos(d * Math.PI) + 1) / 2; };
        const NR = 7, NA = 18, pos = [], idx = [];
        pos.push(bx0, fn(bx0, bz0), bz0);
        for (let ri = 1; ri <= NR; ri++) for (let ai = 0; ai < NA; ai++) { const a = ai / NA * Math.PI * 2, rr = rimAt(a) * ri / NR * (ri === NR ? 0.999 : 1), x = bx0 + Math.cos(a) * rr, z = bz0 + Math.sin(a) * rr; pos.push(x, fn(x, z) + (ri === NR ? -0.01 : 0), z); }
        for (let ai = 0; ai < NA; ai++) idx.push(0, 1 + (ai + 1) % NA, 1 + ai);
        for (let ri = 1; ri < NR; ri++) for (let ai = 0; ai < NA; ai++) { const a = 1 + (ri - 1) * NA + ai, b = 1 + (ri - 1) * NA + (ai + 1) % NA, c = a + NA, d = b + NA; idx.push(a, b, c, b, d, c); }
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
        add(new THREE.Mesh(g, rock));
        (plan.roofs || plan.surfaces).push({ skin: 'stone', x0: bx0 - R * 1.2, x1: bx0 + R * 1.2, z0: bz0 - R * 1.2, z1: bz0 + R * 1.2, axis: null, fn, h0: py, h1: py + H, base: py, roof: true, fixed: true });
      }
      museum.mw = Object.assign(museum.mw || {}, { terrace: { x0: px0, x1: px1, z0: pz0, z1: pz1, y: py } });      // (for the fireworks: src/fireworks.js)
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
    landable(plan, c0, c1, cz0 - 1.5, hm.z0, 0.07);      // drawn a step proud of the snow, so the wheels go up onto it rather than into it
    add(apron.mesh(new THREE.MeshStandardMaterial({ map: st, roughness: 0.85, emissiveMap: st, emissive: new THREE.Color(0.5, 0.46, 0.4), emissiveIntensity: 0.6 })));

    // The wall with the name on it, before the west pavilion.
    const wz = Math.min(...mod.map(m => m.z0)) - 9.2, wx0 = wp.x0 - 3.5, wx1 = wp.x1 - 3.4, wh = 1.5;
    if (clear(wx0, wx1, wz - 0.3, wz + 0.3)) {
      stone.box(wx0, wx1, 0, wh, wz - 0.28, wz + 0.28, 3.2); fascia.box(wx0 - 0.05, wx1 + 0.05, wh, wh + 0.07, wz - 0.32, wz + 0.32);
      const name = tex(2048, 128, (c, w, hh) => { c.clearRect(0, 0, w, hh); c.fillStyle = '#f4f1e6'; c.font = '600 74px "Helvetica Neue", Arial, sans-serif'; c.textBaseline = 'middle'; c.textAlign = 'left'; const t = 'THE ART INSTITVTE OF CHICAGO'; let tw = 0; for (const ch of t) tw += c.measureText(ch).width + 9; let x = (w - tw) / 2; for (const ch of t) { c.fillText(ch, x, hh / 2 + 4); x += c.measureText(ch).width + 9; } });
      name.wrapS = name.wrapT = THREE.ClampToEdgeWrapping;
      const nm = new THREE.Mesh(new THREE.PlaneGeometry(wx1 - wx0 - 1.2, (wx1 - wx0 - 1.2) / 16), new THREE.MeshBasicMaterial({ map: name, transparent: true, depthWrite: false, color: new THREE.Color(0.9, 0.9, 0.95) }));
      nm.position.set((wx0 + wx1) / 2, wh * 0.56, wz - 0.3); nm.rotation.y = Math.PI; add(nm);
      landable(plan, wx0 - 0.05, wx1 + 0.05, wz - 0.32, wz + 0.32, wh + 0.07);      // its coping is a top to land on
    }
    // The hedge: unbroken wherever the ground is free, clipped round only where something stands in its way.
    const zN = Math.min(...mod.map(q => q.z0)), east = mod.filter(m => m.x0 > h.x1 + 8 && m.z0 < zN + 1.5);
    if (east.length) {
      const ex0 = Math.min(...east.map(m => m.x0)) + 1, ex1 = Math.max(...east.map(m => m.x1)) - 1, hz = zN - 8.6, hedge = new Geo(), step = 0.5, runs = [];
      let start = null;
      for (let x = ex0; x < ex1 + 1e-6; x += step) {
        const xb = Math.min(ex1, x + step), ok = xb - x > 1e-6 && clear(x, xb, hz - 0.55, hz + 0.55);
        if (ok && start === null) start = x;
        if ((!ok || xb >= ex1) && start !== null) { const end = ok ? xb : x; if (end - start >= 2) runs.push({ x0: start, x1: end, z0: hz - 0.5, z1: hz + 0.5 }); start = null; }
      }
      for (const q of frostHedges(hedge, runs, 0, 1.05)) landable(plan, q.x0, q.x1, q.z0, q.z1, 1.07, 0, 0.05);
      if (!hedge.empty) add(hedge.mesh(hedgeMaterial()));
    }
  }
  add(stone.mesh(lime), fascia.mesh(white));
  if (!fins.empty) add(fins.mesh(finMat));
  if (!glow.empty) add(glow.mesh(glowMat));
  if (!warm.empty) add(warm.mesh(warmMat));
  if (!clearGlass.empty) { const m = clearGlass.mesh(new THREE.MeshBasicMaterial({ color: new THREE.Color(0.6, 0.8, 0.95), transparent: true, opacity: 0.28, side: THREE.DoubleSide, depthWrite: false })); m.renderOrder = 2; add(m); }

  // ------------------------------------------------------------ the bridgeway
  // From the tower's third floor it runs north and a little west, falling all the way, over Monroe Street and on into
  // the park. Drawn from what is written of the real one (Renzo Piano, 2009; 620 ft long, 15 ft wide, a 5 per cent
  // grade): a steel box girder shaped like a racing yacht's hull, painted white, its bottom flange a broad curved plate
  // seen from below; deepest over the street (4 ft 6 in) and thinner elsewhere (2 ft 2 in), with prow-shaped ends; an
  // aluminium plank deck, heated so the snow melts off it; railings 42 in high of steel posts over stainless mesh, a
  // wide wooden handrail, and LEDs along the handrails at night. Here it is shorter and steeper, to fit the grounds.
  //
  // The walking line is the one wingplay.js lays its drivable slabs on (a straight slope from E to the top landing);
  // the deck is drawn on exactly that line, and everything under and beside it follows from it.
  {
    const A = new THREE.Vector3((tw.x0 + tw.x1) / 2, L3, tw.z0 - 0.1), E = new THREE.Vector3(A.x - 13, 0.5, B.z0 - 72);
    const HW = 1.9, top = A.z - 0.6, w = HW - 0.15, M = plan.grounds.monroe, zM = (M.z0 + M.z1) / 2;
    const cxAt = z => E.x + (A.x - E.x) * (z - E.z) / (A.z - E.z);
    const hAt = z => E.y + (L3 - E.y) * (Math.min(top, z) - E.z) / (top - E.z);
    const sm = t => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };
    // The girder's depth under the deck, and its width: deepest and widest over the street, thinning to a prow at the park end.
    const depth = z => { const p = sm((z - E.z) / 3.4); return 0.34 + (0.62 + 0.4 * Math.exp(-(((z - zM) / 22) ** 2)) - 0.34) * p; };
    const outer = z => { const p = sm((z - E.z) / 3.4); return w + 0.03 + (0.25 + 0.12 * Math.exp(-(((z - zM) / 26) ** 2))) * p; };
    // The curved bottom plate: from the blade edge (s = 0) to the keel (s = 1), falling fast at the edge and flat beneath.
    const hull = (z, s) => { const D = depth(z); return -0.1 - (D - 0.1) * (1 - (1 - s) ** 2.2); };
    const zEnd = tw.z0 - 0.42;
    const eastEnd = tw.z0 - 2.6;                                          // where the landing opens off the deck's east side (wingplay.js)                                            // the girder runs on under the landing to the tower's piers
    museum.mw = Object.assign(museum.mw || {}, { tw, L3, A: A.clone(), E: E.clone(), HW, lift, deck: { z0: E.z, z1: top, w, cx: cxAt, h: hAt, depth, outer, hull } });      // for the things to do on and round it (wingplay.js, bridgeplay.js)

    const stations = []; for (let z = E.z; z < zEnd - 0.01; z += 1) stations.push(z); stations.push(zEnd);
    // A strip lofted along the bridge: prof(z) gives its section as [x offset from the centre line, y above the deck].
    // Its front is to the right of the way the section runs, looking down the bridge towards the park: a section run
    // from east to west faces up, one run upwards faces east.
    const loft = (prof, vScale = 1, zMax = null) => {
      const pos = [], uv = [], idx = [], st = zMax == null ? stations : [...stations.filter(z => z < zMax - 0.01), zMax]; let n = 0;
      for (let i = 0; i < st.length; i++) {
        const z = st[i], cx = cxAt(z), h = hAt(z), P = prof(z); n = P.length;
        let u = 0; P.forEach(([x, y], j) => { if (j) u += Math.hypot(x - P[j - 1][0], y - P[j - 1][1]); pos.push(cx + x, h + y, z); uv.push(u, (z - E.z) / vScale); });
        if (i) for (let j = 0; j < n - 1; j++) { const a = (i - 1) * n + j, b = a + 1, c = i * n + j, d = c + 1; idx.push(a, b, d, a, d, c); }
      }
      const gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); gg.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); gg.setIndex(idx); gg.computeVertexNormals();
      return gg;
    };
    const both = f => z => { const P = f(z), L = P.map(([x, y]) => [-x, y]).reverse(); return L.concat(P); };
    const put = (geos, mat, order) => { const m = new THREE.Mesh(geos.length > 1 ? mergeGeometries(geos) : geos[0], mat); if (order) m.renderOrder = order; add(m); return m; };
    const K = 7, curve = z => { const W = outer(z), P = []; for (let k = K; k >= 0; k--) { const s = 1 - k / K; P.push([W * (1 - s), hull(z, s)]); } return P; };      // from the east edge in to the keel

    // The girder: the curved plate under the deck, the thin blade of its edge, and the ledge outside the railing.
    // Each face lofted on its own, so the edges stay crisp.
    const hullG = loft(z => { const P = curve(z); return P.map(([x, y]) => [-x, y]).concat(P.slice(0, -1).reverse()); }, 4);      // west edge, keel, east edge: facing down
    // (East of the deck at the top the landing is laid level with it, so there the ledge sinks to just under the landing.)
    const ly = (z, s) => (s > 0 && z > eastEnd ? -0.012 : 0.05);
    const edgeG = [-1, 1].map(s => loft(z => { const W = outer(z); return s > 0 ? [[W, -0.1], [W, ly(z, s)]] : [[-W, ly(z, s)], [-W, -0.1]]; }));
    const ledgeG = [-1, 1].map(s => loft(z => { const W = outer(z); return s > 0 ? [[W, ly(z, s)], [w, ly(z, s)]] : [[-w, ly(z, s)], [-W, ly(z, s)]]; }));
    const lipG = [-1, 1].map(s => loft(z => s > 0 ? [[w, ly(z, s)], [w, Math.min(0, ly(z, s))]] : [[-w, 0], [-w, ly(z, s)]], 1, s > 0 ? eastEnd : null));
    // The plate underneath: white steel, lit from within most at its edges and least along the keel, so its curve
    // reads from the street as a pale hull shading to grey along the middle.
    {
      const P = hullG.attributes.position, col = [];
      for (let i = 0; i < P.count; i++) { const z = P.getZ(i), f = Math.min(1, Math.abs(P.getX(i) - cxAt(z)) / outer(z)), b = 0.5 + 0.5 * f * f; col.push(b, b, b * 1.02); }
      hullG.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    }
    const hullMat = new THREE.MeshStandardMaterial({ color: 0xf2f4f8, vertexColors: true, roughness: 0.45, metalness: 0.1 });
    hullMat.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance += diffuseColor.rgb * vec3(0.42, 0.45, 0.52);'); };
    hullMat.customProgramCacheKey = () => 'bridgeway-hull';
    put([hullG], hullMat);
    put([...edgeG, ...ledgeG, ...lipG], white);
    // The ends: the prow in the park, and the girder's end under the landing.
    {
      const cap = new Geo();
      for (const [z, n] of [[E.z, -1], [zEnd, 1]]) {
        const t = n > 0 ? -0.012 : 0.05, P = [...curve(z)].reverse().concat([[outer(z), t], [0, t]]), cx = cxAt(z), hh = hAt(z);
        for (const s of [-1, 1]) for (let j = 0; j < P.length - 2; j++) { const a = P[j], b = P[j + 1]; cap.quad([cx + s * a[0], hh + a[1], z], [cx + s * b[0], hh + b[1], z], [cx, hh + t, z], [cx, hh + t, z], [0, 0, n]); }
      }
      add(cap.mesh(white));
    }
    // The deck: aluminium planks laid across, 15 cm each, a dark joint and a bright arris between them, each plank a
    // shade off the next and brushed along its length. Mipmapped and filtered at a slant, so the joints run on down
    // the bridge as fine lines and do not crawl.
    const DT = 1.2;
    const plank = tex(256, 256, (c, W, H) => {
      const r = rng(11), n = 8, ph = H / n;
      for (let i = 0; i < n; i++) {
        const t = 150 + Math.round((r() - 0.5) * 18);
        c.fillStyle = `rgb(${t - 6},${t},${t + 10})`; c.fillRect(0, i * ph, W, ph);
        for (let k = 0; k < 46; k++) { c.fillStyle = r() < 0.5 ? `rgba(255,255,255,${0.03 + r() * 0.05})` : `rgba(30,36,46,${0.03 + r() * 0.05})`; c.fillRect(r() * W, i * ph + 2 + r() * (ph - 4), 16 + r() * 90, 1); }
        c.fillStyle = 'rgba(18,22,30,0.9)'; c.fillRect(0, i * ph, W, 2);
        c.fillStyle = 'rgba(236,240,248,0.32)'; c.fillRect(0, i * ph + 2, W, 1);
      }
    });
    plank.anisotropy = 8; plank.repeat.set(1 / DT, 1);
    put([loft(z => [[w, 0.002], [-w, 0.002]], DT, top)], new THREE.MeshStandardMaterial({ map: plank, roughness: 0.42, metalness: 0.35, emissiveMap: plank, emissive: new THREE.Color(0.46, 0.49, 0.56), emissiveIntensity: 0.4 }));

    // The railings, 42 in high: slim white steel posts leaning a little outwards every 1.5 m, a flat bar along their
    // feet and a steel cap along their heads, a fine stainless mesh between (1 cm squares, mostly air: a silver veil
    // from further off), the broad wooden handrail on the cap with a warm LED strip under its inner edge, and the light
    // of the LEDs on the mesh below it and on the planks. Snow lies on the handrail, on the ledge outside, and in a thin
    // drift along the foot of the mesh inside.
    // (Collision is wingplay.js's: a wall at the deck's edge, 1.1 m high. The east railing stops where the landing opens off it.)
    const RH = 1.07, lean = 0.1, ePost = 1.8, MT = 0.16;
    const railLoft = (s, f, vs) => loft(f, vs, s > 0 ? eastEnd : null);      // (the east one stops where the landing opens off the deck)
    const meshTex = tex(128, 128, (c, W, H) => { c.clearRect(0, 0, W, H); c.fillStyle = 'rgba(238,243,250,0.95)'; for (let i = 0; i < W; i += 8) c.fillRect(i, 0, 1, H); for (let j = 0; j < H; j += 8) c.fillRect(0, j, W, 1); });
    meshTex.anisotropy = 8; meshTex.repeat.set(1 / MT, 1);
    const grain = tex(64, 256, (c, W, H) => { const r = rng(5); c.fillStyle = '#8f5b3a'; c.fillRect(0, 0, W, H); for (let k = 0; k < 70; k++) { c.fillStyle = r() < 0.6 ? `rgba(60,30,14,${0.08 + r() * 0.14})` : `rgba(230,170,120,${0.05 + r() * 0.08})`; c.fillRect(r() * W, 0, 1 + r() * 2, H); } });
    grain.anisotropy = 8; grain.repeat.set(1 / 0.2, 1);
    const glowTx = tex(64, 8, (c, W, H) => { const g = c.createLinearGradient(0, 0, W, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(255,255,255,1)'); c.fillStyle = g; c.fillRect(0, 0, W, H); });
    glowTx.wrapS = glowTx.wrapT = THREE.ClampToEdgeWrapping;
    const netG = [], frameG = [], woodG = [], ledG = [], snowG = [], poolG = [], haloG = [];
    const lx = (s, y) => s * (ePost + lean * y / RH);      // the line of the posts, leaning out as it climbs
    for (const s of [-1, 1]) {
      const yT = RH - 0.075, xt = lx(s, yT), xb = lx(s, 0.05);
      const pair = (p, q) => (s > 0 ? [p, q] : [q, p]);
      netG.push(railLoft(s, () => pair([xb, 0.05], [xt, yT]), MT));
      // the flat bar at the foot and the cap: thin white steel
      frameG.push(railLoft(s, () => pair([xb, 0.05], [xb, 0.09])), railLoft(s, () => pair([xt - s * 0.012, yT], [xt - s * 0.012, RH - 0.045])), railLoft(s, () => pair([xt + s * 0.012, RH - 0.045], [xt + s * 0.012, yT])));
      // the handrail: 8 in of wood, 4 cm thick, eased at its edges, its inner edge well over the deck
      const a = xt - s * 0.13, b = xt + s * 0.07, y0 = RH - 0.045, y1 = RH - 0.005, e = 0.008;
      woodG.push(railLoft(s, () => pair([a + s * e, y1], [a, y1 - e]), 1), railLoft(s, () => pair([b - s * e, y1], [a + s * e, y1]), 1), railLoft(s, () => pair([b, y1 - e], [b - s * e, y1]), 1));
      woodG.push(railLoft(s, () => pair([a, y1 - e], [a, y0]), 1), railLoft(s, () => pair([b, y0], [b, y1 - e]), 1), railLoft(s, () => pair([a, y0], [b, y0]), 1));
      // the LED strip under the inner edge, and the warm light it throws down the mesh
      ledG.push(railLoft(s, () => pair([a + s * 0.012, y0 - 0.002], [a + s * 0.03, y0 - 0.002])));
      haloG.push(railLoft(s, () => pair([lx(s, 0.62) - s * 0.006, 0.62], [lx(s, yT) - s * 0.006, yT]), 1));
      // snow along the handrail's top, on the ledge outside banked against the mesh, and a thin drift at the foot inside
      const sa = a + s * 0.03, sb = b - s * 0.03;
      const ord = P => (s > 0 ? P : P.slice().reverse());
      snowG.push(railLoft(s, () => ord([[sb, y1 - 0.001], [sb - s * 0.02, y1 + 0.02], [sa + s * 0.02, y1 + 0.018], [sa, y1 - 0.001]]), 2));
      snowG.push(loft(z => { const W = s * (outer(z) - 0.02), xa = xb + s * 0.012; return ord([[W, 0.06], [(xa + W) / 2, 0.1], [xa + s * 0.03, 0.11], [xa, 0.06]]); }, 2, s > 0 ? eastEnd : null));
      snowG.push(railLoft(s, () => ord([[xb - s * 0.004, 0.085], [s * w, 0.052], [s * (w - 0.04), 0.022], [s * (w - 0.11), 0.003]]), 2));
      // and the pool of light on the planks
      poolG.push(railLoft(s, () => ord([[s * (w - 0.1), 0.006], [s * (w - 0.7), 0.006]]), 1));
    }
    const net = put(netG, new THREE.MeshStandardMaterial({ map: meshTex, color: 0xdfe6ee, transparent: true, depthWrite: false, side: THREE.DoubleSide, roughness: 0.35, metalness: 0.45, emissiveMap: meshTex, emissive: new THREE.Color(0.5, 0.54, 0.62), emissiveIntensity: 0.55 }), 2);
    void net;
    const railWhite = new THREE.MeshStandardMaterial({ color: 0xeef1f5, roughness: 0.45, metalness: 0.2, emissive: 0x6a7184, emissiveIntensity: 0.7, side: THREE.DoubleSide });
    put(frameG, railWhite);
    put(woodG, new THREE.MeshStandardMaterial({ map: grain, roughness: 0.5, emissiveMap: grain, emissive: new THREE.Color(0.55, 0.42, 0.34), emissiveIntensity: 0.5 }));
    put(ledG, new THREE.MeshBasicMaterial({ color: new THREE.Color(1.5, 1.2, 0.8), side: THREE.DoubleSide }));
    const hm = put(haloG, new THREE.MeshBasicMaterial({ map: glowTx, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, color: new THREE.Color(0.3, 0.22, 0.12) }), 3);
    { const g0 = hm.geometry, uvA = g0.attributes.uv, P = g0.attributes.position; for (let i = 0; i < uvA.count; i++) uvA.setX(i, (P.getY(i) - hAt(P.getZ(i)) - 0.62) / (RH - 0.075 - 0.62)); uvA.needsUpdate = true; }
    const snowMap = museum.snowTex ? museum.snowTex.clone() : null; if (snowMap) { snowMap.needsUpdate = true; snowMap.repeat.set(1, 1); }
    put(snowG, new THREE.MeshStandardMaterial({ map: snowMap, color: 0xf4f7fc, roughness: 0.95, emissiveMap: snowMap, emissive: new THREE.Color(0.34, 0.38, 0.52), emissiveIntensity: 0.62 }));
    const poolTex = tex(64, 8, (c, W, H) => { const g = c.createLinearGradient(0, 0, W, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(255,255,255,1)'); c.fillStyle = g; c.fillRect(0, 0, W, H); });
    poolTex.wrapS = THREE.ClampToEdgeWrapping;
    // (u runs from the inner edge outwards on the east side, so the west strip's texture is turned round)
    const pm = put(poolG, new THREE.MeshBasicMaterial({ map: poolTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, color: new THREE.Color(0.4, 0.3, 0.17), polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }), 3);
    { const g0 = pm.geometry, uvA = g0.attributes.uv, P = g0.attributes.position; for (let i = 0; i < uvA.count; i++) uvA.setX(i, Math.abs(P.getX(i) - cxAt(P.getZ(i))) <= w - 0.4 ? 0 : 1); uvA.needsUpdate = true; }
    // The posts, one every 1.5 m, as one instanced mesh: flat bars, 2 cm by 5 cm, on the line the mesh leans on.
    {
      const at = [];
      for (const s of [-1, 1]) for (let z = E.z + 0.4; z < top; z += 1.5) if (!(s > 0 && z > eastEnd)) at.push([s, z]);
      if (at.length) {
        const ph = RH - 0.045 - 0.05, im = new THREE.InstancedMesh(new THREE.BoxGeometry(0.02, ph, 0.05), railWhite, at.length), M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), S1 = new THREE.Vector3(1, 1, 1), Z = new THREE.Vector3(0, 0, 1);
        at.forEach(([s, z], i) => { Q.setFromAxisAngle(Z, -s * Math.atan2(lean, RH)); const ym = 0.05 + ph / 2; V.set(cxAt(z) + lx(s, ym) - s * 0.012, hAt(z) + ym, z); im.setMatrixAt(i, M4.compose(V, Q, S1)); });
        im.frustumCulled = false; add(im);
      }
    }

    // The park end: the prow comes down onto a low limestone abutment, paved round, with two lamps to find it by.
    // (The deck there is too low to drive under, and the abutment is what stands in the way.)
    {
      const ab = new Geo(), z0 = E.z, z1 = E.z + 3.3;
      for (let z = z0; z < z1 - 0.01; z += 1.1) { const za = z, zb = Math.min(z1, z + 1.1), cx = cxAt((za + zb) / 2), yb = Math.min(hAt(za) + hull(za, 1), hAt(zb) + hull(zb, 1)) + 0.04; ab.box(cx - w, cx + w, 0, yb, za, zb, 3.2); O.push({ x0: cx - w, x1: cx + w, z0: za, z1: zb, y0: 0, y1: yb - 0.05 }); }
      add(ab.mesh(lime));
      const fx = cxAt(E.z), pz0 = E.z - 7.2, pz1 = E.z + 4;
      const pv = new Geo(), st = slabTex();
      pv.box(fx - 4.2, fx + 4.2, 0, 0.06, pz0, pz1, 2.4);
      add(pv.mesh(new THREE.MeshStandardMaterial({ map: st, roughness: 0.85, emissiveMap: st, emissive: new THREE.Color(0.5, 0.46, 0.4), emissiveIntensity: 0.6 })));
      plan.surfaces.push({ skin: 'stone', fixed: true, x0: fx - 4.2, x1: fx + 4.2, z0: pz0, z1: pz1, axis: null, h0: 0.06, h1: 0.06, base: 0 });
      (plan.paved = plan.paved || []).push({ x0: fx - 4.2, x1: fx + 4.2, z0: pz0, z1: pz1 });
      const lamp = new Geo(), glowL = new Geo();
      for (const s of [-1, 1]) { const x = fx + s * 3.4, z = E.z - 1.2; lamp.box(x - 0.07, x + 0.07, 0.06, 0.95, z - 0.07, z + 0.07); glowL.box(x - 0.075, x + 0.075, 0.75, 0.92, z - 0.075, z + 0.075); O.push({ x0: x - 0.09, x1: x + 0.09, z0: z - 0.09, z1: z + 0.09, y0: 0, y1: 0.95 }); }
      add(lamp.mesh(steel), glowL.mesh(new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 1.35, 0.95) })));
    }
    // The terrace end: the girder sits on a white steel bearing on the tower's piers, under the landing.
    {
      const be = new Geo(), cx = cxAt(zEnd), y = L3 - 0.3;
      be.box(cx - 1.2, cx + 1.2, y - 0.85, y - 0.05, zEnd - 0.05, tw.z0 - 0.4);
      add(be.mesh(white));
    }
    // Piers: four forked white columns in the park, none in the street. The main span leaps Monroe Street whole.
    {
      const piers = [], zA = M.z0 - 9, zB = E.z + 11;
      for (let i = 0; i < 4; i++) piers.push(zA + (zB - zA) * i / 3);
      museum.mw.piers = piers;
      for (const z of piers) {
        const cx = cxAt(z), h = hAt(z), yb = h + hull(z, 1), yf = yb * 0.62, arm = 0.8, ya = h + hull(z, 1 - arm / outer(z));
        const taper = (a, b, r0, r1) => { const d = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]), len = d.length(); const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, len, 10), white); m.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); add(m); };
        taper([cx, 0.1, z], [cx, yf, z], 0.17, 0.13);
        for (const s of [-1, 1]) taper([cx, yf - 0.05, z], [cx + s * arm, ya + 0.02, z], 0.12, 0.07);
        const foot = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.1, 0.7), lime); foot.position.set(cx, 0.05, z); add(foot);
        O.push({ x0: cx - 0.35, x1: cx + 0.35, z0: z - 0.35, z1: z + 0.35, y0: 0, y1: 0.1 }, { x0: cx - 0.17, x1: cx + 0.17, z0: z - 0.17, z1: z + 0.17, y0: 0, y1: yf });
      }
    }
    // Where the girder is deeper than the drivable slab under the deck (over the street), something flying under it meets the steel.
    for (let z = E.z; z < top - 1; z += 1) {
      const D = depth(z + 0.5), lo = 0.1 + (D - 0.1) * (1 - 0.5 ** 2.2);
      if (lo < 0.62) continue;
      const cx = cxAt(z + 0.5), hh = Math.min(hAt(z), hAt(z + 1));
      O.push({ x0: cx - outer(z) * 0.5, x1: cx + outer(z) * 0.5, z0: z, z1: z + 1, y0: hh - lo + 0.03, y1: hh - 0.6 });
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
    museum.mw = Object.assign(museum.mw || {}, { shade: { x0, x1, z0, z1, y } });
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
