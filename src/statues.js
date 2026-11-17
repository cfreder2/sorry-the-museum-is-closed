// The sculpture and the fountains that stand outdoors, modelled in clay (see sculpt.js).
//
// Kemeys's two lions on Michigan Avenue; Taft's Fountain of the Great Lakes in the South Garden;
// in the North Garden Calder's Flying Dragon, Moore's Large Interior Form and David Smith's Cubi VII,
// and a tiered fountain; Milles's Fountain of the Tritons in the courtyard; and the arch of the
// Chicago Stock Exchange at the north-east corner. All from memory of the real things, not measured.
// It is winter: the water is off, there is snow on every shoulder and ice where the water ran.

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import * as TX from './textures.js';
import { Geo } from './geo.js';
import { Clay, cast } from './sculpt.js';

const VERD = { hi: 0x86d2bd, lo: 0x1c4a42 }, BRONZE = { hi: 0xb08a52, lo: 0x2a1c10 };

// ---------------------------------------------------------------- a figure --
// Built from where its joints are. Lengths in metres for someone about 1.75 tall; `s` scales the
// thicknesses for a child or a giant. Faces +z.
function figure(c, J, o = {}) {
  const s = o.s || 1, f = o.female, add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], mid = (a, b, t = 0.5) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const P = J.pelvis, C = J.chest, H = J.head, k = 0.07 * s;
  // trunk
  c.blob(P, [0.17 * s, 0.14 * s, 0.13 * s], { k }); c.limb(P, C, (f ? 0.115 : 0.13) * s, (f ? 0.15 : 0.175) * s, { k });
  c.blob(add(C, [0, 0.02, 0.01]), [(f ? 0.17 : 0.21) * s, 0.16 * s, 0.12 * s], { k });
  if (f) for (const sx of [-1, 1]) c.blob(add(C, [sx * 0.075 * s, 0.0, 0.1 * s]), 0.065 * s, { k: 0.04 * s });
  // neck and head
  const nk = mid(C, H, 0.45);
  c.limb(add(C, [0, 0.12 * s, 0]), mid(C, H, 0.8), 0.055 * s, 0.05 * s, { k: 0.04 * s });
  c.blob(H, [0.098 * s, 0.122 * s, 0.11 * s], { k: 0.03 * s });
  c.blob(add(H, [0, -0.045 * s, 0.07 * s]), [0.06 * s, 0.07 * s, 0.05 * s], { k: 0.04 * s });                  // the face brought forward: jaw and nose
  c.blob(add(H, [0, 0.0, 0.115 * s]), [0.016 * s, 0.03 * s, 0.02 * s], { k: 0.02 * s });
  if (o.hair !== false) { c.blob(add(H, [0, 0.03 * s, -0.035 * s]), [0.115 * s, 0.12 * s, 0.115 * s], { k: 0.03 * s }); if (f) c.blob(add(H, [0, -0.02 * s, -0.14 * s]), 0.07 * s, { k: 0.04 * s }); }
  void nk;
  // arms
  for (const sd of ['l', 'r']) {
    const sx = sd === 'l' ? -1 : 1, S = J[sd + 'S'] || add(C, [sx * (f ? 0.18 : 0.215) * s, 0.1 * s, 0]), El = J[sd + 'E'], Hd = J[sd + 'H'];
    c.blob(S, (f ? 0.062 : 0.08) * s, { k: 0.05 * s });
    c.limb(S, El, (f ? 0.05 : 0.062) * s, (f ? 0.042 : 0.05) * s, { k: 0.04 * s }); c.limb(El, Hd, (f ? 0.04 : 0.048) * s, (f ? 0.03 : 0.036) * s, { k: 0.035 * s });
    c.blob(Hd, [0.04 * s, 0.05 * s, 0.03 * s], { k: 0.03 * s });
  }
  // legs, and what is worn over them
  for (const sd of ['l', 'r']) {
    const sx = sd === 'l' ? -1 : 1, Hp = add(P, [sx * 0.09 * s, -0.03 * s, 0]), K = J[sd + 'K'], F = J[sd + 'F'];
    c.limb(Hp, K, (f ? 0.1 : 0.095) * s, 0.065 * s, { k: 0.06 * s }); c.limb(K, F, 0.06 * s, 0.042 * s, { k: 0.04 * s });
    c.blob(add(F, [0, -0.01 * s, 0.07 * s]), [0.045 * s, 0.035 * s, 0.1 * s], { k: 0.03 * s });
  }
  if (o.skirt) {
    // Drapery: cloth hung from the hips, pulled across the knees, pooling at the feet, with a few folds.
    const hem = mid(J.lF, J.rF), kn = mid(J.lK, J.rK);
    c.limb(P, kn, 0.19 * s, 0.2 * s, { k: 0.09 * s }); c.limb(kn, add(hem, [0, 0.05 * s, 0]), 0.19 * s, 0.24 * s, { k: 0.09 * s });
    for (let i = 0; i < 5; i++) { const a = -0.9 + i * 0.45, r = 0.2 * s; c.limb(add(kn, [Math.sin(a) * r, 0.12 * s, Math.cos(a) * r * 0.8]), add(hem, [Math.sin(a) * r * 1.3, 0.02, Math.cos(a) * r]), 0.03 * s, 0.045 * s, { k: 0.03 * s }); }
    c.limb(add(C, [-0.17 * s, 0.08 * s, 0.03]), add(P, [0.16 * s, 0.02, 0.06 * s]), 0.035 * s, 0.05 * s, { k: 0.04 * s });      // a fold across the body
  }
  return c;
}
// A scallop shell, held: a shallow dish, ribbed, hollowed from above.
function shell(c, at, r, tilt = 0) {
  c.blob(at, [r, r * 0.3, r * 0.92], { k: 0.04, rot: [tilt, 0, 0] });
  for (let i = -3; i <= 3; i++) c.limb([at[0] + i * r * 0.1, at[1] - r * 0.12, at[2] - r * 0.6], [at[0] + i * r * 0.27, at[1] - r * 0.02, at[2] + r * 0.78], r * 0.05, r * 0.07, { k: 0.02 });
  c.blob([at[0], at[1] + r * 0.3, at[2]], [r * 0.88, r * 0.36, r * 0.8], { cut: true, k: 0.03, rot: [tilt, 0, 0] });
}

