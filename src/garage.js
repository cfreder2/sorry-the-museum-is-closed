// The garage. More toys than the two you start with: they unlock as you see more of the
// collection, and a couple for trophies. Each is a different body on the same car or drone
// (Car.reskin, Drone.reskin in vehicles.js), built from boxes and cylinders like the first two,
// and each handles a little differently. None climbs worse than the first: the slopes in the
// building are what they are.

import * as THREE from 'three';
import { buildCar, buildDrone } from './vehicles.js';

const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.5, ...o });
const paintOf = c => std(c, { roughness: 0.3, emissive: c, emissiveIntensity: 0.12 });
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
  { id: 'truck', kind: 'car', name: 'Monster Truck', hint: 'Big soft tyres. Hops higher, holds on better, not as quick.', need: 15, spec: { top: 0.93, accel: 0.95, grip: 1.15, jump: 1.12 } },
  { id: 'rally', kind: 'car', name: 'Rally Hatch', hint: 'Turns in sharply and holds a line on marble.', need: 40, spec: { top: 1.04, grip: 1.3, steer: 1.1 } },
  { id: 'racer', kind: 'car', name: 'Grand Prix', hint: 'Low, quick and nervous. Hops a little lower.', need: 100, spec: { top: 1.1, accel: 1.12, grip: 1.1, steer: 1.05, jump: 0.94 } },
  { id: 'van', kind: 'car', name: 'Art Van', hint: 'The art handlers’ van. Steady, and in no hurry.', trophy: 'dock', how: 'Find the loading dock', spec: { top: 0.96, accel: 0.95, grip: 1.1, steer: 0.95, jump: 1.05 } },
  { id: 'super', kind: 'car', name: 'Supercar', hint: 'Low, wide and far too fast for a museum.', shop: 2000, how: 'For sale at the stall by the card game', spec: { top: 1.16, accel: 1.2, grip: 1.25, steer: 1.08, jump: 0.96 } },
  { id: 'quad', kind: 'drone', name: 'RC Drone', hint: 'Goes up to the glass. Meets a painting eye to eye.', need: 0, spec: {} },
  { id: 'hex', kind: 'drone', name: 'Hexacopter', hint: 'Six rotors. Climbs hard, turns steadily.', need: 25, spec: { accel: 0.95, climb: 1.2, yaw: 0.95 } },
  { id: 'airship', kind: 'drone', name: 'Airship', hint: 'Drifts. Good for standing off from a large canvas.', need: 60, spec: { accel: 0.82, climb: 0.85, yaw: 0.85 } },
  { id: 'fpv', kind: 'drone', name: 'Racing Quad', hint: 'Small and sharp. Quicker in every direction.', trophy: 'bullet', how: 'Land a Stunt Look in slow motion', spec: { accel: 1.15, climb: 1.12, yaw: 1.2 } },
  { id: 'manta', kind: 'drone', name: 'Manta', hint: 'A black wing with four buried fans. Quiet, quick and very smooth.', shop: 2000, how: 'For sale at the stall by the card game', spec: { accel: 1.12, climb: 1.1, yaw: 1.12 } },
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

