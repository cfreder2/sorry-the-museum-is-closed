// The lie of the land: the open lawns and the park are not a flat sheet but roll a little, in long low swells and soft
// hollows a metre or so deep, the way ground that has never been levelled does. Pure data, no three.js, no DOM.
//
// One height field, worked out once at start-up on a 2 m grid and read as a smooth curve through it, is the ground
// everywhere it is not zero: plan.js streetY() and groundAt() read it (so the car, the drone's floor and anything
// placed with them follow it), the snow is drawn from it (snowfield.js: as finely as its shape needs, 1 m to 25 cm),
// and the glitter and the tyre tracks read it too (winter.js). So what you see is what the wheels are on, to a
// centimetre at worst.
//
// It is zero (flat) on and near everything that needs flat ground: the streets and pavements, paths and plazas, the
// building and every room under it, the railway cutting, every hole in the ground, the ice, every piece of kit and
// every hill (they stand on flat ground and have shapes of their own), whatever stands on the ground (except trees,
// which ride it), the lamps and their pools of light, and the places features (features.js) lay out at start-up on
// flat ground: the light show, the jump park, the sled hill, the ball field, the snowball targets. FLAT below lists
// those; anything new laid out flat on open ground should be added there. It rises out of that over BLEND metres, and
// is limited so that nowhere is it steeper than about one in five.
//
// Over the swells lies the snow the wind has moved, a second height field on a 25 cm grid, added to the first and read
// with it by everything above: drifts a hand high and five metres apart lying across the wind, their long backs to
// the lake and their short steep faces to the west; a broad unevenness under them; ripples; the bank the shovels
// and the sweeper left down each side of every path, with gaps where people cut through; the drift in the lee of
// every hedge, snow fence and tree. It keeps only 75 cm clear of what needs flat ground (its grid is fine), so the
// snow is never level for long, and it lies between the kit of the jump park and the ball field too, which the swells
// keep out of. A bank is short and steep on purpose: it is there to be jumped.

export const STEP = 2;            // the grid, metres
export const FINE = 0.25;         // the grid of the drifts, metres
const PAD = 6.5;                  // flat this far beyond anything that needs flat ground (more than the reach of the curve through the grid, two cells each way)
const BLEND = 6;                  // and rising out of the flat over this far
const SLOPE = 0.17;               // the steepest the land may fall from one grid point to the next (then softened: about 1 in 6 at the very worst)
const PADF = 0.75;                // the drifts: flat this far beyond anything that needs flat ground (the reach of the curve through their grid, corner to corner)
const BLENDF = 2.2;               // and rising out of the flat over this far
const QF = 8192;                  // the drifts are kept as whole numbers, this many to the metre

// Laid out on flat ground by the features at start-up (they are not in the plan yet when the land is made): flat at
// every scale. [x0, x1, z0, z1]
export const FLAT = [
  [300, 384, -22, 106],           // the Winter Wonderland light show (lightshow.js SHOW)
  [388, 470, 9, 25],              // the plough-pile jump park (butlerfield.js): the kicker and the table-top with their run-ups, their landings and the light they throw
  [393, 466, 27, 48],             // its rollers and the quarter pipe
  [423, 457, -18, 6],             // the snow mountain
  [391, 395.5, 7.5, 11.5],        // its sign
  [300, 386, 110, 214],           // the sled hill, which has its own ground (parkplay.js / sledland.js)
  [390, 468, 134, 208],           // the ballpark, wall to wall, and its dugouts (ballpark.js)
  [440.5, 445, 209, 213.5],       // and the mast that stands beyond its centre field
  [449, 473, 109, 133], [388.5, 410, 219, 243], [451, 473, 219, 243],      // the three other diamonds' infields, backstops and benches (butlerfield.js)
  [438.8, 441.2, 114.8, 117.2], [464.8, 467.2, 140.8, 143.2], [419.8, 422.2, 234.8, 237.2], [393.8, 396.2, 208.8, 211.2], [438.8, 441.2, 234.8, 237.2], [464.8, 467.2, 208.8, 211.2],      // their foul markers
  [450.6, 453.4, 212.6, 215.4], [410.6, 413.4, 217.6, 220.4], [457.6, 460.4, 123.6, 126.4], [399.6, 402.4, 226.6, 229.4], [456.6, 459.4, 227.6, 230.4], [419.6, 422.4, 203.6, 206.4],      // the snowmen in the outfields
  [422, 439, 229, 247],           // the warming hut and the drifts against it (warminghut.js)
  [402, 458, 66, 74],             // the snowball targets (parkplay.js)
];
// Level, but not flat: the jump park and the ball field are laid out on ground with no swells in it; between their kit
// the snow still lies in drifts.
const LEVEL = [[390, 472, -18, 47], [385, 476, 105, 246]];
// Flat for the drifts only (the swells were there first): the rings drawn on the snow north of the park's cross path.
// The formal gardens either side of the Michigan Avenue building, which are kept; and the flagged court by the Triton
// fountain, which eastside.js lays against the walls east and south of it after the land is made.
// The paved way in to the Columbus Drive entrance, under its canopy (eastside.js, the same). And the ground the Stock
// Exchange arch stands on, and three metres round it: no drift lies against a work of art.
const SMOOTH = [[405, 455, 60, 110], [8, 65, -18, 55], [9, 73, 166, 242], [126, 152, 79, 100.5], [260.5, 271.5, 96.5, 107.5], [257, 275, -25, -3],
  [193, 196.5, 189.8, 193], [73.2, 76.8, -6, -3], [257.4, 260.5, 93.8, 96.8], [312.5, 317.5, 105.8, 108.4]];      // (four places where the faint rim of a pool of light, drawn 1.4 to 5 cm over the street, reached out past the flat ground under it)

