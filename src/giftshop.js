// The Museum Shop, off the lobby (features.js), fitted out properly and open for business after hours.
//   * Snow globes along the front, each holding a tiny working model of something far off in the building or out
//     on the ice. Shake one (drive up, E) and its snow swirls, the model comes to life, and the way there is lit.
//   * The till at the back: chips buy flags for the car's aerial, a hot chocolate (with marshmallows) for a burst
//     of speed, and little things for your own shelf behind the counter.
//   * A showroom corner: the special toys for sale (garage.js VEHICLES marked `showroom`, or failing that the ones
//     with a shop price), each turning on its plinth.
// Everything is built here (furnish.js leaves this room empty). Purchases are kept in localStorage.
import * as THREE from 'three';
import { fitText } from './textures.js';
import { feature } from './features.js';
import { VEHICLES, buildVehicle } from './garage.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const ROOM = 'F1-shop', STORE = 'after-hours.giftshop';
const rng = s => () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
// A line of lettering at its baseline y, in the font already set, but never wider than the card (fitText).
const fitAt = (c, t, w, y) => { const m = c.font.match(/^(.*?)\s*([\d.]+)px\s+(.*)$/), px = +m[2]; const f = c.font; fitText(c, t, { x: w / 2, y: y - px * 0.34, w: w - 26, h: px * 1.2, px, weight: m[1] || '400', family: m[3] }); c.font = f; };
const tex = (w, h, draw) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };

