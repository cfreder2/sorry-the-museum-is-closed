// The craft: the saucer of the finale, sixteen metres across, with the look of the small one on the pedestal in
// Sub-level 9 (buildSaucer in src/garage.js), done properly. One shape, made here, for both places it is seen:
//
//   buildCraftBody()   the craft as it stands in the hangar under Butler Field (src/finale.js): a silver lens of a hull,
//                      a tall glass dome the colour of shallow water, a dark rim band with its ring of lamps, four legs,
//                      the ramp, and inside the low cabin round the pedestal of controls, its two seats. Its own frame:
//                      the origin is the foot of the legs, the door and its ramp face -x, and the shapes are CRAFT in
//                      src/finaleplan.js, where its collision in the hangar is too.
//   buildCraft()       the same craft for the voyage (src/voyage.js) and the Moon (src/moon.js), with the cabin the flight
//                      needs fitted inside that hull: the cabin is the round well under the dome, its floor the craft's
//                      floor, its wall the hull's own depth (the glass begins where the wall stops, so the whole dome is
//                      the window), the five pads of the craft's call on the pedestal, the art it is carrying round the
//                      wall, and a passage from the well out to the door, along the slot the hull has there. Its frame:
//                      the cabin floor at y = 0, forward -z, the door and the ramp at -x, the legs reaching down to
//                      y = -LEG. The Moon's plan (src/moon.js) is built to these numbers.
//
// (It was two crafts: the voyage drew a taller one of its own, with a band of windows, and it changed shape on the way to the
// Moon. The hangar's is the better ship.)

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { MOTIF } from './motif.js';
import { CRAFT as HC, hullY } from './finaleplan.js';

const TAU = Math.PI * 2;
// The voyage's numbers, from the hangar's (src/finaleplan.js CRAFT, heights there off the foot of the legs).
export const CRAFT = {
  LEG: HC.floor,               // the floor stands this high over the ground on its legs
  R: HC.R,                     // the rim
  PIT: 3.5,                    // the cabin's wall, round under the dome
  SILL: HC.domeY - HC.floor,   // how high it is: where the glass begins
  DOOR: HC.door,               // half the angle of the slot the door and the passage are in
  HINGE: HC.R - 0.4,           // the ramp's hinge, out along -x at floor height
  RUN: HC.rampLen,             // how far out the ramp reaches, down at the ground
  RAMP_W: HC.rampW,
};
const DOOR_T = Math.PI * 1.5;  // three's angles run from +z towards +x: the door, at -x, is three quarters round

const glow = (r, g, b) => new THREE.MeshBasicMaterial({ color: new THREE.Color(r, g, b) });
const canvas = (w, h, draw) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const c = cv.getContext('2d'); draw(c, w, h); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return { tex: t, ctx: c, cv, w, h }; };
const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0, ...o });

