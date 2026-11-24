// Cars parked along the kerbs for the night, under the snow that fell on them. streets.js says where they stand.
//
// The bodies are the traffic's (traffic.js builds them: saloon, hatch, SUV, pickup), lamps out. Over each lies a soft,
// rounded blanket of snow, thickest on the roof and drifted deeper to one side, thinner on the steep glass, heaped on
// the bonnet and the boot and filling a pickup's bed; its edges droop over the sides. Round the bottom is what the
// ploughs threw up, deepest on the traffic side, so that the wheels stand half buried. Somebody has scraped a hole in
// one or two windscreens, and found a ticket under the wiper.
//
// They are solid as drawn. The body, from the kerb up to the bonnet and the boot, is in the way; the snow on top is a
// way to drive: hop onto the bonnet, climb the windscreen, cross the roof, run down the back window onto the boot and
// off. That top is laid as a run of level and sloping pieces along the car fitted to the blanket's crown, each with
// the body under it solid to a little below the lowest top near it (so nothing stops a car that has come down onto
// it from above, and nothing stands outside the paint). The plough's heap is solid only where it is more than a few
// centimetres deep.
//
// All of them together are four meshes: paint, everything else (glass, tyres, trim), snow, and nothing per frame.

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { Geo } from './geo.js';
import { KINDS, build, axle } from './traffic.js';
import { hash } from './streetscape.js';

const KINDS_PARKED = ['saloon', 'hatch', 'suv', 'saloon', 'pickup', 'hatch', 'suv', 'saloon'];
const DARK = [0.035, 0.037, 0.045], TICKET = [0.85, 0.42, 0.07], ICE = [0.5, 0.6, 0.75];

// The highest point over z of a closed outline of (z, y) corners, or -Infinity off its ends.
function topOf(prof, z) {
  let best = -Infinity;
  for (let i = 0; i < prof.length; i++) {
    const a = prof[i], b = prof[(i + 1) % prof.length], lo = Math.min(a[0], b[0]), hi = Math.max(a[0], b[0]);
    if (z < lo || z > hi || hi - lo < 1e-6) continue;
    const y = a[1] + (b[1] - a[1]) * (z - a[0]) / (b[0] - a[0]); if (y > best) best = y;
  }
  return best;
}

// One kind's shape from above: its top along its length (and how wide that top is), where the snow can lie, and its
// geometry (built once a kind).
const shapes = {};
function shapeOf(id) {
  if (shapes[id]) return shapes[id];
  const K = KINDS[id], hw = K.hw, bodyTop = Math.max(...K.body.map(p => p[1])), zf = K.len / 2, zr = -K.len / 2;
  const wBody = y => hw - (y > bodyTop - 0.22 ? (y - bodyTop + 0.22) * 0.25 : 0) - (y < 0.45 ? 0.03 : 0);
  const cy0 = K.cab[0][1], cy1 = K.cab[2][1], wCab = y => hw - 0.08 - (y - cy0) / (cy1 - cy0) * 0.14;
  const at = z => {
    let y = topOf(K.body, z), w = wBody(y), cab = false;
    if (K.bed && z > zr && z < K.bed[1]) y = bodyTop + 0.1;                         // a pickup's bed is full to its rim
    const c = topOf(K.cab, z); if (c > y + 0.005) { y = c; w = wCab(c); cab = true; }
    return { y, w, cab };
  };
  // Where the snow lies: wherever the top is within a quarter metre of the highest of the body (not down the nose or the tail).
  let za = zr, zb = zf;
  for (let z = zf; z > 0; z -= 0.005) if (topOf(K.body, z) >= bodyTop - 0.25) { zb = z; break; }
  for (let z = zr; z < 0; z += 0.005) if (topOf(K.body, z) >= bodyTop - 0.25) { za = z; break; }
  const geo = build(K, { parked: true });
  return (shapes[id] = { K, hw, zf, zr, za, zb, at, geo, axle: axle(K.r, hw - 0.02), screen: [K.cab[2][0], K.cab[1][0]] });
}

// A seeded random for one car.
const rnd = seed => () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };

