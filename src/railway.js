// The railway. The Illinois Central's tracks run north and south through the middle of the museum
// in a cutting, well below the streets: the old building is on one side, the newer wings on the
// other, and Gunsaulus Hall crosses between them on a bridge. Monroe and Jackson cross on bridges
// of their own, the garden path on a footbridge.
//
// Modelled by hand from the look of the place: pale ballast, running rails, the gantries that carry
// the wires, stone balustrades along the top of the retaining walls, a couple of double-deck trains
// laid up for the night, and the cooling plant on the deck beside the hall.
//
// The shape of it (where it is open to the sky, the service ramps out of it, the walls) is decided
// in plan.js (`plan.cut`); this file only draws it. The width is the width the building leaves:
// three tracks, where the real cutting has many more.

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import * as TX from './textures.js';
import { Geo } from './geo.js';

// Ballast under a little snow, with nothing else on it.
function ballastTex() {
  const cv = document.createElement('canvas'); cv.width = cv.height = 256; const g = cv.getContext('2d'), r = TX.rng(4471);
  g.fillStyle = '#8f8a80'; g.fillRect(0, 0, 256, 256);
  for (let k = 0; k < 5200; k++) { const v = 95 + r() * 110 | 0; g.fillStyle = `rgba(${v},${v - 4},${v - 12},${0.25 + r() * 0.5})`; g.fillRect(r() * 256, r() * 256, 1 + r() * 2.5, 1 + r() * 2.5); }
  g.fillStyle = 'rgba(232,238,250,.55)';
  for (let k = 0; k < 90; k++) { g.beginPath(); g.ellipse(r() * 256, r() * 256, 6 + r() * 22, 3 + r() * 9, r() * 3, 0, 7); g.fill(); }
  const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
// One track seen from above: sleepers, two rails, ballast showing between. Across the picture is across the track.
function trackTex() {
  const cv = document.createElement('canvas'); cv.width = 128; cv.height = 128; const g = cv.getContext('2d'), r = TX.rng(907);
  g.fillStyle = '#857f74'; g.fillRect(0, 0, 128, 128);
  for (let k = 0; k < 900; k++) { const v = 90 + r() * 100 | 0; g.fillStyle = `rgba(${v},${v - 4},${v - 12},.5)`; g.fillRect(r() * 128, r() * 128, 2, 2); }
  g.fillStyle = '#4a3a2c'; for (let y = 6; y < 128; y += 32) g.fillRect(14, y, 100, 13);
  g.fillStyle = 'rgba(232,238,250,.5)'; for (let k = 0; k < 14; k++) g.fillRect(r() * 128, r() * 128, 6 + r() * 16, 3 + r() * 5);
  g.fillStyle = '#5b3f2c'; g.fillRect(31, 0, 9, 128); g.fillRect(88, 0, 9, 128);
  g.fillStyle = '#c3c9d2'; g.fillRect(33, 0, 4, 128); g.fillRect(90, 0, 4, 128);
  const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
// Board-marked concrete, stained where the water comes down it.
function concreteTex() {
  const cv = document.createElement('canvas'); cv.width = cv.height = 256; const g = cv.getContext('2d'), r = TX.rng(613);
  g.fillStyle = '#9b978f'; g.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 32) { g.fillStyle = `rgba(0,0,0,${0.05 + r() * 0.08})`; g.fillRect(0, y, 256, 2); }
  for (let x = 0; x < 256; x += 64) { g.fillStyle = 'rgba(0,0,0,.1)'; g.fillRect(x, 0, 2, 256); }
  for (let k = 0; k < 40; k++) { const x = r() * 256, w = 3 + r() * 14, gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, `rgba(40,36,30,${0.1 + r() * 0.25})`); gr.addColorStop(1, 'rgba(40,36,30,0)'); g.fillStyle = gr; g.fillRect(x, 0, w, 256); }
  for (let k = 0; k < 1600; k++) { g.fillStyle = `rgba(${r() > 0.5 ? '255,255,255' : '0,0,0'},${r() * 0.06})`; g.fillRect(r() * 256, r() * 256, 2, 2); }
  const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return t;
}

