// The Moon, where the voyage lands: a grey plain on the floor of a wide crater, a domed museum waiting for its
// collection, a small round hatch where its visitors live, and out to the east a jump park of craters and kickers.
//
// Two things are made here from the same numbers, so that what the toy drives on is what is drawn:
//   moonPlan()     the world the vehicles read (src/vehicles.js, through src/plan.js): the ground as one hill
//                  surface with a height function, the dome and the saucer as shells and rings, rocks and kickers;
//                  everything plan.js asks of a plan, most of it empty.
//   buildMoon()    the meshes: the ground, the dome inside and out, the sign, the shelves, the cabinet, the rocks,
//                  the kickers, the hatch.
// And the moving parts: the visitors (Visitors) and the dust (Dust).
//
// Units are metres; the toy car is 46 cm long. The saucer (src/craft.js) stands at SAUCER with its door, at its
// own +x, turned to face the dome.

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { heightOf } from './plan.js';
import { CRAFT } from './craft.js';
import { fbm } from './cosmos.js';

export const MOON_G = 9.8 / 6;
export const DOME = { x: 0, z: -22, R: 16, IN: 15.75, OUT: 16.25, WALL: 3.2, DOOR_W: 5, DOOR_H: 3.0, PORCH: 3.4 };
export const SAUCER = { x: 0, z: 30, yaw: Math.PI / 2 };          // its +x (the door) faces the dome, -z in the world
export const HATCH = { x: -27, z: 2 };
export const BOUND = 290;
const TAU = Math.PI * 2;
const DOOR_A = (DOME.DOOR_W / 2) / DOME.R;
const smooth = (a, b, v) => { const t = Math.max(0, Math.min(1, (v - a) / (b - a))); return t * t * (3 - 2 * t); };

// The saucer's frame to the world's: its +x is the world's -z.
export const craftToWorld = (lx, lz) => ({ x: SAUCER.x + lz, z: SAUCER.z - lx });

// Craters: [x, z, radius, how far the floor goes below the plain (at most 0.8: see moonH), rim height].
const CRATERS = [
  [96, 2, 14, 0.8, 2.4], [136, 34, 10, 0.6, 1.9], [146, -32, 18, 0.8, 2.8], [182, 8, 9, 0.5, 1.6],
  [-92, -64, 26, 0.8, 3.2], [-126, 74, 34, 0.8, 3.6], [42, 124, 22, 0.8, 2.6], [-44, 146, 15, 0.7, 2], [72, -146, 30, 0.8, 3.2],
  [-160, -150, 40, 0.8, 4.2], [182, 172, 45, 0.8, 4], [-206, 40, 20, 0.8, 2.4], [12, -112, 12, 0.6, 1.6], [-64, 62, 9, 0.5, 1.2],
  [-150, -20, 7, 0.4, 0.9], [100, 90, 8, 0.5, 1], [-20, -190, 18, 0.8, 2.2], [220, -90, 16, 0.8, 2],
];
export const PARK = { x0: 44, x1: 214, z0: -72, z1: 72 };
const noise = fbm(31);

// How high the ground is. Never below -0.85: plan.js counts a hill surface as ground at any height above -1, so the
// bottom of every crater is kept above that and the floor of a bowl is always underfoot.
export function moonH(x, z) {
  let b = 0.5 + 0.42 * Math.sin(x * 0.021 + 1.3) * Math.cos(z * 0.017 - 0.4) + 0.3 * Math.sin(x * 0.047 + z * 0.031) + 0.6 * (noise(x * 0.018 + 40, z * 0.018 + 40, 3) - 0.5);
  b *= smooth(58, 92, Math.hypot(x - SAUCER.x * 0.5, z - 4));                                    // flat round the dome and the saucer
  if (x > PARK.x0 - 10 && x < PARK.x1 + 10 && z > PARK.z0 - 10 && z < PARK.z1 + 10) b *= 0.3;   // and fairly flat in the park
  let h = b;
  for (const [cx, cz, R, dep, rim] of CRATERS) {
    const d = Math.hypot(x - cx, z - cz) / R;
    if (d < 1) { const q = 1 - d * d; h += rim - (dep + rim) * q * q; }
    else if (d < 2.4) h += rim * Math.exp(-Math.pow((d - 1) / 0.42, 2));
  }
  const m = Math.max(Math.abs(x), Math.abs(z));
  if (m > 225) h += m < 300 ? Math.pow((m - 225) / 65, 2) * 24 : 32 - Math.min(32, (m - 300) * 0.045);   // the wall of the great crater round it all
  return Math.max(-0.85, h);
}

// ---------------------------------------------------------------- the plan --
// A shell over a round footprint: its top at fn(r), so thick. Outside the circle it is nowhere.
const NOWHERE = -1e9;
function shell(cx, cz, r0, r1, top, thick, extra = {}) {
  return { x0: cx - r1, x1: cx + r1, z0: cz - r1, z1: cz + r1, axis: null, thick, skin: 'shell', fixed: true, fn: (x, z) => { const r = Math.hypot(x - cx, z - cz); return r < r0 || r > r1 ? NOWHERE : top(r); }, ...extra };
}
// A ring of little blocks round a circle, missing where `gap(angle)` says (angle from +z towards +x, as in three's cylinders).
function ring(out, cx, cz, r, half, y0, y1, gap = () => false, spacing = half * 1.6) {
  const n = Math.ceil(TAU * r / spacing);
  for (let i = 0; i < n; i++) { const a = i / n * TAU; if (gap(a)) continue; const x = cx + Math.sin(a) * r, z = cz + Math.cos(a) * r; out.push({ x0: x - half, x1: x + half, z0: z - half, z1: z + half, y0, y1, ring: true }); }
}
const angDist = (a, b) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));

