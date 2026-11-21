// Gallery 11: four of the Thorne Miniature Rooms, built as rooms the toy can drive into.
//
// A case of four stands in the middle of the gallery, two rooms looking west and two looking east, each a
// lit room behind glass with a pane cracked out at the foot of it. Each is my own furnishing of a room whose
// title hangs on the walls here (the furniture, pictures and views are invented, not copied from the real
// rooms), at about a third of full size: big enough for a 46 cm toy, small enough to feel like a dolls' house.
// One small thing has been left in each. Driving into any of them is one secret; finding all four is another.
//
// Everything is drawn once, merged one mesh per room; nothing runs unless the toy is in or beside Gallery 11.

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { feature } from './features.js';
import { cast } from './sculpt.js';
import * as TX from './textures.js';

const KEY = 'after-hours.thorne';
const W = 2.05, D = 1.3, H = 1.15;                         // inside: along the front, front to back, floor to ceiling

// ------------------------------------------------------------------ textures, all painted here
function tex(w, h, draw, rep) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); }
  return t;
}
const planks = (a, b) => tex(256, 256, (c, w, h) => { const r = TX.rng(7); for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? a : b; c.fillRect(0, i * 32, w, 32); c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(0, i * 32, w, 2); for (let k = 0; k < 3; k++) { c.fillStyle = 'rgba(40,20,5,.12)'; c.fillRect(r() * w, i * 32 + 6 + r() * 20, 30 + r() * 80, 2); } c.fillStyle = 'rgba(0,0,0,.3)'; c.fillRect(((i * 97) % 200) + 20, i * 32, 2, 32); } });
const hexTiles = () => tex(256, 256, (c, w, h) => { c.fillStyle = '#5b3a24'; c.fillRect(0, 0, w, h); const r = TX.rng(3), s = 22;
  for (let y = 0, row = 0; y < h + s; y += s * 0.86, row++) for (let x = row % 2 ? s / 2 : 0; x < w + s; x += s) { c.fillStyle = `hsl(${14 + r() * 8},${48 + r() * 12}%,${40 + r() * 8}%)`; c.beginPath(); for (let k = 0; k < 6; k++) { const a = Math.PI / 6 + k * Math.PI / 3; c.lineTo(x + Math.cos(a) * s * 0.52, y + Math.sin(a) * s * 0.52); } c.fill(); } });
const flags = () => tex(256, 256, (c, w, h) => { const r = TX.rng(11); for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { c.fillStyle = `hsl(40,${8 + r() * 6}%,${58 + r() * 10}%)`; c.fillRect(x * 64 + 1, y * 64 + 1, 62, 62); }
  for (const [x, y] of [[64, 64], [128, 128], [192, 64], [64, 192]]) { c.fillStyle = '#8a3b22'; c.fillRect(x - 14, y - 14, 28, 28); c.fillStyle = '#d9b35a'; c.beginPath(); c.arc(x, y, 9, 0, 7); c.fill(); } });
const quilt = () => tex(128, 128, (c, w, h) => { const cols = ['#8e2b2b', '#e8dcc0', '#3b5b7a', '#c99a3a', '#5f7a3a']; const r = TX.rng(5); for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { c.fillStyle = cols[Math.floor(r() * cols.length)]; c.fillRect(x * 16, y * 16, 16, 16); c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(x * 16, y * 16, 8, 8); } });
const carpet = () => tex(256, 160, (c, w, h) => { c.fillStyle = '#7a1f22'; c.fillRect(0, 0, w, h); c.strokeStyle = '#d7b46a'; c.lineWidth = 6; c.strokeRect(10, 10, w - 20, h - 20); c.fillStyle = '#1f2f5a'; c.fillRect(22, 22, w - 44, h - 44);
  c.fillStyle = '#c98a3a'; for (let i = 0; i < 5; i++) for (let j = 0; j < 3; j++) { const x = 46 + i * 42, y = 46 + j * 34; c.beginPath(); c.moveTo(x, y - 12); c.lineTo(x + 12, y); c.lineTo(x, y + 12); c.lineTo(x - 12, y); c.fill(); } });
const braided = () => tex(128, 128, (c, w, h) => { for (let r = 62; r > 0; r -= 6) { c.fillStyle = ['#7a3b2a', '#4f5f3a', '#b28a4a', '#3a4a6a'][(r / 6 | 0) % 4]; c.beginPath(); c.arc(64, 64, r, 0, 7); c.fill(); } });
function view(kind) {
  return tex(256, 256, (c, w, h) => {
    const sky = c.createLinearGradient(0, 0, 0, h); const S = { snow: ['#a9c4dc', '#e8eef2'], summer: ['#7fb0e0', '#d8e8f0'], vale: ['#8fb4d8', '#f0e2c0'] }[kind]; sky.addColorStop(0, S[0]); sky.addColorStop(1, S[1]); c.fillStyle = sky; c.fillRect(0, 0, w, h);
    if (kind === 'snow') { c.fillStyle = '#f6f8fa'; c.fillRect(0, h * 0.62, w, h); c.fillStyle = '#5a4a3a'; for (let i = 0; i < 6; i++) { const x = 20 + i * 44; c.fillRect(x, h * 0.4, 4, h * 0.25); } c.fillStyle = '#9a2f22'; c.fillRect(150, h * 0.48, 60, 40); c.fillStyle = '#f6f8fa'; c.beginPath(); c.moveTo(144, h * 0.48); c.lineTo(180, h * 0.36); c.lineTo(216, h * 0.48); c.fill(); }
    else if (kind === 'summer') { c.fillStyle = '#6f9a4a'; c.fillRect(0, h * 0.58, w, h); c.fillStyle = '#3f6a32'; for (let i = 0; i < 5; i++) { c.beginPath(); c.arc(30 + i * 55, h * 0.56, 26, 0, 7); c.fill(); } c.fillStyle = '#e8e2d0'; c.fillRect(110, h * 0.42, 40, 34); c.fillStyle = '#9a8a72'; c.beginPath(); c.moveTo(104, h * 0.42); c.lineTo(130, h * 0.33); c.lineTo(156, h * 0.42); c.fill(); }
    else { c.fillStyle = '#8aa060'; c.beginPath(); c.moveTo(0, h * 0.6); c.quadraticCurveTo(w * 0.4, h * 0.42, w, h * 0.58); c.lineTo(w, h); c.lineTo(0, h); c.fill(); c.fillStyle = '#d8ccb0'; c.fillRect(150, h * 0.36, 50, 50); c.fillStyle = '#3a4a6a'; c.beginPath(); c.moveTo(146, h * 0.36); c.lineTo(175, h * 0.24); c.lineTo(204, h * 0.36); c.fill(); c.fillRect(196, h * 0.2, 10, h * 0.2); }
    c.strokeStyle = '#3a2a1a'; c.lineWidth = 8; c.strokeRect(0, 0, w, h); c.lineWidth = 5; c.beginPath(); c.moveTo(w / 2, 0); c.lineTo(w / 2, h); c.moveTo(0, h / 2); c.lineTo(w, h / 2); c.stroke();
  });
}
const picture = seed => tex(64, 80, (c, w, h) => { const r = TX.rng(seed); c.fillStyle = '#b8892e'; c.fillRect(0, 0, w, h); c.fillStyle = `hsl(${r() * 60 + 20},30%,${30 + r() * 20}%)`; c.fillRect(6, 6, w - 12, h - 12);
  c.fillStyle = `hsl(${r() * 360},35%,${55 + r() * 15}%)`; c.beginPath(); c.ellipse(w / 2, h * 0.42, 11, 14, 0, 0, 7); c.fill(); c.fillStyle = `hsl(${r() * 360},40%,35%)`; c.fillRect(w / 2 - 14, h * 0.58, 28, h * 0.3); });