export function buildRailway(museum, plan) {
  const G = plan.grounds, R = G.rail, C = plan.cut, group = museum.group;
  if (!C || !C.open.length) return;
  const add = (...m) => { for (const x of m) { x.matrixAutoUpdate = false; x.updateMatrix(); group.add(x); } };
  const O = plan.obstacles, Y = C.y, { x0, x1 } = C;
  const lit = (map, e, k = 0.55, o = {}) => new THREE.MeshStandardMaterial({ map, roughness: 0.9, emissiveMap: map, emissive: new THREE.Color(...e), emissiveIntensity: k, ...o });
  const ash = TX.ashlar(), ct = concreteTex();
  const stone = lit(ash, [0.45, 0.43, 0.46], 0.52), concrete = lit(ct, [0.4, 0.42, 0.5], 0.5);
  const trim = new THREE.MeshStandardMaterial({ color: 0xbdb6a6, roughness: 0.85, emissive: 0x4a4d5c, emissiveIntensity: 0.55 });
  const steel = new THREE.MeshStandardMaterial({ color: 0x8a9199, roughness: 0.4, metalness: 0.6, emissive: 0x2a2e34, emissiveIntensity: 0.7 });
  const rust = new THREE.MeshStandardMaterial({ color: 0x5b4a3e, roughness: 0.8, emissive: 0x2a2420, emissiveIntensity: 0.8 });
  const black = new THREE.MeshBasicMaterial({ color: 0x020203 });
  const snow = new THREE.MeshStandardMaterial({ map: museum.snowTex, roughness: 0.95, emissiveMap: museum.snowTex, emissive: new THREE.Color(0.25, 0.3, 0.45), emissiveIntensity: 0.5 });

  // ---- a hole in the snow, so that the cutting can be seen into ----
  {
    const g = group.children.find(m => m.isMesh && m.geometry && m.geometry.type === 'PlaneGeometry' && Math.abs(m.position.y + 0.03) < 1e-6 && m.geometry.parameters.width > 300 && m.position.x + m.geometry.parameters.width / 2 > R.x1);
    if (g) {
      const w = g.geometry.parameters.width, h = g.geometry.parameters.height, px = g.position.x, pz = g.position.z;
      const sh = new THREE.Shape(); sh.moveTo(-w / 2, -h / 2); sh.lineTo(w / 2, -h / 2); sh.lineTo(w / 2, h / 2); sh.lineTo(-w / 2, h / 2); sh.closePath();
      for (const s of C.open) { const p = new THREE.Path(), a = x0 - px, b = x1 - px, c = -(s.z0 - pz), d = -(s.z1 - pz); p.moveTo(a, d); p.lineTo(a, c); p.lineTo(b, c); p.lineTo(b, d); p.closePath(); sh.holes.push(p); }
      const geo = new THREE.ShapeGeometry(sh), P = geo.attributes.position, uv = geo.attributes.uv;
      for (let i = 0; i < P.count; i++) uv.setXY(i, (P.getX(i) + w / 2) / w, (P.getY(i) + h / 2) / h);
      g.geometry.dispose(); g.geometry = geo;
    }
  }

  const floor = new Geo(), track = new Geo(), rails = new Geo(), wallS = new Geo(), wallC = new Geo(), mouth = new Geo(), cope = new Geo(), balus = new Geo(), ramp = new Geo(), gant = new Geo(), wire = new Geo(), cap = new Geo();
  const up = [0, 1, 0];
  // A balustrade standing on a wall top: along z when `along` is 'z', else along x. (a..b the run, c the middle of its thickness.)
  const balustrade = (along, a, b, c, y = 0) => {
    if (b - a < 0.5) return;
    const box = (g, lo, hi, y0, y1, t) => along === 'z' ? g.box(c - t, c + t, y0, y1, lo, hi) : g.box(lo, hi, y0, y1, c - t, c + t);
    box(cope, a, b, y, y + 0.14, 0.17); box(cope, a, b, y + 0.8, y + 0.94, 0.19); box(cap, a + 0.05, b - 0.05, y + 0.94, y + 0.99, 0.17);
    const n = Math.max(1, Math.round((b - a) / 4.4)), bay = (b - a) / n;
    for (let i = 0; i <= n; i++) { const p = a + bay * i; box(cope, Math.max(a, p - 0.22), Math.min(b, p + 0.22), y + 0.14, y + 1.02, 0.21); }
    for (let i = 0; i < n; i++) for (let p = a + bay * i + 0.42; p < a + bay * (i + 1) - 0.3; p += 0.34) box(balus, p - 0.065, p + 0.065, y + 0.14, y + 0.8, 0.065);
  };

  for (const s of C.open) {
    const { z0, z1 } = s, lo = Math.min(s.top, s.land), hi = Math.max(s.top, s.land), rz0 = Math.min(s.top, s.foot), rz1 = Math.max(s.top, s.foot);
    // The bed.
    floor.quad([x0, Y, z0], [x1, Y, z0], [x1, Y, z1], [x0, Y, z1], up, [[x0 / 3, z0 / 3], [x1 / 3, z0 / 3], [x1 / 3, z1 / 3], [x0 / 3, z1 / 3]]);
    // The tracks: the third one stops at a buffer short of the ramp.
    R.tracks.forEach((x, i) => {
      let a = z0, b = z1;
      if (i === 2) { if (s.up > 0) a = rz1 + 1.6; else b = rz0 - 1.6; }
      track.quad([x - 1.2, Y + 0.02, a], [x + 1.2, Y + 0.02, a], [x + 1.2, Y + 0.02, b], [x - 1.2, Y + 0.02, b], up, [[0, a / 2.4], [1, a / 2.4], [1, b / 2.4], [0, b / 2.4]]);
      for (const rx of [-0.72, 0.72]) rails.box(x + rx - 0.035, x + rx + 0.035, Y, Y + 0.16, a, b);
      if (i === 2) { const e = s.up > 0 ? a : b; gant.box(x - 1.0, x + 1.0, Y + 0.5, Y + 0.85, e - 0.15, e + 0.15); for (const rx of [-0.72, 0.72]) gant.box(x + rx - 0.08, x + rx + 0.08, Y, Y + 0.85, e - 0.12, e + 0.12); }
    });
    // The retaining walls, in stone, down both sides.
    const side = (X, nx, a, b) => wallS.quad(nx > 0 ? [X, Y, a] : [X, Y, b], nx > 0 ? [X, Y, b] : [X, Y, a], nx > 0 ? [X, 0.02, b] : [X, 0.02, a], nx > 0 ? [X, 0.02, a] : [X, 0.02, b], [nx, 0, 0], nx > 0 ? [[a / 2.6, 0], [b / 2.6, 0], [b / 2.6, -Y / 2.6], [a / 2.6, -Y / 2.6]] : [[b / 2.6, 0], [a / 2.6, 0], [a / 2.6, -Y / 2.6], [b / 2.6, -Y / 2.6]]);
    side(x0, 1, z0, z1); side(x1, -1, z0, z1);
    // The ends: a bridge's abutment in concrete, with the black mouths the tracks go into, a pier between them and the edge beam above.
    for (const [z, nz] of [[z0, 1], [z1, -1]]) {
      const q = (g, a, b, y0, y1, d = 0) => { const zz = z + nz * d; g.quad(nz > 0 ? [a, y0, zz] : [b, y0, zz], nz > 0 ? [b, y0, zz] : [a, y0, zz], nz > 0 ? [b, y1, zz] : [a, y1, zz], nz > 0 ? [a, y1, zz] : [b, y1, zz], [0, 0, nz], [[a / 3, y0 / 3], [b / 3, y0 / 3], [b / 3, y1 / 3], [a / 3, y1 / 3]]); };
      q(wallC, x0, x1, Y, 0.02);
      const atRamp = z === s.top;                          // the ramp's landing is against this end: only two mouths here
      R.tracks.forEach((x, i) => { if (i === 2 && atRamp) return; q(mouth, x - 1.35, x + 1.35, Y + 0.02, Y + 3.7, 0.02); });
      for (const x of [x0, (R.tracks[0] + R.tracks[1]) / 2, (R.tracks[1] + R.tracks[2]) / 2, x1]) { const a = Math.max(x0, x - 0.2), b = Math.min(x1, x + 0.2); gant.box(a, b, Y, Y + 3.8, Math.min(z, z + nz * 0.45), Math.max(z, z + nz * 0.45)); }
      wallC.box(x0, x1, Y + 3.8, -0.02, Math.min(z, z + nz * 0.5), Math.max(z, z + nz * 0.5));        // the edge beam
      balustrade('x', R.x0, R.x1, z - nz * 0.15);
    }
    // Balustrades along the top of both walls: the east one stands open at the head of the ramp.
    balustrade('z', z0, z1, (R.x0 + x0) / 2); balustrade('z', z0, lo, (x1 + R.x1) / 2); balustrade('z', hi, z1, (x1 + R.x1) / 2);
    cope.box(R.x0 - 0.04, x0 + 0.04, -0.06, 0.02, z0, z1); cope.box(x1 - 0.04, R.x1 + 0.04, -0.06, 0.02, z0, z1);
    // The service ramp up the east wall: a concrete lane on a solid wedge, a kerb on the side of the drop.
    {
      const L = C.lane, a = s.land, b = s.foot, n = 12;
      ramp.quad([L, 0.01, lo], [x1, 0.01, lo], [x1, 0.01, hi], [L, 0.01, hi], up, [[0, lo / 3], [0.7, lo / 3], [0.7, hi / 3], [0, hi / 3]]);
      const A = s.up > 0 ? [[L, 0.01, a], [x1, 0.01, a], [x1, Y + 0.01, b], [L, Y + 0.01, b]] : [[L, Y + 0.01, b], [x1, Y + 0.01, b], [x1, 0.01, a], [L, 0.01, a]];
      ramp.quad(A[0], A[1], A[2], A[3], up, [[0, a / 3], [0.7, a / 3], [0.7, b / 3], [0, b / 3]]);
      // its side: the landing's, then the wedge's, facing the tracks
      const Wd = (za, zb, ya, yb) => { const p = za < zb ? [[L, Y, zb], [L, Y, za], [L, ya, za], [L, yb, zb]] : [[L, Y, za], [L, Y, zb], [L, yb, zb], [L, ya, za]]; ramp.quad(p[0], p[1], p[2], p[3], [-1, 0, 0], [[0, 0], [1, 0], [1, 1], [0, 1]]); };
      Wd(lo, hi, 0, 0); Wd(a, b, 0, Y);
      for (let i = 0; i < n; i++) { const za = a + (b - a) * i / n, zb = a + (b - a) * (i + 1) / n, top = Y * i / n + 0.3; cope.box(L - 0.12, L, Math.min(top - 0.75, Y * (i + 1) / n), top, Math.min(za, zb), Math.max(za, zb)); }
      cope.box(L - 0.12, L, 0, 0.95, lo, hi);
    }
    // Gantries for the wires, clear of the ramp, and the wires themselves.
    const g0 = s.up > 0 ? rz1 + 6 : z0 + 8, g1 = s.up > 0 ? z1 - 8 : rz0 - 6, n = Math.max(1, Math.round((g1 - g0) / 24));
    for (let i = 0; i <= n; i++) {
      const z = g0 + (g1 - g0) * i / n;
      for (const x of [x0 + 0.28, x1 - 0.28]) { gant.box(x - 0.11, x + 0.11, Y, 2.3, z - 0.11, z + 0.11); gant.box(x - 0.3, x + 0.3, Y, Y + 0.5, z - 0.3, z + 0.3); O.push({ x0: x - 0.14, x1: x + 0.14, z0: z - 0.14, z1: z + 0.14, y0: Y, y1: 2.4 }); }
      gant.box(x0 + 0.2, x1 - 0.2, 1.75, 1.93, z - 0.09, z + 0.09); gant.box(x0 + 0.2, x1 - 0.2, 2.2, 2.32, z - 0.07, z + 0.07);
      for (let x = x0 + 0.6; x < x1 - 0.8; x += 0.9) gant.box(x, x + 0.06, 1.93, 2.2, z - 0.04, z + 0.04);
      O.push({ x0, x1, z0: z - 0.1, z1: z + 0.1, y0: 1.7, y1: 2.35 });
      R.tracks.forEach(x => gant.box(x - 0.03, x + 0.03, 1.3, 1.75, z - 0.03, z + 0.03));
    }
    R.tracks.forEach((x, i) => { const a = i === 2 && s.up > 0 ? rz1 + 2 : z0, b = i === 2 && s.up < 0 ? rz0 - 2 : z1; wire.box(x - 0.012, x + 0.012, 1.28, 1.305, a, b); wire.box(x - 0.012, x + 0.012, 1.6, 1.625, a, b); });
  }
  const bt = ballastTex(), tt = trackTex();
  add(floor.mesh(lit(bt, [0.42, 0.45, 0.58], 0.6)), track.mesh(lit(tt, [0.42, 0.45, 0.58], 0.6, { polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 })), rails.mesh(steel));
  add(wallS.mesh(stone), wallC.mesh(concrete), ramp.mesh(concrete), mouth.mesh(black), cope.mesh(trim), balus.mesh(trim), gant.mesh(rust), cap.mesh(snow));
  add(wire.mesh(new THREE.MeshBasicMaterial({ color: new THREE.Color(0.035, 0.04, 0.05) })));

  // ---- the cooling plant: a row of fan units on the deck beside the hall ----
  {
    const s2 = C.open[1], unit = new Geo(), dark = new Geo(), fans = [];
    const row = (zc, n) => { for (let i = 0; i < n; i++) {
      const xc = x0 + 1.5 + i * 2.55, a = xc - 1.1, b = xc + 1.1, c = zc - 1.15, d = zc + 1.15;
      unit.box(a, b, 0.25, 2.3, c, d); dark.box(a + 0.1, b - 0.1, 0, 0.25, c + 0.1, d - 0.1);
      for (let y = 0.5; y < 2.0; y += 0.22) { dark.box(a - 0.02, b + 0.02, y, y + 0.09, c + 0.12, d - 0.12); dark.box(a + 0.12, b - 0.12, y, y + 0.09, c - 0.02, d + 0.02); }
      fans.push([xc, 2.36, zc]);
      O.push({ x0: a, x1: b, z0: c, z1: d, y0: 0, y1: 2.6 });
    } };
    if (s2) row(s2.z1 + 1.75, 3);
    if (fans.length) {
      const ring = new THREE.CylinderGeometry(0.92, 0.92, 0.16, 20, 1, true), hub = new THREE.CylinderGeometry(0.2, 0.2, 0.1, 10), blade = new THREE.BoxGeometry(1.7, 0.03, 0.26);
      const geos = []; for (const [x, y, z] of fans) { geos.push(ring.clone().translate(x, y, z).toNonIndexed(), hub.clone().translate(x, y, z).toNonIndexed()); for (let k = 0; k < 3; k++) geos.push(blade.clone().rotateY(k * Math.PI / 3 + x).translate(x, y, z).toNonIndexed()); }
      add(new THREE.Mesh(mergeGeometries(geos), new THREE.MeshStandardMaterial({ color: 0x2b2e33, roughness: 0.6, metalness: 0.4, emissive: 0x15171b, emissiveIntensity: 0.9, side: THREE.DoubleSide })));
      add(unit.mesh(new THREE.MeshStandardMaterial({ color: 0xc9ccd0, roughness: 0.6, metalness: 0.3, emissive: 0x555a66, emissiveIntensity: 0.6 })), dark.mesh(new THREE.MeshStandardMaterial({ color: 0x3a3d43, roughness: 0.7, emissive: 0x1c1e23, emissiveIntensity: 0.8 })));
    }
  }

  // ---- the trains ----
  const carriage = TX.carriage();
  const train = (t, y0) => {
    const ct = carriage, sides = new Geo(), body = new Geo(), under = new Geo(), blue = new Geo(), orange = new Geo(), lit = new Geo(), red = new Geo(), rails = new Geo(), cap = new Geo(), glass = new Geo();
      const X = t.x, hw = 1.45, wheelsAt = [];
      
      const bogie = z => {
        under.box(X - 1.08, X + 1.08, 0.4, 0.8, z - 1.55, z + 1.55);
        for (const dz of [-0.95, 0.95]) { for (const rx of [-0.72, 0.72]) wheelsAt.push([X + rx, 0.6, z + dz]); under.box(X - 0.72, X + 0.72, 0.52, 0.68, z + dz - 0.07, z + dz + 0.07); }
      };
      const coach = (a, b, last) => {
        const len = b - a;
        for (const [x, nx] of [[X - hw, -1], [X + hw, 1]]) sides.quad([x, 1.05, a], [x, 1.05, b], [x, 4.6, b], [x, 4.6, a], [nx, 0, 0], [[0, 0], [len / 9.5, 0], [len / 9.5, 1], [0, 1]]);
        body.box(X - hw, X + hw, 1.05, 4.6, a, a + 0.03); body.box(X - hw, X + hw, 1.05, 4.6, b - 0.03, b);
        body.box(X - hw + 0.12, X + hw - 0.12, 4.6, 4.82, a + 0.1, b - 0.1); body.box(X - hw + 0.4, X + hw - 0.4, 4.82, 4.95, a + 0.3, b - 0.3);       // the roof, stepped in
        cap.box(X - hw + 0.42, X + hw - 0.42, 4.95, 5.0, a + 0.32, b - 0.32);
        under.box(X - hw + 0.08, X + hw - 0.08, 0.8, 1.05, a + 0.05, b - 0.05);                                              // the frame
        under.box(X - 1.25, X + 1.25, 0.28, 0.8, a + len * 0.36, a + len * 0.64);                                            // tanks and boxes slung under the middle
        bogie(a + 2.7); bogie(b - 2.7);
        lit.box(X - 0.4, X + 0.4, 1.5, 3.3, a - 0.015, a); lit.box(X - 0.4, X + 0.4, 1.5, 3.3, b, b + 0.015);                // the door in each end, the light left on behind it
        under.box(X - 0.12, X + 0.12, 0.85, 1.0, a - 0.5, a); under.box(X - 0.12, X + 0.12, 0.85, 1.0, b, b + 0.5);          // couplers
        if (last) for (const sx of [-1, 1]) red.box(X + sx * 1.0 - 0.1, X + sx * 1.0 + 0.1, 1.5, 1.7, b + 0.016, b + 0.04);
      };
      // The locomotive: a cab with a sloped nose looking north, a long hood behind it, a stripe down the side.
      const L = 17, gap = 1, cl = (t.z1 - t.z0 - L - 2 * gap) / 2, la = t.z0, lb = la + L;
      blue.box(X - hw, X + hw, 1.1, 4.3, la + 2.6, lb); blue.box(X - hw, X + hw, 1.1, 3.0, la, la + 2.6);
      blue.quad([X - hw, 3.0, la], [X + hw, 3.0, la], [X + hw, 4.3, la + 2.6], [X - hw, 4.3, la + 2.6], [0, 0.89, -0.45]);
      for (const sx of [-1, 1]) blue.quad([X + sx * hw, 3.0, la], [X + sx * hw, 3.0, la + 2.6], [X + sx * hw, 4.3, la + 2.6], [X + sx * hw, 3.0, la], [sx, 0, 0]);
      glass.quad([X - 1.1, 3.25, la + 0.44], [X + 1.1, 3.25, la + 0.44], [X + 1.1, 4.0, la + 1.94], [X - 1.1, 4.0, la + 1.94], [0, 0.89, -0.45]);              // the windscreen
      for (const sx of [-1, 1]) glass.box(X + sx * hw - 0.012, X + sx * hw + 0.012, 3.3, 4.0, la + 2.8, la + 4.2);                                              // cab side windows
      orange.box(X - hw - 0.012, X + hw + 0.012, 2.1, 2.55, la + 0.3, lb - 0.2); orange.box(X - hw - 0.012, X + hw + 0.012, 1.1, 1.3, la, lb);
      body.box(X - hw + 0.1, X + hw - 0.1, 4.3, 4.48, la + 3, lb - 0.3); body.box(X - 0.55, X + 0.55, 4.48, 4.85, la + 8, la + 10.6); cap.box(X - hw + 0.12, X + hw - 0.12, 4.48, 4.53, la + 11, lb - 0.4);
      for (const zz of [la + 5.2, la + 7.4, la + 11.6, la + 13.8]) for (const sx of [-1, 1]) under.box(Math.min(X + sx * hw, X + sx * (hw + 0.015)), Math.max(X + sx * hw, X + sx * (hw + 0.015)), 2.8, 3.9, zz, zz + 1.7);   // louvres
      under.box(X - hw + 0.08, X + hw - 0.08, 0.8, 1.1, la + 0.05, lb - 0.05); under.box(X - 1.3, X + 1.3, 0.25, 0.8, la + 6.4, la + 10.8);                    // frame and fuel tank
      under.box(X - 1.4, X + 1.4, 0.3, 0.9, la - 0.25, la + 0.05);                                                                                              // the pilot, down at the rails
      bogie(la + 3.2); bogie(lb - 3.2);
      for (const sx of [-1, 1]) lit.box(X + sx * 0.5 - 0.13, X + sx * 0.5 + 0.13, 2.65, 2.9, la - 0.02, la);                                                    // headlamps, dimmed
      under.box(X - 0.12, X + 0.12, 0.85, 1.0, lb, lb + 0.5);
      coach(lb + gap, lb + gap + cl, false); coach(lb + 2 * gap + cl, t.z1, true);
      const wheel = new THREE.CylinderGeometry(0.46, 0.46, 0.12, 16); wheel.rotateZ(Math.PI / 2);
      const steel = new THREE.MeshStandardMaterial({ color: 0x8a9199, roughness: 0.4, metalness: 0.6, emissive: 0x2a2e34, emissiveIntensity: 0.7 }), darkM = new THREE.MeshStandardMaterial({ color: 0x15171a, roughness: 0.7, emissive: 0x0a0b0d, emissiveIntensity: 0.8 });
      const parts = [sides.mesh(new THREE.MeshStandardMaterial({ map: ct, roughness: 0.4, metalness: 0.5, emissiveMap: ct, emissive: 0xffffff, emissiveIntensity: 0.7 })), body.mesh(steel), under.mesh(darkM), rails.mesh(steel),
        blue.mesh(new THREE.MeshStandardMaterial({ color: 0x1c3f8a, roughness: 0.5, metalness: 0.3, emissive: 0x0e2048, emissiveIntensity: 0.8, side: THREE.DoubleSide })),
        orange.mesh(new THREE.MeshStandardMaterial({ color: 0xe8731c, roughness: 0.5, emissive: 0x7a3a0c, emissiveIntensity: 0.8 })),
        glass.mesh(new THREE.MeshBasicMaterial({ color: new THREE.Color(0.05, 0.07, 0.11), side: THREE.DoubleSide })),
        lit.mesh(new THREE.MeshBasicMaterial({ color: new THREE.Color(1.5, 1.1, 0.55) })), red.mesh(new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 0.15, 0.1) })), cap.mesh(snow),
        new THREE.Mesh(mergeGeometries(wheelsAt.map(([x, y, z]) => wheel.clone().translate(x, y, z))), steel)];
      for (const m of parts) { m.position.y = y0; add(m); }
  };
  for (const t of G.trains || []) train(t, Y);
}
