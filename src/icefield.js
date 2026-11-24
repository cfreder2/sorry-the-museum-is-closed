// The harbour ice is not one sheet. It froze in plates, twenty metres or so across, and the wind off the lake has been
// working on them since: where two plates were shoved together there is a pressure ridge, a heave of broken ice with
// snow packed into it; where two pulled apart the lead between them froze again later, black and glassy; the wind has
// swept some of it bare and laid the snow down in long drifts in the lee of anything that stands up. Pure data, no
// three.js, no DOM: made once at start-up (plan.js addLakefront, by way of harbourplan.js), and read by everything.
//
// Two things come out of it, and both are read by the car and by the drawing alike, so that what you see is what the
// wheels are on:
//
//   * the heave: a height field on a 0.4 m grid, read as a smooth curve through it (heaveAt), nothing at all over most
//     of the ice. The ridges (up to 19 cm, to hop) and the deep drifts (up to 7 cm, soft: they slow a toy down). It is
//     a piece of ground like the hills (harbourplan.js puts it in plan.surfaces); lakefront.js draws it from the same
//     curve.
//   * the look, on a 0.25 m grid, four numbers a point: how snowed over (R), how milky the ice (G), refrozen lead (B),
//     how shattered (A). src/icelook.js draws the ice from it (it is the shader's zone map, byte for byte), and the
//     car's grip is read from the very same bytes (crust): snow holds, bare ice slides a little more, a refrozen lead
//     is slick.
//
// Nothing rises in the way marked across the ice to the floes (`way`), near the fishing hole, at the foot of the
// revetment or along the broken edge (which has its own slabs and blocks).

export const ZSTEP = 0.25;        // the look's grid, metres
export const HSTEP = 0.4;         // the heave's

