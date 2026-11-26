// The two toys. Both are built from primitives at true scale, and both are
// driven the way the real ones are: two sticks.

import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { confine, roomAt, groundAt, wallAt, heightOf, ceilingAt, headAt, GRAVITY, STEP } from './plan.js';

const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.5, ...o });
const glow = (r, g, b) => new THREE.MeshBasicMaterial({ color: new THREE.Color(r, g, b) });

function part(geo, mat, x, y, z, parent) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  parent.add(m);
  return m;
}

// ---------------------------------------------------------------- shadow ---
// Nothing here casts a real shadow, so each toy carries a blob of one: a soft dark oval, darkest under the middle and
// fading to nothing at its rim, laid on whatever is underneath and tipped to its slope (a ramp, a stair's plank, the
// side of a hill), spreading and fading as the toy goes up. One small texture for all of them.
let _blob = null;
function blobTex() {
  if (_blob || typeof document === 'undefined') return _blob;
  const N = 128, cv = document.createElement('canvas'); cv.width = cv.height = N;
  const c = cv.getContext('2d'), g = c.createRadialGradient(N / 2, N / 2, 0, N / 2, N / 2, N / 2 - 1);
  // full under the middle, then a long smooth fall to nothing at the rim (dark well out: a lamp-lit floor is far over
  // white before the grade, and a light shadow over it does not show)
  for (let i = 0; i <= 12; i++) { const t = i / 12, x = Math.min(1, Math.max(0, (t - 0.4) / 0.6)), v = Math.round(255 * (1 - x * x * (3 - 2 * x)) ** 0.6); g.addColorStop(t, `rgb(${v},${v},${v})`); }
  c.fillStyle = '#000'; c.fillRect(0, 0, N, N); c.fillStyle = g; c.fillRect(0, 0, N, N);
  return (_blob = new THREE.CanvasTexture(cv));          // an alpha map: only its grey is read
}
// A shadow `w` across and `l` long (the soft edge included), `op` dark at its heart. It lies in its own x-z plane.
export function blobShadow(w, l, op = 0.6) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0, alphaMap: blobTex(), transparent: true, opacity: op, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }));
  // Darken what is under it and leave the frame's alpha alone: src/finish.js reads a pixel with alpha under 1 as a work of
  // art and skips the grade there, which turned a soft shadow's edge into a pale halo.
  Object.assign(m.material, { blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.SrcAlphaFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor });
  m.scale.set(w, 1, l); m.userData.blob = { w, l, op, off: 0, n: new THREE.Vector3(0, 1, 0), want: new THREE.Vector3(0, 1, 0), at: [Infinity, 0, 0] };
  return m;
}
// Fit a toy's shadow to the bodywork (and wheels) it now has: centred under it, and big enough that its dark heart (the
// soft edge is about half the oval) covers the footprint.
function fitShadow(sh, model) {
  const B = sh.userData.blob; if (!B || !model.body) return;
  const box = new THREE.Box3().setFromObject(model.body);
  for (const w of model.wheels || []) box.expandByObject(w.pivot);
  if (box.isEmpty()) return;
  B.w = Math.max(0.36, (box.max.x - box.min.x) * 1.9); B.l = Math.max(0.42, (box.max.z - box.min.z) * 1.6); B.off = (box.max.z + box.min.z) / 2;
  B.at[0] = Infinity;
}
const _sf = new THREE.Vector3(), _sr = new THREE.Vector3(), _sm = new THREE.Matrix4();
// Lay it on the ground under (x, z), at ground height g, the toy h above it and pointing along yaw. The slope is found
// from the ground a hand's width to each side, where that is near this height (a step or a ledge beside the toy is not
// a slope), and only when the toy has moved; it eases round, so it does not flick at the edge of a ramp.
function layShadow(sh, plan, x, z, g, yaw, h, dt, spread, fade, floor) {
  const B = sh.userData.blob;
  if (Math.abs(x - B.at[0]) + Math.abs(z - B.at[1]) + Math.abs(g - B.at[2]) > 0.01) {
    B.at[0] = x; B.at[1] = z; B.at[2] = g;
    const d = 0.14, y = g + 0.25, under = plan.under;
    const at = (dx, dz) => { const v = groundAt(plan, x + dx, z + dz, y) - g; return Math.abs(v) < d * 1.25 ? v : NaN; };
    const e = at(d, 0), w = at(-d, 0), s = at(0, d), n = at(0, -d);
    plan.under = under;                                   // (the toy's own question about what is under it stands)
    const gx = e === e && w === w ? (e - w) / (2 * d) : e === e ? e / d : w === w ? -w / d : 0;
    const gz = s === s && n === n ? (s - n) / (2 * d) : s === s ? s / d : n === n ? -n / d : 0;
    B.want.set(-gx, 1, -gz).normalize();
  }
  if (dt > 0) B.n.lerp(B.want, Math.min(1, dt * 14)).normalize(); else B.n.copy(B.want);
  _sf.set(Math.sin(yaw), 0, Math.cos(yaw)); _sf.addScaledVector(B.n, -_sf.dot(B.n)).normalize();
  _sr.crossVectors(B.n, _sf);
  _sm.makeBasis(_sr, B.n, _sf); sh.quaternion.setFromRotationMatrix(_sm);
  sh.position.set(x + _sf.x * B.off, g + _sf.y * B.off, z + _sf.z * B.off).addScaledVector(B.n, 0.03);      // (3 cm up: a stair's plank lies 1.4 cm over the line the ground is reckoned on, and its steel edge 1.8)
  const k = 1 + Math.min(h, 4) * spread;
  sh.scale.set(B.w * k, 1, B.l * k);
  sh.material.opacity = B.op * Math.max(floor, 1 - h / fade) / Math.sqrt(k);
}

// ------------------------------------------------------------------- car ---