const tapestry = () => tex(256, 160, (c, w, h) => { c.fillStyle = '#4a5a3a'; c.fillRect(0, 0, w, h); const r = TX.rng(21); for (let i = 0; i < 40; i++) { c.fillStyle = ['#7a8a4a', '#3a4a2a', '#a07a4a', '#5a3a2a'][i % 4]; c.beginPath(); c.arc(r() * w, r() * h, 6 + r() * 12, 0, 7); c.fill(); }
  c.fillStyle = '#e0d0a8'; c.beginPath(); c.ellipse(90, 100, 26, 12, -0.2, 0, 7); c.fill(); c.fillRect(70, 104, 4, 26); c.fillRect(106, 104, 4, 26); c.beginPath(); c.arc(116, 88, 8, 0, 7); c.fill();       // a white hart in a wood
  c.strokeStyle = '#a8382a'; c.lineWidth = 10; c.strokeRect(5, 5, w - 10, h - 10); });
const lancet = seed => tex(64, 192, (c, w, h) => { const r = TX.rng(seed); c.fillStyle = '#10141e'; c.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 12) for (let x = 0; x < w; x += 10) { c.fillStyle = ['#2a4aa8', '#b8262c', '#d8a82a', '#2a8a4a', '#6a2a8a'][Math.floor(r() * 5)]; c.fillRect(x + 1, y + 1, 9, 11); }
  c.fillStyle = '#f0e6c8'; c.beginPath(); c.ellipse(w / 2, h * 0.38, 10, 22, 0, 0, 7); c.fill(); c.fillStyle = '#d8a82a'; c.beginPath(); c.arc(w / 2, h * 0.24, 8, 0, 7); c.fill(); });
// (drawn at the plate's own shape, 1.5 m by 0.12, and a long title set smaller or on two lines, never squeezed)
const plaque = (code, title) => tex(1024, 82, (c, w, h) => { c.fillStyle = '#16120c'; c.fillRect(0, 0, w, h); c.fillStyle = '#d9c38a'; TX.fitText(c, `${code} · ${title}`, { x: w / 2, y: h / 2, w: w - 48, h: h - 14, px: 44, weight: '600', family: 'Georgia, serif', lines: 2, wrapAt: 0.8 }); });

