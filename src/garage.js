// The garage. More toys than the two you start with: they unlock as you see more of the
// collection, and a couple for trophies. Each is a different body on the same car or drone
// (Car.reskin, Drone.reskin in vehicles.js), built from boxes and cylinders like the first two,
// and each handles a little differently. None climbs worse than the first: the slopes in the
// building are what they are.

import * as THREE from 'three';
import { buildCar, buildDrone, blobShadow } from './vehicles.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.5, ...o });
const paintOf = c => std(c, { roughness: 0.3, emissive: c, emissiveIntensity: 0.12 });
const P = m => { m.name = 'paint'; return m; };       // the one a can of spray paint goes on (see PAINTS, below)

// Spray paint, by the can, from the vending machines (src/vending.js). A colour bought is kept for good and can
// be put on the body of any toy: the main panels only, the trim and the glass stay as they were made.
export const PAINTS = [
  ['signal', 'Signal Red', 0xd2261c], ['tangerine', 'Tangerine', 0xf07a14], ['taxi', 'Taxi Yellow', 0xf2c21b], ['lime', 'Lime', 0x9ad82e], ['racing', 'Racing Green', 0x12683a], ['teal', 'Teal', 0x13908c],
  ['sky', 'Sky Blue', 0x4aa8e8], ['cobalt', 'Cobalt', 0x1e4fc8], ['midnight', 'Midnight', 0x18204a], ['violet', 'Violet', 0x7a3ad0], ['magenta', 'Magenta', 0xd81e8a], ['rose', 'Rose', 0xf08aa8],
  ['cream', 'Gallery Cream', 0xefe6cf], ['white', 'Plaster White', 0xf4f4f0], ['silver', 'Silver', 0xb4bcc6], ['graphite', 'Graphite', 0x3a3e46], ['black', 'Piano Black', 0x101114], ['chocolate', 'Chocolate', 0x5a341c],
  ['gold', 'Gilt Frame', 0xd8a838], ['bronze', 'Lion Bronze', 0x4fa596], ['brick', 'Brick', 0x9a3e2a], ['olive', 'Olive', 0x6a7030], ['mint', 'Mint', 0x9fe0c0], ['lilac', 'Lilac', 0xb9a4e6],
  ['coral', 'Coral', 0xff6f5a], ['mustard', 'Mustard', 0xc89a1c], ['ultramarine', 'Ultramarine', 0x2a2ad8], ['forest', 'Forest', 0x1f4a2a], ['plum', 'Plum', 0x5a1e4a], ['ice', 'Ice', 0xcfeaf6],
].map(([id, name, hex]) => ({ id, name, hex }));
const PAINT_OF = Object.fromEntries(PAINTS.map(p => [p.id, p]));
/** Put a colour on a toy's body, or (null) give it back its own. */
export function repaint(body, hex) {
  if (!body) return false;
  let m = body.userData.paintMat;
  if (m === undefined) { m = null; body.traverse(o => { if (!m && o.isMesh && o.material && o.material.name === 'paint') m = o.material; }); body.userData.paintMat = m; if (m) m.userData.base = { color: m.color.clone(), emissive: m.emissive ? m.emissive.clone() : null }; }
  if (!m) return false;
  const b = m.userData.base;
  if (hex == null) { m.color.copy(b.color); if (b.emissive) m.emissive.copy(b.emissive); return true; }
  m.color.set(hex);
  if (m.userData.chrome) m.color.lerp(new THREE.Color(1, 1, 1), 0.2);                       // still a mirror, tinted
  else if (b.emissive && (b.emissive.r + b.emissive.g + b.emissive.b) > 0.01) m.emissive.set(hex);
  return true;
}
// Polished chrome. A mirror needs something to reflect, so it is given a night to look at: a dark
// sky, a band of city lights, the warm lamps of the galleries and the colours of Griffin Court's
// roof, painted once onto a panorama. It is not the room you are in, but it moves the way one would.
// (Shared: the probe's hull reflects the same night, src/probe.js.)
let _night = null;
export function night() {
  if (_night || typeof document === 'undefined') return _night;
  const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 512;
  const c = cv.getContext('2d'), sky = c.createLinearGradient(0, 0, 0, 512);
  sky.addColorStop(0, '#1a1050'); sky.addColorStop(0.2, '#3a2a9a'); sky.addColorStop(0.4, '#c040b0'); sky.addColorStop(0.5, '#ffb060'); sky.addColorStop(0.53, '#6a3a20'); sky.addColorStop(0.75, '#2a2440'); sky.addColorStop(1, '#101020');
  c.fillStyle = sky; c.fillRect(0, 0, 1024, 512);
  let k = 11; const rnd = () => ((k = (k * 1103515245 + 12345) >>> 0) / 4294967296);
  const lamp = (x, y, r, col) => { const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(x - r, y - r, 2 * r, 2 * r); };
  // Broad bands of the roof's colours right round the sky, so that every curve picks one up.
  const GEL = ['#ffe14a', '#ff9a2d', '#ff4a3c', '#ff40c8', '#a050ff', '#4a5aff', '#30b0ff', '#40f0e0', '#70e060', '#fff0c0'];
  for (let i = 0; i < 20; i++) lamp(26 + i * 51.2, 70 + (i % 4) * 44, 78, GEL[i % GEL.length]);
  for (let i = 0; i < 12; i++) lamp(40 + i * 86, 330 + (i % 3) * 46, 90, GEL[(i * 3 + 2) % GEL.length]);                    // and their light off the floor
  for (let i = 0; i < 320; i++) { c.fillStyle = `rgba(255,255,255,${0.5 + rnd() * 0.5})`; c.fillRect(rnd() * 1024, rnd() * 200, 2, 2); }                          // stars
  for (let i = 0; i < 900; i++) { c.fillStyle = ['#ffe9a0', '#ffffff', '#a8dcff', '#ffc27a', '#ff8ad8'][i % 5]; c.fillRect(rnd() * 1024, 226 + rnd() * 44, 3, 3 + rnd() * 4); }   // the city
  lamp(512, 64, 110, 'rgba(255,255,255,1)'); lamp(512, 64, 40, 'rgba(255,255,255,1)');   // the moon, and a hard white glint
  lamp(120, 250, 60, 'rgba(255,255,255,.9)'); lamp(860, 250, 60, 'rgba(255,255,255,.9)');
  const t = new THREE.CanvasTexture(cv); t.mapping = THREE.EquirectangularReflectionMapping; t.colorSpace = THREE.SRGBColorSpace;
  return (_night = t);
}
const mirror = () => { const m = new THREE.MeshStandardMaterial({ color: 0xf4f7ff, metalness: 1, roughness: 0.02, envMap: night(), envMapIntensity: 2.6 }); m.userData.chrome = true; return m; };      // (chrome: src/livemirror.js may show the real surroundings in it)
const glow = (r, g, b) => new THREE.MeshBasicMaterial({ color: new THREE.Color(r, g, b) });
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const cyl = (r0, r1, h, n = 12, hs = 1, open = false) => new THREE.CylinderGeometry(r0, r1, h, n, hs, open);
const ball = (r, w = 10, h = 8) => new THREE.SphereGeometry(r, w, h);
function part(geo, mat, x, y, z, parent) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  parent.add(m);
  return m;
}

// `need`: distinct works seen. `trophy`: the trophy that unlocks it instead. `spec`: handling, as
// multiples of the first toy's (see CAR_SPEC and DRONE_SPEC in vehicles.js).
export const VEHICLES = [
  { id: 'buggy', kind: 'car', name: 'RC Car', hint: 'Fits under the benches. Leaves the floor if you find a ramp.', need: 0, spec: {} },
  { id: 'truck', kind: 'car', name: 'Monster Truck', hint: 'Big studded tyres. Hops higher, holds on ice, not as quick.', need: 15, spec: { top: 0.93, accel: 0.95, grip: 1.15, jump: 1.12, ice: 0.7 } },
  { id: 'rally', kind: 'car', name: 'Rally Hatch', hint: 'Turns in sharply and holds a line on marble.', need: 40, spec: { top: 1.04, grip: 1.3, steer: 1.1 } },
  { id: 'racer', kind: 'car', name: 'Grand Prix', hint: 'Low, quick and nervous. Hops a little lower.', need: 100, spec: { top: 1.1, accel: 1.12, grip: 1.1, steer: 1.05, jump: 0.94 } },
  { id: 'van', kind: 'car', name: 'Art Van', hint: 'The art handlers’ van. Steady, and in no hurry.', trophy: 'dock', how: 'Find the loading dock', spec: { top: 0.96, accel: 0.95, grip: 1.1, steer: 0.95, jump: 1.05 } },
  { id: 'super', kind: 'car', name: 'Supercar', hint: 'Low, wide and far too fast for a museum.', shop: 2000, how: 'For sale at the stall by the card game', spec: { top: 1.16, accel: 1.2, grip: 1.25, steer: 1.08, jump: 0.96 } },
  // In the Museum Shop's showroom (shop: chips; showroom: the shop lists these).
  { id: 'kart', kind: 'car', name: 'Go-Kart', hint: 'Low, light and twitchy. Slides through the turns.', shop: 600, showroom: true, how: 'For sale in the Museum Shop', spec: { top: 1.12, accel: 1.3, grip: 0.62, steer: 1.35, jump: 0.9 } },
  { id: 'stretch', kind: 'car', name: 'Stretch Pickup', hint: 'Far too long. Turns like a bus, carries five lost things.', shop: 1200, showroom: true, how: 'For sale in the Museum Shop', spec: { top: 0.95, accel: 0.85, grip: 1.25, steer: 0.62, jump: 0.85, carry: 5 } },
  { id: 'plow', kind: 'car', name: 'Snowplow', hint: 'Clears a path through the snow and shoves things aside.', shop: 1500, showroom: true, how: 'For sale in the Museum Shop', spec: { top: 0.8, accel: 0.9, grip: 1.3, steer: 0.85, jump: 0.9, ice: 0.85 } },
  { id: 'semi', kind: 'car', name: 'Semi Truck', hint: 'Hauls a trailer. Mind it in the turns, and never back up in a hurry.', shop: 3000, showroom: true, how: 'For sale in the Museum Shop', spec: { top: 0.86, accel: 0.7, grip: 1.3, steer: 0.75, jump: 0.6 } },
  { id: 'xmas', kind: 'car', name: 'Candy Cane Express', hint: 'Red, white and lit up like the tree it came from under.', gift: true, how: 'Somebody left it under a tree', spec: { top: 1.03, grip: 1.12, jump: 1.1 } },
  { id: 'quad', kind: 'drone', name: 'RC Drone', hint: 'Goes up to the glass. Meets a painting eye to eye.', need: 0, spec: {} },
  { id: 'hex', kind: 'drone', name: 'Hexacopter', hint: 'Six rotors. Climbs hard, turns steadily.', need: 25, spec: { accel: 0.95, climb: 1.2, yaw: 0.95 } },
  { id: 'airship', kind: 'drone', name: 'Airship', hint: 'Drifts. Good for standing off from a large canvas.', need: 60, spec: { accel: 0.82, climb: 0.85, yaw: 0.85 } },
  { id: 'fpv', kind: 'drone', name: 'Racing Quad', hint: 'Small and sharp. Quicker in every direction.', trophy: 'bullet', how: 'Land a Stunt Look in slow motion', spec: { accel: 1.15, climb: 1.12, yaw: 1.2 } },
  { id: 'manta', kind: 'drone', name: 'Manta', hint: 'A ray in polished chrome. Everything round it slides across it.', shop: 2000, how: 'For sale at the stall by the card game', spec: { accel: 1.12, climb: 1.1, yaw: 1.12 } },
  // Not from the toy shop. `secret`: until it is unlocked the selector will not even say what it is.
  // `drag` is how hard it stops when the stick is let go (it hangs dead still); `hum` is its own note (src/audio.js).
  { id: 'ufo', kind: 'drone', name: 'UFO', hint: 'No rotors. Stops dead, turns on the spot, goes like nothing on Earth.', trophy: 'ufo', how: '???', secret: true, spec: { accel: 2.3, climb: 1.3, yaw: 1.4, drag: 2.5, hum: 'ufo' } },
];
const BY_ID = Object.fromEntries(VEHICLES.map(v => [v.id, v]));

// ------------------------------------------------------------------ cars ---

function wheel(g, wheels, x, z, r, w, front, hubMat, sides = 6) {
  const pivot = new THREE.Group();
  pivot.position.set(x, r, z);
  const spin = new THREE.Group();
  const t = new THREE.Mesh(cyl(r, r, w, 16), std(0x08080a, { roughness: 0.9 })); t.rotation.z = Math.PI / 2;
  const hub = new THREE.Mesh(cyl(r * 0.55, r * 0.55, w + 0.004, sides), hubMat); hub.rotation.z = Math.PI / 2;
  spin.add(t, hub);
  pivot.add(spin);
  g.add(pivot);
  wheels.push({ pivot, spin, r, front });
}
function aerialOn(body, x, y, z, len, tip) {
  const aerial = new THREE.Group();
  aerial.position.set(x, y, z);
  part(cyl(0.0022, 0.003, len, 5), std(0xbfc4c9, { metalness: 0.8, roughness: 0.3 }), 0, len / 2, 0, aerial);
  part(ball(0.008, 8, 6), tip, 0, len + 0.005, 0, aerial);
  body.add(aerial);
  return aerial;
}
function lights(body, x, y, zf, zr) {
  for (const s of [-1, 1]) {
    part(ball(0.017), glow(4, 3.6, 2.6), s * x, y, zf, body);
    part(box(0.03, 0.014, 0.01), glow(2.2, 0.1, 0.08), s * x, y, zr, body);
  }
}

