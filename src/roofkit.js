// What the things on the roofs are made of (src/rooftops.js and its two companions): snow, brick, galvanised
// steel, weathered timber, gilt. Lit a little from within, as everything out of doors is here, so it reads at night.
import * as THREE from 'three';
import * as TX from './textures.js';

export const lit = (color, { glow = 0.38, ...o } = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.75, emissive: new THREE.Color(color).multiplyScalar(glow), ...o });

function canvasTex(w, h, draw, rx = 1, ry = 1, srgb = true) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.anisotropy = 4; return t;
}
export { canvasTex };

let M = null;
// The shared materials, made the first time they are asked for.
export function mats() {
  if (M) return M;
  const rnd = (s => () => (s = (s * 16807) % 2147483647) / 2147483647)(9);
  const snowT = TX.snow();                     // the same snow as on the roofs themselves (museum.js)
  const brickT = canvasTex(128, 128, (g, w, h) => {
    g.fillStyle = '#5a3a30'; g.fillRect(0, 0, w, h);
    for (let r = 0; r < 8; r++) for (let c = -1; c < 4; c++) { const x = c * 32 + (r % 2) * 16, y = r * 16, v = 0.75 + rnd() * 0.35; g.fillStyle = `rgb(${Math.round(150 * v)},${Math.round(72 * v)},${Math.round(52 * v)})`; g.fillRect(x + 1.5, y + 1.5, 29, 13); }
  });
  const woodT = canvasTex(64, 128, (g, w, h) => { g.fillStyle = '#7a5a3a'; g.fillRect(0, 0, w, h); for (let i = 0; i < 40; i++) { g.strokeStyle = `rgba(${rnd() > 0.5 ? '40,25,12' : '150,115,80'},${0.2 + rnd() * 0.3})`; g.lineWidth = 1 + rnd() * 2; const x = rnd() * w; g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + 4, h / 3, x - 4, h * 2 / 3, x + rnd() * 4, h); g.stroke(); } });
  M = {
    snow: new THREE.MeshStandardMaterial({ map: snowT, roughness: 0.95, emissiveMap: snowT, emissive: new THREE.Color(0.3, 0.36, 0.52), emissiveIntensity: 0.6 }),
    brick: new THREE.MeshStandardMaterial({ map: brickT, roughness: 0.9, emissive: 0x3a2018, emissiveIntensity: 0.6, emissiveMap: brickT }),
    stone: lit(0xc9c3b4, { roughness: 0.85 }),
    clay: lit(0xb0603a, { roughness: 0.8 }),
    steel: lit(0x9aa3ab, { metalness: 0.55, roughness: 0.4 }),
    dark: lit(0x24282e, { roughness: 0.6, glow: 0.5 }),
    wood: new THREE.MeshStandardMaterial({ map: woodT, color: 0xd8c0a0, roughness: 0.85, emissive: 0x3a2a1a, emissiveIntensity: 0.55 }),
    gilt: lit(0xd4a838, { metalness: 0.65, roughness: 0.3, glow: 0.45 }),
    red: lit(0xb3242b), green: lit(0x1f6a3a), cream: lit(0xf1e7cf), black: lit(0x101114, { glow: 0.3 }),
    warm: new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 1.5, 0.7) }),
    bulb: new THREE.MeshBasicMaterial({ color: new THREE.Color(2.0, 1.6, 0.9) }),
  };
  M.snowT = snowT; M.brickT = brickT; M.woodT = woodT;
  return M;
}

// A rounded cushion of snow lying on a flat top w x d, `h` deep: for the tops of chimneys, hives, posts.
export function snowCap(w, d, h = 0.08) {
  const g = new THREE.SphereGeometry(0.5, 14, 6, 0, Math.PI * 2, 0, Math.PI / 2); g.scale(w * 1.04, h * 2, d * 1.04); return g;
}

// A string of small lights, as one instanced mesh: pts is a list of [x, y, z]. Colours cycle through `cols`.
export function bulbs(pts, cols = [0xffd27a, 0xff6a5a, 0x7fe9f5, 0xb6ff8a], r = 0.035) {
  const m = new THREE.InstancedMesh(new THREE.SphereGeometry(r, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff }), pts.length), o = new THREE.Object3D(), c = new THREE.Color();
  pts.forEach(([x, y, z], i) => { o.position.set(x, y, z); o.updateMatrix(); m.setMatrixAt(i, o.matrix); m.setColorAt(i, c.set(cols[i % cols.length]).multiplyScalar(1.6)); });
  m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; return m;
}

// Points along a sagging wire from a to b ([x, y, z]), n of them.
export function sag(a, b, n, drop = 0.25) {
  const out = [];
  for (let i = 0; i <= n; i++) { const t = i / n; out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t - Math.sin(t * Math.PI) * drop, a[2] + (b[2] - a[2]) * t]); }
  return out;
}