const sm = (a, b, t) => { t = (t - a) / (b - a); t = t < 0 ? 0 : t > 1 ? 1 : t; return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const hash = (i, j, s) => { let h = (Math.imul(i, 374761393) + Math.imul(j, 668265263) + Math.imul(s, 1274126177)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
// Smooth noise, 0 to 1, the same every time.
const noise = s => (x, z) => {
  const i = Math.floor(x), j = Math.floor(z), fx = x - i, fz = z - j, u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz);
  return lerp(lerp(hash(i, j, s), hash(i + 1, j, s), u), lerp(hash(i, j + 1, s), hash(i + 1, j + 1, s), u), v);
};
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const cr = (t, a, b, c, d) => b + 0.5 * t * (c - a + t * (2 * a - 5 * b + 4 * c - d + t * (3 * (b - c) + d - a)));
// How far (x, z) is from the line through pts ([[x, z], ...]).
function wayDist(pts, x, z) {
  let m = Infinity;
  for (let i = 0; i + 1 < pts.length; i++) {
    const [ax, az] = pts[i], [bx, bz] = pts[i + 1], dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz || 1;
    let t = ((x - ax) * dx + (z - az) * dz) / l2; t = t < 0 ? 0 : t > 1 ? 1 : t;
    const d = Math.hypot(x - ax - dx * t, z - az - dz * t); if (d < m) m = d;
  }
  return m;
}

// o: { x0, x1, z0, z1: the sheet's box; edgeX(z): where it gives out; play: [z0, z1] the part that can be driven on;
//      hx0: nothing rises west of this (the foot of the revetment); way: the marked way [[x, z], ...];
//      keep: [{ x, z, r }] nothing rises here; posts: [{ x, z }] things frozen in (a ring of bare ice, a tail of snow) }
export function buildIceField(o) {
  const { x0, x1, z0, z1, edgeX, play, hx0, way = [], keep = [], posts = [] } = o;
  const WIND = [-0.2425, 0.9701], ACROSS = [0.9701, 0.2425];        // the wind off the lake, from the north-north-east
  const r = rng(60125), n1 = noise(11), n2 = noise(23), n3 = noise(37), n4 = noise(51), n5 = noise(77);
  const fbm = (n, x, z) => n(x, z) * 0.6 + n(x * 2.13 + 7.1, z * 2.13 + 3.3) * 0.28 + n(x * 4.7 + 1.7, z * 4.7 + 9.2) * 0.12;

  // ---- the plates: a jittered grid of middles; a point belongs to the nearest (the ground warped a little first, so
  // their edges wander)
  const CX = 14, CZ = 21, gx = Math.ceil((x1 - x0) / CX) + 2, gz = Math.ceil((z1 - z0) / CZ) + 2, sites = [];
  for (let j = 0; j < gz; j++) for (let i = 0; i < gx; i++) sites.push({ x: x0 + (i - 0.5 + 0.15 + r() * 0.7) * CX, z: z0 + (j - 0.5 + 0.15 + r() * 0.7) * CZ, tone: r(), bias: r() - 0.5, id: sites.length });
  const near = { i: 0, j: 0, k: 0, d1: 0, d2: 0, d3: 0, qx: 0, qz: 0 };
  const plates = (x, z) => {
    const qx = x + (n1(x / 9, z / 9) - 0.5) * 6 + (n2(x / 2.7, z / 2.7) - 0.5) * 1.1, qz = z + (n1(x / 9 + 31, z / 9 + 17) - 0.5) * 6 + (n2(x / 2.7 + 5, z / 2.7 + 8) - 0.5) * 1.1;
    const ci = Math.floor((qx - x0) / CX + 0.5), cj = Math.floor((qz - z0) / CZ + 0.5);
    let d1 = Infinity, d2 = Infinity, d3 = Infinity, a = 0, b = 0, c = 0;
    for (let j = Math.max(0, cj - 1); j <= Math.min(gz - 1, cj + 1); j++) for (let i = Math.max(0, ci - 2); i <= Math.min(gx - 1, ci + 2); i++) {
      const s = sites[j * gx + i], d = (s.x - qx) ** 2 + (s.z - qz) ** 2;
      if (d < d1) { d3 = d2; c = b; d2 = d1; b = a; d1 = d; a = s.id; } else if (d < d2) { d3 = d2; c = b; d2 = d; b = s.id; } else if (d < d3) { d3 = d; c = s.id; }
    }
    near.i = a; near.j = b; near.k = c; near.d1 = d1; near.d2 = d2; near.d3 = d3; near.qx = qx; near.qz = qz;
    return near;
  };
  // What lies along the join of two plates: 0 a ridge, 1 a refrozen lead, 2 only a seam.
  const join = (a, b) => { const h = hash(Math.min(a, b), Math.max(a, b), 5); return h < 0.34 ? 0 : h < 0.56 ? 1 : 2; };
  // At (x, z): how far from the nearest join, what it is, and how much of it there is here (it thins out towards where
  // three plates meet, and comes and goes along its length).
  const J = { d: 0, kind: 2, amt: 0, a: 0, b: 0 };
  const joinAt = (x, z) => {
    const p = plates(x, z), A = sites[p.i], Bs = sites[p.j], sep = Math.hypot(A.x - Bs.x, A.z - Bs.z) || 1;
    J.d = (p.d2 - p.d1) / (2 * sep); J.kind = join(p.i, p.j); J.a = p.i; J.b = p.j;
    const corner = sm(0.6, 3.2, Math.sqrt(p.d3) - Math.sqrt(p.d2));
    const along = J.kind === 0 ? sm(0.38, 0.56, n3(x / 6.5 + p.i, z / 6.5 + p.j)) : J.kind === 1 ? sm(0.3, 0.45, n3(x / 11 + p.j, z / 11 + p.i)) : 1;
    J.amt = corner * along;
    return J;
  };

  // ---- where nothing may rise
  const [pz0, pz1] = play;
  const open = (x, z) => {
    let k = sm(hx0, hx0 + 2, x) * sm(4.8, 6.5, edgeX(z) - x) * sm(pz0, pz0 + 2.5, z) * sm(pz1, pz1 - 2.5, z);
    if (!k) return 0;
    if (way.length) k *= sm(2.3, 3.6, wayDist(way, x, z));
    for (const q of keep) k *= sm(q.r, q.r + 1.6, Math.hypot(x - q.x, z - q.z));
    for (const q of posts) k *= sm(0.55, 1.3, Math.hypot(x - q.x, z - q.z));
    return k;
  };

  // ---- the ridges: a rounded heave along a join, its height its own, wider where it is higher
  const ridge = (x, z) => {
    const j = joinAt(x, z); if (j.kind !== 0 || !j.amt) return 0;
    const u = hash(j.a + j.b, j.a * j.b, 9), H = 0.11 + 0.055 * u, w = 0.75 + 0.3 * u;
    if (j.d >= w) return 0;
    const c = Math.cos(j.d / w * Math.PI / 2), lump = 0.82 + 0.36 * n4(x * 1.3, z * 1.3);
    return H * c * c * j.amt * lump;
  };

  // ---- the drifts: long low mounds lying down the wind, steep at the head and tailing off; most of them in the lee of
  // a ridge, some out on their own
  const drifts = [];
  const tryDrift = (x, z, len, wid, H) => {
    const cx = x + WIND[0] * len * 0.5, cz = z + WIND[1] * len * 0.5;
    for (const t of [0, 0.5, 1]) if (open(x + WIND[0] * len * t, z + WIND[1] * len * t) < 0.999) return false;
    if (drifts.some(d => Math.hypot(d.cx - cx, d.cz - cz) < (d.len + len) * 0.42)) return false;
    drifts.push({ cx, cz, len: len / 2, wid: wid / 2, H, R: Math.hypot(len, wid) / 2 + 0.2 }); return true;
  };
  for (let t = 0, n = 0; t < 9000 && n < 26; t++) {
    const x = hx0 + 2 + r() * (x1 - hx0 - 8), z = pz0 + 4 + r() * (pz1 - pz0 - 8);
    if (ridge(x, z) < 0.07) continue;
    if (tryDrift(x + WIND[0] * 0.5, z + WIND[1] * 0.5, 4.5 + r() * 5, 1.5 + r() * 1.3, 0.045 + r() * 0.03)) n++;
  }
  for (let t = 0, n = 0; t < 3000 && n < 30; t++) {
    const x = hx0 + 1 + r() * (x1 - hx0 - 7), z = pz0 + 4 + r() * (pz1 - pz0 - 12);
    if (tryDrift(x, z, 3.5 + r() * 6.5, 1.3 + r() * 1.5, 0.035 + r() * 0.035)) n++;
  }
  const drift = (x, z) => {
    let h = 0;
    for (const d of drifts) {
      const dx = x - d.cx, dz = z - d.cz; if (dx > d.R || dx < -d.R || dz > d.R || dz < -d.R) continue;
      const u = (dx * WIND[0] + dz * WIND[1]) / d.len, v = (dx * ACROSS[0] + dz * ACROSS[1]) / d.wid; if (u <= -1 || u >= 1 || v <= -1 || v >= 1) continue;
      const cv = Math.cos(v * Math.PI / 2), k = d.H * cv * cv * sm(-1, -0.5, u) * (1 - sm(-0.25, 1, u));
      if (k > h) h = k;
    }
    return h;
  };

  // ---- the heave, on its grid
  const HX0 = Math.floor(hx0 / HSTEP) * HSTEP, HZ0 = Math.floor(pz0 / HSTEP) * HSTEP, hnx = Math.ceil((x1 - HX0) / HSTEP), hnz = Math.ceil((pz1 - HZ0) / HSTEP), HN = hnx + 1;
  const h = new Float32Array(HN * (hnz + 1));
  let top = 0;
  for (let j = 2; j < hnz - 1; j++) for (let i = 2; i < hnx - 1; i++) {
    const x = HX0 + i * HSTEP, z = HZ0 + j * HSTEP, k = open(x, z); if (!k) continue;
    const v = Math.max(ridge(x, z), drift(x, z)) * k;
    if (v > 0.004) { h[j * HN + i] = v; if (v > top) top = v; }
  }
  // Which cells have any of it: any of the sixteen points the curve through a cell is drawn from.
  const cells = new Uint8Array(hnx * hnz);
  for (let j = 0; j <= hnz; j++) for (let i = 0; i <= hnx; i++) if (h[j * HN + i]) for (let b = Math.max(0, j - 2); b <= Math.min(hnz - 1, j + 1); b++) for (let a = Math.max(0, i - 2); a <= Math.min(hnx - 1, i + 1); a++) cells[b * hnx + a] = 1;
  const heaveAt = (x, z) => {
    const u = (x - HX0) / HSTEP, v = (z - HZ0) / HSTEP, i = Math.floor(u), j = Math.floor(v);
    if (i < 1 || j < 1 || i >= hnx - 1 || j >= hnz - 1 || !cells[j * hnx + i]) return 0;
    const fx = u - i, fz = v - j, row = k => cr(fx, h[k - 1], h[k], h[k + 1], h[k + 2]), a = j * HN + i;
    const y = cr(fz, row(a - HN), row(a), row(a + HN), row(a + 2 * HN));
    return y > 0.0015 ? y : 0;
  };

  // ---- the look, on its grid
  const nx = Math.ceil((x1 - x0) / ZSTEP), nz = Math.ceil((z1 - z0) / ZSTEP), data = new Uint8Array(nx * nz * 4);
  const byte = v => (v <= 0 ? 0 : v >= 1 ? 255 : Math.round(v * 255));
  for (let j = 0; j < nz; j++) {
    const z = z0 + (j + 0.5) * ZSTEP, ex = edgeX(z), span = ex - x0;
    for (let i = 0; i < nx; i++) {
      const x = x0 + (i + 0.5) * ZSTEP, t = (x - x0) / span, jn = joinAt(x, z), P = sites[near.i];
      const wu = (x * WIND[0] + z * WIND[1]), wv = (x * ACROSS[0] + z * ACROSS[1]);
      // snow: banked along the shore, swept bare in the middle, crusted further out, thin again at the edge; laid in
      // streaks down the wind; each plate a little more or less than its neighbours
      let snow = lerp(0.6, 0.2, sm(0.05, 0.2, t)); snow = lerp(snow, 0.5, sm(0.55, 0.78, t)); snow = lerp(snow, 0.36, sm(0.9, 1.0, t));
      snow += (fbm(n5, wu / 15, wv / 2.6) - 0.5) * 0.62 + (n2(wu / 5, wv / 0.9) - 0.5) * 0.16 + P.bias * 0.2;
      const lead = jn.kind === 1 ? (1 - sm(0.3, 0.75 + 0.5 * n4(x / 4, z / 4), jn.d)) * jn.amt : 0;
      const rdg = jn.kind === 0 ? (1 - sm(0.5, 2.6, jn.d)) * jn.amt : 0;
      snow = Math.max(snow, 0.42 + 0.3 * rdg);                       // snow catches along a ridge
      snow *= 1 - lead;                                              // and none lies on a lead, which froze after it fell
      if (way.length) snow -= 0.14 * (1 - sm(0.8, 2.4, wayDist(way, x, z)));           // the marked way is worn a little barer
      for (const q of posts) {                                      // a ring of bare ice round whatever is frozen in, and a tail of snow in its lee
        const dx = x - q.x, dz = z - q.z; if (dx > 5 || dx < -5 || dz > 6 || dz < -3) continue;
        const d = Math.hypot(dx, dz), u = dx * WIND[0] + dz * WIND[1], v = dx * ACROSS[0] + dz * ACROSS[1];
        snow = Math.max(snow, (1 - sm(0.12, 0.3 + u * 0.05, Math.abs(v))) * sm(0.25, 0.6, u) * (1 - sm(1.5, 4.2, u)) * 0.95);
        if (d < 0.75) snow = Math.min(snow, lerp(0.08, snow, sm(0.4, 0.75, d)));
      }
      const hv = (heaveAt(x, z) * 2 + heaveAt(x - 0.35, z) + heaveAt(x + 0.35, z) + heaveAt(x, z - 0.35) + heaveAt(x, z + 0.35)) / 6; if (hv > 0) snow = Math.max(snow, 0.3 + 0.7 * sm(0.002, 0.04, hv));      // snow lies on whatever rises, deeper the higher (the edge of it eased, so the map's grid does not show)
      const k = (j * nx + i) * 4;
      data[k] = byte(snow);
      data[k + 1] = byte(P.tone * P.tone * 0.6 + (fbm(n1, x / 7, z / 7) - 0.5) * 0.5 + rdg * 0.4 + 0.2 * sm(0.5, 0.8, t) + 0.6 * (1 - sm(0.4, 4.5, ex - x)) - lead);
      data[k + 2] = byte(lead);
      data[k + 3] = byte(0.18 + 0.82 * Math.max((1 - sm(0.1, 1.7, jn.d)) * (jn.kind === 2 ? 0.75 : 1), rdg) + (n4(x / 3, z / 3) - 0.5) * 0.25 + 0.3 * (1 - sm(0.5, 5, x - x0)));
    }
  }
  const tex = (x, z, c) => {       // one of the four, read between the points exactly as the shader's sampler reads it
    let u = (x - x0) / ZSTEP - 0.5, v = (z - z0) / ZSTEP - 0.5; u = u < 0 ? 0 : u > nx - 1 ? nx - 1 : u; v = v < 0 ? 0 : v > nz - 1 ? nz - 1 : v;
    const i = Math.min(nx - 2, Math.floor(u)), j = Math.min(nz - 2, Math.floor(v)), fx = u - i, fz = v - j, a = (j * nx + i) * 4 + c;
    return (lerp(lerp(data[a], data[a + 4], fx), lerp(data[a + nx * 4], data[a + nx * 4 + 4], fx), fz)) / 255;
  };
  // How well the ice holds here, as vehicles.js counts it (0 glassy, 1 as good as packed snow; the harbour was 0.85
  // all over before it had a lie of its own): bare ice a little under that, snow above it, a refrozen lead well under.
  const crust = (x, z) => 0.8 + 0.2 * sm(0.42, 0.6, tex(x, z, 0)) - 0.32 * sm(0.25, 0.75, tex(x, z, 2));

  // Places along the crests of the ridges, well apart, for the plates rafted up on them (harbourplan.js).
  const crests = [];
  for (let t = 0; t < 30000 && crests.length < 110; t++) {
    const x = hx0 + 1 + r() * (x1 - hx0 - 6), z = pz0 + 3 + r() * (pz1 - pz0 - 6), hv = heaveAt(x, z);
    if (hv < 0.085 || drift(x, z) > 0.01 || crests.some(c => Math.hypot(c.x - x, c.z - z) < 2.2)) continue;
    crests.push({ x, z, h: hv });
  }

  return { x0, x1, z0, z1, nx, nz, data, tex, crust, heaveAt, drift, top, drifts, crests, sites,
    heave: { x0: HX0, z0: HZ0, nx: hnx, nz: hnz, h, cells } };
}
