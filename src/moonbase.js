// The mice's own base, under the cheese of the Moon. The museum on the plain is for the art; this is where the glowing mice
// live and work, and it is theirs to show you.
//
//   The way down: a ramp cut into the plain west of the craft, open to the sky for its first few metres, then a tunnel
//   lined with green crystal, down to a cavern eight metres under the plain, as wide as a city block:
//     the hangar     their saucers (small, mouse-shaped) resting in bays round a shaft up to the sky, mice at work round them
//     the control    a desk of screens and a board of the day's errands, three mice at it
//     the hall       their sculptures: a monument to every toy you drove tonight, a mouse holding up a saucer, the museum's
//                    lions and a few of its famous pictures done again in cheese and moon rock, the mousey way
//     the garden     glowing plants that sway, a pond of light with moonfish in it (the glowing fish of Monroe Harbor)
//   and on the plain, their landing pad, and great green crystals catching the light.
//
// moonBasePlan(P) puts what is solid into the Moon's plan (src/moon.js moonPlan); opening(x, z) is where the plain has a
// hole in it (the ramp's open cut, the shaft); buildMoonBase(P, opts) makes the meshes. The cavern is lit by nothing but
// its own glow: its walls are plain colour with the crystals' and the garden's light worked into them, so they need no
// light in the scene, and it is drawn only while the camera is down there or looking in.

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { fbm } from './cosmos.js';
import { buildVehicle, VEHICLES } from './garage.js';
import { buildKind, Fish } from './fishkit.js';
import { mouseFigure, NECK } from './moonmice.js';

const TAU = Math.PI * 2, NOWHERE = -1e9;
export const CAVE = { x: -78, z: 8, rx: 28, rz: 34, y: -8 };
export const TUN = { x0: -50.5, x1: -24, z0: 4, z1: 10, open: -34, bottom: -48 };     // the ramp down: from the plain at x1 to the floor at `bottom`; open to the sky to `open`
export const SHAFT = { x: -80, z: -12, r: 3.2 };                                       // the hangar's shaft up to the sky
export const PAD = { x: -32, z: 24, r: 4.2 };                                          // their landing pad on the plain
export const MOUTH = { x: (TUN.x1 + TUN.open) / 2 + 2, z: (TUN.z0 + TUN.z1) / 2 };      // the head of the ramp
export const POND = { x: -80, z: 31, r: 4.2 };
export const DAIS = { x: -76, z: 9, r: 5.2 };                                          // the monument to your toys
export const ZONES = [
  { id: 'mouth', name: 'The way down', in: (x, z, y) => y > -1.5 && x < TUN.x1 + 3 && x > TUN.open && z > TUN.z0 - 3 && z < TUN.z1 + 3 },
  { id: 'hangar', name: 'The mouse hangar', in: (x, z, y) => y < -6 && inCave(x, z) && z < -3 },
  { id: 'control', name: 'The control room', in: (x, z, y) => y < -6 && inCave(x, z) && x < -94 && z > -5 && z < 12 },
  { id: 'monument', name: 'The monument', in: (x, z, y) => y < -6 && Math.hypot(x - DAIS.x, z - DAIS.z) < DAIS.r + 3 },
  { id: 'hall', name: 'The sculpture hall', in: (x, z, y) => y < -6 && inCave(x, z) && z > -3 && z < 22 && x > -94 },
  { id: 'garden', name: 'The moon garden', in: (x, z, y) => y < -6 && inCave(x, z) && z > 22 },
  { id: 'pad', name: 'The landing pad', in: (x, z, y) => y > -1 && Math.hypot(x - PAD.x, z - PAD.z) < PAD.r + 2 },
];
export const inCave = (x, z) => ((x - CAVE.x) / CAVE.rx) ** 2 + ((z - CAVE.z) / CAVE.rz) ** 2 < 1;
export const rampH = x => x >= TUN.x1 ? 0 : x <= TUN.bottom ? CAVE.y : CAVE.y * (TUN.x1 - x) / (TUN.x1 - TUN.bottom);
export const opening = (x, z) => (x > TUN.open && x < TUN.x1 && z > TUN.z0 && z < TUN.z1) || Math.hypot(x - SHAFT.x, z - SHAFT.z) < SHAFT.r;
const cnoise = fbm(57);
export const caveCeil = (x, z) => -2.1 - 1.5 * cnoise(x * 0.06 + 3, z * 0.06 + 7, 3) - (inCave(x, z) ? 0 : 0) ;
export const inTunnel = (x, z) => x > TUN.x0 - 1 && x < TUN.x1 && z > TUN.z0 && z < TUN.z1;

// The sculptures and what else stands on the cavern floor: [x, z, half-width, height] (solid, for the plan and the camera).
const STANDS = [];

