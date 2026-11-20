// The city and the lake, in the right places. The museum's front faces west across Michigan Avenue
// to a wall of old towers; the Loop's tall ones stand behind them, the cluster north of Millennium
// Park to the north, Grant Park's trees to the south, and to the east, beyond Columbus Drive and the
// park, Lake Michigan: flat, dark, and catching the moon.
//
// One painted panorama, a turn of the horizon wide. Bearings are a compass's: 0 north (-z), 90 east (+x).
// Every building is drawn here by hand: silhouettes and lit windows, nothing copied from a photograph.

import * as THREE from 'three';
import { rng } from './textures.js';

const W = 4096, H = 1024, SPAN = 190, BELOW = 9;                 // the cylinder it goes on: 190 m tall, 9 of them below the ground
const py = y => H * (1 - (y + BELOW) / SPAN);                    // metres up -> pixels down
const px = b => { const t = Math.atan2(Math.sin(b * Math.PI / 180), -Math.cos(b * Math.PI / 180)); return ((t / (2 * Math.PI)) % 1 + 1) % 1 * W; };
const K = W / 360;
export const MOON = 68;                                          // where the moon stands: low in the east-north-east, over the water                                               // pixels to a degree

export function panorama() {
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const g = cv.getContext('2d'), r = rng(1893);
  const sky = g.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#04060f'); sky.addColorStop(0.55, '#0c1730'); sky.addColorStop(0.86, '#1f2a4c'); sky.addColorStop(0.955, '#3a3c5c'); sky.addColorStop(1, '#3a3c5c');
  g.fillStyle = sky; g.fillRect(0, 0, W, H);
  for (let k = 0; k < 900; k++) { g.fillStyle = `rgba(255,255,255,${0.2 + r() * 0.7})`; const s = r() < 0.06 ? 2.2 : 1.1; g.fillRect(r() * W, r() * H * 0.7, s, s); }
  // The glow a city puts in the sky: over the Loop, none over the water.
  for (const [b, w, a] of [[285, 120, 0.2], [350, 80, 0.16], [200, 60, 0.07]]) for (const off of [-W, 0, W]) { const x = px(b) + off, gr = g.createRadialGradient(x, py(0), 10, x, py(0), w * K); gr.addColorStop(0, `rgba(255,170,110,${a})`); gr.addColorStop(1, 'rgba(255,170,110,0)'); g.fillStyle = gr; g.fillRect(x - w * K, 0, 2 * w * K, H); }

  const lights = (x, top, w, bottom, lit, cw = 4, ch = 6, gx = 8, gy = 11, blue = 0.2) => {
    for (let wy = top + 6; wy < bottom - 4; wy += gy) for (let wx = x + 4; wx < x + w - cw - 2; wx += gx) if (r() < lit) { g.fillStyle = r() > blue ? `rgba(255,${190 + r() * 40},${110 + r() * 60},${0.45 + r() * 0.5})` : 'rgba(190,220,255,0.75)'; g.fillRect(wx, wy, cw, ch); }
  };
  // A tower: centre bearing, width in degrees, height in metres. `shape` trims its top.
  const tower = (b, wd, h, o = {}) => {
    const w = wd * K, top = py(h), base = py(-BELOW), col = o.col || '#0a0f1c';
    for (const off of [-W, 0, W]) {
      const x = px(b) - w / 2 + off; if (x > W + 50 || x + w < -50) continue;
      g.fillStyle = col; g.beginPath();
      if (o.shape === 'diamond') { g.moveTo(x, base); g.lineTo(x, top + w * 1.1); g.lineTo(x + w / 2, top); g.lineTo(x + w, top + w * 1.1); g.lineTo(x + w, base); }
      else if (o.shape === 'point') { g.moveTo(x, base); g.lineTo(x, top + w * 1.3); g.lineTo(x + w * 0.2, top + w * 1.3); g.lineTo(x + w * 0.2, top + w * 0.8); g.lineTo(x + w * 0.35, top + w * 0.8); g.lineTo(x + w / 2, top); g.lineTo(x + w * 0.65, top + w * 0.8); g.lineTo(x + w * 0.8, top + w * 0.8); g.lineTo(x + w * 0.8, top + w * 1.3); g.lineTo(x + w, top + w * 1.3); g.lineTo(x + w, base); }
      else if (o.shape === 'steps') { const s = (py(0) - top); g.moveTo(x, base); g.lineTo(x, top + s * 0.45); g.lineTo(x + w * 0.22, top + s * 0.45); g.lineTo(x + w * 0.22, top + s * 0.18); g.lineTo(x + w * 0.4, top + s * 0.18); g.lineTo(x + w * 0.4, top); g.lineTo(x + w * 0.72, top); g.lineTo(x + w * 0.72, top + s * 0.3); g.lineTo(x + w, top + s * 0.3); g.lineTo(x + w, base); }
      else if (o.shape === 'crown') { g.moveTo(x, base); g.lineTo(x, top + w * 0.5); g.lineTo(x + w * 0.15, top + w * 0.5); g.lineTo(x + w * 0.15, top); g.lineTo(x + w * 0.85, top); g.lineTo(x + w * 0.85, top + w * 0.5); g.lineTo(x + w, top + w * 0.5); g.lineTo(x + w, base); }
      else { g.moveTo(x, base); g.lineTo(x, top); g.lineTo(x + w, top); g.lineTo(x + w, base); }
      g.closePath(); g.fill();
      if (o.stripes) { g.fillStyle = o.stripes; for (let sx = x + 2; sx < x + w - 1; sx += 5) g.fillRect(sx, top + 2, 2, base - top); }
      if (o.mast) { g.fillStyle = col; for (const m of [].concat(o.mast)) { g.fillRect(x + w * m - 1.5, top - o.mastH * H / SPAN, 3, o.mastH * H / SPAN + 4); g.fillStyle = '#ff5040'; g.fillRect(x + w * m - 2.5, top - o.mastH * H / SPAN - 3, 5, 5); g.fillStyle = col; } }
      if (o.cap) { g.fillStyle = o.cap; g.fillRect(x, top, w, 5); }
      const t0 = o.shape === 'diamond' ? top + w * 1.1 : o.shape === 'point' ? top + w * 1.3 : top;
      lights(x, t0, w, py(0), o.lit == null ? 0.3 : o.lit, o.cw || 4, o.ch || 6, o.gx || 8, o.gy || 11, o.blue == null ? 0.2 : o.blue);
    }
  };
  // How built-up the horizon is, by bearing: nothing over the lake, little over the park to the south.
  const city = b => (b >= 200 && b <= 360) || b <= 32 ? 1 : b > 32 && b < 48 ? (48 - b) / 16 : b > 172 && b < 200 ? 0.35 + 0.65 * (b - 172) / 28 : 0;
  // The far rank: the Loop behind, tallest to the west and north-west.
  for (let b = 0; b < 360;) { const c = city(b), wd = 2.2 + r() * 3.2; if (c > 0 && r() < 0.9) tower(b + wd / 2, wd, (40 + r() * 75) * (0.5 + 0.5 * c) * (b > 240 && b < 340 ? 1.25 : 1), { col: '#101728', lit: 0.2, mast: r() < 0.12 ? 0.5 : null, mastH: 14 }); b += wd + r() * 0.6; }
  // The ones you can name.
  tower(266, 5.2, 158, { shape: 'steps', col: '#05070c', mast: [0.47, 0.64], mastH: 24, lit: 0.26, blue: 0.5 });                 // the black stepped giant, twin masts
  tower(252, 3.6, 92, { col: '#3a1418', lit: 0.3 });                                                                               // the red one
  tower(20, 3.4, 150, { col: '#3b4252', stripes: 'rgba(210,220,235,0.16)', lit: 0.2, cw: 2, gx: 5, blue: 0.6 });                   // tall, white, plain as a ruler
  tower(12, 3.8, 132, { shape: 'point', col: '#1a2233', mast: 0.5, mastH: 18, lit: 0.28 });                                        // the chevron-topped one, with its spire
  tower(6.5, 4.6, 96, { col: '#181d2a', mast: 0.5, mastH: 30, lit: 0.3 });                                                         // the slab beside it, with the big aerial
  tower(356, 3.4, 104, { shape: 'diamond', col: '#1c2436', cap: 'rgba(255,255,255,0.25)', lit: 0.24 });                            // the one with the slanted diamond face
  tower(344, 2.4, 128, { col: '#141c2c', mast: 0.4, mastH: 26, lit: 0.22, blue: 0.7 });                                            // glass and a spire, farther off
  tower(30, 2.6, 118, { col: '#16283c', lit: 0.2, blue: 0.9 });                                                                    // the blue one, towards the lake
  tower(300, 3.2, 112, { shape: 'crown', col: '#0d121e', lit: 0.28 }); tower(318, 2.8, 124, { col: '#0a0e18', lit: 0.25, mast: 0.5, mastH: 16 });
  // The near rank: the wall of old masonry towers across the avenue, and the lower blocks round the park.
  for (let b = 196; b < 396;) { const bb = b % 360, c = city(bb), wd = 3 + r() * 3.6; if (c > 0) tower(bb + wd / 2, wd, (44 + r() * 44) * (bb > 232 && bb < 318 ? 1.2 : 0.8) * (0.6 + 0.4 * c), { col: '#070b14', lit: 0.34, cw: 5, ch: 8, gx: 10, gy: 15, shape: r() < 0.25 ? 'crown' : null }); b += wd + 0.15; }
  // Trees: Grant Park to the south and east, Millennium Park to the north. Bare, so a soft dark fringe.
  for (let d = 0; d < 360; d += 0.12) { const park = (d > 150 && d < 205) || (d > 28 && d < 44) || d > 335 || d < 12; if (!park) continue; const h = 5 + r() * 7 + (r() < 0.1 ? 5 : 0), x = px(d); g.fillStyle = '#05080f'; g.fillRect(x - 2, py(h), 4 + r() * 3, py(-BELOW) - py(h)); }
  // The lake itself, out to its horizon: dark water with a paler line where it meets the sky, and the moon's road on it.
  { const xa = px(46), xb = px(154), yh = py(6), yb = py(-BELOW); const wg = g.createLinearGradient(0, yh, 0, yb); wg.addColorStop(0, '#2a3a5e'); wg.addColorStop(0.12, '#16233f'); wg.addColorStop(1, '#0a1222');
    g.fillStyle = wg; g.fillRect(xa, yh, xb - xa, yb - yh); g.fillStyle = 'rgba(160,185,235,0.35)'; g.fillRect(xa, yh - 1, xb - xa, 2);
    for (let i = 0; i < 500; i++) { g.fillStyle = `rgba(150,175,225,${0.05 + r() * 0.12})`; g.fillRect(xa + r() * (xb - xa), yh + r() * (yb - yh), 5 + r() * 14, 1.3); }
    const mx = px(MOON); for (let i = 0; i < 420; i++) { const t = r(), y = yh + t * (yb - yh); g.fillStyle = `rgba(220,232,255,${0.2 + r() * 0.55})`; g.fillRect(mx + (r() - 0.5) * (14 + t * 90), y, 4 + r() * 12, 1.5); } }
  // Out on the water: the breakwater's light, and the far shore's, round to the south-east.
  for (const [b, c] of [[78, '#ff5a48'], [104, '#58e08a']]) { g.fillStyle = c; g.fillRect(px(b) - 2, py(3.2), 4, 4); }
  for (let d = 128; d < 168; d += 0.5 + r()) { g.fillStyle = `rgba(255,210,150,${0.25 + r() * 0.4})`; g.fillRect(px(d), py(1.2 + r()), 2, 2); }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; t.anisotropy = 4;
  return t;
}

