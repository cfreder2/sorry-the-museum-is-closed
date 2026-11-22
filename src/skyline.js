// The city and the lake, in the right places. The museum's front faces west across Michigan Avenue
// to a wall of old towers; the Loop's tall ones stand behind them, the cluster north of Millennium
// Park to the north, Grant Park's trees to the south, and to the east, beyond Columbus Drive and the
// park, Lake Michigan: flat, dark, and catching the moon.
//
// One painted panorama, a turn of the horizon wide. Bearings are a compass's: 0 north (-z), 90 east (+x).
// Every building is drawn here by hand: silhouettes and lit windows, nothing copied from a photograph.

import * as THREE from 'three';
import { rng } from './textures.js';

export const SPAN = 330, BELOW = 9;
const W = 4096, H = 1536;                 // the cylinder it goes on: 190 m tall, 9 of them below the ground
const py = y => H * (1 - (y + BELOW) / SPAN);                    // metres up -> pixels down
const px = b => { const t = Math.atan2(Math.sin(b * Math.PI / 180), -Math.cos(b * Math.PI / 180)); return ((t / (2 * Math.PI)) % 1 + 1) % 1 * W; };
const K = W / 360;
export const MOON = 68;                                          // where the moon stands: low in the east-north-east, over the water                                               // pixels to a degree