// ---- the toy buggy's kit of parts
// A soft studio to be glossy in: the paint and the chrome pick up two softboxes and a warm floor, faintly, so the
// plastic reads as plastic in a dark gallery. Painted once, small.
let _studio = null;
function studio() {
  if (_studio || typeof document === 'undefined') return _studio;
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 128;
  const c = cv.getContext('2d'), sky = c.createLinearGradient(0, 0, 0, 128);
  sky.addColorStop(0, '#5a6070'); sky.addColorStop(0.45, '#262a33'); sky.addColorStop(0.55, '#3a3028'); sky.addColorStop(1, '#16120e');
  c.fillStyle = sky; c.fillRect(0, 0, 256, 128);
  const box = (x, y, w, h) => { const g = c.createLinearGradient(x, y, x, y + h); g.addColorStop(0, 'rgba(255,255,255,0.95)'); g.addColorStop(1, 'rgba(255,240,220,0.55)'); c.fillStyle = g; c.fillRect(x, y, w, h); };
  box(30, 22, 70, 18); box(150, 16, 46, 26); box(226, 30, 22, 12);
  const t = new THREE.CanvasTexture(cv); t.mapping = THREE.EquirectangularReflectionMapping; t.colorSpace = THREE.SRGBColorSpace;
  return (_studio = t);
}
// A rim of light round the edges of a part, from its own colour and a cool sky, so a red car still shows its shape at night.
function rimmed(mat, k = 0.55, sky = 0.25) {
  mat.onBeforeCompile = sh => {
    sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
      { float rim = 1.0 - saturate(dot(normal, normalize(vViewPosition)));
        totalEmissiveRadiance += diffuseColor.rgb * pow(rim, 2.6) * ${k.toFixed(3)} + vec3(0.42, 0.5, 0.62) * pow(rim, 4.0) * ${sky.toFixed(3)}; }`);
  };
  mat.customProgramCacheKey = () => `rim${k}/${sky}`;
  return mat;
}
// Parts gathered by material and merged, so a toy with a great deal on it is still a handful of meshes.
const _v = new THREE.Vector3(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _m = new THREE.Matrix4(), _one = new THREE.Vector3(1, 1, 1), _up = new THREE.Vector3(0, 1, 0);
class Kit {
  constructor(parent) { this.parent = parent; this.by = new Map(); }
  add(geo, mat, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) {
    let g = geo.index ? geo.toNonIndexed() : geo.clone();
    if (g.attributes.uv) g.deleteAttribute('uv');
    if (!g.attributes.normal) g.computeVertexNormals();
    g.clearGroups();
    g.applyMatrix4(_m.compose(_v.set(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz)), _one));
    if (!this.by.has(mat)) this.by.set(mat, []);
    this.by.get(mat).push(g);
    return this;
  }
  // a round bar from a to b
  rod(a, b, r, mat, n = 5) {
    const d = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]), L = d.length();
    const g = new THREE.CylinderGeometry(r, r, L, n, 1, true);
    g.applyQuaternion(_q.setFromUnitVectors(_up, d.normalize())); g.translate((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
    return this.add(g, mat);
  }
  done() { for (const [mat, list] of this.by) this.parent.add(new THREE.Mesh(mergeGeometries(list, false), mat)); this.by.clear(); return this.parent; }
}
// the height of a profile drawn through these points (as the shell's top is) at z
const topAt = (prof, z) => { const P = new THREE.SplineCurve(prof.map(([a, b]) => new THREE.Vector2(a, b))).getPoints(60); for (let i = 1; i < P.length; i++) { const a = P[i - 1], b = P[i]; if ((z - a.x) * (z - b.x) <= 0) return a.y + (b.y - a.y) * ((z - a.x) / ((b.x - a.x) || 1)); } return P[0].y; };
const ss = t => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };
// A side profile ([z, y], front at +z; a list, or a function that draws on a THREE.Shape) pushed out across the car, bevelled
// round its edges; welded, so it shades smooth.
function shell(draw, w, bevel = 0.006, steps = 1, segs = 2) {
  const sh = new THREE.Shape();
  if (Array.isArray(draw)) { sh.moveTo(draw[0][0], draw[0][1]); for (const [z, y] of draw.slice(1)) sh.lineTo(z, y); sh.closePath(); } else draw(sh);
  const d = Math.max(0.001, w - 2 * bevel);
  let g = new THREE.ExtrudeGeometry(sh, { depth: d, steps, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel * 0.9, bevelOffset: -bevel * 0.9, bevelSegments: segs, curveSegments: 3 });
  g.translate(0, 0, -d / 2); g.rotateY(-Math.PI / 2);
  g.deleteAttribute('uv'); g.deleteAttribute('normal');
  g = mergeVertices(g, 1e-5); g.computeVertexNormals();
  return g;
}
// A painted disc: the racing number on each side.
let _roundel = null;
function roundelTex() {
  if (_roundel || typeof document === 'undefined') return _roundel;
  const cv = document.createElement('canvas'); cv.width = cv.height = 128; const c = cv.getContext('2d');
  c.fillStyle = '#111'; c.fillRect(0, 0, 128, 128);
  c.fillStyle = '#f6f3ea'; c.beginPath(); c.arc(64, 64, 56, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#111'; c.font = 'bold 92px Helvetica, Arial, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('7', 66, 70);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return (_roundel = t);
}
// The six-pointed star off the city's flag.
function starGeo(r) {
  const s = new THREE.Shape();
  for (let i = 0; i < 12; i++) { const a = Math.PI / 2 + i * Math.PI / 6, q = i % 2 ? r * 0.5 : r; s[i ? 'lineTo' : 'moveTo'](Math.cos(a) * q, Math.sin(a) * q); }
  return new THREE.ShapeGeometry(s);
}
// A balloon tyre with a tread of blocks, and a dished rim with five spokes: axle along x, the rim's face towards +x.
const _wheelGeo = new Map();
function wheelGeos(r, w, front) {
  const key = `${r}/${w}/${front}`;
  if (_wheelGeo.has(key)) return _wheelGeo.get(key);
  const R = r - 0.0055, lug = 0.0055;              // the carcass, and the blocks standing proud of it, out to r
  const prof = [[0.64, -0.44], [0.82, -0.5], [0.95, -0.46], [1, -0.32], [1, 0.32], [0.95, 0.46], [0.82, 0.5], [0.64, 0.44]].map(([p, a]) => new THREE.Vector2(p * R, a * w));
  const T = new Kit(null), RIM = new Kit(null);
  const tyre = new THREE.LatheGeometry(prof, 15); tyre.rotateZ(-Math.PI / 2);
  T.add(tyre, 0);
  // tread: blocks in two staggered rows (rear), or a row of chevrons with ribs either side (front)
  const n = front ? 12 : 11;
  for (let i = 0; i < n; i++) {
    const a = i * Math.PI * 2 / n;
    if (front) {
      for (const s of [-1, 1]) T.add(new THREE.BoxGeometry(w * 0.3, lug * 1.6, R * 0.17), 0, s * w * 0.16, Math.cos(a) * (R + lug * 0.2), Math.sin(a) * (R + lug * 0.2), a, s * 0.45, 0);
    } else {
      for (const [s, o] of [[-1, 0], [1, 0.5]]) { const b = a + o * Math.PI * 2 / n; T.add(new THREE.BoxGeometry(w * 0.38, lug * 1.8, R * 0.2), 0, s * w * 0.2, Math.cos(b) * (R + lug * 0.1), Math.sin(b) * (R + lug * 0.1), b, 0, 0); }
    }
  }
  // the rim: a lip, a dished face, five spokes and a hub nut
  const lip = new THREE.TorusGeometry(R * 0.65, R * 0.065, 3, 14); lip.rotateY(Math.PI / 2); RIM.add(lip, 0, w * 0.42);
  const well = new THREE.CylinderGeometry(R * 0.66, R * 0.66, w * 0.5, 16, 1, true); well.rotateZ(Math.PI / 2); RIM.add(well, 0, w * 0.17);
  const face = new THREE.CircleGeometry(R * 0.62, 16); face.rotateY(Math.PI / 2); T.add(face, 0, w * 0.2);          // the dark dish behind the spokes
  for (let i = 0; i < 5; i++) { const a = i * Math.PI * 2 / 5; RIM.add(new THREE.BoxGeometry(0.008, R * 0.13, R * 0.56), 0, w * 0.25, Math.cos(a) * R * 0.27, Math.sin(a) * R * 0.27, a + Math.PI / 2, 0, 0); }
  const hub = new THREE.CylinderGeometry(R * 0.17, R * 0.2, w * 0.24, 6); hub.rotateZ(-Math.PI / 2); RIM.add(hub, 0, w * 0.3);
  const merged = k => mergeGeometries(k.by.get(0), false);
  const out = { tyre: merged(T), rim: merged(RIM) };
  _wheelGeo.set(key, out);
  return out;
}

export function buildCar(colour = 0xd2261c) {
  const g = new THREE.Group();
  const body = new THREE.Group();
  g.add(body);
  const env = studio();
  const paint = rimmed(std(colour, { roughness: 0.3, metalness: 0.0, emissive: colour, emissiveIntensity: 0.12, envMap: env, envMapIntensity: 0.32 }), 0.42, 0.22); paint.name = 'paint';      // (the one a can of paint goes on: src/garage.js)
  const black = rimmed(std(0x16171b, { roughness: 0.55, envMap: env, envMapIntensity: 0.4 }), 0.4, 0.35);
  const trim = std(0xf3c21b, { roughness: 0.35, emissive: 0xf3c21b, emissiveIntensity: 0.15, envMap: env, envMapIntensity: 0.4 });
  const chrome = std(0xc9ced6, { metalness: 0.9, roughness: 0.25, envMap: env, envMapIntensity: 1.2 });
  const glass = std(0x0e1622, { roughness: 0.08, metalness: 0.3, envMap: env, envMapIntensity: 1.1 });
  const white = rimmed(std(0xf4f2ec, { roughness: 0.3, envMap: env, envMapIntensity: 0.5 }), 0.25, 0.2);
  const suit = std(0x1e4fc8, { roughness: 0.5, emissive: 0x1e4fc8, emissiveIntensity: 0.1 });
  const steel = std(0x5b6068, { metalness: 0.7, roughness: 0.4, envMap: env, envMapIntensity: 0.6 });
  const screen = new THREE.MeshStandardMaterial({ color: 0x9fc4dc, roughness: 0.05, metalness: 0.2, envMap: env, envMapIntensity: 1.4, transparent: true, opacity: 0.38, side: THREE.DoubleSide, depthWrite: false });
  const spring = std(0xf3c21b, { metalness: 0.5, roughness: 0.3, emissive: 0xf3c21b, emissiveIntensity: 0.12, envMap: env, envMapIntensity: 0.6 });

  // ---- the body shell: a low wedge of a nose, an open cockpit with its driver, a deck behind with the wing on it
  const HW = 0.085, CROWN = 0.011;
  const TOP = [[0.238, 0.101], [0.212, 0.117], [0.16, 0.134], [0.1, 0.147], [0.062, 0.153]];
  const DECK = [[-0.085, 0.153], [-0.1, 0.161], [-0.16, 0.159], [-0.2, 0.149], [-0.219, 0.13]];
  const hull = shell(sh => {
    sh.moveTo(0.236, 0.086); sh.lineTo(0.24, 0.096);
    sh.splineThru(TOP.map(([z, y]) => new THREE.Vector2(z, y)));
    sh.lineTo(-0.075, 0.152);
    sh.splineThru(DECK.map(([z, y]) => new THREE.Vector2(z, y)));
    sh.lineTo(-0.221, 0.094); sh.lineTo(-0.205, 0.084); sh.lineTo(0.2, 0.084); sh.closePath();
  }, HW * 2, 0.011, 3, 2);
  // narrower at the nose and a little at the tail; the top crowned, so it is a shell and not a box
  const taper = z => (z > 0.1 ? 1 - 0.3 * ss((z - 0.1) / 0.14) : z < -0.15 ? 1 - 0.1 * ss((-0.15 - z) / 0.07) : 1);
  const lift = (x, y) => CROWN * Math.max(0, 1 - (x / HW) ** 2) * ss((y - 0.095) / 0.05);
  { const p = hull.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); p.setXYZ(i, x * taper(z), y + lift(x, y), z); } hull.computeVertexNormals(); }
  const B = new Kit(body);
  B.add(hull, paint);
  // the sides of the cockpit, and the dark tub between them
  for (const s of [-1, 1]) B.add(shell([[0.07, 0.15], [0.048, 0.171], [-0.05, 0.176], [-0.082, 0.158], [-0.082, 0.145], [0.07, 0.145]], 0.028, 0.006, 1, 2), paint, s * 0.069);
  B.add(new THREE.BoxGeometry(0.11, 0.006, 0.15), black, 0, 0.166, -0.005);
  // the driver: helmet and visor, shoulders in a blue suit, a seat back
  B.add(new THREE.SphereGeometry(0.024, 12, 8), white, 0, 0.186, -0.028);
  B.add(new THREE.SphereGeometry(0.0246, 8, 3, Math.PI / 2 - 0.95, 1.9, 1.2, 0.62), glass, 0, 0.186, -0.028);
  B.add(new THREE.BoxGeometry(0.052, 0.006, 0.005), trim, 0, 0.2085, -0.028, 0, 0, 0);
  { const sg = new THREE.SphereGeometry(0.022, 8, 5); sg.scale(1.55, 0.75, 1); B.add(sg, suit, 0, 0.172, -0.036); }
  B.add(new THREE.BoxGeometry(0.07, 0.05, 0.012), black, 0, 0.175, -0.066, -0.15, 0, 0);
  // a windscreen, raked back
  { const ws = new THREE.CylinderGeometry(0.048, 0.048, 0.022, 8, 1, true, -0.75, 1.5); ws.scale(1, 1, 0.45); B.add(ws, screen, 0, 0.176, 0.036, -0.55, 0, 0); }
  // the roll cage: a hoop behind the driver, braced back to the deck and forward to the windscreen
  { const hoop = new THREE.TubeGeometry(new THREE.CatmullRomCurve3([[-0.068, 0.17, -0.066], [-0.056, 0.212, -0.07], [-0.03, 0.226, -0.071], [0.03, 0.226, -0.071], [0.056, 0.212, -0.07], [0.068, 0.17, -0.066]].map(p => new THREE.Vector3(...p))), 10, 0.0042, 4); B.add(hoop, black); }
  for (const s of [-1, 1]) { B.rod([s * 0.048, 0.218, -0.07], [s * 0.052, 0.16, -0.15], 0.0036, black); B.rod([s * 0.046, 0.219, -0.07], [s * 0.056, 0.172, 0.04], 0.0032, black); }
  // the wing: an aerofoil on two struts, with end plates and a yellow lip
  B.add(shell([[-0.162, 0.244], [-0.175, 0.2495], [-0.2, 0.2495], [-0.232, 0.2445], [-0.244, 0.248], [-0.246, 0.243], [-0.215, 0.238], [-0.18, 0.2385]], 0.236, 0.003, 3, 1), paint);
  B.add(new THREE.BoxGeometry(0.236, 0.006, 0.004), trim, 0, 0.2485, -0.243);
  for (const s of [-1, 1]) {
    B.add(shell([[-0.16, 0.24], [-0.168, 0.255], [-0.236, 0.258], [-0.25, 0.24], [-0.238, 0.231], [-0.172, 0.232]], 0.005, 0.0015, 1, 1), trim, s * 0.12);
    B.add(new THREE.BoxGeometry(0.004, 0.086, 0.016), steel, s * 0.05, 0.198, -0.19, 0.32, 0, 0);
  }
  // decals: twin stripes over the nose and the deck, the number on each side, the star on the nose
  const stripe = (z0, z1, prof) => {
    const pts = new THREE.SplineCurve(prof.map(([z, y]) => new THREE.Vector2(z, y))).getPoints(24).filter(q => q.x <= Math.max(z0, z1) && q.x >= Math.min(z0, z1));
    for (const xc of [-0.03, 0.03]) {
      const pos = [];
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i], b = pts[i + 1], v = (q, x) => [x * taper(q.x), q.y + lift(x, q.y) + 0.0012, q.x];
        const A0 = v(a, xc - 0.0055), A1 = v(a, xc + 0.0055), B0 = v(b, xc - 0.0055), B1 = v(b, xc + 0.0055);
        pos.push(...A0, ...B1, ...B0, ...A0, ...A1, ...B1);
      }
      const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); sg.computeVertexNormals();
      if (sg.attributes.normal.getY(0) < 0) { const p = sg.attributes.position; for (let i = 0; i < p.count; i += 3) { const t = [p.getX(i + 1), p.getY(i + 1), p.getZ(i + 1)]; p.setXYZ(i + 1, p.getX(i + 2), p.getY(i + 2), p.getZ(i + 2)); p.setXYZ(i + 2, ...t); } sg.computeVertexNormals(); }
      B.add(sg, trim);
    }
  };
  const TOP2 = [[0.24, 0.096], ...TOP], DECK2 = [[-0.075, 0.152], ...DECK];
  stripe(0.236, 0.065, TOP2); stripe(-0.09, -0.218, DECK2);
  for (const s of [-1, 1]) for (const [z0, z1] of [[0.07, -0.088], [-0.115, -0.2]]) { const zc = (z0 + z1) / 2, len = z0 - z1; B.add(new THREE.BoxGeometry(0.0016, 0.006, len), trim, s * (HW * taper(zc) + 0.0006), 0.1, zc); }
  { const st = starGeo(0.0145); st.rotateX(-Math.PI / 2 + 0.27); const z = 0.172, y = topAt(TOP2, z); B.add(st, white, 0, y + lift(0, y) + 0.0016, z); }
  B.done();
  const roundel = new THREE.MeshStandardMaterial({ map: roundelTex(), emissiveMap: roundelTex(), emissive: 0xffffff, emissiveIntensity: 0.32, roughness: 0.35, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  for (const s of [-1, 1]) { const d = part(new THREE.CircleGeometry(0.021, 20), roundel, s * (HW + 0.0008), 0.118, -0.03, body); d.rotation.y = s * Math.PI / 2; }

  // lamps: two in chrome bezels on the nose, two tail lights under the wing
  const L = new Kit(body);
  for (const s of [-1, 1]) {
    L.add(new THREE.SphereGeometry(0.0125, 8, 6), glow(4, 3.6, 2.6), s * 0.038, 0.115, 0.214);
    const bz = new THREE.TorusGeometry(0.0128, 0.0028, 4, 12); L.add(bz, chrome, s * 0.038, 0.116, 0.218, -0.35, 0, 0);
    L.add(new THREE.BoxGeometry(0.026, 0.013, 0.006), glow(2.2, 0.1, 0.08), s * 0.056, 0.118, -0.221);
  }
  L.done();

  // ---- the chassis under it all, with its suspension. It lives in the body but leans only a third as far, so the shell
  // can be seen to roll and pitch on its springs over it (Car.sync).
  const chassis = new THREE.Group(); body.add(chassis);
  const C = new Kit(chassis);
  C.add(shell([[0.232, 0.07], [0.215, 0.06], [-0.205, 0.06], [-0.215, 0.07], [-0.205, 0.088], [0.205, 0.088]], 0.13, 0.008, 1, 2), black);       // the tub
  { const bp = new THREE.CapsuleGeometry(0.011, 0.17, 2, 6); bp.rotateZ(Math.PI / 2); C.add(bp, black, 0, 0.072, 0.243); }                       // the front bumper
  for (const s of [-1, 1]) C.add(new THREE.BoxGeometry(0.014, 0.012, 0.03), black, s * 0.05, 0.072, 0.228);
  for (const [z, r, xw] of [[0.14, 0.058, 0.108], [-0.14, 0.068, 0.106]]) for (const s of [-1, 1]) {
    // wishbones out to each wheel, a shock with a yellow spring
    C.rod([s * 0.05, 0.066, z + 0.03], [s * xw, r, z], 0.0042, steel); C.rod([s * 0.05, 0.066, z - 0.03], [s * xw, r, z], 0.0042, steel);
    const top = z > 0 ? [s * 0.083, 0.128, z + 0.012] : [s * 0.056, 0.15, -0.228], bot = z > 0 ? [s * 0.1, r + 0.004, z + 0.006] : [s * 0.094, r + 0.006, -0.17];
    C.rod(top, bot, 0.0042, chrome, 6);
    const d = new THREE.Vector3(bot[0] - top[0], bot[1] - top[1], bot[2] - top[2]), Ls = d.length(); d.normalize();
    const coil = []; for (let i = 0; i <= 15; i++) { const t = i / 15, a = t * Math.PI * 2 * 3.5; coil.push(new THREE.Vector3(Math.cos(a) * 0.0085, 0.08 * Ls + t * Ls * 0.7, Math.sin(a) * 0.0085)); }
    const cg = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(coil), 15, 0.002, 3); cg.applyQuaternion(_q.setFromUnitVectors(_up, d)); cg.translate(...top);
    C.add(cg, spring);
  }
  // the motor and gearbox, between the back wheels
  { const can = new THREE.CylinderGeometry(0.019, 0.019, 0.05, 12); can.rotateZ(Math.PI / 2); C.add(can, chrome, -0.012, 0.074, -0.224); }
  C.add(new THREE.BoxGeometry(0.05, 0.04, 0.035), black, 0.026, 0.078, -0.212);
  C.done();

  // Wheels: chunky, bigger at the back, the way a toy buggy's always were.
  const wheels = [];
  const tyre = rimmed(std(0x111113, { roughness: 0.85 }), 0.0, 0.18);
  for (const [x, z, r, w, front] of [[-0.125, 0.14, 0.058, 0.05, true], [0.125, 0.14, 0.058, 0.05, true], [-0.135, -0.14, 0.068, 0.065, false], [0.135, -0.14, 0.068, 0.065, false]]) {
    const pivot = new THREE.Group();
    pivot.position.set(x, r, z);
    const spin = new THREE.Group();
    const W = wheelGeos(r, w, front), t = new THREE.Mesh(W.tyre, tyre), hub = new THREE.Mesh(W.rim, trim);
    if (x < 0) t.rotation.y = hub.rotation.y = Math.PI;          // the rim's face outwards
    spin.add(t, hub);
    pivot.add(spin);
    g.add(pivot);
    wheels.push({ pivot, spin, r, front });
  }

  // The aerial. It whips.
  const aerial = new THREE.Group();
  aerial.position.set(-0.07, 0.158, -0.14);                // its foot is on the deck behind the cockpit
  part(new THREE.CylinderGeometry(0.007, 0.0095, 0.014, 8), black, 0, 0.007, 0, aerial);
  part(new THREE.CylinderGeometry(0.0022, 0.003, 0.36, 5), std(0xbfc4c9, { metalness: 0.8, roughness: 0.3 }), 0, 0.18, 0, aerial);
  part(new THREE.SphereGeometry(0.008, 8, 6), glow(1.3, 0.45, 0.05), 0, 0.365, 0, aerial);
  body.add(aerial);

  // Headlights you can see by.
  const lamp = new THREE.SpotLight(0xfff0d0, 70, 30, 0.5, 0.75, 1.6);
  lamp.position.set(0, 0.14, 0.2);
  lamp.target.position.set(0, 0.02, 4);
  g.add(lamp, lamp.target);

  // A blob of shadow, since nothing else here casts one.
  const shadow = blobShadow(0.62, 0.82, 0.92);
  g.rotation.order = 'YXZ';          // yaw, then tip the whole car nose-up or nose-down

  return { group: g, body, chassis, wheels, aerial, lamp, shadow, radius: 0.19, kind: 'car' };
}

// How a car handles, as multiples of the first one's. Every body in the garage starts from these.
export const CAR_SPEC = { top: 1, accel: 1, grip: 1, steer: 1, jump: 1, ice: 0 };      // ice: 0, slides like anything else; 1, as if it were snow
export const DRONE_SPEC = { accel: 1, climb: 1, yaw: 1 };

export class Car {
  constructor(plan, colour) {
    this.plan = plan;
    Object.assign(this, buildCar(colour));
    this.pos = new THREE.Vector3(0, 0, 0);
    this.vel = new THREE.Vector3();
    this.yaw = 0;
    this.steer = 0; this.throttle = 0;
    this.aerialV = new THREE.Vector2(); this.aerialP = new THREE.Vector2();
    this.speed = 0; this.slip = 0; this.bump = 0; this.roll = 0; this.pitch = 0;
    this.vy = 0; this.air = false; this.airT = 0; this.tilt = 0; this.squash = 0;
    this.rail = null;            // set while the car is on the loop
    this.vert = null;            // set during an air off a skate ramp
    this.flip = 0; this.spin = 0; this.cool = 0; this.hopped = false;
    this.on = null;              // the stunt piece under the wheels, if any
    this.wet = false;
    this.launched = 0;           // for one frame: the seconds of air this take-off should give
    this.landed = null;          // for one frame: { air, dist, impact }
    this._from = { x: 0, z: 0 };
    this._push = { x: 0, y: 0, z: 0 };
    this.spec = { ...CAR_SPEC };
    this.gravity = GRAVITY;      // Earth's; the Moon's while it is there (src/voyage.js)
  }

  // Another body on the same toy (see garage.js): new bodywork, wheels and aerial, and how it handles.
  reskin(model, spec = {}) {
    this.group.remove(this.body); for (const w of this.wheels) this.group.remove(w.pivot);
    fitShadow(this.shadow, model);
    this.body = model.body; this.wheels = model.wheels; this.aerial = model.aerial; this.chassis = model.chassis || null;
    this.group.add(this.body); for (const w of this.wheels) this.group.add(w.pivot);
    this.spec = { ...CAR_SPEC, ...spec };
    // A long body keeps its ends out of the walls with extra circles along it ([offset forward, radius]); a plough has a
    // blade (winter.js clears the snow it passes over); a semi has a trailer, towed behind on its own (see _tow).
    this.radius = model.radius || 0.19; this.probes = model.probes || null; this.blade = model.blade || null;
    if (this.trailer) { this.group.remove(this.trailer.group); this.trailer = null; }
    if (model.trailer) { const t = this.trailer = { ...model.trailer, ax: 0, az: 0, y: 0, yaw: this.yaw }; this.group.add(t.group); this._hitchReset(); }
    this.sync(0);
  }

  place(x, z, yaw, y = 0) {
    this.pos.set(x, y, z); this.vel.set(0, 0, 0); this.yaw = yaw;
    this.vy = 0; this.air = false; this.rail = null; this.tilt = 0; this.speed = 0; this.flip = this.spin = 0;
    this.on = null;              // (what it last stood on is not under it now: remembered, the car climbed 1.6 m back onto that piece from below it)
    this.pos.y = groundAt(this.plan, x, z, y + 0.3);
    this._unbox();
    this._hitchReset();
    this.out = this._proud(roomAt(this.plan, this.pos.x, this.pos.z, this.pos.y));
    this.sync(0);
  }

  // Is what is drawn under the wheels here laid a little over the ground (sync)? Out of doors, yes: but not the open snow
  // of the park, which is drawn from the land itself and under it (snowfield.js), only the paving that crosses it and the ice.
  _proud(room) {
    if (room) return false;
    const P = this.plan, x = this.pos.x, z = this.pos.z, R = P.land && P.land.rolls;
    if (!R || x <= R.x0 || x >= R.x1 || z <= R.z0 || z >= R.z1) return true;
    for (const list of [P.paved, P.ice]) for (const q of list) if (x > q.x0 && x < q.x1 && z > q.z0 && z < q.z1) return true;
    return false;
  }

  // A spot inside something solid (the hollow middle of a crate or a skate ramp, a block of furniture) would box the car in
  // for good: it goes on top of the solid piece instead, and out of the side of a fixed obstacle (which has no top to stand on).
  _unbox() {
    const P = this.plan, p = this.pos;
    for (let n = 0; n < 4 && wallAt(P, p.x, p.z, p.y); n++) {
      let top = p.y;
      for (const list of p.y > 2 && P.roofs ? [P.surfaces, P.roofs] : [P.surfaces]) for (const s of list) {
        if (s.hill || p.x < s.x0 || p.x > s.x1 || p.z < s.z0 || p.z > s.z1) continue;
        const h = heightOf(s, p.x, p.z); if (h > top && h - p.y < 6) top = h;
      }
      if (top <= p.y) break;
      p.y = groundAt(P, p.x, p.z, top + 0.02, 0.05);
    }
    const r = this.radius;
    for (const o of P.obstacles) {
      if (o.gate || o.rail || p.y + 0.12 < o.y0 || p.y + 0.02 > o.y1 || p.x <= o.x0 || p.x >= o.x1 || p.z <= o.z0 || p.z >= o.z1) continue;
      const l = p.x - o.x0, rr = o.x1 - p.x, nn = p.z - o.z0, ss = o.z1 - p.z, m = Math.min(l, rr, nn, ss);
      if (m === l) p.x = o.x0 - r - 0.02; else if (m === rr) p.x = o.x1 + r + 0.02; else if (m === nn) p.z = o.z0 - r - 0.02; else p.z = o.z1 + r + 0.02;
      p.y = groundAt(P, p.x, p.z, p.y + 0.3);
    }
  }

  // ---- the trailer (a semi's). Its kingpin rides on the tractor's fifth wheel; its axles, `len` behind the kingpin, roll
  // where they are pulled and never sideways: each frame the axle moves straight towards wherever the kingpin has gone.
  // That is all it takes for it to cut corners going forward, swing wide backing up, and fold up (jack-knife) if
  // reversed carelessly. Walls push it round about the kingpin.
  _hitch(out) { const t = this.trailer; return out.set(this.pos.x + Math.sin(this.yaw) * t.hitch, this.pos.y, this.pos.z + Math.cos(this.yaw) * t.hitch); }
  _hitchReset() {
    const t = this.trailer; if (!t) return;
    const H = this._hitch(this._hv || (this._hv = new THREE.Vector3()));
    t.yaw = this.yaw; t.ax = H.x - Math.sin(this.yaw) * t.len; t.az = H.z - Math.cos(this.yaw) * t.len; t.y = this.pos.y; t.v = 0; t.folded = 0;
  }
  _tow(dt) {
    const t = this.trailer; if (!t) return;
    const H = this._hitch(this._hv || (this._hv = new THREE.Vector3()));
    let dx = H.x - t.ax, dz = H.z - t.az, d = Math.hypot(dx, dz);
    if (d > t.len * 3 || !(d > 1e-6)) { this._hitchReset(); return; }                     // put back behind (after a teleport)
    const px = t.ax, pz = t.az;
    t.ax = H.x - dx / d * t.len; t.az = H.z - dz / d * t.len;
    // Folded too far round, the trailer's nose meets the back of the cab: it can go no further.
    const lim = 1.4;
    const fold = () => { let k = Math.atan2(H.x - t.ax, H.z - t.az) - this.yaw; k = Math.atan2(Math.sin(k), Math.cos(k)); return k; };
    let k = fold();
    t.folded = Math.max(0, (t.folded || 0) - dt);
    if (Math.abs(k) > lim) { const a = this.yaw + Math.sign(k) * lim; t.ax = H.x - Math.sin(a) * t.len; t.az = H.z - Math.cos(a) * t.len; t.folded = 0.6; k = Math.sign(k) * lim; }
    // Walls: points down the trailer's length, each kept clear of walls and fixed things; what moves them swings the trailer.
    const q = this._tq || (this._tq = { x: 0, y: 0, z: 0 }), push = this._tp || (this._tp = { x: 0, y: 0, z: 0 });
    for (let pass = 0; pass < 2; pass++) for (const s of [0.18, t.len, t.rear - 0.04]) {
      dx = t.ax - H.x; dz = t.az - H.z; d = Math.hypot(dx, dz) || 1e-6;
      q.x = H.x + dx / d * s; q.y = t.y; q.z = H.z + dz / d * s;
      const ox = q.x, oz = q.z;
      if (confine(this.plan, q, t.width, false, push)) {
        const f = t.len / s;                                                                // a nudge at s turns the line about the kingpin as much as f times it at the axle
        t.ax += (q.x - ox) * f; t.az += (q.z - oz) * f;
        dx = t.ax - H.x; dz = t.az - H.z; d = Math.hypot(dx, dz) || 1e-6; t.ax = H.x + dx / d * t.len; t.az = H.z + dz / d * t.len;
      }
    }
    t.yaw = Math.atan2(H.x - t.ax, H.z - t.az);
    t.v = dt > 0 ? ((t.ax - px) * Math.sin(t.yaw) + (t.az - pz) * Math.cos(t.yaw)) / dt : 0;
    // Up and down: the axles on the ground under them (stepping up a kerb the way the car does), the kingpin on the tractor.
    const g = groundAt(this.plan, t.ax, t.az, Math.max(t.y, this.pos.y) + 0.25);
    t.y = this.air ? Math.max(g, Math.min(t.y, this.pos.y)) : g;
    if (Math.abs(t.y - this.pos.y) > 1.2) t.y = this.pos.y;                                 // never hanging off a balcony
  }
  _drawTrailer(dt) {
    const t = this.trailer; if (!t) return;
    const W = this._tw || (this._tw = new THREE.Matrix4()), E = this._te || (this._te = new THREE.Euler(0, 0, 0, 'YXZ')), Qt = this._tqq || (this._tqq = new THREE.Quaternion()), one = this._t1 || (this._t1 = new THREE.Vector3(1, 1, 1)), H = this._hitch(this._hv2 || (this._hv2 = new THREE.Vector3()));
    E.set(Math.atan2(t.y - H.y, t.len), t.yaw, 0); Qt.setFromEuler(E);
    W.compose(H, Qt, one);
    this.group.updateMatrix();
    const inv = this._ti || (this._ti = new THREE.Matrix4()); inv.copy(this.group.matrix).invert();
    W.premultiply(inv); W.decompose(t.group.position, t.group.quaternion, t.group.scale);
    for (const w of t.wheels) w.spin.rotation.x += (t.v / w.r) * dt;
  }
  // Besides the toy itself, what else of it runs into things (loose.js, props.js): a plough's blade, a trailer.
  extraMovers(out) {
    const fx = Math.sin(this.yaw), fz = Math.cos(this.yaw);
    if (this.blade) out.push({ x: this.pos.x + fx * this.blade.z, y: this.pos.y, z: this.pos.z + fz * this.blade.z, vx: this.vel.x * 1.15, vz: this.vel.z * 1.15, r: this.blade.hw });
    const t = this.trailer;
    if (t) { const sx = Math.sin(t.yaw), sz = Math.cos(t.yaw), H = this._hitch(this._hv3 || (this._hv3 = new THREE.Vector3())); for (const s of [0.2, 0.42]) out.push({ x: H.x - sx * s, y: t.y, z: H.z - sz * s, vx: sx * t.v, vz: sz * t.v, r: t.width + 0.02 }); }
  }

  update(dt, inp) {
    const GRAVITY = this.gravity;          // (everything below falls at this toy's own gravity)
    this.launched = 0; this.landed = null; this.bump = 0;
    this.clock = (this.clock || 0) + dt;
    if (this.rail) return this._loop(dt, inp);
    const S = this.spec, TOP = 12 * S.top * (this.gentle ? 0.72 : 1), REV = 4.5;
    const fx = Math.sin(this.yaw), fz = Math.cos(this.yaw);
    const rx = -fz, rz = fx;
    let vf = this.vel.x * fx + this.vel.z * fz;
    let vl = this.vel.x * rx + this.vel.z * rz;
    this._vf0 = vf;              // speed before the motor has its say (wheels spin on a wet floor)
    const th = inp.throttle;
    this.throttle = th;
    this.steer += (inp.steer - this.steer) * Math.min(1, dt * 11);
    // The gentle car (Settings, Driving): for a young driver. The same toy, steered by the same hands, but it tops out
    // lower, pulls away instead of leaping, and the faster it goes the less sharply it turns. A driver who holds a key
    // until the car points the right way lets go a third of a second late: at 120 degrees a second that is a 40 degree
    // overshoot, and the press that answers it overshoots back (a zigzag down every corridor); at 70 it is not. At a
    // crawl it turns as tightly as ever, and flat out it still gets round the same corner the quick car does flat out.
    const gentle = !!this.gentle;
    this.power = !gentle ? th : th > 0 ? Math.min(th, (this.power || 0) + dt / 0.6) : 0;
    let rate = 0;
    if (!this.air) {
      // Part throttle is a lower top speed, not just a slower run up to the same one.
      if (th > 0) vf += (vf < 0 ? th : this.power) * 13 * S.accel * (1 - Math.max(0, vf) / (TOP * (0.22 + 0.78 * th))) * dt * (vf < 0 ? 2.2 : 1);
      else if (th < 0) vf += th * (vf > 0.4 ? 20 : 9 * (1 - Math.max(0, -vf) / REV)) * dt;
      vf -= vf * 0.24 * dt + Math.sign(vf) * Math.min(Math.abs(vf), 0.4 * dt);     // tops out near 9.5 m/s
      // Marble is slippery; a gallery's wood floor is not; a mopped floor is something else.
      const room = roomAt(this.plan, this.pos.x, this.pos.z, this.pos.y);
      this.out = this._proud(room);
      let grip = !room ? 3.4 : room.kind === 'gallery' && room.floor !== '1' ? 9 : 5.2;
      // Gritted streets hold better than snow; the frozen pool does not hold at all.
      if (!room) { for (const q of this.plan.paved) if (this.pos.x > q.x0 && this.pos.x < q.x1 && this.pos.z > q.z0 && this.pos.z < q.z1) grip = 6; for (const q of this.plan.ice) if ((q.y === undefined || Math.abs(this.pos.y - q.y) < 0.05) && this.pos.x > q.x0 && this.pos.x < q.x1 && this.pos.z > q.z0 && this.pos.z < q.z1) grip = 0.3; }
      // Snow outdoors, unless there is track laid on it.
      if (!room) for (const d of this.plan.decals) if (this.pos.x > d.x0 && this.pos.x < d.x1 && this.pos.z > d.z0 - 0.3 && this.pos.z < d.z1 + 0.3) grip = 9;
      grip *= S.grip;
      let bite = Math.max(-1, Math.min(1, vf / 1.4));
      this.wet = false;
      for (const p of this.plan.puddles) if (Math.abs(this.pos.y - (p.y || 0)) < 0.03 && (p.x0 !== undefined ? this.pos.x > p.x0 && this.pos.x < p.x1 && this.pos.z > p.z0 && this.pos.z < p.z1 : (this.pos.x - p.x) ** 2 + (this.pos.z - p.z) ** 2 < p.r * p.r)) this.wet = true;      // (a rectangle: a room the sprinklers have wetted, src/systems.js)
      if (this.wet) { grip = 0.35; bite *= 0.55; vf -= (vf - this._vf0) * 0.7; }
      // Ice: the wheels spin, the brakes do little, and the car goes on the way it was going whichever way it is pointed.
      const sheet = !this.wet && !room && this.plan.ice.find(q => Math.abs(this.pos.y - (q.y || 0)) < 0.05 && this.pos.x > q.x0 && this.pos.x < q.x1 && this.pos.z > q.z0 && this.pos.z < q.z1), icy = !!sheet;      // (a sheet lies at the level of the grounds unless it says where: `y`, for one down on Michigan Avenue, src/hydrants.js)
      // (Big studded tyres, S.ice, bite into it: less wheelspin, more steering, and the slide is caught sooner. The
      // harbour's crusted lake ice is driven as if on studs: it still slides, but a toy can steer across it and line up a jump.)
      // (A sheet may say how crusted it is at a spot, 0 glassy to 1 snowed over: crust(x, z). The harbour's does: src/icefield.js.)
      const crust = !icy ? 0 : typeof sheet.crust === 'function' ? sheet.crust(this.pos.x, this.pos.z) : sheet.crust ? 0.85 : 0;
      if (icy) { const ice = Math.max(S.ice || 0, crust); grip = 0.15 + ice * 2.4 * S.grip; bite *= 0.8 + 0.2 * ice; vf -= (vf - this._vf0) * 0.8 * (1 - ice * 0.85); }
      rate = this.steer * bite * 3.6 * S.steer / (1 + Math.abs(vf) / (gentle ? 4 : 13));
      this.yaw -= rate * dt;
      this.slip = Math.abs(vl);
      const nfx = Math.sin(this.yaw), nfz = Math.cos(this.yaw);
      if (icy || this.wet) {
        // Nothing holds it. What it was doing over the ground carries on, and comes round only slowly to where the wheels point.
        // (Everywhere else the car simply goes where it is pointed, which is why nothing used to slide at all.)
        const wx = fx * vf + rx * vl, wz = fz * vf + rz * vl;
        vf = wx * nfx + wz * nfz; vl = (wx * -nfz + wz * nfx) * Math.exp(-grip * dt);
      } else vl *= Math.exp(-grip * dt);
      this.vel.x = nfx * vf + (-nfz) * vl;
      this.vel.z = nfz * vf + nfx * vl;
    } else if (inp.trick) {
      // Hold the jump button in the air and the sticks throw the car about:
      // left and right spin it, forward and back flip it.
      const s = inp.steer * 7 * dt, f = th * 8 * dt;
      this.yaw -= s; this.spin += s;
      this.tilt += f; this.flip += f;
    } else {
      // In the air the wheels do nothing, but a toy will still twist a little.
      this.yaw -= this.steer * 0.9 * dt;
    }
    // Space: a hop. No toy car ever did this. This one does.
    this.cool -= dt;
    if (inp.jump && !this.air && this.cool <= 0) {
      this.hopped = this.vy < 0.8;             // a hop off the flat, as opposed to extra off a ramp
      this.vy = Math.max(0, this.vy) + 3.0 * S.jump; this.cool = 0.2; this.jumped = true; this.boost = 0.26;
    }
    // Keep the button down and it goes on pushing for a quarter of a second: a tap is a hop, a hold clears a wall.
    if (this.boost > 0) { if (inp.trick && this.vy > 0) { this.vy += 15.5 * S.jump * dt; this.boost -= dt; } else this.boost = 0; }

    const ox = this.pos.x, oz = this.pos.z;
    // On a slope, speed is shared between along and up: a steep lip sends you
    // skyward, not forward.
    const sp = Math.hypot(this.vel.x, this.vel.z), sp0 = sp;
    let cs = 1, rise = 0, slope = 0;
    const on = this.on;
    if (!this.air && on && on.axis && sp > 0.05) {
      // The slope of the piece under the wheels, measured along the way we are going.
      // Measured backwards when the next step would be off its end, so an edge is not mistaken for a cliff.
      const e = 0.05, ux = this.vel.x / sp, uz = this.vel.z / sp, px = this.pos.x, pz = this.pos.z;
      const inside = (x, z) => x >= on.x0 && x <= on.x1 && z >= on.z0 && z <= on.z1;
      let tan = 0;
      if (inside(px + ux * e, pz + uz * e)) tan = (heightOf(on, px + ux * e, pz + uz * e) - heightOf(on, px, pz)) / e;
      else if (inside(px - ux * e, pz - uz * e)) tan = (heightOf(on, px, pz) - heightOf(on, px - ux * e, pz - uz * e)) / e;
      tan = Math.max(-5, Math.min(5, tan));
      cs = 1 / Math.sqrt(1 + tan * tan);
      rise = sp * cs * tan;          // how fast the slope is lifting us
      slope = tan;
      // Remember being on the steep top of a skate ramp: a slow frame can step the car over the lip
      // onto the ledge before it knows it has left, and it should still fly as if off the ramp.
      if (on.curve && tan > 1.1) { this.lipRide = on; this.lipAt = this.clock; this.lipVy = rise; }
      // Rolling down a skate ramp, the ramp does some of the work: that is how you pump a half-pipe.
      if (on.curve && tan < 0) { const k = (sp + GRAVITY * 0.75 * -tan * cs * dt) / sp; this.vel.x *= k; this.vel.z *= k; }
    }
    // On a hill the ground pulls you down the slope, moving or not, whichever way you are pointing:
    // that is what makes it a hill. Let go of the stick on the side of one and you roll.
    if (!this.air && on && on.hill) {
      const q = 0.3, px = this.pos.x, pz = this.pos.z, gx = (heightOf(on, px + q, pz) - heightOf(on, px - q, pz)) / (2 * q), gz = (heightOf(on, px, pz + q) - heightOf(on, px, pz - q)) / (2 * q);
      this.vel.x -= GRAVITY * 0.6 * gx * dt; this.vel.z -= GRAVITY * 0.6 * gz * dt;
    }
    // A wall is a wall at any frame rate: the frame's move is made in steps no longer than the car's own radius, each one kept out
    // of the walls and the furniture before the next. (One long step could carry the car more than half way through a wall or
    // clean past a rail, and it was then put down on the far side: confine() takes the nearest place it may be.) At sixty frames
    // a second, flat out, the whole move is under a radius: one step, exactly as it always was.
    const nsub = Math.max(1, Math.ceil(sp * cs * dt / this.radius)), hdt = dt / nsub;
    for (let sub = 0; sub < nsub; sub++) {
    const ox = this.pos.x, oz = this.pos.z, sp = sub ? Math.hypot(this.vel.x, this.vel.z) : sp0;      // (this step's own start, and the speed it starts with)
    this.pos.x += this.vel.x * cs * hdt; this.pos.z += this.vel.z * cs * hdt;

    // The stunt kit, side on: plywood does not move.
    if (sp > 0.01) {
      // Climbing, the car will be higher by the time it gets there: what stands at the top of a ramp is not a wall in front of it.
      const ax = this.vel.x / sp * 0.17, az = this.vel.z / sp * 0.17, y = this.pos.y + (this.air ? 0 : Math.max(0, slope) * 0.2), P = this.plan, air = this.air;
      // The way ahead is walked in short steps, taking the height along. Looked at only where the car
      // will end up, the far end of a long step up a ramp stands taller than a wheel can climb, and at
      // speed on a slow frame the ramp was taken for a wall.
      const blocked = (x0, z0, x1, z1) => {
        const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, z1 - z0) / 0.08));
        let yy = y;
        for (let i = 1; i <= n; i++) {
          const px = x0 + (x1 - x0) * i / n, pz = z0 + (z1 - z0) * i / n;
          if (wallAt(P, px, pz, yy, STEP, on)) return true;
          if (!air) { const gh = groundAt(P, px, pz, yy, STEP, on); if (gh > yy) yy = gh; }
        }
        return false;
      };
      const nx = this.pos.x, nz = this.pos.z;
      if (blocked(ox, oz, nx + ax, nz + az)) {
        if (!blocked(ox, oz, ox + ax, nz + az)) { this.pos.x = ox; this.bump = Math.max(this.bump, Math.abs(this.vel.x)); this.vel.x *= -0.25; }
        else if (!blocked(ox, oz, nx + ax, oz + az)) { this.pos.z = oz; this.bump = Math.max(this.bump, Math.abs(this.vel.z)); this.vel.z *= -0.25; }
        else { this.pos.x = ox; this.pos.z = oz; this.bump = Math.max(this.bump, sp); this.vel.x *= -0.25; this.vel.z *= -0.25; }
      }
    }

    const push = this._push;
    if (confine(this.plan, this.pos, this.radius, false, push)) {
      const l = Math.hypot(push.x, push.z);
      if (l > 1e-6) {
        const nx = push.x / l, nz = push.z / l;
        const into = this.vel.x * nx + this.vel.z * nz;
        if (into < 0) {
          this.vel.x -= nx * into * 1.35; this.vel.z -= nz * into * 1.35;   // a little bounce
          this.vel.multiplyScalar(0.82);
          this.bump = Math.max(this.bump, -into);
        }
      }
    }
    // A long body: its nose and its tail kept out of the walls too, each a circle of its own, and the car moved with them.
    if (this.probes) for (const [o, r] of this.probes) {
      const fx2 = Math.sin(this.yaw), fz2 = Math.cos(this.yaw), q = this._pq || (this._pq = { x: 0, y: 0, z: 0 }), pp = this._pp || (this._pp = { x: 0, y: 0, z: 0 });
      q.x = this.pos.x + fx2 * o; q.y = this.pos.y; q.z = this.pos.z + fz2 * o;
      const ox = q.x, oz = q.z;
      if (confine(this.plan, q, r, false, pp)) {
        const mx = q.x - ox, mz = q.z - oz, l = Math.hypot(mx, mz);
        this.pos.x += mx; this.pos.z += mz;
        if (l > 1e-6) { const into = (this.vel.x * mx + this.vel.z * mz) / l; if (into < 0) { this.vel.x -= mx / l * into * 1.2; this.vel.z -= mz / l * into * 1.2; this.bump = Math.max(this.bump, -into); } }
      }
    }
    }      // (the end of a step of the move)

    // Up and down. Follow the ground while it is there; when it falls away
    // faster than gravity would take you, you are flying.
    // The ground under the wheels now. On the floor, the height is carried up along the way just driven,
    // so that a long step onto a ramp ends on the ramp and not inside it.
    let reach = this.pos.y;
    if (!this.air) {
      const n = Math.max(1, Math.ceil(Math.hypot(this.pos.x - ox, this.pos.z - oz) / 0.08));
      for (let i = 1; i < n; i++) { const gh = groundAt(this.plan, ox + (this.pos.x - ox) * i / n, oz + (this.pos.z - oz) * i / n, reach, STEP, this.on); if (gh > reach) reach = gh; }
    }
    const g = groundAt(this.plan, this.pos.x, this.pos.z, reach, STEP, this.on);
    const beneath = this.plan.under;
    const yb = this.pos.y + this.vy * dt - 0.5 * GRAVITY * dt * dt;
    // On a hill the test is how hard the ground is falling away, not how far: the car leaves it when the round of the hill
    // drops faster than the car can fall (by a clear margin, 4 m/s2), and that is the same test at any frame rate.
    // A fixed distance let it hop at thirty frames a second and never leave the ground at sixty.
    const onHill = !this.air && on && on.hill && beneath && beneath.hill;
    // A lift going down takes the car with it: the floor is not falling away, it is being lowered.
    // (To the very end: as the lift comes level with the floor at the foot of its shaft it is that floor which is found under
    // the wheels, not the lift, and the car was dropped the last step of the way: a hop and a nod at every arrival.)
    const lowered = !this.air && ((beneath && beneath.lift) || (on && on.lift && on.lift.vy < 0)) && yb - g < 0.25;
    // A plain slope of the street (the ramps beside the front steps, the side streets climbing from the avenue) is driven
    // down with the wheels on it: the ground only ever drops a few centimetres a frame there. Without this the car left the
    // slope every frame and fell back onto it, which felt like going down the stairs. (A stair tread drops 15 cm at once: that still bumps.)
    const ST = this.plan.street, hug = !this.air && !beneath && ST && this.pos.x < ST.x + ST.reach && this.vy <= 0.01 && this.pos.y - g > 0 && this.pos.y - g < 0.12;
    if (!lowered && !hug && (onHill ? yb - g > 2 * dt * dt + 0.0002 : yb > g + 0.004)) {
      if (!this.air) {
        this.air = true; this.airT = 0; this._from.x = this.pos.x; this._from.z = this.pos.z;
        this.vert = null;
        const ramp = on && on.curve && slope > 1.1 ? on : (this.lipRide && this.clock - this.lipAt < 0.16 ? this.lipRide : null);
        if (ramp && this.vy < 2 && this.lipVy > 2 && ramp !== on) this.vy = this.lipVy;
        if (ramp && this.vy > 2) {
          const on = ramp;
          // Off the lip of a skate ramp. The speed has all gone upwards, so the car hangs over
          // the lip in an arc and comes down: back onto the ramp it left, turned round to roll
          // down it, or, off a spine, over the top and onto the ramp on the other side.
          const up = on.h1 > on.h0 ? 1 : -1, ux = on.axis === 'x' ? up : 0, uz = on.axis === 'z' ? up : 0;
          const T = 2 * this.vy / GRAVITY + 0.14, carry = (on.spine ? 0.95 : -0.85) / T;
          const side = this.vel.x * uz - this.vel.z * ux;                    // keep a little of any sideways drift
          this.vel.x = ux * carry + uz * side * 0.3; this.vel.z = uz * carry - ux * side * 0.3;
          this.vert = { T, t: 0, turn: on.spine ? 0 : (this.steer < 0 ? Math.PI : -Math.PI), tilt0: this.tilt, spine: !!on.spine };
        } else { this.vel.x *= cs; this.vel.z *= cs; }                       // what went into height is no longer going forwards
        this.on = null;
        // Fly the arc ahead of time to see how long it really lasts (a table may be in the way).
        let t = 0, px = this.pos.x, pz = this.pos.z, py = yb, pv = this.vy;
        while (t < 2.5) {
          t += 0.03; px += this.vel.x * 0.03; pz += this.vel.z * 0.03; pv -= GRAVITY * 0.03; py += pv * 0.03;
          if (py <= groundAt(this.plan, px, pz, py + 0.1)) break;
        }
        if (t > 0.3 && sp > 2.5) this.launched = t;
        this.fromHop = this.hopped; this.hopped = false; this.flip = this.spin = 0;
      }
      const wasY = this.pos.y;
      this.pos.y = yb; this.vy -= GRAVITY * dt; this.airT += dt;
      if (this.vert && this.vert.t < this.vert.T) { const v = this.vert, step = Math.min(dt, v.T - v.t); v.t += step; this.yaw += v.turn * step / v.T; }
      // Ceilings are real. (Only one the car was under: falling down a stair into the room below, that room's ceiling is
      // under the car, not over it, and snapping to it put the car inside the stair, stuck for good.)
      const roof = ceilingAt(this.plan, this.pos.x, this.pos.z, this.pos.y) - 0.3;
      if (this.pos.y > roof && wasY <= roof + 0.05) { this.pos.y = roof; if (this.vy > 0) { this.bump = Math.max(this.bump, this.vy); this.vy *= -0.2; } }
    } else {
      if (this.air) {
        this.air = false;
        const impact = Math.max(0, -this.vy);
        const ffx = Math.sin(this.yaw), ffz = Math.cos(this.yaw), L = beneath && beneath.axis && !beneath.hill ? beneath : null;
        // The slope where the wheels came down, along the way the car is pointing and along the ramp.
        let fwdTan = 0, axTan = 0;
        if (L) {
          const e = 0.04, here = heightOf(L, this.pos.x, this.pos.z), cl = (v, a, b) => Math.max(a, Math.min(b, v));
          fwdTan = (heightOf(L, cl(this.pos.x + ffx * e, L.x0, L.x1), cl(this.pos.z + ffz * e, L.z0, L.z1)) - heightOf(L, cl(this.pos.x - ffx * e, L.x0, L.x1), cl(this.pos.z - ffz * e, L.z0, L.z1))) / (2 * e);
          axTan = L.axis === 'x' ? (heightOf(L, cl(this.pos.x + e, L.x0, L.x1), this.pos.z) - heightOf(L, cl(this.pos.x - e, L.x0, L.x1), this.pos.z)) / (2 * e)
            : (heightOf(L, this.pos.x, cl(this.pos.z + e, L.z0, L.z1)) - heightOf(L, this.pos.x, cl(this.pos.z - e, L.z0, L.z1))) / (2 * e);
          void here;
        }
        // Wheels down, or not? Judged against the slope: nose-down on a steep ramp is right, not a crash.
        const level = -Math.atan(fwdTan);
        let off = this.tilt - level; off = Math.atan2(Math.sin(off), Math.cos(off));
        const crash = Math.abs(off) > 1.05;
        // Coming down onto a slope, the fall turns into speed down it.
        if (L && !crash && Math.abs(axTan) > 0.08) {
          const th = Math.atan(Math.abs(axTan)), d = axTan > 0 ? -1 : 1, along = L.axis === 'x' ? this.vel.x : this.vel.z;
          const run = along * d * Math.cos(th) + impact * Math.sin(th);
          if (run > Math.abs(along)) { if (L.axis === 'x') this.vel.x = d * run; else this.vel.z = d * run; }
        }
        // Coming down on a hill. On the ground the car's speed is counted along the slope, in the air over the flat; leaving
        // the ground turns one into the other, so touching down must turn it back, or every little hop over the round of a
        // hill costs speed and the car judders to a stop. What it has along the slope is its whole motion, fall and all,
        // laid along the slope: so a long drop onto a downhill side comes out as speed down the hill.
        if (beneath && beneath.hill && !crash) {
          const q = 0.3, gx = (heightOf(beneath, this.pos.x + q, this.pos.z) - heightOf(beneath, this.pos.x - q, this.pos.z)) / (2 * q), gz = (heightOf(beneath, this.pos.x, this.pos.z + q) - heightOf(beneath, this.pos.x, this.pos.z - q)) / (2 * q);
          const vh = Math.hypot(this.vel.x, this.vel.z);
          if (vh > 0.05) {
            const tanV = (gx * this.vel.x + gz * this.vel.z) / vh, along = Math.max(0, (vh + this.vy * tanV) / Math.sqrt(1 + tanV * tanV)), k = along / vh;
            this.vel.x *= k; this.vel.z *= k;
          }
        }
        const vs = Math.hypot(this.vel.x, this.vel.z), facing = vs > 0.8 ? Math.abs(this.vel.x * ffx + this.vel.z * ffz) / vs : 1;
        const flips = crash ? 0 : Math.round(this.flip / (Math.PI * 2)), spins = crash ? 0 : Math.round(Math.abs(this.spin) / Math.PI);
        // Perfect: a trick thrown, and the car brought round to land square, wheels flat to the surface, pointing the way it is going.
        const perfect = !crash && (flips !== 0 || spins > 0) && Math.abs(off) < 0.4 && facing > 0.92;
        if (this.airT > 0.22) {
          this.landed = { air: this.airT, dist: Math.hypot(this.pos.x - this._from.x, this.pos.z - this._from.z), impact, crash, flips, spins, hop: this.fromHop, perfect, vert: !!this.vert };
          this.squash = Math.min(1, impact / 5);
        }
        this.tilt = crash ? off : level + off;
        if (crash) { this.vel.multiplyScalar(0.4); this.squash = 1; }
        else if (perfect) this.vel.multiplyScalar(1.12);                    // and a perfect landing carries its speed
        this.vert = null;
        // Carry straight on down the slope landed on, rather than skipping off it.
        this.vy = 0;
        if (beneath && beneath.hill) {
          const q = 0.3;
          this.vy = (heightOf(beneath, this.pos.x + q, this.pos.z) - heightOf(beneath, this.pos.x - q, this.pos.z)) / (2 * q) * this.vel.x + (heightOf(beneath, this.pos.x, this.pos.z + q) - heightOf(beneath, this.pos.x, this.pos.z - q)) / (2 * q) * this.vel.z;
        }
        if (L && !crash && vs > 0.5) {
          const tv = axTan * (L.axis === 'x' ? this.vel.x : this.vel.z) / vs;
          this.vy = vs * tv / Math.sqrt(1 + tv * tv);
        }
      } else if (dt > 0) {
        this.vy = rise;            // the slope under the wheels; a kerb or a lip is not a slope
      }
      this.pos.y = g;
      // Hanging track has a lip down each side, so you leave it on purpose or not at all.
      const u = this.on = beneath;
      if (u && u.lip && !this.air) {
        if (u.run === 'z') { const c = Math.max(u.x0 + 0.17, Math.min(u.x1 - 0.17, this.pos.x)); if (c !== this.pos.x) { this.pos.x = c; this.vel.x = 0; } }
        else { const c = Math.max(u.z0 + 0.17, Math.min(u.z1 - 0.17, this.pos.z)); if (c !== this.pos.z) { this.pos.z = c; this.vel.z = 0; } }
      }
    }
    this.speed = vf;

    // Onto the loop? Squarely, and with enough behind you to be worth trying.
    // It can be taken from either end: in by one lane and out by the other.
    // A loop runs along x on the ground unless it says otherwise: `axis: 'z'` runs it along z, and `y` stands it on a
    // deck at that height (the one on the Nichols Bridgeway, bridgeplay.js).
    if (!this.air) for (const L of this.plan.loops) {
      if (Math.abs(this.pos.y - (L.y || 0)) >= 0.05) continue;
      const zx = L.axis === 'z', u0 = zx ? oz : ox, u1 = zx ? this.pos.z : this.pos.x, U = zx ? L.z : L.x, f = zx ? fz : fx;
      for (const way of [1, -1]) {
        const lane = (zx ? L.x : L.z) + (way === L.dir ? 0 : L.shift);
        if ((u0 - U) * way < 0 && (u1 - U) * way >= 0 && Math.abs((zx ? this.pos.x : this.pos.z) - lane) < 0.36 && f * way > 0.88 && vf > 4) {
          this.rail = { L, th: 0, v: vf, top: false, way, rev: way !== L.dir };
          this.yaw = zx ? (way > 0 ? 0 : Math.PI) : (way > 0 ? Math.PI / 2 : -Math.PI / 2);
        }
      }
    }

    // Attitude: nose along the slope, or along the arc in the air.
    let want = this.air ? -Math.atan2(this.vy, Math.max(3, sp)) * 0.75 : -Math.atan2(this.vy, Math.max(0.6, Math.abs(vf))) * Math.sign(vf || 1);
    // On the ground, the slope is read off the ground itself under the wheels, front to back and side to side: parked
    // on a ramp (no climb to measure) the car still sits along it, and across a slope it leans with it instead of
    // half sinking in. A step or an edge under one wheel (more than 20 cm off) is not a slope and is ignored.
    let lean = 0;
    if (!this.air && !this.rail) {
      const fx = Math.sin(this.yaw), fz = Math.cos(this.yaw), Lw = 0.2, Ww = 0.14, x = this.pos.x, z = this.pos.z, y0 = this.pos.y;
      const h = (dx, dz) => { const g = groundAt(this.plan, x + dx, z + dz, y0 + 0.25, STEP, this.on); return Math.abs(g - y0) < 0.2 ? g : y0; };
      const hf = h(fx * Lw, fz * Lw), hb = h(-fx * Lw, -fz * Lw), hl = h(fz * Ww, -fx * Ww), hr = h(-fz * Ww, fx * Ww);
      want = -Math.atan2(hf - hb, 2 * Lw);
      lean = Math.max(-0.5, Math.min(0.5, Math.atan2(hl - hr, 2 * Ww)));
    }
    if (this.air && this.vert) { const k = Math.min(1, this.vert.t / this.vert.T), e = k * k * (3 - 2 * k); want = this.vert.tilt0 + ((this.vert.spine ? 0.48 : 0.9) - this.vert.tilt0) * e; }       // nose down, to suit the slope it will meet
    let d = want - this.tilt; d = Math.atan2(Math.sin(d), Math.cos(d));
    if (!(this.air && inp.trick && Math.abs(th) > 0.2)) this.tilt += d * Math.min(1, dt * (this.air ? (this.vert ? 10 : 5) : 16));
    const latAcc = rate * vf;
    this.roll += (Math.max(-0.16, Math.min(0.16, latAcc * 0.012)) - this.roll) * Math.min(1, dt * 8);
    this.lean = (this.lean || 0) + (lean - (this.lean || 0)) * Math.min(1, dt * 14);      // the whole car, wheels and all, leans with the ground
    this.pitch += (Math.max(-0.07, Math.min(0.07, -th * 0.05)) - this.pitch) * Math.min(1, dt * 6);
    this.squash = this.calm ? 0 : Math.max(0, this.squash - dt * 5);
    const under = this.plan.obstacles.some(o => o.bench && this.pos.y < o.y0 && this.pos.y > o.y0 - 0.6 && this.pos.x > o.x0 - 0.1 && this.pos.x < o.x1 + 0.1 && this.pos.z > o.z0 - 0.1 && this.pos.z < o.z1 + 0.1);
    const tx = -latAcc * 0.02 + this.bump * 0.2, tz = -th * 0.22 - (under ? 1.25 : 0) + vf * 0.02 + this.squash * 0.9 + (this.air ? 0.25 : 0);
    this.aerialV.x += ((tx - this.aerialP.x) * 90 - this.aerialV.x * 5) * dt;
    this.aerialV.y += ((tz - this.aerialP.y) * 90 - this.aerialV.y * 5) * dt;
    this.aerialP.addScaledVector(this.aerialV, dt);
    this.under = under;
    this._tow(dt);
    this.sync(dt);
  }

  // On the loop the car runs on a rail: one number, how far round it is.
  // Speed is traded for height honestly, so too slow and it drops off the top.
  _loop(dt, inp) {
    const GRAVITY = this.gravity;
    const s = this.rail, L = s.L, r = L.r;
    this.throttle = inp.throttle; this.steer = 0;
    s.v += (-GRAVITY * Math.sin(s.th) + Math.max(0, inp.throttle) * 6.5 - s.v * 0.12) * dt;
    s.th += (s.v / r) * dt;
    const c = Math.cos(s.th);
    if (s.th > Math.PI * 0.5 && s.th < Math.PI * 1.5) s.top = true;
    const fell = s.v < 0.4 || (c < 0 && s.v * s.v < -GRAVITY * r * c * 0.7);
    const turn = Math.min(1, s.th / (Math.PI * 2)), zx = L.axis === 'z', y0 = L.y || 0, along = s.way * r * Math.sin(s.th), side = L.shift * (s.rev ? 1 - turn : turn);
    if (zx) this.pos.set(L.x + side, y0 + r - r * c, L.z + along); else this.pos.set(L.x + along, y0 + r - r * c, L.z + side);
    this.speed = s.v;
    this.airT = 0;
    if (fell) {
      // Not enough speed: let go of the track and fall like a dropped toy.
      if (zx) this.vel.set(0, 0, s.way * s.v * c); else this.vel.set(s.way * s.v * c, 0, 0);
      this.vy = s.v * Math.sin(s.th);
      this.tilt = -s.th; this.rail = null; this.air = true; this._from.x = this.pos.x; this._from.z = this.pos.z;
      this.flip = this.spin = 0; this.fromHop = false; this.on = null;
      this.fellOff = true;
    } else if (s.th >= Math.PI * 2) {
      if (zx) { this.pos.set(L.x + (s.rev ? 0 : L.shift), y0, L.z + s.way * 0.02); this.vel.set(0, 0, s.way * s.v); }
      else { this.pos.set(L.x + s.way * 0.02, y0, L.z + (s.rev ? 0 : L.shift)); this.vel.set(s.way * s.v, 0, 0); }
      this.vy = 0; this.tilt = 0; this.rail = null;
      this.looped = true;
    } else this.tilt = -s.th;
    this.roll = 0; this.pitch = 0; this.lean = 0;
    this.sync(dt);
  }

  sync(dt) {
    this.group.position.copy(this.pos);
    this.group.position.y -= this.squash * 0.018;
    // Out of doors the paving, the grit and the snow on the lawns are drawn a few millimetres over the line the ground is
    // reckoned on (4 to 8 mm: laid over the slab under them, so that the two do not fight), and the tread of the tyres
    // was lost in them: the car looked a little sunk into the ground. It is drawn that much higher there (_proud). Floors
    // indoors, and track and decks anywhere, are drawn where they are reckoned.
    const seat = (this.on ? this.on.hill && !this.on.land : this.out) ? 0.007 : 0;      // (a hill's snow is laid over it too; the land's own is not)
    this.seat = dt > 0 ? (this.seat || 0) + (seat - (this.seat || 0)) * Math.min(1, dt * 12) : seat;
    this.group.position.y += this.seat;
    this.group.rotation.y = this.yaw;
    this.group.rotation.x = this.tilt;
    this.group.rotation.z = this.lean || 0;
    this.body.rotation.z = this.roll;
    this.body.rotation.x = this.pitch;
    if (this.chassis) { this.chassis.rotation.z = -this.roll * 0.7; this.chassis.rotation.x = -this.pitch * 0.7; }      // the shell rolls on its springs; the chassis, much less
    this.aerial.rotation.z = this.aerialP.x;
    this.aerial.rotation.x = this.aerialP.y;
    const free = this.air ? this.throttle * 60 : 0;       // wheels race in the air
    for (const w of this.wheels) {
      w.spin.rotation.x += (this.speed / w.r + free) * dt;
      if (w.front) w.pivot.rotation.y = -this.steer * 0.45;
    }
    // The shadow stays on whatever is underneath.
    const g = groundAt(this.plan, this.pos.x, this.pos.z, this.pos.y + 0.05), h = Math.max(0, this.pos.y - g);
    if (this.shadow.visible) layShadow(this.shadow, this.plan, this.pos.x, this.pos.z, g, this.yaw, h, dt, 0.3, 2.6, 0.12);
    this._drawTrailer(dt);
  }

  get height() { return 0.12; }
}

// ----------------------------------------------------------------- drone ---

export function buildDrone(colour = 0xe9e6df) {
  const g = new THREE.Group();
  const body = new THREE.Group();
  g.add(body);
  const shell = std(colour, { roughness: 0.35, emissive: colour, emissiveIntensity: 0.1 }); shell.name = 'paint';
  const dark = std(0x121316, { roughness: 0.6 });
  part(new THREE.BoxGeometry(0.1, 0.04, 0.16), shell, 0, 0, 0, body);
  part(new THREE.BoxGeometry(0.07, 0.02, 0.1), dark, 0, 0.03, -0.01, body);
  part(new THREE.SphereGeometry(0.022, 10, 8), std(0x05070a, { roughness: 0.1, metalness: 0.8 }), 0, -0.012, 0.088, body);
  const props = [];
  for (const [sx, sz] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) {
    const arm = part(new THREE.BoxGeometry(0.19, 0.012, 0.02), dark, sx * 0.075, 0, sz * 0.085, body);
    arm.rotation.y = -sx * sz * 0.83;
    part(new THREE.CylinderGeometry(0.014, 0.016, 0.03, 10), dark, sx * 0.14, 0.012, sz * 0.15, body);
    const disc = part(new THREE.CylinderGeometry(0.085, 0.085, 0.002, 20), new THREE.MeshBasicMaterial({ color: 0x9aa4b0, transparent: true, opacity: 0.16, depthWrite: false }), sx * 0.14, 0.032, sz * 0.15, body);
    const blade = part(new THREE.BoxGeometry(0.165, 0.003, 0.014), dark, sx * 0.14, 0.031, sz * 0.15, body);
    props.push({ disc, blade, dir: sx * sz });
    part(new THREE.SphereGeometry(0.008, 6, 5), sz > 0 ? glow(3, 3, 3) : glow(3, 0.15, 0.1), sx * 0.14, -0.012, sz * 0.15, body);
    part(new THREE.BoxGeometry(0.006, 0.05, 0.006), dark, sx * 0.05, -0.04, sz * 0.06, body);     // legs
  }
  const lamp = new THREE.SpotLight(0xe8f0ff, 7, 24, 0.6, 0.8, 1.5);
  lamp.position.set(0, 0, 0.1);
  lamp.target.position.set(0, -0.5, 4);
  g.add(lamp, lamp.target);
  const shadow = blobShadow(0.6, 0.62, 0.55);
  return { group: g, body, props, lamp, shadow, radius: 0.24, kind: 'drone' };
}

export class Drone {
  constructor(plan, colour) {
    this.plan = plan;
    Object.assign(this, buildDrone(colour));
    this.pos = new THREE.Vector3(0, 1, 0);
    this.vel = new THREE.Vector3();
    this.yaw = 0; this.roll = 0; this.pitch = 0;
    this.speed = 0; this.bump = 0; this.thrust = 0; this.spin = 0;
    this._push = { x: 0, y: 0, z: 0 };
    this.spec = { ...DRONE_SPEC };
  }

  // Another airframe on the same toy (see garage.js).
  reskin(model, spec = {}) {
    this.group.remove(this.body);
    fitShadow(this.shadow, model);
    this.body = model.body; this.props = model.props;
    this.anim = model.anim || null;                   // a body that moves by itself (a saucer's lights) says how
    this.group.add(this.body);
    this.spec = { ...DRONE_SPEC, ...spec };
    this.sync(0);
  }

  place(x, z, yaw, y = 1.2) { this.pos.set(x, y, z); this.vel.set(0, 0, 0); this.yaw = yaw; this.sync(0); }

  update(dt, inp) {
    const fx = Math.sin(this.yaw), fz = Math.cos(this.yaw);
    const rx = -fz, rz = fx;
    const S = this.spec, A = 22 * S.accel;
    this.vel.x += (fx * inp.pitch + rx * inp.roll) * A * dt;
    this.vel.z += (fz * inp.pitch + rz * inp.roll) * A * dt;
    const drag = Math.exp(-1.7 * (S.drag || 1) * dt);
    this.vel.x *= drag; this.vel.z *= drag;
    this.vel.y += (inp.climb * 5.2 * S.climb - this.vel.y) * Math.min(1, dt * 5 * (S.drag || 1));
    this.yaw -= inp.yaw * 2.5 * S.yaw * dt;
    const ox = this.pos.x, oy = this.pos.y, oz = this.pos.z;
    this.bump = 0;
    // The frame's move, in steps no longer than the drone's own radius (see Car.update: a wall is a wall at any frame rate).
    // Flat out on W at sixty frames a second it is one step, exactly as it always was.
    const nsub = Math.max(1, Math.ceil(this.vel.length() * dt / this.radius)), hdt = dt / nsub;
    let floor = 0;
    for (let sub = 0; sub < nsub; sub++) {
    const sx = this.pos.x, sy = this.pos.y, sz = this.pos.z;      // (this step's own start)
    this.pos.addScaledVector(this.vel, hdt);

    // Plywood and stone stop a drone side-on too; table tops and ramps are somewhere to land.
    if (wallAt(this.plan, this.pos.x, this.pos.z, this.pos.y - 0.07, 0.06)) {
      if (!wallAt(this.plan, sx, this.pos.z, this.pos.y - 0.07, 0.06)) { this.pos.x = sx; this.vel.x *= -0.3; }
      else if (!wallAt(this.plan, this.pos.x, sz, this.pos.y - 0.07, 0.06)) { this.pos.z = sz; this.vel.z *= -0.3; }
      else { this.pos.x = sx; this.pos.z = sz; this.vel.x *= -0.3; this.vel.z *= -0.3; }
    }
    // Whatever it was above before this step it is still above. (Coming down fast, a quick airframe or a slow frame moves
    // it further in one step than a deck or a plank is thick: it must land on it, not pass into it and be found under it.)
    floor = groundAt(this.plan, this.pos.x, this.pos.z, Math.max(this.pos.y, sy), 0.02) + 0.07;
    if (this.pos.y < floor) { this.pos.y = floor; if (this.vel.y < 0) this.vel.y = 0; }
    // And a balcony, a bridge or a stair overhead is as solid from below as from above: from below. Something it is
    // already in (a lift car that has come up round it) does not push it down through itself; climbing takes it out on top.
    const head = headAt(this.plan, this.pos.x, this.pos.z, Math.min(this.pos.y, sy)) - 0.2;
    if (this.pos.y > head && head > floor + 0.1 && sy <= head + 0.12 && !(this._free > 0)) { this.pos.y = head; if (this.vel.y > 0) { this.bump = this.vel.y; this.vel.y = 0; } }
    const push = this._push;
    if (confine(this.plan, this.pos, this.radius, true, push)) {
      const l = Math.hypot(push.x, push.y, push.z);
      if (l > 1e-6) {
        const nx = push.x / l, ny = push.y / l, nz = push.z / l;
        const into = this.vel.x * nx + this.vel.y * ny + this.vel.z * nz;
        if (into < 0) {
          this.vel.x -= nx * into * 1.4; this.vel.y -= ny * into * 1.4; this.vel.z -= nz * into * 1.4;
          this.bump = -into;
        }
      }
    }
    }      // (the end of a step of the move)
    this.floor = floor;
    // Never trapped. Holding still with climb held and yet carried down, frame after frame, by something overhead (still
    // air under a fixed slab does not do that; flying along under a sloping plank does, and is left alone): for a moment
    // nothing overhead holds it, and it goes up through.
    if (this._free > 0) this._free -= dt;
    if (inp.climb > 0.3 && this.pos.y < oy - 1e-4 && Math.hypot(this.pos.x - ox, this.pos.z - oz) < 0.6 * dt) { this._sunk = (this._sunk || 0) + dt; if (this._sunk > 0.6) { this._free = 1.2; this._sunk = 0; } }
    else this._sunk = 0;
    this.speed = this.vel.x * fx + this.vel.z * fz;
    this.thrust = Math.min(1, 0.45 + Math.abs(inp.pitch) * 0.25 + Math.abs(inp.roll) * 0.2 + Math.max(0, inp.climb) * 0.4 - Math.max(0, -inp.climb) * 0.2);
    this.landed = this.pos.y <= floor + 0.001 && inp.climb <= 0;
    this.pitch += (inp.pitch * 0.38 - this.pitch) * Math.min(1, dt * 7);
    this.roll += (inp.roll * 0.38 + inp.yaw * 0.12 - this.roll) * Math.min(1, dt * 7);
    this.sync(dt);
  }

  sync(dt) {
    this.group.position.copy(this.pos);
    this.group.rotation.y = this.yaw;
    this.body.rotation.x = this.pitch;
    this.body.rotation.z = this.roll;
    this.spin += dt * (this.landed ? 12 : 70);
    for (const p of this.props) { p.blade.rotation.y = this.spin * p.dir; p.disc.material.opacity = this.landed ? 0.04 : 0.16; }
    if (this.anim) this.anim(this, dt);
    const g = groundAt(this.plan, this.pos.x, this.pos.z, this.pos.y, 0.02), h = Math.max(0, this.pos.y - g - 0.07);
    if (this.shadow.visible) layShadow(this.shadow, this.plan, this.pos.x, this.pos.z, g, this.yaw, h, dt, 0.4, 5, 0);
  }

  get height() { return 0; }
}
