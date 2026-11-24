// How the stunt kit is made and what it is made of (museum.js lays out which pieces; plan.js is their shape and
// what the car feels; this only draws them, exactly where they are felt).
//
// The kit used to be flat-coloured wedges with a strip of light down each edge. Now a piece is a built thing:
//   * plywood ramps: a sheet of birch ply on top (grain, seams every 1.22 m, screw heads, rubber scuffed down the
//     middle), side panels cut to the profile, a steel angle down each edge, a steel threshold plate at the foot, a
//     round steel coping on the lip of a skate ramp, and at an open high end the frame it stands on: studs, plates,
//     a brace, dark inside. Painted chevrons instead of neon ones. Outdoors the same pieces are weathered grey and
//     carry snow on the flats and along the edges.
//   * the builders' scaffold: tubes with base plates, ledgers under the boards, braces between the standards.
//   * snow features (the humps on the paths, the jump park's kickers, tables, rollers and quarter pipe): cut and
//     groomed snow. Rounded shoulders, sides battered out to a lumpy foot, corduroy on the riding surface, a dyed
//     blue line across a take-off, shovel strata and shade down the sides. The top is the plan's own height to the
//     millimetre; only the outermost 10 cm of an edge is eased over (by 3 cm).
//   * the drained pool: a waterline band, streaks and scale under it, leaves and frost on the bottom, a pale deck
//     with a stone coping, and board-marked concrete outside instead of tile.
//
// One material system: every material here is a MeshStandardMaterial taught a little more (kitLook), reading one
// shared noise texture in world space and one small per-corner attribute (aKit: a number for the piece, indoors or
// out, where across the piece, how far up it), so a hundred ramps are still three or four draw calls and no two look
// stamped from the same sheet.

import * as THREE from 'three';
import { heightOf, roomAt } from './plan.js';
import { rng } from './textures.js';

// ------------------------------------------------------------------ shared --

// Four tiling noises in one texture: r soft blotches, g fine grain, b mid blotches (pulled into streaks by a stretched
// lookup), a speckle. Each is white noise blurred (wrapping round) to its own size: no lattice in it, so a threshold
// cut through it gives round-edged patches, not the square ones a grid of values gives.
let NOISE = null;
export function kitNoise() {
  if (NOISE) return NOISE;
  const S = 256, d = new Uint8Array(S * S * 4), r = rng(4421);
  const blurred = (radii) => {
    let a = new Float32Array(S * S), b = new Float32Array(S * S); for (let i = 0; i < S * S; i++) a[i] = r();
    for (const rad of radii) for (let pass = 0; pass < 2; pass++) {       // a box each way, three times over: near enough a Gaussian
      const w = 2 * rad + 1;
      for (let y = 0; y < S; y++) { let sum = 0; for (let k = -rad; k <= rad; k++) sum += a[y * S + ((k + S) % S)]; for (let x = 0; x < S; x++) { b[x * S + y] = sum / w; sum += a[y * S + ((x + rad + 1) % S)] - a[y * S + ((x - rad + S) % S)]; } }      // (written transposed: the next pass runs the other way)
      [a, b] = [b, a];
    }
    let m = 0, v = 0; for (let i = 0; i < S * S; i++) m += a[i]; m /= S * S; for (let i = 0; i < S * S; i++) v += (a[i] - m) ** 2; v = Math.sqrt(v / (S * S)) || 1;
    for (let i = 0; i < S * S; i++) a[i] = 0.5 + (a[i] - m) / v * 0.22;      // spread to fill 0..1 (about two deviations either side)
    return a;
  };
  const A1 = blurred([9, 9, 9]), A2 = blurred([3, 3, 3]), B = blurred([1, 1]), C = blurred([4, 4, 4]), D = blurred([2, 1, 1]);
  const st = v => Math.max(0, Math.min(255, Math.round(v * 255)));
  for (let i = 0; i < S * S; i++) { d[i * 4] = st(0.5 + (A1[i] - 0.5) * 0.75 + (A2[i] - 0.5) * 0.35); d[i * 4 + 1] = st(B[i]); d[i * 4 + 2] = st(C[i]); d[i * 4 + 3] = st(D[i]); }
  const t = new THREE.DataTexture(d, S, S, THREE.RGBAFormat); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter; t.generateMipmaps = true; t.colorSpace = THREE.NoColorSpace; t.needsUpdate = true;
  return (NOISE = t);
}

// Which way the moon is (as look.js works it out for the snow).
export function moonDir(museum) {
  const v = museum && museum.moonAt ? museum.moonAt.clone().sub(new THREE.Vector3(200, 0, 100)) : new THREE.Vector3(0.83, 0.3, -0.33);
  return v.normalize();
}

const canvasTex = (w, h, draw, o = {}) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = o.data ? THREE.NoColorSpace : THREE.SRGBColorSpace; t.anisotropy = 8; return t; };

// A sheet of birch-faced plywood, 1.22 m by 2.44 m (u across, v along): the face grain running the long way, a few
// football patches, the dark line of the joint round it, and its screws: down both long edges and across at every rib.
let PLY = null;
export function plySheet() {
  if (PLY) return PLY;
  return (PLY = canvasTex(512, 1024, (g, W, H) => {
    const r = rng(1877);
    g.fillStyle = '#dcc092'; g.fillRect(0, 0, W, H);
    // broad bands of the veneer, then the grain: long wavering lines, and cathedrals where the log was cut through a ring
    for (let k = 0; k < 9; k++) { g.fillStyle = `rgba(${r() > 0.5 ? '120,84,40' : '246,226,180'},${0.05 + r() * 0.08})`; const x = r() * W, w = 30 + r() * 110; g.fillRect(x, 0, w, H); g.fillRect(x - W, 0, w, H); }
    for (let k = 0; k < 420; k++) {
      g.strokeStyle = r() > 0.55 ? `rgba(120,84,44,${0.05 + r() * 0.1})` : `rgba(250,232,190,${0.06 + r() * 0.12})`; g.lineWidth = 0.5 + r() * 1.5;
      const x = r() * W, a = 2 + r() * 7, f = 0.004 + r() * 0.01, p = r() * 9; g.beginPath(); g.moveTo(x, 0);
      for (let y = 0; y <= H; y += 32) g.lineTo(x + Math.sin(y * f + p) * a, y);
      g.stroke();
    }
    for (let k = 0; k < 7; k++) {
      const x = r() * W, y = r() * H, n = 5 + Math.floor(r() * 5);
      for (let i = 1; i <= n; i++) { g.strokeStyle = `rgba(112,72,30,${0.1 + r() * 0.12})`; g.lineWidth = 1 + r(); g.beginPath(); g.ellipse(x, y, i * (4 + r() * 3), i * (26 + r() * 14), 0, 0, 7); g.stroke(); }
    }
    for (let k = 0; k < 4; k++) { const x = r() * W, y = r() * H; g.fillStyle = 'rgba(196,160,108,.9)'; g.strokeStyle = 'rgba(96,64,28,.55)'; g.lineWidth = 1; g.beginPath(); g.ellipse(x, y, 9, 24, 0, 0, 7); g.fill(); g.stroke(); }
    for (let k = 0; k < 5; k++) { g.fillStyle = `rgba(74,46,20,${0.5 + r() * 0.3})`; g.beginPath(); g.ellipse(r() * W, r() * H, 3 + r() * 4, 4 + r() * 6, 0, 0, 7); g.fill(); }
    // the joint: a dark hairline with a soft dirty margin
    const edge = g.createLinearGradient(0, 0, 14, 0); edge.addColorStop(0, 'rgba(50,32,14,.55)'); edge.addColorStop(1, 'rgba(50,32,14,0)');
    g.fillStyle = edge; g.fillRect(0, 0, 14, H); g.save(); g.translate(W, 0); g.scale(-1, 1); g.fillRect(0, 0, 14, H); g.restore();
    const end = g.createLinearGradient(0, 0, 0, 14); end.addColorStop(0, 'rgba(50,32,14,.55)'); end.addColorStop(1, 'rgba(50,32,14,0)');
    g.fillStyle = end; g.fillRect(0, 0, W, 14); g.save(); g.translate(0, H); g.scale(1, -1); g.fillRect(0, 0, W, 14); g.restore();
    g.fillStyle = 'rgba(30,20,10,.85)'; g.fillRect(0, 0, 2, H); g.fillRect(W - 2, 0, 2, H); g.fillRect(0, 0, W, 2); g.fillRect(0, H - 2, W, 2);
    // screws: a countersunk dimple, a dull steel head, the cross in it
    const screw = (x, y) => {
      g.fillStyle = 'rgba(60,40,18,.5)'; g.beginPath(); g.arc(x, y, 5.2, 0, 7); g.fill();
      g.fillStyle = '#8f949a'; g.beginPath(); g.arc(x, y, 3.4, 0, 7); g.fill();
      g.fillStyle = 'rgba(235,240,245,.7)'; g.beginPath(); g.arc(x - 1, y - 1, 1.4, 0, 7); g.fill();
      g.strokeStyle = 'rgba(30,30,34,.9)'; g.lineWidth = 1; g.beginPath(); g.moveTo(x - 2.2, y); g.lineTo(x + 2.2, y); g.moveTo(x, y - 2.2); g.lineTo(x, y + 2.2); g.stroke();
    };
    for (let y = 21; y < H; y += 85.33) for (const x of [12, W - 12]) screw(x, y);
    for (let y = 170.6; y < H - 20; y += 170.67) for (const x of [140, 256, 372]) screw(x, y + (r() - 0.5) * 3);
  }));
}