// The furniture of the dome: where each thing stands, the same for the plan and for the meshes.
export function domeLayout(nArts = 12) {
  const D = DOME, shelves = [-0.44, 0.44].map(a => ({ a, w: 3.2, d: 0.45, h: 2.4 }));
  // the art: round the wall from just past the shelves on one side to just past them on the other
  const a0 = 0.72, a1 = TAU - 0.72, n = Math.max(1, nArts), rows = n > 18 ? 2 : 1, per = Math.ceil(n / rows), slots = [];
  for (let i = 0; i < n; i++) {
    const row = Math.floor(i / per), k = i % per, cnt = Math.min(per, n - row * per), a = a0 + (a1 - a0) * (k + 0.5) / cnt;
    slots.push({ a, x: D.x + Math.sin(a) * (D.IN - 0.05), z: D.z + Math.cos(a) * (D.IN - 0.05), y: rows === 1 ? 1.75 : row ? 2.5 : 1.15, rot: a + Math.PI, room: Math.min(3.2, (a1 - a0) * D.IN / cnt - 0.6), tall: rows === 1 ? 2.7 : 1.15 });
  }
  return { shelves, slots, cabinet: { x: D.x, z: D.z, w: 2.6, d: 0.9, h: 1.7, plinth: 2.1 } };
}

export function moonPlan(nArts = 12) {
  const B = BOUND, D = DOME, S = SAUCER, C = CRAFT;
  const P = {
    made: 'moon', moon: true,
    rooms: [], floors: [], surfaces: [], roofs: null, boxes: [], masses: [], obstacles: [], doors: [], skylights: [], slabs: [],
    wells: [], pits: [{ x0: -1e5, x1: 1e5, z0: -1e5, z1: 1e5 }], paved: [], ice: [], decals: [], puddles: [], loops: [], lifts: [], ramps: [],
    street: null, cut: null, allow: [], byId: {}, racing: false, under: null, locked: false, secretOpen: true, grounds: {}, outdoorArt: [], lamps: [],
    bounds: { x0: -B, x1: B, z0: -B, z1: B },
  };
  // the ground: one hill, everywhere
  P.surfaces.push({ x0: -B - 20, x1: B + 20, z0: -B - 20, z1: B + 20, hill: true, fn: moonH, skin: 'regolith' });

  // ---- the dome: a ring wall with a door in it facing the saucer (+z), a shell over it, a porch out in front
  ring(P.obstacles, D.x, D.z, (D.IN + D.OUT) / 2, (D.OUT - D.IN) / 2 + 0.02, -1, D.WALL + 0.2, a => angDist(a, 0) < DOOR_A);
  const domeTop = r => D.WALL + Math.sqrt(Math.max(0, D.OUT * D.OUT - r * r));
  const domeShell = shell(D.x, D.z, 0, D.OUT, domeTop, 0.5);
  P.surfaces.push(domeShell); P.slabs.push(domeShell);
  // over the door: the wall above it, to the shell
  P.obstacles.push({ x0: D.x - D.DOOR_W / 2, x1: D.x + D.DOOR_W / 2, z0: D.z + D.IN - 0.05, z1: D.z + D.OUT + 0.05, y0: D.DOOR_H, y1: D.WALL + 0.6 });
  const pz0 = D.z + D.OUT - 0.2, pz1 = D.z + D.OUT + D.PORCH, pw = D.DOOR_W / 2;
  for (const s of [-1, 1]) P.obstacles.push({ x0: D.x + s * pw + (s < 0 ? -0.3 : 0), x1: D.x + s * pw + (s > 0 ? 0.3 : 0), z0: pz0, z1: pz1, y0: -1, y1: D.DOOR_H + 0.3 });
  const porchRoof = { x0: D.x - pw - 0.35, x1: D.x + pw + 0.35, z0: pz0, z1: pz1 + 0.1, axis: null, h0: D.DOOR_H + 0.3, h1: D.DOOR_H + 0.3, thick: 0.3, skin: 'porch', fixed: true };
  P.surfaces.push(porchRoof); P.slabs.push(porchRoof);
  P.obstacles.push({ x0: D.x - 3.7, x1: D.x + 3.7, z0: pz1 - 0.15, z1: pz1 + 0.12, y0: D.DOOR_H + 0.6, y1: D.DOOR_H + 2.0, sign: true });   // the sign on the porch
  // inside: the two bookcases (in short pieces, so their boxes keep close to them) and the cabinet on its plinth
  const L = domeLayout(nArts);
  for (const sh of L.shelves) {
    const a = sh.a, cx = D.x + Math.sin(a) * (D.IN - sh.d / 2 - 0.05), cz = D.z + Math.cos(a) * (D.IN - sh.d / 2 - 0.05), tx = Math.cos(a), tz = -Math.sin(a);
    for (let i = 0; i < 4; i++) { const u = (i + 0.5) / 4 * sh.w - sh.w / 2, x = cx + tx * u, z = cz + tz * u, hx = Math.abs(tx) * sh.w / 8 + Math.abs(Math.sin(a)) * sh.d / 2, hz = Math.abs(tz) * sh.w / 8 + Math.abs(Math.cos(a)) * sh.d / 2; P.obstacles.push({ x0: x - hx, x1: x + hx, z0: z - hz, z1: z + hz, y0: -1, y1: sh.h }); }
  }
  { const c = L.cabinet; P.surfaces.push(shell(c.x, c.z, 0, c.plinth, () => 0.22, 0.4)); P.obstacles.push({ x0: c.x - c.w / 2, x1: c.x + c.w / 2, z0: c.z - c.d / 2, z1: c.z + c.d / 2, y0: 0, y1: c.h + 0.22 }); }

  // ---- the saucer on its legs, door to the dome
  const fy = C.LEG, cx = S.x, cz = S.z;
  const floor = shell(cx, cz, 0, C.WALL, () => fy, 1.25); P.surfaces.push(floor); P.slabs.push(floor);
  const flange = shell(cx, cz, C.WALL, C.R, r => fy - 0.02 - (r - C.WALL) * 0.4, 0.45); P.surfaces.push(flange); P.slabs.push(flange);
  const roof = shell(cx, cz, 0, C.WALL, r => fy + 2.97 + 2.63 * Math.sqrt(Math.max(0, 1 - (r / C.WALL) ** 2)), 0.35); P.surfaces.push(roof); P.slabs.push(roof);
  const doorDir = Math.PI;                    // the door is towards -z in the world: angle pi from +z
  ring(P.obstacles, cx, cz, (C.IN + C.WALL) / 2 + 0.02, 0.2, fy - 0.15, fy + 2.97, a => angDist(a, doorDir) < (C.DOOR_W / 2 - 0.05) / C.WALL);
  P.obstacles.push({ x0: cx - C.DOOR_W / 2, x1: cx + C.DOOR_W / 2, z0: cz - C.WALL - 0.08, z1: cz - C.IN + 0.05, y0: fy + C.DOOR_H, y1: fy + 3.1 });
  for (let i = 0; i < 4; i++) { const a = Math.PI / 4 + i * Math.PI / 2, w = craftToWorld(Math.sin(a) * 5.4, Math.cos(a) * 5.4); P.obstacles.push({ x0: w.x - 0.4, x1: w.x + 0.4, z0: w.z - 0.4, z1: w.z + 0.4, y0: -1, y1: fy - 0.9 }); }
  // the ramp, from the threshold down to the ground, towards the dome
  const run = Math.sqrt(C.RAMP * C.RAMP - fy * fy), hz = cz - C.HINGE;
  P.ramp = { x0: cx - C.RAMP_W / 2, x1: cx + C.RAMP_W / 2, z0: hz - run, z1: hz, axis: 'z', h0: 0, h1: fy, thick: 0.15, skin: 'ramp', fixed: true, off: true };
  P.rampOn = on => { const i = P.surfaces.indexOf(P.ramp); if (on && i < 0) P.surfaces.push(P.ramp); if (!on && i >= 0) P.surfaces.splice(i, 1); };
  P.spawn = { x: cx, z: cz - 1.5, yaw: Math.PI, y: fy };

  // ---- the hatch the visitors come out of: a little dome
  P.surfaces.push(shell(HATCH.x, HATCH.z, 0, 2.6, r => 1.7 * Math.sqrt(Math.max(0, 1 - (r / 2.6) ** 2)) + 0.15, 2.2));

  // ---- the jump park
  const K = P.kickers = [
    { x0: 62, x1: 69, z0: -3, z1: 3, axis: 'x', h0: 0, h1: 2.3, ease: true },                       // the lift-off, over the first crater
    { x0: 118, x1: 124, z0: 46, z1: 52, axis: 'z', h0: 2.0, h1: 0, ease: true },                   // a kicker heading north, past the small crater
    { x0: 150, x1: 156, z0: -66, z1: -58, axis: 'x', h0: 0, h1: 1.8 },                               // up onto the table
    { x0: 156, x1: 172, z0: -66, z1: -58, axis: null, h0: 1.8, h1: 1.8 },                            // the table
    { x0: 172, x1: 178, z0: -66, z1: -58, axis: 'x', h0: 1.8, h1: 0 },                               // and down off it
    { x0: 200, x1: 206, z0: -12, z1: 12, axis: 'x', h0: 0, h1: 4, curve: 6 },                         // a quarter pipe at the far end
    { x0: 70, x1: 76, z0: -48, z1: -42, axis: 'x', h0: 0, h1: 1.5, ease: true },
    { x0: 104, x1: 110, z0: 56, z1: 62, axis: 'x', h0: 1.5, h1: 0, ease: true },
  ];
  for (const k of K) P.surfaces.push({ ...k, skin: 'kicker', fixed: true, kit: false });
  // boulders: never in the flat round the base or across the park's lanes
  const rr = (s => () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; })(77);
  P.rocks = [];
  for (let i = 0; i < 700 && P.rocks.length < 150; i++) {
    const x = (rr() * 2 - 1) * (B - 20), z = (rr() * 2 - 1) * (B - 20), s = 0.45 + Math.pow(rr(), 2.2) * 2.4;
    if (Math.hypot(x - S.x * 0.5, z - 4) < 74 || Math.hypot(x - HATCH.x, z - HATCH.z) < 12) continue;
    if (x > PARK.x0 - 4 && x < PARK.x1 + 4 && z > PARK.z0 - 4 && z < PARK.z1 + 4 && rr() < 0.85) continue;
    if (K.some(k => x > k.x0 - 4 && x < k.x1 + 4 && z > k.z0 - 4 && z < k.z1 + 4)) continue;
    const h = moonH(x, z); P.rocks.push({ x, z, s, h, yaw: rr() * TAU });
    P.obstacles.push({ x0: x - s * 0.72, x1: x + s * 0.72, z0: z - s * 0.72, z1: z + s * 0.72, y0: h - 0.3, y1: h + s * 0.95, rock: true });
  }
  return P;
}