// The wind is off the lake, from the east-north-east: (x, z) of the way it blows. Drifts lie across it.
export const WIND = [-0.9435, 0.3313];

// Snow fences (parkkit.js stands them up): [x0, z0, x1, z1] each. The snow the wind drops behind one is part of the land.
// Two lines of it: along the east side of the park's north-east field, with a way through; and along the lawn north of
// the Modern Wing, between Columbus Drive and the building.
export const FENCES = [[470, 50, 470, 71.5], [470, 74.5, 470, 98], [266, 6, 266, 50]];

// Spruces, planted in threes and fours as windbreaks at the corners of the fields (parkkit.js stands them up, where the
// ground is free): [x, z, height]. Each has its tail of snow, as the bare trees do, but a bigger one.
export const SPRUCES = [
  [473.2, 45.5, 3.6], [475, 48.5, 2.6], [472, 42.6, 2.9], [474.6, 43.6, 2.2],        // by the north end of the park's snow fence
  [393.5, 116.5, 3.2], [395.6, 118.2, 2.4], [392.6, 119.4, 2.7],                    // where the park's paths cross
  [352, 236, 3.8], [355, 238.5, 2.8], [349.5, 239, 3], [357.5, 234.5, 2.3],          // below the sled hill
  [258.5, 3.5, 3.2], [260.8, 5.2, 2.4], [257.6, 6.8, 2.7],                          // by the lawn fence north of the Modern Wing
  [129.5, 196, 3.6], [131.2, 199.2, 2.6], [128.4, 201, 2.9],                        // the south-west lawn
  [128.5, 24, 3.4], [130.4, 27, 2.5], [127.6, 29.4, 2.8],                           // the north lawn
];

// Hollows where meltwater stood and froze: [x, z, r]. Flat, at street level, and ice (winter.js draws them and tells the plan).
export const PONDS = [[397, 57, 2.4], [431, 123, 2.2]];      // (both in the park east of Columbus Drive: one by the jump park, one in the outfield north of the ballpark)