// ---------------------------------------------------------------- the plan --
/** opts.monument: how many toys stand round the dais (buildMoonBase's opts.driven, as it will draw them). */
export function moonBasePlan(P, opts = {}) {
  const S = P.surfaces, O = P.obstacles, Y = CAVE.y;
  // the ramp down, its walls (a kerb along the top of the cut, out on the plain), the tunnel's roof
  S.push({ x0: TUN.bottom, x1: TUN.x1, z0: TUN.z0, z1: TUN.z1, axis: 'x', h0: Y, h1: 0, thick: 0.6, fixed: true, skin: 'cheese' });
  for (const [z0, z1] of [[TUN.z0 - 0.5, TUN.z0], [TUN.z1, TUN.z1 + 0.5]]) O.push({ x0: TUN.x0 - 1, x1: TUN.x1, z0, z1, y0: Y - 1, y1: 0.42 });
  O.push({ x0: TUN.open - 0.4, x1: TUN.open, z0: TUN.z0 - 0.5, z1: TUN.z1 + 0.5, y0: -1.6, y1: 0.42 });      // the face of the cut over the tunnel's mouth (a toy flying off the top meets it, and drops to the ramp)
  const roof = { x0: TUN.x0, x1: TUN.open, z0: TUN.z0 - 0.5, z1: TUN.z1 + 0.5, axis: null, h0: -1.25, h1: -1.25, thick: 0.3, fixed: true, skin: 'cheese' }; S.push(roof); P.slabs.push(roof);
  // the cavern: its floor, its wall round an ellipse (the tunnel comes in on the east), its ceiling (not over the shaft)
  S.push({ x0: CAVE.x - CAVE.rx - 2, x1: TUN.bottom, z0: CAVE.z - CAVE.rz - 2, z1: CAVE.z + CAVE.rz + 2, axis: null, h0: Y, h1: Y, thick: 1, fixed: true, skin: 'cheese' });
  const n = 150;
  for (let i = 0; i < n; i++) { const a = i / n * TAU, x = CAVE.x + Math.sin(a) * (CAVE.rx + 0.3), z = CAVE.z + Math.cos(a) * (CAVE.rz + 0.3); if (x > CAVE.x && z > TUN.z0 - 0.2 && z < TUN.z1 + 0.2) continue; O.push({ x0: x - 0.7, x1: x + 0.7, z0: z - 0.7, z1: z + 0.7, y0: Y - 1, y1: -1.3, ring: true }); }
  const ceil = { x0: CAVE.x - CAVE.rx - 1, x1: TUN.x0, z0: CAVE.z - CAVE.rz - 1, z1: CAVE.z + CAVE.rz + 1, axis: null, thick: 0.35, fixed: true, skin: 'cheese', fn: (x, z) => Math.hypot(x - SHAFT.x, z - SHAFT.z) < SHAFT.r ? NOWHERE : caveCeil(x, z) + 0.35 };
  S.push(ceil); P.slabs.push(ceil);
  // the shaft: its wall from the cavern's ceiling up to a lip on the plain (a kerb a toy can hop; fall in and you land below)
  for (let i = 0; i < 28; i++) { const a = i / 28 * TAU, x = SHAFT.x + Math.sin(a) * (SHAFT.r + 0.25), z = SHAFT.z + Math.cos(a) * (SHAFT.r + 0.25); O.push({ x0: x - 0.38, x1: x + 0.38, z0: z - 0.38, z1: z + 0.38, y0: -3.6, y1: 0.18 }); }
  // the landing pad, a disc a hand high
  S.push({ x0: PAD.x - PAD.r, x1: PAD.x + PAD.r, z0: PAD.z - PAD.r, z1: PAD.z + PAD.r, axis: null, thick: 0.4, fixed: true, skin: 'pad', fn: (x, z) => Math.hypot(x - PAD.x, z - PAD.z) < PAD.r ? 0.08 : NOWHERE });
  // what stands on the cavern floor
  for (const [x, z, w, h] of STANDS_PLAN()) O.push({ x0: x - w, x1: x + w, z0: z - w, z1: z + w, y0: Y - 0.5, y1: Y + h });
  const nm = Math.max(1, opts.monument || 2);
  for (let i = 0; i < nm; i++) { const a = i / nm * TAU + 0.4, x = DAIS.x + Math.sin(a) * (DAIS.r - 0.4), z = DAIS.z + Math.cos(a) * (DAIS.r - 0.4); O.push({ x0: x - 0.58, x1: x + 0.58, z0: z - 0.58, z1: z + 0.58, y0: Y - 0.5, y1: Y + 2.0 }); }
  // the dais and the bays' pads, a few centimetres up (low enough to drive onto)
  const disc = (cx, cz, r, h) => S.push({ x0: cx - r, x1: cx + r, z0: cz - r, z1: cz + r, axis: null, thick: 0.3, fixed: true, skin: 'cheese', fn: (x, z) => Math.hypot(x - cx, z - cz) < r ? Y + h : NOWHERE });
  disc(DAIS.x, DAIS.z, DAIS.r + 0.1, 0.08); for (const b of PIECES.bays) disc(b.x, b.z, 1.05, 0.06);
  // the pond's rim of stones
  for (let i = 0; i < 26; i++) { const a = i / 26 * TAU, x = POND.x + Math.sin(a) * (POND.r + 0.3), z = POND.z + Math.cos(a) * (POND.r + 0.3); O.push({ x0: x - 0.4, x1: x + 0.4, z0: z - 0.4, z1: z + 0.4, y0: Y - 0.5, y1: Y + 0.32 }); }
  P.base = { CAVE, TUN, SHAFT, PAD, ZONES };
}
// The pieces on the cavern floor, where they stand (the same list for the plan and the meshes).
export const PIECES = {
  lifter: { x: -91, z: 16, w: 1.6, h: 6 }, lions: [{ x: -62, z: 3, w: 1.0, h: 1.6, yaw: Math.PI / 2 }, { x: -62, z: 13, w: 1.0, h: 1.6, yaw: Math.PI / 2 }],
  gothic: { x: -89, z: 1.5, w: 1.1, h: 2.4 }, sunday: { x: -66, z: 19.5, w: 1.0, h: 2.6 }, bedroom: { x: -87, z: -2.5, w: 1.3, h: 1.4 }, cairn: { x: -70, z: -1, w: 0.8, h: 2.2 },
  desk: { x: -101, z: 3, r: 4.2 }, board: { x: -105.2, z: 3 },
  bays: Array.from({ length: 8 }, (_, i) => { const a = Math.PI + (i - 3.5) * 0.24; return { x: SHAFT.x + Math.sin(a) * 10.5, z: SHAFT.z + Math.cos(a) * 10.5 + 1.0, a }; }),
  crates: [[-66, -16], [-67.5, -17.2], [-94, -16], [-92.6, -18]],
};
function STANDS_PLAN() {
  const P = PIECES, out = [[P.lifter.x, P.lifter.z, P.lifter.w, P.lifter.h], [P.gothic.x, P.gothic.z, P.gothic.w, P.gothic.h], [P.sunday.x, P.sunday.z, P.sunday.w, P.sunday.h], [P.bedroom.x, P.bedroom.z, P.bedroom.w, P.bedroom.h], [P.cairn.x, P.cairn.z, P.cairn.w, P.cairn.h]];
  for (const l of P.lions) out.push([l.x, l.z, l.w, l.h]);
  for (const [x, z] of P.crates) out.push([x, z, 0.6, 1.0]);
  for (let i = 0; i < 7; i++) { const a = -0.75 + i * 0.25, x = P.desk.x + Math.sin(a + Math.PI / 2) * -1.3 + 1.3, z = P.desk.z + Math.sin(a) * 3.2; out.push([x + 0.6, z, 0.45, 0.85]); }
  return out;
}
void STANDS;

