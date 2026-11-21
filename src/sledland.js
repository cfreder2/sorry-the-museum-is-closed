// The sledding hill's ground (sledhill.js draws it and runs the clock): one heightfield, worked out once at start-up, that
// the car drives on and the mesh is drawn from, so the two are the same surface to the millimetre. No three.js, no DOM.
//
// How it is made. The sled run and the path up are ribbons: a centre line with a height all along it and a cross-section
// (a shallow trough with a lip each side; on the turns the floor tilts and the outside rises into a banked wall). The
// summit is a flat disc. Those are pinned, the ground beyond the hill's outline is pinned at nothing, and everything in
// between is a sheet stretched over them and blown up a little from below (a Poisson membrane), which gives the hill
// its soft shoulders. Then the foot is eased into the field, the wind's drifts are laid on the open faces, and a big
// drift is piled over the run with a tunnel bored through it.
//
// heightAt(x, z) interpolates the grid on the same two triangles per cell the mesh is drawn with.

export const LAND = { x0: 303, z0: 114, step: 0.5, nx: 161, nz: 194 };           // 80.5 m by 97 m: the south-west quarter of Butler Field
export const TOP = { x: 331, z: 143, r: 6 };                                       // the summit, flat
const SPREAD = 0.42;                                                              // the steepest the hill's sides fall away to the field
const FOOT = 0.4;                                                                 // how gently the foot meets the field
const PIN_TOP = 7.9;                                                              // (the summit ends up 7.5 m high once the foot is eased)

const smooth = t => { t = t < 0 ? 0 : t > 1 ? 1 : t; return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;

// ---------------------------------------------------------------- the ribbons
// A centre line built from straights and arcs (x east, z south; a positive arc turns right, as the driver sees it),
// sampled every 0.25 m with its heading, curvature and distance along.
function trace(x, z, heading, parts) {
  const P = [], ds = 0.25; let s = 0, th = heading;
  P.push({ x, z, tx: Math.cos(th), tz: Math.sin(th), k: 0, s });
  for (const p of parts) {
    const L = p.arc ? Math.abs(p.arc) * p.r : p.len, n = Math.max(1, Math.round(L / ds)), k = p.arc ? Math.sign(p.arc) / p.r : 0, d = L / n;
    for (let i = 0; i < n; i++) {
      if (k) { const th1 = th + k * d; x += (Math.sin(th1) - Math.sin(th)) / k; z -= (Math.cos(th1) - Math.cos(th)) / k; th = th1; }
      else { x += Math.cos(th) * d; z += Math.sin(th) * d; }
      s += d; P.push({ x, z, tx: Math.cos(th), tz: Math.sin(th), k, s });
    }
  }
  return P;
}
// A centre line through control points (Catmull-Rom), for the path up.
function spline(pts) {
  const P = []; let s = 0, px = pts[0][0], pz = pts[0][1];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    const L = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]), n = Math.max(2, Math.round(L / 0.25));
    for (let j = i ? 1 : 0; j <= n; j++) {
      const t = j / n, t2 = t * t, t3 = t2 * t, f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      const x = f(p0[0], p1[0], p2[0], p3[0]), z = f(p0[1], p1[1], p2[1], p3[1]);
      s += Math.hypot(x - px, z - pz); px = x; pz = z; P.push({ x, z, s, k: 0, tx: 0, tz: 0 });
    }
  }
  for (let i = 0; i < P.length; i++) { const a = P[Math.max(0, i - 1)], b = P[Math.min(P.length - 1, i + 1)], l = Math.hypot(b.x - a.x, b.z - a.z) || 1; P[i].tx = (b.x - a.x) / l; P[i].tz = (b.z - a.z) / l; }
  // keyframes along the path are given at the control points: their distance along
  let acc = 0; pts[0].s = 0; for (let i = 1; i < pts.length; i++) { acc += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); pts[i].s = acc; }
  const scale = s / acc; for (const p of pts) p.s *= scale;
  return P;
}
// Heights along a ribbon from keyframes [[s, h], ...]: straight between them, then smoothed over `win` metres.
function profile(P, keys, win) {
  const raw = P.map(p => { let i = 0; while (i < keys.length - 2 && keys[i + 1][0] < p.s) i++; const [s0, h0] = keys[i], [s1, h1] = keys[i + 1]; return lerp(h0, h1, Math.max(0, Math.min(1, (p.s - s0) / (s1 - s0)))); });
  const n = Math.round(win / 0.25 / 2), out = raw.slice();
  if (n > 0) for (let i = 0; i < P.length; i++) { let a = 0, c = 0; for (let j = Math.max(0, i - n); j <= Math.min(P.length - 1, i + n); j++) { a += raw[j]; c++; } out[i] = a / c; }
  P.forEach((p, i) => { p.h = out[i]; });
}