// Stencilled labels, eight to a sheet: what a museum's workshop puts on what it builds.
let STENCIL = null;
const LABELS = ['AIC PREP SHOP', 'RAMP 07', 'THIS SIDE UP', 'TOYS ONLY', 'NIGHT CREW', 'RAMP 12', 'DO NOT STACK', 'KEEP CLEAR'];
function stencilSheet() {
  if (STENCIL) return STENCIL;
  return (STENCIL = canvasTex(512, 512, (g, W, H) => {
    g.clearRect(0, 0, W, H); g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
    LABELS.forEach((t, i) => {
      g.font = '900 44px "Arial Narrow", "Helvetica Neue", Arial, sans-serif'; g.fillText(t, W / 2, i * 64 + 34, W - 24);
      // the bridges a stencil leaves in its letters, and paint that did not take
      g.globalCompositeOperation = 'destination-out';
      for (let x = 20; x < W; x += 23) g.fillRect(x + (i * 7) % 11, i * 64 + 4, 2.5, 60);
      g.globalCompositeOperation = 'source-over';
    });
  }));
}

// ---------------------------------------------------------------- geometry --

// Quads with a normal at each corner (so a curve of short flats is shaded as one sweep) and the kit attribute.
export class KGeo {
  constructor() { this.p = []; this.n = []; this.uv = []; this.k = []; this.idx = []; }
  // v: four corners in order round the quad; n: one normal or four; uv: four; k: one aKit or four.
  quad(v, n, uv, k) {
    const one = typeof n[0] === 'number', kone = typeof k[0] === 'number', m = one ? n : [n[0][0] + n[1][0] + n[2][0] + n[3][0], n[0][1] + n[1][1] + n[2][1] + n[3][1], n[0][2] + n[1][2] + n[2][2] + n[3][2]];
    const e1 = [v[1][0] - v[0][0], v[1][1] - v[0][1], v[1][2] - v[0][2]], e2 = [v[3][0] - v[0][0], v[3][1] - v[0][1], v[3][2] - v[0][2]];
    const cx = e1[1] * e2[2] - e1[2] * e2[1], cy = e1[2] * e2[0] - e1[0] * e2[2], cz = e1[0] * e2[1] - e1[1] * e2[0];
    const o = cx * m[0] + cy * m[1] + cz * m[2] < 0 ? [0, 3, 2, 1] : [0, 1, 2, 3], i = this.p.length / 3;
    for (const j of o) { this.p.push(v[j][0], v[j][1], v[j][2]); const nn = one ? n : n[j]; this.n.push(nn[0], nn[1], nn[2]); this.uv.push(uv ? uv[j][0] : 0, uv ? uv[j][1] : 0); const kk = kone ? k : k[j]; this.k.push(kk[0], kk[1], kk[2], kk[3]); }
    this.idx.push(i, i + 1, i + 2, i, i + 2, i + 3);
  }
  // A box; uv in metres over `s`, grain along its longest side.
  box(x0, x1, y0, y1, z0, z1, k, s = 1.22) {
    const dx = x1 - x0, dy = y1 - y0, dz = z1 - z0, kf = (yy) => (k.length === 5 ? [k[0], k[1], k[2], yy - k[4]] : k);
    const face = (v, n, a, b) => this.quad(v, n, a >= b ? [[0, 0], [0, a / (2 * s)], [b / s, a / (2 * s)], [b / s, 0]] : [[0, 0], [a / s, 0], [a / s, b / (2 * s)], [0, b / (2 * s)]], v.map(q => kf(q[1])));
    face([[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], [0, 0, 1], dx, dy);
    face([[x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0]], [0, 0, -1], dx, dy);
    face([[x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1]], [1, 0, 0], dz, dy);
    face([[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]], [-1, 0, 0], dz, dy);
    face([[x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0]], [0, 1, 0], dx, dz);
    face([[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]], [0, -1, 0], dx, dz);
  }
  // A round tube from a to b.
  tube(a, b, r, k, sides = 8) {
    const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], l = Math.hypot(d[0], d[1], d[2]) || 1; d[0] /= l; d[1] /= l; d[2] /= l;
    const t = Math.abs(d[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0], e1 = [d[1] * t[2] - d[2] * t[1], d[2] * t[0] - d[0] * t[2], d[0] * t[1] - d[1] * t[0]], l1 = Math.hypot(e1[0], e1[1], e1[2]); e1[0] /= l1; e1[1] /= l1; e1[2] /= l1;
    const e2 = [d[1] * e1[2] - d[2] * e1[1], d[2] * e1[0] - d[0] * e1[2], d[0] * e1[1] - d[1] * e1[0]];
    const ring = j => { const an = j / sides * Math.PI * 2, c = Math.cos(an), s = Math.sin(an); return [e1[0] * c + e2[0] * s, e1[1] * c + e2[1] * s, e1[2] * c + e2[2] * s]; };
    for (let j = 0; j < sides; j++) {
      const n0 = ring(j), n1 = ring(j + 1), at = (p, n) => [p[0] + n[0] * r, p[1] + n[1] * r, p[2] + n[2] * r], kk = y => (k.length === 5 ? [k[0], k[1], k[2], y - k[4]] : k);
      const v = [at(a, n0), at(a, n1), at(b, n1), at(b, n0)];
      this.quad(v, [n0, n1, n1, n0], [[j / sides, 0], [(j + 1) / sides, 0], [(j + 1) / sides, l], [j / sides, l]], v.map(q => kk(q[1])));
    }
  }
  get empty() { return this.idx.length === 0; }
  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2)); g.setAttribute('aKit', new THREE.Float32BufferAttribute(this.k, 4));
    g.setIndex(this.idx); return g;
  }
  mesh(mat) { const m = new THREE.Mesh(this.build(), mat); m.matrixAutoUpdate = false; return m; }
}

