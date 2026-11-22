// The warming hut on Butler Field, between the two southern diamonds by Jackson Drive: the kind of timber hut the
// Chicago parks put out by a skating rink. Barn-red board and batten with cream trim, a steep roof under snow with
// icicles and coloured lights along its eaves, a brick chimney smoking, and a covered porch on its gable end, facing
// the field, with a lantern by the door, a wreath, and the sign on the gable over the porch (clear of the roof).
//
// Its double doors stand open and the toy can drive in. Inside: a pot-bellied stove with a fire in it, benches round
// the walls with mittens and a scarf drying on a line, skates on pegs, a coat tree, a counter with a cocoa urn, mugs
// and marshmallows, a chalk menu, a braided rug, a woodpile, and a cat asleep by the stove. Drive up to the stove to
// warm up. Every wall, post, bench, the stove, the counter and the roof is solid as drawn (bench tops, the counter,
// the woodpiles and the roof are somewhere to land); the roof is a ceiling from inside.
//
// Cheap on a phone: one mesh per material, no real light (the fire and the lantern are a glow worked into the
// materials, the light from the windows and the door is painted on the snow), and nothing is done per frame unless
// the toy is near.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { feature } from './features.js';
import { fitText, SERIF } from './textures.js';
import { TAU, C, Bulbs, Wire, canvasTex } from './glowkit.js';

const HX = 430.5, HZ = 238;                 // the middle of the hut (local frame: x east, z south; the porch faces north, -z)
const W2 = 2.6, D2 = 2.8, T = 0.12;          // half its width and depth, to the outer faces of the walls; their thickness
const IX = W2 - T, IZ = D2 - T;              // the room inside, half sizes
const FL = 0.07;                             // the floor and the porch deck
const EV = 2.5, P = 0.6, RT = 0.28;          // the eaves (the walls' tops, outside), the pitch, the roof's depth with its snow
const OV = 0.4;                              // the eaves' overhang
const PZ = -D2 - 1.5;                        // the porch's posts
const RZ0 = PZ - 0.3, RZ1 = D2 + 0.35;       // the roof's front and back edges
const EX = W2 + OV;                          // the eaves' edge
const under = x => EV + (W2 - Math.abs(x)) * P;       // the underside of the roof over x
const roofTop = x => under(x) + RT;
const DOOR = 0.7, DH = 2.05;                 // the doorway, half its width, and its height
const WIN = { w: 0.8, y0: 1.05, y1: 1.85 };
const WINDOWS = [['front', -1.75], ['front', 1.75], ['west', 0], ['east', -0.9], ['east', 1.9]];
const STOVE = { x: 0, z: 1.95 }, PIPE = { x: 0, z: 2.12 }, CAT = { x: -0.74, z: 1.12 }, WARM = { x: 0, z: 1.25 };
const LAMP = { x: -1.05, y: 1.98, z: -D2 - 0.13 }, PEND = { x: 1.95, y: 2.05, z: -0.15 };
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

