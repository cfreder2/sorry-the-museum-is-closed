// What grows and what stands in the grounds, as the real place has it: where every tree is and what kind, the shrubs
// and the beds they stand in, the clipped hedges, and the park's furniture. Plain data worked out once when the plan is
// made (plan.js calls dressGrounds just before the land is laid), no three.js: trees.js draws what grows, parkdress.js
// what stands, streets.js puts out the benches and bins with its own.
//
// What is real, and from where (docs/GROUNDS-REAL.md has the field guide and its sources):
//   * West of Columbus Drive the game's ground is the real ground, so trees, benches, flagpoles, bike racks, hedges and
//     planted beds stand where OpenStreetMap has them (src/groundsdata.js; map data © OpenStreetMap contributors, ODbL),
//     wherever the game has open ground there. The South Garden is Dan Kiley's grove of cockspur hawthorns on a 20 ft
//     grid with honey locusts over the entrance and south beds; the North Garden has honey locusts by the building.
//   * The game's lawns either side of the railway are not real ground (galleries and the rail yards are there): they are
//     dressed in Grant Park's own way, with rows of American elms along the cut and the paths, lindens, crabapples, a
//     ginkgo or two, river birch in clumps, red-twig dogwood, viburnum, roses, grasses and seed heads left standing.
//   * East of Columbus Drive the game's park is squeezed, so the real pattern is kept and not the positions: the frame of
//     trees round Butler Field (elms outside, the lindens that replaced them in 1978 inside), locusts by the Drive.
//
// Nothing here takes ground from anything already in the plan: every place is tested against what stands (obstacles,
// surfaces, hills, kit), what is paved, the ways in, the race courses, the drone's hoops, the works of art (planted
// round, never over), and the ground the features lay out later (land.js FLAT). A tree's trunk is solid and rides the
// land, as every tree's does; a shrub with a body is solid; grasses and seed heads are not. What stands on open ground
// is listed in plan.dress.flat, which the drifts keep clear of (land.js).

import { REAL } from './groundsdata.js';
import { FLAT, FENCES, SPRUCES, PONDS, parkLamps, parkSeats } from './land.js';
import { SPOTS } from './racecourses.js';

const rng = seed => { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const vnoise = seed => { const at = (i, j) => { let n = (Math.imul(i, 374761393) + Math.imul(j, 668265263) + seed) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; }; return (x, z) => { const i = Math.floor(x), j = Math.floor(z), fx = x - i, fz = z - j, u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz); return at(i, j) * (1 - u) * (1 - v) + at(i + 1, j) * u * (1 - v) + at(i, j + 1) * (1 - u) * v + at(i + 1, j + 1) * u * v; }; };

// How tall each kind stands, metres (lowest, highest): trees.js gives each its habit.
export const SPECIES = { elm: [10.5, 14], locust: [8, 11], linden: [7.5, 10], ginkgo: [7.5, 10], hawthorn: [4.2, 5.4], crab: [3.8, 5.2], birch: [6.5, 9] };
// Shrubs: [radius of the clump, height, solid?]. (parkdress has nothing to draw for them: they are in trees.js's meshes.)
export const SHRUBS = { dogwood: [0.55, 1.5, 1], viburnum: [0.8, 1.7, 1], privet: [0.7, 1.0, 1], rose: [0.6, 0.95, 0], grass: [0.5, 1.25, 0], seed: [0.4, 0.7, 0], hydrangea: [0.55, 1.0, 0], yew: [0.9, 1.0, 1], arbor: [0.55, 3.0, 1] };

// What stands at the foot of the Modern Wing's north side: the glass stair tower at the top of the Nichols Bridgeway, the
// glass lift beside it, and the paved apron before the court's doors on Monroe Street. bridgeway.js builds them and
// wingplay.js runs the lift, long after the planting is laid; where they stand is worked out here, once for both, so that
// the planting can leave them clear. (It did not know of them: the bed at the wall's foot ran straight through all three,
// and its roses grew up through the floor of the lift.)
export function wingFoot(plan) {
  const h = plan.hall, mod = plan.masses.filter(m => m.room && m.room.building === 'modern' && m.room.kind !== 'hall');
  if (!mod.length || !h) return null;
  const wp = mod.filter(m => m.room.use === 'terrace').sort((a, b) => b.top - a.top)[0] || mod.slice().sort((a, b) => a.x0 - b.x0)[0];
  const tw = { x0: (wp.x0 + wp.x1) / 2 - 3.4, x1: (wp.x0 + wp.x1) / 2 + 3.4, z0: wp.z0 - 5.4, z1: wp.z0 - 0.05, top: wp.top + 0.8 };
  const lift = (() => {
    const x0 = tw.x1 + 0.6, x1 = tw.x1 + 2.4, here = mod.filter(m => m.x1 > x0 && m.x0 < x1 && m.z0 < wp.z0 + 1);
    const face = Math.min(wp.z0, ...here.map(m => m.z0)) - 0.07, z1 = face - 0.15;      // 15 cm off the glass of the face
    return { x0, x1, z0: z1 - 1.8, z1, face };
  })();
  const hm = (plan.massOf && plan.massOf[h.id]) || { x0: h.x0 - 1, x1: h.x1 + 1, z0: h.z0 - 1 };
  return { wp, tw, lift, apron: { x0: hm.x0 - 0.8, x1: hm.x1 + 0.8, z0: hm.z0 - 4.2 - 1.5, z1: hm.z0 } };
}