// The lamps down the park's paths east of Columbus Drive, and the benches (with a bin each) between them: butlerfield.js
// stands them up, and the drifts keep clear of each post. (Not of a lamp's pool of light: the banks stand up through
// it, and are lit by it all the same: snowfield.js. Nor of the seats: the bank runs on behind and under them.)
// F: the field, {x0, x1, z0, z1}.
export function parkLamps(F) {
  const lamps = [];
  for (let z = F.z0 + 12; z < F.z1 - 8; z += 22) lamps.push([z % 44 < 22 ? 384.6 : 389.4, z]);
  for (let x = F.x0 + 14; x < F.x1 - 6; x += 22) { if (Math.abs(x - 387) < 4) continue; lamps.push([x, x % 44 < 22 ? 107.6 : 112.4]); }
  for (let x = 334; x < 384; x += 22) lamps.push([x, 211.6]);
  return lamps;
}
export function parkSeats(lamps) {          // [x, z, along z?, the lamp's x, the lamp's z]: a bench by every other lamp
  const out = [];
  lamps.forEach(([x, z], i) => {
    if (i % 2) return;
    const alongZ = Math.abs(x - 387) < 4, bx = alongZ ? x + (x < 387 ? -0.9 : 0.9) : x + 6, bz = alongZ ? z + 6 : z + (z < 110 ? -0.9 : 0.9);
    if (bx > 300 && bx < 384 && bz < 106 && bz > -20) return;        // not in the light show
    if (bx > 298 && bx < 332 && bz > 99 && bz < 118) return;           // nor in front of its way in
    out.push([bx, bz, alongZ, x, z]);
  });
  return out;
}

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
// `detail` is what the drifts lie against: { paths: the shovelled paths [{x0, x1, z0, z1}], hedges, trees: [{x, z, kind}],
// field: the park east of Columbus Drive }.
export function buildLand(bounds, open, flat0, detail = {}) {
  const ponds = PONDS.map(([x, z, r]) => ({ x, z, r }));
  const flat = [...flat0, ...LEVEL.map(q => ({ x0: q[0], x1: q[1], z0: q[2], z1: q[3] })), ...ponds];
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
  // The drifts, and the cells they lie in (any of the sixteen points of their own grid the curve through a place is
  // drawn from: two of them each way).
  const fine = buildDrifts(open, [...flat0, ...ponds], detail, X0, Z0);
  if (fine) {
    const FN = fine.nx + 1, fh = fine.h, R = STEP / FINE; let ft = 0;
    for (let j = 0; j <= fine.nz; j++) for (let i = 0; i <= fine.nx; i++) {
      const v = fh[j * FN + i]; if (!v) continue; if (v > ft) ft = v;
      const a0 = Math.max(0, Math.floor((fine.X0 - X0) / STEP + (i - 2) / R)), a1 = Math.min(nx - 1, Math.floor((fine.X0 - X0) / STEP + (i + 2) / R)), b0 = Math.max(0, Math.floor((fine.Z0 - Z0) / STEP + (j - 2) / R)), b1 = Math.min(nz - 1, Math.floor((fine.Z0 - Z0) / STEP + (j + 2) / R));
      for (let b = b0; b <= b1; b++) for (let a = a0; a <= a1; a++) if (!cells[b * nx + a]) { cells[b * nx + a] = 1; x0 = Math.min(x0, X0 + a * STEP); x1 = Math.max(x1, X0 + (a + 1) * STEP); z0 = Math.min(z0, Z0 + b * STEP); z1 = Math.max(z1, Z0 + (b + 1) * STEP); }
    }
    top += ft / QF;
  }
  // As a ground piece (plan.js groundAt hands it over as what is under the wheels): a hill, so that the car's slope,
  // its roll down the side and its landings work on it as on any other hill (vehicles.js).
  const L = { skin: 'snow', hill: true, axis: 'hill', land: true, X0, Z0, nx, nz, h, cells, top, thick: 0, h0: 0, h1: top, fine, ponds,
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
  const fx = u - i, fz = v - j, N = nx + 1, h = L.h, a = j * N + i;
  let y = cr(fz, cr(fx, h[a - N - 1], h[a - N], h[a - N + 1], h[a - N + 2]), cr(fx, h[a - 1], h[a], h[a + 1], h[a + 2]), cr(fx, h[a + N - 1], h[a + N], h[a + N + 1], h[a + N + 2]), cr(fx, h[a + 2 * N - 1], h[a + 2 * N], h[a + 2 * N + 1], h[a + 2 * N + 2]));
  if (y < 0) y = 0;
  const F = L.fine;
  if (F) {                                                          // and the drifts over it, the same way through their own grid
    const p = (x - F.X0) / FINE, q = (z - F.Z0) / FINE, m = Math.floor(p), n = Math.floor(q);
    if (m >= 1 && n >= 1 && m < F.nx - 1 && n < F.nz - 1) {
      const gx = p - m, gz = q - n, M = F.nx + 1, g = F.h, b = n * M + m;
      const d = cr(gz, cr(gx, g[b - M - 1], g[b - M], g[b - M + 1], g[b - M + 2]), cr(gx, g[b - 1], g[b], g[b + 1], g[b + 2]), cr(gx, g[b + M - 1], g[b + M], g[b + M + 1], g[b + M + 2]), cr(gx, g[b + 2 * M - 1], g[b + 2 * M], g[b + 2 * M + 1], g[b + 2 * M + 2]));
      if (d > 0) y += d / QF;
    }
  }
  return y;
}

// ------------------------------------------------------------------ the drifts --

// Smooth noise between -1 and 1, the same every time: a lattice of fixed random values, eased between.
function noise(seed) {
  const at = (i, j) => { let n = (Math.imul(i, 374761393) + Math.imul(j, 668265263) + seed) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 2147483648 - 1; };
  return (x, z) => { const i = Math.floor(x), j = Math.floor(z), fx = x - i, fz = z - j, u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz), a = at(i, j), b = at(i + 1, j), c = at(i, j + 1), d = at(i + 1, j + 1); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; };
}
// A drift's section, 0 to 1 and back over t = 0 to 1, its crest at `peak`: level at both feet and on the crest.
const section = (t, peak) => t <= 0 || t >= 1 ? 0 : t < peak ? smooth(t / peak) : 1 - smooth((t - peak) / (1 - peak));

