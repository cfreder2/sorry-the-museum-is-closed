// The sky of the voyage, all made here at the moment it is needed (src/voyage.js builds it only when the voyage
// starts, and throws it away when you fly home): the stars and the Milky Way, the Sun, the planets, the Earth with
// its night side lit by its cities and the Great Lakes showing dark among them, the Moon, a far spiral galaxy, and
// the streaks of a jump to hyperspace. Every picture is painted on a canvas from a few numbers: nothing is copied.
//
// The continents are rough outlines in longitude and latitude, drawn from general knowledge of the map; they are
// meant to read as the Earth, not to be surveyed.

import * as THREE from 'three';

export const TAU = Math.PI * 2;
const rnd = seed => () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// A direction from an azimuth (0 straight ahead, -z; 90 to the right, +x) and an elevation, in degrees.
export function dirAE(az, el) {
  const a = az * Math.PI / 180, e = el * Math.PI / 180;
  return new THREE.Vector3(Math.sin(a) * Math.cos(e), Math.sin(e), -Math.cos(a) * Math.cos(e));
}

function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function tex(c, srgb = true) { const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }

// Value noise, and noise of several sizes summed: the grain of every surface here.
function noise2(seed = 1) {
  const P = new Uint8Array(512), r = rnd(seed); for (let i = 0; i < 256; i++) P[i] = i;
  for (let i = 255; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [P[i], P[j]] = [P[j], P[i]]; }
  for (let i = 0; i < 256; i++) P[i + 256] = P[i];
  const V = new Float32Array(256); for (let i = 0; i < 256; i++) V[i] = r();
  const f = t => t * t * (3 - 2 * t);
  return (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y), xf = f(x - xi), yf = f(y - yi), X = xi & 255, Y = yi & 255;
    const a = V[P[P[X] + Y]], b = V[P[P[X + 1] + Y]], c = V[P[P[X] + Y + 1]], d = V[P[P[X + 1] + Y + 1]];
    return a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf;
  };
}
export function fbm(seed = 1) { const n = noise2(seed); return (x, y, oct = 4) => { let s = 0, a = 0.5, f = 1; for (let i = 0; i < oct; i++) { s += a * n(x * f, y * f); f *= 2.03; a *= 0.5; } return s / (1 - Math.pow(0.5, oct)); }; }

// ------------------------------------------------------------------ stars ---
const STAR_V = `attribute float size; attribute vec3 tint; varying vec3 vC; uniform float uScale; uniform float uDim;
void main() { vC = tint * uDim; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = size * uScale; }`;
const STAR_F = `varying vec3 vC; void main() { float d = length(gl_PointCoord - 0.5) * 2.0; float a = smoothstep(1.0, 0.0, d); a *= a; gl_FragColor = vec4(vC * a, a); }`;

function points(pos, size, tint, scale = 1) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('size', new THREE.Float32BufferAttribute(size, 1));
  g.setAttribute('tint', new THREE.Float32BufferAttribute(tint, 3));
  const m = new THREE.ShaderMaterial({ vertexShader: STAR_V, fragmentShader: STAR_F, uniforms: { uScale: { value: scale }, uDim: { value: 1 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const p = new THREE.Points(g, m); p.frustumCulled = false; return p;
}

// The stars, and the Milky Way across them, on a sphere of radius R (kept centred on the camera).
export function makeStarfield(R = 400000, pixel = 1, seed = 7, n = 5200) {
  const r = rnd(seed), pos = [], size = [], tint = [];
  const COL = [[0.75, 0.82, 1.0], [0.95, 0.96, 1.0], [1.0, 0.95, 0.85], [1.0, 0.85, 0.65], [1.0, 0.72, 0.55]];
  for (let i = 0; i < n; i++) {
    const u = r() * 2 - 1, a = r() * TAU, s = Math.sqrt(1 - u * u);
    pos.push(Math.cos(a) * s * R, u * R, Math.sin(a) * s * R);
    const m = Math.pow(r(), 6);                                     // most faint, a few bright
    size.push(1.1 + m * 4.2);
    const c = COL[Math.floor(r() * COL.length)], k = 0.35 + 0.65 * Math.sqrt(m) + 0.25 * r();
    tint.push(c[0] * k, c[1] * k, c[2] * k);
  }
  const stars = points(pos, size, tint, pixel);
  // The band: a great circle tilted across the sky, thick with faint stars, a warmer bulge at one point of it, and
  // soft clouds of light that run together.
  const bp = [], bs = [], bt = [], ax = new THREE.Vector3(0.35, 0.86, 0.37).normalize(), e1 = new THREE.Vector3(1, 0, 0).cross(ax).normalize(), e2 = ax.clone().cross(e1);
  const v = new THREE.Vector3(), gauss = () => (r() + r() + r() + r() - 2) / 2;
  for (let i = 0; i < 9000; i++) {
    const a = r() * TAU, core = Math.exp(-Math.pow(Math.atan2(Math.sin(a - 0.8), Math.cos(a - 0.8)) / 0.9, 2)), off = gauss() * (0.09 + 0.1 * core);
    v.copy(e1).multiplyScalar(Math.cos(a)).addScaledVector(e2, Math.sin(a)).addScaledVector(ax, off).normalize().multiplyScalar(R * 0.98);
    bp.push(v.x, v.y, v.z); bs.push(0.9 + r() * 1.4);
    const k = (0.14 + 0.3 * r()) * (0.6 + 0.8 * core), w = core * 0.35;
    bt.push(k * (0.8 + w), k * (0.82 + w * 0.6), k);
  }
  for (let i = 0; i < 520; i++) {
    const a = r() * TAU, core = Math.exp(-Math.pow(Math.atan2(Math.sin(a - 0.8), Math.cos(a - 0.8)) / 1.1, 2)), off = gauss() * 0.06;
    v.copy(e1).multiplyScalar(Math.cos(a)).addScaledVector(e2, Math.sin(a)).addScaledVector(ax, off).normalize().multiplyScalar(R * 0.97);
    bp.push(v.x, v.y, v.z); bs.push(40 + r() * 70);
    const k = 0.012 + 0.02 * core;
    bt.push(k * (1 + core * 0.5), k * (0.95 + core * 0.2), k * 1.1);
  }
  const band = points(bp, bs, bt, pixel);
  const g = new THREE.Group(); g.add(band, stars); g.userData.mats = [stars.material, band.material];
  return g;
}

// ------------------------------------------------------------------- sun ---
function glowTex(stops) {
  const c = canvas(256, 256), x = c.getContext('2d'), gr = x.createRadialGradient(128, 128, 0, 128, 128, 128);
  for (const [o, col] of stops) gr.addColorStop(o, col);
  x.fillStyle = gr; x.fillRect(0, 0, 256, 256); return tex(c);
}
export function makeSun(size = 30000) {
  const g = new THREE.Group();
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex([[0, 'rgba(255,250,235,1)'], [0.1, 'rgba(255,240,205,0.85)'], [0.3, 'rgba(255,205,140,0.3)'], [0.6, 'rgba(255,170,90,0.07)'], [1, 'rgba(255,140,60,0)']]), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: false }));
  halo.material.color.setRGB(5, 4.4, 3.6); halo.scale.setScalar(size); g.add(halo);
  const core = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex([[0, 'rgba(255,255,255,1)'], [0.35, 'rgba(255,255,245,1)'], [0.5, 'rgba(255,240,210,0.5)'], [1, 'rgba(255,230,200,0)']]), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: false }));
  core.material.color.setRGB(5, 5, 4.6); core.scale.setScalar(size * 0.16); g.add(core);
  return g;
}