// ---- for the showroom toys (kart, stretch, plow, semi): a side profile pushed out across the toy, bevelled; a kit that
// gathers parts by material, so a toy with a great deal on it is still only a handful of meshes; and a better wheel.
// Profiles are [z, y] points (front at +z), or a function that draws a THREE.Shape in those terms.
function extrude(draw, w, bevel = 0.004) {
  const sh = new THREE.Shape();
  if (Array.isArray(draw)) { sh.moveTo(draw[0][0], draw[0][1]); for (const [z, y] of draw.slice(1)) sh.lineTo(z, y); sh.closePath(); } else draw(sh);
  const d = Math.max(0.001, w - 2 * bevel);
  const g = new THREE.ExtrudeGeometry(sh, { depth: d, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel * 0.8, bevelOffset: -bevel * 0.8, bevelSegments: 1, curveSegments: 5 });
  g.translate(0, 0, -d / 2); g.rotateY(-Math.PI / 2);
  return g;
}
// A band round a wheel arch: from radius ri to ro about (zc, yc), between the heights where it meets y0.
function archBand(zc, yc, ri, ro, y0, w) {
  return extrude(sh => {
    const ao = Math.asin(Math.max(-1, Math.min(1, (y0 - yc) / ro))), ai = Math.asin(Math.max(-1, Math.min(1, (y0 - yc) / ri)));
    sh.absarc(zc, yc, ro, Math.PI - ao, ao, true); sh.absarc(zc, yc, ri, ai, Math.PI - ai, false); sh.closePath();
  }, w, 0.002);
}
const _ka = new THREE.Vector3(), _kq = new THREE.Quaternion(), _ke = new THREE.Euler(), _km = new THREE.Matrix4(), _ky = new THREE.Vector3(0, 1, 0), _k1 = new THREE.Vector3(1, 1, 1);
class Kit {
  constructor(parent) { this.parent = parent; this.by = new Map(); }
  add(geo, mat, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) {
    const g = geo.index ? geo.toNonIndexed() : geo.clone(); g.clearGroups();
    _kq.setFromEuler(_ke.set(rx, ry, rz)); g.applyMatrix4(_km.compose(_ka.set(x, y, z), _kq, _k1));
    if (!this.by.has(mat)) this.by.set(mat, []); this.by.get(mat).push(g);
    return this;
  }
  // a round bar from a to b ([x, y, z])
  rod(a, b, r, mat, n = 6) {
    const d = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]), L = d.length(); if (L < 1e-5) return this;
    const g = cyl(r, r, L, n, 1, true); g.applyQuaternion(_kq.setFromUnitVectors(_ky, d.normalize())); g.translate((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
    return this.add(g, mat);
  }
  done() { for (const [mat, list] of this.by) this.parent.add(new THREE.Mesh(mergeGeometries(list, false), mat)); this.by.clear(); return this.parent; }
}
let _tyre = null, _rimDark = null;
// A wheel with a tyre, a rim, a dark well and a hub with spokes, and (tread) lugs round it. Spins like wheel()'s.
function wheel2(g, wheels, x, z, r, w, front, hubMat, o = {}) {
  const pivot = new THREE.Group(); pivot.position.set(x, r, z);
  const spin = new THREE.Group(); pivot.add(spin);
  const tyre = _tyre || (_tyre = std(0x0d0d0f, { roughness: 0.92 })), dark = _rimDark || (_rimDark = std(0x1c1e22, { roughness: 0.6, metalness: 0.3 }));
  const K = new Kit(spin), Z = Math.PI / 2;
  K.add(cyl(r, r, w, 16, 1, true), tyre, 0, 0, 0, 0, 0, Z);
  K.add(cyl(r * 0.9, r * 0.9, w + 0.003, 14), tyre, 0, 0, 0, 0, 0, Z);                    // the sidewall's shoulder
  K.add(cyl(r * 0.64, r * 0.64, w + 0.005, 12, 1, true), hubMat, 0, 0, 0, 0, 0, Z);         // the rim
  K.add(cyl(r * 0.5, r * 0.5, w + 0.007, 10), dark, 0, 0, 0, 0, 0, Z);                      // its well
  K.add(cyl(r * 0.2, r * 0.2, w + 0.011, 8), hubMat, 0, 0, 0, 0, 0, Z);                     // the hub
  const n = o.spokes || 4; for (let i = 0; i < n; i++) K.add(box(w + 0.009, r * 0.09, r * 0.92), hubMat, 0, 0, 0, i * Math.PI / n, 0, 0);
  if (o.tread) for (let i = 0; i < o.tread; i++) { const a = i * Math.PI * 2 / o.tread; K.add(box(w * 0.86, r * 0.1, r * 0.16), tyre, 0, Math.cos(a) * r, Math.sin(a) * r, a, 0, 0); }
  if (o.dual) { K.add(cyl(r, r, w, 16), tyre, -Math.sign(x) * (w + 0.003), 0, 0, 0, 0, Z); }
  K.done(); g.add(pivot);
  wheels.push({ pivot, spin, r, front });
}
// A little painted plate (a race number, a name board), as a texture.
function plate(w, h, draw) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}