// ------------------------------------------------------------------ one room
// A room is built in its own frame: u along the front glass (0 to W), d in from the glass (0 to D), y up from the floor.
class RoomBuild {
  constructor(o) { Object.assign(this, o); this.parts = []; this.extra = []; this.solid = []; }
  X(d) { return this.xg - this.f * d; } Z(u) { return this.z0 + u; } Y(y) { return this.y0 + y; }
  _col(g, hex) { const c = new THREE.Color(hex), n = g.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) { a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; } g.setAttribute('color', new THREE.BufferAttribute(a, 3)); if (g.index) g = g.toNonIndexed(); this.parts.push(g); return g; }
  B(u0, u1, y0, y1, d0, d1, hex, solid) { const xa = this.X(d0), xb = this.X(d1), g = new THREE.BoxGeometry(Math.abs(xb - xa), y1 - y0, u1 - u0); g.translate((xa + xb) / 2, this.Y((y0 + y1) / 2), this.Z((u0 + u1) / 2)); this._col(g, hex); if (solid) this.block(u0, u1, d0, d1, y1); }
  C(u, d, y0, y1, r, hex, r2 = r, seg = 10) { const g = new THREE.CylinderGeometry(r2, r, y1 - y0, seg); g.translate(this.X(d), this.Y((y0 + y1) / 2), this.Z(u)); this._col(g, hex); }
  E(u, d, y, ru, ry, rd, hex) { const g = new THREE.SphereGeometry(1, 12, 8); g.scale(rd, ry, ru); g.translate(this.X(d), this.Y(y), this.Z(u)); this._col(g, hex); }
  block(u0, u1, d0, d1, y1) { const xa = this.X(d0), xb = this.X(d1); this.solid.push({ x0: Math.min(xa, xb), x1: Math.max(xa, xb), z0: this.Z(u0), z1: this.Z(u1), y0: this.y0 - 0.05, y1: this.Y(y1) }); }
  // A painted panel: on the back wall, a side wall (0 or W), or the floor.
  panel(where, a0, a1, b0, b1, map, o = {}) {
    const mat = o.basic ? new THREE.MeshBasicMaterial({ map, color: o.tint || 0xffffff, transparent: !!o.transparent }) : new THREE.MeshStandardMaterial({ map, roughness: 0.85, emissiveMap: map, emissive: 0xffffff, emissiveIntensity: o.glow == null ? 0.45 : o.glow, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    let m;
    if (where === 'floor') { m = new THREE.Mesh(new THREE.PlaneGeometry(b1 - b0, a1 - a0), mat); m.rotation.x = -Math.PI / 2; m.rotation.z = this.f > 0 ? Math.PI / 2 : -Math.PI / 2; m.position.set(this.X((b0 + b1) / 2), this.Y(o.lift || 0.004), this.Z((a0 + a1) / 2)); }
    else if (where === 'back') { m = new THREE.Mesh(new THREE.PlaneGeometry(a1 - a0, b1 - b0), mat); m.rotation.y = this.f > 0 ? Math.PI / 2 : -Math.PI / 2; m.position.set(this.X(D - (o.off || 0.004)), this.Y((b0 + b1) / 2), this.Z((a0 + a1) / 2)); }
    else { const left = where === 'left'; m = new THREE.Mesh(new THREE.PlaneGeometry(a1 - a0, b1 - b0), mat); m.rotation.y = left ? 0 : Math.PI; if (this.f < 0) m.rotation.y += Math.PI; m.position.set(this.X((a0 + a1) / 2), this.Y((b0 + b1) / 2), this.Z(left ? (o.off || 0.004) : W - (o.off || 0.004))); }
    this.extra.push(m); return m;
  }
  // A fire in a hearth: logs, flames that flicker, and a glow thrown on the floor.
  fire(u, d) {
    this.B(u - 0.1, u + 0.1, 0, 0.025, d - 0.03, d + 0.03, 0x3a2416); this.B(u - 0.08, u + 0.08, 0.02, 0.045, d - 0.05, d + 0.01, 0x4a2c18);
    const fm = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 1.1, 0.3), transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending });
    const flames = new THREE.Group();
    for (let i = 0; i < 4; i++) { const c = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.12, 6), fm); c.position.set(this.X(d), this.Y(0.09), this.Z(u - 0.06 + i * 0.04)); flames.add(c); }
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.7), new THREE.MeshBasicMaterial({ map: TX.radial(0, 1), color: new THREE.Color(0.8, 0.42, 0.14), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }));
    glow.rotation.x = -Math.PI / 2; glow.position.set(this.X(d - 0.2), this.Y(0.006), this.Z(u)); flames.add(glow);
    this.extra.push(flames); this.flames = { group: flames, mat: fm, glow };
  }
  // A candle with a small flame.
  candle(u, d, y) { this.C(u, d, y, y + 0.06, 0.008, 0xf2ead8); const f = new THREE.Mesh(new THREE.SphereGeometry(0.009, 6, 4), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.6, 1.6, 0.6) })); f.scale.y = 1.8; f.position.set(this.X(d), this.Y(y + 0.075), this.Z(u)); this.extra.push(f); (this.candles || (this.candles = [])).push(f); }
}