// ----------------------------------------------------------------- earth ---
// [lon, lat] outlines. Rough, and meant to be.
const LAND = {
  northAmerica: [[-168, 66], [-162, 70], [-150, 71], [-140, 69.6], [-128, 70], [-115, 68.5], [-100, 68], [-95, 71.5], [-85, 69.5], [-81, 66], [-86, 63], [-93, 61], [-95, 59], [-92.5, 57], [-87, 55.8], [-82, 52.8], [-79.5, 51.5], [-78.5, 55.5], [-77, 60], [-78, 62.3], [-73, 62], [-69, 59], [-65, 60], [-61.5, 56.5], [-56, 52.5], [-59, 48], [-64.5, 49], [-66, 45], [-70.5, 43.5], [-70, 41.7], [-74, 40.6], [-75.5, 38.5], [-76.2, 36.9], [-75.6, 35.3], [-78, 33.8], [-81, 31.8], [-80.5, 28], [-80, 25.2], [-81.5, 25.3], [-82.8, 28], [-84, 30], [-86.5, 30.4], [-89.5, 30.2], [-90.5, 29], [-94, 29.6], [-97.2, 27.6], [-97.6, 24], [-97.3, 21.5], [-96, 19], [-94.5, 18.2], [-91, 18.7], [-90.4, 21], [-87, 21.5], [-87.6, 18.4], [-88.3, 16], [-84, 15.8], [-83.3, 12], [-83.7, 10.5], [-81.5, 8.8], [-79.5, 9.6], [-77.3, 8.6], [-77.9, 7.2], [-80, 7.3], [-80.6, 8.1], [-83.2, 8.3], [-85.7, 10.5], [-87.5, 13], [-91.5, 14], [-94.5, 16.1], [-97, 15.8], [-101, 17.2], [-105.5, 20], [-105.3, 22.8], [-108, 25.5], [-111, 28], [-112.8, 31], [-114.7, 30.5], [-112.3, 26.6], [-110, 23.2], [-112, 24.8], [-114.5, 28], [-115.8, 30.5], [-117.1, 32.6], [-120.6, 34.5], [-122.5, 37.5], [-123.8, 39.8], [-124.4, 43], [-124, 46.5], [-124.7, 48.4], [-123, 49], [-127.5, 50.7], [-130.4, 54.5], [-133, 57.5], [-137, 58.5], [-141, 60], [-146, 60.8], [-150, 59.3], [-152.5, 60.2], [-154, 57.5], [-158, 56.6], [-162, 55], [-158.5, 58.5], [-161.8, 59], [-164.5, 60.5], [-165.3, 62.3], [-163, 64.5], [-166.5, 65.5]],
  arctic: [[-120, 71.5], [-114, 73], [-105, 73.5], [-96, 75.5], [-90, 77], [-78, 80], [-65, 82.8], [-80, 83], [-100, 81], [-115, 78], [-125, 76], [-123, 73]],
  baffin: [[-91, 71], [-81, 73.6], [-70, 72], [-62, 67], [-64, 63], [-73, 64.5], [-78, 65], [-86, 68]],
  greenland: [[-55, 60], [-48, 60.5], [-42, 60], [-34, 66], [-22, 70.2], [-18, 76], [-18, 80], [-30, 83.5], [-50, 82.5], [-63, 81], [-71, 78], [-66, 76], [-58, 75.6], [-55, 71], [-53, 68], [-51.5, 64]],
  iceland: [[-24, 65.5], [-18, 66.5], [-13.5, 65], [-18, 63.4], [-22.5, 63.8]],
  cuba: [[-85, 22], [-80, 23.2], [-74.2, 20.2], [-77.5, 19.8], [-82, 22.5]],
  hispaniola: [[-74.5, 18.5], [-68.5, 18.5], [-70, 19.8], [-73, 19.9]],
  southAmerica: [[-80, 8.5], [-75, 11], [-71.5, 12.4], [-68, 10.6], [-62, 10.7], [-60, 8.5], [-52, 5], [-50, 1.8], [-48, -1], [-44, -2.5], [-39, -3.7], [-35, -5.5], [-35, -9], [-38, -13], [-39, -17.5], [-40.5, -22], [-44, -23], [-48, -26], [-48.7, -28.5], [-53, -33.8], [-57.5, -35], [-57, -38], [-62, -39], [-65, -41], [-64.5, -43], [-67.5, -46.5], [-66, -48], [-69, -51], [-68.5, -53], [-71, -55], [-74, -52.5], [-75.5, -48], [-74, -43.5], [-73.5, -39], [-71.6, -33], [-71.4, -27], [-70.3, -18.5], [-75.5, -15], [-78, -10], [-81.3, -5.5], [-80.3, -1], [-80, 1], [-78.5, 2.5], [-77.4, 4], [-77.5, 7]],
  europeAsia: [[-9.5, 37], [-9, 39], [-9, 43.5], [-2, 43.5], [-1.5, 46], [-4.5, 48.3], [-1, 49.5], [2, 51], [4, 52], [8, 54], [8.5, 57], [10.5, 57.7], [12, 56], [12.5, 54.5], [14, 54], [19, 54.5], [21, 57], [24, 59.5], [29, 60], [22.5, 60.4], [21.5, 63], [25, 65.5], [22, 66], [18, 63], [17, 61], [18.5, 60], [16, 56.5], [13, 55.5], [11, 58.5], [8, 58], [5.5, 59], [5, 62], [10, 64], [14, 67], [18, 69.8], [25, 71], [31, 70], [40, 68], [44, 68], [54, 68.5], [60, 69.5], [69, 73], [80, 73], [87, 75], [100, 78], [113, 76], [130, 72], [140, 72.5], [150, 71.5], [160, 70], [170, 70], [180, 68.5], [180, 65], [178, 62], [170, 60], [163, 58], [163, 55], [156, 51], [155, 57], [160, 61], [155, 59.5], [143, 59], [137, 54], [141, 52], [140, 48], [135, 43], [131, 43], [129, 40], [129, 35], [126, 35], [126, 37.5], [125, 40], [122, 40], [121.5, 38], [119, 37], [122, 32], [121, 28], [119, 25], [116, 22.8], [110, 21], [108, 21.5], [106, 19], [109, 12], [106, 9], [103, 10], [100, 13.5], [100, 9], [103, 5], [104, 1.5], [101, 3], [98, 8], [98.5, 13], [97, 16.5], [94, 16], [94, 19], [92, 21], [90, 22], [86, 20], [80, 15], [80, 11], [77.5, 8], [76, 10], [73, 17], [72.5, 21], [70, 22.5], [67, 24.5], [62, 25], [57, 25.5], [56, 27], [52, 28], [49, 30], [48, 30], [50, 26.5], [51.5, 24], [55, 25], [56.5, 24], [59, 22.5], [55, 17], [52, 16], [45, 13], [43, 12.7], [42.5, 15], [39, 21], [37, 24.5], [35, 28], [32.5, 30], [34, 31.3], [35.5, 33], [36, 35], [36, 36.8], [32, 36.5], [29, 36.5], [27, 37], [26.5, 39], [26.3, 40.3], [23, 40], [22.5, 37], [21, 38.5], [19.5, 41.5], [18.5, 42.5], [13.5, 45.5], [12.5, 44], [15.8, 41.9], [18.5, 40.2], [16, 38], [15.6, 40], [12, 41.9], [10.5, 43], [8.8, 44.4], [6, 43.1], [3, 43.3], [3.2, 42], [0.5, 40.5], [-0.5, 38.5], [-2, 36.7], [-5.6, 36], [-6.5, 36.9], [-8.8, 37]],
  britain: [[-5.7, 50], [1.4, 51.2], [1.7, 52.7], [0, 53.5], [-1.6, 55.6], [-2, 57.6], [-3, 58.6], [-5, 58.6], [-6.2, 57], [-5, 55], [-3, 54.9], [-3.3, 53.4], [-4.7, 52.8], [-5.3, 51.7], [-3, 51.4]],
  ireland: [[-10, 51.5], [-6, 52], [-6, 54], [-7.5, 55.3], [-10, 54.2]],
  africa: [[-17, 21], [-16.5, 15], [-17, 14.5], [-13, 8], [-8, 4.5], [-3, 5], [2, 6.2], [8.5, 4.5], [9.5, 3], [9.5, -1], [12, -5], [13.5, -11], [12, -17], [14.5, -23], [16.5, -28.5], [18.5, -34.5], [20, -34.8], [26, -34], [31, -29], [33, -26], [35.5, -24], [35, -20], [40.5, -15], [40, -10], [39.5, -6], [40.5, -2.5], [43, 0.5], [47, 4.5], [51, 10.5], [51.3, 12], [44, 10.5], [43.3, 12], [39.5, 15.5], [37, 19], [37, 22], [35, 23.5], [33.5, 27.5], [32.5, 30], [29, 30.8], [25, 31.5], [20, 32], [19.5, 30.5], [15, 32], [11, 33.3], [10.5, 36.5], [8, 37], [3, 36.8], [-1, 35.5], [-5.5, 35.8], [-6.5, 34], [-9.7, 30.5], [-13, 27.6]],
  madagascar: [[44, -25], [47, -25], [50.5, -15.5], [49.5, -12], [43.5, -17]],
  australia: [[114, -22], [114, -26], [115, -34], [118, -35], [124, -33], [129, -31.5], [134, -32.5], [138, -35.5], [140, -38], [144, -38.5], [147, -38], [150, -37], [153, -31], [153, -25], [150.5, -22], [146, -19], [145.5, -15], [143, -11], [142, -12], [141.5, -16], [139, -17.5], [136, -15], [136.5, -12], [132, -11.3], [129.5, -15], [125, -14], [122, -18], [119, -20]],
  japan: [[130, 31], [131, 34], [135, 34], [140, 35.5], [141, 38], [142, 42.5], [145, 43.5], [141.5, 45.5], [140, 41], [139.5, 38.5], [136.5, 37], [133, 35.5], [129.5, 33]],
  sumatra: [[95, 5.5], [98.5, 3.5], [106, -6], [104.5, -5.8], [100, -1], [95.5, 3]],
  java: [[105.5, -6.8], [114.5, -7.7], [114.3, -8.6], [106, -7.5]],
  borneo: [[109, 1.5], [111, -3], [116, -4], [119, 1], [117.5, 7], [115, 5], [111, 1.6]],
  newGuinea: [[131, -1], [141, -2.6], [150, -10.5], [143, -9], [138, -8], [133, -4]],
  philippines: [[120, 18.5], [122.5, 18.5], [124, 12.5], [126, 7], [123, 7], [121.5, 12], [120, 14.5]],
  newZealand: [[172.5, -34.5], [178.5, -37.7], [174.5, -41.5], [170.5, -46.5], [166.5, -46], [172.5, -40.5], [174.5, -36.5]],
  sriLanka: [[79.8, 9.8], [81.9, 7.5], [81.2, 6.1], [80, 6.2]],
};
// The Great Lakes, in the same rough way.
const LAKES = [
  [[-92.1, 46.7], [-90, 46.6], [-88, 47.4], [-86, 46.7], [-84.6, 46.5], [-84.8, 47.4], [-86, 48.5], [-88.5, 48.5], [-89.5, 48], [-91.2, 47.2]],      // Superior
  [[-87.8, 42.2], [-87.5, 41.65], [-86.8, 41.8], [-86.3, 42.3], [-86.2, 43.5], [-86.5, 44.5], [-85.6, 45.2], [-85, 45.8], [-86, 45.95], [-87, 45.7], [-87.6, 45.1], [-87.9, 44.3], [-87.7, 43.2]],      // Michigan
  [[-84.7, 45.9], [-83.5, 46.1], [-81.5, 45.9], [-80.5, 45.3], [-80, 44.6], [-81.4, 44.4], [-81.7, 43.2], [-82.4, 43], [-82.6, 44], [-83.4, 44], [-83.3, 45], [-84.3, 45.4]],      // Huron
  [[-83.4, 41.7], [-82, 41.5], [-80.5, 42], [-79, 42.7], [-78.9, 42.9], [-80.4, 42.6], [-81.8, 42.3], [-83.1, 42.1]],      // Erie
  [[-79.8, 43.3], [-78, 43.35], [-76.3, 43.5], [-76.2, 44.1], [-77, 44], [-79, 43.8], [-79.6, 43.6]],      // Ontario
  [[-97.5, 50.5], [-96.5, 50.4], [-96.2, 51.8], [-98.5, 53.8], [-99.2, 53.2], [-98, 51.5]],      // Winnipeg, for company
];
// Cities: [lon, lat, how bright].
const CITIES = [[-87.63, 41.88, 3.2], [-87.9, 43.04, 1.2], [-83.05, 42.33, 1.8], [-79.38, 43.65, 1.8], [-81.69, 41.5, 1.3], [-78.88, 42.89, 0.8], [-79.99, 40.44, 1.1], [-93.27, 44.98, 1.4], [-90.2, 38.63, 1.3], [-86.16, 39.77, 1.2], [-83, 39.96, 1.1], [-84.5, 39.1, 1.1], [-94.58, 39.1, 1.1], [-95.94, 41.26, 0.8], [-93.6, 41.6, 0.6], [-89.4, 43.07, 0.6], [-85.67, 42.96, 0.6], [-85.76, 38.25, 0.9], [-86.78, 36.16, 1], [-84.39, 33.75, 1.6], [-74, 40.71, 3], [-75.16, 39.95, 1.8], [-71.06, 42.36, 1.6], [-77.04, 38.9, 1.6], [-76.6, 39.29, 1.1], [-73.57, 45.5, 1.4], [-75.7, 45.42, 0.8], [-71.2, 46.8, 0.6], [-80.84, 35.23, 1], [-78.64, 35.78, 0.8], [-80.19, 25.76, 1.5], [-82.46, 27.95, 1.1], [-81.38, 28.54, 1], [-81.66, 30.33, 0.8], [-90.07, 29.95, 0.9], [-95.37, 29.76, 1.8], [-96.8, 32.78, 1.8], [-98.49, 29.42, 1.1], [-97.74, 30.27, 1], [-97.5, 35.47, 0.8], [-104.99, 39.74, 1.3], [-111.89, 40.76, 0.9], [-112.07, 33.45, 1.4], [-115.14, 36.17, 1.2], [-118.24, 34.05, 2.4], [-117.16, 32.72, 1.2], [-122.42, 37.77, 1.8], [-121.49, 38.58, 0.8], [-122.68, 45.52, 1], [-122.33, 47.61, 1.3], [-123.12, 49.28, 1], [-114.07, 51.05, 0.8], [-113.49, 53.55, 0.7], [-97.14, 49.9, 0.6], [-99.13, 19.43, 2.2], [-100.3, 25.67, 1], [-103.35, 20.67, 1], [-82.37, 23.11, 0.7], [-90.05, 35.15, 0.8], [-86.8, 33.52, 0.7], [-106.65, 35.08, 0.6], [-106.49, 31.76, 0.6], [-95.99, 36.15, 0.6], [-92.29, 34.75, 0.5], [-77.44, 37.54, 0.7], [-72.67, 41.76, 0.6], [-77.61, 43.16, 0.6], [-76.15, 43.05, 0.5], [-63.57, 44.65, 0.5], [-88.2, 41.75, 0.7], [-87.33, 41.6, 0.8], [-88.0, 42.3, 0.5], [-89.6, 40.7, 0.5],
  [-74.07, 4.71, 1.2], [-66.9, 10.48, 1], [-77.04, -12.05, 1.2], [-46.63, -23.55, 2], [-43.17, -22.9, 1.6], [-58.38, -34.6, 1.8], [-70.67, -33.45, 1.2], [-0.13, 51.5, 2], [2.35, 48.85, 1.8], [-3.7, 40.4, 1.3], [13.4, 52.5, 1.3], [12.5, 41.9, 1.2], [37.6, 55.75, 1.8], [28.97, 41.0, 1.6], [31.24, 30.04, 1.8], [3.38, 6.52, 1.4], [28.05, -26.2, 1.3], [77.2, 28.6, 2], [72.88, 19.07, 2], [116.4, 39.9, 2], [121.47, 31.23, 2.2], [139.69, 35.69, 2.6], [126.98, 37.57, 1.8], [151.2, -33.87, 1.3], [114.17, 22.32, 1.6], [106.85, -6.2, 1.6], [100.5, 13.75, 1.5], [51.4, 35.7, 1.3], [46.7, 24.7, 1.1], [55.3, 25.2, 1.1]];
