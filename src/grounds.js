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
import { T, streetY } from './plan.js';
import { buildBridgeway } from './bridgeway.js';
import { buildEastSide } from './eastside.js';
import { buildRailway } from './railway.js';
import { buildLakefront } from './lakefront.js';

export function buildGrounds(museum, plan) {
  const G = plan.grounds, F = plan.facade, B = plan.bounds, group = museum.group;
  const add = (...m) => { for (const x of m) { x.matrixAutoUpdate = false; x.updateMatrix(); group.add(x); } };
  const ash = TX.ashlar();
  const stone = new THREE.MeshStandardMaterial({ map: ash, roughness: 0.9, emissiveMap: ash, emissive: new THREE.Color(0.45, 0.43, 0.46), emissiveIntensity: 0.52 });
  const trim = new THREE.MeshStandardMaterial({ color: 0xbdb6a6, roughness: 0.85, emissive: 0x4a4d5c, emissiveIntensity: 0.55 });
  const base = new THREE.MeshStandardMaterial({ color: 0x8a867e, roughness: 0.8, emissive: 0x3c404e, emissiveIntensity: 0.55 });
  const night = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.035, 0.045, 0.075) });
  const warm = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.95, 0.66, 0.3) });
  const verdigris = new THREE.MeshStandardMaterial({ color: 0x4fa596, roughness: 0.6, metalness: 0.2, emissive: 0x1d4a42, emissiveIntensity: 0.8 });
  const snowTex = museum.snowTex;
  const snow = new THREE.MeshStandardMaterial({ map: snowTex, roughness: 0.95, emissiveMap: snowTex, emissive: new THREE.Color(0.25, 0.3, 0.45), emissiveIntensity: 0.5 });

  // ------------------------------------------------------ the Michigan Avenue front
  {
    const blind = new Geo(), wall = new Geo(), tr = new Geo(), bs = new Geo(), dark = new Geo(), glow = new Geo(), roof = new Geo();
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
      tr.box(X - 0.12, X, y0, spring, zc - r, zc - w / 2 - 0.012); tr.box(X - 0.12, X, y0, spring, zc + w / 2 + 0.012, zc + r);
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
      // A blind arcade: tall round-headed panels of plain stone between pilasters. Square windows below.
      for (let i = 0; i < n; i++) { const zc = a + step * (i + 0.5); arch(blind, FX, zc, 3.3, 5.0, 6.6); surround(FX, zc, 3.3, 5.0, 6.6); tr.box(FX - 0.1, FX, 5.0, 5.14, zc - 1.65, zc + 1.65); }
      for (let i = 0; i <= n; i++) { const z = a + step * i; tr.box(FX - 0.2, FX, 4.8, 8.4, z - 0.36, z + 0.36); tr.box(FX - 0.26, FX, 8.1, 8.4, z - 0.44, z + 0.44); }
      for (let i = 0; i < n; i++) { const zc = a + step * (i + 0.5), x = FX - 0.03; dark.quad([x, 1.45, zc + 1.0], [x, 1.45, zc - 1.0], [x, 3.6, zc - 1.0], [x, 3.6, zc + 1.0], W); tr.box(FX - 0.1, FX, 3.6, 3.78, zc - 1.15, zc + 1.15); tr.box(FX - 0.1, FX, 1.3, 1.45, zc - 1.15, zc + 1.15); }
      // The end of the wing, round the corner.
      const end = a === F.z0 ? a : b, nz = a === F.z0 ? -1 : 1;
      // It goes back as far as the rooms do: stop short and you can see in round the corner.
      const fill = plan.masses.find(q => q.facade && !q.pavilion && Math.abs((a === F.z0 ? q.z0 : q.z1) - end) < 0.01), back = Math.max(FX + 4, fill ? fill.x1 : 0);
      wall.quad([FX, 0, end], [back, 0, end], [back, WH, end], [FX, WH, end], [0, 0, nz], [[0, 0], [(back - FX) / 2.6, 0], [(back - FX) / 2.6, WH / 2.6], [0, WH / 2.6]]);
    }
    // Names along the frieze. (A representative roll of old masters, not a transcription of the building's.)
    const names = ['PHIDIAS  ·  PRAXITELES  ·  GIOTTO  ·  DONATELLO  ·  BOTTICELLI  ·  LEONARDO', 'MICHELANGELO  ·  RAPHAEL  ·  TITIAN  ·  DÜRER  ·  REMBRANDT  ·  VELÁZQUEZ'];
    [[F.z0, p0], [p1, F.z1]].forEach(([a, b], i) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(b - a - 2, 0.5), new THREE.MeshBasicMaterial({ map: TX.carved(names[i], 2048, 64, 40), transparent: true, depthWrite: false, color: new THREE.Color(0.55, 0.55, 0.6) }));
      m.position.set(FX - 0.12, 8.7, (a + b) / 2); m.rotation.y = -Math.PI / 2; add(m);
    });

    // The entrance pavilion: three great arches below, three tall windows between columns above.
    // The lower storey has three things cut out of it: the doorway, the fanlight over it, and the hole beside it.
    const d = plan.front, dw = (d.z1 - d.z0) / 2, v = plan.vent, fanTop = d.h + dw;
    let zz = p0;
    for (const [a, b] of [...(v ? [[v.z0, v.z1]] : []), [d.z0, d.z1]]) { bs.box(PX - 0.14, PX, 0, 0.9, zz, a); zz = b; }
    bs.box(PX - 0.14, PX, 0, 0.9, zz, p1);
    if (v) bs.box(PX - 0.14, PX, v.h + 0.07, 0.9, v.z0, v.z1);
    face(PX, p0, d.z0, 0.9, 6.8, wall, 1.3); face(PX, d.z1, p1, 0.9, 6.8, wall, 1.3); face(PX, d.z0, d.z1, fanTop, 6.8, wall, 1.3);
    for (let i = 0; i < 12; i++) {                       // the stone between the square of the opening and the round head of the arch
      const a0 = Math.PI * i / 12, a1 = Math.PI * (i + 1) / 12, zA = cz + dw * Math.cos(a0), zB = cz + dw * Math.cos(a1);
      wall.quad([PX, d.h + dw * Math.sin(a0), zA], [PX, d.h + dw * Math.sin(a1), zB], [PX, fanTop, zB], [PX, fanTop, zA], W);
    }
    tr.box(PX - 0.25, PX, 6.8, 7.15, p0, p1);
    face(PX, p0, p1, 7.15, 10.7);
    tr.box(PX - 0.14, PX, 10.7, 11.6, p0, p1);
    tr.box(PX - 0.55, PX, 11.6, 11.95, p0 - 0.3, p1 + 0.3);
    face(PX, p0, p1, 11.95, PH);
    // The pediment: the low gable that crowns the pavilion, with its roof running back behind it.
    { const H = 3.7, e = 0.45, zl = p0 - e, zr = p1 + e, back = FX + 9, L = Math.hypot(F.half + e, H), ang = Math.atan2(H, F.half + e);
      tr.box(PX - 0.6, PX, PH - 0.34, PH, zl, zr);
      wall.quad([PX - 0.05, PH, p1], [PX - 0.05, PH, p0], [PX - 0.05, PH + H - 0.1, cz], [PX - 0.05, PH + H - 0.1, cz], W, [[p1 / 2.6, 0], [p0 / 2.6, 0], [cz / 2.6, H / 2.6], [cz / 2.6, H / 2.6]]);
      for (const sg of [-1, 1]) {
        const rake = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.36, L + 0.3), trim); rake.position.set(PX - 0.3, PH + H / 2 + 0.1, cz + sg * (F.half + e) / 2); rake.rotation.x = sg * ang; add(rake);
        const ze = sg < 0 ? zl : zr, n = [0, Math.cos(ang), sg * Math.sin(ang)];
        const q = sg < 0 ? [[PX - 0.6, PH + 0.05, ze], [back, PH + 0.05, ze], [back, PH + H + 0.25, cz], [PX - 0.6, PH + H + 0.25, cz]] : [[PX - 0.6, PH + H + 0.25, cz], [back, PH + H + 0.25, cz], [back, PH + 0.05, ze], [PX - 0.6, PH + 0.05, ze]];
        roof.quad(q[0], q[1], q[2], q[3], n, [[0, 0], [3, 0], [3, 3], [0, 3]]);
      }
      wall.quad([back, PH, p0], [back, PH, p1], [back, PH + H, cz], [back, PH + H, cz], [1, 0, 0]);
      for (const side of [p0, p1]) wall.quad([FX, WH, side], [back, WH, side], [back, PH, side], [FX, PH, side], [0, 0, side === p0 ? -1 : 1]);
      tr.box(PX - 0.5, PX + 0.1, PH + H + 0.2, PH + H + 0.95, cz - 0.35, cz + 0.35); for (const z of [zl + 0.3, zr - 0.3]) tr.box(PX - 0.5, PX + 0.1, PH, PH + 0.6, z - 0.3, z + 0.3); }
    for (const side of [p0, p1]) { const nz = side === p0 ? -1 : 1; wall.quad([PX, 0, side], [FX, 0, side], [FX, PH, side], [PX, PH, side], [0, 0, nz], [[0, 0], [0.8, 0], [0.8, PH / 2.6], [0, PH / 2.6]]); wall.quad([FX, WH, side], [FX + 6, WH, side], [FX + 6, PH, side], [FX, PH, side], [0, 0, nz]); }
    const tun = new Geo(), t = plan.transom;
    for (const k of [-1, 0, 1]) {
      const zc = cz + k * 7.6;
      surround(PX, zc, dw * 2, 0, d.h);
      // Above each door, a fanlight with the lobby lights left on behind it.
      const x = PX - 0.03, n = 10;
      if (k || !t) for (let i = 0; i < n; i++) { const a0 = Math.PI * i / n, a1 = Math.PI * (i + 1) / n; glow.quad([x, d.h, zc], [x, d.h + dw * Math.sin(a0), zc + dw * Math.cos(a0)], [x, d.h + dw * Math.sin(a1), zc + dw * Math.cos(a1)], [x, d.h, zc], W); }
      else {
        // The middle fanlight stands open: a lit way through, over the locked doors, for anything that flies.
        const bx = PX + 0.06;
        dark.quad([bx, d.h, zc - dw], [bx, d.h, t.z0], [bx, fanTop, t.z0], [bx, fanTop, zc - dw], W); dark.quad([bx, d.h, t.z1], [bx, d.h, zc + dw], [bx, fanTop, zc + dw], [bx, fanTop, t.z1], W);
        dark.quad([bx, t.y1, t.z0], [bx, t.y1, t.z1], [bx, fanTop, t.z1], [bx, fanTop, t.z0], W);
        tun.quad([t.x0, t.y0, t.z0], [t.x1, t.y0, t.z0], [t.x1, t.y1, t.z0], [t.x0, t.y1, t.z0], [0, 0, 1]);
        tun.quad([t.x0, t.y0, t.z1], [t.x1, t.y0, t.z1], [t.x1, t.y1, t.z1], [t.x0, t.y1, t.z1], [0, 0, -1]);
        tun.quad([t.x0, t.y1, t.z0], [t.x1, t.y1, t.z0], [t.x1, t.y1, t.z1], [t.x0, t.y1, t.z1], [0, -1, 0]);
        tun.quad([t.x0, t.y0 + 0.03, t.z0], [t.x1, t.y0 + 0.03, t.z0], [t.x1, t.y0 + 0.03, t.z1], [t.x0, t.y0 + 0.03, t.z1], [0, 1, 0]);
      }
      tr.box(PX - 0.13, PX, d.h - 0.02, d.h + 0.16, zc - dw, zc + dw);
      if (k) {                                           // the side doors: bronze, and staying shut
        dark.quad([x, 0, zc + dw], [x, 0, zc - dw], [x, d.h, zc - dw], [x, d.h, zc + dw], W);
        bs.box(PX - 0.09, PX - 0.03, 0, d.h, zc - 0.05, zc + 0.05);
      }
      arch(glow, PX, zc, 2.5, 7.7, 9.1); surround(PX, zc, 2.5, 7.7, 9.1);       // lit from inside, behind the banners
      tr.box(PX - 0.3, PX, 7.5, 7.7, zc - 1.5, zc + 1.5); for (let b2 = -1.3; b2 <= 1.31; b2 += 0.26) tr.box(PX - 0.26, PX - 0.18, 7.7, 8.25, zc + b2 - 0.04, zc + b2 + 0.04); tr.box(PX - 0.3, PX - 0.14, 8.25, 8.33, zc - 1.4, zc + 1.4);
    }
    add(blind.mesh(new THREE.MeshStandardMaterial({ color: 0xb5b0a4, roughness: 0.9, emissive: 0x6c6c7c, emissiveIntensity: 0.62 })));
    add(wall.mesh(stone), tr.mesh(trim), bs.mesh(base), dark.mesh(night), glow.mesh(warm));
    if (t) {
      add(tun.mesh(new THREE.MeshBasicMaterial({ color: new THREE.Color(0.85, 0.58, 0.27), side: THREE.DoubleSide })));
      // The sash itself, swung out and down on its hinges, and the same strip light round the opening as round the hole below.
      const sash = new Geo(), r = dw - 0.12;
      for (let i = 0; i < 12; i++) { const a = Math.PI * (i + 0.5) / 12; sash.box(-0.03, 0.03, r * Math.sin(a) - 0.09, r * Math.sin(a) + 0.09, r * Math.cos(a) - 0.3, r * Math.cos(a) + 0.3); }
      sash.box(-0.03, 0.03, -0.06, 0.06, -r, r); sash.box(-0.03, 0.03, 0, r, -0.04, 0.04);
      const sm = sash.mesh(base); sm.position.set(PX - 0.1, d.h + 0.2, cz); sm.rotation.z = 1.25; add(sm);
      const led = new Geo();
      led.box(PX - 0.09, PX - 0.02, t.y0, t.y0 + 0.07, t.z0, t.z1); led.box(PX - 0.09, PX - 0.02, t.y1 - 0.07, t.y1, t.z0, t.z1);
      led.box(PX - 0.09, PX - 0.02, t.y0, t.y1, t.z0 - 0.07, t.z0); led.box(PX - 0.09, PX - 0.02, t.y0, t.y1, t.z1, t.z1 + 0.07);
      add(led.mesh(new THREE.MeshBasicMaterial({ color: new THREE.Color(0.22, 1.25, 1.45) })));
    }
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
    // The show's banners, hung in the three upper windows. (Painted here: nobody's picture.)
    for (const k of [-1, 0, 1]) {
      const cv = document.createElement('canvas'); cv.width = 128; cv.height = 176; const c = cv.getContext('2d'), r = TX.rng(31 + k * 7);
      const g = c.createLinearGradient(0, 0, 128, 176); g.addColorStop(0, '#2b5f8e'); g.addColorStop(0.55, '#4f8a86'); g.addColorStop(1, '#27506e'); c.fillStyle = g; c.fillRect(0, 0, 128, 176);
      for (let i = 0; i < 26; i++) { c.fillStyle = ['#d9b48a', '#c99a6e', '#3d7a52', '#e6d2a8', '#1f4468'][i % 5]; c.globalAlpha = 0.75; c.beginPath(); c.ellipse(r() * 128, 40 + r() * 130, 8 + r() * 22, 5 + r() * 12, r() * 3, 0, 7); c.fill(); }
      c.globalAlpha = 1;
      const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 2.5), new THREE.MeshBasicMaterial({ map: t, color: new THREE.Color(0.95, 0.9, 0.82) })); m.position.set(PX - 0.07, 9.25, cz + k * 7.6); m.scale.set(0.82, 0.86, 1); m.rotation.y = -Math.PI / 2; add(m);
    }
    // Carved panels at the two ends of the upper storey, and two flags on poles leaning out between the windows.
    for (const sg of [-1, 1]) { const zc = cz + sg * 11.4; tr.box(PX - 0.1, PX, 8.0, 9.9, zc - 1.2, zc + 1.2); blind.quad([PX - 0.11, 8.15, zc + 1.05], [PX - 0.11, 8.15, zc - 1.05], [PX - 0.11, 9.75, zc - 1.05], [PX - 0.11, 9.75, zc + 1.05], W); }
    const flag = (draw) => { const cv = document.createElement('canvas'); cv.width = 96; cv.height = 64; draw(cv.getContext('2d')); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return new THREE.MeshBasicMaterial({ map: t, side: THREE.DoubleSide, color: new THREE.Color(0.75, 0.75, 0.8) }); };
    const flags = [flag(c => { for (let i = 0; i < 13; i++) { c.fillStyle = i % 2 ? '#f2efe6' : '#b3242b'; c.fillRect(0, i * 64 / 13, 96, 64 / 13 + 0.5); } c.fillStyle = '#243a73'; c.fillRect(0, 0, 40, 35); c.fillStyle = '#f2efe6'; for (let i = 0; i < 20; i++) c.fillRect(4 + (i % 5) * 7.5, 4 + Math.floor(i / 5) * 8, 2, 2); }),
      flag(c => { c.fillStyle = '#f2efe6'; c.fillRect(0, 0, 96, 64); c.fillStyle = '#6fb3de'; c.fillRect(0, 10, 96, 10); c.fillRect(0, 44, 96, 10); c.fillStyle = '#c8202b'; for (let i = 0; i < 4; i++) { c.beginPath(); c.arc(18 + i * 20, 32, 5, 0, 7); c.fill(); } })];
    [[-3.8, 0], [3.8, 1]].forEach(([k, i]) => {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 3.4, 6), base); pole.position.set(PX - 1.15, 8.6, cz + k); pole.rotation.z = 0.72; add(pole);
      const f = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.0), flags[i]); f.position.set(PX - 1.75, 8.7, cz + k + 0.02); f.rotation.set(0, -Math.PI / 2, 0); f.rotation.z = 0; add(f);
    });
    // Roofs behind the front, and the forecourt in front of it.
    for (const m of plan.masses) if (m.facade) roof.quad([m.x0, m.top, m.z0], [m.x1, m.top, m.z0], [m.x1, m.top, m.z1], [m.x0, m.top, m.z1], [0, 1, 0], [[m.x0 / 5, m.z0 / 5], [m.x1 / 5, m.z0 / 5], [m.x1 / 5, m.z1 / 5], [m.x0 / 5, m.z1 / 5]]);
    // The back of the front wall, where it stands taller than the rooms behind.
    wall.quad([FX + 0.6, 7, F.z0], [FX + 0.6, 7, F.z1], [FX + 0.6, WH, F.z1], [FX + 0.6, WH, F.z0], [1, 0, 0]);
    add(roof.mesh(snow));
    // Stone urns either side of the way in, as in the photographs.
    const urn = new THREE.CylinderGeometry(0.55, 0.3, 0.7, 12), ped = new THREE.BoxGeometry(0.9, 1.0, 0.9), bush = new THREE.SphereGeometry(0.5, 10, 8);
    const green = new THREE.MeshStandardMaterial({ color: 0x24402a, roughness: 0.9, emissive: 0x0e1c12, emissiveIntensity: 0.6 });
    for (const k of [-11.6, 11.6]) {
      const a = new THREE.Mesh(ped, trim), u = new THREE.Mesh(urn, trim), s2 = new THREE.Mesh(bush, green);
      a.position.set(PX - 1.0, 0.5, cz + k); u.position.set(PX - 1.0, 1.35, cz + k); s2.position.set(PX - 1.0, 1.85, cz + k); s2.scale.y = 0.7;
      add(a, u, s2);
      plan.obstacles.push({ x0: PX - 1.5, x1: PX - 0.5, z0: cz + k - 0.5, z1: cz + k + 0.5, y0: 0, y1: 2.2 });
    }
  }

  // ------------------------------------------------------------------- the streets
  {
    const urns = [], rampG = new Geo(), posts = new Geo(), railM = new THREE.MeshStandardMaterial({ color: 0x2a2d34, roughness: 0.4, metalness: 0.6, emissive: 0x15171c, emissiveIntensity: 0.6 }), cheek2 = new Geo(), road = new Geo(), paint = new Geo(), walk = new Geo(), kerb = new Geo(), drift = new Geo(), stepG = new Geo(), nosing = new Geo(), cheek = new Geo(), cope = new Geo(), balus = new Geo();
    const flat = (g, x0, x1, z0, z1, y, s = 4) => g.quad([x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1], [0, 1, 0], [[x0 / s, z0 / s], [x1 / s, z0 / s], [x1 / s, z1 / s], [x0 / s, z1 / s]]);
    const M = G.michigan, S = plan.street, SX = S.x, SY = S.y, way = id => S.ways.find(w => w.id === id);
    // A stretch that climbs east from the avenue's level to the museum's.
    const slope = (g, x0, x1, z0, z1, lift, s = 4) => { const ya = streetY(plan, x0 + 1e-4, (z0 + z1) / 2) + lift, yb = streetY(plan, x1 - 1e-4, (z0 + z1) / 2) + lift; g.quad([x0, ya, z0], [x1, yb, z0], [x1, yb, z1], [x0, ya, z1], [0, 1, 0], [[x0 / s, z0 / s], [x1 / s, z0 / s], [x1 / s, z1 / s], [x0 / s, z1 / s]]); };
    flat(road, M.x0, M.x1, B.z0, B.z1, SY + 0.004);
    for (const st of [G.monroe, G.jackson]) { flat(road, M.x1, SX, st.z0, st.z1, SY + 0.004); slope(road, SX, SX + 12, st.z0, st.z1, 0.004); flat(road, SX + 12, plan.lakefront ? plan.lakefront.lsd.x0 : B.x1, st.z0, st.z1, 0.004); }
    flat(road, G.columbus.x0, G.columbus.x1, G.monroe.z1, G.jackson.z0, 0.004);
    // Lane lines: dashes down the avenue, a double line up the middle.
    for (let z = B.z0; z < B.z1; z += 9) for (const x of [-19, -6.5]) flat(paint, x - 0.08, x + 0.08, z, z + 3.6, SY + 0.008);
    for (const x of [-12.9, -12.3]) flat(paint, x - 0.07, x + 0.07, B.z0, B.z1, SY + 0.008);
    for (let x = SX + 14; x < (plan.lakefront ? plan.lakefront.lsd.x0 - 4 : B.x1); x += 9) for (const z of [(G.monroe.z0 + G.monroe.z1) / 2, (G.jackson.z0 + G.jackson.z1) / 2]) flat(paint, x, x + 3.6, z - 0.08, z + 0.08, 0.008);
    for (let z = G.monroe.z1 + 6; z < G.jackson.z0; z += 9) flat(paint, 284.9, 285.1, z, z + 3.6, 0.008);
    // The crossing at Adams Street, opposite the door.
    for (let z = F.cz - 3.2; z < F.cz + 3.2; z += 0.9) flat(paint, M.x0 + 0.5, M.x1 - 0.5, z, z + 0.45, SY + 0.008);
    // The pavement, down at the avenue's level, under snow, with a strip shovelled along it and across to the steps.
    // Shovelled, the whole width of it: the city does the avenue's pavement. A ridge of what came off it lies along the kerb.
    flat(walk, M.x1, SX, B.z0, B.z1, SY + 0.008, 2.5);
    for (let z = B.z0; z < B.z1; z += 9) if (Math.abs(z + 3.5 - F.cz) > 6) drift.box(M.x1 + 0.15, M.x1 + 0.6, SY, SY + 0.07 + ((z * 7) % 5) * 0.012, z + 0.4, z + 7.2);
    // The pavements of the two side streets, climbing with them.
    for (const w of S.ways) if (w.road) { const st = w.id === 'monroe' ? G.monroe : G.jackson; for (const [a, b2] of [[w.z0, st.z0], [st.z1, w.z1]]) if (b2 - a > 0.2) { slope(walk, SX, SX + 12, a, b2, 0.008, 2.5); } }
    // The terrace before the door: snow, with a way shovelled from the head of the steps to the doors.
    flat(walk, SX + 5.6, F.PX, F.cz - 3.4, F.cz + 3.4, 0.006, 2.5); flat(walk, F.PX - 2.4, F.PX, F.cz - 11, F.cz + 11, 0.006, 2.5);
    kerb.box(M.x1 - 0.12, M.x1 + 0.12, SY, SY + 0.07, B.z0, B.z1);

    // The steps. Eight of them, the width of the pavilion, between the lions' blocks.
    { const w = way('steps'), n = 8, tread = 0.45, rise = -SY / n, x9 = SX + w.run + 0.02;
      // The stretches of z a flight keeps for its steps, between its ramps.
      const between = g => { const out = []; let z = g.z0; for (const [ra, rb] of [...(g.ramps || [])].sort((p, q) => p[0] - q[0])) { if (ra - z > 0.05) out.push([z, ra]); z = rb; } if (g.z1 - z > 0.05) out.push([z, g.z1]); return out; };
      // A ramp: one plain slope the length of the flight, with a kerb and a handrail each side.
      const ramp = (g, za, zb) => { const xa = SX, xb = SX + g.run, L = Math.hypot(g.run, -SY), ang = Math.atan2(-SY, g.run);
        rampG.quad([xa, SY + 0.01, za], [xa, SY + 0.01, zb], [xb, 0.01, zb], [xb, 0.01, za], [SY / L, g.run / L, 0], [[0, 0], [(zb - za) / 1.2, 0], [(zb - za) / 1.2, L / 1.2], [0, L / 1.2]]);
        for (const zz of [za, zb]) { rampG.quad([xa, SY, zz], [xb, SY, zz], [xb, 0.01, zz], [xa, SY + 0.01, zz], [0, 0, zz === za ? -1 : 1]);
          const zr = zz === za ? zz + 0.06 : zz - 0.06;
          const kerbM = new THREE.Mesh(new THREE.BoxGeometry(L, 0.07, 0.1), trim); kerbM.position.set((xa + xb) / 2, SY / 2 + 0.04, zr); kerbM.rotation.z = ang; add(kerbM);
          const rail = new THREE.Mesh(new THREE.BoxGeometry(L + 0.5, 0.035, 0.035), railM); rail.position.set((xa + xb) / 2, SY / 2 + 0.62, zr); rail.rotation.z = ang; add(rail);
          for (const t of [0.02, 0.5, 0.98]) posts.box(xa + g.run * t - 0.02, xa + g.run * t + 0.02, SY * (1 - t), SY * (1 - t) + 0.62, zr - 0.02, zr + 0.02); } };
      for (const [za, zb] of between(w)) for (let i = 0; i < n; i++) { const x0 = SX + (i < 4 ? i * tread : w.land[1] + (i - 4) * tread), top = SY + (i + 1) * rise; stepG.box(x0, x9, top - rise, top, za, zb); nosing.box(x0 - 0.03, x0 + 0.05, top - 0.035, top + 0.004, za, zb); }
      for (const [za, zb] of w.ramps || []) ramp(w, za, zb);
      // Its stone cheeks, stepping up with it, each carrying an urn of flowers on the landing and at the head.
      for (const sg of [-1, 1]) { const z0 = F.cz + sg * 11.1 - (sg < 0 ? 1.0 : 0), z1 = z0 + 1.0;
        cheek2.box(SX - 0.1, SX + 2.6, SY, SY / 2 + 0.55, z0, z1); cheek2.box(SX + 2.6, SX + 5.9, SY, 0.6, z0, z1);
        cope.box(SX - 0.16, SX + 2.66, SY / 2 + 0.55, SY / 2 + 0.67, z0 - 0.06, z1 + 0.06); cope.box(SX + 2.56, SX + 5.96, 0.6, 0.72, z0 - 0.06, z1 + 0.06);
        urns.push([SX + 1.3, SY / 2 + 0.67, (z0 + z1) / 2], [SX + 4.3, 0.72, (z0 + z1) / 2]); }
      const tr2 = way('north').run / n;
      for (const id of ['north', 'south']) { const g = way(id); for (const [za, zb] of g.ramps || []) ramp(g, za, zb); for (const [gz0, gz1] of between(g)) for (let i = 0; i < n; i++) { const x0 = SX + i * tr2, top = SY + (i + 1) * rise; stepG.box(x0, SX + g.run + 0.02, top - rise, top, gz0, gz1); nosing.box(x0 - 0.03, x0 + 0.05, top - 0.035, top + 0.004, gz0, gz1); }
        for (const zz of [g.z0, g.z1]) { cheek.box(SX - 0.15, SX + g.run + 0.3, SY, 0.5, zz - 0.22, zz + 0.22); cope.box(SX - 0.2, SX + g.run + 0.35, 0.5, 0.6, zz - 0.28, zz + 0.28); } } }
    // The wall that holds the terrace up, with its coping; and along the museum's own front a balustrade on top of it.
    for (const [a, b2] of S.walls) {
      cheek.quad([SX, SY, a], [SX, SY, b2], [SX, 0.02, b2], [SX, 0.02, a], [-1, 0, 0], [[a / 2, 0], [b2 / 2, 0], [b2 / 2, 0.6], [a / 2, 0.6]]);
      cope.box(SX - 0.1, SX + 0.34, -0.04, 0.1, a, b2);
      const z0 = Math.max(a, F.z0 - 2), z1 = Math.min(b2, F.z1 + 2);
      if (z1 - z0 > 1 && !(Math.abs((a + b2) / 2 - F.cz) < 12)) {
        const lo = Math.abs(z0 - F.cz) < 14 ? z0 + 1.05 : z0, hi = Math.abs(z1 - F.cz) < 14 ? z1 - 1.05 : z1;      // the lion's block takes the end nearest the steps
        cope.box(SX - 0.02, SX + 0.3, 0.1, 0.2, lo, hi); cope.box(SX - 0.06, SX + 0.34, 0.82, 0.96, lo, hi);
        for (let z = lo + 0.2; z < hi - 0.1; z += 0.36) balus.box(SX + 0.07, SX + 0.21, 0.2, 0.82, z - 0.07, z + 0.07);
        for (let z = lo; z <= hi + 0.01; z += Math.max(3.6, (hi - lo) / Math.max(1, Math.round((hi - lo) / 5.4)))) cope.box(SX - 0.08, SX + 0.36, 0.1, 1.04, z - 0.2, z + 0.2);
        plan.obstacles.push({ x0: SX, x1: SX + 0.3, z0: lo, z1: hi, y0: -0.05, y1: 1.0 });
      }
    }
    // The walls beside the two streets as they climb.
    for (const w of S.ways) if (w.road) { const zz = w.z0 < 0 ? w.z1 : w.z0, d = w.z0 < 0 ? 1 : -1; cheek.quad([SX, SY, zz], [SX + 12, SY, zz], [SX + 12, 0.02, zz], [SX, 0.02, zz], [0, 0, -d]); cheek.quad([SX + 12, SY, zz], [SX, SY, zz], [SX, 0.02, zz], [SX + 12, 0.02, zz], [0, 0, d]); cope.box(SX, SX + 12, -0.04, 0.1, zz - 0.17, zz + 0.17); }
    const at = TX.asphalt();
    add(road.mesh(new THREE.MeshStandardMaterial({ map: at, roughness: 0.55, emissiveMap: at, emissive: new THREE.Color(0.4, 0.45, 0.6), emissiveIntensity: 0.5, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 })));
    add(paint.mesh(new THREE.MeshBasicMaterial({ color: new THREE.Color(0.62, 0.6, 0.5), polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })));
    add(walk.mesh(new THREE.MeshStandardMaterial({ color: 0x9a968e, roughness: 0.85, emissive: 0x3a3f4f, emissiveIntensity: 0.5, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 })));
    add(kerb.mesh(base));
    const steps = new THREE.MeshStandardMaterial({ color: 0xbdb9b0, roughness: 0.85, emissive: 0x5a6078, emissiveIntensity: 0.62 });
    add(stepG.mesh(steps), cheek.mesh(stone), cope.mesh(trim), balus.mesh(trim));
    add(nosing.mesh(snow), cheek2.mesh(steps));
    add(rampG.mesh(new THREE.MeshStandardMaterial({ color: 0x8f8c85, roughness: 0.9, emissive: 0x3c4152, emissiveIntensity: 0.55 })), posts.mesh(railM));
    { const bowl = new THREE.CylinderGeometry(0.5, 0.26, 0.55, 12), leaf = new THREE.SphereGeometry(0.46, 10, 8), fl = new THREE.SphereGeometry(0.5, 10, 6);
      const green = new THREE.MeshStandardMaterial({ color: 0x24402a, roughness: 0.9, emissive: 0x0e1c12, emissiveIntensity: 0.6 }), red = new THREE.MeshStandardMaterial({ color: 0xb3202a, roughness: 0.8, emissive: 0x6a0d14, emissiveIntensity: 0.8 });
      for (const [x, y, z] of urns) { const u = new THREE.Mesh(bowl, trim), l = new THREE.Mesh(leaf, green), f = new THREE.Mesh(fl, red); u.position.set(x, y + 0.28, z); f.position.set(x, y + 0.6, z); f.scale.set(1.15, 0.32, 1.15); l.position.set(x, y + 0.82, z); l.scale.y = 0.7; add(u, f, l); } }
    const dm = snow.clone(); dm.polygonOffset = true; dm.polygonOffsetFactor = -1; dm.polygonOffsetUnits = -1; add(drift.mesh(dm));
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
      trees.setMatrixAt(i, M4.compose(new THREE.Vector3(t.x, streetY(plan, t.x, t.z), t.z), Q.setFromEuler(E.set(0, t.yaw, 0)), new THREE.Vector3(t.s * (wide ? 1.35 : 1), t.s * (wide ? 0.8 : 1.45), t.s * (wide ? 1.35 : 1))));
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

    // (The fountains and the sculpture are in statues.js.)
  }

  // ---------------------------------------------- skylights, as the roofs are seen from the air
  {
    const curb = new Geo(), glass = new Geo();
    for (const q of plan.masses) {
      const r = q.room;
      if (!r || !q.glass) continue;                       // only a room with sky over it has one (see addRoofs)
      const x0 = q.glass.x0 + 0.2, x1 = q.glass.x1 - 0.2, z0 = q.glass.z0 + 0.2, z1 = q.glass.z1 - 0.2, y = q.top;
      curb.box(x0 - 0.2, x1 + 0.2, y, y + 0.35, z0 - 0.2, z0); curb.box(x0 - 0.2, x1 + 0.2, y, y + 0.35, z1, z1 + 0.2); curb.box(x0 - 0.2, x0, y, y + 0.35, z0, z1); curb.box(x1, x1 + 0.2, y, y + 0.35, z0, z1);
      glass.quad([x0, y + 0.3, z0], [x1, y + 0.3, z0], [x1, y + 0.3, z1], [x0, y + 0.3, z1], [0, 1, 0]);
    }
    add(curb.mesh(base), glass.mesh(new THREE.MeshBasicMaterial({ map: TX.laylight(), color: new THREE.Color(0.3, 0.34, 0.46) })));
  }
  // The Modern Wing's glass, its sunshade, and the footbridge from the park (bridgeway.js).
  buildBridgeway(museum, plan);
  // The railway in its cutting, and the bridges over it.
  buildRailway(museum, plan);
  // Butler Field, Lake Shore Drive and the harbour (lakefront.js).
  buildLakefront(museum, plan);
  void T;

  // The Columbus Drive side, and the gardens as they lie from above.
  buildEastSide(museum, plan);
}
