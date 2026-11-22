// Where the harbour ice gives out (plan.js addLakefront calls this): the broken edge of the solid ice, the slabs and
// blocks shoved up along it, the floes out in the open water, the chain of big floes that leads across to the
// breakwater, and the slab of ice jammed up against the breakwater's side that you drive up onto it.
// Everything here is solid exactly as it is drawn (lakefront.js draws the still things, harbour.js the floating ones and
// keeps the floes' surfaces where it draws them). The water itself is not ground: a car that comes down on it has gone in
// (harbour.js fishes it out).

const rng = s => () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;

// Is (u, v) inside the polygon pts ([[u, v], ...])?
export function inPoly(pts, u, v) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [ui, vi] = pts[i], [uj, vj] = pts[j];
    if ((vi > v) !== (vj > v) && u < (uj - ui) * (v - vi) / (vj - vi) + ui) inside = !inside;
  }
  return inside;
}

// A floe's top: a plane through its centre at height f.h, tilted by (f.gx, f.gz), over its outline. Off the outline it is
// not there at all. f.x, f.z, f.h, f.gx, f.gz change as it floats (harbour.js); its outline turns with f.yaw and is
// stretched by f.sx, f.sz.
export function floeTop(f, x, z) {
  const dx = x - f.x, dz = z - f.z, c = f.c, s = f.s;
  const u = (dx * c - dz * s) / f.sx, v = (dx * s + dz * c) / f.sz;
  if (u * u + v * v > f.r2 || !inPoly(f.poly, u, v)) return -Infinity;
  return f.h + f.gx * dx + f.gz * dz;
}
// The floe's surface's box, round its outline where it is now.
export function floeBox(f) {
  const s = f.surf, R = f.reach;
  s.x0 = f.x - R; s.x1 = f.x + R; s.z0 = f.z - R; s.z1 = f.z + R;
}

export const WATER_Y = -0.2;        // the open water, under the ice's top (0) by its thickness
export const FLOE_TOP = 0.08;       // a floe floats a little proud of the sheet it broke from