// Roads between cities that show as threads of light.
const ROADS = [[0, 1], [0, 2], [0, 8], [0, 9], [0, 7], [0, 15], [2, 3], [2, 4], [4, 6], [6, 21], [20, 21], [20, 22], [21, 24], [24, 23], [9, 10], [10, 4], [9, 11], [8, 12], [12, 13], [17, 18], [18, 19], [19, 28], [28, 29], [29, 23], [20, 25], [25, 26], [3, 26], [5, 3], [5, 6], [35, 36], [36, 37], [37, 38], [38, 35], [44, 46], [46, 47], [44, 45], [42, 43], [43, 44], [48, 49], [49, 50]];

function ll(lon, lat, W, H) { return [(lon + 180) / 360 * W, (90 - lat) / 180 * H]; }
function poly(x, pts, W, H) { x.beginPath(); pts.forEach(([lo, la], i) => { const [px, py] = ll(lo, la, W, H); if (i) x.lineTo(px, py); else x.moveTo(px, py); }); x.closePath(); }

export function earthTextures(W = 2048, H = 1024) {
  const r = rnd(41), n = fbm(5);
  // land mask, for the cities to be scattered on
  const mask = canvas(W / 4, H / 4), mx = mask.getContext('2d');
  mx.fillStyle = '#000'; mx.fillRect(0, 0, mask.width, mask.height); mx.fillStyle = '#fff';
  for (const p of Object.values(LAND)) if (p.length) { poly(mx, p, mask.width, mask.height); mx.fill(); }
  mx.fillStyle = '#000'; for (const p of LAKES) { poly(mx, p, mask.width, mask.height); mx.fill(); }
  const md = mx.getImageData(0, 0, mask.width, mask.height).data;
  const onLand = (lon, lat) => { const [px, py] = ll(lon, lat, mask.width, mask.height); const i = (Math.floor(py) * mask.width + Math.floor(px)) * 4; return md[i] > 128; };

  // ---- the day side
  const day = canvas(W, H), d = day.getContext('2d');
  const sea = d.createLinearGradient(0, 0, 0, H); sea.addColorStop(0, '#16355a'); sea.addColorStop(0.5, '#0d3a6e'); sea.addColorStop(1, '#16355a');
  d.fillStyle = sea; d.fillRect(0, 0, W, H);
  d.fillStyle = '#3d5a2c'; for (const p of Object.values(LAND)) if (p.length) { poly(d, p, W, H); d.fill(); }
  // deserts and dry country
  const dry = [[-118, 38, 12, 8], [-108, 33, 10, 6], [-10, 23, 40, 10], [45, 24, 14, 8], [130, -25, 16, 8], [60, 40, 30, 8], [100, 42, 18, 6], [-70, -25, 4, 10], [18, -24, 8, 6]];
  for (const [lo, la, w, h] of dry) { const [px, py] = ll(lo, la, W, H); const g = d.createRadialGradient(px, py, 0, px, py, w / 360 * W); g.addColorStop(0, 'rgba(178,150,96,0.95)'); g.addColorStop(1, 'rgba(178,150,96,0)'); d.save(); d.globalCompositeOperation = 'source-atop'; d.fillStyle = g; d.beginPath(); d.ellipse(px, py, w / 360 * W, h / 180 * H, 0, 0, TAU); d.fill(); d.restore(); }
  // forests darker, the far north tundra-brown
  d.save(); d.globalCompositeOperation = 'source-atop';
  for (const [lo, la, w, h, col] of [[-65, -5, 18, 12, 'rgba(24,62,26,0.8)'], [20, 0, 12, 8, 'rgba(26,64,28,0.8)'], [-90, 55, 40, 7, 'rgba(48,66,40,0.6)'], [90, 60, 60, 8, 'rgba(70,72,52,0.6)']]) { const [px, py] = ll(lo, la, W, H); d.fillStyle = col; d.beginPath(); d.ellipse(px, py, w / 360 * W, h / 180 * H, 0, 0, TAU); d.fill(); }
  d.restore();
  // ice
  d.fillStyle = '#e8eef2'; poly(d, LAND.greenland, W, H); d.fill(); poly(d, LAND.arctic, W, H); d.fill();
  d.beginPath(); d.moveTo(0, H); for (let i = 0; i <= 64; i++) { const lon = -180 + i * 360 / 64, lat = -66 - 3 * n(i * 0.4, 3); const [px, py] = ll(lon, lat, W, H); d.lineTo(px, py); } d.lineTo(W, H); d.closePath(); d.fill();
  d.globalAlpha = 0.6; d.fillRect(0, 0, W, ll(0, 84, W, H)[1]); d.globalAlpha = 1;
  // the lakes
  d.fillStyle = '#123e70'; for (const p of LAKES) { poly(d, p, W, H); d.fill(); }
  // grain over everything, and a few clouds
  const gw = 512, gh = 256, grain = canvas(gw, gh), gx = grain.getContext('2d'), gd = gx.createImageData(gw, gh);
  for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) { const v = n(x / 22, y / 22, 5), i = (y * gw + x) * 4; gd.data[i] = gd.data[i + 1] = gd.data[i + 2] = 128 + (v - 0.5) * 120; gd.data[i + 3] = 255; }
  gx.putImageData(gd, 0, 0);
  d.save(); d.globalCompositeOperation = 'overlay'; d.globalAlpha = 0.55; d.drawImage(grain, 0, 0, W, H); d.restore();
  const cl = canvas(gw, gh), cx = cl.getContext('2d'), cd = cx.createImageData(gw, gh), cn = fbm(9);
  for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) { const v = cn(x / 30, y / 14, 5), i = (y * gw + x) * 4; cd.data[i] = cd.data[i + 1] = cd.data[i + 2] = 255; cd.data[i + 3] = clamp((v - 0.56) * 900, 0, 200); }
  cx.putImageData(cd, 0, 0);
  d.drawImage(cl, 0, 0, W, H);

  // ---- the night side: cities, the threads of road between them, the dark lakes among them
  const night = canvas(W, H), x = night.getContext('2d');
  x.fillStyle = '#000'; x.fillRect(0, 0, W, H);
  const density = (lon, lat) => {
    if (lat > 62 || lat < -45) return 0.01;
    if (lon > -100 && lon < -65 && lat > 25 && lat < 50) return 1;           // the east of North America
    if (lon > -125 && lon < -100 && lat > 30 && lat < 50) return 0.35;
    if (lon > -10 && lon < 40 && lat > 36 && lat < 60) return 1;             // Europe
    if (lon > 68 && lon < 90 && lat > 8 && lat < 32) return 0.9;             // India
    if (lon > 100 && lon < 145 && lat > 20 && lat < 45) return 0.85;         // east Asia
    if (lon > -15 && lon < 35 && lat > 14 && lat < 30) return 0.03;          // the Sahara
    if (lon > -75 && lon < -50 && lat > -15 && lat < 3) return 0.04;         // the Amazon
    if (lon > 60 && lat > 50) return 0.05;
    if (lon > 115 && lon < 150 && lat < -15 && lat > -32) return 0.03;       // the Outback
    return 0.2;
  };
  const dot = (px, py, rad, a, col = '255,196,120') => { const g = x.createRadialGradient(px, py, 0, px, py, rad); g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(1, `rgba(${col},0)`); x.fillStyle = g; x.fillRect(px - rad, py - rad, rad * 2, rad * 2); };
  for (let i = 0; i < 26000; i++) {
    const lon = r() * 360 - 180, lat = Math.asin(r() * 2 - 1) * 180 / Math.PI;
    if (!onLand(lon, lat) || r() > density(lon, lat)) continue;
    const [px, py] = ll(lon, lat, W, H); const b = 0.25 + 0.6 * r() * r();
    x.fillStyle = `rgba(255,${180 + Math.floor(r() * 50)},${100 + Math.floor(r() * 60)},${b})`; x.fillRect(px, py, 1 + (r() < 0.2 ? 1 : 0), 1);
  }
  for (const [a, b] of ROADS) {
    const A = CITIES[a], B = CITIES[b]; if (!A || !B) continue;
    for (let k = 0; k <= 1; k += 0.012) { const lon = A[0] + (B[0] - A[0]) * k, lat = A[1] + (B[1] - A[1]) * k + Math.sin(k * 9 + a) * 0.15; if (!onLand(lon, lat)) continue; const [px, py] = ll(lon, lat, W, H); x.fillStyle = `rgba(255,200,130,${0.18 + 0.2 * r()})`; x.fillRect(px, py, 1, 1); }
  }
  for (const [lon, lat, s] of CITIES) { const [px, py] = ll(lon, lat, W, H); dot(px, py, 2 + s * 2.4, Math.min(1, 0.45 + s * 0.2)); dot(px, py, 0.8 + s * 0.6, 1, '255,236,200'); }
  // the lakes are dark, and their shores are lit
  x.fillStyle = '#000'; for (const p of LAKES) { poly(x, p, W, H); x.fill(); }
  x.strokeStyle = 'rgba(255,190,110,0.35)'; x.lineWidth = 0.7; for (const p of LAKES.slice(0, 5)) { poly(x, p, W, H); x.stroke(); }

  return { day: tex(day, false), night: tex(night, false) };
}

