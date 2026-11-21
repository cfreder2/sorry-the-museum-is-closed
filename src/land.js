// The lie of the land: the open lawns and the park are not a flat sheet but roll a little, in long low swells and soft
// hollows a metre or so deep, the way ground that has never been levelled does. Pure data, no three.js, no DOM.
//
// One height field, worked out once at start-up on a 2 m grid and read as a smooth curve through it, is the ground
// everywhere it is not zero: plan.js streetY() and groundAt() read it (so the car, the drone's floor and anything
// placed with them follow it), the snow is drawn from it on a 1 m mesh (museum.js), and the glitter and the tyre
// tracks read it too (winter.js). So what you see is what the wheels are on, to a centimetre or two at worst.
//
// It is zero (flat) on and near everything that needs flat ground: the streets and pavements, paths and plazas, the
// building and every room under it, the railway cutting, every hole in the ground, the ice, every piece of kit and
// every hill (they stand on flat ground and have shapes of their own), whatever stands on the ground (except trees,
// which ride it), the lamps and their pools of light, and the places features (features.js) lay out at start-up on
// flat ground: the light show, the jump park, the sled hill, the ball field, the snowball targets. FLAT below lists
// those; anything new laid out flat on open ground should be added there. It rises out of that over BLEND metres, and
// is limited so that nowhere is it steeper than about one in five.

export const STEP = 2;            // the grid, metres
const PAD = 6.5;                  // flat this far beyond anything that needs flat ground (more than the reach of the curve through the grid, two cells each way)
const BLEND = 6;                  // and rising out of the flat over this far
const SLOPE = 0.17;               // the steepest the land may fall from one grid point to the next (then softened: about 1 in 6 at the very worst)

// Laid out on flat ground by the features at start-up (they are not in the plan yet when the land is made).
// [x0, x1, z0, z1]
export const FLAT = [
  [300, 384, -22, 106],           // the Winter Wonderland light show (lightshow.js SHOW)
  [390, 472, -18, 47],            // the plough-pile jump park and its snow mountain (butlerfield.js)
  [300, 386, 110, 214],           // the sled hill, which has its own ground (parkplay.js / sledland.js)
  [385, 476, 105, 246],           // the ball field: diamonds, backstops, the warming hut, the scoreboard, centre field (butlerfield.js)
  [402, 458, 66, 74],             // the snowball targets (parkplay.js)
];

const smooth = t => { t = t < 0 ? 0 : t > 1 ? 1 : t; return t * t * (3 - 2 * t); };

// A small fixed random sequence, so the land is the same every time.
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// Squared distance transform of a 1-D row (Felzenszwalb & Huttenlocher), in place over f (0 where flat, big elsewhere).
function edt1(f, n, d, v, z) {
  let k = 0; v[0] = 0; z[0] = -Infinity; z[1] = Infinity;
  const cut = (q, p) => ((f[q] + q * q) - (f[p] + p * p)) / (2 * q - 2 * p);
  for (let q = 1; q < n; q++) {
    let s = cut(q, v[k]);
    while (s <= z[k]) { k--; s = cut(q, v[k]); }          // (z[0] is -Infinity: k never goes below 0)
    k++; v[k] = q; z[k] = s; z[k + 1] = Infinity;
  }
  k = 0;
  for (let q = 0; q < n; q++) { while (z[k + 1] < q) k++; const p = v[k]; d[q] = (q - p) * (q - p) + f[p]; }
}

// The shape before it is laid on the ground: always above nothing, a broad swell with smaller ones over it running
// different ways, and soft mounds and hollows scattered about.
function rolling() {
  const r = rng(1893), waves = [], lumps = [];
  for (const [len, amp] of [[58, 0.45], [37, 0.33], [23, 0.18], [16, 0.07]]) { const a = r() * Math.PI * 2; waves.push({ kx: Math.cos(a) * 2 * Math.PI / len, kz: Math.sin(a) * 2 * Math.PI / len, ph: r() * Math.PI * 2, amp }); }
  for (let x = -40; x < 640; x += 34) for (let z = -60; z < 280; z += 34) lumps.push({ x: x + r() * 30, z: z + r() * 30, r: 9 + r() * 9, h: (r() < 0.45 ? -1 : 1) * (0.25 + r() * 0.3) });
  return (x, z) => {
    let h = 0.95;
    for (const w of waves) h += w.amp * Math.sin(w.kx * x + w.kz * z + w.ph);
    for (const l of lumps) { const d2 = ((x - l.x) ** 2 + (z - l.z) ** 2) / (l.r * l.r); if (d2 < 1) h += l.h * (Math.cos(Math.sqrt(d2) * Math.PI) + 1) / 2; }
    if (h > 1.15) h = 1.15 + (h - 1.15) * 0.35;                 // the tallest swells eased down, not cut flat
    return Math.max(0.05, h);
  };
}

