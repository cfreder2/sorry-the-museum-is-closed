// Where the harbour ice gives out (plan.js addLakefront calls this): the broken edge of the solid ice, the slabs and
// blocks shoved up along it, the floes out in the open water, the chain of big floes that leads across to the
// breakwater, and the slab of ice jammed up against the breakwater's side that you drive up onto it.
// Everything here is solid exactly as it is drawn (lakefront.js draws the still things, harbour.js the floating ones and
// keeps the floes' surfaces where it draws them). The water itself is not ground: a car that comes down on it has gone in
// (harbour.js fishes it out).

import { buildIceField, HSTEP } from './icefield.js';

// Something solid with a top to land on (as plan.js landable, which cannot be imported here: plan.js imports this).
const landable = (plan, x0, x1, z0, z1, top, base = 0) => { plan.surfaces.push({ skin: 'wall', fixed: true, x0, x1, z0, z1, axis: null, h0: top, h1: top, base }); plan.obstacles.push({ x0, x1, z0, z1, y0: base, y1: top - 0.08 }); };

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
  L.lake = 795;                                           // where the lake that goes on to the horizon begins (skyline.js, via museum.js): out past the painted horizon itself, for the harbour's own water (harbour.js) now runs all the way to it
  L.water = { x0: xMin - 0.6, x1: 760, z0: B.z0 - 190, z1: B.z1 + 190 };      // the snow is left off the water, which lies lower than it (groundOpenings)

  // ---- the chain of floes from the edge to the breakwater: big, flat, held fast in the ice (they do not bob), with
  // gaps of half a metre. A low ramp of tipped ice on the sheet before the edge and at the far end of each of the first three
  // floes throws a toy driven straight at anything from a crawl to flat out across the next gap: no hop needed (though a
  // hop works too). Then a slab jammed up against the breakwater's side, a ramp onto its top.
  const route = [
    [RX + 0.5, RX + 4.7, 61.6, 66.8, 64.2],
    [RX + 5.2, RX + 9.4, 61.0, 66.2, 63.6],
    [RX + 9.9, RX + 14.1, 61.8, 67.0, 64.4],
    [RX + 14.6, RX + 18.9, 60.4, 67.2, 63.6],
  ];
  const bw = L.breakwater;
  L.ramp = { x0: RX + 18.5, x1: bw.x0, z0: 61.6, z1: 65.8, h0: FLOE_TOP, h1: 1.27 };
  const floes = L.floes = [];
  const jag = () => r() * 0.35;
  for (const [xa, xb, za, zb, zc] of route) {
    const w = xb - xa, cx = (xa + xb) / 2, cz = (za + zb) / 2;
    const pts = [[xa, zc + 1.3], [xa, zc - 1.3], [xa + 0.3 + jag(), za + 0.45 + jag()], [xa + w * 0.35 + jag(), za + jag() * 0.5], [xa + w * 0.7 + jag(), za + 0.15 + jag()], [xb - 0.3 - jag(), za + 0.5 + jag()],
      [xb, zc - 1.3], [xb, zc + 1.3], [xb - 0.35 - jag(), zb - 0.45 - jag()], [xa + w * 0.65 + jag(), zb - jag() * 0.5], [xa + w * 0.3 + jag(), zb - 0.2 - jag()], [xa + 0.35 + jag(), zb - 0.5 - jag()]];
    floes.push({ route: true, held: true, poly: pts.map(([x, z]) => [x - cx, z - cz]), hx: cx, hz: cz, sx: 1, sz: 1, yaw: 0, top: FLOE_TOP, drift: 0 });
  }
  // The launch ramps: plates of ice like the ones tipped up along the edge (drawn by lakefront.js with them), rising
  // 20 cm over 1.2 m towards the next gap. (Added to L.slabs below, once that list exists.)
  const LIFT = 0.2, launch = [[RX - 1.25, RX - 0.05, 62.6, 65.8, 0]];
  for (let i = 0; i < 3; i++) { const [, xb, , , zc] = route[i]; launch.push([xb - 1.25, xb - 0.05, zc - 1.5, zc + 1.5, FLOE_TOP]); }
  // The way, for the line of lights along it (harbour.js): the middle of each floe and ramp, from the ice to the top.
  L.way = [[RX - 3, 64.2], ...route.flatMap(([xa, xb, , , zc]) => [[xa + 0.2, zc], [xb - 0.2, zc]]), [L.ramp.x0 + 0.3, 63.7], [bw.x0 + 1.2, 63.7]];
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
    const z = Z0 + r() * (Z1 - Z0), near = r() < 0.7, rad = 0.12 + r() * (near ? 0.22 : 0.3);          // slush: never big enough to look like something to drive on
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
  // A trail of little lanterns on poles to show the way: one on the ice where the chain starts, one on each floe of it,
  // one at the top of the slab. (Solid poles; the lanterns on the floes ride up and down with them: harbour.js.)
  const lamps = L.trail = [{ x: RX - 1.2, z: 61.4, y: 0 }];
  floes.filter(f => f.route).forEach(f => { const zb = Math.max(...f.poly.map(p => p[1])); lamps.push({ x: f.hx, z: f.hz + zb - 0.85, y: f.top, floe: f }); });      // (well off the line the hops take)
  lamps.push({ x: bw.x0 + 0.5, z: L.ramp.z1 + 0.4, y: 1.27 });
  for (const q of lamps) O.push({ x0: q.x - 0.05, x1: q.x + 0.05, z0: q.z - 0.05, z1: q.z + 0.05, y0: q.y - 0.1, y1: q.y + 0.85 });

  // ---- the keeper's hut at the foot of the light: a boarded box with a flat roof on the west half of the breakwater,
  // leaving the east side clear to drive down to the light. Its door faces east, onto that lane, with a stone step in
  // front of it (low enough to drive over) where the keeper's log lies (src/probe.js). Solid as drawn (harbour.js draws
  // it); the roof is a top you can land on.
  { const y = 1.27, H = L.hut = { x0: bw.x0, x1: bw.x0 + 2.4, z0: 48.3, z1: 50.5, y, h: 2.1 };      // (flush with the west edge: a strip beside it was a ledge to be shoved off into the lake)
    H.door = { x: H.x1, z: (H.z0 + H.z1) / 2, w: 0.8, h: 1.8 };
    H.step = { x0: H.x1, x1: H.x1 + 0.34, z0: H.door.z - 0.45, z1: H.door.z + 0.45, h: 0.06 };
    H.log = { x: H.x1 + 0.19, y: y + H.step.h, z: H.door.z };
    S.push({ skin: 'wall', fixed: true, x0: H.x0, x1: H.x1, z0: H.z0, z1: H.z1, axis: null, h0: y + H.h, h1: y + H.h, base: y });
    O.push({ x0: H.x0, x1: H.x1, z0: H.z0, z1: H.z1, y0: y, y1: y + H.h - 0.08 });
    const s = H.step; S.push({ skin: 'wall', fixed: true, x0: s.x0, x1: s.x1, z0: s.z0, z1: s.z1, axis: null, h0: y + s.h, h1: y + s.h, base: y }); }

  // ---- along the edge, on the solid ice: slabs tipped up on end (ramps: drive up them) and blocks shoved up in ridges,
  // never in the chain's corner of the edge, and always leaving open stretches where you can drive right to the water
  const slabs = L.slabs = [];
  for (const [x0, x1, z0, z1, h] of launch) {
    const q = { x0, x1, z0, z1, kind: 'plate', axis: 'x', h0: h, h1: h + LIFT, T: 0.13, launch: true };
    slabs.push(q); S.push({ skin: 'wall', fixed: true, x0, x1, z0, z1, axis: 'x', h0: q.h0, h1: q.h1, thick: q.T });
  }
  const taken = [], free = (q) => !taken.some(t => q.x0 < t.x1 + 0.12 && q.x1 > t.x0 - 0.12 && q.z0 < t.z1 + 0.12 && q.z1 > t.z0 - 0.12);
  for (let z = B.z0 + 3 + r() * 4; z < B.z1 - 6;) {
    const span = 3 + r() * 4;
    if (z + span > RZ[0] - 5 && z < RZ[1] + 5) { z = RZ[1] + 5; continue; }
    const pieces = 3 + Math.floor(r() * 4);
    for (let k = 0; k < pieces * 3 && slabs.filter(s => s.z0 >= z - 0.01 && s.z1 <= z + span + 2).length < pieces; k++) {
      const w = 0.6 + r() * 1.2, za = z + r() * Math.max(0.1, span - w), zb = za + w, e = minEdge(za, zb);
      const wedge = r() < 0.68, d = wedge ? 1.0 + r() * 1.0 : 0.45 + r() * 0.8, back = r() * (wedge ? 0.8 : 1.4);
      const x1 = e - 0.15 - back, x0 = x1 - d;
      const q = { x0, x1, z0: za, z1: zb };
      if (!free(q)) continue;
      taken.push(q);
      if (wedge) {
        // a plate of ice 13 cm thick, one end down in the sheet and the other up in the air: drive up it from its low
        // end, or (where it is high enough) under its raised end
        const axis = r() < 0.7 ? 'x' : 'z', up = r() < 0.6 ? 1 : -1, hi = 0.26 + r() * 0.46, T = 0.13;
        slabs.push({ ...q, kind: 'plate', axis, h0: up > 0 ? 0 : hi, h1: up > 0 ? hi : 0, T });
        S.push({ skin: 'wall', fixed: true, ...q, axis, h0: up > 0 ? 0 : hi, h1: up > 0 ? hi : 0, thick: T });
      } else {
        const h = 0.14 + r() * 0.3;
        slabs.push({ ...q, kind: 'block', h });
        S.push({ skin: 'wall', fixed: true, ...q, axis: null, h0: h, h1: h, base: 0 });
        O.push({ ...q, y0: 0, y1: h - 0.08 });
      }
    }
    z += span + 1.5 + r() * 6;
  }

  // ---- cracks running back into the solid ice from the edge (drawn only)
  const cracks = L.cracks = [];
  for (let z = B.z0 - 40 + r() * 6; z < B.z1 + 40; z += 5 + r() * 12) {
    let x = edgeX(z) - 0.1, zz = z, a = Math.PI + (r() - 0.5) * 0.9; const pts = [[x, zz]], n = 4 + Math.floor(r() * 8);
    for (let i = 0; i < n; i++) { const l = 0.8 + r() * 2.2; a += (r() - 0.5) * 0.9; x += Math.cos(a) * l; zz += Math.sin(a) * l; pts.push([x, zz]); }
    if (pts.every(([px, pz]) => !(L.window && px > L.window.x0 - 1 && px < L.window.x1 + 1 && pz > L.window.z0 - 1 && pz < L.window.z1 + 1))) cracks.push(pts);
  }

  // ---- out on the sheet, between the shore and the edge
  // The marked way across: from the slipway, where a toy comes down onto the ice, to where the chain of floes starts.
  // Stakes with a reflector band stand down both sides of it, as on any road laid out over lake ice; nothing rises in
  // it (icefield.js keeps the ridges and the drifts out), so the crossing to the light is as it was.
  const sx = L.shore + 3.5, sz = (L.slip[0] + L.slip[1]) / 2;
  const way = L.safeWay = [[sx, sz], [sx + 9, sz - 2], [sx + 20, sz - 12], [sx + 30, sz - 30], [RX - 7, 67.2], [RX - 3.2, 64.2]];
  const wayD = (x, z) => { let m = Infinity; for (let i = 0; i + 1 < way.length; i++) { const [ax, az] = way[i], [bx, bz] = way[i + 1], dx = bx - ax, dz = bz - az, t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz))); m = Math.min(m, Math.hypot(x - ax - dx * t, z - az - dz * t)); } return m; };
  const stakes = L.stakes = [];
  { let side = 1, carry = 2.5;
    for (let i = 0; i + 1 < way.length; i++) {
      const [ax, az] = way[i], [bx, bz] = way[i + 1], l = Math.hypot(bx - ax, bz - az), ux = (bx - ax) / l, uz = (bz - az) / l;
      for (let d = carry; d < l; d += 4.2) { const x = ax + ux * d - uz * 2.05 * side, z = az + uz * d + ux * 2.05 * side; if (wayD(x, z) > 1.8 && Math.hypot(x - RX, z - 64.2) > 3.4) stakes.push({ x, z, yaw: r() * 6.283, lean: (r() - 0.5) * 0.16 }); side = -side; carry = d + 4.2 - l; }
    } }
  for (const q of stakes) O.push({ x0: q.x - 0.04, x1: q.x + 0.04, z0: q.z - 0.04, z1: q.z + 0.04, y0: 0, y1: 0.8 });
  // The harbour's moorings, left out all winter and frozen in where they float: can buoys in their rows, each a thing
  // to steer round. (Drawn by lakefront.js with the ones riding in the open water; solid as drawn.)
  const fish = L.fish || { x: -1e3, z: -1e3 }, moor = L.moorings = [];
  // More fishing shanties, where the one at the hole (icefish.js) has neighbours: boarded huts square to the shore, a lit
  // window in each. Solid as drawn (icefish.js draws them all).
  const shanties = L.shanties = L.fish ? [{ x: fish.x - 3.5, z: fish.z + 27, turn: 1 }, { x: fish.x + 5.2, z: fish.z + 33.5, turn: 3 }, { x: fish.x + 10.5, z: fish.z - 98, turn: 2 }] : [];
  for (const q of shanties) { const hw = q.turn % 2 ? 0.9 : 1.1, hd = q.turn % 2 ? 1.1 : 0.9; O.push({ x0: q.x - hw, x1: q.x + hw, z0: q.z - hd, z1: q.z + hd, y0: -0.3, y1: 2.6 }); }
  for (const [k, mx] of [[0, 541], [1, 549.5], [2, 558.5], [3, 566.5]]) for (let z = B.z0 + 9 + (k % 2) * 7.5; z < B.z1 - 6; z += 15) {
    const x = mx + (r() - 0.5) * 1.6, zz = z + (r() - 0.5) * 2.4;
    if (x > edgeX(zz) - 6.5 || wayD(x, zz) < 3.6 || Math.hypot(x - fish.x, zz - fish.z) < 11 || Math.hypot(x - RX, zz - 64.2) < 8 || shanties.some(q => Math.hypot(x - q.x, zz - q.z) < 4)) continue;
    moor.push({ x, z: zz, s: 0.62 + r() * 0.16, yaw: r() * 6.283, tip: (r() - 0.5) * 0.3, red: r() < 0.3 });
  }
  for (const q of moor) { const a = 0.42 * q.s * 0.72; O.push({ x0: q.x - a, x1: q.x + a, z0: q.z - a, z1: q.z + a, y0: 0, y1: 0.42 * q.s + 0.1 }); }
  // Two rowing boats left out too late and frozen in by the shore, full of snow: each solid as drawn (three boxes down
  // its length, narrowing to the bow), with the snow in it a top to land on. And bollards along the lake side of the
  // revetment's top (0.56 m up: plan.js L.rev.top), every twelve metres, to tie up to.
  const boats = L.boats = [{ x: L.shore + 6.4, z: sz - 11.5, dir: 1, heel: 0.13, hull: [0.1, 0.24, 0.2] }, { x: L.shore + 7.3, z: sz + 44, dir: -1, heel: -0.1, hull: [0.36, 0.07, 0.06] }];
  for (const q of boats) for (const [za, zb, hw] of [[-1.35, 0.3, 0.52], [0.3, 0.9, 0.4], [0.9, 1.32, 0.2]]) landable(plan, q.x - hw, q.x + hw, q.z + Math.min(za * q.dir, zb * q.dir), q.z + Math.max(za * q.dir, zb * q.dir), 0.4, 0);
  const bollards = L.bollards = [];
  for (let z = B.z0 + 8; z < B.z1 - 4; z += 12) if (z < L.slip[0] - 2 || z > L.slip[1] + 2) bollards.push({ x: L.shore - 0.38, z, y: 0.56 });
  for (const q of bollards) O.push({ x0: q.x - 0.1, x1: q.x + 0.1, z0: q.z - 0.1, z1: q.z + 0.1, y0: q.y, y1: q.y + 0.34 });
  // The lie of the ice (icefield.js): the plates it froze in, the ridges and refrozen leads between them, the drifts.
  // Its heave is a piece of ground like the hills (never a wall, ground at any height, the car rolls off it); how well
  // the ice holds is read from it by the car (vehicles.js: the first sheet of ice found here is this one, ahead of the
  // plain one plan.js lists after).
  const F = L.iceField = buildIceField({ x0: L.shore + 2.25, x1: xMax + 0.5, z0: B.z0 - 40, z1: B.z1 + 40, edgeX, play: [B.z0 + 1, B.z1 - 1], hx0: L.shore + 5,
    way, keep: [{ x: fish.x, z: fish.z, r: 9 }, { x: RX - 2, z: 64.2, r: 6 }, ...boats.map(q => ({ x: q.x, z: q.z, r: 2.6 })), ...shanties.map(q => ({ x: q.x, z: q.z, r: 3.4 }))], posts: moor });
  { const hv = F.heave; L.heave = { skin: 'wall', fixed: true, hill: true, axis: 'hill', x0: hv.x0, x1: hv.x0 + hv.nx * HSTEP, z0: hv.z0, z1: hv.z0 + hv.nz * HSTEP, h0: 0, h1: F.top, thick: 0, cx: 0, cz: 0, rx: 1, rz: 1, H: 0, fn: F.heaveAt };
    S.push(L.heave); }
  plan.ice.push({ x0: L.shore + 3, x1: xMax, z0: B.z0, z1: B.z1, crust: F.crust });
  // Plates rafted up along the crests of the ridges (one end out of the snow: a ramp to hop the ridge from), and lumps
  // of broken ice thrown out beside them: low ones a wheel bumps over, taller ones to steer round. Drawn with the slabs
  // along the edge (lakefront.js), solid as drawn.
  const clearOf = q => !moor.some(m => q.x0 < m.x + 0.7 && q.x1 > m.x - 0.7 && q.z0 < m.z + 0.7 && q.z1 > m.z - 0.7) && wayD((q.x0 + q.x1) / 2, (q.z0 + q.z1) / 2) > 3.2;
  F.crests.forEach((c, i) => {
    if (i % 5 < 3) {
      const w = 0.7 + r() * 0.6, d = 0.9 + r() * 0.6, axis = r() < 0.5 ? 'x' : 'z', up = r() < 0.5 ? 1 : -1, hi = c.h + 0.1 + r() * 0.15, T = 0.1;
      const q = axis === 'x' ? { x0: c.x - d / 2, x1: c.x + d / 2, z0: c.z - w / 2, z1: c.z + w / 2 } : { x0: c.x - w / 2, x1: c.x + w / 2, z0: c.z - d / 2, z1: c.z + d / 2 };
      if (!free(q) || !clearOf(q)) return;
      taken.push(q);
      slabs.push({ ...q, kind: 'plate', axis, h0: up > 0 ? 0 : hi, h1: up > 0 ? hi : 0, T, sunk: true });
      S.push({ skin: 'wall', fixed: true, ...q, axis, h0: up > 0 ? 0 : hi, h1: up > 0 ? hi : 0, thick: T });
    }
    for (let k = 0, n = 1 + Math.floor(r() * 3); k < n; k++) {
      const a = r() * 6.283, d = 1.2 + r() * 1.1, s = 0.3 + r() * 0.45, x = c.x + Math.cos(a) * d, z = c.z + Math.sin(a) * d, low = r() < 0.6, h = low ? 0.045 + r() * 0.04 : 0.13 + r() * 0.1;
      const q = { x0: x - s / 2, x1: x + s / 2, z0: z - s * (0.35 + r() * 0.3), z1: z + s * (0.35 + r() * 0.3) };
      if (!free(q) || !clearOf(q) || x > edgeX(z) - 5 || [[q.x0, q.z0], [q.x1, q.z0], [q.x0, q.z1], [q.x1, q.z1], [x, z]].some(([px, pz]) => F.heaveAt(px, pz) > 0.012)) continue;
      taken.push(q);
      slabs.push({ ...q, kind: 'block', h });
      S.push({ skin: 'wall', fixed: true, ...q, axis: null, h0: h, h1: h, base: 0 });
      if (!low) O.push({ ...q, y0: 0, y1: h - 0.08 });
    }
  });

  // ---- where a toy that has gone in is put back: on the solid ice a few metres back from the edge, facing the shore,
  // or on top of the breakwater, facing the light
  const safe = L.safe = [];
  for (let z = B.z0 + 4; z < B.z1 - 4; z += 5) { const x = edgeX(z) - 4.2; if (!taken.some(t => x > t.x0 - 0.6 && x < t.x1 + 0.6 && z > t.z0 - 0.6 && z < t.z1 + 0.6) && !F.heaveAt(x, z) && !moor.some(m => Math.hypot(m.x - x, m.z - z) < 1)) safe.push({ x, z, y: 0, yaw: -Math.PI / 2 }); }
  for (let z = bw.z0 + 8; z < bw.z1 - 2; z += 6) safe.push({ x: (bw.x0 + bw.x1) / 2, z, y: 1.27, yaw: Math.PI });
}