const EARTH_V = `varying vec2 vUv; varying vec3 vN; varying vec3 vW;
void main() { vUv = uv; vN = normalize(mat3(modelMatrix) * normal); vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
const EARTH_F = `uniform sampler2D uDay; uniform sampler2D uNight; uniform vec3 uSun; uniform float uLights; varying vec2 vUv; varying vec3 vN; varying vec3 vW;
void main() {
  vec3 n = normalize(vN), v = normalize(cameraPosition - vW);
  float l = dot(n, uSun), dayK = smoothstep(-0.1, 0.22, l);
  vec3 d = texture2D(uDay, vUv).rgb, nt = texture2D(uNight, vUv).rgb;
  vec3 col = d * (0.02 + 1.05 * max(l, 0.0)) * dayK + d * vec3(0.05, 0.065, 0.1) * (1.0 - dayK) + nt * uLights * (1.0 - smoothstep(-0.08, 0.12, l));
  float rim = pow(1.0 - max(dot(n, v), 0.0), 2.6);
  col += vec3(0.22, 0.48, 1.0) * rim * (0.06 + 0.9 * smoothstep(-0.25, 0.45, l));
  col += vec3(1.0, 0.42, 0.12) * exp(-pow(l * 7.0, 2.0)) * 0.12 * (0.4 + rim);
  gl_FragColor = vec4(col, 1.0);
}`;
const HALO_F = `uniform vec3 uSun; varying vec3 vN; varying vec3 vW;
void main() { vec3 n = normalize(vN), v = normalize(cameraPosition - vW); float f = pow(max(0.0, 1.0 - abs(dot(n, v))), 4.0); float lit = 0.12 + 0.88 * smoothstep(-0.35, 0.35, dot(n, uSun));
  gl_FragColor = vec4(vec3(0.3, 0.6, 1.0) * f * lit * 1.4, 1.0); }`;

// The Earth, turned so that Chicago is straight up (+y) and north is ahead (-z). `sun` is the direction to the Sun.
export function makeEarth(radius, sun, textures) {
  const T = textures || earthTextures();
  const mat = new THREE.ShaderMaterial({ vertexShader: EARTH_V, fragmentShader: EARTH_F, uniforms: { uDay: { value: T.day }, uNight: { value: T.night }, uSun: { value: sun.clone().normalize() }, uLights: { value: 1.6 } } });
  const earth = new THREE.Mesh(new THREE.SphereGeometry(radius, 96, 64), mat);
  const halo = new THREE.Mesh(new THREE.SphereGeometry(radius * 1.03, 64, 40), new THREE.ShaderMaterial({ vertexShader: EARTH_V, fragmentShader: HALO_F, uniforms: { uSun: mat.uniforms.uSun }, side: THREE.BackSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  const g = new THREE.Group(); g.add(earth, halo);
  // three's sphere: a point at (lon, lat) sits at (-cos(phi) sin(theta), cos(theta), sin(phi) sin(theta)), phi = (lon + 180) deg, theta = 90 - lat
  const at = (lon, lat) => { const p = (lon + 180) * Math.PI / 180, t = (90 - lat) * Math.PI / 180; return new THREE.Vector3(-Math.cos(p) * Math.sin(t), Math.cos(t), Math.sin(p) * Math.sin(t)); };
  const up = at(-87.63, 41.88), north = at(-87.63, 42.88).sub(up).addScaledVector(up, -0.0).normalize();
  north.addScaledVector(up, -north.dot(up)).normalize();
  const east = north.clone().cross(up);
  const local = new THREE.Matrix4().makeBasis(east, up, north), world = new THREE.Matrix4().makeBasis(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, -1));
  const M = world.multiply(local.transpose());
  earth.quaternion.setFromRotationMatrix(M);
  g.userData = { earth, halo, mat, textures: T };
  return g;
}

// ------------------------------------------------------------- moon, planets ---
// A grey ball with dark seas and craters: the Moon seen from space (src/moon.js makes the ground you land on).
export function moonTexture(W = 1024, H = 512, seed = 3) {
  const c = canvas(W, H), x = c.getContext('2d'), n = fbm(seed), r = rnd(seed + 11);
  const img = x.createImageData(W, H);
  for (let y = 0; y < H; y++) for (let i = 0; i < W; i++) {
    const u = i / W, v = y / H, lon = u * TAU;
    const sx = Math.cos(lon) * 3, sz = Math.sin(lon) * 3, sy = v * 6;
    const m = n(sx + 7 + sy * 0.4, sz + sy * 1.1, 4), mare = clamp((m - 0.55) * 6, 0, 1);
    const g = 150 + (n(sx * 4 + 3, sz * 4 + sy * 4, 3) - 0.5) * 60 - mare * 62;
    const k = (y * W + i) * 4; img.data[k] = g; img.data[k + 1] = g * 0.98; img.data[k + 2] = g * 0.95; img.data[k + 3] = 255;
  }
  x.putImageData(img, 0, 0);
  for (let i = 0; i < 520; i++) {
    const px = r() * W, py = H * (0.08 + 0.84 * r()), rad = 1.5 + Math.pow(r(), 3) * 26;
    const sq = 1 / Math.max(0.25, Math.sin(py / H * Math.PI));
    x.save(); x.translate(px, py); x.scale(sq, 1);
    const g = x.createRadialGradient(-rad * 0.15, -rad * 0.15, rad * 0.2, 0, 0, rad);
    g.addColorStop(0, 'rgba(60,58,55,0.35)'); g.addColorStop(0.75, 'rgba(70,68,64,0.25)'); g.addColorStop(0.88, 'rgba(225,222,215,0.45)'); g.addColorStop(1, 'rgba(225,222,215,0)');
    x.fillStyle = g; x.beginPath(); x.arc(0, 0, rad, 0, TAU); x.fill(); x.restore();
  }
  return tex(c);
}
export function makeMoonBall(radius) {
  return new THREE.Mesh(new THREE.SphereGeometry(radius, 72, 48), new THREE.MeshStandardMaterial({ map: moonTexture(), roughness: 1, metalness: 0, color: 0xe6e2da }));
}

function bandTexture(stops, { W = 512, H = 256, seed = 1, turb = 0.04, spot = null } = {}) {
  const c = canvas(W, H), x = c.getContext('2d'), n = fbm(seed), img = x.createImageData(W, H);
  const col = t => { t = clamp(t, 0, 0.9999); const i = t * (stops.length - 1), a = Math.floor(i), f = i - a, A = stops[a], B = stops[Math.min(stops.length - 1, a + 1)]; return [A[0] + (B[0] - A[0]) * f, A[1] + (B[1] - A[1]) * f, A[2] + (B[2] - A[2]) * f]; };
  for (let y = 0; y < H; y++) for (let i = 0; i < W; i++) {
    const u = i / W, v = y / H, lon = u * TAU, ox = Math.cos(lon) * 2, oz = Math.sin(lon) * 2;
    const w = v + (n(ox * 2 + v * 3, oz * 2 + v * 9, 4) - 0.5) * turb * 4;
    let [rr, gg, bb] = col(w);
    const g = 0.85 + 0.3 * n(ox * 6, oz * 6 + v * 20, 3);
    const k = (y * W + i) * 4; img.data[k] = rr * g; img.data[k + 1] = gg * g; img.data[k + 2] = bb * g; img.data[k + 3] = 255;
  }
  x.putImageData(img, 0, 0);
  if (spot) { x.fillStyle = spot.col; x.beginPath(); x.ellipse(spot.u * W, spot.v * H, spot.w * W, spot.h * H, 0, 0, TAU); x.fill(); }
  return tex(c);
}

const PLANETS = {
  mercury: () => ({ map: moonTexture(512, 256, 21), color: 0xb9a596 }),
  venus: () => ({ map: bandTexture([[226, 206, 160], [238, 220, 176], [214, 186, 132], [236, 214, 170], [222, 200, 150]], { seed: 4, turb: 0.12 }) }),
  mars: () => {
    const t = bandTexture([[200, 120, 80], [178, 92, 58], [196, 112, 72], [150, 78, 52], [190, 108, 70]], { seed: 8, turb: 0.3 });
    const c = t.image, x = c.getContext('2d'); x.fillStyle = 'rgba(244,240,236,0.92)'; x.fillRect(0, 0, c.width, c.height * 0.06); x.fillRect(0, c.height * 0.95, c.width, c.height * 0.05);
    t.needsUpdate = true; return { map: t };
  },
  jupiter: () => ({ map: bandTexture([[226, 210, 186], [196, 160, 124], [236, 222, 200], [170, 128, 96], [230, 214, 190], [190, 150, 116], [222, 206, 182], [178, 140, 110], [226, 210, 190]], { seed: 12, turb: 0.035, spot: { u: 0.3, v: 0.62, w: 0.045, h: 0.035, col: 'rgba(196,110,76,0.85)' } }) }),
  saturn: () => ({ map: bandTexture([[232, 214, 170], [214, 190, 140], [236, 220, 180], [204, 180, 132], [226, 208, 164]], { seed: 15, turb: 0.02 }) }),
  uranus: () => ({ map: bandTexture([[176, 226, 232], [168, 220, 228], [184, 230, 236]], { seed: 18, turb: 0.01 }) }),
  neptune: () => ({ map: bandTexture([[64, 100, 206], [54, 88, 190], [76, 116, 220], [58, 92, 196]], { seed: 19, turb: 0.05, spot: { u: 0.6, v: 0.4, w: 0.04, h: 0.025, col: 'rgba(30,50,130,0.8)' } }) }),
};
export function makePlanet(kind, radius) {
  const o = PLANETS[kind]();
  const g = new THREE.Group();
  const ball = new THREE.Mesh(new THREE.SphereGeometry(radius, 48, 32), new THREE.MeshStandardMaterial({ roughness: 0.95, metalness: 0, ...o }));
  g.add(ball);
  if (kind === 'saturn') {
    const inner = radius * 1.25, outer = radius * 2.3, geo = new THREE.RingGeometry(inner, outer, 128, 1);
    const p = geo.attributes.position, uv = geo.attributes.uv, v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); uv.setXY(i, (v.length() - inner) / (outer - inner), 0.5); }
    const c = canvas(512, 4), x = c.getContext('2d'), r = rnd(5);
    for (let i = 0; i < 512; i++) { const t = i / 512, gap = t > 0.62 && t < 0.67 ? 0.08 : 1, a = (0.35 + 0.55 * r()) * gap * (t < 0.05 ? t / 0.05 : 1) * (t > 0.95 ? (1 - t) / 0.05 : 1); x.fillStyle = `rgba(${210 + r() * 30},${190 + r() * 30},${150 + r() * 30},${a})`; x.fillRect(i, 0, 1, 4); }
    const ring = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex(c), transparent: true, side: THREE.DoubleSide, roughness: 1, depthWrite: false }));
    ring.rotation.x = -Math.PI / 2 + 0.45; ring.rotation.y = 0.2; g.add(ring);
  }
  if (kind === 'uranus') ball.rotation.z = 1.6;
  return g;
}

// --------------------------------------------------------------- galaxy ---
// A spiral of a great many lights: two arms winding out from a warm core, dust lanes of nothing between them,
// pink knots where stars are being made.
export function makeGalaxy(radius = 9000, pixel = 1, n = 42000) {
  const r = rnd(99), pos = [], size = [], tint = [];
  const gauss = () => (r() + r() + r() + r() + r() + r() - 3) / 3;
  for (let i = 0; i < n; i++) {
    let x, y, z, c;
    if (i < n * 0.18) {                                              // the core
      const rr = Math.abs(gauss()) * radius * 0.16, a = r() * TAU;
      x = Math.cos(a) * rr; z = Math.sin(a) * rr; y = gauss() * radius * 0.05 * (1 - rr / radius);
      c = [1.0, 0.86 - r() * 0.1, 0.62];
    } else {
      const arm = i % 2, t = Math.pow(r(), 0.75), rr = radius * (0.12 + 0.88 * t), wind = Math.log(rr / (radius * 0.1)) / 0.32;
      const a = wind + arm * Math.PI + gauss() * (0.22 + 0.25 * (1 - t));
      x = Math.cos(a) * rr; z = Math.sin(a) * rr; y = gauss() * radius * 0.018;
      const k = r(); c = k < 0.035 ? [1.0, 0.45, 0.66] : k < 0.5 ? [0.62, 0.74, 1.0] : [0.9, 0.9, 1.0];
    }
    pos.push(x, y, z);
    const b = 0.25 + 0.75 * r() * r();
    size.push(1.0 + r() * 2.2); tint.push(c[0] * b, c[1] * b, c[2] * b);
  }
  // a glow under it all
  for (let i = 0; i < 260; i++) { const rr = Math.abs(gauss()) * radius * 0.5, a = r() * TAU; pos.push(Math.cos(a) * rr, 0, Math.sin(a) * rr); size.push(120 + r() * 220); const k = 0.035 * Math.exp(-rr / (radius * 0.3)); tint.push(k * 1.0, k * 0.85, k * 0.75); }
  const p = points(pos, size, tint, pixel);
  const g = new THREE.Group(); g.add(p); g.userData.mat = p.material;
  // far galaxies, smudges
  const fp = [], fs = [], ft = [];
  for (let i = 0; i < 140; i++) { const u = r() * 2 - 1, a = r() * TAU, s = Math.sqrt(1 - u * u), R = radius * 30; fp.push(Math.cos(a) * s * R, u * R, Math.sin(a) * s * R); fs.push(3 + r() * 5); const k = 0.15 + 0.2 * r(); ft.push(k, k * 0.9, k * 0.8); }
  const far = points(fp, fs, ft, pixel); g.userData.far = far;
  return g;
}

// --------------------------------------------------------- hyperspace ---
// Streaks of light rushing past along the way ahead. Laid out in the camera's own frame: forward is -z.
export class Streaks {
  constructor(n = 700) {
    const r = rnd(17); this.n = n; this.z = new Float32Array(n); this.rad = new Float32Array(n); this.ang = new Float32Array(n); this.spd = new Float32Array(n);
    for (let i = 0; i < n; i++) { this.z[i] = -r() * 400; this.rad[i] = 3 + Math.pow(r(), 0.7) * 45; this.ang[i] = r() * TAU; this.spd[i] = 0.7 + r() * 0.6; }
    const g = new THREE.BufferGeometry(); this.pos = new Float32Array(n * 6); const col = new Float32Array(n * 6);
    for (let i = 0; i < n; i++) { const k = 0.6 + 0.4 * r(), b = r() < 0.3; col.set([k * (b ? 0.7 : 1), k * (b ? 0.85 : 1), k, 0, 0, 0], i * 6); }
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    this.mesh = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 }));
    this.mesh.frustumCulled = false;
  }
  // speed: 0 (stars standing still) to 1 (full jump)
  update(dt, speed) {
    const len = 2 + speed * speed * 160, v = 40 + speed * 900;
    for (let i = 0; i < this.n; i++) {
      this.z[i] += v * this.spd[i] * dt;
      if (this.z[i] > 10) this.z[i] -= 420;
      const x = Math.cos(this.ang[i]) * this.rad[i], y = Math.sin(this.ang[i]) * this.rad[i], z = this.z[i];
      this.pos.set([x, y, z, x, y, z - len * this.spd[i]], i * 6);
    }
    this.mesh.geometry.attributes.position.needsUpdate = true;
    this.mesh.material.opacity = clamp(speed * 1.6, 0, 1);
  }
}

// Throw away everything under a group: geometry, materials and their textures.
export function disposeAll(root) {
  const seen = new Set();
  root.traverse(o => {
    if (o.geometry && !seen.has(o.geometry)) { seen.add(o.geometry); o.geometry.dispose(); }
    for (const m of [].concat(o.material || [])) {
      if (seen.has(m)) continue; seen.add(m);
      for (const k in m) { const v = m[k]; if (v && v.isTexture && !seen.has(v)) { seen.add(v); v.dispose(); } }
      if (m.uniforms) for (const k in m.uniforms) { const v = m.uniforms[k] && m.uniforms[k].value; if (v && v.isTexture && !seen.has(v)) { seen.add(v); v.dispose(); } }
      m.dispose();
    }
  });
}