// ---------------------------------------------------------------- the glow, worked into the materials
// A warm light from the fire (flickering) and from the lantern, falling off with distance, added to a surface's own
// colour. Inside, the moonlit sky light is turned down: the room is lit by its fire.
const U = { fireP: { value: new THREE.Vector3(HX + STOVE.x, FL + 0.55, HZ + STOVE.z - 0.3) }, lampP: { value: new THREE.Vector3(HX + LAMP.x, LAMP.y, HZ + LAMP.z) }, pendP: { value: new THREE.Vector3(HX + PEND.x, PEND.y - 0.15, HZ + PEND.z) }, flick: { value: 1 } };
function warm(mat, { fire = 0, lamp = 0, pend = 0, base = 0.1, direct = 1 } = {}) {
  const u = { hFireK: { value: fire }, hLampK: { value: lamp }, hPendK: { value: pend }, hBase: { value: base }, hDirect: { value: direct } };
  mat.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, u, { hFireP: U.fireP, hLampP: U.lampP, hPendP: U.pendP, hFlick: U.flick });
    sh.vertexShader = 'varying vec3 vHutW;\n' + sh.vertexShader.replace('#include <project_vertex>', `#include <project_vertex>
      { vec4 hw = vec4(transformed, 1.0);
      #ifdef USE_INSTANCING
        hw = instanceMatrix * hw;
      #endif
        vHutW = (modelMatrix * hw).xyz; }`);
    sh.fragmentShader = 'varying vec3 vHutW;\nuniform vec3 hFireP, hLampP, hPendP;\nuniform float hFlick, hFireK, hLampK, hPendK, hBase, hDirect;\n' + sh.fragmentShader
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
      { vec3 a = vHutW - hFireP, b = vHutW - hLampP, c = vHutW - hPendP;
        float f = hFireK * hFlick / (1.0 + dot(a, a) * 0.42), l = hLampK / (1.0 + dot(b, b) * 1.6) + hPendK / (1.0 + dot(c, c) * 1.1);
        totalEmissiveRadiance += diffuseColor.rgb * (vec3(hBase) + vec3(1.0, 0.55, 0.24) * f + vec3(1.0, 0.72, 0.4) * l); }`)
      .replace('#include <lights_fragment_end>', '#include <lights_fragment_end>\n reflectedLight.directDiffuse *= hDirect; reflectedLight.indirectDiffuse *= hDirect; reflectedLight.directSpecular *= hDirect;');
  };
  mat.customProgramCacheKey = () => 'hutwarm';
  return mat;
}
const INSIDE = { fire: 1.15, pend: 0.75, base: 0.07, direct: 0.3 }, OUTSIDE = { lamp: 0.55, base: 0.1 };

// ---------------------------------------------------------------- drawing: one mesh a material
class Bag {
  constructor() { this.by = new Map(); this.c = new THREE.Color(); }
  put(mat, geo, M, col) {
    const g = geo.index ? geo.toNonIndexed() : geo.clone();
    for (const n of Object.keys(g.attributes)) if (n !== 'position' && n !== 'normal' && n !== 'uv') g.deleteAttribute(n);
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    if (!g.attributes.normal) g.computeVertexNormals();
    if (M) g.applyMatrix4(M);
    if (mat.vertexColors) { const c = this.c.set(col == null ? 0xffffff : col), n = g.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) { a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; } g.setAttribute('color', new THREE.BufferAttribute(a, 3)); }
    if (!this.by.has(mat)) this.by.set(mat, []);
    this.by.get(mat).push(g);
  }
  done(parent) {
    for (const [mat, list] of this.by) { const m = new THREE.Mesh(mergeGeometries(list), mat); m.matrixAutoUpdate = false; m.updateMatrix(); parent.add(m); }
    this.by.clear();
  }
}
const _q = new THREE.Quaternion(), _e = new THREE.Euler(), _v = new THREE.Vector3(), _s = new THREE.Vector3();
const MX = (x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) => new THREE.Matrix4().compose(_v.set(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz)), _s.set(sx, sy, sz));
// A box with its texture laid on in metres (times s), so boards and bricks keep their size whatever the box.
function boxG(w, h, d, s = 1) {
  const g = new THREE.BoxGeometry(w, h, d), uv = g.attributes.uv, dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let i = 0; i < 4; i++) { const k = f * 4 + i; uv.setXY(k, uv.getX(k) * dims[f][0] * s, uv.getY(k) * dims[f][1] * s); }
  return g;
}
// A box from (x0, y0, z0) to (x1, y1, z1).
const box = (bag, mat, x0, x1, y0, y1, z0, z1, col, s) => bag.put(mat, boxG(x1 - x0, y1 - y0, z1 - z0, s), MX((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), col);
// A box whose bottom runs at y0 at x0 and rises `slope` a metre along x (a rafter, a roof board): its sides stay upright.
function sheared(bag, mat, x0, x1, y0, h, z0, z1, slope, col, s) {
  const g = boxG(x1 - x0, h, z1 - z0, s); g.translate((x1 - x0) / 2, h / 2, 0);
  g.applyMatrix4(new THREE.Matrix4().set(1, 0, 0, 0, slope, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1));
  g.translate(x0, y0, (z0 + z1) / 2); bag.put(mat, g, null, col);
}
// A thin rod between two points.
function rod(bag, mat, a, b, r, col, seg = 5) {
  const d = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]), L = d.length(), g = new THREE.CylinderGeometry(r, r, L, seg, 1, true);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
  bag.put(mat, g, new THREE.Matrix4().compose(new THREE.Vector3((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2), q, new THREE.Vector3(1, 1, 1)), col);
}
// A wall's face: an outline (and holes) drawn in the wall's own (u, y), u along it, set in the plane through c
// facing n (n = [nx, nz], one of the four ways). Texture in metres.
const along = n => [n[1], -n[0]];
const uOf = (n, c, x, z) => { const a = along(n); return (x - c[0]) * a[0] + (z - c[1]) * a[1]; };
function frame(n, c, d = 0) { const a = along(n); return new THREE.Matrix4().makeBasis(new THREE.Vector3(a[0], 0, a[1]), new THREE.Vector3(0, 1, 0), new THREE.Vector3(n[0], 0, n[1])).setPosition(c[0] + n[0] * d, 0, c[1] + n[1] * d); }
function face(n, c, outline, holes = []) {
  const sh = new THREE.Shape(outline.map(([a, b]) => new THREE.Vector2(a, b)));
  for (const h of holes) sh.holes.push(new THREE.Path(h.map(([a, b]) => new THREE.Vector2(a, b))));
  const g = new THREE.ShapeGeometry(sh); g.applyMatrix4(frame(n, c)); return g;
}
// A box in a wall's frame: a0..a1 along it, y0..y1 up, d0..d1 out from its face.
function wbox(bag, mat, n, c, a0, a1, y0, y1, d0, d1, col) {
  const g = boxG(a1 - a0, y1 - y0, d1 - d0); g.translate((a0 + a1) / 2, (y0 + y1) / 2, (d0 + d1) / 2); g.applyMatrix4(frame(n, c)); bag.put(mat, g, null, col);
}
const rect = (a0, a1, y0, y1) => [[a0, y0], [a1, y0], [a1, y1], [a0, y1]];

// ---------------------------------------------------------------- what it is painted with
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
const R = rng(5150);
const wrap = (t, s) => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(s, s); return t; };
// Barn red board and batten, 1.2 m square: wide boards, a batten over each joint, weathered at the foot.
const battenTex = () => wrap(canvasTex(256, 256, (c, w, h) => {
  c.fillStyle = '#7b2620'; c.fillRect(0, 0, w, h);
  for (let x = 0; x < w; x += 64) { c.fillStyle = `rgba(${R() < 0.5 ? '0,0,0' : '255,200,170'},${0.03 + R() * 0.05})`; c.fillRect(x, 0, 64, h); }
  for (let i = 0; i < 260; i++) { c.fillStyle = `rgba(0,0,0,${0.04 + R() * 0.06})`; c.fillRect(R() * w, R() * h, 1, 6 + R() * 30); }
  for (let x = 0; x < w; x += 64) { c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(x + 7, 0, 3, h); c.fillStyle = '#8c2f26'; c.fillRect(x - 6, 0, 13, h); c.fillStyle = 'rgba(255,215,190,.18)'; c.fillRect(x - 6, 0, 2, h); }
}), 1 / 1.2);
// Knotty pine boards, upright, 1.2 m square.
const pineTex = (base = '#b47a43') => wrap(canvasTex(256, 256, (c, w, h) => {
  c.fillStyle = base; c.fillRect(0, 0, w, h);
  for (let x = 0; x < w; x += 32) {
    c.fillStyle = `rgba(${R() < 0.5 ? '90,40,10' : '255,230,180'},${0.05 + R() * 0.1})`; c.fillRect(x, 0, 32, h);
    for (let i = 0; i < 9; i++) { c.strokeStyle = `rgba(90,45,15,${0.1 + R() * 0.15})`; c.lineWidth = 1; c.beginPath(); const gx = x + 3 + R() * 26; c.moveTo(gx, 0); c.bezierCurveTo(gx + R() * 6 - 3, h * 0.33, gx + R() * 6 - 3, h * 0.66, gx, h); c.stroke(); }
    if (R() < 0.7) { const kx = x + 8 + R() * 16, ky = R() * h; c.fillStyle = 'rgba(80,35,10,.6)'; c.beginPath(); c.ellipse(kx, ky, 3 + R() * 2, 5 + R() * 3, 0, 0, TAU); c.fill(); c.strokeStyle = 'rgba(90,45,15,.3)'; c.beginPath(); c.ellipse(kx, ky, 6, 10, 0, 0, TAU); c.stroke(); }
    c.fillStyle = 'rgba(40,18,5,.55)'; c.fillRect(x, 0, 2, h);
  }
}), 1 / 1.2);
// Floor boards, running in from the door, 1.44 m square.
const floorTex = () => wrap(canvasTex(256, 256, (c, w, h) => {
  c.fillStyle = '#6e4a2e'; c.fillRect(0, 0, w, h);
  for (let x = 0; x < w; x += 32) {
    let y = -R() * 120;
    while (y < h) { const L = 90 + R() * 120; c.fillStyle = `rgba(${R() < 0.5 ? '20,10,0' : '255,220,170'},${0.04 + R() * 0.1})`; c.fillRect(x, y, 32, L); c.fillStyle = 'rgba(20,10,0,.5)'; c.fillRect(x, y, 32, 2); y += L; }
    for (let i = 0; i < 6; i++) { c.fillStyle = `rgba(30,15,5,${0.08 + R() * 0.1})`; c.fillRect(x + 2 + R() * 28, 0, 1, h); }
    c.fillStyle = 'rgba(20,10,0,.6)'; c.fillRect(x, 0, 2, h);
  }
}), 1 / 1.44);
// Brick, 1 m square.
const brickTex = (soot = false) => wrap(canvasTex(256, 256, (c, w, h) => {
  c.fillStyle = '#8f8a80'; c.fillRect(0, 0, w, h);
  for (let r = 0, y = 0; y < h; r++, y += 17) for (let x = (r % 2) * -26; x < w; x += 52) { const t = R(); c.fillStyle = `rgb(${130 + t * 50},${52 + t * 20},${38 + t * 14})`; c.fillRect(x + 2, y + 2, 48, 13); }
  if (soot) { const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(10,8,6,.55)'); g.addColorStop(0.6, 'rgba(10,8,6,.1)'); g.addColorStop(1, 'rgba(10,8,6,0)'); c.fillStyle = g; c.fillRect(0, 0, w, h); }
}), 1);
// Slate for the hearth.
const slateTex = () => canvasTex(128, 128, (c, w, h) => {
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { const t = R(); c.fillStyle = `rgb(${46 + t * 18},${48 + t * 18},${54 + t * 16})`; c.fillRect(i * 32 + 1, j * 32 + 1, 30, 30); }
});
// The braided rug: rings of colour, oval.
const rugTex = () => canvasTex(256, 160, (c, w, h) => {
  const cols = ['#8e2b2b', '#d6c59c', '#2f5a3f', '#b5652f', '#24324e', '#d6c59c', '#8e2b2b', '#5a6e3a'];
  for (let i = 0; i < 14; i++) { const k = 1 - i / 14; c.fillStyle = cols[i % cols.length]; c.beginPath(); c.ellipse(w / 2, h / 2, (w / 2 - 2) * k, (h / 2 - 2) * k, 0, 0, TAU); c.fill(); }
  c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 1;
  for (let i = 0; i < 14; i++) { const k = 1 - i / 14; for (let a = 0; a < TAU; a += 0.09) { const x = w / 2 + Math.cos(a) * (w / 2 - 6) * k, y = h / 2 + Math.sin(a) * (h / 2 - 6) * k; c.beginPath(); c.moveTo(x - 2, y - 2); c.lineTo(x + 2, y + 2); c.stroke(); } }
});
// The doormat: coir.
const matTex = () => canvasTex(128, 64, (c, w, h) => {
  c.fillStyle = '#8b6a3c'; c.fillRect(0, 0, w, h);
  for (let i = 0; i < 900; i++) { c.fillStyle = `rgba(${R() < 0.5 ? '40,25,10' : '220,180,120'},.35)`; c.fillRect(R() * w, R() * h, 1, 2); }
  c.strokeStyle = '#3b2a17'; c.lineWidth = 6; c.strokeRect(4, 4, w - 8, h - 8);
});
// Frosted glass, lit warm from inside (seen from out in the snow), and the night through it (seen from inside).
const glassOut = () => canvasTex(128, 128, (c, w, h) => {
  const g = c.createRadialGradient(w / 2, h * 0.55, 4, w / 2, h / 2, w * 0.75); g.addColorStop(0, '#ffe2a8'); g.addColorStop(1, '#d98e48'); c.fillStyle = g; c.fillRect(0, 0, w, h);
  frost(c, w, h, 'rgba(255,248,235,', 0.55);
});
const glassIn = () => canvasTex(128, 128, (c, w, h) => {
  const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#0b1530'); g.addColorStop(1, '#1d2d52'); c.fillStyle = g; c.fillRect(0, 0, w, h);
  for (let i = 0; i < 14; i++) { c.fillStyle = `rgba(255,255,255,${0.3 + R() * 0.5})`; c.fillRect(R() * w, R() * h * 0.6, 1.5, 1.5); }
  frost(c, w, h, 'rgba(220,235,255,', 0.6);
});
function frost(c, w, h, rgba, a) {
  // ferns of frost growing in from the corners and along the bottom
  for (let i = 0; i < 26; i++) {
    const corner = i % 4, x0 = corner % 2 ? w : 0, y0 = corner < 2 ? h : (R() < 0.5 ? 0 : h);
    let x = x0 + (corner % 2 ? -1 : 1) * R() * 20, y = y0 - (y0 ? 1 : -1) * R() * 14, ang = Math.atan2(h / 2 - y, w / 2 - x) + (R() - 0.5) * 1.2;
    c.strokeStyle = rgba + (a * (0.4 + R() * 0.6)) + ')'; c.lineWidth = 1;
    for (let s = 0; s < 10; s++) { const L = 3 + R() * 5, nx = x + Math.cos(ang) * L, ny = y + Math.sin(ang) * L; c.beginPath(); c.moveTo(x, y); c.lineTo(nx, ny); c.stroke(); for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(nx, ny); c.lineTo(nx + Math.cos(ang + sd * 0.9) * L * 0.6, ny + Math.sin(ang + sd * 0.9) * L * 0.6); c.stroke(); } x = nx; y = ny; ang += (R() - 0.5) * 0.6; }
  }
  const g = c.createLinearGradient(0, h, 0, h * 0.6); g.addColorStop(0, rgba + (a * 0.8) + ')'); g.addColorStop(1, rgba + '0)'); c.fillStyle = g; c.fillRect(0, h * 0.6, w, h * 0.4);
}
function flake(c, x, y, r) {
  c.save(); c.translate(x, y); c.lineWidth = 4; c.lineCap = 'round';
  for (let i = 0; i < 6; i++) { c.rotate(TAU / 6); c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -r); c.moveTo(0, -r * 0.55); c.lineTo(-r * 0.25, -r * 0.78); c.moveTo(0, -r * 0.55); c.lineTo(r * 0.25, -r * 0.78); c.stroke(); }
  c.restore();
}
// The sign on the gable: painted green board, cream letters, a gold line round it.
const signTex = () => canvasTex(1024, 256, (c, w, h) => {
  const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#22513a'); g.addColorStop(1, '#173b29'); c.fillStyle = g; c.fillRect(0, 0, w, h);
  for (let i = 0; i < 70; i++) { c.strokeStyle = `rgba(0,0,0,${0.04 + R() * 0.06})`; c.lineWidth = 1 + R() * 2; const y = R() * h; c.beginPath(); c.moveTo(0, y); c.bezierCurveTo(w * 0.3, y + 8 * (R() - 0.5), w * 0.7, y + 8 * (R() - 0.5), w, y); c.stroke(); }
  c.strokeStyle = '#efe2bf'; c.lineWidth = 9; c.beginPath(); c.roundRect(16, 16, w - 32, h - 32, 26); c.stroke();
  c.strokeStyle = '#c99a3e'; c.lineWidth = 3; c.beginPath(); c.roundRect(34, 34, w - 68, h - 68, 16); c.stroke();
  c.strokeStyle = '#dfeefa'; flake(c, 112, h / 2, 40); flake(c, w - 112, h / 2, 40);
  c.fillStyle = '#f7edd2'; c.shadowColor = 'rgba(0,0,0,.55)'; c.shadowOffsetY = 4; c.shadowBlur = 6;
  fitText(c, 'WARMING HUT', { x: w / 2, y: h / 2 + 6, w: w - 320, h: h - 96, px: 150, weight: '700', family: SERIF });
});
const CHALK = '"Chalkboard SE", "Marker Felt", "Bradley Hand", "Comic Sans MS", cursive';
// The chalk menu over the counter.
const menuTex = () => canvasTex(512, 384, (c, w, h) => {
  c.fillStyle = '#1c2520'; c.fillRect(0, 0, w, h);
  for (let i = 0; i < 18; i++) { const x = R() * w, y = R() * h, r = 30 + R() * 70, g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, 'rgba(255,255,255,.05)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, w, h); }
  c.fillStyle = '#f4efe2'; fitText(c, 'HOT DRINKS', { x: w / 2, y: 52, w: w - 120, h: 56, px: 54, weight: '700', family: CHALK });
  c.strokeStyle = 'rgba(244,239,226,.8)'; c.lineWidth = 3; c.beginPath(); for (let x = 120; x <= w - 120; x += 8) c.lineTo(x, 88 + Math.sin(x * 0.15) * 3); c.stroke();
  [['COCOA', '1.00', '#ffd9a0'], ['CIDER', '1.00', '#ffe9a8'], ['TEA', '.50', '#bfe6ff']].forEach(([a, b, col], i) => {
    const y = 142 + i * 64; c.fillStyle = col;
    fitText(c, a, { x: 170, y, w: 240, h: 54, px: 50, weight: '700', family: CHALK }); fitText(c, b, { x: 412, y, w: 130, h: 48, px: 44, weight: '700', family: CHALK });
    c.fillStyle = 'rgba(244,239,226,.55)'; for (let x = 300; x < 350; x += 10) c.fillRect(x, y + 6, 3, 3);
  });
  c.fillStyle = '#f7c6d4'; fitText(c, 'marshmallows free', { x: w / 2, y: h - 46, w: w - 110, h: 40, px: 36, weight: '400', family: CHALK });
  c.strokeStyle = 'rgba(220,238,255,.8)'; flake(c, 46, 50, 20); flake(c, w - 46, 50, 20);
});
const labelTex = text => canvasTex(128, 64, (c, w, h) => { c.fillStyle = '#efe6cf'; c.fillRect(0, 0, w, h); c.fillStyle = '#7a2a1c'; fitText(c, text, { x: w / 2, y: h / 2 + 2, w: w - 14, h: h - 14, px: 40, weight: '700', family: CHALK }); });
// The fire through the stove's mica window: embers, logs, flames licking up.
const fireTex = () => canvasTex(64, 48, (c, w, h) => {
  c.fillStyle = '#3a0c02'; c.fillRect(0, 0, w, h);
  const g = c.createRadialGradient(w / 2, h * 0.85, 2, w / 2, h * 0.7, w * 0.6); g.addColorStop(0, '#fff2b0'); g.addColorStop(0.35, '#ffa636'); g.addColorStop(0.75, '#c23a0a'); g.addColorStop(1, 'rgba(90,15,0,0)'); c.fillStyle = g; c.fillRect(0, 0, w, h);
  for (let i = 0; i < 7; i++) { const x = 6 + i * 8.5 + R() * 3, t = 10 + R() * 22; c.fillStyle = i % 2 ? 'rgba(255,200,90,.85)' : 'rgba(255,140,40,.8)'; c.beginPath(); c.moveTo(x - 5, h - 8); c.quadraticCurveTo(x - 3, h - 8 - t * 0.6, x + R() * 4 - 2, h - 8 - t); c.quadraticCurveTo(x + 3, h - 8 - t * 0.5, x + 5, h - 8); c.fill(); }
  c.fillStyle = '#2a1206'; c.beginPath(); c.ellipse(w * 0.35, h - 6, 16, 4, 0.1, 0, TAU); c.fill(); c.beginPath(); c.ellipse(w * 0.65, h - 5, 15, 4, -0.15, 0, TAU); c.fill();
  c.fillStyle = 'rgba(255,120,30,.9)'; for (let i = 0; i < 12; i++) c.fillRect(4 + R() * (w - 8), h - 4 - R() * 3, 2, 1.5);
});
const radialTex = () => canvasTex(64, 64, (c, w, h) => { const g = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.45, 'rgba(255,255,255,.4)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, w, h); });

// ---------------------------------------------------------------- the feature
feature({
  id: 'warminghut',
  secrets: [['hutcat', 'The hut cat']],
  init(k) {
    if (!k.plan.lakefront) return;
    this.k = k; this.t = 0;
    const g = this.g = new THREE.Group(); g.name = 'warminghut'; g.position.set(HX, 0, HZ); k.group.add(g);
    const inner = this.inner = new THREE.Group(); g.add(inner);       // the room inside: only drawn when the toy is near
    const M = this.M = {
      wall: warm(new THREE.MeshStandardMaterial({ map: battenTex(), roughness: 0.85 }), OUTSIDE),
      trim: warm(new THREE.MeshStandardMaterial({ color: 0xe9dfc4, roughness: 0.7 }), OUTSIDE),
      ext: warm(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.75 }), OUTSIDE),
      pine: warm(new THREE.MeshStandardMaterial({ map: pineTex(), roughness: 0.8 }), { ...INSIDE, lamp: 0.35 }),
      floor: warm(new THREE.MeshStandardMaterial({ map: floorTex(), roughness: 0.8 }), { ...INSIDE, lamp: 0.45 }),
      deck: warm(new THREE.MeshStandardMaterial({ map: floorTex(), color: 0xb8b0a6, roughness: 0.85 }), OUTSIDE),
      int: warm(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.75 }), INSIDE),
      intTrim: warm(new THREE.MeshStandardMaterial({ map: pineTex('#8a5630'), roughness: 0.75 }), INSIDE),
      iron: warm(new THREE.MeshStandardMaterial({ color: 0x232326, roughness: 0.45, metalness: 0.6 }), { ...INSIDE, base: 0.12 }),
      brick: warm(new THREE.MeshStandardMaterial({ map: brickTex(), roughness: 0.9 }), OUTSIDE),
      shield: warm(new THREE.MeshStandardMaterial({ map: brickTex(true), roughness: 0.9 }), INSIDE),
      slate: warm(new THREE.MeshStandardMaterial({ map: slateTex(), roughness: 0.6, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }), INSIDE),
      rug: warm(new THREE.MeshStandardMaterial({ map: rugTex(), roughness: 0.95, alphaTest: 0.5, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }), INSIDE),
      mat: warm(new THREE.MeshStandardMaterial({ map: matTex(), roughness: 0.95, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }), OUTSIDE),
      snow: new THREE.MeshStandardMaterial({ map: k.museum.snowTex, roughness: 0.95, emissiveMap: k.museum.snowTex, emissive: new THREE.Color(0.25, 0.3, 0.45), emissiveIntensity: 0.55 }),
      ice: new THREE.MeshStandardMaterial({ color: 0xcfe6ff, roughness: 0.15, metalness: 0.1, emissive: 0x6d8fb8, emissiveIntensity: 0.5 }),
      glassOut: new THREE.MeshBasicMaterial({ map: glassOut(), color: new THREE.Color(1.55, 1.25, 0.95) }),
      glassIn: new THREE.MeshBasicMaterial({ map: glassIn() }),
      sign: new THREE.MeshBasicMaterial({ map: signTex(), color: new THREE.Color(1.05, 1.05, 1.05) }),
      menu: warm(new THREE.MeshStandardMaterial({ map: menuTex(), roughness: 0.9 }), { ...INSIDE, base: 0.35 }),
      fire: new THREE.MeshBasicMaterial({ map: fireTex(), color: new THREE.Color(1.5, 1.2, 1.0) }),
      ember: new THREE.MeshBasicMaterial({ color: new THREE.Color(0.9, 0.3, 0.06) }),
      lamp: new THREE.MeshBasicMaterial({ color: new THREE.Color(2.0, 1.45, 0.75) }),
      bulb: new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 1.8, 1.0) }),
    };
    this.O = k.plan.obstacles; this.S = k.plan.surfaces;
    const out = new Bag(), ins = new Bag();
    this._shell(out, ins);
    this._roof(out, ins);
    this._porch(out);
    this._room(ins);
    out.done(g); ins.done(inner);
    this._cat(inner);
    this._glows(g, inner);
    this._lights(g);
    this._smoke(g);
    this.steam = k.puffs(50, { color: 0xe6edf5, size: 0.13 }); this.kettle = k.puffs(24, { color: 0xdde6f0, size: 0.07 });
    this.roar = k.loop({ lp: 420 }); this.crack = 0; this.warmT = 0; this.steamT = 0; this.lines = 0;
  },
  // A solid box in the hut's frame (local coordinates), and a top to land on.
  _ob(x0, x1, y0, y1, z0, z1, extra) { this.O.push({ x0: HX + x0, x1: HX + x1, z0: HZ + z0, z1: HZ + z1, y0, y1, ...extra }); },
  _land(x0, x1, z0, z1, top, base = FL) { this.S.push({ skin: 'wall', fixed: true, x0: HX + x0, x1: HX + x1, z0: HZ + z0, z1: HZ + z1, axis: null, h0: top, h1: top, base }); this._ob(x0, x1, base, top - 0.08, z0, z1); },
  // A triangle of gable in the hut's frame, as boxes in bands a quarter of a metre high (each band no wider than the
  // roof over it can hide), from y0 up to the ridge.
  _gable(z0, z1, y0, hw0 = W2) {
    for (let y = y0; y < under(0); y += 0.25) { const hw = Math.min(hw0, W2 - (y - EV) / P); if (hw > 0.02) this._ob(-hw, hw, y, Math.min(under(0), y + 0.25), z0, z1); }
  },

  // ============================================================ walls, windows, doorway
  _shell(out, ins) {
    const M = this.M, apex = under(0), ui = under(IX);
    const walls = {
      front: { n: [0, -1], c: [0, -D2], ni: [0, 1], ci: [0, -IZ], gable: true, door: true },
      back: { n: [0, 1], c: [0, D2], ni: [0, -1], ci: [0, IZ], gable: true },
      west: { n: [-1, 0], c: [-W2, 0], ni: [1, 0], ci: [-IX, 0] },
      east: { n: [1, 0], c: [W2, 0], ni: [-1, 0], ci: [IX, 0] },
    };
    for (const [name, w] of Object.entries(walls)) {
      const wins = WINDOWS.filter(q => q[0] === name).map(q => (w.gable ? [q[1], w.c[1]] : [w.c[0], q[1]]));
      const holes = (n, c) => wins.map(([x, z]) => { const u = uOf(n, c, x, z); return rect(u - WIN.w / 2, u + WIN.w / 2, WIN.y0, WIN.y1); });
      // outside
      const L = w.gable ? W2 : D2;
      let o = w.gable ? [[-L, 0], [L, 0], [L, EV], [0, apex], [-L, EV]] : rect(-L, L, 0, EV);
      if (w.door) o = [[-L, 0], [-DOOR, 0], [-DOOR, DH], [DOOR, DH], [DOOR, 0], [L, 0], [L, EV], [0, apex], [-L, EV]];
      out.put(M.wall, face(w.n, w.c, o, holes(w.n, w.c)));
      // inside
      const Li = w.gable ? IX : IZ, top = w.gable ? ui : ui;
      let oi = w.gable ? [[-Li, FL], [Li, FL], [Li, ui], [0, apex], [-Li, ui]] : rect(-Li, Li, FL, top);
      if (w.door) oi = [[-Li, FL], [-DOOR, FL], [-DOOR, DH], [DOOR, DH], [DOOR, FL], [Li, FL], [Li, ui], [0, apex], [-Li, ui]];
      ins.put(M.pine, face(w.ni, w.ci, oi, holes(w.ni, w.ci)));
      // trim outside: a skirt board along the foot, a frieze under the eaves (the long walls)
      wbox(out, M.trim, w.n, w.c, -L, w.door ? -DOOR - 0.1 : L, 0, 0.2, 0, 0.022);
      if (w.door) wbox(out, M.trim, w.n, w.c, DOOR + 0.1, L, 0, 0.2, 0, 0.022);
      if (!w.gable) wbox(out, M.trim, w.n, w.c, -L, L, EV - 0.2, EV, 0, 0.022);
      // and a skirting board inside
      wbox(ins, M.intTrim, w.ni, w.ci, -Li, w.door ? -DOOR - 0.08 : Li, FL, FL + 0.12, 0, 0.018);
      if (w.door) wbox(ins, M.intTrim, w.ni, w.ci, DOOR + 0.08, Li, FL, FL + 0.12, 0, 0.018);
      // the windows: a casing and a sill with snow on it outside, glass frosted and lit, the mullions, the reveals
      for (const [x, z] of wins) this._window(out, ins, w, x, z);
      // solid as drawn: the long walls to the eaves; the gables to the ridge, in bands; the doorway left open
      if (name === 'west') this._ob(-W2, -IX, 0, EV, -D2, D2);
      if (name === 'east') this._ob(IX, W2, 0, EV, -D2, D2);
      if (name === 'back') { this._ob(-W2, W2, 0, EV, IZ, D2); this._gable(IZ, D2, EV); }
      if (name === 'front') { this._ob(-W2, -DOOR, 0, EV, -D2, -IZ); this._ob(DOOR, W2, 0, EV, -D2, -IZ); this._ob(-DOOR, DOOR, DH, EV, -D2, -IZ); this._gable(-D2, -IZ, EV); }
    }
    // snow drifted up against the walls (not the porch): low ramps of snow, ground as drawn
    {
      const DW = 0.7, DH2 = 0.18, prof = new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(DW, 0), new THREE.Vector2(0, DH2)]);
      const drift = (M4, a0, a1, e) => {
        const g = new THREE.ExtrudeGeometry(prof, { depth: a1 - a0, bevelEnabled: false }), uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 0.25, uv.getY(i) * 0.25);
        g.applyMatrix4(M4); out.put(this.M.snow, g);
        this.S.push({ skin: 'snow', fixed: true, base: 0, ...e });
      };
      const z0 = -D2 + 0.05, z1 = D2 - 0.02, x0 = -W2 + 0.02, x1 = W2 - 0.02;
      drift(MX(W2, 0, z0), z0, z1, { axis: 'x', x0: HX + W2, x1: HX + W2 + DW, z0: HZ + z0, z1: HZ + z1, h0: DH2, h1: 0 });
      drift(MX(-W2, 0, z1, 0, Math.PI, 0), z0, z1, { axis: 'x', x0: HX - W2 - DW, x1: HX - W2, z0: HZ + z0, z1: HZ + z1, h0: 0, h1: DH2 });
      drift(MX(x1, 0, D2, 0, -Math.PI / 2, 0), x0, x1, { axis: 'z', x0: HX + x0, x1: HX + x1, z0: HZ + D2, z1: HZ + D2 + DW, h0: DH2, h1: 0 });
    }
    // corner boards
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(out, M.trim, sx > 0 ? W2 - 0.1 : -W2 - 0.025, sx > 0 ? W2 + 0.025 : -W2 + 0.1, 0, EV, sz > 0 ? D2 - 0.1 : -D2 - 0.025, sz > 0 ? D2 + 0.025 : -D2 + 0.1);
    // the doorway: its casing outside and in, its reveals, an oak threshold, and the doors standing open on the porch
    const fn = [0, -1], fc = [0, -D2];
    wbox(out, M.trim, fn, fc, -DOOR - 0.11, -DOOR, 0, DH, 0, 0.03); wbox(out, M.trim, fn, fc, DOOR, DOOR + 0.11, 0, DH, 0, 0.03);
    wbox(out, M.trim, fn, fc, -DOOR - 0.14, DOOR + 0.14, DH, DH + 0.14, 0, 0.04); wbox(out, M.trim, fn, fc, -DOOR - 0.17, DOOR + 0.17, DH + 0.14, DH + 0.17, 0, 0.07);
    for (const s of [-1, 1]) box(out, M.trim, s > 0 ? DOOR - 0.012 : -DOOR, s > 0 ? DOOR : -DOOR + 0.012, 0, DH, -D2, -IZ);
    box(out, M.trim, -DOOR, DOOR, DH - 0.012, DH, -D2, -IZ);
    const ni = [0, 1], ci = [0, -IZ];
    wbox(ins, M.intTrim, ni, ci, -DOOR - 0.09, -DOOR, FL, DH + 0.09, 0, 0.02); wbox(ins, M.intTrim, ni, ci, DOOR, DOOR + 0.09, FL, DH + 0.09, 0, 0.02); wbox(ins, M.intTrim, ni, ci, -DOOR - 0.09, DOOR + 0.09, DH, DH + 0.09, 0, 0.02);
    box(out, M.ext, -DOOR, DOOR, 0, FL, -D2, -IZ, 0x9a7448);
    this.S.push({ skin: 'wall', fixed: true, x0: HX - DOOR, x1: HX + DOOR, z0: HZ - D2, z1: HZ - IZ + 0.01, axis: null, h0: FL, h1: FL, base: 0 });
    for (const s of [-1, 1]) {
      // a ledged-and-braced door, green, swung right back: it stands out square from the wall
      const x0 = s * DOOR, x1 = s * (DOOR + 0.045), z0 = -D2 - 0.68, z1 = -D2 - 0.005, lo = Math.min(x0, x1), hi = Math.max(x0, x1);
      box(out, M.ext, lo, hi, FL + 0.01, DH - 0.02, z0, z1, 0x24503a);
      const fx = s > 0 ? lo - 0.012 : hi;               // its inside face, ledges and brace, turned to the doorway
      for (const y of [0.35, 1.05, 1.75]) box(out, M.ext, fx, fx + 0.012, y, y + 0.12, z0 + 0.05, z1 - 0.05, 0x2d5e45);
      { const g = boxG(0.012, 0.1, 0.86); g.applyMatrix4(MX(fx + 0.006, 0.82, (z0 + z1) / 2, 0.92)); out.put(M.ext, g, null, 0x2d5e45); g.dispose(); }
      { const g = boxG(0.012, 0.1, 0.86); g.applyMatrix4(MX(fx + 0.006, 1.52, (z0 + z1) / 2, 0.92)); out.put(M.ext, g, null, 0x2d5e45); }
      // strap hinges and a latch, on the outside face
      const ox = s > 0 ? hi : lo - 0.006;
      for (const y of [0.4, 1.7]) box(out, M.ext, ox, ox + 0.006, y, y + 0.04, z1 - 0.35, z1, 0x161616);
      box(out, M.ext, ox, ox + 0.02, 1.0, 1.05, z0 + 0.04, z0 + 0.1, 0x161616);
      this._ob(lo - 0.012, hi + 0.012, FL, DH, z0, z1);
    }
    // a wreath on the west door's face, out towards the porch
    this._wreath(out, -DOOR - 0.06, 1.55, -D2 - 0.34, Math.PI / 2 * -1, 0.17);
  },
  _window(out, ins, w, x, z) {
    const M = this.M, n = w.n, c = [x, z], ni = w.ni, ci = [x + w.ni[0] * T, z + w.ni[1] * T], hw = WIN.w / 2, ym = (WIN.y0 + WIN.y1) / 2;
    // casing outside
    wbox(out, M.trim, n, c, -hw - 0.09, -hw, WIN.y0, WIN.y1, 0, 0.025); wbox(out, M.trim, n, c, hw, hw + 0.09, WIN.y0, WIN.y1, 0, 0.025);
    wbox(out, M.trim, n, c, -hw - 0.11, hw + 0.11, WIN.y1, WIN.y1 + 0.11, 0, 0.035); wbox(out, M.trim, n, c, -hw - 0.14, hw + 0.14, WIN.y1 + 0.11, WIN.y1 + 0.14, 0, 0.06);
    wbox(out, M.trim, n, c, -hw - 0.12, hw + 0.12, WIN.y0 - 0.05, WIN.y0, -0.02, 0.07);
    wbox(out, M.snow, n, c, -hw - 0.1, hw + 0.1, WIN.y0, WIN.y0 + 0.035, 0.0, 0.065);
    wbox(out, M.trim, n, c, -hw - 0.05, hw + 0.05, WIN.y0 - 0.14, WIN.y0 - 0.05, 0, 0.02);          // the apron under the sill
    // reveals
    wbox(out, M.trim, n, c, -hw, -hw + 0.012, WIN.y0, WIN.y1, -T, 0); wbox(out, M.trim, n, c, hw - 0.012, hw, WIN.y0, WIN.y1, -T, 0);
    wbox(out, M.trim, n, c, -hw, hw, WIN.y1 - 0.012, WIN.y1, -T, 0); wbox(out, M.trim, n, c, -hw, hw, WIN.y0, WIN.y0 + 0.012, -T, 0);
    // glass: frosted and warm outside, the night inside, back to back in the middle of the wall
    { const gl = new THREE.PlaneGeometry(WIN.w - 0.02, WIN.y1 - WIN.y0 - 0.02); gl.translate(0, ym, 0); const o = gl.clone(); o.applyMatrix4(frame(n, c, -0.05)); out.put(M.glassOut, o); const i = gl.clone(); i.applyMatrix4(frame(ni, ci, -0.05)); out.put(M.glassIn, i); }
    // mullions: four panes
    wbox(out, M.trim, n, c, -0.018, 0.018, WIN.y0, WIN.y1, -0.085, -0.025); wbox(out, M.trim, n, c, -hw, hw, ym - 0.018, ym + 0.018, -0.085, -0.025);
    // casing inside, and a stool under it
    wbox(ins, M.intTrim, ni, ci, -hw - 0.07, -hw, WIN.y0, WIN.y1 + 0.07, 0, 0.02); wbox(ins, M.intTrim, ni, ci, hw, hw + 0.07, WIN.y0, WIN.y1 + 0.07, 0, 0.02);
    wbox(ins, M.intTrim, ni, ci, -hw - 0.07, hw + 0.07, WIN.y1, WIN.y1 + 0.07, 0, 0.02); wbox(ins, M.intTrim, ni, ci, -hw - 0.09, hw + 0.09, WIN.y0 - 0.035, WIN.y0, 0, 0.06);
  },
  _wreath(bag, x, y, z, ry, r = 0.2) {
    const m = MX(x, y, z, 0, ry, 0), add = (geo, col, M2) => bag.put(this.M.ext, geo, M2 ? new THREE.Matrix4().multiplyMatrices(m, M2) : m, col);
    add(new THREE.TorusGeometry(r, r * 0.33, 6, 18), 0x1f4a2a);
    for (let i = 0; i < 18; i++) { const a = i / 18 * TAU; add(new THREE.IcosahedronGeometry(r * 0.17, 0), i % 2 ? 0x2a5a32 : 0x173d22, MX(Math.cos(a) * r, Math.sin(a) * r, r * 0.12)); }
    for (let i = 0; i < 7; i++) { const a = 0.4 + i * 0.75; add(new THREE.SphereGeometry(r * 0.07, 6, 4), 0xc0192a, MX(Math.cos(a) * r * 1.05, Math.sin(a) * r * 1.05, r * 0.3)); }
    add(boxG(r * 0.5, r * 0.28, r * 0.12), 0xb3141f, MX(0, -r, r * 0.3)); for (const s of [-1, 1]) add(boxG(r * 0.12, r * 0.6, r * 0.05), 0xb3141f, MX(s * r * 0.12, -r * 1.3, r * 0.3, 0, 0, s * 0.3));
  },

  // ============================================================ the roof
  // Two slopes from the ridge, boards under snow, overhanging the walls and the porch: pine underneath (the room has
  // no ceiling but the roof, its rafters showing), cream fascia and barge boards, a lip of snow and icicles at the
  // eaves, and a brick chimney on the ridge over the stove. Each slope is a slab to land on and a ceiling under it.
  _roof(out, ins) {
    const M = this.M;
    for (const s of [-1, 1]) {
      const x0 = s < 0 ? -EX : 0, x1 = s < 0 ? 0 : EX, slope = -s * P, y0 = under(x0);
      // the underside, pine; the boards, edged cream; snow on top, running over the edges a little
      sheared(ins, M.pine, x0, x1, y0, 0.012, RZ0, RZ1, slope);
      sheared(out, M.trim, x0, x1, y0 + 0.012, 0.15, RZ0, RZ1, slope);
      const sx0 = s < 0 ? -EX - 0.03 : 0, sx1 = s < 0 ? 0 : EX + 0.03;
      sheared(out, M.snow, sx0, sx1, under(sx0) + 0.16, RT - 0.16, RZ0 - 0.03, RZ1 + 0.03, slope, null, 0.25);
      // fascia at the eaves, barge boards down the gables
      box(out, M.trim, s * EX - (s > 0 ? 0 : 0.04), s * EX + (s > 0 ? 0.04 : 0), under(EX) - 0.05, under(EX) + 0.16, RZ0 - 0.04, RZ1 + 0.04);
      for (const z of [RZ0 - 0.04, RZ1]) sheared(out, M.trim, x0, x1, y0 - 0.07, 0.23, z, z + 0.04, slope);
      // the snow's rounded lip along the eaves
      { const g = new THREE.CylinderGeometry(0.075, 0.075, RZ1 - RZ0 + 0.06, 10); g.rotateX(Math.PI / 2); g.scale(1, 0.8, 1); g.translate(s * (EX + 0.02), roofTop(EX) - 0.05, (RZ0 + RZ1) / 2); out.put(M.snow, g); }
      // the rafters, showing inside and under the porch, their tails out under the eaves
      for (const z of [-2.4, -1.8, -1.2, -0.6, 0, 0.6, 1.2, 1.8, 2.4, -3.25, -3.85]) sheared(ins, M.intTrim, x0, x1, y0 - 0.1, 0.105, z - 0.03, z + 0.03, slope);
      this.S.push({ skin: 'snow', fixed: true, slab: true, x0: HX + sx0, x1: HX + sx1, z0: HZ + RZ0 - 0.03, z1: HZ + RZ1 + 0.03, axis: 'x', h0: roofTop(sx0), h1: roofTop(sx1), thick: RT });
      if (this.k.plan.slabs) this.k.plan.slabs.push(this.S[this.S.length - 1]);
    }
    { const g = new THREE.CylinderGeometry(0.07, 0.07, RZ1 - RZ0 + 0.06, 10); g.rotateX(Math.PI / 2); g.translate(0, roofTop(0) - 0.035, (RZ0 + RZ1) / 2); out.put(M.snow, g); }
    // icicles hanging from the fascia, long and short
    {
      const n = 46, im = new THREE.InstancedMesh(new THREE.ConeGeometry(0.018, 1, 5), M.ice, n), Mx = new THREE.Matrix4(); let i = 0;
      for (const s of [-1, 1]) for (let z = RZ0 + 0.2; z < RZ1 - 0.1 && i < n; z += 0.25 + R() * 0.2) { const L = 0.06 + R() ** 2 * 0.32; im.setMatrixAt(i++, Mx.compose(_v.set(s * (EX - 0.01), under(EX) - 0.05 - L / 2, z), _q.setFromEuler(_e.set(Math.PI, 0, 0)), _s.set(1 + L * 2, L, 1 + L * 2))); }
      im.count = i; this.g.add(im);
    }
    // the chimney: brick, a stone cap with snow on it, a clay pot
    const cz = PIPE.z, cb = under(0) + 0.02, ct = roofTop(0) + 0.75;
    box(out, M.brick, -0.27, 0.27, cb, ct, cz - 0.27, cz + 0.27);
    box(out, M.trim, -0.33, 0.33, ct, ct + 0.07, cz - 0.33, cz + 0.33);
    box(out, M.snow, -0.31, 0.31, ct + 0.07, ct + 0.1, cz - 0.31, cz + 0.31, null, 0.25);
    { const g = new THREE.CylinderGeometry(0.08, 0.1, 0.24, 10, 1, true); g.translate(0, ct + 0.19, cz); out.put(M.ext, g, null, 0x8a4a2e); }
    this.pot = { x: 0, y: ct + 0.32, z: cz };
    this._ob(-0.33, 0.33, cb, ct + 0.31, cz - 0.33, cz + 0.33);
  },

  // ============================================================ the porch
  _porch(out) {
    const M = this.M;
    // the deck: boards, a step's height, from the wall to beyond the posts
    const z0 = PZ - 0.15, z1 = -D2;
    { const sh = new THREE.Shape([[-W2, -z1], [W2, -z1], [W2, -z0], [-W2, -z0]].map(([a, b]) => new THREE.Vector2(a, b))); const g = new THREE.ShapeGeometry(sh); g.rotateX(-Math.PI / 2); g.translate(0, FL, 0); const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getY(i), uv.getX(i)); out.put(this.M.deck, g); }
    box(out, M.ext, -W2 - 0.01, W2 + 0.01, 0, FL - 0.002, z0 - 0.01, z0 + 0.03, 0x5a4029); for (const s of [-1, 1]) box(out, M.ext, s * W2 - 0.01, s * W2 + 0.01, 0, FL - 0.002, z0, z1, 0x5a4029);
    this.S.push({ skin: 'wall', fixed: true, x0: HX - W2, x1: HX + W2, z0: HZ + z0, z1: HZ + z1, axis: null, h0: FL, h1: FL, base: 0 });
    // posts and a beam across, with brackets, and a gable over it, red like the walls, with the sign and a wreath
    for (const s of [-1, 1]) {
      const x = s * (W2 - 0.15);
      box(out, M.trim, x - 0.07, x + 0.07, FL, 2.25, PZ - 0.07, PZ + 0.07); box(out, M.trim, x - 0.09, x + 0.09, FL, FL + 0.18, PZ - 0.09, PZ + 0.09);
      { const g = boxG(0.05, 0.5, 0.06); g.applyMatrix4(MX(x - s * 0.17, 2.07, PZ, 0, 0, s * 0.78)); out.put(M.trim, g); }
      this._ob(x - 0.09, x + 0.09, 0, 2.25, PZ - 0.09, PZ + 0.09);
    }
    box(out, M.trim, -W2 - 0.02, W2 + 0.02, 2.25, 2.42, PZ - 0.07, PZ + 0.07); this._ob(-W2 - 0.02, W2 + 0.02, 2.25, 2.42, PZ - 0.07, PZ + 0.07);
    const ped = [[-W2, 2.42], [W2, 2.42], [W2, EV], [0, under(0)], [-W2, EV]];
    out.put(M.wall, face([0, -1], [0, PZ - 0.03], ped)); out.put(M.wall, face([0, 1], [0, PZ + 0.03], ped));
    this._gable(PZ - 0.03, PZ + 0.03, 2.42);
    // the sign, on a board of its own, its top well under the roof; and the wreath over it
    {
      const sw = 2.1, sh = 0.52, sy = 2.88, edge = M.trim, front = M.sign, g = new THREE.BoxGeometry(sw, sh, 0.04);
      const m = new THREE.Mesh(g, [edge, edge, edge, edge, edge, front]); m.position.set(0, sy, PZ - 0.03 - 0.02); this.g.add(m);
      this.signTop = sy + sh / 2;
    }
    this._wreath(out, 0, 3.5, PZ - 0.1, Math.PI, 0.2);
    // the lantern by the door: an iron arm, a lantern with warm glass
    {
      const { x, y } = LAMP, z = -D2;
      box(out, M.ext, x - 0.05, x + 0.05, y + 0.02, y + 0.2, z - 0.02, z, 0x141414); box(out, M.ext, x - 0.012, x + 0.012, y + 0.12, y + 0.15, z - 0.17, z, 0x141414);
      box(out, M.lamp, x - 0.055, x + 0.055, y - 0.11, y + 0.07, z - 0.185, z - 0.075);
      for (const [a, b] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) box(out, M.ext, x + a * 0.06 - 0.008, x + a * 0.06 + 0.008, y - 0.12, y + 0.08, z - 0.13 + b * 0.055 - 0.008, z - 0.13 + b * 0.055 + 0.008, 0x141414);
      { const g = new THREE.ConeGeometry(0.1, 0.08, 4); g.rotateY(Math.PI / 4); g.translate(x, y + 0.12, z - 0.13); out.put(M.ext, g, null, 0x141414); }
      box(out, M.ext, x - 0.07, x + 0.07, y - 0.14, y - 0.11, z - 0.2, z - 0.06, 0x141414);
      this._ob(x - 0.08, x + 0.08, y - 0.15, y + 0.2, z - 0.21, z);
    }
    // the doormat
    { const g = new THREE.PlaneGeometry(1.0, 0.55); g.rotateX(-Math.PI / 2); g.translate(0, FL + 0.004, -D2 - 0.45); out.put(M.mat, g); }
    // firewood stacked under the west window, and a bench under the east one
    this._logs(out, M.ext, -2.4, -1.08, -D2 - 0.44, -D2 - 0.02, 4);
    this._land(-2.42, -1.06, -D2 - 0.44, -D2 - 0.02, FL + 0.5);
    this._bench(out, M.ext, 1.12, 2.32, -D2 - 0.42, -D2 - 0.02, 0x6b4a2e, 0x6b4a2e, 'x');
  },
  // Logs stacked in a pile, their ends to the front (-z): rows of them, each row sitting in the dips of the one below.
  _logs(bag, mat, x0, x1, z0, z1, rows) {
    const r = 0.068, L = z1 - z0 - 0.02, side = new THREE.CylinderGeometry(1, 1, 1, 8, 1, true), end = new THREE.CircleGeometry(1, 8);
    for (let j = 0; j < rows; j++) {
      const y = FL + r + j * r * 1.72, off = j % 2 ? r : 0;
      for (let x = x0 + r + off; x <= x1 - r + 1e-6; x += r * 2) {
        const rr = r * (0.82 + R() * 0.2), zc = (z0 + z1) / 2 + (R() - 0.5) * 0.04;
        bag.put(mat, side, MX(x, y, zc, Math.PI / 2, 0, 0, rr, L, rr), R() < 0.5 ? 0x4b3524 : 0x5a3e28);
        bag.put(mat, end, MX(x, y, zc - L / 2, 0, Math.PI, 0, rr, rr, 1), R() < 0.5 ? 0xc89a66 : 0xb3864f);
        bag.put(mat, end, MX(x, y, zc + L / 2, 0, 0, 0, rr, rr, 1), 0xb3864f);
      }
    }
  },
  // A plank bench on four legs (and one in the middle if it is long), x0..x1 by z0..z1, a cushion on it if asked.
  // Solid as drawn: the legs, the seat (the toy goes under it), its top to land on.
  _bench(bag, mat, x0, x1, z0, z1, wood, legCol, alongAxis, cushion = null) {
    const top = FL + 0.44, th = 0.05, ct = cushion ? 0.045 : 0, st = top - ct;
    box(bag, mat, x0, x1, st - th, st, z0, z1, wood);
    if (cushion) box(bag, mat, x0 + 0.02, x1 - 0.02, st, top, z0 + 0.02, z1 - 0.02, cushion);
    const legs = [], len = alongAxis === 'x' ? x1 - x0 : z1 - z0, n = len > 1.6 ? 3 : 2;
    for (let i = 0; i < n; i++) { const t = (i / (n - 1)) * (len - 0.16) + 0.08; for (const e of [0.06, (alongAxis === 'x' ? z1 - z0 : x1 - x0) - 0.06]) legs.push(alongAxis === 'x' ? [x0 + t, z0 + e] : [x0 + e, z0 + t]); }
    for (const [x, z] of legs) { box(bag, mat, x - 0.025, x + 0.025, FL, st - th, z - 0.025, z + 0.025, legCol); this._ob(x - 0.03, x + 0.03, 0, st - th, z - 0.03, z + 0.03); }
    if (alongAxis === 'x') box(bag, mat, x0 + 0.08, x1 - 0.08, FL + 0.12, FL + 0.16, (z0 + z1) / 2 - 0.015, (z0 + z1) / 2 + 0.015, legCol);
    else box(bag, mat, (x0 + x1) / 2 - 0.015, (x0 + x1) / 2 + 0.015, FL + 0.12, FL + 0.16, z0 + 0.08, z1 - 0.08, legCol);
    this._ob(x0, x1, st - th - 0.005, top - 0.012, z0, z1, { bench: true });
    this.S.push({ skin: 'wall', fixed: true, x0: HX + x0, x1: HX + x1, z0: HZ + z0, z1: HZ + z1, axis: null, h0: top, h1: top, thick: th + ct + 0.005, base: FL });
  },

  // ============================================================ the room
  _room(ins) {
    const M = this.M, I = M.int;
    // the floor
    { const sh = new THREE.Shape([[-IX, -IZ], [IX, -IZ], [IX, IZ], [-IX, IZ]].map(([a, b]) => new THREE.Vector2(a, -b))); const g = new THREE.ShapeGeometry(sh); g.rotateX(-Math.PI / 2); g.translate(0, FL, 0); ins.put(M.floor, g); }
    this.S.push({ skin: 'wall', fixed: true, x0: HX - IX, x1: HX + IX, z0: HZ - IZ, z1: HZ + IZ, axis: null, h0: FL, h1: FL, base: 0 });
    // the rug, the hearth, the bricks behind the stove
    { const g = new THREE.PlaneGeometry(2.1, 1.25); g.rotateX(-Math.PI / 2); g.translate(0, FL + 0.004, 0.66); ins.put(M.rug, g); }
    { const g = new THREE.PlaneGeometry(1.3, IZ - 1.36); const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 2, uv.getY(i) * 2); g.rotateX(-Math.PI / 2); g.translate(0, FL + 0.006, (1.36 + IZ) / 2); ins.put(M.slate, g); }
    { const g = new THREE.PlaneGeometry(1.4, 1.75); const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 1.4, uv.getY(i) * 1.75); g.rotateY(Math.PI); g.translate(0, FL + 0.875, IZ - 0.012); ins.put(M.shield, g); }
    this._stove(ins);
    // the woodpile by the stove
    this._logs(ins, I, 0.68, 1.52, IZ - 0.44, IZ - 0.02, 4);
    this._land(0.66, 1.54, IZ - 0.44, IZ - 0.02, FL + 0.5);
    // benches round the west end, red cushions on them; boots under one
    this._bench(ins, I, -IX, -0.95, -IZ, -IZ + 0.42, 0x6e4628, 0x4e321d, 'x', 0x9a2a26);
    this._bench(ins, I, -IX, -IX + 0.42, -IZ + 0.42, 1.0, 0x6e4628, 0x4e321d, 'z', 0x9a2a26);
    for (const [bz, col] of [[-1.42, 0x2a2420], [-1.04, 0x5a3420]]) for (const d of [-0.06, 0.06]) { box(ins, I, -IX + 0.06, -IX + 0.3, FL, FL + 0.07, bz + d - 0.045, bz + d + 0.045, col); box(ins, I, -IX + 0.06, -IX + 0.16, FL + 0.07, FL + 0.26, bz + d - 0.045, bz + d + 0.045, col); box(ins, I, -IX + 0.05, -IX + 0.17, FL + 0.24, FL + 0.28, bz + d - 0.05, bz + d + 0.05, 0xcfc6b5); }
    for (const bz of [-1.42, -1.04]) this._ob(-IX, -IX + 0.31, 0, FL + 0.28, bz - 0.12, bz + 0.12);
    // skates on pegs over the bench by the door (the west wall), white figure skates and black hockey skates
    box(ins, M.intTrim, -IX, -IX + 0.03, 1.56, 1.66, -2.35, -1.05);
    for (const [i, zc] of [-2.15, -1.75, -1.32].entries()) {
      const col = i === 1 ? 0x1c1c1e : 0xf1ece2;
      box(ins, I, -IX, -IX + 0.1, 1.6, 1.62, zc - 0.01, zc + 0.01, 0x2a1d12);
      for (const d of [-0.06, 0.06]) {
        const z = zc + d, x = -IX + 0.08;
        rod(ins, I, [x, 1.61, zc], [x, 1.38, z], 0.004, 0xe8e2d0);
        box(ins, I, x - 0.035, x + 0.035, 1.12, 1.38, z - 0.03, z + 0.03, col);                 // the boot, hung by its laces, toe down
        box(ins, I, x - 0.035, x + 0.035, 1.05, 1.16, z - 0.03, z + 0.09, col);
        box(ins, I, x - 0.003, x + 0.003, 1.0, 1.36, z + (i === 1 ? 0.05 : 0.07), z + (i === 1 ? 0.07 : 0.09), 0xc9ced6);      // the blade
      }
    }
    this._ob(-IX, -IX + 0.15, 0.98, 1.67, -2.4, -1.0);
    // a line strung from the west wall to the back, with mittens and a scarf drying on it, near the stove
    { const A = [-IX, 1.88, 0.55], B = [-0.62, 1.88, IZ], pts = [];
      for (let i = 0; i <= 6; i++) { const t = i / 6; pts.push([A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t - Math.sin(t * Math.PI) * 0.12, A[2] + (B[2] - A[2]) * t]); }
      for (let i = 0; i < 6; i++) rod(ins, I, pts[i], pts[i + 1], 0.004, 0xd8d2c0);
      const ry = Math.atan2(B[0] - A[0], B[2] - A[2]) + Math.PI / 2, at = t => { const i = Math.min(5, Math.floor(t * 6)), f = t * 6 - i, a = pts[i], b = pts[i + 1]; return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f]; };
      const mitten = (t, col, flip) => { const [x, y, z] = at(t), m = MX(x, y, z, 0, ry, 0); ins.put(I, boxG(0.13, 0.2, 0.04), new THREE.Matrix4().multiplyMatrices(m, MX(0, -0.14, 0)), col); ins.put(I, boxG(0.045, 0.09, 0.036), new THREE.Matrix4().multiplyMatrices(m, MX(flip * 0.08, -0.16, 0, 0, 0, flip * 0.35)), col); ins.put(I, boxG(0.13, 0.045, 0.044), new THREE.Matrix4().multiplyMatrices(m, MX(0, -0.04, 0)), 0xf2ede2); ins.put(I, boxG(0.012, 0.04, 0.045), new THREE.Matrix4().multiplyMatrices(m, MX(0, 0.005, 0)), 0xb08a5a); };
      mitten(0.08, 0xc0262c, 1); mitten(0.17, 0xc0262c, -1); mitten(0.64, 0x2a5aa8, 1); mitten(0.74, 0x2a5aa8, -1); mitten(0.88, 0x2f7a3a, 1);
      { const [x, y, z] = at(0.42), m = MX(x, y, z, 0, ry, 0), stripes = [0x2f7a3a, 0xf2ede2, 0xc0262c, 0xf2ede2];      // the scarf, over the line, a stripe at a time
        for (let i = 0; i < 9; i++) for (const s of [-1, 1]) ins.put(I, boxG(0.14, 0.06, 0.015), new THREE.Matrix4().multiplyMatrices(m, MX(0, -0.03 - i * 0.06 - (s > 0 ? 0.08 : 0), s * 0.012)), stripes[i % 4]);
        ins.put(I, boxG(0.14, 0.02, 0.04), new THREE.Matrix4().multiplyMatrices(m, MX(0, 0.005, 0)), 0x2f7a3a); } }
    // a coat tree in the corner by the door, a coat, a hat and a scarf on it
    { const x = 2.12, z = -2.3;
      box(ins, I, x - 0.022, x + 0.022, FL, FL + 1.82, z - 0.022, z + 0.022, 0x3a2414);
      for (let i = 0; i < 3; i++) { const a = i / 3 * TAU + 0.5, g = boxG(0.4, 0.035, 0.05); g.translate(0.18, 0, 0); g.applyMatrix4(MX(x, FL + 0.03, z, 0, a, 0)); ins.put(I, g, null, 0x3a2414); }
      for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + 0.3; rod(ins, I, [x, FL + 1.68, z], [x + Math.cos(a) * 0.16, FL + 1.76, z + Math.sin(a) * 0.16], 0.012, 0x3a2414); }
      { const g = new THREE.LatheGeometry([[0.001, 0], [0.2, 0.02], [0.21, 0.3], [0.17, 0.75], [0.11, 0.98], [0.04, 1.0], [0.001, 1.0]].map(([a, b]) => new THREE.Vector2(a, b)), 10); g.scale(1, 1, 0.7); g.translate(x - 0.1, FL + 0.66, z + 0.05); ins.put(I, g, null, 0x6e2a24); }
      { const g = new THREE.SphereGeometry(0.1, 10, 6, 0, TAU, 0, Math.PI / 2); g.translate(x + 0.02, FL + 1.8, z); ins.put(I, g, null, 0x2f6aa0); const p = new THREE.SphereGeometry(0.04, 6, 4); p.translate(x + 0.02, FL + 1.91, z); ins.put(I, p, null, 0xf2ede2); }
      { const g = new THREE.TorusGeometry(0.09, 0.03, 5, 12); g.rotateX(Math.PI / 2); g.translate(x, FL + 1.5, z); ins.put(I, g, null, 0xd8b23a); for (let i = 0; i < 5; i++) box(ins, I, x + 0.06, x + 0.11, FL + 1.06 + i * 0.08, FL + 1.13 + i * 0.08, z - 0.06, z - 0.02, i % 2 ? 0xd8b23a : 0x8e2b2b); }
      this._ob(x - 0.3, x + 0.2, 0, FL + 1.95, z - 0.2, z + 0.22); }
    // the counter along the east wall, painted green, a butcher-block top; the cocoa urn, mugs, marshmallows, cider
    { const x0 = 1.9, z0 = -1.5, z1 = 1.1, top = FL + 0.92;
      box(ins, I, x0, IX, FL, FL + 0.1, z0 + 0.02, z1 - 0.02, 0x1d3a28);
      box(ins, I, x0 + 0.03, IX, FL + 0.1, top - 0.04, z0 + 0.02, z1 - 0.02, 0x2f5a3f);
      for (let z = z0 + 0.1; z < z1 - 0.05; z += 0.1) box(ins, I, x0 + 0.02, x0 + 0.03, FL + 0.12, top - 0.06, z, z + 0.012, 0x24492f);
      box(ins, I, x0 - 0.04, IX, top - 0.04, top, z0 - 0.02, z1 + 0.02, 0x9a6a3a);
      this._land(x0 - 0.04, IX, z0 - 0.02, z1 + 0.02, top, FL);
      // the urn
      { const ux = 2.2, uz = -1.0, pr = [[0.001, 0], [0.13, 0], [0.145, 0.02], [0.135, 0.05], [0.135, 0.42], [0.115, 0.46], [0.05, 0.48], [0.03, 0.51], [0.04, 0.53], [0.001, 0.54]];
        const g = new THREE.LatheGeometry(pr.map(([a, b]) => new THREE.Vector2(a, b)), 16); g.translate(ux, top, uz); ins.put(M.iron, g);
        box(ins, M.iron, ux - 0.2, ux - 0.11, top + 0.07, top + 0.1, uz - 0.015, uz + 0.015); box(ins, M.iron, ux - 0.21, ux - 0.18, top + 0.03, top + 0.1, uz - 0.02, uz + 0.02);
        box(ins, I, ux - 0.24, ux - 0.08, top, top + 0.012, uz - 0.08, uz + 0.08, 0x2a2a2e);
        for (const s of [-1, 1]) { const h = new THREE.TorusGeometry(0.04, 0.008, 4, 8, Math.PI); h.rotateZ(Math.PI / 2); h.rotateY(Math.PI / 2); h.translate(ux, top + 0.38, uz + s * 0.135); ins.put(M.iron, h); }
        const lab = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.08), warm(new THREE.MeshStandardMaterial({ map: labelTex('COCOA'), roughness: 0.9 }), { ...INSIDE, base: 0.3 })); lab.position.set(ux - 0.138, top + 0.26, uz); lab.rotation.y = -Math.PI / 2; this.inner.add(lab);
        this._ob(ux - 0.24, ux + 0.15, top, top + 0.54, uz - 0.15, uz + 0.15); }
      // mugs on a tray, two rows, and a stack
      { const mug = new THREE.CylinderGeometry(0.042, 0.038, 0.1, 10), hd = new THREE.TorusGeometry(0.028, 0.008, 4, 8), cols = [0xc0262c, 0xf0e9da, 0x2f7a3a, 0x2a5aa8];
        box(ins, I, 2.0, 2.4, top, top + 0.015, -0.05, 0.55, 0x5a3a22);
        let i = 0; for (const mx of [2.1, 2.28]) for (const mz of [0.03, 0.17, 0.31, 0.45]) { const c = cols[i++ % 4]; ins.put(I, mug, MX(mx, top + 0.065, mz), c); ins.put(I, hd, MX(mx - 0.045, top + 0.07, mz, 0, Math.PI / 2, 0), c); }
        for (let j = 0; j < 3; j++) ins.put(I, mug, MX(2.25, top + 0.06 + j * 0.085, 0.78), cols[(j + 1) % 4]);
        this._ob(2.0, 2.4, top, top + 0.12, -0.05, 0.55); this._ob(2.19, 2.31, top, top + 0.32, 0.72, 0.84); }
      // marshmallows heaped in a bowl
      { const bowl = new THREE.LatheGeometry([[0.001, 0], [0.06, 0], [0.1, 0.05], [0.11, 0.07], [0.105, 0.072], [0.001, 0.02]].map(([a, b]) => new THREE.Vector2(a, b)), 14); bowl.translate(2.15, top, -0.42); ins.put(I, bowl, null, 0xf0e9da);
        const mm = new THREE.CylinderGeometry(0.022, 0.022, 0.03, 8); for (let i = 0; i < 14; i++) { const a = i * 2.4, r = i < 6 ? 0.05 : 0.025, y = i < 6 ? 0.06 : i < 12 ? 0.085 : 0.105; ins.put(I, mm, MX(2.15 + Math.cos(a) * r, top + y, -0.42 + Math.sin(a) * r, R() * 3, R() * 3, 0), 0xfbf6ee); }
        this._ob(2.04, 2.26, top, top + 0.12, -0.53, -0.31); }
      // a jug of cider, labelled
      { const jug = new THREE.LatheGeometry([[0.001, 0], [0.08, 0], [0.095, 0.08], [0.09, 0.16], [0.05, 0.22], [0.03, 0.25], [0.035, 0.27], [0.001, 0.27]].map(([a, b]) => new THREE.Vector2(a, b)), 12); jug.translate(2.25, top, 0.98); ins.put(I, jug, null, 0x8a4a14);
        const lab = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.06), warm(new THREE.MeshStandardMaterial({ map: labelTex('CIDER'), roughness: 0.9 }), { ...INSIDE, base: 0.3 })); lab.position.set(2.25 - 0.096, top + 0.11, 0.98); lab.rotation.y = -Math.PI / 2; this.inner.add(lab);
        this._ob(2.15, 2.35, top, top + 0.27, 0.88, 1.08); } }
    // the menu over the counter: chalk, in a frame
    { const zc = 0.45, yc = 1.72, w = 1.0, h = 0.72;
      const g = new THREE.PlaneGeometry(w, h); g.rotateY(-Math.PI / 2); g.translate(IX - 0.022, yc, zc); const m = new THREE.Mesh(g, M.menu); this.inner.add(m);
      for (const [a0, a1, b0, b1] of [[-w / 2 - 0.05, w / 2 + 0.05, h / 2, h / 2 + 0.05], [-w / 2 - 0.05, w / 2 + 0.05, -h / 2 - 0.05, -h / 2], [-w / 2 - 0.05, -w / 2, -h / 2, h / 2], [w / 2, w / 2 + 0.05, -h / 2, h / 2]]) box(ins, M.intTrim, IX - 0.03, IX, yc + b0, yc + b1, zc + a0, zc + a1); }
    // an enamel lamp hung over the counter on its cord
    { const { x, y, z } = PEND, cy = under(x);
      rod(ins, M.iron, [x, cy, z], [x, y + 0.12, z], 0.006, null);
      const sh = new THREE.LatheGeometry([[0.02, 0.12], [0.05, 0.1], [0.17, 0.0], [0.175, -0.01], [0.16, -0.005], [0.045, 0.09], [0.015, 0.11]].map(([a, b]) => new THREE.Vector2(a, b)), 16); sh.translate(x, y, z); ins.put(I, sh, null, 0x24503a);
      const b = new THREE.SphereGeometry(0.05, 10, 8); b.translate(x, y + 0.02, z); ins.put(M.bulb, b);
      this._ob(x - 0.18, x + 0.18, y - 0.02, y + 0.12, z - 0.18, z + 0.18); this._ob(x - 0.02, x + 0.02, y + 0.12, cy, z - 0.02, z + 0.02); }
    // a clock on the back wall, and warm fairy lights round the tops of the walls (in _lights)
    { const g = new THREE.CylinderGeometry(0.16, 0.16, 0.03, 18); g.rotateX(Math.PI / 2); g.translate(-1.55, 2.25, IZ - 0.015); ins.put(I, g, null, 0xf2ead6); const r = new THREE.TorusGeometry(0.16, 0.015, 4, 18); r.translate(-1.55, 2.25, IZ - 0.03); ins.put(I, r, null, 0x3a2414);
      box(ins, I, -1.555, -1.545, 2.25, 2.36, IZ - 0.035, IZ - 0.032, 0x111111); box(ins, I, -1.55, -1.47, 2.245, 2.255, IZ - 0.036, IZ - 0.033, 0x111111); }
  },
  // A pot-bellied stove on four legs, nickel trim, a fire behind its door, a kettle on top, the pipe up to the roof.
  _stove(ins) {
    const M = this.M, x = STOVE.x, z = STOVE.z, y = FL;
    const pr = [[0.001, 0.2], [0.24, 0.2], [0.25, 0.24], [0.22, 0.27], [0.24, 0.3], [0.31, 0.4], [0.34, 0.52], [0.345, 0.6], [0.33, 0.7], [0.29, 0.78], [0.24, 0.82], [0.23, 0.85], [0.27, 0.87], [0.28, 0.91], [0.26, 0.93], [0.001, 0.93]];
    { const g = new THREE.LatheGeometry(pr.map(([a, b]) => new THREE.Vector2(a, b)), 20); g.translate(x, y, z); ins.put(M.iron, g); }
    for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + Math.PI / 4, g = boxG(0.05, 0.24, 0.05); g.applyMatrix4(MX(x + Math.cos(a) * 0.21, y + 0.1, z + Math.sin(a) * 0.21, Math.sin(a) * 0.25, 0, -Math.cos(a) * 0.25)); ins.put(M.iron, g); }
    for (const [yy, r] of [[0.6, 0.347], [0.87, 0.272]]) { const g = new THREE.TorusGeometry(r, 0.012, 4, 24); g.rotateX(Math.PI / 2); g.translate(x, y + yy, z); ins.put(this.M.int, g, null, 0xc8c4ba); }
    // the fire door and its window, the ash door and its glowing slots
    box(ins, M.iron, x - 0.15, x + 0.15, y + 0.41, y + 0.65, z - 0.365, z - 0.32);
    { const g = new THREE.PlaneGeometry(0.21, 0.15); g.rotateY(Math.PI); g.translate(x, y + 0.53, z - 0.367); const m = new THREE.Mesh(g, M.fire); this.inner.add(m); this.fireWin = m; }
    for (let i = 0; i < 4; i++) { const g = new THREE.PlaneGeometry(0.025, 0.05); g.rotateY(Math.PI); g.translate(x - 0.06 + i * 0.04, y + 0.3, z - 0.258); this.inner.add(new THREE.Mesh(g, M.ember)); }
    box(ins, M.iron, x - 0.1, x + 0.1, y + 0.26, y + 0.34, z - 0.255, z - 0.235);
    box(ins, M.iron, x + 0.1, x + 0.14, y + 0.52, y + 0.55, z - 0.4, z - 0.36);
    // the pipe, with a damper, to a collar under the ridge
    const py = under(0);
    { const g = new THREE.CylinderGeometry(0.075, 0.075, py - (y + 0.93), 12, 1, true); g.translate(PIPE.x, (py + y + 0.93) / 2, PIPE.z); ins.put(M.iron, g); }
    { const g = new THREE.TorusGeometry(0.078, 0.01, 4, 12); g.rotateX(Math.PI / 2); for (const yy of [y + 1.2, y + 1.9, y + 2.6]) { const h = g.clone(); h.translate(PIPE.x, yy, PIPE.z); ins.put(M.iron, h); } }
    box(ins, M.iron, PIPE.x - 0.12, PIPE.x - 0.07, y + 1.5, y + 1.52, PIPE.z - 0.01, PIPE.z + 0.01);
    box(ins, M.iron, -0.18, 0.18, py - 0.1, py - 0.02, PIPE.z - 0.18, PIPE.z + 0.18);
    // the kettle
    { const kp = [[0.001, 0], [0.1, 0], [0.11, 0.04], [0.1, 0.1], [0.06, 0.13], [0.03, 0.14], [0.035, 0.155], [0.001, 0.16]], kz = z - 0.12, ky = y + 0.93;
      const g = new THREE.LatheGeometry(kp.map(([a, b]) => new THREE.Vector2(a, b)), 14); g.translate(x, ky, kz); ins.put(this.M.int, g, null, 0x2a4a7a);
      rod(ins, this.M.int, [x - 0.09, ky + 0.06, kz], [x - 0.17, ky + 0.12, kz], 0.014, 0x2a4a7a);
      const h = new THREE.TorusGeometry(0.075, 0.008, 4, 12, Math.PI); h.translate(x, ky + 0.12, kz); ins.put(M.iron, h);
      this.spout = { x: HX + x - 0.18, y: ky + 0.13, z: HZ + kz }; }
    // solid: the stove, the kettle on it, the pipe
    this._ob(x - 0.35, x + 0.35, 0, y + 0.93, z - 0.4, z + 0.35);
    this._ob(x - 0.2, x + 0.11, y + 0.93, y + 1.1, z - 0.23, z - 0.01);
    this._ob(PIPE.x - 0.08, PIPE.x + 0.08, y + 0.93, py, PIPE.z - 0.08, PIPE.z + 0.08);
  },
  // The cat, curled up asleep on the rug by the stove: an orange tabby. Its own little mesh, so it can breathe.
  _cat(inner) {
    const b = new Bag(), I = this.M.int, cg = new THREE.Group(); cg.position.set(CAT.x, FL, CAT.z); cg.rotation.y = 0.5;
    { const g = new THREE.SphereGeometry(1, 14, 10); g.scale(0.17, 0.095, 0.13); g.translate(0, 0.085, 0); b.put(I, g, null, 0xd9822b); }
    for (let i = 0; i < 4; i++) { const g = new THREE.TorusGeometry(0.13 - i * 0.012, 0.012, 4, 12, Math.PI * 0.8); g.rotateX(Math.PI / 2); g.scale(1.25, 1, 1); g.translate(0, 0.14 - i * 0.004, 0); g.rotateZ(0.1 * (i - 1.5)); b.put(I, g, null, 0xa85a18); }
    { const g = new THREE.SphereGeometry(0.068, 12, 8); g.scale(1, 0.85, 1); g.translate(0.13, 0.075, 0.07); b.put(I, g, null, 0xd9822b); }
    { const g = new THREE.SphereGeometry(0.035, 8, 6); g.translate(0.18, 0.06, 0.1); b.put(I, g, null, 0xf2e6d0); }
    for (const s of [-1, 1]) { const g = new THREE.ConeGeometry(0.022, 0.05, 4); g.rotateZ(-0.3); g.translate(0.12 + s * 0.03, 0.135, 0.06 + s * 0.035); b.put(I, g, null, 0xc4701f); }
    for (const s of [-1, 1]) { const g = boxG(0.035, 0.004, 0.006); g.translate(0.165 + s * 0.006, 0.085, 0.11 + s * 0.02); b.put(I, g, null, 0x2a1a0a); }
    { const g = new THREE.TorusGeometry(0.15, 0.026, 6, 14, Math.PI * 1.1); g.rotateX(Math.PI / 2); g.rotateY(-0.6); g.translate(0, 0.03, 0); b.put(I, g, null, 0xd9822b); }
    { const g = new THREE.SphereGeometry(0.04, 8, 6); g.scale(1.4, 0.7, 1); g.translate(0.11, 0.025, 0.11); b.put(I, g, null, 0xf2e6d0); }
    b.done(cg); inner.add(cg); this.cat = cg;
    this._ob(CAT.x - 0.22, CAT.x + 0.22, 0, FL + 0.18, CAT.z - 0.2, CAT.z + 0.2);
  },

  // ============================================================ light thrown about
  // Painted on: the windows' and the doorway's light on the snow and the deck, the lantern's pool, and the fire's
  // glow on the floor and the bricks (which flickers).
  _glows(g, inner) {
    const tex = radialTex(), mk = (list, o = 0) => {
      const geos = list.map(([x, y, z, w, d, col, vert]) => { const p = new THREE.PlaneGeometry(w, d); if (vert) p.rotateY(vert); else p.rotateX(-Math.PI / 2); p.translate(x, y, z); const n = p.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) a.set(col, i * 3); p.setAttribute('color', new THREE.BufferAttribute(a, 3)); return p; });
      const m = new THREE.Mesh(mergeGeometries(geos), new THREE.MeshBasicMaterial({ map: tex, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3 - o, polygonOffsetUnits: -3 - o, fog: false }));
      m.renderOrder = 5; m.matrixAutoUpdate = false; return m;
    };
    const win = [0.42, 0.28, 0.13], door = [0.6, 0.4, 0.18], lamp = [0.55, 0.38, 0.17];
    const steady = [
      [-W2 - 1.35, 0.04, 0, 1.5, 1.3, win], [W2 + 1.35, 0.04, -0.9, 1.5, 1.3, win], [W2 + 1.35, 0.04, 1.9, 1.5, 1.3, win],
      [-1.75, FL + 0.01, -D2 - 0.75, 1.3, 1.5, win], [1.75, FL + 0.01, -D2 - 0.75, 1.3, 1.5, win],
      [0, FL + 0.012, -D2 - 0.85, 1.9, 1.8, door], [0, 0.04, PZ - 1.3, 2.6, 2.4, [0.3, 0.2, 0.09]],
      [LAMP.x, FL + 0.014, -D2 - 0.6, 1.6, 1.6, lamp], [LAMP.x, LAMP.y - 0.1, -D2 - 0.012, 1.3, 1.3, [0.5, 0.34, 0.16], Math.PI],
    ];
    g.add(mk(steady));
    const fire = mk([[STOVE.x, FL + 0.01, STOVE.z - 0.75, 2.4, 2.0, [0.9, 0.42, 0.12]], [STOVE.x, FL + 0.8, IZ - 0.03, 2.2, 2.0, [0.5, 0.22, 0.06], Math.PI]], 1);
    inner.add(fire); this.fireGlow = fire;
    inner.add(mk([[PEND.x - 0.2, FL + 0.012, PEND.z, 1.8, 2.2, [0.32, 0.22, 0.1]], [PEND.x + 0.25, FL + 0.925, PEND.z, 0.9, 1.4, [0.35, 0.24, 0.11]]]));
  },
  // Lights: coloured C9s along both eaves and up the front gable, a garland with warm lights across the porch beam,
  // and warm little lights round the tops of the walls inside. All one instanced mesh; the wires are one mesh too.
  _lights(g) {
    const B = this.bulbs = new Bulbs(), Wr = new Wire(0.006), wire = [0.03, 0.05, 0.03], cols = [C.red, C.green, C.blue, C.gold, C.orange];
    let ci = 0;
    // a string swagged between hooks: pts are the hooks, `sag` how far it hangs between them, a bulb every `gap` metres
    const string = (hooks, sag, gap, colour, size = 0.045, w = wire, r = 0.006, drop = 0.03) => {
      const line = [];
      for (let i = 0; i < hooks.length - 1; i++) {
        const a = hooks[i], b = hooks[i + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]), n = Math.max(2, Math.round(L / gap));
        for (let j = 0; j < n; j++) { const t = j / n, s = Math.sin(t * Math.PI) * sag; line.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t - s, a[2] + (b[2] - a[2]) * t]); }
      }
      line.push(hooks[hooks.length - 1]);
      Wr.stroke(line, w, null, r);
      line.forEach((p, i) => { if (i % 1 === 0 && i > 0 && i < line.length - 1) B.add(p[0], p[1] - drop, p[2], colour ? colour : cols[ci++ % cols.length], i * 0.37, 2, size); });
    };
    // the eaves, front to back
    for (const s of [-1, 1]) { const hooks = []; for (let z = RZ0 + 0.1; z <= RZ1 - 0.1 + 1e-6; z += (RZ1 - RZ0 - 0.2) / 9) hooks.push([s * (EX + 0.055), under(EX) - 0.06, z]); string(hooks, 0.07, 0.24, null); }
    // up the front gable and down again, along the barge boards
    { const hooks = []; for (let i = 0; i <= 10; i++) { const x = -EX + i * (2 * EX / 10); hooks.push([x, under(x) - 0.08, RZ0 - 0.07]); } string(hooks, 0.05, 0.24, null); }
    // the garland across the porch: greenery swagged from post to post, warm lights in it, bows at the hooks
    { const hooks = [[-W2 + 0.1, 2.24, PZ - 0.1], [-0.85, 2.24, PZ - 0.1], [0.85, 2.24, PZ - 0.1], [W2 - 0.1, 2.24, PZ - 0.1]];
      const line = []; for (let i = 0; i < 3; i++) { const a = hooks[i], b = hooks[i + 1]; for (let j = 0; j <= 12; j++) { const t = j / 12; line.push([a[0] + (b[0] - a[0]) * t, a[1] - Math.sin(t * Math.PI) * 0.26, a[2]]); } }
      Wr.stroke(line, [0.03, 0.12, 0.05], null, 0.045); Wr.stroke(line.map(p => [p[0], p[1] + 0.01, p[2] - 0.01]), [0.02, 0.08, 0.03], null, 0.035);
      line.forEach((p, i) => { if (i % 2) B.add(p[0] + (R() - 0.5) * 0.04, p[1] + (R() - 0.5) * 0.05, p[2] - 0.05, C.warm, i * 0.5, 2, 0.032); });
      for (const h of hooks) { Wr.stroke([[h[0] - 0.07, h[1] + 0.02, h[2] - 0.05], [h[0] + 0.07, h[1] - 0.02, h[2] - 0.05]], [0.9, 0.06, 0.08], null, 0.03); Wr.stroke([[h[0] - 0.07, h[1] - 0.02, h[2] - 0.05], [h[0] + 0.07, h[1] + 0.02, h[2] - 0.05]], [0.9, 0.06, 0.08], null, 0.03); } }
    // inside, warm white, looped round the tops of the long walls
    for (const s of [-1, 1]) { const hooks = []; for (let z = -IZ + 0.1; z <= IZ - 0.1 + 1e-6; z += (2 * IZ - 0.2) / 8) hooks.push([s * (IX - 0.04), under(IX) - 0.06, z]); string(hooks, 0.12, 0.22, C.warm, 0.03, [0.06, 0.05, 0.04], 0.004, 0.02); }
    B.build(g); const wm = Wr.mesh(); if (wm) g.add(wm);
  },
  // Smoke from the chimney pot: a few soft puffs rising, swelling and drifting off east on the wind.
  _smoke(g) {
    const tex = radialTex(); this.puffs = [];
    for (let i = 0; i < 9; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: 0x9aa4b6, transparent: true, opacity: 0, depthWrite: false, fog: false })); s.position.set(this.pot.x, this.pot.y, this.pot.z); g.add(s); this.puffs.push({ s, t: i / 9 * 6 }); }
  },

  // ============================================================ play
  active(k) {
    if (!this.g) return false;
    const p = k.pos, d2 = (p.x - HX) ** 2 + (p.z - HZ) ** 2;
    this.g.visible = d2 < 240 * 240; this.inner.visible = d2 < 45 * 45;
    const on = d2 < 70 * 70;
    if (!on && this._loud) { this.roar.set(0); this._loud = false; }
    if (!on && this._indoors) { this._indoors = false; if (!k.G.roomId) k.museum.playerIndoors = false; }
    return on;
  },
  update(dt, k) {
    const t = this.t += dt, p = k.pos, v = k.v, lx = p.x - HX, lz = p.z - HZ, d = Math.hypot(lx, lz);
    if (this.bulbs.u) this.bulbs.u.uT.value = t;
    // the fire: a flicker that never quite repeats
    const fl = 0.86 + 0.07 * Math.sin(t * 9.1) + 0.05 * Math.sin(t * 23.3 + 1.7) + 0.04 * Math.sin(t * 41.9 + 0.3) + (Math.random() - 0.5) * 0.04;
    U.flick.value = fl; this.M.fire.color.setRGB(1.5 * fl, 1.2 * fl * fl, 1.0 * fl); this.M.ember.color.setRGB(0.9 * fl, 0.3 * fl, 0.06); this.fireGlow.material.color.setScalar(fl * 1.1);
    // smoke, and steam off the kettle
    for (const q of this.puffs) { q.t += dt; const L = 6, a = (q.t % L) / L, s = q.s; s.position.set(this.pot.x + a * a * 1.6 + Math.sin(q.t * 0.7) * 0.06, this.pot.y + a * 2.2, this.pot.z + a * 0.3); s.scale.setScalar(0.25 + a * 1.1); s.material.opacity = 0.32 * Math.min(1, a * 6) * (1 - a); }
    if (d < 14 && (this._kt = (this._kt || 0) - dt) < 0) { this._kt = 0.22; this.kettle.emit(this.spout.x, this.spout.y, this.spout.z, 1, { spread: 0.01, up: 0.45, out: 0.05, life: 1.4 }); }
    this.kettle.update(dt); this.steam.update(dt);
    // indoors: no snow falls, the camera stays in the room, and the cat breathes
    const inside = Math.abs(lx) < IX && Math.abs(lz) < IZ && p.y < 3;
    if (inside) { k.museum.playerIndoors = true; this._indoors = true; }
    else if (this._indoors) { this._indoors = false; if (!k.G.roomId) k.museum.playerIndoors = false; }
    if (this.inner.visible) this.cat.scale.set(1, 1 + Math.sin(t * 1.9) * 0.035, 1);
    if (inside && k.G.view !== 'fpv') {
      const drone = v.kind === 'drone', yaw = k.G.camYaw, dist = drone ? 1.35 : 1.3, up = drone ? 0.34 : 0.46, m = 0.18;
      const ax = lx - Math.sin(yaw) * dist, az = lz - Math.cos(yaw) * dist, cx = clamp(ax, -IX + m, IX - m), cz = clamp(az, -IZ + m, IZ - m), over = Math.hypot(ax - cx, az - cz);
      if (over > 0.001) {
        const cy = Math.min(p.y + up + over * 0.45, under(cx) - 0.3);
        k.camClose = { at: { x: HX + cx, y: cy, z: HZ + cz }, look: { x: p.x + Math.sin(v.yaw) * 2.2, y: p.y + (drone ? 0 : 0.42) - over * 0.15, z: p.z + Math.cos(v.yaw) * 2.2 } };
      }
    }
    // the fire's sound: a low roar, and crackles, only in and round the hut
    const fd = Math.hypot(lx - STOVE.x, lz - STOVE.z), near = inside ? clamp(1.25 - fd / 5, 0.35, 1) : clamp(1 - fd / 8, 0, 1) * 0.4;
    if (near > 0.01) { this.roar.set(0.028 * near); this._loud = true; if ((this.crack -= dt) < 0) { this.crack = 0.06 + Math.random() ** 2 * 0.7; const big = Math.random() < 0.12; k.synth.noise(big ? 0.09 : 0.015 + Math.random() * 0.04, { vol: (big ? 0.07 : 0.03 + Math.random() * 0.03) * near, lp: big ? 1800 : 2600 + Math.random() * 3800 }); } }
    else if (this._loud) { this.roar.set(0); }
    // warming up: stop in front of the stove for a moment
    const wd = Math.hypot(lx - WARM.x, lz - WARM.z), sp = Math.hypot(v.vel.x, v.vel.z);
    if (inside && wd < 0.8 && p.y < FL + 0.6 && sp < 0.6) { this.warmT += dt; if (this.warmT > 1.1 && !this.warmed) {
      this.warmed = true; this.steamT = 3.2;
      const lines = v.kind === 'drone' ? ['Toasty. The frost melts off your rotors.', 'Warm at last. The stove ticks and pops.'] : ['Toasty. The snow on your wheels hisses away.', 'Warm at last. The stove ticks and pops.', 'Thawed out. Your battery thanks you.'];
      k.say(lines[this.lines++ % lines.length], 3.5); k.synth.noise(1.6, { vol: 0.025, lp: 5000 });
    } } else { this.warmT = 0; if (wd > 2.2) this.warmed = false; }
    if (this.steamT > 0) { this.steamT -= dt; if ((this._st = (this._st || 0) - dt) < 0) { this._st = 0.07; this.steam.emit(p.x, p.y + 0.15, p.z, 2, { spread: 0.14, up: 0.55, out: 0.12, life: 1.6 }); } }
    // the cat
    const cd = Math.hypot(lx - CAT.x, lz - CAT.z);
    if (cd < 0.75 && p.y < FL + 0.8 && !this.petted) {
      this.petted = true;
      if (k.find('hutcat')) k.callout('THE HUT CAT');
      k.say('Asleep by the stove. One eye opens, then shuts.', 3.5);
      for (let i = 0; i < 8; i++) k.synth.noise(0.24, { vol: 0.05, lp: 240, at: i * 0.3 });
    } else if (cd > 2.5) this.petted = false;
  },
  spots() { return this.g ? [{ kind: 'secret', id: 'hutcat', name: 'The hut cat', x: HX + CAT.x, y: FL, z: HZ + CAT.z }] : []; },
  reset() { this.warmed = false; this.petted = false; },
});