const CARS = {
  // A pickup on tyres far too big for it.
  truck() {
    const g = new THREE.Group(), body = new THREE.Group(), wheels = [];
    g.add(body);
    const paint = P(paintOf(0x1e63c8)), black = std(0x0c0c0e, { roughness: 0.7 }), chrome = std(0xcfd4da, { metalness: 0.85, roughness: 0.25 }), flame = paintOf(0xf2a116);
    part(box(0.16, 0.03, 0.4), black, 0, 0.15, 0, body);                                  // frame, high off the floor
    for (const z of [0.14, -0.14]) part(box(0.3, 0.02, 0.025), chrome, 0, 0.095, z, body); // axles
    for (const s of [-1, 1]) for (const z of [0.14, -0.14]) { const sh = part(cyl(0.008, 0.008, 0.09, 6), flame, s * 0.07, 0.125, z, body); sh.rotation.z = s * 0.5; }
    part(box(0.2, 0.06, 0.42), paint, 0, 0.2, 0, body);                                   // tub
    part(box(0.18, 0.075, 0.13), std(0x10151c, { roughness: 0.15, metalness: 0.5 }), 0, 0.265, 0.03, body);   // cab glass
    part(box(0.185, 0.014, 0.14), paint, 0, 0.31, 0.03, body);                            // roof
    part(box(0.18, 0.035, 0.14), paint, 0, 0.245, 0.15, body);                            // bonnet
    for (const s of [-1, 1]) part(box(0.012, 0.045, 0.16), paint, s * 0.094, 0.25, -0.12, body);            // bed sides
    part(box(0.2, 0.045, 0.012), paint, 0, 0.25, -0.204, body);                           // tailgate
    for (const s of [-1, 1]) part(box(0.008, 0.02, 0.2), flame, s * 0.101, 0.2, 0.06, body);                // a stripe of flame
    for (const s of [-1, 1]) part(cyl(0.007, 0.007, 0.1, 6), chrome, s * 0.08, 0.3, -0.045, body);          // roll bar
    part(box(0.17, 0.014, 0.014), chrome, 0, 0.35, -0.045, body);
    for (const s of [-1, 0, 1]) part(ball(0.014), glow(4, 3.8, 3), s * 0.05, 0.365, -0.04, body);            // lamps on the bar
    part(box(0.22, 0.03, 0.025), chrome, 0, 0.165, 0.222, body);                          // bumper
    lights(body, 0.07, 0.205, 0.212, -0.212);
    for (const [x, z, f] of [[-0.145, 0.14, true], [0.145, 0.14, true], [-0.145, -0.14, false], [0.145, -0.14, false]]) wheel(g, wheels, x, z, 0.095, 0.085, f, chrome, 8);
    const aerial = aerialOn(body, -0.08, 0.31, -0.02, 0.3, glow(0.2, 0.8, 1.6));
    return { group: g, body, wheels, aerial };
  },
  // A hot hatch in rally colours, lamps on the roof.
  rally() {
    const g = new THREE.Group(), body = new THREE.Group(), wheels = [];
    g.add(body);
    const paint = P(paintOf(0xf1f1ee)), blue = paintOf(0x1746a8), red = paintOf(0xd3202a), black = std(0x0c0c0e, { roughness: 0.7 }), white = std(0xf4f4f4, { roughness: 0.4 });
    part(box(0.2, 0.02, 0.42), black, 0, 0.055, 0, body);
    part(box(0.205, 0.06, 0.41), paint, 0, 0.095, 0, body);                               // tub
    const hood = part(box(0.19, 0.02, 0.13), paint, 0, 0.13, 0.135, body); hood.rotation.x = 0.12;
    part(box(0.18, 0.062, 0.23), std(0x10151c, { roughness: 0.15, metalness: 0.5 }), 0, 0.155, -0.065, body);   // glass, right to the tail
    part(box(0.185, 0.012, 0.2), paint, 0, 0.191, -0.07, body);                           // roof
    part(box(0.05, 0.004, 0.42), blue, -0.03, 0.127, 0, body); part(box(0.022, 0.004, 0.42), red, 0.02, 0.127, 0, body);     // stripes over the top
    part(box(0.05, 0.004, 0.2), blue, -0.03, 0.199, -0.07, body); part(box(0.022, 0.004, 0.2), red, 0.02, 0.199, -0.07, body);
    for (const s of [-1, 1]) part(box(0.004, 0.035, 0.1), white, s * 0.104, 0.1, 0, body);                  // door numbers
    part(box(0.19, 0.008, 0.035), black, 0, 0.205, -0.175, body);                         // roof spoiler
    for (const s of [-1.5, -0.5, 0.5, 1.5]) part(ball(0.015), glow(4.2, 4, 3.2), s * 0.036, 0.212, 0.02, body);  // four lamps
    part(box(0.16, 0.012, 0.012), black, 0, 0.2, 0.012, body);
    for (const s of [-1, 1]) for (const z of [0.07, -0.21]) part(box(0.04, 0.045, 0.004), red, s * 0.092, 0.06, z, body);   // mud flaps
    lights(body, 0.075, 0.1, 0.208, -0.207);
    for (const [x, z, f] of [[-0.115, 0.135, true], [0.115, 0.135, true], [-0.115, -0.135, false], [0.115, -0.135, false]]) wheel(g, wheels, x, z, 0.054, 0.045, f, white, 5);
    const aerial = aerialOn(body, 0.07, 0.19, -0.14, 0.2, glow(1.6, 0.2, 0.1));
    return { group: g, body, wheels, aerial };
  },
  // An open-wheeler: all nose, wings and tyres.
  racer() {
    const g = new THREE.Group(), body = new THREE.Group(), wheels = [];
    g.add(body);
    const paint = P(paintOf(0x0f6b3a)), black = std(0x0c0c0e, { roughness: 0.7 }), gold = paintOf(0xe7b43a), white = std(0xf4f4f4, { roughness: 0.4 });
    part(box(0.085, 0.045, 0.3), paint, 0, 0.075, -0.03, body);                           // the tub
    const nose = part(box(0.05, 0.03, 0.17), paint, 0, 0.065, 0.165, body); nose.rotation.x = 0.1;
    part(box(0.27, 0.008, 0.055), gold, 0, 0.035, 0.225, body);                           // front wing
    for (const s of [-1, 1]) part(box(0.006, 0.03, 0.055), gold, s * 0.134, 0.047, 0.225, body);
    for (const s of [-1, 1]) part(box(0.045, 0.04, 0.16), paint, s * 0.065, 0.065, -0.05, body);            // side pods
    part(box(0.07, 0.05, 0.1), paint, 0, 0.115, -0.11, body);                             // engine cover
    part(box(0.03, 0.035, 0.04), black, 0, 0.155, -0.075, body);                          // air box
    part(ball(0.026, 12, 10), gold, 0, 0.118, -0.01, body);                               // the driver
    part(box(0.06, 0.012, 0.01), std(0x10151c, { roughness: 0.15, metalness: 0.5 }), 0, 0.12, 0.014, body);
    for (const s of [-1, 1]) part(box(0.008, 0.09, 0.03), black, s * 0.035, 0.13, -0.165, body);            // rear wing, its posts standing on the tub
    part(box(0.2, 0.01, 0.06), gold, 0, 0.175, -0.168, body); part(box(0.2, 0.008, 0.035), paint, 0, 0.145, -0.172, body);
    const disc = part(cyl(0.022, 0.022, 0.004, 14), white, 0, 0.1, 0.1, body); disc.rotation.x = 0.1;        // the number
    for (const s of [-1, 1]) for (const z of [0.135, -0.14]) part(box(0.104, 0.008, 0.012), black, s * 0.07, 0.058, z, body);   // wishbones, from the nose and the tub out to the wheels
    for (const s of [-1, 1]) part(box(0.03, 0.014, 0.01), glow(2.2, 0.1, 0.08), s * 0.02, 0.07, -0.185, body);
    part(ball(0.012), glow(4, 3.6, 2.6), 0, 0.066, 0.25, body);
    for (const [x, z, r, w, f] of [[-0.13, 0.135, 0.05, 0.045, true], [0.13, 0.135, 0.05, 0.045, true], [-0.133, -0.14, 0.064, 0.072, false], [0.133, -0.14, 0.064, 0.072, false]]) wheel(g, wheels, x, z, r, w, f, gold, 10);
    const aerial = aerialOn(body, 0, 0.17, -0.07, 0.14, glow(1.3, 0.9, 0.1));
    return { group: g, body, wheels, aerial };
  },
  // The Christmas car: a red pickup trimmed in white, candy-cane bars front and back, a string of
  // coloured bulbs down each side, a wreath on the grille and a little lit tree in the bed.
  xmas() {
    const g = new THREE.Group(), body = new THREE.Group(), wheels = [];
    g.add(body);
    const red = P(paintOf(0xc4161c)), white = std(0xf6f4ee, { roughness: 0.6, emissive: 0xf6f4ee, emissiveIntensity: 0.12 }), green = paintOf(0x1c7a3a), gold = std(0xe2be5a, { roughness: 0.4, metalness: 0.5, emissive: 0x6a5216, emissiveIntensity: 0.6 }), dark = std(0x0c0c0e, { roughness: 0.7 });
    part(box(0.2, 0.05, 0.4), red, 0, 0.085, 0, body);                                    // the chassis
    part(box(0.19, 0.06, 0.14), red, 0, 0.14, 0.02, body);                                // the cab
    part(box(0.2, 0.012, 0.15), white, 0, 0.176, 0.02, body);                             // snow on its roof
    part(box(0.17, 0.035, 0.006), std(0x9fd0e8, { roughness: 0.1, metalness: 0.5 }), 0, 0.142, 0.092, body);   // windscreen
    part(box(0.205, 0.014, 0.41), white, 0, 0.062, 0, body);                              // a white stripe right round
    for (const s of [-1, 1]) part(box(0.012, 0.045, 0.16), green, s * 0.094, 0.125, -0.12, body);            // the sides of the bed
    part(box(0.2, 0.045, 0.012), green, 0, 0.125, -0.198, body);
    // Candy canes: a hoop over the cab and a bar at each end, striped red and white.
    const cane = (x0, y0, z0, x1, y1, z1, n = 8) => { for (let i = 0; i < n; i++) { const t = (i + 0.5) / n, m = part(box(Math.abs(x1 - x0) / n + 0.014, Math.abs(y1 - y0) / n + 0.014, Math.abs(z1 - z0) / n + 0.014), i % 2 ? white : red, x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, z0 + (z1 - z0) * t, body); m.scale.set(1, 1, 1); } };
    for (const s of [-1, 1]) cane(s * 0.092, 0.11, -0.05, s * 0.092, 0.24, -0.05, 6);     // two posts behind the cab
    cane(-0.092, 0.24, -0.05, 0.092, 0.24, -0.05, 8);                                     // and the bar across them
    for (const s of [-1, 1]) { const hook = part(new THREE.TorusGeometry(0.022, 0.007, 6, 10, Math.PI), red, s * 0.092, 0.24, -0.028, body); hook.rotation.y = Math.PI / 2; }      // each post ends in a crook
    cane(-0.1, 0.07, 0.212, 0.1, 0.07, 0.212, 8); cane(-0.1, 0.07, -0.212, 0.1, 0.07, -0.212, 8);        // bumpers
    // A string of bulbs down each side and over the bar.
    const BULB = [[3.4, 0.3, 0.2], [0.3, 3.0, 0.5], [3.2, 2.4, 0.3], [0.3, 1.4, 3.4], [3.2, 0.4, 2.6]];
    for (const s of [-1, 1]) for (let i = 0; i < 9; i++) part(ball(0.0085, 6, 5), glow(...BULB[(i + (s > 0 ? 2 : 0)) % 5]), s * 0.105, 0.108 + Math.sin(i / 8 * Math.PI) * -0.012, -0.18 + i * 0.045, body);
    for (let i = 0; i < 7; i++) part(ball(0.0085, 6, 5), glow(...BULB[i % 5]), -0.075 + i * 0.025, 0.256, -0.05, body);
    // A wreath on the grille, with a bow.
    const wreath = part(new THREE.TorusGeometry(0.03, 0.011, 6, 14), green, 0, 0.1, 0.206, body); wreath.rotation.set(0, 0, 0);
    part(box(0.022, 0.012, 0.008), red, 0, 0.072, 0.214, body);
    for (const s of [-1, 1]) part(ball(0.013), glow(4, 3.6, 2.6), s * 0.07, 0.1, 0.203, body);                                     // headlamps
    for (const s of [-1, 1]) part(box(0.03, 0.014, 0.01), glow(2.2, 0.1, 0.08), s * 0.07, 0.095, -0.205, body);
    // The tree in the bed: three green tiers, a star, and a few lights.
    for (const [r, y, h] of [[0.06, 0.16, 0.07], [0.045, 0.21, 0.06], [0.03, 0.255, 0.05]]) part(new THREE.ConeGeometry(r, h, 8), green, 0, y, -0.13, body);
    part(ball(0.012, 6, 5), glow(3.6, 3.0, 0.9), 0, 0.29, -0.13, body);
    for (let i = 0; i < 6; i++) { const a = i * 1.05; part(ball(0.006, 5, 4), glow(...BULB[i % 5]), Math.cos(a) * (0.05 - i * 0.004), 0.15 + i * 0.018, -0.13 + Math.sin(a) * (0.05 - i * 0.004), body); }
    for (const [x, z] of [[-0.05, -0.17], [0.045, -0.165]]) { part(box(0.045, 0.035, 0.045), x < 0 ? gold : white, x, 0.128, z, body); part(box(0.047, 0.037, 0.01), red, x, 0.128, z, body); }   // two parcels beside it
    for (const [x, z, f] of [[-0.118, 0.13, true], [0.118, 0.13, true], [-0.118, -0.13, false], [0.118, -0.13, false]]) wheel(g, wheels, x, z, 0.055, 0.05, f, white, 8);
    const aerial = aerialOn(body, 0.07, 0.17, 0.0, 0.16, glow(3.4, 0.3, 0.2));
    return { group: g, body, wheels, aerial };
  },
  // The supercar: a low wedge, wide at the hips, a wing, and a strip of light underneath.
  super() {
    const g = new THREE.Group(), body = new THREE.Group(), wheels = [];
    g.add(body);
    const paint = P(std(0xff5a12, { roughness: 0.18, metalness: 0.55, emissive: 0xff3a00, emissiveIntensity: 0.16 })), carbon = std(0x0b0b0d, { roughness: 0.45, metalness: 0.3 }), glass = std(0x0a1622, { roughness: 0.06, metalness: 0.9 }), rim = std(0xd8dade, { metalness: 0.9, roughness: 0.2 });
    part(box(0.2, 0.012, 0.45), carbon, 0, 0.03, 0, body);                                // the floor and splitter
    part(box(0.19, 0.034, 0.3), paint, 0, 0.056, -0.03, body);                            // the tub
    const nose = part(box(0.17, 0.026, 0.15), paint, 0, 0.05, 0.155, body); nose.rotation.x = 0.16;          // a nose that falls away
    for (const s of [-1, 1]) { const f = part(box(0.05, 0.03, 0.13), paint, s * 0.085, 0.066, 0.13, body); f.rotation.x = 0.1; }      // front wings over the wheels
    for (const s of [-1, 1]) part(box(0.062, 0.05, 0.16), paint, s * 0.092, 0.078, -0.13, body);            // the hips
    for (const s of [-1, 1]) part(box(0.012, 0.03, 0.07), carbon, s * 0.124, 0.07, -0.045, body);           // side intakes
    const screen = part(box(0.14, 0.006, 0.1), glass, 0, 0.098, 0.045, body); screen.rotation.x = 0.42;      // a windscreen laid right back
    part(box(0.132, 0.03, 0.1), glass, 0, 0.098, -0.035, body);                           // the canopy
    part(box(0.12, 0.008, 0.09), paint, 0, 0.116, -0.04, body);                           // its roof
    const deck = part(box(0.13, 0.006, 0.12), glass, 0, 0.1, -0.135, body); deck.rotation.x = -0.2;          // glass over the engine
    for (let i = 0; i < 4; i++) { const l = part(box(0.11, 0.004, 0.01), carbon, 0, 0.106 - i * 0.005, -0.1 - i * 0.022, body); l.rotation.x = -0.2; }   // louvres
    for (const s of [-1, 1]) part(box(0.008, 0.05, 0.04), carbon, s * 0.085, 0.125, -0.2, body);            // wing posts
    part(box(0.23, 0.007, 0.06), carbon, 0, 0.152, -0.205, body);                         // the wing
    for (const s of [-1, 1]) part(box(0.006, 0.026, 0.065), paint, s * 0.116, 0.148, -0.205, body);         // its end plates
    part(box(0.19, 0.03, 0.02), carbon, 0, 0.05, -0.222, body);                           // the diffuser
    for (const x of [-0.045, -0.015, 0.015, 0.045]) { const e = part(cyl(0.008, 0.008, 0.02, 8), rim, x, 0.06, -0.232, body); e.rotation.x = Math.PI / 2; }   // four exhausts
    part(box(0.17, 0.008, 0.006), glow(3.2, 0.12, 0.08), 0, 0.082, -0.212, body);         // a tail light bar right across, set into the tail
    for (const s of [-1, 1]) { const h = part(box(0.04, 0.006, 0.02), glow(4, 3.8, 3.2), s * 0.07, 0.066, 0.222, body); h.rotation.y = -s * 0.3; }      // slit headlamps
    part(box(0.16, 0.004, 0.36), glow(0.1, 1.8, 2.6), 0, 0.02, 0, body);                  // the glow underneath
    for (const [x, z, r, w, f] of [[-0.098, 0.135, 0.046, 0.04, true], [0.098, 0.135, 0.046, 0.04, true], [-0.1, -0.135, 0.052, 0.052, false], [0.1, -0.135, 0.052, 0.052, false]]) wheel(g, wheels, x, z, r, w, f, rim, 10);
    const aerial = aerialOn(body, 0.05, 0.12, -0.07, 0.1, glow(0.1, 1.8, 2.6));
    return { group: g, body, wheels, aerial };
  },
  // The art handlers' van: a white box, a stripe, a beacon on the roof.
  van() {
    const g = new THREE.Group(), body = new THREE.Group(), wheels = [];
    g.add(body);
    const paint = P(paintOf(0xf2efe6)), black = std(0x0c0c0e, { roughness: 0.7 }), stripe = paintOf(0xd9622b), grey = std(0x8d9299, { roughness: 0.5, metalness: 0.4 });
    part(box(0.2, 0.02, 0.42), black, 0, 0.06, 0, body);
    part(box(0.21, 0.175, 0.3), paint, 0, 0.16, -0.055, body);                            // the box
    part(box(0.205, 0.09, 0.115), paint, 0, 0.117, 0.15, body);                           // the cab
    const screen = part(box(0.19, 0.075, 0.012), std(0x10151c, { roughness: 0.15, metalness: 0.5 }), 0, 0.195, 0.125, body); screen.rotation.x = -0.5;
    part(box(0.2, 0.04, 0.07), paint, 0, 0.18, 0.115, body);
    for (const s of [-1, 1]) part(box(0.006, 0.05, 0.06), std(0x10151c, { roughness: 0.15, metalness: 0.5 }), s * 0.103, 0.165, 0.15, body);   // side windows
    for (const s of [-1, 1]) part(box(0.004, 0.022, 0.3), stripe, s * 0.107, 0.14, -0.055, body);           // the stripe
    for (const s of [-1, 1]) { const a = part(box(0.004, 0.05, 0.05), stripe, s * 0.107, 0.2, -0.1, body); a.rotation.x = Math.PI / 4; }    // this way up
    part(box(0.004, 0.14, 0.004), grey, 0, 0.165, -0.2065, body);                          // the gap between the back doors
    part(box(0.19, 0.012, 0.03), grey, 0, 0.07, -0.215, body);                             // step
    part(cyl(0.016, 0.016, 0.022, 10), glow(3.2, 1.6, 0.1), 0, 0.26, 0.04, body);          // beacon
    part(box(0.215, 0.025, 0.02), black, 0, 0.075, 0.215, body);
    lights(body, 0.075, 0.105, 0.21, -0.207);
    for (const [x, z, f] of [[-0.105, 0.13, true], [0.105, 0.13, true], [-0.105, -0.13, false], [0.105, -0.13, false]]) wheel(g, wheels, x, z, 0.052, 0.05, f, grey, 12);
    const aerial = aerialOn(body, -0.08, 0.248, -0.16, 0.22, glow(3.2, 1.6, 0.1));
    return { group: g, body, wheels, aerial };
  },
  // ---- for sale in the Museum Shop (VEHICLES' showroom entries) ----
  // Every part here sits on, or is bolted to, the part that holds it up: built with the helpers above (extrude, Kit,
  // wheel2), each toy is a few merged meshes.

  // A pickup stretched far past any sense: a crew cab with three rows of doors, a long bed, the wheels a whole toy-length
  // apart. It turns like a bus and carries a great deal (spec.carry), and it does not fall over.
  stretch() {
    const g = new THREE.Group(), body = new THREE.Group(), wheels = [];
    g.add(body);
    const paint = P(paintOf(0x5a1e8a)), black = std(0x0c0c0e, { roughness: 0.7 }), chrome = std(0xd8dce2, { metalness: 0.85, roughness: 0.22 }), glass = std(0x0e141c, { roughness: 0.06, metalness: 0.7 }), pin = paintOf(0xe9c46a), liner = std(0x18191c, { roughness: 0.95 }), rubber = std(0x151517, { roughness: 0.85 });
    const K = new Kit(body);
    // chassis: two rails, cross members, axles right out to the hubs, leaf springs between, a diff on the back axle
    for (const s of [-1, 1]) K.add(box(0.024, 0.022, 0.66), black, s * 0.055, 0.075, 0);
    for (const z of [0.31, 0.15, -0.05, -0.2, -0.32]) K.add(box(0.11, 0.014, 0.016), black, 0, 0.075, z);
    for (const z of [0.255, -0.255]) { K.add(cyl(0.008, 0.008, 0.2, 8), black, 0, 0.062, z, 0, 0, Math.PI / 2); for (const s of [-1, 1]) K.add(box(0.014, 0.008, 0.11), black, s * 0.055, 0.067, z); }
    K.add(ball(0.019, 10, 8), black, 0, 0.062, -0.255);
    // the body, one profile nose to tail with arches cut over the wheels; the cab; a flat deck where the bed goes
    const R = 0.074, yc = 0.062, y0 = 0.09, dz = Math.sqrt(R * R - (y0 - yc) ** 2), aa = Math.asin((y0 - yc) / R);
    K.add(extrude(sh => {
      sh.moveTo(-0.345, y0);
      for (const c of [-0.255, 0.255]) { sh.lineTo(c - dz, y0); sh.absarc(c, yc, R, Math.PI - aa, aa, true); }
      sh.lineTo(0.348, y0); sh.lineTo(0.357, 0.118); sh.lineTo(0.354, 0.15); sh.lineTo(0.32, 0.161); sh.lineTo(0.2, 0.17);
      sh.lineTo(0.152, 0.236); sh.lineTo(0.14, 0.242); sh.lineTo(-0.1, 0.244); sh.lineTo(-0.116, 0.236); sh.lineTo(-0.12, 0.15); sh.lineTo(-0.345, 0.15); sh.closePath();
    }, 0.2, 0.006), paint);
    // glass: the windscreen laid on the rake, three windows a side (pillars of paint between), the back light
    K.add(extrude([[0.2015, 0.172], [0.1525, 0.2375], [0.147, 0.2355], [0.196, 0.169]], 0.178, 0.001), glass);
    for (const w of [[[0.186, 0.178], [0.148, 0.231], [0.097, 0.231], [0.097, 0.178]], [[0.086, 0.178], [0.086, 0.231], [-0.004, 0.231], [-0.004, 0.178]], [[-0.014, 0.178], [-0.014, 0.231], [-0.104, 0.231], [-0.104, 0.178]]]) K.add(extrude(w, 0.207, 0.001), glass);
    K.add(box(0.15, 0.046, 0.004), glass, 0, 0.205, -0.1215);
    // doors: their seams, handles, a pinstripe nose to tail, running boards on brackets, flares round the arches
    for (const z of [0.092, -0.009, -0.109]) K.add(box(0.204, 0.13, 0.0025), black, 0, 0.165, z);
    for (const s of [-1, 1]) for (const z of [0.1, 0.0, -0.1]) K.add(box(0.006, 0.006, 0.02), chrome, s * 0.103, 0.168, z);
    K.add(box(0.203, 0.004, 0.68), pin, 0, 0.143, 0.0);
    for (const s of [-1, 1]) { K.add(box(0.03, 0.007, 0.36), chrome, s * 0.116, 0.084, 0); for (const z of [-0.12, 0, 0.12]) K.add(box(0.05, 0.006, 0.012), black, s * 0.09, 0.082, z); }
    for (const s of [-1, 1]) for (const c of [-0.255, 0.255]) K.add(archBand(c, yc, 0.075, 0.084, y0, 0.012), rubber, s * 0.098, 0, 0);
    // the front: a chrome-framed grille, square lamps, indicators, a chrome bumper with a rubber strip, fog lamps
    K.add(box(0.17, 0.044, 0.008), chrome, 0, 0.128, 0.356).add(box(0.154, 0.032, 0.008), black, 0, 0.128, 0.358);
    for (const y of [0.119, 0.128, 0.137]) K.add(box(0.15, 0.003, 0.004), chrome, 0, y, 0.363);
    K.add(box(0.216, 0.024, 0.024), chrome, 0, 0.092, 0.36).add(box(0.2, 0.006, 0.006), rubber, 0, 0.092, 0.373);
    K.add(box(0.2, 0.004, 0.13), paint, 0, 0.166, 0.265, 0.07, 0, 0);                                   // a bulge down the bonnet
    // the bed: sides on the deck with chrome caps, a tailgate, a ribbed liner
    for (const s of [-1, 1]) { K.add(box(0.012, 0.045, 0.225), paint, s * 0.094, 0.1725, -0.2325); K.add(box(0.016, 0.005, 0.226), chrome, s * 0.094, 0.1975, -0.2325); }
    K.add(box(0.2, 0.045, 0.012), paint, 0, 0.1725, -0.339).add(box(0.2, 0.005, 0.014), chrome, 0, 0.1975, -0.339);
    K.add(box(0.176, 0.003, 0.214), liner, 0, 0.1515, -0.232); for (const x of [-0.06, -0.02, 0.02, 0.06]) K.add(box(0.008, 0.004, 0.21), liner, x, 0.154, -0.232);
    // stacks on the back of the cab, each on the deck with two brackets to the cab
    for (const s of [-1, 1]) { K.add(cyl(0.008, 0.008, 0.16, 10), chrome, s * 0.083, 0.23, -0.13); K.add(cyl(0.0095, 0.008, 0.012, 10), black, s * 0.083, 0.316, -0.13); for (const y of [0.19, 0.27]) K.add(box(0.008, 0.006, 0.012), chrome, s * 0.083, y, -0.124); }
    // mirrors on arms, a roof light bar on its base, amber markers on the cab
    for (const s of [-1, 1]) { K.rod([s * 0.099, 0.19, 0.172], [s * 0.128, 0.2, 0.172], 0.003, black); K.add(box(0.008, 0.026, 0.034), black, s * 0.132, 0.2, 0.172); K.add(box(0.002, 0.022, 0.03), chrome, s * 0.137, 0.2, 0.172); }
    K.add(box(0.13, 0.008, 0.024), black, 0, 0.248, 0.12);
    for (const s of [-1, 1]) K.add(box(0.026, 0.01, 0.008), glow(3.4, 1.6, 0.1), s * 0.07, 0.247, 0.142);
    // the back: tail lamps up the bed corners, a chrome bumper, a plate, mud flaps behind the wheels
    K.add(box(0.21, 0.022, 0.02), chrome, 0, 0.09, -0.352).add(box(0.05, 0.022, 0.003), std(0xf2f0e6, { roughness: 0.5 }), 0, 0.12, -0.3465);
    for (const s of [-1, 1]) K.add(box(0.04, 0.045, 0.004), rubber, s * 0.118, 0.068, -0.335);
    K.done();
    for (const s of [-1.5, -0.5, 0.5, 1.5]) part(ball(0.009, 8, 6), glow(4, 3.8, 3), s * 0.03, 0.257, 0.12, body);                 // the light bar's lamps
    for (const s of [-1, 1]) { part(box(0.03, 0.016, 0.004), glow(4, 3.6, 2.6), s * 0.072, 0.133, 0.3605, body); part(box(0.022, 0.008, 0.004), glow(3.4, 1.6, 0.1), s * 0.072, 0.108, 0.3605, body); part(cyl(0.008, 0.008, 0.004, 10), glow(4, 3.6, 2.6), s * 0.075, 0.092, 0.373, body).rotation.x = Math.PI / 2; }
    for (const s of [-1, 1]) part(box(0.016, 0.036, 0.004), glow(2.4, 0.1, 0.08), s * 0.092, 0.172, -0.346, body);                 // tail lamps
    for (const [x, z, f] of [[-0.118, 0.255, true], [0.118, 0.255, true], [-0.118, -0.255, false], [0.118, -0.255, false]]) wheel2(g, wheels, x, z, 0.062, 0.055, f, chrome, { tread: 8 });
    const aerial = aerialOn(body, -0.094, 0.2, -0.33, 0.26, glow(1.6, 0.6, 2.2));
    return { group: g, body, wheels, aerial, radius: 0.18, probes: [[0.24, 0.11], [-0.24, 0.11]], view: 0.78 };
  },
  // A go-kart: a tube frame a hand off the floor, fat little slicks, a bucket seat with a helmeted driver at the wheel,
  // side pods on the nerf bars, an engine on its plate behind the seat chained to the back axle. Quick, light, and happy
  // to go sideways.
  kart() {
    const g = new THREE.Group(), body = new THREE.Group(), wheels = [];
    g.add(body);
    const paint = P(paintOf(0x8ad81e)), black = std(0x0c0c0e, { roughness: 0.7 }), steel = std(0xb8bec6, { metalness: 0.8, roughness: 0.3 }), red = paintOf(0xd8261c), white = std(0xf2f2ee, { roughness: 0.35 }), alu = std(0x8a9098, { metalness: 0.7, roughness: 0.35 }), visor = std(0x151a22, { roughness: 0.05, metalness: 0.8 }), seatM = std(0x1a1c20, { roughness: 0.5 });
    const K = new Kit(body);
    // the frame: rails, cross members, a bumper loop at the front, nerf bars each side, a rear bumper on stays
    for (const s of [-1, 1]) {
      K.rod([s * 0.05, 0.035, 0.19], [s * 0.055, 0.04, 0.15], 0.006, steel).rod([s * 0.055, 0.04, 0.15], [s * 0.06, 0.04, -0.13], 0.006, steel);
      K.rod([s * 0.06, 0.04, 0.06], [s * 0.112, 0.045, 0.03], 0.005, steel).rod([s * 0.112, 0.045, 0.03], [s * 0.112, 0.045, -0.055], 0.005, steel).rod([s * 0.112, 0.045, -0.055], [s * 0.06, 0.04, -0.085], 0.005, steel);
      K.rod([s * 0.06, 0.04, -0.13], [s * 0.085, 0.05, -0.155], 0.005, steel);
    }
    for (const z of [0.13, 0.0, -0.11]) K.rod([-0.06, 0.04, z], [0.06, 0.04, z], 0.005, steel);
    K.rod([-0.05, 0.035, 0.19], [0.05, 0.035, 0.19], 0.006, steel).rod([-0.09, 0.05, -0.155], [0.09, 0.05, -0.155], 0.006, steel);
    K.add(box(0.11, 0.004, 0.24), alu, 0, 0.037, 0.02);                                                  // the floor pan
    // the front axle: kingpin uprights at the ends of the front cross member, stub axles into the hubs, a track rod
    for (const s of [-1, 1]) { K.rod([s * 0.06, 0.04, 0.13], [s * 0.076, 0.04, 0.13], 0.005, steel).rod([s * 0.076, 0.022, 0.13], [s * 0.076, 0.056, 0.13], 0.0045, steel).rod([s * 0.076, 0.036, 0.13], [s * 0.092, 0.036, 0.13], 0.004, steel); K.rod([s * 0.076, 0.045, 0.118], [0, 0.045, 0.112], 0.0025, steel); }
    K.rod([-0.1, 0.043, -0.11], [0.1, 0.043, -0.11], 0.006, steel);                                      // the rear axle, live, hub to hub
    // bodywork: a nose cone on the bumper loop, the number board on it, side pods on the nerf bars with brackets, a rear fairing
    K.add(extrude([[0.11, 0.032], [0.212, 0.03], [0.226, 0.044], [0.214, 0.064], [0.17, 0.074], [0.118, 0.07], [0.106, 0.05]], 0.13, 0.005), paint);
    K.add(box(0.07, 0.046, 0.006), paint, 0, 0.09, 0.106, -0.45, 0, 0);
    for (const s of [-1, 1]) { K.add(extrude([[0.05, 0.034], [0.04, 0.062], [0.005, 0.073], [-0.04, 0.071], [-0.056, 0.058], [-0.056, 0.034]], 0.034, 0.004), paint, s * 0.112, 0, 0); for (const z of [0.012, -0.04]) K.add(box(0.05, 0.006, 0.008), steel, s * 0.087, 0.041, z); }
    K.add(extrude([[-0.143, 0.042], [-0.162, 0.042], [-0.167, 0.058], [-0.158, 0.068], [-0.143, 0.066]], 0.2, 0.004), paint);
    // the seat: a moulded bucket on the floor, stayed back to the frame
    K.add(extrude([[0.004, 0.039], [-0.03, 0.039], [-0.072, 0.056], [-0.098, 0.128], [-0.086, 0.131], [-0.062, 0.067], [-0.03, 0.054], [0.004, 0.056]], 0.074, 0.006), seatM);
    for (const s of [-1, 1]) K.rod([s * 0.03, 0.11, -0.09], [s * 0.05, 0.042, -0.12], 0.003, steel);
    // the driver: suit, gloves on the wheel, boots on the pedals, a helmet with a visor and a stripe
    K.add(new THREE.CapsuleGeometry(0.021, 0.034, 3, 8), red, 0, 0.096, -0.05, -0.32, 0, 0);
    K.add(cyl(0.008, 0.009, 0.014, 8), red, 0, 0.128, -0.045);
    for (const s of [-1, 1]) {
      K.rod([s * 0.025, 0.112, -0.046], [s * 0.034, 0.093, -0.005], 0.0075, red).rod([s * 0.034, 0.093, -0.005], [s * 0.017, 0.103, 0.032], 0.0065, red);
      K.add(ball(0.0068, 8, 6), black, s * 0.017, 0.103, 0.034);
      K.rod([s * 0.014, 0.066, -0.035], [s * 0.022, 0.083, 0.03], 0.0095, red).rod([s * 0.022, 0.083, 0.03], [s * 0.02, 0.053, 0.088], 0.008, red);
      K.add(box(0.014, 0.012, 0.024), black, s * 0.02, 0.05, 0.098);
      K.add(box(0.012, 0.003, 0.016), alu, s * 0.02, 0.043, 0.112, -0.5, 0, 0);
    }
    K.add(ball(0.025, 12, 10), white, 0, 0.15, -0.043);
    K.add(new THREE.SphereGeometry(0.0256, 14, 6, Math.PI / 2 - 0.75, 1.5, 0.95, 0.55), visor, 0, 0.15, -0.043);
    K.add(box(0.006, 0.006, 0.052), paint, 0, 0.175, -0.045, 0.1, 0, 0);
    // steering: a column from the floor to the wheel, the wheel with three spokes
    K.rod([0, 0.04, 0.112], [0, 0.101, 0.04], 0.0035, steel);
    K.add(new THREE.TorusGeometry(0.018, 0.0034, 6, 16), black, 0, 0.103, 0.036, -0.75, 0, 0);
    K.add(box(0.034, 0.004, 0.003), black, 0, 0.103, 0.036, -0.75, 0, 0).add(box(0.004, 0.017, 0.003), black, 0, 0.097, 0.04, -0.75, 0, 0);
    // the engine: on a plate across the back of the frame, finned head, red air filter, a pull-start cover, the chain
    // guard down to the axle's sprocket, a header pipe back to the silencer
    K.add(box(0.06, 0.008, 0.045), alu, 0.042, 0.05, -0.13);
    K.add(box(0.04, 0.042, 0.04), alu, 0.042, 0.075, -0.13);
    for (let i = 0; i < 4; i++) K.add(box(0.046, 0.003, 0.044), alu, 0.042, 0.099 + i * 0.006, -0.13);
    K.add(cyl(0.012, 0.012, 0.02, 12), red, 0.042, 0.088, -0.103, Math.PI / 2, 0, 0);
    K.add(cyl(0.017, 0.017, 0.008, 14), black, 0.018, 0.075, -0.13, 0, 0, Math.PI / 2);
    K.add(box(0.006, 0.034, 0.05), black, 0.066, 0.058, -0.12);
    K.rod([0.042, 0.105, -0.148], [0.04, 0.1, -0.165], 0.004, steel); K.add(cyl(0.011, 0.011, 0.045, 10), steel, 0.04, 0.1, -0.185, Math.PI / 2, 0, 0);
    K.done();
    // the race number on the board, lamps in the rear fairing
    const num = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.034), new THREE.MeshBasicMaterial({ map: plate(128, 88, (c, w, h) => { c.fillStyle = '#f4f2ea'; c.beginPath(); c.ellipse(w / 2, h / 2, w / 2 - 2, h / 2 - 2, 0, 0, 7); c.fill(); c.fillStyle = '#16120c'; c.font = '900 70px system-ui,sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('7', w / 2, h / 2 + 4); }), transparent: true }));
    num.position.set(0, 0.0905, 0.1104); num.rotation.x = -0.45; body.add(num);
    for (const s of [-1, 1]) part(box(0.022, 0.008, 0.004), glow(2.2, 0.1, 0.08), s * 0.05, 0.056, -0.168, body);
    for (const [x, z, r, w, f] of [[-0.095, 0.13, 0.036, 0.034, true], [0.095, 0.13, 0.036, 0.034, true], [-0.1, -0.11, 0.043, 0.05, false], [0.1, -0.11, 0.043, 0.05, false]]) wheel2(g, wheels, x, z, r, w, f, paint, { spokes: 3 });
    const aerial = aerialOn(body, -0.075, 0.056, -0.155, 0.2, glow(0.8, 2.4, 0.3));
    return { group: g, body, wheels, aerial, radius: 0.15, view: 1.15 };
  },
  // A long-nose tractor unit with a sleeper, twin stacks and a chrome grille, hauling a box trailer on a fifth wheel.
  // The trailer is its own thing (model.trailer): it is towed, not carried. Car.reskin takes it, and Car._tow moves it.
  semi() {
    const g = new THREE.Group(), body = new THREE.Group(), wheels = [];
    g.add(body);
    const paint = P(paintOf(0x1a6a8c)), black = std(0x0c0c0e, { roughness: 0.7 }), chrome = std(0xdde1e6, { metalness: 0.9, roughness: 0.18 }), glass = std(0x0e141c, { roughness: 0.06, metalness: 0.7 }), cream = paintOf(0xefe6cf), grey = std(0x3a3e46, { roughness: 0.6 }), rubber = std(0x151517, { roughness: 0.85 });
    const K = new Kit(body);
    // chassis: rails nose to tail, cross members, the steer axle and two drive axles out to the hubs, diffs, air bags
    for (const s of [-1, 1]) K.add(box(0.022, 0.025, 0.4), black, s * 0.05, 0.0625, -0.015);
    for (const z of [0.15, 0.03, -0.12, -0.2]) K.add(box(0.1, 0.014, 0.014), black, 0, 0.06, z);
    for (const z of [0.11, -0.085, -0.165]) { K.add(cyl(0.007, 0.007, 0.2, 8), black, 0, 0.048, z, 0, 0, Math.PI / 2); for (const s of [-1, 1]) K.add(box(0.014, 0.008, 0.06), black, s * 0.05, 0.052, z); }
    for (const z of [-0.085, -0.165]) { K.add(ball(0.016, 10, 8), black, 0, 0.048, z); for (const s of [-1, 1]) K.add(cyl(0.011, 0.011, 0.014, 10), rubber, s * 0.05, 0.068, z - 0.022); }
    // the long bonnet between the front wheels, fenders round them, a tall chrome grille, a chrome bumper
    K.add(extrude([[0.183, 0.075], [0.187, 0.15], [0.178, 0.164], [0.07, 0.169], [0.066, 0.075]], 0.15, 0.006), paint);
    for (const s of [-1, 1]) { K.add(archBand(0.11, 0.048, 0.054, 0.064, 0.062, 0.05), paint, s * 0.1, 0, 0); K.add(extrude([[0.18, 0.064], [0.18, 0.1], [0.165, 0.112], [0.15, 0.1], [0.15, 0.064]], 0.05, 0.003), paint, s * 0.1, 0, 0); K.add(extrude([[0.072, 0.064], [0.072, 0.1], [0.058, 0.112], [0.058, 0.064]], 0.05, 0.003), paint, s * 0.1, 0, 0); }
    K.add(box(0.11, 0.082, 0.008), chrome, 0, 0.116, 0.188); for (let i = 0; i < 6; i++) K.add(box(0.096, 0.004, 0.004), black, 0, 0.086 + i * 0.012, 0.193);
    K.add(box(0.012, 0.09, 0.012), chrome, 0, 0.165, 0.18, 0.3, 0, 0);                                    // a bar down the nose (an ornament of no particular make)
    K.add(box(0.224, 0.028, 0.026), chrome, 0, 0.06, 0.192);
    // the cab: a day cab with a raked screen, door windows, a visor; the sleeper behind with its own small window; a
    // fairing over both up to the trailer's height
    K.add(extrude([[0.066, 0.075], [0.069, 0.17], [0.059, 0.262], [0.046, 0.272], [0.0, 0.272], [0.0, 0.075]], 0.19, 0.006), paint);
    K.add(extrude([[0.0, 0.075], [0.0, 0.272], [-0.012, 0.29], [-0.084, 0.29], [-0.09, 0.28], [-0.09, 0.075]], 0.19, 0.006), paint);
    K.add(extrude([[0.046, 0.272], [0.012, 0.275], [-0.084, 0.29], [-0.084, 0.31], [-0.02, 0.31], [0.022, 0.29]], 0.176, 0.005), paint);
    for (const s of [-1, 1]) K.add(box(0.078, 0.07, 0.004), glass, s * 0.044, 0.216, 0.0655, -0.11, 0, 0);
    K.add(box(0.008, 0.074, 0.006), paint, 0, 0.216, 0.066, -0.11, 0, 0);
    K.add(extrude([[0.061, 0.182], [0.054, 0.255], [0.012, 0.255], [0.012, 0.182]], 0.196, 0.001), glass);
    K.add(extrude([[-0.03, 0.2], [-0.03, 0.238], [-0.064, 0.238], [-0.064, 0.2]], 0.196, 0.001), glass);
    K.add(box(0.19, 0.006, 0.022), paint, 0, 0.262, 0.074, 0.25, 0, 0);
    K.add(box(0.194, 0.0025, 0.12), black, 0, 0.17, 0.004);                                              // door seams
    K.add(box(0.194, 0.012, 0.156), cream, 0, 0.142, -0.012);                                            // a stripe down each side
    for (const s of [-1, 1]) K.add(box(0.006, 0.006, 0.02), chrome, s * 0.097, 0.18, 0.02);              // door handles
    // steps under the doors, fuel tanks strapped to the frame, stacks up the back corners of the cab on brackets
    for (const s of [-1, 1]) {
      K.add(box(0.032, 0.006, 0.05), chrome, s * 0.1, 0.098, 0.03);
      K.add(cyl(0.022, 0.022, 0.07, 14), chrome, s * 0.103, 0.07, 0.0, Math.PI / 2, 0, 0); for (const z of [-0.022, 0.022]) K.add(box(0.03, 0.05, 0.004), black, s * 0.09, 0.07, z);
      K.add(cyl(0.008, 0.008, 0.25, 10), chrome, s * 0.104, 0.22, -0.006); K.add(cyl(0.0105, 0.0105, 0.07, 10), grey, s * 0.104, 0.17, -0.006);
      K.add(cyl(0.0095, 0.008, 0.012, 10), black, s * 0.104, 0.351, -0.006); for (const y of [0.13, 0.3]) K.add(box(0.012, 0.006, 0.008), chrome, s * 0.099, y, -0.006);
    }
    // mirrors on their arms, air horns on the roof, marker lamps along the visor
    for (const s of [-1, 1]) { K.rod([s * 0.095, 0.2, 0.056], [s * 0.128, 0.205, 0.058], 0.003, chrome).rod([s * 0.095, 0.24, 0.056], [s * 0.128, 0.235, 0.058], 0.003, chrome); K.add(box(0.008, 0.044, 0.022), black, s * 0.132, 0.22, 0.058); K.add(box(0.002, 0.04, 0.019), chrome, s * 0.137, 0.22, 0.058); }
    for (const s of [-1, 1]) K.add(cyl(0.004, 0.008, 0.05, 8), chrome, s * 0.03, 0.28, 0.025, Math.PI / 2, 0, 0);
    // the fifth wheel on its brackets across the rails, its jaws open to the back; mud flaps behind the drive wheels
    K.add(cyl(0.045, 0.045, 0.01, 18), grey, 0, 0.085, -0.12).add(box(0.012, 0.012, 0.03), black, 0, 0.091, -0.15);
    for (const s of [-1, 1]) K.add(box(0.02, 0.012, 0.05), grey, s * 0.04, 0.078, -0.12);
    for (const s of [-1, 1]) { K.add(box(0.046, 0.05, 0.004), rubber, s * 0.1, 0.055, -0.222); K.rod([s * 0.06, 0.075, -0.205], [s * 0.09, 0.075, -0.22], 0.003, black); }
    K.done();
    for (const s of [-1.5, -0.5, 0.5, 1.5]) part(box(0.012, 0.007, 0.007), glow(3.4, 1.6, 0.1), s * 0.03, 0.268, 0.085, body);
    for (const s of [-1, 1]) { part(box(0.03, 0.018, 0.006), glow(4, 3.6, 2.6), s * 0.1, 0.098, 0.181, body); part(box(0.012, 0.012, 0.006), glow(3.4, 1.6, 0.1), s * 0.1, 0.098, 0.153, body); part(box(0.016, 0.02, 0.004), glow(2.2, 0.1, 0.08), s * 0.07, 0.07, -0.213, body); }
    for (const [x, z, f] of [[-0.1, 0.11, true], [0.1, 0.11, true]]) wheel2(g, wheels, x, z, 0.048, 0.042, f, chrome, { spokes: 5 });
    for (const [x, z] of [[-0.1, -0.085], [0.1, -0.085], [-0.1, -0.165], [0.1, -0.165]]) wheel2(g, wheels, x, z, 0.048, 0.032, false, chrome, { spokes: 5, dual: true });
    const aerial = aerialOn(body, 0.06, 0.31, -0.06, 0.2, glow(2.6, 0.4, 0.2));
    // ---- the trailer: built about its kingpin (0, 0, 0 at the fifth wheel, at ground level), running back along -z
    const T = new THREE.Group(), tb = new THREE.Group(); T.add(tb);
    const side = std(0xefece4, { roughness: 0.45, emissive: 0xefece4, emissiveIntensity: 0.1 }), rib = std(0xc9ccd2, { metalness: 0.6, roughness: 0.35 }), tw = [], LEN = 0.43;
    const KT = new Kit(tb), F = -0.025, B = -0.535, Lb = F - B, Zc = (F + B) / 2;
    KT.add(box(0.21, 0.2, Lb), side, 0, 0.211, Zc);                                                       // the box
    for (let i = 0; i <= 10; i++) for (const s of [-1, 1]) KT.add(box(0.004, 0.2, 0.007), rib, s * 0.106, 0.211, F - 0.004 - i * (Lb - 0.008) / 10);      // posts
    KT.add(box(0.216, 0.008, Lb + 0.004), rib, 0, 0.313, Zc).add(box(0.216, 0.014, Lb + 0.004), rib, 0, 0.108, Zc);                     // top and bottom rails
    for (const s of [-1, 1]) KT.add(box(0.008, 0.2, 0.008), rib, s * 0.104, 0.211, F);                                                // front corner posts
    KT.add(box(0.15, 0.065, 0.022), grey, 0, 0.26, F + 0.011);                                            // a refrigeration unit on the nose
    for (let i = 0; i < 5; i++) KT.add(box(0.13, 0.004, 0.003), black, 0, 0.237 + i * 0.011, F + 0.023);
    KT.add(box(0.15, 0.01, 0.12), grey, 0, 0.096, -0.04).add(cyl(0.007, 0.007, 0.012, 8), grey, 0, 0.088, 0);         // the upper coupler and its kingpin
    // the landing gear: two legs from the floor to their feet, a cross shaft, the crank
    for (const s of [-1, 1]) { KT.add(box(0.012, 0.085, 0.012), grey, s * 0.075, 0.062, -0.115); KT.add(box(0.026, 0.006, 0.026), grey, s * 0.075, 0.017, -0.115); }
    KT.rod([-0.075, 0.08, -0.115], [0.075, 0.08, -0.115], 0.003, grey).rod([0.075, 0.08, -0.115], [0.1, 0.08, -0.115], 0.003, grey).rod([0.1, 0.08, -0.115], [0.1, 0.06, -0.115], 0.003, grey);
    // side skirts on brackets, reflective tape, side markers
    for (const s of [-1, 1]) { KT.add(box(0.004, 0.038, 0.2), grey, s * 0.103, 0.083, -0.235); for (const z of [-0.15, -0.235, -0.32]) KT.add(box(0.02, 0.004, 0.006), grey, s * 0.094, 0.101, z); }
    { const tapeW = std(0xf4f4f0, { roughness: 0.3 }), tapeR = std(0xc81e1e, { roughness: 0.3 }); for (let i = 0; i < 8; i++) for (const s of [-1, 1]) KT.add(box(0.002, 0.006, 0.05), i % 2 ? tapeW : tapeR, s * 0.1065, 0.122, F - 0.04 - i * 0.06); }
    // tandem axles: hangers down from the floor, axles out to the hubs; mud flaps behind
    for (const z of [-0.39, -0.47]) { KT.add(cyl(0.007, 0.007, 0.2, 8), black, 0, 0.045, z, 0, 0, Math.PI / 2); for (const s of [-1, 1]) KT.add(box(0.012, 0.06, 0.016), black, s * 0.05, 0.072, z); }
    for (const s of [-1, 1]) KT.add(box(0.05, 0.05, 0.004), rubber, s * 0.085, 0.06, -0.52);
    // the back: the doors' seam, hinges, lock rods, the under-ride bar on its legs, lamps
    KT.add(box(0.004, 0.19, 0.003), black, 0, 0.211, B - 0.0015);
    for (const s of [-1, 1]) { for (const y of [0.13, 0.18, 0.24, 0.29]) KT.add(box(0.012, 0.01, 0.004), rib, s * 0.1, y, B - 0.002); for (const x of [0.03, 0.06]) KT.add(cyl(0.0025, 0.0025, 0.19, 6), rib, s * x, 0.211, B - 0.004); }
    KT.add(box(0.2, 0.016, 0.012), grey, 0, 0.06, B - 0.006); for (const s of [-1, 1]) KT.add(box(0.012, 0.04, 0.01), grey, s * 0.07, 0.085, B + 0.002);
    KT.done();
    for (const s of [-1, 1]) for (const z of [F - 0.01, -0.28, B + 0.01]) part(box(0.004, 0.008, 0.012), glow(3.4, 1.6, 0.1), s * 0.109, 0.3, z, tb);
    for (const s of [-1, 1]) { part(box(0.03, 0.016, 0.006), glow(2.4, 0.1, 0.08), s * 0.075, 0.13, B - 0.003, tb); part(box(0.008, 0.008, 0.004), glow(2.4, 0.1, 0.08), s * 0.04, 0.306, B - 0.003, tb); }
    // dual wheels on the tandem
    const tyreM = std(0x0d0d0f, { roughness: 0.92 });
    for (const z of [-0.39, -0.47]) for (const s of [-1, 1]) {
      const p = new THREE.Group(); p.position.set(s * 0.085, 0.045, z); const spin = new THREE.Group(); p.add(spin);
      const KW = new Kit(spin);
      for (const o of [-0.016, 0.016]) { KW.add(cyl(0.045, 0.045, 0.03, 14, 1, true), tyreM, o, 0, 0, 0, 0, Math.PI / 2); KW.add(cyl(0.04, 0.04, 0.033, 14), tyreM, o, 0, 0, 0, 0, Math.PI / 2); }
      KW.add(cyl(0.028, 0.028, 0.068, 12), chrome, 0, 0, 0, 0, 0, Math.PI / 2).add(cyl(0.012, 0.012, 0.072, 8), black, 0, 0, 0, 0, 0, Math.PI / 2);
      KW.done(); tb.add(p); tw.push({ spin, r: 0.045 });
    }
    const shadow = blobShadow(0.32, 0.74, 0.55); shadow.position.set(0, 0.008, -0.28); T.add(shadow);      // the same soft shadow as the toys'
    // In a picture (and until it is first towed) it stands straight out behind.
    T.position.set(0, 0, -0.12); g.add(T);
    return { group: g, body, wheels, aerial, radius: 0.17, probes: [[0.12, 0.1]], view: 0.66, trailer: { group: T, wheels: tw, hitch: -0.12, len: LEN, rear: 0.53, width: 0.11 } };
  },
  // A snowplough: a short cab-forward truck, a curved mouldboard on a push frame out front, lifted by a ram, a hopper of
  // grit on the back with a spinner under its tail, amber beacons. On snow it clears a path a blade wide (winter.js), and
  // the blade shoves loose things aside.
  plow() {
    const g = new THREE.Group(), body = new THREE.Group(), wheels = [];
    g.add(body);
    const paint = P(paintOf(0xf07a14)), black = std(0x0c0c0e, { roughness: 0.7 }), steel = std(0x9aa2ac, { metalness: 0.7, roughness: 0.35 }), glass = std(0x0e141c, { roughness: 0.06, metalness: 0.7 }), yellow = paintOf(0xf2c21b), grit = std(0x6a5a48, { roughness: 1 }), chrome = std(0xd8dce2, { metalness: 0.85, roughness: 0.22 }), rubber = std(0x151517, { roughness: 0.85 });
    const K = new Kit(body);
    // chassis: rails, cross members, both axles out to the hubs on springs, a step box under the cab
    for (const s of [-1, 1]) K.add(box(0.025, 0.028, 0.39), black, s * 0.05, 0.076, -0.01);
    for (const z of [0.16, 0.0, -0.18]) K.add(box(0.1, 0.014, 0.014), black, 0, 0.072, z);
    for (const z of [0.1, -0.12]) { K.add(cyl(0.009, 0.009, 0.2, 8), black, 0, 0.06, z, 0, 0, Math.PI / 2); for (const s of [-1, 1]) K.add(box(0.016, 0.01, 0.09), black, s * 0.05, 0.066, z); }
    K.add(ball(0.018, 10, 8), black, 0, 0.06, -0.12);
    K.add(box(0.168, 0.036, 0.125), black, 0, 0.108, 0.102);
    // the cab: flat-fronted, sitting on the step box between the front fenders; glass all round
    K.add(extrude([[0.166, 0.125], [0.169, 0.152], [0.163, 0.236], [0.15, 0.247], [0.052, 0.247], [0.04, 0.236], [0.04, 0.125]], 0.2, 0.006), paint);
    K.add(box(0.172, 0.064, 0.004), glass, 0, 0.199, 0.1685, -0.07, 0, 0);
    K.add(extrude([[0.158, 0.172], [0.154, 0.232], [0.1, 0.232], [0.1, 0.172]], 0.206, 0.001), glass);
    K.add(extrude([[0.09, 0.172], [0.09, 0.232], [0.052, 0.232], [0.052, 0.172]], 0.206, 0.001), glass);
    K.add(box(0.15, 0.044, 0.004), glass, 0, 0.2, 0.038);
    K.add(box(0.204, 0.105, 0.0025), black, 0, 0.18, 0.095);                                             // door seams
    for (const s of [-1, 1]) K.add(box(0.006, 0.006, 0.018), chrome, s * 0.103, 0.165, 0.085);
    // fenders over the front wheels, joined to the cab's sides; the grille, bumper, lamps
    for (const s of [-1, 1]) K.add(archBand(0.1, 0.06, 0.071, 0.082, 0.09, 0.062), paint, s * 0.115, 0, 0);
    K.add(box(0.15, 0.034, 0.004), black, 0, 0.142, 0.17); for (const y of [0.132, 0.142, 0.152]) K.add(box(0.14, 0.003, 0.004), chrome, 0, y, 0.173);
    K.add(box(0.212, 0.026, 0.026), steel, 0, 0.1, 0.176);
    // on the roof: two amber beacons on their bases, a light bar on posts, mirrors on arms, the stack up the back corner
    for (const s of [-1, 1]) K.add(cyl(0.014, 0.016, 0.006, 12), black, s * 0.07, 0.25, 0.1);
    for (const s of [-1, 1]) K.add(box(0.006, 0.034, 0.006), black, s * 0.06, 0.264, 0.14);
    K.add(box(0.15, 0.009, 0.012), black, 0, 0.284, 0.14);
    for (const s of [-1, 1]) { K.rod([s * 0.099, 0.19, 0.15], [s * 0.128, 0.2, 0.152], 0.003, black); K.add(box(0.008, 0.032, 0.022), black, s * 0.132, 0.2, 0.152); K.add(box(0.002, 0.028, 0.019), chrome, s * 0.137, 0.2, 0.152); }
    K.add(cyl(0.007, 0.007, 0.19, 10), chrome, 0.108, 0.2, 0.034); K.add(cyl(0.0085, 0.007, 0.012, 10), black, 0.108, 0.3, 0.034); for (const y of [0.15, 0.24]) K.add(box(0.012, 0.006, 0.008), chrome, 0.102, y, 0.034);
    // the hopper on its subframe, heaped with grit; hazard stripes on its tail; the chute and spinner under it
    K.add(box(0.15, 0.03, 0.21), black, 0, 0.105, -0.1);
    K.add(extrude([[0.004, 0.12], [-0.19, 0.12], [-0.205, 0.226], [0.008, 0.226]], 0.19, 0.005), paint);
    K.add(extrude([[0.0, 0.225], [-0.198, 0.225], [-0.172, 0.243], [-0.1, 0.254], [-0.028, 0.244]], 0.172, 0.004), grit);
    for (const s of [-1, 1]) K.add(box(0.008, 0.01, 0.214), yellow, s * 0.097, 0.229, -0.1).add(box(0.198, 0.01, 0.008), yellow, 0, 0.229, -0.1 + s * 0.103);
    for (let i = 0; i < 7; i++) K.add(box(0.024, 0.07, 0.003), i % 2 ? black : yellow, -0.072 + i * 0.024, 0.17, -0.2005);
    K.add(box(0.04, 0.03, 0.03), steel, 0, 0.105, -0.205).add(cyl(0.025, 0.025, 0.006, 14), steel, 0, 0.087, -0.215);
    for (let i = 0; i < 4; i++) K.add(box(0.044, 0.008, 0.005), steel, 0, 0.093, -0.215, 0, i * Math.PI / 4, 0);
    // fenders over the back wheels on brackets from the hopper, mud flaps behind them
    for (const s of [-1, 1]) { K.add(archBand(-0.12, 0.06, 0.068, 0.076, 0.1, 0.06), black, s * 0.115, 0, 0); K.add(box(0.03, 0.006, 0.02), black, s * 0.095, 0.13, -0.12); K.add(box(0.05, 0.05, 0.004), rubber, s * 0.115, 0.068, -0.19); }
    // the blade: a curved mouldboard, ribbed behind, a cutting edge, a hazard-striped top lip, end plates and markers
    K.add(extrude(sh => { sh.moveTo(0.313, 0.02); sh.quadraticCurveTo(0.272, 0.082, 0.319, 0.148); sh.lineTo(0.31, 0.152); sh.quadraticCurveTo(0.263, 0.082, 0.304, 0.02); sh.closePath(); }, 0.38, 0.003), paint);
    for (const x of [-0.14, -0.06, 0.06, 0.14]) K.add(box(0.008, 0.11, 0.014), steel, x, 0.084, 0.277);
    K.add(box(0.386, 0.012, 0.012), black, 0, 0.026, 0.308);
    for (let i = 0; i < 10; i++) K.add(box(0.0385, 0.008, 0.014), i % 2 ? black : yellow, -0.173 + i * 0.0385, 0.152, 0.315);
    for (const s of [-1, 1]) { K.add(box(0.006, 0.124, 0.048), steel, s * 0.193, 0.085, 0.293); K.rod([s * 0.193, 0.147, 0.292], [s * 0.193, 0.21, 0.292], 0.003, black); }
    // the push frame: a lift plate against the ribs, two arms back to the ends of the rails, a cross tube, the lift ram
    // off the bumper, and an angle ram each side
    K.add(box(0.2, 0.08, 0.008), steel, 0, 0.082, 0.268);
    for (const s of [-1, 1]) K.rod([s * 0.05, 0.076, 0.175], [s * 0.07, 0.062, 0.265], 0.0065, steel);
    K.rod([-0.058, 0.07, 0.215], [0.058, 0.07, 0.215], 0.005, steel);
    K.rod([0, 0.1, 0.189], [0, 0.108, 0.226], 0.009, black).rod([0, 0.108, 0.226], [0, 0.116, 0.265], 0.005, chrome);
    for (const s of [-1, 1]) K.rod([s * 0.055, 0.072, 0.2], [s * 0.095, 0.075, 0.264], 0.005, black);
    K.done();
    for (const s of [-1, 1]) { part(cyl(0.011, 0.011, 0.022, 12), glow(3.4, 1.6, 0.1), s * 0.07, 0.264, 0.1, body); part(ball(0.011, 8, 6), glow(4, 3.8, 3), s * 0.055, 0.296, 0.143, body); part(ball(0.007, 6, 5), glow(3.4, 0.4, 0.1), s * 0.193, 0.213, 0.292, body); }
    for (const s of [-1, 1]) { part(box(0.03, 0.016, 0.004), glow(4, 3.6, 2.6), s * 0.075, 0.172 - 0.04, 0.17, body); part(box(0.018, 0.026, 0.004), glow(2.2, 0.1, 0.08), s * 0.08, 0.14, -0.2035, body); }
    for (const [x, z, f] of [[-0.115, 0.1, true], [0.115, 0.1, true], [-0.115, -0.12, false], [0.115, -0.12, false]]) wheel2(g, wheels, x, z, 0.06, 0.055, f, yellow, { tread: 8, spokes: 4 });
    const aerial = aerialOn(body, -0.085, 0.23, -0.19, 0.24, glow(3.4, 1.6, 0.1));
    return { group: g, body, wheels, aerial, radius: 0.18, probes: [[0.27, 0.15]], blade: { z: 0.3, hw: 0.19 }, view: 0.95 };
  },
};

// ---------------------------------------------------------------- drones ---

function rotor(body, props, x, y, z, r, dir, hubMat, tint = 0x9aa4b0) {
  part(cyl(0.014, 0.016, 0.03, 10), hubMat, x, y - 0.02, z, body);
  const disc = part(cyl(r, r, 0.002, 20), new THREE.MeshBasicMaterial({ color: tint, transparent: true, opacity: 0.16, depthWrite: false }), x, y, z, body);
  const blade = part(box(r * 1.94, 0.003, 0.014), hubMat, x, y - 0.001, z, body);
  props.push({ disc, blade, dir });
}

const DRONES = {
  // Six rotors round a hexagonal body, a camera slung underneath.
  hex() {
    const g = new THREE.Group(), body = new THREE.Group(), props = [];
    g.add(body);
    const shell = P(paintOf(0xe2701c)), dark = std(0x121316, { roughness: 0.6 });
    part(cyl(0.062, 0.07, 0.036, 6), shell, 0, 0, 0, body);
    part(cyl(0.035, 0.05, 0.022, 6), dark, 0, 0.028, 0, body);
    part(ball(0.022), std(0x05070a, { roughness: 0.1, metalness: 0.8 }), 0, -0.03, 0.04, body);            // the camera
    part(box(0.02, 0.02, 0.02), dark, 0, -0.022, 0.02, body);
    for (let i = 0; i < 6; i++) {
      const a = Math.PI / 6 + i * Math.PI / 3, x = Math.sin(a), z = Math.cos(a);
      const arm = part(box(0.014, 0.012, 0.11), dark, x * 0.105, 0, z * 0.105, body); arm.rotation.y = a;
      rotor(body, props, x * 0.16, 0.034, z * 0.16, 0.058, i % 2 ? 1 : -1, dark);
      part(ball(0.007, 6, 5), z > 0 ? glow(3, 3, 3) : glow(3, 0.15, 0.1), x * 0.16, -0.012, z * 0.16, body);
    }
    for (const s of [-1, 1]) { part(box(0.006, 0.05, 0.006), dark, s * 0.045, -0.04, 0.03, body); part(box(0.006, 0.05, 0.006), dark, s * 0.045, -0.04, -0.03, body); part(box(0.008, 0.008, 0.13), dark, s * 0.045, -0.066, 0, body); }   // skids
    return { group: g, body, props };
  },
  // A little blimp with a gondola and two fans.
  airship() {
    const g = new THREE.Group(), body = new THREE.Group(), props = [];
    g.add(body);
    const skin = P(paintOf(0xefe7d2)), red = paintOf(0xc22a23), dark = std(0x121316, { roughness: 0.6 });
    const env = part(ball(1, 18, 12), skin, 0, 0.03, 0, body); env.scale.set(0.105, 0.098, 0.235);
    const band = part(ball(1, 18, 12), red, 0, 0.03, 0.005, body); band.scale.set(0.107, 0.1, 0.05);          // a band round the middle
    const nose = part(ball(1, 12, 10), red, 0, 0.03, 0.19, body); nose.scale.set(0.045, 0.043, 0.05);
    for (const [x, y, w, h] of [[0, 0.1, 0.006, 0.07], [0, -0.04, 0.006, 0.07], [0.07, 0.03, 0.07, 0.006], [-0.07, 0.03, 0.07, 0.006]]) part(box(w, h, 0.07), red, x, y, -0.2, body);   // tail fins
    part(box(0.05, 0.032, 0.11), dark, 0, -0.085, 0.01, body);                            // gondola
    part(box(0.052, 0.012, 0.06), std(0x86a7c9, { roughness: 0.2, metalness: 0.4 }), 0, -0.078, 0.035, body);
    part(ball(0.014), std(0x05070a, { roughness: 0.1, metalness: 0.8 }), 0, -0.098, 0.068, body);
    for (const s of [-1, 1]) {
      part(box(0.07, 0.008, 0.012), dark, s * 0.055, -0.08, 0, body);                     // fan pylons
      rotor(body, props, s * 0.1, -0.058, 0, 0.042, s, dark, 0xd8c9a0);
      part(ball(0.007, 6, 5), s > 0 ? glow(0.2, 3, 0.4) : glow(3, 0.15, 0.1), s * 0.105, 0.03, 0, body);
    }
    part(ball(0.008, 6, 5), glow(3, 3, 3), 0, -0.07, -0.2, body);
    return { group: g, body, props };
  },
  // The Manta: a ray in polished chrome. Everything on it is curved, so that everything round it
  // slides over it as it turns: four fans buried in the wings, a whip of a tail, and a line of
  // light under each leading edge.
  manta() {
    const g = new THREE.Group(), body = new THREE.Group(), props = [];
    g.add(body);
    const chrome = P(mirror()), dark = std(0x050608, { roughness: 0.5 }), edge = glow(0.15, 2.4, 3.4), glass = std(0x02060c, { roughness: 0.02, metalness: 1, envMap: chrome.envMap, envMapIntensity: 1.2 });
    const blob = (sx, sy, sz, x, y, z, m = chrome) => { const k = part(ball(1, 28, 18), m, x, y, z, body); k.scale.set(sx, sy, sz); return k; };
    blob(0.062, 0.024, 0.2, 0, 0, 0.012);                                                 // the spine, nose to tail
    blob(0.03, 0.016, 0.06, 0, 0.018, 0.085, glass);                                      // a black glass canopy
    for (const s of [-1, 1]) {
      const wing = blob(0.165, 0.009, 0.1, s * 0.105, 0.002, -0.012); wing.rotation.y = s * 0.36; wing.rotation.z = -s * 0.07;      // the wing: a flattened drop, swept back, with a little droop
      const tip = blob(0.05, 0.006, 0.05, s * 0.232, 0.014, -0.07); tip.rotation.y = s * 0.7; tip.rotation.z = s * 0.5;             // and a tip that curls up
      const horn = blob(0.012, 0.01, 0.045, s * 0.034, 0.002, 0.196); horn.rotation.y = -s * 0.25;                                  // the two lobes either side of the mouth
      const le = part(box(0.2, 0.0025, 0.004), edge, s * 0.11, -0.006, 0.058, body); le.rotation.y = s * 0.36;                       // light under the leading edge
      part(ball(0.006, 8, 6), s > 0 ? glow(0.2, 3, 0.4) : glow(3, 0.15, 0.1), s * 0.262, 0.03, -0.092, body);                       // a lamp on each tip
    }
    const tail = part(cyl(0.006, 0.0012, 0.2, 8), chrome, 0, 0.004, -0.27, body); tail.rotation.x = Math.PI / 2 + 0.06;              // the whip
    part(ball(0.006, 8, 6), glow(3.2, 0.2, 0.3), 0, 0.016, -0.37, body);
    part(ball(0.011), glass, 0, -0.014, 0.17, body);                                      // the eye underneath
    for (const [sx, sz] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) {
      const x = sx * (sz > 0 ? 0.088 : 0.135), z = sz > 0 ? 0.03 : -0.055, r = sz > 0 ? 0.04 : 0.036;
      const lip = part(new THREE.TorusGeometry(r + 0.004, 0.005, 8, 24), chrome, x, 0.01, z, body); lip.rotation.x = Math.PI / 2;    // a polished lip round each fan
      const well = part(cyl(r, r, 0.012, 20, 1, true), dark, x, 0.004, z, body); well.material.side = THREE.DoubleSide;
      rotor(body, props, x, 0.008, z, r - 0.003, sx * sz, dark, 0x58d8ff);
    }
    return { group: g, body, props };
  },
  // A racing quad: a bare frame, a canopy, a camera tipped up.
  fpv() {
    const g = new THREE.Group(), body = new THREE.Group(), props = [];
    g.add(body);
    const lime = P(paintOf(0xa6e22e)), dark = std(0x121316, { roughness: 0.6 }), pink = paintOf(0xff3d8b);
    for (const s of [-1, 1]) { const arm = part(box(0.3, 0.008, 0.03), dark, 0, 0, 0, body); arm.rotation.y = s * Math.PI / 4; }      // an X of carbon
    part(box(0.05, 0.012, 0.13), dark, 0, 0.008, 0, body);
    const pod = part(box(0.044, 0.03, 0.09), lime, 0, 0.03, 0.005, body); pod.rotation.x = -0.18;            // canopy
    part(box(0.046, 0.008, 0.03), pink, 0, 0.046, -0.02, body);
    const cam = part(cyl(0.012, 0.012, 0.02, 10), std(0x05070a, { roughness: 0.1, metalness: 0.8 }), 0, 0.03, 0.06, body); cam.rotation.x = Math.PI / 2 - 0.5;
    part(box(0.05, 0.022, 0.05), std(0x2b2f3a, { roughness: 0.4 }), 0, -0.016, -0.005, body);                // battery
    const whip = part(cyl(0.002, 0.002, 0.08, 5), dark, 0, 0.05, -0.075, body); whip.rotation.x = -0.6;
    part(ball(0.007, 6, 5), pink, 0, 0.084, -0.098, body);
    part(box(0.05, 0.008, 0.006), glow(0.4, 3.2, 0.6), 0, 0.012, -0.068, body);                              // tail light bar
    for (const [sx, sz] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) {
      rotor(body, props, sx * 0.106, 0.034, sz * 0.106, 0.062, sx * sz, dark, 0xa6e22e);
      part(cyl(0.017, 0.017, 0.006, 10), sz > 0 ? lime : pink, sx * 0.106, 0.004, sz * 0.106, body);
    }
    return { group: g, body, props };
  },
};

// A flying saucer, the classic kind: a lens of bright metal, a glass dome with something small in it,
// lights chasing round the rim, and a faint cone of light underneath. It is used twice: as a toy to
// fly, and (bigger) as the thing on the pedestal it is copied from (src/secret.js).
export function buildSaucer() {
  const g = new THREE.Group(), body = new THREE.Group(), props = [];
  g.add(body);
  const metal = P(std(0xb9c2c8, { roughness: 0.22, metalness: 0.85, emissive: 0x39424a, emissiveIntensity: 0.55 })), dark = std(0x23282e, { roughness: 0.5, metalness: 0.6 });
  const top = part(ball(0.17, 20, 10), metal, 0, 0, 0, body); top.scale.set(1, 0.2, 1);
  part(cyl(0.172, 0.172, 0.012, 24), dark, 0, 0, 0, body);                                        // the rim
  const under = part(cyl(0.07, 0.13, 0.03, 20), metal, 0, -0.03, 0, body);
  part(cyl(0.05, 0.05, 0.008, 16), glow(0.5, 2.6, 1.6), 0, -0.047, 0, body);                      // the port the beam comes from
  const dome = part(new THREE.SphereGeometry(0.075, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x9fe8ff, roughness: 0.08, metalness: 0.2, transparent: true, opacity: 0.45, emissive: 0x3fb6d8, emissiveIntensity: 0.7 }), 0, 0.022, 0, body);
  dome.renderOrder = 3;
  part(ball(0.026, 10, 8), std(0x8fa08a, { roughness: 0.6, emissive: 0x3a4a36, emissiveIntensity: 0.5 }), 0, 0.045, 0, body);      // the pilot: a grey head
  for (const s of [-1, 1]) part(ball(0.008, 6, 5), std(0x050505, { roughness: 0.2 }), s * 0.011, 0.048, 0.021, body);
  const ring = new THREE.Group(); body.add(ring);
  const lamps = [];
  for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2, m = glow(0.4, 2.8, 1.2); lamps.push(m); part(ball(0.011, 8, 6), m, Math.sin(a) * 0.15, -0.006, Math.cos(a) * 0.15, ring); }
  const beam = part(new THREE.ConeGeometry(0.16, 0.42, 20, 1, true), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.25, 1.2, 0.7), transparent: true, opacity: 0.13, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }), 0, -0.26, 0, body);
  beam.renderOrder = 5;
  let t = 0;
  // The lights chase round, the hull rocks a little as it hangs there, and the beam breathes.
  const anim = (toy, dt) => {
    t += dt;
    ring.rotation.y = t * 1.3;
    lamps.forEach((m, i) => { const k = 0.5 + 0.5 * Math.sin(t * 7 - i * Math.PI * 0.4); m.color.setRGB(0.3 + 2.2 * k, 2.6 - 1.2 * k, 0.9 + 1.6 * (1 - k)); });
    const still = toy ? Math.max(0, 1 - Math.hypot(toy.vel.x, toy.vel.z) / 4) : 1, rx = Math.sin(t * 2.3) * 0.045 * still, rz = Math.cos(t * 1.9) * 0.045 * still;
    if (toy) { body.rotation.x += rx; body.rotation.z += rz; } else { body.rotation.x = rx; body.rotation.z = rz; }      // (a toy's own tilt is set afresh every frame; this rides on it)
    beam.material.opacity = toy && toy.landed ? 0 : 0.1 + 0.05 * Math.sin(t * 5);
    under.rotation.y = -t * 2;
  };
  return { group: g, body, props, anim };
}