// ---------------------------------------------------------------- the craft, as the hangar has it --
export function buildCraftBody() {
  const C = HC, g = new THREE.Group(), body = new THREE.Group(); g.add(body); g.name = 'the craft';
  const panel = canvas(1024, 256, (c, w, h) => {
    c.fillStyle = '#c9d1d6'; c.fillRect(0, 0, w, h);
    c.strokeStyle = 'rgba(40,48,56,.55)'; c.lineWidth = 2; for (let i = 0; i <= 48; i++) { c.beginPath(); c.moveTo(i * w / 48, 0); c.lineTo(i * w / 48, h); c.stroke(); }
    for (const y of [h * 0.3, h * 0.62]) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
    c.fillStyle = 'rgba(60,70,80,.5)'; for (let i = 0; i < 48; i++) for (const y of [h * 0.3 - 6, h * 0.62 - 6]) { c.beginPath(); c.arc(i * w / 48 + 10, y, 2, 0, 7); c.fill(); }
  }).tex;
  panel.wrapS = THREE.RepeatWrapping;
  const hull = new THREE.MeshStandardMaterial({ color: 0xc4ccd2, map: panel, roughness: 0.28, metalness: 0.7, emissive: 0x3e474f, emissiveIntensity: 0.75, side: THREE.DoubleSide });
  const dark = new THREE.MeshStandardMaterial({ color: 0x23282e, roughness: 0.45, metalness: 0.6, emissive: 0x15191d, emissiveIntensity: 0.6, side: THREE.DoubleSide });
  const door = DOOR_T, gap = C.door;
  const lathe = (pts, mat, cut = true) => { const geo = new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), 96, cut ? door + gap : 0, cut ? TAU - 2 * gap : TAU); const m = new THREE.Mesh(geo, mat); body.add(m); return m; };
  // underneath: the skirt from the belly out, then the lower hull to the rim
  lathe([[C.bellyR, C.belly], [4.6, C.belly + 0.38], [C.skirtR, C.skirtY]], hull, false);
  lathe([[C.skirtR, C.skirtY], [7.2, 2.2], [7.8, 2.36], [C.R, C.rimLow]], hull);
  lathe([[C.R, C.rimLow], [C.R + 0.08, C.rimLow + 0.05], [C.R + 0.08, C.rim - 0.05], [C.R, C.rim]], dark);
  const up = []; for (let i = 0; i <= 14; i++) { const r = C.R - (C.R - C.domeR) * i / 14; up.push([r, hullY(r)]); }
  lathe(up, hull);
  // the dome, glass, with a frame round its foot
  const dome = new THREE.Mesh(new THREE.SphereGeometry(C.domeR, 48, 20, 0, TAU, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x9fe8ff, roughness: 0.08, metalness: 0.2, transparent: true, opacity: 0.24, emissive: 0x3fb6d8, emissiveIntensity: 0.3, depthWrite: false }));
  dome.scale.y = (C.top - C.domeY) / C.domeR; dome.position.y = C.domeY; dome.renderOrder = 5; body.add(dome);
  const foot = new THREE.Mesh(new THREE.TorusGeometry(C.domeR, 0.09, 8, 64), dark); foot.rotation.x = Math.PI / 2; foot.position.y = C.domeY + 0.02; body.add(foot);
  // the doorway's sides, and its sill
  for (const s of [-1, 1]) {
    const a = door + s * gap, j = new THREE.Mesh(new THREE.BoxGeometry(0.08, C.rim + 0.6 - C.rimLow, C.R - C.cabinR + 0.4), dark);
    j.position.set(Math.sin(a) * (C.R + C.cabinR) / 2, (C.rimLow + C.rim + 0.6) / 2, Math.cos(a) * (C.R + C.cabinR) / 2); j.rotation.y = a; body.add(j);
  }
  // the cabin: its floor, lit in rings, a pedestal of controls under the dome, two seats, a strip of light round the edge
  const floorT = canvas(512, 512, (c, w, h) => { c.fillStyle = '#20262c'; c.fillRect(0, 0, w, h); c.strokeStyle = 'rgba(120,255,190,.5)'; c.lineWidth = 3; for (const r of [0.2, 0.36, 0.5]) { c.beginPath(); c.arc(w / 2, h / 2, r * w, 0, 7); c.stroke(); } c.strokeStyle = 'rgba(255,255,255,.08)'; for (let i = 0; i < 24; i++) { const a = i / 24 * 7; c.beginPath(); c.moveTo(w / 2, h / 2); c.lineTo(w / 2 + Math.cos(a) * w / 2, h / 2 + Math.sin(a) * w / 2); c.stroke(); } }).tex;
  const fl = new THREE.Mesh(new THREE.CircleGeometry(C.cabinR + 0.4, 64), new THREE.MeshStandardMaterial({ map: floorT, roughness: 0.5, metalness: 0.4, emissiveMap: floorT, emissive: 0xffffff, emissiveIntensity: 0.5 }));
  fl.rotation.x = -Math.PI / 2; fl.position.y = C.floor + 0.004; body.add(fl);
  const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.95, 1.0, 24), dark); ped.position.y = C.floor + 0.5; body.add(ped);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.04, 6, 32), glow(0.4, 2.0, 1.3)); ring.rotation.x = Math.PI / 2; ring.position.y = C.floor + 1.0; body.add(ring);
  for (const a of [0.6, -0.6]) { const s = new THREE.Group(), seat = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.12, 0.7), dark), bk = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.9, 0.12), dark); seat.position.y = 0.5; bk.position.set(0, 0.95, -0.35); s.add(seat, bk); s.position.set(Math.sin(a) * 2.2, C.floor, Math.cos(a) * 2.2); s.rotation.y = a + Math.PI; body.add(s); }
  const strip = new THREE.Mesh(new THREE.TorusGeometry(6.4, 0.05, 6, 96), glow(0.3, 1.4, 1.6)); strip.rotation.x = Math.PI / 2; strip.position.y = hullY(6.4) - 0.3; body.add(strip);
  // the port underneath, where the beam comes from
  const port = new THREE.Mesh(new THREE.CircleGeometry(2.0, 40), glow(0.15, 0.7, 0.4)); port.rotation.x = Math.PI / 2; port.position.y = C.belly - 0.01; body.add(port);
  const portRim = new THREE.Mesh(new THREE.TorusGeometry(2.05, 0.08, 6, 48), dark); portRim.rotation.x = Math.PI / 2; portRim.position.y = C.belly - 0.02; body.add(portRim);
  // rim lamps
  const n = 30, lamps = new THREE.InstancedMesh(new THREE.SphereGeometry(0.2, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }), n);
  { const M4 = new THREE.Matrix4(), V = new THREE.Vector3(), Q = new THREE.Quaternion(), S = new THREE.Vector3(1, 1, 1), c = new THREE.Color(1, 1, 1); for (let i = 0; i < n; i++) { const a = door + gap + 0.12 + (TAU - 2 * gap - 0.24) * i / (n - 1); lamps.setMatrixAt(i, M4.compose(V.set(Math.sin(a) * (C.R + 0.24), (C.rimLow + C.rim) / 2, Math.cos(a) * (C.R + 0.24)), Q, S)); lamps.setColorAt(i, c); } }
  lamps.frustumCulled = false; body.add(lamps);
  // legs, clear of the doorway (each in a group of its own, so that the flight can draw it up into the hull: setLegs)
  const legs = [];
  for (const a of [Math.PI / 4, 3 * Math.PI / 4, 5 * Math.PI / 4, 7 * Math.PI / 4]) {
    const leg = new THREE.Group(), fx = Math.cos(a), fz = Math.sin(a), top = new THREE.Vector3(fx * (C.legR - 1.1), C.belly + 0.6, fz * (C.legR - 1.1)), ft = new THREE.Vector3(fx * C.legR, 0.18, fz * C.legR);
    const len = top.distanceTo(ft), strut = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, len, 10), dark);
    strut.position.copy(top).add(ft).multiplyScalar(0.5); strut.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), top.clone().sub(ft).normalize()); leg.add(strut);
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, 0.18, 16), dark); pad.position.copy(ft).setY(0.09); leg.add(pad);
    g.add(leg); legs.push(leg);
  }
  // the ramp: hinged at the sill; down, it lies at its slope to the floor; up, it is drawn level and slid into the hull
  const rampG = new THREE.Group(), Lr = Math.hypot(C.rampLen, C.floor - 0.02), th = Math.atan2(C.floor - 0.02, C.rampLen);
  rampG.position.set(-(C.R - 0.4), C.floor, 0); g.add(rampG);
  const plank = new THREE.Group(); rampG.add(plank);
  // its tread: ribs across it. Nothing on it points.
  const ribs = canvas(64, 64, (c, w, h) => { c.fillStyle = '#20242a'; c.fillRect(0, 0, w, h); c.fillStyle = '#9aa3ab'; c.fillRect(8, 5, 16, h - 10); c.fillStyle = '#0c0e11'; c.fillRect(24, 5, 5, h - 10); }).tex; ribs.wrapS = ribs.wrapT = THREE.RepeatWrapping; ribs.repeat.set(Math.round(Lr / 0.3), 1);
  const top = new THREE.Mesh(new THREE.BoxGeometry(Lr, 0.12, C.rampW), [dark, dark, new THREE.MeshStandardMaterial({ color: 0x8a949c, map: ribs, roughness: 0.6, metalness: 0.4, emissive: 0x2a3036, emissiveIntensity: 0.6 }), dark, dark, dark]);
  top.position.set(-Lr / 2, -0.06, 0); plank.add(top);
  for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.BoxGeometry(Lr, 0.06, 0.08), glow(0.95, 0.72, 0.2)); e.position.set(-Lr / 2, 0.01, s * (C.rampW / 2 - 0.04)); plank.add(e); }
  const setRamp = u => {      // 0: down; 1: stowed
    const a = Math.min(1, u * 2), b = Math.max(0, u * 2 - 1);
    plank.rotation.z = th * (1 - a); plank.position.set(Lr * b, -0.3 * a, 0);
  };
  setRamp(0);
  return {
    group: g, body, lamps, port, ramp: rampG, setRamp, dome, legs, hull, dark,
    // 1: standing on them; 0: drawn up into the hull (in flight)
    setLegs(k) { for (const l of legs) l.position.y = (1 - Math.max(0, Math.min(1, k))) * 1.45; },
  };
}