// Build the land. `open` is where it may roll at all ([x0, x1, z0, z1] each); `flat` gives what needs flat ground, as
// rectangles {x0, x1, z0, z1} and circles {x, z, r}.
export function buildLand(bounds, open, flat) {
  const X0 = Math.floor(bounds.x0 / STEP) * STEP, Z0 = Math.floor(bounds.z0 / STEP) * STEP;
  const W = Math.ceil((bounds.x1 - X0) / STEP) * STEP, H = Math.ceil((bounds.z1 - Z0) / STEP) * STEP;
  // Flat or not, on a 1 m raster; then how far each raster cell is from flat ground.
  const RW = W, RH = H, BIG = 1e9, f = new Float64Array(RW * RH).fill(0);
  const fill = (x0, x1, z0, z1, val) => {
    const i0 = Math.max(0, Math.floor(x0 - X0)), i1 = Math.min(RW, Math.ceil(x1 - X0)), j0 = Math.max(0, Math.floor(z0 - Z0)), j1 = Math.min(RH, Math.ceil(z1 - Z0));
    for (let j = j0; j < j1; j++) f.fill(val, j * RW + i0, j * RW + i1);
  };
  for (const q of open) fill(q[0], q[1], q[2], q[3], BIG);
  for (const q of flat) {
    if (q.r != null) {
      const i0 = Math.max(0, Math.floor(q.x - q.r - X0)), i1 = Math.min(RW, Math.ceil(q.x + q.r - X0)), j0 = Math.max(0, Math.floor(q.z - q.r - Z0)), j1 = Math.min(RH, Math.ceil(q.z + q.r - Z0));
      for (let j = j0; j < j1; j++) for (let i = i0; i < i1; i++) { const cx = Math.max(X0 + i, Math.min(X0 + i + 1, q.x)), cz = Math.max(Z0 + j, Math.min(Z0 + j + 1, q.z)); if ((cx - q.x) ** 2 + (cz - q.z) ** 2 < q.r * q.r) f[j * RW + i] = 0; }
    } else fill(q.x0, q.x1, q.z0, q.z1, 0);
  }
  { const n = Math.max(RW, RH), row = new Float64Array(n), out = new Float64Array(n), v = new Int32Array(n), zz = new Float64Array(n + 1);
    for (let j = 0; j < RH; j++) { for (let i = 0; i < RW; i++) row[i] = f[j * RW + i]; edt1(row, RW, out, v, zz); for (let i = 0; i < RW; i++) f[j * RW + i] = out[i]; }
    for (let i = 0; i < RW; i++) { for (let j = 0; j < RH; j++) row[j] = f[j * RW + i]; edt1(row, RH, out, v, zz); for (let j = 0; j < RH; j++) f[j * RW + i] = out[j]; } }
  // The grid: a point is as far from flat ground as the nearest of the four raster cells round it.
  const nx = W / STEP, nz = H / STEP, h = new Float32Array((nx + 1) * (nz + 1)), shape = rolling();
  const dist = (i, j) => { const I = i * STEP, J = j * STEP; let m = BIG; for (const [a, b] of [[I - 1, J - 1], [I, J - 1], [I - 1, J], [I, J]]) if (a >= 0 && b >= 0 && a < RW && b < RH) m = Math.min(m, f[b * RW + a]); return m >= BIG ? 0 : Math.sqrt(m); };
  for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) {
    const s = smooth((dist(i, j) - PAD) / BLEND);
    if (s > 0) h[j * (nx + 1) + i] = s * shape(X0 + i * STEP, Z0 + j * STEP);
  }
  // Nowhere steeper than SLOPE between neighbours: the land is only ever lowered to make it so, never raised, so what
  // is flat stays flat. (The largest such surface under the shape, by a few sweeps each way.)
  const N = nx + 1, ds = SLOPE * STEP, dg = ds * Math.SQRT2;
  for (let it = 0; it < 6; it++) {
    let changed = false;
    const relax = (k, kk, lim) => { if (h[k] > h[kk] + lim) { h[k] = h[kk] + lim; changed = true; } };
    for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) { const k = j * N + i; if (!h[k]) continue; if (i > 0) relax(k, k - 1, ds); if (j > 0) { relax(k, k - N, ds); if (i > 0) relax(k, k - N - 1, dg); if (i < nx) relax(k, k - N + 1, dg); } }
    for (let j = nz; j >= 0; j--) for (let i = nx; i >= 0; i--) { const k = j * N + i; if (!h[k]) continue; if (i < nx) relax(k, k + 1, ds); if (j < nz) { relax(k, k + N, ds); if (i < nx) relax(k, k + N + 1, dg); if (i > 0) relax(k, k + N - 1, dg); } }
    if (!changed) break;
  }
  // Then softened, twice: where the limit cut a corner, and the tops of the smaller mounds, are eased into curves. (Only
  // what rolls is touched, so what is flat stays flat; an average of what is within the limit is within it too.)
  for (let it = 0; it < 2; it++) {
    const o = h.slice();
    for (let j = 1; j < nz; j++) for (let i = 1; i < nx; i++) { const k = j * N + i; if (!o[k]) continue; h[k] = (4 * o[k] + 2 * (o[k - 1] + o[k + 1] + o[k - N] + o[k + N]) + o[k - N - 1] + o[k - N + 1] + o[k + N - 1] + o[k + N + 1]) / 16; }
  }
  for (let k = 0; k < h.length; k++) if (h[k] < 0.004) h[k] = 0;
  // Which cells roll at all: any of the sixteen grid points the curve through a cell is drawn from is above nothing.
  // The snow is drawn over these, and only these; everywhere else the land is exactly flat.
  const cells = new Uint8Array(nx * nz);
  let top = 0, x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
  for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) {
    const v = h[j * N + i]; if (!v) continue; top = Math.max(top, v);
    for (let b = Math.max(0, j - 2); b <= Math.min(nz - 1, j + 1); b++) for (let a = Math.max(0, i - 2); a <= Math.min(nx - 1, i + 1); a++) {
      cells[b * nx + a] = 1; x0 = Math.min(x0, X0 + a * STEP); x1 = Math.max(x1, X0 + (a + 1) * STEP); z0 = Math.min(z0, Z0 + b * STEP); z1 = Math.max(z1, Z0 + (b + 1) * STEP);
    }
  }
  // As a ground piece (plan.js groundAt hands it over as what is under the wheels): a hill, so that the car's slope,
  // its roll down the side and its landings work on it as on any other hill (vehicles.js).
  const L = { skin: 'snow', hill: true, axis: 'hill', land: true, X0, Z0, nx, nz, h, cells, top, thick: 0, h0: 0, h1: top,
    x0: bounds.x0 - 50, x1: bounds.x1 + 50, z0: bounds.z0 - 50, z1: bounds.z1 + 50, cx: 0, cz: 0, rx: 1, rz: 1, H: 0,
    rolls: { x0, x1, z0, z1 } };
  L.fn = (x, z) => landAt(L, x, z);
  return L;
}

// The height of the land at (x, z): a smooth curve through the grid points (Catmull-Rom each way), so that its slope
// has no corners for a wheel to leave the ground at. Exactly nothing wherever the grid round about is nothing; never
// below nothing.
const cr = (t, a, b, c, d) => b + 0.5 * t * (c - a + t * (2 * a - 5 * b + 4 * c - d + t * (3 * (b - c) + d - a)));
export function landAt(L, x, z) {
  if (!L) return 0;
  const R = L.rolls; if (x <= R.x0 || x >= R.x1 || z <= R.z0 || z >= R.z1) return 0;
  const u = (x - L.X0) / STEP, v = (z - L.Z0) / STEP, i = Math.floor(u), j = Math.floor(v), nx = L.nx;
  if (i < 1 || j < 1 || i >= nx - 1 || j >= L.nz - 1 || !L.cells[j * nx + i]) return 0;
  const fx = u - i, fz = v - j, N = nx + 1, h = L.h, row = k => cr(fx, h[k - 1], h[k], h[k + 1], h[k + 2]), a = j * N + i;
  const y = cr(fz, row(a - N), row(a), row(a + N), row(a + 2 * N));
  return y > 0 ? y : 0;
}
