// The craft: the full-size saucer of the voyage, sixteen metres across, with the look of the small one on the
// pedestal in Sub-level 9 (buildSaucer in src/garage.js): a silver hull, a glass dome the colour of shallow water,
// a ring of lights that chase round its rim. Inside, one round cabin: a floor of plates, a curved wall with a band
// of windows all the way round and a wide windscreen at the front, the console under it with the five pads of the
// craft's call, and on the wall, the art it is carrying home.
//
// Its own frame: the cabin floor is at y = 0, forward is -z (the windscreen), the door and its ramp are at +x.
// The landing legs reach down to y = -LEG. The Moon's plan (src/moon.js) is built to match these numbers.

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { MOTIF } from './motif.js';

export const CRAFT = {
  R: 8.05,            // the rim
  WALL: 6.5,          // the cabin's outer wall
  IN: 6.2,            // its inner face, where the art hangs
  ROOF: 5.6,          // the top of the dome
  LEG: 2.2,           // the floor stands this high over the ground on its legs
  HINGE: 6.45,        // the ramp's hinge, at the door's threshold (along +x)
  RAMP: 7.6,          // the ramp's length
  RAMP_W: 2.2,
  DOOR_W: 2.4, DOOR_H: 2.55,
  BELLY: -1.42,
};
const DOOR_A = CRAFT.DOOR_W / 2 / CRAFT.WALL;            // half the door's angle
const TAU = Math.PI * 2;
// three's cylinders run their angle from +z towards +x: +x is a quarter turn round.
const DOOR_T = Math.PI / 2, SCREEN_T = Math.PI, SCREEN_A = 0.72;

const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0, ...o });

function canvasTex(w, h, draw, srgb = true) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }

// A ring wall segment: part of a cylinder, from angle t0 to t1, from y0 to y1, seen from inside.
function arc(r, y0, y1, t0, t1, seg = 24) {
  const g = new THREE.CylinderGeometry(r, r, y1 - y0, Math.max(2, Math.ceil(seg * (t1 - t0) / TAU * 4)), 1, true, t0, t1 - t0);
  g.translate(0, (y0 + y1) / 2, 0); return g;
}