/** A fresh model of any toy in the garage: { group, body, wheels, aerial } or { group, body, props }. */
export function buildVehicle(id) {
  const v = BY_ID[id] || VEHICLES[0];
  if (v.kind === 'car') {
    if (CARS[id]) return CARS[id]();
    const m = buildCar(); m.group.remove(m.lamp, m.lamp.target); return m;
  }
  if (id === 'ufo') return buildSaucer();
  if (DRONES[id]) return DRONES[id]();
  const m = buildDrone(); m.group.remove(m.lamp, m.lamp.target); return m;
}

// --------------------------------------------------------------- garage ---

const KEY = 'after-hours.garage';
const pct = (k, name) => (k && Math.abs(k - 1) > 0.005 ? `${name} ${k > 1 ? '+' : '−'}${Math.round(Math.abs(k - 1) * 100)}%` : '');

export class Garage {
  constructor() {
    this.open = new Set(['buggy', 'quad']);
    this.sel = { car: 'buggy', drone: 'quad' };       // the last chosen of each, which SWAP goes between
    this.kind = 'car';
    this.shown = 'buggy';                             // what the title screen's selector is on (may be locked)
    this.seen = 0; this.trophies = new Set();
    this.thumbs = {};
    this.on = { car: null, drone: null };             // which body each toy is wearing
    this.onUnlock = null;                             // (vehicle) when one unlocks
    this.paints = new Set(); this.coat = {};          // cans of paint owned, and which is on which toy
    this.toys = { car: null, drone: null };
    try {
      const s = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (s) {
        for (const id of s.open || []) if (BY_ID[id]) this.open.add(id);
        for (const k of ['car', 'drone']) if (s.sel && BY_ID[s.sel[k]] && BY_ID[s.sel[k]].kind === k && this.open.has(s.sel[k])) this.sel[k] = s.sel[k];
        if (s.kind === 'drone') this.kind = 'drone';
        for (const id of s.paints || []) if (PAINT_OF[id]) this.paints.add(id);
        for (const [v, c] of Object.entries(s.coat || {})) if (BY_ID[v] && this.paints.has(c)) this.coat[v] = c;
      }
    } catch { /* no storage */ }
    this.shown = this.sel[this.kind];
  }
  save() { try { localStorage.setItem(KEY, JSON.stringify({ open: [...this.open], sel: this.sel, kind: this.kind, paints: [...this.paints], coat: this.coat })); } catch { /* fine */ } }