/** The lake: a sheet of dark water east of the park, with the moon's road across it. */
export function lake(x0, x1, z0, z1, from, moon, bare = false) {
  const cw = 512, ch = 1024, cv = document.createElement('canvas'); cv.width = cw; cv.height = ch;
  const g = cv.getContext('2d'), r = rng(77);
  const gr = g.createLinearGradient(0, 0, cw, 0); gr.addColorStop(0, '#0a1222'); gr.addColorStop(1, '#1a2540'); g.fillStyle = gr; g.fillRect(0, 0, cw, ch);
  const X = x => (x - x0) / (x1 - x0) * cw, Z = z => (z - z0) / (z1 - z0) * ch;
  for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(150,175,225,${0.05 + r() * 0.1})`; g.fillRect(r() * cw, r() * ch, 6 + r() * 16, 1.5); }      // ripples
  // The moon's road: from the shore towards where the moon stands.
  const dx = moon.x - from.x, dz = moon.z - from.z, L = Math.hypot(dx, dz);
  for (let i = 0; i < 1500; i++) { const s = r() * 1.5, wob = (r() - 0.5) * (10 + s * 26), x = from.x + dx * s - dz / L * wob, z = from.z + dz * s + dx / L * wob; if (x < x0 || x > x1) continue; g.fillStyle = `rgba(215,228,255,${0.18 + r() * 0.5})`; g.fillRect(X(x), Z(z), 5 + r() * 12, 1.6); }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0), new THREE.MeshBasicMaterial({ map: t, fog: false }));
  m.rotation.x = -Math.PI / 2; m.position.set((x0 + x1) / 2, 0.12, (z0 + z1) / 2);
  // A line of lamps along the drive on the shore, and the dark of the park's trees before it.
  const shore = new THREE.Group(); shore.add(m);
  if (bare) return shore;                              // the shore itself is built: lakefront.js
  const dots = new THREE.InstancedMesh(new THREE.SphereGeometry(0.35, 6, 4), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 1.8, 1.0), fog: false }), 40), M = new THREE.Matrix4();
  for (let i = 0; i < 40; i++) dots.setMatrixAt(i, M.makeTranslation(x0 - 6, 5, z0 + (z1 - z0) * (i + 0.5) / 40));
  dots.frustumCulled = false; shore.add(dots);
  // Grant Park's bare trees, standing between the drive and the water.
  { const tw = 1024, tc = document.createElement('canvas'); tc.width = tw; tc.height = 64; const c = tc.getContext('2d'); c.fillStyle = '#04070d';
    for (let x = 0; x < tw; x += 2) { const hgt = 22 + r() * 26 + (r() < 0.08 ? 12 : 0); c.fillRect(x, 64 - hgt, 2 + r() * 3, hgt); }
    const tt = new THREE.CanvasTexture(tc); tt.colorSpace = THREE.SRGBColorSpace; tt.wrapS = THREE.RepeatWrapping; tt.repeat.set(4, 1);
    const trees = new THREE.Mesh(new THREE.PlaneGeometry(z1 - z0, 7), new THREE.MeshBasicMaterial({ map: tt, transparent: true, alphaTest: 0.5, fog: false }));
    trees.rotation.y = -Math.PI / 2; trees.position.set(x0 - 2, 3.5, (z0 + z1) / 2); shore.add(trees); }
  return shore;
}