// ---------------------------------------------------------------- the craft, for the voyage --
export function buildCraft() {
  const C = CRAFT, g = new THREE.Group(); g.name = 'craft';
  const B = buildCraftBody(); B.group.position.y = -HC.floor; g.add(B.group);
  const cabin = new THREE.Group(); g.add(cabin);
  const dark = B.dark;
  // ---- the well under the dome: its wall, as deep as the hull, from the floor to where the glass begins; a gap at the door
  const gapA = C.DOOR, H = C.SILL + 0.02;
  const wallIn = std(0x9ea8b1, { roughness: 0.6, metalness: 0.35, side: THREE.BackSide, emissive: 0x141a20, emissiveIntensity: 0.5 });
  const wall = new THREE.CylinderGeometry(C.PIT, C.PIT, H, 72, 1, true, DOOR_T + gapA, TAU - 2 * gapA); wall.translate(0, H / 2, 0);
  cabin.add(new THREE.Mesh(wall, wallIn));
  const cap = new THREE.RingGeometry(C.PIT - 0.05, HC.domeR + 0.06, 72, 1, DOOR_T + gapA - Math.PI / 2, TAU - 2 * gapA); cap.rotateX(-Math.PI / 2); cap.translate(0, H, 0);
  cabin.add(new THREE.Mesh(cap, dark));
  // ---- the passage out to the door, along the slot in the hull: its two walls, each as high as the hull over it
  const pass = [];
  for (const s of [-1, 1]) {
    const a = DOOR_T + s * gapA, sx = Math.sin(a), sz = Math.cos(a), pos = [], idx = [], N = 10;
    for (let i = 0; i <= N; i++) { const r = C.PIT + (C.HINGE + 0.05 - C.PIT) * i / N, y = hullY(r) - HC.floor - 0.03; pos.push(sx * r, 0, sz * r, sx * r, y, sz * r); if (i < N) { const k = i * 2; idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); } }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals(); pass.push(geo);
  }
  cabin.add(new THREE.Mesh(mergeGeometries(pass), std(0x8c969f, { roughness: 0.6, metalness: 0.35, side: THREE.DoubleSide, emissive: 0x141a20, emissiveIntensity: 0.5 })));
  cabin.add(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.02, 2 * C.HINGE * Math.tan(gapA)).translate(-C.HINGE + 0.15, 0.01, 0), dark));      // the threshold, out to the hinge
  // ---- the five pads of the call, on the pedestal's top, in an arc at its front (left to right as you sit facing forward)
  const pads = MOTIF.map((nn, i) => {
    const a = Math.PI - (i - 2) * 0.27, m = new THREE.MeshBasicMaterial({ color: new THREE.Color(nn.colour).multiplyScalar(0.55) });
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.025, 20), m); p.position.set(Math.sin(a) * 0.5, 1.012, Math.cos(a) * 0.5); cabin.add(p);
    return { mesh: p, base: new THREE.Color(nn.colour) };
  });
  const light = new THREE.PointLight(0xdff4ff, 14, 16, 1.6); light.position.set(0, 2.4, 0); cabin.add(light);

  // where the art hangs: round the well's wall, clear of the door and of the back (the books and the net are there)
  const BACK = 0.5, runs = [[BACK, DOOR_T - gapA - 0.22], [DOOR_T + gapA + 0.22, TAU - BACK]];
  const hangAt = n => {
    const total = runs.reduce((s, [a, b]) => s + (b - a), 0), out = [];
    for (let i = 0; i < n; i++) {
      let u = (i + 0.5) / n * total;
      for (const [a, b] of runs) { if (u <= b - a) { out.push(a + u); break; } u -= b - a; }
    }
    return out.map(t => ({ t, x: Math.sin(t) * (C.PIT - 0.04), z: Math.cos(t) * (C.PIT - 0.04), y: 0.6, rot: t + Math.PI, room: Math.min(1.3, total * C.PIT / n - 0.12), tall: 0.9 }));
  };

  const N = B.lamps.count;
  return {
    group: g, hull: B.group, cabin, lamps: B.lamps, legs: B.legs, ramp: B.ramp, pads, light, glass: B.dome.material, port: B.port, hangAt,
    // 0: stowed, 1: down to the ground
    setRamp(k) { B.setRamp(1 - Math.max(0, Math.min(1, k))); },
    // 0: drawn up, 1: standing on them
    setLegs(k) { B.setLegs(k); },
    // the lights chase round in the colours of the call; the pads glow when `lit` names one
    animate(t, lit = -1, speed = 1) {
      const c = this._c || (this._c = new THREE.Color());
      for (let i = 0; i < N; i++) { const k = 0.5 + 0.5 * Math.sin(t * 5 * speed - i * 0.6); c.set(MOTIF[(i + Math.floor(t * 2)) % 5].colour).multiplyScalar(0.5 + 2.2 * k); B.lamps.setColorAt(i, c); }
      B.lamps.instanceColor.needsUpdate = true;
      pads.forEach((p, i) => p.mesh.material.color.copy(p.base).multiplyScalar(i === lit ? 2.4 : 0.45 + 0.15 * Math.sin(t * 2 + i)));
      B.port.material.color.setRGB(0.15 + 0.05 * Math.sin(t * 3), 0.7 + 0.25 * Math.sin(t * 3), 0.4);
    },
  };
}