  get(id) { return BY_ID[id]; }
  /** Bought at the stall. */
  buy(id) { const v = BY_ID[id]; if (!v || this.open.has(id)) return false; this.open.add(id); this.save(); if (this.onUnlock) this.onUnlock(v); return true; }
  isOpen(id) { return this.open.has(id); }
  /** What still has to be done for a locked one. */
  lockText(v) {
    if (v.trophy || v.shop || v.gift) return v.how;
    const n = Math.max(1, v.need - this.seen);
    return `Look closely at ${n} more work${n === 1 ? '' : 's'}`;
  }
  statText(v) { const s = v.spec; return [pct(s.top, 'speed'), pct(s.accel, 'pull'), pct(s.grip, 'grip'), pct(s.steer, 'steering'), pct(s.jump, 'hop'), pct(s.climb, 'climb'), pct(s.yaw, 'turn')].filter(Boolean).join(' · '); }

  /** Works seen and trophies earned, as they stand. Anything newly earned unlocks; `quiet` says nothing about it. */
  check(seen, trophies, quiet = false) {
    this.seen = seen; this.trophies = trophies || this.trophies;
    let any = false;
    for (const v of VEHICLES) {
      if (this.open.has(v.id) || v.shop || v.gift || !(v.trophy ? this.trophies.has(v.trophy) : seen >= v.need)) continue;      // what is for sale is only ever bought
      this.open.add(v.id); any = true;
      if (!quiet && this.onUnlock) this.onUnlock(v);
    }
    if (any) this.save();
    return any;
  }

