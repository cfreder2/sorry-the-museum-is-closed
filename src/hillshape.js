// The shape of a hill. Pure numbers, no three.js, no DOM (plan.js reads it; hills.js draws it).
//
// A hill used to be a cosine of the distance from its middle: the same round cone whichever way you came at it. Now
// each has a lie of its own, as snow-covered ground that the wind has worked on does:
//
//   * the summit stands off-centre, towards the lee (the wind is out of the west-north-west, as it comes over the
//     city in January): a short steep face under it on that side, a long shoulder on the other;
//   * spurs run down from the summit with gullies between them, so the foot is not a ruler-drawn oval's worth of
//     the same slope all the way round;
//   * a drift lies along the lee of the crest, and the flanks are lumpy in long low swells;
//   * on a big hill a sled chute is worn into the long shoulder: a shallow trough with a lip of pushed snow either
//     side. It is real: the wheels drop into it and it steers the car down the hill.
//
// It is one smooth function (its slope has no corners anywhere: a corner is where a wheel leaves the ground, and at
// sixty frames a second a small one is enough), nothing outside the hill's oval, and never below nothing. The car
// (plan.js heightOf, through s.fn), the mesh, the glitter and the tyre tracks all read this same function, so what is
// drawn is what the wheels are on. The kicker of packed snow on a big hill's summit is the cosine cap it always was,
// moved with the summit.

const TAU = Math.PI * 2;
const WIND = 0.32;                         // the way the wind blows TO, radians from +x towards +z: east and a little south
const hash = (x, z, k) => { const s = Math.sin(x * 12.9898 + z * 78.233 + k * 37.719) * 43758.5453; return s - Math.floor(s); };
const smooth = t => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));

// The flank: 1 at the summit to 0 at the foot. A parabola off the top, a straight run down the side, a parabola into
// the foot: a shade less steep at its steepest than the cosine it replaces (1.52 of the mean slope against pi/2), which
// leaves room for the summit to stand off-centre without the short side becoming a wall.
const B = 0.34, M = 1 / (1 - B);
const flank = t => (t <= 0 ? 1 : t >= 1 ? 0 : t < B ? 1 - M * t * t / (2 * B) : t > 1 - B ? M * (1 - t) * (1 - t) / (2 * B) : 1 - M * (t - B / 2));