export function harbourEdge(plan, L) {
  const B = plan.bounds, S = plan.surfaces, O = plan.obstacles, r = rng(9137);
  const ZA = B.z0 - 200, ZB = B.z1 + 200, MID = L.buoys - 1.5;

  // ---- the edge of the solid ice: a broken line, in and out by a metre or two, with a straight stretch where the
  // chain of floes starts (so the first hop is the length it was made to be)
  const RZ = [58, 71], RX = 574;
  const edge = [];
  let flip = 1;
  for (let z = ZA; z <= ZB;) {
    let x = MID + 1.4 * Math.sin(z * 0.045 + 1) + 0.8 * Math.sin(z * 0.13 + 2) + flip * (0.25 + r() * 0.85);
    if (z > RZ[0] - 3 && z < RZ[1] + 3) x = RX + (z > RZ[0] && z < RZ[1] ? 0 : flip * 0.4);
    edge.push([x, z]); flip = -flip;
    const nz = z + 1.4 + r() * 2.6;
    if (z < RZ[0] && nz > RZ[0]) { edge.push([RX, RZ[0]]); z = RZ[0]; edge.push([RX, RZ[1]]); z = RZ[1] + 1.2; continue; }
    z = nz;
  }
  const edgeX = z => {
    if (z <= edge[0][1]) return edge[0][0];
    let lo = 0, hi = edge.length - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (edge[m][1] <= z) lo = m; else hi = m; }
    const [xa, za] = edge[lo], [xb, zb] = edge[hi];
    return zb > za ? xa + (xb - xa) * (z - za) / (zb - za) : xa;
  };
  const xs = edge.map(p => p[0]), xMin = Math.min(...xs), xMax = Math.max(...xs);
  const minEdge = (z0, z1) => { let m = Math.min(edgeX(z0), edgeX(z1)); for (const [x, z] of edge) if (z > z0 && z < z1) m = Math.min(m, x); return m; };
  L.edge = edge; L.edgeX = edgeX; L.edgeMin = xMin; L.edgeMax = xMax;
  L.wet = (x, z) => x > edgeX(z);                         // over open water (unless on something: a floe, the breakwater)
  L.waterY = WATER_Y;
  L.lake = 700;                                           // where the lake that goes on to the horizon begins (skyline.js, via museum.js)
  L.water = { x0: xMin - 0.6, x1: 720, z0: B.z0 - 190, z1: B.z1 + 190 };      // the snow is left off the water, which lies lower than it (groundOpenings)

  // ---- the chain of floes from the edge to the breakwater: big, flat, hops that grow a little (1.0 to 1.4 m); and a
  // slab jammed up against the breakwater's side, a ramp onto its top.
  const route = [
    [RX + 1.0, RX + 5.0, 61.6, 66.8, 64.2],
    [RX + 6.2, RX + 10.2, 61.0, 66.2, 63.6],
    [RX + 11.5, RX + 15.5, 61.8, 67.0, 64.4],
    [RX + 16.9, RX + 20.4, 60.4, 67.2, 63.6],
  ];
  const bw = L.breakwater;
  L.ramp = { x0: RX + 20.0, x1: bw.x0, z0: 61.6, z1: 65.8, h0: FLOE_TOP, h1: 1.27 };
  const floes = L.floes = [];
  const jag = () => r() * 0.35;
  for (const [xa, xb, za, zb, zc] of route) {
    const w = xb - xa, cx = (xa + xb) / 2, cz = (za + zb) / 2;
    const pts = [[xa, zc + 1.3], [xa, zc - 1.3], [xa + 0.3 + jag(), za + 0.45 + jag()], [xa + w * 0.35 + jag(), za + jag() * 0.5], [xa + w * 0.7 + jag(), za + 0.15 + jag()], [xb - 0.3 - jag(), za + 0.5 + jag()],
      [xb, zc - 1.3], [xb, zc + 1.3], [xb - 0.35 - jag(), zb - 0.45 - jag()], [xa + w * 0.65 + jag(), zb - jag() * 0.5], [xa + w * 0.3 + jag(), zb - 0.2 - jag()], [xa + 0.35 + jag(), zb - 0.5 - jag()]];
    floes.push({ route: true, poly: pts.map(([x, z]) => [x - cx, z - cz]), hx: cx, hz: cz, sx: 1, sz: 1, yaw: 0, top: FLOE_TOP, drift: 0 });
  }
  // Loose floes, big enough to hold a toy, turning slowly about where they are; and the bits too small to, low in the
  // water (drawn by harbour.js, nothing to stand on). None of them near the chain, the breakwater, or each other.
  const shapes = L.floeShapes = [0, 1, 2].map(k => {
    const n = 8 + k, out = [];
    for (let i = 0; i < n; i++) { const a = (i + (r() - 0.5) * 0.5) / n * Math.PI * 2, d = 0.8 + r() * 0.2; out.push([Math.cos(a) * d, Math.sin(a) * d]); }
    return out;
  });
  const keep = [{ x: (RX + bw.x0) / 2 + 1, z: 64, r: 0 }], clear = (x, z, rad) => {
    if (x - rad < edgeX(z) + 0.8 || x - rad < edgeX(z - rad) + 0.8 || x - rad < edgeX(z + rad) + 0.8) return false;
    if (x + rad > bw.x0 - 0.6 && x - rad < bw.x1 + 0.6 && z + rad > bw.z0 - 1.5 && z - rad < bw.z1 + 1.5) return false;
    if (x + rad > RX - 1 && x - rad < bw.x0 + 1 && z + rad > 57.5 && z - rad < 70.5) return false;          // the chain's lane
    return !keep.some(q => Math.hypot(q.x - x, q.z - z) < q.r + rad + 0.7);
  };
  const Z0 = B.z0 - 30, Z1 = B.z1 + 30;
  for (let tries = 0, n = 0; n < 34 && tries < 4000; tries++) {
    const z = Z0 + r() * (Z1 - Z0), rad = 1.2 + r() * 1.8, drift = 0.25 + r() * 0.5, far = r() < 0.3;
    const x = far ? bw.x1 + 2 + r() * 34 : edgeX(z) + 1 + rad + r() * (bw.x0 - edgeX(z) - 2 * rad - 1.5);
    if (!clear(x, z, rad + drift)) continue;
    keep.push({ x, z, r: rad + drift });
    const sx = rad * (0.85 + r() * 0.3), sz = rad * (0.85 + r() * 0.3);
    floes.push({ route: false, shape: n % 3, poly: shapes[n % 3], hx: x, hz: z, sx, sz, yaw: r() * 6.283, top: FLOE_TOP, drift, dw: (Math.PI * 2) / (70 + r() * 70) * (r() < 0.5 ? 1 : -1) });
    n++;
  }
  const bits = L.bits = [];
  for (let tries = 0; bits.length < 150 && tries < 6000; tries++) {
    const z = Z0 + r() * (Z1 - Z0), near = r() < 0.7, rad = 0.2 + r() * (near ? 0.5 : 0.8);
    const x = near ? edgeX(z) + 0.3 + rad + r() * r() * 5 : edgeX(z) + 1 + r() * (bw.x1 + 30 - edgeX(z));
    if (x + rad > bw.x0 - 0.3 && x - rad < bw.x1 + 0.3 && z > bw.z0 - 1 && z < bw.z1 + 1) continue;
    if (x - rad < edgeX(z) + 0.15) continue;
    if (keep.some(q => q.r > 0 && Math.hypot(q.x - x, q.z - z) < q.r + rad + 0.2)) continue;
    if (floes.slice(0, route.length).some(f => Math.abs(x - f.hx) < 2.6 + rad && Math.abs(z - f.hz) < 3 + rad)) continue;
    bits.push({ x, z, rad, yaw: r() * 6.283, sh: Math.floor(r() * 3) });
  }
  // Each floe's surface: its own top, which harbour.js moves with it.
  for (const f of floes) {
    f.x = f.hx; f.z = f.hz; f.h = f.top; f.gx = f.gz = 0; f.c = Math.cos(f.yaw); f.s = Math.sin(f.yaw);
    const ext = Math.max(...f.poly.map(([u, v]) => Math.hypot(u, v)));
    f.r2 = ext * ext * 1.0001; f.reach = ext * Math.max(f.sx, f.sz) + 0.05;
    f.surf = { skin: 'wall', fixed: true, floe: true, x0: 0, x1: 0, z0: 0, z1: 0, axis: null, h0: f.top, h1: f.top, base: WATER_Y - 0.15, fn: (x, z) => floeTop(f, x, z) };
    floeBox(f); S.push(f.surf);
  }
  { const q = L.ramp; S.push({ skin: 'wall', fixed: true, x0: q.x0, x1: q.x1, z0: q.z0, z1: q.z1, axis: 'x', h0: q.h0, h1: q.h1, base: WATER_Y - 0.15 }); }

  // ---- along the edge, on the solid ice: slabs tipped up on end (ramps: drive up them) and blocks shoved up in ridges,
  // never in the chain's corner of the edge, and always leaving open stretches where you can drive right to the water
  const slabs = L.slabs = [];
  const taken = [], free = (q) => !taken.some(t => q.x0 < t.x1 + 0.12 && q.x1 > t.x0 - 0.12 && q.z0 < t.z1 + 0.12 && q.z1 > t.z0 - 0.12);
  for (let z = B.z0 + 3 + r() * 4; z < B.z1 - 6;) {
    const span = 3 + r() * 4;
    if (z + span > RZ[0] - 5 && z < RZ[1] + 5) { z = RZ[1] + 5; continue; }
    const pieces = 2 + Math.floor(r() * 4);
    for (let k = 0; k < pieces * 3 && slabs.filter(s => s.z0 >= z - 0.01 && s.z1 <= z + span + 2).length < pieces; k++) {
      const w = 0.6 + r() * 1.2, za = z + r() * Math.max(0.1, span - w), zb = za + w, e = minEdge(za, zb);
      const wedge = r() < 0.45, d = wedge ? 0.9 + r() * 0.9 : 0.45 + r() * 0.8, back = r() * (wedge ? 0.8 : 1.4);
      const x1 = e - 0.15 - back, x0 = x1 - d;
      const q = { x0, x1, z0: za, z1: zb };
      if (!free(q)) continue;
      taken.push(q);
      if (wedge) {
        const axis = r() < 0.7 ? 'x' : 'z', up = r() < 0.6 ? 1 : -1, hi = 0.24 + r() * 0.3;
        slabs.push({ ...q, kind: 'wedge', axis, h0: up > 0 ? 0 : hi, h1: up > 0 ? hi : 0 });
        S.push({ skin: 'wall', fixed: true, ...q, axis, h0: up > 0 ? 0 : hi, h1: up > 0 ? hi : 0, base: 0 });
      } else {
        const h = 0.12 + r() * 0.26;
        slabs.push({ ...q, kind: 'block', h });
        S.push({ skin: 'wall', fixed: true, ...q, axis: null, h0: h, h1: h, base: 0 });
        O.push({ ...q, y0: 0, y1: h - 0.08 });
      }
    }
    z += span + 4 + r() * 9;
  }

  // ---- cracks running back into the solid ice from the edge (drawn only)
  const cracks = L.cracks = [];
  for (let z = B.z0 - 40 + r() * 6; z < B.z1 + 40; z += 5 + r() * 12) {
    let x = edgeX(z) - 0.1, zz = z, a = Math.PI + (r() - 0.5) * 0.9; const pts = [[x, zz]], n = 4 + Math.floor(r() * 8);
    for (let i = 0; i < n; i++) { const l = 0.8 + r() * 2.2; a += (r() - 0.5) * 0.9; x += Math.cos(a) * l; zz += Math.sin(a) * l; pts.push([x, zz]); }
    if (pts.every(([px, pz]) => !(L.window && px > L.window.x0 - 1 && px < L.window.x1 + 1 && pz > L.window.z0 - 1 && pz < L.window.z1 + 1))) cracks.push(pts);
  }

  // ---- where a toy that has gone in is put back: on the solid ice a few metres back from the edge, facing the shore,
  // or on top of the breakwater, facing the light
  const safe = L.safe = [];
  for (let z = B.z0 + 4; z < B.z1 - 4; z += 5) { const x = edgeX(z) - 4.2; if (!taken.some(t => x > t.x0 - 0.6 && x < t.x1 + 0.6 && z > t.z0 - 0.6 && z < t.z1 + 0.6)) safe.push({ x, z, y: 0, yaw: -Math.PI / 2 }); }
  for (let z = bw.z0 + 8; z < bw.z1 - 2; z += 6) safe.push({ x: (bw.x0 + bw.x1) / 2, z, y: 1.27, yaw: Math.PI });
}
