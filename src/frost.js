// Winter on living things. Bare trees whose every twig carries a line of snow, and evergreen hedges
// rounded and frosted white on top, as they are after a still night's fall. Drawn by hand: a canvas
// of branching for the twigs, a speckled green going to white for the hedges.

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { rng } from './textures.js';

// ------------------------------------------------------------------ hedges
let _hedgeMat = null;
/** Dark yew below, thick with frost towards the top. v runs up the hedge. */
export function hedgeMaterial() {
  if (_hedgeMat) return _hedgeMat;
  const cv = document.createElement('canvas'); cv.width = cv.height = 256; const c = cv.getContext('2d'), r = rng(77);
  const g = c.createLinearGradient(0, 256, 0, 0); g.addColorStop(0, '#12251a'); g.addColorStop(0.55, '#1b3626'); g.addColorStop(1, '#2a4634'); c.fillStyle = g; c.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2600; i++) { const y = r() * 256; c.fillStyle = r() < 0.5 ? 'rgba(8,20,12,.5)' : 'rgba(48,86,58,.45)'; c.fillRect(r() * 256, y, 1 + r() * 3, 1 + r() * 3); }      // needles
  for (let i = 0; i < 5200; i++) { const t = Math.pow(r(), 2.2), y = t * 250, s = 1.2 + r() * (4.5 - t * 3); c.fillStyle = `rgba(${236 + r() * 19 | 0},${242 + r() * 13 | 0},255,${0.55 + r() * 0.45})`; c.beginPath(); c.arc(r() * 256, y, s, 0, 7); c.fill(); }   // snow, thickest at the top
  c.fillStyle = 'rgba(244,248,255,.9)'; c.fillRect(0, 0, 256, 10);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; t.anisotropy = 4;
  _hedgeMat = new THREE.MeshStandardMaterial({ map: t, roughness: 0.95, emissiveMap: t, emissive: new THREE.Color(0.42, 0.47, 0.6), emissiveIntensity: 0.55 });
  return _hedgeMat;
}
/** A hedge on the rectangle given, `h` tall from `y0`: a rounded, lumpy back, not a box. Goes into a Geo. */
export function frostHedge(geo, x0, x1, z0, z1, y0 = 0, h = 0.8) {
  const alongX = x1 - x0 >= z1 - z0, L = alongX ? x1 - x0 : z1 - z0, W = alongX ? z1 - z0 : x1 - x0, n = Math.max(1, Math.round(L / 0.42)), r = rng(Math.round(x0 * 31 + z0 * 17) + 5);
  const P = (u, w, y) => alongX ? [x0 + u, y0 + y, z0 + w] : [x0 + w, y0 + y, z0 + u];
  // The section across it: foot, a bulging shoulder, two points on the crown, shoulder, foot. Each a little different at every step along.
  const sec = () => { const b = 0.05 + r() * 0.05, t = h * (0.92 + r() * 0.22); return [[0, 0, 0], [-b, h * (0.48 + r() * 0.1), 0.5], [W * 0.26, t, 0.93], [W * 0.74, h * (0.92 + r() * 0.22), 0.93], [W + b, h * (0.48 + r() * 0.1), 0.5], [W, 0, 0]]; };
  let A = sec();
  const N = [[0, 0.1, -1], [0, 0.75, -0.6], [0, 1, 0], [0, 0.75, 0.6], [0, 0.1, 1]];
  const nrm = k => alongX ? N[k] : [N[k][2], N[k][1], 0];
  for (let i = 0; i < n; i++) {
    const B = sec(), u0 = L * i / n, u1 = L * (i + 1) / n;
    for (let k = 0; k < 5; k++) {
      const a = P(u0, A[k][0], A[k][1]), b = P(u1, B[k][0], B[k][1]), c2 = P(u1, B[k + 1][0], B[k + 1][1]), d = P(u0, A[k + 1][0], A[k + 1][1]);
      const uv = [[u0 / 1.4, A[k][2]], [u1 / 1.4, B[k][2]], [u1 / 1.4, B[k + 1][2]], [u0 / 1.4, A[k + 1][2]]];
      if (alongX) geo.quad(d, c2, b, a, nrm(k), [uv[3], uv[2], uv[1], uv[0]]); else geo.quad(a, b, c2, d, nrm(k), uv);
    }
    A = B;
  }
  // Its two ends.
  for (const [u, s] of [[0, -1], [L, 1]]) { const a = P(u, 0, 0), b = P(u, W, 0), c2 = P(u, W * 0.74, h * 0.95), d = P(u, W * 0.26, h * 0.95), nn = alongX ? [s, 0.2, 0] : [0, 0.2, s]; const uv = [[0, 0], [W / 1.4, 0], [W * 0.74 / 1.4, 0.9], [W * 0.26 / 1.4, 0.9]]; if ((s > 0) === alongX) geo.quad(a, b, c2, d, nn, uv); else geo.quad(b, a, d, c2, nn, [uv[1], uv[0], uv[3], uv[2]]); }
}

