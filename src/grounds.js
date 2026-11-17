// The outside of the museum as it really looks, and what stands round it.
//
// Worked from photographs (Wikimedia Commons) and the map (OpenStreetMap): the long Michigan
// Avenue front in grey limestone with its entrance pavilion of three arches, the two green lions,
// banners, the avenue itself, the railway in its cutting with the galleries bridging it, the two
// gardens, the Fountain of the Great Lakes against the Morton Wing, the Modern Wing's flat
// sunshade on thin columns, and the long footbridge going north to Millennium Park.

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import * as TX from './textures.js';
import { Geo } from './geo.js';
import { T } from './plan.js';

export function buildGrounds(museum, plan) {
  const G = plan.grounds, F = plan.facade, B = plan.bounds, group = museum.group;
  const add = (...m) => { for (const x of m) { x.matrixAutoUpdate = false; x.updateMatrix(); group.add(x); } };
  const ash = TX.ashlar();
  const stone = new THREE.MeshStandardMaterial({ map: ash, roughness: 0.9, emissiveMap: ash, emissive: new THREE.Color(0.36, 0.39, 0.5), emissiveIntensity: 0.5 });
  const trim = new THREE.MeshStandardMaterial({ color: 0xbdb6a6, roughness: 0.85, emissive: 0x4a4d5c, emissiveIntensity: 0.55 });
  const base = new THREE.MeshStandardMaterial({ color: 0x6e6a63, roughness: 0.8, emissive: 0x23252c, emissiveIntensity: 0.5 });
  const night = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.035, 0.045, 0.075) });
  const warm = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.95, 0.66, 0.3) });
  const verdigris = new THREE.MeshStandardMaterial({ color: 0x4fa596, roughness: 0.6, metalness: 0.2, emissive: 0x1d4a42, emissiveIntensity: 0.8 });
  const snowTex = museum.snowTex;
  const snow = new THREE.MeshStandardMaterial({ map: snowTex, roughness: 0.95, emissiveMap: snowTex, emissive: new THREE.Color(0.25, 0.3, 0.45), emissiveIntensity: 0.5 });

  // ------------------------------------------------------ the Michigan Avenue front
  {
    const wall = new Geo(), tr = new Geo(), bs = new Geo(), dark = new Geo(), glow = new Geo(), roof = new Geo();
    const W = [-1, 0, 0];
    // A stretch of wall on a plane x = X, facing west.
    const face = (X, z0, z1, y0, y1, g = wall, s = 2.6) => g.quad([X, y0, z1], [X, y0, z0], [X, y1, z0], [X, y1, z1], W, [[z1 / s, y0 / s], [z0 / s, y0 / s], [z0 / s, y1 / s], [z1 / s, y1 / s]]);
    // An arch-headed opening, drawn as a panel just proud of the wall.
    const arch = (g, X, zc, w, y0, spring) => {
      const x = X - 0.03, r = w / 2, n = 10;
      g.quad([x, y0, zc + r], [x, y0, zc - r], [x, spring, zc - r], [x, spring, zc + r], W);
      for (let i = 0; i < n; i++) {
        const a0 = Math.PI * i / n, a1 = Math.PI * (i + 1) / n;
        g.quad([x, spring, zc], [x, spring + r * Math.sin(a0), zc + r * Math.cos(a0)], [x, spring + r * Math.sin(a1), zc + r * Math.cos(a1)], [x, spring, zc], W);
      }
    };
    // The stone ring round an arch.
    const surround = (X, zc, w, y0, spring) => {
      const r = w / 2 + 0.28, n = 10;
      tr.box(X - 0.12, X, y0, spring, zc - r, zc - w / 2); tr.box(X - 0.12, X, y0, spring, zc + w / 2, zc + r);
      for (let i = 0; i < n; i++) { const a = Math.PI * (i + 0.5) / n, y = spring + (r - 0.14) * Math.sin(a), z = zc + (r - 0.14) * Math.cos(a); tr.box(X - 0.12, X, y - 0.2, y + 0.2, z - 0.2, z + 0.2); }
    };
    const { FX, PX, cz } = F, p0 = cz - F.half, p1 = cz + F.half, WH = F.wing, PH = F.pav;

    // The two wings: a banded lower storey, a row of arched niches above, a frieze of names, a cornice.
    for (const [a, b] of [[F.z0, p0], [p1, F.z1]]) {
      bs.box(FX - 0.14, FX, 0, 0.9, a, b);
      face(FX, a, b, 0.9, 4.5, wall, 1.3);
      tr.box(FX - 0.2, FX, 4.5, 4.8, a, b);
      face(FX, a, b, 4.8, 8.4);
      tr.box(FX - 0.1, FX, 8.4, 9.0, a, b);
      tr.box(FX - 0.42, FX, 9.0, 9.28, a, b);
      face(FX, a, b, 9.28, WH);
      const n = Math.max(3, Math.round((b - a) / 5.4)), step = (b - a) / n;
      for (let i = 0; i < n; i++) { const zc = a + step * (i + 0.5); arch(dark, FX, zc, 3.1, 5.2, 6.5); surround(FX, zc, 3.1, 5.2, 6.5); }
      for (let i = 0; i < n; i++) { const zc = a + step * (i + 0.5); arch(dark, FX, zc, 1.5, 1.5, 3.1); }       // small ground-floor windows
      // The end of the wing, round the corner.
      const end = a === F.z0 ? a : b, nz = a === F.z0 ? -1 : 1;
      wall.quad([FX, 0, end], [FX + 4, 0, end], [FX + 4, WH, end], [FX, WH, end], [0, 0, nz], [[0, 0], [1.5, 0], [1.5, WH / 2.6], [0, WH / 2.6]]);
    }
    // Names along the frieze. (A representative roll of old masters, not a transcription of the building's.)
    const names = ['PHIDIAS  ·  PRAXITELES  ·  GIOTTO  ·  DONATELLO  ·  BOTTICELLI  ·  LEONARDO', 'MICHELANGELO  ·  RAPHAEL  ·  TITIAN  ·  DÜRER  ·  REMBRANDT  ·  VELÁZQUEZ'];
    [[F.z0, p0], [p1, F.z1]].forEach(([a, b], i) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(b - a - 2, 0.5), new THREE.MeshBasicMaterial({ map: TX.carved(names[i], 2048, 64, 40), transparent: true, depthWrite: false, color: new THREE.Color(0.55, 0.55, 0.6) }));
      m.position.set(FX - 0.12, 8.7, (a + b) / 2); m.rotation.y = -Math.PI / 2; add(m);
    });

    // The entrance pavilion: three great arches below, three tall windows between columns above.
    bs.box(PX - 0.14, PX, 0, 0.9, p0, p1);
    face(PX, p0, p1, 0.9, 6.8, wall, 1.3);
    tr.box(PX - 0.25, PX, 6.8, 7.15, p0, p1);
    face(PX, p0, p1, 7.15, 10.7);
    tr.box(PX - 0.14, PX, 10.7, 11.6, p0, p1);
    tr.box(PX - 0.55, PX, 11.6, 11.95, p0 - 0.3, p1 + 0.3);
    face(PX, p0, p1, 11.95, PH);
    for (const side of [p0, p1]) { const nz = side === p0 ? -1 : 1; wall.quad([PX, 0, side], [FX, 0, side], [FX, PH, side], [PX, PH, side], [0, 0, nz], [[0, 0], [0.8, 0], [0.8, PH / 2.6], [0, PH / 2.6]]); wall.quad([FX, WH, side], [FX + 6, WH, side], [FX + 6, PH, side], [FX, PH, side], [0, 0, nz]); }
    const d = plan.front, dw = (d.z1 - d.z0) / 2;
    for (const k of [-1, 0, 1]) {
      const zc = cz + k * 7.6;
      surround(PX, zc, dw * 2, 0, d.h);
      // Above each door, a fanlight with the lobby lights left on behind it.
      const x = PX - 0.03, n = 10;
      for (let i = 0; i < n; i++) { const a0 = Math.PI * i / n, a1 = Math.PI * (i + 1) / n; glow.quad([x, d.h, zc], [x, d.h + dw * Math.sin(a0), zc + dw * Math.cos(a0)], [x, d.h + dw * Math.sin(a1), zc + dw * Math.cos(a1)], [x, d.h, zc], W); }
      tr.box(PX - 0.1, PX, d.h - 0.02, d.h + 0.16, zc - dw, zc + dw);
      if (k) {                                           // the side doors: bronze, and staying shut
        dark.quad([x, 0, zc + dw], [x, 0, zc - dw], [x, d.h, zc - dw], [x, d.h, zc + dw], W);
        bs.box(PX - 0.09, PX - 0.03, 0, d.h, zc - 0.05, zc + 0.05);
      }
      arch(dark, PX, zc, 2.5, 7.7, 9.1); surround(PX, zc, 2.5, 7.7, 9.1);
    }
    add(wall.mesh(stone), tr.mesh(trim), bs.mesh(base), dark.mesh(night), glow.mesh(warm));
    // Columns between the upper windows.
    const col = new THREE.CylinderGeometry(0.34, 0.38, 3.5, 14), cap = new THREE.BoxGeometry(0.95, 0.24, 0.95);
    for (const k of [-11.4, -3.8, 3.8, 11.4]) {
      const c = new THREE.Mesh(col, trim), top = new THREE.Mesh(cap, trim), foot = new THREE.Mesh(cap, trim);
      c.position.set(PX - 0.42, 8.95, cz + k); top.position.set(PX - 0.42, 10.6, cz + k); foot.position.set(PX - 0.42, 7.27, cz + k);
      add(c, top, foot);
    }
    // The name, where it is on the building: across the top of the pavilion.
    const name = new THREE.Mesh(new THREE.PlaneGeometry(21, 0.78), new THREE.MeshBasicMaterial({ map: TX.carved('THE  ART  INSTITUTE  OF  CHICAGO', 2048, 76, 56, '#f1dfae'), transparent: true, depthWrite: false, color: new THREE.Color(1.35, 1.2, 0.85), fog: false }));
    name.position.set(PX - 0.16, 11.15, cz); name.rotation.y = -Math.PI / 2; add(name);
    // Banners between the arches.
    const cloth = c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.9, emissive: c, emissiveIntensity: 0.45, side: THREE.DoubleSide });
    for (const [k, c] of [[-3.8, 0xb3242b], [3.8, 0x1f4f8a]]) {
      const b = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 4.2), cloth(c)); b.position.set(PX - 0.75, 4.2, cz + k); b.rotation.y = -Math.PI / 2;
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.0, 6), base); pole.rotation.z = Math.PI / 2; pole.position.set(PX - 0.45, 6.32, cz + k);
      add(b, pole);
    }
    // Roofs behind the front, and the forecourt in front of it.
    for (const m of plan.masses) if (m.facade) roof.quad([m.x0, m.top, m.z0], [m.x1, m.top, m.z0], [m.x1, m.top, m.z1], [m.x0, m.top, m.z1], [0, 1, 0], [[m.x0 / 5, m.z0 / 5], [m.x1 / 5, m.z0 / 5], [m.x1 / 5, m.z1 / 5], [m.x0 / 5, m.z1 / 5]]);
    // The back of the front wall, where it stands taller than the rooms behind.
    wall.quad([FX + 0.6, 7, F.z0], [FX + 0.6, 7, F.z1], [FX + 0.6, WH, F.z1], [FX + 0.6, WH, F.z0], [1, 0, 0]);
    add(roof.mesh(snow));
    // Stone urns either side of the way in, as in the photographs.
    const urn = new THREE.CylinderGeometry(0.55, 0.3, 0.7, 12), ped = new THREE.BoxGeometry(0.9, 1.0, 0.9), bush = new THREE.SphereGeometry(0.5, 10, 8);
    const green = new THREE.MeshStandardMaterial({ color: 0x24402a, roughness: 0.9, emissive: 0x0e1c12, emissiveIntensity: 0.6 });
    for (const k of [-3.8, 3.8, -11.6, 11.6]) {
      const a = new THREE.Mesh(ped, trim), u = new THREE.Mesh(urn, trim), s2 = new THREE.Mesh(bush, green);
      a.position.set(PX - 1.0, 0.5, cz + k); u.position.set(PX - 1.0, 1.35, cz + k); s2.position.set(PX - 1.0, 1.85, cz + k); s2.scale.y = 0.7;
      add(a, u, s2);
      plan.obstacles.push({ x0: PX - 1.5, x1: PX - 0.5, z0: cz + k - 0.5, z1: cz + k + 0.5, y0: 0, y1: 2.2 });
    }
  }

  // ------------------------------------------------------------------- the streets
  {
    const road = new Geo(), paint = new Geo(), walk = new Geo(), kerb = new Geo();
    const flat = (g, x0, x1, z0, z1, y, s = 4) => g.quad([x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1], [0, 1, 0], [[x0 / s, z0 / s], [x1 / s, z0 / s], [x1 / s, z1 / s], [x0 / s, z1 / s]]);
    const M = G.michigan;
    flat(road, M.x0, M.x1, B.z0, B.z1, 0.004);
    flat(road, M.x1, B.x1, G.monroe.z0, G.monroe.z1, 0.004); flat(road, M.x1, B.x1, G.jackson.z0, G.jackson.z1, 0.004);
    flat(road, G.columbus.x0, G.columbus.x1, G.monroe.z1, G.jackson.z0, 0.004);
    // Lane lines: dashes down the avenue, a double line up the middle.
    for (let z = B.z0; z < B.z1; z += 9) for (const x of [-19, -6.5]) flat(paint, x - 0.08, x + 0.08, z, z + 3.6, 0.008);
    for (const x of [-12.9, -12.3]) flat(paint, x - 0.07, x + 0.07, B.z0, B.z1, 0.008);
    for (let x = M.x1 + 6; x < B.x1; x += 9) for (const z of [(G.monroe.z0 + G.monroe.z1) / 2, (G.jackson.z0 + G.jackson.z1) / 2]) flat(paint, x, x + 3.6, z - 0.08, z + 0.08, 0.008);
    for (let z = G.monroe.z1 + 6; z < G.jackson.z0; z += 9) flat(paint, 284.9, 285.1, z, z + 3.6, 0.008);
    // The crossing at Adams Street, opposite the door.
    for (let z = F.cz - 3.2; z < F.cz + 3.2; z += 0.9) flat(paint, M.x0 + 0.5, M.x1 - 0.5, z, z + 0.45, 0.008);
    // The pavement, and the stone forecourt before the entrance.
    flat(walk, M.x1, F.FX, B.z0, F.z0 - 6, 0.006, 2.5); flat(walk, M.x1, F.FX, F.z1 + 6, B.z1, 0.006, 2.5); flat(walk, M.x1, F.FX, F.z0 - 6, F.z1 + 6, 0.006, 2.5);
    kerb.box(M.x1 - 0.12, M.x1 + 0.12, 0, 0.07, B.z0, B.z1);
    const at = TX.asphalt();
    add(road.mesh(new THREE.MeshStandardMaterial({ map: at, roughness: 0.55, emissiveMap: at, emissive: new THREE.Color(0.4, 0.45, 0.6), emissiveIntensity: 0.5, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 })));
    add(paint.mesh(new THREE.MeshBasicMaterial({ color: new THREE.Color(0.62, 0.6, 0.5), polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })));
    add(walk.mesh(new THREE.MeshStandardMaterial({ color: 0x9a968e, roughness: 0.85, emissive: 0x3a3f4f, emissiveIntensity: 0.5, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 })));
    add(kerb.mesh(base));
  }

  // ------------------------------------------------------------------- the railway
  {
    const R = G.rail, bed = new Geo(), wallG = new Geo(), mouth = new Geo();
    const rt = TX.railway();
    for (const [a, b] of G.railGaps) {
      for (const x of [R.x0 + 0.9, R.x0 + 5.7]) bed.quad([x, 0.006, a], [x + 3.4, 0.006, a], [x + 3.4, 0.006, b], [x, 0.006, b], [0, 1, 0], [[0, a / 2.4], [1, a / 2.4], [1, b / 2.4], [0, b / 2.4]]);
    }
    // Where the tracks go under the galleries: two black mouths in the wall at each side of the bridge.
    for (const q of plan.masses) {
      if (!q.room || q.x1 < R.x0 || q.x0 > R.x1) continue;
      for (const [z, nz] of [[q.z0 - 0.02, -1], [q.z1 + 0.02, 1]]) {
        if (plan.masses.some(o => o !== q && o.x0 < R.x1 && o.x1 > R.x0 && z > o.z0 + 0.1 && z < o.z1 - 0.1)) continue;
        for (const x of [R.x0 + 0.6, R.x0 + 5.4]) {
          const x0 = Math.max(x, q.x0), x1 = Math.min(x + 4, q.x1);
          if (x1 - x0 > 1.5) mouth.quad([x0, 0, z], [x1, 0, z], [x1, 4.6, z], [x0, 4.6, z], [0, 0, nz]);
        }
      }
    }
    add(bed.mesh(new THREE.MeshStandardMaterial({ map: rt, roughness: 0.9, emissiveMap: rt, emissive: new THREE.Color(0.4, 0.45, 0.6), emissiveIntensity: 0.55, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 })));
    if (!mouth.empty) add(mouth.mesh(new THREE.MeshBasicMaterial({ color: 0x020203 })));
    void wallG;
    if (G.train) {
      const t = G.train, ct = TX.carriage(), cars = new Geo(), ends = new Geo(), len = (t.z1 - t.z0 - 2) / 2;
      for (let i = 0; i < 2; i++) {
        const a = t.z0 + i * (len + 2), b = a + len, x0 = t.x - 1.45, x1 = t.x + 1.45;
        for (const [x, nx] of [[x0, -1], [x1, 1]]) cars.quad([x, 0.5, a], [x, 0.5, b], [x, 4.5, b], [x, 4.5, a], [nx, 0, 0], [[0, 0], [len / 9, 0], [len / 9, 1], [0, 1]]);
        ends.box(x0, x1, 0.5, 4.5, a, a + 0.02); ends.box(x0, x1, 0.5, 4.5, b - 0.02, b); ends.box(x0, x1, 4.5, 4.62, a, b); ends.box(x0 + 0.3, x1 - 0.3, 0.15, 0.5, a + 1.5, b - 1.5);
      }
      add(cars.mesh(new THREE.MeshStandardMaterial({ map: ct, roughness: 0.4, metalness: 0.5, emissiveMap: ct, emissive: 0xffffff, emissiveIntensity: 0.7 })), ends.mesh(new THREE.MeshStandardMaterial({ color: 0x70767e, roughness: 0.45, metalness: 0.6, emissive: 0x20242a, emissiveIntensity: 0.6 })));
    }
  }

  // ------------------------------------------------------------------- the gardens
  {
    // Trees: one bare tree, drawn many times.
    const parts = [];
    const limb = (len, r0, r1, x, y, z, rx, rz) => { const g = new THREE.CylinderGeometry(r1, r0, len, 6); g.translate(0, len / 2, 0); g.rotateX(rx); g.rotateZ(rz); g.translate(x, y, z); parts.push(g); };
    limb(2.3, 0.15, 0.1, 0, 0, 0, 0, 0);
    for (let i = 0; i < 7; i++) { const a = i * 0.9 + 0.3, tilt = 0.55 + (i % 3) * 0.18; limb(2.2 + (i % 2) * 0.7, 0.07, 0.02, 0, 1.9 + (i % 3) * 0.25, 0, Math.cos(a) * tilt, Math.sin(a) * tilt); }
    for (let i = 0; i < 6; i++) { const a = i * 1.05 + 0.8; limb(1.3, 0.035, 0.012, Math.sin(a) * 0.9, 3.0 + (i % 2) * 0.4, -Math.cos(a) * 0.9 + 0, Math.cos(a) * 0.9, Math.sin(a) * 0.9); }
    const treeGeo = mergeGeometries(parts);
    const bark = new THREE.MeshStandardMaterial({ color: 0x2a221c, roughness: 0.9, emissive: 0x1a1d26, emissiveIntensity: 0.9 });
    const trees = new THREE.InstancedMesh(treeGeo, bark, Math.max(1, G.trees.length));
    const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler();
    G.trees.forEach((t, i) => {
      const wide = t.kind === 'hawthorn';
      trees.setMatrixAt(i, M4.compose(new THREE.Vector3(t.x, 0, t.z), Q.setFromEuler(E.set(0, t.yaw, 0)), new THREE.Vector3(t.s * (wide ? 1.35 : 1), t.s * (wide ? 0.8 : 1.45), t.s * (wide ? 1.35 : 1))));
    });
    trees.frustumCulled = false; group.add(trees);
    // Hedges, with snow lying on top.
    const hedge = new Geo(), cap = new Geo();
    for (const h of G.hedges) { hedge.box(h.x0, h.x1, 0, 0.8, h.z0, h.z1); cap.box(h.x0 - 0.03, h.x1 + 0.03, 0.8, 0.88, h.z0 - 0.03, h.z1 + 0.03); }
    add(hedge.mesh(new THREE.MeshStandardMaterial({ color: 0x1c3324, roughness: 0.95, emissive: 0x0c1810, emissiveIntensity: 0.7 })), cap.mesh(snow));

    // The South Garden's long pool, frozen, in its stone rim.
    const p = G.pool, rim = new Geo();
    rim.box(p.x0 - 0.4, p.x1 + 0.4, 0, 0.07, p.z0 - 0.4, p.z0); rim.box(p.x0 - 0.4, p.x1 + 0.4, 0, 0.07, p.z1, p.z1 + 0.4);
    rim.box(p.x0 - 0.4, p.x0, 0, 0.07, p.z0, p.z1); rim.box(p.x1, p.x1 + 0.4, 0, 0.07, p.z0, p.z1);
    add(rim.mesh(trim));
    const ice = new THREE.Mesh(new THREE.PlaneGeometry(p.x1 - p.x0, p.z1 - p.z0), museum.mirror.patch(new THREE.MeshStandardMaterial({ color: 0x1a2a3c, roughness: 0.08, emissive: 0x0a1626, emissiveIntensity: 0.6, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }), [0.35, 0.5]));
    ice.rotation.x = -Math.PI / 2; ice.position.set((p.x0 + p.x1) / 2, 0.01, (p.z0 + p.z1) / 2); add(ice); museum.floors.push(ice);

    // The Fountain of the Great Lakes: five bronze women on a stepped rock, each pouring into the
    // shell of the one below, in a round stone basin against the wall of the Morton Wing.
    const f = G.fountain, fg = new THREE.Group(), stoneWarm = new THREE.MeshStandardMaterial({ color: 0xb08a55, roughness: 0.8, emissive: 0x3a2c1a, emissiveIntensity: 0.6 });
    const put = (geo, mat, x, y, z, sx = 1, sy = 1, sz = 1) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.scale.set(sx, sy, sz); fg.add(m); return m; };
    const cyl = new THREE.CylinderGeometry(1, 1, 1, 24), box = new THREE.BoxGeometry(1, 1, 1), ball = new THREE.SphereGeometry(0.5, 12, 10);
    put(cyl, stoneWarm, -0.2, 0.45, 0, 3.6, 0.9, 4.2);                                   // the basin
    put(cyl, new THREE.MeshStandardMaterial({ color: 0x16283a, roughness: 0.1, emissive: 0x0a1626, emissiveIntensity: 0.7 }), -0.2, 0.92, 0, 3.3, 0.02, 3.9);
    put(box, verdigris, 1.2, 1.5, 0, 2.2, 1.3, 3.4); put(box, verdigris, 1.6, 2.6, 0, 1.5, 1.0, 2.2); put(box, verdigris, 1.9, 3.5, 0, 1.0, 0.9, 1.3);
    for (const [x, y, z] of [[1.9, 4.0, 0], [1.3, 3.1, -0.9], [1.2, 3.1, 0.9], [0.5, 2.15, -1.3], [0.5, 2.15, 1.2]]) {   // the five lakes
      put(cyl, verdigris, x, y + 0.75, z, 0.27, 1.5, 0.27); put(ball, verdigris, x, y + 1.65, z, 0.42, 0.42, 0.42); put(ball, verdigris, x - 0.35, y + 1.0, z, 0.5, 0.2, 0.5);
    }
    for (const sgn of [-1, 1]) { put(box, stoneWarm, 0.2, 1.3, sgn * 3.6, 1.0, 0.9, 0.9); put(ball, verdigris, 0.2, 2.2, sgn * 3.6, 0.6, 0.9, 0.6); }      // the two boys with fish
    fg.position.set(f.x, 0, f.z);
    group.add(fg);

    // In the North Garden, Calder's Flying Dragon: red steel plates on three points.
    const red = new THREE.MeshStandardMaterial({ color: 0xc8261c, roughness: 0.6, emissive: 0x5a0f0a, emissiveIntensity: 0.7, side: THREE.DoubleSide });
    const cg = new THREE.Group();
    const plate = (w, h, x, y, z, rx, ry, rz) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.05), red); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); cg.add(m); };
    plate(4.6, 1.5, 0, 2.3, 0, 0.5, 0.2, 0.25); plate(1.2, 2.6, -1.4, 1.2, 0.4, 0, 0.9, 0.2); plate(1.0, 2.4, 1.3, 1.1, -0.3, 0, -0.7, -0.25); plate(2.6, 1.0, 1.9, 3.2, -0.5, -0.4, 0.5, 0.6);
    cg.position.set(G.calder.x, 0, G.calder.z); group.add(cg);
  }

  // ------------------------------------------------------- the Modern Wing from above
  {
    const h = plan.hall, white = new THREE.MeshStandardMaterial({ color: 0xe9edf2, roughness: 0.5, emissive: 0x5a6070, emissiveIntensity: 0.7 });
    // The sunshade: a flat sheet of blades floating over the whole wing on thin white columns.
    const x0 = h.x0 - 30, x1 = h.x1 + 22, z0 = h.z0 - 9, z1 = h.z1 + 6, y = 18.4, bt = TX.blades();
    bt.repeat.set((x1 - x0) / 1.6, (z1 - z0) / 6);
    const sheet = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0), new THREE.MeshBasicMaterial({ map: bt, transparent: true, side: THREE.DoubleSide, depthWrite: false, color: new THREE.Color(0.5, 0.55, 0.68), fog: false }));
    sheet.rotation.x = -Math.PI / 2; sheet.position.set((x0 + x1) / 2, y, (z0 + z1) / 2); sheet.renderOrder = 3; add(sheet);
    const edge = new Geo();
    edge.box(x0, x1, y - 0.12, y + 0.12, z0 - 0.15, z0); edge.box(x0, x1, y - 0.12, y + 0.12, z1, z1 + 0.15); edge.box(x0 - 0.15, x0, y - 0.12, y + 0.12, z0, z1); edge.box(x1, x1 + 0.15, y - 0.12, y + 0.12, z0, z1);
    const inMass = (x, z) => plan.masses.find(q => x > q.x0 - 0.3 && x < q.x1 + 0.3 && z > q.z0 - 0.3 && z < q.z1 + 0.3);
    for (let x = x0 + 3; x <= x1 - 3; x += (x1 - x0 - 6) / 4) for (const z of [z0 + 2, (z0 + z1) / 2, z1 - 2]) {
      const m = inMass(x, z), foot = m ? m.top : 0;
      edge.box(x - 0.14, x + 0.14, foot, y, z - 0.14, z + 0.14);
      if (!m) plan.obstacles.push({ x0: x - 0.18, x1: x + 0.18, z0: z - 0.18, z1: z + 0.18, y0: 0, y1: y });
    }
    // The Nichols Bridgeway: a long white blade of a footbridge, climbing from Millennium Park to the wing's roof.
    const ax = h.x0 - 22, az = h.z0 + 16, ay = 8.4, bx = ax - 9, bz = B.z0 - 60, by = 4.2;
    const deck = new Geo(), dir = [bx - ax, by - ay, bz - az], len = Math.hypot(dir[0], dir[2]), px = -dir[2] / len * 1.4, pz = dir[0] / len * 1.4;
    deck.quad([ax - px, ay, az - pz], [ax + px, ay, az + pz], [bx + px, by, bz + pz], [bx - px, by, bz - pz], [0, 1, 0]);
    deck.quad([ax - px, ay - 0.35, az - pz], [ax + px, ay - 0.35, az + pz], [bx + px, by - 0.35, bz + pz], [bx - px, by - 0.35, bz - pz], [0, -1, 0]);
    for (const sgn of [-1, 1]) deck.quad([ax + sgn * px, ay - 0.35, az + sgn * pz], [bx + sgn * px, by - 0.35, bz + sgn * pz], [bx + sgn * px, by + 1.1, bz + sgn * pz], [ax + sgn * px, ay + 1.1, az + sgn * pz], [sgn * px, 0, sgn * pz]);
    for (const t of [0.3, 0.55]) { const x = ax + dir[0] * t, z = az + dir[2] * t, yy = ay + dir[1] * t; if (!inMass(x, z)) { edge.box(x - 0.2, x + 0.2, 0, yy - 0.35, z - 0.2, z + 0.2); plan.obstacles.push({ x0: x - 0.25, x1: x + 0.25, z0: z - 0.25, z1: z + 0.25, y0: 0, y1: yy }); } }
    add(edge.mesh(white), deck.mesh(new THREE.MeshStandardMaterial({ color: 0xe9edf2, roughness: 0.5, emissive: 0x5a6070, emissiveIntensity: 0.7, side: THREE.DoubleSide })));
  }

  // ---------------------------------------------- skylights, as the roofs are seen from the air
  {
    const curb = new Geo(), glass = new Geo();
    for (const q of plan.masses) {
      const r = q.room;
      if (!r || r.kind !== 'gallery' || r.floor === 'LL' || (plan.skylight && plan.skylight.room === r.id)) continue;
      const w = r.x1 - r.x0, d = r.z1 - r.z0;
      if (Math.min(w, d) < 8.5) continue;
      const x0 = r.x0 + w * 0.27, x1 = r.x1 - w * 0.27, z0 = r.z0 + d * 0.27, z1 = r.z1 - d * 0.27, y = q.top;
      curb.box(x0 - 0.2, x1 + 0.2, y, y + 0.35, z0 - 0.2, z0); curb.box(x0 - 0.2, x1 + 0.2, y, y + 0.35, z1, z1 + 0.2); curb.box(x0 - 0.2, x0, y, y + 0.35, z0, z1); curb.box(x1, x1 + 0.2, y, y + 0.35, z0, z1);
      glass.quad([x0, y + 0.3, z0], [x1, y + 0.3, z0], [x1, y + 0.3, z1], [x0, y + 0.3, z1], [0, 1, 0]);
    }
    add(curb.mesh(base), glass.mesh(new THREE.MeshBasicMaterial({ map: TX.laylight(), color: new THREE.Color(0.3, 0.34, 0.46) })));
  }
  void T;
}