// --------------------------------------------------------------- materials --

const SNOW_E = 'vec3(0.30, 0.36, 0.52) * 0.5';        // what snow gives back of the night, as everywhere else here
// Teach a standard material the kit's ways. `body`: GLSL run after the maps are read, with c (the colour so far),
// nA, nB (noise at two scales), vKit, vKitW (world position), vKitN (world normal) to hand; it may change c, rough,
// and glow (a multiplier on what the material gives off).
export function kitLook(mat, name, body) {
  const u = { uKitN: { value: kitNoise() } };
  mat.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, u);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec4 aKit;\nvarying vec4 vKit;\nvarying vec3 vKitW;\nvarying vec3 vKitN;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvKit = aKit;\nvKitW = (modelMatrix * vec4(transformed, 1.0)).xyz;\nvKitN = normalize(mat3(modelMatrix) * objectNormal);');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform sampler2D uKitN;\nvarying vec4 vKit;\nvarying vec3 vKitW;\nvarying vec3 vKitN;')
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        {
          vec3 kn = normalize(vKitN);
          vec2 kq = abs(kn.y) > 0.6 ? vKitW.xz : vec2(vKitW.x + vKitW.z, vKitW.y);
          vec4 nA = texture2D(uKitN, kq * 0.21 + vKit.x * 3.7), nB = texture2D(uKitN, kq * 2.3 + vKit.x);
          vec3 was = max(diffuseColor.rgb, vec3(0.001)), c = was;
          float rough = roughnessFactor, snow = 0.0;
          ${body}
          totalEmissiveRadiance = mix(totalEmissiveRadiance * (c / was), ${SNOW_E}, snow);
          diffuseColor.rgb = mix(c, vec3(0.86, 0.9, 0.97) * (0.92 + 0.14 * nB.r), snow);
          roughnessFactor = mix(rough, 0.92, snow);
        }`);
  };
  mat.customProgramCacheKey = () => 'kitlook-' + name; mat.userData.kit = name;
  return mat;
}

// The set for one lot of kit. Made once and shared (museum.js draws the kit in two lots).
let MATS = null;
export function kitMaterials() {
  if (MATS) return MATS;
  const ply = plySheet(), D = THREE.DoubleSide, std = o => new THREE.MeshStandardMaterial(o);
  const M = {};
  // the riding sheet: scuffed with rubber down the middle, each sheet its own shade; outdoors weathered, with snow lying
  // wherever the wheels have not been and along the edges
  M.ply = kitLook(std({ map: ply, roughness: 0.62, emissiveMap: ply, emissive: 0x9a8a74, emissiveIntensity: 0.4, side: D }), 'ply', `
    float lane = 1.0 - vKit.z * vKit.z;
    float rub = texture2D(uKitN, vec2(vMapUv.x * 5.0, vMapUv.y * 0.33) + vKit.x * 5.0).b;
    float scuff = smoothstep(0.5, 0.82, rub + lane * 0.16 - 0.08);
    c *= 0.88 + 0.24 * nA.r; c *= 1.0 + (fract(vKit.x * 13.7) - 0.5) * 0.12;
    c = mix(c, c * vec3(0.3, 0.29, 0.3), scuff * 0.7);
    c = mix(c, dot(c, vec3(0.33)) * vec3(0.8, 0.84, 0.9), vKit.y * 0.55);                 // out in the weather: silvered
    rough = mix(rough, 0.4, scuff * 0.6);
    snow = vKit.y * smoothstep(0.5, 0.9, kn.y) * smoothstep(0.5, 0.78, nA.r * 0.6 + nB.b * 0.22 + nB.g * 0.12 + vKit.z * vKit.z * 0.34 - scuff * 0.3) * (0.75 + 0.25 * nB.g);
    float up = vKit.w; snow *= 0.3 + 0.7 * (1.0 - smoothstep(0.2, 0.7, up));       // less of it lies high on a steep ramp
  `);
  // side panels, studs and plates. aKit.z is a shade (the dark inside of an open frame is the same sheet at a fifth);
  // aKit.w is how far up from the floor: grime at the foot, snow banked against it outdoors
  M.frame = kitLook(std({ map: ply, roughness: 0.72, emissiveMap: ply, emissive: 0x9a8a74, emissiveIntensity: 0.42, side: D }), 'frame', `
    c *= vKit.z * (0.86 + 0.26 * nA.r) * (1.0 + (fract(vKit.x * 7.3) - 0.5) * 0.14);
    c = mix(c, dot(c, vec3(0.33)) * vec3(0.78, 0.82, 0.9), vKit.y * 0.5);
    float foot = 1.0 - smoothstep(0.0, 0.22, vKit.w);
    c *= 1.0 - 0.38 * foot * foot;
    snow = vKit.y * max(1.0 - smoothstep(0.0, 0.13 * nA.g + 0.05, vKit.w - nB.r * 0.04), smoothstep(0.6, 0.9, kn.y) * smoothstep(0.45, 0.7, nA.r));
  `);
  // steel: the angle down a ramp's edges, coping, threshold plates, scaffold tube. aKit.z: 0 galvanised, 1 safety
  // yellow paint (the edge of a deck that is somewhere to land), 2 black (rubber, a painted frame)
  M.steel = kitLook(std({ color: 0xa3acb5, roughness: 0.38, metalness: 0.7, emissive: 0x3a424c, emissiveIntensity: 0.75, side: D, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 }), 'steel', `
    float brush = texture2D(uKitN, vec2(vKitW.x + vKitW.z, vKitW.y) * vec2(0.6, 14.0)).g;
    c *= 0.82 + 0.3 * brush + 0.12 * (nA.r - 0.5);
    float paint = step(0.5, vKit.z) * (1.0 - step(1.5, vKit.z)), black = step(1.5, vKit.z);
    c = mix(c, vec3(0.95, 0.66, 0.08) * (0.75 + 0.3 * nB.g) * mix(1.0, 0.45, smoothstep(0.62, 0.8, nB.b)), paint);
    c = mix(c, vec3(0.03, 0.03, 0.035), black);
    rough = mix(rough, 0.7, max(paint, black));
    snow = vKit.y * smoothstep(0.7, 0.95, kn.y) * smoothstep(0.5, 0.7, nA.r + nB.g * 0.2) * (1.0 - black);
  `);
  M.steel.userData.metal = 1;
  MATS = M;
  // painted chevrons and stencils: flat paint, worn. (Basic: they are meant to read in the dark, as the neon ones did.)
  const worn = (m, name, k) => { const u = { uKitN: { value: kitNoise() } }; m.onBeforeCompile = sh => { Object.assign(sh.uniforms, u);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vKitW;').replace('#include <project_vertex>', '#include <project_vertex>\nvKitW = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform sampler2D uKitN;\nvarying vec3 vKitW;')
      .replace('#include <map_fragment>', `#include <map_fragment>\n{ vec4 w = texture2D(uKitN, (vKitW.xz + vKitW.y) * 1.7); diffuseColor.a *= ${k}; diffuseColor.a *= 0.55 + 0.45 * smoothstep(0.25, 0.6, w.b + w.g * 0.5); diffuseColor.rgb *= 0.8 + 0.3 * w.r; }`); };
    m.customProgramCacheKey = () => 'kitworn-' + name; return m; };
  M.arrows = tex => worn(new THREE.MeshBasicMaterial({ map: tex, alphaMap: tex, color: new THREE.Color(0.66, 0.64, 0.55), transparent: true, depthWrite: false, side: D, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }), 'arrows', '0.92');
  M.stencil = worn(new THREE.MeshBasicMaterial({ map: stencilSheet(), color: new THREE.Color(0.05, 0.07, 0.12), transparent: true, depthWrite: false, side: D, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }), 'stencil', '0.8');
  return M;
}