// The wind's snow, before it is laid on the ground: (x, z) to metres, never below nothing.
function windSnow() {
  const n1 = noise(11), n2 = noise(23), n3 = noise(37), n4 = noise(41), n5 = noise(53), n6 = noise(67), n7 = noise(79), n8 = noise(97), [wx, wz] = WIND;
  return (x, z) => {
    const u = x * wx + z * wz, v = z * wx - x * wz;                       // down the wind, and across it
    let h = 0.1 * (1 + n1(x / 13, z / 13)) * (0.6 + 0.4 * n7(x / 31 + 5, z / 31));       // a broad unevenness
    const m = n8(x / 8.5 + 3, z / 8.5) - 0.12; if (m > 0) h += 0.24 * smooth(m / 0.6);     // and low mounds a few strides across, where it has piled
    const a = 0.5 + 0.95 * n4(x / 26, z / 26);                             // where the drifts are, and how big: patches of them, and wind-swept stretches between
    if (a > 0) {
      const t = u / 5.6 + 0.85 * n2(x / 12, z / 12) + 0.22 * n3(v / 2.7, u / 6), f = t - Math.floor(t);
      h += 0.15 * Math.min(1, a) * Math.min(1, a) * (0.72 + 0.28 * n5(v / 7, u / 19)) * section(f, 0.74);
    }
    const r = n6(x / 5, z / 5) - 0.15;                                     // ripples, in places
    if (r > 0) h += 0.017 * Math.min(1, r * 2.2) * (1 + Math.sin(6.2832 * (u / 1.7 + 0.5 * n3(x / 4.3, z / 4.3))));
    return h;
  };
}