  /** The title screen's selector moves on by `step` through every toy, locked or not. */
  step(step, pick) {
    const i = (VEHICLES.findIndex(v => v.id === this.shown) + step + VEHICLES.length) % VEHICLES.length;
    this.choose(VEHICLES[i].id, pick);
  }
  choose(id, pick, force = false) {
    const v = BY_ID[id] || VEHICLES[0];
    this.shown = v.id;
    if (force) this.open.add(v.id);
    if (this.open.has(v.id)) { this.sel[v.kind] = v.id; this.kind = v.kind; this.save(); }
    if (pick) { pick.toy = v.kind; pick.vehicle = v.id; }
    this.show();
    return v;
  }
  /** The last one used of a kind (a saved game remembers whether it was a car or a drone). */
  chooseKind(kind, pick) { return this.choose(this.sel[kind === 'drone' ? 'drone' : 'car'], pick); }
  /** `?toy=`: car, drone, or the id of any toy (which opens it, for testing). */
  fromParam(p, pick) { return (BY_ID[p] ? this.choose(p, pick, true) : this.chooseKind(p, pick)).kind; }
  ready() { return this.open.has(this.shown); }

  /** Put the chosen bodies on the two toys. */
  apply(car, drone) {
    for (const [toy, kind] of [[car, 'car'], [drone, 'drone']]) {
      const id = this.sel[kind];
      if (!toy || this.on[kind] === id) continue;
      toy.reskin(buildVehicle(id), BY_ID[id].spec);
      this.on[kind] = id;
    }
    this.toys = { car: car || this.toys.car, drone: drone || this.toys.drone };
    this.recoat();
  }
  /** A can bought. True if it is new. */
  ownPaint(id) { if (!PAINT_OF[id] || this.paints.has(id)) return false; this.paints.add(id); this.save(); return true; }
  /** Which colour a toy wears (null: its own), and putting one on it. */
  coatOf(vehicle) { const c = this.coat[vehicle]; return c && this.paints.has(c) ? PAINT_OF[c] : null; }
  setCoat(vehicle, id) { if (id && this.paints.has(id)) this.coat[vehicle] = id; else delete this.coat[vehicle]; this.save(); this.recoat(); this.show(); }
  recoat() { for (const kind of ['car', 'drone']) { const toy = this.toys[kind], id = this.on[kind] || (kind === 'car' ? 'buggy' : 'quad'); if (toy && id) { const c = this.coatOf(id); repaint(toy.body, c ? c.hex : null); } } }