// ------------------------------------------------------------------- plywood --

const hash1 = (a, b) => { const s = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return s - Math.floor(s); };
const outdoors = (plan, s) => !roomAt(plan, (s.x0 + s.x1) / 2, (s.z0 + s.z1) / 2, Math.min(s.h0, s.h1) + 0.05) && !roomAt(plan, (s.x0 + s.x1) / 2, (s.z0 + s.z1) / 2, (s.base || 0) + 0.05);

// Is the end of piece s at world coordinate `e` along its run (the side facing `dir`) shut in by another piece or a wall?
function shut(plan, s, run, e, dir, h, base) {
  const a0 = run === 'x' ? s.z0 : s.x0, a1 = run === 'x' ? s.z1 : s.x1;
  for (const q of plan.surfaces) {
    if (q === s || q.hill) continue;
    const near = run === 'x' ? (dir > 0 ? q.x0 : q.x1) : (dir > 0 ? q.z0 : q.z1), far = run === 'x' ? (dir > 0 ? q.x1 : q.x0) : (dir > 0 ? q.z1 : q.z0);
    if (Math.abs(near - e) > 0.04 || (far - e) * dir < 0.05) continue;
    const b0 = run === 'x' ? q.z0 : q.x0, b1 = run === 'x' ? q.z1 : q.x1;
    if (Math.min(a1, b1) - Math.max(a0, b0) < (a1 - a0) * 0.6) continue;
    if (Math.max(q.h0, q.h1) >= h - 0.06 && (q.thick ? Math.max(q.h0, q.h1) - q.thick : q.base || 0) <= base + 0.12) return true;
  }
  const r = roomAt(plan, (s.x0 + s.x1) / 2, (s.z0 + s.z1) / 2, base + 0.05);
  if (r) { const w = run === 'x' ? (dir > 0 ? r.x1 : r.x0) : (dir > 0 ? r.z1 : r.z0); if (Math.abs(w - e) < 0.12) return true; }
  return false;
}