// ---------------------------------------------------------------- materials --
// Cheese lit by its own glow: a colour per vertex, worked out once from where the lights of the place are.
function bake(geo, base, lights, amb = 0.13, cheesy = true) {
  geo = geo.index ? geo.toNonIndexed() : geo; geo.computeVertexNormals();
  const p = geo.attributes.position, nn = geo.attributes.normal, col = new Float32Array(p.count * 3), c = new THREE.Color(base), n = fbm(91);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    let r = amb, g = amb, b = amb;
    for (const L of lights) { const dx = L.x - x, dy = L.y - y, dz = L.z - z, d2 = dx * dx + dy * dy + dz * dz, d = Math.sqrt(d2) || 1; const face = Math.max(0.25, (dx * nn.getX(i) + dy * nn.getY(i) + dz * nn.getZ(i)) / d); const q = 1 + d2 / (L.r * L.r), k = L.k * face / (q * q); r += L.c[0] * k; g += L.c[1] * k; b += L.c[2] * k; }      // (falling away quickly: a pool of light round each, darkness between)
    const hole = cheesy ? (n(x * 0.35 + 5, (y + z) * 0.35, 2) > 0.66 ? 0.55 : 1) * (0.88 + 0.24 * n(x * 0.9, z * 0.9 + y, 2)) : 1;      // (the holes in the cheese: darker pockets)
    const T = v => 1 - Math.exp(-1.25 * v);      // (a soft knee: lit up close, never washed out to white)
    const k2 = hole * (cheesy ? 0.55 : 1);      // (the cavern's own stone kept dim, so its lights and the mice stand out in it)
    col[i * 3] = c.r * T(r) * k2; col[i * 3 + 1] = c.g * T(g) * k2; col[i * 3 + 2] = c.b * T(b) * k2;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); if (geo.attributes.uv) geo.deleteAttribute('uv');
  return geo;
}
const basic = new THREE.MeshBasicMaterial({ vertexColors: true });
// (pieces to be merged and baked: positions only, the rest worked out after)
const P0 = g => { const t = g.index ? g.toNonIndexed() : g; for (const k of Object.keys(t.attributes)) if (k !== 'position') t.deleteAttribute(k); return t; };
const merge = list => mergeGeometries(list.map(P0));
const canvasTex = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
// A small plaque on a post: its lines in the game's serif, cream on dark.
function plaque(lines, w = 0.9) {
  const H = Math.round(70 + lines.length * 46), tex = canvasTex(512, H, (x, W, h) => {
    x.fillStyle = '#16120a'; x.fillRect(0, 0, W, h); x.strokeStyle = '#c9a24e'; x.lineWidth = 6; x.strokeRect(6, 6, W - 12, h - 12);
    x.textAlign = 'center'; lines.forEach((t, i) => { let s = i ? 30 : 40; do { x.font = `${i ? 'italic 400' : '700'} ${s}px "Iowan Old Style", Palatino, Georgia, serif`; s -= 2; } while (x.measureText(t).width > W - 40 && s > 14); x.fillStyle = i ? '#e6d8b0' : '#fff3cf'; x.fillText(t, W / 2, 56 + i * 44); });
  });
  const g = new THREE.Group(), hh = w * H / 512;
  g.add(new THREE.Mesh(new THREE.PlaneGeometry(w, hh).translate(0, 0.62, 0.03).rotateX(-0.35), new THREE.MeshBasicMaterial({ map: tex, color: new THREE.Color(0.85, 0.85, 0.85) })));
  g.add(new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.6, 0.06).translate(0, 0.3, 0), new THREE.MeshBasicMaterial({ color: 0x3a2c14 })));
  return g;
}