// The sled run: off the summit eastwards, a hairpin right, back west over the first kicker, a hairpin left, east again
// through the tunnel, a right-hander, and south over the second kicker to the finish.
export const RUN_W = 2.3, RUN_LIP = 1.8;
export const RUN_PARTS = [{ len: 20 }, { arc: Math.PI, r: 8 }, { len: 20 }, { arc: -Math.PI, r: 8 }, { len: 22 }, { arc: Math.PI / 2, r: 8 }, { len: 18 }];
export const RUN_FROM = { x: 337, z: 143, heading: 0 };
const RUN_KEYS = [[0, 7.9], [2.5, 7.9], [13, 6.75], [20, 6.3], [45.1, 5.55], [52.6, 5.3], [55, 5.25], [61.5, 4.2], [65.1, 4.05], [90.3, 3.35], [101.3, 2.95], [112.3, 2.5], [124.8, 2.1], [127.3, 2.05], [129.7, 2.0], [135.5, 0.4], [137.5, 0.05], [142.8, 0]];
export const KICKERS = [{ s: 52.6, len: 2.4, up: 0.42 }, { s: 127.3, len: 2.4, up: 0.42 }];
export const FINISH_S = 137;
export const TUNNEL = { s0: 96.3, s1: 101.3, half: 2.5, clear: 2.15, thick: 0.55 };      // along the run; half width of the bore; drift top over the floor
// The path up: from the foot of the west side, north up the flank, round onto the summit.
export const PATH_W = 1.4, PATH_LIP = 0.9;
const PATH_PTS = [[323, 210.5], [319, 197], [316.5, 181], [317, 165], [320, 153.5], [325.5, 146.2], [328.5, 143.6]];
const PATH_H = [0, 1.0, 2.5, 4.4, 6.25, 7.85, 7.9];
// The steps: timber stairs straight up the north face from the cross path, for people (a car cannot climb steps).
export const STAIR = { x: 334.5, z0: 115.5, z1: 138.2, w: 1.0, lip: 0.6 };

// The ribbon's cross-section: how far above its centre-line height the ground stands at `d` metres to the side
// (d > 0 to the left). Banks lean the floor into each turn and raise its outside into a wall.
function crossRun(p, d, fade) {
  const w = RUN_W, ad = Math.abs(d);
  let h = 0.12 * Math.min(1, (ad / w) ** 2);
  if (ad > w) h += 0.55 * smooth((ad - w) / RUN_LIP);
  if (p.bank) {
    const u = -d * Math.sign(p.kk || 1);                            // + toward the outside of the turn
    const t = Math.max(0, (u + w) / (2 * w + RUN_LIP));
    h += p.bank * t * t;
  }
  return h * fade;
}
function crossPath(d) { const ad = Math.abs(d); return ad <= PATH_W ? 0.03 * (ad / PATH_W) ** 2 : 0.03 + 0.14 * smooth((ad - PATH_W) / PATH_LIP); }

// Kicker bump along the run at distance s.
function kick(s) {
  let h = 0;
  for (const q of KICKERS) {
    const t = (s - q.s) / q.len;
    if (t >= 0 && t <= 1) h += q.up * t * t;
    else if (t > 1 && s - q.s - q.len < 0.9) h += q.up * (1 + Math.cos(Math.PI * (s - q.s - q.len) / 0.9)) / 2;
  }
  return h;
}