// Every plywood piece in `list`, into G = { top, frame, steel, arrows (a Geo of museum.js's), stencil }.
export function plyPieces(plan, list, G) {
  for (const s of list) {
    const run = s.axis || s.run || (s.x1 - s.x0 >= s.z1 - s.z0 ? 'x' : 'z'), X = run === 'x';
    const L = X ? s.x1 - s.x0 : s.z1 - s.z0, Wd = X ? s.z1 - s.z0 : s.x1 - s.x0, o0 = X ? s.x0 : s.z0, c0 = X ? s.z0 : s.x0;
    const P = (u, y, v) => (X ? [o0 + u, y, c0 + v] : [c0 + v, y, o0 + u]);          // along, up, across -> the world
    const Nw = (nu, ny, nv) => (X ? [nu, ny, nv] : [nv, ny, nu]);
    const hAt = u => heightOf(s, X ? o0 + u : (s.x0 + s.x1) / 2, X ? (s.z0 + s.z1) / 2 : o0 + u);
    const baseAt = h => (s.onTop != null ? s.onTop : s.thick ? h - s.thick : s.base || 0);
    const seed = hash1(s.x0 + s.h0, s.z0 + s.h1), out = outdoors(plan, s) ? 1 : 0, floor0 = s.onTop != null ? s.onTop : s.base || 0;
    const n = s.curve ? 18 : s.ease ? 16 : 1;
    const U = [], Hh = [], Nn = [], Arc = [];
    for (let i = 0; i <= n; i++) {
      const u = L * i / n, e = Math.min(0.02, L / 50), h = hAt(u), sl = s.axis ? (hAt(Math.min(L, u + e)) - hAt(Math.max(0, u - e))) / (Math.min(L, u + e) - Math.max(0, u - e)) : 0, l = Math.hypot(sl, 1);
      U.push(u); Hh.push(h); Nn.push(Nw(-sl / l, 1 / l, 0)); Arc.push(i ? Arc[i - 1] + Math.hypot(u - U[i - 1], h - Hh[i - 1]) : 0);
    }
    const rise = Math.abs(Hh[n] - Hh[0]), so = hash1(seed, 3) * 4, hiEnd = Hh[n] >= Hh[0] ? n : 0, loEnd = n - hiEnd;
    const kTop = (v, i) => [seed, out, v, s.axis ? (Hh[i] - Math.min(Hh[0], Hh[n])) / Math.max(0.3, rise) * Math.min(1, rise / Math.max(0.1, L)) * 1.4 : 0];
    for (let i = 0; i < n; i++) {
      // the sheet
      G.top.quad([P(U[i], Hh[i], 0), P(U[i + 1], Hh[i + 1], 0), P(U[i + 1], Hh[i + 1], Wd), P(U[i], Hh[i], Wd)], [Nn[i], Nn[i + 1], Nn[i + 1], Nn[i]],
        [[so, Arc[i] / 2.44 + so], [so, Arc[i + 1] / 2.44 + so], [so + Wd / 1.22, Arc[i + 1] / 2.44 + so], [so + Wd / 1.22, Arc[i] / 2.44 + so]], [kTop(-1, i), kTop(-1, i + 1), kTop(1, i + 1), kTop(1, i)]);
      const b0 = baseAt(Hh[i]), b1 = baseAt(Hh[i + 1]);
      if (s.thick && s.onTop == null) G.frame.quad([P(U[i], b0, 0), P(U[i + 1], b1, 0), P(U[i + 1], b1, Wd), P(U[i], b0, Wd)], Nw(0, -1, 0), [[0, U[i] / 2.44], [0, U[i + 1] / 2.44], [Wd / 1.22, U[i + 1] / 2.44], [Wd / 1.22, U[i] / 2.44]], [seed, out, 0.5, 2]);
      // the side panels, cut to the profile
      if (Hh[i] - b0 > 0.011 || Hh[i + 1] - b1 > 0.011) for (const [v, nv] of [[0, -1], [Wd, 1]])
        G.frame.quad([P(U[i], b0, v), P(U[i + 1], b1, v), P(U[i + 1], Hh[i + 1], v), P(U[i], Hh[i], v)], Nw(0, 0, nv),
          [[(b0 - floor0) / 1.22, (U[i] + so) / 2.44], [(b1 - floor0) / 1.22, (U[i + 1] + so) / 2.44], [(Hh[i + 1] - floor0) / 1.22, (U[i + 1] + so) / 2.44], [(Hh[i] - floor0) / 1.22, (U[i] + so) / 2.44]],
          [[seed, out, 0.92, b0 - floor0], [seed, out, 0.92, b1 - floor0], [seed, out, 0.92, Hh[i + 1] - floor0], [seed, out, 0.92, Hh[i] - floor0]]);
      // steel angle down both edges (yellow paint on a deck that is somewhere to land): a leg on the face, a leg on top
      const kS = [seed, out, s.perch ? 1 : 0, 0];
      for (const [v, nv] of [[0, -1], [Wd, 1]]) {
        G.steel.quad([P(U[i], Hh[i] - 0.034, v + nv * 0.004), P(U[i + 1], Hh[i + 1] - 0.034, v + nv * 0.004), P(U[i + 1], Hh[i + 1] + 0.004, v + nv * 0.004), P(U[i], Hh[i] + 0.004, v + nv * 0.004)], Nw(0, 0, nv), null, kS);
        G.steel.quad([P(U[i], Hh[i] + 0.004, v + nv * 0.004), P(U[i + 1], Hh[i + 1] + 0.004, v + nv * 0.004), P(U[i + 1], Hh[i + 1] + 0.004, v - nv * 0.03), P(U[i], Hh[i] + 0.004, v - nv * 0.03)], [Nn[i], Nn[i + 1], Nn[i + 1], Nn[i]], null, kS);
      }
      // chevrons painted up anything that slopes
      if (s.axis && G.arrows) {
        const up = hiEnd === n, e = 0.012, m = Wd * 0.18, a0 = (o0 + U[i]) / 0.55, a1 = (o0 + U[i + 1]) / 0.55, q = (u, h, v, nn) => { const p = P(u, h, v); return [p[0] + nn[0] * e, p[1] + nn[1] * e, p[2] + nn[2] * e]; };
        const c = [q(U[i], Hh[i], m, Nn[i]), q(U[i + 1], Hh[i + 1], m, Nn[i + 1]), q(U[i + 1], Hh[i + 1], Wd - m, Nn[i + 1]), q(U[i], Hh[i], Wd - m, Nn[i])];
        G.arrows.quad(c[0], c[1], c[2], c[3], [0, 1, 0], up ? [[0, a0], [0, a1], [1, a1], [1, a0]] : [[0, -a0], [0, -a1], [1, -a1], [1, -a0]]);
      }
    }
    // the ends: a plain panel, or, where a ramp's high end stands open, the frame it is built on
    for (const i of [0, n]) {
      const h = Hh[i], b = baseAt(h), dir = i === n ? 1 : -1, u = U[i];
      if (h - b < 0.011) continue;
      const open = s.axis && i === hiEnd && h - b > 0.3 && !s.thick && !shut(plan, s, run, o0 + u, dir, h, b);
      const kF = y => [seed, out, 0.92, y - floor0];
      if (!open) { G.frame.quad([P(u, b, 0), P(u, b, Wd), P(u, h, Wd), P(u, h, 0)], Nw(dir, 0, 0), [[(b - floor0) / 1.22, 0], [(b - floor0) / 1.22, Wd / 2.44], [(h - floor0) / 1.22, Wd / 2.44], [(h - floor0) / 1.22, 0]], [kF(b), kF(b), kF(h), kF(h)]); continue; }
      const kD = [seed, out, 0.16, 2], kB = [seed, out, 1.05, 0, floor0], in0 = u - dir * 0.06, bx = (u0, u1, y0, y1, v0, v1, k = kB) => { const a = P(Math.min(u0, u1), y0, v0), c = P(Math.max(u0, u1), y1, v1); G.frame.box(Math.min(a[0], c[0]), Math.max(a[0], c[0]), y0, y1, Math.min(a[2], c[2]), Math.max(a[2], c[2]), k); };
      G.frame.quad([P(in0, b, 0.02), P(in0, b, Wd - 0.02), P(in0, h - 0.02, Wd - 0.02), P(in0, h - 0.02, 0.02)], Nw(dir, 0, 0), [[0, 0], [0, Wd / 2.44], [h / 1.22, Wd / 2.44], [h / 1.22, 0]], kD);      // the dark inside
      bx(u - dir * 0.05, u, h - 0.062, h - 0.02, 0, Wd); bx(u - dir * 0.05, u, b, b + 0.04, 0, Wd);                    // top and bottom plates
      const bays = Math.max(1, Math.round(Wd / 0.61));
      for (let j = 0; j <= bays; j++) { const v = j === 0 ? 0.019 : j === bays ? Wd - 0.019 : Wd * j / bays; bx(u - dir * 0.09, u - dir * 0.001, b + 0.04, h - 0.062, v - 0.019, v + 0.019); }      // studs
      if (h - b > 0.55 && Wd > 1) {      // a brace let in across the back
        const v0 = 0.06, v1 = Wd - 0.06, y0 = b + 0.07, y1 = h - 0.09, len = Math.hypot(v1 - v0, y1 - y0), wv = 0.035 * (y1 - y0) / len, wy = 0.035 * (v1 - v0) / len, ub = u - dir * 0.035;
        G.frame.quad([P(ub, y0 - wy, v0 + wv), P(ub, y1 - wy, v1 + wv), P(ub, y1 + wy, v1 - wv), P(ub, y0 + wy, v0 - wv)], Nw(dir, 0, 0), [[0.3, 0], [0.3, len / 2.44], [0.36, len / 2.44], [0.36, 0]], [[seed, out, 1, y0 - floor0], [seed, out, 1, y1 - floor0], [seed, out, 1, y1 - floor0], [seed, out, 1, y0 - floor0]]);
      }
    }
    // a steel threshold where a ramp meets the floor, and a round coping on the lip of a skate ramp
    if (s.axis && Hh[loEnd] - baseAt(Hh[loEnd]) < 0.03 && !s.thick) {
      const d = loEnd === 0 ? 1 : -1, u0 = U[loEnd], u1 = u0 + d * 0.13, h1 = hAt(u1), kS = [seed, out, 0, 0];
      G.steel.quad([P(u0, Hh[loEnd] + 0.005, 0.03), P(u1, h1 + 0.005, 0.03), P(u1, h1 + 0.005, Wd - 0.03), P(u0, Hh[loEnd] + 0.005, Wd - 0.03)], Nn[loEnd], null, kS);
    }
    if (s.curve) { const r = 0.027, u = U[hiEnd], h = Hh[hiEnd] - r + 0.002; G.steel.tube(P(u, h, 0), P(u, h, Wd), r, [seed, out, 0, 0], 10); }
    // a stencil on one side panel of a piece big enough to carry it
    if (G.stencil && L > 1.2 && Math.max(Hh[0], Hh[n]) - floor0 > 0.34 && !s.thick && !s.hang && hash1(seed, 9) < 0.75) {
      const side = hash1(seed, 5) < 0.5 ? 0 : 1, v = side ? Wd + 0.006 : -0.006, nv = side ? 1 : -1, row = Math.floor(hash1(seed, 7) * 8) % 8;
      const hh = Math.min(0.09, (Math.max(Hh[0], Hh[n]) - floor0) * 0.2), w = hh * 7, uc = hiEnd === n ? L - 0.16 - w / 2 : 0.16 + w / 2, hc = floor0 + (Math.min(hAt(uc - w / 2), hAt(uc + w / 2)) - floor0) * 0.5;
      // text reads left to right for someone facing the panel: their right is up x outward
      const nw = Nw(0, 0, nv), rx = nw[2], rz = -nw[0], c = P(uc, hc, v), v0 = 1 - (row + 1) / 8, v1 = 1 - row / 8;
      if (Math.min(hAt(uc - w / 2), hAt(uc + w / 2)) - floor0 > hh * 2.4) G.stencil.quad([c[0] - rx * w / 2, hc - hh / 2, c[2] - rz * w / 2], [c[0] + rx * w / 2, hc - hh / 2, c[2] + rz * w / 2], [c[0] + rx * w / 2, hc + hh / 2, c[2] + rz * w / 2], [c[0] - rx * w / 2, hc + hh / 2, c[2] - rz * w / 2], nw, [[0, v0], [1, v0], [1, v1], [0, v1]]);
    }
    // the builders' scaffold: standards on base plates, a ledger under each edge of the boards, a brace in every bay
    if (s.posts) {
      const count = Math.max(2, Math.round(L / 2.2) + 1), kS = [seed, out, 0, 0];
      for (const v of [0.04, Wd - 0.04]) {
        let prev = null;
        for (let i = 0; i < count; i++) {
          const u = L * i / (count - 1), y = hAt(Math.min(L, Math.max(0, u))) - (s.thick || 0), uu = Math.min(L - 0.04, Math.max(0.04, u));
          if (y > 0.3) {
            G.steel.tube(P(uu, 0, v), P(uu, y, v), 0.024, kS, 8);
            const a = P(uu - 0.075, 0, v - 0.075), c = P(uu + 0.075, 0.012, v + 0.075); G.steel.box(Math.min(a[0], c[0]), Math.max(a[0], c[0]), 0, 0.012, Math.min(a[2], c[2]), Math.max(a[2], c[2]), kS);
            if (prev) { G.steel.tube(P(prev[0], prev[1] - 0.05, v), P(uu, y - 0.05, v), 0.02, kS, 6); if (y > 1.2 && prev[1] > 1.2) G.steel.tube(P(prev[0], Math.max(0.25, prev[1] - 2.6), v), P(uu, y - 0.3, v), 0.016, kS, 6); }
            prev = [uu, y];
          } else prev = null;
        }
      }
    }
  }
}

