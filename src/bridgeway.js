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

export function buildBridgeway(museum, plan) {
  const group = museum.group, B = plan.bounds, h = plan.hall;
  const add = (...m) => { for (const x of m) { x.matrixAutoUpdate = false; x.updateMatrix(); group.add(x); } };
  const O = plan.obstacles;
  const white = new THREE.MeshStandardMaterial({ color: 0xeef1f5, roughness: 0.5, emissive: 0x6a7184, emissiveIntensity: 0.72 });
  const steel = new THREE.MeshStandardMaterial({ color: 0xc9ced6, roughness: 0.45, metalness: 0.3, emissive: 0x4c5262, emissiveIntensity: 0.7 });
  const lime = new THREE.MeshStandardMaterial({ color: 0xd9d3c5, roughness: 0.9, emissive: 0x77747c, emissiveIntensity: 0.72 });
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
    const floors = [0, 5.2, 11.3];
    runs.forEach((r, k) => {
      if (r.x1 - r.x0 < 1.5) return;
      const z = r.z - 0.07, n = [0, 0, -1], w = r.x1 - r.x0, bays = Math.max(1, Math.round(w / 12));
      const glass = new Geo();
      for (let i = 0; i < floors.length; i++) {
        const y0 = floors[i] + (i ? 0.25 : 0.12), y1 = Math.min(r.top - 0.45, (floors[i + 1] ?? r.top) - 0.25);
        if (y1 - y0 < 1) continue;
        glass.quad([r.x1, y0, z], [r.x0, y0, z], [r.x0, y1, z], [r.x1, y1, z], n, [[0, 0], [bays, 0], [bays, 1], [0, 1]]);
        fascia.box(r.x0, r.x1, y1, y1 + 0.5, z - 0.1, z + 0.02);                // the floor's edge, in white metal
      }
      fascia.box(r.x0 - 0.1, r.x1 + 0.1, r.top - 0.45, r.top + 0.25, z - 0.18, z + 0.02);
      fascia.box(r.x0, r.x1, 0, 0.14, z - 0.1, z + 0.02);
      add(glass.mesh(new THREE.MeshBasicMaterial({ map: curtain(101 + k * 17), color: new THREE.Color(0.8, 0.85, 0.95) })));
      // Piers: one at each end of the stretch and one every bay between.
      for (let i = 0; i <= bays; i++) { const x = r.x0 + (w * i) / bays; stone.box(x - 0.5, x + 0.5, 0, r.top + 0.35, z - 0.42, z + 0.04, 1.4); }
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
    const pink = new Geo(), rail = new Geo();
    for (const [a, b] of [[[px0, pz0], [px1, pz0]], [[px1, pz0], [px1, pz1]], [[px1, pz1], [px0, pz1]], [[px0, pz1], [px0, pz0]]]) {
      const nn = a[1] === b[1] ? [0, 0, a[1] === pz0 ? -1 : 1] : [a[0] === px0 ? -1 : 1, 0, 0];
      pink.quad([a[0], py, a[1]], [b[0], py, b[1]], [b[0], py + ph, b[1]], [a[0], py + ph, a[1]], nn);
    }
    rail.box(px0 - 0.04, px1 + 0.04, py + ph, py + ph + 0.06, pz0 - 0.04, pz0 + 0.04); rail.box(px0 - 0.04, px1 + 0.04, py + ph, py + ph + 0.06, pz1 - 0.04, pz1 + 0.04);
    rail.box(px0 - 0.04, px0 + 0.04, py + ph, py + ph + 0.06, pz0, pz1); rail.box(px1 - 0.04, px1 + 0.04, py + ph, py + ph + 0.06, pz0, pz1);
    for (let x = px0; x <= px1 + 0.01; x += (px1 - px0) / 6) for (const z of [pz0, pz1]) rail.box(x - 0.03, x + 0.03, py, py + ph, z - 0.03, z + 0.03);
    for (let z = pz0; z <= pz1 + 0.01; z += (pz1 - pz0) / 8) for (const x of [px0, px1]) rail.box(x - 0.03, x + 0.03, py, py + ph, z - 0.03, z + 0.03);
    const pm = pink.mesh(new THREE.MeshBasicMaterial({ color: new THREE.Color(1.5, 0.22, 0.95), transparent: true, opacity: 0.62, side: THREE.DoubleSide, depthWrite: false })); pm.renderOrder = 2;
    add(pm, rail.mesh(steel));
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
    for (const x of [tw.x0, tw.x1]) stone.box(x - 0.55, x + 0.55, 0, tw.top + 0.5, tw.z0 - 0.45, tw.z0 + 0.65, 1.4);
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
  add(stone.mesh(lime), fascia.mesh(white));

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
    const x0 = bx0 - 5, x1 = bx1 + 5, z0 = bz0 - 7, z1 = bz1 + 6, y = Math.max(22.4, roof + 2.6);      // 22.4 m in the architect's section
    const bt = blades(); bt.repeat.set((x1 - x0) / 1.2, (z1 - z0) / 6);
    const sheet = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0), new THREE.MeshBasicMaterial({ map: bt, transparent: true, side: THREE.DoubleSide, depthWrite: false, color: new THREE.Color(0.72, 0.77, 0.9), fog: false }));
    sheet.rotation.x = -Math.PI / 2; sheet.position.set((x0 + x1) / 2, y, (z0 + z1) / 2); sheet.renderOrder = 3; add(sheet);
    const fr = new Geo(), t = 0.09;
    fr.box(x0, x1, y - t, y + t, z0 - 0.12, z0); fr.box(x0, x1, y - t, y + t, z1, z1 + 0.12); fr.box(x0 - 0.12, x0, y - t, y + t, z0, z1); fr.box(x1, x1 + 0.12, y - t, y + t, z0, z1);
    // The beams the blades sit on, running east and west under them, and one spine each way.
    const nb = Math.max(3, Math.round((z1 - z0) / 8)); for (let i = 1; i < nb; i++) { const z = z0 + ((z1 - z0) * i) / nb; fr.box(x0, x1, y - 0.36, y - 0.08, z - 0.06, z + 0.06); }
    const nx = Math.max(3, Math.round((x1 - x0) / 12)); for (let i = 1; i < nx; i++) { const x = x0 + ((x1 - x0) * i) / nx; fr.box(x - 0.06, x + 0.06, y - 0.5, y - 0.36, z0, z1); }
    add(fr.mesh(white));
    // Columns: a row down each long side and one across each end, each standing on whatever is under it.
    const cols = [];
    for (let i = 0; i <= 4; i++) { const x = x0 + 2.5 + ((x1 - x0 - 5) * i) / 4; cols.push([x, z0 + 2.2], [x, z1 - 2.2]); }
    for (const z of [z0 + (z1 - z0) / 3, z0 + (2 * (z1 - z0)) / 3]) cols.push([x0 + 2.5, z], [x1 - 2.5, z]);
    for (const [x, z] of cols) {
      const foot = tallest(x, z);
      strut([x, foot, z], [x, y - 0.36, z], 0.1, white);
      if (!foot) O.push({ x0: x - 0.14, x1: x + 0.14, z0: z - 0.14, z1: z + 0.14, y0: 0, y1: y });
    }
  }
  void dark;
}