// ---------------------------------------------------------------- the meshes --
/** opts: { lowmem, driven: [vehicle ids], caught: glowing fish caught on Monroe Harbor } */
export function buildMoonBase(P, opts = {}) {
  const low = !!opts.lowmem, Y = CAVE.y, rnd = (s => () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; })(404);
  const surface = new THREE.Group(); surface.name = 'mouse base (plain)';
  const cave = new THREE.Group(); cave.name = 'mouse base (under)';
  // ---- where the light comes from, for the baking: crystals along the walls, the garden, the bays, the screens
  const crystals = [];       // [x, y, z, size, tint]
  const L = [];
  const cl = (x, y, z, size, tint = 0) => { crystals.push([x, y, z, size, tint]); L.push({ x, y: y + size * 0.6, z, r: 1.6 + size * 1.6, k: 0.55 + size * 0.3, c: tint === 1 ? [0.2, 0.9, 0.85] : [0.25, 1.0, 0.35] }); };
  const nWall = low ? 18 : 30;
  for (let i = 0; i < nWall; i++) { const a = i / nWall * TAU + 0.1; const x = CAVE.x + Math.sin(a) * (CAVE.rx - 0.8), z = CAVE.z + Math.cos(a) * (CAVE.rz - 0.8); if (x > CAVE.x && Math.abs(z - 7) < 5) continue; cl(x, Y, z, 0.7 + rnd() * 0.9, i % 4 === 0 ? 1 : 0); }
  for (let x = TUN.x0 + 2; x < TUN.open; x += low ? 5 : 3.2) for (const z of [TUN.z0 + 0.35, TUN.z1 - 0.35]) cl(x, rampH(x), z, 0.35 + rnd() * 0.3);
  for (const b of PIECES.bays) cl(b.x + Math.sin(b.a) * 1.6, Y, b.z + Math.cos(b.a) * 1.6, 0.5, 1);
  L.push({ x: POND.x, y: Y + 1.5, z: POND.z, r: 6, k: 1.2, c: [0.25, 0.95, 0.8] });                       // the pond of light
  L.push({ x: SHAFT.x, y: Y + 5, z: SHAFT.z, r: 6, k: 0.8, c: [0.7, 0.85, 1.0] });                      // the sky down the shaft
  L.push({ x: PIECES.desk.x, y: Y + 1.5, z: PIECES.desk.z, r: 4, k: 0.9, c: [0.4, 1.0, 0.8] });          // the screens
  L.push({ x: DAIS.x, y: Y + 4, z: DAIS.z, r: 6, k: 1.1, c: [1.1, 0.95, 0.6] });                        // the monument, lit warm
  const cheese = 0xe9c56a;

  // ---- the cavern: floor, wall, ceiling
  {
    const fl = new THREE.CircleGeometry(1, 72, 0, TAU); fl.rotateX(-Math.PI / 2); fl.scale(CAVE.rx + 0.5, 1, CAVE.rz + 0.5); fl.translate(CAVE.x, Y + 0.003, CAVE.z);
    const fg = new THREE.PlaneGeometry(CAVE.rx * 2 + 1, CAVE.rz * 2 + 1, 56, 68); fg.rotateX(-Math.PI / 2); fg.translate(CAVE.x, Y + 0.003, CAVE.z); void fl;
    { const fp = fg.attributes.position, ix = fg.index.array, keep = []; for (let i = 0; i < ix.length; i += 3) { let mx = 0, mz = 0; for (let k = 0; k < 3; k++) { mx += fp.getX(ix[i + k]) / 3; mz += fp.getZ(ix[i + k]) / 3; } if (Math.hypot(mx - POND.x, mz - POND.z) > POND.r - 0.4) keep.push(ix[i], ix[i + 1], ix[i + 2]); } fg.setIndex(keep); }      // (a hole for the pond: the fish are under the floor's level)
    cave.add(new THREE.Mesh(bake(fg, 0xcaa553, L, 0.05), basic));
    // the wall: an ellipse of cheese from the floor to the ceiling, bulging and pocked (it leans in at the top)
    const N = 120, R = 6, pos = [], idx = [];
    for (let i = 0; i <= N; i++) { const a = i / N * TAU; for (let j = 0; j <= R; j++) { const t = j / R, bx = Math.sin(a) * CAVE.rx, bz = Math.cos(a) * CAVE.rz, w = 1 + 0.06 * cnoise(a * 4, t * 2, 2) - 0.08 * t * t, x = CAVE.x + bx * w, z = CAVE.z + bz * w; pos.push(x, Y + (caveCeil(x, z) + 0.05 - Y) * t, z); } }
    for (let i = 0; i < N; i++) for (let j = 0; j < R; j++) { const a = i * (R + 1) + j, b = a + R + 1; idx.push(a, a + 1, b, b, a + 1, b + 1); }
    const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); wg.setIndex(idx);
    cave.add(new THREE.Mesh(bake(wg, cheese, L, 0.05), new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide })));
    // the ceiling: lumpy, hanging lower here and there; a round hole for the shaft
    const cg = new THREE.PlaneGeometry(CAVE.rx * 2 + 2, CAVE.rz * 2 + 2, 56, 68); cg.rotateX(Math.PI / 2); cg.translate(CAVE.x, 0, CAVE.z);
    const cp = cg.attributes.position; for (let i = 0; i < cp.count; i++) cp.setY(i, caveCeil(cp.getX(i), cp.getZ(i)));
    const cgi = cg.index.array, keep = []; for (let i = 0; i < cgi.length; i += 3) { let mx = 0, mz = 0; for (let k = 0; k < 3; k++) { mx += cp.getX(cgi[i + k]) / 3; mz += cp.getZ(cgi[i + k]) / 3; } if (Math.hypot(mx - SHAFT.x, mz - SHAFT.z) > SHAFT.r - 0.2) keep.push(cgi[i], cgi[i + 1], cgi[i + 2]); }
    cg.setIndex(keep);
    cave.add(new THREE.Mesh(bake(cg, 0xd8b45e, L, 0.035), basic));
    // stalactites of cheese, hanging
    const st = [];
    for (let i = 0; i < (low ? 30 : 70); i++) { const a = rnd() * TAU, d = Math.sqrt(rnd()) * 0.92, x = CAVE.x + Math.sin(a) * CAVE.rx * d, z = CAVE.z + Math.cos(a) * CAVE.rz * d; if (Math.hypot(x - SHAFT.x, z - SHAFT.z) < SHAFT.r + 1) continue; const h = 0.4 + rnd() * 1.4, r = 0.15 + rnd() * 0.35; st.push(new THREE.ConeGeometry(r, h, 7).rotateX(Math.PI).translate(x, caveCeil(x, z) - h / 2 + 0.05, z)); }
    cave.add(new THREE.Mesh(bake(merge(st), 0xe0bb60, L, 0.05), basic));
  }
  // ---- the tunnel: walls, roof, the floor of the ramp drawn; the open cut's sides, a kerb along its top
  {
    const wallsG = [], n = 26;
    for (const zs of [TUN.z0, TUN.z1]) {
      const pos = [], idx = [];
      for (let i = 0; i <= n; i++) { const x = TUN.x0 - 0.5 + (TUN.x1 - TUN.x0 + 0.5) * i / n, top = x > TUN.open ? 0.42 : -1.25; pos.push(x, rampH(x) - 0.4, zs, x, top, zs); if (i < n) { const k = i * 2; idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); } }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); wallsG.push(g);
    }
    wallsG.push(new THREE.BoxGeometry(0.4, 2.02, TUN.z1 - TUN.z0 + 1).translate(TUN.open - 0.2, -0.59, (TUN.z0 + TUN.z1) / 2));      // the face over the mouth
    for (const [z0, z1] of [[TUN.z0 - 0.5, TUN.z0], [TUN.z1, TUN.z1 + 0.5]]) wallsG.push(new THREE.BoxGeometry(TUN.x1 - TUN.open + 0.6, 0.42, z1 - z0).translate((TUN.x1 + TUN.open) / 2 - 0.3, 0.21, (z0 + z1) / 2));      // the kerb on the plain
    surface.add(new THREE.Mesh(bake(merge(wallsG), cheese, L.concat([{ x: TUN.x1, y: 4, z: 7, r: 14, k: 1.6, c: [1, 0.95, 0.85] }]), 0.18), new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide })));
    const rf = new THREE.PlaneGeometry(TUN.open - TUN.x0, TUN.z1 - TUN.z0 + 1, 12, 3); rf.rotateX(Math.PI / 2); rf.translate((TUN.open + TUN.x0) / 2, -1.25, (TUN.z0 + TUN.z1) / 2);
    cave.add(new THREE.Mesh(bake(rf, 0xd0ad5a, L, 0.05), basic));
    const fl = new THREE.PlaneGeometry(TUN.x1 - TUN.x0, TUN.z1 - TUN.z0, 24, 2); fl.rotateX(-Math.PI / 2); const fp = fl.attributes.position; for (let i = 0; i < fp.count; i++) { const x = fp.getX(i) + (TUN.x1 + TUN.x0) / 2; fp.setXYZ(i, x, rampH(x) + 0.004, fp.getZ(i) + (TUN.z0 + TUN.z1) / 2); }
    surface.add(new THREE.Mesh(bake(fl, 0xbf9a4c, L.concat([{ x: TUN.x1, y: 4, z: 7, r: 14, k: 1.6, c: [1, 0.95, 0.85] }]), 0.16, false), basic));
    // a sign at the head of the ramp, in the mice's own hand
    const sign = plaque(['THE WAY DOWN', 'mice only (and friends)'], 1.6); sign.position.set(TUN.x1 + 1.4, 0, TUN.z1 + 1.6); sign.rotation.y = Math.PI / 2 - 0.5; surface.add(sign);
    P.obstacles.push({ x0: TUN.x1 + 1.3, x1: TUN.x1 + 1.5, z0: TUN.z1 + 1.5, z1: TUN.z1 + 1.7, y0: -1, y1: 1.2 });
  }
  // ---- the shaft: its wall, and a lip on the plain
  {
    const sh = new THREE.CylinderGeometry(SHAFT.r, SHAFT.r, 3.8, 32, 3, true); sh.translate(SHAFT.x, -1.7, SHAFT.z);
    cave.add(new THREE.Mesh(bake(sh, cheese, L.concat([{ x: SHAFT.x, y: 1, z: SHAFT.z, r: 4, k: 1.4, c: [0.8, 0.9, 1] }]), 0.15), new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide })));
    const lip = new THREE.TorusGeometry(SHAFT.r + 0.25, 0.28, 8, 40); lip.rotateX(Math.PI / 2); lip.translate(SHAFT.x, 0.02, SHAFT.z);
    surface.add(new THREE.Mesh(lip, new THREE.MeshStandardMaterial({ color: 0xe2c06a, roughness: 0.9, emissive: 0x4a3410, emissiveIntensity: 0.5 })));
  }
  // ---- the landing pad on the plain: a disc with a ring of green lamps
  {
    const pad = new THREE.CylinderGeometry(PAD.r, PAD.r + 0.1, 0.1, 48); pad.translate(PAD.x, 0.04, PAD.z);
    const padT = canvasTex(512, 512, (x, w, h) => { x.fillStyle = '#2b2f36'; x.fillRect(0, 0, w, h); x.strokeStyle = '#7cff9e'; x.lineWidth = 10; x.beginPath(); x.arc(w / 2, h / 2, w * 0.4, 0, TAU); x.stroke(); x.fillStyle = '#7cff9e'; x.font = '700 120px Georgia, serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('M', w / 2, h / 2 + 6); });
    surface.add(new THREE.Mesh(pad, [new THREE.MeshStandardMaterial({ color: 0x3a3f46, roughness: 0.6 }), new THREE.MeshStandardMaterial({ map: padT, emissiveMap: padT, emissive: 0xffffff, emissiveIntensity: 0.5, roughness: 0.6 }), new THREE.MeshStandardMaterial({ color: 0x3a3f46 })]));
    const lamps = []; for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; lamps.push(new THREE.SphereGeometry(0.09, 8, 6).translate(PAD.x + Math.sin(a) * (PAD.r - 0.1), 0.14, PAD.z + Math.cos(a) * (PAD.r - 0.1))); }
    surface.add(new THREE.Mesh(mergeGeometries(lamps), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.5, 2.2, 0.9) })));
    const s = plaque(['LANDING PAD', 'errands in, errands out'], 1.2); s.position.set(PAD.x + PAD.r + 0.9, 0, PAD.z - 1.2); s.rotation.y = Math.PI / 2 + 0.3; surface.add(s);
  }
  // ---- the hangar: the bays (pads, a green ring each), crates of cheese, a sign
  {
    const pads = [], rings = [];
    for (const b of PIECES.bays) { pads.push(new THREE.CylinderGeometry(1.0, 1.05, 0.06, 28).translate(b.x, Y + 0.03, b.z)); const r = new THREE.TorusGeometry(0.95, 0.035, 5, 32); r.rotateX(Math.PI / 2); r.translate(b.x, Y + 0.065, b.z); rings.push(r); }
    cave.add(new THREE.Mesh(bake(merge(pads), 0x5a6068, L, 0.25, false), basic));
    cave.add(new THREE.Mesh(mergeGeometries(rings), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.45, 2.0, 0.8) })));
    const wheels = []; for (const [x, z] of PIECES.crates) for (let k = 0; k < 3; k++) wheels.push(new THREE.CylinderGeometry(0.5, 0.5, 0.3, 18).translate(x + (k % 2) * 0.08, Y + 0.15 + k * 0.31, z - (k % 2) * 0.06));      // wheels of cheese, stacked
    cave.add(new THREE.Mesh(bake(merge(wheels), 0xf0cc6a, L, 0.3, false), basic));
    const s = plaque(['THE HANGAR', 'saucers in for the night'], 1.4); s.position.set(SHAFT.x + 6, Y, SHAFT.z + 7.5); s.rotation.y = Math.PI + 0.6; cave.add(s);
  }
  // ---- the control room: a curved desk of screens, and the board of the day's errands on the wall
  {
    const D = PIECES.desk, parts = [], scr = [];
    for (let i = 0; i < 7; i++) { const a = -0.75 + i * 0.25, x = D.x + Math.sin(a + Math.PI / 2) * -1.3 + 1.9, z = D.z + Math.sin(a) * 3.2; parts.push(new THREE.BoxGeometry(0.8, 0.8, 0.9).rotateY(-a * 0.6).translate(x, Y + 0.4, z)); scr.push(new THREE.PlaneGeometry(0.62, 0.36).rotateY(Math.PI / 2 - a * 0.6).rotateZ(0).translate(x - 0.35, Y + 1.02, z)); }
    cave.add(new THREE.Mesh(bake(merge(parts), 0x4a5058, L, 0.3, false), basic));
    const scrT = canvasTex(256, 160, (x, w, h) => { x.fillStyle = '#041a10'; x.fillRect(0, 0, w, h); x.strokeStyle = '#3cff8a'; x.lineWidth = 2; for (let i = 0; i < 5; i++) { x.beginPath(); x.arc(w * 0.5, h * 0.55, 14 + i * 14, 0, TAU); x.globalAlpha = 0.4; x.stroke(); } x.globalAlpha = 1; x.fillStyle = '#9fffc4'; for (let i = 0; i < 9; i++) { x.beginPath(); x.arc(30 + (i * 73) % 200, 30 + (i * 41) % 110, 3, 0, TAU); x.fill(); } x.font = 'bold 16px ui-monospace, Menlo, monospace'; x.fillText('ERRANDS 14', 10, 18); });
    cave.add(new THREE.Mesh(mergeGeometries(scr), new THREE.MeshBasicMaterial({ map: scrT, color: new THREE.Color(1.3, 1.3, 1.3), side: THREE.DoubleSide })));
    const boardT = canvasTex(768, 448, (x, w, h) => { x.fillStyle = '#0d1410'; x.fillRect(0, 0, w, h); x.strokeStyle = '#3cff8a'; x.lineWidth = 6; x.strokeRect(8, 8, w - 16, h - 16); x.fillStyle = '#7cffae'; x.font = 'bold 44px ui-monospace, Menlo, monospace'; x.fillText('ERRANDS TODAY', 34, 70); x.font = '30px ui-monospace, Menlo, monospace'; ['CHEESE TO THE GARDEN ..... OUT', 'MOON ROCKS TO THE HALL ... DONE', 'FLOWERS TO THE MUSEUM .... OUT', 'THE CARRIER ............. HERE', 'THE ART ............. UNLOADING', 'THE VISITOR ........ OUR FRIEND'].forEach((t, i) => x.fillText(t, 34, 132 + i * 50)); });
    const board = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 2.45), new THREE.MeshBasicMaterial({ map: boardT, color: new THREE.Color(1.15, 1.15, 1.15) })); board.position.set(PIECES.board.x + 0.6, Y + 2.6, PIECES.board.z); board.rotation.y = Math.PI / 2; cave.add(board);
  }
  // ---- the sculptures
  const fig = mouseFigure(), mouse = (pitch, s, x, y, z, yaw, headUp = 0) => {
    const M = new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(pitch, yaw, 0, 'YXZ')), new THREE.Vector3(s, s, s));
    const b = fig.body.clone().applyMatrix4(M), h = fig.head.clone().applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(...NECK), new THREE.Quaternion().setFromEuler(new THREE.Euler(-headUp, 0, 0)), new THREE.Vector3(1, 1, 1)).premultiply(M));
    for (const g of [b, h]) g.deleteAttribute('color');
    return [b, h];
  };
  const carved = [], rock = [], plaques = [];
  const plinth = (x, z, w, h, list = carved) => list.push(new THREE.BoxGeometry(w, h, w).translate(x, Y + h / 2, z));
  const pl = (lines, x, z, yaw) => { const p = plaque(lines, 1.0); p.position.set(x, Y, z); p.rotation.y = yaw; cave.add(p); plaques.push(p); };
  {
    const P2 = PIECES;
    // The Lifter: a great mouse, sitting up, holding a saucer over its head
    const lf = P2.lifter; plinth(lf.x, lf.z, 2.6, 0.5);
    carved.push(...mouse(-1.25, 18, lf.x, Y + 0.5, lf.z, Math.PI * 0.75, 0.6));
    for (const s of [-1, 1]) { const arm = new THREE.CapsuleGeometry(0.11, 1.5, 3, 8); arm.rotateZ(s * 0.35); const off = new THREE.Vector3(s * 0.45, 3.0, 0.15).applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI * 0.75); arm.translate(lf.x + off.x, Y + 0.5 + off.y, lf.z + off.z); carved.push(arm); }
    { const sa = new THREE.LatheGeometry([[0, -0.2], [0.9, -0.15], [1.5, 0], [0.9, 0.18], [0.45, 0.32], [0, 0.4]].map(([r, y]) => new THREE.Vector2(r, y)), 28); sa.translate(lf.x, Y + 4.6, lf.z); carved.push(sa); }
    pl(['The Lifter', 'A mouse holding up a saucer. Cheddar, carved by many mice.'], lf.x + 2.2, lf.z - 1.6, -Math.PI / 2 + 0.6);
    // Two Lions, after Edward Kemeys: two mice lying like the bronzes on the museum's steps, in moon rock gone green
    for (const l of P2.lions) { plinth(l.x, l.z, 1.6, 0.8, rock); rock.push(...mouse(0, 9, l.x, Y + 0.8, l.z, l.yaw, 0.35)); }
    pl(['Two Lions', 'After Edward Kemeys: the pair on the museum’s front steps. Moon rock.'], (P2.lions[0].x + P2.lions[1].x) / 2 + 1.4, (P2.lions[0].z + P2.lions[1].z) / 2, Math.PI / 2);
    // The Farmers, after American Gothic: two mice standing straight, one holding a fork
    { const g = P2.gothic; plinth(g.x, g.z, 2.0, 0.3); for (const s of [-1, 1]) carved.push(...mouse(-1.45, 12, g.x + s * 0.45, Y + 0.3, g.z, Math.PI / 2, 0.1)); const fork = [new THREE.CylinderGeometry(0.03, 0.03, 1.9, 6).translate(0, 0.95, 0)]; for (const k of [-1, 0, 1]) fork.push(new THREE.CylinderGeometry(0.02, 0.012, 0.4, 5).translate(k * 0.08, 2.05, 0)); fork.push(new THREE.BoxGeometry(0.2, 0.03, 0.03).translate(0, 1.86, 0)); const f = mergeGeometries(fork); f.translate(g.x + 0.85, Y + 0.3, g.z + 0.35); carved.push(f);
      pl(['The Farmers', 'After Grant Wood, American Gothic. Cheese, and a fork.'], g.x + 1.6, g.z + 1.6, Math.PI / 2 + 0.4); }
    // A Sunday, after Seurat: a mouse in profile, upright, under a parasol, and a small one beside it
    { const s = P2.sunday; plinth(s.x, s.z, 1.8, 0.3); carved.push(...mouse(-1.4, 13, s.x, Y + 0.3, s.z, Math.PI, 0.05), ...mouse(-0.9, 7, s.x + 0.6, Y + 0.3, s.z - 0.3, Math.PI, 0.3)); carved.push(new THREE.ConeGeometry(0.75, 0.3, 14, 1, true).translate(s.x - 0.2, Y + 2.35, s.z + 0.1), new THREE.CylinderGeometry(0.02, 0.02, 1.4, 5).translate(s.x - 0.2, Y + 1.6, s.z + 0.1));
      pl(['A Sunday', 'After Georges Seurat, on the island of La Grande Jatte. Cheese.'], s.x + 1.5, s.z - 1.3, Math.PI * 0.75); }
    // The Bedroom, after van Gogh: a little bed and a chair, and a mouse asleep in the bed
    { const b = P2.bedroom; plinth(b.x, b.z, 2.4, 0.25); carved.push(new THREE.BoxGeometry(0.9, 0.3, 1.6).translate(b.x, Y + 0.5, b.z), new THREE.BoxGeometry(0.9, 0.7, 0.08).translate(b.x, Y + 0.6, b.z - 0.8), new THREE.BoxGeometry(0.9, 0.45, 0.08).translate(b.x, Y + 0.5, b.z + 0.8), new THREE.BoxGeometry(0.4, 0.06, 0.4).translate(b.x + 0.85, Y + 0.6, b.z + 0.2), new THREE.BoxGeometry(0.4, 0.5, 0.05).translate(b.x + 0.85, Y + 0.85, b.z + 0.0)); for (const [dx, dz] of [[-0.17, -0.17], [0.17, -0.17], [-0.17, 0.17], [0.17, 0.17]]) carved.push(new THREE.CylinderGeometry(0.025, 0.025, 0.35, 5).translate(b.x + 0.85 + dx, Y + 0.42, b.z + 0.2 + dz));
      carved.push(...mouse(0, 6, b.x, Y + 0.64, b.z - 0.2, 0, 0)); pl(['The Bedroom', 'After Vincent van Gogh. Somebody is asleep in it. Cheese.'], b.x + 1.6, b.z - 1.0, Math.PI / 2 + 0.3); }
    // Moon Mouse: a cairn of moon rocks in the shape of a mouse sitting up
    { const c = P2.cairn; for (const [r, y, z] of [[0.62, 0.55, 0], [0.48, 1.35, 0.05], [0.34, 1.95, 0.18], [0.14, 2.28, 0.08], [0.14, 2.28, 0.28]]) rock.push(new THREE.IcosahedronGeometry(r, 1).scale(1, 0.85, 1).translate(c.x + (y > 2.2 ? (z > 0.2 ? 0.16 : -0.16) : 0), Y + y, c.z + (y > 2.2 ? 0.1 : z)));
      pl(['Moon Mouse', 'Stacked moon rocks.'], c.x + 1.1, c.z + 1.0, Math.PI / 2 + 0.8); }
  }
  // ---- the monument: every toy you drove tonight, on its own plinth round a dais, carved in cheese
  const monument = { ids: [] };
  {
    const ids = (opts.driven && opts.driven.length ? opts.driven : ['buggy', 'quad']).filter(id => VEHICLES.some(v => v.id === id)).slice(0, 12);
    monument.ids = ids;
    carved.push(new THREE.CylinderGeometry(DAIS.r, DAIS.r + 0.1, 0.08, 48).translate(DAIS.x, Y + 0.04, DAIS.z));
    ids.forEach((id, i) => {
      const a = i / ids.length * TAU + 0.4, x = DAIS.x + Math.sin(a) * (DAIS.r - 0.4), z = DAIS.z + Math.cos(a) * (DAIS.r - 0.4);
      carved.push(new THREE.BoxGeometry(1.1, 0.9, 1.1).translate(x, Y + 0.45, z));
      try {
        const m = buildVehicle(id), parts = [], v = VEHICLES.find(q => q.id === id); m.group.updateMatrixWorld(true);
        m.group.traverse(o => { if (!o.isMesh || !o.geometry || !o.geometry.attributes.position || o.material && (o.material.transparent || o.material.blending === THREE.AdditiveBlending)) return; let g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone(); for (const k of Object.keys(g.attributes)) if (k !== 'position') g.deleteAttribute(k); g.applyMatrix4(o.matrixWorld); parts.push(g); });
        if (parts.length) {
          const g = mergeGeometries(parts); g.computeBoundingBox(); const bb = g.boundingBox, size = Math.max(bb.max.x - bb.min.x, bb.max.z - bb.min.z), k = 1.6 / size;
          g.translate(-(bb.min.x + bb.max.x) / 2, -bb.min.y, -(bb.min.z + bb.max.z) / 2); g.scale(k, k, k); g.rotateY(a + Math.PI + 0.5); g.translate(x, Y + 0.9, z); g.computeVertexNormals(); carved.push(g);
        }
        pl([v ? v.name : id, 'Driven tonight. Carved in cheese by the mice.'], DAIS.x + Math.sin(a) * (DAIS.r + 0.9), DAIS.z + Math.cos(a) * (DAIS.r + 0.9), a);
      } catch (e) { console.warn('monument', id, e); }
    });
    const top = plaque(['The Toys That Came', 'Every one you drove tonight. The mice made this for you.'], 1.6); top.position.set(DAIS.x + 1.2, Y + 0.3, DAIS.z + 0.6); top.rotation.y = 0.9; cave.add(top);
  }
  // the carved pieces all one mesh, cheese with a soft glow of its own; the rock another
  { const g = bake(merge(carved), 0xf3d27c, L, 0.22, false);
    cave.add(new THREE.Mesh(g, basic));
    const r = bake(merge(rock), 0x6f8a6a, L, 0.3, false);
    cave.add(new THREE.Mesh(r, basic)); }

  // ---- the garden: plants that glow and sway, the pond of light, moonfish in it
  const garden = { plants: [], fish: [] };
  {
    const nP = low ? 26 : 60, stemG = new THREE.CylinderGeometry(0.03, 0.05, 1, 5).translate(0, 0.5, 0), bulbG = new THREE.IcosahedronGeometry(0.16, 1).scale(1, 1.3, 1);
    const stems = new THREE.InstancedMesh(stemG, new THREE.MeshBasicMaterial({ color: 0x3f8a5a }), nP), bulbs = new THREE.InstancedMesh(bulbG, new THREE.MeshBasicMaterial({ color: 0xffffff }), nP);
    const tints = [[0.08, 1.0, 0.3], [0.05, 0.55, 1.0], [0.55, 0.15, 1.0], [1.0, 0.75, 0.1]], c = new THREE.Color();      // (linear colours under one: they stay colours, not white)
    for (let i = 0; i < nP; i++) {
      let x, z, tries = 0; do { const a = rnd() * TAU, d = POND.r + 1.2 + rnd() * 8; x = POND.x + Math.sin(a) * d * 1.5; z = POND.z + Math.cos(a) * d * 0.7; tries++; } while ((!inCave(x, z) || ((x - CAVE.x) / (CAVE.rx - 2)) ** 2 + ((z - CAVE.z) / (CAVE.rz - 2)) ** 2 > 1 || z < 23) && tries < 30);
      const h = 0.5 + rnd() * 1.6, t = tints[i % 4];
      garden.plants.push({ x, z, h, ph: rnd() * TAU, i }); bulbs.setColorAt(i, c.setRGB(t[0], t[1], t[2]));
      if (i % 3 === 0) L.push({ x, y: Y + h, z, r: 2.5, k: 0.6, c: [t[0] * 0.4, t[1] * 0.4, t[2] * 0.4] });
    }
    stems.frustumCulled = bulbs.frustumCulled = false; cave.add(stems, bulbs); garden.stems = stems; garden.bulbs = bulbs;
    // the pond: a dark basin, and over it a skin of moving light the fish swim under
    const basin = new THREE.SphereGeometry(POND.r, 32, 8, 0, TAU, Math.PI / 2, Math.PI / 2); basin.scale(1, 0.18, 1); basin.translate(POND.x, Y + 0.0, POND.z);
    cave.add(new THREE.Mesh(basin, new THREE.MeshBasicMaterial({ color: 0x041a16, side: THREE.BackSide })));
    const U = garden.u = { t: { value: 0 } };
    const water = new THREE.Mesh(new THREE.CircleGeometry(POND.r, 48).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({ uniforms: U, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: 'varying vec2 vP; void main() { vP = position.xz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `uniform float t; varying vec2 vP; void main() { float r = length(vP); float w = 0.5 + 0.5 * sin(r * 5.0 - t * 1.6) * cos(vP.x * 2.0 + t * 0.7) ; float edge = smoothstep(${POND.r.toFixed(1)}, ${(POND.r - 0.8).toFixed(1)}, r); vec3 c = mix(vec3(0.05, 0.35, 0.3), vec3(0.3, 0.95, 0.75), w * 0.6); gl_FragColor = vec4(c * edge * 0.26, 1.0); }` }));
    water.position.set(POND.x, Y + 0.02, POND.z); water.renderOrder = 5; cave.add(water);
    const stones = []; for (let i = 0; i < 26; i++) { const a = i / 26 * TAU; stones.push(new THREE.IcosahedronGeometry(0.42, 0).scale(1, 0.7, 1).translate(POND.x + Math.sin(a) * (POND.r + 0.3), Y + 0.15, POND.z + Math.cos(a) * (POND.r + 0.3))); }
    cave.add(new THREE.Mesh(bake(merge(stones), 0x8a9a80, L, 0.4, false), basic));
    // moonfish: the glowing fish of Monroe Harbor, swimming round under the light
    const kit = { glow: buildKind('glow') }, r = rnd, nF = low ? 3 : 7;
    for (let i = 0; i < nF; i++) { const f = new Fish(kit, 'glow', r); f.g.scale.multiplyScalar(2.8); f.ring = 0.8 + r() * (POND.r - 1.6); f.ang = r() * TAU; f.sp = (0.25 + r() * 0.25) * (i % 2 ? 1 : -1); f.dep = 0.1 + r() * 0.1; cave.add(f.g); garden.fish.push(f); }
    if (opts.caught > 0 && garden.fish[0]) { const tag = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.035, 0.012), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.8, 0.3, 0.2) })); tag.position.set(-0.03, 0.05, 0); garden.fish[0].g.add(tag); garden.tagged = garden.fish[0]; }      // (one with a little tag: you have caught one of these before)
    const fp = plaque(['Moonfish', opts.caught > 0 ? 'You have caught one before, on Monroe Harbor.' : 'They glow, like the mice.'], 1.2); fp.position.set(POND.x + POND.r + 1.3, Y, POND.z - 1.4); fp.rotation.y = Math.PI / 2 + 0.4; cave.add(fp);
    const gs = plaque(['THE MOON GARDEN', 'please do not eat the flowers'], 1.3); gs.position.set(POND.x + 7, Y, POND.z - 7.5); gs.rotation.y = Math.PI * 0.8; cave.add(gs);
  }

  // ---- green crystals: in the cavern, along the tunnel, round the garden; a few great ones out on the plain
  {
    const cg = new THREE.OctahedronGeometry(1, 0); cg.scale(0.35, 1.5, 0.35); cg.translate(0, 1.2, 0);
    if (!low) for (const [x, z, s] of [[-26, 18, 2.6], [-38, -6, 3.2], [-20, -14, 2.0], [-46, 30, 2.8], [-60, -32, 3.6], [-14, 64, 2.4], [24, -60, 3], [-70, 44, 2.6]]) crystals.push([x, 0, z, s, 0, true]);
    for (let i = 0; i < (low ? 6 : 14); i++) { const a = rnd() * TAU, d = POND.r + 2 + rnd() * 5; const x = POND.x + Math.sin(a) * d * 1.4, z = POND.z + Math.cos(a) * d * 0.7; if (inCave(x, z) && z > 22) crystals.push([x, Y, z, 0.4 + rnd() * 0.5, 1]); }
    const per = 5, total = crystals.length * per, inner = new THREE.InstancedMesh(cg, new THREE.MeshBasicMaterial({ color: 0xffffff }), total);
    const out = new THREE.InstancedMesh(cg, new THREE.MeshBasicMaterial({ color: 0xffffff }), crystals.filter(c => c[5]).length * per);
    const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), V = new THREE.Vector3(), S = new THREE.Vector3(), c = new THREE.Color();
    let ii = 0, oi = 0;
    for (const [x, y, z, s, tint, plain] of crystals) for (let k = 0; k < per; k++) {
      const a = rnd() * TAU, lean = 0.15 + rnd() * 0.55, sz = s * (k ? 0.45 + rnd() * 0.45 : 1), gy = plain ? 0 : y;
      E.set(Math.cos(a) * lean * (k ? 1 : 0.3), rnd() * TAU, Math.sin(a) * lean * (k ? 1 : 0.3)); Q.setFromEuler(E);
      M.compose(V.set(x + Math.cos(a) * s * 0.3 * (k ? 1 : 0), gy - 0.1, z + Math.sin(a) * s * 0.3 * (k ? 1 : 0)), Q, S.set(sz, sz, sz));
      const t = tint ? [0.02, 0.55, 0.42] : [0.03, 0.75, 0.1], f = 0.7 + rnd() * 0.45; c.setRGB(t[0] * f, t[1] * f, t[2] * f);      // (kept under one: a colour of green, not a white blaze)
      if (plain) { out.setMatrixAt(oi, M); out.setColorAt(oi++, c); } else { inner.setMatrixAt(ii, M); inner.setColorAt(ii++, c); }
    }
    inner.count = ii; out.count = oi; inner.frustumCulled = out.frustumCulled = false;
    cave.add(inner); if (oi) surface.add(out);
    // a pool of green light on the floor round each cluster under the cheese (additive: it lights nothing, it is the light)
    const under = crystals.filter(q => !q[5]), pt = canvasTex(64, 64, (x, w, h) => { const gr = x.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.4, 'rgba(255,255,255,0.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, w, h); });
    const pools = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: pt, color: new THREE.Color(0.18, 0.75, 0.32), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }), under.length);
    under.forEach(([x, y, z, sz], i) => { M.compose(V.set(x, y + 0.02, z), Q.identity(), S.set(2.4 + sz * 3.2, 1, 2.4 + sz * 3.2)); pools.setMatrixAt(i, M); });
    pools.frustumCulled = false; pools.renderOrder = 2; cave.add(pools);
    for (const [x, , z, s, , plain] of crystals) if (plain) P.obstacles.push({ x0: x - s * 0.35, x1: x + s * 0.35, z0: z - s * 0.35, z1: z + s * 0.35, y0: -1, y1: s * 2.5 });
  }

  // ---- the stations of the base's workers: [{ x, z, wait, face, up }]
  const at = (x, z, wait = 2.5, face = null, up = 0) => ({ x, z, wait, face, up });
  const B = PIECES.bays, D = PIECES.desk;
  const stations = [
    [at(D.x + 2.6, D.z - 1.4, 5, { x: D.x, z: D.z - 1.4 }), at(D.x + 2.7, D.z - 0.6, 3, { x: D.x, z: D.z - 0.4 })],
    [at(D.x + 2.8, D.z + 0.6, 6, { x: D.x, z: D.z + 0.5 })],
    [at(D.x + 2.6, D.z + 1.8, 4, { x: PIECES.board.x, z: PIECES.board.z }, 0.5), at(D.x + 2.4, D.z + 1.2, 4, { x: D.x, z: D.z + 1.2 })],
    [at(B[1].x + 1.2, B[1].z - 0.5, 3, B[1]), at(PIECES.crates[0][0] - 1, PIECES.crates[0][1] + 0.6, 2, { x: PIECES.crates[0][0], z: PIECES.crates[0][1] })],
    [at(B[5].x - 1.1, B[5].z - 0.4, 4, B[5]), at(B[6].x + 1.1, B[6].z - 0.4, 3, B[6])],
    [at(PIECES.crates[2][0] + 1, PIECES.crates[2][1] + 0.6, 3, { x: PIECES.crates[2][0], z: PIECES.crates[2][1] }), at(B[3].x, B[3].z - 1.3, 3, B[3])],
    [at(POND.x + POND.r + 0.8, POND.z, 4, POND), at(POND.x + 3, POND.z - POND.r - 1.4, 3, POND)],
    [at(POND.x - POND.r - 1, POND.z + 1, 5, POND), at(POND.x - 5, POND.z + 4, 3, null)],
    [at(POND.x + 6, POND.z + 3, 4, null), at(POND.x + 8, POND.z - 2, 4, null)],
    [at(DAIS.x + DAIS.r + 1.2, DAIS.z, 5, DAIS, 0.3), at(DAIS.x, DAIS.z - DAIS.r - 1.2, 4, DAIS, 0.3)],
    [at(DAIS.x - DAIS.r - 1.2, DAIS.z + 1, 6, DAIS, 0.3)],
    [at(PIECES.lifter.x + 2.2, PIECES.lifter.z, 6, PIECES.lifter, 0.8)],
    [at(PAD.x + PAD.r + 0.8, PAD.z + 1, 5, PAD), at(PAD.x - 1, PAD.z + PAD.r + 0.8, 4, PAD)],
    [at(PAD.x - PAD.r - 0.8, PAD.z - 1, 5, PAD)],
    [at(MOUTH.x + 2, TUN.z1 + 1.4, 6, MOUTH), at(MOUTH.x + 4, TUN.z1 + 2.4, 3, null)],
  ].slice(0, low ? 9 : 15);

  return {
    surface, cave, garden, monument, stations, plaques,
    // each frame: the plants sway, the pond moves, the fish swim round
    update(dt, t, reduce) {
      if (!cave.visible) return;
      const g = garden, M = this._m || (this._m = new THREE.Matrix4()), Q = this._q || (this._q = new THREE.Quaternion()), E = this._e || (this._e = new THREE.Euler()), V = this._v || (this._v = new THREE.Vector3()), S = this._s || (this._s = new THREE.Vector3());
      const sway = reduce ? 0.04 : 0.12;
      for (const p of g.plants) { E.set(Math.sin(t * 0.7 + p.ph) * sway, 0, Math.cos(t * 0.53 + p.ph) * sway); Q.setFromEuler(E); M.compose(V.set(p.x, Y, p.z), Q, S.set(1, p.h, 1)); g.stems.setMatrixAt(p.i, M); V.set(0, p.h, 0).applyQuaternion(Q).add({ x: p.x, y: Y, z: p.z }); M.compose(V, Q, S.setScalar(1 + 0.12 * Math.sin(t * 1.3 + p.ph))); g.bulbs.setMatrixAt(p.i, M); }
      g.stems.instanceMatrix.needsUpdate = g.bulbs.instanceMatrix.needsUpdate = true;
      g.u.t.value = t * (reduce ? 0.4 : 1);
      for (const f of g.fish) { f.ang += f.sp * dt / f.ring * 1.6; f.g.position.set(POND.x + Math.cos(f.ang) * f.ring, Y - f.dep, POND.z + Math.sin(f.ang) * f.ring); f.g.rotation.set(0, f.ang + Math.sign(f.sp) * Math.PI / 2, 0); f.u.uT.value += dt * 6; f.u.uAmp.value = 0.12; }
    },
  };
}

/** Which of the base's places a point is in (the first that has it), or null. */
export function zoneAt(x, z, y) { for (const Z of ZONES) if (Z.in(x, z, y)) return Z; return null; }