// ---------------------------------------------------------------------- snow --

// Snow features: every piece in `list` (plan surfaces with skin 'snow', not hills) as one geometry.
// Position, normal, uv (the snow texture, 5 m to the tile) and aKit: x how far down the side (0 the riding surface,
// 1 the foot), y metres across the run (for the corduroy), z metres back from a take-off lip (9: none), w the height.
export function snowGeometry(list) {
  const P = [], N = [], UV = [], K = [], I = [];
  const sm = t => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
  const wob = (x, z) => 0.5 + 0.5 * Math.sin(x * 2.3 + Math.sin(z * 1.7) * 1.3) * Math.cos(z * 2.9 + Math.sin(x * 1.3));
  for (const s of list) {
    const run = s.axis || (s.x1 - s.x0 >= s.z1 - s.z0 ? 'x' : 'z'), X = run === 'x';
    const L = X ? s.x1 - s.x0 : s.z1 - s.z0, Wd = X ? s.z1 - s.z0 : s.x1 - s.x0, o0 = X ? s.x0 : s.z0, c0 = X ? s.z0 : s.x0, base = s.base || 0;
    const hW = (u, v) => heightOf(s, X ? o0 + u : c0 + v, X ? c0 + v : o0 + u) - base;
    const hMax = Math.max(s.h0, s.h1) - base, f = 0.2 + 0.16 * hMax;
    // which edges stand open: not one another piece of snow comes up against, as high
    const open = (alongRun, at, dir) => {
      const e = alongRun ? o0 + at : c0 + at, a0 = alongRun ? c0 : o0, a1 = alongRun ? c0 + Wd : o0 + L, mid = (a0 + a1) / 2;
      const hHere = alongRun ? hW(at, Wd / 2) : hW(L / 2, at);
      for (const q of list) {
        if (q === s) continue;
        const ax = alongRun === X;      // true: the edge is a line of constant x
        const near = ax ? (dir > 0 ? q.x0 : q.x1) : (dir > 0 ? q.z0 : q.z1), b0 = ax ? q.z0 : q.x0, b1 = ax ? q.z1 : q.x1;
        if (Math.abs(near - e) > 0.04 || Math.min(a1, b1) - Math.max(a0, b0) < (a1 - a0) * 0.9) continue;
        const hq = heightOf(q, ax ? near + dir * 0.01 : mid, ax ? mid : near + dir * 0.01) - (q.base || 0);
        if (hq > hHere - 0.12) return false;
      }
      return true;
    };
    const E = { u0: open(true, 0, -1), u1: open(true, L, 1), v0: open(false, 0, -1), v1: open(false, Wd, 1) };
    const rings = [1, 0.62, 0.32, 0.12], bev = 0.1;
    const axisPts = (len, e0, e1, cell) => {
      const a = []; if (e0) for (const r of rings) a.push(-r * f);
      const nn = Math.max(2, Math.ceil(len / cell)); for (let i = 0; i <= nn; i++) { a.push(len * i / nn); if (i === 0 && e0 && len > 0.5) a.push(bev); if (i === nn - 1 && e1 && len > 0.5) a.push(len - bev); }
      if (e1) for (const r of rings.slice().reverse()) a.push(len + r * f);
      return a.sort((p, q) => p - q).filter((p, i, arr) => !i || p - arr[i - 1] > 1e-4);
    };
    const us = axisPts(L, E.u0, E.u1, s.curve || s.ease ? 0.22 : 0.45), vs = axisPts(Wd, E.v0, E.v1, 0.6), nu = us.length, nv = vs.length, base0 = P.length / 3;
    // take-offs, to be marked with a dyed line: a ramp's high end where it stands open, and the open edge of a flat
    // that carries on from a ramp
    const lips = [];
    if (hMax > 0.6 && !s.curve) {
      if (s.axis) { if (s.h1 > s.h0 ? E.u1 : E.u0) lips.push(s.h1 > s.h0 ? 'u1' : 'u0'); }
      else for (const [a, b] of [['u0', 'u1'], ['u1', 'u0'], ['v0', 'v1'], ['v1', 'v0']]) if (E[a] && !E[b] && !list.some(q => q.curve && q !== s && Math.abs(Math.max(q.h0, q.h1) - s.h0) < 0.05 && q.x1 > s.x0 - 0.05 && q.x0 < s.x1 + 0.05 && q.z1 > s.z0 - 0.05 && q.z0 < s.z1 + 0.05)) lips.push(a);
    }
    const Y = new Float32Array(nu * nv);
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
      const u = us[i], v = vs[j], uc = Math.max(0, Math.min(L, u)), vc = Math.max(0, Math.min(Wd, v)), d = Math.hypot(u - uc, v - vc);
      const x = X ? o0 + u : c0 + v, z = X ? c0 + v : o0 + u, he = hW(uc, vc);
      let y, side = 0;
      if (d > 1e-6) {
        const fl = (0.2 + 0.16 * he) * (0.6 + 0.8 * wob(x, z)), p = Math.max(0, 1 - d / fl);
        side = 1 - p * p * 0.999; y = he < 0.02 ? -0.02 : -0.02 + (he - 0.03 + 0.02) * p * p + (0.03 + 0.05 * he) * (0.5 + 0.5 * Math.sin(x * 4.1 + z * 2.7 + Math.sin(x * 1.9 - z * 2.3) * 2)) * p * (1 - p) * 2;
      } else {
        // the shoulder: eased over towards an open edge
        let e = 9; if (E.u0) e = Math.min(e, u); if (E.u1) e = Math.min(e, L - u); if (E.v0) e = Math.min(e, v); if (E.v1) e = Math.min(e, Wd - v);
        const drop = 0.03 * (1 - sm(e / bev)); y = he - Math.min(drop, he); side = (1 - sm(e / bev)) * 0.12;
        if (he < 0.006) y = -0.02;      // a toe at the ground: tucked under it, as the hills' are (no two skins at one level)
      }
      Y[j * nu + i] = y;
      P.push(x, base + y + (y > 0 ? 0.004 : 0), z); UV.push((x + y * 0.8) / 5, (z + y * 0.8) / 5);      // (the texture taken down the sides with the height, not smeared)
      let lipD = 9; if (d <= 1e-6) for (const e of lips) lipD = Math.min(lipD, e === 'u0' ? u : e === 'u1' ? L - u : e === 'v0' ? v : Wd - v);
      K.push(side, X ? z : x, lipD, he);
    }
    // normals from the grid itself
    const pos = (i, j) => { const k = base0 + j * nu + i; return [P[k * 3], P[k * 3 + 1], P[k * 3 + 2]]; };
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
      const a = pos(Math.max(0, i - 1), j), b = pos(Math.min(nu - 1, i + 1), j), c = pos(i, Math.max(0, j - 1)), e = pos(i, Math.min(nv - 1, j + 1));
      const tx = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], tz = [e[0] - c[0], e[1] - c[1], e[2] - c[2]];
      let nx = tz[1] * tx[2] - tz[2] * tx[1], ny = tz[2] * tx[0] - tz[0] * tx[2], nz = tz[0] * tx[1] - tz[1] * tx[0]; if (ny < 0) { nx = -nx; ny = -ny; nz = -nz; }
      const l = Math.hypot(nx, ny, nz) || 1; N.push(nx / l, ny / l, nz / l);
    }
    for (let j = 0; j < nv - 1; j++) for (let i = 0; i < nu - 1; i++) {
      const a = base0 + j * nu + i, b = a + 1, c = a + nu, e = c + 1;
      if (Y[j * nu + i] <= -0.02 && Y[j * nu + i + 1] <= -0.02 && Y[(j + 1) * nu + i] <= -0.02 && Y[(j + 1) * nu + i + 1] <= -0.02) continue;
      // wound so that it faces up whichever way the piece runs
      if (X) I.push(a, c, b, b, c, e); else I.push(a, b, c, b, e, c);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); g.setAttribute('aKit', new THREE.Float32BufferAttribute(K, 4)); g.setIndex(I);
  return g;
}