// ------------------------------------------------------------- the meshes --
function canvasTex(w, h, draw, srgb = true) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }
const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0, ...o });

function regolith() {
  const n = fbm(12);
  const t = canvasTex(256, 256, (x, w, h) => {
    const img = x.createImageData(w, h);
    for (let y = 0; y < h; y++) for (let i = 0; i < w; i++) { const u = i / w * 8, v = y / h * 8, g = 120 + (n(u, v, 4) - 0.5) * 70 + (Math.random() - 0.5) * 26, k = (y * w + i) * 4; img.data[k] = g; img.data[k + 1] = g; img.data[k + 2] = g * 0.97; img.data[k + 3] = 255; }
    x.putImageData(img, 0, 0);
    for (let k = 0; k < 60; k++) { const px = Math.random() * w, py = Math.random() * h, r = 1 + Math.random() * 5; x.strokeStyle = 'rgba(40,40,40,0.35)'; x.lineWidth = 1; x.beginPath(); x.arc(px, py, r, 0, TAU); x.stroke(); x.strokeStyle = 'rgba(220,220,215,0.25)'; x.beginPath(); x.arc(px - 0.6, py - 0.6, r, Math.PI, Math.PI * 1.6); x.stroke(); }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}

function terrain(size, seg, drop = null, rep = 60, tex) {
  const g = new THREE.PlaneGeometry(size, size, seg, seg); g.rotateX(-Math.PI / 2);
  const p = g.attributes.position, col = new Float32Array(p.count * 3), n = fbm(44);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i); let y = moonH(x, z);
    if (drop && Math.abs(x) < drop - 0.5 && Math.abs(z) < drop - 0.5) y -= 3;
    p.setY(i, y);
    const k = 0.78 + 0.28 * n(x * 0.012 + 9, z * 0.012 + 9, 3) - Math.max(0, -y) * 0.08 + Math.max(0, y - 1.2) * 0.03;
    col[i * 3] = k; col[i * 3 + 1] = k * 0.99; col[i * 3 + 2] = k * 0.97;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.computeVertexNormals();
  const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * rep, uv.getY(i) * rep);
  return new THREE.Mesh(g, std(0xffffff, { map: tex, vertexColors: true, roughness: 1 }));
}