export function dressGrounds(plan, openings = []) {
  const G = plan.grounds, L = plan.lakefront, B = plan.bounds, O = plan.obstacles, F = plan.facade, r = rng(1909), n1 = vnoise(7), n2 = vnoise(31);
  const pavedR = plan.paved.filter(q => q.x0 != null);
  const D = plan.dress = { ride: [], shrubs: [], cover: [], beds: [], benches: [], bins: [], lamps: [], flagpoles: [], racks: [], fountains: [], signs: [], bollards: [], chains: [], boulders: [], tables: [], salt: [], guards: [], rings: [], boats: [], kiosk: null, dock: null, markers: [], balustrades: [], flat: [], hedges: 0, added: 0 };

  // ---- what is already there, in a grid of 4 m cells
  const CELL = 4, grid = new Map(), cellsOf = (x0, x1, z0, z1, fn) => { for (let i = Math.floor(x0 / CELL); i <= Math.floor(x1 / CELL); i++) for (let j = Math.floor(z0 / CELL); j <= Math.floor(z1 / CELL); j++) fn(i * 8192 + j); };
  const put = q => cellsOf(q.x0, q.x1, q.z0, q.z1, k => { let a = grid.get(k); if (!a) grid.set(k, a = []); a.push(q); });
  for (const o of O) if (o.y0 < 3 && o.y1 > -0.2 && o.x0 > B.x0 - 5 && o.x1 < B.x1 + 5) put(o);
  for (const s of plan.surfaces) if (s.x0 != null && !s.land && (s.base ?? 0) < 3 && (s.h0 ?? 0) < 9 && s.x1 - s.x0 < 200) put(s);
  const hit = (x, z, rad) => { let h = false; cellsOf(x - rad, x + rad, z - rad, z + rad, k => { if (h) return; const a = grid.get(k); if (a) for (const q of a) if (x > q.x0 - rad && x < q.x1 + rad && z > q.z0 - rad && z < q.z1 + rad) { h = true; return; } }); return h; };
  const inMass = (x, z, pad = 0) => plan.masses.some(m => x > m.x0 - pad && x < m.x1 + pad && z > m.z0 - pad && z < m.z1 + pad);
  const inRect = (list, x, z, pad = 0) => list.some(q => x > q.x0 - pad && x < q.x1 + pad && z > q.z0 - pad && z < q.z1 + pad);
  const R4 = a => ({ x0: a[0], x1: a[1], z0: a[2], z1: a[3] });
  // Ground kept clear whatever stands there now: what the features lay out, the ways in, the roads.
  const keep = [...FLAT.map(R4), R4([390, 472, -18, 47]), R4([385, 476, 105, 246]), R4([405, 455, 60, 110]), R4([85, 105, -7, 11]), R4([126, 152, 79, 100.5]), R4([257, 276, 93, 111]), R4([257, 275, -25, -3]),      // (the last three: the flagged court by the Triton fountain, the way in to the east door under its canopy, the lawn the arch stands in: eastside.js lays them later)
    { x0: G.rail.x0 - 2.6, x1: G.rail.x1 + 2.6, z0: B.z0, z1: B.z1 }, R4([-2, 18, F.cz - 24, F.cz + 24]),
    { x0: G.michigan.x0, x1: G.michigan.x1, z0: B.z0, z1: B.z1 }, { x0: B.x0, x1: B.x1, z0: G.monroe.z0, z1: G.monroe.z1 }, { x0: B.x0, x1: B.x1, z0: G.jackson.z0, z1: G.jackson.z1 }, { x0: G.columbus.x0 - 0.4, x1: G.columbus.x1 + 0.4, z0: B.z0, z1: B.z1 }];
  if (G.silo && G.silo.x0 != null) keep.push({ x0: G.silo.x0 - 3, x1: G.silo.x1 + 3, z0: G.silo.z0 - 3, z1: G.silo.z1 + 3 });
  if (L) keep.push({ x0: L.lsd.x0 - 0.5, x1: L.lsd.med[0] - 0.2, z0: B.z0, z1: B.z1 }, { x0: L.lsd.med[1] + 0.2, x1: L.lsd.x1 + 0.5, z0: B.z0, z1: B.z1 }, { x0: L.prom.x1 - 3.2, x1: B.x1 + 400, z0: B.z0, z1: B.z1 });
  for (const d of plan.doors) if (d.out) keep.push({ x0: d.x0 - 4.5, x1: d.x1 + 4.5, z0: d.z0 - 4.5, z1: d.z1 + 4.5 });
  for (const q of openings) if (q && q.x0 != null) keep.push({ x0: q.x0 - 2.5, x1: q.x1 + 2.5, z0: q.z0 - 2.5, z1: q.z1 + 2.5 });
  for (const s of G.sculpt) if (s.half) keep.push({ x0: s.x - 3, x1: s.x + 3, z0: s.z - s.half - 2.5, z1: s.z + s.half + 2.5 });
  // ...and the foot of the Modern Wing, where bridgeway.js stands its tower, its lift and its apron after this: the tower, the
  // lift's shaft with the gap beside it and the way up to its street door, and the paving. Nothing grows through a floor.
  const WF = wingFoot(plan), bare = WF ? [{ x0: WF.tw.x0, x1: WF.tw.x1, z0: WF.tw.z0, z1: WF.tw.z1 }, { x0: WF.tw.x1, x1: WF.lift.x1 + 0.35, z0: WF.lift.z0 - 1.6, z1: WF.lift.face }, WF.apron] : [];
  // ...and round things that are points: [x, z, r]
  const discs = [];
  for (const [list, rad] of [[plan.hoops, 4.5], [plan.loops, 8], [plan.props, 1.7], [G.snowmen, 1.9], [plan.lamps, 1.3], [plan.benches, 1.8]]) for (const p of list || []) if (p.x != null) discs.push([p.x, p.z, rad]);
  for (const f of G.fountains) discs.push([f.x, f.z, f.r + 2.4]);
  for (const a of plan.outdoorArt || []) discs.push([a.x, a.z, 6]);                     // no planting over a work of art, nor against it
  if (G.tree) discs.push([G.tree.x, G.tree.z, 8]); if (plan.spawn) discs.push([plan.spawn.x, plan.spawn.z, 5]);
  if (plan.park) discs.push([plan.park.x, plan.park.z, 13]);
  for (const [x, z, h] of SPRUCES) discs.push([x, z, h * 0.34 + 1]); for (const [x, z, rr] of PONDS) discs.push([x, z, rr + 1.6]);
  if (L) { const pl = parkLamps(L.field); for (const [x, z] of pl) discs.push([x, z, 1.4]); for (const [x, z] of parkSeats(pl)) discs.push([x, z, 2.3]); }
  // (benches, bins and street lights the streets put out later, where they are known to stand: streets.js, winterroads.js)
  for (const x of [40, 63, 132, 178, 201, 247]) discs.push([x, -25.3, 1.6], [x, 245.3, 1.6]);
  for (const z of [30, 60.2, 92, 150, 205]) discs.push([272.5, z, 1.7]);
  for (const z of [1, 46, 90, 141, 186, 230]) discs.push([514.8, z, 1.3]); for (const z of [-22, 24, 68, 119, 164, 208, 241]) discs.push([479.3, z, 1.3]);
  for (let z = B.z0 + 30; z < B.z1 - 10; z += 34) discs.push([523.6, z, 2.2]);
  // ...and along lines: the snow fences, and every race course out of doors
  const lines = FENCES.map(f => [f[0], f[1], f[2], f[3], 1.6]);
  for (const s of SPOTS) if (!inMass(s.way[0][0], s.way[0][1])) for (let i = 0; i < s.way.length; i++) { const a = s.way[i], b = s.way[(i + 1) % s.way.length]; lines.push([a[0], a[1], b[0], b[1], 3.4]); }
  const segD = (x, z, ax, az, bx, bz) => { const dx = bx - ax, dz = bz - az, t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1))); return Math.hypot(x - ax - dx * t, z - az - dz * t); };
  const mine = [];                                       // [x, z, r] of what this has placed
  /** Is there room at (x, z) for something `rad` across? paved: may it stand on a pavement or a path's edge? */
  // (late: the caller leaves `bare` ground clear itself, when it sets the thing down. The beds do: they throw their dice as if
  // it were not there, so that taking a plant out of the lift moves no other plant in the grounds.)
  const free = (x, z, rad, { paved = false, gap = 0.3, own = true, late = false } = {}) => {
    if (x < B.x0 + 1 || x > B.x1 - 1 || z < B.z0 + 1 || z > B.z1 - 1 || inMass(x, z, rad + 0.35)) return false;
    if (inRect(keep, x, z, rad) || (!late && inRect(bare, x, z, rad))) return false;
    if (inRect(G.paths, x, z, rad + 0.15) || (L && inRect(L.paths, x, z, rad + 0.15))) return false;
    if (!paved && inRect(pavedR, x, z, rad)) return false;
    if (inRect(plan.ice || [], x, z, rad + 0.5)) return false;
    for (const d of discs) if ((x - d[0]) ** 2 + (z - d[1]) ** 2 < (d[2] + rad) ** 2) return false;
    for (const l of lines) if (segD(x, z, l[0], l[1], l[2], l[3]) < l[4] + rad) return false;
    if (own) for (const m of mine) if ((x - m[0]) ** 2 + (z - m[1]) ** 2 < (m[2] + rad + gap) ** 2) return false;
    return !hit(x, z, rad + gap);
  };
  const flatRect = (x0, x1, z0, z1) => D.flat.push({ x0, x1, z0, z1 }), flatDisc = (x, z, rr) => D.flat.push({ x, z, r: rr });

  const nmz = (G.north.z0 + G.north.z1) / 2, nmx = (G.north.x0 + G.north.x1) / 2, smx = (G.south.x0 + G.south.x1) / 2, smz = (G.south.z0 + G.south.z1) / 2, CZ = 75.25;
  // ---- the big things first, so that the planting goes round them
  const stand = (list, x, z, rad, rec, o = {}) => { if (!free(x, z, rad, { paved: true, ...o })) return false; list.push(rec); mine.push([x, z, rad]); return true; };
  if (L) {
    // Picnic tables under snow, by the field's cross path; a concession kiosk shut for the season on the promenade, facing the trail.
    for (const [x, z, yaw] of [[397.6, 101.6, 0.3], [401.4, 98.4, 1.2], [476.2, 126.5, 0]]) if (stand(D.tables, x, z, 1.25, [x, z, yaw], { paved: false })) { O.push({ x0: x - 0.95, x1: x + 0.95, z0: z - 0.95, z1: z + 0.95, y0: 0.42, y1: 0.76 }); plan.surfaces.push({ skin: 'wall', fixed: true, x0: x - 0.8, x1: x + 0.8, z0: z - 0.8, z1: z + 0.8, axis: null, h0: 0.84, h1: 0.84, thick: 0.1, base: 0 }); flatRect(x - 1.3, x + 1.3, z - 1.3, z + 1.3); }
    { const x = 517.7, z = 33.6, h = 1.25; if (free(x, z, 1.7, { paved: true })) { D.kiosk = { x, z, h, yaw: Math.PI / 2 }; mine.push([x, z, 2.6]); O.push({ x0: x - h, x1: x + h, z0: z - h, z1: z + h, y0: 0, y1: 2.5 }); flatRect(x - h - 0.4, x + h + 0.4, z - h - 0.4, z + h + 0.4); } }
    // By the harbour, south of the race: three boats shrink-wrapped on their cradles and a rack of dinghies (the harbour's
    // own boats winter at other harbours; these are the few that stay), a half-buried bike-share dock, life rings.
    for (const [x, z, len] of [[516.5, 196.5, 5.6], [516.6, 203.6, 4.8], [516.4, 210.4, 6.2]]) if (free(x, z, 1.3, { paved: true })) { D.boats.push({ x, z, len, wrap: true }); mine.push([x, z, 2.6]); const bm = len * 0.17; O.push({ x0: x - bm, x1: x + bm, z0: z - len / 2, z1: z + len / 2, y0: 0.62, y1: 0.62 + len * 0.26 });      // the hull under its wrap; and the stands and blocks it sits on: between them a toy goes under the keel
      for (const dz of [-len * 0.25, len * 0.22]) O.push({ x0: x - bm * 0.8, x1: x + bm * 0.8, z0: z + dz - 0.08, z1: z + dz + 0.08, y0: 0, y1: 0.8 }); for (const dz of [-len * 0.05, len * 0.3]) O.push({ x0: x - 0.12, x1: x + 0.12, z0: z + dz - 0.17, z1: z + dz + 0.17, y0: 0, y1: 0.62 }); }
    if (free(516.4, 219.5, 1.2, { paved: true })) { D.boats.push({ x: 516.4, z: 219.5, len: 3.4, rack: true }); mine.push([516.4, 219.5, 2.2]); O.push({ x0: 515.5, x1: 517.3, z0: 217.7, z1: 221.3, y0: 0, y1: 1.9 }); }
    if (free(516.3, 238.5, 0.8, { paved: true })) { D.dock = { x: 516.3, z: 238.5, n: 7 }; mine.push([516.3, 238.5, 3]); O.push({ x0: 515.4, x1: 518.1, z0: 235.8, z1: 241.2, y0: 0, y1: 1.05 }); }      // (the posts, the bicycles in them and the snow drifted over both)
  }

  // Urns on piers and a run of balustrade either side, at the four corners of the path's bridge over the railway: the
  // park's Beaux-Arts edge to the tracks.
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const x = sx < 0 ? G.rail.x0 - 3.1 : G.rail.x1 + 3.1, z = nmz + sz * 2.55, z1 = z + sz * 6;
    if (free(x, z, 0.45, { paved: true }) && free(x, (z + z1) / 2, 0.3, { paved: true }) && free(x, z1, 0.3, { paved: true })) { D.balustrades.push([x, z, x, z1]); mine.push([x, z, 0.5], [x, z1, 0.5], [x, (z + z1) / 2, 0.5]); O.push({ x0: x - 0.2, x1: x + 0.2, z0: Math.min(z, z1) - 0.3, z1: Math.max(z, z1) + 0.3, y0: 0, y1: 1.0 }); flatRect(x - 0.5, x + 0.5, Math.min(z, z1) - 0.6, Math.max(z, z1) + 0.6); } }

  // ------------------------------------------------------------------ trees
  // Those the plan already has: each is told what it is.
  let av = 0;
  for (const t of G.trees) {
    const ng = t.x > G.north.x0 && t.x < G.north.x1 && t.z > G.north.z0 && t.z < G.north.z1;
    if (t.kind === 'hawthorn') t.sp = t.x < 27 || t.z > 235 ? 'locust' : 'hawthorn';                    // honey locusts over the entrance beds and the south bed, as Kiley had them
    else if (t.kind === 'elm') t.sp = L && Math.abs(t.x - 497) < 1 ? 'locust' : ((Math.round(t.x / 14) + Math.round(t.z / 14)) % 3 === 0 ? 'linden' : 'elm');
    else if (Math.abs(t.x - 3.4) < 0.1) t.sp = av++ % 5 === 2 ? 'ginkgo' : 'locust';                    // the avenue: honey locusts in grates, a ginkgo among them
    else if (Math.abs(t.x - (G.columbus.x0 - 1.4)) < 0.1) t.sp = 'linden';
    else if (ng) t.sp = t.x > 44 ? 'locust' : t.z < -9 ? 'linden' : ((t.x * 7 + t.z * 3) % 5 < 2 ? 'crab' : 'locust');
    else t.sp = t.z > 100 && (Math.round(t.x / 23) % 2) ? 'linden' : 'locust';
    if (!(ng || t.kind === 'hawthorn') && inRect(pavedR, t.x, t.z, 0)) D.guards.push([t.x, t.z]);      // a street tree in its guard
  }
  const near = (x, z, d) => G.trees.some(t => (t.x - x) ** 2 + (t.z - z) ** 2 < d * d);
  const plant = (x, z, sp, { paved = false, gap = 5, rad = 1.1, guard = false } = {}) => {
    if (near(x, z, gap) || !free(x, z, rad, { paved })) return false;
    G.trees.push({ x, z, kind: sp === 'hawthorn' ? 'crab' : sp, sp, s: 1, yaw: r() * 6.283, added: true });
    const hw = sp === 'elm' ? 0.22 : sp === 'crab' || sp === 'hawthorn' || sp === 'birch' ? 0.15 : 0.19;      // (solid as wide as trees.js draws its trunk)
    O.push({ x0: x - hw, x1: x + hw, z0: z - hw, z1: z + hw, y0: 0, y1: 5 }); mine.push([x, z, 0.5]); D.added++;
    if (guard) D.guards.push([x, z]);
    return true;
  };
  // The real ones, west of Columbus Drive.
  const lawn = (x, z) => !inRect(pavedR, x, z, 0);
  for (const [x, z] of REAL.trees) {
    if (x < 1 || x > G.columbus.x0 - 0.8) continue;
    const sp = x > 259 ? (Math.round(z / 6) % 3 ? 'linden' : 'locust') : x > 246 ? 'elm' : z < -12 ? 'locust' : z > 228 && x < 95 ? 'locust' : x < 95 ? (x > 48 ? 'locust' : 'crab') : 'linden';
    const pv = !lawn(x, z); plant(x, z, sp, { paved: true, gap: 4.2, rad: pv ? 0.45 : 1.0, guard: pv });
  }
  // Rows of elms along the railway cutting, both sides, and along the long paths: the park's formal bones.
  const row = (ax, az, bx, bz, step, sp, o = {}) => { const len = Math.hypot(bx - ax, bz - az), n = Math.floor(len / step); for (let i = 0; i <= n; i++) { const t = n ? i / n : 0, s = typeof sp === 'function' ? sp(i) : sp; plant(ax + (bx - ax) * t, az + (bz - az) * t, s, o); } };
  for (const x of [G.rail.x0 - 5.2, G.rail.x1 + 5.2]) { row(x, -21, x, 94, 8.5, 'elm', { gap: 6 }); row(x, 126, x, 242, 8.5, 'elm', { gap: 6 }); }
  row(141, 70.6, 248, 70.6, 10.5, i => i % 4 === 3 ? 'ginkgo' : 'linden', { gap: 6 }); row(146.2, 79.9, 248, 79.9, 10.5, 'linden', { gap: 6 });
  row(132.2, 24, 132.2, 72, 9.5, 'linden', { gap: 6 }); row(141.8, 24, 141.8, 66, 9.5, 'linden', { gap: 6 });
  row(66, 13.8, 108, 13.8, 9, 'crab', { gap: 5 }); row(66, 23.2, 108, 23.2, 9, 'crab', { gap: 5 });
  // Loose groups on the lawns: lindens and elms for height, crabapples and birches in front of them.
  const grove = (x0, x1, z0, z1, n, mix, gap = 7.5) => { for (let i = 0, k = 0; i < n * 14 && k < n; i++) { const x = x0 + r() * (x1 - x0), z = z0 + r() * (z1 - z0), c = n1(x / 22, z / 22); if (c < 0.42) continue; let u = r(), sp = mix[mix.length - 1][0]; for (const [s, p] of mix) { if (u < p) { sp = s; break; } u -= p; }
    if (sp === 'birch') { if (plant(x, z, 'birch', { gap })) { k++; for (const a of [2.1, 4.3]) plant(x + Math.cos(a + x) * 2.6, z + Math.sin(a + x) * 2.6, 'birch', { gap: 2.2, rad: 0.7 }); } } else if (plant(x, z, sp, { gap })) k++; } };
  const MIX = [['linden', 0.3], ['crab', 0.24], ['birch', 0.16], ['elm', 0.14], ['hawthorn', 0.1], ['ginkgo', 0.06]];
  grove(92, 110, -24, 94, 9, MIX); grove(125, 150, -24, 70, 8, MIX); grove(92, 110, 122, 244, 12, MIX); grove(125, 150, 122, 244, 12, MIX);
  grove(214, 272, 150, 244, 14, MIX); grove(250, 272, -24, 150, 9, MIX);
  if (L) {
    const f = L.field, sp2 = i => i % 3 === 1 ? 'linden' : 'elm';
    // Butler Field's frame: the single rows the plan has become double, closer set, and a second row beside the Drive.
    for (let x = 311; x <= 472; x += 14) { plant(x, f.z0 + 5, sp2(x), { gap: 5.5 }); plant(x, f.z1 - 5, sp2(x), { gap: 5.5 }); }
    for (let x = 304; x <= 472; x += 7) plant(x, f.z0 + 2.4, 'linden', { gap: 5.5, paved: true });
    for (let z = f.z0 + 12; z <= f.z1 - 12; z += 7) { plant(476.7, z, sp2(Math.round(z / 7)), { gap: 5.5 }); plant(473, z, 'linden', { gap: 6 }); plant(297.6, z, 'linden', { gap: 6, paved: true, rad: 0.45, guard: true }); }
    for (let x = 392; x <= 470; x += 9.5) { plant(x, 114.9, 'elm', { gap: 6 }); plant(x, 105.1, 'elm', { gap: 6 }); }
    for (let z = f.z0 + 8; z <= f.z1 - 8; z += 9.5) { plant(392.3, z, 'linden', { gap: 6 }); plant(381.7, z, 'linden', { gap: 6 }); }
    // Honey locusts in the promenade's paving, on the Drive's side, clear of the harbour race.
    for (let z = B.z0 + 9; z < B.z1 - 6; z += 11.5) if ((z < 190 || z > 226) && Math.abs(z - 33.6) > 5) plant(L.prom.x0 + 1.5, z, 'locust', { paved: true, gap: 6, rad: 0.45, guard: true });      // (and of the boats standing ashore: below)
  }

  // ------------------------------------------------------------------ hedges, clipped, where the real ones run
  const hedgeAt = (x0, x1, z0, z1) => { G.hedges.push({ x0, x1, z0, z1 }); const o = { x0, x1, z0, z1, y0: 0, y1: 0.8 }; O.push(o); put(o); plan.surfaces.push({ skin: 'wall', fixed: true, x0: x0 - 0.05, x1: x1 + 0.05, z0: z0 - 0.05, z1: z1 + 0.05, axis: null, h0: 0.88, h1: 0.88, base: 0 }); D.hedges++; };
  const hedgeRun = (ax, az, bx, bz) => {                // an axis-true run, kept only where there is room for it, in lengths of 2.5 m and more
    const alongX = Math.abs(bx - ax) > Math.abs(bz - az), c = alongX ? (az + bz) / 2 : (ax + bx) / 2, a = Math.min(alongX ? ax : az, alongX ? bx : bz), b = Math.max(alongX ? ax : az, alongX ? bx : bz);
    let s = null;
    for (let p = a; p <= b + 0.5; p += 0.5) { const x = alongX ? p : c, z = alongX ? c : p, ok = p <= b && free(x, z, 0.55, { paved: false }) && !inRect(G.hedges, x, z, 1.6) && !near(x, z, 1.3);
      if (ok && s == null) s = p; if (!ok && s != null) { if (p - 0.5 - s >= 2.5) alongX ? hedgeAt(s, p - 0.5, c - 0.35, c + 0.35) : hedgeAt(c - 0.35, c + 0.35, s, p - 0.5); s = null; } }
  };
  const before = G.hedges.length;
  for (const pts of REAL.hedges) for (let i = 0; i + 1 < pts.length; i++) { const [ax, az] = pts[i], [bx, bz] = pts[i + 1], dx = Math.abs(bx - ax), dz = Math.abs(bz - az); if (Math.max(dx, dz) < 3 || Math.min(dx, dz) > 0.12 * Math.max(dx, dz) + 0.6 || Math.max(ax, bx) > G.columbus.x0 - 1 || (ax > 150 && ax < 250 && az > 90 && az < 126)) continue; hedgeRun(ax, az, bx, bz); }      // (not the real courtyard's: the game's has its rink there)
  for (const h of G.hedges.slice(before)) mine.push([(h.x0 + h.x1) / 2, (h.z0 + h.z1) / 2, 0.1]);

  // ------------------------------------------------------------------ shrubs
  const shrub = (x, z, k, o = {}) => {
    const [rad, h, solid] = SHRUBS[k], s = (o.s || 1) * (0.8 + r() * 0.45);
    if (near(x, z, 1.2) || !free(x, z, rad * s * 0.7, { gap: o.gap ?? 0.12, late: true })) return false;
    const seed = (r() * 1e6) | 0; mine.push([x, z, rad * s * (o.tight ? 0.35 : 0.6)]);
    if (inRect(bare, x, z, rad * s * 0.5)) return true;      // thrown, and its place kept, as ever: only not set down (see free)
    D.shrubs.push({ x, z, k, r: rad * s, h: h * s, seed });
    if (solid) { const c = rad * s * 0.42; O.push({ x0: x - c, x1: x + c, z0: z - c, z1: z + c, y0: 0, y1: h * s * 0.6 }); D.ride.push({ x, z }); }
    return true;
  };
  // Beds at the foot of the building: along every outside wall with lawn before it, in drifts of one kind, with gaps.
  const BED = ['yew', 'dogwood', 'grass', 'viburnum', 'hydrangea', 'rose', 'seed', 'dogwood', 'grass', 'yew'];
  // A bed stops where the tower, the lift or the apron stands in it: what is left of it either side, if that is still a bed.
  const bedParts = (q, alongZ) => { let parts = [q]; for (const b of bare) parts = parts.flatMap(p => p.x1 <= b.x0 || p.x0 >= b.x1 || p.z1 <= b.z0 || p.z0 >= b.z1 ? [p] : alongZ ? [{ ...p, z1: b.z0 }, { ...p, z0: b.z1 }] : [{ ...p, x1: b.x0 }, { ...p, x0: b.x1 }]); return parts.filter(p => (alongZ ? p.z1 - p.z0 : p.x1 - p.x0) > 2); };
  for (const m of plan.masses) {
    if (m.x1 - m.x0 < 3 || m.z1 - m.z0 < 3 || m.x0 > G.columbus.x0) continue;
    for (const [nx, nz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const alongZ = nx !== 0, a = alongZ ? m.z0 : m.x0, b = alongZ ? m.z1 : m.x1, w = alongZ ? (nx > 0 ? m.x1 : m.x0) : (nz > 0 ? m.z1 : m.z0);
      let run = null;
      for (let p = a + 0.8; p <= b - 0.3; p += 1.15) {
        const x = alongZ ? w + nx * 1.05 : p, z = alongZ ? p : w + nz * 1.05, band = n1(x / 9 + 3, z / 9), kind = BED[Math.floor(n2(x / 14, z / 14 + 9) * BED.length) % BED.length];
        let ok = band > 0.47 && lawn(x, z) && lawn(x + nx * 1.2, z + nz * 1.2) && !inMass(x + nx * 0.8, z + nz * 0.8, 0.1) && free(x, z, 0.5, { gap: 0.05, late: true }) && free(x + nx * 2.2, z + nz * 2.2, 0.3, { own: false, late: true });
        if (ok) { const o = 1.05 + (r() - 0.5) * 0.5, px = alongZ ? w + nx * o : p, pz = alongZ ? p : w + nz * o; ok = shrub(px, pz, kind, { tight: true, gap: 0 });
          if (ok && (kind === 'grass' || kind === 'seed' || kind === 'rose') && r() < 0.7) shrub(px + nx * (0.7 + r() * 0.5) + (alongZ ? 0 : 0.4), pz + nz * (0.7 + r() * 0.5) + (alongZ ? 0.4 : 0), kind, { tight: true, gap: 0, s: 0.8 }); }
        else if (band > 0.3 && band <= 0.47 && lawn(x, z) && !inMass(x, z, 0.3) && !inRect(keep, x, z, 0) && !inRect(bare, x, z, 0.3) && !hit(x, z, 0.4)) D.cover.push([alongZ ? w + nx * 0.06 : p, alongZ ? p : w + nz * 0.06, nx, nz]);      // ivy on the wall's foot, groundcover before it
        if (ok) { if (!run) run = [p, p]; run[1] = p; }
        if ((!ok || p + 1.15 > b - 0.3) && run) { if (run[1] - run[0] > 2) { const q = alongZ ? { x0: Math.min(w, w + nx * 2.1), x1: Math.max(w, w + nx * 2.1), z0: run[0] - 0.8, z1: run[1] + 0.8 } : { x0: run[0] - 0.8, x1: run[1] + 0.8, z0: Math.min(w, w + nz * 2.1), z1: Math.max(w, w + nz * 2.1) }; D.beds.push(...bedParts(q, alongZ)); flatRect(q.x0 - 0.2, q.x1 + 0.2, q.z0 - 0.2, q.z1 + 0.2); } run = null; }
      }
    }
  }
  // The real beds of the two gardens and the Monroe Street side: perennials and grasses left standing, as at Lurie Garden
  // across the street; privet under the honey locusts of the South Garden's entrance beds.
  for (const [x0, x1, z0, z1] of REAL.beds) {
    if (x0 < 1 || (x1 - x0) * (z1 - z0) < 14) continue;
    const south = z0 > 160, monroe = z1 < -10, kinds = south ? (x1 < 27 ? ['privet', 'privet', 'seed'] : ['seed', 'privet']) : monroe ? ['grass', 'grass', 'seed', 'dogwood'] : ['seed', 'grass', 'seed', 'rose', 'grass'];
    for (let i = 0, n = Math.min(60, Math.round((x1 - x0) * (z1 - z0) / (south ? 5 : 7))); i < n; i++) { const x = x0 + 0.6 + r() * (x1 - x0 - 1.2), z = z0 + 0.6 + r() * (z1 - z0 - 1.2); if (n1(x / 5, z / 5 + 40) < 0.38) continue; shrub(x, z, kinds[Math.floor(n2(x / 6, z / 6) * kinds.length) % kinds.length], { tight: true, gap: 0 }); }
  }
  // Thickets of red-twig dogwood and stands of grass out on the lawns, where a path turns or a row ends.
  const thicket = (cx, cz, k, n, spread) => { for (let i = 0; i < n; i++) { const a = r() * 6.283, d = Math.sqrt(r()) * spread; shrub(cx + Math.cos(a) * d * 1.5, cz + Math.sin(a) * d, i % 5 === 4 && k === 'dogwood' ? 'grass' : k, { tight: true, gap: 0 }); } };
  for (const [x, z, k, n, s] of [[130, -19, 'dogwood', 9, 2.4], [146, 62, 'grass', 8, 2], [97, -19, 'dogwood', 7, 2], [104, 66, 'viburnum', 5, 2.2], [129, 132, 'dogwood', 9, 2.4], [146, 238, 'grass', 9, 2.2], [99, 238, 'dogwood', 8, 2.4], [219, 240, 'viburnum', 5, 2.2], [268, 152, 'dogwood', 8, 2.2], [256, -20, 'grass', 8, 2], [133, 80.5, 'dogwood', 7, 1.8], [141.5, 14, 'grass', 7, 1.8], [254, 80.5, 'grass', 7, 1.8], [246, 142, 'dogwood', 7, 2], [106, 128, 'grass', 7, 2], [128, 90, 'viburnum', 5, 2],
    [391.5, 101, 'dogwood', 7, 1.6], [382.6, 117.5, 'grass', 6, 1.4], [476.5, 104.5, 'dogwood', 8, 1.8], [476.5, 121, 'grass', 7, 1.6], [476.6, -14, 'dogwood', 7, 1.8], [476.6, 236, 'viburnum', 5, 1.8], [298.2, 119, 'grass', 6, 1.2], [392, 236, 'dogwood', 6, 1.6]]) thicket(x, z, k, n, s);
  // Arborvitae either side of the plainer doors, beyond their lamps.
  for (const d of plan.doors) if (d.out && !d.vent && d !== plan.front) { const cx = (d.x0 + d.x1) / 2, cz = (d.z0 + d.z1) / 2, m = plan.byId && plan.byId[d.a]; if (!m) continue;
    for (const sg of [-1, 1]) { const o = 5.4; let x, z; if (d.along === 'x') { x = (d.x0 < m.x0 ? d.x0 - 0.9 : d.x1 + 0.9); z = cz + sg * o; } else { z = (d.z0 < m.z0 ? d.z0 - 0.9 : d.z1 + 0.9); x = cx + sg * o; }
      if (lawn(x, z) && !inMass(x, z, 0.5) && !hit(x, z, 0.6) && !inRect(G.paths, x, z, 0.6) && !(x > G.rail.x0 - 2.6 && x < G.rail.x1 + 2.6) && !inRect(keep.slice(FLAT.length, FLAT.length + 8), x, z, 0.4) && !discs.some(q => (x - q[0]) ** 2 + (z - q[1]) ** 2 < (q[2] + 0.5) ** 2)) { const [rad, h] = SHRUBS.arbor, s = 0.85 + r() * 0.4, seed = (r() * 1e6) | 0; mine.push([x, z, 0.5]); if (inRect(bare, x, z, 0.4)) continue; D.shrubs.push({ x, z, k: 'arbor', r: rad * s, h: h * s, seed }); O.push({ x0: x - 0.3, x1: x + 0.3, z0: z - 0.3, z1: z + 0.3, y0: 0, y1: h * s * 0.8 }); D.ride.push({ x, z }); } } }

  // ------------------------------------------------------------------ furniture
  // Benches: the gardens' real ones, each facing into its garden; then along the paths, facing them, with a lamp between.
  const benchAt = (x, z, fx, fz) => { const hx = fx ? 0.4 : 0.95, hz = fx ? 0.95 : 0.4; if (near(x, z, 1.1) || !free(x, z, 0.85, { paved: true })) return false; D.benches.push({ x, z, fx, fz }); mine.push([x, z, 1.0]); flatRect(x - hx - 0.25, x + hx + 0.25, z - hz - 0.25, z + hz + 0.25); return true; };
  for (const [x, z, dir] of REAL.benches) {
    if (x < 1) continue;
    const g = z < 100 ? G.north : G.south, cx = (g.x0 + g.x1) / 2, cz = (g.z0 + g.z1) / 2, ex = Math.min(x - g.x0, g.x1 - x), ez = Math.min(z - g.z0, g.z1 - z);
    if (ex < ez) benchAt(x, z, x < cx ? 1 : -1, 0); else benchAt(x, z, 0, z < cz ? 1 : -1); void dir;
  }
  const lampAt = (x, z) => { if (near(x, z, 1.6) || (plan.lamps || []).some(l => (l.x - x) ** 2 + (l.z - z) ** 2 < 49) || !stand(D.lamps, x, z, 0.3, [x, z])) return false; O.push({ x0: x - 0.12, x1: x + 0.12, z0: z - 0.12, z1: z + 0.12, y0: 0, y1: 3.9 }); flatDisc(x, z, 0.5); return true; };
  // Along a path's centre line from a to b: a lamp every 21 m on alternate sides, a bench a third of the way to the next.
  const dressPath = (alongX, c, a, b, hw = 1.3) => { let i = 0; for (let p = a; p <= b; p += 21, i++) { const sd = i % 2 ? 1 : -1, lo = c + sd * (hw + 0.75), bo = c - sd * (hw + 1.12);
    alongX ? lampAt(p, lo) : lampAt(lo, p);
    const q = p + 7; if (q < b) alongX ? benchAt(q, bo, 0, sd) : benchAt(bo, q, sd, 0); } };
  dressPath(true, nmz, 14, 110); dressPath(true, nmz, 126, 134); dressPath(false, 137, 26, 70); dressPath(true, CZ, 144, 246); dressPath(false, 250, 82, 134);
  dressPath(false, nmx, G.north.z0 + 6, G.north.z1 - 4); dressPath(true, smz, 16, G.south.x1 - 10); dressPath(false, smx, G.south.z0 + 6, G.south.z1 - 4);
  // Bins where paths meet and at the garden gates; and the three the map has.
  for (const [x, z] of [[138.9, nmz + 2.2], [138.9, CZ - 2.2], [248.2, CZ + 2.2], [nmx + 2.1, nmz + 2.1], [smx + 2.1, smz - 2.1], [G.north.x0 + 3, nmz + 2.2], [G.south.x0 + 3, smz - 2.2], ...REAL.bins.filter(q => q[0] > 1)]) if (stand(D.bins, x, z, 0.35, [x, z])) flatDisc(x, z, 0.45);
  // Flagpoles, where the map has them by the North Garden (bare: the flags come in at dusk).
  for (const [x, z] of REAL.flagpoles) if (x > 30 && stand(D.flagpoles, x, z, 0.3, [x, z, 9 + r() * 0.6])) { O.push({ x0: x - 0.1, x1: x + 0.1, z0: z - 0.1, z1: z + 0.1, y0: 0, y1: 9.6 }); flatDisc(x, z, 0.4); }
  // Bike racks (the map's, and a few more where a path meets a door), three hoops each: solid exactly where a hoop stands
  // (its two legs, and the bar over them), so a toy drives between the hoops, and through them.
  const rackSolid = (x, z) => { for (const dx of [-0.62, 0, 0.62]) { for (const dz of [-0.28, 0.28]) O.push({ x0: x + dx - 0.04, x1: x + dx + 0.04, z0: z + dz - 0.04, z1: z + dz + 0.04, y0: 0, y1: 0.8 }); O.push({ x0: x + dx - 0.04, x1: x + dx + 0.04, z0: z - 0.3, z1: z + 0.3, y0: 0.76, y1: 0.9 }); } flatRect(x - 1.1, x + 1.1, z - 0.5, z + 0.5); };
  for (const [x, z] of REAL.racks) if (x > 1 && stand(D.racks, x, z, 0.9, [x, z, 0])) rackSolid(x, z);
  for (const [x, z] of [[139.8, 29.4], [127.8, 13.6], [66.4, 25.2], [268.4, 73], [296.7, 103.6], [517, 185.6], [391.2, 114.6]]) if (stand(D.racks, x, z, 0.9, [x, z, 0])) rackSolid(x, z);
  // Drinking fountains, shut off and bagged till spring: where paths meet.
  for (const [x, z] of [[135, nmz - 2.3], [16.6, smz + 2.5], [383.2, 107.5], [524.2, 197.4], [G.north.x0 + 5.4, nmz - 2.4], [268.6, 112.6]]) if (stand(D.fountains, x, z, 0.35, [x, z])) { O.push({ x0: x - 0.22, x1: x + 0.22, z0: z - 0.22, z1: z + 0.22, y0: 0, y1: 1.05 }); flatDisc(x, z, 0.45); }
  // Signs: the park's rules at the ways in, a finger post where the paths cross.
  for (const [x, z, k, yaw] of [[139.2, 16.2, 'rules', 0], [134.8, CZ - 2.4, 'finger', 0.6], [252.4, CZ - 2.6, 'rules', -1.57], [296.9, 107.2, 'rules', 1.57], [384.2, 106.6, 'finger', 2.2], [477.4, 107.2, 'rules', -1.57], [10.5, nmz - 3.4, 'garden', 1.57], [13.4, smz - 3.6, 'garden', 1.57], [515.2, 180.5, 'trail', 1.57], [515.2, 56, 'trail', 1.57]])
    if (stand(D.signs, x, z, 0.3, [x, z, k, yaw])) { O.push({ x0: x - 0.06, x1: x + 0.06, z0: z - 0.06, z1: z + 0.06, y0: 0, y1: 2.2 }); flatDisc(x, z, 0.35); }
  // Mile markers on the Lakefront Trail.
  for (const [x, z, n] of [[515.1, 22, '17.5'], [515.1, 243.5, '18']]) if (stand(D.markers, x, z, 0.25, [x, z, n])) O.push({ x0: x - 0.09, x1: x + 0.09, z0: z - 0.09, z1: z + 0.09, y0: 0, y1: 1.1 });
  // A low post-and-chain along the planted bed on the Monroe Street side, and round the flagpoles.
  const chainRun = (ax, az, bx, bz) => { const len = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.round(len / 2.4)); let prev = null;
    for (let i = 0; i <= n; i++) { const x = ax + (bx - ax) * i / n, z = az + (bz - az) * i / n, ok = free(x, z, 0.14, { own: false });
      if (ok) { D.bollards.push([x, z]); O.push({ x0: x - 0.07, x1: x + 0.07, z0: z - 0.07, z1: z + 0.07, y0: 0, y1: 0.62 }); flatDisc(x, z, 0.3); if (prev) { D.chains.push([prev[0], prev[1], x, z]); O.push({ x0: Math.min(prev[0], x) - 0.02, x1: Math.max(prev[0], x) + 0.02, z0: Math.min(prev[1], z) - 0.02, z1: Math.max(prev[1], z) + 0.02, y0: 0.3, y1: 0.56 }); } }
      prev = ok ? [x, z] : null; } };
  chainRun(186, -21.2, 234, -21.2); chainRun(63.2, 3.6, 63.2, 16.6);
  // Memorial boulders with a plaque, set back from a path where somebody would stop.
  for (const [x, z, s] of [[130.4, 28.5, 1], [144.2, 82.4, 0.85], [100.5, 26.6, 0.9], [394.6, 103.2, 1.1], [258.6, 78.6, 0.9], [134.2, 138, 1]]) if (stand(D.boulders, x, z, 0.75 * s, [x, z, s, r() * 6.283], { paved: false }) && D.ride.push({ x, z })) O.push({ x0: x - 0.5 * s, x1: x + 0.5 * s, z0: z - 0.42 * s, z1: z + 0.42 * s, y0: 0, y1: 0.62 * s });
  // A salt box by each end of the path's bridge over the railway, and one at the head of the sled hill's path.
  for (const [x, z] of [[108.6, nmz + 3.4], [127.4, nmz - 3.4], [296.6, 113.6]]) if (stand(D.salt, x, z, 0.55, [x, z, x > 200 ? 0 : 1.5708])) { O.push({ x0: x - 0.36, x1: x + 0.36, z0: z - 0.5, z1: z + 0.5, y0: 0, y1: 0.72 }); flatRect(x - 0.5, x + 0.5, z - 0.6, z + 0.6); }
  if (L) {
    const top = L.rev ? L.rev.top : 0.56;
    for (const z of [4, 58, 99, 121, 188, 236]) { const x = L.shore - 0.45; D.rings.push([x, z, top]); O.push({ x0: x - 0.07, x1: x + 0.07, z0: z - 0.07, z1: z + 0.07, y0: top, y1: top + 1.7 }); }
  }
  return D;
}