// The snow features' material: the museum's snow (so look.js gives it the drifts and the moon, as all snow), groomed.
export function snowKitMaterial(snowTex, o = {}) {
  const m = new THREE.MeshStandardMaterial({ map: snowTex, roughness: 0.95, emissiveMap: snowTex, emissive: new THREE.Color(0.3, 0.36, 0.52), emissiveIntensity: 0.55, side: THREE.DoubleSide, ...o });
  const u = { uKitN: { value: kitNoise() } };
  m.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, u);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec4 aKit;\nvarying vec4 vKit;\nvarying vec3 vKitW;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvKit = aKit;\nvKitW = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform sampler2D uKitN;\nvarying vec4 vKit;\nvarying vec3 vKitW;')
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        {
          vec4 nA = texture2D(uKitN, vKitW.xz * 0.27), nB = texture2D(uKitN, vec2(vKitW.x + vKitW.z, vKitW.y * 2.0 + vKitW.z) * 1.3);
          vec3 was = max(diffuseColor.rgb, vec3(0.001)), c = was;
          float side = smoothstep(0.1, 0.45, vKit.x), top = 1.0 - side;
          // corduroy from the groomer, along the run; let go of before it would shimmer
          float px = fwidth(vKit.y) / 0.034, cord = (sin(vKit.y * 184.8) * 0.5 + 0.5) * top * (1.0 - smoothstep(0.22, 0.55, px));
          c *= 1.0 + 0.05 * top - 0.15 * cord;
          // packed hard where it is ridden: a little greyer, and it shines
          float pack = top * smoothstep(0.35, 0.7, nA.b);
          c = mix(c, c * vec3(0.84, 0.88, 0.95), pack * 0.6);
          // the dyed line across a take-off
          float lip = top * smoothstep(0.06, 0.075, vKit.z) * (1.0 - smoothstep(0.15, 0.165, vKit.z));
          c = mix(c, vec3(0.07, 0.3, 0.95) * (0.7 + 0.5 * nB.g), lip * (0.55 + 0.4 * nA.g));
          // the cut sides: shovel strata, shade deepening to the foot, a crust that catches a little light at the shoulder
          float strata = sin(vKitW.y * 42.0 + nB.r * 5.0 + nA.r * 4.0) * 0.5 + 0.5;
          c *= 1.0 - side * (0.2 + 0.12 * strata + 0.14 * smoothstep(0.3, 1.0, vKit.x)) + side * (nB.g - 0.5) * 0.14 + side * (nA.r - 0.5) * 0.2;
          c *= 1.0 + 0.1 * smoothstep(0.04, 0.12, vKit.x) * (1.0 - smoothstep(0.12, 0.3, vKit.x));
          totalEmissiveRadiance *= c / was; diffuseColor.rgb = c;
          roughnessFactor = mix(roughnessFactor, 0.4, pack * 0.7);
        }`);
  };
  m.customProgramCacheKey = () => 'kitsnow'; m.userData.kit = 'snow';
  return m;
}

// ---------------------------------------------------------------------- pool --

// The drained pool's tile (the map is museum.js's pool tile). aKit: y what it is (0 the bottom, 1 the bowl's walls,
// 2 the deck, 3 the outside), z across a deck (-1..1), w the height.
export function poolMaterial(tile, lip) {
  return kitLook(new THREE.MeshStandardMaterial({ map: tile, roughness: 0.3, emissiveMap: tile, emissive: 0x8fb4c8, emissiveIntensity: 0.16, side: THREE.DoubleSide }), 'pool', `
    c = mix(c, dot(c, vec3(0.3, 0.5, 0.2)) * vec3(0.78, 0.96, 1.0) * 1.25, 0.4);      // old tile, its colour gone a little
    float kind = vKit.y, y = vKit.w, lipY = ${lip.toFixed(3)};
    vec4 nC = texture2D(uKitN, vKitW.xz * 0.083 + 0.4);
    float bowl = 1.0 - step(1.5, kind), deck = step(1.5, kind) * (1.0 - step(2.5, kind)), outer = step(2.5, kind), bottom = 1.0 - step(0.5, kind);
    // the waterline: a band of dark tile, a tide mark under it, and scale and rust run down from that
    float band = bowl * (1.0 - bottom) * smoothstep(lipY - 0.36, lipY - 0.345, y) * (1.0 - smoothstep(lipY - 0.2, lipY - 0.185, y));
    c = mix(c, c * vec3(0.16, 0.26, 0.5), band);
    float run = texture2D(uKitN, vec2((vKitW.x + vKitW.z) * 1.4, y * 0.1)).b;
    float under = bowl * (1.0 - bottom) * (1.0 - smoothstep(lipY - 0.4, lipY - 0.36, y));
    c = mix(c, c * vec3(0.72, 0.66, 0.5), under * smoothstep(0.45, 0.8, run + (y / lipY) * 0.25) * 0.75);
    c *= 1.0 - under * 0.25 * smoothstep(lipY - 0.52, lipY - 0.38, y);
    // the bottom: dirt lying in drifts, dead leaves blown in, frost
    float dirt = bottom * smoothstep(0.45, 0.8, nA.b * 0.5 + nC.r * 0.6);
    c = mix(c, c * vec3(0.55, 0.52, 0.42), dirt * 0.6);
    float leaf = max(bottom, deck * 0.6) * smoothstep(0.82, 0.86, nB.a) * smoothstep(0.45, 0.65, nC.b * 0.6 + nA.r * 0.5);
    c = mix(c, mix(vec3(0.34, 0.17, 0.05), vec3(0.55, 0.36, 0.08), nB.r), leaf);
    // the deck: pale tile with a stone coping down each edge
    float lum = dot(c, vec3(0.3, 0.5, 0.2));
    c = mix(c, vec3(0.74, 0.76, 0.76) * (0.55 + lum * 0.9), deck * 0.88);
    float cope = deck * smoothstep(0.74, 0.76, abs(vKit.z));
    c = mix(c, vec3(0.66, 0.64, 0.6) * (0.82 + 0.3 * nB.g), cope);
    // outside: concrete with the marks of the boards it was cast against, darker at the foot
    float boards = 1.0 - 0.2 * smoothstep(0.42, 0.5, abs(fract(y / 0.21) - 0.5)) ;
    c = mix(c, vec3(0.66, 0.63, 0.57) * (0.72 + 0.4 * nA.r + 0.2 * (nB.g - 0.5)) * boards * (0.7 + 0.3 * smoothstep(0.0, 0.5, y)), outer);
    rough = mix(rough, 0.85, max(max(outer, deck * 0.6), max(dirt, leaf)));
    totalEmissiveRadiance = mix(totalEmissiveRadiance, was * 0.3, max(outer, deck * 0.8));      // (the tile's blue glow is the tile's, not the concrete's)
    snow = max(max(bottom * smoothstep(0.56, 0.74, nC.r * 0.55 + nA.r * 0.4 + nB.g * 0.12), deck * (1.0 - cope) * smoothstep(0.5, 0.7, nA.r * 0.7 + nC.b * 0.3 + nB.g * 0.12)), outer * (1.0 - smoothstep(0.0, 0.1 + 0.12 * nA.g, y)));
  `);
}

// The pool's pieces into G (a KGeo): the bowl's walls as one smooth sweep each, tile laid along the curve rather than
// squeezed by it, and every face told what it is (poolMaterial).
export function poolPieces(plan, list, G) {
  const o = plan.pool || { x0: -1e9, x1: 1e9, z0: -1e9, z1: 1e9 };
  const onEdge = (x, z) => Math.abs(x - o.x0) < 0.02 || Math.abs(x - o.x1) < 0.02 || Math.abs(z - o.z0) < 0.02 || Math.abs(z - o.z1) < 0.02;
  for (const s of list) {
    const run = s.axis || (s.x1 - s.x0 >= s.z1 - s.z0 ? 'x' : 'z'), X = run === 'x';
    const L = X ? s.x1 - s.x0 : s.z1 - s.z0, Wd = X ? s.z1 - s.z0 : s.x1 - s.x0, o0 = X ? s.x0 : s.z0, c0 = X ? s.z0 : s.x0, base = s.base || 0;
    const P = (u, y, v) => (X ? [o0 + u, y, c0 + v] : [c0 + v, y, o0 + u]), Nw = (nu, ny, nv) => (X ? [nu, ny, nv] : [nv, ny, nu]);
    const hAt = u => heightOf(s, X ? o0 + u : (s.x0 + s.x1) / 2, X ? (s.z0 + s.z1) / 2 : o0 + u);
    const kind = s.floor ? 0 : s.axis ? 1 : 2, n = s.curve ? 18 : 1, seed = hash1(s.x0, s.z0);
    const U = [], H = [], Nn = [], Arc = [];
    for (let i = 0; i <= n; i++) { const u = L * i / n, e = 0.02, h = hAt(u), sl = s.axis ? (hAt(Math.min(L, u + e)) - hAt(Math.max(0, u - e))) / (Math.min(L, u + e) - Math.max(0, u - e)) : 0, l = Math.hypot(sl, 1); U.push(u); H.push(h); Nn.push(Nw(-sl / l, 1 / l, 0)); Arc.push(i ? Arc[i - 1] + Math.hypot(u - U[i - 1], h - H[i - 1]) : 0); }
    for (let i = 0; i < n; i++) {
      const uv = s.axis ? [[c0, Arc[i]], [c0, Arc[i + 1]], [c0 + Wd, Arc[i + 1]], [c0 + Wd, Arc[i]]] : [P(U[i], 0, 0), P(U[i + 1], 0, 0), P(U[i + 1], 0, Wd), P(U[i], 0, Wd)].map(q => [q[0], q[2]]);
      G.quad([P(U[i], H[i], 0), P(U[i + 1], H[i + 1], 0), P(U[i + 1], H[i + 1], Wd), P(U[i], H[i], Wd)], [Nn[i], Nn[i + 1], Nn[i + 1], Nn[i]], uv, [[seed, kind, -1, H[i]], [seed, kind, -1, H[i + 1]], [seed, kind, 1, H[i + 1]], [seed, kind, 1, H[i]]]);
      if (H[i] - base > 0.011 || H[i + 1] - base > 0.011) for (const [v, nv] of [[0, -1], [Wd, 1]]) {
        const q = P((U[i] + U[i + 1]) / 2, 0, v), k = onEdge(q[0], q[2]) ? 3 : 1;
        G.quad([P(U[i], base, v), P(U[i + 1], base, v), P(U[i + 1], H[i + 1], v), P(U[i], H[i], v)], Nw(0, 0, nv), [[U[i], base], [U[i + 1], base], [U[i + 1], H[i + 1]], [U[i], H[i]]], [[seed, k, 0, base], [seed, k, 0, base], [seed, k, 0, H[i + 1]], [seed, k, 0, H[i]]]);
      }
    }
    for (const i of [0, n]) {
      const h = H[i]; if (h - base < 0.011) continue;
      const q = P(U[i], 0, Wd / 2), k = onEdge(q[0], q[2]) ? 3 : 1;
      G.quad([P(U[i], base, 0), P(U[i], base, Wd), P(U[i], h, Wd), P(U[i], h, 0)], Nw(i ? 1 : -1, 0, 0), [[0, base], [Wd, base], [Wd, h], [0, h]], [[seed, k, 0, base], [seed, k, 0, base], [seed, k, 0, h], [seed, k, 0, h]]);
    }
  }
}