// A sign's face: the words fitted to the board, the largest size that fits.
export function signFace(text, open) {
  return canvasTex(1024, 192, (x, w, h) => {
    x.fillStyle = open ? '#f3e7c4' : '#0c1a2c'; x.fillRect(0, 0, w, h);
    x.strokeStyle = open ? '#b88a2a' : '#e2cd94'; x.lineWidth = 8; x.strokeRect(10, 10, w - 20, h - 20);
    let size = 120; x.textAlign = 'center'; x.textBaseline = 'middle';
    do { x.font = `${open ? 700 : 400} ${size}px "Iowan Old Style", Palatino, Georgia, serif`; size -= 2; } while (x.measureText(text).width > w * 0.88 && size > 20);
    x.fillStyle = open ? '#3a2408' : '#fff3cf'; x.fillText(text, w / 2, h / 2 + 4);
  });
}

function rampGeo(s) {
  // the top sampled along the slope, closed down the sides and ends to the ground
  const n = s.axis ? 14 : 1, top = [], parts = [];
  const along = (t, u) => s.axis === 'z' ? [s.x0 + (s.x1 - s.x0) * u, s.z0 + (s.z1 - s.z0) * t] : [s.x0 + (s.x1 - s.x0) * t, s.z0 + (s.z1 - s.z0) * u];
  const pos = [], idx = [];
  const add = (x, y, z) => { pos.push(x, y, z); return pos.length / 3 - 1; };
  for (let i = 0; i <= n; i++) { const t = i / n, [x0, z0] = along(t, 0), [x1, z1] = along(t, 1); const h0 = s.axis ? heightOf(s, Math.min(s.x1, x0), Math.min(s.z1, z0)) : s.h0, h1 = s.axis ? heightOf(s, Math.min(s.x1, x1), Math.min(s.z1, z1)) : s.h0; top.push([add(x0, h0, z0), add(x1, h1, z1), add(x0, -0.3, z0), add(x1, -0.3, z1)]); }
  for (let i = 0; i < n; i++) { const [a, b, a0, b0] = top[i], [c, d, c0, d0] = top[i + 1]; idx.push(a, b, d, a, d, c, a0, a, c, a0, c, c0, b0, d, b, b0, d0, d); }
  const [a, b, a0, b0] = top[0], [c, d, c0, d0] = top[n]; idx.push(a0, b0, b, a0, b, a, c0, c, d, c0, d, d0);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
  const ng = g.toNonIndexed(); ng.computeVertexNormals(); void parts; return ng;
}

function rockGeo() {
  const g = new THREE.IcosahedronGeometry(1, 1), p = g.attributes.position, n = fbm(5), v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const k = 0.75 + 0.45 * n(v.x * 1.7 + 3, v.y * 1.7 + v.z * 1.3 + 3, 2); v.multiplyScalar(k); if (v.y < -0.2) v.y = -0.2 + (v.y + 0.2) * 0.3; p.setXYZ(i, v.x, v.y, v.z); }
  g.computeVertexNormals(); return g;
}