// The drifts' own grid over the open ground. 0 wherever flat is wanted; whole numbers, QF to the metre.
function buildDrifts(open, flat0, detail, X0, Z0) {
  if (!open.length) return null;
  const R = STEP / FINE, [wx, wz] = WIND;
  const FX0 = X0 + Math.floor((Math.min(...open.map(q => q[0])) - X0) / STEP) * STEP, FZ0 = Z0 + Math.floor((Math.min(...open.map(q => q[2])) - Z0) / STEP) * STEP;
  const nx = Math.ceil((Math.max(...open.map(q => q[1])) - FX0) / STEP) * R, nz = Math.ceil((Math.max(...open.map(q => q[3])) - FZ0) / STEP) * R, N = nx + 1, BIG = 1e9;
  const I = x => (x - FX0) / FINE, J = z => (z - FZ0) / FINE, cl = (v, m) => v < 0 ? 0 : v > m ? m : v;
  // What needs flat ground: the plan's own list, less the wide margin it gives the park's paths (the lamps, benches and
  // bins down them are listed one by one here instead), and what the drifts alone keep off.
  const paths = detail.paths || [], F = detail.field, flat = flat0.filter(q => q.r != null || !paths.some(p => Math.abs(q.x0 - p.x0 + 6) < 0.01 && Math.abs(q.x1 - p.x1 - 6) < 0.01 && Math.abs(q.z0 - p.z0 + 6) < 0.01 && Math.abs(q.z1 - p.z1 - 6) < 0.01));
  for (const q of SMOOTH) flat.push({ x0: q[0], x1: q[1], z0: q[2], z1: q[3] });
  if (F) { for (const [x, z] of parkLamps(F)) flat.push({ x, z, r: 0.45 }); flat.push({ x0: 389.8, x1: 393.2, z0: 104.3, z1: 107.7 }); }      // (the benches and bins stand on the street as they did, and the bank runs on behind and under them: they are in it to the shins)
  for (const [x, z] of SPRUCES) flat.push({ x, z, r: 0.3 });           // under a spruce's boughs no snow reaches the ground: a well round the trunk
  // How far each point of the grid is from flat ground (in points, squared).
  const f = new Float32Array(N * (nz + 1));
  for (const q of open) { const i0 = cl(Math.ceil(I(q[0])), nx), i1 = cl(Math.floor(I(q[1])), nx), j0 = cl(Math.ceil(J(q[2])), nz), j1 = cl(Math.floor(J(q[3])), nz); for (let j = j0; j <= j1; j++) f.fill(BIG, j * N + i0, j * N + i1 + 1); }
  for (const q of flat) {
    if (q.r != null) { const i0 = cl(Math.floor(I(q.x - q.r)), nx), i1 = cl(Math.ceil(I(q.x + q.r)), nx), j0 = cl(Math.floor(J(q.z - q.r)), nz), j1 = cl(Math.ceil(J(q.z + q.r)), nz), r2 = (q.r / FINE + 0.5) ** 2, ci = I(q.x), cj = J(q.z); for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) if ((i - ci) ** 2 + (j - cj) ** 2 < r2) f[j * N + i] = 0; }
    else { const i0 = Math.ceil(I(q.x0) - 0.5), i1 = Math.floor(I(q.x1) + 0.5), j0 = Math.ceil(J(q.z0) - 0.5), j1 = Math.floor(J(q.z1) + 0.5); if (i1 < 0 || j1 < 0 || i0 > nx || j0 > nz) continue; for (let j = cl(j0, nz); j <= cl(j1, nz); j++) f.fill(0, j * N + cl(i0, nx), j * N + cl(i1, nx) + 1); }
  }
  { const n = Math.max(N, nz + 1), row = new Float64Array(n), out = new Float64Array(n), v = new Int32Array(n), zz = new Float64Array(n + 1);
    for (let j = 0; j <= nz; j++) { const o = j * N; for (let i = 0; i < N; i++) row[i] = f[o + i]; edt1(row, N, out, v, zz); for (let i = 0; i < N; i++) f[o + i] = out[i]; }
    for (let i = 0; i < N; i++) { for (let j = 0; j <= nz; j++) row[j] = f[j * N + i]; edt1(row, nz + 1, out, v, zz); for (let j = 0; j <= nz; j++) f[j * N + i] = out[j]; } }
  const dist = k => Math.sqrt(f[k]) * FINE;
  // What lies against things, first: each is the most of whatever reaches a point.
  const h = new Int16Array(N * (nz + 1)), nb = noise(101), nc = noise(113);
  const lay = (xa, xb, za, zb, fn) => {                 // fn(x, z) in metres over a box of the grid, kept where it is more than what is there
    const i0 = cl(Math.ceil(I(xa)), nx), i1 = cl(Math.floor(I(xb)), nx), j0 = cl(Math.ceil(J(za)), nz), j1 = cl(Math.floor(J(zb)), nz);
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const k = j * N + i, d = dist(k); if (d <= PADF) continue; const v = fn(FX0 + i * FINE, FZ0 + j * FINE) * smooth((d - PADF) / 0.45) * QF; if (v > h[k]) h[k] = v; }
  };
  // The bank down each side of a shovelled path: steep to the path, easy to the lawn, lumpy, and trodden through here and there.
  for (const p of paths) lay(p.x0 - 3, p.x1 + 3, p.z0 - 3, p.z1 + 3, (x, z) => {
    const dx = Math.max(p.x0 - x, 0, x - p.x1), dz = Math.max(p.z0 - z, 0, z - p.z1), d = Math.hypot(dx, dz), s = section((d - PADF) / 2.4, 0.38); if (!s) return 0;
    const gap = nc(x / 17, z / 17), lump = 0.5 + 0.5 * Math.min(1, Math.max(0, 0.55 + 0.9 * nb(x / 6, z / 6)));
    return 0.25 * s * lump * (gap > 0.42 ? Math.max(0.1, 1 - (gap - 0.42) * 9) : 1);      // (a hand to a forearm high, rising over 90 cm: flat out, the car clears the path's other bank off it; any steeper and it went over the lamps)
  });
  // In the lee of a hedge. (The wind is nearly along those that run east and west: less lies there.)
  for (const q of detail.hedges || []) {
    if (q.z1 - q.z0 > q.x1 - q.x0) lay(q.x0 - 5.5, q.x0, q.z0 - 1, q.z1 + 1, (x, z) => 0.3 * section((q.x0 - x - 0.6) / 4.6, 0.26) * smooth((z - q.z0 + 1) / 2) * smooth((q.z1 + 1 - z) / 2) * (0.75 + 0.25 * nb(x / 3, z / 3)));
    else lay(q.x0 - 1, q.x1 + 1, q.z1, q.z1 + 4, (x, z) => 0.16 * section((z - q.z1 - 0.6) / 3.2, 0.3) * smooth((x - q.x0 + 1) / 2) * smooth((q.x1 + 1 - x) / 2) * (0.75 + 0.25 * nb(x / 3, z / 3)));
  }
  // Behind a snow fence, the drift it is there to make; and a little against its face.
  for (const [ax, az, bx, bz] of FENCES) {
    const len = Math.hypot(bx - ax, bz - az), tx = (bx - ax) / len, tz = (bz - az) / len, side = (-tz * wx + tx * wz) >= 0 ? 1 : -1, ox = -tz * side, oz = tx * side, bite = Math.abs(ox * wx + oz * wz);
    lay(Math.min(ax, bx) - 9, Math.max(ax, bx) + 9, Math.min(az, bz) - 9, Math.max(az, bz) + 9, (x, z) => {
      const t = (x - ax) * tx + (z - az) * tz, s = (x - ax) * ox + (z - az) * oz, end = smooth((t + 1) / 2.5) * smooth((len + 1 - t) / 2.5); if (!end) return 0;
      return bite * end * (0.42 * section((s - 0.25) / 7.5, 0.3) + 0.12 * section((s + 1.9) / 1.9, 0.6)) * (0.8 + 0.2 * nb(x / 2.5, z / 2.5));
    });
  }
  // Behind every tree, a tail of it.
  for (const t of detail.trees || []) {
    if (t.kind === 'hawthorn') continue;
    lay(t.x - 5, t.x + 5, t.z - 5, t.z + 5, (x, z) => { const s = (x - t.x) * wx + (z - t.z) * wz, c = (z - t.z) * wx - (x - t.x) * wz; return s < 0.2 || s > 4.2 || Math.abs(c) > 1.3 ? 0 : 0.15 * section((s - 0.2) / 4, 0.22) * Math.exp(-c * c / (0.18 + 0.05 * s)); });
  }
  for (const [tx, tz, th] of SPRUCES) lay(tx - 8, tx + 8, tz - 8, tz + 8, (x, z) => { const s = (x - tx) * wx + (z - tz) * wz, c = (z - tz) * wx - (x - tx) * wz, w = th * 0.3; return s < 0.3 || s > 6.5 || Math.abs(c) > 3 ? 0 : 0.26 * section((s - 0.3) / 6.2, 0.24) * Math.exp(-c * c / (w * w * 0.6 + 0.08 * s)); });
  // Then the wind's snow over the open ground, easing into the foot of whatever is banked up there.
  const snow = windSnow();
  for (let j = 2; j <= nz - 2; j++) for (let i = 2; i <= nx - 2; i++) {
    const k = j * N + i, d = dist(k); if (d <= PADF || d > 1e3) continue;
    const b = h[k] / QF, v = b + smooth((d - PADF) / BLENDF) * snow(FX0 + i * FINE, FZ0 + j * FINE) * (1 - 0.65 * Math.min(1, b / 0.18));
    h[k] = Math.min(32000, Math.round(v * QF));
  }
  return { X0: FX0, Z0: FZ0, nx, nz, h, q: 1 / QF };
}
