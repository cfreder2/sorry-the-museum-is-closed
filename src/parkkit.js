// What a park has standing in its snow, and what has crossed it (features.js). Three draw calls in all:
//
//   * Snow fences, the red lath kind on steel posts, where the wind off the lake would otherwise fill a field: every
//     lath, post and wire is one instance of one box. The drift each fence makes is part of the land (land.js FENCES),
//     so the wheels ride it and the laths stand buried in it to the knee; and the fence stops the car (plan.obstacles).
//   * What pokes through thin cover: tufts of dead grass round the foot of every tree and in the wind-swept hollows of
//     the fields, tall seed-heads along the fences' windward side, last year's leaves caught there. Two crossed cards
//     each, cut out (no blending), a hand to a forearm high: from 40 cm up they are the foreground.
//   * Tracks: somebody walked out from the path to stand the snowball targets up, and a dog went with them in loops;
//     somebody went to try the ice; rabbits crossed between the trees. Prints lie on the land's slope.
// Nothing here moves, and nothing is worked out after start-up.

import * as THREE from 'three';
import { feature } from './features.js';
import { FENCES, SPRUCES, WIND, landAt } from './land.js';
import { onSnow } from './plan.js';

const rng = seed => { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const DRAWN = -0.03;              // the snow is drawn this far below what the wheels are on (snowfield.js)

// Four cards side by side: a tuft of grass, tall stalks with seed-heads, caught leaves, a twiggy stub.
function tuftAtlas() {
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 256; const c = cv.getContext('2d'), r = rng(77);
  c.lineCap = 'round';
  const blade = (x0, y0, x1, y1, bend, w, col) => { c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo((x0 + x1) / 2 + bend, (y0 + y1) / 2, x1, y1); c.stroke(); };
  const straw = () => { const v = 0.7 + r() * 0.45; return `rgb(${Math.round(126 * v)},${Math.round(122 * v)},${Math.round(108 * v)})`; };
  for (let i = 0; i < 30; i++) { const a = (r() - 0.5) * 1.7, l = 110 + r() * 135; blade(64 + (r() - 0.5) * 22, 256, 64 + Math.sin(a) * l * 0.5, 256 - Math.cos(a) * l, (r() - 0.5) * 30, 1.6 + r() * 1.8, straw()); }
  for (let i = 0; i < 9; i++) { const x = 128 + 30 + r() * 68, top = 14 + r() * 70, lean = (r() - 0.5) * 34; blade(x, 256, x + lean, top, (r() - 0.5) * 16, 2.6, 'rgb(118,104,84)');
    for (let k = 0; k < 9; k++) { c.fillStyle = `rgb(${96 + Math.round(r() * 40)},${80 + Math.round(r() * 30)},${60 + Math.round(r() * 20)})`; c.beginPath(); c.ellipse(x + lean + (r() - 0.5) * 14, top + r() * 34, 3 + r() * 3, 5 + r() * 4, r() * 3, 0, 7); c.fill(); } }
  for (let i = 0; i < 12; i++) { blade(128 + 20 + r() * 88, 256, 128 + 20 + r() * 88, 150 + r() * 80, (r() - 0.5) * 20, 2, straw()); }
  for (let i = 0; i < 9; i++) { const x = 256 + 22 + r() * 84, y = 150 + r() * 96, s = 15 + r() * 13, a = r() * 6.28; c.save(); c.translate(x, y); c.rotate(a); c.fillStyle = ['rgb(132,84,44)', 'rgb(112,66,38)', 'rgb(150,104,52)', 'rgb(96,62,40)'][Math.floor(r() * 4)];
    c.beginPath(); c.moveTo(0, -s); c.bezierCurveTo(s * 0.9, -s * 0.5, s * 0.8, s * 0.6, 0, s); c.bezierCurveTo(-s * 0.8, s * 0.6, -s * 0.9, -s * 0.5, 0, -s); c.fill(); c.strokeStyle = 'rgba(60,36,20,.7)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(0, -s); c.lineTo(0, s * 1.2); c.stroke(); c.restore(); }
  const twig = (x, y, a, l, w) => { if (l < 9) return; const x1 = x + Math.sin(a) * l, y1 = y - Math.cos(a) * l; blade(x, y, x1, y1, 0, w, 'rgb(84,70,62)'); twig(x1, y1, a - 0.35 - r() * 0.4, l * 0.68, w * 0.72); twig(x1, y1, a + 0.3 + r() * 0.4, l * 0.7, w * 0.72); };
  twig(384 + 64, 256, (r() - 0.5) * 0.3, 80, 5); twig(384 + 44, 256, -0.4, 52, 3.4); twig(384 + 84, 256, 0.45, 58, 3.4);
  // (snow lodged in each: a little white along the tops of things)
  const im = c.getImageData(0, 0, 512, 256), d = im.data;
  for (let x = 0; x < 512; x++) for (let y = 1; y < 256; y++) { const k = (y * 512 + x) * 4; if (d[k + 3] > 160 && d[k - 512 * 4 + 3] < 60 && ((x * 7 + y * 3) % 5) < 2) { d[k] = 226; d[k + 1] = 234; d[k + 2] = 248; } }
  c.putImageData(im, 0, 0);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}

// Four prints: a left boot, a right boot, a dog's four feet at a trot, a rabbit's bound. Each pressed in: dark, darker
// along the side away from the moon, with a pale lip.
function printAtlas() {
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 256; const c = cv.getContext('2d');
  const press = (draw) => { c.save(); c.translate(2.5, 0); c.fillStyle = 'rgba(236,243,255,.4)'; draw(); c.restore(); c.save(); c.fillStyle = 'rgba(38,52,88,.52)'; draw(); c.restore(); c.save(); c.translate(-1.5, 0); c.globalCompositeOperation = 'source-atop'; c.fillStyle = 'rgba(70,92,140,.5)'; draw(); c.restore(); };
  const boot = (cx, flip) => press(() => { c.save(); c.translate(cx, 128); c.scale(flip, 1);
    c.beginPath(); c.moveTo(-22, -96); c.bezierCurveTo(14, -112, 34, -70, 28, -20); c.bezierCurveTo(26, 0, 20, 8, 20, 22); c.lineTo(-18, 22); c.bezierCurveTo(-16, 0, -30, -30, -22, -96); c.fill();      // the sole
    c.beginPath(); c.moveTo(-18, 36); c.lineTo(20, 36); c.bezierCurveTo(24, 70, 18, 100, 0, 102); c.bezierCurveTo(-18, 100, -22, 70, -18, 36); c.fill(); c.restore(); });      // the heel
  boot(64, 1); boot(192, -1);
  const paw = (x, y, s) => press(() => { c.beginPath(); c.ellipse(x, y + s * 0.3, s * 0.62, s * 0.5, 0, 0, 7); c.fill(); for (const [dx, dy] of [[-0.62, -0.42], [-0.22, -0.82], [0.22, -0.82], [0.62, -0.42]]) { c.beginPath(); c.ellipse(x + dx * s, y + dy * s, s * 0.21, s * 0.27, dx * 0.4, 0, 7); c.fill(); } });
  paw(256 + 44, 40, 20); paw(256 + 84, 98, 20); paw(256 + 40, 160, 20); paw(256 + 88, 220, 20);
  const pad = (x, y, rx, ry) => press(() => { c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, 7); c.fill(); });
  pad(384 + 40, 60, 11, 30); pad(384 + 88, 60, 11, 30); pad(384 + 58, 150, 9, 13); pad(384 + 72, 190, 9, 13);      // the long hind feet land ahead of the forefeet
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}

// A spruce's cards, the trunk end of each at the bottom: two boughs of needles seen from above (a stem, side twigs
// swept towards the tip, widest a third of the way out), the snow that lies along one (clumps, bluer round their edges
// where they are thin and in their own shade), and a blank.
function boughAtlas() {
  const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 256; const c = cv.getContext('2d'), r = rng(311);
  c.lineCap = 'round';
  const half = s => 104 * Math.pow(Math.sin(Math.PI * Math.pow(s, 0.62)), 0.8) * (1 - 0.25 * s) + 5;      // the bough's half width, s from trunk to tip
  for (let v = 0; v < 2; v++) {
    const ox = v * 256 + 128;
    c.fillStyle = 'rgb(16,36,28)'; c.beginPath(); c.moveTo(ox, 256); for (let s = 0; s <= 1.001; s += 0.05) c.lineTo(ox - half(s) * 0.5, 256 - s * 240); for (let s = 1; s >= -0.001; s -= 0.05) c.lineTo(ox + half(s) * 0.5, 256 - s * 240); c.fill();
    for (let pass = 0; pass < 2; pass++) for (let s = 0.03; s < 1; s += 0.035 + r() * 0.02) for (const side of [-1, 1]) {
      if (r() < 0.08) continue;
      const y = 256 - s * 240, L = half(s) * (0.72 + r() * 0.34), a = 0.5 + r() * 0.35 + s * 0.3, x1 = ox + side * Math.sin(Math.PI / 2 - a) * L, y1 = y - Math.cos(Math.PI / 2 - a) * L * 0.9, g = 44 + Math.round(r() * 44) + pass * 14;
      c.strokeStyle = `rgb(${Math.round(g * 0.34)},${g},${Math.round(g * 0.62)})`; c.lineWidth = (pass ? 5 : 11) + r() * 6; c.beginPath(); c.moveTo(ox + side * 2, y); c.quadraticCurveTo(ox + side * L * 0.5, y - L * 0.1, x1, y1); c.stroke();
      c.lineWidth = 1.6; for (let k = 0; k < 7; k++) { const t = 0.25 + r() * 0.75, px = ox + side * 2 + (x1 - ox - side * 2) * t, py = y + (y1 - y) * t, na = r() * 6.283, nl = 5 + r() * 7; c.beginPath(); c.moveTo(px, py); c.lineTo(px + Math.cos(na) * nl, py + Math.sin(na) * nl); c.stroke(); }      // needles standing out of the mass
    }
    c.strokeStyle = 'rgb(46,36,28)'; c.lineWidth = 5; c.beginPath(); c.moveTo(ox, 256); c.lineTo(ox, 60); c.stroke();
  }
  for (const [col, grow, dy] of [['rgb(132,156,200)', 1.16, 3], ['rgb(236,242,252)', 1, 0]]) {
    c.fillStyle = col; const q = rng(977);
    for (let k = 0; k < 30; k++) { const s = 0.02 + q() * 0.92, w = half(s) * (0.36 + q() * 0.46), x = 512 + 128 + (q() - 0.5) * half(s) * 0.7, y = 256 - s * 240; c.beginPath(); c.ellipse(x, y + dy, w * grow, (10 + q() * 22) * grow, (q() - 0.5) * 0.8, 0, 7); c.fill(); }
  }
  c.fillStyle = '#fff'; c.fillRect(768, 0, 256, 256);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}

// Give an instanced material a card of a four-card atlas per instance (attribute aCell: 0 to 3).
function cells(mat) {
  mat.onBeforeCompile = sh => { sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float aCell;').replace('#include <uv_vertex>', '#include <uv_vertex>\nvMapUv.x = (vMapUv.x + aCell) * 0.25;'); };
  mat.customProgramCacheKey = () => 'parkkit-cells';
  return mat;
}

feature({
  id: 'parkkit',
  init(k) {
    const plan = k.plan, L = plan.land; if (!L || !L.top) return;
    const g = this.g = new THREE.Group(); g.name = 'parkkit'; k.group.add(g);
    const at = (x, z) => landAt(L, x, z), M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), V = new THREE.Vector3(), S = new THREE.Vector3(), col = new THREE.Color();
    const [wx, wz] = WIND;

    // ---------------------------------------------------------------- the fences
    const fence = [], r = rng(4021);                    // [x, y, z, sx, sy, sz, rx, ry, rz, colour]
    const tufts = [], tuft = (x, z, kind, h, w = h) => { if (onSnow(plan, x, z)) tufts.push([x, at(x, z) + DRAWN - 0.015, z, kind, h, w, r() * Math.PI]); };
    for (const [ax, az, bx, bz] of FENCES) {
      const len = Math.hypot(bx - ax, bz - az), tx = (bx - ax) / len, tz = (bz - az) / len, yaw = Math.atan2(tx, tz), top = (x, z) => at(x, z) + 1.0;
      // laths, 8.5 cm apart, each a little out of true; here and there one has gone
      for (let d = 0.04; d < len; d += 0.085) { if (r() < 0.035) continue; const x = ax + tx * d, z = az + tz * d, h = 1.18 + r() * 0.07, v = 0.62 + r() * 0.5;
        fence.push([x, top(x, z) - h / 2 + 0.1, z, 0.038, h, 0.008, (r() - 0.5) * 0.07, yaw + Math.PI / 2, (r() - 0.5) * 0.05, [0.5 * v, 0.17 * v, 0.1 * v]]); }
      // steel posts every 2.4 m, on the lee side; and three wires the laths are woven on
      const n = Math.max(1, Math.round(len / 2.4));
      for (let i = 0; i <= n; i++) { const d = len * i / n, x = ax + tx * d - tz * 0.03, z = az + tz * d + tx * 0.03; fence.push([x, at(x, z) + 0.72, z, 0.032, 1.5, 0.032, 0, yaw, (r() - 0.5) * 0.06, [0.1, 0.17, 0.13]]); }
      for (let d = 0; d < len - 0.01; d += 1.2) { const d1 = Math.min(len, d + 1.2), xa = ax + tx * d, za = az + tz * d, xb = ax + tx * d1, zb = az + tz * d1, ya = at(xa, za), yb = at(xb, zb), l = Math.hypot(d1 - d, yb - ya);
        for (const hh of [0.24, 0.62, 0.98]) fence.push([(xa + xb) / 2, (ya + yb) / 2 + hh, (za + zb) / 2, 0.012, 0.012, l, -Math.atan2(yb - ya, d1 - d), yaw, 0, [0.42, 0.45, 0.5]]); }
      plan.obstacles.push({ x0: Math.min(ax, bx) - 0.06, x1: Math.max(ax, bx) + 0.06, z0: Math.min(az, bz) - 0.06, z1: Math.max(az, bz) + 0.06, y0: 0, y1: 1.7 });
      // up-wind of it the ground is swept thin: seed-heads standing, and leaves blown against the laths
      for (let d = 0.3; d < len; d += 0.35 + r() * 0.9) { const o = 0.25 + r() * 0.9, x = ax + tx * d - wx * o, z = az + tz * d - wz * o; if (r() < 0.6) tuft(x, z, 1, 0.4 + r() * 0.35, 0.3 + r() * 0.15); else tuft(x, z, 0, 0.16 + r() * 0.14); }
      for (let d = 0.2; d < len; d += 0.25 + r() * 0.8) { const x = ax + tx * d - wx * 0.07, z = az + tz * d - wz * 0.07; tufts.push([x, at(x, z) + DRAWN + r() * 0.3, z, 2, 0.16 + r() * 0.08, 0.16, yaw + Math.PI / 2 + (r() - 0.5) * 0.3]); }
    }
    if (fence.length) {
      const mat = new THREE.MeshStandardMaterial({ roughness: 0.85, metalness: 0 });
      mat.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += diffuseColor.rgb * 0.5;'); };      // (lit a little from within, as everything out of doors is here, whatever its own colour)
      mat.customProgramCacheKey = () => 'parkkit-fence';
      const m = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), mat, fence.length);
      fence.forEach(([x, y, z, sx, sy, sz, rx, ry, rz, c], i) => { m.setMatrixAt(i, M.compose(V.set(x, y, z), Q.setFromEuler(E.set(rx, ry, rz, 'YXZ')), S.set(sx, sy, sz))); m.setColorAt(i, col.setRGB(c[0], c[1], c[2])); });
      m.computeBoundingSphere(); g.add(m);
    }

    // ---------------------------------------------------------------- spruces
    // Each one built bough by bough and no two alike, all in one mesh: a trunk, a dark heart, and eight to eleven whorls of
    // boughs, each a bent card of needles (cut out, so the outline is ragged) that rises a little from the trunk and
    // droops to its tip, longer on one side of the tree than the other, a few missing; over most of them a second card
    // of the snow lying on it, short of the tip where it has slid off, so the green shows at the ends and from
    // underneath. It leans a little. Under it the snow has not reached the ground (land.js): a well, with grass and
    // litter in it. Stood only where the ground is free; the trunk stops the car, which goes under the lowest boughs,
    // and the crown stops the drone.
    {
      const spots = SPRUCES.filter(([x, z]) => Math.max(at(x + 2.4, z), at(x - 2.4, z), at(x, z + 2.4), at(x, z - 2.4)) > 0.01 && onSnow(plan, x, z) && !plan.obstacles.some(o => o.y0 < 3 && x > o.x0 - 1.2 && x < o.x1 + 1.2 && z > o.z0 - 1.2 && z < o.z1 + 1.2));
      if (spots.length) {
        const pos = [], nor = [], uv = [], col = [], idx = [], TAU = Math.PI * 2;
        // A card of the atlas (cell 0 to 3), bent: four rows out from (ox, oy, oz) along (ca, sa) for a length L, rising a
        // little and then drooping, three points across with the edges hanging lower; leaning with the tree.
        const card = (cell, ox, oy, oz, ca, sa, L, wd, rise, droop, lean, v0 = 0, v1 = 1, tint = 1, heap = 0) => {      // heap: how high its middle stands over its edges (the snow is piled along the bough's spine)
          const b = pos.length / 3;
          for (let k = 0; k <= 3; k++) for (let c = -1; c <= 1; c++) {
            const s = k / 3, out = L * s, lat = c * wd / 2, y = oy + L * (rise * s - droop * s * s) - Math.abs(c) * wd * 0.13 + (1 - Math.abs(c)) * heap * (1 - 0.6 * s);
            pos.push(ox + ca * out - sa * lat + lean[0] * y * y, y, oz + sa * out + ca * lat + lean[1] * y * y);
            nor.push(ca * 0.35, 0.94, sa * 0.35); uv.push((cell + (c + 1) / 2) / 4, v0 + (v1 - v0) * s); col.push(tint, tint, tint);
          }
          for (let k = 0; k < 3; k++) for (let c = 0; c < 2; c++) { const a = b + k * 3 + c; idx.push(a, a + 1, a + 3, a + 1, a + 4, a + 3); }      // (its face is its upper side)
        };
        // A card standing up: the leader at the very top.
        const spire = (ox, oy, oz, a, hgt, wd, lean) => {
          const b = pos.length / 3, ca = Math.cos(a) * wd / 2, sa = Math.sin(a) * wd / 2;
          for (const [s, t] of [[-1, 0], [1, 0], [1, 1], [-1, 1]]) { const y = oy + hgt * t; pos.push(ox + ca * s + lean[0] * y * y, y, oz + sa * s + lean[1] * y * y); nor.push(0, 1, 0); uv.push((s + 1) / 8, t); col.push(0.9, 0.9, 0.9); }
          idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
        };
        // A plain tapering column, from the atlas's blank card, in a colour of its own: the trunk, and the dark heart of the tree.
        const column = (ox, oz, y0, y1, r0, r1, n, c, lean) => {
          const b = pos.length / 3;
          for (let k = 0; k <= 1; k++) for (let j = 0; j <= n; j++) { const a = j / n * TAU, y = k ? y1 : y0, rr = k ? r1 : r0; pos.push(ox + Math.cos(a) * rr + lean[0] * y * y, y, oz + Math.sin(a) * rr + lean[1] * y * y); nor.push(Math.cos(a) * 0.8, 0.6, Math.sin(a) * 0.8); uv.push(0.875, 0.5); col.push(c[0], c[1], c[2]); }
          for (let j = 0; j < n; j++) { const a = b + j, d = a + n + 1; idx.push(a, d, a + 1, a + 1, d, d + 1); }
        };
        for (const [x, z, h] of spots) {
          const y0 = at(x, z) - 0.04, la = r() * TAU, lk = (0.006 + r() * 0.02) / h, lean = [Math.cos(la) * lk, Math.sin(la) * lk], lop = r() * TAU, tiers = 8 + Math.floor(r() * 4), full = 0.3 + r() * 0.1;
          column(x, z, y0, y0 + h * 0.5, h * 0.03, h * 0.012, 7, [0.2, 0.15, 0.11], lean);
          column(x, z, y0 + h * 0.2, y0 + h * 0.99, h * 0.11, 0.004, 8, [0.03, 0.07, 0.055], lean);
          for (let i = 0; i < tiers; i++) {
            const t = i / (tiers - 1), yT = y0 + h * (0.15 + 0.78 * t), R = h * (full * Math.pow(1 - t, 0.8) + 0.035), n = Math.max(3, Math.round(7.5 - 4 * t)), a0 = r() * TAU;
            for (let j = 0; j < n; j++) {
              if (r() < 0.07) continue;                                        // a bough gone
              const a = a0 + (j + (r() - 0.5) * 0.6) / n * TAU, ca = Math.cos(a), sa = Math.sin(a), L = R * (0.75 + r() * 0.45) * (1 + 0.24 * Math.cos(a - lop)), wd = L * (0.52 + r() * 0.22), droop = 0.16 + 0.3 * (1 - t) + r() * 0.14, y = yT + (r() - 0.5) * h * 0.035;
              card(r() < 0.5 ? 0 : 1, x, y, z, ca, sa, L, wd, 0.1, droop, lean, 0, 1, 0.8 + r() * 0.3);
              if (r() < 0.88) { const part = 0.66 + r() * 0.34; card(2, x, y + h * 0.012, z, ca, sa, L * part, wd * 0.96, 0.1, droop * part, lean, 0, 1, 1, h * 0.03); }      // the snow on it, where it has not slid off the end
            }
          }
          { const a = r() * 3; spire(x, y0 + h * 0.84, z, a, h * 0.2, h * 0.11, lean); spire(x, y0 + h * 0.84, z, a + 1.57, h * 0.2, h * 0.11, lean); }      // the leader
          plan.obstacles.push({ x0: x - 0.14, x1: x + 0.14, z0: z - 0.14, z1: z + 0.14, y0: 0, y1: 0.4 }, { x0: x - h * 0.2, x1: x + h * 0.2, z0: z - h * 0.2, z1: z + h * 0.2, y0: 0.4, y1: h * 0.85 });
          for (let j = 0; j < 7; j++) { const a = r() * 6.283, d = 0.15 + r() * h * 0.24; tufts.push([x + Math.cos(a) * d, y0 - 0.005, z + Math.sin(a) * d, r() < 0.3 ? 3 : r() < 0.5 ? 2 : 0, 0.1 + r() * 0.14, 0.1 + r() * 0.14, r() * Math.PI]); }      // in the well: grass, twigs, needles
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); geo.setIndex(idx);
        const mat = new THREE.MeshStandardMaterial({ map: boughAtlas(), alphaTest: 0.4, side: THREE.DoubleSide, vertexColors: true, roughness: 0.95 });
        mat.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += diffuseColor.rgb * (gl_FrontFacing ? 0.55 : 0.3);'); };      // (lit a little from within, less from underneath)
        mat.customProgramCacheKey = () => 'parkkit-spruce';
        const m = new THREE.Mesh(geo, mat); m.matrixAutoUpdate = false; g.add(m); this.spruces = spots.length; this.spruceTris = idx.length / 3;
      }
    }

    // ---------------------------------------------------------------- what pokes through
    const G = plan.grounds, F = plan.lakefront && plan.lakefront.field;
    for (const t of G.trees) {
      if (t.kind === 'hawthorn' || at(t.x, t.z) < 0.004) continue;                 // (only where the land is the wind's: not in the gardens)
      for (let i = 0, n = 4 + Math.floor(r() * 5); i < n; i++) { const a = r() * 6.283, d = 0.28 + r() * r() * 1.5, x = t.x + Math.cos(a) * d - wx * 0.3, z = t.z + Math.sin(a) * d - wz * 0.3; tuft(x, z, r() < 0.2 ? 3 : r() < 0.3 ? 2 : 0, 0.12 + r() * 0.16); }
    }
    // (in the fields: clumps where the snow lies thin, in the hollows between the drifts)
    for (const q of [[18, 271, -18, 238], F ? [F.x0 + 3, F.x1 - 2, F.z0 + 3, F.z1 - 3] : null]) {
      if (!q) continue;
      for (let i = 0, n = Math.round((q[1] - q[0]) * (q[3] - q[2]) / 90); i < n; i++) {
        const x = q[0] + r() * (q[1] - q[0]), z = q[2] + r() * (q[3] - q[2]), h = at(x, z); if (h < 0.012 || h > 0.11 || !onSnow(plan, x, z)) continue;
        const tall = r() < 0.3;
        for (let j = 0, m = 3 + Math.floor(r() * 8); j < m; j++) { const a = r() * 6.283, d = r() * 1.1, px = x + Math.cos(a) * d, pz = z + Math.sin(a) * d; if (at(px, pz) > 0.012 && at(px, pz) < 0.13) tuft(px, pz, tall && r() < 0.6 ? 1 : 0, tall ? 0.3 + r() * 0.3 : 0.1 + r() * 0.14, tall ? 0.24 : undefined); }
      }
    }
    if (tufts.length) {
      const a = new THREE.PlaneGeometry(1, 1); a.translate(0, 0.5, 0); const b = a.clone(); b.rotateY(Math.PI / 2);
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute([...a.attributes.position.array, ...b.attributes.position.array], 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute([...a.attributes.uv.array, ...b.attributes.uv.array], 2)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(new Array(24).fill(0).map((_, i) => i % 3 === 1 ? 1 : 0), 3)); geo.setIndex([...a.index.array, ...[...b.index.array].map(i => i + 4)]);
      geo.setAttribute('aCell', new THREE.InstancedBufferAttribute(new Float32Array(tufts.map(t => t[3])), 1));
      const m = new THREE.InstancedMesh(geo, cells(new THREE.MeshBasicMaterial({ map: tuftAtlas(), alphaTest: 0.45, side: THREE.DoubleSide, color: new THREE.Color(0.46, 0.5, 0.64) })), tufts.length);
      tufts.forEach(([x, y, z, , h, w, yaw], i) => m.setMatrixAt(i, M.compose(V.set(x, y, z), Q.setFromEuler(E.set((r() - 0.5) * 0.3, yaw, (r() - 0.5) * 0.3, 'YXZ')), S.set(w, h, w))));
      m.computeBoundingSphere(); g.add(m); this.tufts = tufts.length;
    }

    // ---------------------------------------------------------------- tracks
    const prints = [];                                   // [x, z, heading, card, width, length]
    const along = (pts, step, fn) => {                   // walk a line of waypoints, calling fn(x, z, heading, n) every `step` metres
      let n = 0, carry = 0;
      for (let i = 0; i + 1 < pts.length; i++) { const [x0, z0] = pts[i], [x1, z1] = pts[i + 1], l = Math.hypot(x1 - x0, z1 - z0), hd = Math.atan2(x1 - x0, z1 - z0); let d = carry; for (; d < l; d += step()) fn(x0 + (x1 - x0) * d / l, z0 + (z1 - z0) * d / l, hd, n++); carry = d - l; }
    };
    const print = (x, z, hd, card, w, l) => { if (onSnow(plan, x, z)) prints.push([x, z, hd, card, w, l]); };
    const boots = pts => along(pts, () => 0.62 + r() * 0.1, (x, z, hd, n) => { const s = n % 2 ? 1 : -1; print(x + Math.cos(hd) * 0.1 * s, z - Math.sin(hd) * 0.1 * s, hd + s * 0.12 + (r() - 0.5) * 0.1, n % 2, 0.125, 0.3); });
    const dog = pts => along(pts, () => 0.5 + r() * 0.12, (x, z, hd) => print(x, z, hd + (r() - 0.5) * 0.2, 2, 0.17, 0.34));
    const rabbit = pts => along(pts, () => 0.55 + r() * 0.5, (x, z, hd) => print(x, z, hd + (r() - 0.5) * 0.25, 3, 0.15, 0.3));
    const wander = (pts, amp, wave) => { const out = []; along(pts, () => 1.1, (x, z, hd, n) => { const o = Math.sin(n * wave) * amp + Math.sin(n * wave * 0.37 + 1) * amp * 0.6; out.push([x + Math.cos(hd) * o, z - Math.sin(hd) * o]); }); return out; };
    if (F) {
      const out = [[390.2, 99], [398, 92], [409, 84], [417, 77.5], [431, 76.2], [457, 76.6]], back = [[456, 77.6], [431, 77.4], [420, 80], [408, 88], [391, 101.5]];
      boots(out); boots(back); dog(wander([[390.5, 100], [409, 85], [431, 79], [450, 80], [462, 88], [446, 96], [420, 92], [395, 102]], 2.2, 0.55));
      rabbit([[474, 58], [468, 66], [471, 80], [463.5, 93], [472, 101]]);
      boots([[389.6, 60.5], [393, 58.5], [395.2, 57.4]]); boots([[398.6, 58], [392.5, 61.5], [389.6, 63]]);      // out to the frozen hollow and back
      boots([[428.5, 111.9], [429.6, 117], [430.3, 120.6]]); boots([[432.4, 120.8], [431.7, 116], [431, 111.9]]);      // and off the cross path to the other one
    }
    rabbit([[131, 168], [139, 181], [146, 199], [136, 214], [133, 229]]); rabbit([[132, -8], [140, 6], [146, 21], [137, 33], [131, 46]]); rabbit([[258, 20], [262, 31], [259, 44]]);
    if (prints.length) {
      const geo = new THREE.PlaneGeometry(1, 1); geo.rotateX(-Math.PI / 2);      // (lying flat: its length along -z, which the heading turns to the way of travel)
      geo.setAttribute('aCell', new THREE.InstancedBufferAttribute(new Float32Array(prints.map(p => p[3])), 1));
      const m = new THREE.InstancedMesh(geo, cells(new THREE.MeshBasicMaterial({ map: printAtlas(), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })), prints.length);
      const up = new THREE.Vector3(0, 1, 0), nrm = new THREE.Vector3(), Q2 = new THREE.Quaternion();
      prints.forEach(([x, z, hd, , w, l], i) => {
        const e = 0.12, dx = (at(x + e, z) - at(x - e, z)) / (2 * e), dz = (at(x, z + e) - at(x, z - e)) / (2 * e);
        Q.setFromAxisAngle(up, hd + Math.PI); Q2.setFromUnitVectors(up, nrm.set(-dx, 1, -dz).normalize()); Q.premultiply(Q2);
        m.setMatrixAt(i, M.compose(V.set(x, at(x, z) + DRAWN + 0.012, z), Q, S.set(w, 1, l)));
      });
      m.renderOrder = 2; m.computeBoundingSphere(); g.add(m); this.prints = prints.length;
    }
  },
});
