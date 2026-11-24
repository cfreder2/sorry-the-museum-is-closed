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
import { iceMaterial, iceBlockMaterial } from './icelook.js';
import { HSTEP } from './icefield.js';
import { canGeo, canMaterial, bollardGeo, boatGeo, kitMaterial, dealLOD } from './harbourkit.js';
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
  // Slabs tipped up along the edge and on the ridges (ramps), and blocks shoved up beside them: broken ice (icelook.js
  // iceBlockMaterial reads what each point is from its colour: red a top that snow lies on, green how thin, so how far the
  // light comes through, blue how far down towards its foot). The top is exactly where the solid is (harbourplan.js), a
  // rectangle; but nothing broken off a sheet is a rectangle, so its outline is knocked in at the corners and along
  // its edges (never out: by 6 cm at most, inside the solid), the lip round the top is chipped away below it, the taller
  // ones are broken in facets down their sides, and they spread a little at the foot where the rubble lies.
  const SNOW = [1, 0, 0], LIP = [0.45, 1, 0], ICE_HI = [0, 0.55, 0.1], ICE_MID = [0, 0.3, 0.5], ICE_LO = [0, 0.12, 1], UNDER = [0, 0.5, 0.55];
  const tri = (g, a, b, c, ca, cb, cc, want, na, nb, nc) => {        // a triangle, a colour at each corner, turned to face `want` (its own flat normal unless one is given for each corner)
    const e1 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], e2 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    let n = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]]; const l = Math.hypot(...n) || 1; n = n.map(v => v / l);
    const flip = n[0] * want[0] + n[1] * want[1] + n[2] * want[2] < 0; if (flip) n = n.map(v => -v);
    const i = g.p.length / 3, V = flip ? [a, c, b] : [a, b, c], K = flip ? [ca, cc, cb] : [ca, cb, cc], Nn = na ? (flip ? [na, nc, nb] : [na, nb, nc]) : [n, n, n];
    for (let k = 0; k < 3; k++) { g.p.push(...V[k]); g.n.push(...Nn[k]); g.uv.push(0, 0); g.c.push(...K[k]); }
    g.idx.push(i, i + 1, i + 2);
  };
  const sq = (g, v, n, uv, cols) => { tri(g, v[0], v[1], v[2], cols[0], cols[1], cols[2], n); tri(g, v[0], v[2], v[3], cols[0], cols[2], cols[3], n); };
  // A slab: top H(x, z) over the rectangle, its sides down to Bot(x, z); `bv` the lip broken off round the top.
  // `o.under`: it has an underside (a plate tipped up out of the ice); `o.plain`: its outline is left square (the launch ramps, whose edges are jumped from).
  const solid = (x0, x1, za, zb, H, Bot, bv, seed, o = {}) => {
    const r = TX.rng(seed), cx = (x0 + x1) / 2, cz = (za + zb) / 2, small = Math.min(x1 - x0, zb - za), cut = o.plain ? 0.012 : Math.min(0.06, small * 0.14), wob = o.plain ? 0 : Math.min(0.03, small * 0.06);
    const P = [];
    for (const [ax, az, bx, bz] of [[x0, za, x1, za], [x1, za, x1, zb], [x1, zb, x0, zb], [x0, zb, x0, za]]) {
      const l = Math.hypot(bx - ax, bz - az), ux = (bx - ax) / l, uz = (bz - az) / l, at = (d, inn) => [ax + ux * d - uz * inn, az + uz * d + ux * inn];
      if (small < 0.5 && !o.plain) { P.push(at(cut * r() * 1.6, cut * r() * 1.2)); continue; }      // (a small lump: four corners, each knocked in its own way)
      P.push(at(cut * (0.5 + r()), r() * wob * 0.4)); if (l > 1.6) P.push(at(l * (0.35 + 0.3 * r()), r() * wob)); P.push(at(l - cut * (0.5 + r()), r() * wob * 0.4));
    }
    const n = P.length, tall = !o.under && H(cx, cz) - Bot(cx, cz) > 0.22, seen = o.under && Math.max(Bot(x0, za), Bot(x1, za), Bot(x0, zb), Bot(x1, zb)) > 0.2;      // (an underside is drawn only where it is high enough to be looked under)
    const out = P.map(([x, z]) => { const l = Math.hypot(x - cx, z - cz) || 1; return [(x - cx) / l, (z - cz) / l]; });
    const nt = (() => { const a = [x0, H(x0, za), za], b = [x1, H(x1, za), za], d = [x0, H(x0, zb), zb], u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], w = [d[0] - a[0], d[1] - a[1], d[2] - a[2]], q = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]]; const l = Math.hypot(...q) * (q[1] < 0 ? -1 : 1); return q.map(c => c / l); })();
    const I = P.map(([x, z], i) => { const j = bv * (0.9 + 1.5 * r()); return [x - out[i][0] * j, H(x - out[i][0] * j, z - out[i][1] * j), z - out[i][1] * j]; });      // where the level top ends
    const E = P.map(([x, z]) => [x, H(x, z) - bv * (0.6 + 0.9 * r()), z]);                                                                          // the chipped lip, below it
    const M = tall ? P.map(([x, z], i) => { const k = r() * 0.05 - 0.02, t = 0.35 + 0.3 * r(), y = E[i][1] + (Bot(x, z) - E[i][1]) * t; return [x + out[i][0] * k, y, z + out[i][1] * k]; }) : null;
    const F = P.map(([x, z], i) => { const k = o.under ? r() * 0.012 : 0.01 + r() * 0.05; return [x + out[i][0] * k, Bot(x, z), z + out[i][1] * k]; });      // the foot (spread a little where it stands on the sheet)
    const top = [cx, H(cx, cz), cz];
    for (let i = 0; i < n; i++) {
      const k = (i + 1) % n, side = [out[i][0] + out[k][0], 0.2, out[i][1] + out[k][1]], lipN = [side[0] * 0.5 + nt[0], nt[1], side[2] * 0.5 + nt[2]].map((v, _, a) => v / Math.hypot(...a));
      if (n === 4) tri(slab, top, E[i], E[k], SNOW, LIP, LIP, nt, nt, lipN, lipN);      // (a small lump has no level top to speak of: it runs straight out to its chipped lip)
      else { tri(slab, top, I[i], I[k], SNOW, SNOW, SNOW, nt, nt, nt, nt);
        tri(slab, I[i], I[k], E[k], SNOW, SNOW, LIP, lipN, nt, nt, lipN); tri(slab, I[i], E[k], E[i], SNOW, LIP, LIP, lipN, nt, lipN, lipN); }
      if (M) { tri(slab, E[i], E[k], M[k], ICE_HI, ICE_HI, ICE_MID, side); tri(slab, E[i], M[k], M[i], ICE_HI, ICE_MID, ICE_MID, side); tri(slab, M[i], M[k], F[k], ICE_MID, ICE_MID, ICE_LO, side); tri(slab, M[i], F[k], F[i], ICE_MID, ICE_LO, ICE_LO, side); }
      else { tri(slab, E[i], E[k], F[k], ICE_HI, ICE_HI, o.under ? ICE_MID : ICE_LO, side); tri(slab, E[i], F[k], F[i], ICE_HI, o.under ? ICE_MID : ICE_LO, o.under ? ICE_MID : ICE_LO, side); }
      if (o.under && seen) tri(slab, [cx, Bot(cx, cz), cz], F[i], F[k], UNDER, UNDER, UNDER, nt.map(c => -c));
    }
  };
  L.slabs.forEach((q, i) => {
    const { x0, x1, z0: za, z1: zb } = q;
    if (q.kind === 'block') { solid(x0, x1, za, zb, () => q.h, () => -0.02, Math.min(0.045, q.h * 0.22), 700 + i); return; }
    // a tipped plate: its top, its underside (where it is out of the ice), its broken edges round about
    const H = (x, z) => q.axis === 'x' ? q.h0 + (q.h1 - q.h0) * (x - x0) / (x1 - x0) : q.h0 + (q.h1 - q.h0) * (z - za) / (zb - za);
    solid(x0, x1, za, zb, H, (x, z) => H(x, z) - q.T, 0.035, 700 + i, { under: true, plain: !!q.launch });
  });
  // The slab of ice shoved up against the breakwater: the way up onto it from the last of the floes.
  { const q = L.ramp, g = (q.h1 - q.h0) / (q.x1 - q.x0), lo = WY - 0.15;
    solid(q.x0, q.x1, q.z0, q.z1, x => q.h0 + g * (x - q.x0), () => lo, 0.04, 699); }
  // Cracks running back into the ice from the edge.
  for (const pts of L.cracks) for (let i = 0; i + 1 < pts.length; i++) {
    const [xa, za] = pts[i], [xb, zb] = pts[i + 1], l = Math.hypot(xb - xa, zb - za) || 1, w = 0.018 * (1 - i / pts.length) + 0.007, px = -(zb - za) / l * w, pz = (xb - xa) / l * w;
    crack.quad([xa - px, 0.015, za - pz], [xa + px, 0.015, za + pz], [xb + px, 0.015, zb + pz], [xb - px, 0.015, zb - pz], [0, 1, 0]);
  }

  // ---- the breakwater, and its light: a red and white tower on a plinth, a gallery with a rail round it, and the
  // lantern up top (the lamp in it, and its beam, are harbour.js's: they turn)
  { const b = L.breakwater; stone.box(b.x0, b.x1, WY - 0.3, 1.2, b.z0, b.z1, 1.4); snow.box(b.x0 + 0.04, b.x1 - 0.04, 1.2, 1.27, b.z0 + 0.04, b.z1 - 0.04);      // (the snow from end to end and edge to edge: it is the top the toy drives on, plan.js)
    // the snow on it rolls over its edges a little, and at the waterline the spray has frozen onto the stone in a
    // ragged white foot (nothing a toy can reach: it stands in open water)
    { const lips = [], rr = TX.rng(5521);
      for (const [x, za, zb] of [[b.x0, b.z0, b.z1], [b.x1, b.z0, b.z1]]) lips.push(new THREE.CylinderGeometry(0.05, 0.05, zb - za, 10, 1, true).rotateX(Math.PI / 2).translate(x, 1.222, (za + zb) / 2));
      for (const z of [b.z0, b.z1]) lips.push(new THREE.CylinderGeometry(0.05, 0.05, b.x1 - b.x0, 10, 1, true).rotateZ(Math.PI / 2).translate((b.x0 + b.x1) / 2, 1.222, z));
      L.bwLips = mergeGeometries(lips);
      const foot = (xa, za, xb, zb, nx, nz) => { const len = Math.hypot(xb - xa, zb - za), n = Math.ceil(len / 0.7); let pw = 0.2 + rr() * 0.25, ph = 0.1 + rr() * 0.3;
        for (let i = 0; i < n; i++) { const w = 0.14 + rr() * 0.4, h = 0.06 + rr() * 0.36, t0 = i / n, t1 = (i + 1) / n, x0 = xa + (xb - xa) * t0, z0 = za + (zb - za) * t0, x1 = xa + (xb - xa) * t1, z1 = za + (zb - za) * t1;
          if (!(L.ramp && nx < 0 && Math.max(z0, z1) > L.ramp.z0 - 0.3 && Math.min(z0, z1) < L.ramp.z1 + 0.3))
            sq(slab, [[x0, WY + ph, z0], [x1, WY + h, z1], [x1 + nx * w, WY + 0.02, z1 + nz * w], [x0 + nx * pw, WY + 0.02, z0 + nz * pw]], [nx * 0.6, 1, nz * 0.6], [[t0 * len / 2.6, 0], [t1 * len / 2.6, 0], [t1 * len / 2.6, 0.2], [t0 * len / 2.6, 0.2]], [SNOW, SNOW, ICE_HI, ICE_HI]);
          pw = w; ph = h; } };
      foot(b.x0, b.z0, b.x0, b.z1, -1, 0); foot(b.x1, b.z0, b.x1, b.z1, 1, 0); foot(b.x0, b.z0, b.x1, b.z0, 0, -1); foot(b.x0, b.z1, b.x1, b.z1, 0, 1); }
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

  // ---- the mooring cans (harbourkit.js): a few riding in the open water past the breakwater, and the harbour's own
  // moorings frozen into the sheet in their rows (harbourplan.js), each a little askew as the ice took it. Each kind of
  // thing that stands about in numbers is two instanced meshes, one to be seen from near and a plain one for far off;
  // harbour.js deals the instances between them as the camera moves (harbourkit.js dealLOD). All far, to begin with.
  L.lod = [];
  const lodPair = (near, far, items, R) => { for (const m of [near, far]) { m.userData.harbourAdd = true; m.count = 0; group.add(m); } L.lod.push({ near, far, items, R2: R * R }); };
  {
    const r = TX.rng(4471), at = [], b = L.breakwater;
    for (let i = 0; i < 14; i++) { const x = b.x1 + 4 + r() * 12, z = b.z0 + r() * (b.z1 - b.z0); if (!L.bits.some(q => Math.hypot(q.x - x, q.z - z) < q.rad + 0.6) && !L.floes.some(f => Math.hypot(f.hx - x, f.hz - z) < f.reach + f.drift + 0.6)) at.push([x, z, 0.8]); }
    const moor = L.moorings || [], n = at.length + moor.length, cm = canMaterial(), items = [], Q = new THREE.Quaternion(), E = new THREE.Euler(), V = new THREE.Vector3(), Sc = new THREE.Vector3();
    const blue = new THREE.Color(0.05, 0.16, 0.5), red = new THREE.Color(0.5, 0.05, 0.04);
    at.forEach(([x, z, s], i) => items.push({ x, z, M: new THREE.Matrix4().compose(V.set(x, WY + 0.12, z), Q.setFromEuler(E.set(0, i * 2.1, 0)), Sc.set(s, s, s)), col: blue }));
    moor.forEach(q => items.push({ x: q.x, z: q.z, M: new THREE.Matrix4().compose(V.set(q.x, 0.12 * q.s, q.z), Q.setFromEuler(E.set(q.tip, q.yaw, q.tip * 0.6)), Sc.set(q.s, q.s, q.s)), col: q.red ? red : blue }));
    lodPair(new THREE.InstancedMesh(canGeo(false), cm, n), new THREE.InstancedMesh(canGeo(true), cm, n), items, 13);
    L.canWas = at.length;      // (how many of them were there before the moorings: for the count of what has been added)
  }
  // ---- the boats frozen in by the shore, and the bollards along the revetment (harbourkit.js; solid: harbourplan.js)
  { const km = kitMaterial({ side: THREE.DoubleSide });
    for (const q of L.boats || []) { const m = new THREE.Mesh(boatGeo(q.hull), km); m.rotation.set(0, q.dir > 0 ? 0 : Math.PI, q.heel); m.position.set(q.x, -0.075, q.z); m.userData.harbourAdd = true; add(m); }
    const bl = L.bollards || [];
    if (bl.length) { const bm = kitMaterial(); lodPair(new THREE.InstancedMesh(bollardGeo(false), bm, bl.length), new THREE.InstancedMesh(bollardGeo(true), bm, bl.length), bl.map((q, i) => ({ x: q.x, z: q.z, M: new THREE.Matrix4().makeRotationY(i * 1.3).setPosition(q.x, q.y, q.z) })), 10); } }
  dealLOD(L.lod, 1e5, 0, 0);
  // ---- the stakes down both sides of the marked way over the ice (harbourplan.js): a lath, its top third orange, a
  // band of reflector under that, and a scrap of orange rag tied on. One mesh.
  if (L.stakes && L.stakes.length) {
    const parts = [], col = (g, r, gg, b) => { const n = g.attributes.position.count, c = new Float32Array(n * 3); for (let i = 0; i < n; i++) { c[i * 3] = r; c[i * 3 + 1] = gg; c[i * 3 + 2] = b; } g.setAttribute('color', new THREE.BufferAttribute(c, 3)); return g.index ? g.toNonIndexed() : g; };
    for (const q of L.stakes) {
      const m = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(q.lean, q.yaw, q.lean * 0.5)).setPosition(q.x, 0, q.z);
      parts.push(col(new THREE.CylinderGeometry(0.013, 0.016, 0.52, 5, 1, true).translate(0, 0.26, 0), 0.2, 0.15, 0.1).applyMatrix4(m));
      parts.push(col(new THREE.CylinderGeometry(0.0145, 0.0145, 0.07, 5, 1, true).translate(0, 0.555, 0), 2.6, 2.6, 2.4).applyMatrix4(m));
      parts.push(col(new THREE.CylinderGeometry(0.004, 0.013, 0.2, 5, 1, true).translate(0, 0.69, 0), 1.5, 0.42, 0.06).applyMatrix4(m));
      const rag = new THREE.BufferGeometry(); rag.setAttribute('position', new THREE.Float32BufferAttribute([0.012, 0.76, 0, 0.012, 0.66, 0, 0.17, 0.69, 0.02, 0.012, 0.76, 0, 0.17, 0.69, 0.02, 0.012, 0.66, 0], 3)); rag.setAttribute('normal', new THREE.Float32BufferAttribute([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1], 3)); rag.setAttribute('uv', new THREE.Float32BufferAttribute(new Array(12).fill(0), 2));
      parts.push(col(rag, 1.3, 0.34, 0.05).applyMatrix4(m));
    }
    const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, emissive: 0xffffff, emissiveIntensity: 0.3 });
    m.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n\ttotalEmissiveRadiance *= vColor.rgb;'); };
    const sm = new THREE.Mesh(mergeGeometries(parts), m); sm.userData.harbourAdd = true; add(sm);
  }

  // ---- materials
  // The ice (src/icelook.js): looked into, mirroring, with the snow lying on it where the ice field (icefield.js) has it.
  const iceM = L.iceField ? iceMaterial({ field: L.iceField, mirror: museum.mirror, params: off(-1) }) : new THREE.MeshStandardMaterial({ color: 0xc6d8ec, roughness: 0.18, emissive: new THREE.Color(0.2, 0.26, 0.4), emissiveIntensity: 0.6, ...off(-1) });
  add(road.mesh(asphaltMaterial()), walk.mesh(walkMaterial()));
  { const pm = paint.mesh(paintMaterial(false)); pm.renderOrder = -3; for (let i = 0, uv = pm.geometry.attributes.uv; i < uv.count; i++) uv.setXY(i, 0.25, uv.getY(i) + uv.getX(i)); add(pm); }      // (the middle of the fresh half of the paint)
  // The revetment, the slipway's walls, the breakwater and the light's plinth: big dressed blocks of limestone, laid in
  // courses that break joint, weathered darker towards their bottoms and stained where the water has run down them.
  // One tile is four courses of 0.6 m by about 4.8 m (box UVs run a unit to 1.2-1.4 m: lakefront's boxes).
  const blockT = (() => { const W = 512, Hh = 256, cv = document.createElement('canvas'); cv.width = W; cv.height = Hh; const c = cv.getContext('2d'), r = TX.rng(4207);
    c.fillStyle = '#a7a398'; c.fillRect(0, 0, W, Hh);
    for (let row = 0; row < 4; row++) {
      const y = row * 64; let x = -r() * 120;
      while (x < W) { const w = 120 + r() * 110, l = 58 + r() * 9, hue = 38 + r() * 10;
        for (const ox of [0, W, -W]) {
          const g = c.createLinearGradient(0, y, 0, y + 64); g.addColorStop(0, `hsl(${hue},${6 + r() * 4}%,${l + 3}%)`); g.addColorStop(1, `hsl(${hue},${5 + r() * 3}%,${l - 7}%)`);
          c.fillStyle = g; c.fillRect(x + ox + 2, y + 2, w - 4, 60);
        }
        x += w; }
      c.fillStyle = 'rgba(30,30,34,.55)'; c.fillRect(0, y, W, 3); c.fillStyle = 'rgba(255,252,244,.16)'; c.fillRect(0, y + 3, W, 2);
    }
    // the vertical joints, found again from where the blocks were painted: redraw them dark where the colour changes
    const img = c.getImageData(0, 0, W, Hh), d = img.data;
    for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) { const i = (y * W + x) * 4, j = (y * W + (x + 1) % W) * 4; if (Math.abs(d[i] - d[j]) + Math.abs(d[i + 2] - d[j + 2]) > 34 && y % 64 > 3) { d[i] *= 0.45; d[i + 1] *= 0.45; d[i + 2] *= 0.5; } }
    c.putImageData(img, 0, 0);
    for (let k = 0; k < 7000; k++) { const v = r() < 0.5 ? '255,250,240' : '20,18,16'; c.fillStyle = `rgba(${v},${r() * 0.09})`; c.fillRect(r() * W, r() * Hh, 1 + r() * 3, 1 + r() * 2); }      // the grain of the stone
    for (let k = 0; k < 40; k++) { const x = r() * W, y = (r() * 4 | 0) * 64 + 4, l = 12 + r() * 50, w = 2 + r() * 9; const g = c.createLinearGradient(0, y, 0, y + l); g.addColorStop(0, `rgba(40,42,48,${0.12 + r() * 0.18})`); g.addColorStop(1, 'rgba(40,42,48,0)'); c.fillStyle = g; c.fillRect(x, y, w, l); }      // stains run down from the joints
    for (let k = 0; k < 26; k++) { const x = r() * W, y = r() * Hh, rad = 4 + r() * 14; const g = c.createRadialGradient(x, y, 0, x, y, rad); g.addColorStop(0, 'rgba(70,74,60,.16)'); g.addColorStop(1, 'rgba(70,74,60,0)'); c.fillStyle = g; c.fillRect(x - rad, y - rad, rad * 2, rad * 2); }      // lichen
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(0.25, 0.5); t.anisotropy = 8; return t; })();
  add(stone.mesh(new THREE.MeshStandardMaterial({ map: blockT, roughness: 0.9, emissiveMap: blockT, emissive: new THREE.Color(0.42, 0.45, 0.58), emissiveIntensity: 0.58 })));
  add(dark.mesh(new THREE.MeshStandardMaterial({ color: 0x23262d, roughness: 0.7, emissive: 0x0e1016, emissiveIntensity: 0.6 })));
  add(white.mesh(new THREE.MeshStandardMaterial({ color: 0xd9dbe0, roughness: 0.6, metalness: 0.15, emissive: 0x565c70, emissiveIntensity: 0.6, side: THREE.DoubleSide })));
  { const m = new THREE.MeshStandardMaterial({ map: snowTex, roughness: 0.95, emissiveMap: snowTex, emissive: new THREE.Color(0.25, 0.3, 0.45), emissiveIntensity: 0.5 }); add(snow.mesh(m), ...PF.meshes(m)); if (L.bwLips) { const lm = new THREE.Mesh(L.bwLips, m); lm.userData.harbourAdd = true; add(lm); } }
  // (It takes the floor mirror, so it goes in with the floors: reflect.js leaves them out of what they reflect. Its
  // geometry is given a kind of its own, as is the heave's below, because lights.js takes every plain BufferGeometry among the floors for a room's
  // floor and wraps its material for the room's lights: once is harmless out here, once a mesh for nine meshes of one material does not compile.)
  { const m = ice.mesh(iceM); add(m); if (museum.floors && L.iceField) { m.geometry.type = 'HarbourIce'; museum.floors.push(m); } }
  // The heave of the ice: the pressure ridges and the deep drifts, drawn from the very curve the wheels ride
  // (icefield.js heaveAt), in the ice's own material (it is snow by the zone map, and shaded from the moon by its
  // slope). In bands of 50 m along the shore, each made three ways: near to, a point every 20 cm where it stands up
  // and every 40 where it lies low; further off every 40; far off every 80. harbour.js shows the one that suits how
  // far the camera is (L.heaveLOD). So what the wheels are on is exact under them, and the far ridges cost little.
  if (L.iceField) {
    const F = L.iceField, hv = F.heave, D = HSTEP / 2, BAND = 50, at = F.heaveAt, hm = iceMaterial({ field: F, mirror: museum.mirror, params: off(-2) });      // (the mirror too: its feet are bare ice, level with the sheet; so, like the sheet, it is left out of what the mirror sees)
    const levels = [0, 1, 2].map(level => {
      const bands = new Map();
      const quad = (i, j, n) => {        // the square from lattice point (i, j), n steps of 20 cm on a side
        const xa = hv.x0 + i * D, za = hv.z0 + j * D, c = [[xa, za, i, j], [xa + D * n, za, i + n, j], [xa + D * n, za + D * n, i + n, j + n], [xa, za + D * n, i, j + n]], hs = c.map(([x, z]) => at(x, z));
        if (!hs.some(h => h > 0.004) && !(n > 2 && at(xa + D * n / 2, za + D * n / 2) > 0.02)) return;
        const key = Math.floor(za / BAND); let b = bands.get(key); if (!b) bands.set(key, b = { p: [], n: [], idx: [], ix: new Map() });
        const v = c.map(([x, z, ci, cj], k) => { const id = ci + ',' + cj; let q = b.ix.get(id); if (q === undefined) { const e = 0.08 * n, gx = (at(x + e, z) - at(x - e, z)) / (2 * e), gz = (at(x, z + e) - at(x, z - e)) / (2 * e), l = Math.hypot(gx, 1, gz); q = b.p.length / 3; b.p.push(x, hs[k] + 0.012, z); b.n.push(-gx / l, 1 / l, -gz / l); b.ix.set(id, q); } return q; });
        b.idx.push(v[0], v[2], v[1], v[0], v[3], v[2]);
      };
      const st = level === 2 ? 2 : 1;
      for (let j = 0; j < hv.nz; j += st) for (let i = 0; i < hv.nx; i += st) {
        if (level === 2) { if (hv.cells[j * hv.nx + i] || hv.cells[j * hv.nx + i + 1] || (j + 1 < hv.nz && (hv.cells[(j + 1) * hv.nx + i] || hv.cells[(j + 1) * hv.nx + i + 1]))) quad(i * 2, j * 2, 4); continue; }
        if (!hv.cells[j * hv.nx + i]) continue;
        let top = 0; if (level === 0) for (let b = 0; b <= 2; b++) for (let a = 0; a <= 2; a++) top = Math.max(top, at(hv.x0 + (i * 2 + a) * D, hv.z0 + (j * 2 + b) * D));
        if (top < 0.075) quad(i * 2, j * 2, 2); else for (let b = 0; b < 2; b++) for (let a = 0; a < 2; a++) quad(i * 2 + a, j * 2 + b, 1);
      }
      return bands;
    });
    // One mesh a band, whose geometry is changed for the one that suits (not three meshes shown and hidden: the floor
    // mirror shows every floor again after its own pass, reflect.js, and these are among the floors).
    L.heaveLOD = []; L.heaveTris = [0, 0, 0];
    for (const key of levels[2].keys()) {
      const geos = levels.map((bands, level) => { const b = bands.get(key); if (!b) return null; const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(b.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(b.n, 3)); g.setIndex(b.idx); g.computeBoundingSphere();
        g.type = 'HarbourIce'; L.heaveTris[level] += b.idx.length / 3; return g; });
      const m = new THREE.Mesh(geos[2], hm); m.userData.harbourAdd = true; add(m); if (museum.floors) museum.floors.push(m);
      L.heaveLOD.push({ z0: key * BAND, z1: (key + 1) * BAND, x0: hv.x0, x1: hv.x0 + hv.nx * HSTEP, mesh: m, geos });
    }
  }
  // the edge: its snowy lip, its raw face, the slabs and blocks along it, the cracks back from it
  { const m = new THREE.MeshStandardMaterial({ map: snowTex, roughness: 0.9, emissiveMap: snowTex, emissive: new THREE.Color(0.32, 0.38, 0.55), emissiveIntensity: 0.6, ...off(-3) }); add(rim.mesh(m)); }
  add(face.mesh(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.25, emissive: new THREE.Color(0.18, 0.32, 0.42), emissiveIntensity: 1 })));
  { const m = slab.mesh(iceBlockMaterial({ foot: 0, patch: 0.28 })); L.slabTris = m.geometry.index.count / 3; add(m); }      // (src/icelook.js: broken ice, snow on its tops)
  // (the cracks back from the edge are in the ice now: icelook.js)
  { const cv = document.createElement('canvas'); cv.width = 64; cv.height = 4; const c = cv.getContext('2d'), gr = c.createLinearGradient(0, 0, 64, 0); gr.addColorStop(0, 'rgba(20,48,74,0)'); gr.addColorStop(1, 'rgba(20,48,74,0.55)'); c.fillStyle = gr; c.fillRect(0, 0, 64, 4);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
    const m = wet.mesh(new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, ...off(-2) })); m.renderOrder = 1; add(m); }
}