// Give a hill surface (plan.js: { cx, cz, rx, rz, H, bump?, br? }) its shape: s.fn(x, z), and s.form, the numbers the
// drawing wants (where the summit is, which way the chute runs, how exposed a point is).
export function shapeHill(s, o = {}) {
  if (typeof location !== 'undefined' && /[?&]oldhills\b/.test(location.search)) return s;      // a test switch: the old cosine cones, to measure the new shapes against
  const { cx, cz, rx, rz, H } = s, big = H >= 5;
  const k1 = hash(cx, cz, 1), k2 = hash(cx, cz, 2), k3 = hash(cx, cz, 3);
  const lean = o.lean != null ? o.lean : big ? 0.15 : 0.16 + 0.12 * k1;                    // how far off-centre the summit is, of the radius
  const dir = o.dir != null ? o.dir : WIND + (big ? 0 : (k2 - 0.5) * 0.9);                  // and which way: to leeward
  const ax = Math.cos(dir) * lean, az = Math.sin(dir) * lean, A2 = 1 - lean * lean;        // (in the oval's own units)
  const sx = cx + ax * rx, sz = cz + az * rz;                                              // the summit
  const spurs = big ? 3 : 2, ph = k3 * TAU, g1 = big ? 0.075 : 0.06, g2 = big ? 0.012 : 0.02;
  const R = Math.min(rx, rz), lump = o.lump != null ? o.lump : Math.min(0.075, 0.02 + H * 0.007);      // the height of the lumps
  const l1 = TAU / Math.max(5, R * 0.42), l2 = TAU / Math.max(3.2, R * 0.2), p1 = k1 * 9, p2 = k2 * 9;
  const drift = big ? 0.16 : Math.min(0.09, H * 0.08), dW = Math.max(1.5, R * 0.13), dL = Math.max(2.4, R * 0.42), dAt = big ? R * 0.3 : R * 0.2;
  // The sled chute (big hills): a straight line off the summit down the long shoulder, a little across it.
  const cd = dir + Math.PI + (o.chuteTurn != null ? o.chuteTurn : 0.42), ux = Math.cos(cd), uz = Math.sin(cd);
  const chute = big && o.chute !== false ? { x: sx, z: sz, ux, uz, from: 2.9, to: 0, depth: 0.1, hw: 0.72 } : null;
  if (chute) {      // how far it runs: to within a little of the foot along that line
    let lo = 0, hi = 4 * R; for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2; (Math.hypot((sx + ux * m - cx) / rx, (sz + uz * m - cz) / rz) < 1 ? (lo = m) : (hi = m)); }
    chute.to = lo - 1.2;
  }
  const br = s.bump ? s.br : 0;
  // A knoll on the long shoulder (big hills): a second, lower rise half way down the windward side, so the skyline
  // has a bench in it and is not one straight fall from the top.
  const kn = big ? { x: sx - Math.cos(dir - 0.5) * R * 0.62, z: sz - Math.sin(dir - 0.5) * R * 0.62, r: R * 0.37, h: H * 0.06 } : null;

  // t: 0 at the summit, 1 on the oval. The level lines are circles (in the oval's units) whose centres slide from the
  // summit out to the middle as they grow.
  const tOf = (u, v) => { const qx = u - ax, qz = v - az, b = qx * ax + qz * az; return (b + Math.sqrt(b * b + A2 * (qx * qx + qz * qz))) / A2; };
  const P = { h: 0, t: 1, th: 0, cut: 0, lip: 0, kick: 0, dr: 0, al: 0, ac: 0 };      // (one, written over at every call: nothing is made per call, this runs many times a frame)
  const parts = (x, z) => {
    const u = (x - cx) / rx, v = (z - cz) / rz;
    if (u * u + v * v >= 1) return null;
    const t0 = tOf(u, v), th = Math.atan2(v - az, u - ax), w = Math.sin(Math.PI * t0), w2 = w * w;
    // spurs and gullies: the flank reached sooner or later round the hill (nothing at the summit, nothing at the foot)
    const t = t0 * (1 + w2 * (g1 * Math.sin(spurs * th + ph) + g2 * Math.sin((2 * spurs + 1) * th + ph * 1.7)));
    let h = H * flank(t);
    // long low lumps on the flanks
    const lumps = (Math.sin(x * l1 + p1) * Math.sin(z * l1 * 0.83 + p2) + 0.16 * Math.sin((x + z * 0.6) * l2 + p2) * Math.sin((z - x * 0.4) * l2 + p1)) * lump * w2;      // (kept long and low: at full speed a bend sharper than about 0.1 a metre throws the car, and a field of those is a judder)
    // the drift in the lee of the crest: a low whaleback a little down from the top, across the wind
    const dx = x - sx, dz = z - sz, al = dx * Math.cos(dir) + dz * Math.sin(dir), ac = -dx * Math.sin(dir) + dz * Math.cos(dir);
    const dl = (al - dAt) / dW, dc = ac / dL, dr = drift * Math.exp(-(dl * dl + dc * dc)) * smooth((1 - t0) * 4);
    h += lumps + dr;
    if (kn) { const q = Math.hypot(x - kn.x, z - kn.z) / kn.r; if (q < 1) h += kn.h * (Math.cos(q * Math.PI) + 1) / 2 * w; }
    let cut = 0, lip = 0, ca = 0, cs = 9;
    if (chute) {
      ca = dx * ux + dz * uz; cs = Math.abs(-dx * uz + dz * ux);
      const along = smooth((ca - chute.from) / 2.5) * smooth((chute.to - ca) / 3);
      if (along > 0 && cs < 2.2) {
        const q = cs / chute.hw;
        cut = q < 1 ? (Math.cos(q * Math.PI) + 1) / 2 * along : 0;                         // the trough
        const e = (cs - chute.hw * 1.35) / (chute.hw * 0.75); lip = Math.abs(e) < 1 ? (Math.cos(e * Math.PI) + 1) / 2 * along : 0;      // the pushed snow beside it
        h += -chute.depth * cut + chute.depth * 0.38 * lip;
      }
    }
    let kick = 0;
    if (br) { const b = Math.hypot(dx, dz) / br; if (b < 1) { kick = (Math.cos(b * Math.PI) + 1) / 2; h += s.bump * kick; } }
    P.h = h > 0 ? h : 0; P.t = t0; P.th = th; P.cut = cut; P.lip = lip; P.kick = kick; P.dr = dr / (drift || 1); P.al = al; P.ac = ac;
    return P;
  };
  s.fn = (x, z) => { const p = parts(x, z); return p ? p.h : 0; };
  s.form = { sx, sz, dir, lean, big, chute, parts, wind: WIND };
  return s;
}
