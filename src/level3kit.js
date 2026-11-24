// The few small makings the Level 3 files share (level3.js, level3-terrace.js, level3-back.js): materials that read
// at night, a canvas texture, a turned (lathe) shape, a soft glow, a clear spot on a room's floor, a solid box in the plan.
import * as THREE from 'three';
import { shrink } from './budget.js';
import { freeFloor } from './placing.js';

export const TAU = Math.PI * 2;
// Lit a little from within, as the game's furniture is, so a thing reads in a dark room before its lamps wake.
export const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, emissive: color, emissiveIntensity: 0.16, ...o });
export const metal = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.32, metalness: 0.75, emissive: color, emissiveIntensity: 0.22, ...o });
export const glowMat = (color, o = {}) => new THREE.MeshBasicMaterial({ color, toneMapped: false, ...o });

export function canvasTex(w, h, draw, { srgb = true, repeat = null } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(shrink(c)); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  return t;
}
// A shape turned on a lathe: pts are [radius, height] pairs from the bottom up.
export function lathe(pts, seg = 28) { return new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(Math.max(0.0001, r), y)), seg); }
// A soft round glow, laid flat or standing (a quad facing +z), drawn additively.
let _glowTex = null;
export function glowTex() {
  if (_glowTex) return _glowTex;
  return (_glowTex = canvasTex(64, 64, (g, w, h) => { const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.35, 'rgba(255,255,255,.45)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, w, h); }, { srgb: false }));
}
// With face set, it turns to the camera wherever that is.
export function glow(size, color, opacity = 0.8, face = true) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshBasicMaterial({ map: glowTex(), color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  m.renderOrder = 6;
  if (face) m.onBeforeRender = (r, s, cam) => { m.quaternion.copy(cam.quaternion); m.updateMatrix(); if (m.parent) m.matrixWorld.multiplyMatrices(m.parent.matrixWorld, m.matrix); else m.matrixWorld.copy(m.matrix); m.modelViewMatrix.multiplyMatrices(cam.matrixWorldInverse, m.matrixWorld); m.normalMatrix.getNormalMatrix(m.modelViewMatrix); };
  return m;
}
// A clear patch of floor in a room, near the fractions (fx, fz) of the way across it; null if there is none.
export function spot(k, id, fx, fz, rad = 0.5, doors = 1.4) {
  const r = k.plan.byId[id]; if (!r) return null;
  const s = freeFloor(k.plan, r, r.x0 + (r.x1 - r.x0) * fx, r.z0 + (r.z1 - r.z0) * fz, rad, doors);
  return s ? { x: s.x, y: r.y, z: s.z, room: r } : null;
}
// Something that stands on the floor and stops the toy: a box in the plan's obstacles, as tall as it is drawn.
export function block(k, x, z, hw, hd, y0, y1) { const o = { x0: x - hw, x1: x + hw, z0: z - hd, z1: z + hd, y0, y1 }; k.plan.obstacles.push(o); return o; }
// A seeded random, so every night is the same.
export function rnd(seed) { let s = seed >>> 0 || 1; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
// Ease in and out.
export const ease = t => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
// Paint a whole geometry one colour (as vertex colours), so many parts can be merged into one mesh.
export function paintGeo(g, hex) {
  g = g.index ? g.toNonIndexed() : g; const c = new THREE.Color(hex), n = g.attributes.position.count, a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; }
  g.setAttribute('color', new THREE.BufferAttribute(a, 3)); if (g.attributes.uv) g.deleteAttribute('uv'); return g;
}