// ------------------------------------------------------------------- trees
// A card of twigs: a spray of fine branching, every stroke of it with snow lying along its upper side.
function twigTexture(seed, radial) {
  const S = 512, cv = document.createElement('canvas'); cv.width = cv.height = S; const c = cv.getContext('2d'), r = rng(seed);
  c.lineCap = 'round';
  const grow = (x, y, a, len, w, depth) => {
    const x1 = x + Math.cos(a) * len, y1 = y + Math.sin(a) * len;
    c.strokeStyle = '#1c1612'; c.lineWidth = w; c.beginPath(); c.moveTo(x, y); c.lineTo(x1, y1); c.stroke();
    c.strokeStyle = 'rgba(244,248,255,.96)'; c.lineWidth = Math.max(1.1, w * 0.62); c.beginPath(); c.moveTo(x, y - w * 0.5); c.lineTo(x1, y1 - w * 0.5); c.stroke();      // the snow on it
    if (depth <= 0) return;
    const k = depth > 3 ? 2 : 2 + (r() < 0.55 ? 1 : 0);
    for (let i = 0; i < k; i++) grow(x1, y1, a + (r() - 0.5) * (radial ? 1.5 : 1.25) + (radial ? 0 : (-Math.PI / 2 - a) * 0.08 - Math.sign(Math.cos(a)) * -0.12), len * (0.62 + r() * 0.22), Math.max(0.9, w * 0.66), depth - 1);
  };
  if (radial) for (let i = 0; i < 9; i++) grow(S / 2, S / 2, i * 0.7 + r() * 0.3, 70 + r() * 26, 5, 5);
  else for (let i = 0; i < 7; i++) grow(S / 2 + (r() - 0.5) * 30, S - 4, -Math.PI / 2 + (i - 3) * 0.33 + (r() - 0.5) * 0.15, 105 + r() * 30, 6, 5);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
/**
 * One winter tree to be drawn many times: `wood` (trunk and boughs, with snow lying on the boughs, by vertex colour)
 * and `twigs` (the crown: crossed cards of fine branching). Unit-ish size: about 4.6 tall and 5 across before scaling.
 */
export function winterTree() {
  const parts = [], col = (g, c) => { const n = g.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) { a[i * 3] = c[0]; a[i * 3 + 1] = c[1]; a[i * 3 + 2] = c[2]; } g.setAttribute('color', new THREE.BufferAttribute(a, 3)); return g; };
  const BARK = [0.085, 0.07, 0.06], SNOW = [1.7, 1.76, 1.95];
  const limb = (len, r0, r1, x, y, z, rx, rz, snowOn = true) => {
    const mk = (k, lift) => { const g = new THREE.CylinderGeometry(r1 * k, r0 * k, len, 7); g.translate(0, len / 2, 0); g.rotateX(rx); g.rotateZ(rz); g.translate(x, y + lift, z); return g; };
    parts.push(col(mk(1, 0), BARK)); if (snowOn) parts.push(col(mk(0.72, r0 * 0.62), SNOW));
  };
  limb(1.7, 0.2, 0.15, 0, 0, 0, 0.03, -0.04, false);                                                  // a short stout trunk, forking low
  for (let i = 0; i < 5; i++) { const a = i * 1.26 + 0.4, tilt = 0.62 + (i % 2) * 0.2; limb(2.3 + (i % 3) * 0.3, 0.1, 0.035, 0, 1.55 + (i % 2) * 0.12, 0, Math.cos(a) * tilt, Math.sin(a) * tilt); }
  for (let i = 0; i < 6; i++) { const a = i * 1.05 + 0.9; limb(1.5, 0.045, 0.014, Math.sin(a) * 1.0, 2.7 + (i % 2) * 0.35, -Math.cos(a) * 1.0, Math.cos(a) * 1.05, Math.sin(a) * 1.05); }
  const wood = mergeGeometries(parts);
  const cards = [];
  for (let i = 0; i < 4; i++) { const g = new THREE.PlaneGeometry(5.4, 3.3); g.translate(0, 3.25, 0); g.rotateY(i * Math.PI / 4 + 0.2); cards.push(g); }
  for (const [y, tilt, s] of [[3.3, 0.1, 5.6], [3.95, -0.08, 4.6], [4.5, 0.05, 3.2]]) { const g = new THREE.PlaneGeometry(s, s); g.rotateX(-Math.PI / 2 + tilt); g.translate(0, y, 0); const uv = g.attributes.uv; for (let q = 0; q < uv.count; q++) uv.setX(q, uv.getX(q) * 0.5 + 0.5); cards.push(g); }
  for (let i = 0; i < 4; i++) { const uv = cards[i].attributes.uv; for (let q = 0; q < uv.count; q++) uv.setX(q, uv.getX(q) * 0.5); }
  const twigs = mergeGeometries(cards);
  // One texture, two halves: the left a spray seen from the side, the right the crown seen from above.
  const S = 512, cv = document.createElement('canvas'); cv.width = S * 2; cv.height = S; const c = cv.getContext('2d');
  c.drawImage(twigTexture(411, false).image, 0, 0); c.drawImage(twigTexture(733, true).image, S, 0);
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  return {
    wood, twigs,
    woodMat: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, emissive: new THREE.Color(0.035, 0.035, 0.045), emissiveIntensity: 1 }),
    twigMat: new THREE.MeshBasicMaterial({ map: tex, alphaTest: 0.35, side: THREE.DoubleSide, color: new THREE.Color(0.8, 0.84, 0.98) }),
  };
}