const CARS = {
  // A pickup on tyres far too big for it.
  truck() {
    const g = new THREE.Group(), body = new THREE.Group(), wheels = [];
    g.add(body);
    const paint = paintOf(0x1e63c8), black = std(0x0c0c0e, { roughness: 0.7 }), chrome = std(0xcfd4da, { metalness: 0.85, roughness: 0.25 }), flame = paintOf(0xf2a116);
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
    const paint = paintOf(0xf1f1ee), blue = paintOf(0x1746a8), red = paintOf(0xd3202a), black = std(0x0c0c0e, { roughness: 0.7 }), white = std(0xf4f4f4, { roughness: 0.4 });
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
    const paint = paintOf(0x0f6b3a), black = std(0x0c0c0e, { roughness: 0.7 }), gold = paintOf(0xe7b43a), white = std(0xf4f4f4, { roughness: 0.4 });
    part(box(0.085, 0.045, 0.3), paint, 0, 0.075, -0.03, body);                           // the tub
    const nose = part(box(0.05, 0.03, 0.17), paint, 0, 0.065, 0.165, body); nose.rotation.x = 0.1;
    part(box(0.27, 0.008, 0.055), gold, 0, 0.035, 0.225, body);                           // front wing
    for (const s of [-1, 1]) part(box(0.006, 0.03, 0.055), gold, s * 0.134, 0.047, 0.225, body);
    for (const s of [-1, 1]) part(box(0.045, 0.04, 0.16), paint, s * 0.065, 0.065, -0.05, body);            // side pods
    part(box(0.07, 0.05, 0.1), paint, 0, 0.115, -0.11, body);                             // engine cover
    part(box(0.03, 0.035, 0.04), black, 0, 0.155, -0.075, body);                          // air box
    part(ball(0.026, 12, 10), gold, 0, 0.118, -0.01, body);                               // the driver
    part(box(0.06, 0.012, 0.01), std(0x10151c, { roughness: 0.15, metalness: 0.5 }), 0, 0.12, 0.014, body);
    for (const s of [-1, 1]) part(box(0.008, 0.075, 0.03), black, s * 0.05, 0.135, -0.2, body);             // rear wing
    part(box(0.2, 0.01, 0.06), gold, 0, 0.175, -0.2, body); part(box(0.2, 0.008, 0.035), paint, 0, 0.145, -0.205, body);
    const disc = part(cyl(0.022, 0.022, 0.004, 14), white, 0, 0.1, 0.1, body); disc.rotation.x = 0.1;        // the number
    for (const s of [-1, 1]) for (const z of [0.135, -0.14]) part(box(0.09, 0.008, 0.012), black, s * 0.075, 0.058, z, body);   // wishbones
    for (const s of [-1, 1]) part(box(0.03, 0.014, 0.01), glow(2.2, 0.1, 0.08), s * 0.02, 0.07, -0.185, body);
    part(ball(0.012), glow(4, 3.6, 2.6), 0, 0.066, 0.25, body);
    for (const [x, z, r, w, f] of [[-0.13, 0.135, 0.05, 0.045, true], [0.13, 0.135, 0.05, 0.045, true], [-0.133, -0.14, 0.064, 0.072, false], [0.133, -0.14, 0.064, 0.072, false]]) wheel(g, wheels, x, z, r, w, f, gold, 10);
    const aerial = aerialOn(body, 0, 0.17, -0.07, 0.14, glow(1.3, 0.9, 0.1));
    return { group: g, body, wheels, aerial };
  },
  // The supercar: a low wedge, wide at the hips, a wing, and a strip of light underneath.
  super() {
    const g = new THREE.Group(), body = new THREE.Group(), wheels = [];
    g.add(body);
    const paint = std(0xff5a12, { roughness: 0.18, metalness: 0.55, emissive: 0xff3a00, emissiveIntensity: 0.16 }), carbon = std(0x0b0b0d, { roughness: 0.45, metalness: 0.3 }), glass = std(0x0a1622, { roughness: 0.06, metalness: 0.9 }), rim = std(0xd8dade, { metalness: 0.9, roughness: 0.2 });
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
    part(box(0.17, 0.008, 0.006), glow(3.2, 0.12, 0.08), 0, 0.082, -0.226, body);         // a tail light bar right across
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
    const paint = paintOf(0xf2efe6), black = std(0x0c0c0e, { roughness: 0.7 }), stripe = paintOf(0xd9622b), grey = std(0x8d9299, { roughness: 0.5, metalness: 0.4 });
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
    const shell = paintOf(0xe2701c), dark = std(0x121316, { roughness: 0.6 });
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
    const skin = paintOf(0xefe7d2), red = paintOf(0xc22a23), dark = std(0x121316, { roughness: 0.6 });
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
  // The Manta: a thin black wing with its four fans buried in it and a line of light round the edge.
  manta() {
    const g = new THREE.Group(), body = new THREE.Group(), props = [];
    g.add(body);
    const skin = std(0x0d0f13, { roughness: 0.22, metalness: 0.7 }), edge = glow(0.15, 2.2, 3.2), dark = std(0x050608, { roughness: 0.5 });
    const hull = part(ball(1, 20, 12), skin, 0, 0, 0.01, body); hull.scale.set(0.085, 0.022, 0.19);          // the spine
    for (const s of [-1, 1]) {
      const wing = part(box(0.17, 0.008, 0.15), skin, s * 0.11, 0, -0.02, body); wing.rotation.y = s * 0.42;  // swept wings
      const tip = part(box(0.06, 0.006, 0.07), skin, s * 0.205, 0.004, -0.09, body); tip.rotation.y = s * 0.7; tip.rotation.z = -s * 0.35;   // turned-up tips
      const le = part(box(0.19, 0.003, 0.005), edge, s * 0.105, 0.002, 0.052, body); le.rotation.y = s * 0.42;                               // light along the leading edge
      part(box(0.006, 0.024, 0.05), skin, s * 0.03, 0.02, -0.16, body);                   // twin fins
    }
    part(box(0.05, 0.012, 0.07), std(0x0a1622, { roughness: 0.05, metalness: 0.9 }), 0, 0.02, 0.07, body);   // a dark canopy
    part(ball(0.012), std(0x05070a, { roughness: 0.1, metalness: 0.8 }), 0, -0.012, 0.15, body);             // the eye
    part(box(0.05, 0.004, 0.006), glow(3, 0.15, 0.1), 0, 0.004, -0.185, body);            // tail light
    for (const [sx, sz] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) {
      const x = sx * (sz > 0 ? 0.085 : 0.125), z = sz > 0 ? 0.03 : -0.07;
      const ring = part(cyl(0.05, 0.05, 0.016, 18, 1, true), dark, x, 0.004, z, body); ring.material.side = THREE.DoubleSide;                  // the duct
      rotor(body, props, x, 0.008, z, 0.045, sx * sz, dark, 0x58d8ff);
    }
    return { group: g, body, props };
  },
  // A racing quad: a bare frame, a canopy, a camera tipped up.
  fpv() {
    const g = new THREE.Group(), body = new THREE.Group(), props = [];
    g.add(body);
    const lime = paintOf(0xa6e22e), dark = std(0x121316, { roughness: 0.6 }), pink = paintOf(0xff3d8b);
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

/** A fresh model of any toy in the garage: { group, body, wheels, aerial } or { group, body, props }. */
export function buildVehicle(id) {
  const v = BY_ID[id] || VEHICLES[0];
  if (v.kind === 'car') {
    if (CARS[id]) return CARS[id]();
    const m = buildCar(); m.group.remove(m.lamp, m.lamp.target); return m;
  }
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
    try {
      const s = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (s) {
        for (const id of s.open || []) if (BY_ID[id]) this.open.add(id);
        for (const k of ['car', 'drone']) if (s.sel && BY_ID[s.sel[k]] && BY_ID[s.sel[k]].kind === k && this.open.has(s.sel[k])) this.sel[k] = s.sel[k];
        if (s.kind === 'drone') this.kind = 'drone';
      }
    } catch { /* no storage */ }
    this.shown = this.sel[this.kind];
  }
  save() { try { localStorage.setItem(KEY, JSON.stringify({ open: [...this.open], sel: this.sel, kind: this.kind })); } catch { /* fine */ } }

  get(id) { return BY_ID[id]; }
  /** Bought at the stall. */
  buy(id) { const v = BY_ID[id]; if (!v || this.open.has(id)) return false; this.open.add(id); this.save(); if (this.onUnlock) this.onUnlock(v); return true; }
  isOpen(id) { return this.open.has(id); }
  /** What still has to be done for a locked one. */
  lockText(v) {
    if (v.trophy || v.shop) return v.how;
    const n = Math.max(1, v.need - this.seen);
    return `See ${n} more work${n === 1 ? '' : 's'}`;
  }
  statText(v) { const s = v.spec; return [pct(s.top, 'speed'), pct(s.accel, 'pull'), pct(s.grip, 'grip'), pct(s.steer, 'steering'), pct(s.jump, 'hop'), pct(s.climb, 'climb'), pct(s.yaw, 'turn')].filter(Boolean).join(' · '); }

  /** Works seen and trophies earned, as they stand. Anything newly earned unlocks; `quiet` says nothing about it. */
  check(seen, trophies, quiet = false) {
    this.seen = seen; this.trophies = trophies || this.trophies;
    let any = false;
    for (const v of VEHICLES) {
      if (this.open.has(v.id) || v.shop || !(v.trophy ? this.trophies.has(v.trophy) : seen >= v.need)) continue;      // what is for sale is only ever bought
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
  }

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
    val.textContent = v.name; val.classList.toggle('long', v.name.length > 9);
    $('toyHint').textContent = open ? v.hint : `Locked. ${this.lockText(v)}.`;
    const el = $('garage'); if (!el) return;
    el.classList.toggle('locked', !open);
    const img = $('gImg'); if (this.thumbs[v.id]) { img.src = this.thumbs[v.id]; img.hidden = false; } else img.hidden = true;
    img.alt = open ? v.name : 'A locked vehicle, in silhouette';
    $('gName').textContent = v.name;
    $('gNote').textContent = open ? (this.statText(v) || (v.kind === 'car' ? 'The one you started with.' : 'The one you started with.')) : this.lockText(v);
    const i = VEHICLES.indexOf(v);
    $('gCount').textContent = `${i + 1} / ${VEHICLES.length} · ${this.open.size} unlocked`;
    for (const b of document.querySelectorAll('#title [data-act="start"], #title [data-act="newgame"]')) b.classList.toggle('nogo', !open), b.setAttribute('aria-disabled', !open);
  }
}
