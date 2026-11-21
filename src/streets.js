// The four streets round the block, dressed as they are: Michigan Avenue with its planted median,
// bus stop and the wall of shopfronts across it; Monroe Street and Jackson Drive with their
// pavements; Columbus Drive with its median. Crossings and stop lines at the corners, signals on
// black mast arms with the green street-name blades, parked cars under snow, pay boxes, bins,
// hydrants, newspaper boxes, bike racks, bollards before the steps, hedges at the foot of the terrace.
//
// All made here by hand, of boxes and painted canvases. Everything that stands up is solid.

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { Geo } from './geo.js';
import { streetY, landable } from './plan.js';
import { frostHedges, hedgeMaterial } from './frost.js';

const canvasTex = (w, h, draw) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };

export function buildStreets(museum, plan) {
  const G = plan.grounds, F = plan.facade, B = plan.bounds, S = plan.street, L = plan.lakefront, O = plan.obstacles, group = museum.group;
  if (!S) return;
  const SX = S.x, SY = S.y, M = G.michigan, MO = G.monroe, JA = G.jackson, C = G.columbus, R = G.rail, cz = F.cz;
  const east = L ? L.lsd.x0 : B.x1;
  const std = o => new THREE.MeshStandardMaterial(o);
  const mat = {
    walk: std({ color: 0x9a968e, roughness: 0.85, emissive: 0x3a3f4f, emissiveIntensity: 0.5, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }),
    stone: std({ color: 0x8a867e, roughness: 0.8, emissive: 0x3c404e, emissiveIntensity: 0.55 }),
    white: new THREE.MeshBasicMaterial({ color: new THREE.Color(0.62, 0.6, 0.55), polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }),
    yellow: new THREE.MeshBasicMaterial({ color: new THREE.Color(0.62, 0.5, 0.16), polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }),
    black: std({ color: 0x15171b, roughness: 0.5, metalness: 0.5, emissive: 0x0b0c10, emissiveIntensity: 0.6 }),
    steel: std({ color: 0x9aa2ad, roughness: 0.4, metalness: 0.6, emissive: 0x3a4048, emissiveIntensity: 0.6 }),
    green: std({ color: 0x1f3d27, roughness: 0.95, emissive: 0x0d1c12, emissiveIntensity: 0.7 }),
    soil: std({ color: 0x2a2620, roughness: 1, emissive: 0x100f0c, emissiveIntensity: 0.5 }),
    wood: std({ color: 0x5b4127, roughness: 0.8, emissive: 0x241a10, emissiveIntensity: 0.6 }),
    red: std({ color: 0xb3261f, roughness: 0.6, emissive: 0x5a120e, emissiveIntensity: 0.7 }),
    blue: std({ color: 0x1f5fa8, roughness: 0.6, emissive: 0x0f2f55, emissiveIntensity: 0.7 }),
    car1: std({ color: 0x3a4250, roughness: 0.5, metalness: 0.3, emissive: 0x161a22, emissiveIntensity: 0.6 }),
    car2: std({ color: 0x6a2420, roughness: 0.5, metalness: 0.3, emissive: 0x2a0e0c, emissiveIntensity: 0.6 }),
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
  const flat = (q, x0, x1, z0, z1, y, s = 2.5) => q.quad([x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1], [0, 1, 0], [[x0 / s, z0 / s], [x1 / s, z0 / s], [x1 / s, z1 / s], [x0 / s, z1 / s]]);
  const paved = q => plan.paved.push(q);
  const bikeRow = [];
  const extra = [];                                                   // loose meshes: signs, blades
  const AV = SY;                                                      // the avenue's level

  // ------------------------------------------------------------------ pavements that were missing
  // The far side of the avenue, and the wall of shopfronts that stands along it.
  flat(g.walk, M.x0 - 7, M.x0, B.z0 - 30, B.z1 + 30, AV + 0.008);
  g.stone.box(M.x0 - 0.12, M.x0 + 0.12, AV, AV + 0.07, B.z0 - 30, B.z1 + 30); landable(plan, M.x0 - 0.12, M.x0 + 0.12, B.z0 - 30, B.z1 + 30, AV + 0.07, AV);      // (every kerb is a top the wheels ride up onto, not sink into)
  paved({ x0: M.x0 - 8, x1: M.x0, z0: B.z0, z1: B.z1 });
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
  // Monroe and Jackson, level stretch: a pavement each side with its kerb, as far as the Drive.
  // (Not across the open railway cutting, where there is only the balustrade.)
  const cuts = plan.cut ? plan.cut.open.map(s => [s.z0, s.z1]) : [];
  const overCut = (z0, z1) => cuts.some(([a, b]) => z1 > a && z0 < b);
  const sidewalk = (z0, z1, kerbZ) => {
    const runs = overCut(z0, z1) ? [[SX + 12, R.x0 - 0.4], [R.x1 + 0.4, east]] : [[SX + 12, east]];
    for (const [xa, xb] of runs) { flat(g.walk, xa, xb, z0, z1, 0.012); g.stone.box(xa, xb, 0, 0.07, kerbZ - 0.1, kerbZ + 0.1); landable(plan, xa, xb, kerbZ - 0.1, kerbZ + 0.1, 0.07); paved({ x0: xa, x1: xb, z0, z1 }); }
  };
  sidewalk(MO.z0 - 4, MO.z0, MO.z0); sidewalk(MO.z1, MO.z1 + 2.2, MO.z1); sidewalk(JA.z0 - 2.2, JA.z0, JA.z0); sidewalk(JA.z1, JA.z1 + 4, JA.z1);
  // Columbus Drive's far pavement.
  flat(g.walk, C.x1, C.x1 + 2.6, MO.z1 + 2.2, JA.z0 - 2.2, 0.012); g.stone.box(C.x1 - 0.1, C.x1 + 0.1, 0, 0.07, MO.z1, JA.z0); landable(plan, C.x1 - 0.1, C.x1 + 0.1, MO.z1, JA.z0, 0.07); paved({ x0: C.x1, x1: C.x1 + 2.6, z0: MO.z1, z1: JA.z0 });

  // ------------------------------------------------------------------ lane paint
  const dashZ = (x, z0, z1, y, q = g.white) => { for (let z = z0; z < z1 - 3; z += 9) flat(q, x - 0.07, x + 0.07, z, z + 3.6, y); };
  const dashX = (z, x0, x1, y, q = g.white) => { for (let x = x0; x < x1 - 3; x += 9) flat(q, x, x + 3.6, z - 0.07, z + 0.07, y); };
  // The avenue: three lanes each way, a parking lane on the far side and a bus lane on the museum's.
  dashZ(-16.1, B.z0, B.z1, AV + 0.008); dashZ(-9.2, B.z0, B.z1, AV + 0.008);
  flat(g.white, -22.0, -21.86, B.z0, B.z1, AV + 0.008); flat(g.white, -3.57, -3.43, B.z0, B.z1, AV + 0.008);
  // Monroe and Jackson: two lanes each way, a double yellow line between.
  for (const st of [MO, JA]) { const m = (st.z0 + st.z1) / 2; for (const d of [-0.16, 0.16]) flat(g.yellow, SX + 13, east - 4, m + d - 0.05, m + d + 0.05, 0.011); for (const d of [-2.75, 2.75]) dashX(m + d, SX + 14, east - 4, 0.009); }
  // Columbus: two lanes each way either side of the median.
  dashZ(C.x0 + 4.2, MO.z1 + 4, JA.z0 - 2, 0.009); dashZ(C.x1 - 4.2, MO.z1 + 4, JA.z0 - 2, 0.009);

  // A zebra across a street running along z (bars lie along z) or along x, and a stop line.
  const zebraX = (x0, x1, z0, z1, y) => { for (let z = z0; z < z1 - 0.3; z += 0.9) flat(g.white, x0, x1, z, z + 0.45, y); };   // crosses a z-street: walked along x
  const zebraZ = (x0, x1, z0, z1, y) => { for (let x = x0; x < x1 - 0.3; x += 0.9) flat(g.white, x, x + 0.45, z0, z1, y); };   // crosses an x-street: walked along z
  // Michigan at Monroe and at Jackson: across the avenue, and across the side street's mouth.
  zebraX(M.x0 + 0.5, M.x1 - 0.5, MO.z1 + 0.8, MO.z1 + 3.6, AV + 0.008); zebraX(M.x0 + 0.5, M.x1 - 0.5, JA.z0 - 3.6, JA.z0 - 0.8, AV + 0.008);
  zebraZ(M.x1 + 1.2, M.x1 + 4.0, MO.z0 + 0.4, MO.z1 - 0.4, AV + 0.009); zebraZ(M.x1 + 1.2, M.x1 + 4.0, JA.z0 + 0.4, JA.z1 - 0.4, AV + 0.009);
  // Stop lines on the avenue, short of each crossing (northbound on the museum's side, southbound on the far side).
  for (const z of [MO.z1 + 4.6, cz + 4.4, JA.z1 + 1]) flat(g.white, -11.6, M.x1 - 0.3, z - 0.2, z + 0.2, AV + 0.008);
  for (const z of [MO.z0 - 1, cz - 4.4, JA.z0 - 4.6]) flat(g.white, M.x0 + 2.2, -13.6, z - 0.2, z + 0.2, AV + 0.008);
  // Columbus at Monroe and at Jackson.
  zebraX(C.x0 + 0.4, C.x1 - 0.4, MO.z1 + 0.6, MO.z1 + 3.2, 0.009); zebraX(C.x0 + 0.4, C.x1 - 0.4, JA.z0 - 3.2, JA.z0 - 0.6, 0.009);
  zebraZ(C.x0 - 3.4, C.x0 - 0.8, MO.z0 + 0.4, MO.z1 - 0.4, 0.009); zebraZ(C.x0 - 3.4, C.x0 - 0.8, JA.z0 + 0.4, JA.z1 - 0.4, 0.009);

  // ------------------------------------------------------------------ medians
  // A raised planter down the middle: stone kerb, soil, clipped evergreens, a small bare tree now and then, snow lying on it.
  const twig = []; const treeAt = (x, y, z, s = 1) => { const k = (r0, r1, len, rx, rz, yy) => { const c = new THREE.CylinderGeometry(r1, r0, len, 5); c.translate(0, len / 2, 0); c.rotateX(rx); c.rotateZ(rz); c.scale(s, s, s); c.translate(x, y + yy * s, z); twig.push(c); }; k(0.07, 0.045, 1.5, 0, 0, 0); for (let i = 0; i < 5; i++) { const a = i * 1.26 + x; k(0.035, 0.012, 1.3, Math.cos(a) * 0.7, Math.sin(a) * 0.7, 1.35); } };
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
  const blade = name => canvasTex(256, 48, (c, w, h) => { c.fillStyle = '#0d6b3a'; c.fillRect(0, 0, w, h); c.strokeStyle = '#e9efe9'; c.lineWidth = 3; c.strokeRect(2, 2, w - 4, h - 4); c.fillStyle = '#f2f5f0'; c.font = '600 30px Helvetica, Arial, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(name, w / 2, h / 2 + 2); });
  const blades = {}; const bladeMat = n => blades[n] || (blades[n] = new THREE.MeshBasicMaterial({ map: blade(n), side: THREE.DoubleSide, color: new THREE.Color(0.85, 0.85, 0.85) }));
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
    names.forEach((n, i) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(1.25, 0.24), bladeMat(n)); m.position.set(x + (i ? 0 : 0.72), y + 4.0 + i * 0.3, z + (i ? 0.72 : 0)); if (i) m.rotation.y = Math.PI / 2; extra.push(m); });
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
  for (const z of [MO.z1 + 4.0]) flat(g.white, cmid + 1, C.x1 - 0.3, z - 0.2, z + 0.2, 0.009);
  for (const z of [JA.z0 - 4.0]) flat(g.white, C.x0 + 0.3, cmid - 1, z - 0.2, z + 0.2, 0.009);

  // ------------------------------------------------------------------ small furniture
  const bin = (x, z) => { const y = streetY(plan, x, z); g.black.box(x - 0.24, x + 0.24, y, y + 0.86, z - 0.24, z + 0.24); g.steel.box(x - 0.27, x + 0.27, y + 0.86, y + 0.92, z - 0.27, z + 0.27); g.snow.box(x - 0.2, x + 0.2, y + 0.92, y + 0.97, z - 0.2, z + 0.2); ob(x - 0.25, x + 0.25, z - 0.25, z + 0.25, y, y + 0.95); };
  const hydrant = (x, z) => { const y = streetY(plan, x, z); g.red.box(x - 0.11, x + 0.11, y, y + 0.55, z - 0.11, z + 0.11); g.red.box(x - 0.15, x + 0.15, y + 0.55, y + 0.62, z - 0.15, z + 0.15); g.red.box(x - 0.07, x + 0.07, y + 0.62, y + 0.72, z - 0.07, z + 0.07); g.red.box(x - 0.2, x + 0.2, y + 0.32, y + 0.44, z - 0.06, z + 0.06); g.snow.box(x - 0.08, x + 0.08, y + 0.72, y + 0.76, z - 0.08, z + 0.08); ob(x - 0.15, x + 0.15, z - 0.15, z + 0.15, y, y + 0.75); };
  const bollard = (x, z) => { const y = streetY(plan, x, z); g.black.box(x - 0.09, x + 0.09, y, y + 0.9, z - 0.09, z + 0.09); g.black.box(x - 0.12, x + 0.12, y + 0.78, y + 0.84, z - 0.12, z + 0.12); g.snow.box(x - 0.08, x + 0.08, y + 0.9, y + 0.94, z - 0.08, z + 0.08); ob(x - 0.1, x + 0.1, z - 0.1, z + 0.1, y, y + 0.92); };
  const paybox = (x, z) => { const y = streetY(plan, x, z); g.black.box(x - 0.05, x + 0.05, y, y + 1.0, z - 0.05, z + 0.05); g.steel.box(x - 0.17, x + 0.17, y + 1.0, y + 1.55, z - 0.13, z + 0.13); g.glow.box(x - 0.1, x + 0.1, y + 1.3, y + 1.45, z + 0.13, z + 0.14); g.glow.box(x - 0.1, x + 0.1, y + 1.3, y + 1.45, z - 0.14, z - 0.13); g.snow.box(x - 0.17, x + 0.17, y + 1.55, y + 1.6, z - 0.13, z + 0.13); ob(x - 0.17, x + 0.17, z - 0.13, z + 0.13, y, y + 1.6); };
  const newsbox = (x, z, q) => { const y = streetY(plan, x, z); q.box(x - 0.22, x + 0.22, y + 0.12, y + 1.05, z - 0.2, z + 0.2); g.black.box(x - 0.18, x + 0.18, y, y + 0.12, z - 0.16, z + 0.16); g.dark.box(x - 0.23, x - 0.221, y + 0.6, y + 0.95, z - 0.15, z + 0.15); g.snow.box(x - 0.22, x + 0.22, y + 1.05, y + 1.1, z - 0.2, z + 0.2); ob(x - 0.22, x + 0.22, z - 0.2, z + 0.2, y, y + 1.1); };
  // A bench: slats on iron ends. `ax` is the way its length runs.
  const bench = (x, z, ax) => { const y = streetY(plan, x, z), L2 = 0.9, D = 0.26; const bx = (q, l0, l1, y0, y1, d0, d1) => ax === 'z' ? q.box(x + d0, x + d1, y0, y1, z + l0, z + l1) : q.box(x + l0, x + l1, y0, y1, z + d0, z + d1);
    bx(g.wood, -L2, L2, y + 0.42, y + 0.47, -D, D); bx(g.wood, -L2, L2, y + 0.55, y + 0.9, D - 0.04, D); for (const e of [-L2 + 0.08, L2 - 0.14]) bx(g.black, e, e + 0.06, y, y + 0.9, -D, D); bx(g.snow, -L2 + 0.05, L2 - 0.05, y + 0.47, y + 0.5, -D + 0.03, D - 0.06);
    ax === 'z' ? ob(x - D, x + D, z - L2, z + L2, y, y + 0.9) : ob(x - L2, x + L2, z - D, z + D, y, y + 0.9); };
  // A sign on a post: white plate, a word or two.
  const plateTex = {}; const plate = (lines, col) => plateTex[lines.join()] || (plateTex[lines.join()] = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, color: new THREE.Color(0.8, 0.8, 0.8), map: canvasTex(128, 160, (c, w, h) => { c.fillStyle = '#f1efe8'; c.fillRect(0, 0, w, h); c.strokeStyle = col; c.lineWidth = 6; c.strokeRect(5, 5, w - 10, h - 10); c.fillStyle = col; c.font = '700 26px Helvetica, Arial, sans-serif'; c.textAlign = 'center'; lines.forEach((t, i) => c.fillText(t, w / 2, 44 + i * 32)); }) }));
  const sign = (x, z, lines, col, facing) => { const y = streetY(plan, x, z); g.steel.box(x - 0.03, x + 0.03, y, y + 2.5, z - 0.03, z + 0.03); const m = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.58), plate(lines, col)); m.position.set(x + (facing === 'x' ? 0.04 : 0), y + 2.2, z + (facing === 'z' ? 0.04 : 0)); if (facing === 'x') m.rotation.y = Math.PI / 2; extra.push(m); ob(x - 0.04, x + 0.04, z - 0.04, z + 0.04, y, y + 2.5); };
  // A parked car with the night's snow on it. `ax` is the way it points.
  const parked = (x, z, ax, q) => { const y = streetY(plan, x, z), Lh = 2.15, Wh = 0.88; const bx = (qq, l0, l1, y0, y1, w) => ax === 'z' ? qq.box(x - w, x + w, y0, y1, z + l0, z + l1) : qq.box(x + l0, x + l1, y0, y1, z - w, z + w);
    bx(q, -Lh, Lh, y + 0.28, y + 0.82, Wh); bx(g.dark, -Lh * 0.5, Lh * 0.42, y + 0.82, y + 1.28, Wh - 0.08); bx(q, -Lh * 0.46, Lh * 0.38, y + 1.28, y + 1.33, Wh - 0.06);
    for (const l of [-Lh + 0.75, Lh - 0.75]) bx(g.dark, l - 0.33, l + 0.33, y, y + 0.62, Wh + 0.01);
    bx(g.snow, -Lh + 0.1, -Lh * 0.5, y + 0.82, y + 0.92, Wh - 0.06); bx(g.snow, Lh * 0.42, Lh - 0.1, y + 0.82, y + 0.9, Wh - 0.06); bx(g.snow, -Lh * 0.46, Lh * 0.38, y + 1.33, y + 1.46, Wh - 0.1);
    bx(g.snow, -Lh - 0.25, Lh + 0.25, y, y + 0.14, Wh + 0.3);                                            // ploughed in
    ax === 'z' ? ob(x - Wh, x + Wh, z - Lh, z + Lh, y, y + 1.45) : ob(x - Lh, x + Lh, z - Wh, z + Wh, y, y + 1.45); };
  // A rack of hoops, and bikes.
  const wheel = []; const bike = (x, y, z, q) => { for (const d of [-0.52, 0.52]) { const t = new THREE.TorusGeometry(0.31, 0.022, 5, 14); t.rotateY(Math.PI / 2); t.translate(x, y + 0.33, z + d); wheel.push(t); } q.box(x - 0.025, x + 0.025, y + 0.5, y + 0.58, z - 0.5, z + 0.5); q.box(x - 0.025, x + 0.025, y + 0.33, y + 0.9, z - 0.16, z - 0.1); q.box(x - 0.025, x + 0.025, y + 0.33, y + 1.0, z + 0.44, z + 0.5); g.black.box(x - 0.22, x + 0.22, y + 0.98, y + 1.02, z + 0.44, z + 0.5); g.black.box(x - 0.07, x + 0.07, y + 0.9, y + 0.95, z - 0.26, z - 0.02); };

  // A bus shelter: four black posts and a flat roof with a strip light under it; toughened glass in aluminium frames
  // across the back (at x = `back`) and both ends, open along the kerb. The end at z = `ad` is a lit advertising case,
  // and a route map hangs inside on the back. What stops a car is what is drawn: every pane, frame and case is solid
  // exactly where it stands, and nothing else is. The glass is drawn so it reads at night: a pale tint, the frame round
  // it, a frosted band at eye height, a glint along its edges and a streak of reflection across each pane. The roof is
  // a top to land on.
  const posters = {}, posterMat = k => posters[k] || (posters[k] = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.92, 0.92, 0.92), side: THREE.DoubleSide, map: canvasTex(256, 352, (c, w, h) => {
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
    const bg = ['#14213f', '#9c2a22', '#0f5257', '#3b2457'][k % 4], gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, bg); gr.addColorStop(1, '#07090f'); c.fillStyle = gr; c.fillRect(0, 0, w, h);
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
    bench(x1 - 0.42, (z0 + z1) / 2, 'z'); sign(x0 - 0.2, z1 + 1.4, ['BUS', 'STOP', '3 · 4 · 6'], '#1f4f9a', 'z');
    flat(g.yellow, M.x1 - 0.5, M.x1 - 0.25, z0 - 6, z1 + 8, AV + 0.008);
    for (const [zz, t] of [[z0 - 5, 0], [z1 + 7, 0]]) flat(g.white, -3.4, M.x1 - 0.6, zz - 0.1 + t, zz + 0.1 + t, AV + 0.008); }
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
  for (const z of [36, 52, 84, 134, 150, 176, 190]) if (clearOfWays(z)) bench(SX - 1.35, z, 'z');
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
  [[-22.95, 12, g.car1], [-22.95, 58, g.car2], [-22.95, 64.5, g.car1], [-22.95, 141, g.car1], [-22.95, 176, g.car2], [-22.95, 214, g.car1]].forEach(([x, z, q]) => parked(x, z, 'z', q));
  for (const z of [18, 61, 146, 180, 218]) paybox(M.x0 - 0.9, z);
  for (const z of [30, 96, 160, 226]) sign(M.x0 - 0.7, z, ['SNOW', 'ROUTE', 'NO PARKING', '2 INCHES'], '#b3261f', 'z');
  for (const z of [44, 120, 200]) bin(M.x0 - 1.0, z); hydrant(M.x0 - 0.9, 80); hydrant(M.x0 - 0.9, 190);

  // ---- Monroe Street and Jackson Drive (their inner pavements, by the block)
  const grate = (x, z) => { g.black.box(x - 0.6, x + 0.6, 0.012, 0.03, z - 0.6, z + 0.6); };
  for (const t of G.trees) if (Math.abs(t.z - (MO.z1 + 1.3)) < 0.2 || Math.abs(t.z - (JA.z0 - 1.3)) < 0.2) grate(t.x, t.z);
  const clearX = (x, z) => !(x > R.x0 - 6 && x < R.x1 + 6) && !G.trees.some(t => Math.abs(t.x - x) < 1.6 && Math.abs(t.z - z) < 1.6) && !O.some(o => o.y1 > 0.2 && o.y0 < 1 && x > o.x0 - 0.9 && x < o.x1 + 0.9 && z > o.z0 - 0.9 && z < o.z1 + 0.9);
  for (const [zp, zc, sgn] of [[MO.z1 + 1.3, MO.z1 - 1.0, 1], [JA.z0 - 1.3, JA.z0 + 1.0, -1]]) {
    let i = 0;
    for (let x = 34; x < C.x0 - 14; x += 23, i++) { if (!clearX(x + 6, zp)) continue; if (i % 3 === 0) bench(x + 6, zp + sgn * 0.5, 'x'); else if (i % 3 === 1) bin(x + 6, zp + sgn * 0.3); else hydrant(x + 6, zp - sgn * 0.7); }
    for (const x of [52, 76, 158, 222]) { if (!clearX(x, zc)) continue; parked(x, zc, 'x', (x / 2 | 0) % 2 ? g.car1 : g.car2); if (clearX(x + 3.2, zp - sgn * 0.75)) paybox(x + 3.2, zp - sgn * 0.75); }
    for (const x of [44, 190]) if (clearX(x, zp - sgn * 0.8)) sign(x, zp - sgn * 0.8, ['2 HOUR', 'PARKING', 'PAY BOX'], '#1f6b3a', 'x');
  }
  // ---- Columbus Drive: a bus stop on the block's side, and bins
  { const z0 = 58, z1 = 62.4, x1 = C.x0 - 3.0, x0 = x1 - 1.4, y = 0;
    shelter(x0, x1, z0, z1, y, x0, z0, 1);
    bench(x0 + 0.42, (z0 + z1) / 2, 'z'); sign(x1 + 0.6, z1 + 1.2, ['BUS', 'STOP', '6 · 146'], '#1f4f9a', 'z'); }
  for (const z of [30, 92, 150, 205]) if (clearX(C.x0 - 3.4, z)) bin(C.x0 - 3.4, z);
  for (const z of [44, 170]) hydrant(C.x1 + 0.9, z);

  // ------------------------------------------------------------------ put it all in the world
  for (const [x, y, z] of bikeRow) bike(x, y, z, g.blue);
  const add = m => { m.matrixAutoUpdate = false; m.updateMatrix(); group.add(m); };
  if (!frost.empty) add(frost.mesh(hedgeMaterial()));
  for (const k2 in g) if (!g[k2].empty) { const m = g[k2].mesh(mat[k2]); if (k2 === 'glass') m.renderOrder = 5; if (k2 === 'frit' || k2 === 'streak') m.renderOrder = 6; add(m); }
  if (twig.length) add(new THREE.Mesh(mergeGeometries(twig), std({ color: 0x2a221c, roughness: 0.9, emissive: 0x1a1d26, emissiveIntensity: 0.9 })));
  if (wheel.length) add(new THREE.Mesh(mergeGeometries(wheel), mat.black));
  for (const m of extra) add(m);
}