export class ParkedCars {
  constructor(plan) { this.plan = plan; this.paint = []; this.rest = []; this.snow = []; this.list = plan.parkedCars || (plan.parkedCars = []); }

  // A car standing at (x, y, z), pointing (fx, fz) (one of the four ways), with its kerb on its own -x side and the
  // traffic on its +x side (facing +z, the kerb is to the west: parked on the right, as everybody is here).
  add(x, y, z, fx, fz, opts = {}) {
    const h0 = hash(x, z, 31), r = rnd((h0 * 4294967296) >>> 0 || 7);
    const id = opts.kind || KINDS_PARKED[Math.floor(h0 * KINDS_PARKED.length)], S = shapeOf(id), K = S.K, hw = S.hw;
    const yaw = Math.atan2(fx, fz), c = Math.round(Math.cos(yaw)), s = Math.round(Math.sin(yaw));
    const M = new THREE.Matrix4().makeRotationY(Math.atan2(s, c)).setPosition(x, y, z);
    const colour = new THREE.Color(K.paints[Math.floor(hash(z, x, 77) * K.paints.length)]);
    const scraped = opts.scraped !== undefined ? opts.scraped : r() < 0.22, ticket = opts.ticket !== undefined ? opts.ticket : scraped && r() < 0.8;
    const drift = (r() < 0.5 ? -1 : 1) * (0.22 + r() * 0.22), Troof = 0.17 + r() * 0.08, Tlid = 0.11 + r() * 0.06;

    // ---- the body, its glass and trim, its wheels
    const paint = S.geo.paint.clone(), n = paint.attributes.position.count, col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { col[i * 3] = colour.r; col[i * 3 + 1] = colour.g; col[i * 3 + 2] = colour.b; }
    paint.setAttribute('color', new THREE.BufferAttribute(col, 3)); this.paint.push(paint.applyMatrix4(M));
    this.rest.push(S.geo.rest.clone().applyMatrix4(M));
    for (const wz of K.wb) this.rest.push(S.axle.clone().applyMatrix4(new THREE.Matrix4().makeTranslation(0, K.r, wz).premultiply(M)));

    // ---- the blanket: slices across the car every 5 cm, each a crown that droops over the edges
    // (opts.coarse: slices every 10 cm and a coarser heap, a third of the triangles, for cars that are only ever background)
    const DZ = opts.coarse ? 0.1 : 0.05, SM = opts.coarse ? 2 : 4, nS = Math.max(4, Math.round((S.zb - S.za) / DZ)), Z = [], base = [], raw = [];
    for (let i = 0; i <= nS; i++) {
      const z = S.za + (S.zb - S.za) * i / nS, t = S.at(z), sl = Math.abs(S.at(Math.min(S.zb, z + 0.03)).y - S.at(Math.max(S.za, z - 0.03)).y) / 0.06;
      Z.push(z); base.push(t); raw.push(t.y + (t.cab ? Troof : Tlid) * Math.max(0.5, Math.min(1, 1 - 0.5 * sl)));
    }
    let Y = raw.slice(); for (let pass = 0; pass < 3; pass++) Y = Y.map((_, i) => { let a = 0, k = 0; for (let j = Math.max(0, i - SM); j <= Math.min(nS, i + SM); j++) { a += Y[j]; k++; } return a / k; });
    const crown = Y.map((v, i) => { const t = base[i], d = Math.min(Z[i] - S.za, S.zb - Z[i]), e = Math.sqrt(Math.min(1, d / 0.2)); return t.y + Math.max(0.02, v - t.y) * e; });
    // Across: a cushion, flat on top, rounding off at the shoulders and rolling over the edge, then drooping down the side.
    const U = [-1.085, -1.055, -1.0, -0.93, -0.8, -0.6, -0.3, 0, 0.3, 0.6, 0.8, 0.93, 1.0, 1.055, 1.085], nU = U.length;
    const [sc0, sc1] = S.screen, inScrape = (u, z) => scraped && z > sc0 + 0.07 && z < sc1 - 0.05 && u > -0.62 && u < 0.86;
    const pos = [], uv = [], idx = [];
    for (let i = 0; i <= nS; i++) {
      const z = Z[i], t = base[i], W = t.w + 0.015, T = crown[i] - t.y, end = i === 0 || i === nS;
      for (let k = 0; k < nU; k++) {
        const u = U[k], au = Math.abs(u); let yv;
        if (end || au > 1.07) yv = t.y - 0.07;                                                     // tucked in at the ends, drooping at the sides
        else if (au > 1) yv = t.y + T * 0.16 * (1 + drift * u) - 0.012;                              // the roll over the edge
        else if (inScrape(u, z)) yv = t.y - 0.03;                                                  // scraped down to the glass
        else {
          const f = 0.42 + 0.58 * Math.max(0, 1 - au ** 6) ** 0.4, ridge = scraped && (inScrape(U[k - 1], z) || inScrape(U[k + 1], z) || inScrape(u, Z[i - 1]) || inScrape(u, Z[i + 1])) ? 1.3 : 1;
          yv = t.y + T * f * (1 + drift * u) * ridge;
        }
        const xv = u * W; pos.push(xv, yv, z); uv.push(xv * 0.9, z * 0.9);
      }
    }
    for (let i = 0; i < nS; i++) for (let k = 0; k < nU - 1; k++) { const a = i * nU + k, b = a + 1, c2 = a + nU, d = c2 + 1; idx.push(a, c2, b, b, c2, d); }
    this.snow.push(this._geo(pos, uv, idx).applyMatrix4(M));

    // ---- what the ploughs threw up: a heap all round, deepest on the traffic side, half over the wheels
    {
      const Hp = 0.29 + r() * 0.08, Hk = 0.18 + r() * 0.06, He = 0.16 + r() * 0.06, Hin = 0.2, RF = 0.3, L2 = K.len / 2;
      const p1 = r() * 6, p2 = r() * 6, p3 = r() * 6, lump = (lx, lz) => 0.028 * Math.sin(lz * 5.3 + p1) * Math.sin(lx * 4.1 + p2) + 0.018 * Math.sin(lz * 11.7 + p3) + 0.012 * Math.sin(lx * 13 + lz * 3 + p1);
      const X0 = -hw - RF - 0.06, X1 = hw + RF + 0.06, Z0 = -L2 - RF - 0.06, Z1 = L2 + RF + 0.06, HG = opts.coarse ? 0.19 : 0.08, nx = Math.ceil((X1 - X0) / HG), nz = Math.ceil((Z1 - Z0) / HG);
      const P = [], T2 = [], I = [];
      for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) {
        const lx = X0 + (X1 - X0) * i / nx, lz = Z0 + (Z1 - Z0) * j / nz, dx = Math.abs(lx) - hw, dz = Math.abs(lz) - L2;
        const along = 0.78 + 0.22 * Math.sin(lz * 1.9 + p2) + 0.12 * Math.sin(lz * 4.3 + p3), side = (lx > 0 ? Hp : Hk) * along, Hs = dz > 0 ? side + (He - side) * Math.min(1, dz / 0.15) : side;
        let h;
        if (dx < 0 && dz < 0) h = Hin + (Hs - Hin) * Math.max(0, Math.min(1, 1 + Math.max(dx, dz) / 0.3));
        else { const t = Math.hypot(Math.max(dx, 0), Math.max(dz, 0)) / RF; h = t < 1 ? Hs * (1 - t * t) ** 2 : 0; }
        if (h > 0) h += lump(lx, lz) * Math.min(1, h / 0.1);
        P.push(lx, Math.max(0, h) - 0.014, lz); T2.push(lx * 0.9, lz * 0.9);
      }
      for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const a = j * (nx + 1) + i, b = a + 1, c2 = a + nx + 1, d = c2 + 1; I.push(a, c2, b, b, c2, d); }
      this.snow.push(this._geo(P, T2, I).applyMatrix4(M));
      // solid where it is more than about 5 cm deep
      const pad = RF * Math.sqrt(Math.max(0, 1 - Math.sqrt(0.05 / (Math.max(Hp, Hk, He) * 1.12))));
      this.plan.obstacles.push({ ...this._rect(x, z, c, s, -hw - pad, hw + pad, -L2 - pad, L2 + pad), y0: y, y1: y + 0.2, parked: true });
    }

    // ---- wipers, a ticket, a few icicles off the drifted side of the roof
    {
      // (along the windscreen from its foot: d; out of it, forwards and up: the normal)
      const g = new Geo(), [zs, ys] = [K.cab[1][0], K.cab[1][1]], [zt, yt] = [K.cab[2][0], K.cab[2][1]], L = Math.hypot(zs - zt, yt - ys), dz = (zt - zs) / L, dy = (yt - ys) / L, nz = dy, ny = -dz;
      const onGlass = (xa, xb, a, b, lift, colr) => { g.col = colr; const P = (xx, d) => [xx, ys + dy * d + ny * lift, zs + dz * d + nz * lift]; g.quad(P(xa, a), P(xb, a), P(xb, b), P(xa, b), [0, ny, nz]); };
      if (scraped) for (const wx of [-0.5, 0.06]) onGlass(wx, wx + 0.48, 0.1, 0.118, 0.01, DARK);         // the wipers, parked at the foot of the hole
      if (ticket) onGlass(-0.42, -0.25, 0.1, 0.28, 0.006, TICKET);                                       // and under one of them, an orange envelope
      if (!g.empty) this.rest.push(g.build().applyMatrix4(M));
      const ice = [], side = Math.sign(drift), rx = (S.at((K.cab[2][0] + K.cab[3][0]) / 2).w + 0.015) * 1.07 * side;
      if (r() < 0.6) for (let k = 0, m = 3 + Math.floor(r() * 4); k < m; k++) {
        const zz = K.cab[3][0] + 0.1 + r() * (K.cab[2][0] - K.cab[3][0] - 0.2), len = 0.04 + r() * 0.09, cn = new THREE.ConeGeometry(0.009 + r() * 0.006, len, 5);
        cn.rotateX(Math.PI); cn.translate(rx, K.cab[2][1] - 0.035 - len / 2, zz); ice.push(cn.toNonIndexed());
      }
      if (ice.length) { const gi = mergeGeometries(ice), m2 = gi.attributes.position.count, ci = new Float32Array(m2 * 3); for (let i = 0; i < m2; i++) ci.set(ICE, i * 3); gi.setAttribute('color', new THREE.BufferAttribute(ci, 3)); const ix = []; for (let i = 0; i < m2; i++) ix.push(i); gi.setIndex(ix); this.rest.push(gi.applyMatrix4(M)); }
    }

    // ---- solid as drawn: the top of the blanket in three strips along the car (the drift, the scraped hole and the
    // snow pushed up round it are not the same across), each fitted with straight pieces
    const STRIPS = [[3, 6, -0.94, -0.33], [6, 8, -0.33, 0.33], [8, 11, 0.33, 0.94]], STEP = 0.04, mean = (i, k0, k1) => { let a = 0; for (let k = k0; k <= k1; k++) a += pos[(i * nU + k) * 3 + 1]; return a / (k1 - k0 + 1) - 0.008; };
    const clampZ = lz => Math.max(S.zr + 0.01, Math.min(S.zf - 0.01, lz));
    const profile = ([k0, k1]) => { const out = []; for (let lz = S.zr; lz <= S.zf + 1e-6; lz += STEP) {
      let h;
      if (lz > Z[1] && lz < Z[nS - 1]) { const f = (lz - S.za) / (S.zb - S.za) * nS, i = Math.max(1, Math.min(nS - 2, Math.floor(f))), t = Math.max(0, Math.min(1, f - i)); h = mean(i, k0, k1) + (mean(i + 1, k0, k1) - mean(i, k0, k1)) * t; }
      else h = topOf(K.body, clampZ(lz));
      out.push([lz, Math.max(h, topOf(K.body, clampZ(lz))), S.at(clampZ(lz)).w]); } return out; };
    const fit = prof => { const out = [];
      for (let a = 0; a < prof.length - 1;) {
        let b = a + 1;
        while (b + 1 < prof.length) {
          const nb = b + 1, [z0, h0] = prof[a], [z1, h1] = prof[nb]; let ok = true;
          for (let k = a + 1; k < nb; k++) { const [zk, hk] = prof[k]; if (Math.abs(h0 + (h1 - h0) * (zk - z0) / (z1 - z0) - hk) > 0.022) { ok = false; break; } }
          if (!ok) break; b = nb;
        }
        let w = Infinity; for (let k = a; k <= b; k++) w = Math.min(w, prof[k][2]);
        out.push({ z0: prof[a][0], z1: prof[b][0], h0: prof[a][1], h1: prof[b][1], w }); a = b;
      } return out; };
    const profs = STRIPS.map(profile), along = s === 0 ? 'z' : 'x';
    let top = 0;
    STRIPS.forEach(([, , u0, u1], n) => { for (const q of fit(profs[n])) {
      // a top: a slope along the car, in the world's terms
      const R = this._rect(x, z, c, s, u0 * q.w, u1 * q.w, q.z0, q.z1), w0 = along === 'z' ? z + q.z0 * c : x + q.z0 * s, lowEnd = along === 'z' ? R.z0 : R.x0;
      const flip = Math.abs(w0 - lowEnd) > 1e-6, ha = y + (flip ? q.h1 : q.h0), hb = y + (flip ? q.h0 : q.h1), flat = Math.abs(ha - hb) < 0.004;
      this.plan.surfaces.push({ skin: 'wall', fixed: true, ...R, axis: flat ? null : along, h0: flat ? Math.max(ha, hb) : ha, h1: flat ? Math.max(ha, hb) : hb, base: y, parked: true });
      top = Math.max(top, q.h0, q.h1);
    } });
    // The body under the tops, solid to a little below the lowest top near it (so that nothing stops a toy come down on
    // it from above, and a toy climbing the windscreen is not stopped by the roof).
    const lowest = profs[0].map((q, k) => Math.min(q[1], profs[1][k][1], profs[2][k][1]));
    for (let lz = S.zr; lz < S.zf - 1e-6; lz += 0.3) {
      const l1 = Math.min(S.zf, lz + 0.3); let lo = Infinity; profs[0].forEach((q, k) => { if (q[0] > lz - 0.3 && q[0] < l1 + 0.3) lo = Math.min(lo, lowest[k]); });
      this.plan.obstacles.push({ ...this._rect(x, z, c, s, -hw - 0.025, hw + 0.025, lz, l1), y0: y, y1: y + lo - 0.08, parked: true });
    }
    this.list.push({ kind: id, x, y, z, fx, fz, len: K.len, hw, scraped, ticket, colour: '#' + colour.getHexString(), top });
  }

  _rect(x, z, c, s, lx0, lx1, lz0, lz1) {
    const xa = x + lx0 * c + lz0 * s, xb = x + lx1 * c + lz1 * s, za = z - lx0 * s + lz0 * c, zb = z - lx1 * s + lz1 * c;
    return { x0: Math.min(xa, xb), x1: Math.max(xa, xb), z0: Math.min(za, zb), z1: Math.max(za, zb) };
  }
  _geo(pos, uv, idx) {
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return g;
  }

  // Everything added, as meshes: `snow` is the street's snow material.
  meshes(snow) {
    const out = [], mk = (list, m) => { if (!list.length) return; const me = new THREE.Mesh(mergeGeometries(list), m); me.matrixAutoUpdate = false; me.updateMatrix(); out.push(me); };
    // Paint: each car its own colour (in its vertices), and that colour glowing a little, as the traffic's does at night.
    const paintM = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.4, metalness: 0.45, emissive: 0xffffff, emissiveIntensity: 0.38 });
    paintM.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('vec3 totalEmissiveRadiance = emissive;', 'vec3 totalEmissiveRadiance = emissive * vColor.rgb;'); };
    paintM.customProgramCacheKey = () => 'parked-paint';
    mk(this.paint, paintM);
    mk(this.rest, new THREE.MeshBasicMaterial({ vertexColors: true }));
    mk(this.snow, snow);
    return out;
  }
}