// Ice: a row of icicles, long in the middle, hung from a line.
function icicleGeo(list) {
  const parts = [];
  for (const [x, y, z, w, len, ax] of list) {
    const n = Math.max(3, Math.round(w / 0.07));
    for (let i = 0; i < n; i++) {
      const t = n === 1 ? 0.5 : i / (n - 1), l = len * (0.35 + 0.65 * Math.sin(Math.PI * (0.15 + 0.7 * t))) * (0.7 + 0.3 * Math.abs(Math.sin(i * 12.9898 + x * 7))), r = 0.018 + 0.022 * Math.abs(Math.sin(i * 4.1 + z * 3));
      const g = new THREE.ConeGeometry(r, l, 5); g.rotateX(Math.PI); g.translate(x + (ax === 'x' ? (t - 0.5) * w : 0), y - l / 2, z + (ax === 'x' ? 0 : (t - 0.5) * w)); parts.push(g);
    }
  }
  return mergeGeometries(parts);
}

export function buildStatues(museum, plan) {
  const G = plan.grounds, group = museum.group;
  const std = o => new THREE.MeshStandardMaterial(o);
  const snowTex = museum.snowTex;
  const snow = std({ map: snowTex, roughness: 0.95, emissiveMap: snowTex, emissive: new THREE.Color(0.3, 0.36, 0.52), emissiveIntensity: 0.55 });
  const white = std({ color: 0xf2f5fb, roughness: 0.95, emissive: 0x596a8c, emissiveIntensity: 0.55 });
  const ice = std({ color: 0xcfe6f5, roughness: 0.08, transparent: true, opacity: 0.72, emissive: 0x6a94b4, emissiveIntensity: 0.8 });
  const stone = std({ color: 0xb3ab9c, roughness: 0.85, emissive: 0x3f4452, emissiveIntensity: 0.45, side: THREE.DoubleSide });
  const metal = cast(), dark = cast({ roughness: 0.45, metalness: 0.4 });
  const put = (g, geo, mat, x = 0, y = 0, z = 0, sx = 1, sy = sx, sz = sx) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.scale.set(sx, sy, sz); g.add(m); return m; };
  const cyl = new THREE.CylinderGeometry(1, 1, 1, 28), box = new THREE.BoxGeometry(1, 1, 1), ball = new THREE.SphereGeometry(1, 16, 12);
  // A basin: a low stone wall with a moulded rim, round or oval, snow where the water was.
  const basin = (g, rx, rz, h, cx = 0, cz = 0) => {
    const r = Math.max(rx, rz), w = 0.34;
    const prof = [[r + 0.1, 0], [r + 0.1, 0.1], [r + 0.02, 0.16], [r, h - 0.14], [r + 0.07, h - 0.09], [r + 0.07, h - 0.02], [r + 0.03, h], [r - w + 0.02, h], [r - w - 0.03, h - 0.03], [r - w - 0.03, h - 0.1], [r - w, h - 0.15], [r - w, 0.1]].map(([a, b]) => new THREE.Vector2(a, b));
    const wall = put(g, new THREE.LatheGeometry(prof, 48), stone, cx, 0, cz); wall.scale.set(rx / r, 1, rz / r);
    put(g, cyl, snow, cx, 0.12, cz, (r - w) * rx / r, 0.24, (r - w) * rz / r);
    for (let i = 0; i < 14; i++) { const a = i * 0.449 + 0.3; put(g, ball, white, cx + Math.cos(a) * (rx - w / 2), h + 0.005, cz + Math.sin(a) * (rz - w / 2), 0.13 + (i % 3) * 0.05, 0.045, 0.12 + (i % 2) * 0.06); }      // snow lying along the rim
  };
  const board = (x, z, yaw) => {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = yaw;
    put(g, box, std({ color: 0x3a2a1c, roughness: 0.9, emissive: 0x16100a, emissiveIntensity: 0.6 }), 0, 0.33, -0.02, 0.035, 0.66, 0.035);
    put(g, new THREE.PlaneGeometry(0.72, 0.36), new THREE.MeshBasicMaterial({ map: TX.notice(['Fountain off', 'for the winter']), color: new THREE.Color(0.6, 0.58, 0.54), side: THREE.DoubleSide }), 0, 0.72, 0);
    group.add(g);
  };

  // ------------------------------------------------------------------ the lions
  // Kemeys made them a pair but not twins: the one to the south stands with its head up, "in an
  // attitude of defiance"; the one to the north is "on the prowl", head lower and turned, one paw forward.
  const lion = (prowl) => {
    const c = new Clay([-0.85, 0, -1.9], [0.85, 2.55, 2.25], 0.04); c.k = 0.1;
    const turn = prowl ? 0.42 : -0.12, drop = prowl ? -0.14 : 0.04, reach = prowl ? 0.12 : 0;
    // Everything from the neck forward swings about the shoulders.
    const hd = (x, y, z) => { const px = x, pz = z - 0.9, cs = Math.cos(turn), sn = Math.sin(turn); return [px * cs + pz * sn, y + drop * Math.min(1, pz / 0.9), 0.9 - px * sn + pz * cs + reach * Math.min(1, pz / 0.9)]; };
    // trunk: deep through the chest, drawn up behind the ribs, strong over the haunch
    c.blob([0, 1.3, 0.55], [0.4, 0.5, 0.56]); c.blob([0, 1.3, -0.05], [0.36, 0.4, 0.6]); c.blob([0, 1.28, -0.68], [0.39, 0.46, 0.5]);
    c.limb([0, 1.6, 0.6], [0, 1.58, -0.8], 0.2, 0.2); c.blob([0, 0.98, 0.5], [0.3, 0.2, 0.4]);
    for (const sx of [-1, 1]) {
      const fwd = prowl && sx > 0 ? 0.24 : 0;
      // foreleg: shoulder, elbow, a straight cannon, a broad paw with toes
      c.blob([sx * 0.3, 1.32, 0.66], [0.2, 0.34, 0.3]);
      c.limb([sx * 0.31, 1.15, 0.64], [sx * 0.31, 0.74, 0.56 + fwd * 0.5], 0.17, 0.12); c.limb([sx * 0.31, 0.74, 0.56 + fwd * 0.5], [sx * 0.31, 0.24, 0.62 + fwd], 0.115, 0.09);
      c.blob([sx * 0.31, 0.1, 0.74 + fwd], [0.14, 0.1, 0.21], { k: 0.05 });
      for (let t = -1; t <= 1; t++) c.blob([sx * 0.31 + t * 0.075, 0.07, 0.9 + fwd], [0.04, 0.05, 0.06], { k: 0.025 });
      // hind leg: thigh, stifle, hock well back, paw under
      c.blob([sx * 0.27, 1.2, -0.72], [0.22, 0.42, 0.36]);
      c.limb([sx * 0.29, 1.05, -0.62], [sx * 0.3, 0.7, -0.46], 0.2, 0.14); c.limb([sx * 0.3, 0.7, -0.46], [sx * 0.29, 0.42, -0.94], 0.12, 0.075); c.limb([sx * 0.29, 0.42, -0.94], [sx * 0.29, 0.13, -0.84], 0.07, 0.075);
      c.blob([sx * 0.29, 0.1, -0.74], [0.13, 0.1, 0.2], { k: 0.05 });
      for (let t = -1; t <= 1; t++) c.blob([sx * 0.29 + t * 0.07, 0.07, -0.58], [0.038, 0.05, 0.055], { k: 0.025 });
    }
    // neck, and the mane, which is most of a lion: built in locks
    c.limb(hd(0, 1.62, 0.92), hd(0, 2.0, 1.36), 0.3, 0.25);
    c.blob(hd(0, 1.82, 1.05), [0.5, 0.55, 0.46]); c.blob(hd(0, 1.42, 1.12), [0.4, 0.42, 0.34]); c.blob(hd(0, 2.08, 1.24), [0.4, 0.34, 0.36]); c.blob([0, 1.72, 0.6], [0.4, 0.34, 0.34]);
    for (let i = 0; i < 64; i++) {
      const a = i * 2.399, v = ((i * 0.618) % 1), y = 1.2 + v * 1.0, rr = 0.36 + 0.16 * Math.sin(v * Math.PI), z = 0.75 + 0.6 * ((i * 0.381) % 1);
      const p = hd(Math.cos(a) * rr * 1.08, y + Math.sin(a) * 0.05, z), q = hd(Math.cos(a) * rr * 1.12, y - 0.2, z - 0.07);
      if (p[2] > 1.42 && Math.abs(p[0]) < 0.2 && p[1] > 1.75) continue;                 // keep the face clear
      c.limb(p, q, 0.075, 0.035, { k: 0.035 });
    }
    // head: broad across the brow, a long square muzzle, small ears set back in the mane
    c.blob(hd(0, 2.1, 1.56), [0.24, 0.23, 0.26], { k: 0.06 }); c.blob(hd(0, 2.0, 1.83), [0.155, 0.13, 0.2], { k: 0.06 });
    c.blob(hd(0, 1.86, 1.76), [0.12, 0.075, 0.17], { k: 0.04 }); c.blob(hd(0, 2.04, 2.0), [0.075, 0.055, 0.06], { k: 0.03 });
    for (const sx of [-1, 1]) {
      c.blob(hd(sx * 0.11, 2.2, 1.7), [0.075, 0.05, 0.08], { k: 0.04 });                  // brow
      c.blob(hd(sx * 0.1, 1.95, 1.92), [0.075, 0.07, 0.085], { k: 0.035 });               // the pads the whiskers grow from
      c.blob(hd(sx * 0.2, 2.31, 1.42), [0.07, 0.085, 0.045], { k: 0.03 });                // ear
      c.blob(hd(sx * 0.105, 2.13, 1.77), 0.034, { cut: true, k: 0.02 });                  // eye
      c.blob(hd(sx * 0.03, 2.03, 2.05), 0.014, { cut: true, k: 0.01 });                   // nostril
    }
    c.slab(hd(0, 1.915, 1.9), [0.13, 0.012, 0.14], 0.01, { cut: true, k: 0.02, rot: [0.12, -turn, 0] });   // the mouth, a little open
    // tail: out, down, and curling up at the tuft
    const tp = [[0, 1.5, -1.08], [0, 1.22, -1.46], [0, 0.82, -1.62], [0.03, 0.56, -1.56], [0.08, 0.5, -1.4]];
    for (let i = 0; i < tp.length - 1; i++) c.limb(tp[i], tp[i + 1], 0.075 - i * 0.008, 0.067 - i * 0.008, { k: 0.04 });
    c.blob([0.1, 0.5, -1.33], [0.09, 0.1, 0.14], { k: 0.04 });
    return c.mesh({ ...VERD, snow: 0.8, reach: 0.3 });
  };
  const block = std({ color: 0xa9a294, roughness: 0.85, emissive: 0x3a3f4d, emissiveIntensity: 0.42 });
  const fir = std({ color: 0x1f5a30, roughness: 0.9, emissive: 0x0e2a16, emissiveIntensity: 0.9, flatShading: true }), bow = std({ color: 0xc8261c, roughness: 0.7, emissive: 0x6a100a, emissiveIntensity: 0.8 });
  plan.lions.forEach((l, i) => {
    const g = new THREE.Group(), B = 1.1, prowl = l.z < plan.facade.cz;          // north of the door
    put(g, box, block, 0, B / 2, 0.1, 1.55, B, 4.2); put(g, box, block, 0, B + 0.04, 0.1, 1.38, 0.1, 3.95); put(g, box, block, 0, 0.09, 0.1, 1.75, 0.18, 4.4);
    put(g, lion(prowl), metal, 0, B + 0.08, 0);
    // The wreath it is given every December, hung round its neck.
    const w = new THREE.Group(), t = prowl ? 0.42 : -0.12;
    put(w, new THREE.TorusGeometry(0.62, 0.14, 7, 20), fir).rotation.x = 0.0;
    for (let k = 0; k < 9; k++) { const a = k * 0.7; put(w, ball, bow, Math.cos(a) * 0.62, Math.sin(a) * 0.62, 0.12, 0.045); }
    put(w, box, bow, 0, -0.62, 0.15, 0.4, 0.18, 0.07); for (const sx of [-1, 1]) put(w, box, bow, sx * 0.12, -0.9, 0.15, 0.12, 0.4, 0.05).rotation.z = sx * 0.25;
    w.position.set(Math.sin(t) * 0.52, B + 1.55 + (prowl ? -0.1 : 0.05), 0.9 + Math.cos(t) * 0.52); w.rotation.set(-0.5, t, 0);
    g.add(w);
    g.position.set(l.x, 0, l.z); g.rotation.y = -Math.PI / 2;        // facing the avenue
    group.add(g); void i;
  });

  // ------------------------------------------------------- the Fountain of the Great Lakes
  // Five women on a pile of rock, each a lake, the water falling from shell to shell as it does
  // from lake to lake: Superior at the top, Michigan and Huron below her, then Erie, and Ontario at
  // the foot looking out after it on its way to the sea. The front faces west.
  {
    const f = G.fountain, fg = new THREE.Group(); fg.position.set(f.x, 0, f.z);
    basin(fg, 3.6, 4.2, 0.9, -0.2, 0);
    // the rock
    const r = new Clay([-0.9, 0.3, -2.7], [3.1, 4.5, 2.7], 0.085); r.k = 0.3;
    r.blob([1.35, 1.1, 0], [1.55, 1.1, 2.3]); r.blob([1.6, 2.2, 0], [1.2, 1.0, 1.7]); r.blob([1.95, 3.1, 0], [0.9, 0.85, 1.0]);
    r.blob([0.45, 1.5, -1.25], [0.7, 0.55, 0.7], { k: 0.2 }); r.blob([0.45, 1.5, 1.2], [0.7, 0.55, 0.7], { k: 0.2 }); r.blob([1.25, 2.55, -0.95], [0.6, 0.5, 0.6], { k: 0.2 }); r.blob([1.2, 2.55, 0.95], [0.6, 0.5, 0.6], { k: 0.2 });
    const rn = TX.rng(77);
    for (let i = 0; i < 46; i++) { const a = rn() * 6.28, y = 0.6 + rn() * 2.9, rad = (1.5 - y * 0.3) * (0.75 + rn() * 0.3); r.blob([1.5 + Math.cos(a) * rad, y, Math.sin(a) * rad * 1.35], [0.2 + rn() * 0.22, 0.14 + rn() * 0.16, 0.2 + rn() * 0.22], { k: 0.09, rot: [rn(), rn() * 3, rn()] }); }
    put(fg, r.mesh({ hi: 0x6fa898, lo: 0x173a34, snow: 0.74, reach: 0.4 }), metal);
    // the five lakes: [where she sits, which way she faces, her pose]
    const stand = { pelvis: [0, 0.98, 0], chest: [0, 1.33, 0.02], head: [0, 1.69, 0.05], lE: [-0.3, 1.2, 0.12], rE: [0.3, 1.2, 0.12], lH: [-0.16, 1.24, 0.36], rH: [0.16, 1.24, 0.36], lK: [-0.09, 0.52, 0.06], rK: [0.09, 0.52, 0.03], lF: [-0.1, 0.04, 0.02], rF: [0.1, 0.04, -0.04] };
    const sit = (side) => ({ pelvis: [0, 0.5, 0], chest: [0.02 * side, 0.86, 0.06], head: [0.05 * side, 1.22, 0.12], lE: [-0.3, 0.72, 0.16], rE: [0.3, 0.72, 0.16], lH: [-0.2, 0.62, 0.4], rH: [0.2, 0.62, 0.4], lK: [-0.13, 0.52, 0.42], rK: [0.13, 0.52, 0.42], lF: [-0.13, 0.04, 0.52], rF: [0.14, 0.04, 0.46] });
    const lean = { pelvis: [0, 0.46, 0], chest: [0.04, 0.78, 0.2], head: [0.06, 1.08, 0.42], lE: [-0.3, 0.52, 0.3], lH: [-0.34, 0.3, 0.42], rE: [0.24, 0.84, 0.56], rH: [0.26, 0.92, 0.94], lK: [-0.2, 0.34, 0.36], rK: [0.1, 0.42, 0.4], lF: [-0.36, 0.06, 0.02], rF: [0.16, 0.05, 0.62] };
    const lakes = [
      { at: [1.95, 3.86, 0], yaw: -Math.PI / 2, J: stand, cup: [0, 1.2, 0.5], r: 0.34 },               // Superior
      { at: [1.3, 2.98, -0.98], yaw: -Math.PI / 2 - 0.5, J: sit(1), cup: [0, 0.6, 0.5], r: 0.33 },     // Michigan
      { at: [1.25, 2.98, 0.98], yaw: -Math.PI / 2 + 0.5, J: sit(-1), cup: [0, 0.6, 0.5], r: 0.33 },    // Huron
      { at: [0.55, 1.96, -1.3], yaw: -Math.PI / 2 - 0.3, J: sit(-1), cup: [0, 0.6, 0.5], r: 0.36 },    // Erie
      { at: [0.55, 1.96, 1.24], yaw: -Math.PI / 2 + 0.25, J: lean, cup: [-0.3, 0.3, 0.55], r: 0.36 },  // Ontario
    ];
    const falls = [];
    for (const L of lakes) {
      const c = new Clay([-0.75, -0.05, -0.55], [0.75, 1.95, 1.2], 0.03);
      figure(c, L.J, { female: true, skirt: true, s: 1.12 });
      shell(c, L.cup, L.r, 0.22);
      const m = put(fg, c.mesh({ ...VERD, snow: 0.82, reach: 0.2 }), metal, L.at[0], L.at[1], L.at[2], 1.25); m.rotation.y = L.yaw;
      // Ice hanging from the lip of each shell, where the water left off.
      const lx = L.at[0] + (Math.sin(L.yaw) * (L.cup[2] + L.r * 0.8) + Math.cos(L.yaw) * L.cup[0]) * 1.25, lz = L.at[2] + (Math.cos(L.yaw) * (L.cup[2] + L.r * 0.8) - Math.sin(L.yaw) * L.cup[0]) * 1.25;
      falls.push([lx, L.at[1] + L.cup[1] * 1.25 - 0.02, lz, L.r * 1.7, 0.7, 'z']);
    }
    // And the two boys with fish, either end of the basin wall.
    for (const sgn of [-1, 1]) {
      put(fg, box, stone, 0.3, 1.1, sgn * 3.7, 1.0, 0.5, 0.95); put(fg, box, stone, 0.3, 0.45, sgn * 3.7, 1.15, 0.9, 1.1);
      const c = new Clay([-0.5, -0.05, -0.45], [0.5, 1.2, 0.6], 0.028);
      figure(c, { pelvis: [0, 0.34, 0], chest: [0, 0.58, 0.05], head: [0, 0.84, 0.1], lE: [-0.2, 0.5, 0.16], rE: [0.2, 0.5, 0.16], lH: [-0.1, 0.46, 0.3], rH: [0.1, 0.46, 0.3], lK: [-0.1, 0.34, 0.26], rK: [0.1, 0.34, 0.26], lF: [-0.1, 0.03, 0.3], rF: [0.1, 0.03, 0.3] }, { s: 0.72, hair: true });
      c.blob([0, 0.5, 0.36], [0.07, 0.2, 0.09], { k: 0.04, rot: [0.5, 0, 0] }); c.blob([0, 0.72, 0.46], [0.1, 0.05, 0.03], { k: 0.03 });      // the fish, and its tail
      const m = put(fg, c.mesh({ ...VERD, snow: 0.82, reach: 0.16 }), metal, 0.3, 1.36, sgn * 3.7, 1.35); m.rotation.y = -Math.PI / 2;
      falls.push([-0.35, 1.9, sgn * 3.7, 0.3, 0.5, 'z']);
    }
    put(fg, icicleGeo(falls), ice);
    // Frozen where it fell: a skin of ice down the face of the rock under each shell.
    for (const [x, y, z, len] of [[1.25, 3.5, 0, 1.0], [0.72, 2.6, -0.8, 0.9], [0.7, 2.6, 0.8, 0.9], [-0.05, 1.7, -1.1, 0.95], [-0.05, 1.7, 1.05, 0.95]]) { const m = put(fg, ball, ice, x, y - len / 2, z, 0.1, len / 2, 0.3); m.rotation.z = 0.25; }
    group.add(fg);
    board(f.x - 4.6, f.z + 5.0, -Math.PI / 4);
  }

  // ------------------------------------------------------- the Fountain of the Tritons
  // Milles: sea-men, half risen from the water, each lifting a great shell over his head for the
  // water to spill from. A round basin, a carved drum in the middle.
  for (const f of G.fountains) {
    const g = new THREE.Group(); g.position.set(f.x, 0, f.z);
    if (f.kind === 'triton') {
      basin(g, f.r, f.r, 0.6);
      const drum = new THREE.LatheGeometry([[0, 0], [0.95, 0], [0.95, 0.16], [0.8, 0.22], [0.76, 0.7], [0.86, 0.78], [0.86, 0.88], [0.7, 0.94], [0, 0.94]].map(([a, b]) => new THREE.Vector2(a, b)), 32);
      put(g, drum, stone, 0, 0.1, 0);
      const c = new Clay([-0.85, -0.05, -0.75], [0.85, 2.35, 0.8], 0.03);
      figure(c, { pelvis: [0, 0.62, 0], chest: [0, 1.0, 0.02], head: [0, 1.36, 0.06], lE: [-0.36, 1.36, 0.02], rE: [0.36, 1.36, 0.02], lH: [-0.3, 1.74, 0.02], rH: [0.3, 1.74, 0.02], lK: [-0.16, 0.6, 0.42], lF: [-0.16, 0.06, 0.46], rK: [0.17, 0.1, 0.22], rF: [0.17, 0.06, -0.34] }, { s: 1.08 });
      c.limb([0.17, 0.08, -0.34], [0.0, 0.1, -0.62], 0.07, 0.03, { k: 0.05 }); c.blob([0, 0.14, -0.66], [0.2, 0.03, 0.1], { k: 0.04 });        // the leg behind ends in a fin
      shell(c, [0, 1.92, 0.0], 0.62, 0);
      const tri = c.mesh({ ...VERD, snow: 0.82, reach: 0.2 }), falls = [];
      for (let i = 0; i < 3; i++) {
        const a = i * 2.0944 + 0.5, x = Math.sin(a) * 1.5, z = Math.cos(a) * 1.5;
        put(g, tri, metal, x, 0.2, z, 1.3).rotation.y = a;
        for (let k = 0; k < 4; k++) { const b = a + k * 1.5708 + 0.4; falls.push([x + Math.sin(b) * 0.7, 0.2 + 1.9 * 1.3, z + Math.cos(b) * 0.7, 0.5, 0.55, Math.abs(Math.sin(b)) > 0.7 ? 'z' : 'x']); }
      }
      // the jet in the middle, stopped as it stood
      put(g, new THREE.ConeGeometry(0.16, 1.5, 8), ice, 0, 1.8, 0); put(g, ball, ice, 0, 1.12, 0, 0.42, 0.14, 0.42);
      put(g, icicleGeo(falls), ice);
      board(f.x + 0.4, f.z - f.r - 0.8, Math.PI);
    } else {
      // The North Garden's fountain: three bowls on a baluster, each smaller than the one under it.
      basin(g, f.r, f.r, 0.5);
      const P = a => a.map(([x, y]) => new THREE.Vector2(x, y));
      put(g, new THREE.LatheGeometry(P([[0, 0], [0.42, 0], [0.42, 0.12], [0.3, 0.2], [0.2, 0.5], [0.26, 0.62], [0.16, 0.74], [0.14, 1.0], [0.2, 1.06], [0, 1.06]]), 24), stone, 0, 0.1, 0);
      const bowl = (y, r, d) => {
        put(g, new THREE.LatheGeometry(P([[0.14, 0], [r * 0.5, d * 0.25], [r * 0.9, d * 0.8], [r, d], [r + 0.03, d + 0.04], [r - 0.03, d + 0.06], [r * 0.85, d * 0.86], [r * 0.4, d * 0.42], [0, d * 0.35]]), 36), stone, 0, y, 0);
        for (let i = 0; i < 16; i++) { const a = i / 16 * 6.283; put(g, ball, stone, Math.cos(a) * r * 0.72, y + d * 0.55, Math.sin(a) * r * 0.72, r * 0.11, d * 0.34, r * 0.07).rotation.y = -a; }     // fluting
        put(g, ball, white, 0, y + d + 0.02, 0, r * 0.84, 0.09, r * 0.84);
        return [0, y + d + 0.02, 0, r];
      };
      const tiers = [bowl(1.14, 1.15, 0.36), bowl(1.9, 0.72, 0.26), bowl(2.42, 0.42, 0.18)], falls = [];
      put(g, new THREE.LatheGeometry(P([[0, 0], [0.12, 0], [0.09, 0.5], [0.14, 0.56], [0, 0.6]]), 16), stone, 0, 1.4, 0); put(g, new THREE.LatheGeometry(P([[0, 0], [0.1, 0], [0.07, 0.34], [0.11, 0.4], [0, 0.44]]), 16), stone, 0, 2.1, 0);
      put(g, new THREE.LatheGeometry(P([[0, 0], [0.07, 0], [0.05, 0.2], [0.1, 0.3], [0.04, 0.46], [0, 0.5]]), 16), stone, 0, 2.56, 0);
      for (const [, y, , r] of tiers) for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283 + r; falls.push([Math.cos(a) * r, y - 0.04, Math.sin(a) * r, r * 0.6, 0.3 + r * 0.25, Math.abs(Math.cos(a)) > 0.7 ? 'z' : 'x']); }
      put(g, icicleGeo(falls), ice);
      board(f.x + f.r + 0.9, f.z + f.r + 0.4, Math.PI / 4);
    }
    group.add(g);
  }

  // ------------------------------------------------------- Calder, Flying Dragon
  // A stabile: plates of steel cut to curves and bolted together, painted Calder's red, standing on
  // three points. A long back that rises to a head, two wings, a tail.
  {
    const red = std({ color: 0xd0281c, roughness: 0.55, metalness: 0.1, emissive: 0x7a120a, emissiveIntensity: 0.75 });
    const plate = (pts, t = 0.06) => {
      const s = new THREE.Shape(); s.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) { const p = pts[i]; if (p.length === 4) s.quadraticCurveTo(p[0], p[1], p[2], p[3]); else s.lineTo(p[0], p[1]); }
      const g = new THREE.ExtrudeGeometry(s, { depth: t, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 1, curveSegments: 16 }); g.translate(0, 0, -t / 2); return g;
    };
    const cg = new THREE.Group(); cg.position.set(G.calder.x, 0, G.calder.z); cg.rotation.y = 0.5;
    // the back: nose down at one end on a point, sweeping up to the head
    put(cg, plate([[-3.4, 0], [-2.2, 2.2, 0.2, 2.6], [1.8, 2.9, 3.3, 4.5], [3.0, 3.3, 2.3, 2.7], [1.0, 1.9, -0.6, 1.7], [-2.2, 1.5, -3.1, 0], [-3.4, 0]]), red);
    // two wings crossing it, each coming down to a foot
    const w1 = put(cg, plate([[0, 0], [0.5, 1.6, 2.6, 2.6], [1.9, 2.9, 0.4, 3.3], [-0.5, 2.9, -0.9, 2.1], [-0.2, 1.2, -0.3, 0], [0, 0]]), red, 0.6, 0, 0.0); w1.rotation.y = 1.25; w1.position.set(0.5, 0, 1.6); w1.rotation.z = 0;
    const w2 = put(cg, plate([[0, 0], [0.4, 1.5, 2.2, 2.3], [1.6, 2.7, 0.3, 3.0], [-0.5, 2.6, -0.8, 1.9], [-0.2, 1.1, -0.28, 0], [0, 0]]), red); w2.rotation.y = -1.35; w2.position.set(-0.2, 0, -1.5);
    // a fin on the back and the tail blade
    const fin = put(cg, plate([[0, 0], [0.5, 0.9, 1.5, 1.3], [0.9, 0.4, 0.9, 0], [0, 0]]), red, -0.6, 2.2, 0); fin.rotation.y = 0.9;
    const tail = put(cg, plate([[0, 0], [-0.9, 0.4, -1.7, 1.5], [-1.2, 0.2, -0.5, -0.5], [0, 0]]), red, -2.4, 1.5, 0); tail.rotation.y = -0.5;
    for (const [x, y, z] of [[0.45, 2.3, 0.1], [-0.3, 2.15, -0.1], [-0.9, 2.05, 0.05], [1.2, 2.5, 0.05]]) put(cg, cyl, red, x, y, z, 0.035, 0.16, 0.035).rotation.x = Math.PI / 2;      // bolts
    put(cg, cyl, white, -0.2, 0.02, 0, 3.3, 0.04, 2.2);
    group.add(cg);
  }

  // ------------------------------------------------------- Moore and Smith, and the arch
  for (const s of G.sculpt) {
    const g = new THREE.Group(); g.position.set(s.x, 0, s.z);
    if (s.kind === 'moore') {
      // Large Interior Form: an upright that swells and pinches like a bone, pierced right through twice.
      put(g, box, block, 0, 0.14, 0, 1.7, 0.28, 1.7);
      const c = new Clay([-0.95, 0.2, -0.65], [0.95, 5.35, 0.65], 0.045); c.k = 0.22;
      c.blob([0, 0.85, 0], [0.4, 0.75, 0.33]); c.blob([-0.06, 1.55, 0], [0.3, 0.5, 0.27]); c.blob([0.06, 2.45, 0], [0.62, 0.95, 0.36]);
      c.blob([-0.08, 3.5, 0], [0.4, 0.6, 0.3]); c.blob([0.02, 4.3, 0], [0.5, 0.62, 0.33]); c.blob([0.1, 4.95, 0], [0.26, 0.3, 0.24]);
      c.blob([0.12, 2.5, 0], [0.3, 0.6, 0.7], { cut: true, k: 0.1 }); c.blob([-0.02, 4.28, 0], [0.19, 0.3, 0.7], { cut: true, k: 0.08 });
      c.blob([0.62, 3.55, 0], [0.34, 0.4, 0.7], { cut: true, k: 0.12 }); c.blob([-0.66, 1.6, 0], [0.3, 0.42, 0.7], { cut: true, k: 0.12 }); c.blob([0.42, 5.1, 0], 0.17, { cut: true, k: 0.08 });
      put(g, c.mesh({ ...BRONZE, snow: 0.8, reach: 0.4 }), dark, 0, 0.1, 0).rotation.y = 0.5;
    } else if (s.kind === 'cubi') {
      // Cubi VII: boxes of stainless steel welded corner to edge, every face ground in swirls so that it throws the light back.
      const cv = document.createElement('canvas'); cv.width = cv.height = 256; const x = cv.getContext('2d'), rn = TX.rng(5);
      x.fillStyle = '#b9c1c9'; x.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 900; i++) { x.strokeStyle = rn() > 0.5 ? `rgba(255,255,255,${0.1 + rn() * 0.3})` : `rgba(70,80,95,${0.08 + rn() * 0.22})`; x.lineWidth = 1 + rn() * 2; x.beginPath(); x.arc(rn() * 256, rn() * 256, 6 + rn() * 22, rn() * 6.28, rn() * 6.28 + 1 + rn() * 2.5); x.stroke(); }
      const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace;
      const steel = std({ map: t, roughness: 0.32, metalness: 0.7, emissiveMap: t, emissive: 0x8a96a6, emissiveIntensity: 0.6 });
      const part = (w, h, d, px, py, pz, rz = 0, ry = 0) => { const m = put(g, box, steel, px, py, pz, w, h, d); m.rotation.set(0, ry, rz); return m; };
      part(1.15, 0.14, 0.9, 0, 0.07, 0);
      part(0.34, 1.05, 0.34, -0.22, 0.66, 0); part(0.34, 0.8, 0.34, 0.26, 0.54, 0.02);                    // two legs
      part(1.3, 0.36, 0.36, 0.02, 1.36, 0, 0.06);                                                         // the beam across them
      part(0.5, 0.5, 0.36, -0.42, 1.92, 0, 0.785); part(0.42, 0.95, 0.36, 0.3, 2.04, 0, -0.3);            // a cube on its corner, a slab leaning
      part(0.85, 0.3, 0.36, -0.08, 2.62, 0, 0.2); part(0.36, 0.36, 0.36, 0.38, 2.98, 0, 0.785);
      part(0.3, 0.62, 0.36, -0.3, 3.1, 0, -0.12);
      for (const [px, py, w, rz] of [[-0.08, 2.79, 0.8, 0.2], [0.02, 1.56, 1.25, 0.06], [-0.3, 3.43, 0.28, -0.12]]) part(w, 0.05, 0.3, px, py, 0, rz).material = white;
    } else if (s.kind === 'arch') {
      // The entrance arch of Adler and Sullivan's Stock Exchange, set up on its own when the building
      // came down: a block of buff terracotta, every inch of it ornament, with one great round opening.
      const cv = document.createElement('canvas'); cv.width = cv.height = 512; const x = cv.getContext('2d'), rn = TX.rng(31);
      x.fillStyle = '#c99c6a'; x.fillRect(0, 0, 512, 512);
      for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) {                                              // Sullivan's ornament, near enough: rosettes in squares, leafwork between
        const cx = i * 128 + 64, cy = j * 128 + 64;
        x.strokeStyle = 'rgba(70,40,18,0.55)'; x.lineWidth = 3; x.strokeRect(cx - 58, cy - 58, 116, 116);
        for (let p = 0; p < 12; p++) { const a = p / 12 * 6.283; x.fillStyle = p % 2 ? 'rgba(96,58,28,0.5)' : 'rgba(238,206,160,0.5)'; x.beginPath(); x.ellipse(cx + Math.cos(a) * 28, cy + Math.sin(a) * 28, 20, 8, a, 0, 6.283); x.fill(); }
        x.fillStyle = 'rgba(84,50,24,0.7)'; x.beginPath(); x.arc(cx, cy, 11, 0, 6.283); x.fill();
        for (let p = 0; p < 4; p++) { const a = p * 1.5708 + 0.785; x.strokeStyle = 'rgba(240,212,170,0.55)'; x.lineWidth = 4; x.beginPath(); x.arc(cx + Math.cos(a) * 50, cy + Math.sin(a) * 50, 14, a + 2, a + 4.3); x.stroke(); }
      }
      for (let i = 0; i < 2500; i++) { x.fillStyle = rn() > 0.5 ? 'rgba(255,235,200,0.07)' : 'rgba(60,34,14,0.08)'; x.fillRect(rn() * 512, rn() * 512, 2 + rn() * 4, 2 + rn() * 4); }
      const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
      const terra = std({ map: t, roughness: 0.85, emissiveMap: t, emissive: 0xa08060, emissiveIntensity: 0.55, side: THREE.DoubleSide }), trimM = std({ color: 0xb98a5c, roughness: 0.85, emissive: 0x6a4424, emissiveIntensity: 0.6 }), deep = std({ color: 0x8a6038, roughness: 0.9, emissive: 0x3e2812, emissiveIntensity: 0.6 });
      const a = new Geo(), tr = new Geo(), dp = new Geo(), X = 0.75, sp = 2.3, R = s.open, n = 20, U = 1.6;
      const fz = (x0, y0, y1, z0, z1, nx) => a.quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [nx, 0, 0], [[z0 / U, y0 / U], [z1 / U, y0 / U], [z1 / U, y1 / U], [z0 / U, y1 / U]]);
      for (const [x0, nx] of [[-X, -1], [X, 1]]) { fz(x0, 0, s.h, -s.half, -R, nx); fz(x0, 0, s.h, R, s.half, nx); fz(x0, sp + R, s.h, -R, R, nx); }
      for (const [z0, nz] of [[-s.half, -1], [s.half, 1]]) a.quad([-X, 0, z0], [X, 0, z0], [X, s.h, z0], [-X, s.h, z0], [0, 0, nz], [[0, 0], [2 * X / U, 0], [2 * X / U, s.h / U], [0, s.h / U]]);
      a.quad([-X, s.h, -s.half], [X, s.h, -s.half], [X, s.h, s.half], [-X, s.h, s.half], [0, 1, 0]);
      for (const z0 of [-R, R]) a.quad([-X, 0, z0], [X, 0, z0], [X, sp, z0], [-X, sp, z0], [0, 0, z0 < 0 ? 1 : -1], [[0, 0], [2 * X / U, 0], [2 * X / U, sp / U], [0, sp / U]]);
      for (let i = 0; i < n; i++) {
        const a0 = Math.PI * i / n, a1 = Math.PI * (i + 1) / n, c0 = Math.cos(a0), c1 = Math.cos(a1), s0 = Math.sin(a0), s1 = Math.sin(a1);
        for (const [x0, nx] of [[-X, -1], [X, 1]]) a.quad([x0, sp + R * s0, R * c0], [x0, sp + R * s1, R * c1], [x0, sp + R, R * c1], [x0, sp + R, R * c0], [nx, 0, 0], [[R * c0 / U, (sp + R * s0) / U], [R * c1 / U, (sp + R * s1) / U], [R * c1 / U, (sp + R) / U], [R * c0 / U, (sp + R) / U]]);
        a.quad([-X, sp + R * s0, R * c0], [X, sp + R * s0, R * c0], [X, sp + R * s1, R * c1], [-X, sp + R * s1, R * c1], [0, -1, 0], [[0, i / 3], [1, i / 3], [1, (i + 1) / 3], [0, (i + 1) / 3]]);
        // three bands of moulding round the opening, stepping out from it
        for (let b = 0; b < 3; b++) { const rr = R + 0.14 + b * 0.3, am = (a0 + a1) / 2, zc = rr * Math.cos(am), yc = sp + rr * Math.sin(am), hw = Math.PI * rr / n / 2 + 0.01; (b === 1 ? dp : tr).box(-X - 0.16 + b * 0.05, X + 0.16 - b * 0.05, yc - hw, yc + hw, zc - hw, zc + hw); }
      }
      tr.box(-X - 0.22, X + 0.22, s.h - 0.34, s.h, -s.half - 0.22, s.half + 0.22); tr.box(-X - 0.12, X + 0.12, s.h - 0.62, s.h - 0.34, -s.half - 0.12, s.half + 0.12);
      for (let z = -s.half + 0.2; z < s.half; z += 0.46) dp.box(-X - 0.17, X + 0.17, s.h - 0.82, s.h - 0.62, z, z + 0.22);         // a row of brackets under the cornice
      tr.box(-X - 0.1, X + 0.1, 0, 0.6, -s.half - 0.1, -R); tr.box(-X - 0.1, X + 0.1, 0, 0.6, R, s.half + 0.1);
      for (const [z0, z1] of [[-s.half, -R], [R, s.half]]) tr.box(-X - 0.07, X + 0.07, sp - 0.26, sp, z0, z1);
      g.add(a.mesh(terra), tr.mesh(trimM), dp.mesh(deep));
      for (const zz of [-1, 1]) for (const xx of [-1, 1]) { const m = put(g, cyl, trimM, xx * (X + 0.04), sp + R + 1.3, zz * (R + 1.5), 0.62, 0.12, 0.62); m.rotation.z = Math.PI / 2; const m2 = put(g, cyl, deep, xx * (X + 0.09), sp + R + 1.3, zz * (R + 1.5), 0.4, 0.1, 0.4); m2.rotation.z = Math.PI / 2; }     // the two roundels
      put(g, box, white, 0, s.h + 0.07, 0, X * 2 + 0.4, 0.14, s.half * 2 + 0.4);
    }
    group.add(g);
  }
}