// ---------------------------------------------------------------- merged, vertex-coloured geometry
// Every fixed thing in the shop is one of a handful of meshes: parts are added with a colour and merged.
class Kit {
  constructor() { this.parts = []; this._m = new THREE.Matrix4(); this._q = new THREE.Quaternion(); this._e = new THREE.Euler(); this._p = new THREE.Vector3(); this._s = new THREE.Vector3(1, 1, 1); }
  add(geo, hex, x, y, z, ry = 0, rx = 0, rz = 0) {
    const g = geo.index ? geo : geo; g.deleteAttribute('uv'); if (g.attributes.uv1) g.deleteAttribute('uv1');
    const c = new THREE.Color(hex), n = g.attributes.position.count, a = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; }
    g.setAttribute('color', new THREE.BufferAttribute(a, 3));
    this._e.set(rx, ry, rz); this._q.setFromEuler(this._e); this._p.set(x, y, z);
    g.applyMatrix4(this._m.compose(this._p, this._q, this._s)); this.parts.push(g.index ? g.toNonIndexed() : g); return g;
  }
  box(w, h, d, hex, x, y, z, ry = 0) { return this.add(new THREE.BoxGeometry(w, h, d), hex, x, y, z, ry); }
  // a box from its corners (y0 to y1 up)
  span(x0, x1, y0, y1, z0, z1, hex) { return this.box(x1 - x0, y1 - y0, z1 - z0, hex, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); }
  cyl(r0, r1, h, hex, x, y, z, n = 12, rx = 0, rz = 0, ry = 0) { return this.add(new THREE.CylinderGeometry(r0, r1, h, n), hex, x, y, z, ry, rx, rz); }
  mesh(mat) { if (!this.parts.length) return null; const m = new THREE.Mesh(mergeGeometries(this.parts), mat); this.parts = []; return m; }
}
// Lit a little from within, by its own colour, so the shop reads at night with the lights off.
function glowing(k = 0.22, o = {}) {
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.65, metalness: 0.05, ...o });
  m.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>\n  totalEmissiveRadiance += vColor.rgb * ${k.toFixed(3)};`); };
  m.customProgramCacheKey = () => 'shopglow' + k;
  return m;
}

// ---------------------------------------------------------------- what is for sale
// Flags for the aerial, each drawn here. (Designs of our own: a lion, a snowflake, a chequer, four stars, a sun, a palette.)
const FLAGS = [
  { id: 'lion', name: 'Lion', price: 80, line: 'A gold lion on red, for the two on the steps.', draw(c, w, h) { c.fillStyle = '#a3201e'; c.fillRect(0, 0, w, h); c.fillStyle = '#f2c450'; lion(c, w * 0.5, h * 0.55, h * 0.36); } },
  { id: 'snow', name: 'Snowflake', price: 60, line: 'White on winter blue.', draw(c, w, h) { c.fillStyle = '#1f4f8c'; c.fillRect(0, 0, w, h); flake(c, w / 2, h / 2, h * 0.34); } },
  { id: 'chequer', name: 'Chequered', price: 100, line: 'For the race.', draw(c, w, h) { const n = 8, s = w / n; for (let i = 0; i < n; i++) for (let j = 0; j < Math.ceil(h / s); j++) { c.fillStyle = (i + j) % 2 ? '#111' : '#f4f4f0'; c.fillRect(i * s, j * s, s, s); } } },
  { id: 'stars', name: 'Four Stars', price: 120, line: 'Two blue stripes, four red stars.', draw(c, w, h) { c.fillStyle = '#f6f6f2'; c.fillRect(0, 0, w, h); c.fillStyle = '#7fc4ea'; c.fillRect(0, h * 0.17, w, h * 0.13); c.fillRect(0, h * 0.7, w, h * 0.13); c.fillStyle = '#d8232a'; for (let i = 0; i < 4; i++) star6(c, w * (0.2 + i * 0.2), h * 0.5, h * 0.12); } },
  { id: 'sun', name: 'Sun', price: 90, line: 'A low winter sun on teal.', draw(c, w, h) { c.fillStyle = '#167a7a'; c.fillRect(0, 0, w, h); c.fillStyle = '#f7c548'; c.beginPath(); c.arc(w / 2, h / 2, h * 0.2, 0, 7); c.fill(); c.strokeStyle = '#f7c548'; c.lineWidth = h * 0.05; for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; c.beginPath(); c.moveTo(w / 2 + Math.cos(a) * h * 0.28, h / 2 + Math.sin(a) * h * 0.28); c.lineTo(w / 2 + Math.cos(a) * h * 0.42, h / 2 + Math.sin(a) * h * 0.42); c.stroke(); } } },
  { id: 'palette', name: 'Palette', price: 150, line: 'Six dabs of paint on a painter’s palette.', draw(c, w, h) { c.fillStyle = '#2b2b33'; c.fillRect(0, 0, w, h); c.fillStyle = '#c99a5b'; c.beginPath(); c.ellipse(w / 2, h / 2, w * 0.36, h * 0.36, 0, 0, 7); c.fill(); c.fillStyle = '#2b2b33'; c.beginPath(); c.arc(w * 0.62, h * 0.62, h * 0.08, 0, 7); c.fill(); ['#d8232a', '#f2c450', '#2c5fb0', '#3a9a4a', '#f4f4f0', '#8a3aa0'].forEach((col, i) => { const a = -2.6 + i * 0.75; c.fillStyle = col; c.beginPath(); c.arc(w / 2 + Math.cos(a) * w * 0.24, h / 2 + Math.sin(a) * h * 0.24, h * 0.07, 0, 7); c.fill(); }); } },
];
// Things for your shelf behind the till.
const SHELF = [
  { id: 'toylion', name: 'Bronze lion', price: 60, line: 'A little one of the lions out front.', icon: '#9a6b34' },
  { id: 'paperweight', name: 'Glass paperweight', price: 90, line: 'Millefiori, like the ones upstairs.', icon: '#3fa0c8' },
  { id: 'robot', name: 'Tin robot', price: 120, line: 'Wind it up. It patrols your shelf.', icon: '#b8bec6' },
  { id: 'frame', name: 'Gilded frame', price: 150, line: 'Empty, for now.', icon: '#d4a63a' },
  { id: 'minithorne', name: 'Tiny room', price: 200, line: 'A room in a box, an inch to the foot.', icon: '#8a5a3a' },
];
const TREATS = [
  { id: 'cocoa', name: 'Hot chocolate', price: 25, line: 'With marshmallows. Thirty seconds of extra pep.' },
];

function lion(c, x, y, s) { c.beginPath(); c.ellipse(x - s * 0.1, y + s * 0.1, s * 0.9, s * 0.38, 0, 0, 7); c.fill(); c.beginPath(); c.arc(x + s * 0.7, y - s * 0.25, s * 0.42, 0, 7); c.fill(); c.fillRect(x - s * 0.9, y + s * 0.2, s * 0.18, s * 0.6); c.fillRect(x + s * 0.5, y + s * 0.2, s * 0.18, s * 0.6); c.beginPath(); c.moveTo(x - s, y); c.quadraticCurveTo(x - s * 1.5, y - s * 0.6, x - s * 1.2, y - s * 0.9); c.lineWidth = s * 0.12; c.strokeStyle = c.fillStyle; c.stroke(); }
function flake(c, x, y, r) { c.strokeStyle = '#f4f8ff'; c.lineWidth = r * 0.14; c.lineCap = 'round'; for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3, ex = x + Math.cos(a) * r, ey = y + Math.sin(a) * r; c.beginPath(); c.moveTo(x, y); c.lineTo(ex, ey); c.stroke(); for (const t of [0.5, 0.75]) { const mx = x + Math.cos(a) * r * t, my = y + Math.sin(a) * r * t; for (const s of [-1, 1]) { c.beginPath(); c.moveTo(mx, my); c.lineTo(mx + Math.cos(a + s * 0.8) * r * 0.25, my + Math.sin(a + s * 0.8) * r * 0.25); c.stroke(); } } } }
function star6(c, x, y, r) { c.beginPath(); for (let i = 0; i < 12; i++) { const a = -Math.PI / 2 + i * Math.PI / 6, rr = i % 2 ? r * 0.45 : r; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } c.closePath(); c.fill(); }
const flagTex = f => tex(128, 84, (c, w, h) => f.draw(c, w, h));

// The height of the snowy ground inside a globe, r from its middle (a low mound, 0.1 below the ball's centre).
const snowAt = r => -0.1 + 0.0208 * Math.sqrt(Math.max(0, 1 - (r / 0.1735) ** 2)) + 0.003;

// ---------------------------------------------------------------- the snow globes' little worlds
// Each builds into `g` (inside a globe of radius ~0.2, its floor at y = -0.1) and returns step(t, live): live is
// 0 at rest and 1 just after a shake. `to` is the id of the place it shows, as the features list it (spots()).
const S = (hex, o = {}) => new THREE.MeshStandardMaterial({ color: hex, roughness: 0.6, emissive: hex, emissiveIntensity: 0.35, ...o });
const B = (g, w, h, d, m, x, y, z) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); g.add(o); return o; };
const C = (g, r0, r1, h, m, x, y, z, n = 10) => { const o = new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, h, n), m); o.position.set(x, y, z); g.add(o); return o; };
const GLOBES = [
  { to: 'cancan', name: 'The can-can', where: 'Gallery 242', build(g) {
    const tiles = []; for (let i = 0; i < 9; i++) { const m = S(0x3a2030); tiles.push(B(g, 0.05, 0.008, 0.05, m, -0.055 + (i % 3) * 0.055, -0.096, -0.055 + Math.floor(i / 3) * 0.055)); }
    const dancers = [-0.05, 0, 0.05].map((x, i) => { const d = new THREE.Group(); d.position.set(x, -0.092, 0.02); g.add(d);
      C(d, 0.004, 0.022, 0.03, S([0xd8232a, 0xf4f0e6, 0x1a1a1a][i]), 0, 0.02, 0, 12); C(d, 0.006, 0.008, 0.025, S(0xf0c8a8), 0, 0.045, 0); const h = new THREE.Mesh(new THREE.SphereGeometry(0.008, 8, 6), S(0xf0c8a8)); h.position.y = 0.064; d.add(h);
      const leg = C(d, 0.003, 0.003, 0.03, S(0xf4f0e6), 0.006, 0.0, 0); leg.geometry.translate(0, -0.012, 0); d.userData.leg = leg; return d; });
    return (t, live) => { const sp = 1 + live * 4; tiles.forEach((m, i) => m.material.emissive.setHex(Math.floor(t * sp * 2 + i * 1.7) % 4 === 0 ? 0xff5aa0 : 0x3a2030)); dancers.forEach((d, i) => { d.userData.leg.rotation.z = Math.max(0, Math.sin(t * sp * 5 + i)) * 1.6; d.rotation.y = t * sp * (i - 1) * 0.6; }); };
  } },
  { to: 'thorne', name: 'The Thorne Rooms', where: 'the lower level', build(g) {
    const wall = S(0x7a5a8a), floor = S(0x6a4a2a); B(g, 0.15, 0.008, 0.1, floor, 0, -0.096, 0); B(g, 0.15, 0.11, 0.008, wall, 0, -0.04, -0.05); B(g, 0.008, 0.11, 0.1, wall, -0.075, -0.04, 0); B(g, 0.008, 0.11, 0.1, wall, 0.075, -0.04, 0);
    B(g, 0.04, 0.035, 0.012, S(0xd8d0c0), 0, -0.075, -0.043); const fire = B(g, 0.02, 0.012, 0.004, new THREE.MeshBasicMaterial({ color: 0xff8a2a }), 0, -0.084, -0.038);
    B(g, 0.03, 0.004, 0.02, S(0x5a3020), -0.035, -0.072, 0.01); for (const sx of [-1, 1]) B(g, 0.003, 0.02, 0.003, S(0x5a3020), -0.035 + sx * 0.012, -0.084, 0.01);
    B(g, 0.03, 0.04, 0.004, new THREE.MeshBasicMaterial({ color: 0xffe0a0 }), 0.04, -0.05, -0.045);
    const mouse = new THREE.Mesh(new THREE.SphereGeometry(0.006, 8, 6), S(0x8a8a8a)); mouse.scale.set(1.6, 1, 1); g.add(mouse);
    return (t, live) => { fire.scale.y = 0.7 + Math.sin(t * 17) * 0.3; const a = t * (0.6 + live * 2.5); mouse.position.set(Math.sin(a) * 0.05, -0.088, 0.02 + Math.cos(a) * 0.02); mouse.rotation.y = -a; };
  } },
  { to: 'icefish', name: 'Ice fishing', where: 'the harbour', build(g) {
    const water = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.05, 24), S(0x0c3a4a, { transparent: true, opacity: 0.9 })); water.position.y = -0.075; g.add(water);
    const ice = new THREE.Mesh(new THREE.CylinderGeometry(0.132, 0.132, 0.008, 24), new THREE.MeshStandardMaterial({ color: 0xcfe6f2, transparent: true, opacity: 0.35, roughness: 0.1, emissive: 0x6a8aa0, emissiveIntensity: 0.4 })); ice.position.y = -0.046; g.add(ice);
    const hut = new THREE.Group(); hut.position.set(0.05, -0.042, -0.03); g.add(hut); B(hut, 0.05, 0.04, 0.04, S(0x7a4a2a), 0, 0.02, 0); B(hut, 0.056, 0.006, 0.046, S(0xeef3f8), 0, 0.043, 0); B(hut, 0.012, 0.01, 0.002, new THREE.MeshBasicMaterial({ color: 0xffc070 }), 0.01, 0.025, 0.021);
    const fish = [0, 1, 2].map(i => { const f = new THREE.Mesh(new THREE.SphereGeometry(0.009, 8, 6), S([0xc8ac38, 0xc8ac38, 0xc9d6d6][i])); f.scale.set(2.2, 0.8, 0.7); g.add(f); return f; });
    const line = B(g, 0.0015, 0.05, 0.0015, S(0xffffff), -0.04, -0.03, 0.03);
    return (t, live) => { fish.forEach((f, i) => { const a = t * (0.5 + live * 1.5) * (i % 2 ? -1 : 1) + i * 2.1, r = 0.06 + i * 0.03; f.position.set(Math.cos(a) * r, -0.078 - i * 0.006, Math.sin(a) * r); f.rotation.y = -a + (i % 2 ? Math.PI / 2 : -Math.PI / 2); }); line.position.y = -0.03 + Math.sin(t * 6) * 0.004 * live; };
  } },
  { to: 'goingup', name: 'The glass lift', where: 'the Modern Wing', build(g) {
    const white = S(0xe9edf2); B(g, 0.12, 0.12, 0.05, white, 0.03, -0.04, -0.02); B(g, 0.16, 0.004, 0.08, S(0xf4f6f8), 0.02, 0.022, -0.01);
    const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.15, 0.035), new THREE.MeshStandardMaterial({ color: 0x9fd0e8, transparent: true, opacity: 0.25, emissive: 0x3a6a88, emissiveIntensity: 0.4 })); shaft.position.set(-0.055, -0.025, 0.02); g.add(shaft);
    const car = B(g, 0.028, 0.03, 0.028, new THREE.MeshStandardMaterial({ color: 0xbfe8ff, transparent: true, opacity: 0.6, emissive: 0x6ab0e0, emissiveIntensity: 0.9 }), -0.055, -0.08, 0.02);
    const toy = B(g, 0.012, 0.006, 0.016, S(0xd8232a), -0.055, -0.092, 0.02);
    return (t, live) => { const y = -0.08 + (0.5 - 0.5 * Math.cos(t * (0.5 + live * 1.5))) * 0.1; car.position.y = y; toy.position.y = y - 0.012; };
  } },
  { to: 'joust', name: 'The joust', where: 'Gallery 239', build(g) {
    B(g, 0.17, 0.004, 0.09, S(0x6a5a3a), 0, -0.097, 0); B(g, 0.15, 0.015, 0.004, S(0xb08a3a), 0, -0.087, 0);
    const knights = [-1, 1].map(s => { const k = new THREE.Group(); g.add(k); B(k, 0.035, 0.016, 0.012, S(s < 0 ? 0x3a2a1a : 0xe8e0d0), 0, 0.016, 0); for (const lx of [-0.012, 0.012]) B(k, 0.004, 0.016, 0.004, S(0x3a2a1a), lx, 0.006, 0); B(k, 0.008, 0.016, 0.008, S(0xb8bec6, { metalness: 0.6 }), 0, 0.032, 0); const lance = B(k, 0.05, 0.003, 0.003, S(s < 0 ? 0xd8232a : 0x2c5fb0), s * 0.02, 0.034, 0); k.userData = { s, lance }; k.rotation.y = s < 0 ? 0 : Math.PI; return k; });
    return (t, live) => { const p = Math.sin(t * (0.6 + live * 2)) ; knights.forEach(k => { k.position.set(-k.userData.s * 0.06 * p * -1, -0.097, k.userData.s * 0.022); }); };
  } },
  { to: 'sledding', name: 'The sledding run', where: 'Butler Field', build(g) {
    const snow = S(0xe8f0f8); const pts = [[-0.07, -0.02, -0.05], [0.07, -0.045, -0.05], [0.07, -0.06, 0.0], [-0.07, -0.08, 0.0], [-0.07, -0.09, 0.05], [0.07, -0.098, 0.05]];
    for (let i = 0; i < pts.length - 1; i++) { const a = new THREE.Vector3(...pts[i]), b = new THREE.Vector3(...pts[i + 1]), m = a.clone().add(b).multiplyScalar(0.5), l = a.distanceTo(b); const o = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.006, l), snow); o.position.copy(m); o.lookAt(b); o.position.y -= 0.006; g.add(o); }
    C(g, 0.006, 0.008, 0.06, S(0x6a4a2a), -0.08, -0.06, -0.05); const sled = B(g, 0.012, 0.004, 0.022, S(0xd8232a), 0, 0, 0);
    return (t, live) => { const u = (t * (0.15 + live * 0.5)) % 1, f = u * (pts.length - 1), i = Math.floor(f), a = new THREE.Vector3(...pts[i]), b = new THREE.Vector3(...pts[Math.min(i + 1, pts.length - 1)]); sled.position.lerpVectors(a, b, f - i); sled.lookAt(b.x, sled.position.y, b.z); };
  } },
];

// ---------------------------------------------------------------- the shop
feature({
  id: 'giftshop',
  secrets: [['globes', 'Every snow globe shaken'], ['shelf', 'A full shelf']],
  init(k) {
    this.k = k; const r = k.plan.byId[ROOM]; if (!r) return;
    this.r = r; this.y = r.y; this.state = this._load();
    k.keeps('shelf', () => this.state.shelf.length >= SHELF.length); k.keeps('globes', () => this.state.globes.length >= GLOBES.length);      // (what you bought and shook is kept, so their secrets are: features.js)
    const g = this.g = new THREE.Group(); g.position.y = r.y; k.group.add(g);
    const kit = new Kit(), glass = new Kit(), light = new Kit(), rnd = rng(77);
    const O = (x0, x1, z0, z1, y1) => k.plan.obstacles.push({ x0, x1, z0, z1, y0: r.y - 0.2, y1: r.y + y1 });
    const X0 = r.x0, X1 = r.x1, Z0 = r.z0, Z1 = r.z1, CX = (X0 + X1) / 2;
    const WOOD = 0x6e4a2c, DARK = 0x2a2420, CREAM = 0xe8dfca, BRASS = 0xc9a24a;
    // ---- wall shelving down both long walls: dark wood, lit shelves, stock on every one
    const shelfRun = (x, z0, z1, side) => {      // side: +1 the shelf faces +x (west wall), -1 faces -x (east wall)
      const d = 0.42, xb = x, xf = x + side * d;
      kit.span(Math.min(xb, xf), Math.max(xb, xf), 0, 2.5, z0, z0 + 0.05, DARK); kit.span(Math.min(xb, xf), Math.max(xb, xf), 0, 2.5, z1 - 0.05, z1, DARK);
      kit.span(Math.min(xb, xb + side * 0.04), Math.max(xb, xb + side * 0.04), 0, 2.5, z0, z1, 0x3a2f28);
      kit.span(Math.min(xb, xf), Math.max(xb, xf), 0, 0.12, z0, z1, DARK);
      for (let y = 0.12; y < 2.45; y += 0.47) {
        kit.span(Math.min(xb, xf), Math.max(xb, xf), y, y + 0.025, z0, z1, WOOD);
        light.span(Math.min(xb + side * 0.05, xf), Math.max(xb + side * 0.05, xf), y + 0.44, y + 0.447, z0 + 0.06, z1 - 0.06, 0xfff0c8);
        // the stock: books standing, mugs, print tubes, folded scarves, boxed puzzles, little lions
        let z = z0 + 0.08;
        while (z < z1 - 0.12) {
          const kind = Math.floor(rnd() * 6), yb = y + 0.025;
          if (kind < 2) { const n = 4 + Math.floor(rnd() * 8); for (let i = 0; i < n && z < z1 - 0.06; i++) { const t = 0.02 + rnd() * 0.025, h = 0.2 + rnd() * 0.14, dd = 0.16 + rnd() * 0.08; kit.box(dd, h, t, [0x8a2a22, 0x1f3a5c, 0x3c5a3a, 0xc9b46a, 0x2a2a30, 0xe8dfca, 0x6a2a5a][Math.floor(rnd() * 7)], xb + side * (0.06 + dd / 2), yb + h / 2, z + t / 2); z += t + 0.003; } }
          else if (kind === 2) { for (let i = 0; i < 3 && z < z1 - 0.1; i++) { const col = [0xf4f0e6, 0x1f3a5c, 0xb3342a, 0x2a6a5a][Math.floor(rnd() * 4)]; kit.cyl(0.035, 0.032, 0.09, col, xb + side * 0.2, yb + 0.045, z + 0.04); kit.add(new THREE.TorusGeometry(0.022, 0.006, 5, 10), col, xb + side * 0.2, yb + 0.05, z + 0.08, Math.PI / 2); z += 0.11; } }
          else if (kind === 3) { const n = 3 + Math.floor(rnd() * 3); for (let i = 0; i < n; i++) kit.cyl(0.025, 0.025, 0.36, [0xe8dfca, 0xc9b46a, 0x8a2a22][i % 3], xb + side * 0.2, yb + 0.025 + i * 0.05, z + 0.18, 8, 0, Math.PI / 2, Math.PI / 2); z += 0.4; }
          else if (kind === 4) { for (let i = 0; i < 4; i++) kit.box(0.26, 0.035, 0.2, [0x8a2a22, 0xd8a43a, 0x2a4a6a, 0x5a6a3a, 0xe8dfca][Math.floor(rnd() * 5)], xb + side * 0.2, yb + 0.018 + i * 0.037, z + 0.11); z += 0.25; }
          else { for (let i = 0; i < 3 && z < z1 - 0.1; i++) { kit.box(0.09, 0.05, 0.04, 0x9a6b34, xb + side * 0.2, yb + 0.05, z + 0.04); kit.add(new THREE.SphereGeometry(0.03, 8, 6), 0x9a6b34, xb + side * 0.2, yb + 0.08, z + 0.075); z += 0.12; } }
          z += 0.04;
        }
      }
      O(Math.min(xb, xf), Math.max(xb, xf), z0, z1, 2.5);
    };
    const DOORS = k.plan.doors.filter(d => d.a === ROOM || d.b === ROOM);
    const gaps = (wallX, isX) => DOORS.filter(d => isX ? (d.along === 'x' && Math.abs((d.x0 + d.x1) / 2 - wallX) < 0.6) : false).map(d => [d.z0 - 0.4, d.z1 + 0.4]);
    const runs = (z0, z1, cut) => { const out = []; let a = z0; for (const [p, q] of cut.sort((u, v) => u[0] - v[0])) { if (p - a > 0.8) out.push([a, p]); a = Math.max(a, q); } if (z1 - a > 0.8) out.push([a, z1]); return out; };
    for (const [a, b] of runs(Z0 + 1.6, Z1 - 4.6, gaps(X0, true))) shelfRun(X0 + 0.02, a, b, 1);
    for (const [a, b] of runs(Z0 + 1.6, Z1 - 9.4, gaps(X1, true))) shelfRun(X1 - 0.02, a, b, -1);
    // ---- the snow globes: six, along the front, three either side of the way in
    this.globes = [];
    const gx = [CX - 3.9, CX - 2.85, CX - 1.8, CX + 1.8, CX + 2.85, CX + 3.9], gz = Z0 + 4.6;
    GLOBES.forEach((def, i) => {
      const x = gx[i], z = gz + (i === 0 || i === 5 ? 0.35 : i === 1 || i === 4 ? 0.12 : 0), top = 0.3;
      // the pedestal: a dark column with a brass collar, and a card with its name
      kit.span(x - 0.24, x + 0.24, 0, top - 0.03, z - 0.24, z + 0.24, 0x1c1e26); kit.span(x - 0.27, x + 0.27, top - 0.03, top, z - 0.27, z + 0.27, BRASS);
      O(x - 0.27, x + 0.27, z - 0.27, z + 0.27, top + 0.5);
      const holder = new THREE.Group(); holder.position.set(x, top, z); g.add(holder);
      // The base: turned walnut, a moulded foot and a collar the glass sits down into, so only the dome above the
      // snowy ground inside shows (the floor of each little world is 0.1 below the ball's centre). A brass ring at the joint.
      const prof = [[0.0, 0], [0.222, 0], [0.226, 0.01], [0.214, 0.026], [0.196, 0.04], [0.184, 0.075], [0.188, 0.098], [0.181, 0.108], [0.181, 0.12], [0.0, 0.12]].map(([px, py]) => new THREE.Vector2(px, py));
      const base = new THREE.Mesh(new THREE.LatheGeometry(prof, 36), new THREE.MeshStandardMaterial({ color: 0x5a3420, roughness: 0.35, metalness: 0.05, emissive: 0x24140a, emissiveIntensity: 0.6 })); holder.add(base);
      const band = new THREE.Mesh(new THREE.TorusGeometry(0.179, 0.006, 8, 40), new THREE.MeshStandardMaterial({ color: BRASS, metalness: 0.85, roughness: 0.25, emissive: 0x4a3410, emissiveIntensity: 0.6 })); band.rotation.x = Math.PI / 2; band.position.y = 0.12; holder.add(band);
      const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.035), new THREE.MeshStandardMaterial({ color: BRASS, metalness: 0.8, roughness: 0.3, emissive: 0x4a3410, emissiveIntensity: 0.7 })); plate.position.set(0, 0.06, -0.19); plate.rotation.set(-0.08, Math.PI, 0); holder.add(plate);
      const ball = new THREE.Group(); ball.position.y = 0.12 + 0.1; holder.add(ball);
      // the snowy ground every little world stands on, filling the glass edge to edge
      const ground = new THREE.Mesh(new THREE.SphereGeometry(0.1735, 32, 6, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xf2f6fb, roughness: 0.9, emissive: 0x8a96a8, emissiveIntensity: 0.35 }));
      ground.scale.y = 0.12; ground.position.y = -0.1; ball.add(ground);
      const world = new THREE.Group(); world.rotation.y = Math.PI; ball.add(world); const step = def.build(world);      // (built facing +z; the customer stands to its -z)
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 8), new THREE.MeshBasicMaterial({ map: radial(), color: new THREE.Color(0.08, 0.1, 0.14), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); lamp.position.y = -0.04; ball.add(lamp);
      const shell = new THREE.Mesh(new THREE.SphereGeometry(0.205, 32, 20), new THREE.MeshStandardMaterial({ color: 0xeaf4ff, transparent: true, opacity: 0.1, roughness: 0.02, metalness: 0.3, emissive: 0x405870, emissiveIntensity: 0.1, depthWrite: false })); shell.renderOrder = 3; ball.add(shell);
      // snow: resting in a drift on the floor of it until it is shaken
      const N = 70, P = new Float32Array(N * 3), V = new Float32Array(N * 3), rs = rng(100 + i);
      for (let j = 0; j < N; j++) { const a = rs() * 6.28, d = Math.sqrt(rs()) * 0.15; P[j * 3] = Math.cos(a) * d; P[j * 3 + 1] = snowAt(d); P[j * 3 + 2] = Math.sin(a) * d; }
      const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(P, 3));
      const sm = new THREE.PointsMaterial({ color: 0xffffff, size: 0.008, map: radial(), alphaTest: 0.05, transparent: true, opacity: 0.95, depthWrite: false });
      // A flake is only ever drawn inside the glass: whatever the motion does, one outside it (in the ball's own frame) is not drawn at all.
      sm.onBeforeCompile = sh => { sh.vertexShader = sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n  float globeOut = step(0.175, length(position));').replace('gl_PointSize = size;', 'gl_PointSize = size * (1.0 - globeOut);'); };
      sm.customProgramCacheKey = () => 'globe-snow';
      const snow = new THREE.Points(sg, sm); snow.renderOrder = 2; ball.add(snow);
      // the card on the pedestal's front
      const card = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.11), new THREE.MeshBasicMaterial({ map: tex(256, 78, (c, w, h) => { c.fillStyle = '#f4efe2'; c.fillRect(0, 0, w, h); c.fillStyle = '#16120c'; c.textAlign = 'center'; c.font = '700 26px Georgia, serif'; fitAt(c, def.name, w, 34); c.font = 'italic 19px Georgia, serif'; c.fillStyle = '#5a5040'; fitAt(c, def.where, w, 62); }) }));
      card.position.set(x, 0.17, z - 0.245); card.rotation.y = Math.PI; g.add(card);
      this.globes.push({ def, x, z, holder, ball, world, step, snow, P, V, N, live: 0, wob: 0, t: i * 3.1 });
    });
    // a banner over the globes
    { const b = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 0.5), new THREE.MeshBasicMaterial({ map: tex(640, 100, (c, w, h) => { c.fillStyle = '#16233a'; c.fillRect(0, 0, w, h); c.fillStyle = '#f2e6c4'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = '700 44px Georgia, serif'; c.fillText('SHAKE A GLOBE', w / 2, h / 2 + 2); c.fillStyle = '#f2e6c4'; for (const x of [40, w - 40]) { c.save(); c.translate(x, h / 2); flake(c, 0, 0, 26); c.restore(); } }) }));
      b.position.set(CX, 2.7, gz + 0.4); b.rotation.y = Math.PI; g.add(b); kit.span(CX - 1.62, CX + 1.62, 2.94, 2.97, gz + 0.38, gz + 0.42, BRASS); for (const sx of [-1, 1]) kit.span(CX + sx * 1.5 - 0.004, CX + sx * 1.5 + 0.004, 2.97, r.h, gz + 0.398, gz + 0.402, 0x888888); }
    // ---- the middle of the room: a lit glass case of toy lions, then two display tables
    { const cz = Z0 + 8.3, w = 1.4, d = 0.7;
      kit.span(CX - w / 2, CX + w / 2, 0, 0.45, cz - d / 2, cz + d / 2, 0x1c1e26); kit.span(CX - w / 2 - 0.02, CX + w / 2 + 0.02, 0.45, 0.48, cz - d / 2 - 0.02, cz + d / 2 + 0.02, BRASS);
      glass.span(CX - w / 2, CX + w / 2, 0.48, 1.2, cz - d / 2, cz + d / 2, 0xffffff); kit.span(CX - w / 2 - 0.02, CX + w / 2 + 0.02, 1.2, 1.24, cz - d / 2 - 0.02, cz + d / 2 + 0.02, DARK);
      light.span(CX - w / 2 + 0.05, CX + w / 2 - 0.05, 1.19, 1.195, cz - d / 2 + 0.05, cz + d / 2 - 0.05, 0xfff0c8);
      kit.span(CX - w / 2 + 0.03, CX + w / 2 - 0.03, 0.82, 0.83, cz - d / 2 + 0.03, cz + d / 2 - 0.03, 0xcfe6f2);
      for (let i = 0; i < 5; i++) for (const yy of [0.48, 0.83]) { const x = CX - 0.5 + i * 0.25; kit.box(0.12, 0.07, 0.05, 0x9a6b34, x, yy + 0.06, cz); kit.add(new THREE.SphereGeometry(0.04, 10, 8), 0xa87a40, x + 0.05, yy + 0.11, cz); kit.box(0.02, 0.05, 0.03, 0x9a6b34, x - 0.05, yy + 0.04, cz); }
      O(CX - w / 2, CX + w / 2, cz - d / 2, cz + d / 2, 1.24); }
    for (const tz of [Z0 + 11.4, Z0 + 14.6]) {
      const w = 1.9, d = 0.95; kit.span(CX - w / 2, CX + w / 2, 0.68, 0.74, tz - d / 2, tz + d / 2, WOOD);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) kit.span(CX + sx * (w / 2 - 0.08) - 0.03, CX + sx * (w / 2 - 0.08) + 0.03, 0, 0.68, tz + sz * (d / 2 - 0.08) - 0.03, tz + sz * (d / 2 - 0.08) + 0.03, DARK);
      kit.span(CX - w / 2 + 0.05, CX + w / 2 - 0.05, 0.12, 0.14, tz - d / 2 + 0.05, tz + d / 2 - 0.05, WOOD);
      // on top: stacks of books, a pyramid of mugs, scarves folded, puzzles; underneath, tote bags
      for (let i = 0; i < 4; i++) { const x = CX - 0.7 + i * 0.47; const n = 3 + Math.floor(rnd() * 4); for (let j = 0; j < n; j++) kit.box(0.3, 0.035, 0.22, [0x8a2a22, 0x1f3a5c, 0xe8dfca, 0x2a2a30, 0xc9b46a][Math.floor(rnd() * 5)], x, 0.76 + j * 0.036, tz - 0.2, (rnd() - 0.5) * 0.2); }
      for (let i = 0; i < 6; i++) { const row = i < 3 ? 0 : i < 5 ? 1 : 2, x = CX - 0.5 + (i < 3 ? i : i < 5 ? i - 2.5 : 0.5) * 0.1 + (row ? 0 : 0); kit.cyl(0.035, 0.032, 0.09, 0xf4f0e6, x + 0.3, 0.785 + row * 0.09, tz + 0.18); }
      for (let i = 0; i < 3; i++) kit.box(0.28, 0.05, 0.2, [0xb3342a, 0x2a6a5a, 0xd8a43a][i], CX - 0.55 + i * 0.3, 0.765 + i * 0.002, tz + 0.2);
      for (let i = 0; i < 3; i++) kit.box(0.3, 0.32, 0.05, [0xe8dfca, 0x16233a, 0x8a2a22][i], CX - 0.5 + i * 0.5, 0.3, tz);
      O(CX - w / 2, CX + w / 2, tz - d / 2, tz + d / 2, 0.8);
    }
    // ---- the till at the back, and your shelf on the wall behind it
    { const tx0 = X0 + 1.0, tx1 = CX + 0.8, tz0 = Z1 - 3.8, tz1 = tz0 + 0.75;
      kit.span(tx0, tx1, 0, 0.95, tz0, tz1, WOOD); kit.span(tx0 - 0.03, tx1 + 0.03, 0.95, 0.99, tz0 - 0.05, tz1 + 0.02, 0x2a2420); kit.span(tx0, tx1, 0, 0.1, tz0 - 0.01, tz0, DARK);
      for (let x = tx0 + 0.3; x < tx1 - 0.2; x += 0.6) kit.span(x - 0.01, x + 0.01, 0.15, 0.85, tz0 - 0.012, tz0 - 0.004, BRASS);
      const tc = (tx0 + tx1) / 2; kit.box(0.34, 0.12, 0.28, 0x2a2a30, tc, 1.05, tz0 + 0.35); kit.box(0.3, 0.16, 0.03, 0x1a1a20, tc, 1.17, tz0 + 0.48); light.box(0.24, 0.1, 0.005, 0x9fe0b0, tc, 1.18, tz0 + 0.462);
      kit.box(0.08, 0.02, 0.14, 0x1a1a20, tc + 0.5, 1.0, tz0 + 0.3); kit.box(0.3, 0.4, 0.15, 0xe8dfca, tc - 0.7, 1.19, tz0 + 0.35); kit.box(0.26, 0.3, 0.13, 0x8a2a22, tc - 1.05, 1.14, tz0 + 0.35);
      // a lit sign over it
      const s = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.4), new THREE.MeshBasicMaterial({ map: tex(512, 128, (c, w, h) => { c.fillStyle = '#16120c'; c.fillRect(0, 0, w, h); c.strokeStyle = '#c9a24a'; c.lineWidth = 4; c.strokeRect(8, 8, w - 16, h - 16); c.fillStyle = '#f2dca0'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = '700 54px Georgia, serif'; c.fillText('PAY HERE', w / 2, h / 2 + 3); }) }));
      s.position.set(tc, 2.2, tz0 - 0.02); s.rotation.y = Math.PI; g.add(s);
      O(tx0, tx1, tz0, tz1, 1.0);
      this.till = { x: tc, y: r.y, z: tz0 - 0.75 };
      // your shelf: on the back wall, three lit shelves, a gilt edge
      const sx0 = X0 + 0.5, sx1 = sx0 + 2.6, sz = Z1 - 0.02, sd = 0.3;
      kit.span(sx0, sx1, 0.3, 1.9, sz - 0.03, sz, 0x16233a); kit.span(sx0 - 0.04, sx1 + 0.04, 1.9, 1.96, sz - sd, sz, BRASS);
      for (const yy of [0.3, 0.8, 1.3]) { kit.span(sx0, sx1, yy, yy + 0.025, sz - sd, sz, WOOD); light.span(sx0 + 0.05, sx1 - 0.05, yy + 0.46, yy + 0.465, sz - sd + 0.04, sz - 0.04, 0xfff0c8); }
      this.shelfAt = { x0: sx0, x1: sx1, z: sz - sd / 2 };
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.22), new THREE.MeshBasicMaterial({ map: tex(448, 70, (c, w, h) => { c.fillStyle = '#16233a'; c.fillRect(0, 0, w, h); c.fillStyle = '#f2e6c4'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = '700 34px Georgia, serif'; c.fillText('YOUR SHELF', w / 2, h / 2 + 2); }) }));
      sign.position.set((sx0 + sx1) / 2, 2.12, sz - 0.04); sign.rotation.y = Math.PI; g.add(sign);
    }
    // ---- the showroom: the back corner by the far wall, dark floor, spotlights, plinths that turn
    this.showcase = [];
    { const goods = VEHICLES.filter(v => v.showroom); this.goods = goods.length ? goods : VEHICLES.filter(v => v.shop);
      const sx0 = CX + 1.6, sx1 = X1 - 0.3, sz0 = Z1 - 8.6, sz1 = Z1 - 0.3;
      kit.span(sx0, sx1, 0.002, 0.008, sz0, sz1, 0x121318); kit.span(sx0, sx1, 0.008, 0.012, sz0, sz0 + 0.05, BRASS); kit.span(sx0, sx0 + 0.05, 0.008, 0.012, sz0, sz1, BRASS);
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.45), new THREE.MeshBasicMaterial({ map: tex(560, 115, (c, w, h) => { c.fillStyle = '#0c0d12'; c.fillRect(0, 0, w, h); const gr = c.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, '#c9a24a'); gr.addColorStop(0.5, '#fff0c0'); gr.addColorStop(1, '#c9a24a'); c.fillStyle = gr; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = '700 60px Georgia, serif'; c.fillText('SHOWROOM', w / 2, h / 2 + 3); }) }));
      sign.position.set((sx0 + sx1) / 2, 2.6, sz0); sign.rotation.y = Math.PI; g.add(sign);
      const cols = 2, rowsN = Math.max(1, Math.ceil(this.goods.length / cols));
      this.goods.slice(0, 6).forEach((v, i) => {
        const cx = sx0 + (sx1 - sx0) * ((i % cols) + 0.5) / cols, cz = sz0 + 1.2 + Math.floor(i / cols) * Math.min(2.4, (sz1 - sz0 - 1.6) / rowsN);
        const R = v.id === 'semi' ? 0.62 : 0.48;
        kit.cyl(R + 0.02, R + 0.05, 0.1, 0x1c1e26, cx, 0.05, cz, 32); light.add(new THREE.TorusGeometry(R + 0.035, 0.008, 6, 40), v.kind === 'car' ? 0xff8a3a : 0x3ad8ff, cx, 0.1, cz, 0, Math.PI / 2);
        O(cx - R - 0.05, cx + R + 0.05, cz - R - 0.05, cz + R + 0.05, 0.12);
        const turn = new THREE.Group(); turn.position.set(cx, 0.1, cz); g.add(turn);
        const top = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 0.02, 32), new THREE.MeshStandardMaterial({ color: 0x2a2c34, roughness: 0.25, metalness: 0.5, emissive: 0x0a0b10 })); top.position.y = 0.01; turn.add(top);
        let model = null; try { model = buildVehicle(v.id); } catch { model = null; }
        const hold = new THREE.Group(); hold.position.y = v.kind === 'car' ? 0.02 : 0.25; turn.add(hold);
        if (model) { hold.add(model.group); if (model.group.scale && v.kind === 'car') model.group.scale.setScalar(1.6); else if (model.group.scale) model.group.scale.setScalar(1.6); }
        // a beam of light down on it
        // (a faint shaft that fades out towards the floor, so the car under it is not washed out)
        const bg = new THREE.ConeGeometry(R * 0.85, r.h - 0.2, 24, 4, true), bp = bg.attributes.position, bc = [];
        for (let q = 0; q < bp.count; q++) { const t = (bp.getY(q) + (r.h - 0.2) / 2) / (r.h - 0.2), a = 0.02 + 0.13 * t * t; bc.push(a * 1.0, a * 0.92, a * 0.75); }
        bg.setAttribute('color', new THREE.Float32BufferAttribute(bc, 3));
        const beam = new THREE.Mesh(bg, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
        beam.position.set(cx, (r.h - 0.2) / 2, cz); g.add(beam);
        // the price card on a stand in front of it
        const card = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.2), new THREE.MeshBasicMaterial({ map: this._priceTex(v) })); card.position.set(cx, 0.32, cz - R - 0.12); card.rotation.set(-0.3, Math.PI, 0); g.add(card);
        kit.span(cx - 0.01, cx + 0.01, 0, 0.26, cz - R - 0.1, cz - R - 0.08, BRASS);
        this.showcase.push({ v, x: cx, z: cz, R, turn, card, front: { x: cx, z: cz - R - 0.45 } });
      });
    }
    // ---- hanging banners down the room, of our own design
    const banner = (x, z, draw) => { const t = tex(180, 360, draw); for (const ry of [Math.PI / 2, -Math.PI / 2]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.8), new THREE.MeshBasicMaterial({ map: t })); m.position.set(x + (ry > 0 ? 0.002 : -0.002), r.h - 1.2, z); m.rotation.y = ry; g.add(m); } kit.span(x - 0.01, x + 0.01, r.h - 0.29, r.h - 0.27, z - 0.48, z + 0.48, BRASS); };
    banner(X0 + 1.6, Z0 + 10, (c, w, h) => { c.fillStyle = '#8a1e22'; c.fillRect(0, 0, w, h); c.fillStyle = '#f2c450'; lion(c, w * 0.5, h * 0.4, 40); c.font = '700 26px Georgia, serif'; c.textAlign = 'center'; fitAt(c, 'GIFTS', w, h * 0.68); fitAt(c, 'BOOKS', w, h * 0.77); fitAt(c, 'PRINTS', w, h * 0.86); });
    banner(X1 - 1.6, Z0 + 10, (c, w, h) => { c.fillStyle = '#16335a'; c.fillRect(0, 0, w, h); c.save(); c.translate(w / 2, h * 0.36); flake(c, 0, 0, 52); c.restore(); c.fillStyle = '#f2e6c4'; c.font = '700 24px Georgia, serif'; c.textAlign = 'center'; fitAt(c, 'WINTER', w, h * 0.7); fitAt(c, 'NIGHTS', w, h * 0.79); });
    banner(X0 + 1.6, Z0 + 16, (c, w, h) => { c.fillStyle = '#1d4a40'; c.fillRect(0, 0, w, h); c.fillStyle = '#c99a5b'; c.beginPath(); c.ellipse(w / 2, h * 0.36, 58, 46, 0, 0, 7); c.fill(); ['#d8232a', '#f2c450', '#2c5fb0', '#f4f4f0'].forEach((col, i) => { c.fillStyle = col; c.beginPath(); c.arc(w / 2 - 34 + i * 22, h * 0.32, 9, 0, 7); c.fill(); }); c.fillStyle = '#f2e6c4'; c.font = '700 24px Georgia, serif'; c.textAlign = 'center'; fitAt(c, 'MAKE', w, h * 0.7); fitAt(c, 'SOMETHING', w, h * 0.79); });
    banner(X1 - 1.6, Z0 + 16, (c, w, h) => { c.fillStyle = '#2a2420'; c.fillRect(0, 0, w, h); c.fillStyle = '#c9a24a'; c.font = '700 120px Georgia, serif'; c.textAlign = 'center'; fitAt(c, '★', w, h * 0.46); c.font = '700 24px Georgia, serif'; c.fillStyle = '#f2e6c4'; fitAt(c, 'THE', w, h * 0.66); fitAt(c, 'SHOWROOM', w, h * 0.75); fitAt(c, '→', w, h * 0.86); });
    // ---- a welcome mat and a sign over the door from the lobby
    { const d = DOORS.find(q => q.a === 'lobby' || q.b === 'lobby'); if (d) { const dx = (d.x0 + d.x1) / 2; kit.span(dx - 1.1, dx + 1.1, 0.002, 0.01, Z0 + 0.1, Z0 + 1.3, 0x5a1a1e);
      const s = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.42), new THREE.MeshBasicMaterial({ map: tex(600, 105, (c, w, h) => { c.fillStyle = '#16120c'; c.fillRect(0, 0, w, h); c.fillStyle = '#f2dca0'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = '700 50px Georgia, serif'; c.fillText('THE MUSEUM SHOP', w / 2, h / 2 + 3); }) }));
      s.position.set(dx, d.h + 0.4, Z0 - 0.42); s.rotation.y = Math.PI; g.add(s); } }
    // ---- merge it all
    const solid = kit.mesh(glowing(0.2)); if (solid) g.add(solid);
    const gl = glass.mesh(new THREE.MeshStandardMaterial({ vertexColors: true, transparent: true, opacity: 0.14, roughness: 0.05, metalness: 0.2, depthWrite: false })); if (gl) { gl.renderOrder = 3; g.add(gl); }
    const li = light.mesh(new THREE.MeshBasicMaterial({ vertexColors: true })); if (li) g.add(li);
    // your shelf's things, and the flag on the car
    this.shelfGroup = new THREE.Group(); g.add(this.shelfGroup); this._fillShelf();
    this.flagT = { uT: { value: 0 } };
    this._dom();
  },

  // ---------------------------------------------------------------- remembered
  _load() { try { const s = JSON.parse(localStorage.getItem(STORE) || '{}'); return { flags: s.flags || [], flag: s.flag || null, shelf: s.shelf || [], globes: s.globes || [] }; } catch { return { flags: [], flag: null, shelf: [], globes: [] }; } },
  _save() { try { localStorage.setItem(STORE, JSON.stringify(this.state)); } catch { /* private window: it lasts the visit */ } },

  _priceTex(v) {
    const owned = this.k.G.shop && this.k.G.shop.garage && this.k.G.shop.garage.isOpen(v.id);
    return tex(256, 122, (c, w, h) => { c.fillStyle = '#0c0d12'; c.fillRect(0, 0, w, h); c.strokeStyle = '#c9a24a'; c.lineWidth = 3; c.strokeRect(5, 5, w - 10, h - 10); c.fillStyle = '#f2e6c4'; c.textAlign = 'center'; c.font = '700 28px Georgia, serif'; fitAt(c, v.name, w, 48); c.font = '700 30px ui-monospace, monospace'; c.fillStyle = owned ? '#9fe0b0' : '#f2c450'; fitAt(c, owned ? 'YOURS' : `${(v.shop || 0).toLocaleString()} CHIPS`, w, 92); });
  },

  // The collectibles you own, each in its place on your shelf.
  _fillShelf() {
    const g = this.shelfGroup; while (g.children.length) g.remove(g.children[0]);
    const A = this.shelfAt; if (!A) return;
    const m = (hex, o = {}) => new THREE.MeshStandardMaterial({ color: hex, roughness: 0.5, emissive: hex, emissiveIntensity: 0.25, ...o });
    SHELF.forEach((it, i) => {
      const x = A.x0 + 0.3 + (i % 3) * 0.9, y = [0.325, 0.825, 1.325][Math.floor(i / 3)] + 0.0, z = A.z, own = this.state.shelf.includes(it.id), o = new THREE.Group(); o.position.set(x, y, z); g.add(o);
      if (!own) { const tag = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.08), new THREE.MeshBasicMaterial({ map: tex(96, 48, (c, w, h) => { c.fillStyle = '#e8dfca'; c.fillRect(0, 0, w, h); c.fillStyle = '#5a5040'; c.font = '700 26px Georgia, serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('?', w / 2, h / 2); }) })); tag.position.set(0, 0.05, -0.1); tag.rotation.y = Math.PI; o.add(tag); return; }
      if (it.id === 'toylion') { const b = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.09, 0.08), m(0x9a6b34, { metalness: 0.6 })); b.position.y = 0.08; o.add(b); const h = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 10), m(0xa87a40, { metalness: 0.6 })); h.position.set(0.1, 0.15, 0); o.add(h); const base = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.03, 0.12), m(0x5a5a58)); base.position.y = 0.015; o.add(base); }
      if (it.id === 'paperweight') { const s = new THREE.Mesh(new THREE.SphereGeometry(0.07, 20, 14, 0, Math.PI * 2, 0, Math.PI / 1.7), new THREE.MeshStandardMaterial({ color: 0xcfefff, transparent: true, opacity: 0.4, roughness: 0.05 })); s.position.y = 0.0; o.add(s); for (let j = 0; j < 7; j++) { const a = j * 0.9, f = new THREE.Mesh(new THREE.SphereGeometry(0.013, 8, 6), m([0xd8232a, 0xf2c450, 0x2c5fb0, 0x3a9a4a][j % 4])); f.position.set(Math.cos(a) * 0.03, 0.02, Math.sin(a) * 0.03); o.add(f); } }
      if (it.id === 'robot') { const b = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 0.06), m(0xb8bec6, { metalness: 0.7, roughness: 0.3 })); b.position.y = 0.1; o.add(b); const h = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, 0.05), m(0xb8bec6, { metalness: 0.7, roughness: 0.3 })); h.position.y = 0.18; o.add(h); for (const sx of [-0.015, 0.015]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.008, 6, 4), new THREE.MeshBasicMaterial({ color: 0xff4040 })); e.position.set(sx, 0.185, -0.026); o.add(e); } for (const sx of [-0.022, 0.022]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.05, 0.03), m(0x6a7078)); l.position.set(sx, 0.025, 0); o.add(l); } o.userData.walk = true; }
      if (it.id === 'frame') { const f = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.018, 4, 4), m(0xd4a63a, { metalness: 0.7, roughness: 0.3 })); f.rotation.z = Math.PI / 4; f.scale.set(1.2, 0.95, 1); f.position.set(0, 0.13, 0.04); o.add(f); }
      if (it.id === 'minithorne') { const r = new THREE.Group(); r.position.y = 0.01; o.add(r); const w = m(0x8a6a9a), fl = m(0x6a4a2a); const add = (gw, gh, gd, mm, x, y, z) => { const b = new THREE.Mesh(new THREE.BoxGeometry(gw, gh, gd), mm); b.position.set(x, y, z); r.add(b); }; add(0.24, 0.01, 0.16, fl, 0, 0, 0); add(0.24, 0.16, 0.01, w, 0, 0.08, 0.08); add(0.01, 0.16, 0.16, w, -0.12, 0.08, 0); add(0.01, 0.16, 0.16, w, 0.12, 0.08, 0); add(0.06, 0.05, 0.02, m(0xe8e0d0), 0, 0.03, 0.065); add(0.03, 0.015, 0.005, new THREE.MeshBasicMaterial({ color: 0xff8a2a }), 0, 0.02, 0.054); }
    });
  },

  // ---------------------------------------------------------------- near: shake, shop, buy
  near(v, k) {
    if (!this.r || this.open || !k.room || k.room.id !== ROOM) return null;
    for (const gb of this.globes) if (k.close({ x: gb.x, y: this.y, z: gb.z - 0.55 }, 0.6, 1)) return { verb: 'SHAKE', hint: `A snow globe: ${gb.def.name}.`, act: () => this.shake(gb) };
    if (k.close(this.till, 1.3, 1)) return { verb: 'SHOP', hint: 'The till. Spend your chips.', act: () => this.openPanel('flags') };
    for (const s of this.showcase) if (k.close({ x: s.front.x, y: this.y, z: s.front.z }, 0.7, 1)) return { verb: 'BUY', hint: s.v.name, act: () => this.openPanel('showroom') };
    return null;
  },
  shake(gb) {
    const k = this.k; gb.live = 1; gb.wob = 1;
    // every flake thrown up and spinning
    for (let j = 0; j < gb.N; j++) { const a = Math.random() * 6.28; gb.V[j * 3] = Math.cos(a) * (0.1 + Math.random() * 0.2); gb.V[j * 3 + 1] = 0.25 + Math.random() * 0.35; gb.V[j * 3 + 2] = Math.sin(a) * (0.1 + Math.random() * 0.2); }
    k.synth.noise(0.35, { vol: 0.03, lp: 3000 }); k.synth.chime([1318, 1568, 1976], { gap: 0.09, dur: 0.9, vol: 0.025 });
    if (!this.state.globes.includes(gb.def.to)) { this.state.globes.push(gb.def.to); this._save(); }
    if (this.state.globes.length >= GLOBES.length && k.find('globes')) k.callout('EVERY GLOBE SHAKEN');
    // and the way to the real thing, lit
    const sp = this._spotOf(gb.def.to), G = k.G;
    if (sp && G.nav && G.nav.goTo({ x: sp.x, y: sp.y, z: sp.z, label: gb.def.name })) k.say(`${gb.def.name}, ${gb.def.where}. The way is lit.`, 5);
    else k.say(`${gb.def.name}, ${gb.def.where}.`, 4);
  },
  _spotOf(id) { try { const all = this.k.G.features.spots(); return all.find(s => s.id === id) || null; } catch { return null; } },

  active(k) { return !!this.r; },
  update(dt, k) {
    // the flag rides on whichever car is out, wherever it is
    this._flag(dt, k);
    if (this.boost) this._boost(k);
    if (!k.inRoom(ROOM, 6)) return;
    const T = (this.t = (this.t || 0) + dt);
    if (k.room && k.room.id === ROOM) k.once('giftshop', 'The Museum Shop. Shake a globe; the till takes chips.', 5);
    for (const gb of this.globes) {
      gb.t += dt; gb.live = Math.max(0, gb.live - dt / 9); gb.wob = Math.max(0, gb.wob - dt * 1.4);
      gb.ball.rotation.z = Math.sin(gb.t * 22) * 0.12 * gb.wob; gb.ball.rotation.x = Math.cos(gb.t * 19) * 0.08 * gb.wob;
      gb.step(gb.t, gb.live);
      // the snow: thrown about, swirling, drifting down to the floor of the globe
      if (gb.live > 0) {
        const P = gb.P, V = gb.V;
        for (let j = 0; j < gb.N; j++) {
          const i = j * 3; let x = P[i], y = P[i + 1], z = P[i + 2];
          V[i] += -z * 0.6 * dt * gb.live; V[i + 2] += x * 0.6 * dt * gb.live; V[i + 1] -= 0.25 * dt;
          V[i] *= 1 - dt * 1.5; V[i + 1] = Math.max(V[i + 1] * (1 - dt * 1.5), -0.03); V[i + 2] *= 1 - dt * 1.5;
          x += V[i] * dt; y += V[i + 1] * dt; z += V[i + 2] * dt;
          const d = Math.hypot(x, y, z); if (d > 0.168) { x *= 0.168 / d; y *= 0.168 / d; z *= 0.168 / d; V[i] *= -0.3; V[i + 1] *= -0.3; V[i + 2] *= -0.3; }      // kept inside the glass
          const fl = snowAt(Math.hypot(x, z)); if (y < fl) { y = fl; V[i] = V[i + 1] = V[i + 2] = 0; }      // and settles on the snow
          P[i] = x; P[i + 1] = y; P[i + 2] = z;
        }
        gb.snow.geometry.attributes.position.needsUpdate = true;
      }
    }
    for (const s of this.showcase) s.turn.rotation.y += dt * 0.45;
    for (const o of this.shelfGroup.children) if (o.userData.walk) { o.rotation.y = Math.sin(T * 0.7) * 0.6; o.position.x += Math.sin(T * 0.7) * 0.0006; }
  },

  // ---------------------------------------------------------------- the flag on the aerial
  _flag(dt, k) {
    this.flagT.uT.value += dt * (1 + Math.min(3, Math.hypot(k.G.car.vel.x, k.G.car.vel.z) * 0.6));
    const want = this.state.flag, car = k.G.car, aer = car && car.aerial;
    if (!want || !aer) { if (this.flag && this.flag.parent) this.flag.parent.remove(this.flag); this.flagOn = null; return; }
    if (this.flag && this.flag.parent === aer && this.flagOn === want) return;
    if (this.flag && this.flag.parent) this.flag.parent.remove(this.flag);
    const def = FLAGS.find(f => f.id === want); if (!def) return;
    if (!this.flagGeo) { this.flagGeo = new THREE.PlaneGeometry(0.1, 0.065, 12, 4); this.flagGeo.translate(0.05, 0, 0); }
    const mat = new THREE.MeshStandardMaterial({ map: flagTex(def), side: THREE.DoubleSide, roughness: 0.8, emissive: 0xffffff, emissiveIntensity: 0.25 });
    mat.emissiveMap = mat.map; const u = this.flagT;
    mat.onBeforeCompile = sh => { sh.uniforms.uT = u.uT; sh.vertexShader = 'uniform float uT;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      { float s = clamp(position.x / 0.1, 0.0, 1.0); transformed.z += sin(uT * 9.0 - s * 6.0) * 0.011 * s; transformed.y += sin(uT * 7.0 - s * 5.0) * 0.003 * s; }`); };
    mat.customProgramCacheKey = () => 'aerialflag';
    const f = this.flag = new THREE.Mesh(this.flagGeo, mat);
    // at the top of the aerial, just under its tip, streaming back
    let top = 0; aer.traverse(o => { if (o.isMesh && o !== f && o.parent === aer) { if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); top = Math.max(top, o.position.y + o.geometry.boundingBox.max.y); } }); if (top < 0.1) top = 0.3;
    f.position.set(0, top - 0.045, 0); f.rotation.y = Math.PI / 2; aer.add(f); this.flagOn = want;
  },
  // hot chocolate: a little more top speed and a lot more go, for thirty seconds
  _boost(k) {
    const b = this.boost, car = k.G.car;
    if (performance.now() > b.until || car.spec !== b.spec) { if (car.spec === b.spec) car.spec = b.base; this.boost = null; k.say('The hot chocolate wears off.', 2); }
  },

  // ---------------------------------------------------------------- the till's panel
  _dom() {
    const st = document.createElement('style');
    st.textContent = `
#gshop { position: fixed; inset: 0; z-index: 31; display: flex; align-items: center; justify-content: center; background: rgba(4,5,9,.82); padding: max(14px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-right)) max(14px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left)); font-family: var(--serif, Georgia, serif); color: var(--cream, #f1ead8); }
#gshop[hidden] { display: none; }
#gshop .box { width: min(760px, 100%); max-height: 100%; overflow: auto; }
#gshop h2 { margin: 0; font-size: 22px; letter-spacing: .14em; text-transform: uppercase; color: var(--gilt, #e2cd94); }
#gshop .top { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; flex-wrap: wrap; margin-bottom: 10px; }
#gshop .chips { font: 600 14px var(--mono, ui-monospace, monospace); letter-spacing: .08em; color: var(--gilt, #e2cd94); }
#gshop .tabs { display: flex; gap: 6px; margin-bottom: 12px; flex-wrap: wrap; }
#gshop .tabs button { flex: 1; min-width: 92px; height: 38px; border-radius: 8px; border: 1px solid rgba(226,205,148,.45); background: rgba(12,14,20,.7); color: var(--cream, #f1ead8); font: 700 12px var(--mono, ui-monospace, monospace); letter-spacing: .12em; }
#gshop .tabs button[aria-pressed=true] { background: rgba(226,205,148,.92); color: #14120c; }
#gshop .goods { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 10px; }
#gshop .item { border: 1px solid rgba(226,205,148,.35); border-radius: 10px; padding: 10px; background: rgba(12,14,20,.72); display: flex; flex-direction: column; gap: 6px; min-width: 0; }
#gshop .item canvas, #gshop .item img { width: 100%; height: 84px; object-fit: contain; border-radius: 6px; background: rgba(255,255,255,.04); }
#gshop .item b { font-size: 17px; }
#gshop .item span { font-size: 13px; line-height: 1.35; color: #cfc8b4; flex: 1; }
#gshop .item button, #gshop .leave { height: 40px; border-radius: 8px; border: 1px solid rgba(226,205,148,.6); background: rgba(226,205,148,.92); color: #14120c; font: 700 12px var(--mono, ui-monospace, monospace); letter-spacing: .1em; }
#gshop .item button[disabled] { background: rgba(8,9,14,.66); color: var(--gilt-dim, #a8996c); }
#gshop .item button.on { background: #9fe0b0; border-color: #cff5d8; }
#gshop .leave { width: 100%; margin-top: 12px; background: rgba(8,9,14,.66); color: var(--gilt, #e2cd94); }
#gshop .note { font-size: 13px; color: #cfc8b4; margin-top: 10px; min-height: 1.3em; text-align: center; }
`;
    document.head.append(st);
    const el = this.el = document.createElement('section'); el.id = 'gshop'; el.hidden = true; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', 'The Museum Shop');
    el.innerHTML = '<div class="box"><div class="top"><h2>The Museum Shop</h2><div class="chips"></div></div><div class="tabs"><button data-tab="flags">FLAGS</button><button data-tab="treats">TREATS</button><button data-tab="shelf">YOUR SHELF</button><button data-tab="showroom">SHOWROOM</button></div><div class="goods"></div><div class="note" role="status"></div><button class="leave">LEAVE</button></div>';
    document.body.append(el);
    el.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.classList.contains('leave')) return this.closePanel();
      if (b.dataset.tab) { this.tab = b.dataset.tab; return this._draw(); }
      if (b.dataset.buy) this.buy(b.dataset.buy);
    });
    addEventListener('keydown', e => { if (this.open && e.code === 'Escape') { e.preventDefault(); e.stopPropagation(); this.closePanel(); } }, true);
  },
  openPanel(tab) { if (this.open) return; this.open = true; this.tab = tab; this.k.G.state = 'paused'; this.el.hidden = false; this._draw(); const b = this.el.querySelector('.item button:not([disabled])'); if (b) b.focus({ preventScroll: true }); },
  closePanel() { if (!this.open) return; this.open = false; this.el.hidden = true; this.k.resume(); },
  _chips() { const P = this.k.G.poker; return P ? P.chips() : 0; },
  _draw(note = '') {
    const el = this.el, chips = this._chips(), box = el.querySelector('.goods'), garage = this.k.G.shop && this.k.G.shop.garage;
    el.querySelector('.chips').textContent = `YOUR CHIPS: ${chips.toLocaleString()}`;
    el.querySelectorAll('.tabs button').forEach(b => b.setAttribute('aria-pressed', b.dataset.tab === this.tab));
    box.textContent = '';
    const card = (id, name, line, picture, label, disabled, on) => {
      const d = document.createElement('div'); d.className = 'item'; if (picture) d.append(picture);
      const b1 = document.createElement('b'); b1.textContent = name; const s = document.createElement('span'); s.textContent = line;
      const btn = document.createElement('button'); btn.dataset.buy = id; btn.textContent = label; btn.disabled = !!disabled; if (on) btn.className = 'on';
      d.append(b1, s, btn); box.append(d);
    };
    const price = (n, owned, use) => owned ? use : chips >= n ? `BUY · ${n.toLocaleString()}` : `${(n - chips).toLocaleString()} MORE`;
    if (this.tab === 'flags') {
      for (const f of FLAGS) { const cv = document.createElement('canvas'); cv.width = 128; cv.height = 84; f.draw(cv.getContext('2d'), 128, 84); const own = this.state.flags.includes(f.id), wearing = this.state.flag === f.id; card('flag:' + f.id, f.name, f.line, cv, wearing ? 'FLYING · TAKE OFF' : own ? 'FLY IT' : price(f.price, false), !own && chips < f.price, wearing); }
    } else if (this.tab === 'treats') {
      for (const t of TREATS) { const cv = document.createElement('canvas'); cv.width = 128; cv.height = 84; const c = cv.getContext('2d'); c.fillStyle = '#e8dfca'; c.fillRect(44, 22, 40, 50); c.fillStyle = '#5a3420'; c.fillRect(46, 24, 36, 10); c.fillStyle = '#fff'; for (const [x, y] of [[52, 22], [62, 20], [72, 23]]) c.fillRect(x, y, 8, 7); c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 2; for (const x of [56, 70]) { c.beginPath(); c.moveTo(x, 18); c.quadraticCurveTo(x - 6, 10, x, 2); c.stroke(); }
        card('treat:' + t.id, t.name, t.line + (this.boost ? ' (Drinking one now.)' : ''), cv, chips >= t.price ? `BUY · ${t.price}` : `${t.price - chips} MORE`, chips < t.price || !!this.boost || this.k.G.vehicle.kind !== 'car'); }
    } else if (this.tab === 'shelf') {
      for (const it of SHELF) { const cv = document.createElement('canvas'); cv.width = 128; cv.height = 84; const c = cv.getContext('2d'); c.fillStyle = it.icon; c.beginPath(); c.arc(64, 44, 26, 0, 7); c.fill(); c.fillStyle = 'rgba(255,255,255,.25)'; c.beginPath(); c.arc(56, 36, 9, 0, 7); c.fill(); const own = this.state.shelf.includes(it.id); card('shelf:' + it.id, it.name, it.line, cv, own ? 'ON YOUR SHELF' : price(it.price, false), own || chips < it.price); }
    } else {
      for (const s of this.showcase) { const v = s.v, own = garage && garage.isOpen(v.id), img = document.createElement('img'); img.alt = ''; const src = garage && garage.thumbs && garage.thumbs[v.id]; if (src) img.src = src; else img.hidden = true; card('car:' + v.id, v.name, v.hint, img, own ? 'YOURS' : price(v.shop || 0, false), own || chips < (v.shop || 0)); }
      if (!this.showcase.length) { const p = document.createElement('p'); p.textContent = 'Nothing in the showroom tonight.'; box.append(p); }
    }
    el.querySelector('.note').textContent = note || (chips < 60 ? 'Chips: from the card game on the roof, and from handing in lost property.' : '');
  },
  buy(code) {
    const k = this.k, [kind, id] = code.split(':');
    if (kind === 'flag') {
      const f = FLAGS.find(q => q.id === id); if (!f) return;
      if (this.state.flags.includes(id)) { this.state.flag = this.state.flag === id ? null : id; this._save(); return this._draw(this.state.flag ? `The ${f.name} flag is on your aerial.` : 'Flag taken down.'); }
      if (!k.chips(-f.price)) return this._draw('Not enough chips.');
      this.state.flags.push(id); this.state.flag = id; this._save(); k.synth.chime([660, 990], { gap: 0.07, dur: 0.4, vol: 0.04 });
      return this._draw(`The ${f.name} flag is on your aerial.`);
    }
    if (kind === 'treat') {
      const t = TREATS.find(q => q.id === id); if (!t || this.boost || k.G.vehicle.kind !== 'car') return;
      if (!k.chips(-t.price)) return this._draw('Not enough chips.');
      const car = k.G.car, base = car.spec, spec = { ...base, top: base.top * 1.18, accel: base.accel * 1.35 }; car.spec = spec;
      this.boost = { until: performance.now() + 30000, base, spec };
      k.synth.chime([523, 659, 784], { gap: 0.06, dur: 0.4, vol: 0.04 });
      this.closePanel(); k.callout('HOT CHOCOLATE'); return;
    }
    if (kind === 'shelf') {
      const it = SHELF.find(q => q.id === id); if (!it || this.state.shelf.includes(id)) return;
      if (!k.chips(-it.price)) return this._draw('Not enough chips.');
      this.state.shelf.push(id); this._save(); this._fillShelf(); k.synth.chime([784, 988], { gap: 0.07, dur: 0.4, vol: 0.04 });
      if (this.state.shelf.length >= SHELF.length && k.find('shelf')) k.callout('A FULL SHELF');
      return this._draw(`The ${it.name} is on your shelf, behind the till.`);
    }
    if (kind === 'car') {
      const s = this.showcase.find(q => q.v.id === id), garage = k.G.shop && k.G.shop.garage; if (!s || !garage || garage.isOpen(id)) return;
      if (!k.chips(-(s.v.shop || 0))) return this._draw('Not enough chips.');
      garage.buy(id); if (k.G.shop.onBuy) k.G.shop.onBuy(s.v);
      s.card.material.map = this._priceTex(s.v); s.card.material.needsUpdate = true;
      k.synth.chime([523, 659, 784, 1046], { gap: 0.08, dur: 0.6, vol: 0.05 });
      return this._draw(`The ${s.v.name} is yours.`);
    }
  },
  spots() {
    if (!this.r) return [];
    return [{ kind: 'secret', id: 'globes', name: 'Six snow globes', x: (this.r.x0 + this.r.x1) / 2, y: this.y, z: this.r.z0 + 4.6 }, { kind: 'secret', id: 'shelf', name: 'Your shelf (buy every one)', x: this.till.x, y: this.y, z: this.till.z }];
  },
  reset() { /* what you bought is yours to keep */ },
});

let _rad = null;
function radial() { return _rad || (_rad = tex(64, 64, (c, w, h) => { const g = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, w, h); })); }