// ------------------------------------------------------------------ the four rooms
const ROOMS = [
  { code: 'A13', title: 'New England Bedroom, 1750–1850', hole: [0.65, 1.5], clock: true,
    find: { id: 'key', name: 'a brass key', u: 1.25, d: 0.62 },
    build(R) {
      R.panel('floor', 0, W, 0, D, planks('#b5814e', '#a87444'));
      R.B(0, W, 0, H, D, D + 0.04, 0xe9e2d0); R.B(-0.04, 0, 0, H, 0, D, 0xe9e2d0); R.B(W, W + 0.04, 0, H, 0, D, 0xe9e2d0); R.B(0, W, H, H + 0.04, 0, D, 0xe4dccb);
      for (let d = 0.2; d < D; d += 0.36) R.B(0, W, H - 0.05, H, d - 0.03, d + 0.03, 0x5a3a22);                       // beams across the ceiling
      R.B(0, W, 0.3, 0.32, D - 0.012, D, 0x8a6a48); R.B(0, W, 0, 0.05, D - 0.01, D, 0x5a3a22);                    // chair rail, skirting
      // four-poster with a white tester and a patchwork quilt
      R.B(0.08, 0.62, 0.08, 0.2, 0.45, 1.22, 0x6a4a2c, true); R.B(0.1, 0.6, 0.2, 0.24, 0.47, 1.2, 0xf2ede0);
      R.panel('floor', 0.1, 0.6, 0.47, 1.12, quilt(), { lift: 0.245 }); R.B(0.14, 0.56, 0.24, 0.29, 1.08, 1.19, 0xffffff);
      for (const [u, d] of [[0.09, 0.46], [0.61, 0.46], [0.09, 1.21], [0.61, 1.21]]) R.C(u, d, 0, 0.72, 0.016, 0x5a3a22);
      R.B(0.07, 0.63, 0.7, 0.72, 0.45, 1.22, 0xf6f2e6); for (const d of [0.45, 1.22]) R.B(0.07, 0.63, 0.6, 0.7, d - 0.005, d + 0.005, 0xf6f2e6);
      R.B(0.12, 0.56, 0, 0.15, 0.28, 0.42, 0x6d4a2c, true);                                                        // blanket chest at the foot
      // brick fireplace with a fire
      R.B(1.35, 1.88, 0, 0.5, D - 0.12, D, 0x8e4a36, true); R.B(1.45, 1.78, 0.01, 0.32, D - 0.125, D - 0.03, 0x1a1210); R.B(1.32, 1.91, 0.5, 0.53, D - 0.15, D, 0x5a3a22);
      R.fire(1.615, D - 0.08); R.candle(1.4, D - 0.06, 0.53); R.candle(1.83, D - 0.06, 0.53);
      R.B(1.55, 1.68, 0.53, 0.66, D - 0.08, D - 0.02, 0x4a3a2a); R.E(1.615, D - 0.085, 0.62, 0.035, 0.035, 0.005, 0xf0ead8);      // the mantel clock
      R.panel('back', 0.85, 1.2, 0.42, 0.86, view('snow'), { glow: 0.95 });                                           // a window on the snow
      R.panel('floor', 0.95, 1.55, 0.36, 0.96, braided(), { lift: 0.006 });
      R.B(1.0, 1.12, 0, 0.14, 0.95, 1.07, 0x6a4a2c); R.B(1.0, 1.12, 0.14, 0.42, 1.06, 1.08, 0x6a4a2c);                 // a ladder-back chair
      R.panel('right', 0.5, 0.8, 0.5, 0.75, picture(3));                                                              // a sampler
    } },
  { code: 'E8', title: 'English Bedroom of the Georgian Period, 1760–75', hole: [0.62, 1.47], clock: true,
    find: { id: 'thimble', name: 'a silver thimble', u: 0.78, d: 0.5 },
    build(R) {
      R.panel('floor', 0, W, 0, D, planks('#8a6038', '#7d5530'));
      R.panel('floor', 0.55, 1.75, 0.25, 1.0, carpet(), { lift: 0.006 });
      R.B(0, W, 0, H, D, D + 0.04, 0xb9cfb4); R.B(-0.04, 0, 0, H, 0, D, 0xb9cfb4); R.B(W, W + 0.04, 0, H, 0, D, 0xb9cfb4); R.B(0, W, H, H + 0.04, 0, D, 0xf2efe6);
      R.B(0, W, 0, 0.06, D - 0.01, D, 0xf2efe6); R.B(0, W, 0.3, 0.32, D - 0.012, D, 0xf2efe6); R.B(0, W, H - 0.06, H, D - 0.02, D, 0xf2efe6);      // skirting, dado, cornice
      for (const [a, b] of [[0.05, 0.25], [1.4, 1.95]]) { R.B(a, b, 0.4, 0.42, D - 0.008, D, 0xf2efe6); R.B(a, b, 0.98, 1.0, D - 0.008, D, 0xf2efe6); R.B(a, a + 0.02, 0.4, 1.0, D - 0.008, D, 0xf2efe6); R.B(b - 0.02, b, 0.4, 1.0, D - 0.008, D, 0xf2efe6); }      // panel mouldings
      // a canopy bed hung in rose silk
      R.B(1.45, 2.0, 0.08, 0.2, 0.5, 1.26, 0xdcd4c4, true); R.B(1.47, 1.98, 0.2, 0.25, 0.52, 1.24, 0xc46a7a);
      for (const [u, d] of [[1.46, 0.51], [1.99, 0.51], [1.46, 1.25], [1.99, 1.25]]) R.C(u, d, 0, 0.8, 0.014, 0xe8dcc8);
      R.B(1.44, 2.01, 0.76, 0.82, 0.5, 1.26, 0xc46a7a); R.B(1.44, 1.52, 0.25, 0.78, 0.49, 0.56, 0xb85a6a); R.B(1.93, 2.01, 0.25, 0.78, 0.49, 0.56, 0xb85a6a); R.B(1.44, 2.01, 0.2, 0.8, 1.24, 1.27, 0xb85a6a);
      R.B(1.52, 1.92, 0.25, 0.3, 1.12, 1.22, 0xffffff);
      // marble chimneypiece, a fire, and a gilt glass over it
      R.B(0.25, 0.85, 0, 0.42, D - 0.08, D, 0xece8e0, true); R.B(0.35, 0.75, 0.01, 0.3, D - 0.085, D - 0.02, 0x1a1410); R.B(0.22, 0.88, 0.42, 0.45, D - 0.1, D, 0xece8e0);
      R.fire(0.55, D - 0.06); R.candle(0.3, D - 0.05, 0.45); R.candle(0.8, D - 0.05, 0.45);
      R.panel('back', 0.33, 0.77, 0.5, 0.92, tex(64, 64, (c, w, h) => { c.fillStyle = '#b8892e'; c.fillRect(0, 0, w, h); const g = c.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#dfe6ea'); g.addColorStop(0.5, '#9aa8b2'); g.addColorStop(1, '#c8d2d8'); c.fillStyle = g; c.fillRect(6, 6, w - 12, h - 12); }), { glow: 0.8 });
      R.B(0.9, 1.04, 0.55, 0.62, D - 0.07, D - 0.02, 0x4a3a2a); R.E(0.97, D - 0.075, 0.585, 0.025, 0.025, 0.004, 0xf0ead8);      // a bracket clock on the wall shelf
      R.B(0.88, 1.06, 0.53, 0.55, D - 0.1, D, 0xf2efe6);
      R.panel('back', 1.08, 1.36, 0.4, 0.92, view('summer'), { glow: 0.95 });                                         // a sash window on the park
      // a dressing table against the side wall, and a sewing basket by it
      R.B(0, 0.16, 0.22, 0.25, 0.42, 0.82, 0x7a4a2a, true); for (const d of [0.44, 0.8]) R.C(0.14, d, 0, 0.22, 0.008, 0x7a4a2a); R.panel('left', 0.5, 0.74, 0.32, 0.6, picture(9), { off: 0.006 });
      R.C(0.42, 0.42, 0, 0.06, 0.045, 0xb08a52, 0.05, 12); R.E(0.42, 0.42, 0.065, 0.03, 0.012, 0.03, 0xc04a5a);
      R.panel('right', 0.25, 0.45, 0.55, 0.8, picture(14));
    } },
  { code: 'E17', title: 'French Bedroom of the Henri IV Period', hole: [1.0, 1.85], clock: true,
    find: { id: 'letter', name: 'a sealed letter', u: 1.42, d: 0.42 },
    build(R) {
      R.panel('floor', 0, W, 0, D, hexTiles());
      R.B(0, W, 0, H, D, D + 0.04, 0x7a2e26); R.B(-0.04, 0, 0, H, 0, D, 0x7a2e26); R.B(W, W + 0.04, 0, H, 0, D, 0x7a2e26); R.B(0, W, H, H + 0.04, 0, D, 0x3a2416);
      R.B(0, W, 0, 0.45, D - 0.015, D, 0x5a3c24); R.B(-0.0, 0.015, 0, 0.45, 0, D, 0x5a3c24); R.B(W - 0.015, W, 0, 0.45, 0, D, 0x5a3c24);       // oak panelling below
      for (let u = 0.15; u < W; u += 0.3) R.B(u - 0.02, u + 0.02, H - 0.06, H, 0, D, 0x4a2c18);                                     // a beamed ceiling
      for (let u = 0.1; u < W; u += 0.14) for (let y = 0.55; y < 1.05; y += 0.14) R.B(u - 0.012, u + 0.012, y - 0.012, y + 0.012, D - 0.006, D, 0xc8a24a);      // gilt stencil on the red
      // a carved four-poster in deep blue, its head to the back wall
      R.B(0.62, 1.28, 0.08, 0.22, 0.58, 1.27, 0x3a2416, true); R.B(0.64, 1.26, 0.22, 0.27, 0.6, 1.25, 0x23345e);
      for (const [u, d] of [[0.63, 0.59], [1.27, 0.59], [0.63, 1.26], [1.27, 1.26]]) R.C(u, d, 0, 0.9, 0.022, 0x3a2416, 0.018);
      R.B(0.6, 1.3, 0.86, 0.94, 0.57, 1.28, 0x23345e); R.B(0.6, 1.3, 0.86, 0.88, 0.57, 0.58, 0xc8a24a);
      R.B(0.6, 0.66, 0.27, 0.86, 0.57, 0.64, 0x1c2a4c); R.B(1.24, 1.3, 0.27, 0.86, 0.57, 0.64, 0x1c2a4c); R.B(0.7, 1.2, 0.27, 0.32, 1.12, 1.24, 0xe8e0d0);
      R.B(0.7, 1.2, 0, 0.14, 0.42, 0.54, 0x3a2416, true); R.B(0.7, 1.2, 0.14, 0.15, 0.42, 0.54, 0x4a2c18);                        // a carved coffer at the foot
      // a tall stone fireplace with a hood, on the left wall
      R.B(0, 0.12, 0, 0.42, 0.45, 1.05, 0xc8bea8, true); R.B(0, 0.115, 0.01, 0.3, 0.55, 0.95, 0x1a1410); R.B(0, 0.16, 0.42, H, 0.4, 1.1, 0xbcb29c); R.B(0, 0.2, 0.42, 0.47, 0.38, 1.12, 0xd8ceb8);
      R.fire(0.06, 0.75);
      R.panel('right', 0.25, 1.05, 0.5, 1.0, tapestry(), { off: 0.006 });                                                       // a tapestry: a white hart in a wood
      R.B(1.55, 1.68, 0, 0.18, 0.95, 1.08, 0x4a2c18); R.B(1.55, 1.68, 0.18, 0.5, 1.06, 1.08, 0x4a2c18);                       // a carved chair
      R.B(1.75, 1.95, 0.5, 0.52, D - 0.06, D, 0x4a2c18); R.B(1.79, 1.91, 0.52, 0.64, D - 0.05, D - 0.01, 0x8a6a3a); R.E(1.85, D - 0.055, 0.6, 0.03, 0.03, 0.004, 0xf0ead8);      // a table clock on a shelf
      R.panel('back', 1.42, 1.66, 0.45, 0.95, view('vale'), { glow: 0.95 });
    } },
  { code: 'E29', title: 'English Roman Catholic Church in the Gothic Style, 1275–1300', hole: [0.6, 1.45], clock: false,
    find: { id: 'mouse', name: 'a church mouse', u: 1.02, d: 0.55 },
    build(R) {
      R.panel('floor', 0, W, 0, D, flags());
      R.B(0, W, 0, H, D, D + 0.04, 0xb8b0a0); R.B(-0.04, 0, 0, H, 0, D, 0xb8b0a0); R.B(W, W + 0.04, 0, H, 0, D, 0xb8b0a0); R.B(0, W, H, H + 0.04, 0, D, 0x6a5a48);
      for (let d = 0.15; d < D; d += 0.38) { R.B(0, W, H - 0.07, H, d - 0.025, d + 0.025, 0x5a4a38); R.C(0.03, d, 0, H - 0.07, 0.025, 0xa8a090); R.C(W - 0.03, d, 0, H - 0.07, 0.025, 0xa8a090); }      // roof timbers on wall shafts
      // three lancets in the east wall, glowing
      for (const [i, u] of [[0, 0.62], [1, 1.02], [2, 1.42]]) { const hgt = i === 1 ? 0.78 : 0.66; R.panel('back', u - 0.09, u + 0.09, 0.28, 0.28 + hgt, lancet(31 + i), { basic: true, tint: 0xd8d8e8 }); R.B(u - 0.11, u - 0.09, 0.28, 0.28 + hgt, D - 0.01, D, 0x9a9282); R.B(u + 0.09, u + 0.11, 0.28, 0.28 + hgt, D - 0.01, D, 0x9a9282); }
      // the altar, its cloth and candles, and a small gilt cross
      R.B(0.75, 1.3, 0, 0.3, 1.05, 1.25, 0xd8d0c0, true); R.B(0.73, 1.32, 0.3, 0.315, 1.03, 1.27, 0xfaf6ea); R.B(0.73, 1.32, 0.18, 0.3, 1.025, 1.03, 0x9a2a2a);
      R.candle(0.82, 1.15, 0.315); R.candle(1.23, 1.15, 0.315); R.B(1.015, 1.035, 0.315, 0.45, 1.14, 1.16, 0xd8b04a); R.B(0.98, 1.07, 0.39, 0.41, 1.14, 1.16, 0xd8b04a);
      // a rood screen of oak across the chancel, open in the middle
      for (const [a, b] of [[0, 0.55], [1.5, W]]) { R.B(a, b, 0, 0.32, 0.8, 0.84, 0x5a3c24, true); for (let u = a + 0.06; u < b - 0.02; u += 0.09) R.B(u - 0.008, u + 0.008, 0.32, 0.72, 0.81, 0.83, 0x5a3c24); R.B(a, b, 0.72, 0.76, 0.79, 0.85, 0x5a3c24); }
      R.B(0.55, 1.5, 0.84, 0.88, 0.79, 0.85, 0x5a3c24); R.B(1.0, 1.04, 0.88, 1.06, 0.81, 0.83, 0xd8b04a); R.B(0.94, 1.1, 0.98, 1.0, 0.81, 0.83, 0xd8b04a);      // the beam over it, and its cross
      // a stone font, and two plain benches
      R.C(1.82, 0.3, 0, 0.18, 0.06, 0xb8b0a0, 0.08); R.C(1.82, 0.3, 0.18, 0.24, 0.09, 0xc8c0b0, 0.09); R.block(1.73, 1.91, 0.21, 0.39, 0.24);
      for (const u of [0.32, 1.72]) { R.B(u - 0.18, u + 0.18, 0.1, 0.12, 0.42, 0.5, 0x6a4a2c, true); R.B(u - 0.16, u - 0.14, 0, 0.1, 0.43, 0.49, 0x6a4a2c); R.B(u + 0.14, u + 0.16, 0, 0.1, 0.43, 0.49, 0x6a4a2c); }
    } },
];

// ------------------------------------------------------------------ the finds
function findMesh(kind) {
  const g = new THREE.Group(), std = (c, e = 0.35) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.4, metalness: 0.5, emissive: c, emissiveIntensity: e });
  if (kind === 'key') { const m = std(0xd8b04a); const ring = new THREE.Mesh(new THREE.TorusGeometry(0.018, 0.006, 6, 12), m); ring.rotation.x = Math.PI / 2; ring.position.x = -0.04; g.add(ring); const s = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.008, 0.008), m); g.add(s); const b = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.008, 0.02), m); b.position.set(0.03, 0, 0.012); g.add(b); g.position.y = 0.006; }
  if (kind === 'thimble') { const m = std(0xd8dde2, 0.4); const c = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.02, 0.035, 10), m); c.position.y = 0.0175; g.add(c); const t = new THREE.Mesh(new THREE.SphereGeometry(0.016, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), m); t.position.y = 0.035; g.add(t); }
  if (kind === 'letter') { const p = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.004, 0.055), new THREE.MeshStandardMaterial({ color: 0xf0e6cc, roughness: 0.9, emissive: 0xf0e6cc, emissiveIntensity: 0.35 })); p.position.y = 0.002; g.add(p); const s = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.004, 10), std(0xa8202a, 0.5)); s.position.y = 0.006; g.add(s); }
  if (kind === 'mouse') { const m = new THREE.MeshStandardMaterial({ color: 0x8a8278, roughness: 0.9, emissive: 0x3a3630, emissiveIntensity: 0.4 }); const b = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 8), m); b.scale.set(0.035, 0.022, 0.022); b.position.y = 0.022; g.add(b);
    const h = new THREE.Mesh(new THREE.ConeGeometry(0.014, 0.035, 8), m); h.rotation.z = -Math.PI / 2; h.position.set(0.045, 0.024, 0); g.add(h); for (const z of [-0.01, 0.01]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.008, 6, 4), new THREE.MeshStandardMaterial({ color: 0xd8a0a0, emissive: 0x6a3030, emissiveIntensity: 0.5 })); e.position.set(0.032, 0.04, z); g.add(e); }
    const t = new THREE.Mesh(new THREE.CylinderGeometry(0.002, 0.003, 0.07, 4), m); t.rotation.z = Math.PI / 2 - 0.3; t.position.set(-0.065, 0.012, 0); g.add(t); }
  const glint = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.16), new THREE.MeshBasicMaterial({ map: TX.radial(0, 1.6), color: new THREE.Color(1, 0.85, 0.55), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  glint.position.y = 0.05; glint.name = 'glint'; g.add(glint);
  return g;
}

// ------------------------------------------------------------------ the feature
feature({
  id: 'thorne',
  secrets: [['thorne', 'A room the size of a shoebox'], ['thorne:all', 'Inside the Thorne Rooms']],
  init(k) {
    const P = k.plan, gal = P.byId.G11; if (!gal) return;
    this.gal = gal; this.got = new Set(); try { for (const id of JSON.parse(localStorage.getItem(KEY) || '[]')) this.got.add(id); } catch { /* no storage */ }
    const y0 = gal.y, cx = (gal.x0 + gal.x1) / 2, cz = (gal.z0 + gal.z1) / 2, T = 0.05;
    // The case: four rooms, back to back across the middle of the gallery, with a gap at each end of it to walk round.
    const zA = cz - (W + 0.15), zB = cz + 0.15, xW = cx - 0.05 - D - T, xE = cx + 0.05 + D + T;      // glass planes
    const defs = [[ROOMS[0], -1, xW, zA], [ROOMS[1], -1, xW, zB], [ROOMS[2], 1, xE, zA], [ROOMS[3], 1, xE, zB]];
    const mat = cast({ roughness: 0.85, metalness: 0, emissiveIntensity: 0.42 });
    const glassM = new THREE.MeshStandardMaterial({ color: 0xdfeef5, transparent: true, opacity: 0.13, roughness: 0.05, metalness: 0.1, depthWrite: false, side: THREE.DoubleSide });
    const frameM = new THREE.MeshStandardMaterial({ color: 0x1e1812, roughness: 0.6, metalness: 0.2, emissive: 0x0e0a06, emissiveIntensity: 0.6 });
    const crackM = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55 });
    const O = P.obstacles, frame = [];
    this.rooms = defs.map(([def, f, xg, z0], i) => {
      const R = new RoomBuild({ f, xg: xg - f * T, z0, y0 });
      def.build(R);
      const mesh = new THREE.Mesh(mergeGeometries(R.parts), mat); mesh.matrixAutoUpdate = false; mesh.updateMatrix(); k.group.add(mesh);
      for (const e of R.extra) k.group.add(e);
      for (const s of R.solid) O.push(s);
      // The front: glass with a jagged hole knocked out of it at the foot, a frame round it, and the cracks running off the hole.
      const [h0, h1] = def.hole, hh = 0.62, sh = new THREE.Shape();
      sh.moveTo(0, 0); sh.lineTo(W, 0); sh.lineTo(W, H); sh.lineTo(0, H); sh.lineTo(0, 0);
      const jag = [[h0, 0], [h0 + 0.02, 0.22], [h0 - 0.01, 0.4], [h0 + 0.08, hh - 0.05], [(h0 + h1) / 2 - 0.1, hh + 0.04], [(h0 + h1) / 2 + 0.05, hh - 0.03], [h1 - 0.12, hh + 0.02], [h1 + 0.01, hh - 0.12], [h1 - 0.02, 0.3], [h1, 0]];
      const hole = new THREE.Path(); jag.forEach(([u, y], j) => j ? hole.lineTo(u, y) : hole.moveTo(u, y)); hole.lineTo(h0, 0); sh.holes.push(hole);
      const gg = new THREE.ShapeGeometry(sh), p = gg.attributes.position;
      for (let q = 0; q < p.count; q++) { const u = p.getX(q), yy = p.getY(q); p.setXYZ(q, xg, y0 + yy, z0 + u); }
      gg.computeVertexNormals(); const glass = new THREE.Mesh(gg, glassM); glass.renderOrder = 5; k.group.add(glass);
      const cr = []; for (const [u, yy] of [jag[3], jag[4], jag[6], jag[7]]) { let a = Math.atan2(1, (u - (h0 + h1) / 2) * 3), cu = u, cy = yy; for (let s = 0; s < 4; s++) { const nu = cu + Math.cos(a) * 0.07, ny = cy + Math.sin(a) * 0.07; cr.push(xg - f * 0.002, y0 + cy, z0 + cu, xg - f * 0.002, y0 + ny, z0 + nu); cu = nu; cy = ny; a += (s % 2 ? 0.5 : -0.4); } }
      const cg = new THREE.BufferGeometry(); cg.setAttribute('position', new THREE.Float32BufferAttribute(cr, 3)); k.group.add(new THREE.LineSegments(cg, crackM));
      // frame: posts at the ends, a rail along the top, a sill either side of the hole
      const fx0 = Math.min(xg, xg + f * 0.05), fx1 = Math.max(xg, xg + f * 0.05);
      frame.push([fx0, fx1, y0, y0 + H + 0.02, z0 - 0.04, z0], [fx0, fx1, y0, y0 + H + 0.02, z0 + W, z0 + W + 0.04], [fx0, fx1, y0 + H - 0.02, y0 + H + 0.05, z0 - 0.04, z0 + W + 0.04], [fx0, fx1, y0, y0 + 0.03, z0, z0 + h0], [fx0, fx1, y0, y0 + 0.03, z0 + h1, z0 + W]);
      // walls a car and a drone cannot pass: the glass either side of the hole, the glass above it, the sides and the back
      const gx0 = Math.min(xg, xg + f * 0.06), gx1 = Math.max(xg, xg + f * 0.06);
      O.push({ x0: gx0, x1: gx1, z0: z0 - 0.05, z1: z0 + h0, y0: y0 - 0.1, y1: y0 + H + 0.2 }, { x0: gx0, x1: gx1, z0: z0 + h1, z1: z0 + W + 0.05, y0: y0 - 0.1, y1: y0 + H + 0.2 }, { x0: gx0, x1: gx1, z0: z0 + h0, z1: z0 + h1, y0: y0 + hh - 0.06, y1: y0 + H + 0.2 });
      const bx0 = Math.min(xg, xg - f * (D + T + 0.06)), bx1 = Math.max(xg, xg - f * (D + T + 0.06));
      O.push({ x0: bx0, x1: bx1, z0: z0 - 0.1, z1: z0 - 0.005, y0: y0 - 0.1, y1: y0 + H + 0.2 }, { x0: bx0, x1: bx1, z0: z0 + W + 0.005, z1: z0 + W + 0.1, y0: y0 - 0.1, y1: y0 + H + 0.2 });
      // the plaque on the fascia over the glass
      const pl = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.12), new THREE.MeshBasicMaterial({ map: plaque(def.code, def.title), color: new THREE.Color(0.9, 0.85, 0.75) }));
      pl.rotation.y = f > 0 ? Math.PI / 2 : -Math.PI / 2; pl.position.set(xg + f * 0.062, y0 + H + 0.12, z0 + W / 2); k.group.add(pl);
      // the find
      const fd = def.find, fm = findMesh(fd.id); fm.position.set(R.X(fd.d), y0 + 0.005, R.Z(fd.u)); fm.rotation.y = i * 1.3; k.group.add(fm);
      return { def, f, xg, z0, y0, R, find: { ...fd, x: R.X(fd.d), z: R.Z(fd.u), mesh: fm }, flames: R.flames, candles: R.candles || [] };
    });
    // the back walls between the rooms, the posts between the pairs, the cornice over the whole case, and its top (which a drone cannot drop through)
    const cxW = cx - 0.05, cxE = cx + 0.05;
    const caseG = new THREE.Group(), cb = (x0, x1, a, b, z0, z1, m = frameM) => { const g = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, b - a, z1 - z0), m); g.position.set((x0 + x1) / 2, (a + b) / 2, (z0 + z1) / 2); caseG.add(g); };
    cb(cxW, cxE, y0, y0 + H + 0.05, zA - 0.05, zB + W + 0.05);
    cb(xW - 0.06, xE + 0.06, y0 + H + 0.02, y0 + H + 0.2, zA - 0.1, zB + W + 0.1);
    cb(xW - 0.08, xE + 0.08, y0 + H + 0.2, y0 + H + 0.26, zA - 0.12, zB + W + 0.12);
    cb(xW, xE, y0, y0 + H + 0.05, zA + W, zB);
    for (const b of frame) cb(b[0], b[1], b[2], b[3], b[4], b[5]);
    caseG.traverse(o => { if (o.isMesh) { o.matrixAutoUpdate = false; o.updateMatrix(); } }); k.group.add(caseG);
    O.push({ x0: cxW, x1: cxE, z0: zA - 0.05, z1: zB + W + 0.05, y0: y0 - 0.1, y1: y0 + H + 0.2 }, { x0: xW - 0.06, x1: xE + 0.06, z0: zA + W, z1: zB, y0: y0 - 0.1, y1: y0 + H + 0.26 }, { x0: xW - 0.08, x1: xE + 0.08, z0: zA - 0.12, z1: zB + W + 0.12, y0: y0 + H, y1: y0 + H + 0.3 });
    // A soft wash of light on the gallery floor in front of each case, as if from inside.
    for (const rm of this.rooms) { const l = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 2.4), new THREE.MeshBasicMaterial({ map: TX.radial(0, 1.2), color: new THREE.Color(0.32, 0.22, 0.1), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 })); l.rotation.x = -Math.PI / 2; l.position.set(rm.xg + rm.f * 0.6, y0 + 0.01, rm.z0 + W / 2); k.group.add(l); }
    for (const rm of this.rooms) if (this.got.has(rm.find.id)) rm.find.mesh.visible = false;
    this.t = 0; this.tick = 0; this.inside = null;
  },
  active(k) { return !!this.rooms && k.inRoom('G11', 2); },
  // Which room is the toy inside? (Between the glass and the back wall, along the front, under the ceiling.)
  _inside(p) {
    for (const rm of this.rooms) { const d = (rm.xg - p.x) * rm.f; if (d > 0.02 && d < D && p.z > rm.z0 && p.z < rm.z0 + W && p.y < rm.y0 + H) return rm; }
    return null;
  },
  update(dt, k) {
    this.t += dt;
    const p = k.pos, rm = this._inside(p);
    if (!this.introduced) { this.introduced = true; k.once('thorne-cases', 'Four of the miniature rooms, built big enough to drive into. A pane is cracked out at the foot of each case.', 7); }
    // the fires and candles flicker; the finds glint
    const fl = 0.75 + 0.25 * Math.sin(this.t * 13) * Math.sin(this.t * 7.3 + 1);
    for (const r of this.rooms) {
      if (r.flames) { r.flames.mat.opacity = 0.55 + 0.4 * fl; r.flames.group.children.forEach((c, i) => { if (c.geometry.type === 'ConeGeometry') c.scale.y = 0.8 + 0.35 * Math.sin(this.t * (9 + i * 2.3) + i); }); r.flames.glow.material.opacity = 0.6 + 0.3 * fl; }
      for (const c of r.candles) c.scale.set(1, 1.6 + 0.4 * Math.sin(this.t * 11 + c.position.x * 50), 1);
      const g = r.find.mesh.getObjectByName('glint'); if (g && r.find.mesh.visible) { g.material.opacity = 0.35 + 0.35 * Math.sin(this.t * 3 + r.find.x); g.quaternion.copy(k.G.camera ? k.G.camera.quaternion : g.quaternion); }
    }
    if (rm !== this.inside) { this.inside = rm; if (rm) { if (k.find('thorne')) k.callout('A ROOM THE SIZE OF A SHOEBOX'); k.say(`${rm.def.code}: ${rm.def.title}.`, 4); } }
    if (!rm) return;
    // Inside: the camera stands outside the glass and looks in at the toy, as a visitor would.
    const zc = Math.max(rm.z0 + 0.45, Math.min(rm.z0 + W - 0.45, p.z));
    if (k.G.view !== 'fpv') k.camClose = { at: { x: rm.xg + rm.f * 1.45, y: rm.y0 + 0.78, z: zc }, look: { x: p.x, y: p.y + 0.12, z: p.z } };
    // the find
    const fd = rm.find;
    if (fd.mesh.visible && (p.x - fd.x) ** 2 + (p.z - fd.z) ** 2 < 0.3 * 0.3 && p.y < rm.y0 + 0.7) {
      fd.mesh.visible = false; this.got.add(fd.id); try { localStorage.setItem(KEY, JSON.stringify([...this.got])); } catch { /* fine */ }
      const n = this.rooms.filter(r => this.got.has(r.find.id)).length;
      k.synth.chime([880, 1175, 1568], { gap: 0.09, dur: 0.9, vol: 0.05 });
      if (n >= this.rooms.length) { if (k.find('thorne:all')) k.callout('EVERY ROOM SEARCHED'); else k.callout(`FOUND ${fd.name.toUpperCase()}`); }
      else { k.callout(`FOUND ${fd.name.toUpperCase()} · ${n} / ${this.rooms.length}`); }
    }
    // sounds of the room: the fire, and the clock on the mantel
    if (rm.flames && Math.random() < dt * 9) k.synth.noise(0.02 + Math.random() * 0.05, { vol: 0.015 + Math.random() * 0.03, lp: 1400 + Math.random() * 3000 });
    if (rm.def.clock) { this.tick += dt; if (this.tick > 0.5) { this.tick -= 0.5; this.tock = !this.tock; k.synth.note(this.tock ? 2400 : 2050, 0.03, { type: 'square', vol: 0.012 }); } }
  },
  spots() {
    if (!this.rooms) return [];
    const r0 = this.rooms[0];
    return [{ kind: 'secret', id: 'thorne', name: 'A room the size of a shoebox', x: r0.xg - r0.f * 0.6, y: r0.y0, z: r0.z0 + 1 },
      { kind: 'secret', id: 'thorne:all', name: 'Inside the Thorne Rooms (four finds)', x: this.gal.x0 + 6, y: r0.y0, z: (this.gal.z0 + this.gal.z1) / 2 },
      ...this.rooms.map(r => ({ kind: 'todo', id: 'thorne:' + r.find.id, name: r.find.name, x: r.find.x, y: r.y0, z: r.find.z }))];
  },
  reset() {
    // The finds stay found: this is a search over many nights, not one.
  },
});