// What stands on the Moon. `P` is moonPlan(); `arts` how many slots the dome needs.
export function buildMoon(P, nArts = 12) {
  const g = new THREE.Group(); g.name = 'moon';
  const tex = regolith();
  const ground = terrain(600, 240, null, 70, tex); g.add(ground);
  const far = terrain(3000, 75, 300, 300, tex); far.position.y = -0.02; g.add(far);

  // ---- the dome
  const D = DOME, d = new THREE.Group(); d.position.set(D.x, 0, D.z); g.add(d);
  const white = std(0xe9ecef, { roughness: 0.55, metalness: 0.1, emissive: 0x1b1f24, emissiveIntensity: 0.4 });
  const panelTex = canvasTex(512, 256, (x, w, h) => { x.fillStyle = '#e8ebee'; x.fillRect(0, 0, w, h); x.strokeStyle = '#a9b1b8'; x.lineWidth = 3; for (let i = 0; i <= 16; i++) { x.beginPath(); x.moveTo(i * w / 16, 0); x.lineTo(i * w / 16, h); x.stroke(); } for (let j = 0; j <= 8; j++) { x.beginPath(); x.moveTo(0, j * h / 8); x.lineTo(w, j * h / 8); x.stroke(); } });
  panelTex.wrapS = THREE.RepeatWrapping; panelTex.repeat.set(3, 1);
  const shellOut = new THREE.Mesh(new THREE.SphereGeometry(D.OUT, 64, 20, 0, TAU, 0, Math.PI / 2), std(0xffffff, { map: panelTex, roughness: 0.5, metalness: 0.15, emissive: 0x181c22, emissiveIntensity: 0.5 }));
  shellOut.position.y = D.WALL; d.add(shellOut);
  const ceilTex = canvasTex(256, 256, (x, w, h) => { const gr = x.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#1c2433'); gr.addColorStop(1, '#2c3648'); x.fillStyle = gr; x.fillRect(0, 0, w, h); x.fillStyle = '#ffffff'; for (let i = 0; i < 70; i++) { const px = Math.random() * w, py = Math.random() * h * 0.9, r = Math.random() < 0.1 ? 1.6 : 0.8; x.globalAlpha = 0.3 + Math.random() * 0.7; x.beginPath(); x.arc(px, py, r, 0, TAU); x.fill(); } x.globalAlpha = 1; x.strokeStyle = 'rgba(226,205,148,.45)'; x.lineWidth = 2; for (let i = 0; i < 4; i++) { x.beginPath(); x.moveTo(i * w / 4, 0); x.lineTo(i * w / 4, h); x.stroke(); } });
  ceilTex.wrapS = THREE.RepeatWrapping; ceilTex.repeat.set(4, 1);
  const ceilMat = std(0xffffff, { map: ceilTex, emissiveMap: ceilTex, emissive: 0xffffff, emissiveIntensity: 0.55, side: THREE.BackSide, roughness: 0.9 });
  const shellIn = new THREE.Mesh(new THREE.SphereGeometry(D.IN, 64, 20, 0, TAU, 0, Math.PI / 2), ceilMat); shellIn.position.y = D.WALL; d.add(shellIn);
  const wallGeo = new THREE.CylinderGeometry(D.OUT, D.OUT, D.WALL, 96, 1, true, DOOR_A, TAU - 2 * DOOR_A); wallGeo.translate(0, D.WALL / 2, 0);
  d.add(new THREE.Mesh(wallGeo, white));
  const wallInTex = canvasTex(1024, 128, (x, w, h) => { x.fillStyle = '#efe7d6'; x.fillRect(0, 0, w, h); x.fillStyle = '#c9b48a'; x.fillRect(0, h - 14, w, 14); x.fillRect(0, 0, w, 6); });
  wallInTex.wrapS = THREE.RepeatWrapping; wallInTex.repeat.set(8, 1);
  const wallIn = new THREE.CylinderGeometry(D.IN, D.IN, D.WALL, 96, 1, true, DOOR_A, TAU - 2 * DOOR_A); wallIn.translate(0, D.WALL / 2, 0);
  const wallInMat = std(0xffffff, { map: wallInTex, side: THREE.BackSide, roughness: 0.8, emissive: 0x2a2418, emissiveIntensity: 0.5 });
  d.add(new THREE.Mesh(wallIn, wallInMat));
  // over the door, and its jambs
  const lintel = new THREE.CylinderGeometry(D.OUT, D.OUT, D.WALL - D.DOOR_H, 8, 1, true, -DOOR_A, 2 * DOOR_A); lintel.translate(0, D.DOOR_H + (D.WALL - D.DOOR_H) / 2, 0);
  d.add(new THREE.Mesh(lintel, white));
  // the porch: two walls, a roof, the sign on it
  const pw = D.DOOR_W / 2, pz0 = D.OUT - 0.2, pz1 = D.OUT + D.PORCH;
  const porch = mergeGeometries([
    new THREE.BoxGeometry(0.3, D.DOOR_H + 0.3, pz1 - pz0).translate(-pw - 0.15, (D.DOOR_H + 0.3) / 2, (pz0 + pz1) / 2),
    new THREE.BoxGeometry(0.3, D.DOOR_H + 0.3, pz1 - pz0).translate(pw + 0.15, (D.DOOR_H + 0.3) / 2, (pz0 + pz1) / 2),
    new THREE.BoxGeometry(D.DOOR_W + 0.7, 0.3, pz1 - pz0 + 0.1).translate(0, D.DOOR_H + 0.15, (pz0 + pz1) / 2 + 0.05),
  ]);
  d.add(new THREE.Mesh(porch, white));
  const doorLamp = new THREE.Mesh(new THREE.BoxGeometry(D.DOOR_W, 0.06, 0.12).translate(0, D.DOOR_H - 0.05, pz1 - 0.05), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 1.3, 0.8) }));
  d.add(doorLamp);
  const sign = new THREE.Group(); sign.position.set(0, D.DOOR_H + 1.3, pz1); d.add(sign);
  const closed = signFace('Sorry, the Museum is Closed', false), open = signFace('The Museum is Open', true);
  const edge = std(0xc9a24e, { metalness: 0.7, roughness: 0.35 });
  const signFront = new THREE.MeshStandardMaterial({ map: closed, emissiveMap: closed, emissive: 0xffffff, emissiveIntensity: 0.55, roughness: 0.6 });
  const signBack = new THREE.MeshStandardMaterial({ map: open, emissiveMap: open, emissive: 0xffffff, emissiveIntensity: 0.25, roughness: 0.6 });
  const board = new THREE.Mesh(new THREE.BoxGeometry(7, 1.31, 0.12), [edge, edge, edge, edge, signFront, signBack]);
  sign.add(board);
  for (const s of [-1, 1]) d.add(new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.0, 0.1).translate(s * 3.2, D.DOOR_H + 0.55, pz1), edge));
  // the floor inside, with a compass rose let into it
  const floorTex = canvasTex(1024, 1024, (x, w, h) => {
    x.fillStyle = '#2a2d33'; x.fillRect(0, 0, w, h);
    x.strokeStyle = '#c9b48a'; x.lineWidth = 6; for (const r of [500, 330, 160]) { x.beginPath(); x.arc(w / 2, h / 2, r, 0, TAU); x.stroke(); }
    x.fillStyle = 'rgba(201,180,138,.85)'; for (let i = 0; i < 8; i++) { const a = i / 8 * TAU, l = i % 2 ? 150 : 300; x.beginPath(); x.moveTo(w / 2 + Math.cos(a) * l, h / 2 + Math.sin(a) * l); x.lineTo(w / 2 + Math.cos(a + 0.18) * 40, h / 2 + Math.sin(a + 0.18) * 40); x.lineTo(w / 2 + Math.cos(a - 0.18) * 40, h / 2 + Math.sin(a - 0.18) * 40); x.closePath(); x.fill(); }
  });
  const floorM = new THREE.Mesh(new THREE.CircleGeometry(D.IN, 72).rotateX(-Math.PI / 2), std(0xffffff, { map: floorTex, roughness: 0.35, metalness: 0.2, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
  floorM.position.y = 0.004; d.add(floorM);
  // lamps round the top of the wall: they come up when the museum opens
  const lampMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.5, 0.45, 0.35) });
  const lampGeos = []; for (let i = 0; i < 24; i++) { const a = i / 24 * TAU; if (angDist(a, 0) < DOOR_A + 0.05) continue; lampGeos.push(new THREE.SphereGeometry(0.16, 10, 6).translate(Math.sin(a) * (D.IN - 0.3), D.WALL - 0.25, Math.cos(a) * (D.IN - 0.3))); }
  d.add(new THREE.Mesh(mergeGeometries(lampGeos), lampMat));
  const light = new THREE.PointLight(0xfff0d8, 30, 46, 1.2); light.position.set(0, 9, 0); d.add(light);
  // the shelves and the cabinet
  const L = domeLayout(nArts), wood = std(0x5a3a22, { roughness: 0.7 }), shelfSpots = [];
  for (const sh of L.shelves) {
    const u = new THREE.Group(); u.position.set(Math.sin(sh.a) * (D.IN - sh.d / 2 - 0.05), 0, Math.cos(sh.a) * (D.IN - sh.d / 2 - 0.05)); u.rotation.y = sh.a + Math.PI; d.add(u);
    const parts = [new THREE.BoxGeometry(sh.w, sh.h, 0.04).translate(0, sh.h / 2, -sh.d / 2 + 0.02)];
    for (const s of [-1, 1]) parts.push(new THREE.BoxGeometry(0.05, sh.h, sh.d).translate(s * (sh.w / 2 - 0.025), sh.h / 2, 0));
    for (let j = 0; j <= 4; j++) parts.push(new THREE.BoxGeometry(sh.w, 0.035, sh.d).translate(0, 0.08 + j * (sh.h - 0.12) / 4, 0));
    u.add(new THREE.Mesh(mergeGeometries(parts), wood));
    for (let j = 0; j < 4; j++) shelfSpots.push({ unit: u, y: 0.1 + j * (sh.h - 0.12) / 4, w: sh.w - 0.12, d: sh.d });
  }
  const cab = new THREE.Group(), c = L.cabinet; cab.position.set(0, 0, 0); d.add(cab);
  cab.add(new THREE.Mesh(new THREE.CylinderGeometry(c.plinth, c.plinth + 0.1, 0.22, 48).translate(0, 0.11, 0), std(0x3a3f47, { roughness: 0.4, metalness: 0.3 })));
  const frameParts = []; for (const sx of [-1, 1]) for (const sz of [-1, 1]) frameParts.push(new THREE.BoxGeometry(0.05, c.h, 0.05).translate(sx * c.w / 2, 0.22 + c.h / 2, sz * c.d / 2));
  for (const y of [0.25, 0.85, 1.38, c.h + 0.2]) frameParts.push(new THREE.BoxGeometry(c.w, 0.04, c.d).translate(0, y, 0));
  cab.add(new THREE.Mesh(mergeGeometries(frameParts), edge));
  const glassC = new THREE.Mesh(new THREE.BoxGeometry(c.w - 0.02, c.h - 0.05, c.d - 0.02).translate(0, 0.22 + c.h / 2, 0), new THREE.MeshStandardMaterial({ color: 0xcfe8ff, transparent: true, opacity: 0.14, roughness: 0.05, metalness: 0.1, depthWrite: false }));
  glassC.renderOrder = 4; cab.add(glassC);
  const label = canvasTex(512, 96, (x, w, h) => { x.fillStyle = '#0c1a2c'; x.fillRect(0, 0, w, h); x.fillStyle = '#e2cd94'; x.textAlign = 'center'; x.textBaseline = 'middle'; let s = 46; do { x.font = `italic ${s}px Georgia, serif`; s -= 2; } while (x.measureText('Curiosities from Earth').width > w * 0.9); x.fillText('Curiosities from Earth', w / 2, h / 2); });
  for (const s of [-1, 1]) { const lb = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.225), new THREE.MeshStandardMaterial({ map: label, emissiveMap: label, emissive: 0xffffff, emissiveIntensity: 0.4 })); lb.position.set(0, 0.16, s * (c.plinth + 0.06)); lb.rotation.y = s > 0 ? 0 : Math.PI; lb.rotation.x = -0.18 * 0; cab.add(lb); }
  const cabSpots = [0.29, 0.89, 1.42].map(y => ({ y, w: c.w - 0.2, d: c.d - 0.2 }));

  // ---- the hatch
  const hatch = new THREE.Group(); hatch.position.set(HATCH.x, 0, HATCH.z); g.add(hatch);
  hatch.add(new THREE.Mesh(new THREE.SphereGeometry(2.6, 32, 10, 0, TAU, 0, Math.PI / 2).scale(1, 0.66, 1).translate(0, 0.15, 0), white));
  hatch.add(new THREE.Mesh(new THREE.CircleGeometry(0.62, 24).translate(0, 0.72, 2.32).rotateY(Math.PI / 2 - 0.0), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.4, 1.1, 0.6) })));

  // ---- the jump park's kickers, the rocks, a board saying what it is
  const kick = std(0xb9bec4, { roughness: 0.75, metalness: 0.1, emissive: 0x3a3f46, emissiveIntensity: 0.8, side: THREE.DoubleSide });
  g.add(new THREE.Mesh(mergeGeometries(P.kickers.map(rampGeo)), kick));
  const rocks = new THREE.InstancedMesh(rockGeo(), std(0x8d8d8a, { roughness: 1, flatShading: true }), P.rocks.length);
  { const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), S = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
    P.rocks.forEach((r, i) => { Q.setFromAxisAngle(up, r.yaw); M.compose(V.set(r.x, r.h + r.s * 0.12, r.z), Q, S.set(r.s, r.s * 0.78, r.s * 0.9)); rocks.setMatrixAt(i, M); }); }
  g.add(rocks);
  const pebbles = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), std(0x9a9a96, { roughness: 1, flatShading: true }), 700);
  { const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), S = new THREE.Vector3(), e = new THREE.Euler(); let s = 5;
    const r = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    for (let i = 0; i < 700; i++) { const x = (r() * 2 - 1) * 250, z = (r() * 2 - 1) * 250; if (Math.hypot(x - D.x, z - D.z) < D.OUT + 1) { i--; continue; } const k = 0.05 + r() * 0.12; e.set(r() * 3, r() * 3, r() * 3); Q.setFromEuler(e); M.compose(V.set(x, moonH(x, z) + 0.005, z), Q, S.set(k, k * 0.35, k * 0.8)); pebbles.setMatrixAt(i, M); } }
  g.add(pebbles);
  const parkSign = canvasTex(512, 160, (x, w, h) => { x.fillStyle = '#0c1a2c'; x.fillRect(0, 0, w, h); x.strokeStyle = '#e2cd94'; x.lineWidth = 6; x.strokeRect(6, 6, w - 12, h - 12); x.fillStyle = '#fff3cf'; x.textAlign = 'center'; x.font = '700 56px Georgia, serif'; x.fillText('CRATER', w / 2, 66); x.font = '400 40px Georgia, serif'; x.fillText('jump park  →', w / 2, 122); });
  const ps = new THREE.Group(); ps.position.set(40, moonH(40, 8), 8); ps.rotation.y = -Math.PI / 2 + 0.4; g.add(ps);
  ps.add(new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.75).translate(0, 1.6, 0), new THREE.MeshStandardMaterial({ map: parkSign, emissiveMap: parkSign, emissive: 0xffffff, emissiveIntensity: 0.4, side: THREE.DoubleSide })));
  ps.add(new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.3, 0.08).translate(0, 0.62, -0.02), edge));
  P.obstacles.push({ x0: 39.8, x1: 40.2, z0: 7.8, z1: 8.2, y0: -1, y1: 2 });

  return {
    group: g, terrainMats: [ground.material, far.material], dome: d, sign, board, signFront, signBack, light, lampMat, ceilMat, wallInMat, doorLamp, shelfSpots, cabSpots, cabinet: cab, layout: L,
    // the sign turns over: 0 closed, 1 open
    setSign(k) { const e = k * k * (3 - 2 * k); board.rotation.y = e * Math.PI; board.position.y = Math.sin(e * Math.PI) * 0.25; signBack.emissiveIntensity = 0.25 + 0.6 * e; },
    // the house lights: 0 the night light, 1 open
    setLights(k) { light.intensity = 30 + 170 * k; lampMat.color.setRGB(0.5 + 2.2 * k, 0.45 + 1.8 * k, 0.35 + 1.1 * k); ceilMat.emissiveIntensity = 0.55 + 0.35 * k; wallInMat.emissiveIntensity = 0.5 + 0.5 * k; },
  };
}