export function buildCraft() {
  const g = new THREE.Group(); g.name = 'craft';
  const hull = new THREE.Group(), cabin = new THREE.Group(); g.add(hull, cabin);
  const C = CRAFT;

  // ---- the hull, outside (front faces only: from inside the cabin it is not there, and you see out)
  const metal = std(0xc3ccd3, { roughness: 0.32, metalness: 0.45, emissive: 0x3a444d, emissiveIntensity: 0.6 });
  const dark = std(0x23282e, { roughness: 0.5, metalness: 0.6 });
  const under = [[0, -1.42], [1.5, -1.41], [3, -1.36], [4.6, -1.18], [6.3, -0.95], [7.4, -0.82], [8.0, -0.76], [C.R, -0.68], [8.02, -0.6], [7.2, -0.28], [C.WALL, -0.02]].map(([r, y]) => new THREE.Vector2(r, y));
  hull.add(new THREE.Mesh(new THREE.LatheGeometry(under, 96), metal));
  // the outer cabin wall, with the door cut out of it; its window band is lit from within
  const wins = (x, w, h, bg) => {
    x.fillStyle = bg; x.fillRect(0, 0, w, h);
    if (bg !== '#000') { x.fillStyle = 'rgba(40,48,56,.5)'; for (let i = 0; i < 28; i++) x.fillRect(i * w / 28, 0, 2, h); x.fillRect(0, 30, w, 2); x.fillRect(0, 50, w, 2); }
    for (let i = 0; i < 28; i++) { const x0 = i * w / 28 + 5, ww = w / 28 - 10; const gr = x.createLinearGradient(0, 9, 0, 22); gr.addColorStop(0, '#d8f6ff'); gr.addColorStop(1, '#7fd4f0'); x.fillStyle = gr; x.fillRect(x0, 9, ww, 13); }
  };
  const winTex = canvasTex(1024, 64, (x, w, h) => wins(x, w, h, '#b4bec6')), winGlow = canvasTex(1024, 64, (x, w, h) => wins(x, w, h, '#000'));
  const wallMat = std(0xffffff, { map: winTex, emissiveMap: winGlow, emissive: 0xffffff, emissiveIntensity: 0.9, roughness: 0.32, metalness: 0.4 });
  const outer = new THREE.CylinderGeometry(C.WALL, C.WALL, 2.97, 96, 1, true, DOOR_T + DOOR_A, TAU - 2 * DOOR_A);
  outer.translate(0, 1.465, 0);
  // (the texture's lit strip, rows 9 to 22 of 64, falls on the band of windows inside, 1.95 to 2.55 m up)
  const band = new THREE.Mesh(outer, wallMat); hull.add(band);
  const lintel = new THREE.CylinderGeometry(C.WALL, C.WALL, 2.97 - C.DOOR_H, 6, 1, true, DOOR_T - DOOR_A, 2 * DOOR_A); lintel.translate(0, C.DOOR_H + (2.97 - C.DOOR_H) / 2 - 0.02, 0);
  hull.add(new THREE.Mesh(lintel, metal));
  // the dome: glass, the colour of the little one's
  const domeP = [[C.WALL, 2.95], [6.44, 3.2], [6.05, 3.85], [5.25, 4.55], [4.0, 5.1], [2.4, 5.46], [1.0, 5.58], [0, C.ROOF]].map(([r, y]) => new THREE.Vector2(r, y));
  const glass = new THREE.MeshStandardMaterial({ color: 0x9fe8ff, roughness: 0.06, metalness: 0.2, transparent: true, opacity: 0.42, emissive: 0x3fb6d8, emissiveIntensity: 0.55, depthWrite: false });
  const dome = new THREE.Mesh(new THREE.LatheGeometry(domeP, 72), glass); dome.renderOrder = 3; hull.add(dome);
  hull.add(new THREE.Mesh(new THREE.TorusGeometry(C.WALL, 0.07, 6, 96).rotateX(Math.PI / 2).translate(0, 2.97, 0), metal));
  // the belly: the port the beam comes from
  const port = new THREE.Mesh(new THREE.CircleGeometry(2.2, 40).rotateX(Math.PI / 2).translate(0, -1.43, 0), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.4, 2.2, 1.4) }));
  hull.add(port);
  // the rim lights: twenty-four, chasing round in the colours of the call
  const lampGeo = new THREE.SphereGeometry(0.13, 10, 8), N = 24;
  const lamps = new THREE.InstancedMesh(lampGeo, new THREE.MeshBasicMaterial({ color: 0xffffff }), N);
  { const M = new THREE.Matrix4(), c = new THREE.Color(); for (let i = 0; i < N; i++) { const a = i / N * TAU; M.makeTranslation(Math.sin(a) * (C.R + 0.02), -0.66, Math.cos(a) * (C.R + 0.02)); lamps.setMatrixAt(i, M); lamps.setColorAt(i, c.set(MOTIF[i % 5].colour)); } }
  hull.add(lamps);

  // ---- the legs: four struts and their pads, folded up in flight
  const legs = new THREE.Group(); hull.add(legs);
  const legParts = [];
  for (let i = 0; i < 4; i++) {
    const a = Math.PI / 4 + i * Math.PI / 2, leg = new THREE.Group();
    leg.position.set(Math.sin(a) * 5.4, -1.0, Math.cos(a) * 5.4); leg.rotation.y = a;
    const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.14, 1.3, 10).translate(0, -0.65, 0), dark);
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 0.1, 16).translate(0, -1.25, 0), metal);
    leg.add(strut, pad); legs.add(leg); legParts.push(leg);
  }

  // ---- the door and the ramp, at +x
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.12, C.DOOR_H, C.DOOR_W + 0.1).translate(C.WALL - 0.05, C.DOOR_H / 2, 0), metal);
  hull.add(door);
  const ramp = new THREE.Group(); ramp.position.set(C.HINGE, 0, 0); hull.add(ramp);
  const plank = new THREE.Group(); ramp.add(plank);
  const treadTex = canvasTex(64, 256, (x, w, h) => { x.fillStyle = '#5b636b'; x.fillRect(0, 0, w, h); x.fillStyle = '#7d868e'; for (let y = 6; y < h; y += 16) x.fillRect(4, y, w - 8, 5); x.fillStyle = '#e0b030'; x.fillRect(0, 0, 4, h); x.fillRect(w - 4, 0, 4, h); });
  treadTex.wrapT = THREE.RepeatWrapping; treadTex.repeat.set(1, 4);
  const rampMat = std(0xffffff, { map: treadTex, roughness: 0.6, metalness: 0.5 });
  plank.add(new THREE.Mesh(new THREE.BoxGeometry(C.RAMP, 0.12, C.RAMP_W).translate(C.RAMP / 2, -0.06, 0), [dark, dark, rampMat, dark, dark, dark]));
  // the ramp's box: its top face (index 2) is the tread: map it along the length
  { const geo = plank.children[0].geometry, uv = geo.attributes.uv; for (let i = 8; i < 12; i++) uv.setXY(i, uv.getY(i), uv.getX(i)); }
  plank.scale.x = 0.02; plank.visible = false;

  // ---- the cabin, inside
  const plateTex = canvasTex(512, 512, (x, w, h) => {
    x.fillStyle = '#4a525a'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { const s = w / 4; x.fillStyle = `rgb(${78 + ((i + j) % 2) * 8},${86 + ((i + j) % 2) * 8},${94 + ((i + j) % 2) * 8})`; x.fillRect(i * s + 2, j * s + 2, s - 4, s - 4); x.fillStyle = '#2c3238'; for (const [a, b] of [[10, 10], [s - 14, 10], [10, s - 14], [s - 14, s - 14]]) { x.beginPath(); x.arc(i * s + a + 2, j * s + b + 2, 3, 0, TAU); x.fill(); } }
  });
  plateTex.wrapS = plateTex.wrapT = THREE.RepeatWrapping; plateTex.repeat.set(3, 3);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(C.IN + 0.05, 64).rotateX(-Math.PI / 2), std(0xffffff, { map: plateTex, roughness: 0.45, metalness: 0.55 }));
  cabin.add(floor);
  cabin.add(new THREE.Mesh(new THREE.BoxGeometry(C.WALL - C.IN + 0.1, 0.02, C.DOOR_W).translate((C.IN + C.WALL) / 2, 0.01, 0), dark));      // the threshold
  const wallIn = std(0x9ea8b1, { roughness: 0.6, metalness: 0.35, side: THREE.BackSide, emissive: 0x141a20, emissiveIntensity: 0.5 });
  const parts = [];
  // below the windows, round from the door to the screen and from the screen back to the door
  parts.push(arc(C.IN, 0, 1.95, DOOR_T + DOOR_A, SCREEN_T - SCREEN_A), arc(C.IN, 0, 1.95, SCREEN_T + SCREEN_A, TAU + DOOR_T - DOOR_A));
  parts.push(arc(C.IN, 0, 0.72, SCREEN_T - SCREEN_A, SCREEN_T + SCREEN_A));                        // the sill under the screen
  parts.push(arc(C.IN, 2.55, 2.97, 0, TAU, 96));                                                     // over the windows
  const wall = new THREE.Mesh(mergeGeometries(parts), wallIn); cabin.add(wall);
  // window frames: posts between the panes, all round
  const posts = [];
  for (let i = 0; i < 28; i++) { const a = i / 28 * TAU; if (Math.abs(Math.atan2(Math.sin(a - DOOR_T), Math.cos(a - DOOR_T))) < DOOR_A) continue; const b = new THREE.BoxGeometry(0.12, 0.62, 0.18); b.translate(0, 2.25, C.IN - 0.03); b.rotateY(a); posts.push(b); }
  for (const t of [SCREEN_T - SCREEN_A, SCREEN_T - SCREEN_A / 3, SCREEN_T + SCREEN_A / 3, SCREEN_T + SCREEN_A]) { const b = new THREE.BoxGeometry(0.14, 1.85, 0.2); b.translate(0, 1.64, C.IN - 0.03); b.rotateY(t); posts.push(b); }
  cabin.add(new THREE.Mesh(mergeGeometries(posts), dark));
  // a strip of light round the top of the wall
  const strip = new THREE.Mesh(new THREE.TorusGeometry(C.IN - 0.08, 0.05, 6, 96).rotateX(Math.PI / 2).translate(0, 2.9, 0), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.7, 1.6, 1.8) }));
  cabin.add(strip);
  // the console, under the screen, and its five pads
  const deskGeo = new THREE.CylinderGeometry(5.6, 5.6, 0.08, 32, 1, false, SCREEN_T - 0.55, 1.1); deskGeo.translate(0, 0.92, 0);
  const deskFront = new THREE.CylinderGeometry(4.9, 4.9, 0.9, 32, 1, true, SCREEN_T - 0.55, 1.1); deskFront.translate(0, 0.47, 0);
  cabin.add(new THREE.Mesh(mergeGeometries([deskGeo, deskFront]), std(0x2b3138, { roughness: 0.4, metalness: 0.6, side: THREE.DoubleSide })));
  const pads = MOTIF.map((n, i) => {
    const a = SCREEN_T - 0.34 + i * 0.17, m = new THREE.MeshBasicMaterial({ color: new THREE.Color(n.colour).multiplyScalar(0.55) });
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.03, 20), m); p.position.set(Math.sin(a) * 5.25, 0.975, Math.cos(a) * 5.25); cabin.add(p);
    return { mesh: p, base: new THREE.Color(n.colour) };
  });
  const light = new THREE.PointLight(0xdff4ff, 14, 16, 1.6); light.position.set(0, 3.4, 0.5); cabin.add(light);

  // where the art hangs: along the wall below the windows, both sides, away from the door and the screen
  const runs = [[SCREEN_T + SCREEN_A + 0.08, TAU + DOOR_T - DOOR_A - 0.1], [DOOR_T + DOOR_A + 0.1, SCREEN_T - SCREEN_A - 0.08]];
  const hangAt = n => {
    const total = runs.reduce((s, [a, b]) => s + (b - a), 0), out = [];
    for (let i = 0; i < n; i++) {
      let u = (i + 0.5) / n * total;
      for (const [a, b] of runs) { if (u <= b - a) { out.push(a + u); break; } u -= b - a; }
    }
    return out.map(t => ({ t, x: Math.sin(t) * (C.IN - 0.04), z: Math.cos(t) * (C.IN - 0.04), y: 1.08, rot: t + Math.PI, room: Math.min(1.9, total * C.IN / n - 0.35) }));
  };

  return {
    group: g, hull, cabin, lamps, legs: legParts, door, ramp, plank, pads, light, glass, port, hangAt,
    // 0: shut, 1: open and down to the ground
    setRamp(k) {
      const open = Math.min(1, k * 2), down = Math.max(0, k * 2 - 1);
      door.position.y = open * (C.DOOR_H + 0.2); door.visible = open < 0.98;
      plank.visible = k > 0.02; plank.scale.x = Math.max(0.02, down);
      ramp.rotation.z = -Math.asin(Math.min(1, C.LEG / C.RAMP)) * Math.min(1, down * 1.2);
    },
    // 0: folded up, 1: standing on them
    setLegs(k) { for (const l of legParts) { l.scale.y = 0.15 + 0.85 * k; l.children[1].visible = k > 0.05; } },
    // the lights chase round; the pads glow when `lit` names one
    animate(t, lit = -1, speed = 1) {
      const c = this._c || (this._c = new THREE.Color());
      for (let i = 0; i < N; i++) { const k = 0.5 + 0.5 * Math.sin(t * 5 * speed - i * 0.6); c.set(MOTIF[(i + Math.floor(t * 2)) % 5].colour).multiplyScalar(0.5 + 2.2 * k); lamps.setColorAt(i, c); }
      lamps.instanceColor.needsUpdate = true;
      pads.forEach((p, i) => p.mesh.material.color.copy(p.base).multiplyScalar(i === lit ? 2.4 : 0.45 + 0.15 * Math.sin(t * 2 + i)));
      port.material.color.setRGB(0.3 + 0.1 * Math.sin(t * 3), 1.8 + 0.4 * Math.sin(t * 3), 1.2);
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