  /** A small picture of each toy for the title screen, drawn once with the game's own renderer. */
  portraits(renderer) {
    const W = 264, H = 168;
    try {
      const rt = new THREE.WebGLRenderTarget(W, H), scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(30, W / H, 0.05, 10);
      scene.add(new THREE.HemisphereLight(0xffffff, 0x50483c, 2.6));
      const sun = new THREE.DirectionalLight(0xfff2dc, 3.4); sun.position.set(1.2, 2, 1.6); scene.add(sun);
      const buf = new Uint8Array(W * H * 4), cv = document.createElement('canvas'), cx = cv.getContext('2d');
      cv.width = W; cv.height = H;
      const lut = new Uint8ClampedArray(256); for (let i = 0; i < 256; i++) lut[i] = Math.round(255 * Math.pow(i / 255, 1 / 2.2));
      const was = renderer.getRenderTarget(), col = new THREE.Color(), alpha = renderer.getClearAlpha();
      renderer.getClearColor(col);
      renderer.setClearColor(0x000000, 0);
      for (const v of VEHICLES) {
        const m = buildVehicle(v.id);
        m.group.rotation.set(0, v.kind === 'car' ? -2.25 : -2.45, 0);
        m.group.position.set(0, v.kind === 'car' ? -0.12 : 0, 0);
        m.group.scale.setScalar(m.view || 1);                // (a long one is drawn smaller, to fit)
        scene.add(m.group);
        cam.position.set(0, v.kind === 'car' ? 0.3 : 0.34, 1.12); cam.lookAt(0, v.kind === 'car' ? 0.0 : 0.0, 0);
        renderer.setRenderTarget(rt); renderer.clear(); renderer.render(scene, cam);
        renderer.readRenderTargetPixels(rt, 0, 0, W, H, buf);
        const img = cx.createImageData(W, H);
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
          const s = ((H - 1 - y) * W + x) * 4, d = (y * W + x) * 4;
          img.data[d] = lut[buf[s]]; img.data[d + 1] = lut[buf[s + 1]]; img.data[d + 2] = lut[buf[s + 2]]; img.data[d + 3] = buf[s + 3];
        }
        cx.putImageData(img, 0, 0);
        this.thumbs[v.id] = cv.toDataURL('image/png');
        scene.remove(m.group);
      }
      renderer.setRenderTarget(was); renderer.setClearColor(col, alpha);
      rt.dispose();
    } catch (e) { /* no pictures: the names still say which is which */ }
    this.show();
  }

  /** The title screen: the selector's name and hint, the picture, and whether Start will go. */
  show() {
    const $ = id => document.getElementById(id), v = BY_ID[this.shown], open = this.open.has(v.id);
    const val = $('toyVal'); if (!val) return;
    const name = v.secret && !open ? '???' : v.name;                 // what it is, is the secret
    val.textContent = name; val.classList.toggle('long', name.length > 9);
    $('toyHint').textContent = open ? v.hint : v.secret ? 'Locked. ???' : `Locked. ${this.lockText(v)}.`;
    const el = $('garage'); if (!el) return;
    el.classList.toggle('locked', !open);
    const img = $('gImg'); if (this.thumbs[v.id]) { img.src = this.thumbs[v.id]; img.hidden = false; } else img.hidden = true;
    img.alt = open ? v.name : 'A locked vehicle, in silhouette';
    $('gName').textContent = name;
    $('gNote').textContent = open ? (this.statText(v) || 'Balanced.') : this.lockText(v);
    const i = VEHICLES.indexOf(v);
    $('gCount').textContent = `${i + 1} / ${VEHICLES.length} · ${this.open.size} unlocked`;
    // The cans you own, as a row of swatches under the picture: tap one to put it on this toy. (None until one is bought.)
    let row = $('gPaint');
    if (!row) { row = document.createElement('div'); row.id = 'gPaint'; row.setAttribute('role', 'group'); row.setAttribute('aria-label', 'Body colour'); el.insertAdjacentElement('afterend', row);
      const st = document.createElement('style'); st.textContent = '#gPaint { display: flex; flex-wrap: wrap; gap: 6px; margin: -8px 0 12px; max-width: 30em; } #gPaint[hidden] { display: none; } #gPaint button { width: 26px; height: 26px; border-radius: 50%; border: 2px solid rgba(226,205,148,.35); padding: 0; cursor: pointer; } #gPaint button.on { border-color: #fff3c8; box-shadow: 0 0 0 2px rgba(226,205,148,.7); } #gPaint button.own { background: conic-gradient(#d2261c, #f2c21b, #12683a, #1e4fc8, #d2261c); } @media (max-height: 460px) { #gPaint { margin: 0 0 6px; gap: 5px; max-width: 300px; } #gPaint button { width: 22px; height: 22px; } }'; document.head.append(st);
      row.addEventListener('click', e => { const b = e.target.closest('button'); if (b) this.setCoat(this.shown, b.dataset.paint || null); }); }
    row.hidden = !open || !this.paints.size || v.id === 'ufo';
    if (!row.hidden) { const cur = this.coatOf(v.id); row.textContent = '';
      const mk = (id, name, hex) => { const b = document.createElement('button'); b.type = 'button'; b.title = name; b.setAttribute('aria-label', name); b.setAttribute('aria-pressed', String((cur ? cur.id : '') === id)); if (id) { b.dataset.paint = id; b.style.background = '#' + hex.toString(16).padStart(6, '0'); } else b.className = 'own'; if ((cur ? cur.id : '') === id) b.classList.add('on'); row.append(b); };
      mk('', 'Its own paint'); for (const p of PAINTS) if (this.paints.has(p.id)) mk(p.id, p.name, p.hex); }
    for (const b of document.querySelectorAll('#title [data-act="start"], #title [data-act="newgame"]')) b.classList.toggle('nogo', !open), b.setAttribute('aria-disabled', !open);
  }
}