// ------------------------------------------------------------- the visitors --
// Small and round and pale, the colour of moonstone, with two big dark eyes, a curl of antenna with a glowing bead
// on the end, stubby feet and little arms. Nobody's character but their own. They hop, as anything would here.
function paintGeo(geo, hex) { const g = geo.index ? geo.toNonIndexed() : geo; const c = new THREE.Color(hex), n = g.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) a.set([c.r, c.g, c.b], i * 3); g.setAttribute('color', new THREE.BufferAttribute(a, 3)); if (g.attributes.uv) g.deleteAttribute('uv'); return g; }
export class Visitors {
  constructor(n = 10) {
    this.n = n; this.list = [];
    const body = new THREE.SphereGeometry(0.2, 20, 14); body.scale(1, 1.12, 0.92); body.translate(0, 0.27, 0);
    const belly = new THREE.SphereGeometry(0.12, 14, 10); belly.scale(1, 1.05, 0.5); belly.translate(0, 0.22, 0.14);
    const det = [];
    for (const s of [-1, 1]) {
      det.push(paintGeo(new THREE.SphereGeometry(0.068, 14, 10).translate(s * 0.075, 0.35, 0.15), 0xffffff));
      det.push(paintGeo(new THREE.SphereGeometry(0.044, 12, 8).translate(s * 0.078, 0.35, 0.196), 0x141826));
      det.push(paintGeo(new THREE.SphereGeometry(0.013, 6, 5).translate(s * 0.07 + 0.012, 0.366, 0.236), 0xffffff));
      det.push(paintGeo(new THREE.SphereGeometry(0.026, 8, 6).scale(1, 0.6, 0.5).translate(s * 0.13, 0.28, 0.15), 0xf2a0b8));
      det.push(paintGeo(new THREE.SphereGeometry(0.05, 10, 8).scale(1.2, 0.55, 1.5).translate(s * 0.08, 0.025, 0.03), 0x5a5f78));
      det.push(paintGeo(new THREE.CapsuleGeometry(0.026, 0.09, 4, 8).rotateZ(s * 1.0).translate(s * 0.2, 0.24, 0.02), 0xc8d0f0));
    }
    det.push(paintGeo(new THREE.TorusGeometry(0.05, 0.008, 6, 12, Math.PI * 1.3).rotateY(Math.PI / 2).translate(0, 0.53, -0.02), 0x8890b8));
    det.push(paintGeo(new THREE.CylinderGeometry(0.008, 0.008, 0.08, 6).translate(0, 0.53, 0.0), 0x8890b8));
    const bodyGeo = mergeGeometries([paintGeo(body, 0xffffff), paintGeo(belly, 0xf4f4ff)]);
    this.body = new THREE.InstancedMesh(bodyGeo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, emissive: 0x2a2f44, emissiveIntensity: 0.5 }), n);
    this.detail = new THREE.InstancedMesh(mergeGeometries(det), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.4 }), n);
    this.bead = new THREE.InstancedMesh(new THREE.SphereGeometry(0.03, 10, 8).translate(0, 0.6, 0.02), new THREE.MeshBasicMaterial({ color: 0xffffff }), n);
    const tints = [0xcfd9ff, 0xd8ccff, 0xc6f0ea, 0xe6d6ff, 0xd0e4ff, 0xf0dcf4, 0xcce8ff, 0xdcd4ff, 0xc8eee0, 0xe4e0ff, 0xd6dcff, 0xe8d0f0];
    const beads = ['#ffe35c', '#6dff9e', '#4fc8ff', '#ff8a4c', '#d78cff'];
    const c = new THREE.Color();
    for (let i = 0; i < n; i++) {
      this.body.setColorAt(i, c.set(tints[i % tints.length]));
      this.bead.setColorAt(i, c.set(beads[i % beads.length]).multiplyScalar(2.2));
      this.list.push({ i, x: HATCH.x, z: HATCH.z, y: 0, yaw: 0, phase: Math.random() * 6, path: [], wait: 0, state: 'home', speed: 2.0 + Math.random() * 0.6, look: null });
    }
    this.group = new THREE.Group(); this.group.add(this.body, this.detail, this.bead); this.group.visible = false;
    this._m = new THREE.Matrix4(); this._q = new THREE.Quaternion(); this._v = new THREE.Vector3(); this._s = new THREE.Vector3(); this._up = new THREE.Vector3(0, 1, 0);
  }
  // Out of the hatch in a line, across the plain, in at the door, and each to a picture of its own.
  fileIn(spots) {
    this.group.visible = true;
    const D = DOME, door = { x: D.x, z: D.z + D.OUT + D.PORCH + 1 }, inside = { x: D.x, z: D.z + D.IN - 2 };
    this.list.forEach((v, i) => {
      const s = spots[i % spots.length], r = D.IN - 3.2 - (i >= spots.length ? 1.6 : 0) - (i % 2) * 0.6, tx = D.x + Math.sin(s.a) * r, tz = D.z + Math.cos(s.a) * r;
      v.x = HATCH.x + 2.2; v.z = HATCH.z + 1.2; v.y = 0; v.wait = i * 0.9; v.state = 'walk';
      v.path = [{ x: HATCH.x + 5, z: HATCH.z + 3 }, { x: -14, z: door.z + 1.5 }, door, inside, { x: tx, z: tz }];
      v.look = s;
    });
  }
  // Already there (a game picked up after the opening): standing about the dome.
  settle(spots) { this.fileIn(spots); for (const v of this.list) { const p = v.path[v.path.length - 1]; v.x = p.x; v.z = p.z; v.path = []; v.wait = Math.random() * 3; v.state = 'look'; } }
  get inside() { return this.list.filter(v => v.state === 'look' || (v.path.length <= 1 && v.state === 'walk')).length; }
  update(dt, t, car) {
    if (!this.group.visible) return;
    const M = this._m, Q = this._q, V = this._v, S = this._s, D = DOME;
    for (const v of this.list) {
      let moving = false;
      if (v.wait > 0) v.wait -= dt;
      else if (v.state === 'walk' && v.path.length) {
        const p = v.path[0], dx = p.x - v.x, dz = p.z - v.z, d = Math.hypot(dx, dz);
        if (d < 0.25) v.path.shift();
        else { const st = Math.min(d, v.speed * dt); v.x += dx / d * st; v.z += dz / d * st; v.yaw = Math.atan2(dx, dz); moving = true; }
        if (!v.path.length) { v.state = 'look'; v.wait = 1 + Math.random() * 4; }
      } else if (v.state === 'look') {
        // stand and look at the picture; now and then wander a step or two along the wall
        const s = v.look, ty = Math.atan2(s.x - v.x, s.z - v.z); v.yaw += Math.atan2(Math.sin(ty - v.yaw), Math.cos(ty - v.yaw)) * Math.min(1, dt * 3);
        if (v.wait <= 0) { const a = s.a + (Math.random() - 0.5) * 0.25, r = D.IN - 3 - Math.random() * 2.5; v.path = [{ x: D.x + Math.sin(a) * r, z: D.z + Math.cos(a) * r }]; v.state = 'walk'; v.wait = 0; }
      }
      // out of the way of the toy
      if (car) { const dx = v.x - car.x, dz = v.z - car.z, d = Math.hypot(dx, dz); if (d < 0.75 && d > 1e-3 && Math.abs(car.y - v.y) < 1) { v.x += dx / d * (0.75 - d); v.z += dz / d * (0.75 - d); v.hop = 0.5; } }
      v.phase += dt * (moving ? 7.5 : 2);
      const hop = moving ? Math.abs(Math.sin(v.phase)) * 0.16 : Math.max(0, Math.sin(v.phase * 0.5)) * 0.02 + (v.hop > 0 ? (v.hop -= dt, Math.sin(v.hop * 6) * 0.2) : 0);
      v.y = Math.max(0, hop) + (Math.hypot(v.x - D.x, v.z - D.z) < D.IN ? 0.005 : Math.max(0, moonH(v.x, v.z)));
      const sq = moving ? 1 + Math.cos(v.phase * 2) * 0.05 : 1;
      Q.setFromAxisAngle(this._up, v.yaw); M.compose(V.set(v.x, v.y, v.z), Q, S.set(1 / Math.sqrt(sq), sq, 1 / Math.sqrt(sq)));
      this.body.setMatrixAt(v.i, M); this.detail.setMatrixAt(v.i, M); this.bead.setMatrixAt(v.i, M);
    }
    this.body.instanceMatrix.needsUpdate = this.detail.instanceMatrix.needsUpdate = this.bead.instanceMatrix.needsUpdate = true;
  }
}