// ---------------------------------------------------------------- building it
export function buildLand() {
  const { x0, z0, step, nx, nz } = LAND, W = nx + 1, N = W * (nz + 1);
  const run = trace(RUN_FROM.x, RUN_FROM.z, RUN_FROM.heading, RUN_PARTS);
  profile(run, RUN_KEYS, 3);
  for (const p of run) p.h += kick(p.s);
  // banks: how hard the run is turning, eased in and out over a few metres
  { const raw = run.map(p => Math.abs(p.k) * 9), n = 16; run.forEach((p, i) => { let a = 0, c = 0, kk = 0; for (let j = Math.max(0, i - n); j <= Math.min(run.length - 1, i + n); j++) { a += raw[j]; c++; kk += run[j].k; } p.bank = 1.35 * a / c; p.kk = kk; }); }
  const pathPts = PATH_PTS.map(p => p.slice()); const path = spline(pathPts);
  profile(path, pathPts.map((p, i) => [p.s, PATH_H[i]]), 4);
  const stair = trace(STAIR.x, STAIR.z0, Math.PI / 2, [{ len: STAIR.z1 - STAIR.z0 }]);
  for (const p of stair) p.h = PIN_TOP * p.s / (STAIR.z1 - STAIR.z0);
  const runLen = run[run.length - 1].s, pathLen = path[path.length - 1].s;

  const h = new Float32Array(N), pin = new Uint8Array(N);
  const kind = new Uint8Array(N);              // 1 run floor, 2 run lip or bank, 3 path, 4 summit, 5 tunnel drift, 6 the steps
  const tan = new Float32Array(N * 2), along = new Float32Array(N).fill(-1), gap = new Float32Array(N).fill(99);      // run direction, distance down the run, and how far outside any ribbon
  // Each ribbon: its samples, how wide it is pinned, and its cross-section.
  const ribs = [
    { P: run, reach: RUN_W + RUN_LIP, len: runLen, cross: (p, d) => crossRun(p, d, smooth(p.s / 3) * (1 - smooth((p.s - (runLen - 6)) / 5))), kind: (ad) => ad <= RUN_W ? 1 : 2 },
    { P: path, reach: PATH_W + PATH_LIP, len: pathLen, cross: (p, d) => crossPath(d) * smooth(p.s / 2) * (1 - smooth((p.s - (pathLen - 4)) / 3)), kind: () => 3 },
    { P: stair, reach: STAIR.w + STAIR.lip, len: STAIR.z1 - STAIR.z0, cross: (p, d) => 0.1 * smooth((Math.abs(d) - STAIR.w) / STAIR.lip) * smooth(p.s / 1.5) * (1 - smooth((p.s - (STAIR.z1 - STAIR.z0 - 2)) / 1.5)), kind: () => 6 },
  ];
  // the samples, bucketed for the nearest-sample search
  const B = 2, bucket = new Map(), key = (i, j) => i * 10007 + j;
  ribs.forEach((r, rib) => { for (let i = 0; i < r.P.length; i++) { const p = r.P[i], k = key(Math.floor(p.x / B), Math.floor(p.z / B)); if (!bucket.has(k)) bucket.set(k, []); bucket.get(k).push(rib, i); } });
  const best = [], bd = [];
  const nearest = (x, z, R) => {
    for (let r = 0; r < ribs.length; r++) { best[r] = null; bd[r] = 1e9; }
    const rr = Math.ceil(R / B), bi = Math.floor(x / B), bj = Math.floor(z / B);
    for (let di = -rr; di <= rr; di++) for (let dj = -rr; dj <= rr; dj++) { const L = bucket.get(key(bi + di, bj + dj)); if (!L) continue; for (let m = 0; m < L.length; m += 2) { const rib = L[m], p = ribs[rib].P[L[m + 1]], d2 = (p.x - x) ** 2 + (p.z - z) ** 2; if (d2 < bd[rib]) { bd[rib] = d2; best[rib] = p; } } }
    return best;
  };
  for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) {
    const n = j * W + i, x = x0 + i * step, z = z0 + j * step;
    nearest(x, z, RUN_W + RUN_LIP + 6);
    let closest = 1e9;
    ribs.forEach((r, rib) => {
      const p = best[rib]; if (!p) return;
      const d = -(x - p.x) * p.tz + (z - p.z) * p.tx, ad = Math.hypot(x - p.x, z - p.z), out = ad - r.reach;
      if (out < gap[n]) gap[n] = out;
      if (rib === 0 && ad <= r.reach + 1.5) { tan[n * 2] = p.tx; tan[n * 2 + 1] = p.tz; along[n] = p.s; }
      if (ad <= r.reach && ad / r.reach < closest && p.s > 0.01 && p.s < r.len - 0.01) { closest = ad / r.reach; h[n] = p.h + r.cross(p, d); pin[n] = 1; kind[n] = r.kind(ad); }
    });
    const dt = Math.hypot(x - TOP.x, z - TOP.z);
    if (dt <= TOP.r) { h[n] = PIN_TOP; pin[n] = 1; kind[n] = 4; }
    if (i === 0 || j === 0 || i === nx || j === nz) { if (!pin[n]) { h[n] = 0; pin[n] = 1; } }
  }
  // Where the hill runs out: as far from everything pinned as its height allows at SPREAD (a chamfer distance, two passes).
  const E = new Float32Array(N); for (let n = 0; n < N; n++) E[n] = pin[n] && h[n] > 0 ? h[n] : -99;
  { const a = SPREAD * step, b = a * Math.SQRT2;
    for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) { const n = j * W + i; let e = E[n]; if (i > 0) e = Math.max(e, E[n - 1] - a); if (j > 0) { e = Math.max(e, E[n - W] - a); if (i > 0) e = Math.max(e, E[n - W - 1] - b); if (i < nx) e = Math.max(e, E[n - W + 1] - b); } E[n] = e; }
    for (let j = nz; j >= 0; j--) for (let i = nx; i >= 0; i--) { const n = j * W + i; let e = E[n]; if (i < nx) e = Math.max(e, E[n + 1] - a); if (j < nz) { e = Math.max(e, E[n + W] - a); if (i < nx) e = Math.max(e, E[n + W + 1] - b); if (i > 0) e = Math.max(e, E[n + W - 1] - b); } E[n] = e; } }
  for (let n = 0; n < N; n++) if (!pin[n] && E[n] <= 0) { h[n] = 0; pin[n] = 1; }
  // The sheet over it all: Gauss-Seidel with over-relaxation, from the envelope as a first guess (it settles fast).
  for (let n = 0; n < N; n++) if (!pin[n]) h[n] = E[n];
  const src = 0.05 * step * step, w = 1.92;
  for (let it = 0; it < 260; it++) {
    for (let j = 1; j < nz; j++) for (let i = 1; i < nx; i++) {
      const n = j * W + i; if (pin[n]) continue;
      const v = (h[n - 1] + h[n + 1] + h[n - W] + h[n + W] + src) * 0.25;
      h[n] += w * (v - h[n]);
    }
  }
  // The foot eased into the field.
  for (let n = 0; n < N; n++) { const v = Math.max(0, h[n]); h[n] = v - FOOT * (1 - Math.exp(-v / FOOT)); }
  // The wind (from the north-west, as it comes across the lake shore in January): a cornice on the lee of the summit's
  // rim and long low drifts on the open faces, kept off the run and the path.
  const drift = (x, z) => {
    let d = 0;
    { const dx = x - TOP.x, dz = z - TOP.z, r = Math.hypot(dx, dz), a = Math.atan2(dz, dx);       // the cornice, round the south-east of the rim
      const ang = Math.cos(a - 0.9); if (ang > 0.2 && r > TOP.r + 0.2) d += 0.32 * smooth((ang - 0.2) / 0.5) * Math.exp(-(((r - TOP.r - 1.6) / 1.1) ** 2)); }
    for (const [cx, cz, L, Wd, a, H] of DRIFTS) { const ca = Math.cos(a), sa = Math.sin(a), u = ((x - cx) * ca + (z - cz) * sa) / L, v = (-(x - cx) * sa + (z - cz) * ca) / Wd; const q = u * u + v * v; if (q < 1) d += H * (1 - q) * (1 - q) * (u > 0 ? 1 : 0.6 + 0.4 * (1 + u)); }
    return d;
  };
  for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) {
    const n = j * W + i; if (kind[n] || h[n] <= 0.02) continue;
    const away = smooth((gap[n] - 0.6) / 2.2), dt = Math.hypot(x0 + i * step - TOP.x, z0 + j * step - TOP.z), offTop = smooth((dt - TOP.r - 0.3) / 1.2);
    h[n] += drift(x0 + i * step, z0 + j * step) * away * offTop * smooth(h[n] / 0.8);
  }
  // The whole thing lightly smoothed (three passes of a 1-2-1 blur), so that no crease is left where one part meets
  // another. (The drift goes on after, so that the walls of the bore stay walls.)
  { const tmp = new Float32Array(N);
    for (let pass = 0; pass < 3; pass++) for (const along of [1, W]) {
      for (let n = 0; n < N; n++) { const i = n % W, j = (n - i) / W, edge = along === 1 ? i === 0 || i === nx : j === 0 || j === nz; tmp[n] = edge ? h[n] : (h[n - along] + 2 * h[n] + h[n + along]) / 4; }
      h.set(tmp);
    } }
  // The big drift over the run, and the tunnel through it. The run goes through it straight and level-ish; the drift
  // stands `clear` over the highest of the floor under it, flat on top over the bore so that it can be driven across.
  const T = TUNNEL, ta = run.find(p => p.s >= T.s0), tb = run.find(p => p.s >= T.s1);
  const tun = { x0: Math.round(Math.min(ta.x, tb.x) * 2) / 2, x1: Math.round(Math.max(ta.x, tb.x) * 2) / 2, z: ta.z, half: T.half, top: 0 };
  { const j = Math.round((ta.z - z0) / step), fx = x => { const u = (x - x0) / step, i = Math.floor(u); return h[j * W + i] + (h[j * W + i + 1] - h[j * W + i]) * (u - i); };      // (the floor along the middle of the bore, as finished)
    tun.z = z0 + j * step; tun.floorAt = fx; tun.top = Math.max(fx(tun.x0), fx(tun.x1)) + T.clear; }
  const cx = (tun.x0 + tun.x1) / 2, hx = (tun.x1 - tun.x0) / 2, SL = 0.62, RR = 2.2;
  const driftAbs = (x, z) => {
    const ux = Math.max(0, Math.abs(x - cx) - hx), uz = Math.max(0, Math.abs(z - tun.z) - (T.half + 1)) * 0.75, q = Math.hypot(ux, uz);
    return tun.top - (q < RR ? SL * q * q / (2 * RR) : SL * (q - RR / 2));
  };
  tun.bore = (x, z) => Math.abs(z - tun.z) < T.half - 1e-6 && Math.abs(x - cx) < hx + 8;
  tun.cx = cx; tun.hx = hx; tun.driftAt = driftAbs;
  const moved = new Uint8Array(N);
  for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) {
    const n = j * W + i, x = x0 + i * step, z = z0 + j * step, d = driftAbs(x, z), K = 0.8;
    if (d <= 0 || d + K <= h[n] || tun.bore(x, z)) continue;          // (through the bore the run's own floor and lips stay)
    const m = Math.max(d, h[n]), q = Math.max(0, K - Math.abs(d - h[n]));
    h[n] = Math.abs(z - tun.z) <= T.half + 1 && Math.abs(x - cx) <= hx ? tun.top : m + q * q / (4 * K);      // (a soft join, and dead flat over the bore)
    if (d > h[n] - 0.3) kind[n] = 5;
    moved[n] = 1;
  }
  // and where it meets the hill, smoothed too (away from the bore)
  { const tmp = new Float32Array(N);
    for (let pass = 0; pass < 2; pass++) for (const along of [1, W]) {
      tmp.set(h);
      for (let n = W + 1; n < N - W - 1; n++) { if (!moved[n] && !moved[n - along] && !moved[n + along]) continue; const z = z0 + Math.floor(n / W) * step; if (Math.abs(z - tun.z) < T.half + 1.2) continue; tmp[n] = (h[n - along] + 2 * h[n] + h[n + along]) / 4; }
      h.set(tmp);
    } }
  // The drawn surface: two flat triangles a cell (as the mesh is drawn).
  const heightTri = (x, z) => {
    const fx = (x - x0) / step, fz = (z - z0) / step;
    if (fx < 0 || fz < 0 || fx >= nx || fz >= nz) return 0;
    const i = Math.floor(fx), j = Math.floor(fz), u = fx - i, v = fz - j, a = j * W + i;
    if (u + v <= 1) return h[a] + (h[a + 1] - h[a]) * u + (h[a + W] - h[a]) * v;
    const d = a + W + 1; return h[d] + (h[a + W] - h[d]) * (1 - u) + (h[a + 1] - h[d]) * (1 - v);
  };
  // The driven surface: through the same grid points, but smooth (Catmull-Rom both ways, kept within the cell's own
  // corners so that it never bulges past a wall), since a car at speed takes every crease between flat triangles for
  // the ground falling away and hops. Between the grid points the two differ by a few millimetres on anything driven.
  const cr = (t, w) => { const t2 = t * t, t3 = t2 * t; w[0] = (-t3 + 2 * t2 - t) / 2; w[1] = (3 * t3 - 5 * t2 + 2) / 2; w[2] = (-3 * t3 + 4 * t2 + t) / 2; w[3] = (t3 - t2) / 2; };
  const wu = [0, 0, 0, 0], wv = [0, 0, 0, 0];
  const heightAt = (x, z) => {
    const fx = (x - x0) / step, fz = (z - z0) / step;
    if (fx < 0 || fz < 0 || fx >= nx || fz >= nz) return 0;
    const i = Math.floor(fx), j = Math.floor(fz); cr(fx - i, wu); cr(fz - j, wv);
    let s = 0;
    for (let b = 0; b < 4; b++) { const jj = Math.min(nz, Math.max(0, j - 1 + b)) * W; let r = 0; for (let a = 0; a < 4; a++) r += wu[a] * h[jj + Math.min(nx, Math.max(0, i - 1 + a))]; s += wv[b] * r; }
    const a = j * W + i, lo = Math.min(h[a], h[a + 1], h[a + W], h[a + W + 1]), hi = Math.max(h[a], h[a + 1], h[a + W], h[a + W + 1]);
    return s < lo ? lo : s > hi ? hi : s;
  };
  const node = (x, z) => { const i = Math.round((x - x0) / step), j = Math.round((z - z0) / step); return i < 0 || j < 0 || i > nx || j > nz ? -1 : j * W + i; };
  let top = 0; for (let n = 0; n < N; n++) if (h[n] > top) top = h[n];
  return { ...LAND, W, h, kind, tan, along, gap, run, path, stair, runLen, pathLen, tun, heightAt, heightTri, node, top, x1: x0 + nx * step, z1: z0 + nz * step };
}
// Long low drifts the wind has laid on the open faces: [x, z, length, width, angle, height].
const DRIFTS = [[314, 132, 7, 2.2, 0.7, 0.35], [349, 129, 8, 2.4, 0.6, 0.3], [366, 141, 5, 1.8, 0.9, 0.28], [324, 163, 5, 1.8, 0.8, 0.3], [349, 167, 4, 1.4, 0.4, 0.22], [328, 191, 7, 2.2, 0.7, 0.3], [352, 193, 6, 2, 0.5, 0.25], [371, 170, 4, 1.6, 1.0, 0.22], [341, 151, 4, 1.3, 0.2, 0.2]];