export function panorama() {
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const g = cv.getContext('2d'), r = rng(1893);
  const sky = g.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#04060f'); sky.addColorStop(0.6, '#0b152c'); sky.addColorStop(0.9, '#1f2a4c'); sky.addColorStop(0.972, '#3a3c5c'); sky.addColorStop(1, '#3a3c5c');
  g.fillStyle = sky; g.fillRect(0, 0, W, H);
  for (let k = 0; k < 1500; k++) { g.fillStyle = `rgba(255,255,255,${0.2 + r() * 0.7})`; const s = r() < 0.06 ? 2.2 : 1.1; g.fillRect(r() * W, r() * H * 0.7, s, s); }
  // The glow a city puts in the sky: over the Loop, none over the water.
  for (const [b, w, a] of [[285, 120, 0.3], [350, 80, 0.24], [200, 60, 0.1]]) for (const off of [-W, 0, W]) { const x = px(b) + off, gr = g.createRadialGradient(x, py(0), 10, x, py(0), w * K); gr.addColorStop(0, `rgba(255,170,110,${a})`); gr.addColorStop(1, 'rgba(255,170,110,0)'); g.fillStyle = gr; g.fillRect(x - w * K, 0, 2 * w * K, H); }

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
      else if (o.shape === 'pyramid') { g.moveTo(x, base); g.lineTo(x, top + w * 0.9); g.lineTo(x + w / 2, top); g.lineTo(x + w, top + w * 0.9); g.lineTo(x + w, base); }
      else if (o.shape === 'trio') { const s = py(0) - top; g.moveTo(x, base); g.lineTo(x, top + s * 0.36); g.lineTo(x + w * 0.33, top + s * 0.36); g.lineTo(x + w * 0.33, top + s * 0.16); g.lineTo(x + w * 0.66, top + s * 0.16); g.lineTo(x + w * 0.66, top); g.lineTo(x + w, top); g.lineTo(x + w, base); }
      else if (o.shape === 'crown') { g.moveTo(x, base); g.lineTo(x, top + w * 0.5); g.lineTo(x + w * 0.15, top + w * 0.5); g.lineTo(x + w * 0.15, top); g.lineTo(x + w * 0.85, top); g.lineTo(x + w * 0.85, top + w * 0.5); g.lineTo(x + w, top + w * 0.5); g.lineTo(x + w, base); }
      else { g.moveTo(x, base); g.lineTo(x, top); g.lineTo(x + w, top); g.lineTo(x + w, base); }
      g.closePath(); g.fill();
      if (o.stripes) { g.fillStyle = o.stripes; for (let sx = x + 2; sx < x + w - 1; sx += 5) g.fillRect(sx, top + 2, 2, base - top); }
      if (o.mast) { g.fillStyle = col; for (const m of [].concat(o.mast)) { g.fillRect(x + w * m - 1.5, top - o.mastH * H / SPAN, 3, o.mastH * H / SPAN + 4); g.fillStyle = '#ff5040'; g.fillRect(x + w * m - 2.5, top - o.mastH * H / SPAN - 3, 5, 5); g.fillStyle = col; } }
      if (o.cap) { g.fillStyle = o.cap; g.fillRect(x, top, w, 5); }
      if (o.edge) { g.fillStyle = o.edge; g.fillRect(x, top, 2, base - top); g.fillRect(x + w - 2, top, 2, base - top); }
      if (o.outline) { g.strokeStyle = o.outline; g.lineWidth = 3; g.beginPath(); if (o.shape === 'diamond') { g.moveTo(x, top + w * 1.1); g.lineTo(x + w / 2, top); g.lineTo(x + w, top + w * 1.1); g.lineTo(x + w / 2, top + w * 2.2); g.closePath(); } else if (o.shape === 'pyramid') { g.moveTo(x, top + w * 0.9); g.lineTo(x + w / 2, top); g.lineTo(x + w, top + w * 0.9); } g.stroke(); }
      if (o.crown) { const cy = top + (o.crownAt || 0) * w, gl = g.createRadialGradient(x + w / 2, cy, 2, x + w / 2, cy, w * 1.5); gl.addColorStop(0, o.crown); gl.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gl; g.fillRect(x - w, cy - w * 1.5, w * 3, w * 3); g.fillStyle = o.crown; g.fillRect(x + w * 0.1, cy, w * 0.8, o.crownH || 8); }
      const t0 = o.shape === 'diamond' ? top + w * 1.1 : o.shape === 'point' ? top + w * 1.3 : top;
      lights(x, t0, w, py(0), o.lit == null ? 0.3 : o.lit, o.cw || 4, o.ch || 6, o.gx || 8, o.gy || 11, o.blue == null ? 0.2 : o.blue);
    }
  };
  // How built-up the horizon is, by bearing: nothing over the lake, little over the park to the south.
  const city = b => (b >= 200 && b <= 360) || b <= 32 ? 1 : b > 32 && b < 48 ? (48 - b) / 16 : b > 172 && b < 200 ? 0.35 + 0.65 * (b - 172) / 28 : 0;
  // The far rank: the Loop behind, tallest to the west and north-west.
  for (let b = 0; b < 360;) { const c = city(b), wd = 2.4 + r() * 3.4; if (c > 0 && r() < 0.92) tower(b + wd / 2, wd, (70 + r() * 95) * (0.5 + 0.5 * c) * (b > 240 && b < 340 ? 1.2 : 1), { col: r() < 0.3 ? '#131c30' : '#0e1526', lit: 0.22, mast: r() < 0.12 ? 0.5 : null, mastH: 16, shape: r() < 0.18 ? 'crown' : null, cap: r() < 0.2 ? 'rgba(255,240,200,0.5)' : null }); b += wd + r() * 0.5; }
  // The ones you can name, placed by where they stand from the museum's door.
  tower(270, 7.5, 232, { shape: 'steps', col: '#04060a', mast: [0.47, 0.64], mastH: 44, lit: 0.3, blue: 0.45, cap: 'rgba(255,255,255,0.55)', edge: 'rgba(120,140,180,0.25)' });   // the black stepped giant, twin white masts
  tower(261, 3.4, 150, { col: '#141a2a', lit: 0.3, crown: 'rgba(255,255,255,0.9)', crownH: 12 });                                    // the one with the glowing glass drum on top
  tower(277.5, 4, 160, { shape: 'crown', col: '#1a2030', mast: [0.3, 0.7], mastH: 34, lit: 0.3 });                                   // twin spires
  tower(250, 5, 138, { col: '#5a1a1e', lit: 0.34, edge: 'rgba(255,120,110,0.25)' });                                                 // the red one
  tower(236, 4.4, 150, { shape: 'pyramid', col: '#0c1220', lit: 0.36, outline: 'rgba(255,220,150,0.5)', crown: 'rgba(90,170,255,0.95)', crownAt: 0.1, crownH: 10 });   // pyramid roof, blue beehive lantern
  tower(291, 4.6, 268, { col: '#152c4a', lit: 0.3, blue: 0.85, cw: 3, gx: 6, edge: 'rgba(140,190,255,0.35)', cap: 'rgba(160,210,255,0.6)' });   // tall, slim and blue, close by
  tower(301, 5, 150, { col: '#101622', lit: 0.3, shape: 'crown' });
  tower(10, 5, 222, { col: '#4a5264', stripes: 'rgba(225,232,245,0.22)', lit: 0.16, cw: 2, gx: 5, blue: 0.6, cap: 'rgba(255,255,255,0.7)' });   // tall, white, plain as a ruler
  tower(1, 5.4, 190, { shape: 'point', col: '#1c2538', mast: 0.5, mastH: 30, lit: 0.3, crown: 'rgba(255,245,220,0.8)', crownAt: 0.75, crownH: 6 });   // chevron top and spire
  tower(355, 6, 128, { col: '#1a2030', mast: 0.5, mastH: 46, lit: 0.34 });                                                           // the slab beside it, with the big aerial
  tower(346, 5, 150, { shape: 'diamond', col: '#1e2940', outline: 'rgba(255,255,255,0.85)', lit: 0.26 });                           // the slanted diamond face, outlined in light
  tower(338, 3, 176, { shape: 'trio', col: '#17243a', mast: 0.83, mastH: 40, lit: 0.26, blue: 0.75, edge: 'rgba(150,190,240,0.25)' });   // stepped glass and a spire, farther off
  tower(332, 2.6, 112, { col: '#0d1a14', lit: 0.3, crown: 'rgba(255,205,90,0.95)', crownH: 14, mast: 0.5, mastH: 14 });              // dark green with a gold top
  tower(19, 4.4, 178, { shape: 'trio', col: '#1a3350', lit: 0.24, blue: 0.9, cap: 'rgba(170,220,255,0.6)', edge: 'rgba(150,200,255,0.3)' });   // three stepped tubes of blue glass, by the river
  tower(26, 4, 120, { col: '#16283c', lit: 0.3, blue: 0.8 }); tower(31, 3.4, 96, { col: '#10202e', lit: 0.3, blue: 0.9 });
  // The near rank: the wall of old masonry towers across the avenue, and the lower blocks round the park.
  for (let b = 198; b < 398;) { const bb = b % 360, c = city(bb), wd = 4.5 + r() * 4.5; if (c > 0) tower(bb + wd / 2, wd, (58 + r() * 50) * (bb > 225 && bb < 322 ? 1.25 : 0.8) * (0.6 + 0.4 * c), { col: ['#070b14', '#0b0f18', '#0a0c12'][Math.floor(r() * 3)], lit: 0.4, cw: 6, ch: 10, gx: 12, gy: 18, shape: r() < 0.3 ? 'crown' : null, cap: r() < 0.35 ? 'rgba(255,225,170,0.45)' : null }); b += wd + 0.12; }
  // Trees: Grant Park to the south and east, Millennium Park to the north. Bare, so a soft dark fringe.
  for (let d = 0; d < 360; d += 0.12) { const park = (d > 150 && d < 205) || (d > 28 && d < 44) || d > 335 || d < 12; if (!park) continue; const h = 5 + r() * 7 + (r() < 0.1 ? 5 : 0), x = px(d); g.fillStyle = '#05080f'; g.fillRect(x - 2, py(h), 4 + r() * 3, py(-BELOW) - py(h)); }
  // The lake itself, out to its horizon: dark water with a paler line where it meets the sky, and the moon's road on it.
  { const xa = px(46), xb = px(154), yh = py(6), yb = py(-BELOW); const wg = g.createLinearGradient(0, yh, 0, yb); wg.addColorStop(0, '#2a3a5e'); wg.addColorStop(0.12, '#16233f'); wg.addColorStop(1, '#0a1222');
    g.fillStyle = wg; g.fillRect(xa, yh, xb - xa, yb - yh); g.fillStyle = 'rgba(160,185,235,0.35)'; g.fillRect(xa, yh - 1, xb - xa, 2);
    for (let i = 0; i < 500; i++) { g.fillStyle = `rgba(150,175,225,${0.05 + r() * 0.12})`; g.fillRect(xa + r() * (xb - xa), yh + r() * (yb - yh), 5 + r() * 14, 1.3); }
    const mx = px(MOON); for (let i = 0; i < 420; i++) { const t = r(), y = yh + t * (yb - yh); g.fillStyle = `rgba(220,232,255,${0.2 + r() * 0.55})`; g.fillRect(mx + (r() - 0.5) * (14 + t * 90), y, 4 + r() * 12, 1.5); } }
  // Out on the water: the breakwater's light, and the far shore's, round to the south-east.
  for (const [b, c] of [[104, '#58e08a']]) { g.fillStyle = c; g.fillRect(px(b) - 2, py(3.2), 4, 4); }      // (the breakwater's own light is built, and lit: harbour.js. A red one painted far off was taken for something to drive to.)
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