// ----------------------------------------------------------------- the dust --
// With no air to hold it up, the dust thrown up flies in clean arcs and falls straight back down.
const DUST_V = `attribute float size; attribute float alpha; varying float vA; uniform float uScale;
void main() { vA = alpha; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = size * uScale / max(0.1, -mv.z); }`;
const DUST_F = `varying float vA; void main() { float d = length(gl_PointCoord - 0.5) * 2.0; float a = smoothstep(1.0, 0.2, d) * vA; if (a < 0.01) discard; gl_FragColor = vec4(vec3(0.62, 0.61, 0.58) * 0.9, a); }`;
export class Dust {
  constructor(n = 900, pixel = 1) {
    this.n = n; this.p = new Float32Array(n * 3); this.v = new Float32Array(n * 3); this.life = new Float32Array(n); this.max = new Float32Array(n); this.sz = new Float32Array(n); this.a = new Float32Array(n); this.next = 0;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.p, 3)); g.setAttribute('size', new THREE.BufferAttribute(this.sz, 1)); g.setAttribute('alpha', new THREE.BufferAttribute(this.a, 1));
    this.points = new THREE.Points(g, new THREE.ShaderMaterial({ vertexShader: DUST_V, fragmentShader: DUST_F, uniforms: { uScale: { value: 300 * pixel } }, transparent: true, depthWrite: false }));
    this.points.frustumCulled = false; this.live = 0;
  }
  puff(x, y, z, vx, vy, vz, size = 0.08, life = 3) {
    const i = this.next; this.next = (this.next + 1) % this.n;
    this.p.set([x, y, z], i * 3); this.v.set([vx, vy, vz], i * 3); this.life[i] = life; this.max[i] = life; this.sz[i] = size;
  }
  burst(x, y, z, n, speed, size = 0.1) {
    for (let k = 0; k < n; k++) { const a = Math.random() * TAU, s = speed * (0.4 + Math.random() * 0.8); this.puff(x + Math.cos(a) * 0.1, y + 0.02, z + Math.sin(a) * 0.1, Math.cos(a) * s, speed * (0.3 + Math.random() * 0.8), Math.sin(a) * s, size * (0.6 + Math.random() * 0.9), 2 + Math.random() * 2.5); }
  }
  update(dt, g = MOON_G, ground = moonH) {
    let live = 0;
    for (let i = 0; i < this.n; i++) {
      if (this.life[i] <= 0) { this.a[i] = 0; continue; }
      live++;
      this.life[i] -= dt; const k = i * 3;
      this.v[k + 1] -= g * dt;
      this.p[k] += this.v[k] * dt; this.p[k + 1] += this.v[k + 1] * dt; this.p[k + 2] += this.v[k + 2] * dt;
      const gy = ground(this.p[k], this.p[k + 2]);
      if (this.p[k + 1] < gy) { this.p[k + 1] = gy; this.v[k] *= 0.3; this.v[k + 1] = 0; this.v[k + 2] *= 0.3; this.life[i] = Math.min(this.life[i], 0.6); }
      this.a[i] = Math.min(1, this.life[i] / Math.min(1, this.max[i])) * 0.55;
    }
    this.live = live;
    const geo = this.points.geometry; geo.attributes.position.needsUpdate = true; geo.attributes.alpha.needsUpdate = true; geo.attributes.size.needsUpdate = true;
  }
}
