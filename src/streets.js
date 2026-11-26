// The four streets round the block, dressed as they are: Michigan Avenue with its planted median,
// bus stop and the wall of shopfronts across it; Monroe Street and Jackson Drive with their
// pavements; Columbus Drive with its median. Crossings and stop lines at the corners, signals on
// black mast arms with the green street-name blades, parked cars under snow (parked.js), pay boxes, bins,
// hydrants, newspaper boxes, bike racks, bollards before the steps, hedges at the foot of the terrace.
//
// All made here by hand, of boxes and painted canvases. Everything that stands up is solid. The ground itself (concrete
// slabs, granite kerbs and their ramps, asphalt, paint, tracks, salt, ironwork) is made of streetscape.js's pieces.

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { Geo } from './geo.js';
import { fitText, twoFaced, SANS } from './textures.js';
import { streetY, landable } from './plan.js';
import { frostHedges, hedgeMaterial } from './frost.js';
import { trafficLanes, STOP_BACK, TRACK_W, GeoLite, Kerbs, slabs, strip, fixture, FIX, hash, ParkFurniture, slabMaterial, walkMarkMaterial, roadMarkMaterial, paintMaterial, trackMaterial, fixtureMaterial } from './streetscape.js';
import { ParkedCars } from './parked.js';
import { buildWinterRoads } from './winterroads.js';

const canvasTex = (w, h, draw) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };

export function buildStreets(museum, plan) {
  const G = plan.grounds, F = plan.facade, B = plan.bounds, S = plan.street, L = plan.lakefront, O = plan.obstacles, group = museum.group;
  if (!S) return;
  const SX = S.x, SY = S.y, M = G.michigan, MO = G.monroe, JA = G.jackson, C = G.columbus, R = G.rail, cz = F.cz;
  const east = L ? L.lsd.x0 : B.x1;
  const std = o => new THREE.MeshStandardMaterial(o);
  const mat = {
    stone: std({ color: 0x8a867e, roughness: 0.8, emissive: 0x3c404e, emissiveIntensity: 0.55 }),
    black: std({ color: 0x15171b, roughness: 0.5, metalness: 0.5, emissive: 0x0b0c10, emissiveIntensity: 0.6 }),
    steel: std({ color: 0x9aa2ad, roughness: 0.4, metalness: 0.6, emissive: 0x3a4048, emissiveIntensity: 0.6 }),
    green: std({ color: 0x1f3d27, roughness: 0.95, emissive: 0x0d1c12, emissiveIntensity: 0.7 }),
    soil: std({ color: 0x2a2620, roughness: 1, emissive: 0x100f0c, emissiveIntensity: 0.5 }),
    wood: std({ color: 0x5b4127, roughness: 0.8, emissive: 0x241a10, emissiveIntensity: 0.6 }),
    red: std({ color: 0xb3261f, roughness: 0.6, emissive: 0x5a120e, emissiveIntensity: 0.7 }),
    blue: std({ color: 0x1f5fa8, roughness: 0.6, emissive: 0x0f2f55, emissiveIntensity: 0.7 }),
    dark: new THREE.MeshBasicMaterial({ color: new THREE.Color(0.03, 0.04, 0.06) }),
    glass: std({ color: 0x9ab8c8, roughness: 0.08, metalness: 0.3, transparent: true, opacity: 0.3, emissive: 0x6f93ab, emissiveIntensity: 0.32, depthWrite: false, side: THREE.DoubleSide }),
    frit: new THREE.MeshBasicMaterial({ map: canvasTex(32, 32, (c, w, h) => { c.clearRect(0, 0, w, h); c.fillStyle = 'rgba(235,242,250,0.95)'; for (const [x, y] of [[8, 9], [24, 23]]) { c.beginPath(); c.arc(x, y, 5.5, 0, 7); c.fill(); } }), color: new THREE.Color(0.75, 0.8, 0.86), transparent: true, depthWrite: false, side: THREE.DoubleSide }),
    streak: new THREE.MeshBasicMaterial({ map: canvasTex(64, 8, (c, w, h) => { const gr = c.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = gr; c.fillRect(0, 0, w, h); }), color: new THREE.Color(0.085, 0.105, 0.13), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }),
    edge: new THREE.MeshBasicMaterial({ color: new THREE.Color(0.62, 0.74, 0.85) }),
    lampR: new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 0.25, 0.15) }),
    lampG: new THREE.MeshBasicMaterial({ color: new THREE.Color(0.2, 2.0, 0.7) }),
    lampA: new THREE.MeshBasicMaterial({ color: new THREE.Color(0.35, 0.22, 0.05) }),
    glow: new THREE.MeshBasicMaterial({ color: new THREE.Color(1.5, 1.35, 1.0) }),
    snow: std({ map: museum.snowTex, roughness: 0.95, emissiveMap: museum.snowTex, emissive: new THREE.Color(0.25, 0.3, 0.45), emissiveIntensity: 0.5 }),
  };
  const g = {}; for (const k in mat) g[k] = new Geo();
  const frost = new Geo();                               // clipped evergreens under the night's snow (frost.js)
  const ob = (x0, x1, z0, z1, y0, y1) => O.push({ x0, x1, z0, z1, y0, y1 });
  const paved = q => plan.paved.push(q);
  const bikeRow = [];
  const extra = [];                                                   // loose meshes: signs, blades
  const AV = SY;                                                      // the avenue's level

  // ------------------------------------------------------------------ the ground: pavements, kerbs, the road's paint and wear
  // (streetscape.js has the materials and the builders; this is where everything is put.)
  const slabG = new GeoLite(true), walkMk = new GeoLite(), roadMk = new GeoLite(), paintW = new GeoLite(), paintY = new GeoLite(), trackG = new GeoLite(), fixG = new GeoLite();
  const K = new Kerbs(plan, museum.snowTex, roadMk);
  const LSD = L ? L.lsd : null, TL = trafficLanes(plan);
  const lvl = y => () => y;                                           // flat ground at y
  const yOn = zc => x => streetY(plan, x, zc);                        // along a cross street, as it climbs from the avenue
  const KINKS = [SX, SX + 12];                                        // where the cross streets change slope
  // Points along a..b no more than `step` apart, and at every kink, so whatever is laid follows the ground.
  const breaks = (a, b, step = 6) => { const s = new Set([a, b]); for (let p = Math.ceil(a / step) * step; p < b; p += step) s.add(p); for (const k of KINKS) if (k > a && k < b) s.add(k); return [...s].sort((u, v) => u - v); };
  const without = (a, b, holes) => { const out = []; let p = a; for (const [h0, h1] of [...holes].sort((u, v) => u[0] - v[0])) { if (h1 <= p || h0 >= b) continue; if (h0 - p > 0.05) out.push([p, h0]); p = Math.max(p, h1); } if (b - p > 0.05) out.push([p, b]); return out; };
  // Paint: a line `w` wide along a run at `c` across, over a..b, following y(p). Fresh (`crisp`) or worn.
  const line = (q, axis, a, b, c, w, y, crisp = false, lift = 0.006) => { const pts = breaks(a, b), u0 = crisp ? 0.01 : 0.51, u1 = crisp ? 0.49 : 0.99; for (let i = 0; i < pts.length - 1; i++) { const p0 = pts[i], p1 = pts[i + 1], v0 = p0 / 8, v1 = p1 / 8; const A = (pp, cc, yy) => (axis === 'z' ? [cc, yy, pp] : [pp, yy, cc]); q.quad(A(p0, c - w / 2, y(p0) + lift), A(p1, c - w / 2, y(p1) + lift), A(p1, c + w / 2, y(p1) + lift), A(p0, c + w / 2, y(p0) + lift), [0, 1, 0], [[u0, v0], [u0, v1], [u1, v1], [u1, v0]]); } };
  // US dashes: 3 m of line, 9 m of gap, kept out of the given stretches.
  const dashes = (q, axis, a, b, c, y, skip = []) => { for (const [s0, s1] of without(a, b, skip)) for (let p = Math.ceil(s0 / 12) * 12; p < s1 - 0.5; p += 12) line(q, axis, p, Math.min(s1, p + 3), c, 0.11, y); };
  // A Chicago "ladder" crosswalk, fresh thermoplastic: a bar along each edge and rungs between, in line with the traffic.
  // `axis` is the way people walk across it; [a, b] its length across the street, [c0, c1] its width.
  const ladder = (axis, a, b, c0, c1, y) => { line(paintW, axis, a, b, c0 + 0.15, 0.3, y, true); line(paintW, axis, a, b, c1 - 0.15, 0.3, y, true); for (let p = a + 0.35; p < b - 0.5; p += 1.5) { const pe = Math.min(b - 0.3, p + 0.6); line(paintW, axis === 'z' ? 'x' : 'z', c0 + 0.3, c1 - 0.3, (p + pe) / 2, pe - p, () => y(p), true, 0.0062); } };
  // A stop bar across a..b at c.
  const bar = (axis, a, b, c, y) => line(paintW, axis, a, b, c, 0.45, y, true);
  // Wet tracks down a lane.
  const tracks = (axis, a, b, c, y) => strip(trackG, axis, a, b, c - TRACK_W / 2, c + TRACK_W / 2, y, 0.0055, 0, 8, 0, 1, [0, 1], breaks);
  // Manholes, seams, sealed cracks and patches down a carriageway: `lanes` the lane centres, `gapsAt` where a cover can lie clear of the tracks.
  const wear = (axis, a, b, lanes, gapsAt, y, seed, skip = []) => {
    for (const [s0, s1] of without(a, b, skip)) {
      // covers, in the gaps between the tracks and clear of the dashes
      for (let p = s0 + 8 + hash(seed, s0) * 20; p < s1 - 6; p += 34 + hash(p, seed) * 26) { const c = gapsAt[(hash(seed, p, 2) * gapsAt.length) | 0], pp = Math.floor(p / 12) * 12 + 7.5; if (pp > s0 + 2 && pp < s1 - 2) fixture(fixG, axis, pp, c, 0.78, 0.78, y(pp) + 0.007, FIX.manhole); }
      // sealed cracks across a lane or two
      for (let p = s0 + hash(s0, seed, 4) * 9; p < s1 - 2; p += 7 + hash(p, seed, 5) * 16) { const i = (hash(p, seed, 6) * lanes.length) | 0, span = 1.4 + hash(seed, p, 7) * 2.2, c = lanes[i] + (hash(p, p, 8) - 0.5) * 1.2; strip(roadMk, axis === 'z' ? 'x' : 'z', c - span, c + span, p - 0.35, p + 0.35, () => y(p), 0.005, 1, 5, hash(p, 1, 9)); }
      // a seam where two passes of the paver met, beside the lane lines, in lengths
      for (const c of lanes.slice(0, -1).map((l, i) => (l + lanes[i + 1]) / 2 + 0.4)) for (let p = s0; p < s1 - 4; p += 30 + hash(p, c, 10) * 40) strip(roadMk, axis, p, Math.min(s1, p + 14 + hash(c, p, 11) * 30), c - 0.25, c + 0.25, y, 0.0048, 0, 6, 0, 4, [0, 1], breaks);
      // patches where the road was dug up
      for (let p = s0 + 15 + hash(seed, s0, 12) * 25; p < s1 - 4; p += 45 + hash(p, seed, 13) * 50) { const c = lanes[(hash(p, seed, 14) * lanes.length) | 0] + (hash(seed, p, 15) - 0.5) * 2, l = 1.6 + hash(p, 2, 16) * 2.6, w = 0.9 + hash(p, 3, 17) * 1.1; strip(roadMk, axis, p, Math.min(s1, p + l), c - w / 2, c + w / 2, y, 0.0046, 3, l, 0, 4, [0, 1], breaks); }
    }
  };
  // Marks on a pavement: slush and salt along the kerb, packed snow along the outer edge, trails of footprints, salt.
  const walkMarks = (axis, a, b, kerbC, outerC, y, seed, outerSnow = true) => {
    const dir = Math.sign(outerC - kerbC), W = Math.abs(outerC - kerbC);
    // (each column of the atlas is 256 px across and 1024 along: `len` keeps a print or a ring its own shape)
    strip(walkMk, axis, a, b, kerbC, kerbC + dir * 0.75, y, 0.011, 0, 3.2, hash(seed, 1), 4, [0, 1], breaks);
    if (outerSnow && W > 2) { const w = Math.min(1.0, W * 0.25); strip(walkMk, axis, a, b, outerC - dir * w, outerC, y, 0.0105, 1, w * 4.5, hash(seed, 2), 4, [0, 1], breaks); }
    for (let p = a + hash(seed, a) * 6; p < b - 3; p += 5 + hash(p, seed) * 12) { const l = 4 + hash(seed, p, 3) * 16, c = kerbC + dir * (0.9 + hash(p, seed, 4) * Math.max(0.2, W - 1.8)); strip(walkMk, axis, p, Math.min(b, p + l), c - 0.24, c + 0.24, y, 0.0115, 2, 1.9, hash(p, 5), 4, [0, 1], breaks); }
    for (let p = a + hash(seed, a, 6) * 20; p < b - 2; p += 14 + hash(p, seed, 7) * 30) { const c = kerbC + dir * (0.6 + hash(p, seed, 8) * Math.max(0.2, W - 1.5)); strip(walkMk, axis, p, Math.min(b, p + 1.2), c - 0.6, c + 0.6, y, 0.0112, 3, 4.8, hash(p, 9), 4, [0, 1], breaks); }
  };
  // A pad of yellow domes behind a kerb ramp, squares of 0.6 m along the kerb from c0 to c1, at c across.
  const pads = (axis, c0, c1, c, y) => { const n = Math.max(1, Math.round((c1 - c0) / 0.6)), w = (c1 - c0) / n; for (let i = 0; i < n; i++) fixture(fixG, axis, c0 + w * (i + 0.5), c, w, 0.6, y(c0 + w * (i + 0.5)) + 0.0125, FIX.tactile); };
  const grate = (x, z, y) => fixture(fixG, 'z', z, x, 1.2, 1.2, y + 0.012, FIX.tree);
  const drainsAlong = (a, b, avoid, every = 28) => { const out = []; for (let p = a + 9; p < b - 4; p += every) if (!avoid.some(([c0, c1]) => p > c0 - 2 && p < c1 + 2)) out.push(p); return out; };
  const rampsOf = xs => xs.map(([u, v]) => { const m = (u + v) / 2, h = Math.min(1.6, (v - u) / 2 - 0.2); return [m - h, m + h]; });

  // ---- Michigan Avenue. Its crossings: at Monroe (both legs), Adams (the museum's door) and Jackson (both legs).
  const XW = [[MO.z0 - 4.0, MO.z0 - 0.8], [MO.z1 + 0.8, MO.z1 + 4.0], [cz - 2.8, cz + 2.8], [JA.z0 - 4.0, JA.z0 - 0.8], [JA.z1 + 0.8, JA.z1 + 4.0]];
  const MR = rampsOf(XW), busStop = [56, 76];
  // The far side: a wide pavement in front of the shops, its kerb, and its ramps.
  { const a = B.z0 - 30, b = B.z1 + 30;
    slabs(slabG, 'z', a, b, M.x0 - 0.12, M.x0 - 7, lvl(AV));
    K.run({ axis: 'z', at: M.x0, a, b, side: -1, y: lvl(AV), cuts: MR, drains: drainsAlong(a, b, MR) });
    for (const [r0, r1] of MR) pads('z', r0, r1, M.x0 - 0.12 - 0.32, lvl(AV));
    walkMarks('z', a, b, M.x0 - 0.12, M.x0 - 7, lvl(AV), 31);
    paved({ x0: M.x0 - 8, x1: M.x0, z0: B.z0, z1: B.z1 }); }
  // The museum's side: from the kerb to the foot of the terrace, broken by the mouths of the two side streets.
  { for (const [a, b] of [[B.z0, MO.z0], [MO.z1, JA.z0], [JA.z1, B.z1]]) {
      slabs(slabG, 'z', a, b, M.x1 + 0.12, SX, lvl(AV));
      const cuts = MR.filter(([u, v]) => u > a && v < b);
      K.run({ axis: 'z', at: M.x1, a: a === B.z0 ? a : a - 0.12, b: b === B.z1 ? b : b + 0.12, side: 1, y: lvl(AV), cuts, drains: drainsAlong(a, b, [...cuts, busStop]), clear: [busStop] });
      for (const [r0, r1] of cuts) pads('z', r0, r1, M.x1 + 0.12 + 0.32, lvl(AV));
      walkMarks('z', a, b, M.x1 + 0.12, SX - 0.9, lvl(AV), 41 + a, false);
    }
    for (const t of G.trees) if (t.x > M.x1 && t.x < SX) grate(t.x, t.z, AV);
    // The kerbs round the mouths of Monroe and Jackson, climbing with them to the museum's level, ramped for the crosswalk over each.
    for (const st of [MO, JA]) for (const [zk, side] of [[st.z0, -1], [st.z1, 1]]) {
      const cut = [[M.x1 + 1.4, M.x1 + 3.8]], y = yOn(zk + side * 0.5);
      K.run({ axis: 'x', at: zk, a: M.x1 + 0.12, b: SX + 12, side, y, cuts: cut, drains: [SX + 9] });
      pads('x', cut[0][0], cut[0][1], zk + side * 0.44, y);
    }
  }
  // The avenue's lane lines. Southbound (west of the median) two lanes with a parking lane along the far kerb; northbound
  // two lanes to the museum's kerb, the kerb lane the buses'. Laid to traffic.js's lanes: a dash midway between each pair.
  { const a = B.z0 - 120, b = B.z1 + 120, y = lvl(AV), sb = TL.ns.mich[1], nb = TL.ns.mich[-1], MEDIAN = -12.6;
    const skip = [[MO.z0 - STOP_BACK - 0.4, MO.z1 + STOP_BACK + 0.4], [cz - 4.8, cz + 4.8], [JA.z0 - STOP_BACK - 0.4, JA.z1 + STOP_BACK + 0.4]];
    dashes(paintW, 'z', a, b, (sb[0] + sb[1]) / 2, y, skip); dashes(paintW, 'z', a, b, (nb[0] + nb[1]) / 2, y, skip);
    for (const [s0, s1] of without(a, b, skip)) line(paintW, 'z', s0, s1, M.x0 + 2.2, 0.1, y);                       // the parking lane's edge
    for (const [s0, s1] of without(a, b, [[B.z0, B.z1], ...skip])) for (const d of [-0.15, 0.15]) line(paintY, 'z', s0, s1, MEDIAN + d, 0.1, y);      // past the planted median, a double yellow
    for (const [z0, z1] of XW) ladder('x', M.x0 + 0.3, M.x1 - 0.3, z0, z1, y);
    bar('x', -11.6, M.x1 - 0.3, cz + 4.4, y); bar('x', M.x0 + 2.3, -13.6, cz - 4.4, y);                              // stop bars at Adams (the rest are traffic.js's)
    for (const zz of [busStop[0] + 1, busStop[1] - 1]) line(paintW, 'x', (nb[0] + nb[1]) / 2 + 0.2, M.x1 - 0.5, zz, 0.15, y);     // the bus stop's box
    for (const x of [...sb, ...nb]) tracks('z', a, b, x, y);
    const xing = [[MO.z0 - 1, MO.z1 + 5], [cz - 3, cz + 3], [JA.z0 - 5, JA.z1 + 1]];
    wear('z', a, b, [...sb].sort((u, v) => u - v), [(sb[0] + sb[1]) / 2 + 0.15], y, 1, xing);
    wear('z', a, b, [...nb].sort((u, v) => u - v), [(nb[0] + nb[1]) / 2 - 0.15], y, 2, xing);
    for (const d of [-1, 1]) strip(roadMk, 'z', a, b, MEDIAN + d * 0.8, MEDIAN + d * 1.7, y, 0.0045, 2, 9, 0.3, 4, [0, 0.7], breaks);     // salt along the median's kerbs
  }

  // ---- Monroe Street and Jackson Drive: a pavement each side as far as the Drive (not across the open railway cutting,
  // where there is only the balustrade, nor across the mouth of Columbus Drive), a double yellow down the middle.
  const cutOpen = plan.cut ? plan.cut.open.map(s => [s.z0, s.z1]) : [];
  const overCut = (z0, z1) => cutOpen.some(([a, b]) => z1 > a && z0 < b);
  const crossX = [[C.x0 - 4.2, C.x0 - 1.0], [C.x1 + 1.0, C.x1 + 4.2], ...(LSD ? [[LSD.x0 - 3.2, LSD.x0 - 0.6]] : [])];
  const XR = rampsOf(crossX);
  const sidewalk = (z0, z1, kerbZ, inner) => {
    const side = Math.sign((z0 + z1) / 2 - kerbZ), outer = side > 0 ? z1 : z0;
    let runs = overCut(z0, z1) ? [[SX + 12, R.x0 - 0.4], [R.x1 + 0.4, east]] : [[SX + 12, east]];
    if (inner) runs = runs.flatMap(([a, b]) => without(a, b, [[C.x0 - 5.2, C.x1]]));          // Columbus's own pavements turn the corner
    for (const [xa, xb] of runs) {
      slabs(slabG, 'x', xa, xb, kerbZ + side * 0.12, outer, lvl(0));
      const rc = XR.filter(([u, v]) => u > xa && v < xb);
      K.run({ axis: 'x', at: kerbZ, a: xa, b: xb, side, y: lvl(0), cuts: rc, drains: drainsAlong(xa, xb, rc, 31) });
      for (const [r0, r1] of rc) pads('x', r0, r1, kerbZ + side * 0.44, lvl(0));
      walkMarks('x', xa, xb, kerbZ + side * 0.12, outer, lvl(0), 51 + kerbZ, !inner);
      paved({ x0: xa, x1: xb, z0, z1 });
    }
  };
  sidewalk(MO.z0 - 4, MO.z0, MO.z0, false); sidewalk(MO.z1, MO.z1 + 2.2, MO.z1, true); sidewalk(JA.z0 - 2.2, JA.z0, JA.z0, true); sidewalk(JA.z1, JA.z1 + 4, JA.z1, false);
  for (const st of [MO, JA]) {
    const zc = (st.z0 + st.z1) / 2, y = yOn(zc), x0 = M.x1 + STOP_BACK + 0.6, x1 = LSD ? LSD.x0 : east;
    const skip = [[C.x0 - STOP_BACK - 0.4, C.x1 + STOP_BACK + 0.4], [x1 - STOP_BACK - 0.4, x1]];
    for (const [s0, s1] of without(x0, x1, skip)) for (const d of [-0.15, 0.15]) line(paintY, 'x', s0, s1, zc + d, 0.1, y);
    for (const [a, b] of crossX) ladder('z', st.z0 + 0.3, st.z1 - 0.3, a, b, () => 0);
    ladder('z', st.z0 + 0.3, st.z1 - 0.3, M.x1 + 1.0, M.x1 + 4.2, () => AV);
    for (const d of [-1, 1]) tracks('x', M.x1, x1, zc + d * TL.ew, y);
    wear('x', M.x1 + 6, x1 - 2, [zc - TL.ew, zc + TL.ew], [zc - 4.3, zc + 4.3], y, 3 + zc, [[C.x0 - 5, C.x1 + 5]]);
  }
  // Columbus Drive: its pavements, a kerb each side ramped at the corners, a bike lane each side, one lane each way.
  { const zA = MO.z1, zB = JA.z0, XC = [[MO.z1 + 0.6, MO.z1 + 3.8], [JA.z0 - 3.8, JA.z0 - 0.6]], CR = rampsOf(XC), y = lvl(0);
    slabs(slabG, 'z', MO.z1 + 2.2, JA.z0 - 2.2, C.x1 + 0.12, C.x1 + 2.6, y); paved({ x0: C.x1, x1: C.x1 + 2.6, z0: MO.z1, z1: JA.z0 });
    walkMarks('z', MO.z1 + 2.2, JA.z0 - 2.2, C.x1 + 0.12, C.x1 + 2.6, y, 61, false);
    for (const [x, side] of [[C.x0, -1], [C.x1, 1]]) {
      K.run({ axis: 'z', at: x, a: side < 0 ? zA - 0.12 : zA, b: side < 0 ? zB + 0.12 : zB, side, y, cuts: CR, drains: drainsAlong(zA, zB, CR, 33) });
      for (const [r0, r1] of CR) pads('z', r0, r1, x + side * 0.44, y);
    }
    walkMarks('z', zA, zB, C.x0 - 0.12, C.x0 - 5.2, y, 71, false);
    // the west pavement's corners, where it meets Monroe's and Jackson's, ramped for the crosswalk over each
    for (const [zk, side] of [[MO.z1, 1], [JA.z0, -1]]) { const cut = rampsOf([[C.x0 - 4.2, C.x0 - 1.0]]); K.run({ axis: 'x', at: zk, a: C.x0 - 5.2, b: C.x0 - 0.12, side, y, cuts: cut }); pads('x', cut[0][0], cut[0][1], zk + side * 0.44, y); }
    for (const t of G.trees) if (Math.abs(t.x - (C.x0 - 1.4)) < 0.3) grate(t.x, t.z, 0);
    for (const t of G.trees) if (Math.abs(t.z - (MO.z1 + 1.3)) < 0.2 || Math.abs(t.z - (JA.z0 - 1.3)) < 0.2) grate(t.x, t.z, 0);
    const c1 = TL.ns.col[1][0], c2 = TL.ns.col[-1][0];
    for (const x of [C.x0 + 2.0, C.x1 - 2.0]) line(paintW, 'z', zA + STOP_BACK + 0.4, zB - STOP_BACK - 0.4, x, 0.12, y);       // the bike lanes' lines
    for (const d of [-0.15, 0.15]) line(paintY, 'z', 103, 117, (C.x0 + C.x1) / 2 + d, 0.1, y);                                 // through the median's gap at the east door
    for (const [z0, z1] of XC) ladder('x', C.x0 + 0.3, C.x1 - 0.3, z0, z1, y);
    for (const x of [c1, c2]) tracks('z', zA, zB, x, y);
    wear('z', zA + 2, zB - 2, [c1], [c1 + 2.7], y, 5); wear('z', zA + 2, zB - 2, [c2], [c2 - 2.7], y, 6);
  }
  // Lake Shore Drive: four 3.5 m lanes a side, a white edge line at the kerb, yellow at the median, and the traffic's tracks.
  if (LSD) { const a = B.z0 - 120, b = B.z1 + 120, y = lvl(0), skip = [[MO.z0 - 1, MO.z1 + 1], [JA.z0 - 1, JA.z1 + 1]];
    for (const [c0, c1, dirn] of [[LSD.x0, LSD.med[0], 1], [LSD.x1, LSD.med[1], -1]]) {
      const lane = k => c0 + dirn * (0.25 + 3.5 * k);
      for (let k = 1; k < 4; k++) dashes(paintW, 'z', a, b, lane(k), y, skip);
      for (const [s0, s1] of without(a, b, dirn > 0 ? skip : [])) line(paintW, 'z', s0, s1, lane(0), 0.12, y);
      line(paintY, 'z', a, b, c1 - dirn * 0.3, 0.12, y);
    }
    for (const x of [...TL.ns.lsd[1], ...TL.ns.lsd[-1]]) tracks('z', a, b, x, y);
    // Its kerbs, granite like every other street's: the field side, open where Monroe and Jackson come in; both edges
    // of the median; the promenade side. (They were plain boxes, with nothing on top for a wheel, and across both mouths.)
    { const k0 = B.z0, k1 = B.z1, mouths = [[MO.z0, MO.z1], [JA.z0, JA.z1]];
      for (const [s0, s1] of without(k0, k1, mouths)) K.run({ axis: 'z', at: LSD.x0, a: s0, b: s1, side: -1, y, drains: drainsAlong(s0, s1, [], 41) });
      K.run({ axis: 'z', at: LSD.med[0], a: k0, b: k1, side: 1, y, gutter: true, drains: drainsAlong(k0, k1, [], 43) });
      K.run({ axis: 'z', at: LSD.med[1], a: k0, b: k1, side: -1, y, gutter: true, drains: drainsAlong(k0, k1, [], 47) });
      K.run({ axis: 'z', at: LSD.x1, a: k0, b: k1, side: 1, y, drains: drainsAlong(k0, k1, [], 53) }); }
    wear('z', a, b, [...TL.ns.lsd[1]].sort((u, v) => u - v), [LSD.x0 + 7.25], y, 7, skip); wear('z', a, b, [...TL.ns.lsd[-1]].sort((u, v) => u - v), [LSD.x1 - 7.25], y, 8, skip);
  }

  // The wall of shopfronts along the far side of the avenue.
  {
    const shop = canvasTex(512, 512, (c, w, h) => {
      c.fillStyle = '#0c0f16'; c.fillRect(0, 0, w, h);
      // upper storeys: rows of windows, some lit
      let s = 7; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
      for (let y = 14; y < 360; y += 34) for (let x = 12; x < w - 20; x += 31) { c.fillStyle = rnd() < 0.42 ? `rgba(255,${200 + rnd() * 30 | 0},${130 + rnd() * 50 | 0},${0.5 + rnd() * 0.5})` : '#141a26'; c.fillRect(x, y, 18, 22); }
      c.fillStyle = '#1b1e26'; c.fillRect(0, 372, w, 12);              // a cornice over the shops
      // the shops: big lit windows between piers, an awning or two, a door
      for (let i = 0; i < 4; i++) { const x = i * 128; c.fillStyle = '#20232b'; c.fillRect(x, 384, 128, 128); c.fillStyle = ['#f3d9a0', '#e9e2cf', '#f0c986', '#dfe7ee'][i]; c.fillRect(x + 10, 404, 108, 86); c.fillStyle = '#0c0f16'; c.fillRect(x + 62, 404, 4, 86); c.fillStyle = ['#7a1f1f', '#1f3d6a', '#234a2c', '#3a3a3a'][i]; c.fillRect(x + 6, 388, 116, 16); }
    });
    shop.wrapS = THREE.RepeatWrapping; const len = B.z1 - B.z0 + 60, H = 30; shop.repeat.set(len / 24, 1);
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(len, H), new THREE.MeshBasicMaterial({ map: shop, color: new THREE.Color(0.3, 0.3, 0.34) }));
    wall.rotation.y = Math.PI / 2; wall.position.set(M.x0 - 7, AV + H / 2, (B.z0 + B.z1) / 2); extra.push(wall);
    const top = new THREE.Mesh(new THREE.PlaneGeometry(len, 24), mat.dark); top.rotation.set(-Math.PI / 2, 0, Math.PI / 2);      // (its length along the avenue, not across it and over the museum) top.position.set(M.x0 - 19, AV + H, (B.z0 + B.z1) / 2); extra.push(top);
  }
  // ------------------------------------------------------------------ medians
  // A raised planter down the middle: stone kerb, soil, clipped evergreens, a small bare tree now and then, snow lying on it.
  const twig = []; const treeAt = (x, y, z, s = 1) => { (G.medianTrees || (G.medianTrees = [])).push({ x, y, z }); if (plan.dress) return;      // (a small crabapple or hawthorn of trees.js's stands in each pit now; the sticks below only without it)
    const k = (r0, r1, len, rx, rz, yy) => { const c = new THREE.CylinderGeometry(r1, r0, len, 5); c.translate(0, len / 2, 0); c.rotateX(rx); c.rotateZ(rz); c.scale(s, s, s); c.translate(x, y + yy * s, z); twig.push(c); }; k(0.07, 0.045, 1.5, 0, 0, 0); for (let i = 0; i < 5; i++) { const a = i * 1.26 + x; k(0.035, 0.012, 1.3, Math.cos(a) * 0.7, Math.sin(a) * 0.7, 1.35); } };
  const median = (along, a, b, c, hw, y) => {
    const KH = 0.2, box = (q, p0, p1, y0, y1, w) => along === 'z' ? q.box(c - w, c + w, y0, y1, p0, p1) : q.box(p0, p1, y0, y1, c - w, c + w);
    const rect = (p0, p1, w) => along === 'z' ? { x0: c - w, x1: c + w, z0: p0, z1: p1 } : { x0: p0, x1: p1, z0: c - w, z1: c + w };
    box(g.stone, a, b, y, y + KH, hw); box(g.snow, a + 0.12, b - 0.12, y + KH, y + KH + 0.05, hw - 0.12);
    // The kerb is a step too tall to drive up but not to jump: its snow is a top to land on, and drive along beside the hedge.
    { const k = rect(a, b, hw); landable(plan, k.x0, k.x1, k.z0, k.z1, y + KH + 0.05, y); }
    // One clipped hedge the length of the planter, broken only by a pit of open soil round each tree.
    const pits = [];
    for (let p = a + 1.4, i = 0; p < b - 1.2; p += 2.6, i++) if (i % 4 === 3) {
      along === 'z' ? treeAt(c, y + KH, p, 1) : treeAt(p, y + KH, c, 1); pits.push(p);
      const t = rect(p - 0.08, p + 0.08, 0.08); ob(t.x0, t.x1, t.z0, t.z1, y + KH, y + KH + 1.5);      // the trunk
    }
    const runs = []; let p0 = a + 0.6;
    for (const p of pits) { runs.push([p0, p - 0.9]); p0 = p + 0.9; }
    runs.push([p0, b - 0.6]);
    // Its clipped top can be landed on and driven along, like every hedge in the grounds: solid from the side, a top as drawn.
    const HY = y + KH + 0.03, HH = 0.55;
    for (const q of frostHedges(frost, runs.filter(([u, v]) => v - u > 0.8).map(([u, v]) => rect(u, v, hw - 0.28)), HY, HH)) landable(plan, q.x0, q.x1, q.z0, q.z1, HY + HH + 0.02, y, 0.05);
  };
  const gaps = (a, b, holes) => { const out = []; let p = a; for (const [h0, h1] of holes.sort((u, v) => u[0] - v[0])) { if (h0 - p > 3) out.push([p, h0]); p = Math.max(p, h1); } if (b - p > 3) out.push([p, b]); return out; };
  for (const [a, b] of gaps(B.z0, B.z1, [[MO.z0 - 4, MO.z1 + 6], [cz - 6, cz + 6], [JA.z0 - 6, JA.z1 + 4]])) median('z', a, b, -12.6, 0.8, AV);
  const cmid = (C.x0 + C.x1) / 2;
  for (const [a, b] of gaps(MO.z1, JA.z0, [[MO.z1, MO.z1 + 6], [103, 117], [JA.z0 - 6, JA.z0]])) median('z', a, b, cmid, 0.8, 0);

  // ------------------------------------------------------------------ signals and street names
  const blade = name => canvasTex(256, 48, (c, w, h) => { c.fillStyle = '#0d6b3a'; c.fillRect(0, 0, w, h); c.strokeStyle = '#e9efe9'; c.lineWidth = 3; c.strokeRect(2, 2, w - 4, h - 4); c.fillStyle = '#f2f5f0'; fitText(c, name, { x: w / 2, y: h / 2 + 1, w: w - 20, h: h - 14, px: 30, weight: '600', family: SANS }); });
  const blades = {}; const bladeMat = n => blades[n] || (blades[n] = new THREE.MeshBasicMaterial({ map: blade(n), color: new THREE.Color(0.85, 0.85, 0.85) }));
  // A head: a black box with three lamps, one lit. Faces along `ax` ('x' or 'z') in direction `dir`.
  const head = (x, y, z, ax, dir, lit) => {
    return;                                              // the working heads are traffic.js's; these poles carry the street names only
    const t = 0.13, w = 0.17;
    ax === 'z' ? g.black.box(x - w, x + w, y, y + 0.96, z - t, z + t) : g.black.box(x - t, x + t, y, y + 0.96, z - w, z + w);
    ['R', 'A', 'G'].forEach((c, i) => { const q = c === lit ? g['lamp' + c] : c === 'A' ? g.lampA : g.dark, yy = y + 0.96 - 0.17 - i * 0.31, f = dir * (t + 0.015);
      ax === 'z' ? q.box(x - 0.09, x + 0.09, yy - 0.09, yy + 0.09, z + f - 0.01, z + f + 0.01) : q.box(x + f - 0.01, x + f + 0.01, yy - 0.09, yy + 0.09, z - 0.09, z + 0.09); });
  };
  // A pole at (x, z) with a mast arm reaching `reach` along `ax` (sign gives which way), and its heads facing `dir` along the other... the traffic it governs.
  const signal = (x, z, armAx, reach, faceAx, faceDir, lit, names) => {
    const y = streetY(plan, x, z), HT = 4.7;
    g.black.box(x - 0.09, x + 0.09, y, y + HT, z - 0.09, z + 0.09); g.black.box(x - 0.16, x + 0.16, y, y + 0.5, z - 0.16, z + 0.16);
    const a0 = Math.min(0, reach), a1 = Math.max(0, reach);
    void a0; void a1;                                    // no mast arm: nothing hangs from it
    for (const f of [0.55, 0.95]) { const hx = armAx === 'x' ? x + reach * f : x, hz = armAx === 'z' ? z + reach * f : z; head(hx, y + HT - 1.2, hz, faceAx, faceDir, lit); }
    head(x + (faceAx === 'x' ? faceDir * 0.24 : 0), y + 2.6, z + (faceAx === 'z' ? faceDir * 0.24 : 0), faceAx, faceDir, lit);
    names.forEach((n, i) => { const m = twoFaced(new THREE.PlaneGeometry(1.25, 0.24), bladeMat(n)); m.position.set(x + (i ? 0 : 0.72), y + 4.0 + i * 0.3, z + (i ? 0.72 : 0)); if (i) m.rotation.y = Math.PI / 2; extra.push(m); });
    ob(x - 0.1, x + 0.1, z - 0.1, z + 0.1, y, y + HT);
  };
  // Michigan Avenue: at each crossing, one pole on the museum's kerb (arm out over the northbound lanes, facing south)
  // and one on the far kerb (arm over the southbound, facing north).
  [[MO.z1 + 5.2, MO.z0 - 1.6, 'Monroe St', 'G'], [cz + 5.2, cz - 5.2, 'Adams St', 'A'], [JA.z1 + 1.6, JA.z0 - 5.2, 'Jackson Dr', 'G']].forEach(([zn, zs, name, lit]) => {
    signal(M.x1 + 0.6, zn, 'x', -7.5, 'z', 1, lit, ['Michigan Av', name]);
    signal(M.x0 - 0.6, zs, 'x', 7.5, 'z', -1, lit, ['Michigan Av', name]);
  });
  // Columbus Drive: northbound held short of Monroe, southbound short of Jackson.
  signal(C.x1 + 0.7, MO.z1 + 4.4, 'x', -6.5, 'z', 1, 'G', ['Columbus Dr', 'Monroe St']);
  signal(C.x0 - 0.7, JA.z0 - 4.4, 'x', 6.5, 'z', -1, 'G', ['Columbus Dr', 'Jackson Dr']);

  // ------------------------------------------------------------------ small furniture
  // Benches and bins are streetscape.js's (the same in the parks), solid as drawn.
  const PF = new ParkFurniture(plan);
  const bin = (x, z) => PF.bin(x, streetY(plan, x, z), z);
  // (Each is noted in plan.hydrants with where its boxes begin in the two merged meshes: a hard enough knock breaks one open, and
  // src/hydrants.js cuts it down to a stub there. Drawn as before until then, in the same two meshes as everything else red or snowed on.
  // `ew`: its pavement runs east and west, not north and south; what is knocked off one is kept to the pavement, out of the traffic.)
  plan.hydrants = [];
  const hydrant = (x, z, ew = false) => { const y = streetY(plan, x, z), red = g.red.p.length / 3, snow = g.snow.p.length / 3; g.red.box(x - 0.11, x + 0.11, y, y + 0.55, z - 0.11, z + 0.11); g.red.box(x - 0.15, x + 0.15, y + 0.55, y + 0.62, z - 0.15, z + 0.15); g.red.box(x - 0.07, x + 0.07, y + 0.62, y + 0.72, z - 0.07, z + 0.07); g.red.box(x - 0.2, x + 0.2, y + 0.32, y + 0.44, z - 0.06, z + 0.06); g.snow.box(x - 0.08, x + 0.08, y + 0.72, y + 0.76, z - 0.08, z + 0.08); ob(x - 0.15, x + 0.15, z - 0.15, z + 0.15, y, y + 0.75); plan.hydrants.push({ x, y, z, ew, ob: O[O.length - 1], red, snow }); };
  const bollard = (x, z) => { const y = streetY(plan, x, z); g.black.box(x - 0.09, x + 0.09, y, y + 0.9, z - 0.09, z + 0.09); g.black.box(x - 0.12, x + 0.12, y + 0.78, y + 0.84, z - 0.12, z + 0.12); g.snow.box(x - 0.08, x + 0.08, y + 0.9, y + 0.94, z - 0.08, z + 0.08); ob(x - 0.1, x + 0.1, z - 0.1, z + 0.1, y, y + 0.92); };
  const paybox = (x, z) => { const y = streetY(plan, x, z); g.black.box(x - 0.05, x + 0.05, y, y + 1.0, z - 0.05, z + 0.05); g.steel.box(x - 0.17, x + 0.17, y + 1.0, y + 1.55, z - 0.13, z + 0.13); g.glow.box(x - 0.1, x + 0.1, y + 1.3, y + 1.45, z + 0.13, z + 0.14); g.glow.box(x - 0.1, x + 0.1, y + 1.3, y + 1.45, z - 0.14, z - 0.13); g.snow.box(x - 0.17, x + 0.17, y + 1.55, y + 1.6, z - 0.13, z + 0.13); ob(x - 0.17, x + 0.17, z - 0.13, z + 0.13, y, y + 1.6); };
  const newsbox = (x, z, q) => { const y = streetY(plan, x, z); q.box(x - 0.22, x + 0.22, y + 0.12, y + 1.05, z - 0.2, z + 0.2); g.black.box(x - 0.18, x + 0.18, y, y + 0.12, z - 0.16, z + 0.16); g.dark.box(x - 0.23, x - 0.221, y + 0.6, y + 0.95, z - 0.15, z + 0.15); g.snow.box(x - 0.22, x + 0.22, y + 1.05, y + 1.1, z - 0.2, z + 0.2); ob(x - 0.22, x + 0.22, z - 0.2, z + 0.2, y, y + 1.1); };
  // A bench, its front facing (fx, fz). A toy car goes under its seat, between its ends, or hops up onto it.
  const bench = (x, z, fx, fz) => PF.bench(x, streetY(plan, x, z), z, fx, fz);
  // A sign on a post: white plate, a word or two.
  const plateTex = {}; const plate = (lines, col) => plateTex[lines.join()] || (plateTex[lines.join()] = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.8, 0.8, 0.8), map: canvasTex(128, 160, (c, w, h) => { c.fillStyle = '#f1efe8'; c.fillRect(0, 0, w, h); c.strokeStyle = col; c.lineWidth = 6; c.strokeRect(5, 5, w - 10, h - 10); c.fillStyle = col; const step = Math.min(32, 132 / lines.length); lines.forEach((t, i) => fitText(c, t, { x: w / 2, y: h / 2 + (i - (lines.length - 1) / 2) * step, w: w - 26, h: step - 4, px: 26, weight: '700', family: SANS })); }) }));
  const sign = (x, z, lines, col, facing) => { const y = streetY(plan, x, z); g.steel.box(x - 0.03, x + 0.03, y, y + 2.5, z - 0.03, z + 0.03); const m = twoFaced(new THREE.PlaneGeometry(0.46, 0.58), plate(lines, col)); m.position.set(x + (facing === 'x' ? 0.04 : 0), y + 2.2, z + (facing === 'z' ? 0.04 : 0)); if (facing === 'x') m.rotation.y = Math.PI / 2; extra.push(m); ob(x - 0.04, x + 0.04, z - 0.04, z + 0.04, y, y + 2.5); };
  // A parked car under the night's snow (parked.js), pointing (fx, fz) with the kerb on its right.
  const PK = new ParkedCars(plan);
  const parked = (x, z, fx, fz, opts) => PK.add(x, streetY(plan, x, z), z, fx, fz, opts);
  // A rack of hoops, and bikes.
  const wheel = []; const bike = (x, y, z, q) => { for (const d of [-0.52, 0.52]) { const t = new THREE.TorusGeometry(0.31, 0.022, 5, 14); t.rotateY(Math.PI / 2); t.translate(x, y + 0.33, z + d); wheel.push(t); } q.box(x - 0.025, x + 0.025, y + 0.5, y + 0.58, z - 0.5, z + 0.5); q.box(x - 0.025, x + 0.025, y + 0.33, y + 0.9, z - 0.16, z - 0.1); q.box(x - 0.025, x + 0.025, y + 0.33, y + 1.0, z + 0.44, z + 0.5); g.black.box(x - 0.22, x + 0.22, y + 0.98, y + 1.02, z + 0.44, z + 0.5); g.black.box(x - 0.07, x + 0.07, y + 0.9, y + 0.95, z - 0.26, z - 0.02); };

  // A bus shelter: four black posts and a flat roof with a strip light under it; toughened glass in aluminium frames
  // across the back (at x = `back`) and both ends, open along the kerb. The end at z = `ad` is a lit advertising case,
  // and a route map hangs inside on the back. What stops a car is what is drawn: every pane, frame and case is solid
  // exactly where it stands, and nothing else is. The glass is drawn so it reads at night: a pale tint, the frame round
  // it, a frosted band at eye height, a glint along its edges and a streak of reflection across each pane. The roof is
  // a top to land on.
  const posters = {}, posterMat = k => posters[k] || (posters[k] = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.92, 0.92, 0.92), side: THREE.DoubleSide, map: canvasTex(256, k === 'map' ? 352 : 402, (c, w, h) => {
    const text = (t, y, px, col = '#f6f1e4', wt = 800) => { c.fillStyle = col; c.font = `${wt} ${px}px Helvetica, Arial, sans-serif`; c.textAlign = 'center'; c.fillText(t, w / 2, y); };
    if (k === 'map') {                                                // the route map: streets, the lake, the lines, you are here
      c.fillStyle = '#eef0ea'; c.fillRect(0, 0, w, h); c.fillStyle = '#1f4f9a'; c.fillRect(0, 0, w, 46); text('ROUTE MAP', 31, 24);
      c.fillStyle = '#a9c6dc'; c.fillRect(196, 46, 60, h - 46);
      c.strokeStyle = '#c9cbc4'; c.lineWidth = 3; for (let x = 18; x < 196; x += 30) { c.beginPath(); c.moveTo(x, 46); c.lineTo(x, h); c.stroke(); } for (let y = 64; y < h; y += 30) { c.beginPath(); c.moveTo(0, y); c.lineTo(196, y); c.stroke(); }
      c.fillStyle = '#9fc59a'; c.fillRect(110, 150, 70, 120);
      c.lineWidth = 7; c.lineJoin = 'round'; [['#c4302b', [[48, 46], [48, 214], [168, 214], [168, h]]], ['#2f8a4c', [[78, h], [78, 124], [138, 124], [138, 46]]], ['#e0a21a', [[0, 304], [108, 304], [108, 184], [196, 184]]]].forEach(([col, pts]) => { c.strokeStyle = col; c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke(); });
      c.fillStyle = '#c4302b'; c.beginPath(); c.arc(108, 244, 10, 0, 7); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(108, 244, 4, 0, 7); c.fill();
      c.fillStyle = '#222'; c.font = '700 15px Helvetica, Arial, sans-serif'; c.textAlign = 'left'; c.fillText('YOU ARE HERE', 122, 249);
      return;
    }
    const bg = ['#14213f', '#9c2a22', '#0f5257', '#3b2457'][k % 4], gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, bg); gr.addColorStop(1, '#07090f'); c.fillStyle = gr; c.fillRect(0, 0, w, h); c.translate(0, (h - 352) / 2);
    if (k % 4 === 0) { c.fillStyle = '#f08a2a'; c.beginPath(); c.arc(w / 2, 150, 70, 0, 7); c.fill(); c.fillStyle = '#07090f'; for (let x = 0, i = 0; x < w; x += 22, i++) c.fillRect(x, 170 - (i * 37 % 60), 18, 200); text('LAKEFRONT', 268, 34); text('LIGHTS', 304, 34); text('every night till March', 334, 15, '#f0c27a', 600); }
    else if (k % 4 === 1) { c.strokeStyle = '#fff'; c.lineWidth = 7; c.lineCap = 'round'; for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; c.beginPath(); c.moveTo(w / 2, 140); c.lineTo(w / 2 + Math.cos(a) * 72, 140 + Math.sin(a) * 72); c.stroke(); } text('STAY', 268, 40); text('WARM', 306, 40); text('cocoa · soup · State St', 334, 15, '#ffd2c8', 600); }
    else if (k % 4 === 2) { c.strokeStyle = '#d8f3f0'; c.lineWidth = 5; for (let i = 0; i < 4; i++) { c.beginPath(); c.ellipse(w / 2, 150, 90 - i * 18, 40 - i * 8, -0.3, 0, 7); c.stroke(); } text('SKATE', 268, 40); text('THE PARK', 306, 34); text('open daily · skates for hire', 334, 14, '#a8e3dc', 600); }
    else { c.fillStyle = '#f2d36b'; for (const [x, y] of [[90, 170], [160, 140]]) { c.beginPath(); c.ellipse(x, y, 20, 15, -0.4, 0, 7); c.fill(); c.fillRect(x + 15, y - 90, 6, 90); } c.fillRect(105, 50, 76, 12); text('WINTER', 268, 36); text('CONCERTS', 304, 32); text('Sundays at four', 334, 15, '#e3c9f5', 600); }
  }) }));
  const shelter = (x0, x1, z0, z1, y, back, ad, look) => {
    const HT = 2.5, F = 0.03, GL0 = y + 0.13, GL1 = y + HT - 0.1, inside = back === x1 ? -1 : 1;
    for (const [x, z] of [[x0, z0], [x0, z1], [x1, z0], [x1, z1]]) { g.black.box(x - 0.04, x + 0.04, y, y + HT, z - 0.04, z + 0.04); ob(x - 0.04, x + 0.04, z - 0.04, z + 0.04, y, y + HT); }
    const rx0 = x0 - (back === x0 ? 0.15 : 0.25), rx1 = x1 + (back === x1 ? 0.15 : 0.25), rz0 = z0 - 0.2, rz1 = z1 + 0.2;     // overhanging most on the kerb side
    g.black.box(rx0, rx1, y + HT, y + HT + 0.07, rz0, rz1); g.snow.box(rx0 + 0.05, rx1 - 0.05, y + HT + 0.07, y + HT + 0.15, rz0 + 0.05, rz1 - 0.05);
    ob(rx0, rx1, rz0, rz1, y + HT, y + HT + 0.07);
    const roof = { skin: 'wall', fixed: true, slab: true, x0: rx0, x1: rx1, z0: rz0, z1: rz1, axis: null, h0: y + HT + 0.15, h1: y + HT + 0.15, thick: 0.15, base: y + HT };
    plan.surfaces.push(roof); if (plan.slabs) plan.slabs.push(roof);                                    // (and its underside is a ceiling)
    g.glow.box(x0 + 0.1, x1 - 0.1, y + HT - 0.06, y + HT - 0.02, z0 + 0.3, z1 - 0.3);                     // the strip light under its roof
    // A point on the plane of a pane: `u` along it, `v` up. A pane in the plane x = at runs along z; in z = at, along x.
    const P = (ax, at, u, v, d = 0) => ax === 'x' ? [at + d, v, u] : [u, v, at + d];
    const bar = (q, ax, at, u0, u1, v0, v1, d) => ax === 'x' ? q.box(at - d, at + d, v0, v1, u0, u1) : q.box(u0, u1, v0, v1, at - d, at + d);
    const sheet = (q, ax, at, u0, u1, v0, v1, d = 0, uv) => q.quad(P(ax, at, u0, v0, d), P(ax, at, u1, v0, d), P(ax, at, u1, v1, d), P(ax, at, u0, v1, d), ax === 'x' ? [1, 0, 0] : [0, 0, 1], uv);
    // Glass between u0 and u1 from v0 to v1, cut into panes no wider than a sheet comes, each with its glints.
    const glaze = (ax, at, u0, u1, v0, v1, band) => {
      const n = Math.max(1, Math.round((u1 - u0) / 1.25)), w = (u1 - u0) / n;
      sheet(g.glass, ax, at, u0, u1, v0, v1);
      bar(g.steel, ax, at, u0, u1, v0 - 0.05, v0, F); bar(g.steel, ax, at, u0, u1, v1, v1 + 0.04, F);             // sill and head
      for (let i = 0; i <= n; i++) { const m = u0 + w * i; bar(g.steel, ax, at, m - (i ? 0.025 : 0), m + (i < n ? 0.025 : 0), v0, v1, F); }      // stiles and mullions
      if (band) sheet(g.frit, ax, at, u0, u1, y + 1.0, y + 1.12, 0, [[u0 / 0.12, 0], [u1 / 0.12, 0], [u1 / 0.12, 1], [u0 / 0.12, 1]]);      // dots, at eye height
      for (let i = 0; i < n; i++) {
        const a = u0 + w * i + 0.03, b = a + w - 0.06, h = v1 - v0;
        bar(g.edge, ax, at, a, b, v1 - 0.016, v1 - 0.006, F + 0.003); bar(g.edge, ax, at, a, a + 0.01, v0 + 0.04, v1 - 0.02, F + 0.003);      // a glint along the top and down one side
        for (const [s0, s1, k] of [[0.18, 0.42, 1], [0.5, 0.58, 0.6]]) {                                                       // reflections, slanting across
          const c0 = a + (b - a) * s0, c1 = a + (b - a) * s1, sk = (b - a) * 0.35;
          for (const d of [-0.004, 0.004]) g.streak.quad(P(ax, at, c0, v0 + 0.05, d), P(ax, at, c1, v0 + 0.05, d), P(ax, at, Math.min(b, c1 + sk), v0 + h * 0.85, d), P(ax, at, Math.min(b, c0 + sk), v0 + h * 0.85, d), ax === 'x' ? [1, 0, 0] : [0, 0, 1], [[0, 0], [k, 0], [k, 1], [0, 1]]);
        }
      }
    };
    // The back, glazed its length, solid its length.
    glaze('x', back, z0 + 0.04, z1 - 0.04, GL0, GL1, true); ob(back - F, back + F, z0, z1, y, y + HT);
    // The ends: glass at one, the lit case at the other with a strip of glass over it.
    for (const at of [z0, z1]) {
      if (at !== ad) { glaze('z', at, x0 + 0.04, x1 - 0.04, GL0, GL1, true); ob(x0, x1, at - F, at + F, y, y + HT); continue; }
      const top = y + 2.12, D = 0.06;
      bar(g.black, 'z', at, x0 + 0.04, x1 - 0.04, y + 0.06, top, D); ob(x0, x1, at - D, at + D, y, y + HT);
      glaze('z', at, x0 + 0.04, x1 - 0.04, top + 0.04, GL1, false);
      for (const [side, pic] of [[1, look * 2], [-1, look * 2 + 1]]) {                                     // a poster each side, lit from within
        const m = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0 - 0.24, top - y - 0.3), posterMat(pic));
        m.position.set((x0 + x1) / 2, (y + 0.06 + top) / 2 + 0.03, at + side * (D + 0.003)); if (side < 0) m.rotation.y = Math.PI; extra.push(m);
      }
    }
    // The route map, on the inside of the back pane at one end.
    { const zc = ad === z1 ? z0 + 0.75 : z1 - 0.75, m = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.8), posterMat('map'));
      g.black.box(Math.min(back, back + inside * 0.05), Math.max(back, back + inside * 0.05), y + 1.18, y + 2.02, zc - 0.35, zc + 0.35);
      m.position.set(back + inside * 0.053, y + 1.6, zc); m.rotation.y = inside * Math.PI / 2; extra.push(m); }
  };
  // ---- Michigan Avenue, the museum's side (pavement x M.x1..SX, at the avenue's level)
  const px = M.x1 + 1.25;                                             // the kerb line the furniture keeps to
  // Bollards before the steps, leaving the crossing clear.
  for (let z = cz - 22.5; z <= cz + 22.51; z += 2.5) if (Math.abs(z - cz) > 3.6) bollard(px + 0.1, z);
  // The bus stop: a glass shelter with a bench in it, a pole with the route plate, and the kerb painted.
  { const z0 = 62.8, z1 = 67.6, x0 = M.x1 + 0.9, x1 = x0 + 1.5, y = AV;
    shelter(x0, x1, z0, z1, y, x1, z1, 0);
    bench(x1 - 0.42, (z0 + z1) / 2, -1, 0); sign(x0 - 0.2, z1 + 1.4, ['BUS', 'STOP', '3 · 4 · 6'], '#1f4f9a', 'z'); }
  // The rest, kept off the ways up to the terrace, the lions and the trees.
  const clearOfWays = z => !S.ways.some(w => z > w.z0 - 3 && z < w.z1 + 3) && Math.abs(Math.abs(z - cz) - F.lion) > 3.4 && !(z > 58 && z < 72);
  let k = 0;
  for (let z = B.z0 + 22; z < B.z1 - 20; z += 19.5, k++) {
    if (!clearOfWays(z)) continue;
    const zz = z + 3.1;                                               // between the trees
    if (k % 3 === 0) bin(px, zz); else if (k % 3 === 1) hydrant(px - 0.1, zz); else { newsbox(px, zz, g.red); newsbox(px, zz + 0.55, g.blue); }
    if (k % 4 === 1) sign(px - 0.2, zz + 4, ['NO', 'PARKING', 'BUS LANE'], '#b3261f', 'z');
  }
  // Benches against the foot of the terrace wall, and hoops for bikes.
  for (const z of [36, 52, 84, 134, 150, 176, 190]) if (clearOfWays(z)) bench(SX - 1.35, z, -1, 0);
  for (const z0 of [40, 160]) for (let i = 0; i < 5; i++) { const z = z0 + i * 1.1, x = px + 0.15; g.steel.box(x - 0.42, x + 0.42, AV + 0.78, AV + 0.83, z - 0.025, z + 0.025); for (const d of [-0.42, 0.4]) g.steel.box(x + d, x + d + 0.04, AV, AV + 0.8, z - 0.025, z + 0.025); ob(x - 0.42, x + 0.44, z - 0.04, z + 0.04, AV, AV + 0.83); }
  // The rental bikes: a dock by the kerb, south of the steps.
  { const z0 = 139, x = px + 0.2; g.steel.box(x - 0.9, x - 0.6, AV, AV + 0.1, z0 - 0.3, z0 + 8.3);
    for (let i = 0; i < 8; i++) { const z = z0 + i * 1.05 + 0.4; g.steel.box(x - 0.86, x - 0.66, AV + 0.1, AV + 0.95, z - 0.1, z + 0.1); if (i !== 2 && i !== 5) bikeRow.push([x - 0.1, AV, z]); }
    g.steel.box(x - 0.95, x - 0.6, AV, AV + 1.9, z0 - 0.75, z0 - 0.35); g.glow.box(x - 0.59, x - 0.58, AV + 1.2, AV + 1.7, z0 - 0.7, z0 - 0.4); ob(x - 0.95, x - 0.6, z0 - 0.75, z0 + 8.3, AV, AV + 0.95); }
  // Hedges in kerbed beds at the foot of the terrace wall, either side of the steps and along the gardens:
  // one bed and one unbroken hedge from each way up the terrace to the next.
  const beds = [];
  const bed = (z0, z1) => { const x0 = SX - 0.82, x1 = SX - 0.06; g.stone.box(x0 - 0.08, x1, AV, AV + 0.16, z0, z1); beds.push({ x0: x0 + 0.04, x1: x1 - 0.04, z0: z0 + 0.1, z1: z1 - 0.1 }); landable(plan, x0 - 0.08, x1, z0, z1, AV + 0.16, AV); };
  { const holes = [...S.ways.map(w => [w.z0 - (w.id === 'steps' ? 4.6 : 2.2), w.z1 + (w.id === 'steps' ? 4.6 : 2.2)])]; for (const [a, b] of gaps(MO.z1 + 5, JA.z0 - 5, holes)) bed(a, b); }
  for (const q of frostHedges(frost, beds, AV + 0.16, 0.64)) landable(plan, q.x0, q.x1, q.z0, q.z1, AV + 0.82, AV, 0.05);      // and the hedge in it has a top, as drawn

  // ---- Michigan Avenue, the far side: cars snowed in along the kerb, pay boxes, signs
  [[-22.95, 12], [-22.95, 58, { kind: 'pickup' }], [-22.95, 64.5, { kind: 'saloon', scraped: true, ticket: true }], [-22.95, 141], [-22.95, 176, { kind: 'suv' }], [-22.95, 214]].forEach(([x, z, o]) => parked(x, z, 0, 1, o));
  for (const z of [18, 61, 146, 180, 218]) paybox(M.x0 - 0.9, z);
  for (const z of [30, 96, 160, 226]) sign(M.x0 - 0.7, z, ['SNOW', 'ROUTE', 'NO PARKING', '2 INCHES'], '#b3261f', 'z');
  for (const z of [44, 120, 200]) bin(M.x0 - 1.0, z); hydrant(M.x0 - 0.9, 80); hydrant(M.x0 - 0.9, 190);

  // ---- Monroe Street and Jackson Drive (their inner pavements, by the block)
  const clearX = (x, z) => !(x > R.x0 - 6 && x < R.x1 + 6) && !G.trees.some(t => Math.abs(t.x - x) < 1.6 && Math.abs(t.z - z) < 1.6) && !O.some(o => o.y1 > 0.2 && o.y0 < 1 && x > o.x0 - 0.9 && x < o.x1 + 0.9 && z > o.z0 - 0.9 && z < o.z1 + 0.9);
  for (const [zp, zc, sgn] of [[MO.z1 + 1.3, MO.z1 - 1.0, 1], [JA.z0 - 1.3, JA.z0 + 1.0, -1]]) {
    let i = 0;
    for (let x = 34; x < C.x0 - 14; x += 23, i++) { if (!clearX(x + 6, zp)) continue; if (i % 3 === 0) bench(x + 6, zp + sgn * 0.5, 0, -sgn); else if (i % 3 === 1) bin(x + 6, zp + sgn * 0.3); else hydrant(x + 6, zp - sgn * 0.7, true); }
    for (const x of [52, 76, 158, 222]) { if (!clearX(x, zc)) continue; parked(x, zc, sgn, 0); if (clearX(x + 3.2, zp - sgn * 0.75)) paybox(x + 3.2, zp - sgn * 0.75); }
    for (const x of [44, 190]) if (clearX(x, zp - sgn * 0.8)) sign(x, zp - sgn * 0.8, ['2 HOUR', 'PARKING', 'PAY BOX'], '#1f6b3a', 'x');
  }
  // ---- Columbus Drive: a bus stop on the block's side, and bins
  { const z0 = 58, z1 = 62.4, x1 = C.x0 - 3.0, x0 = x1 - 1.4, y = 0;
    shelter(x0, x1, z0, z1, y, x0, z0, 1);
    bench(x0 + 0.42, (z0 + z1) / 2, 1, 0); sign(x1 + 0.6, z1 + 1.2, ['BUS', 'STOP', '6 · 146'], '#1f4f9a', 'z'); }
  for (const z of [30, 92, 150, 205]) if (clearX(C.x0 - 3.4, z)) bin(C.x0 - 3.4, z);
  for (const z of [44, 170]) hydrant(C.x1 + 0.9, z);

  // The winter on all of it: the lamps and their light, the plough's windrows, washboard, the road works (winterroads.js).
  buildWinterRoads(museum, plan, { parked, paintW });

  // ------------------------------------------------------------------ put it all in the world
  for (const [x, y, z] of bikeRow) bike(x, y, z, g.blue);
  const add = m => { m.matrixAutoUpdate = false; m.updateMatrix(); group.add(m); };
  if (!frost.empty) add(frost.mesh(hedgeMaterial()));
  for (const k2 in g) if (!g[k2].empty) { const m = g[k2].mesh(mat[k2]); if (k2 === 'glass') m.renderOrder = 5; if (k2 === 'frit' || k2 === 'streak') m.renderOrder = 6; if (k2 === 'red' || k2 === 'snow') plan.hydrants[k2] = m; add(m); }
  if (twig.length) add(new THREE.Mesh(mergeGeometries(twig), std({ color: 0x2a221c, roughness: 0.9, emissive: 0x1a1d26, emissiveIntensity: 0.9 })));
  if (wheel.length) add(new THREE.Mesh(mergeGeometries(wheel), mat.black));
  for (const m of extra) add(m);
  // The ground's layers, each one mesh for all the streets: opaque first, then the transparent marks in the order they lie.
  const lay = (geo, m, order = 0) => { if (geo.empty) return null; const me = new THREE.Mesh(geo.build(), m); me.renderOrder = order; add(me); return me; };
  lay(slabG, slabMaterial(-1));
  for (const m of K.meshes(fixG)) add(m);
  lay(fixG, fixtureMaterial());
  lay(roadMk, roadMarkMaterial(), -4); lay(paintW, paintMaterial(false), -3); lay(paintY, paintMaterial(true), -3);
  const wet = lay(trackG, trackMaterial(museum.mirror), -2); if (wet) museum.floors.push(wet);      // (kept out of its own reflection)
  lay(walkMk, walkMarkMaterial(), -2);
  // The gardens' and the paths' own benches and bins (groundsplan.js). A bench stands only where the ground under its
  // length is level to a hand's width: where the lawn rolls under one, it is left out.
  if (plan.dress) { plan.dress.benches = plan.dress.benches.filter(b => { const e = b.fx ? [0, 0.9] : [0.9, 0], ys = [-1, 0, 1].map(k => streetY(plan, b.x + e[0] * k, b.z + e[1] * k)); return Math.max(...ys) - Math.min(...ys) < 0.05 && Math.max(...ys) < 0.06; });
    for (const b of plan.dress.benches) bench(b.x, b.z, b.fx, b.fz); for (const [x, z] of plan.dress.bins) bin(x, z); }
  for (const m of PF.meshes(mat.snow)) add(m);
  for (const m of PK.meshes(mat.snow)) add(m);
}