// A picture for the voyage: the work's image on a panel, in a plain gilt frame. `w` and `h` in metres.
export function framedArt(tex, w, h) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0x7a7a7a, map: tex, emissiveMap: tex, emissive: 0xffffff, emissiveIntensity: 0.32, roughness: 0.6 });
  const pic = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat); pic.scale.set(w, h, 1); pic.position.z = 0.035; g.add(pic);
  const f = Math.min(0.09, 0.05 + 0.02 * Math.max(w, h)), d = 0.06;
  const geo = mergeGeometries([
    new THREE.BoxGeometry(w + 2 * f, f, d).translate(0, h / 2 + f / 2, d / 2), new THREE.BoxGeometry(w + 2 * f, f, d).translate(0, -h / 2 - f / 2, d / 2),
    new THREE.BoxGeometry(f, h, d).translate(-w / 2 - f / 2, 0, d / 2), new THREE.BoxGeometry(f, h, d).translate(w / 2 + f / 2, 0, d / 2),
    new THREE.BoxGeometry(w, h, 0.02).translate(0, 0, 0.012),
  ]);
  g.add(new THREE.Mesh(geo, FRAME));
  g.userData = { mat, w, h };
  return g;
}
const FRAME = new THREE.MeshStandardMaterial({ color: 0xc9a24e, roughness: 0.35, metalness: 0.75, emissive: 0x3a2a08, emissiveIntensity: 0.6 });
